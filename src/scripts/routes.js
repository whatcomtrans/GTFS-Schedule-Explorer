/*
Authors:
	Skyler Crane (cranes2@wwu.edu)
Description: The purpose of this file is to handle the creation 
of the routes table on the Routes (landing) page
*/

// Creates the routes table in the routes_div using the 
// elements of routes_array
async function create_routes_table(routes_div, routes_array) {
    // make table
    let routes_table = document.getElementById("routes_table");
    // routes_table.className = "routes_table";
    // fill each row with a route
    routes_array.forEach(route => {
        let route_row = document.createElement("tr");
        route_row.className = "route_row";
        let route_num = document.createElement("td");
        let route_name = document.createElement("td");
        route_num.innerHTML = route["route_id"];
        route_num.className = "route_id";
        route_name.innerHTML = route["route_long_name"];
        route_name.className = "route_name";
        route_row.append(route_num);
        route_row.append(route_name);
		route_row.addEventListener("click", function() {
			parent.location.hash = "route-details?routeNum=".concat(route["route_id"]);
		})
        routes_table.append(route_row);
    })
    // Put routes table into route div
    routes_div.append(routes_table);
}