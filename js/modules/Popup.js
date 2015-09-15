//SmartPopup 

//übernommen von misterboo.de

function SmartPopup(map, layerRestriction){
	this.map = map;
	this.layerRestriction = layerRestriction;
	this.layers=[];
	this.anchor = null;
	var thisPopup = this;
	var imagepath = 'img/josm/';

	this.imagepath = imagepath;

	this.preload_images = true;

	// Wildcard '*' -> value irrelevant for icon
	// Iconds and rules derived from JOSM's styles/standard/elemstyle.xml

	var images = { 'maxheight'    : { 'none':        'no_icon.png',
		'unspecified': 'no_icon.png',
		'default':     'no_icon.png',
		'*': 'maxheight.png'    },
		'maxweight'    : { '*': 'maxweight.png'    },
		'maxlength'    : { '*': 'maxlength.png'    },
		'maxwidth'     : { '*': 'maxwidth.png'     },
		'maxaxleload'  : { '*': 'maxaxleload.png'  },
		'hazmat'       : { 'no' : 'hazmat.png'     },
		'hazmat:water' : { 'no' : 'hazmat_water.png' },
		'psv'          : { 'no' : 'psv.png',
			'yes': 'psv_yes.png'    },
			'hgv'          : { 'no' : 'goods.png'      },
			'goods'        : { 'no' : 'goods.png'      },			       
			'motorcycle'   : { 'no' : 'motorbike.png'  },
			'motorcar'     : { 'no' : 'motorcar.png'   },			       
			'access'       : { 'no' : 'access.png'     },
			'bicycle'      : { 'no' : 'bicycle.png',
				'designated': 'bicycle-designated.png' },
				'horse'        : { 'no' : 'horse.png',
					'designated': 'horse-designated.png' },			       
					'foot'         : { 'no' : 'foot.png',
						'designated': 'foot-designated.png' }		       
	};
	this.images = images;
	
	map.events.on({"zoomend":function(){thisPopup.onZoomEnd();}});
	map.events.on({"movestart":function(){thisPopup.onMoveStart();}});
}

SmartPopup.prototype.addLayer = function (layer, templateId, anchor) {
	if (templateId) {
		layer.templateId=templateId;
		layer.template = document.getElementById(templateId).innerHTML;
	}
	layer.anchor = anchor ? anchor : null;
	this.layers.push(layer);
};

