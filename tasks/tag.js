import gulp from 'gulp'
import git from 'gulp-git'
import bump from 'gulp-bump'
import filter from 'gulp-filter'
import tagVersion from 'gulp-tag-version'
import fs from 'fs'

const inc = (importance) => {
  return gulp.src(['./package.json', './package-lock.json'])
    .pipe(bump({type: importance}))
    .pipe(gulp.dest('./')).on('finish', () => gulp.src(['./package.json', './package-lock.json']).pipe(git.commit(`Release v${JSON.parse(fs.readFileSync('./package.json', 'utf8')).version}`)))
    .pipe(filter('package.json'))
    .pipe(tagVersion())
}

gulp.task('tag:patch', () => inc('patch'))
gulp.task('tag:feature', () => inc('minor'))
gulp.task('tag:release', () => inc('major'))
