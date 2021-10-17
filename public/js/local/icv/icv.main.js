function makeJSON(text) {
    var tokens = [];
    var splits = text.split(/\n/);
    for (var i = 0; i < splits.length; i++) {
        var splitToken = splits[i].split(/\t/);
        if (splitToken[1] !== undefined) {
            tokens.push({v1: splitToken[0], v2: splitToken[1]});
        }
    }
    return tokens;
}

clue.ICV = function (options) {
    var _this = this;
    var defaultOptions = {
        el: $('#vis'),
        annotate: true,
        pclSummary: true,
        title: true,
        standalone: true,
        pclCell: true,
        barChartSelection: true,
        $loadingImage: clue.createLoadingEl(),
        datasetReady: function (dataset) {

            if (options.dataType === clue.ICV.DataType.INTROSPECT) {
                clue.ICV.fixIntrospectMetadata(dataset.getRowMetadata());

                dataset.getColumnMetadata().getByName('id').setName('_id');
                dataset.getColumnMetadata().getByName('pert_id').setName('id');
                ['pert_type', 'pert_idose'].forEach(function (name) {
                    var index = morpheus.MetadataUtil.indexOf(dataset.getColumnMetadata(), name);
                    if (index !== -1) {
                        dataset.getColumnMetadata().remove(index);
                    }
                });
                // put rows and columns in same order
                var tmp = new morpheus.Project(dataset);
                tmp.setRowSortKeys([
                    new morpheus.SortKey('id', morpheus.SortKey.SortOrder.ASCENDING, false),
                    new morpheus.SortKey('cell_id', morpheus.SortKey.SortOrder.ASCENDING, false)], true);
                tmp.setColumnSortKeys([
                    new morpheus.SortKey('id', morpheus.SortKey.SortOrder.ASCENDING, true),
                    new morpheus.SortKey('cell_id', morpheus.SortKey.SortOrder.ASCENDING, true)], true);
                dataset = tmp.getSortedFilteredDataset();
            }

            clue.ICV.prepareDataset(dataset, options);
            if (options.dataType === clue.ICV.DataType.GUTC) {
                var ranges = options.ranges || [95, 97.5];
                clue.AddConnectivity(dataset, ranges);
                clue.AddConnectivity(new morpheus.TransposedDatasetView(dataset), ranges);
            }
            if (dataset.getColumnMetadata().getByName('pert_type')) {
                // rename to type
                var index = morpheus.MetadataUtil.indexOf(dataset.getColumnMetadata(), 'type');
                if (index !== -1) {
                    dataset.getColumnMetadata().remove(index);
                }
                dataset.getColumnMetadata().getByName('pert_type').setName('type');
            }
            if (!options.externalUserQuery && dataset.getColumnMetadata().getByName('cell_id')) {
                if (!morpheus.VectorUtil.containsMoreThanNValues(dataset.getColumnMetadata().getByName('cell_id'), 1)) {
                    var index = morpheus.MetadataUtil.indexOf(dataset.getColumnMetadata(), 'cell_id');
                    dataset.getColumnMetadata().remove(index);
                }
            }
            if (options._datasetReady) {
                options._datasetReady(dataset);
            }
            return dataset;
        },
        tabOpened: function (heatMap) {
            var ds = heatMap.getProject().getFullDataset();
            if (heatMap.options.parent) {
                heatMap.options.dataType = heatMap.options.parent.options.dataType;
            }

            function updateCard() {
                var viewIndices = heatMap.getProject().getRowSelectionModel().getViewIndices();
                if (viewIndices.size() === 1) {
                    var pertType = (heatMap.options.dataType === clue.ICV.DataType.GCP || heatMap.options.dataType === clue.ICV.DataType.P100 ||
                        heatMap.getProject().getSortedFilteredDataset().getRowMetadata().getByName('type') == null) ? 'CP' : heatMap.getProject()
                        .getSortedFilteredDataset()
                        .getRowMetadata()
                        .getByName('type')
                        .getValue(viewIndices.values()[0]);
                    if (pertType === undefined) {
                        pertType = "CP";
                    }
                    var idVector = heatMap.getProject()
                        .getSortedFilteredDataset()
                        .getRowMetadata()
                        .getByName('pert_id');
                    if (!idVector) {
                        idVector = heatMap.getProject()
                            .getSortedFilteredDataset()
                            .getRowMetadata()
                            .getByName('id');
                    }
                    var pertId = idVector.getValue(viewIndices.values()[0]);

                    //var url = '/cards/' + type + '/' + pertId;
                    if (pertType != null) {
                        var pert_item = {
                            pert_id: pertId,
                            pert_type: pertType
                        };
                        var url = getCardUrl(pert_item, window.location.search);
                        getCard(url, '#' + heatMap.$card.prop('id'));
                    }
                    // var $card = $('<iframe seamless' +
                    //   ' style="border:none;height:500px;width:100%;opacity:0;"' +
                    //   ' src="' + url + '"></iframe>');
                    // $('#' + clue.ICV.pertCardId).html($card);
                    // $card.on('load', function (e) {
                    //   $(this.contentDocument).find('header').remove();
                    //   $(this).css('opacity', '1');
                    // });

                }

            }

            if (heatMap.options.dataType === clue.ICV.DataType.GUTC && options.barChartSelection) {

                var positiveSelectionVector = ds.getColumnMetadata().add('pc_selection');
                positiveSelectionVector.getProperties().set(morpheus.VectorKeys.TITLE,
                    'The percent of total perturbagens, querying the column sample against selected rows, that exceed the given thresholds');
                positiveSelectionVector.getProperties().set(morpheus.VectorKeys.FIELDS,
                    ['% selected connections >= 90', '% selected connections >= 95']);
                positiveSelectionVector.getProperties().set(
                    morpheus.VectorKeys.DATA_TYPE, '[number]');
                positiveSelectionVector.getProperties().set(morpheus.VectorKeys.RECOMPUTE_FUNCTION_SELECTION, true);
                positiveSelectionVector.getProperties().set(morpheus.VectorKeys.FUNCTION, {
                    binSize: 5,
                    domain: [90, 100],
                    cumulative: true,
                    percent: true
                });
                var counter = 0;
                var introspectTopN = 30;
            }
            heatMap.quickAccessWindow = new clue.ICVQuickAccesss(heatMap);
            heatMap.$card = $('<div id="' + _.uniqueId('card') + '"></div>');

            if (this.quickAccess) { // custom quick access
                this.quickAccess().prependTo(heatMap.quickAccessWindow.$el);
            }
            heatMap.getProject().getRowSelectionModel().on('selectionChanged', function (e) {
                updateCard();
            });
            if (heatMap.options.dataType === clue.ICV.DataType.GUTC) {
                diffConnInit(heatMap);
                // heatMap.options.plugins.forEach(function (plugin) {
                //   window[plugin](heatMap);
                // });
            }

            var $content = _this.$quickAccessWrapper.find('[data-name=content]');
            var $card = _this.$quickAccessWrapper.find('[data-name=card]');
            $card.children().detach(); // don't remove listeners
            $content.children().detach();

            heatMap.quickAccessWindow.$el.appendTo($content);
            _this.$quickAccessWrapper.css('display', '');

            heatMap.$card.appendTo($card);

        },
        renderReady: function (heatMap) {
            var sessionLoaded = heatMap.options.sessionLoaded;

            var negativeColors = ['#9ecae1', '#3182bd'];
            var positiveColors = ['#fc9272', '#de2d26'];

            var positiveSelectionVector = heatMap.getProject().getFullDataset().getColumnMetadata().getByName('pc_selection');
            if (positiveSelectionVector) {
                if (!heatMap.options.sessionLoaded) {
                    var positiveSelectionTrack = heatMap.addTrack('pc_selection', true, 'stacked_bar');
                    positiveSelectionTrack.settings.autoscaleAlways = true;
                }
                for (var i = 0; i < positiveColors.length; i++) {
                    heatMap.getProject().getColumnColorModel().setMappedValue(
                        positiveSelectionVector, i, positiveColors[i]);
                }

            }

            var rowIdVector = heatMap.getProject().getFullDataset().getRowMetadata().getByName('id');
            if (heatMap.options.dataType === clue.ICV.DataType.GUTC && (clue.ICV.CONN_SUMM || clue.ICV.CONNECTICONS)) {
                var positiveVector = heatMap.getProject().getFullDataset().getRowMetadata().add('ts_pc');
                positiveVector.getProperties().set(morpheus.VectorKeys.TITLE,
                    'The percent of total Touchstone perturbagens that connect to the selected row perturbagen above the indicated thresholds');
                positiveVector.getProperties().set(morpheus.VectorKeys.FIELDS,
                    ['% connections >= 95', '% connections >= 97.5']);
                positiveVector.getProperties().set(
                    morpheus.VectorKeys.DATA_TYPE, '[number]');

                for (var i = 0, size = rowIdVector.size(); i < size; i++) {
                    var conn = clue.ICV.CONN_SUMM.get(rowIdVector.getValue(i));
                    if (conn !== undefined) {
                        positiveVector.setValue(i, conn[0]);
                    }
                }
                if (!sessionLoaded) {
                    heatMap.getProject().getRowColorModel().setMappedValue(
                        positiveVector, 1, '#756bb1');
                    heatMap.getProject().getRowColorModel().setMappedValue(
                        positiveVector, 0, '#bcbddc');

                }
                if (!sessionLoaded) {
                    var posConnTrack = heatMap.addTrack('ts_pc', false, 'stacked_bar');
                    posConnTrack.settings.min = 0;
                    posConnTrack.settings.max = 6;
                }
                //if (!sessionLoaded) {
                heatMap.getHeatMapElementComponent().getColorScheme().getConditions().add({
                    seriesName: 'PCL',
                    color: '#fdf801',
                    shape: 'circle',
                    v1: 1,
                    v1Op: 'gte',
                    inheritColor: false,
                    accept: function (val) {
                        return val === 1;
                    }
                });
                if (options.connecticons) {
                    var seriesName = 'CONNECTICON';
                    if (options.connecticons.tooltip_field) {
                        seriesName = options.connecticons.tooltip_field;
                    }
                    heatMap.getHeatMapElementComponent().getColorScheme().getConditions().add({
                        seriesName: seriesName,
                        color: '#fdf801',
                        shape: 'circle',
                        v1: 1,
                        v1Op: 'gte',
                        inheritColor: false,
                        accept: function (val) {
                            if (val) {
                                var index = clue.ICV.CONNECTICON_MAP.get(val);
                                if (index) {
                                    return true
                                }
                            }
                            return false;
                        }
                    });
                }
                // each pert neeeds its own PCL series model, should be 6-10 columns (rows)
                // three wrong things: wrong number of columns in pcl series, adding to the wrong indexes (not a problem if we use all the same)
                //    and reading from wrong indexes (also not a problem if it is same series name

                // set value doesn't necessarily need to be changed, it theoretically finds the write dataset, problem is that we are using all the same pcl series
                // need to enumerate one for each pcl
                //}
            }

            if (!sessionLoaded && heatMap.getTrack('name', true)) {
                heatMap.getTrack('name', true).settings.inlineTooltip = true;
            } else if (!sessionLoaded && heatMap.getProject().getFullDataset().getColumnMetadata().getByName('id') &&
                heatMap.getTrack('pc', true) && !heatMap.getTrack('id', true)) {
                heatMap.addTrack('id', true, 'text');
            }
            if (!sessionLoaded && heatMap.getTrack('id', true)) {
                heatMap.getTrack('id', true).settings.inlineTooltip = true;
            }

            if (!sessionLoaded) {
                ['pert_itime', 'pert_idose', 'cell_id', 'query_cell_id', 'tas'].forEach(function (field) {
                    if (heatMap.getTrack(field, true)) {
                        heatMap.getTrack(field, true).settings.inlineTooltip = true;
                    }
                });
            }

            if (!sessionLoaded && heatMap.getTrack('cell_id', false)) {
                heatMap.getTrack('cell_id', false).settings.highlightMatchingValues = true;
                if (heatMap.getTrack('name', false)) {
                    heatMap.getTrack('name', false).settings.highlightMatchingValues = true;
                }
            }

            if (!sessionLoaded && heatMap.getTrack('name', false)) {
                heatMap.getTrack('name', false).settings.inlineTooltip = true;
            }

            var $quickToggle = _this.$quickAccessWrapper.find('[name=quick]');
            var $open = $quickToggle.find('[data-name=open]');
            var $close = $quickToggle.find('[data-name=close]');
            $quickToggle.on('click',
                function (e) {
                    e.preventDefault();
                    if (_this.$offscreenContent.is(':visible')) {
                        $open.show();
                        $close.hide();
                    } else {
                        $open.hide();
                        $close.show();
                    }
                    _this.$offscreenContent.toggle(500);
                });

            _this.$quickAccessWrapper.appendTo(heatMap.$el);
            if ($(window).width() < 770) {
                _this.$offscreenContent.hide();
                $open.show();
                $close.hide();
            }

            if (heatMap.options._renderReady) {
                heatMap.options._renderReady(heatMap);
            }

            if (heatMap.options.renderReadyFunctions) {
                heatMap.options.renderReadyFunctions.forEach(function (t) {
                    t(heatMap);
                });
            }
            if (options.dataType === clue.ICV.DataType.GUTC) {

                var columnVectors = morpheus.MetadataUtil.getVectors(heatMap.getProject().getFullDataset().getColumnMetadata(), [
                    'pc']);
                var rowVectors = morpheus.MetadataUtil.getVectors(heatMap.getProject().getFullDataset().getRowMetadata(), [
                    'pc']);

                for (var i = 0; i < positiveColors.length; i++) {

                    columnVectors.forEach(function (v) {
                        heatMap.getProject().getColumnColorModel().setMappedValue(
                            v, i, positiveColors[i]);
                    });
                    rowVectors.forEach(function (v) {
                        heatMap.getProject().getRowColorModel().setMappedValue(
                            v, i, positiveColors[i]);
                    });

                    // heatMap.getProject().getRowColorModel().setMappedValue(
                    // 	rowVectors[1], i, positiveColors[i]);

                }
                if (!sessionLoaded) {
                    // swap min max for neg conn track
                    var negConnTrack = heatMap.getTrack('nc', false);
                    if (negConnTrack) {
                        var tmp = negConnTrack.settings.max;
                        negConnTrack.settings.max = 0;
                        negConnTrack.settings.min = 1;
                        negConnTrack.settings.minMaxReversed = true;
                    }

                    negConnTrack = heatMap.getTrack('nc', true);
                    if (negConnTrack) {
                        tmp = negConnTrack.settings.max;
                        negConnTrack.settings.max = 0;
                        negConnTrack.settings.min = 1;
                        negConnTrack.settings.minMaxReversed = true;
                    }
                }
            }
            if (options.popups) {
                options.popups.forEach(function (popup) {
                    heatMap.addPopup(popup);
                });
            }

            var updateQuickTools = function (tabId) {

                var $content = _this.$quickAccessWrapper.find('[data-name=content]');
                var $card = _this.$quickAccessWrapper.find('[data-name=card]');
                $card.children().detach(); // don't remove listeners
                $content.children().detach();
                var tabObject = tabId != null ? heatMap.getTabManager().getTabObject(tabId) : {};

                if (tabObject && tabObject.quickAccessWindow) {
                    tabObject.quickAccessWindow.$el.appendTo($content);
                    _this.$quickAccessWrapper.css('display', '');
                    if (tabObject.$card) {
                        tabObject.$card.appendTo($card);
                    }
                } else {
                    _this.$quickAccessWrapper.css('display', 'none');
                }

            };

            // update quick access toolbar when tab changes
            heatMap.getTabManager().on('change', function (e) {
                updateQuickTools(e.tab);
            });
            if (options.title) {
                heatMap.getTabManager().on('change rename', function (e) {
                    document.title = heatMap.getTabManager().getTabText(heatMap.getTabManager().getActiveTabId());
                });
                document.title = heatMap.getTabManager().getTabText(heatMap.getTabManager().getActiveTabId());
            }
            updateQuickTools(heatMap.getTabManager().getActiveTabId());

            if (options.dataType === clue.ICV.DataType.GUTC || options.dataType === clue.ICV.DataType.QUERY ||
                options.dataType === clue.ICV.DataType.GCP || options.dataType === clue.ICV.DataType.P100) {

                //sort only if the dataset is not a URL to a file
                if (options.dataset.state) {
                    var medianScoreName = 'median_score';
                    if (options.dataType === clue.ICV.DataType.GUTC) {
                        medianScoreName = 'median_tau_score';
                    }
                    var medianVector = heatMap.getProject().getFullDataset().getRowMetadata().getByName(medianScoreName);

                    if (medianVector && heatMap.getProject().getRowSortKeys().length === 0) {
                        heatMap.getProject().setRowSortKeys(
                            [
                                new morpheus.SortKey(medianScoreName,
                                    morpheus.SortKey.SortOrder.DESCENDING,
                                    false)], true);

                    }
                }
            }

            heatMap.getActionManager().execute('Filter');
            $('.modal').modal('hide');
        }

    };
    options = options || {};
    options = $.extend(
        true,
        {}, defaultOptions, options);
    var html = [
        '<div class="quickToolToggle" style="margin-top: 25px; box-shadow: 0 5px 15px' +
        ' rgba(0,0,0,.5); border: 1px solid rgba(0,0,0,.2); border-radius: 6px; padding:10px;' +
        ' z-index:999;position:fixed;top:50px;right:0px;background:white;">'];
    html.push('<p class="pull-right"><a name="quick"><i style="display:none;" data-name="open" class="fa fa-angle-double-left" aria-hidden="true"></i><i data-name="close"' +
        ' class="fa' +
        ' fa-times-circle-o"' +
        ' aria-hidden="true"></i></a></p>');
    html.push('<div data-name="offscreen-content">');
    html.push('<ul style="min-width: 225px;" class="nav nav-tabs" role="tablist">');

    var toolsId = _.uniqueId();
    var clueCardId = _.uniqueId();
    html.push('<li role="presentation" class="active"><a href="#' + toolsId + '" aria-controls="' + toolsId +
        '" role="tab" data-toggle="tab">Quick Tools</a></li>');
    html.push('<li role="presentation"><a href="#' + clueCardId + '" aria-controls="' + clueCardId +
        '" role="tab" data-toggle="tab">CLUE Card</a></li>');

    html.push('</ul>');
    html.push('<div class="tab-content">');

    html.push('<div id="' + toolsId + '" data-name="content" role="tabpanel" class="tab-pane active"' +
        ' id="' + toolsId + '"></div>'); // content is changed when tab selection changes
    html.push('<div style="width:365px;" data-name="card" role="tabpanel" class="tab-pane"' +
        ' id="' + clueCardId + '"></div>');

    html.push('</div>');
    html.push('</div>');
    html.push('</div>');

    //in data, there is a bug that duplicates this toggle
    //here, we check to see if one already exists, and if it does, it gets removed and a new one is created
    var toggleList = document.getElementById("vis").getElementsByClassName("quickToolToggle");
    if (toggleList && toggleList.length > 0) {
        for (var i = 0; i < toggleList.length; i++) {
            $(toggleList[i].remove());
        }
    }

    this.$quickAccessWrapper = $(html.join(''));
    this.$offscreenContent = this.$quickAccessWrapper.find('[data-name=offscreen-content]');
    if (options.dataType == null) {
        options.dataType = clue.ICV.DataType.GUTC;
    }

    if (options.colorScheme == null) {
        if (options.dataType === clue.ICV.DataType.GUTC) {
            options.colorScheme = clue.createGutcColorScheme();
        } else {
            options.colorScheme = clue.ICV.ProteomicsColorScheme;
        }
    }
    if (typeof options.columns === 'undefined') {
        if (options.dataType === clue.ICV.DataType.GCP || options.dataType === clue.ICV.DataType.P100) {
            options.columns = [
                {
                    field: 'name',
                    display: 'text'
                }, {
                    field: 'pert_id',
                    display: 'text'
                }, {
                    field: 'pert_time',
                    display: 'Text, highlight'
                }, {
                    field: 'cell_id',
                    display: 'Text, highlight'
                }];
        } else {
            options.columns = [
                {
                    field: 'pc',
                    display: 'stacked_bar',
                    title: 'The percent of total perturbagens, querying the column sample against all rows, that exceed the given thresholds',
                    order: 1
                }, {
                    field: 'pc_selection',
                    display: 'stacked_bar',
                    title: 'The percent of total perturbagens, querying the column sample against selected rows, that exceed the given thresholds',
                    order: 1
                }, {
                    field: 'cell_id',
                    display: 'Text, highlight',
                    order: 3
                }, {
                    field: 'query_cell_id',
                    display: 'Text, highlight',
                    order: 3
                }, {
                    field: 'name',
                    display: 'Text,highlight',
                    order: 4
                }, {
                    field: 'pert_idose',
                    display: 'Text,highlight',
                    order: 1
                }, {
                    field: 'type',
                    display: 'color',
                    order: 2
                }, {
                    field: 'tas',
                    display: 'text',
                    order: 2
                }, {
                    field: 'pert_2_iname',
                    display: 'Text,highlight'
                }, {
                    field: 'pert_2_idose',
                    display: 'Text,highlight'
                }];
        }
    }
    if (typeof options.rows === 'undefined') {
        options.showRowNumber = true;
        if (options.dataType === clue.ICV.DataType.GCP || options.dataType === clue.ICV.DataType.P100) {
            options.rows = [
                {
                    field: 'pert_iname',
                    display: 'Text, highlight'
                }, {
                    field: 'moa',
                    display: 'Text,highlight'
                }, {
                    field: 'cell_id',
                    display: 'Text, highlight'
                }];
        } else if (options.queryDataset && options.queryDataset != 'Touchstone') {
            //read the rows here if it exists
            options.rows = [
                {
                    field: 'pert_iname',
                    display: 'Text',
                    order: 1
                }, {
                    field: 'pert_id',
                    display: 'Text',
                    order: 2
                }, {
                    field: 'cell_id',
                    display: 'Text',
                    order: 3
                },
                {
                    field: 'pert_idose',
                    display: 'Text',
                    order: 4
                },
                {
                    field: 'pert_itime',
                    display: 'Text',
                    order: 5
                }];
        } else {
            options.rows = [
                {
                    field: 'type',
                    display: 'color',
                    order: 1
                }, {
                    field: 'name',
                    display: 'Text',
                    order: 2
                }, {
                    field: 'description',
                    display: 'Text',
                    order: 3
                }, {
                    field: 'cell_id',
                    display: 'Text, highlight',
                    order: 5
                }];
        }

    }

    if (!options.promises) {
        options.promises = [];
    }

    var createAnnotateLines = function (filename, isColumns) {
        var annotationPromise = morpheus.Util.readLines(filename);
        annotationPromise.then(function (lines) {
            if (isColumns) {
                clue.ICV.ANNOTATION_LINES_COLUMNS = lines;
            }
            else {
                clue.ICV.ANNOTATION_LINES_ROWS = lines;
            }
        });
        return annotationPromise;
    };
    if (options.annotate || options.annotateWithExternalFiles) {
        // if options.annotateWithExternalFiles.columns - read custom file
        var annotationPromise = null;
        var filename = null;
        if (options.annotateWithExternalFiles && options.annotateWithExternalFiles.columns) {
            filename = options.annotateWithExternalFiles.columns;
        }
        else {
            filename = (options.dataType === clue.ICV.DataType.GCP || options.dataType === clue.ICV.DataType.P100 ? clue.ICV.PROT_ANNOTATIONS : clue.ICV.ANNOTATIONS);
        }
        annotationPromise = createAnnotateLines(filename, true);
        options.promises.push(annotationPromise);

        // rows
        if (options.annotateWithExternalFiles && options.annotateWithExternalFiles.rows) {
            filename = options.annotateWithExternalFiles.rows;
        }
        else {
            filename = (options.dataType === clue.ICV.DataType.GCP || options.dataType === clue.ICV.DataType.P100 ? clue.ICV.PROT_ANNOTATIONS : clue.ICV.ANNOTATIONS);
        }
        annotationPromise = createAnnotateLines(filename, false);
        options.promises.push(annotationPromise);
        if (options.annotate && !(options.queryDataset && options.queryDataset != 'Touchstone')) {
            // get pcls and pert ids
            var api_version = options.api_version;
            var version = '';
            if (api_version != null) {
                version = '&version=' + api_version;
            }
            var p = $.ajax(clue.API_URL + '/api/pcls/?filter={"include":{"relation":"perts","scope":{"fields":["pert_id"]}}}' + version);
            p.done(function (results) {
                options.pcls = results;
            });
            options.promises.push(p);

            if (clue.ICV.CONN_SUMM == null) {
                var p = morpheus.Util.readLines('//s3.amazonaws.com/data.clue.io/ts_conn_summary.txt');
                options.promises.push(p);
                p.then(function (lines) {

                    clue.ICV.CONN_SUMM = new morpheus.Map();
                    // id pos_high pos_low neg_high neg_low
                    var tab = /\t/;
                    for (var i = 1, nlines = lines.length; i < nlines; i++) {
                        var tokens = lines[i].split(tab);
                        clue.ICV.CONN_SUMM.set(tokens[0], [
                            [parseFloat(tokens[2]), parseFloat(tokens[1])]]);
                    }
                });
            }

        }
        if (options.connecticons &&
            options.connecticons.file &&
            options.connecticons.row_match &&
            options.connecticons.col_match &&
            options.connecticons.row_match.table_field &&
            options.connecticons.col_match.table_field) {
            if (clue.ICV.CONNECTICONS == null) {
                var p = morpheus.Util.readLines(options.connecticons.file);
                options.promises.push(p);
                p.then(function (lines) {
                    clue.ICV.CONNECTICONS = new morpheus.Map();
                    // id pos_high pos_low neg_high neg_low
                    var tab = /\t/;

                    var row_field = options.connecticons.row_match.table_field;
                    var col_field = options.connecticons.col_match.table_field;

                    var headers = lines[0].split(tab);
                    if (headers.length >= 2) {

                        //Grab the index for the row and column
                        var row_Index = headers.indexOf(row_field);
                        var col_Index = headers.indexOf(col_field);
                        if (row_Index > -1 && col_Index > -1) { //The supplied TDT file must contain both row and column fields
                            for (var i = 1, nlines = lines.length; i < nlines; i++) {
                                var tokens = lines[i].split(tab);
                                var row_rid = tokens[row_Index].trim();

                                var array = clue.ICV.CONNECTICONS.get(row_rid) || [];
                                if (!_.isArray(array)) {
                                    array = [array];
                                }
                                array.push(tokens[col_Index].trim());
                                clue.ICV.CONNECTICONS.set(row_rid, array);
                            }
                        }
                    }
                });
            }
        }
    }


    options.landingPage = {
        show: function () {
            window.location.href = '/touchstone';
        }
    };


    if (options.dataType === clue.ICV.DataType.GUTC) {
        options.menu = {
            File: [
                'Open', null, 'Save Image', 'Save Dataset', 'Save Session',
                // 'Save Session to CLUE',
                null, 'Close Tab', null, 'Rename' +
                ' Tab'],
            Tools: [
                'New Heat Map',
                null,
                'Hierarchical Clustering',
                'KMeans Clustering',
                null,
                'Marker Selection',
                'Nearest Neighbors',
                'Create Calculated Annotation',
                null,
                'Adjust',
                'Collapse',
                'Similarity Matrix',
                'Transpose',
                null,
                'Chart',
                null,
                'Sort/Group',
                'Filter',
                null,
                'API'],
            View: ['Zoom In', 'Zoom Out', null, 'Fit To Window', 'Fit Rows To Window', 'Fit Columns To Window', null, '100%', null, 'Options'],
            Edit: [
                'Copy Image',
                'Copy Selected Dataset',
                null,
                'Move Selected Rows To Top',
                'Annotate Selected Rows',
                'Copy Selected Rows',
                'Invert' +
                ' Selected Rows',
                'Select All Rows',
                'Clear Selected Rows',
                null,
                'Move Selected Columns To Top',
                'Annotate Selected Columns',
                'Copy Selected Columns',
                'Invert' +
                ' Selected Columns',
                'Select All Columns',
                'Clear Selected Columns'],
            Help: [
                'ICV Tutorial', 'Search Menus', null, 'Contact', 'Configuration', 'Tutorial', 'Source Code', null, 'Keyboard' +
                ' Shortcuts']
        };
    }
    this.heatMap = new morpheus.HeatMap(options);
    this.heatMap.actionManager.add({
        name: 'ICV Tutorial',
        cb: function () {
            window
                .open('/icv-tutorial');
        }
    });
};

