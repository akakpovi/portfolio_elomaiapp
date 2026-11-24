<?php
/**
 * Editorial dashboard, synchronisation log and plugin settings.
 */

defined('ABSPATH') || exit;

add_action('admin_menu', function () {
    add_menu_page(
        'EL0M Blog',
        'EL0M Blog',
        'edit_posts',
        'elomai-editorial',
        'elomai_render_dashboard',
        'dashicons-welcome-write-blog',
        3
    );
    add_submenu_page('elomai-editorial', 'Editorial', 'Editorial', 'edit_posts', 'elomai-editorial', 'elomai_render_dashboard');
    add_submenu_page('elomai-editorial', 'SEO & Content Performance', 'SEO & Performance', 'edit_posts', 'elomai-performance', 'elomai_render_performance');
    add_submenu_page('elomai-editorial', 'Kalender & Backlog', 'Kalender & Backlog', 'edit_posts', 'elomai-calendar', 'elomai_render_calendar');
    add_submenu_page('elomai-editorial', 'Synchronisations-Protokoll', 'Sync-Protokoll', 'manage_options', 'elomai-log', 'elomai_render_log');
    add_submenu_page('elomai-editorial', 'Einstellungen', 'Einstellungen', 'manage_options', 'elomai-settings', 'elomai_render_settings');
});

/** Counts used by both the dashboard and the log header. */
function elomai_stats() {
    $counts = ['publish' => 0, 'draft' => 0, 'future' => 0, 'pending' => 0, 'private' => 0];
    $post_counts = wp_count_posts('post');
    foreach (array_keys($counts) as $status) {
        $counts[$status] = (int) ($post_counts->$status ?? 0);
    }

    $by_language = array_fill_keys(ELOMAI_LANGS, 0);
    $sync = ['pending' => 0, 'synced' => 0, 'failed' => 0, 'never' => 0];
    $last_sync = '';

    $posts = get_posts([
        'post_type' => 'post',
        'post_status' => ['publish', 'draft', 'future', 'pending', 'private'],
        'posts_per_page' => 200,
        'orderby' => 'modified',
        'order' => 'DESC',
    ]);

    foreach ($posts as $post) {
        $lang = elomai_post_language($post->ID);
        $by_language[$lang] = ($by_language[$lang] ?? 0) + 1;
        $state = elomai_sync_state($post->ID);
        $status = $state['status'] ?? '';
        if ($status === 'synced') {
            $sync['synced']++;
            if (!empty($state['last_success']) && $state['last_success'] > $last_sync) {
                $last_sync = $state['last_success'];
            }
        } elseif (in_array($status, ['pending', 'failed'], true)) {
            $sync[$status]++;
        } elseif ($post->post_status === 'publish') {
            $sync['never']++;
        }
    }

    return [
        'counts' => $counts,
        'languages' => $by_language,
        'sync' => $sync,
        'last_sync' => $last_sync,
        'posts' => $posts,
    ];
}

