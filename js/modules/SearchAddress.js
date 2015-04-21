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
