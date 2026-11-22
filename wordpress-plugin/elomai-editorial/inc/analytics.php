<?php
/**
 * "SEO & Content Performance": server-side Matomo Reporting API integration.
 * The token never leaves the server; every widget is backed by a real API
 * response or shows an explicit empty state.
 */

defined('ABSPATH') || exit;

function elomai_matomo_token() {
    if (defined('ELOMAI_MATOMO_TOKEN') && ELOMAI_MATOMO_TOKEN) {
        return (string) ELOMAI_MATOMO_TOKEN;
    }
    return (string) elomai_option('matomo_token', '');
}

function elomai_matomo_base() {
    return trailingslashit((string) elomai_option('matomo_url', ELOMAI_PUBLIC_BASE . '/matomo/'));
}

function elomai_matomo_site_id() {
    return (string) elomai_option('matomo_site_id', '1');
}

/**
 * Calls one Matomo API method.
 *
 * The method name travels in the query string (nginx only exposes index.php
 * for module=API), while token_auth travels in the POST body so it never
 * appears in a URL, an access log or a referrer.
 */
function elomai_matomo_api($method, array $params = []) {
    $token = elomai_matomo_token();
    if ($token === '') {
        return new WP_Error('elomai_no_token', 'Kein Matomo-API-Token konfiguriert.');
    }

    $url = add_query_arg([
        'module' => 'API',
        'method' => $method,
        'format' => 'json',
        'idSite' => elomai_matomo_site_id(),
    ], elomai_matomo_base() . 'index.php');

    $response = wp_remote_post($url, [
        'timeout' => 25,
        'blocking' => true,
        'sslverify' => true,
        'redirection' => 0,
        'body' => array_merge(['token_auth' => $token], $params),
        'headers' => ['User-Agent' => 'elomai-editorial/' . ELOMAI_VERSION],
    ]);

    if (is_wp_error($response)) {
        return $response;
    }

    $code = (int) wp_remote_retrieve_response_code($response);
    $body = (string) wp_remote_retrieve_body($response);

    if ($code !== 200) {
        return new WP_Error('elomai_matomo_http', 'Matomo antwortet mit HTTP ' . $code . '.');
    }

    $data = json_decode($body, true);
    if (!is_array($data)) {
        return new WP_Error('elomai_matomo_json', 'Antwort konnte nicht gelesen werden.');
    }
    if (isset($data['result']) && $data['result'] === 'error') {
        return new WP_Error('elomai_matomo_error', (string) ($data['message'] ?? 'Unbekannter Matomo-Fehler.'));
    }

    return $data;
}

/** Resolves the requested period into Matomo period/date parameters. */
function elomai_matomo_range() {
    $period = isset($_GET['period']) ? sanitize_key(wp_unslash($_GET['period'])) : 'last30';
    $today = current_time('Y-m-d');

    switch ($period) {
        case 'today':
            return ['key' => 'today', 'label' => 'Heute', 'period' => 'day', 'date' => $today];
        case 'yesterday':
            return ['key' => 'yesterday', 'label' => 'Gestern', 'period' => 'day', 'date' => gmdate('Y-m-d', strtotime($today . ' -1 day'))];
        case 'last7':
            return ['key' => 'last7', 'label' => 'Letzte 7 Tage', 'period' => 'range', 'date' => gmdate('Y-m-d', strtotime($today . ' -6 days')) . ',' . $today];
        case 'last90':
            return ['key' => 'last90', 'label' => 'Letzte 90 Tage', 'period' => 'range', 'date' => gmdate('Y-m-d', strtotime($today . ' -89 days')) . ',' . $today];
        case 'custom':
            $from = isset($_GET['from']) ? sanitize_text_field(wp_unslash($_GET['from'])) : '';
            $to = isset($_GET['to']) ? sanitize_text_field(wp_unslash($_GET['to'])) : '';
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
                return ['key' => 'custom', 'label' => $from . ' – ' . $to, 'period' => 'range', 'date' => $from . ',' . $to];
            }
            return ['key' => 'last30', 'label' => 'Letzte 30 Tage', 'period' => 'range', 'date' => gmdate('Y-m-d', strtotime($today . ' -29 days')) . ',' . $today];
        case 'last30':
        default:
            return ['key' => 'last30', 'label' => 'Letzte 30 Tage', 'period' => 'range', 'date' => gmdate('Y-m-d', strtotime($today . ' -29 days')) . ',' . $today];
    }
}

