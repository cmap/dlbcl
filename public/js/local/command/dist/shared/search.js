exports.getSearchTerms = function(tokens, where, getIds) {
    var deferred = $.Deferred();
    if (tokens.length === 0) {
        return deferred.resolve(getIds ? {
                idToSearchTerms: new morpheus.Map(),
                missingTerms: [],
                ids: [],
                results: [],
                tokens: tokens
            } : []);
    }
    var orQuery = []; // inq queries are not working
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        token = token.replace(new RegExp('"', 'g'), ''); // replace quotes
        token = token.toLowerCase();
        orQuery.push({iterm: token});
    }
    where.or = orQuery;
    $.ajax(clue.API_URL + '/api/search_terms?filter=' + encodeURIComponent(JSON.stringify({
            fields: getIds ? ['ids', 'term'] : ['term'],
            where: where
        }))).done(function (results) {
        // take union
        if (getIds) {
            var missingTerms = new morpheus.Set();
            for (var i = 0; i < tokens.length; i++) {
                missingTerms.add(orQuery[i].iterm);
            }
            var ids = new morpheus.Set();
            var idToSearchTerms = new morpheus.Map();
            for (var i = 0; i < results.length; i++) {
                var item = results[i];
                missingTerms.remove(item.term.toLowerCase());
                for (var j = 0; j < item.ids.length; j++) {
                    ids.add(item.ids[j]);
                    var searchTerms = idToSearchTerms.get(item.ids[j]);
                    if (searchTerms === undefined) {
                        searchTerms = [];
                        idToSearchTerms.set(item.ids[j], searchTerms);
                    }
                    searchTerms.push(item.term);
                }
            }
            deferred.resolve({
                idToSearchTerms: idToSearchTerms,
                missingTerms: missingTerms.values(),
                ids: ids.values(),
                results: results,
                tokens: tokens
            });
        } else {
            deferred.resolve(results.term.map(function (t) {
                return t.term;
            }));
        }
    }).fail(function () {
        deferred.resolve(getIds ? {
                idToSearchTerms: new morpheus.Map(),
                missingTerms: [],
                ids: [],
                results: [],
                tokens: tokens
            } : []);
    });
    return deferred;
};

exports.getSearchTermCountsNoGenetic = function(tokens, where) {
  var deferred = $.Deferred();
  if (tokens.length === 0) {
    return deferred.resolve([]);
  }
  var orQuery = []; // inq queries are not working
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    token = token.replace(new RegExp('"', 'g'), ''); // replace quotes
    token = token.toLowerCase();
    orQuery.push({iterm: token});
  }

  where.or = orQuery;
  $.ajax(clue.API_URL + '/api/search_terms/?filter=' + JSON.stringify({
      fields: ['ids', 'term'],
      where: where
    })).done(function (results) {
    var missingTerms = new morpheus.Set();
    for (var i = 0; i < tokens.length; i++) {
      missingTerms.add(orQuery[i].iterm);
    }
    var searchTermCounts = new morpheus.Map();

    for (var i = 0; i < results.length; i++) {
      var item = results[i];
      item.ids = _.reject(item.ids, function(id){ return id.startsWith('CCSBBROAD') || id.startsWith('CGS'); });
      searchTermCounts.set(item.term,item.ids.length);
      missingTerms.remove(item.term.toLowerCase());
    }
    deferred.resolve({
      searchTermCounts: searchTermCounts,
      missingTerms: missingTerms.values(),
      results: results,
      tokens: tokens
    });
  }).fail(function () {
    deferred.resolve([]);
  });
  return deferred;
};

exports.getSearchTermCounts = function(tokens, where) {
    var deferred = $.Deferred();
    if (tokens.length === 0) {
        return deferred.resolve([]);
    }
    var orQuery = []; // inq queries are not working
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        token = token.replace(new RegExp('"', 'g'), ''); // replace quotes
        token = token.toLowerCase();
        orQuery.push({iterm: token});
    }

    where.or = orQuery;
    $.ajax(clue.API_URL + '/api/search_terms/?filter=' + JSON.stringify({
            fields: ['ids', 'term'],
            where: where
        })).done(function (results) {
            var missingTerms = new morpheus.Set();
            for (var i = 0; i < tokens.length; i++) {
                missingTerms.add(orQuery[i].iterm);
            }
            var searchTermCounts = new morpheus.Map();

            for (var i = 0; i < results.length; i++) {
                var item = results[i];
                searchTermCounts.set(item.term,item.ids.length);
                missingTerms.remove(item.term.toLowerCase());
            }
            deferred.resolve({
                searchTermCounts: searchTermCounts,
                missingTerms: missingTerms.values(),
                results: results,
                tokens: tokens
            });
    }).fail(function () {
        deferred.resolve([]);
    });
    return deferred;
};