clue.ICV.ANNOTATIONS = '//s3.amazonaws.com/data.clue.io/pert_meta_v2.txt';
clue.ICV.PROT_ANNOTATIONS = '//s3.amazonaws.com/data.clue.io/psp/connectivities/latest/cmap_annotations.tsv';
clue.ICV.BASE_URL = '//s3.amazonaws.com/macchiato.clue.io/builds/touchstone/v1.1/arfs/';

clue.getOriginalURL = function (shortURL) {
    return $.ajax(clue.API_URL + '/api/shorty/decode?shorturl=' + shortURL);
}
clue.getQueryParams = function (cb) {
    var params = {};
    var urlSearchString = window.location.search.substring(1);
    if (!urlSearchString) {
        return cb(null, params);
    }
    //if this is a clue url then get the original url
    if (urlSearchString.includes("shorty")) {
        var search = decodeURIComponent(urlSearchString);
        var keyValuePairs = search.split('=');
        var shortURL = keyValuePairs[1];
        var impact = clue.getOriginalURL(shortURL);
        impact.done(function (originalURL) {
            //Get the original url
            keyValuePairs = originalURL.split('options=');
            var bb = JSON.parse(decodeURIComponent(keyValuePairs[1]));
            var dataset = bb.dataset;
            delete bb.dataset;
            var bar = [];
            bar.push("options=" + JSON.stringify(bb));
            for (var i = 0; i < bar.length; i++) {
                var pair = bar[i].split('=');
                if (pair[1] != null && pair[1] !== '') {
                    var array = params[pair[0]];
                    if (array === undefined) {
                        array = [];
                        params[pair[0]] = array;
                    }
                    array.push(pair[1]);
                }
            }
            var opt = JSON.parse(params.options);
            opt["dataset"] = dataset;
            params.options = [JSON.stringify(opt)];
            return cb(null, params);
        });
    } else {
        params = morpheus.Util.getWindowSearchObject();
        return cb(null, params);
    }
};
clue.ICV.fromParams = function () {
    clue.getQueryParams(function (err, queryString) {
        var options = {};
        var queryOptions = {};
        var parseOptionsDeferred;
        options.sessionLoaded = false;
        if (queryString.options != null) {
            options.sessionLoaded = true;
            // options can also be a URL
            if (queryString.options[0].indexOf('http') === 0) {
                parseOptionsDeferred = $.ajax({
                    url: queryString.options[0],
                    dataType: 'text'
                }).fail(function () {
                    console.log('Unable to parse options');
                }).done(function (json) {
                    queryOptions = JSON.parse(json.trim());
                });
            } else {
                queryOptions = JSON.parse(queryString.options[0]);
                parseOptionsDeferred = $.Deferred();
                parseOptionsDeferred.resolve();
            }
        } else {
            parseOptionsDeferred = $.Deferred();
            parseOptionsDeferred.resolve();
        }
        parseOptionsDeferred.always(function () {
            options = $.extend({}, options, queryOptions);
            clue.ICV._fromParams(queryString, options);
        });
    });
};
clue.ICV._fromParams = function (queryString, options) {

    if (queryString.version && queryString.version[0] === '1') {
        clue.ICV.BASE_URL = '//s3.amazonaws.com/data.clue.io/tsv2/digests/';

    }
    // merge query params with default params
    options.name = 'ICV';
    if (queryString.queryDataset) {
        options.queryDataset = queryString.queryDataset[0];
    }
    if (queryString.dataType) {

        if (queryString.dataType[0] === 'GCP' || queryString.dataType[0] === 'P100') {
            options.name = 'Touchstone-P ' + queryString.dataType[0];
        }
        else {
            options.name = queryString.dataType[0];
        }
    }
    if (queryString.name && queryString.name.length === 1) {
        options.name = options.name + ' - ' + queryString.name[0];
    }

    if (queryString['url[]']) {
        queryString.url = queryString['url[]'];
    }

    if (queryString.dataType || queryString.tool) {
        options.dataType = queryString.tool ? queryString.tool[0] : queryString.dataType[0];
    } else if (options.dataType == null) {
        options.dataType = clue.ICV.DataType.GUTC;
    }
    if (queryString.pert_id) {
        if (options.dataType === clue.ICV.DataType.INTROSPECT) {
            options.symmetric = true;
            options.dataset = morpheus.DatasetUtil.read(clue.API_URL + '/data-api/slice/?name=introspect_unmatched&rquery=pert_id:(' +
                queryString.pert_id.join(' ') + ')&cquery=pert_id:(' + queryString.pert_id.join(' ') + ')');
        } else {
            var urls = queryString.pert_id.map(function (id) {
                return clue.ICV.BASE_URL + id + '/';
            });
            options.name = queryString.pert_id.length > 1 ? queryString.pert_id.length + ' results' : queryString.pert_id[0];
            options.dataset = clue.getGutcResults({
                urls: urls,
                pclCell: options.pclCell,
                pclSummary: options.pclSummary
            });
        }
    } else if (queryString.url != null) {
        var urls = queryString.url;
        if (options.dataType === clue.ICV.DataType.GCP || options.dataType === clue.ICV.DataType.P100 || options.dataType === clue.ICV.DataType.QUERY) {
            var d = $.Deferred();
            options.dataset = d;
            var introspectDatasets = null;
            var inputDataset = null;
            options.renderReadyFunctions = [
                function (heatMap) {

                    introspectDatasets.forEach(function (ds) {
                        var name = null;
                        if (ds.seriesNames) {
                            name = ds.seriesNames[0];
                        }
                        new morpheus.HeatMap({
                            dataset: ds,
                            parent: heatMap,
                            inheritFromParent: false,
                            name: name,
                            colorScheme: clue.ICV.ProteomicsColorScheme
                        });
                    });
                    if (inputDataset != null) {
                        var name = null;
                        if (inputDataset.seriesNames && inputDataset.seriesNames.length === 1) {
                            name = inputDataset.seriesNames[0];
                        }
                        else {
                            name = 'Input - ' + options.dataType;
                        }
                        new morpheus.HeatMap({
                            rows: clue.ICV.ProteomicsInputMetadataFields[options.dataType].rows,
                            columns: clue.ICV.ProteomicsInputMetadataFields[options.dataType].columns,
                            dataset: inputDataset,
                            parent: heatMap,
                            inheritFromParent: false,
                            name: name,
                            colorScheme: clue.ICV.ProteomicsInputColorScheme
                        });
                    }
                    ;
                }];
            clue.getQueryResults({
                tool: 'sig_prot_query_tool',
                urls: urls
            }).done(function (result) {
                introspectDatasets = result.introspectDatasets;
                inputDataset = result.inputDataset;
                d.resolve(result.conn);
            });
        } else {
            urls = urls.map(function (url) {
                return decodeURI(url);
            });
            var index = queryString.index ? queryString.index[0] : null;
            var urlsStripped = urls.map(function (url) {
                var startString = 'sig_gutc_tool.';
                var startIdx = url.indexOf(startString) + startString.length;
                var endIdx = url.indexOf('/arfs/');
                return url.slice(startIdx, endIdx);
            });
            options.dataset = $.Deferred();
            if (options.queryDataset && options.queryDataset != 'Touchstone') {
                clue.ICV.getGutcOptionsFromBaseUrls(urls, urlsStripped, queryString).done(function (getResultsOptions) {
                    getResultsOptions.datasetName = options.queryDataset;
                    getResultsOptions.index = index;
                    clue.getSigQueryResults(getResultsOptions).done(function (ds) {
                        options.dataset.resolve(ds);
                    });
                })
                    .fail(function () {
                        console.log('Could not load index files from queries.')
                        options.dataset = null;
                    });
            }
            else {
                clue.ICV.getGutcOptionsFromBaseUrls(urls, urlsStripped, queryString).done(function (getResultsOptions) {
                    getResultsOptions.pclCell = options.pclCell;
                    getResultsOptions.pclSummary = options.pclSummary;
                    getResultsOptions.index = index;
                    clue.getGutcResults(getResultsOptions).done(function (ds) {
                        options.dataset.resolve(ds);
                    });
                })
                    .fail(function () {
                        console.log('Could not load index files from queries.')
                        options.dataset = null;
                    });
            }
        }
    } else if (queryString.dataset) {
        options.dataset = queryString.dataset.length === 1 ? queryString.dataset[0] : queryString.dataset;
        if (queryString.extension) {
            options.dataset = {
                file: options.dataset,
                options: {extension: queryString.extension[0]}
            };
        }
    } else if (queryString.files) { // local file upload
        var gutc = {};
        gutc.pert_id_summary = queryString.pert_id_summary ? queryString.pert_id_summary[0] : null;
        gutc.pert_id_cell = queryString.pert_id_cell ? queryString.pert_id_cell[0] : null;
        gutc.pcl_cell = queryString.pcl_cell ? queryString.pcl_cell[0] : null;
        gutc.pcl_summary = queryString.pcl_summary ? queryString.pcl_summary[0] : null;
        options.dataset = clue.getGutcResultByUrl(gutc);
    }
    if (queryString.version) {
        if (queryString.version[0] === '1') {
            options.api_version = '1';
        }
        else {
            options.api_version = '1.1';
        }
    } else {
        options.api_version = '1.1';
    }
    if (queryString.externalUserQuery) {
        if (Array.isArray(queryString.externalUserQuery) && queryString.externalUserQuery.indexOf('true') > -1) {
            options.externalUserQuery = true;
        }
    }
    if (options.dataset == null) {
        window.location.href = '/data?upload=1';
    } else {
        if (options.queryDataset) {
            const annotationFile = 'https://s3.amazonaws.com/macchiato.clue.io/builds/' + options.queryDataset + '/gutc_background/annot/data-app.json';
            var signedPromise = str8_cash.cache(annotationFile, {signurl: true});
            signedPromise.then(function (responseInstance) {
                var p = responseInstance.text();
                p.then(function (config) {
                    const options2 = JSON.parse(config.trim());
                    options = $.extend({}, options, options2);
                    new clue.ICV(options);
                }).catch(function(err){
                    new clue.ICV(options);
                });
            }).catch(function (err) {
                new clue.ICV(options);
            });
        } else {
            new clue.ICV(options);
        }
    }
}
;

