if (typeof clue === 'undefined') {
    clue = {};
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = clue; // Node
}
clue.USER_KEY = null;

clue.usingTempKey = false;

clue.CORE_CELL_LINES = [
    'A375', 'A549', 'HA1E', 'HCC515', 'HEPG2', 'HT29',
    'MCF7', 'PC3', 'VCAP'];

clue.PROTEOMICS_CELL_LINES = [
  'A375', 'A549', 'MCF7', 'NPC', 'PC3', 'YAPC'];

clue.CORE_CELL_LINES_LINEAGE = {
  'A375':'SKIN', 'A549':'LUNG', 'HA1E':'KIDNEY', 'HCC515':'LUNG', 'HEPG2':'LIVER', 'HT29':'LARGE_INTESTINE',
  'MCF7':'BREAST', 'NPC':'CNS', 'PC3':'PROSTATE', 'VCAP':'PROSTATE', 'YAPC':'PANCREAS'};

clue.CORE_CELL_LINES_CCLE = ['A375_SKIN', 'A549_LUNG', 'HA1E_KIDNEY', 'HCC515_LUNG', 'HEPG2_LIVER', 'HT29_LARGE_INTESTINE', 'MCF7_BREAST', 'PC3_PROSTATE', 'VCAP_PROSTATE'];

$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
    if (clue.USER_KEY != null && options.url.indexOf(clue.API_URL) === 0) {
        //	jqXHR.setRequestHeader('user_id', clue.getUserName());
        jqXHR.setRequestHeader('user_key', clue.USER_KEY);
    }
});
clue.analytics = function () {
    if (window.location.hostname === 'clue.io') {
        if (typeof ga === 'undefined') {
            (function (i, s, o, g, r, a, m) {
                i['GoogleAnalyticsObject'] = r;
                i[r] = i[r] || function () {
                    (i[r].q = i[r].q || []).push(arguments);
                }, i[r].l = 1 * new Date();
                a = s.createElement(o), m = s.getElementsByTagName(o)[0];
                a.async = 1;
                a.src = g;
                m.parentNode.insertBefore(a, m);
            })(window, document, 'script', '//www.google-analytics.com/analytics.js',
                'ga');
        }
        ga('create', 'UA-62656334-1', 'auto', 'clue');
        if (clue.getUserName() != null) {
            ga('clue.set', 'clue_user', clue.getUserName());
        }
        ga('clue.send', 'pageview');
    }
};
clue.cachedFetch = function (url, options, callback) {
    //TODO: If local storage is not present then make query without storage
    try {
        var expiry = 5 * 60; // 5 min default
        if (typeof options === 'number') {
            expiry = options;
            options = undefined;
        } else if (typeof options === 'object') {
            // I hope you didn't set it to 0 seconds
            expiry = options.seconds || expiry;
        }
        // Use the URL as the cache key to sessionStorage
        var cacheKey = clue.hashstr(url + clue.USER_KEY);
        if (options.ignoreApiKey) {
            cacheKey = clue.hashstr(url);
        }
        var cached = localStorage.getItem(cacheKey);
        var whenCached = localStorage.getItem(cacheKey + ':ts');
        if (cached !== null && whenCached !== null) {
            // it was in sessionStorage! Yay!
            // Even though 'whenCached' is a string, this operation
            // works because the minus sign tries to convert the
            // string to an integer and it will work.
            var age = (Date.now() - whenCached) / 1000;
            if (age < expiry) {
                return callback(null, JSON.parse(cached));
            } else {
                // We need to clean up this old key
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(cacheKey + ':ts');
            }
        }
    } catch (ex) {
        //local storage not supported?
        console.log(ex);
    }
    var clueHeaders = new Headers({
        'user_key': clue.USER_KEY
    });

    var myInit = {
        method: 'GET',
        headers: clueHeaders
    };
    if (options.ajax) {
        var ajx = $.ajax({
            url: url,
            type: 'GET',
            cache: true
        });
        ajx.done(function (result) {
            localStorage.setItem(cacheKey, JSON.stringify(result));
            localStorage.setItem(cacheKey + ':ts', Date.now())
            return callback(null, result);
        }).fail(function (err) {
            return callback(err);
        });
    } else {
        fetch(url, myInit).then(function (response) {
            return response.json().then(function (data) {
                if (response.ok) {
                    return data;
                } else {
                    return Promise.reject({status: response.status, data: data});
                }
            });
        }).then(function (result) {
            localStorage.setItem(cacheKey, JSON.stringify(result));
            localStorage.setItem(cacheKey + ':ts', Date.now());

            return callback(null, result);
        }).catch(function (error) {
            console.log('error:', error);
            return callback(error, null);
        });
    }
}

clue.cachedFetchSession = function (url, options, callback) {
    //TODO: If local storage is not present then make query without storage
    try {
        var expiry = 5 * 60; // 5 min default
        if (typeof options === 'number') {
            expiry = options;
            options = undefined;
        } else if (typeof options === 'object') {
            // I hope you didn't set it to 0 seconds
            expiry = options.seconds || expiry;
        }
        // Use the URL as the cache key to sessionStorage
        var cacheKey = clue.hashstr(url + clue.USER_KEY);
        if (options.ignoreApiKey) {
            cacheKey = clue.hashstr(url);
        }
        var cached = sessionStorage.getItem(cacheKey);
        var whenCached = sessionStorage.getItem(cacheKey + ':ts');
        if (cached !== null && whenCached !== null) {
            // it was in sessionStorage! Yay!
            // Even though 'whenCached' is a string, this operation
            // works because the minus sign tries to convert the
            // string to an integer and it will work.
            var age = (Date.now() - whenCached) / 1000;
            if (age < expiry) {
                return callback(null, JSON.parse(cached));
            } else {
                // We need to clean up this old key
                sessionStorage.removeItem(cacheKey);
                sessionStorage.removeItem(cacheKey + ':ts');
            }
        }
    } catch (ex) {
        //local storage not supported?
        console.log(ex);
    }
    var clueHeaders = new Headers({
        'user_key': clue.USER_KEY
    });

    var myInit = {
        method: 'GET',
        headers: clueHeaders
    };
    if (options.ajax) {
        var ajx = $.ajax({
            url: url,
            type: 'GET',
            cache: true
        });
        ajx.done(function (result) {
            sessionStorage.setItem(cacheKey, JSON.stringify(result));
            sessionStorage.setItem(cacheKey + ':ts', Date.now())
            return callback(null, result);
        }).fail(function (err) {
            return callback(err);
        });
    } else {
        fetch(url, myInit).then(function (response) {
            return response.json().then(function (data) {
                if (response.ok) {
                    return data;
                } else {
                    return Promise.reject({status: response.status, data: data});
                }
            });
        }).then(function (result) {
            sessionStorage.setItem(cacheKey, JSON.stringify(result));
            sessionStorage.setItem(cacheKey + ':ts', Date.now());

            return callback(null, result);
        }).catch(function (error) {
            console.log('error:', error);
            return callback(error, null);
        });
    }
}
clue.hashstr = function hashstr(s) {
    var hash = 0;
    if (s.length === 0) return hash;
    for (var i = 0; i < s.length; i++) {
        var char = s.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};
/**
 *  Parses URL and returns the version (e.g. &version=1.1 should return 1.1)
 * @param url The base URL to get the version from
 * @returns The api version, as a string
 */
clue.getVersionFromUrl = function (url) {
    var result = null;
    // skips the '?' character at the beginning of the URL
    if (url) {
        var query = url.substr(1);
        query.split("&").forEach(function (part) {
            var item = part.split("=");
            if (item[0] === 'version') {
                result = decodeURIComponent(item[1]);
            }
        });
    }
    return result;
}

/**
 * List all the directories at the specified url, and load all gcts inside these directories
 * @param url The base URL to load gct files from
 * @return {*}
 */
clue.parseApacheListing = function (url) {
    var d = $.Deferred();
    $.ajax({
        url: url
    }).done(function (html) {
        var a = $(html).find('td > a');
        var files = [];
        for (var i = 1; i < a.length; i++) {
            var text = $(a[i]).text();
            files.push(text);
        }
        files.sort();
        d.resolve(files.map(function (file) {
            return url + file;
        }));
    }).fail(function (err) {
        d.reject(err);
    });
    return d;

};
clue.getUserName = function () {
    return Cookies.get('user_id');
};

clue.showLoginModal = function () {
    $loginModal.modal('show');
};

clue.hideAccountDropDown = function () {
    $('#header-drop-down').hide();
};

clue.getUserInfo = function () {
    var userInfo;
    var userInfoCookie = Cookies.get('user_info');
    if (userInfoCookie) {
        userInfo = JSON.parse(Cookies.get('user_info'));
    }
    return userInfo;
};

// set up clue config, borrowed from
// https://github.com/HenrikJoreteg/clientconfig
var config = Cookies.get('clue_config') || {};
if (!(_.isEmpty(config))) {
    var co = JSON.parse(config);
    Object.freeze(co);

    clue.ENV = JSON.parse(config).env;
    clue.API_URL = JSON.parse(config).url;
    clue.whitelist_key = JSON.parse(config).whitelist_key;
}

else
{
    console.log("Empty clue config object");
}
// wipe it out
//document.cookie = 'clue_config=;expires=Thu, 01 Jan 1970 00:00:00 GMT';

clue.isDomainOnWhitelist = function (email) {
    return $.ajax({
        url: clue.API_URL + '/api/whitelists/' + clue.whitelist_key + '/domain/' + email + '/exists',
        type: 'GET'
    });
};

clue.isDomainOnBlacklist = function (email) {
    return $.ajax({
        url: clue.API_URL + '/api/blacklists/' + clue.whitelist_key + '/domain/' + email + '/exists',
        type: 'GET'
    });
};

clue.isCMapCore = function (callback) {

    var url = clue.API_URL + '/api/clue-privileges/isCore';
    var init = {
        seconds: 30 * 60, // 30 minutes
        ajax: true
    };
    clue.cachedFetch(url, init, callback);
};
clue.isAdmin = function (callback) {

    var url = clue.API_URL + '/api/clue-privileges/isAdmin';
    var init = {
        seconds: 30 * 60, // 30 minutes
        ajax: true
    };
    clue.cachedFetch(url, init, callback);
};
clue.getSettings = function (callback) {

    var url = '/settings';
    var init = {
        seconds: 30 * 60, // 30 minutes
        ajax: true
    };
    try {
        var cacheKey = clue.hashstr(url + clue.USER_KEY);
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheKey + ':ts');
    }catch(ee){

    }
    clue.cachedFetchSession(url, init, callback);
};
clue.getAllEvents = function (callback) {

    // var url = '/allEvents';
    //
    // return $.ajax({
    //     url: url,
    //     type: 'GET',
    //     cache: true
    // });
    return callback();
};
clue.getRoles = function (callback) {
    var init = {
        seconds: 24 * 60 * 60 // 1 day
    };
    clue.cachedFetch(clue.API_URL + '/api/roles', init, callback);
};
clue.getServerInfo = function (callback) {
    var url = '/server_info';
    var init = {
        // mode: 'same-origin',
        ignoreApiKey: true,
        seconds: 7 * 24 * 60 * 60 // 1 week
    }
    clue.cachedFetch(url, init, callback);
};
clue.getApiRepurposingDefinitions = function (callback) {
    var url = clue.API_URL + '/public/repurposing-definition';

    return $.ajax({
        url: url,
        type: 'GET',
        cache: true
    });
}
clue.getApiPublicDefinitions = function (callback) {
    var url = clue.API_URL + '/public/definitions';

    return $.ajax({
        url: url,
        type: 'GET',
        cache: true
    });
};
clue.getConnectopediaGlossary = function (callback) {
    var url = clue.API_URL + '/api/glossary/distinct?field=index';
    var init = {
        ignoreApiKey: true,
        seconds: 24 * 60 * 60 // 1 day
    };
    clue.cachedFetch(url, init, callback);

};
clue.getConnectopediaTags = function (callback) {
    var url = 'https://s3.amazonaws.com/data.clue.io/connectopedia/' +  clue.ENV + '/tags.json';
    var init = {
        ignoreApiKey: true,
        seconds: 24 * 60 * 60 // 1 day

    };
    clue.cachedFetch(url, init, callback);
};
clue.getTranscriptionalImpactForAllTouchstonePerts = function (callback) {

    var url = clue.API_URL +
        '/api/perts?filter={"include":{"pcls":true},"where": {"pert_icollection" : "TS"},"fields" : ["tas","pert_type","pert_id","pert_iname"],"order":"tas DESC"}';

    return $.ajax({
        url: url,
        type: 'GET',
        cache: true
    });
};
clue.getGitInfo = function (callback) {
    var url = '/build-info';
    var init = {
        ignoreApiKey: true,
        seconds: 7 * 24 * 60 * 60 // 7 days
    }
    clue.cachedFetch(url, init, callback);
};
clue.getApps = function (callback) {

    var init = {
        // mode: 'same-origin',
        seconds: 10 * 60 // 10 minutes
    }
    clue.cachedFetch(clue.API_URL + '/api/app_list/getApps?server_env=' + clue.ENV, init, callback);
};
clue.nominate = function (callback) {
    var url = clue.API_URL + '/api/nominate';
    return $.ajax({
        url: url,
        type: 'GET',
        cache: true
    });
};
clue.getAcademicTraining = function (callback) {
    var url = clue.API_URL + '/api/academic_training';
    return $.ajax({
        url: url,
        type: 'GET',
        cache: true
    });
};

