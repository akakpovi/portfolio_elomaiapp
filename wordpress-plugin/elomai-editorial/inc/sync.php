<?php
/**
 * Authenticated synchronisation: signing, transport, retries, status tracking
 * and propagation of unpublishing. Local WordPress is never reachable from the
 * internet; it is always the client.
 */

defined('ABSPATH') || exit;

// Retry spacing lives in the outbox (inc/outbox.php); this file only moves one
// document over the wire and reports exactly what the receiver answered.

function elomai_signing_payload($timestamp, $nonce, $body) {
    return $timestamp . '.' . $nonce . '.' . $body;
}

/** Refuses plain HTTP unless the owner explicitly allowed a local endpoint. */
function elomai_endpoint_is_acceptable($endpoint) {
    $parts = wp_parse_url($endpoint);
    if (empty($parts['scheme']) || empty($parts['host'])) {
        return false;
    }
    if ($parts['scheme'] === 'https') {
        return true;
    }
    if ($parts['scheme'] !== 'http') {
        return false;
    }
    if (!elomai_insecure_endpoint_allowed()) {
        return false;
    }
    // Local tests only: loopback, private ranges and single-label Docker
    // service names, which are resolvable exclusively inside a Docker network.
    return in_array($parts['host'], ['localhost', '127.0.0.1', 'host.docker.internal'], true)
        || (bool) preg_match('/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/', $parts['host'])
        || (bool) preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i', $parts['host']);
}

/**
 * Sends one JSON document to the receiver.
 *
 * @return array{ok: bool, http: int, body: array, error: string}
 */
function elomai_send($payload) {
    return elomai_send_to(elomai_endpoint(), $payload);
}

/**
 * Same transport, signing and endpoint rules for any receiver channel.
 *
 * A non-empty `$scope` derives a channel-specific key from the one configured
 * secret (HMAC-SHA256 with the scope as message), so the comment channel and
 * the article channel never share a usable credential.
 *
 * @return array{ok: bool, http: int, body: array, error: string}
 */
function elomai_send_to($endpoint, $payload, $scope = '') {
    $secret = elomai_sync_secret();

    if ($secret === '') {
        return ['ok' => false, 'http' => 0, 'body' => [], 'error' => 'Kein Sync-Geheimnis konfiguriert.'];
    }
    if ($scope !== '') {
        $secret = hash_hmac('sha256', (string) $scope, $secret);
    }
    if (!elomai_endpoint_is_acceptable($endpoint)) {
        return ['ok' => false, 'http' => 0, 'body' => [], 'error' => 'Endpunkt abgelehnt (HTTPS erforderlich): ' . $endpoint];
    }

    $body = wp_json_encode($payload);
    if (!$body) {
        return ['ok' => false, 'http' => 0, 'body' => [], 'error' => 'Payload konnte nicht serialisiert werden.'];
    }

    $timestamp = time();
    $nonce = bin2hex(random_bytes(16));
    $signature = hash_hmac('sha256', elomai_signing_payload($timestamp, $nonce, $body), $secret);

    $response = wp_remote_post($endpoint, [
        'timeout' => 45,
        'redirection' => 0,
        'sslverify' => true,
        'blocking' => true,
        'headers' => [
            'Content-Type' => 'application/json',
            'X-Elomai-Timestamp' => (string) $timestamp,
            'X-Elomai-Nonce' => $nonce,
            'X-Elomai-Signature' => $signature,
            'User-Agent' => 'elomai-editorial/' . ELOMAI_VERSION,
        ],
        'body' => $body,
    ]);

    if (is_wp_error($response)) {
        return ['ok' => false, 'http' => 0, 'body' => [], 'error' => $response->get_error_message()];
    }

    $http = (int) wp_remote_retrieve_response_code($response);
    $decoded = json_decode((string) wp_remote_retrieve_body($response), true);
    $decoded = is_array($decoded) ? $decoded : [];
    $ok = $http === 200 && !empty($decoded['ok']);

    $error = '';
    if (!$ok) {
        if (!empty($decoded['errors']) && is_array($decoded['errors'])) {
            $error = 'Validierung: ' . implode('; ', array_map('sanitize_text_field', $decoded['errors']));
        } elseif (!empty($decoded['error'])) {
            $error = sanitize_text_field($decoded['error']);
        } else {
            $error = 'HTTP ' . $http;
        }
    }

    return ['ok' => $ok, 'http' => $http, 'body' => $decoded, 'error' => $error];
}

