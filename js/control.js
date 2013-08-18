var Controller = ( function(w) {'use strict';

		var $ = w.jQuery, ui = w.Ui, waypoint = w.Waypoint, geolocator = w.Geolocator, searchAddress = w.SearchAddress, searchPoi = w.SearchPoi, perma = w.Permalink, preferences = w.Preferences, openRouteService = w.OpenRouteService, Map = w.Map,
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

			map.clearMarkers(map.SEARCH, atts.searchIds);

			waypoint.requestCounterWaypoints[atts.wpIndex]++;
			waypoint.find(atts.query, handleSearchWaypointResults, handleSearchWaypointFailure, atts.wpIndex, preferences.language);
		}

		/**
		 * forwards the waypoint search results to the Ui to display the addresses and to the map in order to add markers.
		 */
		function handleSearchWaypointResults(results, wpIndex) {
			waypoint.requestCounterWaypoints[wpIndex]--;
			if (waypoint.requestCounterWaypoints[wpIndex] == 0) {
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
			waypoint.requestCounterWaypoints[wpIndex]--;
			if (waypoint.requestCounterWaypoints[wpIndex] == 0) {
				ui.searchWaypointChangeToSearchingState(false, wpIndex);
				ui.showSearchWaypointError();
			}
		}

		// /**
		// * remove old waypoint markers from the map when starting a new waypoint search
		// */
		// function handleClearSearchWaypointMarkers(searchIds) {
		// map.clearMarkers(map.SEARCH, searchIds);
		// }

		function handleWaypointResultClick(atts) {
			var wpIndex = atts.wpIndex;
			var featureId = atts.featureId;
			var searchIds = atts.searchIds;
			searchIds = searchIds.split(' ');

			var type = selectWaypointType(wpIndex);
			var waypointResultId = map.addWaypointMarker(wpIndex, featureId, type);
			map.clearMarkers(map.SEARCH, searchIds);

			//adapt the next unset waypoint
			if (waypoint.nextUnsetWaypoint == wpIndex) {
				waypoint.nextUnsetWaypoint++;
			}
			//else: user sets e.g. waypoint 2 while waypoint 1 is still empty

			ui.setWaypointFeatureId(wpIndex, waypointResultId, map.ROUTE_POINTS);
		}

		function handleAddWaypoint() {
			waypoint.numWaypoints++;
			waypoint.requestCounterWaypoints.push(0);

			//re-calculate type of last (now next-to-last) waypoint
			var index = waypoint.numWaypoints - 2;
			var type = waypoint.determineWaypointType(index);
			ui.setWaypointType(index, type);

			var featureId = ui.getFeatureIdOfWaypoint(index);
			var newId = map.setWaypointType(featureId, type);
			ui.setWaypointFeatureId(index, newId, map.ROUTE_POINTS);
		}

		/**
		 * mark the given waypoint either as start, via or end according to the waypoint's position in the route
		 */
		function selectWaypointType(wpIndex) {
			var type = waypoint.determineWaypointType(wpIndex);
			ui.setWaypointType(wpIndex, type);
			map.setWaypointMarker(wpIndex, type);
			return type;
		}

		/**
		 * what happens after the user sets a waypoint by clicking on the map saying "add waypoint..."
		 */
		function handleAddWaypointByRightclick(atts) {
			var pos = atts.pos;
			var wpType = atts.type;

			//index of the waypoint to set (start at the beginning, end at the end, via in the middle)
			var wpIndex = 0;
			//if END: use index of last waypoint
			wpIndex = wpType == Waypoint.type.END ? waypoint.numWaypoints - 1 : wpIndex;
			//if VIA: use index of prior to last waypoint, insert the new via point after this element
			wpIndex = wpType == Waypoint.type.VIA ? waypoint.numWaypoints - 2 : wpIndex;

			//remove old waypoint marker (if exists)
			if (wpType != Waypoint.type.VIA) {
				//if we have a new VIA point, we create a new waypoint, i.e. there can't be any markers yet
				var featureId = ui.getFeatureIdOfWaypoint(wpIndex);
				if (featureId) {
					//address has been set yet
					map.clearMarkers(map.ROUTE_POINTS, [featureId]);
				}
			}

			if (wpType == Waypoint.type.VIA) {
				//add the marker with the NEW index (does not exist yet, will be generated in the successCallback function) on the map
				var featureId = map.addWaypointAtPos(map.convertPointForMap(pos), wpIndex + 1, wpType);
			} else {
				//add waypoint marker at given pos
				var featureId = map.addWaypointAtPos(map.convertPointForMap(pos), wpIndex, wpType);
			}
			//determine address for given pos
			geolocator.reverseGeolocate(pos, reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, wpType, wpIndex, featureId);
		}

		function reverseGeocodeSuccess(addressResult, wpType, wpIndex, featureId) {
			var newIndex = ui.addWaypointResultByRightclick(addressResult, wpType, wpIndex, waypoint.numWaypoints);
			ui.setWaypointFeatureId(newIndex, featureId, map.ROUTE_POINTS);

			//adapt the next unset waypoint
			if (waypoint.nextUnsetWaypoint == wpIndex) {
				waypoint.nextUnsetWaypoint++;
			}
			//else: user sets e.g. waypoint 2 while waypoint 1 is still empty
		}

		function reverseGeocodeFailure() {
			//TODO implement
		}

		function handleMovedWaypoints(atts) {
			var index1 = atts.id1;
			var index2 = atts.id2;
			// map.switchMarkers(index1, index2);

			var type = selectWaypointType(index1);
			var ftId = ui.getFeatureIdOfWaypoint(index1);
			var newFtId = map.setWaypointType(ftId, type);
			ui.setWaypointFeatureId(index1, newFtId, map.ROUTE_POINTS);

			var type = selectWaypointType(index2);
			var ftId = ui.getFeatureIdOfWaypoint(index2);
			newFtId = map.setWaypointType(ftId, type);
			ui.setWaypointFeatureId(index2, newFtId, map.ROUTE_POINTS);

		}

		function handleRemoveWaypoint(atts) {
			var idx = atts.wpIndex;
			var featureId = atts.featureId;

			//remove map feature of deleted wayoint
			map.clearMarkers(map.ROUTE_POINTS, [featureId]);

			if (waypoint.nextUnsetWaypoint > idx) {
				//we remove one waypoint in the line -> the index of the next unset waypoint gets smaller
				waypoint.nextUnsetWaypoint--;
			}
			waypoint.numWaypoints--;

			//re-calculate the waypoint types
			for (var i = 0; i < waypoint.numWaypoints; i++) {
				var type = waypoint.determineWaypointType(i);
				ui.setWaypointType(i, type);

				featureId = ui.getFeatureIdOfWaypoint(i);
				var newId = map.setWaypointType(featureId, type);
				ui.setWaypointFeatureId(i, newId, map.ROUTE_POINTS);
			}

			//decide about which buttons to show
			if (idx > 0) {
				//look at previous waypoint. If this is the last waypoint, do not show the move down button
				if ((idx - 1) == (waypoint.numWaypoints - 1)) {
					ui.setMoveDownButton(idx - 1, false);
					ui.setMoveUpButton(idx - 1, true);
				}
			}
			if (idx < (waypoint.numWaypoints - 1)) {
				//look at the next waypoint. If this is the first waypoint, do not show the move up button
				//because we removed one waypoint, the successor will have now an ID of idx
				if (idx == 0) {
					ui.setMoveDownButton(idx, true);
					ui.setMoveUpButton(idx, false);
				}
			}
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
			var pos = map.convertPointForMap(pos);
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
		function handleSearchAddressRequest(address) {
			ui.searchAddressChangeToSearchingState(true);

			map.clearMarkers(map.SEARCH);

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
		 * POI search along a route is only possible if there exists a route.
		 * This checks if there is a route available
		 */
		function handleCheckRouteIsPresent() {
			//TODO required for POI search
			var routeIsPresent = false;
			ui.setRouteIsPresent(routeIsPresent);
		}

		/**
		 * parses the user input for the POI search and calls the SearchPoi module to build a search request
		 */
		function handleSearchPoiRequest(atts) {
			var poi = atts.query;
			var searchNearRoute = atts.nearRoute;
			var maxDist = atts.maxDist;
			var distanceUnit = atts.distUnit;

			ui.searchPoiChangeToSearchingState(true);

			map.clearMarkers(map.POI);

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
			searchPoi.find(poi, refPoint, maxDist, handleSearchPoiResults, handleSearchPoiFailure, preferences.language);
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

			//use the next unset waypoint for the new waypoint (append one if no unset wp exists)
			var index = waypoint.nextUnsetWaypoint;

			var type;
			if (index == 0) {
				type = waypoint.type.START;
			} else if (index >= waypoint.numWaypoints - 1) {
				type = waypoint.type.END;
			} else {
				type = waypoint.type.VIA;
			}

			//use position to add the waypoint
			map.addWaypointAtPos(position, index, type);
			geolocator.reverseGeolocate(map.convertPointForDisplay(position), reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, type, index);

			//markers of the search results will not be removed cause the search is still visible.
		}

		/* *********************************************************************
		 * PERMALINK
		 * *********************************************************************/

		function handlePermalinkRequest() {
			perma.openPerma();
		}

		/* *********************************************************************
		 * MAP
		 * *********************************************************************/

		function handleMapChanged(mapState) {
			//TODO fill variables
			// var waypoints = this.serializeWaypoints();
			// var routeOpt = this.routeOptions.getRoutePreference();
			// var motorways = this.routeOptions.getAvoidMotorways();
			// var tollways = this.routeOptions.getAvoidTollways();
			// var avoidAreas = this.routeOptions.getAvoidAreasString();

			//update the permalink
			perma.update(mapState.lon, mapState.lat, mapState.zoom, mapState.layer);
			//, waypoints, routeOpt, motorways, tollways, avoidAreas);

			//update cookies
			preferences.writeMapCookies(mapState.lon, mapState.lat, mapState.zoom, mapState.layer);
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
		 * PREFERENCES
		 * *********************************************************************/

		function handlePrefsChanged(prefsState) {
			//TODO handlePrefsChanged: implement
			//update cookies
			preferences.writeMapCookies(prefsState.language, prefsState.distanceUnit, prefsState.version);
		}

		/* *********************************************************************
		 * startup
		 * *********************************************************************/

		function initializeOrs() {
			//apply GET variables and/or cookies and set the user's language,...
			var getVars = preferences.loadPreferencesOnStartup();

			var lon = getVars['lon'];
			var lat = getVars['lat'];
			var zoom = getVars['zoom'];
			var layer = getVars['layers'];
			var waypoints = getVars['waypoints'];
			var routeOpt = getVars['routeOpt'];
			var motorways = getVars['motorways'];
			var tollways = getVars['tollways'];
			var avoidAreas = getVars['avoidAreas'];

			var pos = preferences.loadMapPosition(lon, lat);
			if (pos) {
				pos = map.convertPointForMap(pos);
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
			waypoints = preferences.loadWaypoints(waypoints);
			//TODO how to apply waypoints to route

			//TODO how to handle route options
			preferences.loadRouteOptions(routeOpt, motorways, tollways, avoidAreas);

			if (!preferences.areCookiesAVailable()) {
				ui.showNewToOrsPopup();
			}
		}

		/* *********************************************************************
		* class-specific
		* *********************************************************************/
		/**
		 * [initialize description]
		 */
		function initialize() {
			map = new Map('map');

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
			// ui.register('ui:clearSearchWaypointMarkers', handleClearSearchWaypointMarkers);
			ui.register('ui:addWaypoint', handleAddWaypoint);
			ui.register('ui:waypointResultClick', handleWaypointResultClick);
			map.register('map:addWaypoint', handleAddWaypointByRightclick);
			ui.register('ui:selectWaypointType', selectWaypointType);
			ui.register('ui:movedWaypoints', handleMovedWaypoints);
			ui.register('ui:removeWaypoint', handleRemoveWaypoint);

			ui.register('ui:geolocationRequest', handleGeolocationRequest);

			ui.register('ui:searchAddressRequest', handleSearchAddressRequest);
			// ui.register('ui:emphasizeSearchAddressMarker', handleEmphasizeSearchAddressMarker);
			// ui.register('ui:deEmphasizeSearchAddressMarker', handleDeEmphasizeSearchAddressMarker);
			ui.register('ui:clearSearchAddressMarkers', handleClearSearchAddressMarkers);
			ui.register('ui:zoomToAddressResults', handleZoomToAddressResults);

			ui.register('ui:checkDistanceToRoute', handleCheckDistanceToRoute);
			ui.register('ui:searchPoiRequest', handleSearchPoiRequest);
			// ui.register('ui:emphasizeSearchPoiMarker', handleEmphasizeSearchPoiMarker);
			// ui.register('ui:deEmphasizeSearchPoiMarker', handleDeEmphasizeSearchPoiMarker);
			ui.register('ui:clearSearchPoiMarkers', handleClearSearchPoiMarkers);
			ui.register('ui:zoomToPoiResults', handleZoomToPoiResults);

			ui.register('ui:useAsWaypoint', handleUseAsWaypoint);
			ui.register('ui:zoomToMarker', handleZoomToMarker);

			ui.register('ui:openPermalinkRequest', handlePermalinkRequest);

			initializeOrs();
		}


		Controller.prototype.initialize = initialize;

		return new Controller();
	}(window));

window.onload = Controller.initialize;
