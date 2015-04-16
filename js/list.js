/**
 * various keyword lists used in the ORS application
 */

list = {
	languages: ['de', 'en', 'pl'], 
	
	routingLanguages : ['en', 'de', 'pl', 'bg', 'cz', 'nl', 'hr', 'hu', 'nl_BE', 'es', 'eo', 'fi', 'fr', 'it', 'pt_BR', 'ro', 'ru', 'se', 'dk', 'tr', 'ca', 'ja', 'no', 'vi', 'nb', 'de-rheinl', 'de-opplat', 'de-berlin', 'de-swabia', 'de-ruhrpo', 'de-at-ooe', 'de-bay'],
		
	distanceUnits: ['m', 'km', 'yd', 'mi'],
	distanceUnitsPreferences : ['m', 'yd'],
	//as visible in the user preferences popup
	distanceUnitsInPopup: ['m / km', 'yd / mi'],
	
	version : ['standardVersion', 'extendedVersion'],
	
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
		'pedestrian': ['Pedestrian'],
		'car': ['Fastest', 'Shortest'],
		'wheelchair': ['Wheelchair']
	}),
	
	routeAvoidables : ['Highway', 'Tollway', 'Unpavedroads', 'Ferry'],

	truckParams : ['value_length_slide', 'value_height_slide', 'value_weigth_slide',, 'value_width_slide'],
	
	routePreferencesImages: new Hash({
		'car': ['img/picto-car.png', 'img/picto-car-high.png'],
		'bicycle': ['img/picto-bike.png', 'img/picto-bike-high.png'],
		'pedestrian' : ['img/picto-dude.png', 'img/picto-dude-high.png'],
		'truck' : ['img/picto-truck.png', 'img/picto-truck-high.png'],
		'wheelchair' : ['img/picto-wheelchair.png', 'img/picto-wheelchair-high.png']
	}),
	
	//please make sure that each category contains at least one element. all names in the hash have to be unique.
	wheelchairParameters: new Hash({
		/*
		'Surface': ['paved', 'asphalt', 'concrete', 'paving_stones', 'concrete:plates', 'cobblestone:flattened', 'concrete:lanes',
		            'cobblestone', 'unpaved', 'fine_gravel', 'compacted', 'metal', 'ice', 'grass_paver', 'sand', 'dirt', 
		            'earth', 'grass', 'gravel', 'ground', 'mud', 'pebblestone', 'salt', 'snow', 'wood', 'woodchips'],
		*/
		'Surface': ['concrete', 'cobblestone:flattened', 'cobblestone', 'compacted', 'any'],
		'Smoothness': ['excellent', 'good', 'intermediate', 'bad', 'any'],
		'Tracktype': ['grade1', 'grade2', 'grade3', 'grade4', 'any'],
		'Incline': ['3', '6', '10', '15', '31'],
		'SlopedCurb': ['0.03', '0.06', '0.1', '0.31']
	}),
};