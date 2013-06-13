/**
 * Class: OpenRouteService.Gui.Collapsible.RouteExtras
 * Represents route extras
 */
OpenRouteService.Gui.Collapsible.RouteExtras = Class.create(OpenRouteService.Gui.Collapsible, {
	routeInstance: null,
	errorContainer : null,
	/**
	 * Is called by OpenRouteService.Gui.Route
	 *
	 * Parameters:
	 * RouteInstructions - A NodeList of XLS:RouteInstruction elements.
	 */
	initialize : function(route) {
		this.routeInstance = route;
		this.init();

		this.head.update(OpenRouteService.Preferences.translate('routeExtras') + ':<br>');

		var self = this;
		
		this.errorContainer = new Element('div', {
			'class' : 'alert alert-error'
		}).hide();
		this.body.insert(this.errorContainer);
		
		//for route link
		var routeLink = new Element('div', {
			'class' : 'panel panelMedium'
		});
		routeLink.insert(new Element('p').update(OpenRouteService.Preferences.translate('routeLinkText')));
		
		var linkBtn = new Element('btn', {
			'class' : 'btn'
		}).update('Permalink');
		linkBtn.observe('click', function() {
			self.routeInstance.linkToRoute();			
		});
				
		routeLink.insert(linkBtn);
		this.body.insert(routeLink);
		
		if (OpenRouteService.Preferences.version == OpenRouteService.VERSION_EXTENDED) {
			this.body.insert(new Element('label').insert('<b>GPX</b>'));
		}
		
		//for downloading
		var gpxDownload = new Element('div', {
			'class' : 'panel panelMedium'
		});
		gpxDownload.insert(new Element('p').update(OpenRouteService.Preferences.translate('gpxDownloadText')));
		
		var downloadBtn = new Element('btn', {
			'class' : 'btn'
		}).update('Download GPX');
		downloadBtn.observe('click', function() {
			self.routeInstance.writeToGpxFile();			
		});

		gpxDownload.insert(downloadBtn);
		this.body.insert(gpxDownload);
		
		//GPX download is only visible in the extended version
		if (OpenRouteService.Preferences.version != OpenRouteService.VERSION_EXTENDED) {
			gpxDownload.hide();
		}
		
		//for uploading
		var gpxUpload = new Element('div', {
			'class' : 'panel panelMedium'
		});
		gpxUpload.insert(new Element('p').update(OpenRouteService.Preferences.translate('gpxUploadRouteText')));
		var fileChooser = new Element('form', {
			'class' : 'fileUploadForm'
		});
		var fileUploader = new Element('div', {
			'id' : 'gpxUploadFiles',
			'class' : 'fileupload fileupload-new',
			'data-provides' : 'fileupload'
		});
		fileUploader.insert('<span class="btn btn-file"><span class="fileupload-new">Select file</span><span class="fileupload-exists">Change</span><input type="file" /></span> <span class="fileupload-preview"></span>');
		var fileUploader_ref = new Element('a', {
			'href' : '#',
			'class' : 'close fileupload-exists',
			'data-dismiss' : 'fileupload',
			'style' : 'float:none'
		}).insert('x');
		fileUploader_ref.observe('click', function() {
			//remove the route from the GPX file
			self.routeInstance.deleteGpxFileRoute();
		})
		fileUploader.insert(fileUploader_ref);	 
		 fileChooser.insert(fileUploader).observe('change', function() {
		 	//display the route in the GPX file
		 	//used to re-calculate the route based on start and end
		 	self.routeInstance.readFromGpxFile(true, 'gpxUploadFiles');
		 });
		gpxUpload.insert(fileChooser);
		this.body.insert(gpxUpload);
		
		//GPX file upload is only visible in the extended version
		if (OpenRouteService.Preferences.version != OpenRouteService.VERSION_EXTENDED) {
			gpxUpload.hide();
		}
		
		//display GPX track
				var gpxTrack = new Element('div', {
			'class' : 'panel panelMedium'
		});
		gpxTrack.insert(new Element('p').update(OpenRouteService.Preferences.translate('gpxUploadTrackText')));
		var fileChooser = new Element('form', {
			'class' : 'fileUploadForm'
		});
		var fileUploader = new Element('div', {
			'id' : 'gpxUploadTrack',
			'class' : 'fileupload fileupload-new',
			'data-provides' : 'fileupload'
		});
		fileUploader.insert('<span class="btn btn-file"><span class="fileupload-new">Select file</span><span class="fileupload-exists">Add</span><input type="file" /></span> <span class="fileupload-preview"></span>');
		var fileUploader_ref = new Element('a', {
			'href' : '#',
			'class' : 'close fileupload-exists',
			'data-dismiss' : 'fileupload',
			'style' : 'float:none'
		});
		fileUploader.insert(fileUploader_ref);	 
		 fileChooser.insert(fileUploader).observe('change', function() {
		 	//display the route in the GPX file
		 	//used to display exactly the route saved in the file (draft)
		 	self.routeInstance.readFromGpxFile(false, 'gpxUploadTrack');
		 });
		gpxTrack.insert(fileChooser);
		this.body.insert(gpxTrack);
		
		//GPX file upload is only visible in the extended version
		if (OpenRouteService.Preferences.version != OpenRouteService.VERSION_EXTENDED) {
			gpxTrack.hide();
		}
	}
});