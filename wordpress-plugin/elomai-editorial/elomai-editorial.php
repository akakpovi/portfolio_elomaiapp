<?php
/**
 * Plugin Name:       EL0M Editorial — WordPress to elomaiapp.com
 * Plugin URI:        https://elomaiapp.com/
 * Description:       Editorial dashboard, DE/EN/FR articles, SEO fields, authenticated synchronisation to the public React portfolio, social post drafts and Matomo performance reporting. WordPress stays private; the public site only receives pre-rendered content.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            Elom Akakpovi
 * License:           GPL-2.0-or-later
 * Text Domain:       elomai
 */

defined('ABSPATH') || exit;

define('ELOMAI_VERSION', '1.0.0');
define('ELOMAI_DIR', plugin_dir_path(__FILE__));
define('ELOMAI_URL', plugin_dir_url(__FILE__));
define('ELOMAI_PATH', __FILE__);
define('ELOMAI_LANGS', ['en', 'de', 'fr']);
define('ELOMAI_PUBLIC_BASE', 'https://elomaiapp.com');
define('ELOMAI_FREELANCER', 'https://www.freelancer.com/u/eakakpovi656');
define('ELOMAI_CONTACT_EMAIL', 'ekakpovi656@gmail.com');
define('ELOMAI_SEO_PAGE', 'elomai-performance');

/* --------------------------------------------------------------- options */

/** Settings with safe defaults. Secrets are never rendered back to the browser. */
function elomai_option($key, $default = null) {
    $settings = get_option('elomai_settings', []);
    if (is_array($settings) && array_key_exists($key, $settings) && $settings[$key] !== '') {
        return $settings[$key];
    }
    return $default;
}

function elomai_update_option($key, $value) {
    $settings = get_option('elomai_settings', []);
    if (!is_array($settings)) {
        $settings = [];
    }
    $settings[$key] = $value;
    update_option('elomai_settings', $settings, false);
}

function elomai_endpoint() {
    return (string) elomai_option('endpoint', ELOMAI_PUBLIC_BASE . '/content-api/v1/sync');
}

/**
 * Shared HMAC secret. A wp-config.php constant wins so the value can live
 * outside the database; the option is the fallback for a fresh install.
 */
function elomai_sync_secret() {
    if (defined('ELOMAI_SYNC_SECRET') && ELOMAI_SYNC_SECRET) {
        return (string) ELOMAI_SYNC_SECRET;
    }
    return (string) elomai_option('secret', '');
}

function elomai_insecure_endpoint_allowed() {
    return (bool) elomai_option('allow_insecure_local', false);
}

/* ---------------------------------------------------------------- helpers */

function elomai_post_language($post_id) {
    $terms = wp_get_post_terms((int) $post_id, 'language', ['fields' => 'slugs']);
    if (is_array($terms)) {
        foreach ($terms as $slug) {
            if (in_array($slug, ELOMAI_LANGS, true)) {
                return $slug;
            }
        }
    }
    return 'en';
}

function elomai_translation_source($post_id) {
    return (int) get_post_meta((int) $post_id, '_presence_translation_of', true);
}

/**
 * Resolves the root of a translation chain.
 *
 * Returns 0 when the chain is cyclic or points at itself: an invalid
 * relationship must never become a group, because that would merge unrelated
 * articles into one language edition.
 */
function elomai_translation_root($post_id) {
    $post_id = (int) $post_id;
    $seen = [];
    $cursor = $post_id;
    $guard = 0;
    while ($cursor > 0 && $guard++ < 20) {
        if (isset($seen[$cursor])) {
            return 0;
        }
        $seen[$cursor] = true;
        $parent = elomai_translation_source($cursor);
        if (!$parent || $parent === $cursor) {
            break;
        }
        $cursor = $parent;
    }
    return $cursor;
}

/**
 * Stable translation-group identity: the UUID of the root article.
 *
 * Deliberately not derived from a slug, a title or a language term, so renaming
 * an article never splits its group and reusing a slug never joins two groups.
 */
function elomai_translation_group_id($post_id) {
    $root = elomai_translation_root($post_id);
    if ($root < 1) {
        return '';
    }
    return (string) elomai_uuid($root);
}

