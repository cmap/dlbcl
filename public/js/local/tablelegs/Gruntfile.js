/*global module:false*/
module.exports = function (grunt) {
  grunt
  .initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - '
      + '<%= grunt.template.today("yyyy-mm-dd") %>\n'
      + '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>'
      + '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>; %> */'
    },
    uglify: {
      tablelegs: {
        options: {
          mangle: false,
          preserveComments: false
        },
        files: {
          'js/tablelegs-latest.min.js': ['js/tablelegs.js']
        }
      },
      slickgrid: {
        options: {
          mangle: false,
          preserveComments: false
        },
        files: {
          'js/slick-latest.min.js': ['js/slick-latest.js']
        }
      }
    },
    concat: {
      slickgrid: {
        nonull: true,
        dest: 'js/slick-latest.js',
        src: ['lib/slick.core.js', 'lib/slick.grid.js']
      },
      tablelegs: {
        nonull: true,
        dest: 'js/tablelegs.js',
        src: ['src/slick.rowselectionmodel.js', 'src/grid.js', 'src/table.js']
      }
    },
    watch: {
      files: ['src/*.js'],
      tasks: ['concat:tablelegs']
    }
  });

  grunt.registerTask('default', 'watch');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-jshint');
};
