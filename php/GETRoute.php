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
	//?start=8.001551792162187,52.267593720674526&end=8.068890507570062,52.29003995914382
	// start=7.040837,50.723612&end=7.040036,50.72591&via=7.026576,50.720379
	// &routepref=Shortest&weighting=Car&lang=de&noMotorways=true&noTollways=true&distunit=M&instructions=true
	if(isset($_GET["start"]) && isset($_GET["end"]) && isset($_GET["via"])&& isset($_GET["lang"]) && isset($_GET["distunit"]) 
		&& isset($_GET["routepref"]) && isset($_GET["weighting"])&& isset($_GET["noMotorways"]) && isset($_GET["noTollways"]) && isset($_GET["noFerries"])&& isset($_GET["noSteps"])&& isset($_GET["noUnpavedroads"]) && isset($_GET["instructions"])){
	
		$startcoordinate = $_GET["start"];
		$endcoordinate = $_GET["end"];
		$viaPoints_xml = $_GET["via"];
		$language = $_GET["lang"];
		$distanceunit = $_GET["distunit"];
		$routepref = $_GET["routepref"];
		$weighting = $_GET["weighting"];
		$avoidAreas = '';
		$noMotorways = $_GET["noMotorways"];
		$noTollways = $_GET["noTollways"];
		$noFerries = $_GET["noFerries"];
		$noUnpavedroads = $_GET["noUnpavedroads"];
		$noSteps = $_GET["noSteps"];
		$instructions = $_GET["instructions"];
		
		if (isset($_GET["value_width"])&& isset($_GET["value_height"])&& isset($_GET["value_weight"])&& isset($_GET["value_length"])&& isset($_GET["value_axleload"])){
		
		$hgv = '';
		$hazardous = $_GET["hazardous"];
		$value_width =  $_GET["value_width"];
		$value_weight =  $_GET["value_weight"];
		$value_height =  $_GET["value_height"];
		$value_length =  $_GET["value_length"];
		$value_axleload =  $_GET["value_axleload"];
		
			if($routepref == 'HeavyVehicle'){
			$haz='';
			$hgv='<xls:VehicleType>hgv</xls:VehicleType>';	
			$hgv=$hgv.'<xls:Width>'.$value_width.'</xls:Width>';
			$hgv=$hgv.'<xls:Height>'.$value_height.'</xls:Height>';
			$hgv=$hgv.'<xls:Weight>'.$value_weight.'</xls:Weight>';	
			$hgv=$hgv.'<xls:Length>'.$value_length.'</xls:Length>';	
			$hgv=$hgv.'<xls:AxleLoad>'.$value_axleload.'</xls:AxleLoad>';	
				if($hazardous == true){		
				$haz='<xls:LoadCharacteristics>
						<xls:LoadCharacteristic>hazmat</xls:LoadCharacteristic>
					 </xls:LoadCharacteristics>';	
				}
			}
		}
		
		if (isset($_GET["surface"])&& isset($_GET["elevation"])){
		$surface = $_GET["surface"];
		$elevation = $_GET["elevation"];
		$sur = '';
		$ele = '';
			if(($routepref == 'Bicycle')||($routepref == 'BicycleSafety')||($routepref == 'BicycleTour')||($routepref == 'BicycleMTB')||($routepref == 'BicycleRacer')){
				if ($surface == 'true'){
				$sur=$sur.'<xls:SurfaceInformation>true</xls:SurfaceInformation>';
				}else{
				$sur=$sur.'<xls:ElevationInformation>false</xls:ElevationInformation>';
				}
				if ($elevation == 'true'){
				$ele=$ele.'<xls:ElevationInformation>true</xls:ElevationInformation>';
				}else{
				$ele=$ele.'<xls:ElevationInformation>false</xls:ElevationInformation>';
				}
			}
		}
		
		if(isset($_GET["maxspeed"])){
		$speed = $_GET["maxspeed"];
			if ($speed > 0){
			$maxspeed=$maxspeed.'<xls:MaxSpeed>';
			$maxspeed=$maxspeed.+$speed;
			$maxspeed=$maxspeed.'</xls:MaxSpeed>';
			}
		}
		
		$avoidFeatures = '';
		if($noMotorways == 'true'){
			$avoidFeatures = '<xls:AvoidFeature>Highway</xls:AvoidFeature>';
		}
		if($noTollways == 'true'){
			$avoidFeatures = $avoidFeatures.'<xls:AvoidFeature>Tollway</xls:AvoidFeature>';
		}
		if($noFerries == 'true'){
			$avoidFeatures = $avoidFeatures.'<xls:AvoidFeature>Ferry</xls:AvoidFeature>';
		}
		if($noUnpavedroads == 'true'){
			$avoidFeatures = $avoidFeatures.'<xls:AvoidFeature>Unpavedroads</xls:AvoidFeature>';
		}
		if($noSteps == 'true'){
			$avoidFeatures = $avoidFeatures.'<xls:AvoidFeature>Steps</xls:AvoidFeature>';
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
		$request = createRequest($startcoordinate, $endcoordinate, $viaPoints_xml, $language, $distanceunit, $routepref, $weighting,
				$avoidAreas, $avoidFeatures, $hgv, $haz, $sur, $ele, $maxspeed, $instructions);

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
