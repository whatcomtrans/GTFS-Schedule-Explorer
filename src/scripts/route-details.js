/*
Authors:
	Skyler Crane (cranes2@wwu.edu)
	Dominic Perez-Weber (perezwd@wwu.edu)
Description: The purpose of this file is to handle the creation and 
use of the route details section of the site.
*/

function add_stop_to_header(stop, trip_header_row) {
	let stop_name = document.createElement("th");
	let stop_code = STOP_ID_TO_STOP_INFO[stop["stop_id"]]["stop_code"]
	stop_name.addEventListener("click", function() {			
		change_url_to_stop_details(stop_code);
	})
	stop_name.innerHTML = stop["stop_name"] + "<br>(" + stop_code + ")";
	stop_name.className = "stop-name";
	stop_name.setAttribute("stop-id", stop["stop_id"]);
	trip_header_row.append(stop_name);
}

function populate_stop_selectors(stop) {
	let stop_selector_from = document.getElementById("stops-selector-from");
	let stop_selector_to = document.getElementById("stops-selector-to");

	let stop_from_name = document.createElement("option");
	let stop_to_name = document.createElement("option");

	stop_from_name.innerHTML = stop["stop_name"];
	stop_to_name.innerHTML = stop["stop_name"];

	stop_from_name.setAttribute("value", stop["stop_id"]);
	stop_to_name.setAttribute("value", stop["stop_id"]);

	stop_selector_from.append(stop_from_name);
	stop_selector_to.append(stop_to_name);
}

// Return the array of stops for the longest trip in tripsArray
//BUG: This is not a foolproof way to get a list of all stops that belong to the route
	//Goal is to get a list of stops that can occur on this route and order them in sequence
function getLongestTripStops(tripsArray) {
	// console.log(tripsArray);
	let longestTrip = tripsArray[0];
	tripsArray.forEach(trip => {
		if (trip["stops"].length > longestTrip["stops"].length) {
			longestTrip = trip;
		}
	})
	return longestTrip["stops"];
}

// Go through and add every stop to stop header row
// takes in array of trips for this route and table tow to add stop names to
function make_stop_header_row(tripsArray, trip_header_row) {
	header_stop_ids = [];
	all_stops = [];
	
	// First, add the longest trip stops to header
	// this will most of the time add every stop
	longest_trip_stops = getLongestTripStops(tripsArray)
	let stop_idx = 0;
	for (let i = 0; i < longest_trip_stops.length; i++) {
		let stop = longest_trip_stops[i]
		stop_id = stop["stop_id"];
		let header_id_idx = header_stop_ids.indexOf(stop_id);
		// ensures that both new stops and repeat stops get taken care of
		if (header_id_idx == -1 || (header_stop_ids.length <= stop_idx && header_stop_ids[stop_idx] != stop_id)) {
			all_stops.push(stop);
			header_stop_ids.push(stop["stop_id"]);
		}
		stop_idx++;
	}
	
	// Now, go through and add any stops that were missed (edge cases)
	tripsArray.forEach(trip => {
		// check where this trip first stops
		let trip_stops = trip["stops"];
		let i = 0;
		let header_id_idx = -1;
		// go through header stops until we find a match
		while (header_id_idx == -1) {	
			stop_id = trip_stops[i]["stop_id"];
			header_id_idx = header_stop_ids.indexOf(stop_id);
			i++;
		}
		let stop_idx = header_id_idx;
		
		for (let i = 0; i < trip_stops.length; i++) {
			let stop = trip_stops[i]
			stop_id = stop["stop_id"];
			
			header_id_idx = header_stop_ids.indexOf(stop_id);
			
			// ensures that both new stops and repeat stops get taken care of
			if (header_id_idx == -1 || (header_stop_ids.length <= stop_idx && header_stop_ids[stop_idx] != stop_id)) {
				all_stops.splice(stop_idx, 0, stop);
				header_stop_ids.splice(stop_idx, 0, stop_id);
			}
			stop_idx++;
		}
	})
	
	// finally, add all the stops in the correct order to the header row
	all_stops.forEach(stop => {
		add_stop_to_header(stop, trip_header_row);
	})
	
	return header_stop_ids;
}

