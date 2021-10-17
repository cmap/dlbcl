/*
 * Add click handlers to links to force a pjax (partial) load
 * http://pjax.heroku.com/
 */

/*
    null,
    "ctl_untrt",
    "ctl_untrt.cns",
    "ctl_vector",
    "ctl_vector.cns",
    "ctl_vehicle",
    "ctl_vehicle.cns",
    "trt_lig",
 */




var addPJaxHandlers = function (pjaxTarget) {

    //add pjax click handler to links
    $('a.pjax').off().on('click', function (e) {
        var $this = $(this);
        var tgtUrl = $this.attr('href');

        $.pjax({
            container: pjaxTarget,
            url: tgtUrl
        });

        //add active class if this is a list item (removing it from all siblings)
        if ($this.hasClass('list-group-item')) {
            $this
                .addClass('active')
                .siblings()
                .removeClass('active');
        }

        e.preventDefault();
    });

};

function getCard(url, location)
{
    $.ajax(url).done(function (results) {
            $(location).html(results);
        }).fail(function (err) {
            console.log(err);
        });

}

function displayError(xhr)
{
    var trace = xhr.responseText || "-";
    var type = xhr.statusText || "ERROR";

    return '<div class="metadata-card-vert-container error-card">' +
        '<div class="metadata-card-header">' +
        '<div class="card-type"><span class="pert-info-pert-chip">' +
        '<div class="fa fa-exclamation-triangle"></div></span>&nbsp;<span class="value pert-info-pert-type">ERROR</span></div>' +
        '<div class="card-title-and-icon">' +
        '<div class="metadata-card-title"><span id="error_name">' + type + '</span></div>' +
        '</div>' +
        '<div class="description"><span id="error_description">Contact clue@broadinstitute.org to report errors.  Please provide a screenshot that clearly shows the selected item, as well as any errors printed in the console.</span></div>' +
        '</div>' +
        '<div class="metadata-section"><span class="label">Stack Trace:</span><span id="error_trace" class="value">' + trace + '</span></div>' +
        '<div class="metadata-section">' +
        '<div style="width: 100%; font-size: 100px; text-align: center; color: #a94442" class="fa fa-exclamation-triangle"></div>' +
        '</div>' +
        '</div>';
}

$(document).one('clueReady', function () {

    $.pjax.defaults.timeout = 10000;
    $(document)
        .pjax('a[data-pjax]').on('pjax:error', function (event, xhr, textStatus, errorThrown, options) {
            $("#" + event.target.id).html(displayError(xhr));
            return false;
        })
        .on('submit', 'form[data-pjax]', function (event) {
            $("#error-card").hide();
        })
        .on('submit', 'form[data-pjax]', function (event) {
            event.preventDefault(); // stop default submit behavior
            //use pjax to submit forms
            $.pjax.submit(event);
        })
        .on('pjax:start', function (event) {
        })
        .on('pjax:end', function (event) {
            var tgtID = event.target.id;
            addPJaxHandlers("#" + tgtID);

            //highlight first list group option (if non active yet)
            /*if ($('.list-group a.active').length === 0) {
             $('.list-group a').first().addClass('active');
             }*/
        })
        .on('pjax:complete', function (event) {
        });
});

//toggles visibility of description sections
function toggleDesc(val) {
    if (val === "more") {
        $(".description-concat").hide().next().hide();
        $(".description-full").show().next().show();
    }
    else if (val === "less") {
        $(".description-concat").show().next().show();
        $(".description-full").hide().next().hide();
    }
}

//toggles visibility of tooltips for card plots
//to be deprecated when updatecard is removed
function showTooltip(icon, tip) {
    $(icon).popover({
        html: true,
        content: $(tip).html()
    });
    $('.tooltip_trigger').not(icon).popover('hide');
    //.addClass("fa-question-circle-o").removeClass("fa-question-circle");
    $(icon).popover('show');
    //.removeClass("fa-question-circle-o").addClass("fa-question-circle");
}

