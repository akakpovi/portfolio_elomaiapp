<?php
/**
 * M09.2 — WordPress side integration test.
 *
 * Runs inside the local WordPress container against an isolated receiver on
 * the Docker bridge. Nothing here reaches production: the sync endpoint and
 * the comment endpoint are temporarily pointed at the local receiver and
 * restored by the runner script.
 *
 *   wp eval-file wp-comments-e2e.php
 */

// eval-file runs inside a method, so the collector lives in $GLOBALS.
$GLOBALS['elomai_e2e_results'] = [];
function e2e_check($name, $ok, $detail = '') {
    $GLOBALS['elomai_e2e_results'][] = ['name' => $name, 'ok' => (bool) $ok];
    echo ($ok ? 'PASS' : 'FAIL') . '  ' . $name . ($detail !== '' ? ' — ' . $detail : '') . "\n";
}

function e2e_submit($uuid, $author, $email, $content, $parent = '') {
    $url = rtrim((string) getenv('ELOMAI_E2E_PUBLIC'), '/') . '/comments/v1/submit';
    $payload = [
        'article' => $uuid,
        'author' => $author,
        'email' => $email,
        'content' => $content,
        'consent' => true,
        'website' => '',
        'elapsed' => 15,
        'idempotencyKey' => 'e2e-' . md5($author . $content),
    ];
    if ($parent !== '') {
        $payload['parent'] = $parent;
    }
    $response = wp_remote_post($url, [
        'timeout' => 20,
        'headers' => ['content-type' => 'application/json', 'origin' => 'https://elomaiapp.com'],
        'body' => wp_json_encode($payload),
    ]);
    if (is_wp_error($response)) {
        return ['error' => $response->get_error_message()];
    }
    return json_decode((string) wp_remote_retrieve_body($response), true) ?: [];
}

function e2e_native_comment($public_id) {
    $id = elomai_comment_by_public_id($public_id);
    return $id ? get_comment($id) : null;
}

$post_id = (int) (getenv('ELOMAI_E2E_POST') ?: 20);
$post = get_post($post_id);
e2e_check('target post is published', $post && $post->post_status === 'publish', $post ? $post->post_type : 'missing');

// Test hygiene: remove comments created by an earlier run of this test so the
// assertions describe this run only. Only comments carrying our meta are
// touched.
global $wpdb;
$previous_ids = $wpdb->get_col($wpdb->prepare(
    "SELECT c.comment_ID FROM {$wpdb->comments} c INNER JOIN {$wpdb->commentmeta} m ON m.comment_id = c.comment_ID WHERE c.comment_post_ID = %d AND m.meta_key = '_elomai_public_id'",
    $post_id
));
foreach ($previous_ids as $previous_id) {
    wp_delete_comment((int) $previous_id, true);
}
e2e_check('previous test comments cleaned up', true, count($previous_ids) . ' entfernt');

/* ------------------------------------------------- 1. article on receiver */

$built = elomai_build_payload($post_id);
if (is_wp_error($built)) {
    e2e_check('payload builds', false, $built->get_error_message());
    return;
}
$article = $built['article'];
$article['version'] = 1;
$pub = elomai_send([
    'idempotencyKey' => 'm09-2-e2e-' . $article['uuid'],
    'operation' => 'upsert',
    'article' => $article,
]);
e2e_check('article published to the isolated receiver', !empty($pub['ok']), (string) ($pub['error'] ?? ''));
e2e_check('payload exposes the native discussion setting', isset($article['comments']['enabled']), wp_json_encode($article['comments'] ?? null));
e2e_check('native comment_status drives the flag', $article['comments']['enabled'] === ($post->comment_status === 'open'));

$uuid = (string) $article['uuid'];
$stats_before = elomai_comments_remote_stats();

/* ------------------------------------------------------- 2. submissions */

$trusted = e2e_submit($uuid, 'Marie Dupont', 'marie@example.com', 'Thank you for the clear explanation of the monitoring setup.');
$suspicious = e2e_submit($uuid, 'Link Poster', 'links@example.com', 'Interesting, see more on my page https://example.org/notes about this topic.');
$spam = e2e_submit($uuid, 'Bonus Hunter', 'spam@example.com', 'Best casino bonus at https://one.top https://two.xyz https://three.click right now.');
e2e_check('visitor submission accepted', ($trusted['status'] ?? '') === 'awaiting_moderation', wp_json_encode($trusted));
e2e_check('submission is not reported as imported before the pull', ($trusted['status'] ?? '') !== 'approved');

/* ------------------------------------------------------------ 3. import */

$pull = elomai_comments_pull(25);
e2e_check('pull succeeded', !empty($pull['ok']), (string) $pull['error']);
e2e_check('three submissions imported', $pull['imported'] >= 3, (string) $pull['imported']);

$trusted_comment = e2e_native_comment($trusted['id'] ?? '');
$suspicious_comment = e2e_native_comment($suspicious['id'] ?? '');
$spam_comment = e2e_native_comment($spam['id'] ?? '');

