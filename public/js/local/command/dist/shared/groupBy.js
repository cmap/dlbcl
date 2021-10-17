//groupbycommand, shared?
function _renderReady(heatMap, name) {
    heatMap.on('beforeToolShown', function (e) {
        if (e.tool instanceof morpheus.SaveImageTool || e.tool instanceof morpheus.SaveDatasetTool) {
            e.formBuilder.setValue('file_name', name);
        }
    });
}

exports.saveTableByPert = function(dbField, capitalizedField, idToSearchTerms, results, $table, fileName) {
    $table.empty();
    var table = new tablelegs.Table({
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
                field: 'pert_id',
                name: 'Perturbagen Id'
            }, {
                field: 'pert_iname',
                name: 'Name'
            }, {
                name: 'Search Term',
                getter: function (item) {
                    return idToSearchTerms.get(item.pert_id);
                }
            }, {
                field: dbField,
                name: capitalizedField
            }],
        items: results
    });
    if (!morpheus.Util.endsWith(fileName.toLowerCase(), '.txt')) {
        fileName += '.txt';
    }
    var blob = new Blob([table.toText()], {
        type: "text/plain;charset=utf-8"
    });
    saveAs(blob, fileName, true);
};

exports.saveTableByGroupby = function(dbField, capitalizedField, results, $table, fileName) {
    var groupedKeyToItems = new morpheus.Map();
    var maxPertCount = 0;
    for (var i = 0, n = results.length; i < n; i++) {
        var result = results[i];
        var keys = result[dbField] || [];
        for (var j = 0, nkeys = keys.length; j < nkeys; j++) {
            var key = keys[j];
            var items = groupedKeyToItems.get(key);
            if (items === undefined) {
                items = [];
                groupedKeyToItems.set(key, items);
            }
            items.push(result);
            maxPertCount = Math.max(items.length, maxPertCount);
        }
    }
    var groupedValues = groupedKeyToItems.keys();
    groupedValues.sort(function (a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        return (a === b ? 0 : (a < b ? -1 : 1));
    });
    $table.empty();
    var table = new tablelegs.Table({
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
                name: capitalizedField,
                getter: function (item) {
                    return item;
                }
            }, {
                name: 'Perturbagen Count',
                dataType: 'number',
                getter: function (item) {
                    return groupedKeyToItems.get(item).length;
                }
            }, {
                field: 'pert_id',
                name: 'Perturbagen Id',
                getter: function (item) {
                    return groupedKeyToItems.get(item).map(function (pert) {
                        return pert.pert_id;
                    });
                }
            }, {
                field: 'pert_iname',
                name: 'Name',
                getter: function (item) {
                    return groupedKeyToItems.get(item).map(function (pert) {
                        return pert.pert_iname;
                    });
                }
            }],
        items: groupedValues
    });
    if (!morpheus.Util.endsWith(fileName.toLowerCase(), '.txt')) {
        fileName += '.txt';
    }
    var blob = new Blob([table.toText()], {
        type: "text/plain;charset=utf-8"
    });
    saveAs(blob, fileName, true);
};

exports.saveHeatmapSvg = function(heatMap, fileName, $el) {
    if (!morpheus.Util.endsWith(fileName.toLowerCase(), '.svg')) {
        fileName += '.svg';
    }
    heatMap.saveImage(fileName, 'svg');
};