/** HEAD check so "synced" always means "publicly reachable". */
function elomai_confirm_public($url) {
    if (!$url) {
        return false;
    }
    for ($attempt = 1; $attempt <= 2; $attempt++) {
        $response = wp_remote_head($url, ['timeout' => 12, 'redirection' => 3, 'sslverify' => true]);
        if (!is_wp_error($response) && (int) wp_remote_retrieve_response_code($response) === 200) {
            return true;
        }
        sleep(1);
    }
    return false;
}

/**
 * Synchronises one post (create or update).
 *
 * @return array{status: string, message: string, url?: string, http?: int, code?: string, version?: int}
 */
function elomai_sync_post($post_id, $forced = false) {
    $post_id = (int) $post_id;
    $lock_key = 'elomai_lock_' . $post_id;
    if (get_transient($lock_key)) {
        return ['status' => 'busy', 'message' => 'Synchronisierung läuft bereits.'];
    }
    set_transient($lock_key, 1, 90);

    try {
        $built = elomai_build_payload($post_id);
        if (is_wp_error($built)) {
            elomai_set_sync_state($post_id, [
                'status' => 'failed',
                'last_error' => $built->get_error_message(),
                'last_attempt' => current_time('mysql', true),
            ]);
            elomai_log('validation_failed', $built->get_error_message(), $post_id);
            return ['status' => 'failed', 'message' => $built->get_error_message()];
        }

        $article = $built['article'];
        $hash = $built['hash'];
        $state = elomai_sync_state($post_id);

        if (!$forced && ($state['last_hash'] ?? '') === $hash && ($state['status'] ?? '') === 'synced') {
            return ['status' => 'unchanged', 'message' => 'Inhalt unverändert, bereits synchronisiert.'];
        }

        $version = (int) get_post_meta($post_id, '_elomai_version', true);
        if (($state['pending_hash'] ?? '') !== $hash) {
            $version = max($version, (int) ($state['version'] ?? 0)) + 1;
            update_post_meta($post_id, '_elomai_version', $version);
        }
        if ($version < 1) {
            $version = 1;
            update_post_meta($post_id, '_elomai_version', $version);
        }

        $article['version'] = $version;
        $idempotency = $article['uuid'] . ':v' . $version . ':upsert';

        $result = elomai_send([
            'idempotencyKey' => $idempotency,
            'operation' => 'upsert',
            'article' => $article,
        ]);

        $attempts = (int) ($state['attempts'] ?? 0) + 1;

        if (!$result['ok']) {
            $code = (string) ($result['body']['error'] ?? '');
            $retryable = $result['http'] === 0 || $result['http'] === 429 || $result['http'] >= 500;
            elomai_set_sync_state($post_id, [
                'status' => $retryable ? 'pending' : 'failed',
                'attempts' => $attempts,
                'version' => $version,
                'pending_hash' => $hash,
                'last_error' => $result['error'],
                'last_attempt' => current_time('mysql', true),
                'http' => $result['http'],
                'error_code' => $code,
            ]);
            elomai_log(
                'sync_failed',
                $result['error'],
                $post_id,
                ['http' => $result['http'], 'version' => $version, 'code' => $code]
            );
            return [
                'status' => 'failed',
                'message' => $result['error'],
                'http' => (int) $result['http'],
                'code' => $code,
                'version' => $version,
            ];
        }

        // "Synchronised" means the receiver acknowledged the version we sent,
        // not merely that it answered 200.
        $acked = (int) ($result['body']['version'] ?? 0);
        if ($acked !== $version) {
            $message = sprintf('Empfänger bestätigte Version %d statt %d.', $acked, $version);
            elomai_set_sync_state($post_id, [
                'status' => 'pending',
                'attempts' => $attempts,
                'version' => $version,
                'pending_hash' => $hash,
                'last_error' => $message,
                'last_attempt' => current_time('mysql', true),
                'error_code' => 'ack_mismatch',
            ]);
            elomai_log('sync_unconfirmed', $message, $post_id, ['version' => $version]);
            return ['status' => 'failed', 'message' => $message, 'http' => 200, 'code' => 'ack_mismatch', 'version' => $version];
        }

        $public_url = ELOMAI_PUBLIC_BASE . ($result['body']['url'] ?? '');
        // Only confirm against the real public host; a local test receiver
        // renders files that are not served anywhere yet.
        $is_production_endpoint = wp_parse_url(elomai_endpoint(), PHP_URL_HOST) === wp_parse_url(ELOMAI_PUBLIC_BASE, PHP_URL_HOST);
        $confirmed = $is_production_endpoint ? elomai_confirm_public($public_url) : null;

        update_post_meta($post_id, '_elomai_public_url', $public_url);
        elomai_set_sync_state($post_id, [
            'status' => 'synced',
            'attempts' => 0,
            'version' => $version,
            'pending_hash' => $hash,
            'last_hash' => $hash,
            'last_error' => '',
            'last_success' => current_time('mysql', true),
            'last_attempt' => current_time('mysql', true),
            'confirmed' => (bool) $confirmed,
            'duplicate' => !empty($result['body']['duplicate']),
            'warnings' => $built['warnings'],
        ]);
        elomai_log(
            $confirmed ? 'sync_ok' : 'sync_ok_unconfirmed',
            $confirmed ? 'Öffentlich erreichbar' : 'Empfänger bestätigte, öffentliche URL antwortet noch nicht',
            $post_id,
            ['version' => $version, 'url' => $public_url]
        );

        return [
            'status' => 'synced',
            'message' => $confirmed ? 'Synchronisiert.' : 'Synchronisiert, öffentliche Prüfung ausstehend.',
            'url' => $public_url,
            'http' => 200,
            'version' => $version,
        ];
    } finally {
        delete_transient($lock_key);
    }
}

