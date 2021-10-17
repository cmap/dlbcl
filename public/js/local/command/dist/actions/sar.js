exports.show = function(options) {
    exports.changeTabHeader(options.object);
    var introspectData = require('Shared/introspectData.js');
    var utils = require('Shared/utils.js');

    var ids = options.ids;
    var $div = $('<div class="col-xs-12"><h6>The lower diagonal contains structural' +
        ' similarity, the upper diagonal transcriptional similarity. Double-click' +
        ' the columns to sort by transcriptional similarity. Double-click the rows to' +
        ' sort by structural similarity.</h6><div' +
        ' data-name="input"></div><div' +
        ' data-name="header"></div><div' +
        ' style="position:relative;"><div' +
        ' style="vertical-align:top;" data-name="vis"></div><div' +
        ' data-name="images"' +
        ' style="position:absolute;top:20px;right:0;width:250px;"></div></div><div' +
        ' data-name="footer"></div></div>');
    var $heatMap = $div.find('[data-name=vis]');
    var formBuilder = new morpheus.FormBuilder({formStyle: 'vertical'});
    formBuilder.append({
        type: 'bootstrap-select',
        name: 'cell_line',
        options: ['Summary'].concat(clue.CORE_CELL_LINES),
        value: 'Summary',
        showLabel: true
    });
    formBuilder.append({
        type: 'bootstrap-select',
        name: 'fingerprint',
        options: [
            {
                name: 'Daylight',
                value: 'tanimoto_daylight'
            }, {
                name: 'Extended Connectivity Fingerprint (Diameter 2)',
                value: 'tanimoto_ecfp2'
            }, {
                name: 'Extended Connectivity Fingerprint (Diameter 4)',
                value: 'tanimoto_ecfp4'
            }],
        value: 'tanimoto_daylight',
        showLabel: true
    });
    var $header = $div.find('[data-name=header]');
    var $images = $div.find('[data-name=images]');
    var $footer = $div.find('[data-name=footer]');
    $footer.css({
        'padding-top': '20px',
        'width': '800px'
    });
    formBuilder.$form.appendTo($div.find('[data-name=input]'));
    formBuilder.$form.find('.bootstrap-select').css('max-width', '200px');
    var $introspectCellLine = formBuilder.find('cell_line');
    var $fingerprint = formBuilder.find('fingerprint');
    var fingerprint = $fingerprint.val();
    var cellLine = $introspectCellLine.val();
    $div.appendTo(options.$el);
    var tanimotoDataset;
    var annotations;
    var firstTime = true;
    var introspectDataset;
    var hasIntrospectData;

    function redraw() {
        var newCellLine = $introspectCellLine.val();
        if (newCellLine !== cellLine) {
            cellLine = newCellLine;
            introspectDataset = null;
        }
        var newFingerprint = $fingerprint.val();
        if (newFingerprint !== fingerprint) {
            fingerprint = newFingerprint;
            tanimotoDataset = null;
        }
        var promises = [];

        if (firstTime) {
            firstTime = false;
            promises.push($.ajax(clue.API_URL + '/api/perts/?filter=' + JSON.stringify({
                    fields: ['pert_id', 'pert_iname', 'target', 'moa', 'tas', 'cell_tas'],
                    where: {pert_id: {inq: ids}}
                })).done(function (results) {
                annotations = results;
                var footer = [];
                footer.push('<div class="grid-stack grid-stack-4">');
                var row = 0;
                var col = 0;
                for (var i = 0; i < annotations.length; i++) {
                    footer.push('<div class="grid-stack-item" style="border:1px solid lightgray;"  data-gs-y="' + row +
                        '"  data-gs-x="' + col + '"  data-gs-width="1"' +
                        '  data-gs-height="1">');
                    var name = annotations[i].pert_iname;
                    footer.push('<div class="grid-stack-item-content">' + name +
                        '<img class="img-responsive" src="https://s3.amazonaws.com/data.clue.io/trimmed_perts/' +
                        annotations[i].pert_id + '.png"></div>');
                    footer.push('</div>');
                    col++;
                    if (col === 4) {
                        row++;
                        col = 0;
                    }
                }
                footer.push('</div>');
                $footer.html(footer.join(''));

                $footer.find('.grid-stack').gridstack({
                    cellHeight: '250px',
                    verticalMargin: 6,
                    disableResize: true,
                    width: 4
                });
            }));
        }
        if (tanimotoDataset == null) {
            var p = getTanimoto(ids, newFingerprint);
            promises.push(p);
            p.done(function (dataset) {
                tanimotoDataset = dataset;
                for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
                    tanimotoDataset.setValue(i, i, 0); // diagonal
                }
            });
        }
        if (introspectDataset == null) {
            introspectDataset = new morpheus.Dataset({
                rows: 0,
                columns: 0
            });
            var introspectDef = $.Deferred();
            introspectData.get({
                rowIds: ids,
                columnIds: ids,
                cellLine: cellLine,
                symmetric: true
            }).done(function (ds) {
                hasIntrospectData = true;
                introspectDataset = ds;
            }).always(function () {
                introspectDef.resolve();
            });
            promises.push(introspectDef);
        }
        var deferred = $.Deferred();
        var introspectSeriesIndex;
        var tanimotoSeriesIndex = 0;
        $.when.apply($, promises).done(function () {
            var introspectIdToIndex = hasIntrospectData ? morpheus.VectorUtil.createValueToIndexMap(
                introspectDataset.getRowMetadata().getByName('id')) : new morpheus.Map();
            var tanimotoIdToIndex = morpheus.VectorUtil.createValueToIndexMap(
                tanimotoDataset.getRowMetadata().getByName('id'));
            // upper diagonal is tanimoto, lower diagonal is connectivity

            var copy = new morpheus.Dataset({
                rows: ids.length,
                columns: ids.length,
                dataType: 'object'
            });
            tanimotoSeriesIndex = copy.addSeries({name: 'Tanimoto'});
            introspectSeriesIndex = copy.addSeries({name: 'Introspect'});
            for (var i = 0; i < copy.getRowCount(); i++) {
                // diagonal
                copy.setValue(i, i, NaN);
                copy.setValue(i, i, NaN, tanimotoSeriesIndex);
                copy.setValue(i, i, NaN, introspectSeriesIndex);
            }

            copy.getRowMetadata().add('id').array = ids;
            copy.getColumnMetadata().add('id').array = ids;

            for (var i = 1; i < copy.getRowCount(); i++) {
                var introspectIndex1 = introspectIdToIndex.get(ids[i]);
                var tanimotoIndex1 = tanimotoIdToIndex.get(ids[i]);
                for (var j = 0; j < i; j++) {
                    var introspectIndex2 = introspectIdToIndex.get(ids[j]);
                    var tanimotoIndex2 = tanimotoIdToIndex.get(ids[j]);
                    var introspectValue = introspectIndex1 !== undefined && introspectIndex2 !== undefined
                        ? introspectDataset.getValue(introspectIndex1, introspectIndex2)
                        : NaN;
                    var tanimotoValue = tanimotoIndex1 !== undefined && tanimotoIndex2 !== undefined
                        ? tanimotoDataset.getValue(tanimotoIndex1, tanimotoIndex2)
                        : NaN;
                    var introspectObject = new Number(introspectValue);
                    introspectObject.tanimoto = tanimotoValue;
                    introspectObject.introspect = introspectValue;

                    var tanimotoObject = new Number(tanimotoValue);
                    tanimotoObject.tanimoto = tanimotoValue;
                    tanimotoObject.introspect = introspectValue;
                    copy.setValue(i, j, tanimotoObject);
                    copy.setValue(j, i, introspectObject);
                    copy.setValue(i, j, introspectValue, introspectSeriesIndex);
                    copy.setValue(j, i, introspectValue, introspectSeriesIndex);
                    copy.setValue(i, j, tanimotoValue, tanimotoSeriesIndex);
                    copy.setValue(j, i, tanimotoValue, tanimotoSeriesIndex);
                }
            }

            if (annotations != null) {
                annotateDataset({
                    dataset: copy,
                    fields: [
                        {
                            key: 'pert_iname',
                            value: 'name'
                        }, {
                            key: 'moa',
                            value: 'moa'
                        }, {
                            key: 'target',
                            value: 'target'
                        }, {
                            key: createTasGetter(cellLine),
                            value: 'tas'
                        }],
                    results: annotations,
                    columns: false
                });
                annotateDataset({
                    dataset: copy,
                    fields: [
                        {
                            key: 'pert_iname',
                            value: 'name'
                        }],
                    results: annotations,
                    columns: true
                });

                function addMissingNames(metadata) {
                    var nameVector = metadata.getByName('name');
                    var idVector = metadata.getByName('id');
                    for (var i = 0, size = nameVector.size(); i < size; i++) {
                        if (nameVector.getValue(i) == null) {
                            nameVector.setValue(i, idVector.getValue(i));
                        }
                    }
                }

                addMissingNames(copy.getRowMetadata());
                addMissingNames(copy.getColumnMetadata());
            }
            var medianTanimoto = copy.getColumnMetadata().add('tanimoto_median');
            var view = new morpheus.DatasetColumnView(new morpheus.DatasetSeriesView(copy, [tanimotoSeriesIndex]));
            for (var i = 0; i < medianTanimoto.size(); i++) {
                medianTanimoto.setValue(i, morpheus.Median(view.setIndex(i)));
            }

            if (hasIntrospectData) {
                var medianIntrospect = copy.getRowMetadata().add('introspect_median');
                var view = new morpheus.DatasetRowView(new morpheus.DatasetSeriesView(copy, [introspectSeriesIndex]));
                for (var i = 0; i < medianIntrospect.size(); i++) {
                    medianIntrospect.setValue(i, morpheus.Median(view.setIndex(i)));
                }
            }
            // cluster by tanimoto
            var hcl = new morpheus.HCluster(
                morpheus.HCluster.computeDistanceMatrix(new morpheus.DatasetSeriesView(copy, [tanimotoSeriesIndex]), 1),
                morpheus.AverageLinkage);
            deferred.resolve(new morpheus.SlicedDatasetView(copy, hcl.order, hcl.order));
        });

        var tanimotoColorScheme = new morpheus.HeatMapColorScheme(new morpheus.Project(new morpheus.Dataset({
            rows: 1,
            columns: 1
        })), {
            type: 'fixed',
            map: [
                {
                    value: 0,
                    color: 'white'
                }, {
                    value: 0.7,
                    color: 'white'
                }, {
                    value: 1,
                    color: 'green'
                }]
        });
        var introspectColorScheme = new morpheus.HeatMapColorScheme(new morpheus.Project(new morpheus.Dataset({
            rows: 1,
            columns: 1
        })), clue.createGutcColorScheme());

        $heatMap.empty();
        new morpheus.HeatMap({
            colorScheme: clue.createGutcColorScheme(),
            toolbar: utils.quickMorpheusToolbar(),
            menu: null,
            autohideTabBar: true,
            popupEnabled: true,
            el: $heatMap,
            dataset: deferred,
            tooltipSeriesIndices: [tanimotoSeriesIndex, introspectSeriesIndex],
            name: '2-D Tanimoto Structural Similarity',
            rows: [
                {
                    field: 'introspect_median',
                    display: 'bar',
                    max: 100
                }, {
                    field: 'name',
                    display: 'text'
                }, {
                    field: 'moa',
                    display: 'text'
                }, {
                    field: 'target',
                    display: 'text'
                }, {
                    field: 'tas',
                    display: 'bar'
                }],
            columns: [
                {
                    field: 'name',
                    display: 'text'
                }, {
                    field: 'tanimoto_median',
                    display: 'bar',
                    max: 1

                }, {
                    field: 'tas',
                    display: 'bar'
                }],
            renderReady: function (heatMap) {
                $heatMap.find('[data-toggle=buttons]').remove();
                $heatMap.find('input:visible:first').css({
                    'border-top': '',
                    'border-bottom': ''
                });
                heatMap.getProject().getFullDataset().getRowMetadata().add('xxx').setValue(0, 'Tanimoto');
                heatMap.getHeatMapElementComponent().getColorScheme().setSeparateColorSchemeForRowMetadataField('xxx');
                heatMap.getHeatMapElementComponent().getColorScheme().setCurrentValue('Tanimoto');
                heatMap.getHeatMapElementComponent().getColorScheme().setColorSupplierForCurrentValue(tanimotoColorScheme);
                heatMap.getHeatMapElementComponent().getColorScheme().setCurrentValue(null);
                heatMap.getHeatMapElementComponent().getColorScheme().setColorSupplierForCurrentValue(introspectColorScheme);

                heatMap.getHeatMapElementComponent().getColorScheme().getColor = function (row, column, val) {
                    if (val == null) {
                        return 'Gray';
                    }
                    if (row < column) {
                        return introspectColorScheme.getColor(0, 0, val.introspect);
                    } else if (row > column) {
                        return tanimotoColorScheme.getColor(0, 0, val.tanimoto);
                    } else {
                        return 'LightGrey';
                    }
                };
                var oldSetRowSortKeys = heatMap.getProject().setRowSortKeys;
                // double-click on columns to sort rows by introspect
                heatMap.getProject().setRowSortKeys = function (keys, notify) {
                    var newKeys = [];
                    keys.forEach(function (key) {
                        if (key instanceof morpheus.SortByValuesKey) {
                            var comparator = key.getComparator();
                            var dataset = heatMap.getProject().getFullDataset();
                            dataset = key.isColumns() ? new morpheus.TransposedDatasetView(dataset) : dataset;
                            dataset = new morpheus.DatasetSeriesView(dataset, [introspectSeriesIndex]);
                            var indices = morpheus.Util.sequ32(dataset.getRowCount());
                            key.init(dataset, indices);
                            indices.sort(function (index1, index2) {
                                var a = +key.getValue(index1);
                                var b = +key.getValue(index2);
                                var aNaN = isNaN(a);
                                var bNaN = isNaN(b);

                                if (aNaN && bNaN) {
                                    return 0;
                                }
                                if (aNaN) {
                                    return 1;
                                }
                                if (bNaN) {
                                    return -1;
                                }
                                return (a === b ? 0 : (a < b ? 1 : -1));
                            });

                            key = new morpheus.SpecifiedModelSortOrder(indices, indices.length, key.toString(), false);
                        }
                        newKeys.push(key);
                    });
                    oldSetRowSortKeys.apply(this, [newKeys, notify]);
                };
                var oldSetColumnSortKeys = heatMap.getProject().setColumnSortKeys;
                // double-click on rows to sort columns by tanimoto
                heatMap.getProject().setColumnSortKeys = function (keys, notify) {
                    var newKeys = [];
                    keys.forEach(function (key) {
                        if (key instanceof morpheus.SortByValuesKey) {
                            var comparator = key.getComparator();
                            var dataset = heatMap.getProject().getFullDataset();
                            dataset = key.isColumns() ? new morpheus.TransposedDatasetView(dataset) : dataset;
                            dataset = new morpheus.DatasetSeriesView(dataset, [tanimotoSeriesIndex]);
                            var indices = morpheus.Util.sequ32(dataset.getRowCount());
                            key.init(dataset, indices);
                            indices.sort(function (index1, index2) {
                                var a = +key.getValue(index1);
                                var b = +key.getValue(index2);
                                var aNaN = isNaN(a);
                                var bNaN = isNaN(b);
                                if (aNaN && bNaN) {
                                    return 0;
                                }
                                if (aNaN) {
                                    return 1;
                                }
                                if (bNaN) {
                                    return -1;
                                }
                                return (a === b ? 0 : (a < b ? 1 : -1));
                            });
                            key = new morpheus.SpecifiedModelSortOrder(indices, indices.length, key.toString(), true);
                        }
                        newKeys.push(key);
                    });

                    oldSetColumnSortKeys.apply(this, [newKeys, notify]);

                };

                var tanimotoLegend = new morpheus.HistogramLegend(
                    new morpheus.DatasetSeriesView(heatMap.getProject().getFullDataset(), [tanimotoSeriesIndex]),
                    tanimotoColorScheme, null);
                tanimotoLegend.setName('Structural Similarity (Tanimoto)');
                tanimotoLegend.setBinSize(0.1);
                tanimotoLegend.repaint();

                var introspectLegend = new morpheus.HistogramLegend(
                    new morpheus.DatasetSeriesView(heatMap.getProject().getFullDataset(), [introspectSeriesIndex]),
                    introspectColorScheme, null);
                introspectLegend.setName('Transcriptional Similarity (Introspect)');
                introspectLegend.setBinSize(5);
                introspectLegend.repaint();

                $header.empty();
                $(tanimotoLegend.canvas).appendTo($header);
                if (hasIntrospectData) {
                    $(introspectLegend.canvas).appendTo($header);
                }
                heatMap.on('change', function (e) {
                    if (e.name === 'setMousePosition') {
                        var d = heatMap.getProject().getSortedFilteredDataset();
                        var html = [];
                        var hoverColumnIndex = heatMap.getProject().getHoverColumnIndex();
                        var hoverRowIndex = heatMap.getProject().getHoverRowIndex();
                        var columnId;

                        if (hoverColumnIndex !== -1) {
                            var pertNameVector = d.getColumnMetadata().getByName('name');
                            var pertIdVector = d.getColumnMetadata().getByName('id');
                            columnId = pertIdVector.getValue(hoverColumnIndex);
                            var str = pertNameVector != null ? pertNameVector.getValue(hoverColumnIndex) : '';
                            if (str !== columnId) {
                                str += ', ' + columnId;
                            }
                            html.push('<div style="width:250px;height:250px;overflow-y:auto;border:1px' +
                                ' solid' +
                                ' lightgray;' +
                                ' display:inline-block;">' + str + '<img' +
                                ' class="img-responsive"' +
                                ' src="https://s3.amazonaws.com/data.clue.io/trimmed_perts/' + columnId + '.png"></div>');
                        }

                        if (hoverRowIndex !== -1) {
                            var pertNameVector = d.getRowMetadata().getByName('name');
                            var pertIdVector = d.getRowMetadata().getByName('id');
                            var rowId = pertIdVector.getValue(hoverRowIndex);
                            if (columnId !== rowId) {
                                var str = pertNameVector != null ? pertNameVector.getValue(hoverRowIndex) : '';
                                if (str !== rowId) {
                                    str += ', ' + rowId;
                                }
                                html.push('<div style="width:250px;height:250px;overflow-y:auto;border:1px' +
                                    ' solid' +
                                    ' lightgray;' +
                                    ' display:inline-block;">' + str + '<img' +
                                    ' class="img-responsive"' +
                                    ' src="https://s3.amazonaws.com/data.clue.io/trimmed_perts/' + rowId + '.png"></div>');
                            }
                        }

                        $images.html(html.join(''));
                    }
                });

            },
            symmetric: true
        });

    }

    $introspectCellLine.on('change', function () {
        redraw();
    });
    $fingerprint.on('change', function () {
        redraw();
    });

    redraw();

}