/** Cached dataset for one period. */
function elomai_analytics_dataset($range, $force = false) {
    $cache_key = 'elomai_matomo_' . md5($range['period'] . '|' . $range['date'] . '|' . elomai_matomo_site_id());
    if (!$force) {
        $cached = get_transient($cache_key);
        if (is_array($cached)) {
            return $cached;
        }
    }

    $params = ['period' => $range['period'], 'date' => $range['date']];
    $dataset = ['fetched_at' => current_time('mysql', true), 'errors' => []];

    $summary = elomai_matomo_api('VisitsSummary.get', $params);
    if (is_wp_error($summary)) {
        $dataset['errors'][] = $summary->get_error_message();
        return $dataset;
    }
    $dataset['summary'] = $summary;

    $daily = elomai_matomo_api('VisitsSummary.get', ['period' => 'day', 'date' => $range['date']]);
    $dataset['daily'] = is_wp_error($daily) ? [] : $daily;

    $pages = elomai_matomo_api('Actions.getPageUrls', $params + ['filter_limit' => 25, 'flat' => 1, 'expanded' => 1]);
    $dataset['pages'] = is_wp_error($pages) ? [] : $pages;

    $referrers = elomai_matomo_api('Referrers.getReferrerType', $params);
    $dataset['referrers'] = is_wp_error($referrers) ? [] : $referrers;

    $events = elomai_matomo_api('Events.getAction', $params + ['filter_limit' => 50]);
    $dataset['events'] = is_wp_error($events) ? [] : $events;

    $entry = elomai_matomo_api('Actions.getEntryPageUrls', $params + ['filter_limit' => 10, 'flat' => 1]);
    $dataset['entryPages'] = is_wp_error($entry) ? [] : $entry;

    $dataset['goals'] = elomai_matomo_api('Goals.getGoals', []);
    if (is_wp_error($dataset['goals'])) {
        $dataset['goals'] = [];
    }

    $ttl = max(1, (int) elomai_option('matomo_refresh_hours', 6)) * HOUR_IN_SECONDS;
    set_transient($cache_key, $dataset, $ttl);

    return $dataset;
}

/* --------------------------------------------------------------- widgets */

function elomai_fmt_duration($seconds) {
    $seconds = (int) $seconds;
    if ($seconds <= 0) {
        return '0:00';
    }
    return sprintf('%d:%02d', floor($seconds / 60), $seconds % 60);
}

function elomai_line_chart(array $daily, $metric = 'nb_visits') {
    if (!$daily) {
        return '<p class="elomai-muted">Keine Daten im gewählten Zeitraum.</p>';
    }
    $series = [];
    foreach ($daily as $date => $row) {
        if (!is_array($row) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $date)) {
            continue;
        }
        $series[$date] = (int) ($row[$metric] ?? 0);
    }
    if (!$series) {
        return '<p class="elomai-muted">Keine Daten im gewählten Zeitraum.</p>';
    }
    ksort($series);

    $width = 720;
    $height = 180;
    $padding = 26;
    $max = max(1, max($series));
    $step = count($series) > 1 ? ($width - $padding * 2) / (count($series) - 1) : 0;
    $points = [];
    $i = 0;
    foreach ($series as $value) {
        $x = $padding + $i * $step;
        $y = $height - $padding - (($value / $max) * ($height - $padding * 2));
        $points[] = round($x, 1) . ',' . round($y, 1);
        $i++;
    }

    $path = implode(' ', $points);
    $labels = array_keys($series);
    $first = reset($labels);
    $last = end($labels);

    return sprintf(
        '<svg class="elomai-chart" viewBox="0 0 %1$d %2$d" role="img" aria-label="Verlauf der Besuche">'
        . '<polyline points="%3$s" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />'
        . '<polyline points="%3$s" fill="url(#elomai-grad)" stroke="none" opacity="0.18" />'
        . '<text x="%4$d" y="%5$d" class="elomai-chart-label">%6$s</text>'
        . '<text x="%7$d" y="%5$d" text-anchor="end" class="elomai-chart-label">%8$s</text>'
        . '<text x="%4$d" y="16" class="elomai-chart-label">max %9$d</text>'
        . '</svg>',
        $width,
        $height,
        $path,
        $padding,
        $height - 6,
        esc_html($first),
        $width - $padding,
        esc_html($last),
        $max
    );
}

