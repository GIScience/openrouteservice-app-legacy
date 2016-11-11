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
$object->via           = (isset($_GET["via"]))          ? explode(" ", $_GET["via"])     : null;
$object->instructions  = (isset($_GET["instructions"])) ? $_GET["instructions"]          : null;

/** Language is only needed if instructions are used. Default is English */
if ($object->instructions == "true") {
    $object->language  = (isset($_GET["lang"]))         ? $_GET["lang"]                  : "en";}
$object->AvoidAreas    = (isset($_GET["avAreas"]))      ? explode(";", $_GET["avAreas"]) : null;
$object->AvoidFeatures = (isset($_GET["noTollways"]) or isset($_GET["noMotorways"]) or isset($_GET["noTunnels"]) or isset($_GET["noUnpavedroads"]) or isset($_GET["noPavedroads"]) or isset($_GET["noFerries"]) or isset($_GET["noFords"]) or isset($_GET["noTracks"]) or isset($_GET["noSteps"]) or isset($_GET["noHills"])) ? []                         : null;

/**
 * In case of an empty or not needed parameter -> remove the parameter
 * The AvoidFeatures parameter is removed after the profiles 
 */
if ($object->via          == null)             {unset($object->via);}
if ($object->instructions == (null or "false") {unset($object->instructions);}
if ($object->AvoidAreas   == null)             {unset($object->AvoidAreas);}

/** If there is no api key or start or end parameter -> Help Message */
if (is_null($object->start) or is_null($object->end) or is_null($object->api_key)) {
    echo "No start or end point or missing API key! Please define at least the start and end parameter and append your API key. If you don't know how to use parameters visit our <a href=http://openrouteservice.readthedocs.io>Documentation</a>.";
}

/** If the three main parameter are set we can continue */
elseif (isset($_GET["start"]) && isset($_GET["end"]) && isset($_GET["api_key"])) {

    /** Car profile */
    if ($object->routepref == "Car") {

        if (isset($_GET["maxspeed"])) {
            $object->maxspeed = "+" . abs($_GET["maxspeed"]);
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

    }

    /** Bicycle profile */
    elseif ($object->routepref == "Bicycle" or $object->routepref == "BicycleMTB" or $object->routepref == "BicycleRacer" or $object->routepref == "BicycleTouring" or $object->routepref == "BicycleSafety") {

        if (isset($_GET["maxspeed"])) {
            $object->maxspeed = "+" . abs($_GET["maxspeed"]);
        }

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

        if (isset($_GET["maxspeed"])) {
            $object->maxspeed = "+" . abs($_GET["maxspeed"]);
        }

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

        if (isset($_GET["maxspeed"])) {
            $object->maxspeed = "+" . abs($_GET["maxspeed"]);
        }

        //Surface
        //Incline
        //max height of sloped curb
    }

    /** HeavyVehicle profile */
    elseif ($object->routepref == "HeavyVehicle") {

        /** Check for a Heavy vehicle Subtype, default is "hgv" */
        $object->subtype = (isset($_GET["subType"])) ? $_GET["subType"] : "hgv";

        if (isset($_GET["maxspeed"])) {
            $object->maxspeed = "+" . abs($_GET["maxspeed"]);
        }

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

    /** Create the request file */
    $request = createRequest($object);
    
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
