/*|-----------------------------------------------------------------------------------
 *|														University of Heidelberg
 *|	  _____ _____  _____      _                     	Department of Geography
 *|	 / ____|_   _|/ ____|    (_)                    	Chair of GIScience
 *|	| |  __  | | | (___   ___ _  ___ _ __   ___ ___ 	(C) 2012
 *|	| | |_ | | |  \___ \ / __| |/ _ \ '_ \ / __/ _ \
 *|	| |__| |_| |_ ____) | (__| |  __/ | | | (_|  __/	Berliner Strasse 48
 *|	 \_____|_____|_____/ \___|_|\___|_| |_|\___\___|	D-69120 Heidelberg, Germany
 *|	        	                                       	http://www.giscience.uni-hd.de
 *|------------------------------------------------------------------------------------*/

/**
 * @author: Oliver Roick, roick@uni-heidelberg.de, Carina Eichler, carina.eichler@uni-heidelberg.de
 * @verion: 0.3
 */
 /* ======================================================================
    namespaces.js
   ====================================================================== */

/**
 * all URLs used in the openrouteservice 
 */

/**
 * namespaces and schemata e.g. for XML requests to services 
 */
namespaces = {
	xls : 'http://www.opengis.net/xls',
	sch : 'http://www.ascc.net/xml/schematron',
	gml : 'http://www.opengis.net/gml',
	wps : 'http://www.opengis.net/wps/1.0.0',
	ows : 'http://www.opengis.net/ows/1.1',
	xlink : 'http://www.w3.org/1999/xlink',
	xsi : 'http://www.w3.org/2001/XMLSchema-instance',
	ascc : 'http://www.ascc.net/xml/schematron',
	aas : 'http://www.geoinform.fh-mainz.de/aas'
};
namespaces.schemata = {
	directoryService : 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/DirectoryService.xsd',
	analyseService : 'http://www.geoinform.fh-mainz.de/aas',
	gatewayService : 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/GatewayService.xsd',
	locationUtilityService : 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/LocationUtilityService.xsd',
	presentationService : 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/PresentationService.xsd',
	routeService : 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/RouteService.xsd',
	wpsService : 'http://www.opengis.net/xls http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd',
	lineStringService : 'http://www.opengis.net/gml http://schemas.opengis.net/gml/3.1.1/base/geometryBasic0d1d.xsd'
};


/**
 * services that are called by openrouteservice, e.g. to determine the route between two waypoints
 * important note: all these URLs must be listed in the cgi-bin/proxy.cgi script of the server running ORS!
 * important note: all URLs have been blanked out for security reasons
 * if you want to become an active ORS code contributor please contact us: openrouteserviceATgeog.uni-heidelberg.de 
 */
namespaces.services = {
	geocoding : '', //for address search requests
	routing : '', //for routing requests
	directory : '', //for POI search requests
	analyse : '',
	wps : '' //for calculation of polygon around route for POI search
	//profile: 'http://watzmann.geog.uni-heidelberg.de:8080/deegree/all' 			//for height profile of route
};

/**
 * map layers used on the openlayers map
 */
//url to ORS-WMS map layer
namespaces.layerWms = '';
//url to Open Map Surfer layer
namespaces.layerMapSurfer = '';
//url to hillshade overlay
namespaces.layerHs = '';
//urls to TMC overlay
namespaces.overlayTmc = '';
namespaces.overlayTmcLines = '';
/* ======================================================================
    util.js
   ====================================================================== */

/**
 * various utility methods for the site
 */
util = ( function() {'use strict';
		var util = {
			/**
			 * positions are often set as data-attributes in the Ui/ HTML file. Converts them to OpenLayers.LonLat position
			 * @param positionString: String containing the coordinates
			 * @return: OpenLayers.LonLat with these coordinates 
			 */
			convertPositionStringToLonLat : function(positionString) {
				var pos = positionString.split(' ');
				pos = new OpenLayers.LonLat(pos[0], pos[1]);
				return pos;
			},

			/**
			 * transforms a given point to the display-projection of the map
			 * @param {Object} pt: OpenLayers LonLat or Point coordinates to transform
			 */
			convertPointForDisplay : function(pt) {
				var src = new OpenLayers.Projection('EPSG:900913');
				var dest = new OpenLayers.Projection('EPSG:4326');

				if (pt.x && pt.y) {
					//the input is likely to be of OL.Geometry.Point... special handling necessary
					var ptCopy = new OpenLayers.LonLat(pt.x, pt.y);
					ptCopy = ptCopy.transform(src, dest);
					return new OpenLayers.Geometry.Point(ptCopy.lon, ptCopy.lat);
				} else {
					var ptCopy = new OpenLayers.LonLat(pt.lon, pt.lat);
					return ptCopy.transform(src, dest);
				}
			},

			/**
			 * transforms a given point to the internal projection of the map
			 * @param {Object} pt: OpenLayers LonLat or Point coordinates to transform
			 */
			convertPointForMap : function(pt) {
				var src = new OpenLayers.Projection('EPSG:4326');
				var dest = new OpenLayers.Projection('EPSG:900913');

				if (pt.x && pt.y) {
					//the input is likely to be of OL.Geometry.Point... special handling necessary
					var ptCopy = new OpenLayers.LonLat(pt.x, pt.y);
					ptCopy = ptCopy.transform(src, dest);
					return new OpenLayers.Geometry.Point(ptCopy.lon, ptCopy.lat);
				} else {
					var ptCopy = new OpenLayers.LonLat(pt.lon, pt.lat);
					return ptCopy.transform(src, dest);
				}
			},

			/**
			 * takes a given string and parses it to DOM objects
			 * @param s: the String to parse
			 * @return xml DOM object or ActiveXObject
			 */
			parseStringToDOM : function(s) {
				if ( typeof DOMParser != "undefined") {
					return (new DOMParser).parseFromString(s, "text/xml");
				} else if ( typeof ActiveXObject != "undefined") {
					xmlDocument = new ActiveXObject("Microsoft.XMLDOM");
					xmlDocument.loadXML(s);
					return xmlDocument;
				}
			},

			/**
			 * Calls the Javascript functions getElementsByTagNameNS or getElementsByTagName according to the browsers capabilities.
			 * Chrome and Firefox will be fine with element.getElementsByTagNameNS(ns, tagName), but IE can only cope with element.getElementsByTagName('namespaceTag': tagName)
			 * @param element: XML element to retrieve the information from
			 * @param ns: Namespace to operate in
			 * @param tagName: attribute name of the child elements to return
			 * @return suitable elements of the given input element that match the tagName
			 */
			getElementsByTagNameNS : function(element, ns, tagName) {
				if (element.getElementsByTagNameNS) {
					//Firefox, Chrome
					return element.getElementsByTagNameNS(ns, tagName);
				} else {
					//IE 9 doesn't support getElementsByTagNameNS function for XML documents
					var nsTag;
					for (var x in OpenRouteService.namespaces) {
						if (OpenRouteService.namespaces[x] == ns) {
							nsTag = x;
						}
					}
					//set tagName e.g. to "xls:address"
					return element.getElementsByTagName(nsTag + ':' + tagName);
				}
			},
			
			/**
			 * parses the XML result for an address into HTML format
			 * @param xmlAddress: XML encoded address result 
			 * @return: address result wrapped in appropriate HTML tags
			 */
			parseAddress : function(xmlAddress) {
				if (!xmlAddress) {
					return;
				}
				var element = new Element('li', {
					'class' : 'address'
				});

				var StreetAddress = util.getElementsByTagNameNS(xmlAddress, namespaces.xls, 'StreetAddress')[0];
				var Streets = util.getElementsByTagNameNS(StreetAddress, namespaces.xls, 'Street');
				var Building = util.getElementsByTagNameNS(StreetAddress, namespaces.xls, 'Building')[0];
				var places = util.getElementsByTagNameNS(xmlAddress, namespaces.xls, 'Place');
				var postalCode = util.getElementsByTagNameNS(xmlAddress, namespaces.xls, 'PostalCode');

				//Building line
				if (Building) {
					var buildingName = Building.getAttribute('buildingName');
					var buildingSubdivision = Building.getAttribute('subdivision');
					if (buildingName != null) {
						element.appendChild(new Element('span').update(buildingName + ' '))
					}
					if (buildingSubdivision != null) {
						element.appendChild(new Element('span').update(buildingSubdivision + ' '))
					}
				}

				//Street line
				var streetline = 0;
				$A(Streets).each(function(street) {
					var officialName = street.getAttribute('officialName');
					if (officialName != null) {
						element.appendChild(new Element('span').update(officialName + ' '));
						streetline++;
					}
				});
				if (Building) {
					var buildingNumber = Building.getAttribute('number');
					if (buildingNumber != null) {
						element.appendChild(new Element('span').update(buildingNumber));
						streetline++;
					}
				}

				if (streetline > 0) {
					element.appendChild(new Element('br'));
				}

				//Place line
				var separator = '';
				if (postalCode[0]) {
					element.appendChild(new Element('span').update(postalCode[0].textContent));
					separator = ' ';
				}
				//insert the value of each of the following attributes in order, if they are present
				['MunicipalitySubdivision', 'Municipality', 'CountrySecondarySubdivision', 'CountrySubdivision'].each(function(type) {
					$A(places).each(function(place) {
						if (place.getAttribute('type') === type) {
							//Chrome, Firefox: place.textContent; IE: place.text
							var content = place.textContent || place.text;
							element.appendChild(new Element('span', {
								'class' : 'addressElement'
							}).update(separator + content));
							separator = ', ';
						}
					})
				});
				var countryCode = xmlAddress.getAttribute('countryCode');
				if (countryCode != null) {
					element.appendChild(new Element('span').update(', ' + countryCode.toUpperCase()));
				}
				return element;
			},

			/**
			 * parses the XML result for an address into short HTML format
			 * @param xmlAddress: XML encoded address result 
			 * @return: address result partly wrapped in appropriate HTML tags
			 */
			parseAddressShort : function(address) {
				var element = "";
				if (address) {
					var streetAddress = util.getElementsByTagNameNS(address, namespaces.xls, 'StreetAddress')[0];
					var streets = util.getElementsByTagNameNS(streetAddress, namespaces.xls, 'Street');
					var building = util.getElementsByTagNameNS(streetAddress, namespaces.xls, 'Building')[0];
					var places = util.getElementsByTagNameNS(address, namespaces.xls, 'Place');

					//Building line
					if (building) {
						var buildingName = building.getAttribute('buildingName');
						var buildingSubdivision = building.getAttribute('subdivision');
						if (buildingName != null) {
							element += buildingName + ' ';
						}
						if (buildingSubdivision != null) {
							element += buildingSubdivision + ' ';
						}
					}
					//Street line
					$A(streets).each(function(street) {
						var officialName = street.getAttribute('officialName');
						if (officialName != null) {
							element += officialName + ' ';
						}
					});
					//add city name
					$A(places).each(function(place) {
						if (place.getAttribute('type') === 'Municipality') {
							//Chrome, Firefox: place.textContent; IE: place.text
							element += place.textContent || place.text;
						}
					});
				}
				return element;
			},

			/**
			 * converts a given distance measure into meters
			 * @param dist: distance in specified unit
			 * @uit: distance measure (meters, kilometers, yards,...)
			 */
			convertDistToMeters : function(dist, unit) {
				var distanceInMeters = 0;
				//max dist expressed in meters

				switch (unit) {
					case "km":
						distanceInMeters = dist * 1000;
						break;
					case "mi":
						distanceInMeters = dist * 1609.344;
						break;
					case "yd":
						distanceInMeters = dist * 0.9144;
						break;
					default:
						//either measure in meters or unknown value. We assume a measure in meters
						distanceInMeters = dist;
				}
				return distanceInMeters;
			},
			/**
			 * converts a distance in meters into the specified unit measure
			 * @distanceInMeters: distance to convert
			 * @unit: unit to convert to
			 */
			convertDistToDist : function(distance, distanceUnitSrc, distanceUnitDest) {
				var specificDistance = 0;

				var distanceInMeters = this.convertDistToMeters(distance, distanceUnitSrc);

				switch (distanceUnitDest) {
					case "km":
						specificDistance = distanceInMeters / 1000;
						break;
					case "mi":
						specificDistance = distanceInMeters / 1609.344;
						break;
					case "yd":
						specificDistance = distanceInMeters / 0.9144;
						break;
					default:
						//either measure in meters or unknown value. We assume a measure in meters
						specificDistance = distanceInMeters;
				}
				return this.round(specificDistance);
			},
			/**
			 * rounds a given distance to an appropriate number of digits
			 * @distane: number to round
			 */
			round : function(distance) {
				//precision - set the number of fractional digits to round to
				var precision = 4;
				if (distance < 0.3) {
					precision = 3;
				}
				if (distance >= 0.3) {
					precision = 2;
				}
				if (distance > 2) {
					precision = 1;
				}
				if (distance > 100) {
					precision = 0;
				}
				if (distance > 300) {
					precision = -1;
				}
				if (distance > 2000) {
					precision = -2;
				}
				var p = Math.pow(10, precision)
				return Math.round(distance * p) / p;
			},

			/**
			 * reads the specified variable from GET
			 * @param variable: variable to read
			 * @return: value of the variable
			 */
			readGetVar : function(variable) {
				var query = window.location.search.substring(1);
				var vars = query.split("&");
				for (var i = 0; i < vars.length; i++) {
					var pair = vars[i].split("=");
					if (pair[0] == variable) {
						return unescape(pair[1]);
					}
				}
			},

			/**
			 * @param {Object} term: the poi term to decide about, given in generalized terms, no local languages (e.g. 'bureau_de_change' instead of German 'Wechselstube')
			 * @return: true, if term is a 'category', false if term is a 'type', null if term is neither of them (POI by name)
			 */
			isPoiCategory : function(term) {
				var typeCategories = list.poiTypes.keys();
				for (var i = 0; i < typeCategories.length; i++) {
					var cat = typeCategories[i];
					if (term == cat) {
						return true;
					}

					var detailedTypes = list.poiTypes.get(cat);
					for (var j = 0; j < detailedTypes.length; j++) {
						if (detailedTypes[j] == term) {
							return false;
						}
					}
				}
				//term is neither category nor type ('poi by name')
				return null;
			},

			/**
			 * convert a distance to an easy to read format.
			 * @param distance: a number
			 * @param uom: distance unit; one of m/yd
			 */
			convertDistanceFormat : function(distance, uom) {
				uom = uom.toLowerCase();
				distance = parseFloat(distance);
				if (uom == list.distanceUnitsPreferences[0]) {
					if (distance >= 1000) {
						uom = 'km';
						distance = distance / 1000;
						distance = util.round(distance);
					} else {
						uom = 'm';
					}
					distance = util.round(distance);
					return [distance, uom];
				} else if (uom == list.distanceUnitsPreferences[1]) {
					if (distance >= 1760) {
						uom = 'mi';
						distance = distance / 1760;
						distance = util.round(distance);
					} else {
						uom = 'yd';
					}
					return [distance, uom];
				}
			}
		}
		return util;
	}());
/* ======================================================================
    list.js
   ====================================================================== */

/**
 * various keyword lists used in the ORS application
 */

list = {
	languages: ['de', 'en', 'pl'], 
	
	routingLanguages : ['en', 'de', 'pl', 'bg', 'cz', 'nl', 'hr', 'hu', 'nl_BE', 'es', 'eo', 'fi', 'fr', 'it', 'pt_BR', 'ro', 'ru', 'se', 'dk', 'tr', 'ca', 'ja', 'no', 'vi', 'nb', 'de-rheinl', 'de-opplat', 'de-berlin', 'de-swabia', 'de-ruhrpo', 'de-at-ooe', 'de-bay'],
		
	distanceUnits: ['m', 'km', 'yd', 'mi'],
	distanceUnitsPreferences : ['m', 'yd'],
	//as visible in the user preferences popup
	distanceUnitsInPopup: ['m / km', 'yd / mi'],
	
	version : ['standardVersion', 'extendedVersion'],
	
	poiCategories: ['amenity', 'public_tran', 'shop', 'tourism', 'leisure', 'sport'],
	
	poiTypes: new Hash({
		'amenity': ['atm', 'bank', 'bureau_de_change', 'biergarten', 'bus_station', 'cafe', 'cinema', 'college', 'courthouse',
			'fast_food', 'fuel', 'hospital', 'library', 'nightclub', 'parking', 'pharmacy', 'place_of_worship', 'police', 
			'post_box', 'post_office', 'pub', 'public_building', 'restaurant', 'school', 'taxi', 'telephone', 'theatre', 
			'toilets', 'townhall', 'university'], 
		'public_tran': ['bus_stop', 'bus_station', 'railway_station', 'tram_stop', 'subway_entrance', 'parking'], 
		'shop': ['supermarket', 'convenience', 'bakery', 'butcher', 'kiosk'], 
		'tourism': ['information','hotel', 'motel', 'guest_house', 'hostel', 'camp_site', 'caravan_site', 'chalet', 'viewpoint'], 
		'leisure': ['sports_centre', 'golf_course', 'stadium', 'track', 'pitch', 'water_park', 'marina', 'slipway', 'fishing', 'nature_reserve', 
			'park', 'playground', 'garden', 'ice_rink', 'miniature_golf'], 
		'sport': ['9pin', '10pin', 'archery', 'athletics', 'australian_football', 'baseball', 'basketball', 'beachvolleyball', 'boules', 'bowls', 
			'canoe', 'chess', 'climbing','cricket', 'cricket_nets', 'croquet', 'cycling', 'diving', 'dog_racing', 'equestrian', 'football', 'golf', 'gymnastics', 
			'hockey', 'horse_racing', 'korfball', 'motor', 'orienteering', 'paddle_tennis', 'squash', 'paragliding', 'pelota', 'racquet', 'rowing', 'rugby', 
			'shooting', 'skating', 'skateboard', 'skiing', 'soccer', 'swimming', 'table_tennis', 'team_handball', 'tennis', 'volleyball']
	}),

	//please make sure that each category contains at least one element. all names in the hash have to be unique.
	routePreferences: new Hash({
		'car': ['Fastest', 'Shortest'],
		'bicycle': ['Bicycle', 'BicycleSafety', 'BicycleRoute', 'BicycleMTB', 'BicycleRacer'],
		'pedestrian': ['Pedestrian']
	}),
	
	routeAvoidables : ['Highway', 'Tollway'],
	
	routePreferencesImages: new Hash({
		'car': ['img/picto-car.png', 'img/picto-car-high.png'],
		'bicycle': ['img/picto-bike.png', 'img/picto-bike-high.png'],
		'pedestrian' : ['img/picto-dude.png', 'img/picto-dude-high.png']
	})
};
/* ======================================================================
    modules/Preferences.js
   ====================================================================== */

var Preferences = ( function(w) {'use strict';

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
		this.dictionary = window['lang_' + this.language];

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
	 * @return the term or empty string if there exists no term for the translation
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

	/**
	 * automatically determines default parameters for variables or applies GET variables
	 * @return GET variables that need to be applied to other objects directly 
	 */
	function loadPreferencesOnStartup() {
		this.language = this.setLanguage();
		this.dictionary = window['lang_' + this.language];
		this.routingLanguage = this.setRoutingLanguage();
		this.distanceUnit = this.setDistanceUnit();
		this.version = this.setVersion();

		//return GET variables that have to be applied to other objects
		return readGetVars();
	}

	/**
	 * extracts GET variables
	 * @return array of GET variables
	 */
	function readGetVars() {
		var res = OpenLayers.Util.getParameters();
		var getVars = new Array();
		for (var name in res) {
			getVars[name] = res[name];
		}
		return getVars;
	}

	/**
	 * determines language by cookie information, browser language or uses English by default
	 * @return the language 
	 */
	function setLanguage() {
		//read from cookie
		var lang = readCookie(prefNames[this.languageIdx]);
		
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
		}

		if (list.languages.indexOf(lang) == -1) {
			//this language doesn't exist in ORS, use default
			lang = 'en';
		}

		return lang;
	}
	
	/**
	 * determines language for routing instructions either by cookie information, browser language or uses English by default
	 * @return the language
	 */
	function setRoutingLanguage() {
		//read from cookie
		var lang = readCookie(prefNames[this.routingLanguageIdx]);
		
		//if no cookie is available, use the language of the ORS site
		if (!lang) {
			var lang = this.language;
		}

		if (list.routingLanguages.indexOf(lang) == -1) {
			//this language doesn't exist in ORS, use default
			lang = 'en';
		}
		return lang;
	}

	/**
	 * determines the distance unit either by cookie information or uses m/ km by default
	 * @return the distance unit 
	 */
	function setDistanceUnit() {
		//read from cookie
		var distUnit = readCookie(prefNames[this.distanceUnitIdx]);

		//if no cookie is available, use default
		if (!distUnit) {
			distUnit = list.distanceUnitsPreferences[0];
		}
		return distUnit;
	}

	/**
	 * determines the site version either by cookie or using the standard version by default
	 * @return the version 
	 */
	function setVersion() {
		//read from cookie
		var siteVersion = readCookie(prefNames[this.versionIdx]);
		
		//if no cookie is available, use default
		if (!siteVersion) {
			siteVersion = list.version[0];
		}
		return siteVersion;
	}

	/**
	 * determines the map positoin by using GET variable, cookie or geolocation feature
	 * @param pos: extracted from the GET variables in readGetVars(); array containing lon and lat coordinates
	 * @return the position
	 */
	function loadMapPosition(pos) {
		if (pos && pos.length == 2) {
			//use GET variables (permalink)
			pos = new OpenLayers.LonLat(pos[0], pos[1]);
		}
		if (!pos) {
			//if GET is not set and geolocation not available use cookie
			pos = unescape(readCookie(prefNames[this.positionIdx]));
			//contains sth like '1018700.9016211,6334189.5605773', parse it!
			if (pos != "null") {
				var pos = pos.split(',');
				pos = new OpenLayers.LonLat(pos[0], pos[1]);
			}
		}
		//if neither GET nor cookie have been set -> use Geolocation (called in control.js) or default (Heidelberg) which is automatically set when initializing the map

		//save this location in the permaInfo array
		permaInfo[this.positionIdx] = escape(pos.lon + ',' + pos.lat);

		return pos;
	}

	/**
	 * determines the zoom level of the map by using GET variable or cookie
	 * @param zoomGet: extracted from the GET variables in readGetVars()
	 * @return the zoom level
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
	 * determines active map layers by using GET variable or cookie
	 * @param layerCode: extracted from the GET variables in readGetVars()
	 * @return the encoded layer information
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
	 * determines waypoints by using GET variable (default is no waypoints set)
	 * @param waypoints: extracted from the GET variables in readGetVars()
	 * @return array of waypoints represented by OL.LonLat coordinates
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
	 * determines route options by GET variable
	 * @param routeOpt: extracted from the GET variables in readGetVars()
	 * @return the route options
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
	 * determines route option avoidables by GET variable
	 * @param highway, tollway: extracted from the GET variables in readGetVars()
	 * @return the avoidables
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
	 * determines avoid areas by GET variable
	 * @param avoidAreas: extracted from the GET variables in readGetVars()
	 * @return an array of avoid areas; each area is represented by an OL.Geometry.Polygon
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
	 * @param key: the index of the permaInfo array to update
	 * @param value: the value that should be assigned to that field
	 */
	function updatePreferences(key, value) {
		permaInfo[key] = escape(value);
	}

	/*
	* COOKIES
	*/

	/**
	 * gets the cookie with the given name
	 * @param name: the name of the cookie
	 * @return: the content of the cookie
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
	 * @param lon: lon coordinate of current position
	 * @param lat: lat coordinate of current position
	 * @param zoomLvl: map zoom level
	 * @param layerCode: encoded layer information (which layers and overlays are active)
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
	 * @param key: the index of the prefNames array to update
	 * @param value: the value that should be assigned to that field
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
			
			this.dictionary = window['lang_' + this.language];
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
	
	/**
	 * the site is reloaded with the permalink (used after preferences have been changed) 
	 */
	function reloadWithPerma() {
		var query = '?';
		for (var i = 0; i < prefNames.length; i++) {
			query += prefNames[i] + '=' + permaInfo[i] + '&';
		}
		//slice away last '&'
		query = query.substring(0, query.length - 1);
		window.location.search = query;
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
	Preferences.prototype.reloadWithPerma = reloadWithPerma;
	
	return new Preferences();
}(window));
/* ======================================================================
    OpenRouteService.js
   ====================================================================== */

var OpenRouteService = ( function(w) {"use strict";

		var $ = w.jQuery;

		function OpenRouteService() {
		}

		return new OpenRouteService();

	}(window));
/* ======================================================================
    event.js
   ====================================================================== */

var EventEmitter = (function () {
    "use strict";
		
	/**
	 * Constructor
	 */
	function eventEmitter() {
		/**
		 * Registered events and their callbacks
		 * @type {Object}
		 */
		this.events = {};
	}

	/**
	 * Registers a callback function to a given event.
     * @param  {String} ev The event identifier.
	 * @param  {Function} callback The callback function.
	 */
	function register(ev, callback) {
		if (!this.events[ev]) {this.events[ev] = []; }
		this.events[ev].push(callback);
	}

	/**
	 * Emits an event by calling all registered callback functions
	 * @param  {String} ev The event identifier
     * @param  {Object} eventObj An optional object giving information on the state of the event
	 */
	function emit(ev, eventObj) {
		if (this.events[ev]) {
			for (var i = 0, len = this.events[ev].length; i < len; i++) {
				this.events[ev][i](eventObj);
			}
		}
	}
	
	eventEmitter.prototype.register = register;
	eventEmitter.prototype.emit = emit;

	return eventEmitter;
}());
/* ======================================================================
    modules/Waypoint.js
   ====================================================================== */

/**
 * note: naming conventions
 * for search result elements:
 * map markers as well as DOM elements have an id like "address_WP-ID_SEARCH-ID", e.g. address_1_4 when searching for the 2nd waypoint, 5th result
 * for waypoint elements (after selecting a search result):
 * map markers as well as DOM elements have an id like "waypoint_WP-ID", e.g. waypoint_1 for the 2nd waypoint
 */
var Waypoint = (function(w) {'use strict';

	var waypointsSet = [false, false];
	var requestCounterWaypoints = [0, 0];

	/**
	 * Constructor
	 */
	function Waypoint() {
		this.nextUnsetWaypoint = 0;
	}

	/**
	 * Sends the address search request to the service and calls the callback function.
	 * @param  {String}   address  Address to be geocoded
	 * @param  {Function} successCallback Callback which is called after the results are returned from Nominatim
	 * @param  {Function} failureCallback Callback which is called after an error occured
	 * @param  {Integer} index of the waypoint in the route
	 * @param language: language of the results
	 */
	function find(address, successCallback, failureCallback, wpIndex, language) {
		//build request
		var writer = new XMLWriter('UTF-8', '1.0');
		writer.writeStartDocument();
		//<xls:XLS>
		writer.writeElementString('xls:XLS');
		writer.writeAttributeString('xmlns:xls', namespaces.xls);
		writer.writeAttributeString('xsi:schemaLocation', namespaces.schemata.locationUtilityService);
		writer.writeAttributeString('xmlns:sch', namespaces.ascc);
		writer.writeAttributeString('xmlns:gml', namespaces.gml);
		writer.writeAttributeString('xmlns:xlink', namespaces.xlink);
		writer.writeAttributeString('xmlns:xsi', namespaces.xsi);
		writer.writeAttributeString('version', '1.1');
		writer.writeAttributeString('xls:lang', language);
		//<xls:RequestHeader />
		writer.writeElementString('xls:RequestHeader');
		//<xls:Request>
		writer.writeStartElement('xls:Request');
		writer.writeAttributeString('methodName', 'GeocodeRequest');
		writer.writeAttributeString('version', '1.1');
		writer.writeAttributeString('requestID', '00');
		// writer.writeAttributeString('maximumResponses', '15');
		//<xls:GeocodeRequest>
		writer.writeStartElement('xls:GeocodeRequest');
		//<xls:Address>
		writer.writeStartElement('xls:Address');
		writer.writeAttributeString('countryCode', language);
		//<xls:freeFormAddress />
		writer.writeElementString('xls:freeFormAddress', address);
		//</xls:Address>
		writer.writeEndElement();
		//</xls:GeocodeRequest>
		writer.writeEndElement();
		//</xls:Request>
		writer.writeEndElement();
		//</xls:XLS>
		writer.writeEndDocument();

		var xmlRequest = writer.flush();
		writer.close();

		var success = function(result) {
			successCallback(result, wpIndex);
		}
		var failure = function() {
			failureCallback(wpIndex);
		}
		var request = OpenLayers.Request.POST({
			url : namespaces.services.geocoding,
			data : xmlRequest,
			success : success,
			failure : failure,
		});
	}

	/**
	 *extract points to use for markers on map
	 * @param {Object} results the (xml) results from the service
	 * @param wpIndex: index of the waypoint
	 * @return: array of OL.LonLat representing the coordinates of the waypoint results
	 */
	function parseResultsToPoints(results, wpIndex) {
		var europeBbox = new OpenLayers.Bounds(-31.303, 34.09, 50.455, 71.869);

		var listOfPoints = [];

		var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'GeocodeResponseList');
		$A(geocodeResponseList).each(function(geocodeResponse) {
			var allAddress = $A(util.getElementsByTagNameNS(geocodeResponse, namespaces.xls, 'GeocodedAddress'));
			for (var i = 0; i < allAddress.length; i++) {
				var point = util.getElementsByTagNameNS(allAddress[i], namespaces.gml, 'pos')[0];
				point = (point.firstChild.nodeValue).split(" ");
				point = new OpenLayers.LonLat(point[0], point[1]);

				if (europeBbox.containsLonLat(point)) {
					listOfPoints.push(point);
				} else {
					listOfPoints.push(null);
				}
			}
		});

		return listOfPoints;
	}

	/**
	 * set the type of the waypoint either as start, via or end according to the waypoint's position in the route
	 * @return the type
	 */
	function determineWaypointType(wpIndex) {
		var type;
		if (wpIndex == 0) {
			type = this.type.START;
		} else if (wpIndex == waypointsSet.length - 1) {
			type = this.type.END;
		} else {
			type = this.type.VIA;
		}

		var el = document.getElementById(wpIndex);
		var typeUnset = true;
		if (el && el.className) {
			var c = el.getAttribute("class");
			c = " " + c + " ";
			typeUnset = c.indexOf(' ' + this.type.UNSET + ' ') > -1;
		}
		if (typeUnset) {
			type = this.type.UNSET;
		}
		return type;
	}

	/**
	 * adds a waypoint at the given index. if no index is given, the waypoint is appended at the end of the list
	 * @param index: index of the waypoint to add 
	 */
	function addWaypoint(index) {
		if (index) {
			waypointsSet.splice(index, 0, false);
			requestCounterWaypoints.splice(index, 0, 0);
		} else {
			waypointsSet.push(false);
			requestCounterWaypoints.push(0);
		}
	}

	/**
	 * removes the waypoint at the given index.
	 * @param index: index of the waypoint to remove. Nothing is removed if no index is given. 
	 */
	function removeWaypoint(index) {
		if (index) {
			waypointsSet.splice(index, 1);
			requestCounterWaypoints.splice(index, 1);
		}
	}

	/**
	 * get the number of waypoints 
	 */
	function getNumWaypoints() {
		return waypointsSet.length;
	}

	/**
	 * marks the given waypoint as set or unset
	 * @param index: index of the waypoint to set
	 * @param set: either true (to mark the waypoint set) or false (to mark the waypoint as unset) 
	 */
	function setWaypoint(index, set) {
		waypointsSet[index] = set;
	}

	/**
	 * gets the 'set' state of the given waypoint
	 * @param index: index of the waypoint
	 * @return: true, if the given waypoint is set; false otherwise 
	 */
	function getWaypointSet(index) {
		return waypointsSet[index];
	}

	/**
	 * gets the number of currently pending requests for the given waypoint
	 * @param index: the index of the waypoint
	 * @return: number of active requests 
	 */
	function getRequestCounterWaypoint(index) {
		return requestCounterWaypoints[index];
	}

	/**
	 * increases the number of active requests for the given waypoint
	 * @param index: the index of the waypoint 
	 */
	function incrRequestCounterWaypoint(index) {
		requestCounterWaypoints[index]++;
	}

	/**
	 * decreases the number of active requests for the given waypoint
	 * @param index: index of the waypoint 
	 */
	function decrRequestCounterWaypoint(index) {
		requestCounterWaypoints[index]--;
	}

	/**
	 * finds the next unset waypoint in the list of all waypoints starting at a given index
	 * @param {Object} startingAt index to start looking for an empty waypoint
	 * @return index of the empty waypoint or -1 if none exists
	 */
	function getNextUnsetWaypoint(startingAt) {
		var start = startingAt ? startingAt : 0;
		for (var i = start; i < waypointsSet.length; i++) {
			if (!waypointsSet[i]) {
				return i;
			}
		}
		return -1;
	}
	
	/**
	 * @return number of set waypoints 
	 */
	function getNumWaypointsSet() {
		var cnt = 0;
		for (var i = 0; i < waypointsSet.length; i++) {
			if (waypointsSet[i]) {
				cnt++;
			}
		}
		return cnt;
	}
	
	/**
	 * used for debugging information 
	 */
	function getDebugInfo() {
		return waypointsSet;
	}

	Waypoint.prototype.find = find;
	Waypoint.prototype.parseResultsToPoints = parseResultsToPoints;
	Waypoint.prototype.determineWaypointType = determineWaypointType;
	Waypoint.prototype.getNumWaypoints = getNumWaypoints;
	Waypoint.prototype.addWaypoint = addWaypoint;
	Waypoint.prototype.removeWaypoint = removeWaypoint;
	Waypoint.prototype.setWaypoint = setWaypoint;
	Waypoint.prototype.getWaypointSet = getWaypointSet;
	Waypoint.prototype.getRequestCounterWaypoint = getRequestCounterWaypoint;
	Waypoint.prototype.incrRequestCounterWaypoint = incrRequestCounterWaypoint;
	Waypoint.prototype.decrRequestCounterWaypoint = decrRequestCounterWaypoint;
	Waypoint.prototype.getNextUnsetWaypoint = getNextUnsetWaypoint;
	Waypoint.prototype.getNumWaypointsSet = getNumWaypointsSet;
	Waypoint.prototype.getDebugInfo = getDebugInfo;

	return new Waypoint();
})(window);

Waypoint.type = {
	START : 'start',
	VIA : 'via',
	END : 'end',
	UNSET : 'unset'
};
/* ======================================================================
    modules/Geolocation.js
   ====================================================================== */

