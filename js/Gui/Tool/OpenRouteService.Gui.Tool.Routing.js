OpenRouteService.Gui.Tool.Routing = Class.create(OpenRouteService.Gui.Tool, {
	initialize : function(options) {
		var self = this;
		options = options || {};
		options.id = options.id || 'none';
		this.id = options.id || 'none';
		var panelId = options.id + 'Panel' || 'none';

		this.htmlRepresentation = new Element('div', {
			'id' : panelId
		});

		this.routeInstance = new OpenRouteService.Gui.Route(options);
		this.htmlRepresentation.insert(this.routeInstance.htmlRepresentation);
	},
	calculateRoute : function() {
		return this.routeInstance.calculateRoute();
	}
});