var PERTS = ['imatinib', 'BRAF', 'CDK inhibitor'];
var GENES = ['BRAF', 'KRAS', 'TP53'];
//shared?

function splitArgs(cmd, text) {
  var text = text.substring(cmd.length).trim().replace(new RegExp('[“”]', 'g'),'"');
  var tokens = morpheus.Util.getAutocompleteTokens(text);
  var ids = [];
  tokens.forEach(function (p) {
    p = p.trim();
    if (p !== '') {
      ids.push(p);
    }
  });
  return ids;
}

exports.analyticsCommandLaunchBar = function(sourceCommand, destCommand, fullCommand) {
  if (window.location.hostname === 'clue.io') {
    if (typeof ga === 'undefined') {
      (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments);
          }, i[r].l = 1 * new Date();
        a = s.createElement(o), m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
      })(window, document, 'script', '//www.google-analytics.com/analytics.js',
        'ga');
    }
    ga('create', 'UA-62656334-1', 'auto', 'clue');
    if (clue.getUserName() != null) {
      ga('clue.set', 'clue_user', clue.getUserName());
    }
    var eventAction = sourceCommand + ' => ' + destCommand;
    ga('clue.send', 'event', 'Command (Launch)', eventAction, fullCommand);
  }
};

function analyticsCommandSearch(commandName, fullCommand) {
  if (window.location.hostname === 'clue.io') {
    if (typeof ga === 'undefined') {
      (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments);
          }, i[r].l = 1 * new Date();
        a = s.createElement(o), m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
      })(window, document, 'script', '//www.google-analytics.com/analytics.js',
        'ga');
    }
    ga('create', 'UA-62656334-1', 'auto', 'clue');
    if (clue.getUserName() != null) {
      ga('clue.set', 'clue_user', clue.getUserName());
    }
    ga('clue.send', 'event', 'Command', commandName, fullCommand);
  }
}


function getPertTypeIcon(type) {
  if (type === 'trt_cp') {
    return '<i class="text-center glyphicon glyphicon-adjust touchstone-cp"></i>';
  } else if (type === 'trt_sh.cgs') {
    return '<i class="text-center glyphicon glyphicon-minus-sign touchstone-kd"></i>';
  } else if (type === 'trt_oe') {
    return '<i class="text-center glyphicon glyphicon-plus-sign touchstone-oe"></i>';
  } else {
    return type;
  }
}

function showPertTable(options) {
  return new tablelegs.Table({
    height: '412px',
    columnPicker: true,
    tableClass: 'slick-table slick-bordered-table slick-hover-table',
    select: true,
    search: true,
    export: true,
    rowHeight: 18,
    $el: options.$el,
    columns: [
      {
        field: 'pert_iname',
        name: 'Name'
      }, {
        field: 'pert_type',
        name: 'Type',
        renderer: function (item, value) {
          return getPertTypeIcon(value);
        }
      }, {
        field: 'pert_id',
        name: 'Perturbagen Id'
      }, {
        field: 'target',
        name: 'Target'
      }, {
        field: 'moa',
        name: 'MOA'
      }],
    items: options.items
  });
}

function getPertIds(tokens) {
  return exports.getSearchTerms(tokens, {type: 'pert'}, true);
}

function getCellIds(tokens) {
  return exports.getSearchTerms(tokens, {type: 'cell'}, true);
}

function getGeneIds(tokens, fields) {
  return exports.getSearchTerms(tokens, {type: 'gene'}, true);

}

function getSetIds(tokens) {
  return exports.getSearchTerms(tokens, {subtype: 'pcl'}, false);
}

