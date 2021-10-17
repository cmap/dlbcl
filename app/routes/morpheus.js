/**
 * Created by jasiedu on 4/14/18.
 */

module.exports = function (app,express,callback) {
    const morpheus = require('./morpheus/morpheus');
    const sanitize = require('../../app/middleware/sanitizeurl');
    app.get('/morpheus/',[sanitize], morpheus.read);
    app.use('/morpheus', express.static(__dirname + '/public/morpheus', {
        etag: false,
        cacheControl: false,
        setHeaders: function (res, path) {
            res.removeHeader("Last-Modified");
            res.setHeader("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "Wed, 11 Jan 1984 05:00:00 GMT");
            res.setHeader('Access-Control-Allow-Origin', '*'); // cors
        }
    }));
    return callback();
}