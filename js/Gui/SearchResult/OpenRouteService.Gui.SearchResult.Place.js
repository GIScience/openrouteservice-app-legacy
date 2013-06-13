OpenRouteService.Gui.SearchResult.Place = Class.create(OpenRouteService.Gui.SearchResult, {
	//position in <gml:point> form
	point: null,
	//address in <xls:address> form
	address: null,
	//position in {<LonLat>} form
	lonlat: null,
	mapRepresentation: null,
	//address information in <div> form
	htmlRepresentation: null,
	shortAddress : null,
	//
	resultClickOperation: function () {},
	/**
	 * Constructor: OpenRouteService.Gui.SearchResult.Place
	 * Create a new route..
	 *
	 * Parameters:
	 * options - An Object conaining options as name: value pairs.
	 */
	initialize : function(options, point, address, position) {
		var self = this;
		this.options = options;
		this.point = point;
		this.address = address;

		this.htmlRepresentation = OpenRouteService.convert.xls2html.address2div(this.address);
		this.shortAddress = OpenRouteService.convert.xls2html.address2shortText(this.address);
		
		if (this.options.routing == false) {
			//only add the "use as waypoint"-button if we are in search panel (not in routing tab)
			this.useAsWaypoint = new Element('span', {
			'class' : 'clickable useAsWaypoint',
			'title' : OpenRouteService.Preferences.translate('useAsWaypoint')
			}).observe('click', this.useAsWaypoint.bind(this));
			this.htmlRepresentation.insert(this.useAsWaypoint);
		}
		
		this.lonlat = OpenRouteService.convert.gml2ol.pos2lonLat(position, this.options.map.getProjection());
		var icons = OpenRouteService.Gui.icons;
		this.mapRepresentation = new OpenLayers.MarkerEm(this.lonlat, icons.result, icons.resultEm);
			//highlight the result on mouseover
		$(this.htmlRepresentation).observe('mouseover', function() {
			//o.results[i].mapRepresentation.highlighter('start');
			self.mapRepresentation.emphasise();
			self.htmlRepresentation.addClassName('highlight')
			//self.htmlRepresentation.style.backgroundColor = 'rgba(200,200,255,0.3)';
		});
		//stop highlighting on mouseout
		$(this.htmlRepresentation).observe('mouseout', function() {
			self.mapRepresentation.deemphasise();
			self.htmlRepresentation.removeClassName('highlight')
			//self.htmlRepresentation.style.backgroundColor = null;
		});
		$(this.htmlRepresentation).observe('click', function() {
			if(self.resultClickOperation && typeof self.resultClickOperation === 'function' && !self.htmlRepresentation.hasClassName('resultMode')) {
				self.resultClickOperation(self);
			}
		});		
	},
	setResultClickOperation : function(resultClickOperation) {
		this.resultClickOperation = resultClickOperation;
	}
});