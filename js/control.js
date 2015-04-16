var Controller = ( function(w) {'use strict';

		var $ = w.jQuery, ui = w.Ui, uiVersions = w.Versions, uiLanguages = w.Languages, waypoint = w.Waypoint, geolocator = w.Geolocator, searchAddress = w.SearchAddress, searchPoi = w.SearchPoi, route = w.Route, analyse = w.AccessibilityAnalysis, preferences = w.Preferences, openRouteService = w.OpenRouteService, Map = w.Map,
		//the map
		map,
		//Timeout for service responses
		SERVICE_TIMEOUT_INTERVAL = 10000,
		//timer
		timerRoute; //TODO more timers for various service calls

		function Controller() {
			//path to the proxy-script as workaround for JavaScript security errors
			OpenLayers.ProxyHost = "/cgi-bin/proxy.cgi?url=";

			//IE does not know console...
			if (!window.console) {
				window.console = {};
				window.console.log = function() {
				};
			}
		}

		/* *********************************************************************
		* GENERAL
		* *********************************************************************/

		/**
		 *called when sidebar toggles and the map area is resized
		 */
		function handleMapUpdate() {
			map.theMap.updateSize();
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
				map.clearMarkers(map.SEARCH, lastSearchResults);
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
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			results = results.responseXML ? results.responseXML : util.parseStringToDOM(results.responseText);

			//when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
			var responseError = util.getElementsByTagNameNS(results, namespaces.xls, 'ErrorList').length;
			if (parseInt(responseError) > 0) {
				//service response contains an error, switch to error handling function
				handleSearchWaypointFailure(wpIndex);
			} else {

				waypoint.decrRequestCounterWaypoint(wpIndex);
				if (waypoint.getRequestCounterWaypoint(wpIndex) == 0) {
					var listOfPoints = waypoint.parseResultsToPoints(results, wpIndex);

					ui.searchWaypointChangeToSearchingState(false, wpIndex);

					if (listOfPoints.length) {
						var listOfFeatures = map.addSearchAddressResultMarkers(listOfPoints, wpIndex);
						ui.updateSearchWaypointResultList(results, listOfFeatures, map.SEARCH, wpIndex);
					} else {
						ui.showSearchWaypointError(wpIndex)
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
			map.clearMarkers(map.SEARCH, searchIds);

			waypoint.setWaypoint(wpIndex, true);

			var position = map.convertFeatureIdToPositionString(waypointResultId, map.ROUTE_POINTS);
			map.zoomToMarker(util.convertPositionStringToLonLat(position), 14);
			ui.setWaypointFeatureId(wpIndex, waypointResultId, position, map.ROUTE_POINTS);

			//update preferences
			handleWaypointChanged(map.getWaypointsString());
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
			var position = map.convertFeatureIdToPositionString(newId, map.ROUTE_POINTS);
			ui.setWaypointFeatureId(index, newId, position, map.ROUTE_POINTS);
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
		 */
		function handleAddWaypointByRightclick(atts) {
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
				map.clearMarkers(map.ROUTE_POINTS, [featureId]);
			}

			//add the new marker
			var newFeatureId = map.addWaypointAtPos(util.convertPointForMap(pos), wpIndex, wpType);

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
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var addressResult = addressResult.responseXML ? addressResult.responseXML : util.parseStringToDOM(addressResult.responseText);

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
				waypoint.setWaypoint(wpIndex, true);

				ui.showSearchingAtWaypoint(wpIndex, false);
				var newIndex = ui.addWaypointResultByRightclick(addressResult, wpType, wpIndex);
				var position = map.convertFeatureIdToPositionString(featureId, map.ROUTE_POINTS);
				ui.setWaypointFeatureId(newIndex, featureId, position, map.ROUTE_POINTS);

				//update preferences
				handleWaypointChanged(map.getWaypointsString());

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
			var index1 = atts.id1;
			var index2 = atts.id2;

			//waypoint-internal:
			var set1 = waypoint.getWaypointSet(index1);
			var set2 = waypoint.getWaypointSet(index2);
			waypoint.setWaypoint(index1, set2);
			waypoint.setWaypoint(index2, set1);

			// map.switchMarkers(index1, index2);

			var type = selectWaypointType(index1);
			var ftId = ui.getFeatureIdOfWaypoint(index1);
			var newFtId = map.setWaypointType(ftId, type);
			var position = map.convertFeatureIdToPositionString(newFtId, map.ROUTE_POINTS);
			ui.setWaypointFeatureId(index1, newFtId, position, map.ROUTE_POINTS);

			var type = selectWaypointType(index2);
			var ftId = ui.getFeatureIdOfWaypoint(index2);
			newFtId = map.setWaypointType(ftId, type);
			var position = map.convertFeatureIdToPositionString(newFtId, map.ROUTE_POINTS);
			ui.setWaypointFeatureId(index2, newFtId, position, map.ROUTE_POINTS);

			//update preferences
			handleWaypointChanged(map.getWaypointsString(), true);
		}

		/**
		 * the user removed a waypoint. Internal variables are updated, waypoint types checked,...
		 * @param atts: wpIndex: index of the waypoint, featureId: id of the map feature of the waypoint
		 */
		function handleRemoveWaypoint(atts) {
			var idx = atts.wpIndex;
			var featureId = atts.featureId;

			//remove map feature of deleted wayoint
			map.clearMarkers(map.ROUTE_POINTS, [featureId]);

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
				var position = map.convertFeatureIdToPositionString(newId, map.ROUTE_POINTS);
				ui.setWaypointFeatureId(i, newId, position, map.ROUTE_POINTS);
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
				if (idx == 0) {
					ui.setMoveDownButton(idx, true);
					ui.setMoveUpButton(idx, false);
				}
			}

			//update preferences
			handleWaypointChanged(map.getWaypointsString());
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
			map.clearMarkers(waypointLayer, [waypointFeature]);

			//to re-view the search results of the waypoint search, the whole thing is re-calculated using existant functions

			//waypoint-internal
			waypoint.setWaypoint(wpIndex, false);

			//update preferences
			handleWaypointChanged(map.getWaypointsString());
		}

		/**
		 * the whole route and its waypoints are removed. Internal variables are updated
		 */
		function handleResetRoute() {
			//remove all waypoint markers
			map.clearMarkers(map.ROUTE_POINTS);

			for (var i = 0; i < waypoint.getNumWaypoints(); i++) {
				waypoint.removeWaypoint(i);
			}

			//update preferences
			handleWaypointChanged(null);
		}

		/**
		 * is called when one or more waypoints have changed. Updates internal variables (preferences).
		 * @param waypointStringList: string containing all waypoints
		 */
		function handleWaypointChanged(waypointStringList, doNotCalculateRoute) {
			handlePrefsChanged({
				key : preferences.waypointIdx,
				value : waypointStringList
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
			map.zoomToFeature(map.ROUTE_LINES, vectorId);
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
			var pos = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude);

			//add marker at current position
			var feature = map.addGeolocationResultMarker(pos);

			//show current position as address in the Ui pane
			geolocator.reverseGeolocate(pos, handleReverseGeolocationSuccess, handleGeolocateError, preferences.language, null, null, feature);
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
			ui.showCurrentLocation(result, feature.id, map.GEOLOCATION, feature.geometry);
		}

		/* *********************************************************************
		* SEARCH ADDRESS
		* *********************************************************************/

		/**
		 * parses the user input for the address search and calls the SearchAddress module to build a search request
		 * @param atts: address: address as text string the user wants to search for; lastSearchResults: string of OL feature ids for the last search results
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
		 * @param atts: query: the POI search query as string; nearRoute: true if a POI search along a given route should be performed; maxDist: maximum distance for POIs off the route; lastSearchResults: list of OL map feature ids of the last search
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
			if (index == 0) {
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
			geolocator.reverseGeolocate(util.convertPointForDisplay(position), reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, type, index, featureId, addWp);

			//markers of the search results will not be removed cause the search is still visible.
		}

		/**
		 * after a waypoint has been moved on the map, the address of the moved waypoint is updated (as well as other internal stuff)
		 * @param featureMoved: the map feature that has been moved
		 */
		function handleWaypointMoved(featureMoved) {
			var position = new OpenLayers.LonLat(featureMoved.geometry.x, featureMoved.geometry.y);
			var index = ui.getWaypiontIndexByFeatureId(featureMoved.id);
			var type = waypoint.determineWaypointType(index);
			geolocator.reverseGeolocate(util.convertPointForDisplay(position), reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, type, index, featureMoved.id, -1);
			ui.invalidateWaypointSearch(index);

			//update preferences
			handleWaypointChanged(map.getWaypointsString(), true);
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
				ui.startRouteCalculation();

				var routePoints = ui.getRoutePoints();
				for (var i = 0; i < routePoints.length; i++) {
					routePoints[i] = routePoints[i].split(' ');
					if (routePoints[i].length == 2) {
						routePoints[i] = new OpenLayers.LonLat(routePoints[i][0], routePoints[i][1]);
						routePoints[i] = util.convertPointForDisplay(routePoints[i]);
					}
				}

				var prefs = ui.getRoutePreferences();

				var truckParameters = preferences.loadtruckParameters();
				var truck_length = truckParameters[0];
				var truck_height = truckParameters[1];
				var truck_weight = truckParameters[2];
				var truck_width = truckParameters[3];

				ui.setTruckParameters(truck_length, truck_height, truck_weight, truck_width);

				var routePref = prefs[0];
				var avoidHighway = prefs[1][0];
				var avoidTollway = prefs[1][1];
				var avoidUnpavedRoads = prefs[1][2];
				var avoidFerry = prefs[1][3];
				var avoidAreas = map.getAvoidAreas();

				// check whether truck button is active and send extendedRoutePreferences, otherwise don't 
				if(prefs[3] == 'truck') {
					var extendedRoutePreferences = prefs[2];
				} 
				// check whether wheelchair button is active and send extendedRoutePreferences, otherwise don't
				else  if (prefs[3] == 'wheelchair') {
					var extendedRoutePreferences = prefs[4];
				}
				else {
					var extendedRoutePreferences = null;
				}

				route.calculate(routePoints, routeCalculationSuccess, routeCalculationError, preferences.routingLanguage, routePref, extendedRoutePreferences, avoidHighway, avoidTollway,avoidUnpavedRoads,avoidFerry, avoidAreas);
				//try to read a variable that is set after the service response was received. If this variable is not set after a while -> timeout.
				clearTimeout(timerRoute);

				// Took that out for now, seems not to work properly, needs more investigation (Oliver Roick, 21 Feb 2015)
				// timerRoute = setTimeout(function() {
				// 	if (!route.routePresent) {
				// 		//if no response has been received after the defined interval, show a timeout error.
				// 		ui.showServiceTimeoutPopup();  //TODO use for other service calls as well
				// 	}
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
			}
		}

		/**
		 * processes route results: triggers displaying the route on the map, showing instructions and a summary
		 * @param results: XML route service results
		 */
		function routeCalculationSuccess(results) {
			var zoomToMap = !route.routePresent;
			route.routePresent = true;
			ui.setRouteIsPresent(true);

			results = results.responseXML ? results.responseXML : util.parseStringToDOM(results.responseText);

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
				var routeLines = route.parseResultsToLineStrings(results, util.convertPointForMap);
				var routePoints = route.parseResultsToCornerPoints(results, util.convertPointForMap);
				var featureIds = map.updateRoute(routeLines, routePoints);

				var errors = route.hasRoutingErrors(results);

				if (!errors) {
					ui.updateRouteSummary(results);

					ui.updateRouteInstructions(results, featureIds, map.ROUTE_LINES);
					ui.endRouteCalculation();

					if (zoomToMap) map.zoomToRoute();
				} else {
					routeCalculationError();
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
		 * a tool for handling avoid areas has been selected/ deactivated.
		 * If the avoid area tools are active, all selectFeature-controls of the map layers have to be deactivated (otherwise these layers always stay on top and prevent the user from modifying his avoidAreas)
		 * Delegate the tool call to the map object.
		 * @param atts: toolType: either drawing, moving or deleting avoid areas ; activated: true, if the feature should be activated; false otherwise
		 */
		var activeAvoidAreaButtons = 0;
		function avoidAreaToolClicked(atts) {
			var toolTpye = atts.toolType;
			var activated = atts.activated;

			//if at least one button is active, the selectFeature control has to be deactivated
			if (activated) {
				activeAvoidAreaButtons++;
			} else {
				activeAvoidAreaButtons--;
			}
			if (activeAvoidAreaButtons > 0) {
				map.activateSelectControl(false);
			} else {
				map.activateSelectControl(true);
			}
			//actual avoid area handling is done in the map object
			map.avoidAreaTools(toolTpye, activated);
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
				key : preferences.avoidAreasIdx,
				value : avoidAreaString
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
				pos = util.convertPositionStringToLonLat(pos);
				pos = util.convertPointForDisplay(pos);
				var dist = atts.distance;
				
				var prefs = ui.getRoutePreferences();
				
				//aas setting route type
				var aasRoutePref = prefs[0];
				//aas setting isochrone method
				var aasMethod = null;// edit variable here
				//aas setting intervall in meters
				var aasIntervall = null;// edit variable here
				
				ui.showAccessibilityError(false);
				ui.showSearchingAtAccessibility(true);

				map.eraseAccessibilityFeatures();

				analyse.analyze(pos, dist, aasRoutePref, aasMethod, aasIntervall, accessibilitySuccessCallback, accessibilityFailureCallback);
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
			result = result.responseXML ? result.responseXML : util.parseStringToDOM(result.responseText);

			//when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
			var responseError = util.getElementsByTagNameNS(result, namespaces.xls, 'ErrorList').length;
			if (parseInt(responseError) > 0) {
				//service response contains an error
				accessibilityFailureCallback();
			} else {
				var bounds = analyse.parseResultsToBounds(result);
				if (bounds) {
					map.theMap.zoomToExtent(bounds, true);
					var polygon = analyse.parseResultsToPolygon(result);
					map.addAccessiblityPolygon(polygon);

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
			map.clearMarkers(map.ACCESSIBILITY);
		}

		/* *********************************************************************
		* EXPORT / IMPORT
		* *********************************************************************/

		/**
		 * extracts route information and displays the track in a new window formatted as GPX
		 */
		function handleExportRoute() {

			ui.showExportRouteError(false);

			var exportGPXElement = document.getElementById('export-gpx');

			var routeString = route.routeString;
			
			if (routeString) {
				// Create Base64 Object
				var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

				var newRouteString = Base64.encode(routeString);
				exportGPXElement.href = 'data:text/gpx+xml;base64,' + newRouteString;
			} else {
				//error, route does not exist. Nothing can be exported
				ui.showExportRouteError(true);
			}
			
		}

		/**
		 * uploads start and end point from a GPX file and calculates the route between these points
		 * required HTML5 file api
		 * @param file: the GPX file to upload
		 */
		var wp2;
		function handleUuploadRoute(file) {
			ui.showImportRouteError(false);
			if (file) {
				if (!window.FileReader) {
					// File APIs are not supported, e.g. IE
					ui.showImportRouteError(true);
				} else {
					var r = new FileReader();
					r.readAsText(file);

					r.onload = function(e) {
						var data = e.target.result;
						//remove gpx: tags; Firefox cannot cope with that.
						data = data.replace(/gpx:/g, '');
						var wps = map.parseStringToWaypoints(data);

						//add waypoints to route
						if (wps && wps.length == 2) {
							handleUseAsWaypoint(wps[0]);
							wp2 = wps[1];
							//the 2nd point cannot be appended immediately. we have to wait for the reverse geocoding request to be finished (and all other stuff executed in the callback function)
						} else {
							ui.showImportRouteError(true);
						}
					};
				}
			} else {
				ui.showImportRouteError(true);
			}
		}

		/**
		 * extracts the 2nd waypoint from the GPX file
		 */
		function uploadRouteTrigger2ndWaypoint() {
			if (wp2 != null) {
				handleUseAsWaypoint(wp2);
				//prevent infinite loop
				wp2 = null;
			}
		}

		/**
		 * uploads the track GPX file and displays it on the map. NO route re-calculation!
		 * required HTML5 file api
		 * @param file: the GPX file to upload
		 */
		function handleUploadTrack(file) {
			ui.showImportRouteError(false);
			//clean old track from map (at the moment only one track is supported)
			map.clearMarkers(map.TRACK);
			if (file) {
				if (!window.FileReader) {
					// File APIs are not supported, e.g. IE
					ui.showImportRouteError(true);
				} else {
					var r = new FileReader();
					r.readAsText(file);

					r.onload = function(e) {
						var data = e.target.result;
						//remove gpx: tags; Firefox cannot cope with that.
						data = data.replace(/gpx:/g, '');

						var track = map.parseStringToTrack(data);
						if (!track) {
							ui.showImportRouteError(true);
						} else {
							//add features to map
							map.addTrackToMap(track);
						}
					};
				}
			} else {
				ui.showImportRouteError(true);
			}
		}

		/**
		 * removes an uploaded track from the map
		 */
		function handleRemoveTrack() {
			map.clearMarkers(map.TRACK);
		}

		/* *********************************************************************
		* HEIGHT PROFILE
		* *********************************************************************/

		/**
		 * extracts information from the given file and shows the height profile
		 * @param file: the file with elevation information
		 */
		function handleUploadHeightProfile(file) {
			if (file) {
				if (!window.FileReader) {
					// File APIs are not supported, e.g. IE
					//todo: show error
				} else {
					var r = new FileReader();
					r.readAsText(file);

					r.onload = function(e) {
						var data = e.target.result;
						//calculate the height profile
						var eleArray = map.parseStringToElevationPoints(data);
						ui.showHeightProfile(eleArray);

						//show the track on the map
						//remove gpx: tags; Firefox cannot cope with that.
						data = data.replace(/gpx:/g, '');
						var track = map.parseStringToTrack(data);
						if (track) {
							//add features to map
							map.addTrackToMap(track);
						}
					};
				}
			} else {
				//todo: show error
			}
		}

		/**
		 * hovers the correspoinding position on the map/ the height profile
		 * @param atts: lon: lon coordinate, lat: lat coordinate
		 */
		function handleHeightProfileHover(atts) {
			map.hoverPosition(atts.lon, atts.lat);
		}

		/**
		 * removes an uploaded height profile track from the map
		 */
		function handleRemoveHeightProfile() {
			map.clearMarkers(map.TRACK);
			map.clearMarkers(map.HEIGHTS);
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
			updateMapCookies(mapState.lon, mapState.lat, mapState.zoom, mapState.layer);
		}

		/**
		 * highlights the correspoinding Ui element based on the given map feature/ marker, e.g. the corresponding POI description
		 * @param markerId: OL feature id to highlight
		 */
		function handleMarkerEmph(markerId) {
			ui.emphElement(markerId);
		}

		/**
		 * un-highlights the correspoinding Ui element based on the given map feature/ marker, e.g. the corresponding POI description
		 * @param markerId: OL feature id to deemphasize
		 */
		function handleMarkerDeEmph(markerId) {
			ui.deEmphElement(markerId);
		}

		/**
		 * highlights the corresponding map feature based on the given Ui element, e.g. the corresponding POI marker
		 * @param atts: id: OL feature id of the element; layer: map layer the feature is located on
		 */
		function handleElementEmph(atts) {
			var id = atts.id;
			var layer = atts.layer;

			//tell map to emph the element
			map.emphMarker(layer, id, true);
		}

		/**
		 * un-highlights the corresponding map feature based on the given Ui element, e.g. the corresponding POI marker
		 * @param atts: id: OL feature id of the element; layer: map layer the feature is located on
		 */
		function handleElementDeEmph(atts) {
			var id = atts.id;
			var layer = atts.layer;

			//tell map to de-emph the element
			map.emphMarker(layer, id, false);
		}

		/* *********************************************************************
		* PREFERENCES, PERMALINK AND COOKIES
		* *********************************************************************/

		/**
		 * updates internal preferences (language, distance unit, ...)
		 * @param atts: key: id of the variable name; value: value that should be assigned to that variable
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

		function handlePermalinkRequest() {
			preferences.openPermalink();
		}

		/**
		 * update the given preference parameter in the cookies. If no cookies exist, write new ones with current parameters
		 * @param key: id of the variable name
		 * @param value: value that should be assigned to that variable
		 */
		function updateCookies(key, value) {
			if (!preferences.areCookiesAVailable()) {
				//no cookies found so far, we need to write all information
				var lon = map.theMap.getCenter().lon;
				var lat = map.theMap.getCenter().lat;
				var zoom = map.theMap.getZoom();
				var layer = map.serializeLayers();

				preferences.writeMapCookies(lon, lat, zoom, layer);
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
		 * @param layer: active layer, including overlays (OL encode)
		 */
		function updateMapCookies(lon, lat, zoom, layer) {
			if (preferences.areCookiesAVailable()) {
				preferences.writeMapCookies(lon, lat, zoom, layer);
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
			var motorways = getVars[preferences.getPrefName(preferences.avoidHighwayIdx)];
			var tollways = getVars[preferences.getPrefName(preferences.avoidTollwayIdx)];
			var unpaved = getVars[preferences.getPrefName(preferences.avoidUnpavedIdx)];
			var ferry = getVars[preferences.getPrefName(preferences.avoidFerryIdx)];
			var avoidAreas = getVars[preferences.getPrefName(preferences.avoidAreasIdx)];
			
			var truck_length = getVars[preferences.getPrefName(preferences.truck_lengthIdx)];
			var truck_height = getVars[preferences.getPrefName(preferences.truck_heightIdx)];
			var truck_weight = getVars[preferences.getPrefName(preferences.truck_weightIdx)];
			var truck_width = getVars[preferences.getPrefName(preferences.truck_widthIdx)];
						
			var surface = getVars[preferences.getPrefName(preferences.surfaceIdx)];
			var incline = getVars[preferences.getPrefName(preferences.inclineIdx)];
			var slopedCurb = getVars[preferences.getPrefName(preferences.slopedCurbIdx)];

			pos = preferences.loadMapPosition(pos);
			if (pos && pos != 'null') {
				pos = util.convertPointForMap(pos);
				map.theMap.setCenter(pos);
			} else {
				//position not set, use geolocation feature to determine position
				var locationSuccess = function(position) {
					var pos = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude);
					pos = util.convertPointForMap(pos);
					map.theMap.moveTo(pos);
				};
				geolocator.locate(locationSuccess, null, null);
			}
			zoom = preferences.loadMapZoom(zoom);
			if (zoom) {
				map.theMap.zoomTo(zoom);
			}
			layer = preferences.loadMapLayer(layer);
			if (layer) {
				map.restoreLayerPrefs(layer);
			}

			//waypoints: array of OL.LonLat representing one wayoint each
			waypoints = preferences.loadWaypoints(waypoints);
			if (waypoints && waypoints.length > 0) {
				for (var i = 0; i < waypoints.length; i++) {
					var type = Waypoint.type.VIA;
					if (i == 0) {
						type = Waypoint.type.START;
					} else if (i == waypoints.length - 1) {
						type = Waypoint.type.END;
					}
					handleAddWaypointByRightclick({
						pos : waypoints[i],
						type : type
					})
				}
				if (waypoints.length >= 2) {
					handleRoutePresent();
				}
			}

			routeOpt = preferences.loadRouteOptions(routeOpt);
			ui.setRouteOption(routeOpt);
			var res = preferences.loadAvoidables(motorways, tollways, unpaved, ferry);
			motorways = res[1];
			tollways = res[2];
			unpaved = res[3];
			ferry = res[4];
			ui.setAvoidables(motorways, tollways, unpaved, ferry);
			
			var wheelParameters = preferences.loadWheelParameters(surface, incline, slopedCurb);
			surface = wheelParameters[0];
			incline = wheelParameters[1];
			slopedCurb = wheelParameters[2];
			ui.setWheelParameters(surface, incline, slopedCurb);
			
			// if (routeOpt == 'Wheelchair') {
				// $("#routeOptions").removeClass('collapsed');
				// $("#routeOptions").parent().get(0).querySelector('.collapsibleBody').show();
			// }


			//var avoidables = preferences.loadAvoidables(motorways, tollways, unpaved, ferry);
			//avoidAreas: array of OL.Polygon representing one avoid area each
			avoidAreas = preferences.loadAvoidAreas(avoidAreas);
			//apply avoid areas
			map.addAvoidAreas(avoidAreas);

			
			var truckParameters = preferences.loadtruckParameters();

			truck_length = truckParameters[0];
			truck_height = truckParameters[1];
			truck_weight = truckParameters[2];
			truck_width = truckParameters[3];
						 
			ui.setTruckParameters(truck_length, truck_height, truck_weight,truck_width);

			if (!preferences.areCookiesAVailable()) {
				ui.showNewToOrsPopup();
			}
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
			uiVersions.applyVersion(preferences.version)

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
			ui.register('ui:zoomToRoute', handleZoomToRoute);

			ui.register('ui:avoidAreaControls', avoidAreaToolClicked);
			map.register('map:errorsInAvoidAreas', avoidAreasError);
			map.register('map:avoidAreaChanged', handleAvoidAreaChanged);
			map.register('map:routingParamsChanged', handleRoutePresent);

			ui.register('ui:analyzeAccessibility', handleAnalyzeAccessibility);
			ui.register('ui:removeAccessibility', handleRemoveAccessibility);

			ui.register('ui:exportRouteGpx', handleExportRoute);
			ui.register('ui:uploadRoute', handleUuploadRoute);
			ui.register('control:reverseGeocodeCompleted', uploadRouteTrigger2ndWaypoint);
			ui.register('ui:uploadTrack', handleUploadTrack);
			ui.register('ui:removeTrack', handleRemoveTrack);

			ui.register('ui:uploadHeightProfile', handleUploadHeightProfile);
			ui.register('ui:heightProfileHover', handleHeightProfileHover);
			ui.register('ui:removeHeightProfileTrack', handleRemoveHeightProfile);

			ui.register('ui:saveUserPreferences', updateUserPreferences);
			ui.register('ui:openPermalinkRequest', handlePermalinkRequest);

			initializeOrs();
			loadDynamicUiData();
		}


		Controller.prototype.initialize = initialize;

		return new Controller();
	}(window));

window.onload = Controller.initialize;
