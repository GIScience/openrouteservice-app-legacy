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
 * <p><b>Title: OpenLS LUS Create Request </b></p>
 * <p><b>Description:</b> Functions for create Request for OpenLS LUS </p>
 *
 * <p><b>Copyright:</b> Copyright (c) 2008</p>
 * <p><b>Institution:</b> University of Bonn, Department of Geography</p>
 * @author Pascal Neis, neis@geographie.uni-bonn.de
 * @version 1.0 2008-07-11
 */
 
///////////////////////////////////////////////////
//Function die XML Request an OpenLS LUS erstellt

function createGeocodeRequest($freeform, $maxresponse) {
	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
					<xls:XLS xmlns:xls=\"http://www.opengis.net/xls\" xmlns:sch=\"http://www.ascc.net/xml/schematron\" 
					xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" 
					xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" 
					xsi:schemaLocation=\"http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/LocationUtilityService.xsd\" 
					version=\"1.1\">
						<xls:RequestHeader/>
						<xls:Request methodName=\"GeocodeRequest\" requestID=\"123456789\" version=\"1.1\" maximumResponses=\"$maxresponse\">
							<xls:GeocodeRequest>
								<xls:Address countryCode=\"de,en\">
								    <xls:freeFormAddress>$freeform</xls:freeFormAddress>
								</xls:Address>
							</xls:GeocodeRequest>
						</xls:Request>
					</xls:XLS>";
	//return utf8_decode($request);
	return $request;
}

function createReverseGeocodeRequest($lon, $lat, $maxresponse) {
	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
					<xls:XLS xmlns:xls=\"http://www.opengis.net/xls\" xmlns:sch=\"http://www.ascc.net/xml/schematron\" 
					xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" 
					xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" 
					xsi:schemaLocation=\"http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/LocationUtilityService.xsd\" 
					version=\"1.1\">
						<xls:RequestHeader/>
							<xls:Request methodName=\"ReverseGeocodeRequest\" requestID=\"123456789\" version=\"1.1\" maximumResponses=\"$maxresponse\">
								<xls:ReverseGeocodeRequest>
									<xls:Position>
										<gml:Point>
											<gml:pos>$lon $lat</gml:pos>
										</gml:Point>
									</xls:Position>
								</xls:ReverseGeocodeRequest>
							</xls:Request>
						</xls:XLS>";
	return utf8_decode($request);
}

function createRevGeocodeRequest($pos, $maxresponse) {
	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
					<xls:XLS xmlns:xls=\"http://www.opengis.net/xls\" xmlns:sch=\"http://www.ascc.net/xml/schematron\" 
					xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" 
					xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" 
					xsi:schemaLocation=\"http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/LocationUtilityService.xsd\" 
					version=\"1.1\">
						<xls:RequestHeader/>
							<xls:Request methodName=\"ReverseGeocodeRequest\" requestID=\"123456789\" version=\"1.1\" maximumResponses=\"$maxresponse\">
								<xls:ReverseGeocodeRequest>
									<xls:Position>
										<gml:Point>
											<gml:pos>$pos</gml:pos>
										</gml:Point>
									</xls:Position>
								</xls:ReverseGeocodeRequest>
							</xls:Request>
						</xls:XLS>";
	return utf8_decode($request);
}
?>
