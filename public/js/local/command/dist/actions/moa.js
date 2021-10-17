exports.show = function(options) {
    var groupBy = require('Shared/groupBy.js');
    options.dbField = 'moa';
    options.lcField = 'MoA';
    options.capitalizedField = 'MoA';
    options.command = 'moa';
    groupBy.groupByShow(options);
};

exports.changeTabHeader = function(tabObject) {
    // var groupBy = require('Shared/groupBy.js');
    // groupBy.changeTabHeader(tabObject);
};

