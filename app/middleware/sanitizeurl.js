function sanitize(req, res, next) {
    const url = require('url');
    const query = url.parse(req.url,true).search;
    if(!query){
        return next();
    }
    const decodedQuery = decodeURI(query);
    const search = decodedQuery.search(/<script[^>]*>.*?<\/script>/gi);
    if(search > -1){
        res.redirect('/');
        return;
    }else{
        return next();
    }
}
module.exports = sanitize;
