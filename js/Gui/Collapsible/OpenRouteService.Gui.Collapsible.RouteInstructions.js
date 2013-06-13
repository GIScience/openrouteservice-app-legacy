/**
 * Class: OpenRouteService.Gui.Collapsible.RouteInstructions
 * This class represents a set of RouteInstructions.
 */
OpenRouteService.Gui.Collapsible.RouteInstructions = Class.create(OpenRouteService.Gui.Collapsible, {
	/**
	 * Is called by OpenRouteService.Gui.Route
	 * @param routeInstructions - a list of ORS.Gui.Instruction elements
	 * @param distUnit: currently selected distance unit (e.g. meters/ yards)
	 * @param route: the ORS.Gui.Route object that receives this instructoins
	 */
	initialize : function(options, routeInstructions, route) {
		this.options = options;
		this.init();

		//we have to wrap the head and the zoomToRoute in a container. Otherwise the margin of the RouteInstructionPanel looks ugly (due to float:left param)
		this.headContainer = new Element('div');
		this.headContainer.update('&nbsp;');
		Element.replace(this.head, this.headContainer);

		this.head.update(OpenRouteService.Preferences.translate('routeInstructions') + ':');
		this.head.setAttribute('id', 'routeInstructionHead');
		this.headContainer.insert(this.head);

		//place a zoom to whole route object next to Route instructions header
		this.zoomToRouteButton = new Element('div', {
			'id' : 'zoomToRouteButton',
			'class' : 'zoomToRoute clickable'
		});
		this.zoomToRouteButton.textContent = OpenRouteService.Preferences.translate('zoomToRoute');

		this.zoomToRouteButton.observe('click', function() {
			route.zoomToRoute();
		});
		this.headContainer.insert(this.zoomToRouteButton);

		this.fromTo = new Element('div', {
			'id' : 'routeFromTo'
		});

		var endWaypoint = route.waypoints[route.waypoints.length - 1];
		var addText = endWaypoint.shortTextRepresentation;
		this.fromTo.textContent = OpenRouteService.Preferences.translate("routeFromTo") + addText
		this.body.insert(this.fromTo);

		this.instructions = new Element('table');
		this.body.insert(this.instructions);

		this.mapRepresentation = route.map.getLayersByName(OpenRouteService.Map.ROUTE_INSTRUCTIONS)[0];
		this.mapRepresentation.removeAllFeatures();

		this.instructionPoints = [];
		this.instructionLines = [];
		this.distCells = [];
		this.instructionCells = [];

		//process each instruction
		var self = this;
		$A(routeInstructions).each(function(instruction) {
			//add line string
			self.instructionLines.push(instruction.instructionLine);
			self.mapRepresentation.addFeatures([instruction.instructionLine]);
			//add point
			self.instructionPoints.push(instruction.instructionPoint);
			self.mapRepresentation.addFeatures([instruction.instructionPoint]);

			//html
			self.instructionCells.push(instruction.instructionCell);
			self.distCells.push(instruction.distanceCell);
			self.instructions.insert(instruction.htmlRepresentation);

			//event handling
			var style = OpenRouteService.Gui.Instruction.Style;
			$(instruction.distanceCell).observe('click', function() {
				self.instructionLines.each(function(line) {
					line.style = style.line['default'];
				})
				self.distCells.reject(function(cell) {
					return cell === instruction.distanceCell
				}).each(function(distCell) {
					distCell.highlighted = false;
					distCell.removeClassName('active');
				});
				if (instruction.distanceCell.highlighted) {
					instruction.distanceCell.highlighted = false;
					instruction.instructionLine.style = style.line['default'];
					instruction.distanceCell.removeClassName('active');
				} else {
					instruction.distanceCell.highlighted = true;
					instruction.instructionLine.style = style.line['select'];
					instruction.distanceCell.addClassName('active');
					self.options.map.zoomBoxToExtent(OpenRouteService.Ui.Elements.getFreeSpace(), instruction.instructionLine.geometry.bounds);
					if (self.options.map.getZoom() > 16) {
						self.options.map.zoomTo(16);
					}
				}
				self.mapRepresentation.redraw();
			});

			$(instruction.distanceCell).observe('mouseover', function() {
				if (!instruction.distanceCell.highlighted) {
					instruction.instructionLine.style = style.line['select'];
					instruction.distanceCell.addClassName('active');
					self.mapRepresentation.redraw();
				}
			});
			$(instruction.distanceCell).observe('mouseout', function() {
				if (!instruction.distanceCell.highlighted) {
					instruction.instructionLine.style = style.line['default'];
					instruction.distanceCell.removeClassName('active');
					self.mapRepresentation.redraw();
				}
			});

			$(instruction.instructionCell).observe('click', function() {
				self.instructionPoints.each(function(point) {
					point.style = style.point['default'];
				});
				self.instructionCells.each(function(cell) {
					if (cell !== instruction.instructionCell) {
						cell.highlighted = false;
						cell.removeClassName('active')
					}
				});
				if (instruction.instructionCell.highlighted) {
					instruction.instructionCell.highlighted = false;
					instruction.instructionPoint.style = style.point['default'];
					instruction.instructionCell.removeClassName('active');
				} else {
					instruction.instructionCell.highlighted = true;
					instruction.instructionPoint.style = style.point['select'];
					instruction.instructionCell.addClassName('active');
					self.options.map.zoomBoxToExtent(OpenRouteService.Ui.Elements.getFreeSpace(), instruction.instructionPoint.geometry.bounds);
					if (self.options.map.getZoom() > 16) {
						self.options.map.zoomTo(16);
					}
				}
				self.mapRepresentation.redraw();
			});

			$(instruction.instructionCell).observe('mouseover', function() {
				if (!instruction.instructionCell.highlighted) {
					instruction.instructionPoint.style = style.point['select'];
					instruction.instructionCell.addClassName('active');
					self.mapRepresentation.redraw();
				}
			});
			$(instruction.instructionCell).observe('mouseout', function() {
				if (!instruction.instructionCell.highlighted) {
					instruction.instructionPoint.style = style.point['default'];
					instruction.instructionCell.removeClassName('active');
					self.mapRepresentation.redraw();
				}
			});
		});

		this.collapse();

		//it may happen that the route calculation is done before geocoding. If so, the "fromTo" element will show "route to null".
		//To prevent this from happening, look up the destination after a time interval:
		if (addText == null) {
			setTimeout(function() {
				addText = endWaypoint.shortTextRepresentation;
				self.fromTo.textContent = OpenRouteService.Preferences.translate("routeFromTo") + addText;
			}, 800)
		}
	}
});
