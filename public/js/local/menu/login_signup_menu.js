var $loginModal = $('#loginModal');

var $logoutForm = $('#logout-form');
var $logoutTitle = $('#logout-title');

var $loginForm = $('#login-form');
var $loginTitle = $('#login-title');

var $settingsTitle = $('#settings-title');
var $settingsForm = $('#settings-form');

var $forgotPasswordTitle = $('#forgot-password-title');
var $forgotPasswordForm = $('#forgot-password-form');
var $accountActivatedTitle = $('#account-activated-title');

var $signUpTitle = $('#signup-title');
var $signUpForm = $('#signup-form');

var $accountCreationTitle = $('#account-creation-success-title');
var $otherAcademicTrainingCheckbox = $('#other');

var academicTrainingErrorsElt = $('#academicTrainingErrors');

var $otherAcademicTrainingTextInput = $('#other-academicTraining');

var $researchRoles = $('#researchRoles');
var $academicTraining = $('#academicTraining');
var hasLoadedResearchRoles = false;
var hasDeterminedAttestationRequirements = false;
var hasLoadedAcademicTraining = false;

var forms = [$logoutForm, $loginForm, $forgotPasswordForm, $signUpForm, $settingsForm];
var titles = [$logoutTitle, $loginTitle, $forgotPasswordTitle, $signUpTitle, $accountActivatedTitle, $settingsTitle, $accountCreationTitle];

var next;
var loadMenuAfterLogin = false;

var validatorOptions = {'disable': false};

var hideAllFormsAndTitles = function () {
    _.each(forms, function ($form) {
        $form.hide();
    });
    _.each(titles, function ($title) {
        $title.hide();
    });
};

$('#loginbutton').on("click", function(e){
    $("#login-form").attr('action', '/signin');
})

$('#forgotpasswordbutton').on("click", function(e){
    $("#forgot-password-form").attr('action', '/signin');
})

$('#logoutbutton').on("click", function(e){
    $("#logout-form").attr('action', '/signout');
})

$('#createaccountbutton').on("click", function(e){
    $("#signup-form").attr('action', '/signup');
})

$loginModal.on('show.bs.modal', function (e) {
    _.each(forms, function ($form) {
        $form.hide();
    });
    _.each(titles, function ($title) {
        $title.hide();
    });

    $loginTitle.show();
    $loginForm.show();

    if (!hasDeterminedAttestationRequirements) {
        determineNonProfitAttestionRequirements();
    }
    if (!hasLoadedResearchRoles) {
        loadResearchRoles();
    }
    if (!hasLoadedAcademicTraining) {
        loadAcademicTraining();
    }
});

var loadAcademicTraining = function () {
    hasLoadedAcademicTraining = true;
    hasLoadedResearchRoles = true;
    var at = clue.getAcademicTraining(function (error, data) {});
    at.done(function(data){
        $academicTraining.empty();
        data.forEach(function (role, index) {
            var roleId = 'AcademicTraining' + index;
            var roleValue = role.name;
            var roleName = role.name;
            var checkbox = '<input id="' + roleId + '" type="checkbox" value="' + roleValue + '" name="academicTraining">&nbsp;' + roleName;
            var option = '<div class="modal-form-copy"><label for="' + roleId + '" class="light-text">' + checkbox + '</label></div>';
            $academicTraining.append(option);
        });
        $academicTraining.find('input[type="checkbox"]').on('click', function (evt) {
            validateAcademicTraining();
        });
    }).fail(function(error){
        console.error('Could not find research roles due to: ' + error);
    });
};

