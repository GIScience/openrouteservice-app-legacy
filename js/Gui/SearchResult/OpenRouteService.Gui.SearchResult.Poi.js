/**
 * Class: OpenRouteService.Gui.SearchResult
 * This class represents a geocoding search result for use within a search tool.
 * see class OpenRouteService.Gui.Search
 */
OpenRouteService.Gui.SearchResult.Poi = Class.create(OpenRouteService.Gui.SearchResult, {
	mapRepresentation : null,
	htmlRepresentation : null,
	gmlRepresentation : null,
	lonlat : null,
	shortAddress : null,

	/**
	 * Constructor: OpenRouteService.Gui.SearchResult.Poi
	 * Create a new route..
	 *
	 * Parameters:
	 * options - An Object conaining options as name: value pairs.
	 */
	initialize : function(options, address, description) {
		this.options = options;
		this.mapRepresentation = options.map;
		this.address = address;
		var point = OpenRouteService.Util.getElementsByTagNameNS(address, OpenRouteService.namespaces.gml, 'Point')[0];
		point = OpenRouteService.Util.getElementsByTagNameNS(point, OpenRouteService.namespaces.gml, 'pos')[0];
		
		this.htmlRepresentation = OpenRouteService.convert.xls2html.poi2div(address, this.options.poisNearRoute, this.options.distanceUnit);
		this.shortAddress = OpenRouteService.convert.xls2html.poi2shortText(address);
		this.htmlForWaypoint = OpenRouteService.convert.xls2html.poi2div(address, true, this.options.distanceUnit);

		this.useAsWaypoint = new Element('span', {
			'class' : 'clickable useAsWaypoint',
			'title' : OpenRouteService.Preferences.translate('useAsWaypoint')
		}).observe('click', this.useAsWaypoint.bind(this));
		this.htmlRepresentation.insert(this.useAsWaypoint);

		this.lonlat = OpenRouteService.convert.gml2ol.pos2lonLat(point, this.mapRepresentation.getProjection());

		//choose the icon based on the descriptionTag.
		var icon = OpenRouteService.Gui.poiIcons.get("poi_" + description);
		icon = icon ? icon.clone() : OpenRouteService.Gui.poiIcons.get("poi_default").clone();

		var self = this;
		self.setPosition(this.lonlat.lon, this.lonlat.lat);

		this.mapRepresentation = new OpenLayers.Marker(this.lonlat, icon);
		this.mapRepresentation.setOpacity(0.7);

		//highlight the result on mouseover
		$(this.htmlRepresentation).observe('mouseover', function() {
			self.mapRepresentation.setOpacity(1);
			self.mapRepresentation.inflate(1.4);
			self.htmlRepresentation.addClassName('highlight')
		});
		//stop highlighting on mouseout
		$(this.htmlRepresentation).observe('mouseout', function() {
			self.mapRepresentation.setOpacity(0.7);
			self.mapRepresentation.inflate(0.715);
			self.htmlRepresentation.removeClassName('highlight')
		});
		$(this.htmlRepresentation).observe('click', function() {
			self.moveAndZoom();
		});
	},
	setResultClickOperation : function(resultClickOperation) {
		this.resultClickOperation = resultClickOperation;
	},
	/**
	 * set the icon at the correct position
	 * (copied from ORS.Gui.Waypoint.js + modified)
	 */
	setPosition : function(lon, lat) {
		this.olRepresentation = new OpenLayers.Geometry.Point(lon, lat);

		//won't work with the current instance
		this.mapRepresentation = new OpenLayers.Feature(this.olRepresentation);

		if(null == this.gmlRepresentation) {
			this.gmlRepresentation = OpenRouteService.Util.parseStringToDOM('<gml:Point xmlns:gml="http://www.opengis.net/gml"> <gml:pos srsName="EPSG:4326">8.0 51.0</gml:pos> </gml:Point>').firstChild;
		}
	},
	/**
	 * center the map around the POI and zoom to it.
	 * (copied from ORS.Gui.Waypoint.js + modified)
	 */
	moveAndZoom : function() {
		var lonlat = new OpenLayers.LonLat(this.olRepresentation.x, this.olRepresentation.y);
		this.options.map.moveTo(lonlat);
		this.options.map.zoomTo(18);

	}
});
