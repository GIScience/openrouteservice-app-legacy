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
 * @author Pascal Neis, Enrico Steiger , openrouteservice@geog.uni-heidelberg.de
 * @version 1.0 2015-02-01
 */
 
	include ('CreateAASRequest.php');
	include ('ConnectToWebService.php');

	///////////////////////////////////////////////////
	//*** Request erstellen POST ***
	if(isset($_GET["position"])&& isset($_GET["minutes"]) && isset($_GET["routePreference"])&& isset($_GET["method"])&& isset($_GET["interval"])){
		$position = $_GET["position"];
		$minutes = $_GET["minutes"];
		$method = $_GET["method"];
		$interval = $_GET["interval"];
		$routepreference = $_GET["routePreference"];
		
		$position = str_replace(",", " ", $position);

		$request = createAnalysisRequest($position, $minutes, $routepreference, $method, $interval);


		///////////////////////////////////////////////////
		//*** Sende Request an Web Service ***
		//Server
		$http_response = post('openls.geog.uni-heidelberg.de', '/osm/analysis', $request, 20, 80);

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
	else
		echo "Nothing via php GET! please check if your query is correct -> otherwise please contact openrouteservice at geog.uni-heidelberg.de";
?>

