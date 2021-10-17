
// var clue = (typeof clue !== 'undefined') ? clue : {};
// this doesn't look necessary anymore (already have clue and tablelegs when launching from /command)
// var clue = require('./../../lib/js/clue.js');

var search = require('Shared/search.js');
var core = require('Shared/core.js');

$(document).ready(function () {

    $("#coaching_tip_trigger").attr("data-tooltip-class", 'coaching_tips');
    $("#coaching_tip_trigger").attr("data-popover-config",
        '[{"target_id": "homepage-search", "content_id": "tt_command_search", "placement": "bottom"}]');
    $("#coaching_tip_trigger").removeClass("no-tip");

  requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  var format = d3.format(',i');
  var duration = 300;
  var start = +(new Date);
  var numbers = $('.animate-text');
  var charts = $('.animate-bar');
  var opacity = $('.animate-opacity');

  //onready
  function animTick() {
    var now = +(new Date);
    var elapsed = now - start;
    var fraction = elapsed / duration;

    if (fraction >= 1) {
      numbers.each(function () {
        var $this = $(this);
        $this.text(format($this.data('value')));
      });
      charts.each(function () {
        var $this = $(this);
        var max = $this.data('max');
        var value = $this.data('value');
        var total = 100 * (value / max);
        $this.css('width', total + '%');
      });
      opacity.each(function () {
        var $this = $(this);
        $this.css('opacity', 1);
      });
    } else {
      numbers.each(function () {
        var $this = $(this);
        var value = Math.ceil(fraction * $this.data('value'));
        $this.text(format(value));
      });
      charts.each(function () {
        var $this = $(this);
        var max = $this.data('max');
        var value = $this.data('value');
        var total = 100 * (value / max);
        var value = Math.ceil(fraction * total);
        $this.css('width', value + '%');
      });
      opacity.each(function () {
        var $this = $(this);
        $this.css('opacity', fraction);
      });
      requestAnimationFrame(animTick);
    }

  }

  requestAnimationFrame(animTick);
});


//shared? onClueReady
var isProductionUrl = window.location.href.indexOf('https://clue.io') !== -1 ||
    window.location.href.indexOf('https://qa.clue.io') !== -1;

var getTempUserKeyPromise = null;