var loadResearchRoles = function () {
    hasLoadedResearchRoles = true;
    var rr = clue.getResearchRoles(function (error, data) {});
    rr.done(function(data){
        $researchRoles.empty();
        data.forEach(function (role, index) {
            var roleId = 'ResearchRole' + index;
            var roleValue = role.name;
            var roleName = role.name;
            var checkbox = '<input id="' + roleId + '" type="radio" value="' + roleValue + '" name="research-role-group" data-error="Please select one" required="">&nbsp;' + roleName;
            var option = '<div class="modal-form-copy"><label for="' + roleId + '" class="light-text">' + checkbox + '</label></div>';
            $researchRoles.append(option);
        });
    }).fail(function(error){
        console.error('Could not find research roles due to: ' + error);
    });
};

var determineNonProfitAttestionRequirements = function () {
    hasDeterminedAttestationRequirements = true;
    //TODO: cache

    clue.getServerInfo(function(error,data){
        if(error){
            console.error('Could not determine installation type due to: ' + error);
            return;
        }
        var requireAttestation = ('public' === data.organization);
        var nonProfitAttestationElt = $('#nonProfitAttestation');
        if (requireAttestation) {
            nonProfitAttestationElt.prop('required', true);
            nonProfitAttestationElt.show();
        }
        else {
            nonProfitAttestationElt.prop('required', false);
            nonProfitAttestationElt.hide();
        }
    });
};

$('#institution').typeahead({
    name: 'institutions',
    limit: 10,
    remote: {
        'url': clue.autoCompleteInstituteUrl() + '?q=%QUERY',
        'filter': function (parsedResponse) {
            var datums = [];
            parsedResponse.forEach(function (o) {
                var institute = o.institute;
                datums.push({
                    'value': institute,
                    'tokens': institute
                })
            });
            return datums;
        }
    }
});

$loginForm.find('[name=forgot]').on('click', function (e) {
    e.preventDefault();
    _.each(forms, function ($form) {
        $form.hide();
    });
    _.each(titles, function ($title) {
        $title.hide();
    });
    $forgotPasswordTitle.show();
    $forgotPasswordForm.show();

});

$loginForm.find('[name=create-account]').on('click', function (e) {
    e.preventDefault();
    _.each(forms, function ($form) {
        $form.hide();
    });
    _.each(titles, function ($title) {
        $title.hide();
    });
    $signUpTitle.show();
    $signUpForm.show();
});

hideLoginModal = function () {
    $loginForm.find('[name=messageText]').text('');
    $loginForm.find('[name=messageGroup]').hide();
    $loginModal.modal('hide');
    $loginTitle.hide();
    $loginForm.hide();
};

$loginForm.validator(validatorOptions).on('submit', function (e) {
    var returnTo = $('#returnTo').val();

    if (e.isDefaultPrevented()) {
        // handle the invalid form...
    } else {
        e.preventDefault();
        // everything looks good!
        $.ajax({
            url: '/signin',
            method: 'POST',
            data: {
                email: $loginForm.find('[name=email]').val().toLowerCase(),
                password: $loginForm.find('[name=password]').val(),
                returnTo: returnTo
            }
        })
            .done(
                function (r) {
                    if (r.api_key) {
                        clue.USER_KEY = r.api_key;
                    }
                    if (r.returnTo && r.user_id) {
                        $('#header-login').trigger('clue-login', [r.user_name]);
                        document.location.href = r.returnTo;
                        hideLoginModal();
                    }
                    else if (r.user_id) {
                        $('#header-login').trigger('clue-login', [r.user_name]);
                        // see if 2 factor auth is required
                        scarpa.appLaunch();

                        if (r.twofactorRequired) {
                            document.location.href = '/login-otp';
                        }
                        else {

                            if (typeof CLUE_ORIGINAL_URL !== 'undefined' && '/api_config' !== CLUE_ORIGINAL_URL && '/settings' !== CLUE_ORIGINAL_URL) {
                                document.location.href = CLUE_ORIGINAL_URL;
                            }
                            else if (next != null) {
                                document.location.href = next;
                            }
                            else if (loadMenuAfterLogin) {
                                showMenu();
                            }
                            hideLoginModal();
                        }

                    } else {
                        if(r.returnTo && (r.returnTo.indexOf("jwt=") > -1)){
                            document.location.href = r.returnTo;
                        }
                        else {
                            $loginForm.find('[name=messageText]').text('The email address or password you entered is incorrect. Please try again or create an account.');
                            $loginForm.find('[name=messageGroup]').show();
                        }
                    }
                    populateToolsAndMainMenu();

                })
            .fail(
                function (err) {
                    $loginForm.find('[name=messageText]').text("We are unable to process your request at this time. If you are still unable to perform this action after a few tries please contact clue@broadinstitute.org");
                    $loginForm.find('[name=messageGroup]').show();
                });

    }
});

