/**
 * all URLs used in the openrouteservice
 */
/**
 * namespaces and schemata e.g. for XML requests to services
 */
namespaces = {
    xls: 'http://www.opengis.net/xls',
    sch: 'http://www.ascc.net/xml/schematron',
    gml: 'http://www.opengis.net/gml',
    wps: 'http://www.opengis.net/wps/1.0.0',
    ows: 'http://www.opengis.net/ows/1.1',
    xlink: 'http://www.w3.org/1999/xlink',
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    ascc: 'http://www.ascc.net/xml/schematron',
    aas: 'http://www.geoinform.fh-mainz.de/aas'
};
namespaces.schemata = {
    directoryService: 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/DirectoryService.xsd',
    analyseService: 'http://www.geoinform.fh-mainz.de/aas',
    gatewayService: 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/GatewayService.xsd',
    locationUtilityService: 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/LocationUtilityService.xsd',
    presentationService: 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/PresentationService.xsd',
    routeService: 'http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/RouteService.xsd',
    wpsService: 'http://www.opengis.net/xls http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd',
    lineStringService: 'http://www.opengis.net/gml http://schemas.opengis.net/gml/3.1.1/base/geometryBasic0d1d.xsd'
};
/**
 * services that are called by openrouteservice, e.g. to determine the route between two waypoints
 * important note: all these URLs must be listed in the cgi-bin/proxy.cgi script of the server running ORS!
 * important note: all URLs have been blanked out for security reasons
 * if you want to become an active ORS code contributor please contact us: openrouteserviceATgeog.uni-heidelberg.de
 */
namespaces.services = {
    // see latest ORS API documentation http://wiki.openstreetmap.org/wiki/OpenRouteService
    // geocoding: 'http://openls.geog.uni-heidelberg.de/testing2015/geocoding', //for address search requests
    // //routing : 'http://openls.geog.uni-heidelberg.de/testing2015/routing', //for routing requests
    // routing: 'http://openls.geog.uni-heidelberg.de/osm/routing-test',
    // tmc: 'http://openls.geog.uni-heidelberg.de/osm/routing-test?tmc',
    // directory: 'http://openls.geog.uni-heidelberg.de/testing2015/directory', //for POI search requests
    // analyse: 'http://openls.geog.uni-heidelberg.de/testing2015/analysis', //for accessibility analysis requests
    // shorten: 'http://openls.geog.uni-heidelberg.de/testing2015/shortenlink', //for bitly shortlink conversion
    // overpass: 'http://overpass-api.de/api/interpreter', //for specified restriction requests
    // wps: '' //for calculation of polygon around route for POI search
    //     /** ORS test instance
    //     geocoding : 'http://openls.geog.uni-heidelberg.de/osm/geocoding-test', //for address search requests
    //     routing: 'http://openls.geog.uni-heidelberg.de/osm/routing-test', //for routing requests
    //     directory : 'http://openls.geog.uni-heidelberg.de/osm/directory-test', //for POI search requests
    //     analyse : 'http://openls.geog.uni-heidelberg.de/osm/analysis-test', //for accessibility analysis requests
    //     shorten: 'http://openls.geog.uni-heidelberg.de/osm/shortenlink-test', //for bitly shortlink conversion
    //     */
    // see latest ORS API documentation http://wiki.openstreetmap.org/wiki/OpenRouteService
    geocoding: 'http://openls.geog.uni-heidelberg.de/geocoding', //for address search requests
    routing: 'http://openls.geog.uni-heidelberg.de/routing', //for routing requests
    tmc: 'http://openls.geog.uni-heidelberg.de/osm/routing?tmc',
    directory: 'http://openls.geog.uni-heidelberg.de/directory', //for POI search requests
    analyse: 'http://openls.geog.uni-heidelberg.de/analysis', //for accessibility analysis requests
    shorten: 'http://openls.geog.uni-heidelberg.de/shortenlink', //for bitly shortlink conversion
    overpass: 'http://overpass-api.de/api/interpreter', //for specified restriction requests
    wps: '' //for calculation of polygon around route for POI search
};
/**
 * map layers used on the openlayers map
 */
//url to ORS-WMS map layer
namespaces.layerWms = 'http://129.206.228.72/cached/osm?';
//url to Open Map Surfer layer
namespaces.layerMapSurfer = 'http://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}';
//url to hillshade overlay
namespaces.layerHs = 'http://korona.geog.uni-heidelberg.de/tiles/asterh/x={x}&y={y}&z={z}';
//url to OSM layer
namespaces.layerOSM = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
//url to OpenCycleMap
namespaces.layerOSMCycle = 'http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png';
//url to stamen maps
namespaces.stamenUrl = 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png';
//urls to TMC overlay
namespaces.overlayTmc = '';
namespaces.overlayTmcLines = '';
var generateUrl = function(service) {
    var url;
    if (location.hostname.match('openrouteservice') || location.hostname.match('localhost')) {
        url = "cgi-bin/proxy.cgi?url=" + service;
    } else {
        url = service;
    }
    return url;
};