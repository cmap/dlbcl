exports.show = function(options) {
    exports.changeTabHeader(options.object);
    var utils = require('Shared/utils.js');
    var ids = options.ids;
    var $div = $('<div class="col-xs-12"><div data-name="header"></div><div' +
        ' data-name="vis"></div></div>');
    var $heatMap = $div.find('[data-name=vis]');
    var p = $.ajax(clue.API_URL + '/api/perts?filter=' + JSON.stringify({
            fields: ['pert_id', 'tas', 'target', 'moa', 'cell_tas', 'pert_iname', 'pert_type'],
            where: {pert_id: {inq: ids}}
        }));
    $div.appendTo(options.$el);
    p.done(function (results) {
        // create a cell by pert matrix
        var cellIdToIndex = new morpheus.Map();
        var cellLines = ['Summary'].concat(clue.CORE_CELL_LINES);
        for (var j = 0; j < cellLines.length; j++) {
            cellIdToIndex.set(cellLines[j], j);
        }
        var matrix = [];
        var ncols = cellIdToIndex.size();
        var pertIds = [];
        var pertNames = [];
        var pertTypes = [];
        var targets = [];
        var moas = [];
        for (var i = 0; i < results.length; i++) {
            var result = results[i];

            pertIds.push(result.pert_id);
            pertNames.push(result.pert_iname);
            pertTypes.push(result.pert_type);
            targets.push(result.target);
            moas.push(result.moa);
            var matrixRow = new Float32Array(ncols);
            for (var j = 0; j < ncols; j++) {
                matrixRow[i] = NaN;
            }
            matrixRow[0] = result.tas;
            for (var j = 0, ncells = result.cell_tas.length; j < ncells; j++) {
                var cellTas = result.cell_tas[j];
                var columnIndex = cellIdToIndex.get(cellTas.cell_id);
                if (columnIndex === undefined) {
                    continue;
                }
                matrixRow[columnIndex] = cellTas.tas;
            }

            matrix.push(matrixRow);
        }
        var dataset = new morpheus.Dataset({
            name: 'TAS',
            array: matrix,
            dataType: 'Float32',
            rows: matrix.length,
            columns: matrix[0].length
        });
        dataset.getRowMetadata().add('id').array = pertIds;
        dataset.getRowMetadata().add('name').array = pertNames;
        dataset.getRowMetadata().add('type').array = pertTypes;
        dataset.getRowMetadata().add('moa').array = moas;
        dataset.getRowMetadata().add('target').array = targets;
        dataset.getColumnMetadata().add('id').array = cellLines;

        new morpheus.HeatMap({
            toolbar: utils.quickMorpheusToolbar(),
            menu: null,
            autohideTabBar: true,
            popupEnabled: true,
            el: $heatMap,
            dataset: dataset,
            rows: [
                {
                    field: 'name',
                    display: 'text'
                }, {
                    field: 'type',
                    display: 'color'
                }, {
                    field: 'target',
                    display: 'text'
                }, {
                    field: 'moa',
                    display: 'text'
                }, {
                    field: 'id',
                    display: 'text'
                }],
            renderReady: function (heatMap) {
                var legend = new morpheus.HistogramLegend(heatMap.getProject().getFullDataset(),
                    heatMap.getHeatMapElementComponent().getColorScheme(), null);
                legend.setName('Legend');
                legend.setBinSize(0.1);
                legend.repaint();
                $(legend.canvas).appendTo($div.find('[data-name=header]'));
            },
            colorScheme: {
                type: 'fixed',
                map: [
                    {
                        value: 0,
                        color: 'white'
                    }, {
                        value: 0.2,
                        color: 'white'
                    },
                    {
                        value: 1,
                        color: 'green'
                    }]
            }
        });

    }).fail(function () {
        tryAgain();
    });
};

exports.changeTabHeader = function(tabObject) {
    $('#headerButtonRow').hide();
    $('#inputInterpretationDropdown').hide();
};