var Geolocator = ( function(w) {"use strict";

		/**
		 * Constructor
		 */
		function Geolocator() {

		}

		/**
		 * used to determine the user's current location using HTML5 geolocation feature
		 * @param {Object} locationSuccess used to view the user's current position on the map
		 * @param {Object} locationError used to view an error message on the UI
		 * @param {Object} locationError used to view an error message on the UI
		 */
		function locate(locationSuccess, locationError, locationNotSupported) {
			if (w.navigator.geolocation) {
				w.navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
			} else {
				locationNotSupported();
			}
		}

		/**
		 * used to determine the address of the user's current location by sending the position to the server and executing the callback function
		 * @param {Object} position the user's current position
		 * @param {Object} successCallback used to view the address of the current location on the UI
		 * @param {Object} failureCallback used to view an error message on the UI
		 * @param language: the language of the results
		 * @param waypointType: type of the waypoint that has to be looked up, one of START, VIA or END
		 * @param waypointIndex: index of the wayoint
		 * @param featureId: OL map feature id of this waypoint
		 * @param routePresent: flag set to true if a route is available
		 */
		function reverseGeolocate(position, successCallback, failureCallback, language, waypointType, waypointIndex, featureId, routePresent) {
			var writer = new XMLWriter('UTF-8', '1.0');
			writer.writeStartDocument();
			//<xls:XLS>
			writer.writeElementString('xls:XLS');
			writer.writeAttributeString('xmlns:xls', namespaces.xls);
			writer.writeAttributeString('xsi:schemaLocation', namespaces.schemata.locationUtilityService);
			writer.writeAttributeString('xmlns:sch', namespaces.ascc);
			writer.writeAttributeString('xmlns:gml', namespaces.gml);
			writer.writeAttributeString('xmlns:xlink', namespaces.xlink);
			writer.writeAttributeString('xmlns:xsi', namespaces.xsi);
			writer.writeAttributeString('version', '1.1');
			writer.writeAttributeString('xls:lang', language);
			//<xls:RequestHeader />
			writer.writeElementString('xls:RequestHeader');
			//<xls:Request>
			writer.writeStartElement('xls:Request');
			writer.writeAttributeString('methodName', 'ReverseGeocodeRequest');
			writer.writeAttributeString('version', '1.1');
			writer.writeAttributeString('requestID', '00');
			writer.writeAttributeString('maximumResponses', '15');
			//<xls:ReverseGeocodeRequest>
			writer.writeStartElement('xls:ReverseGeocodeRequest');
			//<xls.Position>
			writer.writeStartElement('xls:Position');
			//<gml:Point>
			writer.writeStartElement('gml:Point');
			writer.writeAttributeString('xmlns:gml', namespaces.gml);
			//<gml:pos>
			writer.writeStartElement('gml:pos');
			writer.writeAttributeString('srsName', 'EPSG:4326');
			writer.writeString(position.lon + ' ' + position.lat);
			//</gml:pos>
			writer.writeEndElement();
			//</gml:Point>
			writer.writeEndElement();
			//</xls:Position>
			writer.writeEndElement();
			//</xls:ReverseGeocodeRequest>
			writer.writeEndElement();
			//</xls:Request>
			writer.writeEndElement();
			//</xls:XLS>
			writer.writeEndDocument();

			var xmlRequest = writer.flush();
			writer.close();
			
			var success = function(result) {
				successCallback(result, waypointType, waypointIndex, featureId, routePresent);
			}
			var request = OpenLayers.Request.POST({
				url : namespaces.services.geocoding,
				data : xmlRequest,
				success : success,
				failure : failureCallback
			});
		}

		Geolocator.prototype.locate = locate;
		Geolocator.prototype.reverseGeolocate = reverseGeolocate;

		return new Geolocator();
	}(window));
/* ======================================================================
    modules/SearchAddress.js
   ====================================================================== */

/**
 * note: naming conventions for result elements:
 * map markers as well as DOM elements have an id like "address_ID", e.g. address_4 
 */
var SearchAddress = ( function(window) {"use strict";

		/**
		 * Constructor
		 */
		function SearchAddress() {
			//request counter for service calls
			this.requestCounter = 0;
		}

		/**
		 * Sends the address search request to the service and calls the callback function.
		 * @param  {String} address:  Address to be geocoded
		 * @param  {Function} successCallback: Callback which is called after the results are returned from Nominatim
		 * @param  {Function} failureCallback: Callback which is called after an error occured
		 * @param  {String} language: language of the results
		 */
		function find(address, successCallback, failureCallback, language) {			
			//build request
			var writer = new XMLWriter('UTF-8', '1.0');
			writer.writeStartDocument();
			//<xls:XLS>
			writer.writeElementString('xls:XLS');
			writer.writeAttributeString('xmlns:xls', namespaces.xls);
			writer.writeAttributeString('xsi:schemaLocation', namespaces.schemata.locationUtilityService);
			writer.writeAttributeString('xmlns:sch', namespaces.ascc);
			writer.writeAttributeString('xmlns:gml', namespaces.gml);
			writer.writeAttributeString('xmlns:xlink', namespaces.xlink);
			writer.writeAttributeString('xmlns:xsi', namespaces.xsi);
			writer.writeAttributeString('version', '1.1');
			writer.writeAttributeString('xls:lang', language);
			//<xls:RequestHeader />
			writer.writeElementString('xls:RequestHeader');
			//<xls:Request>
			writer.writeStartElement('xls:Request');
			writer.writeAttributeString('methodName', 'GeocodeRequest');
			writer.writeAttributeString('version', '1.1');
			writer.writeAttributeString('requestID', '00');
			// writer.writeAttributeString('maximumResponses', '15');
			//<xls:GeocodeRequest>
			writer.writeStartElement('xls:GeocodeRequest');
			//<xls:Address>
			writer.writeStartElement('xls:Address');
			writer.writeAttributeString('countryCode', language);
			//<xls:freeFormAddress />
			writer.writeElementString('xls:freeFormAddress', address);
			//</xls:Address>
			writer.writeEndElement();
			//</xls:GeocodeRequest>
			writer.writeEndElement();
			//</xls:Request>
			writer.writeEndElement();
			//</xls:XLS>
			writer.writeEndDocument();

			var xmlRequest = writer.flush();
			writer.close();

			var request = OpenLayers.Request.POST({
				url : namespaces.services.geocoding,
				data : xmlRequest,
				success : successCallback,
				failure : failureCallback,
			});
		}

		/**
		 *extract points to use for markers on map
		 * @param {Object} results the (xml) results from the service
		 * @return: array of OL.LonLat representing the coordinates of the address results
		 */
		function parseResultsToPoints(results) {
			var europeBbox = new OpenLayers.Bounds(-31.303, 34.09, 50.455, 71.869);

			var listOfPoints = [];

			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'GeocodeResponseList');
			$A(geocodeResponseList).each(function(geocodeResponse) {
				var allAddress = $A(util.getElementsByTagNameNS(geocodeResponse, namespaces.xls, 'GeocodedAddress'));
				for (var i = 0; i < allAddress.length; i++) {
					var point = util.getElementsByTagNameNS(allAddress[i], namespaces.gml, 'pos')[0];
					point = (point.firstChild.nodeValue).split(" ");
					point = new OpenLayers.LonLat(point[0], point[1]);

					if (europeBbox.containsLonLat(point)) {
						listOfPoints.push(point);
					} else {
						listOfPoints.push(null);
					}
				}
			});

			return listOfPoints;
		}


		SearchAddress.prototype.find = find;
		SearchAddress.prototype.parseResultsToPoints = parseResultsToPoints;

		return new SearchAddress();
	}(window));
/* ======================================================================
    modules/SearchPoi.js
   ====================================================================== */

/**
 * note: naming conventions for result elements:
 * map markers as well as DOM elements have an id like "poi_ID", e.g. poi_4 
 */
var SearchPoi = ( function(window) {"use strict";

		/**
		 * Constructor
		 */
		function SearchPoi() {
			//request counter for service calls
			this.requestCounter = 0;
		}

		/**
		 * Sends the request with the POI to the service and calls the callback function.
		 * @param {String} searchQuery: POI to be searched
		 * @param refPoint: reference point picked from the middle of the map to form the center of the POI search OR route points when POIs along the route have to be searched
		 * @param maxDist: maximum distance from route to POI (applies only for "find POI along route"-search)
		 * @param {Function} successCallback: Callback which is called after the results are returned from Nominatim
		 * @param {Function} failureCallback: failureCallback used to view an error message on the UI
		 * @param language: language of the results
		 */
		function find(searchQuery, refPoint, maxDist, distanceUnit, successCallback, failureCallback, language) {
			maxDist = maxDist > 5000 ? 5000 : maxDist;
			distanceUnit = distanceUnit.toUpperCase();
			
			//build request
			var writer = new XMLWriter('UTF-8', '1.0');
			writer.writeStartDocument();
			//<xls:XLS>
			writer.writeElementString('xls:XLS');
			writer.writeAttributeString('xmlns:xls', namespaces.xls);
			writer.writeAttributeString('xsi:schemaLocation', namespaces.schemata.directoryService);
			writer.writeAttributeString('xmlns:sch', namespaces.ascc);
			writer.writeAttributeString('xmlns:gml', namespaces.gml);
			writer.writeAttributeString('xmlns:xlink', namespaces.xlink);
			writer.writeAttributeString('xmlns:xsi', namespaces.xsi);
			writer.writeAttributeString('version', '1.1');
			writer.writeAttributeString('xls:lang', language);
			//<xls:RequestHeader />
			writer.writeElementString('xls:RequestHeader');
			//<xls:Request>
			writer.writeStartElement('xls:Request');
			writer.writeAttributeString('methodName', 'DirectoryRequest');
			writer.writeAttributeString('version', '1.1');
			writer.writeAttributeString('requestID', '00');
			writer.writeAttributeString('maximumResponses', '100');
			//<xls:DirectoryRequest>
			writer.writeStartElement('xls:DirectoryRequest');
			writer.writeAttributeString('distanceUnit', distanceUnit);
			writer.writeAttributeString('sortCriteria', 'Distance');

			//we are only allowed to include the position + distance if we are NOT searching for a POI by name (free text)
			var generalTermSearchQuery = Preferences.reverseTranslate(searchQuery);

			if (null != util.isPoiCategory(generalTermSearchQuery)) {
				//<xls:POILocation>
				writer.writeStartElement('xls:POILocation');

				if (refPoint.length == 1) {
					//searching for POIs on screen...
					findPoisOnScreen(writer, refPoint, maxDist, distanceUnit);
				} else {
					// searching near given route...
					findPoisNearRoute(writer, refPoint, maxDist);
				}
				//</xls:POILocation>
				writer.writeEndElement();
			}
			//<xls:POIProperties>
			writer.writeStartElement('xls:POIProperties');
			writer.writeAttributeString('directoryType', 'OSM');
			//<xls:POIProperty />
			writer.writeStartElement('xls:POIProperty');
			var isCategory = util.isPoiCategory(generalTermSearchQuery);
			if (isCategory == true) {
				//user searches for a category
				writer.writeAttributeString('name', 'Keyword');
				writer.writeAttributeString('value', generalTermSearchQuery);
			} else if (isCategory == false) {
				//user searches for a type
				writer.writeAttributeString('name', 'NAICS_type');
				writer.writeAttributeString('value', generalTermSearchQuery);
			} else {
				//neither category nor type -> must bee freetext search
				writer.writeAttributeString('name', 'POIName');
				writer.writeAttributeString('value', searchQuery);
			}
			writer.writeEndElement();
			//</xls:POIProperties>
			writer.writeEndElement();
			//</xls:DirectoryRequest>
			writer.writeEndElement();
			//</xls:Request>
			writer.writeEndElement();
			//</xls:XLS>
			writer.writeEndDocument();

			var xmlRequest = writer.flush();
			writer.close();
			
			var request = OpenLayers.Request.POST({
				url : namespaces.services.directory,
				data : xmlRequest,
				success : successCallback,
				failure : failureCallback
			});
		}

		/**
		 * builds part of the XML request; applies to finding all POIs on the visible map that match the query
		 * @param writer: the XML writer 
		 * @param refPoint: the center of the (visible) map
		 * @maxDist: maximum distance to the reference point
		 * @distanceUnit: unit of distance
		 */
		function findPoisOnScreen(writer, refPoint, maxDist, distanceUnit) {
			if (refPoint && refPoint.length > 0) {
				refPoint = refPoint[0];
			}

			//<xls:WithinDistance>
			writer.writeStartElement('xls:WithinDistance');
			//<xls:Position>
			writer.writeStartElement('xls:Position');
			//<gml:Point>
			writer.writeStartElement('gml:Point');
			//<gml:pos />
			writer.writeElementString('gml:pos', refPoint.lon + " " + refPoint.lat);
			//</gml:Point>
			writer.writeEndElement();
			//</xls:Position>
			writer.writeEndElement();
			//<xls:MinimumDistance />
			writer.writeStartElement('xls:MinimumDistance');
			writer.writeAttributeString('value', '0');
			writer.writeAttributeString('uom', distanceUnit);
			writer.writeEndElement();
			//<xls:MaximumDistance />
			writer.writeStartElement('xls:MaximumDistance');
			writer.writeAttributeString('value', maxDist);
			writer.writeAttributeString('uom', distanceUnit);
			writer.writeEndElement();
			//</xls:WithinDistance>
			writer.writeEndElement();
		}

		/**
		 * builds part of the XML request; applies to finding all POIs along the route that match the query
		 * @param writer: the XML writer 
		 * @param refPoint: the route line
		 * @maxDist: maximum distance to the route
		 */
		function findPoisNearRoute(writer, refPoint, maxDist) {
			//calculate buffer polygon around route
			var routePoints = [];
			var reader = new jsts.io.WKTReader();
			var readerInput = "LINESTRING (";
			for (var i = 0; i < refPoint.length; i++) {
				//create a new object. otherwise it is called by reference and causes errors for multiple calculations
				var newPt = new OpenLayers.Geometry.Point(refPoint[i].x, refPoint[i].y);
				newPt = newPt.transform(new OpenLayers.Projection('EPSG:900913'), new OpenLayers.Projection('EPSG:4326'));
				routePoints.push(newPt);
				readerInput += newPt.x + " " + newPt.y + ", ";
			}
			//remove last ", "
			readerInput = readerInput.substring(0, readerInput.length - 2);
			readerInput += ")";

			var bufferMaxDist = ((maxDist * 360) / 40000000) + "";

			var input = reader.read(readerInput);
			var buffer = input.buffer(bufferMaxDist);

			var parser = new jsts.io.OpenLayersParser();
			input = parser.write(input);
			buffer = parser.write(buffer);

			//convert polygon buffer to array of OL.LonLat
			var polygonPoints = (buffer.components[0]).components;
			refPoint = [];
			for (var i = 0; i < polygonPoints.length; i++) {
				var pt = new OpenLayers.LonLat(polygonPoints[i].x, polygonPoints[i].y);
				refPoint.push(pt);
			}

			//<xls:WithinBoundary>
			writer.writeStartElement('xls:WithinBoundary');
			//<xls:AOI>
			writer.writeStartElement('xls:AOI');
			//<gml:Polygon>
			writer.writeStartElement('gml:Polygon');
			//<gml:exterior>
			writer.writeStartElement('gml:exterior');
			//<gml:LinearRing>
			writer.writeStartElement('gml:LinearRing');
			//the <gml:pos/> elements
			for (var i = 0; i < refPoint.length; i++) {
				writer.writeElementString('gml:pos', refPoint[i].lon + " " + refPoint[i].lat);
			}
			//</gml:LinearRing>
			writer.writeEndElement();
			//</gml:exterior>
			writer.writeEndElement();
			//</gml:Polygon>
			writer.writeEndElement();
			//</xls:AOI>
			writer.writeEndElement();
			//</xls:WithinBoundary>
			writer.writeEndElement();
		}

		/**
		 *extract points to use for markers on map
		 * @param {Object} results the (xml) results from the service
		 * @return: array of OL.LonLat representing the coordinates of the search results 
		 */
		function parseResultsToPoints(results) {
			var listOfPoints = [];

			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'DirectoryResponse');
			$A(geocodeResponseList).each(function(poiResponse) {
				var allPoi = $A(util.getElementsByTagNameNS(poiResponse, namespaces.xls, 'POIContext'));
				for (var i = 0; i < allPoi.length; i++) {
					var poiResult = allPoi[i];
					
					var point = util.getElementsByTagNameNS(poiResult, namespaces.gml, 'pos')[0];
					point = (point.firstChild.nodeValue).split(" ");
					point = new OpenLayers.LonLat(point[0], point[1]);

					var iconType = util.getElementsByTagNameNS(poiResult, namespaces.xls, 'POI')[0];
					iconType = iconType.getAttribute('description');
					iconType = iconType.substring(0, iconType.indexOf(';'));
					
					point.iconType = iconType;

					listOfPoints.push(point);
				}
			});

			return listOfPoints;
		}


		SearchPoi.prototype.find = find;
		SearchPoi.prototype.parseResultsToPoints = parseResultsToPoints;

		return new SearchPoi();
	}(window));
/* ======================================================================
    modules/Route.js
   ====================================================================== */