clue.getResearchRoles = function (callback) {
    var url = clue.API_URL + '/api/research_roles';
    return $.ajax({
        url: url,
        type: 'GET',
        cache: true
    });
};


clue.autoCompleteInstituteUrl = function (callback) {
    return clue.API_URL + '/api/institutions/autocomplete';
};
clue.touchStoneVersion = function (callback) {
    var init = {
        // mode: 'same-origin',
        ignoreApiKey: true,
        seconds: 24 * 60 * 60 // 1 day
    }
    clue.cachedFetch(clue.API_URL + '/api/touchstone-version', init, callback);
};
clue.nominatePerts = function (type, name) {
    return $.ajax({
        url: clue.API_URL + '/api/nominate_entity?type=' + type + '&name=' + name,
        type: 'GET'
    });
};


/**
 * Autocomplete for a list of documents.
 *
 * @param options.$el
 *            Element to autocomplete
 * @param options.max
 *            max number of suggestions (defaults to 3).
 * @param options.fieldNames
 *            array of document fields to search.
 * @param options.nitems
 *            Nummber of documents to search
 * @param options.next
 *            Function callback to advance to next document.
 * @param options.getValue(field)
 *            Function callback to get the value for the current document at the
 *            specified field.
 */
clue.autocomplete = function (options) {
    var f = function (q, cb) {
        var matches = [];
        // an array that will be populated with substring matches
        // regex used to determine if a string starts with substring `q`
        var regex = new RegExp('^' + q, 'i');
        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        var max = options.max || 3;
        var values = {};
        var count = 0;
        var fieldNames = options.fieldNames;
        var nfields = fieldNames.length;
        for (var i = 0, nitems = options.nitems; i < nitems && count < max; i++) {
            options.next();
            for (var j = 0; j < nfields; j++) {
                var str = options.getValue(fieldNames[j]);
                if (!values[str] && regex.test(str)) {
                    values[str] = true;
                    count++;
                    if (count === max) {
                        break;
                    }
                }
            }
        }
        for (var val in values) {
            matches.push({
                value: val
            });
        }
        cb(matches);
    };
    morpheus.Util.autocomplete(options.$el, f, null, false);

};

/**
 * Search a list of documents.
 *
 * @param options.fieldNames
 *            array of document fields to search.
 * @param options.nitems
 *            Nummber of documents to search
 * @param options.next
 *            Function callback to advance to next document.
 * @param options.getValue(field)
 *            Function callback to get the value for the current document at the
 *            specified field.
 * @return A list of matching indices or null if no search text was provided.
 */
clue.search = function (text, options) {
    text = $.trim(text);
    if (text === '') {
        return null;
    }
    var tokens = morpheus.Util.getAutocompleteTokens(text);
    if (tokens.length == 0) {
        return null;
    }
    var fieldNames = options.fieldNames;
    var predicates = morpheus.Util.createSearchPredicates({
        tokens: tokens,
        fields: fieldNames
    });
    var indices = [];
    var npredicates = predicates.length;
    var nfields = model.getMetadataCount();
    for (var i = 0, nitems = options.nitems; i < nitems; i++) {
        var matches = false;
        options.next();
        for (var p = 0; p < npredicates && !matches; p++) {
            var predicate = predicates[p];
            var filterColumnName = predicate.getField();
            if (filterColumnName != null) {
                var value = options.getValue(filterColumnName);
                // TODO handle arrays
                if (value != null && predicate.accept(value)) {
                    matches = true;
                    break;
                }
            } else { // try all fields
                for (var j = 0; j < nfields; j++) {
                    var value = options.getValue(fieldNames[j]);
                    if (value != null && predicate.accept(value)) {
                        matches = true;
                        break;
                    }
                }
            }
        }
        if (matches) {
            indices.push(i);
        }
    }
    return indices;
};


clue.getCell = function (cell_id) {
    return $.ajax({
        url: clue.API_URL + '/api/cells?filter={"where":{"cell_id":"'
        + encodeURIComponent(cell_id) + '"}}',
        type: 'GET'
    });
};
clue.getPertInfo = function (pert_id) {
    return $.ajax({
        url: clue.API_URL + '/api/perts?filter={"include":{"pcls":true},"where":{"pert_id":"'
        + encodeURIComponent(pert_id) + '"}}',
        type: 'GET'
    });
};

clue.getGeneBySymbol = function (gene_symbol) {
    return $.ajax({
        url: clue.API_URL + '/api/genes/findOne?filter={"where":{"gene_symbol":"' + encodeURIComponent(gene_symbol) + '"}}',
        type: 'GET'
    });
};


clue.getPert = function (pert_iname) {
    return $.ajax({
        url: clue.API_URL + '/api/pert-card/' + pert_iname,
        type: 'GET'
    });
};

clue.getMissingCities = function () {
    var filter = {
        'fields': ['institute', 'country'],
        'where': {'city': '-666'}
    };
    return $.ajax({
        url: clue.API_URL + '/api/institutions?filter={"fields": ["id","institute", "country"], "where": {"city": "-666"}}',
        type: 'GET'
    });
};

clue.userExists = function (email) {
    return $.ajax({
        url: clue.API_URL
        + '/api/admin/users/exists?filter={"where":{"email":"'
        + encodeURIComponent(email) + '"}}',
        type: 'GET'
    });
};

clue.guessInstitutionFromEmail = function (email) {
    return $.ajax({
        'url': clue.API_URL + '/api/institutions/domain/' + encodeURIComponent(email),
        'type': 'GET'
    });
};

clue.getTouchStone = function () {
    return $.ajax({
        url: clue.API_URL + '/touchstone',
        type: 'GET'
    });
};

clue.getDosePoints = function (pert_iname) {
    return $.ajax({
        url: clue.API_URL + '/api/sigs/doseByCoreCellLines/' + pert_iname,
        type: 'GET'
    });
};

clue.searchPerts = function (search) {
    return $.ajax({
        url: clue.API_URL + '/api/search/perts/' + search,
        type: 'GET'
    });
};

