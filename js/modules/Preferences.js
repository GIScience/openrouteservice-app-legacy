var Preferences = (function(w) {'use strict';

	//are there any cookies of thie page yet?
	var cookiesAvailable = false;

	var prefNames = ['pos', 'zoom', 'layer', 'routeOpt', 'avHigh', 'avToll', 'avArea', 'wp', 'lang', 'routeLang', 'distUnit', 'version'];

	//store information that can be used for the permalink
	var permaInfo = [null, null, null, null, null, null, null, null, null, null, null];

	/**
	 * Constructor
	 */
	function Preferences() {
		//indices for the prefNames array; to be accessed from other classes
		this.positionIdx = 0;
		this.zoomIdx = 1;
		this.layerIdx = 2;
		this.routeOptionsIdx = 3;
		this.avoidHighwayIdx = 4;
		this.avoidTollwayIdx = 5;
		this.avoidAreasIdx = 6;
		this.waypointIdx = 7;
		this.languageIdx = 8;
		this.routingLanguageIdx = 9;
		this.distanceUnitIdx = 10;
		this.versionIdx = 11;

		//define variables
		this.language = 'en';
		this.routingLanguage = 'en';
		this.distanceUnit = 'm';
		this.version = list.version['extendedVersion'];
		this.dictionary = window['lang_' + 'en']; //TODO if multi-language site is available: this.dictionary = window['lang_' + this.language];

		//set permalink links
		permaInfo[this.languageIdx] = this.language;
		permaInfo[this.routingLanguageIdx] = this.routingLanguage;
		permaInfo[this.distanceUnitIdx] = this.distanceUnit;
		permaInfo[this.versionIdx] = this.version;
		//other fields are filled with default values when reading GET variables/ cookies etc.

		cookiesAvailable = false;
	}

	function getPrefName(idx) {
		return prefNames[idx];
	}

	/*
	* MULTI-LANGUAGE SUPPORT
	*/

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

	/*
	 * PREFERENCES
	 */

	function loadPreferencesOnStartup() {
		this.language = this.setLanguage();
		this.dictionary = window['lang_' + 'en']; //TODO if multi-language site is available: this.dictionary = window['lang_' + this.language];
		this.routingLanguage = this.setRoutingLanguage();
		this.distanceUnit = this.setDistanceUnit();
		this.version = this.setVersion();

		//return GET variables that have to be applied to other objects
		return readGetVars();
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
		var lang = readCookie(prefNames[this.languageIdx]);
		console.log("language determined by cookie: " + lang);

		//if no cookie is available, use the browser's language
		if (!lang) {
			var userLang = (navigator.language) ? navigator.language : navigator.userLanguage;
			if (userLang.indexOf("de") != -1) {
				//use German for browser language codes that contain "de"
				lang = 'de';
			} else {
				//everything else is set to English
				lang = 'en';
			}
			console.log("language determined by browsers lang: " + lang);
		}

		if (list.languages.indexOf(lang) == -1) {
			//this language doesn't exist in ORS, use default
			lang = 'en';
		}

		return lang;
	}

	function setRoutingLanguage() {
		console.log("reading routing language...")

		//read from cookie
		var lang = readCookie(prefNames[this.routingLanguageIdx]);
		console.log("routing language determined by cookie: " + lang);

		//if no cookie is available, use the language of the ORS site
		if (!lang) {
			var lang = this.language;
			console.log("language determined by site lang: " + lang);
		}

		if (list.routingLanguages.indexOf(lang) == -1) {
			//this language doesn't exist in ORS, use default
			lang = 'en';
		}
		return lang;
	}

	function setDistanceUnit() {
		console.log("reading distance unit...")

		//read from cookie
		var distUnit = readCookie(prefNames[this.distanceUnitIdx]);
		console.log("distanceUnit determined by cookie: " + distUnit);

		//if no cookie is available, use default
		if (!distUnit) {
			distUnit = list.distanceUnitsPreferences[0];
			console.log("distanceUnit set automatically: " + distUnit);
		}
		return distUnit;
	}

	function setVersion() {
		console.log("reading version...")

		//read from cookie
		var siteVersion = readCookie(prefNames[this.versionIdx]);
		console.log("version determined by cookie: " + siteVersion);

		//if no cookie is available, use default
		if (!siteVersion) {
			siteVersion = list.version[0];
			console.log("version set automatically: " + siteVersion);
		}
		return siteVersion;
	}

	/**
	 * @param pos: extracted from the GET variables in readGetVars(); array containing lon and lat coordinates
	 */
	function loadMapPosition(pos) {
		console.log("reading map positon...")

		if (pos && pos.length == 2) {
			//use GET variables (permalink)
			pos = new OpenLayers.LonLat(pos[0], pos[1]);
			console.log("pos determined by GET: " + pos);
		} else {
			//use Geolocation feature
			//TODO
		}
		if (!pos) {
			//if GET is not set and geolocation not available use cookie
			pos = unescape(readCookie(prefNames[this.positionIdx]));
			//contains sth like '1018700.9016211,6334189.5605773', parse it!
			if (pos != "null") {
				var pos = pos.split(',');
				pos = new OpenLayers.LonLat(pos[0], pos[1]);
				console.log("pos determined by cookie: " + pos);
			}
		}
		//if neither GET nor cookie have been set -> use default (Heidelberg) which is automatically set when initializing the map

		//save this location in the permaInfo array
		permaInfo[this.positionIdx] = escape(pos.lon + ',' + pos.lat);

		return pos;
	}

	/**
	 * @param zoomGet: extracted from the GET variables in readGetVars()
	 */
	function loadMapZoom(zoomGet) {
		//use GET variable (permalink)
		var zoom = zoomGet;
		if (!zoom) {
			//if GET is not set, use cookie
			zoom = readCookie(prefNames[this.zoomIdx]);
		}
		//if neither GET nor cookie have been set -> use default which is set automatically

		//save the zoom level in the permaInfo array
		permaInfo[this.zoomIdx] = escape(zoom) || 13;
		return zoom;
	}

	/**
	 * @param layerCode: extracted from the GET variables in readGetVars()
	 */
	function loadMapLayer(layerCode) {
		//use GET variable (permalink)
		if (!layerCode) {
			//if GET is not set, use cookie
			layerCode = readCookie(prefNames[this.layerIdx]);
		}
		//if neither GET nor cookie have been set -> use default which is set automatically

		//save the layers in the permaInfo array; the map can handle a missing value, no problem.
		permaInfo[this.layerIdx] = escape(layerCode);

		return layerCode;
	}

	/**
	 * @param waypoints: extracted from the GET variables in readGetVars()
	 */
	function loadWaypoints(waypoints) {
		if (waypoints) {
			//save waypoints in permaInfo array
			permaInfo[this.waypointIdx] = waypoints == undefined ? null : waypoints;

			waypoints = unescape(waypoints);
			var lonLatCoordinates = waypoints.split(',');
			waypoints = [];
			for (var i = 0; i < lonLatCoordinates.length - 1; i += 2) {
				waypoints.push(new OpenLayers.LonLat(lonLatCoordinates[i], lonLatCoordinates[i + 1]));
			}
		}
		return waypoints;
	}

	/**
	 * @param routeOpt: extracted from the GET variables in readGetVars()
	 */
	function loadRouteOptions(routeOpt) {
		routeOpt = unescape(routeOpt);

		//set a default in the permaInfo Array if routeOpt == null, undef, etc.
		if (routeOpt == undefined || routeOpt == null || routeOpt == 'undefined') {
			permaInfo[this.routeOptionsIdx] = list.routePreferences.get('car')[0];
		} else {
			permaInfo[this.routeOptionsIdx] = routeOpt;
		}

		//check if the routeOpt parameter is a valid routeOption.
		var mainObjects = list.routePreferences.keys();
		var isValid = false;
		for (var i = 0; i < mainObjects.length; i++) {
			isValid = list.routePreferences.get(mainObjects[i]).indexOf(routeOpt) != -1;
			if (isValid) {
				break;
			}
		}

		if (!isValid) {
			//we found a parameter to parse, but this wasn't a valid route option. Use the default instead
			routeOpt = permaInfo[this.routeOptionsIdx];
		}
		return routeOpt;
	}

	/**
	 * @param highway, tollway: extracted from the GET variables in readGetVars()
	 */
	function loadAvoidables(highway, tollway) {
		var avoidables = [false, false];
		//highway
		if (unescape(highway) === 'true') {
			avoidables[0] = true;
			permaInfo[this.avoidHighwayIdx] = true;
		} else {
			permaInfo[this.avoidHighwayIdx] = false;
		}
		//tollway
		if (unescape(tollway) === 'true') {
			avoidables[1] = true;
			permaInfo[this.avoidTollwayIdx] = true;
		} else {
			permaInfo[this.avoidTollwayIdx] = false;
		}
		return avoidables;
	}

	/**
	 * @param avoidAreas: extracted from the GET variables in readGetVars()
	 */
	function loadAvoidAreas(avoidAreas) {
		permaInfo[this.avoidAreasIdx] = avoidAreas == undefined ? null : avoidAreas;

		avoidAreas = unescape(avoidAreas);
		var allAvoidAreas = [];
		var differentAreas = avoidAreas.split(';');
		for (var j = 0; j < differentAreas.length; j++) {
			var lonLatCoordinates = differentAreas[j].split(',');
			avoidAreas = [];
			for (var i = 0; i < lonLatCoordinates.length - 1; i += 2) {
				avoidAreas.push(new OpenLayers.Geometry.Point(lonLatCoordinates[i], lonLatCoordinates[i + 1]));
			}
			if (avoidAreas.length > 0) {
				//generate avoid area Polygon
				var poly = new OpenLayers.Geometry.Polygon(new OpenLayers.Geometry.LinearRing(avoidAreas));
				allAvoidAreas.push(poly)
			}
		}
		return allAvoidAreas;
	}

	/**
	 * if the user changes e.g. route options from "mountainbike" to "pedestrian", update this information in the permaInfo array.
	 */
	function updatePreferences(key, value) {
		console.log(key);
		console.log(value)
		permaInfo[key] = escape(value);
	}

	/*
	* COOKIES
	*/

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
	 * Used to write all information at once; e.g. if no cookies ara available so far
	 * when the map position, zoom level or selected mapLayer changes, refresh the cookies with the current data
	 */
	function writeMapCookies(lon, lat, zoomLvl, layerCode) {
		//convert position into String
		var position = lon + "," + lat;

		var exdate = new Date();
		//cookie expires in 30 days
		exdate.setDate(exdate.getDate() + 30);

		document.cookie = prefNames[this.positionIdx] + "=" + escape(position) + ";expires=" + exdate.toUTCString();
		document.cookie = prefNames[this.zoomIdx] + "=" + escape(zoomLvl) + ";expires=" + exdate.toUTCString();
		document.cookie = prefNames[this.layerIdx] + "=" + escape(layerCode) + ";expires=" + exdate.toUTCString();

		permaInfo[this.positionIdx] = escape(position);
		permaInfo[this.zoomIdx] = escape(zoomLvl);
		permaInfo[this.layerIdx] = escape(layerCode);

		cookiesAvailable = true;
	}

	/**
	 * Used to write all information at once; e.g. if no cookies ara available so far
	 * Write language, language of routing instructions, distance unit and selected version
	 */
	function writePrefsCookies() {
		var exdate = new Date();
		//cookie expires in 30 days
		exdate.setDate(exdate.getDate() + 30);

		document.cookie = prefNames[this.languageIdx] + "=" + escape(this.language) + ";expires=" + exdate.toUTCString();
		document.cookie = prefNames[this.routingLanguageIdx] + "=" + escape(this.routingLanguage) + ";expires=" + exdate.toUTCString();
		document.cookie = prefNames[this.distanceUnitIdx] + "=" + escape(this.distanceUnit) + ";expires=" + exdate.toUTCString();
		document.cookie = prefNames[this.versionIdx] + "=" + escape(this.version) + ";expires=" + exdate.toUTCString();

		cookiesAvailable = true;
	}

	/**
	 * if the user e.g. changes the language of the application this is updated in the cookie
	 */
	function updateCookies(key, value) {
		if (value && value.length > 0) {
			var exdate = new Date();
			//cookie expires in 30 days
			exdate.setDate(exdate.getDate() + 30);
			document.cookie = prefNames[key] + "=" + escape(value) + ";expires=" + exdate.toUTCString();

			permaInfo[key] = escape(value);

			//the preference is one of language, routingLanguage, distanceUnit and version -> have to be saved in separate variable
			this.language = key == this.languageIdx ? value : this.langauge;
			this.routingLanguage = key == this.routingLanguageIdx ? value : this.routingLanguage;
			this.distanceUnit = key == this.distanceUnitIdx ? value : this.distanceUnit;
			this.version = key == this.versionIdx ? value : this.version;
			
			this.dictionary = window['lang_' + 'en']; //TODO if multi-language site is available: this.dictionary = window['lang_' + this.language];
		}
	}

	/**
	 * has the user visited this site before/ are there cookies yet?
	 */
	function areCookiesAVailable() {
		return cookiesAvailable;
	}

	/*
	* PERMALINK
	*/

	/**
	 * open new window with the permalink
	 */
	function openPermalink() {
		var query = '?';
		for (var i = 0; i < prefNames.length; i++) {
			query += prefNames[i] + '=' + permaInfo[i] + '&';
		}
		//slice away last '&'
		query = query.substring(0, query.length - 1);
		window.open(query);
	}


	Preferences.prototype.getPrefName = getPrefName;

	Preferences.prototype.translate = translate;
	Preferences.prototype.reverseTranslate = reverseTranslate;

	Preferences.prototype.loadPreferencesOnStartup = loadPreferencesOnStartup;
	//actually, setLang, setRoutingLang, setDist, setVersion should be private; but then there are some problems with calling some varaibles, etc.
	//Didn't find a solution for that, so I used this workaround.
	Preferences.prototype.setLanguage = setLanguage;
	Preferences.prototype.setRoutingLanguage = setRoutingLanguage;
	Preferences.prototype.setDistanceUnit = setDistanceUnit;
	Preferences.prototype.setVersion = setVersion;
	Preferences.prototype.loadMapPosition = loadMapPosition;
	Preferences.prototype.loadMapZoom = loadMapZoom;
	Preferences.prototype.loadMapLayer = loadMapLayer;
	Preferences.prototype.loadWaypoints = loadWaypoints;
	Preferences.prototype.loadRouteOptions = loadRouteOptions;
	Preferences.prototype.loadAvoidables = loadAvoidables;
	Preferences.prototype.loadAvoidAreas = loadAvoidAreas;

	Preferences.prototype.writeMapCookies = writeMapCookies;
	Preferences.prototype.writePrefsCookies = writePrefsCookies;
	Preferences.prototype.updatePreferences = updatePreferences;

	Preferences.prototype.updateCookies = updateCookies;

	Preferences.prototype.areCookiesAVailable = areCookiesAVailable;

	Preferences.prototype.openPermalink = openPermalink;

	return new Preferences();
})(window);
