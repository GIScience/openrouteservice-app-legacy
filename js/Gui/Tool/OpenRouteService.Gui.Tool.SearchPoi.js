/**
 * GUI class for search tool "search for POI"
 */
OpenRouteService.Gui.Tool.SearchPoi = Class.create(OpenRouteService.Gui.Tool, {
	initialize : function(options) {
		var self = this;
		options = options || {};

		this.htmlRepresentation = new Element('div', {
			'id' : options.id || 'none'
		});

		this.htmlRepresentation.update(new Element('div', {
			'class' : 'toolHeading'
		}).update(options.title));


		//checkbox with input field: "search within xy meters/km/yd/... next to route"
		var poiNearRoute = new Element('span', {
			'id' : 'poiNearRoute'
		});
		
		//checkbox whether to search near route or in visible map
		var check = new Element('input', {
			'type' : 'checkbox',
			'class' : 'checkbox',
			'id' : 'searchNearRoute'
		});
		check.checked = false;
		check.observe('click', function() {
			self.SearchPoi.observeCheckbox();
			self.SearchPoi.observeSearchfieldInput();
		});
		
		//input field to measure the distance to route
		var distanceToRoute = new Element('input', {
			'type' : 'text',
			'id' : 'maxDistToPoi',
			'class' : 'textfield',
			'value' : '100'
		});
		distanceToRoute.observe('keyup', function() {
			self.SearchPoi.observeInputfield();
			
			if (document.getElementById('searchNearRoute').checked == true) {
				self.SearchPoi.observeSearchfieldInput();
			}
		});
		
		//dropdown box to select the measurement of the distance (meters, miles, kilometers,...)
		var distanceMeasure = new Element('select', {
			'id' : 'distMeasurePoi'
		});
		var units = OpenRouteService.List.distanceUnits;
		for (var i = 0; i < units.length; i++) {
			distanceMeasure.add(new Option(units[i], units[i]), null);
		}
		distanceMeasure.observe('change', function() {
			self.SearchPoi.observeInputfield();
			
			if (document.getElementById('searchNearRoute').checked == true) {
				self.SearchPoi.observeSearchfieldInput();
			}
		});

		poiNearRoute.insert(check);		
		poiNearRoute.insert("&nbsp;" + OpenRouteService.Preferences.translate("poiNearRoute1"));
		poiNearRoute.insert(distanceToRoute);
		poiNearRoute.insert(distanceMeasure);
		poiNearRoute.insert(OpenRouteService.Preferences.translate("poiNearRoute2"));
		this.htmlRepresentation.insert(poiNearRoute);
		
		//search input field
		this.SearchPoi = new OpenRouteService.Gui.SearchPoi(options);
		this.htmlRepresentation.insert(this.SearchPoi.htmlRepresentation);
		
		//area to show number of results
		this.numberOfResults = new Element('div', {
			'id' : 'poiNumberOfResults'
		}).hide();
		this.htmlRepresentation.insert(this.numberOfResults);
		
		//area to display results
		this.responseContainer = new Element('div', {
			'class' : 'responseContainer panel panelMedium',
			'id' : 'poiResponseContainer'
		}).hide();
		this.htmlRepresentation.insert(this.responseContainer);
	}
});