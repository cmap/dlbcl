/**
 * @param options.$el The jQuery element to render to. Must be in the DOM.
 * @param options.items An array of items to display in the table
 * @param options.search Whether to create a search widget
 * @param options.rowHeight Table row height
 * @param height: Height in pixels of table. '564px',
 * @param options.collapseBreakpoint: 500
 * @param options.showHeader: true
 * @param options.select: true
 * @param options.responsive: true
 * @param options.fixedWidth: Fixed table with when responsive is false. '320px'
 * @param options.columns An array of column descriptors. Each column can have the properties:
 * visible, name, field, renderer
 */



tablelegs.Table = function (options) {
  var _this = this;
  this.alwaysTrue = function () {
    return true;
  };
  options = tablelegs.Table.createOptions(options);
  this.options = options;
  // if (!options.width) {
  // 	options.width = options.$el.attr('class');
  // }

  var height = options.height;
  var $gridDiv = $('<div class="slick-table'
    + (options.tableClass ? (' ' + options.tableClass) : '')
    + '" style="width:' + options.fixedWidth + ';height:' + height
    + '"></div>');

  this.$gridDiv = $gridDiv;
  var $header = $('<div class="slick-table-header"><div data-name="top"></div><div' +
    ' style="display: inline-block;" data-name="left" class="pad-top-8"></div><div style="display: inline-block;" data-name="buttons" class="pad-top-8"></div><div data-name="right"' +
    ' class="pull-right' +
    ' pad-top-8"></div></div>');
  this.$header = $header;
  $header.appendTo(options.$el);
  $gridDiv.appendTo(options.$el);
  // all columns (including those that are currently not visible */
  var columns = options.columns;
  this.columns = columns; // make a shallow copy
  var visibleColumns = columns.filter(function (c) {
    return c.visible;
  });
  var grid = new tablelegs.Grid({
    gridOptions: {
      select: options.select,
      rowHeight: options.rowHeight,
      autoEdit: false,
      editable: false,
      autoHeight: options.height === 'auto',
      enableTextSelectionOnCells: false,
    },
    $el: $gridDiv,
    items: options.items,
    columns: visibleColumns
  });
  if (options.autoTooltips) {
    grid.slickGrid.registerPlugin(new tablelegs.AutoTooltips2());
  }
  if (options.select) {
    this.copy = function (ev) {
      var active = document.activeElement;
      var tagName = active.tagName;
      if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') {
        return false;
      }
      if ($gridDiv[0].contains(active)) {
        var text = _this.itemsToText(_this.getSelectedItems(), false);
        ev.originalEvent.clipboardData.setData(
          'text/plain', text);
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    };
    this.beforeCopy = function (e) {
      var active = document.activeElement;
      var tagName = active.tagName;
      if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') {
        return false;
      }
      if ($gridDiv[0].contains(active)) {
        e.preventDefault();
      }

    };
    $(window).on('copy.tablelegs', this.copy).on('beforecopy.tablelegs', this.beforeCopy);
  }
  this.grid = grid;
  this.searchFunction = this.alwaysTrue;
  var searchFilter = {
    isEmpty: function () {
      return _this.searchFunction === _this.alwaysTrue;
    },
    init: function () {
    },
    accept: function (item) {
      return _this.searchFunction(item);
    }
  };
  // add empty search filter
  this.grid
  .getFilter().add(searchFilter);

  var $right = $header.find('.pull-right');
  if (options.export) {
    var $export = $('<button name="export" type="button">Export</button>');
    $export.appendTo($header.find('[data-name=buttons]'));

    $export.on('click', function (e) {
      e.preventDefault();
      _this.exportTable();
    });
    // var clipboard = new Clipboard($export.find('[name=clipboard]')[0], {
    // 	text: function (trigger) {
    //
    // 		return 'asdf';
    // 	}
    // });
    // clipboard.on('error', function (e) {
    // 	console.error('Action:', e.action);
    // 	console.error('Trigger:', e.trigger);
    // });

  }
  if (options.search) {
    var tableSearch = new tablelegs.TableSearchUI({
      autocomplete: options.autocomplete,
      $el: $header.find('[data-name=top]'),
      $right: $right
    });
    tableSearch.setTable(this);
    this.tableSearch = tableSearch;
  }

  if (options.columnPicker) {
    var $btn = $('<div style="position:absolute;top:0;right:0;"><div class="dropdown dropdown-select"><button data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" type="button"' +
      ' class="btn' +
      ' btn-default' +
      ' btn-sm light-btn-xs"><i class="fa fa-cog"></button><ul style="max-height:400px;overflow-y:auto;"' +
      ' class="dropdown-menu' +
      ' dropdown-menu-right"></ul></div></div>');

    $btn.appendTo(this.$gridDiv);
    this.$columnSelect = $btn.find('.dropdown-menu');
    // sort column names
    var sortedColumns = this.columns.slice().sort(function (a, b) {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase()
      return (a === b ? 0 : (a < b ? -1 : 1));
    });
    var li = [];
    li.push('<li class="dropdown-header">Show/Hide Columns</li>');
    sortedColumns.forEach(function (c) {
      if (!c.hidden && c.isHideable) {

        li.push('<li><a data-value="' + c.id + '" data-checked="' + c.visible + '" href="#">' + c.name + '');

        if (c.visible) {
          li.push(' <span class="fa fa-check' +
            ' check-mark"></span>');
        } else {
          li.push(' <span></span>');
        }
        li.push('</a></li>');

      }
    });

    $(li.join('')).appendTo(this.$columnSelect);

    this.$columnSelect.on('click', 'a', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var $a = $(this);
      var checked = $a.data('checked');

      checked = !checked;
      $a.data('checked', checked);
      $a.parent().attr('class', checked ? 'selected' : '');
      var $span = $a.find('span');
      $span.attr('class', checked ? 'fa fa-check check-mark' : '')

      var $checked = _this.$columnSelect.find('a');
      var selectedColumnIds = [];
      for (var i = 0; i < $checked.length; i++) {
        if ($($checked[i]).data('checked')) {
          selectedColumnIds.push($($checked[i]).data('value'));
        }
      }

      // add !isHideable columns
      selectedColumnIds = sortedColumns.filter(function (c) {
        return !c.isHideable;
      }).map(function (c) {
        return c.id;
      }).concat(selectedColumnIds);
      _this.setVisibleColumnIds(selectedColumnIds);
    });
  }

  var collapsed = false;
  var lastWidth = -1;
  var lastHeight = -1;
  var resize = function () {
    if (!_this.options.responsive) {
      return;
    }
    if (!options.$el.is(':visible')) {
      return;
    }
    var resizedWidth = false;
    var resizedHeight = false;
    if (options.responsiveHeight) {
      // var top = _this.$gridDiv.offset().top;
      var tableHeight = options.$el[0].getBoundingClientRect().height;
      // set to height of parent

      if (lastHeight !== tableHeight) {
        lastHeight = tableHeight;
        $gridDiv.css('height', tableHeight + 'px');
        resizedHeight = true;
      }

    }
    var gridWidth = options.$el.width();
    if (gridWidth !== lastWidth && gridWidth > 0) {
      lastWidth = gridWidth;
      var minWidth = Math.max(gridWidth, options.collapseBreakpoint);
      $gridDiv.css('width', minWidth + 'px');
      resizedWidth = true;
    }
    if (resizedHeight || resizedWidth) {
      _this.grid.slickGrid.resizeCanvas();
      _this.grid.slickGrid.invalidate();
    }
    if (resizedWidth) {
      _this.grid.maybeAutoResizeColumns();
    }
    // no stacking

    // var visibleColumns = _this.grid.getColumns();
    //
    // if (!collapsed && gridWidth < options.collapseBreakpoint
    // 	&& visibleColumns.length > 1) {
    // 	collapsed = true;
    // 	$gridDiv.addClass('slick-stacked');
    //
    // 	_this.grid.slickGrid.getOptions().rowHeight = (options.collapsedRowHeight ? options.collapsedRowHeight : options.rowHeight)
    // 		* visibleColumns.length;
    // 	// collapse
    // 	_this.grid.slickGrid
    // 	.setColumns([{
    // 		id: 0,
    // 		tooltip: function (item, value) {
    // 			var html = [];
    // 			for (var i = 0; i < visibleColumns.length; i++) {
    // 				var text = visibleColumns[i].tooltip(item, visibleColumns[i]
    // 				.getter(item));
    // 				if (text != null && text !== '') {
    // 					html.push(text);
    // 				}
    // 			}
    // 			return html.join('<br />');
    // 		},
    // 		collapsed: true,
    // 		getter: function (item) {
    // 			return item;
    // 		},
    // 		formatter: function (row, cell, value, columnDef,
    // 							 dataContext) {
    // 			var html = [];
    // 			html
    // 			.push('<div class="slick-table-wrapper"><div class="slick-cell-wrapper">');
    //
    // 			for (var i = 0; i < visibleColumns.length; i++) {
    // 				if (i > 0) {
    // 					html.push('<div style="height:4px;"></div>');
    // 				}
    // 				var c = visibleColumns[i];
    // 				html.push(c.name);
    // 				html.push(':');
    // 				var s = c.renderer(dataContext, c
    // 				.getter(dataContext));
    // 				html.push(s);
    //
    // 			}
    // 			html.push('</div></div>');
    // 			return html.join('');
    // 		},
    // 		sortable: false,
    // 		name: ''
    // 	}]);
    // 	$gridDiv.find('.slick-header').hide();
    // 	_this.grid.slickGrid.resizeCanvas();
    // 	_this.grid.slickGrid.invalidate();
    //
    // } else if (collapsed && gridWidth >= options.collapseBreakpoint) {
    // 	$gridDiv.removeClass('slick-stacked');
    // 	collapsed = false;
    // 	if (options.showHeader) {
    // 		$gridDiv.find('.slick-header').show();
    // 	}
    // 	_this.grid.slickGrid.getOptions().rowHeight = options.rowHeight;
    // 	_this.grid.slickGrid.setColumns(visibleColumns);
    // 	_this.grid.slickGrid.resizeCanvas();
    // 	if (options.select) {
    // 		_this.grid.slickGrid.setSelectedRows(_this.grid.slickGrid
    // 		.getSelectedRows());
    // 	}
    // 	_this.grid.slickGrid.invalidate();
    // } else {
    // 	_this.grid.slickGrid.resizeCanvas();
    // 	_this.grid.slickGrid.invalidate();
    // }
    // _this.grid.maybeAutoResizeColumns();

  };
  if (!options.showHeader) {
    $gridDiv.find('.slick-header').hide();
  }
  if (options.responsive || options.responsiveHeight) {
    $(window).on('resize orientationchange', resize);
    resize();
  }
  this.resize = resize;
  $gridDiv.on('remove', function () {
    $(window).off('resize orientationchange', resize).off('copy.tablelegs', _this.copy).off('beforecopy.tablelegs', _this.beforeCopy);
  });
  options.columns.forEach(function (c) {
    if (c.renderer && c.renderer.init) {
      c.renderer.init({
        table: _this,
        column: c
      });
    }
  });
  if (visibleColumns.length > 1 && options.items != null
    && options.items.length > 0) {
    this.setItems(options.items);
  }
  if (!$gridDiv.is(':visible')) {

    // find 1st parent that is not visible
    var $parent = $gridDiv;
    var observer = new MutationObserver(function (mutations) {
      if (window.getComputedStyle($parent[0]).display !== 'none') {
        observer.disconnect();
        resize();
      }
    });

    while ($parent.length > 0) {
      if (window.getComputedStyle($parent[0]).display === 'none') {
        break;
      }
      $parent = $parent.parent();
    }

    if ($parent.length > 0) {
      observer.observe($parent[0], {
        attributes: true,
        childList: false,
        characterData: false
      });
    }

  }
}
;

