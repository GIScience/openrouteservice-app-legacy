// global variable which is set to false after init is run
// is needed in order for cookies to be loaded properly
var initMap = true;
var Controller = (function(w) {
    'use strict';
    var $ = w.jQuery,
        ui = w.Ui,
        uiVersions = w.Versions,
        uiLanguages = w.Languages,
        waypoint = w.Waypoint,
        geolocator = w.Geolocator,
        searchAddress = w.SearchAddress,
        searchPoi = w.SearchPoi,
        route = w.Route,
        analyse = w.AccessibilityAnalysis,
        preferences = w.Preferences,
        openRouteService = w.OpenRouteService,
        restrictions = w.Restrictions,
        Map = w.Map,
        //the map
        map,
        //Timeout for service responses
        SERVICE_TIMEOUT_INTERVAL = 10000,
        //timer
        timerRoute, //TODO more timers for various service calls
        //timeout for tmc messages
        refreshIntervalIdTMC;
    //ID for route calculation, will increment each time a route is calculated
    var calcRouteID = 0;

    function Controller() {
        //IE does not know console...
        if (!window.console) {
            window.console = {};
            window.console.log = function() {};
        }
    }
    /* *********************************************************************
     * GENERAL
     * *********************************************************************/
    /**
     *called when sidebar toggles and the map area is resized
     */
    function handleMapUpdate() {
        map.updateSize();
    }
    /* *********************************************************************
     * WAYPOINTS
     * *********************************************************************/
    /**
     * parses the user input for the waypoint search and calls the Waypoint module to build a search request
     * @param atts: query: the search query; wpIndex: index of the waypoint; searchIds: map feature ids of previous searches
     */
    function handleWaypointRequest(atts) {
        ui.searchWaypointChangeToSearchingState(true, atts.wpIndex);
        var lastSearchResults = atts.searchIds;
        lastSearchResults = lastSearchResults ? lastSearchResults.split(' ') : null;
        if (lastSearchResults) {
            map.clearMarkers(map.layerSearch, lastSearchResults);
        }
        waypoint.incrRequestCounterWaypoint(atts.wpIndex);
        waypoint.find(atts.query, handleSearchWaypointResults, handleSearchWaypointFailure, atts.wpIndex, preferences.language);
    }
    /**
     * forwards the waypoint search results to the Ui to display the addresses and to the map in order to add markers.
     * @param results: results of the search query in XML format
     * @param wpIndex: index of the waypoint
     */
    function handleSearchWaypointResults(results, wpIndex) {
        //when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
        var responseError = util.getElementsByTagNameNS(results, namespaces.xls, 'ErrorList').length;
        if (parseInt(responseError) > 0) {
            //service response contains an error, switch to error handling function
            handleSearchWaypointFailure(wpIndex);
        } else {
            waypoint.decrRequestCounterWaypoint(wpIndex);
            if (waypoint.getRequestCounterWaypoint(wpIndex) === 0) {
                // HERE
                var listOfPoints = waypoint.parseResultsToPoints(results, wpIndex);
                ui.searchWaypointChangeToSearchingState(false, wpIndex);
                if (listOfPoints.length) {
                    var listOfFeatures = map.addSearchAddressResultMarkers(listOfPoints, wpIndex);
                    ui.updateSearchWaypointResultList(results, listOfFeatures, 'layerSearch', wpIndex);
                } else {
                    ui.showSearchWaypointError(wpIndex);
                }
            }
        }
    }
    /**
     * calls the UI to show a search error
     * @param: wpIndex: index of the waypoint
     */
    function handleSearchWaypointFailure(wpIndex) {
        waypoint.decrRequestCounterWaypoint(wpIndex);
        if (waypoint.getRequestCounterWaypoint(wpIndex) == 0) {
            ui.searchWaypointChangeToSearchingState(false, wpIndex);
            ui.showSearchWaypointError();
        }
    }
    /**
     * the user selects one of the search results as new waypoint. The corresponding map feature is set, other search results are removed. Ui and internal variables are updated.
     * @param atts: wpIndex: index of the waypoint; featureId: map feature id of the selected marker; searchIds: string of all search features for this search
     */
    function handleWaypointResultClick(atts) {
        var wpIndex = atts.wpIndex;
        var featureId = atts.featureId;
        var searchIds = atts.searchIds;
        if (searchIds) {
            searchIds = searchIds.split(' ');
        }
        var type = selectWaypointType(wpIndex);
        var waypointResultId = map.addWaypointMarker(wpIndex, featureId, type);
        map.clearMarkers(map.layerSearch, searchIds);
        waypoint.setWaypoint(wpIndex, true);
        var position_string = map.convertFeatureIdToPositionString(waypointResultId, map.layerRoutePoints);
        var position = map.convertFeatureIdToPosition(waypointResultId, map.layerRoutePoints);
        map.zoomToMarker(position, 5);
        ui.setWaypointFeatureId(wpIndex, waypointResultId, position_string, 'layerRoutePoints');
        handleWaypointChanged();
    }
    /**
     * the user clicks on a field to add a new empty waypoint. Internal variables and waypoint attributes are updated
     * @param: newWaypointIndex: index which is assigned to the new waypoint
     */
    function handleAddWaypoint(newWaypointIndex) {
        waypoint.addWaypoint(newWaypointIndex);
        //re-calculate type of last (now next-to-last) waypoint
        var index = waypoint.getNumWaypoints() - 2;
        var type = waypoint.determineWaypointType(index);
        ui.setWaypointType(index, type);
        var featureId = ui.getFeatureIdOfWaypoint(index);
        var newId = map.setWaypointType(featureId, type);
        var position = map.convertFeatureIdToPositionString(newId, map.layerRoutePoints);
        ui.setWaypointFeatureId(index, newId, position, map.layerRoutePoints);
    }
    /**
     * mark the given waypoint either as start, via or end according to the waypoint's position in the route
     * @param wpIndex: index of the waypoint
     */
    function selectWaypointType(wpIndex) {
        var type = waypoint.determineWaypointType(wpIndex);
        ui.setWaypointType(wpIndex, type);
        return type;
    }
    /**
     * the user sets a waypoint by clicking on the map saying "add waypoint...". The waypoint is displayed on Ui and on the map, internal variables are updated and the address of the waypoint is looked up.
     * @param atts: pos: position of the new waypoint, type: type of the waypoint
     * @param noRouteRequest: if noRouteRequest is true, then no route request is fired
     */
    function handleAddWaypointByRightclick(atts, noRouteRequest) {
        var pos = atts.pos;
        var wpType = atts.type;
        var featureId;
        //index of the waypoint to set (start at the beginning, end at the end, via in the middle)
        var wpIndex = 0;
        //if END: use index of last waypoint
        wpIndex = wpType == Waypoint.type.END ? waypoint.getNumWaypoints() - 1 : wpIndex;
        //if VIA: use index of prior to last waypoint, insert the new via point after this element
        wpIndex = wpType == Waypoint.type.VIA ? waypoint.getNumWaypoints() - 2 : wpIndex;
        //in case of a newly added VIA, the additional waypoint is added in ui.addWaypintAfter(...)
        if (wpType == Waypoint.type.VIA) {
            ui.addWaypointAfter(wpIndex, waypoint.getNumWaypoints());
            wpIndex++;
            //adding a waypoint internally is not necessary. this is done via the call in ui.addWaypointAfter(...).
        }
        ui.showSearchingAtWaypoint(wpIndex, true);
        //remove old waypoint marker (if exists)
        featureId = ui.getFeatureIdOfWaypoint(wpIndex);
        if (featureId) {
            //address has been set yet
            map.clearMarkers(map.layerRoutePoints, [featureId]);
        }
        //add the new marker
        var newFeatureId = map.addWaypointAtPos(pos, wpIndex, wpType);
        //add lat lon to input field 
        waypoint.setWaypoint(wpIndex, true);
        var position = map.convertFeatureIdToPositionString(newFeatureId, map.layerRoutePoints);
        var newIndex = ui.addWaypointResultByRightclick(wpType, wpIndex, position, true);
        ui.setWaypointFeatureId(newIndex, newFeatureId, position, 'layerRoutePoints');
        if (!noRouteRequest) {
            handleWaypointChanged();
        }
        //start geocoding process and replace lat lon in input if response
        geolocator.reverseGeolocate(pos, reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, wpType, wpIndex, newFeatureId);
    }
    /**
     * handles the results of the reverse geolocation service call by showing/removing features on the map, calling the Ui,...
     * @param addressResult: result of the service request in XML format
     * @param wpType: type of the waypoint
     * @param wpIndex: index of the waypoint
     * @param featureId: id of the map feature
     * @param addWaypointAt: index where to add the waypoint
     */
    function reverseGeocodeSuccess(addressResult, wpType, wpIndex, featureId, addWaypointAt) {
        //when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
        var responseError = util.getElementsByTagNameNS(addressResult, namespaces.xls, 'ErrorList').length;
        if (parseInt(responseError) > 0) {
            //service response contains an error, switch to error handling function
            reverseGeocodeFailure(wpIndex);
        } else {
            //adapt the waypoint internals:
            if (addWaypointAt && addWaypointAt >= 0) {
                ui.addWaypointAfter(addWaypointAt - 1, waypoint.getNumWaypoints());
                waypoint.setWaypoint(addWaypointAt, true);
            }
            //waypoint.setWaypoint(wpIndex, true);
            ui.showSearchingAtWaypoint(wpIndex, false);
            var newIndex = ui.addWaypointResultByRightclick(wpType, wpIndex, addressResult);
            var position = map.convertFeatureIdToPositionString(featureId, map.layerRoutePoints);
            ui.setWaypointFeatureId(newIndex, featureId, position, 'layerRoutePoints');
            //cannot be emmited by 'this', so let's use sth that is known inside the callback...
            ui.emit('control:reverseGeocodeCompleted');
        }
    }
    /**
     * error handling for the reverse geocode service request
     * @param wpIndex: index of the waypoint
     */
    function reverseGeocodeFailure(wpIndex) {
        ui.showSearchingAtWaypoint(wpIndex, false);
    }
    /**
     * after waypoints have been moved, re-calculations are necessary: update of internal variables, waypoint type exchange,...
     */
    function handleMovedWaypoints(atts) {
        var j = 0;
        var i = Object.keys(atts).length - 1;
        while (j < i) {
            var wp1 = atts[Object.keys(atts)[j]];
            var wp2 = atts[Object.keys(atts)[i]];
            //waypoint-internal:
            var set1 = waypoint.getWaypointSet(wp1);
            var set2 = waypoint.getWaypointSet(wp2);
            waypoint.setWaypoint(j, set2);
            waypoint.setWaypoint(i, set1);
            var type = selectWaypointType(wp1);
            var ftId = ui.getFeatureIdOfWaypoint(wp1);
            var newFtId = map.setWaypointType(ftId, type);
            var position = map.convertFeatureIdToPositionString(newFtId, map.layerRoutePoints);
            ui.setWaypointFeatureId(wp1, newFtId, position, 'layerRoutePoints');
            type = selectWaypointType(wp2);
            ftId = ui.getFeatureIdOfWaypoint(wp2);
            newFtId = map.setWaypointType(ftId, type);
            position = map.convertFeatureIdToPositionString(newFtId, map.layerRoutePoints);
            ui.setWaypointFeatureId(wp2, newFtId, position, 'layerRoutePoints');
            j++;
            i--;
            //update preferences
            handleWaypointChanged(true);
        }
    }
    /**
     * the user removed a waypoint. Internal variables are updated, waypoint types checked,...
     * @param atts: wpIndex: index of the waypoint, featureId: id of the map feature of the waypoint
     */
    function handleRemoveWaypoint(atts) {
        var idx = atts.wpIndex;
        var featureId = atts.featureId;
        //remove map feature of deleted wayoint
        map.clearMarkers(map.layerRoutePoints, [featureId]);
        if (waypoint.getNumWaypoints() > 2) {
            waypoint.removeWaypoint(idx);
        } else {
            waypoint.setWaypoint(idx, false);
        }
        //re-calculate the waypoint types
        for (var i = 0; i < waypoint.getNumWaypoints(); i++) {
            var type = waypoint.determineWaypointType(i);
            ui.setWaypointType(i, type);
            featureId = ui.getFeatureIdOfWaypoint(i);
            var newId = map.setWaypointType(featureId, type);
            var position = map.convertFeatureIdToPositionString(newId, map.layerRoutePoints);
            ui.setWaypointFeatureId(i, newId, position, 'layerRoutePoints');
        }
        //decide about which buttons to show
        if (idx > 0) {
            //look at previous waypoint. If this is the last waypoint, do not show the move down button
            if ((idx - 1) == (waypoint.getNumWaypoints() - 1)) {
                ui.setMoveDownButton(idx - 1, false);
                ui.setMoveUpButton(idx - 1, true);
            }
        }
        if (idx < (waypoint.getNumWaypoints() - 1)) {
            //look at the next waypoint. If this is the first waypoint, do not show the move up button
            //because we removed one waypoint, the successor will have now an ID of idx
            if (idx === 0) {
                ui.setMoveDownButton(idx, true);
                ui.setMoveUpButton(idx, false);
            }
        }
        //update preferences
        handleWaypointChanged();
        //TODO: update route string..
    }
    /**
     * the user wants to set an existing waypoint at a different location and re-enables the search field by clicking on "search again".
     * old map features are removed, internal variables are updated
     * @param atts: waypointFeature: map feature of the waypoint; waypointLayer: layer the map feature is located on, wpIndex: index of the waypoint
     */
    function handleSearchAgainWaypoint(atts) {
        var waypointFeature = atts.waypointFeature;
        var waypointLayer = atts.waypointLayer;
        var wpIndex = atts.wpIndex;
        //remove the waypoint marker
        map.clearMarkers(map[waypointLayer], [waypointFeature]);
        //to re-view the search results of the waypoint search, the whole thing is re-calculated using existant functions
        //waypoint-internal
        waypoint.setWaypoint(wpIndex, false);
        //update preferences
        handleWaypointChanged();
    }
    /**
     * the whole route and its waypoints are removed. Internal variables are updated
     */
    function handleResetRoute() {
        var isWaypointPresent = waypoint.getNumWaypointsSet() >= 1;
        if (isWaypointPresent) {
            //remove all waypoint markers
            map.clearMarkers(map.layerRoutePoints);
            map.clearMarkers(map.layerCornerPoints);
            waypoint.resetWaypointSet();
            //console.log(waypoint.getDebugInfo());
            //update preferences
            handleWaypointChanged(null);
        }
    }
    /**
     * is called when one or more waypoints have changed. Updates internal variables (preferences).
     * check whether point is start or end point, preferences have to be updated accordingly that permalink still works correctly
     * @param waypointStringList: string containing all waypoints
     */
    function handleWaypointChanged(doNotCalculateRoute) {
        var routePoints = ui.getRoutePoints();
        var wpString = "";
        for (var i = 0; i < routePoints.length; i++) {
            routePoints[i] = routePoints[i].split(' ');
            if (routePoints[i].length == 2) {
                wpString = wpString + routePoints[i][1] + ',' + routePoints[i][0] + ',';
            }
        }
        //slice away the last separator ','
        wpString = wpString.substring(0, wpString.length - 1);
        handlePrefsChanged({
            key: preferences.waypointIdx,
            value: wpString,
        });
        if (!doNotCalculateRoute) {
            handleRoutePresent();
        }
    }
    /**
     * map is zoomed to the selected part of the route (route instruction)
     * @param vectorId: id of the map feature to zoom to
     */
    function handleZoomToRouteInstruction(vectorId) {
        map.zoomToFeature(map.layerRouteLines, vectorId);
    }
    /**
     * map is zoomed to the selected part of the route (route instruction)
     * @param vectorId: id of the map feature to zoom to
     */
    function handleZoomToRouteCorner(vectorId) {
        map.zoomToFeature(map.layerCornerPoints, vectorId);
    }
    /* *********************************************************************
     * GEOLOCATION
     * *********************************************************************/
    /**
     * call the geolocation service to retrieve the user's current location
     */
    function handleGeolocationRequest() {
        ui.showGeolocationSearching(true);
        ui.showGeolocationError(false);
        geolocator.locate(handleGeolocateSuccess, handleGeolocateError, handleGeolocateNoSupport, preferences.language);
    }
    /**
     * handles the result of the geolocation service by adding a map feature at the result location
     * @param position: service result containing the result location
     */
    function handleGeolocateSuccess(position) {
        position = L.latLng(position.coords.latitude, position.coords.longitude);
        //add marker at current position
        var feature = map.addGeolocationResultMarker(position);
        //show current position as address in the Ui pane
        geolocator.reverseGeolocate(position, handleReverseGeolocationSuccess, handleGeolocateError, preferences.language, null, null, feature);
    }
    /**
     * handles a runtime error during geolocation
     */
    function handleGeolocateError() {
        ui.showGeolocationError(true, false);
        ui.showGeolocationSearching(false);
    }
    /**
     * shows a message if the geolocation is not supported by the user's browser
     */
    function handleGeolocateNoSupport() {
        ui.showGeolocationError(true, true);
        ui.showGeolocationSearching(false);
    }
    /**
     * shows the reverse-geocoded position as address in the Ui;
     * parameters nn0 and nn1 are not relevant here (only used in waypoint geocoding)
     * @param result: service response in XML format
     * @param nn0, nn1: arbitrary
     * @param feature: map feature at the position the address was retrieved for
     */
    function handleReverseGeolocationSuccess(result, nn0, nn1, feature) {
        ui.showGeolocationSearching(false);
        ui.showCurrentLocation(result, feature.id, 'layerGeolocation', feature);
    }
    /* *********************************************************************
     * SEARCH ADDRESS
     * *********************************************************************/
    /**
     * parses the user input for the address search and calls the SearchAddress module to build a search request
     * @param atts: address: address as text string the user wants to search for; lastSearchResults: string of LL feature ids for the last search results
     */
    function handleSearchAddressRequest(atts) {
        var address = atts.address;
        var lastSearchResults = atts.lastSearchResults;
        lastSearchResults = lastSearchResults ? lastSearchResults.split(' ') : null;
        ui.searchAddressChangeToSearchingState(true);
        if (lastSearchResults) {
            map.clearMarkers(map.SEARCH, lastSearchResults);
        }
        searchAddress.requestCounter++;
        searchAddress.find(address, handleSearchAddressResults, handleSearchAddressFailure, preferences.language);
    }
    /**
     * forwards the address search results to the Ui to display the addresses and to the map in order to add markers.
     * @param results: XML results of the address search
     */
    function handleSearchAddressResults(results) {
        //IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
        results = results.responseXML ? results.responseXML : util.parseStringToDOM(results.responseText);
        //when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
        var responseError = util.getElementsByTagNameNS(results, namespaces.xls, 'ErrorList').length;
        if (parseInt(responseError) > 0) {
            //service response contains an error, switch to error handling function
            handleSearchAddressFailure();
        } else {
            searchAddress.requestCounter--;
            if (searchAddress.requestCounter == 0) {
                var listOfPoints = searchAddress.parseResultsToPoints(results);
                ui.searchAddressChangeToSearchingState(false);
                var listOfFeatures = map.addSearchAddressResultMarkers(listOfPoints);
                ui.updateSearchAddressResultList(results, listOfFeatures, map.SEARCH);
            }
        }
    }
    /**
     * calls the UI to show a address search error
     */
    function handleSearchAddressFailure() {
        searchAddress.requestCounter--;
        if (searchAddress.requestCounter == 0) {
            ui.searchAddressChangeToSearchingState(false);
            ui.showSearchAddressError();
        }
    }
    /**
     * removes old address features from the map when starting a new address search
     */
    function handleClearSearchAddressMarkers() {
        map.clearMarkers(map.SEARCH);
    }
    /**
     * moves and zooms the map so that all address search result map features become visible
     */
    function handleZoomToAddressResults() {
        map.zoomToAddressResults();
    }
    /* *********************************************************************
     * SEARCH POI
     * *********************************************************************/
    /**
     * checks if the given distance is suitable for POI search near route
     * maximum distance supported by the service is 5000 meters.
     * @param atts: dist: distance as string; unit: distance unit as string
     */
    function handleCheckDistanceToRoute(atts) {
        var dist = util.convertDistToMeters(parseInt(atts.dist), atts.unit);
        ui.showSearchPoiDistUnitError(dist > 5000);
    }
    /**
     * parses the user input for the POI search and calls the SearchPoi module to build a search request
     * @param atts: query: the POI search query as string; nearRoute: true if a POI search along a given route should be performed; maxDist: maximum distance for POIs off the route; lastSearchResults: list of LL map feature ids of the last search
     */
    function handleSearchPoiRequest(atts) {
        var poi = atts.query;
        var searchNearRoute = atts.nearRoute;
        var maxDist = atts.maxDist;
        var distanceUnit = atts.distUnit;
        var lastSearchResults = atts.lastSearchResults;
        lastSearchResults = lastSearchResults ? lastSearchResults.split(' ') : null;
        ui.searchPoiChangeToSearchingState(true);
        if (lastSearchResults) {
            map.clearMarkers(map.POI, lastSearchResults);
        }
        var refPoint = null;
        if (searchNearRoute == true) {
            //use route points
            var refPoint = (map.theMap.getLayersByName(map.ROUTE_LINES)[0]).features;
            if (refPoint && refPoint[0]) {
                refPoint = (refPoint[0]).geometry.components;
            }
        } else {
            //pick center of map
            var pt = map.theMap.getCenter();
            pt = pt.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
            refPoint = [];
            refPoint.push(pt);
            //this value is measured in meters only
            var width = map.theMap.calculateBounds().getWidth();
            var height = map.theMap.calculateBounds().getHeight();
            maxDist = width < height ? width : height;
            maxDist /= 2;
        }
        searchPoi.requestCounter++;
        searchPoi.find(poi, refPoint, maxDist, distanceUnit, handleSearchPoiResults, handleSearchPoiFailure, preferences.language);
    }
    /**
     * forwards the POI search results to the Ui to display the POIs and to the map in order to add markers.
     * @param results: XML search results
     */
    function handleSearchPoiResults(results) {
        //IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
        results = results.responseXML ? results.responseXML : util.parseStringToDOM(results.responseText);
        //when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
        var responseError = util.getElementsByTagNameNS(results, namespaces.xls, 'ErrorList').length;
        if (parseInt(responseError) > 0) {
            //service response contains an error, switch to error handling function
            handleSearchPoiFailure();
        } else {
            searchPoi.requestCounter--;
            if (searchPoi.requestCounter == 0) {
                var listOfPoints = searchPoi.parseResultsToPoints(results);
                ui.searchPoiChangeToSearchingState(false);
                var listOfFeatures = map.addSearchPoiResultMarkers(listOfPoints);
                ui.updateSearchPoiResultList(results, listOfFeatures, map.POI);
            }
        }
    }
    /**
     * calls the UI to show a POI search error
     */
    function handleSearchPoiFailure() {
        searchPoi.requestCounter--;
        if (searchPoi.requestCounter == 0) {
            ui.searchPoiChangeToSearchingState(false);
            ui.showSearchPoiError();
        }
    }
    /**
     * removes old POI map features from the map when starting a new POI search
     */
    function handleClearSearchPoiMarkers() {
        map.clearMarkers(map.POI);
    }
    /**
     * moves and zooms the map so that all POI search results become visible
     */
    function handleZoomToPoiResults() {
        map.zoomToPoiResults();
    }
    /**
     * moves and zooms the map to the given/ clicked POI marker
     * @param atts: position: position of the map feature as string, layer: map layer the feature is located on
     */
    function handleZoomToMarker(atts) {
        var position = util.convertPositionStringToLonLat(atts.position);
        var layer = atts.layer;
        var zoom;
        if (layer == map.POI) {
            zoom = 17;
        } else {
            zoom = 14;
        }
        map.zoomToMarker(position, zoom);
    }
    /**
     * adds a search result (address, POI) as a waypoint to the current route
     * @param position: the position of the feature to use
     */
    function handleUseAsWaypoint(position) {
        if ('string' == typeof position) {
            position = util.convertPositionStringToLonLat(position);
        }
        //use the next unset waypoint for the new waypoint (append one if no unset wp exists) (some lines below)
        var index = waypoint.getNextUnsetWaypoint();
        var type;
        if (index === 0) {
            type = waypoint.type.START;
        } else if (index >= 0 && index < waypoint.getNumWaypoints() - 1) {
            type = waypoint.type.VIA;
        } else {
            type = waypoint.type.END;
        }
        var addWp = -1;
        if (index < 0) {
            //no unset wayoint left -> add a new one (as END)
            // waypoint.addWaypoint(); <- this is called by ui.AddWaypointAfter(...), not necessary here.
            addWp = waypoint.getNumWaypoints();
            index = addWp;
        }
        //use position to add the waypoint
        var featureId = map.addWaypointAtPos(position, index, type);
        waypoint.setWaypoint(index, true);
        position = map.convertFeatureIdToPositionString(featureId, map.layerRoutePoints);
        var newIndex = ui.addWaypointResultByRightclick(type, index, position, true);
        ui.setWaypointFeatureId(newIndex, featureId, position, 'layerRoutePoints');
        handleWaypointChanged();
        geolocator.reverseGeolocate(position, reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, type, index, featureId, addWp);
        //markers of the search results will not be removed cause the search is still visible.
    }
    /**
     * after a waypoint has been moved on the map, the address of the moved waypoint is updated (as well as other internal stuff)
     * @param featureMoved: the map feature that has been moved
     */
    function handleWaypointMoved(featureMoved) {
        var pos = featureMoved.getLatLng();
        pos = new L.LatLng(pos.lat, pos.lng);
        var index = ui.getWaypiontIndexByFeatureId(featureMoved._leaflet_id);
        var type = waypoint.determineWaypointType(index);
        //add lat lon to input field 
        var newPosition = map.convertFeatureIdToPositionString(featureMoved._leaflet_id, map.layerRoutePoints);
        var newIndex = ui.addWaypointResultByRightclick(type, index, newPosition, true);
        ui.setWaypointFeatureId(newIndex, featureMoved._leaflet_id, newPosition, 'layerRoutePoints');
        //update preferences
        handleWaypointChanged();
        // request for geocoding which will replace lat lon in input field if returned
        geolocator.reverseGeolocate(pos, reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, type, index, featureMoved._leaflet_id, -1);
        ui.invalidateWaypointSearch(index);
    }
    /* *********************************************************************
     * ROUTE
     * *********************************************************************/
    /**
     * checks if a route can be calculated and displayed (if least two waypoints are set)
     * if >= 2 wp: requests the route and associated information
     * else: hides route information
     */
    function handleRoutePresent() {
        var isRoutePresent = waypoint.getNumWaypointsSet() >= 2;
        if (isRoutePresent) {
            calcRouteID++;
            ui.startRouteCalculation();
            var routePoints = ui.getRoutePoints();
            for (var i = 0; i < routePoints.length; i++) {
                routePoints[i] = routePoints[i].split(' ');
                if (routePoints[i].length == 2) {
                    routePoints[i] = {
                        'lat': routePoints[i][0],
                        'lon': routePoints[i][1]
                    };
                }
            }
            var routePref = permaInfo[preferences.routeOptionsIdx];
            var extendedRoutePreferencesWeight = permaInfo[preferences.weightIdx];
            var extendedRoutePreferencesMaxspeed = permaInfo[preferences.maxspeedIdx];
            // check if mph and transform to kmh
            if (preferences.distanceUnit == 'yd') {
                extendedRoutePreferencesMaxspeed = (Number(extendedRoutePreferencesMaxspeed) * 1.60934).toString();
            }
            // TO DO
            var avoidAreas = map.getAvoidAreas();
            var avoidableParams = [];
            var avoidHighway = permaInfo[preferences.avoidHighwayIdx];
            var avoidTollway = permaInfo[preferences.avoidTollwayIdx];
            var avoidTunnel = permaInfo[preferences.avoidTunnelIdx];
            var avoidUnpavedRoads = permaInfo[preferences.avoidUnpavedIdx];
            var avoidPavedRoads = permaInfo[preferences.avoidPavedIdx];
            var avoidFerry = permaInfo[preferences.avoidFerryIdx];
            var avoidSteps = permaInfo[preferences.avoidStepsIdx];
            var avoidFords = permaInfo[preferences.avoidFordsIdx];
            avoidableParams[0] = avoidHighway;
            avoidableParams[1] = avoidTollway;
            avoidableParams[2] = avoidUnpavedRoads;
            avoidableParams[3] = avoidFerry;
            avoidableParams[4] = avoidSteps;
            avoidableParams[5] = avoidFords;
            avoidableParams[6] = avoidPavedRoads;
            avoidableParams[7] = avoidTunnel;
            var truckParams = [];
            var truck_length = permaInfo[preferences.value_lengthIdx];
            var truck_height = permaInfo[preferences.value_heightIdx];
            var truck_weight = permaInfo[preferences.value_weightIdx];
            var truck_width = permaInfo[preferences.value_widthIdx];
            var truck_axleload = permaInfo[preferences.value_axleloadIdx];
            var truckHazardous = permaInfo[preferences.hazardousIdx];
            truckParams[0] = truck_length;
            truckParams[1] = truck_height;
            truckParams[2] = truck_weight;
            truckParams[3] = truck_width;
            truckParams[4] = truck_axleload;
            truckParams[5] = truckHazardous;
            //check whether truck button is active and send extendedRoutePreferences, otherwise don't 
            var extendedRoutePreferencesType = permaInfo[preferences.routeOptionsTypesIdx];
            var wheelChairParams = [];
            var wheelchairSurface = permaInfo[preferences.surfaceIdx];
            var wheelchairIncline = permaInfo[preferences.inclineIdx];
            var wheelchairSloped = permaInfo[preferences.slopedCurbIdx];
            var wheelchairTrackType = permaInfo[preferences.trackTypeIdx];
            var wheelchairSmoothness = permaInfo[preferences.smoothnessIdx];
            wheelChairParams[0] = wheelchairSurface;
            wheelChairParams[1] = wheelchairIncline;
            wheelChairParams[2] = wheelchairSloped;
            wheelChairParams[3] = wheelchairTrackType;
            wheelChairParams[4] = wheelchairSmoothness;
            route.calculate(routePoints, routeCalculationSuccess, routeCalculationError, preferences.routingLanguage, routePref, extendedRoutePreferencesType, wheelChairParams, truckParams, avoidableParams, avoidAreas, extendedRoutePreferencesWeight, extendedRoutePreferencesMaxspeed, calcRouteID);
            //try to read a variable that is set after the service response was received. If this variable is not set after a while -> timeout.
            clearTimeout(timerRoute);
            // Took that out for now, seems not to work properly, needs more investigation (Oliver Roick, 21 Feb 2015)
            // timerRoute = setTimeout(function() {
            //  if (!route.routePresent) {
            //      //if no response has been received after the defined interval, show a timeout error.
            //      ui.showServiceTimeoutPopup();  //TODO use for other service calls as well
            //  }
            // }, SERVICE_TIMEOUT_INTERVAL);
        } else {
            //internal
            route.routePresent = false;
            ui.setRouteIsPresent(false);
            //add features to map
            map.updateRoute();
            //add DOM elements
            ui.updateRouteSummary();
            ui.updateRouteInstructions();
            route.routeString = null;
        }
    }
    /**
     * processes route results: triggers displaying the route on the map, showing instructions and a summary
     * @param results: XML route service results
     */
    function routeCalculationSuccess(results, routeID, routePref) {
        // only fire if returned routeID from callback is same as current global calcRouteID
        if (routeID == calcRouteID) {
            var zoomToMap = !route.routePresent;
            route.routePresent = true;
            ui.setRouteIsPresent(true);
            //results = results.responseXML ? results.responseXML : util.parseStringToDOM(results.responseText);
            //when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
            var responseError = util.getElementsByTagNameNS(results, namespaces.xls, 'ErrorList').length;
            if (parseInt(responseError) > 0) {
                //service response contains an error, switch to error handling function
                routeCalculationError();
            } else {
                //use all-in-one-LineString to save the whole route in a single string
                var routeLineString = route.writeRouteToSingleLineString(results);
                var routeString = map.writeRouteToString(routeLineString);
                route.routeString = routeString;
                // each route instruction has a part of this lineString as geometry for this instruction           
                // get height profile update height profile widget if elevation profile type selected
                if ($.inArray(routePref, list.elevationProfiles) >= 0) {
                    var routeLineHeights = route.parseResultsToHeights(results);
                    map.updateHeightprofiles(routeLineHeights);
                }
                var routeLinestring = route.parseResultsToLineStrings(results);
                var routePoints = route.parseResultsToCornerPoints(results);
                //Get the restrictions along the route
                map.updateRestrictionsLayer(restrictions.getRestrictionsQuery(routeLineString), permaInfo[preferences.routeOptionsIdx]);
                var featureIds = map.updateRoute(routeLinestring, routePoints, routePref);
                var errors = route.hasRoutingErrors(results);
                if (!errors) {
                    ui.updateRouteSummary(results, routePref);
                    ui.updateRouteInstructions(results, featureIds, 'layerRouteLines');
                    ui.endRouteCalculation();
                    if (zoomToMap) map.zoomToRoute();
                } else {
                    routeCalculationError();
                }
            }
        }
    }
    /**
     * shows a route calculation error; hides route information
     */
    function routeCalculationError() {
        ui.endRouteCalculation();
        ui.showRoutingError();
        ui.hideRouteSummary();
        ui.hideRouteInstructions();
        map.updateRoute();
    }
    /**
     * moves and zooms the map so that the whole route becomes visible
     */
    function handleZoomToRoute() {
        map.zoomToRoute();
    }
    /**
     * if avoid areas intersect themselves they are invalid and no route calculation can be done. Inform the user by showing an error message in the UI
     * @param errorous: true, if the error message should be shown; false if it should be hidden
     */
    function avoidAreasError(errorous) {
        ui.showAvoidAreasError(errorous);
    }
    /**
     * updates internal preference variables after an avoid area change
     * @param avoidAreaString: string of avoid area polygon points
     */
    function handleAvoidAreaChanged(avoidAreaString) {
        handlePrefsChanged({
            key: preferences.avoidAreasIdx,
            value: avoidAreaString
        });
    }
    /* *********************************************************************
     * ACCESSIBILITY ANALYSIS
     * *********************************************************************/
    /**
     * requests the accessibility analysis based on the start waypoint
     * @param atts: position: position of the start waypoint; distance: distance for the accessibility analysis in minutes
     */
    function handleAnalyzeAccessibility(atts) {
        var pos = atts.position;
        if (pos) {
            //assuming we have a position set...
            pos = pos.split(' ');
            var dist = atts.distance;
            //aas setting route type
            var aasRoutePref = permaInfo[preferences.routeOptionsIdx];
            //aas setting intervall in minutes
            var aasIntervall = $('#accessibilityAnalysisIsochronesIntervall').val();
            var aasIntervallSeconds = (parseInt(aasIntervall) * 60).toString();
            //aas setting isochrone method
            var aasMethod = $('#accessibilityAnalysisMethodList :selected').val();
            ui.showAccessibilityError(false);
            ui.showSearchingAtAccessibility(true);
            map.eraseAccessibilityFeatures();
            analyse.analyze(pos, dist, aasRoutePref, aasMethod, aasIntervallSeconds, accessibilitySuccessCallback, accessibilityFailureCallback);
        } else {
            //no position, no analyse!
            ui.showAccessibilityError(true);
        }
    }
    /**
     * processes the accessibility analsysis response;  map zooms to the resulting area, area is shown on the map
     * @param result: XML response from the service
     */
    function accessibilitySuccessCallback(result) {
        //when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
        var responseError = util.getElementsByTagNameNS(result, namespaces.xls, 'ErrorList').length;
        if (parseInt(responseError) > 0) {
            //service response contains an error
            accessibilityFailureCallback();
        } else {
            var bounds = analyse.parseResultsToBounds(result);
            if (bounds) {
                map.theMap.fitBounds(bounds, true);
                var polygonArr = analyse.parseResultsToPolygon(result);
                map.addAccessiblityPolygon(polygonArr);
                ui.showSearchingAtAccessibility(false);
            } else {
                accessibilityFailureCallback();
            }
        }
    }
    /**
     * processes the accessibility error response and displays an error
     */
    function accessibilityFailureCallback() {
        ui.showAccessibilityError(true);
    }
    /**
     * removes the accessibility map features
     */
    function handleRemoveAccessibility() {
        map.clearMarkers(map.layerAccessibility);
    }
    /* *********************************************************************
     * EXPORT / IMPORT
     * *********************************************************************/
    /**
     * extracts route information and displays the track in a new window formatted as GPX
     */
    function handleExportRoute() {
        var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
        var isFirefox = typeof InstallTrigger !== 'undefined'; // Firefox 1.0+
        var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
        // At least Safari 3+: "[object HTMLElementConstructor]"
        var isChrome = !!window.chrome && !isOpera; // Chrome 1+
        var isIE = /*@cc_on!@*/ false || !!document.documentMode; // At least IE6
        var routeString = route.routeString;
        if (routeString) {
            // encode string
            var newRouteString = btoa(routeString);
            if (isSafari === true) {
                ui.showExportRouteError(false);
                window.open('data:text/gpx+xml;base64,' + newRouteString);
            } else {
                ui.showExportRouteError(false);
                var exportGPXElement = document.getElementById('export-gpx');
                exportGPXElement.href = 'data:text/gpx+xml;base64,' + newRouteString;
            }
        } else {
            ui.showExportRouteError(true);
        }
    }
    /**
     * uploads GPX file and calculates the route between these points
     * required HTML5 file api
     * @param file: the GPX file to upload
     */
    function handleGpxRoute(fileArray) {
        //remove old routes
        var gpxFile = fileArray[0];
        var granularity = fileArray[1];
        // use granularity and pass 
        ui.handleResetRoute();
        ui.showImportRouteError(false);
        if (gpxFile) {
            if (!window.FileReader) {
                // File APIs are not supported, e.g. IE
                ui.showImportRouteError(true);
            } else {
                var r = new FileReader();
                r.readAsText(gpxFile);
                r.onload = function(e) {
                    var data = e.target.result;
                    //remove gpx: tags; Firefox cannot cope with that.
                    data = data.replace(/gpx:/g, '');
                    var wps = map.parseStringToWaypoints(data, granularity);
                    if (wps) {
                        //waypoints: array of LL.lngLat representing one wayoint each
                        for (var i = 0; i < wps.length; i++) {
                            var type;
                            if (wps[i][1] === 0 & wps[i][0] === 0) {
                                continue;
                            } else if (i === 0) {
                                type = Waypoint.type.START;
                            } else if (i == wps.length - 1) {
                                type = Waypoint.type.END;
                            } else {
                                type = Waypoint.type.VIA;
                            }
                            handleAddWaypointByRightclick({
                                pos: wps[i],
                                type: type
                            }, true);
                        }
                        if (wps.length >= 2) {
                            handleRoutePresent();
                        }
                    } else {
                        ui.showImportRouteError(true);
                    }
                };
            }
        }
    }
    /**
     * uploads the track GPX file and displays it on the map. NO route re-calculation!
     * required HTML5 file api
     * @param fileTarget: array: the GPX file to upload and the html remove target
     */
    function handleGpxTrack(fileTarget) {
        ui.showImportRouteError(false);
        //clean old track from map (at the moment only one track is supported)
        map.clearMarkers(map.layerTrack);
        if (fileTarget[0]) {
            if (!window.FileReader) {
                // File APIs are not supported, e.g. IE
                ui.showImportRouteError(true);
            } else {
                var r = new FileReader();
                r.readAsText(fileTarget[0]);
                r.onload = function(e) {
                    var data = e.target.result;
                    //remove gpx: tags; Firefox cannot cope with that.
                    data = data.replace(/gpx:/g, '');
                    var track = map.parseStringToTrack(data);
                    if (!track) {
                        ui.showImportRouteError(true);
                    } else {
                        //add features to map
                        var newFeature = map.addTrackToMap(track);
                        // adds custom attribute to html element in order to remove it later on
                        fileTarget[1].writeAttribute("LeafletFeatureName", newFeature);
                    }
                };
            }
        } else {
            ui.showImportRouteError(true);
        }
    }
    /**
     * removes an uploaded track or route from the map
     * @param LeafletFeatureName: leaflet feature Id
     */
    function handleRemoveTrack(LeafletFeatureName) {
        //console.log(JSON.stringify(LeafletFeatureName));
        ui.handleResetRoute();
        map.clearMarkers(map.layerTrack, [LeafletFeatureName]);
    }
    /* *********************************************************************
     * MAP
     * *********************************************************************/
    /**
     * triggers an update of the cookies when the map changed
     * @param mapState: lon: lon-coordinate of the current position; lat: lat-coordinate; zoom: current zoom level; layer: active layer (and overlays)
     */
    function handleMapChanged(mapState) {
        //update cookies
        updateMapCookies(mapState.lon, mapState.lat, mapState.zoom);
    }
    /**
     * triggers an update of the cookies when the map changed
     * @param mapState: lon: lon-coordinate of the current position; lat: lat-coordinate; zoom: current zoom level; layer: active layer (and overlays)
     */
    function handleBaseMapChanged(mapState) {
        //update cookies
        updateBaseMapCookies(mapState.layer);
    }
    /**
     * highlights the correspoinding Ui element based on the given map feature/ marker, e.g. the corresponding POI description
     * @param markerId: LL feature id to highlight
     */
    function handleMarkerEmph(markerId) {
        ui.emphElement(markerId);
    }
    /**
     * un-highlights the correspoinding Ui element based on the given map feature/ marker, e.g. the corresponding POI description
     * @param markerId: LL feature id to deemphasize
     */
    function handleMarkerDeEmph(markerId) {
        ui.deEmphElement(markerId);
    }
    /**
     * highlights the corresponding map feature based on the given Ui element, e.g. the corresponding POI marker
     * @param atts: id: LL feature id of the element; layer: map layer the feature is located on
     */
    function handleElementEmph(atts) {
        var id = atts.id;
        var layer = atts.layer;
        //tell map to emph the element
        map.emphMarker(layer, id, true);
    }
    /**
     * un-highlights the corresponding map feature based on the given Ui element, e.g. the corresponding POI marker
     * @param atts: id: LL feature id of the element; layer: map layer the feature is located on
     */
    function handleElementDeEmph(atts) {
        var id = atts.id;
        var layer = atts.layer;
        //tell map to de-emph the element
        map.emphMarker(layer, id, false);
    }
    /* *********************************************************************
     * TMC Messages
     * *********************************************************************/
    /** 
     * initiates TMC service call
     * sets force update if timeout
     * clearInterval has to be called to remove any old timeouts
     */
    function loadTMC() {
        var url = generateUrl(namespaces.services.tmc);
        clearInterval(refreshIntervalIdTMC);
        compareBoundingBoxes(url, false);
        refreshIntervalIdTMC = setInterval(function() {
            compareBoundingBoxes(url, true);
        }, 300000);
    }
    /**
     * compares bounding boxes, if old bounding box does not contain new bounding
     * box, fire new request for tmc messages
     * @param url: url of tmc service
     * @param forceUpdate: when auto refreshed after 5 minutes, force update the tmc messages, otherwise proceed as usual
     */
    function compareBoundingBoxes(url, forceUpdate) {
        var tmcUrl = url + '&bbox=' + map.theMap.getBounds().getSouthWest().lng + ',' + map.theMap.getBounds().getSouthWest().lat + ',' + map.theMap.getBounds().getNorthEast().lng + ',' + map.theMap.getBounds().getNorthEast().lat;
        if (forceUpdate === true) {
            getTMC(tmcUrl);
        } else {
            if (!(map.previousBoundingbox.contains(map.theMap.getBounds()))) {
                map.previousBoundingbox = new L.latLngBounds(map.theMap.getBounds());
                getTMC(tmcUrl);
            }
        }
    }
    /**
     * fires xhr request and updates map tmc layer on success
     * @param url: url with specified boundingbox
     */
    function getTMC(url) {
        $.ajax({
            dataType: "json",
            url: url,
            success: function(data) {
                map.updateTmcInformation(data);
            },
        });
    }
    /* *********************************************************************
     * PREFERENCES, PERMALINK AND COOKIES
     * *********************************************************************/
    /**
     * updates internal preferences (language, distance unit, ...)
     * @param atts: key: id of the variable name; value: value that should be assigned to that variable
     * @param wpIndex: indicates position of waypoint
     */
    function handlePrefsChanged(atts) {
        var key = atts.key;
        var value = atts.value;
        preferences.updatePreferences(key, value);
    }
    /**
     * the user changed preferences in the option panel and wants to save the changes
     * @param atts: version: site version; language: site language; routingLanguage: language of routing instructions; distanceUnit: distance unit like m/km or yd/mi
     */
    function updateUserPreferences(atts) {
        if (preferences.version == atts.version && preferences.language == atts.language && preferences.routingLanguage == atts.routingLanguage && preferences.distanceUnit == atts.distanceUnit) {
            //nothing changed...
        } else {
            updateCookies(preferences.versionIdx, atts.version);
            updateCookies(preferences.languageIdx, atts.language);
            updateCookies(preferences.routingLanguageIdx, atts.routingLanguage);
            updateCookies(preferences.distanceUnitIdx, atts.distanceUnit);
            //reload page to apply changed preferences (e.g. other site language)
            preferences.reloadWithPerma();
        }
    }

    function handlePermalinkRequest(tgt) {
        preferences.generatePermalink(tgt);
    }
    /**
     * update the given preference parameter in the cookies. If no cookies exist, write new ones with current parameters
     * @param key: id of the variable name
     * @param value: value that should be assigned to that variable
     */
    function updateCookies(key, value) {
        if (!preferences.areCookiesAVailable()) {
            //TODO: no cookies found so far, we need to write all information
            // var lon = map.theMap.getCenter().lng;
            // var lat = map.theMap.getCenter().lat;
            // var zoom = map.theMap.getZoom();
            // var layer = map.serializeLayers();
            // preferences.writeMapCookies(lon, lat, zoom);
            // preferences.writeBaseMapCookie(layer);
            preferences.writePrefsCookies();
            //then write the requested data...
        }
        //there are cookies available (by now), only update the changed information
        preferences.updateCookies(key, value);
    }
    /**
     * map parameters are usually modified together. This is more efficient than calling updateCookies(key, val) three times.
     * @param lon: lon coordinate of current position
     * @param lat: lat coordinate of current position
     * @param zoom: current zoom level
     */
    function updateMapCookies(lon, lat, zoom) {
        if (preferences.areCookiesAVailable()) {
            preferences.writeMapCookies(lon, lat, zoom);
        } else {
            //write all information, not only map stuff
            updateCookies(null, null);
        }
    }
    /**
     * when basemap is changed update cookies
     * @param layer: active layer, including overlays (OL encode)
     */
    function updateBaseMapCookies(layer) {
        if (preferences.areCookiesAVailable()) {
            preferences.writeBaseMapCookie(layer);
        } else {
            //write all information, not only map stuff
            updateCookies(null, null);
        }
    }
    /* *********************************************************************
     * startup
     * *********************************************************************/
    /**
     * apply GET variables, read cookies or apply standard values to initialize the ORS page
     */
    function initializeOrs() {
        //apply GET variables and/or cookies and set the user's language,...
        var getVars = preferences.loadPreferencesOnStartup();
        var pos = getVars[preferences.getPrefName(preferences.positionIdx)];
        var zoom = getVars[preferences.getPrefName(preferences.zoomIdx)];
        var layer = getVars[preferences.getPrefName(preferences.layerIdx)];
        var waypoints = getVars[preferences.getPrefName(preferences.waypointIdx)];
        var routeOpt = getVars[preferences.getPrefName(preferences.routeOptionsIdx)];
        var routeOptType = getVars[preferences.getPrefName(preferences.routeOptionsTypesIdx)];
        var motorways = getVars[preferences.getPrefName(preferences.avoidHighwayIdx)];
        var tollways = getVars[preferences.getPrefName(preferences.avoidTollwayIdx)];
        var tunnels = getVars[preferences.getPrefName(preferences.avoidTunnelIdx)];
        var unpaved = getVars[preferences.getPrefName(preferences.avoidUnpavedIdx)];
        var paved = getVars[preferences.getPrefName(preferences.avoidPavedIdx)];
        var ferry = getVars[preferences.getPrefName(preferences.avoidFerryIdx)];
        var steps = getVars[preferences.getPrefName(preferences.avoidStepsIdx)];
        var avoidAreas = getVars[preferences.getPrefName(preferences.avoidAreasIdx)];
        var truck_length = getVars[preferences.getPrefName(preferences.value_lengthIdx)];
        var truck_height = getVars[preferences.getPrefName(preferences.value_heightIdx)];
        var truck_weight = getVars[preferences.getPrefName(preferences.value_weightIdx)];
        var truck_width = getVars[preferences.getPrefName(preferences.value_widthIdx)];
        var truck_axleload = getVars[preferences.getPrefName(preferences.value_axleloadIdx)];
        var surface = getVars[preferences.getPrefName(preferences.surfaceIdx)];
        var incline = getVars[preferences.getPrefName(preferences.inclineIdx)];
        var slopedCurb = getVars[preferences.getPrefName(preferences.slopedCurbIdx)];
        var trackType = getVars[preferences.getPrefName(preferences.trackTypeIdx)];
        var smoothness = getVars[preferences.getPrefName(preferences.smoothnessIdx)];
        var routeWeight = getVars[preferences.getPrefName(preferences.weightIdx)];
        var hazardous = getVars[preferences.getPrefName(preferences.hazardousIdx)];
        var fords = getVars[preferences.getPrefName(preferences.avoidFordsIdx)];
        var maxspeed = getVars[preferences.getPrefName(preferences.maxspeedIdx)];
        // either layer, pos or zoom is read, as soon as one is read the eventlistener on map
        // updates the other two and overwrites the cookie info
        pos = preferences.loadMapPosition(pos);
        if (pos && pos != 'null') {
            map.theMap.panTo(pos);
        } else {
            //position not set, use geolocation feature to determine position
            var locationSuccess = function(position) {
                var pos = L.latLng(position.coords.latitude, position.coords.longitude);
                map.theMap.panTo(pos);
            };
            geolocator.locate(locationSuccess, null, null);
        }
        zoom = preferences.loadMapZoom(zoom);
        if (zoom) {
            map.theMap.setZoom(zoom);
        }
        layer = preferences.loadMapLayer(layer);
        if (layer) {
            map.restoreLayerPrefs(layer);
        }
        // if routeOpt is not in getVars then use Car for init
        routeOpt = preferences.loadRouteOptions(routeOpt);
        if (routeOpt == undefined || routeOpt == null || routeOpt == 'undefined') {
            ui.setRouteOption(list.routePreferences.get('car'));
        } else {
            ui.setRouteOption(routeOpt);
        }
        routeOptType = preferences.loadRouteOptionsType(routeOptType);
        ui.setRouteOptionType(routeOptType);
        routeWeight = preferences.loadRouteWeight(routeWeight);
        ui.setRouteWeight(routeWeight);
        maxspeed = preferences.loadMaxspeed(maxspeed);
        ui.setMaxspeedParameter(maxspeed);
        var avSettings = preferences.loadAvoidables(motorways, tollways, unpaved, ferry, steps, fords, paved, tunnels);
        motorways = avSettings[0];
        tollways = avSettings[1];
        unpaved = avSettings[2];
        ferry = avSettings[3];
        steps = avSettings[4];
        fords = avSettings[5];
        paved = avSettings[6];
        tunnels = avSettings[7];
        ui.setAvoidables(motorways, tollways, unpaved, ferry, steps, fords, paved, tunnels);
        // get wheelchair parameters from getVars
        var wheelParameters = preferences.loadWheelParameters(surface, incline, slopedCurb, trackType, smoothness);
        if (wheelParameters.length > 0) {
            surface = wheelParameters[0];
            incline = wheelParameters[1];
            slopedCurb = wheelParameters[2];
            trackType = wheelParameters[3];
            smoothness = wheelParameters[4];
            ui.setWheelParameters(surface, incline, slopedCurb, trackType, smoothness);
        }
        //avoidAreas: array of Leaflet Polygon representing one avoid area each
        avoidAreas = preferences.loadAvoidAreas(avoidAreas);
        //apply avoid areas
        map.addAvoidAreas(avoidAreas);
        /* get and set truck parameters */
        var truckParameters = preferences.loadtruckParameters(truck_length, truck_height, truck_width, truck_weight, truck_axleload);
        if (truckParameters.length > 0) {
            truck_length = truckParameters[0];
            truck_height = truckParameters[1];
            truck_weight = truckParameters[2];
            truck_width = truckParameters[3];
            truck_axleload = truckParameters[4];
            ui.setTruckParameters(truck_length, truck_height, truck_weight, truck_width, truck_axleload);
        }
        /* get and set hazardous */
        hazardous = preferences.loadHazardous(hazardous);
        ui.setHazardousParameter(hazardous);
        //waypoints: array of Leaflet LatLng's representing one wayoint each
        waypoints = preferences.loadWaypoints(waypoints);
        if (waypoints && waypoints.length > 0) {
            for (var i = 0; i < waypoints.length; i++) {
                var type;
                if (waypoints[i].lat === 0 & waypoints[i].lng === 0) {
                    continue;
                } else if (i === 0) {
                    type = Waypoint.type.START;
                } else if (i == waypoints.length - 1) {
                    type = Waypoint.type.END;
                } else {
                    type = Waypoint.type.VIA;
                }
                handleAddWaypointByRightclick({
                    pos: waypoints[i],
                    type: type
                }, true);
            }
            if (waypoints.length >= 2) {
                handleRoutePresent();
            }
        }
        if (!preferences.areCookiesAVailable()) {
            ui.showNewToOrsPopup();
        }
        initMap = false;
        // set new bounding box after map and new bounding box are loaded from permalink
        map.previousBoundingbox = new L.latLngBounds(map.theMap.getBounds().getSouthWest(), map.theMap.getBounds().getNorthEast());
        // force tmc service once
        compareBoundingBoxes(generateUrl(namespaces.services.tmc), true);
        // this listener is added here, otherwise tmc service will be requested several times during map init
        map.theMap.on('moveend', map.emitloadTMC);
    }
    /**
     * apply selected site language, load dynamic menus, etc.
     */
    function loadDynamicUiData() {
        //load Ui elements with selected language
        uiLanguages.applyLanguage();
        //load dropdown menus, etc. in the correct language
        uiLanguages.loadPoiTypeData();
        uiLanguages.loadPreferencePopupData();
        uiLanguages.loadPoiDistanceUnitData();
        //hide or show Ui elements based on the version
        uiVersions.applyVersion(preferences.version);
        //in the user preferences popup, set appropriate element active
        ui.setUserPreferences(preferences.version, preferences.language, preferences.routingLanguage, preferences.distanceUnit);
    }
    /**
     * can be called to output debug information
     */
    function showDebugInfo() {
        console.log();
    }
    /* *********************************************************************
     * class-specific
     * *********************************************************************/
    /**
     * initialization
     */
    function initialize() {
        map = new Map('map');
        ui.register('ui:startDebug', showDebugInfo);
        //e.g. when viewing/hiding the sidebar
        ui.register('ui:mapPositionChanged', handleMapUpdate);
        //after zooming, switching layers,...
        map.register('map:changed', handleMapChanged);
        map.register('map:basemapChanged', handleBaseMapChanged);
        //when moving mouse over a marker
        map.register('map:markerEmph', handleMarkerEmph);
        map.register('map:markerDeEmph', handleMarkerDeEmph);
        //after change of user preferences
        ui.register('ui:prefsChanged', handlePrefsChanged);
        //modules
        ui.register('ui:emphElement', handleElementEmph);
        ui.register('ui:deEmphElement', handleElementDeEmph);
        ui.register('ui:searchWaypointRequest', handleWaypointRequest);
        ui.register('ui:addWaypoint', handleAddWaypoint);
        ui.register('ui:waypointResultClick', handleWaypointResultClick);
        map.register('map:addWaypoint', handleAddWaypointByRightclick);
        ui.register('ui:selectWaypointType', selectWaypointType);
        ui.register('ui:movedWaypoints', handleMovedWaypoints);
        ui.register('ui:removeWaypoint', handleRemoveWaypoint);
        ui.register('ui:searchAgainWaypoint', handleSearchAgainWaypoint);
        ui.register('ui:resetRoute', handleResetRoute);
        ui.register('ui:zoomToRouteInstruction', handleZoomToRouteInstruction);
        ui.register('ui:zoomToRouteCorner', handleZoomToRouteCorner);
        ui.register('ui:geolocationRequest', handleGeolocationRequest);
        ui.register('ui:searchAddressRequest', handleSearchAddressRequest);
        ui.register('ui:clearSearchAddressMarkers', handleClearSearchAddressMarkers);
        ui.register('ui:zoomToAddressResults', handleZoomToAddressResults);
        ui.register('ui:checkDistanceToRoute', handleCheckDistanceToRoute);
        ui.register('ui:searchPoiRequest', handleSearchPoiRequest);
        ui.register('ui:clearSearchPoiMarkers', handleClearSearchPoiMarkers);
        ui.register('ui:zoomToPoiResults', handleZoomToPoiResults);
        ui.register('ui:useAsWaypoint', handleUseAsWaypoint);
        ui.register('ui:zoomToMarker', handleZoomToMarker);
        map.register('map:waypointMoved', handleWaypointMoved);
        ui.register('ui:routingParamsChanged', handleRoutePresent);
        ui.register('ui:handleMoveUpWaypointClick', handleRoutePresent);
        ui.register('ui:zoomToRoute', handleZoomToRoute);
        map.register('map:errorsInAvoidAreas', avoidAreasError);
        map.register('map:avoidAreaChanged', handleAvoidAreaChanged);
        map.register('map:routingParamsChanged', handleRoutePresent);
        ui.register('ui:analyzeAccessibility', handleAnalyzeAccessibility);
        ui.register('ui:removeAccessibility', handleRemoveAccessibility);
        ui.register('ui:exportRouteGpx', handleExportRoute);
        ui.register('ui:uploadRoute', handleGpxRoute);
        ui.register('ui:uploadTrack', handleGpxTrack);
        ui.register('ui:removeTrack', handleRemoveTrack);
        ui.register('ui:saveUserPreferences', updateUserPreferences);
        ui.register('ui:generatePermalinkRequest', handlePermalinkRequest);
        ui.register('ui:clearFromGpx', handleRemoveTrack);
        initializeOrs();
        loadDynamicUiData();
    }
    Controller.prototype.initialize = initialize;
    Controller.prototype.loadTMC = loadTMC;
    Controller.prototype.compareBoundingBoxes = compareBoundingBoxes;
    return new Controller();
}(window));
window.onload = Controller.initialize;