var clearAcademicTrainingErrors = function () {
    academicTrainingErrorsElt.text('');
    academicTrainingErrorsElt.hide();
};

var showAcademicTrainingError = function (errorText) {
    academicTrainingErrorsElt.text(errorText);
    academicTrainingErrorsElt.show();
};

$otherAcademicTrainingCheckbox.change(function () {
    if (this.checked) {
        $otherAcademicTrainingTextInput.show();
    }
    else {
        $otherAcademicTrainingTextInput.hide();
        clearAcademicTrainingErrors();
    }
});

var validateAcademicTraining = function () {
    clearAcademicTrainingErrors();
    var academicTraining = $('input[name="academicTraining"]:checked').map(function () {
        return $(this).val();
    }).get();

    var hasOtherAcademicTraining = academicTraining.indexOf('other') > -1;
    if (hasOtherAcademicTraining) {
        var academicTrainingText = $('#other-academicTraining').val();
        if (academicTrainingText.trim().length == 0) {
            showAcademicTrainingError('Please specify your academic training');
            return false;
        }
    }
    if (academicTraining.length == 0) {
        showAcademicTrainingError('Please choose one or more options');
        return false;
    }
    return true;
};

var getAcademicTraining = function () {
    var academicTraining = [];

    $('input[name="academicTraining"]:checked').map(function () {
        academicTraining.push($(this).val());
    });

    var customAcademicTraining = $otherAcademicTrainingTextInput.val();
    if (customAcademicTraining) {
        if (customAcademicTraining.trim().length > 0) {
            academicTraining.push(customAcademicTraining);
        }
    }
    return academicTraining;
};

returnToLoginModal = function (evt) {
    evt.preventDefault();
    $signUpForm.hide();
    $loginForm.show();
};

showEmailAlreadyUsed = function (inputField) {
    var parent = inputField.parent();
    parent.addClass('has-error');
    if ($('#emailErrors').children().length === 0) {
        $('#emailErrors').append('<ul class="list-unstyled"><li>Email address already in use.  <a id="login_from_email">Login with existing account</a></li></ul>');
        $('#login_from_email').on('click', function (evt) {
            returnToLoginModal(evt);
        });
    }
};

showEmailNotRecognized = function (emailField) {
    var emailAddress = emailField.val().toLowerCase().split("@")[1];
    var parent = emailField.parent();
    parent.addClass('has-error');
    if ($('#emailErrors').children().length === 0) {
        $('#emailErrors').append('<ul class="list-unstyled"><li>' + emailAddress + ' is not from a recognized academic or non-profit organization, please try again or email clue@broadinstitute.org for help.</li></ul>');
        $('#login_from_email').on('click', function (evt) {
            returnToLoginModal(evt);
        });
    }
};

removeEmailAlreadyUsed = function (inputField) {
    $('#emailErrors').children().remove();
    inputField.parent().removeClass('has-error');
};

removeEmailNotRecognized = function (callback) {
    $('#messageText').text("");
    return callback();
};

disableInstitutionEntry = function () {
    var institutionElt = $('#institution');
    institutionElt.css('background-color', '#f5f5f5');
    institutionElt.attr('disabled', 'disabled');
    var attestationElt = $('#nonProfitAttestation');
    attestationElt.prop('required', false);
    attestationElt.hide();
};

