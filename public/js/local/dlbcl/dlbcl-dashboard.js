class DLBCLDashboard {
    /**
     *
     * @param umap
     * @param errorBarsData
     * @param config
     */
    constructor(umap, errorBarsData, config) {
        this.nf = morpheus.Util.createNumberFormat('.2f');
        this.displayFeatureTypes = ['GE','REP','XPR','GE_NOLIN','LIN','MUT'];

        this.config = config;
        this.errorBarsData = errorBarsData;
        this.pertNameToId = new Map();
        this.selectedJobs = [];
        this.pertIdsArray = [];
        this.drcArray = [];
        this.searchResultsTable = null;
        this.filterManager = null;
        this.$c1 = $('#c1');
        this.$c2 = $('#c2');
        this.$c3 = $('#c3');
        this.$card = $('<div></div>').addClass('empty-card');
        $('<span class="empty-card-instructions">Select a perturbagen </br> ' +
            'for more information</span>').appendTo(this.$card);
        this.$card.appendTo(this.$c3);
        this.$tableDiv = $('<div></div>');
        this.$tableDiv.appendTo(this.$c2);
        this.umapExplorer = umap;
        this.projectSet = new morpheus.Set();
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async reformatPertArray() {
        const self = this;
        self.pertIdsArray.forEach(function (item) {
            const name = item.pert_id;
            self.pertNameToId.set(item.pert_iname, name);
            item.targets = [];
            item.moas = [];
        });
        self.pertIdsArray.sort(function (a, b) {
            return morpheus.SortKey.ASCENDING_COMPARATOR(a.pert_id, b.pert_id);
        });
        for (let i = 0, length = self.pertIdsArray.length; i < length; i++) {
            self.pertIdsArray[i].sortOrder = i;
        }
    }

    /**
     *
     * @param morpheus_config
     * @param censusArray
     * @param drcArray
     * @returns {Promise<string>}
     */
    async build(morpheus_config, censusArray, drcArray) {
        this.configSignedUrl = morpheus_config;
        this.pertIdsArray = censusArray;
        this.drcArray = drcArray
        $('#loading').hide();
        await this.reformatPertArray();
        await this.init();
        return "done";
    }
    /**
     *
     * @param selectivityArray
     * @returns {Promise<string>}
     */
    async buildSelectivityMap(selectivityArray) {
        const x = ['Dose 1', 'Dose 2', 'Dose 3', 'Dose 4'];
        const y = [];
        const z = new Array(selectivityArray.length);

        for (let i = 0; i < selectivityArray.length; i++) {
            const item = selectivityArray[i];
            const name = item.pert_name;
            y.push(name);
            z[i] = new Array(4);
            z[i][0] = item.Dose_1;
            z[i][1] = item.Dose_2;
            z[i][2] = item.Dose_3;
            z[i][3] = item.Dose_4;
        }

        const colorscaleValue = [
            [0, '#0000FF'],
            [0.25, '#ABDDA4'],
            [0.50, '#FFFFFF'],
            [0.75, '#FDAE61'],
            [1, '#FF0000']
        ];

        const data = [{
            z: z.reverse(),
            y: y.reverse(),
            x: x,
            type: 'heatmap',
            colorscale: colorscaleValue
        }];
        const layout = {
            title: "Selectivity Matrix",
            annotations: [],
            autosize: true,
            width: 1500,
            height: 2000,
            hovermode: false
        };
        const textColor = 'white';
        for (let i = 0; i < y.length; i++) {
            for (let j = 0; j < x.length; j++) {
                const result = {
                    xref: 'x1',
                    yref: 'y1',
                    x: x[j],
                    y: y[i],
                    text: z[i][j],
                    font: {
                        family: 'Arial',
                        size: 12,
                        color: textColor
                    },
                    showarrow: false
                };
                layout.annotations.push(result);
            }
        }
        Plotly.newPlot('c5', data, layout);
        return "done";
    }

    /**
     * Add filters/facets on left of table
     * @returns {Promise<void>}
     */
    async addFilters() {
        this.filterManager = new clue.FilterManagerUI(new clue.FilterManager(this.pertIdsArray), this.$c1);
        this.filterManager.add({
            name: 'Project',
            filter: new clue.SetFilter({
                get: function (item, index) {
                    return item.project;
                },
                nvalues: function (item) {
                    return item.project != null ? 1 : 0;
                }
            })
        });
        this.filterManager.add({
            name: 'Type',
            filter: new clue.SetFilter({
                get: function (item, index) {
                    return DLBCL_pertTypeToString(item.pert_type);
                },
                nvalues: function (item) {
                    return item.pert_type != null ? 1 : 0;
                }
            })
        });
        this.filterManager.add({
            name: 'Time',
            filter: new clue.SetFilter({
                get: function (item, index) {
                    return item.pert_time;
                },
                nvalues: function (item) {
                    return item.pert_time != null ? 1 : 0;
                }
            })
        });
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async addTable() {
        let _this = this;
        let checkBoxColumn = tablelegs.Table.createCheckBoxColumn({field: 'id'});
        this.selectedJobs = checkBoxColumn.set;

        this.searchResultsTable = new tablelegs.Table({
            search: true,
            showAll: false,
            export: false,
            exportFileName: _this.export_file_name,
            $el: _this.$tableDiv,
            items: _this.pertIdsArray,
            columns: [
                checkBoxColumn,
                {
                    name: 'Name',
                    field: 'pert_iname',
                    visible: true
                },
                {
                    name: 'Pert ID',
                    field: 'pert_id',
                    visible: false
                },
                {
                    name: 'Time (Hours)',
                    field: 'pert_time',
                    visible: true
                },
                {
                    name: 'Type',
                    field: 'pert_type',
                    visible: true,
                    getter: function (item) { // custom getter
                        return DLBCL_pertTypeToString(item.pert_type);
                    }
                },
                {
                    name: 'Project',
                    field: 'project',
                    visible: true
                }
            ]
        });
    }

    /**
     *
     */
    toggleButtons() {
        const correlationReady = $("#correlation_ready_id").attr('data-correlation-ready');
        const connReady = $("#connectivity_ready_id").attr('data-connectivity-ready');

        if (correlationReady === "ready") {
            $("#correlation-id").attr('disabled', false);
        } else {
            $("#correlation-id").attr('disabled', true);
        }

        if (this.selectedJobs.size() > 0 && connReady === "ready") {
            $("#connectivity-id").attr('disabled', false);
        } else {
            $("#connectivity-id").attr('disabled', true);
        }

        if (this.selectedJobs.size() > 0) {
            $("#umap-id").attr('disabled', false);
            $("#viability-id").attr('disabled', false);
            $("#volcano-id").attr('disabled', false);
            $("#selectivity-id").attr('disabled', false);
            $("#correlation-id").attr('disabled', false);
        } else {
            $("#umap-id").attr('disabled', true);
            $("#viability-id").attr('disabled', true);
            $("#volcano-id").attr('disabled', true);
            $("#selectivity-id").attr('disabled', true);
            $("#correlation-id").attr('disabled', true);
        }
    }

    /**
     *
     * @param tabName
     */
    sendToMatrix(tabName) {
        const self = this;
        let inputs = "";
        let mainTabId = "#" + tabName;
        self.selectedJobs.forEach(function (id) {
            const item = _.findWhere(self.pertIdsArray, {id: id});
            let name = item.pert_iname;
            if(item.index){
                name = item.index;
            }

            if (inputs) {
                inputs = inputs + " " + name;
            } else {
                inputs = name;
            }
        });
        this.addInputsToMatrix(tabName, mainTabId, inputs);
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async overlayUMap(tabName) {
        const self = this;
        const inputs = [];
        self.selectedJobs.forEach(function (id) {
            const item = _.findWhere(self.pertIdsArray, {id: id});
            let name = item.pert_iname;
            if(item.index){
                name = item.index;
            }
            const project = item.project;
            inputs.push(name + "-" + project);
        });
        await self.umapExplorer.overlayMap(inputs);
        $('.nav-tabs a[data-link="' + tabName + '"]').tab('show');
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async viewTopBiomarkers(tabName) {
        const self = this;
        const inputs = [];
        self.selectedJobs.forEach(function (id) {
            const item = _.findWhere(self.pertIdsArray, {id: id});
            let name = item.pert_iname;
            if (item.index) {
                name = item.index;
            }
            const project = item.project;
            inputs.push(name + "-" + project);
        });
        await self.umapExplorer.overlayMap(inputs);
        $('.nav-tabs a[data-link="' + tabName + '"]').tab('show');
    }
    /**
     *
     * @returns {Promise<void>}
     */
    async querySelectivity() {

        let inputs = "";
        // let mainTabId = "#" + tabName;
        self.selectedJobs.forEach(function (id) {
            const item = _.findWhere(self.pertIdsArray, {id: id});

            let name = item.name;
            if(item.index){
                name = item.index;
            }
            if (inputs) {
                inputs = inputs + " " + name;
            } else {
                inputs = name;
            }
        });
        await this.addInputsToMatrix(tabName, mainTabId, inputs);
    }

    /**
     *
     * @param tabName
     * @returns {Promise<string>}
     */
    async displayVolcano(tabName) {
        try {
            const self = this;
            const perts = [];
            self.selectedJobs.forEach(function (id) {
                const item = _.findWhere(self.pertIdsArray, {id: id});
                let pert_name = item.pert_iname;
                if (item.index) {
                    pert_name = item.index;
                }
                const spert_name = pert_name.toLowerCase().
                replace("(", "").
                replace(")", "").replace(/ /g,"_");

                perts.push({
                    "project": item.project,
                    "spert_name": spert_name,
                    "pertname": pert_name,
                    "pert_id": item.pert_id
                });
            });
            await self.loadVolcano(perts);
            $('.nav-tabs a[data-link="' + tabName + '"]').tab('show');
        }catch(ee){
            console.log(ee);
        }finally{
            //displayVolcano
        }
        return "done"
    }
    /**
     *
     * @returns {Promise<void>}
     */
    async queryBQ() {
        const self = this;
        const perts = [];
        self.selectedJobs.forEach(function (id) {
            const item = _.findWhere(self.pertIdsArray, {id: id});
            let pert_name = item.pert_iname;
            if(item.index){
                pert_name = item.index;
            }
            perts.push({"project": item.project, "pertname": pert_name, "pert_id": item.pert_id});
        });
        //await self.loadMorpheusMulti(perts);
        //Do something with selected items
        return "done";
    }

    /**
     *
     * @param tabName
     * @param mainTabId
     * @param inputs
     */
    addInputsToMatrix(tabName, mainTabId, inputs) {
        const $search = $(mainTabId).find("input[name=search]");

        if (tabName === "morpheus-tab4") {
            $search.val("pert_name:" + inputs);
        } else {
            $search.val("id:" + inputs);
        }
        $(mainTabId).find("span[data-name=searchResultsWrapper]").css("display", "block");
        $search.keyup();
        $(mainTabId).find("button[name=matchesToTop]").trigger("click");
        $('.nav-tabs a[data-link="' + tabName + '"]').tab('show');
    }

    /**
     *
     * @param dataset
     * @param project
     */
    addProject(dataset, project) {
        let columnMetadata = dataset.getColumnMetadata();
        let pert_idoses = columnMetadata.getByName("pert_idose");
        const projectVector = columnMetadata.add('project');
        projectVector.getProperties().set(morpheus.VectorKeys.DATA_TYPE, 'text');
        for (let i = 0, size = pert_idoses.size(); i < size; i++) {
            projectVector.setValue(i, project);
        }
    }

    /**
     *
     * @param dataset
     * @param culture
     */
    addCultureP(dataset, culture) {

        let rowMetadata = dataset.getRowMetadata();
        let cultureVector = dataset.getRowMetadata().getByName('culture');
        if (!cultureVector) {
            cultureVector = rowMetadata.add('culture');
            cultureVector.getProperties().set(morpheus.VectorKeys.DATA_TYPE, 'text');
            const daveVector = dataset.getRowMetadata().getByName('davepool_id');
            for (let i = 0, size = daveVector.size(); i < size; i++) {
                const pool_id = daveVector.getValue(i);
                if (pool_id && pool_id.startsWith(PR500)) {
                    cultureVector.setValue(i, culture);
                } else if (pool_id && pool_id.startsWith(PR300)) {
                    cultureVector.setValue(i, culture);
                } else {
                    cultureVector.setValue(i, null);
                }
            }
        }
    }

    /**
     *
     * @param pert_id
     * @returns {Promise<{pr300Median: *, pr300Full: *, pr500Median: *, pr500Full: *}>}
     */
    async signURLS(pert_id) {
        const self = this;
        const foundPert = _.findWhere(self.pertIdsArray, {"pert_id": pert_id});
        const pr500FullFile = foundPert.pr500_file;
        const pr500MedianFile = foundPert.pr500_median_file;
        const pr300FullFile = foundPert.pr300_file;
        const pr300MedianFile = foundPert.pr300_median_file;

        const pr500MedianFileURL = self.config.gct_file_root + foundPert.project.toLowerCase() + "/" + pr500MedianFile;
        const pr500FullFileURL = self.config.gct_file_root + foundPert.project.toLowerCase() + "/" + pr500FullFile;
        const pr300MedianFileURL = self.config.gct_file_root + foundPert.project.toLowerCase() + "/" + pr300MedianFile;
        const pr300FullFileURL = self.config.gct_file_root + foundPert.project.toLowerCase() + "/" + pr300FullFile;

        const pr500S3FullURLToSign = clue.API_URL + '/api/s3_resources/signFile?s3_file=' + pr500FullFileURL;
        const pr500S3MedianURLToSign = clue.API_URL + '/api/s3_resources/signFile?s3_file=' + pr500MedianFileURL;
        const pr300S3FullURLToSign = clue.API_URL + '/api/s3_resources/signFile?s3_file=' + pr300FullFileURL;
        const pr300S3MedianURLToSign = clue.API_URL + '/api/s3_resources/signFile?s3_file=' + pr300MedianFileURL;

        const responseValues = await Promise.all([
            clue.getSignedUrlCache(pr500S3FullURLToSign),
            clue.getSignedUrlCache(pr500S3MedianURLToSign),
            clue.getSignedUrlCache(pr300S3FullURLToSign),
            clue.getSignedUrlCache(pr300S3MedianURLToSign)
        ]);
        const pr500FullDatasetSignedURL = responseValues[0];
        const pr500MedianDatasetSignedURL = responseValues[1];
        const pr300FullDatasetSignedURL = responseValues[2];
        const pr300MedianDatasetSignedURL = responseValues[3];
        return {
            pr500Full: pr500FullDatasetSignedURL,
            pr500Median: pr500MedianDatasetSignedURL,
            pr300Full: pr300FullDatasetSignedURL,
            pr300Median: pr300MedianDatasetSignedURL
        }
    }

    /**
     *
     * @param dataset
     * @returns {Promise<void>}
     */
    async addPertDose(dataset) {
        const pert_itime = "120 H";
        const pert_time = 120;
        const columnMetadata = dataset.getColumnMetadata();
        let pert_idoses = columnMetadata.getByName("pert_idose");
        const pertTimeVector = columnMetadata.add('pert_time');
        pertTimeVector.getProperties().set(morpheus.VectorKeys.DATA_TYPE, 'number');
        const pertItimeVector = columnMetadata.add('pert_itime');
        const pertDoseVector = columnMetadata.add('pert_dose');
        pertDoseVector.getProperties().set(morpheus.VectorKeys.DATA_TYPE, 'number');

        for (let i = 0, size = pert_idoses.size(); i < size; i++) {
            pertTimeVector.setValue(i, pert_time);
            pertItimeVector.setValue(i, [pert_itime]);
            let pert_idose = pert_idoses.getValue(i);
            let pert_dose = parseFloat((pert_idose.split(" ")[0].trim())).toFixed(1).trim().toString();
            pertDoseVector.setValue(i, parseFloat(pert_dose));


            if (pert_dose.endsWith(".0")) {
                pert_dose = parseFloat(pert_dose);
            }
            if (pert_idose.toLowerCase().endsWith("nm")) {//convert to um
                pert_dose = pert_dose / 1000;
                pert_idose = pert_dose.toString() + " uM";
            } else {
                pert_idose = pert_dose + " " + pert_idose.split(" ")[1];
            }
            pert_idose = pert_idose.replace("um", "uM");
            pert_idoses.setValue(i, pert_idose);
        }
        return "done";
    }

    /**
     *
     * @param dataset
     * @param project
     * @param culture
     * @returns {Promise<morpheus.Dataset|morpheus.Dataset>}
     */
    async createAUCIC50Dataset(dataset, project, culture) {
        const self = this;
        const columnMetadataModel = dataset.getColumnMetadata();
        const columnMetadataNames = morpheus.MetadataUtil.getMetadataNames(columnMetadataModel);
        const aucIc50Dataset = new morpheus.Dataset({
            rows: dataset.getRowCount(),
            columns: 2
        });

        const cultureP = culture + "P";
        morpheus.DatasetUtil.fill(aucIc50Dataset, NaN);
        let pert_name = null;
        for (let index = 0; index < columnMetadataNames.length; index++) {
            const columnName = columnMetadataNames[index];
            const columnMetadataVector = columnMetadataModel.getByName(columnName);
            const aucIc50Vector = aucIc50Dataset.getColumnMetadata().add(columnName);
            const origVal = columnMetadataVector.getValue(0);
            if (columnName === "pert_iname") {
                pert_name = origVal;
            }
            let val = origVal;
            for (let i = 0, ncols = aucIc50Dataset.getColumnCount(); i < ncols; i++) {
                if (columnName === "pert_dose" || columnName === "pert_idose") {
                    if (i === 0) {
                        val = "auc";
                    } else {
                        val = "ic50";
                    }
                } else if (columnName === "id") {

                    if (i === 0) {
                        val = origVal + "_auc"
                    } else {
                        val = origVal + "_ic50";
                    }
                }
                aucIc50Vector.setValue(i, val);
            }
        }
        morpheus.MetadataUtil.copy(dataset.getRowMetadata(), aucIc50Dataset.getRowMetadata());
        const datasetCCLE = dataset.getRowMetadata().getByName("ccle_name");

        for (let i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
            //look up information from DRC map
            const ccle_name = datasetCCLE.getValue(i);
            const searchTerm = {
                ccle_name: ccle_name,
                culture: culture,
                pert_name: pert_name,
                dataset: project
            };
            const searchTermP = {
                ccle_name: ccle_name,
                culture: cultureP,
                pert_name: pert_name,
                dataset: project
            };
            const foundDRC = _.findWhere(self.drcArray, searchTerm);
            const foundDRCP = _.findWhere(self.drcArray, searchTermP);

            if (foundDRC || foundDRCP) {
                let auc = null;
                let ic50 = null;
                if (foundDRC) {
                    if (foundDRC.auc) {
                        auc = self.nf(foundDRC.auc);
                    }
                    ic50 = foundDRC["log2.ic50"];
                    if (ic50 && ic50 !== "NA") {
                        ic50 = self.nf(ic50);
                    }
                } else {
                    if (foundDRCP.auc) {
                        auc = self.nf(foundDRCP.auc);
                    }
                    ic50 = foundDRCP["log2.ic50"];
                    if (ic50 && ic50 !== "NA") {
                        ic50 = self.nf(ic50);
                    }
                }
                aucIc50Dataset.setValue(i, 0, auc);
                aucIc50Dataset.setValue(i, 1, ic50);
            }
        }
        return aucIc50Dataset;
    }

    /**
     *
     * @param signedURLS
     * @param project
     * @returns {Promise<{median: *, full: *}>}
     */
    async readDatasets(signedURLS, project) {
        const self = this;
        const responseValues = await Promise.all([
            morpheus.DatasetUtil.read(signedURLS.pr300Median),
            morpheus.DatasetUtil.read(signedURLS.pr500Median),
            morpheus.DatasetUtil.read(signedURLS.pr300Full),
            morpheus.DatasetUtil.read(signedURLS.pr500Full)
        ]);
        const dataset300M = responseValues[0];
        const dataset500M = responseValues[1];
        const dataset300F = responseValues[2];
        const dataset500F = responseValues[3];

        self.addProject(dataset300M, project);
        self.addProject(dataset500M, project);
        self.addProject(dataset300F, project);
        self.addProject(dataset500F, project);

        self.addCultureP(dataset300M, PR300);
        self.addCultureP(dataset500M, PR500);
        self.addCultureP(dataset300F, PR300);
        self.addCultureP(dataset500F, PR500);

        await self.addPertDose(dataset300M);
        await self.addPertDose(dataset500M);
        const foo300M = await self.createAUCIC50Dataset(dataset300M, project, PR300);
        const foo500M = await self.createAUCIC50Dataset(dataset500M, project, PR500);
        let joinedMedianDatasetf = new morpheus.JoinedDataset(foo300M, foo500M);

        let joinedMedianDataset = new morpheus.TransposedDatasetView(
            new morpheus.JoinedDataset(dataset300M, dataset500M));
        joinedMedianDataset = new morpheus.JoinedDataset(joinedMedianDataset,
            new morpheus.TransposedDatasetView(joinedMedianDatasetf));

        const joinedFullDataset = new morpheus.JoinedDataset(dataset300F, dataset500F);
        return {
            median: joinedMedianDataset,
            full: new morpheus.TransposedDatasetView(joinedFullDataset)
        }
    }

    /**
     *
     * @param pert
     * @returns {Promise<*>}
     */
    async signVolcanoURL(pert) {
        const self = this;
        const volcano_plot_root = "https://s3.amazonaws.com/macchiato.clue.io/builds/PMTS015_KRONOS/biomarker/";
        const unsignedURL = volcano_plot_root + pert.project.toLowerCase() + "/" + pert.spert_name + ".csv";
        const urlToSign = clue.API_URL + '/api/s3_resources/signFile?s3_file=' + unsignedURL;
        const responseValues = await Promise.all([
            clue.getSignedUrlCache(urlToSign)
        ]);
        const signedURL = responseValues[0];
        return await self.loadTSV(signedURL);
    }

    /**
     *
     * @param d
     * @returns {*}
     */
    parser(d) {
        for (let key in d) {
            if (d.hasOwnProperty(key)) {
                if (key === "q.val") {
                    d[key] = -1 * Math.log10(DLBCLDashboard.numberParser(d[key]));
                } else {
                    //if the key is dose then replace with bubble of appropriate size
                    d[key] = DLBCLDashboard.numberParser(d[key]);
                }
            }
        }
        return d;
    }

    /**
     *
     * @param value
     * @returns {number}
     */
    static numberParser(value) {
        return (+value) ? +value : value;
    }

    /**
     *
     * @param file
     * @returns {Promise<unknown>}
     */
    async loadTSV(file) {
        const self = this;
        const data = await d3.csv(file);
        const filteredData = data.filter(function (row) {
            const featureType =  row['feature_type'].toUpperCase();
            return self.displayFeatureTypes.includes(featureType);
        });

        const mappedData = filteredData.map(function (row) {
            return self.parser(row);
        });
        const groupByFeatureType = _.groupBy(mappedData, "feature_type");
        return groupByFeatureType;
    }

    /**
     *
     * @param perts
     * @returns {Promise<string>}
     */
    async loadVolcano(perts) {
        const self = this;
        const datasets = [];
         for await (let pert of perts) {
            const dataset = await self.signVolcanoURL(pert);
            datasets.push({key: pert.pertname + "_" + pert.project, value: dataset});
        }
        $('#c12').html('');

        const volcano = new Volcano(datasets);
        await volcano.build();
        return "done";
    }

    /**
     *
     * @param min_dose
     * @param max_dose
     * @param lengthX
     * @returns {[]}
     */
    sequentialXValues(min_dose, max_dose, lengthX) {
        const step = (max_dose - min_dose) / (lengthX * 10);
        const arr = [];
        for (let i = min_dose; i < max_dose; i += step) {
            arr.push(i);
        }
        return arr;
    }

    /**
     *
     * @param lower_limit
     * @param upper_limit
     * @param ec50
     * @param slope
     * @param xVals
     * @returns {[]}
     */
    computeY(lower_limit, upper_limit, ec50, slope, xVals) {
        const top = upper_limit - lower_limit;
        const yVals = [];
        for (let i = 0; i < xVals.length; i++) {
            const x = xVals[i];
            const down = Math.pow(2, x) / ec50;
            const downPow = 1 + Math.pow(down, slope);
            const y = lower_limit + (top / downPow);
            yVals.push(y)
        }
        return yVals;
    }

    /**
     *
     * @param drc
     * @param xLength
     * @param pert_index
     * @param name
     * @returns {{mode: string, line: {shape: string, color: *}, showlegend: boolean, x: *, name: string, y: *, text: [], type: string}}
     */
    createTraceCurve(drc, xLength, pert_index, name) {
        const color = this.getColor(pert_index);
        const ec50 = drc.ec50;
        const xVals = this.sequentialXValues(Math.log2(drc.min_dose), Math.log2(drc.max_dose), xLength);
        const yVals = this.computeY(drc.lower_limit, drc.upper_limit, ec50, drc.slope, xVals);
        return {
            x: xVals,
            y: yVals,
            text: [],
            name: "<b>" + name + "</b>",
            mode: 'lines',
            type: 'scatter',
            line: {'shape': 'spline', color: color},
            showlegend: true
        };
    }
    /**
     *
     * @param xVals
     * @param yVals
     * @param color
     * @param name
     * @returns {{mode: string, line: {color: *, width: number, dash: string}, x: *, y: *}}
     */
    createTraceLine(xVals, yVals, color, name) {
        const trace = {
            x: xVals,
            y: yVals,
            mode: 'lines',
            line: {
                dash: 'dash',
                width: 4,
                color: color
            }
        };
        if (name) {
            trace["name"] = "<b>" + name + "</b>";
        } else {
            trace["showlegend"] = false;
        }
        return trace;
    }

    /**
     *
     * @param minXVal
     * @param maxXVal
     * @param yVal
     * @param color
     * @param name
     * @returns {{mode: string, line: {color: *, width: number, dash: string}, x: [*, *], y: [*, *]}}
     */
    createTraceLineOld(minXVal, maxXVal, yVal, color, name) {
        const trace = {
            x: [minXVal, maxXVal],
            y: [Math.pow(2, yVal), Math.pow(2, yVal)],
            mode: 'lines',
            line: {
                dash: 'dash',
                width: 4,
                color: color
            }
        };
        if (name) {
            trace["name"] = "<b>" + name + "</b>";
        } else {
            trace["showlegend"] = false;
        }
        return trace;
    }

    /**
     *
     * @param index
     * @returns {*}
     */
    getColor(index) {
        const colorArray = [
            '#AB63FA',
            '#19D3F3',
            '#FF6692',
            '#B6E880',
            '#FF97FF',
            '#1F77B4',
            '#FF7f0E',
            '#2CA02C',
            '#D62728',
            '#9467BD',
            '#8C564B',
            '#E377C2',
            '#7F7F7F',
            '#BCBD22',
            '#17BECF',
            '#636EFA'
        ];
        return colorArray[index];
    }

    /**
     *
     * @param name
     * @param index
     * @returns {{mode: string, marker: {size: *, color: *}, x: [], name: string, y: [], text: [], type: string, hovertemplate: string}}
     */
    createTrace(name, index) {
        let colorDots = this.getColor(index);
        //let sizeDots = 8;
        const sizeDots = 15;
        return {
            x: [],
            y: [],
            text: [],
            name: "<b>" + name + "</b>",
            mode: 'markers',
            type: 'scatter',
            marker: {
                size: sizeDots,
                color: colorDots
            },
            hovertemplate:
                "<b>ID: %{text.id}</b><br>" +
                "<b>Pert: %{text.pert_name}</b><br>" +
                "<b>Score: %{text.score}</b><br>" +
                "<b>Pert dose: %{text.pert_idose}</b><br>" +
                "<b>Pert time: %{text.pert_itime}</b><br>" +
                "<b>Culture: %{text.culture}</b><br>" +
                "<extra></extra>"
        };
    }

    /**
     *
     * @param data
     * @param pertname
     * @param pert_index
     * @param cell_name
     * @param culture
     * @param project
     * @param minX
     * @param maxX
     * @returns {Promise<{ic50: *, isDRC: *, auc: *}>}
     */
    async addDRC2Data(data, pertname, pert_index, cell_name, culture, project, minX, maxX) {
        const self = this;
        const foundDRC = _.findWhere(self.drcArray, {pert_name: pertname, ccle_name: cell_name, culture: culture, dataset: project});
        let auc = "";
        let ic50 = "";
        let isDRC = false;
        if (foundDRC) {
            isDRC = true;
            data.push(self.createTraceCurve(foundDRC, data[0].x.length, pert_index, pertname + "_" + project));
            auc = foundDRC.auc ? self.nf(foundDRC.auc) : "";
            ic50 = foundDRC["log2.ic50"];
            if (ic50 && ic50 !== "NA") {
                ic50 = self.nf(ic50);
            }

            if (!self.projectSet.has(project)) {
                const findErrorBars = _.findWhere(self.errorBarsData, {
                    ccle_name: cell_name,
                    culture: culture,
                    dataset: project
                });
                const minDMSO = Math.pow(2, findErrorBars.minDMSO);
                const maxDMSO = Math.pow(2, findErrorBars.maxDMSO);
                const minBORT = Math.pow(2, findErrorBars.minBORT);
                const maxBORT = Math.pow(2, findErrorBars.maxBORT);
                data.push(self.createTraceLine([minX, maxX], [minDMSO, minDMSO], "blue", "DMSO"));
                data.push(self.createTraceLine([minX, maxX], [maxDMSO, maxDMSO], "blue"));
                data.push(self.createTraceLine([minX, maxX], [minBORT, minBORT], "pink", "Bortezomib"));
                data.push(self.createTraceLine([minX, maxX], [maxBORT, maxBORT], "pink"));
                self.projectSet.add(project);
            }
        }
        return {
            isDRC: isDRC,
            auc: auc,
            ic50: ic50
        }
    }

    /**
     *
     * @param viewIndex
     * @param heatMap
     * @param perts
     * @returns {Promise<void>}
     */
    async plot2X(viewIndex, heatMap, perts) {
        const self = this;
        const dataset = heatMap.getProject().getSortedFilteredDataset();
        const rowMetadata = dataset.getRowMetadata();
        const cell_inames = rowMetadata.getByName("cell_iname");
        const ccle_names = rowMetadata.getByName("ccle_name");
        const cultures = rowMetadata.getByName("culture");
        const culture = cultures.getValue(viewIndex);
        const ccle_name = ccle_names.getValue(viewIndex);
        const cell_iname = cell_inames.getValue(viewIndex);

        const columnMetadata = dataset.getColumnMetadata();
        const pert_idoses = columnMetadata.getByName("pert_idose");
        const pert_itimes = columnMetadata.getByName("pert_itime");
        const pert_inameVector = columnMetadata.getByName("pert_iname");
        const projectVector = columnMetadata.getByName("project");
        const ids = columnMetadata.getByName("id");
        const pert_inames = [];
        const traceMap = new morpheus.Map();
        let scoreMin = null;
        let scoreMax = null;
        let minX = null;
        let maxX = null;
        for (let j = 0, ncols = dataset.getColumnCount(); j < ncols; j++) {
            const pert = pert_inameVector.getValue(j);
            const project = projectVector.getValue(j);
            const key = pert + "_" + project;
            let index = pert_inames.indexOf(key);
            if (index < 0) {
                pert_inames.push(key);
                index = pert_inames.indexOf(key);
            }
            let trace = traceMap.get(key);
            if (!trace) {
                trace = this.createTrace(key, index);
                traceMap.set(key, trace)
            }
            let score = dataset.getValue(viewIndex, j);
            score = Math.pow(2, score);
            if (j === 0) {
                scoreMin = score;
                scoreMax = score;
            }
            if (score > scoreMax) {
                scoreMax = score;
            }
            if (score < scoreMin) {
                scoreMin = score;
            }
            let pert_idose = pert_idoses.getValue(j);

            let pert_dose = parseFloat((pert_idose.split(" ")[0].trim())).toFixed(2).trim().toString();

            if (pert_idose.toLowerCase().endsWith("nm")) {//convert to um
                pert_dose = pert_dose / 1000;
                pert_idose = pert_dose.toString() + " uM";
            } else {
                pert_idose = pert_dose + " " + pert_idose.split(" ")[1];
            }
            const pert_itime = pert_itimes.getValue(j);
            const pert_name = pert_inameVector.getValue(j);
            const id = ids.getValue(j);
            let splitter = PR300;
            if (id.includes(PR500P)) {
                splitter = PR500P;
            } else if (id.includes(PR500)) {
                splitter = PR500;
            } else if (id.includes(PR300P)) {
                splitter = PR300P;
            }
            const idfy = id.split(splitter + "_")[1];
            const id_key = idfy.split(":")[0];
            const hoverText = {
                "pert_name" :pert_name,
                "project": project,
                "score": self.nf(score),
                "pert_idose": pert_idose.replace("um", "uM"),
                "pert_itime": pert_itime.replace("H", "").replace("h", "H"),
                "culture": culture,
                "id": id_key
            };
            let xVal = Math.log2(pert_dose);
            if (isFinite(xVal)) {
                if (j === 0) {
                    minX = xVal;
                    maxX = xVal;
                }
                if (xVal > maxX) {
                    maxX = xVal;
                }
                if (xVal < minX) {
                    minX = xVal;
                }
                trace.x.push(xVal);
                trace.y.push(score);
                trace.text.push(hoverText);
                traceMap.set(key, trace);
            }
        }
        const data = [];
        const vals = traceMap.values();
        for (let i = 0; i < vals.length; i++) {
            const trace = vals[i];
            if (trace.x.length > 0) {
                data.push(trace);
            }
        }

        const cell_name = ccle_name.toUpperCase();
        let auc = [];
        let ic50 = [];
        let isDRC = false;
        for await (let pert of perts) {
            const pertname = pert.pertname;
            const project = pert.project;
            const key = pertname + "_" + project;

            const pert_index = pert_inames.indexOf(key);
            const foo = await self.addDRC2Data(data, pertname, pert_index, cell_name, culture, project, minX, maxX);
            if(foo.isDRC){
                const color = self.getColor(pert_index);
                isDRC = true;
                if (!foo.auc) {
                    foo.auc = "N/A";
                }
                if (!foo.ic50) {
                    foo.ic50 = "N/A";
                }
                auc.push({auc: foo.auc, color: color});
                ic50.push({ic50: foo.ic50, color: color});
            }
        }

        const title = {
            hasDRC: isDRC,
            cell_iname: cell_iname.toUpperCase(),
            ccle_name: ccle_name,
            culture: culture ? culture.toUpperCase() : "",
            auc: auc,
            ic50: ic50
        };

        await clue.plot2(data, scoreMin, scoreMax, title);
        self.$card1.removeClass("active");
        self.$card3.removeClass("active");
        self.$card2.addClass("active");

        self.$card1_li.removeClass("active");
        self.$card3_li.removeClass("active");
        self.$card2_li.addClass("active");
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async addHTML() {
        let _this = this;
        this.$tableDiv.find('[data-name="showAll"]').remove();

        let $header = $(
            '<button id="umap-id" type="button" class="btn-send-to-app" disabled>' +
            '<i class="fa fa-align-left"> </i>' +
            '<span>UMap</span>' +
            '</button>  ' +
            '<button id="correlation-id" type="button" class="btn-send-to-app" disabled>' +
            '<i class="fa fa-align-left"> </i>' +
            '<span>Correlation data</span>' +
            '</button>  ' +
            '<button id="selectivity-id" type="button" class="btn-send-to-app" disabled>' +
            '<i class="fa fa-align-left"></i>' +
            '<span>Selectivity data</span>' +
            '</button>  ' +
            '<button id="viability-id" type="button" class="btn-send-to-app" disabled>' +
            '<i class="fa fa-align-left"> </i>' +
            '<span>Viability data</span>' +
            '</button>  ' +
            '<button id="volcano-id" type="button" class="btn-send-to-app" disabled>' +
            '<i class="fa fa-align-left"> </i>' +
            '<span>Biomarker Analysis</span>' +
            '</button>  '
        );

        this.$tableDiv.find('[data-name=buttons]').append("&nbsp;");
        $header.appendTo(this.$tableDiv.find('[data-name=buttons]'));

        let $searchInput = this.$tableDiv.find('[name=searchInput]');
        $searchInput.attr('placeholder', 'Search All Fields').addClass('rep-ubersearch').prependTo(this.$c2);

        // add table filter to facets
        this.filterManager.getFilterManager().preFilter = this.searchResultsTable.getFilter().get(0);
        // add facet filter to table
        this.searchResultsTable.getFilter().add(this.filterManager.getFilterManager().createFilter());

        // table shows items passing table filter and faceted filters
        // facets show items passing table filter and facets, except own facet

        let searchingTable = false;
        this.searchResultsTable.on('showAll', function () {
            _this.filterManager.reset();
        });

        $('#export_button').click(function () {
            _this.searchResultsTable.exportTable();
        });
        this.searchResultsTable.on('filter', function () {
            searchingTable = true;
            // update facets
            _this.filterManager.filter();
            searchingTable = false;
        });

        this.filterManager.on('filter', function () {
            // persist selection
            // update table?
            if (!searchingTable) {
                _this.searchResultsTable.setFilter(_this.searchResultsTable.getFilter());
            }
        });

        this.filterManager.filter();

        this.searchResultsTable.on('selectionChanged', function (e) {
            let selectedRows = e.selectedRows;
            if (selectedRows.length > 0) {
                let selectedItem = _this.searchResultsTable.getItems()[selectedRows[0]];
                if (selectedItem) {
                    _this.dlbclCard(selectedItem).then(function () {
                        console.log("loaded");
                    });
                }
            }
        });
        this.searchResultsTable.on('checkBoxSelectionChanged', function (e) {
            _this.toggleButtons();
        });
        $("#umap-id").on('click', function (e) {
            _this.overlayUMap("morpheus-tab2");
        });
        $("#correlation-id").on('click', function (e) {
            _this.sendToMatrix("morpheus-tab3");
        });
        $("#selectivity-id").on('click', function (e) {
            _this.sendToMatrix("morpheus-tab4");
        });
        $("#viability-id").on('click', function (e) {
            $("#loading").show();
            _this.queryBQ().then(function () {
                $("#loading").hide();
            }).catch(function(){
                $("#loading").hide();
            });
        });
        $("#volcano-id").on('click', function (e) {
            //$("#loading").show();
            // _this.displayVolcano("morpheus-tab8").then(function () {
            //     $("#loading").hide();
            // }).catch(function(){
            //     $("#loading").hide();
            // });

        });
        $("#queryBQBtn").on('click', function (e) {
            e.preventDefault();
            return;
            // const name = $("#queryBQName").val();
            // const description = $("#queryBQDescription").val();
            // if (!name || !description) {
            //     return;
            // }
            // const names = $("#queryBQPertNames").val();
            // const pert_inames = names.split(",");
            // const payload = {
            //     "name": name,
            //     "pert_inames": pert_inames,
            //     "level": "level4",
            //     "description": description
            // }

            // $.ajax(clue.API_URL + "/api/cmap_matrix/brant", {
            //     type: 'POST',
            //     dataType: 'json',
            //     data: payload,
            // }).done(function (r) {
            //     $("#queryBQ").modal("hide");
            //     $('.history-grid').html('');
            //     new clue.History({
            //         $el: $('#history2'),
            //         autoUpdate: true,
            //         module: true,
            //         dataset: null,
            //         search: false,
            //         dataType: "BQ"
            //     });
            //     $('.nav-tabs a[data-link="morpheus-tab5"]').tab('show');
            // }).fail(function (err) {
            //     console.log(err);
            //     $('#errortextrerun').text(JSON.stringify(err));
            //
            // });
        });
        $(window).on('resize orientationchange', function () {

        });

        const params = morpheus.Util.getWindowSearchObject();
        if (params.target) {
            let filter = _this.filterManager.get('Target');
            params.target.forEach(function (v) {
                filter.set.add(v.toUpperCase());
            });
            this.filterManager.filter();
        }
        if (params.q) {
            $searchInput.val(params.q[0]);
            this.searchResultsTable.search(params.q[0]);
            this.searchResultsTable.setSelectedRows([0]);
        }
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async init() {
        await Promise.all[this.addFilters(), this.addTable(), this.addHTML()];
    }

    /**
     *
     * @param item
     */
    async dlbclCard(item) {
        const self = this;
        const results = await clue.DashboardCard(item, self.config);
        $("#c3").html(results.payload);
        $("#c3").css("display", "block");
        //display the previous tab
        const clueTab = $("#tab_census_db").attr('data-clue-tab');
        $('.nav-tabs a[data-clue-id="' + clueTab + '"]').tab('show');
    }
}
