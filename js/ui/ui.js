var Ui = (function(w) {
    'use strict';
    var $ = w.jQuery,
        //Ui interface
        theInterface,
        //preferences for language selection
        preferences = w.Preferences,
        //functionality of ORS placed in separate tabs
        orsTabs = ['route', 'search', 'geolocation'],
        //search POI options: searchNearRoute, maxDist to route, distance Unit for maxDist, search query
        searchPoiAtts = ['false', '100', 'm', ''],
        //is a route available?
        routeIsPresent = false,
        //timeout to wait before sending a request after the user finished typing
        DONE_TYPING_INTERVAL = 1200,
        //timers for user input (search)
        typingTimerSearchAddress, typingTimerSearchPoi, typingTimerSearchPoiDistance,
        //timers for user input (waypoints)
        timer0, timer1, typingTimerWaypoints = [timer0, timer1];
    /* *********************************************************************
     * GENERAL
     * *********************************************************************/
    /**
     * user clicks on e.g. routing tab to view routing functionality
     * @param e: the event
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
     * @param e: the event
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
     * @param e: the event
     */
    function handleToggleSidebar(e) {
        var side = document.getElementById('sidebar');
        //when calling this for the first time on page startup, style.display attribute will be empty which corresponds to the default case of "visible"
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
    /**
     * if it is the user's first visit to ORS show a popup with information about the settings (version, language,...)
     */
    function showNewToOrsPopup() {
        var label = new Element('label');
        label.insert(preferences.translate('infoTextVersions'));
        $('#newToOrs').append(label);
        $('#newToOrs').show();
    }

    function showServiceTimeoutPopup() {
        var label = new Element('label');
        label.insert(preferences.translate('serverError'));
        $('#serviceTimeout').append(label);
        $('#serviceTimeout').show();
    }
    /* *********************************************************************
     * ALL MARKER ELEMENTS
     * *********************************************************************/
    /**
     * highlight the element
     * @param elementId: id of the element to highlight
     */
    function emphElement(elementId) {
        var element = $('#' + elementId);
        //if parent has class even or odd (== belongs to route instructions), only use class active, no highlight!
        var parentClass = element.parent().attr('class');
        var isRouteInstruction = false;
        if (parentClass) {
            isRouteInstruction = (parentClass.indexOf('directions-container') >= 0);
        }
        if (isRouteInstruction) {
            element.get(0).addClassName('active');
        }
    }
    /**
     * de-highlight the element
     * @param elementId: id of the element to deemphasize
     */
    function deEmphElement(elementId) {
        $('#' + elementId).get(0).removeClassName('active');
    }
    /**
     * highlight the mouseover element and emphasize the corresponding marker
     * @param e: the event
     */
    function handleMouseOverElement(e) {
        theInterface.emit('ui:emphElement', {
            id: e.currentTarget.getAttribute('id'),
            layer: e.currentTarget.getAttribute('data-layer')
        });
    }
    /**
     * de-highlight the mouseover element and emphasize the corresponding marker
     * @param e: the event
     */
    function handleMouseOutElement(e) {
        theInterface.emit('ui:deEmphElement', {
            id: e.currentTarget.getAttribute('id'),
            layer: e.currentTarget.getAttribute('data-layer')
        });
    }
    /* *********************************************************************
     * WAYPOINTS
     * *********************************************************************/
    /**
     * the user typed input for the waypoint search. forward the input to start a query
     * @param e: the event
     */
    function handleSearchWaypointInput(e) {
        console.log(e)
        var waypointElement = $(e.currentTarget).parent().parent();
        //index of the waypoint (0st, 1st 2nd,...)
        var index = waypointElement.attr('id');
        clearTimeout(typingTimerWaypoints[index]);
        if (e.keyIdentifier != 'Shift' && e.currentTarget.value.length != 0) {
            var input = e.currentTarget.value;
            waypointElement.attr('data-searchInput', input);
            typingTimerWaypoints[index] = setTimeout(function() {
                //empty search results
                var resultContainer = waypointElement.get(0).querySelector('.searchWaypointResults');
                while (resultContainer && resultContainer.hasChildNodes()) {
                    resultContainer.removeChild(resultContainer.lastChild);
                }
                //request new results
                theInterface.emit('ui:searchWaypointRequest', {
                    query: input,
                    wpIndex: index,
                    searchIds: waypointElement.get(0).getAttribute('data-search')
                });
            }, DONE_TYPING_INTERVAL);
        }
    }
    /**
     * hides or shows a search spinner while searching for the wayoint's address
     * @param changeToSearching: true, if the spinner should be shown; false otherwise
     * @param wpIndex: index of the waypoint where to show the spinner
     */
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
    /**
     * shows the results of the waypoint search on the Ui building a list of result entries that can be selected as waypoint
     * @param results: response from the service in XML format
     * @param listOfFeatures: list of OL feature IDs of the search result markers
     * @param layername: map layer these features are located on
     * @param wpIndex: index of the waypoint the search was performed for
     */
    function updateSearchWaypointResultList(results, listOfFeatures, layername, wpIndex) {
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
                    var lonLat = listOfFeatures[i]._latlng;
                    allIds += listOfFeatures[i]._leaflet_id + ' ';
                    var xmlAddress = allAddress[i];
                    var address = util.parseAddress(xmlAddress);
                    var shortText = util.parseAddressShort(xmlAddress);
                    address.setAttribute('id', listOfFeatures[i]._leaflet_id);
                    address.setAttribute('data-position', lonLat.lat + ' ' + lonLat.lng);
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
        // $('.address').mouseover(handleMouseOverElement);
        // $('.address').mouseout(handleMouseOutElement);
        // $('.address').click(handleSearchWaypointResultClick);
        //if one result is found then select it automatically
        if (listOfFeatures.length == 1) {
            var featureID = listOfFeatures[0]._leaflet_id;
            $(".address").click(function(event, a) {
                // for a trigger like below a refers to featureID
                handleSearchWaypointResultClickHelper(event, a);
            }).trigger("click", featureID);
        } else {
            //event handling
            $('.address').mouseover(handleMouseOverElement);
            $('.address').mouseout(handleMouseOutElement);
            $('.address').click(handleSearchWaypointResultClickHelper);
        }
    }
    /**
     * views an error message when problems occured during geocoding
     * @param wpIndex: index of the waypoint to show the message for
     */
    function showSearchWaypointError(wpIndex) {
        var rootElement = $('#' + wpIndex).get(0);
        var errorContainer = rootElement.querySelector('.searchWaypointError');
        errorContainer.update(preferences.translate("searchError"));
        errorContainer.show();
    }
    /**
     * is needed to check whether one result is returned after address is inserted
     * if featureID is passed to the .trigger event compare it to trigger event target id
     * @param e: click event
     * @param featureID: id of address, is optional as it is only passed when one result is returned
     */
    function handleSearchWaypointResultClickHelper(e, featureID) {
        if (featureID !== undefined) {
            if (featureID == e.target.id) {
                handleSearchWaypointResultClick(e);
            }
        } else {
            handleSearchWaypointResultClick(e);
        }
    }
    /**
     * when the user clicks on a waypoint search result, it is used as waypoint. The search results vanish and only the selected address is shown.
     * @param e: the event
     */
    function handleSearchWaypointResultClick(e) {
        var rootElement = $(e.currentTarget).parent().parent().parent().parent();
        // var selectedDiv = $(e.currentTarget).parent().parent().parent().parent()[0];
        var index = rootElement.attr('id');
        rootElement.removeClass('unset');
        rootElement = rootElement.get(0);
        rootElement.querySelector('.searchAgainButton').show();
        var component = rootElement.querySelector('.guiComponent');
        if (!component.hasClassName('routeOptions')) {
            component.hide();
            var waypointResultElement = rootElement.querySelector('.waypointResult');
            //remove older entries:
            while (waypointResultElement.firstChild) {
                waypointResultElement.removeChild(waypointResultElement.firstChild);
            }
            waypointResultElement.insert(e.currentTarget);
            waypointResultElement.show();
            //remove search markers and add a new waypoint marker
            theInterface.emit('ui:waypointResultClick', {
                wpIndex: index,
                featureId: e.currentTarget.id,
                searchIds: rootElement.getAttribute('data-search')
            });
        } else {
            handleSearchAgainWaypointClick({
                currentTarget: e.currentTarget.up('.waypointResult')
            });
        }
        // make input field not selectable
        // var thisDiv = selectedDiv.className
        // var myDiv = thisDiv.replace(/ /g,".");
        // $('.'+myDiv).css('pointer-events', 'none');
        // $('.'+myDiv).css('cursor', 'auto');
        // $('.removeWaypoint').css('pointer-events', 'auto');
        // $('.moveUpWaypoint').css('pointer-events', 'auto');
        // $('.moveDownWaypoint').css('pointer-events', 'auto');
        // $('.searchAgainButton').css('pointer-events', 'auto');
        //$('.address').unbind( "click", handleSearchWaypointResultClick );
    }
    /**
     * Sets attributes of the selected waypoint.
     * @param wpIndex: index of the waypoint to set the attributes for
     * @param featureId: ID of the OL feature that represents the waypoint location
     * @param position: position of the feature as string
     * @param layer: map layer the feature is located on
     */
    function setWaypointFeatureId(wpIndex, featureId, position, layer) {
        var rootElement = $('#' + wpIndex).get(0);
        var address = rootElement.querySelector('.address');
        if (address) {
            address.id = featureId;
            address.setAttribute('data-layer', layer);
            address.setAttribute('data-position', position);
        }
    }
    /**
     * retrieves the OL feature ID of the given waypoint
     * @param wpIndex: index of the waypoint to get the feature ID from
     * @return: the ID of the OL feature
     */
    function getFeatureIdOfWaypoint(wpIndex) {
        var rootElement = $('#' + wpIndex).get(0);
        var address = rootElement.querySelector('.address');
        var id = address ? address.id : null;
        return id;
    }
    /**
     * retrieves the index of the waypoint based on the given OL feature ID
     * @param featureId: the ID of the OL feature
     * @return: the index of the wayoint; null if the waypoint does not exist
     */
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
    /**
     * The user clicked on the button to reorder waypoints inverted; internal attributes are adapted.
     */
    function handleReorderWaypoints() {
        var j = 1;
        var i = $('.waypoint').length - 1;
        // last waypoint is inserted before first and j is incremented
        // so in the second run last waypoint is inserted before second item etc.
        // this is repeated as long as j is smaller i
        while (j < i) {
            var waypointElement = $('.waypoint').last();
            var swapElement = $('.waypoint').eq(j);
            waypointElement.insertBefore(swapElement);
            // internal ids are updated
            $('.waypoint').each(function(index) {
                if ($(this).attr('id') != 'Draft') {
                    $(this).attr('id', index - 1);
                }
            });
            j++;
        }
        // create object with indices
        var indices = {};
        $('.waypoint').each(function(index) {
            if ($(this).attr('id') != 'Draft') {
                indices[index] = index - 1;
            }
        });
        //the waypoint which has been moved up is the first waypoint: hide move up button
        $('#' + 0 + '> .moveUpWaypoint').hide();
        $('#' + 0 + '> .moveDownWaypoint').show();
        //the waypoint which has been moved down is the last waypoint: hide the move down button
        var lastWp = $('.waypoint').length - 2;
        $('#' + lastWp + '> .moveUpWaypoint').show();
        $('#' + lastWp + '> .moveDownWaypoint').hide();
        //adapt marker-IDs, decide about wpType
        theInterface.emit('ui:movedWaypoints', indices);
        theInterface.emit('ui:routingParamsChanged');
    }
    /**
     * The user clicked on the button to move the waypoint up in the list of waypoints for the route calculation. The waypoint element is moved upwards; internal attributes are adapted.
     * @param e: the event
     */
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
        if (currentIndex === 0) {
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
            $(previousElement.get(0).querySelector('.moveUpWaypoint')).show();
            $(previousElement.get(0).querySelector('.moveDownWaypoint')).hide();
        } else {
            //show both
            $(previousElement.get(0).querySelector('.moveUpWaypoint')).show();
            $(previousElement.get(0).querySelector('.moveDownWaypoint')).show();
        }
        //adapt marker-IDs, decide about wpType
        theInterface.emit('ui:movedWaypoints', {
            id1: currentIndex,
            id2: succIndex
        });
        theInterface.emit('ui:routingParamsChanged');
    }
    /**
     * The user clicked on the button to move down the waypoint in the list of waypoints for the route calculation. The waypoint element is moved downwards; internal attributes are adapted.
     * @param e: the event
     */
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
            id1: currentIndex,
            id2: prevIndex
        });
        theInterface.emit('ui:routingParamsChanged');
    }
    /**
     * The user clicks on the button to add a waypoint. A new empty waypoint is generated.
     *  @param e: the event
     */
    function handleAddWaypointClick(e) {
        //id of prior to last waypoint:
        var waypointId = $(e.currentTarget).prev().attr('id');
        var oldIndex = parseInt(waypointId);
        addWaypointAfter(oldIndex, oldIndex + 1);
        theInterface.emit('ui:selectWaypointType', oldIndex);
        var numwp = $('.waypoint').length - 1;
    }
    /**
     *adds a new waypoint element after given waypoint index
     * @param idx: (int) index of the predecessor waypoint
     * @param numWaypoints: (int) number of waypoints BEFORE inserting the new one
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
        theInterface.emit('ui:addWaypoint', newIndex);
    }
    /**
     * set a waypoint with the service response after the user requested to set a waypoint by clicking on the map (right click).
     * @param resultsOrLatlon: the service response in XML format or a latlon position
     * @param typeOfWaypoint: one of START, VIA or END
     * @param index: index of the waypoint
     * @return: the index of the wayoint
     */
    function addWaypointResultByRightclick(typeOfWaypoint, index, results, latlon) {
        var numWaypoints = $('.waypoint').length - 1;
        while (index >= numWaypoints) {
            addWaypointAfter(numWaypoints - 1);
            numWaypoints++;
        }
        //checks whether latlon is passed in first call
        //for geocoding shortaddress is updated in second call
        var address, shortAddress, stopover, addressResult, lat, lon;
        if (latlon === true) {
            address = util.parseLatlon(results);
            shortAddress = results.toString();
            stopover = $(".directions-main").find("[waypoint-id=" + index + "]");
            stopover.html(shortAddress);
        } else {
            addressResult = util.getElementsByTagNameNS(results, namespaces.xls, 'Address');
            addressResult = addressResult ? addressResult[0] : null;
            address = util.parseAddress(addressResult);
            shortAddress = util.parseAddressShort(addressResult);
            //update stopover info from latlon to address
            stopover = $(".directions-main").find("[waypoint-id=" + index + "]");
            stopover.html(shortAddress);
        }
        //insert information as waypoint
        var rootElement = $('#' + index);
        rootElement.removeClass('unset');
        address.setAttribute('data-shortAddress', shortAddress);
        var children = rootElement.children();
        //show waypoint result and searchAgain button
        //children[3].show();
        var waypointResultElement = children[4];
        while (waypointResultElement.hasChildNodes()) {
            waypointResultElement.removeChild(waypointResultElement.lastChild);
        }
        waypointResultElement.appendChild(address);
        waypointResultElement.show();
        //hide input field with search result list
        children[5].hide();
        //remove the search result markers
        invalidateWaypointSearch(index);
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
    /**
     * When the user added a waypoint using the standard waypoint search and then e.g. moves the waypoint feature on the map, former search results must be invalidated because they do not match the new position.
     * @param wpIndex: index of the waypoint
     */
    function invalidateWaypointSearch(wpIndex) {
        var wpElement = $('#' + wpIndex);
        if (wpElement) {
            wpElement.removeAttr('data-search');
        }
    }
    /**
     * The user clicks on the button to remove the waypoint for the route calculation. The waypoint element is deleted; internal attributes are adapted.
     * @param e: the event
     */
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
            var wpElement = $(e.currentTarget).parent();
            var wpIndex = wpElement.attr('id');
            //delete waypoint
            wpElement.remove();
            //generate an empty waypoint
            var draftWp = $('#Draft');
            var newWp = draftWp.clone();
            newWp.attr('id', wpIndex);
            if (wpIndex > 0) {
                newWp.insertAfter($('#' + (wpIndex - 1)));
            } else {
                newWp.insertAfter(draftWp);
            }
            newWp.show();
            //decide which buttons to show
            var buttons = newWp.children();
            //show remove waypoint
            buttons[0].show();
            if (wpIndex == 1) {
                //show only move down button
                buttons[2].hide();
                buttons[1].show();
            } else if (wpIndex == 0) {
                //show only move up button
                buttons[1].hide();
                buttons[2].show();
            }
            //add event handling
            newWp = newWp.get(0);
            newWp.querySelector('.searchWaypoint').addEventListener('keyup', handleSearchWaypointInput);
            newWp.querySelector('.moveUpWaypoint').addEventListener('click', handleMoveUpWaypointClick);
            newWp.querySelector('.moveDownWaypoint').addEventListener('click', handleMoveDownWaypointClick);
            newWp.querySelector('.removeWaypoint').addEventListener('click', handleRemoveWaypointClick);
            newWp.querySelector('.searchAgainButton').addEventListener('click', handleSearchAgainWaypointClick);
        }
        theInterface.emit('ui:removeWaypoint', {
            wpIndex: currentId,
            featureId: featureId
        });
    }
    /**
     *shows or hides the "move waypoint down" button
     * @param wpIndex: index of the waypoint
     * @param show: if true, the button becomes visible; invisible otherwise
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
     *shows or hides the "move waypoint up" button
     * @param wpIndex: index of the waypoint
     * @param show: if true, the button becomes visible; invisible otherwise
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
    /**
     * The user clicks on the search again button to re-view the list of search results for the selected waypoint. Search results are shown, displaying map features is triggered.
     * @param e: the event
     */
    function handleSearchAgainWaypointClick(e) {
        var wpElement = $(e.currentTarget).parent();
        // make input field selectable
        //var selectedDiv = $(e.currentTarget).parent()[0];
        //var thisDiv = selectedDiv.className
        //var myDiv = thisDiv.replace(/ /g,".");
        //$('.'+myDiv).css('cursor', 'default');
        //$('.'+myDiv).css('pointer-events', 'auto');
        var index = wpElement.attr('id');
        var addrElement = wpElement.get(0).querySelector('.address');
        var featureId = addrElement.getAttribute('id');
        var layer = addrElement.getAttribute('data-layer');
        var resultComponent = wpElement.get(0).querySelector('.waypointResult');
        $(resultComponent).hide();
        var searchComponent = wpElement.get(0).querySelector('.guiComponent');
        $(searchComponent).show();
        var searchResults = wpElement.attr('data-search');
        if (searchResults) {
            //this waypoint was created by a search input. Only then it is useful to view previous search results
            //therefore we have to re-calculate the search
            //index of the waypoint (0st, 1st 2nd,...)
            var input = wpElement.attr('data-searchInput');
            //empty search results
            invalidateWaypointSearch(index);
            var resultContainer = wpElement.get(0).querySelector('.searchWaypointResults');
            while (resultContainer && resultContainer.hasChildNodes()) {
                resultContainer.removeChild(resultContainer.lastChild);
            }
            //request new results
            theInterface.emit('ui:searchWaypointRequest', {
                query: input,
                wpIndex: index,
                searchIds: null
            });
        } else {
            resultComponent.removeChild(addrElement);
            var responses = searchComponent.querySelector('.responseContainer');
            if (responses) {
                $(responses).hide();
            }
        }
        //remove old waypoint marker
        theInterface.emit('ui:searchAgainWaypoint', {
            waypointFeature: featureId,
            waypointLayer: layer,
            wpIndex: index
        });
    }
    /**
     * assigns the waypoint the given type
     * @param wpIndex: index of the waypoint
     * @param type: type of the wayoint, one of START, VIA, END or UNSET
     */
    function setWaypointType(wpIndex, type) {
        var el = $('#' + wpIndex);
        el.removeClass('unset');
        el.removeClass('start');
        el.removeClass('via');
        el.removeClass('end');
        el.addClass(type);
    }
    /**
     * The whole route is removed, waypoints are emptied or deleted (if more than two exist)
     */
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
            newWp = newWp.get(0);
            newWp.querySelector('.searchWaypoint').addEventListener('keyup', handleSearchWaypointInput);
            newWp.querySelector('.moveUpWaypoint').addEventListener('click', handleMoveUpWaypointClick);
            newWp.querySelector('.moveDownWaypoint').addEventListener('click', handleMoveDownWaypointClick);
            newWp.querySelector('.removeWaypoint').addEventListener('click', handleRemoveWaypointClick);
            newWp.querySelector('.searchAgainButton').addEventListener('click', handleSearchAgainWaypointClick);
        }
    }
    /**
     * shows or hides a spinner during waypoint address calculation
     * @param wpIndex: index of the waypoint
     * @param showSearching: if true, the spinner is shown; hidden otherwise.
     */
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
    /* *********************************************************************
     * GEOLOCATION
     * *********************************************************************/
    /**
     * triggers the geolocation request to retrieve the uer's current location
     * @param e: the event
     */
    function handleGeolocationClick(e) {
        theInterface.emit('ui:geolocationRequest');
    }
    /**
     * processes the geolocation service responses and shows the user's current location as address (and marker on map)
     * @param request: the service response
     * @param featureId: ID of the map feature representing the current location
     * @param layername: map layer name that contains the feature
     * @param point: coordinate position of the feature
     */
    function showCurrentLocation(results, featureId, layername, point) {
        //IE doesn't know responseXML, it can only provide text that has to be parsed to XML...
        //var results = request.responseXML ? request.responseXML : util.parseStringToDOM(request.responseText);
        var resultContainer = $('#geolocationResult');
        resultContainer.empty();
        var addressResult = util.getElementsByTagNameNS(results, namespaces.xls, 'Address');
        addressResult = addressResult ? addressResult[0] : null;
        var address = util.parseAddress(addressResult);
        //use as waypoint button
        var useAsWaypointButton = new Element('span', {
            'class': 'clickable useAsWaypoint',
            'title': 'use as waypoint',
            'id': featureId,
            'data-position': point.getLatLng().lng + ' ' + point.getLatLng().lat,
            'data-layer': layername
        });
        address.insert(useAsWaypointButton);
        //set data-attributes
        address.setAttribute('data-layer', layername);
        address.setAttribute('id', featureId);
        address.setAttribute('data-position', point.getLatLng().lng + ' ' + point.getLatLng().lat);
        resultContainer.append(address);
        //event handling
        $('.address').mouseover(handleMouseOverElement);
        $('.address').mouseout(handleMouseOutElement);
        $('.address').click(handleSearchResultClick);
        $('.useAsWaypoint').click(handleUseAsWaypoint);
    }
    /**
     * shows or hides a spinner while retrieving the location
     * @param showSearching: if true, the spinner is shown; hidden otherwise
     */
    function showGeolocationSearching(showSearching) {
        if (showSearching) {
            $('#geolocationHead').addClass('searching');
        } else {
            $('#geolocationHead').removeClass('searching');
        }
    }
    /**
     * shows or hides an error message, either when a runtime error occurs or when the geolocation feature is not supported
     * @param showError: if true, the error message is shown; hidden otherwise
     * @param notSupportedError: if true, the 'geolocation is not supported'-error is addressed; else, the 'runtime error during geolocation' is addressed
     */
    function showGeolocationError(showError, notSupportedError) {
        var el = $('#geolocationError');
        if (showError) {
            if (notSupportedError) {
                //show error: geolocation is not supported
                el.html(p.translate('geolocationNotSupported'));
            } else {
                //show regular runtime error
                el.html(p.translate('geolocationRuntimeError'));
            }
            el.show();
        } else {
            el.hide();
        }
    }
    /* *********************************************************************
     * SEARCH ADDRESS
     * *********************************************************************/
    /**
     * The user enters an address search string which should be passed on to the service. Previous search results are removed.
     * The search is automatically triggered after the user stopped typing for a certain period of time (DONE_TYPING_INTERVAL)
     * @param e: the event
     */
    function handleSearchAddressInput(e) {
        clearTimeout(typingTimerSearchAddress);
        if (e.keyIdentifier != 'Shift' && e.currentTarget.value.length !== 0) {
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
                    address: e.currentTarget.value,
                    lastSearchResults: lastSearchResults
                });
            }, DONE_TYPING_INTERVAL);
        }
    }
    /**
     * shows or hides a search spinner while searching for an address
     * @param changeToSearching: if true, the spinner is shown; hidden otherwise
     */
    function searchAddressChangeToSearchingState(changeToSearching) {
        if (changeToSearching) {
            $('#fnct_searchAddress').addClass('searching');
            $('#searchAddressError').hide();
        } else {
            $('#fnct_searchAddress').removeClass('searching');
        }
    }
    /**
     * shows the results of an address search in the Ui.
     * @param results: the address search response from the service in XML format
     * @param listOfFeatures: array of OL features representing address locations on the map
     * @param layername: map layer name the features are located on
     */
    function updateSearchAddressResultList(results, listOfFeatures, layername) {
        //insert address information to page
        var allAddress;
        var allIds = "";
        var resultContainer = $('#fnct_searchAddressResults');
        var geocodeResponseList = util.getElementsByTagNameNS(results, namespaces.xls, 'GeocodeResponseList');
        var resultCount = 0;
        $A(geocodeResponseList).each(function(geocodeResponse) {
            allAddress = $A(util.getElementsByTagNameNS(geocodeResponse, namespaces.xls, 'Address'));
            for (var i = 0; i < allAddress.length; i++) {
                //listOfPoitnts[i] == null if result is not in Europe
                if (listOfFeatures[i]) {
                    resultCount++;
                    var address = allAddress[i];
                    address = util.parseAddress(address);
                    var lonLat = listOfFeatures[i].geometry;
                    allIds += listOfFeatures[i].id + ' ';
                    address.setAttribute('id', listOfFeatures[i].id);
                    address.setAttribute('data-position', lonLat.x + ' ' + lonLat.y);
                    address.setAttribute('data-layer', layername);
                    var useAsWaypointButton = new Element('span', {
                        'class': 'clickable useAsWaypoint',
                        'title': 'use as waypoint',
                        'id': listOfFeatures[i].id,
                        'data-position': lonLat.x + ' ' + lonLat.y,
                        'data-layer': layername
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
        numResults.html(preferences.translate('numPoiResults1') + resultCount + preferences.translate('numPoiResults2'));
        //event handling
        $('.address').mouseover(handleMouseOverElement);
        $('.address').mouseout(handleMouseOutElement);
        $('.address').click(handleSearchResultClick);
        $('.useAsWaypoint').click(handleUseAsWaypoint);
    }
    /**
     * views an error message when problems occur during address search
     */
    function showSearchAddressError() {
        var errorContainer = $('#searchAddressError');
        errorContainer.html(preferences.translate("searchError"));
        errorContainer.show();
    }
    /**
     * triggers moving and zooming the map so that all address search results become visible on the screen
     */
    function handleZoomToAddressResults(e) {
        theInterface.emit('ui:zoomToAddressResults');
    }
    /**
     * The user clicked on one of the search results. Triggers the zooming of the map to the corresponding map feature
     */
    function handleSearchResultClick(e) {
        theInterface.emit('ui:zoomToMarker', {
            position: e.currentTarget.getAttribute('data-position'),
            layer: e.currentTarget.getAttribute('data-layer')
        });
    }
    /**
     * The user wants to include this search result as waypoint in the route. Triggers the addition of that point.
     */
    function handleUseAsWaypoint(e) {
        theInterface.emit('ui:useAsWaypoint', e.currentTarget.getAttribute('data-position'));
    }
    /* *********************************************************************
     * SEARCH POI
     * *********************************************************************/
    /**
     * internal flag for route availabiligy on the page
     * @present: set to true if a route is present; not present otherwise
     */
    function setRouteIsPresent(present) {
        routeIsPresent = present;
    }
    /**
     * The user enters a POI search string which should be passed on to the service. Previous search results are removed.
     * The search is automatically triggered after the user stopped typing for a certain period of time (DONE_TYPING_INTERVAL)
     * @param e: the event
     */
    function handleSearchPoiInput(e) {
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
                searchPoiAtts[3] = e.currentTarget.value;
                var lastSearchResults = $('#searchPoi').attr('data-search');
                theInterface.emit('ui:searchPoiRequest', {
                    query: e.currentTarget.value,
                    nearRoute: searchPoiAtts[0] && routeIsPresent,
                    maxDist: searchPoiAtts[1],
                    distUnit: searchPoiAtts[2],
                    lastSearchResults: lastSearchResults
                });
            }, DONE_TYPING_INTERVAL);
        }
    }
    /**
     * shows or hides a search spinner while searching for a POI
     * @param changeToSearching: if true, the spinner is shown; hidden otherwise
     */
    function searchPoiChangeToSearchingState(changeToSearching) {
        if (changeToSearching) {
            $('#fnct_searchPoi').addClass('searching');
            $('#searchPoiError').hide();
        } else {
            $('#fnct_searchPoi').removeClass('searching');
        }
    }
    /**
     * is called when the user selects the option to look for POIs along the route
     * shows an error message, if necessary (if no route is present)
     * triggers a service call to look for the POIs
     */
    function handleSearchPoiNearRoute(e) {
        searchPoiAtts[0] = e.currentTarget.checked;
        if (!routeIsPresent) {
            $('#checkboxWarn').text(preferences.translate('noRouteFound'));
            $('#checkboxWarn').show();
        } else if (searchPoiAtts[3].length > 0 && routeIsPresent) {
            theInterface.emit('ui:searchPoiRequest', {
                query: searchPoiAtts[3],
                nearRoute: searchPoiAtts[0],
                maxDist: searchPoiAtts[1],
                distUnit: searchPoiAtts[2],
                lastSearchResults: $('#searchPoi').attr('data-search')
            });
        }
        //if we're not searching near route, hide erorr message
        if (searchPoiAtts[0] == false) {
            $('#checkboxWarn').hide();
        }
    }
    /**
     * is called when the user selects the option to look for POIs along the route
     * shows an error message, if necessary (if no route is present or an invalid distance is selected)
     * triggers a service call to look for the POIs
     */
    function handleSearchPoiDistance(e) {
        clearTimeout(typingTimerSearchPoiDistance);
        if (e.keyIdentifier != 'Shift' && e.currentTarget.value.length != 0) {
            typingTimerSearchPoiDistance = setTimeout(function() {
                searchPoiAtts[1] = e.currentTarget.value;
                theInterface.emit('ui:checkDistanceToRoute', {
                    dist: searchPoiAtts[1],
                    unit: searchPoiAtts[2]
                });
                if (searchPoiAtts[3].length > 0 && searchPoiAtts[0] == true && routeIsPresent) {
                    theInterface.emit('ui:searchPoiRequest', {
                        query: searchPoiAtts[3],
                        nearRoute: searchPoiAtts[0],
                        maxDist: searchPoiAtts[1],
                        distUnit: searchPoiAtts[2],
                        lastSearchResults: $('#searchPoi').attr('data-search')
                    });
                }
            }, DONE_TYPING_INTERVAL);
        }
    }
    /**
     * is called when the user selects the option to look for POIs along the route
     * shows an error message, if necessary (if no route is present or an invalid distance is selected)
     * triggers a service call to look for the POIs
     */
    function handleSearchPoiDistanceUnit(e) {
        searchPoiAtts[2] = e.currentTarget.value;
        theInterface.emit('ui:checkDistanceToRoute', {
            dist: searchPoiAtts[1],
            unit: searchPoiAtts[2]
        });
        if (searchPoiAtts[3].length > 0 && searchPoiAtts[0] == true && routeIsPresent) {
            theInterface.emit('ui:searchPoiRequest', {
                query: searchPoiAtts[3],
                nearRoute: searchPoiAtts[0],
                maxDist: searchPoiAtts[1],
                distUnit: searchPoiAtts[2],
                lastSearchResults: $('#searchPoi').attr('data-search')
            });
        }
    }
    /**
     * shows the results of an POI search in the Ui.
     * @param results: the POI search response from the service in XML format
     * @param listOfFeatures: array of OL features representing POI locations on the map
     * @param layername: map layer name the features are located on
     */
    function updateSearchPoiResultList(results, listOfFeatures, layername) {
        var resultContainer = $('#fnct_searchPoiResults').get(0);
        while (resultContainer.hasChildNodes()) {
            resultContainer.removeChild(resultContainer.lastChild);
        }
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
                        'class': 'poi',
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
                        'class': 'clickable useAsWaypoint',
                        'title': 'use as waypoint',
                        'id': listOfFeatures[i].id,
                        'data-position': lonLat.x + ' ' + lonLat.y,
                        'data-layer': layername
                    });
                    element.insert(useAsWaypointButton);
                    $(resultContainer).append(element);
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
    /**
     *  views an error message when problems occur during POI lookup
     */
    function showSearchPoiError() {
        var errorContainer = $('#searchPoiError');
        errorContainer.html(preferences.translate("searchError"));
        errorContainer.show();
    }
    /**
     * shows or hides an error message for incorrect distance parameters (show POIs XY m/yd/km/... from route)
     * @param isIncorrect: if true, an error message is displyed; hidden otherwise
     */
    function showSearchPoiDistUnitError(isIncorrect) {
        if (isIncorrect) {
            $('#inputWarn').text(preferences.translate('distaneNotSupported'));
            $('#inputWarn').show();
        } else {
            $('#inputWarn').hide();
        }
    }
    /**
     * triggers moving and zooming the map so that all POI search results become visible on the screen
     */
    function handleZoomToPoiResults(e) {
        theInterface.emit('ui:zoomToPoiResults');
    }
    /* *********************************************************************
     * ROUTE
     * *********************************************************************/
    /**
     * gets a list of route points, i.e. waypoint coordinates
     * @return array of strings containing the coordinates
     */
    function getRoutePoints() {
        var allRoutePoints = [];
        var numWaypoints = $('.waypoint').length - 1;
        for (var i = 0; i < numWaypoints; i++) {
            var element = $('#' + i).get(0);
            element = element.querySelector('.address');
            if (element) {
                allRoutePoints.push(element.getAttribute('data-position'));
            }
        }
        return allRoutePoints;
    }
    /** 
     * returns the addresses of all waypoints
     */
    function getWaypoints() {
        var waypoints = [];
        for (var i = 0; i < $('.waypoint').length - 1; i++) {
            var address = $('#' + i).get(0);
            if (address.querySelector('.address')) {
                address = $(address).children(".waypointResult");
                address = $(address).find("li").attr("data-shortaddress");
                //address = address.match(/[^,]*/).toString();
                //address = address.replace(/(\r\n|\n|\r)/gm,", ");
                waypoints.push(address);
            }
        }
        return waypoints;
    }
    /**
     * gets a short description of the route destination
     * @return string of the destination in short form or null if the last waypoint is not set
     */
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
            address = address.split(' ');
            // removed undefined entries
            var addressFormatted = '';
            for (var i = 0; i < address.length; i++) {
                if (address[i] != 'undefined') {
                    addressFormatted += address[i];
                    addressFormatted += ' ';
                }
            }
            return addressFormatted;
        } else {
            return null;
        }
    }
    /**
     * shows a spinner for the route calculation process and hides previously displayed error messages
     */
    function startRouteCalculation() {
        var el = $('#routeCalculate');
        el.show();
        el.html(preferences.translate('calculatingRoute'));
        $('#routeError').hide();
    }
    /**
     * hides the spinner for the route calculation process
     */
    function endRouteCalculation() {
        $('#routeCalculate').hide();
    }
    /**
     * displays general route information as a route summary
     * @param results: response of the service containing the route summary information
     * @param routePref: route type selected: car, bicycle etc..
     */
    function updateRouteSummary(results, routePref) {
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
            totalTime = totalTime.replace('P', '');
            totalTime = totalTime.replace('T', '');
            totalTime = totalTime.replace('D', ' ' + preferences.translate('days') + ' ');
            totalTime = totalTime.replace('H', ' ' + preferences.translate('hours') + ' ');
            totalTime = totalTime.replace('M', ' ' + preferences.translate('minutes') + ' ');
            totalTime = totalTime.slice(0, -1);
            totalTime = totalTime + (' ' + preferences.translate('seconds') + ' ');
            //totalTime = totalTime.replace('S', ' ' + preferences.translate('seconds') + ' ');
            // total distance
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
            var actualDistanceDiv = container.querySelector('#route_actualDistance');
            $(actualDistanceDiv).hide();
            // actual distance
            var actualDistance = util.getElementsByTagNameNS(summaryElement, namespaces.xls, 'ActualDistance')[0];
            if (actualDistance !== undefined) {
                // only show actual distance for bicycle
                if (routePref == 'Bicycle' || routePref == 'Pedestrian' || routePref == 'Wheelchair') {
                    var actualDistanceValue = actualDistance.getAttribute('value');
                    var actualDistanceUnit = actualDistance.getAttribute('uom');
                    var actualdistArr = [];
                    if (preferences.distanceUnit == list.distanceUnitsPreferences[0]) {
                        //use mixture of km and m
                        actualdistArr = util.convertDistanceFormat(actualDistanceValue, preferences.distanceUnit);
                    } else {
                        //use mixture of miles and yards
                        var yardsUnit = 'yd';
                        var actualDistMeasure = util.convertDistToDist(actualDistanceValue, distanceUnit, yardsUnit);
                        actualdistArr = util.convertDistanceFormat(actualDistMeasure, preferences.distanceUnit);
                    }
                    var actualDistanceDiv = container.querySelector('#route_actualDistance');
                    $(actualDistanceDiv)[0].update(preferences.translate('ActualDistance') + ': ' + actualdistArr[0] + ' ' + actualdistArr[1]);
                    $(actualDistanceDiv).show();
                }
            }
            $(timeDiv)[0].update(preferences.translate('TotalTime') + ': ' + totalTime);
            $(distanceDiv)[0].update(preferences.translate('TotalDistance') + ': ' + distArr[0] + ' ' + distArr[1]);
        }
    }
    /**
     * displays instructions for the route
     * @param results: response of the service
     * @param mapFeatureIds: list of IDs of Leaflet elements containing BOTH - ids for route line segments AND corner points: [routeLineSegment_0, cornerPoint_0, routeLineSegment_1, cornerPoint_1,...]
     * @param mapLayer: map layer containing these features
     */
    function updateRouteInstructions(results, mapFeatureIds, mapLayer) {
        var container, directionsContainer;
        if (!results) {
            container = $('#routeInstructionsContainer').get(0);
            container.hide();
        } else {
            //parse results and show them in the container
            container = $('#routeInstructionsContainer').get(0);
            container.show();
            var directionsMain = container.querySelector('.directions-main');
            // remove old instructions
            while (directionsMain.firstChild) {
                directionsMain.removeChild(directionsMain.firstChild);
            }
            var numInstructions = 0;
            var instructionsList = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteInstructionsList')[0];
            instructionsList = util.getElementsByTagNameNS(results, namespaces.xls, 'RouteInstruction');
            // variable for distance until stopover is reached
            var numStopovers = 1;
            var stopoverDistance = 0;
            var distArr;
            var stopoverTime = 0;
            var waypoints;
            // get stopovers which are viapoints
            if ($('.waypoint').length > 2) {
                waypoints = getWaypoints();
            }
            //var startpoint = waypoints.splice(0, 1);
            //var endpoint = waypoints.splice(-1, 1);
            var startpoint = waypoints[0];
            var endpoint = waypoints[(waypoints.length) - 1];
            //add startpoint
            directionsContainer = buildWaypoint('layerRoutePoints', 'start', startpoint, 0);
            directionsMain.appendChild(directionsContainer);
            // container for all direction instructions
            $A(instructionsList).each(function(instruction) {
                var directionCode = util.getElementsByTagNameNS(instruction, namespaces.xls, 'DirectionCode')[0];
                directionCode = directionCode.textContent;
                if (directionCode == '100') {
                    directionsContainer = buildWaypoint('layerRoutePoints', 'via', waypoints[numStopovers], numStopovers, stopoverDistance, stopoverTime);
                    directionsMain.appendChild(directionsContainer);
                    stopoverDistance = 0;
                    stopoverTime = 0;
                    directionsMain.appendChild(directionsContainer);
                    numStopovers++;
                } else {
                    //process each routing instruction
                    var text = util.getElementsByTagNameNS(instruction, namespaces.xls, 'Instruction')[0];
                    text = text.text || text.textContent;
                    // add up durations for stopovers as seconds
                    var duration = instruction.getAttribute('duration');
                    duration = duration.replace('P', '');
                    duration = duration.replace('T', '');
                    duration = duration.match(/\d+\D+/g);
                    var myduration = 0;
                    var sec;
                    for (var c = 0; c < duration.length; c++) {
                        if (duration[c].slice(-1) == "D") {
                            sec = parseInt(duration[c].match(/\d+/g) * 60 * 60 * 60);
                            myduration += sec;
                        }
                        if (duration[c].slice(-1) == "H") {
                            sec = parseInt(duration[c].match(/\d+/g) * 60 * 60);
                            myduration += sec;
                        }
                        if (duration[c].slice(-1) == "M") {
                            sec = parseInt(duration[c].match(/\d+/g) * 60);
                            myduration += sec;
                        }
                        if (duration[c].slice(-1) == "S") {
                            sec = parseInt(duration[c].match(/\d+/g));
                            myduration += sec;
                        }
                    }
                    // add to stopoverTime
                    stopoverTime += myduration;
                    var distance = util.getElementsByTagNameNS(instruction, namespaces.xls, 'Distance')[0];
                    var distanceValue = distance.getAttribute('value');
                    var distanceUnit = distance.getAttribute('uom');
                    distArr = [];
                    if (preferences.distanceUnit == list.distanceUnitsPreferences[0]) {
                        //use mixture of km and m
                        distArr = util.convertDistanceFormat(distanceValue, preferences.distanceUnit);
                    } else {
                        //use mixture of miles and yards
                        var yardsUnit = 'yd';
                        var distMeasure = util.convertDistToDist(distanceValue, distanceUnit, yardsUnit);
                        distArr = util.convertDistanceFormat(distMeasure, preferences.distanceUnit);
                    }
                    // add to stopoverDistance
                    if (distArr[1] == 'km') {
                        stopoverDistance += Number(distArr[0]) * 1000;
                    } else {
                        stopoverDistance += Number(distArr[0]);
                    }
                    //arrow direction
                    var direction;
                    if (directionCode == '-2') {
                        direction = new Element('img', {
                            'src': './img/left.png'
                        });
                    } else if (directionCode == '2') {
                        direction = new Element('img', {
                            'src': './img/right.png'
                        });
                    } else if (directionCode == '1') {
                        direction = new Element('img', {
                            'src': './img/half-right.png'
                        });
                    } else if (directionCode == '-1') {
                        direction = new Element('img', {
                            'src': './img/half-left.png'
                        });
                    } else if (directionCode == '0') {
                        direction = new Element('img', {
                            'src': './img/straight.png'
                        });
                    } else if (directionCode == '-3') {
                        direction = new Element('img', {
                            'src': './img/sharp_left.png'
                        });
                    } else if (directionCode == '3') {
                        direction = new Element('img', {
                            'src': './img/sharp_right.png'
                        });
                        // directionCode == '100'
                    } else {}
                    numInstructions++;
                    //add DOM elements
                    directionsContainer = new Element('div', {
                        'class': 'directions-container clickable',
                        'data-layer': mapLayer,
                    });
                    var directionsImgDiv = new Element('div', {
                        'class': 'directions-img'
                    });
                    if (direction) {
                        directionsImgDiv.appendChild(direction);
                    }
                    var directionTextDiv = new Element('div', {
                        'class': 'directions-text clickable routeInstructions',
                        'id': mapFeatureIds[2 * (numInstructions - 1) + 1]
                    }).update(text);
                    // modeContainer
                    var directionsModeContainer = new Element('div', {
                        'class': 'directions-mode-container'
                    });
                    var directionsBorder = new Element('div', {
                        'class': 'directions-mode-line'
                    });
                    var distanceDiv = new Element('div', {
                        'class': 'directions-mode-distance clickable',
                        'id': mapFeatureIds[2 * (numInstructions - 1)],
                    }).update(distArr[0] + ' ' + distArr[1]);
                    directionsContainer.appendChild(directionsImgDiv);
                    directionsContainer.appendChild(directionTextDiv);
                    var tmcMessage = util.getElementsByTagNameNS(instruction, namespaces.xls, 'Message')[0];
                    if (tmcMessage) {
                        // add icons and jquery collapsible stuff
                        tmcMessage = tmcMessage.text || tmcMessage.textContent;
                        var tmcWarning, warningLink;
                        var tmcText = tmcMessage.split(" | ")[1];
                        var tmcCode = tmcMessage.split(" | ")[0];
                        tmcCode = tmcCode.split(',');
                        for (var i = 0; i < tmcCode.length; i++) {
                            if (tmcCode[i] in list.tmc) {
                                warningLink = list.tmc[tmcCode[i]][0];
                                break;
                            }
                        }
                        // if codes not in dict return default
                        warningLink = warningLink !== undefined ? warningLink : './img/warning_undefined.png';
                        var noticeDiv = new Element('div', {
                            'class': 'directions-notice',
                        }).update(tmcText);
                        var directionsWarningTable = new Element('table', {
                            'class': 'directions-warning-table'
                        }).update('<thead><tbody><tr><td>' + '<img src="' + warningLink + '" />' + '</td><td>' + tmcText + '</td></tr></tbody>');
                        directionsContainer.appendChild(directionsWarningTable);
                    }
                    directionsModeContainer.appendChild(directionsBorder);
                    directionsModeContainer.appendChild(distanceDiv);
                    directionsContainer.appendChild(directionsModeContainer);
                    directionsMain.appendChild(directionsContainer);
                    //mouseover for points and lines
                    $(distanceDiv).mouseover(handleMouseOverDist);
                    $(distanceDiv).mouseout(handleMouseOutDist);
                    $(directionTextDiv).mouseover(handleMouseOverText);
                    $(directionTextDiv).mouseout(handleMouseOutText);
                    $(distanceDiv).click(handleClickRouteInstr);
                    $(directionTextDiv).click(handleClickRouteCorner);
                }
            });
            //add endpoint
            directionsContainer = buildWaypoint('layerRoutePoints', 'end', endpoint, getWaypoints().length - 1, stopoverDistance, stopoverTime);
            directionsMain.appendChild(directionsContainer);
            // TODO tmc messages expand collapse function
        }
        /** 
         * builds Waypoint for start, via and end points in instructionlist
         * @param mapLayer: map layer containing these features
         * @param wpType: the type of point to be created
         * @param point: short-address of point
         * @param viaCounter: optional argument for via point counter
         * @param distance: optional argument for distance
         * @param duration: optional argument for duration
         * @return directionContainer: html container of the waypoint for instructionlist
         */
        function buildWaypoint(mapLayer, wpType, address, viaCounter, distance, duration) {
            var directionsContainer = new Element('div', {
                'class': 'directions-container clickable',
                'data-layer': mapLayer,
            });
            var icon;
            if (wpType == 'start') {
                icon = new Element('img', {
                    'src': './img/startWaypoint.png'
                });
            } else if (wpType == 'via') {
                icon = new Element('span', {
                    'class': 'badge badge-inverse'
                }).update(numStopovers);
            } else {
                icon = new Element('img', {
                    'src': './img/endWaypoint.png'
                });
            }
            var wayPoint = new Element('div', {
                'class': 'directions-waypoint',
            });
            wayPoint.appendChild(icon);
            var shortAddress = new Element('div', {
                'class': 'directions-waypoint-address',
                'waypoint-id': viaCounter
            }).update(address);
            // modeContainer
            var directionsModeContainer = new Element('div', {
                'class': 'directions-mode-container'
            });
            var directionsBorder = new Element('div', {
                'class': 'directions-mode-line'
            });
            directionsContainer.appendChild(wayPoint);
            // add info if via or endpoint
            if (wpType == 'end' || wpType == 'via') {
                var pointInfo = new Element('div', {
                    'class': 'directions-waypoint-info'
                }).update(Number(duration / 60).toFixed() + ' min' + ' / ' + Number(distance / 1000).toFixed(2) + ' km');
                directionsContainer.appendChild(pointInfo);
            }
            directionsContainer.appendChild(shortAddress);
            directionsModeContainer.appendChild(directionsBorder);
            directionsContainer.appendChild(directionsModeContainer);
            return directionsContainer;
        }
        /**
         * called when the user moves over the distance part of a route instruction. Triggers highlighting the corresponding route part
         */
        function handleMouseOverDist(e) {
            e.currentTarget.addClassName('active');
            var parent = $(e.currentTarget).parent().parent().get(0);
            theInterface.emit('ui:emphElement', {
                id: e.currentTarget.getAttribute('id'),
                layer: parent.getAttribute('data-layer')
            });
        }
        /**
         * called when the user moves out of the distance part of a route instruction. Triggers un-highlighting the corresponding route part
         */
        function handleMouseOutDist(e) {
            e.currentTarget.removeClassName('active');
            var parent = $(e.currentTarget).parent().parent().get(0);
            theInterface.emit('ui:deEmphElement', {
                id: e.currentTarget.getAttribute('id'),
                layer: parent.getAttribute('data-layer')
            });
        }
        /**
         * called when the user moves over the instruction part of the route instruction. Trigger highlighting the corresponding route point
         */
        function handleMouseOverText(e) {
            e.currentTarget.addClassName('active');
            var parent = $(e.currentTarget).parent().get(0);
            theInterface.emit('ui:emphElement', {
                id: e.currentTarget.getAttribute('id'),
                layer: parent.getAttribute('data-layer')
            });
        }
        /**
         * called when the user moves out of the instruction part of a route instruction. Triggers un-highlighting the corresponding route point
         */
        function handleMouseOutText(e) {
            e.currentTarget.removeClassName('active');
            var parent = $(e.currentTarget).parent().get(0);
            theInterface.emit('ui:deEmphElement', {
                id: e.currentTarget.getAttribute('id'),
                layer: parent.getAttribute('data-layer')
            });
        }
        /**
         * when the distance or text part of the route instruction is clicked, triggers zooming to that part of the route
         */
        function handleClickRouteInstr(e) {
            theInterface.emit('ui:zoomToRouteInstruction', e.currentTarget.id);
        }
        /**
         * when the distance or text part of the route instruction is clicked, triggers zooming to that part of the route
         */
        function handleClickRouteCorner(e) {
            theInterface.emit('ui:zoomToRouteCorner', e.currentTarget.id);
        }
    }
    /**
     * hides the route summary pane, e.g. when no route is available
     */
    function hideRouteSummary() {
        $('#routeSummaryContainer').hide();
    }
    /**
     * hides the route instructions pane, e.g. when no route is available
     */
    function hideRouteInstructions() {
        $('#routeInstructionsContainer').hide();
    }
    /**
     * triggers zooming to the whole route
     */
    function handleZoomToRouteClick() {
        theInterface.emit('ui:zoomToRoute');
    }
    /**
     * displays an error message when no route between the selected waypoints could be found or another error happened during route calculation
     */
    function showRoutingError() {
        var el = $('#routeError');
        el.html(preferences.translate('noRouteAvailable'));
        el.show();
    }
	/**
     * opens the print dialogue
     */
    function handlePrintRouteInstructionsClick() {
		$.ajax({
			url:"css/printRouteInstructions.css",
			success:function(data){
				var style = $("<style />", {
					id  : 'printCss',
					type: 'text/css',
					html: data
				}).appendTo("head");
				routeInstructions.show();
				window.print();
				style.remove();
			}
		});
    }
    /* *********************************************************************
     * ROUTE OPTIONS
     * *********************************************************************/
    /**
     * when the user wants to switch between route options for cars/bikes/pedestrians and clicks the button to switch views
     * @param e: the event
     */
    function switchRouteOptionsPane(e) {
        var parent = $('.routePreferenceBtns').get(0);
        var optionType = e.currentTarget.id;
        //switch the buttons above
        var allBtn = parent.querySelectorAll('button');
        for (var i = 0; i < allBtn.length; i++) {
            var btn = allBtn[i];
            if (btn == e.currentTarget) {
                btn.addClassName('active');
                //adapt image
                var imgElement = btn.querySelector('img');
                imgElement.setAttribute('src', list.routePreferencesImages.get(btn.id)[0]);
                //set the selected entry as currently selected route option
                var options = $('#' + btn.id + 'Options').get(0).querySelector('input[checked="checked"]');
                /* adapt global settings information */
                updateGlobalSettings(optionType, options.id);
                theInterface.emit('ui:routingParamsChanged');
            } else {
                btn.removeClassName('active');
                //adapt image
                var imgElement = btn.querySelector('img');
                imgElement.setAttribute('src', list.routePreferencesImages.get(btn.id)[0]);
            }
        }
        //switch the content
        var car = $('#carOptions');
        var bike = $('#bicycleOptions');
        var ped = $('#pedestrianOptions');
        var truckparameter = $('#truckOptions_restrict');
        var truck = $('#heavyvehicleOptions');
        var avoidables = $('#avoidables');
        var avoidablesBike = $('#avoidablesBike');
        var avoidablesPedestrian = $('#avoidablesPedestrian');
        var wheel = $('#wheelchairOptions');
        var wheelParameters = $('#wheelchairParameters');
        if (optionType === 'car') {
            avoidablesPedestrian.hide();
            car.show();
            avoidables.show();
            avoidablesBike.hide();
            bike.hide();
            ped.hide();
            truck.hide();
            truckparameter.hide();
            wheel.hide();
            wheelParameters.hide();
            $('#accessibilityAnalysis').show();
        } else if (optionType === 'bicycle') {
            avoidablesPedestrian.hide();
            car.hide();
            avoidables.hide();
            bike.show();
            avoidablesBike.show();
            ped.hide();
            truck.hide();
            truckparameter.hide();
            wheel.hide();
            wheelParameters.hide();
            $('#accessibilityAnalysis').show();
        } else if (optionType === 'heavyvehicle') {
            avoidablesPedestrian.hide();
            car.hide();
            avoidablesBike.hide();
            avoidables.show();
            bike.hide();
            ped.hide();
            truck.show();
            truckparameter.show();
            wheel.hide();
            wheelParameters.hide();
            $('#accessibilityAnalysis').show();
        } else if (optionType === 'pedestrian') {
            avoidablesPedestrian.show();
            car.hide();
            avoidables.hide();
            avoidablesBike.hide();
            bike.hide();
            ped.show();
            truck.hide();
            truckparameter.hide();
            wheel.hide();
            wheelParameters.hide();
        } else if (optionType === 'wheelchair') {
            car.hide();
            avoidables.hide();
            avoidablesBike.hide();
            avoidablesPedestrian.show();
            bike.hide();
            ped.hide();
            truck.hide();
            truckparameter.hide();
            wheel.show();
            wheelParameters.show();
        }
    }
    /**
     * when the user switches route options, global settings will be updated
     * @param optionType: the route profile clicked
     * @param optionType: the route profile clicked
     */
    function updateGlobalSettings(optionType, optionID) {
        // change routing profile
        theInterface.emit('ui:routingParamsChanged');
        // reset all checkboxes and avoidable settings each time a new profile is clicked
        $('input:checkbox').removeAttr('checked');
        theInterface.emit('ui:prefsChanged', {
            key: preferences.avoidHighwayIdx,
            value: false
        });
        theInterface.emit('ui:prefsChanged', {
            key: preferences.avoidTollwayIdx,
            value: false
        });
        theInterface.emit('ui:prefsChanged', {
            key: preferences.avoidTunnelIdx,
            value: false
        });
        theInterface.emit('ui:prefsChanged', {
            key: preferences.avoidUnpavedIdx,
            value: false
        });
        theInterface.emit('ui:prefsChanged', {
            key: preferences.avoidPavedIdx,
            value: false
        });
        theInterface.emit('ui:prefsChanged', {
            key: preferences.avoidFerryIdx,
            value: false
        });
        theInterface.emit('ui:prefsChanged', {
            key: preferences.avoidStepsIdx,
            value: false
        });
        // reset all truck and wheelchair settings to null if these profiles are clicked
        if (optionType === 'car' || optionType === 'pedestrian') {
            theInterface.emit('ui:prefsChanged', {
                key: preferences.routeOptionsIdx,
                value: optionID
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.routeOptionsTypesIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_lengthIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_heightIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_weightIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_widthIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_axleloadIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.hazardousIdx,
                value: false
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.surfaceIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.smoothnessIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.trackTypeIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.inclineIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.slopedCurbIdx,
                value: null
            });
        }
        // if wheelchair is clicked reset truck settings and add wheelchair settings
        if (optionType === 'wheelchair') {
            theInterface.emit('ui:prefsChanged', {
                key: preferences.routeOptionsIdx,
                value: optionID
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.routeOptionsTypesIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_lengthIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_heightIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_weightIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_widthIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_axleloadIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.hazardousIdx,
                value: false
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.surfaceIdx,
                value: list.wheelchairParameters.get('Surface')[$('#Surface option:selected').index()]
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.smoothnessIdx,
                value: list.wheelchairParameters.get('Smoothness')[getSmoothnessIndex($('#Surface option:selected').index())]
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.trackTypeIdx,
                value: list.wheelchairParameters.get('Tracktype')[getTracktypeIndex($('#Surface option:selected').index())]
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.inclineIdx,
                value: list.wheelchairParameters.get('Incline')[$('#Incline option:selected').index()]
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.slopedCurbIdx,
                value: list.wheelchairParameters.get('SlopedCurb')[$('#SlopedCurb option:selected').index()]
            });
        }
        // if bicycle is clicked reset wheelchair settings and add bicycle settings
        if (optionType === 'bicycle') {
            theInterface.emit('ui:prefsChanged', {
                key: preferences.routeOptionsIdx,
                value: $("#bicycleOptions input[type='radio']:checked").attr('id')
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.routeOptionsTypesIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_lengthIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_heightIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_weightIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_widthIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_axleloadIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.hazardousIdx,
                value: false
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.surfaceIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.smoothnessIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.trackTypeIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.inclineIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.slopedCurbIdx,
                value: null
            });
        }
        // if truck is clicked reset wheelchair settings and add truck  settings
        if (optionType === 'heavyvehicle') {
            theInterface.emit('ui:prefsChanged', {
                key: preferences.routeOptionsIdx,
                value: optionID
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.routeOptionsTypesIdx,
                value: $("#heavyvehicleOptions input[type='radio']:checked").val()
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_lengthIdx,
                value: $("#value_length").val()
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_heightIdx,
                value: $("#value_height").val()
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_weightIdx,
                value: $("#value_weight").val()
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_widthIdx,
                value: $("#value_width").val()
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.value_axleloadIdx,
                value: $("#value_axleload").val()
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.surfaceIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.smoothnessIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.trackTypeIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.inclineIdx,
                value: null
            });
            theInterface.emit('ui:prefsChanged', {
                key: preferences.slopedCurbIdx,
                value: null
            });
        }
    }
    /**
     * gets the matching smoothness index for given surface index
     * 
     * @param surfaceIndex
     */
    function getSmoothnessIndex(surfaceIndex) {
        if (surfaceIndex == 0 || surfaceIndex == 1) {
            return 1;
        } else if (surfaceIndex == 2) {
            return 2;
        } else if (surfaceIndex == 3 || surfaceIndex == 4) {
            return 3;
        }
        return 3;
    }
    /**
     * gets the matching tracktype index for given surface index
     * 
     * @param surfaceIndex
     */
    function getTracktypeIndex(surfaceIndex) {
        if (surfaceIndex == 0 || surfaceIndex == 1 || surfaceIndex == 2) {
            return 0;
        } else if (surfaceIndex == 3) {
            return 1;
        } else if (surfaceIndex == 4) {
            return 3;
        }
        return 3;
    }
    /** 
     * sets truckParameters in UI
     * @params truck_length: the truck length
     * @params truck_height: the truck heigth
     * @params truck_weight: the truck weight
     * @params truck_width: the truck width
     * @params truck_axleload: the truck axle load
     */
    function setTruckParameters(truck_length, truck_height, truck_weight, truck_width, truck_axleload) {
        $("#value_length").val(truck_length);
        $("#value_height").val(truck_height);
        $("#value_weight").val(truck_weight);
        $("#value_width").val(truck_width);
        $("#value_axleload").val(truck_axleload);
    }
    /** 
     * sets hazardousParamter
     * @params hazardous: is either 'hazmat' or null
     */
    function setHazardousParameter(hazardous) {
        if (list.routeDangerousGoods.indexOf(hazardous) > -1) {
            jQuery("input[id=Hazardous][value=" + hazardous + "]").attr('checked', 'checked');
        }
    }
    /** 
     * set maxspeed
     * @params maxspeed: is either maxspeed or null
     */
    function setMaxspeedParameter(maxspeed) {
        if (maxspeed !== null) {
            jQuery('#maxSpeedInput').val(maxspeed);
        }
    }
    /**
     * when the user wants to switch between route options
     * @param activeRouteOption: the active route option, i.e. one of car,bicycle,pedestrian,wheelchair
     */
    function switchRouteOptionsButton(activeRouteOption) {
        var parent = $('.routePreferenceBtns').get(0);
        //switch the buttons above
        var allBtn = parent.querySelectorAll('button');
        for (var i = 0; i < allBtn.length; i++) {
            var btn = allBtn[i];
            if (btn.id == activeRouteOption) {
                btn.addClassName('active');
                //adapt image
                var imgElement = btn.querySelector('img');
                imgElement.setAttribute('src', list.routePreferencesImages.get(btn.id)[0]);
            } else {
                btn.removeClassName('active');
                //adapt image
                var imgElement = btn.querySelector('img');
                imgElement.setAttribute('src', list.routePreferencesImages.get(btn.id)[0]);
            }
        }
    }
    /**
     * checks if routing options have changed and triggers a route recalculation if appropriate
     * @param e: the event
     */
    function handleOptionsChanged(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        var itemId = target.id;
        //for extended route options
        var itemValue = target.value;
        if ($.inArray(itemId, list.routeAvoidables) >= 0) {
            //is a route avoidable
            if (itemId === list.routeAvoidables[0]) {
                //if the avoidable is set, remove it (and vice versa)
                if (permaInfo[preferences.avoidHighwayIdx] == "true" || permaInfo[preferences.avoidHighwayIdx] == true) {
                    var boolVar = false;
                } else {
                    var boolVar = true;
                }
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.avoidHighwayIdx,
                    value: boolVar
                });
            }
            if (itemId === list.routeAvoidables[1]) {
                //if the avoidable is set, remove it (and vice versa)
                if (permaInfo[preferences.avoidTollwayIdx] == "true" || permaInfo[preferences.avoidTollwayIdx] == true) {
                    var boolVar = false;
                } else {
                    var boolVar = true;
                }
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.avoidTollwayIdx,
                    value: boolVar
                });
            }
            if (itemId === list.routeAvoidables[2]) {
                //if the avoidable is set, remove it (and vice versa)
                if (permaInfo[preferences.avoidUnpavedIdx] == "true" || permaInfo[preferences.avoidUnpavedIdx] == true) {
                    var boolVar = false;
                } else {
                    var boolVar = true;
                }
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.avoidUnpavedIdx,
                    value: boolVar
                });
            }
            if (itemId === list.routeAvoidables[3]) {
                if (permaInfo[preferences.avoidFerryIdx] == "true" || permaInfo[preferences.avoidFerryIdx] == true) {
                    var boolVar = false;
                } else {
                    var boolVar = true;
                }
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.avoidFerryIdx,
                    value: boolVar
                });
            } else if (itemId === list.routeAvoidables[4]) {
                if (permaInfo[preferences.avoidStepsIdx] == "true" || permaInfo[preferences.avoidStepsIdx] == true) {
                    var boolVar = false;
                } else {
                    var boolVar = true;
                }
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.avoidStepsIdx,
                    value: boolVar
                });
            } else if (itemId === list.routeAvoidables[5]) {
                if (permaInfo[preferences.avoidFordsIdx] == "true" || permaInfo[preferences.avoidFordsIdx] == true) {
                    var boolVar = false;
                } else {
                    var boolVar = true;
                }
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.avoidFordsIdx,
                    value: boolVar
                });
            } else if (itemId === list.routeAvoidables[6]) {
                if (permaInfo[preferences.avoidPavedIdx] == "true" || permaInfo[preferences.avoidPavedIdx] == true) {
                    var boolVar = false;
                } else {
                    var boolVar = true;
                }
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.avoidPavedIdx,
                    value: boolVar
                });
            } else if (itemId === list.routeAvoidables[7]) {
                if (permaInfo[preferences.avoidTunnelIdx] == "true" || permaInfo[preferences.avoidTunnelIdx] == true) {
                    var boolVar = false;
                } else {
                    var boolVar = true;
                }
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.avoidTunnelIdx,
                    value: boolVar
                });
            }
            // if heavy vehicle type
        } else if ($.inArray(itemValue, list.routePreferencesTypes.get('heavyvehicle')) >= 0) {
            theInterface.emit('ui:prefsChanged', {
                key: preferences.routeOptionsTypesIdx,
                value: itemValue
            });
        }
        // if truck options sliders are changed
        else if ($.inArray(itemId, list.truckParams) >= 0) {
            if (itemId == 'value_length_slide') {
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.value_lengthIdx,
                    value: $("#value_length").val()
                });
            } else if (itemId == 'value_width_slide') {
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.value_widthIdx,
                    value: $("#value_width").val()
                });
            } else if (itemId == 'value_weight_slide') {
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.value_weightIdx,
                    value: $("#value_weight").val()
                });
            } else if (itemId == 'value_height_slide') {
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.value_heightIdx,
                    value: $("#value_height").val()
                });
            } else if (itemId == 'value_axleload_slide') {
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.value_axleloadIdx,
                    value: $("#value_axleload").val()
                });
            }
        }
        // if route weight settings are modified
        else if ($.inArray(itemId, list.routeWeightSettings) >= 0) {
            //show or hide maxSpeed div
            if (itemId == 'Shortest' || itemId == 'Recommended') {
                $('#maxSpeed').hide();
                // if maxspeed was set then remove it also from prefs
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.maxspeedIdx,
                    value: 0
                });
            } else {
                $('#maxSpeed').show();
            }
            theInterface.emit('ui:prefsChanged', {
                key: preferences.weightIdx,
                value: itemId
            });
        }
        // if wheelchair settings are modified
        else if ($.inArray(itemId, list.wheelchairParameters.keys()) >= 0) {
            //is a wheelchair parameter
            //Surface, Tracktype, Smoothness
            if (itemId == 'Surface') {
                var surface = (target.selectedIndex != -1) ? list.wheelchairParameters.get('Surface')[target.selectedIndex] : null;
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.surfaceIdx,
                    value: surface
                });
                // set also smoothness here in order to simplify user interface
                var smoothness = (target.selectedIndex != -1) ? list.wheelchairParameters.get('Smoothness')[getSmoothnessIndex(target.selectedIndex)] : null;
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.smoothnessIdx,
                    value: smoothness
                });
                // set also tracktype here in order to simplify user interface
                var tracktype = (target.selectedIndex != -1) ? list.wheelchairParameters.get('Tracktype')[getTracktypeIndex(target.selectedIndex)] : null;
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.trackTypeIdx,
                    value: tracktype
                });
            }
            if (itemId == 'Incline') {
                var incline = (target.selectedIndex != -1) ? list.wheelchairParameters.get('Incline')[target.selectedIndex] : null;
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.inclineIdx,
                    value: incline
                });
            }
            if (itemId == 'SlopedCurb') {
                var slopedCurb = (target.selectedIndex != -1) ? list.wheelchairParameters.get('SlopedCurb')[target.selectedIndex] : null;
                theInterface.emit('ui:prefsChanged', {
                    key: preferences.slopedCurbIdx,
                    value: slopedCurb
                });
            }
        } else if (itemId == 'Hazardous') {
            if (permaInfo[preferences.hazardousIdx] == "hazmat") {
                var boolVar = null;
            } else {
                var boolVar = "hazmat";
            }
            theInterface.emit('ui:prefsChanged', {
                key: preferences.hazardousIdx,
                value: boolVar
            });
        } else if (itemId != 'maxSpeedInput') {
            // update route type if not maxspeedinput updated
            theInterface.emit('ui:prefsChanged', {
                key: preferences.routeOptionsIdx,
                value: itemId
            });
        }
        // update route except when user has updated maxspeed
        if (itemId != "maxSpeedInput") theInterface.emit('ui:routingParamsChanged');
    }
    /** 
     * The user inserts maximum speed into the form when route profile fastest is selected
     * when speed is set preferences are updated 
     */
    function handleMaxspeed() {
        var maxspeed = $('#maxSpeedInput').val();
        // update preferences
        theInterface.emit('ui:prefsChanged', {
            key: preferences.maxspeedIdx,
            value: maxspeed
        });
        theInterface.emit('ui:routingParamsChanged');
    }
    /**
     * used to activate route weight on startup if necessary
     * @param routeWeight: 'Fastest' or 'Shortest' or 'Recommended'
     */
    function setRouteWeight(routeWeight) {
        if (routeWeight == 'Fastest') {
            $('#Fastest').attr('checked', 'checked');
        } else if (routeWeight = 'Shortest') {
            $('#Shortest').attr('checked', 'checked');
        } else if (routeWeight = 'Recommended') {
            $('#Recommended').attr('checked', 'checked');
        }
    }
    /**
     * used to activate and show the given route option on startup if necessary
     * @param routeOption: one of 'Fastest', 'Shortest', 'BicycleLane',...
     */
    function setRouteOption(routeOption) {
        //set radioButton with $('#' + routeOption) active
        var el = $('#' + routeOption);
        if (el) {
            el.attr('checked', true)
        }
        // set parent div (with all available options for car/bike/pedestrian/truck/wheelchair visible
        var parentOptions = list.routePreferences.keys();
        var parent;
        var avoidables = $('#avoidables');
        var avoidablesPed = $('#avoidablesPedestrian');
        var avoidablesBike = $('#avoidablesBike');
        var wheelParameters = $('#wheelchairParameters');
        var truckParameters = $('#truckOptions_restrict');
        for (var i = 0; i < parentOptions.length; i++) {
            if (list.routePreferences.get(parentOptions[i]).indexOf(routeOption) != -1) {
                //show div
                $('#' + parentOptions[i] + 'Options').show();
                //activate corresponding option panel
                $('#' + parentOptions[i]).addClass('active');
                //show avoidables for car, bike or pedestrian
                if (parentOptions[i] == 'car') {
                    avoidables.show();
                    truckParameters.hide();
                    avoidablesBike.hide();
                    avoidablesPed.hide();
                    wheelParameters.hide();
                } else if (parentOptions[i] == 'bicycle') {
                    avoidablesBike.show();
                    avoidables.hide();
                    avoidablesPed.hide();
                    truckParameters.hide();
                    wheelParameters.hide();
                } else if (parentOptions[i] == 'pedestrian') {
                    avoidablesPed.show();
                    avoidables.hide();
                    avoidablesBike.hide();
                    truckParameters.hide();
                    wheelParameters.hide();
                } else if (parentOptions[i] == 'heavyvehicle') {
                    avoidables.show();
                    truckParameters.show();
                    avoidablesBike.hide();
                    avoidablesPed.hide();
                    wheelParameters.hide();
                } else if (parentOptions[i] == 'wheelchair') {
                    avoidables.hide();
                    avoidablesBike.hide();
                    avoidablesPed.hide();
                    truckParameters.hide();
                    wheelParameters.show();
                }
                //switch button
                switchRouteOptionsButton(parentOptions[i])
            } else {
                //deactivate/ hide others
                $('#' + parentOptions[i] + 'Options').hide();
                $('#' + parentOptions[i]).removeClass('active');
            }
        }
    }
    /**
     * used to set the routeOptionType if set
     * @param routeOptionType: one of 'goods', 'hgv', etc..
     */
    function setRouteOptionType(routeOptType) {
        //set route option type
        if (list.routePreferencesTypes.get('heavyvehicle').indexOf(routeOptType) > -1) {
            jQuery("input[name=heavyvehicle][value=" + routeOptType + "]").attr('checked', 'checked');
        }
    }
    /**
     * Used to set the wheelchair parameters to pre-defined values, if necessary
     * @param surface
     * @param incline
     * @param slopedCurb
     */
    function setWheelParameters(surface, incline, slopedCurb, tracktype, smoothness) {
        var surfaceParamIndex = 0;
        var inclineParamIndex = 0;
        var slopedCurbParamIndex = 0;
        var trackTypeParamIndex = 0;
        var smoothnessParamIndex = 0;
        for (var i = 0; i < list.wheelchairParameters.get('Surface').length; i++) {
            if (list.wheelchairParameters.get('Surface')[i] == surface) {
                surfaceParamIndex = i;
                trackTypeParamIndex = getTracktypeIndex(i);
                smoothnessParamIndex = getSmoothnessIndex(i);
            }
        }
        for (var i = 0; i < list.wheelchairParameters.get('Incline').length; i++) {
            if (list.wheelchairParameters.get('Incline')[i] == incline) {
                inclineParamIndex = i;
            }
        }
        for (var i = 0; i < list.wheelchairParameters.get('SlopedCurb').length; i++) {
            if (list.wheelchairParameters.get('SlopedCurb')[i] == slopedCurb) {
                slopedCurbParamIndex = i;
            }
        }
        $('#Surface option')[surfaceParamIndex].selected = true;
        // $('#Smoothness option')[surfaceParamIndex].selected = true;
        // $('#Tracktype option')[surfaceParamIndex].selected = true;
        $('#Incline option')[inclineParamIndex].selected = true;
        $('#SlopedCurb option')[slopedCurbParamIndex].selected = true;
    }
    /**
     * used to activate the checkboxes for "avoid tollways", "avoid highways", "avoid unpaved", "avoid ferry", 
     "avoid steps", "avoid fords" and "avoid paved" on startup if necessary
     * @param highway: true, if highway checkbox is to be checked
     * @param tollway: accordingly.
     * @param unpaved: accordingly.
     * @param ferry: accordingly.
     * @param steps: accordingly.
     * @param fords: accordingly.
     * @param paved: accordingly.
     */
    function setAvoidables(highway, tollway, unpaved, ferry, steps, fords, paved, tunnel) {
        var highwayTrue = (highway === 'true') || highway == true;
        var tollwayTrue = (tollway === 'true') || tollway == true;
        var tunnelTrue = (tunnel === 'true') || tunnel == true;
        var unpavedTrue = (unpaved === 'true') || unpaved == true;
        var pavedTrue = (paved === 'true') || paved == true;
        var ferryTrue = (ferry === 'true') || ferry == true;
        var stepsTrue = (steps === 'true') || steps == true;
        var fordsTrue = (fords === 'true') || fords == true;
        $('[type="checkbox"]').filter('#Highway').prop('checked', highwayTrue);
        $('[type="checkbox"]').filter('#Tollway').prop('checked', tollwayTrue);
        $('[type="checkbox"]').filter('#Tunnel').prop('checked', tunnelTrue);
        $('[type="checkbox"]').filter('#Unpavedroads').prop('checked', unpavedTrue);
        $('[type="checkbox"]').filter('#Pavedroads').prop('checked', pavedTrue);
        $('[type="checkbox"]').filter('#Ferry').prop('checked', ferryTrue);
        $('[type="checkbox"]').filter('#Steps').prop('checked', stepsTrue);
        $('[type="checkbox"]').filter('#Fords').prop('checked', fordsTrue);
    }
    /**
     * shows or hides an avoid area error message, e.g. if one avoid area intersects itself
     * @param showError: if true, shows the error message; hides it otherwise
     */
    function showAvoidAreasError(showError) {
        var el = $('#avoidAreasError');
        //el.html(preferences.translate('invalidAvoidArea'));
        if (showError) {
            el.show();
        } else {
            el.hide();
        }
    }
    /* *********************************************************************
     * PERMALINK
     * *********************************************************************/
    /** 
     * shows Perma Options box
     */
    function handleOpenPermaOptions() {
        $('#bubble').toggle();
    }
    /**
     * triggers opening a new window with the permalink
     */
    function handleGeneratePerma(event) {
        $('#bubble').hide();
        var tgt = event.target.id;
        theInterface.emit('ui:generatePermalinkRequest', tgt);
    }
    /* *********************************************************************
     * ACCESSIBILITY ANALSYIS
     * *********************************************************************/
    /**
     * triggers the calculation of the accessibility analsyis with the current distance value
     */
    function handleAnalyzeAccessibility() {
        var distance = $('#accessibilityDistance').val();
        var position = $('.guiComponent.waypoint.start .address').attr('data-position');
        if (!position) {
            var position = $('.guiComponent.waypoint.end .address').attr('data-position');
        }
        theInterface.emit('ui:analyzeAccessibility', {
            distance: distance,
            position: position
        });
    }
    /**
     * shows a spinner during accessibility analysis calculation
     * @param showSpinner: if true, show the spinner; hide otherwise
     */
    function showSearchingAtAccessibility(showSpinner) {
        if (showSpinner) {
            $('#accessibilityCalculation').show();
        } else {
            $('#accessibilityCalculation').hide();
            $('#removeAccessibility').show();
        }
    }
    /**
     * displays an accessibility analysis error message
     * @param showError: if true, displays the error; hides it otherwise
     */
    function showAccessibilityError(showError) {
        if (showError) {
            $('#accessibilityError').show();
            $('#removeAccessibility').hide();
        } else {
            $('#accessibilityError').hide();
        }
    }
    /**
     * triggers removing former accessibility calculations from the map
     */
    function handleRemoveAccessibility() {
        $('#removeAccessibility').hide();
        theInterface.emit('ui:removeAccessibility');
    }
    /* *********************************************************************
     * EXPORT / IMPORT
     * *********************************************************************/
    /**
     * triggers the export route to GPX function
     */
    function handleExportRouteClick() {
        theInterface.emit('ui:exportRouteGpx');
    }
    /**
     * displays or hides a route export error
     * @param showError: if true, the error is displayed; hidden otherwise
     */
    function showExportRouteError(showError) {
        if (showError) {
            $('#exportGpxError').show();
        } else {
            $('#exportGpxError').hide();
        }
    }
    /**
     * removes the file from the import route dialogue
     */
    function handleImportRouteRemove(e) {
        //if the file is removed from the view, we do NOT remove the waypoints from the list, etc.
        //just remove the erorr message if visible
        showImportRouteError(false);
    }
    /**
     * shows an import error (route import)
     * @param showError: if true, the error is displayed; hidden otherwise
     */
    function showImportRouteError(showError) {
        if (showError) {
            $('#importGpxError').show();
        } else {
            $('#importGpxError').hide();
        }
    }
    /**
     * resets file menu value
     */
    function handleResetFileInput() {
        this.value = null;
    }
    /**
     * forwards the selected GPX files and fills the gpx menu
     */
    var fileInput;

    function handleGpxFiles(event) {
        // clear old gpx tracks from map
        theInterface.emit('ui:clearFromGpx');
        fileInput = event.target.files;
        // TODO show error if any of the files are not gpx showImportRouteError(true)
        if (fileInput) {
            fillGpxMenu(fileInput)
        }
    }

    function fillGpxMenu(files) {
        var container = document.querySelector('#GPXcontainer');
        var fileContainerMain = container.querySelector('#fileContainerMain')
        fileContainerMain.show();
        // remove old files..
        while (fileContainerMain.firstChild) {
            fileContainerMain.removeChild(fileContainerMain.firstChild);
        }
        for (var i = 0; i < files.length; i++) {
            var fileContainer = new Element('div', {
                'id': 'fileContainer',
            });
            var filename = files[i].name;
            var fileName = new Element('div', {
                'class': 'myfile',
            }).update(filename);
            var showGpx = new Element('div', {
                'class': 'show',
                'data': i
            });
            var calcGpx = new Element('div', {
                'class': 'calc',
                'data': i
            });
            var deleteGpx = new Element('div', {
                'class': 'delete',
                'data': i
            });
            var show = new Element('img', {
                'src': 'img/menuSearch.png',
                'title': 'show track'
            });
            var calc = new Element('img', {
                'src': 'img/marker-small.png',
                'title': 'recalculate track to route'
            });
            var del = new Element('img', {
                'src': 'img/cancel.png',
                'title': 'remove track or route'
            });
            var calcGranularity = new Element('select', {
                'class': 'form-control calcGranularity',
                'title': 'route calculation from gpx detail'
            });
            calcGranularity.insert(new Element('option', {
                value: '3000'
            }).update('3 km'));
            calcGranularity.insert(new Element('option', {
                value: '5000'
            }).update('5 km'));
            calcGranularity.insert(new Element('option', {
                value: '10000'
            }).update('10 km'));
            showGpx.appendChild(show);
            calcGpx.appendChild(calc);
            deleteGpx.appendChild(del);
            fileContainer.appendChild(fileName);
            fileContainer.appendChild(showGpx);
            fileContainer.appendChild(calcGpx);
            fileContainer.appendChild(deleteGpx);
            fileContainer.appendChild(calcGranularity);
            fileContainerMain.appendChild(fileContainer)
            $(showGpx).click(handleShowGpx);
            $(calcGpx).click(handleRecalcGpx);
            $(deleteGpx).click(handleDeleteFromMapGpx);
        }
        container.appendChild(fileContainerMain);
    };
    /**
     * handles the clicked gpx file and shows it on map
     */
    function handleShowGpx(e) {
        var thisTarget = e.currentTarget;
        var iterator = thisTarget.getAttribute('data');
        var gpxFile = fileInput[iterator];
        // get sibling remove element
        var thisTarget = $(e.currentTarget).siblings(".delete")[0];
        theInterface.emit('ui:uploadTrack', [gpxFile, thisTarget]);
    }
    /**
     * handles the clicked gpx file and recalculates route
     */
    function handleRecalcGpx(e) {
        var thisTarget = e.currentTarget;
        var parentTarget = $(thisTarget).parent();
        var granularity = $(parentTarget.children()[4]).find(":selected").val();
        var iterator = thisTarget.getAttribute('data');
        var gpxFile = fileInput[iterator];
        theInterface.emit('ui:uploadRoute', [gpxFile, granularity]);
    }
    /**
     * removes it from map
     */
    function handleDeleteFromMapGpx(e) {
        //remove the track from the map and clicked
        var thisTarget = e.currentTarget;
        var llFeature = thisTarget.getAttribute('LeafletFeatureName');
        theInterface.emit('ui:removeTrack', llFeature);
        $(thisTarget).parent().fadeOut(300, function() {
            $(this).remove();
        });
    }
    /**
     * removes the file from the import track dialogue and triggers the deletion of the track on the map
     */
    function handleImportTrackRemove() {
        //remove the track from the map
        theInterface.emit('ui:removeTrack');
    }
    /* *********************************************************************
     * USER PREFERENCES
     * *********************************************************************/
    /**
     * extracts selected user preferences and forwards them for saving in the preference module
     */
    function handleSaveUserPreferences() {
        var version = $('#extendedVersionPrefs').find(":selected").text();
        var language = $('#languagePrefs').find(":selected").text();
        var routingLanguage = $('#routingLanguagePrefs').find(":selected").text();
        var distanceUnit = $('#unitPrefs').find(":selected").text();
        //var baseLayer = $('input[name=layerSwitcherPanel_baseLayers]:checked').val();
        //version: one of list.version
        version = preferences.reverseTranslate(version);
        //language: one of list.languages
        language = preferences.reverseTranslate(language);
        //routing language: one of list.routingLanguages
        routingLanguage = preferences.reverseTranslate(routingLanguage);
        //units: one of list.distanceUnitsInPopup
        distanceUnit = distanceUnit.split(' / ');
        for (var i = 0; i < distanceUnit.length; i++) {
            for (var j = 0; j < list.distanceUnitsPreferences.length; j++) {
                if (distanceUnit[i] === list.distanceUnitsPreferences[j]) {
                    distanceUnit = list.distanceUnitsPreferences[j];
                    i = distanceUnit.length;
                    break;
                }
            }
        }
        theInterface.emit('ui:saveUserPreferences', {
            version: version,
            language: language,
            routingLanguage: routingLanguage,
            distanceUnit: distanceUnit
        });
        //hide preferences window
        $('#sitePrefsModal').modal('hide');
    }
    /**
     * applies the given user preferences
     * @param version: version of the site: standard, extended,...
     * @param language: language of the site
     * @param routingLanguage: language of the routing instructions
     * @param distanceUnit: unit of distances used on the site
     */
    function setUserPreferences(version, language, routingLanguage, distanceUnit) {
        //setting version
        var container = $('#extendedVersionPrefs').get(0);
        container = container.options;
        for (var i = 0; i < list.version.length; i++) {
            if (list.version[i] === version) {
                //set selected = true
                container[i].selected = true;
            }
        }
        //setting language
        container = $('#languagePrefs').get(0);
        container = container.options;
        for (var i = 0; i < list.languages.length; i++) {
            if (list.languages[i] === language) {
                //set selected = true
                container[i].selected = true;
            }
        }
        //setting routingLanguage
        container = $('#routingLanguagePrefs').get(0);
        container = container.options;
        for (var i = 0; i < list.routingLanguages.length; i++) {
            if (list.routingLanguages[i] === routingLanguage) {
                //set selected = true
                container[i].selected = true;
            }
        }
        //setting distanceUnit
        container = $('#unitPrefs').get(0);
        container = container.options;
        for (var i = 0; i < list.distanceUnitsPreferences.length; i++) {
            if (list.distanceUnitsPreferences[i] === distanceUnit) {
                //set selected = true
                container[i].selected = true;
            }
        }
    }
    /* *********************************************************************
     * CLASS-SPECIFIC
     * *********************************************************************/
    /**
     * used for debugging information
     */
    function debug() {
        console.log()
        theInterface.emit('ui:startDebug');
    }
    /* *********************************************************************
     * CONSTRUCTOR
     * *********************************************************************/
    function Ui() {
        //to use debug info, remove the .hide() statement and fill function debug() above
        $('#debug').hide();
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
        $('#orderRoute').click(handleReorderWaypoints);
        //route
        $('#zoomToRouteButton').click(handleZoomToRouteClick);
		//route instructions print
        $('#printRouteInstructions').click(handlePrintRouteInstructionsClick);
        //geolocation
        $('#geolocation').click(handleGeolocationClick);
        //search address
        $('#fnct_searchAddress').keyup(handleSearchAddressInput);
        $('#zoomToAddressResults').click(handleZoomToAddressResults);
        //search POI
        $('#fnct_searchPoi').keyup(handleSearchPoiInput);
        $('#fnct_searchPoi_nearRoute').change(handleSearchPoiNearRoute);
        $('#fnct_searchPoi_distance').keyup(handleSearchPoiDistance);
        $('#fnct_searchPoi_distanceUnit').change(handleSearchPoiDistanceUnit);
        $('#zoomToPoiResults').click(handleZoomToPoiResults);
        //route options
        $('#car').click(switchRouteOptionsPane);
        $('#bicycle').click(switchRouteOptionsPane);
        $('#pedestrian').click(switchRouteOptionsPane);
        $('#heavyvehicle').click(switchRouteOptionsPane);
        $('#wheelchair').click(switchRouteOptionsPane);
        $('.routeOptions').change(handleOptionsChanged);
        //permalink
        $('#infoPermalink').click(handleOpenPermaOptions);
        $('#open').click(handleGeneratePerma);
        $('#copy').click(handleGeneratePerma);
        //accessibility analysis
        $('#analyzeAccessibility').click(handleAnalyzeAccessibility);
        $('#removeAccessibility').click(handleRemoveAccessibility);
        //export/ import
        $('#export-gpx').click(handleExportRouteClick);
        $('#gpxUploadFilesDelete').click(handleImportRouteRemove);
        $('#gpxUploadTrackDelete').click(handleImportTrackRemove);
        //reset multiple file uploader
        $('#files').click(handleResetFileInput);
        //when gpx files are uploaded
        $('#files').change(handleGpxFiles);
        //user preferences
        $('#savePrefsBtn').click(handleSaveUserPreferences);
        //keep dropdowns open
        $('.dropdown-menu').on({
            "click": function(e) {
                e.stopPropagation();
            }
        });
        $('.btn-group').button();
        //feedback slide
        $("#feedback_button").click(function() {
            $('.form').slideToggle();
        });
        //maxspeed button listener
        $('#maxSpeedBtn').click(handleMaxspeed);
    }
    Ui.prototype = new EventEmitter();
    Ui.prototype.constructor = Ui;
    Ui.prototype.showNewToOrsPopup = showNewToOrsPopup;
    Ui.prototype.showServiceTimeoutPopup = showServiceTimeoutPopup;
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
    Ui.prototype.invalidateWaypointSearch = invalidateWaypointSearch;
    Ui.prototype.setMoveDownButton = setMoveDownButton;
    Ui.prototype.setMoveUpButton = setMoveUpButton;
    Ui.prototype.showSearchingAtWaypoint = showSearchingAtWaypoint;
    Ui.prototype.searchAddressChangeToSearchingState = searchAddressChangeToSearchingState;
    Ui.prototype.updateSearchAddressResultList = updateSearchAddressResultList;
    Ui.prototype.showSearchAddressError = showSearchAddressError;
    Ui.prototype.showCurrentLocation = showCurrentLocation;
    Ui.prototype.showGeolocationSearching = showGeolocationSearching;
    Ui.prototype.showGeolocationError = showGeolocationError;
    Ui.prototype.setRouteIsPresent = setRouteIsPresent;
    Ui.prototype.searchPoiChangeToSearchingState = searchPoiChangeToSearchingState;
    Ui.prototype.updateSearchPoiResultList = updateSearchPoiResultList;
    Ui.prototype.showSearchPoiError = showSearchPoiError;
    Ui.prototype.showSearchPoiDistUnitError = showSearchPoiDistUnitError;
    Ui.prototype.getRoutePoints = getRoutePoints;
    Ui.prototype.getWaypoints = getWaypoints;
    Ui.prototype.updateRouteSummary = updateRouteSummary;
    Ui.prototype.startRouteCalculation = startRouteCalculation;
    Ui.prototype.endRouteCalculation = endRouteCalculation;
    Ui.prototype.updateRouteInstructions = updateRouteInstructions;
    Ui.prototype.hideRouteSummary = hideRouteSummary;
    Ui.prototype.hideRouteInstructions = hideRouteInstructions;
    Ui.prototype.showRoutingError = showRoutingError;
    Ui.prototype.setRouteOption = setRouteOption;
    Ui.prototype.setRouteWeight = setRouteWeight;
    Ui.prototype.setRouteOptionType = setRouteOptionType;
    Ui.prototype.setAvoidables = setAvoidables;
    Ui.prototype.setWheelParameters = setWheelParameters;
    Ui.prototype.showAvoidAreasError = showAvoidAreasError;
    Ui.prototype.showSearchingAtAccessibility = showSearchingAtAccessibility;
    Ui.prototype.showAccessibilityError = showAccessibilityError;
    Ui.prototype.showExportRouteError = showExportRouteError;
    Ui.prototype.showImportRouteError = showImportRouteError;
    Ui.prototype.setUserPreferences = setUserPreferences;
    Ui.prototype.setTruckParameters = setTruckParameters;
    Ui.prototype.setHazardousParameter = setHazardousParameter;
    Ui.prototype.setMaxspeedParameter = setMaxspeedParameter;
    Ui.prototype.handleGpxFiles = handleGpxFiles;
    Ui.prototype.handleResetRoute = handleResetRoute;
    Ui.prototype.handleMaxspeed = handleMaxspeed;
    theInterface = new Ui();
    return theInterface;
}(window));
/* *********************************************************************
 * ICONS
 * *********************************************************************/
