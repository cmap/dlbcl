/**
 *
 * @param options.rowIds
 * @param options.symmetric
 * @param options.columnIds
 * @param options.cellLine
 * @return Promise that resolves to a dataset.
 */
exports.get = function(options) {
    // cell line dataset has id on column by pert_id on rows, id on rows
    // is pert_id:cell_id
    var d = $.Deferred();
    var p;
    // todo bw: rid/cid info is still weird for CCSBBROAD id's
    options.rowIds.forEach(function(str,idx) {
        options.rowIds[idx] = str.replace(/ccsbbroad/i, 'ccsbBroad');
    });
    options.columnIds.forEach(function(str,idx) {
        options.columnIds[idx] = str.replace(/ccsbbroad/i, 'ccsbBroad');
    });

    if (options.cellLine == null || options.cellLine.toLowerCase() === 'summary') {

        var queryString = '&rfield=id&rfield=pert_id&cfield=id&cfield=pert_id&cquery=id:(' + options.columnIds.join(' ') +
            ')';
        if (options.rowIds !== 'top') {
            queryString += '&rquery=id:(' + options.rowIds.join(' ') + ')';
        }

        p = morpheus.DatasetUtil.read(clue.API_URL + '/data-api/slice/?name=' + options.assay + '_introspect_matched_SUMMLY' + queryString);
    } else { // specific cell line

        var rowIdString = '';
        var columnIdString = '';
        if(options.assay==='L1000') {
            rowIdString = options.rowIds.map(function (id) {
              return id + ':' + options.cellLine;
            }).join(' ');
            columnIdString = options.columnIds.join(' ');
        }
        else if(options.assay==='P100') {
          // GCP is 24
          rowIdString = options.rowIds.map(function (id) {
            return id + ':' + options.cellLine + ':3';
          }).join(' ');
          columnIdString = options.columnIds.map(function (id) {
            return id + ':' + options.cellLine + ':3';
          }).join(' ');
        }
        else {
            // GCP is 24
          rowIdString = options.rowIds.map(function (id) {
              return id + ':' + options.cellLine + ':24';
            }).join(' ');
          columnIdString = options.columnIds.map(function (id) {
              return id + ':' + options.cellLine + ':24';
            }).join(' ');
        }

        var queryString = '&rfield=id&rfield=pert_id&cfield=id&cfield=pert_id&cquery=id:(' + columnIdString +
            ')';
        if (options.rowIds !== 'top') {
            queryString += '&rquery=id:(' + rowIdString + ')';
        }

        p = morpheus.DatasetUtil.read(
            clue.API_URL + '/data-api/slice/?name=' + options.assay + '_introspect_matched_' + options.cellLine + queryString);
    }
    p.then(function (introspectDataset) {
        var rowIdVector = introspectDataset.getRowMetadata().getByName('pert_id');
        if (rowIdVector == null) {
            rowIdVector = introspectDataset.getRowMetadata().getByName('id');
        } else {
            var idIndex = morpheus.MetadataUtil.indexOf(introspectDataset.getRowMetadata(), 'id');
            if (idIndex !== -1) {
                introspectDataset.getRowMetadata().remove(idIndex);
            }
        }
        rowIdVector.setName('id');
        if (options.rowIds === 'top') {
            var utils = require('Shared/utils.js');
            var topRowIndices = utils.getTopRowIndices(introspectDataset);
            introspectDataset = new morpheus.SlicedDatasetView(introspectDataset, topRowIndices, null);
        }

        // put rows and columns in same order
        if (options.order) {
            var rowOrder = [];
            var columnOrder = [];
            var columnIdVector = introspectDataset.getColumnMetadata().getByName('pert_id'); // put in same order
            if (columnIdVector == null) {
                columnIdVector = introspectDataset.getColumnMetadata().getByName('id');
            } else {
                var idIndex = morpheus.MetadataUtil.indexOf(introspectDataset.getColumnMetadata(), 'id');
                if (idIndex !== -1) {
                    introspectDataset.getColumnMetadata().remove(idIndex);
                }
            }
            columnIdVector.setName('id');
            var rowIdToIndex = morpheus.VectorUtil.createValueToIndexMap(rowIdVector);
            var columnIdToIndex = morpheus.VectorUtil.createValueToIndexMap(columnIdVector);
            var ids = new morpheus.Set();
            rowIdToIndex.forEach(function (index, id) {
                ids.add(id);
            });
            columnIdToIndex.forEach(function (index, id) {
                ids.add(id);
            });
            ids.forEach(function (id) {
                var rowIndex = rowIdToIndex.get(id);
                var columnIndex = columnIdToIndex.get(id);
                if (rowIndex !== undefined && columnIndex !== undefined) {
                    rowOrder.push(rowIndex);
                    columnOrder.push(columnIndex);
                }
            });
            introspectDataset = new morpheus.SlicedDatasetView(introspectDataset, rowOrder, columnOrder);
        }
        if (options.symmetric) {
            for (var i = 0, nrows = introspectDataset.getRowCount(); i < nrows; i++) {
                introspectDataset.setValue(i, i, NaN); // diagonal
            }
            for (var i = 1, nrows = introspectDataset.getRowCount(); i < nrows; i++) {
                for (var j = 0; j < i; j++) {
                    var value = (introspectDataset.getValue(i, j) + introspectDataset.getValue(j, i)) / 2;
                    introspectDataset.setValue(i, j, value);
                    introspectDataset.setValue(j, i, value);
                }
            }
        }
        d.resolve(introspectDataset);
    }).catch(function (ee) {
        console.log("error: ",ee);
        d.reject('Please try again.');
    });
    return d;
}
