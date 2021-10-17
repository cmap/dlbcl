const CACHE_NAME = "clue";
const CACHING_DURATION = 1800; //cache for 30 minutes
if (typeof str8_cash === 'undefined') {
    str8_cash = {};
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = str8_cash; // Node
}

str8_cash.fetch = async function (url) {
    // Default options are marked with *

    var clueHeaders = new Headers({
        'user_key': clue.USER_KEY
    });

    var headers = {
        method: 'GET',
        headers: clueHeaders
    };
    const response = await fetch(url, headers);
    return response;
}
str8_cash.cacheRetrieve = async function (request) {
    if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(request);

        if (response) {
            const expirationDate = Date.parse(response.headers.get('clue-cache-expires'));
            const now = new Date();
            // Check it is not already expired and return from the
            // cache
            if (expirationDate > now) {
                console.log("Using cache");
                return response;
            }
        }
    }
    return null;
}
str8_cash.cacheSave = async function (request, liveResponse) {
    if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        // return fetch(request.url).then((liveResponse) => {
        // Compute expires date from caching duration
        const expires = new Date();
        expires.setSeconds(
            expires.getSeconds() + CACHING_DURATION,
        );
        // Recreate a Response object from scratch to put
        // it in the cache, with the extra header for
        // managing cache expiration.
        const cachedResponseFields = {
            status: liveResponse.status,
            statusText: liveResponse.statusText,
            headers: {'clue-cache-expires': expires.toUTCString()},
        };
        liveResponse.headers.forEach((v, k) => {
            cachedResponseFields.headers[k] = v;
        });
        const body = await liveResponse.text();
        cache.put(request, new Response(body, cachedResponseFields)); // Return the live response from the network
    }
    return null;
}
str8_cash.cache = async function (request, options) {
    const response = await str8_cash.cacheRetrieve(request);
    if (response) {
        return response;
    }
    var liveResponse = null;
    if (options && options.signurl) {
        var r = clue.API_URL + '/api/s3_resources/signFile?s3_file=' + request;
        const signedURLP = await str8_cash.fetch(r);
        if(signedURLP && signedURLP.ok) {
            const signedURL = await signedURLP.text();
            const sanitizedSignedURL = signedURL.replace(/"/g, "");
            liveResponse = await str8_cash.fetch(sanitizedSignedURL);
        }
    } else {
        liveResponse = await str8_cash.fetch(request);
    }
    if(liveResponse && liveResponse.ok) {
        const returnedResponse = liveResponse.clone();
        await str8_cash.cacheSave(request, liveResponse);
        return returnedResponse;
    }else{
        throw new Error("Ignore error!!!");
    }
}