function elomai_bar_rows(array $rows, $label_key = 'label', $value_key = 'nb_visits', $limit = 10) {
    $rows = array_values(array_filter($rows, 'is_array'));
    usort($rows, fn($a, $b) => ((int) ($b[$value_key] ?? 0)) <=> ((int) ($a[$value_key] ?? 0)));
    $rows = array_slice($rows, 0, $limit);
    if (!$rows) {
        return '<p class="elomai-muted">Keine Daten im gewählten Zeitraum.</p>';
    }
    $max = max(1, (int) ($rows[0][$value_key] ?? 0));
    $html = '<ul class="elomai-bars">';
    foreach ($rows as $row) {
        $value = (int) ($row[$value_key] ?? 0);
        $label = (string) ($row[$label_key] ?? '—');
        $html .= sprintf(
            '<li><span class="elomai-bar-label" title="%1$s">%1$s</span><span class="elomai-bar"><span style="width:%2$d%%"></span></span><strong>%3$d</strong></li>',
            esc_html(mb_strimwidth($label, 0, 64, '…')),
            (int) round(($value / $max) * 100),
            $value
        );
    }
    return $html . '</ul>';
}

/** Groups page URLs by language folder (/blog/de/, /blog/fr/). */
function elomai_language_breakdown(array $pages) {
    $totals = ['en' => ['views' => 0, 'urls' => 0], 'de' => ['views' => 0, 'urls' => 0], 'fr' => ['views' => 0, 'urls' => 0]];

    $walk = function ($rows) use (&$walk, &$totals) {
        foreach ((array) $rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            if (!empty($row['subtable']) && is_array($row['subtable'])) {
                $walk($row['subtable']);
                continue;
            }
            $url = (string) ($row['label'] ?? '');
            if (preg_match('#/blog/(de|fr)/#', $url, $m)) {
                $totals[$m[1]]['views'] += (int) ($row['nb_visits'] ?? 0);
                $totals[$m[1]]['urls'] += 1;
            } elseif (strpos($url, '/blog/') !== false) {
                $totals['en']['views'] += (int) ($row['nb_visits'] ?? 0);
                $totals['en']['urls'] += 1;
            }
        }
    };
    $walk($pages);

    $html = '<ul class="elomai-bars">';
    $max = max(1, max(array_map(fn($row) => $row['views'], $totals)));
    foreach ($totals as $lang => $row) {
        $html .= sprintf(
            '<li><span class="elomai-lang">%s</span><span class="elomai-bar"><span style="width:%d%%"></span></span><strong>%d</strong><span class="elomai-muted">%d Seiten</span></li>',
            esc_html(strtoupper($lang)),
            (int) round(($row['views'] / $max) * 100),
            (int) $row['views'],
            (int) $row['urls']
        );
    }
    return $html . '</ul>';
}

/* -------------------------------------------------------------- renderer */