$(document).one('clueReady', function () {
      var $search = $('#homepage-search');
      var tabManager = new morpheus.TabManager({
        rename: true,
        dropTab: true,
        autohideTabBar: false
      });

      tabManager.on('remove', function () {
      });
      tabManager.on('add', function () {
      });
      tabManager.on('change', function () {
        var activeTab = tabManager.getActiveTab();
        if(activeTab && activeTab.command) {
          $search.val(activeTab != null ? activeTab.command : '');
          // changes url when toggling between tabs. desired behavior?
          window.history.pushState({q: activeTab.command}, '', (window.location.pathname === '/' ? '/command' : '') + '?q=' + activeTab.command);
          if (activeTab != null && activeTab.missingTerms != null && activeTab.missingTerms.length > 0) {
            search.updateMissingTerms(activeTab.missingTerms);
          } else {
            search.updateMissingTerms();
          }
        }


          $(window).scrollTop(0);
      });

      tabManager.$nav.addClass('app-tabs-light');
      tabManager.$tabContent.addClass('app-tabs-content');
      tabManager.$nav.appendTo($('#app-tabs-nav'));
      tabManager.$tabContent.appendTo($('#app-content'));

      function getAutocomplete(token, options) {
        var d = $.Deferred();
        if (token === '') {
          d.resolve([]);
          return d;
        }

        var promises = [];
        var subtypes = [];
        // TODO genes
        var type = options[core.TYPE_CELL] ? 'cell' : options[core.TYPE_GENE] ? 'gene' : 'pert';

        // if (options[TYPE_PCL]) {
        //   subtypes.push(TYPE_PCL);
        // }
        // if (options[TYPE_MOA]) {
        //   subtypes.push(TYPE_MOA);
        // }
        var filter = {
          fields: ['term', 'subtype', 'nids'],
          order: 'order ASC, iterm ASC', // TODO add order to term
          where: {
            autocomplete: true,
            iterm: {regexp: '/.*' + token.toLowerCase() + '.*/'},
            type: type
          }
        };
        if (subtypes.length > 0) {
          filter.where.subtype = {inq: subtypes};
        }

        $.ajax(clue.API_URL + '/api/search_terms/?filter=' + JSON.stringify(filter)).done(function (results) {
          d.resolve(results);
        }).fail(function () {
          d.resolve([]);
        });

        return d;
      }

      $('#app-content').on('click', '.code-box', function (e) {
        e.preventDefault();
        var text = $(this).data('example');
        var tokens = text.split(',');
        var s = [];
        tokens.forEach(function (token) {
          if (token.indexOf(' ') !== -1) {
            s.push('"' + token + '"');
          } else {
            s.push(token);
          }
        });

        var searchText = s.join(' ');
        $search.val(searchText);
        search.search(searchText, tabManager, true, commandHistory);
      });

      if (isProductionUrl) {
      // if (1) {
        var prodActions = new morpheus.Set();
        prodActions.add('/moa');
        prodActions.add('/target');
        prodActions.add('/assay');
        prodActions.add('/gene-space');
        prodActions.add('/conn');
        prodActions.add('/sig');
        prodActions.add('/gex');
        //  prodActions.add('/cell-space');
        prodActions.add('/home');

        core.actions = core.actions.filter(function (action) {
          return prodActions.has(action.command);
        });
      }
      // put help at end
      var homeIndex = -1;
      for (var i = 0; i < core.actions.length; i++) {
        if (core.actions[i].command === '/home') {
          homeIndex = i;
          break;
        }
      }
      var homeAction = core.actions[homeIndex];
      core.actions.splice(homeIndex, 1);
      core.actions.push(homeAction);

      function autocompleteSetup(options) {
        morpheus.Util.autosuggest({
          $el: options.$el,
          suggestWhenEmpty: false,
          history: options.history,
          filter: function (tokens, response) {
            var token = tokens != null && tokens.length > 0 ? tokens[tokens.selectionStartIndex]
                : '';
            token = token.trim();
            var command = options.commands && tokens != null && tokens.length > 0 ? tokens[0] : '';
            // only autocomplete slashes if the slash is string has / at beginning
            if (command == token && token[0] === '/') {
              var matches = [];
              matches.push({
                skip: true,
                label: '<small style="font-weight: normal; color: gray; margin-left: 10px">Commands:</small>'
              });
              if (token.length === 1) { // just slash entered, list all
                core.actions.forEach(function (action) {
                  var input = action.input[0];
                  var min = input.min != null ? input.min : 1;
                  var params = '';
                  if (input.name === core.TYPE_PERT) {
                    params = '[MoAs, PCLs, gene symbols or families, ' +
                        ' perturbagen' +
                        ' names or ids, assays]';
                  } else if (input.name === core.TYPE_GENE) {
                    params = '[gene symbols or families]';
                  } else if (input.name === core.TYPE_PCL) {
                    params = '[PCLs]';
                  } else if (input.name === core.TYPE_CELL) {
                    params = '[lineages, ids, or cell collections]';
                  }
                  matches.push({
                    clear: true,
                    show: true,
                    value: action.command + ' ',
                    label: '<span style="font-weight: bold; color: #F15A22;">' + action.command
                    + '</span> <small style="color:gray;">' + params + '</small><small' +
                    ' class="pull-right" style="padding-right:4px;line-height:20px;color:gray;">' + action.help + '</small>'
                  });
                });
              } else {
                var replaceRegex = new RegExp('(' + morpheus.Util.escapeRegex(token) + ')', 'i');
                core.actions.forEach(function (action) {
                  if (replaceRegex.test(action.command)) {
                    var input = action.input[0];
                    var min = input.min != null ? input.min : 1;
                    var params = '';
                    if (input.name === core.TYPE_PERT) {
                      params = '[MoAs,PCLs, gene symbols, gene families, ' +
                          ' perturbagen' +
                          ' names or ids]';
                    } else if (input.name === core.TYPE_GENE) {
                      params = '[gene symbols or gene families]';
                    } else if (input.name === core.TYPE_PCL) {
                      params = '[PCLs]';
                    } else if (input.name === core.TYPE_CELL) {
                      params = '[lineages, ids, or cell collections]';
                    }
                    matches.push({
                      clear: true,
                      value: action.command + ' ',
                      show: true,
                      label: '<span style="font-weight: bold; color: #F15A22;">' +
                      action.command.replace(replaceRegex, '<b>$1</b>')
                      + '</span> <small>' + params + '</small><small' +
                      ' class="pull-right" style="line-height:20px;color:gray">' + action.help + '</small>'
                    });
                  }
                });
              }
              response(matches);
            } else if (token.length >= 2) {
              // if (autocompleteXhr) {
              //   autocompleteXhr.abort();
              // }
              // limit to the input the command takes

              var selectedAction = null;
              if (tokens[0][0] === '/') {
                var actionToken = tokens[0].toLowerCase();
                for (var i = 0; i < core.actions.length; i++) {
                  var action = core.actions[i];
                  if (actionToken === action.command) {
                    selectedAction = action;
                    break;
                  }
                }
              }
              var autocompleteOptions = options;
              if (selectedAction != null) {
                if (selectedAction.input[0].name === core.TYPE_PCL) {
                  autocompleteOptions = {'PCL': true};
                } else if (selectedAction.input[0].name === core.TYPE_GENE) {
                  autocompleteOptions = {'gene': true};
                } else if (selectedAction.input[0].name === core.TYPE_CELL) {
                  autocompleteOptions = {'cell': true};
                }

              }
              getAutocomplete(token, autocompleteOptions).done(function (results) {
                var matches = [];
                var replaceRegex = new RegExp('(' + morpheus.Util.escapeRegex(token) + ')', 'i');
                var lastType = '';
                results.forEach(function (result) {
                  var value = result.term;
                  var quotedValue = value;

                  if (quotedValue.indexOf(' ') !== -1) {
                    quotedValue = '"' + quotedValue + '"';
                  }
                  if (lastType !== result.subtype) {
                    lastType = result.subtype;
                    var type;
                    if (result.subtype === core.TYPE_GENE) {
                      type = 'Gene';
                    } else if (result.subtype === core.TYPE_PCL) {
                      type = 'Perturbagen Class';
                    } else if (result.subtype === core.TYPE_MOA) {
                      type = 'MoA';
                    } else if (result.subtype === core.TYPE_ID) {
                      type = autocompleteOptions.cell ? 'Cell' : (autocompleteOptions.gene ? 'Gene' : 'Perturbagen');
                    } else if (result.subtype === core.TYPE_LINEAGE) {
                      type = 'Lineage';
                    } else if (result.subtype === core.TYPE_COLLECTION) {
                      type = 'Collection';
                    } else if (result.subtype === core.TYPE_GENE_FAMILY) {
                      type = 'Gene Family';
                    } else if (result.subtype === core.TYPE_ASSAY) {
                      type = 'Assay';
                    } else {
                      type = result.subtype;
                    }
                    matches.push({
                      label: '<small style="font-weight: normal; color: gray; margin-left: 10px">' + type + ':</small>'
                    });
                  }
                  var label = '<span style="margin-left:6px">'
                      + value.replace(replaceRegex, '<b>$1</b>') + '</span>';
                  // if (lastType !== TYPE_PERT) {
                  //   label += '<span style="color: gray;"> (' + morpheus.Util.intFormat(result.nids) + (lastType ===
                  // TYPE_CELL ? ' cell' : ' perturbagen') + (result.nids === 1 ? '' : 's') + ')</span>'; }

                  if (lastType !== 'id') {
                    var name = autocompleteOptions.cell ? 'Cell' : (autocompleteOptions.gene ? 'Gene' : 'Perturbagen');
                    label += '<span style="color: gray;"> (' + morpheus.Util.intFormat(result.nids) + ' ' + name +
                        (result.nids > 1 ? 's' : '') + ')</span>';
                  }
                  matches.push({
                    value: quotedValue,
                    label: label
                  });
                });

                response(matches);
              });
            }
            else {
              response([]);
            }
          },
          select: function () {
          }
        });
      }

      var commandHistory = [];

      window.addEventListener('popstate', function (event) {
        if (event.state !== null) {
          $search.val(event.state.q);
          search.search($search.val(), tabManager, false, null);
        }
      });
      // else {
      //   if (window.location.pathname === '/command') {
      //     // search('/help');
      //   }
      // }

      function createHome(tabManager) {
        // make the thing here
        var $homeTab = $('#home-content');
        // $homeTab.append(':)');
        tabManager.add({
          $el: $homeTab,
          command: '/home',
          title: '/home  <span class="fa fa-home home-icon"></span>',
          closeable: false,
          focus: true,
          object: {
            command: '/home',
            reload: true,
            commandName: '/home'
          }
        });
        var $homeIcon = $('.fa-home');
        $homeIcon.parents('a').data('morpheus-pin', true);
        $homeIcon.parents('li').removeClass('morpheus-sortable');
        $homeIcon.parents('li').addClass('home-tab');
        $homeIcon.parents('a').addClass('home-tab');
        $homeTab.show();

        var $homeCommandList = $('#availableCommands');
        $homeCommandList.html('');
        var commandsAdded = 0;
        var html = '<table class="commands-table"><tr>';
        var availableCommands = [];
        for(var i=0; i<core.actions.length; i++){
          var action = core.actions[i];
          if(action.home !='hidden') {
            availableCommands.push(action.command);
            if(commandsAdded>0 && commandsAdded%2==0) {
              html += '</tr><tr><td class="table-row-margin"></td></tr><tr><td data-name="' +
                action.command + '" class="col-md-6 available-command-button">';
            }
            else if(commandsAdded==0) {
              html += '<td data-name="' + action.command + '" class="col-md-6 available-command-button">';
            }
            else {
              html += '<td class="table-col-margin"></td><td data-name="' +
                action.command + '" class="col-md-6 available-command-button">'
            }
            commandsAdded++;

            // make button, fill in action.command and action.home
            // add click listener
            //
            // var tempHtml = '<td class="col-md-5">';

            var tempHtml = '<h4 class="available-command-title font-turquoise">' + action.command + '</h4>' +
              '<p class="available-command-text">' + action.home + '</p></td>';
            html += tempHtml;
            var $commandButton = $('.available-command-button');
            // $homeCommandList.append($commandButton);
          }
        }
        if (commandsAdded%2==1) {
          var tempHtml = '<td class="empty-command-button"><div class="available-command-body"><h4 class="available-command-title font-turquoise">empty</h4></td></tr>';
          html += tempHtml;
        }
        html += '</table>';
        $homeCommandList.html(html);
        var commandButtons = $('.available-command-button');
        $("#availableCommands").on("click", ".available-command-button", function() {
          $search.val($(this).data('name') + ' ');
          $search.focus();
        });
      }

      createHome(tabManager);

      var queryString = morpheus.Util.getWindowSearchObject();
      if (queryString.q) {
          $search.val(decodeURIComponent(queryString.q[0]));
          if (getTempUserKeyPromise != null) {
              getTempUserKeyPromise.done(function () {
                  search.search($search.val(), tabManager, false, null);
              });
          } else {
            search.search($search.val(), tabManager, false, null);
          }
      }

      var $searchStart = $('#homepage-search-start');
      autocompleteSetup({
        $el: $searchStart,
        history: function (response) {
          var matches = [];
          matches.push({
            skip: true,
            label: '<small style="font-weight: normal; color: gray; margin-left:' +
            ' 10px">History:</small>'
          });
          commandHistory.forEach(function (text) {
            matches.push({
              clear: true,
              value: text,
              label: '<span style="color: lightgrey;">' + text + '</span>'
            });
          });
          response(matches);
        },
        commands: true,
        'pert': true,
        'PCL': true,
        'moa': true
      });
      $searchStart.on('keyup', function (e) {
        if (e.which === 13) {
          var text = $searchStart.val().trim();
          if (text !== '') {
            //$search.val(text);
            text = text.replace(/[\r\f\n\t]/g, ' ');
            window.location.href = '/command?q=' + text;
          }
        }
      });

      autocompleteSetup({
        $el: $search,
        history: function (response) {
          var matches = [];
          matches.push({
            skip: true,
            label: '<small style="font-weight: normal; color: gray; margin-left:' +
            ' 10px">History:</small>'
          });
          commandHistory.forEach(function (text) {
            matches.push({
              clear: true,
              value: text,
              label: '<span style="color: lightgrey;">' + text + '</span>'
            });
          });
          response(matches);

        },
        commands: true,
        'pert': true,
        'PCL': true,
        'moa': true
      });
      $search.on('keyup', function (e) {
        if (e.which === 13) {
          var text = $search.val().trim();
          if (text !== '') {
            text = text.replace(/[\r\f\n\t]/g, ' ');
            search.search(text, tabManager, true, commandHistory);
            // search(text, true);
          }
        }
      });

}

)
;

