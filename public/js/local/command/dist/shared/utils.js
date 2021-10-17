
//creategroupedheatmap, conn, tas, sar
exports.quickMorpheusToolbar = function(options) {
    options = options || {};
    return $.extend({}, {
        dimensions: false,
        zoom: false,
        searchRows: false,
        searchColumns: false,
        searchValues: false,
        options: false,
        saveImage: true,
        filter: false,
        colorKey: false
    }, options);
};

exports.getCommandHeader = function(title, tabId, showExport) {
    if(title.length>100) {
      title = title.slice(0,100)+' ...';
    }

    var exportHtml = '';
    var modalHtml = '';
    if(showExport) {
      var modalId = 'export-' + tabId;
        exportHtml = '<button type="button" data-toggle="modal" data-target="#' + modalId + '" class="export-btn">' +
            '<i class="fa fa-floppy-o">&nbsp;&nbsp;</i>' +
            '&nbsp;Export as... &nbsp;&nbsp;' +
            '</button>';
        // exportHtml = '<div class="btn-group">' +
        // '<button type="button" data-toggle="modal" data-target="#' + modalId + '" class="btn btn-sm export-btn"> <i class="fa fa-floppy-o"></i><span class="hidden-xs hidden-sm">Export as...</span></button>' +
        // '</div>';
        modalHtml = '<div id="' + modalId + '" role="dialog" aria-labelledby="contactModal" aria-hidden="true" class="modal fade in export-modal">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +
            '<form>' +
            '<div class="modal-body">' +
            '<div class="row">' +
            '<p class="export-title">Export Options:</p>' +
            '<div class="col-xs-12 export-options"></div>' +
            '</div>' +
            '<div class="row pad-bottom-12">' +
            '<hr/>' +
            '<div class="col-xs-12 text-center">' +
            '<input type="text" placeholder="Enter your filename here (e.g. &quot;command_output&quot;)" class="export-filename-prompt"/>' +
            '</div>' +
            '<div class="col-xs-12 text-center pad-bottom-12">' +
            '<button type="button" class="export-btn-cancel">Cancel</button>' +
            '<button type="button" class="export-btn-confirm">Export</button>' +
            '</div>' +
            '<div class="col-xs-12 export-pending"></div>' +
            '<div class="col-xs-12 text-warning export-warning"></div>' +
            '</div>' +
            '</div>' +
            '</form>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    return $(modalHtml + '<div class="command-header">' +
        '<div class="row pad-top-4 pad-bottom-8 commandline-tab-header">' +
      '<div class="col-xs-8">' +
        '<div class="commandline-tab-title">' + title + '</div>' +
        '</div>' +
      '<div class="col-xs-4 pad-top-8">' +
        '<div class="init-hide input-interpretation">' +
        '<span class="dropdown pull-right">' +
      '<button type="button" data-toggle="dropdown" class="dropdown-toggle dropdown-button">' +
      '<span class="pull-left active-option">Input Interpretation</span>' +
        '<span class="pull-right caret"></span>' +
        '</button>' +
      '<ul class="dropdown-menu dropdown-menu-right input-interpretation-options"></ul>' +
        '</span>' +
        '</div>' +
      '</div>' +
        '</div>' +
        '<div class="row pad-bottom-8 commandline-tab-header-options">' +
        '<div class="col-xs-8 header-display-options">' +
      '</div>' +
        '<div class="col-xs-4">' +
        '<div class="pull-right command-out-links init-hide">' + exportHtml + '</div>' +
        '</div>' +
        '</div>' +
        '</div>');

// return $(modalHtml + '<div class="full-width-section">' +
//     '<div class="row app-tab-header">' +
//     '<div class="col-xs-12 col-sm-8">' +
//     '<div class="app-tab-title">' + title + '</div>' +
//     '</div>' +
//     '<div class="col-xs-7 col-sm-4">' +
//     '<div class="btn-toolbar pad-top-8" role="toolbar">' +
//     '<div class="btn-group dropdown-with-headings subheading-options pull-right-sm pull-right-md pull-right-lg">' +
//     //this part goes off screen easily and doesn't generate options, so using old version
//     //'<label class="pull-left visible-lg">Input interpretation:</label>' +
//     '<button type="button" data-toggle="dropdown" class="dropdown-toggle dropdown-button">' +
//     '<span class="pull-left active-option">Input Interpretation</span>' +
//     '<span class="pull-right caret"></span>' +
//     '</button>' +
//     '<ul class="dropdown-menu dropdown-menu-right input-interpretation-options"></ul>' +
//     '</div>' +
//     '</div>' +
//     '</div>' +
//     '<div class="col-xs-5 col-sm-3 col-sm-push-9 col-md-4 col-md-push-8">' +
//     '<div class="pad-top-8 visible-xs"></div>' +
//     '<div class="btn-toolbar pull-right command-out-links init-hide" role="toolbar">' +
//     exportHtml +
//     '</div>' +
//     '</div>' +
//     //start here
//     '</div>' +
//     '</div>' +
//     '');
//
// var x = $('<div class="full-width-section">\n' +
//     '  <div class="row app-tab-header">\n' +
//     '    <div class="col-xs-12 col-sm-8">\n' +
//     '      <div class="app-tab-title">Top connections for BRAF</div>\n' +
//     '    </div>\n' +
//
//
//     '    <div class="col-xs-7 col-sm-4">\n' +
//     '      <div class="btn-toolbar pad-top-8" role="toolbar">\n' +
//     '        <div class="btn-group dropdown-with-headings subheading-options pull-right-sm pull-right-md pull-right-lg">\n' +
//     '          <label class="pull-left visible-lg">Input interpretation:</label>\n' +
//     '          <button class="btn dropdown-toggle dropdown-toggle pull-right" type="button" data-toggle="dropdown"><span class="active-option pull-left">Top connections (L1000)</span><span class="caret"></span></button>\n' +
//
//
//
//
//
//     '          <ul class="dropdown-menu pos-right-sm" role="menu">\n' +
//     '            <h6>Top connections</h6>\n' +
//     '            <p>\n' +
//     '              Show top connections between\n' +
//     '              selected perturbagens and the\n' +
//     '              reference Touchstone dataset\n' +
//     '            </p>\n' +
//     '            <li><a class="active">Gene expression (L1000)</a></li>\n' +
//     '            <li><a>Histone profiling (GCP)</a></li>\n' +
//     '            <li><a>Phosphoproteomics (P100)</a></li>\n' +
//     '            <li class="divider"></li>\n' +
//     '            <h6>Introspect</h6>\n' +
//     '            <p>View internal connectivities between selected perturbagens</p>\n' +
//     '            <li class="disabled"><a>Gene expression (L1000)\n' +
//     '                <p>(No data available)</p></a></li>\n' +
//     '            <li><a>Histone profiling (GCP)</a></li>\n' +
//     '            <li><a>Phosphoproteomics (P100)</a></li>\n' +
//     '          </ul>\n' +
//
//
//
//
//
//     '        </div>\n' +
//     '      </div>\n' +
//     '    </div>\n' +
//
//
//
//
//
//     '    <div class="col-xs-5 col-sm-3 col-sm-push-9 col-md-4 col-md-push-8">\n' +
//     '      <div class="pad-top-8 visible-xs"></div>\n' +
//     '      <div class="btn-toolbar pull-right" role="toolbar">\n' +
//     '        <label class="pull-left btn-sm hidden-xs hidden-sm">See all connections: </label>\n' +
//     '        <button class="btn btn-sm btn-send-to-app"><i class="fa fa-align-left"></i></button>\n' +
//     '        <button class="btn btn-sm btn-send-to-app"><i class="fa fa-th"></i></button>\n' +
//     '        <div class="btn-group">\n' +
//     '          <button class="btn btn-sm"> <i class="fa fa-floppy-o"></i><span class="hidden-xs hidden-sm">Export as...</span></button>\n' +
//     '        </div>\n' +
//     '      </div>\n' +
//     '    </div>\n' +
//
//
//
//     //stopped here
//
//     '    <div class="col-xs-12 col-sm-9 col-sm-pull-3 col-md-8 col-md-pull-4">\n' +
//     '      <div class="pad-top-8 visible-xs"></div>\n' +
//     '      <div class="btn-toolbar labels-first" role="toolbar">\n' +
//     '        <div class="btn-group">\n' +
//     '          <label class="btn-sm pull-left">Cell lines:</label>\n' +
//     '          <div class="btn-group">\n' +
//     '            <select class="selectpicker" multiple="multiple" data-width="fit" data-selected-text-format="count &gt; 3">Cell line\n' +
//     '              <option>Summary</option>\n' +
//     '              <option>A375</option>\n' +
//     '              <option>A549</option>\n' +
//     '              <option>HA1E</option>\n' +
//     '              <option>HCC515</option>\n' +
//     '              <option>HCC515</option>\n' +
//     '              <option>HEPG2</option>\n' +
//     '              <option>HT29</option>\n' +
//     '              <option>MCF7</option>\n' +
//     '              <option>PC3</option>\n' +
//     '              <option>VCAP</option>\n' +
//     '            </select>\n' +
//     '          </div>\n' +
//     '        </div>\n' +
//     '        <div class="btn-group">\n' +
//     '          <label class="btn-sm pull-left">Perturbagens:</label>\n' +
//     '          <div class="btn-group">\n' +
//     '            <select class="selectpicker" multiple="multiple" data-width="fit" data-selected-text-format="count &gt; 3">Pert type\n' +
//     '              <optgroup>\n' +
//     '                <option>OE</option>\n' +
//     '                <option>KD</option>\n' +
//     '                <option>CRISPR</option>\n' +
//     '                <option>Mutant</option>\n' +
//     '                <option>CP</option>\n' +
//     '              </optgroup>\n' +
//     '              <optgroup>\n' +
//     '                <option>Targeting compounds</option>\n' +
//     '              </optgroup>\n' +
//     '            </select>\n' +
//     '          </div>\n' +
//     '        </div>\n' +
//     '        <div class="btn-group">\n' +
//     '          <label class="btn-sm pull-left">Group by:</label>\n' +
//     '          <div class="btn-group">\n' +
//     '            <select class="selectpicker select-single" data-width="fit">Pert type\n' +
//     '              <optgroup label="Columns">\n' +
//     '                <option>Cell line</option>\n' +
//     '                <option>Index perturbagen</option>\n' +
//     '              </optgroup>\n' +
//     '            </select>\n' +
//     '          </div>\n' +
//     '        </div>\n' +
//     '      </div>\n' +
//     '    </div>\n' +
//     '  </div>\n' +
//     '</div>');
};

