<?php
/**
 * Durable synchronisation outbox.
 *
 * Every editorial event that must reach the public site becomes a row in a
 * custom table instead of a transient or an in-memory promise. That gives the
 * workflow the properties it needs in the real world:
 *
 *  - a publication is never lost because the editor's request ended early;
 *  - a job survives a WordPress restart, a laptop shutdown, a network outage
 *    and a receiver restart;
 *  - retries are bounded, exponentially spaced and jittered, and never stop
 *    silently: a job stays visible until the receiver acknowledges the version
 *    that was actually sent;
 *  - an older delayed job can never overwrite a newer article version, because
 *    the receiver enforces monotonic versions and the worker re-checks the post
 *    after sending.
 *
 * Only this queue exists; the previous ad-hoc `wp_schedule_single_event`
 * retries were removed in favour of it.
 */

defined('ABSPATH') || exit;

const ELOMAI_OUTBOX_VERSION = '1';
const ELOMAI_OUTBOX_EVENTS = ['publish', 'update', 'translation', 'unpublish', 'manual'];
const ELOMAI_OUTBOX_MAX_FAST_ATTEMPTS = 8;

function elomai_outbox_table() {
    global $wpdb;
    return $wpdb->prefix . 'elomai_outbox';
}

/** Creates or upgrades the queue table. Cheap: one option read when current. */
function elomai_outbox_install() {
    if (get_option('elomai_outbox_version') === ELOMAI_OUTBOX_VERSION) {
        return;
    }
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    $table = elomai_outbox_table();
    $charset = $wpdb->get_charset_collate();
    dbDelta(
        "CREATE TABLE {$table} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            post_id bigint(20) unsigned NOT NULL DEFAULT 0,
            event varchar(20) NOT NULL DEFAULT 'update',
            status varchar(20) NOT NULL DEFAULT 'pending',
            attempts int(10) unsigned NOT NULL DEFAULT 0,
            uuid varchar(64) NOT NULL DEFAULT '',
            lang varchar(5) NOT NULL DEFAULT '',
            translation_group varchar(64) NOT NULL DEFAULT '',
            content_hash char(64) NOT NULL DEFAULT '',
            version bigint(20) unsigned NOT NULL DEFAULT 0,
            next_attempt_at datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
            locked_at datetime NULL DEFAULT NULL,
            created_at datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
            updated_at datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
            last_error text NULL,
            PRIMARY KEY  (id),
            KEY status_next (status,next_attempt_at),
            KEY post_state (post_id,status)
        ) {$charset};"
    );
    update_option('elomai_outbox_version', ELOMAI_OUTBOX_VERSION, false);
}

/** UTC timestamp in the format the queue columns use. */
function elomai_outbox_now($offset = 0) {
    return gmdate('Y-m-d H:i:s', time() + (int) $offset);
}

/**
 * Adds (or refreshes) the job for one post.
 *
 * One active job per post and direction: a second publication event before the
 * first was sent must not create a second delivery. A job that is currently
 * being processed is never mutated; a fresh pending row is inserted instead so
 * the newer content cannot be lost.
 *
 * @return int|false Job id.
 */
