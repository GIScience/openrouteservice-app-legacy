/**
 * Panels are containers for groups of Tools, e.g. routing tools or search tools (place search, POI search)
 * they contain objects of ORS.Gui.Tool
 */
OpenRouteService.Gui.Panel = Class.create(OpenRouteService.Gui, {
	initialize : function(options) {
		var self = this;
		options = options || {};
		var panelId = options.id + 'Panel' || 'none';

		//container for the panel content
		this.htmlRepresentation = new Element('div', {
			'id' : panelId
		});
		
		//panel tab with name
		this.navTab = new Element('li');
		this.navTab.innerHTML = "<a href='#'><img src='" + options.img + "' class='menuIcon'/>" + options.title + "</a>";
		this.navTab.observe('click', function() {
			//fire an event to hide all panels
			document.fire('togglePanels:clicked');
			//except this one
			self.showPanel();
		});
		document.getElementById('functionMenu').appendChild(this.navTab);
		
		//is panel visible on startup?
		if (options.visible == true || options.visible == 'true') {
			this.showPanel();
		} else {
			this.hidePanel();
		}
		
		//handle click event -> hide all tabs
		document.observe('togglePanels:clicked', function() {
			self.hidePanel(); //.bind(this);
		});
	},
	hidePanel : function() {
		this.navTab.setAttribute('class', '');
		this.htmlRepresentation.hide();
	},
	showPanel : function() {
		this.navTab.setAttribute('class', 'active');
		this.htmlRepresentation.show();
	}
});