var Route = ( function(w) {"use strict";

		/**
		 * Constructor
		 */
		function Route() {
			this.routePresent = false;
			this.routeString = null;
		}

		/**
		 * builds and sends the service request and calls the callback function
		 * @param routePoints: array of OL.LonLat representing the waypoints of the route
		 * @param successCallback: Callback which is called after the results are returned from the service
		 * @param failureCallback: Callback which is called after an error occured
		 * @param language: language for the routing instructions
		 * @param routePref: route preference, e.g. Fastest
		 * @param avoidMotorways: flag set to true if motorways should be avoided in the route; else: false
		 * @param avoidTollways: flag set to true if tollways should be avoided in the route; else: false
		 * @param avoidAreas: array of avoid areas represented by OL.Geometry.Polygons
		 */
		function calculate(routePoints, successCallback, failureCallback, language, routePref, avoidMotorways, avoidTollways, avoidAreas) {
			var writer = new XMLWriter('UTF-8', '1.0');
			writer.writeStartDocument();
			//<xls:XLS>
			writer.writeElementString('xls:XLS');
			writer.writeAttributeString('xmlns:xls', namespaces.xls);
			writer.writeAttributeString('xsi:schemaLocation', namespaces.schemata.routeService);
			writer.writeAttributeString('xmlns:sch', namespaces.ascc);
			writer.writeAttributeString('xmlns:gml', namespaces.gml);
			writer.writeAttributeString('xmlns:xlink', namespaces.xlink);
			writer.writeAttributeString('xmlns:xsi', namespaces.xsi);
			writer.writeAttributeString('version', '1.1');
			writer.writeAttributeString('xls:lang', language);
			//<xls:RequestHeader />
			writer.writeElementString('xls:RequestHeader');

			//<xls:Request>
			writer.writeStartElement('xls:Request');
			writer.writeAttributeString('methodName', 'RouteRequest');
			writer.writeAttributeString('version', '1.1');
			writer.writeAttributeString('requestID', '00');
			writer.writeAttributeString('maximumResponses', '15');
			//<xls:DetermineRouteRequest>
			writer.writeStartElement('xls:DetermineRouteRequest');
			//<xls:RoutePlan>
			writer.writeStartElement('xls:RoutePlan');
			//<xls:RoutePreference />
			writer.writeElementString('xls:RoutePreference', routePref || 'Fastest');
			//<xls:WayPointList>
			writer.writeStartElement('xls:WayPointList');
			for (var i = 0; i < routePoints.length; i++) {
				if (i == 0) {
					writer.writeStartElement('xls:StartPoint');
				} else if (i == (routePoints.length - 1)) {
					writer.writeStartElement('xls:EndPoint');
				} else {
					writer.writeStartElement('xls:ViaPoint');
				}

				//<xls:Position>
				writer.writeStartElement('xls:Position');
				//<gml:Point>
				writer.writeStartElement('gml:Point');
				writer.writeAttributeString('xmlns:gml', namespaces.gml)
				//<gml:pos />
				writer.writeStartElement('gml:pos');
				writer.writeAttributeString('srsName', 'EPSG:4326');
				writer.writeString(routePoints[i].lon + ' ' + routePoints[i].lat);
				writer.writeEndElement();
				//</gml:Point>
				writer.writeEndElement();
				//</xls:Position>
				writer.writeEndElement();

				writer.writeEndElement();
			}
			//</xls:WayPointList>
			writer.writeEndElement();
			//<xls:AvoidList>
			writer.writeStartElement('xls:AvoidList');
			if (avoidAreas) {
				//avoidAreas contains an array of OpenLayers.Feature.Vector
				for (var i = 0; i < avoidAreas.length; i++) {
					var currentArea = avoidAreas[i];
					//<xls:AOI>
					writer.writeStartElement('xls:AOI');
					//<gml:Polygon>
					writer.writeStartElement('gml:Polygon');
					//<gml:exterior>
					writer.writeStartElement('gml:exterior');
					//<gml:LinearRing>
					writer.writeStartElement('gml:LinearRing');

					var corners = currentArea.geometry.components[0].components;
					for (var j = 0; j < corners.length; j++) {
						var pt = new OpenLayers.LonLat(corners[j].x, corners[j].y);
						pt = pt.transform(new OpenLayers.Projection('EPSG:900913'), new OpenLayers.Projection('EPSG:4326'));
						writer.writeStartElement('gml:pos');
						writer.writeString(pt.lon + ' ' + pt.lat);
						writer.writeEndElement();
					}
					writer.writeEndElement();
					//</gml:exterior>
					writer.writeEndElement();
					//</gml:Polygon>
					writer.writeEndElement();
					//</xls:AOI>
					writer.writeEndElement();
				}
			}
			if (avoidMotorways) {
				writer.writeElementString('xls:AvoidFeature', 'Highway');
			}
			if (avoidTollways) {
				writer.writeElementString('xls:AvoidFeature', 'Tollway');
			}
			//</xls:AvoidList>
			writer.writeEndElement();
			//</xls:RoutePlan>
			writer.writeEndElement();
			//<xls:RouteInstructionsRequest>
			writer.writeStartElement('xls:RouteInstructionsRequest');
			writer.writeAttributeString('provideGeometry', 'true');
			//</xls:RouteInstructionsRequest>
			writer.writeEndElement();
			//</ xls:RouteGeometryRequest>
			writer.writeElementString('xls:RouteGeometryRequest');
			//</xls:DetermineRouteRequest>
			writer.writeEndElement();
			//</xls:Request>
			writer.writeEndElement();
			//</xls:XLS>
			writer.writeEndDocument();

			var xmlRequest = writer.flush();
			writer.close();

			var request = OpenLayers.Request.POST({
				url : namespaces.services.routing,
				data : xmlRequest,
				success : successCallback,
				failure : failureCallback
			});
		}
		
		/**
		 * parses the routing results of the service to a single 'path'
		 * @param results: response of the service
		 * @param routeString: OL.Geometry.LineString representing the whole route
		 */
		function writeRouteToSingleLineString(results) {
			var routeString = [];
			var routeGeometry = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteGeometry')[0];
						
			$A(util.getElementsByTagNameNS(routeGeometry, namespaces.gml, 'pos')).each(function(point) {
						point = point.text || point.textContent;
						point = point.split(' ');
						point = new OpenLayers.Geometry.Point(point[0], point[1]);
						routeString.push(point);
					});
			routeString = new OpenLayers.Geometry.LineString(routeString);			
			return routeString;
		}
		
		/**
		 * the line strings represent a part of the route when driving on one street (e.g. 7km on autoroute A7)
		 * we examine the lineStrings from the instruction list to get one lineString-ID per route segment so that we can support mouseover/mouseout events on the route and the instructions
		 * @param {Object} results: XML response
		 * @param {Object} converterFunction
		 */
		function parseResultsToLineStrings(results, converterFunction) {
			var listOfLineStrings = [];

			var routeInstructions = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteInstructionsList')[0];
			if (routeInstructions) {
				routeInstructions = util.getElementsByTagNameNS(routeInstructions, namespaces.xls, 'RouteInstruction');
				$A(routeInstructions).each(function(instructionElement) {
					var segment = [];
					$A(util.getElementsByTagNameNS(instructionElement, namespaces.gml, 'pos')).each(function(point) {
						point = point.text || point.textContent;
						point = point.split(' ');
						point = new OpenLayers.LonLat(point[0], point[1]);
						point = converterFunction(point);
						point = new OpenLayers.Geometry.Point(point.lon, point.lat);
						segment.push(point);
					});
					segment = new OpenLayers.Geometry.LineString(segment);
					listOfLineStrings.push(segment);
				});
			}
			return listOfLineStrings;
		}

		/**
		 * corner points are points in the route where the direction changes (turn right at street xy...)
		 * @param {Object} results: XML response
		 * @param {Object} converterFunction
		 */
		function parseResultsToCornerPoints(results, converterFunction) {
			var listOfCornerPoints = [];

			var routeInstructions = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteInstructionsList')[0];
			if (routeInstructions) {
				routeInstructions = util.getElementsByTagNameNS(routeInstructions, namespaces.xls, 'RouteInstruction');
				$A(routeInstructions).each(function(instructionElement) {
					var point = util.getElementsByTagNameNS(instructionElement, namespaces.gml, 'pos')[0];
					point = point.text || point.textContent;
					point = point.split(' ');
					point = new OpenLayers.LonLat(point[0], point[1]);
					point = converterFunction(point);
					point = new OpenLayers.Geometry.Point(point.lon, point.lat);
					listOfCornerPoints.push(point);
				});
			}
			return listOfCornerPoints;
		}

		/**
		 * checks if the routing request was successful but the response doesn't contain a route but an error message
		 * @param {Object} results XML result of routing request
		 * @return: true, if it contains errors, false otherwise
		 */
		function hasRoutingErrors(results) {
			//check if the route calculation returned an error (e.g. waypoints too far from road)
			var errorTag = util.getElementsByTagNameNS(results, namespaces.xls, 'ResponseHeader');
			errorTag = errorTag.length > 0 ? errorTag[0] : null;
			if (errorTag) {
				var errorText = errorTag.getAttribute('sessionID');
				if (errorText === 'Error') {
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		}


		Route.prototype.calculate = calculate;
		Route.prototype.writeRouteToSingleLineString = writeRouteToSingleLineString;
		Route.prototype.parseResultsToLineStrings = parseResultsToLineStrings;
		Route.prototype.parseResultsToCornerPoints = parseResultsToCornerPoints;
		Route.prototype.hasRoutingErrors = hasRoutingErrors;

		return new Route();
	}(window));
/* ======================================================================
    modules/AccessibilityAnalysis.js
   ====================================================================== */

var AccessibilityAnalysis = ( function(w) {"use strict";

		/**
		 * Constructor
		 */
		function AccessibilityAnalysis() {

		}

		/**
		 * builds and sends the service request
		 * @param {Object} position: OL LonLat or Point representing the reference point
		 * @param {int} distanceInMinutes: radius of the analysis
		 * @param {Object} successCallback: function callback
		 * @param {Object} failureCallback: function callback
		 */
		function analyze(position, distanceInMinutes, successCallback, failureCallback) {
			var writer = new XMLWriter('UTF-8', '1.0');
			writer.writeStartDocument();
			//<aas:AAS>
			writer.writeElementString('aas:AAS');
			writer.writeAttributeString('version', '1.0');
			writer.writeAttributeString('xmlns:aas', namespaces.aas);
			writer.writeAttributeString('xmlns:xsi', namespaces.xsi);
			writer.writeAttributeString('xsi:schemaLocation', namespaces.schemata.analyseService);
			//<aas:RequestHeader />
			writer.writeElementString('aas:RequestHeader');
			//<aas:Request>
			writer.writeStartElement('aas:Request');
			writer.writeAttributeString('methodName', 'AccessibilityRequest');
			writer.writeAttributeString('version', '1.0');
			writer.writeAttributeString('requestID', '00')
			//<aas:DetermineAccessibilityRequest>
			writer.writeStartElement('aas:DetermineAccessibilityRequest');
			//<aas:Accessibility>
			writer.writeStartElement('aas:Accessibility');
			//<aas:AccessibilityPreference>
			writer.writeStartElement('aas:AccessibilityPreference');
			//<aas:Time/>
			writer.writeStartElement('aas:Time');
			writer.writeAttributeString('Duration', 'PT0H' + distanceInMinutes + 'M00S');
			writer.writeEndElement();
			//</aas:AccessibilityPreference
			writer.writeEndElement();
			//<aas:LocationPoint>
			writer.writeStartElement('aas:LocationPoint');
			//<aas:Position>
			writer.writeStartElement('aas:Position');
			//<gml:Point>
			writer.writeStartElement('gml:Point');
			writer.writeAttributeString('xmlns:gml', namespaces.gml);
			writer.writeAttributeString('srsName', 'EPSG:4326');
			//<gml:pos />
			writer.writeStartElement('gml:pos');
			writer.writeString(position.lon + ' ' + position.lat);
			writer.writeEndElement();
			//</gml:Point>
			writer.writeEndElement();
			//</aas:Position>
			writer.writeEndElement();
			//</aas:LocationPoint>
			writer.writeEndElement();
			//</aas:Accessibility>
			writer.writeEndElement();
			//<aas:AccessibilityGeometryRequest>
			writer.writeStartElement('aas:AccessibilityGeometryRequest');
			//<aas:PolygonPreference />
			writer.writeStartElement('aas:PolygonPreference');
			writer.writeString('Detailed');
			writer.writeEndElement();
			//</ aas:AccessibilityGeometryRequest
			writer.writeEndElement();
			//</ aas:DetermineAccessibilityRequest
			writer.writeEndElement();
			//</aas:Request>
			writer.writeEndElement();
			//</aas:AAS>
			writer.writeEndDocument();

			var xmlRequest = writer.flush();
			writer.close();

			var request = OpenLayers.Request.POST({
				url : namespaces.services.analyse,
				data : xmlRequest,
				success : successCallback,
				failure : failureCallback
			});
		}

		/**
		 * processes the results and extracts area bounds
		 * @param {Object} result: the response of the service
		 * @return OL.Bounds containing the accessible area; null in case of an error response
		 */
		function parseResultsToBounds(result) {
				var boundingBox = util.getElementsByTagNameNS(result, namespaces.aas, 'BoundingBox');
				var bounds;
				if (boundingBox && boundingBox.length > 0) {
					bounds = new OpenLayers.Bounds();
					$A(util.getElementsByTagNameNS(boundingBox[0], namespaces.gml, 'pos')).each(function(position) {
						position = util.convertPositionStringToLonLat(position.firstChild.nodeValue);
						position = util.convertPointForMap(position);
						bounds.extend(position);
					});
				}
				return bounds;
		}

		/**
		 * processes the results and extracts area polygons
		 * @param {Object} result: the response of the service
		 * @return OL.Geometry.Polygon representing the accessible area
		 */
		function parseResultsToPolygon(result) {
			var area = util.getElementsByTagNameNS(result, namespaces.aas, 'AccessibilityGeometry');
			var poly;
			if (area) {
				//use first polygon only
				var polygon = util.getElementsByTagNameNS(area[0], namespaces.gml, 'Polygon')[0];
				var linRingPoints = [];
				$A(util.getElementsByTagNameNS(polygon, namespaces.gml, 'pos')).each(function(polygonPos) {
					polygonPos = util.convertPositionStringToLonLat(polygonPos.firstChild.nodeValue);
					polygonPos = util.convertPointForMap(polygonPos);
					polygonPos = new OpenLayers.Geometry.Point(polygonPos.lon, polygonPos.lat);
					linRingPoints.push(polygonPos);
				});
				var ring = new OpenLayers.Geometry.LinearRing(linRingPoints);
				poly = new OpenLayers.Geometry.Polygon([ring]);
			}
			return poly;
		}


		AccessibilityAnalysis.prototype.analyze = analyze;
		AccessibilityAnalysis.prototype.parseResultsToBounds = parseResultsToBounds;
		AccessibilityAnalysis.prototype.parseResultsToPolygon = parseResultsToPolygon;

		return new AccessibilityAnalysis();
	}(window));
/* ======================================================================
    ui/ui.js
   ====================================================================== */

var Ui = ( function(w) {'use strict';
		var $ = w.jQuery,
		//Ui interface
		theInterface,
		//preferences for language selection
		preferences = w.Preferences,
		//functionality of ORS placed in separate tabs
		orsTabs = ['route', 'search'],
		//search POI options: searchNearRoute, maxDist to route, distance Unit for maxDist, search query
		searchPoiAtts = ['false', '100', 'm', ''],
		//routing options for car, bike and pedestrian
		routeOptions = [list.routePreferences.get('car')[0], [null, null]],
		//is a route available?
		routeIsPresent = false,
		//timeout to wait before sending a request after the user finished typing
		DONE_TYPING_INTERVAL = 1200,
		//timers for user input (search)
		typingTimerSearchAddress, typingTimerSearchPoi, typingTimerSearchPoiDistance,
		//timers for user input (waypoints)
		timer0, timer1, typingTimerWaypoints = [timer0, timer1];

		/* *********************************************************************
		* GENERAL
		* *********************************************************************/

		/**
		 * user clicks on e.g. routing tab to view routing functionality
		 * @param e: the event
		 */
		function handleSwitchTabs(e) {
			var tab = e.currentTarget.id;

			for (var i = 0; i < orsTabs.length; i++) {
				if (orsTabs[i] == tab) {
					//show
					$('#' + orsTabs[i]).parent().attr('class', 'active');
					$('#' + orsTabs[i] + 'Panel').css('display', 'inline');
				} else {
					//hide
					$('#' + orsTabs[i]).parent().attr('class', '');
					$('#' + orsTabs[i] + 'Panel').css('display', 'none');
				}
			}
		}

		/**
		 * expands or collapses option panels
		 * @param e: the event
		 */
		function handleToggleCollapsibles(e) {
			if (e.currentTarget.hasClassName('collapsed')) {
				e.currentTarget.removeClassName('collapsed');
				$(e.currentTarget).parent().get(0).querySelector('.collapsibleBody').show();
				//applies for route instructions container only
				var routeInstructions = $(e.currentTarget).parent().get(0).querySelector('#zoomToRouteButton');
				if (routeInstructions) {
					routeInstructions.show();
				}
			} else {
				e.currentTarget.addClassName('collapsed');
				$(e.currentTarget).parent().get(0).querySelector('.collapsibleBody').hide();
				//applies for route instructions container only
				var routeInstructions = $(e.currentTarget).parent().get(0).querySelector('#zoomToRouteButton');
				if (routeInstructions) {
					routeInstructions.hide();
				}
			}
		}

		/**
		 * makes the sidebar visible or invisible (larger map)
		 * @param e: the event
		 */
		function handleToggleSidebar(e) {
			var side = document.getElementById('sidebar');

			//when calling this for the first time on page startup, style.display attribute will be empty which corresponds to the default case of "visible"
			if (side.style.display == 'none') {
				//sidebar is not visible, show it
				$('#sidebar').css('display', 'inline');
				$('#map').css('left', '415px');
				$('#heightProfile').css('left', '415px');
				$('#toggleSidebar').attr('class', 'sidebarVisible');
				//trigger map update
				theInterface.emit('ui:mapPositionChanged');
			} else {
				//sidebar is visible, hide it
				$('#sidebar').css('display', 'none');
				$('#map').css('left', '25px');
				$('#heightProfile').css('left', '25px');
				$('#toggleSidebar').attr('class', 'sidebarInvisible');
				//trigger map update
				theInterface.emit('ui:mapPositionChanged');
			}
		}

		/**
		 * makes the height profile pane visible or invisible (larger map)
		 * @param e: the event
		 */
		function handleToggleHeightProfile(e) {
			var height = $('#heightProfile').get(0);

			//when calling this for the first time on page startup, style.display attribute will be empty which corresponds to the default case of "not visible"
			if (height.style.display == 'inline') {
				//height profile is visible, hide it
				$('#heightProfile').css('display', 'none');
				$('#map').css('bottom', '25px');
				$('#toggleHeightProfile').attr('class', 'heightProfileInvisible');
				//trigger map update
				theInterface.emit('ui:mapPositionChanged');
			} else {
				//height profile is not visible, show it
				$('#heightProfile').css('display', 'inline');
				$('#map').css('bottom', '200px');
				$('#toggleHeightProfile').attr('class', 'heightProfileVisible');
				//trigger map update
				theInterface.emit('ui:mapPositionChanged');
			}
		}

		/* *********************************************************************
		* LANGUAGE-SPECIFIC
		* *********************************************************************/

		/**
		 * if it is the user's first visit to ORS show a popup with information about the settings (version, language,...)
		 */
		function showNewToOrsPopup() {
			var label = new Element('label');
			label.insert(preferences.translate('infoTextVersions'));
			$('#newToOrs').append(label);
			$('#newToOrs').show();
		}

		/* *********************************************************************
		* ALL MARKER ELEMENTS
		* *********************************************************************/

		/**
		 * highlight the element
		 * @param elementId: id of the element to highlight
		 */
		function emphElement(elementId) {
			var element = $('#' + elementId);

			//if parent has class even or odd (== belongs to route instructions), only use class active, no highlight!
			var parentClass = element.parent().attr('class');
			var isRouteInstruction = false;
			if (parentClass) {
				isRouteInstruction = (parentClass.indexOf('even') >= 0) || (parentClass.indexOf('odd') >= 0);
			}

			if (isRouteInstruction) {
				element.get(0).addClassName('active');
			} else {
				element.get(0).addClassName('highlight');
			}
		}

		/**
		 * de-highlight the element
		 * @param elementId: id of the element to deemphasize
		 */
		function deEmphElement(elementId) {
			$('#' + elementId).get(0).removeClassName('highlight');
			$('#' + elementId).get(0).removeClassName('active');
		}

		/**
		 * highlight the mouseover element and emphasize the corresponding marker
		 * @param e: the event
		 */
		function handleMouseOverElement(e) {
			e.currentTarget.addClassName('highlight');
			theInterface.emit('ui:emphElement', {
				id : e.currentTarget.getAttribute('id'),
				layer : e.currentTarget.getAttribute('data-layer')
			});
		}

		/**
		 * de-highlight the mouseover element and emphasize the corresponding marker
		 * @param e: the event
		 */
		function handleMouseOutElement(e) {
			e.currentTarget.removeClassName('highlight');
			theInterface.emit('ui:deEmphElement', {
				id : e.currentTarget.getAttribute('id'),
				layer : e.currentTarget.getAttribute('data-layer')
			});
		}

		/* *********************************************************************
		* WAYPOINTS
		* *********************************************************************/

		/**
		 * the user typed input for the waypoint search. forward the input to start a query
		 * @param e: the event
		 */
		function handleSearchWaypointInput(e) {
			var waypointElement = $(e.currentTarget).parent().parent();

			//index of the waypoint (0st, 1st 2nd,...)
			var index = waypointElement.attr('id');

			clearTimeout(typingTimerWaypoints[index]);
			if (e.keyIdentifier != 'Shift' && e.currentTarget.value.length != 0) {
				var input = e.currentTarget.value;
				waypointElement.attr('data-searchInput', input);
				typingTimerWaypoints[index] = setTimeout(function() {
					//empty search results
					var resultContainer = waypointElement.get(0).querySelector('.searchWaypointResults');
					while (resultContainer && resultContainer.hasChildNodes()) {
						resultContainer.removeChild(resultContainer.lastChild);
					}
					//request new results
					theInterface.emit('ui:searchWaypointRequest', {
						query : input,
						wpIndex : index,
						searchIds : waypointElement.get(0).getAttribute('data-search')
					});
				}, DONE_TYPING_INTERVAL);
			}
		}

		/**
		 * hides or shows a search spinner while searching for the wayoint's address
		 * @param changeToSearching: true, if the spinner should be shown; false otherwise
		 * @param wpIndex: index of the waypoint where to show the spinner
		 */
		function searchWaypointChangeToSearchingState(changeToSearching, wpIndex) {
			var rootElement = $('#' + wpIndex).get(0);
			var inputElement = rootElement.querySelector('input');

			if (changeToSearching) {
				$(inputElement).addClass('searching');
				rootElement.querySelector('.searchWaypointError').hide();
			} else {
				inputElement.removeClassName('searching');
			}
		}

		/**
		 * shows the results of the waypoint search on the Ui building a list of result entries that can be selected as waypoint
		 * @param results: response from the service in XML format
		 * @param listOfFeatures: list of OL feature IDs of the search result markers
		 * @param layername: map layer these features are located on
		 * @param wpIndex: index of the waypoint the search was performed for
		 */
		function updateSearchWaypointResultList(results, listOfFeatures, layername, wpIndex) {
			//insert address information to page
			var allAddress;
			var allIds = '';
			var rootElement = $('#' + wpIndex).get(0);
			var resultContainer = rootElement.querySelector('.searchWaypointResults');
			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'GeocodeResponseList');
			$A(geocodeResponseList).each(function(geocodeResponse) {
				allAddress = $A(util.getElementsByTagNameNS(geocodeResponse, namespaces.xls, 'Address'));
				for (var i = 0; i < allAddress.length; i++) {
					//listOfFeatures[i] == null if result is not in Europe
					if (listOfFeatures[i]) {
						var lonLat = listOfFeatures[i].geometry;
						allIds += listOfFeatures[i].id + ' ';
						var xmlAddress = allAddress[i];
						var address = util.parseAddress(xmlAddress);
						var shortText = util.parseAddressShort(xmlAddress);
						address.setAttribute('id', listOfFeatures[i].id);
						address.setAttribute('data-position', lonLat.x + ' ' + lonLat.y);
						address.setAttribute('data-layer', layername);
						address.setAttribute('data-shortAddress', shortText);
						resultContainer.appendChild(address);
					}
				}
			});
			//slice away last space
			allIds = allIds.substring(0, allIds.length - 1);
			rootElement.setAttribute('data-search', allIds);

			//show number of results and link to zoom
			var numResults = $('#zoomToWaypointResults_' + wpIndex);
			numResults.html(preferences.translate('numPoiResults1') + allAddress.length + preferences.translate('numPoiResults2') + '<br/>' + preferences.translate('selectResult'));

			//event handling
			$('.address').mouseover(handleMouseOverElement);
			$('.address').mouseout(handleMouseOutElement);
			$('.address').click(handleSearchWaypointResultClick);
		}

		/**
		 * views an error message when problems occured during geocoding
		 * @param wpIndex: index of the waypoint to show the message for
		 */
		function showSearchWaypointError(wpIndex) {
			var rootElement = $('#' + wpIndex).get(0);
			var errorContainer = rootElement.querySelector('.searchWaypointError')
			errorContainer.update(preferences.translate("searchError"));
			errorContainer.show();
		}

		/**
		 * when the user clicks on a waypoint search result, it is used as waypoint. The search results vanish and only the selected address is shown.
		 * @param e: the event
		 */
		function handleSearchWaypointResultClick(e) {
			var rootElement = $(e.currentTarget).parent().parent().parent().parent();
			var index = rootElement.attr('id');
			rootElement.removeClass('unset');
			rootElement = rootElement.get(0);

			rootElement.querySelector('.searchAgainButton').show();
			rootElement.querySelector('.guiComponent').hide();

			var waypointResultElement = rootElement.querySelector('.waypointResult');
			//remove older entries:
			while (waypointResultElement.firstChild) {
				waypointResultElement.removeChild(waypointResultElement.firstChild);
			}
			waypointResultElement.insert(e.currentTarget);
			waypointResultElement.show();

			//remove search markers and add a new waypoint marker
			theInterface.emit('ui:waypointResultClick', {
				wpIndex : index,
				featureId : e.currentTarget.id,
				searchIds : rootElement.getAttribute('data-search')
			});
		}

		/**
		 * Sets attributes of the selected waypoint.
		 * @param wpIndex: index of the waypoint to set the attributes for
		 * @param featureId: ID of the OL feature that represents the waypoint location
		 * @param position: position of the feature as string
		 * @param layer: map layer the feature is located on
		 */
		function setWaypointFeatureId(wpIndex, featureId, position, layer) {
			var rootElement = $('#' + wpIndex).get(0);
			var address = rootElement.querySelector('.address');
			if (address) {
				address.id = featureId;
				address.setAttribute('data-layer', layer);
				address.setAttribute('data-position', position);
			}
		}

		/**
		 * retrieves the OL feature ID of the given waypoint
		 * @param wpIndex: index of the waypoint to get the feature ID from
		 * @return: the ID of the OL feature
		 */
		function getFeatureIdOfWaypoint(wpIndex) {
			var rootElement = $('#' + wpIndex).get(0);
			var address = rootElement.querySelector('.address');
			var id = address ? address.id : null;
			return id;
		}

		/**
		 * retrieves the index of the waypoint based on the given OL feature ID
		 * @param featureId: the ID of the OL feature
		 * @return: the index of the wayoint; null if the waypoint does not exist
		 */
		function getWaypiontIndexByFeatureId(featureId) {
			var wpResult = $('#' + featureId);
			var wpElement;
			if (wpResult) {
				wpElement = wpResult.parent().parent();
			}
			if (wpElement) {
				var wpIndex = wpElement.attr('id');
				if (!isNaN(wpIndex)) {
					return wpIndex;
				} else {
					return null;
				}
			}
		}

		/**
		 * The user clicked on the button to move the waypoint up in the list of waypoints for the route calculation. The waypoint element is moved upwards; internal attributes are adapted.
		 * @param e: the event
		 */
		function handleMoveUpWaypointClick(e) {
			//index of waypoint
			var waypointElement = $(e.currentTarget).parent();
			var index = parseInt(waypointElement.attr('id'));

			var prevIndex = index - 1;
			var previousElement = $('#' + prevIndex);

			waypointElement.insertBefore(previousElement);

			//adapt IDs...
			previousElement.attr('id', index);
			waypointElement.attr('id', prevIndex);

			//define the new correct order
			var currentIndex = prevIndex;
			var succIndex = index;

			//-1 because we have an invisible draft waypoint
			var numWaypoints = $('.waypoint').length - 1;

			//decide which button to show
			if (currentIndex == 0) {
				//the waypoint which has been moved up is the first waypoint: hide move up button
				$(waypointElement.get(0).querySelector('.moveUpWaypoint')).hide();
				$(waypointElement.get(0).querySelector('.moveDownWaypoint')).show();
			} else {
				//show both
				$(waypointElement.get(0).querySelector('.moveUpWaypoint')).show();
				$(waypointElement.get(0).querySelector('.moveDownWaypoint')).show();
			}

			if (succIndex == (numWaypoints - 1)) {
				//the waypoint which has been moved down is the last waypoint: hide the move down button
				$(previousElement.get(0).querySelector('.moveUpWaypoint')).show()
				$(previousElement.get(0).querySelector('.moveDownWaypoint')).hide();
			} else {
				//show both
				$(previousElement.get(0).querySelector('.moveUpWaypoint')).show()
				$(previousElement.get(0).querySelector('.moveDownWaypoint')).show();
			}

			//adapt marker-IDs, decide about wpType
			theInterface.emit('ui:movedWaypoints', {
				id1 : currentIndex,
				id2 : succIndex
			});
		}

		/**
		 * The user clicked on the button to move down the waypoint in the list of waypoints for the route calculation. The waypoint element is moved downwards; internal attributes are adapted.
		 * @param e: the event
		 */
		function handleMoveDownWaypointClick(e) {
			//index of waypoint
			var waypointElement = $(e.currentTarget).parent();
			var index = parseInt(waypointElement.attr('id'));

			var succElement = $('#' + (index + 1));
			var succIndex = index + 1;

			waypointElement.insertAfter(succElement);

			//adapt IDs... of waypointElement
			waypointElement.attr('id', succIndex);
			succElement.attr('id', index);

			//define the new correct order
			var currentIndex = succIndex;
			var prevIndex = index;

			//-1 because we have an invisible draft waypoint
			var numWaypoints = $('.waypoint').length - 1;

			//decide which buttons to show
			if (currentIndex == numWaypoints - 1) {
				//the waypoint which has been moved down is the last waypoint: hide move down button
				$(waypointElement.get(0).querySelector('.moveUpWaypoint')).show();
				$(waypointElement.get(0).querySelector('.moveDownWaypoint')).hide();
			} else {
				//show both
				$(waypointElement.get(0).querySelector('.moveUpWaypoint')).show();
				$(waypointElement.get(0).querySelector('.moveDownWaypoint')).show();
			}
			if (prevIndex == 0) {
				//the waypoint which has been moved up is the first waypoint: hide the move up button
				$(succElement.get(0).querySelector('.moveUpWaypoint')).hide();
				$(succElement.get(0).querySelector('.moveDownWaypoint')).show();
			} else {
				//show both
				$(succElement.get(0).querySelector('.moveUpWaypoint')).show();
				$(succElement.get(0).querySelector('.moveDownWaypoint')).show();
			}

			//adapt marker-IDs, decide about wpType
			theInterface.emit('ui:movedWaypoints', {
				id1 : currentIndex,
				id2 : prevIndex
			});
		}

		/**
		 * The user clicks on the button to add a waypoint. A new empty waypoint is generated.
		 *  @param e: the event
		 */
		function handleAddWaypointClick(e) {
			//id of prior to last waypoint:
			var waypointId = $(e.currentTarget).prev().attr('id');
			var oldIndex = parseInt(waypointId);
			addWaypointAfter(oldIndex, oldIndex + 1);

			theInterface.emit('ui:selectWaypointType', oldIndex);
			var numwp = $('.waypoint').length - 1;
		}

		/**
		 *adds a new waypoint element after given waypoint index
		 * @param idx: (int) index of the predecessor waypoint
		 * @param numWaypoints: (int) number of waypoints BEFORE inserting the new one
		 */
		function addWaypointAfter(idx, numWaypoints) {
			//for the current element, show the move down button (will later be at least the next to last one)
			var previous = $('#' + idx);
			previous.children()[2].show();

			//'move' all successor waypoints down from idx+1 to numWaypoints
			for (var i = idx + 1; i < numWaypoints; i++) {
				var wpElement = $('#' + i);
				if (i < numWaypoints - 1) {
					//this is not the last waypoint, show move down button
					wpElement.children()[2].show();
				}
				var wpId = wpElement.attr('id');
				wpElement.attr('id', i + 1);
			}

			//generate new id
			var newIndex = parseInt(idx) + 1;
			var predecessorElement = $('#' + idx);
			var waypointId = predecessorElement.attr('id');
			waypointId = waypointId.replace(idx, newIndex);

			//generate DOM elements
			var newWp = $('#Draft').clone();
			newWp.attr('id', waypointId)
			newWp.insertAfter(predecessorElement);
			newWp.show();

			//decide which buttons to show
			var buttons = newWp.children();
			//show remove waypoint + move up button
			buttons[0].show();
			buttons[1].show();
			//including our new waypoint we are constructing here, we have one more waypoint. So we count to numWaypoints, not numWaypoints-1
			if (newIndex < numWaypoints) {
				//not the last waypoint, allow moving down
				buttons[2].show();
			} else {
				buttons[2].hide();
			}

			//add event handling
			newWp = newWp.get(0);
			newWp.querySelector('.searchWaypoint').addEventListener('keyup', handleSearchWaypointInput);
			newWp.querySelector('.moveUpWaypoint').addEventListener('click', handleMoveUpWaypointClick);
			newWp.querySelector('.moveDownWaypoint').addEventListener('click', handleMoveDownWaypointClick);
			newWp.querySelector('.removeWaypoint').addEventListener('click', handleRemoveWaypointClick);
			newWp.querySelector('.searchAgainButton').addEventListener('click', handleSearchAgainWaypointClick);

			theInterface.emit('ui:addWaypoint', newIndex);
		}

		/**
		 * set a waypint with the service respponse after the user requested to set a waypoint by clicking on the map (right click).
		 * @param results: the service response in XML format
		 * @param typeOfWaypoint: one of START, VIA or END
		 * @param index: index of the waypoint
		 * @return: the index of the wayoint
		 */
		function addWaypointResultByRightclick(results, typeOfWaypoint, index) {
			var numWaypoints = $('.waypoint').length - 1;
			while (index >= numWaypoints) {
				addWaypointAfter(numWaypoints - 1);
				numWaypoints++;
			}

			var addressResult = util.getElementsByTagNameNS(results, namespaces.xls, 'Address');
			addressResult = addressResult ? addressResult[0] : null;
			var address = util.parseAddress(addressResult);
			var shortAddress = util.parseAddressShort(addressResult);

			//insert information as waypoint
			var rootElement = $('#' + index);
			rootElement.removeClass('unset');
			address.setAttribute('data-shortAddress', shortAddress);

			var children = rootElement.children();

			//show waypoint result and searchAgain button
			children[3].show();
			var waypointResultElement = children[4];
			while (waypointResultElement.hasChildNodes()) {
				waypointResultElement.removeChild(waypointResultElement.lastChild);
			}
			waypointResultElement.appendChild(address);
			waypointResultElement.show();

			//hide input field with search result list
			children[5].hide();

			//remove the search result markers
			invalidateWaypointSearch(index);

			//event handling
			$('.address').mouseover(handleMouseOverElement);
			$('.address').mouseout(handleMouseOutElement);

			theInterface.emit('ui:selectWaypointType', index);
			if (index > 0) {
				//this is necessary if we called this function after clicking on "use as waypoint" on a POI search result etc.
				theInterface.emit('ui:selectWaypointType', index - 1);
			}

			return index;
		}

		/**
		 * When the user added a waypoint using the standard waypoint search and then e.g. moves the waypoint feature on the map, former search results must be invalidated because they do not match the new position.
		 * @param wpIndex: index of the waypoint
		 */
		function invalidateWaypointSearch(wpIndex) {
			var wpElement = $('#' + wpIndex);
			if (wpElement) {
				wpElement.removeAttr('data-search');
			}
		}

		/**
		 * The user clicks on the button to remove the waypoint for the route calculation. The waypoint element is deleted; internal attributes are adapted.
		 * @param e: the event
		 */
		function handleRemoveWaypointClick(e) {
			var numWaypoints = $('.waypoint').length - 1;

			var currentId = parseInt($(e.currentTarget).parent().attr('id'));
			var featureId = $(e.currentTarget).parent().get(0);
			featureId = featureId.querySelector('.address');
			if (featureId) {
				featureId = featureId.id;
			} else {
				featureId = null;
			}

			//we want to show at least 2 waypoints
			if (numWaypoints > 2) {
				//'move' all successor waypoints up from currentId to currentId-1
				for (var i = currentId + 1; i < numWaypoints; i++) {
					var wpElement = $('#' + i);
					wpElement.attr('id', (i - 1));
				}

				$(e.currentTarget).parent().remove();
			} else {
				var wpElement = $(e.currentTarget).parent();
				var wpIndex = wpElement.attr('id');
				//delete waypoint
				wpElement.remove();

				//generate an empty waypoint
				var draftWp = $('#Draft');
				var newWp = draftWp.clone();
				newWp.attr('id', wpIndex)
				if (wpIndex > 0) {
					newWp.insertAfter($('#' + (wpIndex - 1)));
				} else {
					newWp.insertAfter(draftWp);
				}
				newWp.show();

				//decide which buttons to show
				var buttons = newWp.children();
				//show remove waypoint
				buttons[0].show();

				if (wpIndex == 1) {
					//show only move down button
					buttons[2].hide();
					buttons[1].show();
				} else if (wpIndex == 0) {
					//show only move up button
					buttons[1].hide();
					buttons[2].show();
				}

				//add event handling
				newWp = newWp.get(0);
				newWp.querySelector('.searchWaypoint').addEventListener('keyup', handleSearchWaypointInput);
				newWp.querySelector('.moveUpWaypoint').addEventListener('click', handleMoveUpWaypointClick);
				newWp.querySelector('.moveDownWaypoint').addEventListener('click', handleMoveDownWaypointClick);
				newWp.querySelector('.removeWaypoint').addEventListener('click', handleRemoveWaypointClick);
				newWp.querySelector('.searchAgainButton').addEventListener('click', handleSearchAgainWaypointClick);
			}

			theInterface.emit('ui:removeWaypoint', {
				wpIndex : currentId,
				featureId : featureId
			});
		}

		/**
		 *shows or hides the "move waypoint down" button
		 * @param wpIndex: index of the waypoint
		 * @param show: if true, the button becomes visible; invisible otherwise
		 */
		function setMoveDownButton(wpIndex, show) {
			var rootElement = $('#' + wpIndex).get(0);
			var moveDown = rootElement.querySelector('.moveDownWaypoint');
			if (show) {
				$(moveDown).show();
			} else {
				$(moveDown).hide();
			}
		}

		/**
		 *shows or hides the "move waypoint up" button
		 * @param wpIndex: index of the waypoint
		 * @param show: if true, the button becomes visible; invisible otherwise
		 */
		function setMoveUpButton(wpIndex, show) {
			var rootElement = $('#' + wpIndex).get(0);
			var moveUp = rootElement.querySelector('.moveUpWaypoint');
			if (show) {
				$(moveUp).show();
			} else {
				$(moveUp).hide();
			}
		}

		/**
		 * The user clicks on the search again button to re-view the list of search results for the selected waypoint. Search results are shown, displaying map features is triggered.
		 * @param e: the event
		 */
		function handleSearchAgainWaypointClick(e) {
			var wpElement = $(e.currentTarget).parent();
			var index = wpElement.attr('id');

			var addrElement = wpElement.get(0).querySelector('.address');
			var featureId = addrElement.getAttribute('id');
			var layer = addrElement.getAttribute('data-layer');

			var resultComponent = wpElement.get(0).querySelector('.waypointResult');
			$(resultComponent).hide();

			var searchComponent = wpElement.get(0).querySelector('.guiComponent');
			$(searchComponent).show();

			var searchResults = wpElement.attr('data-search');
			if (searchResults) {
				//this waypoint was created by a search input. Only then it is useful to view previous search results
				//therefore we have to re-calculate the search

				//index of the waypoint (0st, 1st 2nd,...)

				var input = wpElement.attr('data-searchInput');
				//empty search results
				invalidateWaypointSearch(index);
				var resultContainer = wpElement.get(0).querySelector('.searchWaypointResults');
				while (resultContainer && resultContainer.hasChildNodes()) {
					resultContainer.removeChild(resultContainer.lastChild);
				}
				//request new results
				theInterface.emit('ui:searchWaypointRequest', {
					query : input,
					wpIndex : index,
					searchIds : null
				});

			} else {
				resultComponent.removeChild(addrElement);
				var responses = searchComponent.querySelector('.responseContainer');
				if (responses) {
					$(responses).hide();
				}
			}

			//remove old waypoint marker
			theInterface.emit('ui:searchAgainWaypoint', {
				waypointFeature : featureId,
				waypointLayer : layer,
				wpIndex : index
			});
		}

		/**
		 * assigns the waypoint the given type
		 * @param wpIndex: index of the waypoint
		 * @param type: type of the wayoint, one of START, VIA, END or UNSET
		 */
		function setWaypointType(wpIndex, type) {
			var el = $('#' + wpIndex);
			el.removeClass('unset');
			el.removeClass('start');
			el.removeClass('via');
			el.removeClass('end');
			el.addClass(type);
		}

		/**
		 * The whole route is removed, waypoints are emptied or deleted (if more than two exist)
		 */
		function handleResetRoute() {
			//remove markers on map
			theInterface.emit('ui:resetRoute');

			//remove all existing waypoints
			var el = $('#0');
			var i = 0;
			while (el.length > 0) {
				el.remove();
				i++;
				el = $('#' + i);
			}

			//generate two empty waypoints
			for (var j = 1; j >= 0; j--) {
				//generate DOM elements
				var draftWp = $('#Draft');
				var newWp = draftWp.clone();
				newWp.attr('id', j)
				newWp.insertAfter(draftWp);
				newWp.show();

				//decide which buttons to show
				var buttons = newWp.children();
				//show remove waypoint
				buttons[0].show();

				if (j == 1) {
					//show only move down button
					buttons[2].hide();
					buttons[1].show();
				} else if (j == 0) {
					//show only move up button
					buttons[1].hide();
					buttons[2].show();
				}

				//add event handling
				$('.searchWaypoint').keyup(handleSearchWaypointInput);
			}
		}

		/**
		 * shows or hides a spinner during waypoint address calculation
		 * @param wpIndex: index of the waypoint
		 * @param showSearching: if true, the spinner is shown; hidden otherwise.
		 */
		function showSearchingAtWaypoint(wpIndex, showSearching) {
			var wp = $('#' + wpIndex).get(0);
			var inputElement = wp.querySelector('input');

			if (showSearching) {
				$(inputElement).addClass('searching');
				wp.querySelector('.searchWaypointError').hide();
			} else {
				inputElement.removeClassName('searching');
			}
		}

		/* *********************************************************************
		* GEOLOCATION
		* *********************************************************************/

		/**
		 * triggers the geolocation request to retrieve the uer's current location
		 * @param e: the event
		 */
		function handleGeolocationClick(e) {
			theInterface.emit('ui:geolocationRequest');
		}

		/**
		 * processes the geolocation service responses and shows the user's current location as address (and marker on map)
		 * @param request: the service response
		 * @param featureId: ID of the map feature representing the current location
		 * @param layername: map layer name that contains the feature
		 * @param point: coordinate position of the feature
		 */
		function showCurrentLocation(request, featureId, layername, point) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var results = request.responseXML ? request.responseXML : util.parseStringToDOM(request.responseText);

			var resultContainer = $('#geolocationResult');
			resultContainer.empty();

			var addressResult = util.getElementsByTagNameNS(results, namespaces.xls, 'Address');
			addressResult = addressResult ? addressResult[0] : null;
			var address = util.parseAddress(addressResult);

			//use as waypoint button
			var useAsWaypointButton = new Element('span', {
				'class' : 'clickable useAsWaypoint',
				'title' : 'use as waypoint',
				'id' : featureId,
				'data-position' : point.x + ' ' + point.y,
				'data-layer' : layername
			});
			address.insert(useAsWaypointButton);

			//set data-attributes
			address.setAttribute('data-layer', layername);
			address.setAttribute('id', featureId);
			address.setAttribute('data-position', point.x + ' ' + point.y);

			resultContainer.append(address);

			//event handling
			$('.address').mouseover(handleMouseOverElement);
			$('.address').mouseout(handleMouseOutElement);
			$('.address').click(handleSearchResultClick);
			$('.useAsWaypoint').click(handleUseAsWaypoint);
		}

		/**
		 * shows or hides a spinner while retrieving the location
		 * @param showSearching: if true, the spinner is shown; hidden otherwise
		 */
		function showGeolocationSearching(showSearching) {
			if (showSearching) {
				$('#fnct_geolocation').addClass('searching');
			} else {
				$('#fnct_geolocation').removeClass('searching');
			}
		}

		/**
		 * shows or hides an error message, either when a runtime error occurs or when the geolocation feature is not supported
		 * @param showError: if true, the error message is shown; hidden otherwise
		 * @param notSupportedError: if true, the 'geolocation is not supported'-error is addressed; else, the 'runtime error during geolocation' is addressed
		 */
		function showGeolocationError(showError, notSupportedError) {
			var el = $('#geolocationError');
			if (showError) {
				if (notSupportedError) {
					//show error: geolocation is not supported
					el.html(p.translate('geolocationNotSupported'));
				} else {
					//show regular runtime error
					el.html(p.translate('geolocationRuntimeError'));
				}
				el.show();
			} else {
				el.hide();
			}
		}

		/* *********************************************************************
		* SEARCH ADDRESS
		* *********************************************************************/

		/**
		 * The user enters an address search string which should be passed on to the service. Previous search results are removed.
		 * The search is automatically triggered after the user stopped typing for a certain period of time (DONE_TYPING_INTERVAL)
		 * @param e: the event
		 */
		function handleSearchAddressInput(e) {
			clearTimeout(typingTimerSearchAddress);
			if (e.keyIdentifier != 'Shift' && e.currentTarget.value.length != 0) {
				typingTimerSearchAddress = setTimeout(function() {
					//empty search results
					var resultContainer = document.getElementById('fnct_searchAddressResults');
					while (resultContainer.hasChildNodes()) {
						resultContainer.removeChild(resultContainer.lastChild);
					}
					var numResults = $('#zoomToAddressResults').get(0);
					while (numResults.hasChildNodes()) {
						numResults.removeChild(numResults.lastChild);
					}

					var lastSearchResults = $('#searchAddress').attr('data-search');
					theInterface.emit('ui:searchAddressRequest', {
						address : e.currentTarget.value,
						lastSearchResults : lastSearchResults
					});
				}, DONE_TYPING_INTERVAL);
			}
		}

		/**
		 * shows or hides a search spinner while searching for an address
		 * @param changeToSearching: if true, the spinner is shown; hidden otherwise
		 */
		function searchAddressChangeToSearchingState(changeToSearching) {
			if (changeToSearching) {
				$('#fnct_searchAddress').addClass('searching');
				$('#searchAddressError').hide();
			} else {
				$('#fnct_searchAddress').removeClass('searching');
			}
		}

		/**
		 * shows the results of an address search in the Ui.
		 * @param results: the address search response from the service in XML format
		 * @param listOfFeatures: array of OL features representing address locations on the map
		 * @param layername: map layer name the features are located on
		 */
		function updateSearchAddressResultList(results, listOfFeatures, layername) {
			//insert address information to page
			var allAddress;
			var allIds = "";
			var resultContainer = $('#fnct_searchAddressResults');
			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'GeocodeResponseList');
			$A(geocodeResponseList).each(function(geocodeResponse) {
				allAddress = $A(util.getElementsByTagNameNS(geocodeResponse, namespaces.xls, 'Address'));
				for (var i = 0; i < allAddress.length; i++) {
					//listOfPoitnts[i] == null if result is not in Europe
					if (listOfFeatures[i]) {
						var address = allAddress[i];
						address = util.parseAddress(address);
						var lonLat = listOfFeatures[i].geometry;
						allIds += listOfFeatures[i].id + ' ';
						address.setAttribute('id', listOfFeatures[i].id);
						address.setAttribute('data-position', lonLat.x + ' ' + lonLat.y);
						address.setAttribute('data-layer', layername);

						var useAsWaypointButton = new Element('span', {
							'class' : 'clickable useAsWaypoint',
							'title' : 'use as waypoint',
							'id' : listOfFeatures[i].id,
							'data-position' : lonLat.x + ' ' + lonLat.y,
							'data-layer' : layername
						});
						address.insert(useAsWaypointButton);
						resultContainer.append(address);
					}
				}
			});

			//slice away last space
			allIds = allIds.substring(0, allIds.length - 1);
			var searchElement = $('#searchPlace').get(0);
			searchElement.setAttribute('data-search', allIds);

			//show number of results and link to zoom
			var numResults = $('#zoomToAddressResults');
			numResults.html(preferences.translate('numPoiResults1') + allAddress.length + preferences.translate('numPoiResults2'));

			//event handling
			$('.address').mouseover(handleMouseOverElement);
			$('.address').mouseout(handleMouseOutElement);
			$('.address').click(handleSearchResultClick);
			$('.useAsWaypoint').click(handleUseAsWaypoint);
		}

		/**
		 * views an error message when problems occur during address search
		 */
		function showSearchAddressError() {
			var errorContainer = $('#searchAddressError');
			errorContainer.html(preferences.translate("searchError"));
			errorContainer.show();
		}

		/**
		 * triggers moving and zooming the map so that all address search results become visible on the screen
		 */
		function handleZoomToAddressResults(e) {
			theInterface.emit('ui:zoomToAddressResults');
		}

		/**
		 * The user clicked on one of the search results. Triggers the zooming of the map to the corresponding map feature
		 */
		function handleSearchResultClick(e) {
			theInterface.emit('ui:zoomToMarker', {
				position : e.currentTarget.getAttribute('data-position'),
				layer : e.currentTarget.getAttribute('data-layer')
			});
		}

		/**
		 * The user wants to include this search result as waypoint in the route. Triggers the addition of that point.
		 */
		function handleUseAsWaypoint(e) {
			theInterface.emit('ui:useAsWaypoint', e.currentTarget.getAttribute('data-position'));

		}

		/* *********************************************************************
		* SEARCH POI
		* *********************************************************************/

		/**
		 * internal flag for route availabiligy on the page
		 * @present: set to true if a route is present; not present otherwise
		 */
		function setRouteIsPresent(present) {
			routeIsPresent = present;
		}

		/**
		 * The user enters a POI search string which should be passed on to the service. Previous search results are removed.
		 * The search is automatically triggered after the user stopped typing for a certain period of time (DONE_TYPING_INTERVAL)
		 * @param e: the event
		 */
		function handleSearchPoiInput(e) {
			clearTimeout(typingTimerSearchPoi);
			if (e.keyIdentifier != 'Shift' && e.currentTarget.value.length != 0) {
				typingTimerSearchPoi = setTimeout(function() {
					//empty search results
					var resultContainer = document.getElementById('fnct_searchPoiResults');
					while (resultContainer.hasChildNodes()) {
						resultContainer.removeChild(resultContainer.lastChild);
					}
					var numResults = $('#zoomToPoiResults').get(0);
					while (numResults.hasChildNodes()) {
						numResults.removeChild(numResults.lastChild);
					}

					searchPoiAtts[3] = e.currentTarget.value;

					var lastSearchResults = $('#searchPoi').attr('data-search');
					theInterface.emit('ui:searchPoiRequest', {
						query : e.currentTarget.value,
						nearRoute : searchPoiAtts[0] && routeIsPresent,
						maxDist : searchPoiAtts[1],
						distUnit : searchPoiAtts[2],
						lastSearchResults : lastSearchResults
					});
				}, DONE_TYPING_INTERVAL);
			}

		}

		/**
		 * shows or hides a search spinner while searching for a POI
		 * @param changeToSearching: if true, the spinner is shown; hidden otherwise
		 */
		function searchPoiChangeToSearchingState(changeToSearching) {
			if (changeToSearching) {
				$('#fnct_searchPoi').addClass('searching');
				$('#searchPoiError').hide();
			} else {
				$('#fnct_searchPoi').removeClass('searching');
			}
		}

		/**
		 * is called when the user selects the option to look for POIs along the route
		 * shows an error message, if necessary (if no route is present)
		 * triggers a service call to look for the POIs
		 */
		function handleSearchPoiNearRoute(e) {
			searchPoiAtts[0] = e.currentTarget.checked;

			if (!routeIsPresent) {
				$('#checkboxWarn').text(preferences.translate('noRouteFound'));
				$('#checkboxWarn').show();
			} else if (searchPoiAtts[3].length > 0 && routeIsPresent) {
				theInterface.emit('ui:searchPoiRequest', {
					query : searchPoiAtts[3],
					nearRoute : searchPoiAtts[0],
					maxDist : searchPoiAtts[1],
					distUnit : searchPoiAtts[2],
					lastSearchResults : $('#searchPoi').attr('data-search')
				});
			}

			//if we're not searching near route, hide erorr message
			if (searchPoiAtts[0] == false) {
				$('#checkboxWarn').hide();
			}
		}

		/**
		 * is called when the user selects the option to look for POIs along the route
		 * shows an error message, if necessary (if no route is present or an invalid distance is selected)
		 * triggers a service call to look for the POIs
		 */
		function handleSearchPoiDistance(e) {
			clearTimeout(typingTimerSearchPoiDistance);
			if (e.keyIdentifier != 'Shift' && e.currentTarget.value.length != 0) {
				typingTimerSearchPoiDistance = setTimeout(function() {
					searchPoiAtts[1] = e.currentTarget.value;
					theInterface.emit('ui:checkDistanceToRoute', {
						dist : searchPoiAtts[1],
						unit : searchPoiAtts[2]
					});

					if (searchPoiAtts[3].length > 0 && searchPoiAtts[0] == true && routeIsPresent) {
						theInterface.emit('ui:searchPoiRequest', {
							query : searchPoiAtts[3],
							nearRoute : searchPoiAtts[0],
							maxDist : searchPoiAtts[1],
							distUnit : searchPoiAtts[2],
							lastSearchResults : $('#searchPoi').attr('data-search')
						});
					}
				}, DONE_TYPING_INTERVAL);
			}

		}

		/**
		 * is called when the user selects the option to look for POIs along the route
		 * shows an error message, if necessary (if no route is present or an invalid distance is selected)
		 * triggers a service call to look for the POIs
		 */
		function handleSearchPoiDistanceUnit(e) {
			searchPoiAtts[2] = e.currentTarget.value;
			theInterface.emit('ui:checkDistanceToRoute', {
				dist : searchPoiAtts[1],
				unit : searchPoiAtts[2]
			});

			if (searchPoiAtts[3].length > 0 && searchPoiAtts[0] == true && routeIsPresent) {
				theInterface.emit('ui:searchPoiRequest', {
					query : searchPoiAtts[3],
					nearRoute : searchPoiAtts[0],
					maxDist : searchPoiAtts[1],
					distUnit : searchPoiAtts[2],
					lastSearchResults : $('#searchPoi').attr('data-search')
				});
			}
		}

		/**
		 * shows the results of an POI search in the Ui.
		 * @param results: the POI search response from the service in XML format
		 * @param listOfFeatures: array of OL features representing POI locations on the map
		 * @param layername: map layer name the features are located on
		 */
		function updateSearchPoiResultList(results, listOfFeatures, layername) {
			var resultContainer = $('#fnct_searchPoiResults').get(0);
			while (resultContainer.hasChildNodes()) {
				resultContainer.removeChild(resultContainer.lastChild);
			}

			//insert POI information to page
			var allPoi;
			var allIds = "";
			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'DirectoryResponse');
			$A(geocodeResponseList).each(function(poiResponse) {
				allPoi = $A(util.getElementsByTagNameNS(poiResponse, namespaces.xls, 'POIContext'));
				for (var i = 0; i < allPoi.length; i++) {
					if (listOfFeatures[i]) {

						var poi = allPoi[i];
						var element = new Element('li', {
							'class' : 'poi',
						});

						allIds += listOfFeatures[i].id + ' ';
						var lonLat = listOfFeatures[i].geometry;
						element.setAttribute('id', listOfFeatures[i].id);
						element.setAttribute('data-position', lonLat.x + ' ' + lonLat.y);
						element.setAttribute('data-layer', layername);

						var poiElement = util.getElementsByTagNameNS(poi, namespaces.xls, 'POI')[0];
						var poiName = poiElement.getAttribute('POIName');

						var poiDesc = poiElement.getAttribute('description');
						poiDesc = poiDesc.substring(0, poiDesc.indexOf(';'));
						poiDesc = preferences.translate(poiDesc);
						poiDesc = poiDesc.length > 1 ? ' (' + poiDesc + ')' : '';

						//if neither poiName nor poiDesc is given -> display "untitled"
						poiName = poiName.length + poiDesc.length == 0 ? preferences.translate('untitled') : poiName;

						element.appendChild(new Element('span').update(poiName + poiDesc));

						if (searchPoiAtts[0] == 'true') {
							//we're searching near a route...
							var distElement = util.getElementsByTagNameNS(poi, namespaces.xls, 'Distance')[0];
							var poiDist = distElement.getAttribute('value');
							var distanceUnitSrc = distElement.getAttribute('uom');
							var dist = util.convertDistToDist(poiDist, distanceUnitSrc, preferences.distanceUnit);
							element.appendChild(new Element('span').update(', ' + dist + ' ' + preferences.distanceUnit));
						}

						var useAsWaypointButton = new Element('span', {
							'class' : 'clickable useAsWaypoint',
							'title' : 'use as waypoint',
							'id' : listOfFeatures[i].id,
							'data-position' : lonLat.x + ' ' + lonLat.y,
							'data-layer' : layername
						});
						element.insert(useAsWaypointButton);
						$(resultContainer).append(element);
					}
				}
			});

			//slice away last space
			allIds = allIds.substring(0, allIds.length - 1);
			var searchElement = $('#searchPoi').get(0);
			searchElement.setAttribute('data-search', allIds);

			//show number of results and link to zoom
			var numResults = $('#zoomToPoiResults');
			numResults.html(preferences.translate('numPoiResults1') + allPoi.length + preferences.translate('numPoiResults2'));

			//event handling
			$('.poi').mouseover(handleMouseOverElement);
			$('.poi').mouseout(handleMouseOutElement);
			$('.poi').click(handleSearchResultClick);
			$('.useAsWaypoint').click(handleUseAsWaypoint);
		}

		/**
		 *  views an error message when problems occur during POI lookup
		 */
		function showSearchPoiError() {
			var errorContainer = $('#searchPoiError');
			errorContainer.html(preferences.translate("searchError"));
			errorContainer.show();
		}

		/**
		 * shows or hides an error message for incorrect distance parameters (show POIs XY m/yd/km/... from route)
		 * @param isIncorrect: if true, an error message is displyed; hidden otherwise
		 */
		function showSearchPoiDistUnitError(isIncorrect) {
			if (isIncorrect) {
				$('#inputWarn').text(preferences.translate('distaneNotSupported'));
				$('#inputWarn').show();
			} else {
				$('#inputWarn').hide();
			}
		}

		/**
		 * triggers moving and zooming the map so that all POI search results become visible on the screen
		 */
		function handleZoomToPoiResults(e) {
			theInterface.emit('ui:zoomToPoiResults');
		}

		/* *********************************************************************
		* ROUTE
		* *********************************************************************/

		/**
		 * returns the Ui variable routeOptions
		 */
		function getRoutePreferences() {
			return routeOptions;
		}

		/**
		 * gets a list of route points, i.e. waypoint coordinates
		 * @return array of strings containing the coordinates
		 */
		function getRoutePoints() {
			var allRoutePoints = [];
			var numWaypoints = $('.waypoint').length - 1;
			for (var i = 0; i < numWaypoints; i++) {
				var element = $('#' + i).get(0);
				element = element.querySelector('.address');
				if (element) {
					allRoutePoints.push(element.getAttribute('data-position'))
				}
			}
			return allRoutePoints;
		}

		/**
		 * gets a short description of the route destination
		 * @return string of the destination in short form or null if the last waypoint is not set
		 */
		function getRouteDestination() {
			//find the last waypoint set
			var lastSetWaypoint = -1;
			for (var i = $('.waypoint').length - 2; i >= 0; i--) {
				var address = $('#' + i).get(0);
				if (address.querySelector('.address')) {
					lastSetWaypoint = i;
					i = -1;
				}
			}
			if (lastSetWaypoint >= 0) {
				var address = $('#' + lastSetWaypoint).get(0);
				address = address.querySelector('.address');
				address = address.getAttribute('data-shortAddress');
				return address;
			} else {
				return null;
			}
		}

		/**
		 * shows a spinner for the route calculation process and hides previously displayed error messages
		 */
		function startRouteCalculation() {
			var el = $('#routeCalculate');
			el.show();
			el.html(preferences.translate('calculatingRoute'));

			$('#routeError').hide();
		}

		/**
		 * hides the spinner for the route calculation process
		 */
		function endRouteCalculation() {
			$('#routeCalculate').hide();
		}

		/**
		 * displays general route information as a route summary
		 * @param results: response of the service containing the route summary information
		 */
		function updateRouteSummary(results) {
			if (!results) {
				//hide container
				$('#routeSummaryContainer').get(0).hide();
			} else {
				//parse results and show them in the container
				var summaryElement = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteSummary')[0];

				var totalTime = util.getElementsByTagNameNS(summaryElement, namespaces.xls, 'TotalTime')[0];
				totalTime = totalTime.textContent || totalTime.text;
				//<period>PT5Y2M10D15H18M43S</period>
				//The example above indicates a period of five years, two months, 10 days, 15 hours, a8 minutes and 43 seconds
				totalTime = totalTime.substring(0, totalTime.indexOf('M') + 1);
				totalTime = totalTime.replace('P', '');
				totalTime = totalTime.replace('T', '');
				totalTime = totalTime.replace('D', ' ' + preferences.translate('days') + ' ');
				totalTime = totalTime.replace('H', ' ' + preferences.translate('hours') + ' ');
				totalTime = totalTime.replace('M', ' ' + preferences.translate('minutes') + ' ');
				//cut the seconds off!: duration = duration.replace('S', ' second(s)');

				var distance = util.getElementsByTagNameNS(summaryElement, namespaces.xls, 'TotalDistance')[0];
				var distanceValue = distance.getAttribute('value');
				var distanceUnit = distance.getAttribute('uom');
				var distArr = [];

				if (preferences.distanceUnit == list.distanceUnitsPreferences[0]) {
					//use mixture of km and m
					distArr = util.convertDistanceFormat(distanceValue, preferences.distanceUnit);
				} else {
					//use mixture of miles and yards
					var yardsUnit = 'yd';
					var distMeasure = util.convertDistToDist(distanceValue, distanceUnit, yardsUnit);
					distArr = util.convertDistanceFormat(distMeasure, preferences.distanceUnit);
				}

				var container = $('#routeSummaryContainer').get(0);
				container.show();
				var timeDiv = container.querySelector('#route_totalTime');
				var distanceDiv = container.querySelector('#route_totalDistance');

				$(timeDiv)[0].update(preferences.translate('TotalTime') + ': ' + totalTime);
				$(distanceDiv)[0].update(preferences.translate('TotalDistance') + ': ' + distArr[0] + ' ' + distArr[1]);
			}
		}

		/**
		 * displays instructions for the route
		 * @param results: response of the service
		 * @param mapFeatureIds: list of IDs of OpenLayers elements containing BOTH - ids for route line segments AND corner points: [routeLineSegment_0, cornerPoint_0, routeLineSegment_1, cornerPoint_1,...]
		 * @param mapLayer: map layer containing these features
		 */
		function updateRouteInstructions(results, mapFeatureIds, mapLayer) {
			if (!results) {
				var container = $('#routeInstructionsContainer').get(0);
				container.hide();
			} else {
				//parse results and show them in the container

				var destination = getRouteDestination();
				$('#routeFromTo').html(preferences.translate('routeFromTo') + destination);

				var container = $('#routeInstructionsContainer').get(0);
				container.show();
				var table = container.querySelector('table');
				//remove old route instructions if the user has searched before
				while (table.firstChild) {
					table.removeChild(table.firstChild);
				}
				var numInstructions = 0;

				var instructionsList = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteInstructionsList')[0];
				instructionsList = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteInstruction');
				$A(instructionsList).each(function(instruction) {
					//process each routing instruction
					var text = util.getElementsByTagNameNS(instruction, namespaces.xls, 'Instruction')[0];
					text = text.text || text.textContent;

					var distance = util.getElementsByTagNameNS(instruction, namespaces.xls, 'Distance')[0];
					var distanceValue = distance.getAttribute('value');
					var distanceUnit = distance.getAttribute('uom');
					var distArr = [];

					if (preferences.distanceUnit == list.distanceUnitsPreferences[0]) {
						//use mixture of km and m
						distArr = util.convertDistanceFormat(distanceValue, preferences.distanceUnit);
					} else {
						//use mixture of miles and yards
						var yardsUnit = 'yd';
						var distMeasure = util.convertDistToDist(distanceValue, distanceUnit, yardsUnit);
						distArr = util.convertDistanceFormat(distMeasure, preferences.distanceUnit);
					}

					//arrow direction
					var left = text.indexOf(preferences.translate('left'));
					var halfLeft = text.indexOf(preferences.translate('half-left'));
					var right = text.indexOf(preferences.translate('right'));
					var halfRight = text.indexOf(preferences.translate('half-right'));
					var straight = text.indexOf(preferences.translate('straight'));
					var direction;
					if (left > 0 && (left < halfLeft || halfLeft < 0)) {
						direction = new Element('img', {
							'src' : './img/left.png'
						});
					} else if (right > 0 && (right < halfRight || halfRight < 0)) {
						direction = new Element('img', {
							'src' : './img/right.png'
						});
					} else if (halfRight > 0) {
						direction = new Element('img', {
							'src' : './img/half-right.png'
						});
					} else if (halfLeft > 0) {
						direction = new Element('img', {
							'src' : './img/half-left.png'
						});
					} else if (straight > 0) {
						direction = new Element('img', {
							'src' : './img/straight.png'
						});
					}

					numInstructions++;

					//add DOM elements
					var trElement = new Element('tr', {
						'class' : (numInstructions % 2 == 0) ? 'even' : 'odd',
						'data-layer' : mapLayer
					});
					table.appendChild(trElement);

					var tdElementImg = new Element('td');
					if (direction) {
						tdElementImg.appendChild(direction);
					}

					var tdElementText = new Element('td', {
						'class' : 'clickable routeInstructions',
						'id' : mapFeatureIds[2 * (numInstructions - 1) + 1]
					}).update(text);

					var tdElementDist = new Element('td', {
						'class' : 'clickable',
						'id' : mapFeatureIds[2 * (numInstructions - 1)]
					}).update(distArr[0] + ' ' + distArr[1]);

					trElement.appendChild(tdElementImg);
					trElement.appendChild(tdElementText);
					trElement.appendChild(tdElementDist);

					//mouseover for points and lines
					$(tdElementDist).mouseover(handleMouseOverDist);
					$(tdElementDist).mouseout(handleMouseOutDist);
					$(tdElementText).mouseover(handleMouseOverText);
					$(tdElementText).mouseout(handleMouseOutText);
					$(tdElementDist).click(handleClickRouteInstr);
					$(tdElementText).click(handleClickRouteInstr);
				});
			}

			/**
			 * called when the user moves over the distance part of a route instruction. Triggers highlighting the corresponding route part
			 */
			function handleMouseOverDist(e) {
				e.currentTarget.addClassName('active');
				var parent = $(e.currentTarget).parent().get(0);

				theInterface.emit('ui:emphElement', {
					id : e.currentTarget.getAttribute('id'),
					layer : parent.getAttribute('data-layer')
				});

			}

			/**
			 * called when the user moves out of the distance part of a route instruction. Triggers un-highlighting the corresponding route part
			 */
			function handleMouseOutDist(e) {
				e.currentTarget.removeClassName('active');
				var parent = $(e.currentTarget).parent().get(0);

				theInterface.emit('ui:deEmphElement', {
					id : e.currentTarget.getAttribute('id'),
					layer : parent.getAttribute('data-layer')
				});
			}

			/**
			 * called when the user moves over the instruction part of the route instruction. Trigger highlighting the corresponding route point
			 */
			function handleMouseOverText(e) {
				e.currentTarget.addClassName('active');
				var parent = $(e.currentTarget).parent().get(0);

				theInterface.emit('ui:emphElement', {
					id : e.currentTarget.getAttribute('id'),
					layer : parent.getAttribute('data-layer')
				});
			}

			/**
			 * called when the user moves out of the instruction part of a route instruction. Triggers un-highlighting the corresponding route point
			 */
			function handleMouseOutText(e) {
				e.currentTarget.removeClassName('active');
				var parent = $(e.currentTarget).parent().get(0);

				theInterface.emit('ui:deEmphElement', {
					id : e.currentTarget.getAttribute('id'),
					layer : parent.getAttribute('data-layer')
				});
			}

			/**
			 * when the distance or text part of the route instruction is clicked, triggers zooming to that part of the route
			 */
			function handleClickRouteInstr(e) {
				theInterface.emit('ui:zoomToRouteInstruction', e.currentTarget.id);
			}

		}

		/**
		 * hides the route summary pane, e.g. when no route is available
		 */
		function hideRouteSummary() {
			$('#routeSummaryContainer').hide();
		}

		/**
		 * hides the route instructions pane, e.g. when no route is available
		 */
		function hideRouteInstructions() {
			$('#routeInstructionsContainer').hide();
		}

		/**
		 * triggers zooming to the whole route
		 */
		function handleZoomToRouteClick() {
			theInterface.emit('ui:zoomToRoute');
		}

		/**
		 * displays an error message when no route between the selected waypoints could be found or another error happened during route calculation
		 */
		function showRoutingError() {
			var el = $('#routeError');
			el.html(preferences.translate('noRouteAvailable'));
			el.show();
		}

		/* *********************************************************************
		* ROUTE OPTIONS
		* *********************************************************************/
		/**
		 * when the user wants to switch between route options for cars/bikes/pedestrians and clicks the button to switch views
		 * @param e: the event
		 */
		function switchRouteOptionsPane(e) {
			var parent = $('.routePreferenceBtns').get(0);
			var optionType = e.currentTarget.id;

			//switch the buttons above
			var allBtn = parent.querySelectorAll('button');
			for (var i = 0; i < allBtn.length; i++) {
				var btn = allBtn[i];
				if (btn == e.currentTarget) {
					btn.addClassName('active');
					//adapt image
					var imgElement = btn.querySelector('img');
					imgElement.setAttribute('src', list.routePreferencesImages.get(btn.id)[1]);

					//set the selected entry as currently selected route option
					var options = $('#' + btn.id + 'Options').get(0).querySelector('input[checked="checked"]');
					routeOptions[0] = options.id;
					theInterface.emit('ui:routingParamsChanged');
					theInterface.emit('ui:prefsChanged', {
						key : preferences.routeOptionsIdx,
						value : routeOptions[0]
					});
				} else {
					btn.removeClassName('active');
					//adapt image
					var imgElement = btn.querySelector('img');
					imgElement.setAttribute('src', list.routePreferencesImages.get(btn.id)[0]);
				}
			}

			//switch the content
			var car = $('#carOptions');
			var bike = $('#bicycleOptions');
			var ped = $('#pedestrianOptions');
			var avoidables = $('#avoidables');
			if (optionType === 'car') {
				car.show();
				avoidables.show();
				bike.hide();
				ped.hide();
			} else if (optionType === 'bicycle') {
				car.hide();
				avoidables.hide();
				bike.show();
				ped.hide();
			} else {
				car.hide();
				avoidables.hide();
				bike.hide();
				ped.show();
			}
		}

		/**
		 * checks if routing options have changed and triggers a route recalculation if appropriate
		 * @param e: the event
		 */
		function handleOptionsChanged(e) {
			var item = e.srcElement.id;
			if ($.inArray(item, list.routeAvoidables) >= 0) {
				//is a route avoidable
				if (item === list.routeAvoidables[0]) {
					//if the avoidable is set, remove it (and vice versa)
					routeOptions[1][0] = routeOptions[1][0] ? null : item;
					theInterface.emit('ui:prefsChanged', {
						key : preferences.avoidHighwayIdx,
						value : routeOptions[1][0] != null
					});
				} else {
					routeOptions[1][1] = routeOptions[1][1] ? null : item;
					theInterface.emit('ui:prefsChanged', {
						key : preferences.avoidTollwayIdx,
						value : routeOptions[1][1] != null
					});
				}
			} else {
				//is a regular route option
				routeOptions[0] = item;
				theInterface.emit('ui:prefsChanged', {
					key : preferences.routeOptionsIdx,
					value : routeOptions[0]
				});
			}
			theInterface.emit('ui:routingParamsChanged');
		}

		/**
		 * used to activate and show the given route option on startup if necessary
		 * @paran routeOption: one of 'Fastest', 'Shortest', 'BicycleLane',...
		 */
		function setRouteOption(routeOption) {
			//set checkox with $('#' + routeOption) active
			var el = $('#' + routeOption);
			if (el) {
				el.attr('checked', true)
			}

			//set parent div (with all available options for car/bike/pedestrian visible
			var parentOptions = list.routePreferences.keys();
			var parent;
			for (var i = 0; i < parentOptions.length; i++) {
				if (list.routePreferences.get(parentOptions[i]).indexOf(routeOption) != -1) {
					//show div
					$('#' + parentOptions[i] + 'Options').show();
					//activate corresponding button
					$('#' + parentOptions[i]).addClass('active');
				} else {
					//deactivate/ hide others
					$('#' + parentOptions[i] + 'Options').hide();
					$('#' + parentOptions[i]).removeClass('active');
				}
			}
		}

		/**
		 * used to activate the checkboxes for "avoid tollways" and "avoid highways" on startup if necessary
		 * @param highway: true, if highway checkbox is to be checked
		 * @param tollway: accordingly.
		 */
		function setAvoidables(highway, tollway) {
			var highwayTrue = (highway === 'true') || highway == true;
			var tollwayTrue = (tollway === 'true') || tollway == true;
			routeOptions[1][0] = highwayTrue;
			routeOptions[1][1] = tollwayTrue;
			$('#Highway').attr('checked', highwayTrue);
			$('#Tollway').attr('checked', tollwayTrue);
		}

		/**
		 * the user clicks on one of the buttons to handle avoid areas (draw, edit, delete)
		 * @param e: the event
		 */
		function avoidAreasToolClicked(e) {
			var btn = e.target;
			var tag = e.target.tagName;
			if (tag.toUpperCase() == 'IMG') {
				//we selected the image inside the button; get the parent (this will be the button).
				btn = $(e.target).parent().get(0);
			}

			//will be either create, edit or remove
			var mainPart = 'avoid'.length;
			var toolType = btn.id.substring(mainPart).toLowerCase();

			var btnIsActive = btn.className.indexOf('active') > -1;

			//set all btns to inactive
			var allBtn = $(btn).parent().get(0).querySelectorAll('button');
			for (var i = 0; i < allBtn.length; i++) {
				$(allBtn[i]).removeClass('active');
			}
			//activate current button if necessary
			if (!btnIsActive) {
				$(btn).addClass('active');
			}

			theInterface.emit('ui:avoidAreaControls', {
				toolType : toolType,
				//if the button has been active before, it will be de-activated now!
				activated : !btnIsActive
			});
		}

		/**
		 * shows or hides an avoid area error message, e.g. if one avoid area intersects itself
		 * @param showError: if true, shows the error message; hides it otherwise
		 */
		function showAvoidAreasError(showError) {
			var el = $('#avoidAreasError');
			el.html(preferences.translate('invalidAvoidArea'));
			if (showError) {
				el.show();
			} else {
				el.hide();
			}
		}

		/* *********************************************************************
		* PERMALINK
		* *********************************************************************/

		/**
		 * triggers opening a new window with the permalink
		 */
		function handleOpenPerma() {
			theInterface.emit('ui:openPermalinkRequest');
		}

		/* *********************************************************************
		* ACCESSIBILITY ANALSYIS
		* *********************************************************************/

		/**
		 * triggers the calculation of the accessibility analsyis with the current distance value
		 */
		function handleAnalyzeAccessibility() {
			var distance = $('#accessibilityDistance').val();
			var position = null;
			var element = $('#0').get(0);
			element = element.querySelector('.address');
			if (element) {
				position = element.getAttribute('data-position');
			}

			theInterface.emit('ui:analyzeAccessibility', {
				distance : distance,
				position : position
			});
		}

		/**
		 * shows a spinner during accessibility analysis calculation
		 * @param showSpinner: if true, show the spinner; hide otherwise
		 */
		function showSearchingAtAccessibility(showSpinner) {
			if (showSpinner) {
				$('#accessibilityCalculation').show();
			} else {
				$('#accessibilityCalculation').hide();
				$('#removeAccessibility').show();
			}
		}

		/**
		 * displays an accessibility analysis error message
		 * @param showError: if true, displays the error; hides it otherwise
		 */
		function showAccessibilityError(showError) {
			if (showError) {
				$('#accessibilityError').show();
				$('#removeAccessibility').hide();
			} else {
				$('#accessibilityError').hide();
			}
		}

		/**
		 * triggers removing former accessibility calculations from the map
		 */
		function handleRemoveAccessibility() {
			$('#removeAccessibility').hide();
			theInterface.emit('ui:removeAccessibility');
		}

		/* *********************************************************************
		* EXPORT / IMPORT
		* *********************************************************************/

		/**
		 * triggers the export route to GPX function
		 */
		function handleExportRouteClick() {
			theInterface.emit('ui:exportRouteGpx');
		}

		/**
		 * displays or hides a route export error
		 * @param showError: if true, the error is displayed; hidden otherwise
		 */
		function showExportRouteError(showError) {
			if (showError) {
				$('#exportGpxError').show();
			} else {
				$('#exportGpxError').hide();
			}
		}

		/**
		 * forwards the selected GPX file and triggers the waypoint extraction to upload a route from the file
		 */
		function handleImportRouteSelection() {
			var file;
			var fileInput = $$('#gpxUploadFiles input[type="file"]')[0];
			if (fileInput && fileInput.files && fileInput.files.length > 0) {
				file = fileInput.files[0];
			} else if (fileInput && fileInput.value) {
				//IE doesn't know x.files
				file = fileInput.value;
			}

			if (file) {
				theInterface.emit('ui:uploadRoute', file);
			}
		}

		/**
		 * removes the file from the import route dialogue
		 */
		function handleImportRouteRemove(e) {
			//if the file is removed from the view, we do NOT remove the waypoints from the list, etc.
			//just remove the erorr message if visible
			showImportRouteError(false);
		}

		/**
		 * shows an import error (route import)
		 * @param showError: if true, the error is displayed; hidden otherwise
		 */
		function showImportRouteError(showError) {
			if (showError) {
				$('#importGpxError').show();
			} else {
				$('#importGpxError').hide();
			}
		}

		/**
		 * forwards the selected GPX file and triggers the coordinate extraction to upload a track from the file
		 */
		function handleImportTrackSelection() {
			var file;
			var fileInput = $$('#gpxUploadTrack input[type="file"]')[0];
			if (fileInput && fileInput.files && fileInput.files.length > 0) {
				file = fileInput.files[0];
			} else if (fileInput && fileInput.value) {
				//IE doesn't know x.files
				file = fileInput.value;
			}

			if (file) {
				theInterface.emit('ui:uploadTrack', file);
				//TODO to support multiple GPX tracks, use data-attributes containing the OL-Feature-Id of the element (see search/waypoints)
			}
		}

		/**
		 * removes the file from the import track dialogue and triggers the deletion of the track on the map
		 */
		function handleImportTrackRemove() {
			//remove the track from the map
			theInterface.emit('ui:removeTrack');
		}

		/* *********************************************************************
		* HEIGHT PROFILE
		* *********************************************************************/

		/**
		 * forwards the selected height profile file and triggers data extraction to visualize the elevation data
		 */
		function handleUploadHeightProfileSelection() {
			var file;
			var fileInput = $$('#uploadHeightProfileFiles input[type="file"]')[0];
			if (fileInput && fileInput.files && fileInput.files.length > 0) {
				file = fileInput.files[0];
			} else if (fileInput && fileInput.value) {
				//IE doesn't know x.files
				file = fileInput.value;
			}
			console.log(file)
			if (file) {
				theInterface.emit('ui:uploadHeightProfile', file);
			}
		}

		/**
		 * shows the height profile as graph in the Ui.
		 * @param elevationPoints: array of OL.LonLat.Ele containing x, y and elevation information
		 */
		function showHeightProfile(elevationPoints) {
			var heightData = [];
			for (var i = 0; i < elevationPoints.length; i++) {
				var element = {
					x : i,
					y : parseInt(elevationPoints[i].ele)
				};
				heightData.push(element);
			}

			//define the height profile graph using Rickshaw library
			var graph = new Rickshaw.Graph({
				element : $('#heightProfileChart').get(0),
				series : [{
					color : 'steelblue',
					data : heightData,
					name : 'height'
				}]
			});
			graph.render();

			//shor percentage labels at the x axis
			var xAxis = new Rickshaw.Graph.Axis.X({
				graph : graph,
				tickFormat : function(x) {
					return Math.round(100 * x / elevationPoints.length) + '%'
				}
			});
			xAxis.render();

			//hover behavior of the height profile
			var hoverDetail = new Rickshaw.Graph.HoverDetail({
				graph : graph,
				//show nothing for x; name and heightData for y (default)
				xFormatter : function(x) {
					//show hover-maker for this position
					theInterface.emit('ui:heightProfileHover', {
						lon : elevationPoints[x].lon,
						lat : elevationPoints[x].lat
					});

					return elevationPoints[x].lon + ' ' + elevationPoints[x].lat;
				}
			});

		}

		/* *********************************************************************
		* USER PREFERENCES
		* *********************************************************************/

		/**
		 * extracts selected user preferences and forwards them for saving in the preference module
		 */
		function handleSaveUserPreferences() {
			var version = $('#extendedVersionPrefs').find(":selected").text();
			var language = $('#languagePrefs').find(":selected").text();
			var routingLanguage = $('#routingLanguagePrefs').find(":selected").text();
			var distanceUnit = $('#unitPrefs').find(":selected").text();

			//version: one of list.version
			version = preferences.reverseTranslate(version);

			//language: one of list.languages
			language = preferences.reverseTranslate(language);

			//routing language: one of list.routingLanguages
			routingLanguage = preferences.reverseTranslate(routingLanguage);

			//units: one of list.distanceUnitsInPopup
			distanceUnit = distanceUnit.split(' / ');
			for (var i = 0; i < distanceUnit.length; i++) {
				for (var j = 0; j < list.distanceUnitsPreferences.length; j++) {
					if (distanceUnit[i] === list.distanceUnitsPreferences[j]) {
						distanceUnit = list.distanceUnitsPreferences[j];
						i = distanceUnit.length;
						break;
					}
				}
			}

			theInterface.emit('ui:saveUserPreferences', {
				version : version,
				language : language,
				routingLanguage : routingLanguage,
				distanceUnit : distanceUnit
			});

			//hide preferences window
			$('#sitePrefsModal').modal('hide');
		}

		/**
		 * applies the given user preferences
		 * @param version: version of the site: standard, extended,...
		 * @param language: language of the site
		 * @param routingLanguage: language of the routing instructions
		 * @param distanceUnit: unit of distances used on the site
		 */
		function setUserPreferences(version, language, routingLanguage, distanceUnit) {
			//setting version
			var container = $('#extendedVersionPrefs').get(0);
			container = container.options;
			for (var i = 0; i < list.version.length; i++) {
				if (list.version[i] === version) {
					//set selected = true
					container[i].selected = true;
				}
			}

			//setting language
			container = $('#languagePrefs').get(0);
			container = container.options;
			for (var i = 0; i < list.languages.length; i++) {
				if (list.languages[i] === language) {
					//set selected = true
					container[i].selected = true;
				}
			}

			//setting routingLanguage
			container = $('#routingLanguagePrefs').get(0);
			container = container.options;
			for (var i = 0; i < list.routingLanguages.length; i++) {
				if (list.routingLanguages[i] === routingLanguage) {
					//set selected = true
					container[i].selected = true;
				}
			}

			//setting distanceUnit
			container = $('#unitPrefs').get(0);
			container = container.options;
			for (var i = 0; i < list.distanceUnitsPreferences.length; i++) {
				if (list.distanceUnitsPreferences[i] === distanceUnit) {
					//set selected = true
					container[i].selected = true;
				}
			}
		}

		/* *********************************************************************
		* CLASS-SPECIFIC
		* *********************************************************************/

		/**
		 * used for debugging information
		 */
		function debug() {
			console.log()
			theInterface.emit('ui:startDebug');
		}

		/* *********************************************************************
		 * CONSTRUCTOR
		 * *********************************************************************/

		function Ui() {
			//to use debug info, remove the .hide() statement and fill function debug() above
			$('#debug').hide();
			$('#debug').click(debug);

			//switch views
			$('.fnct_switchTab').click(handleSwitchTabs);
			//open & close collapsibles
			$('.collapsibleHead').click(handleToggleCollapsibles);
			//hide & view sidebar
			$('#toggleSidebar').click(handleToggleSidebar);
			$('#toggleHeightProfile').click(handleToggleHeightProfile);

			//waypoints
			$('.searchWaypoint').keyup(handleSearchWaypointInput);
			$('#addWaypoint').click(handleAddWaypointClick);
			$('#resetRoute').click(handleResetRoute);
			$('.moveUpWaypoint').click(handleMoveUpWaypointClick);
			$('.moveDownWaypoint').click(handleMoveDownWaypointClick);
			$('.removeWaypoint').click(handleRemoveWaypointClick);
			$('.searchAgainButton').click(handleSearchAgainWaypointClick);

			//route
			$('#zoomToRouteButton').click(handleZoomToRouteClick);

			//geolocation
			$('#fnct_geolocation').click(handleGeolocationClick);
			//search address
			$('#fnct_searchAddress').keyup(handleSearchAddressInput);
			$('#zoomToAddressResults').click(handleZoomToAddressResults);
			//search POI
			$('#fnct_searchPoi').keyup(handleSearchPoiInput);
			$('#fnct_searchPoi_nearRoute').change(handleSearchPoiNearRoute);
			$('#fnct_searchPoi_distance').keyup(handleSearchPoiDistance);
			$('#fnct_searchPoi_distanceUnit').change(handleSearchPoiDistanceUnit);
			$('#zoomToPoiResults').click(handleZoomToPoiResults);

			//route options
			$('#car').click(switchRouteOptionsPane);
			$('#bicycle').click(switchRouteOptionsPane);
			$('#pedestrian').click(switchRouteOptionsPane);
			$('.routeOptions').change(handleOptionsChanged);
			$('#avoidAreasToolbar').click(avoidAreasToolClicked);

			//permalink
			$('#fnct_permalink').click(handleOpenPerma);

			//accessibility analysis
			$('#analyzeAccessibility').click(handleAnalyzeAccessibility);
			$('#removeAccessibility').click(handleRemoveAccessibility);

			//export/ import
			$('#exportRouteGpx').click(handleExportRouteClick);
			$('#gpxUploadFiles').change(handleImportRouteSelection);
			$('#gpxUploadFilesDelete').click(handleImportRouteRemove);
			$('#gpxUploadTrack').change(handleImportTrackSelection);
			$('#gpxUploadTrackDelete').click(handleImportTrackRemove);

			//height profile
			$('#uploadHeightProfileFiles').change(handleUploadHeightProfileSelection)

			//user preferences
			$('#savePrefsBtn').click(handleSaveUserPreferences);
		}


		Ui.prototype = new EventEmitter();
		Ui.prototype.constructor = Ui;

		Ui.prototype.showNewToOrsPopup = showNewToOrsPopup;

		Ui.prototype.emphElement = emphElement;
		Ui.prototype.deEmphElement = deEmphElement;

		Ui.prototype.searchWaypointChangeToSearchingState = searchWaypointChangeToSearchingState;
		Ui.prototype.updateSearchWaypointResultList = updateSearchWaypointResultList;
		Ui.prototype.showSearchWaypointError = showSearchWaypointError;
		Ui.prototype.setWaypointFeatureId = setWaypointFeatureId;
		Ui.prototype.getFeatureIdOfWaypoint = getFeatureIdOfWaypoint;
		Ui.prototype.getWaypiontIndexByFeatureId = getWaypiontIndexByFeatureId;
		Ui.prototype.setWaypointType = setWaypointType;
		Ui.prototype.addWaypointAfter = addWaypointAfter;
		Ui.prototype.addWaypointResultByRightclick = addWaypointResultByRightclick;
		Ui.prototype.invalidateWaypointSearch = invalidateWaypointSearch;
		Ui.prototype.setMoveDownButton = setMoveDownButton;
		Ui.prototype.setMoveUpButton = setMoveUpButton;
		Ui.prototype.showSearchingAtWaypoint = showSearchingAtWaypoint;

		Ui.prototype.searchAddressChangeToSearchingState = searchAddressChangeToSearchingState;
		Ui.prototype.updateSearchAddressResultList = updateSearchAddressResultList;
		Ui.prototype.showSearchAddressError = showSearchAddressError;

		Ui.prototype.showCurrentLocation = showCurrentLocation;
		Ui.prototype.showGeolocationSearching = showGeolocationSearching;
		Ui.prototype.showGeolocationError = showGeolocationError;

		Ui.prototype.getRoutePreferences = getRoutePreferences;
		Ui.prototype.setRouteIsPresent = setRouteIsPresent;
		Ui.prototype.searchPoiChangeToSearchingState = searchPoiChangeToSearchingState;
		Ui.prototype.updateSearchPoiResultList = updateSearchPoiResultList;
		Ui.prototype.showSearchPoiError = showSearchPoiError;
		Ui.prototype.showSearchPoiDistUnitError = showSearchPoiDistUnitError;

		Ui.prototype.getRoutePoints = getRoutePoints;
		Ui.prototype.updateRouteSummary = updateRouteSummary;
		Ui.prototype.startRouteCalculation = startRouteCalculation;
		Ui.prototype.endRouteCalculation = endRouteCalculation;
		Ui.prototype.updateRouteInstructions = updateRouteInstructions;
		Ui.prototype.hideRouteSummary = hideRouteSummary;
		Ui.prototype.hideRouteInstructions = hideRouteInstructions;
		Ui.prototype.showRoutingError = showRoutingError;

		Ui.prototype.setRouteOption = setRouteOption;
		Ui.prototype.setAvoidables = setAvoidables;
		Ui.prototype.showAvoidAreasError = showAvoidAreasError;

		Ui.prototype.showSearchingAtAccessibility = showSearchingAtAccessibility;
		Ui.prototype.showAccessibilityError = showAccessibilityError;

		Ui.prototype.showExportRouteError = showExportRouteError;
		Ui.prototype.showImportRouteError = showImportRouteError;

		Ui.prototype.showHeightProfile = showHeightProfile;

		Ui.prototype.setUserPreferences = setUserPreferences;

		theInterface = new Ui();

		return theInterface;
	}(window));

