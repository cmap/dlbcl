exports.TYPE_ASSAY = 'assay';
exports.TYPE_PERT = 'pert';
exports.TYPE_GENE = 'gene';
exports.TYPE_GENE_FAMILY = 'gene_family';
exports.TYPE_PCL = 'PCL';
exports.TYPE_MOA = 'moa';
exports.TYPE_CELL = 'cell';
exports.TYPE_ID = 'id';
exports.TYPE_LINEAGE = 'lineage';
exports.TYPE_COLLECTION = 'collection';

exports.actions = [
  {
    command: '/class-selectivity',
    input: [
      {
        name: exports.TYPE_PCL,
        min: 2
      }],
    example: [
      {
        desc: 'View the class selectivity for' +
        ' compounds to the CP_GLYCOGEN_SYNTHASE_KINASE_INHIBITOR and CP_AURORA_KINASE_INHIBITOR' +
        ' PCLs',
        command: 'CP_GLYCOGEN_SYNTHASE_KINASE_INHIBITOR,CP_AURORA_KINASE_INHIBITOR'
      }],
    help: 'Class selectivity of perturbagens to PCLs',
    home: 'hidden',
    show: function(options){
      var classSelectivity = require('Actions/class-selectivity.js');
      classSelectivity.show(options)}
  }, {
    command: '/hex',
    input: [{name: 'chromatin'}],
    help: 'View the baseline chromatin profile',
    home: 'hidden',
    show: function(options){
      var hex = require('Actions/hex.js');
      hex.show(options)
    }
  }, {
    command: '/home',
    input: [{min: 0}],
    help: 'Show command homepage',
    home: 'Return to the Command homepage (this page).',
    show: function(options){
      // this should never be called
    }
  }, {
    command: '/table',
    input: [
      {
        name: 'choice',
        values: ['gene', 'pert', 'profile', 'sig']
      }],
    help: 'View a table of meta data for genes, profiles, perturbagens, or signatures',
    home: 'hidden',
    argsHelp: '<code>/table pert (pert_iname pert_id canonical_smiles' +
    ' inchi_key molecular_formula) BRAF imatinib</code>' +
    ' will' +
    ' show a table with the fields pert_iname, pert_id, canonical_smiles, inchi_key, and molecular_formula for' +
    ' perturbagens that target BRAF or are named imatinib.<br /><br /><code>/table gene' +
    ' (entrez_id affymetrix_id) BRAF KRAS</code> will show a table with the fields entrez_id and' +
    ' affymetrix_id for BRAF and KRAS.<br /><br /><code>/table sig (pert_iname pert_type cell_id' +
    ' pct_self_rank_q25) BRAF</code> will show a table with pert_iname, pert_type, cell_id, and' +
    ' pct_self_rank_q25' +
    '  for BRAF' +
    ' signatures<br /><br /><code>/table profile (pert_id cell_id qc_iqr) BRAF</code> shows a table with' +
    ' pert_id' +
    ' cell_id, and qc_iqr for all BRAF profiles.<br /><br />See <a' +
    ' target="_blank" href="/api">the API</a> for description of fields.',
    show: function(options){
      var table = require('Actions/table.js');
      table.show(options);
    }
  }, {
    command: '/gex',
    input: [{name: exports.TYPE_GENE}],
    help: 'View the baseline gene expression for the specified genes',
    home: 'View the baseline gene expression for CCLE lines. View individual cell lines, or group by different metadata fields.',
    example: [
      {
        desc: 'View the baseline gene expression of BRAF in CCLE lines',
        command: 'BRAF'
      }, {
        desc: 'View the baseline gene expression of SETDB1 and HRAS in CCLE lines',
        command: 'SETDB1,HRAS'
      }, {
        desc: 'View the baseline gene expression of adenosine receptors in CCLE lines',
        command: 'Adenosine receptors'
      }],
    show: function(options){
      var gex = require('Actions/gex.js');
      gex.show(options);
    }
  },
  {
    command: '/pcl',
    input: [
      {
        name: exports.TYPE_PERT,
        min: 0
      }],
    example: [
      {
        desc: 'View PCLs for imatinib and hispidin',
        command: 'imatinib,hispidin'
      }, {
        desc: 'View PCLs for perturbagens that target BRAF or TP53',
        command: 'BRAF,TP53'
      }, {
        desc: 'View PCLs for all compounds that are androgren receptor agonist' +
        ' or antagonists',
        command: 'Androgen receptor agonist,Androgen receptor antagonist'
      }, {
        desc: 'View PCLs for all perturbagens that target BRAF, are named imatinib,' +
        ' or are CDK inhibitors',
        command: 'BRAF,imatinib,CDK inhibitor'
      }],
    help: 'View PCLs for the specified perturbagens',
    home: '*DEV only* View PCLs for the specified perturbagens',
    show: function(options) {
      var pcl = require('Actions/pcl.js');
      pcl.show(options);
    }
  },
  {
    command: '/sig',
    input: [{name: exports.TYPE_PERT}],
    example: [
      {
        desc: 'View signatures for imatinib and hispidin',
        command: 'imatinib,hispidin'
      }, {
        desc: 'View signatures for perturbagens that target BRAF or TP53',
        command: 'BRAF,TP53'
      }, {
        desc: 'View signatures for all compounds that are androgren receptor agonist' +
        ' or antagonists',
        command: 'Androgen receptor agonist,Androgen receptor antagonist'
      }, {
        desc: 'View signatures for all perturbagens that target BRAF, are named imatinib,' +
        ' or are CDK inhibitors',
        command: 'BRAF,imatinib,CDK inhibitor'
      }],
    help: 'View signatures for the specified perturbagens',
    home: 'Retrieve L1000 signatures (MODZS) for perturbagens in selected cell lines. View as a heatmap or download signatures as a GCT file.',
    show: function(options){
      var sig = require('Actions/sig.js');
      return sig.show(options);
    }
  }
  , {
    command: '/gene-mod',
    input: [{name: exports.TYPE_GENE}],
    help: 'View z-scores for the specified landmark genes',
    home: 'hidden',
    show: function(options){
      var geneMod = require('Actions/gene-mod.js');
      geneMod.show(options);
    }
  }, {
    command: '/conn',
    input: [{name: exports.TYPE_PERT}],
    help: 'View the connections of the specified perturbagens',
    home: 'View and download connectivity data for a compound of interest; see top connections to CMap or internal connectivities in cell lines.',
    example: [
      {
        desc: 'View connections for imatinib and hispidin',
        command: 'imatinib,hispidin'
      }, {
        desc: 'View connections for perturbagens that target BRAF or TP53',
        command: 'BRAF,TP53'
      }, {
        desc: 'View connections for all compounds that are androgren receptor agonist' +
        ' or antagonists',
        command: 'Androgen receptor agonist,Androgen receptor antagonist'
      }, {
        desc: 'View connections for all perturbagens that target BRAF, are named imatinib,' +
        ' or are CDK inhibitors',
        command: 'BRAF,imatinib,CDK inhibitor'
      }],
    show: function(options){
      var conn = require("Actions/conn.js");
      return conn.show(options);
    }
  }
  ,
  {
    command: '/gene-space',
    args: '[List of gene symbols or an L1000 gene type (lm, bing, aig, ni)]',
    help: 'List information for a list of genes or a L1000 gene type (lm, bing, aig)',
    home: 'Learn whether gene(s) of interest are measured or inferred by L1000. For inferred genes, view correlations between inferred values and RNA-seq data. Note that information is not downloadable.',
    input: [
      {
        min: 0,
        name: exports.TYPE_GENE
      }],
    show: function(options){
      var geneSpace = require('Actions/gene-space.js');
      return geneSpace.show(options);
    }
  }
  ,
  {
    command: '/cell-space',
    args: '[One or more lineages, ids, or collections]',
    help: 'View information for cell lines',
    home: '*DEV only* View information for cell lines',
    input: [
      {
        min: 0,
        name: exports.TYPE_CELL
      }],
    show: function(options){
      var cellSpace = require("Actions/cell-space.js");
      cellSpace.show(options);
    }
  }
// {
// command: '/dose',
// input: [{
//   name: 'perturbagens',
//   type: 'trt_cp'
// }],
// help: 'Dose',
// show: function (options) {
//   $.ajax(clue.API_URL + '/api/sigs?filter=' + JSON.stringify({
//       fields: ['pert_id', 'distil_cc_q75', 'cell_id', 'distil_ss', 'pert_idose', 'pert_itime'],
//       where: {
//         pert_id: {inq: options.ids},
//         cell_id: {inq: clue.CORE_CELL_LINES}
//       }
//     })).done(function (results) {
//
//     var x = [];
//     var y = [];
//     var cellIdToSeries = new morpheus.Map();
//     for (var i = 0; i < results.length; i++) {
//       var result = results[i];
//       var conc = morpheus.MolarConcentration.getMicroMolarConcentration(result.pert_idose);
//       result.conc = conc;
//
//     }
//     results.sort(function (item1, item2) {
//       var a = item1.conc;
//       var b = item2.conc;
//       return (a === b ? 0 : (a < b ? -1 : 1));
//     });
//     for (var i = 0; i < results.length; i++) {
//       var result = results[i];
//       var cell = result.cell_id;
//       var pert = result.pert_id;
//       var key = pert + ', ' + cell + ', ' + result.pert_itime;
//       var series = cellIdToSeries.get(key);
//       if (series === undefined) {
//         series = {
//           x: [],
//           y: [],
//           name: key,
//           mode: 'markers'
//         };
//         cellIdToSeries.set(key, series);
//       }
//
//       if (result.distil_cc_q75 == -666) {
//         continue;
//       }
//       var tas = Math.sqrt(result.distil_ss, Math.max(0, result.distil_cc_q75)) / Math.sqrt(978);
//       series.x.push(result.conc);
//       series.y.push(tas);
//     }
//
//     // dose by tas plot
//     var plotlyDefaults = clue.getPlotlyDefaults2();
//     var layout = plotlyDefaults.layout;
//     layout.width = 700;
//     layout.showlegend = true;
//     layout.margin.b = 80;
//     layout.height = 400;
//     var config = plotlyDefaults.config;
//     layout.xaxis.title = 'Dose \u00B5m';
//     layout.yaxis.title = 'CC';
//
//     morpheus.ChartTool.newPlot(options.$el[0], cellIdToSeries.values(), layout, config);
//   });
//
// }
// },
  ,
  {
    command: '/tas',
    input: [{name: exports.TYPE_PERT}],
    help: 'TAS scores of the specified perturbagens',
    home: '*DEV only* TAS scores of the specified perturbagens',
    show: function(options){
      var tas = require('Actions/tas.js');
      tas.show(options)}
  }
  ,
  {
    command: '/sar',
    help: 'Structural and transcriptional similarity of the specified perturbagens',
    home: '*DEV only* Structural and transcriptional similarity of the specified perturbagens',
    // can fail because not enough arguments given or invalid arguments given
    argsHelp: 'Typing <code>/sar perturbagen1 perturbagen2 perturbagen...</code> will' +
    ' show' +
    ' the' +
    ' structural' +
    ' and transcriptional similarity' +
    ' of the given compounds. <br />Typing /sar perturbagen1</code> will display' +
    ' the twenty' +
    ' most' +
    ' similar' +
    ' structures to the given perturbagen.',
    example: [
      {
        desc: 'View the structural and transcriptional similarity of CDK inhibitor',
        command: '"CDK inhibitor"'
      }, {
        command: 'imatinib',
        desc: 'View the structural and transcriptional similarity of the twenty most' +
        ' structurally' +
        ' similar' +
        ' compounds' +
        ' to imatinib'
      }],
    input: [
      {
        name: exports.TYPE_PERT,
        type: 'trt_cp',
        collection: ''
      }],

    one: function (id) {
      var deferred = $.Deferred();
      var p = morpheus.DatasetUtil.read(
        clue.API_URL + '/data-api/slice/?name=tanimoto_daylight&rfield=id&cfield=id&rquery=id:(' + id + ')').done(function (dataset) {
// show top 20 most similar
        var project = new morpheus.Project(dataset);
        project.setColumnSortKeys([new morpheus.SortByValuesKey([0], morpheus.SortKey.SortOrder.DESCENDING, true)],
          true);
        dataset = project.getSortedFilteredDataset();
        var ids = [];
        var idVector = dataset.getColumnMetadata().getByName('id');
        for (var i = 0; i < 20; i++) {
          ids.push(idVector.getValue(i));
        }
        deferred.resolve(ids);
      }).fail(function (err) {
        deferred.reject();
      });
      return deferred;
    },
    show: function(options){
      var sar = require('Actions/sar.js');
      sar.show(options);
    }
  }
  ,
  {
    command: '/target',
    input: [
      {
        name: exports.TYPE_PERT,
        type: 'trt_cp'
      }],
    help: 'View the targets of the specified compounds',
    home: 'View and download the gene target for small-molecule perturbagens, or all small-molecule perturbagens that match the entered search terms.',
    example: [
      {
        desc: 'View the targets of imatinib and hispidin',
        command: 'imatinib,hispidin'
      }, {
        desc: 'View the targets of compounds that target BRAF or TP53',
        command: 'BRAF,TP53'
      }, {
        desc: 'View the targets of all compounds that are androgren receptor agonist' +
        ' or antagonists',
        command: 'Androgen receptor agonist,Androgen receptor antagonist'
      }, {
        desc: 'View the targets of all compounds that target BRAF, are named imatinib,' +
        ' or are CDK inhibitors',
        command: 'BRAF,imatinib,CDK inhibitor'
      }],
    show: function(options){
      var target = require("Actions/target.js");
      return target.show(options);
    }
  }
  ,
  {
    command: '/moa',
    input: [
      {
        name: exports.TYPE_PERT,
        type: 'trt_cp'
      }],
    help: 'View the targets of the specified compounds',
    home: 'View and download the mechanism of action (MoA) for small-molecule perturbagens, or all small-molecule perturbagens that match the entered search terms.',
    example: [
      {
        desc: 'View the targets of imatinib and hispidin',
        command: 'imatinib,hispidin'
      }, {
        desc: 'View the targets of compounds that target BRAF or TP53',
        command: 'BRAF,TP53'
      }, {
        desc: 'View the targets of all compounds that are androgren receptor agonist' +
        ' or antagonists',
        command: 'Androgen receptor agonist,Androgen receptor antagonist'
      }, {
        desc: 'View the targets of all compounds that target BRAF, are named imatinib,' +
        ' or are CDK inhibitors',
        command: 'BRAF,imatinib,CDK inhibitor'
      }],
    show: function(options){
      var moa = require("Actions/moa.js");
      return moa.show(options);
    }
  }
  ,
  {
    command: '/assay',
    input: [
      {
        name: exports.TYPE_PERT,
        type: 'trt_cp'
      }],
    help: 'View the assays the specified compounds are profiled in',
    home: 'View and download the assays small-molecule perturbagens have been profiled in, or all small-molecule perturbagens that are profiled in certain assays.',
    example: [
      {
        desc: 'View the assays imatinib and hispidin are profiled in',
        command: 'imatinib,hispidin'
      }, {
        desc: 'View all assays that compounds profiled in P100 are profiled in',
        command: 'P100'
      }, {
        desc: 'View the assays all compounds that are androgren receptor agonist' +
        ' or antagonists are profiled in',
        command: 'Androgen receptor agonist,Androgen receptor antagonist'
      }, {
        desc: 'View the assays of all compounds that target BRAF, are named imatinib,' +
        ' or are CDK inhibitors are profiled in',
        command: 'BRAF,imatinib,CDK inhibitor'
      }],
    show: function(options){
      var assay = require("Actions/assay.js");
      return assay.show(options);
    }
  }
];

exports.actions.sort(function (a1, a2) {
  var a = a1.command;
  var b = a2.command;
  return (a === b ? 0 : (a < b ? -1 : 1));
});
