var zs = require('Shared/zs.js');

exports.show = function(options){
    setupHeader(options.object);

    var ids = options.ids;
    options.ids.forEach(function(str,idx) {
        options.ids[idx] = str.replace(/ccsbbroad/i, 'ccsbBroad');
    });
    var filter = {
        fields: {
            cell_id: true,
            description: true,
            pert_id: true,
            pert_iname: true,
            pert_type: true,
            sig_id: true,
            pert_icollection: true
            // cell_id: true,
            // distil_cc_q75: true,
            // pct_self_rank_q25: true,
            // pert_desc: true,
            // pert_id: true,
            // pert_idose: true,
            // pert_iname: true,
            // pert_itime: true,
            // pert_type: true,
            // sig_id: true
        },
        where: {
            pert_id: {inq: ids}
        }
    };
    return $.ajax(clue.API_URL + '/api/perts/?filter=' + JSON.stringify(filter)).done(function (results) {
        results = _.filter(results, function(obj){
            return obj.pert_icollection.indexOf('TS_v1.1') > -1; });
        var $accordionPicker = $('<button id="sigSelectButton" class="accordion">Select signatures</button>');
        $accordionPicker.appendTo(options.$el);
        var $pickerPanel = $('<div class="panel" id="sigSelectPanel">');
        var $left = $('<div class="col-md-4 col-lg-4 col-sm-12 col-xs-12 pad-top-12"></div>');
        var $center = $('<div class="col-md-8 col-lg-8 col-sm-12 col-xs-12 pull-right pad-top-12"></div>');
        // var $right = $('<div class="col-md-3 col-lg-3 col-sm-6 col-xs-12"></div>');
        $left.appendTo($pickerPanel);
        $center.appendTo($pickerPanel);
        $('</div>').appendTo($pickerPanel);
        $pickerPanel.appendTo(options.$el);

        var $accordionHeatMap = $('<button id="sigViewButton" class="accordion">Signature viewer</button>');
        $accordionHeatMap.appendTo(options.$el);
        var $viewerPanel = $('<div class="panel" id="sigViewPanel"><img style="width:205px;height:auto;" class="img-key pull-right" src="//assets.clue.io/clue/public/img/command/sig_legend.png">');
        $viewerPanel.appendTo(options.$el);
        var $heatmap = $('<div class="pad-left-16 pad-top-12 pad-bottom-15">No signatures chosen.</div>');
        $heatmap.appendTo($viewerPanel);
        $('</div>').appendTo($viewerPanel);
        $viewerPanel.appendTo(options.$el);
        var accordions = options.$el.find('.accordion');
        for (i = 0; i < accordions.length; i++) {
            // var panel = accordions[i].nextElementSibling;
            // panel.style.display = "block";
            options.$el.find('.accordion').eq(i)[0].onclick = function () {
                /* Toggle between adding and removing the "active" class,
                 to highlight the button that controls the panel */
                this.classList.toggle("active");
                /* Toggle between hiding and showing the active panel */
                var panel = this.nextElementSibling;
                if (panel.style.maxHeight){
                    panel.style.maxHeight = null;
                } else {
                    panel.style.maxHeight = (panel.scrollHeight) + "px";
                }
            }
        }
        options.$el.find()

        var pertIdToItem = new morpheus.Map();
        for (var i = 0, length = results.length; i < length; i++) {
            pertIdToItem.set(results[i].pert_id, results[i]);
        }
        var checkBoxColumn = tablelegs.Table.createCheckBoxColumn({field: 'pert_id'});
        // checkBoxColumn.renderer = function (item, value) {
        //   if (typeof item._collapsed === 'undefined') { // child
        //     return '<span padding-left:6px;><input data-tablelegs-toggle="true" type="checkbox" '
        //       + (set.has(value) ? ' checked' : '') + '/></span>';
        //   } else { // parent
        //     if (item._collapsed) {
        //       return '<span padding-left:6px;><input data-tablelegs-toggle="true" type="checkbox" '
        //         + (set.has(value) ? ' checked' : '') + '/></span>';
        //     } else {
        //       return '<span padding-left:6px;><input data-tablelegs-toggle="true" type="checkbox" '
        //         + (set.has(value) ? ' checked' : '') + '/></span>';
        //     }
        //   }
        // };

        results.forEach(function (o){
        o.cell_id.sort(function(a,b) { return b.localeCompare(a)});
        })


        var cellSet = new morpheus.Set();
        var table = new tablelegs.Table({
            height: '300px',
            columnPicker: true,
            tableClass: 'slick-table slick-bordered-table slick-hover-table',
            select: false,
            search: true,
            export: false,
            $el: $center,
            columns: [
                checkBoxColumn, {
                    field: 'pert_id',
                    name: 'Id'
                }, {
                    field: 'pert_iname',
                    name: 'Name'
                }, {
                    field: 'pert_type',
                    name: 'Type',
                    renderer: function (item, value) {
                        if (value === 'trt_cp') {
                            return '<i class="text-center glyphicon glyphicon-adjust touchstone-cp"></i>';
                        } else if (value === 'trt_sh.cgs') {
                            return '<i class="text-center glyphicon glyphicon-minus-sign touchstone-kd"></i>';
                        } else if (value === 'trt_oe') {
                            return '<i class="text-center glyphicon glyphicon-plus-sign touchstone-oe"></i>';
                        } else {
                            return value;
                        }
                    }
                }, {
                    field: 'description',
                    name: 'Description'
                },
                {
                    name: '# Signatures', // CPC014_A375_6H:BRD-K70401845-001-02-5:10
                    getter: function (item) {
                        if (cellSet.size() === 0) {
                            return item.sig_id.length;
                        }
                        return item.sig_id.filter(function (id) {
                                return cellSet.has(id.split('_')[1]);
                            }).length + ' / ' + item.sig_id.length;
                    },
                    renderer: function (item, value) {
                        return '' + value;
                    }
                }],
            items: results
        });
        // table.onClick.subscribe(function (e, args) {
        //   if ($(e.target).hasClass('toggle')) {
        //     var item = dataView.getItem(args.row);
        //     if (item) {
        //       if (!item._collapsed) {
        //         item._collapsed = true;
        //       } else {
        //         item._collapsed = false;
        //       }
        //       table.render();
        //     }
        //     e.stopImmediatePropagation();
        //   }
        // });


        var filterManager = new clue.FilterManagerUI(new clue.FilterManager(
            results), $left);

        filterManager.add({
            name: 'Cell Line',
            filter: new clue.SetFilter({
                get: function (item, index) {
                    return item.cell_id[index];
                },
                nvalues: function (item) {
                    return item.cell_id.length || 0;
                }
            })
        });

      // this.filterNameToFilter.set(name, filter);
        // add table filter to facets
        filterManager.getFilterManager().preFilter = table.getFilter().get(0);
        // add facet filter to table
        table.getFilter().add(filterManager.getFilterManager().createFilter());

        // table shows items passing table filter and faceted filters
        // facets show items passing table filter and facets, except own facet

        var searchingTable = false;
        table.on('filter', function () {
            searchingTable = true;
            // update facets
            filterManager.filter();
            searchingTable = false;
        });

        filterManager.on('filter', function () {

            if (!searchingTable) {
                cellSet = filterManager.get('Cell Line').set;
                table.setFilter(table.getFilter());
            }
        });

        filterManager.filter();


      // table.on('selectionChanged',
        //   function (e) {
        //     var selectedRows = e.selectedRows;
        //     if (selectedRows.length > 0) {
        //       var selectedItem = table.getItems()[selectedRows[0]];
        //       if (selectedItem) {
        //
        //       }
        //     }
        //   });

        var $customButtons = $('<div><button name="view" type="button" ' +
            'class="btn btn-primary pull-right btn-view-scores btn-sm"><span>Update viewer</span></button>' +
            '<span name="load-text"></span></div>');

        $customButtons.find('button').prop('disabled', true);
        table.on('checkBoxSelectionChanged', function () {
            $customButtons.find('button').prop('disabled', checkBoxColumn.getSelection().size() === 0);
        });
        $customButtons.appendTo($center);
        $customButtons.find('[name=view]').on('click', function (e) {
            $customButtons.find('[name=load-text]').text('Loading signatures into viewer, please wait...');
            e.preventDefault();
            var pertIds = checkBoxColumn.getSelection();
            if (pertIds.size() === 0) {
                return;
            }
            var sigIds = [];
            pertIds.forEach(function (id) {
                sigIds = sigIds.concat(pertIdToItem.get(id).sig_id);
            });
            if (cellSet.size() > 0) {
                sigIds = sigIds.filter(function (id) {
                    return cellSet.has(id.split('_')[1]);
                });
            }
            if (sigIds.length === 0) {
                return;
            }
            if (sigIds.length > 100) {
              sigIds = sigIds.slice(0,100)
              $customButtons.find('[name=load-text]').text('Loading first 100 signatures into viewer, please wait...');
            }
            zs.getZScoreDataset(sigIds).done(function (zscoreDataset) {
                if (zscoreDataset != null) {
                    $heatmap.empty();
                    zscoreDataset.getColumnMetadata().getByName('pert_iname').setName('name');
                    // .getByName('name');
                    var utils = require('Shared/utils.js');
                    new morpheus.HeatMap({
                        el: $heatmap,
                        height: 500,
                        rows: [
                            {
                                field: 'id',
                                display: ['text']
                            }, {
                                field: 'pr_gene_symbol',
                                renameTo: 'symbol',
                                display: ['text']
                            }, {
                                field: 'gene_space',
                                display: ['text', 'color']
                            }],
                        columns: [
                            {
                                field: 'name',
                                display: 'text'
                            },
                            {
                                field: 'cell_id',
                                display: 'text'
                            },
                            {
                                field: 'pert_idose',
                                display: 'text'
                            },
                            {
                                field: 'pert_itime',
                                display: 'text'
                            },
                            {
                                field: 'pert_type',
                                display: ['color']
                            }],
                        toolbar: utils.quickMorpheusToolbar({
                            saveImage: false
                        }),
                        menu: null,
                        autohideTabBar: true,
                        overrideColumnDefaults: false,
                        dataset: zscoreDataset,
                        colorScheme: morpheus.HeatMapColorScheme.Predefined.ZS()
                    });


                    for (i = 0; i < accordions.length; i++) {
                        // var panel = accordions[i].nextElementSibling;
                        // panel.style.display = "block";
                        options.$el.find('.accordion').eq(i)[0].onclick = function () {
                            /* Toggle between adding and removing the "active" class,
                             to highlight the button that controls the panel */
                            this.classList.toggle("active");
                            /* Toggle between hiding and showing the active panel */
                            var panel = this.nextElementSibling;
                            if (panel.style.maxHeight){
                                panel.style.maxHeight = null;
                            } else {
                                panel.style.maxHeight = (panel.scrollHeight) + "px";
                            }
                        }
                    }

                    // var selectPanel = options.$el.find('#sigSelectPanel').eq(0)[0];
                    $accordionPicker.removeClass('active');
                    $pickerPanel[0].style.maxHeight = null;
                    $accordionHeatMap.addClass('active');
                    $viewerPanel[0].style.maxHeight = $viewerPanel[0].scrollHeight + "px";
                    $heatmap[0].scrollIntoView();
                    $customButtons.find('[name=load-text]').text('');
                }
            }).fail(function (err) {
                morpheus.FormBuilder.showMessageModal({
                    title: 'Error',
                    html: err
                });
            });
        });

        $accordionPicker.click();

        var object = options.object;
        object.cellSet = cellSet;
        object.checkBoxColumn = checkBoxColumn;
        object.pertIdToItem = pertIdToItem;
        exports.changeTabHeader(object);
    });
};