clue.ICV.getGutcOptionsFromBaseUrls = function (baseUrls, urlsStripped, queryString) {
    var d = $.Deferred();
    var overrideData = {
        id: [],
        name: []
    };
    var promises = [];
    var urls = [];
    baseUrls.forEach(function (baseUrl, idx) {
        var p = clue.ICV.getUrlsFromBaseUrl(baseUrl);
        promises.push(p);
        p.done(function (results) {
            urls = urls.concat(results.urls);
            if (urlsStripped) {
                results.names.forEach(function (name) {
                    overrideData.id.push(urlsStripped[idx]);
                    if (results.names.length > 1) {
                        overrideData.name.push(name);
                    }
                    else {
                        overrideData.name.push(queryString.name[idx]);
                    }

                });
            }
        })
            .fail(function () {
                console.log('could not load index file ' + baseUrl);
            });
    });
    $.when.apply($, promises).then(function () {
        d.resolve({
            urls: urls,
            overrideColumns: overrideData
        });
    }).fail(function () {
        console.log('could not load all index files');
    });
    return d;
};

clue.ICV.getUrlsFromBaseUrl = function (baseUrl) {
    var d = $.Deferred();
    var arfs = [];
    var names = [];
    var p = morpheus.Util.readLines(clue.fixUrl(baseUrl) + '/index.txt');
    p.then(function (lines) {
        if (lines != null) {
            var tab = /\t/;
            var urlIndex = lines[0].split(tab).indexOf('url');
            for (var i = 1, nlines = lines.length; i < nlines; i++) {
                var tokens = lines[i].split(tab);
                arfs.push(baseUrl + '/' + tokens[urlIndex]);
                names.push(tokens[urlIndex]);
            }
        }
        d.resolve({
            urls: arfs,
            names: names
        });
    }).catch(function () {
        d.reject();
    });
    return d;
};

