var Ui = ( function(w) {'use strict';

		var $ = w.jQuery,
		//Ui interface
		theInterface,
		//preferences for language selection
		preferences = w.Preferences,
		//functionality of ORS placed in separate tabs
		orsTabs = ['route', 'search'],
		//search POI options: searchNearRoute, maxDist to route, distance Unit for maxDist, search query
		searchPoiAtts = ['false', '100', 'm', ''],
		//is a route available?
		routeIsPresent = false,
		//timeout to wait before sending a request after the user finished typing
		DONE_TYPING_INTERVAL = 1200,
		//timers for user input
		typingTimerSearchAddress, typingTimerSearchPoi;

		/* *********************************************************************
		* GENERAL
		* *********************************************************************/

		/**
		 * user clicks on e.g. routing tab to view routing functionality
		 */
		function handleSwitchTabs(e) {
			var tab = e.currentTarget.id;

			for (var i = 0; i < orsTabs.length; i++) {
				if (orsTabs[i] == tab) {
					//show
					$('#' + orsTabs[i]).parent().attr('class', 'active');
					$('#' + orsTabs[i] + 'Panel').css('display', 'inline');
				} else {
					//hide
					$('#' + orsTabs[i]).parent().attr('class', '');
					$('#' + orsTabs[i] + 'Panel').css('display', 'none');
				}
			}
		}

		/**
		 * expands or collapses option panels
		 */
		function handleToggleCollapsibles(e) {
			if (e.currentTarget.hasClassName('collapsed')) {
				e.currentTarget.removeClassName('collapsed');
				e.currentTarget.nextSibling.nextSibling.show();
			} else {
				e.currentTarget.addClassName('collapsed');
				e.currentTarget.nextSibling.nextSibling.hide();
			}
		}

		/**
		 * makes the sidebar visible or invisible (larger map)
		 */
		function handleToggleSidebar(e) {
			var side = document.getElementById('sidebar');
			if (side.style.display == 'none') {
				//sidebar is not visible, show it
				$('#sidebar').css('display', 'inline');
				$('#map').css('left', '415px');
				$('#toggleSidebar').attr('class', 'sidebarVisible');
				//trigger map update
				theInterface.emit('ui:mapPositionChanged');
			} else {
				//sidebar is visible, hide it
				$('#sidebar').css('display', 'none');
				$('#map').css('left', '25px');
				$('#toggleSidebar').attr('class', 'sidebarInvisible');
				//trigger map update
				theInterface.emit('ui:mapPositionChanged');
			}
		}

		function showNewToOrsPopup() {
			var label = new Element('label');
			label.insert(preferences.translate('infoTextVersions'));
			$('#newToOrs').append(label);
			$('#newToOrs').show();
		}

		/* *********************************************************************
		 * GEOLOCATION
		 * *********************************************************************/

		function handleGeolocationClick(e) {
			theInterface.emit('ui:geolocationRequest');
		}

		function showCurrentLocation() {
			//TODO implement
		}

		function stopGeolocation(text) {
			if (text) {
				$('#geolocationError').text = text;
			}
		}

		/* *********************************************************************
		 * SEARCH ADDRESS
		 * *********************************************************************/

		function handleSearchAddressInput(e) {
			clearTimeout(typingTimerSearchAddress);
			if (e.keyIdentifier != 'Shift' && e.currentTarget.value.length != 0) {
				typingTimerSearchAddress = setTimeout(function() {
					//empty search results
					var resultContainer = document.getElementById('fnct_searchAddressResults');
					while (resultContainer.hasChildNodes()) {
						resultContainer.removeChild(resultContainer.lastChild);
					}
					theInterface.emit('ui:clearSearchAddressMarkers');

					theInterface.emit('ui:searchAddressRequest', e.currentTarget.value);
				}, DONE_TYPING_INTERVAL);
			}
		}

		function searchAddressChangeToSearchingState(changeToSearching) {
			if (changeToSearching) {
				document.getElementById('fnct_searchAddress').addClassName('searching');
				document.getElementById('searchAddressError').hide();
			} else {
				document.getElementById('fnct_searchAddress').removeClassName('searching');
			}
		}

		function updateSearchAddressResultList(request) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var results = request.responseXML ? request.responseXML : util.parseStringToDOM(request.responseText);

			//insert address information to page
			var allAddress;
			var resultContainer = $('#fnct_searchAddressResults');
			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'GeocodeResponseList');
			$A(geocodeResponseList).each(function(geocodeResponse) {
				allAddress = $A(util.getElementsByTagNameNS(geocodeResponse, namespaces.xls, 'Address'));
				for (var i = 0; i < allAddress.length; i++) {
					var address = allAddress[i];
					address = util.parseAddress(address);
					address.setAttribute('id', 'searchAddressResult_' + i);

					var useAsWaypointButton = new Element('span', {
						'class' : 'clickable useAsWaypoint',
						'title' : 'use as waypoint',
						'id' : 'searchAddressResult_' + i
					});
					address.insert(useAsWaypointButton);
					resultContainer.append(address);
				}
			});
			
			//show number of results and link to zoom
			var numResults = $('#zoomToAddressResults');
			numResults.html(preferences.translate('numPoiResults1') + allAddress.length + preferences.translate('numPoiResults2'));

			//event handling
			$('.address').mouseover(handleSearchAddressResultEm);
			$('.address').mouseout(handleSearchAddressResultDeEm);
			$('.address').click(handleSearchResultClick);
			$('.useAsWaypoint').click(handleUseAsWaypoint);
		}

		/**
		 * view an error message when problems occured during geolocation
		 */
		function showSearchAddressError() {
			var errorContainer = document.getElementById('searchAddressError');
			errorContainer.update(preferences.translate("searchError"));
			errorContainer.show();
		}

		/**
		 * highlight the mouseover search result and emphasize the corresponding marker
		 */
		function handleSearchAddressResultEm(e) {
			e.currentTarget.addClassName('highlight');
			theInterface.emit('ui:emphasizeSearchAddressMarker', e.currentTarget.id);
		}

		/**
		 * un-highlight the mouseout search result and deemphasize the corresponding marker
		 */
		function handleSearchAddressResultDeEm(e) {
			e.currentTarget.removeClassName('highlight');
			theInterface.emit('ui:deEmphasizeSearchAddressMarker', e.currentTarget.id);
		}
		
		function handleZoomToAddressResults(e) {
			theInterface.emit('ui:zoomToAddressResults');
		}

		function handleSearchResultClick(e) {
			theInterface.emit('ui:zoomToMarker', e.currentTarget.id);
		}

		function handleUseAsWaypoint(e) {
			//TODO can this also be used for POI?;
			console.log(e);
		}

		/* *********************************************************************
		 * SEARCH POI
		 * *********************************************************************/

		function setRouteIsPresent(present) {
			routeIsPresent = present;
		}

		function handleSearchPoiInput(e) {
			searchPoiAtts[3] = e.currentTarget.value;

			clearTimeout(typingTimerSearchPoi);
			if (e.keyIdentifier != 'Shift' && e.currentTarget.value.length != 0) {
				typingTimerSearchPoi = setTimeout(function() {
					//empty search results
					var resultContainer = document.getElementById('fnct_searchPoiResults');
					while (resultContainer.hasChildNodes()) {
						resultContainer.removeChild(resultContainer.lastChild);
					}
					theInterface.emit('ui:clearSearchPoiMarkers');

					theInterface.emit('ui:searchPoiRequest', {
						query : e.currentTarget.value,
						nearRoute : searchPoiAtts[0] && routeIsPresent,
						maxDist : searchPoiAtts[1],
						distUnit : searchPoiAtts[2]
					});
				}, DONE_TYPING_INTERVAL);
			}

		}

		function searchPoiChangeToSearchingState(changeToSearching) {
			if (changeToSearching) {
				document.getElementById('fnct_searchPoi').addClassName('searching');
				document.getElementById('searchPoiError').hide();
			} else {
				document.getElementById('fnct_searchPoi').removeClassName('searching');
			}
		}

		function handleSearchPoiNearRoute(e) {
			searchPoiAtts[0] = e.currentTarget.checked;

			if (searchPoiAtts[3].length > 0 && routeIsPresent) {
				theInterface.emit('ui:searchPoiRequest', {
					query : searchPoiAtts[3],
					nearRoute : searchPoiAtts[0],
					maxDist : searchPoiAtts[1],
					distUnit : searchPoiAtts[2]
				});
			} else {
				$('#checkboxWarn').text(preferences.translate('noRouteFound'));
				$('#checkboxWarn').show();
			}

			//if we're not searching near route, hide erorr message
			if (searchPoiAtts[0] == false) {
				$('#checkboxWarn').hide();
			}
		}

		function handleSearchPoiDistance(e) {
			searchPoiAtts[1] = e.currentTarget.value;
			theInterface.emit('ui:checkDistanceToRoute', {
				dist : searchPoiAtts[1],
				unit : searchPoiAtts[2]
			});

			if (searchPoiAtts[3].length > 0 && searchPoiAtts[0] == true && routeIsPresent) {
				theInterface.emit('ui:searchPoiRequest', {
					query : searchPoiAtts[3],
					nearRoute : searchPoiAtts[0],
					maxDist : searchPoiAtts[1],
					distUnit : searchPoiAtts[2]
				});
			}
		}

		function handleSearchPoiDistanceUnit(e) {
			searchPoiAtts[2] = e.currentTarget.value;
			theInterface.emit('ui:checkDistanceToRoute', {
				dist : searchPoiAtts[1],
				unit : searchPoiAtts[2]
			});

			if (searchPoiAtts[3].length > 0 && searchPoiAtts[0] == true && routeIsPresent) {
				theInterface.emit('ui:searchPoiRequest', {
					query : searchPoiAtts[3],
					nearRoute : searchPoiAtts[0],
					maxDist : searchPoiAtts[1],
					distUnit : searchPoiAtts[2]
				});
			}
		}

		function updateSearchPoiResultList(request) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var results = request.responseXML ? request.responseXML : util.parseStringToDOM(request.responseText);
			var resultContainer = $('#fnct_searchPoiResults');

			//insert POI information to page
			var allPoi;
			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'DirectoryResponse');
			$A(geocodeResponseList).each(function(poiResponse) {
				allPoi = $A(util.getElementsByTagNameNS(poiResponse, namespaces.xls, 'POIContext'));
				for (var i = 0; i < allPoi.length; i++) {
					var poi = allPoi[i];
					var element = new Element('li', {
						'class' : 'poi',
						'id' : 'searchPoiResult_' + i
					});

					var poiElement = util.getElementsByTagNameNS(poi, namespaces.xls, 'POI')[0];
					var poiName = poiElement.getAttribute('POIName');

					var poiDesc = poiElement.getAttribute('description');
					poiDesc = poiDesc.substring(0, poiDesc.indexOf(';'));
					poiDesc = preferences.translate(poiDesc);
					poiDesc = poiDesc.length > 1 ? ' (' + poiDesc + ')' : '';

					//if neither poiName nor poiDesc is given -> display "untitled"
					poiName = poiName.length + poiDesc.length == 0 ? preferences.translate('untitled') : poiName;

					element.appendChild(new Element('span').update(poiName + poiDesc));

					if (searchPoiAtts[0] == 'true') {
						//we're searching near a route...
						var distElement = util.getElementsByTagNameNS(poi, namespaces.xls, 'Distance')[0];
						var poiDist = distElement.getAttribute('value');
						var distanceUnitSrc = distElement.getAttribute('uom');
						var dist = util.convertDistToDist(poiDist, distanceUnitSrc, preferences.distanceUnit);
						element.appendChild(new Element('span').update(', ' + dist + ' ' + preferences.distanceUnit));
					}

					var useAsWaypointButton = new Element('span', {
						'class' : 'clickable useAsWaypoint',
						'title' : 'use as waypoint',
						'id' : 'searchPoiResult_' + i
					});
					element.insert(useAsWaypointButton);
					resultContainer.append(element);
				}
			});
			
			//show number of results and link to zoom
			var numResults = $('#zoomToPoiResults');
			numResults.html(preferences.translate('numPoiResults1') + allPoi.length + preferences.translate('numPoiResults2'));

			//event handling
			$('.poi').mouseover(handleSearchPoiResultEm);
			$('.poi').mouseout(handleSearchPoiResultDeEm);
			$('.poi').click(handleSearchResultClick);
			$('.useAsWaypoint').click(handleUseAsWaypoint);
		}

		function showSearchPoiError() {
			var errorContainer = document.getElementById('searchPoiError');
			errorContainer.update(preferences.translate("searchError"));
			errorContainer.show();
		}

		function showSearchPoiDistUnitError(isIncorrect) {
			if (isIncorrect) {
				$('#inputWarn').text(preferences.translate('distaneNotSupported'));
				$('#inputWarn').show();
			} else {
				$('#inputWarn').hide();
			}
		}

		/**
		 * highlight the mouseover search result and emphasize the corresponding marker
		 */
		function handleSearchPoiResultEm(e) {
			e.currentTarget.addClassName('highlight');
			theInterface.emit('ui:emphasizeSearchPoiMarker', e.currentTarget.id);
		}

		/**
		 * un-highlight the mouseout search result and deemphasize the corresponding marker
		 */
		function handleSearchPoiResultDeEm(e) {
			e.currentTarget.removeClassName('highlight');
			theInterface.emit('ui:deEmphasizeSearchPoiMarker', e.currentTarget.id);
		}
		
		function handleZoomToPoiResults(e) {
			theInterface.emit('ui:zoomToPoiResults');
		}

		/* *********************************************************************
		 * PERMALINK
		 * *********************************************************************/

		function handleOpenPerma() {
			theInterface.emit('ui:openPermalinkRequest');
		}

		/* *********************************************************************
		* CLASS-SPECIFIC
		* *********************************************************************/

		/**
		 * fill the autocompletion dropdown menu for the POI search with all available POI categories
		 */
		function loadDynamicData() {
			var categoriesToDisplay = [];
			var dummyDiv = new Element('div');
			var typeCategories = $A(list.poiTypes.keys()).each(function(poiType) {
				var detailedTypes = list.poiTypes.get(poiType);

				//trick to decode HTML signs
				dummyDiv.innerHTML = preferences.translate(poiType);
				var decoded = dummyDiv.firstChild.nodeValue;
				categoriesToDisplay.push(decoded);

				$A(detailedTypes).each(function(detailedType) {
					//trick to decode HTML signs
					dummyDiv.innerHTML = preferences.translate(detailedType);
					var decoded = dummyDiv.firstChild.nodeValue;
					categoriesToDisplay.push(decoded);
				})
			})
			//convert the array to required string-representation
			var dataSource = categoriesToDisplay.toString().replace(/,/g, '","');
			//enclose all values with ""
			dataSource = '["' + dataSource + '"]';

			$('#fnct_searchPoi').attr('data-source', dataSource);
		}

		/* *********************************************************************
		 * CONSTRUCTOR
		 * *********************************************************************/

		function Ui() {
			loadDynamicData();

			//switch views
			$('.fnct_switchTab').click(handleSwitchTabs);
			//open & close collapsibles
			$('.collapsibleHead').click(handleToggleCollapsibles);
			//hide & view sidebar
			$('#toggleSidebar').click(handleToggleSidebar);

			//geolocation
			$('#fnct_geolocation').click(handleGeolocationClick);
			//search address
			$('#fnct_searchAddress').keyup(handleSearchAddressInput);
			$('#zoomToAddressResults').click(handleZoomToAddressResults);
			//search POI
			$('#fnct_searchPoi').keyup(handleSearchPoiInput);
			$('#fnct_searchPoi_nearRoute').change(handleSearchPoiNearRoute);
			$('#fnct_searchPoi_distance').keyup(handleSearchPoiDistance);
			$('#fnct_searchPoi_distanceUnit').change(handleSearchPoiDistanceUnit);
			$('#zoomToPoiResults').click(handleZoomToPoiResults);

			//permalink
			$('#fnct_permalink').click(handleOpenPerma);
		}


		Ui.prototype = new EventEmitter();
		Ui.prototype.constructor = Ui;

		Ui.prototype.showNewToOrsPopup = showNewToOrsPopup;

		Ui.prototype.searchAddressChangeToSearchingState = searchAddressChangeToSearchingState;
		Ui.prototype.updateSearchAddressResultList = updateSearchAddressResultList;
		Ui.prototype.showSearchAddressError = showSearchAddressError;

		Ui.prototype.setRouteIsPresent = setRouteIsPresent;
		Ui.prototype.searchPoiChangeToSearchingState = searchPoiChangeToSearchingState;
		Ui.prototype.updateSearchPoiResultList = updateSearchPoiResultList;
		Ui.prototype.showSearchPoiError = showSearchPoiError;
		Ui.prototype.showSearchPoiDistUnitError = showSearchPoiDistUnitError;

		Ui.prototype.showCurrentLocation = showCurrentLocation;
		Ui.prototype.stopGeolocation = stopGeolocation;

		theInterface = new Ui();

		return theInterface;
	}(window));

