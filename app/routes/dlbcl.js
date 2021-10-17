
module.exports = function (app,callback) {
    const dlbcl = require("./dlbcl/dlbcl");
    const sanitize = require('../../app/middleware/sanitizeurl');
    app.get('/dlbcl/dashboard', [sanitize],dlbcl.dashboard);
    return callback();
}
