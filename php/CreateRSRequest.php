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
//Function die XML Request an OpenLS RS erstellt

function createRequest($startcoord, $endcoord, $viaPoints_XML, $language, $distanceunit, $routepref, $weighting, $avoidAreas, $avoidFeatures, $hgv, $haz, $sur, $ele, $maxspeed, $instructions) {

	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
					<xls:XLS xmlns:xls=\"http://www.opengis.net/xls\" xmlns:sch=\"http://www.ascc.net/xml/schematron\" xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/xls
					D:\Schemata\OpenLS1.1\RouteService.xsd\" version=\"1.1\" xls:lang=\"$language\">
					<xls:RequestHeader/>
					<xls:Request methodName=\"RouteRequest\" requestID=\"123456789\" version=\"1.1\">
					<xls:DetermineRouteRequest distanceUnit=\"$distanceunit\">
						<xls:RoutePlan>
						<xls:RoutePreference>$routepref</xls:RoutePreference>
							<xls:ExtendedRoutePreference>
									<xls:WeightingMethod>$weighting</xls:WeightingMethod>
									$sur
									$ele
									$hgv
									$haz
									$maxspeed
							</xls:ExtendedRoutePreference>
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
