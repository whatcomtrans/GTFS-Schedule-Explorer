# schedules
GTFS Scheduling Website

## Description / Goals / TODO
The end goal of this project is to provide an easily deployable transit schedule explorer that will ingest any transit agency's gtfs and gtfs-rt feeds and produce a functioning website that is easy to maintain and useful for riders.
TODO: This site was originally built for the Whatcom Transportation Authority and we are working to make it agency configurable by means of a config.json file.
TODO: Write deployment guide to set up github actions, secrets, and AWS resources.

## Setup/Installation
1. Clone the repository
2. Run `npm install` to install dependencies

## Using 11ty

### Cleanup
To clean content from previous builds, run `./clean.sh`. This will ensure that all content is up to date when site gets built.

### Building/Hosting 
To build site locally, run `npm run build`. Statically built content will be located in `/_site`

To start local development environment hosted at run `npm run start`. This will start a server running at `http://localhost:8080/`

### Testing
1. Run cleanup script (to remove copies of files so that tests don't get run twice) 
2. Run `npm run test`. 

#### Test Coverage Report
To test with code coverage option, instead run `npm run coverage`. This will print out a code coverage report, and it will also generate the `/coverage` directory. A report is saved to `/coverage/lcov-report/index.html`, which can be opened in a browser to see a breakdown of the tests.

## Navigating The Repository
* `package.json` stores node scripts and dependencies
* `package-lock.json` stores more dependency data
* `.eleventy.js` contains the *eleventyConfig* to set up the eleventy build 
* `src/` contains all the code for the site
   * `css/`
      * `style.css` contains the css rules for the majority of the site
      * `main.css` and `newstyle.css` contain css rules for the provided WTA header and footer
   * `data/` contains code to generate data files at site build time
      * `start.js` defines constants and calls scripts from other data files
	  * `load_static.js` fetches static GTFS data from zip and saves it
	  * `generate_stops_kml.js` generates a KML file containing every stop with its stop code and name
   * `img/` contains images for site
   * `includes/` contains html code for site
      * `layouts/base.njk` is the main html file defining the structure of the site, as well as loading local scripts and the Google Maps Javascript API
	  * `partials/`
	     * `header.njk` contains html for header
		 * `footer.njk` contains html for footer
   * `scripts/` contains the code for the main functionality of the site
      * `tests/` contains all the test scripts for the corresponding scripts
	  * `main.js` contains constants and global variables, as well as handling cross-page functionality
	  * `dates.js` handles formatting and processing of date-related data
	  * `maps.js` handles setup and functionality of the **Interactive Map** page, including the Google Maps search
	  * `rt.js` handles the fetching, processing, and displaying of real-time data on the **Route Details** page
	  * `utils.js` contains utility functions for working with GTFS static data
	  * `routes.js` contains functionality for the **Routes** landing page
	  * `route-details.js` contains all the functionality for the **Route Details** page, except the real time data
	  * `stop-details.js` contains all the functionality for the **My Stop** page
	  * `trip-planner.js` contains all the functionality for the global **Trip Planner**
* `.github/workflows/` contains GitHub action scripts that run when code is pushed
   * `build-test-deploy.yml` builds site, runs test suite, and pushes to [the test site](http://testschedules.ridewta.com)
   
## How The Site Works

### Building the site
When the site is built using the `npm run build` command, 11ty will run the `start()` script located in `src/data/start.js`. This file declares a number of constants containing links and paths to fetch from and store to. Then the `start()` script will generate the stops kml, and then load any GTFS static data necessary.

<a id="external-note-1"></a>
#### Note on integrating external transit data (Ex: Skagit Transit)
In order to integrate schedules from external transit authorities, the following steps must be taken in `start.js`:
1. Declare a constant containing a url to an API from which a zip folder containing all GTFS static data can be fetched (ex: SKAGIT_STATIC_URL)
2. Declare a constant containing a path to a directory to store unzipped folder from step 1 (ex: SKAGIT_STATIC_DIR)
3. Import a JSON file containing the following (see `src/data/skagit.json` as an example):
    1. Routes to import
    2. Stop ID conversions (mapping external stop_id to the corresponding interal stop_id)
    3. Stop Code conversions (see previous step)
4. In `start()`, Load external GTFS Static data using `get_external_gtfs_static_data(url, dir, routes, stop_id_map, stop_code_map, name)`

### Loading the site
When the site is loaded in the browser, the function `main()` in `src/scripts/main.js` will be the first thing to be called. This function does the following:
1. Run initialization script `siteInit()` which will:
    1. Initialize the interactive map
    3. Set up global date object
    4. Set up Geocoder for stop page City & Zip
    5. Load Skagit JSON object
2. Call `initRoutes()` which will:
    1. Load the routes GTFS data
    2. Call `create_routes_table()` to build the routes table
3. Call `tripPlannerInit()` to initialize trip planner
4. Call `stopsInit()` which will: 
    1. Load stops and stop time GTFS data
    2. Build necessary stop data objects
5. Call `tripsInit()` which will:
    1. Load trips GTFS data
    2. Resolve GTFS merge (if necessary)
6. Call `datesInit()` which will:
    1. Load calendar and dates GTFS data
7. Call `reload()` to set up site based on URL

`main.js` also declares most global variables for use throughout the site.

### Routes (Landing) Page
The **Routes** page is the simplest page on the site. The functionality, contained in `src/scripts/routes.js` consists of a single function, `create_routes_table()` which takes in the div to place the routes table and a sorted array of all the routes. All this function does is loops through each route and creates a row containing the route name and number, which it puts into the div. Lastly, it adds a clickable function so that when the row is clicked, the site will navigate to the route details page for that route.

### Trip Planner
The **Trip Planner** is a persistent sidebar that stays visible as the user navigates on the site. The functionality, contained in `src/scripts/trip-planner.js`, allows the user to quickly navigate across the website if they know what they are looking for. 

The function `setupTProutes()` focuses on populating the select element with all the routes id and the click and press functionality to allow the user to view additional information on said selected route. 

The function `setupTPstop()` focuses on allowing the user to enter a particular stop ID or address and then taking them to the repective page at a touch of a click or key press. 

The function `setupTPInteractiveMap()` focuses on adding functionality to the button associated with the iteractive map section of the trip planner, taking the user to the interactive map at a click of the button.

The function `setupTPgoogleForm()` focuses on setting up the associated inputs and buttons associated with the plan trip. The function sets up the both the start and end input elements to have Google Maps API autocomplete when the user inputs a street. The function also sets up the "use my current location" button to paste the user current location to the associated input element (if permissions are enabled). Lastly, the function sets up the plan trip button which takes both the start and end input values (if applicable) and append these values to a Google Maps URL. After the appending process the user will then be sent to a newly created tab where there start and end addresses are pre-inputed (if applicable).

### Route Details
Functionality for the **Route Details** page is located in `src/scripts/route-details.js`. When a user navigates to the **Route Details** page, the function `display_route_details()` will set up the page, including buttons and calendar, and then call `make_route_details_for_day()` to build the timetable. This function will find the corresponding trips for this route using `get_trips_by_route()`, and then for each trip direction, create the timetable by calling `create_trips_table()`, initialize the real-time functionality with `update_route_details_rt()`, and set up and interval to call it repeatedly after a period of time using `setInterval()`. Finally, `make_route_details_for_day()` will display the default direction timetable by calling `display_current_direction()`.

When the **Route Map** tab is selected, the function `display_route_map()` is called which will display the map.

### My Stop
The workflow for the **My Stop** page is similar to the **Route Details** page. The functionality for this page is located in `src/scripts/stop-details.js`. When a user navigates to the **My Stop** page, the function `display_stop_details()` will set up the page, including buttons, calendar, and stop address, and then call `make_stop_details_for_day()` to build the timetable. This function will get all the trips for this stop with `get_trips_by_stop_id()`, and then build the timetable with `create_stops_table()`.

When the **Street View** tab is selected, the function `display_streetview()` is called which will display the street view.

### Interactive Map
The functionality for the **Interactive Map** page is located in `src/scripts/maps.js`. When the site is initialized, `initMap()` is called. This function sets up the Google Map by calling `setup_map()`, centers the map to the device location (if permissions allow) with `center_map()`, sets up the stops kml layer with `setup_stops_layer()`, sets up the routes kml layer with `setup_routes_layer()`, and finally sets up Google Autocomplete with `setup_autocomplete()`.

### Real-Time Data
Functionality for real-time data is located in `src/scripts/rt.js`. The following global constants are defined at the top of the file:
1. RT_API_URL: the url for the real-time API
2. EARLY_COLOR: the color for the real-time text when the bus is predicted to be early
3. LATE_COLOR: the color for the real-time text when the bus is predicted to be late
4. ON_TIME_COLOR: the color for the real-time text when the bus is predicted to be on time

The only function that is called externally is `update_route_details_rt()`, which is called in `src/scripts/route-details.js` in the function `make_route_details_for_day()`. The `update_route_details_rt()` function will first make an API call to retrieve the real-time data using the function `get_predictions_for_route()`. This function will fetch the response from the API.

#### Note on integrating external transit data (Ex: Skagit Transit)
The `get_predictions_for_route()` function needs to check if the requested route contains trips from an external transit authority. Because if so, it will need to convert the stop ids from the external to the internal version of these. This is done using the external JSON file set up earlier, see [above](#external-note-1).

### Note on merged GTFS static datasets
Checks are in place to detect when the GTFS static dataset is merged, in order to handle this special case accordingly. The merge will be detected in `src/scripts/main.js` in `tripsInit()`, which calls `is_merged()` in `src/scripts/utils.js` to detect a merge. A merge is detected by the inclusion of the key `original_trip_id` in the `trips.txt` file. If there is a merge, `tripsInit()` will call `make_merged_trip_mapping()` in `src/scripts/utils.js` to make a mapping from `original_trip_id` to `trip_id`. This is necessary because the real-time data will give the `original_trip_id` (although it will call it `trip_id`), so it is necessary to convert it in order to find the element in the route details timetable.

Thus, in `src/scripts/rt.js`, `update_route_details_rt()` will call `getTrueTripId()`, which will return the correct trip id, regardless of a merge or not. If there is no merge, `getTrueTripId()` simply returns the trip_id. If there is a merge, it will check the merged trip mapping.  