clue.FilterManagerUI = function (filterManager, $el) {
  var _this = this;
  this.filterManager = filterManager;
  this.$el = $el;
  this.nameToUI = new morpheus.Map();
  this.nameToDiv = new morpheus.Map();
  var $title = $('<div><p style="font-size:13px;" data-name="appliedFilters"></p> <a name="reset"' +
      ' role="button">Reset all</a></div>');
  $title.appendTo(this.$el);
  this.$reset = $title.find('[name=reset]');
  this.$appliedFilters = $title.find('[data-name=appliedFilters]');
  this.$reset.on('click', function (e) {
    e.preventDefault();
    filterManager.reset();
    // update sliders to default values
    _this.nameToUI.forEach(function (ui, name) {
      ui.reset();
    });
    _this.filter();
  });
};

clue.FilterManagerUI.prototype = {
  firstFilter: true,
  getDiv: function (name) {
    return this.nameToDiv.get(name);
  },
  setItems: function (items) {
    this.filterManager.array = items;
    this.filter();
  },
  addIndicator: function (name, value) {
    var target = _.uniqueId('target');
    var $link = $('<div style="padding-bottom:0px;" class="filter-group-title border-top">' + name + '<a class="pull-right" role="button"' +
        ' data-toggle="collapse" href="#'
        + target
        + '" aria-expanded="true" aria-controls="'
        + target
        + '"><i style="vertical-align: middle;" class="fa fa-angle-up" aria-hidden="true"></i></a></div>');
    $link.appendTo(this.$el);
    var $div = $('<div class="collapse in" id="' + target
        + '"><div>' + value + '</div></div>');
    $div.appendTo(this.$el);
  },
  /**
   *
   * @param options.name Name for this filter to display in UI
   * @param filter The filter object with the methods isEmpty, reset, init, accept, gather,
   * createUI
   */
  add: function (options) {
    var name = options.name;
    var o_name = options.o_name;
    var filter = options.filter;
    filter.name = name;
    this.filterManager.add(name, filter);
    var _this = this;
    var target = _.uniqueId('target');
    var $link = $('<div style="padding-bottom:0px;" class="filter-group-title border-top">' + name + (options.remove
        ? '<button style="margin-left:8px;" class="btn btn-primary btn-sm" href="#" data-name="remove" role="button"><i class="fa fa-times" aria-hidden="true"></i></button>'
        : '') + '<a' +
        ' role="button" class="pull-right"' +
        ' data-toggle="collapse" href="#'
        + target
        + '" aria-expanded="true" aria-controls="'
        + target
        + '"><i style="vertical-align: middle;" class="fa fa-angle-up" aria-hidden="true"></i></a></div>');

    var o_name_div = null;
    if(o_name && name !== o_name)
    {
      o_name_div = $('<div class="filter-group-sub-head" style="color: darkgrey">' + o_name + '</div>');
    }

    var $i = $link.find('i');
    var $div = $('<div class="collapse in" id="' + target + '"></div>');
    $link.find('[data-name=remove]').on('click', function (e) {
      e.preventDefault();
      $link.remove();
      $div.remove();
      _this.nameToDiv.remove(name);
    });
    $link.appendTo(this.$el);
    this.nameToDiv.set(name, $div);
    if(o_name_div)
    {
      o_name_div.appendTo(this.$el);
    }
    $div.appendTo(this.$el);
    var ui = filter.createUI({
      $el: $div,
      chopAt4 : options.chopAt4,
      cb: function () {
        _this.filter();
      },
        hideCheckBox: options.hideCheckBox
    });
    $('#' + target).on('shown.bs.collapse', function (e) {
      $i.attr('class', 'fa fa-angle-up');
    }).on('hidden.bs.collapse', function (e) {
      $i.attr('class', 'fa fa-angle-down');
    });
    this.nameToUI.set(name, ui);
  },
  filter: function () {
    if (this.updating) {
      return;
    }
    this.updating = true;
    var _this = this;
    this.filterManager.filter();
    this.nameToUI.forEach(function (ui, name) {
      var filter = _this.filterManager.get(name);
      ui.update();
    });
    this.updating = false;
    if (this.filterManager.filterCount > 0) {
      this.$reset.show();
      var text = [];
      this.nameToUI.forEach(function (ui, name) {
        ui.summarize(text);
      });
      this.$appliedFilters.html(text.join(''));
    } else {
      this.$appliedFilters.html('');
      this.$reset.hide();
    }

    this.trigger('filter', {});

  },
  getFilteredArray: function () {
    return this.filterManager.getFilteredArray();
  },
  get: function (name) {
    return this.filterManager.get(name);
  },
  getFilterManager: function () {
    return this.filterManager;
  },
  reset: function () {
    this.filterManager.reset();
    this.nameToUI.forEach(function (ui, name) {
      ui.reset();
    });
    this.filterManager.filter();
  }
};
morpheus.Util.extend(clue.FilterManagerUI, morpheus.Events);
clue.FilterManager = function (array) {
  this.array = array;
  this.filteredItems = array;
  this.filters = [];
  this.filterNameToFilter = new morpheus.Map();
};
clue.FilterManager.prototype = {
  getFilteredArray: function () {
    return this.filteredItems;
  },
  reset: function () {
    for (var j = 0; j < this.filters.length; j++) {
      this.filters[j].reset();
    }
  },
  init: function () {
    this.filterCount = 0;
    var filters = [];
    for (var j = 0; j < this.filters.length; j++) {
      if (!this.filters[j].isEmpty()) {
        this.filterCount++;
      }
      this.filters[j].init();
      filters.push(this.filters[j]);
    }
    return filters;
  },
  createFilter: function () {
    var _this = this;
    var filters;
    var nfilters;
    return {
      init: function () {
        filters = _this.init();
        nfilters = filters.length;
      },
      accept: function (item) {
        for (var j = 0; j < nfilters; j++) {
          if (!filters[j].accept(item)) {
            return false;
          }
        }
        return true;
      },
      isEmpty: function () {
        return nfilters === 0;
      }
    };
  },
  filter: function () {
    var array = this.array;
    var filters = this.init();
    var nfilters = filters.length;
    var filteredItems = [];
    var nitems = array.length;
    var preFilter = null;
    if (this.preFilter && !this.preFilter.isEmpty()) {
      preFilter = this.preFilter;
      preFilter.init();
    }
    for (var i = 0; i < nitems; i++) {
      var obj = array[i];
      if (preFilter !== null) {
        if (!preFilter.accept(obj)) {
          continue;
        }
      }
      var sum = 0;
      var filterArray = new Uint8Array(nfilters);
      for (var j = 0; j < nfilters; j++) {
        var pass = filters[j].accept(obj) ? 1 : 0;
        filterArray[j] = pass;
        sum += pass;
      }

      if (sum === nfilters) { // passed all filters
        filteredItems.push(obj);
        for (var j = 0; j < nfilters; j++) {
          filters[j].gather(obj, false);
        }
      } else { // didn't pass all filters
        for (var j = 0; j < nfilters; j++) {
          // passed all other filters, but not my own
          if ((filterArray[j] === 0 && sum === (nfilters - 1))) {
            filters[j].gather(obj, false);
          }
        }
      }

    }

    this.filteredItems = filteredItems;

  },
  add: function (name, filter) {
    this.filters.push(filter);
    this.filterNameToFilter.set(name, filter);
  },
  get: function (name) {
    return this.filterNameToFilter.get(name);
  }
};
clue.RangeFilter = function (options) {
  this.getter = options;
  this.range = options.range || [0, 100];
  this.prettify = options.prettify;
  this.step = options.step || 1;
  // min and max define current selected range of slider
  this.min = this.range[0];
  this.max = this.range[1];
};

