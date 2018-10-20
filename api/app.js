'use strict'

var express = require('express');
var bodyParser = require('body-parser');
var axios = require('axios');
var Promise = require('promise');
var yelp = require('yelp-fusion');

var app = express();
var milesToMeter = 1609.34;

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();   
});


function makeCall(url, response, resolve, reject) {
    axios.get(url)
    .then(result => {
        if(response) {
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify(result.data));   
        } else if(resolve) {
            return resolve(JSON.stringify(result.data));
        }
    })
    .catch(error => {
        console.log(error);
        if(reject) {
            reject(error);
        }
    });
}

app.get('/', function(request, response, next) {
  response.send('Sorry nothing here.');
});

app.get('/get/getPlaces', function(request, response) {
    var keyword = request.query.keyword;
    var category = request.query.category;
    var distance = (request.query.distance ? request.query.distance : 10) * milesToMeter;
    var latitude = request.query.latitude;
    var longitude = request.query.longitude;
    var locationType = request.query.locationType;
    var disLocation = request.query.disLocation;
    
    var params = {
        "keyword": keyword,
        "category": category,
        "distance": distance,
        "latitude": latitude,
        "longitude": longitude
    }
    
    function getCoords(result) {
        if(result.length) {
            return {
                "latitude": result[0].geometry.location.lat,
                "longitude": result[0].geometry.location.lng
            };
        }
        return null;
    }
    
    function getPlacesData(params) {
        var nearbyPlacesApiUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + params.latitude + "," + params.longitude + "&radius=" + params.distance + "&type=" + encodeURIComponent(params.category) + "&keyword=" + encodeURIComponent(params.keyword) + "&key=AIzaSyAciIxtBTSVZpfX-0TDDeNG7Om_7OCCOGA";  

        makeCall(nearbyPlacesApiUrl, response);
    }
    
    if(disLocation && locationType === "disLoc") {
        var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(disLocation);
        url += "&key=API_KEY";
        var promise = new Promise(function(resolve, reject) { 
            makeCall(url, null, resolve, reject);
        });
        promise.then(function(result) {
            var data = JSON.parse(result);
            var coords = getCoords(data.results);
            if(coords) {
                params.latitude = coords.latitude;
                params.longitude = coords.longitude;
                getPlacesData(params);
            } else {
                response.send(JSON.stringify({}));
            }
        });
    } else {
        getPlacesData(params);
    }
    
});

app.get("/get/getPlaceDetails", function(request, response) {
    var placeId = request.query.place_id;
    var url = "https://maps.googleapis.com/maps/api/place/details/json?placeid=" + placeId + "&key=API_KEY";
    
    makeCall(url, response);
});

app.get("/get/getNextPlaces", function(request, response) {
    var token = request.query.token;
    var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=" + token + "&key=API_KEY";
    
    makeCall(url, response);
});

app.get("/get/getYelpReviews", function(request, response) {
    
    const apiKey = 'API_KEY';

    const client = yelp.client(apiKey);
    
    client.businessMatch("best", request.query).then(res => {
        const match = res.jsonBody.businesses[0];
        if(match) {
            const placeLat = parseFloat(match.coordinates.latitude).toFixed(2);
            const placeLon = parseFloat(match.coordinates.longitude).toFixed(2);
            const requestLat = parseFloat(request.query.latitude).toFixed(2);
            const requestLon = parseFloat(request.query.longitude).toFixed(2);
            if(placeLat === requestLat && placeLon === requestLon) {
                client.reviews(match.id).then(res => {
                    response.send(res.jsonBody.reviews);
                })   
            } else {
                response.send(JSON.stringify([]));    
            }  
        } else {
            response.send(JSON.stringify([]));    
        }
    });
});

app.listen(app.get('port'), function() {
  console.log("Node app is running on port:" + app.get('port'))
});
