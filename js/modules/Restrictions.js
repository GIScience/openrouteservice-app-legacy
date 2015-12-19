var Restrictions = (function(w) {
    "use strict";
    /**
     * Constructor
     */
    function Restrictions() {}
    /**
     * creates restrictions query and polygon for display
     * @param lineString: the route linestring
     * @return: the query and the polygon
     */
    function getRestrictionsQuery(lineString) {
        var tolerance = 0.003;
        var polygon = createPolygon(simplify(lineString, tolerance, false));
        var query = createQuery(polygon[0]);
        return [query, polygon[1]];
    }
    /**
     * creates the overpass query from the polygon and the restriction type
     * @param polygonString: String representation of the polygon in overpass notation
     * @return: the final overpass query
     */
    function createQuery(polygonString) {
        var timeout = 20;
        var query = ""; //namespaces.services.overpass + "?data=[timeout:"+timeout+"];";
        query += 'node(' + polygonString + ')[~"maxlength|maxwidth|maxheight|maxweight|maxaxleload|hazmat|hazmat:water"~"."];out;' //[waterway!~"."]["waterway:sign"!~"."]["seamark:type"!~"."]["obstacle"!="bridge"];out;'    << This is really slowing down the API so better don't use it
            + '(way(' + polygonString + ')[~"maxlength|maxwidth|maxheight|maxweight|maxaxleload|hazmat|hazmat:water"~"."];>;);out;';
        return query;
    }
    /**
     * creates a tube-like polygon from the linestring as buffer
     * @param lineString: the (simplified) linestring representing the route
     * @return: string representation of the polygon in overpass notation; polygon as array for display
     */
    function createPolygon(lineString) {
        //Empirical constant for polygon size
        var delta = 0.005;
        //float length to keep overpass query short
        var floatCut = 3;
        var vertices = [];
        for (var i = 0; i < lineString.length; i++) vertices.push([lineString[i].lng, lineString[i].lat]); //.getVertices();
        //create polygon from array
        var featureArray = vertices.concat(vertices.slice(0).reverse());
        // var inputString = "Polygon((";
        // for (var i = 0; i < featureArray.length; i++) inputString += featureArray[i][0].toString() + " " + featureArray[i][1].toString() + ", ";
        // inputString = inputString.slice(0, -2);
        // inputString += "))";
        var geoReader = new jsts.io.GeoJSONReader();
        var geoWriter = new jsts.io.GeoJSONWriter();
        var geoInput = {
            type: "LineString",
            coordinates: featureArray
        };
        var bufOp = new jsts.operation.buffer.BufferOp(geoReader.read(geoInput));
        bufOp.setQuadrantSegments(1);
        var geometry = bufOp.getResultGeometry(delta);
        var polygon = geoWriter.write(geometry);
        var bboxArray = polygon.coordinates[0];
        //Create the polygon string for overpass
        var bboxString = "poly:" + "\"";
        for (var j = 0; j < bboxArray.length; j++) {
            //Logic is inverted for Overpass API
            //Use + for whitespace to make query work
            bboxString += (bboxArray[j][0].toFixed(floatCut).toString() + '+' + bboxArray[j][1].toFixed(floatCut).toString() + '+');
        }
        bboxString = bboxString.slice(0, -1);
        bboxString += "\"";
        return [bboxString, bboxArray];
    }
    /**
     * filters restrictions that are not relevant to the user because of the user's vehicle specifications
     * @param restriction feature to be filtered
     * @return: filtered feature
     */
    function filterByAllAttributes(restriction) {
        var featuresToRemove = [];
        var removeFeature = true;
        var vehicleLength = permaInfo[w.Preferences.value_lengthIdx];
        var vehicleWidth = permaInfo[w.Preferences.value_widthIdx];
        var vehicleHeight = permaInfo[w.Preferences.value_heightIdx];
        var vehicleWeight = permaInfo[w.Preferences.value_weightIdx];
        var vehicleAxleload = permaInfo[w.Preferences.value_axleloadIdx];
        var vehicleHazmat = permaInfo[w.Preferences.hazardousIdx];
        var featureLength;
        var featureWidth;
        var featureHeight;
        var featureWeight;
        var featureAxleload;
        for (var tag in restriction.tags) {
            if (!(tag == "maxlength" || tag == "maxwidth" || tag == "maxheight" || tag == "maxweight" || tag == "maxaxleload" || tag == "hazmat")) {
                delete restriction.tags[tag];
                continue;
            }
            switch (tag) {
                case "maxlength":
                    try {
                        featureLength = parseFloat(restriction.tags[tag]);
                    } catch (e) {
                        break;
                    } //tag exists but is not a number so just leave it in there, might still be useful to the user
                    if (featureLength < vehicleLength) break;
                    delete restriction.tags[tag];
                    break;
                case "maxwidth":
                    try {
                        featureWidth = parseFloat(restriction.tags[tag]);
                    } catch (e) {
                        break;
                    } //tag exists but is not a number so just leave it in there, might still be useful to the user
                    if (featureWidth < vehicleWidth) break;
                    delete restriction.tags[tag];
                    break;
                case "maxheight":
                    try {
                        featureHeight = parseFloat(restriction.tags[tag]);
                    } catch (e) {
                        break;
                    } //tag exists but is not a number so just leave it in there, might still be useful to the user
                    if (featureHeight < vehicleHeight) break;
                    delete restriction.tags[tag];
                    break;
                case "maxweight":
                    try {
                        featureWeight = parseFloat(restriction.tags[tag]);
                    } catch (e) {
                        break;
                    } //tag exists but is not a number so just leave it in there, might still be useful to the user
                    if (featureWeight < vehicleWeight) break;
                    delete restriction.tags[tag];
                    break;
                case "maxaxleload":
                    try {
                        featureAxleload = parseFloat(restriction.tags[tag]);
                    } catch (e) {
                        break;
                    } //tag exists but is not a number so just leave it in there, might still be useful to the user
                    if (featureAxleload < vehicleAxleload) break;
                    delete restriction.tags[tag];
                    break;
                case "hazmat":
                    if (vehicleHazmat == "hazmat") break;
                    delete restriction.tags[tag];
                    break;
            }
        }
        return restriction;
    }
    /*
    	(c) 2013, Vladimir Agafonkin
    	Simplify.js, a high-performance JS polyline simplification library
    	mourner.github.io/simplify-js
    */
    // to suit your point format, run search/replace for '.x' and '.y';
    // for 3D version, see 3d branch (configurability would draw significant performance overhead)
    // square distance between 2 points
    function getSqDist(p1, p2) {
        var dx = p1.lat - p2.lat,
            dy = p1.lng - p2.lng;
        return dx * dx + dy * dy;
    }
    // square distance from a point to a segment
    function getSqSegDist(p, p1, p2) {
        var lat = p1.lat,
            y = p1.lng,
            dx = p2.lat - lat,
            dy = p2.lng - y;
        if (dx !== 0 || dy !== 0) {
            var t = ((p.lat - lat) * dx + (p.lng - y) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                lat = p2.lat;
                y = p2.lng;
            } else if (t > 0) {
                lat += dx * t;
                y += dy * t;
            }
        }
        dx = p.lat - lat;
        dy = p.lng - y;
        return dx * dx + dy * dy;
    }
    // rest of the code doesn't care about point format
    // basic distance-based simplification
    function simplifyRadialDist(points, sqTolerance) {
        var prevPoint = points[0],
            newPoints = [prevPoint],
            point;
        for (var i = 1, len = points.length; i < len; i++) {
            point = points[i];
            if (getSqDist(point, prevPoint) > sqTolerance) {
                newPoints.push(point);
                prevPoint = point;
            }
        }
        if (prevPoint !== point) newPoints.push(point);
        return newPoints;
    }

    function simplifyDPStep(points, first, last, sqTolerance, simplified) {
        var maxSqDist = sqTolerance,
            index;
        for (var i = first + 1; i < last; i++) {
            var sqDist = getSqSegDist(points[i], points[first], points[last]);
            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }
        if (maxSqDist > sqTolerance) {
            if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
            simplified.push(points[index]);
            if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
        }
    }
    // simplification using Ramer-Douglas-Peucker algorithm
    function simplifyDouglasPeucker(points, sqTolerance) {
        var last = points.length - 1;
        var simplified = [points[0]];
        simplifyDPStep(points, 0, last, sqTolerance, simplified);
        simplified.push(points[last]);
        return simplified;
    }
    // both algorithms combined for awesome performance
    function simplify(points, tolerance, highestQuality) {
        if (points.length <= 2) return points;
        var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
        points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
        points = simplifyDouglasPeucker(points, sqTolerance);
        return points;
    }
    // export as AMD module / Node module / browser or worker variable
    if (typeof define === 'function' && define.amd) define(function() {
        return simplify;
    });
    else if (typeof module !== 'undefined') module.exports = simplify;
    else if (typeof self !== 'undefined') self.simplify = simplify;
    else window.simplify = simplify;
    Restrictions.prototype.createQuery = createQuery;
    Restrictions.prototype.createPolygon = createPolygon;
    Restrictions.prototype.getRestrictionsQuery = getRestrictionsQuery;
    Restrictions.prototype.filterByAllAttributes = filterByAllAttributes;
    return new Restrictions();
}(window));