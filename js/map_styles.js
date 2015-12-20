/** 
 * generates a random hex color
 */
function randomColors() {
    var randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    return randomColor;
}
/** 
 * Generates a green to red color range
 * source: http://stackoverflow.com/questions/11849308/generate-colors-between-red-and-green-for-an-input-range
 */
function rangeColors(rangeNumber) {
    var colorArr = [];
    var red = new Color(232, 9, 26),
        white = new Color(255, 255, 255),
        green = new Color(6, 170, 60),
        start = green,
        end = red;
    // if (rangeNumber > 50) {
    //     start = white,
    //     end = red;
    //     rangeNumber = rangeNumber % 51;
    // }
    var startColors = start.getColors(),
        endColors = end.getColors();
    for (var i = 0; i <= rangeNumber; i++) {
        var r = Interpolate(startColors.r, endColors.r, rangeNumber, i);
        var g = Interpolate(startColors.g, endColors.g, rangeNumber, i);
        var b = Interpolate(startColors.b, endColors.b, rangeNumber, i);
        var color = "rgb(" + r + "," + g + "," + b + ")";
        colorArr.push(color);
    }

    function Interpolate(start, end, steps, count) {
        var s = start,
            e = end,
            final = s + (((e - s) / steps) * count);
        return Math.floor(final);
    }

    function Color(_r, _g, _b) {
        var r, g, b;
        var setColors = function(_r, _g, _b) {
            r = _r;
            g = _g;
            b = _b;
        };
        setColors(_r, _g, _b);
        this.getColors = function() {
            var colors = {
                r: r,
                g: g,
                b: b
            };
            return colors;
        };
    }
    return colorArr;
}
/**
 * various leaflet styles for map
 */
function opacity(zoomlvl, hide) {
    if (zoomlvl >= 15) {
        if (hide) return 0;
        else return 0.5;
    } else {
        return 1;
    }
}

function fillOpacity(zoomlvl) {
    if (zoomlvl < 15) {
        return 0;
    } else {
        return 1;
    }
}

function weight(zoomlvl) {
    if (zoomlvl < 15) {
        return 0;
    } else {
        return 1;
    }
}

function routeWeight(zoomlvl, weight) {
    if (zoomlvl < 15) {
        return weight;
    } else {
        return weight + 5;
    }
}
/**
 * styles for route
 */
routeSettings = {
    lineWeight: 3,
    segmentWidth: 4
};
styles = {
    routeBase: function() {
        return {
            opacity: '0'
        };
    },
    routeOutline: function(zoomlvl, hide) {
        return {
            color: '#000',
            weight: routeSettings.segmentWidth + 5,
            opacity: opacity(zoomlvl, hide),
            zoomChange: 'routeOutline'
        };
    },
    routePadding: function(zoomlvl, hide) {
        return {
            color: '#fff',
            weight: routeWeight(zoomlvl, routeSettings.segmentWidth + 3),
            opacity: opacity(zoomlvl),
            zoomChange: 'routePadding'
        };
    },
    route: function(zoomlvl) {
        return {
            color: '#4682B4',
            opacity: opacity(zoomlvl),
            weight: routeWeight(zoomlvl, routeSettings.lineWeight),
            zoomChange: 'route'
        };
    },
    routeCornersBase: function() {
        return {
            opacity: 0
        };
    },
    routeCorners: function(zoomlvl) {
        return {
            color: '#4682B4',
            fillColor: 'white',
            fillOpacity: fillOpacity(zoomlvl),
            fill: true,
            radius: 3,
            weight: weight(zoomlvl),
            type: 'circle',
            zoomChange: 'routeCorners'
        };
    },
    gpxTrack: function() {
        return {
            color: randomColors(),
            stroke: 'true',
            opacity: '0.9',
            weight: 4,
        };
    },
    accessibilityAnalysis: function(color) {
        return {
            color: color,
            stroke: true,
            weight: 3
        };
    }
};