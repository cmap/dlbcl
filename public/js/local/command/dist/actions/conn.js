/**
 *
 * @param options.q25 Array of q25 values
 * @param options.q50 Array of median values
 * @param options.q75 Array of q75 values
 * @param options.xaxisLabels Array of x axis labels
 * @param options.yaxisTitle
 * @param options.el Plotly element
 */
//conn
exports.changeTabHeader = function(tabObject) {
    setupHeader(tabObject);
    showInputInterpretations(tabObject);
};
function buildDropdownHeader(title,text) {
  return '<li class="dropdown-header">' +
    '<p class="dropdown-header-text"><b>' + title + '</b><br/>' + text +
    '</p></li>';
}
function buildDropdownOption(interpretation, assay, text) {
    return '<li><a href="#" data-interpretation="' + interpretation + '" data-assay="' + assay + '">' +
        '<p class="dropdown-text"><b>' + text + '</b></p></a></li>';
}
function setupInputInterpretations(object) {
    var $interpretation = object.$el.find('.input-interpretation');
    $interpretation.show();
    var dropdownTitles = {topConnOption:'Top Connections',introspectOption:'Introspect',topConnGcpOption:'Top Connections (GCP)'};
    var dropdownList = buildDropdownHeader('Top Connections',
      'Show top connections between<br> selected perturbagens and the<br> reference Touchstone dataset');

    dropdownList += buildDropdownOption('top', 'L1000', 'Gene expression (L1000)');
    dropdownList += buildDropdownOption('top', 'GCP', 'Histone profiling (GCP)');
    dropdownList += buildDropdownOption('top', 'P100', 'Phosphoproteomics (P100)');
    if (object.ids.length > 1) {
        dropdownList += buildDropdownHeader('Introspect',
          'View internal connectivities<br> between selected perturbagens');
        dropdownList += buildDropdownOption('introspect', 'L1000', 'Gene expression (L1000)');
        dropdownList += buildDropdownOption('introspect', 'GCP', 'Histone profiling (GCP)');
        dropdownList += buildDropdownOption('introspect', 'P100', 'Phosphoproteomics (P100)');
    }
    object.$el.find('.input-interpretation-options').html(dropdownList);
    object.$el.find('.active-option').text('Top Connections (L1000)');
    // object.$el.find('[data-option="top-l1000"]').on('click',{object:object}, function(e){
    //     var object = e.data.object;
    //     object.$el.find('[data-type=tab]').hide();
    //     object.$el.find('[data-name=topTab]').show();
    //     object.$el.find('.active-option').text(dropdownTitles.topConnOption);
    //     object.$el.find('.display-form').hide(function() {
    //       object.formBuilders.top['L1000'].$form.fadeIn();
    //     });
    //
    // });
    // object.$el.find('[data-option="introspect-l1000"]').on('click',{object:object}, function(e){
    //     var object = e.data.object;
    //     object.$el.find('[data-type=tab]').hide();
    //     object.$el.find('[data-name=introspectTab]').show();
    //     updateIntrospect(object);
    //     object.$el.find('.active-option').text(dropdownTitles.introspectOption);
    //     object.$el.find('.display-form').hide(function() {
    //       object.formBuilders.introspect['L1000'].$form.fadeIn();
    //     });
    //
    // });
    $interpretation.find('a').on('click',{object:object}, function(e){
      var object = e.data.object;
      updateTab(object,$(this).data('interpretation'),$(this).data('assay'));
        // object.$el.find('[data-type=tab]').hide();
        // object.$el.find('[data-name=introspectTab]').show();
        // object.$el.find('.active-option').text(dropdownTitles.introspectOption);
        // object.$el.find('.display-form').hide(function() {
        // });

    });
}
function setupOutButtons(object) {
  var outHtml = '<span>See all connections:&nbsp;' +
  '<button type="button" class="btn-send-to-app" data-name="show-heatmap"><i class="fa fa-align-left"></i></button>' +
  '<button type="button" class="btn-send-to-app" data-name="show-detailed-list"><i class="fa fa-th"></i></button></span>';
  //   var outHtml =  '<label class="pull-left btn-sm hidden-xs hidden-sm">See all connections: </label>' +
  //   '<button class="btn btn-sm btn-send-to-app"><i class="fa fa-align-left"></i></button>' +
  //   '<button class="btn btn-sm btn-send-to-app"><i class="fa fa-th"></i></button>';
  object.$el.find('.command-out-links').prepend(outHtml);
  object.$el.find('[data-name="show-heatmap"]').on('click',{object:object}, function(e) {
    window.open('/icv?pert_id=' + e.data.object.ids.join('&pert_id='));
  });
  object.$el.find('[data-name="show-detailed-list"]').on('click',{object:object}, function(e) {
    window.open('/connection?url=data.clue.io/tsv2/digests/' + object.ids.join('&url=data.clue.io/tsv2/digests/'));
  });
}
function setupExportOptions(object) {
    var $el = object.$el;
    $el.find('.command-out-links').show();
    var topConnHeatMap = object.topConnHeatMaps;
    var $exportOptions = $el.find('.export-options');
    var exportOptionsHtml = '<input type="radio" name="exportType" value="0" class="export-radio">' +
        'Export the top connection data as a GCT (.gct, Version 1.3)</input><br>';
    $exportOptions.html(exportOptionsHtml);
    $el.find('.export-btn-confirm').on('click',{heatmaps:object.topConnHeatMaps, o:object, $el: object.$el},function(e) {
      executeExport(e.data.heatmaps[object.activeTopConn], $el);
    });
    $el.find('.export-btn-cancel').on('click',{object:object},function(e) {
      e.data.object.$el.find('.export-modal').modal('hide');
    });
    $el.find('.export-btn').on('click',{$el:object.$el},function(e) {
      e.data.$el.find('.export-warning').html('');
      e.data.$el.find('.export-pending').html('');
    });
}
function setupIntrospectFormBuilder(object, cellLines, assay) {
  object.formBuilders.introspect[assay] = new morpheus.FormBuilder({formStyle: 'inline'});
  if (object.ids.length > 2) {
    object.formBuilders.introspect[assay].append({
      type: 'bootstrap-select',
      name: 'cluster_introspect_data',
      options: ['Summary', 'Each cell line individually'].concat(cellLines),
      value: 'Each cell line individually'
    });
    object.formBuilders.introspect[assay].append({
      type: 'checkbox',
      name: 'compress_heat_maps'
    });
  }
  object.formBuilders.introspect[assay].$form.find('label').addClass('display-label');
  object.formBuilders.introspect[assay].$form.find('.bootstrap-select').addClass('display-selector-button');
  object.formBuilders.introspect[assay].$form.addClass('display-form');
  object.formBuilders.introspect[assay].find('cluster_introspect_data').on('change', {object:object,assay:assay}, function (e) {
    reorderIntrospect(e.data.object, e.data.assay);
  });
  object.formBuilders.introspect[assay].find('compress_heat_maps').on('change', {object:object,assay:assay}, function (e) {
    var isFit = e.data.object.formBuilders.introspect[e.data.assay].getValue('compress_heat_maps');
    if (!isFit) {
      e.data.object.cellLineToInfo[e.data.assay].forEach(function (info, cell) {
        if (cell !== 'Summary') {
          info.heatMap.getHeatMapElementComponent().getRowPositions().setSize(13);
          info.heatMap.getHeatMapElementComponent().getColumnPositions().setSize(13);
          info.heatMap.addTrack('name', true, {display: ['text']});
          info.heatMap.addTrack('type', true, {display: ['color']});
          info.heatMap.addTrack('name', false, {display: ['text']});
          if(info.dataset.getRowMetadata().getByName('type')) {
            info.heatMap.addTrack('type', false, {display: ['color']});
          }
          if(info.dataset.getRowMetadata().getByName('search term')) {
            info.heatMap.addTrack('search term', false, {display: ['text']});
          }
          info.heatMap.revalidate();
          info.$el.css({
            width: object.maxWidth,
            height: object.maxHeight
          });
        }
      });
    } else {
      var shrunkWidth = 0;
      var shrunkHeight = 0;
      e.data.object.cellLineToInfo[assay].forEach(function (info, cell) {
        if (cell !== 'Summary') {
          info.$el.css({
            width: '',
            height: ''
          });
          info.heatMap.getHeatMapElementComponent().getRowPositions().setSize(3);
          info.heatMap.getHeatMapElementComponent().getColumnPositions().setSize(3);
          info.heatMap.removeTrack('name', true);
          info.heatMap.removeTrack('type', true);
          info.heatMap.removeTrack('name', false);
          info.heatMap.removeTrack('type', false);
          info.heatMap.removeTrack('search term', false);
          info.heatMap.revalidate();
          shrunkWidth = Math.max(shrunkWidth, info.$el.width());
          shrunkHeight = Math.max(shrunkHeight, info.$el.height());
        }
      });
    }
  });
  object.formBuilders.introspect[assay].$form.appendTo(object.$el.find('.header-display-options'));
}
function setupTopFormBuilder(object, assay) {
  object.formBuilders.top[assay].$form.find('label').addClass('display-label');
  object.formBuilders.top[assay].$form.find('.bootstrap-select').addClass('display-selector-button');
  object.formBuilders.top[assay].$form.addClass('display-form');
  object.formBuilders.top[assay].find('cell_lines').on('change', {o: object, assay: assay}, function (e) {
    var object = e.data.o;
    var assay = e.data.assay;
    object.selectedCellLineSets[assay] = new morpheus.Set();
    var values = object.formBuilders.top[assay].getValue('cell_lines');
    if (values != null) {
      values.forEach(function (value) {
        object.selectedCellLineSets[assay].add(value);
      });
    }
      const p = updateColumnFilter(object, assay);
      p.then(function () {
          return "done"
      }).catch(function (ee) {
          return "done"
      })
  });
  object.formBuilders.top[assay].find('perturbagens').on('change', {o: object, assay: assay}, function (e) {
    var object = e.data.o;
    var assay = e.data.assay;
    object.selectedPertSets[assay] = new morpheus.Set();
    var values = object.formBuilders.top[assay].getValue('perturbagens');
    if (values != null) {
      values.forEach(function (value) {
        object.selectedPertSets[assay].add(value);
      });
    }
      const p = updateColumnFilter(object, assay);
      p.then(function () {

      }).catch(function (ee) {

      });
  });
  object.formBuilders.top[assay].find('group_by').on('change', {o: object, assay: assay}, function (e) {
    var object = e.data.o;
    var assay = e.data.assay;
    var groupBy = object.formBuilders.top[assay].getValue('group_by');
    var keys;
    var groupByField = null;
    var heatMaps = [object.topConnHeatMaps[assay]];
    if(assay==='L1000') { heatMaps = heatMaps.concat(object.heatMapSubsets) };
    if (groupBy === 'None') {
      keys = [new morpheus.SortKey('name', 0, true)];
      object.topConnHeatMaps[assay].getProject().setColumnSortKeys(keys, false);
    }
    else if (groupBy === 'Cell Line') {
        keys = [
          new morpheus.SortKey('cell_id', 0, true),
          new morpheus.SortKey('type', 1, true),
          new morpheus.SortKey('name', 0, true)];
        groupByField = 'cell_id';
    }
    else if (groupBy === 'Perturbagen') {
        keys = [
          new morpheus.SortKey('type', 1, true),
          new morpheus.SortKey('name', 0, true),
          new morpheus.SortKey('cell_id', 0, true)];
        groupByField = '_id';
    }
    keys.forEach(function (key) {
      key.setLockOrder(1);
    });
    heatMaps.forEach(function (heatMap) {
      heatMap.getProject().setColumnSortKeys(keys, false);
      heatMap.getProject().setGroupColumns(groupByField == null ? [] : [new morpheus.SortKey(groupByField, 0, true)], true);
        // if(groupByField) {
        //
        // }
    });
      //
      //   if(assay==='L1000') {
      //
      //   }
      //   object.topConnHeatMaps[assay].getProject().setColumnSortKeys(keys, false);
      //   object.topConnHeatMaps[assay].getProject().setGroupColumns(groupByField == null ? [] : [new morpheus.SortKey(groupByField, 0, true)], true);
      // }
  });
  object.formBuilders.top[assay].$form.appendTo(object.$el.find('.header-display-options'));
}
function executeExport(topConnHeatMap, $el) {
    $el.find('.export-warning').html('');
    var inputType = $el.find('input[name="exportType"]:checked').val();
    var fileName = $el.find('.export-filename-prompt').val();
    fileName = fileName ? fileName : 'command_output';

    if(!inputType) {
      $el.find('.export-warning').html('No option selected');
    }
    else {
        if(inputType==0) {
            exports.saveTopConnHeatMap(topConnHeatMap, fileName);
        }
        $el.find('.export-modal').modal('hide');
    }
}

