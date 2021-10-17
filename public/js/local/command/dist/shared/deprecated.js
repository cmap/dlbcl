/**
 * Created by bwedin on 1/4/18.
 */


//   function showTermInterpretation(obj, type) {
//     return; // not yet
//     var $btn = $('<button class="btn btn-default btn-xs" type="button">Input interpretation</button>');
//     $tabContent.find('[data-name=matches]').html($btn);
//     var $matches;
//     $btn.on('click', function () {
//         if ($matches == null) {
//           if (type === TYPE_CELL) {
//             $.ajax(clue.API_URL + '/api/cells?filter=' + JSON.stringify({
//                 where: {cell_id: {inq: obj.ids}}
//               })).done(function (annotations) {
//               var idToItem = new morpheus.Map();
//               for (var i = 0; i < annotations.length; i++) {
//                 idToItem.set(annotations[i].cell_id, annotations[i]);
//               }
//               var results = obj.results;
//               var termHtml = [];
//               termHtml.push('<table class="table table-condensed">');
//               for (var i = 0; i < results.length; i++) {
//                 var item = results[i];
//                 termHtml.push('<tr><th>');
//                 termHtml.push('<i>Term:</i> ' + item.term);
//                 termHtml.push('</th></tr>');
//
//                 var annotationsForTerm = [];
//                 for (var j = 0; j < item.ids.length; j++) {
//                   annotationsForTerm.push(idToItem.get(item.ids[j]));
//                 }
//                 annotationsForTerm.sort(function (a1, a2) {
//                   return (a1.cell_id === a2.cell_id ? 0 : (a1.cell_id < a2.cell_id ? -1 : 1));
//                 });
//                 for (var j = 0; j < annotationsForTerm.length; j++) {
//                   termHtml.push('<tr>');
//                   var annotation = annotationsForTerm[j];
//                   termHtml.push('<td>');
//                   termHtml.push(annotation.cell_id);
//                   // termHtml.push('&nbsp;');
//                   // termHtml.push(annotation.cell_lineage);
//                   termHtml.push('</td>');
//                   termHtml.push('</tr>');
//                 }
//               }
//               termHtml.push('</table>');
//               $matches = $(termHtml.join(''));
//               morpheus.FormBuilder.showInModal({
//                 title: 'Input Interpretation',
//                 html: $matches
//               });
//             }).fail(function () {
//
//             });
//           }
//           if (type === TYPE_PERT) {
//             $.ajax(clue.API_URL + '/api/perts?filter=' + JSON.stringify({
//                 fields: ['pert_id', 'pert_iname', 'pert_type'],
//                 where: {pert_id: {inq: obj.ids}}
//               })).done(function (annotations) {
//               var pertIdToItem = new morpheus.Map();
//               for (var i = 0; i < annotations.length; i++) {
//                 pertIdToItem.set(annotations[i].pert_id, annotations[i]);
//               }
//               var results = obj.results;
//               var termHtml = [];
//               termHtml.push('<table class="table table-condensed">');
//               for (var i = 0; i < results.length; i++) {
//                 var item = results[i];
//                 termHtml.push('<tr><th>');
//                 termHtml.push('<i>Term:</i> ' + item.term);
//                 termHtml.push('</th></tr>');
//
//                 var annotationsForTerm = [];
//                 for (var j = 0; j < item.ids.length; j++) {
//                   annotationsForTerm.push(pertIdToItem.get(item.ids[j]));
//                 }
//                 annotationsForTerm.sort(function (a1, a2) {
// // type descending, then name
//                   var c = (a1.pert_type === a2.pert_type ? 0 : (a1.pert_type < a2.pert_type ? 1 : -1));
//                   if (c !== 0) {
//                     return c;
//                   }
//                   return (a1.pert_iname === a2.pert_iname ? 0 : (a1.pert_iname < a2.pert_iname ? -1 : 1));
//                 });
//                 for (var j = 0; j < annotationsForTerm.length; j++) {
//                   termHtml.push('<tr>');
//                   var annotation = annotationsForTerm[j];
//                   termHtml.push('<td>');
//                   termHtml.push(getPertTypeIcon(annotation.pert_type));
//                   termHtml.push('&nbsp;');
//                   termHtml.push(annotation.pert_iname);
//                   termHtml.push('</td>');
//                   termHtml.push('</tr>');
//                 }
//               }
//               termHtml.push('</table>');
//               $matches = $(termHtml.join(''));
//               morpheus.FormBuilder.showInModal({
//                 title: 'Input Interpretation',
//                 html: $matches
//               });
//             }).fail(function () {
//
//             });
//           }
//         } else {
//           morpheus.FormBuilder.showInModal({
//             title: 'Matches',
//             html: $matches
//           });
//         }
//       }
//     );
//
//   }


// function getPclDataset(pertIds, cellLine) {
//   var deferred = $.Deferred();
//   var queryString;
//   if (cellLine === 'Summary') {
//     queryString = '?name=pcl_summary&cquery=id:(' + pertIds.join(' ') + ')';
//   } else {
//     queryString = '?name=pcl_cell&cquery=id:(' + pertIds.join(' ') + ')';
//   }
//   var p = morpheus.DatasetUtil.read(morpheus.DatasetUtil.read(clue.API_URL + '/data-api/slice/' + queryString)).done(function (dataset) {
//     // show union of top 20 most similar
//     if (cellLine.toLowerCase() !== 'summary') {
//       var idVector = dataset.getRowMetadata().getByName('id');
//       var cellRowIndices = [];
//       for (var i = 0, size = idVector.size(); i < size; i++) {
//         var id = idVector.getValue(i);
//         var delim = id.lastIndexOf(':');
//         var cell = id.substring(delim + 1);
//         if (cell === cellLine) {
//           cellRowIndices.push(i);
//           idVector.setValue(i, id.substring(0, delim));
//         }
//       }
//       dataset = new morpheus.SlicedDatasetView(dataset, cellRowIndices, null);
//     } else {
//       var idVector = dataset.getRowMetadata().getByName('id');
//       for (var i = 0, size = idVector.size(); i < size; i++) {
//         var id = idVector.getValue(i);
//         var delim = id.lastIndexOf(':');
//         idVector.setValue(i, id.substring(0, delim));
//       }
//     }
//     var rowIndices = getTopRowIndices(dataset);
//     deferred.resolve(new morpheus.SlicedDatasetView(dataset, rowIndices, null));
//   }).fail(function (err) {
//     deferred.reject();
//   });
//   return deferred;
// }