SmartPopup.prototype.onFeatureSelect = function(feature) {
	var data;
	var selectedFeature = feature;
	this.onFeatureUnselect();

	if (this.preload_images === true) {

		// Preload images
//		$.each(this.images, function(k, v) {
//		$.each(v, function(k1, v1) {
//		(new Image()).src = 'images/josm/' + v1;
//		});
//		});
		this.preload_images = false;
	}


	if (selectedFeature.layer.template) {
		var html = selectedFeature.layer.template.replace(/%([^%]*)%/g, 
				function(a,b,c,d){ return (selectedFeature.attributes[b]);});
	} else {
		if (selectedFeature.cluster) {
			data = selectedFeature.cluster[0];
		} else {
			data = selectedFeature;
		}
		var html = '';
		var rows = [];


		var attr = data.attributes;

		for (var tag in attr) {
			if (tag != 'maxheight') continue;
			//if (attr[tag] == '') continue;
			//var title = '<a href="http://wiki.openstreetmap.org/wiki/Key:' + tag + '" target="_blank">' + tag + '</a>';
			var title = tag;
			var value = attr[tag] || '';

			var icon = (this.images[tag] != undefined ? (this.images[tag][value] || this.images[tag]['*'] || '') : '');

			rows.push ('<tr><th scope="row">' + title + '</th>' +
					(icon != '' ? '<td scope="row"><img src="'+ this.imagepath + icon +'"/></td>' : '<td/>') + 
					'<td style="max-width: 150px;">'
					+ formatValue(value).replace(/\034/g,'<br/>') + '</td></tr>');
		}
		/*		
		if (selectedFeature.cluster && selectedFeature.cluster.length > 1) {
			var places = feature.cluster.length - 1;
			rows.push ('<tr><th scope="row">cluster</th><td>' + places + '</td></tr>');
		}
		 */		
//		if (!data.osm_id) {
//			var point = data.geometry.clone();
//			point.transform(selectedFeature.layer.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
//			rows.push ('<tr><th scope="row">lon</th><td>' + (point.x).toFixed(4) + '</td></tr>');
//			rows.push ('<tr><th scope="row">lat</th><td>' + (point.y).toFixed(4) + '</td></tr>');
//		}

//		if (data.osm_id) {
//			var osm_id_link = '<a target="_blank" title="' + OpenLayers.i18n("info_title") + '" ' + 
//			'href="http://www.openstreetmap.org/' + data.fid.split(".")[0] + 
//			'/' + data.osm_id + '">' + data.osm_id + '</a>';
//
//			rows.push ('<tr><th scope="row">' + data.fid.split(".")[0] + ' id</th><td/><td>' + osm_id_link + '</td></tr>');
//		}

		if (rows.length>=1)
			html = '<table>\n' + rows.join('\n') + '\n</table>';

		var buffer = 100;
		var b = new OpenLayers.Bounds(
				data.geometry.bounds.left - buffer,
				data.geometry.bounds.bottom - buffer, 
				data.geometry.bounds.right + buffer ,
				data.geometry.bounds.top + buffer
		).transform(new OpenLayers.Projection("EPSG:3857"),
				new OpenLayers.Projection("EPSG:4326"));

		html += '<a target="hiddenIframe" class="button" href="http://localhost:8111/load_and_zoom?';
		html += "left=" + b.left.toFixed(4) + '&' + "bottom=" + b.bottom.toFixed(4) + '&';
		html += "right=" + b.right.toFixed(4) + '&' + "top=" + b.top.toFixed(4);

		if (data.osm_id) {            
			html += '&select=' + data.fid.split(".")[0] + data.osm_id;
		}
//		html += '" title="' + OpenLayers.i18n("edit_title") + '">';
//		html += OpenLayers.i18n("edit") + '</a>\n';

	}
	
	SmartPopup.popup = new OpenLayers.Popup.Anchored('smartPopup', 
			selectedFeature.geometry.getBounds().getCenterLonLat(),
			null, html, selectedFeature.layer.anchor, false, null
	);
	SmartPopup.popup.autoSize=true;
	SmartPopup.popup.opacity=0.9;
	SmartPopup.popup.border='1px';
	
	SmartPopup.popup.panMapIfOutOfView=true;
	this.map.addPopup(SmartPopup.popup);
};

SmartPopup.prototype.onFeatureUnselect = function() {
	if (SmartPopup.popup){
		this.map.removePopup(SmartPopup.popup);
		SmartPopup.popup.destroy();
		SmartPopup.popup = null;
	}
};

SmartPopup.prototype.onZoomEnd = function() {
//	if (SmartPopup.popup){
//		this.map.removePopup(SmartPopup.popup);
//		SmartPopup.popup.destroy();
//		SmartPopup.popup = null;
//		//this.selectControl.unselectAll();
//	}
};

SmartPopup.prototype.onMoveStart = function() {
	if (SmartPopup.popup){
		this.map.removePopup(SmartPopup.popup);
		SmartPopup.popup.destroy();
		SmartPopup.popup = null;
	}
};

SmartPopup.popup = null;

function formatValue(text) {
	var list=text.split (';');
	var result=[];
	for (var i=0; i<list.length;i++) {
		var value = html(OpenLayers.String.trim (list[i]));
		if (value.substr (0,7)=='http://') {
			result.push ('<a target="_blank" href="'+value+'">'+value+'</a>');
			continue;
		}
		result.push (value);
	}
	return result.join ('; ');
}

function html(text) {
	if (text==null) return '';
	return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}





