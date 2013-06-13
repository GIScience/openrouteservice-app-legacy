OpenRouteService.OpenLS.Geocode = Class.create(OpenRouteService.OpenLS, {
	initialize : function() {
		this.serviceUrl = OpenRouteService.namespaces.services.geocoding;
		this.schemaLocation = OpenRouteService.namespaces.schemata.locationUtilityService;
	},

	/**
	 * builds an XML request based on the given parameters which can be sent to the service.
	 * @address: address, city name, etc. to search for as String
	 * @language: language to present the results in as short String, e.g. 'en'
	 */
	buildRequest : function(address, language) {
		//initial node: <xls: XLS>
		var writer = this.getRequestWriter(language);
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

		this.xmlRequest = this.finishRequest(writer);
	},

	/**
	 * parses the xml response to ORS.SearchResult.Place objects
	 * @param options: options to apply to the resulting objects (ORS.SearchResult.Place)
	 * @param resultClickOperation: resultClickOperation to assign to the resulting objects (ORS.SearchResult.Place)
	 * @return list of ORS.SearchResult.Place objects
	 */
	getResponse : function(options, resultClickOperation) {
		var searchResults = [];
		if (this.xmlResponse) {
			var geocodeResponseList = OpenRouteService.Util.getElementsByTagNameNS(this.xmlResponse, OpenRouteService.namespaces.xls, 'GeocodeResponseList');

			var europeBbox = new OpenLayers.Bounds(-31.303, 34.09, 50.455, 71.869).transform(
				new OpenLayers.Projection("EPSG:4326"),
				new OpenLayers.Projection("EPSG:900913")
			);

			$A(geocodeResponseList).each(function(geocodeResponse) {
				$A(OpenRouteService.Util.getElementsByTagNameNS(geocodeResponse, OpenRouteService.namespaces.xls, 'GeocodedAddress')).each(function(geocodedAddress) {
					var point = OpenRouteService.Util.getElementsByTagNameNS(geocodedAddress, OpenRouteService.namespaces.gml, 'Point')[0];
					var position = OpenRouteService.Util.getElementsByTagNameNS(point, OpenRouteService.namespaces.gml, 'pos')[0];
					var address = OpenRouteService.Util.getElementsByTagNameNS(geocodedAddress, OpenRouteService.namespaces.xls, 'Address')[0];
					var result = new OpenRouteService.Gui.SearchResult.Place(options, point, address, position);

					if (europeBbox.containsLonLat(result.lonlat)) {
						searchResults.push(result);
						result.setResultClickOperation(resultClickOperation);	
					}
				});
			});
		}
		return searchResults;
	}
});