/** Language group: the root post plus every post that resolves to it. */
function elomai_translation_group($post_id) {
    $root = elomai_translation_root($post_id);
    if ($root < 1) {
        return [(int) $post_id];
    }
    $ids = [$root];
    $declared = get_posts([
        'post_type' => 'post',
        'post_status' => ['publish', 'draft', 'future', 'pending', 'private'],
        'posts_per_page' => 50,
        'meta_query' => [[
            'key' => '_presence_translation_of',
            'compare' => 'EXISTS',
        ]],
        'fields' => 'ids',
    ]);
    foreach ($declared as $candidate_id) {
        if (elomai_translation_root($candidate_id) === $root) {
            $ids[] = (int) $candidate_id;
        }
    }
    return array_values(array_unique($ids));
}

/** Language editions of one group: lang => list of [id, status]. */
function elomai_translation_languages($post_id) {
    $map = [];
    foreach (elomai_translation_group($post_id) as $id) {
        $post = get_post($id);
        if (!$post) {
            continue;
        }
        $map[elomai_post_language($id)][] = ['id' => (int) $id, 'status' => $post->post_status];
    }
    return $map;
}

/** Languages with no article at all in this group. */
function elomai_missing_translations($post_id) {
    $present = elomai_translation_languages($post_id);
    return array_values(array_diff(ELOMAI_LANGS, array_keys($present)));
}

/** Languages that appear more than once in one group. */
function elomai_translation_conflicts($post_id) {
    $conflicts = [];
    foreach (elomai_translation_languages($post_id) as $lang => $entries) {
        if (count($entries) > 1) {
            $conflicts[] = $lang;
        }
    }
    return $conflicts;
}

function elomai_sync_state($post_id) {
    $state = get_post_meta((int) $post_id, '_elomai_sync', true);
    return is_array($state) ? $state : [];
}

function elomai_set_sync_state($post_id, array $data) {
    $current = elomai_sync_state($post_id);
    update_post_meta((int) $post_id, '_elomai_sync', array_merge($current, $data));
}

function elomai_public_url($post_id) {
    return (string) get_post_meta((int) $post_id, '_elomai_public_url', true);
}

function elomai_uuid($post_id) {
    $uuid = (string) get_post_meta((int) $post_id, '_elomai_uuid', true);
    if (!$uuid) {
        $uuid = wp_generate_uuid4();
        update_post_meta((int) $post_id, '_elomai_uuid', $uuid);
    }
    return $uuid;
}

/** Human readable synchronisation status used by the dashboard and columns. */
function elomai_status($post_id) {
    $post = get_post($post_id);
    if (!$post) {
        return ['key' => 'unknown', 'label' => 'Unbekannt', 'tone' => 'muted'];
    }
    $state = elomai_sync_state($post_id);
    $key = $state['status'] ?? '';
    // The queue is the source of truth for what still has to happen; post meta
    // only records the last acknowledged transfer.
    $job = function_exists('elomai_outbox_latest') ? elomai_outbox_latest($post_id) : null;
    $queued = $job ? (string) $job->status : '';

    if ($post->post_status === 'trash' || $key === 'unpublish_pending') {
        return ['key' => 'unpublish_pending', 'label' => 'Wird offline genommen', 'tone' => 'warn'];
    }
    if ($queued === 'failed') {
        return ['key' => 'failed', 'label' => 'Synchronisierung fehlgeschlagen', 'tone' => 'error'];
    }
    if (in_array($queued, ['pending', 'processing', 'retry_scheduled'], true)) {
        return ['key' => 'pending', 'label' => 'Synchronisierung ausstehend', 'tone' => 'warn'];
    }
    if ($key === 'failed') {
        return ['key' => 'failed', 'label' => 'Synchronisierung fehlgeschlagen', 'tone' => 'error'];
    }
    if ($key === 'pending') {
        return ['key' => 'pending', 'label' => 'Synchronisierung ausstehend', 'tone' => 'warn'];
    }
    if ($key === 'synced') {
        return ['key' => 'synced', 'label' => 'Synchronisiert', 'tone' => 'ok'];
    }
    if ($post->post_status === 'publish') {
        return ['key' => 'published', 'label' => 'Veröffentlicht (nicht synchronisiert)', 'tone' => 'warn'];
    }
    if ($post->post_status === 'future') {
        return ['key' => 'scheduled', 'label' => 'Geplant', 'tone' => 'info'];
    }
    if ($post->post_status === 'draft') {
        return ['key' => 'draft', 'label' => 'Entwurf', 'tone' => 'muted'];
    }
    return ['key' => $post->post_status, 'label' => ucfirst($post->post_status), 'tone' => 'muted'];
}

