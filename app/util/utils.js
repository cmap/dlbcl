// utils.js
// ========
const self = module.exports = {

    logErrors: function (error, callback) {
        console.log("error", error);
        return callback(error);
    },
    logInfo: function (info, callback) {
        console.log("info", info);
        return callback();
    },
    fail: function (res, status, message) {
        console.log("error", message);
        res.status(status);
        res.render(404);
    }
};
module.exports = self;

