<?php
/**
 * WP-CLI helpers so synchronisation can also run from cron or a terminal.
 *
 *   wp elomai sync 42
 *   wp elomai sync --all
 *   wp elomai unpublish 42
 *   wp elomai status
 *   wp elomai test
 */

defined('ABSPATH') || exit;

WP_CLI::add_command('elomai', new class {
    /**
     * Synchronise one post, or every published post.
     *
     * ## OPTIONS
     * [<id>...]
     * : Post IDs to synchronise.
     * [--all]
     * : Synchronise every published post.
     */
    public function sync($args, $assoc_args) {
        $ids = array_map('intval', (array) $args);
        if (!empty($assoc_args['all'])) {
            $ids = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids']);
        }
        if (!$ids) {
            WP_CLI::error('Keine Beitrags-ID angegeben (oder --all).');
        }
        foreach ($ids as $id) {
            $result = elomai_sync_post($id, true);
            $line = sprintf('#%d %s — %s', $id, $result['status'], $result['message']);
            if ($result['status'] === 'synced') {
                WP_CLI::success($line);
            } else {
                WP_CLI::warning($line);
            }
        }
    }

    /**
     * Remove a post from the public site.
     */
    public function unpublish($args) {
        $id = (int) ($args[0] ?? 0);
        if (!$id) {
            WP_CLI::error('Beitrags-ID fehlt.');
        }
        $result = elomai_unpublish_post($id);
        WP_CLI::log(sprintf('#%d %s — %s', $id, $result['status'], $result['message']));
    }

    /**
     * Print the synchronisation state of every post.
     */
    public function status() {
        $posts = get_posts(['post_type' => 'post', 'post_status' => ['publish', 'draft', 'future'], 'posts_per_page' => -1]);
        $rows = [];
        foreach ($posts as $post) {
            $state = elomai_sync_state($post->ID);
            $rows[] = [
                'id' => $post->ID,
                'lang' => elomai_post_language($post->ID),
                'status' => $post->post_status,
                'sync' => $state['status'] ?? 'never',
                'version' => (int) get_post_meta($post->ID, '_elomai_version', true),
                'last' => $state['last_success'] ?? '',
                'error' => mb_strimwidth((string) ($state['last_error'] ?? ''), 0, 60, '…'),
            ];
        }
        WP_CLI\Utils\format_items('table', $rows, ['id', 'lang', 'status', 'sync', 'version', 'last', 'error']);
    }

    /**
     * Build the payload for a post, including a draft, without sending it.
     *
     * Used for local previews: the payload is exactly what a sync would send,
     * but nothing leaves the machine and the post status is never changed.
     *
     * ## OPTIONS
     *
     * <id>
     * : Post ID.
     *
     * [--out=<file>]
     * : Write the JSON to a file instead of stdout.
     */
    public function preview($args, $assoc_args) {
        $id = (int) ($args[0] ?? 0);
        if (!$id) {
            WP_CLI::error('Beitrags-ID fehlt.');
        }
        $payload = elomai_build_payload($id, true);
        if (is_wp_error($payload)) {
            WP_CLI::error($payload->get_error_message());
        }
        $json = wp_json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $out = (string) ($assoc_args['out'] ?? '');
        if ($out !== '') {
            if (file_put_contents($out, $json) === false) {
                WP_CLI::error('Konnte die Datei nicht schreiben: ' . $out);
            }
            WP_CLI::success(sprintf('#%d payload written (%d bytes, %d warning(s))', $id, strlen($json), count($payload['warnings'])));
            return;
        }
        WP_CLI::line($json);
    }

    /**
     * Verify the receiver connection without exposing the secret.
     */
    public function test() {
        $result = elomai_test_connection();
        WP_CLI::log($result['message']);
        foreach ($result['details'] as $detail) {
            WP_CLI::log('  ' . $detail);
        }
        if (!$result['ok']) {
            WP_CLI::halt(1);
        }
    }
});

/**
 * Comment channel commands.
 *
 *   wp elomai comments pull [--limit=25]
 *   wp elomai comments status
 *   wp elomai comments flush
 *   wp elomai comments prune
 */
WP_CLI::add_command('elomai comments', new class {
    /**
     * Import pending public comments as native WordPress comments.
     *
     * ## OPTIONS
     *
     * [--limit=<number>]
     * : Maximum number of submissions to request (1-100).
     */
    public function pull($args, $assoc_args) {
        $limit = (int) ($assoc_args['limit'] ?? 25);
        $result = elomai_comments_pull($limit);
        if (empty($result['ok'])) {
            WP_CLI::error('Abruf fehlgeschlagen: ' . $result['error']);
        }
        WP_CLI::success(sprintf(
            '%d importiert, %d bereits vorhanden, %d zurückgehalten%s',
            $result['imported'],
            $result['existing'],
            $result['failed'],
            $result['error'] !== '' ? ' (Bestätigung ausstehend: ' . $result['error'] . ')' : ''
        ));
    }

    /**
     * Show native comments and the remote comment counters.
     */
    public function status() {
        $rows = [];
        $comments = get_comments(['number' => 50, 'status' => 'all', 'orderby' => 'comment_date_gmt', 'order' => 'DESC']);
        foreach ($comments as $comment) {
            $state = elomai_public_status($comment);
            $public_id = elomai_comment_public_id($comment->comment_ID);
            $rows[] = [
                'id' => $comment->comment_ID,
                'public' => $public_id !== '' ? 'ja' : 'nein',
                'status' => $state,
                'sync' => (string) get_comment_meta($comment->comment_ID, '_elomai_sync_status', true) ?: '—',
                'class' => (string) get_comment_meta($comment->comment_ID, '_elomai_classification', true) ?: '—',
                'post' => $comment->comment_post_ID,
                'date' => $comment->comment_date_gmt,
                'error' => mb_strimwidth((string) get_comment_meta($comment->comment_ID, '_elomai_sync_error', true), 0, 40, '…'),
            ];
        }
        if (!$rows) {
            WP_CLI::log('Keine Kommentare in WordPress.');
        } else {
            WP_CLI\Utils\format_items('table', $rows, ['id', 'public', 'status', 'sync', 'class', 'post', 'date', 'error']);
        }

        $stats = elomai_comments_remote_stats();
        WP_CLI::log('');
        WP_CLI::log('Empfänger: ' . wp_json_encode($stats));
        $queued = get_option(ELOMAI_COMMENTS_OUTBOX, []);
        WP_CLI::log('Warteschlange: ' . (is_array($queued) ? count($queued) : 0) . ' Eintrag/Einträge');
    }

    /**
     * Retry queued moderation updates.
     */
    public function flush() {
        $result = elomai_comments_flush();
        WP_CLI::success(sprintf('%d übertragen, %d verbleiben', $result['sent'], $result['remaining']));
    }

    /**
     * Apply the receiver-side retention policy now.
     */
    public function prune() {
        $result = elomai_comments_send(['operation' => 'prune']);
        if (empty($result['ok'])) {
            WP_CLI::error('Aufräumen fehlgeschlagen: ' . $result['error']);
        }
        WP_CLI::success(sprintf('%d Eintrag/Einträge entfernt', (int) ($result['body']['changed'] ?? 0)));
    }
});
