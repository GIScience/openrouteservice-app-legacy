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
function createRequest($object)
{
    $request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
                    <xls:XLS xmlns:xls=\"http://www.opengis.net/xls\" xmlns:sch=\"http://www.ascc.net/xml/schematron\" xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/xls
                    D:\Schemata\OpenLS1.1\RouteService.xsd\" version=\"1.1\"";

    /** Check for Language */
    if (isset($object->language)) {
        $request .= " xls:lang=\"$object->language\"";
    }

    $request .= ">
                <xls:RequestHeader/>
                <xls:Request methodName=\"RouteRequest\" requestID=\"123456789\" version=\"1.1\">
                <xls:DetermineRouteRequest distanceUnit=\"$object->distunit\">
                    <xls:RoutePlan>
                    <xls:RoutePreference>$object->routepref</xls:RoutePreference>
                        <xls:ExtendedRoutePreference>
                            <xls:WeightingMethod>$object->weighting</xls:WeightingMethod>";

    /** Check for a variety of Parameters and add the respective code line */
    if (isset($object->surface)) {
        $request .= "<xls:SurfaceInformation>true</xls:SurfaceInformation>";
    }
    if (isset($object->elevation)) {
        $request .= "<xls:ElevationInformation>true</xls:ElevationInformation>";
    }
    if (isset($object->steep)) {
        $request .= "<xls:MaxSteepness>$object->steep</xls:MaxSteepness>";
    }
    if (isset($object->level)) {
        $request .= "<xls:DifficultyLevel>$object->level</xls:DifficultyLevel>";
    }

    /** Check for wheelchair Parameters and add code lines */
    if (isset($object->tt)) {
        $request .= "<xls:TrackTypes>
                            <xls:TrackType>$object->tt</xls:TrackType>
                      </xls:TrackTypes>";
    }
    if (isset($object->st)) {
        $request .= "<xls:SurfaceTypes>
                            <xls:SurfaceType>$object->st</xls:SurfaceType>
                      </xls:SurfaceTypes>";
    }
    if (isset($object->smt)) {
        $request .= "<xls:SmoothnessTypes>
                            <xls:SmoothnessType>$object->smt</xls:SmoothnessType>
                      </xls:SmoothnessTypes>";
    }
    if (isset($object->incline)) {
        $request .= "<xls:Incline>$object->incline</xls:Incline>";
    }
    if (isset($object->curb)) {
        $request .= "<xls:SlopedCurb>0.$object->curb</xls:SlopedCurb>";
    }

    /** Add Length, Width, Height, Weight and Axleload if defined */
    if (isset($object->hgv)) {
        $request .= "<xls:VehicleType>$object->subtype</xls:VehicleType>";

        foreach ($object->hgv as $key => $value) {
            $request .= "<xls:$key>$value</xls:$key>";
        }
        unset($value);
    }

    /** Check for hazardous parameter */
    if (isset($object->haz)) {
        $request .= "<xls:LoadCharacteristics>
                            <xls:LoadCharacteristic>hazmat</xls:LoadCharacteristic>
                        </xls:LoadCharacteristics>";
    }
    if (isset($object->maxspeed)) {
        $request .= "<xls:MaxSpeed>$object->maxspeed</xls:MaxSpeed>";
    }
    $request .= "</xls:ExtendedRoutePreference>
                        <xls:WayPointList>
                        <xls:StartPoint>
                            <xls:Position>
                                <gml:Point srsName=\"EPSG:4326\">
                                    <gml:pos>$object->start</gml:pos>
                                </gml:Point>
                            </xls:Position>
                        </xls:StartPoint>";

    /** Get a Via point for every Point in the Via array */
    if (isset($object->via)) {
        foreach ($object->via as $key => $vpoint) {
            $request .= "<xls:ViaPoint>
                            <xls:Position>
                                <gml:Point srsName=\"EPSG:4326\">
                                    <gml:pos>" . str_replace(",", " ", $vpoint) . "</gml:pos>
                                </gml:Point>
                            </xls:Position>
                        </xls:ViaPoint>";
        }
        unset($vpoint);
    }

    /** Direct way points code="1" to be implemented */

    //End Point
    $request .= "<xls:EndPoint>
                        <xls:Position>
                            <gml:Point srsName=\"EPSG:4326\">
                                <gml:pos>$object->end</gml:pos>
                            </gml:Point>
                        </xls:Position>
                    </xls:EndPoint>
                </xls:WayPointList>
                <xls:AvoidList>";

    /** For every Avoid Area ... */
    if (isset($object->AvoidAreas)) {
        foreach ($object->AvoidAreas as $key => $v) {
            $request .= " <xls:AOI>
                            <gml:Polygon>
                                <gml:exterior>
                                    <gml:LinearRing>";

            /**
             * ...store the lon,lat values in an seperate array
             * It will look like this [
             * lon0
             * lat0
             * lon1
             * lat1
             * ...]
             */
            $cords = explode(",", $v);

            /** Now read the array in pairs. [0] and [1] the first time, [2] and [3] the second etc. */
            for ($i = 0; $i < (count($cords) / 2); $i++) {
                $request .= " <gml:pos>" . $cords[($i * 2)] . " " . $cords[($i * 2) + 1] . "</gml:pos> ";
            }
            $request .= "</gml:LinearRing>
                    </gml:exterior>
                </gml:Polygon>
            </xls:AOI>";
        }
        unset($v);
    }

    /** Add all the Avoid features in the avoid feature array */
    if (isset($object->AvoidFeatures)) {
        foreach ($object->AvoidFeatures as $key => $v) {
            $request .= "<xls:AvoidFeature>$v</xls:AvoidFeature>";
        }
    }

    $request .= "</xls:AvoidList>
                    </xls:RoutePlan>";

    /** And add instructions code line if wanted */
    if (isset($object->instructions)) {
        $request .= "<xls:RouteInstructionsRequest format=\"text/plain\" provideGeometry=\"true\"/>";
    }

    $request .= "<xls:RouteGeometryRequest/>
                </xls:DetermineRouteRequest>
                </xls:Request>
                </xls:XLS>";
    return $request;
}
