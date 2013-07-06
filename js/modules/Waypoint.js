var Waypoint = (function(w) {'use strict';

	var position;
	var address;
	var pointType;

	/**
	 * Constructor
	 */
	function Waypoint() {
		this.pointType = [];
		this.pointType.start = 'START';
		this.pointType.via = 'VIA';
		this.pointType.end = 'END';
		this.pointType.unset = 'UNSET';
	}




	Waypoint.prototype.update = update;
	Waypoint.prototype.openPerma = openPerma;

	return new Waypoint();
})(window); 