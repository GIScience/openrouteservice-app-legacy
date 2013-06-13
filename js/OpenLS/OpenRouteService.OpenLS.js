/**
 * sneds XML requests to services for route calculation, geocoding and POI search
 * The requests differ in the XML structure that is requierd to send a valid request.
 * Parts that can be used by all request types are specified in the main class OpenLS, parts that differ are implemented in the child classes.
 */
OpenRouteService.OpenLS = Class.create({
	
	/**
	 * XML request that is sent to the service
	 */
	xmlRequest : null,
	/**
	 * XML response from the service 
	 */
	xmlResponse : null,
	
	/**
	 * did any errors occur during the request? e.g. a 404 response
	 */
	hasErrors : false,
	
	/**
	 * generates a new XML Writer and the basic XML document node for the request
	 * Note: call finishRequest() to close the document and the writer
	 * @language: language to present the results in as short String, e.g. 'en'
	 * @return: XMLWriter object
	 */
	getRequestWriter : function(language) {
		var ns = OpenRouteService.namespaces;

		var writer = new XMLWriter('UTF-8', '1.0');
		writer.writeStartDocument();
		//<xls:XLS>
		writer.writeElementString('xls:XLS');
		writer.writeAttributeString('xmlns:xls', ns.xls);
		writer.writeAttributeString('xsi:schemaLocation', this.schemaLocation);
		writer.writeAttributeString('xmlns:sch', ns.ascc);
		writer.writeAttributeString('xmlns:gml', ns.gml);
		writer.writeAttributeString('xmlns:xlink', ns.xlink);
		writer.writeAttributeString('xmlns:xsi', ns.xsi);
		writer.writeAttributeString('version', '1.1');
		writer.writeAttributeString('xls:lang', language);
		//<xls:RequestHeader />
		writer.writeElementString('xls:RequestHeader');

		return writer;
	},
	/**
	 * uses the given XMLWriter to finish the XML document and return its XML string
	 * Note: pendant to getRequestWriter()
	 * @writer: XMLWriter to operate on
	 * @return: String with XML request
	 */
	finishRequest : function(writer) {
		//</xls:XLS>
		writer.writeEndDocument();

		var xmlRequest = writer.flush();
		writer.close();

		return xmlRequest;
	},

	/**
	 * sends the request (built in the child classes) to the service (url also given in the child class)
	 */
	requestData : function(successCallback) {
		var self = this;
		var requestCallback = function() {
			//bind the response in the class variable
			if (request.responseXML) {
			self.xmlResponse = request.responseXML;
			} else {
				//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
				self.xmlResponse = OpenRouteService.Util.parseStringToDOM(request.responseText);
			}
			
			if (request.status != 200 || !self.xmlResponse) {
				// do something to calm the user
				self.hasErrors = true;
			}
		};

		var request = OpenLayers.Request.POST({
			url : this.serviceUrl,
			data : this.xmlRequest,
			callback : requestCallback,
			success : successCallback
		});
	}
});