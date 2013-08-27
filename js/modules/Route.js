var Route = ( function(w) {"use strict";

		/**
		 * Constructor
		 */
		function Route() {
			this.routePresent = false;
		}

		function calculate(routePoints, successCallback, failureCallback, language, routePref, reoutePrefDetail, avoidMotorways, avoidTollways, avoidAreas) {
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
						//TODO
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

			console.log(xmlRequest);

			var request = OpenLayers.Request.POST({
			url : namespaces.services.routing,
			data : xmlRequest,
			success : successCallback,
			failure : failureCallback
			});

		}
		
		function parseResultsToPoints(results) {
			var listOfPoints = [];
			
			var routeGeometry = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteGeometry')[0];
			if (routeGeometry) {
				var routeElements = util.getElementsByTagNameNS(routeGeometry, namespaces.gml, 'pos');
				$A(routeElements).each(function (routeElement) {
					var pt = routeElement.textContent;
					pt = pt.split(' ');
					pt = new OpenLayers.LonLat(pt[0], pt[1]);
					listOfPoints.push(pt);
				});
			}
			return listOfPoints;
		}
		
		function parseResultsToSummary(results) {
			//TODO
		}
		
		function parseResultsToInstructions(results) {
			//TODO
		}

		Route.prototype.calculate = calculate;
		Route.prototype.parseResultsToPoints = parseResultsToPoints;

		return new Route();
	}(window));
