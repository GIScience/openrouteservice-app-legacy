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
		function analyze(position, distanceInMinutes, aasRoutePref, aasMethod, aasIntervall, successCallback, failureCallback) {
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
			//<aas:AccessibilitySettings
			writer.writeStartElement('aas:AccessibilitySettings');
			writer.writeElementString('aas:RoutePreference', aasRoutePref || 'Fastest');
			//<aas:RoutePreference>
			writer.writeElementString('aas:Method', aasMethod || 'Default');
			//<aas:Method>
			writer.writeElementString('aas:Interval', aasIntervall || '1000');
			//<aas:Intervall>                         
			//</aas:AccessibilitySettings>
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
			//</aas:AccessibilityGeometryRequest
			writer.writeEndElement();
			//</aas:DetermineAccessibilityRequest>
			writer.writeEndElement('aas:DetermineAccessibilityRequest');
			//</aas:Request>
			writer.writeEndElement();
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
				var collectionArr = util.getElementsByTagNameNS(area[0], namespaces.gml, 'Polygon', true)[0];
				
				var collectionArrGeom = [];
				for (var i=0; i<collectionArr.length; i++) {
					
					if (collectionArr[i].getElementsByTagNameNS) {

						var exteriorRing = collectionArr[i].getElementsByTagNameNS(namespaces.gml,'exterior')[0];
						var interiorRing = collectionArr[i].getElementsByTagNameNS(namespaces.gml,'interior')[0];
						
						var extIntArr = [];
						if (exteriorRing) {
							extIntArr.push(exteriorRing);
						}
						if (interiorRing) {
							console.log('interior!');
							extIntArr.push(interiorRing);
						}

						if (extIntArr.length == 1) {
							// create polygon geometry
							var poly = fetchPolygonGeometry(extIntArr[0], namespaces.gml, 'pos');

						// if interior ring in exterior ring present
						} else {
							console.log('interior!');
							var polyExt = fetchPolygonGeometry(extIntArr[0], namespaces.gml, 'pos');
							var polyInt = fetchPolygonGeometry(extIntArr[1], namespaces.gml, 'pos');

							var collectionArrGeomSmall = [polyExt,polyInt];
							// substract ext from int if array length 2 here
							var poly = substractPolygons(collectionArrGeomSmall);

						}

						collectionArrGeom.push(poly);

					}
				}
			}
			
			var collectionArrGeomSubstr = substractPolygons(collectionArrGeom);
			// substract now
			return collectionArrGeomSubstr;
		}

		/**
		 * returns a polygon geometry from gml
		 * @param element: gml element
		 * @param ns: namespace
		 * @param tag: tag to look for
		 * @return OL.Feature.Vector
		 */
		function fetchPolygonGeometry(element,ns,tag) {

			var linRingPoints = [];
			$A(util.getElementsByTagNameNS(element, ns, tag)).each(function(polygonPos) {
				polygonPos = util.convertPositionStringToLonLat(polygonPos.firstChild.nodeValue);
				polygonPos = util.convertPointForMap(polygonPos);
				polygonPos = new OpenLayers.Geometry.Point(polygonPos.lon, polygonPos.lat);
				linRingPoints.push(polygonPos);
			});

			var ring = new OpenLayers.Geometry.LinearRing(linRingPoints);
			var polyGeom = new OpenLayers.Geometry.Polygon([ring]);
			var poly = new OpenLayers.Feature.Vector(polyGeom);

			return poly;

		}

		/**
		 * substracts to polygons from each other
		 * @param geomCollection: a collection of polygon geometries, at least two
		 * @return [OL.Geometry.Polygon] representing an array of difference polygons
		 */
		function substractPolygons(geomCollection) {
			
			var collectionArrGeomSubstr = [];
			var parser = new jsts.io.OpenLayersParser();

			for (var i=geomCollection.length-1; i>=1; i--) {

				var newFeature = new OpenLayers.Feature.Vector(
			        parser.write(
			            parser.read(geomCollection[i].geometry).difference(
			                parser.read(geomCollection[i-1].geometry)
			            )
			        )
			    );
    			
    			collectionArrGeomSubstr.push(newFeature);

			}
			// push first poly also
			collectionArrGeomSubstr.push(geomCollection[0]);

			return collectionArrGeomSubstr;

		}


		AccessibilityAnalysis.prototype.analyze = analyze;
		AccessibilityAnalysis.prototype.parseResultsToBounds = parseResultsToBounds;
		AccessibilityAnalysis.prototype.parseResultsToPolygon = parseResultsToPolygon;

		return new AccessibilityAnalysis();
	}(window));