exports.createGroupedHeatMap = function(results, groupByField, options, cb) {
    var $heatMap = $('<div></div>');
    $heatMap.appendTo(options.$el.find('[data-section="main"]'));
    var $launchBar = options.$el.find('[data-section="launchBar"]');

    var idToSearchTerms = options.idToSearchTerms;
    var command = options.object.truncatedCommand;
    var commandName = options.command;
    var allSearchTerms = new Set();
    if(idToSearchTerms) {
        var vals = idToSearchTerms.values();
        for (i = 0; i < vals.length; i++) {
            vals[i].forEach(function(val) {
                allSearchTerms.add(val);
            });
        }
    }

    // creating name row/column vectors, and putting values in matrix
    var geneToIndex = new morpheus.Map();
    var geneToCount = new morpheus.Map();
    var pertToIndex = new morpheus.Map();
    var matrix = [];
    var pertIdToItem = new morpheus.Map();
    for (i = 0; i < results.length; i++) {
        var item = results[i];
        var pertIndex = pertToIndex.get(item.pert_id);
        pertIdToItem.set(item.pert_id, item);
        if (pertIndex === undefined) {
            pertIndex = pertToIndex.size();
            matrix[pertIndex] = [];
            pertToIndex.set(item.pert_id, pertIndex);
        }
        var vals = item[groupByField];
        var idList = [];
        if (vals != null) {
            vals.forEach(function (id) {
                if(id==='TS_v1.1') {
                    id='L1000 (TS v1.1)';
                }
                if (commandName==='assay' && (id!='L1000 (TS v1.1)' && id!='GCP' && id!='P100')) {
                  // pass
                }
                else {
                  idList.push(id);
                  var geneIndex = geneToIndex.get(id);
                  if (geneIndex === undefined) {
                    geneIndex = geneToIndex.size();
                    geneToIndex.set(id, geneIndex);
                    geneToCount.set(id, 0);
                  }
                  geneToCount.set(id, geneToCount.get(id) + 1);
                  if (allSearchTerms.has(id) || allSearchTerms.has(item.pert_id) || allSearchTerms.has(item.pert_iname)) {
                    matrix[pertIndex][geneIndex] = 2;
                  }
                  else {
                    matrix[pertIndex][geneIndex] = 1;
                  }
                }
            });
        }
        if (commandName==='assay') {
          item['assay'] = idList;
          delete item.pert_icollection;
        }
    }
    if (matrix.length === 0) {
        return cb('No data available');
    }
    // perts on rows, moas/targets on columns
    var dataset = new morpheus.Dataset({
        rows: pertToIndex.size(),
        columns: geneToIndex.size(),
        array: matrix
    });
    dataset = new morpheus.TransposedDatasetView(dataset);
    for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
        for (var j = 0, ncols = dataset.getColumnCount(); j < ncols; j++) {
            if (!dataset.getValue(i, j)) {
                dataset.setValue(i, j, 0);
            }
        }
    }

  // turning name vectors to indexed vectors, also making color/font models
    var pertIdVector = dataset.getColumnMetadata().add('id');
    pertToIndex.forEach(function (index, id) {
        pertIdVector.setValue(index, id);
    });
    var groupByColorObject = {};
    var searchTermFonts = {};
    var geneIdVector = dataset.getRowMetadata().add(groupByField);
    var maxGroupByLength = 0;
    geneToIndex.forEach(function (index, id) {
        if(id.length>maxGroupByLength) {
            maxGroupByLength = id.length;
        }
        geneIdVector.setValue(index, id);
        if(allSearchTerms.has(id)) {
            groupByColorObject[id] = "#000000";
            searchTermFonts[id] = {"weight":"900"};
        }
        else {
            groupByColorObject[id] = "#666666";
        }
    });
    var nameVector = dataset.getColumnMetadata().add('name');
    var typeVector = dataset.getColumnMetadata().add('type');
    var pertColorObject = {};
    var maxPertLength = 0;
    for (var j = 0, size = pertIdVector.size(); j < size; j++) {
        var id = pertIdVector.getValue(j);
        var item = pertIdToItem.get(id);
        if(item.pert_iname.length>maxPertLength) {
            maxPertLength=item.pert_iname.length;
        }
        nameVector.setValue(j, item.pert_iname);
        typeVector.setValue(j, item.pert_type);
        if(allSearchTerms.has(item.pert_id) || allSearchTerms.has(item.pert_iname)) {
            pertColorObject[item.pert_iname] = "#000000";
            searchTermFonts[item.pert_iname] = {"weight":"900"};
        }
        else {
            pertColorObject[item.pert_iname] = "#666666";
        }
    }

    var searchTermNames = [];
    if (idToSearchTerms) {
        for (var j = 0, size = pertIdVector.size(); j < size; j++) {
            var id = pertIdVector.getValue(j);
            var searchTermsArray = idToSearchTerms.get(id);
            searchTermsArray.forEach(function(name) {
                if(!geneToIndex.has(name) && !pertToIndex.has(name) && nameVector.array.indexOf(name)<0) {
                    var searchVector = dataset.getColumnMetadata().getByName(name);
                    if (!dataset.getColumnMetadata().getByName(name)) {
                        searchVector = dataset.getColumnMetadata().add(name);
                        searchTermNames.push({
                            field: name,
                            display: 'shape',
                            highlightMatchingValues: true,
                            header: {font:{weight:900}},
                            size: {height:18}
                        });
                    }
                    searchVector.setValue(j, 1);
                }
            });
        }
    }

    function addCounts(d) {
        var countVector = d.getRowMetadata().add(' ');
        for (var i = 0; i < d.getRowCount(); i++) {
            var count = 0;
            for (var j = 0; j < d.getColumnCount(); j++) {
                if (d.getValue(i, j) > 0) {
                    count++;
                }
            }
            countVector.setValue(i, count);
        }
    }

    if (dataset.getRowCount() > 1) {
        addCounts(dataset);
    }
    else if (dataset.getRowCount()===0) {
      options.$el.empty();
      options.$el.append('<div class="text-18 pad-top-32"><p>No ' + options.lcField + ' annotations for your search term(s) were found.</p></div>');
      cb(null, options.$el);
    }

    if (dataset.getColumnCount() > 1) {
      addCounts(new morpheus.TransposedDatasetView(dataset));
    }


    var rowHcl = new morpheus.HCluster(
        morpheus.HCluster.computeDistanceMatrix(dataset, morpheus.Jaccard), morpheus.AverageLinkage);
    var columnHcl = new morpheus.HCluster(
        morpheus.HCluster.computeDistanceMatrix(new morpheus.TransposedDatasetView(dataset), morpheus.Jaccard), morpheus.AverageLinkage);
    dataset = new morpheus.SlicedDatasetView(dataset, rowHcl.order, columnHcl.order);

    var columnMetadata = [
        {
            field: 'name',
            display: ['text','text_and_color','text_and_font'],
            header: {font:{weight:300}}
        }];
    var utils = require('Shared/utils.js');
    var toolbar = utils.quickMorpheusToolbar({
      saveImage: false
    });
  columnMetadata = columnMetadata.concat(searchTermNames);

  var heatMap = null;
  if(commandName==='assay') {
    dataset = new morpheus.TransposedDatasetView(dataset);
    morpheus.MetadataUtil.renameFields(dataset, {'rows':[{
      field : ' ',
      renameTo : 'Assay count'
    }]});
    columnMetadata = columnMetadata.concat({
      field: 'Assay count',
      display: 'text'
    });
    var object = options.object;
    options.object.dataset = dataset;
    object.pertNameVector = dataset.getRowMetadata().getByName('name');
    object.assayVector = dataset.getColumnMetadata().add('assay');
    var groupbyVector = dataset.getColumnMetadata().getByName(groupByField);
    for(var i=0; i<groupbyVector.size(); i++) {
      object.assayVector.setValue(i, groupbyVector.getValue(i));
    }
    object.assayVector = dataset.getColumnMetadata().getByName(groupByField);
    groupByField = 'assay';
    object.dbField = 'assay';
    var assays = object.assayVector.array;
    options.object.selectedAssays = new morpheus.Set();
    assays.forEach(function(assay) {
      options.object.selectedAssays.add(assay);
    });
    options.object.showIntersection = false;

    // need a form that lists all assays
    var formBuilder = new morpheus.FormBuilder({formStyle: 'inline'});
    options.object.formBuilder = formBuilder;
    options.object.displayOptions = true;

    formBuilder.append({
      name: 'assays',
      multiple: true,
      type: 'bootstrap-select',
      options: assays,
      value: assays,
      selectAll: true
    });
    formBuilder.append({
      name: 'show_compounds_shared_between_selected_assays',
      type: 'checkbox',
      value: options.object.showIntersection
    });
    var idCount = dataset.getColumnMetadata().add('count');
    geneToIndex.forEach(function (index, id) {
      idCount.setValue(index, geneToCount.get(id)+'');
    });
    heatMap = new morpheus.HeatMap({
      toolbar: toolbar,
      menu: false,
      popupEnabled: false,
      autohideTabBar: true,
      inlineTooltip: false,
      el: $heatMap,
      columns: [
        {
          field: ' ',
          display: 'bar'
        }, {
          field: 'count',
          display: 'text'
        }, {
          field: groupByField,
          display: ['text', 'text_and_color', 'text_and_font']
        }],
      rows: columnMetadata,
      renderReady: function (heatMap) {
        heatMap.getHeatMapElementComponent().getColorScheme()
          .getConditions().add({
          series: dataset.getName(),
          shape: 'circle',
          v1: 1,
          v1Op: 'gte',
          inheritColor: true,
          accept: function (val) {
            return val > 0;
          }
        });
        _renderReady(heatMap, command);
      },
      colorScheme: {
        type: 'fixed',
        missingColor: 'white',
        map: [
          {
            value: 0,
            color: 'white'
          }, {
            value: 1,
            color: 'rgb(116,146,155)'
          },
          {
            value: 2,
            color: 'rgb(2,55,72)'
          }]
      },
      rowColorModel: {'name': pertColorObject},
      columnColorModel: {groupByField: groupByColorObject},
      columnFontModel: {groupByField: searchTermFonts},
      rowFontModel: {'name': searchTermFonts},
      dataset: dataset
    });
    heatMap.promise.then(function(){
        var oldProvider = heatMap.tooltipProvider;
        heatMap.tooltipProvider = function (heatMap, rowIndex, columnIndex, options, separator, quick, tipText) {
            if (rowIndex !== -1 && columnIndex !== -1) {
            }
            else {
                oldProvider(heatMap, rowIndex, columnIndex, options, separator, quick, tipText)
            }
        };
        heatMap.getProject().setRowSortKeys([
            new morpheus.SortKey('Assay count',
                morpheus.SortKey.SortOrder.DESCENDING)], true);
        heatMap.getProject().getRowSelectionModel().on('selectionChanged', function (e) {
            var selection = utils.getHeatMapSelection(heatMap,'name',true);
            utils.showLaunchOptions(selection, 'pert', $launchBar, options.object.commandName, options.object.tabManager);
        });
        heatMap.getProject().getColumnSelectionModel().on('selectionChanged', function (e) {
            var selection = utils.getHeatMapSelection(heatMap,groupByField,false);
            utils.showLaunchOptions(selection, groupByField, $launchBar, options.object.commandName, options.object.tabManager);
        });
        return cb(null, heatMap);
    }).catch(function(ee){
        console.log(ee);
        return cb(ee);
    });
  }
  else {
    columnMetadata = columnMetadata.concat(searchTermNames);
    columnMetadata = columnMetadata.concat([{
      field: ' ',
      display: 'bar'
    }]);
    var geneIdFraction = dataset.getRowMetadata().add('count');
    var search = require('Shared/search.js');
    search.getSearchTermCountsNoGenetic(geneIdVector.array, {type: 'pert'})
      .done(function (results) {
        var entireMoaCounts = results.searchTermCounts;
        // geneToIndex, geneToCount, entireMoaCounts
        geneToIndex.forEach(function (index, id) {
          var fraction = geneToCount.get(id) + '/' + entireMoaCounts.get(id);
          geneIdFraction.setValue(index, fraction);
        });
        heatMap = new morpheus.HeatMap({
          toolbar: toolbar,
          menu: false,
          popupEnabled: false,
          autohideTabBar: true,
          inlineTooltip: false,
          el: $heatMap,
          rows: [
            {
              field: ' ',
              display: 'bar'
            }, {
              field: 'count',
              display: 'text'
            }, {
              field: groupByField,
              display: ['text', 'text_and_color', 'text_and_font']
            }],
          columns: columnMetadata,
          renderReady: function (heatMap) {
            heatMap.getHeatMapElementComponent().getColorScheme()
              .getConditions().add({
              series: dataset.getName(),
              shape: 'circle',
              v1: 1,
              v1Op: 'gte',
              inheritColor: true,
              accept: function (val) {
                return val > 0;
              }
            });
            _renderReady(heatMap, command);
          },
          colorScheme: {
            type: 'fixed',
            missingColor: 'white',
            map: [
              {
                value: 0,
                color: 'white'
              }, {
                value: 1,
                color: 'rgb(116,146,155)'
              },
              {
                value: 2,
                color: 'rgb(2,55,72)'
              }]
          },
          columnColorModel: {'name': pertColorObject},
          rowColorModel: {groupByField: groupByColorObject},
          rowFontModel: {groupByField: searchTermFonts},
          columnFontModel: {'name': searchTermFonts},
          dataset: dataset
        });
          heatMap.promise.then(function() {
              var oldProvider = heatMap.tooltipProvider;
              heatMap.tooltipProvider = function (heatMap, rowIndex, columnIndex, options, separator, quick, tipText) {
                  if (rowIndex !== -1 && columnIndex !== -1) {
                  } else {
                      oldProvider(heatMap, rowIndex, columnIndex, options, separator, quick, tipText)
                  }
              };
              heatMap.getProject().getRowSelectionModel().on('selectionChanged', function (e) {
                  var selection = utils.getHeatMapSelection(heatMap, groupByField, true);
                  utils.showLaunchOptions(selection, groupByField, $launchBar, options.object.commandName, options.object.tabManager);
              });
              heatMap.getProject().getColumnSelectionModel().on('selectionChanged', function (e) {
                  var selection = utils.getHeatMapSelection(heatMap, 'name', false);
                  utils.showLaunchOptions(selection, 'pert', $launchBar, options.object.commandName, options.object.tabManager);
              });
              utils.showLaunchOptions([], groupByField, $launchBar, options.object.commandName, options.object.tabManager);
              return cb(null, heatMap);
          }).catch(function(ee){
              return cb(ee);
          });
      });
  }
};

