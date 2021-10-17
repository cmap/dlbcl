var colorMap;
var nf = d3.format('.1f');

// not currently working on dev.clue.io
exports.show = function (options) {
    options.dataset = {
      label: 'L1000 normalized',
      zscore: 'Primary Site',
      columnAnnotations: [
        { // map cell_id to ccle_id
          file: 'https://s3.amazonaws.com/data.clue.io/cell/cell-mapping.tsv',
          datasetField: 'cell_id',
          fileField: 'cell_id'
        }, {
          file: 'https://s3.amazonaws.com/data.clue.io/cell/cell_app.tsv',
          datasetField: 'ccle_id',
          fileField: 'CCLE Name'
        }],
      featureField: 'pr_gene_symbol',
      datasetReady: function (ds) {
        clue.Gex.fixCcleDataset(ds);
      },
      dataset: morpheus.DatasetUtil.read(clue.API_URL +
        '/data-api/slice/?name=clinedb_QNORM&cfield=cell_id&cfield=id&cfield=cell_lineage&rfield=pr_gene_symbol&rquery=id:(' +
        options.ids.join(' ') + ')')
    };
    return clue.Gex(options);
  };
clue.Gex = function (options) {
    var $el = options.$el;
    var d = $.Deferred();
    var promises = [];
    var datasetFunctionsToInvoke = [];

    if (options.dataset.columnAnnotations && options.dataset.columnAnnotations.length > 0) {
      var columnDef = morpheus.DatasetUtil.annotate({
        annotations: options.dataset.columnAnnotations,
        isColumns: true
      });
      columnDef.then(function (callbacks) {
        datasetFunctionsToInvoke.push(callbacks);
      });
      promises.push(columnDef);
    }
    promises.push(options.dataset.dataset);
    options.dataset.dataset.then(function (result) {
      options.dataset.dataset = result;
    });
    const pp = Promise.all(promises)
    pp.catch(function () {
      d.reject();
    }).then(function () {
      var dataset = options.dataset.dataset;
      for (var i = 0; i < datasetFunctionsToInvoke.length; i++) {
        var functions = datasetFunctionsToInvoke[i];
        if (functions) {
          functions.forEach(function (f) {
            f(dataset);
          });
        }
        if (options.dataset.datasetReady) {
          options.dataset.datasetReady(dataset);
        }
        // sort by featureField
        var featureVector = dataset.getRowMetadata().getByName(options.dataset.featureField);
        var rowOrder = morpheus.Util.indexSort(morpheus.VectorUtil.toArray(featureVector), true);
        options.dataset.dataset = new morpheus.SlicedDatasetView(dataset, rowOrder, null);
      }

      var genes = morpheus.VectorUtil.getValues(options.dataset.dataset.getRowMetadata().getByName(options.dataset.featureField));
      colorMap = morpheus.VectorColorModel.TABLEAU10; //morpheus.VectorColorModel.getColorMapForNumber(options.datasets[0].dataset.getRowCount());
      var charts = [];
      var view = {};
      var datasetInfo = clue.Gex.createDatasets(dataset, options.dataset.zscore);
      datasetInfo.done(function (dataset) {
        view.dataset = dataset;
        view.genes = genes;
        var object = options.object;
        object.$el = options.$el;
        object.view = view;
        object.dataset = dataset;
        charts.push(view);
        var $row = $('<div class="row"><div class="col-xs-4"><div data-section="cellLineSelector" /><div data-section="helpText" /></div><div class="col-xs-8" data-section="chart" /></div>');
        $el.append($row);
        var $row2 = $('<div class="row"><div class="col-xs-4"></div><div id="gTable" class="col-xs-8" data-section="gTable"></div></div>');
        $el.append($row2);
        var $chart = $el.find('[data-section="chart"]');
        view.el = $chart[0];

        const $table =  $el.find('[data-section="gTable"]');

        // $chart.css('display', 'inline-block');

        function setUpInterface(object) {
          var genes = object.view.genes;
          var $el = object.$el;
          object.displayFormBuilder = new morpheus.FormBuilder({formStyle: 'inline'});
          // three column table
          // first column: cell lines
          // radio buttons, hides/shows different checkbox columns

          // second column: sort/group
          // dropdown for groupby
          var groupByOptions = ['None', 'Lineage'];
          for (var i = 0; i < genes.length; i++) {
            groupByOptions.push(genes[i] + ': Mutational status');
            groupByOptions.push(genes[i] + ': Copy number');
          }
          object.displayFormBuilder.append({
            name: 'group_points_by',
            type: 'bootstrap-select',
            options: groupByOptions,
            value: groupByOptions[0]
          });
          // sortby (if no groupby)
          var sortOptions = [];
          for (var i = 0; i < genes.length; i++) {
            sortOptions.push(genes[i] + ': High to Low');
            sortOptions.push(genes[i] + ': Low to High');
          }
          sortOptions.push('Id: A to Z');
          sortOptions.push('Id: Z to A');
          var dataOptions = Object.keys(clue.Gex.DATA_NAMES);
          object.displayFormBuilder.append({
            name: 'data_format',
            type: 'bootstrap-select',
            options: dataOptions,
            value: dataOptions[0]
          });
          // optional show gene (if groupby is not none and >1 gene)
          if(genes.length>1) {
            var geneOptions = genes;
            object.displayFormBuilder.append({
              name: 'gene_shown',
              type: 'bootstrap-select',
              options: geneOptions,
              value: geneOptions[0]
            });
          }
          else {
            view.geneShown = genes[0];
          }
          object.displayFormBuilder.append({
            name: 'sort_by',
            type: 'bootstrap-select',
            options: sortOptions,
            value: sortOptions[0] // high to low of first gene as default
          });
          object.sortOptionsBuilt = sortOptions;
          object.sortOptionsDefault = ['Default','Median: High to Low','Median: Low to High'];
        };
        function renderCellLineSelector(object) {
          var view = object.view;
          var dataset = view.dataset;
          var $el = object.$el;
          object.$el.find('[data-section="cellLineSelector"]').append('<label>Select cell lines:</label><br>' +
            '<input type="radio" name="cellLines" value="core"> Core Lines<br>' +
            '<input type="radio" name="cellLines" value="byId" checked> By ID<br>' +
            '<input type="radio" name="cellLines" value="byLineage"> By lineage' +
            '<div class="pad-top-8" data-section="byIdCheckbox"></div><div class="pad-top-8" data-section="byLineageCheckbox"></div>');
          object.$el.find('[data-section="cellLineSelector"]').on('change', {object:object}, function(e) {
            updateSelectedLines(e.data.object);
            updateSelectedTable(e.data.object);
            updateCharts(e.data.object.view);
          });
          view.idColumn = tablelegs.Table.createCheckBoxColumn({
            field: 'value',
            name: 'value',
            cssClass: '',
            resizable: true,
            exportLink: false,
            searchable: true,
            renderer: function (item, value) {
              return '<label><input data-tablelegs-toggle="true" type="checkbox" '
                + (this.set.has(value) ? ' checked' : '') + '/>' + ' ' + value + '</label>';
            }
          });
          view.idColumn.width = undefined;
          view.idColumn.maxWidth = undefined;
          view.idColumn.minWidth = undefined;
          var cellLineSelector = new tablelegs.Table({
            $el: $el.find('[data-section="byIdCheckbox"]'),
            columnPicker: false,
            tableClass: 'filter-group',
            showAll: false,
            height: '275px',
            showHeader: false,
            export: false,
            search: true,
            select: false,
            autocomplete: false,
            columns: [view.idColumn],
            items: _.map(dataset, function (obj) {
              return {value: obj.name}
            })
          });
          Object.keys(dataset).forEach(function (name) {
            view.idColumn.set.add(name);
          });
          var lineageCount = _.countBy(_.sortBy(dataset,'lineage'),'lineage');
          view.lineageColumn = tablelegs.Table.createCheckBoxColumn({
            field: 'value',
            name: 'value',
            cssClass: '',
            resizable: true,
            exportLink: false,
            searchable: true,
            renderer: function (item, value) {
              return '<label><input data-tablelegs-toggle="true" type="checkbox" '
                + (this.set.has(value) ? ' checked' : '') + '/>' + ' ' + item.text + '</label>';
            }
          });
          view.lineageColumn.width = undefined;
          view.lineageColumn.maxWidth = undefined;
          view.lineageColumn.minWidth = undefined;
          var cellLineSelector2 = new tablelegs.Table({
            $el: $el.find('[data-section="byLineageCheckbox"]'),
            columnPicker: false,
            tableClass: 'filter-group',
            showAll: false,
            height: '275px',
            showHeader: false,
            export: false,
            search: false,
            select: false,
            autocomplete: false,
            columns: [view.lineageColumn],
            items: _.map(lineageCount, function (count, key) {
              return {value: key,
                text: (key + ' (' + count + ')')}
            })
          });
          cellLineSelector.redraw();
          $el.find('[data-section="byIdCheckbox"] .slick-viewport').css('height','265px');
          cellLineSelector.trigger('checkBoxSelectionChanged');
          createCheckboxListener(cellLineSelector,object);
          cellLineSelector2.redraw();
          $el.find('[data-section="byLineageCheckbox"] .slick-viewport').css('height','265px');
          createCheckboxListener(cellLineSelector2,object);
        }
        function renderHelpText($el) {
          $el.append('<br><a class="pad-top-12" href="https://portals.broadinstitute.org/ccle/page?gene=' +
            genes[0] + '" target="_blank">View in CCLE Portal</a><br><br>');
          $el.append('<span data-container="body" data-toggle="popover" data-trigger="click focus" ' +
            "data-popover-config='" + '[{"target_self":"true","content_id":"tt_command_gex_data_format","placement":"top"}]' + "'" +
            ' data-tooltip-class="" style="color: #005D99;" id="i_command_gex_data_format" ' +
            'class="dashed-hover-underline tooltip_trigger">About data format</span><br>');
          $el.append('<span data-container="body" data-toggle="popover" data-trigger="click focus" ' +
            "data-popover-config='" + '[{"target_self":"true","content_id":"tt_command_gex_copy_number","placement":"top"}]' + "'" +
            ' data-tooltip-class="" style="color: #005D99;" id="i_command_gex_copy_number" ' +
            'class="dashed-hover-underline tooltip_trigger">About copy number</span><br>');
          $el.append('<span data-container="body" data-toggle="popover" data-trigger="click focus" ' +
            "data-popover-config='" + '[{"target_self":"true","content_id":"tt_command_gex_version","placement":"top"}]' + "'" +
            ' data-tooltip-class="" style="color: #005D99;" id="i_command_gex_version" ' +
            'class="dashed-hover-underline tooltip_trigger">Data source/version</span><br>');
        }


        setUpInterface(object);
        renderCellLineSelector(object);
        renderHelpText(object.$el.find('[data-section="helpText"]'));


        // checkbox columns, require dataset

        // first view is line chart by default
        updateDataType(object);
        updateGeneShown(object);
        updateGroupBy(object);
        updateSortBy(object);
        updateSelectedLines(object);
        updateSelectedTable(object);
        clue.Gex.createLineChart(view);
        setupHeader(options.object);
        d.resolve();

      });
    });
    return d;
  };

