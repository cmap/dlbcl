var margin = {left: 30, top: 30, right: 30, bottom: 30},
	width = Math.min(window.innerWidth, 200) - margin.left - margin.right,
	height = Math.min(window.innerWidth, 200) - margin.top - margin.bottom,
	innerRadius = Math.min(width, height) * 0.5,
	outerRadiusLow = innerRadius * 1,
	outerRadiusMid = innerRadius * 1.04,
	outerRadiusHigh = innerRadius * 1.08,
	padding = 0.2;
var outerColor = ["#ffffff", "#000000", "#000000"],
	innerColor = ["#ffaaaa", "#aaaaff"];
var cellLineNames = ["A375", "A549", "HA1E", "HCC515", "HEPG2", "HT29", "MCF7", "PC3", "VCAP"];
var cellIdToIndex = morpheus.VectorUtil.createValueToIndexMap(morpheus.VectorUtil.arrayAsVector(cellLineNames));
// Set up default 9x9 matrix
var matrix = [];
for (var i = 0; i < cellLineNames.length; i++) {
	matrix[i] = [];
	for (var j = 0; j < cellLineNames.length; j++) {
		matrix[i][j] = 1;
	}
}
// OBTAIN DATA
// Set up API to get 2d array data
var pert_id = "";

var dataset;
var tas;
var loc;

