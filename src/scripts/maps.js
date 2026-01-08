/*
Author: Skyler Crane (cranes2@wwu.edu)
Description: The purpose of this file is to handle the initialization and 
	functionality of the interactive Google Map using the Javascript API.
*/

let map;
let mapCenter;
let stopsLayer;
let routesLayer;

// Initialize and return map object, and place it in its div
function setup_map(Map) {
	let mapStyles = [
	{"featureType": "transit.station.bus", "stylers": [{ "visibility": "off" }]},
	{"featureType": "road.highway","elementType": "geometry","stylers": [{"color": "#A8A8A8"}]}
    ];
	
	mapOptions = {
		center: { lat: 48.750057, lng: -122.476085 },
		zoom: 12,
		styles: mapStyles,
		zoomControl: true,
		scrollwheel: true,
		draggable: true,
		keyboardShortcuts: true
    };

	map = new Map(document.getElementById("interactive-map"), mapOptions);
	return map;
}

function initialize_route_style(routesLayer) {
	routesLayer.setStyle(function(feature) {
		return {
			strokeColor: feature.getProperty('strokeColor'),
			strokeWeight: feature.getProperty('strokeWeight')
		};
	});
}

// Draw the routes on the map and setup event listeners
async function setup_routes_layer(map) {
	routesLayer = map.data;
    // routesLayer.loadGeoJson('https://data.ridewta.com/kml/routes_min.json');
	routesLayer.loadGeoJson('https://schedules.ridewta.com/data/routes_min.json');
	initialize_route_style(routesLayer);
	
	routesLayer.addListener('mouseover', function(e) {
        routesLayer.revertStyle();
        routesLayer.overrideStyle(e.feature, {strokeWeight: 8, strokeColor: e.feature.getProperty('strokeColor')});
    });
    routesLayer.addListener('mouseout', function(e) {
        routesLayer.revertStyle();
    });
	let infowindow = new google.maps.InfoWindow;
	routesLayer.addListener('click', function(e) {
		// deleteMarkers(); what was this supposed to do?
		let myHTML = e.feature.getProperty("name");
		let num = myHTML.substring(6);
		infowindow.setContent('<h4><a href="#route-details?routeNum=' + num + '" translate="no">' +myHTML+ '</a></h4>');
		infowindow.setPosition(e.latLng);
		infowindow.setOptions({pixelOffset: new google.maps.Size(0,-10)});
		infowindow.open(map); 
	});
}

// Draw the stops on the map and setup event listeners
async function setup_stops_layer(map) {	
	// Add bus stops KML to map
	stopsLayer = new google.maps.KmlLayer({
        // url: 'https://data.ridewta.com/kml/Stops.kml',
		url: 'http://schedules.ridewta.com/data/stops.kml',
        preserveViewport: true
    });
	
	// only show bus stops when sufficiently zoomed in
	google.maps.event.addListener(map, 'zoom_changed', function () {
        if (map.zoom < 15) {
            stopsLayer.setMap(null);
        } else {
            stopsLayer.setMap(map);
        }
    });
	
	google.maps.event.addListener(stopsLayer, 'click', function (e) {
        // deleteMarkers();
        kmlStopCode = (e.featureData.description).substring(11);
		kmlStopName = e.featureData.name;

        // servingRoutesMap();
		let stopID = STOPS_ARRAY.filter(stop => stop.stop_code == kmlStopCode)[0].stop_id;
		fill_served_by_element(stopID)
		let servedByRoutes = document.getElementById("served-by-routes");

        e.featureData = {
        	'infoWindowHtml': '<h4 style="color: gray" translate="no">'
			 					+ kmlStopName + 
							  '</h4><table class="table table-striped table-hover table-bordered"><tr><th style="border: 1px solid #dbdbdb; background-color: #f9f9f9;">'
							   + "Stop Code" + 
							  '</th><th style="border: 1px solid #dbdbdb; background-color: #f9f9f9;">'
							    + "Served By" + 
							  '</th><tr translate="no"><td style="border: 1px solid #dbdbdb"><a href="#stops?stopCode=' + kmlStopCode + '">'
							    + kmlStopCode + 
							  '</a></td><td id="servedByRoutes" style="border: 1px solid #dbdbdb">'
							    + servedByRoutes.innerHTML + 
							  '</td></tr></table>'
		}
    });
}