clue.RangeFilter.prototype = {
  createUI: function (options) {
    var _this = this;
    var $slider = $('<div style="width:100%;"><div name="slider"></div></div>');
    $slider.appendTo(options.$el);
    var $sliderDiv = $slider.find('[name=slider]');
    $sliderDiv.ionRangeSlider({
      min: this.range[0],
      max: this.range[1],
      from: this.range[0],
      to: this.range[1],
      step: this.step || 1,
      type: 'double',
      prettify_enabled: true,
      prettify: _this.prettify,
      onFinish: function (e) {
        _this.min = e.from;
        _this.max = e.to;
        options.cb();
      }

    });
    $sliderDiv.reset = function () {
      $sliderDiv.data('ionRangeSlider').update({
        min: _this.range[0],
        max: _this.range[1],
        from: _this.range[0], // from and to define current
        // selected range
        to: _this.range[1]
      });
    };

    $sliderDiv.update = function () {
      $sliderDiv.data('ionRangeSlider').update({
        min: _this.filteredMin,
        max: _this.filteredMax
      });
    };
    $sliderDiv.summarize = function (text) {
      if (!_this.isEmpty()) {
        text.push(' ');
        text.push('<b>' + _this.name + '</b>');
        text.push(' : ');
        text.push(morpheus.Util.nf(_this.min) + ' to '
            + morpheus.Util.nf(_this.max));
      }
    };
    return $sliderDiv;
  },
  isEmpty: function () {
    return this.min === this.range[0] && this.max === this.range[1];
  },
  reset: function () {
    this.min = this.range[0];
    this.max = this.range[1];
  },
  init: function () {
    this.values = [];
    this.filteredMin = Number.MAX_VALUE;
    this.filteredMax = -Number.MAX_VALUE;
  },

  accept: function (item) {
    if (this.isEmpty()) {
      return true;
    }
    var count = this.getter.nvalues(item);
    for (var i = 0; i < count; i++) {
      var value = this.getter.get(item, i);
      if (value >= this.min && value <= this.max) {
        return true;
      }
    }
  },
  gather: function (item, useFilter) {
    var count = this.getter.nvalues(item);
    if (useFilter) {
      for (var i = 0; i < count; i++) {
        var value = this.getter.get(item, i);
        if (!isNaN(value)) {
          if (value >= this.min && value <= this.max) {
            this.filteredMin = Math.min(this.filteredMin, value);
            this.filteredMax = Math.max(this.filteredMax, value);

          }
        }
      }
    } else {
      for (var i = 0; i < count; i++) {
        var value = this.getter.get(item, i);
        if (!isNaN(value)) {
          this.filteredMin = Math.min(this.filteredMin, value);
          this.filteredMax = Math.max(this.filteredMax, value);
        }
      }
    }
  }
};

