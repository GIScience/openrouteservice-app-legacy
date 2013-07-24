( function() {

	//extensions to OpenLayers
	

	// external code source: http://spatialnotes.blogspot.com/2010/11/capturing-right-click-events-in.html
	// Get control of the right-click event:
	// A control class for capturing click events...
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

}());
