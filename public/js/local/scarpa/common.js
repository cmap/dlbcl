/**
 * Created by turner on 9/9/15.
 */
var scarpa = (function (scarpa) {
    scarpa.initializeAppMenu = function(webAppCards, scientificProjectCards) {

        var $appMenuModal,
            $app_menu_section_labels,
            $app_menu_sections,
            webAppCardsPresentationList;

        webAppCardsPresentationList = _.sortBy(webAppCards, 'abbreviation');

        //_.each(webAppCardsPresentationList, function(card){
        //    console.log(card.title + ' ' + card.abbreviation + ' icon ' + card.icon_url);
        //});

        $app_menu_section_labels = $('.app-menu-section-label');

        $app_menu_sections = $( "div[id^='app_menu_title_']" );

        $appMenuModal = $('#appMenuModal');

        scarpa.hideAppMenuSections = function () {
            $app_menu_sections.hide();
        };

        scarpa.showAppMenuSectionWithName = function (name) {

            var str = '#' + name,
                $menuSection = $(str);

            scarpa.hideAppMenuSections();

            if ($menuSection.length > 0) {
                $menuSection.show();
            }

        };

        scarpa.hideAppMenuSections();

        buildWebAppsSubMenu($('#app_menu_title_web_apps_items'), webAppCardsPresentationList);

        function isFlagshipTier(tierNumber) {
            return tierNumber == 1;
        }

        function isLowestTier(tierNumber) {
            return tierNumber == 0 || tierNumber > 2;
        }

        function buildCardDiv(card,tierNumber) {
            var imageWidth,containerColumnClass;
            var isFlagship = isFlagshipTier(tierNumber);
            var isBottomTier = isLowestTier(tierNumber);

            if (isFlagship) {
                imageWidth = "72px";
                containerColumnClass = "flagship-card";
            }
            else {
                imageWidth = "42px";
                containerColumnClass = "launchedapp-card";
            }

            var appLink = $('<a class="app-card" >');
            appLink.attr('href',card.url);
            var appName = $('<div class="text-center">');
            var appText = $('<div class="text-center appText">');


            if (isFlagship) {
                appName.addClass("flagship-app-name");
            }
            else {
                appName.addClass("launched-app-name");
            }
            if (isBottomTier) {
                appName.css('padding-top','0');
                appName.css('width','300px');
            }
            appName.html(card.title);
            var appContainer = $('<div class="flex-center app-container">');

            if (isFlagship) {
                appContainer.addClass(containerColumnClass);
            }
            if (isBottomTier) {
                appContainer.css('padding','0');
            }
            var appIcon = $('<img class="flex-center">');
            appIcon.css("width",imageWidth);
            appIcon.css("height",imageWidth);
            appIcon.attr('src',card.icon_url);

            if (card.icon_hover_url) {
                appLink.hover(function () {
                        appIcon.attr('src', card.icon_hover_url);
                    },
                    function () {
                        appIcon.attr('src', card.icon_url);
                    });
            }

            var isQuery = $(appName).text().indexOf('QUERY') > -1;
            var isTouchstone = $(appName).text().indexOf('Touchstone') > -1;

            if (isQuery){
                appText.append( "Find perturbagens <br/>that give rise to expression signatures similar to yours" );
            }
            if (isTouchstone) {
                appText.append( "Explore the Touchstone <br/>reference dataset of 8,870 expression signatures" );
            }

            if (!isLowestTier(tierNumber)) {
                appLink.append(appIcon);
                appLink.append(appName).append(appText);
            }
            if (isLowestTier(tierNumber)) {
                appLink.append(appName);
            }
            appContainer.append(appLink);

            return appContainer;
        }

        function buildAppTier(appCards,tierNumber) {
            var isFlagship = isFlagshipTier(tierNumber);
            var isBottomTier = isLowestTier(tierNumber);
            var numAppsPerRow = 3;
            if (isBottomTier) {
                numAppsPerRow = 1;
            }
            var appsSection = $('<div class="appTier">');
            var appRow = $('<div class="appRow">');
            var isPartialRow = false;
            appCards.forEach(function(card,index) {
                if (!isFlagship) {
                    if (index % numAppsPerRow == 0) {
                        appsSection.append($('<div class="flex-even">').append(appRow));
                        appRow = $('<div class="appRow">');
                        isPartialRow = false;
                    }
                }
                appRow.append(buildCardDiv(card,tierNumber));
                isPartialRow = true;
            });
            if (isPartialRow) {
                appsSection.append($('<div class="flex-center">').append(appRow));
            }
            return appsSection;
        }

        function buildWebAppsSubMenu($column_container, cards) {
            if (cards.length > 0) {
                // three tiers: flagship, tier2, and other
                var flagshipCards = cards.filter(function(card) {
                    return card.app_tier == 1;
                });
                var tier2Cards = cards.filter(function(card) {
                    return card.app_tier == 2;
                });
                var lowerTierCards = cards.filter(function(card) {
                    return (card.app_tier != 1 && card.app_tier != 2);
                });

                var flagshipTier = buildAppTier(flagshipCards,1);
                var row2Tier = buildAppTier(tier2Cards,2);
                var bottomTier = buildAppTier(lowerTierCards,3);




                if (flagshipCards.length > 0) {
                    $column_container.append(flagshipTier);

                }

                if (tier2Cards.length > 0) {
                    var hr = $("<hr>").addClass("app-menu-hr2")
                    $column_container.append(row2Tier);
                    $column_container.append(hr);
                }
                if (lowerTierCards.length > 0) {
                    $column_container.append(bottomTier);
                }

            }
        }

        function resetMenuSectionSelection() {
            _.each($app_menu_section_labels,function(appElt,index,appLabel) {
                $(appElt).removeClass('app-menu-section-label-selected');
            });
        }

        function buildNotLoggedInMenuContent() {
            var notLoggedInOverlayClass = "notLoggedInOverlay";
            var appsContent = $('#app_menu_title_web_apps_items');
            if (!scarpa.isLoggedIn()) {
                if ($('#app_menu_title_web_apps_items .' + notLoggedInOverlayClass).length == 0) {

                    var notLoggedInDiv =
                        '<div class="' + notLoggedInOverlayClass +'">' +
                        '<div style="font-size:34px; font-weight:100; margin-top:60px;">' +
                        'Please Login' +
                        '</div>' +
                        '<div style="font-size:14px;font-weight: 300;line-height: 22px;margin-top:12px;"> <a class="loginFromMenuModal">Login with your clue.io account<br/>to access the apps</a></div>' +
                        '</div>';
                    appsContent.addClass('col-xs-12');
                    appsContent.append(notLoggedInDiv);
                }
            }
            else {
                appsContent.removeClass('col-xs-12');
                $('.' + notLoggedInOverlayClass).remove();
            }

            // todo arz rip this out if/when we deploy menu modal v3
            $('.loginFromMenuModal').on('click',function(evt) {
                evt.preventDefault();
                $('#appMenuModal').modal('hide');
                $('#loginModal').modal('show');
            });
        }

        function buildScientificProjectsSubMenu($column_container, cards) {

            _.each(cards, function(card) {

                var $row = $('<div>');

                var $col_xs_12,
                    $a_container,
                    $link_label_container,
                    $a;

                $link_label_container = $('<div>');
                $link_label_container.html(card.title);

                $a = $('<a>');
                $a.attr("href", card.url);
                $a.append($link_label_container[ 0 ]);

                $a_container = $('<div>');
                $a_container.append($a[ 0 ]);

                // .col-xs-12
                $col_xs_12 = $('<div class="col-xs-12">');
                $col_xs_12.append($a_container[ 0 ]);

                $row.append($col_xs_12[ 0 ]);

                $column_container.append($row[ 0 ]);

            });

        }

        $appMenuModal.on('shown.bs.modal', function (e) {
            resetMenuSectionSelection();

            var name,
                $webAppMenuSection;

            $webAppMenuSection = $app_menu_section_labels.filter(function(){

                var value = $(this).attr('data-app-menu-section');

                return value === 'app_menu_title_web_apps_items';
            });

            $webAppMenuSection.addClass('app-menu-section-label-selected');
            name = $webAppMenuSection.attr('data-app-menu-section');
            scarpa.showAppMenuSectionWithName(name);
            buildNotLoggedInMenuContent();
        });

        $appMenuModal.on('hidden.bs.modal', function (e) {
            resetMenuSectionSelection();
            scarpa.hideAppMenuSections();
        });


        // attach 'show menu' mouse handlers to each app menu section
        $app_menu_section_labels.on('click', function(){

            $app_menu_section_labels.removeClass('app-menu-section-label-selected');

            $(this).removeClass('app-menu-section-label-unselected');
            $(this).addClass('app-menu-section-label-selected');

            scarpa.showAppMenuSectionWithName( $(this).data('appMenuSection') );
        });

        //$app_menu_section_labels.on('mouseout', function(){
        //    $(this).removeClass('app-menu-section-label-selected');
        //    $(this).addClass('app-menu-section-label-unselected');
        //});

    };

    scarpa.clueAppLaunch = function (success, failure) {

    };

    scarpa.appLaunch = function (continuation) {

    };

    scarpa.isLoggedIn = function() {
        return clue.getUserName() !== undefined && clue.getUserInfo() !== undefined;
    };
    scarpa.getQueryVersion = function () {
        var queryString = morpheus.Util.getWindowSearchObject();
        var version = "latest";


        if (queryString.version) {
            if (queryString.version[0]==='1' || queryString.version[0].startsWith('1.0')) {
                return '1';
            }
        } else if (queryString.url && queryString.url.length > 0) {
            if (queryString.url[0].indexOf("data.clue.io/tsv2/digests/") > -1) {
                return '1';
            }
        }
        return version;
    }
    scarpa.getTouchStoneRootDirectory = function () {
        var version = scarpa.getQueryVersion();
        if (version === "latest") {
            return "macchiato.clue.io/builds/touchstone/v1.1/arfs";
        }
        return "data.clue.io/tsv2/digests";
    }
    scarpa.touchstone_root_directory = scarpa.getTouchStoneRootDirectory();


    scarpa.s3_root = "//s3.amazonaws.com/";


    scarpa.transcriptionalImpactScoreBins =
    {
        high:
        {
            low: 0.66,
            high: 1.00
        },
        medium:
        {
            low: 0.33,
            high: 0.66
        },
        low:
        {
            low: 0.00,
            high: 0.33
        }
    };

    scarpa.perturbagenTypeList = [ "oe", "kd", "cp" ];

    scarpa.perturbagenTypes =
    {
        "trt_oe":"oe",
        "trt_sh.cgs":"kd",
        "trt_cp":"cp"
    };

    scarpa.perturbagenTypeLabels = _.invert(scarpa.perturbagenTypes);

    scarpa.perturbagenIdentifierColors =
    {
        combined:"#aaaaaa",

        trt_oe:"#2AB9E6",
        oe:"#2AB9E6",
        OE:"#2AB9E6",

        "trt_sh.cgs":"#C355CA",
        kd:"#C355CA",
        KD:"#C355CA",

        trt_cp:"#F5A623",
        cp:"#F5A623",
        CP:"#F5A623"
    };

    scarpa.cellLineIdentifiers = [ "A375", "A549", "HCC515", "HEPG2", "HT29", "MCF7", "PC3" , "HA1E", "VCAP" ];

    scarpa.isCompoundPerturbagen = function (type) {
        return type === 'cp' || type === 'trt_cp';
    };

    scarpa.isOverExpressionPerturbagen = function (type) {
        return type === 'oe' || type === 'trt_oe';
    };

    scarpa.isKnockDownPerturbagen = function (type) {
        return type === 'kd' || type === 'trt_sh.cgs';
    };

    scarpa.capitalizeFirstLetter = function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    scarpa.prettyNumber = function (rawNumber) {

        var dec = String(rawNumber).split(/[.,]/),
            sep = ',',
            decsep = '.';

        return dec[0].split('').reverse().reduce(function (prev, now, i) {
                return i % 3 === 0 ? prev + sep + now : prev + now;
            }).split('').reverse().join('') + (dec[1] ? decsep + dec[1] : '');
    };

    scarpa.ellipsisStringWithLength = function(str, length) {
        return (str.length > length) ? str.substr(0, length - 1) + " ..." : str;
    };

    scarpa.regularExpressionsWithSearchQuery = function (query){

        var REs = [],
            commas = [],
            parts = [],
            quotedRE,
            disassembled;

        quotedRE = new RegExp('"[^"]*"');

        // single quoted query is the RE. Return that.
        if (quotedRE.test(query)) {
            disassembled = query.split('"');
            return [ new RegExp(disassembled[ 1 ], 'i') ];
        }

        // list of comma separated terms
        _.each(query.split(','), function(q){
            commas.push( $.trim(q) );
        });

        // include white space separated terms
        _.each(commas, function(c){
            var cc = [];

            _.each(c.split(' '), function(piece) {
                cc.push($.trim(piece));
            });

            Array.prototype.push.apply(parts, cc);
        });

        // build RE for each term
        _.each(parts, function(p){
            REs.push( new RegExp(p, 'i') );
        });

        return REs;
    };

    // get the property from any css class that is UNASSIGNED to an element.
    scarpa.cssPropertyWithPropertyNameAndClassName = function (property, cssClassName) {

        var $inspector = $("<div>").css('display', 'none').addClass(cssClassName);

        $("body").append($inspector);

        try {
            return $inspector.css(property);
        } finally {
            $inspector.remove();
        }
    };

    return scarpa;
})(scarpa || {});

var sort_by = function(field, reverse, primer){

    var key = primer ?
        function(x) {return primer(x[field])} :
        function(x) {return x[field]};

    reverse = !reverse ? 1 : -1;

    return function (a, b) {
        return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
    }
};

var redirectToSignout = function() {
    window.location= location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '') + "/signout";
};
