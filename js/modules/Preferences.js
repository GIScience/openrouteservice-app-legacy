var permaInfo;
var Preferences = (function(w) {
    'use strict';
    //are there any cookies of thie page yet?
    var cookiesAvailable = false;
    var prefNames = list.prefNames;
    //store information that can be used for the permalink
    permaInfo = Array.apply(null, new Array(prefNames.length)).map(String.prototype.valueOf, 'null');
    /**
     * Constructor
     */
    function Preferences() {
        //indices for the prefNames array; to be accessed from other classes
        this.positionIdx = 0;
        this.zoomIdx = 1;
        this.layerIdx = 2;
        this.routeOptionsIdx = 3;
        this.avoidHighwayIdx = 4;
        this.avoidTollwayIdx = 5;
        this.avoidAreasIdx = 6;
        this.waypointIdx = 7;
        this.languageIdx = 8;
        this.routingLanguageIdx = 9;
        this.distanceUnitIdx = 10;
        this.versionIdx = 11;
        this.avoidUnpavedIdx = 12;
        this.avoidFerryIdx = 13;
        this.value_lengthIdx = 14;
        this.value_heightIdx = 15;
        this.value_weightIdx = 16;
        this.value_widthIdx = 17;
        this.value_axleloadIdx = 18;
        this.surfaceIdx = 19;
        this.inclineIdx = 20;
        this.slopedCurbIdx = 21;
        this.hazardousIdx = 22;
        this.weightIdx = 23;
        this.avoidStepsIdx = 24;
        this.routeOptionsTypesIdx = 25;
        this.trackTypeIdx = 26;
        this.smoothnessIdx = 27;
        this.avoidFordsIdx = 28;
        this.maxspeedIdx = 29;
        this.avoidPavedIdx = 30;
        this.avoidTunnelIdx = 31;
        //define variables
        this.language = 'en';
        this.routingLanguage = 'en';
        this.distanceUnit = 'm';
        this.version = list.version['extendedVersion'];
        this.dictionaryLang = window['lang_' + this.language];
        this.dictionaryInstruct = window['lang_' + this.language];
        //set permalink links
        permaInfo[this.languageIdx] = this.language;
        permaInfo[this.routingLanguageIdx] = this.routingLanguage;
        permaInfo[this.distanceUnitIdx] = this.distanceUnit;
        permaInfo[this.versionIdx] = this.version;
        //other fields are filled with default values when reading GET variables/ cookies etc.
        cookiesAvailable = false;
    }

    function getPrefName(idx) {
        return prefNames[idx];
    }
    /*
     * MULTI-LANGUAGE SUPPORT
     */
    /**
     * translates a given term to the selected language of the application
     * @param {Object} term: the key to translate to the given language based on the language files (dictionary)
     */
    function translate(term) {
        return this.dictionaryLang[term] || '';
    }
    /**
     * translates a given term to the selected language instruction of the application
     * @param {Object} term: the key to translate to the given language based on the language files (dictionary)
     */
    function translateInstructions(term) {
        return this.dictionaryInstruct[term] || '';
    }
    /**
     * finds the appropriate term in the dictionary based on the local translation, e.g. the German equivalent for 'bureau de change' (Wechselstube) will map to 'bureau_de_change'
     * @param {Object} translation: the translated value
     * @return the term or empty string if there exists no term for the translation
     */
    function reverseTranslate(translation) {
        for (var term in this.dictionaryLang) {
            if (this.dictionaryLang.hasOwnProperty(term)) {
                var dictEntry = new Element('text').insert(this.dictionaryLang[term]).innerHTML;
                if (dictEntry === translation) return term;
            }
        }
        //if there exists no term for the given translation
        return '';
    }
    /*
     * PREFERENCES
     */
    /**
     * automatically determines default parameters for variables or applies GET variables
     * @return GET variables that need to be applied to other objects directly 
     */
    function loadPreferencesOnStartup() {
        this.language = this.setLanguage();
        this.dictionaryLang = window['lang_' + this.language];
        this.routingLanguage = this.setRoutingLanguage();
        this.dictionaryInstruct = window['lang_' + this.routingLanguage];
        this.distanceUnit = this.setDistanceUnit();
        this.version = this.setVersion();
        //return GET variables that have to be applied to other objects
        return readGetVars();
    }
    /**
     * reads GET variables
     * @return array of GET variables
     * http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
     */
    function readGetVars() {
        var res = extractVars(window.location.search.substr(1).split('&'));
        var getVars = [];
        for (var name in res) {
            getVars[name] = res[name];
        }
        return getVars;
    }
    /** extracts GET variables from URL
     * @params a: url string
     */
    function extractVars(a) {
        if (a === "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i) {
            var p = a[i].split('=', 2);
            if (p.length == 1) {
                b[p[0]] = "";
            } else {
                var param = decodeURIComponent(p[1].replace(/\+/g, " "));
                if (param.indexOf(',') > -1) {
                    param = param.split(",");
                }
                b[p[0]] = param;
            }
        }
        return b;
    }
    /**
     * determines language by cookie information, browser language or uses English by default
     * @return the language 
     */
    function setLanguage() {
        //read from cookie
        var lang = readCookie(prefNames[this.languageIdx]);
        //if no cookie is available, use the browser's language
        if (!lang) {
            var userLang = (navigator.language) ? navigator.language : navigator.userLanguage;
            if (userLang.indexOf("de") != -1) {
                //use German for browser language codes that contain "de"
                lang = 'de';
            } else {
                //everything else is set to English
                lang = 'en';
            }
        }
        if (list.languages.indexOf(lang) == -1) {
            //this language doesn't exist in ORS, use default
            lang = 'en';
        }
        return lang;
    }
    /**
     * determines language for routing instructions either by cookie information, browser language or uses English by default
     * @return the language
     */
    function setRoutingLanguage() {
        //read from cookie
        var lang = readCookie(prefNames[this.routingLanguageIdx]);
        //if no cookie is available, use the language of the ORS site
        if (!lang) {
            var lang = this.language;
        }
        if (list.routingLanguages.indexOf(lang) == -1) {
            //this language doesn't exist in ORS, use default
            lang = 'en';
        }
        return lang;
    }
    /**
     * determines the distance unit either by cookie information or uses m/ km by default
     * @return the distance unit 
     */
    function setDistanceUnit() {
        //read from cookie
        var distUnit = readCookie(prefNames[this.distanceUnitIdx]);
        //if no cookie is available, use default
        if (!distUnit) {
            distUnit = list.distanceUnitsPreferences[0];
        }
        return distUnit;
    }
    /**
     * determines the site version either by cookie or using the standard version by default
     * @return the version 
     */
    function setVersion() {
        //read from cookie
        var siteVersion = readCookie(prefNames[this.versionIdx]);
        //if no cookie is available, use default
        if (!siteVersion) {
            siteVersion = list.version[0];
        }
        return siteVersion;
    }
    /**
     * determines the map positoin by using GET variable, cookie or geolocation feature
     * @param pos: extracted from the GET variables in readGetVars(); array containing lon and lat coordinates
     * @return the position
     */
    function loadMapPosition(pos) {
        if (pos && pos.length == 2) {
            //use GET variables (permalink)
            pos = L.latLng(pos[1], pos[0]);
        }
        if (!pos) {
            //if GET is not set and geolocation not available use cookie
            pos = unescape(readCookie(prefNames[this.positionIdx]));
            if (pos != "null") {
                var pos = pos.split(',');
                pos = new L.latLng(pos[1], pos[0]);
            }
        }
        //if neither GET nor cookie have been set -> use Geolocation (called in control.js) or default (Heidelberg) which is automatically set when initializing the map
        //save this location in the permaInfo array
        permaInfo[this.positionIdx] = escape(pos.lng + ',' + pos.lat);
        return pos;
    }
    /**
     * determines the zoom level of the map by using GET variable or cookie
     * @param zoomGet: extracted from the GET variables in readGetVars()
     * @return the zoom level
     */
    function loadMapZoom(zoomGet) {
        //use GET variable (permalink)
        var zoom = zoomGet;
        if (!zoom) {
            //if GET is not set, use cookie
            zoom = readCookie(prefNames[this.zoomIdx]);
        }
        //if neither GET nor cookie have been set -> use default which is set automatically
        //save the zoom level in the permaInfo array
        permaInfo[this.zoomIdx] = escape(zoom) || 13;
        return zoom;
    }
    /**
     * determines active map layers by using GET variable or cookie
     * @param layerCode: extracted from the GET variables in readGetVars()
     * @return the encoded layer information
     */
    function loadMapLayer(layerCode) {
        //use GET variable (permalink)
        if (!layerCode) {
            //if GET is not set, use cookie
            layerCode = readCookie(prefNames[this.layerIdx]);
        }
        //if neither GET nor cookie have been set -> use default which is set automatically
        //save the layers in the permaInfo array; the map can handle a missing value, no problem.
        permaInfo[this.layerIdx] = escape(layerCode);
        return layerCode;
    }
    /**
     * determines waypoints by using GET variable (default is no waypoints set)
     * @param waypoints: extracted from the GET variables in readGetVars()
     * @return array of waypoints represented by OL.LonLat coordinates
     */
    function loadWaypoints(waypoints) {
        if (waypoints) {
            //save waypoints in permaInfo array
            permaInfo[this.waypointIdx] = waypoints == undefined ? null : waypoints;
            waypoints = unescape(waypoints);
            var lonLatCoordinates = waypoints.split(',');
            waypoints = [];
            for (var i = 0; i < lonLatCoordinates.length - 1; i += 2) {
                waypoints.push(L.latLng(lonLatCoordinates[i + 1], lonLatCoordinates[i]));
            }
        }
        return waypoints;
    }
    /**
     * determines route options by GET variable
     * @param routeWeight: extracted from the GET variables in readGetVars()
     * @return the route weight option
     */
    function loadRouteWeight(routeWeight) {
        routeWeight = unescape(routeWeight);
        //set a default in the permaInfo Array if routeOpt == null, undef, etc.
        if (routeWeight == undefined || routeWeight == null || routeWeight == 'undefined') {
            routeWeight = 'Fastest';
        }
        permaInfo[this.weightIdx] = routeWeight;
        return routeWeight;
    }
    /**
     * determines route options by GET variable
     * @param maxspeed: extracted from the GET variables in readGetVars()
     * @return the maxspeed option
     */
    function loadMaxspeed(maxspeed) {
        maxspeed = unescape(maxspeed);
        maxspeed = ((maxspeed == 'undefined' || maxspeed === undefined) ? null : maxspeed);
        permaInfo[this.maxspeedIdx] = maxspeed;
        return maxspeed;
    }
    /**
     * determines route option types by GET variable
     * @param routeOptType: extracted from the GET variables in readGetVars()
     * @return the route options
     */
    function loadRouteOptionsType(routeOptType) {
        routeOptType = unescape(routeOptType);
        //set a default in the permaInfo Array if routeOptType == null, undef, etc.
        if (routeOptType == null || routeOptType == 'undefined') {
            routeOptType = null;
        }
        permaInfo[this.routeOptionsTypesIdx] = routeOptType;
        //check if the routeOptType parameter is a valid routeOption.
        var mainObjects = list.routePreferencesTypes.keys();
        var isValid = false;
        for (var i = 0; i < mainObjects.length; i++) {
            isValid = list.routePreferencesTypes.get(mainObjects[i]).indexOf(routeOptType) != -1;
            //list.routePreferencesTypes.get(mainObjects[i]).indexOf(routeOptType))
            if (isValid) {
                break;
            }
        }
        if (!isValid) {
            //we found a parameter to parse, but this wasn't a valid route option. Use the default instead
            routeOptType = permaInfo[this.routeOptionsTypesIdx];
        }
        return routeOptType;
    }
    /**
     * determines route options by GET variable
     * @param routeOpt: extracted from the GET variables in readGetVars()
     * @return the route options
     */
    function loadRouteOptions(routeOpt) {
        routeOpt = unescape(routeOpt);
        //set a default in the permaInfo Array if routeOpt == null, undef, etc.
        if (routeOpt == undefined || routeOpt == null || routeOpt == 'undefined') {
            routeOpt = list.routePreferences.get('car')[0];
            // routeOpt = list.routePreferences.get('wheelchair')[0];
        }
        permaInfo[this.routeOptionsIdx] = routeOpt;
        //check if the routeOpt parameter is a valid routeOption.
        var mainObjects = list.routePreferences.keys();
        var isValid = false;
        for (var i = 0; i < mainObjects.length; i++) {
            isValid = list.routePreferences.get(mainObjects[i]).indexOf(routeOpt) != -1;
            if (isValid) {
                break;
            }
        }
        if (!isValid) {
            //we found a parameter to parse, but this wasn't a valid route option. Use the default instead
            routeOpt = permaInfo[this.routeOptionsIdx];
        }
        return routeOpt;
    }
    /**
     * checks truck parameters from get variable, fills perma settings
     * @return the truck parameters
     */
    function loadtruckParameters(truck_length, truck_height, truck_width, truck_weight, truck_axleload) {
        var truckParameters = new Array();
        if (truck_length == undefined || truck_length == null || truck_length == 'undefined' || truck_length == 'null') {
            permaInfo[this.value_lengthIdx] = null;
        } else {
            permaInfo[this.value_lengthIdx] = truck_length;
            truckParameters[0] = truck_length;
        }
        if (truck_height == undefined || truck_height == null || truck_height == 'undefined' || truck_height == 'null') {
            permaInfo[this.value_heightIdx] = null;
        } else {
            permaInfo[this.value_heightIdx] = truck_height;
            truckParameters[1] = truck_height;
        }
        if (truck_width == undefined || truck_width == null || truck_width == 'undefined' || truck_width == 'null') {
            permaInfo[this.value_widthIdx] = null;
        } else {
            permaInfo[this.value_widthIdx] = truck_width;
            truckParameters[2] = truck_width;
        }
        if (truck_weight == undefined || truck_weight == null || truck_weight == 'undefined' || truck_weight == 'null') {
            permaInfo[this.value_weightIdx] = null;
        } else {
            permaInfo[this.value_weightIdx] = truck_weight;
            truckParameters[3] = truck_weight;
        }
        if (truck_axleload == undefined || truck_axleload == null || truck_axleload == 'undefined' || truck_axleload == 'null') {
            permaInfo[this.value_axleloadIdx] = null;
        } else {
            permaInfo[this.value_axleloadIdx] = truck_axleload;
            truckParameters[4] = truck_axleload;
        }
        return truckParameters;
    }
    /**
     * checks if hazardous from GET variables is declared
     * @return the hazardous parameter
     */
    function loadHazardous(hazardous) {
        if (hazardous == undefined || hazardous == null || hazardous == 'undefined') {
            permaInfo[this.hazardousIdx] = escape("null");
        } else {
            permaInfo[this.hazardousIdx] = hazardous;
        }
        return hazardous;
    }
    /**
     * determines route option avoidables by GET variable
     * @param highway, tollway,unpaved, ferry, steps, fords, paved, tunnel: extracted from the GET variables in readGetVars()
     * @return the avoidables
     */
    function loadAvoidables(highway, tollway, unpaved, ferry, steps, fords, paved, tunnel) {
        var avoidables = [false, false, false, false, false, false, false, false];
        // highway
        if (highway == true || highway == 'true') {
            permaInfo[this.avoidHighwayIdx] = true;
            avoidables[0] = true;
        } else {
            permaInfo[this.avoidHighwayIdx] = false;
        }
        // tollway
        if (tollway == true || tollway == 'true') {
            permaInfo[this.avoidTollwayIdx] = true;
            avoidables[1] = true;
        } else {
            permaInfo[this.avoidTollwayIdx] = false;
        }
        // tunnel
        if (tunnel == true || tunnel == 'true') {
            permaInfo[this.avoidTunnelIdx] = true;
            avoidables[7] = true;
        } else {
            permaInfo[this.avoidTunnelIdx] = false;
        }
        // unpaved
        if (unpaved == true || unpaved == 'true') {
            permaInfo[this.avoidUnpavedIdx] = true;
            avoidables[2] = true;
        } else {
            permaInfo[this.avoidUnpavedIdx] = false;
        }
        // paved
        if (paved == true || paved == 'true') {
            permaInfo[this.avoidPavedIdx] = true;
            avoidables[6] = true;
        } else {
            permaInfo[this.avoidPavedIdx] = false;
        }
        // ferry
        if (ferry == true || ferry == 'true') {
            permaInfo[this.avoidFerryIdx] = true;
            avoidables[3] = true;
        } else {
            permaInfo[this.avoidFerryIdx] = false;
        }
        // steps
        if (steps == true || steps == 'true') {
            permaInfo[this.avoidStepsIdx] = true;
            avoidables[4] = true;
        } else {
            permaInfo[this.avoidStepsIdx] = false;
        }
        // fords
        if (fords == true || fords == 'true') {
            permaInfo[this.avoidFordsIdx] = true;
            avoidables[5] = true;
        } else {
            permaInfo[this.avoidFordsIdx] = false;
        }
        return avoidables;
    }
    /**
     * determines route option wheelchair parameters by GET variable
     * @param surface, incline, slopedCurb: extracted from the GET variables in readGetVars()
     * @return the wheelchair parameters
     */
    function loadWheelParameters(surface, incline, slopedCurb, tracktype, smoothness) {
        var wheelParameters = new Array();
        if (surface == undefined || surface == null || surface == 'undefined' || surface == 'null') {
            surface = list.wheelchairParameters.get('Surface')[1];
        }
        wheelParameters[0] = surface;
        permaInfo[this.surfaceIdx] = surface;
        if (incline == undefined || incline == null || incline == 'undefined' || incline == 'null') {
            incline = list.wheelchairParameters.get('Incline')[1];
        }
        wheelParameters[1] = incline;
        permaInfo[this.inclineIdx] = incline;
        if (slopedCurb == undefined || slopedCurb == null || slopedCurb == 'undefined' || slopedCurb == 'null') {
            slopedCurb = list.wheelchairParameters.get('SlopedCurb')[1];
        }
        wheelParameters[2] = slopedCurb;
        permaInfo[this.slopedCurbIdx] = slopedCurb;
        if (tracktype == undefined || tracktype == null || tracktype == 'undefined' || tracktype == 'null') {
            tracktype = list.wheelchairParameters.get('Tracktype')[1];
        }
        permaInfo[this.trackTypeIdx] = tracktype;
        wheelParameters[3] = tracktype;
        if (smoothness == undefined || smoothness == null || smoothness == 'undefined' || smoothness == 'null') {
            tracktype = list.wheelchairParameters.get('Smoothness')[1];
        }
        permaInfo[this.smoothnessIdx] = smoothness;
        wheelParameters[4] = smoothness;
        return wheelParameters;
    }
    /**
     * determines avoid areas by GET variable
     * @param avoidAreas: extracted from the GET variables in readGetVars()
     * @return an array of avoid areas; each area is represented by an OL.Geometry.Polygon
     */
    function loadAvoidAreas(avoidAreas) {
        permaInfo[this.avoidAreasIdx] = avoidAreas == undefined ? null : avoidAreas;
        avoidAreas = unescape(avoidAreas);
        var allAvoidAreas = [];
        var differentAreas = avoidAreas.split(';');
        for (var j = 0; j < differentAreas.length; j++) {
            var lonLatCoordinates = differentAreas[j].split(',');
            avoidAreas = [];
            for (var i = 0; i < lonLatCoordinates.length - 1; i += 2) {
                avoidAreas.push(L.latLng(lonLatCoordinates[i + 1], lonLatCoordinates[i]));
            }
            if (avoidAreas.length > 0) {
                //generate avoid area Polygon
                var poly = L.polygon(avoidAreas);
                allAvoidAreas.push(poly)
            }
        }
        return allAvoidAreas;
    }
    /**
     * if the user changes e.g. route options from "mountainbike" to "pedestrian", update this information in the permaInfo array.
     * @param key: the index of the permaInfo array to update
     * @param value: the value that should be assigned to that field
     * @param idx: optional which indicates position of waypoint
     */
    function updatePreferences(key, value) {
        permaInfo[key] = value;
    }
    /*
     * COOKIES
     */
    /**
     * gets the cookie with the given name
     * @param name: the name of the cookie
     * @return: the content of the cookie
     */
    function readCookie(name) {
        if (!name) {
            return null;
        }
        var allCookies = document.cookie;
        if (allCookies.indexOf(name) == -1) {
            return null;
        }
        //example entry: "cookie-name=cookieValue;"
        //start after the name of the cookie
        var indFirst = allCookies.indexOf(name) + name.length;
        //read until ';' or use length of string if there is no ';' at the end
        var cutStart = allCookies.substring(indFirst);
        var indLast = cutStart.indexOf(';') != -1 ? cutStart.indexOf(';') : cutStart.length;
        //start at 1 to slice away the '=' inbetween
        var cookieData = cutStart.substring(1, indLast);
        if (cookieData) {
            //cookie exists
            cookiesAvailable = true;
        }
        return cookieData;
    }
    /**
     * Used to write all information at once; e.g. if no cookies are available so far
     * when the map position or zoom level changes, refresh the cookies with the current data
     * @param lon: lon coordinate of current position
     * @param lat: lat coordinate of current position
     * @param zoomLvl: map zoom level
     */
    function writeMapCookies(lon, lat, zoomLvl) {
        //convert position into String
        var position = lon + "," + lat;
        var exdate = new Date();
        //cookie expires in 30 days
        exdate.setDate(exdate.getDate() + 30);
        document.cookie = prefNames[this.positionIdx] + "=" + escape(position) + ";expires=" + exdate.toUTCString();
        document.cookie = prefNames[this.zoomIdx] + "=" + escape(zoomLvl) + ";expires=" + exdate.toUTCString();
        permaInfo[this.positionIdx] = escape(position);
        permaInfo[this.zoomIdx] = escape(zoomLvl);
        cookiesAvailable = true;
    }
    /**
     * Used to write all information at once; e.g. if no cookies are available so far
     * when the selected mapLayer changes, refresh the cookies with the current data
     * @param layerCode: encoded layer information (which layers and overlays are active)
     */
    function writeBaseMapCookie(layerCode) {
        var exdate = new Date();
        //cookie expires in 30 days
        exdate.setDate(exdate.getDate() + 30);
        document.cookie = prefNames[this.layerIdx] + "=" + escape(layerCode) + ";expires=" + exdate.toUTCString();
        permaInfo[this.layerIdx] = escape(layerCode);
        cookiesAvailable = true;
    }
    /**
     * Used to write all information at once; e.g. if no cookies ara available so far
     * Write language, language of routing instructions, distance unit and selected version
     */
    function writePrefsCookies() {
        var exdate = new Date();
        //cookie expires in 30 days
        exdate.setDate(exdate.getDate() + 30);
        document.cookie = prefNames[this.languageIdx] + "=" + escape(this.language) + ";expires=" + exdate.toUTCString();
        document.cookie = prefNames[this.routingLanguageIdx] + "=" + escape(this.routingLanguage) + ";expires=" + exdate.toUTCString();
        document.cookie = prefNames[this.distanceUnitIdx] + "=" + escape(this.distanceUnit) + ";expires=" + exdate.toUTCString();
        document.cookie = prefNames[this.versionIdx] + "=" + escape(this.version) + ";expires=" + exdate.toUTCString();
        cookiesAvailable = true;
    }
    /**
     * if the user e.g. changes the language of the application this is updated in the cookie
     * @param key: the index of the prefNames array to update
     * @param value: the value that should be assigned to that field
     */
    function updateCookies(key, value) {
        if (value && value.length > 0) {
            var exdate = new Date();
            //cookie expires in 30 days
            exdate.setDate(exdate.getDate() + 30);
            document.cookie = prefNames[key] + "=" + escape(value) + ";expires=" + exdate.toUTCString();
            permaInfo[key] = escape(value);
            //the preference is one of language, routingLanguage, distanceUnit and version -> have to be saved in separate variable
            this.language = key == this.languageIdx ? value : this.langauge;
            this.routingLanguage = key == this.routingLanguageIdx ? value : this.routingLanguage;
            this.distanceUnit = key == this.distanceUnitIdx ? value : this.distanceUnit;
            this.version = key == this.versionIdx ? value : this.version;
            this.dictionaryLang = window['lang_' + this.language];
            this.dictionaryInstruct = window['lang_' + this.routingLanguage];
        }
    }
    /**
     * has the user visited this site before/ are there cookies yet?
     */
    function areCookiesAVailable() {
        return cookiesAvailable;
    }
    /*
     * PERMALINK
     */
    /**
     * open new window with the permalink
     */
    var url;
    if (location.hostname.match('openrouteservice') || location.hostname.match('localhost')) {
        url = "cgi-bin/proxy.cgi?url=" + namespaces.services.shorten;
    } else {
        url = namespaces.services.shorten;
    }

    function generatePermalink(option) {
        var query = 'http://www.openrouteservice.org?';
        for (var i = 0; i < prefNames.length; i++) {
            if (permaInfo[i] != null && permaInfo[i] != 'null' && permaInfo[i] != false && permaInfo[i] != 'false') {
                query += prefNames[i] + '=' + permaInfo[i] + '&';
            }
        }
        //slice away last '&'
        query = query.substring(0, query.length - 1);
        jQuery.ajax({
            url: url,
            type: "POST",
            crossDomain: false,
            data: query,
            dataType: "text",
            contentType: "text/xml; charset=utf-8",
            success: function(response) {
                if (option == 'copy') {
                    window.prompt("Copy to clipboard: Ctrl+C or Cmd+C, Enter", response);
                } else if (option == 'open') {
                    window.open(response)
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                alert("Status: " + textStatus);
                alert("Error: " + errorThrown);
            }
        });
    }
    /**
     * the site is reloaded with the permalink (used after preferences have been changed) 
     */
    function reloadWithPerma() {
        var query = '?';
        for (var i = 0; i < prefNames.length; i++) {
            query += prefNames[i] + '=' + permaInfo[i] + '&';
        }
        //slice away last '&'
        query = query.substring(0, query.length - 1);
        window.location.search = query;
    }
    Preferences.prototype.getPrefName = getPrefName;
    Preferences.prototype.translate = translate;
    Preferences.prototype.translateInstructions = translateInstructions;
    Preferences.prototype.reverseTranslate = reverseTranslate;
    Preferences.prototype.loadPreferencesOnStartup = loadPreferencesOnStartup;
    //actually, setLang, setRoutingLang, setDist, setVersion should be private; but then there are some problems with calling some varaibles, etc.
    //Didn't find a solution for that, so I used this workaround.
    Preferences.prototype.setLanguage = setLanguage;
    Preferences.prototype.setRoutingLanguage = setRoutingLanguage;
    Preferences.prototype.setDistanceUnit = setDistanceUnit;
    Preferences.prototype.setVersion = setVersion;
    Preferences.prototype.loadMapPosition = loadMapPosition;
    Preferences.prototype.loadMapZoom = loadMapZoom;
    Preferences.prototype.loadMapLayer = loadMapLayer;
    Preferences.prototype.loadWaypoints = loadWaypoints;
    Preferences.prototype.loadRouteOptions = loadRouteOptions;
    Preferences.prototype.loadRouteWeight = loadRouteWeight;
    Preferences.prototype.loadMaxspeed = loadMaxspeed;
    Preferences.prototype.loadRouteOptionsType = loadRouteOptionsType;
    Preferences.prototype.loadAvoidables = loadAvoidables;
    Preferences.prototype.loadAvoidAreas = loadAvoidAreas;
    Preferences.prototype.loadtruckParameters = loadtruckParameters;
    Preferences.prototype.loadWheelParameters = loadWheelParameters;
    Preferences.prototype.loadHazardous = loadHazardous;
    Preferences.prototype.writeMapCookies = writeMapCookies;
    Preferences.prototype.writeBaseMapCookie = writeBaseMapCookie;
    Preferences.prototype.writePrefsCookies = writePrefsCookies;
    Preferences.prototype.updatePreferences = updatePreferences;
    Preferences.prototype.updateCookies = updateCookies;
    Preferences.prototype.areCookiesAVailable = areCookiesAVailable;
    Preferences.prototype.generatePermalink = generatePermalink;
    Preferences.prototype.reloadWithPerma = reloadWithPerma;
    Preferences.prototype.extractVars = extractVars;
    return new Preferences();
}(window));