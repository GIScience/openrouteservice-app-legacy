<?php
/*+-------------+----------------------------------------------------------*
 *|        /\   |     University of Heidelberg                             *
 *|       |  |  |     Department of Geography                              *
 *|      _|  |_ |     GIScience Research Group                             *
 *|    _/      \|                                                          *
 *|___|         |                                                          *
 *|             |     Berliner Straße 48                                   *
 *|             |     D-69221 Heidelberg, Germany                          *
 *+-------------+----------------------------------------------------------*/
/**
 * <p><b>Title: RS </b></p>
 * <p><b>Description:</b> Functions for RS </p>
 *
 * <p><b>Copyright:</b> Copyright (c) 2015</p>
 * <p><b>Institution:</b> University of Heidelberg, Department of Geography</p>
 * @author Amandus Butzer, Timothy Ellersiek, openrouteservice at geog.uni-heidelberg.de
 * @version 2.0 2016-11-03
 */
require_once('../FirePHPCore/fb.php');
ob_start();

include 'CreateRSRequest.php';
include 'ConnectToWebService.php';

///////////////////////////////////////////////////
//*** Request erstellen POST ***
//?start=8.001551792162187,52.267593720674526&end=8.068890507570062,52.29003995914382
// start=7.040837,50.723612&end=7.040036,50.72591&via=7.026576,50.720379
// &routepref=Shortest&weighting=Car&lang=de&noMotorways=true&noTollways=true&distunit=M&instructions=true

/** Create default object for parameter storage. */
$object = new stdClass;

/**
 * Check if the start, end and api_key parameter are set and fetch them plus replace Coordinate seperator.
 * Else parameter is Null.
 */
$object->start   = isset($_GET["start"])   ? str_replace(",", " ", $_GET["start"]) : Null; 
$object->end     = isset($_GET["end"])     ? str_replace(",", " ", $_GET["end"])   : Null;
$api_key         = isset($_GET["api_key"]) ? $_GET["api_key"]                      : Null;

/**
 * Check for distanceunit, routepreference and weighting and get them.
 * If not set, define a default value.
 */
$object->distunit      = (isset($_GET["distunit"]))  ? $_GET["distunit"]  : "KM";
$object->routepref     = (isset($_GET["routepref"])) ? $_GET["routepref"] : "Car";
$object->weighting     = (isset($_GET["weighting"])) ? $_GET["weighting"] : "Fastest";

/**
 * Check for additional parameters.
 * Via and AvoidAreas will be written in an array : One entry for each Point/Area
 * If there is any avoid parameter set, an array will be created for values to be pushed into.
 */
if (isset($_GET["maxspeed"]))           {$object->maxspeed     = "+" . abs($_GET["maxspeed"]);}
if (isset($_GET["via"]))                {$object->via          = explode(" ", $_GET["via"]);}
if ((isset($_GET["instructions"])) and 
    ($_GET["instructions"] == "true" )) {$object->instructions = $_GET["instructions"];}
/** Language is only needed if instructions are used. Default is English */
if ($object->instructions == "true") {
    $object->language  = (isset($_GET["lang"]))         ? $_GET["lang"]   : "en";}
if (isset($_GET["avAreas"]))            {$object->AvoidAreas   = explode(";", $_GET["avAreas"]);}
$object->AvoidFeatures = (isset($_GET["noTollways"]) or isset($_GET["noMotorways"]) or isset($_GET["noTunnels"]) or isset($_GET["noUnpavedroads"]) or isset($_GET["noPavedroads"]) or isset($_GET["noFerries"]) or isset($_GET["noFords"]) or isset($_GET["noTracks"]) or isset($_GET["noSteps"]) or isset($_GET["noHills"])) ? [] : null;

/** If there is no api key or start or end parameter -> Help Message */
if (is_null($object->start) or is_null($object->end) or is_null($api_key)) {
    echo "No start or end point or missing API key! Please define at least the start and end parameter and append your API key. If you don't know how to use parameters visit our <a href=http://openrouteservice.readthedocs.io>Documentation</a>.";
}

