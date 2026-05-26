<?php
/**
 * ===========================================================
 * ACF Gutenberg Blocks Registration + Early Assets Enqueue
 * ===========================================================
 *
 * Project structure:
 *  PHP: template-parts/sections/{block_name}.php
 *  CSS: build/css/sections/{block_name}.min.css
 *  JS:  build/js/sections/{block_name}.min.js
 *
 * IMPORTANT:
 * - Do NOT use enqueue_style/enqueue_script inside acf_register_block_type
 *   (they output <link> and <script> tags too late — after the <head> section).
 * - Section styles and scripts are enqueued EARLY, based on which blocks
 *   are actually present on the current page.
 */


add_action('acf/init', 'smplfy_register_acf_blocks');
function smplfy_register_acf_blocks() {
    $blocks = [
        'hero_section',
        // 'core_benefits',
        // 'call_to_action',
        // ...
    ];

    foreach ($blocks as $block_name) {
        acf_register_block_type([
            'name'            => $block_name,
            // Converts snake_case slug to Title Case (e.g. hero_section → "Hero Section")
            'title'           => ucwords(str_replace('_', ' ', $block_name)),
            'render_template' => "template-parts/sections/{$block_name}.php",
            'category'        => 'smlfy',
            'icon'            => 'admin-customizer',
            'mode'            => 'preview',
            'keywords'        => ['section', $block_name],
            'supports'        => [
                'align' => false,
                'mode'  => true,
                'jsx'   => true,
            ],
        ]);
    }

    add_filter('smplfy_registered_acf_blocks', function($list) use ($blocks) {
        return array_unique(array_merge($list, $blocks));
    });
}

add_filter('block_categories_all', 'smplfy_custom_block_category', 10, 2);
function smplfy_custom_block_category($categories, $post) {
    return array_merge($categories, [[
        'slug'  => 'smlfy',
        'title' => __('SMLFY Blocks', 'smplfy'),
        'icon'  => null,
    ]]);
}

add_action('wp_enqueue_scripts', 'smplfy_enqueue_detected_block_assets', 6);
function smplfy_enqueue_detected_block_assets() {
    if (is_admin() || !is_singular()) return;

    global $post;
    if (!$post) return;

    $theme_uri = get_template_directory_uri();
    $ver       = wp_get_theme()->get('Version');
    $registered_blocks = apply_filters('smplfy_registered_acf_blocks', []);

    $map = [];
    foreach ($registered_blocks as $slug) {
        $css_rel = "build/css/sections/{$slug}.min.css";
        $js_rel  = "build/js/sections/{$slug}.min.js";

        $css_handle = 'block-acf-' . str_replace('_', '-', $slug) . '-css';
        $js_handle  = 'block-acf-' . str_replace('_', '-', $slug) . '-js';

        $css_exists = file_exists(get_template_directory() . '/' . $css_rel);
        $js_exists  = file_exists(get_template_directory() . '/' . $js_rel);

        $map[$slug] = [
            $css_handle,
            $css_exists ? $css_rel : null,
            $js_handle,
            $js_exists ? $js_rel : null,
        ];
    }

    $blocks = parse_blocks($post->post_content ?? '');
    $used = [];
    $stack = $blocks;
    while ($stack) {
        $b = array_shift($stack);
        if (!empty($b['blockName'])) $used[$b['blockName']] = true;
        if (!empty($b['innerBlocks'])) foreach ($b['innerBlocks'] as $ib) $stack[] = $ib;
    }

    $found_any = false;
    foreach ($map as $slug => $cfg) {
        $block_name = 'acf/' . str_replace('_','-',$slug);
        if (!isset($used[$block_name])) continue;

        list($css_handle, $css_rel, $js_handle, $js_rel) = $cfg;

        if ($css_rel && !wp_style_is($css_handle, 'enqueued')) {
            wp_enqueue_style($css_handle, "{$theme_uri}/{$css_rel}", [], $ver);
        }
        if ($js_rel && !wp_script_is($js_handle, 'enqueued')) {
            wp_enqueue_script($js_handle, "{$theme_uri}/{$js_rel}", [], $ver, true);
        }
        $found_any = true;
    }

    if (!$found_any) {
        foreach ($map as $slug => $cfg) {
            list($css_handle, $css_rel, $js_handle, $js_rel) = $cfg;
            if ($css_rel && !wp_style_is($css_handle, 'enqueued')) {
                wp_enqueue_style($css_handle, "{$theme_uri}/{$css_rel}", [], $ver);
            }
        }
    }
}
