/**
 * used for geolocation features provided by HTML5.
 * The user's current location is determined and can be displayed on the map, used as waypoint,...
 */
OpenRouteService.Gui.Geolocation = Class.create(OpenRouteService.Gui, {
	result : null,

	initialize : function(options) {
		var self = this;
		this.options = options || {};
		this.mapRepresentation = options.map;

		this.htmlRepresentation = new Element('div', {
			'class' : 'guiComponent geolocation'
		});

		this.showCurrentLocation = new Element('div', {
			'class' : 'clickable showCurrentLocation',
			'id' : 'location'
		}).update(OpenRouteService.Preferences.translate('showCurrentLocation'));

		this.htmlRepresentation.insert(this.showCurrentLocation);
		$(this.showCurrentLocation).observe('click', function() {
			self.determineCurrentLocation();
		});

		this.errorBox = new Element('div', {
			'class' : 'alert alert-error',
			'id' : 'geolocationError'
		}).hide();
		this.htmlRepresentation.insert(this.errorBox);

		//used to transfer the location information
		this.currentPos = new Element('div', {
			'id' : 'invisibleCurrentPos'
		}).hide();
		this.htmlRepresentation.insert(this.currentPos);

		document.observe('showCurrentLocation:clicked', function() {
			var position = document.getElementById('invisibleCurrentPos');
			self.showLocationOnMap(position);
		});
	},
	/**
	 * find out the current location of the user
	 */
	determineCurrentLocation : function() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(this.onGeolocationSuccess, this.onGeolocationError);
		} else {
			this.errorBox.update(OpenRouteService.Preferences.translate('geolocationNotSupported'));
			this.errorBox.show();
		}
	},
	/**
	 * private method, to not access it from outside
	 * determine the address of the current location and place a marker on the map
	 */
	onGeolocationSuccess : function(position) {
		/*
		 * is there a better way to do this but writing information to a div to pass on arguments?
		 */
		var gmlPosLon = '<p>' + position.coords.longitude + '</p>';
		var gmlPosLat = '<p>' + position.coords.latitude + '</p>';
		gmlPosLon = OpenRouteService.Util.parseStringToDOM(gmlPosLon).firstChild;
		gmlPosLat = OpenRouteService.Util.parseStringToDOM(gmlPosLat).firstChild;
		document.getElementById('invisibleCurrentPos').insert(gmlPosLon);
		document.getElementById('invisibleCurrentPos').insert(gmlPosLat);

		document.fire('showCurrentLocation:clicked');
	},
	/**
	 * private method, to not access it from outside
	 * display an error message when a runtime error occurs during geolocatio checking
	 */
	onGeolocationError : function(msg) {
		document.getElementById('geolocationError').update(OpenRouteService.Preferences.translate('geolocationRuntimeError'));
		document.getElementById('geolocationError').show();
	},
	/**
	 * private method, to not access it from outside
	 * transforms the given lon/lat coordinates of the current location into a human readable address, places a marker on the map and moves to that position
	 */
	showLocationOnMap : function(position) {
		var lon = position.childNodes[0].textContent;
		var lat = position.childNodes[1].textContent;

		var self = this;
		var geolocationService = new OpenRouteService.OpenLS.Geolocation();
		geolocationService.buildRequest(lon, lat, OpenRouteService.Preferences.language);
		geolocationService.requestData(
		//callback
		function() {
			//the routing attribute is necessary to enable the "use as waypoint" button
			self.options.routing = false;
			self.result = geolocationService.getResponse(self.options);
			self.result.setResultClickOperation(self.resultClickOperation);

			Event.observe(self.result.useAsWaypoint, 'click', function() {
				self.useAsWaypoint(self.result);
			});

			self.showCurrentLocation.hide();
			self.resultContainer = new Element('div').update(self.result.htmlRepresentation);
			self.htmlRepresentation.insert(self.resultContainer);

			if (self.mapResults) {
				try {
					self.mapResults.destroy();
				} catch (e) {
				}
			}
			var layerGeolocation = self.mapRepresentation.getLayersByName(OpenRouteService.Map.GEOLOCATION)[0];
			layerGeolocation.addMarker(self.result.mapRepresentation);

			var pt = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection('EPSG:4326'), new OpenLayers.Projection('EPSG:900913'));
			self.mapRepresentation.moveTo(pt, 14);
		});
	},
	/**
	 * when the user selects his current location, it is added to the route's waypoints
	 * Note: copied from ORS.Gui.SearchPlace.useAsWaypoint(). Is there a better way to do this?
	 */
	useAsWaypoint : function(selectedSearchResult) {
		var routeInst = this.options.route.routeInstance;
		var wpCopy = routeInst.getNextAvailableWaypoint();

		wpCopy.shortTextRepresentation = selectedSearchResult.shortAddress;
		wpCopy.htmlRepresentation.removeClassName('highlight');

		//temporarily hide the "use as waypoint"-button or it will also be visible in the routing panel
		selectedSearchResult.useAsWaypoint.hide();
		var sr = Element.clone(selectedSearchResult.htmlRepresentation, true);
		selectedSearchResult.useAsWaypoint.show();

		wpCopy.searchResult.update(sr);
		sr.removeClassName('highlight');

		wpCopy.gmlRepresentation = selectedSearchResult.point.cloneNode(true);
		var pos = OpenRouteService.Util.getElementsByTagNameNS(wpCopy.gmlRepresentation, OpenRouteService.namespaces.gml, 'pos')[0];

		wpCopy.olRepresentation = OpenRouteService.convert.gml2ol.pos2point(pos, wpCopy.options.map.getProjection());

		//start highlighting on mouseover
		sr.observe('mouseover', function() {
			//addressDiv.addClassName('highlight');
			if (wpCopy.mapRepresentation) {
				wpCopy.route.layerRoutePoints.selectWaypoint.select(wpCopy.mapRepresentation);
			}
		});
		//stop highlighting on mouseout
		sr.observe('mouseout', function() {
			//addressDiv.removeClassName('highlight');
			if (wpCopy.mapRepresentation) {
				wpCopy.route.layerRoutePoints.selectWaypoint.unselect(wpCopy.mapRepresentation);
			}
		});
		//set waypoint at new position
		wpCopy.resultMode(selectedSearchResult.lonlat);

		//remove the results from the map
		this.result.hide();
		var layerGeolocation = this.mapRepresentation.getLayersByName(OpenRouteService.Map.GEOLOCATION)[0];
		layerGeolocation.clearMarkers();

		this.showCurrentLocation.show();

		//switch to routing tab
		document.fire('showRoutePanel:clicked');
	}
});
