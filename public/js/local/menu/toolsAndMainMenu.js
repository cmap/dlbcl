//need to put in callbacks

var APP_TOOLS_TYPE = "Tools";
var APP_UTILITY_TYPE = "Utility";
var APP_WORKBENCH_TYPE = "Workbench";
var APP_REFERENCE_TYPE = "Reference";
var APP_DEVELOPER_TYPE = "For Developers";

//vars for tools menu
var appsElt_tools = $('#analysis_section');
// var utilAppsElt_tools = $('#utility_apps');
var utilAppsElt_tools = $('#utility_section');
var developerAppsElt_tools = $('#developer_apps');

//vars for main menu
var menuModal = $('#hero-menu-modal');
var appsElt = $('#Apps');
var appsArea = $('#AppsList');
var utilAppsElt = $('#UtilityApps');
var referenceApsElt = $('#ReferenceApps');
var developerAppsElt = $('#DeveloperApps');
var elementToFocusOn;

function populateToolsAndMainMenu()
{
    var hotkeyHint =  ' to open menu';
    if (morpheus.Util.IS_MAC) {
        hotkeyHint = 'command-k' + hotkeyHint;
    }
    else {
        hotkeyHint = 'ctrl-k' + hotkeyHint;
    }
    $('#menu-hotkey-hint').text(hotkeyHint);

    var isLoggedIn = scarpa.isLoggedIn();

    $(".tools_app_area").show();
    $('.tools_login_area').hide();
    appsArea.show();
    $('.login-section').hide();
    $("#Apps").show();

    if(isLoggedIn)
    {

    }

    else
    {

    }
}

//TODO: remove all card roles

function constructDeveloperMenuEntry(card)
{
    if (card.category === APP_DEVELOPER_TYPE) {
        var app_module = "<div class='row'><a href='" + card.url + "' data-turbolinks='false' class='col-xs-12 app-link-text'>" + card.title + "</a></div>";
        developerAppsElt_tools.append(app_module);
    }
}

function constructProjectMenuEntry(card)
{
    if (card.category === "Hub") {
        $("#my_projects_empty").hide();
        var app_module = "<div class='row'><a href='" + card.url + "' data-turbolinks='false' class='col-xs-12 app-link-text'>" + card.title + "</a></div>";
        $("#my_projects_section").append(app_module);
    }
}

function constructInternalMenuEntry(card)
{
    if (card.category === APP_UTILITY_TYPE) {
        var app_module = "<div class='row'><a href='" + card.url + "' data-turbolinks='false' class='col-xs-12 app-link-text'>" + card.title + "</a></div>";
        utilAppsElt_tools.append(app_module);
    }
}

function constructToolsMenuEntry(card)
{
    if (card.category === APP_TOOLS_TYPE) {
        var card_template = $(".card_module.module_template");
        var app_module = card_template.clone(true);
        app_module.removeClass("module_template");
        app_module.css("display", "block");
        app_module.find('.card_url').attr("href", card.url);
        app_module.find('.card_imageurl').attr("src", '/' + card.icon_url);
        app_module.find('.card_title').text(card.title);
        app_module.find('.card_description').text(card.description);

        appsElt_tools.append(app_module);
    }
}

function constructMainMenuEntry(card, analysisAppsElt)
{
    if (card.category === APP_TOOLS_TYPE) {
        var appIcon = $('<img/>', {
            'src': "/" + card.icon_url
        });

        var appElt = $('<div/>', {'class': 'col-xs-12 hero-menu-app-with-icon'});

        var appLink = $('<a/>', {
            'href': card.url,
            'class': "click-me"
        });

        appLink.append(appIcon);
        var appText = $('<div/>', {
            'class': 'app-title col-xs-11 app-link-text',
            'text': card.title,
            'style': 'padding-right:0;'
        });
        var tagline = card['tag-line'] || "-"
        appText.append('<br/><div class="modal-form-copy" style="color:#8c8c8c;">' + tagline + '</div>');
        appLink.append(appText);
        var appInfoCircle = '<i class="fa fa-info-circle col-xs-1" data-toggle="tooltip" data-placement="left" title="' + card.description + '" aria-hidden="true" style="align-content: flex-end;color:#2c8fae;padding-left:0;"></i>';

        appLink.append(appInfoCircle);

        appElt.append(appLink);


        analysisAppsElt.append(appElt);

        if (!elementToFocusOn) {
            elementToFocusOn = appLink;
        }
    }
    else if (card.category === APP_REFERENCE_TYPE) {
        addAppTo(referenceApsElt, card.url, card.title, card.description);
    }
}

$(window).keydown(function (e){
    var commandKey = morpheus.Util.IS_MAC ? e.metaKey : e.ctrlKey;
    if (commandKey && e.which === 75) {
        if (!isMenuVisible() && $('body.modal-open').length === 0) {
            menuModal.modal('show');
        }
    }
});

var addAppTo = function(appsElt,appUrl,appTitle,hoverText) {
    console.log(appTitle);
    appsElt.append($('<div/>', { 'class' : 'row'}));
    var appLink = $('<a/>',{
        'class' : "col-xs-6 app-link-text",
        'href' : appUrl,
        'text' : appTitle
    });
    if (hoverText) {
        appLink.attr('title',hoverText);
    }
    var icon;
    if (appTitle === 'API') {
        appLink.prepend('<i class="fa fa-cogs" aria-hidden="true">&nbsp;</i>');
    }
    else if (appTitle === 'Code') {
        appLink.prepend('<i class="fa fa-code" aria-hidden="true">&nbsp;</i>');
    }
    appsElt.children().last().append(appLink);
};

var isMenuVisible = function() {
    return $('#hero-menu-modal').is(":visible");
};

var getButtons = function (url, callback) {
    $.ajax(url).done(function (results) {
        return callback(null,results);
    }).fail(function (err) {
        console.log(err);
        return callback(err);
    });
};

function showWorkbenchAndAdmin(callback)
{
    $("#internal_menu_header").empty();

    // var href = "/teamButtons";
    // getButtons(href, function(err, results){
    //     if(err)
    //     {
    //         $("#internal_menu_header").empty();
    //     }
    //     else
    //     {
    //         $("#internal_menu_header").html(results);
    //     }
    //
    //     return callback();
    // });
    return callback();
}

var compare = function (a, b) {
    var at = a.display_order;
    var bt = b.display_order;

    if(at === undefined)
    {
        at = 1000;
    }

    if(bt === undefined)
    {
        bt = 1000;
    }

    if (at < bt)
        return -1;
    if (at > bt)
        return 1;
    return 0;
}

function showMainMenu()
{
    menuModal.modal('show');
}