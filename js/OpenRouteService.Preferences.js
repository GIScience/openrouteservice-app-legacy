/**
 * User preferences that can be set for the site.
 */
OpenRouteService.Preferences = {

	language : null,
	distanceUnit : null,
	version : null,

	getParamLanguage : 'lang',
	getParamDistanceUnit : 'unit',
	getParamVersion : 'version',

	/**
	 * contains the translations of all labels in the selected language
	 */
	dictionary : null,

	/**
	 * loads preferences like language and distance unit to build the site.
	 * 1) look if these params are set as GET variables; if not,
	 * 2) look if these params are set as cookies; if not,
	 * 3) use default values
	 */
	loadPrefs : function() {
		var cman = new OpenRouteService.CookieManager();
		this.language = OpenRouteService.Util.readGetVar(this.getParamLanguage);
		this.distanceUnit = OpenRouteService.Util.readGetVar(this.getParamDistaneUnit);

		//if GET vars are not set, read cookies
		if (!this.language || this.language.length == 0) {
			this.language = cman.readCookie(cman.cookieNameLanguage);
		}
		if (!this.distanceUnit || this.distanceUnit.length == 0) {
			this.distanceUnit = cman.readCookie(cman.cookieNameUnit);
		}
		if (!this.version || this.version.length == 0) {
			this.version = cman.readCookie(cman.cookieNameVersion);
		}

		//if we don't have cookies: set default values
		if (!this.language || this.language.length == 0) {
			//define the application language based on the browser settings
			this.automSetLanguage();
		} else {
			//convert number from GET/ cookie to String, e.g. 1 -> 'de'
			this.language = OpenRouteService.List.languages[this.language];
		}
		if (!this.distanceUnit || this.distanceUnit.length == 0) {
			this.automSetDistanceUnit();
		} else {
			//convert number from GET/cookie to String, e.g. 0 -> 'm / km'
			this.distanceUnit = OpenRouteService.List.distanceUnitsRoute[this.distanceUnit];
		}
		if (!this.version || this.version.length == 0) {
			this.automSetVersion();
		} else {
			//convert number from GET/ cookie to String, e.g. 1 -> 'de'
			this.version = OpenRouteService.List.version[this.version];
		}

		this.dictionary = window['lang_' + this.language];
	},
	/**
	 * save the preferences to cookie and GET variables in case the user doesn't allow cookies to be set.
	 */
	savePrefs : function(arr) {
		var route = arr[0];
		var lang = arr[1];
		var unit = arr[2];
		var version = arr[3];

		this.loadPrefs();
		if (!(this.language == lang && this.distanceUnit == unit)) {
			//values have changed, save the new ones

			//save prefs (lang, unit) in a cookie
			new OpenRouteService.CookieManager().writeSitePrefs([lang, unit, version]);
			OpenRouteService.Preferences.language = OpenRouteService.List.languages[lang];
			OpenRouteService.Preferences.distanceUnit = OpenRouteService.List.distanceUnitsRoute[unit];
			OpenRouteService.Preferences.version = OpenRouteService.List.version[version];

			//append selection of prefs as GET variables in case the user does not allow cookies to be stored and reload the page
			var query = window.location.search, deviceParam = this.getParamLanguage + "=" + lang + "&" + this.getParamDistanceUnit + "=" + unit + "&" + this.getParamVersion + "=" + version;

			//append other parameters to be able to restore route after recalculation
			var layers = OpenRouteService.Map.serializeLayers(route.routeInstance.map);
			var routeOpt = route.routeInstance.routeOptions.getRoutePreference();
			var motorways = route.routeInstance.routeOptions.getAvoidMotorways();
			var tollways = route.routeInstance.routeOptions.getAvoidTollways();
			var waypoints = route.routeInstance.serializeWaypoints();
			var avoidAreas = route.routeInstance.routeOptions.getAvoidAreasString();
			deviceParam = deviceParam + "&layers=" + layers + "&routeOpt=" + routeOpt + "&motorways=" + motorways + "&tollways=" + tollways + "&waypoints=" + waypoints + "&avoidAreas=" + avoidAreas;

			query = "?" + deviceParam;
			window.location.search = query;
		}
	},
	/**
	 * sets the language parameter acoording to the browser language settings
	 */
	automSetLanguage : function() {
		var userLang = (navigator.language) ? navigator.language : navigator.userLanguage;
		if (userLang.indexOf("de") != -1) {
			//use German for browser language codes that contain "de"
			OpenRouteService.Preferences.language = 'de';
		} else if (userLang.indexOf("es") != -1) {
			//use Spanish for browser language codes that contain "es"
			OpenRouteService.Preferences.language = 'es';
		} else if (userLang.indexOf("fr") != -1) {
			//use French for browser language codes that contain "fr"
			OpenRouteService.Preferences.language = 'fr';
		} else {
			//everything that is not one of the languages mentioned above is set so English
			OpenRouteService.Preferences.language = 'en';
		}
	},
	/**
	 * sets distance unit to "m / km" (default)
	 */
	automSetDistanceUnit : function() {
		OpenRouteService.Preferences.distanceUnit = OpenRouteService.List.distanceUnitsRoute[0];
	},
	/**
	 * sets version to "standard" (default)
	 */
	automSetVersion : function() {
		OpenRouteService.Preferences.version = OpenRouteService.List.version[0];
	},
	/**
	 * after using the Permalink feature, this function interprets the given GET variables to show the given position
	 * parameters that cannot be applied at this state (because necessary elements are not loaded yet) are returned to be handed over to these elements as parameters
	 */
	applyHttpGetVars : function(map) {
		var paramsThatCannotBeApplied = [];
		res = OpenLayers.Util.getParameters();
		var getVars = new Array();
		for (var name in res) {
			getVars[name] = res[name];
		}

		var lon = getVars['lon'];
		var lat = getVars['lat'];
		var zoom = getVars['zoom'];
		var layer = getVars['layers'];
		var routeOpt = getVars['routeOpt'];
		var motorways = getVars['motorways'];
		var tollways = getVars['tollways'];
		var waypoints = getVars['waypoints'];
		var avoidAreas = getVars['avoidAreas'];

		if (lon != undefined && lat != undefined) {
			var pos = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
			map.setCenter(pos);
		}
		if (zoom != undefined) {
			map.zoomTo(zoom);
		}
		if (layer != undefined) {
			OpenRouteService.Map.restoreLayerPrefs(map, layer);
		}
		if (routeOpt != undefined) {
			paramsThatCannotBeApplied.routeOpt = routeOpt;
		}
		if (motorways != undefined) {
			paramsThatCannotBeApplied.motorways = motorways;
		}
		if (tollways != undefined) {
			paramsThatCannotBeApplied.tollways = tollways;
		}
		if (waypoints != undefined) {
			paramsThatCannotBeApplied.waypoints = [];
			if (waypoints.length % 2 == 0) {
				for (var i = 0; i < waypoints.length - 1; i += 2) {
					var wpArr = [waypoints[i], waypoints[i + 1]];
					paramsThatCannotBeApplied.waypoints.push(wpArr);
				}
			}
		}

		if (avoidAreas != undefined) {
			paramsThatCannotBeApplied.avoidAreas = [];
			if (avoidAreas.length % 2 == 0) {
				for (var i = 0; i < avoidAreas.length - 1; i += 2) {
					var wpArr = [avoidAreas[i], avoidAreas[i + 1]];
					paramsThatCannotBeApplied.avoidAreas.push(wpArr);
				}
			}
		}
		return paramsThatCannotBeApplied;
	},
	/**
	 * translates a given term to the selected language of the application
 	 * @param {Object} term: the key to translate to the given language based on the language files (dictionary)
	 */
	translate : function(term) {
		return this.dictionary[term] || '';
	},
	/**
	 * finds the appropriate term in the dictionary based on the local translation, e.g. the German equivalent for 'bureau de change' (Wechselstube) will map to 'bureau_de_change'
 	 * @param {Object} translation: the translated value
	 */
	reverseTranslate : function(translation) {
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
};
