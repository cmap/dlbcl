//classVisSummary("CP_AURORA_KINASE_INHIBITOR") // REPLACE WITH DYNAMIC ID
/**
 * This is deprecated
 * @param grpID
 * @param version
 */
function classVisSummary(grpID,version) {
    var url;
    if(version && version==='1') {
        url = "https://s3.amazonaws.com/data.clue.io/tsv2/class-card-visualization/member_stats.txt";
    }
    else {
        url = "https://s3.amazonaws.com/data.clue.io/tsv1.1/class-card-visualization/member_stats.txt";
    }
    Plotly.d3.tsv(url, function(data) {
        var grpData = data.filter(function (d) {
            return (d.group_id == grpID && d.cell_id == "SUMMLY")
        });
        [x] = organizeDataByBox(grpData);
        makeBox(x);
    });
}
function makeBox(x) {
    
	var traces = [];
	
	// Traces
	var boxes = {
        type: 'box',
        x: x,
        boxpoints: 'all',
        jitter: 1,
        pointpos: 0,
        whiskerwidth: 1,
        fillcolor: 'rgba(0,93,153,0.4)',
        marker: {
            color: 'rgba(0,93,153,0.3)',
            size: 6,
            symbol: "circle"
        },
        line: {
            width: 1,
            color: 'rgba(0,0,0,1)'
        },
        hoverinfo: 'none'
    };
    traces.push(boxes);
	
	// Layout
    var layout = {
        font: {
            family: 'Roboto Condensed',
            size: 11
        },
        width: 288,
        height: 60,
        xaxis: {
            range: [-101,101],
            zeroline: false,
            tickvals: [-100, -80, 0, 80, 100],
            gridwidth: 1,
            gridcolor: 'rgba(0,0,0,0.2)',
            fixedrange: true
        },
        yaxis: {
            showticklabels: false,
            fixedrange: true,
            showgrid: true,
            gridwidth: 1,
            gridcolor: 'rgba(0,0,0,0)'
        },
        margin: {
			l: 10,
			r: 10,
			b: 25,
			t: 0,
			pad: 5
		},
        paper_bgcolor: "rgba(255, 255, 255, 0)",
        plot_bgcolor: "rgba(0,0,0,0)"
    };
	var config = {
		modeBarButtonsToRemove: ['sendDataToCloud', 'autoScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian'],
		displaylogo: false
	};
	
    Plotly.newPlot('class-summary-vis', traces, layout, {displayModeBar: false});
}
function organizeDataByBox(d) {
    
    // Example data format:
	// [A]
	// [[1, 2], [3], [4, 5]]

	var x = [];
	
    d.forEach(function(v) {
        x.push(+v.member_ps);
	})

	return [x]
}