class Volcano {
    constructor(data) {
        this.data = data;
        this.config = {
            modeBarButtonsToRemove: ['sendDataToCloud', 'hoverClosestCartesian', 'hoverCompareCartesian'],
            displaylogo: false
        };
        this.selectedPertIds = Object.keys(this.data);
    }
    unpack(rows) {
        const self = this;
        const doses = Object.keys(_.groupBy(rows, "dose")).sort(function (a, b) {
                if (a === "log2.auc") {
                    return 200;
                }
                if (a === "log2.ic50") {
                    return 100;
                }
                const doseA = parseFloat(a.split(" ")[0].trim());
                const doseB = parseFloat(b.split(" ")[0].trim());
                return doseB - doseA;
            }
        );

        const bubbleSizes = self.convertDoseToMarkerSize(doses);
        const x = [];
        const y = [];
        const sizes = [];
        const hoverTexts = [];
        for(let index=0; index < rows.length; index++){
            const row = rows[index];
            const xVal =self.nf(row.coef);
            const yVal = self.nf(-1 * Math.log10(row["p.val"]));
            const dose = row.dose;
            const doseIndex = doses.indexOf(dose);
            const bubbleSize = bubbleSizes[doseIndex];
            const hoverText = {
                coeff: xVal,
                neglog10_P_val: yVal,
                pert_name: row.pert_name,
                pert_mfc_id: row.pert_mfc_id,
                feature: row.feature,
                dose: dose
            };
            x.push(xVal);
            y.push(yVal);
            sizes.push(bubbleSize);
            hoverTexts.push(hoverText);
        }
        return {x: x, y: y, sizes: sizes, hoverTexts: hoverTexts};
    }

    assignOptions(featureTypes, html, index) {
        html.push('<div class="row">');
        html.push("Feature Type: <select class='plot-key' id='plotKey_" + index + "'>");
        for (let i = 0; i < featureTypes.length; i++) {
            const featureType = featureTypes[i];
            html.push("<option>");
            html.push(featureType);
            html.push("</option>");
        }
        html.push('</select>');
        html.push('</div>');

    }

    singleTrace(selectedIndex, featureType) {
        const self = this;
        const selectedPertIDIndex = self.selectedPertIds[selectedIndex];
        const selectedPertIdDataObject = self.data[selectedPertIDIndex];
        const selectedPertId = selectedPertIdDataObject.key;
        const selectedPertIdValue = selectedPertIdDataObject.value;
        const plotly_data = [];
        const featureData = selectedPertIdValue[featureType];
        plotly_data.push(self.getTrace(featureType, featureData, '#AB63FA'));
        const layout = self.getLayout(selectedPertId);
        Plotly.newPlot(selectedPertId, plotly_data, layout, self.config);
    }

    addIDForPlot() {
        const self = this;
        $("#c12").html("");
        const html = [];

        for (let index = 0; index < self.selectedPertIds.length; index++) {
            let selectedPertIDIndex = self.selectedPertIds[index];
            let selectedPertIdDataObject = self.data[selectedPertIDIndex];
            const selectedPertId = selectedPertIdDataObject.key;
            const selectedPertIdValue = selectedPertIdDataObject.value;
            const featureTypes = Object.keys(selectedPertIdValue);

            self.assignOptions(featureTypes, html, index);
            html.push('<div class="row">');
            html.push(
                '<div ' +
                ' id="' + selectedPertId + '" class="col-md-12.col-lg-12.col-sm-12.col-xs-12.c12"></div>');
            html.push('</div>');
            html.push('</div>');
        }
        const plotlyWrapper = $(html.join(''));
        $("#c12").append(plotlyWrapper);

        $('.plot-key').on('change', function (event) {
            const featureType = this.value;
            const ID = this.id;
            const index = ID.split("plotKey_")[1];
            self.singleTrace(index, featureType)
        });
        return;
    }

    convertDoseToMarkerSize(doses) {
        const arraySize = doses.length;
        const start = 10, step = 5;
        const end = (arraySize * step) + start;
        return _.range(start, end, step).reverse();
    }


    async build() {
        const self = this;
        $('.c12').html('');
        self.addIDForPlot();
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

        for (let index = 0; index < self.selectedPertIds.length; index++) {
            self.singleTrace(index, "GE");
        }
        return "done";
    }

    getLayout(plotKey) {
        return {
            showlegend: true,
            title: {
                text: '<b>' + plotKey + '</b>',
                font: {
                    family: 'Courier New, monospace',
                    size: 24
                },
                xref: 'paper',
                x: 0.05,
            },
            yaxis: {
                title: {
                    text: '<b>-log10(q-value)</b>',
                    font: {
                        family: 'Courier New, monospace',
                        size: 12,
                        color: '#000000'
                    }
                }
            },
            xaxis: {
                title: {

                    text: "<b>Correlation coefficient</b>",
                    font: {
                        family: 'Courier New, monospace',
                        size: 12,
                        color: '#000000'
                    }
                }
            },
            hovermode: "closest"
        };
    }
    /**
     *
     * @param name
     * @param rows
     * @param color
     * @returns {{mode: string, line: {color: *}, marker: {color: *, size: number}, name: string, x: *, y: *, hoverinfo: string, text: *, type: string, opacity: number, hovermode: string, hovertemplate: string}}
     */
    getTrace(name, rows, color) {
        const self = this;
        const data = self.unpack(rows);
        return {
            name: "<b>" + name + "</b>",
            x: data.x,
            y: data.y,
            type: 'scatter',
            mode:  "markers",
            //opacity : 0.2,
            line: {
                color: color,
            },
            marker: {color: color, size: data.sizes},
            text: data.hoverTexts,
            hoverinfo: 'text',
            hovermode: 'closest',
            hovertemplate:
                "<b>Feature: %{text.feature}</b><br>" +
                "<b>Name: %{text.pert_name}</b><br>" +
                "<b>Dose: %{text.dose}</b><br>" +
                "<b>X: %{text.coeff}</b><br>" +
                "<b>Y: %{text.neglog10_P_val}</b><br>" +
                "<extra></extra>"
        }
    }
}