/** Removes the article from the public site. */
function elomai_unpublish_post($post_id) {
    $post_id = (int) $post_id;
    $state = elomai_sync_state($post_id);
    if (empty($state['last_hash']) && !elomai_public_url($post_id)) {
        return ['status' => 'skipped', 'message' => 'Nie veröffentlicht – nichts zu entfernen.'];
    }

    $uuid = elomai_uuid($post_id);
    $version = max(1, (int) get_post_meta($post_id, '_elomai_version', true)) + 1;
    update_post_meta($post_id, '_elomai_version', $version);

    $result = elomai_send([
        'idempotencyKey' => $uuid . ':v' . $version . ':unpublish',
        'operation' => 'unpublish',
        'uuid' => $uuid,
        'version' => $version,
    ]);

    if (!$result['ok']) {
        elomai_set_sync_state($post_id, [
            'status' => 'failed',
            'last_error' => $result['error'],
            'last_attempt' => current_time('mysql', true),
            'http' => $result['http'],
        ]);
        elomai_log('unpublish_failed', $result['error'], $post_id, ['http' => $result['http']]);
        return [
            'status' => 'failed',
            'message' => $result['error'],
            'http' => (int) $result['http'],
            'code' => (string) ($result['body']['error'] ?? ''),
        ];
    }

    delete_post_meta($post_id, '_elomai_public_url');
    elomai_set_sync_state($post_id, [
        'status' => 'unpublished',
        'last_error' => '',
        'last_hash' => '',
        'pending_hash' => '',
        'version' => $version,
        'last_success' => current_time('mysql', true),
    ]);
    elomai_log('unpublish_ok', 'Artikel von der öffentlichen Seite entfernt', $post_id);
    return ['status' => 'unpublished', 'message' => 'Artikel ist offline.'];
}