/* *********************************************************************
* ICONS
* *********************************************************************/

//icons for markers on map
Ui.markerIcons = {
	start : ['img/marker-start.png', 'img/marker-start-high.png'],
	via : ['img/marker-via.png', 'img/marker-via-high.png'],
	end : ['img/marker-end.png', 'img/marker-end-high.png'],
	unset : ['img/marker-poi.png', 'img/marker-poi-high.png']
};
//icons for POI markers on map
Ui.poiIcons = {
	poi_9pin : 'img/poi/9pin.png',
	poi_10pin : 'img/poi/10pin.png',
	poi_archery : 'img/poi/archeery.png',
	//poi_arts_center : 'img/poi/arts_center.png',
	poi_athletics : 'img/poi/athletics.png',
	poi_atm : 'img/poi/atm.png',
	//poi_attraction : 'img/poi/attraction.png',
	poi_australian_football : 'img/poi/australian_football.png',
	poi_bakery : 'img/poi/bakery.png',
	poi_bank : 'img/poi/bank.png',
	poi_baseball : 'img/poi/baseball.png',
	poi_basketball : 'img/poi/basketball.png',
	poi_beachvolleyball : 'img/poi/beachvolleyball.png',
	//poi_bicycle_parking : img/poi/bicycle_parking.png',
	poi_biergarten : 'img/poi/biergarten.png',
	poi_boules : 'img/poi/boules.png',
	poi_bowls : 'img/poi/bowls.png',
	poi_bureau_de_change : 'img/poi/bureau_de_change.png',
	poi_bus_station : 'img/poi/bus_station.png',
	poi_bus_stop : 'img/poi/bus_stop.png',
	poi_butcher : 'img/poi/butcher.png',
	poi_cafe : 'img/poi/cafe.png',
	//poi_camp_site : 'img/poi/camp_site.png',
	poi_canoe : 'img/poi/canoe.png',
	//poi_castle : 'img/poi/castle.png',
	poi_chess : 'img/poi/chess.png',
	//poi_church : 'img/poi/church.png',
	poi_cinema : 'img/poi/cinema.png',
	poi_climbing : 'img/poi/climbing.png',
	poi_college : 'img/poi/college.png',
	poi_convenience : 'img/poi/convenience.png',
	poi_courthouse : 'img/poi/courthouse.png',
	poi_cricket : 'img/poi/cricket.png',
	poi_cricket_nets : 'img/poi/cricket_nets.png',
	poi_croquet : 'img/poi/croquet.png',
	poi_cycling : 'img/poi/cycling.png',
	poi_diving : 'img/poi/diving.png',
	poi_dog_racing : 'img/poi/dog_racing.png',
	poi_equestrian : 'img/poi/equestrian.png',
	poi_fast_food : 'img/poi/fast_food.png',
	//poi_fire_station : 'img/poi/fire_station.png',
	poi_fishing : 'img/poi/fishing.png',
	poi_football : 'img/poi/football.png',
	poi_fuel : 'img/poi/fuel.png',
	poi_garden : 'img/poi/garden.png',
	poi_golf : 'img/poi/golf.png',
	poi_golf_course : 'img/poi/golf.png',
	poi_guest_house : 'img/poi/guest_house.png',
	poi_gymnastics : 'img/poi/gymnastics.png',
	poi_hockey : 'img/poi/hockey.png',
	poi_horse_racing : 'img/poi/horse_racing.png',
	poi_hospital : 'img/poi/hospital.png',
	poi_hostel : 'img/poi/hostel.png',
	poi_hotel : 'img/poi/hotel.png',
	poi_ice_rink : 'img/poi/ice_rink.png',
	poi_information : 'img/poi/information.png',
	poi_kiosk : 'img/poi/kiosk.png',
	poi_korfball : 'img/poi/korfball.png',
	poi_library : 'img/poi/library.png',
	poi_marina : 'img/poi/marina.png',
	//poi_memorial : 'img/poi/memorial.png',
	poi_miniature_golf : 'img/poi/miniature_golf.png',
	//poi_monument : 'img/poi/monument.png',
	poi_motel : 'img/poi/motel.png',
	poi_motor : 'img/poi/motor.png',
	//poi_museum : 'img/poi/museum.png',
	poi_nature_reserve : 'img/poi/nature_reserve.png',
	poi_nightclub : 'img/poi/nightclub.png',
	poi_orienteering : 'img/poi/orienteering.png',
	poi_paddle_tennis : 'img/poi/tennis.png',
	poi_paragliding : 'img/poi/paragliding.png',
	poi_park : 'img/poi/park.png',
	poi_parking : 'img/poi/parking.png',
	poi_pelota : 'img/poi/pelota.png',
	poi_pharmacy : 'img/poi/pharmacy.png',
	poi_pitch : 'img/poi/pitch.png',
	poi_place_of_worship : 'img/poi/church.png',
	poi_playground : 'img/poi/playground.png',
	poi_police : 'img/poi/police.png',
	poi_post_box : 'img/poi/post_box.png',
	poi_post_office : 'img/poi/post_office.png',
	poi_pub : 'img/poi/pub.png',
	poi_public_building : 'img/poi/public_building.png',
	poi_raquet : 'img/poi/racquet.png',
	poi_railway_station : 'img/poi/railway_station.png',
	//poi_recreation : 'img/poi/recreation.png',
	//poi_recycling : 'img/poi/recycling.png',
	poi_restaurant : 'img/poi/restaurant.png',
	poi_rowing : 'img/poi/rowing.png',
	poi_rugby : 'img/poi/rugby.png',
	poi_school : 'img/poi/school.png',
	//poi_shelter : 'img/poi/shelter.png',
	poi_shooting : 'img/poi/shooting.png',
	poi_skateboard : 'img/poi/skateboard.png',
	poi_skating : 'img/poi/skating.png',
	poi_skiing : 'img/poi/skiing.png',
	poi_slipway : 'img/poi/slipway.png',
	poi_soccer : 'img/poi/soccer.png',
	poi_sports_center : 'img/poi/sports_centre.png',
	poi_squash : 'img/poi/squash.png',
	poi_stadium : 'img/poi/stadium.png',
	poi_subway_entrance : 'img/poi/subway_entrance.png',
	poi_supermarket : 'img/poi/supermarket.png',
	poi_swimming : 'img/poi/swimming.png',
	poi_table_tennis : 'img/poi/table_tennis.png',
	poi_taxi : 'img/poi/taxi.png',
	poi_team_handball : 'img/poi/team_handball.png',
	poi_telephone : 'img/poi/telephone.png',
	poi_tennis : 'img/poi/tennis.png',
	poi_theatre : 'img/poi/theatre.png',
	poi_toilets : 'img/poi/toilets.png',
	poi_townhall : 'img/poi/townhall.png',
	poi_track : 'img/poi/track.png',
	poi_tram_stop : 'img/poi/tram_stop.png',
	poi_university : 'img/poi/university.png',
	poi_viewpoint : 'img/poi/viewpoint.png',
	poi_volleyball : 'img/poi/volleyball.png',
	poi_water_park : 'img/poi/water_park.png',
	//default icon
	poi_default : 'img/poi/building_number.png'
};
/* ======================================================================
    ui/Versions.js
   ====================================================================== */

