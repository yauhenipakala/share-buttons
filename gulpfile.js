import 'dotenv/config';
import { task, src, dest, series } from 'gulp';
import minifyJS from 'gulp-uglify';
import replace from 'gulp-replace';
import rename from 'gulp-rename';
import htmlmin from 'gulp-htmlmin';

const siteOutputPath = 'site';

// used to build library
task('build-js', function() {
    return src('src/*.js')
        .pipe(minifyJS())
        .pipe(dest('dist'));
});

// used to copy all static files to the deploy folder
task('demo-copy-static', () => {
    return src('demo/**', {base: 'demo/', encoding: false })
        .pipe(dest(siteOutputPath));
});

// used to copy lib js file to the deploy folder
task('demo-copy-js', () => {
    return src('dist/*.js', {base: 'dist/', encoding: false })
        .pipe(rename({
            suffix: '.min',
        }))
        .pipe(dest(siteOutputPath + '/js/'));
});

// used to minify html files and modify links for the deploy folder
task('demo-html', () => {
    return src('demo/**/*.html')
        .pipe(replace('../dist/share-buttons.js', 'js/share-buttons.min.js'))
        .pipe(replace('<!-- ANALYTICS HERE -->', process.env.ANALYTICS || ''))
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true,
        }))
        .pipe(dest(siteOutputPath))
});

task('build-demo', series(
    'demo-copy-static',
    'demo-copy-js',
    'demo-html',
));

task('build', series('build-js', 'build-demo'));