tablelegs.Table.defaultRenderer = function (item, value) {
  if (value == null) {
    return '';
  } else if (_.isNumber(value)) {
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
    return '' + value;
  }
};

tablelegs.Table.prototype = {
  setVisibleColumnIds: function (ids) {
    var oldColumnIdToIndex = new morpheus.Map();
    var oldColumns = this.grid.getColumns();
    for (var i = 0; i < oldColumns.length; i++) {
      oldColumnIdToIndex.set(oldColumns[i].id, i);
    }
    var idToColumn = new morpheus.Map();
    this.columns.forEach(function (c) {
      idToColumn.set(c.id, c);
    });

    var visibleColumns = [];
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var c = idToColumn.get(id);
      if (c != null) {
        visibleColumns.push(c);
      } else {
        console.log(id + ' not found.');
      }
    }

    visibleColumns.sort(function (a, b) {
      a = oldColumnIdToIndex.get(a.id);
      if (a === undefined) {
        a = Number.MAX_VALUE;
      }
      b = oldColumnIdToIndex.get(b.id);
      if (b === undefined) {
        b = Number.MAX_VALUE;
      }
      return (a === b ? 0 : (a < b ? -1 : 1));
    });
    this.columns.forEach(function (c) {
      c.visible = false;
    });
    visibleColumns.forEach(function (c) {
      c.visible = true;
    });
    this.grid.setColumns(visibleColumns);
    this.resize();
    this.redraw();
  },
  removeColumns: function (columnIds) {
    var _this = this;
    columnIds.forEach(function (id) {
      var index = _.findIndex(_this.columns, function (column) {
        return column.id === id;
      });
      if (index !== -1) {
        _this.columns.splice(index, 1);
      }
    });
    this.setVisibleColumnIds(this.columns.filter(function (c) {
      return c.visible;
    }).map(function (c) {
      return c.id;
    }));
    this._rebuildColumnSelector();
  },
  _rebuildColumnSelector: function () {
    if (this.$columnSelect) {
      var $columnSelect = this.$columnSelect;
      $columnSelect.empty();
      var sortedColumns = this.columns.slice().sort(function (a, b) {
        a = a.name.toLowerCase();
        b = b.name.toLowerCase()
        return (a === b ? 0 : (a < b ? -1 : 1));
      });
      var li = [];
      li.push('<li class="dropdown-header">Show/Hide Columns</li>');
      sortedColumns.forEach(function (c) {
        if (!c.hidden && c.isHideable) {
          li.push('<li><a data-value="' + c.id + '" data-checked="' + c.visible + '" href="#">' + c.name + '');
          if (c.visible) {
            li.push('<span class="fa fa-check' +
              ' check-mark"></span>');
          } else {
            li.push('<span></span>');
          }
          li.push('</a></li>');
        }
      });

      $columnSelect.html($(li.join('')));
    }
  },
  /**
   *
   * @param columns Array of column definitions
   */
  addColumns: function (columns) {
    var _this = this;
    this.columns = this.columns.concat(columns);
    this.setVisibleColumnIds(this.columns.filter(function (c) {
      return c.visible;
    }).map(function (c) {
      return c.id;
    }));
    this._rebuildColumnSelector();
  },
  exportTable: function () {
    var _this = this;
    if (this.options.beforeExport && !this.options.beforeExport()) {
      return;
    }
    var formBuilder = new morpheus.FormBuilder();
    formBuilder.append({
      name: 'file_name',
      type: 'text',
      value: this.options.exportFileName
    });
    formBuilder.find('file_name').prop('autofocus', true).focus();
    morpheus.FormBuilder.showOkCancel({
      title: 'Export',
      draggable: true,
      content: formBuilder.$form,
      align: 'right',
      okCallback: function () {
        var blob = new Blob([_this.toText()], {
          type: "text/plain;charset=utf-8"
        });
        saveAs(blob, formBuilder.getValue('file_name'), true);
        _this.trigger('export', {table: this});
      }
    });

  },
  itemsToText: function (items, header) {
    var text = [];
    var columns = this.columns.filter(function (c) {
      return c.visible && c.export;
    });
    if (header) {
      for (var j = 0; j < columns.length; j++) {
        if (j > 0) {
          text.push('\t');
        }
        text.push(columns[j].name);
      }
      text.push('\n');
    }
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      for (var j = 0; j < columns.length; j++) {
        if (j > 0) {
          text.push('\t');
        }
        var value = columns[j].getter(item);
        text.push(morpheus.Util.toString(value));
      }
      text.push('\n');
    }
    return text.join('');
  },
  toText: function () {
    return this.itemsToText(this.options.getExportItems(this), true);
  },
  getColumnCount: function () {
    return this.columns.filter(function (c) {
      return c.visible;
    }).length;
  },
  setCellCssClass: function (rows, columns, cssClass, clear) {
    this.grid.setCellCssClass(rows, columns, cssClass, clear);
  },
  setHeight: function (height) {
    this.options.height = height;
    if (height === 'auto') {

      this.grid.slickGrid.getOptions().autoHeight = true;
      this.grid.slickGrid.setOptions(this.grid.slickGrid.getOptions());
      this.$gridDiv.css({
        'height': '',
        'margin-bottom': '11px'
      });
      this.$gridDiv.find('.slick-viewport').css('height', '');

    } else {
      this.$gridDiv.css({
        'height': height,
        'margin-bottom': ''
      });

    }
    this.grid.slickGrid.resizeCanvas();
    this.grid.slickGrid.invalidate();
    this.grid.slickGrid.render();

  },
  autocomplete: function (tokens, response) {
    var _this = this;

    var token = tokens != null && tokens.length > 0 ? tokens[tokens.selectionStartIndex]
      : '';
    token = $.trim(token);

    var columns = this.columns.filter(function (c) {
      return c.searchable && (c.visible || _this.options.searchAllColumns);
    });

    var showFieldName = columns.length > 1;
// filter numeric columns
    var items = this.getAllItems();

    columns.forEach(function (c) {
      if (c.dataType == null) {
        for (var i = 0, nitems = items.length; i < nitems; i++) {
          var value = c.getter(items[i]);
          if (value != null) { // 1st non-null
            if (morpheus.Util.isArray(value) && value.length === 0) {
              continue;
            }
            c.dataType = morpheus.Util.getDataType(value);
            break;
          }
        }
      }

    });
    var ncolumns = columns.length;
    if (token === '' || token.length < 2) {
      // autocomplete field names only
      var matches = [];
      if (ncolumns <= 1) {
        return response(matches);
      }

      for (var i = 0; i < ncolumns; i++) {
        var c = columns[i];
        var field = c.name;
        var quotedField = field;
        if (quotedField.indexOf(' ') !== -1) {
          quotedField = '"' + quotedField + '"';
        }

        if (c.dataType === 'string' || c.dataType === '[string]') {
          if (c.showAll) {
            matches.push({
              class: 'search-qualifier',
              value: quotedField + ':',
              showAll: quotedField + ':*',
              label: '<span class="search-qualifier-field">' + field
              + ':</span><span data-autocomplete="showAll"' +
              ' class="search-qualifier-show-all">Show all</span>',
              show: true
            });
          } else {
            matches.push({
              class: 'search-qualifier',
              value: quotedField + ':',
              label: '<span class="search-qualifier-field">' + field
              + ':</span>',
              show: true
            });
          }

        } else {
          matches.push({
            class: 'search-qualifier',
            value: quotedField + ':',
            label: '<span class="search-qualifier-field">' + field
            + ':</span><span class="search-qualifier-range">min..max</span>',
            show: true
          });
        }

      }
      matches
      .sort(function (m1, m2) {
        var a = m1.value.toLowerCase();
        var b = m2.value.toLowerCase();
        return (a === b ? 0 : (a < b ? -1 : 1));
      });
      return response(matches);
    }
    var field = null;
    var semi = token.indexOf(':');
    var regex = new RegExp(morpheus.Util.escapeRegex(token), 'i');
    var fieldSearch = false;
    var columnNameToColumn = new morpheus.Map();
    var fieldNameToMatches = new morpheus.Map();
    for (var i = 0; i < columns.length; i++) {
      columnNameToColumn.set(columns[i].name.toLowerCase(), columns[i]);
      fieldNameToMatches.set(columns[i].name, new morpheus.Set())
    }

    if (semi > 0) { // field search?
      if (token.charCodeAt(semi - 1) !== 92) { // \:
        // one of available fields
        var possibleToken = $.trim(token.substring(semi + 1));
        // check for "field":"val" and "field:val"
        var possibleField = $.trim(token.substring(0, semi)); // split
        // on :
        if (possibleField.length > 0
          && possibleField[0] === '"'
          && possibleField[possibleField.length - 1] === '"') {
          possibleField = possibleField.substring(1,
            possibleField.length - 1);
        } else if (possibleField.length > 0
          && possibleField[0] === '"'
          && possibleToken[possibleToken.length - 1] === '"'
          && possibleToken[0] !== '"') {
          possibleField = possibleField.substring(1,
            possibleField.length);
          possibleToken = '"' + possibleToken;

        }

        var c = columnNameToColumn.get(possibleField.toLowerCase());
        if (c !== undefined) {
          token = possibleToken;
          field = possibleField;
          fieldSearch = true;
          // limit to searching this field only
          columns = [c];
        }
      }
    } else if (ncolumns > 1) {
      // test field names
      for (var j = 0; j < ncolumns; j++) {
        var field = columns[j].name;
        if (regex.test(field)) {
          var matchesSet = fieldNameToMatches.get(field);
          matchesSet.show = true;
        }
      }
    }
    var filteredColumns = [];
    for (var i = 0; i < columns.length; i++) {
      var c = columns[i];
      if (c.dataType === 'string' || c.dataType === '[string]') {
        filteredColumns.push(c);
      }
    }
    regex = new RegExp(morpheus.Util.escapeRegex(token), 'i');

    columns = filteredColumns;
    ncolumns = columns.length;

    function formatResponse() {
      var matches = [];
      var isShowAll = token === '*';
      var replaceRegex = new RegExp('(' + morpheus.Util.escapeRegex(token) + ')', 'i');
      fieldNameToMatches.forEach(function (matchesSet, field) {
        if (matchesSet.show || matchesSet.size() > 0) {

          var column = columnNameToColumn.get(field.toLowerCase());
          var quotedField = field;
          if (quotedField.indexOf(' ') !== -1) {
            quotedField = '"' + quotedField + '"';
          }

          if (showFieldName) {
            if (column.dataType === 'string' || column.dataType === '[string]') {
              if (column.showAll && isShowAll) {
                matches.push({
                  class: 'search-qualifier',
                  value: quotedField + ':',
                  label: '<span class="search-qualifier-field">' + field
                  + ':</span>',
                  show: true
                });
              } else {
                matches.push({
                  class: 'search-qualifier',
                  value: quotedField + ':',
                  label: '<span class="search-qualifier-field">' + field
                  + ':</span>',
                  show: true
                });
              }

            } else {
              matches.push({
                class: 'search-qualifier',
                value: quotedField + ':',
                label: '<span class="search-qualifier-field">' + field
                + ':</span><span class="search-qualifier-range">min..max</span>',
                show: true
              });
            }

          }
          var fieldMatches = [];
          matchesSet.forEach(function (val) {
            var quotedValue = val;
            if (quotedValue != null && quotedValue.indexOf(' ') !== -1) {
              quotedValue = '"' + quotedValue + '"';
            }
            fieldMatches
            .push({
              _v: val,
              value: showFieldName ? (quotedField + ':' + quotedValue)
                : quotedValue,
              label: '<span>'
              + val.replace(replaceRegex, '<b>$1</b>') + '</span>'

            });
          });
          fieldMatches
          .sort(function (m1, m2) {
            var a = m1._v.toLowerCase();
            var b = m2._v.toLowerCase();
            return (a === b ? 0
              : (a < b ? -1 : 1));
          });

          matches = matches.concat(fieldMatches);

        }

      });
      response(matches);
    }

    var nmatches = 0;
    var maxSize = ncolumns === 1 && token === '*' ? Number.MAX_VALUE : 10;
    for (var i = 0, nitems = items.length; i < nitems; i++) {
      var item = items[i];
      for (var j = 0; j < ncolumns; j++) {
        var column = columns[j];
        var field = column.name;
        var matchesSet = fieldNameToMatches.get(field);
        var value = column.getter(item);
        if (column.dataType === '[string]') {
          var nvalues = value == null ? 0 : value.length;
          for (var k = 0; k < nvalues; k++) {
            var val = value[k];
            if (regex.test(val) && !matchesSet.has(val)) {
              matchesSet.add(val);
              nmatches++;
              if (nmatches === maxSize) {
                return formatResponse();
              }
            }

          }
        } else {
          if (value != null && regex.test(value) && !matchesSet.has(value)) {
            matchesSet.add(value);
            nmatches++;
            if (nmatches === maxSize) {
              return formatResponse();
            }
          }
        }

      }
    }
    return formatResponse();

  },
  searchWithPredicates: function (predicates) {
    var _this = this;
    if (predicates == null || predicates.length === 0) {
      this.searchFunction = this.alwaysTrue;
      this.grid
      .setFilter(this.grid
      .getFilter());
      return;
    }
    var columns = this.columns.filter(function (c) {
      return c.searchable && (c.visible || _this.options.searchAllColumns);
    });
    var columnNameToColumn = new morpheus.Map();
    var columnNames = columns.map(function (c) {
      return c.name;
    });
    for (var i = 0; i < columnNames.length; i++) {
      columnNameToColumn.set(columnNames[i].toLowerCase(), columns[i]);
    }

    var filteredPredicates = [];
    var npredicates = predicates.length;
    for (var i = 0; i < npredicates; i++) {
      var predicate = predicates[i];
      var filterColumnName = predicate.getField();
      if (filterColumnName != null) {
        var column = columnNameToColumn.get(filterColumnName.toLowerCase());
        if (column) {
          predicate.column = column;
          filteredPredicates.push(predicate);
        }
      } else {
        filteredPredicates.push(predicate);
      }
    }
    predicates = filteredPredicates;
    npredicates = predicates.length;
    var f = function (item) {
      for (var p = 0; p < npredicates; p++) {
        var predicate = predicates[p];
        var searchColumns;
        if (predicate.column) {
          searchColumns = [predicate.column];
        } else {
          searchColumns = columns;
        }
        for (var j = 0, ncolumns = searchColumns.length; j < ncolumns; j++) {
          var value = searchColumns[j].getter(item);
          if (morpheus.Util.isArray(value)) {
            var nvalues = value.length;
            for (var i = 0; i < nvalues; i++) {
              if (predicate.accept(value[i])) {
                return true;
              }
            }
          } else {
            var predicate = predicates[p];
            if (predicate.accept(value)) {
              return true;
            }
          }
        }

      }

      return false;
    };
    this.searchFunction = f;
    this.grid
    .setFilter(this.grid
    .getFilter());
  },
  /**
   *
   * @param columns Array of {name:column name, ascending:boolean} pairs
   */
  setSortColumns: function (columns) {
    var sort = [];
    var allColumn = this.columns;
    columns.forEach(function (c) {
      var column = null;
      for (var i = 0; i < allColumn.length; i++) {
        if (allColumn[i].name === c.name) {
          column = allColumn[i];
          break;
        }
      }
      if (column != null) {
        column.ascending = c.ascending;
        sort.push(column);
      }
    });
    this.grid.setSortColumns(sort);
    this.redraw();
  },
  search: function (text) {
    var _this = this;
    if (text === '') {
      this.searchFunction = this.alwaysTrue;
      this.grid
      .setFilter(this.grid
      .getFilter());
    } else {
      var tokens = morpheus.Util.getAutocompleteTokens(text);
      var columns = this.columns.filter(function (c) {
        return c.searchable && (c.visible || _this.options.searchAllColumns);
      });
      var columnNames = columns.map(function (c) {
        return c.name;
      });
      var predicates = morpheus.Util.createSearchPredicates({
        tokens: tokens,
        fields: columnNames,
        caseSensitive: false
      });
      this.searchWithPredicates(predicates);
    }
  },
  getSelectedRows: function () {
    return this.grid.getSelectedRows();
  },
  getSelectedItems: function () {
    return this.grid.getSelectedItems();
  },
  selectAll: function () {
    this.grid.selectAll();
  },
  getSelectedItem: function () {
    return this.grid.getSelectedItem();
  },
  setSelectedRows: function (rows) {
    this.grid.setSelectedRows(rows);
  },
  getItems: function () {
    return this.grid.getItems();
  },
  getItem: function (index) {
    return this.grid.getItems()[index];
  },
  getAllItems: function () {
    return this.grid.getAllItems();
  },
  getAllItemCount: function () {
    return this.grid.getAllItemCount();
  },
  getFilteredItemCount: function () {
    return this.grid.getFilteredItemCount();
  },
  setFilter: function (f) {
    this.grid.setFilter(f);
  },
  refilter: function () {
    this.grid.setFilter(this.grid.getFilter());
  },
  getFilter: function () {
    return this.grid.getFilter();
  },
  setItems: function (items) {
    this.grid.setItems(items);
    this.grid.redraw();
    // TODO update height?
  },
  redraw: function () {
    this.grid.redraw();
  },
  setRowClassProvider: function (rowClassProvider) {
    this.grid.setRowClassProvider(rowClassProvider);
  },
  /**
   * @param evtStr
   *            selectionChanged
   */
  on: function (evtStr, handler) {
    this.grid.on(evtStr, handler);
    return this;
  },
  off: function (evtStr, handler) {
    this.grid.off(evtStr, handler);
    return this;
  },
  trigger: function (evtStr) {
    this.grid.trigger(evtStr);
  }
};