function elomai_render_dashboard() {
    $stats = elomai_stats();
    $queue = elomai_outbox_stats();
    $filter = isset($_GET['lang']) ? sanitize_key(wp_unslash($_GET['lang'])) : '';
    $view = isset($_GET['view']) ? sanitize_key(wp_unslash($_GET['view'])) : 'all';

    $rows = array_values(array_filter($stats['posts'], function ($post) use ($filter, $view) {
        if ($filter && elomai_post_language($post->ID) !== $filter) {
            return false;
        }
        $status = elomai_status($post->ID);
        if ($view === 'pending' && !in_array($status['key'], ['pending', 'failed', 'published'], true)) {
            return false;
        }
        if ($view === 'synced' && $status['key'] !== 'synced') {
            return false;
        }
        return true;
    }));

    $secret = elomai_sync_secret();
    ?>
    <div class="wrap elomai-wrap">
        <h1>EL0M Editorial</h1>
        <p class="elomai-lead">
            WordPress ist die redaktionelle Quelle. Veröffentlichte Artikel werden signiert an
            <strong>elomaiapp.com</strong> übertragen und dort als statische Seiten ausgeliefert – unabhängig davon,
            ob dieser Rechner eingeschaltet ist.
        </p>

        <?php if ($secret === '') : ?>
            <div class="notice notice-error"><p>Kein Sync-Geheimnis konfiguriert – Veröffentlichungen können nicht übertragen werden. <a href="<?php echo esc_url(admin_url('admin.php?page=elomai-settings')); ?>">Einstellungen öffnen</a></p></div>
        <?php endif; ?>

        <div class="elomai-cards">
            <?php
            $cards = [
                ['Artikel gesamt', array_sum($stats['counts']), ''],
                ['Veröffentlicht', $stats['counts']['publish'], 'ok'],
                ['Entwürfe', $stats['counts']['draft'], ''],
                ['Geplant', $stats['counts']['future'], 'info'],
                ['Synchronisiert', $stats['sync']['synced'], 'ok'],
                ['Ausstehend / Fehler', $stats['sync']['pending'] + $stats['sync']['failed'], ($stats['sync']['failed'] ? 'error' : 'warn')],
                ['Warteschlange', $queue['pending'] + $queue['retry_scheduled'] + $queue['processing'], 'info'],
                ['Fehlgeschlagen', $queue['failed'], ($queue['failed'] ? 'error' : '')],
            ];
            foreach ($cards as $card) {
                printf(
                    '<div class="elomai-card elomai-card--%s"><span class="elomai-card-label">%s</span><strong>%s</strong></div>',
                    esc_attr($card[2]),
                    esc_html($card[0]),
                    esc_html((string) $card[1])
                );
            }
            ?>
        </div>

        <div class="elomai-grid">
            <section class="elomai-panel">
                <h2>Nach Sprache</h2>
                <ul class="elomai-bars">
                    <?php
                    $max = max(1, max($stats['languages']));
                    foreach ($stats['languages'] as $lang => $count) :
                        $width = (int) round(($count / $max) * 100);
                        ?>
                        <li>
                            <span class="elomai-lang"><?php echo esc_html(strtoupper($lang)); ?></span>
                            <span class="elomai-bar"><span style="width:<?php echo esc_attr($width); ?>%"></span></span>
                            <strong><?php echo esc_html((string) $count); ?></strong>
                        </li>
                    <?php endforeach; ?>
                </ul>
                <p class="elomai-muted">Letzte erfolgreiche Synchronisierung:
                    <strong><?php echo esc_html($stats['last_sync'] ?: 'noch keine'); ?></strong>
                </p>
            </section>

            <section class="elomai-panel">
                <h2>Schnellzugriff</h2>
                <p><a class="button button-primary" href="<?php echo esc_url(admin_url('post-new.php')); ?>">Neuen Artikel schreiben</a></p>
                <p><a class="button" href="<?php echo esc_url(admin_url('admin.php?page=elomai-calendar')); ?>">Redaktionskalender</a></p>
                <p><a class="button" href="<?php echo esc_url(admin_url('admin.php?page=elomai-performance')); ?>">Website-Performance (Matomo)</a></p>
                <p><a class="button" href="<?php echo esc_url(admin_url('admin.php?page=elomai-log')); ?>">Sync-Protokoll</a></p>
                <p class="elomai-muted">Entwürfe verlassen WordPress nie. Erst mit dem Status „Veröffentlicht“ startet die Übertragung.</p>
            </section>
        </div>

        <section class="elomai-panel">
            <h2>Synchronisations-Warteschlange</h2>
            <?php
            $recent = elomai_outbox_recent(8);
            ?>
            <p class="elomai-muted">
                Dauerhafte Warteschlange: Ein Auftrag überlebt Neustarts, Offline-Zeiten und Empfänger-Ausfälle.
                Fehlgeschlagene Aufträge werden mit wachsenden Abständen automatisch erneut versucht.
            </p>
            <p>
                <a class="button button-primary" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=elomai_outbox_run'), 'elomai_outbox_run')); ?>">
                    Warteschlange jetzt verarbeiten
                </a>
            </p>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th style="width:70px">Job</th>
                        <th>Artikel</th>
                        <th style="width:100px">Sprache</th>
                        <th style="width:130px">Ereignis</th>
                        <th style="width:140px">Status</th>
                        <th style="width:80px">Versuche</th>
                        <th style="width:160px">Nächster Versuch (UTC)</th>
                        <th>Letzter Fehler</th>
                    </tr>
                </thead>
                <tbody>
                <?php if (!$recent) : ?>
                    <tr><td colspan="8">Noch keine Aufträge.</td></tr>
                <?php endif; ?>
                <?php foreach ($recent as $job) : ?>
                    <tr>
                        <td>#<?php echo esc_html((string) $job->id); ?></td>
                        <td><?php echo esc_html(get_the_title((int) $job->post_id) ?: ('#' . (int) $job->post_id)); ?></td>
                        <td><?php echo esc_html(strtoupper((string) $job->lang)); ?></td>
                        <td><code><?php echo esc_html((string) $job->event); ?></code></td>
                        <td>
                            <span class="elomai-pill elomai-pill--<?php echo esc_attr(in_array($job->status, ['failed', 'cancelled'], true) ? 'error' : ($job->status === 'synchronized' ? 'ok' : 'warn')); ?>">
                                <?php echo esc_html((string) $job->status); ?>
                            </span>
                        </td>
                        <td><?php echo esc_html((string) (int) $job->attempts); ?></td>
                        <td><code><?php echo esc_html((string) $job->next_attempt_at); ?></code></td>
                        <td><?php echo esc_html((string) $job->last_error); ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </section>

        <h2 class="elomai-section-title">Artikel</h2>
        <ul class="subsubsub">
            <?php
            $views = ['all' => 'Alle', 'pending' => 'Zu prüfen', 'synced' => 'Synchronisiert'];
            foreach ($views as $key => $label) {
                $url = add_query_arg(['page' => 'elomai-editorial', 'view' => $key, 'lang' => $filter], admin_url('admin.php'));
                printf('<li><a href="%s" class="%s">%s</a> | </li>', esc_url($url), $view === $key ? 'current' : '', esc_html($label));
            }
            ?>
        </ul>
        <p class="elomai-langs">
            <a href="<?php echo esc_url(add_query_arg(['page' => 'elomai-editorial', 'view' => $view], admin_url('admin.php'))); ?>" class="<?php echo $filter === '' ? 'current' : ''; ?>">Alle Sprachen</a>
            <?php foreach (ELOMAI_LANGS as $lang) : ?>
                <a href="<?php echo esc_url(add_query_arg(['page' => 'elomai-editorial', 'view' => $view, 'lang' => $lang], admin_url('admin.php'))); ?>" class="<?php echo $filter === $lang ? 'current' : ''; ?>"><?php echo esc_html(strtoupper($lang)); ?></a>
            <?php endforeach; ?>
        </p>

        <table class="wp-list-table widefat fixed striped elomai-table">
            <thead>
                <tr>
                    <th>Titel</th>
                    <th>Sprache</th>
                    <th>Gruppe</th>
                    <th>Status</th>
                    <th>Synchronisation</th>
                    <th>Version</th>
                    <th>Aktion</th>
                </tr>
            </thead>
            <tbody>
            <?php if (!$rows) : ?>
                <tr><td colspan="7">Keine Artikel in dieser Auswahl.</td></tr>
            <?php endif; ?>
            <?php foreach ($rows as $post) :
                $status = elomai_status($post->ID);
                $state = elomai_sync_state($post->ID);
                $public = elomai_public_url($post->ID);
                ?>
                <tr>
                    <td>
                        <strong><a href="<?php echo esc_url(get_edit_post_link($post->ID)); ?>"><?php echo esc_html(get_the_title($post)); ?></a></strong>
                        <?php if (!empty($state['last_error'])) : ?>
                            <div class="elomai-error"><?php echo esc_html($state['last_error']); ?></div>
                        <?php endif; ?>
                    </td>
                    <td><span class="elomai-tag"><?php echo esc_html(strtoupper(elomai_post_language($post->ID))); ?></span></td>
                    <td>
                        <?php $group_id = elomai_translation_group_id($post->ID); ?>
                        <code title="<?php echo esc_attr($group_id); ?>"><?php echo esc_html($group_id ? substr($group_id, 0, 8) : '—'); ?></code>
                    </td>
                    <?php $status_object = get_post_status_object($post->post_status); ?>
                    <td><?php echo esc_html($status_object ? $status_object->label : $post->post_status); ?></td>
                    <td>
                        <span class="elomai-pill elomai-pill--<?php echo esc_attr($status['tone']); ?>"><?php echo esc_html($status['label']); ?></span>
                        <?php if (!empty($state['last_success'])) : ?>
                            <div class="elomai-muted"><?php echo esc_html($state['last_success']); ?> UTC</div>
                        <?php endif; ?>
                        <?php $job = elomai_outbox_latest($post->ID); ?>
                        <?php if ($job) : ?>
                            <div class="elomai-muted">
                                Warteschlange: <?php echo esc_html((string) $job->status); ?><?php echo (int) $job->attempts > 0 ? ' · Versuch ' . esc_html((string) (int) $job->attempts) : ''; ?>
                            </div>
                            <?php if (in_array($job->status, ['pending', 'retry_scheduled', 'failed'], true)) : ?>
                                <div class="elomai-muted">Nächster Versuch: <code><?php echo esc_html((string) $job->next_attempt_at); ?></code> UTC</div>
                            <?php endif; ?>
                        <?php endif; ?>
                        <?php $missing = elomai_missing_translations($post->ID); ?>
                        <?php if ($missing && $post->post_status === 'publish') : ?>
                            <div class="elomai-muted">Nicht vorhanden: <?php echo esc_html(implode(', ', array_map('strtoupper', $missing))); ?></div>
                        <?php endif; ?>
                        <?php $conflicts = elomai_translation_conflicts($post->ID); ?>
                        <?php if ($conflicts) : ?>
                            <div class="elomai-error">Gruppenkonflikt: <?php echo esc_html(implode(', ', array_map('strtoupper', $conflicts))); ?></div>
                        <?php endif; ?>
                    </td>
                    <td><?php echo esc_html('v' . (int) get_post_meta($post->ID, '_elomai_version', true)); ?></td>
                    <td class="elomai-row-actions">
                        <?php if ($post->post_status === 'publish') : ?>
                            <a class="button button-small" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=elomai_sync&post=' . $post->ID), 'elomai_sync_' . $post->ID)); ?>">
                                Synchronisieren
                            </a>
                            <?php if ($status['key'] === 'failed' || $status['key'] === 'pending') : ?>
                                <a class="button button-small" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=elomai_retry&post=' . $post->ID), 'elomai_retry_' . $post->ID)); ?>">
                                    Erneut versuchen
                                </a>
                            <?php endif; ?>
                        <?php endif; ?>
                        <?php if ($public) : ?>
                            <a class="button button-small" href="<?php echo esc_url($public); ?>" target="_blank" rel="noopener">Ansehen ↗</a>
                            <a class="button button-small" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=elomai_unpublish&post=' . $post->ID), 'elomai_unpublish_' . $post->ID)); ?>">Offline</a>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php
}

