if (typeof tablelegs === 'undefined') {
  tablelegs = {};
}
tablelegs.Grid = function (options) {
  this.options = options;
  var _this = this;
  var slickGrid;
  this.items = options.items;
  /**
   * Maps from model index to view index. Note that not all model indices are
   * contained in the map because they might have been filtered from the view.
   */
  this.modelToView = null;
  /** view order in model space */
  this.viewOrder = null;
  function getItemColumnValue(item, column) {
    return column.getter(item);
  }

  this.rowClassProvider = function () {
    return '';
  };
  this.filter = new tablelegs.CombinedGridFilter();
  var model = {
    getLength: function () {
      return _this.viewOrder != null ? _this.viewOrder.length
        : _this.items.length;
    },
    getItem: function (index) {
      return _this.items[_this.viewOrder != null ? _this.viewOrder[index]
        : index];
    },
    getItemMetadata: function (viewIndex) {
      var c = _this.rowClassProvider(viewIndex);
      if (c != null) {
        return {cssClasses: c};
      }
    }
  };
  this.$el = options.$el;

  var gridOptions = $.extend({}, {
    select: true,
    multiColumnSort: true,
    forceSyncScrolling: true,
    multiSelect: options.multiSelect,
    enableTextSelectionOnCells: options.enableTextSelectionOnCells == null ? true : options.enableTextSelectionOnCells,
    forceFitColumns: true,
    dataItemColumnValueExtractor: getItemColumnValue,
    defaultFormatter: function (row, cell, value, columnDef, dataContext) {
      if (_.isNumber(value)) {
        return Math.floor(value) === value ? value : morpheus.Util.nf(value);
      } else if (morpheus.Util.isArray(value)) {
        var s = [];
        for (var i = 0, length = value.length; i < length; i++) {
          if (i > 0) {
            s.push(', ');
          }
          var val = value[i];
          s.push(value[i]);
        }
        return s.join('');
      } else {
        return value;
      }
    }
  }, options.gridOptions || {});

  slickGrid = new Slick.Grid(options.$el, model, options.columns, gridOptions);
  this.slickGrid = slickGrid;

  if (gridOptions.select) {
    slickGrid.setSelectionModel(new Slick.RowSelectionModel({
      selectActiveRow: true,
      multiSelect: gridOptions.multiSelect
    }));
    slickGrid.getSelectionModel().onSelectedRangesChanged.subscribe(function (e) {
      _this.trigger('selectionChanged', {
        selectedRows: slickGrid.getSelectedRows()
      });
    });

  }

  slickGrid.onSort.subscribe(function (e, args) {
    _this.sortCols = args.sortCols;
    _this._updateMappings();
    slickGrid.invalidate();
  });

  slickGrid.onClick.subscribe(function (e) {
    var cell = slickGrid.getCellFromEvent(e);
    if (cell) {
      _this.trigger('click', {
        row: cell.row,
        cell: cell.cell,
        target: e.target
      });
    }
  });

  options.$el.on('mouseover', '.slick-row', function (e) {
    var cell = slickGrid.getCellFromEvent(e);
    if (cell) {
      _this.trigger('mouseover', {
        row: cell.row,
        cell: cell.cell,
        target: e.target
      });
    }
  });
  options.$el.on('mouseout', '.slick-row', function (e) {
    var cell = slickGrid.getCellFromEvent(e);
    if (cell) {
      _this.trigger('mouseout', {
        row: cell.row,
        cell: cell.cell,
        target: e.target
      });
    }
  });
  options.$el.on('dblclick', function (e) {
    var cell = slickGrid.getCellFromEvent(e);
    if (cell) {
      _this.trigger('dblclick', {
        row: cell.row,
        target: e.target
      });
    }
  });
  if (options.sort) {
    this.setSortColumns(options.sort);
  }

  this.slickGrid.invalidate();

};
tablelegs.Grid.prototype = {
  columnsAutosized: false,
  setSortColumns: function (columns) {
    var gridSortColumns = [];
    var gridColumns = this.slickGrid.getColumns();
    this.sortCols = []; // can sort by hidden columns
    var _this = this;
    columns.forEach(function (c) {
      var column = null;
      for (var i = 0; i < gridColumns.length; i++) {
        if (gridColumns[i].name === c.name) {
          column = gridColumns[i];
          break;
        }
      }

      if (column != null) {
        // for ui
        gridSortColumns.push({
          columnId: column.id,
          sortAsc: c.ascending
        });
      }
      _this.sortCols.push({
        sortCol: c,
        sortAsc: c.ascending
      });
    });
    this.slickGrid.setSortColumns(gridSortColumns);
    this._updateMappings();
    this.slickGrid.invalidate();
  },
  setRowClassProvider: function (rowClassProvider) {
    this.rowClassProvider = rowClassProvider == null ? function () {
      return '';
    } : rowClassProvider;
  },
  setColumns: function (columns) {
    this.slickGrid.setColumns(columns);
    this.columnsAutosized = false;
    this.autosizeColumns();
    this.slickGrid.invalidate();
  },
  getColumns: function () {
    return this.slickGrid.getColumns();
  },
  getSelectedRows: function () {
    return this.slickGrid.getSelectedRows();
  },
  getSelectedItems: function () {
    var rows = this.slickGrid.getSelectedRows();
    var selection = [];
    for (var i = 0, nrows = rows.length; i < nrows; i++) {
      selection.push(this.items[this.convertViewIndexToModel(rows[i])]);
    }
    return selection;
  },
  getSelectedItem: function () {
    var rows = this.slickGrid.getSelectedRows();
    if (rows.length === 1) {
      return this.items[this.convertViewIndexToModel(rows[0])];
    }
    return null;
  },
  setCellCssClass: function (rowIndices, columnIndices, cssClass, clear) {
    var hash = clear ? {} : this.slickGrid.getCellCssStyles('user');
    if (!hash) {
      hash = {};
    }
    var columns = this.slickGrid.getColumns();
    for (var i = 0; i < rowIndices.length; i++) {
      var row = rowIndices[i];
      if (!hash[row]) {  // prevent duplicates
        hash[row] = {};
      }
      for (var j = 0; j < columnIndices.length; j++) {
        hash[row][columns[columnIndices[j]].id] = cssClass;
      }
    }
    this.slickGrid.setCellCssStyles('user', hash);
  },
  /**
   * Gets the sorted, visible items
   */
  getItems: function () {
    var items = [];
    for (var i = 0, length = this.getFilteredItemCount(); i < length; i++) {
      items.push(this.items[this.convertViewIndexToModel(i)]);
    }
    return items;
  },
  getAllItemCount: function () {
    return this.items.length;
  },
  getAllItems: function () {
    return this.items;
  },
  getFilteredItemCount: function () {
    return this.viewOrder ? this.viewOrder.length : this.items.length;
  },
  redraw: function () {
    this.slickGrid.invalidate();
  },
  selectAll: function () {
    this.slickGrid.getSelectionModel().selectAll();
  },
  redrawRows: function (rows) {
    this.slickGrid.invalidateRows(rows);
    this.slickGrid.render();
  },
  setItems: function (items) {
    // clear the selection
    this.items = items;
    if (this.slickGrid.getSelectionModel()) {
      this.slickGrid.setSelectedRows([]);
    }
    this.setFilter(this.filter);
    this.maybeAutoResizeColumns();
  },
  maybeAutoResizeColumns: function () {
    if (!this.columnsAutosized) {
      this.autosizeColumns();
    }
  },
  convertModelIndexToView: function (modelIndex) {
    if (this.modelToView !== null) {
      var index = this.modelToView.get(modelIndex);
      return index !== undefined ? index : -1;
    }
    return modelIndex;
  },
  convertViewIndexToModel: function (viewIndex) {
    return this.viewOrder != null ? (viewIndex < this.viewOrder.length
    && viewIndex >= 0 ? this.viewOrder[viewIndex] : -1) : viewIndex;
  },
  _updateMappings: function () {
    var selectedViewIndices = this.slickGrid.getSelectionModel() != null ? this.slickGrid
    .getSelectedRows()
      : null;
    var selectedModelIndices = [];
    if (selectedViewIndices) {
      for (var i = 0, length = selectedViewIndices.length; i < length; i++) {
        selectedModelIndices.push(this
        .convertViewIndexToModel(selectedViewIndices[i]));
      }
    }
    this.viewOrder = null;
    if (this.filter != null) {
      this.filter.init();
      if (!this.filter.isEmpty()) {
        this.viewOrder = [];
        for (var i = 0, length = this.items.length; i < length; i++) {
          if (this.filter.accept(this.items[i])) {
            this.viewOrder.push(i);
          }
        }
      }
    }
    var cols = this.sortCols;
    if (cols && cols.length > 0) {
      if (this.viewOrder == null) {
        this.viewOrder = [];
        for (var i = 0, length = this.items.length; i < length; i++) {
          this.viewOrder.push(i);
        }
      }
      var ncols = cols.length;
      var items = this.items;
      // nulls always go at end

      this.viewOrder.sort(function (index1, index2) {
        for (var i = 0; i < ncols; i++) {
          var getter = cols[i].sortCol.sortGetter || cols[i].sortCol.getter;
          var comparator = cols[i].sortAsc ? tablelegs.ASCENDING_COMPARATOR : tablelegs.DESCENDING_COMPARATOR;
          var value1 = getter(items[index1]);
          var value2 = getter(items[index2]);
          var result = comparator(value1, value2);
          if (result !== 0) {
            return result;
          }
        }
        return 0;
      });
    }
    if (this.viewOrder != null) {
      this.modelToView = new morpheus.Map();
      for (var i = 0, length = this.viewOrder.length; i < length; i++) {
        this.modelToView.set(this.viewOrder[i], i);
      }
    } else {
      this.modelToView = null;
    }
    if (this.slickGrid.getSelectionModel() != null) {
      var newSelectedViewIndices = [];
      for (var i = 0, length = selectedModelIndices.length; i < length; i++) {
        var index = this
        .convertModelIndexToView(selectedModelIndices[i]);
        if (index !== -1) {
          newSelectedViewIndices.push(index);
        }
      }
      this.slickGrid.setSelectedRows(newSelectedViewIndices);
    }
  },
  setSelectedRows: function (rows) {
    this.slickGrid.setSelectedRows(rows);
  },
  setFilter: function (filter) {
    this.filter = filter;
    this._updateMappings();
    this.slickGrid.invalidate();
    this.trigger('filter');
  },
  getFilter: function () {
    return this.filter;
  },
  autosizeColumns: function () {
    var columns = this.slickGrid.getColumns();
    var items = this.getItems();
    if (!items || items.length === 0 || !columns || columns.length === 0) {
      return;
    }
    var gridWidth = this.options.$el.width() - 30; // subtract column picker and
    // scroll bar width

    if (gridWidth <= 0) {
      return;
    }
    this.columnsAutosized = true;

    var div = document.createElement('div');
    document.body.appendChild(div);
    var $d = $(div);
    $d.css({
      position: 'absolute',
      left: -1000,
      top: -1000
    });

    var $row = $('<div class="slick-table">'
      + '<div class="ui-state-default slick-header-column slick-header-sortable ui-sortable-handle"></div>'
      + '<div class="ui-widget-content slick-row"><div class="slick-cell selected"></div></div>'
      + '</div>');
    var $cell = $row.find('.slick-cell');
    var $header = $row.find('.slick-header-column');
    $row.appendTo($d);

    var maxWidth = Math.min(parseInt(gridWidth / 2), 400);
    var computeColumnWidth = function (column) {
      var w = 0;
      if (column.resizable) {
        w = $header.html(column.name).outerWidth() + 12; // leave space for sort
        // indicator
        if (column.prototypeValue) {
          $cell.html(column.prototypeValue);
          w = Math.max($cell.outerWidth(), w);
        } else {
          for (var i = 0, nrows = Math.min(items.length, 10); i < nrows; i++) {
            var html = column.formatter(i, null, column
            .getter(items[i]), column, items[i]);
            var $html = $(html);
            $html.find('.slick-cell-wrapper').attr('class', '');
            $cell.html($html);
            w = Math.max($cell.outerWidth(), w);
          }
        }
      }
      if (column.maxWidth) {
        w = Math.min(w, column.maxWidth);
      }
      if (column.minWidth) {
        w = Math.max(w, column.minWidth);
      }
      return w;
    };
    var totalWidth = 0;
    for (var i = 0; i < columns.length; i++) {
      columns[i].width = parseInt(Math.min(maxWidth, computeColumnWidth(columns[i])));
      totalWidth += columns[i].width;
    }

    // if (totalWidth !== gridWidth) {
    // 	// grow columns
    // 	var delta = parseInt((gridWidth - totalWidth) / columns.length);
    // 	for (var i = 0; i < columns.length; i++) {
    // 		columns[i].width += delta;
    // 	}
    //
    // }

    $d.remove();
    this.slickGrid.resizeCanvas();

  }
};

