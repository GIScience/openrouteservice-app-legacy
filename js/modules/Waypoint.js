/**
 * note: naming conventions
 * for search result elements:
 * map markers as well as DOM elements have an id like "address_WP-ID_SEARCH-ID", e.g. address_1_4 when searching for the 2nd waypoint, 5th result
 * for waypoint elements (after selecting a search result):
 * map markers as well as DOM elements have an id like "waypoint_WP-ID", e.g. waypoint_1 for the 2nd waypoint
 */
var Waypoint = (function(w) {
    'use strict';
    var waypointsSet = [false, false];
    var requestCounterWaypoints = [0, 0];
    /**
     * Constructor
     */
    function Waypoint() {
        this.nextUnsetWaypoint = 0;
    }
    /**
     * Sends the address search request to the service and calls the callback function.
     * @param  {String}   address  Address to be geocoded
     * @param  {Function} successCallback Callback which is called after the results are returned from Nominatim
     * @param  {Function} failureCallback Callback which is called after an error occured
     * @param  {Integer} index of the waypoint in the route
     * @param language: language of the results
     */
    function find(address, successCallback, failureCallback, wpIndex, language) {
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
        var success = function(result) {
            successCallback(result, wpIndex);
        };
        var failure = function() {
            failureCallback(wpIndex);
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
            error: failure
        });
    }

    function resetWaypointSet() {
        waypointsSet = [false, false];
    }
    /**
     *extract points to use for markers on map
     * @param {Object} results the (xml) results from the service
     * @param wpIndex: index of the waypoint
     * @return: array of OL.LonLat representing the coordinates of the waypoint results
     */
    function parseResultsToPoints(results, wpIndex) {
        var listOfPoints = [];
        var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'GeocodeResponseList');
        $A(geocodeResponseList).each(function(geocodeResponse) {
            var allAddress = $A(util.getElementsByTagNameNS(geocodeResponse, namespaces.xls, 'GeocodedAddress'));
            for (var i = 0; i < allAddress.length; i++) {
                var point = util.getElementsByTagNameNS(allAddress[i], namespaces.gml, 'pos')[0];
                point = (point.firstChild.nodeValue).split(" ");
                listOfPoints.push(point);
            }
        });
        return listOfPoints;
    }
    /**
     * set the type of the waypoint either as start, via or end according to the waypoint's position in the route
     * @return the type
     */
    function determineWaypointType(wpIndex) {
        /*jshint validthis: true */
        var type;
        if (wpIndex == '0') {
            type = this.type.START;
        } else if (wpIndex == waypointsSet.length - 1) {
            type = this.type.END;
        } else {
            type = this.type.VIA;
        }
        var el = document.getElementById(wpIndex);
        var typeUnset = true;
        if (el && el.className) {
            var c = el.getAttribute("class");
            c = " " + c + " ";
            typeUnset = c.indexOf(' ' + this.type.UNSET + ' ') > -1;
        }
        if (typeUnset) {
            type = this.type.UNSET;
        }
        return type;
    }
    /**
     * adds a waypoint at the given index. if no index is given, the waypoint is appended at the end of the list
     * @param index: index of the waypoint to add 
     */
    function addWaypoint(index) {
        if (index) {
            waypointsSet.splice(index, 0, false);
            requestCounterWaypoints.splice(index, 0, 0);
        } else {
            waypointsSet.push(false);
            requestCounterWaypoints.push(0);
        }
    }
    /**
     * removes the waypoint at the given index.
     * @param index: index of the waypoint to remove. Nothing is removed if no index is given. 
     */
    function removeWaypoint(index) {
        if (index >= 0) {
            waypointsSet.splice(index, 1);
            requestCounterWaypoints.splice(index, 1);
        }
    }
    /**
     * get the number of waypoints 
     */
    function getNumWaypoints() {
        return waypointsSet.length;
    }
    /**
     * marks the given waypoint as set or unset
     * @param index: index of the waypoint to set
     * @param set: either true (to mark the waypoint set) or false (to mark the waypoint as unset) 
     */
    function setWaypoint(index, set) {
        waypointsSet[index] = set;
    }
    /**
     * gets the 'set' state of the given waypoint
     * @param index: index of the waypoint
     * @return: true, if the given waypoint is set; false otherwise 
     */
    function getWaypointSet(index) {
        return waypointsSet[index];
    }
    /**
     * gets the number of currently pending requests for the given waypoint
     * @param index: the index of the waypoint
     * @return: number of active requests 
     */
    function getRequestCounterWaypoint(index) {
        return requestCounterWaypoints[index];
    }
    /**
     * increases the number of active requests for the given waypoint
     * @param index: the index of the waypoint 
     */
    function incrRequestCounterWaypoint(index) {
        requestCounterWaypoints[index]++;
    }
    /**
     * decreases the number of active requests for the given waypoint
     * @param index: index of the waypoint 
     */
    function decrRequestCounterWaypoint(index) {
        requestCounterWaypoints[index]--;
    }
    /**
     * finds the next unset waypoint in the list of all waypoints starting at a given index
     * @param {Object} startingAt index to start looking for an empty waypoint
     * @return index of the empty waypoint or -1 if none exists
     */
    function getNextUnsetWaypoint(startingAt) {
        var start = startingAt ? startingAt : 0;
        for (var i = start; i < waypointsSet.length; i++) {
            if (!waypointsSet[i]) {
                return i;
            }
        }
        return -1;
    }
    /**
     * @return number of set waypoints 
     */
    function getNumWaypointsSet() {
        var cnt = 0;
        for (var i = 0; i < waypointsSet.length; i++) {
            if (waypointsSet[i]) {
                cnt++;
            }
        }
        return cnt;
    }
    /**
     * used for debugging information 
     */
    function getDebugInfo() {
        return waypointsSet;
    }
    Waypoint.prototype.find = find;
    Waypoint.prototype.parseResultsToPoints = parseResultsToPoints;
    Waypoint.prototype.determineWaypointType = determineWaypointType;
    Waypoint.prototype.getNumWaypoints = getNumWaypoints;
    Waypoint.prototype.addWaypoint = addWaypoint;
    Waypoint.prototype.removeWaypoint = removeWaypoint;
    Waypoint.prototype.setWaypoint = setWaypoint;
    Waypoint.prototype.getWaypointSet = getWaypointSet;
    Waypoint.prototype.getRequestCounterWaypoint = getRequestCounterWaypoint;
    Waypoint.prototype.incrRequestCounterWaypoint = incrRequestCounterWaypoint;
    Waypoint.prototype.decrRequestCounterWaypoint = decrRequestCounterWaypoint;
    Waypoint.prototype.getNextUnsetWaypoint = getNextUnsetWaypoint;
    Waypoint.prototype.getNumWaypointsSet = getNumWaypointsSet;
    Waypoint.prototype.getDebugInfo = getDebugInfo;
    Waypoint.prototype.resetWaypointSet = resetWaypointSet;
    return new Waypoint();
})(window);
Waypoint.type = {
    START: 'start',
    VIA: 'via',
    END: 'end',
    UNSET: 'unset'
};