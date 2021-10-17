morpheus.ClueLanding = function () {
  var _this = this;
  this.$landing = $('#static-content');
  morpheus.Util.loadTrackingCode();
  window.onerror = function () {
    morpheus.FormBuilder.showInModal({
      title: 'Error',
      html: 'Oops, something went wrong. Please try again.'
    });
  };
  $(window).on('beforeunload.morpheus', function () {
    if (tabManager.getTabCount() > 0) {
      return 'Are you sure you want to close Morpheus?';
    }
  });
  var searchString = window.location.href.split("json=");
  var urlSearchString = window.location.href.split("url=");
  if(searchString.length > 1)
  {
    searchString = searchString[1];
  }
  if(urlSearchString.length > 1){
    urlSearchString = urlSearchString[1];
  }

  if (searchString.length === 0 && urlSearchString.length === 0) {
    searchString = window.location.hash;
  }
  else
  {
    if(searchString.length > 0){
      if(window.location.search.includes("json=")){
        searchString = "json=" + searchString;
      }
    }
    if(urlSearchString.length > 0){
        if (window.location.search.includes("url=")) {
            searchString = "url=" + urlSearchString;
      }
    }
  }
    const tabManager = new morpheus.TabManager({landingPage: this});
  this.tabManager = tabManager;
  tabManager.on('change rename add remove', function (e) {
    var title = tabManager.getTabText(tabManager.getActiveTabId());
    if (title == null || title === '') {
      title = 'Morpheus';
    }
    document.title = title;
  });

  tabManager.$nav.appendTo($('#dynamic-content'));
  tabManager.$tabContent.appendTo($('#dynamic-content'));
    const $input = $('#mlanding');
    var filePicker = new morpheus.FilePicker({
        fileCallback: function (files) {
            _this.openFile(files);
        },
        optionsCallback: function (opt) {
            _this.open(opt);
        }
    });
    filePicker.$el.appendTo($input);

  if (searchString.length === 0 || (searchString.length === 1 && searchString[0].startsWith("http"))) {

    this.show();
    } else {
    var keyValuePairs = searchString.split('&');
    var params = {};
    for (var i = 0; i < keyValuePairs.length; i++) {
      var pair = keyValuePairs[i].split('=');
      params[pair[0]] = decodeURIComponent(pair[1]);
    }
    if (params.json) {
      var options = JSON.parse(decodeURIComponent(params.json));
      let config = {};
      if(options.gct){//we assume that you have a file that you would like to share

        if (options.config && options.config.includes(".json")) {
          fetch(options.config).then(function (response) {
            return response.json().then(function (data) {
              return data;
            });
          }).then(function (config2) {
            const optionsArray = [];
            if (options.gsea) {
              //clone config2
              const gsea_config = $.extend({}, config2);
              gsea_config["dataset"] = options.gsea.gct;
              optionsArray.push(gsea_config);
            }
            config2["dataset"] = options.gct;
            optionsArray.push(config2);
            _this.open(optionsArray);
          }).catch(function (error) {
           // http://s3.amazonaws.com/data.clue.io/api/jasiedu@broadinstitute.org/results/Dec_16_2020/my_analysis.sig_annotate_tool.5fd968cf8aaf9e001107ce1d/zcvcvzcvczcz.gct
            console.log('error:', error);
          });
          //read the config file and insert the dataset name
        }else{
          _this.open(config);
        }
      } else if (options.dataset && options.rows) {
        config["dataset"] = options.dataset;
        config["rows"] = options.rows;
        config["rowAnnotations"] = options.rowAnnotations;
        config["columns"] = options.columns;
        config["columnAnnotations"] = options.columnAnnotations;
        console.log(config);
        _this.open(config);
      } else {
        this.open(options);
      }
    } else if (params.url) { // data to config
      var $loading = clue.createLoadingEl();
      $loading.appendTo($('#vis'));
        morpheus.Util.getText(params.url).then(function (text) {
        var options = JSON.parse(text);
        _this.open(options);
      }).catch(function (err) {
          console.log(err);
          //console.log('Unable to get config file');
        _this.show();
      }).finally(function () {
        $loading.remove();
      });

    } else {
      _this.show();
    }
  }
  if ((window.location.protocol === 'https:' || window.location.protocol === 'http:') &&
      'serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('sw.js');
  }
};
morpheus.ClueLanding.prototype = {
  open: function (openOptions) {
    const scrollTop = document.body.scrollTop;
    const _this = this;
    this.dispose();
    var optionsArray = _.isArray(openOptions) ? openOptions : [openOptions];

    for (var i = 0; i < optionsArray.length; i++) {
      var options = optionsArray[i];
      options.tabManager = _this.tabManager;
      options.focus = i === 0;
      options.landingPage = _this;
      new morpheus.HeatMap(options);
    }
    document.body.scrollTop = scrollTop;
  },
  dispose: function () {
    this.$landing.hide();

  },
  show: function () {
    const _this = this;
    this.$landing.show();
    if (!morpheus.Util.isNode()) {
      $(window).on('beforeunload.morpheus', function () {
        if (_this.tabManager.getTabCount() > 0) {
          return 'Are you sure you want to close Morpheus?';
        }
      });
    }
  },
  openFile: function (files) {
    if (files.length !== 3) {
      var _this = this;
      var file = files[0];
      var fileName = morpheus.Util.getFileName(file);
      if (fileName.toLowerCase().indexOf('.json') === fileName.length - 5) {
        morpheus.Util.getText(file).then(function (text) {
          _this.open(JSON.parse(text));
        }).catch(function (err) {
          morpheus.FormBuilder.showMessageModal({
            title: 'Error',
            message: 'Unable to load session'
          });
        });
      } else {
        var options = {
          dataset: {
            file: file,
            options: {interactive: true}
          }
        };

        morpheus.OpenDatasetTool.fileExtensionPrompt(fileName, function (readOptions) {
          if (readOptions) {
            for (const key in readOptions) {
              options.dataset.options[key] = readOptions[key];
            }
          }
          _this.open(options);
        });
      }
    } else {
      // matrixFile, genesFile, barcodesFile
      var options = {
        dataset: {
          file: files[0],
          options: {interactive: true}
        }
      };
      var genesPromise = morpheus.Util.readLines(files[1]);
      var geneLines;
      var barcodeLines;
      genesPromise.then(function (lines) {
        geneLines = lines;
      });
      var barcodesPromise = morpheus.Util.readLines(files[2]);
      barcodesPromise.then(function (lines) {
        barcodeLines = lines;
      });
      options.promises = [genesPromise, barcodesPromise];
      options.datasetReady = function (dataset) {
        var columnIds = dataset.getColumnMetadata().add('id');
        var tab = /\t/;
        for (var j = 0, size = dataset.getColumnCount(); j < size; j++) {
          columnIds.setValue(j, barcodeLines[j].split(tab)[0]);
        }
        // var nrowTokens = geneLines[0].split(tab).length;
        var rowIds = dataset.getRowMetadata().add('id');
        var geneSymbols = dataset.getRowMetadata().add('symbol');
        for (var i = 0, size = dataset.getRowCount(); i < size; i++) {
          var tokens = geneLines[i].split(tab);
          rowIds.setValue(i, tokens[0]);
          geneSymbols.setValue(i, tokens[1]);
        }
      };
      this.open(options);
    }
  }
};