// Adds an empty column to the trip row, representing a stop that is skipped
function addMissingStopTime(tripRow) {
	let stop_time = document.createElement("td");
	stop_time.innerHTML = "--";
	stop_time.className = "stop-time";
	tripRow.append(stop_time);
}

/*
Add the stop time from the given stop to the given trip row.
Then return the table element containing the stop time.
*/
function addStopTimeToRow(stop, tripRow) {
	let stopTime = document.createElement("td");
	let scheduledStopTime = document.createElement("div");
	let predictedStopTime = document.createElement("div");			
	scheduledStopTime.innerHTML = military_to_standard(stop["departure_time"]);		
	
	stopTime.className = "stop-time";
	stopTime.setAttribute("stop-id", stop["stop_id"]);

	scheduledStopTime.className = "scheduled-stop-time";
	scheduledStopTime.setAttribute("translate", "no");
	
	predictedStopTime.className = "predicted-stop-time";
	stopTime.append(scheduledStopTime);
	stopTime.append(predictedStopTime);
	tripRow.append(stopTime);
	return stopTime;
}

/*
Add the given trip to the given trips table.

Return the stops table mapping of form {stopId: table element, ...}
*/
function addTripToTable(trip, tripsTable) {
	// get stops for the trip
	let tripStops = trip["stops"];
	
	let tripRow = document.createElement("tr");
	tripRow.className = "trip-row";
	tripRow.id = trip.trip_id;
	
	// Store {stopId: table element, ...} for stops in this trip
	let stopsTableMapping = {};
	
	// put stop times for each stop of a trip into a row
	let stop_index = 0;
	tripStops.forEach(stop => {
		let stop_id = stop["stop_id"];
		let header_id_idx = header_stop_ids.indexOf(stop_id);
		
		// Add "--" until we reach this stop
		while (stop_index < header_id_idx) {	
			addMissingStopTime(tripRow);
			stop_index += 1;
		}
		
		stopsTableMapping[stop_id] = addStopTimeToRow(stop, tripRow)
		stop_index += 1;		
	})
	
	// Add any remaining empty stop entries
	while (stop_index < header_stop_ids.length) {
		addMissingStopTime(tripRow);
		stop_index += 1;
	}
	
	tripsTable.append(tripRow);
	return stopsTableMapping;
}

function create_trips_table(tripsArray) {
	// each row is a trip (trip_id)
	// each column is the arrival time (departure_time) for the given trip at that stop (stop_id -> stop_name)
	
    let trips_table = document.createElement("table");
    trips_table.className = "trips-table";
	// Fill first row with stop names
	let tripStops = tripsArray[0]["stops"];
	let trip_header_row = document.createElement("tr");
	trip_header_row.className = "trip-header-row";
	trip_header_row.setAttribute("translate", "no");
	trips_table.append(trip_header_row);
	
	// Store stop_ids for this route (in order)
	header_stop_ids = make_stop_header_row(tripsArray, trip_header_row);
	
	// Store {tripId: {stopId: table element, ...}, ...}
	let tripsTableMapping = {}
	
	// fill each row with a route
    tripsArray.forEach(trip => {
		let tripId = trip["trip_id"];
		tripsTableMapping[tripId] = addTripToTable(trip, trips_table);
    })
	return [trips_table, header_stop_ids, tripsTableMapping];
}

function activate_direction_button(selectedButton, otherButton) {
	selectedButton.setAttribute("data-active", "true");
	otherButton.setAttribute("data-active", "false");
}


function rd_calender_change_day_function(e) {
	let calendar = document.getElementById("routes-calendar");
	let table_container = document.getElementById("trips-table-container");
	let routeNum = table_container.getAttribute("routeNum");
	
	let userDate = new Date(calendar.value.concat("T12:00"));

	//THIS MIGHT BREAK THINGS
	DATE = userDate;
	display_route_details(routeNum);

	// let userDay = get_current_day(userDate);
	make_route_details_for_day(routeNum, userDate);
}

// Handles clicking the day button for a day that is today
// (ex: clicking the weekday button on tuesday)
function rd_day_tab_click_today_function(e) {
	let calendar = document.getElementById("routes-calendar");
	let table_container = document.getElementById("trips-table-container");
	
	let routeNum = table_container.getAttribute("routeNum");
	make_route_details_for_day(routeNum, DATE);
	calendar.value = format_date_for_input(DATE);
}

