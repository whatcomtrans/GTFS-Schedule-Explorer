/*
Authors:
	Tien Pham  (phamt33@wwu.edu)
Description: The purpose of this file is to handle the creation and 
use of the trip planner.
*/

// Setup the button elements associated with displaying the static route map image within the modal
function setupModal() {
	let modal = document.getElementById("myModal");
	let modalButton = document.getElementById("modalBtn");
	let span = document.getElementsByClassName("close")[0];

	modalButton.onclick = function() {
		modal.style.display = "block";
	}

	span.onclick = function() {
		modal.style.display = "none";
	}

	window.onclick = function(event) {
		if (event.target == modal) {
		  modal.style.display = "none";
		}
	}
}

// Precondition: The routes array is initialize before the setup
// Populate the select element inside the trip planner for each route in the route array
// Also setup the button associated with the select element to jump to said selected route
function setupTProutes() {
	let selectElement = document.getElementById("selRoutes");
	let initialOption = document.createElement("option");
	initialOption.textContent = "Select a Route";
	initialOption.value = "0";
	selectElement.appendChild(initialOption);
	ROUTES_ARRAY.forEach(route => {
		let option = document.createElement("option");
		option.value = route["route_id"];
		option.textContent = route["route_id"];
		selectElement.appendChild(option);
	});

	let routesubmitBtn = document.getElementById("TP-route-submit-btn");

	routesubmitBtn.onclick = function() {
		let selectElement = document.getElementById("selRoutes");
		let selectedOption = selectElement.options[selectElement.selectedIndex];

		if (selectedOption.value != "0") {
			parent.location.hash = "route-details?routeNum=".concat(selectedOption.value);
		}
	}
}

// Setup the button associated with the my stop input inside the trip planner
// The button functionality can also be done using the enter key inside the input element
function setupTPstop() {
	const TPstopSearchBtn = document.getElementById("TP-stop-submit-btn");
	const TPstopSearchInput = document.getElementById("TP-stop-search");    
	TPstopSearchBtn.onclick = function() {
		const TPstopSearchInput = document.getElementById("TP-stop-search");    
    	let stop_code = TPstopSearchInput.value;
		TP_stop_Search(stop_code);
	}
	TPstopSearchInput.onkeydown = function(event) {
		if (event.key === "Enter") {
			const TPstopSearchInput = document.getElementById("TP-stop-search");    
    		let stop_code = TPstopSearchInput.value;
			TP_stop_Search(stop_code);
		}
	}
}

// Helper function for setupTPstop
// Using the text input (if exist) to send the user to an existing stop page on said specific code
// Else take the user to the interactive map using said input (if exist)
function TP_stop_Search(stop_code) {
	// if the user entered a valid stop code, show that stop
	// otherwise, attempt to find that location on the interactive map
	if (stop_code == "") {

	} else if (is_valid_stop_code(stop_code)) {
		change_url_to_stop_details(stop_code)
	} else {

		codeAddressMap("TP-stop-search");
		change_url_to_interactive_map();
	}
}

// Setup the interactive map button inside the trip planner to take the user to said interactive
// map on click.
function setupTPInteractiveMap() {
	let interactiveMapBtn = document.getElementById("TP-interactiveMap-btn");

	interactiveMapBtn.onclick = function() {
		parent.location.hash = "#interactiveMap";
	}	
}

// Setup the button and inputs associated with the plan trip functionality inside the trip planner
function setupTPgoogleForm() {
	
	document.getElementById("initialBtn").onclick = function() {
		TP_getcurrLocation(document.getElementById("initial"));
	}

	document.getElementById("endLocationBtn").onclick = function() {
		TP_getcurrLocation(document.getElementById("endLocation"));
	}

	// Get the inputs from the start and end (if exist) then open the new google map tab
	document.getElementById('planTripBtn').onclick = function() {
		let startAddress = document.getElementById("initial").value;
		let endAddress = document.getElementById("endLocation").value;

		let url = `https://www.google.com/maps/dir/?api=1&origin=${startAddress}&destination=${endAddress}`;

		url += `&travelmode=transit`;
		window.open(url, "_blank");
	}

	// Plan trip button functionality also occur when the user presses the enter key inside the input element
	document.getElementById("initial").onkeydown = openGoogleMapsTabOnKeyPress;
	document.getElementById("endLocation").onkeydown = openGoogleMapsTabOnKeyPress;

	TP_setup_autocomplete();
}

// Helper function to perform the plan trip functionality on key press (specifically enter)
function openGoogleMapsTabOnKeyPress(event) {
	if (event.key === "Enter") {
		let startAddress = document.getElementById("initial").value;
		let endAddress = document.getElementById("endLocation").value;

		let url = `https://www.google.com/maps/dir/?api=1&origin=${startAddress}&destination=${endAddress}`;

		url += `&travelmode=transit`;
		window.open(url, "_blank");
	}
}

// Apply the google street autocomplete to the start and end inputs
function TP_setup_autocomplete() {
	let bounds = new google.maps.LatLngBounds(new google.maps.LatLng(48.410863, -122.904638), new google.maps.LatLng(49.004438, -121.595991));
    let startInput = document.getElementById("initial");
	let endInput = document.getElementById("endLocation");
    let options = {
        bounds: bounds,
        componentRestrictions: {country: 'us'}
    };
    let autocompleteInitial = new google.maps.places.Autocomplete(startInput, options);
	let autocompleteEnd = new google.maps.places.Autocomplete(endInput, options);
    google.maps.event.addListener(autocompleteInitial, 'place_changed', function() {
		console.log("autocomplete");
    });

	google.maps.event.addListener(autocompleteEnd, 'place_changed', function() {
		console.log("autocomplete");
    });
}

// If the permissions are enable, get the coordinates of the user positive and paste it into
// the associated input element
function TP_getcurrLocation(element) {
	navigator.geolocation.getCurrentPosition(function(position) {
        let lat = position.coords.latitude 
		let long = position.coords.longitude;
		element.value = lat + " " + long;
    },
    function (error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                alert("Some mapping functions will not work without geolocation services enabled. For full functionality, please go to your browser's settings and enable location services.");
                break;
            case error.POSITION_UNAVAILABLE:
                alert("We were unable to get your currect location. Some mapping functions may not be available.");
                break;
            case error.TIMEOUT:
                alert("The request to use your location timed out. Some mapping functions may not be available.");
                break;
            case error.UNKNOWN_ERROR:
                alert("We were unable to get your current location. Some mapping functions may not be available.");
                break;
        }
    });
}