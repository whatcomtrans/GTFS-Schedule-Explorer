/*
Authors: Skyler Crane (cranes2@wwu.edu)
		 Tien Pham  (phamt33@wwu.edu)
Description: The purpose of this file is to act as the main driver for the schedules website.
	This file also takes care of the HTML and CSS modifications as necessary
*/

const WTA_STATIC_DIR = "data/wta-static-gtfs/";
const SKAGIT_STATIC_DIR = "data/skagit-static-gtfs/";
const SKAGIT_JSON_PATH = "data/skagit.json";

const DIRECTION_0 = 0;
const DIRECTION_1 = 1;
const DIRECTION_NAME_UNKNOWN = "???";
let CURRENT_DIR = DIRECTION_1;
let DIR_1_TRIP_STOPS = null;
let DIR_0_TRIP_STOPS = null;

const DATE_EXCEPTION_TYPE_ADD_SERVICE = 1;
const DATE_EXCEPTION_TYPE_REMOVE_SERVICE = 2;

let ROUTES_ARRAY = null;
let STOPS_ARRAY = null;
let STOP_TIMES_ARRAY = null;
let TRIPS_ARRAY = null;
let CALENDAR_ARRAY = null;
let DATES_ARRAY = null;
let SKAGIT_JSON = null;

let SHAPES_ARRAY = null;

let ALL_STOP_CODES = [];
const DEFAULT_STOP_CODE = 2001;
let DATE = null;

// stores whether the GTFS static dataset is a "merged" version
let MERGED = false;
// if MERGED is true, this contains mappings from
// "original_trip_id" to "trip_id"
let MERGED_TRIP_MAPPING = null;

let DIR_0_INTERVAL_ID = null;
let DIR_1_INTERVAL_ID = null;
const MS_IN_MIN = 60000;
const MS_IN_SEC = 1000;

let geocoder;

var {csv_to_json_array} = require('./utils');
var {make_date, get_current_day} = require('./dates');

/*
Reads csv from path and converts into an array of JSON objects.
*/
async function get_data_array(path) {
    const response = await fetch(path);
    const text = await response.text();
    let array = csv_to_json_array(text);
    return array;
}

function change_url_to_routes() {
	parent.location.hash = "";
}

function change_url_to_stop_details(stop_code) {
	parent.location.hash = "stops?stopCode=".concat(stop_code);
}

function change_url_to_interactive_map() {
	parent.location.hash = "interactiveMap";
}

// Clear intervals of previous real-time data updates
function clear_rt_intervals() {
	if (DIR_0_INTERVAL_ID != null) {
		clearInterval(DIR_0_INTERVAL_ID);
		DIR_0_INTERVAL_ID = null;
	}
	if (DIR_1_INTERVAL_ID != null) {
		clearInterval(DIR_1_INTERVAL_ID);
		DIR_1_INTERVAL_ID = null;
	}
}

// Activates the button for the given day
// day is a string representing the name of the day (ex: "saturday")
// type must be one of ["route", "stop"]
function activate_day_button(day, type) {
	let weekdayTab = document.getElementById(type.concat("-weekday-tab"));
	let saturdayTab = document.getElementById(type.concat("-saturday-tab"));
	let sundayTab = document.getElementById(type.concat("-sunday-tab"));
	let routeMapTab;
	let stopStreeviewTab;	
	
	if (type == "route") {
		routeMapTab = document.getElementById(type.concat("-map-tab"))
		routeMapTab.setAttribute("data-active", "false");
	}

	if (type == "stop") {
		stopStreeviewTab = document.getElementById(type.concat("-streetview-tab"));
		stopStreeviewTab.setAttribute("data-active", "false");
	}
	
	weekdayTab.setAttribute("data-active", "false");
	saturdayTab.setAttribute("data-active", "false");
	sundayTab.setAttribute("data-active", "false");

	if (day == "sunday") {
		sundayTab.setAttribute("data-active", "true");
	} else if (day == "saturday") {
		saturdayTab.setAttribute("data-active", "true");
	} else if (day == "route map") {
		routeMapTab.setAttribute("data-active", "true");
	} else if (day == "street-view") {
		stopStreeviewTab.setAttribute("data-active", "true");
	} else {
		weekdayTab.setAttribute("data-active", "true");
	}
}