/**
 * Version deals with different appearances of the ORS client, e.g. the version 'standard' and 'extended'.
 * While the standard version contains only basic features, the extended version offers some more advanced options like route export/import, avoid areas,...
 * Switching between different versions means hiding or showing appropriate Ui elements (i.e. DIVs) 
 */
var Versions = ( function(w) {'use strict';

	var $ = w.jQuery;

	function Versions() {
		//different versions available
		this.standard = list.version[0];
		this.extended = list.version[1];
	}
	
	/**
	 * figure out which version to apply to the ORS site and show/hide Ui elements 
	 */
	function applyVersion(version) {
		switch (version) {
			case this.standard:
				applyStandardVersion();
				break;
			case this.extended:
				applyExtendedVersion();
				break;	
		}
	}
	
	/**
	 * hide Ui elements that are not visible in the standard version. 
	 */
	function applyStandardVersion() {
		//hide avoid areas
		$('#avoidAreas').hide();
		
		//hide import/export features
		$('#exportImport').hide();
		
		//hide accessibility analysis
		$('#accessibilityAnalysis').hide();
	}
	
	/**
	 * Show elements that are visible in the extended version. Hide other elements. 
	 */
	function applyExtendedVersion() {
		//show avoid areas
		$('#avoidAreas').show();
		
		//show import/export features
		$('#exportImport').show();
		
		//show accessibility analysis
		$('#accessibilityAnalysis').show();
	}
	
	Versions.prototype.applyVersion = applyVersion;

	return new Versions();
})(window);
/* ======================================================================
    ui/Languages.js
   ====================================================================== */

/**
 * Languages defines the various languages offered by ORS (site languages, not to be confused with the language of routing instructions)
 * based on the selected language, all site labels have to be loaded accordingly
 */
var Languages = (function(w) {'use strict';

	var $ = w.jQuery, p = w.Preferences;

	function Languages() {
	}

	/**
	 * Load labels in appropriate language
	 */
	function applyLanguage() {
		//nav bar on top
		$('#menuLinkSitePrefs').html(p.translate('sitePreferences'));
		$('#menuLinkInfo').html(p.translate('contact'));

		//sidebar left
		$('#routeLabel').html(p.translate('routePlanner'));
		$('#searchLabel').html(p.translate('search'));

		//route options
		$('#routeOptions').html(p.translate('routeOptions') + ':' + '<br/>');
		$('#fastestLabel').html(p.translate('Fastest'));
		$('#shortestLabel').html(p.translate('Shortest'));
		$('#BicycleLabel').html(p.translate('Bicycle'));
		$('#BicycleSafetyLabel').html(p.translate('BicycleSafety'));
		$('#BicycleRouteLabel').html(p.translate('BicycleRoute'));
		$('#BicycleMtbLabel').html(p.translate('BicycleMTB'));
		$('#BicycleRacerLabel').html(p.translate('BicycleRacer'));
		$('#PedestrianLabel').html(p.translate('Pedestrian'));
		$('#avoidMotorLabel').html(p.translate('avoidMotorways'));
		$('#avoidTollLabel').html(p.translate('avoidTollways'));
		$('#avoidAreasTitle').html(p.translate('avoidAreas'));

		//routing
		$('#resetRoute').html(p.translate('resetRoute'));
		$('.searchWaypoint').attr('placeholder', p.translate('enterAddress'));
		$('#addWaypoint').html(p.translate('addWaypoint'));
		$('#routeSummaryHead').html(p.translate('routeSummary') + ':');
		$('#routeInstructionHead').html(p.translate('routeInstructions') + ':');
		$('#zoomToRouteButton').html(p.translate('zoomToRoute'));

		//route extras
		$('#routeExtrasHead').html(p.translate('routeExtras') + ':');
		//permalink
		$('#permalinkLabel').html(p.translate('routeLinkText'));
		$('#fnct_permalink').html(p.translate('permalinkButton'));
		//accessibility
		$('#accessibilityAnalysisLabel').html(p.translate('accessibilityAnalysis'));
		$('#accessibilityAnalysisMinutes').html(p.translate('setAccessibilityMinutes'));
		$('#analyzeAccessibility').html(p.translate('analyze'));
		$('#accessibilityCalculation').html(p.translate('calculatingAccessibility'));
		$('#accessibilityError').html(p.translate('accessibilityError'));
		//export/ import
		$('#imExportLabel').html('<b>' + p.translate('imExport') + '</b>');
		$('#exportInfoLabel').html(p.translate('gpxDownloadText'));
		$('#exportRouteGpx').html(p.translate('gpxDownloadButton'));
		$('#exportGpxError').html(p.translate('gpxDownloadError'));
		$('#importRouteInfoLabel').html(p.translate('gpxUploadRouteText'));
		$('#importTrackInfoLabel').html(p.translate('gpxUploadTrackText'));
		$('#importGpxError').html(p.translate('gpxUploadError'));
		$('.fileUploadNewLabel').html(p.translate('selectFile'));
		$('.fileUploadExistsLabel').html(p.translate('changeFile'));

		//geolocation
		$('#geolocationHead').html(p.translate('currentLocation'));
		$('#fnct_geolocation').html(p.translate('showCurrentLocation'));

		//search address
		$('#searchAddressHead').html(p.translate('searchForPoints'));
		$('#fnct_searchAddress').attr('placeholder', p.translate('enterAddress'));

		//search POI
		$('#searchPoiHead').html(p.translate('searchForPoi'));
		$('#searchPoiWithin1').html('&nbsp;' + p.translate('poiNearRoute1'));
		$('#searchPoiWithin2').html(p.translate('poiNearRoute2'));
		$('#fnct_searchPoi').attr('placeholder', p.translate('enterPoi'));

		//preference popup
		$('#sitePrefs').html(p.translate('sitePreferences'));
		$('#versionLabel').html(p.translate('version'));
		$('#versionText').html(p.translate('versionText'));
		$('#languageLabel').html(p.translate('language'));
		$('#languageText').html(p.translate('languageText'));
		$('#routingLanguageLabel').html(p.translate('routingLanguage'));
		$('#routingLanguageText').html(p.translate('routingLanguageText'));
		$('#distanceUnitLabel').html(p.translate('distance'));
		$('#distanceUnitText').html(p.translate('distanceText'));
		$('#preferencesClose').html(p.translate('closeBtn'));
		$('#savePrefsBtn').html(p.translate('saveBtn'));

		//context menu
		$('#contextStart').html(p.translate('useAsStartPoint'));
		$('#contextVia').html(p.translate('useAsViaPoint'));
		$('#contextEnd').html(p.translate('useAsEndPoint'));
	}

	/**
	 * auto-completion for the POI search 
	 */
	function loadPoiTypeData() {
		var categoriesToDisplay = [];
		var dummyDiv = new Element('div');
		var typeCategories = $A(list.poiTypes.keys()).each(function(poiType) {
			var detailedTypes = list.poiTypes.get(poiType);

			//trick to decode HTML signs
			dummyDiv.innerHTML = p.translate(poiType);
			var decoded = dummyDiv.firstChild.nodeValue;
			categoriesToDisplay.push(decoded);

			$A(detailedTypes).each(function(detailedType) {
				//trick to decode HTML signs
				dummyDiv.innerHTML = p.translate(detailedType);
				var decoded = dummyDiv.firstChild.nodeValue;
				categoriesToDisplay.push(decoded);
			})
		})
		//convert the array to required string-representation
		var dataSource = categoriesToDisplay.toString().replace(/,/g, '","');
		//enclose all values with ""
		dataSource = '["' + dataSource + '"]';

		$('#fnct_searchPoi').attr('data-source', dataSource);
	}

	/**
	 * select dropdowns in the preference popup window for language, distance unit, etc. 
	 */
	function loadPreferencePopupData() {
		//versions
		var container = $('#extendedVersionPrefs');
		for (var i = 0; i < list.version.length; i++) {
			var optionElement = new Element('option', {
				'value' : i
			});
			if (i == 0) {
				optionElement.selected = true;
			}
			$(optionElement).html(p.translate(list.version[i]));
			container.append(optionElement);
		}
		//languages
		container = $('#languagePrefs');
		for (var i = 0; i < list.languages.length; i++) {
			var optionElement = new Element('option', {
				'value' : i
			});
			if (i == 0) {
				optionElement.selected = true;
			}
			$(optionElement).html(p.translate(list.languages[i]));
			container.append(optionElement);
		}

		//routing languages
		container = $('#routingLanguagePrefs');
		for (var i = 0; i < list.routingLanguages.length; i++) {
			var optionElement = new Element('option', {
				'value' : i
			});
			if (i == 0) {
				optionElement.selected = true;
			}
			$(optionElement).html(p.translate(list.routingLanguages[i]));
			container.append(optionElement);
		}

		//distance units
		container = $('#unitPrefs');
		for (var i = 0; i < list.distanceUnitsPreferences.length; i++) {
			var optionElement = new Element('option', {
				'value' : i
			});
			if (i == 0) {
				optionElement.selected = true;
			}
			$(optionElement).html(list.distanceUnitsInPopup[i]);
			container.append(optionElement);
		}
	}
	
	/**
	 * auto-build dropdown menu for distance unit selection 
	 */
	function loadPoiDistanceUnitData() {
		var container = $('#fnct_searchPoi_distanceUnit');
		for (var i = 0; i < list.distanceUnits.length; i++) {
			var optionElement = new Element('option', {
				'value' : list.distanceUnits[i]
			});
			if (i == 0) {
				optionElement.selected = true;
			}
			$(optionElement).html(list.distanceUnits[i]);
			container.append(optionElement);
		}
	}


	Languages.prototype.applyLanguage = applyLanguage;
	
	Languages.prototype.loadPoiTypeData = loadPoiTypeData;
	Languages.prototype.loadPreferencePopupData = loadPreferencePopupData;
	Languages.prototype.loadPoiDistanceUnitData = loadPoiDistanceUnitData;

	return new Languages();
})(window);
/* ======================================================================
    map.js
   ====================================================================== */

/**
 * OpenLayers map and functions
 */
