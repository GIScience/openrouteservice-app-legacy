/**
 * various keyword lists used in the ORS application
 */
OpenRouteService.VERSION_STANDARD = 'standardVersion';
OpenRouteService.VERSION_EXTENDED = 'extendedVersion';

OpenRouteService.List = {
	languages: ['de', 'en'], //TODO will be included as soon as translations are available: 'es', 'fr'],
	
	//if this is changed, please adapt the distance calculation in ORS.Gui.SearchPoi.observeInputfield
	distanceUnits: ['m', 'km', 'yd', 'mi'],
	distanceUnitsRoute: ['m / km', 'yd / mi'],
	
	poiCategories: ['amenity', 'public_tran', 'shop', 'tourism', 'leisure', 'sport'],
	
	poiTypes: new Hash({
		'amenity': ['atm', 'bank', 'bureau_de_change', 'biergarten', 'bus_station', 'cafe', 'cinema', 'college', 'courthouse',
			'fast_food', 'fuel', 'hospital', 'library', 'nightclub', 'parking', 'pharmacy', 'place_of_worship', 'police', 
			'post_box', 'post_office', 'pub', 'public_building', 'restaurant', 'school', 'taxi', 'telephone', 'theatre', 
			'toilets', 'townhall', 'university'], 
		'public_tran': ['bus_stop', 'bus_station', 'railway_station', 'tram_stop', 'subway_entrance', 'parking'], 
		'shop': ['supermarket', 'convenience', 'bakery', 'butcher', 'kiosk'], 
		'tourism': ['information','hotel', 'motel', 'guest_house', 'hostel', 'camp_site', 'caravan_site', 'chalet', 'viewpoint'], 
		'leisure': ['sports_centre', 'golf_course', 'stadium', 'track', 'pitch', 'water_park', 'marina', 'slipway', 'fishing', 'nature_reserve', 
			'park', 'playground', 'garden', 'ice_rink', 'miniature_golf'], 
		'sport': ['9pin', '10pin', 'archery', 'athletics', 'australian_football', 'baseball', 'basketball', 'beachvolleyball', 'boules', 'bowls', 
			'canoe', 'chess', 'climbing','cricket', 'cricket_nets', 'croquet', 'cycling', 'diving', 'dog_racing', 'equestrian', 'football', 'golf', 'gymnastics', 
			'hockey', 'horse_racing', 'korfball', 'motor', 'orienteering', 'paddle_tennis', 'squash', 'paragliding', 'pelota', 'racquet', 'rowing', 'rugby', 
			'shooting', 'skating', 'skateboard', 'skiing', 'soccer', 'swimming', 'table_tennis', 'team_handball', 'tennis', 'volleyball']
	}),

	//please make sure that each category contains at least one element. all names in the hash have to be unique.
	routePreferences: new Hash({
		'car': ['Fastest', 'Shortest'],
		'bicycle': ['Bicycle', 'BicycleSafety', 'BicycleRoute', 'BicycleMTB', 'BicycleRacer'],
		'pedestrian': ['Pedestrian']
	}),
	
	routePreferencesImages: new Hash({
		'car': ['img/picto-car.png', 'img/picto-car-high.png'],
		'bicycle': ['img/picto-bike.png', 'img/picto-bike-high.png'],
		'pedestrian' : ['img/picto-dude.png', 'img/picto-dude-high.png']
	}), 
	
	version : [OpenRouteService.VERSION_STANDARD, OpenRouteService.VERSION_EXTENDED]
};