/** Bounded activity log for synchronisation events. */
function elomai_log($action, $message, $post_id = 0, array $extra = []) {
    $log = get_option('elomai_sync_log', []);
    if (!is_array($log)) {
        $log = [];
    }
    array_unshift($log, array_merge([
        'time' => current_time('mysql', true),
        'action' => (string) $action,
        'post_id' => (int) $post_id,
        'title' => $post_id ? get_the_title($post_id) : '',
        'message' => (string) $message,
    ], $extra));
    update_option('elomai_sync_log', array_slice($log, 0, 200), false);
}

/** Reading time from the rendered content, matching the public renderer. */
function elomai_reading_minutes($html) {
    $text = wp_strip_all_tags((string) $html);
    $words = str_word_count($text);
    if ($words < 20) {
        $words = count(preg_split('/\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY));
    }
    return max(1, (int) round($words / 200));
}

/* ------------------------------------------------------------------ setup */

/** Category tree: five editorial pillars with only the subcategories we actually use. */
function elomai_default_categories() {
    return [
        'Artificial Intelligence & LLM' => [
            'slug' => 'artificial-intelligence-llm',
            'children' => [
                'Local AI' => 'local-ai',
                'LLM Integration' => 'llm-integration',
                'RAG' => 'rag',
                'AI Agents' => 'ai-agents',
            ],
        ],
        'Full-Stack Development' => [
            'slug' => 'full-stack-development',
            'children' => [
                'Python' => 'python',
                'React' => 'react',
                'APIs' => 'apis',
            ],
        ],
        'DevOps & Cloud Infrastructure' => [
            'slug' => 'devops-cloud-infrastructure',
            'children' => [
                'Docker' => 'docker',
                'Linux & VPS' => 'linux-vps',
                'Terraform & OpenTofu' => 'terraform-opentofu',
            ],
        ],
        'Cybersecurity & Monitoring' => [
            'slug' => 'cybersecurity-monitoring',
            'children' => [
                'Web Security' => 'web-security',
                'Security Automation' => 'security-automation',
                'Website Monitoring' => 'website-monitoring',
            ],
        ],
        'Projects & Case Studies' => [
            'slug' => 'projects-case-studies',
            'children' => [
                'AKA IA' => 'aka-ia',
                'Presence' => 'presence',
                'Afro-Haar-App' => 'afro-haar-app',
                'EcoVision' => 'ecovision',
            ],
        ],
    ];
}

function elomai_install_taxonomies() {
    foreach (elomai_default_categories() as $name => $data) {
        $parent = term_exists($data['slug'], 'category');
        if (!$parent) {
            $parent = wp_insert_term($name, 'category', ['slug' => $data['slug']]);
        }
        if (is_wp_error($parent) || !$parent) {
            continue;
        }
        $parent_id = is_array($parent) ? (int) $parent['term_id'] : (int) $parent;
        foreach ($data['children'] as $child_name => $child_slug) {
            if (term_exists($child_slug, 'category')) {
                continue;
            }
            wp_insert_term($child_name, 'category', ['slug' => $child_slug, 'parent' => $parent_id]);
        }
    }

    // Language terms beyond the two the legacy mu-plugin created.
    foreach (ELOMAI_LANGS as $code) {
        if (!term_exists($code, 'language')) {
            wp_insert_term(strtoupper($code), 'language', ['slug' => $code]);
        }
    }
}

function elomai_activate() {
    elomai_install_taxonomies();
    elomai_outbox_install();

    $settings = get_option('elomai_settings', []);
    if (!is_array($settings)) {
        $settings = [];
    }
    if (empty($settings['secret'])) {
        $settings['secret'] = bin2hex(random_bytes(32));
    }
    $settings += [
        'endpoint' => ELOMAI_PUBLIC_BASE . '/content-api/v1/sync',
        'comments_endpoint' => ELOMAI_PUBLIC_BASE . '/content-api/comments/v1/wp',
        'allow_insecure_local' => false,
        'matomo_url' => ELOMAI_PUBLIC_BASE . '/matomo/',
        'matomo_site_id' => '1',
        'matomo_refresh_hours' => 6,
        'matomo_token' => '',
        'gsc_client_id' => '',
        'gsc_client_secret' => '',
        'gsc_refresh_token' => '',
        'gsc_site' => ELOMAI_PUBLIC_BASE . '/',
    ];
    update_option('elomai_settings', $settings, false);

    if (!wp_next_scheduled('elomai_retry_queue')) {
        wp_schedule_event(time() + 300, 'hourly', 'elomai_retry_queue');
    }
    // A worker run right after activation drains anything left from before.
    if (!wp_next_scheduled('elomai_outbox_work')) {
        wp_schedule_single_event(time() + 60, 'elomai_outbox_work');
    }
    if (!wp_next_scheduled(ELOMAI_COMMENTS_CRON)) {
        wp_schedule_event(time() + 120, 'elomai_five_minutes', ELOMAI_COMMENTS_CRON);
    }
    if (!wp_next_scheduled('elomai_analytics_refresh')) {
        wp_schedule_event(time() + 600, 'elomai_six_hours', 'elomai_analytics_refresh');
    }
    elomai_install_taxonomies();
}
register_activation_hook(__FILE__, 'elomai_activate');

register_deactivation_hook(__FILE__, function () {
    wp_clear_scheduled_hook('elomai_retry_queue');
    wp_clear_scheduled_hook('elomai_outbox_work');
    wp_clear_scheduled_hook('elomai_analytics_refresh');
    wp_clear_scheduled_hook(ELOMAI_COMMENTS_CRON);
    wp_clear_scheduled_hook(ELOMAI_COMMENTS_FLUSH);
});

add_filter('cron_schedules', function ($schedules) {
    $schedules['elomai_six_hours'] = [
        'interval' => 6 * HOUR_IN_SECONDS,
        'display' => 'Alle 6 Stunden (EL0M Analytics)',
    ];
    return $schedules;
});

/**
 * The legacy mu-plugin registers the `language` taxonomy for de/en. When it is
 * absent (fresh install), register it here so the plugin stands on its own.
 */
add_action('init', function () {
    if (!taxonomy_exists('language')) {
        register_taxonomy('language', ['post'], [
            'label' => 'Sprache / Language',
            'public' => true,
            'hierarchical' => false,
            'show_in_rest' => true,
            'show_admin_column' => true,
            'rewrite' => ['slug' => 'sprache'],
            'capabilities' => [
                'manage_terms' => 'edit_posts',
                'edit_terms' => 'edit_posts',
                'delete_terms' => 'edit_posts',
                'assign_terms' => 'edit_posts',
            ],
        ]);
    }

    // Installing terms on every request would be wasteful; run it once per
    // plugin version and whenever an administrator asks for a repair.
    if (get_option('elomai_taxonomies_ready') !== ELOMAI_VERSION) {
        elomai_install_taxonomies();
        update_option('elomai_taxonomies_ready', ELOMAI_VERSION, false);
    }
}, 5);

/* --------------------------------------------------------------- includes */

require_once ELOMAI_DIR . 'inc/article.php';
require_once ELOMAI_DIR . 'inc/payload.php';
require_once ELOMAI_DIR . 'inc/sync.php';
require_once ELOMAI_DIR . 'inc/outbox.php';
require_once ELOMAI_DIR . 'inc/comments.php';
require_once ELOMAI_DIR . 'inc/dashboard.php';
require_once ELOMAI_DIR . 'inc/social.php';
require_once ELOMAI_DIR . 'inc/analytics.php';
require_once ELOMAI_DIR . 'inc/calendar.php';

if (defined('WP_CLI') && WP_CLI) {
    require_once ELOMAI_DIR . 'inc/cli.php';
}

/** Admin styles shared by every screen of the plugin. */
add_action('admin_enqueue_scripts', function ($hook) {
    $is_plugin_screen = strpos((string) $hook, 'elomai') !== false;
    $screen = get_current_screen();
    $is_post_screen = $screen && in_array($screen->base, ['post'], true);
    if (!$is_plugin_screen && !$is_post_screen) {
        return;
    }
    wp_enqueue_style('elomai-admin', ELOMAI_URL . 'assets/admin.css', [], ELOMAI_VERSION);
    wp_enqueue_script('elomai-admin', ELOMAI_URL . 'assets/admin.js', [], ELOMAI_VERSION, true);
});
