/**
 * Class: OpenRouteService.Gui.Collapsible.RouteSummary
 * This class represents a route summary as set of RouteInstructions
 */
OpenRouteService.Gui.Collapsible.RouteSummary = Class.create(OpenRouteService.Gui.Collapsible, {
	distUnit : null,
	/**
	 * Is called by OpenRouteService.Gui.Route
	 *
	 * Parameters:
	 * @param totalTime: String containint the total time required for the route
	 * @param totalDistance: object with information about the distance of the route
	 * @param disUnit: selected distance unit (meters, yards,..)
	 */
	initialize : function(totalTime, totalDistance, distUnit) {
		this.distUnit = distUnit;
		this.init();

		this.head.update(OpenRouteService.Preferences.translate('routeSummary') + ':');

		//lifted from the old site:
		//<period>PT5Y2M10D15H18M43S</period>
		//The example above indicates a period of five years, two months, 10 days, 15 hours, a8 minutes and 43 seconds
		function getTimeString(duration) {

			//cut the seconds off!
			duration = duration.substring(0, duration.indexOf('M') + 1);
			duration = duration.replace('P', '');
			duration = duration.replace('T', '');
			duration = duration.replace('D', ' ' + OpenRouteService.Preferences.translate('days') + ' ');
			duration = duration.replace('H', ' ' + OpenRouteService.Preferences.translate('hours') + ' ');
			duration = duration.replace('M', ' ' + OpenRouteService.Preferences.translate('minutes') + ' ');
			//duration = duration.replace('S', ' second(s)');

			return duration;
		}//lifted

		var distance = totalDistance.getAttribute('value');
		var uom = totalDistance.getAttribute('uom');
		var distArr = [];
				
		if (this.distUnit == OpenRouteService.List.distanceUnitsRoute[0]) {
			//use mixture of km and m	
			distArr = OpenRouteService.convert.units.distance2hr(distance, this.distUnit);
		} else {
			//use mixture of miles and yards
			var yardsUnit = 'yd';
			var distMeasure = OpenRouteService.Util.convertDistToDist(distance, uom, yardsUnit);
			distArr = OpenRouteService.convert.units.distance2hr(distMeasure, this.distUnit);
		}
		this.body.insert(new Element('div').update(OpenRouteService.Preferences.translate('TotalTime') + ': ~' + getTimeString(totalTime)));
		this.body.insert(new Element('div').update(OpenRouteService.Preferences.translate('TotalDistance') + ': ' + distArr[0] + ' ' + OpenRouteService.Preferences.translate(distArr[1])));
	}
});