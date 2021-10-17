class Plot1 {
    constructor(data, title) {
        this.nf = morpheus.Util.createNumberFormat('.2f');
        this.data = data;
        this.title = title;
        this.sortedData = null;
        this.YDomainy = null;
        this.hovertext = [];
        this.trace = null;
        this.plotly_data = [];
        this.layout = null;
        this.config = {
            modeBarButtonsToRemove: ['sendDataToCloud', 'hoverClosestCartesian', 'hoverCompareCartesian'],
            displaylogo: false
        };
    }

    async build() {
        $('.plot1-visual').html('');

        this.sortedData = this.data.sort(function (a, b) {
            const a_pert_time = parseInt(a.pert_time);
            const b_pert_time = parseInt(b.pert_time);

            const a_pert_dose = parseFloat(a.pert_dose);
            const b_pert_dose = parseFloat(b.pert_dose);

            if (a_pert_time - b_pert_time === 0) {
                return (a_pert_dose - b_pert_dose);
            } else {
                return (a_pert_time - b_pert_time);
            }
        });
        this.YDomainy = _.uniq(this.sortedData, function (x) {
            return x.y_label;
        });
        this.YDomain = _.pluck(this.YDomainy, 'y_label');
        const tickvals = [];
        for (let j = 0; j < this.YDomain.length; j++) {
            tickvals.push(j);
        }
        const y = [];
        const x = [];
        for (let i = 0; i < this.sortedData.length; i++) {
            const d = this.data[i];
            const labely = d.y_label;
            const index = this.YDomain.indexOf(labely);
            y.push(index);
            x.push(d.score);
            const tooltipText = {
                score: this.nf(d.score),
                ccle_name: d.title.toUpperCase(),
                culture: d.culture ? d.culture.toUpperCase() : ""
            };
            this.hovertext.push(tooltipText);
        }

        this.trace = {
            x: x,
            y: y,
            name: "<b>All cell lines</b>",
            mode: 'markers',
            marker: {color: '#7b3294', size: 10},
            text: this.hovertext,
            hoverinfo: 'none',
            type: 'scatter',
            hovermode: 'closest',
            hovertemplate:
            //"<b>ID: %{text.id}</b><br>" +
                "<b>Score: %{text.score}</b><br>" +
                "<b>CCLE: %{text.ccle_name}</b><br>" +
                "<b>Culture: %{text.culture}</b><br>" +
                "<extra></extra>"
        };
        this.plotly_data.push(this.trace);
        this.layout = {
            showlegend: false,
            title: {
                text: "<b>" + this.title + "</b>",
                font: {
                    family: 'Courier New, monospace',
                    size: 24,
                    color: '#000000'

                }
            },
            yaxis: {
                tickmode: 'array',
                tickvals: tickvals,
                ticktext: this.YDomain,
                zeroline: false
            },
            xaxis: {
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
            hovermode: "closest"
        };

        this.addEvents();
        return "done";
    }

    addEvents() {
        const self = this;
        Plotly.newPlot('plot1-visual', self.plotly_data, self.layout, self.config);

        $('.plot1-visual').on('plotly_click', function (bar, eventData) {
            self.addSelectedCellline(eventData.points, null);
        });

    }

    stripRelicateName(id) {
        const nid = id.split("|")[0];
        return nid.replace("_X1", "").replace("_X2", "").replace("_X3", "").replace("_X4", "");
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
            for (let i = 0; i < self.trace.x.length; i++) {

                if (cell_iname_lineage === (self.trace.text[i].ccle_name + "-" + self.trace.text[i].culture)) {
                    overlay.x.push(self.trace.x[i]);
                    overlay.y.push(self.trace.y[i]);
                    overlay.text.push(self.trace.text[i]);
                }
            }
        } else {
            points.forEach(function (pt) {
                for (let i = 0; i < self.trace.x.length; i++) {
                    const text = self.trace.text[pt.pointNumber];
                    if (text.cell_iname === self.trace.text[i].ccle_iname) {
                        overlay.x.push(self.trace.x[i]);
                        overlay.y.push(self.trace.y[i]);
                        overlay.text.push(self.trace.text[i]);
                        overlay.name =  "<b>" + self.trace.text[i].ccle_name + "-" + self.trace.text[i].culture + "</b>";
                    }
                }
            });
        }

        try {
            Plotly.deleteTraces('plot1-visual', 1);
        } catch (e) {

        }
        Plotly.addTraces('plot1-visual', overlay);
        const layout_update = {
            showlegend: true, // updates the title
        };

        Plotly.update('plot1-visual', null, layout_update);
    }
}