clue.Gex.DATA_TYPES = {
  Z_SCORE: 'Z-Scores',
  Z_SCORE_WITHIN: 'Z-Scores Within Primary Site',
  QNORM: 'Normalized'
};
clue.Gex.DATA_NAMES = {
  'Z-Scores': 'Z_SCORE',
  'Z-Scores Within Primary Site': 'Z_SCORE_WITHIN',
  'Normalized': 'QNORM'
};
clue.Gex.DATA_LABELS = {
  'Z-Scores': 'z-score',
  'Z-Scores Within Primary Site': 'z-score within primary site',
  'Normalized': 'normalized'
};
function calculateMedianOrder(dataset,groupByField,sortField) {
  // median of [3, 5, 4, 4, 1, 1, 2, 3] = 3
  var medianDataset = _.groupBy(dataset,groupByField);
  medianDataset = _.map(medianDataset, function(arr,key) {
    var numbers = arr.map(function(obj) {
      return obj[sortField];
    });
    numbers = numbers.sort(function(a, b){return a - b});
    var median = null;
    var numsLen = numbers.length;
    if (numsLen % 2 === 0 ) {
      // average of two middle numbers
      median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
    } else { // is odd
      // middle number only
      median = numbers[(numsLen - 1) / 2];
    }
    return {"name": key, "median": median};
  });
  return _.pluck(_.sortBy(medianDataset,"median"),"name");
}
clue.Gex.createGroupedBoxPlot = function (view) {
    var selectedLines = view.selectedLines;
    var allDatasets = _.filter(view.dataset, function (obj) {
      return _.contains(selectedLines, obj.name);
    });

    // other option, if groupBy is empty
    var xVals = null;
    var xLabel = '';
    var xField = '';
    if(view.groupBy.pluckField) {
      allDatasets = _.sortBy(allDatasets, view.groupBy.pluckField);
      xLabel = view.groupBy.pluckField;
      xField = view.groupBy.pluckField;
    }
    else {
      xField = view.groupBy.gene + '_' + view.groupBy.field;
    }
    xVals = _.pluck(allDatasets, xField);
    var yField = view.geneShown + '_exp_' + clue.Gex.DATA_NAMES[view.dataType];
    var yVals = _.pluck(allDatasets, yField);
    var keys = _.pluck(allDatasets, 'name');
    var layout = {
      width: window.innerWidth*.66-50,
      margin: {
        b : 200
      },
      hovermode: 'closest',
      title: '',
      xaxis: {
        zeroline: false, hoverformat: '.2f', title: xLabel
      },
      yaxis: {
        zeroline: false, hoverformat: '.1f', title: (view.geneShown +
        ' by ' + clue.Gex.DATA_LABELS[view.dataType])
      },
      boxmode: 'group'
    };
    var allBins = null;
    if(view.groupBy.field === 'CN_bin') {
      layout.xaxis.title = view.groupBy.gene + ' by copy number';
      allBins = ['Deletion', 'Loss', 'No change', 'Gain', 'Amplification', 'No data'];
      layout.xaxis.categoryorder = "array";
      // layout.xaxis.categoryarray = _.intersection(allBins,yVals);
    }
    else if(view.groupBy.field === 'Mut_status') {
      layout.xaxis.title = view.groupBy.gene + ' mutational status';
      allBins = ['Silent', 'Missense_Mutation', 'Nonsense_Mutation',
        'Frame_Shift_Ins', 'Frame_Shift_Del', 'In_Frame_Ins', 'In_Frame_Del', 'Splice_Site', 'No annotation'];
      layout.xaxis.categoryorder = "array";
      // layout.xaxis.categoryarray = _.intersection(allBins,yVals);
    }
    if(view.sortBy === 'median') {
      var sortedBins = calculateMedianOrder(allDatasets,xField,yField);
      if(view.sortByReverse) { sortedBins = sortedBins.reverse(); }
      if(allBins) {
        for(var i=0; i<allBins.length; i++) {
          if(!sortedBins.includes(allBins[i])) {
            sortedBins.push(allBins[i]);
          }
        }
      }
      layout.xaxis.categoryarray = sortedBins;
    }
    else {
      layout.xaxis.categoryarray = allBins;
    }


    var trace1 = {
      y: yVals,
      x: xVals,
      text: keys,
      name: view.geneShown,
      marker: {color: colorMap[0]},
      type: 'box',
      boxpoints: 'all',
      pointpos: 0,
      jitter: 0.05,
      hoverinfo: 'x+y+text'
    };
    var data = [trace1];
    Plotly.newPlot(view.el, data, layout);
  };