clue.SetFilter = function (getter, options) {
  if (options == null) {
    options = {};
  }
  this.getter = getter;
  this.set = new morpheus.Set();
  this.valueToCount = new morpheus.Map();
  this.options = options;
  if (options && options.sortOrder) {
    var valueToIndex = new morpheus.Map();
    for (var i = 0; i < options.sortOrder.length; i++) {
      valueToIndex.set(options.sortOrder[i], i);
    }
    this.sorter = function (a, b) {
      a = valueToIndex.get(a);
      b = valueToIndex.get(b);
      return (a === b ? 0 : (a < b ? -1 : 1));
    };
  } else if (options && options.comparator) {
    this.sorter = options.comparator;
  } else {
    this.sorter = function (a, b) {
      a = a.toLowerCase ? a.toLowerCase() : a;
      b = b.toLowerCase ? b.toLowerCase() : b;
      return (a === b ? 0 : (a < b ? -1 : 1));
    };
  }

};
clue.SetFilter.prototype = {
  init: function () {
    this.valueToCount.clear();
  },
  isEmpty: function () {
    return this.set.size() === 0;
  },
  accept: function (item) {
    if (this.set.size() === 0) {
      return true;
    }
    var count = this.getter.nvalues(item);
    for (var i = 0; i < count; i++) {
      var val = this.getter.get(item, i);
      if (this.set.has(val)) {
        return true;
      }
    }
    return false;
  },
  getCount: function (value) {
    return this.valueToCount.get(value);
  },
  getItemCount: function () {
    return this.valueToCount.size();
  },
  reset: function () {
    this.set.clear();
  },
  getValues: function () {
        var values = [];

        var output = [];
        this.valueToCount.forEach(function (count, value) {
            output.push({"name": value, "count": count});
        });
          var objects = null;

        if (this.options && this.options.sortByName) {
          objects = _.sortBy(output, "name").reverse();
        }else{
          objects = _.sortBy(output, 'count');
        }

        for (var index = 0; index < objects.length; index++) {
            values.push(objects[index].name);
        }
        return values.reverse();
  },
  getCheckedValues: function () {
    var values = this.set.values();
    values.sort(this.sorter);
    return values;
  },
  createUI: function (options) {
    var items = this.getValues().map(function (item) {
      return {value: item};
    });
    var _this = this;


    var hideCheckBox = false;
    if(options.hideCheckBox){
        hideCheckBox = options.hideCheckBox;
    }
    var checkboxColumn = tablelegs.Table.createCheckBoxColumn({
      field: 'value',
        hideCheckBox: hideCheckBox,
      cssClass: '',
      resizable: true,
      exportLink: false,
      searchable: true,
      renderer: function (item, value) {
          var display_value = value;
          if (display_value === "")
          {
              display_value = "none";
          }
        return '<label><input data-tablelegs-toggle="true" type="checkbox" '
            + (_this.set.has(value) ? ' checked' : '') + '/>' + ' ' + display_value + '<span> ('
            + morpheus.Util.intFormat(_this
                .getCount(value)) + ')</span></label>';
      }
    });
    checkboxColumn.width = undefined;
    checkboxColumn.maxWidth = undefined;
    checkboxColumn.minWidth = undefined;
    this.set = checkboxColumn.set;
    var list = new tablelegs.Table({
      $el: options.$el,
      columnPicker: false,
      tableClass: 'filter-group',
      showAll: false,
      showHeader: false,
      columnPicker: false,
      export: false,
      search: this.options.search,
      select: false,
      autocomplete: false,
      columns: [checkboxColumn],
      items: [],
      set: this.set
    });
    options.$el.find('[data-name=right]').remove(); // hack to remove show all for now
    list.on('checkBoxSelectionChanged', function (e) {
      options.cb();
    });
      list.reset = function () {
          list.trigger('checkBoxSelectionChanged', {
          });
      };
    list.firstTime = true;
    list.update = function () {
      list.setItems(_this.getValues().map(function (item) {
        return {
          value: item
        };
      }));
      if (list.firstTime) {
        if (options.chopAt4) {
          if (list.getItems().length <= 4) {
            list.setHeight('auto');
            options.$el.find('.slick-table-header').remove();  // hack to remove search

          } else {
            list.setHeight('130px');
          }
        } else {
          if (list.getItems().length <= 10) {
            list.setHeight('auto');
            options.$el.find('.slick-table-header').remove();  // hack to remove search

          } else {
            list.setHeight('176px');
          }
        }
        list.firstTime = false;
      }
    };
    //$div.find('.slick-table-header').remove();
    list.summarize = function (text) {
      var checked = _this.getCheckedValues();
      if (checked.length > 0) {
        text.push(' ');
        text.push('<b>' + _this.name + '</b>');
        text.push(' : ');
        if (checked.length >= 11) {
          text.push(morpheus.Util.intFormat(checked.length) + ' selected');
        } else {
          checked.forEach(function (c, i) {
            if (i > 0) {
              text.push(', ');
            }
            text.push(c);
          });

        }

      }
    };
    return list;
  },
  gather: function (item, useFilter) {
    var count = this.getter.nvalues(item);
    for (var i = 0; i < count; i++) {
      var value = this.getter.get(item, i);
      if (!useFilter || this.set.size() === 0 || this.set.has(value)) {
        var prior = this.valueToCount.get(value) || 0;
        this.valueToCount.set(value, prior + 1);
      }
    }

  }
};

