/* 
 * Functions for click events and animations on mobile menus */

/*Main jQuery function to show and hide Mobile Visualization, depending on the device resolution
jQuery(document).ready(function(){ 
	jQuery(window).on('load resize', function(){
		Detect the mobile device screen size
		var MobWidth = window.screen.width;
		var MobHeight = window.screen.height; 
		if ($(MobWidth) <= 1280 ) {
			
			Needed for to adapt to the screen of mobile devices. It will always mainstains the scale of the app
			jQuery("head").append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">");
			
			Hide or change elements from the non-mobile version to adapt to the mobile version
			jQuery(".leaflet-top.leaflet-left").css("visibility","hidden");
			jQuery(".leaflet-top.leaflet-right").css("visibility","hidden");
			jQuery("#sidebar").css("visibility","hidden");
			jQuery("#toggleSidebar").css("visibility","hidden");
			jQuery(".disclaimer").css("visibility","hidden");
			jQuery(".brand").css("visibility","hidden");
			jQuery("#topMenu").css("visibility","hidden");
			jQuery("#infoPermalink").css("visibility","hidden");
			jQuery(".feedback").css("visibility","hidden");
			jQuery("#map").css("left","0px");
			jQuery("#navbar").css("padding", "0px 0px 0px 0px");

			
			 Definition of new variables. This variables are ids and classes of HTML div elements that will programmatically be appended to index.html
			var MenuButton = document.getElementById("MenuButton");
			var LayerButton = document.getElementById("LayerButton");
			var MobileSideBarLeft = document.getElementById("MobileSideBarLeft");
			var MobileSideBarRight = document.getElementById("MobileSideBarRight");
						
			Add new HTML elements if they don't already exist and only in mobile visualization. The related functions shouls also be after the append.
			if(MenuButton === null && MobileSideBarLeft === null){
				jQuery("#navbar").append("<div id=\"MenuButton\"> <img src=\"img/menu-icon.png\" class=\"logo\" alt=\"ORS\"> </div>");
				jQuery("#main").append("<div id=\"MobileSideBarLeft\"> </div>");	
				jQuery("#main").append("<div id=\"MobileSideBarLeft-Right\">  </div>");
				
				jQuery("#MobileSideBarLeft").append("<div id=\"MobileSideBarLeft-Left\"> </div>");
				
				jQuery("#MobileSideBarLeft").append("<div class=\"MobileMenuOption\" id=\"MobileToolsMenu\">  </div>");
				jQuery("#MobileSideBarLeft").append("<div class=\"MobileMenuOption\" id=\"MobileSettingsMenu\">  </div>");
				jQuery("#MobileSideBarLeft").append("<div class=\"MobileMenuOption\" id=\"MobileInfoMenu\">  </div>");
				
				jQuery("#MobileToolsMenu").append("<div class=\"MobileMenuButton\" id=\"MobileRoutePlanning\">  </div>");
				jQuery("#MobileToolsMenu").append("<div class=\"MobileMenuButton\" id=\"MobileSearchAdress\"> </div>");
				jQuery("#MobileToolsMenu").append("<div class=\"MobileMenuButton\" id=\"MobileSearchPOI\">  </div>");

				jQuery("#MobileInfoMenu").append("<div class=\"MobileMenuButton\" id=\"MobileInfoContact\">  </div>");
				jQuery("#MobileInfoMenu").append("<div class=\"MobileMenuButton\" id=\"MobileFeeback\">  </div>");
				jQuery("#MobileInfoMenu").append("<div class=\"MobileMenuButton\" id=\"MobileDisclaimer\">  </div>");
				
				Define style for MENU BUTTON element
				jQuery("#MenuButton").css("height","100%");
				jQuery("#MenuButton").css("width","50px");
				jQuery("#MenuButton").css("float","left");
				jQuery("#MenuButton").css("left","0");
				jQuery("#MenuButton").css("position","absolute");
				jQuery("#MenuButton").css("display","flex");
				
				Define Style for image inside MENU BUTTON element
				jQuery("#MenuButton img").css("height","50%");
				jQuery("#MenuButton img").css("width","50%");
				jQuery("#MenuButton img").css("display","inline-block");
				jQuery("#MenuButton img").css("margin","auto");
				
				Define style for MOBILE SIDE BAR LEFT element
				jQuery("#MobileSideBarLeft").css("display","flex");
				jQuery("#MobileSideBarLeft").css("flex-direction","column");
				jQuery("#MobileSideBarLeft").css("height","calc(100%-50px)"); To prevent bar overflow
				jQuery("#MobileSideBarLeft").css("width","50px");
				jQuery("#MobileSideBarLeft").css("float","left");
				jQuery("#MobileSideBarLeft").css("left","0px");
				jQuery("#MobileSideBarLeft").css("top","50px");
				jQuery("#MobileSideBarLeft").css("bottom","0px");
				jQuery("#MobileSideBarLeft").css("position","absolute");
				jQuery("#MobileSideBarLeft").css("z-index","9999");
				jQuery("#MobileSideBarLeft").css("display","none");
				jQuery("#MobileSideBarLeft").css("background-color","#121212");
				jQuery("#MobileSideBarLeft").css("overflow-y","auto");
				jQuery("#MobileSideBarLeft").css("-webkit-overflow-scrolling","touch");
				
				
				Define style for MOBILE SIDE BAR LEFT RIGHT element
				jQuery("#MobileSideBarLeft-Right").css("height","calc(100% - 50px)"); To prevent bar overflow
				jQuery("#MobileSideBarLeft-Right").css("width","calc(100% - 51px)");
				jQuery("#MobileSideBarLeft-Right").css("position","absolute");
				jQuery("#MobileSideBarLeft-Right").css("background-color","#121212");
				jQuery("#MobileSideBarLeft-Right").css("overflow-y","auto");
				jQuery("#MobileSideBarLeft-Right").css("-webkit-overflow-scrolling","touch");
				jQuery("#MobileSideBarLeft-Right").css("margin-top","50px");
				jQuery("#MobileSideBarLeft-Right").css("left","50px");
				jQuery("#MobileSideBarLeft-Right").css("z-index","9999");
				jQuery("#MobileSideBarLeft-Right").css("float","left");
				jQuery("#MobileSideBarLeft-Right").css("display","none");
				jQuery("#MobileSideBarLeft-Right").css("border-left","1px solid white");

				
				Define Style for MOBILE MENU OPTION class
				jQuery(".MobileMenuOption").css("display","inline-block");
				jQuery(".MobileMenuOption").css("width","50px");
				jQuery(".MobileMenuOption").css("margin-bottom","5px");
				
				Define Style for MOBILE MENU BUTTON class
				jQuery(".MobileMenuButton").css("width","50px");
				jQuery(".MobileMenuButton").css("height","50px");
				jQuery(".MobileMenuButton").css("margin-top","5px");
				jQuery(".MobileMenuButton").css("margin-bottom","5px");
				jQuery(".MobileMenuButton").css("background-size","70%");
				jQuery(".MobileMenuButton").css("background-repeat","no-repeat");
				jQuery(".MobileMenuButton").css("background-position","center center");
				jQuery("#MobileRoutePlanning").css("background-image","url(img/menuRoute-big.png) ");
				jQuery("#MobileSearchAdress").css("background-image","url(img/menuSearchAddress-big.png) ");
				jQuery("#MobileSearchPOI").css("background-image","url(img/menuSearchPOI-big.png) ");
				jQuery("#MobileInfoContact").css("background-image","url(img/info-big.png) ");
				jQuery("#MobileFeeback").css("background-image","url(img/feedback-big.png) ");
				jQuery("#MobileDisclaimer").css("background-image","url(img/disclaimer-big.png)");
				
				
				Define style for MOBILE TOOLS MENU element
				jQuery("#MobileToolsMenu").css("height","auto");

				Define style for MOBILE SETTINGS MENU element
				jQuery("#MobileSettingsMenu").css("height","50px");
				jQuery("#MobileSettingsMenu").css("border-top","3px solid #ffffff");
				jQuery("#MobileSettingsMenu").css("border-bottom","3px solid #ffffff");
				jQuery("#MobileSettingsMenu").css("background-size","70%");
				jQuery("#MobileSettingsMenu").css("background-repeat","no-repeat");
				jQuery("#MobileSettingsMenu").css("background-position","center center");
				jQuery("#MobileSettingsMenu").css("background-image","url(img/reload-big.png) ");
				
				Define style for MOBILE INFO MENU element
				jQuery("#MobileInfoMenu").css("height","auto"); 250px
				
				Animate left Menu
				jQuery("#MenuButton").click(function(){
					jQuery("#MobileSideBarLeft").toggleClass("visible");
					jQuery("#MobileSideBarLeft").animate({width:"toggle", },500);
					jQuery(".MobileMenuButton").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSettingsMenu").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSideBarLeft-Right").css("display","none");
					if(jQuery("#MobileSideBarRight").is(":visible")){ This will close the opposite menu if it is visible
						jQuery("#MobileSideBarRight").toggleClass("visible");
						jQuery("#MobileSideBarRight").animate({width:"toggle",},500);
					}
				});	
				Functions for what should happen when clicking on an option button
				jQuery("#MobileRoutePlanning").click(function(){
					jQuery(".MobileMenuButton").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSettingsMenu").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileRoutePlanning").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
					jQuery("#MobileSideBarLeft-Right").css("display","inline-block");
					jQuery("#MobileSideBarLeft-Right").empty(); Empty the DIV element before writing something new
					jQuery("#MobileSideBarLeft-Right").append("<div class=\"MobileOptionTitle\"> <label class=\"tabLabels\" id=\"routeLabel\"> <b> Plan Route </b> </label> </div>");
					jQuery("#MobileSideBarLeft-Right").append("<div id=\"MobileRoutingTransportType\"> </div>");
					jQuery("#MobileSideBarLeft-Right").append("	<div id=\"MobileRoutingRouteType\"> \
																	<p> <b>Route type: </b></p> \
																	<label class=\"radio\">\
																		<input type=\"radio\" id=\"Fastest\" name=\"weighting\" checked=\"checked\">\
																		<span id=\"fastestLabel\">Fastest Route</span>\
																	</label> \
																	<label class=\"radio\">\
																		<input type=\"radio\" id=\"Shortest\" name=\"weighting\">\
																		<span id=\"shortestLabel\">Shortest Route</span>\
																	</label>\
																	<label class=\"radio\">\
																		<input type=\"radio\" id=\"Recommended\" name=\"weighting\">\
																		<span id=\"recommendedLabel\">Recommended Route<span>\
																	</label>\
																</div>");
					jQuery("#MobileSideBarLeft-Right").append("<div id=\"MobileRoutingTransportOptionsVType\"> </div>");
					jQuery("#MobileSideBarLeft-Right").append("");
					jQuery("#MobileSideBarLeft-Right").append("");
					jQuery("#MobileSideBarLeft-Right").append("");
					jQuery("#MobileSideBarLeft-Right").append("");
					
					Define Syle for MOBILE OPTIONS TITLE class

					
					jQuery(".MobileOptionTitle label").css("width","100%");
					jQuery(".MobileOptionTitle label").css("height","30px");
					jQuery(".MobileOptionTitle label").css("background-color","#121212");
					jQuery(".MobileOptionTitle label").css("color","#7d7d7d");
					jQuery(".MobileOptionTitle label").css("vertical-align", "middle");
					jQuery(".MobileOptionTitle label").css("line-height", "30px"); 
					jQuery(".MobileOptionTitle label").css("font-size", "150%");
					jQuery(".MobileOptionTitle label").css("border-bottom","1px solid #FFFFFF");
										
					
					Define Syle for MOBILE ROUTING TRANSPORT TYPE 
					jQuery("#MobileRoutingTransportType").css("width","100%");
					jQuery("#MobileRoutingTransportType").css("height","auto");
					jQuery("#MobileRoutingTransportType").css("background-color","#121212");
					jQuery("#MobileRoutingTransportType").css("border-bottom","1px solid #FFFFFF");
					
					For choosing different types of transport
					jQuery("#MobileRoutingTransportType").append("<div class=\"MobileMobilityOption\" id=\"MobileCar\">  </div>");
					jQuery("#MobileRoutingTransportType").append("<div class=\"MobileMobilityOption\" id=\"MobileBicycle\">  </div>");
					jQuery("#MobileRoutingTransportType").append("<div class=\"MobileMobilityOption\" id=\"MobilePedestrian\">  </div>");
					jQuery("#MobileRoutingTransportType").append("<div class=\"MobileMobilityOption\" id=\"MobileWheelchair\">  </div>");
					jQuery("#MobileRoutingTransportType").append("<div class=\"MobileMobilityOption\" id=\"MobileTruck\">  </div>");
					
					Define Syle for MOBILE ROUTING MOBILITY OPTIONS CLASS
					jQuery(".MobileMobilityOption").css("height","50px");
					jQuery(".MobileMobilityOption").css("width","50px"); 
					jQuery(".MobileMobilityOption").css("margin","auto");
					jQuery(".MobileMobilityOption").css("display","inline-block");
					jQuery(".MobileMobilityOption").css("background-size","70%");
					jQuery(".MobileMobilityOption").css("background-repeat","no-repeat");
					jQuery(".MobileMobilityOption").css("background-position","center center");
					jQuery("#MobileCar").css("background-image","url(img/picto-car-big.png)");
					jQuery("#MobileBicycle").css("background-image","url(img/picto-bike-big.png)");
					jQuery("#MobilePedestrian").css("background-image","url(img/picto-dude-big.png)");
					jQuery("#MobileWheelchair").css("background-image","url(img/picto-wheelchair_beta-big.png)");
					jQuery("#MobileTruck").css("background-image","url(img/picto-truck-big.png)");
					
					Define Style for the div containing each type of transport options
					jQuery("#MobileRoutingRouteType").css("width","100%");
					//jQuery("#MobileRoutingRouteType").css("height","200px");
					jQuery("#MobileRoutingRouteType").css("background-color","#121212");
					jQuery("#MobileRoutingRouteType").css("border-bottom","1px solid #FFFFFF");
					
					Define Style for the div containing each type of transport options
					jQuery("#MobileRoutingTransportOptionsVType").css("width","100%");
					//jQuery("#MobileRoutingTransportOptionsVType").css("height","200px");
					jQuery("#MobileRoutingTransportOptionsVType").css("background-color","#121212");
					jQuery("#MobileRoutingTransportOptionsVType").css("border-bottom","1px solid #FFFFFF");
					
					Events for selecting each option in type of transports menu (inside route options)
					jQuery("#MobileCar").click(function(){
						jQuery(".MobileMobilityOption").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
						jQuery("#MobileCar").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
						jQuery("#MobileRoutingTransportOptionsVType").empty(); Empty the DIV element before writing something new
						jQuery("#MobileRoutingTransportOptionsVType").append("<table class=\"optionsTable\" style=\"width:100%\">\
																				<tr>\
																					<td>\
																						<div class=\"radioContainer\">\
																							<div class=\"radio\">\
																								<input type=\"radio\" id=\"Car\" name=\"car\"  value=\"car\" checked=\"checked\">\
																								<p  id=\"carLabel\">car</p>\
																							</div>\
																						</div>\
																					</td>\
																				</tr>\
																			</table>");
					});
					
					jQuery("#MobileBicycle").click(function(){
						jQuery(".MobileMobilityOption").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
						jQuery("#MobileBicycle").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
						jQuery("#MobileRoutingTransportOptionsVType").empty(); Empty the DIV element before writing something new
						jQuery("#MobileRoutingTransportOptionsVType").append("<table class=\"optionsTable\" style=\"width:100%\">\
																				<tr>\
																					<td>\
																						<div class=\"radioContainer\">\
																							<div class=\"radio\">\
																								<input type=\"radio\" id=\"Bicycle\" name=\"bicycle\"  value=\"shortest\" checked=\"checked\">\
																								<span id=\"BicycleLabel\">normal</span>\
																							</div>\
																							<div class=\"radio\">\
																								<input type=\"radio\" id=\"BicycleSafety\" name=\"bicycle\"  value=\"safest\">\
																								<span id=\"BicycleSafetyLabel\">safest route</span>\
																							</div>\
																							<div class=\"radio\">\
																								<input type=\"radio\" id=\"BicycleTour\" name=\"bicycle\"  value=\"tour\">\
																								<span id=\"BicycleTourLabel\">cycle tour</span>\
																							</div>\
																						</div>\
																					</td>\
																					<td>\
																						<div class=\"radioContainer\">\
																							<div class=\"radio\">\
																								<input type=\"radio\" id=\"BicycleMTB\" name=\"bicycle\" value=\"mountain\">\
																								<span id=\"BicycleMtbLabel\">mountain bike</span>\
																							</div>\
																							<div class=\"radio\">\
																								<input type=\"radio\" id=\"BicycleRacer\" name=\"bicycle\" value=\"racing\">\
																								<span id=\"BicycleRacerLabel\">racing bike</span>\
																							</div>\
																						</div>\
																					</td>\
																				</tr>\
																			</table>");
					});
					
					jQuery("#MobilePedestrian").click(function(){
						jQuery(".MobileMobilityOption").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
						jQuery("#MobilePedestrian").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
						jQuery("#MobileRoutingTransportOptionsVType").empty(); Empty the DIV element before writing something new
						jQuery("#MobileRoutingTransportOptionsVType").append("<table class=\"optionsTable\" style=\"width:100%\">\
																				<tr>\
																					<td>\
																						<div class=\"radioContainer\">\
																							<div class=\"radio\">\
																								<input type=\"radio\" id=\"Pedestrian\" name=\"pedestrian\"  value=\"pedestrian\" checked=\"checked\">\
																								<span id=\"PedestrianLabel\">pedestrian</span>\
																							</div>\
																						</div>\
																					</td>\
																				</tr>\
																			</table>");
					});
					
					jQuery("#MobileWheelchair").click(function(){
						jQuery(".MobileMobilityOption").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
						jQuery("#MobileWheelchair").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
						jQuery("#MobileRoutingTransportOptionsVType").empty(); Empty the DIV element before writing something new
						jQuery("#MobileRoutingTransportOptionsVType").append("<table class=\"optionsTable\" style=\"width:100%\">\
																				<tr>\
																					<td>\
																						<div class=\"radioContainer\">\
																							<div class=\"radio\">\
																								<input type=\"radio\" id=\"Wheelchair\" name=\"wheelchair\" checked=\"checked\">\
																								<span id=\"WheelchairLabel\">Wheelchair</span>\
																							</div>\
																						</div>\
																					</td>\
																				</tr>\
																			</table>\
																			<span> Terrain options </span>\
																			<br>\
																			<span id=\"surfaceLabel\">Surface</span>\
																			<br>\
																			<select id=\"Surface\">\
																				<option id=\"asphaltOption\">Asphalt</option>\
																				<option id=\"cobblestoneFlattenedOption\">Flattened Cobblestone</option>\
																				<option id=\"cobblestoneOption\">Cobblestone</option>\
																				<option id=\"compactedOption\">Compacted</option>\
																				<option id=\"allSurfacesOption\">All Surfaces</option>\
																			</select>\
																			<br>\
																			<span id=\"inclineLabel\" >Maximum Incline</span>\
																			<br>\
																			<select id=\"Incline\">\
																				<option id=\"threePercentOption\">Up to 3%</option>\
																				<option id=\"sixPercentOption\">Up to 6%</option>\
																				<option id=\"tenPercentOption\">Up to 10%</option>\
																				<option id=\"fifteenPercentOption\">Up to 15%</option>\
																				<option id=\"allInclinesOption\">All Inclines</option>\
																			</select>\
																			<br>\
																			<span id=\"slopedCurbLabel\">Maximum Sloped Curb</span>\
																			<br>\
																			<select id=\"SlopedCurb\">\
																				<option id=\"threeCmOption\">Up to 3cm</option>\
																				<option id=\"sixCmOption\">Up to 6cm</option>\
																				<option id=\"tenCmOption\">Up to 10cm</option>\
																				<option id=\"allSlopedCurbesOption\">All Sloped Curbs</option>\
																			</select>");
																			
					});
					
					jQuery("#MobileTruck").click(function(){
						jQuery(".MobileMobilityOption").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
						jQuery("#MobileTruck").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
						jQuery("#MobileRoutingTransportOptionsVType").empty(); Empty the DIV element before writing something new
						jQuery("#MobileRoutingTransportOptionsVType").append("<table class=\"optionsTable\" style=\"width: 100%\">\
																					<tr>\
																						<td>\
																							<div class=\"radioContainer\">\
																								<div class=\"radio\">\
																									<input type=\"radio\" id=\"HeavyVehicle\" name=\"heavyvehicle\" value=\"goods\" checked=\"checked\">\
																									<span id=\"goodsHeavyTruckLabel\">goods</span>\
																								</div>\
																								<div class=\"radio\">\
																									<input type=\"radio\" id=\"HeavyVehicle\" name=\"heavyvehicle\" value=\"hgv\">\
																									<span id=\"hgvHeavyTruckLabel\">HGV</span>\
																								</div>\
																								<div class=\"radio\">\
																									<input type=\"radio\" id=\"HeavyVehicle\" name=\"heavyvehicle\" value=\"bus\">\
																									<span id=\"busHeavyTruckLabel\">Bus</span>\
																								</div>\
																							</div>\
																						</td>\
																						<td>\
																							<div class=\"radioContainer\">\
																								<div class=\"radio\">\
																									<input type=\"radio\" id=\"HeavyVehicle\" name=\"heavyvehicle\" value=\"agricultural\">\
																									<span id=\"agriculturalHeavyTruckLabel\">Agricultural Vehicle</span>\
																								</div>\
																								<div class=\"radio\">\
																									<input type=\"radio\" id=\"HeavyVehicle\" name=\"heavyvehicle\" value=\"forestry\">\
																									<span id=\"forestryHeavyTruckLabel\">Forestry</span>\
																								</div>\
																								<div class=\"radio\">\
																									<input type=\"radio\" id=\"HeavyVehicle\" name=\"heavyvehicle\" value=\"delivery\">\
																									<span id=\"deliveryHeavyTruckLabel\">Delivery</span>\
																								</div>\
																							</div>\
																						</td>\
																					</tr>\
																				</table>\
																				<label class=\"checkbox\">\
																					<input type=\"checkbox\" id=\"Hazardous\" value=\"hazmat\">\
																					<span id=\"hazardous\" class=\"label label-warning\"><i class=\"icon-tint icon-white\"></i>&nbsp;Hazardous Materials</span>\
																				</label>");
					});
					
				});
				Events for selecting each option in manin menu
				jQuery("#MobileSearchAdress").click(function(){
					jQuery(".MobileMenuButton").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSettingsMenu").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSearchAdress").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
					jQuery("#MobileSideBarLeft-Right").css("display","inline-block");
					jQuery("#MobileSideBarLeft-Right").empty(); Empty the DIV element before writing something new
					jQuery("#MobileSideBarLeft-Right").append("<div class=\"MobileOptionTitle\"> <label class=\"tabLabels\" id=\"routeLabel\"> <b> Search Address </b> </label> </div>");
					
					Define Syle for MOBILE OPTIONS TITLE class
					jQuery(".MobileOptionTitle label").css("width","100%");
					jQuery(".MobileOptionTitle label").css("height","30px");
					jQuery(".MobileOptionTitle label").css("background-color","#121212");
					//jQuery(".MobileOptionTitle label").css("text-align","center");
					jQuery(".MobileOptionTitle label").css("color","#7d7d7d");
					jQuery(".MobileOptionTitle label").css("vertical-align", "middle");
					jQuery(".MobileOptionTitle label").css("line-height", "30px"); 
					jQuery(".MobileOptionTitle label").css("font-size", "150%");
					jQuery(".MobileOptionTitle label").css("border-bottom","1px solid #FFFFFF");
				});
				jQuery("#MobileSearchPOI").click(function(){
					jQuery(".MobileMenuButton").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSettingsMenu").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSearchPOI").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
					jQuery("#MobileSideBarLeft-Right").css("display","inline-block");
					jQuery("#MobileSideBarLeft-Right").empty(); Empty the DIV element before writing something new
					jQuery("#MobileSideBarLeft-Right").append("<div class=\"MobileOptionTitle\"> <label class=\"tabLabels\" id=\"routeLabel\"> <b> Search Point of Interest </b> </label> </div>");
					
					Define Syle for MOBILE OPTIONS TITLE class
					jQuery(".MobileOptionTitle label").css("width","100%");
					jQuery(".MobileOptionTitle label").css("height","30px");
					jQuery(".MobileOptionTitle label").css("background-color","#121212");
					//jQuery(".MobileOptionTitle label").css("text-align","center");
					jQuery(".MobileOptionTitle label").css("color","#7d7d7d");
					jQuery(".MobileOptionTitle label").css("vertical-align", "middle");
					jQuery(".MobileOptionTitle label").css("line-height", "30px"); 
					jQuery(".MobileOptionTitle label").css("font-size", "150%");
					jQuery(".MobileOptionTitle label").css("border-bottom","1px solid #FFFFFF");	
				});
				
				jQuery("#MobileSettingsMenu").click(function(){
					jQuery(".MobileMenuButton").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSettingsMenu").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSettingsMenu").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
					jQuery("#MobileSideBarLeft-Right").css("display","inline-block");
					jQuery("#MobileSideBarLeft-Right").empty(); Empty the DIV element before writing something new
					jQuery("#MobileSideBarLeft-Right").append("<div class=\"MobileOptionTitle\"> <label class=\"tabLabels\" id=\"routeLabel\"> <b> Site Preferences </b> </label> </div>");
					jQuery("#MobileSideBarLeft-Right").append("<div id=\"MobileOptionsPreferences\"> \
																	<div>\
																		<h4 id=\"versionLabel\">Version</h4>\
																		<p>\
																			<label id=\"versionText\">Please choose the number of options:&nbsp;</label>\
																			<select id=\"extendedVersionPrefs\"></select>\
																		</p>\
																		<h4 id=\"languageLabel\">Languages</h4>\
																		<p>\
																			<label id=\"languageText\">Please select your language:&nbsp;</label>\
																			<select id=\"languagePrefs\"></select>\
																		</p><h4 id=\"routingLanguageLabel\">Routing Languages</h4>\
																		<p>\
																			<label id=\"routingLanguageText\">Please select your language:&nbsp;</label>\
																			<select id=\"routingLanguagePrefs\"></select>\
																		</p><h4 id=\"distanceUnitLabel\">Distance Units</h4>\
																		<p>\
																			<label id=\"distanceUnitText\">Please select your distance unit:&nbsp;</label>\
																			<select id=\"unitPrefs\"></select>\
																		</p>\
																		<div>\
																		<button class=\"btn btn-primary\" id=\"savePrefsBtn\">\
																			Save\
																		</button>\
																	</div>\
																	</div>\
																</div>");
					
					Define Syle for MOBILE OPTIONS TITLE class
					jQuery(".MobileOptionTitle label").css("width","100%");
					jQuery(".MobileOptionTitle label").css("height","30px");
					jQuery(".MobileOptionTitle label").css("background-color","#121212");
					//jQuery(".MobileOptionTitle label").css("text-align","center");
					jQuery(".MobileOptionTitle label").css("color","#7d7d7d");
					jQuery(".MobileOptionTitle label").css("vertical-align", "middle");
					jQuery(".MobileOptionTitle label").css("line-height", "30px"); 
					jQuery(".MobileOptionTitle label").css("font-size", "150%");
					jQuery(".MobileOptionTitle label").css("border-bottom","1px solid #FFFFFF");

					jQuery("#MobileOptionsPreferences").css("width","100%");
					jQuery("#MobileOptionsPreferences").css("height","auto");
				});
				
				jQuery("#MobileInfoContact").click(function(){
					jQuery(".MobileMenuButton").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSettingsMenu").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileInfoContact").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
					jQuery("#MobileSideBarLeft-Right").css("display","inline-block");
					jQuery("#MobileSideBarLeft-Right").empty(); Empty the DIV element before writing something new
					jQuery("#MobileSideBarLeft-Right").append("<div class=\"MobileOptionTitle\"> <label class=\"tabLabels\" id=\"routeLabel\"> <b> Info & Contact </b> </label> </div>");
					jQuery("#MobileSideBarLeft-Right").append("<div id=\"MobileOptionInfoContact\">  </div>");
					
					Define Syle for MOBILE OPTIONS TITLE class
					jQuery(".MobileOptionTitle label").css("width","100%");
					jQuery(".MobileOptionTitle label").css("height","30px");
					jQuery(".MobileOptionTitle label").css("background-color","#121212");
					//jQuery(".MobileOptionTitle label").css("text-align","center");
					jQuery(".MobileOptionTitle label").css("color","#7d7d7d");
					jQuery(".MobileOptionTitle label").css("vertical-align", "middle");
					jQuery(".MobileOptionTitle label").css("line-height", "30px"); 
					jQuery(".MobileOptionTitle label").css("font-size", "150%");
					jQuery(".MobileOptionTitle label").css("border-bottom","1px solid #FFFFFF");	
					
					jQuery("#MobileOptionInfoContact").css("width","100%");
					jQuery("#MobileOptionInfoContact").css("height","100%");
					jQuery("#MobileOptionInfoContact").css("background-color","#121212");
					jQuery("#MobileOptionInfoContact").append("<object type=\"text/html\" data=\"http://openrouteservice.org/contact.html\" width=\"100%\" height=\"100%\" style=\"overflow:auto\"> </object>");
					 
				});
				
				jQuery("#MobileFeeback").click(function(){
					jQuery(".MobileMenuButton").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSettingsMenu").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileFeeback").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
					jQuery("#MobileSideBarLeft-Right").css("display","inline-block");
					jQuery("#MobileSideBarLeft-Right").empty(); Empty the DIV element before writing something new
					jQuery("#MobileSideBarLeft-Right").append("<div class=\"MobileOptionTitle\"> <label class=\"tabLabels\" id=\"routeLabel\"> <b> Feedback </b> </label> </div>");
					jQuery("#MobileSideBarLeft-Right").append("<div id=\"MobileOptionsFeedback\"> \
																	<div class=\"form\">\
																		<p id=\"returnmessage\"></p>\
																		<label>Name: <span>*</span></label>\
																		<input type=\"text\" id=\"name\" placeholder=\"Name\"/>\
																		<label>Email: <span>*</span></label>\
																		<input type=\"text\" id=\"email\" placeholder=\"Email\"/>\
																		<label>Message:</label>\
																		<textarea id=\"message\" placeholder=\"Type your message here\"></textarea>\
																		<br>\
																		<input type=\"button\" id=\"submit_feedback\" value=\"Send Message\"/>\
																	</div>\
															</div>");
					
					Define Syle for MOBILE OPTIONS TITLE class
					jQuery(".MobileOptionTitle label").css("width","100%");
					jQuery(".MobileOptionTitle label").css("height","30px");
					jQuery(".MobileOptionTitle label").css("background-color","#121212");
					//jQuery(".MobileOptionTitle label").css("text-align","center");
					jQuery(".MobileOptionTitle label").css("color","#7d7d7d");
					jQuery(".MobileOptionTitle label").css("vertical-align", "middle");
					jQuery(".MobileOptionTitle label").css("line-height", "30px"); 
					jQuery(".MobileOptionTitle label").css("font-size", "150%");
					jQuery(".MobileOptionTitle label").css("border-bottom","1px solid #FFFFFF");

					jQuery("#MobileOptionsFeedback").css("width","100%");
					jQuery("#MobileOptionsFeedback").css("background-color","#121212");					
				});
				
				jQuery("#MobileDisclaimer").click(function(){
					jQuery(".MobileMenuButton").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileSettingsMenu").css("background-color","#121212"); changes the color of the background to the original value so highlighting is not repeated when selecting an option
					jQuery("#MobileDisclaimer").css("background-color","#ddd8d8"); change the background color so the user can now that item is selected
					jQuery("#MobileSideBarLeft-Right").css("display","inline-block");
					jQuery("#MobileSideBarLeft-Right").empty(); Empty the DIV element before writing something new
					jQuery("#MobileSideBarLeft-Right").append("<div class=\"MobileOptionTitle\"> <label class=\"tabLabels\" id=\"routeLabel\"> <b> Disclaimer and Licence </b> </label> </div>");
					jQuery("#MobileSideBarLeft-Right").append("<div id=\"MobileOptionDisclaimer\">  </div>");
					
					Define Syle for MOBILE OPTIONS TITLE class
					jQuery(".MobileOptionTitle label").css("width","100%");
					jQuery(".MobileOptionTitle label").css("height","30px");
					jQuery(".MobileOptionTitle label").css("background-color","#121212");
					//jQuery(".MobileOptionTitle label").css("text-align","center");
					jQuery(".MobileOptionTitle label").css("color","#7d7d7d");
					jQuery(".MobileOptionTitle label").css("vertical-align", "middle");
					jQuery(".MobileOptionTitle label").css("line-height", "30px"); 
					jQuery(".MobileOptionTitle label").css("font-size", "150%");
					jQuery(".MobileOptionTitle label").css("border-bottom","1px solid #FFFFFF");
					
					jQuery("#MobileOptionDisclaimer").css("width","100%");
					jQuery("#MobileOptionDisclaimer").css("height","100%");
					jQuery("#MobileOptionDisclaimer").css("background-color","#121212");
					jQuery("#MobileOptionDisclaimer").html("<object data=\"http://openrouteservice.org/contact.html\"> </object>");
					
				});	
			}
			if(LayerButton === null && MobileSideBarRight === null ){
				jQuery("#navbar").append("<div id=\"LayerButton\"> <img src=\"img/layers-icon.png\" class=\"logo\" alt=\"ORS\"> </div>");
				jQuery("#main").append("<div id=\"MobileSideBarRight\"> </div>");
				
				/*Define style for this element
				jQuery("#LayerButton").css("height","100%");
				jQuery("#LayerButton").css("width","50px");
				jQuery("#LayerButton").css("float","right");
				jQuery("#LayerButton").css("right","0");
				jQuery("#LayerButton").css("position","absolute");
				jQuery("#LayerButton").css("display","flex");
				
				/* Define Style for image inside element
				jQuery("#LayerButton img").css("height","50%");
				jQuery("#LayerButton img").css("width","50%");
				jQuery("#LayerButton img").css("display","inline-block");
				jQuery("#LayerButton img").css("margin","auto");
				
				jQuery("#MobileSideBarRight").css("height","calc(100%-50px)");
				jQuery("#MobileSideBarRight").css("width","100%");
				jQuery("#MobileSideBarRight").css("float","right");
				jQuery("#MobileSideBarRight").css("top","50px");
				jQuery("#MobileSideBarRight").css("bottom","0px");
				jQuery("#MobileSideBarRight").css("right","0px");
				jQuery("#MobileSideBarRight").css("position","absolute");
				jQuery("#MobileSideBarRight").css("z-index","9999");
				jQuery("#MobileSideBarRight").css("background-color","#121212");
				jQuery("#MobileSideBarRight").css("display","none");
				jQuery("#MobileSideBarRight").css("overflow-y","auto");
				jQuery("#MobileSideBarRight").css("-webkit-overflow-scrolling","touch");
				

				/* Animate right menu
				jQuery(document).ready(function(){
					jQuery("#LayerButton").click(function(){
						jQuery("#MobileSideBarRight").toggleClass("visible");
						jQuery("#MobileSideBarRight").animate({width:"toggle",},500);
						jQuery("#MobileSideBarLeft-Right").css("display","none");
						if(jQuery("#MobileSideBarLeft").is(":visible")){ /*This will close the opposite menu if it is visible
							jQuery("#MobileSideBarLeft").toggleClass("visible");
							jQuery("#MobileSideBarLeft").animate({width:"toggle",},500);
						}
					});		  
				});
			}
		}
			
		else {
			jQuery(".leaflet-top.leaflet-left").css("visibility","visible");
			jQuery(".leaflet-top.leaflet-right").css("visibility","visible");
			jQuery("#sidebar").css("visibility","visible");
			jQuery("#toggleSidebar").css("visibility","visible");
			jQuery(".disclaimer").css("visibility","visible");
			jQuery(".brand").css("visibility","visible");
			jQuery("#topMenu").css("visibility","visible");
			jQuery("#infoPermalink").css("visibility","visible");
			jQuery(".feedback").css("visibility","visible");
			jQuery("#map").css("left","400px");
			jQuery("#navbar").css("padding", "0px 10px 0px 20px");
			
			/* Remove appended HTML elements for mobile visualization 
			jQuery("#MenuButton").remove();
			jQuery("#LayerButton").remove();
			jQuery("#MobileSideBarLeft").remove();
			jQuery("#MobileSideBarRight").remove();
			
		}
		
	});  
 }); */