clue.Gex.createLineChart = function (view) {
  var allDatasets = view.dataset;
  var selectedLines = view.selectedLines;
  var allDatasetsFiltered = _.filter(allDatasets, function (obj) {
    return _.contains(selectedLines, obj.name);
  });
  var hoverText = null;
  var traces = [];
  var yMax = 0;
  var yMin = 0;
  view.genes.forEach(function (gene, i) {
    hoverText = _.map(allDatasetsFiltered, function(obj) {
      return obj[(gene + '_exp_' + clue.Gex.DATA_NAMES[view.dataType])].toFixed(5) +
        ' (' + gene + ' ' + clue.Gex.DATA_NAMES[view.dataType] + ')' +
        '<br>Copy number: ' + obj[gene+'_CN_bin'] +
        '<br>Mutation: ' + obj[gene+'_Mut_status'];
    });
    var yVals = _.pluck(allDatasetsFiltered, (gene + '_exp_' + clue.Gex.DATA_NAMES[view.dataType]));
    yMax = _.max(yVals)>yMax ? _.max(yVals) : yMax;
    yMin = _.min(yVals)<yMin ? _.min(yVals) : yMin;
    traces.push({
        x: _.pluck(allDatasetsFiltered, 'name'),
        y: yVals,
        mode: 'markers',
        line: {
          shape: 'hvh',
          color: colorMap[i % colorMap.length],
          width: 4
        },
        marker: { size: 8 },
        name: gene,
        type: 'scatter',
        hoverinfo: 'x+text',
        text: hoverText
      }
    );
  });
  // times .66 because col-xs-8
  var proposedWidth = (view.selectedLines.length+2)*60;
  proposedWidth = (window.innerWidth*.66-100) < proposedWidth ? window.innerWidth*.66-100 : proposedWidth;
  var layout = {
    height: 600,
    width: window.innerWidth*.66-50,
    margin: {
      t: 40,
      l: 50,
      r: (window.innerWidth*.66-proposedWidth)-50,
      b: 200
    },
    hovermode: 'x',
    title: '',
    xaxis: {
      zeroline: false, hoverformat: '.2f', title: 'Cell Line'
    },
    yaxis: {
      hoverformat: '.2r', title: clue.Gex.DATA_LABELS[view.dataType]
    }
  };
  if(allDatasetsFiltered.length>80) {
    layout.xaxis.showticklabels = false;
  }
  if(view.dataType!=clue.Gex.DATA_TYPES.QNORM) {
    var yMax = yMax>5 ? yMax+2 : 5;
    var yMin = yMin<-5 ? yMin+2 : -5;
    layout.yaxis.range = [yMin,yMax];
    layout.shapes = [
      {
        type: 'rect',
        xref: 'paper',
        yref: 'y',
        x0: 0,
        y0: 2,
        x1: 1,
        y1: yMax,
        fillcolor: '#dd4444',
        opacity: 0.2,
        line: {
          width: 0
        }
      },
      // 1st highlight during Feb 4 - Feb 6
      {
        type: 'rect',
        xref: 'paper',
        yref: 'y',
        x0: 0,
        y0: -2,
        x1: 1,
        y1: yMin,
        fillcolor: '#4444dd',
        opacity: 0.2,
        line: {
          width: 0
        }
      }
    ]
  }
  else {
    layout.yaxis.rangemode = 'tozero';
    layout.yaxis.autorange = true;
  }
  Plotly.newPlot(view.el, traces, layout);
};
clue.Gex.createDatasets = function (dataset, field) {
    dataset = clue.Gex.fixCcleDataset(dataset);
    var zscoredDataset = morpheus.DatasetUtil.copy(dataset);
    var zscoredWithinLineageDataset = morpheus.DatasetUtil.copy(dataset);
    var lineageToIds = new morpheus.Map();

    var lineageIndicesPairs = [{
      name: 'other',
      indices: []
    }];

    morpheus.VectorUtil.createValueToIndicesMap(dataset.getColumnMetadata().getByName(field)).forEach(function (indices, value) {
      if (value === 'unknown') {
        lineageIndicesPairs[0].indices = lineageIndicesPairs[0].indices.concat(indices);
      } else {
        lineageIndicesPairs.push({
          name: '' + value,
          indices: indices
        });
      }
    });

    if (lineageIndicesPairs[0].indices.length === 0) {
      lineageIndicesPairs.splice(0, 1);
    }
    lineageIndicesPairs.sort(function (p1, p2) {
      var a = p1.name.toLowerCase();
      var b = p2.name.toLowerCase();
      return (a === b ? 0 : (a < b ? -1 : 1));
    });
    for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
      lineageIndicesPairs.forEach(function (p) {
        var slice = new morpheus.SlicedDatasetView(dataset, null, p.indices);
        var zscore = new morpheus.SlicedDatasetView(zscoredWithinLineageDataset, null, p.indices);
        var view = new morpheus.DatasetRowView(slice);
        view.setIndex(i);
        var median = morpheus.Median(view);
        var mad = morpheus.MAD(view, median);
        if (mad === 0) {
          mad = 0.2;
        }
        for (var j = 0, ncols = slice.getColumnCount(); j < ncols; j++) {
          var val = slice.getValue(i, j);
          val = (val - median) / mad;
          zscore.setValue(i, j, val);
        }
      });
    }
    var view = new morpheus.DatasetRowView(dataset);
    for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
      view.setIndex(i);
      var median = morpheus.Median(view);
      var mad = morpheus.MAD(view, median);
      if (mad === 0) {
        mad = 0.2;
      }
      for (var j = 0, ncols = dataset.getColumnCount(); j < ncols; j++) {
        var val = dataset.getValue(i, j);
        val = (val - median) / mad;
        zscoredDataset.setValue(i, j, val);
      }
    }

    var f = $.Deferred();

    var expDatasets = {'Z_SCORE': zscoredDataset, 'Z_SCORE_WITHIN': zscoredWithinLineageDataset, 'QNORM': dataset};

    // compile all 3 datasets together
    var geneSymbolArray = morpheus.VectorUtil.toArray(view.dataset.getRowMetadata().getByName('pr_gene_symbol'));
    var ccleIdArray = morpheus.VectorUtil.toArray(view.dataset.getColumnMetadata().getByName('ccle_id'));
    var primarySiteArray = morpheus.VectorUtil.toArray(view.dataset.getColumnMetadata().getByName('Primary Site'));
    var allDatasets = {};
    ccleIdArray.forEach(function (cellName, cellIdx) {
      var dataObj = {};
      dataObj.name = cellName;
      dataObj.lineage = primarySiteArray[cellIdx];
      geneSymbolArray.forEach(function (geneName, geneIdx) {
        var mutStatus = geneName + '_Mut_status';
        var mutChange = geneName + '_cDNA_change';
        var cnNum = geneName + '_CN_num';
        var cnBin = geneName + '_CN_bin';
        dataObj[cnNum] = '-';
        dataObj[cnBin] = 'No data';
        dataObj[mutChange] = '-';
        dataObj[mutStatus] = 'No annotation';
        for (var dataType in expDatasets) {
          var expName = geneName + '_exp_' + dataType;
          dataObj[expName] = expDatasets[dataType].getValue(geneIdx, cellIdx);
        }
      });
      allDatasets[cellName] = dataObj;
    });


    // get top-level cell line annotation (site, cancer, etc.)
    // for each gene, create a datasets object
    // once all of these dataset objects for a gene are made, fold them into top-level cell line data
    // once all "folding in" of datasets are finished (need promise for this), this is your master set of json objects:
    // cell line is unique identifier, and then all its associated data (gex and annotations)


    // getting all data from matrix_value together
    var dPromises = [];
    geneSymbolArray.forEach(function (gene) {
      var d = $.Deferred();
      dPromises.push(d);
      var pPromises = [];
      var geneDataset = {};
      var p = clue.Gex.getCNForGeneCCLE(gene);
      p.done(function (dataset) {
        geneDataset.copyNumber = dataset;
      });
      pPromises.push(p);
      p = clue.Gex.getMutForGeneCCLE(gene);
      p.done(function (dataset) {
        geneDataset.mutStatus = dataset;
      });
      pPromises.push(p);
      $.when.apply($, pPromises).done(function () {
        var cnNum = gene + '_CN_num';
        var cnBin = gene + '_CN_bin';
        geneDataset.copyNumber.forEach(function (o) {
          if (allDatasets[o.i]) {
            allDatasets[o.i][cnNum] = o.v;
            allDatasets[o.i][cnBin] = o.cn_bin;
          }
        });

        var mutStatus = gene + '_Mut_status';
        var mutChange = gene + '_cDNA_change';
        geneDataset.mutStatus.forEach(function (o) {
          var mutStatusVal = o.Variant_Classification;
          var mutChangeVal = o.cDNA_Change;
          o.values.forEach(function (v) {
            if (allDatasets[v.i]) {
              allDatasets[v.i][mutStatus] = mutStatusVal;
              allDatasets[v.i][mutChange] = mutChangeVal;
            }

          });
        });
        d.resolve();
      });
    });
    $.when.apply($, dPromises).done(function () {
      f.resolve(allDatasets);
    });
    return f;
  };
