clue.addFavorite = function(id,type,callback)
{
    var data = {
        "id" : id
    };

    var request = $.ajax({
        method: "POST",
        url: clue.API_URL + '/api/favorites/' + type,
        data: data,
        dataType: "json"
    });
    request.done(function(msg){
       callback(null,id);
    });
    request.fail(function( jqXHR, textStatus ) {
        callback( "Request failed: " + textStatus,id);
    });
}

clue.removeFavorite= function(id, type,callback) {
    var request = $.ajax({
        method: "DELETE",
        url: clue.API_URL + '/api/favorites/' + type + '/' + id
    });
    request.done(function(msg){
        callback(null,id);
    });
    request.fail(function( jqXHR, textStatus ) {
        console.log( "Request failed: " + textStatus );
        callback("Request failed: " + textStatus ,id);
    });
}

clue.getFavorites = function(type,callback) {
    $.ajax(clue.API_URL + '/api/favorites/' + type).done(function (results) {
        return callback(null,results);
    }).fail(function (err) {
        console.log(err);
        return callback(err);
    });
}
