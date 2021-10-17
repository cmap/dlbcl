    tsnePlot = function ($tsneEl) {

    //TODO: Refactor and move to common function so TAS and listmaker can use it
        ListMakerFactory.createInstances(clue.API_URL, function (err, data) {
            var collectionNames = [];
            var tagNames = [];
            if (err) {
                return next(err);
            }
            var collectionNames = [];
            var tagNames = [];

            async.parallel([
                function (callback) {
                    var setOfNames = new Set();
                    //TODO: refactor
                    async.forEachOf(data, function (datum, index, cb) {
                            var collection = datum.collection;

                            if (!setOfNames.has(collection)) {
                                setOfNames.add(collection);
                                var collectionJSON = {
                                    "id": collection,
                                    "text": collection
                                };
                                collectionNames.push(collectionJSON);
                            }
                            return cb();
                        },
                        function (err) {
                            if (err) {
                                return callback(err);
                            }
                            return callback();
                        });
                },
                function (callback) {
                    var setOfTags = new Set();
                    async.forEachOf(data, function (datum, index, cb) {
                            var tags = datum.tags;
                            if (tags && tags.length > 0) {
                                for (var tag of tags) {
                                    if (!setOfTags.has(tag)) {
                                        setOfTags.add(tag);
                                        var tagsJSON = {
                                            "id": tag,
                                            "text": tag
                                        };
                                        tagNames.push(tagsJSON);
                                    }
                                }
                            }
                            return cb();
                        },
                        function (err) {
                            if (err) {
                                return callback(err);
                            }
                            return callback();
                        });
                }
            ], function (err, results) {

                var $tsneVisual = $tsneEl.find('.tsne-visual'),
                    url = $tsneVisual.data('location');

                clue.txtZipFileFromS3(url, function (err, data) {
                    if (err) {
                        console.log("Unable to load data from S3.");
                        console.log("Error: " + err);
                    }


                    // Define data by filtering down the main object array into only the things needed here
                    var objArray = [];
                    data.forEach(function (d) {
                        // use pert_idose instead? must parse it though
                        var obj = _.pick(d, 'TS1', 'TS2', 'cell_id', 'pert_dose', 'pert_time', 'distil_tas', 'pert_type', 'brew_prefix', 'rid', 'pert_iname');
                        objArray.push(obj);
                    });
                    objArray.forEach(function (d) {
                        d.pert_dose = +d.pert_dose;
                        d.pert_time = +d.pert_time;
                        d.distil_tas = +d.distil_tas;
                    });

                    // Define variables / setup
                    var margin = {top: 10, right: 20, bottom: 20, left: 30},
                        width = 400 - margin.left - margin.right,
                        height = 400 - margin.top - margin.bottom;

                    var x = d3.scaleLinear().range([0, width]),
                        y = d3.scaleLinear().range([height, 0]),
                        color = d3.scaleOrdinal()
                            .range(['#1f77b4', '#ff7f0e', '#2ca02c',
                                '#d62728', '#9467bd', '#8c564b',
                                '#e377c2', '#7f7f7f', '#bcbd22',
                                '#17becf', '#D03656', '#98e3ff',
                                '#B52A6F', '#F29C62', '#584C81',
                                '#8DC63F', '#E55D5C', '#FFF200',
                                '#0072BC', '#7C899E', '#F49AC1']);

                    var xAxis = d3.axisBottom(x),
                        yAxis = d3.axisLeft(y);

                    var svg = d3.select($tsneEl.find('.tsne-visual').get(0)).append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    var clip = svg.append("defs").append("svg:clipPath")
                        .attr("id", "clip")
                        .append("svg:rect")
                        .attr("width", width)
                        .attr("height", height)
                        .attr("x", 0)
                        .attr("y", 0);

                    var background = svg.append("rect")
                        .attr("class", "bg")
                        .attr("width", width)
                        .attr("height", height)
                        .style("opacity", 0);

                    // Tooltip
                    var tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0);

                    var eColor = $($tsneEl.find('.tsne-select-color').get(0)).val(),
                        eSize = $($tsneEl.find('.tsne-select-size').get(0)).val();

                    // Lasso functions to execute while lassoing
                    var lasso_start = function() {
                        lasso.items()
                            .style("stroke", null)
                            .classed({"not_possible": true, "selected": false});
                    };

                    var lasso_draw = function() {
                        var pNodes = d3.selectAll($tsneEl.find('.dot'))
                            .filter(function(d) { return d.possible === true });
                        pNodes._groups[0].forEach(function(d) {
                            d.classList.add("possible");
                            d.classList.remove("not_possible");
                        });
                        var nNodes = d3.selectAll($tsneEl.find('.dot'))
                            .filter(function(d) { return d.possible === false });
                        nNodes._groups[0].forEach(function(d) {
                            d.classList.add("not_possible");
                            d.classList.remove("possible");
                        });
                    };

                    var lasso_end = function() {
                        var pNodes = d3.selectAll($tsneEl.find('.dot'))
                            .filter(function(d) { return d.selected === true });
                        pNodes._groups[0].forEach(function(d) {
                            d.classList.add("possible");
                            d.classList.remove("not_possible");
                        });
                        var nNodes = d3.selectAll($tsneEl.find('.dot'))
                            .filter(function(d) { return d.selected === false });
                        nNodes._groups[0].forEach(function(d) {
                            d.classList.remove("possible");
                            d.classList.remove("not_possible");
                        });
                        var selectedItems = d3.selectAll($tsneEl.find('.dot'))
                            .filter(function(d) {return d.selected===true})._groups[0];
                        var selectedArray = _.pluck(selectedItems, "__data__");
                        updateListBtns(selectedArray);
                    };

                    // Define the lasso
                    var lasso = d3.lasso()
                        .closePathDistance(1000) // max distance for the lasso loop to be closed
                        .closePathSelect(true) // can items be selected by closing the path?
                        .hoverSelect(false) // can items by selected by hovering over them?
                        .area(background) // area where the lasso can be started
                        .on("start", lasso_start) // lasso start function
                        .on("draw", lasso_draw) // lasso draw function
                        .on("end", lasso_end); // lasso end function

                    x.domain([-60, 60]);
                    y.domain([-60, 60]);

                    var scatter = svg.append("g")
                        .attr("id", "scatterplot")
                        .attr("clip-path", "url(#clip)");

                    // AXES
                    svg.append("g")
                        .attr("class", "x axis")
                        .attr('id', "axis--x")
                        .attr("transform", "translate(0," + height + ")")
                        .call(xAxis);
                    svg.append("text")
                        .attr("class", "label")
                        .attr("x", width)
                        .attr("y", -6 + height)
                        .style("text-anchor", "end")
                        .text("t-SNE 1");
                    svg.append("g")
                        .attr("class", "y axis")
                        .attr('id', "axis--y")
                        .call(yAxis);
                    svg.append("text")
                        .attr("class", "label")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 6)
                        .attr("dy", ".71em")
                        .style("text-anchor", "end")
                        .text("t-SNE 2");

                    //console.log("h");

                    // If field is not in objArray or the array if empty, disable that thing in the dropdown
                    updateDropdowns(objArray, $tsneEl);

                    //console.log("i");

                    // Initial plot
                    plotTsne(objArray, eColor, eSize, $tsneEl);
                    plotTsneLegend(objArray, eColor, eSize, $tsneEl);

                    //console.log("j");

                    $tsneEl.find('.tsne-loading').fadeOut('slow', function () {
                        //console.log("k");
                        $tsneEl.find('.tsne-output').fadeIn('slow');
                    });

                    var brush,
                        idleTimeout,
                        idleDelay = 350;

                    var q = scatter.append("g")
                        .attr("class", "brush");

                    d3.select($tsneEl.find('.bg').get(0)).on("click", resetPlot);

                    lasso.items(d3.selectAll($tsneEl.find('.dot')));
                    lasso(svg._groups);

                    $($tsneEl.find('.tsne-reset').get(0)).on("click", function() {
                        x.domain([-60, 60]);
                        y.domain([-60, 60]);
                        zoom();
                    });

                    $($tsneEl.find('.tsne-dropdowns').get(0)).change(function(e) {
                        reorganizePlot(objArray, $tsneEl);
                    });

                    // Toggle between zoom and select buttons
                    $($tsneEl.find('.zoomVsSelect').get(0)).change(function() {

                        //var e = $($tsneEl.find('input[name=zvs]:checked').get(0)).val();
                        var e = $($tsneEl.find('input[type=radio]:checked').get(0)).val();

                        if (e == "Zoom") {
                            //d3.selectAll(".brush").style("display", "initial");
                            //d3.selectAll($tsneEl.find('.brush')).style("display", "initial");
                            scatter.selectAll(".brush").style("display", "initial");
                            brush = d3.brush().extent([[0, 0], [width, height]]).on("end", brushend);
                            q.call(brush);
                        } else {
                            //d3.selectAll(".brush").style("display", "none");
                            //d3.selectAll($tsneEl.find('.brush')).style("display", "none");
                            scatter.selectAll(".brush").style("display", "none");
                            d3.select($tsneEl.find('.bg').get(0)).on("click", resetPlot);
                        }

                        /*
                        if (e == "Zoom") {
                            //d3.selectAll(".brush").style("display", "initial");
                            d3.selectAll($tsneEl.find('.brush').get(0)).style("display", "initial");
                            brush = d3.brush().extent([[0, 0], [width, height]]).on("end", brushend);
                            q.call(brush);
                        } else {
                            d3.selectAll($tsneEl.find('.brush').get(0)).style("display", "none");
                            d3.select($tsneEl.find('.bg').get(0)).on("click", resetPlot);
                        } */
                    });

                    function brushend() {
                        var s = d3.event.selection;
                        if (!s) {
                            //
                        } else {
                            // Zoom in
                            x.domain([s[0][0], s[1][0]].map(x.invert, x));
                            y.domain([s[1][1], s[0][1]].map(y.invert, y));
                            scatter.select(".brush").call(brush.move, null);
                        }
                        zoom();
                    }

                    function handleMouseover(d, i) {
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .95);
                        tooltip.html(d.pert_iname + "<br>" +
                            d.cell_id + " &#8226; " + d.pert_dose + " &#8226; " + d.pert_time + "<br>" +
                            "TAS: " + d.distil_tas + "<br>" +
                            d.pert_type + " &#8226; " + d.brew_prefix)
                            .style("left", (d3.event.pageX + 2) + "px")
                            .style("top", (d3.event.pageY - 35) + "px");
                    }

                    function handleMouseout(d, i) {
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    }

                    function plotTsne(data, a, b, $tsneEl, selection) {

                        var bVal = _.without(_.uniq(_.pluck(data, b)), "");

                        var state = scatter.selectAll('.dot').data(data);
                        state.enter().append("circle")
                            .attr("id", function(d, i) { return "dot_" + i; })
                            .attr("class", function(d) {
                                return (d.pert_type.startsWith('ctl_') || d.pert_type.startsWith('poscon_')) ? "dot control" : "dot";
                                /*
                                if (d.pert_type.startsWith('ctl_') || d.pert_type.startsWith('poscon_')) {
                                    return "dot control"
                                } else {
                                    return "dot"
                                }
                                */
                            })
                            .attr("cx", function(d) { return x(d.TS1); })
                            .attr("cy", function(d) { return y(d.TS2); })
                            .attr("r", function(d) {
                                if (b == 'distil_tas' && d[b] !== "") {
                                    return scaleMap(d[b], 0, 1, 2, 7);
                                } else if (b == 'pert_dose' || b == 'pert_time') {
                                    if (d3.min(bVal) == d3.max(bVal)) {
                                        return 3.5;
                                    } else {
                                        return (d[b] !== "") ? scaleMap(d[b], d3.min(bVal), d3.max(bVal), 2, 7) : 1;
                                        /*
                                        if (d[b] !== "") {
                                            return scaleMap(d[b], d3.min(bVal), d3.max(bVal), 2, 7);
                                        } else {
                                            return 1;
                                        }
                                        */
                                    }
                                } else if (b == "none") {
                                    return 3.5;
                                }
                            })
                            .style("fill", function(d) { return a !== "none" ? color(d[a]) : "black"; })
                            .style("opacity", 0.5)
                            .on("mouseover", handleMouseover)
                            .on("mouseout", handleMouseout);
                        state.transition().duration(250)
                            .style("fill", function(d) { return a !== "none" ? color(d[a]) : "black";  })
                            .attr("r", function(d) {
                                if (b == 'distil_tas' && d[b] !== "") {
                                    return scaleMap(d[b], 0, 1, 2, 7);
                                } else if (b == 'pert_dose' || b == 'pert_time') {
                                    if (d3.min(bVal) == d3.max(bVal)) {
                                        return 3.5;
                                    } else {
                                        return (d[b] !== "") ? scaleMap(d[b], d3.min(bVal), d3.max(bVal), 2, 7) : 1;
                                        /*
                                        if (d[b] !== "") {
                                            return scaleMap(d[b], d3.min(bVal), d3.max(bVal), 2, 7);
                                        } else {
                                            return 1;
                                        }
                                        */
                                    }
                                } else if (b == "none") {
                                    return 3.5;
                                }
                            })
                            .style("opacity", function(d) {
                                if (selection) {
                                    return (d[a] == selection) ? 1 : 0.1;
                                    /*
                                    if (d[a] == selection) return 1;
                                    else return 0.1;
                                    */
                                } else {
                                    return 0.5;
                                }
                            });

                        // console.log('tsneEl' , $tsneEl);
                        //$tsneEl.find('.tsne-loading').hide();
                        //console.log($("#loading-spinner"));
                    }

                    function plotTsneLegend(d, a, b, $tsneEl) {

                        var bVal = _.without(_.uniq(_.pluck(d, b)), "").sort(function(a,b){return a - b});

                        var rawBValues = _.pluck(data, b);
                        //console.log("All " + b + " values:", rawBValues);

                        var intermediateBValues,
                            desiredBValues = [];

                        if (b == "pert_dose") {
                            intermediateBValues = _.uniq(_.pluck(d, b)).sort(function (a, b) { return a - b });
                            intermediateBValues.forEach(function (v) {
                                if (!v) {
                                    desiredBValues.push(0);
                                }
                                else desiredBValues.push(sigFigs(v, 1));
                            });
                            desiredBValues = _.uniq(desiredBValues);
                            //console.log("All desired " + b + " values:", desiredBValues);

                            var doseMin = _.min(_.without(bVal, "0")),
                                doseMax = _.max(_.without(bVal, "0"));
                        } else if (b == "pert_time") {
                            intermediateBValues = _.uniq(_.pluck(d, b)).sort(function (a, b) { return a - b });
                            intermediateBValues.forEach(function (v) {
                                if (!v) {
                                    desiredBValues.push(0);
                                }
                                else desiredBValues.push(v);
                            });
                            desiredBValues = _.uniq(desiredBValues);
                            //console.log("All desired " + b + " values:", desiredBValues);
                        }

                        d3.select($tsneEl.find('.tsne-legend').get(0)).selectAll("svg").remove();

                        var colorData = _.uniq(_.pluck(d, a)),
                            colorheight = 20 * colorData.length,
                            sizeheight = (b == "distil_tas") ? 100 : 20 * desiredBValues.length; //bVal.length;

                        // COLOR LEGEND
                        //var colorlegendsvg = d3.select('.tsne-legend').append("svg")
                        var colorlegendsvg = d3.select($tsneEl.find('.tsne-legend').get(0)).append("svg")
                            .attr("width", 180)
                            .attr("height", colorheight + 30);
                        var colorlegend = colorlegendsvg.selectAll('.legend')
                            .data(colorData)
                            .enter().append("g")
                            .attr("class", "legend");
                        colorlegend.append("circle")
                            .attr("class", "legendCirc")
                            .attr("cx", 10)
                            .attr("cy", function(s, i) { return i * 20 + 30 })
                            .attr("r", 4)
                            .style("fill", function(s, i) { return a == "none" ? "white" : color(s); })
                            .on("click", function(s) {
                                $($tsneEl.find('.legend')).css("opacity", 0.4);
                                $(this).parent().css("opacity", 1);
                                plotTsne(d, a, b, $tsneEl, s);
                            });
                        colorlegend.append("text")
                            .attr("x", 20)
                            .attr("y", function(s, i) { return i * 20 + 34 })
                            .text(function(s) { return a == "none" ? "no color assigned" : s; })
                            .style("font-size", "11px")
                            .on("click", function(s) {
                                $($tsneEl.find('.legend')).css("opacity", 0.4);
                                $(this).parent().css("opacity", 1);
                                plotTsne(d, a, b, $tsneEl, s);
                            });
                        colorlegendsvg.append("text")
                            .attr("x", 2)
                            .attr("y", 10)
                            .text("Color")
                            .style("font-size", "12px");

                        // SIZE LEGEND
                        var sizelegend = d3.select($tsneEl.find('.tsne-legend').get(0)).append("svg")
                            .attr("width", 120)
                            .attr("height", sizeheight + 30)
                            .style("vertical-align", "top");

                        sizelegend.append("g")
                            .attr("class", "legend")
                            .selectAll('circle')
                            .data(function() {
                                //console.log(bVal);
                                if (b == "distil_tas") { return [0.2, 0.4, 0.6, 0.8, 1]; }
                                //else if (b == "pert_dose") { return desiredBValues }
                                //else return bVal;
                                else return desiredBValues
                            })
                            .enter()
                            .append("circle")
                            .attr("cx", 10)
                            .attr("cy", function(s, i) { return i * 20 + 30 })
                            .attr("r", function(s) {
                                if (bVal.length > 1) {
                                    if (b == "distil_tas") {
                                        return scaleMap(s, 0, 1, 2, 7);
                                    } else if (b == "pert_dose") {
                                        return scaleMap(s, doseMin, doseMax, 2, 7);
                                    } else {
                                        return s;
                                    }
                                } else {
                                    return 3.5;
                                }
                            })
                            .style("fill", function(s, i) { return b == "none" ? "white" : "black"; });

                        sizelegend.selectAll('text')
                            .data(function() {
                                if (b == "distil_tas") { return ["0.2", "0.4", "0.6", "0.8", "1"]; }
                                //else if (b == "pert_dose") { return desiredBValues }
                                //else return bVal;
                                else return desiredBValues
                            })
                            .enter()
                            .append("text")
                            .attr("x", 20)
                            .attr("y", function(s, i) { return i * 20 + 34 })
                            .text(function(s) {
                                if (bVal[0] == null) {
                                    return "no size assigned";
                                } else if (b == "pert_dose") {
                                    return (s == 0) ? 0 + " µM" : sigFigs(s, 2) + " µM";
                                } else if (b == "pert_time") {
                                    return s + " hr";
                                } else {
                                    return s;
                                }
                            })
                            .style("font-size", "11px");

                        sizelegend.append("text")
                            .attr("x", 2)
                            .attr("y", 10)
                            .text("Size")
                            .style("font-size", "12px");

                    }

                    function reorganizePlot(objArray, $tsneEl) {
                        // Get all keys for reference
                        //var keys = getKeys(objArray);

                        // Default values for dropdowns
                        //var eColor = $tsneEl.find('.tsne-select-color').val(),
                        //    eSize = $tsneEl.find('.tsne-select-size').val();
                        var eColor = $($tsneEl.find('.tsne-select-color').get(0)).val(),
                            eSize = $($tsneEl.find('.tsne-select-size').get(0)).val();

                        plotTsne(objArray, eColor, eSize, $tsneEl);
                        plotTsneLegend(objArray, eColor, eSize, $tsneEl);

                    }

                    function resetPlot() {
                        svg.selectAll(".dot")
                            .style("opacity", 0.5)
                            .style("stroke", "null");
                        $($tsneEl.find('.legend')).css("opacity", 1);
                    }

                    function updateDropdowns(objArr, $tsneEl) {

                        // If field is not in objArray, disable that thing in the dropdown
                        var elem = $tsneEl.find('.tsne-select-color'), //document.getElementsByClassName('tsne-select-color'),
                            ddArray = [],
                            fields = getKeys(objArr);

                        // Check if field exists
                        for (i = 0; i < elem[0].options.length; i++) {
                            //console.log();
                            ddArray[i] = elem[0].options[i].value;
                        }
                        var diffArr = _.difference(ddArray, fields);
                        diffArr = _.without(diffArr, "none");

                        // From existing fields, check if field is empty
                        /*
                         for (i = 0; i < fields.length; i++) {
                         for (j = 0; j < objArr.length; i++) {
                         //
                         }
                         }
                         */

                        for(i = 0; i < diffArr.length; i++) {
                            $tsneEl.find('.tsne-select-color option[value="'+diffArr[i]+'"]').attr('disabled', 'disabled');
                            $tsneEl.find('.tsne-select-size option[value="'+diffArr[i]+'"]').attr('disabled', 'disabled');
                        }

                        //$(".tsne-select-color option:not([disabled])").first().attr("selected", "selected");
                        //$(".tsne-select-size option:not([disabled])").first().attr("selected", "selected");

                    }

                    function updateListBtns(arr) {

                        var $tsneSelection = $tsneEl.find('.tsne-selection');

                        var sigList = [];
                        if (arr.length > 0) {
                            for (var i = 0; i < arr.length; i++) {
                                //var index = arr[i].pointIndex;
                                //var sig = arr[i].rid[index];
                                var sig = arr[i].rid;
                                sigList.push(sig);
                            }

                            $(".newListButtonTSNE").prop("disabled", false);
                            $(".addToListButtonTSNE").prop("disabled", false);

                            DataProjectView.loadNamesByType("Signature");

                            $("#newList").data("from", "tsne");
                            $("#newList").data("sigs", sigList);

                            $("#addToList").data("from", "tsne");
                            $("#addToList").data("sigs", sigList);

                            var formatData = sigList.join("\n");
                            $("#newData").val(formatData);
                            $("#addToData").val(formatData);

                            $tsneSelection.text(arr.length + " signatures selected");

                        } else {

                            $(".newListButtonTSNE").prop("disabled", true);
                            $(".addToListButtonTSNE").prop("disabled", true);

                            $tsneSelection.text("Select signatures to create or add to a list");

                        }

                    }

                    function zoom() {
                        var t = scatter.transition().duration(750);
                        svg.select("#axis--x").transition(t).call(xAxis);
                        svg.select("#axis--y").transition(t).call(yAxis);
                        scatter.selectAll(".dot").transition(t)
                            .attr("cx", function (d) { return x(d.TS1); })
                            .attr("cy", function (d) { return y(d.TS2); });
                    }


                    // Reformat the data
                    //reformatData(objArray);

                    /*
                    // CHANGE THE COLOR PARAMETER HERE BASED ON DROPDOWN MENU INSTEAD OF HARD CODING IT.
                    // THIS WILL LIKELY DICTATE THE DOMAIN INFO THAT IS PRINTED AFTERWARDS
                    // (SEE console.log(color.domain()); BELOW)
                    scatter.selectAll(".dot")
                        .data(data)
                        .enter().append("circle")
                        .attr("id", function(d, i) { return "dot_" + i; })
                        .attr("class", function(d) {
                            //console.log(d);
                            //ADD IN EXTRA CLASS FOR CONTROLS
                            if (d.pert_type.startsWith('ctl_') || d.pert_type.startsWith('poscon_')) {
                                return "dot control"
                            } else {
                                return "dot"
                            }
                        })
                        .attr("r", 3.5)
                        .attr("cx", function(d) { return x(d.TS1); })
                        .attr("cy", function(d) { return y(d.TS2); })
                        .style("fill", function(d) { return color(d[eColor]); }) //color(d.cell_id);})
                        .style("opacity", 0.5);
                        //.on("mouseover", handleMouseover)
                        //.on("mouseout", handleMouseout);
                        */

                    // LEGEND
                    // drawLegend(data);

                    /*
                    // Update plot
                    updatePlot(objArray, gd, $tsneEl);

                    $tsneEl.find('.tsne-dropdowns').on('change', {$tsneEl: $tsneEl}, function (e) {
                        updatePlot(objArray, gd, e.data.$tsneEl);
                    });
                    */



                    /*
                    $tsneEl.find('.tsne-loading').fadeOut('slow', function () {
                        $tsneEl.find('.tsne-output').fadeIn('slow');
                    });
                    */

                });
            });

        });
    };

    function getKeys(objArray) {
        return Object.keys(objArray[0]);
    }

    function scaleMap(input, inputLow, inputHigh, outputLow, outputHigh) {
        return ((input - inputLow) / (inputHigh - inputLow)) * (outputHigh - outputLow) + outputLow;
    }

    function sigFigs(n, sig) {
        var mult = Math.pow(10, sig - Math.floor(Math.log(n) / Math.LN10) - 1);
        return Math.round(n * mult) / mult;
    }


    //Allows us to use both in browser and in mocha tests
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    _ = require("underscore");
    $ = require('jquery');
    async = require("async");
    morpheus = require("../../../../public/js/lib/morpheus");
    var clue = {
        API_URL: 'foo',
        //tsnePlot: function(){return "foo"}
    };
    module.exports = {
        JQuery: $,
        clue: clue,
        tsnePlot: tsnePlot,
        sigFigs: sigFigs,
        scaleMap: scaleMap,
        getKeys: getKeys
    }
}
else {
}