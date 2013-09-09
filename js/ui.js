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
		//timers for user input (search)
		typingTimerSearchAddress, typingTimerSearchPoi,
		//timers for user input (waypoints)
		timer0, timer1, typingTimerWaypoints = [timer0, timer1];

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
				$(e.currentTarget).parent().get(0).querySelector('.collapsibleBody').show();
				//applies for route instructions container only
				var routeInstructions = $(e.currentTarget).parent().get(0).querySelector('#zoomToRouteButton');
				if (routeInstructions) {
					routeInstructions.show();
				}
			} else {
				e.currentTarget.addClassName('collapsed');
				$(e.currentTarget).parent().get(0).querySelector('.collapsibleBody').hide();
				//applies for route instructions container only
				var routeInstructions = $(e.currentTarget).parent().get(0).querySelector('#zoomToRouteButton');
				if (routeInstructions) {
					routeInstructions.hide();
				}
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

		/* *********************************************************************
		* LANGUAGE-SPECIFIC
		* *********************************************************************/

		//TODO load text for all elements on the page with specific language

		function showNewToOrsPopup() {
			var label = new Element('label');
			label.insert(preferences.translate('infoTextVersions'));
			$('#newToOrs').append(label);
			$('#newToOrs').show();
		}

		/* *********************************************************************
		* ALL MARKER ELEMENTS
		* *********************************************************************/

		/**
		 * highlight the element
		 */
		function emphElement(elementId) {
			$('#' + elementId).get(0).addClassName('highlight');
			$('#' + elementId).get(0).addClassName('active');
		}

		/**
		 * de-highlight the element
		 */
		function deEmphElement(elementId) {
			$('#' + elementId).get(0).removeClassName('highlight');
			$('#' + elementId).get(0).removeClassName('active');
		}

		/**
		 * highlight the mouseover element and emphasize the corresponding marker
		 */
		function handleMouseOverElement(e) {
			e.currentTarget.addClassName('highlight');
			theInterface.emit('ui:emphElement', {
				id : e.currentTarget.getAttribute('id'),
				layer : e.currentTarget.getAttribute('data-layer')
			});
		}

		/**
		 * de-highlight the mouseover element and emphasize the corresponding marker
		 */
		function handleMouseOutElement(e) {
			e.currentTarget.removeClassName('highlight');
			theInterface.emit('ui:deEmphElement', {
				id : e.currentTarget.getAttribute('id'),
				layer : e.currentTarget.getAttribute('data-layer')
			});
		}

		/* *********************************************************************
		 * WAYPOINTS
		 * *********************************************************************/

		function handleSearchWaypointInput(e) {
			var waypointElement = $(e.currentTarget).parent().parent();

			//index of the waypoint (0st, 1st 2nd,...)
			var index = waypointElement.attr('id');

			clearTimeout(typingTimerWaypoints[index]);
			if (e.keyIdentifier != 'Shift' && e.currentTarget.value.length != 0) {
				var input = e.currentTarget.value;
				typingTimerWaypoints[index] = setTimeout(function() {
					//empty search results
					var resultContainer = waypointElement.get(0).querySelector('.searchWaypointResults');
					while (resultContainer && resultContainer.hasChildNodes()) {
						resultContainer.removeChild(resultContainer.lastChild);
					}
					//request new results
					theInterface.emit('ui:searchWaypointRequest', {
						query : input,
						wpIndex : index,
						searchIds : waypointElement.get(0).getAttribute('data-search')
					});
				}, DONE_TYPING_INTERVAL);
			}
		}

		function searchWaypointChangeToSearchingState(changeToSearching, wpIndex) {
			var rootElement = $('#' + wpIndex).get(0);
			var inputElement = rootElement.querySelector('input');

			if (changeToSearching) {
				$(inputElement).addClass('searching');
				rootElement.querySelector('.searchWaypointError').hide();
			} else {
				inputElement.removeClassName('searching');
			}
		}

		function updateSearchWaypointResultList(request, listOfFeatures, layername, wpIndex) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var results = request.responseXML ? request.responseXML : util.parseStringToDOM(request.responseText);

			//insert address information to page
			var allAddress;
			var allIds = '';
			var rootElement = $('#' + wpIndex).get(0);
			var resultContainer = rootElement.querySelector('.searchWaypointResults');
			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'GeocodeResponseList');
			$A(geocodeResponseList).each(function(geocodeResponse) {
				allAddress = $A(util.getElementsByTagNameNS(geocodeResponse, namespaces.xls, 'Address'));
				for (var i = 0; i < allAddress.length; i++) {
					//listOfFeatures[i] == null if result is not in Europe
					if (listOfFeatures[i]) {
						var lonLat = listOfFeatures[i].geometry;
						allIds += listOfFeatures[i].id + ' ';
						var xmlAddress = allAddress[i];
						var address = util.parseAddress(xmlAddress);
						var shortText = util.parseAddressShort(xmlAddress);
						address.setAttribute('id', listOfFeatures[i].id);
						address.setAttribute('data-position', lonLat.x + ' ' + lonLat.y);
						address.setAttribute('data-layer', layername);
						address.setAttribute('data-shortAddress', shortText);
						resultContainer.appendChild(address);
					}
				}
			});
			//slice away last space
			allIds = allIds.substring(0, allIds.length - 1);
			rootElement.setAttribute('data-search', allIds);

			//show number of results and link to zoom
			var numResults = $('#zoomToWaypointResults_' + wpIndex);
			numResults.html(preferences.translate('numPoiResults1') + allAddress.length + preferences.translate('numPoiResults2') + '<br/>' + preferences.translate('selectResult'));

			//event handling
			$('.address').mouseover(handleMouseOverElement);
			$('.address').mouseout(handleMouseOutElement);
			$('.address').click(handleSearchWaypointResultClick);
		}

		/**
		 * view an error message when problems occured during geocoding
		 */
		function showSearchWaypointError(wpIndex) {
			var rootElement = $('#' + wpIndex).get(0);
			var errorContainer = rootElement.querySelector('.searchWaypointError')
			errorContainer.update(preferences.translate("searchError"));
			errorContainer.show();
		}

		/**
		 * when the user clicks on a waypoint search result, use it as waypoint
		 */
		function handleSearchWaypointResultClick(e) {
			var rootElement = $(e.currentTarget).parent().parent().parent().parent();
			var index = rootElement.attr('id');
			rootElement.removeClass('unset');
			rootElement = rootElement.get(0);

			rootElement.querySelector('.searchAgainButton').show();
			rootElement.querySelector('.guiComponent').hide();

			var waypointResultElement = rootElement.querySelector('div');
			waypointResultElement.insert(e.currentTarget);
			waypointResultElement.show();

			//remove search markers and add a new waypoint marker
			theInterface.emit('ui:waypointResultClick', {
				wpIndex : index,
				featureId : e.currentTarget.id,
				searchIds : rootElement.getAttribute('data-search')
			});
		}

		function setWaypointFeatureId(wpIndex, featureId, position, layer) {
			var rootElement = $('#' + wpIndex).get(0);
			var address = rootElement.querySelector('.address');
			if (address) {
				address.id = featureId;
				address.setAttribute('data-layer', layer);
				address.setAttribute('data-position', position);
			}
		}

		function getFeatureIdOfWaypoint(wpIndex) {
			var rootElement = $('#' + wpIndex).get(0);
			var address = rootElement.querySelector('.address');
			var id = address ? address.id : null;
			return id;
		}

		function getWaypiontIndexByFeatureId(featureId) {
			var wpResult = $('#' + featureId);
			var wpElement;
			if (wpResult) {
				wpElement = wpResult.parent().parent();
			}
			if (wpElement) {
				var wpIndex = wpElement.attr('id');
				if (!isNaN(wpIndex)) {
					return wpIndex;
				} else {
					return null;
				}
			}
		}

		function handleMoveUpWaypointClick(e) {
			//index of waypoint
			var waypointElement = $(e.currentTarget).parent();
			var index = parseInt(waypointElement.attr('id'));

			var prevIndex = index - 1;
			var previousElement = $('#' + prevIndex);

			waypointElement.insertBefore(previousElement);

			//adapt IDs...
			previousElement.attr('id', index);
			waypointElement.attr('id', prevIndex);

			//define the new correct order
			var currentIndex = prevIndex;
			var succIndex = index;

			//-1 because we have an invisible draft waypoint
			var numWaypoints = $('.waypoint').length - 1;

			//decide which button to show
			if (currentIndex == 0) {
				//the waypoint which has been moved up is the first waypoint: hide move up button
				$(waypointElement.get(0).querySelector('.moveUpWaypoint')).hide();
				$(waypointElement.get(0).querySelector('.moveDownWaypoint')).show();
			} else {
				//show both
				$(waypointElement.get(0).querySelector('.moveUpWaypoint')).show();
				$(waypointElement.get(0).querySelector('.moveDownWaypoint')).show();
			}

			if (succIndex == (numWaypoints - 1)) {
				//the waypoint which has been moved down is the last waypoint: hide the move down button
				$(previousElement.get(0).querySelector('.moveUpWaypoint')).show()
				$(previousElement.get(0).querySelector('.moveDownWaypoint')).hide();
			} else {
				//show both
				$(previousElement.get(0).querySelector('.moveUpWaypoint')).show()
				$(previousElement.get(0).querySelector('.moveDownWaypoint')).show();
			}

			//adapt marker-IDs, decide about wpType
			theInterface.emit('ui:movedWaypoints', {
				id1 : currentIndex,
				id2 : succIndex
			});
		}

		function handleMoveDownWaypointClick(e) {
			//index of waypoint
			var waypointElement = $(e.currentTarget).parent();
			var index = parseInt(waypointElement.attr('id'));

			var succElement = $('#' + (index + 1));
			var succIndex = index + 1;

			waypointElement.insertAfter(succElement);

			//adapt IDs... of waypointElement
			waypointElement.attr('id', succIndex);
			succElement.attr('id', index);

			//define the new correct order
			var currentIndex = succIndex;
			var prevIndex = index;

			//-1 because we have an invisible draft waypoint
			var numWaypoints = $('.waypoint').length - 1;

			//decide which buttons to show
			if (currentIndex == numWaypoints - 1) {
				//the waypoint which has been moved down is the last waypoint: hide move down button
				$(waypointElement.get(0).querySelector('.moveUpWaypoint')).show();
				$(waypointElement.get(0).querySelector('.moveDownWaypoint')).hide();
			} else {
				//show both
				$(waypointElement.get(0).querySelector('.moveUpWaypoint')).show();
				$(waypointElement.get(0).querySelector('.moveDownWaypoint')).show();
			}
			if (prevIndex == 0) {
				//the waypoint which has been moved up is the first waypoint: hide the move up button
				$(succElement.get(0).querySelector('.moveUpWaypoint')).hide();
				$(succElement.get(0).querySelector('.moveDownWaypoint')).show();
			} else {
				//show both
				$(succElement.get(0).querySelector('.moveUpWaypoint')).show();
				$(succElement.get(0).querySelector('.moveDownWaypoint')).show();
			}

			//adapt marker-IDs, decide about wpType
			theInterface.emit('ui:movedWaypoints', {
				id1 : currentIndex,
				id2 : prevIndex
			});
		}

		function handleAddWaypointClick(e) {
			//id of prior to last waypoint:
			var waypointId = $(e.currentTarget).prev().attr('id');
			var oldIndex = parseInt(waypointId);
			addWaypointAfter(oldIndex, oldIndex + 1);

			theInterface.emit('ui:selectWaypointType', oldIndex);
			var numwp = $('.waypoint').length - 1;
		}

		/**
		 *add a new waypoint element after given waypoint index
		 * @idx (int) index of the predecessor waypoint
		 */
		function addWaypointAfter(idx, numWaypoints) {
			//for the current element, show the move down button (will later be at least the next to last one)
			var previous = $('#' + idx);
			previous.children()[2].show();

			//'move' all successor waypoints down from idx+1 to numWaypoints
			for (var i = idx + 1; i < numWaypoints; i++) {
				var wpElement = $('#' + i);
				if (i < numWaypoints - 1) {
					//this is not the last waypoint, show move down button
					wpElement.children()[2].show();
				}
				var wpId = wpElement.attr('id');
				wpElement.attr('id', i + 1);
			}

			//generate new id
			var newIndex = parseInt(idx) + 1;
			var predecessorElement = $('#' + idx);
			var waypointId = predecessorElement.attr('id');
			waypointId = waypointId.replace(idx, newIndex);

			//generate DOM elements
			var newWp = $('#Draft').clone();
			newWp.attr('id', waypointId)
			newWp.insertAfter(predecessorElement);
			newWp.show();

			//decide which buttons to show
			var buttons = newWp.children();
			//show remove waypoint + move up button
			buttons[0].show();
			buttons[1].show();
			//including our new waypoint we are constructing here, we have one more waypoint. So we count to numWaypoints, not numWaypoints-1
			if (newIndex < numWaypoints) {
				//not the last waypoint, allow moving down
				buttons[2].show();
			} else {
				buttons[2].hide();
			}

			//add event handling
			newWp = newWp.get(0);
			newWp.querySelector('.searchWaypoint').addEventListener('keyup', handleSearchWaypointInput);
			newWp.querySelector('.moveUpWaypoint').addEventListener('click', handleMoveUpWaypointClick);
			newWp.querySelector('.moveDownWaypoint').addEventListener('click', handleMoveDownWaypointClick);
			newWp.querySelector('.removeWaypoint').addEventListener('click', handleRemoveWaypointClick);
			newWp.querySelector('.searchAgainButton').addEventListener('click', handleSearchAgainWaypointClick);

			theInterface.emit('ui:addWaypoint');
		}

		function addWaypointResultByRightclick(request, typeOfWaypoint, index) {
			var numWaypoints = $('.waypoint').length - 1;
			while (index >= numWaypoints) {
				addWaypointAfter(numWaypoints - 1);
				numWaypoints++;
			}

			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var results = request.responseXML ? request.responseXML : util.parseStringToDOM(request.responseText);
			var addressResult = util.getElementsByTagNameNS(results, namespaces.xls, 'Address');
			addressResult = addressResult ? addressResult[0] : null;
			var address = util.parseAddress(addressResult);
			var shortAddress = util.parseAddressShort(addressResult);

			//insert information as waypoint
			var rootElement = $('#' + index);
			rootElement.removeClass('unset');

			address.setAttribute('data-shortAddress', shortAddress);

			var children = rootElement.children();

			//show waypoint result and searchAgain button
			children[3].show();
			var waypointResultElement = children[4];
			while (waypointResultElement.hasChildNodes()) {
				waypointResultElement.removeChild(waypointResultElement.lastChild);
			}
			waypointResultElement.appendChild(address);
			waypointResultElement.show();

			//hide input field with search result list
			children[5].hide();

			//event handling
			$('.address').mouseover(handleMouseOverElement);
			$('.address').mouseout(handleMouseOutElement);

			theInterface.emit('ui:selectWaypointType', index);
			if (index > 0) {
				//this is necessary if we called this function after clicking on "use as waypoint" on a POI search result etc.
				theInterface.emit('ui:selectWaypointType', index - 1);
			}

			return index;
		}

		function handleRemoveWaypointClick(e) {
			var numWaypoints = $('.waypoint').length - 1;

			var currentId = parseInt($(e.currentTarget).parent().attr('id'));
			var featureId = $(e.currentTarget).parent().get(0);
			featureId = featureId.querySelector('.address');
			if (featureId) {
				featureId = featureId.id;
			} else {
				featureId = null;
			}

			//we want to show at least 2 waypoints
			if (numWaypoints > 2) {
				//'move' all successor waypoints up from currentId to currentId-1
				for (var i = currentId + 1; i < numWaypoints; i++) {
					var wpElement = $('#' + i);
					wpElement.attr('id', (i - 1));
				}

				$(e.currentTarget).parent().remove();
			} else {
				var wpElement = $(e.currentTarget).parent().get(0);
				wpElement.setAttribute('class', 'guiComponent waypoint unset');
				wpElement.querySelector('.searchAgainButton').hide();
				wpElement.querySelector('.guiComponent').show()

				var result = wpElement.querySelector('.waypointResult');
				result.innerHTML = '';
			}

			theInterface.emit('ui:removeWaypoint', {
				wpIndex : currentId,
				featureId : featureId
			});

			var numwp = $('.waypoint').length - 1;
		}

		/**
		 *show or hide the "move waypoint down" button
		 */
		function setMoveDownButton(wpIndex, show) {
			var rootElement = $('#' + wpIndex).get(0);
			var moveDown = rootElement.querySelector('.moveDownWaypoint');
			if (show) {
				$(moveDown).show();
			} else {
				$(moveDown).hide();
			}
		}

		/**
		 *show or hide the "move waypoint up" button
		 */
		function setMoveUpButton(wpIndex, show) {
			var rootElement = $('#' + wpIndex).get(0);
			var moveUp = rootElement.querySelector('.moveUpWaypoint');
			if (show) {
				$(moveUp).show();
			} else {
				$(moveUp).hide();
			}
		}

		function handleSearchAgainWaypointClick(e) {
			//TODO implement
		}

		function setWaypointType(wpIndex, type) {
			var el = $('#' + wpIndex);
			el.removeClass('unset');
			el.removeClass('start');
			el.removeClass('via');
			el.removeClass('end');
			el.addClass(type);
		}

		function handleResetRoute() {
			//remove markers on map
			theInterface.emit('ui:resetRoute');

			//remove all existing waypoints
			var el = $('#0');
			var i = 0;
			while (el.length > 0) {
				el.remove();
				i++;
				el = $('#' + i);
			}

			//generate two empty waypoints
			for (var j = 1; j >= 0; j--) {
				//generate DOM elements
				var draftWp = $('#Draft');
				var newWp = draftWp.clone();
				newWp.attr('id', j)
				newWp.insertAfter(draftWp);
				newWp.show();

				//decide which buttons to show
				var buttons = newWp.children();
				//show remove waypoint
				buttons[0].show();

				if (j == 1) {
					//show only move down button
					buttons[2].hide();
					buttons[1].show();
				} else if (j == 0) {
					//show only move up button
					buttons[1].hide();
					buttons[2].show();
				}

				//add event handling
				$('.searchWaypoint').keyup(handleSearchWaypointInput);
			}
		}

		function showSearchingAtWaypoint(wpIndex, showSearching) {
			var wp = $('#' + wpIndex).get(0);
			var inputElement = wp.querySelector('input');

			if (showSearching) {
				$(inputElement).addClass('searching');
				wp.querySelector('.searchWaypointError').hide();
			} else {
				inputElement.removeClassName('searching');
			}
		}

		function handleSearchAgainWaypointClick(e) {
			console.log(e);
			//TODO implement
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
					var numResults = $('#zoomToAddressResults').get(0);
					while (numResults.hasChildNodes()) {
						numResults.removeChild(numResults.lastChild);
					}

					var lastSearchResults = $('#searchAddress').attr('data-search');
					theInterface.emit('ui:searchAddressRequest', {
						address : e.currentTarget.value,
						lastSearchResults : lastSearchResults
					});
				}, DONE_TYPING_INTERVAL);
			}
		}

		function searchAddressChangeToSearchingState(changeToSearching) {
			if (changeToSearching) {
				$('#fnct_searchAddress').addClass('searching');
				$('#searchAddressError').hide();
			} else {
				$('#fnct_searchAddress').removeClass('searching');
			}
		}

		function updateSearchAddressResultList(request, listOfFeatures, layername) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var results = request.responseXML ? request.responseXML : util.parseStringToDOM(request.responseText);

			//insert address information to page
			var allAddress;
			var allIds = "";
			var resultContainer = $('#fnct_searchAddressResults');
			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'GeocodeResponseList');
			$A(geocodeResponseList).each(function(geocodeResponse) {
				allAddress = $A(util.getElementsByTagNameNS(geocodeResponse, namespaces.xls, 'Address'));
				for (var i = 0; i < allAddress.length; i++) {
					//listOfPoitnts[i] == null if result is not in Europe
					if (listOfFeatures[i]) {
						var address = allAddress[i];
						address = util.parseAddress(address);
						var lonLat = listOfFeatures[i].geometry;
						allIds += listOfFeatures[i].id + ' ';
						address.setAttribute('id', listOfFeatures[i].id);
						address.setAttribute('data-position', lonLat.x + ' ' + lonLat.y);
						address.setAttribute('data-layer', layername);

						var useAsWaypointButton = new Element('span', {
							'class' : 'clickable useAsWaypoint',
							'title' : 'use as waypoint',
							'id' : listOfFeatures[i].id,
							'data-position' : lonLat.x + ' ' + lonLat.y,
							'data-layer' : layername
						});
						address.insert(useAsWaypointButton);
						resultContainer.append(address);
					}
				}
			});

			//slice away last space
			allIds = allIds.substring(0, allIds.length - 1);
			var searchElement = $('#searchPlace').get(0);
			searchElement.setAttribute('data-search', allIds);

			//show number of results and link to zoom
			var numResults = $('#zoomToAddressResults');
			numResults.html(preferences.translate('numPoiResults1') + allAddress.length + preferences.translate('numPoiResults2'));

			//event handling
			$('.address').mouseover(handleMouseOverElement);
			$('.address').mouseout(handleMouseOutElement);
			$('.address').click(handleSearchResultClick);
			$('.useAsWaypoint').click(handleUseAsWaypoint);
		}

		/**
		 * view an error message when problems occured during geolocation
		 */
		function showSearchAddressError() {
			var errorContainer = $('#searchAddressError');
			errorContainer.html(preferences.translate("searchError"));
			errorContainer.show();
		}

		function handleZoomToAddressResults(e) {
			theInterface.emit('ui:zoomToAddressResults');
		}

		function handleSearchResultClick(e) {
			theInterface.emit('ui:zoomToMarker', {
				position : e.currentTarget.getAttribute('data-position'),
				layer : e.currentTarget.getAttribute('data-layer')
			});
		}

		function handleUseAsWaypoint(e) {
			theInterface.emit('ui:useAsWaypoint', {
				id : e.currentTarget.id,
				position : e.currentTarget.getAttribute('data-position'),
				layer : e.currentTarget.getAttribute('data-layer')
			});

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
					var numResults = $('#zoomToPoiResults').get(0);
					while (numResults.hasChildNodes()) {
						numResults.removeChild(numResults.lastChild);
					}

					var lastSearchResults = $('#searchPoi').attr('data-search');
					theInterface.emit('ui:searchPoiRequest', {
						query : e.currentTarget.value,
						nearRoute : searchPoiAtts[0] && routeIsPresent,
						maxDist : searchPoiAtts[1],
						distUnit : searchPoiAtts[2],
						lastSearchResults : lastSearchResults
					});
				}, DONE_TYPING_INTERVAL);
			}

		}

		function searchPoiChangeToSearchingState(changeToSearching) {
			if (changeToSearching) {
				$('#fnct_searchPoi').addClass('searching');
				$('#searchPoiError').hide();
			} else {
				$('#fnct_searchPoi').removeClass('searching');
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

		function updateSearchPoiResultList(request, listOfFeatures, layername) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var results = request.responseXML ? request.responseXML : util.parseStringToDOM(request.responseText);
			var resultContainer = $('#fnct_searchPoiResults');

			//insert POI information to page
			var allPoi;
			var allIds = "";
			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'DirectoryResponse');
			$A(geocodeResponseList).each(function(poiResponse) {
				allPoi = $A(util.getElementsByTagNameNS(poiResponse, namespaces.xls, 'POIContext'));
				for (var i = 0; i < allPoi.length; i++) {
					if (listOfFeatures[i]) {

						var poi = allPoi[i];
						var element = new Element('li', {
							'class' : 'poi',
						});

						allIds += listOfFeatures[i].id + ' ';
						var lonLat = listOfFeatures[i].geometry;
						element.setAttribute('id', listOfFeatures[i].id);
						element.setAttribute('data-position', lonLat.x + ' ' + lonLat.y);
						element.setAttribute('data-layer', layername);

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
							'id' : listOfFeatures[i].id,
							'data-position' : lonLat.x + ' ' + lonLat.y,
							'data-layer' : layername
						});
						element.insert(useAsWaypointButton);
						resultContainer.append(element);
					}
				}
			});

			//slice away last space
			allIds = allIds.substring(0, allIds.length - 1);
			var searchElement = $('#searchPoi').get(0);
			searchElement.setAttribute('data-search', allIds);

			//show number of results and link to zoom
			var numResults = $('#zoomToPoiResults');
			numResults.html(preferences.translate('numPoiResults1') + allPoi.length + preferences.translate('numPoiResults2'));

			//event handling
			$('.poi').mouseover(handleMouseOverElement);
			$('.poi').mouseout(handleMouseOutElement);
			$('.poi').click(handleSearchResultClick);
			$('.useAsWaypoint').click(handleUseAsWaypoint);
		}

		function showSearchPoiError() {
			var errorContainer = $('#searchPoiError');
			errorContainer.html(preferences.translate("searchError"));
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

		function handleZoomToPoiResults(e) {
			theInterface.emit('ui:zoomToPoiResults');
		}

		/* *********************************************************************
		 * ROUTE
		 * *********************************************************************/

		function getRoutePoints() {
			var allRoutePoints = [];
			var numWaypoints = $('.waypoint').length - 1;
			for (var i = 0; i < numWaypoints; i++) {
				var element = $('#' + i).get(0);
				element = element.querySelector('.address');
				if (element) {
					allRoutePoints.push(element.getAttribute('data-position'))
				}
			}
			return allRoutePoints;
		}

		function getRouteDestination() {
			//find the last waypoint set
			var lastSetWaypoint = -1;
			for (var i = $('.waypoint').length - 2; i >= 0; i--) {
				var address = $('#' + i).get(0);
				if (address.querySelector('.address')) {
					lastSetWaypoint = i;
					i = -1;
				}
			}
			if (lastSetWaypoint >= 0) {
				var address = $('#' + lastSetWaypoint).get(0);
				address = address.querySelector('.address');
				address = address.getAttribute('data-shortAddress');
				return address;
			} else {
				return null;
			}
		}

		function startRouteCalculation() {
			var el = $('#routeCalculate');
			el.show();
			el.html(preferences.translate('calculatingRoute'));

			$('#routeError').hide();
		}

		function endRouteCalculation() {
			$('#routeCalculate').hide();
		}

		function updateRouteSummary(results) {
			if (!results) {
				//hide container
				$('#routeSummaryContainer').get(0).hide();
			} else {
				//parse results and show them in the container
				var summaryElement = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteSummary')[0];

				var totalTime = util.getElementsByTagNameNS(summaryElement, namespaces.xls, 'TotalTime')[0];
				totalTime = totalTime.textContent || totalTime.text;
				//<period>PT5Y2M10D15H18M43S</period>
				//The example above indicates a period of five years, two months, 10 days, 15 hours, a8 minutes and 43 seconds
				totalTime = totalTime.substring(0, totalTime.indexOf('M') + 1);
				totalTime = totalTime.replace('P', '');
				totalTime = totalTime.replace('T', '');
				totalTime = totalTime.replace('D', ' ' + preferences.translate('days') + ' ');
				totalTime = totalTime.replace('H', ' ' + preferences.translate('hours') + ' ');
				totalTime = totalTime.replace('M', ' ' + preferences.translate('minutes') + ' ');
				//cut the seconds off!: duration = duration.replace('S', ' second(s)');

				var distance = util.getElementsByTagNameNS(summaryElement, namespaces.xls, 'TotalDistance')[0];
				var distanceValue = distance.getAttribute('value');
				var distanceUnit = distance.getAttribute('uom');
				var distArr = [];

				if (preferences.distanceUnit == list.distanceUnitsPreferences[0]) {
					//use mixture of km and m
					distArr = util.convertDistanceFormat(distanceValue, preferences.distanceUnit);
				} else {
					//use mixture of miles and yards
					var yardsUnit = 'yd';
					var distMeasure = util.convertDistToDist(distanceValue, distanceUnit, yardsUnit);
					distArr = util.convertDistanceFormat(distMeasure, preferences.distanceUnit);
				}

				var container = $('#routeSummaryContainer').get(0);
				container.show();
				var timeDiv = container.querySelector('#route_totalTime');
				var distanceDiv = container.querySelector('#route_totalDistance');

				$(timeDiv)[0].update(preferences.translate('TotalTime') + ': ' + totalTime);
				$(distanceDiv)[0].update(preferences.translate('TotalDistance') + ': ' + distArr[0] + ' ' + distArr[1]);
			}
		}

		/**
		 * @param mapFeatureIds: list of IDs of OpenLayers elements containing BOTH - ids for route line segments AND corner points:
		 * [routeLineSegment_0, cornerPoint_0, routeLineSegment_1, cornerPoint_1,...]
		 */
		function updateRouteInstructions(results, mapFeatureIds, mapLayer) {
			if (!results) {
				var container = $('#routeInstructionsContainer').get(0);
				container.hide();
			} else {
				//parse results and show them in the container

				var destination = getRouteDestination();
				$('#routeFromTo').html(preferences.translate('routeFromTo') + destination);

				var container = $('#routeInstructionsContainer').get(0);
				container.show();
				var table = container.querySelector('table');
				//remove old route instructions if the user has searched before
				while (table.firstChild) {
					table.removeChild(table.firstChild);
				}
				var numInstructions = 0;

				var instructionsList = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteInstructionsList')[0];
				instructionsList = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteInstruction');
				$A(instructionsList).each(function(instruction) {
					//process each routing instruction
					var text = util.getElementsByTagNameNS(instruction, namespaces.xls, 'Instruction')[0];
					text = text.text || text.textContent;

					var distance = util.getElementsByTagNameNS(instruction, namespaces.xls, 'distance')[0];
					var distanceValue = distance.getAttribute('value');
					var distanceUnit = distance.getAttribute('uom');
					var distArr = [];

					if (preferences.distanceUnit == list.distanceUnitsPreferences[0]) {
						//use mixture of km and m
						distArr = util.convertDistanceFormat(distanceValue, preferences.distanceUnit);
					} else {
						//use mixture of miles and yards
						var yardsUnit = 'yd';
						var distMeasure = util.convertDistToDist(distanceValue, distanceUnit, yardsUnit);
						distArr = util.convertDistanceFormat(distMeasure, preferences.distanceUnit);
					}

					//arrow direction
					var left = text.indexOf(preferences.translate('left'));
					var halfLeft = text.indexOf(preferences.translate('half-left'));
					var right = text.indexOf(preferences.translate('right'));
					var halfRight = text.indexOf(preferences.translate('half-right'));
					var straight = text.indexOf(preferences.translate('straight'));
					var direction;
					if (left > 0 && (left < halfLeft || halfLeft < 0)) {
						direction = new Element('img', {
							'src' : './img/left.png'
						});
					} else if (right > 0 && (right < halfRight || halfRight < 0)) {
						direction = new Element('img', {
							'src' : './img/right.png'
						});
					} else if (halfRight > 0) {
						direction = new Element('img', {
							'src' : './img/half-right.png'
						});
					} else if (halfLeft > 0) {
						direction = new Element('img', {
							'src' : './img/half-left.png'
						});
					} else if (straight > 0) {
						direction = new Element('img', {
							'src' : './img/straight.png'
						});
					}

					numInstructions++;

					//add DOM elements
					var trElement = new Element('tr', {
						'class' : (numInstructions % 2 == 0) ? 'even' : 'odd',
						'data-layer' : mapLayer
					});
					table.appendChild(trElement);

					var tdElementImg = new Element('td');
					if (direction) {
						tdElementImg.appendChild(direction);
					}

					var tdElementText = new Element('td', {
						'class' : 'clickable routeInstructions',
						'id' : mapFeatureIds[2 * (numInstructions - 1) + 1]
					}).update(text);

					var tdElementDist = new Element('td', {
						'class' : 'clickable',
						'id' : mapFeatureIds[2 * (numInstructions - 1)]
					}).update(distArr[0] + ' ' + distArr[1]);

					trElement.appendChild(tdElementImg);
					trElement.appendChild(tdElementText);
					trElement.appendChild(tdElementDist);

					//mouseover for points and lines
					$(tdElementDist).mouseover(handleMouseOverDist);
					$(tdElementDist).mouseout(handleMouseOutDist);
					$(tdElementText).mouseover(handleMouseOverText);
					$(tdElementText).mouseout(handleMouseOutText);
				});
			}

			function handleMouseOverDist(e) {
				e.currentTarget.addClassName('active');
				var parent = $(e.currentTarget).parent().get(0);

				theInterface.emit('ui:emphElement', {
					id : e.currentTarget.getAttribute('id'),
					layer : parent.getAttribute('data-layer')
				});

			}

			function handleMouseOutDist(e) {
				e.currentTarget.removeClassName('active');
				var parent = $(e.currentTarget).parent().get(0);

				theInterface.emit('ui:deEmphElement', {
					id : e.currentTarget.getAttribute('id'),
					layer : parent.getAttribute('data-layer')
				});
			}

			function handleMouseOverText(e) {
				e.currentTarget.addClassName('active');
				var parent = $(e.currentTarget).parent().get(0);

				theInterface.emit('ui:emphElement', {
					id : e.currentTarget.getAttribute('id'),
					layer : parent.getAttribute('data-layer')
				});
			}

			function handleMouseOutText(e) {
				e.currentTarget.removeClassName('active');
				var parent = $(e.currentTarget).parent().get(0);

				theInterface.emit('ui:deEmphElement', {
					id : e.currentTarget.getAttribute('id'),
					layer : parent.getAttribute('data-layer')
				});
			}

		}

		function handleZoomToRouteClick() {
			theInterface.emit('ui:zoomToRoute');
		}

		function showRoutingError() {
			var el = $('#routeError');
			el.html(preferences.translate('noRouteAvailable'));
			// el.html(preferences.translate('calculatingRoute'));
			el.show();
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

		function debug() {
			theInterface.emit('ui:startDebug');
		}

		/* *********************************************************************
		 * CONSTRUCTOR
		 * *********************************************************************/

		function Ui() {
			loadDynamicData();

			$('#debug').click(debug);

			//switch views
			$('.fnct_switchTab').click(handleSwitchTabs);
			//open & close collapsibles
			$('.collapsibleHead').click(handleToggleCollapsibles);
			//hide & view sidebar
			$('#toggleSidebar').click(handleToggleSidebar);

			//waypoints
			$('.searchWaypoint').keyup(handleSearchWaypointInput);
			$('#addWaypoint').click(handleAddWaypointClick);
			$('#resetRoute').click(handleResetRoute);
			$('.moveUpWaypoint').click(handleMoveUpWaypointClick);
			$('.moveDownWaypoint').click(handleMoveDownWaypointClick);
			$('.removeWaypoint').click(handleRemoveWaypointClick);
			$('.searchAgainButton').click(handleSearchAgainWaypointClick);

			//route
			$('#zoomToRouteButton').click(handleZoomToRouteClick);

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

		Ui.prototype.emphElement = emphElement;
		Ui.prototype.deEmphElement = deEmphElement;

		Ui.prototype.searchWaypointChangeToSearchingState = searchWaypointChangeToSearchingState;
		Ui.prototype.updateSearchWaypointResultList = updateSearchWaypointResultList;
		Ui.prototype.showSearchWaypointError = showSearchWaypointError;
		Ui.prototype.setWaypointFeatureId = setWaypointFeatureId;
		Ui.prototype.getFeatureIdOfWaypoint = getFeatureIdOfWaypoint;
		Ui.prototype.getWaypiontIndexByFeatureId = getWaypiontIndexByFeatureId;
		Ui.prototype.setWaypointType = setWaypointType;
		Ui.prototype.addWaypointAfter = addWaypointAfter;
		Ui.prototype.addWaypointResultByRightclick = addWaypointResultByRightclick;
		Ui.prototype.setMoveDownButton = setMoveDownButton;
		Ui.prototype.setMoveUpButton = setMoveUpButton;
		Ui.prototype.showSearchingAtWaypoint = showSearchingAtWaypoint;

		Ui.prototype.searchAddressChangeToSearchingState = searchAddressChangeToSearchingState;
		Ui.prototype.updateSearchAddressResultList = updateSearchAddressResultList;
		Ui.prototype.showSearchAddressError = showSearchAddressError;

		Ui.prototype.setRouteIsPresent = setRouteIsPresent;
		Ui.prototype.searchPoiChangeToSearchingState = searchPoiChangeToSearchingState;
		Ui.prototype.updateSearchPoiResultList = updateSearchPoiResultList;
		Ui.prototype.showSearchPoiError = showSearchPoiError;
		Ui.prototype.showSearchPoiDistUnitError = showSearchPoiDistUnitError;

		Ui.prototype.getRoutePoints = getRoutePoints;
		Ui.prototype.updateRouteSummary = updateRouteSummary;
		Ui.prototype.startRouteCalculation = startRouteCalculation;
		Ui.prototype.endRouteCalculation = endRouteCalculation;
		Ui.prototype.updateRouteInstructions = updateRouteInstructions;
		Ui.prototype.showRoutingError = showRoutingError;

		Ui.prototype.showCurrentLocation = showCurrentLocation;
		Ui.prototype.stopGeolocation = stopGeolocation;

		theInterface = new Ui();

		return theInterface;
	}(window));

/* *********************************************************************
* ICONS
* *********************************************************************/
//icons for markers on map
Ui.markerIcons = {
	start : ['img/marker-start.png', 'img/marker-start-high.png'],
	via : ['img/marker-via.png', 'img/marker-via-high.png'],
	end : ['img/marker-end.png', 'img/marker-end-high.png'],
	unset : ['img/marker-poi.png', 'img/marker-poi-high.png']
};
//icons for POI markers on map
Ui.poiIcons = {
	poi_9pin : 'img/poi/9pin.png',
	poi_10pin : 'img/poi/10pin.png',
	poi_archery : 'img/poi/archeery.png',
	//poi_arts_center : 'img/poi/arts_center.png',
	poi_athletics : 'img/poi/athletics.png',
	poi_atm : 'img/poi/atm.png',
	//poi_attraction : 'img/poi/attraction.png',
	poi_australian_football : 'img/poi/australian_football.png',
	poi_bakery : 'img/poi/bakery.png',
	poi_bank : 'img/poi/bank.png',
	poi_baseball : 'img/poi/baseball.png',
	poi_basketball : 'img/poi/basketball.png',
	poi_beachvolleyball : 'img/poi/beachvolleyball.png',
	//poi_bicycle_parking : img/poi/bicycle_parking.png',
	poi_biergarten : 'img/poi/biergarten.png',
	poi_boules : 'img/poi/boules.png',
	poi_bowls : 'img/poi/bowls.png',
	poi_bureau_de_change : 'img/poi/bureau_de_change.png',
	poi_bus_station : 'img/poi/bus_station.png',
	poi_bus_stop : 'img/poi/bus_stop.png',
	poi_butcher : 'img/poi/butcher.png',
	poi_cafe : 'img/poi/cafe.png',
	//poi_camp_site : 'img/poi/camp_site.png',
	poi_canoe : 'img/poi/canoe.png',
	//poi_castle : 'img/poi/castle.png',
	poi_chess : 'img/poi/chess.png',
	//poi_church : 'img/poi/church.png',
	poi_cinema : 'img/poi/cinema.png',
	poi_climbing : 'img/poi/climbing.png',
	poi_college : 'img/poi/college.png',
	poi_convenience : 'img/poi/convenience.png',
	poi_courthouse : 'img/poi/courthouse.png',
	poi_cricket : 'img/poi/cricket.png',
	poi_cricket_nets : 'img/poi/cricket_nets.png',
	poi_croquet : 'img/poi/croquet.png',
	poi_cycling : 'img/poi/cycling.png',
	poi_diving : 'img/poi/diving.png',
	poi_dog_racing : 'img/poi/dog_racing.png',
	poi_equestrian : 'img/poi/equestrian.png',
	poi_fast_food : 'img/poi/fast_food.png',
	//poi_fire_station : 'img/poi/fire_station.png',
	poi_fishing : 'img/poi/fishing.png',
	poi_football : 'img/poi/football.png',
	poi_fuel : 'img/poi/fuel.png',
	poi_garden : 'img/poi/garden.png',
	poi_golf : 'img/poi/golf.png',
	poi_golf_course : 'img/poi/golf.png',
	poi_guest_house : 'img/poi/guest_house.png',
	poi_gymnastics : 'img/poi/gymnastics.png',
	poi_hockey : 'img/poi/hockey.png',
	poi_horse_racing : 'img/poi/horse_racing.png',
	poi_hospital : 'img/poi/hospital.png',
	poi_hostel : 'img/poi/hostel.png',
	poi_hotel : 'img/poi/hotel.png',
	poi_ice_rink : 'img/poi/ice_rink.png',
	poi_information : 'img/poi/information.png',
	poi_kiosk : 'img/poi/kiosk.png',
	poi_korfball : 'img/poi/korfball.png',
	poi_library : 'img/poi/library.png',
	poi_marina : 'img/poi/marina.png',
	//poi_memorial : 'img/poi/memorial.png',
	poi_miniature_golf : 'img/poi/miniature_golf.png',
	//poi_monument : 'img/poi/monument.png',
	poi_motel : 'img/poi/motel.png',
	poi_motor : 'img/poi/motor.png',
	//poi_museum : 'img/poi/museum.png',
	poi_nature_reserve : 'img/poi/nature_reserve.png',
	poi_nightclub : 'img/poi/nightclub.png',
	poi_orienteering : 'img/poi/orienteering.png',
	poi_paddle_tennis : 'img/poi/tennis.png',
	poi_paragliding : 'img/poi/paragliding.png',
	poi_park : 'img/poi/park.png',
	poi_parking : 'img/poi/parking.png',
	poi_pelota : 'img/poi/pelota.png',
	poi_pharmacy : 'img/poi/pharmacy.png',
	poi_pitch : 'img/poi/pitch.png',
	poi_place_of_worship : 'img/poi/church.png',
	poi_playground : 'img/poi/playground.png',
	poi_police : 'img/poi/police.png',
	poi_post_box : 'img/poi/post_box.png',
	poi_post_office : 'img/poi/post_office.png',
	poi_pub : 'img/poi/pub.png',
	poi_public_building : 'img/poi/public_building.png',
	poi_raquet : 'img/poi/racquet.png',
	poi_railway_station : 'img/poi/railway_station.png',
	//poi_recreation : 'img/poi/recreation.png',
	//poi_recycling : 'img/poi/recycling.png',
	poi_restaurant : 'img/poi/restaurant.png',
	poi_rowing : 'img/poi/rowing.png',
	poi_rugby : 'img/poi/rugby.png',
	poi_school : 'img/poi/school.png',
	//poi_shelter : 'img/poi/shelter.png',
	poi_shooting : 'img/poi/shooting.png',
	poi_skateboard : 'img/poi/skateboard.png',
	poi_skating : 'img/poi/skating.png',
	poi_skiing : 'img/poi/skiing.png',
	poi_slipway : 'img/poi/slipway.png',
	poi_soccer : 'img/poi/soccer.png',
	poi_sports_center : 'img/poi/sports_centre.png',
	poi_squash : 'img/poi/squash.png',
	poi_stadium : 'img/poi/stadium.png',
	poi_subway_entrance : 'img/poi/subway_entrance.png',
	poi_supermarket : 'img/poi/supermarket.png',
	poi_swimming : 'img/poi/swimming.png',
	poi_table_tennis : 'img/poi/table_tennis.png',
	poi_taxi : 'img/poi/taxi.png',
	poi_team_handball : 'img/poi/team_handball.png',
	poi_telephone : 'img/poi/telephone.png',
	poi_tennis : 'img/poi/tennis.png',
	poi_theatre : 'img/poi/theatre.png',
	poi_toilets : 'img/poi/toilets.png',
	poi_townhall : 'img/poi/townhall.png',
	poi_track : 'img/poi/track.png',
	poi_tram_stop : 'img/poi/tram_stop.png',
	poi_university : 'img/poi/university.png',
	poi_viewpoint : 'img/poi/viewpoint.png',
	poi_volleyball : 'img/poi/volleyball.png',
	poi_water_park : 'img/poi/water_park.png',
	//default icon
	poi_default : 'img/poi/building_number.png'
};
