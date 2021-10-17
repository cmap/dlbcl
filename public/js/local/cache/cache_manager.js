//These are set for legacy purposes
var OLD_TOUCH_STONE_CACHE_KEYS = ["touchstone", "touchstone-v1.0", "touchstone-v1.1", "touchstone_latest","touchstone_old"];
var NEW_TOUCH_STONE_CACHE_KEY = "1.1.1.0";
var TOUCH_STONE_VERSION_KEY = "ts_version";
var hasWebstorage = false;


var latest_touchstone_filter = {
    include: {
        "relation": "pcls"
    },
    "fields": [
        "id",
        "pert_id",
        "cell_line_specificity",
        "pert_iname",
        "pert_icollection",
        "pert_type",
        "tas",
        "description",
        "gene_family",
        "moa",
        "target",
        "entrez_geneId"
    ],
    "where": {
        "pert_icollection": "TS_v1.1"
    }
};
var v1_touchstone_filter = {
    include: {
        "relation": "pclv1s"
    },
    "fields": [
        "id",
        "pert_id",
        "cell_line_specificity",
        "pert_iname",
        "pert_icollection",
        "pert_type",
        "tas",
        "description",
        "gene_family",
        "moa",
        "target",
        "entrez_geneId"
    ],
    "where": {
        "pert_icollection": "has_digest"
    }
};
if (typeof(Storage) !== "undefined") {
    if (isLocalStorageNameSupported()) {
        hasWebstorage = true;
        var localStorage = window.localStorage;
        //compare versions and remove as necessary
        for (var i = 0; i < OLD_TOUCH_STONE_CACHE_KEYS.length; i++) {
            localStorage.removeCacheItem(OLD_TOUCH_STONE_CACHE_KEYS[i]);
        }
    }
}


var refreshTSCache = function (version, callback) {
    if (!hasWebstorage) {
        return reloadTSData(version, false, callback);
    }
    var localStorage = window.localStorage;

    var old_version = localStorage.getCacheItem(TOUCH_STONE_VERSION_KEY);

    //clear the cache if the versions don't match
    if ((old_version && old_version !== NEW_TOUCH_STONE_CACHE_KEY) || (!old_version)) {
        localStorage.removeCacheItem(TOUCH_STONE_VERSION_KEY);
        localStorage.setCacheItem(TOUCH_STONE_VERSION_KEY, NEW_TOUCH_STONE_CACHE_KEY, {days: 1});
        reloadTSData(version, false, callback);
    } else {
        return reloadTSData(version, true, callback);
    }
}


var reloadTSData = function (version, existsInLocalStore, callback) {
    var localStorage = window.localStorage;
    if (hasWebstorage && existsInLocalStore && version === "latest") {

        var tsData = localStorage.getCacheItem(NEW_TOUCH_STONE_CACHE_KEY);
        if (tsData) {
            return callback(null, tsData);
        }
    }
    var url = clue.API_URL + '/api/perts?filter=' + JSON.stringify(v1_touchstone_filter);
    if (version === "latest") {
        url = clue.API_URL + '/api/perts?filter=' + JSON.stringify(latest_touchstone_filter);
    }
    $.ajax(url, {
        type: 'GET'
    }).done(function (list) {
        var nlist = "";
        try {
            var str = JSON.stringify(list);
            str = str.replace(/\"pclv1s\":/g, "\"pcls\":");
            nlist = JSON.parse(str);
            if (version === "latest") {
                localStorage.setCacheItem(NEW_TOUCH_STONE_CACHE_KEY, nlist, {days: 1});
            }
        } catch (e) {
            console.log("No local storage: " + e);
        }
        return callback(null, nlist);
    })
        .fail(function (err) {
            console.log('error: clue.getTouchStone');
            return callback('error: clue.getTouchStone', null);
        });

}

var refreshTSCacheCurrent = function (version, callback) {

    var url = clue.API_URL + '/api/perts?filter=' + JSON.stringify(v1_touchstone_filter);
    if (version === "latest") {
        url = clue.API_URL + '/api/perts?filter=' + JSON.stringify(latest_touchstone_filter);
    }
    $.ajax(url, {
        type: 'GET'
    })
        .done(function (list) {
            var nlist = "";
            try {
                var str = JSON.stringify(list);
                str = str.replace(/\"pclv1s\":/g, "\"pcls\":");
                nlist = JSON.parse(str);
                localStorage.setCacheItem(NEW_TOUCH_STONE_CACHE_KEY, nlist, {days: 1});
            } catch (e) {
                console.log("No local storage: " + e);
            }
            return callback(null, nlist);
        })
        .fail(function (err) {
            console.log('error: clue.getTouchStone');
            return callback('error: clue.getTouchStone', null);
        });
}
var reloadTSDataCurrent = function (version, existsInLocalStore, callback) {
    var url = clue.API_URL + '/api/perts?filter=' + JSON.stringify(v1_touchstone_filter);
    if (version === "latest") {
        url = clue.API_URL + '/api/perts?filter=' + JSON.stringify(latest_touchstone_filter);
    }
    $.ajax(url, {
        type: 'GET'
    }).done(function (list) {
        var nlist = "";
        try {
            var str = JSON.stringify(list);
            str = str.replace(/\"pclv1s\":/g, "\"pcls\":");
            nlist = JSON.parse(str);
            localStorage.setCacheItem(NEW_TOUCH_STONE_CACHE_KEY, nlist, {days: 1});

        } catch (e) {
            console.log("No local storage: " + e);
        }
        return callback(null, nlist);
    })
        .fail(function (err) {
            console.log('error: clue.getTouchStone');
            return callback('error: clue.getTouchStone', null);
        });
}
function isLocalStorageNameSupported() {
    var testKey = 'test', storage = window.localStorage;
    try {
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
}