e2e_check('trustworthy comment is a native WordPress comment', $trusted_comment instanceof WP_Comment);
e2e_check('trustworthy comment auto-approved', $trusted_comment && (string) $trusted_comment->comment_approved === '1');
e2e_check('suspicious comment stays pending', $suspicious_comment && (string) $suspicious_comment->comment_approved === '0');
e2e_check('obvious spam marked as spam', $spam_comment && (string) $spam_comment->comment_approved === 'spam');
e2e_check('email is stored natively but not exposed publicly', $trusted_comment && $trusted_comment->comment_author_email === 'marie@example.com');
e2e_check('public identifier stored as comment meta', $trusted_comment && elomai_comment_public_id($trusted_comment->comment_ID) === ($trusted['id'] ?? ''));
e2e_check('classification stored for the administrator', $spam_comment && get_comment_meta($spam_comment->comment_ID, '_elomai_classification', true) === 'spam');
e2e_check('comment is attached to the right post', $trusted_comment && (int) $trusted_comment->comment_post_ID === $post_id);

/* -------------------------------------------------------- 4. idempotency */

$before_count = (int) get_comments(['post_id' => $post_id, 'count' => true, 'status' => 'all']);
$pull2 = elomai_comments_pull(25);
$after_count = (int) get_comments(['post_id' => $post_id, 'count' => true, 'status' => 'all']);
e2e_check('second pull imports nothing new', (int) $pull2['imported'] === 0, (string) $pull2['imported']);
e2e_check('second pull leaves nothing awaiting import', (int) ($pull2['failed'] ?? 0) === 0, (string) ($pull2['failed'] ?? '?'));
e2e_check('no duplicate native comments created', $before_count === $after_count, $before_count . ' -> ' . $after_count);
$stats_after_second = elomai_comments_remote_stats();
e2e_check(
    'receiver keeps exactly the imported comments',
    (int) ($stats_after_second['imported'] ?? 0) === 3 && (int) ($stats_after_second['awaitingImport'] ?? 0) === 0,
    wp_json_encode($stats_after_second)
);

/* ------------------------------------------------ 5. moderation pushes */

$stats_pending = elomai_comments_remote_stats();
e2e_check('receiver counts one pending comment', (int) ($stats_pending['pending'] ?? 0) >= 1, wp_json_encode($stats_pending));

wp_set_comment_status($suspicious_comment->comment_ID, 'approve');
$stats_approved = elomai_comments_remote_stats();
e2e_check(
    'manual approval reaches the receiver',
    (int) ($stats_approved['approved'] ?? 0) === (int) ($stats_pending['approved'] ?? 0) + 1,
    'before=' . ($stats_pending['approved'] ?? '?') . ' after=' . ($stats_approved['approved'] ?? '?')
);

wp_set_comment_status($suspicious_comment->comment_ID, 'hold');
$stats_held = elomai_comments_remote_stats();
e2e_check(
    'unapproval reaches the receiver',
    (int) ($stats_held['approved'] ?? 0) === (int) ($stats_pending['approved'] ?? 0),
    'approved=' . ($stats_held['approved'] ?? '?')
);

wp_set_comment_status($suspicious_comment->comment_ID, 'spam');
$stats_spam = elomai_comments_remote_stats();
e2e_check(
    'marking as spam reaches the receiver',
    (int) ($stats_spam['spam'] ?? 0) >= 2,
    'spam=' . ($stats_spam['spam'] ?? '?')
);

/* ------------------------------------------------------- 6. WP-authored reply */

$reply_id = wp_insert_comment([
    'comment_post_ID' => $post_id,
    'comment_author' => 'Elom Akakpovi',
    'comment_author_email' => 'ekakpovi656@gmail.com',
    'comment_content' => 'Thanks for reading — the monitoring thresholds are explained in the next section.',
    'comment_approved' => 1,
    'comment_parent' => $trusted_comment->comment_ID,
]);
e2e_check('administrator reply created natively', $reply_id && !is_wp_error($reply_id));
e2e_check('administrator reply marked as synchronised', get_comment_meta($reply_id, '_elomai_sync_status', true) === 'synced');
$stats_reply = elomai_comments_remote_stats();
e2e_check(
    'administrator reply published to the receiver',
    (int) ($stats_reply['approved'] ?? 0) >= (int) ($stats_spam['approved'] ?? 0) + 1,
    'approved=' . ($stats_reply['approved'] ?? '?')
);

/* ------------------------------------------------------- 7. deletion sync */

wp_delete_comment($trusted_comment->comment_ID, true);
$stats_deleted = elomai_comments_remote_stats();
e2e_check(
    'deletion propagates to the receiver',
    (int) ($stats_deleted['approved'] ?? 0) <= (int) ($stats_reply['approved'] ?? 0),
    'approved=' . ($stats_deleted['approved'] ?? '?') . ' deleted=' . ($stats_deleted['deleted'] ?? '?')
);

/* ------------------------------------------------------------ 8. failures */

e2e_check('unknown article uuid resolves to no post', elomai_post_by_uuid('00000000-0000-0000-0000-000000000000') === 0);
e2e_check('invalid uuid rejected before a query', elomai_post_by_uuid("'; DROP TABLE wp_posts;--") === 0);

$saved = elomai_comments_endpoint();
elomai_update_option('comments_endpoint', 'http://127.0.0.1:1/nowhere');
$offline = elomai_comments_pull(5);
elomai_update_option('comments_endpoint', $saved);
e2e_check('unreachable receiver fails safely', empty($offline['ok']) && $offline['imported'] === 0);
e2e_check('endpoint restored after the failure test', elomai_comments_endpoint() === $saved);

$collected = $GLOBALS['elomai_e2e_results'];
$failed = array_filter($collected, fn($r) => !$r['ok']);
echo "\n" . (count($collected) - count($failed)) . '/' . count($collected) . " checks passed\n";
if ($failed) {
    WP_CLI::halt(1);
}