var Map = ( function() {"use strict";
		/**
		 * create the layer styleMap by giving the default style a context;
		 * based on: http://openlayers.org/dev/examples/styles-context.html
		 */
		var pointAndLineStyle = {
			line : {
				stroke : '#009ad5',
				fill : '#009ad5',
				strokeWidthEm : 5,
				strokeEm : '#fba400',
				fillEm : '#009ad5'
			},
			point : {
				stroke : '#009ad5',
				fill : '#009ad5',
				strokeWidthEm : 2,
				strokeEm : '#009ad5',
				fillEm : '#fba400'
			}
		};

		// layer routePoints (= waypoints)
		//for default style
		var routePointsTemplate = {
			pointRadius : 16,
			stroke : true,
			strokeColor : '#ff0000',
			graphicZIndex : 6,
			externalGraphic : "${icon}",
			graphicXOffset : -10,
			graphicYOffset : -30,
			graphicWidth : 21,
			graphicHeight : 30
		};
		//for select style
		var routePointsSelTemplate = {
			graphicZIndex : 10,
			externalGraphic : "${iconEm}",
			graphicXOffset : -10,
			graphicYOffset : -30,
			graphicWidth : 21,
			graphicHeight : 30
		};

		//route lines
		var routeLineTemplate = {
			pointRadius : 0,
			fillOpacity : 1,
			strokeWidth : 5,
			strokeColor : '${stroke}',
			fillColor : '${fill}',
			graphicZIndex : 2,
			cursor : 'pointer'
		};
		var routeLineSelTemplate = {
			pointRadius : 6,
			strokeWidth : '${strokeWidthEm}',
			strokeColor : '${strokeEm}',
			fillColor : '${fillEm}',
			graphicZIndex : 3
		};

		//POI layer
		var poiTemplate = {
			pointRadius : 16,
			stroke : true,
			strokeColor : '#ff0000',
			graphicZIndex : 6,
			externalGraphic : "${icon}",
			graphicXOffset : -10,
			graphicYOffset : -30,
			graphicWidth : 21,
			graphicHeight : 30,
			graphicOpacity : 1
		};
		var poiSelTemplate = {
			graphicZIndex : 10,
			externalGraphic : "${iconEm}",
			graphicXOffset : -20,
			graphicYOffset : -40,
			graphicWidth : 41,
			graphicHeight : 50,
			graphicOpacity : 0.7
		};

		/* *********************************************************************
		 * LAYER NAMES
		 * *********************************************************************/

		var $ = window.jQuery;

		/**
		 * Constructor
		 * @param  {[type]} container [description]
		 */
		function map(container) {
			//layer names
			this.ROUTE_LINES = 'routeLines';
			this.ROUTE_POINTS = 'routePoints';
			this.ROUTE_INSTRUCTIONS = 'routeInstructions';
			this.GEOLOCATION = 'Geolocation';
			this.SEARCH = 'Address Search';
			this.POI = 'poi';
			this.GEOLOCATION = 'searchResults';
			this.AVOID = 'avoidAreas';
			this.TRACK = 'track';
			this.ACCESSIBILITY = 'accessiblity';
			this.HEIGHTS = 'Height Profile';

			var self = this;

			/* *********************************************************************
			 * MAP INIT
			 * *********************************************************************/
			this.theMap = new OpenLayers.Map(container, {
				controls : [],
				units : 'm',
				panDuration : 15,
				projection : new OpenLayers.Projection('EPSG:900913'),
				//necessary so that mouse position views 'correct' coords
				displayProjection : new OpenLayers.Projection('EPSG:4326'),
				theme : "lib/OpenLayersTheme.css",
				maxExtent : new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34)
			});

			/* *********************************************************************
			* MAP LAYERS
			* *********************************************************************/

			//layer 1 - open map surfer
			var mapSurfer_name = "OpenMapSurfer Roads";
			var mapSurfer_options = {
				type : 'png',
				isBaseLayer : true,
				numZoomLevels : 19,
				attribution : 'Maps and data: &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> and contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
			};
			var layerMapSurfer = new OpenLayers.Layer.XYZ(mapSurfer_name, namespaces.layerMapSurfer, mapSurfer_options);
			this.theMap.addLayer(layerMapSurfer);

			//layer 2 - mapnik
			var osmLayer = new OpenLayers.Layer.OSM();
			this.theMap.addLayer(osmLayer);

			//layer 3 - osm-wms worldwide
			var wms_name = "OSM-WMS worldwide";
			var wms_options = {
				layers : 'osm_auto:all',
				srs : 'EPSG:900913',
				format : 'image/png',
				numZoomLevels : 19
			};
			var layerOSM = new OpenLayers.Layer.WMS(wms_name, namespaces.layerWms, wms_options, {
				'buffer' : 2,
				'attribution' : 'Maps and data: &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> and contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
			});
			this.theMap.addLayer(layerOSM);

			//layer 4 - cycle map
			var layerCycle = new OpenLayers.Layer.OSM("OpenCycleMap", ["http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png", "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png", "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"]);
			this.theMap.addLayer(layerCycle);

			//overlay - hillshade
			var hs_options = {
				layers : 'europe_wms:hs_srtm_europa',
				srs : 'EPSG:900913',
				format : 'image/jpeg',
				transparent : 'true'
			};
			var hs2 = new OpenLayers.Layer.WMS("Hillshade", namespaces.layerHs, hs_options);
			hs2.setOpacity(0.2);
			hs2.visibility = false;
			this.theMap.addLayer(hs2);

			//TODO too many requests sent
			//overlay - traffic
			var layerTMC_lines = new OpenLayers.Layer.WMS("Germany TMC (Streets)", namespaces.overlayTmcLines, {
				'layers' : 'osm_tmc:lines',
				srs : 'EPSG:31467',
				transparent : true,
				format : 'image/png',
				tiled : 'true'
			}, {
				displayInLayerSwitcher : false,
				visibility : false
			});
			this.theMap.addLayer(layerTMC_lines);

			var layerTMC = new OpenLayers.Layer.WMS("TMC Germany", namespaces.overlayTmc, {
				layers : 'tmc:tmcpoints',
				styles : 'tmcPoint_All',
				srs : 'EPSG:31467',
				transparent : true,
				format : 'image/png',
				tiled : 'true'
			}, {
				visibility : false
			});
			this.theMap.addLayer(layerTMC);
			layerTMC.events.register('visibilitychanged', 'map', function(e) {
				layerTMC_lines.setVisibility(layerTMC.getVisibility());
			});

			//layrers required for routing, etc.
			//route points
			var styles = new OpenLayers.StyleMap({
				"default" : new OpenLayers.Style({
					pointRadius : 16,
					externalGraphic : "http://mnps.org/googlemaps/images/blue.png"
				}),
				"select" : new OpenLayers.Style({
					pointRadius : 16,
					externalGraphic : "http://mnps.org/googlemaps/images/orange.png"
				})
			});

			var searchStyleMap = new OpenLayers.StyleMap({
				"default" : new OpenLayers.Style(routePointsTemplate),
				"select" : new OpenLayers.Style(routePointsSelTemplate)
			});

			var layerRoutePoints = new OpenLayers.Layer.Vector(this.ROUTE_POINTS, {
				styleMap : searchStyleMap,
				displayInLayerSwitcher : false,
				rendererOptions : {
					yOrdering : true
				}
			});

			var routeLineStyleMap = new OpenLayers.StyleMap({
				'default' : new OpenLayers.Style(routeLineTemplate),
				'select' : new OpenLayers.Style(routeLineSelTemplate)
			});

			var layerRouteLines = new OpenLayers.Layer.Vector(this.ROUTE_LINES, {
				displayInLayerSwitcher : false,
				styleMap : routeLineStyleMap
			});

			//Geolocation
			var layerGeolocation = new OpenLayers.Layer.Vector(this.GEOLOCATION, {
				styleMap : searchStyleMap,
				displayInLayerSwitcher : false
			});

			var poiStyleMap = new OpenLayers.StyleMap({
				"default" : new OpenLayers.Style(poiTemplate),
				"select" : new OpenLayers.Style(poiSelTemplate)
			});

			//Search POI
			var layerPoi = new OpenLayers.Layer.Vector(this.POI, {
				displayInLayerSwitcher : false,
				styleMap : poiStyleMap
			});

			//Search place
			var layerSearch = new OpenLayers.Layer.Vector(this.SEARCH, {
				displayInLayerSwitcher : false,
				styleMap : searchStyleMap,
				rendererOptions : {
					yOrdering : true
				}
			});

			//avoid areas
			var layerAvoid = new OpenLayers.Layer.Vector(this.AVOID, {
				displayInLayerSwitcher : false
			});
			layerAvoid.redraw(true);

			//track lines
			var layerTrack = new OpenLayers.Layer.Vector(this.TRACK, {
				displayInLayerSwitcher : false,
				'style' : {
					strokeColor : "#2c596b",
					strokeOpacity : 1,
					strokeWidth : 4,
					cursor : "pointer"
				}
			});

			//accessibility
			var layerAccessibility = new OpenLayers.Layer.Vector(this.ACCESSIBILITY, {
				displayInLayerSwitcher : false
			});
			layerAccessibility.redraw(true);

			//height profile
			var layerHeights = new OpenLayers.Layer.Vector(this.HEIGHTS, {
				displayInLayerSwitcher : false
			});

			//define order
			this.theMap.addLayers([layerHeights, layerAccessibility, layerRouteLines, layerTrack, layerGeolocation, layerSearch, layerPoi, layerRoutePoints, layerAvoid]);

			/* *********************************************************************
			 * MAP CONTROLS
			 * *********************************************************************/
			this.theMap.addControl(new OpenLayers.Control.PanZoom());
			this.theMap.addControl(new OpenLayers.Control.ArgParser());

			this.theMap.addControl(new OpenLayers.Control.Navigation({
				handleRightClicks : true,
				dragPanOptions : {
					documentDrag : true
				}
			}));

			this.theMap.addControl(new OpenLayers.Control.LayerSwitcher({
				roundedCorner : 'true',
				roundedCornerColor : 'black',
				id : 'layerSwitcherPanel'
			}));

			this.theMap.addControl(new OpenLayers.Control.ScaleLine());
			this.theMap.addControl(new OpenLayers.Control.MousePosition());
			this.theMap.addControl(new OpenLayers.Control.Permalink());
			this.theMap.addControl(new OpenLayers.Control.Attribution());

			this.selectMarker = new OpenLayers.Control.SelectFeature([layerSearch, layerGeolocation, layerRoutePoints, layerPoi, layerRouteLines], {
				hover : true
			});
			//highlighting of the markers's DOM representation (address text) on mouseover
			this.selectMarker.onSelect = function(feature) {
				self.emit('map:markerEmph', feature.id);
			};
			this.selectMarker.onUnselect = function(feature) {
				self.emit('map:markerDeEmph', feature.id);
			};
			this.theMap.addControl(this.selectMarker);

			this.selectMarker.activate();

			//copied from http://openlayers.org/dev/examples/select-feature-multilayer.html
			// vectors1.events.on({
			// "featureselected": function(e) {
			// showStatus("selected feature "+e.feature.id+" on Vector Layer 1");
			// },
			// "featureunselected": function(e) {
			// showStatus("unselected feature "+e.feature.id+" on Vector Layer 1");
			// }
			// });
			// vectors2.events.on({
			// "featureselected": function(e) {
			// showStatus("selected feature "+e.feature.id+" on Vector Layer 2");
			// },
			// "featureunselected": function(e) {
			// showStatus("unselected feature "+e.feature.id+" on Vector Layer 2");
			// }
			// });

			// Add an instance of the Click control that listens to various click events (see ORS.OpenLayers file for implementation of Click)
			var clickControl = new OpenLayers.Control.Click({
				eventMethods : {
					'rightclick' : function(e) {
						//if we have any other popup menus, remove them
						closeContextMenu();

						//build new popup menu
						var pos = self.theMap.getLonLatFromViewPortPx(e.xy);
						var displayPos = util.convertPointForDisplay(pos);

						var menuObject = $('#mapContextMenu').clone();
						menuObject.attr('id', 'menu');

						//event handling for context menu
						var options = menuObject.children();
						options[0].onclick = function(e) {
							//click on start point
							self.emit('map:addWaypoint', {
								pos : displayPos,
								type : Waypoint.type.START
							});
						};
						options[1].onclick = function(e) {
							//click on via point
							self.emit('map:addWaypoint', {
								pos : displayPos,
								type : Waypoint.type.VIA
							});
						};
						options[2].onclick = function(e) {
							//click on end point
							self.emit('map:addWaypoint', {
								pos : displayPos,
								type : Waypoint.type.END
							});
						}
						//place context menu in a popup on the map
						self.popup = new OpenLayers.Popup('menu', pos, null, menuObject.html(), false, null);
						self.popup.autoSize = true;
						self.popup.div = menuObject.get(0);
						self.popup.opacity = 0.9;
						//TODO all this will not work properly with any stable version of OL; it is only included in DEV version so far... :/
						self.popup.border = '1px';

						self.theMap.addPopup(self.popup);
					},
					'click' : function(e) {
						closeContextMenu();
					},
					'dblclick' : function(e) {
						closeContextMenu();
					},
					'dblrightclick' : function(e) {
						closeContextMenu();
					}
				}
			});
			this.theMap.addControl(clickControl);
			clickControl.activate();

			// external code source: http://spatialnotes.blogspot.com/2010/11/capturing-right-click-events-in.html
			// Get control of the right-click event:
			// document.getElementById(container).oncontextmenu = function(e) {
			// e = e ? e : window.event;
			// if (e.preventDefault)
			// e.preventDefault();
			// // For non-IE browsers.
			// else
			// return false;
			// // For IE browsers.
			// };
			//

			//close the context menu when zooming or panning,...
			function closeContextMenu() {
				$('#menu').remove();
			};

			//make route waypoints draggable
			var dragWaypoints = new OpenLayers.Control.DragFeature(layerRoutePoints);
			dragWaypoints.onComplete = function(feature) {
				self.emit('map:waypointMoved', feature);
			};
			this.theMap.addControl(dragWaypoints);
			dragWaypoints.activate();

			//avoid area controls
			this.avoidTools = {
				'create' : new OpenLayers.Control.DrawFeature(layerAvoid, OpenLayers.Handler.Polygon, {
					featureAdded : function() {
						var errorous = self.checkAvoidAreasIntersectThemselves();
						if (errorous) {
							self.emit('map:errorsInAvoidAreas', true);
						}
						self.emit('map:routingParamsChanged');
						self.emit('map:avoidAreaChanged', self.getAvoidAreasString());
					}
				}),
				'edit' : new OpenLayers.Control.ModifyFeature(layerAvoid),
				'remove' : new OpenLayers.Control.SelectFeature(layerAvoid, {
					onSelect : function(feature) {
						layerAvoid.removeFeatures([feature]);
						var errorous = self.checkAvoidAreasIntersectThemselves();
						if (!errorous) {
							self.emit('map:errorsInAvoidAreas', false);
						}
						self.emit('map:routingParamsChanged');
						self.emit('map:avoidAreaChanged', self.getAvoidAreasString());
					}
				})
			};
			for (var key in this.avoidTools) {
				this.theMap.addControl(this.avoidTools[key]);
			}
			//trigger an event after changing the avoid area polygon
			layerAvoid.events.register('afterfeaturemodified', this.theMap, function(feature) {
				var errorous = self.checkAvoidAreasIntersectThemselves();
				if (errorous) {
					self.emit('map:errorsInAvoidAreas', true);
				} else {
					self.emit('map:errorsInAvoidAreas', false);
				}
				self.emit('map:routingParamsChanged');
				self.emit('map:avoidAreaChanged', self.getAvoidAreasString());
			});

			/* *********************************************************************
			 * MAP LOCATION
			 * *********************************************************************/
			var hd = util.convertPointForMap(new OpenLayers.LonLat(8.692953, 49.409445));
			this.theMap.setCenter(hd, 13);

			/* *********************************************************************
			 * MAP EVENTS
			 * *********************************************************************/
			function emitMapChangedEvent(e) {
				var centerTransformed = util.convertPointForDisplay(self.theMap.getCenter());
				self.emit('map:changed', {
					layer : self.serializeLayers(),
					zoom : self.theMap.getZoom(),
					lat : centerTransformed.lat,
					lon : centerTransformed.lon
				});
			}

			var self = this;
			this.theMap.events.register('zoomend', this.theMap, function(e) {
				emitMapChangedEvent(e);
			});
			this.theMap.events.register('moveend', this.theMap, emitMapChangedEvent);
			this.theMap.events.register('changelayer', this.theMap, emitMapChangedEvent);

			//when zooming or moving the map -> close the context menu
			this.theMap.events.register("zoomend", this.map, closeContextMenu);
			this.theMap.events.register("movestart", this.map, closeContextMenu);
		}

		/* *********************************************************************
		* FOR PERMALINK OR COOKIE
		* *********************************************************************/

		/**
		 * returns one single string with the layers of the given map that can be used in HTTP GET vars
		 */
		function serializeLayers() {
			var layers = this.theMap.layers;
			var baseLayer = this.theMap.baseLayer;
			var str = '';
			for (var i = 0, len = layers.length; i < len; i++) {
				var layer = layers[i];
				if (layer.isBaseLayer) {
					str += (layer == baseLayer) ? "B" : "0";
				} else {
					str += (layer.getVisibility()) ? "T" : "F";
				}
			}
			return str;
		}

		/**
		 * restores the given previously selected layers in the map that can be used in HTTP GET vars
		 * @param map: Map object to activate the layers on
		 * @params: layer string with active base layer and overlays
		 */
		function restoreLayerPrefs(params) {
			var layers = this.theMap.layers;
			var result, indices = [];

			//set given map layer active
			var baseLayer = params.indexOf('B') >= 0 ? params.indexOf('B') : 0;
			this.theMap.setBaseLayer(this.theMap.layers[baseLayer]);

			//determine which overlays to set active
			var regex = /T/gi;
			while (( result = regex.exec(params))) {
				indices.push(result.index);
			}
			for (var i = 0; i < indices.length; i++) {
				if (layers[indices[i]]) {
					layers[indices[i]].setVisibility(true);
				}
			}
		}

		/* *********************************************************************
		* GENERAL
		* *********************************************************************/

		/**
		 * removes all (appropriate) markers/ features from the given layer
		 *  @param layerName: name of the layer to remove the objects from
		 *  @param waypointIndex: index of the waypoint where to remove objects from
		 */
		function clearMarkers(layerName, featureIds) {
			var layer = this.theMap.getLayersByName(layerName);
			if (layer && layer.length > 0) {
				layer = layer[0];
			}
			if (featureIds && featureIds.length > 0) {
				var toRemove = [];
				for (var i = 0; i < featureIds.length; i++) {
					if (featureIds[i]) {
						var ft = layer.getFeatureById(featureIds[i]);
						toRemove.push(ft);
					}
				}
				layer.removeFeatures(toRemove);
			} else {
				layer.removeAllFeatures();
			}
		}

		/**
		 * Move and zoom the map to a given marker
		 * @param {Object} objectId String containing the CSS-id of the marker representation, e.g. 'address_2' or 'poi_47'
		 */
		function zoomToMarker(position, zoom) {
			this.theMap.moveTo(position, zoom);
		}

		/**
		 * zoom to a given feature vector defined by its vector id.
		 * @param mapLayer: layer of the map where the feature is located
		 * @param zoom: optional zoom level
		 */
		function zoomToFeature(mapLayer, vectorId, zoom) {
			mapLayer = this.theMap.getLayersByName(mapLayer);
			if (mapLayer && mapLayer.length > 0) {
				mapLayer = mapLayer[0];
			}
			var vectors = mapLayer.getFeatureById(vectorId);
			var bounds = vectors.geometry.getBounds();

			if (zoom) {
				this.theMap.moveTo(bounds.getCenterLonLat(), zoom);
			} else {
				this.theMap.zoomToExtent(bounds);
			}
		}

		/**
		 * when performing certain actions on the Ui, OL features need to be emphasized/ deemphasized.
		 * @param layer: the layer the feature is located on
		 * @param featureId: OL id of the feature to emph/deemph
		 * @param empg: if true, the feature is emphasized; if false, the feature is deemphasized
		 */
		function emphMarker(layer, featureId, emph) {
			var layer = this.theMap.getLayersByName(layer);
			layer = layer ? layer[0] : null;

			if (layer) {
				var marker = layer.getFeatureById(featureId);
				if (emph) {
					//emphasize feature
					this.selectMarker.select(marker);
				} else {
					//de-emphasize feature
					this.selectMarker.unselect(marker);
				}
			}
		}

		/**
		 * based on an OL feature id and the layer the feature is located on, the position is looked up
		 * @param featureId: OL feature ID as string
		 * @param layer: string name of the layer the feature is located on.
		 * @return: string with the position of the feature; style: 'x-coordinate y-coordinate'
		 */
		function convertFeatureIdToPositionString(featureId, layer) {
			var mapLayer = this.theMap.getLayersByName(layer);
			if (mapLayer && mapLayer.length > 0) {
				mapLayer = mapLayer[0];
			}
			var ft = mapLayer.getFeatureById(featureId);
			if (ft && ft.geometry) {
				return ft.geometry.x + ' ' + ft.geometry.y;
			}
		}

		/**
		 * based on the ID of the feature, looks up the first point in a line, e.g. used in route lines
		 * @param featureId: OL feature ID as string
		 * @param layer: string name of the layer the feature is located on.
		 * @return: string ID of the first point.
		 */
		function getFirstPointIdOfLine(featureId, layer) {
			var mapLayer = this.theMap.getLayersByName(layer);
			if (mapLayer && mapLayer.length > 0) {
				mapLayer = mapLayer[0];
			}
			var ft = mapLayer.getFeatureById(featureId);
			if (ft && ft.geometry && ft.geometry.components && ft.geometry.components.length > 0) {
				return ft.geometry.components[0].id;
			} else {
				return null;
			}
		}

		/**
		 * activates or deactivates all select controls
		 * (used by the avoid area tools which require all selectFeature controls to be off)
		 * @param activate: if true, select controls are activated; if false, they are de-activated.
		 */
		function activateSelectControl(activate) {
			if (activate) {
				this.selectMarker.activate();
			} else {
				this.selectMarker.deactivate();
			}
		}

		/* *********************************************************************
		* FOR MODULES (e.g. search, routing,...)
		* *********************************************************************/

		/*
		* WAYPOINTS
		*/
		/**
		 * for the given waypoint index, select the given search result element (by index) and convert it to a waypoint marker with the given type
		 * @param wpIndex: int containing the index of the waypoint
		 * @param featureId: OL feature ID as string
		 * @param type: type of the waypoint (start, via, end)
		 * @return: ID of the waypoint feature
		 */
		function addWaypointMarker(wpIndex, featureId, type) {
			var layerSearchResults = this.theMap.getLayersByName(this.SEARCH)[0];
			var layerWaypoints = this.theMap.getLayersByName(this.ROUTE_POINTS)[0];

			var oldMarker = layerSearchResults.getFeatureById(featureId);
			if (oldMarker) {
				var newMarker = new OpenLayers.Geometry.Point(oldMarker.geometry.x, oldMarker.geometry.y);
				var newFeature = new OpenLayers.Feature.Vector(newMarker, {
					icon : Ui.markerIcons[type][0],
					iconEm : Ui.markerIcons[type][1],
				});
				layerWaypoints.addFeatures([newFeature]);
				return newFeature.id;
			}
		}

		/**
		 * add a waypoint marker with the given type at the given position (e.g. by clicking on the map saying 'add a waypoint here')
		 * @param position: OL LonLat containing the position where the new waypoint should be created
		 * @param wpIndex: int index the waypoint should be assigned to
		 * @param type: type of the waypoint (start, via, end)
		 */
		function addWaypointAtPos(position, wpIndex, type) {
			var layerWaypoints = this.theMap.getLayersByName(this.ROUTE_POINTS)[0];

			//set new marker
			var newMarker = new OpenLayers.Geometry.Point(position.lon, position.lat);
			var newFeature = new OpenLayers.Feature.Vector(newMarker, {
				icon : Ui.markerIcons[type][0],
				iconEm : Ui.markerIcons[type][1],
			});
			layerWaypoints.addFeatures([newFeature]);
			return newFeature.id;
		}

		/**
		 * sets the type of the given waypoint identified by its feature ID
		 * @param featureId: OL feature ID as string
		 * @param type: type of the waypoint (start, via, end)
		 */
		function setWaypointType(featureId, type) {
			var layerWaypoints = this.theMap.getLayersByName(this.ROUTE_POINTS)[0];
			var feature = layerWaypoints.getFeatureById(featureId);

			//create new feature
			if (feature) {
				var pt = new OpenLayers.Geometry.Point(feature.geometry.x, feature.geometry.y);
				var newFeature = new OpenLayers.Feature.Vector(pt, {
					icon : Ui.markerIcons[type][0],
					iconEm : Ui.markerIcons[type][1],
				});
				layerWaypoints.addFeatures([newFeature]);
				layerWaypoints.removeFeatures([feature]);
				var id = newFeature.id;
			}
			return id;
		}

		/**
		 * encode all waypoints by their position in a string; used e.g. for permalink
		 * @return: string of LonLat positions; style: 'lon1,lat1,lon2,lat2,...lonk,latk'
		 */
		function getWaypointsString() {
			var layer = this.theMap.getLayersByName(this.ROUTE_POINTS)[0];

			//serialize these features to string
			var wpString = "";
			for (var i = 0; i < layer.features.length; i++) {
				var ft = layer.features[i].geometry;
				ft = new OpenLayers.LonLat(ft.x, ft.y);
				ft = util.convertPointForDisplay(ft);
				wpString = wpString + ft.lon + ',' + ft.lat + ',';
			}
			//slice away the last separator ','
			wpString = wpString.substring(0, wpString.length - 3);
			return wpString;
		}

		/*
		* GEOLOCATION
		*/

		/**
		 * adds a marker for the geolocation result at the given position
		 * @param position: OL LonLat
		 * @return: the OL Feature.Vector which was set at the given position
		 */
		function addGeolocationResultMarker(position) {
			var layer = this.theMap.getLayersByName(this.GEOLOCATION)[0];
			layer.removeAllFeatures();

			//convert corrdinates of marker
			var feature = null;
			if (position) {
				position = util.convertPointForMap(position);
				var point = new OpenLayers.Geometry.Point(position.lon, position.lat);

				feature = new OpenLayers.Feature.Vector(point, {
					icon : Ui.markerIcons.unset[0],
					iconEm : Ui.markerIcons.unset[1],
				});

				layer.addFeatures([feature]);
				this.theMap.moveTo(position, 14);
			}
			return feature;
		}

		/*
		* SEARCH ADDRESS
		*/

		/**
		 * transform given search results to markers and add them on the map.
		 * (this is also used for waypoint search results)
		 * @param {Object} listOfPoints array of OpenLayers.LonLat
		 * @return array with added OL.Feature.Vector
		 */
		function addSearchAddressResultMarkers(listOfPoints, wpIndex) {
			var layerSearchResults = this.theMap.getLayersByName(this.SEARCH)[0];
			var listOfFeatures = [];
			for (var i = 0; i < listOfPoints.length; i++) {
				//convert corrdinates of marker
				var point = listOfPoints[i];
				var feature = null;
				if (point) {

					point = util.convertPointForMap(point);
					point = new OpenLayers.Geometry.Point(point.lon, point.lat);

					if (wpIndex) {
						//a waypoint search
						var ftId = 'address_' + wpIndex + '_' + i;
					} else {
						//an address search
						var ftId = 'address_' + i;
					}

					feature = new OpenLayers.Feature.Vector(point, {
						icon : Ui.markerIcons.unset[0],
						iconEm : Ui.markerIcons.unset[1],
					});

					layerSearchResults.addFeatures([feature]);
				}
				listOfFeatures.push(feature);
			}

			//show all results
			this.zoomToAddressResults();

			return listOfFeatures;
		}

		/**
		 * views all address results on the map by zooming to the level at which all features of the search are visible
		 * (this is also used for waypoint search results)
		 */
		function zoomToAddressResults() {
			var layerSearchResults = this.theMap.getLayersByName(this.SEARCH)[0];
			var resultBounds = layerSearchResults.getDataExtent();
			this.theMap.zoomToExtent(resultBounds);
			if (this.theMap.getZoom() > 14) {
				this.theMap.zoomTo(14);
			}
		}

		/*
		* SEARCH POI
		*/

		/**
		 * transforms given search results to features and adds them on the map.
		 * @param {Object} listOfPoints array of OpenLayers.LonLat
		 * @return array of added OL.Feature.Vector with the added features
		 */
		function addSearchPoiResultMarkers(listOfPoints) {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			var listOfFeatures = [];
			for (var i = 0; i < listOfPoints.length; i++) {
				var point = listOfPoints[i];

				var icon = Ui.poiIcons['poi_' + point.iconType];
				icon = icon ? icon : Ui.poiIcons['poi_default'];

				point = util.convertPointForMap(point);
				point = new OpenLayers.Geometry.Point(point.lon, point.lat);
				var feature = new OpenLayers.Feature.Vector(point, {
					icon : icon,
					iconEm : icon
				});
				layerPoiResults.addFeatures([feature]);
				listOfFeatures.push(feature);
			}

			return listOfFeatures;
		}

		/**
		 * Emphasizes the given search result feature
		 * @param {String} featureId: OL feature id of the feature to emphasize
		 */
		function emphasizeSearchPoiMarker(featureId) {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			$A(layerPoiResults.markers).each(function(marker) {
				if (marker.id == featureId) {
					marker.setOpacity(1);
					marker.inflate(1.4);
				}
			});
		}

		/**
		 * Deemphasizes the given search result feature
		 * @param {String} featureId: OL feature id of the feature to deemphasize
		 */
		function deEmphasizeSearchPoiMarker(featureId) {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			$A(layerPoiResults.markers).each(function(marker) {
				if (marker.id == featureId) {
					marker.setOpacity(0.7);
					marker.inflate(0.715);
				}
			});
		}

		/**
		 * zooms the map so that all POI features become visible
		 */
		function zoomToPoiResults() {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			var resultBounds = layerPoiResults.getDataExtent();
			this.theMap.zoomToExtent(resultBounds);
			if (this.theMap.getZoom() > 14) {
				this.theMap.zoomTo(14);
			}
		}

		/*
		* ROUTE
		*/

		/**
		 * draws given points as route line on the map
		 * @param {Object} routeLineSegments: array of OL.Geometry.LineString
		 * @return array of OL.Feature.Vector added to the layer
		 */
		function updateRoute(routeLineSegments, routeLinePoints) {
			var layer = this.theMap.getLayersByName(this.ROUTE_LINES)[0];
			layer.removeAllFeatures();

			var ftIds = [];
			if (routeLineSegments && routeLineSegments.length > 0) {
				var self = this;
				for (var i = 0; i < routeLineSegments.length; i++) {
					//"lines" of the route
					var segment = routeLineSegments[i];
					var segmentFt = new OpenLayers.Feature.Vector(segment, pointAndLineStyle.line);

					//"corner points" of the route where direction changes
					var cornerPoint = routeLinePoints[i];
					var cornerFt = new OpenLayers.Feature.Vector(cornerPoint, pointAndLineStyle.point);

					layer.addFeatures([segmentFt, cornerFt]);

					ftIds.push(segmentFt.id, cornerFt.id);
				}
			}
			return ftIds;
		}

		/**
		 * zooms the map so that the whole route becomes visible (i.e. all features of the route line layer)
		 */
		function zoomToRoute() {
			var layer = this.theMap.getLayersByName(this.ROUTE_LINES)[0];
			var dataExtent = layer.getDataExtent();
			if (dataExtent) {
				this.theMap.zoomToExtent(dataExtent);
			}
		}

		/*
		* AVOID AREAS
		*/

		/**
		 * activates or deactivates the given avoid area tool (draw, modify, delete)
		 * @param {Object} tool: control to select
		 * @param {Object} activate: if true, the control is activated; if false, it is deactivated
		 */
		function avoidAreaTools(tool, activate) {
			for (var key in this.avoidTools) {
				this.avoidTools[key].deactivate();
			}
			if (activate) {
				this.avoidTools[tool].activate();
			}
		}

		/**
		 * checks if two avoid ares, i.e. polygons intersect each other.
		 * @return true, if polygons intersect; otherwise false
		 */
		function checkAvoidAreasIntersectThemselves() {
			//code adapted from http://lists.osgeo.org/pipermail/openlayers-users/2012-March/024285.html
			var layer = this.theMap.getLayersByName(this.AVOID)[0];
			var intersect = false;
			for (var ftNum = 0; ftNum < layer.features.length; ftNum++) {
				var fauxpoint = [];
				var line = [];
				var led = layer.features[ftNum];

				var strng = led.geometry.toString();
				var coord = strng.split(',');
				// remove the 'Polygon((' from the 1st coord
				coord[0] = coord[0].substr(9);
				// Remove the '))' from the last coord
				coord[coord.length - 1] = coord[coord.length - 1].substr(0, coord[coord.length - 1].length - 2);

				//convert to lines
				for ( i = 0; i < coord.length; i++) {
					var lonlat = coord[i].split(' ');
					fauxpoint.push(new OpenLayers.Geometry.Point(lonlat[0], lonlat[1]));
					if (i > 0) {
						// create an array with the 2 last points
						var point = [fauxpoint[i - 1], fauxpoint[i]];
						//create the line
						line.push(new OpenLayers.Geometry.LineString(point));
					}
				}

				// Check every line against every line
				for (var i = 1; i < line.length; i++) {
					for (var j = 1; j < line.length; j++) {
						// get points of the I line in an array
						var vi = line[i].getVertices();
						// get points of the J line in an array
						var vj = line[j].getVertices();

						/*
						 *  the lines must be differents and not adjacents.
						 *  The end or start point of an adjacent line will be intersect,
						 *  and adjacent lines never intersect in other point than the ends.
						 */
						if (i != j && vi[1].toString() != vj[0].toString() && vi[0].toString() != vj[1].toString()) {
							// the intersect check
							if (line[i].intersects(line[j])) {
								intersect = true;
							}
						}
					}
				}
			}
			return intersect;
		}

		/**
		 * add the given areas as avoid area polygons to the appropriate map layer
		 * @param areas: array of avoid area polygons (OL.Feature.Vector)
		 */
		function addAvoidAreas(areas) {
			var layerAvoid = this.theMap.getLayersByName(this.AVOID)[0];
			if (areas && areas.length > 0) {
				var allFt = [];
				for (var i = 0; i < areas.length; i++) {
					var ft = new OpenLayers.Feature.Vector(areas[i])
					allFt.push(ft);
				}
				layerAvoid.addFeatures(allFt);
			}
			var self = this;
			this.emit('map:avoidAreaChanged', self.getAvoidAreasString());
		}

		/**
		 * gets all avoid area polygons
		 * used for e.g. routing service request
		 * @return avoid areas as array of OL.Feature.Vector
		 */
		function getAvoidAreas() {
			var layerAvoid = this.theMap.getLayersByName(this.AVOID)[0];
			return layerAvoid.features;
		}

		/**
		 * gets all avoid area polygons
		 * used e.g. for permalink
		 * @return avoid areas as string of polygon points; style: 'poly1pt1.y,poly1pt1.x,poly1pt2.x,poly1pt2.y,...'
		 */
		function getAvoidAreasString() {
			var layerAvoid = this.theMap.getLayersByName(this.AVOID)[0];

			//serialize these features to string
			var avAreaString = "";
			for (var avAreas = 0; avAreas < layerAvoid.features.length; avAreas++) {
				var avAreaPoints = layerAvoid.features[avAreas].geometry.components[0].components;
				for (var pt = 0; pt < avAreaPoints.length; pt++) {
					avAreaString += avAreaPoints[pt].x + escape(',') + avAreaPoints[pt].y + escape(',');
				}
				//slice away the last separator ','
				avAreaString = avAreaString.substring(0, avAreaString.length - 3);
				//separator for next avoid area
				avAreaString = avAreaString + escape(';');

			}
			//slice away the last separator ';'
			avAreaString = avAreaString.substring(0, avAreaString.length - 3);
			return avAreaString;
		}

		/*
		* ACCESSIBILITY ANALYSIS
		*/

		/**
		 * adds the given polygon as avoid area polygon to the map layer
		 *  @param polygon: OL.Feature.Vector, the polygon to add
		 */
		function addAccessiblityPolygon(polygon) {
			var layer = this.theMap.getLayersByName(this.ACCESSIBILITY)[0];
			var newFeature = new OpenLayers.Feature.Vector(polygon);
			newFeature.style = {
				'strokeColor' : '#0000ff',
				'fillColor' : '#0000ff',
				'fillOpacity' : 0.4
			};
			layer.addFeatures([newFeature]);
		}

		/**
		 * removes all accessibility analysis features from the layer
		 */
		function eraseAccessibilityFeatures() {
			var layer = this.theMap.getLayersByName(this.ACCESSIBILITY)[0];
			layer.removeAllFeatures();
		}

		/*
		* IMPORT / EXPORT
		*/

		/**
		 * generates a GPX String based on the route
		 * @param {Object} singleRouteLineString: current route as a single OL.Gemoetry.LineString
		 * @return string with encoded route information
		 */
		function writeRouteToString(singleRouteLineString) {
			var formatter = new OpenLayers.Format.GPX();

			var route;
			if (singleRouteLineString) {
				var ft = new OpenLayers.Feature.Vector(singleRouteLineString)
				route = formatter.write([ft]);
				//insert line breaks for nicely readable code
				route = route.replace(/></g, '>\n<');
				//note: doesn't include namespaces in every tag any more
			}
			return route;
		}

		/**
		 * Based on the String with GPX information two waypoints - the start and end of the GPX track - are extracted
		 * @param {Object} routeString: String with GPX track
		 * @return: array of two waypoints of OL.LonLat or null if no adequate data available
		 */
		function parseStringToWaypoints(routeString) {
			var formatter = new OpenLayers.Format.GPX();
			var featureVectors = formatter.read(routeString);
			if (!featureVectors || featureVectors.length == 0) {
				return null;
			}
			var linePoints = featureVectors[0].geometry.components;
			if (linePoints && linePoints.length >= 2) {
				//only proceed if the route contains at least 2 points (which can be interpreted as start and end)
				var startPos = new OpenLayers.LonLat(linePoints[0].x, linePoints[0].y);
				startPos = util.convertPointForMap(startPos);
				var endPos = new OpenLayers.LonLat(linePoints[linePoints.length - 1].x, linePoints[linePoints.length - 1].y);
				endPos = util.convertPointForMap(endPos);
				return [startPos, endPos];
			} else {
				return null;
			}
		}

		/**
		 * Based on the String with GPX information a track (an OL.Geometry.LineString object) is extracted
		 * @param {Object} trackString: String with GPX track
		 * @return array of OL.FeatureVectors (usually only one) containing the track points
		 */
		function parseStringToTrack(trackString) {
			var formatter = new OpenLayers.Format.GPX();
			var trackFeatures = formatter.read(trackString);
			if (!trackFeatures || trackFeatures.length == 0) {
				return null;
			}
			//convert all points
			for (var i = 0; i < trackFeatures.length; i++) {
				var points = trackFeatures[i].geometry.components;
				for (var j = 0; j < points.length; j++) {
					points[j] = util.convertPointForMap(points[j]);
				}
			}
			return trackFeatures;
		}

		/**
		 * add the given track features to the map and zoom to all tracks
		 * @param {Object} trackFeatures: array of OL.FeatureVectors (usually only one) with track points
		 */
		function addTrackToMap(trackFeatures) {
			var layer = this.theMap.getLayersByName(this.TRACK)[0];
			layer.addFeatures(trackFeatures);

			//zoom to track
			var resultBounds = layer.getDataExtent();
			this.theMap.zoomToExtent(resultBounds);
		}

		/*
		* HEIGHT PROFILE
		*/

		/**
		 * extracts coordinates with elevation data (lon, lat, ele)
		 * @param {Object} data string containing the coorinates
		 * @return: array of OL.LonLat.Ele coordinates
		 */
		function parseStringToElevationPoints(data) {
			var results = util.parseStringToDOM(data);
			var ptArray = [];

			var layer = this.theMap.getLayersByName(this.SEARCH)[0];

			var points = util.getElementsByTagNameNS(results, '', 'trkpt');
			$A(points).each(function(pt) {
				var lat = pt.attributes[0].value;
				var lon = pt.attributes[1].value;
				var ele = pt.textContent;

				var pt = new OpenLayers.LonLat.Ele(lon, lat, ele);
				ptArray.push(pt);
			});
			return ptArray;
		}

		/**
		 * shows a hover marker at the given position (and erases all other hover markers)
		 * @param {Object} lon: lon coordinate of the position
		 * @param {Object} lat: lat coordinate of the position
		 */
		function hoverPosition(lon, lat) {
			var layer = this.theMap.getLayersByName(this.HEIGHTS)[0];
			layer.removeAllFeatures();

			var point = util.convertPointForMap(new OpenLayers.LonLat(lon, lat));
			point = new OpenLayers.Geometry.Point(point.lon, point.lat);

			var ft = new OpenLayers.Feature.Vector(point, {
				icon : Ui.markerIcons.unset[0],
				iconEm : Ui.markerIcons.unset[1],
			});
			layer.addFeatures([ft]);
		}


		map.prototype = new EventEmitter();
		map.prototype.constructor = map;

		map.prototype.serializeLayers = serializeLayers;
		map.prototype.restoreLayerPrefs = restoreLayerPrefs;

		map.prototype.clearMarkers = clearMarkers;
		map.prototype.emphMarker = emphMarker;
		map.prototype.convertFeatureIdToPositionString = convertFeatureIdToPositionString;
		map.prototype.getFirstPointIdOfLine = getFirstPointIdOfLine;
		map.prototype.activateSelectControl = activateSelectControl;

		map.prototype.addWaypointMarker = addWaypointMarker;
		map.prototype.addWaypointAtPos = addWaypointAtPos;
		map.prototype.setWaypointType = setWaypointType;
		map.prototype.getWaypointsString = getWaypointsString;

		map.prototype.addGeolocationResultMarker = addGeolocationResultMarker;

		map.prototype.addSearchAddressResultMarkers = addSearchAddressResultMarkers;
		map.prototype.zoomToAddressResults = zoomToAddressResults;

		map.prototype.addSearchPoiResultMarkers = addSearchPoiResultMarkers;
		map.prototype.emphasizeSearchPoiMarker = emphasizeSearchPoiMarker;
		map.prototype.deEmphasizeSearchPoiMarker = deEmphasizeSearchPoiMarker;
		map.prototype.zoomToPoiResults = zoomToPoiResults;

		map.prototype.zoomToMarker = zoomToMarker;
		map.prototype.zoomToFeature = zoomToFeature;

		map.prototype.zoomToRoute = zoomToRoute;
		map.prototype.updateRoute = updateRoute;

		map.prototype.avoidAreaTools = avoidAreaTools;
		map.prototype.checkAvoidAreasIntersectThemselves = checkAvoidAreasIntersectThemselves;
		map.prototype.addAvoidAreas = addAvoidAreas;
		map.prototype.getAvoidAreas = getAvoidAreas;
		map.prototype.getAvoidAreasString = getAvoidAreasString;

		map.prototype.addAccessiblityPolygon = addAccessiblityPolygon;
		map.prototype.eraseAccessibilityFeatures = eraseAccessibilityFeatures;

		map.prototype.writeRouteToString = writeRouteToString;
		map.prototype.parseStringToWaypoints = parseStringToWaypoints;
		map.prototype.parseStringToTrack = parseStringToTrack;
		map.prototype.addTrackToMap = addTrackToMap;

		map.prototype.parseStringToElevationPoints = parseStringToElevationPoints;
		map.prototype.hoverPosition = hoverPosition;

		return map;
	}());
/* ======================================================================
    control.js
   ====================================================================== */

