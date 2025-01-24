
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
        admin: 'src/scss/admin-style.scss', // Новый путь
        dest: 'build/css',
        destSections: 'build/css/sections',
        destAdmin: 'build/css' // Выходной путь для admin-style
    },
    php: {
        src: 'src/**/*.php'
    }
};

async function clean() {
    await del([paths.build]);
}

// Обработка JavaScript (основные файлы)
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


// Компиляция SCSS (основные стили)

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
        .pipe(browserSync.stream());
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


// Запуск локального сервера
function browsersyncServe(done) {
    browserSync.init({
        proxy: "http://localhost/wordpress/",
        notify: false,
        open: false
    });
    done();
}

// Перезагрузка браузера при изменении PHP файлов
function browsersyncReload(done) {
    browserSync.reload();
    done();
}

// Наблюдение за изменениями файлов
function startwatch() {
    watch(paths.scripts.main, scriptsMain);
    watch(paths.scripts.sections, scriptsSections);
    watch(paths.styles.main, stylesMain);
    watch(paths.styles.sections, stylesSections);
    watch(paths.styles.admin, stylesAdmin);
    watch(paths.php.src, browsersyncReload);
}

// Комплексные задачи
const scripts = parallel(scriptsMain, scriptsSections);
const styles = parallel(stylesMain, stylesSections, stylesAdmin);
const dev = series(clean, parallel(styles, scripts), browsersyncServe, startwatch);
const build = series(clean, parallel(styles, scripts));

// Экспортируем задачи
exports.clean = clean;
exports.scripts = scripts;
exports.styles = styles;
exports.stylesAdmin = stylesAdmin;
exports.browsersync = browsersyncServe;
exports.watch = startwatch;
exports.dev = dev;
exports.build = build;
exports.default = dev;