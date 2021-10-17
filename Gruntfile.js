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
                    'public/css/dist/clue.css': 'public/scss/clue.scss'
                }
            }
        },
        cachebreaker: {
            dev: {
                options: {
                    match: [
                        {
                            "404.js": "public/js/local/errors/404.js",
                            "api.js": "public/js/local/api/api.js",
                            "bundle.js": "public/js/local/command/bundle.js",
                            "cache_manager.js": "public/js/local/cache/cache_manager.js",
                            "cards.css": "public/css/local/cards/cards.css",
                            "cards.js": "public/js/local/cards/cards.js",
                            "class-card.css": "public/css/local/class-card.css",
                            "class-celllines.js": "public/js/local/cards/class-celllines.js",
                            "class-heatmap.js": "public/js/local/cards/class-heatmap.js",
                            "class-summary.js": "public/js/local/cards/class-summary.js",
                            "clue.all.min.css": "public/css/dist/clue.all.min.css",
                            "clue.all.min.js": "public/js/lib/clue.all.min.js",
                            "clue.build.chooser.js": "public/js/local/data/clue.build.chooser.js",
                            "clue.build.requester.js": "public/js/local/data/clue.build.requester.js",
                            "clue.css": "public/css/dist/clue.css",
                            "clue.data.js": "public/js/local/data/clue.data.js",
                            "clue.data.project.js": "public/js/local/data/clue.data.project.js",
                            "clue.filter.js": "public/js/local/utils/clue.filter.js",
                            "clue.history.js": "public/js/local/history/clue.history.js",
                            "cmap.query.js": "public/js/local/query/cmap.query.js",
                            "cmap_gene.js": "public/js/local/pdex/cmap_gene.js",
                            "color.js": "public/js/local/scarpa/color.js",
                            "common.js": "public/js/local/scarpa/common.js",
                            "configure.js": "public/js/local/connection/configure.js",
                            "connection.css": "public/css/local/connection/connection.css",
                            "connection.js": "public/js/local/connection/connection.js",
                            "connectopedia.js": "public/connectopedia/js/connectopedia.js",
                            "contactmodal.js": "public/js/local/utils/contactmodal.js",
                            "csHistogram.js": "public/js/local/connection/csHistogram.js",
                            "csHistogramRenderer.js": "public/js/local/connection/csHistogramRenderer.js",
                            "//d3.layout.chord.sort.js": "public/js/lib/d3.layout.chord.sort.js",
                            //"d3notification.js": "public/js/local/scarpa/d3notification.js",
                            "dataset.js": "public/js/local/connection/dataset.js",
                            "diff.conn.js": "public/js/local/icv/diff.conn.js",
                            "dose_timepoint.css": "public/css/local/dose_timepoint.css",
                            "dose_timepoint.js": "public/js/local/cards/dose_timepoint.js",
                            "favorites.js": "public/js/local/utils/favorites.js",
                            "filterChain.js": "public/js/local/connection/filterChain.js",
                            "filterEngine.js": "public/js/local/touchstone/filterEngine.js",
                            "fitvids.min.js": "public/connectopedia/js/fitvids.min.js",
                            "ghostdown.js": "public/connectopedia/js/ghostdown.js",
                            "header.js": "public/js/local/utils/header.js",
                            "helpful.js": "public/js/local/connection/helpful.js",
                            "highlight.pack.min.js": "public/connectopedia/js/highlight.pack.min.js",
                            "icv.main.js": "public/js/local/icv/icv.main.js",
                            "introspect.css": "public/css/local/introspect.css",
                            "introspect.js": "public/js/local/cards/introspect.js",
                            "jquery-ui.min.css": "public/css/lib/jquery-ui.min.css",
                            "jquery-ui.min.js": "public/js/lib/jquery-ui.min.js",
                            "jquery.glossarize.js": "public/js/lib/jquery.glossarize.js",
                            "local-cache.js": "public/js/local/cache/local-cache.js",
                            "login_signup_menu.js": "public/js/local/menu/login_signup_menu.js",
                            "math.js": "public/js/local/scarpa/math.js",
                            "morpheus-landing.js": "public/js/local/morpheus/morpheus-landing.js",
                            "morpheus.js": "public/js/lib/morpheus.js",
                            "nominate.js": "public/js/local/nominate/nominate.js",
                            "nominate_table.js": "public/js/local/nominate/nominate_table.js",
                            "pert_card.js": "public/js/local/repurposing/pert_card.js",
                            "project-viewer.css": "public/css/local/project-viewer.css",
                            "project-viewer.js": "public/js/local/project-viewer/project-viewer.js",
                            "proteomics.query.js": "public/js/local/query/proteomics.query.js",
                            "query.css": "public/css/local/query.css",
                            "query.helper.js": "public/js/local/query/query.helper.js",
                            "query_gene_info.js": "public/js/local/utils/query_gene_info.js",
                            "raneto.js": "public/connectopedia/js/raneto.js",
                            "repurposing_app.js": "public/js/local/repurposing/repurposing_app.js",
                            "selected_signatures_modal.css": "public/css/local/touchstone/selected_signatures_modal.css",
                            "tablelegs.js": "public/js/local/tablelegs/js/tablelegs.js",
                            "team.css": "public/css/local/team.css",
                            "toolsAndMainMenu.js": "public/js/local/menu/toolsAndMainMenu.js",
                            "tooltip.css": "public/js/lib/tooltip/tooltip.css",
                            "tooltip.js": "public/js/lib/tooltip/tooltip.js",
                            "tooltips-popovers.js": "public/js/local/tooltips/tooltips-popovers.js",
                            "touchstone.css": "public/css/local/touchstone/touchstone.css",
                            "touchstone.js": "public/js/local/touchstone/touchstone.js",
                            "tsDatasource.js": "public/js/local/scarpa/tsDatasource.js",
                            "tsTable.css": "public/css/local/tsTable.css",
                            "tsTable.js": "public/js/local/scarpa/tsTable.js",
                            "verification-table.js": "public/js/local/admin/verification-table.js",
                            "vote.js": "public/connectopedia/js/vote.js"
                        }
                    ],
                    replacement: 'md5'
                },
                files: {
                    src: [
                        'public/connectopedia/default/templates/*.jade',
                        'views/includes/*.jade',
                        'views/cards/*.jade',
                        'views/*.jade',
                        'views/pdex/*.jade',
                        'views/templates/*.jade'
                    ]
                }
            }
        },
        uglify: {
            js: {
                options: {
                    mangle: false
                }
                ,
                files: {
                    'public/js/lib/clue.all.min.js': ['public/js/lib/clue.all.js', 'public/js/lib/papaparse.min.js'],
                    'public/js/lib/clue.min.js': ['public/js/lib/clue.js']
                }
            }
            ,

        }
        ,
        cssmin: {
            css: {
                src: 'public/css/dist/clue.all.css',
                dest:
                    'public/css/dist/clue.all.min.css'
            }
        }
        ,
        concat: {
            css: {
                src: [
                    'public/css/lib/animate.css',
                    'public/css/libss/jquery-ui.min.css',
                    'public/css/lib/font-awesome.min.css',
                    'public/css/lib/hopscotch.min.css',
                    'public/css/lib/slick.grid.css',
                    'public/css/lib/bootstrap.min.css',
                    'public/css/lib/bootstrap-select.min.css',
                    'public/css/dist/clue.css'
                ],
                dest:
                    'public/css/dist/clue.all.css'
            }
            ,
            js: {
                nonull: true,
                dest:
                    'public/js/lib/clue.all.js',
                src:
                    [
                        //'public/js/lib/d3.min.js',
                        'public/js/lib/jquery-2.2.4.min.js',
                        'public/js/lib/jquery-ui.min.js',
                        'public/js/lib/bootstrap.min.js',
                        'public/js/lib/underscore-min.js',
                        'public/js/lib/newick.js',
                        'public/js/lib/hammer.min.js',
                        'public/js/lib/jquery.mousewheel.min.js',
                        'public/js/lib/bootstrap-select.min.js',
                        'public/js/lib/xlsx.full.min.js',
                        'public/js/lib/canvas2svg.js',
                        'public/js/lib/canvg.js',
                        'public/js/lib/rgbcolor.js',
                        'public/js/lib/parser.js',
                        'public/js/lib/FileSaver.min.js',
                        'public/js/lib/Blob.js',
                        'public/js/lib/canvas-toBlob.js',
                        'public/js/lib/colorbrewer.js',
                        'public/js/lib/jquery.event.drag-2.2.js',
                        'public/js/lib/clipboard.min.js',
                        'public/js/lib/morpheus.js',
                        'public/js/local/tablelegs/js/slick-latest.min.js',
                        'public/js/local/tablelegs/js/tablelegs.js',
                        'public/js/lib/js.cookie.js',
                        'public/js/lib/clue.js',
                        'public/js/lib/typeahead.min.js',
                        'public/js/lib/async/async.min.js'
                    ]
            }
        }
        ,
        copy: {
            morpheus: {
                src: '../../../morpheus.js/js/morpheus.js',
                dest:
                    'public/js/lib/morpheus.js'
            }
        }
        ,
        watch: { // watch task for general work
            sass: {
                files: ['public/scss/*.scss', 'public/scss/**/*.scss'],
                tasks:
                    ['sass']
            }
            ,
            concat: {
                files: ['public/css/*.css', 'public/css/*.css', 'public/js/local/tablelegs/*.css', 'public/js/lib/*.js', 'public/js/local/tablegs/*/*.js'],
                tasks:
                    ['concat']
            }
            ,
            uglify: {
                files: ['public/js/lib/clue.all.js'],
                tasks:
                    ['uglify']
            }
            ,
            cssmin: {
                files: ['css/clue.all.min.css'],
                tasks:
                    ['cssmin']
            }
            ,
            morpheus: {
                files: ['public/morpheus.js/js/morpheus.js'],
                tasks:
                    ['copy:morpheus']
            }
        }, // Mocha
        mocha: {
            all: {
                src: ['test/unit/testrunner.html'],
            },
            options: {
                run: true
            }
        }
    });
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify-es');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-cache-breaker');
    // Default task.
    grunt.task.registerTask('default', 'watch');
    grunt.task.registerTask('tests', ['mocha']);
    grunt.task.registerTask('dist', ['sass', 'dist-no-sass']);
    grunt.task.registerTask('dist-no-sass', ['concat', 'uglify', 'cssmin']);
    grunt.task.registerTask('dist-cache', ['dist-no-sass', 'cachebreaker']);

};