clue.getHistory = function () {

    return $
        .ajax({
            url: clue.API_URL
            + '/api/jobs?filter={"where":{"user_id":"'
            + clue.getUserName()
            + '","status":{"inq":["pending","processing","submitted","completed"]}},"limit":10,"order":"created DESC"}',
            type: 'GET'
        });
};

clue.autoCompleteInstitute = function (inst) {
    return $.ajax({
        url: clue.autoCompleteInstituteUrl() + '?q=' + inst,
        type: 'GET'
    });
};


clue.loadScriptsWhenReady = function (scripts) {
    $(document).one('clueReady', function () {
        for (var i = 0; i < scripts.length; i++) {
            var script = document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', scripts[i]);
            document.head.appendChild(script);
        }
    });
};

clue.setup = function (callback) {
    clue.getUserKey(function () {
        if (callback) {
            callback();
        }
        //var result = clue.getApps();
        // apps.done(function (result) {
       // clue.nav(result.cards);
        // });
        // apps.error(function () {
        // can't get app list, draw footer only
        // clue.footer();
        //});

    }, function () {
        // can't get user key
        clue.footer();
    });

};

clue.getTempApiKey = function () {

};

clue.getUserKey = function (callback, errorCallback) {
    return callback();
};

clue.fixUrl = function (url) {
    if (url.indexOf('data.clue.io') === 0 || url.indexOf('macchiato.clue.io') === 0) {
        url = 'https://s3.amazonaws.com/' + url;
    }
    return url;
};

clue.BASE_GUTC_DIGESTS_URL = '//s3.amazonaws.com/macchiato.clue.io/builds/touchstone/v1.1/arfs/';
/**
 *
 * @param options.id BRD id of pert
 * @param options.top Number of top results to return
 * @param options.bottom Number of bottom results to return
 * @return A Deferred that resolves to an array of results
 */
clue.gutcTopResults = function (options) {
    var deferred = $.Deferred();
    var d = morpheus.DatasetUtil.read(clue.BASE_GUTC_DIGESTS_URL + options.id + '/pert_id_summary.gct');
    d.then(function (dataset) {
        var array = [];
        for (var i = 0, nrows = dataset.getRowCount(); i < nrows; i++) {
            array.push({
                index: i,
                value: dataset.getValue(i, 0)
            });
        }
        array.sort(function (a, b) {
            return (a.value < b.value ? 1 : (a.value === b.value ? 0 : -1));
        });
        var idVector = dataset.getRowMetadata().get(0);
        var results = [];
        for (var i = 0, n = Math.min(array.length, options.top); i < n; i++) {
            var index = array[i];
            results.push({
                id: idVector.getValue(index.index),
                score: dataset.getValue(index.index, 0),
                rank: i + 1
            });
        }
        for (var i = 0, j = array.length - 1,
                 n = Math.min(options.bottom, array.length); i < n; i++, j--) {
            var index = array[j];
            results.push({
                id: idVector.getValue(index.index),
                score: dataset.getValue(index.index, 0),
                rank: 8796 - i
            });
        }
        var filter = {
            where: {
                pert_id: {
                    inq: results.map(function (r) {
                        return r.id;
                    })
                }
            },
            fields: {
                description: true,
                pert_id: true,
                pert_iname: true,
                pert_type: true
            }
        };
        $.ajax(clue.API_URL + '/api/perts?filter=' + JSON.stringify(filter)).fail(function (err) {
            deferred.reject(err);
        }).done(function (items) {
            var idToItem = {};
            for (var i = 0, nitems = results.length; i < nitems; i++) {
                idToItem[results[i].id] = results[i];
            }
            for (var i = 0, nitems = items.length; i < nitems; i++) {
                var item = items[i];
                var result = idToItem[item.pert_id];
                if (result !== undefined) {
                    result.description = item.description;
                    result.pert_iname = item.pert_iname;
                    result.pert_type = item.pert_type;
                }
            }
            deferred.resolve(results);
        });

    });
    d.catch(function (err) {
        deferred.reject(err);
    });
    return deferred;

};
/**
 *
 * @param gutcOptions.url Base GUTC output URL
 * @return jQuery Deferred
 */
clue.getGutcResult = function (gutcOptions) {
    var gutcUrl = gutcOptions.url;
    if (gutcUrl[gutcUrl.length - 1] !== '/') {
        gutcUrl += '/';
    }
    var d = $.Deferred();

    function unsignedResults() {
        var options = {};
        if (gutcOptions.gutcSummary) {
            options.pert_id_summary = gutcUrl + 'pert_id_summary.gct';

        }
        if (gutcOptions.gutcCell) {
            options.pert_id_cell = gutcUrl + 'pert_id_cell.gct';
        }

        if (gutcOptions.pclCell) {
            options.pcl_cell = gutcUrl + 'pcl_cell.gct';
        }
        if (gutcOptions.pclSummary) {
            options.pcl_summary = gutcUrl + 'pcl_summary.gct';
        }
        if (gutcOptions.overrideColumns) {
            options.overrideColumns = gutcOptions.overrideColumns;
        }

        // try to get query name
        if (gutcUrl.lastIndexOf('UPTAG/') === gutcUrl.length - 6) {
            options.config = gutcUrl.substring(0, gutcUrl.length - 6)
                + 'config.yaml';
        }
        var gutcPromise = clue.getGutcResultByUrl(options);
        gutcPromise.done(function (result) {
            d.resolve(result);
        });
        gutcPromise.fail(function (result) {
            d.reject(result);
        });
    }
    // data.clue.io/api/jgould+1@broadinstitute.org/results/
    if (gutcUrl.indexOf('https://s3.amazonaws.com/data.clue.io/api/') === 0) {
        // encode email address
        var remainder = gutcUrl.substring('https://s3.amazonaws.com/data.clue.io/api/'.length);
        var resultsIndex = remainder.indexOf('/results');
        if (resultsIndex !== -1) {
            var email = remainder.substring(0, resultsIndex);
            gutcUrl = 'https://s3.amazonaws.com/data.clue.io/api/' + encodeURIComponent(email) + remainder.substring(resultsIndex);
        }
        unsignedResults();
    }
    else {
        var signedPromise = clue.getSignedFolder(gutcUrl); // 1st sign the folder
        signedPromise.done(function (nameToUrl) {
            var options = {};
            if (gutcOptions.gutcSummary) {
                options.pert_id_summary = nameToUrl['pert_id_summary.gct'];
                if (options.pert_id_summary == null) {
                    options.pert_id_summary = nameToUrl['ps_pert_summary.gct'];
                }
            }
            if (gutcOptions.gutcCell) {
                options.pert_id_cell = nameToUrl['pert_id_cell.gct'];
            }
            if (gutcOptions.pclCell) {
                options.pcl_cell = nameToUrl['pcl_cell.gct'];
            }
            if (nameToUrl['query_info.txt']) {
                options.columnInfo = nameToUrl['query_info.txt'];
            }

            if (nameToUrl['sig.gct']) {
                options.sig_gct = nameToUrl['sig.gct'];
            }
            if (gutcOptions.pclSummary) {
                options.pcl_summary = nameToUrl['pcl_summary.gct'];
                if (options.pcl_summary == null) {
                    options.pcl_summary = nameToUrl['ps_pcl_summary.gct'];
                }
            }

            // try to get query name
            options.config = nameToUrl['config.yaml'];
            if (options.config == null && gutcUrl.lastIndexOf('UPTAG/') === gutcUrl.length - 6) {
                options.config = gutcUrl.substring(0, gutcUrl.length - 6)
                    + 'config.yaml';
            }
            if (options.config != null && options.config.indexOf('/arfs/') > -1) {
                options.config = options.config.replace('/arfs/', '/');
            }
            if (!options.columnInfo) {
                options.columnInfo = nameToUrl['column_meta.txt'];
            }
            options.rowInfo = gutcOptions.rowMeta ? nameToUrl['row_meta.txt'] : null;
            var gutcPromise = clue.getGutcResultByUrl(options);

            gutcPromise.done(function (result) {
                d.resolve(result);
            });
            gutcPromise.fail(function (result) {
                d.reject(result);
            });
        });
        signedPromise.fail(function (nameToUrl) {
            unsignedResults();
        });
    }
    return d;
};

/**
 * Gets one or more non-Touchstone L1000 query results as a morpheus.Dataset.
 *
 * @param {string[]}
 *            options.urls The output URLS
 * @param {string} options.index Path to index file to annotate results with.
 * @return A jQuery deferred object that resolves to a morpheus.Dataset.
 *
 */
