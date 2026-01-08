/*
Authors: 
	Skyler Crane (cranes2@wwu.edu)
	Tien Pham  (phamt33@wwu.edu)
Description: The purpose of this file is to handle the creation and 
	use of the stop details section of the site.
*/

// Change the elements to display the stop details 
function display_stop_details(stop_code) {
	// Remove all previous event listeners from the buttons
	remove_stop_details_event_listeners();
	
	let stopSearchInput = document.getElementById("stop-search-input");
	stopSearchInput.addEventListener("keypress", stop_search_keypress_enter_function);
    stopSearchInput.value = stop_code;
	
	let stopDetailsMapBtn = document.getElementById("mapStopID");
	stopDetailsMapBtn.addEventListener("click", mapStop);

	let day = get_current_day(DATE);
	let calendar = document.getElementById("stops-calendar");
	calendar.value = format_date_for_input(DATE);
	
	let stopID = STOPS_ARRAY.filter(stop => stop.stop_code == stop_code)[0].stop_id;
	fill_served_by_element(stopID);

	let thisStop = STOPS_ARRAY.filter(stop => stop.stop_code == stop_code)[0];
	
	setCityZip(thisStop);
	
	let stop_name = thisStop.stop_name;
	document.getElementById("stop-details-name").textContent = stop_name;
    document.getElementById("stop-selection").textContent = stop_code;
	
	let weekdayTab = document.getElementById("stop-weekday-tab");
	let saturdayTab = document.getElementById("stop-saturday-tab");
	let sundayTab = document.getElementById("stop-sunday-tab");
	let streetViewTab = document.getElementById("stop-streetview-tab");
	
	// Set the attributes of the table container
	let table_container = document.getElementById("stops-table-container");
	table_container.setAttribute("stopCode", stop_code);
	
	// Depending on day of week, set listeners to change date
	if (day != "saturday" && day != "sunday") {
		weekdayTab.addEventListener("click", sd_day_tab_click_today_function);
	}
	else {
		weekdayTab.addEventListener("click", sd_weekday_tab_click_otherday_function);
	}
	if (day != "saturday") {
		saturdayTab.addEventListener("click", sd_saturday_tab_click_otherday_function);
	}
	else {
		saturdayTab.addEventListener("click", sd_day_tab_click_today_function);
	}
	if (day != "sunday") {
		sundayTab.addEventListener("click", sd_sunday_tab_click_otherday_function);
	}
	else {
		sundayTab.addEventListener("click", sd_day_tab_click_today_function);
	}

	streetViewTab.addEventListener("click", st_streetview_click_function);
	
	// Add event listener for user changing date explicitly
	calendar.addEventListener("change", sd_calender_change_day_function)

	//Write some function to create stop table
	make_stop_details_for_day(stop_code, DATE);
}

// Set the city and zip code text for this stop using Maps geocoder
// to query address from lat-lng coordinates
function setCityZip(stop) {
	let cityZip = document.getElementById("cityZip");
	cityZip.innerHTML = "";
	const latlng = {
		lat: parseFloat(stop.stop_lat),
		lng: parseFloat(stop.stop_lon)
	};
	geocoder.geocode({location: latlng}).then(
		(response) => {
			// if geocoder returns a response, search it for city and zip
			if (response.results[0]) {
				let city = "";
				let zip = "";
				let components = response.results[0].address_components;
				let obj;
				// loop through address components to find city and zip
				for (let i = 0; i < components.length; i++) {
					obj = components[i];
					if (obj.types.includes("locality")) {
						city = obj.long_name;
					} else if (obj.types.includes("postal_code")) {
						zip = obj.long_name;
					}
					if (city.length != 0 && zip.length != 0) {
						// break out of loop if we've found both already
						break;
					}
				}
				cityZip.innerHTML = city + ", " + zip;
			} else {
				// could not find address
				cityZip.innerHTML = "";
			}
		}
	).catch((e) => {
		cityZip.innerHTML = "";
		console.log(e)
	});
}

