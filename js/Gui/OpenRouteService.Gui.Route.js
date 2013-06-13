/**
 * GUI element representing the routing part.
 */
OpenRouteService.Gui.Route = Class.create(OpenRouteService.Gui, {
	NUM_EMPTY_POINTS : 2,
	routePresent : false,
	waypointsFromGpxFile : [],

	routeInstructionsLayer : null,
	map : null,
	/**
	 * @private: this ia necessary because we might have several requests running at the same time. Whenever the first request responds, the search gif is removed.
	 * This is confusing, e.g. when searching for 'telephone', the first request starts during entering the word: req1 = 'telep'. When being done with entering, the second request is started: req2 = 'telephone'
	 * req1 will respond with numResults=0 which is immediately shown on the client, but acutally the second request will respond with numResults=100 some seconds later.
	 */
	openLSRequestCounter : 0,
	/**
	 * constructor to create a new route
	 * @param options - An Object conaining options as name: value pairs.
	 * @param options.map: required. The map to operate on.
	 */
	initialize : function(options) {
		OpenRouteService.route = this;
		this.options = options || {};
		this.map = options.map;

		//build style, map and HTML elements
		this.initMapFeatures();
		this.initHtmlRepresentation();

		//insert waypoints that were given as params
		this.waypoints = [];
		var self = this;
		if (this.options.waypoints && this.options.waypoints.length > 0) {
			this.options.waypoints.each(function(waypoint, i) {
				//waypoints are given as an array that contains one coordinate per element, e.g. we need 2 elements to get one waypoint
				if (waypoint.length == 2) {
					var wp = self.addWaypoint();
					var lonlat = new OpenLayers.LonLat(parseFloat(waypoint[0]), parseFloat(waypoint[1]));
					lonlat = lonlat.transform(new OpenLayers.Projection(self.map.getProjection()), new OpenLayers.Projection('EPSG:4326'));
					wp.setPosition(lonlat.lon, lonlat.lat);
				}
			});

			this.checkWaypointsAndCalcRoute();
		}

		//Event handling
		this.addWaypointButton.observe('click', function() {
			self.addWaypoint();
		});
		document.observe('routePreference:changed', function() {
			self.checkWaypointsAndCalcRoute();
		});
		document.observe('routeServerError:clicked', function() {
			document.getElementById('routeCalculateZoom').setAttribute('class', 'alert alert-error');
			document.getElementById('routeCalculateZoom').update(OpenRouteService.Preferences.translate('serverError'));
		});

		//will add up to 2 empty waypoints
		this.fillUpWaypoints();
	},
	/**
	 * add all necessary map elements that are necessary for route calculation
	 */
	initMapFeatures : function() {
		//make wayPoints draggable
		var self = this;
		this.layerRoutePoints = this.map.getLayersByName(OpenRouteService.Map.ROUTE_POINTS)[0];
		var dragRoutePoints = new OpenLayers.Control.DragFeature(this.layerRoutePoints);
		this.options.map.addControl(dragRoutePoints);
		dragRoutePoints.activate();
		dragRoutePoints.onComplete = function(feature, mousePosition) {
			//convert position
			var srsOutput = 'EPSG:4326';
			var srsInput = self.options.map.getProjection();
			var newGeometry = feature.geometry.clone().transform(new OpenLayers.Projection(srsInput), new OpenLayers.Projection(srsOutput));
			//set position of the waypoint to that
			feature.jsRepresentation.setPosition(newGeometry.x, newGeometry.y);
		}
		// Create a select feature control, add it to the map & activate it.
		var selectWaypoint = new OpenLayers.Control.SelectFeature(this.layerRoutePoints, {
			hover : true,
			toggle : true,
			clickout : true
		});

		//highlighting of the waypoint's "text" in the sidebar on mouseover
		selectWaypoint.onSelect = function(feature) {
			feature.jsRepresentation.htmlRepresentation.addClassName('highlight');
		};
		selectWaypoint.onUnselect = function(feature) {
			feature.jsRepresentation.htmlRepresentation.removeClassName('highlight');
		};

		this.options.map.addControl(selectWaypoint);
		selectWaypoint.activate();

		//give the routePoints layer references to relevant controls
		this.layerRoutePoints.selectWaypoint = selectWaypoint;
		this.layerRoutePoints.dragRoutePoints = dragRoutePoints;
	},
	/**
	 *build the HTML elements of the routing class and insert them in this.htmlRepresentation
	 */
	initHtmlRepresentation : function() {
		this.htmlRepresentation = new Element('div', {
			'class' : 'guiComponent route'
		});

		//define the UI elements in the routing panel
		this.routeOptions = new OpenRouteService.Gui.Collapsible.RouteOptions(this.options.routeOpt, this.options.motorways, this.options.tollways, this.options.avoidAreas, this.options.map);
		this.routeOptions.collapse();

		var routeOptionsContainer = new Element('div', {
			'class' : 'panel panelLight'
		});
		routeOptionsContainer.insert(this.routeOptions.htmlRepresentation);
		this.htmlRepresentation.insert(routeOptionsContainer);

		this.htmlRepresentation.insert("<br/>");

		//button to reset all waypoints (clear route)
		this.resetRouteButton = new Element('div', {
			'id' : 'resetRoute',
			'class' : 'clickable'
		}).update(OpenRouteService.Preferences.translate('resetRoute'));
		this.htmlRepresentation.insert(this.resetRouteButton);
		var self = this;
		this.resetRouteButton.observe('click', function() {
			self.resetRoute();
		});

		this.htmlRepresentation.insert("<br/>");

		this.addWaypointButton = new Element('div', {
			'class' : 'addWaypoint clickable'
		}).update(OpenRouteService.Preferences.translate('addWaypoint'));

		//holds "calculating route" and "zoom to whole route" when appropriate
		this.routeCalculateZoom = new Element('div', {
			'id' : 'routeCalculateZoom'
		});

		this.htmlRepresentation.insert(this.addWaypointButton);
		this.htmlRepresentation.insert(this.routeCalculateZoom);

		this.RouteSummaryContainer = new Element('div', {
			'class' : 'routeSummaryContainer panel panelLight'
		}).hide();
		this.htmlRepresentation.insert(this.RouteSummaryContainer);

		this.RouteInstructionsContainer = new Element('div', {
			'class' : 'routeInstructionsContainer panel panelLight'
		}).hide();
		this.htmlRepresentation.insert(this.RouteInstructionsContainer);

		this.routeExtrasContainer = new Element('div', {
			'class' : 'routeExtrasContainer panel panelLight'
		});
		this.routeExtras = new OpenRouteService.Gui.Collapsible.RouteExtras(this);
		this.routeExtras.collapse();
		this.routeExtrasContainer.insert(this.routeExtras.htmlRepresentation);
		this.htmlRepresentation.insert(this.routeExtrasContainer);
	},
	/**
	 * Add a waypoint at the given index. If no index is provided, add as last waypoint.
	 * @param index: index where to insert the waypoint in the list
	 * @return added waypoint instance
	 */
	addWaypoint : function(index) {
		if (!index || index > this.waypoints.length) {
			index = this.waypoints.length;
		}
		var newWaypoint = new OpenRouteService.Gui.Waypoint(this.options, this.layerRoutePoints, this);

		//insert point in list of routing points (HTML/DOM elements)
		if (this.waypoints.length == 0) {
			this.addWaypointButton.insert({
				before : newWaypoint.htmlRepresentation
			});
		} else if (index == 0) {
			this.waypoints[0].htmlRepresentation.insert({
				before : newWaypoint.htmlRepresentation
			});
		} else if (index <= this.waypoints.length) {
			this.waypoints[index - 1].htmlRepresentation.insert({
				after : newWaypoint.htmlRepresentation
			});
		}

		//insert point in list of waypoints
		this.waypoints.splice(index, 0, newWaypoint);

		//set new waypoints to unset, display up/down buttons when appropriate
		this.setPointTypes();

		return newWaypoint;
	},
	/**
	 * removes the given waypoint, specified by its index in the list
	 * does not automatically fill up 2 empty waypoints!
	 * @index: index of the waypoint to remove in this.waypoints
	 */
	removeWaypoint : function(index) {
		if (index && index < this.waypoints.length) {
			this.waypoints[index].remove();
			this.waypoints.splice(index, 1);
		}
	},
	/**
	 * fills the list of waypoints so that at least 2 waypoints are present
	 */
	fillUpWaypoints : function() {
		var missingPoints = this.NUM_EMPTY_POINTS - this.waypoints.length;
		for (var i = 0; i < missingPoints; i++) {
			this.addWaypoint();
		}
	},
	/**
	 * user wants to insert a start point (e.g. from context menu). Select an appropriate waypoint
	 * @return waypoint to use as start point
	 */
	addStartWaypoint : function() {
		if (this.waypoints.length < 1) {
			this.addWaypoint();
		}
		return this.waypoints[0];
	},
	/**
	 * user wants to insert a via point (e.g. from context menu). Select an appropriate waypoint
	 * @return waypoint to use as via point
	 */
	addViaWaypoint : function() {
		while (this.waypoints.length < 2) {
			this.addWaypoint();
		}
		for (var i = 1; i < this.waypoints.length; i++) {
			//first waypoint is never used for via points!
			if (this.waypoints[i].pointType == OpenRouteService.Gui.Waypoint.UNSET && i != this.waypoints.length - 1) {
				return this.waypoints[i];
			}
		}
		//we didn't find an empty waypoint inside the waypoint list (neither start nor end) -> add one
		return this.addWaypoint(this.waypoints.length - 1);
	},
	/**
	 * user wants to insert an end point (e.g. from context menu). Select an appropriate waypoint
	 * @return waypoint to use as end point
	 */
	addEndWaypoint : function() {
		if (this.waypoints.length < 2) {
			//if all empty or only one present
			while (this.waypoints.length < 2) {
				this.addWaypoint();
			}
		} else if (this.waypoints[this.waypoints.length - 1].pointType != OpenRouteService.Gui.Waypoint.UNSET && this.waypoints[this.waypoints.length - 1].pointType != OpenRouteService.Gui.Waypoint.END) {
			//if there are some waypoints yet (and not END points), we just add one more and use the last one as end point
			this.addWaypoint();
		}
		return this.waypoints[this.waypoints.length - 1];
	},
	/**
	 * @return the next available waypoiint that it not in use yet. Else, a new waypoint is added
	 */
	getNextAvailableWaypoint : function() {
		for (var i = 0; i < this.waypoints.length; i++) {
			if (this.waypoints[i].pointType == 'unset') {
				return this.waypoints[i];
			}
		}
		//we didn't find any empty waypoint
		return this.addWaypoint();
	},
	/**
	 *checks if given waypoints form a route and triggers sending of routing request
	 */
	checkWaypointsAndCalcRoute : function() {
		var routable = false;
		if (this.waypoints.length >= 2) {
			//record number of set waypoints
			var numSetWaypoints = 0;
			for (var i = 0; i < this.waypoints.length && routable == false; i++) {
				if (this.waypoints[i].pointType != OpenRouteService.Gui.Waypoint.UNSET) {
					numSetWaypoints++;
					if (numSetWaypoints >= 2) {
						routable = true;
					}
				}
			}
		}
		if (routable == true) {
			//trigger routing request
			this.requestRoute();
		} else {
			//if a route is still present (e.g. because there have been 2 waypoints and one of them has been deleted), remove calculated route
			this.removeRouteLinesAndDomElements();
		}
	},
	/**
	 * private method, do not access from outside!
	 * This is used to reset the lines for calculated route and route instructions and hides related DOM elements
	 * Will be used when resetting the whole route or if less than two waypoints exist
	 */
	removeRouteLinesAndDomElements : function() {
		//reset calculated route
		if (this.map.getLayersByName(OpenRouteService.Map.ROUTE_LINES).length > 0) {
			var routeLineLayer = this.map.getLayersByName(OpenRouteService.Map.ROUTE_LINES)[0];
			routeLineLayer.removeAllFeatures();
		}
		//reset route instructions
		if (this.map.getLayersByName(OpenRouteService.Map.ROUTE_INSTRUCTIONS).length > 0) {
			var routeInstrLayer = this.map.getLayersByName(OpenRouteService.Map.ROUTE_INSTRUCTIONS)[0];
			routeInstrLayer.removeAllFeatures();
		}
		//hide DOM elements
		if (this.RouteInstructionsContainer) {
			this.RouteInstructionsContainer.hide();
		}
		if (this.RouteSummaryContainer) {
			this.RouteSummaryContainer.hide();
		}
		var el = document.getElementById('routeCalculateZoom');
		if (el) {
			el.hide();
		}
	},
	/**
	 * deletes all waypoints and resets the complete route
	 */
	resetRoute : function() {
		while (this.waypoints.length > 0) {
			this.waypoints[this.waypoints.length - 1].reset();
		}
		this.waypoints = [];
		this.removeRouteLinesAndDomElements();
		this.fillUpWaypoints();
	},
	/**
	 * request a route with the given data (waypoints, options)
	 */
	requestRoute : function() {
		this.routeExtras.errorContainer.hide();

		if (this.map.getLayersByName(OpenRouteService.Map.ROUTE_LINES).length > 0) {
			var routeLineLayer = this.map.getLayersByName(OpenRouteService.Map.ROUTE_LINES)[0];
			routeLineLayer.removeAllFeatures();
			var routeInstructionsLayer = this.map.getLayersByName(OpenRouteService.Map.ROUTE_INSTRUCTIONS)[0];
			routeInstructionsLayer.removeAllFeatures();
		}

		this.routeCalculateZoom.setAttribute('style', 'display:block;');
		this.routeCalculateZoom.update(OpenRouteService.Preferences.translate('calculatingRoute'));
		this.routeCalculateZoom.addClassName('alert alert-info searchingBlue');

		var routePlan = {};
		routePlan.wayPointList = this.getGmlRepresentation();
		routePlan.routePreference = this.routeOptions.getRoutePreference();
		routePlan.avoidMotorways = this.routeOptions.getAvoidMotorways();
		routePlan.avoidTollways = this.routeOptions.getAvoidTollways();
		routePlan.avoidAreas = this.routeOptions.getAvoidAreas();

		var self = this;

		var routeService = new OpenRouteService.OpenLS.Route();
		routeService.buildRequest(routePlan, OpenRouteService.Preferences.language);

		this.openLSRequestCounter++;

		routeService.requestData(function() {
			self.openLSRequestCounter--;
			//assumption: last routing request is the most current one. no need to display other pending requests
			if (self.openLSRequestCounter == 0) {
				//getResponse() directly applies the routing information to self, i.e. the ORS.Gui.Route object
				routeService.getResponse(self);
				var successful = self.routePresent;

				if (successful) {
					document.getElementById('routeCalculateZoom').removeClassName('alert alert-info searchingBlue');
					document.getElementById('routeCalculateZoom').removeClassName('alert alert-error');
					document.getElementById('routeCalculateZoom').update('');
				} else {
					//remove searching sign and "calculate route" information but display the "no route available" message
					document.getElementById('routeCalculateZoom').setAttribute('class', 'alert alert-error');
					document.getElementById('routeCalculateZoom').update(OpenRouteService.Preferences.translate('noRouteAvailable'));
				}
				self.zoomToRoute();

				//fire event so that POIs can be recalculated
				document.fire('route:changed');
			}
		});
	},
	/**
	 * build gmlRepresentation of all routing points; necessary for sending routing request
	 * @return array of Gml:Point elements
	 */
	getGmlRepresentation : function() {
		var gmlRepresentation = [];
		this.waypoints.each(function(waypoint) {
			var gmlRep = waypoint.gmlRepresentation;
			if (gmlRep)
				gmlRepresentation.push(gmlRep);
		});
		return gmlRepresentation;
	},
	/**
	 * zoomes and centers the map so that the complete route is visible on the site
	 */
	zoomToRoute : function() {
		var mapRepresentation = this.map.getLayersByName(OpenRouteService.Map.ROUTE_LINES)[0];
		var dataExtent = mapRepresentation.getDataExtent() || this.layerRoutePoints.getDataExtent();
		if (dataExtent) {
			this.options.map.zoomBoxToExtent(OpenRouteService.Ui.Elements.getFreeSpace(), dataExtent);
			if (this.options.map.getZoom() > 14 && this.layerRoutePoints.features.length < 2) {
				this.options.map.zoomTo(14);
			}
		}
	},
	/**
	 * determines the type of each waypoint (start/ via/ end) and sets it accordingly
	 * the last waypoint is always set to 'end', even if all waypoints before are 'unset'.
	 * the prior-to-last waypoint is never set to 'end', even if the last waypiont is currently in 'unset'. (Route calculation is though still possible)
	 */
	setPointTypes : function() {
		var len = this.waypoints.length;
		if (this.waypoints.length >= 1) {
			//setting the first waypoint to start (or unset)
			var wp = this.waypoints[0];
			wp.gmlRepresentation ? wp.setPointType(OpenRouteService.Gui.Waypoint.START) : wp.setPointType(OpenRouteService.Gui.Waypoint.UNSET);
			wp.moveUpButton.hide();
			wp.moveDownButton.show();

			//setting all others via (or unset)
			for (var i = 1; i <= len - 2; i++) {
				wp = this.waypoints[i];
				wp.gmlRepresentation ? wp.setPointType(OpenRouteService.Gui.Waypoint.VIA) : wp.setPointType(OpenRouteService.Gui.Waypoint.UNSET);
				wp.moveDownButton.show();
				wp.moveUpButton.show();
			}
			//setting the last waypoint to end (or unset)
			if (len > 1) {
				wp = this.waypoints[len - 1];
				wp.gmlRepresentation ? wp.setPointType(OpenRouteService.Gui.Waypoint.END) : wp.setPointType(OpenRouteService.Gui.Waypoint.UNSET);
				wp.moveDownButton.hide();
				wp.moveUpButton.show();
			}
		}
	},
	/**
	 * writes the calculated route to a new window (which can be saved as GPX file)
	 */
	writeToGpxFile : function() {
		this.routeExtras.errorContainer.hide();
		var formatter = new OpenLayers.Format.GPX({
			'internalProjection' : new OpenLayers.Projection("EPSG:900913")
		});
		var routeLayers = this.map.getLayersByName(OpenRouteService.Map.ROUTE_LINES);
		if (routeLayers && routeLayers.length > 0) {
			var gpxStr = formatter.write(routeLayers[0].features);
			//insert line breaks for nicely readable code
			gpxStr = gpxStr.replace(/></g, '>\n<');
			//writing String to File seems not possible. We open a window with the content instead.
			w = window.open('about:blank', '_blank', 'height=300,width=400');
			w.document.write('<xmp>' + gpxStr + '</xmp>');
		} else {
			//error, route does not exist. Nothing can be exported
			this.routeExtras.errorContainer.update(OpenRouteService.Preferences.translate('gpxDownloadError'));
			this.routeExtras.errorContainer.show();
		}
	},
	/**
	 * import routing information from a GPX file
	 * @param calcRoute: if true, the route between start and end point from the GPX file is re-calculated by ORS; if false, only the route lines are drawn. there will be no waypoints
	 */
	readFromGpxFile : function(calcRoute, id) {
		this.routeExtras.errorContainer.hide();
		var error = false;
		var self = this;

		var fileInput = $$('#' + id + ' input[type="file"]')[0];

		var file = null;
		if (fileInput && fileInput.files) {
			file = fileInput.files[0];
		} else if (fileInput && fileInput.value) {
			//IE doesn't know x.files
			file = fileInput.value;
		}

		if (file) {
			if (!window.FileReader) {
				// File APIs are not supported, e.g. IE
				error = true;
			} else {
				var r = new FileReader();
				r.readAsText(file);

				r.onload = function(e) {
					var data = e.target.result;
					//remove gpx: tags; Firefox cannot cope with that.
					data = data.replace(/gpx:/g, '');

					var formatter = new OpenLayers.Format.GPX({
						'internalProjection' : new OpenLayers.Projection("EPSG:900913")
					});
					var featureVectors = formatter.read(data);
					linePoints = featureVectors[0].geometry.components;

					if (linePoints && linePoints.length >= 2) {
						//only proceed if the route contains at least 2 points (which can be interpreted as start and end)
						var startPos = new OpenLayers.LonLat(linePoints[0].x, linePoints[0].y).transform(new OpenLayers.Projection('EPSG:900913'), new OpenLayers.Projection('EPSG:4326'));
						var endPos = new OpenLayers.LonLat(linePoints[linePoints.length - 1].x, linePoints[linePoints.length - 1].y).transform(new OpenLayers.Projection('EPSG:900913'), new OpenLayers.Projection('EPSG:4326'));

						if (calcRoute) {
							var startWaypoint = self.getNextAvailableWaypoint();
							startWaypoint.setPosition(startPos.lon, startPos.lat);

							var endWaypoint = self.getNextAvailableWaypoint();
							endWaypoint.setPosition(endPos.lon, endPos.lat);

							self.waypointsFromGpxFile.push(startWaypoint);
							self.waypointsFromGpxFile.push(endWaypoint);
							
							var routeLayers = self.map.getLayersByName(OpenRouteService.Map.ROUTE_LINES);
							routeLayers[0].addFeatures(featureVectors);
						} else {
							var trackLayer = self.map.getLayersByName(OpenRouteService.Map.TRACK);
							trackLayer[0].addFeatures(featureVectors);
						}
						
					}
				}
			}
		} else {
			error = true;
		}
		if (error) {
			this.routeExtras.errorContainer.update(OpenRouteService.Preferences.translate('gpxUploadError'));
			this.routeExtras.errorContainer.show();
			return;
		}
	},
	/**
	 * remove waypoints imported from a GPX file
	 * assuming we can upload one GPX file at max.
	 */
	deleteGpxFileRoute : function() {
		for (var i = 0; i < this.waypoints.length; i++) {
			for (var j = 0; j < this.waypointsFromGpxFile.length; j++) {
				if (this.waypoints[i].equals(this.waypointsFromGpxFile[j])) {
					this.waypoints[i].reset();
				}
			}
		}
		this.setPointTypes();
		this.fillUpWaypoints();
		this.checkWaypointsAndCalcRoute();
	},
	/**
	 * Opens a new tab with the URL to the OpenRoteService and GET parameters
	 * GET includes: layers/overlays, route options, waypoints
	 */
	linkToRoute : function() {
		var layers = OpenRouteService.Map.serializeLayers(this.map);
		var routeOpt = this.routeOptions.getRoutePreference();
		var motorways = this.routeOptions.getAvoidMotorways();
		var tollways = this.routeOptions.getAvoidTollways();
		var avoidAreas = this.routeOptions.getAvoidAreasString();
		var waypoints = this.serializeWaypoints();

		//append selection of prefs as GET variables+
		var query = window.location.search, deviceParam = "layers=" + layers + "&routeOpt=" + routeOpt + "&motorways=" + motorways + "&tollways=" + tollways + "&waypoints=" + waypoints + "&avoidAreas=" + avoidAreas;
		query = "?" + deviceParam;

		//open new window with the permalink
		window.open(query);
	},
	/**
	 * returns one single URL-encodes string with the location of the waypoints
	 */
	serializeWaypoints : function() {
		var str = "";
		for (var i = 0; i < this.waypoints.length; i++) {
			var wp = this.waypoints[i];
			if (wp.olRepresentation) {
				str += wp.olRepresentation.x + '%2C' + wp.olRepresentation.y + '%2C';
			}
		}
		//slice away the last separator '%2C'
		str = str.substring(0, str.length - 3);
		return str;
	}
});

