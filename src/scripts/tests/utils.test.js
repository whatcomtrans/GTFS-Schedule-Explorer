// jest.mock('./utils', () => {
//     const originalModule = jest.requireActual('./utils');
//     return {
//         ...originalModule,
//         ALL_STOP_CODES: ["2001", "123", "456"], // Mocked value
//     };
// });

const {csv_to_json_array, compare_route_id, compare_trip_id, compare_stop_time, compare_trip_start_time, is_valid_stop_code, 
       get_stops_by_trip, make_stop_id_to_stop_info_mapping, get_routes_by_trips, get_trip_service_on_date, get_all_stop_codes} = require('../utils');
const url = "https://raw.githubusercontent.com/whatcomtrans/publicwtadata/master/GTFS/wta_gtfs_latest/routes.txt";

// end of setup code //

/* Tests for csv_to_json_array function */
describe('csv_to_json_array tests', () => {
    test('properly convert csv to json', async () => {
      let text = 'route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url\n1,14,1,Fairhaven&Downtown,,3,\n105,14,105,Fairhaven&Downtown,,3,';
      expect(csv_to_json_array(text)).toEqual(routesData);
    });
    
    //Expect function to ignore input and print error to console
    test('handles empty input', async () => {
      expect(csv_to_json_array("")).toBeNull();
    });
    
    //Expect function to ignore input and print error to console
    test('handles input with only a single line', async () => {
      expect(csv_to_json_array('route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url\n')).toBeNull();
    });
});

let routesData = [{
  route_id: '1',
  agency_id: '14',
  route_short_name: '1',
  route_long_name: 'Fairhaven&Downtown',
  route_desc: 'null',
  route_type: '3',
  route_url: 'null'
}];

describe("is_valid_stop_code", () => {
    beforeEach(() => {
    // mocks ALL_STOP_CODES for each test
    global.ALL_STOP_CODES = ["2001", "2966"];
    });

    test("returns true for a valid stop code", () => {
        expect(is_valid_stop_code("2001")).toBe(true);
    });

    test("returns false for an invalid stop code", () => {
        expect(is_valid_stop_code("999")).toBe(false);
    });
    test("formatting matters", () => {
        expect(is_valid_stop_code("2966")).toBe(true);
        expect(is_valid_stop_code("123 ")).toBe(false); // with trailing space
    });

    test("handles an empty string", () => {
        expect(is_valid_stop_code("")).toBe(false);
    });
});

// spread out tests between two like functions because of similar logic
describe("Comparison functions", () => {

    describe("compare_route_id", () => {
        test("correctly compares route_id numbers", () => {
            const a = { route_id: "1" };
            const b = { route_id: "14" };
            expect(compare_route_id(a, b)).toBeLessThan(0);
        });

        test("ignores non-numeric characters in route_id", () => {
            const a = { route_id: "1" };
            const b = { route_id: "14S" };
            expect(compare_route_id(a, b)).toBeLessThan(0);
        });

        test("handles empty or missing route_id", () => {
            const a = { route_id: "" };
            const b = { route_id: "R1" };
            expect(compare_route_id(a, b)).toBeLessThan(0);
        });
    });
    describe("compare_trip_id", () => {
        test("ignores non-numeric characters in route_id", () => {
            const a = { route_id: "1" };
            const b = { route_id: "14S" };
            expect(compare_route_id(a, b)).toBeLessThan(0);
        });
    });

    describe("compare_stop_time", () => {
        test("correctly compares times in 'HH:MM:SS' format", () => {
            const a = { departure_time: "08:00:00" };
            const b = { departure_time: "09:00:00" };
            expect(compare_stop_time(a, b)).toBeLessThan(0);
        });

        test("handles same departure_time values", () => {
            const a = { departure_time: "08:00:00" };
            const b = { departure_time: "08:00:00" };
            expect(compare_stop_time(a, b)).toEqual(0);
        });
    });

    describe("compare_trip_start_time", () => {
        test("handles partial times / invalid format", () => {
            const a = { start_time: "07:00" };
            const b = { start_time: "07:00:00" };
            expect(compare_trip_start_time(a, b)).toBeLessThan(0);
        });

        test("handles missing start_time", () => {
            const a = { start_time: "" };
            const b = { start_time: "07:00:00" };
            expect(compare_trip_start_time(a, b)).toBeLessThan(0);
        });
    });
});

