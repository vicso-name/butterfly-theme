<section class="hero-section">
    <div class="container">

        <h1 class="hero-title">
            <?php the_field('main_title'); ?>
        </h1>
        <p><?php the_field('description'); ?></p>
        <?php 
            $link = get_field('get_in_touch_button');
            if( $link ): 
                $link_url = $link['url'];
                $link_title = $link['title'];
                $link_target = $link['target'] ? $link['target'] : '_self';
            ?>
            <a class="hero-button" href="<?php echo esc_url( $link_url ); ?>" target="<?php echo esc_attr( $link_target ); ?>">
                <?php echo esc_html( $link_title ); ?>
            </a>
        <?php endif; ?>

    </div>
</section>