clue.HistogramFilter = function (options) {
  this.getter = options;
  this.range = options.range || [0, 100];
  this.prettify = options.prettify;
  this.step = options.step || 1;
  // min and max define current selected range of slider
  this.min = this.range[0];
  this.max = this.range[1];
};

clue.HistogramFilter.prototype = {
  createUI: function (options) {
    var _this = this;
    var $slider = $('<div style="width:100%;"><div name="slider"></div></div>');
    $slider.appendTo(options.$el);
    var $sliderDiv = $slider.find('[name=slider]');
    $sliderDiv.ionRangeSlider({
      min: this.range[0],
      max: this.range[1],
      from: this.range[0],
      to: this.range[1],
      step: this.step || 1,
      type: 'double',
      prettify_enabled: true,
      prettify: _this.prettify,
      onFinish: function (e) {
        _this.min = e.from;
        _this.max = e.to;
        options.cb();
      }

    });
    $sliderDiv.reset = function () {
      $sliderDiv.data('ionRangeSlider').update({
        min: _this.range[0],
        max: _this.range[1],
        from: _this.range[0], // from and to define current
        // selected range
        to: _this.range[1]
      });
    };

    $sliderDiv.update = function () {
      $sliderDiv.data('ionRangeSlider').update({
        min: _this.filteredMin,
        max: _this.filteredMax
      });
    };
    $sliderDiv.summarize = function (text) {
      if (!_this.isEmpty()) {
        text.push(' ');
        text.push('<b>' + _this.name + '</b>');
        text.push(' : ');
        text.push(morpheus.Util.nf(_this.min) + ' to '
            + morpheus.Util.nf(_this.max));
      }
    };
    return $sliderDiv;
  },
  isEmpty: function () {
    return this.min === this.range[0] && this.max === this.range[1];
  },
  reset: function () {
    this.min = this.range[0];
    this.max = this.range[1];
  },
  init: function () {
    this.values = [];
    this.filteredMin = Number.MAX_VALUE;
    this.filteredMax = -Number.MAX_VALUE;
  },

  accept: function (item) {
    if (this.isEmpty()) {
      return true;
    }
    var count = this.getter.nvalues(item);
    for (var i = 0; i < count; i++) {
      var value = this.getter.get(item, i);
      if (value >= this.min && value <= this.max) {
        return true;
      }
    }
  },
  gather: function (item, useFilter) {
    var count = this.getter.nvalues(item);
    if (useFilter) {
      for (var i = 0; i < count; i++) {
        var value = this.getter.get(item, i);
        if (!isNaN(value)) {
          if (value >= this.min && value <= this.max) {
            this.filteredMin = Math.min(this.filteredMin, value);
            this.filteredMax = Math.max(this.filteredMax, value);

          }
        }
      }
    } else {
      for (var i = 0; i < count; i++) {
        var value = this.getter.get(item, i);
        if (!isNaN(value)) {
          this.filteredMin = Math.min(this.filteredMin, value);
          this.filteredMax = Math.max(this.filteredMax, value);
        }
      }
    }
  }
};
