<?php
/**
 * Social media drafts. Nothing is ever sent automatically: the plugin only
 * prepares editable texts with the canonical link and UTM parameters.
 */

defined('ABSPATH') || exit;

function elomai_social_hashtags($post_id) {
    $tags = wp_get_post_tags($post_id, ['fields' => 'names']);
    $base = ['#AIEngineering', '#FullStack', '#DevOps'];
    $lang = elomai_post_language($post_id);
    if ($lang === 'de') {
        $base = ['#KI', '#Softwareentwicklung', '#DevOps'];
    } elseif ($lang === 'fr') {
        $base = ['#IA', '#DéveloppementWeb', '#DevOps'];
    }
    $custom = array_map(function ($tag) {
        return '#' . preg_replace('/[^A-Za-z0-9]/', '', (string) $tag);
    }, array_slice((array) $tags, 0, 3));
    return implode(' ', array_filter(array_merge($base, $custom)));
}

function elomai_social_link($post_id, $source) {
    $url = elomai_public_url($post_id);
    if (!$url) {
        $url = ELOMAI_PUBLIC_BASE . '/blog/' . elomai_post_language($post_id) . '/' . (get_post($post_id)->post_name) . '/';
    }
    return add_query_arg([
        'utm_source' => $source,
        'utm_medium' => 'social',
        'utm_campaign' => get_post($post_id)->post_name,
    ], $url);
}

/** Builds language-aware drafts from the article itself. */
function elomai_generate_social_drafts($post_id) {
    $post = get_post($post_id);
    if (!$post) {
        return [];
    }
    $lang = elomai_post_language($post_id);
    $title = wp_strip_all_tags($post->post_title);
    $summary = wp_trim_words(wp_strip_all_tags($post->post_excerpt ?: $post->post_content), 40, '…');
    $link = elomai_social_link($post_id, 'linkedin');
    $hashtags = elomai_social_hashtags($post_id);

    $intro = [
        'de' => "Neuer Artikel: {$title}.",
        'en' => "New article: {$title}.",
        'fr' => "Nouvel article : {$title}.",
    ][$lang] ?? "New article: {$title}.";

    $insight = [
        'de' => "Ich beschreibe den technischen Aufbau, die Umsetzung und die Grenzen – ohne erfundene Kennzahlen.",
        'en' => 'I describe the technical design, the implementation and its limits — without invented numbers.',
        'fr' => 'Je décris la conception technique, la mise en œuvre et ses limites — sans chiffres inventés.',
    ][$lang] ?? '';

    $why = [
        'de' => 'Nützlich, wenn Sie ähnliche Systeme selbst betreiben oder bewerten wollen.',
        'en' => 'Useful if you want to run or evaluate a similar system yourself.',
        'fr' => 'Utile si vous voulez exploiter ou évaluer un système similaire.',
    ][$lang] ?? '';

    $question = [
        'de' => 'Wie lösen Sie das in Ihren Projekten? Ich freue mich über einen fachlichen Austausch.',
        'en' => 'How do you solve this in your projects? Happy to compare notes.',
        'fr' => 'Comment résolvez-vous cela dans vos projets ? Au plaisir d’échanger.',
    ][$lang] ?? '';

    return [
        'linkedin' => $intro . "\n\n" . $insight . "\n\n" . $why . "\n\n" . $link . "\n\n" . $hashtags,
        'facebook' => $intro . "\n\n" . $summary . "\n\n" . elomai_social_link($post_id, 'facebook'),
        'x' => mb_substr($title, 0, 120) . " — " . elomai_social_link($post_id, 'x'),
        'teaser' => $summary,
        'video' => sprintf(
            '%s — %s %s',
            $title,
            $lang === 'de' ? 'Kurzer technischer Überblick.' : 'Short technical walkthrough.',
            $link
        ),
        'caption' => sprintf('%s — %s', $title, $summary),
        'question' => $question,
        'generated_at' => current_time('mysql', true),
        'language' => $lang,
    ];
}

add_action('admin_post_elomai_generate_social', function () {
    $post_id = (int) ($_GET['post'] ?? 0);
    if (!$post_id || !current_user_can('edit_post', $post_id)) {
        wp_die('Nicht erlaubt.');
    }
    check_admin_referer('elomai_generate_social_' . $post_id);
    $drafts = elomai_generate_social_drafts($post_id);
    update_post_meta($post_id, '_elomai_social', $drafts);
    wp_safe_redirect(add_query_arg('elomai_social_generated', '1', get_edit_post_link($post_id, 'url')));
    exit;
});

function elomai_render_social_box($post) {
    $drafts = elomai_social_meta($post->ID);
    $generate_url = wp_nonce_url(
        admin_url('admin-post.php?action=elomai_generate_social&post=' . $post->ID),
        'elomai_generate_social_' . $post->ID
    );
    ?>
    <p class="description">
        Erzeugt bearbeitbare Vorschläge mit kanonischem Link und UTM-Parametern. Es wird nichts automatisch
        veröffentlicht und es werden keine Zugangsdaten von Social-Media-Konten gespeichert.
    </p>
    <p>
        <a class="button" href="<?php echo esc_url($generate_url); ?>">
            <?php echo $drafts ? 'Vorschläge neu erzeugen' : 'Social-Media-Vorschläge vorbereiten'; ?>
        </a>
        <?php if (!empty($drafts['generated_at'])) : ?>
            <span class="elomai-muted">Erzeugt: <?php echo esc_html($drafts['generated_at']); ?> UTC · Sprache: <?php echo esc_html(strtoupper($drafts['language'] ?? '')); ?></span>
        <?php endif; ?>
    </p>

    <?php if ($drafts) : ?>
        <?php
        $fields = [
            'linkedin' => 'LinkedIn',
            'facebook' => 'Facebook',
            'x' => 'X',
            'teaser' => 'Kurz-Teaser',
            'video' => 'Video-Beschreibung',
            'caption' => 'Bildunterschrift',
            'question' => 'Diskussionsfrage',
        ];
        foreach ($fields as $key => $label) :
            if (empty($drafts[$key])) {
                continue;
            }
            $id = 'elomai_social_' . $key;
            ?>
            <div class="elomai-social-field">
                <label for="<?php echo esc_attr($id); ?>"><strong><?php echo esc_html($label); ?></strong></label>
                <textarea id="<?php echo esc_attr($id); ?>" rows="<?php echo $key === 'x' ? 2 : 5; ?>" class="widefat code"><?php echo esc_textarea($drafts[$key]); ?></textarea>
                <p class="elomai-social-actions">
                    <button type="button" class="button button-small" data-elomai-copy-target="<?php echo esc_attr($id); ?>">Kopieren</button>
                    <span class="elomai-copy-feedback" aria-live="polite"></span>
                </p>
            </div>
        <?php endforeach; ?>
        <p class="elomai-muted">Kanonischer Link ohne Tracking-Parameter:
            <code><?php echo esc_html(elomai_public_url($post->ID) ?: '—'); ?></code>
        </p>
    <?php else : ?>
        <p class="elomai-muted">Noch keine Vorschläge erzeugt.</p>
    <?php endif; ?>
    <?php
}