// Handles clicking the weekday button on a non-weekday
// (ex: clicking the weekday button on sunday)
function rd_weekday_tab_click_otherday_function(e) {
	let calendar = document.getElementById("routes-calendar");
	let table_container = document.getElementById("trips-table-container");
	let routeNum = table_container.getAttribute("routeNum");
	let nextMonday = get_next_monday(new Date(DATE));
	
	make_route_details_for_day(routeNum, nextMonday);		
	calendar.value = format_date_for_input(nextMonday);
}

// Handles clicking the saturday button on a non-satuday
// (ex: clicking the saturday button on sunday)
function rd_saturday_tab_click_otherday_function(e) {
	let calendar = document.getElementById("routes-calendar");
	let table_container = document.getElementById("trips-table-container");
	let routeNum = table_container.getAttribute("routeNum");
	let nextSaturday = get_next_saturday(new Date(DATE));
	
	make_route_details_for_day(routeNum, nextSaturday);		
	calendar.value = format_date_for_input(nextSaturday);
}

// Handles clicking the sunday button on a non-sunday
// (ex: clicking the sunday button on friday)
function rd_sunday_tab_click_otherday_function(e) {
	let calendar = document.getElementById("routes-calendar");
	let table_container = document.getElementById("trips-table-container");
	let routeNum = table_container.getAttribute("routeNum");
	let nextSunday = get_next_sunday(new Date(DATE));
	
	make_route_details_for_day(routeNum, nextSunday);		
	calendar.value = format_date_for_input(nextSunday);
}

function rd_route_map_click_function(e) {
	let table_container = document.getElementById("trips-table-container");
	let routeNum = table_container.getAttribute("routeNum");
	display_route_map(routeNum);
}

// Handles clicking the destination direction button
function destination_click_function(e) {
	clear_stop_selection_click_function();
	let destinationDirectionDiv = document.getElementById("to-destination-details");
	let name = destinationDirectionDiv.getAttribute("direction-name");
	CURRENT_DIR = DIRECTION_1;
	display_destination_direction(name);
}

// Handles clicking the downtown direction button
function downtown_click_function(e) {
	clear_stop_selection_click_function();
	let downtownDirectionDiv = document.getElementById("to-downtown-details");
	let name = downtownDirectionDiv.getAttribute("direction-name");
	CURRENT_DIR = DIRECTION_0;
	display_downtown_direction(name);
}

function display_current_direction() {
	if (CURRENT_DIR == DIRECTION_0) {
		downtown_click_function();
	} else {
		destination_click_function();
	}
}

function stop_selection_click_function() {
	let table = document.querySelector('.direction-table-div:not([style*="display: none"]').firstChild;
	let rows = table.querySelectorAll('tr');

	//get the stop sequence index the rider wishes to focus on
	let from_selector = document.getElementById("stops-selector-from");
	let from = from_selector.value; // --> the id of the stop selected
	let from_idx = -1;
	for (var i = 0; from_selector.length; i++) {
		if (from_selector.children[i].value === from) {
			from_idx = i-1;
			break;
		}
	}

	let to_selector = document.getElementById("stops-selector-to");
	let to = to_selector.value; // --> the id of the stop selected
	let to_idx = -1;
	for (var i = 0; to_selector.length; i++) {
		if (to_selector.children[i].value === to) {
			to_idx = i-1;
			break;
		}
	}

	rows.forEach(row => {
		const cells = row.querySelectorAll('th, td');
		for (var i = 0; i < cells.length; i++) {
			if (from_idx === i || to_idx === i) {
				cells[i].style.display = '';
			} else {
				cells[i].style.display = 'none';
			}
		}
	});
}

function clear_stop_selection_click_function() {
	let table = document.querySelector('.direction-table-div:not([style*="display: none"]');
	if (table) {
		table = table.firstChild;
		let rows = table.querySelectorAll('tr');

		let from_selector = document.getElementById("stops-selector-from");
		from_selector.value = 'Select Stop';
		let to_selector = document.getElementById("stops-selector-to");
		to_selector.value = 'Select Stop';

		rows.forEach(row => {
			const cells = row.querySelectorAll('th, td');
			for (var i = 0; i < cells.length; i++) {
				cells[i].style.display = '';
			}
		});
	}
}

