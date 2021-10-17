exports.show = function(options) {
    exports.changeTabHeader(options.object);
    var d = $.Deferred();
    var ids = options.ids;
    var promises = [];
    // group_id: "CP_ATPASE_INHIBITOR",
    // name: "ATPase Inhibitor (CP)",
    // perts: [
    // {
    //   pert_id: "BRD-A93236127"
    // },

    var filter = {
        include: {
            relation: 'perts',
            scope: {field: ['pert_id']}
        }
    };
    if (ids.length > 0) {
        filter.include.scope.where = {pert_id: {inq: ids}};
    }
    // ?filter={%22include%22:{%22relation%22:%22perts%22,%22scope%22:{%22fields%22:[%22pert_id%22],%20%22where%22:{%22pert_id%22:%22BRD-A93236127%22}}}}
    var p = $.ajax(clue.API_URL + '/api/pcls/?filter=' + JSON.stringify(filter) + '&version=1');

    p.done(function (results) {
        // remove results with no perts
        results = results.filter(function (result) {
            return result.perts && result.perts.length > 0;
        });
        if (results.length === 0) {
            return d.reject('No PCLs found.');
        }
        d.resolve();
        var cardId = _.uniqueId('clue');
        var $center = $('<div class="col-md-7 col-lg-8 col-sm-6 col-xs-12"></div>');
        var $right = $('<div id="' + cardId + '" class="col-md-4 col-lg-3 col-sm-6 col-xs-12"></div>');
        // by PCL
        $center.appendTo(options.$el);
        $right.appendTo(options.$el);
        var table = new tablelegs.Table({
            height: '412px',
            columnPicker: true,
            tableClass: 'slick-table slick-bordered-table slick-hover-table',
            select: true,
            search: true,
            export: false,
            $el: $center,
            columns: [
                {
                    getter: function (item) {
                        var name = item.name;
                        var index = name.lastIndexOf('(');
                        return name.substring(0, index);
                    },
                    name: 'Name'
                }, {
                    getter: function (item) {
                        var name = item.name;
                        var index = name.lastIndexOf('(');
                        return name.substring(index + 1, name.length - 1);
                    },
                    name: 'Type',
                    renderer: function (item, value) {
                        if (value === 'CP') {
                            return '<i class="text-center glyphicon glyphicon-adjust touchstone-cp"></i>';
                        } else if (value === 'KD') {
                            return '<i class="text-center glyphicon glyphicon-minus-sign touchstone-kd"></i>';
                        } else if (value === 'OE') {
                            return '<i class="text-center glyphicon glyphicon-plus-sign touchstone-oe"></i>';
                        } else {
                            return value;
                        }
                    }
                }],
            items: results
        });
        table.on('selectionChanged',
            function (e) {
                var selectedRows = e.selectedRows;
                if (selectedRows.length === 1) {
                    var selectedItem = table.getItems()[selectedRows[0]];
                    if (selectedItem) {
                        /* $.pjax({
                            push: false,
                            url: '/cards/cmap-class/' + selectedItem.group_id + '?version=blah',
                            container: '#' + cardId
                        }); */
                        getCard('/cards/cmap-class/' + selectedItem.group_id + '?version=blah', '#' + cardId);
                    }
                }
            });

    });
    return d;
};

exports.changeTabHeader = function(tabObject) {
    $('#headerButtonRow').hide();
    $('#inputInterpretationDropdown').hide();
};