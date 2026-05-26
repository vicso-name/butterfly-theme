#!/usr/bin/env node
/**
 * One-shot theme setup script.
 *
 * Replaces all "smplfy" boilerplate identifiers with project-specific values
 * across every PHP, JS, JSON, SCSS, CSS, and Markdown file in the theme.
 * Deletes itself when done.
 *
 * Usage:
 *   npm run setup
 *   npm run setup -- --dry-run   (preview changes without writing anything)
 *
 * This script uses ES module syntax (.mjs) so it can use top-level await
 * without adding "type":"module" to package.json (which would break gulpfile.js,
 * which uses require() and is CommonJS).
 */

import { createInterface }                                   from 'readline/promises';
import { readFileSync, writeFileSync, readdirSync, statSync,
         unlinkSync, rmdirSync, existsSync }                 from 'fs';
import { join, extname, dirname, relative }                  from 'path';
import { fileURLToPath }                                     from 'url';
import { execSync }                                          from 'child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
const SELF  = fileURLToPath(import.meta.url);

const isDryRun = process.argv.includes('--dry-run');

// ─── Boilerplate source strings ───────────────────────────────────────────────
//
// Canonical values as they exist in the boilerplate right now.
// Source of truth: style.css (WordPress reads that as canonical).
//
// name/slug distinction: in this boilerplate the WordPress Theme Name IS the
// slug ('smplfy'). To avoid replacing text-domain occurrences with the
// human-readable name, we handle 'Theme Name: smplfy' explicitly first,
// then do a general slug sweep for everything else.

const SRC = {
    slug:      'smplfy',                      // text domain, block category, THEME_NAME constant, catch-all
    author:    'Smplfy.Development',           // style.css Author
    authorUri: 'https://smplfy.eu/',           // style.css Author URI
    themeUri:  'https://smplfy.eu/',           // style.css Theme URI
    desc:      'Description',                  // style.css Description field
    localUrl:  'http://localhost/wordpress/',   // gulpfile.js BrowserSync proxy
    pkgName:   'butterfly-theme',              // package.json "name" field (separate from smplfy slug)
};

// PHP function/filter/action/hook prefix — smplfy_ → new_slug_
const SRC_PHP_PFX = 'smplfy_';

// Note: no SMPLFY_ constant prefix exists in this codebase.
// functions.php defines THEME_URI, THEME_DIR, THEME_NAME, S_VERSION — all generic
// names with no theme-specific prefix. The const-prefix replacement step from
// the original boilerplate script has been removed.

// ─── File walker ─────────────────────────────────────────────────────────────

const TEXT_EXTS = new Set(['.php', '.js', '.mjs', '.json', '.scss', '.css', '.md', '.txt', '.html']);

// docs/    — ACF field-group pattern reference; slug replacement would corrupt code examples
// scripts/ — this script's own directory; excluded so SELF is never in the walk list
const SKIP_DIRS = new Set(['node_modules', 'build', '.git', 'assets', 'docs', 'scripts']);

function walk(dir, list = []) {
    for (const entry of readdirSync(dir)) {
        if (SKIP_DIRS.has(entry)) continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            walk(full, list);
        } else if (TEXT_EXTS.has(extname(entry))) {
            list.push(full);
        }
    }
    return list;
}

// ─── Input helpers ────────────────────────────────────────────────────────────
//
// readline/promises works for TTY (interactive terminal).
// When stdin is piped (CI, testing), read all stdin up-front and consume lines.

let inputLines = null;
let rl = null;

if (!process.stdin.isTTY) {
    // Piped / file-redirected input: read everything at once
    const raw = readFileSync(0, 'utf8');   // fd 0 = stdin
    inputLines = raw.split(/\r?\n/).map(l => l.trim());
} else {
    rl = createInterface({ input: process.stdin, output: process.stdout });
}

