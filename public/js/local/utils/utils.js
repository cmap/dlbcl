

class Utils {

    static evalListLength(list, op, num, updown, errors)
    {
        if(op === "<")
        {
            if(list.length < num)
            {
                errors.push(updown + "-regulated collection contains less than " + num + " lists.");
            }
        }
        else if (op === ">")
        {
            if(list.length > num)
            {
                errors.push(updown + "-regulated collection contains more than " + num + " lists.");
            }
        }
        return errors;
    }

    static evalListItemLength(item, op, num, errors)
    {
        if(op === "<")
        {
            if(item.data.length < num)
            {
                errors.push("List named " + item.name + " contains less than " + num + " genes.");
            }
        }
        else if(op === ">")
        {
            if(item.data.length > num)
            {
                errors.push("List named " + item.name + " contains more than " + num + " genes.");
            }
        }
        return errors;
    }

    static dragover_handler(ev, context) {
        // Prevent default select and drag behavior
        ev.preventDefault();
        if(context)
        {
            $(context).find(".drag-over-form").addClass("drop-over");
        }
        else
        {
            $(".drag-over-form").addClass("drop-over");
        }
    }

    //specifically for proteomics query, combine/make generic later
    static dragover_handlerGCT(ev, context) {
        // Prevent default select and drag behavior
        ev.preventDefault();
        if(context)
        {
            $(context).find(".drag-over-formGCT").addClass("drop-over");
        }
        else
        {
            $(".drag-over-formGCT").addClass("drop-over");
        }
    }

    static dragend_handler(ev) {
        // Remove all of the drag data
        const dt = ev.dataTransfer;
        if (dt.items) {
            // Use DataTransferItemList interface to remove the drag data
            for (let i = 0; i < dt.items.length; i++) {
                dt.items.remove(i);
            }
        } else {
            // Use DataTransfer interface to remove the drag data
            ev.dataTransfer.clearData();
        }
    }

    static readGMXData(file, callback) {
        const reader = new FileReader();
        const payload = [];
        reader.onload = function (e) {
            const data = reader.result;
            const lines = data.trim().split('\n');
            const headers = lines[0].split("\t");
            for(let line = 0; line < lines.length; line++){
                const line2 = lines[line];
                const split = line2.split("\t");
                payload.push(split);
            }
            const transposedPayload =  _.zip.apply(_, payload);
            return callback(null, transposedPayload);
        }
        if (file) {
            reader.readAsText(file);
        } else {
            return callback("No file found");
        }
    }

    static handleMultiLists(options,next){
        if(options.post && options.gmtErrors.warnings && options.gmtErrors.warnings.length !== 0)
        {
            return next(options.gmtErrors, options.gmtCount, options.totalGMTCount);
        }
        else
        {

            async.forEach(options.lists, function (list, callback) {
                if(options.post)
                {
                    postGMT(list, function (err, success) {
                        if (err) {
                            options.gmtErrors.warnings.push(err);
                        }
                        else {
                            options.gmtCount ++;
                        }
                        callback();
                    });
                }
                else
                {
                    options.gmtCount ++;
                    callback();
                }
            }, function (error) {
                if (error !== null) {
                    options.gmtErrors.warnings.push(error);
                }
                return next(options.gmtErrors, options.gmtCount, options.totalGMTCount);
            });
        }
    }

    /**
     * TODO: Map should already be in this class, since it is a static resource
     * @param id
     * @param map
     * @returns {*}
     */

    static getProbesetId(id, map) {
        id = id.toUpperCase();
        const item = map[id];
        if (item !== undefined && item !== '0') {
            return {
                id: item,
                valid: true
            };
        } else if(item==='0') {
            return {
                id: item,
                valid: false
            }
        } else {
            return {
                id: item,
                valid: false
            }
        }
    }

    static getCellsetId(id, map) {
        id = id.toUpperCase();
        const item = map[id];
        if (item && item !== undefined) {
            return {
                id: item,
                valid: true
            };
        } else {
            return {
                id: item,
                valid: false
            }
        }
    }