function elomai_render_log() {
    $log = get_option('elomai_sync_log', []);
    $log = is_array($log) ? $log : [];
    ?>
    <div class="wrap elomai-wrap">
        <h1>Synchronisations-Protokoll</h1>
        <p class="elomai-lead">Die letzten 200 Ereignisse. Geheimnisse und Signaturen werden nie protokolliert.</p>
        <table class="wp-list-table widefat fixed striped">
            <thead><tr><th style="width:170px">Zeit (UTC)</th><th style="width:180px">Ereignis</th><th>Artikel</th><th>Meldung</th></tr></thead>
            <tbody>
            <?php if (!$log) : ?>
                <tr><td colspan="4">Noch keine Ereignisse.</td></tr>
            <?php endif; ?>
            <?php foreach ($log as $entry) : ?>
                <tr>
                    <td><code><?php echo esc_html($entry['time'] ?? ''); ?></code></td>
                    <td><span class="elomai-pill elomai-pill--<?php echo esc_attr(strpos((string) ($entry['action'] ?? ''), 'fail') !== false ? 'error' : 'ok'); ?>"><?php echo esc_html($entry['action'] ?? ''); ?></span></td>
                    <td><?php echo esc_html($entry['title'] ?? ''); ?></td>
                    <td><?php echo esc_html($entry['message'] ?? ''); ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php
}

