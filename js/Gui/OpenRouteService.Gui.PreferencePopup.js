OpenRouteService.Gui.PreferencePopup = Class.create(OpenRouteService.Gui, {
	htmlRepresentation : null,
	route : null,

	initialize : function(route) {
		this.route = route;
		this.htmlRepresentation = new Element('div', {
			'id' : 'sitePrefsModal',
			'class' : 'modal hide fade',
			'tabindex' : '-1',
			'role' : 'dialog',
			'aria-labelledby' : 'sitePrefs'
		});
		
		//content of sitePrefs popup: header, body, footer
		var divHeader = new Element('div', {
			'class' : 'modal-header'
		})
		var divBody = new Element('div', {
			'class' : 'modal-body'
		});
		var divFooter = new Element('div', {
			'class' : 'modal-footer'
		})
		this.htmlRepresentation.appendChild(divHeader);
		this.htmlRepresentation.appendChild(divBody);
		this.htmlRepresentation.appendChild(divFooter);

		//specify header content
		var closeCross = new Element('a', {
			'href' : '#',
			'class' : 'close',
			'data-dismiss' : 'modal',
			'aria-hidden' : 'true'
		}).insert('&times;');
		var title = new Element('h3', {
			'id' : 'sitePrefs'
		}).insert(OpenRouteService.Preferences.translate('sitePreferences'));
		divHeader.appendChild(closeCross);
		divHeader.appendChild(title);

		//specify body content
		var heading = new Element('h4').insert(OpenRouteService.Preferences.translate('version'));
		var text = new Element('p').insert(OpenRouteService.Preferences.translate('versionText'));
		this.selectionVersion = new Element('select', {
			'id' : 'extendedVersionPrefs'
		});
		this.buildOptionList(this.selectionVersion, OpenRouteService.List.version, true, OpenRouteService.Preferences.version);
		text.appendChild(this.selectionVersion);
		divBody.appendChild(heading);
		divBody.appendChild(text);
		
		var heading = new Element('h4').insert(OpenRouteService.Preferences.translate('language'));
		var text = new Element('p').insert(OpenRouteService.Preferences.translate('languageText'));
		this.selectionLang = new Element('select', {
			'id' : 'languagePrefs'
		});
		this.buildOptionList(this.selectionLang, OpenRouteService.List.languages, true, OpenRouteService.Preferences.language);
		text.appendChild(this.selectionLang);
		divBody.appendChild(heading);
		divBody.appendChild(text);

		var heading = new Element('h4').insert(OpenRouteService.Preferences.translate('distance'));
		var text = new Element('p').insert(OpenRouteService.Preferences.translate('distanceText'));
		this.selectionUnit = new Element('select', {
			'id' : 'unitPrefs'
		});
		this.buildOptionList(this.selectionUnit, OpenRouteService.List.distanceUnitsRoute, false, OpenRouteService.Preferences.distanceUnit);
		text.appendChild(this.selectionUnit);
		divBody.appendChild(heading);
		divBody.appendChild(text);

		//specify footer content
		var closeBtn = new Element('button', {
			'class' : 'btn',
			'data-dismiss' : 'modal',
			'aria-hidden' : 'true'
		}).insert(OpenRouteService.Preferences.translate('closeBtn'));
		var saveBtn = new Element('button', {
			'class' : 'btn btn-primary',
			'id' : 'savePrefsBtn'
		}).insert(OpenRouteService.Preferences.translate('saveBtn'));
		
		var self  = this;
		$(saveBtn).observe('click', function () {
			self.savePrefs(self.route);
			//close popup window
			jQuery.noConflict();
			(function($) {
				$('#sitePrefsModal').modal('hide');
			})(jQuery);
		});
		divFooter.appendChild(closeBtn);
		divFooter.appendChild(saveBtn);
	},
	/**
	 * PRIVAATE METHOD, do not call from outside the class!
	 * Fills the given HTML-selection tag with options from the given list.
	 * @param parentElement: the HTML-selection tag to append options to
	 * @param listItems: items to append
	 * @param lookUpTranslations : true, if all listItems should be translated to the current language before appending
	 * @param gobalParam: the globalParam is pre-selected in the list
	 */
	buildOptionList : function(parentElement, listItems, lookUpTranslations, globalParam) {
		var optionItems = [];
		if (lookUpTranslations) {
			for (var i = 0; i < listItems.length; i++) {
				optionItems.push(OpenRouteService.Preferences.translate(listItems[i]));	
			}
		} else {
			optionItems = listItems;
		}
		
		//generate option elements
		for(var i = 0; i < optionItems.length; i++) {
			var option = new Element('option', {
				'value' : i
			}).insert(optionItems[i]);
			if (listItems[i] == globalParam) {
				option.setAttribute('selected', 'true');
			}
			parentElement.appendChild(option);
		}
	},
	/**
	 * saves site preferences in a cookie when save button has been clicked.
	 * If necessary, triggers reloading of page (with new language)
	 */
	savePrefs : function(route) {
		//extract selected preferences
		var lang = this.selectionLang.childNodes[0];
		for (var i = 0; i < this.selectionLang.length; i++) {
			if (this.selectionLang.childNodes[i].selected) {
				lang = this.selectionLang.childNodes[i].value;
			}
		}
		var unit = this.selectionUnit.childNodes[0];
		for (var i = 0; i < this.selectionUnit.length; i++) {
			if (this.selectionUnit.childNodes[i].selected) {
				unit = this.selectionUnit.childNodes[i].value;
			}
		}
		var version = this.selectionVersion.childNodes[0];
		for (var i = 0; i < this.selectionVersion.length; i++) {
			if (this.selectionVersion.childNodes[i].selected) {
				version = this.selectionVersion.childNodes[i].value;
			}
		}
		OpenRouteService.Preferences.savePrefs([route, lang, unit, version]);
	}
});