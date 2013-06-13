OpenRouteService.Map = {
	map : null,
	numLayers : null,
	numOverlays : null,

	initializeMap : function(container, options) {
		OpenLayers.ImgPath = "OpenLayersTheme/dark/";

		//define map options
		options = options || {};
		options.controls = options.controls || [];
		options.maxResolution = options.maxResolution || 156543.0339;
		options.units = options.units || 'm';
		options.projection = options.projection || new OpenLayers.Projection('EPSG:900913');
		options.displayProjection = options.displayProjection || new OpenLayers.Projection('EPSG:4326');
		options.maxExtent = options.maxExtent || new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508);
		options.panDuration = options.panDuration || 15;
		options.theme = options.theme || OpenLayers.ImgPath + '/style.css';

		//see ORS.OpenLayers file for implementation of MapOrs
		this.map = new OpenLayers.MapOrs(container, options);

		this.addControls();
		this.addLayers();

		this.map.numLayers = this.numLayers;
		this.map.numOverlays = this.numOverlays;

		return this.map;
	},
	/**
	 * adds map controls to the map object like layer switcher, mouse potision on map,...
	 */
	addControls : function() {
		this.map.addControl(new OpenLayers.Control.PanZoom());
		this.map.addControl(new OpenLayers.Control.ArgParser());

		this.map.addControl(new OpenLayers.Control.Navigation({
			handleRightClicks : true,
			dragPanOptions : {
				documentDrag : true
			}
		}));

		this.map.addControl(new OpenLayers.Control.LayerSwitcher({
			roundedCorner : 'true',
			roundedCornerColor : 'black',
			id : 'layerSwitcherPanel'
		}));

		//map.addControl(new OpenLayers.Control.Scale());
		this.map.addControl(new OpenLayers.Control.ScaleLine());
		this.map.addControl(new OpenLayers.Control.MousePosition());
		this.map.addControl(new OpenLayers.Control.Permalink());
		this.map.addControl(new OpenLayers.Control.Attribution());

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
		this.map.addControl(clickControl);
		clickControl.activate();

		// external code source: http://spatialnotes.blogspot.com/2010/11/capturing-right-click-events-in.html
		// Get control of the right-click event:
		document.getElementById('openlayers').oncontextmenu = function(e) {
			e = e ? e : window.event;
			if (e.preventDefault)
				e.preventDefault();
			// For non-IE browsers.
			else
				return false;
			// For IE browsers.
		};
		//when zooming or moving the map -> close the context menu
		this.map.events.register("zoomend", this.map, closeContextMenu);
		this.map.events.register("movestart", this.map, closeContextMenu);
		function closeContextMenu() {
			$$('.contextMenu').each(function(cm) {
				cm.remove();
			});
		};

	},
	/**
	 * adds the different layers (like OpenMapSurfer) and overlays (like hillshade, TMC) to the map
	 * Important note: if you add or remove a layer or overlay, please modify the variables numLayers and numOverlays!
	 */
	addLayers : function() {
		this.numLayers = 4;
		this.numOverlays = 3;
		//hillshade, TMC1, TMC2

		//layer 1 - mapnik
		var osmLayer = new OpenLayers.Layer.OSM();
		this.map.addLayer(osmLayer);

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
		// this.map.addLayer(layerMapSurfer);

		// //layer 3 - osm-wms worldwide
		var wms_name = "OSM-WMS worldwide";
		var wms_options = {
			layers : 'osm_auto:all',
			srs : 'EPSG:900913',
			format : 'image/png',
			numZoomLevels : 19
		};
		var layerOSM = new OpenLayers.Layer.WMS(wms_name, OpenRouteService.namespaces.layerWms, wms_options, {
			'buffer' : 2,
			'attribution' : 'Maps and data: &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> and contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
		});
		this.map.addLayer(layerOSM);

		//layer 4 - cycle map
		var layerCycle = new OpenLayers.Layer.OSM("OpenCycleMap", ["http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png", "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png", "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"]);
		this.map.addLayer(layerCycle);

		//overlay - hillshade
		var hs_options = {
			layers : 'europe_wms:hs_srtm_europa',
			srs : 'EPSG:900913',
			format : 'image/jpeg',
			transparent : 'true'
		};
		var hs2 = new OpenLayers.Layer.WMS("Hillshade", OpenRouteService.namespaces.layerHs, hs_options);
		hs2.setOpacity(0.2);
		hs2.visibility = false;
		this.map.addLayer(hs2);

		//TODO too many requests sent
		//overlay - traffic
		var layerTMC_lines = new OpenLayers.Layer.WMS("Germany TMC (Streets)", OpenRouteService.namespaces.overlayTmcLines, {
			'layers' : 'osm_tmc:lines',
			srs : 'EPSG:31467',
			transparent : true,
			format : 'image/png',
			tiled : 'true'
		}, {
			displayInLayerSwitcher : false,
			visibility : false
		});
		this.map.addLayer(layerTMC_lines);

		var layerTMC = new OpenLayers.Layer.WMS("TMC Germany", OpenRouteService.namespaces.overlayTmc, {
			layers : 'tmc:tmcpoints',
			styles : 'tmcPoint_All',
			srs : 'EPSG:31467',
			transparent : true,
			format : 'image/png',
			tiled : 'true'
		}, {
			visibility : false
		});
		this.map.addLayer(layerTMC);
		layerTMC.events.register('visibilitychanged', 'map', function(e) {
			layerTMC_lines.setVisibility(layerTMC.getVisibility());
		});

		//layrers required for routing, etc.
		//route points
		var layerRoutePoints = this.initStylesRoutePointLayer();

		//route lines
		var layerRouteLines = new OpenLayers.Layer.Vector(OpenRouteService.Map.ROUTE_LINES, {
			displayInLayerSwitcher : false,
			'style' : {
				strokeColor : "#009ad5",
				strokeOpacity : 1,
				strokeWidth : 5,
				cursor : "pointer"
			}
		});

		//route instructions
		var layerRouteInstructions = new OpenLayers.Layer.Vector(OpenRouteService.Map.ROUTE_INSTRUCTIONS, {
			displayInLayerSwitcher : false
		});

		//Geolocation
		var layerGeolocation = new OpenLayers.Layer.Markers(OpenRouteService.Map.GEOLOCATION, {
			displayInLayerSwitcher : false
		});

		//Search POI
		var layerPoi = new OpenLayers.Layer.Markers(OpenRouteService.Map.POI, {
			displayInLayerSwitcher : false
		});

		//Search place
		var layerSearch = new OpenLayers.Layer.Markers(OpenRouteService.Map.SEARCH, {
			displayInLayerSwitcher : false
		});

		//avoid areas
		var layerAvoid = new OpenLayers.Layer.Vector(OpenRouteService.Map.AVOID, {
			displayInLayerSwitcher : false
		});
		layerAvoid.redraw(true);
		
		//track lines
		var layerTrack = new OpenLayers.Layer.Vector(OpenRouteService.Map.TRACK, {
			displayInLayerSwitcher : false,
			'style' : {
				strokeColor : "#2c596b",
				strokeOpacity : 1,
				strokeWidth : 4,
				cursor : "pointer"
			}
		});

		//define order
		this.map.addLayers([layerRouteLines, layerTrack, layerRouteInstructions, layerSearch, layerGeolocation, layerPoi, layerRoutePoints, layerAvoid]);
	},
	/**
	 * private method, applies map style information
	 * @return routePoints map layer
	 */
	initStylesRoutePointLayer : function() {
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

		var routePoints = new OpenLayers.Layer.Vector(OpenRouteService.Map.ROUTE_POINTS, {
			styleMap : myStyleMap,
			displayInLayerSwitcher : false,
			rendererOptions : {
				yOrdering : true
			}
		});
		return routePoints
	},
	/**
	 * returns one single string with the layers of the given map that can be used in HTTP GET vars
	 * @param map: Map object to serialize the layers of
	 */
	serializeLayers : function(map) {
		layers = map.layers;
		str = '';
		for (var i = 0, len = layers.length; i < len; i++) {
			var layer = layers[i];
			if (layer.isBaseLayer) {
				str += (layer == this.map.baseLayer) ? "B" : "0";
			} else {
				str += (layer.getVisibility()) ? "T" : "F";
			}
		}
		return str
	},
	/**
	 * restores the given previously selected layers in the map that can be used in HTTP GET vars
	 * @param map: Map object to activate the layers on
	 * @params: layer string with active base layer and overlays
	 */
	restoreLayerPrefs : function(map, params) {
		layers = map.layers
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
};

//layer names
OpenRouteService.Map.ROUTE_LINES = 'routeLines';
OpenRouteService.Map.ROUTE_POINTS = 'routePoints';
OpenRouteService.Map.ROUTE_INSTRUCTIONS = 'routeInstructions';
OpenRouteService.Map.GEOLOCATION = 'Geolocation';
OpenRouteService.Map.POI = 'poi';
OpenRouteService.Map.SEARCH = 'searchResults';
OpenRouteService.Map.AVOID = 'avoidAreas';
OpenRouteService.Map.TRACK = 'track';
