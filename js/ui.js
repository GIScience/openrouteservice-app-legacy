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
		}

		/**
		 * de-highlight the element
		 */
		function deEmphElement(elementId) {
			$('#' + elementId).get(0).removeClassName('highlight');
		}

		/**
		 * highlight the mouseover element and emphasize the corresponding marker
		 */
		function handleMouseOverElement(e) {
			e.currentTarget.addClassName('highlight');
			theInterface.emit('ui:emphElement', e.currentTarget.id);
		}

		/**
		 * de-highlight the mouseover element and emphasize the corresponding marker
		 */
		function handleMouseOutElement(e) {
			e.currentTarget.removeClassName('highlight');
			theInterface.emit('ui:deEmphElement', e.currentTarget.id);
		}

		/* *********************************************************************
		 * WAYPOINTS
		 * *********************************************************************/

		function handleSearchWaypointInput(e) {
			var waypointElement = $(e.currentTarget).parent().parent();

			//index of the waypoint (0st, 1st 2nd,...)
			var index = waypointElement.attr('id');
			index = index.substring(index.lastIndexOf('_') + 3, index.length);

			clearTimeout(typingTimerWaypoints[index]);
			if (e.keyIdentifier != 'Shift' && e.currentTarget.value.length != 0) {
				typingTimerWaypoints[index] = setTimeout(function() {
					//empty search results
					var resultContainer = $('#searchWaypointResults_' + index).get(0);
					while (resultContainer && resultContainer.hasChildNodes()) {
						resultContainer.removeChild(resultContainer.lastChild);
					}

					//request new results
					theInterface.emit('ui:searchWaypointRequest', {
						query : e.currentTarget.value,
						wpIndex : index
					});
				}, DONE_TYPING_INTERVAL);
			}
		}

		function searchWaypointChangeToSearchingState(changeToSearching, wpIndex) {
			var rootElement = $('#waypoint_No' + wpIndex);
			var children = rootElement.children();
			var inputElement = (children[children.length-1]).childNodes[1];

			if (changeToSearching) {
				$(inputElement).addClass('searching');
				$('#searchWaypointError_' + wpIndex).hide();
			} else {
				inputElement.removeClassName('searching');
			}
		}

		function updateSearchWaypointResultList(request, listOfPoints, wpIndex) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var results = request.responseXML ? request.responseXML : util.parseStringToDOM(request.responseText);

			//insert address information to page
			var allAddress;
			var resultContainer = $('#searchWaypointResults_' + wpIndex);
			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'GeocodeResponseList');
			$A(geocodeResponseList).each(function(geocodeResponse) {
				allAddress = $A(util.getElementsByTagNameNS(geocodeResponse, namespaces.xls, 'Address'));
				for (var i = 0; i < allAddress.length; i++) {
					//listOfPoitnts[i] == null if result is not in Europe
					if (listOfPoints[i]) {
						var address = allAddress[i];
						address = util.parseAddress(address);
						address.setAttribute('id', 'address_' + wpIndex + '_' + i);
						resultContainer.append(address);
					}
				}
			});

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
			var errorContainer = $('#searchWaypointError_' + wpIndex);
			errorContainer.update(preferences.translate("searchError"));
			errorContainer.show();
		}

		/**
		 * when the user clicks on a waypoint search result, use it as waypoint
		 */
		function handleSearchWaypointResultClick(e) {
			//index of waypoint
			var index = e.currentTarget.id;
			var resultIndex = index;
			index = index.substring(index.indexOf('_') + 1, index.indexOf('_') + 2);
			resultIndex = resultIndex.substring(resultIndex.lastIndexOf('_') + 1);

			var rootElement = $('#waypoint_No' + index);
			var children = rootElement.children();

			e.currentTarget.id = 'waypoint_' + index;

			//show waypoint result and searchAgain button
			children[3].show();
			var waypointResultElement = children[4];
			waypointResultElement.insert(e.currentTarget);
			waypointResultElement.show();

			//hide input field with search result list
			children[5].hide();

			//remove search markers and add a new waypoint marker
			theInterface.emit('ui:waypointResultClick', {
				wpIndex : index,
				resultIndex : resultIndex
			});
		}

		function handleMoveUpWaypointClick(e) {
			//TODO implement
		}

		function handleMoveDownWaypointClick(e) {
			//TODO implement
		}

		function handleAddWaypointClick(e) {
			//id of prior to last waypoint:
			var waypointId = $(e.currentTarget).prev().attr('id');
			var oldIndex = parseInt(waypointId.substring(waypointId.indexOf('_') + 3));
			addWaypointAfter(oldIndex, oldIndex + 1);

			theInterface.emit('ui:selectWaypointType', oldIndex);
		}

		/**
		 *add a new waypoint element after given waypoint index
		 * @idx (int) index of the predecessor waypoint
		 */
		function addWaypointAfter(idx, numWaypoints) {
			//for the current element, show the move down button (will later be at least the next to last one)
			var previous = $('#waypoint_No' + idx);
			previous.children()[2].show();
			
			//'move' all successor waypoints down from idx+1 to numWaypoints
			for (var i = idx + 1; i < numWaypoints; i++) {
				var wpElement = $('#waypoint_No' + i);
				if (i < numWaypoints-1) {
					//this is not the last waypoint, show move down button
					wpElement.children()[2].show();
				}
				var wpId = wpElement.attr('id');
				var newIndex = wpId.substring(0, wpId.indexOf('_') + 3) + (i + 1);
				wpElement.attr('id', newIndex)

				$('#searchWaypointError_' + i).get(0).setAttribute('id', 'searchWaypointError_' + (i + 1));
				$('#zoomToWaypointResults_' + i).get(0).setAttribute('id', 'zoomToWaypointResults_' + (i + 1));
				$('#searchWaypointResults_' + i).get(0).setAttribute('id', 'searchWaypointResults_' + (i + 1));
				var el = $('#waypoint_' + i).get(0);
				if (el) {
					el.setAttribute('id', 'waypoint_' + (i+1));
				}
			}

			//generate new id
			var newIndex = parseInt(idx) + 1;
			var predecessorElement = $('#waypoint_No' + idx);
			var waypointId = predecessorElement.attr('id');
			waypointId = waypointId.replace(idx, newIndex);

			//generate DOM elements
			var newWp = $('#waypoint_Draft').clone();
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

			//we need to adapt some more IDs...
			var el = $('.searchWaypointError_Draft').get(1);
			el.setAttribute('id', 'searchWaypointError_' + newIndex);
			el.removeClassName('searchWaypointError_Draft');
			el = $('.zoomToWaypointResults_Draft').get(1);
			el.setAttribute('id', 'zoomToWaypointResults_' + newIndex);
			el.removeClassName('zoomToWaypointResults_Draft');
			el = $('.searchWaypointResults_Draft').get(1);
			el.setAttribute('id', 'searchWaypointResults_' + newIndex);
			el.removeClassName('searchWaypointResults_Draft');

			//add event handling
			$('.searchWaypoint').keyup(handleSearchWaypointInput);

			theInterface.emit('ui:addWaypoint');
		}

		function addWaypointResultByRightclick(request, typeOfWaypoint, index, numWaypoints) {
			if (typeOfWaypoint == Waypoint.type.VIA) {
				addWaypointAfter(index, numWaypoints);
				//the waypoint index where we want to place th new via point is acutally one larger.
				index++;
			}

			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var results = request.responseXML ? request.responseXML : util.parseStringToDOM(request.responseText);
			var addressResult = util.getElementsByTagNameNS(results, namespaces.xls, 'Address');
			addressResult = addressResult ? addressResult[0] : null;
			addressResult = util.parseAddress(addressResult);
			$(addressResult).attr('id', 'waypoint_' + index);

			//insert information as waypoint
			var rootElement = $('#waypoint_No' + index);
			var children = rootElement.children();

			//show waypoint result and searchAgain button
			children[3].show();
			var waypointResultElement = children[4];
			while (waypointResultElement.hasChildNodes()) {
				waypointResultElement.removeChild(waypointResultElement.lastChild);
			}
			waypointResultElement.appendChild(addressResult);
			waypointResultElement.show();

			//hide input field with search result list
			children[5].hide();

			//event handling
			$('.address').mouseover(handleMouseOverElement);
			$('.address').mouseout(handleMouseOutElement);

			theInterface.emit('ui:selectWaypointType', index);
		}

		function handleRemoveWaypointClick(e) {
			//TODO implement
		}

		function handleSearchAgainWaypointClick(e) {
			//TODO implement
		}

		function setWaypointType(wpIndex, type) {
			var el = $('#waypoint_No' + wpIndex);
			el.removeClass('unset');
			el.removeClass('start');
			el.removeClass('via');
			el.removeClass('end');
			el.addClass(type);
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

					theInterface.emit('ui:searchAddressRequest', e.currentTarget.value);
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

		function updateSearchAddressResultList(request, listOfPoints) {
			//IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
			var results = request.responseXML ? request.responseXML : util.parseStringToDOM(request.responseText);

			//insert address information to page
			var allAddress;
			var resultContainer = $('#fnct_searchAddressResults');
			var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'GeocodeResponseList');
			$A(geocodeResponseList).each(function(geocodeResponse) {
				allAddress = $A(util.getElementsByTagNameNS(geocodeResponse, namespaces.xls, 'Address'));
				for (var i = 0; i < allAddress.length; i++) {
					//listOfPoitnts[i] == null if result is not in Europe
					if (listOfPoints[i]) {
						var address = allAddress[i];
						address = util.parseAddress(address);
						address.setAttribute('id', 'address_' + i);

						var useAsWaypointButton = new Element('span', {
							'class' : 'clickable useAsWaypoint',
							'title' : 'use as waypoint',
							'id' : 'address_' + i
						});
						address.insert(useAsWaypointButton);
						resultContainer.append(address);
					}
				}
			});

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
					var numResults = $('#zoomToPoiResults').get(0);
					while (numResults.hasChildNodes()) {
						numResults.removeChild(numResults.lastChild);
					}

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

		// /**
		// * highlight the mouseover search result and emphasize the corresponding marker
		// */
		// function handleSearchPoiResultEm(e) {
		// e.currentTarget.addClassName('highlight');
		// theInterface.emit('ui:emphasizeSearchPoiMarker', e.currentTarget.id);
		// }

		// /**
		// * un-highlight the mouseout search result and deemphasize the corresponding marker
		// */
		// function handleSearchPoiResultDeEm(e) {
		// e.currentTarget.removeClassName('highlight');
		// theInterface.emit('ui:deEmphasizeSearchPoiMarker', e.currentTarget.id);
		// }

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

			//waypoints
			$('.searchWaypoint').keyup(handleSearchWaypointInput);
			$('#addWaypoint').click(handleAddWaypointClick);

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
		Ui.prototype.setWaypointType = setWaypointType;
		Ui.prototype.addWaypointResultByRightclick = addWaypointResultByRightclick;

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
Ui.markerIcons = {
	start : ['img/marker-start.png', 'img/marker-start-high.png'],
	via : ['img/marker-via.png', 'img/marker-via-high.png'],
	end : ['img/marker-end.png', 'img/marker-end-high.png'],
	result : ['img/marker-poi.png', 'img/marker-poi-high.png']
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
