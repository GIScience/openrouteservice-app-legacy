/**
 * Basic GUI class that represents the representation of ORS elements on the site
 * Various calsses extends this main GUI classs
 */
OpenRouteService.Gui = Class.create({

	getId : function() {
		return this.htmlRepresentation.id;
	},
	hide : function() {
		return $(this.htmlRepresentation).hide();
	},
	show : function() {
		return $(this.htmlRepresentation).show();
	},
	appendChild : function(element) {
		return this.htmlRepresentation.appendChild(element);
	},
	insert : function(container) {
		if(container)
			$(container).insert(this.htmlRepresentation);
	}
});

//define different icons used in GUI subclasses
var markerSize = new OpenLayers.Size(21, 30);
//var markerOffset = new OpenLayers.Pixel(-markerSize.w/2, -markerSize.h);
var markerOffset = new OpenLayers.Pixel(-10, -30);

OpenRouteService.Gui.icons = {
	start : new OpenLayers.Icon('img/marker-start.png', markerSize, markerOffset), //routeStartMarker.png'),
	via : new OpenLayers.Icon('img/marker-via.png', markerSize, markerOffset), //routeViaMarker.png'),
	end : new OpenLayers.Icon('img/marker-end.png', markerSize, markerOffset), //routeEndMarker.png')
	unset : new OpenLayers.Icon('img/marker.png', markerSize, markerOffset), //routeEndMarker.png')
	result : new OpenLayers.Icon('img/marker-poi.png', markerSize, markerOffset),
	resultEm : new OpenLayers.Icon('img/marker-poi-high.png', markerSize, markerOffset)
};

/**
 * icons used for different POI types
 */
