/*
Author: Skyler Crane (cranes2@wwu.edu)
Description: The purpose of this file is to provide utility functions,
	especially regarding data manipulation.
*/

const control_char_regex = /([\"\u0000-\u001F\u007F-\u009F])/g
let STOP_ID_TO_STOP_INFO = {};

/*
Takes in a CSV and converts each data row into a JSON object
using the CSV header entries as keys. Each JSON object is
stored in an array.
*/
function csv_to_json_array(csv) {
    let json_array = null;
    const lines = csv.split("\n");
    const num_lines = lines.length-1; // dont count after final newline
    if (num_lines <= 1) {
        console.log("Error: Could not read CSV.")
    }
    else {
        json_array = new Array(num_lines - 1); // No element for header row
        const columns = lines[0].replace(control_char_regex, "").split(",");
        const num_columns = columns.length;
        // Read each line
        // start at one to skip column header,
        for (let i = 1; i < num_lines; i++) {
            let line = lines[i];
            let values = line.split(",");
            let json = "{";
            // Build the JSON object from the lines
            for (let j = 0; j < num_columns; j++) {
				if (values[j] != null) {
					// Be sure not to double-quote or have control chars
					values[j] = values[j].replace(control_char_regex, "");
				}
				// Ensure empty values get handled
				if (values[j] == "") {
					values[j] = null;
				}
				
				// Convert to JSON
                json = json.concat("\"", columns[j], "\":\"", values[j], "\"");
                if (j < num_columns - 1) {
                    json = json.concat(",");
                }
            }
            json = json.concat("}");
            // convert string to JSON object
            let json_obj = JSON.parse(json);
            json_array[i-1] = json_obj;
        }
    }
    return json_array;
}

/*
Return an two arrays of trips driven by the given route, with both arrays as two 
entries in a JSON object, with their direction as the key.

route: route id number
trips_array: array of trip objects
date: Date object representing date to get trips for
first: whether to return only the first trip for each direction of this route.
	Note: May return more than one trip of each direction, but will stop once both directions
	have at least one trip, or end of trips_array is reached.
testing: remove first functionality and build out a complete object instead
*/
function get_trips_by_route(route, trips_array, date, first=false) {
	routeDestinationTrips = new Array();
	routeDowntownTrips = new Array();
	let n = trips_array.length;
	for (let i = 0; i < n; i++) {
		trip = trips_array[i];
		if (trip["route_id"] == route) {
			// Only include trip if it runs on the current day
			if (get_trip_service_on_date(trip["service_id"], date)) {
				// Associate trip with correct direction

				//sort stop_times_array here by trip_id
				STOP_TIMES_ARRAY.sort((a,b) => {
					if (a.trip_id < b.trip_id) {
						return -1;
					} else { 
						return 1;
					}
				});
				
				stops = get_stops_by_trip(trip["trip_id"], STOP_TIMES_ARRAY);
				trip_obj = {"trip_id":trip["trip_id"], "stops":stops, "start_time":stops[0]["departure_time"], "direction":trip["trip_headsign"]};			

				if (trip["direction_id"] == DIRECTION_1) {					
					routeDestinationTrips.push(trip_obj);
					if (first) {
						if (routeDowntownTrips.length >= 1) {
							// break;
						}
					}
				} else {
					routeDowntownTrips.push(trip_obj);
					if (first) {
						if (routeDestinationTrips.length >= 1) {
							// break;
						}
					}
				}
			}
		}
	}
	routeTrips = {"destinationTrips":routeDestinationTrips.sort(compare_trip_start_time), 
		"downtownTrips":routeDowntownTrips.sort(compare_trip_start_time)}
	return routeTrips;
}

/*
Finds the name of the directions that the given route number drives, stored in a JSON
object with the directions as keys. This only finds the direction names for a route on
a given date, so if there is no service for the route on that day, default direction
names will be returned.

routeNum: route ID number.
trips_array: array of trip objects
date: Date object
*/
function get_direction_names_for_date(routeNum, trips_array, date) {
	let trips = get_trips_by_route(routeNum, trips_array, date, true);
	let first_dest = DIRECTION_NAME_UNKNOWN;

	if (trips["destinationTrips"].length > 0) {
		//Order the trips in the destinationTrips array such that the headsign with the most trips comes first
		//1) find out which destination trip headsign is the most popular
		let tripCtrObj = []; //[{ headsign: "blah", ctr: 9}, {etc...}]
		for (var i=0;i<trips["destinationTrips"].length;i++) {
			let trip = trips["destinationTrips"][i];
			//If this trip's destination is not yet an object in the array with a counter, add it and set its counter to 1
			let found = tripCtrObj.find(obj => obj["headsign"] === trip.direction);
			if (found) {
				//Otherwise, find the object in the array for this headsign and add 1 to the counter prop
				found["ctr"] = found["ctr"]+1;
			} else {
				tripCtrObj.push({"headsign": trip["direction"], "ctr": 1});
			}
		}

		//2) sort the tripCtrObj by the ctr prop by ctr from highest to lowest
		tripCtrObj.sort((a, b) => {
			if (a["ctr"] > b["ctr"]) {
				return -1;
			} else {
				return 1;
			}
		});

		//3) set first_dest = tripCtrObj
		first_dest = tripCtrObj[0]["headsign"];
	}
	let first_down = DIRECTION_NAME_UNKNOWN;
	if (trips["downtownTrips"].length > 0) {
		//Order the trips in the destinationTrips array such that the headsign with the most trips comes first
		//1) find out which destination trip headsign is the most popular
		let tripCtrObj = []; //[{ headsign: "blah", ctr: 9}, {etc...}]
		for (var i=0;i<trips["downtownTrips"].length;i++) {
			let trip = trips["downtownTrips"][i];
			//If this trip's destination is not yet an object in the array with a counter, add it and set its counter to 1
			let found = tripCtrObj.find(obj => obj["headsign"] === trip.direction);
			if (found) {
				//Otherwise, find the object in the array for this headsign and add 1 to the counter prop
				found["ctr"] = found["ctr"]+1;
			} else {
				tripCtrObj.push({"headsign": trip["direction"], "ctr": 1});
			}
		}

		//2) sort the tripCtrObj by the ctr prop by ctr from highest to lowest
		tripCtrObj.sort((a, b) => {
			if (a["ctr"] > b["ctr"]) {
				return -1;
			} else {
				return 1;
			}
		});

		//3) set first_dest = tripCtrObj
		first_down = tripCtrObj[0]["headsign"];
	}
	return {[DIRECTION_1]:first_dest, [DIRECTION_0]:first_down}
}

/*
Finds the name of the directions that the given route number drives, stored in a JSON
object with the directions as keys.

routeNum: route ID number.
trips_array: array of trip objects
*/
function get_direction_names(routeNum, trips_array) {
	let directionNames = get_direction_names_for_date(routeNum, TRIPS_ARRAY, DATE);
	let i = 0;
	// Check over all service dates to ensure we get the direction names
	while (directionNames[DIRECTION_0] == DIRECTION_NAME_UNKNOWN && directionNames[DIRECTION_1] == DIRECTION_NAME_UNKNOWN) {
		let temp_date = make_date();
		if (i >= 3) {
			console.log("what happened");
			break;
		}
		switch (i) {
			case 0:
				temp_date = get_next_monday(temp_date);
				break;
			case 1:
				temp_date = get_next_saturday(temp_date);
				break;
			case 2:
				temp_date = get_next_sunday(temp_date);
				break;
		}
		
		directionNames = get_direction_names_for_date(routeNum, TRIPS_ARRAY, temp_date);
		i++;	
	}
	return directionNames;
}

/*
Returns an array of stop objects for a given trip.
Stop objects contain "departure_time", "stop_id", and "stop_name" as keys.

trip_id: trip ID number
stop_times_array: array of stop all stop-time objects
*/
function get_stops_by_trip(trip_id, stop_times_array) {
	tripStops = new Array();
	// this will allow us to stop looping once we have added all stops for this trip_id
	let found = false;
	for (let i = 0; i < stop_times_array.length; i++) {
		stop = stop_times_array[i];
		if (stop["trip_id"] == trip_id) {
			tripStops.push({"departure_time" : stop["departure_time"], "stop_id": stop["stop_id"], 
				"stop_name":STOP_ID_TO_STOP_INFO[stop["stop_id"]]["stop_name"],
				"stop_sequence":stop["stop_sequence"]});
			found = true;
		} else {
			// This means we have found all stops for this trip_id
			if (found == true) {
				break;
			}
		}
	}
	// for (let i = 0; i < stop_times_array.length; i++) {
	// 	stop = stop_times_array[i];
	// 	if (stop["trip_id"] == trip_id) {
	// 		tripStops.push({"departure_time" : stop["departure_time"], "stop_id": stop["stop_id"], 
	// 			"stop_name":STOP_ID_TO_STOP_INFO[stop["stop_id"]]["stop_name"],
	// 			"stop_sequence":stop["sequence"]});
	// 	}
	// }

	return tripStops.sort(compare_stop_time);
}

/*
Creates a mapping from each stop ID to the corresponding "stop_name" and "stop_code"
in a JSON object. This is stored globally in STOP_ID_TO_STOP_INFO.
*/
function make_stop_id_to_stop_info_mapping() {
	STOPS_ARRAY.forEach(stop => {
		stop_id = stop["stop_id"];
		STOP_ID_TO_STOP_INFO[ [stop_id] ] = {"stop_name": stop["stop_name"], "stop_code": stop["stop_code"]};
	})
}

var {format_date_for_input, get_current_day} = require('./dates');

// checks if a trip with given service id would have service on given date
function get_trip_service_on_date(service_id, date) {
	
	let day = get_current_day(date);

	for (let i = 0; i < CALENDAR_ARRAY.length; i++) {
		service = CALENDAR_ARRAY[i];
		if (service["service_id"]=="96aa932d-2722-469d-8432-eaff63ee763e") {
			console.log('checking 80x...');
			console.log(service_id);
			console.log(service);
		}
		if (service["service_id"] == service_id) {
			// if the service is 0, then no service on for this service ID
			if (service[[day]] == "0") {
				return false;
			}
			
			// check whether the service id date range includes this date
			let formatted_date = format_date_for_input(date);
			let temp = formatted_date.split('-');
			formatted_date = temp[0].concat(temp[1], temp[2]);
			let start_date = service["start_date"];
			let end_date = service["end_date"];

			if (formatted_date.localeCompare(end_date) <= 0 && start_date.localeCompare(formatted_date) <= 0) {
				// check exception (ie holiday)
				// TODO: Make this more efficient (ie binary search for date)
				for (let j = 0; j < DATES_ARRAY.length; j++) {
					let except_date = DATES_ARRAY[j];
					// date["date"] in format yyyymmdd
					formatted_date = format_date_for_input(date);
					temp = formatted_date.split('-');
					formatted_date = temp[0].concat(temp[1], temp[2]);
					// If this date has an exception, handle that accordingly
					if (except_date["date"] == formatted_date && except_date["service_id"] == service_id) {
						if (except_date["exception_type"] == DATE_EXCEPTION_TYPE_ADD_SERVICE) {
							return true;
						} else if (except_date["exception_type"] == DATE_EXCEPTION_TYPE_REMOVE_SERVICE) {
							return false;
						}
					}
				}
				return true;
			} else {
				// If here, then this service ID date range does not include this date
				return false;
			}
		
		}
	}
	// The rest of this will execute for skagit routes
	// since their service is represented differently than WTA.
	// So we have to find the date we are looking for and check
	// if they added service on that day
	for (let j = 0; j < DATES_ARRAY.length; j++) {
		let except_date = DATES_ARRAY[j];
		// date["date"] in format yyyymmdd
		let formatted_date = format_date_for_input(date);
		let temp = formatted_date.split('-');
		formatted_date = temp[0].concat(temp[1], temp[2]);
		// If this date has an exception, handle that accordingly
		if (except_date["date"] == formatted_date && except_date["service_id"] == service_id) {
			if (except_date["exception_type"] == DATE_EXCEPTION_TYPE_ADD_SERVICE) {
				return true;
			} else if (except_date["exception_type"] == DATE_EXCEPTION_TYPE_REMOVE_SERVICE) {
				return false;
			}
		}
	}
	return false;
}

// Gets an array of trips that serve the given stopCode
function get_trips_by_stop_id(stopID, date) {	
	let trips = [];
	
	// Find potential trips that serve this stop
	for (let i = 0; i < STOP_TIMES_ARRAY.length; i++) {
		let stop_time = STOP_TIMES_ARRAY[i];
		if (stop_time["stop_id"] == stopID && stop_time["pickup_type"] != "1") {
			let trip_id = stop_time["trip_id"];
			let time = stop_time["departure_time"];
			let headsign = stop_time["stop_headsign"];
			trips.push({"trip_id":trip_id, "departure_time":time, "headsign":headsign});
		}
	}
	
	// filter out trips that dont serve this route on this date
	let finalTrips = [];
	for (let i = 0; i < TRIPS_ARRAY.length; i++) {
		trip = TRIPS_ARRAY[i];
		for (let j = 0; j < trips.length; j++) {
			valid_trip = trips[j];
			// If this trip is one that stops at this stop
			if (valid_trip["trip_id"] == trip["trip_id"]) {
				// If this trip serves this stop on the given date
				if (get_trip_service_on_date(trip["service_id"], date)) {
					valid_trip["route_id"] = trip["route_id"];
					finalTrips.push(valid_trip);
				}
			}
		}
	}
	
	return finalTrips.sort(compare_stop_time);
}

// Given an array of trip objects containing at least {"route_id": route_id} mapping,
// return a sorted array of all route ids contained in the trips. Each route id will
// only exist once in the returned array, even if shows up in multiple trips
function get_routes_by_trips(trips) {
	let route_ids = [];
	for (let i = 0; i < trips.length; i++) {
		trip = trips[i];
		let id = trip["route_id"];
		if (route_ids.length > 0) {
			let found = false;
			for (let j = 0; j < route_ids.length; j++) {
				let route = route_ids[j];
				if (id == route) {	
					found = true;
					break;
				}
			}
			if (!found) {
				route_ids.push(id);
			}
		} else {
			route_ids.push(id);
		}
	}
	
	// sort array by route ids
	//return route_ids.sort(function(a, b){return a-b});
	let sorted_routes = route_ids.sort(function(a, b) {return parseInt(a, 10) - parseInt(b, 10)});
	return sorted_routes;
}

function is_valid_stop_code(stop_code) {
	let found = false;
	for (let i = 0; i < ALL_STOP_CODES.length; i++) {
		if (stop_code == ALL_STOP_CODES[i]) {
			found = true;
			break;
		}
	}
	if (found) {
		return true;
	} else {
		return false;
	}
}

// returns array of all stop codes present in stops array
function get_all_stop_codes() {
	let codes = new Set();
	for (let i = 0; i < STOPS_ARRAY.length; i++) {
		let stop = STOPS_ARRAY[i];
		let code = stop["stop_code"];
		codes.add(code);
	}
	
	return Array.from(codes);
}

// check if the GTFS Static dataset is a merged version
// by seeing if it contains the key "original_trip_id"
function is_merged(trips_array) {
	return Object.keys(trips_array[0]).includes("original_trip_id");
}

// Create a JSON mapping from "original_trip_id" to an array of "trip_id"s
// for trips that have an "original_trip_id", otherwise map 
// from "trip_id" to ["trip_id"] (identity function)
function make_merged_trip_mapping(trips_array) {
	let length = trips_array.length;
	let mapping = {};
	for (let i = 0; i < length; i++) {
		let trip_id = trips_array[i]["trip_id"];
		let original = trips_array[i]["original_trip_id"];
		// original will be null for example if WTA has a merged GTFS
		// but Skagit doesn't (then skagit trips will be null)
		// original will be "null" if a trip does not have a "original_trip_id"
		// (but other trips are merged)
		if (original == null || original == "null") {
			if (mapping[trip_id] == null) {
				mapping[trip_id] = [trip_id];
			} else {
				mapping[trip_id].push(trip_id);
			}	
		} else {
			if (mapping[original] == null) {
				mapping[original] = [trip_id];
			} else {
				mapping[original].push(trip_id);
			}
			
		}
	}
	return mapping;
}

/* COMPARISON FUNCTIONS

	The following functions are comparison functions to be used with 
	an Array.sort() call in order to sort arrays of objects based on
	a given key

*/
function compare_route_id(a, b) {
	let a_num = Number(a["route_id"].replace(/\D/g, ""));
	let b_num = Number(b["route_id"].replace(/\D/g, ""));
	return a_num - b_num;
}

function compare_trip_id(a, b) {
	let a_num = Number(a["trip_id"]);
	let b_num = Number(b["trip_id"]);
	return a_num - b_num;
}

function compare_stop_time(a, b) {
	let a_time = a["departure_time"];
	let b_time = b["departure_time"];
	return a_time.localeCompare(b_time);
}

function compare_trip_start_time(a, b) {
	let a_time = a["start_time"];
	let b_time = b["start_time"];
	return a_time.localeCompare(b_time);
}

function findObjectByProperty(arr, property, value) {
  return arr.find(obj => obj[property] === value);
}

// Export functions for testing purposes 
if (typeof module === 'object') {
	module.exports = {csv_to_json_array, is_valid_stop_code, compare_route_id, compare_trip_id, compare_stop_time, 
						compare_trip_start_time, get_stops_by_trip, make_stop_id_to_stop_info_mapping, get_routes_by_trips, 
						get_trip_service_on_date, get_all_stop_codes}
}