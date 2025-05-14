<?php
// Enable shortcodes in widgets
add_filter('widget_text', 'do_shortcode', 11);

// Remove WordPress version from head for security
remove_action('wp_head', 'wp_generator');

// Remove emoji scripts and styles for performance optimization
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('admin_print_scripts', 'print_emoji_detection_script');
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('admin_print_styles', 'print_emoji_styles');

// Replace default WordPress menu classes with custom classes
function change_menu_classes($classes) {
    $classes = str_replace(['current-menu-item', 'current-menu-parent', 'current_page_item'], 'active', $classes);
    return $classes;
}
add_filter('nav_menu_css_class', 'change_menu_classes');
add_filter('page_css_class', 'change_menu_classes');

// Automatically add title as alt text if alt is missing
function add_title_to_empty_alt($response) {
    if (empty($response['alt'])) {
        $response['alt'] = sanitize_text_field($response['title']);
    }
    return $response;
}
add_filter('wp_prepare_attachment_for_js', 'add_title_to_empty_alt');

// Disable automatic paragraph wrapping in Contact Form 7
add_filter('wpcf7_autop_or_not', '__return_false');

// Fallback functions if ACF (Advanced Custom Fields) is not available
if (!class_exists('acf') && !is_admin()) {
    function get_field_reference() { return ''; }
    function get_field_objects() { return false; }
    function get_fields() { return false; }
    function get_field() { return false; }
    function get_field_object() { return false; }
    function the_field() {}
    function have_rows() { return false; }
    function the_row() {}
    function reset_rows() {}
    function has_sub_field() { return false; }
    function get_sub_field() { return false; }
    function the_sub_field() {}
    function get_sub_field_object() { return false; }
    function acf_get_child_field_from_parent_field() { return false; }
    function register_field_group() {}
    function get_row_layout() { return false; }
    function acf_form_head() {}
    function acf_form() {}
    function update_field() { return false; }
    function delete_field() {}
    function create_field() {}
    function reset_the_repeater_field() {}
    function the_repeater_field() { return false; }
    function the_flexible_field() { return false; }
    function acf_filter_post_id($post_id) { return $post_id; }
}

// Add Open Graph meta tags for social sharing
function add_opengraph_namespace($output) {
    return $output . ' xmlns="http://www.w3.org/1999/xhtml" prefix="og: http://ogp.me/ns# fb: http://www.facebook.com/2008/fbml"';
}
add_filter('language_attributes', 'add_opengraph_namespace');

function add_opengraph_meta_tags() {
    global $post;
    
    if (is_single() || is_page()) {
        $img_src = '';
        $image_share = get_field('image_share', $post->ID);
        
        if ($image_share) {
            $img_src = $image_share['url'];
            $img_width = $image_share['width'];
            $img_height = $image_share['height'];
        } elseif (has_post_thumbnail($post->ID)) {
            $img_data = wp_get_attachment_image_src(get_post_thumbnail_id($post->ID), 'full');
            $img_src = $img_data[0];
            $img_width = $img_data[1];
            $img_height = $img_data[2];
        }
        
        $excerpt = $post->post_content ? wp_trim_words(strip_shortcodes(strip_tags($post->post_content)), 55) : get_bloginfo('description');
        
        echo '<meta property="og:type" content="article"/>';
        echo '<meta property="og:title" content="' . get_the_title() . '"/>';
        if ($img_src) {
            echo '<meta property="og:image" content="' . esc_url($img_src) . '"/>';
            echo '<meta property="og:image:width" content="' . esc_attr($img_width) . '"/>';
            echo '<meta property="og:image:height" content="' . esc_attr($img_height) . '"/>';
        }
        echo '<meta property="og:description" content="' . esc_attr($excerpt) . '"/>';
        echo '<meta property="og:url" content="' . esc_url(get_the_permalink()) . '"/>';
        echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo()) . '"/>';
        echo '<meta property="article:published_time" content="' . esc_attr(date('c', strtotime($post->post_date_gmt))) . '"/>';
        echo '<meta property="article:modified_time" content="' . esc_attr(date('c', strtotime($post->post_date_gmt))) . '"/>';

        echo '<meta name="twitter:card" content="summary_large_image"/>';
        echo '<meta name="twitter:site" content="@' . esc_attr(get_bloginfo('name')) . '"/>';
        echo '<meta name="twitter:text:title" content="' . esc_attr(get_the_title()) . '"/>';
        echo '<meta name="twitter:url" content="' . esc_url(get_the_permalink()) . '"/>';
        echo '<meta name="twitter:text:description" content="' . esc_attr($excerpt) . '"/>';
        if ($img_src) {
            echo '<meta name="twitter:image" content="' . esc_url($img_src) . '"/>';
        }
    }
}
add_action('wp_head', 'add_opengraph_meta_tags', 5);


// Add custom body classes
add_filter('body_class', 'add_custom_body_class');

function add_custom_body_class($classes) {
    if (is_post_type_archive('project') || is_tax('project_category') || is_singular('project')) {
        $classes[] = 'color-theme-black';
    }
    return $classes;
}

// Get page ID by template
function get_template_page_id($template_name = '') {
    if (!$template_name) {
        return '';
    }
    
    $pages = new WP_Query(array(
        'post_type'     => 'page',
        'fields'        => 'ids',
        'nopaging'      => true,
        'meta_key'      => '_wp_page_template',
        'meta_value'    => $template_name,
    ));
    
    return !empty($pages->posts[0]) ? $pages->posts[0] : '';
}

// Allow SVG
function add_file_types_to_uploads($file_types){
	$new_filetypes = array();
	$new_filetypes['svg'] = 'image/svg+xml';
	$file_types = array_merge($file_types, $new_filetypes );
	return $file_types;
}
add_filter('upload_mimes', 'add_file_types_to_uploads');


