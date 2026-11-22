<?php
/**
 * Editorial calendar and backlog.
 */

defined('ABSPATH') || exit;

function elomai_backlog_defaults() {
    return [
        ['title' => 'Running Local AI Models with Ollama and Docker', 'category' => 'local-ai', 'status' => 'idea'],
        ['title' => 'Building a Multi-Model AI Gateway with OmniRoute', 'category' => 'llm-integration', 'status' => 'idea'],
        ['title' => 'Designing a RAG System for Technical Knowledge', 'category' => 'rag', 'status' => 'idea'],
        ['title' => 'Building AI Agents with LangGraph', 'category' => 'ai-agents', 'status' => 'idea'],
        ['title' => 'Full-Stack Application with Django and React', 'category' => 'python', 'status' => 'idea'],
        ['title' => 'Monitoring Website Security with Nuclei and OWASP ZAP', 'category' => 'security-automation', 'status' => 'idea'],
        ['title' => 'Deploying Docker Applications on a VPS', 'category' => 'docker', 'status' => 'idea'],
        ['title' => 'Building a Website Monitoring SaaS with Django and Celery', 'category' => 'website-monitoring', 'status' => 'idea'],
        ['title' => 'Infrastructure as Code with Terraform and OpenTofu', 'category' => 'terraform-opentofu', 'status' => 'idea'],
        ['title' => 'Multimodal AI with Computer Vision', 'category' => 'artificial-intelligence-llm', 'status' => 'idea'],
    ];
}

function elomai_backlog() {
    $backlog = get_option('elomai_backlog', null);
    if (!is_array($backlog) || !$backlog) {
        $backlog = elomai_backlog_defaults();
        update_option('elomai_backlog', $backlog, false);
    }
    return $backlog;
}

add_action('admin_post_elomai_backlog_save', function () {
    if (!current_user_can('edit_posts')) {
        wp_die('Nicht erlaubt.');
    }
    check_admin_referer('elomai_backlog');
    $statuses = isset($_POST['backlog_status']) && is_array($_POST['backlog_status']) ? array_map('sanitize_key', wp_unslash($_POST['backlog_status'])) : [];
    $backlog = elomai_backlog();
    foreach ($backlog as $index => $entry) {
        if (isset($statuses[$index]) && in_array($statuses[$index], ['idea', 'researching', 'drafting', 'scheduled', 'published'], true)) {
            $backlog[$index]['status'] = $statuses[$index];
        }
    }
    update_option('elomai_backlog', $backlog, false);
    wp_safe_redirect(admin_url('admin.php?page=elomai-calendar&saved=1'));
    exit;
});

add_action('admin_post_elomai_backlog_draft', function () {
    if (!current_user_can('edit_posts')) {
        wp_die('Nicht erlaubt.');
    }
    $index = (int) ($_GET['index'] ?? -1);
    check_admin_referer('elomai_backlog_draft_' . $index);
    $backlog = elomai_backlog();
    if (!isset($backlog[$index])) {
        wp_die('Eintrag nicht gefunden.');
    }
    $entry = $backlog[$index];
    $existing = get_posts([
        'post_type' => 'post',
        'post_status' => 'any',
        'title' => $entry['title'],
        'posts_per_page' => 1,
        'fields' => 'ids',
    ]);
    if ($existing) {
        wp_safe_redirect(get_edit_post_link((int) $existing[0], 'url'));
        exit;
    }
    $category = get_term_by('slug', $entry['category'], 'category');
    $post_id = wp_insert_post([
        'post_type' => 'post',
        'post_status' => 'draft',
        'post_title' => $entry['title'],
        'post_content' => '',
        'post_category' => $category ? [(int) $category->term_id] : [],
    ], true);
    if (is_wp_error($post_id)) {
        wp_die(esc_html($post_id->get_error_message()));
    }
    $backlog[$index]['status'] = 'drafting';
    update_option('elomai_backlog', $backlog, false);
    wp_safe_redirect(get_edit_post_link($post_id, 'url'));
    exit;
});

