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
