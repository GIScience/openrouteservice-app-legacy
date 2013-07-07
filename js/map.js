var Map = ( function() {"use strict";
		/**
		 * Constructor
		 * @param  {[type]} container [description]
		 */
		function map(container) {
			//layer names
			this.ROUTE_LINES = 'routeLines';
			this.ROUTE_POINTS = 'routePoints';
			this.ROUTE_INSTRUCTIONS = 'routeInstructions';
			this.GEOLOCATION = 'Geolocation';
			this.POI = 'poi';
			this.SEARCH = 'searchResults';
			this.AVOID = 'avoidAreas';
			this.TRACK = 'track';

			var self = this;

			/**
			 * [emitMapChangedEvent description]
			 */
			function emitMapChangedEvent(e) {
				var centerTransformed = self.convertPointForDisplay(self.theMap.getCenter());
				self.emit('map:changed', {
					layer : self.serializeLayers(),
					zoom : self.theMap.getZoom(),
					lat : centerTransformed.lat,
					lon : centerTransformed.lon
				});
			}

			/* *********************************************************************
			 * MAP INIT
			 * *********************************************************************/
			this.theMap = new OpenLayers.Map(container, {
				controls : [],
				units : 'm',
				panDuration : 15,
				projection : new OpenLayers.Projection('EPSG:900913'),
				//necessary so that mouse position views 'correct' coords
				displayProjection : new OpenLayers.Projection('EPSG:4326'),
				theme : "lib/OpenLayersTheme.css"
			});

			/* *********************************************************************
			 * MAP CONTROLS
			 * *********************************************************************/
			this.theMap.addControl(new OpenLayers.Control.PanZoom());
			this.theMap.addControl(new OpenLayers.Control.ArgParser());

			this.theMap.addControl(new OpenLayers.Control.Navigation({
				handleRightClicks : true,
				dragPanOptions : {
					documentDrag : true
				}
			}));

			this.theMap.addControl(new OpenLayers.Control.LayerSwitcher({
				roundedCorner : 'true',
				roundedCornerColor : 'black',
				id : 'layerSwitcherPanel'
			}));

			this.theMap.addControl(new OpenLayers.Control.ScaleLine());
			this.theMap.addControl(new OpenLayers.Control.MousePosition());
			this.theMap.addControl(new OpenLayers.Control.Permalink());
			this.theMap.addControl(new OpenLayers.Control.Attribution());

			// Add an instance of the Click control that listens to various click events (see ORS.OpenLayers file for implementation of Click)
			var clickControl = new OpenLayers.Control.Click({
				eventMethods : {
					'rightclick' : function(e) {
						var menu = new OpenRouteService.Gui.ContextMenu(e.xy.x, e.xy.y).insertIt().setRoute(OpenRouteService.route);
					},
					'click' : function(e) {
						$$('.contextMenu').each(function(cm) {
							cm.remove();
						});
					},
					'dblclick' : function(e) {
						$$('.contextMenu').each(function(cm) {
							cm.remove();
						});
					},
					'dblrightclick' : function(e) {
						$$('.contextMenu').each(function(cm) {
							cm.remove();
						});
					}
				}
			});
			this.theMap.addControl(clickControl);
			clickControl.activate();

			// external code source: http://spatialnotes.blogspot.com/2010/11/capturing-right-click-events-in.html
			// Get control of the right-click event:
			document.getElementById(container).oncontextmenu = function(e) {
				e = e ? e : window.event;
				if (e.preventDefault)
					e.preventDefault();
				// For non-IE browsers.
				else
					return false;
				// For IE browsers.
			};

			//close the context menu when zooming or panning,... //TODO placed in ui?
			function closeContextMenu() {
				$$('.contextMenu').each(function(cm) {
					cm.remove();
				});
			};

			/* *********************************************************************
			* MAP LAYERS
			* *********************************************************************/
			//layer 1 - mapnik
			var osmLayer = new OpenLayers.Layer.OSM();
			this.theMap.addLayer(osmLayer);

			//TODO layer is not available at the moment
			//layer 2 - open map surfer
			// var mapSurfer_name = "OpenMapSurfer Roads";
			// var mapSurfer_options = {
			// type : 'png',
			// displayOutsideMaxExtent : true,
			// isBaseLayer : true,
			// numZoomLevels : 19,
			// attribution : 'Maps and data: &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> and contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
			// };
			// var layerMapSurfer = new OpenLayers.Layer.XYZ(mapSurfer_name, OpenRouteService.namespaces.layerMapSurfer, mapSurfer_options);
			// this.theMap.addLayer(layerMapSurfer);

			//layer 3 - osm-wms worldwide
			var wms_name = "OSM-WMS worldwide";
			var wms_options = {
				layers : 'osm_auto:all',
				srs : 'EPSG:900913',
				format : 'image/png',
				numZoomLevels : 19
			};
			var layerOSM = new OpenLayers.Layer.WMS(wms_name, namespaces.layerWms, wms_options, {
				'buffer' : 2,
				'attribution' : 'Maps and data: &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> and contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
			});
			this.theMap.addLayer(layerOSM);

			//layer 4 - cycle map
			var layerCycle = new OpenLayers.Layer.OSM("OpenCycleMap", ["http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png", "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png", "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"]);
			this.theMap.addLayer(layerCycle);

			//overlay - hillshade
			var hs_options = {
				layers : 'europe_wms:hs_srtm_europa',
				srs : 'EPSG:900913',
				format : 'image/jpeg',
				transparent : 'true'
			};
			var hs2 = new OpenLayers.Layer.WMS("Hillshade", namespaces.layerHs, hs_options);
			hs2.setOpacity(0.2);
			hs2.visibility = false;
			this.theMap.addLayer(hs2);

			//TODO too many requests sent
			//overlay - traffic
			var layerTMC_lines = new OpenLayers.Layer.WMS("Germany TMC (Streets)", namespaces.overlayTmcLines, {
				'layers' : 'osm_tmc:lines',
				srs : 'EPSG:31467',
				transparent : true,
				format : 'image/png',
				tiled : 'true'
			}, {
				displayInLayerSwitcher : false,
				visibility : false
			});
			this.theMap.addLayer(layerTMC_lines);

			var layerTMC = new OpenLayers.Layer.WMS("TMC Germany", namespaces.overlayTmc, {
				layers : 'tmc:tmcpoints',
				styles : 'tmcPoint_All',
				srs : 'EPSG:31467',
				transparent : true,
				format : 'image/png',
				tiled : 'true'
			}, {
				visibility : false
			});
			this.theMap.addLayer(layerTMC);
			layerTMC.events.register('visibilitychanged', 'map', function(e) {
				layerTMC_lines.setVisibility(layerTMC.getVisibility());
			});

			//layrers required for routing, etc.
			//route points
			var styles = new OpenLayers.StyleMap({
				"default" : new OpenLayers.Style({
					pointRadius : 16,
					externalGraphic : "http://mnps.org/googlemaps/images/blue.png"
				}),
				"select" : new OpenLayers.Style({
					pointRadius : 16,
					externalGraphic : "http://mnps.org/googlemaps/images/orange.png"
				})
			});

			/*
			 * create the layer styleMap by giving the default style a context;
			 * based on: http://openlayers.org/dev/examples/styles-context.html
			 */
			var context = {
				getImageUrl : function(feature) {
					var pointType = feature.pointType;
					if (OpenRouteService.Gui.icons[pointType]) {
						return OpenRouteService.Gui.icons[pointType].url;
					}
				},
				getHighlightImageUrl : function(feature) {
					var pointType = feature.pointType;
					if (OpenRouteService.Gui.icons[pointType]) {
						var split = OpenRouteService.Gui.icons[pointType].url.split(".");
						return split[0] + "-high." + split[1];
					}

				}
			};
			//for default style
			var template = {
				pointRadius : 16,
				stroke : true,
				strokeColor : '#ff0000', //{String} Hex stroke color.  Default is “#ee9900”.
				graphicZIndex : 6,
				externalGraphic : "${getImageUrl}", // using context.getImageUrl(feature)
				graphicXOffset : -10,
				graphicYOffset : -30,
				graphicWidth : 21,
				graphicHeight : 30
			};
			//for select style
			var selTemplate = {
				graphicZIndex : 10,
				externalGraphic : "${getHighlightImageUrl}", // using context.getHighlightImageUrl(feature)
				graphicXOffset : -10,
				graphicYOffset : -30,
				graphicWidth : 21,
				graphicHeight : 30
			};

			var defaultStyle = new OpenLayers.Style(template, {
				context : context
			});
			var selectStyle = new OpenLayers.Style(selTemplate, {
				context : context
			});

			var myStyleMap = new OpenLayers.StyleMap({
				"default" : defaultStyle,
				"select" : selectStyle
			});

			var layerRoutePoints = new OpenLayers.Layer.Vector(this.ROUTE_POINTS, {
				styleMap : myStyleMap,
				displayInLayerSwitcher : false,
				rendererOptions : {
					yOrdering : true
				}
			});

			//route lines
			var layerRouteLines = new OpenLayers.Layer.Vector(this.ROUTE_LINES, {
				displayInLayerSwitcher : false,
				'style' : {
					strokeColor : "#009ad5",
					strokeOpacity : 1,
					strokeWidth : 5,
					cursor : "pointer"
				}
			});

			//route instructions
			var layerRouteInstructions = new OpenLayers.Layer.Vector(this.ROUTE_INSTRUCTIONS, {
				displayInLayerSwitcher : false
			});

			//Geolocation
			var layerGeolocation = new OpenLayers.Layer.Markers(this.GEOLOCATION, {
				displayInLayerSwitcher : false
			});

			//Search POI
			var layerPoi = new OpenLayers.Layer.Markers(this.POI, {
				displayInLayerSwitcher : false
			});

			//Search place
			var layerSearch = new OpenLayers.Layer.Markers(this.SEARCH, {
				displayInLayerSwitcher : false
			});

			//avoid areas
			var layerAvoid = new OpenLayers.Layer.Vector(this.AVOID, {
				displayInLayerSwitcher : false
			});
			layerAvoid.redraw(true);

			//track lines
			var layerTrack = new OpenLayers.Layer.Vector(this.TRACK, {
				displayInLayerSwitcher : false,
				'style' : {
					strokeColor : "#2c596b",
					strokeOpacity : 1,
					strokeWidth : 4,
					cursor : "pointer"
				}
			});

			//define order
			this.theMap.addLayers([layerRouteLines, layerTrack, layerRouteInstructions, layerSearch, layerGeolocation, layerPoi, layerRoutePoints, layerAvoid]);

			/* *********************************************************************
			 * MAP LOCATION
			 * *********************************************************************/
			var hd = this.convertPointForMap(new OpenLayers.LonLat(8.692953, 49.409445));
			this.theMap.setCenter(hd, 13);

			/* *********************************************************************
			 * MAP EVENTS
			 * *********************************************************************/
			this.theMap.events.register('zoomend', this.theMap, emitMapChangedEvent);
			this.theMap.events.register('moveend', this.theMap, emitMapChangedEvent);
			this.theMap.events.register('changelayer', this.theMap, emitMapChangedEvent);

			//when zooming or moving the map -> close the context menu
			this.theMap.events.register("zoomend", this.map, closeContextMenu);
			this.theMap.events.register("movestart", this.map, closeContextMenu);
		}

		/* *********************************************************************
		* FOR PERMALINK OR COOKIE
		* *********************************************************************/

		/**
		 * returns one single string with the layers of the given map that can be used in HTTP GET vars
		 */
		function serializeLayers() {
			var layers = this.theMap.layers;
			var baseLayer = this.theMap.baseLayer;
			var str = '';
			for (var i = 0, len = layers.length; i < len; i++) {
				var layer = layers[i];
				if (layer.isBaseLayer) {
					str += (layer == baseLayer) ? "B" : "0";
				} else {
					str += (layer.getVisibility()) ? "T" : "F";
				}
			}
			return str;
		}

		/**
		 * restores the given previously selected layers in the map that can be used in HTTP GET vars
		 * @param map: Map object to activate the layers on
		 * @params: layer string with active base layer and overlays
		 */
		function restoreLayerPrefs(params) {
			var layers = this.theMap.layers;
			var result, indices = [];

			//set given map layer active
			var baseLayer = params.indexOf('B') >= 0 ? params.indexOf('B') : 0;
			indices.push(baseLayer);

			//determine which overlays to set active
			var regex = /T/gi;
			while (( result = regex.exec(params))) {
				indices.push(result.index);
			}
			for (var i = 0; i < indices.length; i++) {
				if (layers[indices[i]]) {
					layers[indices[i]].setVisibility(true);
				}
			}
		}

		/* *********************************************************************
		* TRANSFORMATION OF POINTS
		* *********************************************************************/

		/**
		 * transforms a given point to the display-projection of the map
		 * @param {Object} pt OpenLayers LonLat point to transform
		 */
		function convertPointForDisplay(pt) {
			var src = new OpenLayers.Projection('EPSG:900913');
			var dest = new OpenLayers.Projection('EPSG:4326');
			var ptCopy = new OpenLayers.LonLat(pt.lon, pt.lat);
			return ptCopy.transform(src, dest);
		}

		/**
		 * transforms a given point to the internal projection of the map
		 * @param {Object} pt OpenLayers LonLat point to transform
		 */
		function convertPointForMap(pt) {
			var src = new OpenLayers.Projection('EPSG:4326');
			var dest = new OpenLayers.Projection('EPSG:900913');
			var ptCopy = new OpenLayers.LonLat(pt.lon, pt.lat);
			return ptCopy.transform(src, dest);
		}

		/* *********************************************************************
		* FOR MODULES (e.g. search, routing,...)
		* *********************************************************************/

		/*
		* SEARCH ADDRESS
		*/

		/**
		 * transform given search results to markers and add them on the map.
		 * @param {Object} listOfMarkers array of OpenLayers.MarkerEm
		 */
		function addSearchAddressResultMarkers(listOfMarkers) {
			var layerSearchResults = this.theMap.getLayersByName(this.SEARCH)[0];
			for (var i = 0; i < listOfMarkers.length; i++) {
				//convert corrdinates of marker
				var marker = listOfMarkers[i];
				marker.lonlat = this.convertPointForMap(marker.lonlat);
				layerSearchResults.addMarker(marker);
			}

			//show all results
			var resultBounds = layerSearchResults.getDataExtent();
			this.theMap.zoomToExtent(resultBounds);
			if (this.theMap.getZoom() > 14) {
				this.theMap.zoomTo(14);
			}
		}

		/**
		 * Emphasize the given search result marker
		 * @param {Object} markerId id of the marker to emphasize
		 */
		function emphasizeSearchAddressMarker(markerId) {
			var layerSearchResults = this.theMap.getLayersByName(this.SEARCH)[0];
			$A(layerSearchResults.markers).each(function(marker) {
				if (marker.id == markerId) {
					marker.emphasize();
				}
			});
		}

		/**
		 * Deemphasize the given search result marker
		 * @param {Object} markerId id of the marker to deemphasize
		 */
		function deEmphasizeSearchAddressMarker(markerId) {
			var layerSearchResults = this.theMap.getLayersByName(this.SEARCH)[0];
			$A(layerSearchResults.markers).each(function(marker) {
				if (marker.id == markerId) {
					marker.deemphasize();
				}
			});
		}

		function clearSearchAddressMarkers() {
			var layerSearchResults = this.theMap.getLayersByName(this.SEARCH)[0];
			layerSearchResults.clearMarkers();
		}

		function zoomToAddressResults() {
			var layerSearchResults = this.theMap.getLayersByName(this.SEARCH)[0];
			var resultBounds = layerSearchResults.getDataExtent();
			this.theMap.zoomToExtent(resultBounds);
			if (this.theMap.getZoom() > 14) {
				this.theMap.zoomTo(14);
			}
		}

		/*
		* SEARCH POI
		*/

		/**
		 * transform given search results to markers and add them on the map.
		 * @param {Object} listOfMarkers array of OpenLayers.Marker
		 */
		function addSearchPoiResultMarkers(listOfMarkers) {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			for (var i = 0; i < listOfMarkers.length; i++) {
				//convert corrdinates of marker
				var marker = listOfMarkers[i];
				marker.setOpacity(0.7);
				marker.lonlat = this.convertPointForMap(marker.lonlat);
				layerPoiResults.addMarker(marker);
			}
		}

		/**
		 * Emphasize the given search result marker
		 * @param {Object} markerId id of the marker to emphasize
		 */
		function emphasizeSearchPoiMarker(markerId) {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			$A(layerPoiResults.markers).each(function(marker) {
				if (marker.id == markerId) {
					marker.setOpacity(1);
					marker.inflate(1.4);
				}
			});
		}

		/**
		 * Deemphasize the given search result marker
		 * @param {Object} markerId id of the marker to deemphasize
		 */
		function deEmphasizeSearchPoiMarker(markerId) {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			$A(layerPoiResults.markers).each(function(marker) {
				if (marker.id == markerId) {
					marker.setOpacity(0.7);
					marker.inflate(0.715);
				}
			});
		}

		function clearSearchPoiMarkers() {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			layerPoiResults.clearMarkers();
		}

		function zoomToPoiResults() {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			var resultBounds = layerPoiResults.getDataExtent();
			this.theMap.zoomToExtent(resultBounds);
			if (this.theMap.getZoom() > 14) {
				this.theMap.zoomTo(14);
			}
		}
		
		/*
		 * SEARCH MODULES 
		 */
		
		/**
		 * Move and zoom the map to a given marker
 		 * @param {Object} objectId String containing the CSS-id of the marker representation, e.g. 'searchAddressResult_2' or 'searchPoiResult_47'
		 */
		function zoomToMarker(objectId) {
			var index = objectId.lastIndexOf('_');
			index = objectId.substring(index+1, objectId.length);
			
			var layer, pos, zoom;
			
			 if (objectId.indexOf('Address') != -1) {
			 	//want to zoom to a searchAddress marker
			 	layer = this.theMap.getLayersByName(this.SEARCH)[0];
			 	zoom = 14;
			 }
			 else if (objectId.indexOf('Poi') != -1) {
			 	//want to zoom to a searchPoi marker
			 	layer = this.theMap.getLayersByName(this.POI)[0];
			 	zoom = 17;
			 }
			
			pos = layer.markers[index].lonlat;
			this.theMap.moveTo(pos, zoom);
		}


		map.prototype = new EventEmitter();
		map.prototype.constructor = map;

		map.prototype.serializeLayers = serializeLayers;
		map.prototype.restoreLayerPrefs = restoreLayerPrefs;

		map.prototype.convertPointForDisplay = convertPointForDisplay;
		map.prototype.convertPointForMap = convertPointForMap;

		map.prototype.addSearchAddressResultMarkers = addSearchAddressResultMarkers;
		map.prototype.emphasizeSearchAddressMarker = emphasizeSearchAddressMarker;
		map.prototype.deEmphasizeSearchAddressMarker = deEmphasizeSearchAddressMarker;
		map.prototype.clearSearchAddressMarkers = clearSearchAddressMarkers;
		map.prototype.zoomToAddressResults = zoomToAddressResults;

		map.prototype.addSearchPoiResultMarkers = addSearchPoiResultMarkers;
		map.prototype.emphasizeSearchPoiMarker = emphasizeSearchPoiMarker;
		map.prototype.deEmphasizeSearchPoiMarker = deEmphasizeSearchPoiMarker;
		map.prototype.clearSearchPoiMarkers = clearSearchPoiMarkers;
		map.prototype.zoomToPoiResults = zoomToPoiResults;
		
		map.prototype.zoomToMarker = zoomToMarker;

		return map;
	}());