function setupHeader(object) {
  setupInputInterpretations(object);
  setupOutButtons(object);
  setupExportOptions(object);
}
exports.saveTopConnHeatMap = function(heatMap, fileName) {
    var project = heatMap.getProject();
    var series = project.getFullDataset().getName(0);
    options = {
        project: project,
        heatMap: heatMap,
        input: {
            file_format: '1.3',
            save_selection_only: 1,
            file_name: fileName,
            series: project.getFullDataset().getName(0)
        }
    };
    morpheus.SaveDatasetTool.prototype.execute(options);
};
function createLineBoxPlot(options) {
    var traces = [];
    var text = [];
    for (var i = 0; i < options.q50.length; i++) {
        var label = 'Median: ' + morpheus.Util.nf(options.q50[i]);
        if (options.q75) {
            label += ', Q75: ' + morpheus.Util.nf(options.q75[i]) + ', Q25: ' + morpheus.Util.nf(options.q25[i]);
        }
        text.push(label);

    }
    var color = 'rgb(0, 0, 0)';
    traces.push({
            x: options.xaxisLabels,
            y: options.q50,
            text: text,
            hoverinfo: 'x+text',
            line: {color: color},
            mode: 'lines',
            type: 'scatter',
            showlegend: true
        }
    );

    // q75, top of fill
    if (options.q75) {
        traces.push({
                text: text,
                hoverinfo: 'x+text',
                x: options.xaxisLabels,
                y: options.q75,
                line: {color: 'transparent'},
                type: 'scatter',
                showlegend: false
            }
        );
    }
    // q25
    if (options.q25) {
        traces.push({
            text: text,
            hoverinfo: 'x+text',
            x: options.xaxisLabels,
            y: options.q25,
            fill: 'tonexty',
            fillcolor: 'rgba(100,100,100, .2)',
            line: {color: 'transparent'},
            type: 'scatter',
            showlegend: false
        });
    }

    var plotlyDefaults = clue.getPlotlyDefaults2();
    var layout = plotlyDefaults.layout;
    var config = plotlyDefaults.config;
    config.displayModeBar = false;
    layout.showlegend = false;
    layout.xaxis.fixedrange = true;
    layout.yaxis.fixedrange = true;
    if(options.assay==='L1000') {
      layout.yaxis.range = [-101, 101];
    }
    else {
      layout.yaxis.range = [-1.01, 1.01];
    }
    layout.xaxis.tickangle = -90;
    layout.yaxis.title = options.yaxisTitle;
    // layout.yaxis.tickvals = [-100, -90, 0, 90, 100];

    layout.width = 300;
    layout.height = 200;
    layout.margin.b = 70;
    layout.margin.t = 10;
    layout.margin.r = 6;

    Plotly.newPlot(options.el, traces, layout, config);
}
exports.show = function(options) {
  var promises = [];
  if (clue.ICV.L1000_ANNOTATION_LINES_ROWS == null || clue.ICV.L1000_ANNOTATION_LINES_COLUMNS == null) {
    var annotationPromise = morpheus.Util.readLines(clue.ICV.ANNOTATIONS);
    promises.push(annotationPromise);
      annotationPromise.then(function (lines) {
      clue.ICV.L1000_ANNOTATION_LINES_ROWS = lines;
      clue.ICV.L1000_ANNOTATION_LINES_COLUMNS = lines;
    });
  }
  if (clue.ICV.PROT_ANNOTATION_LINES_ROWS == null || clue.ICV.PROT_ANNOTATION_LINES_COLUMNS == null) {
    var annotationPromise = morpheus.Util.readLines(clue.ICV.PROT_ANNOTATIONS);
    promises.push(annotationPromise);
      annotationPromise.then(function (lines) {
      clue.ICV.PROT_ANNOTATION_LINES_ROWS = lines;
      clue.ICV.PROT_ANNOTATION_LINES_COLUMNS = lines;
    });
  }
  if (clue.ICV.PCL_METADATA == null) {
    var p = $.ajax(clue.API_URL + '/api/pcls/?filter={"include":{"relation":"perts","scope":{"fields":["pert_id"]}}}');
    p.done(function (results) {
      clue.ICV.PCL_METADATA = results;
    });
    promises.push(p);
  }
  var object = options.object;
  object.updated = {
    introspect : {},
    top : {}
  };
  object.formBuilders = {
    introspect : {},
    top : {}
  };
  object.fullDatasets = {};
  object.selectedPertSets = {};
  object.selectedCellLineSets = {};
  object.cellLineVectors = {};
  object.nameVectors = {};
  object.idToIndexes = {};
  object.cellLineToInfo = {
    L1000: new morpheus.Map(),
    GCP: new morpheus.Map(),
    P100: new morpheus.Map()
  };
  object.topConnHeatMaps = {};
  options.ids.forEach(function(str,idx) {
    options.ids[idx] = str.replace(/ccsbbroad/i, 'ccsbBroad');
  });
  object.ids = options.ids;
  object.introspectUpdated = false;
  object.idToSearchTerms = options.idToSearchTerms;
  object.activeOption = 'topConnOption';
  object.$el = options.$el;
  object.tokens = options.tokens;
  var showSearchTerms = false;
  object.showSearchTerms = showSearchTerms;
  var html = [];
  var topConnHelp = 'The "score" column is the median' +
    ' connectivity' +
    ' score' +
    ' across the <b>selected' +
    ' perturbagens' +
    ' and cell lines.</b>';
  html.push('<div class="col-xs-12">');
  html.push('<div data-name="colorscale" data-assay="L1000"><img style="width:205px;height:auto;" class="img-key pull-right" src="//assets.clue.io/clue/public/img/command/conn_legend.png"></div>');
  html.push('<div style="display: none;" data-name="colorscale" data-assay="GCP"><img style="width:205px;height:auto;" class="img-key pull-right" src="//assets.clue.io/clue/public/img/command/conn_legend_prot.png"></div>');
  html.push('<div style="display: none;" data-name="colorscale" data-assay="P100"><img style="width:205px;height:auto;" class="img-key pull-right" src="//assets.clue.io/clue/public/img/command/conn_legend_prot.png"></div>');
  html.push('<div data-name="topTab" data-assay="L1000" data-interpretation="top" data-type="tab">');
  html.push('<div data-name="top"><span data-interpretation="top" class="extra-info-text">' + topConnHelp + '<br/>The top and bottom scores are shown' +
    ' separately' +
    ' for' +
    ' perturbagen classes, compounds, genetic' +
    ' perturbations' +
    ' (overexpressions' +
    ' and knockdowns).</span></div>');
  html.push('<label class="conn-heatmap-title">Perturbagen class</label>');
  html.push('<div data-name="topOne" class="conn-heatmap-subsection"></div>');
  html.push('<label class="conn-heatmap-title">Compound</label>');

  html.push('<div data-name="topTwo" class="conn-heatmap-subsection"></div>');
  html.push('<label class="conn-heatmap-title">Genetic</label>');

  html.push('<div data-name="topThree" class="conn-heatmap-subsection"></div>');
  html.push('</div>');
  html.push('<div style="display: none;"  data-assay="GCP" data-interpretation="top" data-name="topTab"' +
    ' data-type="tab"><div data-name="top"><span data-interpretation="top" class="extra-info-text">' + topConnHelp + '</span></div></div>');
  html.push('<div style="display: none;" data-assay="P100" data-interpretation="top" data-name="topTab"' +
    ' data-type="tab"><div data-name="top"><span data-interpretation="top" class="extra-info-text">' + topConnHelp + '</span></div></div>');
  html.push('<div data-assay="L1000" data-interpretation="introspect" data-name="introspectTab"' +
      ' data-type="tab"></div>');
  html.push('<div data-assay="GCP" data-interpretation="introspect" data-name="introspectTab"' +
    ' data-type="tab"></div>');
  html.push('<div data-assay="P100" data-interpretation="introspect" data-name="introspectTab"' +
    ' data-type="tab"></div>');
// probably don't need this: <div data-name="introspect"></div>
  html.push('</div>');

  var $el = $(html.join(''));
  $el.appendTo(options.$el);
  $el.hide();
  var f = $.Deferred();

  $.when.apply($, promises).done(function () {
    var d = updateTopConnections(object, 'L1000');
    d.done(function () {
      setupHeader(options.object);
      $el.show();
      f.resolve();
    }).fail(function () {
      console.log('updateTopConnections failed');
    });
  });
// when something is clicked:
    // hide all headers, selectors and tabs
    // show loading el
    // call update function
    // once done, re-reveal everything

  return f;
};
// object.selectedCellLines, object.cellLineVectors, object.nameVectors, object.typeVector, fullDataset, object.cellLineDataset, object.selectedPerts, heatMap
async function updateColumnFilter(object, assay) {
  var columnIndices = null;
  var pertName = null;

  if (object.selectedCellLineSets[assay] != null && object.selectedCellLineSets[assay].size() > 0) {
    columnIndices = [];
    for (var j = 0; j < object.cellLineVectors[assay].size(); j++) {
      pertName = object.nameVectors[assay].getValue(j);
        if (assay === 'L1000') {
            pertName = pertName + '-' + object.typeVector.getValue(j);
        }
      if (object.selectedCellLineSets[assay].has(object.cellLineVectors[assay].getValue(j))) {
        columnIndices.push(j);
      }
    }
  }
  object.cellLineDataset = new morpheus.SlicedDatasetView(object.fullDatasets[assay], null, columnIndices);
  var indexVector = object.cellLineDataset.getColumnMetadata().add('is_index');
  var connectionsDataset = object.cellLineDataset;
  if (object.selectedPertSets[assay] != null && object.selectedPertSets[assay].size() > 0) {
    // pick refererence perts
    var currentDatasetTypeVector = object.cellLineDataset.getColumnMetadata().getByName('type');
    var currentDatasetNameVector = object.cellLineDataset.getColumnMetadata().getByName('name');
    var pertIndices = [];
    for (var j = 0; j < object.cellLineDataset.getColumnCount(); j++) {
      pertName = currentDatasetNameVector.getValue(j);
        if (assay === 'L1000') {
            pertName = pertName + '-' + object.typeVector.getValue(j);
        }
      if (object.selectedPertSets[assay].has(pertName)) {
        pertIndices.push(j);
        indexVector.setValue(j, true);
      }
    }

    connectionsDataset = new morpheus.SlicedDatasetView(object.cellLineDataset, null, pertIndices);
  }
  var rowIds = getTopRowIds(connectionsDataset);
  var rowIndices = [];
  for (var i = 0, size = rowIds.length; i < size; i++) {
    rowIndices.push(object.idToIndexes[assay].get(rowIds[i]));
  }
  var ds = new morpheus.SlicedDatasetView(object.cellLineDataset, rowIndices, null);
    var heatMap = object.topConnHeatMaps[assay];
    heatMap.promise.then(function () {
        const project = heatMap.getProject();
        project.setRowSortKeys(morpheus.SortKey.keepExistingSortKeys(
            [new morpheus.SortKey('score', morpheus.SortKey.SortOrder.DESCENDING, false)],
            project.getRowSortKeys()), false);
        project.setFullDataset(ds, true);

        if (assay === 'L1000') {
            var heatMaps = object.heatMapSubsets;
            var rowIdsMap = getTopRowIdsMap(connectionsDataset);

            rowIdsMap.forEach(function (rowIds, idx) {
                var rowIndices = [];

                for (var i = 0, size = rowIds.length; i < size; i++) {
                    rowIndices.push(object.idToIndexes[assay].get(rowIds[i]));
                }
                var ds = new morpheus.SlicedDatasetView(object.cellLineDataset, rowIndices, null);
                var heatMap = heatMaps[idx];
                const project1 = heatMap.getProject();
                project1.setRowSortKeys(morpheus.SortKey.keepExistingSortKeys(
                    [new morpheus.SortKey('score', morpheus.SortKey.SortOrder.DESCENDING, false)],
                    project1.getRowSortKeys()), false);
                project1.setFullDataset(ds, true);
            });
        }
        return "done";
    }).catch(function (ee) {
        console.log("Error: ", ee);
        return "done"
    });
}
function getTopRowIds(dataset) {
    var medianVector = dataset.getRowMetadata().add('score');
    var view = new morpheus.DatasetRowView(dataset);
    for (var i = 0; i < medianVector.size(); i++) {
        medianVector.setValue(i, morpheus.Median(view.setIndex(i)));
    }
    var project = new morpheus.Project(dataset);
    project.setRowSortKeys([new morpheus.SortKey('score', morpheus.SortKey.SortOrder.DESCENDING, false)], true);
    dataset = project.getSortedFilteredDataset();

    var ids = [];
    if(dataset.getRowMetadata().getByName('group_by')) {
      var typeToIndices = morpheus.VectorUtil.createValueToIndicesMap(
        dataset.getRowMetadata().getByName('group_by'));
      [0, 1, 2].forEach(function (type) {
        var subset = new morpheus.SlicedDatasetView(dataset, typeToIndices.get(type), null);
        medianVector = subset.getRowMetadata().getByName('score');
        var idVector = subset.getRowMetadata().getByName('id');
        var n = type === 0 ? 5 : 10;
        for (var i = 0; i < n; i++) {
          ids.push(idVector.getValue(i));
        }
        // NaNs are at bottom
        var bottomIds = [];
        for (var i = 0, j = idVector.size() - 1; bottomIds.length < n; i++, j--) {
          if (!isNaN(medianVector.getValue(j))) {
            bottomIds.push(idVector.getValue(j));
          }
        }
        bottomIds.reverse();
        ids = ids.concat(bottomIds);
      });
    }
    else {
        var idVector = dataset.getRowMetadata().getByName('id');
        var n = 20;
        for (var i = 0; i < n; i++) {
          ids.push(idVector.getValue(i));
        }
        // NaNs are at bottom
        var bottomIds = [];
        for (var i = 0, j = idVector.size() - 1; bottomIds.length < n; i++, j--) {
          if (!isNaN(medianVector.getValue(j))) {
            bottomIds.push(idVector.getValue(j));
          }
        }
        bottomIds.reverse();
        ids = ids.concat(bottomIds);
    }
    return ids;
}
function getTopRowIdsMap(dataset) {
  var medianVector = dataset.getRowMetadata().add('score');
  var view = new morpheus.DatasetRowView(dataset);
  for (var i = 0; i < medianVector.size(); i++) {
    medianVector.setValue(i, morpheus.Median(view.setIndex(i)));
  }
  var project = new morpheus.Project(dataset);
  project.setRowSortKeys([new morpheus.SortKey('score', morpheus.SortKey.SortOrder.DESCENDING, false)], true);
  dataset = project.getSortedFilteredDataset();

  var idsMap = [];
  var typeToIndices = morpheus.VectorUtil.createValueToIndicesMap(
    dataset.getRowMetadata().getByName('group_by'));
  [0, 1, 2].forEach(function (type) {
    var ids = [];
    var subset = new morpheus.SlicedDatasetView(dataset, typeToIndices.get(type), null);
    medianVector = subset.getRowMetadata().getByName('score');
    var idVector = subset.getRowMetadata().getByName('id');
    var n = type === 0 ? 5 : 10;
    for (var i = 0; i < n; i++) {
      ids.push(idVector.getValue(i));
    }
    // NaNs are at bottom
    var bottomIds = [];
    for (var i = 0, j = idVector.size() - 1; bottomIds.length < n; i++, j--) {
      if (!isNaN(medianVector.getValue(j))) {
        bottomIds.push(idVector.getValue(j));
      }
    }
    bottomIds.reverse();
    ids = ids.concat(bottomIds);
    idsMap.push(ids);
  });
  return idsMap;
}
function reorderIntrospect(object, assay) {
    var cellLineToInfo = object.cellLineToInfo[assay];
    var clusterBy = object.formBuilders.introspect[assay].getValue('cluster_introspect_data');
    if (clusterBy === 'Each cell line individually') {
        // set order
        cellLineToInfo.forEach(function (value, cell) {
            value.heatMap.getProject().setFullDataset(value.dataset, true);
        });
    } else {
        var dataset = cellLineToInfo.get(clusterBy).dataset;
        var pertIdVector = dataset.getRowMetadata().getByName('id');
        // put other heat maps in this order
        cellLineToInfo.forEach(function (value, cell) {
            var order = [];
            var newPertIdToIndex = morpheus.VectorUtil.createValueToIndexMap(
                value.dataset.getRowMetadata().getByName('id'));
            for (var i = 0; i < pertIdVector.size(); i++) {
                var index = newPertIdToIndex.remove(pertIdVector.getValue(i));
                if (index !== undefined) {
                    order.push(index);
                }
            }
            // add on missing
            newPertIdToIndex.forEach(function (index, pert) {
                order.push(index);
            });

            value.heatMap.getProject().setFullDataset(new morpheus.SlicedDatasetView(value.dataset, order, order), true);
        });

    }
}