    static gatherListmakerTags(data, callback)
    {
        const setOfTags = new Set();
        const tagNames = [];
        async.forEach(data, function (datum, cb) {
                const tags = datum.tags;
                if (tags && tags.length > 0) {
                    for (let tag of tags) {
                        if (!setOfTags.has(tag)) {
                            setOfTags.add(tag);
                            const tagsJSON = {
                                "id": tag,
                                "text": tag
                            };
                            tagNames.push(tagsJSON);
                        }
                    }
                }
                return cb();
            },
            function (err) {
                if (err) {
                    return callback(err);
                }
                return callback(null, tagNames);
            });
    }

    static gatherListmakerCollections(data, callback)
    {
        const collectionIds = new Set();
        const collectionNames = [];
        async.forEach(data, function (datum, cb) {
                const collection = datum.collection;

                const collection_name = collection.name;
                const collection_id = collection.id;

                if (!collectionIds.has(collection_id.toLowerCase())) {
                    collectionIds.add(collection_id.toLowerCase());
                    const collectionJSON = {
                        "id": collection_id,
                        "text": collection_name
                    };
                    collectionNames.push(collectionJSON);
                }
                return cb();
            },
            function (err) {
                if (err) {
                    return callback(err);
                }
                return callback(null, collectionNames);
            });
    }

    static populateListmakerCollectionsAndTags(payload)
    {
        $('.collectionSelect').select2({
            createTag: function (params) {
                const term = $.trim(params.term);
                if (term === '') {
                    return null;
                }
                const id = (term.toLowerCase() + Math.random()).replace("0.", "_").replace(/ /g,"_");
                return {
                    id: id,
                    text: term,
                    newTag: true // add additional parameters
                }
            },
            data: payload.collections,
            tags: true
        });

        $('.tagSelects').select2({
            placeholder: "Tags",
            tags: true,
            data: payload.tags,
            tokenSeparators: [',']
        });
    }

    /**
     *
     * The types of lists that CLUE users can create
     * @returns {*[]}
     *
     */
    static getListTypes() {
        return [
            {id: "Perturbagen", text: "Perturbagen (gene and compound)", icon_class: "fa fa-dot-circle-o", color: "#FF1212"},
            {id: "Compound", text: "Compound", icon_class: "fa fa-adjust", color: "#F5A623"},
            {id: "Gene", text: "Gene", icon_class: "fa fa-asterisk", color: "#54128E"},
            {id: "CMap class", text: "CMap class", icon_class: "fa fa-stop fa-cmap-class", color: "#005D99"},
            {id: "Mechanism of Action", text: "Mechanism of Action", icon_class: "fa fa-square-o fa-cmap-class fa-stroked", color: "#005D99 !important"},
            {id: "Cell line", text: "Cell line", icon_class: "fa fa-circle-o", color: " #50B003"},
            {id: "Dose", text: "Dose", icon_class: "fa fa-eyedropper", color: "#67B2B3"},
            {id: "Signature", text: "Signature", icon_class: "fa fa-barcode", color: "#A70000"},
            {id: "Other", text: "Other", icon_class: "fa fa-circle", color: "#5D5D5D"}
        ];
    }

    static openProjectButton(obj) {
        const name = $(obj).data("name");
        const dataset = $(obj).data("dataset");
        const prj = _.findWhere(projectLibrary.projects, {"code": name});
        openDataProject(prj, dataset);
    }
    /**
     *
     * @param label
     * @returns {string}
     */
    static capitalize(label) {
        return label.charAt(0).toUpperCase() + label.slice(1);
    }
    /**
     * Format the given cell as a date
     *
     * @param dateValue
     *
     */
    static dateFormatter(dateValue) {
        const dateFormat = d3.time.format('%m/%d/%y');
        const date = new Date(dateValue);
        return dateFormat(date);
    }
    /**
     *
     * @param item
     * @param filterParams
     * @returns {*}
     */
    static customFilterSearch(item, filterParams) {
        const text = filterParams.search;
        if (text && text.trim()) {
            const columnNames = _.pluck(filterParams.columns, "field");
            const tokens = morpheus.Util.getAutocompleteTokens(text);
            const predicates = morpheus.Util.createSearchPredicates({
                tokens: tokens,
                fields: columnNames,
                caseSensitive: false
            });
            return Utils.searchWithPredicates(predicates, filterParams.columns, item);
        }
        return true;
    }

    /**
     *
     * @param value
     * @returns {*}
     */
    static inferDataType(value) {
        if (value) { // 1st non-null
            if (Array.isArray(value) && value.length === 0) {
                return null;
            }
            return morpheus.Util.getDataType(value);
        }
        return null;

    }