morpheus.Util.extend(tablelegs.Grid, morpheus.Events);

/**
 * AutoTooltips2 plugin to show/hide tooltips when columns are too narrow to fit
 * content.
 *
 * @constructor
 */
tablelegs.AutoTooltips2 = function (options) {
  var _grid;
  var _self = this;
  var tip;

  /**
   * Initialize plugin.
   */
  function init(slickGrid) {
    _grid = slickGrid;

    $(_grid.getCanvasNode()).on('mouseover', '.slick-row', showToolTip);
    //$(_grid.getCanvasNode()).on('mouseout', '.slick-row', hideToolTip);
    //$(_grid.getCanvasNode()).on('mouseup', hideAll);
    //$(_grid.getCanvasNode()).on('mouseout', hideAll);

    // $(_grid.getContainerNode()).on('mouseover', '.slick-header-column',
    // showHeaderToolTip);
    // $(_grid.getContainerNode()).on('mouseout', '.slick-header-column',
    // hideHeaderToolTip);

  }

  /**
   * Destroy plugin.
   */
  function destroy() {
    $(_grid.getCanvasNode()).off('mouseover', showToolTip);
    //	$(_grid.getCanvasNode()).off('mouseout', hideToolTip);
    //	$(_grid.getCanvasNode()).off('mouseup', hideAll);
    //	$(_grid.getCanvasNode()).off('mouseout', hideAll);
    // $(_grid.getContainerNode()).off('mouseover', '.slick-header-column',
    // showHeaderToolTip);
    // $(_grid.getContainerNode()).off('mouseout', '.slick-header-column',
    // hideHeaderToolTip);

  }

  /**
   * Handle mouse entering slickGrid cell to add/remove tooltip.
   *
   * @param {jQuery.Event}
   *            e - The event
   */
  function hideToolTip(e) {
    var cell = _grid.getCellFromEvent(e);
    if (cell) {
      var $node = $(_grid.getCellNode(cell.row, cell.cell));
      if ($node.data('bs.tooltip')) {
        $node.tooltip('hide');
      }
    }
  }

  function hideAll() {
    $(_grid.getCanvasNode()).find('[data-original-title]').attr(
      'data-original-title', '').tooltip('hide');

  }

  function hideHeaderToolTip(e) {
    var $node = $(e.target);
    if ($node.data('bs.tooltip')) {
      $node.tooltip('hide');
    }
  }

  function showHeaderToolTip(e) {
    var show = false;
    var $node = $(e.target);

    if (($node[0].scrollWidth > $node[0].offsetWidth)) {
      show = true;
      var $name = $node.find('.slick-column-name');
      // if (!$node.data('bs.tooltip')) {
      // 	$node.tooltip({
      // 		placement: 'auto',
      // 		html: true,
      // 		container: 'body',
      // 		trigger: 'manual'
      // 	});
      // }
      $node.attr('title', $name.text());
      // if (show) {
      // 	$node.tooltip('show');
      // } else {
      // 	$node.tooltip('hide');
      // }
    }
  }

  function showToolTip(e) {
    var cell = _grid.getCellFromEvent(e);
    if (cell) {
      var $node = $(_grid.getCellNode(cell.row, cell.cell));
      //this.$tooltipNode = $node;
      var text = '';
      var c = _grid.getColumns()[cell.cell];
      var show = false;
      var $checkNode = $node.find('.slick-cell-wrapper');
      if (c.tooltip && (c.alwaysShowTooltip
        || ($checkNode[0].scrollWidth > $checkNode[0].offsetWidth))) {
        var item = _grid.getDataItem(cell.row);
        text = c.tooltip(item, c.getter(item));
        show = true;
      }
      $node.attr('title', text);
      // var hasTip = $node.data('bs.tooltip');
      // if (!hasTip) {
      // 	$node.tooltip({
      // 		placement: 'auto',
      // 		html: true,
      // 		container: 'body',
      // 		trigger: 'manual'
      // 	});
      // }
      // if (show) {
      // 	$node.tooltip('show');
      // } else if (hasTip) {
      // 	$node.tooltip('hide');
      // }
    }
  }

  /**
   * Handle mouse entering header cell to add/remove tooltip.
   *
   * @param {jQuery.Event}
   *            e - The event
   * @param {object}
   *            args.column - The column definition
   */
  function handleHeaderMouseEnter(e, args) {
    var column = args.column, $node = $(e.target).closest(
      '.slick-header-column');
    if (!column.toolTip) {
      $node.attr('title',
        ($node.innerWidth() < $node[0].scrollWidth) ? column.name
          : '');
    }
  }

  // Public API
  $.extend(this, {
    'init': init,
    'destroy': destroy
  });

};

