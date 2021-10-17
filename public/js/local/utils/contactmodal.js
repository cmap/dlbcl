/**
 * Created by zliu on 6/26/17.
 */

//we called a clue method (in clue.js, getUserInfo) to access the cookie to get user information
function fill_contact() {
    var userinfo = clue.getUserInfo();

    if (userinfo) {
        var lastName = userinfo.fullName.replace(userinfo.shortName,"").trim();
        fill_and_disable(userinfo.shortName, lastName, userinfo.email);
    }
}

function fill_and_disable(firstname, lastname, email){
    $("#contactmodal_firstname").val(firstname).prop("readonly", true);
    $("#contactmodal_lastname").val(lastname).prop("readonly", true);
    $("#contactmodal_email").val(email).prop("readonly", true);
}

function resetContactForm()
{
    if($("#contactmodal_firstname").prop("readonly") !== true)
    {
        $("#contactmodal_firstname").val("");
    }
    if($("#contactmodal_lastname").prop("readonly") !== true)
    {
        $("#contactmodal_lastname").val("");
    }
    if($("#contactmodal_email").prop("readonly") !== true)
    {
        $("#contactmodal_email").val("");
    }
    $("#subject").val("");
    $("#help_message").val("");
    $("#file").val("");
}

$('#contactModal').on('hidden.bs.modal', function () {
    resetContactForm();
    $(".help-block.with-errors").text("");
    $(".form-group").removeClass("has-error");
    $("#resulttext").text("");
});