function elomai_outbox_enqueue($post_id, $event = 'update') {
    $post_id = (int) $post_id;
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'post' || wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return false;
    }
    $event = in_array($event, ELOMAI_OUTBOX_EVENTS, true) ? $event : 'update';
    $offline = $event === 'unpublish';

    if (!$offline && $post->post_status !== 'publish') {
        // Drafts never enter the queue. A queued publication for a post that was
        // taken offline is cancelled so it cannot resurrect the article later.
        elomai_outbox_cancel_post($post_id, 'Beitrag ist nicht mehr veröffentlicht.');
        return false;
    }

    elomai_outbox_install();
    global $wpdb;
    $table = elomai_outbox_table();
    $now = elomai_outbox_now();

    // The operator is chosen from two literals, never interpolated from input;
    // binding it through prepare() would quote it and break the SQL.
    $direction = $offline ? "= 'unpublish'" : "<> 'unpublish'";

    // The opposite direction supersedes anything still waiting: publishing
    // cancels a pending unpublish and vice versa.
    $wpdb->query(
        $wpdb->prepare(
            "UPDATE {$table} SET status='cancelled', updated_at=%s, last_error=%s
             WHERE post_id=%d AND status IN ('pending','retry_scheduled','failed')
               AND event {$direction}",
            $now,
            'Durch ein neueres Ereignis ersetzt.',
            $post_id
        )
    );

    $existing = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT * FROM {$table} WHERE post_id=%d AND status IN ('pending','processing','retry_scheduled','failed')
               AND event {$direction} ORDER BY id DESC LIMIT 1",
            $post_id
        )
    );

    $uuid = function_exists('elomai_uuid') ? elomai_uuid($post_id) : '';
    $lang = function_exists('elomai_post_language') ? elomai_post_language($post_id) : '';
    $group = function_exists('elomai_translation_group_id') ? elomai_translation_group_id($post_id) : '';

    if ($existing && $existing->status !== 'processing') {
        $wpdb->update(
            $table,
            [
                'event' => $event,
                'status' => 'pending',
                'attempts' => 0,
                'uuid' => $uuid,
                'lang' => $lang,
                'translation_group' => $group,
                'next_attempt_at' => $now,
                'updated_at' => $now,
                'last_error' => '',
            ],
            ['id' => (int) $existing->id],
            ['%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s'],
            ['%d']
        );
        elomai_outbox_kick();
        return (int) $existing->id;
    }

    // A job is being processed right now (or there is none): add a new one.
    $wpdb->insert(
        $table,
        [
            'post_id' => $post_id,
            'event' => $event,
            'status' => 'pending',
            'attempts' => 0,
            'uuid' => $uuid,
            'lang' => $lang,
            'translation_group' => $group,
            'content_hash' => '',
            'version' => 0,
            'next_attempt_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
            'last_error' => '',
        ],
        ['%d', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s']
    );
    $id = (int) $wpdb->insert_id;
    elomai_outbox_kick();
    return $id ?: false;
}

/**
 * Re-queues the other published language editions of a post.
 *
 * Their pages carry the language switcher, the hreflang graph and the
 * "missing translation" state, so a change to one edition changes all of them.
 */
function elomai_outbox_enqueue_translation_group($post_id) {
    $post_id = (int) $post_id;
    if (!function_exists('elomai_translation_group')) {
        return;
    }
    foreach (elomai_translation_group($post_id) as $sibling_id) {
        if ((int) $sibling_id === $post_id) {
            continue;
        }
        $sibling = get_post($sibling_id);
        if (!$sibling || $sibling->post_type !== 'post' || $sibling->post_status !== 'publish') {
            continue;
        }
        elomai_outbox_enqueue($sibling_id, 'translation');
    }
}

/** Cancels waiting work for one post (used when it is no longer eligible). */
function elomai_outbox_cancel_post($post_id, $reason = '') {
    elomai_outbox_install();
    global $wpdb;
    $wpdb->query(
        $wpdb->prepare(
            "UPDATE " . elomai_outbox_table() . " SET status='cancelled', updated_at=%s, last_error=%s
             WHERE post_id=%d AND status IN ('pending','retry_scheduled','failed')",
            elomai_outbox_now(),
            (string) $reason,
            (int) $post_id
        )
    );
}

/**
 * Requests a worker run without blocking the editorial request.
 *
 * WordPress cron cannot run a second time while one is running, and a single
 * event only exists once per hook, so this is deliberately opportunistic: the
 * worker always re-schedules the earliest future attempt when it finishes.
 */
function elomai_outbox_kick() {
    if (defined('DOING_CRON') && DOING_CRON) {
        return;
    }
    if (!wp_next_scheduled('elomai_outbox_work')) {
        wp_schedule_single_event(time(), 'elomai_outbox_work');
    }
    if (function_exists('spawn_cron')) {
        spawn_cron();
    }
}

/** Schedules the next due job, if any, without duplicating an existing event. */
function elomai_outbox_schedule_next() {
    global $wpdb;
    $next = $wpdb->get_var(
        "SELECT MIN(next_attempt_at) FROM " . elomai_outbox_table() . "
         WHERE status IN ('pending','retry_scheduled','failed')"
    );
    if (!$next) {
        return;
    }
    $timestamp = max(time() + 1, strtotime($next . ' UTC'));
    if (!wp_next_scheduled('elomai_outbox_work')) {
        wp_schedule_single_event($timestamp, 'elomai_outbox_work');
    }
}

