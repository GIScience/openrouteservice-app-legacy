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
 * <p><b>Title: OpenLS RS Create Request </b></p>
 * <p><b>Description:</b> Functions for create Request for OpenLS RS </p>
 *
 * <p><b>Copyright:</b> Copyright (c) 2008</p>
 * <p><b>Institution:</b> University of Bonn, Department of Geography</p>
 * @author Pascal Neis, neis@geographie.uni-bonn.de
 * @version 1.0 2008-07-11
 */
 
///////////////////////////////////////////////////
//Function die XML Request an OpenLS RS erstellt

function createRequest($startcoord, $endcoord, $viaPoints_XML, $language, $distanceunit, $routepref, $avoidAreas, $avoidFeatures, $instructions) {

	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
					<xls:XLS xmlns:xls=\"http://www.opengis.net/xls\" xmlns:sch=\"http://www.ascc.net/xml/schematron\" xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/xls
					D:\Schemata\OpenLS1.1\RouteService.xsd\" version=\"1.1\" xls:lang=\"$language\">
					<xls:RequestHeader/>
					<xls:Request methodName=\"RouteRequest\" requestID=\"123456789\" version=\"1.1\">
					<xls:DetermineRouteRequest distanceUnit=\"$distanceunit\">
						<xls:RoutePlan>
							<xls:RoutePreference>$routepref</xls:RoutePreference>
							<xls:WayPointList>
								<xls:StartPoint>
									<xls:Position>
										<gml:Point srsName=\"EPSG:4326\">
											<gml:pos>$startcoord</gml:pos>
										</gml:Point>
									</xls:Position>
								</xls:StartPoint>
								$viaPoints_XML		
								<xls:EndPoint>
									<xls:Position>
											<gml:Point srsName=\"EPSG:4326\">
												<gml:pos>$endcoord</gml:pos>
											</gml:Point>
										</xls:Position>
								</xls:EndPoint>
							</xls:WayPointList>
							<xls:AvoidList>
									$avoidAreas
									$avoidFeatures
							</xls:AvoidList>
						</xls:RoutePlan>
						$instructions
						<xls:RouteGeometryRequest/>
					</xls:DetermineRouteRequest>
					</xls:Request>
					</xls:XLS>";
	return $request;
}
?>
