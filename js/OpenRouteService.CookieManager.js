/**
 * Class to manage cookies inside the application.
 * Last visited place should be remembered and loaded automatically when revisiting the page.
 */
OpenRouteService.CookieManager = Class.create({
	cookieNamePos : "Last-position",
	cookieNameZoom : "Last-zoomLevel",
	cookieNameLayer : "Last-mapLayer",
	cookieNameUnit : "DistanceUnits",
	cookieNameLanguage : "Language",
	cookieNameVersion : "Version",

	/**
	 * private method, do not use it!
	 * Writes given data into the cookie
	 * @param position: current map position (as String)
	 * @param zoomLvl: current zoomLevel of the map
	 * @param mapLayer: selected map layer (as String)
	 */
	writeCookie : function(position, zoomLvl, mapLayer) {
		var exdate = new Date();
		//cookie expires in 30 days
		exdate.setDate(exdate.getDate() + 30);

		document.cookie = this.cookieNamePos + "=" + escape(position) + ";expires=" + exdate.toUTCString();
		document.cookie = this.cookieNameZoom + "=" + escape(zoomLvl) + ";expires=" + exdate.toUTCString();
		document.cookie = this.cookieNameLayer + "=" + escape(mapLayer) + ";expires=" + exdate.toUTCString();
	},
	/**
	 * private method, do not use it!
	 * Reads all ORS cookies (position, zoomLevel, mapLayer) and returns the saved values
	 * @return dataArr: array of arrays containing [cookieName, savedValue]
	 */
	readCookies : function() {
		var cName, cValue;
		var dataArr = new Array();
		var allCookies = document.cookie.split(";");
		for (var i = 0; i < allCookies.length; i++) {
			if (!String.prototype.trim) {
				cName = allCookies[i].substr(0, allCookies[i].indexOf("=")).replace(/^\s+|\s+$/g, '');
			} else {
				cName = allCookies[i].substr(0, allCookies[i].indexOf("=")).trim();
			}
			cValue = allCookies[i].substr(allCookies[i].indexOf("=") + 1);
			var arr = [cName, unescape(cValue)];
			dataArr.push(arr);
		}
		return dataArr;
	},
	/**
	 * returns the cookie with the given name
	 */
	readCookie : function(name) {
		if (!name) {
			return null;
		}
		var allCookies = document.cookie;
		if (allCookies.indexOf(name) == -1) {
			return null;
		}
		//example entry: "cookie-name=cookieValue;"
		//start after the name of the cookie
		var indFirst = allCookies.indexOf(name) + name.length;
		//read until ';' or use length of string if there is no ';' at the end
		var cutStart = allCookies.substring(indFirst);
		var indLast = cutStart.indexOf(';') != -1 ? cutStart.indexOf(';') : cutStart.length;
		//start at 1 to slice away the '=' inbetween
		var cookieData = cutStart.substring(1, indLast);
		return cookieData;
	},
	/**
	 * when the map position, zoom level or selected mapLayer changes, refresh the cookie with the current data
	 * This method is accessed from outside this class.
	 */
	writeData : function(map) {
		var zoomLvl = map.getZoom();

		//convert position into String
		var position = map.getCenter();
		position = position.lon + "," + position.lat;

		//convert current layer into number
		var currentLayer = map.baseLayer.id;
		var arr = map.layers;
		var mapLayer = 0;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].id == currentLayer) {
				mapLayer = i;
				//only remember first match (the actual map layer), not 2nd match (markers)
				i = arr.length;
			}
		}
		this.writeCookie(position, zoomLvl, mapLayer);
	},
	/**
	 * when revisiting the ORS page, last location is loaded (if no cookie is found: use Heidelberg location)
	 */
	loadData : function(map) {
		var position, zoomLvl, layer;
		var arr = this.readCookies();

		for (var i = 0; i < arr.length; i++) {
			if (arr[i][0] == this.cookieNamePos) {
				var posDat = arr[i][1].split(',');
				position = new OpenLayers.LonLat(posDat[0], posDat[1]);
			} else if (arr[i][0] == this.cookieNameZoom) {
				zoomLvl = arr[i][1];
			} else if (arr[i][0] == this.cookieNameLayer) {
				layer = arr[i][1];
			}
		}

		//if there is no cookie so far.. set default values to Heidelberg
		position = position == null ? new OpenLayers.LonLat(8.692953, 49.409445).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")) : position;
		zoomLvl = isNaN(zoomLvl) ? 13 : zoomLvl;

		var layerArr = map.layers;
		layer = (isNaN(layer) || layer >= layerArr.length ) ? layerArr[0] : layerArr[layer];
		map.setBaseLayer(layer);

		map.setCenter(position, zoomLvl);
	},
	//used for site preferences
	/**
	 * writes the selected Site Preferences to a cookie.
	 * @param arr: selected language, distance unit and version
	 */
	writeSitePrefs : function(arr) {
		var language = arr[0];
		var unit = arr[1];
		var version = arr[2];

		var exdate = new Date();
		//cookie expires in 30 days
		exdate.setDate(exdate.getDate() + 30);

		document.cookie = this.cookieNameLanguage + "=" + escape(language) + ";expires=" + exdate.toUTCString();
		document.cookie = this.cookieNameUnit + "=" + escape(unit) + ";expires=" + exdate.toUTCString();
		document.cookie = this.cookieNameVersion + "=" + escape(version) + ";expires=" + exdate.toUTCString();
	}
}); 