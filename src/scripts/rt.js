/*
Author: Skyler Crane (cranes2@wwu.edu)
Description: The purpose of this file is to provide real-time functionality
	to the schedules website using the WTA API.
*/

RT_API_URL = "https://api.ridewta.com/gtfsrt/";
EARLY_COLOR = "orange";
LATE_COLOR = "red";
ON_TIME_COLOR = "green";

/*
Gets real-time trip predictions for a given route number.

Input:
	route_num: route_id to get predictions for

Returns an array of trip predictions in form
[{trip_id: XXX, stops: [{stop_id: XXX, arrival: {time: XXX}, departure: {time: XXX}, ...}, ...], ...}, ...]
*/
async function get_predictions_for_route(route_num) {
	let trips = [];
	try {
		let response = await fetch(RT_API_URL.concat(route_num));		
		let preds = await response.json();
		
		if (preds['trips'] == undefined) {
			throw new Error("Could not fetch real time data for route ".concat(route_num));
		}
		
		trips = preds['trips'];
		// Check if this is a skagit route. 
		if (SKAGIT_JSON["routes"].includes(route_num)) {			
			for (let i = 0; i < trips.length; i++) {
				let stops = trips[i]["stops"];
				for (let j = 0; j < stops.length; j++) {
					let stop = stops[j];
					// if this route is run by Skagit, convert stop id to WTA version
					if (Object.keys(SKAGIT_JSON["stop_ids"]).includes(stop["stop_id"])) {
						stop["stop_id"] = SKAGIT_JSON["stop_ids"][[stop["stop_id"]]];
					}
				}
			}
		}
	} catch (error) {}
	return trips;
}

/*
Based on the prediction offset, return a color for the text
to appear on the timetable.

Inputs:
	offset: string in format "X min late" or "X mins early" or "on time"
*/
function get_offset_text_color(offset) {
	// let color = ON_TIME_COLOR;
	let color = "on_time";
	// if (offset[0] == "+") {
	if (offset.includes("late")) {
		// color = LATE_COLOR;
		color = "late";
	// } else if (offset[0] == '-') {
	} else if (offset.includes("early")) {
		// color = EARLY_COLOR;
		color = "early";
	}
	return color;
}

/*
Clears the prediction element for every stop in the trips_table_mapping.

Inputs:
	trips_table_mapping: JSON object of form {tripId: {stopId: table element, ...}, ...}
*/
function clear_predictions(trips_table_mapping) {
	let trips = Object.keys(trips_table_mapping);
	for (let i = 0; i < trips.length; i++) {
		let trip = trips_table_mapping[trips[i]];
		let stops = Object.keys(trip);
		for (let j = 0; j < stops.length; j++) {
			let td = trips_table_mapping[trips[i]][stops[j]];
			try {
				let children = td.children;
				let predicted = children[1];
				predicted.innerHTML = "";
				predicted.className = "predicted-stop-time";
			} catch (e) {}
		}
	}
}

/*
Update the route details with real-time prediction data.

Inputs:
	tripsTableMapping: JSON object of form {tripId: {stopId: table element, ...}, ...}
	routeNum: route number
*/
async function update_route_details_rt(tripsTableMapping, routeNum) {
	console.log("Updating Route Details RT data!");
	let trip_preds = await get_predictions_for_route(routeNum);
	clear_predictions(tripsTableMapping);
	
	for (let i = 0; i < trip_preds.length; i++) {
		let trip_id = trip_preds[i]['trip_id'];
		let stops = trip_preds[i]['stops'];
		let trueTripId = getTrueTripId(tripsTableMapping, trip_id);
		if (trueTripId == -1) {
			continue;
		}
		// Loop through stops on this trip and enter predicted delay
		for (let j = 0; j < stops.length; j++) {
			let stop = stops[j];
			let stop_id = stop['stop_id'];
			try {
				let td = tripsTableMapping[trueTripId][stop_id];
				let stopTime = getStopTime(stop);
				updateTime(td, stopTime);			
			} catch (error) {
				// console.log(error);
			}
		}
	}
}

/*
Updates the prediction for the stop time at the given table element.

Inputs:
	td: The table element storing the stop time in the route-details table
	stop_time: Predicted time for stop (in POSIX timestamp -- number of seconds since Jan 1 1970)
*/
async function updateTime(td, stop_time) {
	let children = td.children;
	let scheduled_time = children[0].innerHTML;
	let predicted = children[1];
	let pred_date = new Date(stop_time * MS_IN_SEC);
	let pred_time = "".concat(pred_date.getHours(), ":", pred_date.getMinutes(), ":", pred_date.getSeconds());		
	let predicted_time = military_to_standard(pred_time);
	let offset = get_time_difference(scheduled_time, predicted_time);
	// predicted.style.color = get_offset_text_color(offset);
	//update: add a css class instead of directly assigning the html style property
	predicted.classList.add(get_offset_text_color(offset));
	predicted.innerHTML = offset;
}

/*
Get the static trip id for the trip with the given real-time trip id.
Unless there is a GTFS Static Merge, these will be the same.

Inputs:
	tripsTableMapping: JSON object of form {tripId: {stopId: table element, ...}, ...}
	tripId: Trip id from real-time prediction
	
Returns the corresponding static GTFS trip id. Most of the time this will be the same.
*/
function getTrueTripId(tripsTableMapping, tripId) {
	let trueTripId;
	if (MERGED) {
		trueTripId = MERGED_TRIP_MAPPING[tripId];
		
		let keys = Object.keys(tripsTableMapping);

		let temp = -1;
		for (let k = 0; k < trueTripId.length; k++) {
			if (keys.includes(trueTripId[k])) {
				temp = trueTripId[k];
				break;
			}
		}
		trueTripId = temp;
	} else {
		trueTripId = tripId;
	}
	return trueTripId;
}

/*
Extract the stop time from the stop prediction object.

Input:
	stop: JSON stop object of form {stop_id: XXX, arrival: {time: XXX}, departure: {time: XXX}, ...}

Returns the predicted stop time in POSIX timestamp (seconds since Jan 1 1970)
*/
function getStopTime(stop) {
	let stopTime;
	if (stop["departure"] != null) {
		stopTime = stop["departure"]["time"];
	} else {
		stopTime = stop["arrival"]["time"];
	}
	return stopTime
}

// Export functions for testing purposes 
if (typeof module === 'object') {
	module.exports = {get_predictions_for_route, get_offset_text_color, getTrueTripId, getStopTime}
}
