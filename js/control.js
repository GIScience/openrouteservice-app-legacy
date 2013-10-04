var Controller = ( function(w) {'use strict';

		var $ = w.jQuery, ui = w.Ui, waypoint = w.Waypoint, geolocator = w.Geolocator, searchAddress = w.SearchAddress, searchPoi = w.SearchPoi, route = w.Route, analyse = w.AccessibilityAnalysis, preferences = w.Preferences, openRouteService = w.OpenRouteService, Map = w.Map,
		//the map
		map;

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
		 */
		function handleSearchWaypointResults(results, wpIndex) {
			waypoint.decrRequestCounterWaypoint(wpIndex);
			if (waypoint.getRequestCounterWaypoint(wpIndex) == 0) {
				var listOfPoints = waypoint.parseResultsToPoints(results, wpIndex);

				ui.searchWaypointChangeToSearchingState(false, wpIndex);

				var listOfFeatures = map.addSearchAddressResultMarkers(listOfPoints, wpIndex);
				ui.updateSearchWaypointResultList(results, listOfFeatures, map.SEARCH, wpIndex);
			}
		}

		/**
		 * calls the UI to show a search error
		 */
		function handleSearchWaypointFailure(wpIndex) {
			waypoint.decrRequestCounterWaypoint(wpIndex);
			if (waypoint.getRequestCounterWaypoint(wpIndex) == 0) {
				ui.searchWaypointChangeToSearchingState(false, wpIndex);
				ui.showSearchWaypointError();
			}
		}

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

			handleRoutePresent();

			var position = map.convertFeatureIdToPositionString(waypointResultId, map.ROUTE_POINTS);
			ui.setWaypointFeatureId(wpIndex, waypointResultId, position, map.ROUTE_POINTS);

			//update preferences
			handleWaypointChanged(map.getWaypointsString());
		}

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
		 */
		function selectWaypointType(wpIndex) {
			var type = waypoint.determineWaypointType(wpIndex);
			ui.setWaypointType(wpIndex, type);
			return type;
		}

		/**
		 * what happens after the user sets a waypoint by clicking on the map saying "add waypoint..."
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

		function reverseGeocodeSuccess(addressResult, wpType, wpIndex, featureId, addWaypointAt) {
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

			//do we need to re-calculate the route?
			handleRoutePresent();

			//update preferences
			handleWaypointChanged(map.getWaypointsString());
		}

		function reverseGeocodeFailure() {
			//TODO implement
		}

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
			handleWaypointChanged(map.getWaypointsString());
		}

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
			handleRoutePresent();

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

		function handleResetRoute() {
			//remove all waypoint markers
			map.clearMarkers(map.ROUTE_POINTS);

			for (var i = 0; i < waypoint.getNumWaypoints(); i++) {
				waypoint.removeWaypoint(i);
			}

			handleRoutePresent();

			//update preferences
			handleWaypointChanged(null);
		}

		function handleWaypointChanged(waypointStringList) {
			handlePrefsChanged({
				key : preferences.waypointIdx,
				value : waypointStringList
			});
		}

		/* *********************************************************************
		 * GEOLOCATION
		 * *********************************************************************/

		function handleGeolocationRequest() {
			geolocator.locate(handleGeolocateSuccess, handleGeolocateError, handleGeolocateNoSupport, preferences.language);
		}

		/**
		 * [handleGeolocateSuccess description]
		 * @param  {[type]} position [description]
		 * @return {[type]}          [description]
		 */
		function handleGeolocateSuccess(position) {
			console.log("geolocation success")
			//TODO handleGeolocateSuccess: implement/ test
			console.log(position.coords);
			var pos = new OpenLayers.LonLat(position.coords.latitude, position.coords.longitude);
			var pos = util.convertPointForMap(pos);
			map.theMap.moveTo(pos);
			geolocator.reverseGeolocate(position, handleReverseGeolocationSuccess, handleReverseGeolocationFailure, preferences.language);
		}

		/**
		 * [handleGeolocateError description]
		 * @param  {[type]} error [description]
		 * @return {[type]}       [description]
		 */
		function handleGeolocateError(error) {
			switch (error.code) {
				case error.UNKNOWN_ERROR:
					ui.stopGeolocation('The location acquisition process failed');
					break;
				case error.PERMISSION_DENIED:
					ui.stopGeolocation();
					break;
				case error.POSITION_UNAVAILABLE:
					ui.stopGeolocation('The position of the device could not be determined. One or more of the location providers used in the location acquisition process reported an internal error that caused the process to fail entirely.');
					break;
				case error.TIMEOUT:
					console.log("timeout in geoloc.")
					ui.stopGeolocation('The location acquisition timed out');
					break;
			}
		}

		/**
		 * [handleGeolocateNoSupport description]
		 */
		function handleGeolocateNoSupport() {
			ui.stopGeolocation('Geolocation API is not supported by your browser.');
		}

		function handleReverseGeolocationSuccess(result) {
			ui.showCurrentLocation(result);
		}

		function handleReverseGeolocationFailure() {
			ui.stopGeolocation("Your current location could not be determined.");
		}

		/* *********************************************************************
		* SEARCH ADDRESS
		* *********************************************************************/

		/**
		 * parses the user input for the address search and calls the SearchAddress module to build a search request
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
		 */
		function handleSearchAddressResults(results) {
			searchAddress.requestCounter--;
			if (searchAddress.requestCounter == 0) {
				var listOfPoints = searchAddress.parseResultsToPoints(results);

				ui.searchAddressChangeToSearchingState(false);

				var listOfFeatures = map.addSearchAddressResultMarkers(listOfPoints);
				ui.updateSearchAddressResultList(results, listOfFeatures, map.SEARCH);
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
		 * remove old address markers from the map when starting a new address search
		 */
		function handleClearSearchAddressMarkers() {
			map.clearMarkers(map.SEARCH);
		}

		function handleZoomToAddressResults() {
			map.zoomToAddressResults();
		}

		/* *********************************************************************
		* SEARCH POI
		* *********************************************************************/

		/**
		 * check if the given distance is suitable for POI search near route
		 * maximum distance supported by the service is 5000 meters.
		 */
		function handleCheckDistanceToRoute(atts) {
			var dist = util.convertDistToMeters(parseInt(atts.dist), atts.unit);
			ui.showSearchPoiDistUnitError(dist > 5000);
		}

		/**
		 * parses the user input for the POI search and calls the SearchPoi module to build a search request
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
		 */
		function handleSearchPoiResults(results) {
			searchPoi.requestCounter--;
			if (searchPoi.requestCounter == 0) {
				var listOfPoints = searchPoi.parseResultsToPoints(results);

				ui.searchPoiChangeToSearchingState(false);

				var listOfFeatures = map.addSearchPoiResultMarkers(listOfPoints);
				ui.updateSearchPoiResultList(results, listOfFeatures, map.POI);
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
		 * remove old POI markers from the map when starting a new POI search
		 */
		function handleClearSearchPoiMarkers() {
			map.clearMarkers(map.POI);
		}

		function handleZoomToPoiResults() {
			map.zoomToPoiResults();
		}

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
		 * add a search result (address, POI) as a waypoint to the current route
		 * @param markerId: id of the marker to use as waypoint
		 */
		function handleUseAsWaypoint(atts) {
			var id = atts.id;
			var position = util.convertPositionStringToLonLat(atts.position);

			//use the next unset waypoint for the new waypoint (append one if no unset wp exists) (some lines below)
			var index = waypoint.getNextUnsetWaypoint();

			var type;
			if (index == 0) {
				type = waypoint.type.START;
			} else if (index >= waypoint.getNumWaypoints() - 1) {
				type = waypoint.type.END;
			} else {
				type = waypoint.type.VIA;
			}

			var addWp = -1;
			if (index < 0) {
				//no unset wayoint left -> add a new one (as VIA)
				// waypoint.addWaypoint(); <- this is called by ui.AddWaypointAfter(...), not necessary here.
				addWp = waypoint.getNumWaypoints() - 1;
				index = addWp;
			}

			//use position to add the waypoint
			var featureId = map.addWaypointAtPos(position, index, type);
			geolocator.reverseGeolocate(util.convertPointForDisplay(position), reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, type, index, featureId, addWp);

			//markers of the search results will not be removed cause the search is still visible.
		}

		function handleWaypointMoved(featureMoved) {
			var position = new OpenLayers.LonLat(featureMoved.geometry.x, featureMoved.geometry.y);
			var index = ui.getWaypiontIndexByFeatureId(featureMoved.id);
			var type = waypoint.determineWaypointType(index);
			geolocator.reverseGeolocate(util.convertPointForDisplay(position), reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, type, index, featureMoved.id, -1);
			ui.invalidateWaypointSearch(index);

			//update preferences
			handleWaypointChanged(map.getWaypointsString());
		}

		/* *********************************************************************
		* ROUTE
		* *********************************************************************/

		/**
		 *if there are at least two waypoint set, a route can be calculated and displayed
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
				var routePref = prefs[0];
				var avoidHighway = prefs[1][0];
				var avoidTollway = prefs[1][1];
				var avoidAreas = map.getAvoidAreas();

				route.calculate(routePoints, routeCalculationSuccess, routeCalculationError, preferences.routingLanguage, routePref, avoidHighway, avoidTollway, avoidAreas);
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

		function routeCalculationSuccess(results) {
			route.routePresent = true;
			ui.setRouteIsPresent(true);

			results = results.responseXML ? results.responseXML : util.parseStringToDOM(results.responseText);

			// each route instruction has a part of this lineString as geometry for this instruction
			var routeLines = route.parseResultsToLineStrings(results, util.convertPointForMap);
			var routePoints = route.parseResultsToCornerPoints(results, util.convertPointForMap);
			var featureIds = map.updateRoute(routeLines, routePoints);

			var errors = route.hasRoutingErrors(results);

			if (!errors) {
				ui.updateRouteSummary(results);

				ui.updateRouteInstructions(results, featureIds, map.ROUTE_LINES);
				ui.endRouteCalculation();

				map.zoomToRoute();
			} else {
				routeCalculationError();
			}
		}

		function routeCalculationError() {
			ui.endRouteCalculation();
			ui.showRoutingError();
			ui.hideRouteSummary();
			ui.hideRouteInstructions();
		}

		function handleZoomToRoute() {
			map.zoomToRoute();
		}

		/**
		 * a tool for handling avoid areas has been selected/ deactivated.
		 * If the avoid area tools are active, all selectFeature-controls of the map layers have to be deactivated (otherwise these layers always stay on top and prevent the user from modifying his avoidAreas)
		 * Delegate the tool call to the map object.
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
		 */
		function avoidAreasError(errorous) {
			ui.showAvoidAreasError(errorous);
		}

		/* *********************************************************************
		 * ACCESSIBILITY ANALYSIS
		 * *********************************************************************/

		function handleAnalyzeAccessibility(atts) {
			var pos = atts.position;
			if (pos) {
				//assuming we have a position set...
				pos = util.convertPositionStringToLonLat(pos);
				pos = util.convertPointForDisplay(pos);
				var dist = atts.distance;

				ui.showAccessibilityError(false);
				ui.showSearchingAtAccessibility(true);

				map.eraseAccessibilityFeatures();

				analyse.analyze(pos, dist, accessibilitySuccessCallback, accessibilityFailureCallback);
			} else {
				//no position, no analyse!
				ui.showAccessibilityError(true);
			}

		}

		function accessibilitySuccessCallback(result) {
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

		function accessibilityFailureCallback() {
			ui.showAccessibilityError(true);
		}

		function handleAvoidAreaChanged(avoidAreaString) {
			handlePrefsChanged({
				key : preferences.avoidAreasIdx,
				value : avoidAreaString
			});
		}

		/* *********************************************************************
		 * MAP
		 * *********************************************************************/

		function handleMapChanged(mapState) {
			//update cookies
			updateMapCookies(mapState.lon, mapState.lat, mapState.zoom, mapState.layer);
		}

		function handleMarkerEmph(markerId) {
			ui.emphElement(markerId);
		}

		function handleMarkerDeEmph(markerId) {
			ui.deEmphElement(markerId);
		}

		function handleElementEmph(atts) {
			var id = atts.id;
			var layer = atts.layer;

			//tell map to emph the element
			map.emphMarker(layer, id, true);
		}

		function handleElementDeEmph(atts) {
			var id = atts.id;
			var layer = atts.layer;

			//tell map to de-emph the element
			map.emphMarker(layer, id, false);
		}

		/* *********************************************************************
		 * PREFERENCES, PERMALINK AND COOKIES
		 * *********************************************************************/

		function handlePrefsChanged(atts) {
			var key = atts.key;
			var value = atts.value;
			preferences.updatePreferences(key, value);
		}

		/**
		 * the user changed preferences in the option panel and wants to save the changes
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
				handlePermalinkRequest();
			}
		}

		function handlePermalinkRequest() {
			preferences.openPermalink();
		}

		/**
		 * update the given preference parameter in the cookies. If no cookies exist, write new ones with current parameters
		 */
		function updateCookies(key, value) {
			if (preferences.areCookiesAVailable()) {
				//there are cookies available, only update the changed information
				preferences.updateCookies(key, value);
			} else {
				//no cookies found so far, we need to write all information
				var lon = map.theMap.getCenter().lon;
				var lat = map.theMap.getCenter().lat;
				var zoom = map.theMap.getZoom();
				var layer = map.serializeLayers();

				preferences.writeMapCookies(lon, lat, zoom, layer);
				preferences.writePrefsCookies();
			}
		}

		/**
		 * map parameters are usually modified together. This is more efficient than calling updateCookies(key, val) three times.
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
			var avoidAreas = getVars[preferences.getPrefName(preferences.avoidAreasIdx)];

			pos = preferences.loadMapPosition(pos);
			if (pos) {
				pos = util.convertPointForMap(pos);
				map.theMap.setCenter(pos);
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
			var res = preferences.loadAvoidables(motorways, tollways);
			motorways = res[0];
			tollways = res[1];
			ui.setAvoidables(motorways, tollways);

			var avoidables = preferences.loadAvoidables(motorways, tollways);
			//avoidAreas: array of OL.Polygon representing one avoid area each
			avoidAreas = preferences.loadAvoidAreas(avoidAreas);
			//apply avoid areas
			map.addAvoidAreas(avoidAreas);

			if (!preferences.areCookiesAVailable()) {
				ui.showNewToOrsPopup();
			}

			ui.setUserPreferences(preferences.version, preferences.language, preferences.routingLanguage, preferences.distanceUnit);
		}

		function showDebugInfo() {
			console.log(waypoint.getNumWaypoints());
			console.log(waypoint.getNextUnsetWaypoint());
			console.log(waypoint.getDebugInfo())
		}

		/* *********************************************************************
		* class-specific
		* *********************************************************************/
		/**
		 * [initialize description]
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

			ui.register('ui:saveUserPreferences', updateUserPreferences);
			ui.register('ui:openPermalinkRequest', handlePermalinkRequest);

			initializeOrs();
		}


		Controller.prototype.initialize = initialize;

		return new Controller();
	}(window));

window.onload = Controller.initialize;
