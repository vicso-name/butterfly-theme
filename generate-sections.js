/**
 * ======================================================
 *  📦 Section Generator for Gutenberg Blocks (Barvy Theme)
 * ======================================================
 *
 * ✅ What it does:
 * - Creates PHP files for blocks in `template-parts/sections/`
 * - Creates JS files in `src/js/sections/`
 * - Creates SCSS files in `src/scss/sections/` (without underscore)
 *
 * 🛠 How to use:
 * 1. Install Node.js (if not already installed)
 * 2. Save this file in the project root (next to package.json)
 * 3. Edit the block list in the `blocks` array
 * 4. Run in terminal:
 * 
 *     node generate-sections.js
 *
 * 🔁 The script safely creates only files that do not already exist
 */

const fs = require('fs');
const path = require('path');

// ✅ Block Names
const blocks = [
    // ✅ Add your custom block names below:
    // 'about_us_section',
    // 'contact_form_block',
    // 'testimonials_slider',
    "hero_section",
];

// ✅ Пути
const basePaths = {
  php: "template-parts/sections",
  js: "src/js/sections",
  scss: "src/scss/sections"
};

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createFile(filePath, content = "") {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created: ${filePath}`);
  } else {
    console.log(`⚠️ Already exists: ${filePath}`);
  }
}

blocks.forEach(block => {
  // PHP
  ensureDirExists(basePaths.php);
  createFile(
    path.join(basePaths.php, `${block}.php`),
    `<?php // Template part for ${block} ?>`
  );

  // JS
  ensureDirExists(basePaths.js);
  createFile(
    path.join(basePaths.js, `${block}.js`),
    `// JS for ${block}\nconsole.log('${block} loaded');`
  );

  // SCSS
  ensureDirExists(basePaths.scss);
  createFile(
    path.join(basePaths.scss, `${block}.scss`),
    `// Styles for ${block}`
  );
});