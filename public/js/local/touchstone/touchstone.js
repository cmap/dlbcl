/**
 * Created by turner on 8/27/15.
 */

var SELECTION_LIMIT = 50;

function appLaunch() {

    $(document).one('clueReady', function () {
        $("#coaching_tip_trigger").attr("data-tooltip-class", 'coaching_tips');
        $("#coaching_tip_trigger").attr("data-popover-config",
            '[{"target_id": "table_search", "content_id": "tt_touchstone_table_search", "placement": "bottom"},' +
            '{"target_id": "table_rowcount", "content_id": "tt_touchstone_table_rowcount", "placement": "right"},' +
            '{"target_id": "filterby", "content_id": "tt_touchstone_facets", "placement": "bottom"}, ' +
            '{"target_id": "pert_type_filter", "content_id": "tt_touchstone_pert_type_filter", "placement": "right"}, ' +
            '{"target_id": "pert_classes", "content_id": "tt_touchstone_pert_classes", "placement": "right"}, ' +
            '{"target_id": "header-app-title", "content_id": "tt_touchstone_header-app-title", "placement": "right"}]');
        $("#coaching_tip_trigger").removeClass("no-tip");
        //$('#loading-spinner').show();
        $(".limitwarning").text("  Please note that you may only select up to " + SELECTION_LIMIT + " perturbagens.");

        ingestTouchstone(function (touchstoneData) {

            $('#TScontent').css('display', 'block');
            $('#loading').remove();

            var index,
                pert_types,
                collection_names,
                collections =
                {
                    'AUTOPHAGY TOOLKIT': 'autophagy',
                    'ALCOHOL ADDICTION': 'addiction',
                    'KINASE INHIBITOR': 'kinase_inhibitors',
                    'ENZYME-INHIBITOR': 'enzyme_inhibitors',
                    'ANTI-INFECTIVE': 'anti_infectives',
                    'pcl': 'pcl'
                };

            // pert facets
            index = 0;
            pert_types = ['cp', 'kd', 'oe'];
            _.extend(scarpa, scarpa.facetBitSetWithCategoryAndBitPosition('pert_type', pert_types, index));

            // cell line facets
            index += (1 + _.size(pert_types));
            _.extend(scarpa, scarpa.facetBitSetWithCategoryAndBitPosition('cell_line_specificity', _.union(validCellLines(), ['none_selective']), index));

            // collection facets
            index += (1 + _.size(_.union(validCellLines(), ['none_selective'])));
            collection_names = _.values(collections);
            _.extend(scarpa, scarpa.facetBitSetWithCategoryAndBitPosition('collection', collection_names, index));

            scarpa.touchstoneDatasource = new scarpa.TSDatasource(touchstoneData, collections, validCellLines(), "ts");

            configureWithTouchstoneData(scarpa.touchstoneDatasource.data);

            //$('#loading-spinner').hide();

            function validCellLines() {

                // identify valid cell line names - derived from DOM element values - and only consider them
                var $input = "input[name=cell_line_specificity]:checkbox",
                    $items = $('#filters').find($input),
                    list = [];

                $items.each(function () {
                    var value = $(this).attr('value');

                    if ('none_selective' !== value) {
                        list.push($(this).attr('value'));
                    }

                });

                return list;
            }

        }, function (errorMessage) {
            console.log('error: ingestClueTouchstone: ' + errorMessage);
        });

        function ingestTouchstone(success, failure) {
            var version = scarpa.getQueryVersion();
            refreshTSCache(version,function (err, tsData) {
                if(err){
                    return failure('error: clue.getTouchStone');
                }
                touchstoneResultsHandler(tsData, success);
            });
            function touchstoneResultsHandler(list, success) {
                _.each(list, function (d) {

                    var obj,
                        uppercaseKeys;

                    if (d.cell_line_specificity) {

                        uppercaseKeys = _.keys(d.cell_line_specificity);

                        _.each(uppercaseKeys, function (uppercaseKey) {
                            d.cell_line_specificity[uppercaseKey.toLowerCase()] = d.cell_line_specificity[uppercaseKey]
                        });

                        obj = _.omit(d.cell_line_specificity, uppercaseKeys);

                        d.cell_line_specificity = obj;

                    }

                });

                success(list);
            }

        }

        function checkDisableButtons(tstable) {
            if(tstable.checkBoxColumn.getSelection().size()===0) {
                $('#show-heatmap').attr("disabled", true);
                $("#show-detailed-list").attr("disabled", true);
            } else {
                $('#show-heatmap').attr("disabled", false);
                $("#show-detailed-list").attr("disabled", false);
            }
        }

        function configureWithTouchstoneData(touchstoneData) {

            var config,
                touchstoneVersion;

            config =
            {
                $parent: $('#touchstone_table'),
                //height: '628px',
                data: touchstoneData,
                doSearch: true,
                doShowCheckbox: true,
                doRowSelection: true,
                customButtons: true,
                tabletype: "touchstone",
                mouseOverHandler: function (tstable, e) {
                    tstable.context.row = e.row;
                },
                mouseOutHandler: function (tstable, e) {
                    tstable.context = {};
                },
                rowSelectionChangedHandler: function (tstable, e) {
                    $('.popover').remove();
                    var row = e.selectedRows[0];
                    if (row !== undefined) {
                        var item = tstable.table.getItems()[row];
                        var url = getCardUrl(item);
                        //$.pjax({url: url, container: '#cardsection', push:false});
                        getCard(url, "#cardsection");
                        $("#cardsection").css("display", "block");
                    }
                },
                checkboxClickHandler: function (tstable, e) {
                    checkDisableButtons(tstable);
                    Cookies.set('selectedRows', tstable.checkBoxColumn.getSelection().values(), {path: ''});
                },
                dropdownMenuCustomizer: touchstoneTableDropdownCustomizer,
                columns: touchstoneTableColumns()
            };

            scarpa.touchstoneTable = new scarpa.TSTable(config);
            checkDisableButtons(scarpa.touchstoneTable);

            configureSelectedSignaturesModal($('#selected-signatures-modal'));

            configureFiltersWithTouchstoneData(touchstoneData);

            $('#reset-all-facets').click(function () {
                scarpa.filterEngine.unselectAllFilters();
            });


            var version = scarpa.getQueryVersion();

            if (version === "1") {
                var str = 'Version:  1.0.1.1';
                $('#app_version_string').append('<a href="/version-data-old" target="version">' + str + '</a>');
            } else {
                clue.touchStoneVersion(function (error, obj) {
                    if (error) {
                        console.log('error: clue.touchstoneVersion');
                    } else {
                        var str = 'Version: ' + obj.version;
                        $('#app_version_string').append('<a href="/version-data-old" target="version">' + str + '</a>');
                    }
                });
            }

            function selectionLimit() {
                $("#limitnum").text("You have exceeded the selection limit of " + SELECTION_LIMIT + ".");
                $("#tslimit").modal('show');
            }

            function touchstoneTableColumns() {

                var columns = [];

                // Pert type
                columns.push({
                    field: 'pert_type',
                    name: 'Type',
                    maxWidth: 30,
                    minWidth: 30,
                    resizable: false,
                    headerCssClass: 'perttype-clmn-header clmn-nondragabble',
                    cssClass: 'text-left',
                    renderer: function (item, value) {
                        if (value === 'cp') {
                            return '<i class="text-center glyphicon glyphicon-adjust touchstone-cp"></i>';
                        } else if (value === 'kd') {
                            return '<i class="text-center glyphicon glyphicon-minus-sign touchstone-kd"></i>';
                        } else if (value === 'oe') {
                            return '<i class="text-center glyphicon glyphicon-plus-sign touchstone-oe"></i>';
                        } else {
                            console.log('tableJG. Invalid pert type ' + value);
                        }
                    }
                });

                // Pert ID
                columns.push({
                    field: 'pert_id',
                    name: 'ID',
                    maxWidth: 50,
                    minWidth: 50,
                    resizable: false,
                    headerCssClass: 'text-left clmn-nondragabble',
                    cssClass: 'text-left',
                    renderer: function (item, value) {
                        return value.substring(value.length - 4);
                    }
                });

                // Pert iName
                columns.push({
                    field: 'pert_iname',
                    name: 'Name',
                    headerCssClass: 'text-left',
                    cssClass: 'text-left'
                });

                // Description
                columns.push({
                    field: 'description_typeahead',
                    name: 'Description',
                    headerCssClass: 'text-left',
                    cssClass: 'text-left'
                });
                columns.push({
                    field: 'gene_target_typeahead',
                    name: 'Target',
                    visible: false,
                    headerCssClass: 'text-left',
                    cssClass: 'text-left'
                });

                // Gene MOA (initially hidden)
                columns.push({
                    field: 'moa_typeahead',
                    name: 'MoA',
                    visible: false,
                    headerCssClass: 'text-left',
                    cssClass: 'text-left'
                });

                // PCL Membership (initially hidden)
                columns.push({
                    field: 'pcl_membership_typeahead',
                    name: 'CMap Class',
                    visible: false,
                    headerCssClass: 'text-left',
                    cssClass: 'text-left'
                });

                // Transactional Impact (initially hidden)
                //columns.push({
                //    field: 'transcriptional_impact',
                //    name: 'Activity',
                //    visible: false,
                //    headerCssClass: 'text-left',
                //    cssClass: 'text-left'
                //});

                return columns;
            }

            function touchstoneTableDropdownCustomizer($parent) {

                var str;

                // Add To Cart
                /*
                 str = [];
                 str.push('<li role="separator" class="divider"></li>');
                 str.push('<li><a id="add-to-cart-tt" href="#">Add to Cart</a></li>');
                 $(str.join('')).appendTo($parent.find('[data-name=select] > ul'));

                 $('#add-to-cart-tt').click(function () {
                 console.log('#add-to-cart');
                 });*/

                // View Cart Button
                str = [];
                //str.push('<li role="separator" class="divider"></li>');
                str.push('<li><a id="view-cart-tt" href="#">View Cart</a></li>');
                $(str.join('')).appendTo($parent.find('[data-name=select] > ul'));

                $('#view-cart-tt').click(function () {
                    $('#selected-signatures-modal').modal('show');
                });

                // Export
                str = [];
                str.push('<li role="separator" class="divider"></li>');
                str.push('<li><a id="export-table-tt" href="#">Export</a></li>');
                $(str.join('')).appendTo($parent.find('[data-name=select] > ul'));

                $('#export-table-tt').click(function () {
                    scarpa.touchstoneTable.table.exportTable();
                });

            }

            function configureSelectedSignaturesModal($selected_signatures_modal) {

                var $e;

                $selected_signatures_modal.on('hidden.bs.modal', function (e) {
                    scarpa.touchstoneTable.table.redraw();
                });

                $selected_signatures_modal.on('shown.bs.modal', function (e) {

                    var pert_ids,
                        data,
                        config;

                    pert_ids = scarpa.touchstoneTable.checkBoxColumn.getSelection().values();
                    if (0 === _.size(pert_ids)) {
                        return;
                    }

                    data = _.filter(scarpa.touchstoneDatasource.data, function (d) {
                        return _.contains(pert_ids, d.pert_id);
                    });

                    config =
                    {
                        $parent: $('#selected-signatures-table'),
                        height: '256px',
                        data: data,
                        doSearch: false,

                        doShowCheckbox: true,

                        doRowSelection: true,
                        checkboxClickHandler: function (tstable, e) {
                            var values = tstable.checkBoxColumn.getSelection().values();

                            Cookies.set('selectedRows', values, {path: ''});

                            scarpa.touchstoneTable.checkBoxColumn.getSelection().clear();
                            _.each(values, function (value) {
                                scarpa.touchstoneTable.checkBoxColumn.getSelection().add(value);
                                scarpa.touchstoneTable.table.trigger('checkBoxSelectionChanged');
                            });

                        },
                        dropdownMenuCustomizer: selectedSignaturesTableDropdownCustomizer,
                        columns: selectedSignaturesTableColumns()
                    };

                    scarpa.selectedSignaturesTable = new scarpa.TSTable(config);

                    function selectedSignaturesTableDropdownCustomizer($parent) {

                        var str;

                        // Remove From Cart
                        str = [];
                        str.push('<li role="separator" class="divider"></li>');
                        str.push('<li><a id="remove-from-cart-sst" href="#">Remove from Cart</a></li>');
                        $(str.join('')).appendTo($parent.find('[data-name=select] > ul'));

                        $('#remove-from-cart-sst').click(function () {

                            var values;

                            values = scarpa.selectedSignaturesTable.checkBoxColumn.getSelection().values();
                            _.each(values, function (value) {
                                scarpa.selectedSignaturesTable.checkBoxColumn.getSelection().remove(value);
                                scarpa.touchstoneTable.checkBoxColumn.getSelection().remove(value);
                                scarpa.touchstoneTable.table.trigger('checkBoxSelectionChanged');
                            });

                            values = scarpa.selectedSignaturesTable.checkBoxColumn.getSelection().values();
                            Cookies.set('selectedRows', values, {path: ''});

                            scarpa.selectedSignaturesTable.table.redraw();
                        });

                        // Export
                        str = [];
                        str.push('<li role="separator" class="divider"></li>');
                        str.push('<li><a id="export-table-sst" href="#">Export</a></li>');
                        $(str.join('')).appendTo($parent.find('[data-name=select] > ul'));

                        $('#export-table-sst').click(function () {
                            scarpa.selectedSignaturesTable.table.exportTable();
                        });

                    }

                    function selectedSignaturesTableColumns() {

                        var columns = [];

                        // Pert type
                        columns.push({
                            field: 'pert_type',
                            name: 'Type',
                            headerCssClass: 'text-center',
                            cssClass: 'text-center',
                            renderer: function (item, value) {
                                if (value === 'cp') {
                                    return '<i class="text-center glyphicon glyphicon-adjust glyph-cp"></i>';
                                } else if (value === 'kd') {
                                    return '<i class="text-center glyphicon glyphicon-minus-sign glyph-kd"></i>'
                                } else if (value === 'oe') {
                                    return '<i class="text-center glyphicon glyphicon-plus-sign glyph-oe"></i>';
                                } else {
                                    console.log('tableJG. Invalid pert type ' + value);
                                }
                            }
                        });

                        // Pert ID
                        columns.push({
                            field: 'pert_id',
                            name: 'ID',
                            headerCssClass: 'text-left',
                            cssClass: 'text-left',
                            renderer: function (item, value) {
                                return value.substring(value.length - 4);
                            }
                        });

                        // Pert iName
                        columns.push({
                            field: 'pert_iname',
                            name: 'Name',
                            headerCssClass: 'text-left',
                            cssClass: 'text-left'

                        });

                        // Description
                        columns.push({
                            field: 'description_typeahead',
                            name: 'Description',
                            headerCssClass: 'text-left',
                            cssClass: 'text-left'

                        });

                        return columns;
                    }
                });

                function heatmapClick() {
                    var version = scarpa.getQueryVersion();
                    var pert_ids,
                        url;

                    pert_ids = scarpa.touchstoneTable.checkBoxColumn.getSelection().values();
                    if (SELECTION_LIMIT < _.size(pert_ids)) {
                        selectionLimit();
                        return;
                    }
                    if (0 === _.size(pert_ids)) {
                        return;
                    }
                    url = _.reduce(_.filter(scarpa.touchstoneDatasource.data, function (d) {
                        return _.contains(pert_ids, d.pert_id);
                    }), function (memo, d, i, list) {
                        if(version==='latest') {
                            d.pert_id = d.pert_id.toUpperCase();
                        }
                        return memo + ((0 === i) ? '/icv?' : '') + 'pert_id=' + d.pert_id + ((i < (_.size(list) - 1)) ? '&' : '');
                    }, '');

                    if (undefined === url || "" === url) {
                        return;
                    }

                    if(version && version!=='latest') {
                        url += "&version=1";
                    }

                  window.open(encodeURI(url), 'heatmap_app');
                }

                function detailedListClick() {
                    var version = scarpa.getQueryVersion();
                    var pert_ids,
                        url;

                    pert_ids = scarpa.touchstoneTable.checkBoxColumn.getSelection().values();
                    if (SELECTION_LIMIT < _.size(pert_ids)) {
                        selectionLimit();
                        return;
                    }
                    if (0 === _.size(pert_ids)) {
                        console.log('no selected rows');
                        return;
                    }

                    var pertlist = [];
                    var pertlist2 = []
                    var url = "";

                    _.filter(scarpa.touchstoneDatasource.data, function (d) {
                        if (_.contains(pert_ids, d.pert_id)) {
                            pertlist.push(d);
                        }
                    });

                    for (var i = 0; i < scarpa.touchstoneTable.checkBoxColumn.getSelection().values().length; i++) {
                        for (var j = 0; j < pertlist.length; j++) {
                            if (pertlist[j].pert_id === scarpa.touchstoneTable.checkBoxColumn.getSelection().values()[i]) {
                                pertlist2.push(pertlist[j]);
                            }
                        }
                    }

                    url = _.reduce(pertlist2, function (memo, d, i, list) {
                        if(version==='latest') {
                            d.pert_id = d.pert_id.toUpperCase();
                        }
                        return memo + ((0 === i) ? '/connection?' : '') + 'url=' + scarpa.touchstone_root_directory + "/" + d.pert_id + ((i < (_.size(list) - 1)) ? '&' : '');
                    }, '');

                    if (undefined === url || "" === url) {
                        return;
                    }

                    window.open(encodeURI(url), 'connection_app');
                }

                $('#show-heatmap').click(function (event) {

                    heatmapClick();
                });

                $('#show-heatmap-ss-modal').click(function (event) {

                    heatmapClick();
                });

                $('#introspect').on('click', function (event) {
                    event.preventDefault();
                    var pert_ids,
                        url;

                    pert_ids = scarpa.touchstoneTable.checkBoxColumn.getSelection().values();
                    if (0 === _.size(pert_ids)) {
                        return;
                    }
                    url = _.reduce(_.filter(scarpa.touchstoneDatasource.data, function (d) {
                        return _.contains(pert_ids, d.pert_id);
                    }), function (memo, d, i, list) {
                        return memo + ((0 === i) ? '/icv?' : '') + 'pert_id=' + d.pert_id + ((i < (_.size(list) - 1)) ? '&' : '');
                    }, '');

                    if (undefined === url || "" === url) {
                        return;
                    }

                    url += '&data_type=introspect';
                    window.location = url;
                });
                $('#tanimoto').on('click', function (event) {
                    event.preventDefault();
                    var pert_ids,
                        url;

                    pert_ids = scarpa.touchstoneTable.checkBoxColumn.getSelection().values();
                    if (0 === _.size(pert_ids)) {
                        return;
                    }
                    url = _.reduce(_.filter(scarpa.touchstoneDatasource.data, function (d) {
                        return _.contains(pert_ids, d.pert_id);
                    }), function (memo, d, i, list) {
                        return memo + ((0 === i) ? '/icv?' : '') + 'pert_id=' + d.pert_id + ((i < (_.size(list) - 1)) ? '&' : '');
                    }, '');

                    if (undefined === url || "" === url) {
                        return;
                    }

                    url += '&data_type=tanimoto';
                    window.location = url;
                });
                $('#signature').on('click', function (event) {
                    event.preventDefault();
                    var pert_ids,
                        url;

                    pert_ids = scarpa.touchstoneTable.checkBoxColumn.getSelection().values();
                    if (0 === _.size(pert_ids)) {
                        return;
                    }
                    url = _.reduce(_.filter(scarpa.touchstoneDatasource.data, function (d) {
                        return _.contains(pert_ids, d.pert_id);
                    }), function (memo, d, i, list) {
                        return memo + ((0 === i) ? '/icv?' : '') + 'pert_id=' + d.pert_id + ((i < (_.size(list) - 1)) ? '&' : '');
                    }, '');

                    if (undefined === url || "" === url) {
                        return;
                    }

                    url += '&data_type=modzs';
                    window.location = url;
                });
                $("#show-detailed-list").click(function (event) {
                    detailedListClick();
                });

                $("#show-detailed-list-ss-modal").click(function (event) {
                    detailedListClick();
                });

                //$( '#export-ss-modal' ).click(function (event) {
                //    //$('#selected-signatures-modal').modal('hide');
                //    scarpa.selectedSignaturesTable.table.exportTable();
                //});

            }

            function configureFiltersWithTouchstoneData(touchstoneData) {

                scarpa.filterEngine = new scarpa.FilterEngine($('#filters'));

                _.each(scarpa.filterEngine.facetNames, function (name) {
                    scarpa.filterEngine.facets[name].change(function () {
                        scarpa.filterEngine.evaluate(touchstoneData);
                    });
                });

                scarpa.filterEngine.updateFacetCount(touchstoneData);

            }
        }

        scarpa.dispatch.on("tstable_did_update_checkbox.touchstone", function (selectedList) {
            Cookies.set('selectedRows', selectedList, {path: ''});
        });

        scarpa.dispatch.on("tstable_did_update_row_counter.touchstone", function (tstable) {
            var numer = tstable.table.getFilteredItemCount(),
                denom = _.size(scarpa.touchstoneDatasource.data),
                str;

            str = scarpa.numberFormatter(numer) + ' / ' + scarpa.numberFormatter(denom);
            tstable.$tableRowCounter.text("Viewing: " + str);

            // console.log('dispatch - tstable_did_update_row_counter ' + tstable.$tableRowCounter.text());
        });

        scarpa.dispatch.on("do_evaluate_filter_chain.touchstone", function (ignored) {
            scarpa.filterEngine.evaluate(scarpa.touchstoneDatasource.data);
        });

        scarpa.dispatch.on("tstable_did_show_all_rows.touchstone", function () {
            scarpa.filterEngine.unselectAllFilters();
        });
    });
}
