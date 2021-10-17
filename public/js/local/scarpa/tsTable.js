/**
 * Created by turner on 5/25/16.
 */
var scarpa = (function (scarpa) {

  scarpa.TSTable = function (config) {

    var self = this,
      columns = [],
      $customButtons,
      str,
      $rowCounter;

    this.context = {};

    this.config = config;

    this.filterEngineDidEvaluate = undefined;

    this.$parent = config.$parent;
    this.$parent.empty();

    // Checkbox
    if (true === config.doShowCheckbox) {

      this.checkBoxColumn = tablelegs.Table.createCheckBoxColumn(
        {
          exportLink: false,

          //  true - not presented in drop-down.
          // false -     presented in drop-down.
          //hidden: true,
          hidden: false,

          field: 'pert_id'
        });

      if (_.size(Cookies.getJSON('selectedRows')) > 0) {
        _.each(Cookies.getJSON('selectedRows'), function (value) {
          self.checkBoxColumn.getSelection().add(value);
        });
      }

      columns.push(this.checkBoxColumn);
    }

    columns.push.apply(columns, config.columns);

    this.table = new tablelegs.Table({
      rowHeight: 18,
      responsiveHeight: true,
      height: null,
      $el: config.$parent,
      columns: columns,
      items: config.data,
      select: config.doRowSelection || false,
      search: config.doSearch,
      tableClass: 'slick-bordered-table slick-hover-table'
    });
    this.$tableRowCounter = this.$parent.find('.tableview-rowcount');

    // console.log('tstable - init ' + this.$tableRowCounter.text());

    if (config.rowSelectionChangedHandler) {
      this.table.on('selectionChanged', function (e) {
        config.rowSelectionChangedHandler(self, e);
      });
    }

    this.table.on('filter', function (e) {

      var $searchInput,
        query;

      scarpa.dispatch.tstable_did_update_row_counter(self);

      if (true === self.filterEngineDidEvaluate) {
        self.filterEngineDidEvaluate = false;
      } else {
        $searchInput = self.$parent.find('[name=searchInput]');
        query = $searchInput.val();
        scarpa.dispatch.do_evaluate_filter_chain(query);
      }

    });

    this.table.on('showAll', function (e) {
      scarpa.dispatch.tstable_did_show_all_rows();
    });

    if (config.checkboxClickHandler) {
      this.table.on('checkBoxSelectionChanged', function (e) {
        config.checkboxClickHandler(self, e);
      });
    }

    if (config.mouseOverHandler) {
      this.table.on('mouseover', function (e) {
        config.mouseOverHandler(self, e);
      });
    }

    if (config.mouseOutHandler) {
      this.table.on('mouseout', function (e) {
        config.mouseOutHandler(self, e);
      });
    }

    if (config.mouseClickHandler) {
      this.table.on('click', function (e) {
        config.mouseClickHandler(self, e);
      });
    }

    if (config.rowClassProvider) {

      //this.rowHighlighter = new scarpa.TSTableRowColorizer(new morpheus.Map(), 'table-row-selected', 10);
      this.rowHighlighter = new scarpa.TSTableRowColorizer(new morpheus.Map(), 'table-row-pert-type-background', undefined);

      this.table.setRowClassProvider(config.rowClassProvider);
    }

    if (config.dropdownMenuCustomizer) {
      config.dropdownMenuCustomizer(this.$parent);
    }

    if (config.customButtons) {

      str = [];
      if (config.tabletype === "connection") {
        str.push('<button id="export-table-ct" type="button"><i' +
          ' class="fa fa-download"> </i><span>Export</span></button>');
      }
      else if (config.tabletype === "touchstone") {
        str.push('<span class="hidden-xs hidden-sm hidden-lg" style="margin-left:10px;margin-right:8px;">View connections:</span>');
        str.push('<span class="hidden-xs hidden-sm hidden-md" style="margin-left:10px;margin-right:10px;">View connections' +
          ' as:</span>');
        str.push('<span class="hidden-md hidden-lg" style="margin-left:5px;"></span>');
        str.push('<button id="show-detailed-list" type="button" class="btn-sm btn-send-to-app"><i' +
          ' class="fa fa-align-left"> </i><span class="hidden-1142">Detailed list</span></button>');
        str.push('<button style="margin-left:10px;" id="show-heatmap" type="button" class="btn-sm btn-send-to-app"><i class="fa fa-th"> </i><span class="hidden-1142">Heatmap</span></button>');

        // str.push('<div style="margin-left:10px;" class="btn-group">');
        // str.push('<button type="button" class="btn drk-btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">');
        // str.push('	More <span class="caret"></span>');
        // str.push('</button>');
        // str.push('<ul class="dropdown-menu">');
        // str.push('<li><a id="introspect" href="#">Introspect</a></li>');
        // str.push('<li><a id="tanimoto" href="#">Tanimoto</a></li>');
        // str.push('<li><a id="signature" href="#">Signatures</a></li>');
        // str.push('</ul>');
        // str.push('</div>');
      }

      $customButtons = $(str.join(''));
      $customButtons.appendTo(this.$parent.find('[data-name=buttons]'));

    }
  };

  scarpa.TSTable.prototype.clearSearch = function () {

    var $searchInput = this.$parent.find('[name=searchInput]');
    $searchInput.val(undefined);

    this.table.searchFunction = this.table.alwaysTrue;

  };

  scarpa.TSTable.prototype.unIlluminateAllTableRows = function () {

    this.rowHighlighter.pertIdToRowClass.clear();

    _.each(this.table.getItems(), function (datum) {
      datum.isSelected = false;
    });

    this.table.redraw();

  };

  scarpa.TSTable.prototype.updateData = function (data, t) {

    // console.log('tstable - updateData ' + this.$tableRowCounter.text());

    if (!t) {
      this.filterEngineDidEvaluate = true;
      this.table.setItems(data || []);

      if (this.config.rowClassProvider) {
        this.unIlluminateAllTableRows();
      }
    }
  };

  scarpa.TSTableRowColorizer = function (map, prefix, count) {

    var self = this;

    this.pertIdToRowClass = map;

    this.prefix = prefix;

    if ('table-row-pert-type-background' === prefix) {

      this.cssDictionary = {};
      _.each(['cp', 'kd', 'oe', 'cc'], function (pert_type) {

        var name = self.prefix + '-' + pert_type,
          rgbaProperty = scarpa.cssPropertyWithPropertyNameAndClassName('background-color', name);

        self.cssDictionary[pert_type] = {
          className: name,
          shader: scarpa.SVGShaderWithCSSPropertyRGBA(rgbaProperty)
        };

      });

    } else {

      this.css = [];
      _.each(_.range(count), function (i) {

        var name = self.prefix + '-' + scarpa.zeroPaddedNumber(i, 3),
          rgbaProperty = scarpa.cssPropertyWithPropertyNameAndClassName('background-color', name);

        self.css.push({
          className: name,
          shader: scarpa.SVGShaderWithCSSPropertyRGBA(rgbaProperty)
        });
      });

    }

    this.cssIndex = 0;

  };

  scarpa.TSTableRowColorizer.prototype.hasRowClassObjectWithPertID = function (pert_id) {
    return this.pertIdToRowClass.has(pert_id);
  };

  scarpa.TSTableRowColorizer.prototype.rowClassObjectWithWithPertID = function (pert_id) {
    return this.pertIdToRowClass.get(pert_id);
  };

  scarpa.TSTableRowColorizer.prototype.removeRowClassObjectWithPertID = function (pert_id) {
    this.pertIdToRowClass.remove(pert_id);
  };

  scarpa.TSTableRowColorizer.prototype.addRowClassObjectWithDatum = function (datum) {
    if (datum.pert_id) {
      this.pertIdToRowClass.set(datum.pert_id, this.cssDictionary[datum.pert_type]);
    }
    else {
      this.pertIdToRowClass.set(datum.code_id, this.cssDictionary[datum.pert_type]);
    }
  };

  scarpa.TSTableRowColorizer.prototype.nextAvailableCSSObject = function () {

    var index = this.cssIndex % _.size(this.css);

    ++(this.cssIndex);

    return this.css[index];
  };

  return scarpa;
})(scarpa || {});
