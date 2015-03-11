<?php
/*+-------------+----------------------------------------------------------*
 *|        /\   |   University of Bonn                                     *
 *|       |  |  |     Department of Geography                              *
 *|      _|  |_ |     Chair of Cartography                                 *
 *|    _/      \|                                                          *
 *|___|         |                                                          *
 *|             |     Meckenheimer Allee 172                               *
 *|             |     D-53115 Bonn, Germany                                *
 *+-------------+----------------------------------------------------------*/
/**
 * <p><b>Title: Connect to Web Service </b></p>
 * <p><b>Description:</b> Functions for connect to web service </p>
 *
 * <p><b>Copyright:</b> Copyright (c) 2008</p>
 * <p><b>Institution:</b> University of Bonn, Department of Geography</p>
 * @author Pascal Neis, neis@geographie.uni-bonn.de
 * @version 1.0 2008-07-11
 */
 
///////////////////////////////////////////////////
//Function die XML Request an einen WebService sendet und Response zurück gibt

function post($host, $path, $data, $timeout, $port) {
	$http_response = '';
	$content_length = strlen($data);
	$fp = fsockopen($host, $port, $errno, $errdesc, $timeout);
	if(!$fp){
		die("Konnte Verbindung zu $host nicht öffnen:\nFehler:"."$errno \n Beschreibung: $errdesc \n");
	}
	fputs($fp, "POST $path HTTP/1.1\r\n");
	fputs($fp, "Host: $host\r\n");
	//fputs($fp, "Content-Type: application/x-www-form-urlencoded\r\n");
	fputs($fp, "Content-Type: application/xml\r\n");
	fputs($fp, "HTTP_CLIENT_IP: ".$_SERVER['REMOTE_ADDR']."\r\n");
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