//one ready (twice)
exports.getTopRowIndices = function(dataset) {
    var ids = new morpheus.Set();
    // show union of top/bottom 20 most similar
    var project = new morpheus.Project(dataset);
    for (var j = 0, ncols = dataset.getColumnCount(); j < ncols; j++) {
        project.setRowSortKeys([new morpheus.SortByValuesKey([j], morpheus.SortKey.SortOrder.DESCENDING, false)], true);
        var sortedDataset = project.getSortedFilteredDataset();
        var idVector = sortedDataset.getRowMetadata().getByName('id');
        for (var i = 0; i < 20; i++) {
            ids.add(idVector.getValue(i));
        }
        for (var i = 0, j = idVector.size() - 1; i < 20; i++, j--) {
            ids.add(idVector.getValue(j));
        }
    }
    var rowIndices = [];
    var idToRowIndex = morpheus.VectorUtil.createValueToIndexMap(dataset.getRowMetadata().getByName('id'));
    ids.forEach(function (id) {
        rowIndices.push(idToRowIndex.get(id));
    });
    return rowIndices;
};

exports.getHeatMapSelection = function(heatMap, field, isRows) {
  // reverse viewIndices to show most recent first
  if(isRows) {
    var viewIndices = heatMap.getProject().getRowSelectionModel().getViewIndices().values().reverse();
    var fieldVector = heatMap.getProject()
      .getSortedFilteredDataset()
      .getRowMetadata()
      .getByName(field);
  }
  else {
    var viewIndices = heatMap.getProject().getColumnSelectionModel().getViewIndices().values().reverse();
    var fieldVector = heatMap.getProject()
      .getSortedFilteredDataset()
      .getColumnMetadata()
      .getByName(field);
  }
  return viewIndices.map(function(idx) {
    return fieldVector.getValue(idx);
  });
};
function getButtonHtml(commandName,description) {
  return '<div class="row"><div class="col-sm-6">' + description + '</div>' +
    '<div class="col-sm-6"><button type="button" class="btn btn-send-to-app" data-command="' + commandName +'">' +
    commandName + '</button></div></div>';
}
exports.showLaunchOptions = function(ids, type, $el, sourceCommand, tabManager) {
  var search = require('Shared/search.js');
  var core = require('Shared/core.js');
  var $search = $('#homepage-search');
  var $html = $('<div></div>');
  var typePluralObj = {
    pert:'perturbagens',
    target:'genes',
    gene:'genes',
    moa:'MoAs'
  };
  var commandsHtml = {
    '/conn': getButtonHtml('/conn','View top connections/internal connectivities'),
    '/conn_gene': getButtonHtml('/conn',"View relevant perturbagens' top connections/internal connectivities"),
    '/sig': getButtonHtml('/sig','View/download signatures'),
    '/sig_gene': getButtonHtml('/sig','View/download relevant perturbagens'),
    '/assay': getButtonHtml('/assay','Find assays profiled'),
    '/gene-space': getButtonHtml('/gene-space','Find gene space'),
    '/moa_pert': getButtonHtml('/moa','Find MoA annotations'),
    '/moa_moa': getButtonHtml('/moa','Find compounds with matching MoAs'),
    '/target': getButtonHtml('/target','Find gene targets')
  };
  var typePlural = typePluralObj[type];
  var recCommands = [];
  if (!typePlural) {
    return;
  }
  var $header = $('<div name="launchbar-header">');
  if (ids.length === 0) {
    $header.append('<h3>Nothing selected</h3><br><hr></div>Select a row/column to see additional options');
    $html.append($header);
    return;
  }
  else if (ids.length === 1) {
    $header.append('<h2>' + ids[0] + '</h2>');
  }
  else if (ids.length === 2) {
    $header.append('<h2>2 ' + typePlural + ' selected</h2>');
    $header.append('<b>(' + ids[0] + ', ' + ids[1] + ')</b><br>');
  }
  else {
    $header.append('<h2>' + ids.length + ' ' + typePlural + ' selected</h2>');
    $header.append('<b>(' + ids[0] + ', ' + ids[1] + ', and ' + (ids.length - 2) + ' more)</b><br>')
  }
  $header.append('<hr>');
  recCommands = getRecCommands(sourceCommand,type);
  if(recCommands) {
    $header.append('<h5><strong>Use selection to:</strong></h5><br></div>');
    $html.append($header);
    recCommands.forEach(function (command,idx) {
      if(commandsHtml[command]) {
        $html.append(commandsHtml[command]);
        if(idx!=recCommands.length-1) {
          $html.append('<div class="always-visible-hr">');
        }
        else {
          $html.append('<br>')
        }
      }
    });
  }
  $el.html($html);

  core.actions.forEach(function(action) {
    var selector = '[data-command="' + action.command + '"]';
    $el.find(selector).click(function() {
      var text = action.command + ' "' + ids.join('" "') + '"';
      $search.val(text);
      search.analyticsCommandLaunchBar(sourceCommand,action.command,text);
      search.search(text, tabManager, false, null);
    });
  });
  // use loop with actions array
};
function getRecCommands(sourceCommand, type) {
  var recCommands = [];
  switch (sourceCommand) {
    case '/assay':
      // assay (pass) and pert
      recCommands = ['/conn', '/moa_pert', '/target', '/sig'];
      break;
    case '/moa':
      // pert and moa
      if(type==='pert') {
        recCommands = ['/conn', '/sig', '/assay', '/target'];
      }
      else {
        recCommands = ['/conn', '/sig', '/assay', '/moa_moa'];
      }
      break;
    case '/target':
      // pert and gene
      if (type === 'pert') {
        recCommands = ['/conn', '/sig', '/assay', '/moa_pert'];
      }
      else {
        recCommands = ['/target', '/conn_gene', '/sig_gene', '/gene-space'];
      }
      break;
    case 'search':
      // pert and gene
      if (type === 'pert') {
        recCommands = ['/conn', '/sig'];
      }
      else {
        recCommands = ['/conn_gene', '/sig_gene'];
      }
      break;
    default:
      break;
  }
  return recCommands;
}