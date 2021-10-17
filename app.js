//get all of the libraries we need to run the app
var engines = require("consolidate");
var express = require('express');
var port = process.env.PORT || 9090;
//var mongoose = require('mongoose');
//var passport = require('passport');
var fs = require('fs');
var flash = require('connect-flash');
var session = require('express-session');
//var MongoStore = require('connect-mongo/es5')(session);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var compress = require('compression');
require('./config/kafejo_config.js');
//var configDB = require('./config/database');
var cookie_secret = require("config").cookie_secret;
var session_secret = require("config").session_secret;
var cookieDuration = require("config").cookie_duration;
var favicon = require('serve-favicon');
//mongoose.connect(configDB.url);
//require('./config/passport')(passport); // pass passport for configuration

var http = require('http');
var path = require('path');			//work with paths
var pjax = require('express-pjax');	//express pjax (partial reloads)

var app = express();
//pjax middleware for partials
app.use(pjax());
//send session info to handlebars, check OS used to send correct stylesheet

app.use(compress());
app.use(cookieParser(cookie_secret)); // read cookies (needed for OAuth)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('views', path.join(__dirname, 'views'));
app.engine('jade', engines.jade);

app.use('/public', express.static(__dirname + '/public'));
app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.static('license'));
// required for passport to work
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: session_secret,
    cookie: {
        maxAge: cookieDuration
    }
}));

//app.use(passport.initialize());
//app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in

app.use(function (req, res, next) {

    var ua = req.headers['user-agent'];
    //if (req.session) {
    req.session.isAndroid = (ua.match(/Android/i) != null);
    req.session.isIos = (ua.match(/iPhone|iPad|iPod/i) != null);
    req.session.isDev = (process.env.NODE_ENV != 'production');
    req.session.test = (process.env.NODE_ENV);

    res.locals.session = req.session;
    res.locals.moment = require('moment');



    var include_headers_in_children = true;
    if (req.headers["x-pjax"]) {
        include_headers_in_children = false;
    }
    res.locals.include_headers_in_children = include_headers_in_children;
    next();
});

// error handlers

// development error handler
// will print stacktrace
if (process.env.NODE_ENV === 'development') {
    app.use(function (err, req, res, next) {
        console.log("error",err.message);
        res.status(err.status || 500);
        res.jsonp({
            message: err.message,
            error: err
        });
    });
}
else {//Handle production errors
    app.use(function (err, req, res, next) {
        console.log("error",err.message);
        res.status(err.status || 500);
        res.jsonp({
            message: err.message,
            error: {}
        });
    });
}

function start_server(port,next) {
    var async = require('async');
    app.locals.urlMap = new Map();

    //load apps
    async.parallel([
            function (callback) {
                //morpheus
                require('./app/routes/morpheus')(app,express,callback);
            },
            function (callback) {
                //main routing
                var NODE_ENV;
                NODE_ENV = process.env.NODE_ENV
                require('./app/routes/main')(app, callback);
            }
        ],
        function (err, results) {
            server = app.listen(port);
            //var console = require("./app/util/winston-logger");
            console.log('app listening on port ' + port);
            console.log("Go to http://localhost:" + port);
            return next(null,server);
        }
    );
}

module.exports = {
    start_server: start_server
};