function style_nav_button(nav_button) {
	let routes_nav_button = document.getElementById("routes-nav-button");
	let stops_nav_button = document.getElementById("stops-nav-button");
	let map_nav_button = document.getElementById("map-nav-button");
	
	routes_nav_button.setAttribute("data-active", "false");
	stops_nav_button.setAttribute("data-active", "false");
	map_nav_button.setAttribute("data-active", "false");
	
	nav_button.setAttribute("data-active", "true");
}

function setupFindOption() {
	let table_container_element = document.getElementById("stops-table-container");
	let option_element = document.getElementById("stop-option");
	let optionIndex = option_element.selectedIndex;
	let selectedOption = option_element.options[optionIndex];
	let selectedValue = selectedOption.value;
	
	let tableRows = table_container_element.querySelectorAll('tr');

	if (selectedValue == "All Routes") {
		tableRows.forEach(row => {
			row.style.display = "";
		});
	} else {
		tableRows.forEach(row => {
			if (row.classList.contains("stop-header-row")) {
				row.style.display = "";
			} else if (row.classList.contains("stop-row") && row.getAttribute('route-id') == selectedValue) {
				row.style.display = "";
			} else {
				row.style.display = "none";
			}
		});
	}
}

function hide_content() {
	let routesDiv = document.getElementById("routes");
	let routesDetailsDiv = document.getElementById("route-details");
	let stopDetailsDiv = document.getElementById("stop-details");
	let interactiveMapDiv = document.getElementById("interactive-map-container");
	
	routesDiv.style.display = 'none';
	routesDetailsDiv.style.display = 'none';
	stopDetailsDiv.style.display = 'none';
	interactiveMapDiv.style.display = 'none';
}

// Refresh functionality
function reload(ROUTES_ARRAY) {
	let url = window.location.href;
	let routesDiv = document.getElementById("routes");
	let routesDetailsDiv = document.getElementById("route-details");
	let stopDetailsDiv = document.getElementById("stop-details");
	let interactiveMapDiv = document.getElementById("interactive-map-container"); 
	
	clear_rt_intervals()

	// Check url for certain substring to reload the correct elements
	if (url.includes('#route-details')) {
		hide_content();
		routesDetailsDiv.style.display = 'block';

		let queryString = parent.location.hash;
		queryString = queryString.substring(queryString.indexOf('?'));
		let urlParams = new URLSearchParams(queryString);
		let routeNum = urlParams.get("routeNum");

		let nav_button = document.getElementById("routes-nav-button");
		style_nav_button(nav_button);
		
		display_route_details(routeNum);
	} else if (url.includes("#stops")) {
		hide_content();
		stopDetailsDiv.style.display = 'block';

		let queryString = parent.location.hash;
		queryString = queryString.substring(queryString.indexOf('?'));
		let urlParams = new URLSearchParams(queryString);
		let stopCode = urlParams.get("stopCode");
		let currentDay = new Date();

		// getStopInfo(stopID, currentDay);
		let nav_button = document.getElementById("stops-nav-button");
		style_nav_button(nav_button);
		
		display_stop_details(stopCode);
	} else if (url.includes("#interactiveMap")) {
		hide_content();
		interactiveMapDiv.style.display = "block";
		let nav_button = document.getElementById("map-nav-button");
		style_nav_button(nav_button);

		let queryString = parent.location.hash;
		queryString = queryString.substring(queryString.indexOf('?'));
		let urlParams = new URLSearchParams(queryString);
		let stopCode = urlParams.get("search");

		if (stopCode != null) {
			let interactiveMapInput = document.getElementById("interactive-map-search-input");
			interactiveMapInput.value = stopCode
			codeAddressMap();
		}

	} else {
		hide_content();
        routesDiv.style.display = "block";
		let nav_button = document.getElementById("routes-nav-button");
		style_nav_button(nav_button);
	}

}

// Setup basic website functionality
function setupEventListener(ROUTES_ARRAY) {

	let select_button = document.getElementById("find-option");

	select_button.addEventListener("click", setupFindOption);

	window.addEventListener("popstate", function(event) {
		if (event.state === null) {
			// The hash change was caused by a navigation (e.g., using back/forward buttons)
			console.log("Reloading page")
			reload(ROUTES_ARRAY);
		} else {
			// The hash change was caused by a direct modification (e.g., using JavaScript or manually typing in the address bar)
		}
	})
}

