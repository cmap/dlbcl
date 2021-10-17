/*global module:false*/
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - '
            + '<%= grunt.template.today("yyyy-mm-dd") %>\n'
            + '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>'
            + '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>; %> */'
        },
        jshint: {
            all: ['Gruntfile.js']
        },
        /**
         * Sass
         */
        sass: {
            dist: {
                files: {
                    '../../css/dist/clue.css': '../../scss/clue.scss'
                }
            }
        },
        cachebreaker: {
            dev: {
                options: {
                    match: [
                        'js/clue.all.min.js',
                        'js/d3.layout.chord.sort.js',
                        'js/scarpa/d3notification.js',
                        'js/scarpa/common.js',
                        'js/clue.homepage.min.js',
                        'js/jquery.glossarize.js',
                        'js/jquery-ui.min.js',
                        'css/dist/clue.all.min.css',
                        'css/dist/clue.css'
                    ],
                },
                files: {
                    src: [
                        '../../views/includes/clue_js.jade',
                        '../../views/includes/head.jade',
                        '../../views/cards/cards-includes.jade',
                        '../../public/connectopedia/default/templates/connectopedia_layout.jade',
                        '../../views/index.jade',
                        '../../views/includes/metadata-includes.jade',
                        '../../views/templates/page_layout_static.jade'
                    ]
                }
            }
        },
        uglify: {
            js: {
                options: {
                    mangle: false
                },
                files: {
                    'js/clue.all.min.js': ['js/clue.all.js', 'js/papaparse.min.js'],
                    'js/clue.min.js': ['js/clue.js']
                }
            },

        },
        cssmin: {
            css: {
                src: '../../css/dist/clue.all.css',
                dest: '../../css/dist/clue.all.min.css'
            }
        },
        concat: {
            css: {
                src: [
                    '../../css/lib/animate.css',
                    '../../css/libss/jquery-ui.min.css',
                    '../../css/lib/font-awesome.min.css',
                    '../../css/lib/hopscotch.min.css',
                    '../../css/lib/slick.grid.css',
                    '../../css/lib/bootstrap.min.css',
                    '../../css/lib/bootstrap-select.min.css',
                    '../../css/dist/clue.css'
                ],
                dest: '../../css/dist/clue.all.css'
            },
            js: {
                nonull: true,
                dest: 'js/clue.all.js',
                src: [
                    'js/d3.min.js',
                    'js/jquery-2.2.4.min.js',
                    'js/jquery-ui.min.js',
                    'js/bootstrap.min.js',
                    'js/underscore-min.js',
                    'js/newick.js',
                    'js/hammer.min.js',
                    'js/jquery.mousewheel.min.js',
                    'js/bootstrap-select.min.js',
                    'js/xlsx.full.min.js',
                    'js/canvas2svg.js',
                    'js/canvg.js',
                    'js/rgbcolor.js',
                    'js/parser.js',
                    'js/FileSaver.min.js',
                    'js/Blob.js',
                    'js/canvas-toBlob.js',
                    'js/colorbrewer.js',
                    'js/jquery.event.drag-2.2.js',
                    'js/clipboard.min.js',
                    'js/morpheus.js',
                    '../tablelegs/js/slick-latest.min.js',
                    '../tablelegs/js/tablelegs.js',
                    'js/js.cookie.js',
                    'js/clue.js',
                    'js/typeahead.min.js',
                    'js/async/async.min.js'
                ]
            }
        },
        copy: {
            morpheus: {
                src: '../../../morpheus.js/js/morpheus.js',
                dest: 'js/morpheus.js'
            }
        },
        watch: { // watch task for general work
            sass: {
                files: ['../scss/*.scss', '../scss/**/*.scss'],
                tasks: ['sass']
            },
            concat: {
                files: ['css/*.css', 'css/*.css', '../tablelegs/*.css', 'js/*.js', '../tablegs/*/*.js'],
                tasks: ['concat']
            },
            uglify: {
                files: ['js/clue.all.js'],
                tasks: ['uglify']
            },
            cssmin: {
                files: ['css/clue.all.min.css'],
                tasks: ['cssmin']
            },
            morpheus: {
                files: ['../../../morpheus.js/js/morpheus.js'],
                tasks: ['copy:morpheus']
            }
        }
    });
    // Default task.
    grunt.task.registerTask('default', 'watch');
    grunt.task.registerTask('dist', ['sass', 'concat', 'uglify', 'cssmin', 'cachebreaker']);
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-cache-breaker');
};
