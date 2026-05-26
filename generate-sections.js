#!/usr/bin/env node
/**
 * Section Generator — smplfy theme
 *
 * Usage:
 *   node generate-sections.js <section_name> [--js] [--dry-run]
 *
 * Arguments:
 *   <section_name>   snake_case name, e.g. team, pricing, faq_list
 *   --js             also create src/js/sections/<section_name>.js
 *   --dry-run        print what would be created without writing anything
 *
 * Creates / modifies:
 *   src/scss/sections/<section_name>.scss
 *   template-parts/sections/<section_name>.php
 *   src/js/sections/<section_name>.js        (only with --js)
 *   inc/acf_blocks.php                       ← appends to $blocks array
 *
 * NOTE on enqueue.php:
 *   inc/enqueue.php does NOT need modification. Per-section CSS/JS is enqueued
 *   automatically by smplfy_enqueue_detected_block_assets() in inc/acf_blocks.php,
 *   which builds its map dynamically from the $blocks array at runtime.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Parse arguments
// ---------------------------------------------------------------------------

const args       = process.argv.slice(2);
const sectionName = args.find(a => !a.startsWith('--'));
const withJS     = args.includes('--js');
const dryRun     = args.includes('--dry-run');

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

if (!sectionName) {
    console.error('Error: section name is required.\n');
    console.error('  Usage: node generate-sections.js <section_name> [--js] [--dry-run]');
    console.error('  Example: node generate-sections.js pricing_section --js');
    process.exit(1);
}

if (!/^[a-z][a-z0-9_]*$/.test(sectionName)) {
    console.error(`Error: "<${sectionName}>" is not a valid section name.`);
    console.error('  Names must match /^[a-z][a-z0-9_]*$/ — lowercase, start with a letter, only letters/digits/underscores.');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT        = __dirname;
const ACF_FILE    = path.join(ROOT, 'inc', 'acf_blocks.php');
const ENQUEUE_FILE = path.join(ROOT, 'inc', 'enqueue.php');

const targets = {
    scss: path.join(ROOT, 'src', 'scss', 'sections', `${sectionName}.scss`),
    php:  path.join(ROOT, 'template-parts', 'sections', `${sectionName}.php`),
    ...(withJS ? { js: path.join(ROOT, 'src', 'js', 'sections', `${sectionName}.js`) } : {}),
};

// ---------------------------------------------------------------------------
// Pre-flight checks
// ---------------------------------------------------------------------------

const conflicts = Object.values(targets).filter(p => fs.existsSync(p));
if (conflicts.length) {
    console.error('Error: the following files already exist — aborting to avoid overwriting:');
    conflicts.forEach(p => console.error(`  ${path.relative(ROOT, p)}`));
    process.exit(1);
}

if (!fs.existsSync(ACF_FILE)) {
    console.error(`Error: inc/acf_blocks.php not found at ${ACF_FILE}`);
    process.exit(1);
}

const acfContent = fs.readFileSync(ACF_FILE, 'utf8');

// Derive the PHP function prefix from what's actually in acf_blocks.php so this
// string stays correct after npm run setup renames smplfy_ to {slug}_
const prefixMatch = acfContent.match(/function\s+([a-z][a-z0-9_]*)_enqueue_detected_block_assets/);
const phpPrefix   = prefixMatch ? prefixMatch[1] + '_' : 'smplfy_';

// Check if already registered (active or commented out)
if (new RegExp(`['"]${sectionName}['"]`).test(acfContent)) {
    console.error(`Error: "${sectionName}" already appears in inc/acf_blocks.php — aborting.`);
    process.exit(1);
}

// Locate the $blocks = [ ... ]; array
const blocksStart = acfContent.indexOf('$blocks = [');
if (blocksStart === -1) {
    console.error('Error: could not find "$blocks = [" in inc/acf_blocks.php.');
    console.error('  The file structure may have changed. Edit it manually.');
    process.exit(1);
}

// Find the closing ]; after the array open — handle both "    ];" and tabs
const closingPattern = /\n([ \t]*)\];/g;
closingPattern.lastIndex = blocksStart;
const closingMatch = closingPattern.exec(acfContent);
if (!closingMatch) {
    console.error('Error: could not find closing ]; for $blocks array in inc/acf_blocks.php.');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Generate file contents
// ---------------------------------------------------------------------------

// Human-readable title: underscores → spaces, Title Case
const title = sectionName
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// CSS class uses the section name as-is (underscores are valid in CSS but unusual;
// kept consistent with the PHP template class attribute)
const cssClass = sectionName;

const scssContent =
`// =============================================================
// ${title}
// =============================================================

.${cssClass} {

    &__container {

    }

    &__content {

    }
}
`;

const phpContent =
`<?php
/**
 * Section: ${sectionName}
 */
