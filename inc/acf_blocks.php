<?php
/**
 * ===========================================================
 * ACF Gutenberg Blocks Registration
 * ===========================================================
 *
 * 📦 Purpose:
 * This file automatically registers all ACF-based Gutenberg blocks
 * using a unified structure:
 * - PHP template:    template-parts/sections/{block_name}.php
 * - CSS file:        build/css/sections/{block_name}.min.css
 * - JS file:         build/js/sections/{block_name}.min.js
 *
 * 📁 Blocks appear in the Gutenberg editor under the category: "SMLFY Blocks"
 * 📌 To add a new block — simply add its name to the $blocks array
 */


add_action('acf/init', 'barvy_register_acf_blocks');

function barvy_register_acf_blocks() {
    $blocks = [
        // ✅ Add your custom block names below:
        // 'about_us_section',
        // 'contact_form_block',
        // 'testimonials_slider',
        'hero_section',
        
    ];

    foreach ($blocks as $block_name) {
        acf_register_block_type([
            'name'              => $block_name,
            'title'             => ucwords(str_replace('_', ' ', str_replace('investments_', '', $block_name))),
            'render_template'   => "template-parts/sections/{$block_name}.php",
            'category'          => 'smlfy',  // ✅ You can change this slug to match your project namespace
            'icon'              => 'admin-customizer',
            'mode'              => 'preview',
            'keywords'          => ['investment', 'section', $block_name],
            'supports'          => [
                'align' => false,
                'mode' => true,
                'jsx' => true,
            ],
            'enqueue_style'     => get_template_directory_uri() . "/build/css/sections/{$block_name}.min.css",
            'enqueue_script'    => get_template_directory_uri() . "/build/js/sections/{$block_name}.min.js",
        ]);
    }
}

add_filter('block_categories_all', 'barvy_custom_block_category', 10, 2);

function barvy_custom_block_category($categories, $post) {
    return array_merge(
        $categories,
        [
            [
                'slug'  => 'smlfy',
                'title' => __('SMLFY Blocks', 'barvy'),
                'icon'  => null,
            ],
        ]
    );
}