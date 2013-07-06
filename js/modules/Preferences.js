var Preferences = (function(w) {'use strict';

	var $ = w.jQuery,
	//name of cookies:
	cookieNameLanguage = 'Language', cookieNamePos = "Last-position", cookieNameZoom = "Last-zoomLevel", cookieNameLayer = "Last-mapLayer", cookieNameDistanceUnit = "DistanceUnits", cookieNameVersion = "Version",
	//are there any cookies of thie page yet?
	cookiesAvailable;

	/**
	 * Constructor
	 */
	function Preferences() {
		this.language = 'en';
		this.distanceUnit = 'm';
		this.version = list.version['extendedVersion'];
		this.dictionary = window['lang_' + this.language];

		cookiesAvailable = false;
	}

	/**
	 * translates a given term to the selected language of the application
	 * @param {Object} term: the key to translate to the given language based on the language files (dictionary)
	 */
	function translate(term) {
		return this.dictionary[term] || '';
	}

	/**
	 * finds the appropriate term in the dictionary based on the local translation, e.g. the German equivalent for 'bureau de change' (Wechselstube) will map to 'bureau_de_change'
	 * @param {Object} translation: the translated value
	 */
	function reverseTranslate(translation) {
		for (var term in this.dictionary ) {
			if (this.dictionary.hasOwnProperty(term)) {
				var dictEntry = new Element('text').insert(this.dictionary[term]).innerHTML;
				if (dictEntry === translation)
					return term;
			}
		}
		//if there exists no term for the given translation
		return '';
	}

	function loadPreferencesOnStartup() {
		this.language = setLanguage();
		this.dictionary = window['lang_' + this.language];
		this.distanceUnit = setDistanceUnit();
		this.version = setVersion();

		//return GET variables that have to be applied to other objects
		return readGetVars();
		;
	}

	function readGetVars() {
		var res = OpenLayers.Util.getParameters();
		var getVars = new Array();
		for (var name in res) {
			getVars[name] = res[name];
		}
		return getVars;
	}

	function setLanguage() {
		console.log("reading language...")

		//read from cookie
		var language = readCookie(cookieNameLanguage);
		console.log("language determined by cookie: " + language);

		//if no cookie is available, use the browser's language
		if (!language) {
			var userLang = (navigator.language) ? navigator.language : navigator.userLanguage;
			if (userLang.indexOf("de") != -1) {
				//use German for browser language codes that contain "de"
				language = 'de';
			} else {
				//everything else is set to English
				language = 'en';
			}
			console.log("language determined by browsers lang: " + language);
		}
		return language;
	}

	function setDistanceUnit() {
		console.log("reading distance unit...")

		//read from cookie
		var distanceUnit = readCookie(cookieNameDistanceUnit);
		console.log("distanceUnit determined by cookie: " + distanceUnit);

		//if no cookie is available, use default
		if (!distanceUnit) {
			distanceUnit = list.distanceUnitsPreferences[0];
			console.log("distanceUnit set automatically: " + distanceUnit);
		}
		return distanceUnit;
	}

	function setVersion() {
		console.log("reading version...")

		//read from cookie
		var version = readCookie(cookieNameVersion);
		console.log("version determined by cookie: " + version);

		//if no cookie is available, use default
		if (!version) {
			version = list.version[0];
			console.log("distanceUnit set automatically: " + version);
		}
		return version;
	}

	function loadMapPosition(lonGet, latGet) {
		console.log("reading map positon...")
		var pos;
		if (lonGet && latGet) {
			//use GET variables
			pos = new OpenLayers.LonLat(lonGet, latGet);
			console.log("pos determined by GET: " + pos);
		} else {
			//use Geolocation feature
			//TODO
		}
		if (!pos) {
			//if GET is not set and geolocation not available use cookie
			pos = unescape(readCookie(cookieNamePos));
			//contains sth like '1018700.9016211,6334189.5605773', parse it!
			if (pos != "null") {
				var pos = pos.split(',');
				pos = new OpenLayers.LonLat(pos[0], pos[1]);
				console.log("pos determined by cookie: " + pos);
			}
		}
		//if neither GET nor cookie have been set -> use default (Heidelberg) which is automatically set when initializing the map
		return pos;
	}

	function loadMapZoom(zoomGet) {
		//use GET variable
		var zoom = zoomGet;
		if (!zoom) {
			//if GET is not set, use cookie
			zoom = readCookie(cookieNameZoom);
		}
		//if neither GET nor cookie have been set -> use default which is set automatically
		return zoom;
	}

	function loadMapLayer(layer) {
		if (!layer) {
			//if GET is not set, use cookie
			layer = readCookie(cookieNameLayer);
		}
		//if neither GET nor cookie have been set -> use default which is set automatically
		return layer;
	}

	function loadWaypoints(waypoints) {
		if (waypoints) {
			waypoints = unescape(waypoints);
			var lonLatCoordinates = waypoints.split(',');
			waypoints = [];
			for (var i = 0; i < lonLatCoordinates.length - 1; i += 2) {
				waypoints.push(new OpenLayers.LonLat(lonLatCoordinates[i], lonLatCoordinates[i + 1]));
			}
		}
		return waypoints
	}

	function loadRouteOptions(routeOpt, motorways, tollways, avoidAreas) {
		//TODO implement
	}

	/**
	 * returns the cookie with the given name
	 */
	function readCookie(name) {
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

		if (cookieData) {
			//cookie exists
			cookiesAvailable = true;
		}
		return cookieData;
	}

	/**
	 * when the map position, zoom level or selected mapLayer changes, refresh the cookies with the current data
	 */
	function writeMapCookies(lon, lat, zoomLvl, layer) {
		//convert position into String
		var position = lon + "," + lat;

		var exdate = new Date();
		//cookie expires in 30 days
		exdate.setDate(exdate.getDate() + 30);

		document.cookie = cookieNamePos + "=" + escape(position) + ";expires=" + exdate.toUTCString();
		document.cookie = cookieNameZoom + "=" + escape(zoomLvl) + ";expires=" + exdate.toUTCString();
		document.cookie = cookieNameLayer + "=" + escape(layer) + ";expires=" + exdate.toUTCString();
	}

	function writePrefsCookies(language, distanceUnit, version) {
		//TODO what to do with params
		writeCookie(language, distanceUnit, version);

		var exdate = new Date();
		//cookie expires in 30 days
		exdate.setDate(exdate.getDate() + 30);

		document.cookie = cookieNameLanguage + "=" + escape(language) + ";expires=" + exdate.toUTCString();
		document.cookie = cookieNameDistanceUnit + "=" + escape(distanceUnit) + ";expires=" + exdate.toUTCString();
		document.cookie = cookieNameVersion + "=" + escape(version) + ";expires=" + exdate.toUTCString();
	}
	
	function areCookiesAVailable() {
		return cookiesAvailable;
	}


	Preferences.prototype.translate = translate;
	Preferences.prototype.reverseTranslate = reverseTranslate;

	Preferences.prototype.loadPreferencesOnStartup = loadPreferencesOnStartup;
	Preferences.prototype.loadMapPosition = loadMapPosition;
	Preferences.prototype.loadMapZoom = loadMapZoom;
	Preferences.prototype.loadMapLayer = loadMapLayer;
	Preferences.prototype.loadWaypoints = loadWaypoints;
	Preferences.prototype.loadRouteOptions = loadRouteOptions;

	Preferences.prototype.writeMapCookies = writeMapCookies;
	Preferences.prototype.writePrefsCookies = writePrefsCookies;
	
	Preferences.prototype.areCookiesAVailable = areCookiesAVailable;

	return new Preferences();
})(window);
