/**
 * OpenLayers map and functions
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
        var openmapsurfer = L.tileLayer(namespaces.layerMapSurfer, {
            id: 'openmapsurfer',
            attribution: 'Map data &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors, powered by <a href="http://mapsurfernet.com/">MapSurfer.NET</a>'
        });
        var openstreetmap = L.tileLayer(namespaces.layerOSM, {
            id: 'openstreetmap',
            attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        });
        var ors_osm_worldwide = L.tileLayer.wms(namespaces.layerWms, {
            id: 'openstreetmap_worldwide',
            layers: 'osm_auto:all',
            format: 'image/png',
            maxZoom: 19,
            attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        });
        var opencyclemap = L.tileLayer(namespaces.layerOSMCycle, {
            id: 'opencyclemap',
            attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        });
        var aster_hillshade = L.tileLayer.wms("http://129.206.228.72/cached/hillshade", {
            layers: 'europe_wms:hs_srtm_europa',
            format: 'image/png',
            opacity: 0.15,
            transparent: true,
            attribution: '<a href="http://srtm.csi.cgiar.org/">SRTM</a>; ASTER GDEM is a product of <a href="http://www.meti.go.jp/english/press/data/20090626_03.html">METI</a> and <a href="https://lpdaac.usgs.gov/products/aster_policies">NASA</a>',
            crs: L.CRS.EPSG900913
        });
        var stamen = L.tileLayer(namespaces.stamenUrl, {
            id: 'stamen',
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
        });
        /* *********************************************************************
         * MAP INIT
         * *********************************************************************/
        this.theMap = new L.map(container, {
            center: [49.409445, 8.692953],
            minZoom: 2,
            zoom: 13,
            attributionControl: true,
            crs: L.CRS.EPSG900913,
            //layers: [openmapsurfer, openstreetmap, ors_osm_worldwide, opencyclemap, aster_hillshade, stamen]
        });
        var baseLayers = {
            "OpenMapSurver": openmapsurfer,
            "OSM-WMS worldwide": ors_osm_worldwide,
            "Openstreetmap": openstreetmap,
            "OpenCycleMap": opencyclemap,
            "Stamen Maps": stamen
        };
        var overlays = {
            "Hillshade places": aster_hillshade
        };
        this.theMap.addLayer(openmapsurfer);
        //this.theMap.on('baselayerchange', mapBaseLayerChanged);
        var control = L.control.activeLayers(baseLayers, overlays).addTo(this.theMap);
        // L.control.layers(baseLayers, overlays).addTo(this.theMap);
        L.control.scale().addTo(this.theMap);
        var markers = [{
            "name": "Canada",
            "url": "https://en.wikipedia.org/wiki/Canada",
            "lat": 49.409445,
            "lng": 8.692953
        }, ];
        //https://github.com/ardhi/Leaflet.MousePosition
        //this.theMap.addControl(new OpenLayers.Control.MousePosition());
        this.layerRoutePoints = L.featureGroup().addTo(this.theMap);
        this.layerRouteLines = L.featureGroup().addTo(this.theMap);
        this.layerGeolocation = L.featureGroup().addTo(this.theMap);
        this.layerPoi = L.featureGroup().addTo(this.theMap);
        this.layerSearch = L.featureGroup().addTo(this.theMap);
        this.layerAvoid = L.featureGroup().addTo(this.theMap);
        this.layerTrack = L.featureGroup().addTo(this.theMap);
        this.layerAccessibility = L.featureGroup().addTo(this.theMap);
        this.layerHeights = L.featureGroup().addTo(this.theMap);
        this.borderRegions = L.featureGroup().addTo(this.theMap);
        this.layerRestriction = L.featureGroup().addTo(this.theMap);
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
            // var lastUpdate = new Date(results.responseText.profiles['profile 1'].import_date);
            // lastUpdate = lastUpdate.getUTCDate() + '.' + (parseInt(lastUpdate.getMonth()) + parseInt(1)) + '.' + lastUpdate.getFullYear();
            //infoPanel[0].innerHTML += '<b>Last Update:</b> ' + lastUpdate;
            //infoPanel[0].innerHTML += '<b>Next Update:</b> ' + results.next_update;
            infoPanel.innerHTML += '(' + '<b>Last/Next Update</b> ' + '01.01.' + '/' + '02.01.' + ')';
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
        //     //avoid area controls
        //     this.avoidTools = {
        //         'create': new OpenLayers.Control.DrawFeature(layerAvoid, OpenLayers.Handler.Polygon, {
        //             featureAdded: function() {
        //                 var errorous = self.checkAvoidAreasIntersectThemselves();
        //                 if (errorous) {
        //                     self.emit('map:errorsInAvoidAreas', true);
        //                 }
        //                 self.emit('map:routingParamsChanged');
        //                 self.emit('map:avoidAreaChanged', self.getAvoidAreasString());
        //             }
        //         }),
        //         'edit': new OpenLayers.Control.ModifyFeature(layerAvoid),
        //         'remove': new OpenLayers.Control.SelectFeature(layerAvoid, {
        //             onSelect: function(feature) {
        //                 layerAvoid.removeFeatures([feature]);
        //                 var errorous = self.checkAvoidAreasIntersectThemselves();
        //                 if (!errorous) {
        //                     self.emit('map:errorsInAvoidAreas', false);
        //                 }
        //                 self.emit('map:routingParamsChanged');
        //                 self.emit('map:avoidAreaChanged', self.getAvoidAreasString());
        //             }
        //         })
        //     };
        //     for (var key in this.avoidTools) {
        //         this.theMap.addControl(this.avoidTools[key]);
        //     }
        //     //trigger an event after changing the avoid area polygon
        //     layerAvoid.events.register('afterfeaturemodified', this.theMap, function(feature) {
        //         var errorous = self.checkAvoidAreasIntersectThemselves();
        //         if (errorous) {
        //             self.emit('map:errorsInAvoidAreas', true);
        //         } else {
        //             self.emit('map:errorsInAvoidAreas', false);
        //         }
        //         self.emit('map:routingParamsChanged');
        //         self.emit('map:avoidAreaChanged', self.getAvoidAreasString());
        //     });
        //     /* *********************************************************************
        //      * MAP LOCATION
        //      * *********************************************************************/
        //     var hd = util.convertPointForMap(new OpenLayers.LonLat(8.692953, 49.409445));
        //     this.theMap.setCenter(hd, 13);
        //     /* *********************************************************************
        //      * MAP EVENTS
        //      * *********************************************************************/
        //     function emitMapChangedEvent(e) {
        //         // without this condition map zoom lat/lon isnt loaded from cookies
        //         if (!initMap) {
        //             var centerTransformed = util.convertPointForDisplay(self.theMap.getCenter());
        //             self.emit('map:changed', {
        //                 layer: self.serializeLayers(),
        //                 zoom: self.theMap.getZoom(),
        //                 lat: centerTransformed.lat,
        //                 lon: centerTransformed.lon
        //             });
        //         }
        //     }
        //     this.theMap.events.register('zoomend', this.theMap, function(e) {
        //         emitMapChangedEvent(e);
        //     });
        //     this.theMap.events.register('moveend', this.theMap, emitMapChangedEvent);
        //     this.theMap.events.register('changelayer', this.theMap, emitMapChangedEvent);
        //     //this.theMap.events.register('move', this.theMap, panMapChangedEvent);
        //     //when zooming or moving the map -> close the context menu
        //     this.theMap.events.register("zoomend", this.map, closeContextMenu);
        //     //this.theMap.events.register("movestart", this.map, closeContextMenu);
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
        // var layers = this.theMap.layers;
        // var result, indices = [];
        // //set given map layer active
        // var baseLayer = params.indexOf('B') >= 0 ? params.indexOf('B') : 0;
        // this.theMap.setBaseLayer(this.theMap.layers[baseLayer]);
        // //determine which overlays to set active
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
        } else {
            layerName.clearLayers();
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
                            color: '#ff0066'
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
        var layer = this.theMap.getLayersByName(this.GEOLOCATION)[0];
        layer.removeAllFeatures();
        //convert corrdinates of marker
        var feature = null;
        if (position) {
            position = util.convertPointForMap(position);
            var point = new OpenLayers.Geometry.Point(position.lon, position.lat);
            feature = new OpenLayers.Feature.Vector(point, {
                icon: Ui.markerIcons.unset[0],
                iconEm: Ui.markerIcons.unset[1],
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
        var listOfFeatures = [];
        for (var i = 0; i < listOfPoints.length; i++) {
            //convert corrdinates of marker
            var point = listOfPoints[i];
            var feature = null;
            if (point) {
                var position = [point[1], point[0]];
                // point = util.convertPointForMap(point);
                // point = new OpenLayers.Geometry.Point(point.lon, point.lat);
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
                // feature = new OpenLayers.Feature.Vector(point, {
                //     icon: Ui.markerIcons.unset[0],
                //     iconEm: Ui.markerIcons.unset[1],
                // });
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
     * draws given points as route line on the map
     * @param {Object} routeLineSegments: array of OL.Geometry.LineString
     * @return array of OL.Feature.Vector added to the layer
     */
    function updateRoute(routeLineSegments, routeLinePoints) {
        this.layerRouteLines.clearLayers();
        //var layer = this.theMap.getLayersByName(this.ROUTE_LINES)[0];
        //layer.removeAllFeatures();
        var ftIds = [];
        if (routeLineSegments && routeLineSegments.length > 0) {
            var self = this;
            for (var i = 0; i < routeLineSegments.length; i++) {
                //"lines" of the route
                var segment = [];
                for (var j = 0; j < routeLineSegments[i].length; j++) {
                    segment.push(routeLineSegments[i][j]);
                    //var segmentFt = new OpenLayers.Feature.Vector(segment, pointAndLineStyle.line);
                }
                var segmentFt = L.polyline(segment, {
                    color: '#ff0066',
                    opacity: '0.9'
                });
                segmentFt.addTo(self.layerRouteLines);
                //"corner points" of the route where direction changes
                var cornerPoint = routeLinePoints[i];
                //var cornerFt = new OpenLayers.Feature.Vector(cornerPoint, pointAndLineStyle.point);
                var cornerFt = new L.CircleMarker(cornerPoint, {
                    color: '#ff0066',
                    fillColor: 'white',
                    fillOpacity: 1,
                    fill: true,
                    radius: 3,
                    weight: 1
                });
                cornerFt.addTo(self.layerRouteLines);
                //layer.addFeatures([segmentFt, cornerFt]);
                ftIds.push(segmentFt._leaflet_id, cornerFt._leaflet_id);
            }
        }
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
            for (i = 0; i < coord.length; i++) {
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
    function addAccessiblityPolygon(polygonArray) {
        var colorRange = rangeColors(polygonArray.length - 1);
        for (var i = polygonArray.length - 1; i >= 0; i--) {
            L.polygon(polygonArray[i], {
                //fillColor: colorRange[i],
                //fillOpacity: 1,
                //fill: true,
                color: colorRange[i],
                stroke: true,
                weight: 4
            }).addTo(this.layerAccessibility);
        }
    }
    /**
     * adds the restrictions along the route to the map
     *  @param query: array [queryString, vectorArray] representing the overpass query and the polygon for display
     */
    function updateRestrictionsLayer(query, permaInfo) {
        var overpassQuery = query[0];
        var bboxArray = query[1];
        var map = this.theMap;
        //Do not load anything if the profile is not HeavyVehicle
        if (overpassQuery === null || bboxArray === null) {
            map.getLayersByName(this.RESTRICTIONS)[0].removeAllFeatures();
            map.getLayersByName(this.RESTRICTIONS)[0].displayInLayerSwitcher = false;
            map.getLayersByName(this.RESTRICTIONS)[0].setVisibility(false);
            map.getLayersByName(this.BBOX)[0].removeAllFeatures();
            map.getLayersByName(this.BBOX)[0].displayInLayerSwitcher = false;
            map.getLayersByName(this.BBOX)[0].setVisibility(false);
            return;
        }
        var restrictionStyleMap = new OpenLayers.StyleMap({
            'default': new OpenLayers.Style(restrictionTemplate),
            'select': new OpenLayers.Style(restrictionSelTemplate)
        });
        var styleRestrictionBbox = {
            strokeColor: "#00FF00",
            strokeOpacity: 0.4,
            strokeWidth: 3,
            fillColor: "#00FF00",
            fillOpacity: 0.2
        };
        //display the layers in the layer switcher if truck profile is chosen
        map.getLayersByName(this.RESTRICTIONS)[0].displayInLayerSwitcher = true;
        map.getLayersByName(this.BBOX)[0].displayInLayerSwitcher = true;
        map.getLayersByName(this.RESTRICTIONS)[0].setVisibility(true);
        //display the restrictions bounding polygon
        map.getLayersByName(this.BBOX)[0].removeAllFeatures();
        var pf = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LinearRing(bboxArray), null, styleRestrictionBbox);
        map.getLayersByName(this.BBOX)[0].addFeatures([pf]);
        map.getLayersByName(this.RESTRICTIONS)[0].removeAllFeatures();
        //TODO: Remove workaround to make layer load... won't load without adding dummy layer to the map
        if (map.getLayersByName(this.TEMPRESTRICTIONS).length > 0) map.getLayersByName(this.TEMPRESTRICTIONS)[0].destroy();
        var layerRestrictionNew = make_layer(overpassQuery, restrictionStyleMap);
        layerRestrictionNew.setName(this.TEMPRESTRICTIONS);
        layerRestrictionNew.setVisibility(false);
        layerRestrictionNew.displayInLayerSwitcher = false;
        this.theMap.addLayers([layerRestrictionNew]);
        var this_ = this;
        layerRestrictionNew.events.register("loadend", layerRestrictionNew, function() {
            //filter out unnecessary maxheight tags
            if (layerRestrictionNew.features.length > 0) layerRestrictionNew = window.Restrictions.filterByAttribute(layerRestrictionNew, "maxheight", permaInfo[1]);
            map.getLayersByName(this_.RESTRICTIONS)[0].addFeatures(layerRestrictionNew.clone().features);
            layerRestrictionNew.destroy();
        });
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
        //TODO: change to Leaflet
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
     * Based on the String with GPX information multiple waypoints - depending on the granularity input of the user - are extracted
     * @param {Object} routeString: String with GPX track
     * @param {Number} granularity: Value picked in dropdown list
     * @return: array of two waypoints of OL.LonLat or null if no adequate data available
     */
    function parseStringToWaypoints(routeString, granularity) {
        var formatter = new OpenLayers.Format.GPX();
        var featureVectors = formatter.read(routeString);
        if (!featureVectors || featureVectors.length == 0) {
            return null;
        }
        var linePoints = featureVectors[0].geometry.components;
        if (linePoints && linePoints.length >= 2) {
            var positions = getWaypointsByGranularity(linePoints, granularity);
            return positions;
            //only proceed if the route contains at least 2 points (which can be interpreted as start and end)
            // var startPos = new OpenLayers.LonLat(linePoints[0].x, linePoints[0].y);
            // startPos = util.convertPointForMap(startPos);
            // var endPos = new OpenLayers.LonLat(linePoints[linePoints.length - 1].x, linePoints[linePoints.length - 1].y);
            // endPos = util.convertPointForMap(endPos);
            // return [startPos, endPos];
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
        var routepointList = new Array();
        var startPoint = new OpenLayers.LonLat(linePoints[0].x, linePoints[0].y);
        routepointList.push(startPoint);
        var sumDistance = 0;
        for (var i = 1; i < linePoints.length - 2; i++) {
            var lastPoint = new OpenLayers.LonLat(linePoints[i - 1].x, linePoints[i - 1].y);
            var thisPoint = new OpenLayers.LonLat(linePoints[i].x, linePoints[i].y);
            sumDistance += util.calcFlightDistance(lastPoint, thisPoint);
            if (sumDistance > Number(granularity)) {
                routepointList.push(thisPoint);
                sumDistance = 0;
            }
        }
        var endPoint = new OpenLayers.LonLat(linePoints[linePoints.length - 1].x, linePoints[linePoints.length - 1].y);
        routepointList.push(endPoint);
        return routepointList;
    }
    /**
     * Based on the String with GPX information a track (an OL.Geometry.LineString object) is extracted
     * @param {Object} trackString: String with GPX track
     * @return array of OL.FeatureVectors (usually only one) containing the track points
     */
    function parseStringToTrack(trackString) {
        var formatter = new OpenLayers.Format.GPX();
        var trackFeatures = formatter.read(trackString);
        trackFeatures[0].style = {
            fillColor: randomColors(),
            strokeColor: randomColors(),
            pointRadius: 5,
            strokeOpacity: 0.7,
            strokeWidth: 4,
            cursor: "pointer"
        }
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
        //fill up data field in html with openlayers id
        var layer = this.theMap.getLayersByName(this.TRACK)[0];
        layer.addFeatures(trackFeatures);
        //zoom to track
        var resultBounds = layer.getDataExtent();
        this.theMap.zoomToExtent(resultBounds);
        var featureName = trackFeatures[0].id;
        return featureName;
    }
    /** 
     * generates a random hex color
     */
    function randomColors() {
        var randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        return randomColor;
    }
    /** 
     * Generates a green to red color range
     * source: http://stackoverflow.com/questions/11849308/generate-colors-between-red-and-green-for-an-input-range
     */
    function rangeColors(rangeNumber) {
        var colorArr = [];
        var red = new Color(232, 9, 26),
            white = new Color(255, 255, 255),
            green = new Color(6, 170, 60),
            start = green,
            end = red;
        // if (rangeNumber > 50) {
        //     start = white,
        //     end = red;
        //     rangeNumber = rangeNumber % 51;
        // }
        var startColors = start.getColors(),
            endColors = end.getColors();
        for (var i = 0; i <= rangeNumber; i++) {
            var r = Interpolate(startColors.r, endColors.r, rangeNumber, i);
            var g = Interpolate(startColors.g, endColors.g, rangeNumber, i);
            var b = Interpolate(startColors.b, endColors.b, rangeNumber, i);
            var color = "rgb(" + r + "," + g + "," + b + ")";
            colorArr.push(color);
        }

        function Interpolate(start, end, steps, count) {
            var s = start,
                e = end,
                final = s + (((e - s) / steps) * count);
            return Math.floor(final);
        }

        function Color(_r, _g, _b) {
            var r, g, b;
            var setColors = function(_r, _g, _b) {
                r = _r;
                g = _g;
                b = _b;
            };
            setColors(_r, _g, _b);
            this.getColors = function() {
                var colors = {
                    r: r,
                    g: g,
                    b: b
                };
                return colors;
            };
        }
        return colorArr;
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
            icon: Ui.markerIcons.unset[0],
            iconEm: Ui.markerIcons.unset[1],
        });
        layer.addFeatures([ft]);
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
    // map.prototype.serializeLayers = serializeLayers;
    map.prototype.restoreLayerPrefs = restoreLayerPrefs;
    map.prototype.clearMarkers = clearMarkers;
    map.prototype.emphMarker = emphMarker;
    map.prototype.convertFeatureIdToPositionString = convertFeatureIdToPositionString;
    map.prototype.convertFeatureIdToPosition = convertFeatureIdToPosition;
    // map.prototype.getFirstPointIdOfLine = getFirstPointIdOfLine;
    // map.prototype.activateSelectControl = activateSelectControl;
    map.prototype.addWaypointMarker = addWaypointMarker;
    map.prototype.addWaypointAtPos = addWaypointAtPos;
    map.prototype.setWaypointType = setWaypointType;
    // map.prototype.getWaypointsString = getWaypointsString;
    // map.prototype.getWaypointsAmount = getWaypointsAmount;
    // map.prototype.addGeolocationResultMarker = addGeolocationResultMarker;
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
    // map.prototype.avoidAreaTools = avoidAreaTools;
    // map.prototype.checkAvoidAreasIntersectThemselves = checkAvoidAreasIntersectThemselves;
    // map.prototype.addAvoidAreas = addAvoidAreas;
    // map.prototype.getAvoidAreas = getAvoidAreas;
    // map.prototype.getAvoidAreasString = getAvoidAreasString;
    // map.prototype.updateRestrictionsLayer = updateRestrictionsLayer;
    map.prototype.addAccessiblityPolygon = addAccessiblityPolygon;
    map.prototype.eraseAccessibilityFeatures = eraseAccessibilityFeatures;
    map.prototype.writeRouteToString = writeRouteToString;
    // map.prototype.parseStringToWaypoints = parseStringToWaypoints;
    // map.prototype.parseStringToTrack = parseStringToTrack;
    // map.prototype.addTrackToMap = addTrackToMap;
    // map.prototype.getWaypointsByGranularity = getWaypointsByGranularity;
    // map.prototype.parseStringToElevationPoints = parseStringToElevationPoints;
    // map.prototype.hoverPosition = hoverPosition;
    map.prototype.panMapOnEdges = panMapOnEdges;
    return map;
}());