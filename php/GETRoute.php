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
 
	include ('CreateRSRequest.php');
	include ('ConnectToWebService.php');

	///////////////////////////////////////////////////
	//*** Request erstellen POST ***
	//?Start=8.001551792162187,52.267593720674526&End=8.068890507570062,52.29003995914382
	// Start=7.040837,50.723612&End=7.040036,50.72591&Via=7.026576,50.720379
	// &routepref=Shortest&routeprofile=Car&lang=de&noMotorways=true&noTollways=true&distunit=M&instructions=true
	if(isset($_GET["Start"]) && isset($_GET["End"]) && isset($_GET["Via"])&& isset($_GET["lang"]) && isset($_GET["distunit"]) 
			&& isset($_GET["routepref"]) && isset($_GET["routeprofile"]) && isset($_GET["noMotorways"]) && isset($_GET["noTollways"]) && isset($_GET["instructions"])){
		$startcoordinate = $_GET["Start"];
		$endcoordinate = $_GET["End"];
		$viaPoints_xml = $_GET["Via"];
		$language = $_GET["lang"];
		$distanceunit = $_GET["distunit"];
		$routepref = $_GET["routepref"];
		$routeprofile = $_GET["routeprofile"];
		$avoidAreas = '';
		$noMotorways = $_GET["noMotorways"];
		$noTollways = $_GET["noTollways"];
		$instructions = $_GET["instructions"];

		$avoidFeatures = '';
		if($noMotorways == 'true'){
			$avoidFeatures = '<xls:AvoidFeature>Highway</xls:AvoidFeature>';
		}
		if($noTollways == 'true'){
			$avoidFeatures = $avoidFeatures.'<xls:AvoidFeature>Tollway</xls:AvoidFeature>';
		}
		
		if($instructions == 'true'){
			$instructions = '<xls:RouteInstructionsRequest format="text/plain" provideGeometry="true"/>';
		}
		else{
			$instructions = '';
		}
		
		$startcoordinate = str_replace(",", " ", $startcoordinate);
		$endcoordinate = str_replace(",", " ", $endcoordinate);
		
		if(strlen($viaPoints_xml) > 0){
			$points = explode(" ", $viaPoints_xml);
			$viaPoints_xml = "";
			for($i = 0; $i < count($points) ; $i++){
				$p = explode(",", $points[$i]);
				$viaPoints_xml = $viaPoints_xml."<xls:ViaPoint><xls:Position><gml:Point><gml:pos>".$p[0]." ".$p[1]."</gml:pos></gml:Point></xls:Position></xls:ViaPoint>";
			}
		}
		else
			$viaPoints_xml = "";
	

		///////////////////////////////////////////////////
		//*** Sende Request an Web Service ***
		$request = createRequest($startcoordinate, $endcoordinate, $viaPoints_xml, $language, $distanceunit, $routepref, $routeprofile,
				$avoidAreas, $avoidFeatures, $instructions);

		//Server
		$http_response = post('openls.geog.uni-heidelberg.de', '/osm/routing', $request, 20, 80);
		
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
