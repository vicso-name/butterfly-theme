# ACF Block Patterns Reference

A field-group cookbook for ACF Gutenberg blocks in the smplfy theme.
Covers registration anatomy, template anatomy, four standard field patterns, enqueue behaviour, and a manual creation checklist.

---

## 1. Block Registration Anatomy

Every block is registered in `inc/acf_blocks.php` by adding its slug to the `$blocks` array inside `smplfy_register_acf_blocks()`. The loop then calls `acf_register_block_type()` for each slug.

```php
// inc/acf_blocks.php

add_action('acf/init', 'smplfy_register_acf_blocks');
function smplfy_register_acf_blocks() {

    $blocks = [
        'hero_section',     // ← add new slugs here (snake_case)
        'core_benefits',
        'call_to_action',
    ];

    foreach ($blocks as $block_name) {
        acf_register_block_type([
            // Internal WordPress block name — must be globally unique.
            // ACF namespaces it as "acf/{block_name}" automatically.
            'name'            => $block_name,

            // Human-readable label shown in the block inserter.
            // snake_case → Title Case via str_replace + ucwords.
            'title'           => ucwords(str_replace('_', ' ', $block_name)),

            // PHP template rendered for this block.
            'render_template' => "template-parts/sections/{$block_name}.php",

            // Must match the 'slug' in smplfy_custom_block_category().
            'category'        => 'smlfy',

            // Any dashicon name. See: https://developer.wordpress.org/resource/dashicons/
            'icon'            => 'admin-customizer',

            // 'preview' shows the rendered output in the editor; 'edit' shows fields.
            'mode'            => 'preview',

            // Keywords used by the block inserter's search.
            'keywords'        => ['section', $block_name],

            'supports'        => [
                'align' => false,   // disable left/center/right/full align controls
                'mode'  => true,    // allow toggling preview ↔ edit in the editor
                'jsx'   => true,    // allow <InnerBlocks /> in the template
            ],
        ]);
    }

    // Exposes the registered block list to smplfy_enqueue_detected_block_assets()
    // via apply_filters('smplfy_registered_acf_blocks', []).
    add_filter('smplfy_registered_acf_blocks', function($list) use ($blocks) {
        return array_unique(array_merge($list, $blocks));
    });
}
```

**Key rules:**
- Slug must be `snake_case`. The block's WP name becomes `acf/snake-case` (underscores converted to dashes by ACF).
- The slug must match the PHP template filename, the SCSS filename, and the JS filename exactly.
- Never add `enqueue_style` or `enqueue_script` inside `acf_register_block_type` — those fire too late and insert tags after `</head>`. Asset loading is handled by `smplfy_enqueue_detected_block_assets()`.

---

## 2. PHP Template Anatomy

Each block maps to `template-parts/sections/{block_name}.php`. The file receives the `$block` variable from ACF automatically.

```php
<?php
/**
 * Block: Hero Section
 * Registered as: acf/hero-section
 * Assets:        build/css/sections/hero_section.min.css
 *                build/js/sections/hero_section.min.js  (if needed)
 */

// ACF field values
$heading    = get_field('heading')    ?: '';
$subheading = get_field('subheading') ?: '';
$cta_label  = get_field('cta_label')  ?: '';
$cta_link   = get_field('cta_link')   ?: '';
$image      = get_field('image');          // ACF image array

// Block utility classes (alignment, custom class, anchor)
$class  = 'hero-section';
$class .= !empty($block['className'])  ? ' ' . $block['className']  : '';
$class .= !empty($block['align'])      ? ' align' . $block['align'] : '';
$id     = !empty($block['anchor'])     ? ' id="' . esc_attr($block['anchor']) . '"' : '';
?>

<section class="<?php echo esc_attr($class); ?>"<?php echo $id; ?>>
    <div class="container">

        <?php if ($heading) : ?>
            <h1 class="hero-section__heading"><?php echo wp_kses_post($heading); ?></h1>
        <?php endif; ?>

        <?php if ($subheading) : ?>
            <p class="hero-section__subheading"><?php echo esc_html($subheading); ?></p>
        <?php endif; ?>

        <?php if ($cta_label && $cta_link) : ?>
            <a class="hero-section__cta btn" href="<?php echo esc_url($cta_link); ?>">
                <?php echo esc_html($cta_label); ?>
            </a>
        <?php endif; ?>

        <?php if (!empty($image['url'])) : ?>
            <img
                class="hero-section__image"
                src="<?php echo esc_url($image['url']); ?>"
                alt="<?php echo esc_attr($image['alt'] ?: $image['title']); ?>"
                width="<?php echo esc_attr($image['width']); ?>"
                height="<?php echo esc_attr($image['height']); ?>"
                loading="lazy"
            >
        <?php endif; ?>

    </div>
</section>
```