clue.Gex.getCNForGeneCCLE = function (gene) {
    var deferred = $.Deferred();
    var filterObject = {
      where: {f: gene, d: "CCLE_CN_2013-12-03"},
      fields: ["v", "i"],
      order: "v ASC"
      //,limit:100
    };

    $.ajax(
      clue.API_URL + '/api/matrix_values?filter=' + JSON.stringify(filterObject)
    ).done(function (results) {
      results.forEach(function (o) {
        if (o.v < -1.1) {
          o.cn_bin = 'Deletion'
        }
        else if (o.v < -0.25) {
          o.cn_bin = 'Loss'
        }
        else if (o.v >= 0.7) {
          o.cn_bin = 'Amplification';
        }
        else if (o.v >= 0.2) {
          o.cn_bin = 'Gain'
        }
        else {
          o.cn_bin = 'No change'
        }
      });
      deferred.resolve(results);
    }).fail(function () {
      deferred.resolve(null);
    });

    return deferred;
  };
clue.Gex.getMutForGeneCCLE = function (gene) {
    var deferred = $.Deferred();
    var filterObject = {
      where: {Symbol: gene},
      include: {values: 1}
      //,limit:100
    };
    $.ajax(
      clue.API_URL + '/api/matrix_features?filter=' + JSON.stringify(filterObject)
    ).done(function (results) {
      deferred.resolve(results);
    }).fail(function () {
      deferred.resolve(null);
    });

    return deferred;
  };
