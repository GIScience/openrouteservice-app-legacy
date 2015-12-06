var Restrictions = ( function(w) {"use strict";
	/**
		* Constructor
	*/
	function Restrictions() {
		
	}
	/**
		* creates restrictions query and polygon for display
		* @param lineString: the route linestring
		* @return: the query and the polygon
	*/
	function getRestrictionsQuery(lineString, routePref) {
		if (routePref != 'HeavyVehicle'){
			return [null, null];
		}
		//get height limit set by user
		// console.log(permaInfo[w.Preferences.value_heightIdx]);
		var tolerance = 0.01;
		var polygon = createPolygon(simplify(lineString, tolerance, false));
		var query = createQuery(polygon[0]);
		return [query, polygon[1]];
	}
	
	/**
		* creates the overpass query from the polygon and the restriction type
		* @param polygonString: String representation of the polygon in overpass notation
		* @return: the final overpass query
	*/
	
	
	function createQuery(polygonString){
		//TODO: consider restriction type
		var timeout = 20;
		var query = "";//namespaces.services.overpass + "?data=[timeout:"+timeout+"];";
		
		query += '[timeout:'+timeout+'];node(' + polygonString + ')[~"maxlength|maxwidth|maxheight|maxweight|maxaxleload|hazmat|hazmat:water"~"."];out;'//[waterway!~"."]["waterway:sign"!~"."]["seamark:type"!~"."]["obstacle"!="bridge"];out;'
		+ '(way(' + polygonString + ')[~"maxlength|maxwidth|maxheight|maxweight|maxaxleload|hazmat|hazmat:water"~"."];>;);out;';
		
		// + 
		//query += 'node(' + polygonString + ')[maxheight][waterway!~"."]["waterway:sign"!~"."]["seamark:type"!~"."]["obstacle"!="bridge"];out;';// + 
		console.log(query);
		return query;
	}
	
	/**
		* creates a tube-like polygon from the linestring
		* @param lineString: the (simplified) linestring representing the route
		* @return: string representation of the polygon in overpass notation; polygon as array for display
	*/
	function createPolygon(lineString) {
		
		// var epsg4326 = new OpenLayers.Projection('EPSG:4326');
		// var epsg900913 = new OpenLayers.Projection('EPSG:900913');
		//Empirical constant for polygon size
		var delta = 0.025;
		//float length to keep overpass query short
		var floatCut = 3;
		
		var vertices = [];
		for (var i= 0; i < lineString.length; i++) vertices.push([lineString[i].lng, lineString[i].lat]); //.getVertices();
		console.log(vertices);
		//create polygon from array
		var featureArray = vertices.concat(vertices.slice(0).reverse());
		
		var inputString = "Polygon((";
		for (var i = 0; i < featureArray.length; i ++) inputString += featureArray[i][0].toString() + " " + featureArray[i][1].toString() + ", ";
		inputString = inputString.slice(0, -2);
		inputString += "))";
		var geoReader = new jsts.io.GeoJSONReader();
		var geoWriter = new jsts.io.GeoJSONWriter();
		// var reader = new jsts.io.WKTReader();
		// var input = reader.read(inputString);
		var geoInput = {
        type: "LineString",
        coordinates: featureArray
		};
		console.log(geoInput);
		// var geometry = geoReader.read(geoInput).buffer(delta);
		var bufOp = new jsts.operation.buffer.BufferOp(geoReader.read(geoInput));
		bufOp.setQuadrantSegments(1);
		var geometry = bufOp.getResultGeometry(delta);
		
		// var parser = new jsts.io.OpenLayersParser();
		// buffer = parser.write(buffer);
		var polygon = geoWriter.write(geometry);
		console.log(polygon.coordinates[0]);
		// var bboxArray = buffer.getVertices();
		var bboxArray = polygon.coordinates[0];
		
		//Create the polygon string for overpass
		var bboxString = "poly:" + "\"";
		
		for (var i=0; i < bboxArray.length; i++){
			//Logic is inverted for Overpass API
			//Use + for whitespace to make query work
			bboxString += (bboxArray[i][1].toFixed(floatCut).toString() + '+' + bboxArray[i][0].toFixed(floatCut).toString() + '+');
		}
		bboxString = bboxString.slice(0, -1);
		bboxString += "\"";
		
		return [bboxString, bboxArray];
	}
	
	function filterByAllAttributes(layer){
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
		
		for (var i = 0; i < layer.features.length; i++){
			
			try{featureLength = parseFloat(layer.features[i].attributes.maxlength)}
			catch(e) {
				featureLength = 1000;
				console.log("No length found for feature");
			}
			try{featureWidth = parseFloat(layer.features[i].attributes.maxwidth)}
			catch(e) {
				featureWidth = 1000;
				console.log("No featureWidth found for feature");
			}
			try{featureHeight = parseFloat(layer.features[i].attributes.maxheight)}
			catch(e) {
				featureHeight = 1000;
				console.log("No featureHeight found for feature");
			}
			try{featureWeight = parseFloat(layer.features[i].attributes.maxweight)}
			catch(e) {
				featureWeight = 1000;
				console.log("No featureWeight found for feature");
			}
			try{featureAxleload = parseFloat(layer.features[i].attributes.maxaxleload)}
			catch(e) {
				featureAxleload = 1000;
				console.log("No featureAxleload found for feature");
			}
			
			try {
				removeFeature = 
				!((vehicleLength > featureLength)
				|| (vehicleWidth > featureWidth)
				|| (vehicleHeight > featureHeight)
				|| (vehicleWeight > featureWeight)
				|| (vehicleAxleload > featureAxleload)
				|| (vehicleHazmat == 'hazmat'))
				
			}
			catch(e) {//Keep the feature if any tag is not well formatted
				removeFeature = false;
			}
			if (removeFeature) featuresToRemove.push(layer.features[i]);
		}
		layer.removeFeatures(featuresToRemove);
		return layer;
	}
	
	function filterByAttribute(layer, attribute, vehicleValue){
		var length = layer.features.length;
		var featuresToRemove = [];
		switch (attribute){
			case "maxheight":
			for (var i = 0; i < length; i++){
				//permaInfo[1] is maxheight
				try {
					if(vehicleValue < parseFloat(layer.features[i].attributes.maxheight)) featuresToRemove.push(layer.features[i]);
				}
				catch(e) {//Keep the feature if the maxheight-tag is not well formatted
				}
			}
			break;
			default: //return the unchanged layer
		}
		layer.removeFeatures(featuresToRemove);
		return layer;
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
	if (typeof define === 'function' && define.amd) define(function() { return simplify; });
	else if (typeof module !== 'undefined') module.exports = simplify;
	else if (typeof self !== 'undefined') self.simplify = simplify;
	else window.simplify = simplify;
	
	
	
	
	
	
	
	Restrictions.prototype.createQuery = createQuery;
	Restrictions.prototype.createPolygon = createPolygon;
	Restrictions.prototype.getRestrictionsQuery = getRestrictionsQuery;
	Restrictions.prototype.filterByAttribute = filterByAttribute;
	Restrictions.prototype.filterByAllAttributes = filterByAllAttributes;

	
	return new Restrictions();
}(window));
