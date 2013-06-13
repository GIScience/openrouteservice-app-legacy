/**
 *contains a single instruction as part of a route. This is applied to ORS.Gui.Collapsible.RouteInstructions
 */
OpenRouteService.Gui.Instruction = Class.create(OpenRouteService.Gui, {
	instructionLine : null,
	instructionPoint : null,

	htmlRepresentation : null,

	instructionCell : null,
	distanceCell : null,

	initialize : function(instruction, distance, lineString, pos, description, distUnit, route) {
		//map stuff
		var lineString = OpenRouteService.convert.gml2ol.lineString2lineString(lineString, route.options.map.getProjection());
		this.instructionLine = new OpenLayers.Feature.Vector(lineString, null, OpenRouteService.Gui.Instruction.Style.line['default']);

		var point = OpenRouteService.convert.gml2ol.pos2point(pos, route.options.map.getProjection());
		this.instructionPoint = new OpenLayers.Feature.Vector(point, null, OpenRouteService.Gui.Instruction.Style.point['default']);

		//html stuff
		var content = instruction.textContent || instruction.text;
		this.htmlRepresentation = new Element('tr');

		//arrow direction
		var arrowCell = new Element('td');
		var left = content.indexOf(OpenRouteService.Preferences.translate('left'));
		var right = content.indexOf(OpenRouteService.Preferences.translate('right'));
		if (left > 0 && left > right) {
			var direction = new Element('img', {
				'src' : './img/left.png'
			});
			arrowCell.insert(direction);
		} else if (right > 0 && right > left) {
			var direction = new Element('img', {
				'src' : './img/right.png'
			});
			arrowCell.insert(direction);
		}
		this.htmlRepresentation.insert(arrowCell);

		//instruction number
		this.htmlRepresentation.insert(new Element('td').update(description));
		if (description % 2 === 0) {
			this.htmlRepresentation.addClassName('even');
		} else {
			this.htmlRepresentation.addClassName('odd');
		}
		
		//instruction text
		var instructionCell = new Element('td', {
			'class' : 'clickable routeInstructions'
		}).update(content);
		this.htmlRepresentation.insert(instructionCell);
		//make it available for event handling in ORS.Gui.Collapsible.RouteInstructions class
		this.instructionCell = instructionCell;

		var distStr = distance.getAttribute('value');
		var uom = distance.getAttribute('uom');
		if (distUnit == OpenRouteService.List.distanceUnitsRoute[0]) {
			//use mixture of km and m
			//convert to easy to read format
			var distArr = OpenRouteService.convert.units.distance2hr(distStr, distUnit);
		} else {
			//use mixture of miles and yards
			var yardsUnit = 'yd';
			var distMeasure = OpenRouteService.Util.convertDistToDist(distStr, uom, yardsUnit);
			var distArr = OpenRouteService.convert.units.distance2hr(distMeasure, distUnit);
		}
		var dist = distArr[0] + ' ' + distArr[1].toLowerCase();
		var distCell = new Element('td', {
			'class' : 'clickable'
		}).update(dist);
		this.htmlRepresentation.insert(distCell);
		//make it available for event handling in ORS.Gui.Collapsible.RouteInstructions class
		this.distanceCell = distCell;

		//event handling can be found in ORS.Gui.Collapsible.RouteInstructions class
	}
});

OpenRouteService.Gui.Instruction.Style = {
	line : {
		'default' : {
			strokeColor : "#fba400",
			strokeWidth : 5,
			strokeOpacity : 1,
			strokeDashstyle : 'solid',
			cursor : "pointer",
			display : 'none',
			graphicZIndex : 1
		},
		'select' : {
			strokeColor : "#fba400",
			strokeWidth : 3,
			strokeOpacity : 1,
			strokeDashstyle : 'solid',
			cursor : "pointer",
			display : 'true',
			graphicZIndex : 4
		}
	},
	point : {
		'default' : {
			pointRadius : 4,
			fillOpacity : 1,
			strokeWidth : 0,
			strokeColor : '#009ad5',
			fillColor : '#009ad5',
			graphicZIndex : 2
		},
		'select' : {
			pointRadius : 6,
			strokeOpacity : 1,
			strokeWidth : 2,
			strokeColor : '#009ad5',
			fillColor : '#fba400',
			graphicZIndex : 3
		}
	}
}