// Centers the map around the users browser location, if possible
// else displays an error message to the user
function center_map(map) {
	let centerLocation = null;
	let errorBox = document.getElementById("map-location-error-box");
	errorBox.style.display = "none"
	navigator.geolocation.getCurrentPosition(function(position) {
        centerLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setCenter(centerLocation);
    },
    function (error) {
		errorBox.style.display = "block"
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorBox.innerHTML = "Some mapping functions will not work without geolocation services enabled. For full functionality, please go to your browser's settings and enable location services.";
                break;
            case error.POSITION_UNAVAILABLE:
                errorBox.innerHTML = "We were unable to get your currect location. Some mapping functions may not be available.";
                break;
            case error.TIMEOUT:
                errorBox.innerHTML = "The request to use your location timed out. Some mapping functions may not be available.";
                break;
            case error.UNKNOWN_ERROR:
                errorBox.innerHTML = "We were unable to get your current location. Some mapping functions may not be available.";
                break;
        }
    });
	return centerLocation;
}

function codeAddressMap(textInputId="interactive-map-search-input") {
    let address = document.getElementById(textInputId).value;
    let service = new google.maps.places.PlacesService(map);
	if (is_valid_stop_code(address)) {	
		let stopObj = null;
		
		for (let i = 0; i < STOPS_ARRAY.length; i++) {
			let stop = STOPS_ARRAY[i];
			let stop_code = stop["stop_code"];
			if (address == stop_code) {
				stopObj = stop;
				break;
			}
		}
		
		if (stopObj == null) {
			console.log("Stop code not found");
		} else {
			let stopLon = stopObj["stop_lon"];
			let stopLat = stopObj["stop_lat"];
			
			let stopPos = new google.maps.LatLng(stopLat, stopLon);
			map.setCenter(stopPos);
			map.setZoom(15);
		}	
	} else {
		console.log("is not stop code");
		let userLocation = new google.maps.LatLng(map.getCenter().lat(), map.getCenter().lng());
		let request = {
            keyword: address,
            rankBy: google.maps.places.RankBy.DISTANCE,
            location: userLocation
        };
		
		let callback = function(results, status) {
			if (results.length > 0) {
                console.log(status);
                if (status == "OK") {
                    let center = results[0].geometry.location;
                    if (center.lat() < 49.004438 && center.lat() > 48.410863 && center.lng() < -121.595991 && center.lng() > -122.904638) {
                        map.setCenter(results[0].geometry.location);
                        map.setZoom(17);
                    } else {
                        //TODO: Graceful error messages
                        alert('There were no results within our service area. Please check the address you entered and try again.');
                    }
                } else {
                    //TODO: Graceful error messages
                    alert('Geocode was not successful for the following reason: ' + status);
                }
            } else {
				alert('Could not locate ' + address);
			}
		}
		service.nearbySearch(request, callback);
	}
}

function setup_autocomplete() {
	let bounds = new google.maps.LatLngBounds(new google.maps.LatLng(48.410863, -122.904638), new google.maps.LatLng(49.004438, -121.595991));
    let input = document.getElementById("interactive-map-search-input");
    let options = {
        bounds: bounds,
        componentRestrictions: {country: 'us'}
    };
    let autocomplete = new google.maps.places.Autocomplete(input, options);
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
		console.log("autocomplete");
        codeAddressMap();
    });
}

// initialize interactive map
async function initMap() {
	const { Map } = await google.maps.importLibrary("maps");
	const {Place} = await google.maps.importLibrary("places");
	
	map = setup_map(Map);
	mapCenter = center_map(map);
		
	setup_stops_layer(map);
	setup_routes_layer(map);
	
	setup_autocomplete();
}