clue.getSigQueryResults = function (options) {
  var deferred = $.Deferred();
  var promises = [];
  var datasets = [];

  var getSigInfoByName = function(datasetName) {
    var sigInfoPromise = $.Deferred();
      var filter = {
          where: {
              name: datasetName
          }
      };
    var p = $.ajax(clue.API_URL + '/api/data?filter=' + JSON.stringify(filter));
    p.done(function (dataModel) {
        if(dataModel && dataModel.length>0 && dataModel[0].s3_root) {
          var url = 'https://s3.amazonaws.com/macchiato.clue.io' + dataModel[0].s3_root +
              'gutc_background/annot/siginfo.txt';
          var signedUrl = clue.getSignedUrlCache(url);
          signedUrl.done(function (url) {
            var p = morpheus.Util.readLines(url);
              p.then(function (result) {
              sigInfoPromise.resolve(result);
            });
              p.catch(function (e) {
              console.log('Could not load siginfo file.');
              sigInfoPromise.reject();
            });

          });
          signedUrl.fail(function () {
            console.log('Could not get signed url.');
            sigInfoPromise.reject();
          });
        }
        else {
            console.log('Could not find a matching dataset ' + datasetName + ' with s3_root in API.');
            sigInfoPromise.reject();
        }
    });
    p.fail(function () {
      console.log('Failure when querying data endpoint in API.');
      sigInfoPromise.reject();
    });
    return sigInfoPromise;
  };

  var sigInfoLines = null;
  var promise = getSigInfoByName(options.datasetName);
  promises.push(promise);
  promise.done(function (result) {
    sigInfoLines = result;
  });


  options.urls.forEach(function (url, idx) {
    url = clue.fixUrl(url);
    var promise = morpheus.DatasetUtil.read(url + '/sig.gct');
    promises.push(promise);
      promise.then(function (dataset) {
    if(options.overrideColumns) {
        var keys = Object.keys(options.overrideColumns);
        keys.forEach(function (key) {
            var colMeta = dataset.getColumnMetadata().getByName(key);
            if(!colMeta) {
                colMeta = dataset.getColumnMetadata().add(key);
            }
            var val = options.overrideColumns[key][idx];
            if(val.length>25) {
                 //val=val.slice(0,23) + '...';
            }
            for(var i=0; i<colMeta.size(); i++) {
                colMeta.setValue(i,val);
            }
        });
    }

      datasets.push(dataset);
    });
  });
  $.when.apply($, promises).then(
    function () {
      var dataset;
      if (datasets.length === 1) {
        dataset = datasets[0];
      } else {
        // join rows by pert_id
        for (var i = 0; i < datasets.length; i++) {
          datasets[i] = new morpheus.TransposedDatasetView(
            datasets[i]);
        }
        dataset = new morpheus.JoinedDataset(datasets[0],
          datasets[1], 'id', 'id', 'query');
        for (var i = 2; i < datasets.length; i++) {
          dataset = new morpheus.JoinedDataset(dataset,
            datasets[i], 'id', 'id', 'query');
        }
        dataset = new morpheus.TransposedDatasetView(dataset);
      }
      // id and pert_type on rows
      // cell_id, id, and query on columns
      dataset.setName(options.name);
      if (sigInfoLines) {

          const opts = {};
          opts.dataset = dataset;
          opts.fileColumnNamesToInclude = null;
          opts.lines = sigInfoLines;
          opts.isColumns = false;
          opts.sets = null;
          opts.metadataName = 'id';
          opts.fileColumnName = sigInfoLines[0].split(/\t/)[0];

        new morpheus.OpenFileTool().annotate(opts);
      }
      dataset.getColumnMetadata().getByName('id').setName('_id');
      deferred.resolve(dataset);
    }, function () {
      deferred.reject('Unable to read results.');
    });
  var promise = deferred.promise();
  promise.toString = function () {
    return 'results';
  };
  return promise;
};

/**
 * Gets one or more GUTC results as a morpheus.Dataset.
 *
 * @param {string[]}
 *            options.urls The GUTC output URLS
 * @param {Boolean}
 *            [options.pclSummary=true] Whether to retrieve pcl level data
 * @param {Boolean}
 *            [options.pclCell=true] - Whether to retrieve pcl level data
 * @param {Boolean}
 *            [options.gutcSummary=true] - Whether to gutc summary level data
 * @param {Boolean}
 *            [options.gutcCell=true] - Whether to gutc cell level data
 * @param {string} options.index Path to index file to annotate results with.
 * @return A jQuery deferred object that resolves to a morpheus.Dataset.
 *
 */
clue.getGutcResults = function (options) {
    var deferred = $.Deferred();
    var promises = [];
    var datasets = [];

    options = $.extend({}, {
        pclCell: true,
        gutcCell: true,
        pclSummary: true,
        gutcSummary: true
    }, options);
    options.urls.forEach(function (url, idx) {
        var overrideColumns = null;
        if(options.overrideColumns) {
            overrideColumns = {};
            var keys = Object.keys(options.overrideColumns);
            keys.forEach(function (key) {
                overrideColumns[key] = options.overrideColumns[key][idx];
            });
        }
        url = clue.fixUrl(url);
        var promise = clue.getGutcResult({
            url: url,
            rowMeta: options.urls.length === 1,
            pclCell: options.pclCell,
            gutcCell: options.gutcCell,
            pclSummary: options.pclSummary,
            gutcSummary: options.gutcSummary,
            overrideColumns: overrideColumns
        });
        promises.push(promise);
        promise.done(function (dataset) {
            datasets.push(dataset);
        });
    });
    var indexLines = null;
    if (options.index) {
        options.index = clue.fixUrl(options.index);
        var indexPromise = $.Deferred();
        var indexSignedUrl = clue.getSignedUrlCache(options.index);
        //check the index if it exist
        //otherwise sign and do this
        //var indexSignedUrl = clue.getSignedUrl(options.index);
        indexSignedUrl.done(function (url) {
            var p = morpheus.Util.readLines(url);
            p.then(function (result) {
                indexLines = result;
                indexPromise.resolve();
            }).catch(function () {
                indexPromise.resolve();
            });

        });
        indexSignedUrl.fail(function () {
            indexPromise.resolve();
        });
        promises.push(indexPromise);
    }
    $.when.apply($, promises).then(
        function () {
            var dataset;
            for (var i = 0; i < datasets.length; i++) {
                var pclSeriesData = [];
                datasets[i] = morpheus.DatasetUtil.copy(datasets[i]);
                for (var j = 0, ncols = datasets[i].getRowCount(); j < ncols; j++) {
                    pclSeriesData.push({});
                }
                var pclSeriesIndex = datasets[i].addSeries({
                    name: 'PCL',
                    dataType: 'number',
                    array: pclSeriesData
                });
            }
            if (datasets.length === 1) {
                dataset = datasets[0];
            } else {
                // join rows by pert_id
                for (var i = 0; i < datasets.length; i++) {
                    datasets[i] = new morpheus.TransposedDatasetView(
                        datasets[i]);
                }
                dataset = new morpheus.JoinedDataset(datasets[0],
                    datasets[1], 'id', 'id', 'query');
                for (var i = 2; i < datasets.length; i++) {
                    dataset = new morpheus.JoinedDataset(dataset,
                        datasets[i], 'id', 'id', 'query');
                }
                dataset = new morpheus.TransposedDatasetView(dataset);
            }
            // id and pert_type on rows
            // cell_id, id, and query on columns
            dataset.setName(options.name);
            if (indexLines) {
                const opts = {};
                opts.dataset = dataset;
                opts.fileColumnNamesToInclude = null;
                opts.lines = indexLines;
                opts.isColumns = true;
                opts.sets = null;
                opts.metadataName = '_id';
                opts.fileColumnName = indexLines[0].split(/\t/)[0];
                new morpheus.OpenFileTool().annotate(opts);
            }
        deferred.resolve(dataset);
        }, function () {
            deferred.reject('Unable to read results.');
        });
    var promise = deferred.promise();
    promise.toString = function () {
        return 'results';
    };
    return promise;
};

clue.createGutcColorScheme = function () {
    return {
        name: '(-100, -95, -90, 90, 95, 100)',
        scalingMode: 'fixed',
        map: [
            {
                value: -100,
                color: '#0000ff'
            }, {
                value: -95,
                color: '#abdda4'
            }, {
                value: -90,
                color: '#ffffff'
            }, {
                value: 90,
                color: '#ffffff'
            }, {
                value: 95,
                color: '#fdae61'
            }, {
                value: 100,
                color: '#ff0000'
            }]
    };
};