/* ---------------------------------------------------------------- triggers */

/**
 * Every editorial event becomes a durable outbox row. Nothing is sent inside
 * the request that saved the post, so a slow or unreachable receiver can never
 * block, break or half-complete the editor's save.
 */
add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if (!$post || $post->post_type !== 'post' || wp_is_post_revision($post->ID)) {
        return;
    }
    if ($new_status === 'publish') {
        elomai_log(
            'publish',
            $old_status === 'publish' ? 'Aktualisierung erkannt' : 'Veröffentlichung erkannt',
            $post->ID
        );
        elomai_outbox_enqueue($post->ID, $old_status === 'publish' ? 'update' : 'publish');
        elomai_outbox_enqueue_translation_group($post->ID);
        return;
    }
    // Only a post that was actually public needs to be taken offline. A fresh
    // draft must never create an unpublish job.
    if ($old_status === 'publish' && in_array($new_status, ['draft', 'pending', 'trash', 'private'], true)) {
        elomai_log('unpublish', 'Beitrag ist nicht mehr öffentlich', $post->ID);
        elomai_outbox_enqueue($post->ID, 'unpublish');
        elomai_outbox_enqueue_translation_group($post->ID);
    }
}, 10, 3);

/** Content, title, slug, excerpt and comment-setting edits of a live post. */
add_action('post_updated', function ($post_id, $post_after, $post_before) {
    if ($post_after->post_type !== 'post') {
        return;
    }
    if ($post_after->post_status !== 'publish' || $post_before->post_status !== 'publish') {
        return;
    }
    $fields = ['post_content', 'post_title', 'post_excerpt', 'post_name', 'post_author', 'comment_status'];
    $changed = false;
    foreach ($fields as $field) {
        if ($post_after->$field !== $post_before->$field) {
            $changed = true;
            break;
        }
    }
    if (!$changed) {
        return;
    }
    elomai_outbox_enqueue($post_id, 'update');
    if ($post_after->post_name !== $post_before->post_name) {
        // A slug change moves the canonical URL of every sibling's hreflang.
        elomai_outbox_enqueue_translation_group($post_id);
    }
}, 10, 3);

/**
 * Fields that live in post meta: featured image, SEO/social metadata and the
 * translation relationship. They never touch post_content, so they need their
 * own triggers.
 */
$elomai_meta_trigger = function ($post_id, $meta_key) {
    if (!in_array($meta_key, ['_thumbnail_id', '_elomai_seo', '_presence_translation_of'], true)) {
        return;
    }
    if (get_post_type($post_id) !== 'post' || get_post_status($post_id) !== 'publish') {
        return;
    }
    elomai_outbox_enqueue($post_id, $meta_key === '_presence_translation_of' ? 'translation' : 'update');
    if ($meta_key === '_presence_translation_of') {
        elomai_outbox_enqueue_translation_group($post_id);
    }
};
add_action('updated_post_meta', function ($meta_id, $post_id, $meta_key) use ($elomai_meta_trigger) {
    $elomai_meta_trigger($post_id, $meta_key);
}, 10, 3);
add_action('added_post_meta', function ($meta_id, $post_id, $meta_key) use ($elomai_meta_trigger) {
    $elomai_meta_trigger($post_id, $meta_key);
}, 10, 3);
add_action('deleted_post_meta', function ($meta_ids, $post_id, $meta_key) use ($elomai_meta_trigger) {
    $elomai_meta_trigger($post_id, $meta_key);
}, 10, 3);

/** Changing the article language changes the listing it belongs to. */
add_action('set_object_terms', function ($object_id, $terms, $tt_ids, $taxonomy) {
    if ($taxonomy !== 'language' || get_post_type($object_id) !== 'post') {
        return;
    }
    if (get_post_status($object_id) !== 'publish') {
        return;
    }
    elomai_outbox_enqueue($object_id, 'update');
    elomai_outbox_enqueue_translation_group($object_id);
}, 10, 4);

