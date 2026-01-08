//Script to consume GTFS static files and create a single geojson file that contains 1 shape per route
const csv = require('csvtojson');
const admzip = require('adm-zip');
const axios = require('axios');
const fs = require('fs');

async function make_routes_json(url, path) {
    //Download the gtfs file from url, extract it, and transform it from csv into a json object
    let gtfs = await getAndUnZip(url);
    //Use the gtfs object to generate a geojson object that draws one line per route in the gtfs object
    let geojson = drawGeoJson(gtfs);
    const jsonString = JSON.stringify(geojson);
    try {
        fs.writeFileSync(path, jsonString);
        console.log('JSON object successfully written to file (synchronously).');
    } catch (err) {
        console.error('Error writing file synchronously:', err);
    }
    console.log("stops kml generated!");
}

module.exports = {make_routes_json};


//Helper functions -------------------------------------------------------------------------
async function get(url) {
    const options =  { 
        method: 'GET',
        url: url,
        responseType: "arraybuffer"
    };
    const { data } = await axios(options);
    return data;
}

async function readCsv(buffer) {
    const jsonArray = csv().fromString(buffer.toString("utf-8"));
    return jsonArray;
}

async function getAndUnZip(url) {
    const zipFileBuffer = await get(url);
    const zip = new admzip(zipFileBuffer);
    const entries = zip.getEntries();
    let gtfs={};
    for(let entry of entries) {
        const buffer = entry.getData();
        let name = entry.entryName.replace('.txt','');
        gtfs[name] = await readCsv(buffer);
    }
    return gtfs;
}

function drawGeoJson(gtfs) {
    //EXAMPLE OUTPUT:
    /* {
 "type": "FeatureCollection",
 "features": [           
        { "type": "Feature", "properties": 
            { 
                "name": "Route 1", 
                "description": "Fairhaven&Downtown", 
                "strokeWeight":"2", 
                "strokeColor": "#ff0000" 
            }, "geometry": { "type": "LineString", "coordinates": [[-122.475612000001, 48.750389999986, 0.0],
    */
    let geojson = {
        "type": "FeatureCollection",
        "features": []
    };

    //Add a feature for each route
    for (route of gtfs.routes) {
        //if (route.route_id=='75') { //just for testing, limiting this to the most complex route
        
        let feature = {
            "type": "Feature",
            "properties": {
                "name": `Route ${route.route_short_name}`,
                "description": route.route_long_name,
                "strokeWeight": 2,
                "strokeColor": route.route_color ? `#${route.route_color}` : "#000000"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": []
            }
        }

        //Build an object to store this route's shapes for later use
        let routeShapes = {
            "name": route.route_short_name,
            "trips": [],
            "shapes": []
        }

        //Fill in the trips array and shapes array for the route
        for (trip of gtfs.trips) {
            if (trip.route_id===route.route_id) {
                routeShapes.trips.push(trip);
                //add the shape id to the shapes array if it is not already there, then fill its geometry from the gtfs.shapes
                if (!routeShapes.shapes.find(shape => shape.id === trip.shape_id)) {
                    routeShapes.shapes.push({
                        id: trip.shape_id,
                        geometry: []
                    });
                    //positively identify the new object in the array
                    let newShape = routeShapes.shapes.find(shape => shape.id === trip.shape_id);
                    //loop through the shapes and add them to routeShapes.shapes.geometry in order of sequence
                    for (shape of gtfs.shapes) {
                        if (shape.shape_id===trip.shape_id) {
                            newShape.geometry.push(shape);
                        }
                    }
                    //sort the shapes by sequence
                    newShape.geometry.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
                }
            }
        }

        //Sort the routeShapes.shapes such that when one shape terminates, the next shape begins. There should never be a jump from one shape to the next
        //Rules: 1) If a shape's first point is not the same as any other shape's last point, then it must be the first shape
        //2) If a shape's last point is not the same as any other shape's first point, then it must be the last shape
        //3) If a shape's last point is the same as another shape's first point, then it MAY preceed that shape
        //4) If, after initial sorting with the above 3 rules, the shapes do not form a contiguous line, retry, shuffling the middle shapes
        //We are sorting the routeShapes.shapes array. Each routeShape.shape may be addressed by its id property.
        // console.log(routeShapes.shapes);
        // console.log(`Sorting shapes for route ${route.route_id}`);
        routeShapes.shapes = sortObjectsByCoordinates(routeShapes.shapes);
        // console.log(`The result is contiguous?: ${checkContiguity(routeShapes.shapes)}`);

        //Loop through the routeShapes.shapes array and for each shape, add the shapes[shape_id].geometry[i].lat/lon, 0.0 to the
        //feature.geometry.coordinates
        for (shape of routeShapes.shapes) {
            for (point of shape.geometry) {
                feature.geometry.coordinates.push([parseFloat(point.shape_pt_lon), parseFloat(point.shape_pt_lat), 0.0]);
            }
        }
        

        //Finally, push the feature to the geojson object
        geojson.features.push(feature);
        //}
    }

    return geojson;
}

