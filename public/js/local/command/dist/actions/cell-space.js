exports.show = function(options) {
    exports.changeTabHeader(options.object);
    var d = $.Deferred();
    var filter = {
        // fields: ['cell_iname'],
        // include: ['cell_lineage', 'cell_icollection']
    };
    if (options.ids.length > 0) {
        filter.where = {
            or: [{cell_iname: {inq: options.ids}}, {cell_icollection: {inq: options.ids}}]
        };
    }
    var p = $.ajax(clue.API_URL + '/api/cells/?filter=' + JSON.stringify(filter));
    p.done(function (results) {
        if (results.length === 0) {
            return d.reject('No cell lines found');
        }
        d.resolve();
        var $chart = $('<div class="col-xs-12"></div>');
        var $table = $('<div class="col-xs-12"></div>');
        $chart.appendTo(options.$el);
        $table.appendTo(options.$el);

        var columns = [
            {
                field: 'cell_iname',
                name: 'Name'
            }, {
                field: 'cell_lineage',
                name: 'Lineage',
                getter: function (item) {
                    // array of {name:value}
                    return item.cell_lineage.map(function (value) {
                        return value.name;
                    });
                }
            }, {
                name: 'Collection',
                field: 'cell_icollection',
                getter: function (item) {
                    // array of {name:value}
                    return item.cell_icollection.map(function (value) {
                        return value.name;
                    });
                }
            }];

        // var xValue = ['landmark', 'best inferred', 'inferred', 'not inferred'];
        // var typeToCount = new morpheus.Map();
        // xValue.forEach(function (key) {
        //   typeToCount.set(key, 0);
        // });
        //
        // var yValue = [];
        // for (var i = 0, length = results.length; i < length; i++) {
        //   var item = results[i];
        //   typeToCount.set(item.l1000_type, typeToCount.get(item.l1000_type) + 1);
        // }
        //
        // xValue.forEach(function (key) {
        //   yValue.push(typeToCount.get(key));
        // });
        // var total = 0;
        // yValue.forEach(function (val) {
        //   total += val;
        // });
        // var x = ['Landmark (lm)', 'Best inferred (bing)', 'Inferred (aig)', 'Not inferred (ni)'];
        // var trace = {
        //   x: x,
        //   y: yValue,
        //   type: 'bar'
        // };
        //
        // var annotationContent = [];
        // var plotly = clue.getPlotlyDefaults2();
        // plotly.layout.xaxis.showgrid = false;
        // plotly.layout.xaxis.showline = false;
        //
        // plotly.layout.annotations = annotationContent;
        // plotly.layout.width = 500;
        // plotly.layout.height = 130;
        // plotly.layout.yaxis.showgrid = false;
        // plotly.layout.yaxis.zeroline = false;
        // plotly.layout.yaxis.showline = false;
        // plotly.layout.yaxis.autotick = true;
        // plotly.layout.yaxis.ticks = '';
        // plotly.layout.yaxis.showticklabels = false;
        // for (var i = 0; i < xValue.length; i++) {
        //   var result = {
        //     x: x[i],
        //     y: yValue[i],
        //     text: morpheus.Util.intFormat(yValue[i]),
        //     xanchor: 'center',
        //     yanchor: 'bottom',
        //     showarrow: false
        //   };
        //   annotationContent.push(result);
        // }
        //
        // plotly.layout.margin.t = 4;
        // plotly.config.displayModeBar = false;
        // Plotly.newPlot($chart[0], [trace], plotly.layout, plotly.config);
        var table = new tablelegs.Table({
            height: '412px',
            columnPicker: false,
            tableClass: 'slick-table slick-bordered-table slick-hover-table',
            select: true,
            search: true,
            export: true,
            exportFileName: options.object.truncatedCommand + '.txt',
            $el: $table,
            columns: columns,
            items: results
        });
    });
    p.fail(function (err) {
        d.reject(err);
    });
    return d;

};

exports.changeTabHeader = function(tabObject) {
    $('#headerButtonRow').hide();
    $('#inputInterpretationDropdown').hide();
};