clue.createLoadingEl = function (text,punctuation) {
    if(!text) { text='Loading'; }
    if(!punctuation) { punctuation='&#8230;'}
    return $('<div id="loading-spinner" class="loading-box">' +
        '<div class="loading"><img src="//assets.clue.io/clue/public/img/clueLoadingAnimation.gif">' +
        '<p class="load-message">&nbsp;'+text+punctuation+'</p></div></div>');
};
clue.getSignedFolder = function (folder) {
    var d = $.Deferred();
    var p = $.ajax({
        context: folder,
        url: clue.API_URL + '/api/s3_resources/signFolder?s3_folder=' + folder
    });
    p.done(function (urls) {
        var fileNameToUrl = {};
        urls.forEach(function (url) {
            // e.g.
            var questionMarkIndex = url.indexOf('?');
            if (questionMarkIndex !== -1) {
                var name = url.substring(0, questionMarkIndex);
                var slashIndex = name.lastIndexOf('/');
                name = name.substring(slashIndex + 1);
                fileNameToUrl[name] = url;
            } else {
                d.reject('No file name found for ' + url);
            }

        });
        d.resolve(fileNameToUrl);
    });
    p.fail(function () {
        d.reject();
    });
    return d;
};
clue.postICVSession = function(options,cb) {
    var heatMap = options.heatMap;
    // var options = {dataset: options.input.include_dataset};
    var options = {dataset: true};
    var json = heatMap.toJSON(options);
    var nativeArrayToArray = Array.from || function (typedArray) {
        var normalArray = Array.prototype.slice.call(typedArray);
        normalArray.length === typedArray.length;
        normalArray.constructor === Array;
    };
    var jsonArray = [JSON.stringify(json, function (key, value) {
        if (morpheus.Util.isArray(value)) {
            return value instanceof Array ? value : nativeArrayToArray(value);
        }
        return value;
    })];
    var inputValues = {
        session: jsonArray,
        dataset: 'foo',
        user: 'bar'
    };
    $.ajax({
        url: '/icv_session',
        method: 'POST',
        data: inputValues
    }).done(function (data) {
        cb(null,data);
    }).fail(
        function (err) {
            cb(err);
        });
};
clue.getSignedUrlCache = function (url, options) {
    var deferred = $.Deferred();
    // Use the URL as the cache key to sessionStorage
    var cacheKey = clue.hashstr(url + clue.USER_KEY);
    try {
        var expiry = 10 * 60; // 10 min default
        if (typeof options === 'number') {
            expiry = options;
            options = undefined;
        } else if (typeof options === 'object') {
            // I hope you didn't set it to 0 seconds
            expiry = options.seconds || expiry;
        }

        var cached = sessionStorage.getItem(cacheKey);
        var whenCached = sessionStorage.getItem(cacheKey + ':ts');
        if (cached !== null && whenCached !== null) {
            // it was in sessionStorage! Yay!
            // Even though 'whenCached' is a string, this operation
            // works because the minus sign tries to convert the
            // string to an integer and it will work.
            var age = (Date.now() - whenCached) / 1000;
            if (age < expiry) {
                var sanitizedURL = cached.replace(/"/g, "");
                deferred.resolve(sanitizedURL);
                return deferred;
            } else {
                // We need to clean up this old key
                sessionStorage.removeItem(cacheKey);
                sessionStorage.removeItem(cacheKey + ':ts');
            }
        }
    } catch (ex) {
        //session storage not supported?
        console.log(ex);
    }
    var clueHeaders = new Headers({
        'user_key': clue.USER_KEY
    });

    var myInit = {
        method: 'GET',
        headers: clueHeaders
    };
    var r = clue.API_URL + '/api/s3_resources/signFile?s3_file=' + url;

    fetch(r, myInit).then(function (response) {
        return response.text().then(function (data) {
            if (response.ok) {
                return data;
            } else {
                deferred.reject();
            }
        });
    }).then(function (signedURL) {
        var sanitizedURL = signedURL.replace(/"/g, "");
        sessionStorage.setItem(cacheKey, sanitizedURL);
        sessionStorage.setItem(cacheKey + ':ts', Date.now());
        deferred.resolve(sanitizedURL);
    }).catch(function (error) {
        console.log('error:', error);
        deferred.reject();
    });
    return deferred;
}

clue.getSignedUrl = function (url) {
    var r = clue.API_URL + '/api/s3_resources/signFile?s3_file=' + url;
    return $.ajax(r);
};
clue.txtZipFileFromS3 = function(s3_url,callback) {
    var idToItem = new morpheus.Map();
    var baseUrlToIndexLines = new morpheus.Map();
    var promises = [];

    var d = $.Deferred();
    promises.push(d);
    var indexSignedUrl = clue.getSignedUrlCache(s3_url);
    indexSignedUrl.done(function (url) {
        var p = morpheus.Util.readLines(url);
        p.then(function (lines) {
            baseUrlToIndexLines.set(s3_url, lines);
            d.resolve();
        }).catch(function () {
            d.reject();
        });
    }).fail(function () {
        d.reject();
    });


    $.when.apply($, promises).fail(function () {
        return callback('An unexpected error occurred. Please try again.');
    }).done(function () {
        var lines = baseUrlToIndexLines.get(s3_url);
        if (lines != null) {
            var tab = /\t/;
            var header = lines[0].split(tab);
            var idField = header[0];
            for (var i = 1, nlines = lines.length; i < nlines; i++) {
                var tokens = lines[i].split(tab);
                var item = {};
                for (var j = 0; j < header.length; j++) {
                    var field = header[j];
                    var value = tokens[j];
                    if (value === '-666') {
                        value = '';
                    }
                    item[field] = value;
                }
                var existingItem = idToItem.get(item[idField]);
                if (existingItem == null) {
                    existingItem = item;
                    idToItem.set(item[idField], existingItem);
                } else { // merge with existing object
                    _.extend(existingItem, item);
                }

                var itemUrl = item.url || item.id;
                if (itemUrl) {
                    if (existingItem.baseUrlToUrls == null) {
                        existingItem.baseUrlToUrls = new morpheus.Map();
                    }
                    existingItem.baseUrlToUrls.set(s3_url, itemUrl);
                }
            }
        }
        var items = idToItem.values();
        return callback(null,items);
    }).fail(function (err) {
        return callback(err);
    });
};
clue.getJobConfig = function (url) {
    var nameDeferred = $.Deferred();
    var p = $.ajax({
        url: url,
        dataType: 'text'
    });
    var config = {};
    p.done(function (text) {
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var index = line.indexOf(':');
            if (index !== -1) {
                var key = line.substring(0, index).trim();
                var value = line.substring(index + 1).trim();
                config[key] = value;
            }
        }
        nameDeferred.resolve(config);
    });
    p.fail(function () {
        nameDeferred.resolve(config);
    });
    return nameDeferred;
};
/**
 *
 * @param options.urls
 *            Array of base urls to retrieve query results from
 * @param options.tool Either sig_query_tool or sig_prot_query_tool
 *
 */
clue.getQueryResults = function (options) {
    var datasetPromises = [];
    var connectivityDatasets = [];
    var introspectDatasets = [];
    var inputDatasets = [];
    options.urls.forEach(function (url) {
        url = clue.fixUrl(url);
        var p;
        if (options.tool === 'sig_prot_query_tool') {
            p = clue.getQueryResultByUrl({
                baseUrl: url,
                gct: 'CONCATED_CONN.gct'
            });
        } else {
            p = clue.getQueryResultByUrl({
                baseUrl: url,
                gct: 'result_WTCS.CUSTOM.COMBINED_n1x4160.gct' // FIXME
            });
        }
        p.done(function (result) {
            connectivityDatasets.push(result.conn);
            if (result.introspect != null) {
                introspectDatasets.push(result.introspect);
            }
            if (result.input != null) {
                inputDatasets.push(result.input);
            }
        });
        datasetPromises.push(p);
    });
    var d = $.Deferred();
    $.when
        .apply($, datasetPromises)
        .then(
            function () {
                var connDatasets = connectivityDatasets[0];
                if (connectivityDatasets.length > 1) {
                  var joined = new morpheus.JoinedDataset(
                    new morpheus.TransposedDatasetView(
                      connectivityDatasets[0]),
                    new morpheus.TransposedDatasetView(
                      connectivityDatasets[1]));
                  for (var i = 2; i < connectivityDatasets.length; i++) {
                    joined = new morpheus.JoinedDataset(joined,
                      new morpheus.TransposedDatasetView(
                        connectivityDatasets[i]));
                  }
                  connDatasets = new morpheus.TransposedDatasetView(
                    joined)
                }
                var inputDataset = null;
                if(inputDatasets.length===1) {
                  var inputDataset = inputDatasets[0];
                }
                else if (inputDatasets.length > 1) {
                    var joined = new morpheus.JoinedDataset(
                      new morpheus.TransposedDatasetView(
                        inputDatasets[0]),
                      new morpheus.TransposedDatasetView(
                        inputDatasets[1]));
                    for (var i = 2; i < inputDatasets.length; i++) {
                      joined = new morpheus.JoinedDataset(joined,
                        new morpheus.TransposedDatasetView(
                          connectivityDatasets[i]));
                    }
                    inputDataset = new morpheus.TransposedDatasetView(
                      joined);
                }
              d
                .resolve({
                  conn: connDatasets,
                  introspectDatasets: introspectDatasets,
                  inputDataset: inputDataset
                });
            });
    return d;

};

/**
 *
 * @param options.gct
 * @param options.baseUrl
 * @return {*}
 */
clue.getQueryResultByUrl = function (options) {
    var dataset = null;
    var introspectDataset = null;
    var inputDataset = null;
    var deferred = $.Deferred();
    var config = {};
    var promises = [];
    var introspectPromise = $.Deferred();
    var inputPromise = $.Deferred();
    promises.push(introspectPromise);
    promises.push(inputPromise);
    promises.push(clue.getJobConfig(options.baseUrl + '/config.yaml').done(function (conf) {
        config = conf;
        if (conf.introspect === 'true') {

            var p1 = morpheus.DatasetUtil.read(options.baseUrl + '/INTROSPECT_CONN.gct');
            p1.then(function (d) {
                introspectDataset = d;
                introspectPromise.resolve();
            });
            p1.finally(function () {
                introspectPromise.resolve();
            });
        } else {
            introspectPromise.resolve();
        }
        if (conf.input_file != null) {
            var p2 = morpheus.DatasetUtil.read(conf.input_file.replace('http://','https://s3.amazonaws.com/'));
            p2.then(function (d) {
              inputDataset = d;
            });
            p2.finally(function () {
              inputPromise.resolve();
            });
        } else {
            inputPromise.resolve();
        }
    }));

    var p = morpheus.DatasetUtil.read(options.baseUrl + '/' + options.gct);
    p.then(function (d) {
        dataset = d;
    });
    promises.push(p);
    $.when.apply($, promises).then(function () {
        if (config.rpt != null) {
            if (introspectDataset != null) {
                if(config.assay != null) {
                  introspectDataset.setName(0, 'Introspect ' + config.assay + ' - ' + config.rpt);
                }
                else {
                  introspectDataset.setName(0, 'Introspect - ' + config.rpt);
                }
            }
            if (inputDataset != null) {
                var nameVector = inputDataset.getColumnMetadata().add('name');
                for (var i = 0; i < nameVector.size(); i++) {
                    nameVector.setValue(i, config.rpt);
                }
                if(config.assay != null) {
                  inputDataset.setName(0, 'Input ' + config.assay + ' - ' + config.rpt);
                }
                else {
                  inputDataset.setName(0, 'Input - ' + config.rpt);
                }
            }
            var v = dataset.getColumnMetadata().getByName('name');

            if (v == null) {
                v = dataset.getColumnMetadata()
                    .add('name');
            }
            for (var j = 0, size = v.size(); j < size; j++) {
                v.setValue(j, config.rpt);
            }
        }
        if (config.data_type != null) {
            var v = dataset.getColumnMetadata().getByName('data_type');
            if (v == null) {
                v = dataset.getColumnMetadata()
                    .add('data_type');
            }
            for (var j = 0, size = v.size(); j < size; j++) {
                v.setValue(j, config.data_type);
            }
        }
        deferred.resolve({
            conn: dataset,
            introspect: introspectDataset,
            input: inputDataset
        });
    });
    return deferred;
};

var pertTypesTasCache = null;
var pertTypesTasConfig = {
    'trt_oe': {
        xaxisTitle: 'All Gene OE',
        color: '#27AAE0',
        lineColor: '#8fc7de'
    },
    'trt_sh.cgs': {
        xaxisTitle: 'All Gene KD',
        color: '#B438BE',
        lineColor: '#c692ca'
    },
    'trt_cp': {
        xaxisTitle: 'All Compounds',
        color: '#F5A623',
        lineColor: '#edca91'
    }
};

/**
 *
 * @param options.multiple Multiple files?
 * @return jQuery Deferred
 */
clue.promptForFile = function (options) {
    var d = $.Deferred();
    var formBuilder = new morpheus.FormBuilder();
    formBuilder.append({
        name: 'file',
        value: '',
        type: 'file',
        required: true,
        multiple: options.multiple
    });
    var $modal;
    formBuilder.on('change', function (e) {
        var value = e.value;
        if (value !== '' && value != null) {
            $modal.modal('hide');
            $modal.remove();
            d.resolve(value);
        }
    });
    $modal = morpheus.FormBuilder.showInModal({
        title: 'File',
        html: formBuilder.$form,
        close: false
    });
    return d;
};
clue.loadTasChart = function (pertId, pertType, tasChartId) {
    $(tasChartElt).empty();
    var tasPointHoverId = '#tas_point_info';

    var showTasChart = function (pertId, tasChartElt) {
        // convert hover info params into an object
        var getTasHoverData = function (pertName, tas, pertsAbove, pertsBelow) {
            var totalPerts = pertsAbove + pertsBelow + 1;
            var percentBelow = (pertsBelow / totalPerts) * 100;
            var percentAbove = 100 - pertsBelow;
            return {
                'pert': pertName,
                'tas': tas,
                'pertsAbove': pertsAbove,
                'pertsBelow': pertsBelow,
                'percentBelow': percentBelow,
                'percentAbove': percentAbove,
                'percentile': Math.floor(percentBelow)
            };
        };

        // convert hover data into % breakdown table
        var getHoverPercentTable = function (tasHoverInfo, pertTypeConfig) {
            return '<div class="metadata-line"></div><table style="font-size:4pt;width:100%;"><tr><td style="width:' + tasHoverInfo.percentBelow + '%;background-color:' +
                pertTypeConfig.color + '">&nbsp;</td><td style="background-color:lightgrey;width:' + tasHoverInfo.percentAbove + '%">&nbsp;</tr></table></div>';
        };

        // convert hover data into a div
        var getHoverScoreText = function (tasHoverInfo) {
            if (tasHoverInfo) {
                return '<div>' +
                    '<div class="metadata-line">' +
                    '<span class="label">Score:</span><span class="value">' + tasHoverInfo.tas + '</span>' +
                    '</div>' +
                    '<div class="metadata-line">' +
                    '<span class="label">Percentile:</span><span class="value">' + tasHoverInfo.percentile + '</span>' + '' +
                    '</div>' +
                    '</div>';
            }
            else {
                return '';
            }
        };

        var makeHoverDiv = function (tasHoverInfo, pertTypeConfig) {
            var percentTable = getHoverPercentTable(tasHoverInfo, pertTypeConfig);
            var scoreText = getHoverScoreText(tasHoverInfo);
            return '<div class="graph-title">' + tasHoverInfo.pert + '<br/>' + percentTable + scoreText + '</div>';
        };

        // add hover behavior, initializing hover detail to the given params
        var addHoverBehavior = function (x, y, pertName, pertsAbove, pertsBelow) {
            var pertTypeConfig = pertTypesTasConfig[pertType];

            $(tasChartElt).find(tasPointHoverId).remove();
            $(tasChartElt).append('<div id="tas_point_info" style="width:40%;position:relative;top:-90%;right:-50%;"></div>');

            Plotly.addTraces(tasChartElt, {
                mode: 'lines+markers',
                x: [x],
                y: [y],
                hoverinfo: 'none',
                name: pertName,
                marker: {
                    color: pertTypeConfig.color,
                    size: 10
                },
                hovermode: 'closest'
            }).then(function () {

                var tasHoverInfoElt = $(tasChartElt).find(tasPointHoverId);
                tasChartElt.on('plotly_hover', function (data) {
                    tasHoverInfoElt.empty();
                    var infotext = data.points.map(function (d) {
                        var tasHoverInfo = undefined;
                        if (d.data.text) {
                            tasHoverInfo = getTasHoverData(d.data.text[d.x], d.y, d.x, (d.data.x.length - d.x) - 1);
                            return makeHoverDiv(tasHoverInfo, pertTypeConfig);
                        }
                        return '';
                    });
                    tasHoverInfoElt.append(infotext);
                })
                    .on('plotly_unhover', function (data) {
                        tasHoverInfoElt.empty();
                        var tasHoverInfo = getTasHoverData(pertName, y, pertsAbove, pertsBelow);
                        tasHoverInfoElt.append(makeHoverDiv(tasHoverInfo, pertTypeConfig));
                    });

                tasHoverInfoElt.empty();
                var tasHoverInfo = getTasHoverData(pertName, y, pertsAbove, pertsBelow);
                tasHoverInfoElt.append(makeHoverDiv(tasHoverInfo, pertTypeConfig));
            });
        };

        if (pertTypesTasCache[pertType]) {
            var tasForPert = pertTypesTasCache[pertType].tasForPertId[pertId];

            var xAxisTitle = pertTypesTasConfig[pertType].xaxisTitle + ' (' + pertTypesTasCache[pertType].tasX.length + ')';
            var tasChartElt = document.getElementById(tasChartId);
            var lineColor = pertTypesTasConfig[pertType].lineColor;

            Plotly.newPlot(tasChartElt, [
                    {
                        x: pertTypesTasCache[pertType].tasX,
                        y: pertTypesTasCache[pertType].tasY,
                        text: pertTypesTasCache[pertType].pert_iname,
                        hoverinfo: 'none',
                        mode: 'lines',
                        type: 'scatter',
                        marker: {color: lineColor}
                    }],
                {
                    margin: {
                        t: 10,
                        b: 20,
                        l: 30,
                        r: 0
                    },
                    hovermode: 'closest',
                    showlegend: false,
                    xaxis: {
                        showline: true,
                        zeroline: false,
                        showticklabels: false,
                        ticks: '',
                        fixedrange: true,
                        range: [0, pertTypesTasCache[pertType].tasX.length],
                        title: xAxisTitle,
                        showgrid: false,
                        titlefont: {
                            family: 'Roboto Condensed, sans-serif'
                        }
                    },
                    yaxis: {
                        range: [0, 1.0],
                        dtick: 0.25,
                        showline: true,
                        zeroline: false,
                        fixedrange: true,
                        ticksuffix: ' ',
                        titlefont: {
                            family: 'Roboto Condensed, sans-serif'
                        }
                    }
                },
                {displayModeBar: false}
            ).then(function () {
                if (tasForPert) {

                    var pertsAbove = pertTypesTasCache[pertType].tasX.length;
                    addHoverBehavior(tasForPert.tasX, tasForPert.tasY, tasForPert.pert_iname, tasForPert.tasX, (pertsAbove - tasForPert.tasX) - 1);
                }
                else {
                    console.log('No tas data available for ' + pertId);
                }
            });
        }
        else {
            console.log('unknown pert type ' + pertType + '.  Cannot show tas curve.');
        }
    };

    var tasChartElt = document.getElementById(tasChartId);

    if (!pertTypesTasCache) {
        var impact = clue.getTranscriptionalImpactForAllTouchstonePerts(function (error, tasScores) {
        });
        impact.done(function (tasScores) {
            tasCache = {};
            // cache of chart points for each pert type
            pertTypesTasCache = {};
            for (var pertType in pertTypesTasConfig) {
                pertTypesTasCache[pertType] = {
                    tasX: [],
                    tasY: [],
                    pert_id: [],
                    pert_iname: [],
                    tasForPertId: {},
                    xIndex: 0
                };
            }

            tasScores.forEach(function (tas, index) {
                tasCache[tas.pert_id] = tas.pert_type;

                if (!pertTypesTasCache[tas.pert_type]) {
                    console.log('No tas cache for ' + tas.pert_type);
                }
                else {
                    var tasForPertType = pertTypesTasCache[tas.pert_type];
                    tasForPertType.tasX.push(tasForPertType.xIndex);
                    tasForPertType.tasY.push(tas.tas);
                    tasForPertType.pert_id.push(tas.pert_id);
                    tasForPertType.pert_iname.push(tas.pert_iname);
                    tasForPertType.tasForPertId[tas.pert_id] = {
                        tasX: tasForPertType.xIndex,
                        tasY: tas.tas,
                        pert_iname: tas.pert_iname,
                        pert_type: tas.pert_type
                    };
                    tasForPertType.xIndex++;
                }
            });
            showTasChart(pertId, tasChartElt);
        })
    }
    else {
        showTasChart(pertId, tasChartElt);
    }
};

clue.getGutcResultByUrl = function (options) {
    var deferred = $.Deferred();
    var idSummary;
    var idCellSummary;
    var pclCell;
    var pclSummary;
    var sigGCT;
    var promises = [];
    var p;

    if(options.sig_gct != null){
        p = morpheus.DatasetUtil.read(options.sig_gct);
        promises.push(p);
        p.then(function (d) {
            sigGCT = d;
        });
    }
    if (options.pert_id_summary != null) {
        p = morpheus.DatasetUtil.read(options.pert_id_summary);
        promises.push(p);
        p.then(function (d) {
            idSummary = d;
        });
    }
    if (options.pert_id_cell != null) {
        p = morpheus.DatasetUtil.read(options.pert_id_cell);
        promises.push(p);
        p.then(function (d) {
            idCellSummary = d;
        });
    }
    if (options.pcl_cell != null) {
        p = morpheus.DatasetUtil.read(options.pcl_cell);
        promises.push(p);
        p.then(function (d) {
            pclCell = d;

        });
        p.catch(function (d) {
            console.log('Error reading PCL cell at ' + options.pcl_cell);
        });
    }
    if (options.pcl_summary != null) {
        p = morpheus.DatasetUtil.read(options.pcl_summary);
        promises.push(p);
        p.then(function (d) {
            pclSummary = d;
        });
        p.catch(function (d) {
            console.log('Error reading PCL summary at ' + options.pcl_summary);
        });
    }
    var annotationLines = null;
    if (options.columnInfo != null) {
        p = morpheus.Util.readLines(options.columnInfo);
        p.then(function (lines) {
            annotationLines = lines;
        });
    }
    var rowAnnotationLines = null;
    if (options.rowInfo != null) {
        p = morpheus.Util.readLines(options.rowInfo);
        promises.push(p);
        p.then(function (lines) {
            rowAnnotationLines = lines;
        });
    }

    var queryName = null;
    if (options.config != null) {
        var nameDeferred = $.Deferred();
        p = $.ajax({
            url: options.config
        });
        p.done(function (text) {
            var lines = text.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.indexOf('rpt:') === 0) {
                    queryName = $.trim(line.substring(4));
                    break;
                }
            }
        });
        p.always(function () {
            nameDeferred.resolve();
        });
        promises.push(nameDeferred);
    }

    function addUniqueId(d) {
        var uniqueIdVector = d.getColumnMetadata()
            .add('_id');
        var idVector = d.getColumnMetadata()
            .getByName('id');
        var cellVector = d.getColumnMetadata()
            .getByName('cell_id');
        for (var i = 0, size = idVector.size(); i < size; i++) {
            uniqueIdVector.setValue(i, idVector.getValue(i) + '-' + cellVector.getValue(i));
        }
        return uniqueIdVector;
    }

    const ppp = Promise.all(promises);
    ppp.then(
            function () {
                var counter = 0;
                var cellDataset = null;

                if (idCellSummary) { // pert cell is in long form
                    var queryIdVectorLong = idCellSummary
                        .getColumnMetadata().getByName('id');
                    var pertIdVectorLong = idCellSummary
                        .getRowMetadata().getByName('id');
                    var cellIdVectorLong = idCellSummary
                        .getRowMetadata().add('cell_id');
                    var uniqueCells = new morpheus.Set();
                    var uniquePerts = new morpheus.Set();
                    for (var i = 0, nrows = idCellSummary.getRowCount(); i < nrows; i++) {
                        var id = pertIdVectorLong.getValue(i);
                        var index = id.lastIndexOf(':');
                        var cell = id.substring(index + 1);
                        id = id.substring(0, index);
                        pertIdVectorLong.setValue(i, id);
                        cellIdVectorLong.setValue(i, cell);
                        uniquePerts.add(id);
                        uniqueCells.add(cell);
                    }

                    if (idSummary) {
                        uniqueCells.add('summary');
                    }

                    cellDataset = new morpheus.Dataset({
                        name: '',
                        rows: uniquePerts.size(),
                        columns: uniqueCells.size()
                        * idCellSummary.getColumnCount()
                    });
                    var pertIdVector = cellDataset.getRowMetadata().add('id');
                    counter = 0;
                    uniquePerts.forEach(function (id) {
                        pertIdVector.setValue(counter++, id);
                    });

                    var cellVector = cellDataset.getColumnMetadata()
                        .add('cell_id');
                    var queryIdVector = cellDataset.getColumnMetadata()
                        .add('id');
                    var nqueries = idCellSummary.getColumnCount();
                    var cells = uniqueCells.values();
                    var ncells = cells.length;
                    for (var j = 0; j < nqueries; j++) {
                        var queryId = queryIdVectorLong
                            .getValue(j);
                        for (var i = 0, size = cellVector.size(); i < size; i++) {
                            cellVector.setValue(j * ncells + i,
                                cells[i]);
                            queryIdVector.setValue(j * ncells + i,
                                queryId);

                        }
                    }

                    var pertIdToIndex = morpheus.VectorUtil.createValueToIndexMap(pertIdVector);
                    var uniqueIdToIndex = morpheus.VectorUtil.createValueToIndexMap(addUniqueId(cellDataset));
                    morpheus.DatasetUtil.fill(cellDataset, NaN);
                    for (var j = 0; j < nqueries; j++) {
                        var queryId = queryIdVectorLong.getValue(j);
                        for (var i = 0, nrows = idCellSummary.getRowCount(); i < nrows; i++) {
                            var cellId = cellIdVectorLong.getValue(i);
                            var pertId = pertIdVectorLong.getValue(i);
                            var rowIndex = pertIdToIndex.get(pertId);
                            var columnIndex = uniqueIdToIndex.get(queryId + '-' + cellId);
                            cellDataset.setValue(rowIndex, columnIndex, idCellSummary.getValue(i, j));
                        }
                    }

                    if (idSummary) {
                        // query on columns, perts on rows
                        var cellIdVectorLong = idSummary.getRowMetadata().add('cell_id');
                        for (var i = 0, size = cellIdVectorLong.size(); i < size; i++) {
                            cellIdVectorLong.setValue(i, 'summary');
                        }
                        queryIdVectorLong = idSummary
                            .getColumnMetadata().getByName('id');
                        pertIdVectorLong = idSummary
                            .getRowMetadata().getByName('id');

                        for (var j = 0; j < nqueries; j++) {
                            var queryId = queryIdVectorLong.getValue(j);
                            for (var i = 0, nrows = idSummary.getRowCount(); i < nrows; i++) {
                                var cellId = cellIdVectorLong.getValue(i);
                                var pertId = pertIdVectorLong.getValue(i);
                                var rowIndex = pertIdToIndex.get(pertId);
                                var columnIndex = uniqueIdToIndex.get(queryId + '-' + cellId);
                                if (rowIndex === undefined) {
                                    throw 'error';
                                }
                                if (columnIndex === undefined) {
                                    throw 'error';
                                }
                                cellDataset.setValue(rowIndex, columnIndex, idSummary.getValue(i, j));
                            }
                        }
                    }
                } else if (idSummary) {
                    cellDataset = idSummary;
                    var cellVector = cellDataset.getColumnMetadata()
                        .add('cell_id');
                    for (var j = 0, size = cellVector.size(); j < size; j++) {
                        cellVector.setValue(j, 'summary');
                    }
                    addUniqueId(cellDataset);
                }

                // make sure pclSummary has pcls on rows
                if (pclSummary) {
                    if (pclSummary.getRowCount() === 1) {
                        pclSummary = new morpheus.TransposedDatasetView(
                            pclSummary);
                    }
                    var pclSummaryRowIds = pclSummary.getRowMetadata().getByName('id');
                    for (var i = 0; i < pclSummaryRowIds.size(); i++) {
                        var id = pclSummaryRowIds.getValue(i);
                        var index = id.lastIndexOf(':');
                        if (index !== -1) {
                            // e.g. CP_BETA_ADRENERGIC_RECEPTOR_AGONIST:SUMMLY
                            pclSummaryRowIds.setValue(i, id.substring(0, index));
                        }
                    }
                    var cellVector = pclSummary.getColumnMetadata().add('cell_id');
                    for (var j = 0, size = cellVector.size(); j < size; j++) {
                        cellVector.setValue(j, 'summary');
                    }

                    addUniqueId(pclSummary);
                }
                if (pclCell != null) {
                    // we want cell and query id on columns, pcl ids on rows, output currently is queries on
                    // columns, pcl:cell on rows
                    var pclIdVector = pclCell.getRowMetadata()
                        .getByName('id');
                    var pclCellVector = pclCell.getRowMetadata().add(
                        'cell_id');
                    // add cell_id
                    for (var i = 0, size = pclCellVector.size(); i < size; i++) {
                        var id = pclIdVector.getValue(i);
                        var index = id.lastIndexOf(':');
                        pclIdVector.setValue(i, id.substring(0, index));
                        pclCellVector.setValue(i, id
                            .substring(index + 1));
                    }
                    var doPivot = pclCell.getColumnCount() == 1 || pclCell.getColumnMetadata().getByName('id').getValue(0) !== 'CP_ATPASE_INHIBITOR';
                    if (doPivot) { // it's in
                        // long form
                        var uniquePcls = new morpheus.Set();
                        var uniqueCells = new morpheus.Set();
                        for (var i = 0, size = pclCellVector.size(); i < size; i++) {
                            var cell = pclCellVector.getValue(i);
                            var id = pclIdVector.getValue(i);
                            uniqueCells.add(cell);
                            var pcl = pclIdVector.getValue(i);
                            uniquePcls.add(pcl);
                        }
                        var nqueries = pclCell.getColumnCount();
                        var pivotedDataset = new morpheus.Dataset({
                            name: '',
                            rows: uniquePcls.size(),
                            columns: uniqueCells.size() * nqueries
                        });
                        morpheus.DatasetUtil.fill(pivotedDataset, NaN);
                        // pcl ids on rows
                        var pivotedRowIdVector = pivotedDataset
                            .getRowMetadata().add('id');
                        counter = 0;
                        uniquePcls.forEach(function (pcl) {
                            pivotedRowIdVector.setValue(counter++, pcl);
                        });
                        var pclIdToIndex = morpheus.VectorUtil.createValueToIndexMap(pivotedRowIdVector);
                        var pivotedColumnIdVector = pivotedDataset
                            .getColumnMetadata().add('id'); // query id
                        var pivotedColumnCellIdVector = pivotedDataset
                            .getColumnMetadata().add('cell_id');

                        var queryIdVector = pclCell.getColumnMetadata().getByName('id');
                        var cellArray = uniqueCells.values();
                        counter = 0;
                        for (var j = 0; j < nqueries; j++) {
                            var queryId = queryIdVector.getValue(j);
                            for (var i = 0; i < cellArray.length; i++) {
                                var cellId = cellArray[i];
                                pivotedColumnIdVector.setValue(counter, queryId);
                                pivotedColumnCellIdVector.setValue(counter, cellId);
                                counter++;
                            }
                        }

                        var uniqueIdToIndex = morpheus.VectorUtil.createValueToIndexMap(addUniqueId(pivotedDataset));
                        for (var j = 0; j < nqueries; j++) {
                            var queryId = queryIdVector.getValue(j);
                            for (var i = 0, size = pclCellVector.size(); i < size; i++) {
                                var cell = pclCellVector.getValue(i);
                                var columnIndex = uniqueIdToIndex.get(queryId + '-' + cell);
                                var rowIndex = pclIdToIndex.get(pclIdVector
                                    .getValue(i));
                                pivotedDataset
                                    .setValue(rowIndex, columnIndex,
                                        pclCell.getValue(i, j));
                            }
                        }
                        pclCell = pivotedDataset;
                    } else {
                        pclCell = new morpheus.TransposedDatasetView(
                            pclCell);
                        addUniqueId(pclCell);
                    }
                    if (pclSummary != null) {
                        // add summary column to PCL cell by joining by pert id
                        pclCell = new morpheus.TransposedDatasetView(
                            new morpheus.JoinedDataset(
                                new morpheus.TransposedDatasetView(
                                    pclCell),
                                new morpheus.TransposedDatasetView(
                                    pclSummary), 'id', 'id'));
                    }
                    var pclPertTypeVector = pclCell.getRowMetadata()
                        .add('type');
                    for (var i = 0, size = pclPertTypeVector.size(); i < size; i++) {
                        pclPertTypeVector.setValue(i, 'PCL');
                    }

                    // merge gutc and PCL results
                    cellDataset = cellDataset ? new morpheus.JoinedDataset(
                        cellDataset, pclCell, '_id', '_id')
                        : pclCell;
                } else if (pclSummary != null) {
                    cellDataset = cellDataset ? new morpheus.JoinedDataset(
                        cellDataset, pclSummary, 'id', 'id')
                        : pclSummary;
                }
                if(!cellDataset){
                    cellDataset = sigGCT;
                }
                if(cellDataset.getRowMetadata()) {
                    var sourceIndex = morpheus.MetadataUtil.indexOf(
                        cellDataset.getRowMetadata(), 'Source');
                    if (sourceIndex !== -1) {
                        cellDataset.getRowMetadata().remove(sourceIndex);
                    }
                }

                var mergedDataset = cellDataset;
                var pertDoseVector = mergedDataset.getColumnMetadata()
                    .getByName('pert_idose');
                if (pertDoseVector) {
                    var regex = /um/;
                    for (var i = 0, size = pertDoseVector.size(); i < size; i++) {
                        var value = '' + pertDoseVector.getValue(i);
                        pertDoseVector.setValue(i, value.replace('um',
                            '\u00B5m'));
                    }
                }

                if (annotationLines) {
                    var opts = {};
                    opts.dataset = mergedDataset;
                    opts.fileColumnNamesToInclude = null;
                    opts.lines = annotationLines;
                    opts.isColumns = true;
                    opts.sets = null;
                    opts.metadataName = 'id';
                    opts.fileColumnName = annotationLines[0].split(/\t/)[0];

                    new morpheus.OpenFileTool().annotate(opts);
                }
                if (rowAnnotationLines) {
                    var opts = {};
                    opts.dataset = mergedDataset;
                    opts.fileColumnNamesToInclude = null;
                    opts.lines = rowAnnotationLines;
                    opts.isColumns = false;
                    opts.sets = null;
                    opts.metadataName = 'id';
                    opts.fileColumnName = rowAnnotationLines[0].split(/\t/)[0];
                    new morpheus.OpenFileTool().annotate(opts);
                }

                if (queryName != null) {
                    var nameVector = mergedDataset.getColumnMetadata()
                        .getByName('name');

                    if (!nameVector) {
                        nameVector = mergedDataset.getColumnMetadata()
                            .add('name');
                    }

                    for (var j = 0; j < nameVector.size(); j++) {
                        nameVector.setValue(j, queryName);
                    }

                }
                // remove columns that contain missing values only
                var columns = [];
                for (var j = 0, ncols = mergedDataset.getColumnCount(); j < ncols; j++) {
                    for (var i = 0, nrows = mergedDataset.getRowCount(); i < nrows; i++) {
                        if (!isNaN(mergedDataset.getValue(i, j))) {
                            columns.push(j);
                            break;
                        }
                    }
                }
                mergedDataset = columns.length !== mergedDataset
                    .getColumnCount() ? new morpheus.SlicedDatasetView(
                    mergedDataset, null, columns)
                    : mergedDataset;
                var tmp = mergedDataset.getColumnMetadata().getByName('_id');
                if (tmp) {
                    tmp.setName('id');
                }
                var tmp = mergedDataset.getColumnMetadata().getByName('id');
                if (tmp) {
                    tmp.setName('_id');
                }

                if(options.overrideColumns) {
                    var keys = Object.keys(options.overrideColumns);
                    keys.forEach(function(key) {
                        var colMeta = mergedDataset.getColumnMetadata().getByName(key);
                        if(!colMeta) {
                          colMeta = mergedDataset.getColumnMetadata().add(key);
                        }
                        var val = options.overrideColumns[key];
                        // if(val.length>25) {
                        //     console.log("Val2: ",val);
                        //     val=val.slice(0,23) + '...';
                        // }
                        for(var i=0; i<colMeta.size(); i++) {
                            colMeta.setValue(i,val);
                        }
                    })

                }

                deferred.resolve(mergedDataset);

            },
            function (err) {
                console.log('Unable to read GUTC results. Error: '
                    + err);
                deferred.reject('Unable to read GUTC results.');
            }
        );
    return deferred.promise();
};

