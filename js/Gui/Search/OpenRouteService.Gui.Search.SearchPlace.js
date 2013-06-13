/**
 * GUI component to search for places.
 * The search functionality is visible in an own panel.
 */
OpenRouteService.Gui.SearchPlace = Class.create(OpenRouteService.Gui, {
	searchfield : null,
	responseContainer : null,
	mapRepresentation : null,
	resultClickOperation : function() {
	},
	//array of ORS.Gui.SearchResult.Place
	results : null,
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
		var selectPrompt = this.options.selectPrompt || '';
		this.openLSRequestCounter = 0;

		//what to do with the result of a successful request
		var successCallback = function() {
			self.updateResults();
		};

		this.htmlRepresentation = new Element('div', {
			'class' : 'guiComponent Search'
		});
		this.searchfield = new Element('input', {
			'type' : 'text',
			'class' : 'searchField',
			'placeholder' : OpenRouteService.Preferences.translate('enterAddress')
		});
		this.htmlRepresentation.insert(this.searchfield);

		this.mapResults = new OpenLayers.Layer.Markers('Search Results');

		this.zoomToSearchResultsButton = new Element('div', {
			'class' : 'clickable zoomToSearchResults',
			'title' : OpenRouteService.Preferences.translate('zoomToSearchResults')
		}).update(OpenRouteService.Preferences.translate('zoomToSearchResults'));

		//this.htmlRepresentation.insert(this.zoomToSearchResultsButton);
		$(this.zoomToSearchResultsButton).observe('click', function() {
			self.zoomToSearchResults();
		});

		this.responseContainer = new Element('div', {
			'class' : 'responseContainer'
		});
		this.htmlRepresentation.insert(this.responseContainer);
		this.selectResultPrompt = new Element('div', {
			'class' : 'prompt selectSearchResult'
		}).update(selectPrompt);
		this.responseContainer.insert(this.selectResultPrompt.hide());
		this.responseContainer.insert(this.zoomToSearchResultsButton.hide());

		//a timeout prevents the page from calling the search function constantly while still typing.
		var typingTimer;
		var self = this;
		Event.observe(this.searchfield, 'keyup', function(e) {
			clearTimeout(typingTimer);
			if (e.keyIdentifier != 'Shift' && self.searchfield.value) {
				typingTimer = setTimeout(function() {
					self.openLSRequestCounter++;
					self.searchfield.addClassName('searching');
					document.getElementById('searchPlaceError').hide();
					var layerSearch = self.mapRepresentation.getLayersByName(OpenRouteService.Map.SEARCH)[0];
					layerSearch.clearMarkers();

					var geocodeService = new OpenRouteService.OpenLS.Geocode();
					geocodeService.buildRequest(self.searchfield.value, OpenRouteService.Preferences.language);
					geocodeService.requestData(
					//callback
					function() {
						self.openLSRequestCounter--;
						if (self.openLSRequestCounter == 0) {
							var searchResponse = geocodeService.getResponse(self.options, self.resultClickOperation);
							self.updateResults(searchResponse);
							self.searchfield.removeClassName('searching');
							if (geocodeService.hasErrors) {
								//TODO display error message
							}
						}
					});
				}, OpenRouteService.Gui.Search.DONE_TYPING_INTERVAL);
			}
		});

		document.observe('placeServerError:clicked', function() {
			self.displayServerError();
		});
	},

	hide : function() {
		this.htmlRepresentation.hide();
		//remove the results from the map
		var layerSearch = this.mapRepresentation.getLayersByName(OpenRouteService.Map.SEARCH)[0];
		layerSearch.clearMarkers();
	},
	show : function() {
		this.htmlRepresentation.show();
	},
	/**
	 * Method: updateResults
	 * Update results based on current state of this.request.
	 * @param response: list of ORS.Gui.SearchResult.Place objects
	 */
	updateResults : function(response) {
		//wait for a click on the "useAsWaypoint"-button to add this result as waypoint
		if (this.options.routing == false) {
			response.each(function(waypoint, i) {
				Event.observe(response[i].useAsWaypoint, 'click', function() {
					self.useAsWaypoint(response[i]);
				});
			});
		}
		this.results = response;

		if (this._resultsHtml) {
			try {
				this._resultsHtml.remove();
			} catch (e) {
			}
		}

		//setup html Repesentations
		this.results.htmlRepresentation = new Element('ul', {
			'class' : 'guiComponent resultList SearchAddress'
		});
		var self = this;
		response.each(function(result) {
			self.results.htmlRepresentation.insert(result.htmlRepresentation);
		});

		this._resultsHtml = this.results.htmlRepresentation;

		this.responseContainer.insert(this.results.htmlRepresentation);
		this.responseContainer.show();

		if (this.results.length > 0) {
			this.zoomToSearchResultsButton.show();
			this.selectResultPrompt.show();
		} else {
			this.zoomToSearchResultsButton.hide();
			this.selectResultPrompt.hide();
		}

		if (this.mapResults) {
			try {
				this.mapResults.destroy();
			} catch (e) {
			}
		}

		var layerSearchResults = this.mapRepresentation.getLayersByName(OpenRouteService.Map.SEARCH)[0];
		this.results.each(function(result) {
			layerSearchResults.addMarker(result.mapRepresentation);
		});

		if (this.results.length == 1) {
			//if we have only one result, immediately select it (useful for route calculation)
			this.resultClickOperation(this.results[0]);
		}

		this.zoomToSearchResults();
	},
	zoomToSearchResults : function() {
		var layerSearchResults = this.mapRepresentation.getLayersByName(OpenRouteService.Map.SEARCH)[0];
		this.options.map.zoomBoxToExtent(OpenRouteService.Ui.Elements.getFreeSpace(), layerSearchResults.getDataExtent());
		if (this.options.map.getZoom() > 14) {
			this.options.map.zoomTo(14);
		}
	},
	getSearchFieldContent : function() {
		return this.searchfield.value
	},
	setResultClickOperation : function(resultClickOperation) {
		this.resultClickOperation = resultClickOperation;
	},
	/**
	 * used by ORS.Gui.Waypoints when searching reverseGeocode to remove previous search results (are no longer accurate)
	 * removes map markers and results in list
	 */
	clearResults : function() {
		if (this.results) {
			this.responseContainer.remove(this.results.htmlRepresentation);
			this.results = null;
		}
		this.mapResults = new OpenLayers.Layer.Markers('Search Results');
		this.searchfield.value = "";
	},
	/**
	 * when the user clicked on a search result to select it as waypoint for the current route,
	 * this search object and the related SearchResults are added as new waypoint to the route object
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

		//clean search: erase search request and results, remove markers
		this.searchfield.value = "";
		this.results = null;
		this.responseContainer.hide();
		var layerSearch = this.mapRepresentation.getLayersByName(OpenRouteService.Map.SEARCH)[0];
		layerSearch.clearMarkers();

		//switch to routing tab
		document.fire('showRoutePanel:clicked');
	},
	/**
	 * when an error occurs during fetching of search result data, inform the user
	 */
	displayServerError : function() {
		document.getElementById('searchPlaceError').setAttribute('class', 'alert alert-error');
		document.getElementById('searchPlaceError').update(OpenRouteService.Preferences.translate('serverError'));
		document.getElementById('searchPlaceError').show();
	}
});
