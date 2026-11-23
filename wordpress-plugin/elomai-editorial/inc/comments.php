<?php
/**
 * Native WordPress comments as the editorial source of truth, plus the
 * outbound comment channel to the public receiver.
 *
 * WordPress is always the client: it pulls pending submissions, imports them
 * as native comments, acknowledges the import and pushes every moderation
 * decision back. The receiver never connects to this installation.
 */

defined('ABSPATH') || exit;

/** Must match COMMENT_SCOPE in the receiver (lib/auth.mjs). */
const ELOMAI_COMMENT_SCOPE = 'elomai:comments:v1';
const ELOMAI_COMMENTS_OUTBOX = 'elomai_comments_outbox';
const ELOMAI_COMMENTS_CRON = 'elomai_comments_sync';
const ELOMAI_COMMENTS_FLUSH = 'elomai_comments_flush';
const ELOMAI_COMMENTS_MAX_ATTEMPTS = 8;

function elomai_comments_endpoint() {
    return (string) elomai_option('comments_endpoint', ELOMAI_PUBLIC_BASE . '/content-api/comments/v1/wp');
}

/* ------------------------------------------------------------- lookups */

/** Post id for a public article identifier. */
function elomai_post_by_uuid($uuid) {
    $uuid = strtolower(trim((string) $uuid));
    if (!preg_match('/^[a-z0-9-]{8,64}$/', $uuid)) {
        return 0;
    }
    $ids = get_posts([
        'post_type' => 'post',
        'post_status' => ['publish', 'draft', 'future', 'private', 'pending'],
        'posts_per_page' => 1,
        'fields' => 'ids',
        'no_found_rows' => true,
        'meta_key' => '_elomai_uuid',
        'meta_value' => $uuid,
    ]);
    return $ids ? (int) $ids[0] : 0;
}

function elomai_comment_public_id($comment_id) {
    return (string) get_comment_meta((int) $comment_id, '_elomai_public_id', true);
}

/** Native comment id for a public comment identifier, or 0. */
function elomai_comment_by_public_id($public_id) {
    $public_id = trim((string) $public_id);
    if ($public_id === '') {
        return 0;
    }
    // A direct meta lookup, because WP_Comment_Query's "all" status omits
    // spam and trash: a spam-classified comment must still be found, otherwise
    // every pull would import it again.
    global $wpdb;
    $found = $wpdb->get_var($wpdb->prepare(
        "SELECT comment_id FROM {$wpdb->commentmeta} WHERE meta_key = '_elomai_public_id' AND meta_value = %s LIMIT 1",
        $public_id
    ));
    return $found ? (int) $found : 0;
}

/** Public state that mirrors a native WordPress comment status. */
function elomai_public_status($comment) {
    if (!$comment) {
        return 'deleted';
    }
    if ($comment->comment_approved === 'spam') {
        return 'spam';
    }
    if ($comment->comment_approved === 'trash') {
        return 'deleted';
    }
    if ((string) $comment->comment_approved === '1') {
        return 'approved';
    }
    return 'pending';
}

/** Monotonic version so an older decision can never overwrite a newer one. */
function elomai_comment_next_version($comment_id) {
    $version = (int) get_comment_meta((int) $comment_id, '_elomai_public_version', true) + 1;
    update_comment_meta((int) $comment_id, '_elomai_public_version', $version);
    return $version;
}

/* ------------------------------------------------------------ transport */

/**
 * Sends one signed document over the existing outbound channel.
 *
 * @return array{ok: bool, http: int, body: array, error: string}
 */
function elomai_comments_send(array $payload) {
    return elomai_send_to(elomai_comments_endpoint(), $payload, ELOMAI_COMMENT_SCOPE);
}

/* --------------------------------------------------------------- import */

/**
 * Pulls pending submissions and imports them as native comments.
 *
 * Idempotent by construction: an existing `_elomai_public_id` is never
 * imported twice, and every item that is already present is acknowledged
 * again so a lost acknowledgement repairs itself on the next run.
 *
 * @return array{ok: bool, imported: int, existing: int, failed: int, error: string}
 */
