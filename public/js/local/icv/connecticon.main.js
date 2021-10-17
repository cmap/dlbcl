clue.Connecticon = function() {
	var _this = this;
	var options = clue.ICV.createOptions();

	options.name = 'Connecticons';
	// options.dataset =
	// '//s3.amazonaws.com/data.clue.io/connecticon/bing_wt_cs/connecticons_pert.gct';
	options.dataset = clue.getGutcResult({
		name : 'Connecticons',
		url : '//s3.amazonaws.com/data.clue.io/connecticon/bing_wt_cs/'
	});

	if (!options.columnAnnotations) {
		options.columnAnnotations = [];
	}
	var queryIdToCells = new morpheus.Map();
	var queries = [];
	var connecticonsArray = [];
	function loadConnecticons() {
		var lines = _this.connecticonLines;
		var header = lines[0].split(tab);
		var id_query = header.indexOf('id_query');
		var pert_id_connection = header.indexOf('pert_id_connection');
		var expected_direction = header.indexOf('expected_direction');
		var expected_cell_id = header.indexOf('expected_cell_id');
		var query_source = header.indexOf('query_source');
		var query_desc = header.indexOf('query_desc');
		var query_cell_id = header.indexOf('query_cell_id');

		for (var i = 1; i < lines.length; i++) {
			var line = lines[i].split(tab);
			var queryId = line[id_query];
			var positive = line[expected_direction] === 'positive';
			var cells = line[expected_cell_id].split('\|');

			var cellSet = queryIdToCells.get(queryId);
			if (cellSet === undefined) {
				cellSet = new morpheus.Set();
				queryIdToCells.set(queryId, cellSet);
				queries.push({
					id : queryId,
					description : line[query_desc],
					source : line[query_source]
				});
			}
			for (var j = 0; j < cells.length; j++) {
				if (cells[j] === 'all') {
					cells[j] = 'summary';
				}
				cellSet.add(cells[j]);
				connecticonsArray.push({
					query_id : queryId,
					pert : line[pert_id_connection],
					direction : line[expected_direction],
					cell : cells[j],
					positive : positive
				});
			}
		}
		queries.sort(function(a, b) {
			var ad = a.description.toLowerCase();
			var bd = b.description.toLowerCase();
			return (ad === bd ? 0 : (ad < bd ? -1 : 1));
		});

	}
	options.quickAccess = function(heatMap) {
		var html = [];
		html
				.push('<ul style="max-height:30em;overflow:auto;" class="list-group">');
		for (var i = 0; i < queries.length; i++) {
			// morpheus.Gsea.runningKs (N, ranks, scores);
			html
					.push('<li class="list-group-item"><a data-type="conn" href="#" name="'
							+ i
							+ '"><h4 style="margin - bottom:0px;">'
							+ queries[i].description + '</h4></a>');
			if (queries[i].source.indexOf('GSE') === 0) {
				html
						.push('<a style="font-size:80%;" target="_blank" href="http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc='
								+ queries[i].source + '">GEO</a>')
			} else if (queries[i].source.indexOf('MSigDB') === 0) {
				html
						.push('<a style="font-size:80%;" target="_blank" href="http://www.broadinstitute.org/gsea/msigdb/geneset_page.jsp?geneSetName='
								+ queries[i].id + '">MSigDB</a>')
			} else if (queries[i].source) {
				html.push(queries[i].source)
			}
			var cellSet = queryIdToCells.get(queries[i].id);
			var cells = cellSet.values();
			cells.sort();

			html.push('<p style="font-size:80%;" class="text-muted">');
			for (var j = 0; j < cells.length; j++) {
				if (j > 0) {
					html.push(', ');
				}
				html.push(cells[j]);

			}
			html.push('</p>');
			html.push('</li>');
		}
		html.push('</ul>');
		var $el = $(html.join(''));
		$el.on('click', 'a[data-type=conn]', function(e) {
			var heatMap = _this.heatMap.getTabManager().getActiveTab();
			var queryIndex = parseInt($(this).attr('name'));
			var queryId = queries[queryIndex].id;
			var cellSet = queryIdToCells.get(queryId);
			var sortedFilteredDataset = heatMap.getProject()
					.getSortedFilteredDataset();
			var idVector = sortedFilteredDataset.getColumnMetadata().getByName(
					'id');
			var cellVector = sortedFilteredDataset.getColumnMetadata()
					.getByName('cell_id');
			var selection = new morpheus.Set();
			var firstIndex = -1;
			for (var i = 0, size = idVector.size(); i < size; i++) {
				if (idVector.getValue(i) === queryId
						&& cellSet.has(cellVector.getValue(i))) {
					selection.add(i);
					if (firstIndex === -1) {
						firstIndex = i;
					}

				}
			}
			// select matching id and cells and sort
			if (selection.size() > 0) {
				heatMap.getProject().getColumnSelectionModel().setViewIndices(
						selection, true);
				var modelIndices = heatMap.getProject()
						.getColumnSelectionModel().toModelIndices();
				var dataset = heatMap.getProject().getFullDataset();
				var sortKey = clue.Connecticon.createConnectionsToTopSortKey(
						heatMap.getProject().connecticons,
						new morpheus.SlicedDatasetView(dataset, null,
								modelIndices), modelIndices, false);
				var rowSelection = new morpheus.Set();
				var nconnecticons = sortKey.nconnecticons;
				for (var i = 0; i < nconnecticons; i++) {
					rowSelection.add(i);
				}

				heatMap.getProject().setRowSortKeys([ sortKey ], true);
				heatMap.getProject().getRowSelectionModel().setViewIndices(
						rowSelection, true);
				heatMap.scrollLeft(heatMap.getHeatMapElementComponent()
						.getColumnPositions().getPosition(firstIndex));
			}
			// bring to top
		});
		return $el;
	};
	options.columnAnnotations
			.push({
				datasetField : 'id',
				fileField : 'id_query',
				file : '//s3.amazonaws.com/data.clue.io/connecticon/connecticons.tsv',
				include : [ 'query_source', 'query_desc', 'query_cell_id' ]

			});
	if (!options.popups) {
		options.popups = [];
	}
	options.popups.push(new clue.Connecticon.ConnectionsToTopPopup(true));
	options.popups.push(new clue.Connecticon.ConnectionsToTopPopup(false));
	options.rows.push({
		field : 'is_connecticon',
		display : 'Color'
	});
	options.columns.push({
		field : 'query_desc',
		display : 'text,color,highlight'
	});

	// id_query query_source query_desc query_cell_id query_pert_type
	// query_platform pert_id_connection pert_iname_connection
	// pert_type_connection pert_desc_connection expected_direction
	// expected_cell_id
	var connecticonsPromise = morpheus.Util
			.readLines('//s3.amazonaws.com/data.clue.io/connecticon/connecticons.tsv');
	var scoresPromise = morpheus.Util
			.readLines('////s3.amazonaws.com/data.clue.io/connecticon/bing_wt_cs/es_results.txt');
	var tab = /\t/;
	var queryIdAndCellToScore = new morpheus.Map();
	scoresPromise.done(function(lines) {
		var header = lines[0].split(tab);
		var id_query = header.indexOf('id_query');
		var cell_id = header.indexOf('cell_id');
		var q_value = header.indexOf('q_value');
		for (var i = 1; i < lines.length; i++) {
			var line = lines[i].split(tab);
			var queryId = line[id_query];
			var cell = line[cell_id];
			if (cell === 'all') {
				cell = 'summary';
			}
			queryIdAndCellToScore.set(
					new morpheus.Identifier([ queryId, cell ]), {
						q : parseFloat(line[q_value])
					});
		}
	});
	options.promises = [ connecticonsPromise, scoresPromise ];

	connecticonsPromise.done(function(lines) {
		_this.connecticonLines = lines;
		loadConnecticons();

	});

	options._tabOpened = function(heatMap) {
		var pertIdToIndex = morpheus.VectorUtil.createValueToIndexMap(heatMap
				.getProject().getFullDataset().getRowMetadata().getByName(
						'pert_id'));
		var queryAndCellToIndex = morpheus.VectorUtil.createValuesToIndexMap([
				heatMap.getProject().getFullDataset().getColumnMetadata()
						.getByName('id'),
				heatMap.getProject().getFullDataset().getColumnMetadata()
						.getByName('cell_id') ]);

		var connecticonVector = heatMap.getProject().getFullDataset()
				.getRowMetadata().add('is_connecticon');
		for (var i = 0, size = connecticonVector.size(); i < size; i++) {
			connecticonVector.setValue(i, 'n');
		}
		var connecticons = [];
		for (var i = 0; i < connecticonsArray.length; i++) {
			var c = connecticonsArray[i];
			var rowIndex = pertIdToIndex.get(c.pert);
			var columnIndex = queryAndCellToIndex.get(new morpheus.Identifier([
					c.query_id, c.cell ]));
			if (columnIndex !== undefined && rowIndex !== undefined) {
				c = _.clone(c);
				c.rowIndex = rowIndex;
				c.columnIndex = columnIndex;
				connecticonVector.setValue(c.rowIndex, 'y');
				connecticons.push(c);
			}

		}

		heatMap.getProject().connecticons = connecticons;
	};

	options.drawCallback = function(drawOptions) {
		var context = drawOptions.context;
		// context.strokeStyle = '#d8b365';
		context.strokeStyle = 'black';
		context.fillStyle = '#fdf801';
		context.lineWidth = 1;
		var project = drawOptions.project;
		var connecticons = drawOptions.project.connecticons;
		if (connecticons) {
			for (var i = 0; i < connecticons.length; i++) {
				var c = connecticons[i];
				var columnIndex = project
						.convertModelColumnIndexToView(c.columnIndex);
				var rowIndex = project.convertModelRowIndexToView(c.rowIndex);
				if (columnIndex !== -1 && rowIndex !== -1) {
					var rowSize = drawOptions.rowPositions
							.getItemSize(rowIndex);
					var columnSize = drawOptions.columnPositions
							.getItemSize(columnIndex);
					var py = drawOptions.rowPositions.getPosition(rowIndex);
					var px = drawOptions.columnPositions
							.getPosition(columnIndex);

					// context.rect(x1, y1, x2 - x1,
					// y2 - y1);
					context.beginPath();
					context.arc(px + columnSize / 2, py + rowSize / 2, Math
							.min(columnSize, rowSize) / 4, 0, Math.PI * 2,
							false);
					context.fill();
					context.stroke();

				}

			}
		}

	};

	options._renderReady = function(heatMap) {
		_this.heatMap = heatMap;
		heatMap.removeTrack('id', true);
		heatMap.addRowTrack('is_connecticon', 'Color');
		var contextSpecificVector = heatMap.getProject().getFullDataset()
				.getColumnMetadata().add('context_specific');
		var connecticonVector = heatMap.getProject().getFullDataset()
				.getColumnMetadata().add('is_connecticon');
		var idVector = heatMap.getProject().getFullDataset()
				.getColumnMetadata().getByName('id');
		var cellVector = heatMap.getProject().getFullDataset()
				.getColumnMetadata().getByName('cell_id');
		var qValueVector = heatMap.getProject().getFullDataset()
				.getColumnMetadata().add('-log_q_value');

		for (var i = 0, size = contextSpecificVector.size(); i < size; i++) {
			var id = idVector.getValue(i);
			var cell = cellVector.getValue(i);
			var cellsSet = queryIdToCells.get(id);
			var score = queryIdAndCellToScore.get(new morpheus.Identifier([ id,
					cell ]));
			if (score) {
				qValueVector.setValue(i, score.q === 0 ? 2 : -morpheus
						.Log10(score.q));
			}
			if (cellsSet == null) {
				continue;
			}
			contextSpecificVector.setValue(i, cellsSet.has('summary') ? 'n'
					: 'y');
			connecticonVector.setValue(i, cellsSet.has(cell) ? 'y' : 'n');
		}
		heatMap.addColumnTrack(qValueVector.getName(), 'bar');
		heatMap.addColumnTrack('is_connecticon', 'Color');
		heatMap.addColumnTrack('context_specific', 'Color');
		heatMap.getTrack('query_desc', true).settings.inlineTooltip = true;
		heatMap.getProject().setRowSortKeys(
				[ new morpheus.SortKey('is_connecticon',
						morpheus.SortKey.SortOrder.DESCENDING) ]);

	};

	new clue.ICV(options);

	// clue.GUTC.getGutDataset({
	// urls : urls,
	// pcl : true
	// }, function(dataset) {
	// options.dataset = dataset;
	// new clue.ICV(options);
	// });
};

