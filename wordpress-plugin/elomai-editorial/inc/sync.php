<?php
/**
 * Authenticated synchronisation: signing, transport, retries, status tracking
 * and propagation of unpublishing. Local WordPress is never reachable from the
 * internet; it is always the client.
 */

defined('ABSPATH') || exit;

const ELOMAI_RETRY_DELAYS = [60, 300, 900, 3600, 21600];

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
 * @return array{status: string, message: string, url?: string}
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
            $retryable = $result['http'] === 0 || $result['http'] === 429 || $result['http'] >= 500;
            elomai_set_sync_state($post_id, [
                'status' => $retryable ? 'pending' : 'failed',
                'attempts' => $attempts,
                'version' => $version,
                'pending_hash' => $hash,
                'last_error' => $result['error'],
                'last_attempt' => current_time('mysql', true),
                'http' => $result['http'],
            ]);
            elomai_log('sync_failed', $result['error'], $post_id, ['http' => $result['http'], 'version' => $version]);

            if ($retryable && $attempts <= count(ELOMAI_RETRY_DELAYS)) {
                $delay = ELOMAI_RETRY_DELAYS[min($attempts - 1, count(ELOMAI_RETRY_DELAYS) - 1)];
                wp_schedule_single_event(time() + $delay, 'elomai_sync_article', [$post_id]);
            }
            return ['status' => 'failed', 'message' => $result['error']];
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

        return ['status' => 'synced', 'message' => $confirmed ? 'Synchronisiert.' : 'Synchronisiert, öffentliche Prüfung ausstehend.', 'url' => $public_url];
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
        ]);
        elomai_log('unpublish_failed', $result['error'], $post_id);
        return ['status' => 'failed', 'message' => $result['error']];
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
 * Publication and updates are synchronised right after the request that saved
 * the post, so the editor immediately sees whether the public site confirmed.
 */
add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if (!$post || $post->post_type !== 'post') {
        return;
    }
    if ($new_status === 'publish' && $old_status !== 'publish') {
        elomai_log('publish', 'Veröffentlichung erkannt', $post->ID);
        wp_schedule_single_event(time() + 2, 'elomai_sync_article', [$post->ID]);
        return;
    }
    if ($old_status === 'publish' && in_array($new_status, ['draft', 'pending', 'trash', 'private'], true)) {
        elomai_log('unpublish', 'Beitrag ist nicht mehr öffentlich', $post->ID);
        wp_schedule_single_event(time() + 2, 'elomai_unpublish_article', [$post->ID]);
    }
}, 10, 3);

/** Content edits of an already published post bump the version. */
add_action('post_updated', function ($post_id, $post_after, $post_before) {
    if ($post_after->post_type !== 'post') {
        return;
    }
    if ($post_after->post_status !== 'publish' || $post_before->post_status !== 'publish') {
        return;
    }
    if ($post_after->post_content === $post_before->post_content
        && $post_after->post_title === $post_before->post_title
        && $post_after->post_excerpt === $post_before->post_excerpt) {
        return;
    }
    wp_schedule_single_event(time() + 2, 'elomai_sync_article', [$post_id]);
}, 10, 3);

add_action('elomai_sync_article', function ($post_id) {
    elomai_sync_post($post_id);
});

add_action('elomai_unpublish_article', function ($post_id) {
    elomai_unpublish_post($post_id);
});

/** Safety net: hourly retry sweep plus scheduled publications. */
add_action('elomai_retry_queue', function () {
    $posts = get_posts([
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => 20,
        'meta_query' => [
            [
                'key' => '_elomai_sync',
                'compare' => 'EXISTS',
            ],
        ],
        'fields' => 'ids',
    ]);
    foreach ($posts as $post_id) {
        $state = elomai_sync_state($post_id);
        if (in_array($state['status'] ?? '', ['pending', 'failed'], true) && (int) ($state['attempts'] ?? 0) < 8) {
            elomai_sync_post($post_id);
        }
    }
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

add_action('admin_post_elomai_sync', function () {
    $post_id = (int) ($_GET['post'] ?? 0);
    if (!$post_id || !current_user_can('edit_post', $post_id)) {
        wp_die('Nicht erlaubt.');
    }
    check_admin_referer('elomai_sync_' . $post_id);
    $result = elomai_sync_post($post_id, true);
    $flag = $result['status'] === 'synced' ? 'elomai_synced' : 'elomai_error';
    wp_safe_redirect(add_query_arg($flag, rawurlencode($result['message']), get_edit_post_link($post_id, 'url')));
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