/** True when at least one job is ready to run now. */
function elomai_outbox_has_due() {
    // A plugin copied onto a running site has not been re-activated, so the
    // table (and its schema version) may still be missing on the first request.
    elomai_outbox_install();
    global $wpdb;
    $now = elomai_outbox_now();
    return (bool) $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM " . elomai_outbox_table() . "
             WHERE status IN ('pending','retry_scheduled') AND next_attempt_at <= %s LIMIT 1",
            $now
        )
    );
}

/** Jobs that were claimed but never finished (PHP timeout, container stop). */
function elomai_outbox_recover_stale() {
    global $wpdb;
    $cutoff = elomai_outbox_now(-15 * MINUTE_IN_SECONDS);
    $wpdb->query(
        $wpdb->prepare(
            "UPDATE " . elomai_outbox_table() . "
             SET status='retry_scheduled', locked_at=NULL, next_attempt_at=%s, last_error=%s
             WHERE status='processing' AND (locked_at IS NULL OR locked_at < %s)",
            elomai_outbox_now(),
            'Worker wurde unterbrochen – erneut eingeplant.',
            $cutoff
        )
    );
}

/** Bounded exponential backoff with jitter, capped at six hours. */
function elomai_outbox_delay($attempts) {
    $steps = [60, 300, 900, 3600, 21600];
    $base = $steps[min(max(1, (int) $attempts) - 1, count($steps) - 1)];
    $jitter = (int) round($base * (mt_rand(-10, 10) / 100));
    return max(30, $base + $jitter);
}

/**
 * Atomically claims one due job.
 *
 * `failed` jobs are still retried on the slow lane, so a long offline period
 * recovers without a human clicking anything.
 */
function elomai_outbox_claim() {
    global $wpdb;
    $table = elomai_outbox_table();
    $now = elomai_outbox_now();

    $id = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$table} WHERE status IN ('pending','retry_scheduled') AND next_attempt_at <= %s
             ORDER BY next_attempt_at ASC, id ASC LIMIT 1",
            $now
        )
    );
    if (!$id) {
        $id = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM {$table} WHERE status='failed' AND next_attempt_at <= %s
                 ORDER BY next_attempt_at ASC, id ASC LIMIT 1",
                $now
            )
        );
    }
    if (!$id) {
        return null;
    }

    $claimed = $wpdb->query(
        $wpdb->prepare(
            "UPDATE {$table} SET status='processing', locked_at=%s, updated_at=%s
             WHERE id=%d AND status IN ('pending','retry_scheduled','failed')",
            $now,
            $now,
            $id
        )
    );
    if (!$claimed) {
        return null;
    }
    return $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id=%d", $id));
}

/** Writes the final state of one job. */
function elomai_outbox_finish($job, $status, array $data = []) {
    global $wpdb;
    $wpdb->update(
        elomai_outbox_table(),
        array_merge(
            [
                'status' => $status,
                'locked_at' => null,
                'updated_at' => elomai_outbox_now(),
                'next_attempt_at' => elomai_outbox_now(),
            ],
            $data
        ),
        ['id' => (int) $job->id]
    );
}

/**
 * Schedules a retry, or records a permanent failure.
 *
 * A permanent failure stays in the table with a slow retry interval and a
 * visible error, so it is recoverable through the dashboard or WP-CLI.
 */
function elomai_outbox_retry($job, $error, $permanent = false) {
    $attempts = (int) $job->attempts + 1;
    $delay = elomai_outbox_delay($attempts);
    $status = $permanent || $attempts >= ELOMAI_OUTBOX_MAX_FAST_ATTEMPTS ? 'failed' : 'retry_scheduled';
    elomai_outbox_finish(
        $job,
        $status,
        [
            'attempts' => $attempts,
            'last_error' => mb_substr((string) $error, 0, 1000),
            'next_attempt_at' => elomai_outbox_now($delay),
        ]
    );
    elomai_log(
        'outbox_retry',
        sprintf('Versuch %d fehlgeschlagen, nächster Versuch in %d s: %s', $attempts, $delay, (string) $error),
        (int) $job->post_id,
        ['event' => $job->event, 'status' => $status]
    );
}

