const {get_data_array} = require('../main.js');
const routes_url = "https://raw.githubusercontent.com/whatcomtrans/publicwtadata/master/GTFS/wta_gtfs_latest/routes.txt";
let NUM_ROUTES = 0;
const route_attributes = 9
;

describe('get_data_array tests', () => {
  test('fetches routes data from API', async () => {
      const data = await get_data_array(routes_url);
  
      // Check that fetched data is not null
      expect(data == null).toBeFalsy();
      
      //TODO: Rewrite this test test iterate the number of routes and set NUM_ROUTES to that length. We cannot test for number of routes without manually changing this integer each markup.
      NUM_ROUTES = data.length;
      console.log("Number of routes in gtfs: "+NUM_ROUTES);
      // Length of array should match the number of current routes
      //expect(data).toHaveLength(NUM_ROUTES); //this should always return true, waste of time now.

      // Each JSON object contains the correct number of attributes
      for (let i = 0; i < NUM_ROUTES; i++) {
        expect(Object.keys(data[i]).length).toEqual(route_attributes);

        // Check that attributes are not empty
        expect(Object.keys(data[i])[0] === "").toBeFalsy();
        expect(Object.keys(data[i])[1] === "").toBeFalsy();
        expect(Object.keys(data[i])[2] === "").toBeFalsy();
        expect(Object.keys(data[i])[3] === "").toBeFalsy();
        expect(Object.keys(data[i])[4] === "").toBeFalsy();
        expect(Object.keys(data[i])[5] === "").toBeFalsy();
        expect(Object.keys(data[i])[6] === "").toBeFalsy();
        expect(Object.keys(data[i])[7] === "").toBeFalsy();
        expect(Object.keys(data[i])[8] === "").toBeFalsy();

      }  
    }, 15000);
  
    test('properly handles errors', async () => {
      // Mocking fetch function to simulate an error
      global.fetch = jest.fn(() => Promise.reject('Error'));
  
      // Expect function to throw an error
      await expect(get_data_array(routes_url)).rejects.toEqual('Error');
  
      // Check that correct url was used
      expect(fetch).toHaveBeenCalledWith(routes_url);
    }, 15000);
});
