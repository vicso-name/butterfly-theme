<?php

    add_action('admin_enqueue_scripts', function () {
        wp_enqueue_style(
            'admin-styles',
            THEME_URI . '/build/css/admin-styles.min.css',
            [],
            S_VERSION
        );
    });


    add_action('wp_enqueue_scripts', function () {

        wp_enqueue_style(
            'umbrella-style',
            get_stylesheet_uri(),
            [],
            S_VERSION
        );
        wp_style_add_data('umbrella-style', 'rtl', 'replace');

        wp_enqueue_style(
            'swiper-style',
            get_template_directory_uri() . '/assets/swiper/swiper-bundle.min.css',
            ['umbrella-style'],
            S_VERSION
        );

        wp_enqueue_style(
            'main-styles',
            THEME_URI . '/build/css/style.min.css',
            ['umbrella-style', 'swiper-style'],
            S_VERSION
        );

        wp_enqueue_script(
            'swiper-script',
            get_template_directory_uri() . '/assets/swiper/swiper-bundle.min.js',
            [],
            S_VERSION,
            true
        );

        wp_enqueue_script(
            'main-scripts',
            THEME_URI . '/build/js/general.min.js',
            ['swiper-script'],
            S_VERSION,
            true
        );
    });

    function theme_domain_enqueue_editor_assets() {
        wp_enqueue_script(
            'acf-block-toggle',
            get_template_directory_uri() . '/build/js/admin-scripts.min.js',
            array(),
            S_VERSION,
            true
        );

        wp_enqueue_style(
            'acf-block-toggle-style',
            get_template_directory_uri() . '/build/css/acf-block-toggle.min.css',
            array(),
            S_VERSION
        );
    }
    add_action('enqueue_block_editor_assets', 'theme_domain_enqueue_editor_assets');
