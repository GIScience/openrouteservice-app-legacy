/**
 * main class, init() is called when ORS page is loaded
 */

(function() {
	OpenRouteService = {
		siteUrl : 'http://koenigstuhl.geog.uni-heidelberg.de/ors/',
		controls : null,
		map : null,
		//the currently active route
		route : null,
		Ui : null,
		HTTP_GET_VARS : null,

		/**
		 * first method to be called when ORS page is loaded.
		 * Generates the map and reads initial information (e.g. where the user is located, location that is stored inside the cokkies,...) 
		 */
		init : function() {
			//path to the proxy-script as workaround for JavaScript security errors
			OpenLayers.ProxyHost = "/cgi-bin/proxy.cgi?url=";
			
			//read language and distane unit cookies
			OpenRouteService.Preferences.loadPrefs();
			
			//inform the user why he should accept the geolocation request
			var geolocationNotification = new Element('h3', {
				'id' : 'geolocationNotification'
			}).update(OpenRouteService.Preferences.translate('geolocationNotification'));
			document.getElementById('openlayers').appendChild(geolocationNotification);

			var self = this;
			if(navigator.geolocation) {
				//If supported, use the HTML5 Geolocation feature to load the map with the user's current location
				
				//it might happen that the user's browser is waiting for an input to start the geolocation search. If this input is not given,
				//the user will be handled as "no geolocation supported"-cookie-case.
				window.geolocationTimeoutHandler = function() {
					self.onGeolocationFailure();
				}
				window['geolocationRequestTimeoutHandler'] = setTimeout('geolocationTimeoutHandler()', 3000);

				navigator.geolocation.getCurrentPosition(this.onGeolocationSuccess, this.onGeolocationFailure, this.onGeolocationTimeoutCallback);
			} else {
				//If not supported, use cookies to store and reload the last position, layer and zoom level a user visited on the page
				this.onGeolocationFailure();
			}
		},
		/**
		 * if the HTML5 geolocation feature is supported, it returns the Position of the user which is used to move the map to that location.
		 * @param position: position of the user in Geolocation-format
		 */
		onGeolocationSuccess : function(position) {
			clearTimeout(window['geolocationRequestTimeoutHandler']);
			 var element = document.getElementById('geolocationNotification');
			if(!element) {
				//the user accepted the request after the page has loaded the cookies. If we allow this request to be executed that lately, we get too many elements on the page.
				return;	
			}
			element.parentNode.removeChild(element);
			
			var pt = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude).transform(new OpenLayers.Projection('EPSG:4326'), new OpenLayers.Projection('EPSG:900913'));
			this.map = OpenRouteService.Map.initializeMap('openlayers');
			this.map.moveTo(pt, 14);

			//when altering data, save it to cookie
			var self = this;
			var cookieManager = new OpenRouteService.CookieManager();
			this.map.events.register("movestart", this.map, function() {
				cookieManager.writeData(self.map);
			});

			//getParams contains all these params that cannot be applied directly to the map (e.g. because the routing object is needed);
			this.getParams = OpenRouteService.Preferences.applyHttpGetVars(this.map);

			this.Ui = OpenRouteService.Ui;
			this.Ui.initialize({
				map : this.map,
				getParams : this.getParams								
			});
			//set initial waypoints
			window.waypoints = this.waypoints;

			//add a handy shortcut
			if(!window.ORS) {
				window.ORS = OpenRouteService;
			}
		},
		/**
		 * If Geolocation is not supported, not allowed or if the user doesn't answer the geolocation request, cookies are used.
		 * If cookies are available, the map is moved to this position; if not: map is moved to Heidelberg
		 * Whenever the map is moved around, cookie information is updated.
		 */
		onGeolocationFailure : function() {
			clearTimeout(window['geolocationRequestTimeoutHandler']);
			var element = document.getElementById('geolocationNotification');
  			if (element) {
  				element.parentNode.removeChild(element);
  			}
  			this.map = OpenRouteService.Map.initializeMap('openlayers');

			var cookieManager = new OpenRouteService.CookieManager();
			//on startup, read saved cookies
			cookieManager.loadData(this.map);

			//when altering data, save it to cookie
			var self = this;
			this.map.events.register("movestart", this.map, function() {
				cookieManager.writeData(self.map);
			});

			//getParams contains all these params that cannot be applied directly to the map (e.g. because the routing object is needed);
			this.getParams = OpenRouteService.Preferences.applyHttpGetVars(this.map);

			this.Ui = OpenRouteService.Ui;
			this.Ui.initialize({
				getParams : this.getParams,
				map : this.map
			});
			//set initial waypoints
			window.waypoints = this.waypoints;

			//add a handy shortcut
			if(!window.ORS) {
				window.ORS = OpenRouteService;
			}
		}
	}

	Event.observe(window, 'load', OpenRouteService.init.bind(OpenRouteService));

})();