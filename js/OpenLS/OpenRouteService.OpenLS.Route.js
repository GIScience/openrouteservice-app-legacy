OpenRouteService.OpenLS.Route = Class.create(OpenRouteService.OpenLS, {
	initialize : function() {
		this.serviceUrl = OpenRouteService.namespaces.services.routing;
		this.schemaLocation = OpenRouteService.namespaces.schemata.routeService;
	},

	/**
	 * builds an XML request based on the given parameters which can be sent to the service.
	 * @address: address, city name, etc. to search for as String
	 * @language: language to present the results in as short String, e.g. 'en'
	 */
	buildRequest : function(routePlan, language) {
		var wayPointList = routePlan.wayPointList;
		if (!wayPointList || wayPointList.length < 2) {
			//no use requesting a route without enough waypoints. This should never happen!
			return;
		}

		//initial node: <xls: XLS>
		var writer = this.getRequestWriter(language);

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
		writer.writeElementString('xls:RoutePreference', routePlan.routePreference || 'Fastest');
		//<xls:WayPointList>
		writer.writeStartElement('xls:WayPointList');
		for (var i = 0; i < wayPointList.length; i++) {
			if (i == 0) {
				writer.writeStartElement('xls:StartPoint');
			} else if (i == (wayPointList.length - 1)) {
				writer.writeStartElement('xls:EndPoint');
			} else {
				writer.writeStartElement('xls:ViaPoint');
			}
			this.generateRequestForWaypoint(wayPointList[i], writer);
			writer.writeEndElement();
		};
		//</xls:WayPointList>
		writer.writeEndElement();
		//<xls:AvoidList>
		writer.writeStartElement('xls:AvoidList');
		if (routePlan.avoidAreas) {
			//avoidAreas contains an array of OpenLayers.Feature.Vector
			for (var i = 0; i < routePlan.avoidAreas.length; i++) {
				var currentArea = routePlan.avoidAreas[i];
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
		if (routePlan.avoidMotorways) {
			writer.writeElementString('xls:AvoidFeature', 'Highway');
		}
		if (routePlan.avoidMotorways) {
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

		this.xmlRequest = this.finishRequest(writer);
	},

	/**
	 * Note: private function! To be called by buildRequest() only!
	 * writes the necessary XML request elements for the given waypoint
	 * @waypoint: gml-representation of the waypoint
	 * @writer: XMLWriter which writes the information to an XML document
	 */
	generateRequestForWaypoint : function(waypoint, writer) {
		//<xls:Position>
		writer.writeStartElement('xls:Position');
		//<gml:Point>
		writer.writeStartElement('gml:Point');
		writer.writeAttributeString('xmlns:gml', OpenRouteService.namespaces.gml)
		//<gml:pos />
		writer.writeStartElement('gml:pos');
		writer.writeAttributeString('srsName', 'EPSG:4326');
		var coordinates = waypoint.text;
		if (coordinates == undefined) {
			//will be the case for Chrome and Firefox, but not IE
			coordinates = waypoint.firstElementChild.firstChild.nodeValue
		}
		writer.writeString(coordinates);
		writer.writeEndElement();
		//</gml:Point>
		writer.writeEndElement();
		//</xls:Position>
		writer.writeEndElement();
	},

	/**
	 * parses the XML response and directly applies necessary changes to the given ORS.Gui.Route object
	 * @param route: ORS.Gui.Route object to operate on
	 */
	getResponse : function(route) {
		var namespaces = OpenRouteService.namespaces;
		var mapRepresentation = route.map.getLayersByName(OpenRouteService.Map.ROUTE_LINES)[0];
		if (this.xmlResponse) {
			var routeGeometry = OpenRouteService.Util.getElementsByTagNameNS(this.xmlResponse, namespaces.xls, 'RouteGeometry')[0];
			if (routeGeometry) {
				route.gmlRepresentation = OpenRouteService.Util.getElementsByTagNameNS(routeGeometry, namespaces.gml, 'pos');
			}
			route.olRepresentation = [];
			$A(route.gmlRepresentation).each(function(pos) {
				route.olRepresentation.push(OpenRouteService.convert.gml2ol.pos2point(pos, route.options.map.getProjection()));
			});

			mapRepresentation.removeAllFeatures();
			route.lineString = new OpenLayers.Geometry.LineString(route.olRepresentation);
			route.feature = new OpenLayers.Feature.Vector(route.lineString, null);
			mapRepresentation.addFeatures([route.feature]);

			var routeSummary = OpenRouteService.Util.getElementsByTagNameNS(this.xmlResponse, namespaces.xls, 'RouteSummary');
			var routeInstructions = OpenRouteService.Util.getElementsByTagNameNS(this.xmlResponse, namespaces.xls, 'RouteInstruction');

			var distUnit = OpenRouteService.Preferences.distanceUnit;
			if (routeSummary != null && routeSummary.length > 0) {
				var summaryTime = OpenRouteService.Util.getElementsByTagNameNS(routeSummary[0], namespaces.xls, 'TotalTime')[0];
				summaryTime = summaryTime.textContent || summaryTime.text;
				var summaryDistance = OpenRouteService.Util.getElementsByTagNameNS(routeSummary[0], namespaces.xls, 'TotalDistance')[0];
				route.RouteSummary = new OpenRouteService.Gui.Collapsible.RouteSummary(summaryTime, summaryDistance, distUnit);
				if (route.RouteSummaryContainer.firstChild) {
					route.RouteSummaryContainer.firstChild.remove();
				}
				route.RouteSummaryContainer.appendChild(route.RouteSummary.htmlRepresentation);
				route.RouteSummaryContainer.show();
			} else {
				route.RouteSummaryContainer.hide();
			}
			if (routeInstructions != null && routeInstructions.length > 0) {
				var routeInstructionsList = [];
				$A(routeInstructions).each(function(routeInstruction) {
					var instruction = OpenRouteService.Util.getElementsByTagNameNS(routeInstruction, namespaces.xls, 'Instruction')[0];
					var distance = OpenRouteService.Util.getElementsByTagNameNS(routeInstruction, namespaces.xls, 'distance')[0];
					var lineString = OpenRouteService.Util.getElementsByTagNameNS(routeInstruction, namespaces.gml, 'LineString')[0];
					var pos = OpenRouteService.Util.getElementsByTagNameNS(routeInstruction, namespaces.gml, 'pos')[0];
					var description = routeInstruction.getAttribute('description').split(' ').reverse()[0];

					var instructionObj = new OpenRouteService.Gui.Instruction(instruction, distance, lineString, pos, description, distUnit, route);
					routeInstructionsList.push(instructionObj);
				});
				route.RouteInstructions = new OpenRouteService.Gui.Collapsible.RouteInstructions(route.options, routeInstructionsList, route);
				if (route.RouteInstructionsContainer.firstChild) {
					route.RouteInstructionsContainer.firstChild.remove();
				}
				route.RouteInstructionsContainer.appendChild(route.RouteInstructions.htmlRepresentation);
				route.RouteInstructionsContainer.show();
			} else {
				//no route instructions available
				route.RouteInstructionsContainer.hide();
				if (route.routeInstructionsLayer != null) {
					route.routeInstructionsLayer.removeAllFeatures();
				}
				mapRepresentation.removeAllFeatures();
				this.hasErrors = true;
			}
		} else {
			//if we have no/ empty response from the service
			this.hasErrors = true;

			route.gmlRepresentation = null;
			route.olRepresentation = [];
			mapRepresentation.removeAllFeatures();
			route.hide();
			route.RouteInstructionsContainer.hide();
			route.RouteSummaryContainer.hide();
		}
		route.routePresent = !this.hasErrors;
	}
});
