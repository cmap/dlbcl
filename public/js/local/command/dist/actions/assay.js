exports.show = function(options) {
    var groupBy = require('Shared/groupBy.js');
    options.dbField = 'pert_icollection';
    options.lcField = 'assay';
    options.capitalizedField = 'Assay';
    options.command = 'assay';
    groupBy.groupByShow(options);
};

exports.changeTabHeader = function(tabObject) {
    // var groupBy = require('Shared/groupBy.js');
    // groupBy.changeTabHeader(tabObject);
};

