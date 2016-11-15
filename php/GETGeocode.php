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
 * @author Amandus Butzer, Timothy Ellersiek, openrouteservice at geog.uni-heidelberg.de
 * @version 2.0 2016-11-03
 */
 
	include ('CreateLUSRequest.php');
	include ('ConnectToWebService.php');
	
	/**create default object for parameter storage*/
	$object = new stdClass;

	/** Check for parameters and fetch them, null if not set */
	$object->FreeFormAdress = (isset($_GET["FreeFormAdress"])) ? $_GET["FreeFormAdress"] : Null;
	$object->MaxResponse    = (isset($_GET["MaxResponse"]))    ? $_GET["MaxResponse"]    : Null ;
	$object->lang           = (isset($_GET["lang"]))           ? $_GET["lang"]           : Null;
	$api_key                = $_GET["api_key"];

	/** Get position as pos or as lat & lon */
	$object->pos            = (isset($_GET["pos"])) ? str_replace(",", " ",$_GET["pos"]) : ((isset($_GET["lon"]) and isset($_GET["lat"])) ? ($_GET["lon"]." ".$_GET["lat"]) :Null);

	/** Remove object entry if null */
	if ($object->FreeFormAdress == Null) {unset($object->FreeFormAdress);}
	if ($object->MaxResponse    == Null) {unset($object->MaxResponse);}
	if ($object->lang           == Null) {unset($object->lang);}	
	if ($object->pos            == Null) {unset($object->pos);}	

	/** If one of the three main parameters is missing -> Help Message. */
	if ((is_null($object->FreeFormAdress) and is_null($api_key)) or (is_null($object->pos) and is_null($api_key)) or (is_null($object->pos) and is_null($object->FreeFormAdress))){
		echo "No API key or missing 'pos' or 'FreeFormAdress' parameter! For a geocode request please define at least the 'FreeFormAdress' parameter! For a reverse geocode request please define at least the 'pos' parameter! And append your API key. If you don't know how to use parameters visit our <a href=http://openrouteservice.readthedocs.io>Documentation</a>.";
	}

	else{

		/** Do a Geocoding Request with FreeFormAddress parameter */
		if(isset($object->FreeFormAdress) && isset($api_key)){

			$request = createGeocodeRequest($object);
		}

		/** Do a Reverse Geocoding Request with Position parameter */
		else if (isset($object->pos) && isset($api_key)){

			$request = createRevGeocodeRequest($object);
		}

		//*** Send Request to the Web Service ***
		//Server
		$http_response = post('openls.geog.uni-heidelberg.de', '/osm/geocoding'.'?api_key='.$api_key, $request, 20, 80);

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