/** Runs one claimed job. */
function elomai_outbox_run($job) {
    $post_id = (int) $job->post_id;
    $post = get_post($post_id);

    if (!$post || $post->post_type !== 'post') {
        elomai_outbox_finish($job, 'cancelled', ['last_error' => 'Beitrag existiert nicht mehr.']);
        return;
    }

    if ($job->event === 'unpublish') {
        if ($post->post_status === 'publish') {
            elomai_outbox_finish($job, 'cancelled', ['last_error' => 'Beitrag ist wieder veröffentlicht.']);
            return;
        }
        $result = elomai_unpublish_post($post_id);
        if (($result['status'] ?? '') === 'unpublished' || ($result['status'] ?? '') === 'skipped') {
            elomai_outbox_finish($job, 'synchronized', [
                'attempts' => 0,
                'last_error' => '',
                'version' => (int) get_post_meta($post_id, '_elomai_version', true),
            ]);
            return;
        }
        $retryable = !isset($result['http']) || $result['http'] === 0 || $result['http'] === 429 || $result['http'] >= 500;
        elomai_outbox_retry($job, $result['message'] ?? 'Offline-Nahme fehlgeschlagen', !$retryable);
        return;
    }

    if ($post->post_status !== 'publish') {
        elomai_outbox_finish($job, 'cancelled', ['last_error' => 'Beitrag ist nicht mehr veröffentlicht.']);
        return;
    }

    $before = $post->post_modified_gmt . '|' . $post->post_status;
    $result = elomai_sync_post($post_id, true);
    $status = $result['status'] ?? 'failed';

    if ($status === 'synced' || $status === 'unchanged') {
        $state = elomai_sync_state($post_id);
        elomai_outbox_finish(
            $job,
            'synchronized',
            [
                'attempts' => 0,
                'last_error' => '',
                'version' => (int) ($state['version'] ?? 0),
                'content_hash' => (string) ($state['last_hash'] ?? ''),
                'uuid' => (string) elomai_uuid($post_id),
                'lang' => (string) elomai_post_language($post_id),
                'translation_group' => (string) elomai_translation_group_id($post_id),
            ]
        );

        // Content changed while the request was in flight: queue one more run
        // so the receiver ends up with the newest version, not the one we sent.
        $after_post = get_post($post_id);
        $after = $after_post ? $after_post->post_modified_gmt . '|' . $after_post->post_status : '';
        if ($after !== $before) {
            elomai_outbox_enqueue($post_id, 'update');
        }
        return;
    }

    if ($status === 'busy') {
        elomai_outbox_retry($job, 'Synchronisierung läuft bereits – erneut eingeplant.');
        return;
    }

    $http = (int) ($result['http'] ?? 0);
    $code = (string) ($result['code'] ?? '');
    $message = (string) ($result['message'] ?? 'Synchronisierung fehlgeschlagen');

    // A receiver that already holds a newer version means our payload is
    // outdated: bump the version and try again straight away.
    if ($code === 'stale_version' || $code === 'version_conflict') {
        $version = max(1, (int) get_post_meta($post_id, '_elomai_version', true)) + 1;
        update_post_meta($post_id, '_elomai_version', $version);
        elomai_set_sync_state($post_id, ['status' => 'pending', 'version' => $version, 'last_error' => $message]);
        elomai_outbox_retry($job, 'Empfänger hat eine neuere Version – mit Version ' . $version . ' erneut versucht.');
        return;
    }

    if ($code === 'translation_conflict') {
        elomai_outbox_retry($job, $message, true);
        return;
    }

    $permanent = in_array($http, [400, 401, 403, 404, 409, 422], true);
    elomai_outbox_retry($job, $message, $permanent);
}

/**
 * Drains due jobs. Safe to call from cron, admin screens and WP-CLI.
 *
 * @return int Number of processed jobs.
 */
function elomai_outbox_work($limit = 5) {
    if (get_transient('elomai_outbox_worker')) {
        return 0;
    }
    set_transient('elomai_outbox_worker', 1, 5 * MINUTE_IN_SECONDS);
    $processed = 0;
    try {
        elomai_outbox_install();
        elomai_outbox_recover_stale();
        $deadline = microtime(true) + 45;
        while ($processed < max(1, (int) $limit) && microtime(true) < $deadline) {
            $job = elomai_outbox_claim();
            if (!$job) {
                break;
            }
            try {
                elomai_outbox_run($job);
            } catch (Throwable $error) {
                // A fatal must not leave the row stuck in "processing": the
                // job is released with its error and retried like any other.
                elomai_outbox_retry(
                    $job,
                    'Unerwarteter Fehler: ' . $error->getMessage()
                );
            }
            $processed++;
        }
    } finally {
        delete_transient('elomai_outbox_worker');
        elomai_outbox_schedule_next();
    }
    return $processed;
}