var Controller = ( function(w) {'use strict';

		var $ = w.jQuery, ui = w.Ui, uiVersions = w.Versions, uiLanguages = w.Languages, waypoint = w.Waypoint, geolocator = w.Geolocator, searchAddress = w.SearchAddress, searchPoi = w.SearchPoi, route = w.Route, analyse = w.AccessibilityAnalysis, preferences = w.Preferences, openRouteService = w.OpenRouteService, Map = w.Map,
		//the map
		map;

		function Controller() {
			//path to the proxy-script as workaround for JavaScript security errors
			OpenLayers.ProxyHost = "/cgi-bin/proxy.cgi?url=";

			//IE does not know console...
			if (!window.console) {
				window.console = {};
				window.console.log = function() {
				};
			}
		}

		/* *********************************************************************
		* GENERAL
		* *********************************************************************/

		/**
		 *called when sidebar toggles and the map area is resized
		 */
		function handleMapUpdate() {
			map.theMap.updateSize();
		}

		/* *********************************************************************
		* WAYPOINTS
		* *********************************************************************/

		/**
		 * parses the user input for the waypoint search and calls the Waypoint module to build a search request
		 * @param atts: query: the search query; wpIndex: index of the waypoint; searchIds: map feature ids of previous searches
		 */
		function handleWaypointRequest(atts) {
			ui.searchWaypointChangeToSearchingState(true, atts.wpIndex);
			var lastSearchResults = atts.searchIds;
			lastSearchResults = lastSearchResults ? lastSearchResults.split(' ') : null;

			if (lastSearchResults) {
				map.clearMarkers(map.SEARCH, lastSearchResults);
			}

			waypoint.incrRequestCounterWaypoint(atts.wpIndex);
			waypoint.find(atts.query, handleSearchWaypointResults, handleSearchWaypointFailure, atts.wpIndex, preferences.language);
		}

		/**
		 * forwards the waypoint search results to the Ui to display the addresses and to the map in order to add markers.
		 * @param results: results of the search query in XML format
		 * @param wpIndex: index of the waypoint
		 */
		function handleSearchWaypointResults(results, wpIndex) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			results = results.responseXML ? results.responseXML : util.parseStringToDOM(results.responseText);

			//when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
			var responseError = util.getElementsByTagNameNS(results, namespaces.xls, 'ErrorList').length;
			if (parseInt(responseError) > 0) {
				//service response contains an error, switch to error handling function
				handleSearchWaypointFailure(wpIndex);
			} else {

				waypoint.decrRequestCounterWaypoint(wpIndex);
				if (waypoint.getRequestCounterWaypoint(wpIndex) == 0) {
					var listOfPoints = waypoint.parseResultsToPoints(results, wpIndex);

					ui.searchWaypointChangeToSearchingState(false, wpIndex);

					var listOfFeatures = map.addSearchAddressResultMarkers(listOfPoints, wpIndex);
					ui.updateSearchWaypointResultList(results, listOfFeatures, map.SEARCH, wpIndex);
				}
			}
		}

		/**
		 * calls the UI to show a search error
		 * @param: wpIndex: index of the waypoint
		 */
		function handleSearchWaypointFailure(wpIndex) {
			waypoint.decrRequestCounterWaypoint(wpIndex);
			if (waypoint.getRequestCounterWaypoint(wpIndex) == 0) {
				ui.searchWaypointChangeToSearchingState(false, wpIndex);
				ui.showSearchWaypointError();
			}
		}

		/**
		 * the user selects one of the search results as new waypoint. The corresponding map feature is set, other search results are removed. Ui and internal variables are updated.
		 * @param atts: wpIndex: index of the waypoint; featureId: map feature id of the selected marker; searchIds: string of all search features for this search
		 */
		function handleWaypointResultClick(atts) {
			var wpIndex = atts.wpIndex;
			var featureId = atts.featureId;
			var searchIds = atts.searchIds;
			if (searchIds) {
				searchIds = searchIds.split(' ');
			}

			var type = selectWaypointType(wpIndex);
			var waypointResultId = map.addWaypointMarker(wpIndex, featureId, type);
			map.clearMarkers(map.SEARCH, searchIds);

			waypoint.setWaypoint(wpIndex, true);

			handleRoutePresent();

			var position = map.convertFeatureIdToPositionString(waypointResultId, map.ROUTE_POINTS);
			ui.setWaypointFeatureId(wpIndex, waypointResultId, position, map.ROUTE_POINTS);

			//update preferences
			handleWaypointChanged(map.getWaypointsString());
		}

		/**
		 * the user clicks on a field to add a new empty waypoint. Internal variables and waypoint attributes are updated
		 * @param: newWaypointIndex: index which is assigned to the new waypoint
		 */
		function handleAddWaypoint(newWaypointIndex) {
			waypoint.addWaypoint(newWaypointIndex);

			//re-calculate type of last (now next-to-last) waypoint
			var index = waypoint.getNumWaypoints() - 2;
			var type = waypoint.determineWaypointType(index);
			ui.setWaypointType(index, type);

			var featureId = ui.getFeatureIdOfWaypoint(index);
			var newId = map.setWaypointType(featureId, type);
			var position = map.convertFeatureIdToPositionString(newId, map.ROUTE_POINTS);
			ui.setWaypointFeatureId(index, newId, position, map.ROUTE_POINTS);
		}

		/**
		 * mark the given waypoint either as start, via or end according to the waypoint's position in the route
		 * @param wpIndex: index of the waypoint
		 */
		function selectWaypointType(wpIndex) {
			var type = waypoint.determineWaypointType(wpIndex);
			ui.setWaypointType(wpIndex, type);
			return type;
		}

		/**
		 * the user sets a waypoint by clicking on the map saying "add waypoint...". The waypoint is displayed on Ui and on the map, internal variables are updated and the address of the waypoint is looked up.
		 * @param atts: pos: position of the new waypoint, type: type of the waypoint
		 */
		function handleAddWaypointByRightclick(atts) {
			var pos = atts.pos;
			var wpType = atts.type;
			var featureId;

			//index of the waypoint to set (start at the beginning, end at the end, via in the middle)
			var wpIndex = 0;
			//if END: use index of last waypoint
			wpIndex = wpType == Waypoint.type.END ? waypoint.getNumWaypoints() - 1 : wpIndex;
			//if VIA: use index of prior to last waypoint, insert the new via point after this element
			wpIndex = wpType == Waypoint.type.VIA ? waypoint.getNumWaypoints() - 2 : wpIndex;

			//in case of a newly added VIA, the additional waypoint is added in ui.addWaypintAfter(...)
			if (wpType == Waypoint.type.VIA) {
				ui.addWaypointAfter(wpIndex, waypoint.getNumWaypoints());
				wpIndex++;
				//adding a waypoint internally is not necessary. this is done via the call in ui.addWaypointAfter(...).
			}

			ui.showSearchingAtWaypoint(wpIndex, true);

			//remove old waypoint marker (if exists)
			featureId = ui.getFeatureIdOfWaypoint(wpIndex);
			if (featureId) {
				//address has been set yet
				map.clearMarkers(map.ROUTE_POINTS, [featureId]);
			}

			//add the new marker
			var newFeatureId = map.addWaypointAtPos(util.convertPointForMap(pos), wpIndex, wpType);

			geolocator.reverseGeolocate(pos, reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, wpType, wpIndex, newFeatureId);
		}

		/**
		 * handles the results of the reverse geolocation service call by showing/removing features on the map, calling the Ui,...
		 * @param addressResult: result of the service request in XML format
		 * @param wpType: type of the waypoint
		 * @param wpIndex: index of the waypoint
		 * @param featureId: id of the map feature
		 * @param addWaypointAt: index where to add the waypoint
		 */
		function reverseGeocodeSuccess(addressResult, wpType, wpIndex, featureId, addWaypointAt) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var addressResult = addressResult.responseXML ? addressResult.responseXML : util.parseStringToDOM(addressResult.responseText);

			//when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
			var responseError = util.getElementsByTagNameNS(addressResult, namespaces.xls, 'ErrorList').length;
			if (parseInt(responseError) > 0) {
				//service response contains an error, switch to error handling function
				reverseGeocodeFailure(wpIndex);
			} else {

				//adapt the waypoint internals:
				if (addWaypointAt && addWaypointAt >= 0) {
					ui.addWaypointAfter(addWaypointAt - 1, waypoint.getNumWaypoints());
					waypoint.setWaypoint(addWaypointAt, true);

				}
				waypoint.setWaypoint(wpIndex, true);

				ui.showSearchingAtWaypoint(wpIndex, false);
				var newIndex = ui.addWaypointResultByRightclick(addressResult, wpType, wpIndex);
				var position = map.convertFeatureIdToPositionString(featureId, map.ROUTE_POINTS);
				ui.setWaypointFeatureId(newIndex, featureId, position, map.ROUTE_POINTS);

				//do we need to re-calculate the route?
				handleRoutePresent();

				//update preferences
				handleWaypointChanged(map.getWaypointsString());

				//cannot be emmited by 'this', so let's use sth that is known inside the callback...
				ui.emit('control:reverseGeocodeCompleted');
			}
		}

		/**
		 * error handling for the reverse geocode service request
		 * @param wpIndex: index of the waypoint
		 */
		function reverseGeocodeFailure(wpIndex) {
			ui.showSearchingAtWaypoint(wpIndex, false);
		}

		/**
		 * after waypoints have been moved, re-calculations are necessary: update of internal variables, waypoint type exchange,...
		 */
		function handleMovedWaypoints(atts) {
			var index1 = atts.id1;
			var index2 = atts.id2;

			//waypoint-internal:
			var set1 = waypoint.getWaypointSet(index1);
			var set2 = waypoint.getWaypointSet(index2);
			waypoint.setWaypoint(index1, set2);
			waypoint.setWaypoint(index2, set1);

			// map.switchMarkers(index1, index2);

			var type = selectWaypointType(index1);
			var ftId = ui.getFeatureIdOfWaypoint(index1);
			var newFtId = map.setWaypointType(ftId, type);
			var position = map.convertFeatureIdToPositionString(newFtId, map.ROUTE_POINTS);
			ui.setWaypointFeatureId(index1, newFtId, position, map.ROUTE_POINTS);

			var type = selectWaypointType(index2);
			var ftId = ui.getFeatureIdOfWaypoint(index2);
			newFtId = map.setWaypointType(ftId, type);
			var position = map.convertFeatureIdToPositionString(newFtId, map.ROUTE_POINTS);
			ui.setWaypointFeatureId(index2, newFtId, position, map.ROUTE_POINTS);

			//update preferences
			handleWaypointChanged(map.getWaypointsString());
		}

		/**
		 * the user removed a waypoint. Internal variables are updated, waypoint types checked,...
		 * @param atts: wpIndex: index of the waypoint, featureId: id of the map feature of the waypoint
		 */
		function handleRemoveWaypoint(atts) {
			var idx = atts.wpIndex;
			var featureId = atts.featureId;

			//remove map feature of deleted wayoint
			map.clearMarkers(map.ROUTE_POINTS, [featureId]);

			if (waypoint.getNumWaypoints() > 2) {
				waypoint.removeWaypoint(idx);
			} else {
				waypoint.setWaypoint(idx, false);
			}
			handleRoutePresent();

			//re-calculate the waypoint types
			for (var i = 0; i < waypoint.getNumWaypoints(); i++) {
				var type = waypoint.determineWaypointType(i);
				ui.setWaypointType(i, type);

				featureId = ui.getFeatureIdOfWaypoint(i);
				var newId = map.setWaypointType(featureId, type);
				var position = map.convertFeatureIdToPositionString(newId, map.ROUTE_POINTS);
				ui.setWaypointFeatureId(i, newId, position, map.ROUTE_POINTS);
			}

			//decide about which buttons to show
			if (idx > 0) {
				//look at previous waypoint. If this is the last waypoint, do not show the move down button
				if ((idx - 1) == (waypoint.getNumWaypoints() - 1)) {
					ui.setMoveDownButton(idx - 1, false);
					ui.setMoveUpButton(idx - 1, true);
				}
			}
			if (idx < (waypoint.getNumWaypoints() - 1)) {
				//look at the next waypoint. If this is the first waypoint, do not show the move up button
				//because we removed one waypoint, the successor will have now an ID of idx
				if (idx == 0) {
					ui.setMoveDownButton(idx, true);
					ui.setMoveUpButton(idx, false);
				}
			}

			//update preferences
			handleWaypointChanged(map.getWaypointsString());
		}

		/**
		 * the user wants to set an existing waypoint at a different location and re-enables the search field by clicking on "search again".
		 * old map features are removed, internal variables are updated
		 * @param atts: waypointFeature: map feature of the waypoint; waypointLayer: layer the map feature is located on, wpIndex: index of the waypoint
		 */
		function handleSearchAgainWaypoint(atts) {
			var waypointFeature = atts.waypointFeature;
			var waypointLayer = atts.waypointLayer;
			var wpIndex = atts.wpIndex;

			//remove the waypoint marker
			map.clearMarkers(waypointLayer, [waypointFeature]);

			//to re-view the search results of the waypoint search, the whole thing is re-calculated using existant functions

			//waypoint-internal
			waypoint.setWaypoint(wpIndex, false);

			//update preferences
			handleWaypointChanged(map.getWaypointsString());
		}

		/**
		 * the whole route and its waypoints are removed. Internal variables are updated
		 */
		function handleResetRoute() {
			//remove all waypoint markers
			map.clearMarkers(map.ROUTE_POINTS);

			for (var i = 0; i < waypoint.getNumWaypoints(); i++) {
				waypoint.removeWaypoint(i);
			}

			handleRoutePresent();

			//update preferences
			handleWaypointChanged(null);
		}

		/**
		 * is called when one or more waypoints have changed. Updates internal variables (preferences).
		 * @param waypointStringList: string containing all waypoints
		 */
		function handleWaypointChanged(waypointStringList) {
			handlePrefsChanged({
				key : preferences.waypointIdx,
				value : waypointStringList
			});
			
			handleRoutePresent();
		}

		/**
		 * map is zoomed to the selected part of the route (route instruction)
		 * @param vectorId: id of the map feature to zoom to
		 */
		function handleZoomToRouteInstruction(vectorId) {
			map.zoomToFeature(map.ROUTE_LINES, vectorId);
		}

		/* *********************************************************************
		* GEOLOCATION
		* *********************************************************************/

		/**
		 * call the geolocation service to retrieve the user's current location
		 */
		function handleGeolocationRequest() {
			ui.showGeolocationSearching(true);
			ui.showGeolocationError(false);
			geolocator.locate(handleGeolocateSuccess, handleGeolocateError, handleGeolocateNoSupport, preferences.language);
		}

		/**
		 * handles the result of the geolocation service by adding a map feature at the result location
		 * @param position: service result containing the result location
		 */
		function handleGeolocateSuccess(position) {
			var pos = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude);

			//add marker at current position
			var feature = map.addGeolocationResultMarker(pos);

			//show current position as address in the Ui pane
			geolocator.reverseGeolocate(pos, handleReverseGeolocationSuccess, handleGeolocateError, preferences.language, null, null, feature);
		}

		/**
		 * handles a runtime error during geolocation
		 */
		function handleGeolocateError() {
			ui.showGeolocationError(true, false);
			ui.showGeolocationSearching(false);
		}

		/**
		 * shows a message if the geolocation is not supported by the user's browser
		 */
		function handleGeolocateNoSupport() {
			ui.showGeolocationError(true, true);
			ui.showGeolocationSearching(false);
		}

		/**
		 * shows the reverse-geocoded position as address in the Ui;
		 * parameters nn0 and nn1 are not relevant here (only used in waypoint geocoding)
		 * @param result: service response in XML format
		 * @param nn0, nn1: arbitrary
		 * @param feature: map feature at the position the address was retrieved for
		 */
		function handleReverseGeolocationSuccess(result, nn0, nn1, feature) {
			ui.showGeolocationSearching(false);
			ui.showCurrentLocation(result, feature.id, map.GEOLOCATION, feature.geometry);
		}

		/* *********************************************************************
		* SEARCH ADDRESS
		* *********************************************************************/

		/**
		 * parses the user input for the address search and calls the SearchAddress module to build a search request
		 * @param atts: address: address as text string the user wants to search for; lastSearchResults: string of OL feature ids for the last search results
		 */
		function handleSearchAddressRequest(atts) {
			var address = atts.address;
			var lastSearchResults = atts.lastSearchResults;
			lastSearchResults = lastSearchResults ? lastSearchResults.split(' ') : null;

			ui.searchAddressChangeToSearchingState(true);

			if (lastSearchResults) {
				map.clearMarkers(map.SEARCH, lastSearchResults);
			}

			searchAddress.requestCounter++;
			searchAddress.find(address, handleSearchAddressResults, handleSearchAddressFailure, preferences.language);
		}

		/**
		 * forwards the address search results to the Ui to display the addresses and to the map in order to add markers.
		 * @param results: XML results of the address search
		 */
		function handleSearchAddressResults(results) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			results = results.responseXML ? results.responseXML : util.parseStringToDOM(results.responseText);

			//when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
			var responseError = util.getElementsByTagNameNS(results, namespaces.xls, 'ErrorList').length;
			if (parseInt(responseError) > 0) {
				//service response contains an error, switch to error handling function
				handleSearchAddressFailure();
			} else {

				searchAddress.requestCounter--;
				if (searchAddress.requestCounter == 0) {
					var listOfPoints = searchAddress.parseResultsToPoints(results);

					ui.searchAddressChangeToSearchingState(false);

					var listOfFeatures = map.addSearchAddressResultMarkers(listOfPoints);
					ui.updateSearchAddressResultList(results, listOfFeatures, map.SEARCH);
				}
			}
		}

		/**
		 * calls the UI to show a address search error
		 */
		function handleSearchAddressFailure() {
			searchAddress.requestCounter--;
			if (searchAddress.requestCounter == 0) {
				ui.searchAddressChangeToSearchingState(false);
				ui.showSearchAddressError();
			}
		}

		/**
		 * removes old address features from the map when starting a new address search
		 */
		function handleClearSearchAddressMarkers() {
			map.clearMarkers(map.SEARCH);
		}

		/**
		 * moves and zooms the map so that all address search result map features become visible
		 */
		function handleZoomToAddressResults() {
			map.zoomToAddressResults();
		}

		/* *********************************************************************
		* SEARCH POI
		* *********************************************************************/

		/**
		 * checks if the given distance is suitable for POI search near route
		 * maximum distance supported by the service is 5000 meters.
		 * @param atts: dist: distance as string; unit: distance unit as string
		 */
		function handleCheckDistanceToRoute(atts) {
			var dist = util.convertDistToMeters(parseInt(atts.dist), atts.unit);
			ui.showSearchPoiDistUnitError(dist > 5000);
		}

		/**
		 * parses the user input for the POI search and calls the SearchPoi module to build a search request
		 * @param atts: query: the POI search query as string; nearRoute: true if a POI search along a given route should be performed; maxDist: maximum distance for POIs off the route; lastSearchResults: list of OL map feature ids of the last search
		 */
		function handleSearchPoiRequest(atts) {
			var poi = atts.query;
			var searchNearRoute = atts.nearRoute;
			var maxDist = atts.maxDist;
			var distanceUnit = atts.distUnit;
			var lastSearchResults = atts.lastSearchResults;
			lastSearchResults = lastSearchResults ? lastSearchResults.split(' ') : null;

			ui.searchPoiChangeToSearchingState(true);

			if (lastSearchResults) {
				map.clearMarkers(map.POI, lastSearchResults);
			}

			var refPoint = null;
			if (searchNearRoute == true) {
				//use route points
				var refPoint = (map.theMap.getLayersByName(map.ROUTE_LINES)[0]).features;
				if (refPoint && refPoint[0]) {
					refPoint = (refPoint[0]).geometry.components;
				}
			} else {
				//pick center of map
				var pt = map.theMap.getCenter();
				pt = pt.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
				refPoint = [];
				refPoint.push(pt);

				//this value is measured in meters only
				var width = map.theMap.calculateBounds().getWidth();
				var height = map.theMap.calculateBounds().getHeight();
				maxDist = width < height ? width : height;
				maxDist /= 2;
			}

			searchPoi.requestCounter++;
			searchPoi.find(poi, refPoint, maxDist, distanceUnit, handleSearchPoiResults, handleSearchPoiFailure, preferences.language);
		}

		/**
		 * forwards the POI search results to the Ui to display the POIs and to the map in order to add markers.
		 * @param results: XML search results
		 */
		function handleSearchPoiResults(results) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			results = results.responseXML ? results.responseXML : util.parseStringToDOM(results.responseText);

			//when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
			var responseError = util.getElementsByTagNameNS(results, namespaces.xls, 'ErrorList').length;
			if (parseInt(responseError) > 0) {
				//service response contains an error, switch to error handling function
				handleSearchPoiFailure();
			} else {

				searchPoi.requestCounter--;
				if (searchPoi.requestCounter == 0) {

					var listOfPoints = searchPoi.parseResultsToPoints(results);

					ui.searchPoiChangeToSearchingState(false);

					var listOfFeatures = map.addSearchPoiResultMarkers(listOfPoints);
					ui.updateSearchPoiResultList(results, listOfFeatures, map.POI);
				}
			}
		}

		/**
		 * calls the UI to show a POI search error
		 */
		function handleSearchPoiFailure() {
			searchPoi.requestCounter--;
			if (searchPoi.requestCounter == 0) {
				ui.searchPoiChangeToSearchingState(false);
				ui.showSearchPoiError();
			}
		}

		/**
		 * removes old POI map features from the map when starting a new POI search
		 */
		function handleClearSearchPoiMarkers() {
			map.clearMarkers(map.POI);
		}

		/**
		 * moves and zooms the map so that all POI search results become visible
		 */
		function handleZoomToPoiResults() {
			map.zoomToPoiResults();
		}

		/**
		 * moves and zooms the map to the given/ clicked POI marker
		 * @param atts: position: position of the map feature as string, layer: map layer the feature is located on
		 */
		function handleZoomToMarker(atts) {
			var position = util.convertPositionStringToLonLat(atts.position);
			var layer = atts.layer;

			var zoom;
			if (layer == map.POI) {
				zoom = 17;
			} else {
				zoom = 14;
			}
			map.zoomToMarker(position, zoom);
		}

		/**
		 * adds a search result (address, POI) as a waypoint to the current route
		 * @param position: the position of the feature to use
		 */
		function handleUseAsWaypoint(position) {
			if ('string' == typeof position) {
				position = util.convertPositionStringToLonLat(position);
			}

			//use the next unset waypoint for the new waypoint (append one if no unset wp exists) (some lines below)
			var index = waypoint.getNextUnsetWaypoint();

			var type;
			if (index == 0) {
				type = waypoint.type.START;
			} else if (index >= 0 && index < waypoint.getNumWaypoints() - 1) {
				type = waypoint.type.VIA;
			} else {
				type = waypoint.type.END;
			}

			var addWp = -1;
			if (index < 0) {
				//no unset wayoint left -> add a new one (as END)
				// waypoint.addWaypoint(); <- this is called by ui.AddWaypointAfter(...), not necessary here.
				addWp = waypoint.getNumWaypoints();
				index = addWp;
			}

			//use position to add the waypoint
			var featureId = map.addWaypointAtPos(position, index, type);
			geolocator.reverseGeolocate(util.convertPointForDisplay(position), reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, type, index, featureId, addWp);

			//markers of the search results will not be removed cause the search is still visible.
		}

		/**
		 * after a waypoint has been moved on the map, the address of the moved waypoint is updated (as well as other internal stuff)
		 * @param featureMoved: the map feature that has been moved
		 */
		function handleWaypointMoved(featureMoved) {
			var position = new OpenLayers.LonLat(featureMoved.geometry.x, featureMoved.geometry.y);
			var index = ui.getWaypiontIndexByFeatureId(featureMoved.id);
			var type = waypoint.determineWaypointType(index);
			geolocator.reverseGeolocate(util.convertPointForDisplay(position), reverseGeocodeSuccess, reverseGeocodeFailure, preferences.language, type, index, featureMoved.id, -1);
			ui.invalidateWaypointSearch(index);

			//update preferences
			handleWaypointChanged(map.getWaypointsString());
		}

		/* *********************************************************************
		* ROUTE
		* *********************************************************************/

		/**
		 * checks if a route can be calculated and displayed (if least two waypoints are set)
		 * if >= 2 wp: requests the route and associated information
		 * else: hides route information
		 */
		function handleRoutePresent() {
			var isRoutePresent = waypoint.getNumWaypointsSet() >= 2;

			if (isRoutePresent) {
				ui.startRouteCalculation();

				var routePoints = ui.getRoutePoints();
				for (var i = 0; i < routePoints.length; i++) {
					routePoints[i] = routePoints[i].split(' ');
					if (routePoints[i].length == 2) {
						routePoints[i] = new OpenLayers.LonLat(routePoints[i][0], routePoints[i][1]);
						routePoints[i] = util.convertPointForDisplay(routePoints[i]);
					}
				}

				var prefs = ui.getRoutePreferences();
				var routePref = prefs[0];
				var avoidHighway = prefs[1][0];
				var avoidTollway = prefs[1][1];
				var avoidAreas = map.getAvoidAreas();

				route.calculate(routePoints, routeCalculationSuccess, routeCalculationError, preferences.routingLanguage, routePref, avoidHighway, avoidTollway, avoidAreas);
			} else {
				//internal
				route.routePresent = false;
				ui.setRouteIsPresent(false);
				//add features to map
				map.updateRoute();
				//add DOM elements
				ui.updateRouteSummary();
				ui.updateRouteInstructions();
			}
		}

		/**
		 * processes route results: triggers displaying the route on the map, showing instructions and a summary
		 * @param results: XML route service results
		 */
		function routeCalculationSuccess(results) {
			route.routePresent = true;
			ui.setRouteIsPresent(true);

			results = results.responseXML ? results.responseXML : util.parseStringToDOM(results.responseText);

			//when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
			var responseError = util.getElementsByTagNameNS(results, namespaces.xls, 'ErrorList').length;
			if (parseInt(responseError) > 0) {
				//service response contains an error, switch to error handling function
				routeCalculationError();
			} else {
				//use all-in-one-LineString to save the whole route in a single string
				var routeLineString = route.writeRouteToSingleLineString(results);
				var routeString = map.writeRouteToString(routeLineString);
				route.routeString = routeString;

				// each route instruction has a part of this lineString as geometry for this instruction
				var routeLines = route.parseResultsToLineStrings(results, util.convertPointForMap);
				var routePoints = route.parseResultsToCornerPoints(results, util.convertPointForMap);
				var featureIds = map.updateRoute(routeLines, routePoints);

				var errors = route.hasRoutingErrors(results);

				if (!errors) {
					ui.updateRouteSummary(results);

					ui.updateRouteInstructions(results, featureIds, map.ROUTE_LINES);
					ui.endRouteCalculation();

					map.zoomToRoute();
				} else {
					routeCalculationError();
				}
			}
		}

		/**
		 * shows a route calculation error; hides route information
		 */
		function routeCalculationError() {
			ui.endRouteCalculation();
			ui.showRoutingError();
			ui.hideRouteSummary();
			ui.hideRouteInstructions();
			map.updateRoute();
		}

		/**
		 * moves and zooms the map so that the whole route becomes visible
		 */
		function handleZoomToRoute() {
			map.zoomToRoute();
		}

		/**
		 * a tool for handling avoid areas has been selected/ deactivated.
		 * If the avoid area tools are active, all selectFeature-controls of the map layers have to be deactivated (otherwise these layers always stay on top and prevent the user from modifying his avoidAreas)
		 * Delegate the tool call to the map object.
		 * @param atts: toolType: either drawing, moving or deleting avoid areas ; activated: true, if the feature should be activated; false otherwise
		 */
		var activeAvoidAreaButtons = 0;
		function avoidAreaToolClicked(atts) {
			var toolTpye = atts.toolType;
			var activated = atts.activated;

			//if at least one button is active, the selectFeature control has to be deactivated
			if (activated) {
				activeAvoidAreaButtons++;
			} else {
				activeAvoidAreaButtons--;
			}
			if (activeAvoidAreaButtons > 0) {
				map.activateSelectControl(false);
			} else {
				map.activateSelectControl(true);
			}
			//actual avoid area handling is done in the map object
			map.avoidAreaTools(toolTpye, activated);
		}

		/**
		 * if avoid areas intersect themselves they are invalid and no route calculation can be done. Inform the user by showing an error message in the UI
		 * @param errorous: true, if the error message should be shown; false if it should be hidden
		 */
		function avoidAreasError(errorous) {
			ui.showAvoidAreasError(errorous);
		}

		/**
		 * updates internal preference variables after an avoid area change
		 * @param avoidAreaString: string of avoid area polygon points
		 */
		function handleAvoidAreaChanged(avoidAreaString) {
			handlePrefsChanged({
				key : preferences.avoidAreasIdx,
				value : avoidAreaString
			});
		}

		/* *********************************************************************
		* ACCESSIBILITY ANALYSIS
		* *********************************************************************/

		/**
		 * requests the accessibility analysis based on the start waypoint
		 * @param atts: position: position of the start waypoint; distance: distance for the accessibility analysis in minutes
		 */
		function handleAnalyzeAccessibility(atts) {
			var pos = atts.position;
			if (pos) {
				//assuming we have a position set...
				pos = util.convertPositionStringToLonLat(pos);
				pos = util.convertPointForDisplay(pos);
				var dist = atts.distance;

				ui.showAccessibilityError(false);
				ui.showSearchingAtAccessibility(true);

				map.eraseAccessibilityFeatures();

				analyse.analyze(pos, dist, accessibilitySuccessCallback, accessibilityFailureCallback);
			} else {
				//no position, no analyse!
				ui.showAccessibilityError(true);
			}

		}

		/**
		 * processes the accessibility analsysis response;  map zooms to the resulting area, area is shown on the map
		 * @param result: XML response from the service
		 */
		function accessibilitySuccessCallback(result) {
			result = result.responseXML ? result.responseXML : util.parseStringToDOM(result.responseText);

			//when the service gives response but contains an error the response is handeled as success, not error. We have to check for an error tag here:
			var responseError = util.getElementsByTagNameNS(result, namespaces.xls, 'ErrorList').length;
			if (parseInt(responseError) > 0) {
				//service response contains an error
				accessibilityFailureCallback();
			} else {
				var bounds = analyse.parseResultsToBounds(result);
				if (bounds) {
					map.theMap.zoomToExtent(bounds, true);
					var polygon = analyse.parseResultsToPolygon(result);
					map.addAccessiblityPolygon(polygon);

					ui.showSearchingAtAccessibility(false);
				} else {
					accessibilityFailureCallback();
				}
			}
		}

		/**
		 * processes the accessibility error response and displays an error
		 */
		function accessibilityFailureCallback() {
			ui.showAccessibilityError(true);
		}

		/**
		 * removes the accessibility map features
		 */
		function handleRemoveAccessibility() {
			map.clearMarkers(map.ACCESSIBILITY);
		}

		/* *********************************************************************
		* EXPORT / IMPORT
		* *********************************************************************/

		/**
		 * extracts route information and displays the track in a new window formatted as GPX
		 */
		function handleExportRoute() {
			ui.showExportRouteError(false);

			var routeString = route.routeString;
			if (routeString) {
				//writing String to File seems not possible. We open a window with the content instead.
				w = window.open('about:blank', '_blank', 'height=300,width=400');
				w.document.write('<xmp>' + routeString + '</xmp>');
			} else {
				//error, route does not exist. Nothing can be exported
				ui.showExportRouteError(true);
			}
		}

		/**
		 * uploads start and end point from a GPX file and calculates the route between these points
		 * required HTML5 file api
		 * @param file: the GPX file to upload
		 */
		var wp2;
		function handleUuploadRoute(file) {
			ui.showImportRouteError(false);
			if (file) {
				if (!window.FileReader) {
					// File APIs are not supported, e.g. IE
					ui.showImportRouteError(true);
				} else {
					var r = new FileReader();
					r.readAsText(file);

					r.onload = function(e) {
						var data = e.target.result;
						//remove gpx: tags; Firefox cannot cope with that.
						data = data.replace(/gpx:/g, '');
						var wps = map.parseStringToWaypoints(data);

						//add waypoints to route
						if (wps && wps.length == 2) {
							handleUseAsWaypoint(wps[0]);
							wp2 = wps[1];
							//the 2nd point cannot be appended immediately. we have to wait for the reverse geocoding request to be finished (and all other stuff executed in the callback function)
						} else {
							ui.showImportRouteError(true);
						}
					};
				}
			} else {
				ui.showImportRouteError(true);
			}
		}

		/**
		 * extracts the 2nd waypoint from the GPX file
		 */
		function uploadRouteTrigger2ndWaypoint() {
			if (wp2 != null) {
				handleUseAsWaypoint(wp2);
				//prevent infinite loop
				wp2 = null;
			}
		}

		/**
		 * uploads the track GPX file and displays it on the map. NO route re-calculation!
		 * required HTML5 file api
		 * @param file: the GPX file to upload
		 */
		function handleUploadTrack(file) {
			ui.showImportRouteError(false);
			//clean old track from map (at the moment only one track is supported)
			map.clearMarkers(map.TRACK);
			if (file) {
				if (!window.FileReader) {
					// File APIs are not supported, e.g. IE
					ui.showImportRouteError(true);
				} else {
					var r = new FileReader();
					r.readAsText(file);

					r.onload = function(e) {
						var data = e.target.result;
						//remove gpx: tags; Firefox cannot cope with that.
						data = data.replace(/gpx:/g, '');

						var track = map.parseStringToTrack(data);
						if (!track) {
							ui.showImportRouteError(true);
						} else {
							//add features to map
							map.addTrackToMap(track);
						}
					};
				}
			} else {
				ui.showImportRouteError(true);
			}
		}

		/**
		 * removes an uploaded track from the map
		 */
		function handleRemoveTrack() {
			map.clearMarkers(map.TRACK);
		}

		/* *********************************************************************
		* HEIGHT PROFILE
		* *********************************************************************/

		/**
		 * extracts information from the given file and shows the height profile
		 * @param file: the file with elevation information
		 */
		function handleUploadHeightProfile(file) {
			if (file) {
				if (!window.FileReader) {
					// File APIs are not supported, e.g. IE
					//todo: show error
				} else {
					var r = new FileReader();
					r.readAsText(file);

					r.onload = function(e) {
						var data = e.target.result;
						var eleArray = map.parseStringToElevationPoints(data);

						ui.showHeightProfile(eleArray);
					};
				}
			} else {
				//todo: show error
			}
		}

		/**
		 * hovers the correspoinding position on the map/ the height profile
		 * @param atts: lon: lon coordinate, lat: lat coordinate
		 */
		function handleHeightProfileHover(atts) {
			map.hoverPosition(atts.lon, atts.lat);
		}

		/* *********************************************************************
		* MAP
		* *********************************************************************/

		/**
		 * triggers an update of the cookies when the map changed
		 * @param mapState: lon: lon-coordinate of the current position; lat: lat-coordinate; zoom: current zoom level; layer: active layer (and overlays)
		 */
		function handleMapChanged(mapState) {
			//update cookies
			updateMapCookies(mapState.lon, mapState.lat, mapState.zoom, mapState.layer);
		}

		/**
		 * highlights the correspoinding Ui element based on the given map feature/ marker, e.g. the corresponding POI description
		 * @param markerId: OL feature id to highlight
		 */
		function handleMarkerEmph(markerId) {
			ui.emphElement(markerId);
		}

		/**
		 * un-highlights the correspoinding Ui element based on the given map feature/ marker, e.g. the corresponding POI description
		 * @param markerId: OL feature id to deemphasize
		 */
		function handleMarkerDeEmph(markerId) {
			ui.deEmphElement(markerId);
		}

		/**
		 * highlights the corresponding map feature based on the given Ui element, e.g. the corresponding POI marker
		 * @param atts: id: OL feature id of the element; layer: map layer the feature is located on
		 */
		function handleElementEmph(atts) {
			var id = atts.id;
			var layer = atts.layer;

			//tell map to emph the element
			map.emphMarker(layer, id, true);
		}

		/**
		 * un-highlights the corresponding map feature based on the given Ui element, e.g. the corresponding POI marker
		 * @param atts: id: OL feature id of the element; layer: map layer the feature is located on
		 */
		function handleElementDeEmph(atts) {
			var id = atts.id;
			var layer = atts.layer;

			//tell map to de-emph the element
			map.emphMarker(layer, id, false);
		}

		/* *********************************************************************
		* PREFERENCES, PERMALINK AND COOKIES
		* *********************************************************************/

		/**
		 * updates internal preferences (language, distance unit, ...)
		 * @param atts: key: id of the variable name; value: value that should be assigned to that variable
		 */
		function handlePrefsChanged(atts) {
			var key = atts.key;
			var value = atts.value;
			preferences.updatePreferences(key, value);
		}

		/**
		 * the user changed preferences in the option panel and wants to save the changes
		 * @param atts: version: site version; language: site language; routingLanguage: language of routing instructions; distanceUnit: distance unit like m/km or yd/mi
		 */
		function updateUserPreferences(atts) {
			if (preferences.version == atts.version && preferences.language == atts.language && preferences.routingLanguage == atts.routingLanguage && preferences.distanceUnit == atts.distanceUnit) {
				//nothing changed...
			} else {
				updateCookies(preferences.versionIdx, atts.version);
				updateCookies(preferences.languageIdx, atts.language);
				updateCookies(preferences.routingLanguageIdx, atts.routingLanguage);
				updateCookies(preferences.distanceUnitIdx, atts.distanceUnit);

				//reload page to apply changed preferences (e.g. other site language)
				preferences.reloadWithPerma();
			}
		}

		function handlePermalinkRequest() {
			preferences.openPermalink();
		}

		/**
		 * update the given preference parameter in the cookies. If no cookies exist, write new ones with current parameters
		 * @param key: id of the variable name
		 * @param value: value that should be assigned to that variable
		 */
		function updateCookies(key, value) {
			if (!preferences.areCookiesAVailable()) {
				//no cookies found so far, we need to write all information
				var lon = map.theMap.getCenter().lon;
				var lat = map.theMap.getCenter().lat;
				var zoom = map.theMap.getZoom();
				var layer = map.serializeLayers();

				preferences.writeMapCookies(lon, lat, zoom, layer);
				preferences.writePrefsCookies();

				//then write the requested data...
			}
			//there are cookies available (by now), only update the changed information
			preferences.updateCookies(key, value);
		}

		/**
		 * map parameters are usually modified together. This is more efficient than calling updateCookies(key, val) three times.
		 * @param lon: lon coordinate of current position
		 * @param lat: lat coordinate of current position
		 * @param zoom: current zoom level
		 * @param layer: active layer, including overlays (OL encode)
		 */
		function updateMapCookies(lon, lat, zoom, layer) {
			if (preferences.areCookiesAVailable()) {
				preferences.writeMapCookies(lon, lat, zoom, layer);
			} else {
				//write all information, not only map stuff
				updateCookies(null, null);
			}

		}

		/* *********************************************************************
		* startup
		* *********************************************************************/

		/**
		 * apply GET variables, read cookies or apply standard values to initialize the ORS page
		 */
		function initializeOrs() {
			//apply GET variables and/or cookies and set the user's language,...
			var getVars = preferences.loadPreferencesOnStartup();

			var pos = getVars[preferences.getPrefName(preferences.positionIdx)];
			var zoom = getVars[preferences.getPrefName(preferences.zoomIdx)];
			var layer = getVars[preferences.getPrefName(preferences.layerIdx)];
			var waypoints = getVars[preferences.getPrefName(preferences.waypointIdx)];
			var routeOpt = getVars[preferences.getPrefName(preferences.routeOptionsIdx)];
			var motorways = getVars[preferences.getPrefName(preferences.avoidHighwayIdx)];
			var tollways = getVars[preferences.getPrefName(preferences.avoidTollwayIdx)];
			var avoidAreas = getVars[preferences.getPrefName(preferences.avoidAreasIdx)];

			pos = preferences.loadMapPosition(pos);
			if (pos && pos != 'null') {
				pos = util.convertPointForMap(pos);
				map.theMap.setCenter(pos);
			} else {
				//position not set, use geolocation feature to determine position
				var locationSuccess = function(position) {
					var pos = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude);
					pos = util.convertPointForMap(pos);
					map.theMap.moveTo(pos);
				};
				geolocator.locate(locationSuccess, null, null);
			}
			zoom = preferences.loadMapZoom(zoom);
			if (zoom) {
				map.theMap.zoomTo(zoom);
			}
			layer = preferences.loadMapLayer(layer);
			if (layer) {
				map.restoreLayerPrefs(layer);
			}

			//waypoints: array of OL.LonLat representing one wayoint each
			waypoints = preferences.loadWaypoints(waypoints);
			if (waypoints && waypoints.length > 0) {
				for (var i = 0; i < waypoints.length; i++) {
					var type = Waypoint.type.VIA;
					if (i == 0) {
						type = Waypoint.type.START;
					} else if (i == waypoints.length - 1) {
						type = Waypoint.type.END;
					}
					handleAddWaypointByRightclick({
						pos : waypoints[i],
						type : type
					})
				}
				if (waypoints.length >= 2) {
					handleRoutePresent();
				}
			}

			routeOpt = preferences.loadRouteOptions(routeOpt);
			ui.setRouteOption(routeOpt);
			var res = preferences.loadAvoidables(motorways, tollways);
			motorways = res[0];
			tollways = res[1];
			ui.setAvoidables(motorways, tollways);

			var avoidables = preferences.loadAvoidables(motorways, tollways);
			//avoidAreas: array of OL.Polygon representing one avoid area each
			avoidAreas = preferences.loadAvoidAreas(avoidAreas);
			//apply avoid areas
			map.addAvoidAreas(avoidAreas);

			if (!preferences.areCookiesAVailable()) {
				ui.showNewToOrsPopup();
			}
		}

		/**
		 * apply selected site language, load dynamic menus, etc.
		 */
		function loadDynamicUiData() {
			//load Ui elements with selected language
			uiLanguages.applyLanguage();

			//load dropdown menus, etc. in the correct language
			uiLanguages.loadPoiTypeData();
			uiLanguages.loadPreferencePopupData();
			uiLanguages.loadPoiDistanceUnitData();

			//hide or show Ui elements based on the version
			uiVersions.applyVersion(preferences.version)

			//in the user preferences popup, set appropriate element active
			ui.setUserPreferences(preferences.version, preferences.language, preferences.routingLanguage, preferences.distanceUnit);
		}

		/**
		 * can be called to output debug information
		 */
		function showDebugInfo() {
			console.log();
		}

		/* *********************************************************************
		* class-specific
		* *********************************************************************/
		/**
		 * initialization
		 */
		function initialize() {
			map = new Map('map');

			ui.register('ui:startDebug', showDebugInfo);

			//e.g. when viewing/hiding the sidebar
			ui.register('ui:mapPositionChanged', handleMapUpdate);

			//after zooming, switching layers,...
			map.register('map:changed', handleMapChanged);

			//when moving mouse over a marker
			map.register('map:markerEmph', handleMarkerEmph);
			map.register('map:markerDeEmph', handleMarkerDeEmph);

			//after change of user preferences
			ui.register('ui:prefsChanged', handlePrefsChanged);

			//modules
			ui.register('ui:emphElement', handleElementEmph);
			ui.register('ui:deEmphElement', handleElementDeEmph);

			ui.register('ui:searchWaypointRequest', handleWaypointRequest);
			ui.register('ui:addWaypoint', handleAddWaypoint);
			ui.register('ui:waypointResultClick', handleWaypointResultClick);
			map.register('map:addWaypoint', handleAddWaypointByRightclick);
			ui.register('ui:selectWaypointType', selectWaypointType);
			ui.register('ui:movedWaypoints', handleMovedWaypoints);
			ui.register('ui:removeWaypoint', handleRemoveWaypoint);
			ui.register('ui:searchAgainWaypoint', handleSearchAgainWaypoint);
			ui.register('ui:resetRoute', handleResetRoute);
			ui.register('ui:zoomToRouteInstruction', handleZoomToRouteInstruction);

			ui.register('ui:geolocationRequest', handleGeolocationRequest);

			ui.register('ui:searchAddressRequest', handleSearchAddressRequest);
			ui.register('ui:clearSearchAddressMarkers', handleClearSearchAddressMarkers);
			ui.register('ui:zoomToAddressResults', handleZoomToAddressResults);

			ui.register('ui:checkDistanceToRoute', handleCheckDistanceToRoute);
			ui.register('ui:searchPoiRequest', handleSearchPoiRequest);
			ui.register('ui:clearSearchPoiMarkers', handleClearSearchPoiMarkers);
			ui.register('ui:zoomToPoiResults', handleZoomToPoiResults);

			ui.register('ui:useAsWaypoint', handleUseAsWaypoint);
			ui.register('ui:zoomToMarker', handleZoomToMarker);
			map.register('map:waypointMoved', handleWaypointMoved);

			ui.register('ui:routingParamsChanged', handleRoutePresent);
			ui.register('ui:zoomToRoute', handleZoomToRoute);

			ui.register('ui:avoidAreaControls', avoidAreaToolClicked);
			map.register('map:errorsInAvoidAreas', avoidAreasError);
			map.register('map:avoidAreaChanged', handleAvoidAreaChanged);
			map.register('map:routingParamsChanged', handleRoutePresent);

			ui.register('ui:analyzeAccessibility', handleAnalyzeAccessibility);
			ui.register('ui:removeAccessibility', handleRemoveAccessibility);

			ui.register('ui:exportRouteGpx', handleExportRoute);
			ui.register('ui:uploadRoute', handleUuploadRoute);
			ui.register('control:reverseGeocodeCompleted', uploadRouteTrigger2ndWaypoint);
			ui.register('ui:uploadTrack', handleUploadTrack);
			ui.register('ui:removeTrack', handleRemoveTrack);

			ui.register('ui:uploadHeightProfile', handleUploadHeightProfile);
			ui.register('ui:heightProfileHover', handleHeightProfileHover);

			ui.register('ui:saveUserPreferences', updateUserPreferences);
			ui.register('ui:openPermalinkRequest', handlePermalinkRequest);

			initializeOrs();
			loadDynamicUiData();
		}


		Controller.prototype.initialize = initialize;

		return new Controller();
	}(window));

window.onload = Controller.initialize;
/* ======================================================================
    ORS.OpenLayers.js
   ====================================================================== */

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
/* ======================================================================
    lang/lang-de.js
   ====================================================================== */