tablelegs.Table.showAllValues = function (table, column, $el) {
  var set = new morpheus.Set();
  var dataType = null;
  var items = table.getItems();
  for (var i = 0, nitems = items.length; i < nitems; i++) {
    var value = column.getter(items[i]);
    if (value != null) {
      dataType = morpheus.Util.getDataType(value);
      break;
    }
  }
  if (dataType != null) {
    if (dataType === '[string]' || dataType === '[number]') {
      for (var i = 0, nitems = items.length; i < nitems; i++) {
        var value = column.getter(items[i]);
        if (value != null) {
          for (var j = 0; j < value.length; j++) {
            set.add(value[j]);
          }
        }

      }
    } else {
      for (var i = 0, nitems = items.length; i < nitems; i++) {
        var value = column.getter(items[i]);
        set.add(value);
      }
    }
  }
  var array = set.values();
  array.sort(morpheus.SortKey.ASCENDING_COMPARATOR);
  var $div = $('<div></div>');
  var t = new tablelegs.Table({
      $el: $div,
      items: array,
      responsive: false,
      select: false,
      fixedWidth: '550px',
      showHeader: false,
      columns: [{
        getter: function (item) {
          return item;
        }
      }]
    })
  ;

  var $modal = morpheus.FormBuilder.showInModal({
    title: column.name,
    html: $div
  });

};
tablelegs.Table.createOptions = function (options) {
  options = $.extend(true, {}, {
    items: [],
    height: '564px',
    export: false,
    exportFileName: 'export.txt',
    autoTooltips: true,
    collapseBreakpoint: 330,
    showHeader: true,
    select: true,
    responsive: true,
    autocomplete: true,
    fixedWidth: '320px',
    columnPicker: true,
    getExportItems: function (table) {
      return table.getItems();
    },
    searchAllColumns: true // search hidden and visible columns
  }, options);

  if (!options.columns) {
    options.columns = [{
      name: ''
    }];
  }
  var columns = [];
  options.columns.forEach(function (c, i) {
    var column = tablelegs.Table.createColumn(c, i);
    columns.push(column);
  });

  options.columns = columns;
  if (options.tableClass == null) {
    if (options.columns.length === 1) {
      options.tableClass = 'slick-table-compact';
    } else {
      options.tableClass = 'slick-bordered-table';
    }
  }
  if (!options.rowHeight) {
    // options.rowHeight = options.tableClass === 'slick-table-compact' ? 18
    // 	: 20;
    options.rowHeight = 22;
  }
  return options;
};

