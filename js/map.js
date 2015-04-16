/**
 * OpenLayers map and functions
 */
var Map = ( function() {"use strict";
		/**
		 * create the layer styleMap by giving the default style a context;
		 * based on: http://openlayers.org/dev/examples/styles-context.html
		 */
		var pointAndLineStyle = {
			line : {
				stroke : '#009ad5',
				fill : '#009ad5',
				strokeWidthEm : 5,
				strokeEm : '#fb5400',
				fillEm : '#009ad5'
			},
			point : {
				stroke : '#009ad5',
				fill : '#009ad5',
				strokeWidthEm : 2,
				strokeEm : '#009ad5',
				fillEm : '#fba400'
			}
		};

		// layer routePoints (= waypoints)
		//for default style
		var routePointsTemplate = {
			pointRadius : 16,
			stroke : true,
			strokeColor : '#ff0000',
			graphicZIndex : 6,
			externalGraphic : "${icon}",
			graphicXOffset : -10,
			graphicYOffset : -30,
			graphicWidth : 21,
			graphicHeight : 30
		};
		//for select style
		var routePointsSelTemplate = {
			graphicZIndex : 10,
			externalGraphic : "${iconEm}",
			graphicXOffset : -10,
			graphicYOffset : -30,
			graphicWidth : 21,
			graphicHeight : 30
		};

		//route lines
		var routeLineTemplate = {
			pointRadius : 0,
			fillOpacity : 1,
			strokeWidth : 5,
			strokeColor : '${stroke}',
			fillColor : '${fill}',
			strokeOpacity: 0.6,
			graphicZIndex : 2,
			cursor : 'pointer'
		};
		var routeLineSelTemplate = {
			pointRadius : 6,
			strokeWidth : '${strokeWidthEm}',
			strokeColor : '${strokeEm}',
			fillColor : '${fillEm}',
			strokeOpacity: 0.6,
			graphicZIndex : 3
		};

		//POI layer
		var poiTemplate = {
			pointRadius : 16,
			stroke : true,
			strokeColor : '#ff0000',
			graphicZIndex : 6,
			externalGraphic : "${icon}",
			graphicXOffset : -10,
			graphicYOffset : -30,
			graphicWidth : 21,
			graphicHeight : 30,
			graphicOpacity : 1
		};
		var poiSelTemplate = {
			graphicZIndex : 10,
			externalGraphic : "${iconEm}",
			graphicXOffset : -20,
			graphicYOffset : -40,
			graphicWidth : 41,
			graphicHeight : 50,
			graphicOpacity : 0.7
		};

		/* *********************************************************************
		 * LAYER NAMES
		 * *********************************************************************/

		var $ = window.jQuery;

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
			this.SEARCH = 'Address Search';
			this.POI = 'poi';
			this.GEOLOCATION = 'searchResults';
			this.AVOID = 'avoidAreas';
			this.TRACK = 'track';
			this.ACCESSIBILITY = 'accessiblity';
			this.HEIGHTS = 'Height Profile';

			var self = this;

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
				theme : "lib/OpenLayersTheme.css",
				maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
				restrictedExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34)
			});

			/* *********************************************************************
			* MAP LAYERS
			* *********************************************************************/

			this.theMap.events.register('zoomend', this, function (event) {
				var x = this.theMap.getZoom();

				if(x < 3) {
					this.theMap.setCenter(0, 3);
				}
	    	});


			//layer 1 - open map surfer
			if (namespaces.layerMapSurfer.length) {
				var mapSurfer_options = {
					type : 'png',
					isBaseLayer : true,
					numZoomLevels : 19,
					attribution : 'Map data &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors, powered by <a href="http://mapsurfernet.com/">MapSurfer.NET</a>',
				};

				var mapSurfer_new = new OpenLayers.Layer.XYZ("OpenMapSurfer", namespaces.layerMapSurfer, mapSurfer_options);
				this.theMap.addLayer(mapSurfer_new);
			}

			//layer 2 - mapnik
			var osmLayer = new OpenLayers.Layer.OSM();
			this.theMap.addLayer(osmLayer);

			if (namespaces.layerWms.length) {
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
					'attribution' : 'Map data: &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors'
				});
				this.theMap.addLayer(layerOSM);
			}


			//layer 4 - cycle map
			var layerCycle = new OpenLayers.Layer.OSM("OpenCycleMap", ["http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png", "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png", "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"]);
			this.theMap.addLayer(layerCycle);

			//overlay - hillshade
			if (namespaces.layerHs.length) {
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
			}

			//TODO too many requests sent
			//overlay - traffic
			if (namespaces.overlayTmcLines.length) {
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
			}

			if (namespaces.overlayTmc.length) {
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
			}

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

			var searchStyleMap = new OpenLayers.StyleMap({
				"default" : new OpenLayers.Style(routePointsTemplate),
				"select" : new OpenLayers.Style(routePointsSelTemplate)
			});

			var layerRoutePoints = new OpenLayers.Layer.Vector(this.ROUTE_POINTS, {
				styleMap : searchStyleMap,
				displayInLayerSwitcher : false,
				rendererOptions : {
					yOrdering : true
				}
			});

			var routeLineStyleMap = new OpenLayers.StyleMap({
				'default' : new OpenLayers.Style(routeLineTemplate),
				'select' : new OpenLayers.Style(routeLineSelTemplate)
			});

			var layerRouteLines = new OpenLayers.Layer.Vector(this.ROUTE_LINES, {
				displayInLayerSwitcher : false,
				styleMap : routeLineStyleMap
			});

			//Geolocation
			var layerGeolocation = new OpenLayers.Layer.Vector(this.GEOLOCATION, {
				styleMap : searchStyleMap,
				displayInLayerSwitcher : false
			});

			var poiStyleMap = new OpenLayers.StyleMap({
				"default" : new OpenLayers.Style(poiTemplate),
				"select" : new OpenLayers.Style(poiSelTemplate)
			});

			//Search POI
			var layerPoi = new OpenLayers.Layer.Vector(this.POI, {
				displayInLayerSwitcher : false,
				styleMap : poiStyleMap
			});

			//Search place
			var layerSearch = new OpenLayers.Layer.Vector(this.SEARCH, {
				displayInLayerSwitcher : false,
				styleMap : searchStyleMap,
				rendererOptions : {
					yOrdering : true
				}
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

			//accessibility
			var layerAccessibility = new OpenLayers.Layer.Vector(this.ACCESSIBILITY, {
				displayInLayerSwitcher : false
			});
			layerAccessibility.redraw(true);

			//height profile
			var layerHeights = new OpenLayers.Layer.Vector(this.HEIGHTS, {
				displayInLayerSwitcher : false
			});

			//define order
			this.theMap.addLayers([layerHeights, layerAccessibility, layerRouteLines, layerTrack, layerGeolocation, layerSearch, layerPoi, layerRoutePoints, layerAvoid]);

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

			this.selectMarker = new OpenLayers.Control.SelectFeature([layerSearch, layerGeolocation, layerRoutePoints, layerPoi, layerRouteLines], {
				hover : true
			});
			//highlighting of the markers's DOM representation (address text) on mouseover
			this.selectMarker.onSelect = function(feature) {
				self.emit('map:markerEmph', feature.id);
			};
			this.selectMarker.onUnselect = function(feature) {
				self.emit('map:markerDeEmph', feature.id);
			};
			this.theMap.addControl(this.selectMarker);

			this.selectMarker.activate();

			//copied from http://openlayers.org/dev/examples/select-feature-multilayer.html
			// vectors1.events.on({
			// "featureselected": function(e) {
			// showStatus("selected feature "+e.feature.id+" on Vector Layer 1");
			// },
			// "featureunselected": function(e) {
			// showStatus("unselected feature "+e.feature.id+" on Vector Layer 1");
			// }
			// });
			// vectors2.events.on({
			// "featureselected": function(e) {
			// showStatus("selected feature "+e.feature.id+" on Vector Layer 2");
			// },
			// "featureunselected": function(e) {
			// showStatus("unselected feature "+e.feature.id+" on Vector Layer 2");
			// }
			// });

			// Add an instance of the Click control that listens to various click events (see ORS.OpenLayers file for implementation of Click)
			var clickControl = new OpenLayers.Control.Click({
				eventMethods : {
					'rightclick' : function(e) {
						//if we have any other popup menus, remove them
						closeContextMenu();

						//build new popup menu
						var pos = self.theMap.getLonLatFromViewPortPx(e.xy);
						var displayPos = util.convertPointForDisplay(pos);

						var menuObject = $('#mapContextMenu').clone();
						menuObject.attr('id', 'menu');

						//event handling for context menu
						var options = menuObject.children();
						options[0].onclick = function(e) {
							//click on start point
							self.emit('map:addWaypoint', {
								pos : displayPos,
								type : Waypoint.type.START
							});
						};
						options[1].onclick = function(e) {
							//click on via point
							self.emit('map:addWaypoint', {
								pos : displayPos,
								type : Waypoint.type.VIA
							});
						};
						options[2].onclick = function(e) {
							//click on end point
							self.emit('map:addWaypoint', {
								pos : displayPos,
								type : Waypoint.type.END
							});
						}
						//place context menu in a popup on the map
						self.popup = new OpenLayers.Popup('menu', pos, null, menuObject.html(), false, null);
						self.popup.autoSize = true;
						self.popup.div = menuObject.get(0);
						self.popup.opacity = 0.9;
						//TODO all this will not work properly with any stable version of OL; it is only included in DEV version so far... :/
						self.popup.border = '1px';

						self.theMap.addPopup(self.popup);
					},
					'click' : function(e) {
						closeContextMenu();
					},
					'dblclick' : function(e) {
						closeContextMenu();
					},
					'dblrightclick' : function(e) {
						closeContextMenu();
					}
				}
			});
			this.theMap.addControl(clickControl);
			clickControl.activate();

			// external code source: http://spatialnotes.blogspot.com/2010/11/capturing-right-click-events-in.html
			// Get control of the right-click event:
			// document.getElementById(container).oncontextmenu = function(e) {
			// e = e ? e : window.event;
			// if (e.preventDefault)
			// e.preventDefault();
			// // For non-IE browsers.
			// else
			// return false;
			// // For IE browsers.
			// };
			//

			//close the context menu when zooming or panning,...
			function closeContextMenu() {
				$('#menu').remove();
			};

			//make route waypoints draggable
			var dragWaypoints = new OpenLayers.Control.DragFeature(layerRoutePoints);
			dragWaypoints.onComplete = function(feature) {
				self.emit('map:waypointMoved', feature);
			};
			this.theMap.addControl(dragWaypoints);
			dragWaypoints.activate();

			//avoid area controls
			this.avoidTools = {
				'create' : new OpenLayers.Control.DrawFeature(layerAvoid, OpenLayers.Handler.Polygon, {
					featureAdded : function() {
						var errorous = self.checkAvoidAreasIntersectThemselves();
						if (errorous) {
							self.emit('map:errorsInAvoidAreas', true);
						}
						self.emit('map:routingParamsChanged');
						self.emit('map:avoidAreaChanged', self.getAvoidAreasString());
					}
				}),
				'edit' : new OpenLayers.Control.ModifyFeature(layerAvoid),
				'remove' : new OpenLayers.Control.SelectFeature(layerAvoid, {
					onSelect : function(feature) {
						layerAvoid.removeFeatures([feature]);
						var errorous = self.checkAvoidAreasIntersectThemselves();
						if (!errorous) {
							self.emit('map:errorsInAvoidAreas', false);
						}
						self.emit('map:routingParamsChanged');
						self.emit('map:avoidAreaChanged', self.getAvoidAreasString());
					}
				})
			};
			for (var key in this.avoidTools) {
				this.theMap.addControl(this.avoidTools[key]);
			}
			//trigger an event after changing the avoid area polygon
			layerAvoid.events.register('afterfeaturemodified', this.theMap, function(feature) {
				var errorous = self.checkAvoidAreasIntersectThemselves();
				if (errorous) {
					self.emit('map:errorsInAvoidAreas', true);
				} else {
					self.emit('map:errorsInAvoidAreas', false);
				}
				self.emit('map:routingParamsChanged');
				self.emit('map:avoidAreaChanged', self.getAvoidAreasString());
			});

			/* *********************************************************************
			 * MAP LOCATION
			 * *********************************************************************/
			var hd = util.convertPointForMap(new OpenLayers.LonLat(8.692953, 49.409445));
			this.theMap.setCenter(hd, 13);

			/* *********************************************************************
			 * MAP EVENTS
			 * *********************************************************************/
			function emitMapChangedEvent(e) {
				var centerTransformed = util.convertPointForDisplay(self.theMap.getCenter());
				self.emit('map:changed', {
					layer : self.serializeLayers(),
					zoom : self.theMap.getZoom(),
					lat : centerTransformed.lat,
					lon : centerTransformed.lon
				});
			}

			var self = this;
			this.theMap.events.register('zoomend', this.theMap, function(e) {
				emitMapChangedEvent(e);
			});
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
			this.theMap.setBaseLayer(this.theMap.layers[baseLayer]);

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
		* GENERAL
		* *********************************************************************/

		/**
		 * removes all (appropriate) markers/ features from the given layer
		 *  @param layerName: name of the layer to remove the objects from
		 *  @param waypointIndex: index of the waypoint where to remove objects from
		 */
		function clearMarkers(layerName, featureIds) {
			var layer = this.theMap.getLayersByName(layerName);
			if (layer && layer.length > 0) {
				layer = layer[0];
			}
			if (featureIds && featureIds.length > 0) {
				var toRemove = [];
				for (var i = 0; i < featureIds.length; i++) {
					if (featureIds[i]) {
						var ft = layer.getFeatureById(featureIds[i]);
						toRemove.push(ft);
					}
				}
				layer.removeFeatures(toRemove);
			} else {
				layer.removeAllFeatures();
			}
		}

		/**
		 * Move and zoom the map to a given marker
		 * @param {Object} objectId String containing the CSS-id of the marker representation, e.g. 'address_2' or 'poi_47'
		 */
		function zoomToMarker(position, zoom) {
			this.theMap.moveTo(position, zoom);
		}

		/**
		 * zoom to a given feature vector defined by its vector id.
		 * @param mapLayer: layer of the map where the feature is located
		 * @param zoom: optional zoom level
		 */
		function zoomToFeature(mapLayer, vectorId, zoom) {
			mapLayer = this.theMap.getLayersByName(mapLayer);
			if (mapLayer && mapLayer.length > 0) {
				mapLayer = mapLayer[0];
			}
			var vectors = mapLayer.getFeatureById(vectorId);
			var bounds = vectors.geometry.getBounds();

			if (zoom) {
				this.theMap.moveTo(bounds.getCenterLonLat(), zoom);
			} else {
				this.theMap.zoomToExtent(bounds);
			}
		}

		/**
		 * when performing certain actions on the Ui, OL features need to be emphasized/ deemphasized.
		 * @param layer: the layer the feature is located on
		 * @param featureId: OL id of the feature to emph/deemph
		 * @param empg: if true, the feature is emphasized; if false, the feature is deemphasized
		 */
		function emphMarker(layer, featureId, emph) {
			var layer = this.theMap.getLayersByName(layer);
			layer = layer ? layer[0] : null;

			if (layer) {
				var marker = layer.getFeatureById(featureId);
				if (marker) {
					if (emph) {
						//emphasize feature
						this.selectMarker.select(marker);
					} else {
						//de-emphasize feature
						this.selectMarker.unselect(marker);
					}
				}
			}
		}

		/**
		 * based on an OL feature id and the layer the feature is located on, the position is looked up
		 * @param featureId: OL feature ID as string
		 * @param layer: string name of the layer the feature is located on.
		 * @return: string with the position of the feature; style: 'x-coordinate y-coordinate'
		 */
		function convertFeatureIdToPositionString(featureId, layer) {
			var mapLayer = this.theMap.getLayersByName(layer);
			if (mapLayer && mapLayer.length > 0) {
				mapLayer = mapLayer[0];
			}
			var ft = mapLayer.getFeatureById(featureId);
			if (ft && ft.geometry) {
				return ft.geometry.x + ' ' + ft.geometry.y;
			}
		}

		/**
		 * based on the ID of the feature, looks up the first point in a line, e.g. used in route lines
		 * @param featureId: OL feature ID as string
		 * @param layer: string name of the layer the feature is located on.
		 * @return: string ID of the first point.
		 */
		function getFirstPointIdOfLine(featureId, layer) {
			var mapLayer = this.theMap.getLayersByName(layer);
			if (mapLayer && mapLayer.length > 0) {
				mapLayer = mapLayer[0];
			}
			var ft = mapLayer.getFeatureById(featureId);
			if (ft && ft.geometry && ft.geometry.components && ft.geometry.components.length > 0) {
				return ft.geometry.components[0].id;
			} else {
				return null;
			}
		}

		/**
		 * activates or deactivates all select controls
		 * (used by the avoid area tools which require all selectFeature controls to be off)
		 * @param activate: if true, select controls are activated; if false, they are de-activated.
		 */
		function activateSelectControl(activate) {
			if (activate) {
				this.selectMarker.activate();
			} else {
				this.selectMarker.deactivate();
			}
		}

		/* *********************************************************************
		* FOR MODULES (e.g. search, routing,...)
		* *********************************************************************/

		/*
		* WAYPOINTS
		*/
		/**
		 * for the given waypoint index, select the given search result element (by index) and convert it to a waypoint marker with the given type
		 * @param wpIndex: int containing the index of the waypoint
		 * @param featureId: OL feature ID as string
		 * @param type: type of the waypoint (start, via, end)
		 * @return: ID of the waypoint feature
		 */
		function addWaypointMarker(wpIndex, featureId, type) {
			var layerSearchResults = this.theMap.getLayersByName(this.SEARCH)[0];
			var layerWaypoints = this.theMap.getLayersByName(this.ROUTE_POINTS)[0];

			var oldMarker = layerSearchResults.getFeatureById(featureId);
			if (oldMarker) {
				var newMarker = new OpenLayers.Geometry.Point(oldMarker.geometry.x, oldMarker.geometry.y);
				var newFeature = new OpenLayers.Feature.Vector(newMarker, {
					icon : Ui.markerIcons[type][0],
					iconEm : Ui.markerIcons[type][1],
				});
				layerWaypoints.addFeatures([newFeature]);
				return newFeature.id;
			}
		}

		/**
		 * add a waypoint marker with the given type at the given position (e.g. by clicking on the map saying 'add a waypoint here')
		 * @param position: OL LonLat containing the position where the new waypoint should be created
		 * @param wpIndex: int index the waypoint should be assigned to
		 * @param type: type of the waypoint (start, via, end)
		 */
		function addWaypointAtPos(position, wpIndex, type) {
			var layerWaypoints = this.theMap.getLayersByName(this.ROUTE_POINTS)[0];

			//set new marker
			var newMarker = new OpenLayers.Geometry.Point(position.lon, position.lat);
			var newFeature = new OpenLayers.Feature.Vector(newMarker, {
				icon : Ui.markerIcons[type][0],
				iconEm : Ui.markerIcons[type][1],
			});
			layerWaypoints.addFeatures([newFeature]);
			return newFeature.id;
		}

		/**
		 * sets the type of the given waypoint identified by its feature ID
		 * @param featureId: OL feature ID as string
		 * @param type: type of the waypoint (start, via, end)
		 */
		function setWaypointType(featureId, type) {
			var layerWaypoints = this.theMap.getLayersByName(this.ROUTE_POINTS)[0];
			var feature = layerWaypoints.getFeatureById(featureId);

			//create new feature
			if (feature) {
				var pt = new OpenLayers.Geometry.Point(feature.geometry.x, feature.geometry.y);
				var newFeature = new OpenLayers.Feature.Vector(pt, {
					icon : Ui.markerIcons[type][0],
					iconEm : Ui.markerIcons[type][1],
				});
				layerWaypoints.addFeatures([newFeature]);
				layerWaypoints.removeFeatures([feature]);
				var id = newFeature.id;
			}
			return id;
		}

		/**
		 * encode all waypoints by their position in a string; used e.g. for permalink
		 * @return: string of LonLat positions; style: 'lon1,lat1,lon2,lat2,...lonk,latk'
		 */
		function getWaypointsString() {
			var layer = this.theMap.getLayersByName(this.ROUTE_POINTS)[0];

			//serialize these features to string
			var wpString = "";
			for (var i = 0; i < layer.features.length; i++) {
				var ft = layer.features[i].geometry;
				ft = new OpenLayers.LonLat(ft.x, ft.y);
				ft = util.convertPointForDisplay(ft);
				wpString = wpString + ft.lon + ',' + ft.lat + ',';
			}
			//slice away the last separator ','
			wpString = wpString.substring(0, wpString.length - 3);
			return wpString;
		}

		/*
		* GEOLOCATION
		*/

		/**
		 * adds a marker for the geolocation result at the given position
		 * @param position: OL LonLat
		 * @return: the OL Feature.Vector which was set at the given position
		 */
		function addGeolocationResultMarker(position) {
			var layer = this.theMap.getLayersByName(this.GEOLOCATION)[0];
			layer.removeAllFeatures();

			//convert corrdinates of marker
			var feature = null;
			if (position) {
				position = util.convertPointForMap(position);
				var point = new OpenLayers.Geometry.Point(position.lon, position.lat);

				feature = new OpenLayers.Feature.Vector(point, {
					icon : Ui.markerIcons.unset[0],
					iconEm : Ui.markerIcons.unset[1],
				});

				layer.addFeatures([feature]);
				this.theMap.moveTo(position, 14);
			}
			return feature;
		}

		/*
		* SEARCH ADDRESS
		*/

		/**
		 * transform given search results to markers and add them on the map.
		 * (this is also used for waypoint search results)
		 * @param {Object} listOfPoints array of OpenLayers.LonLat
		 * @return array with added OL.Feature.Vector
		 */
		function addSearchAddressResultMarkers(listOfPoints, wpIndex) {
			var layerSearchResults = this.theMap.getLayersByName(this.SEARCH)[0];
			var listOfFeatures = [];
			for (var i = 0; i < listOfPoints.length; i++) {
				//convert corrdinates of marker
				var point = listOfPoints[i];
				var feature = null;
				if (point) {

					point = util.convertPointForMap(point);
					point = new OpenLayers.Geometry.Point(point.lon, point.lat);

					if (wpIndex) {
						//a waypoint search
						var ftId = 'address_' + wpIndex + '_' + i;
					} else {
						//an address search
						var ftId = 'address_' + i;
					}

					feature = new OpenLayers.Feature.Vector(point, {
						icon : Ui.markerIcons.unset[0],
						iconEm : Ui.markerIcons.unset[1],
					});

					layerSearchResults.addFeatures([feature]);
				}
				listOfFeatures.push(feature);
			}

			//show all results
			this.zoomToAddressResults();

			return listOfFeatures;
		}

		/**
		 * views all address results on the map by zooming to the level at which all features of the search are visible
		 * (this is also used for waypoint search results)
		 */
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
		 * transforms given search results to features and adds them on the map.
		 * @param {Object} listOfPoints array of OpenLayers.LonLat
		 * @return array of added OL.Feature.Vector with the added features
		 */
		function addSearchPoiResultMarkers(listOfPoints) {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			var listOfFeatures = [];
			for (var i = 0; i < listOfPoints.length; i++) {
				var point = listOfPoints[i];

				var icon = Ui.poiIcons['poi_' + point.iconType];
				icon = icon ? icon : Ui.poiIcons['poi_default'];

				point = util.convertPointForMap(point);
				point = new OpenLayers.Geometry.Point(point.lon, point.lat);
				var feature = new OpenLayers.Feature.Vector(point, {
					icon : icon,
					iconEm : icon
				});
				layerPoiResults.addFeatures([feature]);
				listOfFeatures.push(feature);
			}

			return listOfFeatures;
		}

		/**
		 * Emphasizes the given search result feature
		 * @param {String} featureId: OL feature id of the feature to emphasize
		 */
		function emphasizeSearchPoiMarker(featureId) {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			$A(layerPoiResults.markers).each(function(marker) {
				if (marker.id == featureId) {
					marker.setOpacity(1);
					marker.inflate(1.4);
				}
			});
		}

		/**
		 * Deemphasizes the given search result feature
		 * @param {String} featureId: OL feature id of the feature to deemphasize
		 */
		function deEmphasizeSearchPoiMarker(featureId) {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			$A(layerPoiResults.markers).each(function(marker) {
				if (marker.id == featureId) {
					marker.setOpacity(0.7);
					marker.inflate(0.715);
				}
			});
		}

		/**
		 * zooms the map so that all POI features become visible
		 */
		function zoomToPoiResults() {
			var layerPoiResults = this.theMap.getLayersByName(this.POI)[0];
			var resultBounds = layerPoiResults.getDataExtent();

			if (resultBounds) {
				this.theMap.zoomToExtent(resultBounds);
				if (this.theMap.getZoom() > 14) {
					this.theMap.zoomTo(14);
				}
			}
		}

		/*
		* ROUTE
		*/

		/**
		 * draws given points as route line on the map
		 * @param {Object} routeLineSegments: array of OL.Geometry.LineString
		 * @return array of OL.Feature.Vector added to the layer
		 */
		function updateRoute(routeLineSegments, routeLinePoints) {
			var layer = this.theMap.getLayersByName(this.ROUTE_LINES)[0];
			layer.removeAllFeatures();

			var ftIds = [];
			if (routeLineSegments && routeLineSegments.length > 0) {
				var self = this;
				for (var i = 0; i < routeLineSegments.length; i++) {
					//"lines" of the route
					var segment = routeLineSegments[i];
					var segmentFt = new OpenLayers.Feature.Vector(segment, pointAndLineStyle.line);

					//"corner points" of the route where direction changes
					var cornerPoint = routeLinePoints[i];
					var cornerFt = new OpenLayers.Feature.Vector(cornerPoint, pointAndLineStyle.point);

					layer.addFeatures([segmentFt, cornerFt]);

					ftIds.push(segmentFt.id, cornerFt.id);
				}
			}
			return ftIds;
		}

		/**
		 * zooms the map so that the whole route becomes visible (i.e. all features of the route line layer)
		 */
		function zoomToRoute() {
			var layer = this.theMap.getLayersByName(this.ROUTE_LINES)[0];
			var dataExtent = layer.getDataExtent();
			if (dataExtent) {
				this.theMap.zoomToExtent(dataExtent);
			}
		}

		/*
		* AVOID AREAS
		*/

		/**
		 * activates or deactivates the given avoid area tool (draw, modify, delete)
		 * @param {Object} tool: control to select
		 * @param {Object} activate: if true, the control is activated; if false, it is deactivated
		 */
		function avoidAreaTools(tool, activate) {
			for (var key in this.avoidTools) {
				this.avoidTools[key].deactivate();
			}
			if (activate) {
				this.avoidTools[tool].activate();
			}
		}

		/**
		 * checks if two avoid ares, i.e. polygons intersect each other.
		 * @return true, if polygons intersect; otherwise false
		 */
		function checkAvoidAreasIntersectThemselves() {
			//code adapted from http://lists.osgeo.org/pipermail/openlayers-users/2012-March/024285.html
			var layer = this.theMap.getLayersByName(this.AVOID)[0];
			var intersect = false;
			for (var ftNum = 0; ftNum < layer.features.length; ftNum++) {
				var fauxpoint = [];
				var line = [];
				var led = layer.features[ftNum];

				var strng = led.geometry.toString();
				var coord = strng.split(',');
				// remove the 'Polygon((' from the 1st coord
				coord[0] = coord[0].substr(9);
				// Remove the '))' from the last coord
				coord[coord.length - 1] = coord[coord.length - 1].substr(0, coord[coord.length - 1].length - 2);

				//convert to lines
				for ( i = 0; i < coord.length; i++) {
					var lonlat = coord[i].split(' ');
					fauxpoint.push(new OpenLayers.Geometry.Point(lonlat[0], lonlat[1]));
					if (i > 0) {
						// create an array with the 2 last points
						var point = [fauxpoint[i - 1], fauxpoint[i]];
						//create the line
						line.push(new OpenLayers.Geometry.LineString(point));
					}
				}

				// Check every line against every line
				for (var i = 1; i < line.length; i++) {
					for (var j = 1; j < line.length; j++) {
						// get points of the I line in an array
						var vi = line[i].getVertices();
						// get points of the J line in an array
						var vj = line[j].getVertices();

						/*
						 *  the lines must be differents and not adjacents.
						 *  The end or start point of an adjacent line will be intersect,
						 *  and adjacent lines never intersect in other point than the ends.
						 */
						if (i != j && vi[1].toString() != vj[0].toString() && vi[0].toString() != vj[1].toString()) {
							// the intersect check
							if (line[i].intersects(line[j])) {
								intersect = true;
							}
						}
					}
				}
			}
			return intersect;
		}

		/**
		 * add the given areas as avoid area polygons to the appropriate map layer
		 * @param areas: array of avoid area polygons (OL.Feature.Vector)
		 */
		function addAvoidAreas(areas) {
			var layerAvoid = this.theMap.getLayersByName(this.AVOID)[0];
			if (areas && areas.length > 0) {
				var allFt = [];
				for (var i = 0; i < areas.length; i++) {
					var ft = new OpenLayers.Feature.Vector(areas[i])
					allFt.push(ft);
				}
				layerAvoid.addFeatures(allFt);
			}
			var self = this;
			this.emit('map:avoidAreaChanged', self.getAvoidAreasString());
		}

		/**
		 * gets all avoid area polygons
		 * used for e.g. routing service request
		 * @return avoid areas as array of OL.Feature.Vector
		 */
		function getAvoidAreas() {
			var layerAvoid = this.theMap.getLayersByName(this.AVOID)[0];
			return layerAvoid.features;
		}

		/**
		 * gets all avoid area polygons
		 * used e.g. for permalink
		 * @return avoid areas as string of polygon points; style: 'poly1pt1.y,poly1pt1.x,poly1pt2.x,poly1pt2.y,...'
		 */
		function getAvoidAreasString() {
			var layerAvoid = this.theMap.getLayersByName(this.AVOID)[0];

			//serialize these features to string
			var avAreaString = "";
			for (var avAreas = 0; avAreas < layerAvoid.features.length; avAreas++) {
				var avAreaPoints = layerAvoid.features[avAreas].geometry.components[0].components;
				for (var pt = 0; pt < avAreaPoints.length; pt++) {
					avAreaString += avAreaPoints[pt].x + escape(',') + avAreaPoints[pt].y + escape(',');
				}
				//slice away the last separator ','
				avAreaString = avAreaString.substring(0, avAreaString.length - 3);
				//separator for next avoid area
				avAreaString = avAreaString + escape(';');

			}
			//slice away the last separator ';'
			avAreaString = avAreaString.substring(0, avAreaString.length - 3);
			return avAreaString;
		}

		/*
		* ACCESSIBILITY ANALYSIS
		*/

		/**
		 * adds the given polygon as avoid area polygon to the map layer
		 *  @param polygon: OL.Feature.Vector, the polygon to add
		 */
		function addAccessiblityPolygon(polygon) {
			var layer = this.theMap.getLayersByName(this.ACCESSIBILITY)[0];
			var newFeature = new OpenLayers.Feature.Vector(polygon);
			newFeature.style = {
				'strokeColor' : '#0000ff',
				'fillColor' : '#0000ff',
				'fillOpacity' : 0.4
			};
			layer.addFeatures([newFeature]);
		}

		/**
		 * removes all accessibility analysis features from the layer
		 */
		function eraseAccessibilityFeatures() {
			var layer = this.theMap.getLayersByName(this.ACCESSIBILITY)[0];
			layer.removeAllFeatures();
		}

		/*
		* IMPORT / EXPORT
		*/

		/**
		 * generates a GPX String based on the route
		 * @param {Object} singleRouteLineString: current route as a single OL.Gemoetry.LineString
		 * @return string with encoded route information
		 */
		function writeRouteToString(singleRouteLineString) {
			var formatter = new OpenLayers.Format.GPX();

			var route;
			if (singleRouteLineString) {
				var ft = new OpenLayers.Feature.Vector(singleRouteLineString)
				route = formatter.write([ft]);
				//insert line breaks for nicely readable code
				route = route.replace(/></g, '>\n<');
				//note: doesn't include namespaces in every tag any more
			}
			return route;
		}

		/**
		 * Based on the String with GPX information two waypoints - the start and end of the GPX track - are extracted
		 * @param {Object} routeString: String with GPX track
		 * @return: array of two waypoints of OL.LonLat or null if no adequate data available
		 */
		function parseStringToWaypoints(routeString) {
			var formatter = new OpenLayers.Format.GPX();
			var featureVectors = formatter.read(routeString);
			if (!featureVectors || featureVectors.length == 0) {
				return null;
			}
			var linePoints = featureVectors[0].geometry.components;
			if (linePoints && linePoints.length >= 2) {
				//only proceed if the route contains at least 2 points (which can be interpreted as start and end)
				var startPos = new OpenLayers.LonLat(linePoints[0].x, linePoints[0].y);
				startPos = util.convertPointForMap(startPos);
				var endPos = new OpenLayers.LonLat(linePoints[linePoints.length - 1].x, linePoints[linePoints.length - 1].y);
				endPos = util.convertPointForMap(endPos);
				return [startPos, endPos];
			} else {
				return null;
			}
		}

		/**
		 * Based on the String with GPX information a track (an OL.Geometry.LineString object) is extracted
		 * @param {Object} trackString: String with GPX track
		 * @return array of OL.FeatureVectors (usually only one) containing the track points
		 */
		function parseStringToTrack(trackString) {
			var formatter = new OpenLayers.Format.GPX();
			var trackFeatures = formatter.read(trackString);
			if (!trackFeatures || trackFeatures.length == 0) {
				return null;
			}
			//convert all points
			for (var i = 0; i < trackFeatures.length; i++) {
				var points = trackFeatures[i].geometry.components;
				for (var j = 0; j < points.length; j++) {
					points[j] = util.convertPointForMap(points[j]);
				}
			}
			return trackFeatures;
		}

		/**
		 * add the given track features to the map and zoom to all tracks
		 * @param {Object} trackFeatures: array of OL.FeatureVectors (usually only one) with track points
		 */
		function addTrackToMap(trackFeatures) {
			var layer = this.theMap.getLayersByName(this.TRACK)[0];
			layer.addFeatures(trackFeatures);

			//zoom to track
			var resultBounds = layer.getDataExtent();
			this.theMap.zoomToExtent(resultBounds);
		}

		/*
		* HEIGHT PROFILE
		*/

		/**
		 * extracts coordinates with elevation data (lon, lat, ele)
		 * @param {Object} data string containing the coorinates
		 * @return: array of OL.LonLat.Ele coordinates
		 */
		function parseStringToElevationPoints(data) {
			var results = util.parseStringToDOM(data);
			var ptArray = [];

			var layer = this.theMap.getLayersByName(this.SEARCH)[0];

			var points = util.getElementsByTagNameNS(results, '', 'trkpt');
			$A(points).each(function(pt) {
				var lat = pt.attributes[0].value;
				var lon = pt.attributes[1].value;
				var ele = pt.textContent;

				var pt = new OpenLayers.LonLat.Ele(lon, lat, ele);
				ptArray.push(pt);
			});
			return ptArray;
		}

		/**
		 * shows a hover marker at the given position (and erases all other hover markers)
		 * @param {Object} lon: lon coordinate of the position
		 * @param {Object} lat: lat coordinate of the position
		 */
		function hoverPosition(lon, lat) {
			var layer = this.theMap.getLayersByName(this.HEIGHTS)[0];
			layer.removeAllFeatures();

			var point = util.convertPointForMap(new OpenLayers.LonLat(lon, lat));
			point = new OpenLayers.Geometry.Point(point.lon, point.lat);

			var ft = new OpenLayers.Feature.Vector(point, {
				icon : Ui.markerIcons.unset[0],
				iconEm : Ui.markerIcons.unset[1],
			});
			layer.addFeatures([ft]);
		}


		map.prototype = new EventEmitter();
		map.prototype.constructor = map;

		map.prototype.serializeLayers = serializeLayers;
		map.prototype.restoreLayerPrefs = restoreLayerPrefs;

		map.prototype.clearMarkers = clearMarkers;
		map.prototype.emphMarker = emphMarker;
		map.prototype.convertFeatureIdToPositionString = convertFeatureIdToPositionString;
		map.prototype.getFirstPointIdOfLine = getFirstPointIdOfLine;
		map.prototype.activateSelectControl = activateSelectControl;

		map.prototype.addWaypointMarker = addWaypointMarker;
		map.prototype.addWaypointAtPos = addWaypointAtPos;
		map.prototype.setWaypointType = setWaypointType;
		map.prototype.getWaypointsString = getWaypointsString;

		map.prototype.addGeolocationResultMarker = addGeolocationResultMarker;

		map.prototype.addSearchAddressResultMarkers = addSearchAddressResultMarkers;
		map.prototype.zoomToAddressResults = zoomToAddressResults;

		map.prototype.addSearchPoiResultMarkers = addSearchPoiResultMarkers;
		map.prototype.emphasizeSearchPoiMarker = emphasizeSearchPoiMarker;
		map.prototype.deEmphasizeSearchPoiMarker = deEmphasizeSearchPoiMarker;
		map.prototype.zoomToPoiResults = zoomToPoiResults;

		map.prototype.zoomToMarker = zoomToMarker;
		map.prototype.zoomToFeature = zoomToFeature;

		map.prototype.zoomToRoute = zoomToRoute;
		map.prototype.updateRoute = updateRoute;

		map.prototype.avoidAreaTools = avoidAreaTools;
		map.prototype.checkAvoidAreasIntersectThemselves = checkAvoidAreasIntersectThemselves;
		map.prototype.addAvoidAreas = addAvoidAreas;
		map.prototype.getAvoidAreas = getAvoidAreas;
		map.prototype.getAvoidAreasString = getAvoidAreasString;

		map.prototype.addAccessiblityPolygon = addAccessiblityPolygon;
		map.prototype.eraseAccessibilityFeatures = eraseAccessibilityFeatures;

		map.prototype.writeRouteToString = writeRouteToString;
		map.prototype.parseStringToWaypoints = parseStringToWaypoints;
		map.prototype.parseStringToTrack = parseStringToTrack;
		map.prototype.addTrackToMap = addTrackToMap;

		map.prototype.parseStringToElevationPoints = parseStringToElevationPoints;
		map.prototype.hoverPosition = hoverPosition;

		return map;
	}());