// Removes all event listeners from buttons on the route-details page
function remove_route_details_event_listeners() {
	let weekdayTab = document.getElementById("route-weekday-tab");
	let saturdayTab = document.getElementById("route-saturday-tab");
	let sundayTab = document.getElementById("route-sunday-tab");
	let routeMapTab = document.getElementById("route-map-tab");	
	weekdayTab.removeEventListener("click", rd_day_tab_click_today_function);
	weekdayTab.removeEventListener("click", rd_weekday_tab_click_otherday_function);
	saturdayTab.removeEventListener("click", rd_day_tab_click_today_function);
	saturdayTab.removeEventListener("click", rd_saturday_tab_click_otherday_function);
	sundayTab.removeEventListener("click", rd_day_tab_click_today_function);
	sundayTab.removeEventListener("click", rd_sunday_tab_click_otherday_function);
	routeMapTab.removeEventListener("click", rd_route_map_click_function);
	
	let calendar = document.getElementById("routes-calendar");
	calendar.removeEventListener("change", rd_calender_change_day_function);
	
	let downtownButton = document.getElementById("downtownDirectionButton");
	let destinationButton = document.getElementById("destinationDirectionButton");
	destinationButton.removeEventListener("click", destination_click_function)
	downtownButton.removeEventListener("click", downtown_click_function)

	let stopSelectorButton = document.getElementById("apply-stop-selection");
	stopSelectorButton.removeEventListener("click", stop_selection_click_function);

	let clearSelectorButton = document.getElementById("clear-stop-selection");
	clearSelectorButton.removeEventListener("click", clear_stop_selection_click_function);
}

function display_destination_direction(destName) {
	let destinationDetailsDiv = document.getElementById("to-destination-details");
	let downtownDetailsDiv = document.getElementById("to-downtown-details");
	let routeDetailsHeader = document.getElementById("route-details-header");
	
	let downtownButton = document.getElementById("downtownDirectionButton");
	let destinationButton = document.getElementById("destinationDirectionButton");
	activate_direction_button(destinationButton, downtownButton);
	
	destinationDetailsDiv.style.display = 'block';
	downtownDetailsDiv.style.display = 'none';
	
	routeDetailsHeader.innerHTML = 'Route <span translate="no"> '+destName+'</span>';

	// Empty the stop selectors before recreating them
	let stop_selector_from = document.getElementById("stops-selector-from");
	let stop_selector_to = document.getElementById("stops-selector-to");
	stop_selector_from.innerHTML = '<option selected disabled>Select Stop</option>';
	stop_selector_to.innerHTML = '<option selected disabled>Select Stop</option>';
	
	// populate show stops drop downs
	//BUG: DIR_1_TRIP_STOPS does not seem to have all possible stops in the route included
	DIR_1_TRIP_STOPS.forEach(stop => {
		populate_stop_selectors(stop);
	})
}

function display_downtown_direction(destName) {
	let destinationDetailsDiv = document.getElementById("to-destination-details");
	let downtownDetailsDiv = document.getElementById("to-downtown-details");
	let routeDetailsHeader = document.getElementById("route-details-header");
	
	let downtownButton = document.getElementById("downtownDirectionButton");
	let destinationButton = document.getElementById("destinationDirectionButton");
	activate_direction_button(downtownButton, destinationButton);
	
	destinationDetailsDiv.style.display = 'none';
	downtownDetailsDiv.style.display = 'block';
	
	// let newHeaderText = "Route ".concat(destName);
	// routeDetailsHeader.innerHTML = newHeaderText;
	routeDetailsHeader.innerHTML = 'Route <span translate="no"> '+destName+'</span>';

	// Empty the stop selectors before recreating them
	let stop_selector_from = document.getElementById("stops-selector-from");
	let stop_selector_to = document.getElementById("stops-selector-to");
	stop_selector_from.innerHTML = '<option selected disabled>Select Stop</option>';
	stop_selector_to.innerHTML = '<option selected disabled>Select Stop</option>';

	// populate show stops drop downs
	DIR_0_TRIP_STOPS.forEach(stop => {
		populate_stop_selectors(stop);
	})
}