tablelegs.Table.createColumn = function (c, id) {
  var column = $.extend(true, {}, {
    id: id,
    tooltip: function (dataContext, value) {
      return tablelegs.Table.defaultRenderer(dataContext, value);
    },
    formatter: function (row, cell, value, columnDef, dataContext) {
      var html = [];
      html.push('<div class="slick-table-wrapper"><div class="slick-cell-wrapper">');
      html.push(column.renderer(dataContext, value));
      html.push('</div></div>');
      return html.join('');

    },
    width: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    export: true,
    sortable: true,
    searchable: true,
    showAll: false,
    name: c.name,
    isHideable: true, // can be hidden with column selector
    renderer: tablelegs.Table.defaultRenderer
  }, c);

  if (column.visible === undefined) {
    column.visible = true;
  }
  if (!column.getter) {
    column.getter = column.field == null ? function (item) {
      return item;
    } : function (item) {
      return item[c.field];
    };
  }
  return column;
};
tablelegs.TableSearchUI = function (options) {
  var _this = this;
  var $search = $('<input name="searchInput" data-type="search" type="text"' +
    ' class="form-control input-sm search-input"' +
    ' placeholder="Search" autocomplete="off">');
  $search.appendTo(options.$el);
  this.$search = $search;
  this.$searchResults = $('<span data-name="rowcount" class="pad-right-8 pad-top-2' +
    ' tableview-rowcount"' +
    ' data-type="search"></span>');

  this.$showAll = $('<button data-name="showAll" data-type="search" class="pad-left-8 btn' +
    ' btn-primary' +
    ' btn-sm' +
    '">Show All</button>');
  this.$searchResults.appendTo(options.$right);
  if (options.showAll) {
    this.$showAll.appendTo(options.$right);
  }

  this.$showAll.on('click', function (e) {
    e.preventDefault();
    $search.val('');
    _this.table.search('');
    _this.table.trigger('showAll', {table: _this.table});

  });
  $search.on('keyup', _.debounce(function () {
    _this.table.search($.trim($(this).val()));
  }, 100));
  if (options.autocomplete) {
    morpheus.Util.autosuggest({
      $el: $search,
      minLength: 0,
      suggestWhenEmpty: options.suggestWhenEmpty,
      filter: function (tokens, response) {
        _this.table.autocomplete(tokens, response);
      },
      select: function () {
        _this.table.search($.trim($search.val()));
      }
    });
  }
};

