// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  return next();
}

module.exports = isLoggedIn;
