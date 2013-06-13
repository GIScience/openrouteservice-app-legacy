/**
 * Class: OpenRouteService.Gui.Collapsible.RouteOptions
 * This class represents route options for calculating a route in different ways, e.g. going via car, via mountainbike or by foot
 */
OpenRouteService.Gui.Collapsible.RouteOptions = Class.create(OpenRouteService.Gui.Collapsible, {
	//panel that contains avoidMotorways, avoidTollways
	avoidablePanel : null,
	//panels with extended options for route via car/ bike/ pedestrian
	extendedOptions : null,

	avoidAreas : [],

	/**
	 * Is called by OpenRouteService.Gui.Route
	 */
	initialize : function(routeOption, motorwayOption, tollwayOption, avoidAreas, map) {
		var self = this;
		this.init();
		this.map = map;
		this.head.update(OpenRouteService.Preferences.translate('routeOptions') + ':<br>');

		this.avoidablePanel = new Element('div', {
			'class' : 'panel panelMedium'
		});

		this.insertRoutePreferences();
		this.setRoutePreference(routeOption);

		this.insertRouteAvoidables();
		this.setAvoidMotorways(motorwayOption);
		this.setAvoidTollways(tollwayOption);

		this.insertRouteAvoidAreas();
		this.setAvoidAreas(avoidAreas);
	},
	/**
	 * inserts the content of the routing preference options (shortest, fastest, car, bike,...) in the container
	 */
	insertRoutePreferences : function() {
		var mainPrefs = OpenRouteService.List.routePreferences.keys();
		var preferenceImages = OpenRouteService.List.routePreferencesImages;

		//create container for the buttons; contains car, pedestrian, bike
		this.preferenceButtonContainer = new Element('div', {
			'class' : 'btn-group routePreferenceBtns'
		});
		this.body.insert(this.preferenceButtonContainer);

		this.extendedOptions = [];

		//create the buttons for car, bike, pedestrian,... and place them inside the preferenceButtonContainer
		for (var i = 0; i < mainPrefs.length; i++) {
			var container = new Element('label');
			var btn = new Element('button', {
				'id' : mainPrefs[i],
				'class' : 'btn routeOptionsButton'
			});

			//add exteded options for car/bike/pedestrian in a new panel
			var extensions = new Element('div', {
				'class' : 'panel panelMedium'
			});
			this.extendedOptions.push(extensions);
			this.body.insert(extensions);

			var extendedOptions = OpenRouteService.List.routePreferences.get(mainPrefs[i]);
			for (var j = 0; j < extendedOptions.length; j++) {
				//container for the radio buttons (required for layout)
				var itemContainer = new Element('label', {
					'class' : 'radio'
				});
				//the radio button itself
				var item = new Element('div');
				var radio = "<input type='radio' id='" + extendedOptions[j] + "' name='" + mainPrefs[i] + "'>" + OpenRouteService.Preferences.translate(extendedOptions[j]) + "</input>";
				item.innerHTML = radio;
				item.observe('change', function() {
					document.fire('routePreference:changed');
				});
				itemContainer.appendChild(item);
				extensions.appendChild(itemContainer);
			}

			//when a button is clicked, it will be marked active (all others inactive) and the appropriate extended option list will be shown
			var self = this;
			btn.observe('click', function() {
				var idName = this.getAttribute('id');
				for (var j = 0; j < self.preferenceButtonContainer.childNodes.length; j++) {
					if (idName == self.preferenceButtonContainer.childNodes[j].id) {
						//change clicked button to green/ active:
						self.preferenceButtonContainer.childNodes[j].innerHTML = "<img src='" + preferenceImages.get(idName)[1] + "'/>";
						this.addClassName('active');
						if (mainPrefs[j] == 'car') {
							//display avoid motorways/ tollways if option "car" is selected
							self.avoidablePanel.show();
						} else {
							//hide motorways/ tollways option for bike and pedestrian
							self.avoidablePanel.hide();
						}
						self.extendedOptions[j].show();
					} else {
						//change all other buttons to grey/ inactive:
						self.preferenceButtonContainer.childNodes[j].removeClassName('active');
						self.preferenceButtonContainer.childNodes[j].innerHTML = "<img src='" + preferenceImages.get(mainPrefs[j])[0] + "'/>";
						self.extendedOptions[j].hide();
					}
				}
				document.fire('routePreference:changed');
			});
			this.preferenceButtonContainer.appendChild(btn);
		}
	},
	/**
	 * place options like "avoid motorways" or "avoid tollways" in an extra panel below the extended route options
	 */
	insertRouteAvoidables : function() {
		//uses this.avoidablePanel to insert options in.

		var motorContainer = new Element('label', {
			'class' : 'checkbox'
		});
		this.avoidMotor = new Element('input', {
			'type' : 'checkbox',
			'id' : 'motorways'
		});
		motorContainer.insert(this.avoidMotor);
		motorContainer.insert(OpenRouteService.Preferences.translate('avoidMotorways'));
		this.avoidablePanel.insert(motorContainer);
		motorContainer.observe('change', function() {
			document.fire('routePreference:changed');
		});
		var tollContainer = new Element('label', {
			'class' : 'checkbox'
		});
		this.avoidToll = new Element('input', {
			'type' : 'checkbox',
			'id' : 'motorways'
		});
		tollContainer.insert(this.avoidToll);
		tollContainer.insert(OpenRouteService.Preferences.translate('avoidTollways'));
		tollContainer.observe('change', function() {
			document.fire('routePreference:changed');
		});
		this.avoidablePanel.insert(tollContainer);
		this.body.insert(this.avoidablePanel);
	},
	/**
	 * inserts buttons to draw avoid areas in a panel
	 */
	insertRouteAvoidAreas : function() {
		var layerAvoid = this.map.getLayersByName(OpenRouteService.Map.AVOID)[0];
		
		var avoidTools = {
			'avoidCreate': new OpenLayers.Control.DrawFeature(layerAvoid, OpenLayers.Handler.Polygon, {
				title : OpenRouteService.Preferences.translate('avoidAreaDraw'),
				featureAdded : function() {
					document.fire('routePreference:changed');
				}
			}), 
			'avoidEdit': new OpenLayers.Control.ModifyFeature(layerAvoid, {
				title : OpenRouteService.Preferences.translate('avoidAreaModify'),
				unselectFeature : function() {
					this.deactivate();
					this.activate();
					document.fire('routePreference:changed');
				}
			}),
			'avoidRemove': new OpenLayers.Control.SelectFeature(layerAvoid, {
				onSelect : function(feature) {
					layerAvoid.removeFeatures([feature]);
					document.fire('routePreference:changed');
				},
				title : OpenRouteService.Preferences.translate('avoidAreaRemove'),
			})
		};

		for (var key in avoidTools) {
			this.map.addControl(avoidTools[key]);
		}

		
		
		function handleButtonClick(ev) {
			var actives = 0;
			var target = (ev.target.tagName === 'BUTTON' ? ev.target : $(ev.target).up(0));
			for (var key in avoidTools) {
				if (key === target.value && !avoidTools[key].active) {
					avoidTools[key].activate();
					
					$(target).addClassName('active');
					actives++;
				} else {
					avoidTools[key].deactivate();
					$$('button[value="' + key + '"]')[0].removeClassName('active');
				}
			}
			
			
			//if there is one control active...
			if (actives > 0) {
				//we must disable the selectFeature handler; otherwise the route points layer remains on top of the avoid area layer
				var layerRoutePoints = self.map.getLayersByName(OpenRouteService.Map.ROUTE_POINTS)[0];
				layerRoutePoints.selectWaypoint.deactivate();
			} else {
				//re-enable the selectFeature handler for waypoints
				var layerRoutePoints = self.map.getLayersByName(OpenRouteService.Map.ROUTE_POINTS)[0];
				layerRoutePoints.selectWaypoint.activate();
			}
		}
		
		
		var avoidAreasPanel = new Element('div', {
			'class' : 'panel panelMedium',
			'id' : 'avoidAreas'
		});
		this.body.insert(avoidAreasPanel);

		//avoid areas are only available in the extended version
		if (OpenRouteService.Preferences.version != OpenRouteService.VERSION_EXTENDED) {
			avoidAreasPanel.hide();
		}

		var title = new Element('label', {
			'id' : 'avoidAreasTitle'
		}).insert(OpenRouteService.Preferences.translate('avoidAreas'));
		avoidAreasPanel.insert(title);

		var container = new Element('div', {
			'id' : 'avoidAreasToolbar'
		});
		avoidAreasPanel.insert(container);
		
		var avoidButtons = new Element('div', {
			'class': 'btn-group'
		});
		container.insert(avoidButtons);
		
		var avoidCreate = new Element('button', {
			'class': 'btn',
			'value': 'avoidCreate'
		}).update('<img src="img/avoid-plus.png">').observe('click', handleButtonClick);
		avoidButtons.insert(avoidCreate);
		
		var avoidEdit = new Element('button', {
			'class': 'btn',
			'value': 'avoidEdit'
		}).update('<img src="img/avoid-edit.png">').observe('click', handleButtonClick);
		avoidButtons.insert(avoidEdit);
		
		var avoidRemove = new Element('button', {
			'class': 'btn',
			'value': 'avoidRemove'
		}).update('<img src="img/avoid-minus.png">').observe('click', handleButtonClick);
		avoidButtons.insert(avoidRemove);
	},
	/**
	 * @return the currently selected route option (checked radiobutton), e.g. 'fastest'
	 */
	getRoutePreference : function() {
		//loop through car/bike/pedestrian
		for (var i = 0; i < this.extendedOptions.length; i++) {
			//the options panel that is currently visible has NO display attribute set. All other panels are set to 'display:none'
			if (this.extendedOptions[i].style.display.length == 0) {
				//loop through extended otpions for e.g. car: fastest/ shortest
				for (var j = 0; j < this.extendedOptions[i].childNodes.length; j++) {
					var currentOption = this.extendedOptions[i].childNodes[j].firstChild.firstChild;
					if (currentOption.checked == true) {
						//e.g. 'fastest'
						return currentOption.id;
					}
				}
			}
		}
	},
	/**
	 * sets the given option as active routing option
	 * @currentOption: the routing option to set, e.g. 'fastest'
	 */
	setRoutePreference : function(currentOption) {
		//check if the given parameter is a valid option. If not, set it to "car: fastest"
		var defaultOption;
		var validOption = false;
		var mainPrefs = OpenRouteService.List.routePreferences.keys();
		for (var i = 0; i < mainPrefs.length; i++) {
			extendedPrefs = OpenRouteService.List.routePreferences.get(mainPrefs[i]);
			for (var j = 0; j < extendedPrefs.length; j++) {
				if (i == 0 && j == 0) {
					defaultOption = extendedPrefs[j];
				}
				if (currentOption == extendedPrefs[j]) {
					validOption = true;
					i = mainPrefs.length;
					break;
				}
			}
		}
		if (validOption == false) {
			//the parameter given is no valid route preference -> set to default
			currentOption = defaultOption;
		}

		//set option to active (button and radio button)
		var allTypes = OpenRouteService.List.routePreferences.values();
		for (var i = 0; i < allTypes.length; i++) {
			for (var j = 0; j < allTypes[i].length; j++) {
				//default: always check first option. Needs to be done, otherwise some panels do not have a radio button checked
				if (j == 0) {
					this.extendedOptions[i].childNodes[j].firstChild.firstChild.checked = true;
				}
				//set given option as active
				if (allTypes[i][j] == currentOption) {
					this.preferenceButtonContainer.childNodes[i].click();
					//if we leave this out, it acts very strange...
					this.extendedOptions[i].childNodes[0].firstChild.firstChild.checked = false;
					this.extendedOptions[i].childNodes[j].firstChild.firstChild.checked = true;
				}
			}
		}
		//trigger recalculation of route
		document.fire('routePreference:changed');
	},
	/**
	 * @return: true, if "no motorways" is set to true; false otherwise
	 */
	getAvoidMotorways : function() {
		return this.avoidMotor.checked;
	},
	/**
	 * @return: true, if "no tollways" is set to true; false otherwise
	 */
	getAvoidTollways : function() {
		return this.avoidToll.checked;
	},
	/**
	 *@return: avoid areas as feature vector 
	 */
	getAvoidAreas : function() {
		var layerAvoid = this.map.getLayersByName(OpenRouteService.Map.AVOID)[0];
		return layerAvoid.features;
	},
	/**
	 *@return: avoid areas as string (e.g. for HTTP GET parameters) 
	 */
	getAvoidAreasString : function() {
		var layerAvoid = this.map.getLayersByName(OpenRouteService.Map.AVOID)[0];

		//serialize these features to string
		var avAreaString = "";
		for (var avAreas = 0; avAreas < layerAvoid.features.length; avAreas++) {
			var avAreaPoints = layerAvoid.features[avAreas].geometry.components[0].components;
			for (var pt = 0; pt < avAreaPoints.length; pt++) {
				avAreaString += avAreaPoints[pt].x + "%2C" + avAreaPoints[pt].y + "%2C";
			}
		}
		//slice away the last separator '%2C'
		avAreaString = avAreaString.substring(0, avAreaString.length - 3);
		return avAreaString;
	},
	/**
	 * set option "avoid motorways" to given parameter
	 * @param option: true, if route calculation should avoid motorways; false otherwise
	 */
	setAvoidMotorways : function(option) {
		if (!option) {
			option = false;
		} else {
			option = option.toLowerCase() == 'true';
		}
		this.avoidMotor.checked = option;
	},
	/**
	 * set option "avoid tollways" to given parameter
	 * @param option: true, if route calculation should avoid tollways; false otherwise
	 */
	setAvoidTollways : function(option) {
		if (!option) {
			option = false;
		} else {
			option = option.toLowerCase() == 'true';
		}
		this.avoidToll.checked = option;
	},
	/**
	 * sets the given avoid area (an area that should be avoided when calculating a route)
	 * @param {Object} avoidAreas: array containing points for the avoid areas to set; one avoid area of e.g. 3 corners contains 4 points; 1st and last point are equal
	 */
	setAvoidAreas : function(avoidAreas) {
		if (avoidAreas && avoidAreas.length > 0) {
			//parse array with points to one or more avoid areas (feature vectors)
			var avoidAreasFeatures = [];
			var layerAvoid = this.map.getLayersByName(OpenRouteService.Map.AVOID)[0];

			for (var i = 0; i < avoidAreas.length; i++) {
				if (avoidAreas[i].length == 2) {
					var x = avoidAreas[i][0];
					var y = avoidAreas[i][1];
					var pt = new OpenLayers.Geometry.Point(x, y);
					avoidAreasFeatures.push(pt);

					if (avoidAreasFeatures.length > 1 && avoidAreasFeatures[0].x == pt.x && avoidAreasFeatures[0].y == pt.y) {
						//one avoid area is complete; first point matches last point -> generate a polygon
						var poly = new OpenLayers.Geometry.Polygon(new OpenLayers.Geometry.LinearRing(avoidAreasFeatures));
						var featureVec = new OpenLayers.Feature.Vector(poly);
						featureVec.layer = layerAvoid;
						layerAvoid.addFeatures([featureVec]);
						avoidAreasFeatures = [];
					}
				}
			}
		}
	}
});
