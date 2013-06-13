/**
 * Class: OpenRouteService.Gui.SearchResult
 * This class represents a geocoding search result for use within a search tool.
 * see class OpenRouteService.Gui.Search
 */
OpenRouteService.Gui.SearchResult = Class.create(OpenRouteService.Gui, {
	/**
	 * use this searchResult as waypoint for a route (will be added as last waypoint)
	 */
	useAsWaypoint : function() {
		var self = this;
		self.useAsWaypoint.fire('click');
	}
});