//highlights correct block in profiled in graphic
function profiledIn(data) {
    var list1 = [$("a[title='L1000']"), $("a[title='PCCSE']"), $("a[title='CellPainting']"), $("a[title='PRISM']"), $("a[title='Achilles']"), $("a[title='CCLE']"), $("a[title='Huron']")];
    var list2 = ["cmap", "pccse", "cpaint", "prism", "achilles", "ccle", "huron"];
    for (var i = 0; i < list2.length; i++) {
        if (data.indexOf(list2[i]) > -1) {
            list1[i].parent().addClass("profiled");
        }
    }
}

function profiledCollections(data) {
    var dataArr = data.split(",");
    var list1 = [$("a[title='CMAP']"), $("a[title='ACHILLES']"), $("a[title='PRISMPR500']")];
    var list2 = ["CMAP", "ACHILLES", "PRISM-PR500"];
    for (var i = 0; i < list2.length; i++) {
        if (dataArr.indexOf(list2[i]) > -1) {
            list1[i].parent().addClass("profiled");
        }
    }
}

function getVendorUrl(vendor, vid) {

    //console.log(vendor);

    if (vendor == "-666") {
        $("#vendorName").text("-");
    } else if (vendor == "ACADEMIC LAB") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "ATCC") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") {
            $("#vendorURL")
                .attr("href", "https://www.atcc.org/products/all/" + vid + ".aspx")
                .attr("target", "_blank")
                .text("(" + vid + ")");
        }
    } else if (vendor == "DSMZ") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") {
            var newVID = vid.match(/[a-zA-Z]+|[0-9]+/g).join("-");
            $("#vendorURL")
                .attr("href", "https://www.dsmz.de/catalogues/details/culture/" + newVID + ".html")
                .attr("target", "_blank")
                .text("(" + vid + ")");
        }
    } else if (vendor == "ECACC") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "HSRRB") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "ICLC") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "JCRB") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "KCLB") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "LONZA") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "MOCK") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "NCI") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "NCI/DCTD") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "NCR/EW2") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "REC") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "RIKEN") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else if (vendor == "SCLC") {
        $("#vendorName").text(vendor);
        if (vid !== "-666") $("#vendorURL").text("(" + vid + ")");
    } else {
        $("#vendorName").text(vendor);
    }
}

//iterates over lists (such as moa and pcl) and displays a comma and space separated string of the values
function iterateFields(selector, class_selector) {
    var targets = $(class_selector).map(function () {
        return $(this).val();
    }).get();
    targets.sort();
    targets = _.uniq(targets, true);
    targets = targets.join(', ');
    $(selector).text(targets || "-");
}

function getCardUrl(item, query) {
    var version = clue.getVersionFromUrl(query);
    var newQuery = null;
    if(version){
        newQuery = '?version=' + version;
    }
    var type = getPertType(item);
    var id = "";
    if (!type) {
        return constructCardUrl(item.pert_id, "null", newQuery);
    }

    if (item.pert_type === "trt_cc" || item.pert_type === "cc") {
        id = item.code_id;
    }
    else if (item.pert_type === "build") {
        id = item.name;
    }
    else if (item.pert_type === "cell") {
        id = item.cell_iname;
    }
    else {
        id = item.pert_id;
    }
    return constructCardUrl(id, type, newQuery);
}
function constructCardUrl(id, type, query) {
    if (query) {
        return '/cards/' + type  + '/' + id + query;
    }
    return '/cards/' + type  + '/' + id;
}
function getPertType(item) {
    var type = "";
    var pert_type = item.pert_type.toLowerCase();
    if (pert_type === "trt_cp" || pert_type === "cp" || pert_type.startsWith("ctl_vehicle")) {
        type = "compound";
    }
    else if (pert_type.startsWith("trt_sh") || pert_type === "kd") {
        type = "gene-KD";
    }
    else if (pert_type.startsWith("trt_oe") || pert_type === "oe") {
        type = "gene-OE";
    }
    else if (pert_type === "trt_cc" || pert_type === "cc" || pert_type === "pcl") {
        type = "cmap-class";
    }
    else if (pert_type === "cell") {
        type = "cell";
    }
    //temp solution?
    else if (pert_type === "build") {
        type = "build";
    }
    else {
        type = null;
    }

    return type;
}