tablelegs.CombinedGridFilter = function () {
  this.filters = [];
};
tablelegs.CombinedGridFilter.prototype = {
  add: function (filter) {
    this.filters.push(filter);
  },
  getFilters: function () {
    return this.filters;
  },
  get: function (index) {
    return this.filters[index];
  },
  set: function (index, f) {
    this.filters[index] = f;
  },
  init: function () {
    for (var i = 0; i < this.filters.length; i++) {
      this.filters[i].init();
    }

    this.activeFilters = this.filters.filter(function (f) {
      return !f.isEmpty();
    });
    this.nActiveFilters = this.activeFilters.length;
  },
  accept: function (item) {
    for (var i = 0; i < this.nActiveFilters; i++) {
      if (!this.activeFilters[i].accept(item)) {
        return false;
      }
    }
    return true;
  },
  isEmpty: function () {
    return this.activeFilters.length === 0;
  }
};

tablelegs.ASCENDING_COMPARATOR = function (a, b) {
  // we want NaNs to end up at the bottom
  var aNaN = (a == null || (_.isNumber(a) && isNaN(a)));
  var bNaN = (b == null || (_.isNumber(b) && isNaN(b)));
  if (aNaN && bNaN) {
    return 0;
  }
  if (aNaN) {
    return 1;
  }
  if (bNaN) {
    return -1;
  }
  if (a.toLowerCase) {
    a = a.toLowerCase();
  }
  if (b.toLowerCase) {
    b = b.toLowerCase();
  }

  return (a === b ? 0 : (a < b ? -1 : 1));
};
/**
 * Comparator to sort descending using lowercase string comparison
 */
tablelegs.DESCENDING_COMPARATOR = function (a, b) {
  var aNaN = (a == null || (_.isNumber(a) && isNaN(a)));
  var bNaN = (b == null || (_.isNumber(b) && isNaN(b)));
  if (aNaN && bNaN) {
    return 0;
  }
  if (aNaN) {
    return 1;
  }
  if (bNaN) {
    return -1;
  }
  if (a.toLowerCase) {
    a = a.toLowerCase();
  }
  if (b.toLowerCase) {
    b = b.toLowerCase();
  }

  return (a === b ? 0 : (a < b ? 1 : -1));
};
