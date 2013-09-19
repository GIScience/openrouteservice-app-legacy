namespaces = {
	xls : 'http://www.opengis.net/xls',
	sch : 'http://www.ascc.net/xml/schematron',
	gml : 'http://www.opengis.net/gml',
	wps : 'http://www.opengis.net/wps/1.0.0',
	ows : 'http://www.opengis.net/ows/1.1',
	xlink : 'http://www.w3.org/1999/xlink',
	xsi : 'http://www.w3.org/2001/XMLSchema-instance',
	ascc : 'http://www.ascc.net/xml/schematron'
};

namespaces.schemata = {
	directoryService : 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/DirectoryService.xsd',
	gatewayService : 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/GatewayService.xsd',
	locationUtilityService : 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/LocationUtilityService.xsd',
	presentationService : 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/PresentationService.xsd',
	routeService : 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/RouteService.xsd',
	wpsService : 'http://www.opengis.net/xls http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd',
	lineStringService : 'http://www.opengis.net/gml http://schemas.opengis.net/gml/3.1.1/base/geometryBasic0d1d.xsd'
};

//important note: all these URLs must be listed in the cgi-bin/proxy.cgi script of the server running ORS!
namespaces.services = {
	geocoding : 'http://openls.geog.uni-heidelberg.de/testing2011/geocode', //for address search requests
	routing : 'http://openls.geog.uni-heidelberg.de/testing2011/route', //for routing requests
	directory : 'http://openls.geog.uni-heidelberg.de/testing2011/directory', //for POI search requests
	analyse : 'http://openls.geog.uni-heidelberg.de/osm/eu/analyse',
	wps : 'http://wasserkuppe.geog.uni-heidelberg.de:8080/deegree3wps/services' //for calculation of polygon around route for POI search
	//profile: 'http://watzmann.geog.uni-heidelberg.de:8080/deegree/all' 			//for height profile of route
};

//map layers used in ORS.Map.js
//url to ORS-WMS map layer
namespaces.layerWms = 'http://129.206.228.72/cached/osm?';
//url to Open Map Surfer layer
namespaces.layerMapSurfer = 'http://129.206.74.245:8001/tms_r.ashx?x=${x}&y=${y}&z=${z}';
//url to hillshade overlay
namespaces.layerHs = 'http://129.206.228.72/cached/hillshade?';
//urls to TMC overlay
namespaces.overlayTmc = 'http://koenigstuhl.geog.uni-heidelberg.de/tmc/wms';
namespaces.overlayTmcLines = 'http://openls.geog.uni-heidelberg.de/geoserver/wms';
