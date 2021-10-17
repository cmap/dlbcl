/**
 * Created by jasiedu on 4/14/18.
 */


exports.read  = function (req, res) {
    res.removeHeader("Last-Modified");
    res.setHeader("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "Wed, 11 Jan 1984 05:00:00 GMT");
    res.setHeader('Access-Control-Allow-Origin', '*'); // cors
    res.render('morpheus.jade', {
        title: "MORPHEUS",
        category: "Tools",
        url: "/morpheus",
        display_color: "#ED1C24"
    });
}