clue.newPlot = function (myPlot, traces, layout, config) {
    Plotly.newPlot(myPlot, traces, layout, config);
    var $a = $('<a data-toggle="tooltip" title="Toggle mode bar" href="#" style="fill: rgb(68,' +
        ' 122,' +
        ' 219);position:' +
        ' absolute;top:' +
        ' -2px;right:-6px;z-index:' +
        ' 1002;"><svg height="1em" width="1em" viewBox="0 0 1542 1000"><path d="m0-10h182v-140h-182v140z m228 146h183v-286h-183v286z m225 714h182v-1000h-182v1000z m225-285h182v-715h-182v715z m225 142h183v-857h-183v857z m231-428h182v-429h-182v429z m225-291h183v-138h-183v138z" transform="matrix(1 0 0 -1 0 850)"></path></svg></a>');
    var $myPlot = $(myPlot);
    $a.appendTo($myPlot);
    var $modeBar = $(myPlot).find('.modebar');
    $modeBar.css('display', 'none');
    $a.on('click', function (e) {
        e.preventDefault();
        $modeBar.toggle();
    });
};

clue.getPlotlyDefaults2 = function () {
    var plotly = clue.getPlotlyDefaults();
    plotly.layout.width = 600;
    plotly.layout.height = 600;
    plotly.layout.margin = {
        l: 40,
        r: 10,
        t: 40,
        b: 40,
        autoexpand: true
    };
    delete plotly.config.displayModeBar;
    return plotly;
};