function elomai_comments_pull($limit = 25) {
    $result = elomai_comments_send([
        'operation' => 'pending',
        'limit' => max(1, min(100, (int) $limit)),
    ]);

    if (empty($result['ok'])) {
        elomai_log('comments_pull_failed', $result['error']);
        return ['ok' => false, 'imported' => 0, 'existing' => 0, 'failed' => 0, 'error' => $result['error']];
    }

    $items = $result['body']['comments'] ?? [];
    if (!is_array($items)) {
        $items = [];
    }

    $ack = [];
    $imported = 0;
    $existing = 0;
    $failed = 0;

    foreach ($items as $item) {
        if (!is_array($item)) {
            $failed++;
            continue;
        }
        $public_id = (string) ($item['id'] ?? '');
        if (!preg_match('/^c_[a-f0-9]{24}$/', $public_id)) {
            $failed++;
            elomai_log('comment_invalid_id', 'Öffentliche Kommentar-ID ungültig.');
            continue;
        }

        $known = elomai_comment_by_public_id($public_id);
        if ($known) {
            $existing++;
            $ack[] = [
                'id' => $public_id,
                'wpCommentId' => $known,
                'status' => elomai_public_status(get_comment($known)),
            ];
            continue;
        }

        $post_id = elomai_post_by_uuid($item['articleUuid'] ?? '');
        if (!$post_id) {
            // The article is not published locally (draft, unpublished or
            // unknown). Nothing is imported and nothing is acknowledged, so the
            // submission waits instead of disappearing or appearing publicly.
            $failed++;
            elomai_log('comment_article_unavailable', 'Kommentar für nicht veröffentlichten Artikel zurückgehalten.');
            continue;
        }

        $verdict = (string) ($item['classification']['verdict'] ?? 'suspicious');
        // Fail-safe: anything that is not explicitly trustworthy stays pending.
        $approved = $verdict === 'trustworthy' ? 1 : ($verdict === 'spam' ? 'spam' : 0);

        $parent_wp = 0;
        if (!empty($item['parentId'])) {
            $parent_wp = elomai_comment_by_public_id($item['parentId']);
        }

        $created_gmt = (string) ($item['createdAt'] ?? '');
        $timestamp = strtotime($created_gmt);
        if (!$timestamp) {
            $timestamp = time();
        }
        $created_gmt = gmdate('Y-m-d H:i:s', $timestamp);

        $GLOBALS['elomai_importing_comment'] = true;
        $comment_id = wp_insert_comment([
            'comment_post_ID' => $post_id,
            'comment_author' => sanitize_text_field((string) ($item['author'] ?? '')),
            'comment_author_email' => sanitize_email((string) ($item['email'] ?? '')),
            'comment_author_url' => '',
            'comment_author_IP' => '',
            'comment_agent' => 'elomai-receiver/1.0',
            'comment_content' => wp_slash((string) ($item['content'] ?? '')),
            'comment_parent' => $parent_wp,
            'comment_approved' => $approved,
            'comment_date' => get_date_from_gmt($created_gmt),
            'comment_date_gmt' => $created_gmt,
            'comment_type' => 'comment',
        ]);
        unset($GLOBALS['elomai_importing_comment']);

        if (!$comment_id || is_wp_error($comment_id)) {
            $failed++;
            elomai_log('comment_import_failed', 'Kommentar konnte nicht angelegt werden.');
            continue;
        }

        update_comment_meta($comment_id, '_elomai_public_id', $public_id);
        update_comment_meta($comment_id, '_elomai_article_uuid', (string) ($item['articleUuid'] ?? ''));
        update_comment_meta($comment_id, '_elomai_classification', $verdict);
        update_comment_meta($comment_id, '_elomai_classification_reasons', wp_json_encode($item['classification']['reasons'] ?? []));
        update_comment_meta($comment_id, '_elomai_sync_status', 'synced');
        update_comment_meta($comment_id, '_elomai_imported_at', current_time('mysql', true));
        update_comment_meta($comment_id, '_elomai_public_version', 1);

        $imported++;
        $ack[] = ['id' => $public_id, 'wpCommentId' => (int) $comment_id, 'status' => elomai_public_status(get_comment($comment_id))];
    }

    $ackError = '';
    if ($ack) {
        $ackResult = elomai_comments_send(['operation' => 'ack', 'comments' => $ack]);
        if (empty($ackResult['ok'])) {
            // The import stands. The next pull returns the same items, finds
            // them by public id and acknowledges them again.
            $ackError = $ackResult['error'];
            elomai_log('comments_ack_failed', $ackError);
        }
    }

    if ($imported || $existing) {
        elomai_log('comments_imported', sprintf('%d neu, %d bereits vorhanden, %d zurückgehalten', $imported, $existing, $failed));
    } elseif ($failed) {
        elomai_log('comments_import_failed', sprintf('%d Einträge zurückgehalten', $failed));
    }

    return ['ok' => true, 'imported' => $imported, 'existing' => $existing, 'failed' => $failed, 'error' => $ackError];
}