clue.Connecticon.createConnectionsToTopSortKey = function(connecticons,
		dataset, modelIndices, isColumnSort) {
	var modelIndicesSet = new morpheus.Set();
	for (var i = 0, length = modelIndices.length; i < length; i++) {
		modelIndicesSet.add(modelIndices[i]);
	}
	var view = new morpheus.DatasetRowView(dataset);
	var summaryFunction = modelIndices.length > 1 ? morpheus.Median : function(
			v) {
		return v.getValue(0);
	};

	var hits = [];
	var connecticonIndices = new morpheus.Set();
	for (var i = 0, length = connecticons.length; i < length; i++) {
		var c = connecticons[i];
		if (!isColumnSort && modelIndicesSet.has(c.columnIndex)) {
			var value = summaryFunction(view.setIndex(c.rowIndex));
			connecticonIndices.add(c.rowIndex);
			hits.push({
				index : c.rowIndex,
				value : value
			});
		} else if (isColumnSort && modelIndicesSet.has(c.rowIndex)) {
			var value = summaryFunction(view.setIndex(c.columnIndex));
			connecticonIndices.add(c.columnIndex);
			hits.push({
				index : c.columnIndex,
				value : value
			});
		}

	}
	var pairs = [];
	for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
		if (!connecticonIndices.has(i)) {
			var value = summaryFunction(view.setIndex(i));
			pairs.push({
				index : i,
				value : value
			});
		}
	}

	// sort values in descending order
	hits.sort(function(a, b) {
		return morpheus.SortKey.NUMBER_DESCENDING_COMPARATOR(a.value, b.value);
	});
	pairs.sort(function(a, b) {
		return morpheus.SortKey.NUMBER_DESCENDING_COMPARATOR(a.value, b.value);
	});
	var indices = [];
	for (var i = 0, length = hits.length; i < length; i++) {
		indices.push(hits[i].index);
	}
	for (var i = 0, length = pairs.length; i < length; i++) {
		indices.push(pairs[i].index);
	}
	var key = new morpheus.SpecifiedModelSortOrder(indices, indices.length,
			'connecticons');
	key.nconnecticons = hits.length;
	return key;

};

clue.Connecticon.ConnectionsToTopPopup = function(isColumns) {
	return {
		section : 'Selection',
		columns : isColumns,
		name : 'Bring Connecticons To Top',
		callback : function(parentHeatMap) {
			var selection = isColumns ? parentHeatMap.getProject()
					.getColumnSelectionModel().toModelIndices() : parentHeatMap
					.getProject().getRowSelectionModel().toModelIndices();

			var dataset = parentHeatMap.getProject().getFullDataset();
			if (isColumns) {
				parentHeatMap.getProject().setRowSortKeys(
						[ clue.Connecticon.createConnectionsToTopSortKey(
								parentHeatMap.getProject().connecticons,
								new morpheus.SlicedDatasetView(dataset, null,
										selection), selection, false) ], true);
			} else { // select rows, sort columns
				parentHeatMap.getProject().setColumnSortKeys(
						[ clue.Connecticon.createConnectionsToTopSortKey(
								parentHeatMap.getProject().connecticons,
								new morpheus.TransposedDatasetView(
										new morpheus.SlicedDatasetView(dataset,
												selection, null)), selection,
								true) ], true);
			}

		}
	}
};
