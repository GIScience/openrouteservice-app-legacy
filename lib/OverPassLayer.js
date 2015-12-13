L.OverPassLayer = L.FeatureGroup.extend({
    options: {
        debug: false,
        // minzoom: 15,
        endpoint: 'http://overpass-api.de/api/interpreter',
        // endpoint: namespaces.services.overpass,
        query: "(node(BBOX)[organic];node(BBOX)[second_hand];);out qt;",
        callback: function(data) {
            nodes = {};
            nodesToKeep = {};
            ways = {};
            for (var i = 0; i < data.elements.length; i++) {
                var p = data.elements[i];
                switch (p.type) {
                    case 'node':
                        p.coordinates = new L.LatLng(p.lat, p.lon);
                        p.geometry = {
                            type: 'Point',
                            coordinates: p.coordinates
                        };
                        nodes[p.id] = p;
                        nodesToKeep[p.id] = p;
                        // p has type=node, id, lat, lon, tags={k:v}, coordinates=[lon,lat], geometry
                        break;
                    case 'way':
                        p.coordinates = p.nodes.map(function(id) {
                            var coordinates = nodes[id].coordinates;
                            delete nodesToKeep[id];
                            return coordinates;
                        });
                        p.geometry = {
                            type: 'LineString',
                            coordinates: p.coordinates
                        };
                        ways[p.id] = p;
                        break;
                }
            }
            for (var node in nodesToKeep) {
                Restrictions.filterByAllAttributes(nodesToKeep[node]);
                if (jQuery.isEmptyObject(nodesToKeep[node].tags)) continue;
                var popup = this.instance._poiInfo(nodesToKeep[node].tags, nodesToKeep[node].id);
                var circle = L.circle(nodesToKeep[node].coordinates, 10, {
                    color: 'red',
                    fillColor: '#f00',
                    fillOpacity: 0.5
                }).bindPopup(popup);
                this.instance.addLayer(circle);
            }
            for (var way in ways) {
                Restrictions.filterByAllAttributes(ways[way]);
                if (jQuery.isEmptyObject(ways[way].tags)) continue;
                var popup = this.instance._poiInfo(ways[way].tags, ways[way].id);
                var line = L.polyline(p.coordinates, {
                    color: 'red',
                    opacity: 0.5
                }).bindPopup(popup);
                this.instance.addLayer(line);
            }
        },
        beforeRequest: function() {
            if (this.options.debug) {
                console.debug('about to query the OverPassAPI');
            }
        },
        afterRequest: function() {
            if (this.options.debug) {
                console.debug('all queries have finished!');
            }
        },
        minZoomIndicatorOptions: {
            position: 'bottomleft',
            minZoomMessageNoLayer: "no layer assigned",
            minZoomMessage: "current Zoom-Level: CURRENTZOOM all data at Level: MINZOOMLEVEL"
        },
    },
    initialize: function(options) {
        L.Util.setOptions(this, options);
        this._layers = {};
        // save position of the layer or any options from the constructor
        this._ids = {};
        this._requested = {};
    },
    _poiInfo: function(tags, id) {
        // var link = document.createElement("a");
        // link.href = "//www.openstreetmap.org/edit?editor=id&node=" + id;
        // link.appendChild(document.createTextNode("Edit this entry in iD"));
        var table = document.createElement('table');
        for (var key in tags) {
            var row = table.insertRow(0);
            row.insertCell(0).appendChild(document.createTextNode(key));
            row.insertCell(1).appendChild(document.createTextNode(tags[key]));
        }
        var div = document.createElement("div");
            // div.appendChild(link);
        div.appendChild(table);
        return div;
    },
    onMoveEnd: function() {
        if (this.options.debug) {
            console.debug("load Pois");
        }
        // controls the after/before (Request) callbacks
        var finishedCount = 0;
        // var queryCount = bboxList.length;
        var beforeRequest = true;
        var url = this.options.endpoint;
        var data = "?data=[out:json];" + this.options.query;
        if (beforeRequest) {
            this.options.beforeRequest.call(this);
            beforeRequest = false;
        }
        var self = this;
        var request = new XMLHttpRequest();
        request.open("POST", url, true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                var reference = {
                    instance: self
                };
                self.options.callback.call(reference, JSON.parse(this.response));
                if (self.options.debug) {
                    console.debug('queryCount: ' + queryCount + ' - finishedCount: ' + finishedCount);
                }
                self.options.afterRequest.call(self);
            }
        };
        request.send(data);
    },
    parseOverpassJSON: function(overpassJSON, callbackNode, callbackWay, callbackRelation) {
        var nodes = {},
            ways = {};
        for (var i = 0; i < overpassJSON.elements.length; i++) {
            var p = overpassJSON.elements[i];
            switch (p.type) {
                case 'node':
                    p.coordinates = [p.lon, p.lat];
                    p.geometry = {
                        type: 'Point',
                        coordinates: p.coordinates
                    };
                    nodes[p.id] = p;
                    // p has type=node, id, lat, lon, tags={k:v}, coordinates=[lon,lat], geometry
                    if (typeof callbackNode === 'function') callbackNode(p);
                    break;
                case 'way':
                    p.coordinates = p.nodes.map(function(id) {
                        return nodes[id].coordinates;
                    });
                    p.geometry = {
                        type: 'LineString',
                        coordinates: p.coordinates
                    };
                    ways[p.id] = p;
                    // p has type=way, id, tags={k:v}, nodes=[id], coordinates=[[lon,lat]], geometry
                    if (typeof callbackWay === 'function') callbackWay(p);
                    break;
                case 'relation':
                    if (!p.members) {
                        console.log('Empty relation', p);
                        break;
                    }
                    p.members.map(function(mem) {
                        mem.obj = (mem.type == 'way' ? ways : nodes)[mem.ref];
                    });
                    // p has type=relaton, id, tags={k:v}, members=[{role, obj}]
                    if (typeof callbackRelation === 'function') callbackRelation(p);
                    break;
            }
        }
    },
    onAdd: function(map) {
        this._map = map;
        this.onMoveEnd();
        if (this.options.debug) {
            console.debug("add layer");
        }
    },
    onRemove: function(map) {
        if (this.options.debug) {
            console.debug("remove layer");
        }
        L.LayerGroup.prototype.onRemove.call(this, map);
        this._ids = {};
        this._requested = {};
        this._map = null;
    },
    getData: function() {
        if (this.options.debug) {
            console.debug(this._data);
        }
        return this._data;
    }
});
//FIXME no idea why the browser crashes with this code
//L.OverPassLayer = function (options) {
//  return new L.OverPassLayer(options);
//};