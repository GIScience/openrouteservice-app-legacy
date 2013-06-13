/**
 * GUI class representing the look and behavior of the right-click context menu on the map.
 * 3 Elements are visible: Add (selected point) as start/ via/ target.
 */
OpenRouteService.Gui.ContextMenu = Class.create(OpenRouteService.Gui, {
	//left upper corner of the regular dropdown box
	dopdownPositionX : 0,
	dropdownPositionY : 0,
	
	initialize : function(x, y) {
		var self = this;
		this.htmlRepresentation = new Element('div', {
			'class' : 'contextMenu',
			'id' : 'menuId'
		});
		//if map div does not start in the left upper corner -> calculate offset:
		var offsetX = document.getElementById('openlayers').offsetLeft;
		var offsetY = document.getElementById('openlayers').offsetTop;
		this.dropdownPositionX = x + offsetX;
		this.dropdownPositionY = y + offsetY;

		this.htmlRepresentation.style.top = this.dropdownPositionY + 'px';
		this.htmlRepresentation.style.left = this.dropdownPositionX + 'px';

		this.px = new OpenLayers.Pixel(x, y);

		var addStartPointText = new Element('span').update(OpenRouteService.Preferences.translate('useAsStartPoint'));
		var addStartPointDiv = new Element('div', {
			'class' : 'useAsStartPoint'
		}).insert(addStartPointText).observe('mouseover', function() {
			addStartPointDiv.addClassName('highlight')
		}).observe('mouseout', function() {
			addStartPointDiv.removeClassName('highlight')
		});
		;
		this.htmlRepresentation.insert(addStartPointDiv);
		addStartPointDiv.observe('click', function() {
			var position = self.route.options.map.getLonLatFromPixel(self.px).transform(new OpenLayers.Projection(self.route.options.map.getProjection()), new OpenLayers.Projection('EPSG:4326'));
			var wp = self.route.addStartWaypoint();
			wp.setPosition(position.lon, position.lat);
			self.removeAll();
		});
		var addViaPointText = new Element('span').update(OpenRouteService.Preferences.translate('useAsViaPoint'))
		var addViaPointDiv = new Element('div', {
			'class' : 'useAsViaPoint'
		}).insert(addViaPointText).observe('mouseover', function() {
			addViaPointDiv.addClassName('highlight')
		}).observe('mouseout', function() {
			addViaPointDiv.removeClassName('highlight')
		});
		this.htmlRepresentation.insert(addViaPointDiv);
		addViaPointDiv.observe('click', function() {
			var position = self.route.options.map.getLonLatFromPixel(self.px).transform(new OpenLayers.Projection(self.route.options.map.getProjection()), new OpenLayers.Projection('EPSG:4326'));
			var wp = self.route.addViaWaypoint();
			wp.setPosition(position.lon, position.lat);
			self.removeAll();
		});
		var addEndPointText = new Element('span').update(OpenRouteService.Preferences.translate('useAsEndPoint'))
		var addEndPointDiv = new Element('div', {
			'class' : 'useAsEndPoint'
		}).insert(addEndPointText).observe('mouseover', function() {
			addEndPointDiv.addClassName('highlight')
		}).observe('mouseout', function() {
			addEndPointDiv.removeClassName('highlight')
		});

		this.htmlRepresentation.insert(addEndPointDiv);
		addEndPointDiv.observe('click', function() {
			var position = self.route.options.map.getLonLatFromPixel(self.px).transform(new OpenLayers.Projection(self.route.options.map.getProjection()), new OpenLayers.Projection('EPSG:4326'));
			var wp = self.route.addEndWaypoint();
			wp.setPosition(position.lon, position.lat);
			self.removeAll();
		});

		return this;
	},
	insertIt : function() {
		//remove all context menus
		this.removeAll();
		document.body.insert(this.htmlRepresentation);
		
		var offsetToBottom = window.innerHeight - (this.dropdownPositionY + this.htmlRepresentation.clientHeight);
		var offsetToRight = window.innerWidth - (this.dropdownPositionX + this.htmlRepresentation.clientWidth);
		
		if (offsetToBottom < 3) {
			//move context menu up (display on top of mouse)
			this.htmlRepresentation.style.top = (this.dropdownPositionY - this.htmlRepresentation.clientHeight) + 'px';
			this.dropdownPositionY -= this.htmlRepresentation.clientHeight;
		}
		if (offsetToRight < 3) {
			//move context menu left (display left of mouse position)
			this.htmlRepresentation.style.left = (this.dropdownPositionX - this.htmlRepresentation.clientWidth) + 'px';
			this.dropdownPositionX -= this.htmlRepresentation.clientWidth;
		}
		
		return this;
	},
	setRoute : function(route) {
		this.route = route;
		return this;
	},
	removeAll : function() {
		$$('.contextMenu').each(function(cm) {
			cm.remove();
		});
	}
});