/* ----------------------------------------------------------- moderation */

/** Pushes the current moderation state of one native comment. */
function elomai_comments_push_status($comment_id) {
    $public_id = elomai_comment_public_id($comment_id);
    if ($public_id === '') {
        return false;
    }
    $comment = get_comment($comment_id);
    if (!$comment) {
        return false;
    }

    $update = [
        'id' => $public_id,
        'status' => elomai_public_status($comment),
        'content' => (string) $comment->comment_content,
        'authorName' => (string) $comment->comment_author,
        'wpCommentId' => (int) $comment_id,
        'version' => elomai_comment_next_version($comment_id),
    ];

    $result = elomai_comments_send(['operation' => 'status', 'updates' => [$update]]);
    if (!empty($result['ok'])) {
        update_comment_meta($comment_id, '_elomai_sync_status', 'synced');
        delete_comment_meta($comment_id, '_elomai_sync_error');
        elomai_log('comment_status_synced', 'Moderationsstatus übertragen: ' . $update['status'], (int) $comment->comment_post_ID);
        return true;
    }

    update_comment_meta($comment_id, '_elomai_sync_status', 'pending');
    update_comment_meta($comment_id, '_elomai_sync_error', (string) $result['error']);
    elomai_comments_queue(['operation' => 'status', 'update' => $update]);
    elomai_log('comment_status_failed', $result['error'], (int) $comment->comment_post_ID);
    return false;
}

/**
 * Publishes a comment that only exists in WordPress (an administrator reply)
 * so it appears on the public article.
 */
function elomai_comments_publish($comment_id) {
    $comment = get_comment($comment_id);
    if (!$comment || (string) $comment->comment_approved !== '1') {
        return false;
    }
    $post = get_post((int) $comment->comment_post_ID);
    if (!$post || $post->post_status !== 'publish') {
        return false;
    }
    $uuid = (string) get_post_meta($post->ID, '_elomai_uuid', true);
    if ($uuid === '') {
        return false;
    }

    $parent_public = '';
    if (!empty($comment->comment_parent)) {
        $parent_public = elomai_comment_public_id((int) $comment->comment_parent);
    }

    $external_id = 'wp-' . (int) $comment_id;
    $payload = [
        'operation' => 'publish',
        'comment' => [
            'articleUuid' => $uuid,
            'parentId' => $parent_public ?: null,
            'authorName' => (string) $comment->comment_author,
            'content' => (string) $comment->comment_content,
            'createdAt' => get_gmt_from_date((string) $comment->comment_date),
            'externalId' => $external_id,
        ],
    ];

    $result = elomai_comments_send($payload);
    if (!empty($result['ok'])) {
        update_comment_meta($comment_id, '_elomai_sync_status', 'synced');
        update_comment_meta($comment_id, '_elomai_external_id', $external_id);
        elomai_log('comment_published', 'Antwort öffentlich veröffentlicht', (int) $comment->comment_post_ID);
        return true;
    }

    update_comment_meta($comment_id, '_elomai_sync_status', 'pending');
    update_comment_meta($comment_id, '_elomai_sync_error', (string) $result['error']);
    elomai_comments_queue(['operation' => 'publish', 'comment' => $payload['comment']]);
    elomai_log('comment_publish_failed', $result['error'], (int) $comment->comment_post_ID);
    return false;
}

/* -------------------------------------------------------------- outbox */

/** Bounded retry queue: nothing is lost when the receiver is unreachable. */
function elomai_comments_queue(array $operation) {
    $queue = get_option(ELOMAI_COMMENTS_OUTBOX, []);
    if (!is_array($queue)) {
        $queue = [];
    }
    $operation['attempts'] = (int) ($operation['attempts'] ?? 0) + 1;
    $operation['queued_at'] = current_time('mysql', true);
    $queue[] = $operation;
    update_option(ELOMAI_COMMENTS_OUTBOX, array_slice($queue, -100), false);

    if (!wp_next_scheduled(ELOMAI_COMMENTS_FLUSH)) {
        wp_schedule_single_event(time() + 300, ELOMAI_COMMENTS_FLUSH);
    }
}

/**
 * Retries queued operations. Status updates are merged into one request;
 * WordPress-authored comments are retried individually.
 *
 * @return array{sent: int, remaining: int}
 */