**Conventions:**
- Use `get_field()` not `the_field()` — always capture into a variable first so you can guard against empty values.
- Escape output: `esc_html()` for plain text, `esc_url()` for URLs, `esc_attr()` for attributes, `wp_kses_post()` only when the field is a WYSIWYG that may contain allowed HTML.
- The root element class equals the block slug in kebab-case (`hero-section`). Child elements follow BEM: `hero-section__heading`, `hero-section__cta`.
- Always forward `$block['className']`, `$block['align']`, and `$block['anchor']` — editors rely on these.

---

## 3. Standard Field Patterns

Four field-group recipes that cover the most common section layouts.
Each pattern shows: ACF local JSON → PHP template excerpt → SCSS skeleton.

---

### Pattern A — Text Block

A heading, body copy (WYSIWYG), and optional CTA. Simplest possible section.

**ACF local JSON** (`acf-json/group_text_block.json`):
```json
{
  "key": "group_text_block",
  "title": "Text Block",
  "fields": [
    {
      "key": "field_tb_heading",
      "label": "Heading",
      "name": "heading",
      "type": "text"
    },
    {
      "key": "field_tb_body",
      "label": "Body",
      "name": "body",
      "type": "wysiwyg",
      "tabs": "all",
      "toolbar": "basic",
      "media_upload": 0
    },
    {
      "key": "field_tb_cta_label",
      "label": "CTA Label",
      "name": "cta_label",
      "type": "text"
    },
    {
      "key": "field_tb_cta_link",
      "label": "CTA Link",
      "name": "cta_link",
      "type": "url"
    }
  ],
  "location": [
    [{ "param": "block", "operator": "==", "value": "acf/text-block" }]
  ]
}
```

**PHP excerpt:**
```php
$heading   = get_field('heading')   ?: '';
$body      = get_field('body')      ?: '';
$cta_label = get_field('cta_label') ?: '';
$cta_link  = get_field('cta_link')  ?: '';
```
```html
<section class="text-block">
    <div class="container">
        <?php if ($heading) : ?>
            <h2 class="text-block__heading"><?php echo esc_html($heading); ?></h2>
        <?php endif; ?>
        <?php if ($body) : ?>
            <div class="text-block__body"><?php echo wp_kses_post($body); ?></div>
        <?php endif; ?>
        <?php if ($cta_label && $cta_link) : ?>
            <a class="text-block__cta btn" href="<?php echo esc_url($cta_link); ?>">
                <?php echo esc_html($cta_label); ?>
            </a>
        <?php endif; ?>
    </div>
</section>
```

**SCSS skeleton** (`src/scss/sections/text_block.scss`):
```scss
.text-block {
  padding: var(--section-padding-y) 0;

  .container { max-width: var(--container-max-width); }

  &__heading {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-4);
  }

  &__body {
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    color: var(--color-text);
  }

  &__cta { margin-top: var(--space-6); }
}
```

---

### Pattern B — Repeater

A section with a list of items (e.g. benefits, team cards, testimonials).

**ACF local JSON** (`acf-json/group_card_list.json`):
```json
{
  "key": "group_card_list",
  "title": "Card List",
  "fields": [
    {
      "key": "field_cl_heading",
      "label": "Section Heading",
      "name": "heading",
      "type": "text"
    },
    {
      "key": "field_cl_items",
      "label": "Items",
      "name": "items",
      "type": "repeater",
      "min": 1,
      "layout": "block",
      "sub_fields": [
        {
          "key": "field_cl_item_icon",
          "label": "Icon",
          "name": "icon",
          "type": "image",
          "return_format": "array",
          "preview_size": "thumbnail"
        },
        {
          "key": "field_cl_item_title",
          "label": "Title",
          "name": "title",
          "type": "text"
        },
        {
          "key": "field_cl_item_text",
          "label": "Text",
          "name": "text",
          "type": "textarea",
          "rows": 3
        }
      ]
    }
  ],
  "location": [
    [{ "param": "block", "operator": "==", "value": "acf/card-list" }]
  ]
}
```

