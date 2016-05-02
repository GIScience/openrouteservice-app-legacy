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
 * <p><b>Title: LUS </b></p>
 * <p><b>Description:</b> Functions for LUS </p>
 *
 * <p><b>Copyright:</b> Copyright (c) 2015</p>
 * <p><b>Institution:</b> University of Heidelberg, Department of Geography</p>
 * @author Pascal Neis, Enrico Steiger , openrouteservice at geog.uni-heidelberg.de
 * @version 1.0 2015-02-01
 */
 
	///////////////////////////////////////////////////
	//*** Request erstellen für OpenLS Location Utility Service ***
	
	include ('CreateLUSRequest.php');
	include ('ConnectToWebService.php');
	

		//?FreeFormAdress=Bonn, Meckenheimer Allee&MaxResponse=20
	if(isset($_GET["FreeFormAdress"]) && isset($_GET["MaxResponse"])){
		$freeform = $_GET["FreeFormAdress"];
		$maxresponse = $_GET["MaxResponse"];
		$lang = $_GET["lang"];
		
		if (isset($_GET["lang"])==''){
		$lang='de';
		}

		$request = createGeocodeRequest($freeform, $maxresponse, $lang);

		//*** Sende Request an Web Service ***
		
		//Server
		$http_response = post('openls.geog.uni-heidelberg.de', '/osm/geocoding', $request, 20, 80);

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

	//?lon=8.00155179216218&lat=52.2675937206745&MaxResponse=20
	else if(isset($_GET["lon"]) && isset($_GET["lat"]) && isset($_GET["MaxResponse"])){
		$lon = $_GET["lon"];
		$lat = $_GET["lat"];
		$maxresponse = $_GET["MaxResponse"];

		$request = createReverseGeocodeRequest($lon, $lat, $maxresponse);

		//*** Sende Request an Web Service ***
		
		//Server
		$http_response = post('openls.geog.uni-heidelberg.de', '/osm/geocoding', $request, 20, 80);

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
	else
		echo "Nothing via php GET! please check if your query is correct -> otherwise please contact openrouteservice at geog.uni-heidelberg.de";
?>

