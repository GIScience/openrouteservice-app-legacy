/**
 * Represents GUI elements that could be collapsed. This applies e.g. for the route description.
 * Supported features are explicit collapsing or expanding and toggeling (collapse or expand; use appropriate function)
 */
OpenRouteService.Gui.Collapsible = Class.create(OpenRouteService.Gui, {
	init : function() {
		this.head = new Element('div', {
			'class' : 'collapsibleHead clickable'
		});

		this.body = new Element('div', {
			'class' : 'collapsibleBody'
		});
		this.htmlRepresentation = new Element('div', {
			'class' : 'collapsible guiComponent'
		}).insert(this.head).insert(this.body);

		this.head.observe('click', this.toggleExpandCollapse.bind(this));
	},
	collapse : function() {
		this.body.hide();
		this.head.addClassName('collapsed');
	},
	expand : function() {
		this.body.show();
		this.head.removeClassName('collapsed');
	},
	toggleExpandCollapse : function() {
		if(this.head.hasClassName('collapsed')) {
			this.expand();
		} else {
			this.collapse();
		}
	}
});
