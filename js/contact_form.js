jQuery(document).ready(function($) {
    $("#feedbackModal .modal-header .close").click(function() {
        $("#feedback_success_message").hide();
        $("#feedback_error_message").hide();
        $('#feedbackForm .form-group input, #feedbackForm .form-group textarea').val("");
    });
    $("#submit_feedback").click(function() {
        var name = $("#name").val();
        var email = $("#email").val();
        var message = $("#message").val();
        $("#feedback_success_message").hide();
        $("#feedback_errors_message").hide();
        if (!name && !email && !message) {
            $("#feedbackForm #NameFormGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #NameFormGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #TextMessageGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #TextMessageGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
        } else if (!name && !email && message) {
            $("#feedbackForm #NameFormGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #NameFormGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #TextMessageFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #TextMessageFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
        } else if (!name && email && message && ValidateEmail(email) == false) {
            $("#feedbackForm #NameFormGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #NameFormGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #EmailFormGroup").addClass('has-error has-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").addClass('fa fa-times form-control-feedback');
            $("#feedbackForm #TextMessageFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #TextMessageFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
        } else if (!name && email && message && ValidateEmail(email) == true) {
            $("#feedbackForm #NameFormGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #NameFormGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-error has-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-times form-control-feedback');
            $("#feedbackForm #TextMessageFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #TextMessageFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
        } else if (name && !email && !message) {
            $("#feedbackForm #NameFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #NameFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #TextMessageGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #TextMessageGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
        } else if (name && email && !message && ValidateEmail(email) == false) {
            $("#feedbackForm #NameFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #NameFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #EmailFormGroup").addClass('has-error has-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").addClass('fa fa-times form-control-feedback');
            $("#feedbackForm #TextMessageGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #TextMessageGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
        } else if (name && email && !message && ValidateEmail(email) == true) {
            $("#feedbackForm #NameFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #NameFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-error has-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-times form-control-feedback');
            $("#feedbackForm #TextMessageGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #TextMessageGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
        } else if (!name && email && !message && ValidateEmail(email) == false) {
            $("#feedbackForm #NameFormGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #NameFormGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #EmailFormGroup").addClass('has-error has-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").addClass('fa fa-times form-control-feedback');
            $("#feedbackForm #TextMessageGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #TextMessageGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
        } else if (!name && email && !message && ValidateEmail(email) == true) {
            $("#feedbackForm #NameFormGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #NameFormGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-error has-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-times form-control-feedback');
            $("#feedbackForm #TextMessageGroup").addClass('has-warning has-feedback');
            $("#feedbackForm #TextMessageGroup #inputStatus").addClass('fa fa-warning form-control-feedback');
        } else if (name && email && message && ValidateEmail(email) == false) {
            $("#feedbackForm #NameFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #NameFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #EmailFormGroup").addClass('has-error has-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").addClass('fa fa-times form-control-feedback');
            $("#feedbackForm #TextMessageFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #TextMessageFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
        } else if (name && email && message && ValidateEmail(email) == true) {
            $("#feedbackForm #NameFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #NameFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #EmailFormGroup").removeClass('has-error has-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#feedbackForm #EmailFormGroup #inputStatus").removeClass('fa fa-times form-control-feedback');
            $("#feedbackForm #TextMessageFormGroup").removeClass('has-warning has-feedback');
            $("#feedbackForm #TextMessageFormGroup #inputStatus").removeClass('fa fa-warning form-control-feedback');
            $("#submit_feedback").prop("disabled", true);
            $("#submit_feedback span i").show();
            $.ajax({
                type: "POST",
                url: "php/contact_form.php",
                data: {
                    name1: name,
                    email1: email,
                    message1: message
                },
                success: function() {
                    $("#feedback_success_message").show();
                    $('#feedbackForm .form-group input, #feedbackForm .form-group textarea').val("");
                },
                error: function() {
                    $("#feedback_error_message").show();
                },
                complete: function() {
                    $("#submit_feedback").prop("disabled", false);
                    $("#submit_feedback span i").hide();
                }
            });
        }
    });
});

function ValidateEmail(email) {
    var mailCompose = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return mailCompose.test(email);
}