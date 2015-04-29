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

				var v1 = util.getElementsByTagNameNS(xmlAddress, namespaces.xls, 'StreetAddress');
				var StreetAddress = null;
				
				if (v1 != null) {
				   StreetAddress = v1 [0]};
				if (StreetAddress != null){
				var Streets = util.getElementsByTagNameNS(StreetAddress, namespaces.xls, 'Street');
				var Building = util.getElementsByTagNameNS(StreetAddress, namespaces.xls, 'Building')[0];
				
				
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
				}
				
				var places = util.getElementsByTagNameNS(xmlAddress, namespaces.xls, 'Place');
				var postalCode = util.getElementsByTagNameNS(xmlAddress, namespaces.xls, 'PostalCode');

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
					var v1 = util.getElementsByTagNameNS(address, namespaces.xls, 'StreetAddress');
					var streetAddress = null;
					if (v1 != null) {
					   streetAddress = v1 [0]};
					if (streetAddress != null){
					
					var streets = util.getElementsByTagNameNS(streetAddress, namespaces.xls, 'Street');
					var building = util.getElementsByTagNameNS(streetAddress, namespaces.xls, 'Building')[0];
					
					
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
					
					}
					
					var places = util.getElementsByTagNameNS(address, namespaces.xls, 'Place');
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
