OpenRouteService.OpenLS.ReverseGeocode = Class.create(OpenRouteService.OpenLS, {
	initialize : function() {
		this.serviceUrl = OpenRouteService.namespaces.services.geocoding;
		this.schemaLocation = OpenRouteService.namespaces.schemata.locationUtilityService;
	},

	/**
	 * builds an XML request based on the given parameters which can be sent to the service.
	 * @point: point to search for as XXX
	 * @language: language to present the results in as short String, e.g. 'en'
	 */
	buildRequest : function(point, language) {
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
		var coordinates = point.text;
		if (coordinates == undefined) {
			//will be the case for Chrome and Firefox, but not IE
			coordinates = point.firstElementChild.firstChild.nodeValue
		}
		writer.writeString(coordinates);
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
	 * parses the XML response and directly applies necessary changes to the given ORS.Gui.Waypoint object
	 * @param waypoint: ORS.Gui.Waypoint object to operate on
	 */
	getResponse : function(waypoint) {
		var address = OpenRouteService.Util.getElementsByTagNameNS(this.xmlResponse, OpenRouteService.namespaces.xls, 'Address')[0];
		waypoint.shortTextRepresentation = OpenRouteService.convert.xls2html.address2shortText(address);

		var addressDiv = OpenRouteService.convert.xls2html.address2div(address);
		addressDiv.insert(new Element('hr'));

		//and insert it in all the appropriate places
		waypoint.searchResult.replace(addressDiv);
		waypoint.searchResult = addressDiv;

		//make sure our htmlRepresentation isn't highlighted anymore
		waypoint.htmlRepresentation.removeClassName('highlight');
		
		//start highlighting on mouseover
		addressDiv.observe('mouseover', function() {
			if (waypoint.mapRepresentation) {
				waypoint.route.layerRoutePoints.selectWaypoint.select(waypoint.mapRepresentation);
			}
		});
		//stop highlighting on mouseout
		addressDiv.observe('mouseout', function() {
			if (waypoint.mapRepresentation) {
				waypoint.route.layerRoutePoints.selectWaypoint.unselect(waypoint.mapRepresentation);
			}
		});
	}
}); 