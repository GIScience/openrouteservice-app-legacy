/**
 * GUI component to search for places.
 * The search functionality is visible in an own panel.
 */
OpenRouteService.Gui.SearchPoi = Class.create(OpenRouteService.Gui, {
	searchfield : null,
	responseContainer : null,
	numberOfResults : null,
	mapRepresentation : null,
	route : null,
	resultClickOperation : function() {
	},
	results : null,
	refPoint : [],
	maxDist : null,
	distMeasure : null,
	selectedAsWaypoint : -1,
	/**
	 * @private: this ia necessary because we might have several requests running at the same time. Whenever the first request responds, the search gif is removed.
	 * This is confusing, e.g. when searching for 'telephone', the first request starts during entering the word: req1 = 'telep'. When being done with entering, the second request is started: req2 = 'telephone'
	 * req1 will respond with numResults=0 which is immediately shown on the client, but acutally the second request will respond with numResults=100 some seconds later.
	 */
	openLSRequestCounter : 0,

	/**
	 * constructor
	 */
	initialize : function(options) {
		var self = this;
		this.options = options || {};
		this.mapRepresentation = options.map;
		route = options.route;
		this.openLSRequestCounter = 0;

		var selectPrompt = this.options.selectPrompt || '';

		//what to do with the result of a successful request
		var successCallback = function() {
			self.updateResults();
		};

		this.htmlRepresentation = new Element('div', {
			'class' : 'guiComponent Search'
		});

		/* The search field is capable of 2 different search approaches.
		* First, we display a dropdown list of POI categories. If the user picks one, we search for that.
		* If the user types an unknown category or a name of a POI, we search for this name
		*/

		//for output
		//array containing all POIs for auto-completion
		var categoriesToDisplay = [];

		var div = document.createElement('div');
		var typeCategories = OpenRouteService.List.poiTypes.keys();
		for (var i = 0; i < typeCategories.length; i++) {
			var detailedTypes = OpenRouteService.List.poiTypes.get(typeCategories[i]);

			//trick to decode HTML signs
			div.innerHTML = OpenRouteService.Preferences.translate(typeCategories[i]);
			var decoded = div.firstChild.nodeValue;
			categoriesToDisplay.push(decoded);

			for (var j = 0; j < detailedTypes.length; j++) {
				//trick to decode HTML signs
				div.innerHTML = OpenRouteService.Preferences.translate(detailedTypes[j]);
				var decoded = div.firstChild.nodeValue;
				categoriesToDisplay.push(decoded);
			}
		}
		//convert the array to required string-representation
		var dataSource = categoriesToDisplay.toString().replace(/,/g, '","');
		//enclose all values with ""
		dataSource = '["' + dataSource + '"]';

		this.searchfield = new Element('input', {
			'type' : 'text',
			'class' : 'searchField',
			'placeholder' : OpenRouteService.Preferences.translate('enterPoi'),
			//for the auto-completion dropdown menu for POIs
			'data-provide' : 'typeahead',
			'data-items' : '6',
			'data-source' : dataSource
		});

		this.inputWarn = new Element('div', {
			'id' : 'inputWarn',
			'class' : 'alert alert-error'
		}).hide();
		this.htmlRepresentation.insert(this.inputWarn);

		this.checkboxWarn = new Element('div', {
			'id' : 'checkboxWarn',
			'class' : 'alert alert-error'
		}).hide();
		this.htmlRepresentation.insert(this.checkboxWarn);
		this.htmlRepresentation.insert(this.searchfield);

		this.errorContainer = new Element('div', {
			'id' : 'searchPoiError'
		});
		this.htmlRepresentation.insert(this.errorContainer);

		document.observe('poiServerError:clicked', function() {
			self.displayServerError();
		});

		//a timeout prevents the page from calling the search function constantly while still typing.
		this.typingTimer = null;
		Event.observe(this.searchfield, 'keyup', this.observeSearchfieldInput.bind(this));

		var self = this;
		document.observe('route:changed', function() {
			//recalculate POIs if the route has changed (and only if a search keyword has been entered)
			if (self.searchfield.value.length > 0) {
				self.observeSearchfieldInput();
			}
		});
	},
	/**
	 * generates POI search requests when the user enters sth in the search-textfield.
	 * Entered keyword, maxDistance and (if exists) the route are passed to ORS.OpenLS.js to perform the service request
	 */
	observeSearchfieldInput : function() {
		clearTimeout(this.typingTimer);

		//only start search if user entered something in the search field
		if (this.searchfield.value) {
			var self = this;
			this.typingTimer = setTimeout(function() {
				self.searchfield.addClassName('searching');
				var layerPoi = self.mapRepresentation.getLayersByName(OpenRouteService.Map.POI)[0];
				layerPoi.clearMarkers();

				//if we want to view all POIs near the route, the whole route must be known -> Gui.SearchPOI object receives a reference to the Gui.Route object
				//I call the getGmlRepresentation to get the repres. of all waypoints. maybe this can be used for calc? -> also have a look at the php scritps from pascal

				if (document.getElementById('searchNearRoute').checked == true && route.routeInstance.getGmlRepresentation() != null && route.routeInstance.getGmlRepresentation().length > 0) {
					//user wants to search for POIs near the route
					self.distMeasure = document.getElementById('distMeasurePoi').value;
					var dist = document.getElementById('maxDistToPoi').value;
					self.maxDist = OpenRouteService.Util.convertDistToMeters(dist, self.distMeasure);

					var routePoints = [];
					var allPts = this.route.routeInstance.olRepresentation;
					
					var reader = new jsts.io.WKTReader();
					var readerInput = "LINESTRING (";
					for (var i = 0; i < allPts.length; i++) {
						//create a new object. otherwise it is called by reference and causes errors for multiple calculations
						var newPt = new OpenLayers.Geometry.Point(allPts[i].x, allPts[i].y);
						newPt = newPt.transform(new OpenLayers.Projection('EPSG:900913'), new OpenLayers.Projection('EPSG:4326'));
						routePoints.push(newPt);
						readerInput += newPt.x + " " + newPt.y + ", ";
					}

					//remove last ", "
					readerInput = readerInput.substring(0, readerInput.length - 2);
					readerInput += ")";

					var bufferMaxDist = ((self.maxDist * 360) / 40000000) + "";

					var input = reader.read(readerInput);
					var buffer = input.buffer(bufferMaxDist);

					var parser = new jsts.io.OpenLayersParser();
					input = parser.write(input);
					buffer = parser.write(buffer);

					//convert polygon buffer to array of OL.LonLat
					var polygonPoints = (buffer.components[0]).components;
					self.refPoint = [];
					for (var i = 0; i < polygonPoints.length; i++) {
						var pt = new OpenLayers.LonLat(polygonPoints[i].x, polygonPoints[i].y);
						self.refPoint.push(pt);
					}
					
					self.requestResults();
					route.routeInstance.zoomToRoute();
				} else {
					//search for POIs on the screen (if checkbox is not checked or no route is present)

					//pick center of map
					var pt = self.mapRepresentation.getCenter();
					pt = pt.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
					self.refPoint = [];
					self.refPoint.push(pt);

					//this value is measured in meters only
					var width = self.mapRepresentation.calculateBounds().getWidth();
					var height = self.mapRepresentation.calculateBounds().getHeight();
					self.maxDist = width < height ? width : height;
					self.maxDist /= 2;

					self.requestResults();
				}
			}, OpenRouteService.Gui.Search.DONE_TYPING_INTERVAL);
		}
	},
	hide : function() {
		this.htmlRepresentation.hide();
		//remove the results from the map
		var layerPoi = this.mapRepresentation.getLayersByName(OpenRouteService.Map.POI)[0];
		layerPoi.clearMarkers();
	},
	show : function() {
		this.htmlRepresentation.show();
	},
	/**
	 * send the request for POI search.
	 * Later calls updateResults() to display POIs on screen
	 */
	requestResults : function() {
		this.errorContainer.hide();

		this.openLSRequestCounter++;
		var self = this;
		var poiService = new OpenRouteService.OpenLS.Poi();
		poiService.buildRequest(OpenRouteService.Preferences.language, this.searchfield.value, this.refPoint, this.maxDist);
		poiService.requestData(
		//callback
		function() {
			self.openLSRequestCounter--;
			if (self.openLSRequestCounter == 0) {
				self.searchfield.removeClassName('searching');
				var txt = OpenRouteService.Preferences.reverseTranslate(self.searchfield.value);
				//isCategory returns null if it's neither type nor category -> POI by name
				self.options.poisNearRoute = document.getElementById('searchNearRoute').checked == true || null == OpenRouteService.Util.isPoiCategory(OpenRouteService.Preferences.reverseTranslate(self.searchfield.value));
				self.options.distanceUnit = OpenRouteService.Preferences.distanceUnit;
				self.options.distanceUnit = self.options.distanceUnit.substring(0, self.options.distanceUnit.indexOf('/')).trim();

				var searchResponse = poiService.getResponse(self.options, self.resultClickOperation);
				self.updateResults(searchResponse);
			}
		});
	},
	/**
	 * Method: updateResults
	 * Update results based on current state of this.request.
	 * @param response: List of ORS.Gui.SearchResult.Poi objects
	 */
	updateResults : function(response) {
		//wait for a click on the "useAsWaypoint"-button to add this result as waypoint
		response.each(function(waypoint, i) {
			Event.observe(response[i].useAsWaypoint, 'click', function() {
				self.useAsWaypoint(response[i]);
			});
		});
		this.results = response;

		if (this._resultsHtml) {
			try {
				this._resultsHtml.remove();
			} catch (e) {
			}
		}

		//setup html Repesentations
		this.results.htmlRepresentation = new Element('ul', {
			'class' : 'guiComponent resultList searchPoi'
		})
		var self = this;
		this.results.each(function(result) {
			self.results.htmlRepresentation.insert(result.htmlRepresentation);
		});

		this._resultsHtml = this.results.htmlRepresentation;

		//responseContainer is defined in ORS.Gui.Tools.SearchPoi
		this.responseContainer = document.getElementById('poiResponseContainer');
		this.responseContainer.insert(this.results.htmlRepresentation);
		this.responseContainer.show();

		//numberOfResults is defined in ORS.Gui.Tools.SearchPoi
		this.numberOfResults = document.getElementById('poiNumberOfResults');
		//remove all existing entries from previous searches
		var numChildNodes = this.numberOfResults.childNodes.length;
		for (var i = 0; i < numChildNodes; i++) {
			this.numberOfResults.removeChild(this.numberOfResults.childNodes[i]);
		}
		var newInformation = new Element('p');
		newInformation.insert(OpenRouteService.Preferences.translate('numPoiResults1') + this.results.length + OpenRouteService.Preferences.translate('numPoiResults2'));
		this.numberOfResults.appendChild(newInformation);
		this.numberOfResults.show();

		if (this.mapResults) {
			try {
				this.mapResults.destroy();
			} catch (e) {
			}
		}

		var layerPoi = this.mapRepresentation.getLayersByName(OpenRouteService.Map.POI)[0];
		this.results.each(function(result) {
			layerPoi.addMarker(result.mapRepresentation);
		});
	},
	getSearchFieldContent : function() {
		return this.searchfield.value
	},
	setResultClickOperation : function(resultClickOperation) {
		this.resultClickOperation = resultClickOperation;
	},
	/**
	 * observes the checkbox for the POI search (show POIs near route)
	 * if no route is present, an error message si displayed
	 */
	observeCheckbox : function() {
		if (document.getElementById('searchNearRoute').checked == true) {
			if (!route.routeInstance.routePresent) {
				document.getElementById('checkboxWarn').update(OpenRouteService.Preferences.translate('noRouteFound'));
				document.getElementById('checkboxWarn').show();
			}
		} else {
			document.getElementById('checkboxWarn').hide();
		}
	},
	/**
	 * observes the input field for the POI max distance.
	 * ORS only supports queries up to 5000m. If too large, an error message is displayed
	 */
	observeInputfield : function() {
		this.distMeasure = document.getElementById('distMeasurePoi').value;
		var dist = document.getElementById('maxDistToPoi').value;

		this.maxDist = OpenRouteService.Util.convertDistToMeters(dist, this.distMeasure);

		if (parseInt(this.maxDist) > 5000) {
			document.getElementById('inputWarn').update(OpenRouteService.Preferences.translate('distaneNotSupported'));
			document.getElementById('inputWarn').show();
		} else {
			document.getElementById('inputWarn').hide();
		}
	},
	/**
	 * when the user clicked on a POI result to select it as waypoint for the current route,
	 * this search object and the related SearchResults are added as new waypoint to the route object
	 */
	useAsWaypoint : function(selectedSearchResult) {
		var self = this;
		var routeInst = self.options.route.routeInstance;
		var wpCopy = routeInst.getNextAvailableWaypoint();

		wpCopy.shortTextRepresentation = selectedSearchResult.shortAddress;
		wpCopy.htmlRepresentation.removeClassName('highlight');

		//temporarily hide the "use as waypoint"-button or it will also be visible in the routing panel
		selectedSearchResult.useAsWaypoint.hide();
		var sr = Element.clone(selectedSearchResult.htmlForWaypoint, true);
		selectedSearchResult.useAsWaypoint.show();

		wpCopy.searchResult.update(sr);
		sr.removeClassName('highlight');

		var lonlat = selectedSearchResult.lonlat;
		lonlat.transform(new OpenLayers.Projection(this.options.map.getProjection()), new OpenLayers.Projection('EPSG:4326'));
		wpCopy.setPosition(lonlat.lon, lonlat.lat);

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

		//clean search: erase search request and results, remove markers
		self.searchfield.value = "";
		self.results = null;
		self.responseContainer.hide();

		var layerPoi = this.mapRepresentation.getLayersByName(OpenRouteService.Map.POI)[0];
		layerPoi.clearMarkers();

		self.numberOfResults.hide();

		//switch to routing tab
		document.fire('showRoutePanel:clicked');
	},
	/**
	 * when an error occurs during fetching of POI data, inform the user
	 */
	displayServerError : function() {
		document.getElementById('searchPoiError').setAttribute('class', 'alert alert-error');
		document.getElementById('searchPoiError').update(OpenRouteService.Preferences.translate('serverError'));
		document.getElementById('searchPoiError').show();
	}
});
