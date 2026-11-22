<?php
/**
 * Post-level editorial fields: SEO, language/translation, synchronisation box
 * and the list-table columns.
 */

defined('ABSPATH') || exit;

/* ------------------------------------------------------------------- meta */

function elomai_seo_meta($post_id) {
    $seo = get_post_meta((int) $post_id, '_elomai_seo', true);
    return is_array($seo) ? $seo : [];
}

function elomai_social_meta($post_id) {
    $social = get_post_meta((int) $post_id, '_elomai_social', true);
    return is_array($social) ? $social : [];
}

/* -------------------------------------------------------------- meta boxes */

add_action('add_meta_boxes', function () {
    add_meta_box('elomai-sync', 'EL0M — Veröffentlichung auf elomaiapp.com', 'elomai_render_sync_box', 'post', 'side', 'high');
    add_meta_box('elomai-seo', 'SEO & Social-Metadaten', 'elomai_render_seo_box', 'post', 'normal', 'default');
    add_meta_box('elomai-language', 'Sprache & Übersetzungen', 'elomai_render_language_box', 'post', 'side', 'default');
    add_meta_box('elomai-social', 'Social-Media-Vorschläge', 'elomai_render_social_box', 'post', 'normal', 'low');
});

function elomai_render_sync_box($post) {
    $state = elomai_sync_state($post->ID);
    $status = elomai_status($post->ID);
    $public = elomai_public_url($post->ID);
    $version = (int) get_post_meta($post->ID, '_elomai_version', true);
    $endpoint = elomai_endpoint();
    $secret_ok = elomai_sync_secret() !== '';

    wp_nonce_field('elomai_sync_box', 'elomai_sync_nonce');
    ?>
    <p class="elomai-status elomai-status--<?php echo esc_attr($status['tone']); ?>">
        <span class="dot"></span><?php echo esc_html($status['label']); ?>
    </p>

    <ul class="elomai-kv">
        <li><span>Sprache</span><strong><?php echo esc_html(strtoupper(elomai_post_language($post->ID))); ?></strong></li>
        <li><span>Version</span><strong><?php echo $version ? esc_html('v' . $version) : '—'; ?></strong></li>
        <li><span>Zuletzt</span><strong><?php echo esc_html($state['last_success'] ?? '—'); ?></strong></li>
        <li><span>Ziel</span><strong class="elomai-ellipsis"><?php echo esc_html($endpoint); ?></strong></li>
    </ul>

    <?php if (!empty($state['last_error'])) : ?>
        <p class="elomai-error"><strong>Fehler:</strong> <?php echo esc_html($state['last_error']); ?></p>
    <?php endif; ?>

    <?php if ($public) : ?>
        <p><a href="<?php echo esc_url($public); ?>" target="_blank" rel="noopener">Öffentliche Seite öffnen ↗</a></p>
    <?php endif; ?>

    <?php if (!$secret_ok) : ?>
        <p class="elomai-error">Kein Sync-Geheimnis konfiguriert. Bitte in den Einstellungen hinterlegen.</p>
    <?php endif; ?>

    <p class="elomai-actions">
        <?php if ($post->post_status === 'publish') : ?>
            <a class="button button-primary" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=elomai_sync&post=' . $post->ID), 'elomai_sync_' . $post->ID)); ?>">Jetzt synchronisieren</a>
        <?php else : ?>
            <button type="button" class="button" disabled>Erst veröffentlichen</button>
        <?php endif; ?>
        <?php if ($public) : ?>
            <a class="button" href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=elomai_unpublish&post=' . $post->ID), 'elomai_unpublish_' . $post->ID)); ?>">Offline nehmen</a>
        <?php endif; ?>
    </p>
    <p class="description">
        Entwürfe werden nie veröffentlicht. Die Synchronisierung läuft über eine signierte HTTPS-Verbindung;
        die Seite wird erst nach erfolgreicher Bestätigung des Empfängers als „synchronisiert“ markiert.
    </p>
    <?php
}

