/**
 * ORS.Ui is the main Ui class of the application that contains information about the structure of the elements.
 * In this class, we insert the content into the page.
 */
OpenRouteService.Ui = ( function() {
		var routing;
		var initialize = function(options) {
			var getParams = null;
			if (options && options.getParams) {
				getParams = options.getParams
			}

			//button to make sidbar visible/ invisible
			insertToggleSidebar(options.map);

			//main content of the page, fields to insert search or routing points
			insertSidebarContent(this, getParams, options.map);

			//link to university of HD, legend to OSM,...
			//this must be inserted AFTER the sidebar content (we need the reference to the ORS.Gui.Route object)
			insertTopMenu();
		}
		/**
		 * inserts the top menu bar with links to university of Heidelberg, legend of OSM map,...
		 */
		var insertTopMenu = function() {
			//add elements to the top menu
			var liElement = new Element('li');
			document.getElementById('topMenu').appendChild(liElement);
			var child = document.getElementById('topMenu').firstChild;

			//info popup where to set the standard/ extended version
			var cm = new OpenRouteService.CookieManager();
			var result = cm.readCookie(cm.cookieNameVersion);
			if (!result) {
				//only show this popup if the user is new to the site, i.e. there aren't any cookies yet
				var infoElement = new Element('div', {
					'class' : 'alert alert-info',
					'id' : 'infoVersions'
				});
				var closeBtn = new Element('button', {
					'type' : 'button',
					'class' : 'close',
					'data-dismiss' : 'alert'
				}).insert('&times;');
				var infoTxt = OpenRouteService.Preferences.translate('infoTextVersions');
				infoElement.insert(closeBtn);
				infoElement.insert(infoTxt);
				liElement.appendChild(infoElement);

				document.getElementById('topMenu').insertBefore(liElement, child);
			}

			//site preferences
			var liElement = new Element('li');
			var navElement = new Element('a');
			navElement.setAttribute('href', '#sitePrefsModal');
			navElement.setAttribute('data-toggle', 'modal');
			navElement.innerHTML = OpenRouteService.Preferences.translate('sitePreferences');
			liElement.appendChild(navElement);

			// var child = document.getElementById('topMenu').firstChild;
			document.getElementById('topMenu').insertBefore(liElement, child);

			//contact + info
			liElement = new Element('li');
			navElement = new Element('a');
			navElement.setAttribute('href', 'contact.html#top');
			navElement.setAttribute('target', '_blank');
			navElement.innerHTML = OpenRouteService.Preferences.translate('contact');
			liElement.appendChild(navElement);

			document.getElementById('topMenu').insertBefore(liElement, child);
			document.body.insert(new OpenRouteService.Gui.PreferencePopup(routing).htmlRepresentation);
		}
		/**
		 * inserts a button to toggle the sidebar and adds required functionality
		 */
		var insertToggleSidebar = function(map) {
			//insert the "hide sidebar" button
			var hideSidebar = new Element('a', {
				'class' : 'sidebarVisible',
				'id' : 'toggleSidebar'
			});
			hideSidebar.innerHTML = "<img src='img/arrowLeft.png' alt=" + OpenRouteService.Preferences.translate("hideSidebar") + "/>";
			hideSidebar.observe('click', function() {
				var side = document.getElementById('sidebar');
				if (side.style.display == 'none') {
					//sidebar is not visible, show it
					document.getElementById('sidebar').style.display = 'inline';
					document.getElementById('openlayers').style.left = '415px';
					document.getElementById('toggleSidebar').setAttribute('class', 'sidebarVisible');
					//trigger map update
					map.updateSize();
				} else {
					//sidebar is visible, hide it
					document.getElementById('sidebar').style.display = 'none';
					document.getElementById('openlayers').style.left = '25px';
					document.getElementById('toggleSidebar').setAttribute('class', 'sidebarInvisible');
					//trigger map update
					map.updateSize();
				}
			});
			document.body.appendChild(hideSidebar);
		}
		/**
		 * places the main content in the sidebar, e.g. panels for routing information or the search field
		 * @param self: object this to annotate the components to
		 * @param getParams: paremters for routing, e.g. waypoints for the route that should be visible on startup
		 */
		var insertSidebarContent = function(self, getParams, map) {
			//fill sidebar with content
			var sidebar = document.getElementById("sidebar");

			var routingPanel = new OpenRouteService.Gui.Panel({
				id : 'route',
				visible : 'true',
				img : 'img/menuRoute.png',
				title : OpenRouteService.Preferences.translate('routePlanner')
			});
			var searchPanel = new OpenRouteService.Gui.Panel({
				id : 'search',
				visible : 'false',
				img : 'img/menuSearch.png',
				title : OpenRouteService.Preferences.translate('search')
			});
			document.getElementById("sidebar").appendChild(routingPanel.htmlRepresentation);
			document.getElementById("sidebar").appendChild(searchPanel.htmlRepresentation);

			self.Elements.routing = new OpenRouteService.Gui.Tool.Routing({
				id : 'routing',
				title : OpenRouteService.Preferences.translate('planRoute'),
				map : map,
				waypoints : getParams.waypoints || null,
				routeOpt : getParams.routeOpt || null,
				motorways : getParams.motorways || null,
				tollways : getParams.tollways || null,
				avoidAreas : getParams.avoidAreas || null
			});
			routing = self.Elements.routing;
			//necessary for preference panel popup
			self.Elements.routing.htmlRepresentation.setAttribute('class', 'panel panelLight');
			routingPanel.appendChild(self.Elements.routing.htmlRepresentation);

			self.Elements.currentLocation = new OpenRouteService.Gui.Tool.CurrentLocation({
				id : 'currentLocation',
				title : OpenRouteService.Preferences.translate('currentLocation'),
				map : map,
				route : self.Elements.routing
			});
			self.Elements.currentLocation.htmlRepresentation.setAttribute('class', 'panel panelLight');
			searchPanel.appendChild(self.Elements.currentLocation.htmlRepresentation);
			self.Elements.searchPlace = new OpenRouteService.Gui.Tool.SearchPlace({
				id : 'searchPlace',
				title : OpenRouteService.Preferences.translate('searchForPoints'),
				map : map,
				route : self.Elements.routing
			});
			self.Elements.searchPlace.htmlRepresentation.setAttribute('class', 'panel panelLight');
			//cannot be placed inside the search class. will always appear in the routing panel instead of search panel (both have a search instance)
			var errorContainer = new Element('div', {
				'id' : 'searchPlaceError'
			});
			self.Elements.searchPlace.htmlRepresentation.insert(errorContainer);
			searchPanel.appendChild(self.Elements.searchPlace.htmlRepresentation);
			self.Elements.searchPoi = new OpenRouteService.Gui.Tool.SearchPoi({
				id : 'searchPoi',
				title : OpenRouteService.Preferences.translate('searchForPoi'),
				map : map,
				route : self.Elements.routing
			});
			self.Elements.searchPoi.htmlRepresentation.setAttribute('class', 'panel panelLight');
			searchPanel.appendChild(self.Elements.searchPoi.htmlRepresentation);

			document.observe('showRoutePanel:clicked', function() {
				searchPanel.hidePanel();
				//.bind(this);
				routingPanel.showPanel();
			});
		}

		return {
			//the Object to become OpenRouteService.Ui
			initialize : initialize
		};
	}());