**PHP excerpt:**
```php
$heading = get_field('heading') ?: '';
$items   = get_field('items')   ?: [];
```
```html
<section class="card-list">
    <div class="container">
        <?php if ($heading) : ?>
            <h2 class="card-list__heading"><?php echo esc_html($heading); ?></h2>
        <?php endif; ?>
        <?php if ($items) : ?>
            <ul class="card-list__grid">
                <?php foreach ($items as $item) : ?>
                    <li class="card-list__item">
                        <?php if (!empty($item['icon']['url'])) : ?>
                            <img
                                class="card-list__icon"
                                src="<?php echo esc_url($item['icon']['url']); ?>"
                                alt="<?php echo esc_attr($item['icon']['alt']); ?>"
                                loading="lazy"
                            >
                        <?php endif; ?>
                        <h3 class="card-list__title">
                            <?php echo esc_html($item['title']); ?>
                        </h3>
                        <p class="card-list__text">
                            <?php echo esc_html($item['text']); ?>
                        </p>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
</section>
```

**SCSS skeleton:**
```scss
.card-list {
  padding: var(--section-padding-y) 0;

  &__heading {
    text-align: center;
    margin-bottom: var(--space-8);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--space-6);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__icon { width: 48px; height: 48px; object-fit: contain; }

  &__title { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }

  &__text  { color: var(--color-text-muted); }
}
```

---

### Pattern C — Media + Text

An image or video paired with a text column. Optional left/right layout toggle.

**ACF local JSON** (`acf-json/group_media_text.json`):
```json
{
  "key": "group_media_text",
  "title": "Media + Text",
  "fields": [
    {
      "key": "field_mt_image",
      "label": "Image",
      "name": "image",
      "type": "image",
      "return_format": "array",
      "preview_size": "medium"
    },
    {
      "key": "field_mt_heading",
      "label": "Heading",
      "name": "heading",
      "type": "text"
    },
    {
      "key": "field_mt_body",
      "label": "Body",
      "name": "body",
      "type": "wysiwyg",
      "toolbar": "basic",
      "media_upload": 0
    },
    {
      "key": "field_mt_layout",
      "label": "Image Position",
      "name": "image_position",
      "type": "select",
      "choices": { "left": "Left", "right": "Right" },
      "default_value": "left"
    }
  ],
  "location": [
    [{ "param": "block", "operator": "==", "value": "acf/media-text" }]
  ]
}
```

**PHP excerpt:**
```php
$image    = get_field('image');
$heading  = get_field('heading')        ?: '';
$body     = get_field('body')           ?: '';
$position = get_field('image_position') ?: 'left';

$modifier = $position === 'right' ? ' media-text--reverse' : '';
```
```html
<section class="media-text<?php echo esc_attr($modifier); ?>">
    <div class="container">
        <div class="media-text__inner">
            <?php if (!empty($image['url'])) : ?>
                <figure class="media-text__media">
                    <img
                        src="<?php echo esc_url($image['url']); ?>"
                        alt="<?php echo esc_attr($image['alt'] ?: $image['title']); ?>"
                        width="<?php echo esc_attr($image['width']); ?>"
                        height="<?php echo esc_attr($image['height']); ?>"
                        loading="lazy"
                    >
                </figure>
            <?php endif; ?>
            <div class="media-text__content">
                <?php if ($heading) : ?>
                    <h2 class="media-text__heading"><?php echo esc_html($heading); ?></h2>
                <?php endif; ?>
                <?php if ($body) : ?>
                    <div class="media-text__body"><?php echo wp_kses_post($body); ?></div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</section>
```

**SCSS skeleton:**
```scss
.media-text {
  padding: var(--section-padding-y) 0;

  &__inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-8);
    align-items: center;

    @media (max-width: 768px) { grid-template-columns: 1fr; }
  }

  &--reverse &__inner { direction: rtl; }
  &--reverse &__content { direction: ltr; }

  &__media img { width: 100%; height: auto; display: block; }

  &__heading { font-size: var(--font-size-h2); margin-bottom: var(--space-4); }

  &__body { color: var(--color-text); line-height: var(--line-height-base); }
}
```

---

### Pattern D — Settings / Toggle Flags

Global or section-level boolean/choice fields, often used with ACF Options page or to gate features inside a block.

**ACF local JSON** (`acf-json/group_section_settings.json`):
```json
{
  "key": "group_section_settings",
  "title": "Section Settings",
  "fields": [
    {
      "key": "field_ss_bg_color",
      "label": "Background Color",
      "name": "bg_color",
      "type": "select",
      "choices": {
        "white": "White",
        "light": "Light Grey",
        "dark":  "Dark"
      },
      "default_value": "white",
      "allow_null": 0
    },
    {
      "key": "field_ss_full_width",
      "label": "Full Width",
      "name": "full_width",
      "type": "true_false",
      "default_value": 0,
      "ui": 1
    },
    {
      "key": "field_ss_padding",
      "label": "Vertical Padding",
      "name": "padding",
      "type": "select",
      "choices": {
        "normal": "Normal",
        "large":  "Large",
        "none":   "None"
      },
      "default_value": "normal"
    }
  ],
  "location": [
    [{ "param": "block", "operator": "==", "value": "acf/any-section" }]
  ]
}
```