function elomai_comments_flush() {
    $queue = get_option(ELOMAI_COMMENTS_OUTBOX, []);
    if (!is_array($queue) || !$queue) {
        return ['sent' => 0, 'remaining' => 0];
    }

    $updates = [];
    $published = [];
    $dropped = 0;

    foreach ($queue as $operation) {
        if ((int) ($operation['attempts'] ?? 0) >= ELOMAI_COMMENTS_MAX_ATTEMPTS) {
            $dropped++;
            continue;
        }
        if (($operation['operation'] ?? '') === 'status' && !empty($operation['update']['id'])) {
            $updates[$operation['update']['id']] = $operation['update'];
        } elseif (($operation['operation'] ?? '') === 'publish' && !empty($operation['comment']['externalId'])) {
            $published[$operation['comment']['externalId']] = $operation['comment'];
        }
    }

    $remaining = [];
    $sent = 0;

    if ($updates) {
        $result = elomai_comments_send(['operation' => 'status', 'updates' => array_values($updates)]);
        if (!empty($result['ok'])) {
            $sent += count($updates);
            foreach (array_keys($updates) as $public_id) {
                $comment_id = elomai_comment_by_public_id($public_id);
                if ($comment_id) {
                    update_comment_meta($comment_id, '_elomai_sync_status', 'synced');
                    delete_comment_meta($comment_id, '_elomai_sync_error');
                }
            }
        } else {
            foreach ($updates as $update) {
                $remaining[] = ['operation' => 'status', 'update' => $update, 'attempts' => 1, 'queued_at' => current_time('mysql', true)];
            }
        }
    }

    foreach ($published as $comment) {
        $result = elomai_comments_send(['operation' => 'publish', 'comment' => $comment]);
        if (!empty($result['ok'])) {
            $sent++;
        } else {
            $remaining[] = ['operation' => 'publish', 'comment' => $comment, 'attempts' => 1, 'queued_at' => current_time('mysql', true)];
        }
    }

    // Attempt counters survive between runs so a permanently failing entry
    // is dropped instead of retried forever.
    foreach ($remaining as $index => $entry) {
        $previous = 0;
        foreach ($queue as $original) {
            if (($original['operation'] ?? '') === $entry['operation']
                && ($original['update']['id'] ?? $original['comment']['externalId'] ?? '') === ($entry['update']['id'] ?? $entry['comment']['externalId'] ?? '')) {
                $previous = (int) ($original['attempts'] ?? 0);
            }
        }
        $remaining[$index]['attempts'] = $previous + 1;
    }

    update_option(ELOMAI_COMMENTS_OUTBOX, $remaining, false);
    if ($remaining) {
        wp_schedule_single_event(time() + 900, ELOMAI_COMMENTS_FLUSH);
        elomai_log('comments_flush_pending', sprintf('%d Einträge verbleiben', count($remaining)));
    }
    if ($sent || $dropped) {
        elomai_log('comments_flush', sprintf('%d übertragen, %d verworfen', $sent, $dropped));
    }

    return ['sent' => $sent, 'remaining' => count($remaining)];
}

/* --------------------------------------------------------------- hooks */

/** Moderation decisions, including approve/unapprove/spam/trash. */
add_action('transition_comment_status', function ($new_status, $old_status, $comment) {
    if (empty($comment) || !is_object($comment)) {
        return;
    }
    if (!empty($GLOBALS['elomai_importing_comment'])) {
        return;
    }
    if (elomai_comment_public_id($comment->comment_ID) === '') {
        return;
    }
    if ($new_status === $old_status) {
        return;
    }
    elomai_comments_push_status($comment->comment_ID);
}, 10, 3);

/** Edited comments: content and display name travel with the status. */
add_action('edit_comment', function ($comment_id) {
    if (!empty($GLOBALS['elomai_importing_comment'])) {
        return;
    }
    if (elomai_comment_public_id($comment_id) === '') {
        return;
    }
    elomai_comments_push_status($comment_id);
}, 10, 1);

/** Deletion removes the comment from the public article as well. */
add_action('delete_comment', function ($comment_id) {
    $public_id = elomai_comment_public_id($comment_id);
    if ($public_id === '') {
        return;
    }
    $result = elomai_comments_send([
        'operation' => 'status',
        'updates' => [[
            'id' => $public_id,
            'status' => 'deleted',
            'version' => elomai_comment_next_version($comment_id),
            'wpCommentId' => (int) $comment_id,
        ]],
    ]);
    if (empty($result['ok'])) {
        elomai_comments_queue([
            'operation' => 'status',
            'update' => [
                'id' => $public_id,
                'status' => 'deleted',
                'version' => elomai_comment_next_version($comment_id),
                'wpCommentId' => (int) $comment_id,
            ],
        ]);
    }
}, 10, 1);

