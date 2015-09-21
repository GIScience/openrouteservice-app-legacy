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
			console.log(permaInfo[w.Preferences.value_heightIdx]);
			var tolerance = 0.03;
			var polygon = createPolygon(lineString.simplify(tolerance));
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
			var query = namespaces.services.overpass + "?data=[timeout:"+timeout+"];";
			
			query += 'node(' + polygonString + ')[maxheight][waterway!~"."]["waterway:sign"!~"."]["seamark:type"!~"."]["obstacle"!="bridge"];out;';// + 
			//'node(' + polygonString + ')["maxheight:physical"~"."][waterway!~"."]["waterway:sign"!~"."]["seamark:type"!~"."]["obstacle"!~"bridge"];out;'
			return query;
		}
		
		/**
         * creates a tube-like polygon from the linestring
         * @param lineString: the (simplified) linestring representing the route
         * @return: string representation of the polygon in overpass notation; polygon as array for display
         */
		function createPolygon(lineString) {
			
			var epsg4326 = new OpenLayers.Projection('EPSG:4326');
			var epsg900913 = new OpenLayers.Projection('EPSG:900913');
			//Empirical constant for polygon size
			var delta = 0.025;
			//float length to keep overpass query short
			var floatCut = 3;
			
			var vertices = lineString.getVertices();
			//create polygon from array
			var featureArray = vertices.concat(vertices.slice(0).reverse());
			
			var inputString = "Polygon((";
			for (var i = 0; i < featureArray.length; i ++) inputString += featureArray[i].x.toString() + " " + featureArray[i].y.toString() + ", ";
			inputString = inputString.slice(0, -2);
			inputString += "))";
			var reader = new jsts.io.WKTReader();
			var input = reader.read(inputString);
			
			var bufOp = new jsts.operation.buffer.BufferOp(input);
			bufOp.setQuadrantSegments(1);
			var buffer = bufOp.getResultGeometry(delta);
			
		    var parser = new jsts.io.OpenLayersParser();
		    buffer = parser.write(buffer);
		    var bboxArray = buffer.getVertices();

			//Create the polygon string for overpass
			var bboxString = "poly:" + "\"";
			
			for (var i=0; i < bboxArray.length; i++){
				//Logic is inverted for Overpass API
				//Use + for whitespace to make query work
				bboxString += (bboxArray[i].y.toFixed(floatCut).toString() + '+' + bboxArray[i].x.toFixed(floatCut).toString() + '+');
			}
			bboxString = bboxString.slice(0, -1);
			bboxString += "\"";
			
			//Transform projection for correct display of bbox
			var bboxArrayTransformed = [];
			for (var i=0; i < bboxArray.length; i++){
				bboxArrayTransformed.push(new OpenLayers.Geometry.Point(bboxArray[i].x, bboxArray[i].y).transform(epsg4326, epsg900913));
			}
			return [bboxString, bboxArrayTransformed];
		}

		Restrictions.prototype.createQuery = createQuery;
		Restrictions.prototype.createPolygon = createPolygon;
		Restrictions.prototype.getRestrictionsQuery = getRestrictionsQuery;

		return new Restrictions();
	}(window));
