
// requests for API configuration
exports.api_config = function (req, res) {
    res.jsonp([]);
};
exports.demo_page = function (req, res) {
    res.render('demo-page');
}

exports.build_info = function (req, res) {
    //var git = require('git-rev');
    const git = require('git-last-commit');
    git.getLastCommit(function (err, commit) {
        if (err) {
            console.log("error", err);
            return;
        }
        var unix_timestamp = Number(commit.authoredOn);
        var date = new Date(unix_timestamp * 1000);
        res.json({
            SHORT: commit.shortHash,
            branch: commit.branch,
            SHA: commit.hash,
            DATE: date.toDateString()
        });
    });
}

exports.server_info = function (req, res) {
    res.json({"organization": "public"});
}
exports.login = function (req, res) {
    res.redirect('/');
}