function elomai_render_performance() {
    $range = elomai_matomo_range();
    $force = isset($_GET['refresh']) && check_admin_referer('elomai_refresh', '_wpnonce');
    if ($force) {
        delete_transient('elomai_matomo_' . md5($range['period'] . '|' . $range['date'] . '|' . elomai_matomo_site_id()));
    }
    $data = elomai_analytics_dataset($range, $force);
    $summary = $data['summary'] ?? [];
    $errors = $data['errors'] ?? [];
    $site_timezone = (string) elomai_option('matomo_timezone', get_option('timezone_string') ?: 'UTC');

    $periods = ['today' => 'Heute', 'yesterday' => 'Gestern', 'last7' => 'Letzte 7 Tage', 'last30' => 'Letzte 30 Tage', 'last90' => 'Letzte 90 Tage', 'custom' => 'Zeitraum'];
    ?>
    <div class="wrap elomai-wrap">
        <h1>SEO &amp; Content Performance</h1>
        <p class="elomai-lead">
            Reichweite der öffentlichen Website aus Matomo On-Premise. Matomo erfasst Besuche unabhängig von diesem
            Rechner; diese Ansicht liest die Berichte serverseitig und zwischengespeichert.
        </p>

        <nav class="elomai-periods">
            <?php foreach ($periods as $key => $label) :
                $url = add_query_arg(['page' => 'elomai-performance', 'period' => $key], admin_url('admin.php'));
                ?>
                <a class="button <?php echo $range['key'] === $key ? 'button-primary' : ''; ?>" href="<?php echo esc_url($url); ?>"><?php echo esc_html($label); ?></a>
            <?php endforeach; ?>
        </nav>
        <form class="elomai-custom-range" method="get" action="<?php echo esc_url(admin_url('admin.php')); ?>">
            <input type="hidden" name="page" value="elomai-performance" />
            <input type="hidden" name="period" value="custom" />
            <label>Von <input type="date" name="from" value="<?php echo esc_attr($_GET['from'] ?? gmdate('Y-m-d', strtotime('-29 days'))); ?>" /></label>
            <label>Bis <input type="date" name="to" value="<?php echo esc_attr($_GET['to'] ?? current_time('Y-m-d')); ?>" /></label>
            <button class="button">Anwenden</button>
        </form>

        <p class="elomai-meta-line">
            Zeitraum: <strong><?php echo esc_html($range['label']); ?></strong> ·
            Zeitzone der Berichte: <strong><?php echo esc_html($site_timezone); ?></strong> ·
            Zuletzt abgerufen: <strong><?php echo esc_html($data['fetched_at'] ?? '—'); ?> UTC</strong> ·
            Cache: <?php echo esc_html((string) elomai_option('matomo_refresh_hours', 6)); ?> Stunden ·
            <a href="<?php echo esc_url(wp_nonce_url(add_query_arg(['page' => 'elomai-performance', 'period' => $range['key'], 'from' => $_GET['from'] ?? '', 'to' => $_GET['to'] ?? ''], admin_url('admin.php')), 'elomai_refresh')); ?>">Jetzt aktualisieren</a> ·
            <a href="<?php echo esc_url(add_query_arg(['page' => 'elomai-performance', 'test' => '1'], admin_url('admin.php'))); ?>">Verbindung testen</a>
        </p>

        <?php if (isset($_GET['test'])) :
            $test = elomai_test_connection();
            ?>
            <div class="notice <?php echo $test['ok'] ? 'notice-success' : 'notice-error'; ?>">
                <p><strong>Verbindungstest:</strong> <?php echo esc_html($test['message']); ?></p>
                <?php if (!empty($test['details'])) : ?>
                    <ul><?php foreach ($test['details'] as $line) : ?><li><?php echo esc_html($line); ?></li><?php endforeach; ?></ul>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <?php if ($errors) : ?>
            <div class="notice notice-error">
                <p><strong>Matomo konnte nicht abgefragt werden.</strong></p>
                <ul><?php foreach ($errors as $error) : ?><li><?php echo esc_html($error); ?></li><?php endforeach; ?></ul>
                <p class="elomai-muted">Es werden keine Ersatzzahlen angezeigt. Prüfen Sie URL, Website-ID und Lesezugriff des Tokens.</p>
            </div>
        <?php endif; ?>

        <?php if (!$summary) : ?>
            <div class="elomai-empty">
                <h2>Noch keine Analysedaten verfügbar.</h2>
                <p>Sobald die ersten Besuche auf elomaiapp.com erfasst sind, erscheinen hier Besucherzahlen, Inhalte, Quellen und Conversion-Events.</p>
                <p class="elomai-muted">Tracking läuft cookiefrei und nur auf der Produktionsdomain; lokale Entwicklung wird nicht erfasst.</p>
            </div>
        <?php else : ?>
            <div class="elomai-cards">
                <?php
                $kpis = [
                    ['Besucher (unique)', (int) ($summary['nb_uniq_visitors'] ?? 0)],
                    ['Besuche', (int) ($summary['nb_visits'] ?? 0)],
                    ['Seitenansichten', (int) ($summary['nb_actions'] ?? 0)],
                    ['Ø Besuchsdauer', elomai_fmt_duration($summary['avg_time_on_site'] ?? 0)],
                    ['Absprungrate', isset($summary['bounce_rate']) ? $summary['bounce_rate'] : '—'],
                    ['Aktionen/Besuch', isset($summary['nb_actions_per_visit']) ? round((float) $summary['nb_actions_per_visit'], 1) : '—'],
                ];
                foreach ($kpis as $kpi) {
                    printf('<div class="elomai-card"><span class="elomai-card-label">%s</span><strong>%s</strong></div>', esc_html($kpi[0]), esc_html((string) $kpi[1]));
                }
                ?>
            </div>

            <div class="elomai-cards">
                <?php
                $article_events = 0;
                $conversion_events = 0;
                foreach ((array) ($data['events'] ?? []) as $event) {
                    $action = (string) ($event['label'] ?? '');
                    $count = (int) ($event['nb_events'] ?? $event['nb_visits'] ?? 0);
                    if (in_array($action, ['article_view', 'video_play', 'article_related_click', 'blog_listing_view'], true)) {
                        $article_events += $count;
                    }
                    if (in_array($action, ['freelancer_profile_click', 'contact_click', 'email_click', 'project_open', 'article_share', 'social_share_click'], true)) {
                        $conversion_events += $count;
                    }
                }
                $cards = [
                    ['Artikel-Aufrufe (Event)', $article_events],
                    ['Conversion-Events', $conversion_events],
                    ['Ziele konfiguriert', is_array($data['goals'] ?? null) ? count($data['goals']) : 0],
                ];
                foreach ($cards as $card) {
                    printf('<div class="elomai-card elomai-card--ok"><span class="elomai-card-label">%s</span><strong>%s</strong></div>', esc_html($card[0]), esc_html((string) $card[1]));
                }
                ?>
            </div>

            <div class="elomai-grid">
                <section class="elomai-panel elomai-panel--wide">
                    <h2>Besucherverlauf</h2>
                    <?php echo elomai_line_chart($data['daily'] ?? [], 'nb_visits'); ?>
                    <h2>Seitenansichten</h2>
                    <?php echo elomai_line_chart($data['daily'] ?? [], 'nb_actions'); ?>
                </section>
                <section class="elomai-panel">
                    <h2>Sprachen</h2>
                    <?php echo elomai_language_breakdown($data['pages'] ?? []); ?>
                    <p class="elomai-muted">Basis: Seiten-URLs unter <code>/blog/…</code>. Deutsch ist die Primärsprache des Blogs.</p>
                </section>
            </div>

            <div class="elomai-grid">
                <section class="elomai-panel">
                    <h2>Meistbesuchte Seiten</h2>
                    <?php echo elomai_bar_rows($data['pages'] ?? [], 'label', 'nb_visits', 12); ?>
                </section>
                <section class="elomai-panel">
                    <h2>Einstiegsseiten</h2>
                    <?php echo elomai_bar_rows($data['entryPages'] ?? [], 'label', 'nb_visits', 8); ?>
                </section>
            </div>

            <div class="elomai-grid">
                <section class="elomai-panel">
                    <h2>Akquise</h2>
                    <?php echo elomai_bar_rows($data['referrers'] ?? [], 'label', 'nb_visits', 8); ?>
                </section>
                <section class="elomai-panel">
                    <h2>Conversion-Events</h2>
                    <?php
                    $events = array_values(array_filter((array) ($data['events'] ?? []), function ($row) {
                        $action = (string) ($row['label'] ?? '');
                        return in_array($action, [
                            'freelancer_profile_click', 'contact_click', 'email_click', 'project_open',
                            'article_share', 'social_share_click', 'article_view', 'video_play',
                        ], true);
                    }));
                    echo elomai_bar_rows($events, 'label', 'nb_events', 12);
                    ?>
                    <p class="elomai-muted">Ein Klick ist ein Interesse-Signal, keine Anfrage. Es werden keine Formularinhalte erfasst.</p>
                </section>
            </div>
        <?php endif; ?>

        <?php elomai_render_search_console(); ?>
    </div>
    <?php
}

