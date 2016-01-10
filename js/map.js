/**
 * Leaflet map and functions
 */
var Map = (function() {
    /* *********************************************************************
     * STYLES
     * *********************************************************************/
    var $ = window.jQuery;
    var self;
    /**
     * Constructor
     * @param  {[type]} container [description]
     */
    function map(container) {
        self = this;
        /* *********************************************************************
         * MAP LAYERS
         * *********************************************************************/
        this.openmapsurfer = L.tileLayer(namespaces.layerMapSurfer, {
            id: 'openmapsurfer',
            attribution: 'Map data &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors, powered by <a href="http://mapsurfernet.com/">MapSurfer.NET</a>'
        });
        this.openstreetmap = L.tileLayer(namespaces.layerOSM, {
            id: 'openstreetmap',
            attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        });
        this.ors_osm_worldwide = L.tileLayer.wms(namespaces.layerWms, {
            id: 'openstreetmap_worldwide',
            layers: 'osm_auto:all',
            format: 'image/png',
            maxZoom: 19,
            attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        });
        this.opencyclemap = L.tileLayer(namespaces.layerOSMCycle, {
            id: 'opencyclemap',
            attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        });
        this.aster_hillshade = L.tileLayer.wms(namespaces.layerHs, {
            format: 'image/png',
            opacity: 0.45,
            transparent: true,
            attribution: '<a href="http://srtm.csi.cgiar.org/">SRTM</a>; ASTER GDEM is a product of <a href="http://www.meti.go.jp/english/press/data/20090626_03.html">METI</a> and <a href="https://lpdaac.usgs.gov/products/aster_policies">NASA</a>',
            crs: L.CRS.EPSG900913
        });
        this.stamen = L.tileLayer(namespaces.stamenUrl, {
            id: 'stamen',
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
        });
        /* *********************************************************************
         * MAP INIT & MAP LOCATION
         * *********************************************************************/
        // avoid polygons layer has to be defined before map is created
        this.layerAvoid = new L.featureGroup();
        this.theMap = new L.map(container, {
            center: [49.409445, 8.692953],
            minZoom: 2,
            zoom: 13,
            attributionControl: true,
            crs: L.CRS.EPSG900913,
            layers: [this.openmapsurfer],
            editable: true,
            editOptions: {
                skipMiddleMarkers: false,
                featuresLayer: this.layerAvoid
            }
        });
        this.baseLayers = {
            "OpenMapSurfer": this.openmapsurfer,
            "OSM-WMS worldwide": this.ors_osm_worldwide,
            "Openstreetmap": this.openstreetmap,
            "OpenCycleMap": this.opencyclemap,
            "Stamen Maps": this.stamen
        };
        this.overlays = {
            "Hillshade": this.aster_hillshade
        };
        L.control.mousePosition({
            position: 'topright',
            separator: ', '
        }).addTo(this.theMap);
        this.layerControls = L.control.layers(this.baseLayers, this.overlays);
        this.layerControls.addTo(this.theMap);
        L.control.scale().addTo(this.theMap);
        var markers = [{
            "name": "Canada",
            "url": "https://en.wikipedia.org/wiki/Canada",
            "lat": 49.409445,
            "lng": 8.692953
        }, ];
        this.elevationControl = L.control.elevation({
            position: "topright",
            theme: "steelblue-theme", //default: lime-theme
            width: 400,
            height: 125,
            margins: {
                top: 10,
                right: 20,
                bottom: 30,
                left: 50
            },
            useHeightIndicator: true, //if false a marker is drawn at map position
            interpolation: "basis", //see https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-area_interpolate
            hoverNumber: {
                decimalsX: 3, //decimals on distance (always in km)
                decimalsY: 0, //deciamls on height (always in m)
                formatter: undefined //custom formatter function may be injected
            },
            xTicks: undefined, //number of ticks in x axis, calculated by default according to width
            yTicks: undefined, //number of ticks on y axis, calculated by default according to height
            collapsed: true, //collapsed mode, show chart on click or mouseover,
            yAxisMin: 0
        });
        this.layerRoutePoints = L.featureGroup().addTo(this.theMap);
        this.layerRouteLines = L.featureGroup().addTo(this.theMap);
        this.layerCornerPoints = L.featureGroup().addTo(this.theMap);
        this.layerGeolocation = L.featureGroup().addTo(this.theMap);
        this.layerPoi = L.featureGroup().addTo(this.theMap);
        this.layerSearch = L.featureGroup().addTo(this.theMap);
        this.layerTrack = L.featureGroup().addTo(this.theMap);
        this.layerAccessibility = L.featureGroup().addTo(this.theMap);
        this.layerTMC = L.featureGroup().addTo(this.theMap);
        this.layerControls.addOverlay(this.layerTMC, 'Traffic Information');
        this.layerRestriction = L.featureGroup().addTo(this.theMap);
        this.layerAvoid.addTo(this.theMap);
        /* *********************************************************************
         * MAP CONTROLS
         * *********************************************************************/
        this.theMap.on('contextmenu', function(e) {
            var displayPos = e.latlng;
            $('.leaflet-popup-content').remove();
            var menuObject = createMapContextMenu();
            var popup = L.popup({
                closeButton: false,
                maxHeight: '112px',
                maxWidth: '120px',
                className: 'mapContextMenu'
            }).setContent(menuObject.innerHTML).setLatLng(e.latlng);
            self.theMap.openPopup(popup);
            var options = $('.leaflet-popup-content');
            options = options[0].childNodes;
            options[0].onclick = function(e) {
                //click on start point
                self.emit('map:addWaypoint', {
                    pos: displayPos,
                    type: Waypoint.type.START
                });
                self.theMap.closePopup(popup);
            };
            options[1].onclick = function(e) {
                //click on via point
                self.emit('map:addWaypoint', {
                    pos: displayPos,
                    type: Waypoint.type.VIA
                });
                self.theMap.closePopup(popup);
            };
            options[2].onclick = function(e) {
                //click on end point
                self.emit('map:addWaypoint', {
                    pos: displayPos,
                    type: Waypoint.type.END
                });
                self.theMap.closePopup(popup);
            };
        });
        // load graph info when map loaded
        var url;
        if (location.hostname.match('openrouteservice') || location.hostname.match('localhost')) {
            url = "cgi-bin/proxy.cgi?url=" + namespaces.services.routing + "?info";
        } else {
            url = namespaces.services.routing + "?info";
        }
        jQuery.ajax({
            url: url,
            dataType: 'json',
            type: 'GET',
            crossDomain: false,
            success: updateInfoPanel,
            error: updateInfoPanel
        });

        function updateInfoPanel(results) {
            var infoPanel = document.getElementById("infoPanel");
            var lastUpdate = new Date(results.profiles['profile 1'].import_date);
            lastUpdate = lastUpdate.getUTCDate() + '.' + (parseInt(lastUpdate.getMonth()) + parseInt(1)) + '.';
            var nextUpdate = results.next_update !== undefined ? results.next_update : '?';
            nextUpdate = new Date(nextUpdate);
            nextUpdate = nextUpdate.getUTCDate() + '.' + (parseInt(nextUpdate.getMonth()) + parseInt(1)) + '.';
            infoPanel.innerHTML += '(' + '<b>Last/Next Update</b> ' + lastUpdate + '/' + nextUpdate + ')';
        }
        // create a new contextMenu
        function createMapContextMenu() {
            var mapContextMenuContainer = new Element('div', {
                'id': 'mapContextMenu',
                'style': 'display:none',
            });
            var useAsStartPointContainer = new Element('div', {
                'class': 'contextWaypoint'
            });
            var startSpan = new Element('span', {
                'id': 'contextStart',
            }).update('Set as starting point');
            useAsStartPointContainer.appendChild(startSpan);
            var useAsViaPointContainer = new Element('div', {
                'class': 'contextWaypoint'
            });
            var viaSpan = new Element('span', {
                'id': 'contextVia',
            }).update('Add a waypoint');
            useAsViaPointContainer.appendChild(viaSpan);
            var useAsEndPointContainer = new Element('div', {
                'class': 'contextWaypoint'
            });
            var endSpan = new Element('span', {
                'id': 'contextEnd',
            }).update('Set as destination');
            useAsEndPointContainer.appendChild(endSpan);
            mapContextMenuContainer.appendChild(useAsStartPointContainer);
            mapContextMenuContainer.appendChild(useAsViaPointContainer);
            mapContextMenuContainer.appendChild(useAsEndPointContainer);
            return mapContextMenuContainer;
        }
        //avoid area controls
        L.NewPolygonControl = L.Control.extend({
            options: {
                position: 'topleft'
            },
            onAdd: function(map) {
                var container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
                    link = L.DomUtil.create('a', '', container);
                link.href = '#';
                link.title = 'Create a new polygon';
                link.innerHTML = '▱';
                L.DomEvent.on(link, 'click', L.DomEvent.stop).on(link, 'click', function() {
                    map.editTools.startPolygon();
                });
                return container;
            }
        });
        this.theMap.addControl(new L.NewPolygonControl());
        var deleteShape = function(e) {
            if ((e.originalEvent.ctrlKey || e.originalEvent.metaKey) && this.editEnabled()) {
                this.editor.deleteShapeAt(e.latlng);
                self.layerAvoid.removeLayer(e.target._leaflet_id);
                self.emit('map:routingParamsChanged');
                self.emit('map:avoidAreaChanged', self.getAvoidAreasString());
                // remove overlay in controls if no regions left
                if (self.layerAvoid.getLayers().length === 0) self.layerControls.removeLayer(self.layerAvoid);
            }
        };
        this.theMap.on('layeradd', function(e) {
            if (e.layer instanceof L.Path) e.layer.on('click', L.DomEvent.stop).on('click', deleteShape, e.layer);
            if (e.layer instanceof L.Path) e.layer.on('dblclick', L.DomEvent.stop).on('dblclick', e.layer.toggleEdit);
        });
        var shapeListener = function(e) {
            // var errorous = self.checkAvoidAreasIntersectThemselves();
            // if (errorous) self.emit('map:errorsInAvoidAreas', true);
            // else self.emit('map:errorsInAvoidAreas', false);
            self.emit('map:routingParamsChanged');
            self.emit('map:avoidAreaChanged', self.getAvoidAreasString());
            self.layerControls.addOverlay(self.layerAvoid, 'Avoidable Regions');
        };
        //this.theMap.on('editable:drawing:end', addTooltip);
        //this.theMap.on('editable:shape:deleted', shapeListener);
        this.theMap.on('editable:drawing:commit', shapeListener);
        this.theMap.on('editable:vertex:deleted', shapeListener);
        this.theMap.on('editable:vertex:dragend', shapeListener);
        /* *********************************************************************
         * MAP EVENTS
         * *********************************************************************/
        function emitMapChangedEvent(e) {
            // without this condition map zoom lat/lon isnt loaded from cookies
            if (!initMap) {
                var centerTransformed = self.theMap.getCenter();
                self.emit('map:changed', {
                    zoom: self.theMap.getZoom(),
                    lat: centerTransformed.lat,
                    lon: centerTransformed.lng
                });
            }
            // hide/remove layers depending on zoom level
            var currentZoom = self.theMap.getZoom();
            if (currentZoom < 14) self.theMap.removeLayer(self.layerCornerPoints);
            else self.theMap.addLayer(self.layerCornerPoints);
        }

        function emitMapChangedZoom(e) {
            var layer = self.layerRouteLines.getLayers();
            var currentZoom = self.theMap.getZoom();
            // pass zoom level to style functions
            for (var i = 0; i < layer.length; i++) {
                if (layer[i].options.zoomChange === 'routeOutline') layer[i].setStyle(styles.routeOutline(currentZoom, true));
                else if (layer[i].options.zoomChange === 'routePadding') layer[i].setStyle(styles.routePadding(currentZoom));
                else if (layer[i].options.zoomChange === 'route') layer[i].setStyle(styles.route(currentZoom));
                else if (layer[i].options.zoomChange === 'routeCorners') layer[i].setStyle(styles.routeCorners(currentZoom));
            }
        }

        function emitMapChangeBaseMap(e) {
            // without this condition map zoom lat/lon isnt loaded from cookies
            if (!initMap) {
                var changedLayer = e.name;
                self.emit('map:basemapChanged', {
                    layer: self.serializeLayers(changedLayer)
                });
            }
        }
        this.theMap.on('baselayerchange', emitMapChangeBaseMap);
        this.theMap.on('zoomend', emitMapChangedEvent);
        this.theMap.on('moveend', emitMapChangedEvent);
        this.theMap.on('zoomend', emitMapChangedZoom);
    }
    /* *********************************************************************
     * TMC LAYER
     * *********************************************************************/
    var tmcGeojson, tmcLayer;
    var tmcWarnings = new L.MarkerClusterGroup({
        showCoverageOnHover: false,
        disableClusteringAtZoom: 12
    });

    function emitloadTMC(forceUpdate) {
        // reload TMC Layer when map paned
        Controller.loadTMC();
    }

    function getColor(d) {
        var codes = d.split(',');
        for (var i = 0; i < codes.length; i++) {
            if (codes[i] in list.tmc) {
                warningColor = list.tmc[codes[i]][1];
                break;
            }
        }
        // if codes not in dict return default
        var warningColor = warningColor !== undefined ? warningColor : '#EF0013';
        return warningColor;
    }

    function getWarning(d) {
        var codes = d.split(',');
        for (var i = 0; i < codes.length; i++) {
            if (codes[i] in list.tmc) {
                warningIcon = list.tmc[codes[i]][0];
                break;
            }
        }
        // if codes not in dict return default
        var warningIcon = warningIcon !== undefined ? warningIcon : './img/warning_undefined.png';
        return warningIcon;
    }

    function style(feature) {
        return {
            weight: 5,
            opacity: 1.0,
            color: getColor(feature.properties.codes)
        };
    }

    function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({
            weight: 7,
            opacity: 1
        });
        if (!L.Browser.ie && !L.Browser.opera) {
            layer.bringToFront();
        }
    }

    function resetHighlight(e) {
        tmcGeojson.resetStyle(e.target);
    }

    function zoomToFeatureShowPopup(e) {
        self.theMap.fitBounds(e.target.getBounds());
        //show popup with message
        var popup = L.popup({
            closeButton: true,
            //maxHeight: '112px',
            //maxWidth: '200px',
            //className: 'mapContextMenu'
        }).setContent(e.target.feature.properties.message).setLatLng(e.latlng);
        self.theMap.openPopup(popup);
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeatureShowPopup
        });
        var tmcIcon = L.icon({
            iconUrl: getWarning(feature.properties.codes),
            iconAnchor: [11, 11],
            iconSize: [22, 22],
        });
        var tmcMarker = L.marker(getIconLocation(feature), {
            icon: tmcIcon
        }).bindPopup(feature.properties.message); //.addTo(tmcLayer);
        tmcWarnings.addLayer(tmcMarker);
    }

    function getIconLocation(feature) {
        var coords = feature.geometry.coordinates;
        return new L.LatLng(coords[0][1], coords[0][0]);
    }

    function updateTmcInformation(data) {
        // clear tmc layer
        tmcLayer = this.layerTMC;
        tmcLayer.clearLayers();
        tmcWarnings.clearLayers();
        tmcGeojson = L.geoJson(data, {
            onEachFeature: onEachFeature,
            style: style,
        }).addTo(tmcLayer);
        tmcLayer.addLayer(tmcWarnings);
        // bring tmc layer to front
        tmcLayer.bringToFront();
    }
    /* *********************************************************************
     * FOR PERMALINK OR COOKIE
     * *********************************************************************/
    /**
     * returns one single string with the layers of the given map that can be used in HTTP GET vars
     * if layer is undefined return and use saved active layer
     */
    function serializeLayers(layer) {
        var baseLayer;
        baseLayer = layer;
        var str = '';
        var baseLayers = this.baseLayers;
        for (var i in baseLayers) {
            if (i == baseLayer) {
                str += "B";
            } else {
                str += "0";
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
        var layers = this.baseLayers;
        var result, indices = [];
        //set given map layer active
        var baseLayerIdx = params.indexOf('B') >= 0 ? params.indexOf('B') : 0;
        baseLayer = Object.keys(layers)[baseLayerIdx];
        this.theMap.addLayer(layers[baseLayer]);
        //TODO determine which overlays to set active
        // var regex = /T/gi;
        // while ((result = regex.exec(params))) {
        //     indices.push(result.index);
        // }
        // for (var i = 0; i < indices.length; i++) {
        //     if (layers[indices[i]]) {
        //         layers[indices[i]].setVisibility(true);
        //     }
        // }
    }
    /* *********************************************************************
     * GENERAL
     * *********************************************************************/
    function updateSize() {
        this.theMap.invalidateSize();
    }
    /**
     * removes all (appropriate) markers/ features from the given layer
     *  @param layerName: name of the layer to remove the objects from
     *  @param waypointIndex: index of the waypoint where to remove objects from
     */
    function clearMarkers(layerName, featureIds) {
        if (featureIds && featureIds.length > 0) {
            for (var i = 0; i < featureIds.length; i++) {
                if (featureIds[i]) {
                    layerName.removeLayer(featureIds[i]);
                }
            }
            // check if layer has empty of features and if it does remove it
            if (layerName.getLayers().length === 0) this.layerControls.removeLayer(layerName);
        } else {
            layerName.clearLayers();
            this.layerControls.removeLayer(layerName);
        }
    }
    /**
     * Move and zoom the map to a given marker
     * @param position: leaflet latlng object
     * @param zoom: zoom int
     */
    function zoomToMarker(position, zoom) {
        this.theMap.setView(position, zoom);
    }
    /**
     * zoom to a given feature vector defined by its vector id.
     * @param mapLayer: layer of the map where the feature is located
     * @param zoom: optional zoom level
     */
    function zoomToFeature(mapLayer, vectorId, zoom) {
        if (mapLayer) {
            var vectors = mapLayer.getLayer(vectorId);
            if (!zoom) {
                if (vectors.getBounds) {
                    this.theMap.fitBounds(vectors.getBounds());
                } else {
                    if (!zoom) {
                        this.theMap.panTo(vectors.getLatLng());
                    } else {
                        this.theMap.setView(vectors.getLatLng(), zoom);
                    }
                }
            }
        }
    }
    /**
     * when performing certain actions on the Ui, LL features need to be emphasized/ deemphasized.
     * @param layer: the layer the feature is located on
     * @param featureId: LL id of the feature to emph/deemph
     * @param emph: if true, the feature is emphasized; if false, the feature is deemphasized
     */
    function emphMarker(layer, featureId, emph) {
        var myLayer = this[layer];
        myLayer = myLayer ? myLayer : null;
        if (myLayer) {
            var marker = myLayer.getLayer(featureId);
            if (marker) {
                if (emph) {
                    //emphasize feature
                    if (layer == 'layerRoutePoints') {
                        marker.setIcon(marker.options.icon_emph);
                    } else if (layer == 'layerRouteLines') {
                        marker.setStyle({
                            fillColor: '#ff9900',
                            color: '#ff9900'
                        });
                    }
                } else {
                    if (layer == 'layerRoutePoints') {
                        marker.setIcon(marker.options.icon_orig);
                    } else if (layer == 'layerRouteLines') {
                        marker.setStyle({
                            fillColor: '#ffffff',
                            color: '#4682B4'
                        });
                    }
                }
            }
        }
    }
    /**
     * based on an Leaflet feature id and the layer the feature is located on, the position is looked up
     * @param featureId: LL feature ID as string
     * @param layer: string name of the layer the feature is located on.
     * @return: string with the position of the feature; style: 'x-coordinate y-coordinate'
     */
    function convertFeatureIdToPositionString(featureId, layer) {
        featureId = parseInt(featureId);
        var ft = layer.getLayer(featureId);
        if (ft && ft._latlng) {
            return ft._latlng.lat + ' ' + ft._latlng.lng;
        }
    }
    /**
     * based on an Leaflet feature id and the layer the feature is located on, the position is looked up
     * @param featureId: LL feature ID as string
     * @param layer: string name of the layer the feature is located on.
     * @return: leaflet position object
     */
    function convertFeatureIdToPosition(featureId, layer) {
        featureId = parseInt(featureId);
        var ft = layer.getLayer(featureId);
        if (ft && ft.getLatLng()) {
            return ft.getLatLng();
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
        var layerSearchResults = this.layerSearch;
        var layerWaypoints = this.layerRoutePoints;
        var oldMarker = layerSearchResults.getLayer(featureId);
        if (oldMarker) {
            newMarker = new L.marker(oldMarker.getLatLng(), {
                draggable: true,
                icon: Ui.markerIcons[type],
                icon_orig: Ui.markerIcons[type],
                icon_emph: Ui.markerIcons.emph
            });
            newMarker.addTo(this.layerRoutePoints);
            newMarker.on('dragend', function(e) {
                self.emit('map:waypointMoved', e.target);
            });
            newMarker.on('drag', function(e) {
                panMapOnEdges(e);
            });
            return newMarker._leaflet_id;
        }
    }
    /**
     * add a waypoint marker with the given type at the given position (e.g. by clicking on the map saying 'add a waypoint here')
     * @param position: OL LonLat containing the position where the new waypoint should be created
     * @param wpIndex: int index the waypoint should be assigned to
     * @param type: type of the waypoint (start, via, end)
     */
    function addWaypointAtPos(position, wpIndex, type) {
        newMarker = new L.marker(position, {
            draggable: true,
            icon: Ui.markerIcons[type],
            icon_orig: Ui.markerIcons[type],
            icon_emph: Ui.markerIcons.emph
        });
        newMarker.addTo(this.layerRoutePoints);
        newMarker.on('dragend', function(e) {
            self.emit('map:waypointMoved', e.target);
        });
        newMarker.on('drag', function(e) {
            panMapOnEdges(e);
        });
        return newMarker._leaflet_id;
    }
    /**
     * sets the type of the given waypoint identified by its feature ID
     * @param featureId: Leaflet feature ID as string
     * @param type: type of the waypoint (start, via, end)
     */
    function setWaypointType(featureId, type) {
        var feature = this.layerRoutePoints.getLayer(featureId);
        if (feature) {
            var newFeature = new L.marker(feature.getLatLng(), {
                draggable: true,
                icon: Ui.markerIcons[type],
                icon_orig: Ui.markerIcons[type],
                icon_emph: Ui.markerIcons.emph
            });
            newFeature.on('dragend', function(e) {
                self.emit('map:waypointMoved', e.target);
            });
            newFeature.on('drag', function(e) {
                panMapOnEdges(e);
            });
            newFeature.addTo(this.layerRoutePoints);
            this.layerRoutePoints.removeLayer(feature);
            var id = newFeature._leaflet_id;
            return id;
        }
    }
    /**
     * get number of waypoints
     * @return: amount of waypoints
     */
    function getWaypointsAmount() {
        var layer = this.theMap.getLayersByName(this.ROUTE_POINTS)[0];
        var nWaypoints = layer.features.length;
        return nWaypoints;
    }
    /**
     * encode all waypoints by their position in a string; used e.g. for permalink
     * @return: string of LonLat positions; style: 'lon1,lat1,lon2,lat2,...lonk,latk'
     */
    function getWaypointsString() {
        var wpString = "";
        var layer = this.theMap.getLayersByName(this.ROUTE_POINTS)[0];
        //serialize these features to string
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
        var layer = this.layerGeolocation;
        layer.clearLayers();
        //convert corrdinates of marker
        var feature = null;
        if (position) {
            feature = new L.marker(position, {
                icon: Ui.markerIcons.unset,
                icon_orig: Ui.markerIcons.unset,
                //icon_emph: Ui.markerIcons.emph
            });
            feature.addTo(layer);
            this.theMap.setView(position, 14);
        }
        return feature;
    }
    /*
     * SEARCH ADDRESS
     */
    /**
     * transform given search results to markers and add them on the map.
     * (this is also used for waypoint search results)
     * @param {Object} listOfPoints array of Leaflet.LonLat
     * @return array with added Leaflet Marker
     */
    function addSearchAddressResultMarkers(listOfPoints, wpIndex) {
        var listOfFeatures = [];
        for (var i = 0; i < listOfPoints.length; i++) {
            //convert corrdinates of marker
            var point = listOfPoints[i];
            var feature = null;
            if (point) {
                var position = [point[1], point[0]];
                var ftId;
                if (wpIndex) {
                    //a waypoint search
                    ftId = 'address_' + wpIndex + '_' + i;
                } else {
                    //an address search
                    ftId = 'address_' + i;
                }
                feature = new L.marker(position, {
                    draggable: true,
                    icon: Ui.markerIcons.unset,
                    icon_orig: Ui.markerIcons.unset,
                    icon_emph: Ui.markerIcons.emph
                });
                feature.addTo(self.layerSearch);
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
        this.theMap.fitBounds(self.layerSearch.getBounds());
        // var layerSearchResults = this.theMap.getLayersByName(this.SEARCH)[0];
        // var resultBounds = layerSearchResults.getDataExtent();
        // this.theMap.zoomToExtent(resultBounds);
        // if (this.theMap.getZoom() > 14) {
        //     this.theMap.zoomTo(14);
        // }
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
                icon: icon,
                iconEm: icon
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
     * Called for Bicycle profil
     * draws given points as height map on top of route
     * route is hidden with opacity 0
     * @param {Object} routeLineSegments: array of Leaflet Linestrings with height information
     */
    function updateHeightprofiles(routeLineHeights) {
        var el = this.elevationControl;
        el.addTo(this.theMap);
        this.layerRouteLines.clearLayers();
        el.clear();
        var polyline = L.polyline(routeLineHeights).toGeoJSON();
        var gjl = L.geoJson(polyline, {
            opacity: '0',
            onEachFeature: el.addData.bind(el)
        }).addTo(this.layerRouteLines);
    }
    /**
     * draws given points as route line on the map
     * adds route and corner points twice, the base information has to be added
     * to enable click events on route instructions for individual segments
     * visible route is one feature thus has one id
     * @param {Object} routeLineSegments: array of Linestrings
     * @param {Object} routeLinePoints: array of Points
     * @param routePref: Bike, Car etc..
     * @return array of Leaflet Ids added to the layer
     */
    function updateRoute(routeLineSegments, routeLinePoints, routePref) {
        this.layerRouteLines.clearLayers();
        this.layerCornerPoints.clearLayers();
        // clear elevation info if not bike
        var el = this.elevationControl;
        if ($.inArray(routePref, list.elevationProfiles) < 0) {
            el.clear();
            el.remove();
        }
        var ftIds = [];
        if (routeLineSegments && routeLineSegments.length > 0) {
            var self = this;
            var routeString = [];
            var routeStringCorners = [];
            for (var i = 0; i < routeLineSegments.length; i++) {
                //"lines" of the route, these are invisible and only used for 
                // click to segment
                var segment = [];
                for (var j = 0; j < routeLineSegments[i].length; j++) {
                    segment.push(routeLineSegments[i][j]);
                    routeString.push(routeLineSegments[i][j]);
                }
                // invisible route segment for clicking
                var segmentBase = L.polyline(segment, styles.routeBase());
                segmentBase.addTo(self.layerRouteLines);
                //"corner points" of the route where direction changes
                var cornerPoint = routeLinePoints[i];
                var routeCornerBase = L.marker(cornerPoint, styles.routeCornersBase());
                routeCornerBase.addTo(self.layerCornerPoints);
                routeStringCorners.push(routeLinePoints[i]);
                ftIds.push(segmentBase._leaflet_id, routeCornerBase._leaflet_id);
            }
            // this is a combined linestring of all sub segments with a border
            L.polyline(routeString, styles.routeOutline(self.theMap.getZoom())).addTo(self.layerRouteLines);
            L.polyline(routeString, styles.routePadding(self.theMap.getZoom())).addTo(self.layerRouteLines);
            L.polyline(routeString, styles.route(self.theMap.getZoom())).addTo(self.layerRouteLines);
            // add corner points on top 
            for (var k = 0; k < routeStringCorners.length; k++) {
                new L.CircleMarker(routeStringCorners[k], styles.routeCorners(self.theMap.getZoom())).addTo(this.layerRouteLines);
            }
        }
        // bring tmc layer to front
        this.layerTMC.bringToFront();
        return ftIds;
    }
    /**
     * zooms the map so that the whole route becomes visible (i.e. all features of the route line layer)
     */
    function zoomToRoute() {
        this.theMap.fitBounds(this.layerRoutePoints.getBounds());
    }
    /*
     * AVOID AREAS
     */
    /**
     * checks if two avoid areas, i.e. polygons intersect each other.
     * @return true, if polygons intersect; otherwise false
     */
    function checkAvoidAreasIntersectThemselves() {
        var polygons = this.layerAvoid.getLayers();
        var intersect = false;
        if (polygons.length > 1) {
            for (var i = 0; i < polygons.length - 1; i++) {
                for (var j = i + 1; j < polygons.length; j++) {
                    a = turf.polygon(polygons[j].toGeoJSON().geometry.coordinates);
                    b = turf.polygon(polygons[i].toGeoJSON().geometry.coordinates);
                    if (turf.intersect(a, b) !== undefined) {
                        console.log(turf.intersect(a, b));
                        intersect = true;
                        return intersect;
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
        var layerAvoid = this.layerAvoid;
        if (areas && areas.length > 0) {
            for (var i = 0; i < areas.length; i++) {
                areas[i].addTo(layerAvoid);
            }
        }
        var self = this;
        this.emit('map:avoidAreaChanged', self.getAvoidAreasString());
    }
    /**
     * gets all avoid area polygons
     * used for e.g. routing service request
     * @return avoid areas as array of Leaflet Layer
     */
    function getAvoidAreas() {
        var layerAvoid = this.layerAvoid;
        return layerAvoid.getLayers();
    }
    /**
     * gets all avoid area polygons
     * used e.g. for permalink
     * @return avoid areas as string of polygon points; style: 'poly1pt1.y,poly1pt1.x,poly1pt2.x,poly1pt2.y,...'
     */
    function getAvoidAreasString() {
        var layerAvoid = this.layerAvoid.getLayers();
        //serialize these features to string
        var avAreaString = "";
        for (var i = 0; i < layerAvoid.length; i++) {
            var avAreaPoints = layerAvoid[i].getLatLngs()[0];
            for (var j = 0; j < avAreaPoints.length; j++) {
                avAreaString += avAreaPoints[j].lng + escape(',') + avAreaPoints[j].lat + escape(',');
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
     * @param polygon: Polygon LatLngs, the polygon to add
     */
    function addAccessiblityPolygon(polygonArray) {
        var colorRange = rangeColors(polygonArray.length - 1);
        for (var i = polygonArray.length - 1; i >= 0; i--) {
            L.polygon(polygonArray[i], styles.accessibilityAnalysis(colorRange[i])).addTo(this.layerAccessibility);
        }
        this.layerControls.addOverlay(this.layerAccessibility, 'Accessibility Analysis');
    }
    /**
     * adds the restrictions along the route to the map
     *  @param query: array [queryString, vectorArray] representing the overpass query and the polygon for displaying the bounding box
     *  @param routePref: from PermaInfo
     */
    function updateRestrictionsLayer(query, routePref) {
        if (routePref != 'HeavyVehicle') {
            this.layerRestriction.clearLayers();
            // if(this.theMap.hasLayer(this.polygon)) this.theMap.removeLayer(this.polygon);
            this.layerControls.removeLayer(this.layerRestriction); //Don't show the Restrictions control in the controller if the Profile is not HV
            return;
        }
        var overpassQuery = query[0];
        var bboxArray = query[1];
        this.layerRestriction.clearLayers();
        // if(this.theMap.hasLayer(this.polygon)) this.theMap.removeLayer(this.polygon);
        // this.polygon = L.polygon([bboxArray]).addTo(this.theMap);
        this.layerRestriction.addLayer(new L.OverPassLayer({
            query: overpassQuery
        }));
        this.layerControls.addOverlay(this.layerRestriction, "Restrictions");
    }
    /**
     * removes all accessibility analysis features from the layer
     */
    function eraseAccessibilityFeatures() {
        var layer = this.layerAccessibility;
        layer.clearLayers();
    }
    /*
     * IMPORT / EXPORT
     */
    /**
     * generates a GPX String based on the route
     * @param {Object} singleRouteLineString: current route as a single OL.Geometry.LineString
     * @return string with encoded route information
     */
    function writeRouteToString(singleRouteLineString) {
        var route;
        if (singleRouteLineString) {
            route = L.polyline(singleRouteLineString).toGeoJSON();
            route = togpx(route);
            //insert line breaks for nicely readable code
            route = route.replace(/></g, '>\n<');
            //note: doesn't include namespaces in every tag any more
        }
        return route;
    }
    /**
     * Based on the String with GPX information multiple waypoints - depending on the granularity input of the user - are extracted
     * @param {Object} routeString: String with GPX track
     * @param {Number} granularity: Value picked in dropdown list
     * @return: array of two or more waypoints of Leaflet LatLng or null if no adequate data available
     */
    function parseStringToWaypoints(routeString, granularity) {
        var featureVectors = jQuery.parseXML(routeString);
        featureVectors = toGeoJSON.gpx(featureVectors);
        //var formatter = new OpenLayers.Format.GPX();
        //var featureVectors = formatter.read(routeString);
        if (!featureVectors || featureVectors.length == 0) {
            return null;
        }
        var linePoints = featureVectors.features[0].geometry.coordinates;
        if (linePoints && linePoints.length >= 2) {
            var positions = getWaypointsByGranularity(linePoints, granularity);
            return positions;
        } else {
            return null;
        }
    }
    /**
     * getWaypointsByGranularity
     * @param {Object} linePoints: All GPX points
     * @param {Number} granularity: Value picked in dropdown list
     * @return array of Points with flight distance given in granularity
     */
    function getWaypointsByGranularity(linePoints, granularity) {
        var routepointList = [];
        var startPoint = L.latLng(linePoints[0][1], linePoints[0][0]);
        routepointList.push(startPoint);
        var sumDistance = 0;
        for (var i = 1; i < linePoints.length - 2; i++) {
            var lastPoint = L.latLng(linePoints[i - 1][1], linePoints[i - 1][0]);
            var thisPoint = L.latLng(linePoints[i][1], linePoints[i][0]);
            sumDistance += util.calcFlightDistance(lastPoint, thisPoint);
            if (sumDistance > Number(granularity)) {
                routepointList.push(thisPoint);
                sumDistance = 0;
            }
        }
        var endPoint = L.latLng(linePoints[linePoints.length - 1][1], linePoints[linePoints.length - 1][0]);
        routepointList.push(endPoint);
        return routepointList;
    }
    /**
     * Based on the String with GPX information a track (an Leaflet Polyline object) is extracted
     * @param {Object} trackString: String with GPX track
     * @return Leaflet Polyline containing the track points
     */
    function parseStringToTrack(trackString) {
        var track = jQuery.parseXML(trackString);
        track = toGeoJSON.gpx(track);
        var gpxTrack = [];
        var coords = track.features[0].geometry.coordinates;
        for (var i = 0; i < coords.length; i++) {
            gpxTrack.push([coords[i][1], coords[i][0]]);
        }
        track = L.polyline(gpxTrack, styles.gpxTrack());
        return track;
    }
    /**
     * add the given track features to the map and zoom to all tracks
     * @param {Object} trackFeatures: Leaflet Polyline with GPX track points
     */
    function addTrackToMap(trackFeatures) {
        var layer = this.layerTrack;
        trackFeatures.addTo(layer);
        this.layerControls.addOverlay(this.layerTrack, 'GPX tracks');
        //zoom to track
        this.theMap.fitBounds(trackFeatures.getBounds());
        var featureName = trackFeatures._leaflet_id;
        return featureName;
    }
    /**
     * pans the map when marker hits boundaries
     * code from https://github.com/Leaflet/Leaflet/pull/3643
     * @param e: mouse event of marker object
     */
    function panMapOnEdges(e) {
        // Parameters for superellipse boundaries (feels more natural)
        // https://en.wikipedia.org/wiki/Superellipse 
        var panOptions = {
            a: 0.90,
            b: 0.90,
            n: 5,
            maxVelocity: 50
        };
        //Transform mouse coordinates [0,0] to [mapSizeX,mapSizeY] to [-1,+1] to [+1,-1] coordinates
        var halfMapSize = self.theMap.getSize()._divideBy(2),
            //Fix event for touch input
            fixedEvent = (e.originalEvent.touches && e.originalEvent.touches.length === 1) ? e.originalEvent.touches[0] : e.originalEvent,
            dragPoint = self.theMap.mouseEventToContainerPoint(fixedEvent),
            scaledPoint = dragPoint.subtract(halfMapSize).unscaleBy(halfMapSize),
            superEllipse = Math.pow(Math.abs(scaledPoint.x / panOptions.a), panOptions.n) + Math.pow(Math.abs(scaledPoint.y / panOptions.b), panOptions.n);
        if (superEllipse >= 1) {
            /*
             * Calculate smooth increase of pan by moving further to the edge by calculating
             * first a index between 0 (the pan bounding box edge) to 1 (the map edge)
             * and then plug that value into a sigmoid function to get a smooth transition
             */
            var panSmoothed = 1 / (1 + Math.exp(-12 * (superEllipse - 1))),
                panMagnitude = L.point(panSmoothed, panSmoothed).multiplyBy(panOptions.maxVelocity),
                panAngle = Math.atan2(scaledPoint.y, scaledPoint.x);
            self.theMap.panBy(panMagnitude.scaleBy(L.point(Math.cos(panAngle), Math.sin(panAngle))));
        }
    }
    map.prototype = new EventEmitter();
    map.prototype.constructor = map;
    map.prototype.serializeLayers = serializeLayers;
    map.prototype.updateTmcInformation = updateTmcInformation;
    map.prototype.restoreLayerPrefs = restoreLayerPrefs;
    map.prototype.clearMarkers = clearMarkers;
    map.prototype.emphMarker = emphMarker;
    map.prototype.convertFeatureIdToPositionString = convertFeatureIdToPositionString;
    map.prototype.convertFeatureIdToPosition = convertFeatureIdToPosition;
    // map.prototype.getFirstPointIdOfLine = getFirstPointIdOfLine;
    map.prototype.addWaypointMarker = addWaypointMarker;
    map.prototype.addWaypointAtPos = addWaypointAtPos;
    map.prototype.setWaypointType = setWaypointType;
    // map.prototype.getWaypointsString = getWaypointsString;
    // map.prototype.getWaypointsAmount = getWaypointsAmount;
    map.prototype.addGeolocationResultMarker = addGeolocationResultMarker;
    map.prototype.addSearchAddressResultMarkers = addSearchAddressResultMarkers;
    map.prototype.zoomToAddressResults = zoomToAddressResults;
    // map.prototype.addSearchPoiResultMarkers = addSearchPoiResultMarkers;
    // map.prototype.emphasizeSearchPoiMarker = emphasizeSearchPoiMarker;
    // map.prototype.deEmphasizeSearchPoiMarker = deEmphasizeSearchPoiMarker;
    // map.prototype.zoomToPoiResults = zoomToPoiResults;
    map.prototype.zoomToMarker = zoomToMarker;
    map.prototype.zoomToFeature = zoomToFeature;
    map.prototype.zoomToRoute = zoomToRoute;
    map.prototype.updateRoute = updateRoute;
    map.prototype.updateSize = updateSize;
    map.prototype.checkAvoidAreasIntersectThemselves = checkAvoidAreasIntersectThemselves;
    map.prototype.addAvoidAreas = addAvoidAreas;
    map.prototype.getAvoidAreas = getAvoidAreas;
    map.prototype.getAvoidAreasString = getAvoidAreasString;
    map.prototype.updateRestrictionsLayer = updateRestrictionsLayer;
    map.prototype.addAccessiblityPolygon = addAccessiblityPolygon;
    map.prototype.eraseAccessibilityFeatures = eraseAccessibilityFeatures;
    map.prototype.writeRouteToString = writeRouteToString;
    map.prototype.parseStringToWaypoints = parseStringToWaypoints;
    map.prototype.parseStringToTrack = parseStringToTrack;
    map.prototype.addTrackToMap = addTrackToMap;
    map.prototype.getWaypointsByGranularity = getWaypointsByGranularity;
    map.prototype.panMapOnEdges = panMapOnEdges;
    map.prototype.updateHeightprofiles = updateHeightprofiles;
    map.prototype.emitloadTMC = emitloadTMC;
    return map;
}());