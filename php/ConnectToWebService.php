<?php
/*+-------------+----------------------------------------------------------*
 *|        /\   |     University of Heidelberg                             *
 *|       |  |  |     Department of Geography                              *
 *|      _|  |_ |     GIScience Research Group                             *
 *|    _/      \|                                                          *
 *|___|         |                                                          *
 *|             |     Berliner Straße 48	                               *
 *|             |     D-69221 Heidelberg, Germany                          *
 *+-------------+----------------------------------------------------------*/
/**
 * <p><b>Title: RS </b></p>
 * <p><b>Description:</b> Functions for RS </p>
 *
 * <p><b>Copyright:</b> Copyright (c) 2015</p>
 * <p><b>Institution:</b> University of Heidelberg, Department of Geography</p>
 * @author Pascal Neis, Enrico Steiger , openrouteservice at geog.uni-heidelberg.de
 * @version 1.0 2015-02-01
 */
 
///////////////////////////////////////////////////
//Function die XML Request an einen WebService sendet und Response zurück gibt

function post($host, $path, $data, $timeout, $port) {
	$http_response = '';
	$content_length = strlen($data);
	$fp = fsockopen($host, $port, $errno, $errdesc, $timeout);
	if(!$fp){
		die("Could not create connection to $host:\nError:"."$errno \n Description: $errdesc \n");
	}
	fputs($fp, "POST $path HTTP/1.1\r\n");
	fputs($fp, "Host: $host\r\n");
	//fputs($fp, "Content-Type: application/x-www-form-urlencoded\r\n");
	fputs($fp, "Content-Type: application/xml\r\n");
	fputs($fp, "HTTP_CLIENT_IP: ".$_SERVER['REMOTE_ADDR']."\r\n");
	$deny = array('');
	foreach ($deny as $denyip) {
	if (strpos($_SERVER['REMOTE_ADDR'], $denyip)===0) {
	header("location: http://www.openrouteservice.org/contact.html");
	exit();
	}}
	fputs($fp, "Accept-Language: ".$_SERVER['HTTP_ACCEPT_LANGUAGE']."\r\n");
	fputs($fp, "User-Agent: ".$_SERVER['HTTP_USER_AGENT']."\r\n");
	fputs($fp, "Content-Length: $content_length\r\n");
	fputs($fp, "Connection: close\r\n\r\n");
	fputs($fp, $data);
	while (!feof($fp)) $http_response .= fgets($fp, 28);
	fclose($fp);

	return $http_response;
}

?>
