
const app = require('./app');
let port = process.env.PORT || 9090;
app.start_server(port, function (err, nex) {
    console.log("Started");

});