/* *********************************************************************
* ICONS
* *********************************************************************/
//icons for markers on map
var markerSize = new OpenLayers.Size(21, 30);
var markerOffset = new OpenLayers.Pixel(-markerSize.w / 2, -markerSize.h);
Ui.markerIcons = {
	start : new OpenLayers.Icon('img/marker-start.png', markerSize, markerOffset),
	via : new OpenLayers.Icon('img/marker-via.png', markerSize, markerOffset),
	end : new OpenLayers.Icon('img/marker-end.png', markerSize, markerOffset),
	unset : new OpenLayers.Icon('img/marker.png', markerSize, markerOffset),
	result : new OpenLayers.Icon('img/marker-poi.png', markerSize, markerOffset),
	resultEm : new OpenLayers.Icon('img/marker-poi-high.png', markerSize, markerOffset)
};
//icons for POI markers on map
markerSize = new OpenLayers.Size(24, 24);
Ui.poiIcons = {
	poi_9pin : new OpenLayers.Icon('img/poi/9pin.png', markerSize, markerOffset),
	poi_10pin : new OpenLayers.Icon('img/poi/10pin.png', markerSize, markerOffset),
	poi_archery : new OpenLayers.Icon('img/poi/archeery.png', markerSize, markerOffset),
	//poi_arts_center : new OpenLayers.Icon('img/poi/arts_center.png', markerSize, markerOffset),
	poi_athletics : new OpenLayers.Icon('img/poi/athletics.png', markerSize, markerOffset),
	poi_atm : new OpenLayers.Icon('img/poi/atm.png', markerSize, markerOffset),
	//poi_attraction : new OpenLayers.Icon('img/poi/attraction.png', markerSize, markerOffset),
	poi_australian_football : new OpenLayers.Icon('img/poi/australian_football.png', markerSize, markerOffset),
	poi_bakery : new OpenLayers.Icon('img/poi/bakery.png', markerSize, markerOffset),
	poi_bank : new OpenLayers.Icon('img/poi/bank.png', markerSize, markerOffset),
	poi_baseball : new OpenLayers.Icon('img/poi/baseball.png', markerSize, markerOffset),
	poi_basketball : new OpenLayers.Icon('img/poi/basketball.png', markerSize, markerOffset),
	poi_beachvolleyball : new OpenLayers.Icon('img/poi/beachvolleyball.png', markerSize, markerOffset),
	//poi_bicycle_parking : new OpenLayers.Icon('img/poi/bicycle_parking.png', markerSize, markerOffset),
	poi_biergarten : new OpenLayers.Icon('img/poi/biergarten.png', markerSize, markerOffset),
	poi_boules : new OpenLayers.Icon('img/poi/boules.png', markerSize, markerOffset),
	poi_bowls : new OpenLayers.Icon('img/poi/bowls.png', markerSize, markerOffset),
	poi_bureau_de_change : new OpenLayers.Icon('img/poi/bureau_de_change.png', markerSize, markerOffset),
	poi_bus_station : new OpenLayers.Icon('img/poi/bus_station.png', markerSize, markerOffset),
	poi_bus_stop : new OpenLayers.Icon('img/poi/bus_stop.png', markerSize, markerOffset),
	poi_butcher : new OpenLayers.Icon('img/poi/butcher.png', markerSize, markerOffset),
	poi_cafe : new OpenLayers.Icon('img/poi/cafe.png', markerSize, markerOffset),
	//poi_camp_site : new OpenLayers.Icon('img/poi/camp_site.png', markerSize, markerOffset),
	poi_canoe : new OpenLayers.Icon('img/poi/canoe.png', markerSize, markerOffset),
	//poi_castle : new OpenLayers.Icon('img/poi/castle.png', markerSize, markerOffset),
	poi_chess : new OpenLayers.Icon('img/poi/chess.png', markerSize, markerOffset),
	//poi_church : new OpenLayers.Icon('img/poi/church.png', markerSize, markerOffset),
	poi_cinema : new OpenLayers.Icon('img/poi/cinema.png', markerSize, markerOffset),
	poi_climbing : new OpenLayers.Icon('img/poi/climbing.png', markerSize, markerOffset),
	poi_college : new OpenLayers.Icon('img/poi/college.png', markerSize, markerOffset),
	poi_convenience : new OpenLayers.Icon('img/poi/convenience.png', markerSize, markerOffset),
	poi_courthouse : new OpenLayers.Icon('img/poi/courthouse.png', markerSize, markerOffset),
	poi_cricket : new OpenLayers.Icon('img/poi/cricket.png', markerSize, markerOffset),
	poi_cricket_nets : new OpenLayers.Icon('img/poi/cricket_nets.png', markerSize, markerOffset),
	poi_croquet : new OpenLayers.Icon('img/poi/croquet.png', markerSize, markerOffset),
	poi_cycling : new OpenLayers.Icon('img/poi/cycling.png', markerSize, markerOffset),
	poi_diving : new OpenLayers.Icon('img/poi/diving.png', markerSize, markerOffset),
	poi_dog_racing : new OpenLayers.Icon('img/poi/dog_racing.png', markerSize, markerOffset),
	poi_equestrian : new OpenLayers.Icon('img/poi/equestrian.png', markerSize, markerOffset),
	poi_fast_food : new OpenLayers.Icon('img/poi/fast_food.png', markerSize, markerOffset),
	//poi_fire_station : new OpenLayers.Icon('img/poi/fire_station.png', markerSize, markerOffset),
	poi_fishing : new OpenLayers.Icon('img/poi/fishing.png', markerSize, markerOffset),
	poi_football : new OpenLayers.Icon('img/poi/football.png', markerSize, markerOffset),
	poi_fuel : new OpenLayers.Icon('img/poi/fuel.png', markerSize, markerOffset),
	poi_garden : new OpenLayers.Icon('img/poi/garden.png', markerSize, markerOffset),
	poi_golf : new OpenLayers.Icon('img/poi/golf.png', markerSize, markerOffset),
	poi_golf_course : new OpenLayers.Icon('img/poi/golf.png', markerSize, markerOffset),
	poi_guest_house : new OpenLayers.Icon('img/poi/guest_house.png', markerSize, markerOffset),
	poi_gymnastics : new OpenLayers.Icon('img/poi/gymnastics.png', markerSize, markerOffset),
	poi_hockey : new OpenLayers.Icon('img/poi/hockey.png', markerSize, markerOffset),
	poi_horse_racing : new OpenLayers.Icon('img/poi/horse_racing.png', markerSize, markerOffset),
	poi_hospital : new OpenLayers.Icon('img/poi/hospital.png', markerSize, markerOffset),
	poi_hostel : new OpenLayers.Icon('img/poi/hostel.png', markerSize, markerOffset),
	poi_hotel : new OpenLayers.Icon('img/poi/hotel.png', markerSize, markerOffset),
	poi_ice_rink : new OpenLayers.Icon('img/poi/ice_rink.png', markerSize, markerOffset),
	poi_information : new OpenLayers.Icon('img/poi/information.png', markerSize, markerOffset),
	poi_kiosk : new OpenLayers.Icon('img/poi/kiosk.png', markerSize, markerOffset),
	poi_korfball : new OpenLayers.Icon('img/poi/korfball.png', markerSize, markerOffset),
	poi_library : new OpenLayers.Icon('img/poi/library.png', markerSize, markerOffset),
	poi_marina : new OpenLayers.Icon('img/poi/marina.png', markerSize, markerOffset),
	//poi_memorial : new OpenLayers.Icon('img/poi/memorial.png', markerSize, markerOffset),
	poi_miniature_golf : new OpenLayers.Icon('img/poi/miniature_golf.png', markerSize, markerOffset),
	//poi_monument : new OpenLayers.Icon('img/poi/monument.png', markerSize, markerOffset),
	poi_motel : new OpenLayers.Icon('img/poi/motel.png', markerSize, markerOffset),
	poi_motor : new OpenLayers.Icon('img/poi/motor.png', markerSize, markerOffset),
	//poi_museum : new OpenLayers.Icon('img/poi/museum.png', markerSize, markerOffset),
	poi_nature_reserve : new OpenLayers.Icon('img/poi/nature_reserve.png', markerSize, markerOffset),
	poi_nightclub : new OpenLayers.Icon('img/poi/nightclub.png', markerSize, markerOffset),
	poi_orienteering : new OpenLayers.Icon('img/poi/orienteering.png', markerSize, markerOffset),
	poi_paddle_tennis : new OpenLayers.Icon('img/poi/tennis.png', markerSize, markerOffset),
	poi_paragliding : new OpenLayers.Icon('img/poi/paragliding.png', markerSize, markerOffset),
	poi_park : new OpenLayers.Icon('img/poi/park.png', markerSize, markerOffset),
	poi_parking : new OpenLayers.Icon('img/poi/parking.png', markerSize, markerOffset),
	poi_pelota : new OpenLayers.Icon('img/poi/pelota.png', markerSize, markerOffset),
	poi_pharmacy : new OpenLayers.Icon('img/poi/pharmacy.png', markerSize, markerOffset),
	poi_pitch : new OpenLayers.Icon('img/poi/pitch.png', markerSize, markerOffset),
	poi_place_of_worship : new OpenLayers.Icon('img/poi/church.png', markerSize, markerOffset),
	poi_playground : new OpenLayers.Icon('img/poi/playground.png', markerSize, markerOffset),
	poi_police : new OpenLayers.Icon('img/poi/police.png', markerSize, markerOffset),
	poi_post_box : new OpenLayers.Icon('img/poi/post_box.png', markerSize, markerOffset),
	poi_post_office : new OpenLayers.Icon('img/poi/post_office.png', markerSize, markerOffset),
	poi_pub : new OpenLayers.Icon('img/poi/pub.png', markerSize, markerOffset),
	poi_public_building : new OpenLayers.Icon('img/poi/public_building.png', markerSize, markerOffset),
	poi_raquet : new OpenLayers.Icon('img/poi/racquet.png', markerSize, markerOffset),
	poi_railway_station : new OpenLayers.Icon('img/poi/railway_station.png', markerSize, markerOffset),
	//poi_recreation : new OpenLayers.Icon('img/poi/recreation.png', markerSize, markerOffset),
	//poi_recycling : new OpenLayers.Icon('img/poi/recycling.png', markerSize, markerOffset),
	poi_restaurant : new OpenLayers.Icon('img/poi/restaurant.png', markerSize, markerOffset),
	poi_rowing : new OpenLayers.Icon('img/poi/rowing.png', markerSize, markerOffset),
	poi_rugby : new OpenLayers.Icon('img/poi/rugby.png', markerSize, markerOffset),
	poi_school : new OpenLayers.Icon('img/poi/school.png', markerSize, markerOffset),
	//poi_shelter : new OpenLayers.Icon('img/poi/shelter.png', markerSize, markerOffset),
	poi_shooting : new OpenLayers.Icon('img/poi/shooting.png', markerSize, markerOffset),
	poi_skateboard : new OpenLayers.Icon('img/poi/skateboard.png', markerSize, markerOffset),
	poi_skating : new OpenLayers.Icon('img/poi/skating.png', markerSize, markerOffset),
	poi_skiing : new OpenLayers.Icon('img/poi/skiing.png', markerSize, markerOffset),
	poi_slipway : new OpenLayers.Icon('img/poi/slipway.png', markerSize, markerOffset),
	poi_soccer : new OpenLayers.Icon('img/poi/soccer.png', markerSize, markerOffset),
	poi_sports_center : new OpenLayers.Icon('img/poi/sports_centre.png', markerSize, markerOffset),
	poi_squash : new OpenLayers.Icon('img/poi/squash.png', markerSize, markerOffset),
	poi_stadium : new OpenLayers.Icon('img/poi/stadium.png', markerSize, markerOffset),
	poi_subway_entrance : new OpenLayers.Icon('img/poi/subway_entrance.png', markerSize, markerOffset),
	poi_supermarket : new OpenLayers.Icon('img/poi/supermarket.png', markerSize, markerOffset),
	poi_swimming : new OpenLayers.Icon('img/poi/swimming.png', markerSize, markerOffset),
	poi_table_tennis : new OpenLayers.Icon('img/poi/table_tennis.png', markerSize, markerOffset),
	poi_taxi : new OpenLayers.Icon('img/poi/taxi.png', markerSize, markerOffset),
	poi_team_handball : new OpenLayers.Icon('img/poi/team_handball.png', markerSize, markerOffset),
	poi_telephone : new OpenLayers.Icon('img/poi/telephone.png', markerSize, markerOffset),
	poi_tennis : new OpenLayers.Icon('img/poi/tennis.png', markerSize, markerOffset),
	poi_theatre : new OpenLayers.Icon('img/poi/theatre.png', markerSize, markerOffset),
	poi_toilets : new OpenLayers.Icon('img/poi/toilets.png', markerSize, markerOffset),
	poi_townhall : new OpenLayers.Icon('img/poi/townhall.png', markerSize, markerOffset),
	poi_track : new OpenLayers.Icon('img/poi/track.png', markerSize, markerOffset),
	poi_tram_stop : new OpenLayers.Icon('img/poi/tram_stop.png', markerSize, markerOffset),
	poi_university : new OpenLayers.Icon('img/poi/university.png', markerSize, markerOffset),
	poi_viewpoint : new OpenLayers.Icon('img/poi/viewpoint.png', markerSize, markerOffset),
	poi_volleyball : new OpenLayers.Icon('img/poi/volleyball.png', markerSize, markerOffset),
	poi_water_park : new OpenLayers.Icon('img/poi/water_park.png', markerSize, markerOffset),
	//default icon
	poi_default : new OpenLayers.Icon('img/poi/building_number.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12, -12))
};
