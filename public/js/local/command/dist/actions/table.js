// function doesn't work on dev.clue.io
exports.show = function(options) {
    exports.changeTabHeader(options.object);
    var args = options.ids;
    args[0] = args[0].toLowerCase();
    var fields = args[1];
    fields = fields.substring(1, fields.length - 1); // remove ()
    fields = fields.split(' ');
    var columns = fields.map(function (field) {
        return {
            field: field,
            name: field
        };
    });
    var inputNameToApi = {
        pert: 'perts',
        perts: 'perts',
        perturbagen: 'perturbagen',
        perturbagens: 'perturbagens',
        profile: 'profiles',
        profiles: 'profiles',
        sig: 'sigs',
        sigs: 'sigs',
        signature: 'sigs',
        signatures: 'sigs'
    };
    var queryTokens = args.slice(2);
    var d = $.Deferred();
    if (inputNameToApi[args[0]] !== undefined) {
        searchTerms.getSearchTerms(tokens, {type: 'pert'}, true).done(function (result) {
            var ids = result.ids;
            var filter = {
                fields: fields,
                where: {
                    pert_id: {inq: ids}
                }
            };
            var coll = inputNameToApi[args[0]];
            $.ajax(clue.API_URL + '/api/' + coll + '/?filter=' +
                JSON.stringify(filter)).fail(function () {
                d.reject();
            }).done(function (results) {
                if (results.length === 0) {
                    return d.reject('No matching perturbagens found.');
                }
                d.resolve();
                return new tablelegs.Table({
                    height: '412px',
                    columnPicker: true,
                    tableClass: 'slick-table slick-bordered-table slick-hover-table',
                    select: true,
                    search: true,
                    export: true,
                    rowHeight: 18,
                    $el: options.$el,
                    columns: columns,
                    items: results
                });
            });
        });
    } else {
        d.reject('First argument must be gene or pert');
    }
    return d;
//https://api.clue.io/explorer/resources
// definitions
};

exports.changeTabHeader = function(tabObject) {
    $('#headerButtonRow').hide();
    $('#inputInterpretationDropdown').hide();
};