const AdmZip = require("adm-zip");
const axios = require("axios");
const fs = require("fs");

/* Fetch the file from url into an arraybuffer */
async function get(url) {
    const options =  { 
        method: 'GET',
        url: url,
        responseType: "arraybuffer"
    };
    const { data } = await axios(options);
    return data;
}

/* Download and extract the zip from URL to dir */
async function get_gtfs_static_zip(url, dir, name="") {
	const zipFileBuffer = await get(url);
	const zip = new AdmZip(zipFileBuffer);
	await zip.extractAllTo(dir);
	if (name != "") {
		console.log(name + " data complete!");
	}
}

/* Removes lines from GTFS file that do not concern the WTA */
function clean_file(type, dir, filename, args) {
	// Read data from file
	let f = fs.readFileSync(dir + filename, "utf8");
	// Reset and open file for writing
	let fd = fs.openSync(dir + filename, 'w');
	let lines = f.split('\r\n');
	// Write CSV header
	fs.writeSync(fd, lines[0] + "\n");
	let num_lines = lines.length;
	// Search for lines with route ids we want to keep
	switch (type) {
		case "routes":
		case "trips":
			for (let i = 1; i < num_lines; i++) {
				let vals = lines[i].split(',');
				if (args[0].includes(vals[args[1]])) {
					fs.writeSync(fd, lines[i] + "\n");
				}			
			}
			break;
		case "stops":
			for (let i = 1; i < num_lines; i++) {
				let vals = lines[i].split(',');
				if (Object.keys(args[0]).includes(vals[args[1]])) {
					// replace stop_id
					vals[args[1]] = args[0][vals[args[1]]];
					// replace stop_code
					vals[args[3]] = args[2][vals[args[3]]];
					fs.writeSync(fd, vals.join() + "\n");
				}
			}
			break;
		case "stop_times":
		for (let i = 1; i < num_lines; i++) {
				let vals = lines[i].split(',');
				if (Object.keys(args[0]).includes(vals[args[1]])) {
					// replace stop_id
					vals[args[1]] = args[0][vals[args[1]]];
					fs.writeSync(fd, vals.join() + "\n");
				}
			}
	}
	
	// close file
	fs.closeSync(fd);
}

function clean_data(dir, routes, stop_id_map, stop_code_map) {
	clean_file("routes", dir, "routes.txt", [routes, 0]);
	clean_file("trips", dir, "trips.txt", [routes, 0]);
	clean_file("stops", dir, "stops.txt", [stop_id_map, 0, stop_code_map, 1]);
	clean_file("stop_times", dir, "stop_times.txt", [stop_id_map, 3]);
}

/* Load, clean, and save external transit authority GTFS Static data.
 *
 * url: url to api to get zip
 * dir: directory to save extracted zip
 * routes: array of route_ids we care about (overlapping routes)
 * stop_id_map: JSON object mapping stop ids from external transit authority
 *     to their corresponding stop ids from our transit authority
 * stop_code_map: like stop_id_map but for stop codes
 * name (optional): name of external transit authority
 */
async function get_external_gtfs_static_data(url, dir, routes, stop_id_map,
		stop_code_map, name="External Transit Authority") {
	await get_gtfs_static_zip(url, dir);
	clean_data(dir, routes, stop_id_map, stop_code_map);
	console.log(name + " data complete!");
}

module.exports = {get_gtfs_static_zip, get_external_gtfs_static_data};