// set up trip planner
async function tripPlannerInit() {
	const { Map } = await google.maps.importLibrary("maps");
	const {Place} = await google.maps.importLibrary("places");
	setupModal();
	setupTProutes();
	setupTPstop();
	setupTPInteractiveMap();
	setupTPgoogleForm();
}

// Initialize various aspects of the site
async function siteInit() {
	// initialize the interactive map
	initMap();
	// Setup global date object
	DATE = make_date();
	// set up geocoder for stop page City/Zip
	const { Geocoder } = await google.maps.importLibrary("geocoding");
	geocoder = new Geocoder();
	// load Skagit JSON object
	let response = await fetch(SKAGIT_JSON_PATH);
	SKAGIT_JSON = await response.json();
}

// load routes and build routes table
async function routesInit() {
	let routes_div = document.getElementById("routes");	
    ROUTES_ARRAY = await get_data_array(WTA_STATIC_DIR + "routes.txt");
	ROUTES_ARRAY.sort(compare_route_id);
	create_routes_table(routes_div, ROUTES_ARRAY);
}

// load stops, stop time data
async function stopsInit() {
	STOP_TIMES_ARRAY = await get_data_array(WTA_STATIC_DIR + "stop_times.txt");
	let skagit_stop_times = await get_data_array(SKAGIT_STATIC_DIR + "stop_times.txt");
	if (STOP_TIMES_ARRAY != null) {
		STOP_TIMES_ARRAY = STOP_TIMES_ARRAY.concat(skagit_stop_times);
	}
	STOP_TIMES_ARRAY.sort(compare_trip_id);
	STOPS_ARRAY = await get_data_array(WTA_STATIC_DIR + "stops.txt");
	// Create stop data objects
	ALL_STOP_CODES = get_all_stop_codes();
	make_stop_id_to_stop_info_mapping();
	
}

// load trips and resolve GTFS merge if necessary
async function tripsInit() {
	TRIPS_ARRAY = await get_data_array(WTA_STATIC_DIR + "trips.txt");
	MERGED = is_merged(TRIPS_ARRAY);
	let skagit_trips = await get_data_array(SKAGIT_STATIC_DIR + "trips.txt");
	if (skagit_trips != null) {
		TRIPS_ARRAY = TRIPS_ARRAY.concat(skagit_trips);
	}
	if (MERGED) {
		console.log("DETECTED MERGED GTFS STATIC DATASET");
		MERGED_TRIP_MAPPING = make_merged_trip_mapping(TRIPS_ARRAY);
	}
	//add section to init the shapes array
	let shapes = await get_data_array(WTA_STATIC_DIR + "shapes.txt");
	let skagit_shapes = await get_data_array(SKAGIT_STATIC_DIR + "shapes.txt");
	if (skagit_shapes != null) {
		shapes = shapes.concat(skagit_shapes);
	}
	// for (shape of shapes) {
	// 	if (shape.shape_id not in) {
	// 		SHAPES_ARRAY.push(shape);
	// 	}
	// }
}

// load calendar, dates data
async function datesInit() {
	CALENDAR_ARRAY = await get_data_array(WTA_STATIC_DIR + "calendar.txt");
	let skagit_calendar = await get_data_array(SKAGIT_STATIC_DIR + "calendar.txt");
	if (skagit_calendar != null) {
		CALENDAR_ARRAY = CALENDAR_ARRAY.concat(skagit_calendar);
	}
	DATES_ARRAY = await get_data_array(WTA_STATIC_DIR + "calendar_dates.txt");
	let skagit_dates = await get_data_array(SKAGIT_STATIC_DIR + "calendar_dates.txt");
	if (skagit_dates != null) {
		DATES_ARRAY = DATES_ARRAY.concat(skagit_dates);
	}
}

async function main() {
	siteInit();
	await routesInit();
	// cannot set up trip planner until routes initialized
	tripPlannerInit();
    await stopsInit();
	await tripsInit();
    await datesInit();
	// Set up page based on URL
    reload(ROUTES_ARRAY);
	setupEventListener(ROUTES_ARRAY);

    console.log("Running main");
}

module.exports = {get_data_array};
