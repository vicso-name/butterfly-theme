<?php


/**
 * Including styles in the admin dashboard
*/
if (is_admin()) {
    wp_enqueue_style('admin-styles', THEME_URI . '/build/css/admin-styles.min.css', array());
}


/**
 * Scripts and styles.
 */
function smplfy_scripts() {
	wp_enqueue_style( 'umbrella-style', get_stylesheet_uri(), array(), S_VERSION );
	wp_style_add_data( 'umbrella-style', 'rtl', 'replace' );
    wp_enqueue_style('swiper-style', get_template_directory_uri() . '/assets/swiper/swiper-bundle.min.css', array(), S_VERSION);
    wp_enqueue_style('main-styles', THEME_URI . '/build/css/style.min.css', array(), S_VERSION);

    wp_enqueue_script("main-scripts", THEME_URI . "/build/js/general.min.js", array(), S_VERSION, true);
    wp_enqueue_script('swiper-script', get_template_directory_uri() . '/assets/swiper/swiper-bundle.min.js', array(), S_VERSION, true);
    wp_enqueue_style("main-styles", THEME_URI . "/build/css/style.min.css", array(), S_VERSION);
}

add_action( 'wp_enqueue_scripts', 'smplfy_scripts' );