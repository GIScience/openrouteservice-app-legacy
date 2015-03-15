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
//Function die XML Request an OpenLS DS erstellt

function createDirectoryRequest($position, $distance, $POIname, $POIvalue, $maxresponse) {
	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
				<xls:XLS xmlns:xls=\"http://www.opengis.net/xls\" xmlns:sch=\"http://www.ascc.net/xml/schematron\" 
				xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" 
				xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" 
				xsi:schemaLocation=\"http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/DirectoryService.xsd\" version=\"1.1\">
					<xls:RequestHeader/>
					<xls:Request methodName=\"DirectoryRequest\" requestID=\"123456789\" version=\"1.1\" maximumResponses=\"$maxresponse\">
						<xls:DirectoryRequest distanceUnit=\"M\" sortCriteria=\"Distance\">
							<xls:POILocation>
								<xls:WithinDistance>
									<xls:Position>
										<gml:Point>
											<gml:pos>$position</gml:pos>
										</gml:Point>
									</xls:Position>
									<xls:MinimumDistance value=\"$distance\" uom=\"M\"/>
								</xls:WithinDistance>
							</xls:POILocation>
							<xls:POIProperties directoryType=\"OSM\">
								<xls:POIProperty name=\"$POIname\" value=\"$POIvalue\"/>
							</xls:POIProperties>
						</xls:DirectoryRequest>
					</xls:Request>
				</xls:XLS>";
	//return utf8_decode($request);
	return $request;
}

// create a directory request (DWithin-Type)
function createDWithinRequest($position, $mindistance, $maxdistance, $POIname, $POIvalue, $maxresponse) {
	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
				<xls:XLS xmlns:xls=\"http://www.opengis.net/xls\" xmlns:sch=\"http://www.ascc.net/xml/schematron\" 
				xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" 
				xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" 
				xsi:schemaLocation=\"http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/DirectoryService.xsd\" version=\"1.1\">
					<xls:RequestHeader/>
					<xls:Request methodName=\"DirectoryRequest\" requestID=\"123456789\" version=\"1.1\" maximumResponses=\"$maxresponse\">
						<xls:DirectoryRequest distanceUnit=\"M\" sortCriteria=\"Distance\">
							<xls:POILocation>
								<xls:WithinDistance>
									<xls:Position>
										<gml:Point>
											<gml:pos>$position</gml:pos>
										</gml:Point>
									</xls:Position>
									<xls:MinimumDistance value=\"$mindistance\" uom=\"M\"/>
									<xls:MaximumDistance value=\"$maxdistance\" uom=\"M\"/>
								</xls:WithinDistance>
							</xls:POILocation>
							<xls:POIProperties directoryType=\"OSM\">
								<xls:POIProperty name=\"$POIname\" value=\"$POIvalue\"/>
							</xls:POIProperties>
						</xls:DirectoryRequest>
					</xls:Request>
				</xls:XLS>";
	//return utf8_decode($request);
	return $request;
}

// create a directory request (Nearest-Type)
function createNearestRequest($position, $POIname, $POIvalue) {
	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
				<xls:XLS xmlns:xls=\"http://www.opengis.net/xls\" xmlns:sch=\"http://www.ascc.net/xml/schematron\" 
				xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" 
				xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" 
				xsi:schemaLocation=\"http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/DirectoryService.xsd\" version=\"1.1\">
					<xls:RequestHeader/>
					<xls:Request methodName=\"DirectoryRequest\" requestID=\"123456789\" version=\"1.1\" maximumResponses=\"1\">
						<xls:DirectoryRequest distanceUnit=\"M\" sortCriteria=\"Distance\">
							<xls:POILocation>
								<xls:Nearest>
									<xls:Position>
										<gml:Point>
											<gml:pos>$position</gml:pos>
										</gml:Point>
									</xls:Position>
								</xls:Nearest>
							</xls:POILocation>
							<xls:POIProperties directoryType=\"OSM\">
								<xls:POIProperty name=\"$POIname\" value=\"$POIvalue\"/>
							</xls:POIProperties>
						</xls:DirectoryRequest>
					</xls:Request>
				</xls:XLS>";
	//return utf8_decode($request);
	return $request;
}

// create a directory request (Name-Type)
function createNameRequest($POIvalue){
	$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
				<xls:XLS xmlns:xls=\"http://www.opengis.net/xls\" xmlns:sch=\"http://www.ascc.net/xml/schematron\" 
				xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" 
				xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" 
				xsi:schemaLocation=\"http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/DirectoryService.xsd\" version=\"1.1\">
				<xls:RequestHeader/>
				<xls:Request methodName=\"DirectoryRequest\" requestID=\"123456789\" version=\"1.1\" maximumResponses=\"10\">
							<xls:DirectoryRequest>
							<xls:POIProperties directoryType=\"OSM\">
								<xls:POIProperty name=\"POIName\" value=\"$POIvalue\"/>
							</xls:POIProperties>
						</xls:DirectoryRequest>
					</xls:Request>
				</xls:XLS>";
return $request;
}

// create a directory request (Within Polygon)
function createPolygonRequest($Polygon, $POIname, $POIvalue, $maxresponse){
	
//	parse polygon and write Coordinate list
 
 	$xmlclist = explode(", ", $Polygon);
 	 
	for($count = 0; $count < count($xmlclist); $count++)
    {
		// write xml position tags in String
		$PolygonPos .= "<gml:pos>".$xmlclist[$count] ."</gml:pos>";
    }
    
//    echo $PolygonPos;
				
$request = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<xls:XLS xmlns:xls=\"http://www.opengis.net/xls\" xmlns:sch=\"http://www.ascc.net/xml/schematron\" xmlns:gml=\"http://www.opengis.net/gml\"
	xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"
	xsi:schemaLocation=\"http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/DirectoryService.xsd\" version=\"1.1\">
	<xls:RequestHeader />
	<xls:Request methodName=\"DirectoryRequest\" requestID=\"123456789\" version=\"1.1\" maximumResponses=\"125\">
		<xls:DirectoryRequest distanceUnit=\"M\" sortCriteria=\"Distance\">
			<xls:POILocation>
				<xls:WithinBoundary>
					<xls:AOI>
						<gml:Polygon>
							<gml:exterior>
								<gml:LinearRing xsi:type=\"gml:LinearRingType\">$PolygonPos</gml:LinearRing>
							</gml:exterior>
						</gml:Polygon>
					</xls:AOI>
				</xls:WithinBoundary>
			</xls:POILocation>
			<xls:POIProperties directoryType=\"OSM\">
				<xls:POIProperty name=\"$POIname\" value=\"$POIvalue\" />
			</xls:POIProperties>
		</xls:DirectoryRequest>
	</xls:Request>
</xls:XLS>";
				
//echo $request;
return $request;
}
?>
