<?php
/*+-------------+----------------------------------------------------------*
 *|        /\   |   University of Bonn                                     *
 *|       |  |  |     Department of Geography                              *
 *|      _|  |_ |     Chair of Cartography                                 *
 *|    _/      \|                                                          *
 *|___|         |                                                          *
 *|             |     Meckenheimer Allee 172                               *
 *|             |     D-53115 Bonn, Germany                                *
 *+-------------+----------------------------------------------------------*/
/**
 * <p><b>Title: AAS Request </b></p>
 * <p><b>Description:</b> Functions for create Request for AAS </p>
 *
 * <p><b>Copyright:</b> Copyright (c) 2008</p>
 * <p><b>Institution:</b> University of Bonn, Department of Geography</p>
 * @author Pascal Neis, neis@geographie.uni-bonn.de
 * @version 1.0 2008-07-11
 */
 
///////////////////////////////////////////////////
//Function die XML Request an Accessibility Analyse erstellt

function createRequest($position, $minutes) {
	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
				<aas:AAS version=\"1.0\" xmlns:aas=\"http://www.geoinform.fh-mainz.de/aas\" 
				xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" 
				xsi:schemaLocation=\"http://www.geoinform.fh-mainz.de/aas D:\Schemata\AAS1.0\AccessibilityService.xsd\">
					<aas:RequestHeader/>
					<aas:Request methodName=\"AccessibilityRequest\" requestID=\"123456789\" version=\"1.0\">
						<aas:DetermineAccessibilityRequest>
							<aas:Accessibility>
								<aas:AccessibilityPreference>
									<aas:Time Duration=\"PT0H".$minutes."M00S\"></aas:Time>
								</aas:AccessibilityPreference>
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