function elomai_render_seo_box($post) {
    $seo = elomai_seo_meta($post->ID);
    wp_nonce_field('elomai_seo_box', 'elomai_seo_nonce');
    $field = function ($name, $label, $value, $type = 'text', $hint = '') {
        printf(
            '<p class="elomai-field"><label for="elomai_%1$s"><strong>%2$s</strong></label>'
            . '<input type="%3$s" id="elomai_%1$s" name="elomai_seo[%1$s]" value="%4$s" class="widefat" />'
            . '%5$s</p>',
            esc_attr($name),
            esc_html($label),
            esc_attr($type),
            esc_attr($value),
            $hint ? '<span class="description">' . esc_html($hint) . '</span>' : ''
        );
    };
    ?>
    <p class="description">Leere Felder werden automatisch aus Titel, Auszug und Inhalt erzeugt. Zeichenlängen: Titel ideal ≤ 60, Beschreibung 120–160.</p>
    <?php
    $field('title', 'SEO-Titel', $seo['title'] ?? '', 'text', 'Erscheint im <title> und in Suchergebnissen.');
    echo '<p class="elomai-field"><label for="elomai_description"><strong>Meta-Beschreibung</strong></label>'
        . '<textarea id="elomai_description" name="elomai_seo[description]" rows="3" class="widefat" maxlength="300">'
        . esc_textarea($seo['description'] ?? '') . '</textarea></p>';
    $field('keywords', 'Keywords / Suchintention', $seo['keywords'] ?? '', 'text', 'Komma-getrennt, maximal 8 Begriffe.');
    $field('canonical', 'Canonical-URL (optional)', $seo['canonical'] ?? '', 'url', 'Nur setzen, wenn die kanonische Quelle eine andere Seite ist.');
    $field('og_title', 'Open-Graph-Titel', $seo['og_title'] ?? '');
    $field('og_description', 'Open-Graph-Beschreibung', $seo['og_description'] ?? '');
    ?>
    <p class="elomai-field">
        <label for="elomai_og_image"><strong>Open-Graph-Bild (Anhang-ID)</strong></label>
        <input type="number" id="elomai_og_image" name="elomai_seo[og_image]" value="<?php echo esc_attr($seo['og_image'] ?? ''); ?>" class="small-text" />
        <span class="description">Ohne Angabe wird das Beitragsbild verwendet.</span>
    </p>
    <?php
}

function elomai_render_language_box($post) {
    $current = elomai_post_language($post->ID);
    $source = elomai_translation_source($post->ID);
    $group = elomai_translation_group($post->ID);
    $missing = elomai_missing_translations($post->ID);
    wp_nonce_field('elomai_language_box', 'elomai_language_nonce');
    ?>
    <p class="elomai-field">
        <label for="elomai_lang"><strong>Sprache dieses Artikels</strong></label>
        <select id="elomai_lang" name="elomai_lang" class="widefat">
            <?php foreach (ELOMAI_LANGS as $code) : ?>
                <option value="<?php echo esc_attr($code); ?>" <?php selected($current, $code); ?>><?php echo esc_html(strtoupper($code)); ?></option>
            <?php endforeach; ?>
        </select>
    </p>
    <p class="elomai-field">
        <label for="elomai_translation_of"><strong>Übersetzung von (Beitrags-ID)</strong></label>
        <input type="number" id="elomai_translation_of" name="elomai_translation_of" value="<?php echo esc_attr($source ?: ''); ?>" class="small-text" min="0" />
        <span class="description">Leer lassen, wenn dies das Original ist.</span>
    </p>
    <p><strong>Sprachgruppe</strong></p>
    <ul class="elomai-list">
        <?php foreach ($group as $id) : ?>
            <li>
                <span class="lang"><?php echo esc_html(strtoupper(elomai_post_language($id))); ?></span>
                <a href="<?php echo esc_url(get_edit_post_link($id)); ?>"><?php echo esc_html(get_the_title($id)); ?></a>
            </li>
        <?php endforeach; ?>
    </ul>
    <?php if ($missing) : ?>
        <p class="elomai-warn">Fehlende Übersetzungen: <strong><?php echo esc_html(implode(', ', array_map('strtoupper', $missing))); ?></strong></p>
        <p class="description">Die öffentliche Seite zeigt für fehlende Sprachen einen klaren Hinweis – niemals eine leere Seite.</p>
    <?php else : ?>
        <p class="elomai-ok">Alle drei Sprachen sind verknüpft.</p>
    <?php endif; ?>
    <?php
}

