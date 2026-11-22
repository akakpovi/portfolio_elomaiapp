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