// Display the schedule for the given route number
function display_route_details(routeNum) {
    let routeDetailsDiv = document.getElementById("route-details");
    let routesDiv = document.getElementById("routes");
    let routeDetailsHeader = document.getElementById("route-details-header");

	// get the current date
	let day = get_current_day(DATE);
	let calendar = document.getElementById("routes-calendar");
	calendar.value = format_date_for_input(DATE);
		
	let weekdayTab = document.getElementById("route-weekday-tab");
	let saturdayTab = document.getElementById("route-saturday-tab");
	let sundayTab = document.getElementById("route-sunday-tab");
	let routeMapTab = document.getElementById("route-map-tab");
	
	// Remove all previous event listeners from the buttons
	remove_route_details_event_listeners();
	
	// Set the attributes of the table container
	let table_container = document.getElementById("trips-table-container");
	table_container.setAttribute("routeNum", routeNum)
	
	// Depending on day of week, set listeners to change date
	if (day != "saturday" && day != "sunday") {
		weekdayTab.addEventListener("click", rd_day_tab_click_today_function);
	}
	else {
		weekdayTab.addEventListener("click", rd_weekday_tab_click_otherday_function);
	}
	if (day != "saturday") {
		saturdayTab.addEventListener("click", rd_saturday_tab_click_otherday_function);
	}
	else {
		saturdayTab.addEventListener("click", rd_day_tab_click_today_function);
	}
	if (day != "sunday") {
		sundayTab.addEventListener("click", rd_sunday_tab_click_otherday_function);
	}
	else {
		sundayTab.addEventListener("click", rd_day_tab_click_today_function);
	}

	routeMapTab.addEventListener("click", rd_route_map_click_function);
	
	// Add event listener for user changing date explicitly
	calendar.addEventListener("change", rd_calender_change_day_function);
	
	// Add event listener for user changing direction
	let downtownButton = document.getElementById("downtownDirectionButton");
	let destinationButton = document.getElementById("destinationDirectionButton");
	let directionNames = get_direction_names(routeNum, TRIPS_ARRAY);
	
	let destinationDirectionDiv = document.getElementById("to-destination-details");
	let downtownDirectionDiv = document.getElementById("to-downtown-details");
	
	destinationDirectionDiv.setAttribute("direction-name", directionNames[DIRECTION_1]);
	downtownDirectionDiv.setAttribute("direction-name", directionNames[DIRECTION_0]);
	
	let dir_1_name = directionNames[DIRECTION_1];
	if (dir_1_name != DIRECTION_NAME_UNKNOWN) {
		destinationButton.addEventListener("click", destination_click_function)
		let temp = dir_1_name.split(" ")[0].length + 1
		destinationButton.innerHTML = dir_1_name.substring(temp);//.split(" ")[1];
	} else {
		destinationButton.innerHTML = "";
	}
	
	let dir_0_name = directionNames[DIRECTION_0];
	if (dir_0_name != DIRECTION_NAME_UNKNOWN) {
		downtownButton.addEventListener("click", downtown_click_function)
		let temp = dir_1_name.split(" ")[0].length + 1
		downtownButton.innerHTML = dir_0_name.substring(temp);//.split(" ")[1];
	} else {
		downtownButton.innerHTML = "";
	}

	let stopSelectorButton = document.getElementById("apply-stop-selection");
	stopSelectorButton.addEventListener("click", stop_selection_click_function);

	let clearSelectorButton = document.getElementById("clear-stop-selection");
	clearSelectorButton.addEventListener("click", clear_stop_selection_click_function);
	
	CURRENT_DIR = DIRECTION_1;
	make_route_details_for_day(routeNum, DATE);
}