/** A new approved comment with no public id is an administrator reply. */
add_action('wp_insert_comment', function ($comment_id, $comment) {
    if (!empty($GLOBALS['elomai_importing_comment'])) {
        return;
    }
    if (!is_object($comment) || (string) $comment->comment_approved !== '1') {
        return;
    }
    if (elomai_comment_public_id($comment_id) !== '') {
        return;
    }
    elomai_comments_publish($comment_id);
}, 10, 2);

/* ---------------------------------------------------------------- cron */

add_filter('cron_schedules', function ($schedules) {
    if (!isset($schedules['elomai_five_minutes'])) {
        $schedules['elomai_five_minutes'] = [
            'interval' => 5 * MINUTE_IN_SECONDS,
            'display' => 'Alle 5 Minuten (EL0M Kommentare)',
        ];
    }
    return $schedules;
});

add_action(ELOMAI_COMMENTS_CRON, function () {
    elomai_comments_flush();
    elomai_comments_pull(25);
});

add_action(ELOMAI_COMMENTS_FLUSH, 'elomai_comments_flush');

/** Existing installations get the schedule without a reactivation. */
add_action('init', function () {
    if (!wp_next_scheduled(ELOMAI_COMMENTS_CRON)) {
        wp_schedule_event(time() + 120, 'elomai_five_minutes', ELOMAI_COMMENTS_CRON);
    }
}, 20);

/* -------------------------------------------------------------- admin */

/** "Synchronisation" column on the native comments screen. */
add_filter('manage_edit-comments_columns', function ($columns) {
    $next = [];
    foreach ($columns as $key => $label) {
        $next[$key] = $label;
        if ($key === 'comment') {
            $next['elomai_sync'] = 'Öffentlich';
        }
    }
    if (!isset($next['elomai_sync'])) {
        $next['elomai_sync'] = 'Öffentlich';
    }
    return $next;
});

add_action('manage_comments_custom_column', function ($column, $comment_id) {
    if ($column !== 'elomai_sync') {
        return;
    }
    $public_id = elomai_comment_public_id($comment_id);
    $state = (string) get_comment_meta($comment_id, '_elomai_sync_status', true);
    $error = (string) get_comment_meta($comment_id, '_elomai_sync_error', true);

    if ($public_id === '') {
        echo '<span title="Nur in WordPress vorhanden">WordPress</span>';
        if ($state === 'pending') {
            echo '<br><span style="color:#b32d2e">Übertragung ausstehend</span>';
        }
        return;
    }

    $label = $state === 'pending' ? 'Ausstehend' : ($state === 'failed' ? 'Fehler' : 'Synchronisiert');
    $color = $state === 'pending' || $state === 'failed' ? '#b32d2e' : '#1a7f37';
    printf('<span style="color:%s" title="%s">%s</span>', esc_attr($color), esc_attr($error ?: $public_id), esc_html($label));
    $url = wp_nonce_url(
        admin_url('admin-post.php?action=elomai_comment_resync&comment=' . (int) $comment_id),
        'elomai_comment_resync_' . (int) $comment_id
    );
    printf('<br><a href="%s">Erneut senden</a>', esc_url($url));
}, 10, 2);

/** Manual retry of one comment: never changes the comment itself. */
add_action('admin_post_elomai_comment_resync', function () {
    $comment_id = (int) ($_GET['comment'] ?? 0);
    if (!$comment_id || !current_user_can('moderate_comments')) {
        wp_die('Nicht erlaubt.');
    }
    check_admin_referer('elomai_comment_resync_' . $comment_id);

    $public_id = elomai_comment_public_id($comment_id);
    if ($public_id !== '') {
        elomai_comments_push_status($comment_id);
    } else {
        elomai_comments_publish($comment_id);
    }
    wp_safe_redirect(add_query_arg('elomai_synced', '1', admin_url('edit-comments.php')));
    exit;
});

/** Remote operational counters, for diagnostics only. */
function elomai_comments_remote_stats() {
    $result = elomai_comments_send(['operation' => 'stats']);
    return !empty($result['ok']) ? ($result['body']['stats'] ?? []) : ['error' => $result['error']];
}