/* Tests for get_stops_by_trip function */
describe("get_stops_by_trip tests", () => {
    test("trip without matching trip id is ignored", () => {
        let trips = [{"trip_id":"1020","departure_time":"17:30:00","departure_time":"17:30:00","stop_id":"796","stop_sequence":"1","stop_headsign":"26 Lynden","pickup_type":"0","drop_off_type":"0","shape_dist_traveled":"0.00","timepoint":"1"}];
        expect(get_stops_by_trip(1112010, trips)).toEqual([])
    });

    test("trip without matching trip id is ignored", () => {
        let trips = [{"trip_id":"1112010","departure_time":"18:49:35","departure_time":"18:49:35","stop_id":"658","stop_sequence":"16","stop_headsign":"1 Fairhaven","pickup_type":"0","drop_off_type":"0","shape_dist_traveled":"5090.47","timepoint":"0"}];
        expect(get_stops_by_trip(1070010, trips).length > 0).toBeFalsy();
    });
});


/* Tests for get_routes_by_trips function */
describe("get_routes_by_trips tests", () => {
    test("Route ids are properly added to returned array", () => {
        let trips = [{"trip_id":"1922020_merged_2155208","departure_time":"05:55:00","headsign":"50 Lummi Nation","route_id":"50"},{"trip_id":"1717020_merged_2154597","departure_time":"06:00:00","headsign":"75A Blaine","route_id":"75"},
                    {"trip_id":"1900020_merged_2155059","departure_time":"06:25:00","headsign":"1 Fairhaven","route_id":"1"}];
        expect(get_routes_by_trips(trips)).toEqual(["1","50","75"]);
    });

    test("Only one unique route id exists in the returned array if it appears multiple times in trips", () => {
        let trips = [{"trip_id":"1922020_merged_2155208","departure_time":"05:55:00","headsign":"50 Lummi Nation","route_id":"50"},{"trip_id":"1717020_merged_2154597","departure_time":"06:00:00","headsign":"75A Blaine","route_id":"75"},
                     {"trip_id":"1753020","departure_time":"06:10:00","headsign":"1 Fairhaven","route_id":"1"},{"trip_id":"1900020_merged_2155059","departure_time":"06:25:00","headsign":"1 Fairhaven","route_id":"1"}];
        expect(get_routes_by_trips(trips)).toEqual(["1","50","75"]);
    });

    test("Route ids are returned and sorted in ascending order", () => {
        let trips = [{"trip_id":"1911020","departure_time":"07:05:00","headsign":"331 Downtown","route_id":"331"},{"trip_id":"672020","departure_time":"07:10:00","headsign":"14 Fairhaven via WWU","route_id":"14"},
            {"trip_id":"824020","departure_time":"07:10:00","headsign":"190 Lincoln St via WWU","route_id":"190"},{"trip_id":"52020","departure_time":"07:10:00","headsign":"197 Lincoln/WWU","route_id":"197"},{"trip_id":"1517020","departure_time":"07:10:00","headsign":"232 Cordata/WCC","route_id":"232"}];
        let route_ids = get_routes_by_trips(trips)
        for (let i = 0; i < route_ids.length-1; i++) {
            expect(parseInt(route_ids[i]) < parseInt(route_ids[i+1])).toEqual(true);
        }
    });

    test("Function is able to processes trips containing only {\"route_id\": route_id} mapping", () => {
        let trips = [{"route_id":"331"},{"route_id":"14"},{"route_id":"190"},{"route_id":"197"},{"route_id":"232"}];
        expect(get_routes_by_trips(trips)).toEqual(["14","190","197","232","331"]);
    });
});