/* -------------------------------------------------------------- settings */

add_action('admin_post_elomai_save_settings', function () {
    if (!current_user_can('manage_options')) {
        wp_die('Nicht erlaubt.');
    }
    check_admin_referer('elomai_settings');
    $input = isset($_POST['elomai']) && is_array($_POST['elomai']) ? wp_unslash($_POST['elomai']) : [];

    elomai_update_option('endpoint', esc_url_raw($input['endpoint'] ?? elomai_endpoint()));
    elomai_update_option('allow_insecure_local', !empty($input['allow_insecure_local']));
    elomai_update_option('matomo_url', esc_url_raw($input['matomo_url'] ?? ''));
    elomai_update_option('matomo_site_id', sanitize_text_field($input['matomo_site_id'] ?? '1'));
    elomai_update_option('matomo_refresh_hours', max(1, min(168, (int) ($input['matomo_refresh_hours'] ?? 6))));
    elomai_update_option('gsc_site', esc_url_raw($input['gsc_site'] ?? ''));

    // Secrets are only replaced when a new value is typed; empty means "keep".
    foreach (['secret' => 'secret', 'matomo_token' => 'matomo_token', 'gsc_client_id' => 'gsc_client_id', 'gsc_client_secret' => 'gsc_client_secret', 'gsc_refresh_token' => 'gsc_refresh_token'] as $field => $option) {
        $value = trim((string) ($input[$field] ?? ''));
        if ($value !== '') {
            elomai_update_option($option, sanitize_text_field($value));
        }
    }
    if (!empty($input['regenerate_secret'])) {
        elomai_update_option('secret', bin2hex(random_bytes(32)));
    }
    if (!empty($input['clear_matomo_token'])) {
        elomai_update_option('matomo_token', '');
    }

    delete_transient('elomai_matomo_cache');
    elomai_log('settings_saved', 'Einstellungen aktualisiert', 0);
    wp_safe_redirect(add_query_arg('elomai_saved', '1', admin_url('admin.php?page=elomai-settings')));
    exit;
});

