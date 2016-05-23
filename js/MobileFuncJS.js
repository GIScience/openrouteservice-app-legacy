/* 
 * Functions for click events and animations on mobile menus */
jQuery(document).ready(function(){
	
	/* Toggle left Menu when clicking menu button */
	jQuery("#MobileMenuButton").click(function(){
		jQuery("#MobileSideBarLeft").toggleClass("visible");
		jQuery("#MobileSideBarLeft").animate({width:"toggle", },500);
		jQuery(".MobileMenuButton").css("background-color","#121212"); /*changes the color of the background to the original value so highlighting is not repeated when selecting an option */
		jQuery("#MobileSettingsMenu").css("background-color","#121212"); /*changes the color of the background to the original value so highlighting is not repeated when selecting an option */
		if(jQuery("#MobileSideBarLeft-Right").is(":visible")){ /* will close de Left auxiliary menu if it is visible */
			jQuery("#MobileSideBarLeft-Right").toggleClass("visible");
			jQuery("#MobileSideBarLeft-Right").css("float","right");
			jQuery("#MobileSideBarLeft-Right").animate({width:"toggle"},1);
		}
		if(jQuery("#MobileSideBarRight").is(":visible")){ /*This will close the opposite menu if it is visible*/
			jQuery("#MobileSideBarRight").toggleClass("visible");
			jQuery("#MobileSideBarRight").animate({width:"toggle",},500);
		}
	});
	
	/* Toggle right Menu when clicking layer chooser button */
	jQuery("#MobileLayerButton").click(function(){
		jQuery("#MobileSideBarRight").toggleClass("visible");
		jQuery("#MobileSideBarRight").animate({width:"toggle", },500);
		jQuery(".MobileMenuButton").css("background-color","#121212"); /*changes the color of the background to the original value so highlighting is not repeated when selecting an option */
		if(jQuery("#MobileSideBarLeft-Right").is(":visible")){ /* will close de Left auxiliary menu if it is visible */
			jQuery("#MobileSideBarLeft-Right").toggleClass("visible");
			jQuery("#MobileSideBarLeft-Right").animate({width:"toggle",},1);
		}
		if(jQuery("#MobileSideBarLeft").is(":visible")){ /*This will close the opposite menu if it is visible*/
			jQuery("#MobileSideBarLeft").toggleClass("visible");
			jQuery("#MobileSideBarLeft").animate({width:"toggle",},500);
		}
	});
	
	/* Highlight left menu buttons when clicking them and open/close left-right menu*/
	var temp_id = [];
	jQuery(".MobileMenuButton").click(function(){
		var id = jQuery(this).attr('id')
		if(temp_id != id){
			jQuery(".MobileMenuButton").css("background-color","#121212"); /* reset background color */
			jQuery($(id)).css("background-color","#ddd8d8"); /* highlight clicked element */
			if(jQuery("#MobileSideBarLeft-Right").is(":visible")) {
				jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsTitle").empty(); /*Empty the DIV element before writing something new*/
				//jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsOptions").empty(); /*Empty the DIV element before writing something new*/
				PopulateOptionDiv(id);
			}
			else {
				jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsTitle").empty(); /*Empty the DIV element before writing something new*/
				//jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsOptions").empty(); /*Empty the DIV element before writing something new*/
				jQuery("#MobileSideBarLeft-Right").toggleClass("visible");
				jQuery("#MobileSideBarLeft-Right").animate({width:"toggle", },500);
				PopulateOptionDiv(id);
			}
		}
		else {
			if(jQuery("#MobileSideBarLeft-Right").is(":visible")) {
				jQuery($(id)).css("background-color","#121212"); /* highlight clicked element */
				jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsTitle").empty(); /*Empty the DIV element before writing something new*/
				//jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsOptions").empty(); /*Empty the DIV element before writing something new*/
				jQuery("#MobileSideBarLeft-Right").toggleClass("visible");
				jQuery("#MobileSideBarLeft-Right").animate({width:"toggle", },500);
				PopulateOptionDiv(id);
			}
			else{
				jQuery(".MobileMenuButton").css("background-color","#121212"); /* reset background color */
				jQuery($(id)).css("background-color","#ddd8d8"); /* highlight clicked element */
				jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsTitle").empty(); /*Empty the DIV element before writing something new*/
				//jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsOptions").empty(); /*Empty the DIV element before writing something new*/
				jQuery("#MobileSideBarLeft-Right").toggleClass("visible");
				jQuery("#MobileSideBarLeft-Right").animate({width:"toggle", },500);
				PopulateOptionDiv(id);
			}
		}
		temp_id = id;
	});
	
});

