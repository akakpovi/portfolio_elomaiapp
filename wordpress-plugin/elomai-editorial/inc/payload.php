<?php
/**
 * Builds the canonical payload that is sent to the content receiver.
 * Everything the public site shows is derived here: validated HTML, exported
 * media, translations, SEO fields and project links.
 */

defined('ABSPATH') || exit;

/** Categories that map to a portfolio project card. */
function elomai_project_map() {
    return [
        'aka-ia' => ['AKA IA', '/#project-aka-ia', 'Multi-model AI chat platform with local model routing.'],
        'presence' => ['Presence', '/#project-presence', 'Website monitoring SaaS built with Django and Celery.'],
        'afro-haar-app' => ['Afro-Haar-App', '/#project-afro-haar-app', 'Booking and marketplace app for Afro hair care.'],
        'ecovision' => ['EcoVision', '/#project-ecovision', 'Computer-vision system for waste classification.'],
        'infrastructure-as-code' => ['Infrastructure as Code', '/#project-iac', 'Reproducible VPS infrastructure with OpenTofu.'],
    ];
}

/** Encode bytes and derive a content-addressed reference. */
function elomai_media_ref($bytes, $mime) {
    $ext = [
        'image/webp' => 'webp',
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'image/gif' => 'gif',
        'image/avif' => 'avif',
    ][$mime] ?? 'webp';
    return ['ref' => hash('sha256', $bytes) . '.' . $ext, 'dataBase64' => base64_encode($bytes), 'mime' => $mime];
}

/**
 * Exports one attachment as optimised WebP variants (max 1600px and 800px).
 * WordPress performs the conversion with its own image editor, so the VPS
 * never has to process images.
 */
function elomai_export_attachment($attachment_id, &$media) {
    $attachment_id = (int) $attachment_id;
    if ($attachment_id < 1) {
        return null;
    }
    $file = get_attached_file($attachment_id);
    if (!$file || !file_exists($file)) {
        return null;
    }
    $info = @getimagesize($file);
    // getimagesize() returns width/height at indexes 0 and 1, not as string keys.
    if (!$info || empty($info[0]) || empty($info[1])) {
        return null;
    }
    if (filesize($file) > 12 * 1024 * 1024) {
        return null;
    }

    $target_mime = wp_image_editor_supports(['mime_type' => 'image/webp']) ? 'image/webp' : ($info['mime'] ?: 'image/jpeg');
    $original_width = (int) $info[0];
    // Always ship the largest useful size, plus a mobile variant when the
    // original is large enough for the difference to matter.
    $widths = [min(1600, $original_width)];
    if ($original_width > 1000) {
        $widths[] = 800;
    }
    $widths = array_values(array_unique($widths));

    $variants = [];
    foreach ($widths as $width) {
        $editor = wp_get_image_editor($file);
        if (is_wp_error($editor)) {
            continue;
        }
        $size = $editor->get_size();
        if (!empty($size['width']) && $size['width'] > $width) {
            $editor->resize($width, null, false);
        }
        if (method_exists($editor, 'set_quality')) {
            $editor->set_quality(82);
        }
        $tmp = wp_tempnam('elomai');
        $saved = $editor->save($tmp, $target_mime);
        if (is_wp_error($saved) || empty($saved['path']) || !file_exists($saved['path'])) {
            if (file_exists($tmp)) {
                @unlink($tmp);
            }
            continue;
        }
        $bytes = file_get_contents($saved['path']);
        @unlink($saved['path']);
        if (!$bytes) {
            continue;
        }
        $encoded = elomai_media_ref($bytes, $saved['mime'] ?? $target_mime);
        $dimensions = @getimagesizefromstring($bytes);
        $variants[] = [
            'ref' => $encoded['ref'],
            'dataBase64' => $encoded['dataBase64'],
            'mime' => $encoded['mime'],
            'width' => $dimensions[0] ?? $width,
            'height' => $dimensions[1] ?? 0,
        ];
    }

    if (!$variants) {
        return null;
    }
    usort($variants, fn($a, $b) => $b['width'] <=> $a['width']);

    foreach ($variants as $variant) {
        $media[$variant['ref']] = ['ref' => $variant['ref'], 'dataBase64' => $variant['dataBase64']];
    }

    return [
        'ref' => $variants[0]['ref'],
        'width' => $variants[0]['width'],
        'height' => $variants[0]['height'],
        'variants' => array_map(fn($v) => ['ref' => $v['ref'], 'width' => $v['width']], $variants),
    ];
}