OpenRouteService.Gui.poiIcons = {
	icons : new Hash({
		poi_9pin : new OpenLayers.Icon('img/poi/9pin.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_10pin : new OpenLayers.Icon('img/poi/10pin.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_archery : new OpenLayers.Icon('img/poi/archeery.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_arts_center : new OpenLayers.Icon('img/poi/arts_center.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_athletics : new OpenLayers.Icon('img/poi/athletics.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_atm : new OpenLayers.Icon('img/poi/atm.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_attraction : new OpenLayers.Icon('img/poi/attraction.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_australian_football : new OpenLayers.Icon('img/poi/australian_football.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_bakery : new OpenLayers.Icon('img/poi/bakery.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_bank : new OpenLayers.Icon('img/poi/bank.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_baseball : new OpenLayers.Icon('img/poi/baseball.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_basketball : new OpenLayers.Icon('img/poi/basketball.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_beachvolleyball : new OpenLayers.Icon('img/poi/beachvolleyball.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_bicycle_parking : new OpenLayers.Icon('img/poi/bicycle_parking.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_biergarten : new OpenLayers.Icon('img/poi/biergarten.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_boules : new OpenLayers.Icon('img/poi/boules.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_bowls : new OpenLayers.Icon('img/poi/bowls.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_bureau_de_change : new OpenLayers.Icon('img/poi/bureau_de_change.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_bus_station : new OpenLayers.Icon('img/poi/bus_station.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_bus_stop : new OpenLayers.Icon('img/poi/bus_stop.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_butcher : new OpenLayers.Icon('img/poi/butcher.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_cafe : new OpenLayers.Icon('img/poi/cafe.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_camp_site : new OpenLayers.Icon('img/poi/camp_site.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_canoe : new OpenLayers.Icon('img/poi/canoe.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_castle : new OpenLayers.Icon('img/poi/castle.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_chess : new OpenLayers.Icon('img/poi/chess.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_church : new OpenLayers.Icon('img/poi/church.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_cinema : new OpenLayers.Icon('img/poi/cinema.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_climbing : new OpenLayers.Icon('img/poi/climbing.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_college : new OpenLayers.Icon('img/poi/college.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_convenience : new OpenLayers.Icon('img/poi/convenience.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_courthouse : new OpenLayers.Icon('img/poi/courthouse.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_cricket : new OpenLayers.Icon('img/poi/cricket.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_cricket_nets : new OpenLayers.Icon('img/poi/cricket_nets.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_croquet : new OpenLayers.Icon('img/poi/croquet.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_cycling : new OpenLayers.Icon('img/poi/cycling.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_diving : new OpenLayers.Icon('img/poi/diving.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_dog_racing : new OpenLayers.Icon('img/poi/dog_racing.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_equestrian : new OpenLayers.Icon('img/poi/equestrian.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_fast_food : new OpenLayers.Icon('img/poi/fast_food.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_fire_station : new OpenLayers.Icon('img/poi/fire_station.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_fishing : new OpenLayers.Icon('img/poi/fishing.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_football : new OpenLayers.Icon('img/poi/football.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_fuel : new OpenLayers.Icon('img/poi/fuel.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_garden : new OpenLayers.Icon('img/poi/garden.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_golf : new OpenLayers.Icon('img/poi/golf.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_golf_course : new OpenLayers.Icon('img/poi/golf.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_guest_house : new OpenLayers.Icon('img/poi/guest_house.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_gymnastics : new OpenLayers.Icon('img/poi/gymnastics.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_hockey : new OpenLayers.Icon('img/poi/hockey.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_horse_racing : new OpenLayers.Icon('img/poi/horse_racing.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_hospital : new OpenLayers.Icon('img/poi/hospital.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_hostel : new OpenLayers.Icon('img/poi/hostel.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_hotel : new OpenLayers.Icon('img/poi/hotel.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_ice_rink : new OpenLayers.Icon('img/poi/ice_rink.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_information : new OpenLayers.Icon('img/poi/information.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_kiosk : new OpenLayers.Icon('img/poi/kiosk.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_korfball : new OpenLayers.Icon('img/poi/korfball.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_library : new OpenLayers.Icon('img/poi/library.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_marina : new OpenLayers.Icon('img/poi/marina.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_memorial : new OpenLayers.Icon('img/poi/memorial.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_miniature_golf : new OpenLayers.Icon('img/poi/miniature_golf.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_monument : new OpenLayers.Icon('img/poi/monument.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_motel : new OpenLayers.Icon('img/poi/motel.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_motor : new OpenLayers.Icon('img/poi/motor.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_museum : new OpenLayers.Icon('img/poi/museum.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_nature_reserve : new OpenLayers.Icon('img/poi/nature_reserve.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_nightclub : new OpenLayers.Icon('img/poi/nightclub.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_orienteering : new OpenLayers.Icon('img/poi/orienteering.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_paddle_tennis : new OpenLayers.Icon('img/poi/tennis.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_paragliding : new OpenLayers.Icon('img/poi/paragliding.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_park : new OpenLayers.Icon('img/poi/park.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_parking : new OpenLayers.Icon('img/poi/parking.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_pelota : new OpenLayers.Icon('img/poi/pelota.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_pharmacy : new OpenLayers.Icon('img/poi/pharmacy.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_pitch : new OpenLayers.Icon('img/poi/pitch.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_place_of_worship : new OpenLayers.Icon('img/poi/church.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_playground : new OpenLayers.Icon('img/poi/playground.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_police : new OpenLayers.Icon('img/poi/police.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_post_box : new OpenLayers.Icon('img/poi/post_box.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_post_office : new OpenLayers.Icon('img/poi/post_office.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_pub : new OpenLayers.Icon('img/poi/pub.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_public_building : new OpenLayers.Icon('img/poi/public_building.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_raquet : new OpenLayers.Icon('img/poi/racquet.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_railway_station : new OpenLayers.Icon('img/poi/railway_station.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_recreation : new OpenLayers.Icon('img/poi/recreation.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_recycling : new OpenLayers.Icon('img/poi/recycling.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_restaurant : new OpenLayers.Icon('img/poi/restaurant.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_rowing : new OpenLayers.Icon('img/poi/rowing.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_rugby : new OpenLayers.Icon('img/poi/rugby.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_school : new OpenLayers.Icon('img/poi/school.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//poi_shelter : new OpenLayers.Icon('img/poi/shelter.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_shooting : new OpenLayers.Icon('img/poi/shooting.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_skateboard : new OpenLayers.Icon('img/poi/skateboard.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_skating : new OpenLayers.Icon('img/poi/skating.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_skiing : new OpenLayers.Icon('img/poi/skiing.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_slipway : new OpenLayers.Icon('img/poi/slipway.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_soccer : new OpenLayers.Icon('img/poi/soccer.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_sports_center : new OpenLayers.Icon('img/poi/sports_centre.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_squash : new OpenLayers.Icon('img/poi/squash.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_stadium : new OpenLayers.Icon('img/poi/stadium.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_subway_entrance : new OpenLayers.Icon('img/poi/subway_entrance.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_supermarket : new OpenLayers.Icon('img/poi/supermarket.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_swimming : new OpenLayers.Icon('img/poi/swimming.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_table_tennis : new OpenLayers.Icon('img/poi/table_tennis.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_taxi : new OpenLayers.Icon('img/poi/taxi.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_team_handball : new OpenLayers.Icon('img/poi/team_handball.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_telephone : new OpenLayers.Icon('img/poi/telephone.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_tennis : new OpenLayers.Icon('img/poi/tennis.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_theatre : new OpenLayers.Icon('img/poi/theatre.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_toilets : new OpenLayers.Icon('img/poi/toilets.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_townhall : new OpenLayers.Icon('img/poi/townhall.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_track : new OpenLayers.Icon('img/poi/track.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_tram_stop : new OpenLayers.Icon('img/poi/tram_stop.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_university : new OpenLayers.Icon('img/poi/university.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_viewpoint : new OpenLayers.Icon('img/poi/viewpoint.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_volleyball : new OpenLayers.Icon('img/poi/volleyball.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		poi_water_park : new OpenLayers.Icon('img/poi/water_park.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12)),
		//default icon
		poi_default : new OpenLayers.Icon('img/poi/building_number.png', new OpenLayers.Size(24, 24), new OpenLayers.Pixel(-12,-12))
	}),
	
	/**
	 * @param: name of the icon to return
	 * @return: appropriate icon
	 */
	get : function(name) {
		return this.icons.get(name);
	}
};