var lang_de = {
	'left' : 'links',
	'right' : 'rechts',
	'half-left' : 'halb links',
	'half-right' : 'halb rechts',
	'straight' : 'geradeaus',
	
	'serverError': 'Sorry, wä&auml;rend der Berechnung ist ein Fehler auf dem Server passiert. Bitte versuchen Sie es sp&auml;ter noch einmal ',
	'contact': 'Info&nbsp;&amp;&nbsp;Kontakt',
		
		'closeBtn': 'Schlie&szlig;en',
		'saveBtn': 'Speichern',
		
		'untitled' :  'Unbenannt',
		'infoTextVersions' :  'Neu auf OpenRouteService? Nutzen Sie erweiterte Routen-Optionen über die Seiteneinstellungen. ',
		
		'routePlanner':  'Routen-Planer ',
		'search':  'Suche',
		'routeOptions':  'Art der Route',
		'routeExtras':  'Route-Extras',
		
	//Routing
		'planRoute':  'Route planen',
		'calculatingRoute':  'Route wird berechnet...',
		'noRouteAvailable' :  'Leider konnte keine Route zwischen den gew&auml;hlten Punkten berechnet werden. Bitte w&auml;hlen Sie Ihre Punkte in der N&auml;he eines Weges.',
		'routeFromTo' :  'Route nach ',
		'resetRoute' :  'Gesamte Route l&ouml;schen ',
		'TotalTime':  'Gesamte Reisezeit',
		'TotalDistance':  'Gesamte Wegstrecke',
		'zoomToRoute':  'Ganze Route',
		'routeSummary':  'Zusammenfassung',
		'routeInstructions':  'Wegbeschreibung',
		'routeLinkText' :  'Permalink zur aktuellen Route',
		'permalinkButton' : 'Permalink',
	
	//Geolocation
		'geolocationNotification' : 'Der Routenplaner versucht Ihren Standort zu bestimmen. Wenn Sie die Anfrage nicht best&auml;tigen, werden Sie in K&uuml;rze weitergeleitet.',
		'currentLocation' :  'Meine aktuelle Position',
		'geolocation':  'Mein Aufenhaltsort',
		'showCurrentLocation' :  'Aktuellen Ort zeigen',
		'geolocationNotSupported' :  'Diese Funktionalit&auml;t wird von Ihrem Browser leider nicht unterst&uuml;tzt.',
		'geolocationRuntimeError' :  'W&auml;hrend der Standortabfrage ist leider ein Fehler aufgetreten!',
	
	//search in general
		'zoomToSearchResults':  'Ergebnisse in der Karte anzeigen',
		'selectResult':  'W&auml;hlen Sie ein Suchergebnis aus:',
		'searchAgain':  'erneut Suchen',
		'searchError' : 'W&auml;hrend der Suche ist leider ein Fehler aufgetreten!',
	
	//Address search
		'searchForPoints':  'Nach Adresse suchen',
		'enterAddress':  'Addresse eingeben',
	
	//POI search	
		'distaneNotSupported' :  'Maximalwert: 5000 Meter',
		'noRouteFound' :  'Keine Route vorhanden, in deren N&auml;he POIs gesuche werden k&ouml;nnen.',
		'searchForPoi':  'Nach POI suchen',
		'poiNearRoute1' :  'markiere POIs im Umkreis von&nbsp;',
		'poiNearRoute2' :  '&nbsp; zur Route',
		'enterPoi':  'POI eingeben',
		'numPoiResults1' :  '<b>',
		'numPoiResults2' :  ' Ergebnisse gefunden</b> (max. 100):',
	
	// context menu
		'useAsStartPoint':  'Als Startpunkt verwenden', 
		'useAsViaPoint':  'Als Viapunkt einf&uuml;gen',
		'useAsEndPoint':  'Als Zielpunkt verwenden',
	
	//Waypoint options
		'addWaypoint':  'Wegpunkt hinzuf&uuml;gen',
		'moveUpWaypoint':  'Wegpunkt nach Oben verschieben',
		'moveDownWaypoint':  'Wegpunkt nach Unten verschieben',
		'removeWaypoint':  'Wegpunkt entfernen',
		'useAsWaypoint' :  'als Wegpunkt &uuml;bernehmen',
		
	//Route Preferences
		'Shortest':  'K&uuml;rzester Weg',
		'Fastest':  'Schnellster Weg',
		'Pedestrian':  'Fußg&auml;nger',
		'Bicycle':  'K&uuml;rzester Weg',
		'BicycleSafety':  'Sicherster Weg',
		'BicycleRoute':  'Bevorzuge Fahrradweg',
		'BicycleMTB':  'Mountainbike',
		'BicycleRacer':  'Rennrad',
		
		'avoidMotorways':  'Autobahnen vermeiden',
		'avoidTollways':  'Mautstra&szlig;en vermeiden',
		
	//Avoid areas
		'avoidAreas':  'Bereiche vermeiden',
		'avoidAreaDraw':  'Bereich zeichnen',
		'avoidAreaModify':  'Bereich bearbeiten',
		'avoidAreaRemove':  'Bereich l&ouml;schen',	
		'invalidAvoidArea' : 'Bereiche, die sich selbst schneiden sind nicht erlaubt. Bitte entfernen bzw. korrigieren Sie diese Bereiche. Sonst kann keine Route berechnet werden.',
	
	//GPX Extras
		'imExport' : 'Import/ Export',
		'gpxDownloadError': 'Beim Herunterladen der Route ist leider ein Fehler aufgetreten.',
		'gpxUploadError': 'Beim Upload der Route ist leider ein Fehler aufgetreten.',
		'gpxDownloadText' :  'Aktuelle Route im GPX-Format herunterladen',
		'gpxDownloadButton' : 'GPX herunterladen',
		'gpxUploadRouteText' :  'GPX-Route aus Datei anzeigen und neuberechnen',
		'gpxUploadTrackText' :  'GPX-Track aus Datei anzeigen', 
		'selectFile' : 'Datei ausw&auml;hlen',
		'changeFile' : '&Auml;ndern',
	
		//accessibility Analysis
		'accessibilityAnalysis' : 'Erreichbarkeits-Analyse',
		'setAccessibilityMinutes' : 'Minuten ausw&auml;hlen: ',
		'analyze' : 'Analysieren',
		'calculatingAccessibility' : 'Die Erreichbarkeit wird analysiert...',
		'accessibilityError' : 'W&auml;hrend der Erreichbarkeits-Analyse ist leider ein Fehler aufgetreten. Haben Sie vergessen einen Startpunkt zu setzen?',
	
	// List languages
		'en': 'Englisch',
		'de':  'Deutsch',
		'pl' : 'Polnisch',
		'bg' : 'Bulgarisch',
		'cz' : 'Tschechisch',
		'nl' : 'Holl&auml;ndisch',
		'hr' : 'Kroatisch',
		'hu' : 'Ungarisch',
		'nl_BE' : 'Holl&auml;ndisch: Belgien',
		'es' : 'Spanisch',
		'eo' : 'Esperanto',
		'fi' : 'Finnisch',
		'fr': 'Franz&ouml;sisch',
        'it' : 'Italienisch',
        'pt_BR' : 'Portugiesisch',
        'ro' : 'Rum&auml;nisch',
        'ru' : 'Russisch',
        'se' : 'Schwedisch',
        'dk' : 'D&auml;nisch',
        'tr' : 'T&uuml;rkisch',
        'ca' : 'Katalanisch',
        'ja' : 'Japanisch',
        'no' : 'Norwegisch',
        'vi' : 'Vietnamesisch',
        'nb' : 'Norwegisch Bokm&aring;l',
        'de-rheinl' : 'Deutsch: Rheinland',
        'de-opplat' : 'Deutsch: Plattdeutsch',
        'de-berlin' : 'Deutsch: Berlin',
        'de-swabia' : 'Deutsch: Schwaben',
        'de-ruhrpo' : 'Deutsch: Ruhrpott',
        'de-bay' : 'Deutsch: Bayern',
        'de-at-ooe' : 'Deutsch: &Ouml;sterreich',
	
	// List distance units
		'km': 'Kilometer',
		'm': 'Meter', 
        'mi': 'Meilen',
        'yd': 'Yards',
        
	// List time units
		'days': 'Tag(e)', 
		'hours': 'Stunde(n)',
		'minutes': 'Minute(n)',
		'seconds': 'Sekunde(n)',
		
	//List versions
		'standardVersion' :  'Standard Version', 
		'extendedVersion' :  'Erweiterte Version',
	
	//Site Preferences
		'sitePreferences' : 'Optionen', 
		'language':  'Sprachen',
		'routingLanguage' : 'Sprache f&uuml;r Routing-Anweisungen',
		'distance' :  'Entfernungseinheiten',
		'version' : 'Version',
		'languageText':  'Bitte w&auml;hlen Sie Ihre Sprache:&nbsp;',
		'routingLanguageText' : 'Bitte w&auml;hlen Sie Ihre Sprache:&nbsp;',
		'distanceText' :  'Bitte w&auml;hlen Sie Ihre Entfernungseinheit:&nbsp;',
		'versionText' :  'Bitte w&auml;hlen Sie den Detail-Grad:&nbsp;',
	
	//POI categories
		'amenity': 'Einrichtungen',
		'public_tran': '&Ouml;pnv',
		'shop': 'L&auml;den',
		'tourism': 'Tourismus',
		'leisure': 'Freizeit',
		'sport': 'Sport',
		
	// POI types	
		'atm': 'Geldautomat',
        'bank': 'Bank',
        'bureau_de_change': 'Wechselstube',
        'biergarten': 'Biergarten',
        'cafe': 'Cafe',
        'cinema': 'Kino',
        'college': 'Hochschule',
        'courthouse': 'Gericht',
        'fast_food': 'Schnellrestaurant',
        'fuel': 'Tankstelle',
        'hospital': 'Krankenhaus',
        'library': 'B&uuml;cherei',
        'nightclub': 'Nachtclub',
        'parking': 'Parkplatz',
        'pharmacy': 'Apotheke',
        'place_of_worship': 'Kultst&auml;tte',
        'police': 'Polizei',
        'post_box': 'Briefkasten',
        'post_office': 'Postamt',
        'pub': 'Kneipe',
        'public_building': '&Ouml;ffentliches Geb&auml;ude',
        'restaurant': 'Restaurant',
        'school': 'Schule',
        'taxi': 'Taxi',
        'telephone': 'Telephonzelle',
        'theatre': 'Theater',
        'toilets': 'Toiletten',
        'townhall': 'Rathaus',
        'university': 'Universit&auml;t',
		'bus_stop': 'Bus Haltestelle',
        'bus_station': 'Busbahnhof',
        'railway_station': 'Bahnhof',
        'tram_stop': 'Stra&szlig;enbahnhaltestelle',
        'subway_entrance': 'U-Bahn-Einstieg',
		'supermarket': 'Supermarkt',
        'convenience': 'Konsumg&uuml;ter',
        'bakery': 'B&auml;ckerei',
        'butcher': 'Metzger',
        'kiosk': 'Kiosk',
        'camp_site': 'Campingplatz',
        'caravan_site': 'Stellplatz',
        'chalet': 'H&uuml;tte',
        'viewpoint' : 'Aussichtspunkt',
		'information': 'Information',
        'hotel': 'Hotel',
        'motel': 'Motel',
        'guest_house': 'G&auml;stehaus',
        'hostel': 'Hostel',
		'sports_centre': 'Sportcenter',
		'golf_course': 'Golfplatz',
		'stadium': 'Stadion',
		'track': 'Bahn',
		'pitch': 'Bolzplatz',
		'water_park': 'Wasserpark',
		'marina': 'Yachthafen',
		'slipway': 'Eisbahn',
		'fishing': 'Fischen',
		'nature_reserve': 'Naturschutzgebiet',
		'park': 'Park',
		'playground': 'Spielplatz',
		'garden': 'Garten',
		'ice_rink': 'Eissporthalle',
		'miniature_golf': 'Minigolf',
		'9pin': 'Bowling (9 Pin)',
        '10pin': 'Bowling (10 Pin)',
        'archery': 'Bogenschie&szlig;en',
        'athletics': 'Athletik',
        'australian_football': 'Australischer Football',
        'baseball': 'Baseball',
        'basketball': 'Basketball',
        'beachvolleyball': 'Beachvolleyball',
        'boules': 'Boule',
        'bowls': 'Rasen-Bowling',
        'canoe': 'Kanu',
        'chess': 'Schach',
        'climbing': 'Klettern',
        'cricket': 'Cricket',
        'cricket_nets': 'Cricket Nets',
        'croquet': 'Krocket',
        'cycling': 'Radfahren',
        'diving': 'Tauchen',
        'dog_racing': 'Hunderennen',
        'equestrian': 'Reiten',
        'football': 'American Football',
        'golf': 'Golf',
        'gymnastics': 'Gymnastik',
        'hockey': 'Hockey',
        'horse_racing': 'Pferderennen',
        'korfball': 'Korfball',
        'motor': 'Motorsport',
        'orienteering': 'Orientierungslauf',
        'paddle_tennis': 'Paddle Tennis',
        'squash': 'Squash',
        'paragliding': 'Paragliding',
        'pelota': 'Pelota',
        'racquet': 'Racquetball',
        'rowing': 'Rudern',
        'rugby': 'Rugby',
        'shooting': 'Schie&szlig;sport',
        'skating': 'Rollschuhfahren',
        'skateboard': 'Skateboard',
        'skiing': 'Skisport',
        'soccer': 'Fu&szlig;ball',
        'swimming': 'Schwimmen',
        'table_tennis': 'Tischtennis',
        'team_handball': 'Handball',
        'tennis': 'Tennis',
        'volleyball': 'Volleyball'
};
/* ======================================================================
    lang/lang-en.js
   ====================================================================== */

var lang_en = {
	'left' : 'left',
	'right' : 'right',
	'half-left' : 'half left',
	'half-right' : 'half right',
	'straight' : 'straight',

	'serverError' : 'We are sorry. An error occured during the calculations on the server. Please try again later.',

	'contact' : 'Info&nbsp;&amp;&nbsp;Contact',

	'closeBtn' : 'Close',
	'saveBtn' : 'Save',

	'untitled' : 'Untitled',
	'infoTextVersions' : 'New to OpenRouteService? Activate extended options in the site preference menu.',

	'routePlanner' : 'Plan Route',
	'search' : 'Search',
	'routeOptions' : 'Route options',
	'routeExtras' : 'Route extras',

	//Routing
	'planRoute' : 'Plan route',
	'calculatingRoute' : 'Calculating Route...',
	'noRouteAvailable' : 'Sorry, no route was found between the selected points. Please choose your points closer to a road.',
	'routeFromTo' : 'Route to ',
	'resetRoute' : 'Reset whole route',
	'TotalTime' : 'Total time',
	'TotalDistance' : 'Total distance',
	'zoomToRoute' : 'Whole Route',
	'routeSummary' : 'Summary',
	'routeInstructions' : 'Route instructions',
	'routeLinkText' : 'Permalink for current route',
	'permalinkButton' : 'Permalink',

	//Geolocation
	'geolocationNotification' : 'The routing planner tries to find out your location. If you do not want to accept the request, you will be redirected in a moment.',
	'currentLocation' : 'My current location',
	'geolocation' : 'My location',
	'showCurrentLocation' : 'Show my current location',
	'geolocationNotSupported' : 'Your browser does not support this feature.',
	'geolocationRuntimeError' : 'An error occured during the location checking, we\'re sorry!',

	//search in general
	'zoomToSearchResults' : 'Zoom to search results',
	'selectResult' : 'Select a result:',
	'searchAgain' : 'search Again',
	'searchError' : 'An error occured while searching, we\'re sorry!',

	//Address search
	'searchForPoints' : 'Search for an address',
	'enterAddress' : 'enter an address',

	//POI search
	'distaneNotSupported' : 'maximum distance: 5000 meters',
	'noRouteFound' : 'No route to search for POIs nearby.',
	'searchForPoi' : 'Search for a POI',
	'poiNearRoute1' : 'find POIs within&nbsp;',
	'poiNearRoute2' : '&nbsp; next to the route',
	'enterPoi' : 'enter a POI',
	'numPoiResults1' : '<b>Number of Results: ',
	'numPoiResults2' : ' </b>(max. 100):',

	// context menu
	'useAsStartPoint' : 'use as starting point',
	'useAsViaPoint' : 'insert as via point',
	'useAsEndPoint' : 'use as destination',

	//Waypoint options
	'addWaypoint' : 'Add waypoint',
	'moveUpWaypoint' : 'Move waypoint up',
	'moveDownWaypoint' : 'Move Waypoint down',
	'removeWaypoint' : 'Remove waypoint',
	'useAsWaypoint' : 'use as waypoint',

	//Route Preferences
	'Shortest' : 'shortest route',
	'Fastest' : 'fastest route',
	'Pedestrian' : 'pedestrian',
	'Bicycle' : 'shortest route',
	'BicycleSafety' : 'safest route',
	'BicycleRoute' : 'prefer bicycle lane',
	'BicycleMTB' : 'mountain bike',
	'BicycleRacer' : 'racing bike',

	'avoidMotorways' : 'Avoid highways',
	'avoidTollways' : 'Avoid toll roads',

	//Avoid areas
	'avoidAreas' : 'Areas to avoid',
	'avoidAreaDraw' : 'draw avoid area',
	'avoidAreaModify' : 'modify avoid area',
	'avoidAreaRemove' : 'remove avoid area',
	'invalidAvoidArea' : 'Avoid areas are not allowed to intersect themselves. Please remove or correct this area. Otherwise no route calculation is possible.',

	//GPX Extras
	'imExport' : 'Import/ Export',
	'gpxDownloadError' : 'Unfortunately an error occured while downlodng the route.',
	'gpxUploadError' : 'Unfortunately an error occured while uploading the route.',
	'gpxDownloadText' : 'Download of current route in GPX format',
	'gpxDownloadButton' : 'Download GPX',
	'gpxUploadRouteText' : 'Upload a route from a GPX-file with re-calculation',
	'gpxUploadTrackText' : 'Upload of GPX-track for display on the map',
	'selectFile' : 'Select file',
	'changeFile' : 'Change',

	//Accessibility Analysis
	'accessibilityAnalysis' : 'Accessibility analysis',
	'setAccessibilityMinutes' : 'Select minutes: ',
	'analyze' : 'Analyze',
	'calculatingAccessibility' : 'The accessibility is being analyzed...',
	'accessibilityError' : 'An error occured during the accessibility analysis. Did you forget to set a start point?',

	// List languages
	'en' : 'English',
	'de' : 'German',
	'pl' : 'Polish',
	'bg' : 'Bulgarian',
	'cz' : 'Czech',
	'nl' : 'Dutch',
	'hr' : 'Croatian',
	'hu' : 'Hungarian',
	'nl_BE' : 'Dutch: Belgium',
	'es' : 'Spanish',
	'eo' : 'Esperanto',
	'fi' : 'Finnish',
	'fr' : 'French',
	'it' : 'Italian',
	'pt_BR' : 'Portuguese',
	'ro' : 'Romanian',
	'ru' : 'Russian',
	'se' : 'Swedish',
	'dk' : 'Danish',
	'tr' : 'Turkish',
	'ca' : 'Catalan',
	'ja' : 'Japanese',
	'no' : 'Norwegian',
	'vi' : 'Vietnamese',
	'nb' : 'Norwegian Bokm&aring;l',
	'de-rheinl' : 'German: Rhineland',
	'de-opplat' : 'German: Low German',
	'de-berlin' : 'German: Berlin',
	'de-swabia' : 'German: Swabia',
	'de-ruhrpo' : 'German: Ruhr District',
	'de-bay' : 'German: Bavaria',
	'de-at-ooe' : 'German: Austria',

	// List distance units
	'km' : 'kilometers',
	'm' : 'meters',
	'mi' : 'miles',
	'yd' : 'yards',

	// List time units
	'days' : 'day(s)',
	'hours' : 'hour(s)',
	'minutes' : 'minute(s)',
	'seconds' : 'second(s)',

	//List versions
	'standardVersion' : 'standard version',
	'extendedVersion' : 'extended version',

	//Site Preferences
	'sitePreferences' : 'Site Preferences',
	'language' : 'Languages',
	'routingLanguage' : 'Language for routing instructions',
	'distance' : 'Distance Units',
	'version' : 'Version',
	'languageText' : 'Please select your language:&nbsp;',
	'routingLanguageText' : 'Please select your language:&nbsp;',
	'distanceText' : 'Please select your distance unit:&nbsp;',
	'versionText' : 'Please choose the number of options:&nbsp;',

	//POI categories
	'amenity' : 'amenity',
	'public_tran' : 'public transportation',
	'shop' : 'shops',
	'tourism' : 'tourism',
	'leisure' : 'leisure',
	'sport' : 'sports',

	//POI types
	'atm' : 'ATM',
	'bank' : 'bank',
	'bureau_de_change' : 'bureau de change',
	'biergarten' : 'beer garden',
	'cafe' : 'cafe',
	'cinema' : 'cinema',
	'college' : 'college',
	'courthouse' : 'courthouse',
	'fast_food' : 'fast food',
	'fuel' : 'fueling station',
	'hospital' : 'hospital',
	'library' : 'library',
	'nightclub' : 'night club',
	'parking' : 'parking',
	'pharmacy' : 'pharmacy',
	'place_of_worship' : 'place of worship',
	'police' : 'police',
	'post_box' : 'post box',
	'post_office' : 'post office',
	'pub' : 'pub',
	'public_building' : 'public building',
	'restaurant' : 'restaurant',
	'school' : 'school',
	'taxi' : 'taxi',
	'telephone' : 'telephone',
	'theatre' : 'theatre',
	'toilets' : 'public restroom',
	'townhall' : 'town hall',
	'university' : 'university',
	'bus_stop' : 'bus stop',
	'bus_station' : 'bus station',
	'railway_station' : 'railway station',
	'tram_stop' : 'tram stop',
	'subway_entrance' : 'subway entrance',
	'supermarket' : 'supermarket',
	'convenience' : 'convenience',
	'bakery' : 'bakery',
	'butcher' : 'butcher',
	'kiosk' : 'kiosk',
	'camp_site' : 'camp site',
	'caravan_site' : 'caravan site',
	'chalet' : 'chalet',
	'viewpoint' : 'viewpoint',
	'information' : 'information',
	'hotel' : 'hotel',
	'motel' : 'motel',
	'guest_house' : 'guest house',
	'hostel' : 'hostel',
	'sports_centre' : 'sports centre',
	'golf_course' : 'golf course',
	'stadium' : 'stadium',
	'track' : 'track',
	'pitch' : 'pitch',
	'water_park' : 'water park',
	'marina' : 'marina',
	'slipway' : 'slipway',
	'fishing' : 'fishing',
	'nature_reserve' : 'nature reserve',
	'park' : 'park',
	'playground' : 'playground',
	'garden' : 'garden',
	'ice_rink' : 'ice rink',
	'miniature_golf' : 'miniature golf',
	'9pin' : 'bowling (9 pin)',
	'10pin' : 'bowling (10 pin)',
	'archery' : 'archery',
	'athletics' : 'athletics',
	'australian_football' : 'australian football',
	'baseball' : 'baseball',
	'basketball' : 'basketball',
	'beachvolleyball' : 'beachvolleyball',
	'boules' : 'boules',
	'bowls' : 'bowls',
	'canoe' : 'canoe',
	'chess' : 'chess',
	'climbing' : 'climbing',
	'cricket' : 'cricket',
	'cricket_nets' : 'cricket nets',
	'croquet' : 'croquet',
	'cycling' : 'cycling',
	'diving' : 'diving',
	'dog_racing' : 'dog racing',
	'equestrian' : 'equestrian',
	'football' : 'american football',
	'golf' : 'golf',
	'gymnastics' : 'gymnastics',
	'hockey' : 'hockey',
	'horse_racing' : 'horse racing',
	'korfball' : 'korfball',
	'motor' : 'motor sports',
	'orienteering' : 'orienteering',
	'paddle_tennis' : 'paddle tennis',
	'squash' : 'squash',
	'paragliding' : 'paragliding',
	'pelota' : 'pelota',
	'racquet' : 'racquet ball',
	'rowing' : 'rowing',
	'rugby' : 'rugby',
	'shooting' : 'shooting',
	'skating' : 'skating',
	'skateboard' : 'skateboarding',
	'skiing' : 'skiing',
	'soccer' : 'football',
	'swimming' : 'swimming',
	'table_tennis' : 'table tennis',
	'team_handball' : 'team handball',
	'tennis' : 'tennis',
	'volleyball' : 'volleyball',
};
/* ======================================================================
    lang/lang-pl.js
   ====================================================================== */

var lang_pl = {
	'left' : '',
	'right' : '',
	'half-left' : '',
	'half-right' : '',
	'straight' : '',
	
	'serverError' : 'Przepraszamy, podczas wylicze&#x0144; na serwerze pojawi&#x0142; si&#x0119; b&#x0142;&#x0105;d. Prosz&#x0119; spr&oacute;bowa&#x0107; p&oacute;&#x017A;niej.',
	
	'contact' : 'Informacje&nbsp;i&nbsp;kontakt',
	
	'closeBtn' : 'Zamknij',
	'saveBtn' : 'Zapisz',
	
	'untitled' : 'bez tytu&#x0142;u',
	'infoTextVersions' : 'Jesteś nowy na OpenRouteService? Aktywuj rozszerzone opcje w menu preferencji.',
	
	'routePlanner' : 'Planowanie trasy',
	'search' : 'Szukaj',
	'routeOptions' : 'Opcje nawigacji',
	'routeExtras' : 'Opcje dodatkowe',

	//Routing
	'planRoute' : 'Zaplanuj tras&#x0119;',
	'calculatingRoute' : 'Obliczanie trasy...',
	'noRouteAvailable' : 'Niestety, nie znaleziono trasy mi&#x0119;dzy wybranymi punktami. Prosz&#x0119; wybra&#x0107; punkty bli&#x017C;ej drogi.',
	'routeFromTo' : 'Trasa do ',
	'resetRoute' : 'Wyczy&#x015B;&#x0107; ca&#x0142;&#261; tras&#x0119;',
	'TotalTime' : 'Ca&#x0142;kowity czas',
	'TotalDistance' : 'Ca&#x0142;kowita odleg&#x0142;o&#x015B;&#x0107;',
	'zoomToRoute' : 'Ca&#x0142;a trasa',
	'routeSummary' : 'Podsumowanie',
	'routeInstructions' : 'Instrukcje do trasy',
	'routeLinkText' : 'Trwa&#x0142;y odno&#x015B;nik do bie&#x017C;&#x0105;cej trasy',
	'permalinkButton' : '',

	//Geolocation
	'geolocationNotification' : 'Serwis pr&oacute;buje znale&#x017A;&#x0107; twoje po&#x0142;o&#x017C;enie. Je&#x015B;li nie chcesz zaakceptowa&#x0107; tego zapytania, za chwil&#x0119; zostaniesz przekierowany.',
	'currentLocation' : 'Moje bie&#x017C;&#x0105;ce po&#x0142;o&#x017C;enie',
	'geolocation' : 'Moje po&#x0142;o&#x017C;enie',
	'showCurrentLocation' : 'Poka&#x017C; moje bie&#x017C;&#x0105;ce po&#x0142;o&#x017C;enie',
	'geolocationNotSupported' : 'Twoja przegl&#x0105;darka nie obs&#x0142;uguje tej funkcji.',
	'geolocationRuntimeError' : 'Podczas sprawdzania po&#x0142;o&#x017C;enia pojawi&#x0142; si&#x0119; b&#x0142;&#x0105;d, przepraszamy!',

	//search in general
	'zoomToSearchResults' : 'Powi&#x0119;ksz do wynik&oacute;w wyszukiwania',
	'selectResult' : 'Wybierz wynik:',
	'searchAgain' : 'szukaj ponownie',
	'searchError' : '',

	//Address search
	'searchForPoints' : 'Szukaj adresu',
	'enterAddress' : 'podaj adres',

	//POI search
	'distaneNotSupported' : 'maksymalna odleg&#x0142;o&#x015B;&#x0107;: 5000 metr&oacute;w',
	'noRouteFound' : 'Brak trasy do znajdowania pobliskich punkt&oacute;w.',
	'searchForPoi' : 'Szukaj punktu',
	'poiNearRoute1' : 'punkty w odleg&#x0142;o&#x015B;ci do&nbsp;',
	'poiNearRoute2' : '&nbsp; od trasy',
	'enterPoi' : 'podaj rodzaj punktu',
	'numPoiResults1' : '<b>Liczba wynik&oacute;w: ',
	'numPoiResults2' : ' </b>(maks. 100):',

	// context menu
	'useAsStartPoint' : 'u&#x017C;yj jako pocz&#x0105;tek trasy',
	'useAsViaPoint' : 'wstaw punkt po&#x015B;redni',
	'useAsEndPoint' : 'u&#x017C;yj jako koniec trasy',

	//Waypoint options
	'addWaypoint' : 'dodaj kolejny punkt',
	'moveUpWaypoint' : 'przenie&#x015B; punkt wy&#x017C;ej',
	'moveDownWaypoint' : 'przenie&#x015B; punkt ni&#x017C;ej',
	'removeWaypoint' : 'usu&#x0144; punkt',
	'useAsWaypoint' : 'u&#x017C;yj jako punkt na trasie',

	//Route Preferences
	'Shortest' : 'najkr&oacute;tsza trasa',
	'Fastest' : 'najszybsza trasa',
	'Pedestrian' : 'pieszo',
	'Bicycle' : 'najkr&oacute;tsza trasa',
	'BicycleSafety' : 'trasa bezpieczna',
	'BicycleRoute' : 'preferuj &#x015B;cie&#x017C;ki rowerowe',
	'BicycleMTB' : 'rowery terenowy',
	'BicycleRacer' : 'rower wy&#x015B;cigowy',
	
	'avoidMotorways' : 'unikaj autostrad',
	'avoidTollways' : 'unikaj dr&oacute;g p&#x0142;atnych',

	//Avoid areas
	'avoidAreas' : 'unikaj obszar&oacute;w',
	'avoidAreaDraw' : 'narysuj obszar niedozwolony',
	'avoidAreaModify' : 'modyfikuj obszar niedozwolony',
	'avoidAreaRemove' : 'usu&#x0144; obszar niedozwolony',
	'invalidAvoidArea' : '',

	//GPX Extras
	'imExport' : '',
	'gpxDownloadError' : 'Niestety, podczas pobierania trasy pojawi&#x0142; si&#x0119; b&#x0142;&#x0105;d.',
	'gpxUploadError' : 'Niestety, podczas wysy&#x0142;ania trasy pojawi&#x0142; si&#x0119; b&#x0142;&#x0105;d.',
	'gpxDownloadText' : 'Pobierz bie&#x017C;&#x0105;c&#x0105; tras&#x0119; w formacie GPX',
	'gpxDownloadButton' : '',
	'gpxUploadRouteText' : 'Wy&#x015B;lij tras&#x0119; z pliku GPX i przelicz j&#x0105;',
	'gpxUploadTrackText' : 'Wy&#x015B;lij tras&#x0119; z pliku GPX i wy&#x015B;wietl j&#x0105; na mapie',
	'selectFile' : '',
	'changeFile' : '',

	//Accessibility Analysis
	'accessibilityAnalysis' : 'Analiza dost&#x0119;pno&#x015B;ci',
	'setAccessibilityMinutes' : 'Dost&#x0119;pno&#x015B;&#x0107; w minutach: ',
	'analyze' : 'Analizuj',
	'calculatingAccessibility' : 'Dost&#x0119;pno&#x015B;&#x0107; miejsca jest analizowana...',
	'accessibilityError' : 'W trakcie analizy dost&#x0119;pno&#x015B;ci wyst&#x0105;pi&#x0142; b&#x0142;&#x0105;d. Czy poda&#x0142;e&#x015B; punkt pocz&#x0105;tkowy?',

	// List languages
	'de' : 'niemiecki',
	'en' : 'angielski',
	'pl' : 'polski',
	'bg' : 'bu&#x0142;garski',
	'cz' : 'czeski',
	'nl' : 'holenderski',
	'hr' : 'horwacki',
	'hu' : 'w&#x0119;gierski',
	'nl_BE' : 'holenderski: Belgia',
	'es' : 'hiszpa&#x0144;ski',
	'eo' : 'esperanto',
	'fi' : 'fi&#x0144;ski',
	'fr' : 'francuski',
	'it' : 'w&#x0142;oski',
	'pt_BR' : 'portugalski',
	'ro' : 'rumu&#x0144;ski',
	'ru' : 'rosyjski',
	'se' : 'szwedzki',
	'dk' : 'du&#x0144;ski',
	'tr' : 'turecki',
	'ca' : 'katalo&#x0144;ski',
	'ja' : 'japo&#x0144;ski',
	'no' : 'norweski',
	'vi' : 'wietnamski',
	'nb' : 'norweski Bokm&aring;l',
	'de-rheinl' : 'niemiecki: Nadrenia',
	'de-opplat' : 'niemiecki: dolnoniemiecki',
	'de-berlin' : 'niemiecki: Berlin',
	'de-swabia' : 'niemiecki: Szwabia',
	'de-ruhrpo' : 'niemiecki: Zag&#x0142;&#x0119;bie Ruhry',
	'de-bay' : 'niemiecki: Bawaria',
	'de-at-ooe' : 'niemiecki: Austria',

	// List distance units
	'km' : 'kilometry',
	'm' : 'metry',
	'mi' : 'mile',
	'yd' : 'jardy',

	// List time units
	'days' : 'dni',
	'hours' : 'godzin',
	'minutes' : 'minut',
	'seconds' : 'sekund',

	//List versions
	'standardVersion' : 'wersja standardowa',
	'extendedVersion' : 'wersja rozszerzona',

	//Site Preferences
	'sitePreferences' : 'Preferencje serwisu',
	'language' : 'j&#x0119;zyki',
	'routingLanguage' : 'j&#x0119;zyki dla instrukcje do trasy',
	'distance' : 'jednostki odleg&#x0142;o&#x015B;ci',
	'version' : 'wersja',
	'languageText' : 'Wybierz sw&oacute;j j&#x0119;zyk:&nbsp;',
	'routingLanguageText' : 'Wybierz sw&oacute;j j&#x0119;zyk:&nbsp;',
	'distanceText' : 'Wybierz swoj&#x0105; jednostk&#x0119; odleg&#x0142;o&#x015B;ci:&nbsp;',
	'versionText' : 'Wybierz liczb&#x0119; opcji:&nbsp;',

	//POI categories
	'amenity' : 'miejsca',
	'public_tran' : 'transport publiczny',
	'shop' : 'sklepy',
	'tourism' : 'tourystyka',
	'leisure' : 'wypoczynek',
	'sport' : 'sport',

	//POI types
	'atm' : 'bankomat',
	'bank' : 'bank',
	'bureau_de_change' : 'kantor wymiany walut',
	'biergarten' : 'ogr&oacute;dek piwny',
	'cafe' : 'kawiarnia',
	'cinema' : 'kino',
	'college' : 'college',
	'courthouse' : 's&#x0105;d',
	'fast_food' : 'fast food',
	'fuel' : 'stacja benzynowa',
	'hospital' : 'szpital',
	'library' : 'biblioteka',
	'nightclub' : 'klub nocny',
	'parking' : 'parking',
	'pharmacy' : 'apteka',
	'place_of_worship' : 'miejsce modlitwy',
	'police' : 'policja',
	'post_box' : 'skrzynka pocztowa',
	'post_office' : 'urz&#x0105;d pocztowy',
	'pub' : 'pub',
	'public_building' : 'budynek publiczny',
	'restaurant' : 'restauracja',
	'school' : 'szko&#x0142;a',
	'taxi' : 'taxi',
	'telephone' : 'telefon',
	'theatre' : 'teatr',
	'toilets' : 'public restroom',
	'townhall' : 'ratusz',
	'university' : 'uniwersytet',
	'bus_stop' : 'przystanek autobusowy',
	'bus_station' : 'dworzec autobusowy',
	'railway_station' : 'dworzec kolejowy',
	'tram_stop' : 'przystanek tramwajowy',
	'subway_entrance' : 'wej&#x015B;cie do metra',
	'supermarket' : 'supermarket',
	'convenience' : 'sklepik',
	'bakery' : 'piekarnia',
	'butcher' : 'sklep mi&#x0119;sny',
	'kiosk' : 'kiosk',
	'camp_site' : 'pole namiotowe',
	'caravan_site' : 'kemping',
	'chalet' : 'chalet',
	'viewpoint' : 'punkt widokowy',
	'information' : 'informacja',
	'hotel' : 'hotel',
	'motel' : 'motel',
	'guest_house' : 'pensjonat',
	'hostel' : 'hostel',
	'sports_centre' : 'centrum sportowe',
	'golf_course' : 'pole golfowe',
	'stadium' : 'stadion',
	'track' : 'bie&#x017C;nia',
	'pitch' : 'boisko',
	'water_park' : 'park wodny',
	'marina' : 'marina',
	'slipway' : 'pochylnia',
	'fishing' : 'w&#x0119;dkowanie',
	'nature_reserve' : 'rezerwat przyrody',
	'park' : 'park',
	'playground' : 'plac zabaw',
	'garden' : 'ogr&oacute;d',
	'ice_rink' : 'lodowisko',
	'miniature_golf' : 'minigolf',
	'9pin' : 'kr&#x0119;gle (9 pion&oacute;w)',
	'10pin' : 'kr&#x0119;gle (10 pion&oacute;w)',
	'archery' : '&#x0142;ucznictwo',
	'athletics' : 'lekkoatletyka',
	'australian_football' : 'football australijski',
	'baseball' : 'baseball',
	'basketball' : 'koszyk&oacute;wka',
	'beachvolleyball' : 'siatk&oacute;wka pla&#x017C;owa',
	'boules' : 'bule',
	'bowls' : 'bowls',
	'canoe' : 'kajaki',
	'chess' : 'szachy',
	'climbing' : 'wspinaczka',
	'cricket' : 'krykiet',
	'cricket_nets' : 'siatki krykietowe',
	'croquet' : 'krokiet',
	'cycling' : 'rowery',
	'diving' : 'nurkowanie',
	'dog_racing' : 'wy&#x015B;cigi ps&oacute;w',
	'equestrian' : 'je&#x017A;dziectwo',
	'football' : 'football ameryka&#x0144;ski',
	'golf' : 'golf',
	'gymnastics' : 'gimnastyka',
	'hockey' : 'hokej',
	'horse_racing' : 'wy&#x015B;cigi konne',
	'korfball' : 'korfball',
	'motor' : 'sporty motorowe',
	'orienteering' : 'biegi na orientacj&#x0119;',
	'paddle_tennis' : 'paddle tennis',
	'squash' : 'squash',
	'paragliding' : 'paralotniarstwo',
	'pelota' : 'pelota',
	'racquet' : 'racquet ball',
	'rowing' : 'wio&#x015B;larstwo',
	'rugby' : 'rugby',
	'shooting' : 'strzelectwo',
	'skating' : '&#x0142;y&#x017C;wiarstwo',
	'skateboard' : 'skateboarding',
	'skiing' : 'narciarstwo',
	'soccer' : 'pi&#x0142;ka no&#x017C;na',
	'swimming' : 'p&#x0142;ywalnia',
	'table_tennis' : 'tenis sto&#x0142;owy',
	'team_handball' : 'pi&#x0142;ka r&#x0119;czna',
	'tennis' : 'tenis',
	'volleyball' : 'pi&#x0142;ka siatkowa',
};