// Nen logo login Page

add_action( 'login_head', 'true_change_login_logo' );
 
function true_change_login_logo() {
	echo '<style>
	#login h1 a{
		background-image : url(' . get_stylesheet_directory_uri() . '/assets/img/login-logo.jpg);
	}
	</style>';
}

add_filter('jpeg_quality', function($arg){return 100;});


// Disable WordPress' automatic image scaling feature

add_filter( 'big_image_size_threshold', '__return_false' );


add_filter( 'rank_math/frontend/breadcrumb/args', function( $args ) {
  $args = array(
    'delimiter'   => '&nbsp;/&nbsp;',
    'wrap_before' => '<nav class="rank-math-breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">',
    'wrap_after'  => '</nav>',
    'before'      => '<span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">',
    'after'       => '</span>',
  );
  return $args;
});


add_filter( 'rank_math/frontend/breadcrumb/html', function( $html, $crumbs, $class ) {
    ob_start(); 
?>
    <nav class="mkdf-container-inner breadcrumbs rank-math-breadcrumb" itemscope="" itemtype="https://schema.org/BreadcrumbList">
        <?php 
        $iii = 0;
        $summ = count($crumbs);
        foreach ($crumbs as $key => $crumb) {
            $iii++;
            ?>
            <?php if ($iii == $summ) { ?>
                <span itemprop="itemListElement" itemscope="" itemtype="https://schema.org/ListItem">
                    <span class="last" itemprop="name"><?php echo esc_html($crumb[0]); ?></span>
                    <meta itemprop="position" content="<?php echo esc_attr($iii); ?>" />
                </span>
            <?php } else { ?>
                <span itemprop="itemListElement" itemscope="" itemtype="https://schema.org/ListItem">
                    <a itemprop="item" href="<?php echo esc_url($crumb[1]); ?>">
                        <span itemprop="name"><?php echo esc_html($crumb[0]); ?></span>
                    </a>
                    <meta itemprop="position" content="<?php echo esc_attr($iii); ?>" />
                </span>
                <span class="separator"> / </span>
            <?php } ?>
        <?php } ?>
    </nav>
<?php
    return ob_get_clean();
}, 10, 3);



function is_blog () {
    return ( is_archive() || is_author() || is_category() || is_home() || is_tag()) && 'post' == get_post_type();
}

/**  Disable Comments */

if(get_field('disable_comments','option')){

    add_action('admin_init', function () {

        global $pagenow;

        if ($pagenow === 'edit-comments.php') {
            wp_redirect(admin_url());
            exit;
        }

        remove_meta_box('dashboard_recent_comments', 'dashboard', 'normal');

        foreach (get_post_types() as $post_type) {
            if (post_type_supports($post_type, 'comments')) {
                remove_post_type_support($post_type, 'comments');
                remove_post_type_support($post_type, 'trackbacks');
            }
        }
    });

    add_filter('comments_open', '__return_false', 20, 2);
    add_filter('pings_open', '__return_false', 20, 2);

    add_filter('comments_array', '__return_empty_array', 10, 2);

    add_action('admin_menu', function () {
        remove_menu_page('edit-comments.php');
    });

    add_action('init', function () {
        if (is_admin_bar_showing()) {
            remove_action('admin_bar_menu', 'wp_admin_bar_comments_menu', 60);

        }
    });
    function remove_menu_items(){
        remove_submenu_page( 'options-general.php', 'options-discussion.php' );
    }
    add_action( 'admin_menu', 'remove_menu_items', 999 );

}

/** Hide default widgets */

if(get_field('disable_widgets','option')){
	function remove_dashboard_widgets() {
		global $wp_meta_boxes;
		unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_activity']);
		unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_right_now']);
		unset($wp_meta_boxes['dashboard']['side']['core']['dashboard_quick_press']);
		unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_incoming_links']);
		unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_plugins']);
		unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_recent_drafts']);
		unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_recent_comments']);
		unset($wp_meta_boxes['dashboard']['side']['core']['dashboard_primary']);
		unset($wp_meta_boxes['dashboard']['side']['core']['dashboard_secondary']);
		unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_site_health']);
		unset($wp_meta_boxes['dashboard']['normal']['core']['dashboard_php_nag']);
	}
	add_action('wp_dashboard_setup', 'remove_dashboard_widgets' );
	remove_action( 'try_gutenberg_panel', 'wp_try_gutenberg_panel' );
	add_action('wp_dashboard_setup', 'remove_wpseo_dashboard_overview' );
	function remove_wpseo_dashboard_overview() {
		remove_meta_box( 'wpseo-dashboard-overview', 'dashboard', 'side' );
	}
    function remove_php_nag() {
        remove_meta_box( 'dashboard_php_nag', 'dashboard', 'normal' );
    }
    add_action( 'wp_dashboard_setup', 'remove_php_nag' );
}else{
    function smplfy_widgets_init() {
        register_sidebar(
            array(
                'name'          => esc_html__( 'Sidebar', 'smplfy' ),
                'id'            => 'sidebar-1',
                'description'   => esc_html__( 'Add widgets here.', 'smplfy' ),
                'before_widget' => '<section id="%1$s" class="widget %2$s">',
                'after_widget'  => '</section>',
                'before_title'  => '<h2 class="widget-title">',
                'after_title'   => '</h2>',
            )
        );
    }
    add_action( 'widgets_init', 'smplfy_widgets_init' );
}

/**  Disable Jquery */

if(get_field('disable_jquery','option')){
    function disable_jquery() {
        if (!is_admin()) { 
            wp_deregister_script('jquery'); 
        }
    }
    add_action('wp_enqueue_scripts', 'disable_jquery');
}
