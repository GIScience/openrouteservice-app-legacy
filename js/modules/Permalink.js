var Permalink = (function(w) {'use strict';
	var query;

	/**
	 * Constructor
	 */
	function Permalink() {

	}

	function update(lon, lat, zoom, layer, waypoints, routeOpt, motorways, tollways, avoidAreas) {
		//use data as GET variables (potential other GET data is lost!)
		var deviceParam = "pos=" + lon + escape(",") + lat + "&zoom=" + zoom + "&layers=" + layer + "&waypoints=" + waypoints + "&routeOpt=" + routeOpt + "&motorways=" + motorways + "&tollways=" + tollways + "&avoidAreas=" + avoidAreas;
		query = "?" + deviceParam;
	}

	/**
	 * open new window with the permalink
	 */
	function openPerma() {
		window.open(query);
	}


	Permalink.prototype.update = update;
	Permalink.prototype.openPerma = openPerma;

	return new Permalink();
})(window); 