function elomai_render_calendar() {
    $month = isset($_GET['month']) ? sanitize_text_field(wp_unslash($_GET['month'])) : current_time('Y-m');
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        $month = current_time('Y-m');
    }
    $first = strtotime($month . '-01 00:00:00');
    $days_in_month = (int) gmdate('t', $first);
    $start_weekday = (int) gmdate('N', $first); // 1 = Monday

    $posts = get_posts([
        'post_type' => 'post',
        'post_status' => ['publish', 'future', 'draft', 'pending'],
        'posts_per_page' => 200,
        'date_query' => [[
            'after' => gmdate('Y-m-01', $first),
            'before' => gmdate('Y-m-t', $first) . ' 23:59:59',
            'inclusive' => true,
        ]],
    ]);

    $by_day = [];
    foreach ($posts as $post) {
        $day = (int) get_post_time('j', false, $post);
        $by_day[$day][] = $post;
    }

    $backlog = elomai_backlog();
    $previous = gmdate('Y-m', strtotime($month . '-01 -1 month'));
    $next = gmdate('Y-m', strtotime($month . '-01 +1 month'));
    ?>
    <div class="wrap elomai-wrap">
        <h1>Redaktionskalender</h1>
        <?php if (isset($_GET['saved'])) : ?>
            <div class="notice notice-success is-dismissible"><p>Backlog gespeichert.</p></div>
        <?php endif; ?>

        <div class="elomai-calendar-nav">
            <a class="button" href="<?php echo esc_url(add_query_arg(['page' => 'elomai-calendar', 'month' => $previous], admin_url('admin.php'))); ?>">← <?php echo esc_html($previous); ?></a>
            <strong><?php echo esc_html(date_i18n('F Y', $first)); ?></strong>
            <a class="button" href="<?php echo esc_url(add_query_arg(['page' => 'elomai-calendar', 'month' => $next], admin_url('admin.php'))); ?>"><?php echo esc_html($next); ?> →</a>
        </div>

        <table class="elomai-calendar">
            <thead>
                <tr><th>Mo</th><th>Di</th><th>Mi</th><th>Do</th><th>Fr</th><th>Sa</th><th>So</th></tr>
            </thead>
            <tbody>
            <?php
            $cell = 1;
            $day = 1;
            echo '<tr>';
            while ($cell < $start_weekday) {
                echo '<td class="is-empty"></td>';
                $cell++;
            }
            while ($day <= $days_in_month) {
                if ($cell > 7) {
                    echo '</tr><tr>';
                    $cell = 1;
                }
                echo '<td>';
                echo '<span class="elomai-day">' . esc_html((string) $day) . '</span>';
                if (!empty($by_day[$day])) {
                    foreach ($by_day[$day] as $post) {
                        $status = elomai_status($post->ID);
                        printf(
                            '<a class="elomai-event elomai-pill--%s" href="%s" title="%s">%s</a>',
                            esc_attr($status['tone']),
                            esc_url(get_edit_post_link($post->ID)),
                            esc_attr($post->post_status),
                            esc_html(mb_strimwidth($post->post_title, 0, 26, '…'))
                        );
                    }
                }
                echo '</td>';
                $day++;
                $cell++;
            }
            while ($cell <= 7) {
                echo '<td class="is-empty"></td>';
                $cell++;
            }
            echo '</tr>';
            ?>
            </tbody>
        </table>

        <h2 class="elomai-section-title">Themen-Backlog</h2>
        <p class="elomai-muted">Redaktionelle Vorschläge – keine Behauptung, dass diese Projekte abgeschlossen sind. Erst mit
            verifizierten Ergebnissen veröffentlichen.</p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <?php wp_nonce_field('elomai_backlog'); ?>
            <input type="hidden" name="action" value="elomai_backlog_save" />
            <table class="wp-list-table widefat fixed striped">
                <thead><tr><th>Thema</th><th style="width:190px">Kategorie</th><th style="width:150px">Status</th><th style="width:150px">Aktion</th></tr></thead>
                <tbody>
                <?php foreach ($backlog as $index => $entry) : ?>
                    <tr>
                        <td><?php echo esc_html($entry['title']); ?></td>
                        <td><code><?php echo esc_html($entry['category']); ?></code></td>
                        <td>
                            <select name="backlog_status[<?php echo esc_attr((string) $index); ?>]">
                                <?php foreach (['idea' => 'Idee', 'researching' => 'Research', 'drafting' => 'In Arbeit', 'scheduled' => 'Geplant', 'published' => 'Veröffentlicht'] as $key => $label) : ?>
                                    <option value="<?php echo esc_attr($key); ?>" <?php selected($entry['status'], $key); ?>><?php echo esc_html($label); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                        <td>
                            <a class="button button-small" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=elomai_backlog_draft&index=' . $index), 'elomai_backlog_draft_' . $index)); ?>">Entwurf anlegen</a>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
            <?php submit_button('Backlog speichern'); ?>
        </form>
    </div>
    <?php
}
