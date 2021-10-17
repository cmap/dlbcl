module.exports = function (app, next) {
    const indexHandler = require('../../app/middleware/index');
    const sanitize = require('../../app/middleware/sanitizeurl');
    const async = require('async');


    // set up routes based on the desired apps environment
    NODE_ENV = process.env.NODE_ENV;
    //TODO: Do in parallel then at the end add the use functions below
    async.parallel([
            function (callback) {
                require('./dlbcl')(app, callback);
            },
            function (callback) {
                require('./miscellaneous')(app, callback);
            }
        ],
        function (err, results) {
            // home page
            app.get('/', [indexHandler, sanitize], function (req, res) {
                res.redirect('/dlbcl/dashboard');
            });
            //Handle 404
            app.use(function (req, res, next) {
                console.log("error", "Page not found: " + req.url);
                res.render('404.jade', {
                    message: req.url
                });
            });
            app.use(function logErrors(err, req, res, next) {
                console.log("error", err.stack);
                return next(err);
            });
            app.use(function clientErrorHandler(err, req, res, next) {
                if (req.xhr) {
                    console.log("error", err);
                    res.status(500).send({error: 'Something failed!'});
                } else {
                    return next(err);
                }
            });
            app.use(function errorHandler(err, req, res, next) {
                    res.status(500);
                    res.render('error.jade', {error: err});
            });
            return next();

        });
}