clue.ICV.prepareDataset = function (dataset, options) {
    var tool = options.dataType;

    if (dataset.getColumnMetadata().getByName('pert_iname') && !options.externalUserQuery) {
        dataset.getColumnMetadata().getByName('pert_iname').setName('name');
    }
    if (tool === clue.ICV.DataType.QUERY) {
        dataset.getRowMetadata().getByName('pert_iname').setName('name');
    } else {
        var byName = dataset.getColumnMetadata().getByName('_id');
        if (options.annotate || options.annotateWithExternalFiles) {
            // add name, type, description, target to rows and columns
            if (!options.externalUserQuery) {
                if (tool === clue.ICV.DataType.GUTC) {
                    // annotate columns
                    const opts = {};
                    opts.dataset = dataset;
                    opts.fileColumnNamesToInclude = null;
                    opts.lines = clue.ICV.ANNOTATION_LINES_COLUMNS;
                    opts.isColumns = true;
                    opts.sets = null;
                    opts.metadataName = byName ? '_id' : 'id';
                    opts.fileColumnName = 'pert_id';

                    new morpheus.OpenFileTool().annotate(opts);
                } else if (dataset.getColumnMetadata().getByName('pert_id') != null) {

                    const opts = {};
                    opts.dataset = dataset;
                    opts.fileColumnNamesToInclude = null;
                    opts.lines = clue.ICV.ANNOTATION_LINES_COLUMNS;
                    opts.isColumns = true;
                    opts.sets = null;
                    opts.metadataName = 'pert_id';
                    opts.fileColumnName = 'pert_id';

                    new morpheus.OpenFileTool().annotate(opts);
                }
            }
            const opts2 = {};
            opts2.dataset = dataset;
            opts2.fileColumnNamesToInclude = null;
            opts2.lines = clue.ICV.ANNOTATION_LINES_ROWS;
            opts2.isColumns = false;
            opts2.sets = null;
            if(options.dataType === clue.ICV.DataType.P100 || options.dataType === clue.ICV.DataType.GCP) {
                opts2.separator = ",";
            }
            opts2.metadataName = tool !== clue.ICV.DataType.GUTC ? 'pert_id' : 'id';
            opts2.fileColumnName = 'pert_id';
            new morpheus.OpenFileTool().annotate(opts2);
        }

        var doseVector = dataset.getColumnMetadata().getByName('pert_idose');
        if (doseVector) {
            for (var i = 0; i < doseVector.size(); i++) {
                doseVector.setValue(i, parseFloat(doseVector.getValue(i)));
            }
        }

        var pertNameVector = dataset.getRowMetadata().getByName('name');
        var idVector = dataset.getRowMetadata().getByName('id');
        if (options.annotate) {
            var cellVector = dataset.getRowMetadata().getByName('cell_id');
            var pertTypeVector = dataset.getRowMetadata().getByName('type');

            if (tool === clue.ICV.DataType.GUTC) {
                if (options.pcls) {
                    var pclIdToItem = new morpheus.Map();
                    options.pcls.forEach(function (pcl) {
                        pclIdToItem.set(pcl.group_id, pcl);
                    });
                    var columnIdToIndices = byName != null ? morpheus.VectorUtil.createValueToIndicesMap(byName) : new morpheus.Map();
                    var rowIdToIndex = morpheus.VectorUtil.createValueToIndexMap(idVector);
                    var pclRowVector = dataset.getRowMetadata().add('belongs_to');
                    pclRowVector.getProperties().set(morpheus.VectorKeys.DATA_TYPE,
                        '[string]');
                    var seriesIndex = morpheus.DatasetUtil.getSeriesIndex(dataset, 'PCL');
                    for (var i = 0, nrows = pertTypeVector.size(); i < nrows; i++) {
                        var pcl = pclIdToItem.get(idVector.getValue(i));
                        if (pcl != null) {
                            pertTypeVector.setValue(i, 'PCL');
                            pertNameVector.setValue(i, pcl.name);
                            for (var j = 0; j < pcl.perts.length; j++) {
                                var pclMemberRowIndex = rowIdToIndex.get(pcl.perts[j].pert_id);
                                if (pclMemberRowIndex !== undefined) {
                                    var array = pclRowVector.getValue(pclMemberRowIndex)
                                        || [];
                                    if (!_.isArray(array)) {
                                        array = [array];
                                    }
                                    array.push(pcl.name);
                                    pclRowVector.setValue(pclMemberRowIndex, array);
                                }
                                var columnIndices = columnIdToIndices.get(pcl.perts[j].pert_id);
                                if (columnIndices != null) {
                                    for (var k = 0; k < columnIndices.length; k++) {
                                        dataset.setValue(i, columnIndices[k], 1, seriesIndex);
                                    }
                                }
                            }
                        }
                    }
                }
                if (clue.ICV.CONNECTICONS) { //Handle generic display of yellow dots here
                    var tooltip_field = 'pert_iname';
                    if (options.connecticons.tooltip_field) {
                        tooltip_field = options.connecticons.tooltip_field;
                    }
                    var rowVector = dataset.getRowMetadata().getByName(options.connecticons.row_match.ds_field);
                    var columnMetadata = dataset.getColumnMetadata().getByName(options.connecticons.col_match.ds_field);
                    clue.ICV.CONNECTICON_VALUES = dataset.getRowMetadata().getByName(tooltip_field);

                    if (!clue.ICV.CONNECTICON_VALUES) {
                        clue.ICV.CONNECTICON_VALUES = new morpheus.Vector(tooltip_field, 0)
                    }
                    var columnIdToIndices = columnMetadata != null ? morpheus.VectorUtil.createValueToIndicesMap(columnMetadata) : new morpheus.Map();
                    var connecticonSeriesData = [];
                    var datasetCopy = morpheus.DatasetUtil.copy(dataset);
                    for (var j = 0, ncols = datasetCopy.getRowCount(); j < ncols; j++) {
                        connecticonSeriesData.push({});
                    }

                    dataset.addSeries({
                        name: tooltip_field,
                        dataType: 'string',
                        array: connecticonSeriesData
                    });
                    var seriesIndex = morpheus.DatasetUtil.getSeriesIndex(dataset, tooltip_field);
                    clue.ICV.CONNECTICON_MAP = new morpheus.Map();
                    if (seriesIndex > -1) {
                        for (var i = 0, nrows = rowVector.size(); i < nrows; i++) {
                            var cids = clue.ICV.CONNECTICONS.get(rowVector.getValue(i));
                            if (cids && cids.length > 0) {

                                for (var j = 0; j < cids.length; j++) {
                                    var columnIndices = columnIdToIndices.get(cids[j]);
                                    if (columnIndices != null) {
                                        for (var k = 0; k < columnIndices.length; k++) {
                                            var v = clue.ICV.CONNECTICON_VALUES.getValue(i);
                                            clue.ICV.CONNECTICON_MAP.set(v, i);
                                            dataset.setValue(i, columnIndices[k], v, seriesIndex);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    var arrayRegex = /\|/;
    // convert to array
    ['target', 'description'].forEach(function (name) {
        var v = dataset.getRowMetadata().getByName(name);
        if (v != null && morpheus.VectorUtil.getDataType(v) === 'string') {
            for (var i = 0, size = v.size(); i < size; i++) {
                var value = v.getValue(i);
                if (value != null && value !== 'N/A') {
                    v.setValue(i, value.split(arrayRegex));
                } else {
                    v.setValue(i, null);
                }
            }
            v.getProperties().set(morpheus.VectorKeys.DATA_TYPE,
                '[string]');
        }
    });

    ['xicon_pert_iname'].forEach(function (name) {
        var v = dataset.getColumnMetadata().getByName(name);
        if (v != null && morpheus.VectorUtil.getDataType(v) === 'string') {
            for (var i = 0, size = v.size(); i < size; i++) {
                var value = v.getValue(i);
                if (value != null && value !== 'N/A') {
                    v.setValue(i, value.split(arrayRegex));
                } else {
                    v.setValue(i, null);
                }
            }
            v.getProperties().set(morpheus.VectorKeys.DATA_TYPE,
                '[string]');
        }
    });
};

clue.ICV.connectivity = function (view, cutoffs, isNeg) {
    var totalCount = 0;
    var counts = [];
    for (var j = 0; j < cutoffs.length; j++) {
        counts.push(0);
    }

    for (var i = 0, size = view.size(); i < size; i++) {
        var value = view.getValue(i);
        if (!isNaN(value)) {
            for (var j = 0; j < cutoffs.length; j++) {
                if ((isNeg && value <= cutoffs[j])
                    || (!isNeg && value >= cutoffs[j])) {
                    counts[j]++;
                }
            }
            totalCount++;
        }

    }
    var array = counts.map(function (value) {
        return 100 * (value / totalCount);
    });
    return array;
};

clue.ICV.prototype = {};

clue.AddConnectivity = function (d, ranges) {
    if (ranges == null) {
        ranges = [95, 97.5];
    }
    var positiveVector = d.getRowMetadata().add('pc');
    positiveVector.getProperties().set(morpheus.VectorKeys.FIELDS,
        ranges.map(function (value) {
            return '% connections >= ' + value;
        }));
    positiveVector.getProperties().set(morpheus.VectorKeys.DATA_TYPE,
        '[number]');

    positiveVector.getProperties().set(morpheus.VectorKeys.RECOMPUTE_FUNCTION_NEW_HEAT_MAP,
        true);

    positiveVector.getProperties().set(morpheus.VectorKeys.FUNCTION, {
        binSize: 2.5,
        domain: [95, 100],
        cumulative: true,
        percent: true
    });
    morpheus.VectorUtil.jsonToFunction(positiveVector, morpheus.VectorKeys.FUNCTION);

};

clue.ICVQuickAccesss = function (heatMap) {
    var html = [];
    html.push('<form name="quick-tools">');
    var topBottomFilter;

    function createPertTypeValueToCount(typeVector, pclsVector) {
        var valueToCount = morpheus.VectorUtil.createValueToCountMap(typeVector);
        var keys = valueToCount.keys();
        if (keys.indexOf('PCL') !== -1) {
            var notNull = 0;
            for (var i = 0; i < pclsVector.size(); i++) {
                if (pclsVector.getValue(i) != null) {
                    notNull++;
                }
            }
            valueToCount.set('PCL members', notNull);
            keys = valueToCount.keys();
        }

        if (valueToCount.get('PCL members') === 0) {
            valueToCount.remove('PCL members');
        }
        var valueToUIValue = {
            CP: {
                order: 0,
                value: 'Compound'
            },
            KD: {
                order: 1,
                value: 'Gene Knock-Down'
            },
            OE: {
                order: 2,
                value: 'Gene Over-Expression'
            },
            PCL: {
                order: 3,
                value: 'Perturbational Class'
            },
            'PCL members': {
                order: 4,
                value: 'Perturbational Class Member'
            },
            CTRL: {
                order: 5,
                value: 'Control'
            }
        };
        keys.sort(function (key1, key2) {
            var a = valueToUIValue[key1];
            if (a !== undefined) {
                a = a.order;
            }
            var b = valueToUIValue[key2];
            if (b !== undefined) {
                b = b.order;
            }
            return (a === b ? 0 : (a < b ? -1 : 1));
        });
        // put controls at the end

        return {
            keys: keys.map(function (key) {
                return {
                    value: key,
                    uiValue: valueToUIValue[key] ? valueToUIValue[key].value : key
                };
            }),
            valueToCount: valueToCount
        };
    }

    var typeFilter = null;
    var typeVector = heatMap.getProject().getFullDataset().getRowMetadata().getByName('type');
    var pclsVector = heatMap.getProject().getFullDataset().getRowMetadata().getByName('belongs_to');
    if (typeVector != null && pclsVector != null) {
        typeFilter = createPertTypeValueToCount(typeVector, pclsVector);
        if (typeFilter.valueToCount.size() > 1) {
            var divId = _.uniqueId();
            html.push('<div><a role="button" data-toggle="collapse" href="#'
                + divId
                + '" aria-expanded="true" aria-controls="'
                + divId + '">Perturbagen Type</a></div>');
            html.push('<div name="typeFilter" class="collapse in" id="' + divId
                + '"></div>');
        }

    }

    // cell
    var cellVector = heatMap.getProject().getFullDataset().getColumnMetadata().getByName('cell_id');
    var cellVectorOnColumns = true;
    if (cellVector == null) {
        cellVector = heatMap.getProject().getFullDataset().getRowMetadata().getByName('cell_id');
        cellVectorOnColumns = false;
    }
    var cellFilter = null;

    if (cellVector != null) {
        var valueToCount = morpheus.VectorUtil.createValueToCountMap(cellVector);
        if (valueToCount.size() > 1) {
            var keys = valueToCount.keys();
            keys.sort();
            var divId = _.uniqueId();
            cellFilter = {
                keys: keys.map(function (key) {
                    return {value: key};
                }),
                valueToCount: valueToCount
            };

            html.push('<div><a role="button" data-toggle="collapse" href="#'
                + divId
                + '" aria-expanded="true" aria-controls="'
                + divId + '">Cell</a></div>');
            html.push('<div name="cellFilter" class="collapse in" id="' + divId
                + '"></div>');

        }
    }

    heatMap.options.median = true;
    if (heatMap.options.median && (heatMap.options.dataType === clue.ICV.DataType.GUTC ||
            heatMap.options.dataType === clue.ICV.DataType.GCP || heatMap.options.dataType === clue.ICV.DataType.P100)) {
        var colorScaleMax;
        var colorScaleMin;
        var valueToFraction;
        var fractions;
        var colors;
        if (heatMap.options.dataType === clue.ICV.DataType.GUTC) {
            colorScaleMax = 100;
            colorScaleMin = -100;
            valueToFraction = d3.scale.linear().range([0, 1]).domain([colorScaleMin, colorScaleMax]).clamp(true);
            var colorSchemeMap = clue.createGutcColorScheme();
            fractions = [];
            colors = [];
            colorSchemeMap.map.forEach(function (item) {
                fractions.push(valueToFraction(item.value));
                colors.push(item.color);
            });
        }
        else {
            colorScaleMax = 1;
            colorScaleMin = -1;
            valueToFraction = d3.scale.linear().range([0, 1]).domain([colorScaleMin, colorScaleMax]).clamp(true);
            fractions = clue.ICV.ProteomicsColorScheme.values.map(function (val) {
                return valueToFraction(val);
            });
            colors = clue.ICV.ProteomicsColorScheme.colors;
        }
        var medianScoreName = 'median_score';
        if (heatMap.options.dataType === clue.ICV.DataType.GUTC) {
            medianScoreName = 'median_tau_score';
        }
        var medianVector = heatMap.getProject().getFullDataset().getRowMetadata().add(medianScoreName);
        medianVector.getProperties().set(morpheus.VectorKeys.FUNCTION, morpheus.Median);
        var summaryFunction = morpheus.Median; //morpheus.MaxPercentiles([25, 75]);
        var view = new morpheus.DatasetRowView(heatMap.getProject().getFullDataset());
        for (var i = 0; i < medianVector.size(); i++) {
            medianVector.setValue(i, summaryFunction(view.setIndex(i)));
        }
        var colorScheme = heatMap.getProject().getRowColorModel().createContinuousColorMap(medianVector);
        colorScheme.setMax(colorScaleMax);
        colorScheme.setMin(colorScaleMin);
        colorScheme.setFractions({
            fractions: fractions,
            colors: colors
        });
        topBottomFilter = new morpheus.TopNFilter(heatMap.options.topConnections, morpheus.TopNFilter.TOP_BOTTOM, medianScoreName, false);
        heatMap.getProject().getRowFilter().add(topBottomFilter);
        heatMap.getProject().setRowFilter(heatMap.getProject().getRowFilter(), true);
        heatMap.getProject().on('columnFilterChanged', function (e) { // recompute the median in new
            // column space
            var dataset = new morpheus.SlicedDatasetView(heatMap.getProject().getFullDataset(), null,
                heatMap.getProject().getFilteredSortedColumnIndices());
            var view = new morpheus.DatasetRowView(dataset);
            heatMap.getProject().getFullDataset().getRowMetadata().add(medianScoreName);
            medianVector = dataset.getRowMetadata().getByName(medianScoreName);
            for (var i = 0; i < medianVector.size(); i++) {
                medianVector.setValue(i, summaryFunction(view.setIndex(i)));
            }
            heatMap.getProject().setRowFilter(heatMap.getProject().getRowFilter(), true);
            if (dataset.getColumnCount() > 1) {
                heatMap.addTrack(medianScoreName, false, {
                    discrete: false,
                    render: {
                        color: true,
                        text: true
                    }
                });
            } else {
                heatMap.removeTrack(medianScoreName, false);
            }
        });
    }

    if (heatMap.options.dataType === clue.ICV.DataType.GUTC && typeVector != null) {
        var valueToCount = morpheus.VectorUtil.createValueToCountMap(typeVector);
        var keys = valueToCount.keys();
        if (keys.indexOf('KD') !== -1 && keys.indexOf('OE') !== -1) {
            html.push('<div class="checkbox">');
            html.push('<label>');
            html.push('<input name="matchingGeneFilter" type="checkbox"> Strong Knock-Down/Over-Expression' +
                ' Pairs');
            html.push('</label>');
            html.push('</div>');
        }
    }

    // html.push('<div class="checkbox">');
    // html.push('<label>');
    // html.push('<input type="checkbox" name="showValues" /> Show Values');
    // html.push('</label>');
    // html.push('</div>');
    // html.push('Version: <a data-name="version" target="_blank" href="/version-data">');
    // if (heatMap.options.version) {
    //   html.push(heatMap.options.version);
    // }
    // html.push('</a></label>');
    // html.push('</div>');

    html.push('</form>');

    var $el = $(html.join(''));
    $el.on('submit', function (e) {
        e.preventDefault();
    });

    // if (!heatMap.options.version) {
    //   $.ajax(clue.API_URL + '/api/touchstone-version').done(function (result) {
    //     $el.find('[data-name="version"]').html(result.version);
    //   });
    // }
    if (cellFilter) {
        var cellFilterCheckBox = tablelegs.Table.createCheckBoxColumn({
            field: 'value',
            cssClass: '',
            resizable: true,
            exportLink: false,
            searchable: false,
            renderer: function (item, value) {
                return '<label><input data-tablelegs-toggle="true" type="checkbox" '
                    + (cellFilterCheckBox.set.has(value) ? ' checked' : '') + '/>' + ' ' + value + '<span> ('
                    + morpheus.Util.intFormat(cellFilter.valueToCount.get(value)) + ')</span></label>';
            }
        });
        cellFilterCheckBox.width = undefined;
        cellFilterCheckBox.maxWidth = undefined;
        cellFilterCheckBox.minWidth = undefined;
        var cellList = new tablelegs.Table({
            columnPicker: false,
            $el: $el.find('[name=cellFilter]'),
            fixedWidth: '160px',
            responsive: false,
            tableClass: 'filter-group',
            showHeader: false,
            export: false,
            search: false,
            select: false,
            autocomplete: false,
            columns: [cellFilterCheckBox],
            items: cellFilter.keys,
            height: cellFilter.keys.length <= 10 ? 'auto' : '176px'
        });

        var updateCellFilter = function () {
            var set = cellFilterCheckBox.set;
            var filters = cellVectorOnColumns ? heatMap.getProject().getColumnFilter().getFilters() : heatMap.getProject().getRowFilter().getFilters();
            var filter = null;
            for (var i = 0; i < filters.length; i++) {
                if (filters[i] instanceof morpheus.VectorFilter
                    && filters[i].name === 'cell_id') {
                    filter = filters[i];
                    break;
                }
            }
            if (filter == null) {
                filter = new morpheus.VectorFilter(set, -1, 'cell_id', cellVectorOnColumns);
                if (cellVectorOnColumns) {
                    heatMap.getProject().getColumnFilter().add(filter);
                } else {
                    heatMap.getProject().getRowFilter().add(filter);
                }
            }
            filter.setEnabled(true);
            filter.set = set;
            if (cellVectorOnColumns) {
                heatMap.getProject().setColumnFilter(heatMap.getProject().getColumnFilter(), true);
            } else {
                heatMap.getProject().setRowFilter(heatMap.getProject().getRowFilter(), true);
            }
        };

        cellList.on('checkBoxSelectionChanged', updateCellFilter);

    }
    if (typeFilter) {

        var filteredValueToCount = createPertTypeValueToCount(
            heatMap.getProject().getSortedFilteredDataset().getRowMetadata().getByName('type'),
            heatMap.getProject().getSortedFilteredDataset().getRowMetadata().getByName('belongs_to')).valueToCount;
        var typeFilterCheckBox = tablelegs.Table.createCheckBoxColumn({
            field: 'value',
            cssClass: '',
            resizable: true,
            exportLink: false,
            searchable: false,
            renderer: function (item, value) {
                return '<label><input data-tablelegs-toggle="true" type="checkbox" '
                    + (typeFilterCheckBox.set.has(value) ? ' checked' : '') + '/>' + ' ' + item.uiValue + '<span> ('
                    + morpheus.Util.intFormat(filteredValueToCount.get(value) || 0) + '/' +
                    morpheus.Util.intFormat(typeFilter.valueToCount.get(value)) + ')</span></label>';
            }
        });

        typeFilterCheckBox.width = undefined;
        typeFilterCheckBox.maxWidth = undefined;
        typeFilterCheckBox.minWidth = undefined;
        var typeList = new tablelegs.Table({
            columnPicker: false,
            $el: $el.find('[name=typeFilter]'),
            tableClass: 'filter-group',
            showHeader: false,
            fixedWidth: '270px',
            responsive: false,
            export: false,
            search: false,
            select: false,
            autocomplete: false,
            columns: [typeFilterCheckBox],
            items: typeFilter.keys,
            height: typeFilter.keys.length <= 10 ? 'auto' : '176px'
        });

        heatMap.getProject().on('rowFilterChanged', function (e) {
            filteredValueToCount = createPertTypeValueToCount(heatMap.getProject().getSortedFilteredDataset().getRowMetadata().getByName('type'),
                heatMap.getProject().getSortedFilteredDataset().getRowMetadata().getByName('belongs_to')).valueToCount;
            typeList.redraw();
        });

        var updateTypeFilter = function () {
            var typeSet = new morpheus.Set();
            var pclMembers = false;
            var set = typeFilterCheckBox.set;
            set.forEach(function (val) {
                if (val === 'PCL members') { // NOTE this is
                    // handled specially
                    pclMembers = true;
                } else {
                    typeSet.add(val);
                }
            });
            var index = heatMap.getProject().getRowFilter().indexOf('type',
                morpheus.CombinedFilter);
            var filter;
            if (index === -1) {
                filter = new morpheus.CombinedFilter(false);
                filter.name = 'type';
                filter.add(new morpheus.VectorFilter(new morpheus.Set(), -1,
                    'type', false));
                filter.add(new morpheus.NotNullFilter('belongs_to', false));
                heatMap.getProject().getRowFilter().add(filter);
            } else {
                filter = heatMap.getProject().getRowFilter().getFilters()[index];
            }

            filter.getFilters()[filter.indexOf('type', morpheus.VectorFilter)].set = typeSet;
            filter.getFilters()[filter.indexOf('belongs_to', morpheus.NotNullFilter)].setEnabled(pclMembers);
            heatMap.getProject().setRowFilter(
                heatMap.getProject().getRowFilter(), true);

        };

        typeList.on('checkBoxSelectionChanged', updateTypeFilter);
    }
    this.$el = $el;
    if (heatMap.options.cellFilter) {
        heatMap.options.cellFilter.forEach(function (cell) {
            cellFilterCheckBox.set.add(cell);
        });
        cellList.redraw();
        updateCellFilter();
        cellList.trigger('checkBoxSelectionChanged');

    }

    function selfConnectivity(isSelectedColumns) {
        var columnFieldTosMatchOn = ['name', 'xicon_pert_iname'];
        var rowFieldsToSearch = ['name', 'pert_iname']; // 'moa', 'description', 'target',
        // 'gene_targets'
        var dataset;
        if (isSelectedColumns) {
            dataset = new morpheus.SlicedDatasetView(heatMap.getProject().getFullDataset(), null,
                heatMap.getProject().getColumnSelectionModel().toModelIndices());
        } else {
            dataset = new morpheus.TransposedDatasetView(new morpheus.SlicedDatasetView(heatMap.getProject().getFullDataset(),
                heatMap.getProject().getRowSelectionModel().toModelIndices(),
                null));
        }

        var matchingIndices = [];
        var nseries = dataset.getSeriesCount();
        // find matching row indices for selected columns

        for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {

            var found = false;
            for (var seriesIndex = 1; seriesIndex < nseries; seriesIndex++) {
                for (var j = 0, ncols = dataset.getColumnCount(); j < ncols; j++) {
                    if (dataset.getValue(i, j, seriesIndex)) {
                        found = true;
                        break;
                    }
                }
            }

            if (found) {
                matchingIndices.push({
                    i: i,
                    v: morpheus.Mean(new morpheus.DatasetRowView(dataset).setIndex(i))
                });
            }
        }

        if (matchingIndices.length === 0) {
            morpheus.FormBuilder.showMessageModal({
                title: 'Self-Connectivity',
                html: 'No matching perturbagens found on ' + (isSelectedColumns ? 'rows' : 'columns') + '.'
            });
        } else {
            // sort by value
            matchingIndices.sort(function (o1, o2) {
                var a = o1.v;
                var b = o2.v;
                return (a === b ? 0 : (a < b ? 1 : -1));
            });

            if (isSelectedColumns) {
                heatMap.getProject().setRowSortKeys([
                    new morpheus.MatchesOnTopSortKey(heatMap.getProject(), matchingIndices.map(function (obj) {
                        return obj.i;
                    }), 'self-connectivity')], true);
            } else {
                heatMap.getProject().setColumnSortKeys([
                    new morpheus.MatchesOnTopSortKey(heatMap.getProject(), matchingIndices.map(function (obj) {
                        return obj.i;
                    }), 'self-connectivity')], true);
            }
            var viewIndices = new morpheus.Set();
            var project = heatMap.getProject();
            for (var i = 0, length = matchingIndices.length; i < length; i++) {
                var viewIndex = isSelectedColumns
                    ? project.convertModelRowIndexToView(matchingIndices[i].i)
                    : project.convertModelColumnIndexToView(matchingIndices[i].i);
                if (viewIndex !== -1) {
                    viewIndices.add(viewIndex);
                }
            }
            if (isSelectedColumns) {
                heatMap.getProject().getRowSelectionModel().setViewIndices(viewIndices, true);
                heatMap.scrollTop(0);
            } else {
                heatMap.getProject().getColumnSelectionModel().setViewIndices(viewIndices, true);
                heatMap.scrollLeft(0);
            }
        }
    }

    var posCutoff = 97.5;
    var negCutoff = -97.5;

    var $matchingGeneFilter = $el.find('[name=matchingGeneFilter]');

    function updateMatchingGeneFilter() {
        var matchingGeneFilterIndex = heatMap.getProject().getRowFilter().indexOf('KD/OE pairs');
        var matchingGeneFilter = matchingGeneFilterIndex !== -1 ? heatMap.getProject().getRowFilter().get(matchingGeneFilterIndex)
            : null;
        var isChecked = false;
        if ($matchingGeneFilter.prop('checked')) {
            isChecked = true;
            if (matchingGeneFilter == null) {
                var pertNameVector = heatMap.getProject().getFullDataset().getRowMetadata().getByName('name');
                var pertTypeVector = heatMap.getProject().getFullDataset().getRowMetadata().getByName('type');
                if (pertTypeVector == null) {
                    return morpheus.FormBuilder.showMessageModal({
                        title: 'Error',
                        html: 'Perturbagen type not found.'
                    });

                }
                var kds = [];
                var oeToIndex = new morpheus.Map();
                for (var i = 0, size = pertTypeVector.size(); i < size; i++) {
                    var pertType = pertTypeVector.getValue(i);
                    if (pertType === 'KD') {
                        kds.push({
                            name: pertNameVector.getValue(i),
                            index: i
                        });

                    } else if (pertType === 'OE') {
                        oeToIndex.set(pertNameVector.getValue(i), i);

                    }
                }
                var matchingIndices = new morpheus.Set();
                var dataset = heatMap.getProject().getFullDataset();
                for (var i = 0, length = kds.length; i < length; i++) {
                    var oeIndex = oeToIndex.get(kds[i].name);
                    if (oeIndex !== undefined) {
                        var kdIndex = kds[i].index;
                        for (var j = 0, ncols = dataset.getColumnCount(); j < ncols; j++) {
                            if (Math.abs(dataset.getValue(kdIndex, j) > 90
                                    && Math.abs(dataset.getValue(oeIndex, j)) > 90)) {
                                matchingIndices.add(kdIndex);
                                matchingIndices.add(oeIndex);
                                break;
                            }
                        }
                    }
                }

                matchingGeneFilter = new morpheus.IndexFilter(matchingIndices,
                    'KD/OE pairs', false);
                heatMap.getProject().getRowFilter().add(matchingGeneFilter);
            }
            matchingGeneFilter.setEnabled(true);
        } else {
            if (matchingGeneFilter) {
                matchingGeneFilter.setEnabled(false);
            }
        }
        heatMap.getProject().setRowFilter(heatMap.getProject().getRowFilter(),
            true);
        if (isChecked) {
            heatMap.getProject().setRowSortKeys(
                [
                    new morpheus.SortKey('name',
                        morpheus.SortKey.SortOrder.ASCENDING),
                    new morpheus.SortKey('type',
                        morpheus.SortKey.SortOrder.ASCENDING)],
                true);
        }

    }

    this.$el = $el;
    $matchingGeneFilter.on('click', function (e) {
        updateMatchingGeneFilter();
    });
    var $drawValues = $el.find('[name=showValues]');
    if (heatMap.options.drawValues) {
        $drawValues.prop('checked', true);
    }
    $drawValues.on('change', function () {
        if ($drawValues.prop('checked')) {
            heatMap.getHeatMapElementComponent().getRowPositions().setSize(17);
            heatMap.getHeatMapElementComponent().getColumnPositions().setSize(80);
            heatMap.getHeatMapElementComponent().setDrawValues(true);
            heatMap.revalidate();
        } else {
            heatMap.getHeatMapElementComponent().getRowPositions().setSize(13);
            heatMap.getHeatMapElementComponent().getColumnPositions().setSize(13);
            heatMap.getHeatMapElementComponent().setDrawValues(false);
            heatMap.revalidate();
        }
    });

};

clue.ICV.DataType = {
    INTROSPECT: 'introspect',
    QUERY: 'sig_query_tool',
    GCP: 'GCP',
    P100: 'P100',
    GUTC: 'L1000'
};

clue.ICVQuickAccesss.prototype = {};

clue.ICV.fixIntrospectMetadata = function (metadata) {
    var idVector = metadata.getByName('id');
    for (var i = 0, size = idVector.size(); i < size; i++) {
        var id = idVector.getValue(i);
        var index = id.lastIndexOf(':');
        if (index !== -1) {
            idVector.setValue(i, id.substring(0, index));

        }
    }
};

clue.ICV.ProteomicsColorScheme = {
    scalingMode: 'fixed',
    values: [-1, -0.5, 0.5, 1],
    colors: ['blue', 'white', 'white', 'red']
};
clue.ICV.ProteomicsInputColorScheme = {
    scalingMode: 'fixed',
    values: [-2, -0, 0, 2],
    colors: ['blue', 'white', 'white', 'red']
};
clue.ICV.ProteomicsInputMetadataFields = {
    GCP: {
        rows: [
            {
                field: 'pr_gcp_histone_mark',
                display: 'text'
            }
        ],
        columns: [
            {
                field: 'name',
                display: 'text'
            },
            {
                field: 'pert_iname',
                display: 'text'
            },
            {
                field: 'cell_id',
                display: 'text'
            }
        ]
    },
    P100: {
        rows: [
            {
                field: 'pr_gene_symbol',
                display: 'text'
            },
            {
                field: 'pr_p100_phosphosite',
                display: 'text'
            }
        ],
        columns: [
            {
                field: 'name',
                display: 'text'
            },
            {
                field: 'pert_iname',
                display: 'text'
            },
            {
                field: 'cell_id',
                display: 'text'
            }
        ]
    }
};