/* Tests for get_trip_service_on_date function */
describe("get_trip_service_on_date tests", () => {
    beforeEach(() => {
        global.CALENDAR_ARRAY = [{"service_id":"1","monday":"1","tuesday":"1","wednesday":"1","thursday":"1","friday":"1","saturday":"0","sunday":"0","start_date":"20250202","end_date":"20250614"}];
        global.DATES_ARRAY = [{"service_id":"1","date":"20250203","exception_type":"2"},{"service_id":"1","date":"20250324","exception_type":"1"}];
        global.DATE_EXCEPTION_TYPE_ADD_SERVICE = ["1"];
        global.DATE_EXCEPTION_TYPE_REMOVE_SERVICE = ["2"];

    });
    test("No serivce available for the given service id", () => {
        let d = new Date(2025, 1, 23, 16);
        expect(get_trip_service_on_date('1', d) == false).toEqual(true);
    });

    test("Handles date with an exception", () => {
        let d = new Date(2025, 1, 3, 16);
        expect(get_trip_service_on_date('1', d) == false).toEqual(true);
    });

    test("Trip with given service id has service on given date", () => {
        let d = new Date(2025, 2, 4, 1);
        expect(get_trip_service_on_date('1', d) == true).toEqual(true);
    });

    test("Date is out of range of service ID date range", () => {
        let d = new Date(2025, 5, 17, 1);
        expect(get_trip_service_on_date('1', d) == false).toEqual(true);
    });
});

/* Tests for get_all_stop_codes function */
describe("get_all_stop_codes tests", () => {
    beforeEach(() => {
    global.STOPS_ARRAY = [{"stop_id":"1","stop_code":"2001","stop_name":"Bellingham Station","stop_desc":"null","stop_lat":"48.750390","stop_lon":"-122.475612","zone_id":"1","stop_url":"null","location_type":"null","parent_station":"null","stop_timezone":"null","wheelchair_boarding":"1"},{"stop_id":"3","stop_code":"2966","stop_name":"Bellingham Technical College","stop_desc":"null","stop_lat":"48.764887","stop_lon":"-122.510672","zone_id":"1","stop_url":"null","location_type":"null","parent_station":"null","stop_timezone":"null","wheelchair_boarding":"1"},
                         {"stop_id":"4","stop_code":"5555","stop_name":"Bakerview Rd at Fred Meyer","stop_desc":"null","stop_lat":"48.789614","stop_lon":"-122.510958","zone_id":"1","stop_url":"null","location_type":"null","parent_station":"null","stop_timezone":"null","wheelchair_boarding":"1"},{"stop_id":"5","stop_code":"3142","stop_name":"St Joseph Hospital","stop_desc":"null","stop_lat":"48.773525","stop_lon":"-122.474850","zone_id":"1","stop_url":"null","location_type":"null","parent_station":"null","stop_timezone":"null","wheelchair_boarding":"1"}, 
                         {"stop_id":"5","stop_code":"3142","stop_name":"St Joseph Hospital","stop_desc":"null","stop_lat":"48.773525","stop_lon":"-122.474850","zone_id":"1","stop_url":"null","location_type":"null","parent_station":"null","stop_timezone":"null","wheelchair_boarding":"1"}];
    });
    test("Returns all stop codes in stops array", () => {
        let stop_code_list = get_all_stop_codes()
        expect(stop_code_list).toEqual(["2001", "2966", "5555", "3142"]);
    });

    test("Duplicate stop codes are not added", () => {
        let stop_code_list = get_all_stop_codes()
        expect(stop_code_list == ["2001", "2966", "5555", "3142", "3142"]).toBeFalsy();
    });
});