/* Auxiliary function to populate left-right menu */
function PopulateOptionDiv(id){
	if (id=="MobileRoutePlanning"){
		jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsOptions").empty(); /*Empty the DIV element before writing something new*/
		jQuery( "#MobileRoutePlanningOptionsTitle" ).append( "<p> <b> Route Planning </b> </p>" );
		jQuery( "#WaypointPanel").clone(true).appendTo("#MobileRoutePlanningOptionsOptions"); /* Clone the original HTML5 elements and keep events */
	}
	else if (id=="MobileSearchAdress"){
		jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsOptions").empty(); /*Empty the DIV element before writing something new*/
		jQuery( "#MobileRoutePlanningOptionsTitle" ).append( "<p> <b> Search Address </b> </p>" );
		jQuery( "#MobileRoutePlanningOptionsOptions" ).append( "<form class=\"MobiletextForm\" id=\"MobileAddressSearch\">\
																	<input class=\"MobiletextFormText\" type=\"text\" name=\"fname\" placeholder=\"Address\"><br>\
																	<input class=\"MobiletextFormText\" type=\"text\" name=\"lname\" placeholder=\"ZIP Code\"><br>\
																	<input class=\"MobiletextFormText\" type=\"text\" name=\"fname\" placeholder=\"City\"><br>\
																	<input class=\"MobiletextFormText\" type=\"text\" name=\"lname\" placeholder=\"Country\"><br>\
																	<input class=\"MobiletextFormButton\" type=\"submit\" value=\"Search\">\
																</form>" );
	}
	else if (id=="MobileSearchPOI"){
		jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsOptions").empty(); /*Empty the DIV element before writing something new*/
		jQuery( "#MobileRoutePlanningOptionsTitle" ).append( "<p> <b> Search Point of Interest </b> </p>" );
	}
	else if (id=="MobileGlobalSettings"){
		jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsOptions").empty(); /*Empty the DIV element before writing something new*/
		jQuery( "#MobileRoutePlanningOptionsTitle" ).append( "<p> <b> Global Settings </b> </p>" );
		jQuery( ".modal-body").clone(true).appendTo("#MobileRoutePlanningOptionsOptions"); /* Clone the original HTML5 elements and keep events */
		jQuery( ".modal-footer").clone(true).appendTo("#MobileRoutePlanningOptionsOptions"); /* Clone the original HTML5 elements and keep events */
	}
	else if (id=="MobileInfoContact"){
		jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsOptions").empty(); /*Empty the DIV element before writing something new*/
		jQuery( "#MobileRoutePlanningOptionsTitle" ).append( "<p> <b> Info & Contacts </b> </p>" );
		jQuery( "#MobileRoutePlanningOptionsOptions" ).append("<section id=\"contact\">\
				<div class=\"space\">\
					&nbsp;\
				</div>\
				<p>\
				In case you have any further questions, concerns or feedback about this service agreement, please contact us via Email:<br>\
				<b>openrouteservice at geog.uni-heidelberg.de</b>\
				</p>\
				<p><br>\
					<a href=\"http://www.geog.uni-heidelberg.de/giscience.html\" target=\"_blank\"><img src=\"img/logo_giscience.png\" class=\"logo_big\" alt=\"logo GIScience\" />\
					<img src=\"img/siegel_uni_hd_mittel.gif\" class=\"logo_big\" alt=\"logo University of Heidelberg\" /></a>\
				</p>\
				<div class=\"space_small\">\
					&nbsp;\
				</div>\
				<dl class=\"dl-horizontal\" id=\"dl-horizontal_mod\">\
					<dt>\
						Idea\
					</dt>\
					<dd>\
						Pascal Neis &amp; Alexander Zipf\
					</dd>\
					<dt>\
						Backend Development\
					</dt>\
					<dd>\
						Maxim Rylov, Enrico Steiger &amp; Timothy Ellersiek\
					</dd>\
					<dt>\
						Website\
					</dt>\
					<dd>\
						Timothy Ellersiek, Enrico Steiger, Maxim Rylov &amp; Oliver Roick\
					</dd>\
					<dt>\
						Web Mapping Service (WMS) &amp; TileCache\
					</dt>\
					<dd>\
						Pascal Neis, Michael Auer &amp; Steffen Neubauer\
					</dd>\
					<dt>\
						OpenMapSurfer Tiles\
					</dt>\
					<dd>\
						<a href=\"http://openmapsurfer.uni-hd.de/\" target=\"_blank\">Maxim Rylov</a>\
					</dd>\
					<dt>\
						Hillshade processing\
					</dt>\
					<dd>\
						Michael Auer &amp; Magnus Fees\
					</dd>\
				</dl>\
			</section>");
	}
	else if (id=="MobileFeeback"){
		jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsOptions").empty(); /*Empty the DIV element before writing something new*/
		jQuery( "#MobileRoutePlanningOptionsTitle" ).append( "<p> <b> Feedback </b> </p>" );
		jQuery( ".feedback .form").clone(true).appendTo("#MobileRoutePlanningOptionsOptions"); /* Clone the original HTML5 elements and keep events */
	}
	else if (id=="MobileDisclaimer"){
		jQuery("#MobileSideBarLeft-Right #MobileRoutePlanningOptionsOptions").empty(); /*Empty the DIV element before writing something new*/
		jQuery( "#MobileRoutePlanningOptionsTitle" ).append( "<p> <b> Disclaimer </b> </p>" );
		jQuery( "#MobileRoutePlanningOptionsOptions" ).append( "<section id=\"disclaimer\">\
				<div class=\"space\">\
					&nbsp;\
				</div>\
				<p>\
					The data sources for routing and mapping are based on free and open and even collaborative volunteered data collection efforts. Therefore we cannot guarantee any quality of the displayed data and the routing results. We are not responsible for any errors, mistakes, omissions or other problems with the used data and occurring from using this service.\
				</p>\
				<p><h4>Limitation of liability</h4>\
				Under no circumstances, and under no legal theory, including negligence, shall OpenRouteService or its affiliates, contractors, employees, agents, or third party partners or suppliers, be liable for any special, indirect, incidental, consequential, or exemplary damages (including loss of profits, data, or use or cost of cover) arising out of or relating to these terms or that result from your use or the inability to use the site, including software, services, maps, content, user submissions, or any third party sites referred to on or by the site, even if OpenRouteService or a OpenRouteService authorized representative has been advised of the possibility of such damages.\
				OpenRouteService ensures to have technological and operational security policies and procedures to protect your information from loss, misuse, alteration, or unintentional destruction, but the OpenRouteService makes no representations or warranties regarding the security of the OpenRouteService or the transmission of data or information to and from OpenRouteService and your accessed device. OpenRouteService will not be liable to you or anyone else in the event of any unauthorized infiltration of any of its systems.\
				</p>\
				<p><h4>Prohibited Conduct</h4>\
				You may not use the Services for any unlawful purpose. Your use of the Services must comply with all local rules regarding online conduct and acceptable content.\
				You may not use the Services in any manner that could damage or overburden the Services or interfere with any other party's use of the Services.\
				You may not engage in other unacceptable use of the Services, which includes:\
				<li>Disseminating material that is abusive, obscene, pornographic, defamatory, harassing, grossly offensive, vulgar, threatening, or malicious;</li>\
				<li>Aiding or implementing practices violating basic human rights or civil liberties;</li>\
				<li>Disseminating or storing material that infringes the copyright, trademark, patent, trade secret, or other intellectual property right of any person;</li>\
				<li>Creating a false identity or otherwise attempting to mislead others as to the identity or origin of any communication;</li>\
				<li>Exporting, re-exporting, or permitting downloading of any content in violation of any export or import law, regulation, or restriction of the European Union and its agencies or authorities, or without all required approvals, licenses, or exemptions;</li>\
				<li>Interfering with or attempting to gain unauthorized access to any computer network;</li>\
				<li>Transmitting viruses, trojan horses, or any other malicious code or program; or</li>\
				<li>Engaging in any other activity deemed by OpenRouteService to be in conflict with the spirit or intent of these Terms.</li>\
				</p>\
			</section>" );
		
	}
}

