exports.filterIds = function(ids,assay) {
  var icollection = assay;
  if(assay==='L1000') { icollection='TS_v1.1'; }
  var p = $.Deferred();
  $.ajax(clue.API_URL + '/api/perts?filter=' + JSON.stringify({
      fields: ['pert_id', 'pert_icollection'],
      where: {
        pert_id: {inq: ids}
      }
    }))
    .done(function (results) {
      var ids = _.filter(results, function (obj) {
        return obj.pert_icollection.indexOf(icollection) > -1;
      }).map(function (obj) { return obj.pert_id });
      p.resolve(ids);
    })
    .fail(function() {
      console.log('could not find perts to filter ids');
      p.resolve([]);
    });
  return p;
};
exports.getData = function(ids,assay) {
  var p = $.Deferred();
  exports.filterIds(ids,assay).done(function(ids) {
    if (assay === 'L1000') {
      var d = exports.getL1000(ids);
      d.done(function (dataset) {
        p.resolve(dataset);
      }).fail(function (e) {
          console.log(e)
          p.reject();
        });
    }
    else {
      var d = exports.getProteomics(ids, assay);
      d.done(function (dataset) {
        p.resolve(dataset);
      })
        .fail(function () {
          p.reject();
        });
    }
  });
  return p;
};

exports.getL1000 = function(ids) {
  var p = $.Deferred();
  $.ajax(clue.API_URL + '/api/perts?filter=' + JSON.stringify({
      fields: ['pert_id', 'pert_icollection'],
      where: {
        pert_id: {inq: ids}
      }
    })).done(function (results) {
    var tsObjects = _.filter(results, function(obj){
      return obj.pert_icollection.indexOf('TS_v1.1') > -1; });
    var urls = tsObjects.map(function (obj) {
      return 'https://s3.amazonaws.com/macchiato.clue.io/builds/touchstone/v1.1/arfs/' + obj.pert_id.replace(/ccsbbroad/i, 'CCSBBROAD') + '/';
    });
    if(urls.length===0) {
      p.reject();
    }
    else {
      clue.getGutcResults({
        urls: urls,
        pclCell: true,
        pclSummary: true
      }).done(function (dataset) {
        clue.ICV.ANNOTATION_LINES_ROWS = clue.ICV.L1000_ANNOTATION_LINES_ROWS;
        clue.ICV.ANNOTATION_LINES_COLUMNS = clue.ICV.L1000_ANNOTATION_LINES_COLUMNS;
        clue.ICV.prepareDataset(
          dataset, {
            dataType: clue.ICV.DataType.GUTC,
            annotate: true,
            pcls: clue.ICV.PCL_METADATA
          });
        p.resolve(dataset);
      })
      .fail(function () {
        p.reject();
      })
    }
  })
  .fail(function() {
    p.reject();
  });
  return p;
};

/**
 *
 * @param options.rowIds
 * @param options.symmetric
 * @param options.columnIds
 * @param options.cellLine
 * @return Promise that resolves to a dataset.
 */
exports.getProteomics = function(ids, assay) {
  // need pert_id on both
  // https://dev-api.clue.io/data-api/slice/?name=P100_all_connectivities&rfield=id&rfield=pert_id&cfield=id&cfield=pert_id&cquery=pert_id:(BRD-A14634327)
  var d = $.Deferred();
  var p;
  // todo bw: rid/cid info is still weird for CCSBBROAD id's
  var queryString = '&rfield=id&rfield=pert_id&cfield=id&cfield=cell_id&cfield=pert_id&cquery=pert_id:(' + ids.join(' ') +
    ')';
  p = morpheus.DatasetUtil.read(clue.API_URL + '/data-api/slice/?name=' + assay + '_all_connectivities' + queryString);
  p.then(function (dataset) {
    clue.ICV.ANNOTATION_LINES_ROWS = clue.ICV.PROT_ANNOTATION_LINES_ROWS;
    clue.ICV.ANNOTATION_LINES_COLUMNS = clue.ICV.PROT_ANNOTATION_LINES_COLUMNS;
    clue.ICV.prepareDataset(
      dataset, {
        dataType: assay,
        annotate: true
      });
    dataset.getColumnMetadata().getByName('pert_iname').setName('name');
    dataset.getRowMetadata().getByName('pert_iname').setName('name');
    dataset.getColumnMetadata().getByName('pert_id').setName('_id');
    d.resolve(dataset);
  }).catch(function () {
    d.reject('Please try again.');
  });
  return d;
}