/* ---------------------------------------------------------------- saving */

add_action('save_post_post', function ($post_id, $post) {
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    if (isset($_POST['elomai_seo_nonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['elomai_seo_nonce'])), 'elomai_seo_box')) {
        $input = isset($_POST['elomai_seo']) && is_array($_POST['elomai_seo']) ? wp_unslash($_POST['elomai_seo']) : [];
        $clean = [
            'title' => sanitize_text_field($input['title'] ?? ''),
            'description' => sanitize_textarea_field($input['description'] ?? ''),
            'keywords' => sanitize_text_field($input['keywords'] ?? ''),
            'canonical' => esc_url_raw($input['canonical'] ?? ''),
            'og_title' => sanitize_text_field($input['og_title'] ?? ''),
            'og_description' => sanitize_textarea_field($input['og_description'] ?? ''),
            'og_image' => (int) ($input['og_image'] ?? 0),
        ];
        update_post_meta($post_id, '_elomai_seo', $clean);
    }

    // Runs at priority 20 so the three-language value wins over the legacy DE/EN box.
    if (isset($_POST['elomai_language_nonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['elomai_language_nonce'])), 'elomai_language_box')) {
        $lang = sanitize_key(wp_unslash($_POST['elomai_lang'] ?? ''));
        if (in_array($lang, ELOMAI_LANGS, true)) {
            wp_set_object_terms($post_id, $lang, 'language');
        }
        $source = (int) ($_POST['elomai_translation_of'] ?? 0);
        if ($source > 0 && $source !== (int) $post_id) {
            update_post_meta($post_id, '_presence_translation_of', $source);
        } else {
            delete_post_meta($post_id, '_presence_translation_of');
        }
    }

    elomai_uuid($post_id);
}, 20, 2);

/* ------------------------------------------------------------- list table */

add_filter('manage_post_posts_columns', function ($columns) {
    $new = [];
    foreach ($columns as $key => $label) {
        $new[$key] = $label;
        if ($key === 'title') {
            $new['elomai_lang'] = 'Sprache';
            $new['elomai_sync'] = 'elomaiapp.com';
        }
    }
    return $new;
});

add_action('manage_post_posts_custom_column', function ($column, $post_id) {
    if ($column === 'elomai_lang') {
        echo '<span class="elomai-tag">' . esc_html(strtoupper(elomai_post_language($post_id))) . '</span>';
        return;
    }
    if ($column === 'elomai_sync') {
        $status = elomai_status($post_id);
        $state = elomai_sync_state($post_id);
        printf(
            '<span class="elomai-pill elomai-pill--%s">%s</span>',
            esc_attr($status['tone']),
            esc_html($status['label'])
        );
        if (!empty($state['last_success'])) {
            echo '<br /><small>' . esc_html($state['last_success']) . '</small>';
        }
    }
}, 10, 2);

/* ------------------------------------------------- private-by-default rule */

// Drafts and private posts must never be readable through the public REST API.
add_filter('rest_post_query', function ($args, $request) {
    if (is_user_logged_in() && current_user_can('edit_posts')) {
        return $args;
    }
    $args['post_status'] = 'publish';
    return $args;
}, 10, 2);
