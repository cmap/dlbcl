// currently doesn't work on dev.clue.io
exports.show = function(options) {
    exports.changeTabHeader(options.object);
    var xaxisPclIds = [options.ids[0]];

    var yaxisPclIds = options.ids.slice(1);
    var allPclIds = xaxisPclIds.concat(yaxisPclIds);
    var $div = $('<div><div data-name="legend"></div><div' +
        ' style="display:inline-block" data-name="chart"></div><div' +
        ' style="display:inline-block;width:880px;" data-name="table"></div></div>');
    $div.appendTo(options.$el);
    var $plot = $div.find('[data-name=chart]');
    var $table = $div.find('[data-name=table]');
    var $legend = $div.find('[data-name=legend]');

    var colorScheme = new morpheus.HeatMapColorScheme(new morpheus.Project(new morpheus.Dataset({
        rows: 1,
        columns: 1
    })), {
        type: 'fixed',
        map: [
            {
                value: 0,
                color: '#deebf7'
            }, {
                value: 0.8,
                color: '#deebf7'
            }, {
                value: 0.9,
                color: '#9ecae1'
            }, {
                value: 1,
                color: '#3182bd'
            }]
    });

    var p = morpheus.DatasetUtil.read(clue.API_URL +
        '/data-api/slice/?name=pcl_summary&cfield=pert_id&cfield=pert_iname&cfield=class_selectivity&rfield=pert_id&cquery=pert_collection:(TS)&rquery=pert_id:(' +
        allPclIds.join(' ') + ')').done(function (dataset) {
        // x axis is connectivity to PCL, y axis is selectivity
// rows are pcls, columns are perts

        var pertCollection = dataset.getColumnMetadata().getByName('pert_collection');
        var columnIndices = [];

        if (dataset.getRowCount() <= 1) {
            return $el.html('Not all PCLs found.');
        }
        var fullClassSelectivity = dataset.getColumnMetadata().getByName('class_selectivity');
        var tmp = {
            getRowCount: function () {
                return fullClassSelectivity.size();
            },
            getColumnCount: function () {
                return 1;
            },
            getValue: function (rowIndex, columnIndex) {
                return fullClassSelectivity.getValue(rowIndex);
            },
            getRowMetadata: function () {
                return new morpheus.MetadataModel(fullClassSelectivity.size());
            }
        };

        var legend = new morpheus.HistogramLegend(tmp, colorScheme, null);
        legend.setName('Class Selectivity Legend');
        legend.setBinSize(0.05);
        legend.repaint();
        $('<h6>Connectivity to ' + xaxisPclIds.join(', ') + ' vs. ' + (yaxisPclIds.length === 1 ? '' : 'maximum ') +
            'connectivity to ' + yaxisPclIds.join(', ') + '. Color shows perturbagen class selectivity.</h6>').appendTo($legend);

        $legend.append($(legend.canvas));
        var pclIdToIndexMap = morpheus.VectorUtil.createValueToIndexMap(
            dataset.getRowMetadata().getByName('pert_id'));
        var xIndices = [];
        xaxisPclIds.forEach(function (id) {
            xIndices.push(pclIdToIndexMap.get(id));
        });
        var yIndices = [];
        yaxisPclIds.forEach(function (id) {
            yIndices.push(pclIdToIndexMap.get(id));
        });

        var xaxisDataset = new morpheus.SlicedDatasetView(dataset, xIndices, null);
        var yaxisDataset = new morpheus.SlicedDatasetView(dataset, yIndices, null);

        var traces = [];
        var selectivityVector = xaxisDataset.getColumnMetadata().getByName('class_selectivity');
        var pertIdVector = xaxisDataset.getColumnMetadata().getByName('pert_id');
        var pertNameVector = xaxisDataset.getColumnMetadata().getByName('pert_iname');

        var trace = {
            mode: 'markers',
            type: 'scatter',
            x: [],
            marker: {
                size: 4,
                symbol: 'circle-open',
                color: []
            },
            y: [],
            text: []
            // hoverinfo: 'text'
        };
        traces.push(trace);
        var min = Number.MAX_VALUE;
        var max = -Number.MAX_VALUE;
        var pertIdToIndex = new morpheus.Map();
        for (var j = 0, ncols = xaxisDataset.getColumnCount(); j < ncols; j++) {
            // compute max across all rows
            var xmax = -Number.MAX_VALUE;

            for (var i = 0, nrows = xaxisDataset.getRowCount(); i < nrows; i++) {
                xmax = Math.max(xmax, xaxisDataset.getValue(i, j));
            }
            var ymax = -Number.MAX_VALUE;
            for (var i = 0, nrows = yaxisDataset.getRowCount(); i < nrows; i++) {
                ymax = Math.max(ymax, yaxisDataset.getValue(i, j));
            }
            pertIdToIndex.set(pertIdVector.getValue(j), j);
            trace.x.push(xmax);
            trace.y.push(ymax);

            trace.text.push(pertNameVector.getValue(j) + ', ' + pertIdVector.getValue(j) + ', selectivity: ' +
                morpheus.Util.nf(selectivityVector.getValue(j)));
            trace.marker.color.push(colorScheme.getColor(0, 0, selectivityVector.getValue(j)));
            //  }
        }
        // filter and highlight by target, moa, pert name, pert_type, x, y, selectivity
        // fixed color by selectivity
        var correlation = morpheus.Spearman(morpheus.VectorUtil.arrayAsVector(trace.x),
            morpheus.VectorUtil.arrayAsVector(trace.y));
        var table;
        var filteredIds;
        var allResults;
        $.ajax(clue.API_URL + '/api/perts?filter=' + JSON.stringify({
                fields: ['pert_id', 'pert_iname', 'pert_type', 'target', 'moa'],
                where: {
                    pert_icollection: touchstoneColl
                }
            })).done(function (results) {
            allResults = results;

            table = new tablelegs.Table({
                height: '412px',
                columnPicker: true,
                tableClass: 'slick-table slick-bordered-table slick-hover-table',
                select: true,
                search: true,
                export: true,
                rowHeight: 18,
                $el: $table,
                columns: [
                    {
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
                        field: 'pert_id',
                        name: 'Perturbagen Id'
                    }, {
                        field: 'target',
                        name: 'Target'
                    }, {
                        field: 'moa',
                        name: 'MOA'
                    }],
                items: allResults
            });
            table.on('selectionChanged', function (e) {
                var selectedRows = e.selectedRows;
                if (selectedRows == null || selectedRows.length === 0) {
                    Plotly.Fx.hover($plot[0], []);
                } else {
                    var points = [];
                    selectedRows.forEach(function (row) {
                        var item = table.getItems()[row];
                        points.push({
                            curveNumber: 0,
                            pointNumber: pertIdToIndex.get(item.pert_id)
                        });
                    });
                    Plotly.Fx.hover($plot[0], points);
                }
            });
            var tableFilter = {
                isEmpty: function () {
                    return filteredIds == null;
                },
                init: function () {

                },
                accept: function (item) {
                    return filteredIds.has(item.pert_id);
                }
            };
            // add the facet filters to the table filter
            table.getFilter().add(tableFilter);
            table.refilter();
        });
        var plotly = clue.getPlotlyDefaults2();
        // plotly.layout.xaxis.range = [79, 101];
        plotly.layout.xaxis.title = xaxisPclIds.join(', ');
        plotly.layout.title = 'Spearman ' + morpheus.Util.nf(correlation);
        // plotly.layout.yaxis.range = [79, 101];
        var yaxisPcls = morpheus.VectorUtil.getValues(yaxisDataset.getRowMetadata().getByName('pert_id'));
        plotly.layout.yaxis.title = yaxisPcls.length === 1 ? yaxisPcls[0] : 'Max of ' +
            ' ' + yaxisPcls.join(', ');
        plotly.layout.dragmode = 'select';
        plotly.layout.shapes = [
            {
                type: 'line',
                x0: -110,
                y0: -100,
                x1: 100,
                y1: 100,
                line: {
                    color: 'LightGrey',
                    width: 1,
                    dash: 'longdash'
                }
            }];
        Plotly.plot($plot[0], traces, plotly.layout, plotly.config);

        $plot[0].on('plotly_selected', function (data) {
            filteredIds = null;
            if (data != null) {
                filteredIds = new morpheus.Set();
                var points = data.points;
                for (var i = 0; i < points.length; i++) {
                    var id = pertIdVector.getValue(points[i].pointNumber);
                    filteredIds.add(id);
                }
            }
            if (table != null) {
                table.refilter();
            }

        });
    }).fail(function (err) {
        $vis.html('Unexpected error. Please try again.');
    });

};

exports.changeTabHeader = function(tabObject) {
    $('#headerButtonRow').hide();
    $('#inputInterpretationDropdown').hide();
};