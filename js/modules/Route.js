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
		 * @param avoidunpavedRoads: flag set to true if unpaved roads should be avoided in the route; else: false
		 * @param avoidFerry: flag set to true if ferrys should be avoided in the route; else: false
		 * @param avoidAreas: array of avoid areas represented by OL.Geometry.Polygons
		 */
		function calculate(routePoints, successCallback, failureCallback, language, routePref,extendedRoutePreferencesParams, extendedRoutePreferencesType, avoidMotorways, avoidTollways,avoidunpavedRoads,avoidFerry, avoidSteps, avoidAreas, extendedRoutePreferencesWeight, calcRouteID) {


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
			writer.writeElementString('xls:RoutePreference', routePref || 'Car');
			
			writer.writeStartElement('xls:ExtendedRoutePreference');

			writer.writeElementString('xls:WeightingMethod', extendedRoutePreferencesWeight || 'Fastest');

			if (extendedRoutePreferencesParams != null ) {
				//<xls:ExtendedRoutePreference>
				
				if (routePref == 'HeavyVehicle') {

					if (extendedRoutePreferencesType != null ) {

						writer.writeElementString('xls:VehicleType', extendedRoutePreferencesType);

					}

					//truck width
					 if (extendedRoutePreferencesParams[3] != null) {
						 writer.writeElementString('xls:Width', extendedRoutePreferencesParams[3]);
					 }
					 //truck heigth
					 if (extendedRoutePreferencesParams[1] != null) {
						 writer.writeElementString('xls:Height', extendedRoutePreferencesParams[1]);
					 }
					 //truck weigth
					 if (extendedRoutePreferencesParams[2] != null) {
						 writer.writeElementString('xls:Weight', extendedRoutePreferencesParams[2]);
					 }
					 //truck length
					if (extendedRoutePreferencesParams[0] != null) {
						writer.writeElementString('xls:Length', extendedRoutePreferencesParams[0]);
					}
					//truck hazardous
					if (extendedRoutePreferencesParams[4] != null) {
						writer.writeStartElement('xls:LoadCharacteristics');
							writer.writeElementString('xls:LoadCharacteristic', extendedRoutePreferencesParams[4]);
						writer.writeEndElement();
					}

				}
				
				if (routePref === 'Wheelchair') {
					//tracktype
					if (extendedRoutePreferencesParams[2] != null) {
						writer.writeStartElement('xls:trackTypes');
						writer.writeElementString('xls:trackType', extendedRoutePreferencesParams[2]);
						writer.writeEndElement();
					}
					//surface
					if (extendedRoutePreferencesParams[0] != null) {
						writer.writeStartElement('xls:surfaceTypes');
						writer.writeElementString('xls:surfaceType', extendedRoutePreferencesParams[0]);
						writer.writeEndElement();
					}
					//smoothness
					if (extendedRoutePreferencesParams[1] != null) {
						writer.writeStartElement('xls:smoothnessTypes');
						writer.writeElementString('xls:smoothnessType', extendedRoutePreferencesParams[1]);
						writer.writeEndElement();
					}
					//incline
					if (extendedRoutePreferencesParams[3] != null) {
						writer.writeElementString('xls:incline', extendedRoutePreferencesParams[3]);
					}
					//sloped curb
					if (extendedRoutePreferencesParams[4] != null) {
						writer.writeElementString('xls:slopedCurb', extendedRoutePreferencesParams[4]);
					}
				}
				//</xls:ExtendedRoutePreference>
			}

			writer.writeEndElement();




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
			if (avoidunpavedRoads) {
				writer.writeElementString('xls:AvoidFeature', 'Unpavedroads');
			}
			if (avoidFerry) {
				writer.writeElementString('xls:AvoidFeature', 'Ferry');
			}
			if (avoidSteps) {
				writer.writeElementString('xls:AvoidFeature', 'Steps');
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


			// var request = OpenLayers.Request.POST({
			// 	url : namespaces.services.routing,
			// 	data : xmlRequest,
			// 	success : successCallback,
			// 	failure : failureCallback
			// });

			

			jQuery.ajaxPrefilter(function( options ) {
				if ( options.crossDomain ) {
					options.url = "http://localhost/cgi-bin/proxy.cgi?url=" + encodeURIComponent( options.url );
					options.crossDomain = false;
				}
			});

			// for localhost testing, set crossDomain to true
			jQuery.ajax({
				url: namespaces.services.routing,
				processData: false,
				type: "POST",
				dataType: "xml",
				crossDomain: true,
				data: xmlRequest, 
				success: function(response){
					successCallback(response,calcRouteID)
				},
				error: function(response) {
					failureCallback(response) 
				}
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
