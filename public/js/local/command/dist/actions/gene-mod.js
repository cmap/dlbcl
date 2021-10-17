exports.show = function(options) {
    exports.changeTabHeader(options.object);
    var d = $.Deferred();
    var zs = require('Shared/zs.js');
    zs.getZScoreDataset(null, options.ids.map(function (item) {
        return item.entrez_id;
    })).fail(function () {
        d.reject();
    }).done(function (dataset) {
        var html = [];
        html.push('<div class="col-xs-12">');
        html.push('</div>');
        var $el = $(html.join(''));
        $el.appendTo(options.$el);
        d.resolve();
        var items = [];
        for (var j = 0; j < dataset.getColumnCount(); j++) {
            items.push({
                j: j
            });
        }
        var pertNameVector = dataset.getColumnMetadata().getByName('pert_iname');
        var cellVector = dataset.getColumnMetadata().getByName('cell_id');
        var typeVector = dataset.getColumnMetadata().getByName('pert_type');
        var pertIdVector = dataset.getColumnMetadata().getByName('pert_id');
        var doseVector = dataset.getColumnMetadata().getByName('pert_idose');
        var ccVector = dataset.getColumnMetadata().getByName('distil_cc_q75');
        var ssVector = dataset.getColumnMetadata().getByName('distil_ss');
        var geneVector = dataset.getRowMetadata().getByName('pr_gene_symbol');
        var columns = [];
        morpheus.Util.seq(dataset.getRowCount()).forEach(function (i) {
            columns.push({
                name: geneVector.getValue(i),
                getter: function (item) {
                    return dataset.getValue(i, item.j);
                }
            });
        });

        columns = columns.concat([
            {
                field: 'pert_iname',
                name: 'Name',
                getter: function (item) {
                    return pertNameVector.getValue(item.j);
                }
            }, {
                field: 'cell_id',
                name: 'Cell',
                getter: function (item) {
                    return cellVector.getValue(item.j);
                }
            }, {
                field: 'pert_type',
                name: 'Type',
                getter: function (item) {
                    return typeVector.getValue(item.j);
                },
                renderer: function (item, value) {
                    if (value === 'trt_cp') {
                        return '<i class="text-center glyphicon glyphicon-adjust touchstone-cp"></i>';
                    } else if (value === 'trt_sh.cgs') {
                        return '<i class="text-center glyphicon glyphicon-minus-sign touchstone-kd"></i>';
                    } else if (value === 'trt_oe') {
                        return '<i class="text-center glyphicon glyphicon-plus-sign touchstone-oe"></i>';
                    } else {
                        return value;
                    }
                }
            }, {
                field: 'pert_id',
                name: 'Perturbagen Id',
                getter: function (item) {
                    return pertIdVector.getValue(item.j);
                }
            }, {
                field: 'pert_idose',
                name: 'Dose',
                getter: function (item) {
                    return doseVector.getValue(item.j);
                }
            }, {
                field: 'distil_cc_q75',
                name: 'Replicate Correlation',
                getter: function (item) {
                    return ccVector.getValue(item.j);
                }
            }, {
                field: 'distil_ss',
                name: 'Signature Strength',
                getter: function (item) {
                    return ssVector.getValue(item.j);
                }
            }]);
        var table = new tablelegs.Table({
            height: '412px',
            columnPicker: true,
            tableClass: 'slick-table slick-bordered-table slick-hover-table',
            select: false,
            search: true,
            export: true,
            $el: $el,
            columns: columns,
            items: items
        });
    });
    return d;
};

exports.changeTabHeader = function(tabObject) {
    $('#headerButtonRow').hide();
    $('#inputInterpretationDropdown').hide();
};