enableInstitutionEntry = function () {
    var institutionElt = $('#institution');
    institutionElt.css('background-color', '');
    institutionElt.removeAttr('disabled');
    var attestationElt = $('#nonProfitAttestation');
    attestationElt.prop('required', true);
    attestationElt.show();
};

clearInstitutionSelection = function () {
    $('#institution').val('');
};

setInstitution = function (institutionText) {
    $('#institution').val(institutionText);
    $('#institutionErrors').children().remove();
    $('#instituteEntry').removeClass('has-error');
};

checkEmail = function (callback) {
    var emailInput = $("#email");
    var emailAddress = emailInput.val().toLowerCase();
    clue.userExists(emailAddress)
        .done(function (data) {
            if (data.exists) {
                showEmailAlreadyUsed(emailInput);
                return callback("User already exists");
            }
            else {
                removeEmailAlreadyUsed(emailInput);
                if (emailAddress) {
                    var output = clue.isDomainOnWhitelist(emailInput.val());
                    output.done(function (results) {
                        if (!(results.exists)) {
                            showEmailNotRecognized(emailInput);
                            return callback("Email not recognized");
                        }
                        else {
                            return callback();
                        }
                    })
                }
                else {
                    return callback();
                }
            }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            var error = 'Could not lookup email due to ' + JSON.stringify(errorThrown);
            console.error(error);
            return callback(error);
        });
};

// $signUpForm.on('validated.bs.validator',function(evt) {
//     //console.log("TRIGGERED");
//     if ('email'===evt.relatedTarget.id) {
//         checkEmail();
//         removeEmailNotRecognized();
//     }
// });

function guessInstitution(emailAddress, callback) {
    var guessedInstitution;
    clue.guessInstitutionFromEmail(emailAddress)
        .done(function (data) {
            if (data) {
                if (data.institute) {
                    guessedInstitution = data.institute;
                    setInstitution(guessedInstitution);
                    disableInstitutionEntry();
                }
            }
            if (!guessedInstitution) {
                clearInstitutionSelection();
                enableInstitutionEntry();
            }
            return callback();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            clearInstitutionSelection();
            enableInstitutionEntry();
            var error = null;
            if (jqXHR.status !== 200) {
                error = 'Could not infer institute via email due to ' + JSON.stringify(errorThrown);
                console.log(error);
            }
            return callback(error);
        });
}

$signUpForm.find('[id=email]').on('change', function (evt) {
    var target = $(evt.target);
    //callback
    checkEmail(function (error) {
        removeEmailNotRecognized(function (error) {
            var emailAddress = $(evt.target).val();
            guessInstitution(emailAddress, function (error) {
            });
        });
    });
});

$signUpForm.find('[id=return_to_login]').on('click', function (evt) {
    returnToLoginModal(evt);
});

var showSignupSuccess = function (successMessage) {
    $('#success-message-from-server').text(successMessage);
    $accountCreationTitle.show();
};

