jQuery(document).ready(function($) {
    $("#submit_feedback").click(function() {
        var name = $("#name").val();
        var email = $("#email").val();
        var message = $("#message").val();
        //checking for blank fields	
        if (name === '' && email === '') {
            $("#feedback_error_message").show();
            $("#feedback_error_message_2").hide();
            $("#feedback_error_message_3").hide();
            $("#feedback_error_message_4").hide();
            $("#feedback_success_message").hide();
            $("#name").css("border","2px solid orange");
            $("#email").css("border","2px solid orange");
        } 
        else if (name === ''){
            $("#feedback_error_message_2").show();
            $("#feedback_error_message").hide();
            $("#feedback_error_message_3").hide();
            $("#feedback_error_message_4").hide();
            $("#feedback_success_message").hide();
            $("#name").css("border","2px solid orange");
            $("#email").css("border","2px solid green");
        }
        else if (email === ''){
            $("#feedback_error_message_3").show();
            $("#feedback_error_message_2").hide();
            $("#feedback_error_message").hide();
            $("#feedback_error_message_4").hide();
            $("#feedback_success_message").hide();
            $("#email").css("border","2px solid orange");
            $("#name").css("border","1px solid green");
        }
        else {
            // Returns successful data submission message when the entered information is stored in database.
            $("#feedback_success_message").show();
            $("#feedback_error_message").hide();
            $("#feedback_error_message_2").hide();
            $("#feedback_error_message_3").hide();
            $("#feedback_error_message_4").hide();
            $("#email").val("");
            $("#name").val("");
            $("#message").val("");
            $.post("php/contact_form.php", {
                name1: name,
                email1: email,
                message1: message
            }/*, function(data) {
                $('#feedbackModal').modal('hide');
            }*/);
        }
    });
});