    /**
     * TODO: Fix me find out what c.getter does and stub it here
     * @param columns
     */
    static inferDataTypes(columns) {
        columns.forEach(function (c) {
            if (c.dataType == null) {
                for (let i = 0, nitems = items.length; i < nitems; i++) {
                    //TODO: Fix me
                    const value = c.getter(items[i]);
                    const dataType = inferDataType(value);
                    if (dataType) {
                        c.dataType = dataType;
                        break;
                    }
                }
            }

        });
    }

    /**
     *
     * @param field
     * @param quotedField
     * @returns {{class: string, value: string, label: string, show: boolean}}
     */
    static handleNonStringDataTypes(field, quotedField) {
        return {
            class: 'search-qualifier',
            value: quotedField + ':',
            label: '<span class="search-qualifier-field">' + field
            + ':</span><span class="search-qualifier-range">min..max</span>',
            show: true
        }
    }

    /**
     *
     * @param field
     * @param quotedField
     * @param showAll
     * @returns {*}
     */
    static handleStringDataTypes(field, quotedField, showAll) {
        if (showAll) {
            return {
                class: 'search-qualifier',
                value: quotedField + ':',
                showAll: quotedField + ':*',
                label: '<span class="search-qualifier-field">' + field
                + ':</span><span data-autocomplete="showAll"' +
                ' class="search-qualifier-show-all">Show all</span>',
                show: true
            };
        }
        return {
            class: 'search-qualifier',
            value: quotedField + ':',
            label: '<span class="search-qualifier-field">' + field
            + ':</span>',
            show: true
        };
    }

    /**
     *
     * @param field
     * @param dataType
     * @param showAll
     * @returns {*}
     */
    static handleQuotedField(field, dataType, showAll) {
        let quotedField = field;
        if (quotedField.indexOf(' ') !== -1) {
            quotedField = '"' + quotedField + '"';
        }
        if (dataType === 'string' || dataType === '[string]') {
            return Utils.handleStringDataTypes(field, quotedField, showAll);
        }
        return Utils.handleNonStringDataTypes(field, quotedField);
    }

    /**
     *
     * @param columns
     * @returns {Array}
     */
    static handleQuotedFields(columns) {
        const matches = [];
        columns.forEach(function (c) {
            matches.push(Utils.handleQuotedField(c.name, c.dataType, c.showAll));
        });
        return matches;
    }