function updateTab(object,interpretation,assay) {
  object.$el.find('[data-type=tab]').hide();
  object.$el.find('[data-name=colorscale]').hide();
  // $el is content, loadingEl is sibling
  object.$el.parent().find('[data-name=loading]').show();
  object.$el.find('.display-form').hide();
  var optionText = '';
  var d = null;

  // putting inside "done" is messing with maxHeight stuff
  object.$el.parent().find('[data-name=loading]').hide();
  object.$el.find('[data-name=colorscale][data-assay='+assay+']').fadeIn();
  object.$el.find('[data-type=tab][data-assay='+assay+'][data-interpretation='+interpretation+']').fadeIn();


  if(interpretation==='top') {
    d = updateTopConnections(object,assay);
    optionText = optionText + 'Top Connections ';
  }
  else {
    d = updateIntrospect(object,assay);
    optionText = optionText + 'Introspect ';
  }
  optionText = optionText + '(' + assay + ')';
  object.$el.find('.active-option').text(optionText);
  d.done(function() {
    if(object.formBuilders[interpretation][assay]) {
      object.formBuilders[interpretation][assay].$form.fadeIn();
    }
  }).fail(function() {
    console.log('update function failed');
  });
}

// TODO BW: move show code to here, assay specific pull data, show form builder
function updateTopConnections(object, assay) {
  var d = $.Deferred();
  var $el = object.$el.find('[data-assay='+assay+'][data-interpretation=top]');
  object.activeTopConn = assay;
  if(object.updated.top[assay]) {
    d.resolve();
    return d;
  }
  else {
    var defaultLine = null;
    var rowSize = null;
    var colorScheme = null;
    var rowNames = null;
    if(assay==='L1000') {
      colorScheme = clue.createGutcColorScheme();
      defaultLine = 'Summary';
      rowSize=0;
      rowNames = [
        {
          field: 'empty',
          display: 'text'
        }];
    }
    else {
      colorScheme = clue.ICV.ProteomicsColorScheme;
      defaultLine = 'MCF7';
      rowSize=14;
      rowNames = [
        {
          field: 'score',
          display: ['text']
        }, {
          field: 'name',
          display: 'text'
        }, {
          field: 'moa',
          display: 'text'
        }];
    }
    object.updated.top[assay] = true;
    var promises = [];
    var $top = $el.find('[data-name=top]');
    var $topOne = $el.find('[data-name=topOne]');
    var $topTwo = $el.find('[data-name=topTwo]');
    var $topThree = $el.find('[data-name=topThree]');
    var connData = require('Shared/connData.js');
    connData.getData(object.ids,assay).done(
      function (dataset) {
      var fullDataset = dataset;
      // add description to rows, type to columns
      // separate heat maps for pcl, genetic, compound
      if (object.tokens.length > 1 && !object.showSearchTerms) {
        fullDataset.getColumnMetadata().remove(morpheus.MetadataUtil.indexOf(fullDataset.getColumnMetadata(), 'search' +
          ' term'));
      }
      var tmp = new morpheus.Project(fullDataset);
      tmp.setColumnSortKeys([
        new morpheus.SortKey('type', morpheus.SortKey.SortOrder.DESCENDING, true),
        new morpheus.SortKey('name', morpheus.SortKey.SortOrder.ASCENDING, true),
        new morpheus.SortKey('cell_id', morpheus.SortKey.SortOrder.ASCENDING, true)], true);
      fullDataset = tmp.getSortedFilteredDataset();

      if (object.tokens.length > 1) {
        var pertIdVector = fullDataset.getColumnMetadata().getByName('_id');
        var pertNameVector = fullDataset.getColumnMetadata().getByName('name');
        var searchTermVector = fullDataset.getColumnMetadata().add('search term');
        for (var j = 0; j < pertIdVector.size(); j++) {
          var searchTerms = object.idToSearchTerms.get(pertIdVector.getValue(j).toUpperCase());
          if (pertNameVector.getValue(j) !== searchTerms[0]) {
            object.showSearchTerms = true;
          }
          searchTermVector.setValue(j, searchTerms);
        }
        if (!object.showSearchTerms) {
          $top.addClass('conn-heatmap-no-search-terms');
          fullDataset.getColumnMetadata().remove(morpheus.MetadataUtil.indexOf(fullDataset.getColumnMetadata(), 'search' +
            ' term'));
        }
      }
      else {
        $top.addClass('conn-heatmap-no-search-terms');
      }


      // l1000 specific?
      if(assay==='L1000') {
        object.typeVector = fullDataset.getRowMetadata().getByName('type');
        var groupByVector = fullDataset.getRowMetadata().add('group_by');
        var typeMap = {
          CP: 1,
          PCL: 0
        };
        for (var i = 0, size = object.typeVector.size(); i < size; i++) {
          var type = object.typeVector.getValue(i);
          if (type === 'OE' || type === 'KD') {
            groupByVector.setValue(i, 2);
          } else {
            groupByVector.setValue(i, typeMap[type]);
          }
        }
      }

      object.idToIndexes[assay] = morpheus.VectorUtil.createValueToIndexMap(fullDataset.getRowMetadata().getByName('id'));
      object.cellLineVectors[assay] = fullDataset.getColumnMetadata().getByName('cell_id');
      object.nameVectors[assay] = fullDataset.getColumnMetadata().getByName('name');
      for (var i = 0, size = object.cellLineVectors[assay].size(); i < size; i++) {
        var cell = object.cellLineVectors[assay].getValue(i);
        if (cell === 'summary') {
          object.cellLineVectors[assay].setValue(i, 'Summary');
        }
      }
      var cellLineToIndices = morpheus.VectorUtil.createValueToIndicesMap(object.cellLineVectors[assay]);
      var cellLines = cellLineToIndices.keys();
      cellLines.sort();
      var currentDataset = new morpheus.SlicedDatasetView(fullDataset, null, cellLineToIndices.get(defaultLine));
      var rowIds = getTopRowIds(currentDataset);
      var rowIndices = [];
      for (var i = 0, size = rowIds.length; i < size; i++) {
        rowIndices.push(object.idToIndexes[assay].get(rowIds[i]));
      }

        var ds = new morpheus.SlicedDatasetView(currentDataset, rowIndices, null);

      var utils = require('Shared/utils.js');
      var heatMapOptions = {
        height: -1,
        colorScheme: colorScheme,
        dataset: ds,
        el: $top,
        toolbar: utils.quickMorpheusToolbar({
          saveImage: false
        }),
        rowSize: rowSize,
        rowGapSize: 0,
        columnGapSize: 20,
        columnsSortable: false,
        inlineTooltip: false,
        menu: false,
        renderReady: function (heatMap) {
          heatMap.getHeatMapElementComponent().getColorScheme()
            .getConditions().add({
            series: 'PCL',
            color: '#fdf801',
            shape: 'circle',
            v1: 1,
            v1Op: 'gte',
            inheritColor: false,
            accept: function (val) {
              return val === 1;
            }
          });
        },
        autohideTabBar: true,
        popupEnabled: true,
        columns: [
          {
            field: 'cell_id',
            display: 'text'
          }, {
            field: 'search term',
            display: 'text'
          }, {
            field: 'name',
            colorByField: 'is_index',
            display: ['text']
          }, {
            field: 'type',
            display: ['color']
          }],
        rows: rowNames
      };
      object.selectedCellLineSets[assay] = new morpheus.Set();
      object.selectedCellLineSets[assay].add(defaultLine);
          object.topConnHeatMaps[assay] = new morpheus.HeatMap(heatMapOptions);

          if (assay === 'L1000') {
              var heatMapsOptions = {
                  height: -1,
                  colorScheme: clue.createGutcColorScheme(),
                  dataset: ds,
                  el: $top,
                  toolbar: utils.quickMorpheusToolbar({
                      saveImage: false
                  }),
                  columnGapSize: 20,
                  columnsSortable: false,
                  menu: false,
                  renderReady: function (heatMap) {
                      heatMap.getHeatMapElementComponent().getColorScheme()
                          .getConditions().add({
                          series: 'PCL',
                          color: '#fdf801',
                          shape: 'circle',
                          v1: 1,
                          v1Op: 'gte',
                          inheritColor: false,
                          accept: function (val) {
                              return val === 1;
                          }
                      });
                  },
                  autohideTabBar: true,
                  popupEnabled: true,
                  rowGroupBy: [
                      {
                          field: 'group_by',
                          type: 'annotation'
                      }],
                  rowSortBy: [
                      {
                          field: 'group_by',
                          type: 'annotation',
                          order: 0,
                          lockOrder: 1
                      }, {
                          field: 'score',
                          type: 'annotation',
                          order: 1
                      }],
                  columns: [
                      {
                          field: 'empty',
                          display: ['text']
                      }],
                  rows: [
                      {
                          field: 'score',
                          display: ['text']
                      }, {
                          field: 'type',
                          display: 'color'
                      }, {
                          field: 'name',
                          display: 'text'
                      }, {
                          field: 'description',
                          display: 'text'
                      }]
              };
              object.heatMapSubsets = [];
              // heatMapOptions.columns = [];
              heatMapsOptions.el = $topOne;
              object.heatMapSubsets.push(new morpheus.HeatMap(heatMapsOptions));
              heatMapsOptions.el = $topTwo;
              object.heatMapSubsets.push(new morpheus.HeatMap(heatMapsOptions));
              heatMapsOptions.el = $topThree;
              object.heatMapSubsets.push(new morpheus.HeatMap(heatMapsOptions));
              object.heatMapSubsets.forEach(function (heatMap) {
                  heatMap.on('change', function (e) {
                      if (e.name == 'setMousePosition') {
                          object.topConnHeatMaps[assay].setMousePosition(-1, e.arguments[1], e.arguments[2]);
                      }
                  });
              });
          }


          $el.find("[data-name=tip]").each(function (index) {
              $(this).css("margin-bottom", "15px");
          });
          $el.find("[data-name=toolbar]").each(function (index) {
              $(this).css("height", "0");
          });
          object.formBuilders.top[assay] = new morpheus.FormBuilder({formStyle: 'inline'});
          object.formBuilders.top[assay].append({
              name: 'cell_lines',
              type: 'bootstrap-select',
              multiple: true,
              options: cellLines,
              value: defaultLine
          });

          if (object.ids.length > 1) {
              var pertNames = [];
              for (var i = 0; i < object.nameVectors[assay].size(); i++) {
                  var cellLine = object.cellLineVectors[assay].getValue(i);
                  if (cellLine === defaultLine) {
                      var pertName = object.nameVectors[assay].getValue(i);
                      if (assay === 'L1000') {
                          pertName = pertName + '-' + object.typeVector.getValue(i)
                      }
                      pertNames.push(pertName);
                  }
              }
              pertNames.sort(function (a, b) {
                  a = a.toLowerCase();
                  b = b.toLowerCase();
                  return (a === b ? 0 : (a < b ? -1 : 1));
              });
              object.formBuilders.top[assay].append({
                  name: 'perturbagens',
                  multiple: true,
                  type: 'bootstrap-select',
                  options: pertNames,
                  value: pertNames,
                  selectAll: true
              });
              var $select = object.formBuilders.top[assay].find('perturbagens');
              $select.data('actions-box', 'true');
              $select.selectpicker('selectAll');
              $select.selectpicker('render');
              object.formBuilders.top[assay].append({
                  name: 'group_by',
                  type: 'bootstrap-select',
                  options: ['Cell Line', 'None', 'Perturbagen'],
                  value: 'None'
              });
          }
          object.fullDatasets[assay] = fullDataset;
          const p = updateColumnFilter(object, assay);
          p.then(function () {
              const q = setupTopFormBuilder(object, assay);
              q.then(function () {
                  d.resolve();
                  $el.show();
              }).catch(function (ee) {
                  d.resolve();
                  $el.show();
              });

          }).catch(function (ee) {
              d.resolve();
              $el.show();
          });
    })
    .fail(function () {
      $el.empty();
      $('<span class="extra-info-text">No ' + assay +
        ' connectivity data for the given search terms ' +
        'exist in this version of Command.</span>').appendTo($el);
      d.resolve();
      $el.show();
    });
    return d;
  }
  return;
}



