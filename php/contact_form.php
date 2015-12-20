<?php
// Fetching Values from URL.
$name = $_POST['name1'];
$email = $_POST['email1'];
$message = $_POST['message1'];
$email = filter_var($email, FILTER_SANITIZE_EMAIL); // Sanitizing E-mail.
// After sanitization Validation is performed
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {

$subject = $name;
// To send HTML mail, the Content-type header must be set.
$browser = $_SERVER['HTTP_USER_AGENT'] . "\n\n";
$headers = 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-type: text/html; charset=UTF-8' . "\r\n";
$headers .= 'From:' . $email. "\r\n"; // Sender's Email
$headers .= 'Cc:' . $email. "\r\n"; // Carbon copy to Sender
$template = '<div style="padding:50px; color:white;">Hello ' . $name . ',<br/>'
. '<br/>Thank you for contacting OpenRouteService.<br/><br/>'
. 'Name:' . $name . '<br/>'
. 'Email:' . $email . '<br/>'
. 'Browser:' . $browser . '<br/>'
. 'Message:' . $message . '<br/><br/>'
. 'This is a Contact Confirmation mail.'
. '<br/>'
. 'We Will contact You as soon as possible. The ORS Team.</div>';
$sendmessage = "<div style=\"background-color:#7E7E7E; color:white;\">" . $template . "</div>";
// Message lines should not exceed 70 characters (PHP rule), so wrap it.
$sendmessage = wordwrap($sendmessage, 70);
// Send mail by PHP Mail Function.
mail('openrouteservice@geog.uni-heidelberg.de', $subject, $sendmessage, $headers);
echo "Your Query has been received, We will contact you soon.";

} else {
echo "<span>* invalid email *</span>";
}
?>

