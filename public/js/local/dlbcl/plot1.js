class Plot1 {
    constructor(data, title) {
        this.overlayCounter = 0;
        this.nf = morpheus.Util.createNumberFormat('.2f');
        this.data = data;
        this.title = title;
        this.sortedData = null;
        this.YDomainy = null;
        this.plotly_data = [];
        this.layout = null;
        this.config = {
            modeBarButtonsToRemove: ['sendDataToCloud', 'hoverClosestCartesian', 'hoverCompareCartesian'],
            displaylogo: false
        };
    }
    unpack(rows, keyx,keyy) {
        const self = this;
        const x = [];
        const y = [];
        const hoverTexts = [];
        const map =  rows.map(function (row) {
            const hoverText = {
                score: self.nf(row.score),
                ccle_name: row.title.toUpperCase(),
                culture: row.culture ? row.culture.toUpperCase() : ""
            };
            x.push(row[keyx]);
            y.push(row[keyy]);
            hoverTexts.push(hoverText);
            return row[keyx];
        });
        return {x: x, y: y, hoverTexts: hoverTexts};
    }
    async build() {
        const self = this;
        $('.plot1-visual').html('');
        const groups = _.groupBy(self.data, function (row) {
            return row.pert_iname + "-" + row.project;
        });
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
        const traceKeys = Object.keys(groups);

        for (let index = 0; index < traceKeys.length; index++) {
            const traceKey = traceKeys[index];
            const dat = groups[traceKey];
            self.plotly_data.push(self.getTrace(traceKey, dat, colorArray[index]));
        }
        self.layout = {
            showlegend: true,
            yaxis: {
                title: {
                    text: "<b>viability_LFC.cb</b>",
                    font: {
                        family: 'Courier New, monospace',
                        size: 18,
                        color: '#000000'
                    }
                },
                zeroline: false
            },
            xaxis: {
                title: {
                    text: "<b>pert_dose</b>",
                    font: {
                        family: 'Courier New, monospace',
                        size: 18,
                        color: '#000000'
                    }
                },
                zeroline: false
            },
            hovermode: "closest"
        };

        self.addEvents();
        return "done";
    }
    getTrace(name, rows, color) {
        const self = this;
        const data = self.unpack(rows,'pert_dose','score');
        return {
            name: "<b>" + name + "</b>",
            type: 'violin',
            x: data.x,
            y: data.y,
            points: 'none',
            box: {
                visible: true
            },
            line: {
                color: color,
            },
            meanline: {
                visible: true
            },
            mode: 'markers',
            marker: {color: '#7b3294', size: 10},
            text: data.hoverTexts,
            hoverinfo: 'none',
            hovermode: 'closest',
            hovertemplate:
            //"<b>ID: %{text.id}</b><br>" +
                "<b>Score: %{text.score}</b><br>" +
                "<b>CCLE: %{text.ccle_name}</b><br>" +
                "<b>Culture: %{text.culture}</b><br>" +
                "<extra></extra>"
        }
    }
    addEvents() {
        const self = this;
        Plotly.newPlot('plot1-visual', self.plotly_data, self.layout, self.config);

        $('.plot1-visual').on('plotly_click', function (bar, eventData) {
            self.addSelectedCellline(eventData.points, null);
        });

    }


    addSelectedCellline(points, cell_iname_lineage) {
        const self = this;
        const overlay = {
            x: [],
            y: [],
            name: "",
            mode: 'markers',
            marker: {color: '#ff7f0e', size: 20},
            text: [],
            hoverinfo: 'none',
            type: 'scatter',
            hovermode: 'closest',
            hovertemplate:
                "<b>Score: %{text.score}</b><br>" +
                "<b>Cell iname: %{text.ccle_name}</b><br>" +
                "<b>Culture: %{text.culture}</b><br>" +
                "<extra></extra>"
        };

        if (cell_iname_lineage) {
             overlay.name =  "<b> " + cell_iname_lineage + "</b>";

            const traces = self.plotly_data;
            for(let index=0; index <traces.length; index++){
                const trace = traces[index];

                for (let i = 0; i < trace.x.length; i++) {
                    if (cell_iname_lineage === (trace.text[i].ccle_name + "-" + trace.text[i].culture)) {
                        overlay.x.push(trace.x[i]);
                        overlay.y.push(trace.y[i]);
                        overlay.text.push(trace.text[i]);
                    }
                }
            }
        } else {
            points.forEach(function (pt) {
                const traces = self.plotly_data;
                for(let index=0; index <traces.length; index++) {
                    const trace = traces[index];
                    for (let i = 0; i < trace.x.length; i++) {
                        const text = trace.text[pt.pointNumber];
                        if (text.cell_iname === trace.text[i].ccle_iname) {
                            overlay.x.push(trace.x[i]);
                            overlay.y.push(trace.y[i]);
                            overlay.text.push(trace.text[i]);
                            overlay.name = "<b>" + trace.text[i].ccle_name + "-" + trace.text[i].culture + "</b>";
                        }
                    }
                }
            });
        }

        try {
            let startDeleteIndex = self.plotly_data.length - 1;
            let endDeleteIndex = startDeleteIndex + self.overlayCounter;
            if(self.overlayCounter > 0){
                for(let index=startDeleteIndex; index < endDeleteIndex;index++){
                    Plotly.deleteTraces('plot1-visual', index);
                    self.overlayCounter--;
                 }
            }
        } catch (e) {
            console.log(e);
        }
        Plotly.addTraces('plot1-visual', overlay);
        ++self.overlayCounter;
        const layout_update = {
            showlegend: true, // updates the title
        };

        Plotly.update('plot1-visual', null, layout_update);
    }
}