clue.Gex.fixCcleDataset = function (dataset) {
    var primarySite = dataset.getColumnMetadata().getByName('Primary Site');
    var lineageVector = dataset.getColumnMetadata().getByName('cell_lineage');
    var cellIdVector = dataset.getColumnMetadata().getByName('cell_id');
    var ccleNameVector = dataset.getColumnMetadata().getByName('ccle_id');
    for (var i = 0; i < cellIdVector.size(); i++) {
      var id = cellIdVector.getValue(i);
      // CD34, NEU, NPC
      if (primarySite.getValue(i) == null || primarySite.getValue(i) == '') {
        var lineage = lineageVector.getValue(i);
        if (lineage === 'CNS') {
          lineage = 'central_nervous_system';
        } else if (lineage === 'bone marrow') {
          lineage = 'bone';
        }
        primarySite.setValue(i, lineage);
        ccleNameVector.setValue(i, id.toUpperCase() + '_' + lineage);
      }
    }
    return dataset;
  };
function setupHeader(object) {
  showExportOptions(object);
  setupDisplayOptions(object);
}
function setupDisplayOptions(object) {
  object.displayFormBuilder.$form.find('label').addClass('display-label');
  object.displayFormBuilder.$form.find('.bootstrap-select').addClass('display-selector-button');
  object.displayFormBuilder.$form.addClass('display-form');
  object.displayFormBuilder.$form.appendTo(object.$el.find('.header-display-options'));
  object.displayFormBuilder.find('data_format').on('change', {object:object}, function (e) {
    updateDataType(e.data.object);
    updateSortBy(e.data.object);
    updateCharts(e.data.object.view);
  });
  object.displayFormBuilder.find('sort_by').on('change', {object:object}, function (e) {
    updateSortBy(e.data.object);
    updateCharts(e.data.object.view);
  });
  object.displayFormBuilder.find('group_points_by').on('change', {object:object}, function (e) {
    updateGroupBy(e.data.object);
    updateSortBy(e.data.object);
    updateCharts(e.data.object.view);
  });
  object.displayFormBuilder.find('gene_shown').on('change', {object:object}, function (e) {
    updateGeneShown(e.data.object);
    updateCharts(e.data.object.view);
  });
}
function updateCharts(view) {
  if (!view.groupBy) {
    clue.Gex.createLineChart(view);
  } else {
    clue.Gex.createGroupedBoxPlot(view);
  }
}
function updateDataType(object) {
  object.view.dataType = object.displayFormBuilder.getValue("data_format");
}
function updateGeneShown(object) {
  if(object.view.genes.length>1) {
    object.view.geneShown = object.displayFormBuilder.getValue("gene_shown");
  }
}
function updateGroupBy(object) {
  var $el = object.$el;
  var groupBy =  object.displayFormBuilder.getValue("group_points_by");
  var $geneShown = object.displayFormBuilder.find('gene_shown').parent().parent().addClass('hide-important');
  if(groupBy==='None') {
    $el.find('[data-section="uiGeneShown"]').hide();
    $geneShown.addClass('hide-important');
    object.view.groupBy = false;
    object.displayFormBuilder.setOptions('sort_by',object.sortOptionsBuilt,true);
  }
  else {
    // $el.find('[data-section="uiSortBy"]').hide();
    // $sortBy.addClass('hide-important');
    $el.find('[data-section="uiGeneShown"]').show();
    $geneShown.removeClass('hide-important');
    var index = groupBy.indexOf(':');
    if (index >= 0) {
      var gene = groupBy.substring(0, index).trim();
      var field = groupBy.substring(index + 1).trim();
      field = (field === 'Mutational status' ? 'Mut_status' : 'CN_bin');
      object.view.groupBy = {
        gene: gene,
        field: field
      };
    }
    else {
      object.view.groupBy = {pluckField: 'lineage'};
    }
    object.displayFormBuilder.setOptions('sort_by',object.sortOptionsDefault,true);
  }
}
function updateSortBy(object) {
  // get sortby
  var sortBy = object.displayFormBuilder.getValue("sort_by");
  var index = sortBy.indexOf(':');
  object.view.sortByReverse = false;
  if (index >= 0) {
    var field1 = sortBy.substring(0, index).trim();
    if (field1==='Id') {
      field1 = 'name';
    }
    else if (field1==='Median') {
      field1 = 'median';
    }
    else {
      field1 += '_exp_' + clue.Gex.DATA_NAMES[object.view.dataType];
    }
    object.view.dataset = _.sortBy(object.view.dataset, field1);
    var field2 = sortBy.substring(index + 1).trim();
    if (field2==='Z to A' || field2==='High to Low') {
      object.view.dataset = object.view.dataset.reverse();
      object.view.sortByReverse = true;
    }

    object.view.sortBy = field1;
  }
  else {
    object.view.sortBy = 'default';
  }
}
function createCheckboxListener(selector, object) {
  selector.on('checkBoxSelectionChanged',function (e) {
    updateSelectedLines(object);
    updateSelectedTable(object);
    updateCharts(object.view);
  });
}

