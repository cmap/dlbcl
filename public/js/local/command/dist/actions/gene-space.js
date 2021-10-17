function executeExport(table,$el) {
  $el.find('.export-warning').html('');
  var inputType = $el.find('input[name="exportType"]:checked').val();
  var fileName = $el.find('.export-filename-prompt').val();
  fileName = fileName ? fileName : 'command_output';

  if(!inputType) {
    $el.find('.export-warning').html('No option selected');
  }
  else {
    if (!morpheus.Util.endsWith(fileName.toLowerCase(), '.txt')) {
      fileName += '.txt';
    }
    var blob = new Blob([table.toText()], {
      type: "text/plain;charset=utf-8"
    });
    saveAs(blob, fileName, true);
    $el.find('.export-modal').modal('hide');
  }
}
function setupExportOptions(object) {
  var $el = object.$el;
  $el.find('.command-out-links').show();
  var $exportOptions = $el.find('.export-options');
  var exportOptionsHtml = '<input type="radio" name="exportType" value="0" class="export-radio">' +
    'Export the data as a tab-delimited text file</input><br>';
  $exportOptions.html(exportOptionsHtml);
  $el.find('.export-btn-confirm').on('click',{table:object.table, $el: object.$el},function(e) {
    executeExport(object.table, $el);
  });
  $el.find('.export-btn-cancel').on('click',{object:object},function(e) {
    e.data.object.$el.find('.export-modal').modal('hide');
  });
  $el.find('.export-btn').on('click',{$el:object.$el},function(e) {
    e.data.$el.find('.export-warning').html('');
    e.data.$el.find('.export-pending').html('');
  });
}

function setupHeader(object) {
    setupExportOptions(object);
}

exports.show = function(options) {
    var ids = options.ids;
    var idToSearchTerms = options.idToSearchTerms;
    var $el = options.$el;
    var d = $.Deferred();
    // split into batches of 5000
    var results = [];
    var promises = [];
    if (ids.length === 0) {
        promises.push($.ajax(clue.API_URL + '/api/genes/?filter=' + JSON.stringify({
                fields: [
                    'entrez_id',
                    'gene_symbol',
                    'gene_name',
                    'gene_family',
                    'l1000_type',
                    'rna_seq_corr',
                    'rna_seq_corr_fraction_self_rank']
            })).done(function (geneResults) {
            results = geneResults;
        }));
    } else {
        var start = 0;
        var batchSize = 5000;
        var end = batchSize;
        while (start < ids.length) {
            promises.push($.ajax(clue.API_URL + '/api/genes/?filter=' + JSON.stringify({
                    fields: [
                        'entrez_id',
                        'gene_symbol',
                        'gene_name',
                        'gene_family',
                        'l1000_type',
                        'rna_seq_corr',
                        'rna_seq_corr_fraction_self_rank'], where: {
                        entrez_id: {inq: ids.slice(start, Math.min(end, ids.length))}
                    }
                })).done(function (geneResults) {
                results = results.concat(geneResults);
            }));
            start = end;
            end += batchSize;
        }

    }
    $.when.apply($, promises).fail(function () {
        d.reject();
    }).done(function () {

        var $chart = $('<div class="col-xs-12"></div>');
        var $table = $('<div class="col-xs-12"></div>');
        $chart.appendTo(options.$el);
        $table.appendTo(options.$el);
        var columns = [
            {
                field: 'entrez_id',
                name: 'Entrez ID'
            }, {
                field: 'gene_symbol',
                name: 'Symbol'
            }, {
                field: 'gene_name',
                name: 'Name'
            }, {
                field: 'gene_family',
                name: 'Gene Family'
            }, {
                name: 'Type',
                field: 'l1000_type'
            }];
        var xValue = ['landmark', 'best inferred', 'inferred', 'not inferred'];
        var typeToCount = new morpheus.Map();
        xValue.forEach(function (key) {
            typeToCount.set(key, 0);
        });
        var yValue = [];
        for (var i = 0, length = results.length; i < length; i++) {
            var item = results[i];
            typeToCount.set(item.l1000_type, typeToCount.get(item.l1000_type) + 1);
        }
        if (typeToCount.get('landmark') > 0 || typeToCount.get('best inferred') > 0 ||
            typeToCount.get('inferred') > 0) {
            columns = columns.concat([
                {
                    name: 'RNA-Seq Correlation',
                    field: 'rna_seq_corr'
                }, {
                    name: 'RNA-Seq Correlation Self-Rank',
                    field: 'rna_seq_corr_fraction_self_rank'
                }]);
        }
        xValue.forEach(function (key) {
            yValue.push(typeToCount.get(key));
        });
        var total = 0;
        yValue.forEach(function (val) {
            total += val;
        });
        var x = ['Landmark (lm)', 'Best inferred (bing)', 'Inferred (aig)', 'Not inferred (ni)'];
        var trace = {
            x: x,
            y: yValue,
            type: 'bar'
            // text: yValue.map(function (val) {
            //   return 100 * morpheus.Util.nf(val / total) + '%';
            // })
        };

        var annotationContent = [];
        var plotly = clue.getPlotlyDefaults2();
        plotly.layout.xaxis.showgrid = false;
        plotly.layout.xaxis.showline = false;

        plotly.layout.annotations = annotationContent;
        plotly.layout.width = 500;
        plotly.layout.height = 130;
        plotly.layout.yaxis.showgrid = false;
        plotly.layout.yaxis.zeroline = false;
        plotly.layout.yaxis.showline = false;
        plotly.layout.yaxis.autotick = true;
        plotly.layout.yaxis.ticks = '';
        plotly.layout.yaxis.showticklabels = false;
        for (var i = 0; i < xValue.length; i++) {
            var result = {
                x: x[i],
                y: yValue[i],
                text: morpheus.Util.intFormat(yValue[i]),
                xanchor: 'center',
                yanchor: 'bottom',
                showarrow: false
            };
            annotationContent.push(result);
        }

        plotly.layout.margin.t = 4;
        plotly.config.displayModeBar = false;
        d.resolve();
        Plotly.newPlot($chart[0], [trace], plotly.layout, plotly.config);
        options.object.table = new tablelegs.Table({
            height: '412px',
            columnPicker: false,
            tableClass: 'slick-table slick-bordered-table slick-hover-table',
            select: true,
            search: true,
            export: false,
            exportFileName: options.object.truncatedCommand + '.txt',
            $el: $table,
            columns: columns,
            items: results
        });
        setupHeader(options.object);
    });
};