// Remove all previous event listeners from stop details page
function remove_stop_details_event_listeners() {
	let stopSearchInput = document.getElementById("stop-search-input");	
	let weekdayTab = document.getElementById("stop-weekday-tab");
	let saturdayTab = document.getElementById("stop-saturday-tab");
	let sundayTab = document.getElementById("stop-sunday-tab");
	let streetViewTab = document.getElementById("stop-streetview-tab");
	let calendar = document.getElementById("stops-calendar");
	let stopDetailsMapBtn = document.getElementById("mapStopID");
	
	stopSearchInput.removeEventListener("keypress", stop_search_keypress_enter_function);
	weekdayTab.removeEventListener("click", sd_day_tab_click_today_function);
	weekdayTab.removeEventListener("click", sd_weekday_tab_click_otherday_function);
	saturdayTab.removeEventListener("click", sd_saturday_tab_click_otherday_function);
	saturdayTab.removeEventListener("click", sd_day_tab_click_today_function);
	sundayTab.removeEventListener("click", sd_day_tab_click_today_function);
	sundayTab.removeEventListener("click", sd_day_tab_click_today_function);
	streetViewTab.removeEventListener("click", st_streetview_click_function);
	calendar.removeEventListener("change", sd_calender_change_day_function);
	stopDetailsMapBtn.removeEventListener("click", mapStop);
}

// Triggers stop search button when users presses Enter key while typing
// in text box
function stop_search_keypress_enter_function(e) {
	if (e.key == "Enter") {
		document.getElementById("stop-search-button").click();
	}
}

function sd_calender_change_day_function(e) {
	let calendar = document.getElementById("stops-calendar");
	let table_container = document.getElementById("stops-table-container");
	let stopCode = table_container.getAttribute("stopCode");
	let select = document.getElementById("stop-option");
	select.selectedIndex = 0;

	let userDate = new Date(calendar.value.concat("T12:00"));
	make_stop_details_for_day(stopCode, userDate);
}

// Handles clicking the day button for a day that is today
// (ex: clicking the weekday button on tuesday)
function sd_day_tab_click_today_function(e) {
	let calendar = document.getElementById("stops-calendar");
	let table_container = document.getElementById("stops-table-container");
	let select = document.getElementById("stop-option");
	select.selectedIndex = 0;
	
	let stopCode = table_container.getAttribute("stopCode");
	make_stop_details_for_day(stopCode, DATE);
	calendar.value = format_date_for_input(DATE);
}

// Handles clicking the weekday button on a non-weekday
// (ex: clicking the weekday button on sunday)
function sd_weekday_tab_click_otherday_function(e) {
	let calendar = document.getElementById("stops-calendar");
	let table_container = document.getElementById("stops-table-container");
	let stopCode = table_container.getAttribute("stopCode");
	let nextMonday = get_next_monday(new Date(DATE));
	let select = document.getElementById("stop-option");
	select.selectedIndex = 0;
	
	make_stop_details_for_day(stopCode, nextMonday);		
	calendar.value = format_date_for_input(nextMonday);
}

// Handles clicking the saturday button on a non-satuday
// (ex: clicking the saturday button on sunday)
function sd_saturday_tab_click_otherday_function(e) {
	let calendar = document.getElementById("stops-calendar");
	let table_container = document.getElementById("stops-table-container");
	let stopCode = table_container.getAttribute("stopCode");
	let nextSaturday = get_next_saturday(new Date(DATE));
	let select = document.getElementById("stop-option");
	select.selectedIndex = 0;
	
	make_stop_details_for_day(stopCode, nextSaturday);		
	calendar.value = format_date_for_input(nextSaturday);
}

// Handles clicking the sunday button on a non-sunday
// (ex: clicking the sunday button on friday)
function sd_sunday_tab_click_otherday_function(e) {
	let calendar = document.getElementById("stops-calendar");
	let table_container = document.getElementById("stops-table-container");
	let stopCode = table_container.getAttribute("stopCode");
	let nextSunday = get_next_sunday(new Date(DATE));
	let select = document.getElementById("stop-option");
	select.selectedIndex = 0;
	
	make_stop_details_for_day(stopCode, nextSunday);		
	calendar.value = format_date_for_input(nextSunday);
}

function st_streetview_click_function(e) {
	let table_container = document.getElementById("stops-table-container");
	let stopCode = table_container.getAttribute("stopCode");
	display_streetview(stopCode);

}

function make_stop_details_header_row() {
	let stop_header_row = document.createElement("tr");
	stop_header_row.className = "stop-header-row";
	let th = document.createElement("th");
	th.innerHTML = "Time";
	th.className = "stop-table-time-header";
	stop_header_row.append(th);
	th = document.createElement("th");
	th.innerHTML = "Route";
	th.className = "stop-table-route-header";
	stop_header_row.append(th);
	return stop_header_row;
}