function argsError(options) {
  var core = require('Shared/core.js');
  var utils = require('Shared/utils.js');
  var selectedAction = options.action;
  var str = [];
  str.push('<div class="row pad-top-12"><div class="cmd-message">');
  if(options.errorMessage) {
    str.push(options.errorMessage);
  }
  else {
    var min = selectedAction.input[0].min != null ? selectedAction.input[0].min : 1;
    var input = selectedAction.input[0].name;
    if (min === 0) {
      min = 'zero';
    } else if (min === 1) {
      min = 'one';
    } else if (min === 2) {
      min = 'two';
    }

    str.push('<p><code>' + selectedAction.command + '</code></p>');
    str.push('<p>' + selectedAction.help + '</p>');
    if (input === core.TYPE_PERT) {
      str.push('<p>Please enter ' + min +
        ' or more valid ' +
        ' MoAs, perturbagen' +
        ' classes,' +
        ' gene targets,' +
        ' assays,' +
        ' perturbagen names or perturbagen ids.</p>');
    } else if (input === core.TYPE_GENE) {
      str.push('<p>Please enter ' + min + ' or more valid gene symbols or gene families.</p>');
    } else if (input === core.TYPE_PCL) {
      str.push('<p>Please enter ' + min + ' or more valid perturbagen class ids.</p>');
    }

    if (selectedAction.argsHelp) {
      str.push(selectedAction.argsHelp);
    }

    if (selectedAction.example) {
      str.push('<h4>Example' + ( selectedAction.example.length === 1 ? '' : 's') + '</h4>');
      str.push('<ul data-name="example"></ul>');
    } else {
      if (input === 'perturbagens') {
        str.push('<br /><br />Example: <ul>');
        str.push('<li><a class="code-box"' +
          ' href="#" data-example="' + selectedAction.command + ',' + PERTS.join(',') + '">' + selectedAction.command +
          ' ' + PERTS.join(' ') + '</a></li>');
        str.push('</ul>');
      } else if (input === 'genes') {
        str.push('<br /><br />Example: <ul>');
        str.push('<li><a class="code-box"' +
          ' href="#" data-example="' + selectedAction.command + ',' + GENES.join(',') + '">' + selectedAction.command +
          ' ' + GENES.join(' ') + '</a></li>');
        str.push('</ul>');
      }
    }
  }
  str.push('</div></div>');
  var $el = utils.getCommandHeader(options.text, null, false);
  $el.append(str.join(''));
  if (selectedAction && selectedAction.example) {
    var $example = $el.find('[data-name=example]');
    selectedAction.example.forEach(function (ex) {
      var $li = $('<li><h6>' + ex.desc + '</h6></li>');
      var s = [];
      var tokens = ex.command.split(',');
      for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].indexOf(' ') !== -1) {
          tokens[i] = '"' + tokens[i] + '"';
        }
      }

      var $a = $('<a class="code-box" href="#">' + selectedAction.command + ' ' + tokens.join(' ') + '</a>');
      $a.data('example', selectedAction.command + ',' + ex.command);
      $a.appendTo($li);
      $li.appendTo($example);
    });
  }

  return $el;

}

exports.updateMissingTerms = function(missingTerms) {
  var $commandErrors = $('#commandErrors');
  if (missingTerms != null && missingTerms.length > 0) {
    $commandErrors.html('> ERROR: ' + missingTerms.map(function (term) {
        return '"' + term.toUpperCase() + '"';
      }).join(', ') + ' NOT' +
      ' FOUND IN OUR' +
      ' DATABASE').show();
  } else {
    $commandErrors.hide();
  }
};

