// Импортируем необходимые модули
const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const terser = require('gulp-terser'); // Заменили gulp-uglify-es на gulp-terser
const sass = require('gulp-sass')(require('sass')); // Используем Dart Sass
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const plumber = require('gulp-plumber');
const gulpIf = require('gulp-if');
const del = require('del'); // Для очистки директорий
const notify = require('gulp-notify'); // Для уведомлений об ошибках

// Определяем, является ли среда продакшеном
const isProduction = process.env.NODE_ENV === 'production';

// Пути к файлам
const paths = {
    scripts: {
        src: [
            'node_modules/swiper/swiper-bundle.min.js',
            'node_modules/glightbox/dist/js/glightbox.js',
            'js/app.js' // Путь к вашим JS файлам
        ],
        dest: 'js'
    },
    styles: {
        src: [
            'node_modules/bootstrap/dist/css/bootstrap-grid.min.css', // Bootstrap grid CSS
            'node_modules/swiper/swiper-bundle.min.css', // Swiper CSS
            'css/sass/main.sass' // Ваш основной Sass файл (замените на .scss, если используете SCSS)
        ],
        dest: 'css'
    },
    php: {
        src: '**/*.php'
    }
};

// Задача очистки скомпилированных файлов
function clean() {
    return del(['js/app.min.js', 'css/app.min.css']);
}

// Задача для обработки скриптов
function scripts() {
    return src(paths.scripts.src, { sourcemaps: !isProduction })
        .pipe(plumber({
            errorHandler: notify.onError({
                title: "Gulp Scripts Error",
                message: "<%= error.message %>"
            })
        }))
        .pipe(concat('app.min.js'))
        .pipe(gulpIf(isProduction, terser()))
        .pipe(dest(paths.scripts.dest, { sourcemaps: '.' }))
        .pipe(browserSync.stream());
}

// Задача для обработки стилей
function styles() {
    return src(paths.styles.src, { sourcemaps: !isProduction })
        .pipe(plumber({
            errorHandler: notify.onError({
                title: "Gulp Styles Error",
                message: "<%= error.message %>"
            })
        }))
        .pipe(sass({
            outputStyle: 'expanded' // Можно изменить на 'compressed' для продакшен
        }))
        .pipe(concat('app.min.css'))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions'],
            grid: true
        }))
        .pipe(gulpIf(isProduction, cleanCSS({
            level: {
                1: {
                    specialComments: 0
                }
            }
        })))
        .pipe(dest(paths.styles.dest, { sourcemaps: '.' }))
        .pipe(browserSync.stream());
}

// Задача для запуска Browsersync
function browsersyncServe(cb) {
    browserSync.init({
        proxy: {
            target: "http://localhost/wordpress/", // Ваш локальный сервер
            ws: true
        },
        notify: false,
        online: true,
        open: false // Отключаем автоматическое открытие браузера
    });
    cb();
}

// Задача для перезагрузки Browsersync
function browsersyncReload(cb) {
    browserSync.reload();
    cb();
}

// Задача наблюдения за файлами
function startwatch() {
    watch(['js/**/*.js', '!js/**/*.min.js'], scripts);
    watch(['css/sass/**/*.{sass,scss}'], styles);
    watch(paths.php.src, browsersyncReload);
}

// Задача по умолчанию для разработки
const dev = series(
    clean,
    parallel(styles, scripts),
    browsersyncServe,
    startwatch
);

// Задача для продакшена
const build = series(
    clean,
    parallel(styles, scripts)
);

// Экспортируем задачи
exports.clean = clean;
exports.scripts = scripts;
exports.styles = styles;
exports.browsersync = browsersyncServe;
exports.watch = startwatch;
exports.dev = dev;
exports.build = build;
exports.default = dev;