tablelegs.TableSearchUI.prototype = {
  updateSearchLabel: function () {
    var text = 'Viewing: ' + morpheus.Util.intFormat(this.table.getFilteredItemCount()) + ' / ' + morpheus.Util.intFormat(this.table.getAllItemCount());
    this.$searchResults.html(text);
  },
  setTable: function (table) {
    this.table = table;
    var _this = this;

    table.on('filter', function () {
      _this.updateSearchLabel();
    });

  }

};

tablelegs.Table.createCheckBoxColumn = function (columnOptions) {
  var set = new morpheus.Set();
  var renderer = function (item, value) {
    return '<span><input data-tablelegs-toggle="true" type="checkbox" '
      + (set.has(value) ? ' checked' : '') + '/></span>';
  };
  if (columnOptions.renderer) {
    renderer = columnOptions.renderer;
  }

  var table;
  var column;
  var header = [];
  header.push('<div data-name="select" style="display:inline-block;" class="dropdown">');
  header.push('<button class="btn dropdown-toggle row-selector-btn" type="button"' +
    ' data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">');
  header.push('<i data-name="checkbox" class="fa fa-square-o checkbox-dropdown"' +
    ' aria-hidden="true"></i>');
  header.push('  <span data-name="count"></span> <span class="caret"></span>');
  header.push('</button>');
  header.push('<ul class="dropdown-menu">');
  header.push('<li><a data-name="all" href="#">Select All</a></li>');
  header.push('<li><a data-name="none" href="#">Select None</a></li>');
  header.push('<li><a data-name="invert" href="#">Invert Selection</a></li>');
  header.push('</ul>');
  header.push('</div>');
  // header.push('<span class="pad-left-4 pad-right-4" data-name="selectedCount">0 selected</span>');

  var $header = $(header.join(''));
  var $selectedCount = $header.find('[data-name=count]');
  var $cb = $header.find('[data-name=checkbox]');
  var $exportLink;
  $cb.on('click', function (e) {
    if ($cb.hasClass('fa-square-o')) {
      var items = table.getItems();
      for (var i = 0; i < items.length; i++) {
        set.add(column.getter(items[i]));
      }
    } else {
      var items = table.getItems();
      for (var i = 0; i < items.length; i++) {
        set.remove(column.getter(items[i]));
      }
    }
    table.trigger('checkBoxSelectionChanged', {
      source: table,
      set: set,
      column: column
    });
    e.preventDefault();
    e.stopPropagation();

  });

  function updateCheckBox() {
    if (set.size() === 0) {
      $cb.attr('class', 'fa fa-square-o');
    } else {
      var items = table.getItems();
      var count = 0;
      var found = false;
      var notFound = false;
      for (var i = 0; i < items.length; i++) {
        if (set.has(column.getter(items[i]))) {
          count++;
          found = true;
          if (notFound) {
            break;
          }
        } else {
          notFound = true;
          if (found) {
            break;
          }
        }
      }
      if (count === 0) {
        $cb.attr('class', 'fa fa-square-o');
      } else if (count === items.length) {
        $cb.attr('class', 'fa fa-check-square-o');
      } else {
        $cb.attr('class', 'fa fa-minus-square-o');
      }
    }
    if ($exportLink) {
      if (set.size() === 0) {
        $exportLink.addClass('disabled');
      } else {
        $exportLink.removeClass('disabled');
      }

    }

  }

  function updateItemCount() {
    $selectedCount.html('(' + morpheus.Util.intFormat(set.size()) + ')');
  };

  $header.on('click', 'a', function (e) {
    var found = false;
    if ($(this).data('name') === 'none') {
      // var items = table.getItems();
      // for (var i = 0; i < items.length; i++) {
      //   set.remove(column.getter(items[i]));
      // }
      set.clear();
      found = true;
    } else if ($(this).data('name') === 'all') {
      var items = table.getItems();
      for (var i = 0; i < items.length; i++) {
        set.add(column.getter(items[i]));
      }
      found = true;

    } else if ($(this).data('name') === 'invert') {
      var items = table.getItems();
      for (var i = 0; i < items.length; i++) {
        if (set.has(column.getter((items[i])))) {
          set.remove(column.getter(items[i]));
        } else {
          set.add(column.getter(items[i]));
        }

      }

      found = true;

    }
    if (found) {
      table.trigger('checkBoxSelectionChanged', {
        source: table,
        set: set,
        column: column
      });

      e.preventDefault();
    }

  });

  function toggleItem(item) {
    var value = column.getter(item);
    if (set.has(value)) {
      set.remove(value);
    } else {
      set.add(value);
    }
    table.trigger('checkBoxSelectionChanged', {
      source: table,
      set: set,
      column: column
    });

  }

  renderer.init = function (options) {
    table = options.table;
    column = options.column;
    // if (!table.options.getExportItems) {
    table.options.getExportItems = function (t) {
      return table.getAllItems().filter(function (item) {
        return set.has(column.getter(item));
      });
    };
    // }
    if (column.exportLink) {
      var $export = $('<li role="separator" class="divider"></li><li data-name="exportLi"' +
        ' class="disabled"><a data-name="export"' +
        ' href="#">Export</a></li>');

      $export.appendTo($header.find('ul'));
      $exportLink = $header.find('[data-name=exportLi]');
      $header.find('[data-name=export]').on('click', function (e) {
        e.preventDefault();
        table.exportTable();
      });
    }
    $header.prependTo(table.$header.find('[data-name=left]'));

    table.on('filter', updateCheckBox);
    table.$gridDiv.on('keyup', function (e) {
      if (e.which === 13) {
        var item = table.getSelectedItem();
        if (item != null) {
          toggleItem(item);
        }
      }
    });

    table.$gridDiv.on('click', 'input[data-tablelegs-toggle=true]',
      function (e) {
        var cell = table.grid.slickGrid.getCellFromEvent(e);
        if (cell) {
          var item = table.getItems()[cell.row];
          toggleItem(item);
        }
      }
    );
    updateItemCount();
    table.on('checkBoxSelectionChanged', function () {
      updateCheckBox();
      updateItemCount();
      table.redraw();
    });

  };

  var c = $
  .extend(
    true,
    {}, {
      set: set,
      $header: $header,
      cssClass: 'table-legs-align-center',
      headerCssClass: 'text-center',
      getSelection: function () {
        return set;
      },
      getter: function (item) {
        return item[this.field];
      },
      name: '<i style="font-size:13px;" class="fa fa-check"' +
      ' aria-hidden="true"></i>',
      renderer: renderer,
      width: 32,
      maxWidth: 32,
      minWidth: 32,
      resizable: false,
      searchable: false,
      hidden: false, // a table column that can be used for search, but is never shown
      isHideable: false, // can be hidden with column selector
      visible: true,
      export: false,
      exportLink: true

    }, columnOptions);
  if (!c.sortGetter) {
    c.sortGetter = function (item) {
      return !set.has(c.getter(item));
    };
  }
  return c;

};