**PHP excerpt** (typically merged into the root template rather than a standalone block):
```php
$bg_color   = get_field('bg_color')   ?: 'white';
$full_width = get_field('full_width') ? true : false;
$padding    = get_field('padding')    ?: 'normal';

$classes  = 'my-section';
$classes .= ' my-section--bg-' . sanitize_html_class($bg_color);
$classes .= ' my-section--padding-' . sanitize_html_class($padding);
if ($full_width) $classes .= ' my-section--full-width';
```

**SCSS skeleton:**
```scss
.my-section {
  padding: var(--section-padding-y) 0;

  &--bg-white { background: var(--color-white); }
  &--bg-light { background: var(--color-background); }
  &--bg-dark  { background: var(--color-black); color: var(--color-white); }

  &--padding-large { padding: calc(var(--section-padding-y) * 2) 0; }
  &--padding-none  { padding: 0; }

  &--full-width .container { max-width: 100%; padding: 0; }
}
```

---

## 4. Enqueue Behaviour

`smplfy_enqueue_detected_block_assets()` in `inc/acf_blocks.php` fires on `wp_enqueue_scripts` at priority 6 (before the default priority 10 in `inc/enqueue.php`).

**What it does, step by step:**

1. **Bail early** if on an admin page or a non-singular URL (archives, home, search) — block CSS is only needed on singular pages where blocks are rendered.

2. **Build the asset map.** Iterates `apply_filters('smplfy_registered_acf_blocks', [])` to get the current block list. For each slug it records:
   - `build/css/sections/{slug}.min.css` — the compiled section stylesheet
   - `build/js/sections/{slug}.min.js`  — the section script (optional, only loaded if file exists)
   - WP enqueue handles: `block-acf-{slug-with-dashes}-css` / `-js`

3. **Parse the page's block tree.** Calls `parse_blocks($post->post_content)` and walks the entire tree (including `innerBlocks`) to build a `$used` map keyed by WP block name (`acf/hero-section`, etc.).

4. **Enqueue only what's used.** Loops the asset map; for each slug whose `acf/{slug}` appears in `$used`, enqueues its CSS (and JS if the file exists on disk).

5. **Fallback.** If no registered blocks were detected on this page (e.g., the page uses only core blocks), enqueues the CSS for every registered section as a safety net so editors don't encounter unstyled previews.

**To add a new block's assets:** just add the slug to the `$blocks` array in `smplfy_register_acf_blocks()`. No other change to the enqueue system is needed.

**To disable Swiper globally:** add this to a plugin or `functions.php`:
```php
add_filter('smplfy_load_swiper', '__return_false');
```

---

## 5. Manual Block Creation Checklist

Use this when creating a block by hand (e.g., without the section generator).

```
[ ] 1. Pick a snake_case slug, e.g. pricing_table

[ ] 2. Register in inc/acf_blocks.php
        Add 'pricing_table' to the $blocks array in smplfy_register_acf_blocks()

[ ] 3. Create the PHP template
        template-parts/sections/pricing_table.php
        - get_field() all ACF values at the top
        - Guard every output against empty values
        - Forward $block['className'], $block['align'], $block['anchor']
        - Escape all output (esc_html / esc_url / esc_attr / wp_kses_post)

[ ] 4. Create the SCSS file
        src/scss/sections/pricing_table.scss
        - Root class = block slug in kebab-case (.pricing-table)
        - Use CSS custom properties from _tokens.scss (var(--color-primary) etc.)
        - Use BEM for child elements (.pricing-table__card, .pricing-table__price)
        - Responsive breakpoints via $medium / $large from _variables.scss

[ ] 5. Create the ACF field group
        Either via the WP admin (ACF > Field Groups) or by writing a JSON file
        in acf-json/. Set the location rule to: Block == acf/pricing-table

[ ] 6. (Optional) Create the JS file
        src/js/sections/pricing_table.js
        - Only needed if the section requires client-side behaviour
        - The enqueue system loads it automatically if the file is present in
          build/js/sections/ after Gulp compiles it

[ ] 7. Run the build
        npm run dev   (watch mode)
        npm run build (production)

[ ] 8. Verify in the editor
        - Block appears in the SMLFY Blocks category
        - Title shows as "Pricing Table" (not "Pricing_table")
        - Fields display correctly in Edit mode
        - Preview renders correctly

[ ] 9. Verify on the frontend
        - CSS and JS load only on pages that contain the block
        - No FOUC (if CSS is missing, check build/css/sections/ exists)
        - No console errors
```