/** Rewrites <img> tags to exported media references. */
function elomai_rewrite_images($html, &$media, &$warnings) {
    return preg_replace_callback('/<img\b[^>]*>/i', function ($match) use (&$media, &$warnings) {
        $tag = $match[0];
        if (!preg_match('/\bsrc="([^"]+)"/i', $tag, $src_match)) {
            return '';
        }
        $src = html_entity_decode($src_match[1], ENT_QUOTES);
        $attachment_id = attachment_url_to_postid($src);
        if (!$attachment_id && preg_match('/[?&]attachment_id=(\d+)/', $src, $m)) {
            $attachment_id = (int) $m[1];
        }
        if (!$attachment_id) {
            if (strpos($src, home_url()) === 0) {
                $warnings[] = 'Bild ohne Medienbibliothek-Eintrag wurde entfernt: ' . $src;
                return '';
            }
            return $tag; // externally hosted image stays untouched
        }

        $exported = elomai_export_attachment($attachment_id, $media);
        if (!$exported) {
            $warnings[] = 'Bild konnte nicht exportiert werden: ' . $src;
            return '';
        }

        $alt = preg_match('/\balt="([^"]*)"/i', $tag, $alt_match) ? $alt_match[1] : '';
        if ($alt === '') {
            $alt = (string) get_post_meta($attachment_id, '_wp_attachment_image_alt', true);
        }
        $srcset = array_map(
            fn($v) => '/media/' . $v['ref'] . ' ' . (int) $v['width'] . 'w',
            $exported['variants']
        );
        $srcset_attr = count($srcset) > 1
            ? ' srcset="' . esc_attr(implode(', ', $srcset)) . '" sizes="(max-width: 720px) 100vw, 760px"'
            : '';

        return sprintf(
            '<img src="elomai-media:%s"%s width="%d" height="%d" alt="%s" loading="lazy" decoding="async" />',
            esc_attr($exported['ref']),
            $srcset_attr,
            (int) $exported['width'],
            (int) $exported['height'],
            esc_attr(wp_strip_all_tags($alt))
        );
    }, $html);
}

/** Internal WordPress links become public portfolio links, or lose their link. */
function elomai_rewrite_links($html, &$warnings) {
    $site_host = wp_parse_url(home_url(), PHP_URL_HOST);

    return preg_replace_callback('/<a\b([^>]*?)href="([^"]+)"([^>]*)>(.*?)<\/a>/is', function ($match) use ($site_host, &$warnings) {
        $href = html_entity_decode($match[2], ENT_QUOTES);
        $host = wp_parse_url($href, PHP_URL_HOST);

        if ($host && $host !== $site_host) {
            return $match[0];
        }

        $target_id = 0;
        if (!$host && strpos($href, '/') === 0) {
            return $match[0]; // already a site-relative link to the portfolio
        }
        if ($host === $site_host) {
            $target_id = url_to_postid($href);
        }

        if ($target_id) {
            $public = elomai_public_url($target_id);
            if ($public) {
                return sprintf('<a href="%s">%s</a>', esc_url($public), $match[4]);
            }
            $warnings[] = 'Interner Link auf nicht veröffentlichten Beitrag entfernt: ' . get_the_title($target_id);
            return $match[4];
        }

        $warnings[] = 'Interner Link ohne öffentliches Ziel in Text umgewandelt: ' . $href;
        return $match[4];
    }, $html);
}