    /**
     *
     * @param columns
     * @returns {Array}
     */
    static handleSingleToken(columns) {
        // autocomplete field names only
        if (columns.length <= 1) {
            return [];
        }
        const matches = Utils.handleQuotedFields(columns);
        matches
            .sort(function (m1, m2) {
                const a = m1.value.toLowerCase();
                const b = m2.value.toLowerCase();
                return (a === b ? 0 : (a < b ? -1 : 1));
            });
        return matches;
    }
    static autocomplete(tokens,columns, items,callback) {

        let token = tokens != null && tokens.length > 0 ? tokens[tokens.selectionStartIndex] : '';
        token = $.trim(token);
        let showFieldName = columns.length > 1;
        // filter numeric columns
        Utils.inferDataTypes(columns);

        if (token === '' || token.length < 2) {
            return callback(null,Utils.handleSingleToken(columns));
        }

        let ncolumns = columns.length;
        let field = null;
        const semi = token.indexOf(':');
        let regex = new RegExp(morpheus.Util.escapeRegex(token), 'i');
        let fieldSearch = false;
        const columnNameToColumn = new morpheus.Map();
        const fieldNameToMatches = new morpheus.Map();

        columns.forEach(function (column) {
            columnNameToColumn.set(column.name.toLowerCase(), column);
            fieldNameToMatches.set(column.name, new morpheus.Set())
        });


        if (semi > 0) { // field search?
            if (token.charCodeAt(semi - 1) !== 92) { // \:
                // one of available fields
                let possibleToken = $.trim(token.substring(semi + 1));
                // check for "field":"val" and "field:val"
                let possibleField = $.trim(token.substring(0, semi)); // split
                // on :
                if (possibleField.length > 0
                    && possibleField[0] === '"'
                    && possibleField[possibleField.length - 1] === '"') {
                    possibleField = possibleField.substring(1,
                        possibleField.length - 1);
                } else if (possibleField.length > 0
                    && possibleField[0] === '"'
                    && possibleToken[possibleToken.length - 1] === '"'
                    && possibleToken[0] !== '"') {
                    possibleField = possibleField.substring(1,
                        possibleField.length);
                    possibleToken = '"' + possibleToken;

                }

                const c = columnNameToColumn.get(possibleField.toLowerCase());
                if (c !== undefined) {
                    token = possibleToken;
                    field = possibleField;
                    fieldSearch = true;
                    // limit to searching this field only
                    columns = [c];
                }
            }
        } else if (ncolumns > 1) {
            // test field names
            for (let j = 0; j < ncolumns; j++) {
                let field = columns[j].name;
                if (regex.test(field)) {
                    let matchesSet = fieldNameToMatches.get(field);
                    matchesSet.show = true;
                }
            }
        }
        const filteredColumns = [];
        for (let i = 0; i < columns.length; i++) {
            const c = columns[i];
            if (c.dataType === 'string' || c.dataType === '[string]') {
                filteredColumns.push(c);
            }
        }
        regex = new RegExp(morpheus.Util.escapeRegex(token), 'i');

        columns = filteredColumns;
        ncolumns = columns.length;

        function formatResponse() {
            let matches = [];
            let isShowAll = token === '*';
            const replaceRegex = new RegExp('(' + morpheus.Util.escapeRegex(token) + ')', 'i');
            fieldNameToMatches.forEach(function (matchesSet, field) {
                if (matchesSet.show || matchesSet.size() > 0) {

                    const column = columnNameToColumn.get(field.toLowerCase());
                    let quotedField = field;
                    if (quotedField.indexOf(' ') !== -1) {
                        quotedField = '"' + quotedField + '"';
                    }

                    if (showFieldName) {
                        if (column.dataType === 'string' || column.dataType === '[string]') {
                            if (column.showAll && isShowAll) {
                                matches.push({
                                    class: 'search-qualifier',
                                    value: quotedField + ':',
                                    label: '<span class="search-qualifier-field">' + field
                                    + ':</span>',
                                    show: true
                                });
                            } else {
                                matches.push({
                                    class: 'search-qualifier',
                                    value: quotedField + ':',
                                    label: '<span class="search-qualifier-field">' + field
                                    + ':</span>',
                                    show: true
                                });
                            }

                        } else {
                            matches.push({
                                class: 'search-qualifier',
                                value: quotedField + ':',
                                label: '<span class="search-qualifier-field">' + field
                                + ':</span><span class="search-qualifier-range">min..max</span>',
                                show: true
                            });
                        }
                    }
                    const fieldMatches = [];
                    matchesSet.forEach(function (val) {
                        let quotedValue = val;
                        if (quotedValue != null && quotedValue.indexOf(' ') !== -1) {
                            quotedValue = '"' + quotedValue + '"';
                        }
                        fieldMatches
                            .push({
                                _v: val,
                                value: showFieldName ? (quotedField + ':' + quotedValue)
                                    : quotedValue,
                                label: '<span>'
                                + val.replace(replaceRegex, '<b>$1</b>') + '</span>'
                            });
                    });
                    fieldMatches
                        .sort(function (m1, m2) {
                            const a = m1._v.toLowerCase();
                            const b = m2._v.toLowerCase();
                            return (a === b ? 0
                                : (a < b ? -1 : 1));
                        });

                    matches = matches.concat(fieldMatches);
                }
            });
            callback(null,matches);
        }

        let nmatches = 0;
        const maxSize = ncolumns === 1 && token === '*' ? Number.MAX_VALUE : 10;
        for (let i = 0, nitems = items.length; i < nitems; i++) {
            const item = items[i];
            for (let j = 0; j < ncolumns; j++) {
                const column = columns[j];
                const field = column.name;
                const matchesSet = fieldNameToMatches.get(field);
                const value = item[column.name];
                if (column.dataType === '[string]') {
                    const nvalues = value == null ? 0 : value.length;
                    for (let k = 0; k < nvalues; k++) {
                        const val = value[k];
                        if (regex.test(val) && !matchesSet.has(val)) {
                            matchesSet.add(val);
                            nmatches++;
                            if (nmatches === maxSize) {
                                return formatResponse();
                            }
                        }
                    }
                } else {
                    if (value != null && regex.test(value) && !matchesSet.has(value)) {
                        matchesSet.add(value);
                        nmatches++;
                        if (nmatches === maxSize) {
                            return formatResponse();
                        }
                    }
                }
            }
        }
        return formatResponse();
    }