function introspectSetup(id, thisloc) {
	loc = thisloc;
	$(loc).empty();
	var promises = [];
	pert_id = id;
	//TODO: Look into caching this
	promises.push($.ajax({
		url: clue.API_URL + '/api/perts/findOne?filter=' + encodeURIComponent(JSON.stringify({
			fields: {cell_tas: true},
			where: {pert_id: pert_id}
		}))
	}).done(function (result) {
		tas = [];
		for (var i = 0, length = cellLineNames.length; i < length; i++) {
			tas.push(0);
		}
		var cellTas = result.cell_tas;
		for (var i = 0, length = cellTas.length; i < length; i++) {
			var index = cellIdToIndex.get(cellTas[i].cell_id);
			if (index !== undefined) {
				tas[index] = cellTas[i].tas;
			}
		}
	}));
	promises.push(morpheus.DatasetUtil.read(clue.API_URL + '/data-api/slice/?name=introspect_unmatched&rquery=pert_id:(' + pert_id + ')&cquery=pert_id:(' + pert_id + ')').then(function (d) {
		dataset = d;
	}));
	//eventually add placeholder image
	//$(loc).append('<img src="//assets.clue.io/clue/public/img/pert-card-image-placeholder.png">');
	const pp = Promise.all(promises);
	pp.then(function () {
		showIntrospectChart();
	}).catch(function(){
        $(loc).append('<img src="//assets.clue.io/clue/public/img/clue-placeholder-comingsoon.png" style="max-width: 100%">');
	});
}
function showIntrospectChart() {
	// Get 2d array data
	// Populate a new array (array2D) with the values from the morpheus matrix, but need to account for cell lines that may not be present
	$(loc).empty();
	var array2d = [];
	for (var i = 0; i < cellLineNames.length; i++) {
		array2d[i] = [];
		for (var j = 0; j < cellLineNames.length; j++) {
			array2d[i][j] = 0;
		}
	}
	var columnCellIdToIndex = morpheus.VectorUtil.createValueToIndexMap(dataset.getColumnMetadata().getByName('cell_id'));
	var rowCellIdToIndex = morpheus.VectorUtil.createValueToIndexMap(dataset.getRowMetadata().getByName('cell_id'));
	for (var i = 0; i < cellLineNames.length; i++) {
		var rowIndex = rowCellIdToIndex.get(cellLineNames[i]);
		if (rowIndex !== undefined) {
			for (var j = 0; j < cellLineNames.length; j++) {
				var columnIndex = columnCellIdToIndex.get(cellLineNames[j]);
				if (columnIndex !== undefined) {
					array2d[i][j] = dataset.getValue(rowIndex, columnIndex);
				}
			}
		}
	}
	for (var i = 0; i < cellLineNames.length; i++) {
		array2d[i][i] = 0;
	}
	// Now create the object that mimics the format of the JSON file previously linked
	var dataObj = {};
	dataObj.pert_id = pert_id;
	//dataObj.pert_iname = ???;
	dataObj.data_raw = array2d;
	dataObj.tas = tas;
	/* ------------------------------------ */
	// Weight the data - currently set up for quadratic and quartic weighting
	dataObj = weightedLinearCutoff(dataObj);
	// Create visual
	introspectVisualize(dataObj);
	function introspectVisualize(datum) {
		var dataWeighted = datum.data_weighted,
			tas = datum.tas;
		var chord = customChordLayout()
			.padding(padding)
			.sortChords(d3.descending)
			.matrix(matrix);
		var arc = d3.svg.arc()
			.innerRadius(innerRadius*1.01)
			.outerRadius(function(d, i) {
				return tas[i] < 0 ? outerRadiusLow : tas[i] > 0.5 ? outerRadiusHigh : outerRadiusMid
			})
			.startAngle(function(d, i) {
				return 0 + i*2*Math.PI/9 - padding/4
			})
			.endAngle(function(d, i) {
				return 2*Math.PI/9 + i*2*Math.PI/9 - padding;
			})
		var path = d3.svg.chord()
			.radius(innerRadius);
		var svg = d3.select(loc).append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + (width/2 + margin.left) + "," + (height/2 + margin.top) + ")");
		// Draw outer arcs
		var outerArcs = svg.selectAll("g.group")
			.data(chord.groups)
			.enter().append("g")
			.attr("class", "group")
			.on("mouseover", fade(0))
			.on("mouseout", fade(1));
		outerArcs.append("path")
			.style("fill", function(d, i) {
				return tas[i] < 0 ? outerColor[0] : tas[i] > 0.5 ? outerColor[2] : outerColor[1]
			})
			.style("stroke", "none")
			.attr("d", arc)
			.each(function(d,i) {
			// code courtesy of Nadieh Bremer - http://www.visualcinnamon.com/2016/06/orientation-gradient-d3-chord-diagram.html
			var firstArcSection = /(^.+?)L/;
			var newArc = firstArcSection.exec(d3.select(this).attr("d"))[1];
			newArc = newArc.replace(/,/g, " ");
			if (d.endAngle > 90 * Math.PI / 180 & d.startAngle < 270 * Math.PI / 180) {
				var startLoc = /M(.*?)A/,
					middleLoc = /A(.*?)0 0 1/,
					endLoc = /0 0 1 (.*?)$/;
				var newStart = endLoc.exec(newArc)[1];
				var newEnd = startLoc.exec(newArc)[1];
				var middleSec = middleLoc.exec(newArc)[1];
				newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
			}
		//Create a new invisible arc that the text can flow along
		svg.append("path")
			.attr("class", "hiddenArcs")
			.attr("id", "arc" + i)
			.attr("d", newArc)
			.style("fill", "none");
		});
		// Append label names on the outside
		outerArcs.append("text")
			.attr("class", "labels")
			.attr("dy", function(d,i) { return (d.endAngle > 90*Math.PI/180 & d.startAngle < 270*Math.PI/180 ? 16 : -8); })
			.append("textPath")
			.attr("startOffset","50%")
			.style("text-anchor","middle")
			.attr("xlink:href",function(d,i){return "#arc"+i;})
			.attr("fill", function(d, i) {
				return /*tas[i] < 0 ? outerColor[0] :*/ "#000000"
			})
			.text(function(d,i) { return cellLineNames[i]; });
		// Draw inner chords
		svg.selectAll("path.chord")
			.data(chord.chords)
			.enter().append("path")
			.attr("class", "chord")
			.style("fill", function(d) {
				return dataWeighted[d.source.index][d.target.index] > 0 ? innerColor[0] : innerColor[1]
			})
			.style("opacity", function (d) {
				//If the tas score of either the source or target is less than the threshold, set opacity to 0. Otherwise, map the value from 1 to 100 to opacity of 0.2 to 1.
				if (tas[d.source.index] < 0.5 || tas[d.target.index] < 0.5) {
					return 0
				} else {
					return Math.abs(dataWeighted[d.source.index][d.target.index])/100
				}
			})
			.attr("d", path);
		// Fade - returns an event handler for fading a given chord group.
		function fade(toggle) {
			return function(d,i) {
				svg.selectAll("path.chord")
					.filter(function(d) { return d.source.index != i && d.target.index != i; })
					.transition()
					.style("opacity", function(d) {
						if (toggle == 0) {
							return 0
						} else {
							if (tas[d.source.index] < 0.5 || tas[d.target.index] < 0.5) {
								return 0
							} else {
								return Math.abs(dataWeighted[d.source.index][d.target.index])/100
							}
						}
					});
			};
		}
	}

	function weightedLinearCutoff(d) {
		// For diagonals, set equal to 0 (connections with self)
		// For data that is in between -75 and 75, set equal to 0 (weak connections)
		// For 75 to 100, map the data between 1 and 100
		// For -75 to -100, map the data between 1 and 100
		// The reason 75 is used is because we want values at 80 to be the first perceivable values, which will come in at around 0.2 opacity.
		var a1 = [];
		for (var i = 0; i < d.data_raw.length; i++) {
			var a2 = [];
			for (var j = 0; j < d.data_raw.length; j++) {
				if (i == j) { a2.push(0); } // diagonal elements
				else if ((d.data_raw[i][j] > -75) && (d.data_raw[i][j] < 75)) { // hide weak data
					a2.push(0);
				}
				else if (d.data_raw[i][j] >= 0) {
					a2.push(((d.data_raw[i][j] - 75) / (100 - 75)) * (100 - 1) + 1);
				} else {
					a2.push(((d.data_raw[i][j] + 75) / (-100 + 75)) * (-100 - 1) + 1);
				}
			}
			a1.push(a2);
		}
		d.data_weighted = a1;
		return d
	}
}