function sortObjectsByCoordinates(arr) {
    // console.log(`There are ${arr.length} patterns in the route`);
    //Make sure the array is valid
    if (!Array.isArray(arr) || arr.length === 0) {
        return [];
    }

    let sortedArray = [];
    let remainingObjects = [...arr];


    //find the first object for the output array-- this object's first lat/lon should not match any other object's last lat/lon
    //if an explicity first object is found, push it to the sortedArray and remove it from the remainingObjects array
    let firstObjectFound = false;
    for (let i=0; i < remainingObjects.length; i++) {
        const currentObj = remainingObjects[i];
        const firstCoords = {lat: currentObj.geometry[0].shape_pt_lat, lon: currentObj.geometry[0].shape_pt_lon};

        let isFirst = true;
        for (let j=0; j < remainingObjects.length; j++) {
            if (i===j) continue;
            const otherObj = remainingObjects[j];
            const lastCoordsOfOther = {lat: otherObj.geometry[otherObj.geometry.length - 1].shape_pt_lat, lon: otherObj.geometry[otherObj.geometry.length -1].shape_pt_lon};
            if (compareCoords(firstCoords, lastCoordsOfOther)) {
                isFirst = false;
                break;
            }
        }
        if (isFirst) {
            sortedArray.push(currentObj);
            remainingObjects.splice(i, 1);
            firstObjectFound = true;
            // console.log(`The first pattern begins at ${currentObj.geometry[0].shape_pt_lat}, ${currentObj.geometry[0].shape_pt_lon} and ends at ${currentObj.geometry[currentObj.geometry.length-1].shape_pt_lat}, ${currentObj.geometry[currentObj.geometry.length-1].shape_pt_lon}`);
            break;
        }
    }
    if (!firstObjectFound) {
        sortedArray.push(remainingObjects[0]);
        remainingObjects.splice(0,1);
        // console.log(`Could not find an explicit first pattern, chose the first.`);
    }

    //If no explicit first object is found, that's fine, continue by looking for an explicity last object in the array
    //If an explicit last object is found, it will need to be moved to the end of the remainingObjects array before continuing
    let lastObjectFound = false;
    for (let i=0; i<remainingObjects.length; i++) {
        const currentObj = remainingObjects[i];
        const lastCoords = {lat: currentObj.geometry[currentObj.geometry.length - 1].shape_pt_lat, lon: currentObj.geometry[currentObj.geometry.length -1].shape_pt_lon};
        
        let isLast = true;
        for (let j=0;j<remainingObjects.length;j++) {
            if (i===j) continue;
            const otherObj = remainingObjects[j];
            const firstCoordsOfOther = {lat: otherObj.geometry[0].shape_pt_lat, lon: otherObj.geometry[0].shape_pt_lon};

            if (compareCoords(lastCoords, firstCoordsOfOther)) {
                isLast = false;
                break;
            }
        }

        //Move the explicity last object to the end of the remaining objects array
        if (isLast) {
            // console.log(`The last pattern begins at ${currentObj.geometry[0].shape_pt_lat}, ${currentObj.geometry[0].shape_pt_lon} and ends at ${currentObj.geometry[currentObj.geometry.length-1].shape_pt_lat}, ${currentObj.geometry[currentObj.geometry.length-1].shape_pt_lon}`);
            
            lastObjectFound = true;
            let idx = remainingObjects.indexOf(currentObj);
            if (idx > -1) {
                const removedObj = remainingObjects.splice(idx, 1)[0];
                remainingObjects.push(removedObj);
            }
            break;
        } 
    }

    while (remainingObjects.length > 0) {
        // console.log(`There are ${remainingObjects.length} patterns left to put into the sortedArray.`);

        const lastAddedObj = sortedArray[sortedArray.length -1];
        const lastCoordsOfLastAdded = {lat: lastAddedObj.geometry[lastAddedObj.geometry.length-1].shape_pt_lat, lon: lastAddedObj.geometry[lastAddedObj.geometry.length-1].shape_pt_lon};
        let foundNext = false;

        for (let i=0;i<remainingObjects.length;i++) {
            const currentObj = remainingObjects[i];
            const firstCoordsOfCurrent = {lat: currentObj.geometry[0].shape_pt_lat, lon: currentObj.geometry[0].shape_pt_lon};

            if (compareCoords(lastCoordsOfLastAdded, firstCoordsOfCurrent)) {
                sortedArray.push(remainingObjects.splice(i, 1)[0]);
                foundNext = true;
                break;
            } 
            // else {
            //     console.log(`The pattern beginning at ${currentObj.geometry[0].shape_pt_lat}, ${currentObj.geometry[0].shape_pt_lon} and ending at ${currentObj.geometry[currentObj.geometry.length-1].shape_pt_lat}, ${currentObj.geometry[currentObj.geometry.length-1].shape_pt_lon} could not be placed.`);
            //     remainingObjects.splice(i,1);
            // }
        }
        if (!foundNext&&remainingObjects.length>0) {
            //could not place this pattern on the first go through, try again?
            //Loop through the sortedArray and see if there is a place where the remainingObject's first matches the previousLast and
                //remainingObject's last matched the nextFirst
            // console.log(`There are ${remainingObjects.length} remaining objects without a place in the sorted array`);
            for (let i=0;i<remainingObjects.length;i++) {
                const currentObj = remainingObjects[i];
                const firstCoordsOfCurrent = {lat: currentObj.geometry[0].shape_pt_lat, lon: currentObj.geometry[0].shape_pt_lon};
                const lastCoordsOfCurrent = {lat: currentObj.geometry[currentObj.geometry.length-1].shape_pt_lat, lon: currentObj.geometry[currentObj.geometry.length-1].shape_pt_lon};

                let foundASpot = false;
                for (let j=0;j<sortedArray.length-1;j++) {
                    //if the beginning point of the current object matches the ending point of the object in sortedArray[j] AND
                    //if the ending point of the current object matches the beginning point of the object in sortedArray[j+1]
                    const prior = {lat: sortedArray[j].geometry[sortedArray[j].geometry.length-1].shape_pt_lat, lon: sortedArray[j].geometry[sortedArray[j].geometry.length-1].shape_pt_lon};
                    const next = {lat: sortedArray[j+1].geometry[0].shape_pt_lat, lon: sortedArray[j+1].geometry[0].shape_pt_lon};

                    if (compareCoords(firstCoordsOfCurrent, prior) && compareCoords(lastCoordsOfCurrent, next)) {
                        //we have a match
                        // console.log(`Found a spot between ${j} and ${j+1}`);
                        sortedArray.splice(j+1,0,currentObj);
                        remainingObjects.splice(i,1);
                        foundASpot = true;
                        break;
                    }
                }
            
                if (!foundASpot) {
                    //Could not find a spot for this pattern. Dropping it.
                    // console.log(`The pattern beginning at ${currentObj.geometry[0].shape_pt_lat}, ${currentObj.geometry[0].shape_pt_lon} and ending at ${currentObj.geometry[currentObj.geometry.length-1].shape_pt_lat}, ${currentObj.geometry[currentObj.geometry.length-1].shape_pt_lon} could not be placed.`);
                    remainingObjects.splice(i,1);
                }
            }
        }
    }

    return sortedArray;
}

//Checks the given array to ensure that the chain of coordinates is contiguous. Returns true or false.
function checkContiguity(arr) {
    //Loop through the coordinates and verify contiguity.
    // console.log(`Checking contiguity on array of ${arr.length} patterns.`)
    for (let i=0; i<arr.length-1; i++) {
        let current = {lat: arr[i].geometry[arr[i].geometry.length - 1].shape_pt_lat, lon: arr[i].geometry[arr[i].geometry.length -1].shape_pt_lon};
        let next = {lat: arr[i+1].geometry[0].shape_pt_lat, lon: arr[i+1].geometry[0].shape_pt_lon};

        if (compareCoords(current, next)) {
            continue;
        } else {
            // console.log(`The ${i} pattern's last point: ${current.lat}, ${current.lon} is not equal to the ${i+1} pattern's first point: ${next.lat}, ${next.lon}`);
            // console.log(`Removing pattern number ${i} from the shapes list and rechecking contiguity.`);
            arr.splice(i,1);
            checkContiguity(arr);
            // return false;
        }
    }
    return true;
}

//Returns true if the given coordinate sets match, false if not
function compareCoords(coords1, coords2) {
    return coords1.lat === coords2.lat && coords1.lon === coords2.lon;
}