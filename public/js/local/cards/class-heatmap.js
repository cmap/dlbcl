//classVisHeatmap("CP_AURORA_KINASE_INHIBITOR"); // REPLACE WITH DYNAMIC ID

function classVisHeatmap(grpID,version) {
    var url;
    if(version && version==='1') {
        url = 'https://s3.amazonaws.com/data.clue.io/tsv2/class-card-visualization/connectivity_SUMMLY_n482x482.gct';
    }
    else {
        url = 'https://s3.amazonaws.com/data.clue.io/tsv1.1/class-card-visualization/connectivity_SUMMLY_n930x930.gct';
    }

    $("#class-heatmap-info").empty();
    $("#class-heatmap-vis").empty();
    var promise = morpheus.DatasetUtil.read(url);
    //s3.amazonaws.com/data.clue.io/baseline_gex_figures/
    
    promise.then(function(dataset) {
        // First, comb the metadata for the ID that is equal to the grpID and return indices
        var metadata = dataset.getRowMetadata(),
            pcl_ids = metadata.getByName("pcl_id"),
            pcl_id_idx = [];

        for (i = 0; i < pcl_ids.array.length; i++) {
            if (pcl_ids.array[i].indexOf(grpID) > -1) {
                pcl_id_idx.push(i);
            }
        }
        
        // Next, get the data itself (z: a vector of vectors, x/y: a list) for only those indices in pcl_id_idx
        var array2d = [],
            cplist = [];
        for (var i = 0; i < pcl_id_idx.length; i++) {
            var array = [];
            for (var j = 0; j < pcl_id_idx.length; j++) {
                array.push(dataset.getValue(pcl_id_idx[i],pcl_id_idx[j]));
            }
            array2d.push(array);
            cplist.push(metadata.getByName("pert_iname").getValue(pcl_id_idx[i]));
        }
        
        plotHeatmap(array2d, cplist);
    });
};

function plotHeatmap(d, cp) {

    var cpLength = cp.length;

    var margin = { top: 25, right: 0, bottom: 50, left: 110 },
        width = 288 - margin.left - margin.right,
        height = 288 - margin.top - margin.bottom,
        gridX = Math.floor(width / d.length),
        gridY = 12,
        colors = ["#08519C", "#3182BD", "#6BAED6", "#9ECAE1", "#C6DBEF", "#FCBBA1", "#FC9272", "#FB6A4A", "#DE2D26", "#A50F15"],
        buckets = colors.length,
        legendElementWidth = 10,
        legendText = ["-100", "0", "100"];
    
    var colorScale = d3.scale.quantile()
        .domain([-100, buckets-1, 100])
        .range(colors);
    
    var svg = d3.select("#class-heatmap-vis").append("svg")
        .attr("width", 288)
        .attr("height", margin.top + margin.bottom + gridY * d.length)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var yLabels = svg.selectAll(".yLabel")
        .data(cp)
        .enter().append("text")
        .text(function (d, i) { return d + " " + (i+1); })
        .attr("x", 0)
        .attr("y", function (d, i) { return i * gridY; })
        .style("text-anchor", "end")
        .attr("transform", "translate(-10," + gridY / 1.5 + ")");

    var xLabels = svg.selectAll(".xLabel")
        .data(cp)
        .enter().append("text")
        .text(function(e, i) { return (i==0 || i==d.length-1) ? (i+1) : ""; })
        .attr("x", function(d, i) { return i * gridX; })
        .attr("y", function(d, i) {
            return gridY
        })
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + gridX / 2 + ", -15)");
    
    svg.append("text").text("Members")
        .attr("x", gridX * d.length/2)
        .attr("y", 0)
        .attr("transform", "translate(0, -15)")
        .style("text-anchor", "middle");

    var ellipsis = svg.selectAll(".ellipsis")
        .data(cp)
        .enter().append("text")
        .text(function() { return cpLength < 3 ? "" : "..." })
        .attr("x", gridX * d.length/2)
        .attr("y", gridY)
        .attr("transform", "translate(0, -15)")
        .style("text-anchor", "middle");
    
    for (i = 0; i < d.length; i++) {
        for (j = 0; j < d.length; j++) {
            
            svg.append("rect")
				.attr("x", function() { return i * gridX })
				.attr("y", function() { return j * gridY })
                .attr("class", "connectivity bordered")
                .attr("width", gridX)
                .attr("height", gridY)
                .attr("data-i", i)
                .attr("data-j", j)
                .attr("data-val", d[i][j].toPrecision(3))
                .style("fill", function() { 
                    return colorScale(d[i][j]); 
                })
                .style("stroke", "rgba(200,200,200,0.1)")
                .style("stroke-weight", 0.25)
                .style("cursor", "pointer")
                .on("mouseover", function() {
                
                    var boxXPos = d3.select(this.parentNode.appendChild(this)).attr("x"),
                        boxYPos = d3.select(this.parentNode.appendChild(this)).attr("y"),
                        yNum = +d3.select(this.parentNode.appendChild(this)).attr("data-j") + 1,
                        xNum = +d3.select(this.parentNode.appendChild(this)).attr("data-i") + 1,
                        val = d3.select(this.parentNode.appendChild(this)).attr("data-val");

                    svg.append("rect")
                        .attr("class", "tempguide")
                        .attr("x", 0)
                        .attr("y", boxYPos)
                        .attr("width", gridX * d.length)
                        .attr("height", gridY)
                        .style("fill", "none")
                        .style("stroke", "rgba(200,200,200,1)");
                
                    svg.append("rect")
                        .attr("class", "tempguide")
                        .attr("x", boxXPos)
                        .attr("y", 0)
                        .attr("width", gridX)
                        .attr("height", gridY * d.length)
                        .style("fill", "none")
                        .style("stroke", "rgba(200,200,200,1)");
                
                    d3.select("#class-heatmap-info").html('<p class="item-text">' + yNum + '/' + xNum + ':</p>' + ' <p class="value-text">' + val + '</p>');
                
                })
                .on("mouseout", function(d, i) {
                    d3.selectAll('.tempguide').remove();
                    d3.selectAll('heatmap-hover-text').remove("");
                    d3.select("#class-heatmap-info").html('');
                });
            ;
        }
    }
    
    var legend = svg.selectAll(".legend")
        .data([0].concat(colorScale.quantiles()), function(d) { return d; })
        .enter().append("g")
        .attr("class", "legend");

    legend.append("rect")
        .attr("x", function(d, i) { return 44 + legendElementWidth * i })
        .attr("y", margin.top + gridY * d.length + margin.bottom)
        .attr("transform", "translate(0,-60)")
        .attr("width", legendElementWidth)
        .attr("height", gridY)
        .style("fill", function(d, i) { return colors[i]; });
    
    svg.append("text").text("-100")
        .attr("x", 30)
        .attr("y", margin.top + gridY * d.length + margin.bottom)
        .attr("transform", "translate(0,-50)")
        .style("text-anchor", "middle");
    
    svg.append("text").text("100")
        .attr("x", 55 + legendElementWidth * buckets)
        .attr("y", margin.top + gridY * d.length + margin.bottom)
        .attr("transform", "translate(0,-50)")
        .style("text-anchor", "middle");
    
}