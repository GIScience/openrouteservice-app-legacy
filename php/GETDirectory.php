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
 * <p><b>Title: DS </b></p>
 * <p><b>Description:</b> Functions for DS </p>
 *
 * <p><b>Copyright:</b> Copyright (c) 2015</p>
 * <p><b>Institution:</b> University of Heidelberg, Department of Geography</p>
 * @author Pascal Neis, Enrico Steiger , openrouteservice at geog.uni-heidelberg.de
 * @version 1.0 2015-02-01
 */
 
	///////////////////////////////////////////////////
	//*** Request erstellen für OpenLS Directory Service ***
	
	include ('CreateDSRequest.php');
	include ('ConnectToWebService.php');

	// webserver	
	$host = 'openls.geog.uni-heidelberg.de';
	$service = '/osm/directory';
	$port = 80;

	if(isset($_POST["Position"]) && isset($_POST["Distance"]) 
		&& isset($_POST["POIname"]) && isset($_POST["POIvalue"]) && isset($_POST["MaxResponse"])){
		
		$position = $_POST["Position"];
		$position = str_replace(",", " ", $position);
		$distance = $_POST["Distance"];
		$POIname = $_POST["POIname"];
		$POIvalue = $_POST["POIvalue"];
		$maxresponse = $_POST["MaxResponse"];

		$request = createDirectoryRequest($position, $distance, $POIname, $POIvalue, $maxresponse);

		//*** Sende Request an Web Service ***
		$http_response = post($host, $service, $request, 20, $port);
	
		//*** Request auswerten ***
		//Header entfernen
		$sExplodeParam = '<?xml';
		if (strchr($http_response, $sExplodeParam)){
		   $aResponse = explode($sExplodeParam,$http_response);

			//Response XML
			$doc = new DOMDocument();
			$doc->loadXML($sExplodeParam . $aResponse[1]);

			header('Content-Type: text/xml');
			echo $sExplodeParam . $aResponse[1];
		}
	}
	// new request nearest search
	else if($_POST["SearchType"]=="name"){
		//isset($_POST["Position"]) && isset($_POST["POIname"]) && isset($_POST["POIvalue"])
		
		$POIvalue = $_POST["Name"];

		$request = createNameRequest($POIvalue);

		//*** Sende Request an Web Service ***
		$http_response = post($host, $service, $request, 20, $port);


		//*** Request auswerten ***
		//Header entfernen
		$sExplodeParam = '<?xml';
		if (strchr($http_response, $sExplodeParam)){
		   $aResponse = explode($sExplodeParam,$http_response);

			//Response XML
			$doc = new DOMDocument();
			$doc->loadXML($sExplodeParam . $aResponse[1]);

			header('Content-Type: text/xml');
			echo $sExplodeParam . $aResponse[1];
		}
	}
	else if($_POST["SearchType"]=="nearest"){
		//isset($_POST["Position"]) && isset($_POST["POIname"]) && isset($_POST["POIvalue"])
		
		$position = $_POST["Position"];
		$position = str_replace(",", " ", $position);
		$POIname = $_POST["POIname"];
		$POIvalue = $_POST["POIvalue"];
		
		
		$request = createNearestRequest($position, $POIname, $POIvalue);

		//*** Sende Request an Web Service ***
		//Server
		$http_response = post($host, $service, $request, 20, $port);
		//$http_response = post('openls', '/openls-osm/directory', $request, 20, 80);

		//*** Request auswerten ***
		//Header entfernen
		$sExplodeParam = '<?xml';
		if (strchr($http_response, $sExplodeParam)){
		   $aResponse = explode($sExplodeParam,$http_response);

			//Response XML
			$doc = new DOMDocument();
			$doc->loadXML($sExplodeParam . $aResponse[1]);

			header('Content-Type: text/xml');
			echo $sExplodeParam . $aResponse[1];
		}
	}else if($_POST["SearchType"]=="dwithin"){
		//isset($_POST["Position"]) && isset($_POST["POIname"]) && isset($_POST["POIvalue"])
		
		$position = $_POST["Position"];
		$position = str_replace(",", " ", $position);
		$mindistance = $_POST["MinDistance"];
		$maxdistance = $_POST["MaxDistance"];
		$POIname = $_POST["POIname"];
		$POIvalue = $_POST["POIvalue"];
		$maxresponse = $_POST["MaxResponse"];
		
		$request = createDWithinRequest($position, $mindistance, $maxdistance, $POIname, $POIvalue, $maxresponse);
		
		// echo $request;
		
		//*** Sende Request an Web Service ***
		$http_response = post($host, $service, $request, 20, $port);


		//*** Request auswerten ***
		//Header entfernen
		$sExplodeParam = '<?xml';
		if (strchr($http_response, $sExplodeParam)){
		   $aResponse = explode($sExplodeParam,$http_response);

			//Response XML
			$doc = new DOMDocument();
			$doc->loadXML($sExplodeParam . $aResponse[1]);

			header('Content-Type: text/xml');

			echo $sExplodeParam . $aResponse[1];
		}
	}else if($_POST["SearchType"]=="polygon"){
		$polygon = $_POST["Polygon"];
		$POIname = $_POST["POIname"];
		$POIvalue = $_POST["POIvalue"];
		$maxresponse = $_POST["MaxResponse"];
		
		$request = createPolygonRequest($polygon, $POIname, $POIvalue, $maxresponse);
		

		
		//*** Sende Request an Web Service ***
		$http_response = post($host, $service, $request, 20, $port);

//		echo "HTTP-RESPONSE*****************************";

		
		//*** Request auswerten ***
		//Header entfernen
		$sExplodeParam = '<?xml';
		
		if (strchr($http_response, $sExplodeParam)){
		   $aResponse = explode($sExplodeParam,$http_response);
		
//		echo "a-RESPONSE*****************************";
//		echo $sExplodeParam . $aResponse[1];
//		echo "*****************************";
		
			//Response XML
			$doc = new DOMDocument();
			$doc->loadXML($sExplodeParam . $aResponse[1]);

			header('Content-Type: text/xml');
			echo $sExplodeParam . $aResponse[1];
		}
		
		
		
	}
	
	else{
		echo "Nothing via php GET! please check if your query is correct -> otherwise please contact openrouteservice at geog.uni-heidelberg.de";
	}
	
		 
?>
