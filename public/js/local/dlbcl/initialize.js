async function loadTabs(config) {
    //Load data to be pushed into the tabs from some server
    //we cache the urls and the data to cut down on round trips
    //Data is is evicted using LIFO
    //Data is evicted after a set time or when the cache gets full
    const promises = [
        //fetch the data for the dashboard table
        str8_cash.cache(config.dashboard_url, {
            signurl: false
        }),
        //fetch the data for umap display
        str8_cash.cache(config.umap_url, {
            signurl: false
        }),
        //A configuration file for displaying selectivity data in morpheus
        str8_cash.cache(config.selectivity.config, {
            signurl: false
        }),
        //fetch urls to download data
        str8_cash.cache(dlbcl_public_data_url, {
            signurl: false
        })
    ];
    Promise.all(promises).then(async function (responseValues) {
        //Handle response from the server
        const dashboardData = await responseValues[0].json(); //table data
        const umapArray = await responseValues[1].json(); //umap data
        const drcArray = [];//Does response curve data
        config.selectivity.data = await responseValues[2].json();
        const unsigned_urls = await responseValues[3].json(); //data to download

        const umap = new Umap(umapArray,config);
        const dlbclDashboard = new DLBCLDashboard(umap, [], config);
        const promises = [];

        //This is where stuff get pushed into the tabs. Note the id of each tab
        //is used to indicate where data should be pushed
        const morpheus_config = {};
        promises.push(dlbclDashboard.build(morpheus_config, dashboardData, drcArray));
        promises.push(umap.build());
        promises.push(loadTab(config.correlation, "#correlation-morpheus", "correlation"));
        promises.push(loadTab(config.selectivity, "#selectivity-morpheus", "selectivity"));
        const dlbclDownload = new DLBCLDownload(unsigned_urls, [], config);
        promises.push(dlbclDownload.build());
        await Promise.all(promises).then(async function (responseValues) {
        }).catch(function (err) {
            console.log(err);
        });
    }).catch(function (err) {
        console.log(err);
    });
    async function loadTab(payload, el, tabType) {
        const fileName = payload.gct;
        if(!payload.data){
            payload.data = {};
        }
        const data = payload.data;
        data["dataset"] = fileName;
        data.el = $(el);
        data.standalone = false;
        data.rename = false;
        data.autohideTabBar = true;
        data.drawValuesFormat = 0;
        data.loadedCallback = function (e) {
            if (tabType === "correlation") {
                $("#correlation_ready_id").attr('data-correlation-ready', 'ready');
                console.log('Done loading correlation');
            } else {
                console.log('Done loading selectivity');
            }
        };
        const heatMap = new morpheus.HeatMap(data);
        if (tabType === "selectivity") {
            heatMap.promise.then(async function () {
                const n = 0;
                heatMap.heatmap.setDrawValuesFormat(morpheus.Util.createNumberFormat('.' + n + 'f'));
                heatMap.revalidate();
                return "done";
            });
        } else {
            return "done";
        }

    }
}

