//sig, gene-mod
var GENE_INFO_LINES = null;

exports.getZScoreDataset = function (sigIds, geneIds) {
    var d = $.Deferred();
    if (sigIds != null && sigIds.length > 100) {
        return d.reject('Maximum of 100 signatures allowed.');
    }

    var promises = [];
    var sigIdFields = [
        'cell_id',
        'pert_id',
        'pert_iname',
        'pert_type',
        'pert_idose',
        'pert_itime',
        'distil_cc_q75',
        'distil_ss'];
    var sigIdToObject = new morpheus.Map();

    if (sigIds != null) {
        var sigFilter = {
            fields: ['sig_id'].concat(sigIdFields),
            where: {
                sig_id: {inq: sigIds}
            }
        };
        promises.push($.ajax(clue.API_URL + '/api/sigs?filter=' + JSON.stringify(sigFilter)).done(function (results) {
            for (var i = 0; i < results.length; i++) {
                sigIdToObject.set(results[i].sig_id, results[i]);
            }
        }));
    } else {
        var skip = 0;
        var sigDef = $.Deferred();
        promises.push(sigDef);
        sigIds = [];
        var batchSize = 200000;
        var getMoreSigs = function () {
            var sigFilter = {
                fields: ['sig_id'].concat(sigIdFields),
                limit: batchSize,
                skip: skip
            };
            $.ajax(clue.API_URL + '/api/sigs?filter=' + JSON.stringify(sigFilter)).done(function (results) {
                for (var i = 0; i < results.length; i++) {
                    sigIds.push(results[i].sig_id);
                    sigIdToObject.set(results[i].sig_id, results[i]);
                }
                skip += results.length;
                if (results.length < batchSize) {
                    sigDef.resolve();
                } else {
                    setTimeout(getMoreSigs, 1000);
                }
            }).fail(function () {
                console.log('Error downloading signatures.');
                return d.reject('Error downloading data. Please try again.');
            });
        };
        getMoreSigs();
    }

    if (GENE_INFO_LINES == null) {
        // pr_id   pr_gene_id      pr_gene_symbol  pr_gene_title   pr_is_lm        pr_is_bing      self_correlatio
        promises.push($.ajax('https://s3.amazonaws.com/data.clue.io/l1kaig.chip').done(function (text) {
            GENE_INFO_LINES = text.split('\n');
        }));
    }
    $.when.apply($, promises).fail(function () {
        d.reject('Error downloading data. Please try again.');
    }).done(function () {
        if (geneIds != null) { // get pr_id for array of symbols
            var tab = /\t/;
            // convert symbols to affy probe ids
            var geneSymbolsSet = new morpheus.Set();
            geneIds.forEach(function (id) {
                geneSymbolsSet.add(id);
            });
            var header = GENE_INFO_LINES[0].split(tab);
            var symbolColumn = header.indexOf('pr_gene_symbol');
            var lmColumn = header.indexOf('pr_is_lm');
            geneIds = [];
            for (var i = 0; i < GENE_INFO_LINES.length; i++) {
                var row = GENE_INFO_LINES[i].split(tab);
                if (geneSymbolsSet.has(row[symbolColumn]) && row[lmColumn] == '1') {
                    geneIds.push(row[0]);
                }
            }
        }

        if (geneIds == null) {
            var sigIdStart = 0; // split into batches
            var batchSize = 80;
            var sigIdEnd = Math.min(batchSize, sigIds.length);
            var datasets = [];
            var batchDeferred = $.Deferred();

            var getDataByIds = function () {
                sigIdEnd = Math.min(sigIdEnd, sigIds.length);
                var sigIdString = sigIds.slice(sigIdStart, sigIdEnd).join(' ');
                var ds = morpheus.DatasetUtil.read(
                    clue.API_URL + '/data-api/slice/?name=modzs&cquery=id:(' + encodeURIComponent(sigIdString) + ')');
                ds.then(function (dataset) {
                    datasets.push(dataset);
                    sigIdStart = sigIdEnd;
                    sigIdEnd += batchSize;
                    d.notify(sigIdEnd / sigIds.length);
                    if (sigIdEnd < sigIds.length) {
                        getDataByIds();
                    }
                    else {
                        batchDeferred.resolve();
                    }

                }).catch(function (ee) {
                    console.log(ee)
                    return d.reject('Error downloading data. Please try again.');
                });

            };
            getDataByIds();
        } else {
            var start = 0; // split into batches
            var end = 20000;
            var nsigs = sigIds.length;
            var datasets = [];
            var batchDeferred = $.Deferred();
            var numRetrieved = 0;
            var getData = function () {
                var ds = morpheus.DatasetUtil.read(
                    clue.API_URL + '/data-api/slice/?name=modzs&cquery=INDEX:' + start + '..' + end + '&rquery=id:(' +
                    encodeURIComponent(geneIds.join(' ') + ')'));
                ds.then(function (dataset) {
                    datasets.push(dataset);
                    numRetrieved += dataset.getColumnCount();
                    start += dataset.getColumnCount();
                    end += dataset.getColumnCount();
                    console.log('got nsigs ' + numRetrieved + ' out of ' + nsigs);
                    if (numRetrieved < nsigs) {
                        setTimeout(getData, 1000);
                    } else {
                        batchDeferred.resolve();
                    }

                }).catch(function (ee) {
                    console.log(ee);
                    return d.reject('Error downloading data. Please try again.');
                });

            };
            getData();
        }
        batchDeferred.fail(function () {
            d.reject('Error downloading data. Please try again.');
        });
        batchDeferred.done(function () {
            var dataset;
            if (datasets.length > 1) {
                for (var i = 0; i < datasets.length; i++) {
                    datasets[i] = new morpheus.TransposedDatasetView(datasets[i]);
                }
                var dataset = new morpheus.JoinedDataset(datasets[0], datasets[1]);
                for (var i = 2; i < datasets.length; i++) {
                    dataset = new morpheus.JoinedDataset(dataset,
                        datasets[i]);
                }
                dataset = new morpheus.TransposedDatasetView(dataset);
            } else {
                dataset = datasets[0];
            }

            // annotate sig ids on columns
            var columnIdVector = dataset.getColumnMetadata().get(0);
            var vectors = [];
            for (var i = 0; i < sigIdFields.length; i++) {
                vectors.push(dataset.getColumnMetadata().add(sigIdFields[i]));
            }

            for (var i = 0; i < columnIdVector.size(); i++) {
                var sig = sigIdToObject.get(columnIdVector.getValue(i));
                if (sig != null) {
                    for (var j = 0; j < vectors.length; j++) {
                        vectors[j].setValue(i, sig[sigIdFields[j]]);
                    }
                }
            }
            // row ids are entrez ids

            const opts = {};
            opts.dataset = dataset;
            opts.fileColumnNamesToInclude = null;
            opts.lines = GENE_INFO_LINES;
            opts.isColumns = false;
            opts.sets = null;
            opts.metadataName = 'id';
            opts.fileColumnName = 'pr_gene_id';
            new morpheus.OpenFileTool().annotate(opts);

            var geneSpaceVector = dataset.getRowMetadata().add('gene_space');
            var geneIdVector = dataset.getRowMetadata().getByName('pr_gene_id');
            var isLmVector = dataset.getRowMetadata().getByName('pr_is_lm');
            var isBingVector = dataset.getRowMetadata().getByName('pr_is_bing');
            var geneSymbolVector = dataset.getRowMetadata().getByName('pr_gene_symbol');
            dataset.getRowMetadata().remove(morpheus.MetadataUtil.indexOf(dataset.getRowMetadata(), 'pr_id'));
            for (var i = 0, nrows = geneSpaceVector.size(); i < nrows; i++) {

                if (geneSymbolVector.getValue(i) != null) {
                    var space = 'inferred';
                    if (isLmVector.getValue(i) == '1') {
                        space = 'landmark';
                    } else if (isBingVector.getValue(i) == '1') {
                        space = 'well inferred';
                    }
                    geneSpaceVector.setValue(i, space);
                }
            }
            d.resolve(dataset);

        });
    });
    return d;
};