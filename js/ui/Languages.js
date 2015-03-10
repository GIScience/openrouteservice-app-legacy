/**
 * Languages defines the various languages offered by ORS (site languages, not to be confused with the language of routing instructions)
 * based on the selected language, all site labels have to be loaded accordingly
 */
var Languages = (function(w) {'use strict';

	var $ = w.jQuery, p = w.Preferences;

	function Languages() {
	}

	/**
	 * Load labels in appropriate language
	 */
	function applyLanguage() {
		//nav bar on top
		$('#menuLinkSitePrefs').html(p.translate('sitePreferences'));
		$('#menuLinkInfo').html(p.translate('contact'));

		//sidebar left
		$('#routeLabel').html(p.translate('routePlanner'));
		$('#searchLabel').html(p.translate('search'));

		//route options
		$('#routeOptions').html(p.translate('routeOptions') + ':' + '<br/>');
		$('#fastestLabel').html(p.translate('Fastest'));
		$('#shortestLabel').html(p.translate('Shortest'));
		$('#BicycleLabel').html(p.translate('Bicycle'));
		$('#BicycleSafetyLabel').html(p.translate('BicycleSafety'));
		$('#BicycleRouteLabel').html(p.translate('BicycleRoute'));
		$('#BicycleMtbLabel').html(p.translate('BicycleMTB'));
		$('#BicycleRacerLabel').html(p.translate('BicycleRacer'));
		$('#PedestrianLabel').html(p.translate('Pedestrian'));
		$('#WheelchairLabel').html(p.translate('Wheelchair'));
		$('#avoidMotorLabel').html(p.translate('avoidMotorways'));
		$('#avoidTollLabel').html(p.translate('avoidTollways'));
		$('#avoidAreasTitle').html(p.translate('avoidAreas'));
		
		//wheelchair parameters
		$('#surfaceLabel').html(p.translate('surface'));
		$('#asphaltOption').html(p.translate('asphalt'));
		$('#cobblestoneFlattenedOption').html(p.translate('cobblestone:flattened'));
		$('#cobblestoneOption').html(p.translate('cobblestone'));
		$('#compactedOption').html(p.translate('compacted'));
		$('#allSurfacesOption').html(p.translate('all_surfaces'));
		
		$('#smoothnessLabel').html(p.translate('smoothness'));
		$('#excellentOption').html(p.translate('excellent'));
		$('#goodOption').html(p.translate('good'));
		$('#intermediateOption').html(p.translate('intermediate'));
		$('#badOption').html(p.translate('bad'));
		$('#allSmoothnessesOption').html(p.translate('all_smoothnesses'));
		
		$('#inclineLabel').html(p.translate('incline'));
		$('#threePercentOption').html(p.translate('threepercent'));
		$('#sixPercentOption').html(p.translate('sixpercent'));
		$('#tenPercentOption').html(p.translate('tenpercent'));
		$('#fifteenPercentOption').html(p.translate('fifteenpercent'));
		$('#allInclinesOption').html(p.translate('all_inclines'));
		
		$('#slopedCurbLabel').html(p.translate('sloped_curb'));
		$('#threeCmOption').html(p.translate('threecm'));
		$('#sixCmOption').html(p.translate('sixcm'));
		$('#tenCmOption').html(p.translate('tencm'));
		$('#allSlopedCurbesOption').html(p.translate('all_sloped_curbs'));
		
		//routing
		$('#resetRoute').html(p.translate('resetRoute'));
		$('.searchWaypoint').attr('placeholder', p.translate('enterAddress'));
		$('#addWaypoint').html(p.translate('addWaypoint'));
		$('#routeSummaryHead').html(p.translate('routeSummary') + ':');
		$('#routeInstructionHead').html(p.translate('routeInstructions') + ':');
		$('#zoomToRouteButton').html(p.translate('zoomToRoute'));

		//route extras
		$('#routeExtrasHead').html(p.translate('routeExtras') + ':');
		//permalink
		$('#permalinkLabel').html(p.translate('routeLinkText'));
		$('#fnct_permalink').html(p.translate('permalinkButton'));
		//accessibility
		$('#accessibilityAnalysisLabel').html(p.translate('accessibilityAnalysis'));
		$('#accessibilityAnalysisMinutes').html(p.translate('setAccessibilityMinutes'));
		$('#analyzeAccessibility').html(p.translate('analyze'));
		$('#accessibilityCalculation').html(p.translate('calculatingAccessibility'));
		$('#accessibilityError').html(p.translate('accessibilityError'));
		//export/ import
		$('#imExportLabel').html('<b>' + p.translate('imExport') + '</b>');
		$('#exportInfoLabel').html(p.translate('gpxDownloadText'));
		$('#exportRouteGpx').html(p.translate('gpxDownloadButton'));
		$('#exportGpxError').html(p.translate('gpxDownloadError'));
		$('#importRouteInfoLabel').html(p.translate('gpxUploadRouteText'));
		$('#importTrackInfoLabel').html(p.translate('gpxUploadTrackText'));
		$('#importGpxError').html(p.translate('gpxUploadError'));
		$('.fileUploadNewLabel').html(p.translate('selectFile'));
		$('.fileUploadExistsLabel').html(p.translate('changeFile'));

		//geolocation
		$('#geolocationHead').html(p.translate('currentLocation'));
		$('#fnct_geolocation').html(p.translate('showCurrentLocation'));

		//search address
		$('#searchAddressHead').html(p.translate('searchForPoints'));
		$('#fnct_searchAddress').attr('placeholder', p.translate('enterAddress'));

		//search POI
		$('#searchPoiHead').html(p.translate('searchForPoi'));
		$('#searchPoiWithin1').html('&nbsp;' + p.translate('poiNearRoute1'));
		$('#searchPoiWithin2').html(p.translate('poiNearRoute2'));
		$('#fnct_searchPoi').attr('placeholder', p.translate('enterPoi'));

		//preference popup
		$('#sitePrefs').html(p.translate('sitePreferences'));
		$('#versionLabel').html(p.translate('version'));
		$('#versionText').html(p.translate('versionText'));
		$('#languageLabel').html(p.translate('language'));
		$('#languageText').html(p.translate('languageText'));
		$('#routingLanguageLabel').html(p.translate('routingLanguage'));
		$('#routingLanguageText').html(p.translate('routingLanguageText'));
		$('#distanceUnitLabel').html(p.translate('distance'));
		$('#distanceUnitText').html(p.translate('distanceText'));
		$('#preferencesClose').html(p.translate('closeBtn'));
		$('#savePrefsBtn').html(p.translate('saveBtn'));

		//context menu
		$('#contextStart').html(p.translate('useAsStartPoint'));
		$('#contextVia').html(p.translate('useAsViaPoint'));
		$('#contextEnd').html(p.translate('useAsEndPoint'));
	}

	/**
	 * auto-completion for the POI search 
	 */
	function loadPoiTypeData() {
		var categoriesToDisplay = [];
		var dummyDiv = new Element('div');
		var typeCategories = $A(list.poiTypes.keys()).each(function(poiType) {
			var detailedTypes = list.poiTypes.get(poiType);

			//trick to decode HTML signs
			dummyDiv.innerHTML = p.translate(poiType);
			var decoded = dummyDiv.firstChild.nodeValue;
			categoriesToDisplay.push(decoded);

			$A(detailedTypes).each(function(detailedType) {
				//trick to decode HTML signs
				dummyDiv.innerHTML = p.translate(detailedType);
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

	/**
	 * select dropdowns in the preference popup window for language, distance unit, etc. 
	 */
	function loadPreferencePopupData() {
		//versions
		var container = $('#extendedVersionPrefs');
		for (var i = 0; i < list.version.length; i++) {
			var optionElement = new Element('option', {
				'value' : i
			});
			if (i == 0) {
				optionElement.selected = true;
			}
			$(optionElement).html(p.translate(list.version[i]));
			container.append(optionElement);
		}
		//languages
		container = $('#languagePrefs');
		for (var i = 0; i < list.languages.length; i++) {
			var optionElement = new Element('option', {
				'value' : i
			});
			if (i == 0) {
				optionElement.selected = true;
			}
			$(optionElement).html(p.translate(list.languages[i]));
			container.append(optionElement);
		}

		//routing languages
		container = $('#routingLanguagePrefs');
		for (var i = 0; i < list.routingLanguages.length; i++) {
			var optionElement = new Element('option', {
				'value' : i
			});
			if (i == 0) {
				optionElement.selected = true;
			}
			$(optionElement).html(p.translate(list.routingLanguages[i]));
			container.append(optionElement);
		}

		//distance units
		container = $('#unitPrefs');
		for (var i = 0; i < list.distanceUnitsPreferences.length; i++) {
			var optionElement = new Element('option', {
				'value' : i
			});
			if (i == 0) {
				optionElement.selected = true;
			}
			$(optionElement).html(list.distanceUnitsInPopup[i]);
			container.append(optionElement);
		}
	}
	
	/**
	 * auto-build dropdown menu for distance unit selection 
	 */
	function loadPoiDistanceUnitData() {
		var container = $('#fnct_searchPoi_distanceUnit');
		for (var i = 0; i < list.distanceUnits.length; i++) {
			var optionElement = new Element('option', {
				'value' : list.distanceUnits[i]
			});
			if (i == 0) {
				optionElement.selected = true;
			}
			$(optionElement).html(list.distanceUnits[i]);
			container.append(optionElement);
		}
	}


	Languages.prototype.applyLanguage = applyLanguage;
	
	Languages.prototype.loadPoiTypeData = loadPoiTypeData;
	Languages.prototype.loadPreferencePopupData = loadPreferencePopupData;
	Languages.prototype.loadPoiDistanceUnitData = loadPoiDistanceUnitData;

	return new Languages();
})(window);
