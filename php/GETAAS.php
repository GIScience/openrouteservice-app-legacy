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
 * <p><b>Title: AAS </b></p>
 * <p><b>Description:</b> Functions for AAS </p>
 *
 * <p><b>Copyright:</b> Copyright (c) 2015</p>
 * <p><b>Institution:</b> University of Heidelberg, Department of Geography</p>
 * @author Amandus Butzer, Timothy Ellersiek, openrouteservice at geog.uni-heidelberg.de
 * @version 2.0 2016-11-03
 */
 	require '../FirePHPCore/fb.php';
	ob_start();

	include ('CreateAASRequest.php');
	include ('ConnectToWebService.php');

	///////////////////////////////////////////////////
	//*** Request erstellen POST ***

	//create default object for parameter storage
	$object = new stdClass;

	$object->position = (isset($_GET["position"])) ? str_replace(",", " ", $_GET["position"]) : Null;
	$api_key = (isset($_GET["api_key"])) ? $_GET["api_key"] : Null;
	
	if (is_null($object->position) or is_null($api_key)) {
    echo "No point to analyse or missing API key! Please define at least the position parameter and append your API key. If you don't know how to use parameters visit our <a href=http://openrouteservice.readthedocs.io>Documentation</a>.";
	}

	else{

		if(isset($object->position) and isset($api_key)){
			$object->minutes = (isset($_GET["minutes"])) ? $_GET["minutes"] : "10";
			$object->method = (isset($_GET["method"]) and $_GET["method"] = ("RecursiveGrid" or "TIN")) ? $_GET["method"] : "RecursiveGrid";
			$object->interval = (isset($_GET["interval"])) ? $_GET["interval"] : "300";
			$object->routepreference = (isset($_GET["routepreference"])) ? $_GET["routePreference"] : "Car";
		}

		$request = createAnalysisRequest($object);
		
		///////////////////////////////////////////////////
		//*** Sende Request an Web Service ***
		//Server
		$http_response = post('openls.geog.uni-heidelberg.de', '/osm/analysis'.'?api_key='.$api_key, $request, 20, 80);

		///////////////////////////////////////////////////
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
?>