clue.BUTTONS_TO_REMOVE_FOR_STATIC_CHART = ['select2d', 'lasso2d']; // ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'resetScale2d'];
clue.getPlotlyDefaults = function () {
    var layout = {
        hovermode: 'closest',
        autosize: true,
        // paper_bgcolor: 'rgb(255,255,255)',
        // plot_bgcolor: 'rgb(229,229,229)',
        showlegend: false,
        margin: {
            l: 80,
            r: 10,
            t: 8, // leave space for modebar
            b: 14,
            autoexpand: true
        },
        titlefont: {
            size: 12
        },
        xaxis: {
            zeroline: false,
            titlefont: {
                size: 12
            },
            // gridcolor: 'rgb(255,255,255)',
            showgrid: true,
            //   showline: true,
            showticklabels: true,
            tickcolor: 'rgb(127,127,127)',
            ticks: 'outside'
        },
        yaxis: {
            zeroline: false,
            titlefont: {
                size: 12
            },
            // gridcolor: 'rgb(255,255,255)',
            showgrid: true,
            //   showline: true,
            showticklabels: true,
            tickcolor: 'rgb(127,127,127)',
            ticks: 'outside'
        }
    };

    // var toImage = {
    //   name: 'toImage',
    //   title: 'Download plot as a svg',
    //   icon: Icons.camera,
    //   click: function (gd) {
    //     var format = 'svg';
    //     Lib.notifier('Taking snapshot - this may take a few seconds', 'long');
    //     downloadImage(gd, {'format': format})
    //     .then(function (filename) {
    //       Lib.notifier('Snapshot succeeded - ' + filename, 'long');
    //     })
    //     .catch(function () {
    //       Lib.notifier('Sorry there was a problem downloading your snapshot!', 'long');
    //     });
    //   }
    // };
    var config = {
        modeBarButtonsToAdd: [],
        showLink: false,
        displayModeBar: true, // always show modebar
        displaylogo: false,
        staticPlot: false,
        showHints: true,
        modeBarButtonsToRemove: ['sendDataToCloud', 'zoomIn2d', 'zoomOut2d', 'hoverCompareCartesian', 'hoverClosestCartesian']
    };
    return {
        layout: layout,
        config: config
    };
};
