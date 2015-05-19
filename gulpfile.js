var gulp = require('gulp'),
    shell = require('gulp-shell');

gulp.task('make_html', shell.task('make html'));

gulp.task('watch', function(){
    gulp.watch('source/**/*.rst', ['make_html']);
});