/** Connectivity diagnostics that never echo the token. */
function elomai_test_connection() {
    $details = [];
    $details[] = 'URL: ' . elomai_matomo_base();
    $details[] = 'Website-ID: ' . elomai_matomo_site_id();
    $details[] = 'Token: ' . (elomai_matomo_token() ? 'konfiguriert (wird nicht angezeigt)' : 'fehlt');

    if (!elomai_matomo_token()) {
        return ['ok' => false, 'message' => 'Kein API-Token hinterlegt.', 'details' => $details];
    }

    $response = elomai_matomo_api('SitesManager.getSiteFromId', ['idSite' => elomai_matomo_site_id()]);
    if (is_wp_error($response)) {
        $details[] = 'Fehler: ' . $response->get_error_message();
        return ['ok' => false, 'message' => 'Matomo nicht erreichbar oder Token abgelehnt.', 'details' => $details];
    }

    $details[] = 'Website: ' . ($response['name'] ?? '—') . ' (' . ($response['main_url'] ?? '—') . ')';
    $version = elomai_matomo_api('API.getMatomoVersion', []);
    if (!is_wp_error($version)) {
        $details[] = 'Matomo-Version: ' . (is_string($version) ? $version : (string) ($version['value'] ?? 'unbekannt'));
    }
    return ['ok' => true, 'message' => 'Verbindung erfolgreich, Lesezugriff bestätigt.', 'details' => $details];
}

