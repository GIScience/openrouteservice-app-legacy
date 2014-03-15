/**
 * extensions to OpenLayers 
 */
( function() {
	/**
	 * external code source: http://spatialnotes.blogspot.com/2010/11/capturing-right-click-events-in.html
	 * Get control of the right-click event:
	 * A control class for capturing click events...
	 */
	
	OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {

		defaultHandlerOptions : {
			'single' : true,
			'double' : true,
			'pixelTolerance' : 0,
			'stopSingle' : false,
			'stopDouble' : false
		},
		
		handleRightClicks : true,
		initialize : function(options) {
			this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
			OpenLayers.Control.prototype.initialize.apply(this, arguments);
			this.handler = new OpenLayers.Handler.Click(this, this.eventMethods, this.handlerOptions);
		},
		CLASS_NAME : "OpenLayers.Control.Click"
	});
	
	/**
	 * extend a LonLat point with an elevation attribute 
	 */
	OpenLayers.LonLat.Ele = OpenLayers.Class(OpenLayers.LonLat, {
		lon : null,
		// lat : double,
		// elevation : double, 
		
		initialize : function(lon, lat, ele) {
			this.lon = lon;
			this.lat = lat;
			this.ele = ele; 
		},		
		CLASS_NAME : "OpenLayers.LonLat.Ele"
	})
}());
