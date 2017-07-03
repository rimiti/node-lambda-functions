import gulp from 'gulp'
import babel from 'gulp-babel'
import sourcemaps from 'gulp-sourcemaps'
import path from 'path'
import del from 'del'
import {spawn} from 'child_process'
import mocha from 'gulp-mocha'
import gutil from 'gulp-util'

let node

const paths = {
    js: {
        src: ['src/**/*.js', '!src/**/node_modules/**/*'],
        dist: 'dist/'
    },
    test: {
        src: 'test/**/*.js',
        dist: 'test-dist/',
        run: 'test-dist/**/*.js'
    },
    config: {
        src: 'src/config/**/*',
        dist: 'dist/config'
    },
    locales: {
        src: 'src/locales/**.json',
        dist: 'dist/locales'
    },
    sourceRoot: path.resolve('src')
}

/**
 * @description Clean test compiled files & sourcemaps
 */
gulp.task('babel:test', ['babel:src', 'clean:test'], () =>
    gulp.src(paths.test.src)
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.', {sourceRoot: paths.sourceRoot}))
        .pipe(gulp.dest(paths.test.dist))
)

/**
 * @description Compile es6 files to es5 and put them in dist directory
 */
gulp.task('babel:src', ['clean:dist', 'babel:config'], () =>
    gulp.src(paths.js.src)
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.', {sourceRoot: paths.sourceRoot}))
        .pipe(gulp.dest(paths.js.dist))
)

/**
 * @description
 */
gulp.task('babel:config', ['config', 'copy:yml', 'clean:config'], () =>
    gulp.src(paths.config.src + '.js')
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.', {sourceRoot: paths.sourceRoot}))
        .pipe(gulp.dest(paths.config.dist)))

/**
 * @description Compile all es6 files to es5 and put them in dist directories
 */
gulp.task('babel', ['babel:src', 'babel:test'])

/**
 * @description Copy config directory to dist directory
 */
gulp.task('config', ['clean:config'], () => {
    return gulp.src(paths.config.src + '.json')
        .pipe(gulp.dest(paths.config.dist))
})

/**
 * @description Copy yml files
 */
gulp.task('copy:yml', ['clean:config'], () => {
    return gulp.src('src/**/*.yml')
        .pipe(gulp.dest(paths.js.dist))
})

/**
 * @description Cleans config directory in dist directory
 */
gulp.task('clean:config', () => del(paths.config.dist))

/**
 * @description Cleans compiled test files
 */
gulp.task('clean:test', () => del(paths.test.dist))

/**
 * @description Cleans dist directory
 */
gulp.task('clean:dist', [], () => del(['paths.js.dist', `!${paths.config.dist}`]))

/**
 * @description Cleans all compiled files
 */
gulp.task('clean', ['', 'clean:dist', 'clean:test'])

/**
 * @description Runs unit tests
 */
gulp.task('mocha', ['babel:test'], () => {
    return gulp.src([paths.test.run], {read: false})
        .pipe(mocha({reporter: 'spec'}))
        .on('error', gutil.log)
})

/**
 * @description Watches change in working files
 */
gulp.task('watch', () => {
    gulp.watch(paths.js.src, ['server'])
    gulp.watch(paths.test.src, ['mocha'])
    gulp.watch(paths.config.src, ['babel:config'])
})

/**
 * @description Watches test files
 */
gulp.task('watch:mocha', () => {
    gulp.watch(paths.test.src, ['mocha'])
})

/**
 * @description Launch the server. If there's a server already running, kill it.
 */
gulp.task('server', ['babel', 'mocha'], () => {
    if (node) node.kill()
    node = spawn('node', ['dist/server.js'], {stdio: 'inherit'})
    node.on('close', (code) => {
        if (code === 8) {
            gulp.log('Error detected, waiting for changes...')
        }
    })
})

/**
 * @description Start the development environment
 */
gulp.task('default', ['babel', 'watch', 'server'])

/**
 * @description On exit event, stop script
 */
process.on('exit', () => {
    if (node) node.kill()
})
