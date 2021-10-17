exports.show = function(options) {
    exports.changeTabHeader(options.object);
    var ids = options.ids;
    var $el = options.$el;
    var d = $.Deferred();
    var promises = [];
    var datasetFunctionsToInvoke;
    var columnDef = morpheus.DatasetUtil.annotate({
        annotations: [
            {
                file: 'https://s3.amazonaws.com/data.clue.io/cell/cell%20app%20all.xlsx',
                datasetField: 'ccle_id',
                fileField: 'CCLE Name'
            }],
        isColumns: true
    });
    columnDef.done(function (callbacks) {
        datasetFunctionsToInvoke = callbacks;
    });
    promises.push(columnDef);
    var p = morpheus.DatasetUtil.read(
        clue.API_URL + '/data-api/slice/?name=CCLE_GCP&cfield=CommonLineName&cfield=Lineage&rfield=id&rquery=id:(' +
        ids.join(' ') + ')&user_key=' + clue.USER_KEY);
    promises.push(p);
    var dataset;
    p.done(function (ds) {
        dataset = ds;
        var cellIdVector = ds.getColumnMetadata().add('ccle_id');
        var nameVector = ds.getColumnMetadata().getByName('CommonLineName');
        var lineageVector = ds.getColumnMetadata().getByName('Lineage');
        for (var i = 0; i < cellIdVector.size(); i++) {
            var name = nameVector.getValue(i);
            var lineage = lineageVector.getValue(i);
            name = name.replace(/[:;. -\/]/g, '');
            nameVector.setValue(i, name.toUpperCase());
            var id = name + '_' + lineage;
            id = id.toUpperCase();
            cellIdVector.setValue(i, id);
        }

    });
    $.when.apply($, promises).fail(function () {
        d.reject();
    }).done(function () {
        datasetFunctionsToInvoke.forEach(function (f) {
            f(dataset);
        });
        var nameVector = dataset.getColumnMetadata().getByName('CommonLineName');
        var lineageVector = dataset.getColumnMetadata().getByName('Lineage');
        var siteVector = dataset.getColumnMetadata().getByName('Primary Site');
        for (var i = 0; i < siteVector.size(); i++) {
            if (siteVector.getValue(i) == null) {
                console.log(nameVector.getValue(i) + '\t' + lineageVector.getValue(i));
            }
        }
        d.resolve();
    });
};

exports.changeTabHeader = function(tabObject) {
    $('#headerButtonRow').hide();
    $('#inputInterpretationDropdown').hide();
};