function updateSelectedTable(object) {
  const $el = object.$el;
  const dataset = object.dataset;
  const genes = object.view.genes;
  // const gTable = $el.find('[="gTable"]');
  const gTable = $el.find('[data-section="gTable"]');
  gTable.html('');

  if (!genes || genes.length > 1) {
    return;
  }
  const gene = genes[0];
  const items = _.toArray(dataset);
  console.log(items);
  const table = new tablelegs.Table({
    search: true,
    showAll: false,
    export: false,
    exportFileName: 'gex_export.txt',
    $el: gTable,
    items: items,
    columns: [
      {
        name: 'Name',
        field: 'name',
        visible: true
      },
      {
        name: 'Lineage',
        field: 'lineage',
        visible: true
      },
      {
        name: 'z-score',
        field: gene + '_exp_Z_SCORE',
        visible: true
      },
      {
        name: 'q-norm',
        field: gene + '_exp_QNORM',
        visible: true
      }
    ]
  });
  table.setSortColumns([{
    name: 'z-score',
    ascending: false
  }]);

}

function updateSelectedLines(object) {
  var $el = object.$el;
  var view = object.view;
  var radioVal = $el.find('[name="cellLines"]:checked').val();
  if(radioVal==='core') {
    $el.find('[data-section="byLineageCheckbox"]').hide();
    $el.find('[data-section="byIdCheckbox"]').hide();
    view.selectedLines = clue.CORE_CELL_LINES_CCLE;
  }
  else if(radioVal==='byId') {
    $el.find('[data-section="byLineageCheckbox"]').hide();
    $el.find('[data-section="byIdCheckbox"]').show();
    view.selectedLines = view.idColumn.set.values();
  }
  else {
    $el.find('[data-section="byLineageCheckbox"]').show();
    $el.find('[data-section="byIdCheckbox"]').hide();
    var lineages = view.lineageColumn.set.values();
    view.selectedLines = _.pluck(_.filter(object.view.dataset,
      function(obj){ return lineages.indexOf(obj.lineage)!=-1}), 'name');
  }
}
function showExportOptions(object) {
  var $el = object.$el;
  $el.find('.command-out-links').show();
  var topConnHeatMap = object.topConnHeatMap;
  var $exportOptions = $el.find('.export-options');
  var exportOptionsHtml = '<input type="radio" name="exportType" value="0" class="export-radio">' +
    'Export the selected data as a comma-separated file (.csv)</input><br>';
  $exportOptions.html(exportOptionsHtml);
  $el.find('.export-btn-confirm').on('click',{object: object},function(e) {
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
  $el.find('.export-warning').html('');
  var inputType = $el.find('input[name="exportType"]:checked').val();
  var fileName = $el.find('.export-filename-prompt').val();
  fileName = fileName ? fileName : 'command_output';
  if(!inputType) {
    $el.find('.export-warning').html('No option selected');
  }
  else {
    if(inputType==0) {
      saveDatasetToCsv(object,fileName);
    }
    $el.find('.export-modal').modal('hide');
  }
}
function saveDatasetToCsv(object,fname) {
  // make header

  var dataset = _.filter(object.dataset, function (obj) {
    return _.contains(object.view.selectedLines, obj.name);
  });
  dataset = _.sortBy(dataset, 'name');
  var header = _.keys(dataset[0]);
  // iterate over each
  var csvContent = header.join(',') + '\n';
  dataset.forEach(function (obj) {
    for (var i = 0; i < header.length - 1; i++) {
        csvContent += obj[header[i]] + ','
    }
    csvContent += obj[header[header.length-1]] + '\n';
  });

  var blob = new Blob([csvContent], {type:'text/csv'});
  var csvUrl = window.URL.createObjectURL(blob);

  var link = document.createElement("a");
  link.setAttribute("href", csvUrl);
  link.setAttribute("download", fname+".csv");
  link.click();
}