function createTasGetter(cellLine) {
    var tasGetter;
    if (cellLine == null || cellLine.toLowerCase() === 'summary') {
        tasGetter = function (t) {
            if (t == null) {
                return null;
            }
            return t.tas;
        };
    } else {
        tasGetter = function (t) {
            if (t == null) {
                return null;
            }
            for (var i = 0; i < t.cell_tas.length; i++) {
                if (t.cell_tas[i].cell_id === cellLine) {
                    return t.cell_tas[i].tas;
                }
            }
        };
    }
    return tasGetter;
}

function getTanimoto(ids, name) {
    var p = morpheus.DatasetUtil.read(
        clue.API_URL + '/data-api/slice/?name=' + name + '&rfield=id&cfield=id&rquery=id:(' + ids.join(' ') +
        ')&cquery=id:(' + ids.join(' ') + ')');
    return p;
}

/**
 *
 * @param options.dataset
 * @param options.fields
 * @param options.results
 */
function annotateDataset(options) {
    var ids = [];
    var dataset = options.columns ? new morpheus.TransposedDatasetView(options.dataset) : options.dataset;
    var idVector = dataset.getRowMetadata().getByName('id');
    for (var i = 0, size = idVector.size(); i < size; i++) {
        ids.push(idVector.getValue(i));
    }
    var fields = options.fields;
    var nfields = options.fields.length;
    var results = options.results;

    var vectors = [];
    var idToIndex = morpheus.VectorUtil.createValueToIndexMap(idVector);
    for (var j = 0; j < nfields; j++) {
        vectors.push(dataset.getRowMetadata().add(options.fields[j].value));
    }
    for (var i = 0, nresults = results.length; i < nresults; i++) {
        var item = results[i];
        var index = idToIndex.get(item.pert_id);
        if (index !== undefined) {
            var id = item.pert_id;
            for (var j = 0; j < nfields; j++) {
                var value = _.isString(fields[j].key) ? item[fields[j].key] : fields[j].key(item);
                vectors[j].setValue(index, value);
            }
        }
    }
}

exports.changeTabHeader = function(tabObject) {
    $('#headerButtonRow').hide();
    $('#inputInterpretationDropdown').hide();
};