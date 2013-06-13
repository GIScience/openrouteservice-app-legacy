/**
 * GUI components/ containers for different tools: routing, search, accessibiity and layers
 */
OpenRouteService.Gui.Tool = Class.create(OpenRouteService.Gui, {
	//
});

//TODO not in use now.
/**
 * GUI class for accessibility tools
 */
OpenRouteService.Gui.Tool.Accessibility = Class.create(OpenRouteService.Gui.Tool, {
	initialize : function(options) {
		var self = this;
		options = options || {};

		this.htmlRepresentation = new Element('div', {
			'id' : options.id || 'none'
		});

		var t = '<br>';
		for(var i = 0; i < 50; ++i) {
			t += 'text<br>'
		};
		this.htmlRepresentation.update('Accessibility Tool' + t);
	}
});