/** Newest job for a post, for the dashboard and the list table. */
function elomai_outbox_latest($post_id) {
    global $wpdb;
    return $wpdb->get_row(
        $wpdb->prepare(
            "SELECT * FROM " . elomai_outbox_table() . " WHERE post_id=%d ORDER BY id DESC LIMIT 1",
            (int) $post_id
        )
    );
}

/** Queue counters, used by the dashboard and the health column. */
function elomai_outbox_stats() {
    global $wpdb;
    $rows = $wpdb->get_results(
        "SELECT status, COUNT(*) AS n FROM " . elomai_outbox_table() . " GROUP BY status"
    );
    $stats = ['pending' => 0, 'processing' => 0, 'retry_scheduled' => 0, 'synchronized' => 0, 'failed' => 0, 'cancelled' => 0];
    foreach ((array) $rows as $row) {
        $stats[$row->status] = (int) $row->n;
    }
    return $stats;
}

/** Most recent jobs for the dashboard panel. */
function elomai_outbox_recent($limit = 10) {
    global $wpdb;
    return $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM " . elomai_outbox_table() . " ORDER BY id DESC LIMIT %d",
            (int) $limit
        )
    );
}

/** Manual retry: forget the backoff and drain the post's job now. */
function elomai_outbox_retry_now($post_id) {
    $post_id = (int) $post_id;
    $job = elomai_outbox_latest($post_id);
    if ($job && in_array($job->status, ['failed', 'retry_scheduled', 'pending'], true)) {
        global $wpdb;
        $wpdb->update(
            elomai_outbox_table(),
            ['status' => 'pending', 'attempts' => 0, 'last_error' => '', 'next_attempt_at' => elomai_outbox_now()],
            ['id' => (int) $job->id]
        );
    } else {
        elomai_outbox_enqueue($post_id, 'manual');
    }
    delete_transient('elomai_outbox_worker');
    return elomai_outbox_work(1);
}

/* ----------------------------------------------------------------- hooks */

/**
 * Drains due work at the end of a normal request.
 *
 * WordPress cron needs a loopback HTTP request to itself, which fails in some
 * local setups (and on any machine that is offline). Without this, a queued
 * job would only move when the editor happened to click something. Running at
 * shutdown keeps the queue moving on any page view — including the very
 * request that saved the post — while the editor's response is already built.
 * At most one job runs per request, so a slow receiver can delay one page by
 * one request at most and can never build a backlog.
 */
add_action('shutdown', function () {
    if ((defined('DOING_CRON') && DOING_CRON) || wp_installing()) {
        return;
    }
    if (get_transient('elomai_outbox_worker')) {
        return;
    }
    if (!elomai_outbox_has_due()) {
        return;
    }
    elomai_outbox_work(1);
}, 1);

add_action('elomai_outbox_work', function () {
    elomai_outbox_work(10);
});

/** Any request after a long offline period resumes the queue. */
add_action('init', function () {
    if (wp_installing() || (defined('DOING_CRON') && DOING_CRON)) {
        return;
    }
    elomai_outbox_install();
    if (get_transient('elomai_outbox_nudge')) {
        return;
    }
    set_transient('elomai_outbox_nudge', 1, 5 * MINUTE_IN_SECONDS);
    if (elomai_outbox_has_due()) {
        elomai_outbox_kick();
    }
}, 20);

add_action('admin_init', function () {
    elomai_outbox_install();
    if (get_transient('elomai_outbox_admin_nudge')) {
        return;
    }
    set_transient('elomai_outbox_admin_nudge', 1, 30);
    if (elomai_outbox_has_due()) {
        elomai_outbox_kick();
    }
});

/** Deleted posts must not stay in the queue. */
add_action('before_delete_post', function ($post_id) {
    elomai_outbox_cancel_post($post_id, 'Beitrag wurde gelöscht.');
});

/** Queue maintenance: drop synchronized history after 30 days. */
add_action('elomai_outbox_prune', function () {
    global $wpdb;
    $wpdb->query(
        $wpdb->prepare(
            "DELETE FROM " . elomai_outbox_table() . " WHERE status IN ('synchronized','cancelled') AND updated_at < %s",
            elomai_outbox_now(-30 * DAY_IN_SECONDS)
        )
    );
}, 10, 0);
