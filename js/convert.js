/**
 * contains methods to convert objects from one format into another. Supported conversions are:
 * - GML to OpenLayers
 * - OpenLayers to GML
 * - distance measures to a humen readable format
 * - XLS to HTML
 */

convert = ( function() {'use strict';
		var convert = this;


		var convert = {
			//gml to OpenLayers
			gml2ol : {
				pos2lonLat : function(pos, srsOutput) {
					var srsInput = pos.getAttribute('srsName') || 'EPSG:4326';
					window.pos = pos;

					//var position = pos.textContent.split(' ');
					var position = pos.childNodes[0].nodeValue.split(' ');

					var positionLonLat = new OpenLayers.LonLat(position[0], position[1]).transform(new OpenLayers.Projection(srsInput), new OpenLayers.Projection(srsOutput));

					return positionLonLat;
				},
				pos2point : function(pos, srsOutput) {
					var srsInput = pos.getAttribute('srsName') || 'EPSG:4326';
					//var positionText = OpenRouteService.Util.getTextContent(pos);
					var positionText = pos.childNodes[0].nodeValue;
					window.pos = pos;
					window.pt = positionText;
					var position = positionText.split(' ');
					//var position = pos.textContent.split(' ');

					var positionPoint = new OpenLayers.Geometry.Point(position[0], position[1]).transform(new OpenLayers.Projection(srsInput), new OpenLayers.Projection(srsOutput));

					return positionPoint;
				},
				lineString2lineString : function(lineString, srsOutput) {
					var self = this;
					if (lineString.getElementsByTagNameNS) {
						var positions = lineString.getElementsByTagNameNS(namespaces.gml, 'pos');
					} else {//IE hack
						var positions = lineString.getElementsByTagName('gml:pos');
					}
					var points = [];
					$A(positions).each(function(pos) {
						points.push(convert.gml2ol.pos2point(pos, srsOutput));
					});
					return new OpenLayers.Geometry.LineString(points);
				}
			},
			//OpenLayers to gml
			ol2gml : {
				point2pos : function(point, srsInput, srsOutput) {
					//var docString = '<xls:XLS  xmlns:gml="http://www.opengis.net/gml"><xls:RequestHeader/></xls:XLS>';
					//var doc = OpenRouteService.Util.parseStringToDOM(docString);
					//var element = doc.createElementNS("http://www.opengis.net/gml", 'pos');
					//element.setAttribute('srsName', srsOutput);
					//var newPoint = point.clone();
					//newPoint.transform(new OpenLayers.Projection(srsInput), new OpenLayers.Projection(srsOutput));
					//window.newPoint = newPoint;
					//element.textContent = newPoint.x + ' ' + newPoint.y;

					//var posString = '<gml:pos xmlns:gml="http://www.opengis.net/gml" srsName="'+srsOutput+'">5.5842907 51.0090055</gml:pos>'
					//var newPoint = point.clone().transform(new OpenLayers.Projection('srsInput'), new OpenLayers.Projection('srsOutput'));
					//var pos = OpenRouteService.Util.parseStringToDOM(posString)//.textContent = (point.x +' '+point.y);
					//return pos;
					//window.element = element;
					//return element;
				},
				point2point : function(point, srsInput, srsOutput) {
					//window.np = this.point.cloneNode(true);
					//var docString = '<xls:XLS  xmlns:gml="http://www.opengis.net/gml"><xls:RequestHeader/></xls:XLS>';
					//var doc = OpenRouteService.Util.parseStringToDOM(docString);
					//var element = doc.createElementNS("http://www.opengis.net/gml", 'Point');
					//doc.firstChild.appendChild(element);
					//element.appendChild(this.point2pos(point, srsInput, srsOutput));
					//window.doc = doc;
					//return element;
				}
			},

			units : {
				//convert a distance to an easy to read format.
				//params:
				//distance - a number
				//uom - one of m/km, yd/mi
				// distance2hr : function(distance, uom) {
					// distance = parseFloat(distance)
					// if (uom == OpenRouteService.List.distanceUnitsRoute[0]) {
						// if (distance >= 1000) {
							// uom = 'k';
							// distance = distance / 1000;
							// distance = util.round(distance);
						// } else {
							// uom = 'M';
						// }
						// distance = util.round(distance);
						// return [distance, uom];
					// } else if (uom == OpenRouteService.List.distanceUnitsRoute[1]) {
						// if (distance >= 1760) {
							// uom = 'MI';
							// distance = distance / 1760;
							// distance = util.round(distance);
						// } else {
							// uom = 'YD';
						// }
						// return [distance, uom];
					// }
				// }
			},

			//xls to html
			xls2html : {
				/**
				 * used to display address search results in the address search area
				 */
				address2div : function(address) {
					var element = new Element('li', {
						'class' : 'address'
					});

					var StreetAddress = util.getElementsByTagNameNS(address, namespaces.xls, 'StreetAddress')[0];
					var Streets = util.getElementsByTagNameNS(StreetAddress, namespaces.xls, 'Street');
					var Building = util.getElementsByTagNameNS(StreetAddress, namespaces.xls, 'Building')[0];
					var places = util.getElementsByTagNameNS(address, namespaces.xls, 'Place');
					var postalCode = util.getElementsByTagNameNS(address, namespaces.xls, 'PostalCode');

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
					if (address) {
						var countryCode = address.getAttribute('countryCode');
						if (countryCode != null) {
							element.appendChild(new Element('span').update(', ' + countryCode.toUpperCase()));
						}
					}
					return element;
				},
				/**
				 * generates one single string of the address
				 */
				address2shortText : function(address) {
					var element = "";

					var StreetAddress = util.getElementsByTagNameNS(address, namespaces.xls, 'StreetAddress')[0];
					var Streets = util.getElementsByTagNameNS(StreetAddress, namespaces.xls, 'Street');
					var Building = util.getElementsByTagNameNS(StreetAddress, namespaces.xls, 'Building')[0];
					var places = util.getElementsByTagNameNS(address, namespaces.xls, 'Place');

					//Building line
					if (Building) {
						var buildingName = Building.getAttribute('buildingName');
						var buildingSubdivision = Building.getAttribute('subdivision');
						if (buildingName != null) {
							element += buildingName + ' ';
						}
						if (buildingSubdivision != null) {
							element += buildingSubdivision + ' ';
						}
					}

					//Street line
					$A(Streets).each(function(street) {
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

					return element;
				},
				/**
				 * used to display POI search results in the POI search area
				 */
				poi2div : function(poi, poisNearRoute, distanceUnit) {
					var element = new Element('li', {
						'class' : 'address'
					});

					var poiElement = util.getElementsByTagNameNS(poi, namespaces.xls, 'POI')[0];
					var poiName = poiElement.getAttribute('POIName');

					var poiDesc = poiElement.getAttribute('description');
					poiDesc = poiDesc.substring(0, poiDesc.indexOf(';'));
					poiDesc = OpenRouteService.Preferences.translate(poiDesc);
					poiDesc = poiDesc.length > 1 ? ' (' + poiDesc + ')' : '';

					//if neither poiName nor poiDesc is given -> display "untitled"
					poiName = poiName.length + poiDesc.length == 0 ? OpenRouteService.Preferences.translate('untitled') : poiName;

					element.appendChild(new Element('span').update(poiName + poiDesc));

					if (!poisNearRoute) {
						var distElement = util.getElementsByTagNameNS(poi, namespaces.xls, 'Distance')[0];
						var poiDist = distElement.getAttribute('value');
						var distanceUnitSrc = distElement.getAttribute('uom');
						var dist = util.convertDistToDist(poiDist, distanceUnitSrc, distanceUnit);
						element.appendChild(new Element('span').update(', ' + dist + ' ' + distanceUnit));
					}
					return element;
				},
				/**
				 * generates one single string of the POI result
				 */
				poi2shortText : function(poi) {
					var poiElement = util.getElementsByTagNameNS(poi, namespaces.xls, 'POI')[0];
					var poiName = poiElement.getAttribute('POIName');

					var poiDesc = poiElement.getAttribute('description');
					poiDesc = poiDesc.substring(0, poiDesc.indexOf(';'));
					poiDesc = OpenRouteService.Preferences.translate(poiDesc);
					poiDesc = poiDesc.length > 1 ? ' (' + poiDesc + ')' : '';

					//if neither poiName nor poiDesc is given -> display "untitled"
					poiName = poiName.length + poiDesc.length == 0 ? OpenRouteService.Preferences.translate('untitled') : poiName;

					return poiName + poiDesc;
				}
			}
		}
		return convert;
	}());
