function doseChart(selector, iname)
{
	var pert_info = clue.getDosePoints(iname);
	pert_info.done(function(data)
	{
		var data = data.map(function(d, i) {
			var dosesArray = [],
				timesArray = [];
			d.dose_timeline.forEach(function(dose, j) {
				dosesArray.push(dose._id.pert_idose);
				timesArray.push(dose._id.pert_itime);
			})

			return {
				cell_id: d.cell_id,
				pert_idose: dosesArray.filter(function(item, i, ar) { return ar.indexOf(item) === i; }),
				pert_itime: timesArray.filter(function(item, i, ar) { return ar.indexOf(item) === i; })
			}
		});

		// Update doses (100 nM --> 100, 1.11 uM --> 1000, etc.)
		data = updateDoses(data);

		// Get data into arrays which are easier to deal with right now
		[data_cellids, data_doses, data_dosePlus, data_times] = getArrays(data);

		// Visualize data
		visualize(selector, data_cellids, data_doses, data_dosePlus, data_times);
	});
}

function visualize(selector, dc, dd, ddp, dt) {

	$(selector).empty();
	// Set up variables
	var margin = { top: 15, right: 35, bottom: 24, left: 0 },
		width = 300 - margin.left - margin.right,
		height = 100 - margin.top - margin.bottom;
	var svg = d3.select(selector).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	var line = d3.svg.line()
		.x(function(d, i) { return d.x })
		.y(function(d, i) { return d.y })
		.interpolate("linear");
		
	var doseNum = 7,
		cellNum = 9,
		rectW = width/doseNum-10,
		rectH = 22,
		yOffset = 50,
		cellids = ["A375", "A549", "HA1E", "HCC515", "HEPG2", "HT29", "MCF7", "PC3", "VCAP"],
		doses = [10000, 2500, 1000, 500, 100, 20],
		gridSize = Math.floor(width / cellids.length);
		
		var colors = ["#f2f2f2", "#bcbcbb"];

	// X axis labels
	var xLabels = svg.selectAll(".xLabel")
		.data(cellids)
		.enter().append("g")
		.attr("transform", function(d, i) {return "translate(" + i * gridSize + "," + height + ")";});
	xLabels.append("text")
		.text(function(d) { return d; })
		.attr("text-anchor","end")
		.style("letter-spacing", 0.5)
		.attr("transform", function(d, i) {return "translate(20,-18) rotate(-90)";})
		.attr("class", "label xLabel");

	// Y axis labels
	svg.append("text")
		.text("10\u03BCM")
		.attr("x", width)
		.attr("y", 6)
		.style("text-anchor", "start")
		.style("letter-spacing", 0.5)
		.attr("class", "label yLabel")
		.attr("transform", "translate(2, 0)");
	svg.append("text")
		.text("20nM")
		.attr("x", width)
		.attr("y", 58)
		.style("text-anchor", "start")
		.style("letter-spacing", 0.5)
		.attr("class", "label yLabel")
		.attr("transform", "translate(2, -20)");
		
	// Y axis triangle
	var tripts = [{x: 0, y: 0 }, {x: 7, y: 0 }, {x: 0, y: 16}, {x: 0, y: 0}];
	var tripath = svg.append("path")
		.attr("d", line(tripts))
		.attr("fill", "#ffffff")
		.attr("stroke", "#000000")
		.attr("stroke-width", 0.5)
		.attr("transform", "translate(270, 11)");

	// Rectangles - canonical doses
	for (j in cellids) {
		for (k in doses) {
			svg.append("rect")
				.attr("x", function() { return j * gridSize })
				.attr("y", function() { return k * 6 })
				.attr("width", gridSize)
				.attr("height", 6)
				.attr("class", "rect bordered")
				.style("fill", function() {
					if (dc.indexOf(cellids[j]) > -1) {
						var idx = dc.indexOf(cellids[j]);
						if (dd[idx].indexOf(doses[k]) > -1) {
							return colors[1]
						} else {
							return colors[0]
						}
					} else {
						return colors[0]
					}
				});
		}
	}
	
	//Rectangles - beyond canonical doses
	svg.selectAll(".foo")
		.data(cellids).enter()
		.append("rect")
		.attr("x", function(d, i) { return i * gridSize })
		.attr("y", 0)
		.attr("width", gridSize)
		.attr("height", 6)
		.attr("class", "rect bordered")
		.attr("transform", "translate(0, -6)")
		.style("fill", function(d, i) {
			var idx = dc.indexOf(d);
			return (ddp[idx] == true) ? colors[1] : "#ffffff" ;
		});

}

function updateDoses(data) {
	
	var value,
		unit;
	
	data.forEach(function(d) {
		d.pert_idose.forEach(function(dose, idx, arr) {

			[value, unit] = dose.split(" ");

			// For consistency, convert all micro to nano (+ micro symbol difficult to work with)
			if (unit !=  "nM") { value *= 1000; }
			
			// Round to canonical doses: 20 nM, 100 nM, 500 nM, 1 uM, 2.5 uM, 10 uM
			if (value < 60) { arr[idx] = 20; }
			else if (value < 300) { arr[idx] = 100; }
			else if (value < 750) { arr[idx] = 500; }
			else if (value < 1250) { arr[idx] = 1000; }
			else if (value < 6250) { arr[idx] = 2500; }
			else if (value <= 10000) { arr[idx] = 10000; }
			else { arr[idx] = value; }
			
		});
	});
	return data
}

function getArrays(data) {
	
	// Return arrays for the following things:
	// 1. All main cell ids present
	// 2. An array of arrays for doses, indices linked to main cells
	// 3. An array of true/false if any doses are greater than 10 uM, indices linked to main cells
	// 4. All timepoints, single array, sorted
	
	data.sort(function(a, b) {
		return ((a.cell_id < b.cell_id) ? -1 : ((a.cell_id == b.cell_id) ? 0 : 1));
	});
	
	var data_cellids = [],
		data_doses = [],
		data_dosePlus = [],
		data_times = [];
	
	data.forEach(function(d) {
	
		data_cellids.push(d.cell_id);
		
		data_doses.push(d.pert_idose);
		
		var dosePlus = false;
		d.pert_idose.forEach(function(dose) {
			if (dose > 10000) {
				dosePlus = true;
			}
		})
		data_dosePlus.push(dosePlus);
		
		d.pert_itime.forEach(function(t) {
			if (data_times.indexOf(t) == -1) {
				data_times.push(t);
			}
		});
		
	});
	
	return [data_cellids, data_doses, data_dosePlus, data_times]
}