// Make the route-details table for the given route number on the given day
function make_route_details_for_day(routeNum, date) {
	// Activate the button for this day
	activate_day_button(get_current_day(date), "route");
	// Clear intervals of previous real-time data updates
	clear_rt_intervals();
	
	//clear trip_stops arrays prior to drawing anew
	DIR_0_TRIP_STOPS = [];
	DIR_1_TRIP_STOPS = [];

	// Clear the divs holding the time tables.
	// It is important to do this before loading the new one, in case it 
	// takes a long time to load, the user does not see the old schedule and 
	// get confused.
	let destinationDetailsDiv = document.getElementById("to-destination-details");	
	let downtownDetailsDiv = document.getElementById("to-downtown-details");
	destinationDetailsDiv.innerHTML = "";
    downtownDetailsDiv.innerHTML = "";

	let downtownButton = document.getElementById("downtownDirectionButton");
	let destinationButton = document.getElementById("destinationDirectionButton");
	let calendarDiv = document.getElementsByClassName("calendar-div");
	let modalButton = document.getElementById("modalBtn");

	downtownButton.style.display = "block";
	destinationButton.style.display = "block";
	calendarDiv[0].style.display = "";
	modalButton.style.display = "none";

	// get trips for this route
	routeTrips = get_trips_by_route(routeNum, TRIPS_ARRAY, date);
	
	if (routeTrips["destinationTrips"].length > 0) {
		// Make table for destination direction
		let trips_table_data = create_trips_table(routeTrips["destinationTrips"]);
		let destinationTripsTable = trips_table_data[0];
		destinationDetailsDiv.append(destinationTripsTable);
		trips_table_map = trips_table_data[2];
		// Update with RT data first time
		update_route_details_rt(trips_table_map, routeNum);
		// Update with RT data fevery minute
		DIR_1_INTERVAL_ID = setInterval(update_route_details_rt, MS_IN_MIN, trips_table_map, routeNum);
		// Add trips_stops to global array
		DIR_1_TRIP_STOPS = getLongestTripStops(routeTrips["destinationTrips"]);
	} else {
		destinationDetailsDiv.innerHTML = "There is no service during the specified route and time."
	}
	
	if (routeTrips["downtownTrips"].length > 0) {
		// make table for downtown direction
		let trips_table_data = create_trips_table(routeTrips["downtownTrips"]);
		let downtownTripsTable = trips_table_data[0];		
		downtownDetailsDiv.append(downtownTripsTable);
		trips_table_map = trips_table_data[2];
		// Update with RT data first time
		update_route_details_rt(trips_table_map, routeNum);
		// Update with RT data fevery minute
		DIR_0_INTERVAL_ID = setInterval(update_route_details_rt, MS_IN_MIN, trips_table_map, routeNum);
		// Add trips_stops to global array
		DIR_0_TRIP_STOPS = getLongestTripStops(routeTrips["downtownTrips"]);
	} else {
		downtownDetailsDiv.innerHTML = "There is no service during the specified route and time."
	}

	let routeMap = document.getElementById("routeMap");
	let routeMapImage = document.getElementById("routeMapImage");
	routeMapImage.setAttribute("src", "");
	routeMap.style.display = "none";
	
	display_current_direction();
}

function display_route_map(routeNum) {
	// Activate the button for this day
	activate_day_button("route map", "route");
	
	// Clear the divs holding the time tables.
	// It is important to do this before loading the new one, in case it 
	// takes a long time to load, the user does not see the old schedule and 
	// get confused.
	let destinationDetailsDiv = document.getElementById("to-destination-details");	
	let downtownDetailsDiv = document.getElementById("to-downtown-details");
	destinationDetailsDiv.style.display = "none";
	downtownDetailsDiv.style.display = "none";
	destinationDetailsDiv.innerHTML = "";
    downtownDetailsDiv.innerHTML = "";

	let downtownButton = document.getElementById("downtownDirectionButton");
	let destinationButton = document.getElementById("destinationDirectionButton");
	let calendarDiv = document.getElementsByClassName("calendar-div");
	let modalButton = document.getElementById("modalBtn");

	downtownButton.style.display = "none";
	destinationButton.style.display = "none";
	calendarDiv[0].style.display = "none";
	modalButton.style.display = "block";

	// Display the div containing the image
	let routeMap = document.getElementById("routeMap");
	routeMap.style.display = "block";
	
	// Get the image source
	let routeMapImage = document.getElementById("routeMapImage");
	let routeMapImageModal = document.getElementById("routeMapImageModal");
	routeMapImage.setAttribute("src", "https://data.ridewta.com/routemaps/" + routeNum + ".png");
	routeMapImageModal.setAttribute("src", "https://data.ridewta.com/routemaps/" + routeNum + ".png");
}