function elomai_render_settings() {
    $secret = elomai_sync_secret();
    $token_configured = elomai_option('matomo_token', '') !== '';
    $token_from_constant = defined('ELOMAI_MATOMO_TOKEN') && ELOMAI_MATOMO_TOKEN;
    $gsc_token_configured = elomai_option('gsc_refresh_token', '') !== '';
    ?>
    <div class="wrap elomai-wrap">
        <h1>EL0M Einstellungen</h1>
        <?php if (isset($_GET['elomai_saved'])) : ?>
            <div class="notice notice-success is-dismissible"><p>Gespeichert.</p></div>
        <?php endif; ?>

        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <?php wp_nonce_field('elomai_settings'); ?>
            <input type="hidden" name="action" value="elomai_save_settings" />

            <h2>Synchronisation</h2>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="elomai_endpoint">Empfänger-Endpunkt</label></th>
                    <td>
                        <input type="url" id="elomai_endpoint" name="elomai[endpoint]" class="regular-text code" value="<?php echo esc_attr(elomai_endpoint()); ?>" />
                        <p class="description">Standard: <code><?php echo esc_html(ELOMAI_PUBLIC_BASE . '/content-api/v1/sync'); ?></code></p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="elomai_secret">Sync-Geheimnis</label></th>
                    <td>
                        <?php if (defined('ELOMAI_SYNC_SECRET') && ELOMAI_SYNC_SECRET) : ?>
                            <p><span class="elomai-pill elomai-pill--ok">Aus wp-config.php geladen</span></p>
                        <?php else : ?>
                            <input type="password" id="elomai_secret" name="elomai[secret]" class="regular-text code" autocomplete="new-password"
                                placeholder="<?php echo $secret ? '•••••••• (gesetzt – leer lassen zum Beibehalten)' : 'Noch nicht gesetzt'; ?>" />
                            <p class="description">HMAC-Schlüssel, der auch auf dem VPS als <code>ELOMAI_SYNC_SECRET</code> hinterlegt ist. Wird nie im Frontend ausgegeben.</p>
                            <p>
                                <button type="submit" class="button" name="elomai[regenerate_secret]" value="1"
                                    onclick="return confirm('Neues Geheimnis erzeugen? Der Empfänger muss danach ebenfalls aktualisiert werden.');">
                                    Neues Geheimnis erzeugen
                                </button>
                                <?php if ($secret) : ?>
                                    <button type="button" class="button" data-elomai-copy="<?php echo esc_attr($secret); ?>">Geheimnis kopieren</button>
                                <?php endif; ?>
                            </p>
                        <?php endif; ?>
                        <label><input type="checkbox" name="elomai[allow_insecure_local]" value="1" <?php checked(elomai_insecure_endpoint_allowed()); ?> /> Unverschlüsseltes HTTP nur für lokale Tests zulassen</label>
                    </td>
                </tr>
            </table>

            <h2>Matomo (Website-Performance)</h2>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="elomai_matomo_url">Matomo-URL</label></th>
                    <td><input type="url" id="elomai_matomo_url" name="elomai[matomo_url]" class="regular-text code" value="<?php echo esc_attr(elomai_option('matomo_url', ELOMAI_PUBLIC_BASE . '/matomo/')); ?>" />
                        <p class="description">Basis-URL der Instanz. Der Reporting-API-Aufruf erfolgt serverseitig über <code>index.php</code>.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="elomai_matomo_site">Website-ID</label></th>
                    <td><input type="number" id="elomai_matomo_site" name="elomai[matomo_site_id]" class="small-text" value="<?php echo esc_attr(elomai_option('matomo_site_id', '1')); ?>" /></td>
                </tr>
                <tr>
                    <th scope="row"><label for="elomai_matomo_token">API-Token (token_auth)</label></th>
                    <td>
                        <?php if ($token_from_constant) : ?>
                            <p><span class="elomai-pill elomai-pill--ok">Aus wp-config.php geladen</span></p>
                        <?php else : ?>
                            <input type="password" id="elomai_matomo_token" name="elomai[matomo_token]" class="regular-text code" autocomplete="new-password"
                                placeholder="<?php echo $token_configured ? '•••••••• (gesetzt)' : 'Token eines Matomo-Benutzers mit Lesezugriff'; ?>" />
                            <?php if ($token_configured) : ?>
                                <p><label><input type="checkbox" name="elomai[clear_matomo_token]" value="1" /> Token entfernen</label></p>
                            <?php endif; ?>
                        <?php endif; ?>
                        <p class="description">Nur serverseitig verwendet. Empfehlung: in <code>wp-config.php</code> als <code>ELOMAI_MATOMO_TOKEN</code> definieren.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="elomai_matomo_refresh">Aktualisierung</label></th>
                    <td><input type="number" id="elomai_matomo_refresh" name="elomai[matomo_refresh_hours]" class="small-text" min="1" max="168" value="<?php echo esc_attr(elomai_option('matomo_refresh_hours', 6)); ?>" /> Stunden (Cache)</td>
                </tr>
            </table>

            <h2>Google Search Console (optional)</h2>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row">Status</th>
                    <td>
                        <?php if ($gsc_token_configured) : ?>
                            <span class="elomai-pill elomai-pill--ok">Autorisiert</span>
                        <?php else : ?>
                            <span class="elomai-pill elomai-pill--muted">Nicht konfiguriert</span>
                            <p class="description">Ohne OAuth-Zugangsdaten bleibt die Integration deaktiviert. Suchklicks werden nicht geschätzt oder erfunden.</p>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="elomai_gsc_site">Property</label></th>
                    <td><input type="text" id="elomai_gsc_site" name="elomai[gsc_site]" class="regular-text code" value="<?php echo esc_attr(elomai_option('gsc_site', ELOMAI_PUBLIC_BASE . '/')); ?>" /></td>
                </tr>
                <tr>
                    <th scope="row">OAuth-Client</th>
                    <td>
                        <input type="password" name="elomai[gsc_client_id]" class="regular-text code" placeholder="Client-ID" autocomplete="off" />
                        <input type="password" name="elomai[gsc_client_secret]" class="regular-text code" placeholder="Client-Secret" autocomplete="off" />
                        <input type="password" name="elomai[gsc_refresh_token]" class="regular-text code" placeholder="Refresh-Token" autocomplete="off" />
                        <p class="description">Leer lassen, solange keine Autorisierung vorliegt.</p>
                    </td>
                </tr>
            </table>

            <?php submit_button('Einstellungen speichern'); ?>
        </form>
    </div>
    <?php
}
