var AccessibilityAnalysis = ( function(w) {"use strict";

		/**
		 * Constructor
		 */
		function AccessibilityAnalysis() {

		}

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

		function parseResultsToBounds(result) {
			result = result.responseXML ? result.responseXML : util.parseStringToDOM(result.responseText);
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

		function parseResultsToPolygon(result) {
			result = result.responseXML ? result.responseXML : util.parseStringToDOM(result.responseText);
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
