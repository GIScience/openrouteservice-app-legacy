/**
 * holds references to instanciated UI elements
 */
OpenRouteService.Ui.Elements = {
	
		/**
		 * @return corners of the map to show search results or the route in
	 	*/
		getFreeSpace : function() {
			var mapElement = document.getElementById('openlayers');
			return [mapElement.offsetLeft, mapElement.offsetHeight, mapElement.offsetWidth, mapElement.offsetTop];
		}
};