/** Removes anything that must never reach a public page. */
function elomai_strip_unsafe($html) {
    $html = preg_replace('#<script\b[^>]*>.*?</script>#is', '', $html);
    $html = preg_replace('#<style\b[^>]*>.*?</style>#is', '', $html);
    $html = preg_replace('/<!--.*?-->/s', '', $html);
    // Keep only privacy-enhanced, responsive embeds.
    $html = preg_replace_callback('/<iframe\b[^>]*src="([^"]+)"[^>]*>\s*<\/iframe>/i', function ($m) {
        $src = $m[1];
        if (!preg_match('#^https://(www\.)?(youtube(-nocookie)?\.com|player\.vimeo\.com)/#i', $src)) {
            return '';
        }
        return '<div class="embed-video"><iframe src="' . esc_url($src) . '" title="Video" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    }, $html);
    // Drop any surviving iframe that we did not whitelist above.
    $html = preg_replace('#<iframe\b[^>]*>.*?</iframe>#is', '', $html);
    return $html;
}

/** SEO values with sane automatic fallbacks. */
function elomai_seo_payload($post, $excerpt, $featured_ref = null) {
    $seo = elomai_seo_meta($post->ID);
    $fallback_keywords = array_map('strval', (array) wp_get_post_tags($post->ID, ['fields' => 'names']));
    $title = trim((string) ($seo['title'] ?? ''));
    $description = trim((string) ($seo['description'] ?? ''));
    $keywords = array_values(array_filter(array_map('trim', explode(',', (string) ($seo['keywords'] ?? '')))));
    $og_image = (int) ($seo['og_image'] ?? 0);

    if ($description === '') {
        $description = wp_trim_words(wp_strip_all_tags($excerpt), 32, '');
    }
    if (mb_strlen($description) > 160) {
        $description = mb_substr($description, 0, 157) . '…';
    }

    $og_image_ref = null;
    if ($og_image) {
        $media = [];
        $variant = elomai_export_attachment($og_image, $media);
        if ($variant) {
            $og_image_ref = $variant;
        }
    }

    return [
        'seo' => [
            'title' => $title ?: ($post->post_title . ' — EL0M AI ENGINEER'),
            'description' => $description,
            'keywords' => array_slice($keywords ?: $fallback_keywords, 0, 8),
            'ogTitle' => (string) ($seo['og_title'] ?? ''),
            'ogDescription' => (string) ($seo['og_description'] ?? ''),
            'ogImageRef' => $variant ?? null,
            'canonical' => (string) ($seo['canonical'] ?? ''),
        ],
        'media' => $media ?? [],
        'featuredFallback' => $featured_ref,
    ];
}

/**
 * Validates a post for publication and returns the payload array.
 *
 * @return array{article: array, media: array, warnings: string[]}|\WP_Error
 */
function elomai_build_payload($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'post') {
        return new WP_Error('elomai_invalid_post', 'Kein Beitrag.');
    }
    if ($post->post_status !== 'publish') {
        return new WP_Error('elomai_not_published', 'Nur veröffentlichte Beiträge werden synchronisiert.');
    }

    $lang = elomai_post_language($post->ID);
    $slug = sanitize_title($post->post_name ?: $post->post_title);
    if (!$slug) {
        return new WP_Error('elomai_missing_slug', 'Der Beitrag benötigt einen gültigen Slug.');
    }
    $title = trim(wp_strip_all_tags($post->post_title));
    if (mb_strlen($title) < 8) {
        return new WP_Error('elomai_short_title', 'Der Titel ist zu kurz (mindestens 8 Zeichen).');
    }

    $media = [];
    $warnings = [];

    setup_postdata($post);
    $html = apply_filters('the_content', $post->post_content);
    wp_reset_postdata();

    $html = elomai_strip_unsafe($html);
    $html = elomai_rewrite_images($html, $media, $warnings);
    $html = elomai_rewrite_links($html, $warnings);

    $text_length = mb_strlen(trim(wp_strip_all_tags($html)));
    if ($text_length < 120) {
        return new WP_Error('elomai_too_short', 'Der Inhalt ist zu kurz für einen öffentlichen Artikel (mindestens 120 Zeichen).');
    }

    $featured = null;
    $thumbnail_id = (int) get_post_thumbnail_id($post->ID);
    if ($thumbnail_id) {
        $exported = elomai_export_attachment($thumbnail_id, $media);
        if ($exported) {
            $featured = [
                'ref' => $exported['ref'],
                'width' => $exported['width'],
                'height' => $exported['height'],
                'alt' => wp_strip_all_tags((string) get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true)),
                'caption' => wp_strip_all_tags((string) wp_get_attachment_caption($thumbnail_id)),
                'variants' => $exported['variants'],
            ];
        }
    }

    $seo_payload = elomai_seo_payload($post, $post->post_excerpt ?: $html, $featured['ref'] ?? null);
    foreach ($seo_payload['media'] as $ref => $item) {
        $media[$ref] = $item;
    }
    $seo = $seo_payload['seo'];
    if ($seo['ogImageRef']) {
        $featured_variants = [[
            'ref' => $seo['ogImageRef']['ref'],
            'width' => $seo['ogImageRef']['width'],
        ]];
        $featured = [
            'ref' => $seo['ogImageRef']['ref'],
            'width' => $seo['ogImageRef']['width'],
            'height' => $seo['ogImageRef']['height'],
            'alt' => $featured['alt'] ?? '',
            'caption' => $featured['caption'] ?? '',
            'variants' => $featured_variants,
        ];
    }
    unset($seo['ogImageRef']);

    $categories = [];
    $terms = get_the_category($post->ID);
    if ($terms) {
        usort($terms, fn($a, $b) => ($b->parent <=> $a->parent) ?: ($a->term_id <=> $b->term_id));
        foreach ($terms as $term) {
            if ($term->slug === 'uncategorized') {
                continue;
            }
                $categories[] = [
                'slug' => $term->slug,
                'name' => html_entity_decode($term->name, ENT_QUOTES, 'UTF-8'),
            ];
        }
    }
    if (!$categories) {
        $warnings[] = 'Keine Kategorie zugewiesen – der Artikel erscheint ohne Themenzuordnung.';
    }

    $related_projects = [];
    foreach (elomai_project_map() as $category_slug => $project) {
        foreach ($categories as $category) {
            if ($category['slug'] === $category_slug) {
                $related_projects[] = [
                    'name' => $project[0],
                    'url' => $project[1],
                    'description' => $project[2],
                ];
            }
        }
    }

    $translations = [];
    foreach (elomai_translation_group($post->ID) as $sibling_id) {
        if ((int) $sibling_id === (int) $post->ID) {
            continue;
        }
        $sibling = get_post($sibling_id);
        if (!$sibling || $sibling->post_status !== 'publish') {
            continue;
        }
        $translations[] = [
            'lang' => elomai_post_language($sibling_id),
            'slug' => $sibling->post_name,
            'title' => $sibling->post_title,
        ];
    }

    $tags = wp_get_post_tags($post->ID, ['fields' => 'names']);

    $article = [
        'uuid' => elomai_uuid($post->ID),
        'wpId' => (int) $post->ID,
        'lang' => $lang,
        'slug' => $slug,
        'title' => $title,
        'subtitle' => wp_strip_all_tags((string) trim($post->post_excerpt)),
        'excerpt' => wp_trim_words(wp_strip_all_tags($post->post_excerpt ?: $html), 38, '…'),
        'html' => $html,
        'media' => array_values($media),
        'featured' => $featured,
        'author' => ['name' => get_the_author_meta('display_name', $post->post_author) ?: 'Elom Akakpovi'],
        'publishedAt' => get_post_time('c', true, $post),
        'modifiedAt' => get_post_modified_time('c', true, $post),
        'categories' => array_slice($categories, 0, 4),
        'tags' => array_slice(array_map('strval', (array) $tags), 0, 12),
        'translations' => $translations,
        'relatedProjects' => array_slice($related_projects, 0, 4),
        'readingMinutes' => elomai_reading_minutes($html),
        'seo' => $seo,
    ];

    // The receiver signs the body; this hash identifies the *content* version.
    $hash = hash('sha256', wp_json_encode([
        $article['title'],
        $article['subtitle'],
        $article['excerpt'],
        $article['html'],
        $article['seo'],
        $article['featured'],
        $article['categories'],
        $article['translations'],
        $article['publishedAt'],
        $article['modifiedAt'],
    ]));

    return ['article' => $article, 'hash' => $hash, 'warnings' => array_values(array_unique($warnings))];
}
