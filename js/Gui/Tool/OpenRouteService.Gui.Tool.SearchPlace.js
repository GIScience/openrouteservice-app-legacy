/**
 * GUI class for search tool "search for place or address"
 */
OpenRouteService.Gui.Tool.SearchPlace = Class.create(OpenRouteService.Gui.Tool, {
	initialize : function(options) {
		var self = this;
		options = options || {};

		this.htmlRepresentation = new Element('div', {
			'id' : options.id || 'none'
		});

		this.htmlRepresentation.update(new Element('div', {
			'class' : 'toolHeading'
		}).update(options.title));

		//this search is used for simple searching, not to find routing waypoints
		options.routing = false;
		this.Search = new OpenRouteService.Gui.SearchPlace(options);
		this.htmlRepresentation.insert(this.Search.htmlRepresentation);
	}
});