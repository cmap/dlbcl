class Umap {
    constructor(umapArray, dlbclConfig) {
        this.dlbclConfig = dlbclConfig;
        this.colorArray = [
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
        this.previousTraceCount = 0;
        this.umapArray = umapArray;
        this.layout = {
            xaxis: {
                range: [-4, 4],
                zeroline: false,
                title: {
                    text: '<b>UMAP1</b>',
                    font: {
                        family: 'Courier New, monospace',
                        size: 18,
                        color: 'black'
                    }
                }
            },
            yaxis: {
                range: [-10, 10],
                zeroline: false,
                title: {
                    text: '<b>UMAP2</b>',
                    font: {
                        family: 'Courier New, monospace',
                        size: 18,
                        color: 'black'
                    }
                }
            },
            legend: {
                title: {
                    text: '<b>Legend</b>',
                    font: {
                        family: 'Courier New, monospace',
                        size: 18,
                        color: 'black'
                    }
                }
            },
            hovermode: "closest",
        };
        this.config = {
            modeBarButtonsToRemove: ['sendDataToCloud', 'hoverClosestCartesian', 'hoverCompareCartesian'],
            displaylogo: false
        };

        this.dlbclUMap = new Map();
        for (let i = 0; i < this.dlbclConfig.umapDatasets.length; i++) {
            const dataset = this.dlbclConfig.umapDatasets[i];
            this.dlbclUMap.set(dataset.name, this.createTrace(dataset));
        }
        this.repurposing = {
            uid: 'repurposing',
            mode: 'markers',
            type: 'scatter',
            x: [],
            y: [],
            name: "<b>Repurposing</b>",
            marker: {
                size: 5,
                color: '#ff7f0e',
                line: {width: 1},
                opacity: 0.3
            },
            missingColor: "#c0c0c0",
            text: [],
            hovertemplate:
                "<b>Pert name: %{text.name}</b><br>" +
                "<b>Dataset: %{text.dataset}</b><br>" +
                "<b>MoA: %{text.moa}</b><br>" +
                "<extra></extra>"
        };
    }

    createTrace(dataset) {
        return {
            uid: dataset.name.toLowerCase(),
            mode: 'markers',
            type: 'scatter',
            x: [],
            y: [],
            name: "<b>" + dataset.name.toUpperCase() + "</b>",
            marker: {
                size: 14,
                color: dataset.color
            },
            text: [],
            hovertemplate:
                "<b>Pert name: %{text.name}</b><br>" +
                "<b>Dataset: %{text.dataset}</b><br>" +
                "<b>MoA: %{text.moa}</b><br>" +
                "<extra></extra>"
        };
    }
    getTrace(index, pertname) {
        const self = this;
        const colorIndex = index % self.colorArray.length;
        const overlay = {
            x: [],
            y: [],
            name: "<b>" + pertname + "</b>",
            mode: 'markers',
            marker: {color: self.colorArray[colorIndex], size: 14},
            text: [],
            hoverinfo: 'none',
            type: 'scatter',
            hovermode: 'closest',
            hovertemplate:
                "<b>Pert name: %{text.name}</b><br>" +
                "<b>Dataset: %{text.dataset}</b><br>" +
                "<extra></extra>"
        };
        //iterate over a map
        self.dlbclUMap.forEach(function(dlbcl, key) {
            for (let i = 0; i < dlbcl.x.length; i++) {
                const name = dlbcl.text[i].name;
                if (pertname.toUpperCase() === name.toUpperCase()) {
                    overlay.x.push(dlbcl.x[i]);
                    overlay.y.push(dlbcl.y[i]);
                    overlay.text.push(dlbcl.text[i]);
                }
            }
        });


        return overlay;
    }
    async overlayMap(pert_names) {
         const self = this;
         self.build(pert_names);
    }

    static union(setA, setB) {
        let _union = new Set(setA);
        for (let elem of setB) {
            _union.add(elem);
        }
        return _union;
    }

    async build(pert_names) {
        const self = this;
        let lmin = 0;
        let lmax = 0;
        let wmin = 0;
        let wmax = 0;

        self.repurposing.x = [];
        self.repurposing.y = [];
        self.repurposing.text = [];

        //reset the maps here:
        self.dlbclUMap.forEach(function(dlbcl, key) {
            dlbcl.x = [];
            dlbcl.y = [];
            dlbcl.text = [];
        });


        let moaSet = new Set();
        for (let i = 0; i < self.umapArray.length; i++) {
            const csv2jsonElement = self.umapArray[i];
            const y = csv2jsonElement.UMAP2;
            const x = csv2jsonElement.UMAP1;
            if(x > wmax){
                wmax = x;
            }
            if(x < wmin){
                wmin = x;
            }
            if(y > lmax){
                lmax = y;
            }
            if(y < lmin){
                lmin = y;
            }
            const dataset = csv2jsonElement.dataset;
            const text = {
                "moa": csv2jsonElement.moa ?csv2jsonElement.moa : "" ,
                "name": csv2jsonElement.pert_name.toUpperCase() + "-" + csv2jsonElement.dataset.toUpperCase(),
                "dataset" : csv2jsonElement.dataset,
                "x": x,
                "y": y
            };

            if (csv2jsonElement.moa) {
                let moas = csv2jsonElement.moa.split(",");
                moas = moas.map(i => i.trim().toUpperCase());
                const mySet2 = new Set(moas);
                moaSet = Umap.union(moaSet, mySet2);
            }
            if (dataset.toLowerCase() === "rep") {
                self.repurposing.x.push(x);
                self.repurposing.y.push(y);
                self.repurposing.text.push(text);
            }
            else {
                const dlbcl = self.dlbclUMap.get(dataset.toLowerCase());
                if (dlbcl) {
                    dlbcl.x.push(x);
                    dlbcl.y.push(y);
                    dlbcl.text.push(text);
                }
            }
        }
        self.layout.xaxis.range = [wmin-1,wmax+1];
        self.layout.yaxis.range = [lmin-1,lmax+1];
        const data = [self.repurposing];

        self.dlbclUMap.forEach(function(dlbcl, key) {
            data.push(dlbcl);
        });

        if(pert_names && (pert_names.length > 0)) {

            for (let i = 0; i < pert_names.length; i++) {
                data.push(self.getTrace(i, pert_names[i].toUpperCase()));
            }
        }
        Plotly.newPlot('umap_output', {
            data: data,
            layout: self.layout,
            config: self.config
        });
    }

}






