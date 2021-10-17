clue.DLBCLDownloadCard = function (options) {

    let $pertDetails;
    const boldTitle = function (title) {
        return '<br/><span><b>' + title + ':</b></span> ';
    }

    const showDetails = function (options) {

        const dhtml = [];
        dhtml.push('<div style="border-top: 1px solid #ddd;" class="pad-top-8 clearfix"></div>');
        dhtml.push('<div class="clearfix"></div>');
        dhtml.push(boldTitle('Description'));
        dhtml.push(options.description);
        dhtml.push(boldTitle('Download'));
        dhtml.push('<a href="' + options.url + '" download target="download">' + options.name + '&nbsp;<i class="fa fa-download" aria-hidden="true"></i></a>');

        dhtml.push('<br/><br/><div style="border-top: 1px solid #ddd;" class="pad-top-8 clearfix"></div>');
        dhtml.push('<div class="clearfix"></div>');
        dhtml.push(boldTitle('In case your browser times out while downloading, you may use any of the following command line utilities to fetch the file'));
        dhtml.push('<ul>');
        if (options.other_location && options.other_location.startsWith("ftp://")) {
            dhtml.push('<li class="code-box">curl -p --insecure ' + "'" + options.other_location + "' -o ~/Documents/" +
                options.name + '(replace ~/Documents with the full path to directory where you want to download the file) </li>');
            dhtml.push('<li class="code-box">wget -r ' + "'" + options.other_location + "'" + '</li>');
        } else {
            dhtml.push('<li class="code-box">curl ' + options.url + '</li>');
            dhtml.push('<li class="code-box">wget ' + options.url + '</li>');
        }
        dhtml.push('</ul>');
        dhtml.push('<div class="clearfix"></div>');

        const $d = $(dhtml.join(''));
        $pertDetails.html($d);
    }


    const init = function (options) {
        const tabIndex = [
            {id: "annotations", title: "Download Information"},
        ];
        const tabId = _.uniqueId('name');
        const html = [];


        html.push('<div style="max-height: unset;overflow:auto;max-width: unset;" class="pert-info-container"">');
        html.push('<div class="pert-info-header" style="border-bottom-color: rgb(245, 166,' + ' 35);">');
        html.push('<div class="pert-info-headline">' + options.name + '</div>');
        html.push('</div>');

        html.push('<ul class="nav nav-tabs" role="tablist">');
        for (let i = 0; i < tabIndex.length; i++) {
            html.push('<li role="presentation" class="'
                + (i === 0 ? 'active' : '') + '"><a href="#'
                + tabId + '" aria-controls="' + tabId
                + '" role="tab" data-clue-id="'
                + tabIndex[i].id
                + '" data-toggle="tab" id="'
                + tabIndex[i].id
                + '"> '
                + tabIndex[i].title
                + '</a></li>');
        }
        html.push('</ul>');

        html.push('<div class="tab-content">');
        html.push('<div role="tabpanel" class="tab-pane active" id="' + tabId
            + '"><div class="pad-bottom-8" style="border-bottom: 1px solid #ddd;"' +
            ' name="pertIdDetails"></div></div>');
        html.push('</div>');

        const $div = $(html.join(''));

        $pertDetails = $div.find('[name=pertIdDetails]');
        $div.find('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
            const id = $(e.target).data('clue-id');
            $("#tab_census_db").attr('data-clue-tab', id);
            showDetails(options);
        });
        showDetails(options);
        return {payload: $div};
    }
    return init(options);
};