    /**
     *
     * @param predicates
     * @param columns
     * @param row
     * @returns {boolean}
     */
    static searchWithPredicates(predicates, columns,row) {

        const columnNameToColumn = new morpheus.Map();
        columns.forEach(function (column) {
            columnNameToColumn.set(column.field.toLowerCase(), column);
        });
        const filteredPredicates = Utils.getFilteredPredicates(columnNameToColumn, predicates);
        return Utils.findWithPredicates(row, filteredPredicates,columns);
    }

    /**
     *
     * @param columnNameToColumn
     * @param predicates
     * @returns {Array}
     */
    static getFilteredPredicates(columnNameToColumn, predicates) {
        const filteredPredicates = [];
        predicates.forEach(function (predicate) {
            const filterColumnName = predicate.getField();
            const filteredPredicate = Utils.getFilteredPredicate(columnNameToColumn, filterColumnName, predicate);
            if (filteredPredicate) {
                filteredPredicates.push(filteredPredicate);
            }
        });
        return filteredPredicates;
    }

    /**
     *
     * @param columnNameToColumn
     * @param filterColumnName
     * @param predicate
     * @returns {*}
     */
    static getFilteredPredicate(columnNameToColumn, filterColumnName, predicate) {
        if (filterColumnName != null) {
            const column = columnNameToColumn.get(filterColumnName.toLowerCase());
            if (column) {
                predicate.column = column;
                return predicate;
            }
        } else {
            return predicate;
        }
        return null;
    }

    /**
     *
     * @param row
     * @param predicates
     * @param columns
     * @returns {boolean}
     */
    static findWithPredicates(row, predicates,columns) {
        const finalResults = [];
        for (let p = 0; p < predicates.length; p++) {
            const predicate = predicates[p];
            let searchColumns;
            if (predicate.column) {
                searchColumns = [predicate.column];
            } else {
                searchColumns = columns;
            }
            finalResults.push(Utils.findWithPredicate(row, searchColumns, predicate));
        }
        const columnList = _.uniq(_.pluck(finalResults, "field"));
        const finalResultCheck = new Map();
        for (let i = 0; i < columnList.length; i++)
        {
            finalResultCheck.set(columnList[i], "f");
        }
        for (let i = 0; i < finalResults.length; i++)
        {
            const item = finalResults[i];
            if(item.found === "t")
            {
                finalResultCheck.set(item.field, "t");
            }
        }
        const finalResultCheckValues = Array.from(finalResultCheck.values());
        if (finalResultCheckValues.indexOf("f") < 0) {
            return true;
        }
        return false;
    }

    static findWithPredicate(row, searchColumns, predicate) {
        const results = {field: predicate.field, found: "f"};
        for (let j = 0, ncolumns = searchColumns.length; j < ncolumns; j++) {
            const value = row[searchColumns[j].field];
            if (Utils.findSingleWithPredicate(value, predicate)) {
                results.found = "t";
            }
        }
        return results;
    }

    /**
     *
     * @param value
     * @param predicate
     * @returns {boolean}
     */
    static findSingleWithPredicate(value, predicate) {
        if (morpheus.Util.isArray(value) && Utils.handleArrayValuesToGetPredicates(predicate, value)) {
            return true;
        } else {
            if (predicate.accept(value)) {
                return true;
            }
        }
        return false;
    }

    /**
     *
     * @param predicate
     * @param valueArrays
     * @returns {boolean}
     */
    static handleArrayValuesToGetPredicates(predicate, valueArrays) {
        for (let i = 0; i < valueArrays.length; i++) {
            if (predicate.accept(valueArrays[i])) {
                return true;
            }
        }
        return false;
    }
    static loadRoleMembers(elem) {
        $(".member-label").text($(elem).data("role"));
        $("#memberList").empty();
        return  callback();
    }
}
//Allows us to use both in browser and in mocha tests
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
        Utils: Utils,
        morpheus: require("../../lib/morpheus")
    };
}
else {
    window.Utils = Utils;
}