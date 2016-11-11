<?php
/*+-------------+----------------------------------------------------------*
 *|        /\   |     University of Heidelberg                             *
 *|       |  |  |     Department of Geography                              *
 *|      _|  |_ |     GIScience Research Group                             *
 *|    _/      \|                                                          *
 *|___|         |                                                          *
 *|             |     Berliner Straße 48                                   *
 *|             |     D-69221 Heidelberg, Germany                          *
 *+-------------+----------------------------------------------------------*/
/**
 * <p><b>Title: RS </b></p>
 * <p><b>Description:</b> Functions for RS </p>
 *
 * <p><b>Copyright:</b> Copyright (c) 2015</p>
 * <p><b>Institution:</b> University of Heidelberg, Department of Geography</p>
 * @author Amandus Butzer, Timothy Ellersiek, openrouteservice at geog.uni-heidelberg.de
 * @version 2.0 2016-11-03
 */
function createAnalysisRequest($object) {
	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
			<aas:AAS version=\"1.0\" xmlns:aas=\"http://www.geoinform.fh-mainz.de/aas\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.geoinform.fh-mainz.de/aas\">
			<aas:RequestHeader>
			</aas:RequestHeader>
			<aas:Request methodName=\"AccessibilityRequest\" version=\"1.0\" requestID=\"00\">
				<aas:DetermineAccessibilityRequest>
					<aas:Accessibility>
						<aas:AccessibilityPreference>
							<aas:Time Duration=\"PT0H{$object->minutes}M00S\" />
						</aas:AccessibilityPreference>
						<aas:AccessibilitySettings>
							<aas:RoutePreference>$object->routepreference</aas:RoutePreference>
							<aas:Method>$object->method</aas:Method>
							<aas:Interval>$object->interval</aas:Interval>
						</aas:AccessibilitySettings>
						<aas:LocationPoint>
							<aas:Position>
								<gml:Point xmlns:gml=\"http://www.opengis.net/gml\" srsName=\"EPSG:4326\">
									<gml:pos>$object->position</gml:pos>
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