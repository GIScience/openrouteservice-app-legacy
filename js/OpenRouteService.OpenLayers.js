( function() {
	var convert = OpenRouteService.convert;
	var namespaces = OpenRouteService.namespaces;

	//extensions to OpenLayers
	/**
	 * @requires OpenRouteService.convert.js
	 */

	//Emphasisable Marker
	OpenLayers.MarkerEm = OpenLayers.Class(OpenLayers.Marker, {
		/**
		 * Creates an emphasisable Marker.
		 *
		 * Constructor: OpenLayers.MarkerHl
		 * Parameters:
		 * lonlat - {<OpenLayers.LonLat>} the position of this marker
		 * deEmIcon - {<OpenLayers.Icon>}  the deemphasised icon for this marker
		 * emIcon - {<OpenLayers.Icon>}  the emphasised icon for this marker
		 */
		initialize : function(lonlat, deEmIcon, emIcon) {
			var newIcon;
			this.lonlat = lonlat;
			newIcon = (deEmIcon) ? deEmIcon.clone() : OpenLayers.Marker.defaultIcon();
			if(this.deEmIcon == null) {
				this.deEmIcon = newIcon;
			} else {
				this.deEmIcon.url = newIcon.url;
				this.deEmIcon.size = newIcon.size;
				this.deEmIcon.offset = newIcon.offset;
				this.deEmIcon.calculateOffset = newIcon.calculateOffset;
			}
			emIcon = emIcon || deEmIcon;
			newIcon = (deEmIcon) ? deEmIcon.clone() : OpenLayers.Marker.defaultIcon();
			if(this.icon == null) {
				this.icon = newIcon;
			} else {
				this.icon.url = newIcon.url;
				this.icon.size = newIcon.size;
				this.icon.offset = newIcon.offset;
				this.icon.calculateOffset = newIcon.calculateOffset;
			}
			newIcon = (emIcon) ? emIcon.clone() : OpenLayers.Marker.defaultIcon();
			if(this.emIcon == null) {
				this.emIcon = newIcon;
			} else {
				this.emIcon.url = newIcon.url;
				this.emIcon.size = newIcon.size;
				this.emIcon.offset = newIcon.offset;
				this.emIcon.calculateOffset = newIcon.calculateOffset;
			}

			this.events = new OpenLayers.Events(this, this.icon.imageDiv, null);
		},
		/**
		 * Method: emphasise
		 * Switch displayed Icon to emIcon - the emphasised verision.
		 */
		emphasise : function(sw) {
			this.icon.size = this.emIcon.size;
			this.icon.offset = this.emIcon.offset;
			this.icon.calculateOffset = this.emIcon.calculateOffset;
			this.icon.setUrl(this.emIcon.url);

		},
		/**
		 * Method: emphasise
		 * Switch displayed Icon to deEmIcon - the deemphasised verision.
		 */
		deemphasise : function() {
			this.icon.size = this.deEmIcon.size;
			this.icon.offset = this.deEmIcon.offset;
			this.icon.calculateOffset = this.deEmIcon.calculateOffset;
			this.icon.setUrl(this.deEmIcon.url);
		},
		getPixelOnMap : function(map) {
			map.getPixelFromLonLat(this.lonLat);
		},
		CLASS_NAME : 'OpenLayers.MarkerEm'
	})

	OpenLayers.Layer.PointResults = OpenLayers.Class(OpenLayers.Layer.Markers, {

		addResult : function(point) {
			var pos = point.getElementsByTagNameNS(namespaces.gml, 'pos')[0];
			//there can be only one (pos element within a point element)
			var posLonLat = convert.Gml2Ol.pos2lonLat(pos, map.getProjection());
			//caution: getProjection is marked for change in OpenLayers 3.0

			var marker = new OpenLayers.MarkerEm(posLonLat, markerIcon, markerIconHighlight);

			this.addMarker(marker);
			return marker;
		},
		addResultMarker : function(marker) {//point, icon, iconEm) {

			if(false) {
				if(icon) {
					icon = icon.clone();
				} else {
					icon = new OpenLayers.Icon('img/searchResultMarker.gif');
				}
				if(iconEm) {
					iconEm = iconEm.clone();
				} else {
					iconEm = new OpenLayers.Icon('img/searchResultMarkerEm.gif');
				}

				var pos = point.getElementsByTagNameNS(namespaces.gml, 'pos')[0];
				//there can be only one (pos element within a point element)
				var posLonLat = convert.gml2ol.pos2lonLat(pos, this.map.getProjection());
				//caution: getProjection is marked for change in OpenLayers 3.0
				var marker = new OpenLayers.MarkerEm(posLonLat, icon, iconEm);
			}

			this.addMarker(marker);
			return marker;
		},
		updateResults : function(pointList) {
			this.clearMarkers();
			var markerList;
			pointList.each(function(point) {
				markerList.push(this.addResult(point));
			});
			return markerList;
		},
		//returns a box around all markers in Layer in pixel-coordinates
		getResultPixelBox : function() {
			var self = this;
			var pxArray = [];
			this.markers.each(function(marker, i) {
				//pxArray[i] = marker.getPixelOnMap(self.map)
				pxArray[i] = self.getViewPortPxFromLonLat(marker.lonlat);
			});
			var topLeft = pxArray.reduce(function(a, b) {
				var xmin = Math.max(Math.min(a.x, b.x), 0);
				var ymin = Math.max(Math.min(a.y, b.y), 0);
				return new OpenLayers.Pixel(xmin, ymin);
			});
			var bottomRight = pxArray.reduce(function(a, b) {
				var xmax = Math.min(Math.max(a.x, b.x), document.viewport.getWidth());
				var ymax = Math.min(Math.max(a.y, b.y), document.viewport.getHeight());
				return new OpenLayers.Pixel(xmax, ymax);
			});
			return {
				topLeft : topLeft,
				bottomRight : bottomRight
			}
		}
	});

	OpenLayers.MapOrs = OpenLayers.Class(OpenLayers.Map, {
		numLayers : null,
		numOverlays : null,

		zoomBoxToExtent : function(box, bounds, closest) {
			if (box == null || bounds == null) {
				//no use zooming to anything if there is nothing to zoom to
				return;
			}
			var b = Object.create(box);
			//inherit from box so we don't mutate box
			if(!box.topLeft)
				box.topLeft = [0, 0];
			if(!box.topLeft.x)
				box.topLeft.x = box.topLeft[0];
			if(!box.topLeft.y)
				box.topLeft.y = box.topLeft[1];
			if(!box.bottomRight)
				box.bottomRight = [document.viewport.getWidth(), document.viewport.getHeight()];
			if(!box.bottomRight.x)
				box.bottomRight.x = box.bottomRight[0];
			if(!box.bottomRight.y)
				box.bottomRight.y = box.bottomRight[1];

			b.left = box[0];
			b.bottom = box[1];
			b.right = box[2];
			b.top = box[3];

			var newBounds = {};
			var v = {
				h : document.viewport.getHeight(),
				w : document.viewport.getWidth()
			};
			newBounds.left = ((bounds.left * b.right) - (bounds.right * b.left) ) / (b.right - b.left);
			newBounds.top = ((bounds.top * b.bottom) - (bounds.bottom * b.top) ) / (b.bottom - b.top);

			newBounds.right = ((bounds.left * (v.w - b.right) ) - (bounds.right * (v.w - b.left) ) ) / (b.left - b.right);
			newBounds.bottom = ((bounds.top * (v.h - b.bottom) ) - (bounds.bottom * (v.h - b.top) ) ) / (b.top - b.bottom);

			var nb = new OpenLayers.Bounds(newBounds.left, newBounds.bottom, newBounds.right, newBounds.top);

			this.zoomToExtent(nb, closest);
		}
	})

	// external code source: http://spatialnotes.blogspot.com/2010/11/capturing-right-click-events-in.html
	// Get control of the right-click event:
	// A control class for capturing click events...
	OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {

		defaultHandlerOptions : {
			'single' : true,
			'double' : true,
			'pixelTolerance' : 0,
			'stopSingle' : false,
			'stopDouble' : false
		},
		handleRightClicks : true,
		initialize : function(options) {
			this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
			OpenLayers.Control.prototype.initialize.apply(this, arguments);
			this.handler = new OpenLayers.Handler.Click(this, this.eventMethods, this.handlerOptions);
		},
		CLASS_NAME : "OpenLayers.Control.Click"

	});

}());
