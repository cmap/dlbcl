
// ## CORS middleware
//
// see: http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs
const allowCrossDomain = function(req, res, next) {
    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
};
module.exports = {
    allowCrossDomain:allowCrossDomain
};
