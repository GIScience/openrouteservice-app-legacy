/**
 * Class: OpenRouteService.Gui.Collapsible.AvoidAreas
 * This class represents avoid areas for the route.
 */
OpenRouteService.Gui.Collapsible.AvoidAreas = Class.create(OpenRouteService.Gui.Collapsible, {
	//TODO not in use so far...
	initialize : function(map, layer) {
		var self = this;
		this.init();

		this.head.update(OpenRouteService.Preferences.translate('avoidAreas') + ':<br>')

		this.draw = new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Polygon);
		this.modify = new OpenLayers.Control.ModifyFeature(layer)
		map.addControls([this.draw, this.modify]);

		this.avoidAreasControl = new Element('div')//.update('avoid areas controls');

		this.body.insert(this.avoidAreasControl);
		this.body.insert(new Element('span', {
			'class' : 'clickable'
		}).update('activate draw control<br />').observe('click', function() {
			self.draw.activate();
		}));

		this.body.insert(new Element('span', {
			'class' : 'clickable'
		}).update('deactivate draw control<br />').observe('click', function() {
			self.draw.finishSketch();
			self.draw.deactivate();
		}));

		this.body.insert(new Element('span', {
			'class' : 'clickable'
		}).update('activate modify control<br />').observe('click', function() {
			self.modify.activate();
		}));
	}
});