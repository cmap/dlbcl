clue.DashboardCard = async function (options, config) {
    let $pertDetails;
    const boldTitle = function (title) {
        return '<br/><span>' + title + ':</span> ';
    }
    const top10Biomarker = async function (options) {
        const top10DataRoot = "https://s3.amazonaws.com/macchiato.clue.io/builds/PMTS015_KRONOS/top10_biomarker/";
        const spert_name = options.pert_iname.toLowerCase().replace("(", "").replace(")", "").replace(/ /g, "_");
        const unsignedURL = top10DataRoot + options.project.toLowerCase() + "/" + spert_name + ".csv";
        const urlToSign = clue.API_URL + '/api/s3_resources/signFile?s3_file=' + unsignedURL;
        const responseValues = await Promise.all([
            clue.getSignedUrlCache(urlToSign)
        ]);
        const signedURL = responseValues[0];
        return await loadTSV(signedURL);
    }
    /**
     *
     * @param file
     * @returns {Promise<void>}
     */
    const loadTSV = async function (file) {
        let data = await d3.csv(file);
        data = data.sort(function (a, b) {
            return morpheus.SortKey.NUMBER_ASCENDING_COMPARATOR(parseInt(a.rank), parseInt(b.rank));
        });
        return data;
    }
    /**
     *
     * @param options
     * @returns {Promise<void>}
     */
    const showPertDetails = async function (options) {
        const pertName = options.pert_iname;
        const pertId = options.pert_id;
        //Table information
        const dhtml = [];
        dhtml.push('<div style="border-top: 1px solid #ddd;" class="pad-top-8 clearfix"></div>');
        dhtml.push('<div class="clearfix"></div>');
        dhtml.push('<span style="font-weight:bold">* Provenance *</span><br/>');
        dhtml.push(boldTitle('Broad ID'));
        dhtml.push(pertId);
        dhtml.push(boldTitle('Name'));
        if (pertName.toUpperCase() === "GDC-0032") {
            dhtml.push("TASELISIB");
            dhtml.push(boldTitle('Alias'));
            dhtml.push(pertName.toUpperCase());
        } else {
            dhtml.push(pertName ? pertName.toUpperCase() : "-");
        }
        dhtml.push(boldTitle('Dataset'));
        dhtml.push(options.project);

        if(options.combination){
            dhtml.push('<br/><br/><div style="border-top: 1px solid #ddd;" class="pad-top-8 clearfix"></div>');
            dhtml.push('<div class="clearfix"></div>');
            dhtml.push('<span style="font-weight:bold">* Compounds in Combination *</span><br/>');
            dhtml.push(boldTitle('Dose'));
            dhtml.push(options.combination.dose);
            for(let i=0; i < options.combination.perts.length;i++){
                const pert = options.combination.perts[i];
                const pertName = pert.name;
                const pertID = pert.pert_id;

                //split the name and look up as neccessary
                dhtml.push(boldTitle('Broad ID'));
                dhtml.push(pertID);
                dhtml.push(boldTitle('Name'));
                dhtml.push(pertName ? pertName.toUpperCase() : "-");
                dhtml.push('<br/>');
            }
        }
        //get top 10 biomaekers
        dhtml.push('<br/><br/><br/><div style="border-top: 1px solid #ddd;" class="pad-top-8 clearfix"></div>');
        dhtml.push('<div class="clearfix"></div>');
        dhtml.push('<span style="font-weight:bold">* Top 10 biomarkers *</span><br/>');


        dhtml.push('<br/><br/><div style="border-top: 1px solid #ddd;" class="pad-top-8 clearfix"></div>');
        dhtml.push('<div class="clearfix"></div>');
        dhtml.push('<br/><br/><div style="border-top: 1px solid #ddd;" class="pad-top-8 clearfix"></div>');
        dhtml.push('<div class="clearfix"></div>');
        dhtml.push('<span style="font-weight:bold">* Links *</span><br/><br/>');
        const $d = $(dhtml.join(''));
        $pertDetails.html($d);
    }


    const init = async function (options) {

        const tabIndex = [
            {id: "annotations", title: "Additional Information"},
            // {id: "plots", title: "Plots"},
            // {id: "mechanistic_hypothesis", title: "Mechanistic Hypothesis"}
        ];
        const tabId = _.uniqueId('pertId');
        const html = [];

        html.push('<div style="max-height: unset;overflow:auto;max-width: unset;" class="pert-info-container"">');
        html.push('<div class="pert-info-header" style="border-bottom-color: rgb(245, 166,' + ' 35);">');
        html.push('<span class="pert-info-pert-chip" style="color: rgb(245, 166, 35);"><div class="glyphicon glyphicon-adjust"></div></span>');
        html.push('&nbsp;<span class="pert-info-pert-type">CP</span>');


        if (options.pert_iname.toUpperCase() === "GDC-0032") {
            html.push('<div class="pert-info-headline"> TASELISIB (' + options.pert_iname.toUpperCase() + ')</div>');
        } else {
            html.push('<div class="pert-info-headline">' + options.pert_iname.toUpperCase() + '</div>');
        }
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
            switch (id) {
                case "plots":
                case "mechanistic_hypothesis":
                    break;
                default:
                    showPertDetails(options);
            }
        });
        await showPertDetails(options);
        return {payload: $div};
    }
    return await init(options);
};
