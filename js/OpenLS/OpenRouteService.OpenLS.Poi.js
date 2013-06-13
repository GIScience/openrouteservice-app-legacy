OpenRouteService.OpenLS.Poi = Class.create(OpenRouteService.OpenLS, {
	initialize : function() {
		this.serviceUrl = OpenRouteService.namespaces.services.directory;
		this.schemaLocation = OpenRouteService.namespaces.schemata.directoryService;
	},

	/**
	 * builds an XML request based on the given parameters which can be sent to the service.
	 * @language: language to present the results in as short String, e.g. 'en'
	 * @searchQuery: query the user entered in the search field as String, e.g. 'amenity'
	 * @refPoint: list of reference points for the query
	 * @maxDist: max. radius to search within for POIs
	 */
	buildRequest : function(language, searchQuery, refPoint, maxDist) {
		//initial node: <xls: XLS>
		var writer = this.getRequestWriter(language);

		//<xls:Request>
		writer.writeStartElement('xls:Request');
		writer.writeAttributeString('methodName', 'DirectoryRequest');
		writer.writeAttributeString('version', '1.1');
		writer.writeAttributeString('requestID', '00');
		writer.writeAttributeString('maximumResponses', '100');
		//<xls:DirectoryRequest>
		writer.writeStartElement('xls:DirectoryRequest');
		writer.writeAttributeString('distanceUnit', 'M');
		writer.writeAttributeString('sortCriteria', 'Distance');

		//we are only allowed to include the position + distance if we are NOT searching for a POI by name (free text)
		var generalTermSearchQuery = OpenRouteService.Preferences.reverseTranslate(searchQuery);
		if (null != OpenRouteService.Util.isPoiCategory(generalTermSearchQuery)) {
			//<xls:POILocation>
			writer.writeStartElement('xls:POILocation');

			if (refPoint.length == 1) {
				this.buildRequestSearchOnScreen(writer, refPoint[0], maxDist);
			} else {
				this.buildRequestSearchNearRoute(writer, refPoint);
			}
			//</xls:POILocation>
			writer.writeEndElement();
		}
		//<xls:POIProperties>
		writer.writeStartElement('xls:POIProperties');
		writer.writeAttributeString('directoryType', 'OSM');
		//<xls:POIProperty />
		writer.writeStartElement('xls:POIProperty');
		var isCategory = OpenRouteService.Util.isPoiCategory(generalTermSearchQuery);
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

		this.xmlRequest = this.finishRequest(writer);
	},
	/**
	 * private function, only to be called by buildRequest()! 
	 * includes necessary request elements if we are searching for POIs on the visible map tiles/ on screen
	 * @param writer: XMLWriter to append elements to
	 * @param refPoint: point to base search on (= center of visible map)
	 * @param maxDist: maximum distance how far away from refPoint to search for POIs
	 */
	buildRequestSearchOnScreen : function(writer, refPoint, maxDist) {
		var distanceUnit;
		if (OpenRouteService.Preferences.distanceUnit.indexOf('yd') != -1 || OpenRouteService.Preferences.distanceUnit.indexOf('YD') != -1) {
			distanceUnit = 'YD';
		} else {
			distanceUnit = 'M';
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
	},
	/**
	 * private function, only to be called by buildRequest()! 
	 * includes necessary request elements if we are searching for POIs near a given route
	 * @param writer: XMLWriter to append elements to
	 * @param refPoint: list of points to search for POIs within
	 */
	buildRequestSearchNearRoute : function(writer, refPoint) {
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
	},
	/**
	 * parses the xml response to ORS.SearchResult.Poi objects
	 * @param options: options to apply to the resulting objects (ORS.SearchResult.Poi)
	 * @param resultClickOperation: resultClickOperation to assign to the resulting objects (ORS.SearchResult.Poi)
	 * @return list of ORS.SearchResult.Poi objects
	 */
	getResponse : function(options, resultClickOperation) {
		var searchResults = [];
		if (this.xmlResponse) {
			var geocodeResponseList = OpenRouteService.Util.getElementsByTagNameNS(this.xmlResponse, OpenRouteService.namespaces.xls, 'DirectoryResponse');
			$A(geocodeResponseList).each(function(poiResponse) {
				$A(OpenRouteService.Util.getElementsByTagNameNS(poiResponse, OpenRouteService.namespaces.xls, 'POIContext')).each(function(geocodedAddress) {
					var description = OpenRouteService.Util.getElementsByTagNameNS(geocodedAddress, OpenRouteService.namespaces.xls, 'POI')[0];
					description = description.getAttribute("description");
					description = description.substring(0, description.indexOf(';'));

					var result = new OpenRouteService.Gui.SearchResult.Poi(options, geocodedAddress, description);
					searchResults.push(result);
					result.setResultClickOperation(resultClickOperation);
				});
			});
		}
		return searchResults;
	}
});
