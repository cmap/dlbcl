exports.show = function(options) {
    var groupBy = require('Shared/groupBy.js');
    options.dbField = 'target';
    options.lcField = 'target';
    options.capitalizedField = 'Target';
    options.command = 'target';
    groupBy.groupByShow(options);
};

exports.changeTabHeader = function(tabObject) {
    // var groupBy = require('Shared/groupBy.js');
    // groupBy.changeTabHeader(tabObject);


};