?>
<section class="${cssClass}">
    <div class="${cssClass}__container container">
        <div class="${cssClass}__content">

        </div>
    </div>
</section>
`;

const jsContent =
`document.addEventListener('DOMContentLoaded', () => {
    const section = document.querySelector('.${cssClass}');
    if (!section) return;

    // init ${title}
});
`;

// Build the modified acf_blocks.php content
const insertionPoint = closingMatch.index; // position of the \n before the indent + ];
const indentMatch    = acfContent.slice(blocksStart).match(/\n([ \t]+)['"]hero/);
const entryIndent    = indentMatch ? indentMatch[1] : '        '; // fall back to 8 spaces
const newEntry       = `\n${entryIndent}'${sectionName}',`;
const newAcfContent  =
    acfContent.slice(0, insertionPoint) +
    newEntry +
    acfContent.slice(insertionPoint);

// ---------------------------------------------------------------------------
// Dry-run output
// ---------------------------------------------------------------------------

if (dryRun) {
    console.log('\n[DRY RUN] The following changes would be made:\n');

    console.log(`--- src/scss/sections/${sectionName}.scss (new file) ---`);
    console.log(scssContent);

    console.log(`--- template-parts/sections/${sectionName}.php (new file) ---`);
    console.log(phpContent);

    if (withJS) {
        console.log(`--- src/js/sections/${sectionName}.js (new file) ---`);
        console.log(jsContent);
    }

    console.log('--- inc/acf_blocks.php (modified — new $blocks entry) ---');
    // Show just the relevant context around the insertion
    const insertLine = newAcfContent.slice(0, insertionPoint + newEntry.length).split('\n').length;
    const lines = newAcfContent.split('\n');
    const start = Math.max(0, insertLine - 4);
    const end   = Math.min(lines.length, insertLine + 3);
    lines.slice(start, end).forEach((l, i) => {
        const lineNum = start + i + 1;
        const marker  = (lineNum === insertLine) ? '> ' : '  ';
        console.log(`${marker}${lineNum}: ${l}`);
    });

    console.log('\n[DRY RUN] No files were written.');
    process.exit(0);
}

// ---------------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------------

function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function write(filePath, content) {
    ensureDir(filePath);
    fs.writeFileSync(filePath, content, 'utf8');
}

write(targets.scss, scssContent);
write(targets.php, phpContent);
if (withJS) {
    write(targets.js, jsContent);
}
fs.writeFileSync(ACF_FILE, newAcfContent, 'utf8');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const rel = p => path.relative(ROOT, p).replace(/\\/g, '/');

console.log('');
console.log(`  ✓ ${rel(targets.scss)}`);
console.log(`  ✓ ${rel(targets.php)}`);
if (withJS) {
    console.log(`  ✓ ${rel(targets.js)}`);
} else {
    console.log(`  — src/js/sections/${sectionName}.js  (skipped — no --js flag)`);
}
console.log(`  ✓ inc/acf_blocks.php  — '${sectionName}' added to $blocks array`);
console.log(`  ✓ inc/enqueue.php     — no change needed (enqueue is automatic)`);
console.log('');
console.log('  Next steps:');
console.log(`  1. Create the ACF field group for '${sectionName}' in the WordPress admin`);
console.log(`     (Location: Block → is equal to → ${title})`);
console.log(`  2. Export the field group to JSON if you use ACF local JSON`);
console.log(`  3. Add the section to a page template if needed`);
console.log('');
console.log('  Note: section CSS/JS is enqueued automatically — no edits to inc/enqueue.php');
console.log(`        are required. ${phpPrefix}enqueue_detected_block_assets() reads $blocks at runtime.`);
console.log('');
console.log('  ⚠  Known build quirk: src/js/**/*.js matches src/js/sections/, so any .js');
console.log('     created here will be compiled twice by Gulp (once to build/js/, once to');
console.log('     build/js/sections/). This is a pre-existing bug in gulpfile.js, not this');
console.log('     generator. See CLAUDE.md → Known Issues #4.');
console.log('');
