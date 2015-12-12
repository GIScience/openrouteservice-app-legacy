/**
 * various utility methods for the site
 */
util = (function() {
    'use strict';
    var util = {
        /**
         * positions are often set as data-attributes in the Ui/ HTML file. Converts them to OpenLayers.LonLat position
         * @param positionString: String containing the coordinates
         * @return: OpenLayers.LonLat with these coordinates 
         */
        convertPositionStringToLonLat: function(positionString) {
            var pos = positionString.split(' ');
            pos = L.latLng(pos[1], pos[0]);
            return pos;
        },
        /** 
         * transform a ol point to a string with 6 decimals for lon lat each
         * @param {Object} pt: OpenLayers Point
         */
        convertPointToString: function(pt) {
            var pointLon = pt.lon.toString().split('.');
            pointLon = pointLon[0] + '.' + pointLon[1].substring(0, 6)
            var pointLat = pt.lat.toString().split('.');
            pointLat = pointLat[0] + '.' + pointLat[1].substring(0, 6)
            return (pointLon + ', ' + pointLat);
        },
        /**
         * calculates flight distance between two points
         * @param {Object} ptA: Leaflet latLng
         * @param {Object} ptB: Leaflet latLng
         * @return metric distance between points
         */
        calcFlightDistance: function(ptA, ptB) {
            return ptA.distanceTo(ptB);
        },
        /**
         * transforms a given point to the internal projection of the map
         * @param {Object} pt: OpenLayers LonLat or Point coordinates to transform
         */
        convertPointForMap: function(pt) {
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
        convertPointForMapLL: function(pt) {
            if (pt.lat && pt.lng) {
                return L.Projection.SphericalMercator.project(pt);
            }
        },
        /**
         * takes a given string and parses it to DOM objects
         * @param s: the String to parse
         * @return xml DOM object or ActiveXObject
         */
        parseStringToDOM: function(s) {
            if (typeof DOMParser != "undefined") {
                return (new DOMParser).parseFromString(s, "text/xml");
            } else if (typeof ActiveXObject != "undefined") {
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
         * @param collection: if a collection of features is to be returned
         * @return suitable elements of the given input element that match the tagName
         */
        getElementsByTagNameNS: function(element, ns, tagName, collection) {
            if (element.getElementsByTagNameNS) {
                //Firefox, Chrome
                if (collection) {
                    var collectionArr = [];
                    collectionArr.push(element.getElementsByTagNameNS(ns, tagName));
                    return collectionArr;
                }
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
        parseLatlon: function(latlon) {
            var element = new Element('li', {
                'class': 'address'
            });
            if (latlon) {
                latlon = latlon.split(' ');
                latlon = latlon[0].substring(0, 6) + ' ' + latlon[1].substring(0, 6);
                element.appendChild(new Element('span', {
                    'class': 'addressElement'
                }).update(latlon + ' '));
            }
            return element;
        },
        /**
         * parses the XML result for an address into HTML format
         * @param xmlAddress: XML encoded address result 
         * @return: address result wrapped in appropriate HTML tags
         */
        parseAddress: function(xmlAddress) {
            if (!xmlAddress) {
                return;
            }
            var element = new Element('li', {
                'class': 'address'
            });
            var v1 = util.getElementsByTagNameNS(xmlAddress, namespaces.xls, 'StreetAddress');
            var StreetAddress = null;
            if (v1 != null) {
                StreetAddress = v1[0]
            };
            var hasStreetElement = false;
            if (StreetAddress != null) {
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
                if (Streets) {
                    var streetline = 0;
                    $A(Streets).each(function(street) {
                        var officialName = street.getAttribute('officialName');
                        if (officialName != null) {
                            element.appendChild(new Element('span').update(officialName + ' '));
                            streetline++;
                        }
                    });
                }
                if (Building) {
                    var buildingNumber = Building.getAttribute('number');
                    if (buildingNumber != null) {
                        element.appendChild(new Element('span').update(buildingNumber));
                        streetline++;
                    }
                }
                if (streetline > 0) {
                    element.appendChild(new Element('br'));
                    hasStreetElement = true;
                }
            }
            var separator = '';
            var places = util.getElementsByTagNameNS(xmlAddress, namespaces.xls, 'Place');
            if (places) {
                var elemCountry = null;
                var elemMunicipalitySubdivision = null;
                var elemMunicipality = null;
                var elemCountrySecondarySubdivision = null;
                var elemCountrySubdivision = null;
                //insert the value of each of the following attributes in order, if they are present
                ['MunicipalitySubdivision', 'Municipality', 'CountrySecondarySubdivision', 'CountrySubdivision', 'Country'].each(function(type) {
                    $A(places).each(function(place) {
                        if (place.getAttribute('type') === type) {
                            //Chrome, Firefox: place.textContent; IE: place.text
                            var content = place.textContent || place.text;
                            if (content !== undefined || content !== null) {
                                if (type == 'MunicipalitySubdivision') elemMunicipalitySubdivision = content;
                                else if (type == 'Municipality') elemMunicipality = content;
                                else if (type == 'CountrySecondarySubdivision') elemCountrySecondarySubdivision = content;
                                else if (type == 'CountrySubdivision') elemCountrySubdivision = content;
                                else if (type == 'Country') elemCountry = content;
                            }
                        }
                    });
                });
                var placesText = '';
                if (hasStreetElement) {
                    var postalCode = util.getElementsByTagNameNS(xmlAddress, namespaces.xls, 'PostalCode');
                    if (postalCode[0]) {
                        placesText = placesText + postalCode[0].textContent + '  ';
                    }
                    if (elemMunicipality) placesText = placesText + elemMunicipality;
                    if (elemMunicipalitySubdivision && elemMunicipalitySubdivision != elemMunicipality) placesText = placesText + ' (' + elemMunicipalitySubdivision + ') ';
                    placesText = placesText + ', ';
                } else {
                    if (elemMunicipalitySubdivision) placesText = placesText + elemMunicipalitySubdivision + ', ';
                    if (elemMunicipality && elemMunicipality != elemMunicipalitySubdivision) placesText = placesText + elemMunicipality + ', ';
                }
                if (elemCountrySecondarySubdivision && elemCountrySecondarySubdivision != elemMunicipality) placesText = placesText + elemCountrySecondarySubdivision + ', ';
                if (elemCountrySubdivision && elemCountrySubdivision != elemCountrySecondarySubdivision && elemCountrySubdivision != elemMunicipality) placesText = placesText + elemCountrySubdivision + ', ';
                element.appendChild(new Element('span', {
                    'class': 'addressElement'
                }).update(placesText));
            }
            if (elemCountry) {
                element.appendChild(new Element('span').update(elemCountry));
            } else {
                var countryCode = xmlAddress.getAttribute('countryCode');
                if (countryCode !== null) {
                    element.appendChild(new Element('span').update(countryCode.toUpperCase()));
                }
            }
            return element;
        },
        /**
         * parses the XML result for an address into short HTML format for stopovers
         * element is an array and can contain street + region information or just region information
         * @param xmlAddress: XML encoded address result 
         * @return: address result wrapped in appropriate HTML tags for stopover field
         */
        parseAddressShort: function(address) {
            var element = [];
            //1. Address
            //2. District, City, Region
            if (address) {
                var streetAddressElement = util.getElementsByTagNameNS(address, namespaces.xls, 'StreetAddress');
                var streetAddress = null;
                var placesElement = util.getElementsByTagNameNS(address, namespaces.xls, 'Place');
                if (streetAddressElement != null) {
                    streetAddress = streetAddressElement[0]
                };
                if (streetAddress != null) {
                    element[0] = '';
                    var streets = util.getElementsByTagNameNS(streetAddress, namespaces.xls, 'Street');
                    var building = util.getElementsByTagNameNS(streetAddress, namespaces.xls, 'Building')[0];
                    //Building line
                    if (building) {
                        var buildingName = building.getAttribute('buildingName');
                        var buildingSubdivision = building.getAttribute('subdivision');
                        if (buildingName != null) {
                            element[0] += buildingName + ' ';
                        }
                        if (buildingSubdivision != null) {
                            element[0] += buildingSubdivision + ' ';
                        }
                    }
                    //Street line
                    $A(streets).each(function(street) {
                        var officialName = street.getAttribute('officialName');
                        if (officialName != null) {
                            element[0] += officialName + ' ';
                        }
                    });
                    if (building) {
                        var buildingNumber = building.getAttribute('number');
                        if (buildingNumber != null) {
                            element[0] += buildingNumber + ' ';
                        }
                    }
                    if (placesElement != null) {
                        element[1] = '';
                        var prevContent;
                        //insert the value of each of the following attributes in order, if they are present
                        var regionList = ['MunicipalitySubdivision', 'Municipality', 'CountrySecondarySubdivision', 'CountrySubdivision'];
                        regionList.each(function(type, index) {
                            $A(placesElement).each(function(place) {
                                if (place.getAttribute('type') === type) {
                                    //Chrome, Firefox: place.textContent; IE: place.text
                                    var content = place.textContent || place.text;
                                    if (content != undefined || content != null) {
                                        // remove doubles, such as city states and cities
                                        if (content != prevContent) {
                                            prevContent = content
                                            element[1] += place.textContent || place.text;
                                            element[1] += ', ';
                                        }
                                    }
                                }
                            })
                        });
                        // remove last comma
                        element[1] = element[1].substring(0, element[1].length - 2);
                    }
                } else if (placesElement != null) {
                    element[0] = '';
                    var prevContent;
                    //insert the value of each of the following attributes in order, if they are present
                    var regionList = ['MunicipalitySubdivision', 'Municipality', 'CountrySecondarySubdivision', 'CountrySubdivision'];
                    regionList.each(function(type, index) {
                        $A(placesElement).each(function(place) {
                            if (place.getAttribute('type') === type) {
                                //Chrome, Firefox: place.textContent; IE: place.text
                                var content = place.textContent || place.text;
                                if (content != undefined || content != null) {
                                    // remove doubles, such as city states and cities
                                    if (content != prevContent) {
                                        prevContent = content
                                        element[0] += place.textContent || place.text;
                                        element[0] += ', ';
                                    }
                                }
                            }
                        })
                    });
                    // remove last comma
                    element[0] = element[0].substring(0, element[0].length - 2);
                }
            }
            // remove empty item from array
            if (element[0].length == 0) {
                element.splice(0, 1);
            }
            var stopoverString = '';
            $A(element).each(function(addressItem, index) {
                if (index == 0) {
                    stopoverString += '<span class="main">' + addressItem + "</span>"
                } else {
                    stopoverString += '<span class="submain">' + addressItem + "</span>"
                }
                if (index < (element.length) - 1) {
                    stopoverString += '</br>';
                }
            });
            return stopoverString;
        },
        convertDistToMeters: function(dist, unit) {
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
        convertDistToDist: function(distance, distanceUnitSrc, distanceUnitDest) {
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
        round: function(distance) {
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
        readGetVar: function(variable) {
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
        isPoiCategory: function(term) {
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
        convertDistanceFormat: function(distance, uom) {
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