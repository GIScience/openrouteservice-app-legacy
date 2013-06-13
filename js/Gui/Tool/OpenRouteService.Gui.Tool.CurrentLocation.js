/**
 * GUI class for showing the user's current location on the map (retrieved by HTML5 Geolocation feature)
 */
OpenRouteService.Gui.Tool.CurrentLocation = Class.create(OpenRouteService.Gui.Tool, {
	initialize : function(options) {
		var self = this;
		options = options || {};

		this.htmlRepresentation = new Element('div', {
			'id' : options.id || 'none'
		});

		this.htmlRepresentation.update(new Element('div', {
			'class' : 'toolHeading'
		}).update(options.title));

		this.geolocation = new OpenRouteService.Gui.Geolocation(options);
		this.htmlRepresentation.insert(this.geolocation.htmlRepresentation);
	}
});