// TODO BW : assay specific pull data, show form builder
function updateIntrospect(object,assay) {
  var d = $.Deferred();
  var $el = object.$el;
  if (object.updated.introspect[assay]) {
    d.resolve();
    return d;
  }
  object.updated.introspect[assay] = true;
  var heatmapRows = [];
  var heatmapColumns = [];
  var cellLines = [];
  var colorScheme = null;
  var defaultLine = 'Summary';
  if (assay === 'L1000') {
    heatmapRows = [
      {
        field: 'type',
        display: 'color'
      }, {
        field: 'name',
        display: 'text'
      }, {
        field: 'search term',
        display: 'text'
      }];
    heatmapColumns = [
      {
        field: 'name',
        display: 'text'
      }, {
        field: 'type',
        display: 'color'
      }];
    cellLines = clue.CORE_CELL_LINES;
    colorScheme = clue.createGutcColorScheme();
  }
  else {
    heatmapRows = [
      {
        field: 'name',
        display: 'text'
      }, {
        field: 'search term',
        display: 'text'
      }];
    heatmapColumns = [
      {
        field: 'name',
        display: 'text'
      }];
    cellLines = clue.PROTEOMICS_CELL_LINES;
    colorScheme = clue.ICV.ProteomicsColorScheme;
  }


  var options = {ids: object.ids};
  var $el = object.$el;
  var cellLineToInfo = object.cellLineToInfo[assay];
  var $introspect = object.$el.find('[data-type=tab][data-assay='+assay+'][data-interpretation=introspect]');
  var showSearchTerms = object.showSearchTerms;

  var maxHeight = 0;
  var maxWidth = 0;

  var html = [];
  html.push('<div style="display: flex;flex-direction: row;">');
  html.push('<div style="margin-right:10px;">');
  html.push('<div style="border:thin' +
    ' solid #E5E6E7; min-width:300px;min-height:200px;"><div style="text-align:' +
    ' center;">Interconnectedness Summary</div><div' +
    ' data-name="quartiles"></div></div>');
  html.push('<div data-cell="Summary" style="border:thin' +
    ' solid #E5E6E7; min-width:300px;min-height:300px;display:' +
    ' inline-block;"><div style="margin-bottom:-20px;text-align:' +
    ' center;">Summary</div></div>');
  html.push('</div>');
  var cellText = '';
  html.push('<div style="display: flex;flex-direction: row;flex-wrap:wrap;">');
  cellLines.forEach(function (cell) {
    cellText = cell + ' (' + clue.CORE_CELL_LINES_LINEAGE[cell] + ')';
    html.push('<div data-cell="' + cell + '" style="border:thin' +
      ' solid #E5E6E7; min-width:300px;min-height:300px;display:' +
      ' inline-block;"><div style="margin-bottom:-20px;text-align: center;">' + cellText + '</div></div>');

  });
  html.push('</div>');
  html.push('</div>');
  $(html.join('')).appendTo($introspect);
  var introspectRemoved = false;

  var promises = [];
  var connData = require('Shared/connData.js');
  connData.filterIds(object.ids,assay).done(function(ids) {
    if(ids.length>1) {
      ['Summary'].concat(cellLines).forEach(function (cell) {
        var $el = $introspect.find('[data-cell=' + cell + ']');
        ids = ids.sort();
        var introspectData = require('Shared/introspectData.js');
        var p = introspectData.get({
          rowIds: ids,
          columnIds: ids,
          cellLine: cell,
          symmetric: true,
          order: true,
          assay: assay
        });
        var def = $.Deferred();
        promises.push(def);
        p.fail(function () {
          $el.remove();
          if (cell === defaultLine) {
            introspectRemoved = true;
          }
          //$el.html('Unable to load');
        });
        p.done(function (ds) {
          if (ds.getColumnCount() === 1) {
            if (cell === defaultLine) {
              introspectRemoved = true;
            }
            $el.append('<div style="text-align: center; position: relative; top: 40%">Insufficient data to show heatmap</div>');
            return;
          }
          var introspectDataset = ds;
          const opts = {};
          if (assay === 'L1000') {


              opts.dataset = introspectDataset;
              opts.fileColumnNamesToInclude = null;
              opts.lines = clue.ICV.L1000_ANNOTATION_LINES_COLUMNS;
              opts.isColumns = true;
              opts.sets = null;
              opts.metadataName = 'id';
              opts.fileColumnName = 'pert_id';
              new morpheus.OpenFileTool().annotate(opts);

              opts.lines = clue.ICV.L1000_ANNOTATION_LINES_ROWS;
              opts.isColumns = false;
              new morpheus.OpenFileTool().annotate(opts);
          }
          else {
              opts.dataset = introspectDataset;
              opts.fileColumnNamesToInclude = null;
              opts.lines = clue.ICV.PROT_ANNOTATION_LINES_COLUMNS;
              opts.isColumns = true;
              opts.sets = null;
              opts.metadataName = 'id';
              opts.fileColumnName = 'pert_id';
              new morpheus.OpenFileTool().annotate(opts);

              opts.lines = clue.ICV.PROT_ANNOTATION_LINES_ROWS;
              opts.isColumns = false;
              new morpheus.OpenFileTool().annotate(opts);

            introspectDataset.getColumnMetadata().getByName('pert_iname').setName('name');
            introspectDataset.getRowMetadata().getByName('pert_iname').setName('name');
          }
          var hcl = new morpheus.HCluster(
            morpheus.HCluster.computeDistanceMatrix(introspectDataset, morpheus.Pearson), morpheus.AverageLinkage);
          introspectDataset = new morpheus.SlicedDatasetView(introspectDataset,
            hcl.reorderedIndices, hcl.reorderedIndices);
          var scrollTop = document.body.scrollTop;
          if (showSearchTerms) {
            var pertIdVector = introspectDataset.getRowMetadata().getByName('id');
            var searchTermVector = introspectDataset.getRowMetadata().add('search term');
            for (var j = 0; j < pertIdVector.size(); j++) {
              // todo bw: rid/cid info is still weird for CCSBBROAD id's
              searchTermVector.setValue(j, object.idToSearchTerms.get(pertIdVector.getValue(j).toUpperCase()));
            }
          }
          var utils = require('Shared/utils.js');
          var heatMap = new morpheus.HeatMap({
            width: -1,
            height: -1,
            el: $el,
            rows: heatmapRows,
            columns: heatmapColumns,
            symmetric: false,
            toolbar: utils.quickMorpheusToolbar({
              saveImage: false
            }),
            menu: false,
            dataset: introspectDataset,
            colorScheme: colorScheme,
            autohideTabBar: true
          });
          if (cell !== 'Summary') {
            object.maxWidth = Math.max(maxWidth, Math.ceil($el.width()));
            object.maxHeight = Math.max(maxHeight, Math.ceil($el.height()));
          }
          if (introspectDataset != null) {
            cellLineToInfo.set(cell, {
              $el: $el,
              heatMap: heatMap,
              dataset: introspectDataset
            });
          }
        });
        p.always(function () {
          def.resolve();
        });
      });
    }
    else {
      introspectRemoved=true;
      var p = $.Deferred();
      promises.push(p);
      p.resolve();
    }
    $.when.apply($, promises).done(function () {
      if (introspectRemoved) {
        $introspect.html('Could not find sufficient ' + assay + ' connectivity data matching your search terms to display internal connectivities.');
        d.resolve();
      }
      else {
        var q25 = [];
        var q50 = [];
        var q75 = [];
        var boxCellLines = [];
        var showQuantiles = false;
        if (cellLineToInfo.has('Summary')) {
          showQuantiles = cellLineToInfo.get('Summary').dataset.getRowCount() > 2;
        }
        ['Summary'].concat(cellLines).forEach(function (cell) {
          if (cellLineToInfo.has(cell)) {
            var ds = cellLineToInfo.get(cell).dataset;
            if (ds != null) {
              var medians = [];
              for (var i = 0; i < ds.getRowCount(); i++) {
                var values = [];
                for (var j = 0; j < ds.getColumnCount(); j++) {
                  var value = ds.getValue(i, j);
                  if (!isNaN(value)) {
                    values.push(value);
                  }
                }
                medians.push(morpheus.ArrayPercentile(values, 50, false));
              }
              // median of medians
              var boxItem = new morpheus.BoxPlotItem(morpheus.VectorUtil.arrayAsVector(medians));
              q50.push(boxItem.median);
              if (showQuantiles) {
                q25.push(boxItem.q1);
                q75.push(boxItem.q3);
              } else {
                q25.push(boxItem.median);
                q75.push(boxItem.median);
              }
              boxCellLines.push(cell);
            }
          }
        });
        var scrollTop = document.body.scrollTop;
        var $quartiles = $introspect.find('[data-name=quartiles]');

        createLineBoxPlot({
          q25: showQuantiles ? q25 : null,
          q50: q50,
          q75: showQuantiles ? q75 : null,
          xaxisLabels: boxCellLines,
          el: $quartiles[0],
          yaxisTitle: 'Connectivity Score',
          assay: assay
        });
        $introspect.find('[data-cell]').each(function () {
          $(this).css({
            width: object.maxWidth,
            height: object.maxHeight,
            'min-width': '',
            'min-height': ''
          });
        });
        // cellLineToInfo.forEach(function (heatMap, cellLine) {
        //   if (heatMap) {
        //     heatMap.getHeatMapElementComponent().getRowPositions().setSize(1);
        //     heatMap.getHeatMapElementComponent().getColumnPositions().setSize(1);
        //     heatMap.revalidate();
        //   }
        // });

        // $quartiles.parent().css({
        //   width: maxWidth,
        //   height: maxHeight
        // });
        document.body.scrollTop = scrollTop;
        // introspectFormBuilder.setValue('file_name', name);
        setupIntrospectFormBuilder(object, cellLines, assay);
        d.resolve();
      }
    })
      .fail(function () {
        if (introspectRemoved) {
          $introspect.html('Could not find sufficient ' + assay + ' connectivity data matching your search terms to display internal connectivities.');
          d.resolve();
        }
      });
  })
    .fail(function () {
      $introspect.html('Could not find matching data for your search terms ' + assay + ' to display internal connectivities.');
      d.resolve();
    });
  return d;
}
