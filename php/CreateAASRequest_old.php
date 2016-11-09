<?php
/*+-------------+----------------------------------------------------------*
 *|        /\   |     University of Heidelberg                             *
 *|       |  |  |     Department of Geography                              *
 *|      _|  |_ |     GIScience Research Group                             *
 *|    _/      \|                                                          *
 *|___|         |                                                          *
 *|             |     Berliner Straße 48	                               *
 *|             |     D-69221 Heidelberg, Germany                          *
 *+-------------+----------------------------------------------------------*/
/**
 * <p><b>Title: RS </b></p>
 * <p><b>Description:</b> Functions for RS </p>
 *
 * <p><b>Copyright:</b> Copyright (c) 2015</p>
 * <p><b>Institution:</b> University of Heidelberg, Department of Geography</p>
 * @author Pascal Neis, Enrico Steiger , openrouteservice at geog.uni-heidelberg.de
 * @version 1.0 2015-02-01
 */
 
///////////////////////////////////////////////////
//Function die XML Request an Accessibility Analyse erstellt

function createAnalysisRequest($position, $minutes, $routepreference, $method, $interval) {
	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
			<aas:AAS version=\"1.0\" xmlns:aas=\"http://www.geoinform.fh-mainz.de/aas\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.geoinform.fh-mainz.de/aas\">
			<aas:RequestHeader>
			</aas:RequestHeader>
			<aas:Request methodName=\"AccessibilityRequest\" version=\"1.0\" requestID=\"00\">
				<aas:DetermineAccessibilityRequest>
					<aas:Accessibility>
						<aas:AccessibilityPreference>
							<aas:Time Duration=\"PT0H".$minutes."M00S\" />
						</aas:AccessibilityPreference>
						<aas:AccessibilitySettings>
							<aas:RoutePreference>$routepreference</aas:RoutePreference>
							<aas:Method>$method</aas:Method>
							<aas:Interval>$interval</aas:Interval>
						</aas:AccessibilitySettings>
						<aas:LocationPoint>
							<aas:Position>
								<gml:Point xmlns:gml=\"http://www.opengis.net/gml\" srsName=\"EPSG:4326\">
									<gml:pos>$position</gml:pos>
								</gml:Point>
							</aas:Position>
						</aas:LocationPoint>
					</aas:Accessibility>
					<aas:AccessibilityGeometryRequest>
						<aas:PolygonPreference>Detailed</aas:PolygonPreference>
					</aas:AccessibilityGeometryRequest>
				</aas:DetermineAccessibilityRequest>
			</aas:Request>
		</aas:AAS>";
		return $request;
}
?>