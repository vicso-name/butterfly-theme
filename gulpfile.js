const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const terser = require('gulp-terser');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer').default;
const cleanCSS = require('gulp-clean-css');
const plumber = require('gulp-plumber');
const gulpIf = require('gulp-if');
const del = require('del');
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

const paths = {
  src: 'src',
  build: 'build',
  scripts: {
    main: 'src/js/general.js',
    sections: 'src/js/sections/**/*.js',
    dest: 'build/js',
    destSections: 'build/js/sections'
  },
  styles: {
    main: 'src/scss/style.scss',
    sections: 'src/scss/sections/**/*.scss',
    admin: 'src/scss/admin-style.scss',
    dest: 'build/css',
    destSections: 'build/css/sections',
    destAdmin: 'build/css'
  },
  php: {
    src: 'src/**/*.php'
  }
};

async function clean() {
  await del([paths.build]);
}

function copyFonts() {
  return src('fonts/**/*.{woff,woff2}')
    .pipe(dest('build/fonts'));
}

function generateFontsCSS(done) {
  const fontsDir = 'fonts';
  const outputDir = 'build/fonts';
  const outputFile = path.join(outputDir, 'fonts.css');
  let cssContent = '';

  // Проверяем, существует ли папка fonts, если нет - пропускаем
  if (!fs.existsSync(fontsDir)) {
    console.log('⚠ Папка fonts не найдена. Пропускаем генерацию fonts.css.');
    done();
    return;
  }

  // Проверяем, существует ли папка build/fonts, если нет - создаем
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Читаем папку fonts
  fs.readdirSync(fontsDir).forEach(folder => {
    const folderPath = path.join(fontsDir, folder);
    if (fs.lstatSync(folderPath).isDirectory()) {
      fs.readdirSync(folderPath).forEach(file => {
        if (file.endsWith('.woff') || file.endsWith('.woff2')) {
          const fontName = file.replace(/\.(woff2|woff)$/, '');
          const fontWeight = getFontWeight(file);

          cssContent += `
@font-face {
  font-family: '${folder}';
  src: url('../fonts/${folder}/${file}') format('${file.endsWith('.woff2') ? 'woff2' : 'woff'}');
  font-weight: ${fontWeight};
  font-style: normal;
}\n`;
        }
      });
    }
  });

  // Записываем стили в build/fonts/fonts.css
  fs.writeFileSync(outputFile, cssContent);
  done();
}


function getFontWeight(filename) {
  if (filename.toLowerCase().includes('bold')) return 700;
  if (filename.toLowerCase().includes('semibold')) return 600;
  if (filename.toLowerCase().includes('medium')) return 500;
  if (filename.toLowerCase().includes('light')) return 300;
  if (filename.toLowerCase().includes('extralight')) return 200;
  return 400;
}

function getFontWeight(filename) {
  if (filename.toLowerCase().includes('bold')) return 700;
  if (filename.toLowerCase().includes('semibold')) return 600;
  if (filename.toLowerCase().includes('medium')) return 500;
  if (filename.toLowerCase().includes('light')) return 300;
  if (filename.toLowerCase().includes('extralight')) return 200;
  return 400;
}

function scriptsMain() {
  return src(paths.scripts.main)
    .pipe(plumber({ errorHandler: notify.onError("Ошибка в Scripts Main: <%= error.message %>") }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulpIf(isProduction, terser()))
    .pipe(dest(paths.scripts.dest))
    .pipe(browserSync.stream());
}

function scriptsSections() {
  return src(paths.scripts.sections)
    .pipe(plumber({ errorHandler: notify.onError("Ошибка в Scripts Sections: <%= error.message %>") }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulpIf(isProduction, terser()))
    .pipe(dest(paths.scripts.destSections))
    .pipe(browserSync.stream());
}

function stylesAdmin() {
  return src(paths.styles.admin)
    .pipe(plumber({ errorHandler: notify.onError("Ошибка в Styles Admin: <%= error.message %>") }))
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
    .pipe(gulpIf(isProduction, cleanCSS({ level: { 1: { specialComments: 0 } } })))
    .pipe(dest(paths.styles.destAdmin))
    .pipe(browserSync.stream());
}

function stylesMain() {
  return src(paths.styles.main)
    .pipe(plumber({ errorHandler: notify.onError("Ошибка в Styles Main: <%= error.message %>") }))
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
    .pipe(gulpIf(isProduction, cleanCSS({ level: { 1: { specialComments: 0 } } })))
    .pipe(dest(paths.styles.dest))
    .pipe(browserSync.stream())
    .on('end', () => {
      fs.appendFileSync(`${paths.styles.dest}/style.min.css`, '\n@import "../fonts/fonts.css";\n');
    });
}

function stylesSections() {
  return src(paths.styles.sections)
    .pipe(plumber({ errorHandler: notify.onError("Ошибка в Styles Sections: <%= error.message %>") }))
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
    .pipe(gulpIf(isProduction, cleanCSS({ level: { 1: { specialComments: 0 } } })))
    .pipe(dest(paths.styles.destSections))
    .pipe(browserSync.stream());
}


function browsersyncServe(done) {
  browserSync.init({
    proxy: "http://localhost/wordpress/",
    notify: false,
    open: false
  });
  done();
}

function browsersyncReload(done) {
  browserSync.reload();
  done();
}

function startwatch() {
  watch('src/scss/**/*.scss', stylesMain);
  watch(paths.styles.sections, stylesSections);
  watch(paths.styles.admin, stylesAdmin);
  watch(paths.scripts.main, scriptsMain);
  watch(paths.scripts.sections, scriptsSections);
  watch(paths.php.src, browsersyncReload);
}

const scripts = parallel(scriptsMain, scriptsSections);
const styles = parallel(stylesMain, stylesSections, stylesAdmin);

const build = series(clean, parallel(styles, scripts, copyFonts, generateFontsCSS));
const dev = series(clean, parallel(styles, scripts), browsersyncServe, startwatch);

exports.clean = clean;
exports.scripts = scripts;
exports.styles = styles;
exports.stylesAdmin = stylesAdmin;
exports.browsersync = browsersyncServe;
exports.watch = startwatch;
exports.copyFonts = copyFonts;
exports.generateFontsCSS = generateFontsCSS;
exports.dev = dev;
exports.build = build;
exports.default = dev;