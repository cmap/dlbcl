//classVisCelllines("CP_AURORA_KINASE_INHIBITOR"); // REPLACE WITH DYNAMIC ID

function classVisCelllines(grpID,version) {
    var url;
    if(version && version==='1') {
        url = "https://s3.amazonaws.com/data.clue.io/tsv2/class-card-visualization/group_stats.txt";
    }
    else {
        url = "https://s3.amazonaws.com/data.clue.io/tsv1.1/class-card-visualization/group_stats.txt";
    }
    Plotly.d3.tsv(url, function(data) {

        var grpData = data.filter(function (d) {
            return d.group_id == grpID
        });

        var med = [],
            iqrlo = [],
            iqrhi = [];

        // These are in a particular order: SUMMLY, A375, A549, HA1E, HCC515, HEPG2, HT29, MCF7,PC3, VCAP
        for (var i in grpData) {
            med.push(grpData[i].group_median_ps);
            iqrlo.push(grpData[i].group_q25_ps);
            iqrhi.push(grpData[i].group_q75_ps);
        }

        // Account for NaNs
        for (var i = 0; i < med.length; i++) {
            if (med[i] == "NaN") { med[i] = 0; }
            if (iqrlo[i] == "NaN") { iqrlo[i] = 0; }
            if (iqrhi[i] == "NaN") { iqrhi[i] = 0; }
        }

        plotRadar(med, iqrlo, iqrhi);

    });
}

function plotRadar(med, iqrlo, iqrhi) {

    var myPlot = document.getElementById('class-celllines-vis'),
        hoverInfo = document.getElementById('class-celllines-info');

    var trace1 = {
        x: ["summary", "A375", "A549", "HA1E", "HCC515", "HEPG2", "HT29", "MCF7", "PC3", "VCAP"],
        y: iqrlo,
        line: {width: 0},
        marker: {color: "000000"},
        mode: "lines",
        name: "Q25",
        type: "scatter",
        hoverinfo: 'none'
    };

    var trace2 = {
        x: ["summary", "A375", "A549", "HA1E", "HCC515", "HEPG2", "HT29", "MCF7", "PC3", "VCAP"],
        y: med,
        fill: "tonexty",
        fillcolor: "rgba(0,93,153,0.4)",
        line: {
            color: "rgb(0,0,0)",
            width: 2
        },
        mode: "lines",
        name: "Median",
        type: "scatter",
        hoverinfo: 'none'
    };

    var trace3 = {
        x: ["summary", "A375", "A549", "HA1E", "HCC515", "HEPG2", "HT29", "MCF7", "PC3", "VCAP"],
        y: iqrhi,
        fill: "tonexty",
        fillcolor: "rgba(0,93,153,0.4)",
        line: {width: 0},
        marker: {color: "444"},
        mode: "lines",
        name: "Q75",
        type: "scatter",
        hoverinfo: 'none'
    }

    var data = [trace1, trace2, trace3];

    var layout = {
        font: {
            family: 'Roboto Condensed',
            size: 11
        },
        width: 288,
        height: 200,
        showlegend: false,
        xaxis: {
            range: [-0.1, 9.1],
            tickangle: -90,
            fixedrange: true,
            //showgrid: false
        },
        yaxis: {
            //tickmode: 'linear',
            //tick0: -100,
            //dtick: 50,
            gridwidth: 1,
            tickvals: [-100, -80, 0, 80, 100],
            range: [-102, 102],
            fixedrange: true,
            gridcolor: 'rgba(0,0,0,0.2)',
            zeroline: false
        },
        margin: {
            l: 30,
            r: 10,
            b: 55,
            t: 10,
            pad: 5
        },
        paper_bgcolor: "rgba(255, 255, 255, 0)",
        plot_bgcolor: "rgba(0,0,0,0)"
    };

    Plotly.newPlot('class-celllines-vis', data, layout, {displayModeBar: false});

    myPlot.on('plotly_hover', function(data) {

        var infoText = data.points.map(function(d) {
            return ('<p class="item-text">' + d.data.name + '</p>: &nbsp;<p class="value-text">' + d.y.toPrecision(3) + '</p>');
        });
        var celllineText = data.points.map(function(d) {
            return ('<p class="value-text">' + d.x + '</p>');
        });

        hoverInfo.innerHTML = infoText.join('&nbsp;&nbsp;&nbsp;&nbsp;');

        var celllineNameDiv = document.getElementById('class-celllines-name');

        celllineNameDiv.innerHTML = celllineText[0];


    }).on('plotly_unhover', function(data) {

        hoverInfo.innerHTML = '';
        var celllineNameDiv = document.getElementById('class-celllines-name');
        celllineNameDiv.innerHTML = '';

    });
}