async function ask(label, def = '') {
    if (inputLines !== null) {
        const line = (inputLines.shift() ?? '').trim();
        const val  = line || def;
        process.stdout.write(`  ${label}${def ? ` [${def}]` : ''}: ${val}\n`);
        return val;
    }
    const hint = def ? ` [${def}]` : '';
    const ans  = (await rl.question(`  ${label}${hint}: `)).trim();
    return ans || def;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const slugify = s =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// "my-project" → "my_project_"  (valid PHP/WP function prefix)
const toPhpPrefix = slug => slug.replace(/-/g, '_') + '_';

function run(cmd) {
    try {
        execSync(cmd, { cwd: ROOT, stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

if (isDryRun) {
    console.log('\n┌─────────────────────────────────────┐');
    console.log('│    Theme Setup — DRY RUN preview    │');
    console.log('│    No files will be written.        │');
    console.log('└─────────────────────────────────────┘\n');
} else {
    console.log('\n┌─────────────────────────────────────┐');
    console.log('│        Theme Setup — Boilerplate    │');
    console.log('└─────────────────────────────────────┘\n');
}

const name      = await ask('Theme name',         'My Project');
const slug      = await ask('Slug (text domain)', slugify(name));
const author    = await ask('Author',             SRC.author);
const authorUri = await ask('Author URI',         SRC.authorUri);
const themeUri  = await ask('Theme URI',          SRC.themeUri);
const desc      = await ask('Description',        'Modern ACF Pro + Gutenberg WordPress theme');
const localUrl  = await ask('Local dev URL',      `http://${slug}.test`);

if (rl) rl.close();

// Validate slug
if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error(`\nError: slug "${slug}" must be lowercase letters, numbers, and hyphens only.\n`);
    process.exit(1);
}

const DST_PHP_PFX = toPhpPrefix(slug);   // e.g. "my-project" → "my_project_"

// ─── Replace ─────────────────────────────────────────────────────────────────

if (isDryRun) {
    console.log('  Files that WOULD be changed:\n');
} else {
    console.log('\n  Replacing strings…\n');
}

let changed = 0;

for (const file of walk(ROOT)) {
    if (file === SELF) continue;   // safety net — walk skips 'scripts/' so SELF is never reached

    let content = readFileSync(file, 'utf8');
    const before = content;

    // Replacement order — specific patterns before the general slug sweep.

    // 1. Theme Name line: style.css gets the human-readable name, not the slug.
    //    Must run before the general 'smplfy' sweep so this line is handled correctly.
    content = content.replaceAll('Theme Name: smplfy',  `Theme Name: ${name}`);

    // 2. PHP function / filter / action / hook prefix
    content = content.replaceAll(SRC_PHP_PFX,           DST_PHP_PFX);

    // 3. Author identity and URLs (before slug sweep — author may contain slug substring)
    content = content.replaceAll(SRC.authorUri,         authorUri);
    content = content.replaceAll(SRC.author,            author);
    content = content.replaceAll(SRC.themeUri,          themeUri);
    content = content.replaceAll(SRC.desc,              desc);
    content = content.replaceAll(SRC.localUrl,          localUrl);

    // 4. package.json "name" field — butterfly-theme → slug (hyphen form)
    content = content.replaceAll(SRC.pkgName,           slug);

    // 5. General slug sweep: text domain, block category slug, THEME_NAME constant value,
    //    doc comments, and any remaining 'smplfy' occurrences.
    content = content.replaceAll(SRC.slug,              slug);

    if (content !== before) {
        if (isDryRun) {
            const beforeLines = before.split('\n');
            const afterLines  = content.split('\n');
            let preview = '';
            for (let i = 0; i < afterLines.length; i++) {
                if (afterLines[i] !== beforeLines[i]) {
                    preview = `      - ${beforeLines[i].trimEnd()}\n      + ${afterLines[i].trimEnd()}`;
                    break;
                }
            }
            console.log(`    ${relative(ROOT, file)}`);
            if (preview) console.log(preview);
            console.log();
        } else {
            writeFileSync(file, content, 'utf8');
            console.log(`    ✓  ${relative(ROOT, file)}`);
        }
        changed++;
    }
}

if (isDryRun) {
    console.log(`  ${changed} file(s) would be updated. Nothing written.\n`);
    process.exit(0);
}

console.log(`\n  ${changed} file(s) updated.`);

// ─── Post-replace validation ──────────────────────────────────────────────────

console.log('\n  Validating replacements…');

const CHECK_FILES = ['style.css', 'functions.php', 'inc/enqueue.php'];
const SRC_STRINGS = [SRC.slug, SRC.author, SRC_PHP_PFX, SRC.pkgName];
let warned = false;

for (const rel of CHECK_FILES) {
    const filepath = join(ROOT, rel);
    if (!existsSync(filepath)) continue;
    const content = readFileSync(filepath, 'utf8');
    for (const s of SRC_STRINGS) {
        if (content.includes(s)) {
            console.warn(`  ⚠ Found remaining "${s}" in: ${rel} — manual review needed`);
            warned = true;
        }
    }
}
if (!warned) console.log('  ✓ No boilerplate strings remain in spot-checked files.');

// ─── Git commit ───────────────────────────────────────────────────────────────

if (existsSync(join(ROOT, '.git'))) {
    console.log('\n  Committing…');
    run('git add -A');
    if (run(`git commit -m "chore: initialize project as ${name}"`)) {
        console.log('  Committed.');
    }
}

// ─── Self-destruct ────────────────────────────────────────────────────────────

unlinkSync(SELF);
try { rmdirSync(join(ROOT, 'scripts')); } catch { /* scripts/ not empty — directory kept */ }

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log(`
┌─────────────────────────────────────┐
│  ✓ Theme renamed to "${name}"
│    Slug: ${slug}
└─────────────────────────────────────┘

  Next steps:
    npm install
    npm run dev

  To push to GitHub:
    gh repo create ${slug} --private --source=. --remote=origin --push
    (install gh from https://cli.github.com if needed)
`);