/* ------------------------------------------- Google Search Console (opt-in) */

function elomai_gsc_config() {
    return [
        'client_id' => (string) elomai_option('gsc_client_id', ''),
        'client_secret' => (string) elomai_option('gsc_client_secret', ''),
        'refresh_token' => (string) elomai_option('gsc_refresh_token', ''),
        'site' => (string) elomai_option('gsc_site', ELOMAI_PUBLIC_BASE . '/'),
    ];
}

function elomai_gsc_access_token() {
    $config = elomai_gsc_config();
    if (!$config['client_id'] || !$config['client_secret'] || !$config['refresh_token']) {
        return new WP_Error('elomai_gsc_missing', 'Search Console ist nicht autorisiert.');
    }
    $cached = get_transient('elomai_gsc_token');
    if (is_string($cached) && $cached) {
        return $cached;
    }
    $response = wp_remote_post('https://oauth2.googleapis.com/token', [
        'timeout' => 20,
        'body' => [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'refresh_token' => $config['refresh_token'],
            'grant_type' => 'refresh_token',
        ],
    ]);
    if (is_wp_error($response)) {
        return $response;
    }
    $body = json_decode((string) wp_remote_retrieve_body($response), true);
    if (empty($body['access_token'])) {
        return new WP_Error('elomai_gsc_token', 'OAuth-Antwort ohne Zugriffstoken: ' . ($body['error'] ?? 'unbekannt'));
    }
    set_transient('elomai_gsc_token', $body['access_token'], max(60, (int) ($body['expires_in'] ?? 3600) - 60));
    return $body['access_token'];
}