function create_stops_table(trips) {
	let stops_table = document.createElement("table");
    stops_table.className = "stops-table";
	// Fill header row
	let stop_header_row = make_stop_details_header_row();
	stops_table.append(stop_header_row);
	// Fill rest of table
	for (let i = 0; i < trips.length; i++) {
		let trip = trips[i];

		let name = trip["headsign"];
		
		let row = document.createElement("tr");
		row.className = "stop-row";
		row.setAttribute('route-id', trip["route_id"]);
		row.setAttribute("translate", "no");
		// add time
		let td = document.createElement("td");
		td.innerHTML = military_to_standard(trip["departure_time"])
		td.className = "route-stop-time";
		row.append(td);
		// add route
		td = document.createElement("td");
		td.innerHTML = name;
		td.className = "route-name";
		row.append(td);
		
		stops_table.append(row);
	}

	return stops_table;
}

async function fill_served_by_element(stopID) {
	let trips = get_trips_by_stop_id(stopID, get_next_monday(new Date(DATE)));
	// List of the routes that serve this stop
	let servedByRoutes = document.getElementById("served-by-routes");
	servedByRoutes.innerHTML = "";
	
	let route_ids = get_routes_by_trips(trips);
	fill_schedule_for(route_ids);

	let str = "";
	let len = route_ids.length;
	for (let i = 0; i < len; i++) {
		let a = document.createElement("a");
		a.textContent = route_ids[i];
		a.className = "stop-served-by-route";
		a.href = "#route-details?routeNum=".concat(route_ids[i]);
		a.style.color = "#0E8FDD";
		a.style.textDecoration = "none";

		if (i < len - 1) {
			a.textContent = a.textContent.concat(", ");
		}

		servedByRoutes.append(a);
	}
}

function fill_schedule_for(route_ids) {
	let stop_option_element = document.getElementById("stop-option");
	stop_option_element.textContent = "";

	let allrouteOption = document.createElement("option");
	allrouteOption.value = "All Routes";
	allrouteOption.id = "all";
	allrouteOption.text = "All Routes";

	stop_option_element.appendChild(allrouteOption);

	for (let i = 0; i < route_ids.length; i++) {
		let optionElement = document.createElement("option");
		optionElement.setAttribute("translate", "no");
		optionElement.value = route_ids[i];
		optionElement.text = route_ids[i];
		stop_option_element.appendChild(optionElement);
	}
}

function make_stop_details_for_day(stopCode, date) {
	let stop_table_div = document.getElementById("stops-table-container");
	stop_table_div.innerHTML = "";
	activate_day_button(get_current_day(date), "stop");

	let stopID = STOPS_ARRAY.filter(stop => stop.stop_code == stopCode)[0].stop_id;
	let trips = get_trips_by_stop_id(stopID, date);
	let table = create_stops_table(trips);	
	stop_table_div.append(table);
	document.getElementById("stop-info").style.display = "block";
	document.getElementById("stop-streetview").style.display = "none";
}

// Function to be called when the user searches for a stop via text box
function stop_search() {
	const stopSearchInput = document.getElementById("stop-search-input");    
    let stop_code = stopSearchInput.value;
	// if the user entered a valid stop code, show that stop
	// otherwise, attempt to find that location on the interactive map
	if (is_valid_stop_code(stop_code)) {
		change_url_to_stop_details(stop_code)
	} else {
		codeAddressMap("stop-search-input");
		change_url_to_interactive_map();
	}
}

function display_streetview(stopCode) {
	activate_day_button("street-view", "stop");
	document.getElementById("stop-info").style.display = "none";
	document.getElementById("stop-streetview").style.display = "block";

	let stopObj = STOPS_ARRAY.filter(stop => stop.stop_code == stopCode);

	let latitude = stopObj[0].stop_lat;
	let longitude = stopObj[0].stop_lon;

	const streetViewService = new google.maps.StreetViewService();
	const stopLocation = new google.maps.LatLng(latitude, longitude);

	streetViewService.getPanoramaByLocation(stopLocation, 50, (panoramaData, status) => {
		if (status === google.maps.StreetViewStatus.OK) {
		  	// Calculate the heading to face the stop
		  	const heading = google.maps.geometry.spherical.computeHeading(panoramaData.location.latLng, stopLocation);
	
		  	// Create a Street View Panorama object
		  	const panorama = new google.maps.StreetViewPanorama(
				document.getElementById('stop-streetview'), {
			  		position: panoramaData.location.latLng,
			  		pov: {
						heading: heading,
						pitch: 5
			  		}
				}
		  	);
		} else {
		  	// Handle cases where no Street View panorama is available
		  	console.error('No Street View panorama found for this location.');
		}
	});
}

function mapStop() {
	const stopSearchInput = document.getElementById("stop-search-input");    
    let stop_code = stopSearchInput.value;
	parent.location.hash = "#interactiveMap?search=" + stop_code;
}
