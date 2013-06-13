/**
 * Class: OpenRouteService.Gui.Waypoint
 * This class represents a waypoint for use within a routing tool.
 */
OpenRouteService.Gui.Waypoint = Class.create(OpenRouteService.Gui, {
	/**
	 * Property: htmlRepresenatation
	 * {DOMElement} A description of this Waypoint.
	 */
	htmlRepresentation : null,
	/**
	 * Property: olRepresenatation
	 * {<OpenLayers.Geometry>} The container for Popup
	 */
	olRepresentation : null,

	/**
	 * Property: mapRepresenatation
	 * {<OpenLayers.Feature>} The container for Popup
	 */
	mapRepresentation : null,

	shortTextRepresentation : null,

	search : null,
	
	/**
	 * Constructor: OpenRouteService.Gui.Waypoint
	 * Create a new waypoint..
	 *
	 * @param options - An Object conaining options as name: value pairs.
	 * @param map - required. The map to operate on.
	 * @param layer - {<OpenLayers.Layer.Markers>} The Layer that contains waypoint markers for route.
	 * @param route - {OpenRouteService.Gui.Route} The route to whitch this waypoint belongs.
	 */
	initialize : function(options, layer, route) {
		this.options = options;
		this.layer = layer;
		this.route = route;
		//map to show the search results in
		this.mapRepresentation = options.map;

		this.htmlRepresentation = new Element('div', {
			'class' : 'guiComponent waypoint',
			draggable : true
		});

		this.moveUpButton = new Element('span', {
			'class' : 'clickable moveUpWaypoint',
			'href' : '#',
			'title' : OpenRouteService.Preferences.translate('moveUpWaypoint')
		}).observe('click', this.moveUp.bind(this));

		this.moveDownButton = new Element('span', {
			'class' : 'clickable moveDownWaypoint',
			'href' : '#',
			'title' : OpenRouteService.Preferences.translate('moveDownWaypoint')
		}).observe('click', this.moveDown.bind(this));

		this.closeButton = new Element('span', {
			'class' : 'clickable closeButton',
			'title' : OpenRouteService.Preferences.translate('removeWaypoint')
		}).observe('click', this.remove.bind(this));

		this.searchAgainButton = new Element('span', {
			'class' : 'clickable searchAgainButton',
			'title' : OpenRouteService.Preferences.translate('searchAgain')
		}).observe('click', this.toggleSearchResultModes.bind(this));
		this.searchAgainButton.hide();

		this.htmlRepresentation.insert(this.closeButton);
		this.htmlRepresentation.insert(this.moveUpButton);
		this.htmlRepresentation.insert(this.moveDownButton);
		this.htmlRepresentation.insert(this.searchAgainButton);

		this.olRepresentation = null;
		this.gmlRepresentation = null;
		this.pointType = null;

		this.searchResult = new Element('div').hide();
		this.htmlRepresentation.insert(this.searchResult);

		options.selectPrompt = OpenRouteService.Preferences.translate('selectResult');
		//set parameter that this search is used for the routing waypoints (not just searching like in search tab)
		options.routing = true;
		this.search = new OpenRouteService.Gui.SearchPlace(options);

		this.htmlRepresentation.insert(this.search.htmlRepresentation);

		this.setResultClickOperation();
	},
	setResultClickOperation : function() {
		var self = this;
		this.search.setResultClickOperation(function(result) {//what to do when search result is clicked
			self.shortTextRepresentation = result.shortAddress;

			self.htmlRepresentation.removeClassName('highlight');
			var sr = Element.clone(result.htmlRepresentation, true);

			self.searchResult.update(sr);
			sr.removeClassName('highlight');

			self.gmlRepresentation = result.point.cloneNode(true);
			var pos = OpenRouteService.Util.getElementsByTagNameNS(self.gmlRepresentation, OpenRouteService.namespaces.gml, 'pos')[0];

			self.olRepresentation = OpenRouteService.convert.gml2ol.pos2point(pos, self.options.map.getProjection());

			//start highlighting on mouseover
			sr.observe('mouseover', function() {
				if (self.mapRepresentation) {
					self.route.layerRoutePoints.selectWaypoint.select(self.mapRepresentation);
				}
			});
			//stop highlighting on mouseout
			sr.observe('mouseout', function() {
				if (self.mapRepresentation) {
					self.route.layerRoutePoints.selectWaypoint.unselect(self.mapRepresentation);
				}
			});
			self.resultMode(result.lonlat);
		});
	},
	/**
	 * Method: searchMode
	 * Switch to search mode showing the search results & letting the user select one.
	 */
	searchMode : function() {
		this.searchAgainButton.hide();
		this.htmlRepresentation.removeClassName('highlight');
		if (this.mapRepresentation) {
			this.layer.removeFeatures([this.mapRepresentation]);
		}
		this.search.show();
		this.searchResult.hide();
		this.route.setPointTypes();
	},
	/**
	 * Method: resultMode
	 * Switch to result mode showing the selected result as a route point.
	 */
	resultMode : function() {
		this.searchAgainButton.show();
		this.search.hide();
		this.searchResult.show();
		this.route.setPointTypes();
		this.route.checkWaypointsAndCalcRoute();
	},
	/**
	 * switches between resultMode and searchMode
	 */
	toggleSearchResultModes : function() {
		if (!this.searchResult.visible()) {
			this.resultMode();
		} else {
			this.searchMode();
		}
	},
	/**
	 * Method: moveUp
	 * Moves this Waypoint up in the list
	 */
	moveUp : function() {
		var thisIndex = this.route.waypoints.indexOf(this);
		var swapIndex = thisIndex - 1;
		var waypoints = this.route.waypoints;
		if (swapIndex >= 0) {
			var previous = this.htmlRepresentation.previousSibling
			previous.insert({
				before : this.htmlRepresentation
			});
			var tmp = waypoints[swapIndex];
			waypoints[swapIndex] = waypoints[thisIndex];
			waypoints[thisIndex] = tmp;

			this.route.setPointTypes();
			this.route.checkWaypointsAndCalcRoute();
		}
	},
	/**
	 * Method: moveDown
	 * Moves this Waypoint down in the list.
	 */
	moveDown : function() {
		var thisIndex = this.route.waypoints.indexOf(this);
		var swapIndex = thisIndex + 1;
		var waypoints = this.route.waypoints;
		if (swapIndex < waypoints.length) {
			var next = this.htmlRepresentation.nextSibling
			next.insert({
				after : this.htmlRepresentation
			});
			var tmp = waypoints[swapIndex];
			waypoints[swapIndex] = waypoints[thisIndex];
			waypoints[thisIndex] = tmp;

			this.route.setPointTypes();
			this.route.checkWaypointsAndCalcRoute();
		}
	},
	/**
	 * Removes this Waypoint from the route and requests a route re-calculation
	 */
	remove : function() {
		this.reset();
		this.route.setPointTypes();
		this.route.fillUpWaypoints();
		this.route.checkWaypointsAndCalcRoute();
	},
	/**
	 * Resets the waypoint, removes it from the map and Waypoint list but does not trigger an event.
	 * This is used when resetting the whole route without the requirement to recalculate the route after each waypoint removal.
	 */
	reset : function() {
		var self = this;
		$(this.htmlRepresentation).remove();
		if (this.mapRepresentation) {
			this.layer.removeFeatures([this.mapRepresentation]);
		}
		this.route.waypoints = this.route.waypoints.reject(function(Object) {
			return Object === self
		});
	},
	/**
	 * updates the waypoints
	 */
	setMarker : function() {
		if (OpenRouteService.Gui.icons[this.pointType] && this.gmlRepresentation) {
			this.icon = OpenRouteService.Gui.icons[this.pointType].clone();
		} else {
			this.icon = OpenRouteService.Gui.icons['unset'].clone();
		}

		if (this.mapRepresentation) {
			this.layer.removeFeatures([this.mapRepresentation]);
		}
		if (this.olRepresentation) {
			this.mapRepresentation = new OpenLayers.Feature.Vector(this.olRepresentation, null);
			this.mapRepresentation.jsRepresentation = this;
			this.mapRepresentation.pointType = this.pointType;
			this.layer.addFeatures([this.mapRepresentation]);
		}
	},
	/**
	 * Method: setPointType
	 * Setter for Point Type.
	 *
	 * @param pointType - {<String>} One of ['start'|'via'|'end'].
	 */
	setPointType : function(pointType) {
		//set the attribute
		this.htmlRepresentation.removeClassName(this.pointType);
		this.pointType = pointType;
		this.htmlRepresentation.addClassName(this.pointType);

		//set the marker on the map
		this.setMarker();
	},
	/**
	 * Method: setPosition
	 * Set position of Waypoint & update accordingly.
	 *
	 * @param pos - {<DOMElement>} gml:pos Element representing the new Position.
	 */
	setPosition : function(lon, lat, srsName) {
		//remove old marker
		this.layer.removeFeatures([this.mapRepresentation]);
		if (!srsName)
			srsName = 'EPSG:4326';
		if (this.olRepresentation) {
			this.olRepresentation.x = lon;
			this.olRepresentation.y = lat;
			window.m = this.options.map;
			this.olRepresentation.transform(new OpenLayers.Projection(srsName), new OpenLayers.Projection(this.options.map.getProjection()));
		} else {
			this.olRepresentation = new OpenLayers.Geometry.Point(lon, lat).transform(new OpenLayers.Projection(srsName), new OpenLayers.Projection(this.options.map.getProjection()));
		}
		//won't work with the current instance
		this.mapRepresentation = new OpenLayers.Feature(this.olRepresentation);
		//place new marker on the map
		this.layer.addFeatures([this.mapRepresentation]);

		this.gmlRepresentation = OpenRouteService.Util.parseStringToDOM('<gml:Point xmlns:gml="http://www.opengis.net/gml"> <gml:pos srsName="EPSG:4326">8.0 51.0</gml:pos> </gml:Point>').firstChild;
		this.gmlRepresentation.firstElementChild.textContent = lon + ' ' + lat;

		window.wp = this;
		this.resultMode();
		this.reverseGeocode();
	},
	/**
	 * Method: reverseGeocode
	 * Reverse geocode current position & update htmlRepresentation accordingly.
	 *
	 * @param: pos - {<DOMElement>} gml:pos Element representing the new Position.
	 */
	reverseGeocode : function() {
		var self = this;
		var geocodeService = new OpenRouteService.OpenLS.ReverseGeocode();
		geocodeService.buildRequest(this.gmlRepresentation, OpenRouteService.Preferences.language);
		geocodeService.requestData(
		//callback
		function() {
			geocodeService.getResponse(self);
		});
		this.route.checkWaypointsAndCalcRoute();
		this.search.clearResults();
	},
	/**
	 * @param: that: waypoint to compare this object to
	 * @return true, if this waypoint matches the given waypoint; false, if not.
	 */
	equals : function(that) {
		if (this.gmlRepresentation == that.gmlRepresentation) {
			return true;
		} else {
			return false;
		}
	}
});
OpenRouteService.Gui.Waypoint.UNSET = 'unset';
OpenRouteService.Gui.Waypoint.START = 'start';
OpenRouteService.Gui.Waypoint.VIA = 'via';
OpenRouteService.Gui.Waypoint.END = 'end';