exports.search = function(text, tabManager, addToHistory, commandHistory) {
  var core = require('Shared/core.js');
  var utils = require('Shared/utils.js');

  text = text.trim();
  if (text === '') {
    return;
  }

  if (addToHistory) {
    commandHistory.push(text);
    if (commandHistory.length > 20) {
      commandHistory = commandHistory.slice(0, 20);
    }
    // TODO keep track of full session
  }
  window.history.pushState({q: text}, '', (window.location.pathname === '/' ? '/command' : '') + '?q=' + text);
  var lcText = text.toLowerCase();
  var selectedAction = null;
  var commandName = 'N/A';
  // see if any tabs are open that match command
  var foundTabId = null;
  try {
    tabManager.getIdToTabObject().forEach(function (obj, id) {
      if (obj.reload && obj.command.toLowerCase() === lcText) {
        foundTabId = id;
        throw 'break';
      }
    });
  }
  catch (x) {
    ; // break out of loop
  }
  if (text.startsWith('/home')) {
    foundTabId = 'morpheus-tab1';
  }
  if (foundTabId != null) {
    tabManager.setActiveTab(foundTabId);
    return;
  }
  var $tabContent = $('<div><div class="pull-right" data-name="matches"></div><div' +
    ' data-name="content"></div><div' +
    ' style="col-xs-12" data-name="loading"></div></div>');
  var $el = $tabContent.find('[data-name=content]');
  var truncatedCommand = text.length > 80 ? text.substring(0, 80) : text;
  truncatedCommand = truncatedCommand.replace(/\//ig, '');
  var tab;
  var d = $.Deferred();
  if (text[0] === '/') {
    // TODO BW: this only matches substring, /moasdfgm imatinib = /moa sdfgm imatinib
    for (var i = 0; i < core.actions.length; i++) {
      var action = core.actions[i];
      if (lcText.indexOf(action.command) === 0) {
        selectedAction = action;
        commandName = action.command;
        break;
      }
    }
    var tabContent = {
      $el: $tabContent,
      closeable: true,
      rename: true,
      focus: true,
      object: {
        command: text,
        reload: true,
        truncatedCommand: truncatedCommand,
        commandName: selectedAction.command,
        $el: $tabContent,
        tabManager: tabManager
      }
    };
    if (selectedAction == null) {
      tabContent.title = 'error';
      tab = tabManager.add(tabContent);
      d.reject(argsError({
        text: text,
        errorMessage: text + ' is not a valid command.'
      }));
    }
    else {
      // tabContent.title = selectedAction.command.substring(1); // remove slash
      tabContent.title = text.substring(0, Math.min(text.length, 16));
      if (text.length >= 16) {
        tabContent.title += '...';
      }
      tab = tabManager.add(tabContent);
      var $loading = clue.createLoadingEl();
      $loading.appendTo($tabContent.find('[data-name=loading]'));

      var args = splitArgs(selectedAction.command, text);
      var input = selectedAction.input ? selectedAction.input[0] : null;
      var min = input.min != null ? input.min : 1;
      if (args.length < min) {
        // TODO handle this better
        d.reject(argsError({
          text: text,
          action: selectedAction,
          args: null
        }));
      }
      if (input.name === core.TYPE_PERT) {
        getPertIds(args, {
          type: input.type
        }).done(function (result) {
          var ids = result.ids;
          if (ids.length === 1 && selectedAction.one) {
            selectedAction.one(ids[0]).done(function (ids) {
              d.resolve(ids);
            }).fail(function () {
              d.reject();
            });
          } else if (ids.length < min) {
            d.reject(argsError({
              text: text,
              action: selectedAction,
              args: ids
            }));
          } else {
            tabContent.object.missingTerms = result.missingTerms;
            exports.updateMissingTerms(tabContent.object.missingTerms);
            //   showTermInterpretation(result, core.TYPE_PERT);
            d.resolve(result);
          }
        }).fail(function () {
          d.reject();
        });
      } else if (input.name === core.TYPE_CELL) {
        getCellIds(args).done(function (result) {
          var ids = result.ids;
          if (ids.length < min) {
            d.reject(argsError({
              text: text,
              action: selectedAction,
              args: ids
            }));
          } else {
            tabContent.object.missingTerms = result.missingTerms;
            exports.updateMissingTerms(tabContent.object.missingTerms);
            // showTermInterpretation(result, core.TYPE_CELL);
            d.resolve(result);
          }
        }).fail(function () {
          d.reject();
        });
      } else if (input.name === core.TYPE_GENE) {
        getGeneIds(args, input.fields).done(function (result) {
          if (result.ids.length < min) {
            d.reject(argsError({
              text: text,
              action: selectedAction,
              args: result.ids
            }));
          } else {
            tabContent.object.missingTerms = result.missingTerms;
            exports.updateMissingTerms(tabContent.object.missingTerms);
            d.resolve(result);
          }
        }).fail(function () {
          d.reject();
        });
      } else if (input.name === core.TYPE_PCL) {
        getSetIds(args).done(function (ids) {
          if (ids.length < min) {
            d.reject(argsError({
              text: text,
              action: selectedAction,
              args: ids
            }));
          } else {
            exports.updateMissingTerms(); // FIXME
            d.resolve({
              ids: ids,
              tokens: args
            });
          }
        }).fail(function () {
          d.reject();
        });
      } else {
        if (args.length < min) {
          d.reject(argsError({
            text: text,
            action: selectedAction,
            args: args
          }));
        } else {
          d.resolve(args);
        }
      }
    }
  }
  else {
    var tabContent = {
      $el: $tabContent,
      closeable: true,
      rename: true,
      focus: true,
      object: {
        command: text,
        reload: true,
        truncatedCommand: truncatedCommand
      }
    };
    // TODO BW: if missing '/', only looks at perts
    tabContent.title = text.substring(0, Math.min(text.length, 16));
    if (text.length >= 16) {
      tabContent.title += '...';
    }
    tab = tabManager.add(tabContent);
    getPertIds(splitArgs('', text), {}).done(function (result) {
      var ids = result.ids;
      if (ids.length === 0) {
        d.reject(argsError({
          text: text,
          errorMessage: text + ' not found in database.'
        }));
      } else {
        tabContent.object.missingTerms = result.missingTerms;
        exports.updateMissingTerms(tabContent.object.missingTerms);
        var lookupCommand = {
          show: function (options) {
            var d = $.Deferred();
            var $el = options.$el;
            // FIXME
            options.ids.forEach(function(str,idx) {
              options.ids[idx] = str.replace(/ccsbbroad/i, 'ccsbBroad');
            });
            $.ajax(clue.API_URL + '/api/perts?filter=' + JSON.stringify({
                fields: ['pert_id', 'pert_type', 'moa', 'target', 'pert_iname'],
                where: {pert_id: {inq: options.ids}}
              })).done(function (results) {

              var cardId = _.uniqueId('card');
              var $launchBar = null;
              if (results.length === 1) {
                var $tmp = $('<div class="row"><div class="col-xs-12 col-sm-6 col-sm-offset-1">' +
                  '<div id="' + cardId + '"></div></div>' +
                  '<div class="col-sm-4"><div class="launch-panel" data-section="launchBar"><br><hr></div></div></div>');
                $tmp.appendTo($el);
                $launchBar = $el.find('[data-section="launchBar"]');
                if (results[0].pert_type==='trt_cp') {
                  utils.showLaunchOptions([results[0].pert_iname], 'pert', $launchBar, 'search', tabManager);
                }
                else {
                  utils.showLaunchOptions([results[0].pert_iname], 'gene', $launchBar, 'search', tabManager);
                }
                $launchBar.find('[name="launchbar-header"]').html('<br>');
                /* $.pjax({
                 push: false,
                 url: getCardUrl(results[0]),
                 container: '#' + cardId
                 }); */
                getCard(getCardUrl(results[0]), '#' + cardId);
              } else {
                var $tableEl = $('<div class="col-sm-9 col-xs-12"></div>'); // leave space for card
                $tableEl.appendTo($el);
                var $sidebarEl = $('<div class="col-sm-3 col-xs-12">' +
                  '<div class="launch-panel" data-section="launchBar">' +
                  '<h3>Nothing selected</h3><br><hr>Select one or more rows to see additional options</div>' +
                  '<div class="pad-bottom-16"></div>' +
                  '<div id="' + cardId + '"></div></div>');
                $sidebarEl.appendTo($el);
                var table = showPertTable({
                  items: results,
                  $el: $tableEl
                });

                $launchBar = $el.find('[data-section="launchBar"]');
                table.on('selectionChanged', function (e) {
                  var row = e.selectedRows[0];
                  if (row !== undefined) {
                    // if (results[0].pert_type==='trt_cp') {
                    //   utils.showLaunchOptions([results[0].pert_iname], 'pert', $launchBar, 'search', tabManager);
                    // }
                    // else {
                    //   utils.showLaunchOptions([results[0].pert_iname], 'gene', $launchBar, 'search', tabManager);
                    // }
                    var item = table.getItems()[row];
                    if (e.selectedRows.length===1 && item.pert_type!='trt_cp') {
                      utils.showLaunchOptions([item.pert_iname], 'gene', $launchBar, 'search', tabManager);
                    }
                    else {
                      var ids = _.map(e.selectedRows, function(num) {
                        return table.getItems()[num].pert_iname;
                      });
                      utils.showLaunchOptions(ids, 'pert', $launchBar, 'search', tabManager);
                    }
                    /* $.pjax({
                     push: false,
                     url: getCardUrl(item),
                     container: '#' + cardId
                     }); */
                    getCard(getCardUrl(item), '#' + cardId);
                  }

                });

              }
              d.resolve();
            }).fail(function () {
              d.reject();
            });
            return d;
          }
        };
        selectedAction = lookupCommand;
        d.resolve(result);
      }
    }).fail(function () {
      d.reject();
    });
  }
  function showError(err) {
    tabContent.object.reload = false;
    $tabContent.find('[data-name=loading]').remove();
    var $content = $tabContent.find('[data-name=content]');
    $content.addClass('cmd-message');
    if (err) {
      $tabContent.html(err);
    } else {

      $content.html('<h1>Error</h1><p>An unexpected error occurred. Please try again.</p>');
    }
  }

  d.done(function (result) {
    $el.append(utils.getCommandHeader(text, tab.id, true));
    var actionCallback = selectedAction.show({
      ids: result.ids,
      tokens: result.tokens,
      idToSearchTerms: result.idToSearchTerms,
      $el: $el,
      object: tabContent.object
    });
    if (actionCallback == null) {
      $tabContent.find('[data-name=loading]').remove();
    } else {
      actionCallback.done(function () {
        $tabContent.find('[data-name=loading]').hide();
      });
      actionCallback.fail(function (err) {
        showError(err);
      });
    }

    tabManager.setTabTitle(tab.id, text);
  }).fail(function (err) {
    showError(err);
  }).always(function () {
  });

  analyticsCommandSearch(commandName,lcText);
};