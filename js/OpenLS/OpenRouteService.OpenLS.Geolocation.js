OpenRouteService.OpenLS.Geolocation = Class.create(OpenRouteService.OpenLS, {
	initialize : function() {
		this.serviceUrl = OpenRouteService.namespaces.services.geocoding;
		this.schemaLocation = OpenRouteService.namespaces.schemata.locationUtilityService;
	},

	/**
	 * builds an XML request based on the given parameters which can be sent to the service.
	 * @lon: longitude of point to search for as String
	 * @lat: latitude of point to search for as String
	 * @language: language to present the results in as short String, e.g. 'en'
	 */
	buildRequest : function(lon, lat, language) {
		//initial node: <xls: XLS>
		var writer = this.getRequestWriter(language);

		//<xls:Request>
		writer.writeStartElement('xls:Request');
		writer.writeAttributeString('methodName', 'ReverseGeocodeRequest');
		writer.writeAttributeString('version', '1.1');
		writer.writeAttributeString('requestID', '00');
		writer.writeAttributeString('maximumResponses', '15');
		//<xls:ReverseGeocodeRequest>
		writer.writeStartElement('xls:ReverseGeocodeRequest');
		//<xls.Position>
		writer.writeStartElement('xls:Position');
		//<gml:Point>
		writer.writeStartElement('gml:Point');
		writer.writeAttributeString('xmlns:gml', OpenRouteService.namespaces.gml);
		//<gml:pos>
		writer.writeStartElement('gml:pos');
		writer.writeAttributeString('srsName', 'EPSG:4326');
		writer.writeString(lon + ' ' + lat);
		//</gml:pos>
		writer.writeEndElement();
		//</gml:Point>
		writer.writeEndElement();
		//</xls:Position>
		writer.writeEndElement();
		//</xls:ReverseGeocodeRequest>
		writer.writeEndElement();
		//</xls:Request>
		writer.writeEndElement();

		this.xmlRequest = this.finishRequest(writer);
	},

	/**
	 * parses the xml response to an ORS.SearchResult.Place object
	 * @param options: options for the ORS.SearchResult.Place object
	 */
	getResponse : function(options) {
		var point = OpenRouteService.Util.getElementsByTagNameNS(this.xmlResponse, OpenRouteService.namespaces.gml, 'Point')[0];
		var address = OpenRouteService.Util.getElementsByTagNameNS(this.xmlResponse, OpenRouteService.namespaces.xls, 'Address')[0];
		var position = OpenRouteService.Util.getElementsByTagNameNS(point, OpenRouteService.namespaces.gml, 'pos')[0];
		var result = new OpenRouteService.Gui.SearchResult.Place(options, point, address, position);
		return result;
	}
});