// function executeExport(dbField, capitalizedField, idToSearchTerms, results, $table, heatMap, $el) {
function executeExport(object) {
    var $table = object.$el.find('[data-name=table]');
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
            exports.saveHeatmapSvg(object.heatMap, fileName, object.$el);

        }
        else if(inputType==1) {
            exports.saveTableByPert(object.dbField, object.capitalizedField, object.idToSearchTerms, object.tempResults, $table, fileName);
        }
        else {
            exports.saveTableByGroupby(object.dbField, object.capitalizedField, object.tempResults, $table, fileName);
        }
        $el.find('.export-modal').modal('hide');
    }
}
function setupDisplayOptions(object) {
  formBuilder = object.formBuilder;

  var $select = formBuilder.find('assays');
  $select.data('actions-box', 'true');
  $select.selectpicker('selectAll');
  $select.selectpicker('render');
  // todo bw fix up styling?
  formBuilder.$form.find('label').addClass('display-label');
  formBuilder.$form.find('.bootstrap-select').addClass('display-selector-button');
  formBuilder.$form.appendTo(object.$el.find('.header-display-options'));
  formBuilder.find('show_compounds_shared_between_selected_assays').on('change', object, function (e) {
    e.data.showIntersection = e.data.formBuilder.getValue('show_compounds_shared_between_selected_assays');
    updateRowFilter(e.data);
  });
  formBuilder.find('assays').on('change', object, function (e) {
    e.data.selectedAssays = new morpheus.Set();
    var values = e.data.formBuilder.getValue('assays');
    if (values != null) {
      values.forEach(function (value) {
        e.data.selectedAssays.add(value);
      });
    }
    updateRowFilter(e.data);
  });
}
function setupExportOptions(object) {
  var $el = object.$el;
  $el.find('.command-out-links').show();
  var $exportOptions = $el.find('.export-options');
  var exportOptionsHtml = '<input type="radio" name="exportType" value="0" class="export-radio">' +
    'Export the association matrix currently displayed as an image (.svg)</input><br>' +
    '<input type="radio" name="exportType" value="1" class="export-radio">' +
    'Export the data as a tab-delimited text file, grouped by perturbagen (.txt)</input><br>' +
    '<input type="radio" name="exportType" value="2" class="export-radio">' +
    'Export the data as a tab-delimited text file, grouped by ' + object.lcField + ' (.txt)</input><br>';
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

function setupHeader(object) {
    if(object.displayOptions) {
      setupDisplayOptions(object);
    }
    setupExportOptions(object);
}

exports.groupByShow = function (options) {
    var dbField = options.dbField;
    options.object.dbField = dbField;
    var lcField = options.lcField;
    options.object.lcField = lcField;
    var capitalizedField = options.capitalizedField;
    options.object.capitalizedField = capitalizedField;
    var ids = options.ids;
    var idToSearchTerms = options.idToSearchTerms;
    var $el = options.$el;
    var d = $.Deferred();
    $.ajax(clue.API_URL + '/api/perts?filter=' + JSON.stringify({
            fields: ['pert_id', 'pert_iname', dbField],
            where: {
                pert_type: 'trt_cp',
                pert_id: {inq: ids}
            }
        })).done(function (results) {
          if(results.length===0) {
            options.$el.append('<div class="text-18 pad-top-32"><p>No small-molecule compounds matching your search terms were found.</p></div>');
            d.resolve();
          }
          else {
            var $row = $('<div class="row">' +
              '<div class="col-md-9 col-sm-8" data-section="main"></div>' +
              '<div class="col-md-3 col-sm-4"><div class="launch-panel" data-section="launchBar">' +
              '<h3>Nothing selected</h3><br><hr>Select a row/column to see additional options</div></div>' +
              '</div>');
            $row.appendTo(options.$el);
            var $mainEl = $row.find('[data-section="main"]');

            options.object.$topEl = $('<div></div>');
            if (options.command != 'assay') {
              var helpText = "The <i>'count'</i> field indicates the number of <b>displayed compounds</b> with a certain annotation <b>relative to all perturbagens</b> in Touchstone with the same annotation.";
              var $helpEl = $('<div class="extra-info-text">' + helpText + '</div>');
              $helpEl.appendTo(options.object.$topEl);
            }
            options.object.$topEl.appendTo($mainEl);

            results.sort(function (r1, r2) {
              var a = r1.pert_iname.toLowerCase();
              var b = r2.pert_iname.toLowerCase();
              return (a === b ? 0 : (a < b ? -1 : 1));
            });

            exports.createGroupedHeatMap(results, dbField, options, function (err, result) {
              if (err) {
                return d.reject(
                  'No compounds with the specified ' + lcField + (ids.length === 1 ? '' : 's') + ' found in database.');
              } else {
                var object = options.object;
                object.heatMap = result;
                object.results = results;
                object.tempResults = results;
                object.idToSearchTerms = idToSearchTerms;
                setupHeader(options.object);
                d.resolve();
              }
            });
          }
    });
    return d;
};

function updateRowFilter(object) {
  var columnIndices = null;
  var heatMap = object.heatMap;
  if (object.selectedAssays != null && object.selectedAssays.size() > 0) {
    columnIndices = [];
    for (var j = 0; j < object.assayVector.size(); j++) {
      if (object.selectedAssays.has(object.assayVector.getValue(j))) {
        columnIndices.push(j);
      }
    }
  }
  var ds = new morpheus.SlicedDatasetView(object.dataset, null, columnIndices);
  heatMap.getProject().setRowSortKeys(morpheus.SortKey.keepExistingSortKeys(
    [new morpheus.SortKey('assay', morpheus.SortKey.SortOrder.ASCENDING, false)],
    heatMap.getProject().getRowSortKeys()), false);
  heatMap.getProject().setFullDataset(ds, true);
  if(!columnIndices) {
    object.tempResults = object.results;
    return;
  }

  var rowIndices = null;
  object.tempResults = [];
  if (object.showIntersection) {
    rowIndices = [];
    for (var i = 0; i < object.pertNameVector.size(); i++) {
      var foundAllAssays = true;
      for (var j = 0; j < columnIndices.length; j++) {
        if (object.dataset.getValue(i,columnIndices[j])===0) {
          foundAllAssays = false;
        }
      }
      if(foundAllAssays) {
        rowIndices.push(i);
        object.tempResults.push(object.results[i])
      }
    }
  }
  else {
    rowIndices = [];
    for (var i = 0; i < object.pertNameVector.size(); i++) {
      var foundAssays = false;
      for (var j = 0; j < columnIndices.length; j++) {
        if (object.dataset.getValue(i,columnIndices[j])>0) {
          foundAssays = true;
        }
      }
      if(foundAssays) {
        rowIndices.push(i);
        object.tempResults.push(object.results[i])
      }
    }
  }

  ds = new morpheus.SlicedDatasetView(ds, rowIndices, null);
  heatMap.getProject().setRowSortKeys(morpheus.SortKey.keepExistingSortKeys(
    [new morpheus.SortKey('name', morpheus.SortKey.SortOrder.ASCENDING, false)],
    heatMap.getProject().getRowSortKeys()), false);
  heatMap.getProject().setFullDataset(ds, true);


  // object.cellLineDataset = new morpheus.SlicedDatasetView(object.fullDataset, null, columnIndices);
  // var indexVector = object.cellLineDataset.getColumnMetadata().add('is_index');
  // var connectionsDataset = object.cellLineDataset;
  // if (object.selectedPerts != null && object.selectedPerts.size() > 0) {
  //   // pick refererence perts
  //   var currentDatasetTypeVector = object.cellLineDataset.getColumnMetadata().getByName('type');
  //   var currentDatasetNameVector = object.cellLineDataset.getColumnMetadata().getByName('name');
  //   var pertIndices = [];
  //   for (var j = 0; j < object.cellLineDataset.getColumnCount(); j++) {
  //     pertName = currentDatasetNameVector.getValue(j) + '-' + currentDatasetTypeVector.getValue(j);
  //     if (object.selectedPerts.has(pertName)) {
  //       pertIndices.push(j);
  //       indexVector.setValue(j, true);
  //     }
  //   }
  //
  //   connectionsDataset = new morpheus.SlicedDatasetView(object.cellLineDataset, null, pertIndices);
  // }
  //
  // var rowIds = getTopRowIds(connectionsDataset);
  // var rowIndices = [];
  // for (var i = 0, size = rowIds.length; i < size; i++) {
  //   rowIndices.push(object.idToIndex.get(rowIds[i]));
  // }
  // var ds = new morpheus.SlicedDatasetView(object.cellLineDataset, rowIndices, null);
  // heatMap.getProject().setRowSortKeys(morpheus.SortKey.keepExistingSortKeys(
  //   [new morpheus.SortKey('score', morpheus.SortKey.SortOrder.DESCENDING, false)],
  //   heatMap.getProject().getRowSortKeys()), false);
  // heatMap.getProject().setFullDataset(ds, true);
  //
  // var heatMaps = object.heatMaps;
  // var rowIdsMap = getTopRowIdsMap(connectionsDataset);
  // rowIdsMap.forEach(function(rowIds,idx) {
  //   var rowIndices = [];
  //   var heatMap = heatMaps[idx];
  //   for (var i = 0, size = rowIds.length; i < size; i++) {
  //     rowIndices.push(object.idToIndex.get(rowIds[i]));
  //   }
  //   var ds = new morpheus.SlicedDatasetView(object.cellLineDataset, rowIndices, null);
  //   heatMap.getProject().setRowSortKeys(morpheus.SortKey.keepExistingSortKeys(
  //     [new morpheus.SortKey('score', morpheus.SortKey.SortOrder.DESCENDING, false)],
  //     heatMap.getProject().getRowSortKeys()), false);
  //   heatMap.getProject().setFullDataset(ds, true);
  // });
}