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
 * @author Pascal Neis, Enrico Steiger, Amandus Butzer, openrouteservice at geog.uni-heidelberg.de
 * @version 1.0 2015-02-01
 */
 
	///////////////////////////////////////////////////
	//*** Request erstellen für OpenLS Location Utility Service ***
	require '../FirePHPCore/fb.php';
	ob_start();

	include ('CreateLUSRequest.php');
	include ('ConnectToWebService.php');
	
 
	$object = new stdClass;

	$object->FreeFormAdress = (isset($_GET["FreeFormAdress"])) ? $_GET["FreeFormAdress"] : Null;
	if ($object->FreeFormAdress == Null) {unset($object->FreeFormAdress);}
	$object->MaxResponse = (isset($_GET["MaxResponse"])) ? $_GET["MaxResponse"] : Null ;
	if ($object->MaxResponse == Null) {unset($object->MaxResponse);}
	$object->lang = (isset($_GET["lang"])) ? $_GET["lang"] : Null;
	if ($object->lang == Null) {unset($object->lang);}	
	$api_key = $_GET["api_key"];

	$object->pos = (isset($_GET["pos"])) ? $_GET["pos"] : ((isset($_GET["lon"]) and isset($_GET["lat"])) ? ($_GET["lon"]." ".$_GET["lat"]) :Null);
	if ($object->pos == Null){unset($object->pos);}	

	fb($object);

	if ((is_null($object->FreeFormAdress) and is_null($api_key)) or (is_null($object->pos) and is_null($api_key)) or (is_null($object->pos) and is_null($object->FreeFormAdress))){
		echo "No API key or missing 'pos' or 'FreeFormAdress' parameter! For a geocode request please define at least the 'FreeFormAdress' parameter! For a reverse geocode request please define at least the 'pos' parameter! And append your API key. If you don't know how to use parameters visit our <a href=http://openrouteservice.readthedocs.io>Documentation</a>.";
		//?FreeFormAdress=Bonn, Meckenheimer Allee&MaxResponse=20
	}
	else{
		fb("works");
		$pos = $object->pos;
		$MaxResponse = "2";
		if(isset($object->FreeFormAdress) && isset($api_key)){

			$request = createGeocodeRequest($object);

		}
		//?lon=8.00155179216218&lat=52.2675937206745
		else if (isset($object->pos) && isset($api_key)){

			$request = createRevGeocodeRequest($object);

		}

		//*** Sende Request an Web Service ***
		fb($request);		
		//Server
		$http_response = post('openls.geog.uni-heidelberg.de', '/osm/geocoding'.'?api_key='.$api_key, $request, 20, 80);

		//*** Request auswerten ***
		//Header entfernen
		$sExplodeParam = '<?xml';
		if (strchr($http_response, $sExplodeParam)){
		    fb($http_response);
		   $aResponse = explode($sExplodeParam,$http_response);

			//Response XML
			$doc = new DOMDocument();
			$doc->loadXML($sExplodeParam . $aResponse[1]);

			header('Content-Type: text/xml');
			echo $sExplodeParam . $aResponse[1];
		}
	    fb($aResponse);
	}
?>