function elomai_render_search_console() {
    $config = elomai_gsc_config();
    $authorized = $config['client_id'] && $config['client_secret'] && $config['refresh_token'];
    ?>
    <section class="elomai-panel elomai-panel--wide">
        <h2>Google Search Console <span class="elomai-pill elomai-pill--<?php echo $authorized ? 'ok' : 'muted'; ?>"><?php echo $authorized ? 'Autorisiert' : 'Nicht konfiguriert'; ?></span></h2>
        <p class="elomai-muted">
            Suchklicks (Search Console) und Besuche (Matomo) messen unterschiedliche Dinge und werden hier nie
            vermischt. Ohne OAuth-Autorisierung bleibt dieser Abschnitt deaktiviert.
        </p>
        <?php if (!$authorized) : ?>
            <p>Einrichtung: In der Google Cloud Console ein OAuth-Client (Typ „Desktop“) anlegen, die Search Console API
                aktivieren, einmalig mit dem Property-Inhaber autorisieren und Client-ID, Client-Secret sowie Refresh-Token
                unter <a href="<?php echo esc_url(admin_url('admin.php?page=elomai-settings')); ?>">Einstellungen</a> hinterlegen.</p>
            <p class="elomai-muted">Keine Passwörter, keine erfundenen Daten. Solange keine Autorisierung vorliegt, zeigt dieses
                Dashboard keine Search-Console-Zahlen.</p>
        <?php else :
            $token = elomai_gsc_access_token();
            if (is_wp_error($token)) : ?>
                <div class="notice notice-error inline"><p><?php echo esc_html($token->get_error_message()); ?></p></div>
            <?php else :
                $end = gmdate('Y-m-d', strtotime('-2 days'));
                $start = gmdate('Y-m-d', strtotime('-30 days'));
                $response = wp_remote_post(
                    'https://searchconsole.googleapis.com/webmasters/v3/sites/' . rawurlencode($config['site']) . '/searchAnalytics/query',
                    [
                        'timeout' => 25,
                        'headers' => [
                            'Authorization' => 'Bearer ' . $token,
                            'Content-Type' => 'application/json',
                        ],
                        'body' => wp_json_encode([
                            'startDate' => $start,
                            'endDate' => $end,
                            'dimensions' => ['query'],
                            'rowLimit' => 10,
                        ]),
                    ]
                );
                if (is_wp_error($response)) {
                    echo '<p>' . esc_html($response->get_error_message()) . '</p>';
                } else {
                    $body = json_decode((string) wp_remote_retrieve_body($response), true);
                    $rows = $body['rows'] ?? [];
                    if (!$rows) {
                        echo '<p>Keine Search-Console-Daten im Zeitraum ' . esc_html($start) . ' – ' . esc_html($end) . '.</p>';
                    } else {
                        $total_clicks = 0;
                        $total_impressions = 0;
                        foreach ($rows as $row) {
                            $total_clicks += (int) ($row['clicks'] ?? 0);
                            $total_impressions += (int) ($row['impressions'] ?? 0);
                        }
                        echo '<div class="elomai-cards">';
                        printf('<div class="elomai-card"><span class="elomai-card-label">Klicks (Top-Abfragen)</span><strong>%d</strong></div>', $total_clicks);
                        printf('<div class="elomai-card"><span class="elomai-card-label">Impressionen</span><strong>%d</strong></div>', $total_impressions);
                        echo '</div>';
                        echo '<table class="wp-list-table widefat striped"><thead><tr><th>Suchanfrage</th><th>Klicks</th><th>Impressionen</th><th>CTR</th><th>Ø Position</th></tr></thead><tbody>';
                        foreach ($rows as $row) {
                            printf(
                                '<tr><td>%s</td><td>%d</td><td>%d</td><td>%s</td><td>%s</td></tr>',
                                esc_html((string) ($row['keys'][0] ?? '')),
                                (int) ($row['clicks'] ?? 0),
                                (int) ($row['impressions'] ?? 0),
                                esc_html(round(((float) ($row['ctr'] ?? 0)) * 100, 1) . ' %'),
                                esc_html(round((float) ($row['position'] ?? 0), 1))
                            );
                        }
                        echo '</tbody></table>';
                    }
                }
            endif;
        endif; ?>
    </section>
    <?php
}

/** Scheduled warm-up so the dashboard is fast after a reconnect. */
add_action('elomai_analytics_refresh', function () {
    if (!elomai_matomo_token()) {
        return;
    }
    $range = ['key' => 'last30', 'period' => 'range', 'date' => gmdate('Y-m-d', strtotime('-29 days')) . ',' . current_time('Y-m-d')];
    delete_transient('elomai_matomo_' . md5($range['period'] . '|' . $range['date'] . '|' . elomai_matomo_site_id()));
    elomai_analytics_dataset($range, true);
});
