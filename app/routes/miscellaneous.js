
module.exports = function (app,callback) {
    const miscellaneous = require("./miscellaneous/miscellaneous");
    const sanitize = require('../../app/middleware/sanitizeurl');

    app.get('/api_config', miscellaneous.api_config );
    app.get('/demo-page', [sanitize],miscellaneous.demo_page);
    app.get('/build-info',[sanitize], miscellaneous.build_info);
    app.get('/server_info', [sanitize], miscellaneous.server_info);
    return callback();
}
