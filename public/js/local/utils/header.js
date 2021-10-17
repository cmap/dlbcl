var NavBar = function (appTitle, path, category, color) {
    this.displayName = appTitle;
    this.user = null;
    this.category = category;
    if (this.category) {
        this.category = this.category.toUpperCase();
    }
    var loginBox = $('#header-login');

    if (scarpa.isLoggedIn()) {
        this.user = clue.getUserInfo().shortName;
        loginBox.addClass('header-pop-down');
        loginBox.css('color', '');

        loginBox.text(this.user);
        $('#header-pop-down').show();
    }
    else {
        loginBox.css('color', 'white');

        loginBox.text('Log in');
        loginBox.css('background-color', '#F15A22');
    }

    var headerAppTitle = $('#header-app-title');
    headerAppTitle.text(this.displayName);
    headerAppTitle.on("click", function () {
        window.location = path;
    });
    //refactor this, have color in database and use it here
    $("#header-app-title").css("color", color);
    headerAppTitle.attr('data-app-title', this.displayName);
};