function setupHeader(object) {
  setupExportOptions(object);
}

function setupExportOptions(object) {
    var $el = object.$el;
    $el.find('.command-out-links').show();
    var $exportOptions = $el.find('.export-options');
    var exportOptionsHtml = '<input type="radio" name="exportType" value="0" class="export-radio">' +
        'Export the z-score data for the selected signatures (.gct, version 1.3)</input><br>';
    $exportOptions.html(exportOptionsHtml);
    $el.find('.export-btn-confirm').on('click',{object:object},function(e) {
        executeExport(e.data.object);
    });
    $el.find('.export-btn-cancel').on('click',{object:object},function(e) {
        e.data.object.$el.find('.export-modal').modal('hide');
    });
    $el.find('.export-btn').on('click',{$el:object.$el},function(e) {
        e.data.$el.find('.export-warning').html('');
        e.data.$el.find('.export-pending').html('');
    });
}

function executeExport(object) {
    var $el = object.$el;
    var $exportWarning = $el.find('.export-warning');
    var $exportPending = $el.find('.export-pending');
    $exportWarning.html('');
    var inputType = $('input[name="exportType"]:checked').val();
    var fileName = $el.find('.export-filename-prompt').val();
    fileName = fileName ? fileName : 'command_output';

    if(!inputType) {
      $exportWarning.html('No option selected');
    }
    else {
        if(inputType==0) {
            if (!morpheus.Util.endsWith(fileName.toLowerCase(), '.gct')) {
                fileName += '.gct';
            }
            var pertIds = object.checkBoxColumn.getSelection();
            var sigIds = [];
            pertIds.forEach(function (id) {
                sigIds = sigIds.concat(object.pertIdToItem.get(id).sig_id);
            });
            if (object.cellSet.size() > 0) {
                sigIds = sigIds.filter(function (id) {
                    return object.cellSet.has(id.split('_')[1]);
                });
            }
            if(sigIds.length === 0) {
                $exportWarning.html('Must select one or more valid perturbagens from the table');
                return;
            }
            else if(sigIds.length > 100) {
                $exportWarning.html('Cannot export: maximum signature limit of 100');
                var exportConfirm = confirm("The maximum amount of signatures downloadable at one time is 100. " +
                  "If you confirm, Command will download only the first 100 signatures. Do you wish to continue?");
                if (exportConfirm) {
                  $exportPending.html('Saving data...');
                  $exportWarning.html('');
                  saveSigsAsGct(sigIds.slice(0,100),fileName)
                    .done( function() {
                      $el.find('.export-modal').modal('hide');
                    })
                    .fail( function() {
                      $exportPending.html('');
                      $exportWarning.html('ERROR: Could not export. Please try again later.');
                    });
                }
                else {
                  $el.find('.export-modal').modal('hide');
                }
            }
            else {
                $exportPending.html('Saving data...');
                saveSigsAsGct(sigIds,fileName)
                .done( function() {
                    $el.find('.export-modal').modal('hide');
                })
                .fail( function() {
                    $exportPending.html('');
                    $exportWarning.html('ERROR: Could not export. Please try again later.');
                });
            }
        }
    }
};

function saveSigsAsGct(sigIds, fileName) {
    var d = $.Deferred();
    zs.getZScoreDataset(sigIds).done(function (zscoreDataset) {
        if (zscoreDataset != null) {
            var writer = new morpheus.GctWriter();
            var blobs = [];
            var textArray = [];
            var proxy = {
                push: function (text) {
                    textArray.push(text);
                    if (textArray.length === 10000) {
                        var blob = new Blob([textArray.join('')], {type: 'text/plain;charset=charset=utf-8'});
                        textArray = [];
                        blobs.push(blob);
                    }
                },
                join: function () {
                    if (textArray.length > 0) {
                        var blob = new Blob([textArray.join('')], {type: 'text/plain;charset=charset=utf-8'});
                        blobs.push(blob);
                        textArray = [];
                    }

                    var blob = new Blob(blobs, {type: 'text/plain;charset=charset=utf-8'});
                    saveAs(blob, fileName, true);
                }
            };
            writer.write(zscoreDataset, proxy);
            d.resolve();
        }
    }).fail(function (err) {
        d.reject(err);
    });
    return d;
}

exports.changeTabHeader = function(tabObject) {
    // showHeaderButtons(tabObject);
    // $('#inputInterpretationDropdown').hide();
};