/** Safety net: hourly drain, so a long offline period always recovers. */
add_action('elomai_retry_queue', function () {
    elomai_outbox_work(10);
    do_action('elomai_outbox_prune');
});

// WP-Cron fires on the next admin page load; the dashboard nudges it too.
add_action('admin_init', function () {
    if (isset($_GET['elomai_run_cron']) && current_user_can('manage_options')) {
        check_admin_referer('elomai_run_cron');
        spawn_cron();
        wp_safe_redirect(admin_url('admin.php?page=elomai-editorial'));
        exit;
    }
});

/* ---------------------------------------------------------- admin actions */

/**
 * Manual "Synchronise now": enqueue, then drain that one job immediately so
 * the administrator sees the receiver's answer without waiting for cron.
 */
add_action('admin_post_elomai_sync', function () {
    $post_id = (int) ($_GET['post'] ?? 0);
    if (!$post_id || !current_user_can('edit_post', $post_id)) {
        wp_die('Nicht erlaubt.');
    }
    check_admin_referer('elomai_sync_' . $post_id);
    delete_transient('elomai_outbox_worker');
    elomai_outbox_retry_now($post_id);
    $state = elomai_sync_state($post_id);
    $ok = ($state['status'] ?? '') === 'synced';
    $message = $ok ? 'Synchronisiert.' : (string) ($state['last_error'] ?? 'Synchronisierung fehlgeschlagen.');
    wp_safe_redirect(add_query_arg($ok ? 'elomai_synced' : 'elomai_error', rawurlencode($message), get_edit_post_link($post_id, 'url')));
    exit;
});

add_action('admin_post_elomai_retry', function () {
    $post_id = (int) ($_GET['post'] ?? 0);
    if (!$post_id || !current_user_can('edit_post', $post_id)) {
        wp_die('Nicht erlaubt.');
    }
    check_admin_referer('elomai_retry_' . $post_id);
    delete_transient('elomai_outbox_worker');
    elomai_outbox_retry_now($post_id);
    wp_safe_redirect(add_query_arg('elomai_synced', rawurlencode('Erneut versucht.'), admin_url('admin.php?page=elomai-editorial')));
    exit;
});

/** Drains the whole queue from the dashboard, for use after an outage. */
add_action('admin_post_elomai_outbox_run', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Nicht erlaubt.');
    }
    check_admin_referer('elomai_outbox_run');
    delete_transient('elomai_outbox_worker');
    $processed = elomai_outbox_work(10);
    wp_safe_redirect(
        add_query_arg(
            'elomai_synced',
            rawurlencode(sprintf('%d Auftrag/Aufträge verarbeitet.', $processed)),
            admin_url('admin.php?page=elomai-editorial')
        )
    );
    exit;
});

add_action('admin_post_elomai_unpublish', function () {
    $post_id = (int) ($_GET['post'] ?? 0);
    if (!$post_id || !current_user_can('edit_post', $post_id)) {
        wp_die('Nicht erlaubt.');
    }
    check_admin_referer('elomai_unpublish_' . $post_id);
    $result = elomai_unpublish_post($post_id);
    $flag = $result['status'] === 'unpublished' ? 'elomai_synced' : 'elomai_error';
    wp_safe_redirect(add_query_arg($flag, rawurlencode($result['message']), get_edit_post_link($post_id, 'url')));
    exit;
});

/** Admin notices after a manual action. */
add_action('admin_notices', function () {
    if (isset($_GET['elomai_synced'])) {
        printf('<div class="notice notice-success is-dismissible"><p>%s</p></div>', esc_html(sanitize_text_field(wp_unslash($_GET['elomai_synced']))));
    }
    if (isset($_GET['elomai_error'])) {
        printf('<div class="notice notice-error is-dismissible"><p>%s</p></div>', esc_html(sanitize_text_field(wp_unslash($_GET['elomai_error']))));
    }
});