/** If the three main parameter are set we can continue */
elseif (isset($_GET["start"]) && isset($_GET["end"]) && isset($_GET["api_key"])) {

    /** Car profile */
    if ($object->routepref == "Car") {

        /** Get Avoid Features for Profile, only take features that suit the profile */
        if (isset($_GET["noMotorways"])    and $_GET["noMotorways"]    == "true") {
            array_push($object->AvoidFeatures, "Highway");
        }

        if (isset($_GET["noTollways"])     and $_GET["noTollways"]     == "true") {
            array_push($object->AvoidFeatures, "Tollway");
        }

        if (isset($_GET["noTunnels"])      and $_GET["noTunnels"]      == "true") {
            array_push($object->AvoidFeatures, "Tunnels");
        }

        if (isset($_GET["noUnpavedroads"]) and $_GET["noUnpavedroads"] == "true") {
            array_push($object->AvoidFeatures, "Unpavedroads");
        }

        if (isset($_GET["noFerries"])      and $_GET["noFerries"]      == "true") {
            array_push($object->AvoidFeatures, "Ferry");
        }

        if (isset($_GET["noFords"])        and $_GET["noFords"]        == "true") {
            array_push($object->AvoidFeatures, "Ford");
        }

        if (isset($_GET["noTracks"])       and $_GET["noTracks"]       == "true") {
            array_push($object->AvoidFeatures, "Tracks");
        }

    }

    /** Bicycle profile */
    elseif ($object->routepref == "Bicycle" or $object->routepref == "BicycleMTB" or $object->routepref == "BicycleRacer" or $object->routepref == "BicycleTouring" or $object->routepref == "BicycleSafety") {

        /** Get the Difficulty level if it is set and between -1 and 3 */
        if (isset($_GET["level"]) and ($_GET["level"] >= -1 and $_GET["level"] <= 3)) {
            $object->level = $_GET["level"];
        }

        /** Get the steepness in percent if it is set and between 1 and 15 */
        if (isset($_GET["steep"]) and ($_GET["steep"] >= 1 and $_GET["steep"] <= 15)) {
            $object->steep = $_GET["steep"];
        }

        /** Check for surface and elevation parameters */
        if (isset($_GET["surface"]) and $_GET["surface"] == "true") {
            $object->surface = $_GET["surface"];
        }

        if (isset($_GET["elevation"]) and $_GET["elevation"] == "true") {
            $object->elevation = $_GET["elevation"];
        }

        /** Get Avoid Features for Profile, only take features that suit the profile */
        if (isset($_GET["noSteps"])        and $_GET["noSteps"]        == "true") {
            array_push($object->AvoidFeatures, "Steps");
        }

        if (isset($_GET["noPavedroads"])   and $_GET["noPavedroads"]   == "true") {
            array_push($object->AvoidFeatures, "Paved");
        }

        if (isset($_GET["noUnpavedroads"]) and $_GET["noUnpavedroads"] == "true") {
            array_push($object->AvoidFeatures, "Unpavedroads");
        }

        if (isset($_GET["noFerries"])      and $_GET["noFerries"]      == "true") {
            array_push($object->AvoidFeatures, "Ferry");
        }

        if (isset($_GET["noFords"])        and $_GET["noFords"]        == "true") {
            array_push($object->AvoidFeatures, "Ford");
        }

        if (isset($_GET["noHills"])        and $_GET["noHills"]        == "true") {
            array_push($object->AvoidFeatures, "Hills");
        }

    }

    /** Pedestrian profile */
    elseif ($object->routepref == "Pedestrian") {

        /** Get Avoid Features for Profile, only take features that suit the profile */
        if (isset($_GET["noSteps"])   and $_GET["noSteps"]   == "true") {
            array_push($object->AvoidFeatures, "Steps");
        }

        if (isset($_GET["noFerries"]) and $_GET["noFerries"] == "true") {
            array_push($object->AvoidFeatures, "Ferry");
        }

        if (isset($_GET["noFords"])   and $_GET["noFords"]   == "true") {
            array_push($object->AvoidFeatures, "Ford");
        }
    }

    /** Wheelchair profile */
    elseif ($object->routepref == "Wheelchair") {

        /** Get surtype, incline and curb */
        /** 
         * Surface type
         * splitted into 3 values that differ with each type
         */
        if (isset($_GET["surtype"]) and ($_GET["surtype"] >= 1) and ($_GET["surtype"] <= 5)){

            $object->surtype = $_GET["surtype"];

            /**
             * "tt"  = "tracktype"      
             * "st"  = "surfacetype"    actual surface type
             * "smt" = "smoothnesstype" 
             */
            if ($object->surtype == 1){
                $object->tt  = "grade1";
                $object->st  = "concrete";
                $object->smt = "good";

            }
            if ($object->surtype == 2){
                $object->tt  = "grade1";
                $object->st  = "cobblestone:flattened";
                $object->smt = "good";
            }
            if ($object->surtype == 3){
                $object->tt  = "grade1";
                $object->st  = "cobblestone";
                $object->smt = "intermediate";
            }
            if ($object->surtype == 4){
                $object->tt  = "grade2";
                $object->st  = "compacted";
                $object->smt = "bad";
            }
            if ($object->surtype == 5){
                $object->tt  = "grade4";
                $object->st  = "any";
                $object->smt = "bad";
            }

            /** Delete entry, not needed for request */
            unset($object->surtype);
        }

        /** Default Values */
        else{
            $object->tt  = "grade1";
            $object->st  = "cobblestone:flattened";
            $object->smt = "good";
        }

        /** Maximum Incline */
        if (isset($_GET["incline"]) and in_array($_GET["incline"], ["3","6","10","15","31","any"]) == "true"){
            $object->incline = $_GET["incline"];
            if($object->incline == "any"){$object->incline = "31";}
        }
        
        /** Default Value */
        else{
            $object->incline = "6";
        }

        /** Max height of sloped curb */
        if (isset($_GET["curb"]) and in_array($_GET["curb"], ["3","6","10","31","any"]) == "true"){
            $object->curb = $_GET["curb"];
            if($object->curb == "any"){$object->curb = "31";}


            /** If 3 or 6 add a Zero because value is needed in meter for schema (0.03) */
            if (strlen($object->curb) == "1"){
                $object->curb = "0" . $object->curb; 
            }
        }

        /** Default Value */
        else{
            $object->curb = "06";
        }
    }

    /** HeavyVehicle profile */
    elseif ($object->routepref == "HeavyVehicle") {

        /** Check for a Heavy vehicle Subtype, default is "hgv" */
        $object->subtype = (isset($_GET["subType"])) ? $_GET["subType"] : "hgv";

        /** Check for the hazardous parameter */
        $object->haz = (isset($_GET["haz"]) and $_GET["haz"] == ("true")) ? "true" : null;
        if ($object->haz == null) {
            unset($object->haz);
        }

        /** Get Avoid Features for Profile, only take features that suit the profile */
        if (isset($_GET["noMotorways"])    and $_GET["noMotorways"]    == "true") {
            array_push($object->AvoidFeatures, "Highway");
        }

        if (isset($_GET["noTollways"])     and $_GET["noTollways"]     == "true") {
            array_push($object->AvoidFeatures, "Tollway");
        }

        if (isset($_GET["noTunnels"])      and $_GET["noTunnels"]      == "true") {
            array_push($object->AvoidFeatures, "Tunnels");
        }

        if (isset($_GET["noUnpavedroads"]) and $_GET["noUnpavedroads"] == "true") {
            array_push($object->AvoidFeatures, "Unpavedroads");
        }

        if (isset($_GET["noFerries"])      and $_GET["noFerries"]      == "true") {
            array_push($object->AvoidFeatures, "Ferry");
        }

        if (isset($_GET["noFords"])        and $_GET["noFords"]        == "true") {
            array_push($object->AvoidFeatures, "Ford");
        }

        if (isset($_GET["noTracks"])       and $_GET["noTracks"]       == "true") {
            array_push($object->AvoidFeatures, "Tracks");
        }

        /**
         * Check for additional hgv parameters.
         * Only if all 5 are set they will be accepted.
         */
        if (isset($_GET["value_length"]) && isset($_GET["value_width"]) && isset($_GET["value_height"]) && isset($_GET["value_weight"]) && isset($_GET["value_axleload"])) {
            $object->hgv = array(
                "Length"   => $_GET["value_length"],
                "Width"    => $_GET["value_width"],
                "Height"   => $_GET["value_height"],
                "Weight"   => $_GET["value_weight"],
                "AxleLoad" => $_GET["value_axleload"],
            );
        }
    }

    /** If no AvoidFeatures are added, remove object entry */
    if ($object->AvoidFeatures == null) {
        unset($object->AvoidFeatures);
    }
    fb($object);
    /** Create the request file */
    $request = createRequest($object);
    fb($request);
    ///////////////////////////////////////////////////
    //*** Send Request to Web Service ***
    //Server
    $http_response = post('openls.geog.uni-heidelberg.de', '/osm/routing' . '?api_key=' . ($api_key), $request, 20, 80);

    ///////////////////////////////////////////////////
    //*** analyse Request ***
    //delete Header
    $sExplodeParam = '<?xml';
    if (strchr($http_response, $sExplodeParam)) {
        $aResponse = explode($sExplodeParam, $http_response);

        //Response XML
        $doc = new DOMDocument();
        $doc->loadXML($sExplodeParam . $aResponse[1]);

        header('Content-Type: text/xml');

        echo $sExplodeParam . $aResponse[1];

    }

} else {
    echo "Nothing via php GET! please check if your query is correct -> otherwise please contact openrouteservice at geog.uni-heidelberg.de";
}
