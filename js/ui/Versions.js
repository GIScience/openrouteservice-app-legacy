/**
 * Version deals with different appearances of the ORS client, e.g. the version 'standard' and 'extended'.
 * While the standard version contains only basic features, the extended version offers some more advanced options like route export/import, avoid areas,...
 * Switching between different versions means hiding or showing appropriate Ui elements (i.e. DIVs) 
 */
var Versions = ( function(w) {'use strict';

	var $ = w.jQuery;

	function Versions() {
		//different versions available
		this.standard = list.version[0];
		this.extended = list.version[1];
	}
	
	/**
	 * figure out which version to apply to the ORS site and show/hide Ui elements 
	 */
	function applyVersion(version) {
		switch (version) {
			case this.standard:
				applyStandardVersion();
				break;
			case this.extended:
				applyExtendedVersion();
				break;	
		}
	}
	
	/**
	 * hide Ui elements that are not visible in the standard version. 
	 */
	function applyStandardVersion() {
		//hide avoid areas
		$('#avoidAreas').show();
		
		//hide import/export features
		$('#exportImport').show();
		
		//hide accessibility analysis
		$('#accessibilityAnalysis').show();
	}
	
	/**
	 * Show elements that are visible in the extended version. Hide other elements. 
	 */
	function applyExtendedVersion() {
		//show avoid areas
		$('#avoidAreas').show();
		
		//show import/export features
		$('#exportImport').show();
		
		//show accessibility analysis
		$('#accessibilityAnalysis').show();
	}
	
	Versions.prototype.applyVersion = applyVersion;

	return new Versions();
})(window);