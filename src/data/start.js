const WTA_STATIC_URLS = {
	"stops": "https://raw.githubusercontent.com/whatcomtrans/publicwtadata/master/GTFS/wta_gtfs_latest/stops.txt",
}

const WTA_STATIC_URL = "https://github.com/whatcomtrans/publicwtadata/raw/refs/heads/master/GTFS/wta_gtfs_latest.zip";

const SKAGIT_STATIC_URL = "https://strweb.skagittransit.org/GTFS/google_transit.zip";

const WTA_STATIC_DIR = "./_site/data/wta-static-gtfs/";
const SKAGIT_STATIC_DIR = "./_site/data/skagit-static-gtfs/";

const SKAGIT_JSON = require("./skagit.json");

const KML_PATH = "./_site/data/stops.kml";
const ROUTES_JSON_PATH = "./_site/data/routes_min.json";

const {get_gtfs_static_zip, get_external_gtfs_static_data} = require("./load_static.js");
const {make_stops_kml} = require("./generate_stops_kml.js");
const {make_routes_json} = require("./generate_routes_json.js");

async function start() {
	await make_stops_kml(WTA_STATIC_URLS["stops"], KML_PATH);
	await make_routes_json(WTA_STATIC_URL, ROUTES_JSON_PATH);
	// need to await before starting wta so that directory exists before calling function
	get_gtfs_static_zip(WTA_STATIC_URL, WTA_STATIC_DIR, "WTA");
	get_external_gtfs_static_data(SKAGIT_STATIC_URL, SKAGIT_STATIC_DIR, SKAGIT_JSON["routes"], SKAGIT_JSON["stop_ids"], SKAGIT_JSON["stop_codes"], "SKAGIT COUNTY");
}

start();