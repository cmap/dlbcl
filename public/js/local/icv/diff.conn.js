(function (global) {
  'use strict';
  global.diffConnInit = function (heatMap) {
    $('<hr>Differential Connectivity<span style="margin-left:8px;" class="help-block">Select 3 or more columns to compare to<br> unselected' +
        ' columns (visible columns only)</span><button class="btn btn-primary btn-sm">Calculate</button>')
        .appendTo(heatMap.quickAccessWindow.$el)
        .on('click', function () {
          execute(heatMap);
        });
  };

  var execute = function (heatMap) {
    var project = heatMap.getProject();
    // var dataset = project.getFullDataset();
    var dataset = project.getSortedFilteredDataset();
    var vectorsForCorrelation = [];
    var binaryVectors = [];

    // phenotypeVectorNames.forEach(function (name) {
    //   if (dataset.getColumnMetadata().getByName(name)) {
    //     var v = dataset.getColumnMetadata().getByName(name);
    //     if (v != null) {
    //       var count = 0;
    //       var binaryVector = new morpheus.Vector(name, v.size());
    //       for (var j = 0; j < v.size(); j++) {
    //         var value = v.getValue(j) === 'True' ? 1 : 0;
    //         binaryVector.setValue(j, value);
    //         count += value;
    //
    //       }
    //       if (count > 2) {
    //         binaryVectors.push(binaryVector);
    //
    //         if (v.getName() === 'tas_active_line') {
    //           var vector = new morpheus.Vector('tas', dataset.getColumnCount());
    //           var tasVector = dataset.getColumnMetadata().getByName('tas');
    //           for (var j = 0; j < tasVector.size(); j++) {
    //             var tas = tasVector.getValue(j);
    //             if (isNaN(tas) || tas < 0) {
    //               tas = 0;
    //             }
    //             vector.setValue(j, tas);
    //           }
    //           vectorsForCorrelation.push(vector);
    //         } else {
    //           vectorsForCorrelation.push(binaryVector);
    //         }
    //       }
    //     }
    //   }
    // });
    // var selectedColumnIndices = project.getColumnSelectionModel().toModelIndices();
    var selectedColumnIndices = project.getColumnSelectionModel().getViewIndices().values();
    if (selectedColumnIndices.length > 2) {
      var vector = new morpheus.Vector('custom', dataset.getColumnCount());
      vector.array = new Uint8Array(dataset.getColumnCount());
      for (var j = 0, size = selectedColumnIndices.length; j < size; j++) {
        vector.setValue(selectedColumnIndices[j], 1);
      }
      binaryVectors.push(vector);
      vectorsForCorrelation.push(vector);
    }
    var pearsonArrayOfArrays = [];
    var rowView = new morpheus.DatasetRowView(dataset);
    if (vectorsForCorrelation.length === 0) {
      return;
    }
    vectorsForCorrelation.forEach(function (v) {
      var values = new Float32Array(dataset.getRowCount());
      pearsonArrayOfArrays.push(values);
      for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
        values[i] = morpheus.Pearson(v, rowView.setIndex(i));
      }
    });

    var connectivityInSensitiveClassArray = [];
    var fractionHighConnUnsenstiveArray = [];
    binaryVectors.forEach(function (binaryVector) {
      var sensitiveColumnIndices = [];
      var unsensitiveColumnIndices = [];
      for (var j = 0, ncols = dataset.getColumnCount(); j < ncols; j++) {
        if (binaryVector.getValue(j) === 1) {
          sensitiveColumnIndices.push(j);
        } else {
          unsensitiveColumnIndices.push(j);
        }
      }

      var sensitiveDatasetRowView = new morpheus.DatasetRowView(new morpheus.SlicedDatasetView(dataset, null, sensitiveColumnIndices));
      var connectivityInSensitiveClass = new Float32Array(dataset.getRowCount());
      var maxPercentiles = new morpheus.MaxPercentiles([25, 75]);
      for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
        connectivityInSensitiveClass[i] = maxPercentiles(sensitiveDatasetRowView.setIndex(i));
      }

      // fraction of unaffected with strong connectivity
      var unsensitiveDataset = new morpheus.SlicedDatasetView(dataset, null, unsensitiveColumnIndices);
      var numMembersInUnsens = unsensitiveDataset.getColumnCount();
      var fractionHighConnUnsenstive = new Float32Array(dataset.getRowCount());
      for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
        var count = 0;
        if (connectivityInSensitiveClass[i] >= 0) {
          for (var j = 0, ncols = unsensitiveDataset.getColumnCount(); j < ncols; j++) {
            if (unsensitiveDataset.getValue(i, j) >= 90) {
              count++;
            }
          }
        } else {
          for (var j = 0, ncols = unsensitiveDataset.getColumnCount(); j < ncols; j++) {
            if (unsensitiveDataset.getValue(i, j) <= -90) {
              count++;
            }
          }
        }
        fractionHighConnUnsenstive[i] = count / numMembersInUnsens;
      }
      connectivityInSensitiveClassArray.push(connectivityInSensitiveClass);
      fractionHighConnUnsenstiveArray.push(fractionHighConnUnsenstive);
    });

    var diffConnScores = new Float32Array(dataset.getRowCount());
    var rowIndices = project.getFilteredSortedRowIndices();
    for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
      for (var phenotypeIndex = 0; phenotypeIndex < pearsonArrayOfArrays.length; phenotypeIndex++) {
        var connectivityInSensitiveClass = connectivityInSensitiveClassArray[phenotypeIndex];
        var fractionHighConnUnsenstive = fractionHighConnUnsenstiveArray[phenotypeIndex];
        var cc = pearsonArrayOfArrays[phenotypeIndex];
        // ensure connectivity in sensitive class is >=90 and not more than 25% of connections in unsensitive class are strong
        if (Math.abs(connectivityInSensitiveClass[i]) >= 90 && fractionHighConnUnsenstive[i] < 0.25 && Math.abs(cc[i]) > Math.abs(diffConnScores[i])) {
          diffConnScores[rowIndices[i]] = cc[i];
        }
      }
    }

    var diffConnVector = project.getFullDataset().getRowMetadata().add('diffcon_score_custom');
    diffConnVector.array = diffConnScores;

    for (var phenotypeIndex = 0; phenotypeIndex < pearsonArrayOfArrays.length; phenotypeIndex++) {
      var name = binaryVectors[phenotypeIndex].getName();
      var _ps_ctg_sens = dataset.getRowMetadata().add('ps_sens_' + name);
      _ps_ctg_sens.array = connectivityInSensitiveClassArray[phenotypeIndex];

      var _fr_ctg_unsens = dataset.getRowMetadata().add('fr_unsens_' + name);
      _fr_ctg_unsens.array = fractionHighConnUnsenstiveArray[phenotypeIndex];

      var _cc_ctg = dataset.getRowMetadata().add('cc_' + name);
      _cc_ctg.array = pearsonArrayOfArrays[phenotypeIndex];

    }

    var customDiffConnIndex = heatMap.getTrackIndex('diffcon_score_custom', false);
    if (customDiffConnIndex === -1) {
      var diffConnIndex = heatMap.getTrackIndex('diffcon_score', false);
      if (diffConnIndex === -1) {
        diffConnIndex = 0;
      }
      heatMap.addTrack('diffcon_score_custom', false, null, diffConnIndex);
    }
    project.setRowSortKeys(morpheus.SortKey.keepExistingSortKeys(
        [
          new morpheus.SortKey(diffConnVector.getName(),
              morpheus.SortKey.SortOrder.DESCENDING)], project.getRowSortKeys()), true);
  };
})(typeof window !== 'undefined' ? window : this);
