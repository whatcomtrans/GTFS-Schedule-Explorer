const fs = require("fs");
const {get_data_array} = require("../scripts/main.js");

// Generate the kml from the stops and save it to KML_PATH
async function make_stops_kml(stops_url, kml_path) {
	let stops_array = await get_data_array(stops_url);
	let kmlstring = `<?xml version="1.0" encoding="UTF-8"?>
	<kml xmlns="http://earth.google.com/kml/2.1">
		<Document>
			<Style id="busIcon"><IconStyle id="ID"><Icon><href>https://data.ridewta.com/busStopIcon.jpg</href></Icon></IconStyle></Style>
			<open>1</open>
			<Folder>
				<name>Stops</name>
	`

	let end = stops_array.length;
	let thisstop = null;
	// loop over each stop and add to KML
	for (let i = 0; i < end; i++) {
		let stop = stops_array[i]
		let lon = stop["stop_lon"];
		let lat = stop["stop_lat"];
		let name = stop["stop_name"].replace("&", "&amp;");
		let code = stop["stop_code"];
			
		thisstop = `
				<Placemark>
					<name>${name}</name>
					<description>stop_code: ${code}</description>
					<Style id="busIcon"><IconStyle id="ID"><Icon><href>https://data.ridewta.com/busStopIcon.jpg</href></Icon></IconStyle></Style>
					<Point>
						<coordinates>${lon},${lat}</coordinates>
					</Point>
				</Placemark>
		`
		kmlstring += thisstop;
	}
	
	kmlstring += `
			</Folder>
		</Document>
	</kml>`
	
	// write to file
	let kmlfile = fs.openSync(kml_path, 'w');
	fs.writeFileSync(kmlfile, kmlstring);
	fs.closeSync(kmlfile);
	console.log("stops kml generated!");
}

module.exports = {make_stops_kml};