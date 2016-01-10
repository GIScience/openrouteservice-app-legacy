var Route = (function(w) {
    "use strict";
    /**
     * Constructor
     */
    function Route() {
        this.routePresent = false;
        this.routeString = null;
    }
    /**
     * builds and sends the service request and calls the callback function
     * @param routePoints: array of OL.LonLat representing the waypoints of the route
     * @param successCallback: Callback which is called after the results are returned from the service
     * @param failureCallback: Callback which is called after an error occured
     * @param language: language for the routing instructions
     * @param routePref: route preference, e.g. Fastest
     * @param avoidMotorways: flag set to true if motorways should be avoided in the route; else: false
     * @param avoidTollways: flag set to true if tollways should be avoided in the route; else: false
     * @param avoidTunnels: flag set to true if tunnels should be avoided in the route; else: false
     * @param avoidunpavedRoads: flag set to true if unpaved roads should be avoided in the route; else: false
     * @param avoidpavedRoads: flag set to true if paved roads should be avoided in the route; else: false
     * @param avoidFerry: flag set to true if ferrys should be avoided in the route; else: false
     * @param avoidAreas: array of avoid areas represented by OL.Geometry.Polygons
     */
    function calculate(routePoints, successCallback, failureCallback, language, routePref, extendedRoutePreferencesType, wheelChairParams, truckParams, avoidableParams, avoidAreas, extendedRoutePreferencesWeight, extendedRoutePreferencesMaxspeed, calcRouteID) {
        var writer = new XMLWriter('UTF-8', '1.0');
        writer.writeStartDocument();
        //<xls:XLS>
        writer.writeElementString('xls:XLS');
        writer.writeAttributeString('xmlns:xls', namespaces.xls);
        writer.writeAttributeString('xsi:schemaLocation', namespaces.schemata.routeService);
        writer.writeAttributeString('xmlns:sch', namespaces.ascc);
        writer.writeAttributeString('xmlns:gml', namespaces.gml);
        writer.writeAttributeString('xmlns:xlink', namespaces.xlink);
        writer.writeAttributeString('xmlns:xsi', namespaces.xsi);
        writer.writeAttributeString('version', '1.1');
        writer.writeAttributeString('xls:lang', language);
        //<xls:RequestHeader />
        writer.writeElementString('xls:RequestHeader');
        //<xls:Request>
        writer.writeStartElement('xls:Request');
        writer.writeAttributeString('methodName', 'RouteRequest');
        writer.writeAttributeString('version', '1.1');
        writer.writeAttributeString('requestID', '00');
        writer.writeAttributeString('maximumResponses', '15');
        //<xls:DetermineRouteRequest>
        writer.writeStartElement('xls:DetermineRouteRequest');
        //<xls:RoutePlan>
        writer.writeStartElement('xls:RoutePlan');
        //<xls:RoutePreference />
        writer.writeElementString('xls:RoutePreference', routePref || 'Car');
        writer.writeStartElement('xls:ExtendedRoutePreference');
        writer.writeElementString('xls:WeightingMethod', extendedRoutePreferencesWeight || 'Fastest');
        if (jQuery.inArray(routePref, list.elevationProfiles) >= 0) {
            writer.writeElementString('xls:SurfaceInformation', 'true');
            writer.writeElementString('xls:ElevationInformation', 'true');
        }
        if (extendedRoutePreferencesMaxspeed !== null) {
            if (extendedRoutePreferencesMaxspeed > 0) {
                writer.writeElementString('xls:MaxSpeed', extendedRoutePreferencesMaxspeed);
            }
        }
        if (routePref == 'HeavyVehicle') {
            if (extendedRoutePreferencesType !== null) {
                writer.writeElementString('xls:VehicleType', extendedRoutePreferencesType);
            }
            //truck width
            if (truckParams[3] !== null) {
                writer.writeElementString('xls:Width', truckParams[3]);
            }
            //truck heigth
            if (truckParams[1] !== null) {
                writer.writeElementString('xls:Height', truckParams[1]);
            }
            //truck weigth
            if (truckParams[2] !== null) {
                writer.writeElementString('xls:Weight', truckParams[2]);
            }
            //truck length
            if (truckParams[0] !== null) {
                writer.writeElementString('xls:Length', truckParams[0]);
            }
            //truck axle load
            if (truckParams[4] !== null) {
                writer.writeElementString('xls:AxleLoad', truckParams[4]);
            }
            //truck hazardous
            if (truckParams[5] !== null) {
                writer.writeStartElement('xls:LoadCharacteristics');
                writer.writeElementString('xls:LoadCharacteristic', truckParams[5]);
                writer.writeEndElement();
            }
        }
        // Important: do change order or names of params without also changing them in respective RouteService.xsd!
        if (routePref === 'Wheelchair') {
            //tracktype
            if (wheelChairParams[3] != 'null') {
                writer.writeStartElement('xls:TrackTypes');
                writer.writeElementString('xls:TrackType', wheelChairParams[3]);
                writer.writeEndElement();
            }
            //surface
            if (wheelChairParams[0] != 'null') {
                writer.writeStartElement('xls:SurfaceTypes');
                writer.writeElementString('xls:SurfaceType', wheelChairParams[0]);
                writer.writeEndElement();
            }
            //smoothness
            if (wheelChairParams[4] != 'null') {
                writer.writeStartElement('xls:SmoothnessTypes');
                writer.writeElementString('xls:SmoothnessType', wheelChairParams[4]);
                writer.writeEndElement();
            }
            //incline
            if (wheelChairParams[1] != 'null') {
                writer.writeElementString('xls:Incline', wheelChairParams[1]);
            }
            //sloped curb
            if (wheelChairParams[2] != 'null') {
                writer.writeElementString('xls:SlopedCurb', wheelChairParams[2]);
            }
        }
        //</xls:ExtendedRoutePreference>            
        writer.writeEndElement();
        //<xls:WayPointList>
        writer.writeStartElement('xls:WayPointList');
        for (var i = 0; i < routePoints.length; i++) {
            if (i === 0) {
                writer.writeStartElement('xls:StartPoint');
            } else if (i == (routePoints.length - 1)) {
                writer.writeStartElement('xls:EndPoint');
            } else {
                writer.writeStartElement('xls:ViaPoint');
            }
            //<xls:Position>
            writer.writeStartElement('xls:Position');
            //<gml:Point>
            writer.writeStartElement('gml:Point');
            writer.writeAttributeString('xmlns:gml', namespaces.gml);
            //<gml:pos />
            writer.writeStartElement('gml:pos');
            writer.writeAttributeString('srsName', 'EPSG:4326');
            writer.writeString(routePoints[i].lon + ' ' + routePoints[i].lat);
            writer.writeEndElement();
            //</gml:Point>
            writer.writeEndElement();
            //</xls:Position>
            writer.writeEndElement();
            writer.writeEndElement();
        }
        //</xls:WayPointList>
        writer.writeEndElement();
        //<xls:AvoidList>
        writer.writeStartElement('xls:AvoidList');
        if (avoidAreas) {
            //avoidAreas contains an array of Leaflet latLngs
            for (var i = 0; i < avoidAreas.length; i++) {
                var currentArea = avoidAreas[i];
                //<xls:AOI>
                writer.writeStartElement('xls:AOI');
                //<gml:Polygon>
                writer.writeStartElement('gml:Polygon');
                //<gml:exterior>
                writer.writeStartElement('gml:exterior');
                //<gml:LinearRing>
                writer.writeStartElement('gml:LinearRing');
                var corners = currentArea.getLatLngs()[0];
                for (var j = 0; j < corners.length; j++) {
                    writer.writeStartElement('gml:pos');
                    writer.writeString(corners[j].lng + ' ' + corners[j].lat);
                    writer.writeEndElement();
                    // close polygon
                    if (j == corners.length - 1) {
                        writer.writeStartElement('gml:pos');
                        writer.writeString(corners[0].lng + ' ' + corners[0].lat);
                        writer.writeEndElement();
                    }
                }
                writer.writeEndElement();
                //</gml:exterior>
                writer.writeEndElement();
                //</gml:Polygon>
                writer.writeEndElement();
                //</xls:AOI>
                writer.writeEndElement();
            }
        }
        if (avoidableParams[0] == 'true' || avoidableParams[0] === true) {
            writer.writeElementString('xls:AvoidFeature', 'Highway');
        }
        if (avoidableParams[1] == 'true' || avoidableParams[1] === true) {
            writer.writeElementString('xls:AvoidFeature', 'Tollway');
        }
        if (avoidableParams[2] == 'true' || avoidableParams[2] === true) {
            writer.writeElementString('xls:AvoidFeature', 'Unpavedroads');
        }
        if (avoidableParams[3] == 'true' || avoidableParams[3] === true) {
            writer.writeElementString('xls:AvoidFeature', 'Ferry');
        }
        if (avoidableParams[4] == 'true' || avoidableParams[4] === true) {
            writer.writeElementString('xls:AvoidFeature', 'Steps');
        }
        if (avoidableParams[5] == 'true' || avoidableParams[5] === true) {
            writer.writeElementString('xls:AvoidFeature', 'Fords');
        }
        if (avoidableParams[6] == 'true' || avoidableParams[6] === true) {
            writer.writeElementString('xls:AvoidFeature', 'Pavedroads');
        }
        if (avoidableParams[7] == 'true' || avoidableParams[7] === true) {
            writer.writeElementString('xls:AvoidFeature', 'Tunnels');
        }
        //</xls:AvoidList>
        writer.writeEndElement();
        //</xls:RoutePlan>
        writer.writeEndElement();
        //<xls:RouteInstructionsRequest>
        writer.writeStartElement('xls:RouteInstructionsRequest');
        writer.writeAttributeString('provideGeometry', 'true');
        //</xls:RouteInstructionsRequest>
        writer.writeEndElement();
        //</ xls:RouteGeometryRequest>
        writer.writeElementString('xls:RouteGeometryRequest');
        //</xls:DetermineRouteRequest>
        writer.writeEndElement();
        //</xls:Request>
        writer.writeEndElement();
        //</xls:XLS>
        writer.writeEndDocument();
        var xmlRequest = writer.flush();
        writer.close();
        var url;
        if (location.hostname.match('openrouteservice') || location.hostname.match('localhost')) {
            url = "cgi-bin/proxy.cgi?url=" + namespaces.services.routing;
        } else {
            url = namespaces.services.routing;
        }
        jQuery.ajax({
            url: url,
            processData: false,
            type: "POST",
            dataType: "xml",
            crossDomain: false,
            data: xmlRequest,
            success: function(response) {
                successCallback(response, calcRouteID, routePref);
            },
            error: function(response) {
                failureCallback(response);
            }
        });
    }
    /**
     * parses the routing results of the service to a single 'path'
     * @param results: response of the service
     * @param routeString: Leaflet LineString representing the whole route
     */
    function writeRouteToSingleLineString(results) {
        var routeString = [];
        var routeGeometry = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteGeometry')[0];
        $A(util.getElementsByTagNameNS(routeGeometry, namespaces.gml, 'pos')).each(function(point) {
            point = point.text || point.textContent;
            point = point.split(' ');
            point = L.latLng(point[1], point[0]);
            routeString.push(point);
        });
        return routeString;
    }
    /**
     * the line strings represent a part of the route when driving on one street (e.g. 7km on autoroute A7)
     * if we have selected a profile which returns height profiles we have to derive the information
     * @param {Object} results: XML response
     */
    function parseResultsToHeights(results) {
        var heights = [];
        var routePoints = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteGeometry')[0];
        $A(util.getElementsByTagNameNS(routePoints, namespaces.gml, 'pos')).each(function(point) {
            point = point.text || point.textContent;
            point = point.split(' ');
            point = L.latLng(point[1], point[0], point[2]);
            heights.push(point);
        });
        return heights;
    }
    /**
     * the line strings represent a part of the route when driving on one street (e.g. 7km on autoroute A7)
     * we examine the lineStrings from the instruction list to get one lineString-ID per route segment so that we can support mouseover/mouseout events on the route and the instructions
     * @param {Object} results: XML response
     */
    function parseResultsToLineStrings(results) {
        var listOfLineStrings = [];
        var heightIdx = 0;
        var routeInstructions = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteInstructionsList')[0];
        if (routeInstructions) {
            routeInstructions = util.getElementsByTagNameNS(routeInstructions, namespaces.xls, 'RouteInstruction');
            $A(routeInstructions).each(function(instructionElement) {
                var directionCode = util.getElementsByTagNameNS(instructionElement, namespaces.xls, 'DirectionCode')[0];
                directionCode = directionCode.textContent;
                //skip directionCode 100 for now
                if (directionCode == '100') {
                    return;
                }
                var segment = [];
                $A(util.getElementsByTagNameNS(instructionElement, namespaces.gml, 'pos')).each(function(point) {
                    point = point.text || point.textContent;
                    point = point.split(' ');
                    point = L.latLng(point[1], point[0]);
                    segment.push(point);
                });
                listOfLineStrings.push(segment);
            });
        }
        return listOfLineStrings;
    }
    /**
     * corner points are points in the route where the direction changes (turn right at street xy...)
     * @param {Object} results: XML response
     * @param {Object} converterFunction
     */
    function parseResultsToCornerPoints(results, converterFunction) {
        var listOfCornerPoints = [];
        var routeInstructions = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteInstructionsList')[0];
        if (routeInstructions) {
            routeInstructions = util.getElementsByTagNameNS(routeInstructions, namespaces.xls, 'RouteInstruction');
            $A(routeInstructions).each(function(instructionElement) {
                var directionCode = util.getElementsByTagNameNS(instructionElement, namespaces.xls, 'DirectionCode')[0];
                directionCode = directionCode.textContent;
                //skip directionCode 100 for now
                if (directionCode == '100') {
                    return;
                }
                var point = util.getElementsByTagNameNS(instructionElement, namespaces.gml, 'pos')[0];
                point = point.text || point.textContent;
                point = point.split(' ');
                point = L.latLng(point[1], point[0]);
                // point = converterFunction(point);
                listOfCornerPoints.push(point);
            });
        }
        return listOfCornerPoints;
    }
    /**
     * checks if the routing request was successful but the response doesn't contain a route but an error message
     * @param {Object} results XML result of routing request
     * @return: true, if it contains errors, false otherwise
     */
    function hasRoutingErrors(results) {
        //check if the route calculation returned an error (e.g. waypoints too far from road)
        var errorTag = util.getElementsByTagNameNS(results, namespaces.xls, 'ResponseHeader');
        errorTag = errorTag.length > 0 ? errorTag[0] : null;
        if (errorTag) {
            var errorText = errorTag.getAttribute('sessionID');
            if (errorText === 'Error') {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
    Route.prototype.calculate = calculate;
    Route.prototype.writeRouteToSingleLineString = writeRouteToSingleLineString;
    Route.prototype.parseResultsToLineStrings = parseResultsToLineStrings;
    Route.prototype.parseResultsToHeights = parseResultsToHeights;
    Route.prototype.parseResultsToCornerPoints = parseResultsToCornerPoints;
    Route.prototype.hasRoutingErrors = hasRoutingErrors;
    return new Route();
}(window));