//icons for markers on map
Ui.markerIcons = {
    start: L.MakiMarkers.icon({
        icon: "circle-stroked",
        color: "#00b300",
        size: "m"
    }),
    via: L.MakiMarkers.icon({
        icon: "circle-stroked",
        color: "#ffb84d",
        size: "m"
    }),
    end: L.MakiMarkers.icon({
        icon: "circle-stroked",
        color: "#ff714d",
        size: "m"
    }),
    unset: L.MakiMarkers.icon({
        icon: "circle-stroked",
        color: "#e2e2e2",
        size: "m"
    }),
    emph: L.MakiMarkers.icon({
        icon: "circle-stroked",
        color: "#83e",
        size: "m"
    })
};
//icons for POI markers on map
Ui.poiIcons = {
    poi_9pin: 'img/poi/9pin.png',
    poi_10pin: 'img/poi/10pin.png',
    poi_archery: 'img/poi/archeery.png',
    //poi_arts_center : 'img/poi/arts_center.png',
    poi_athletics: 'img/poi/athletics.png',
    poi_atm: 'img/poi/atm.png',
    //poi_attraction : 'img/poi/attraction.png',
    poi_australian_football: 'img/poi/australian_football.png',
    poi_bakery: 'img/poi/bakery.png',
    poi_bank: 'img/poi/bank.png',
    poi_baseball: 'img/poi/baseball.png',
    poi_basketball: 'img/poi/basketball.png',
    poi_beachvolleyball: 'img/poi/beachvolleyball.png',
    //poi_bicycle_parking : img/poi/bicycle_parking.png',
    poi_biergarten: 'img/poi/biergarten.png',
    poi_boules: 'img/poi/boules.png',
    poi_bowls: 'img/poi/bowls.png',
    poi_bureau_de_change: 'img/poi/bureau_de_change.png',
    poi_bus_station: 'img/poi/bus_station.png',
    poi_bus_stop: 'img/poi/bus_stop.png',
    poi_butcher: 'img/poi/butcher.png',
    poi_cafe: 'img/poi/cafe.png',
    //poi_camp_site : 'img/poi/camp_site.png',
    poi_canoe: 'img/poi/canoe.png',
    //poi_castle : 'img/poi/castle.png',
    poi_chess: 'img/poi/chess.png',
    //poi_church : 'img/poi/church.png',
    poi_cinema: 'img/poi/cinema.png',
    poi_climbing: 'img/poi/climbing.png',
    poi_college: 'img/poi/college.png',
    poi_convenience: 'img/poi/convenience.png',
    poi_courthouse: 'img/poi/courthouse.png',
    poi_cricket: 'img/poi/cricket.png',
    poi_cricket_nets: 'img/poi/cricket_nets.png',
    poi_croquet: 'img/poi/croquet.png',
    poi_cycling: 'img/poi/cycling.png',
    poi_diving: 'img/poi/diving.png',
    poi_dog_racing: 'img/poi/dog_racing.png',
    poi_equestrian: 'img/poi/equestrian.png',
    poi_fast_food: 'img/poi/fast_food.png',
    //poi_fire_station : 'img/poi/fire_station.png',
    poi_fishing: 'img/poi/fishing.png',
    poi_football: 'img/poi/football.png',
    poi_fuel: 'img/poi/fuel.png',
    poi_garden: 'img/poi/garden.png',
    poi_golf: 'img/poi/golf.png',
    poi_golf_course: 'img/poi/golf.png',
    poi_guest_house: 'img/poi/guest_house.png',
    poi_gymnastics: 'img/poi/gymnastics.png',
    poi_hockey: 'img/poi/hockey.png',
    poi_horse_racing: 'img/poi/horse_racing.png',
    poi_hospital: 'img/poi/hospital.png',
    poi_hostel: 'img/poi/hostel.png',
    poi_hotel: 'img/poi/hotel.png',
    poi_ice_rink: 'img/poi/ice_rink.png',
    poi_information: 'img/poi/information.png',
    poi_kiosk: 'img/poi/kiosk.png',
    poi_korfball: 'img/poi/korfball.png',
    poi_library: 'img/poi/library.png',
    poi_marina: 'img/poi/marina.png',
    //poi_memorial : 'img/poi/memorial.png',
    poi_miniature_golf: 'img/poi/miniature_golf.png',
    //poi_monument : 'img/poi/monument.png',
    poi_motel: 'img/poi/motel.png',
    poi_motor: 'img/poi/motor.png',
    //poi_museum : 'img/poi/museum.png',
    poi_nature_reserve: 'img/poi/nature_reserve.png',
    poi_nightclub: 'img/poi/nightclub.png',
    poi_orienteering: 'img/poi/orienteering.png',
    poi_paddle_tennis: 'img/poi/tennis.png',
    poi_paragliding: 'img/poi/paragliding.png',
    poi_park: 'img/poi/park.png',
    poi_parking: 'img/poi/parking.png',
    poi_pelota: 'img/poi/pelota.png',
    poi_pharmacy: 'img/poi/pharmacy.png',
    poi_pitch: 'img/poi/pitch.png',
    poi_place_of_worship: 'img/poi/church.png',
    poi_playground: 'img/poi/playground.png',
    poi_police: 'img/poi/police.png',
    poi_post_box: 'img/poi/post_box.png',
    poi_post_office: 'img/poi/post_office.png',
    poi_pub: 'img/poi/pub.png',
    poi_public_building: 'img/poi/public_building.png',
    poi_raquet: 'img/poi/racquet.png',
    poi_railway_station: 'img/poi/railway_station.png',
    //poi_recreation : 'img/poi/recreation.png',
    //poi_recycling : 'img/poi/recycling.png',
    poi_restaurant: 'img/poi/restaurant.png',
    poi_rowing: 'img/poi/rowing.png',
    poi_rugby: 'img/poi/rugby.png',
    poi_school: 'img/poi/school.png',
    //poi_shelter : 'img/poi/shelter.png',
    poi_shooting: 'img/poi/shooting.png',
    poi_skateboard: 'img/poi/skateboard.png',
    poi_skating: 'img/poi/skating.png',
    poi_skiing: 'img/poi/skiing.png',
    poi_slipway: 'img/poi/slipway.png',
    poi_soccer: 'img/poi/soccer.png',
    poi_sports_center: 'img/poi/sports_centre.png',
    poi_squash: 'img/poi/squash.png',
    poi_stadium: 'img/poi/stadium.png',
    poi_subway_entrance: 'img/poi/subway_entrance.png',
    poi_supermarket: 'img/poi/supermarket.png',
    poi_swimming: 'img/poi/swimming.png',
    poi_table_tennis: 'img/poi/table_tennis.png',
    poi_taxi: 'img/poi/taxi.png',
    poi_team_handball: 'img/poi/team_handball.png',
    poi_telephone: 'img/poi/telephone.png',
    poi_tennis: 'img/poi/tennis.png',
    poi_theatre: 'img/poi/theatre.png',
    poi_toilets: 'img/poi/toilets.png',
    poi_townhall: 'img/poi/townhall.png',
    poi_track: 'img/poi/track.png',
    poi_tram_stop: 'img/poi/tram_stop.png',
    poi_university: 'img/poi/university.png',
    poi_viewpoint: 'img/poi/viewpoint.png',
    poi_volleyball: 'img/poi/volleyball.png',
    poi_water_park: 'img/poi/water_park.png',
    //default icon
    poi_default: 'img/poi/building_number.png'
};