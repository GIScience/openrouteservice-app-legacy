var Geolocator = (function(w) {
    "use strict";
    /**
     * Constructor
     */
    function Geolocator() {}
    /**
     * used to determine the user's current location using HTML5 geolocation feature
     * @param {Object} locationSuccess used to view the user's current position on the map
     * @param {Object} locationError used to view an error message on the UI
     * @param {Object} locationError used to view an error message on the UI
     */
    function locate(locationSuccess, locationError, locationNotSupported) {
        if (w.navigator.geolocation) {
            w.navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
        } else {
            locationNotSupported();
        }
    }
    /**
     * used to determine the address of the user's current location by sending the position to the server and executing the callback function
     * @param {Object} position the user's current position
     * @param {Object} successCallback used to view the address of the current location on the UI
     * @param {Object} failureCallback used to view an error message on the UI
     * @param language: the language of the results
     * @param waypointType: type of the waypoint that has to be looked up, one of START, VIA or END
     * @param waypointIndex: index of the wayoint
     * @param featureId: OL map feature id of this waypoint
     * @param routePresent: flag set to true if a route is available
     */
    function reverseGeolocate(position, successCallback, failureCallback, language, waypointType, waypointIndex, featureId, routePresent) {
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
        writer.writeAttributeString('xmlns:gml', namespaces.gml);
        //<gml:pos>
        writer.writeStartElement('gml:pos');
        writer.writeAttributeString('srsName', 'EPSG:4326');
        writer.writeString(position.lng + ' ' + position.lat);
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
        //</xls:XLS>
        writer.writeEndDocument();
        var xmlRequest = writer.flush();
        writer.close();
        var success = function(result) {
            successCallback(result, waypointType, waypointIndex, featureId, routePresent);
        };
        var url;
        if (location.hostname.match('openrouteservice') || location.hostname.match('localhost')) {
            url = "cgi-bin/proxy.cgi?url=" + namespaces.services.geocoding;
        } else {
            url = namespaces.services.geocoding;
        }
        var request = jQuery.ajax({
            url: url,
            processData: false,
            type: "POST",
            dataType: "xml",
            crossDomain: false,
            data: xmlRequest,
            success: success,
            error: failureCallback
        });
    }
    Geolocator.prototype.locate = locate;
    Geolocator.prototype.reverseGeolocate = reverseGeolocate;
    return new Geolocator();
}(window));