$signUpForm.validator(validatorOptions).on('submit', function (e) {
    var hasError = e.isDefaultPrevented();
    e.preventDefault();

    var academicTraining,
        inputValues;

    var hasChosenAcademicTraining = validateAcademicTraining();
    var affiliation = $('#institution').val();
    if (hasChosenAcademicTraining) {
        academicTraining = getAcademicTraining();
    }
    else {
        hasError = true;
    }

    if (!affiliation) {
        hasError = true;
    }

    if ($('#emailErrors').children().length > 0) {
        $('#email').parent().addClass('has-error');
    }

    if (!hasError) {
        $signUpForm.find('[name=messageText]').text('');

        inputValues = {
            'email': $signUpForm.find('[name=email]').val().toLowerCase(),
            'password': $signUpForm.find('[name=password]').val(),
            'institution': affiliation,
            'firstName': $signUpForm.find('[name=firstName]').val(),
            'lastName': $signUpForm.find('[name=lastName]').val(),
            'academicTraining': academicTraining,
            'researchRole': $signUpForm.find('[name=research-role-group]:checked').val()
        };

        $.ajax({
            url: '/register',
            method: 'POST',
            data: inputValues
        }).done(function (data) {
            if (data.error) {
                var emailInput = $('#email');
                if (data.errorCode == 'email_already_used') {
                    showEmailAlreadyUsed(emailInput);
                }
                else {
                    removeEmailAlreadyUsed(emailInput);
                    $signUpForm.find('[name=messageText]').text(data.error);
                    $signUpForm.find('[name=messageGroup]').show();
                }
            } else {
                hideAllFormsAndTitles();
                showSignupSuccess(data.message);
                //$signUpForm.find('[name=messageText]').text(data.message);
                //$signUpForm.find('[name=messageGroup]').show();
            }
        }).fail(
            function (err) {
                $signUpForm.find('[name=messageText]').text("We are unable to process your request at this time. If you are still unable to perform this action after a few tries please contact clue@broadinstitute.org");
                $signUpForm.find('[name=messageGroup]').show();
            });

    }
});

$forgotPasswordForm.find('[name=create-account]').on('click', function (e) {
    e.preventDefault();
    _.each(forms, function ($form) {
        $form.hide();
    });
    _.each(titles, function ($title) {
        $title.hide();
    });
    $signUpTitle.show();
    $signUpForm.show();
});

$logoutForm.find('[name=settings]').on('click', function (e) {
    e.preventDefault();
    hideAllFormsAndTitles();
    clue.getSettings(function (err, result) {$('#setting_institution').html('<strong>Institution: </strong>' + result.institution);
        $('#setting_email').html('<strong>Email: </strong>' + result.email);
        $('#apiKey').html('<strong>API KEY: </strong>' + clue.USER_KEY);
        $('#roles').html('<strong>Roles: </strong>' + result.roles);
        $settingsTitle.show();
        $settingsForm.show();});
});

$settingsForm.find('[name=ok]').on('click', function (e) {
    e.preventDefault();
    hideAllFormsAndTitles();
    $settingsForm.hide();
    $logoutTitle.show();
    $logoutForm.show();
});

$forgotPasswordForm.validator(validatorOptions);

$forgotPasswordForm.on('submit', function (e) {
    e.preventDefault();
    var hasValidEmail = !$forgotPasswordForm.find('[name=email]').parent().hasClass('has-error');
    var email = $forgotPasswordForm.find('[name=email]').val().toLowerCase();
    var $this = $(this);

    if (hasValidEmail) {
        $.ajax({
            url: '/password_reset',
            method: 'POST',
            data: {
                'email': email
            }
        })
            .done(function (data) {
                $forgotPasswordForm.find('[name=messageText]').text('');
                if (data.error) {
                    $forgotPasswordForm.find('[name=messageText]').text(data.error);
                    $forgotPasswordForm.find('[name=messageGroup]').show();
                } else {
                    $forgotPasswordForm.find('[id=forgotEmailText]').text(data.message);
                    $forgotPasswordForm.find('[name=passwordEmailSuccess]').show();
                    $forgotPasswordForm.find('[name=messageGroup]').hide();
                    $forgotPasswordForm.find('[id=resetEmail]').hide();
                    $forgotPasswordForm.find('[id=resetEmailSubmit]').hide();
                    $forgotPasswordForm.find('[id=resetPasswordCreateAccount]').hide();
                    $('#forgotPasswordInstructions').hide();
                }
            }).fail(
            function (err) {
                $forgotPasswordForm.find('[name=messageText]').text("We were unable to find your email. If you have an existing account and are still unable to perform this action after a few tries please contact clue@broadinstitute.org");
                $forgotPasswordForm.find('[name=messageGroup]').show();
            }
        );
    }
});
