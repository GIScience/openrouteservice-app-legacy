/**
 * various utility methods for getting and setting attributes
 */
( function() {
		var namespaces;
		function updateNS() {
			namespaces = OpenRouteService.namespaces
		};

		OpenRouteService.Util = {
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
			 * takes a given XML document and serializes it to a String
			 */
			serializeToString : function(doc) {
				if (window.XMLSerializer) {
					return new XMLSerializer().serializeToString(doc)
				} else {
					return doc.transformNode(doc);
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
			 * test if the given URL exists
			 * @param url: url to check
			 * @return: true, if file exists
			 */
			doesFileExist : function(url) {
				var http = new XMLHttpRequest();
				http.open('HEAD', url, false);
				http.send();
				return http.status == 200;
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
					case "KM":
						distanceInMeters = dist * 1000;
						break;
					case "mi":
					case "MI":
						distanceInMeters = dist * 1609.344;
						break;
					case "yd":
					case "YD":
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

				var distanceInMeters = OpenRouteService.Util.convertDistToMeters(distance, distanceUnitSrc);

				switch (distanceUnitDest) {
					case "km":
					case "KM":
						specificDistance = distanceInMeters / 1000;
						break;
					case "mi":
					case "MI":
						specificDistance = distanceInMeters / 1609.344;
						break;
					case "yd":
					case "YD":
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
			 * reads a given file and returns the content as string
			 */
			readFile : function(file) {
				if (file && !(window.File && window.FileReader && window.FileList && window.Blob)) {
					// File APIs are not supported or file argument is not defined
					return null;
				}
				var done = false;
				var r = new FileReader();
				var value;
				r.readAsText(file);
				r.onload = function(e) {
					value = 5;
				};
				value = 4;
				return r.results;
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
				var typeCategories = OpenRouteService.List.poiTypes.keys();
				for (var i = 0; i < typeCategories.length; i++) {
					var cat = typeCategories[i];
					if (term == cat) {
						return true;
					}

					var detailedTypes = OpenRouteService.List.poiTypes.get(cat);
					for (var j = 0; j < detailedTypes.length; j++) {
						if (detailedTypes[j] == term) {
							return false;
						}
					}
				}
				//term is neither category nor type
				return null;
			}
		}
	}());
