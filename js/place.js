var app = angular.module("myApp",["ngAnimate"]);
app.controller('mainController',function($scope){
    $scope.google=true;
    $scope.yelp=false;
    $scope.place=true;
    $scope.favs=false;
    $scope.details=true;
    $scope.result=false;
    $scope.google=true;
    $scope.yelp=false;
    
    $scope.showResults = function() {
        $scope.place=true;
        $scope.favs=false;
        $scope.details = true;
        $scope.result=false;
    }
    
    $scope.showFavourites = function() {
        $scope.place=false;
        $scope.favs=true;
        $scope.details=true;
        $scope.result=false;
    }
    
    $scope.showDetails = function() {
        $scope.details=true;
        $scope.result=false;   
    }
    
    $scope.showTable = function() {
        $scope.details=false;
        $scope.result=true;    
    }
    
    $scope.showResultTable = function() {
        return $scope.details && $scope.place;
    }
    
    $scope.showFavorites = function() {
        return $scope.details && $scope.favs;
    }
    
    $scope.showGoogle = function() {
        $scope.google = true;
        $scope.yelp = false;
    }
    
    $scope.showYelp = function() {
        $scope.google = false;
        $scope.yelp = true;
    }
    
});

$(function() {
    'use strict';
    
    var config = {
        //url: "http://csci571travel-env.us-east-2.elasticbeanstalk.com"
        url: "http://localhost:5000"
    } 
    
    var enableSearchParams = {
        ipLoaded: false,
        keywordPresent: false,
        disLocationSelected: false,
        disLocationPresent: false
    }
    
    function ajaxRequest(url, type, data, callback) {
        $.ajax({
            url: url,
            type: type,
            data: data,
            success: function(data) {
                var response = data;
                if(typeof response === "string") {
                   response = JSON.parse(data);
                }   
                callback(response);
            },
            error: function(err) {
                $("#loader").addClass("hidden"); 
                $(".error").removeClass("hidden"); 
                //console.log(err);
            }
        })
    }
    
    function checkEmptyErr(ele, errLbl, prop) {
        if(!$(ele).val().trim()) {
            $(errLbl).removeClass("hidden");
            $(errLbl).css("display","block");
            $(ele).addClass("is-invalid");
            enableSearchParams[prop] = false;
            return true;
        }
        $(errLbl).addClass("hidden");
        $(errLbl).css("display","none");
        $(ele).removeClass("is-invalid");
        enableSearchParams[prop] = true;
        return false;
    }

    function loadAutoComplete(ele) {
        
        var autocomplete = new google.maps.places.Autocomplete($(ele)[0], {types: ['geocode']});
        
        function fillInAddress() {
            var place = autocomplete.getPlace();
            $(ele).data("lat", place.geometry.location.lat());
            $(ele).data("lng", place.geometry.location.lng());
        }
        
        if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                var geolocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                var circle = new google.maps.Circle({
                    center: geolocation,
                    radius: position.coords.accuracy
                });
                autocomplete.setBounds(circle.getBounds());
            });
        }
        autocomplete.addListener('place_changed', fillInAddress);
    } 
    
    function enableLocation(ele) {
        if($(ele).val() === "disLoc") {
            $("#disLocTxt").removeAttr("disabled");
            enableSearchParams.disLocationSelected = true;
        } else {
            $("#disLocTxt").attr("disabled", "disabled");
            $("#disLocErr").addClass("hidden");
            $("#disLocErr").css("display","none");
            $("#disLocTxt").removeClass("is-invalid");
            enableSearchParams.disLocationSelected = false;
        }
    }
    
    function enableSearch() {
        if(enableSearchParams.ipLoaded && enableSearchParams.keywordPresent) {
            if(enableSearchParams.disLocationSelected) {
                if(enableSearchParams.disLocationPresent) {
                    $("#searchBtn").removeAttr("disabled")
                } else {
                    $("#searchBtn").attr("disabled", "disabled");
                }
            }  else {
                $("#searchBtn").removeAttr("disabled")
            }
        } else {
            $("#searchBtn").attr("disabled", "disabled");
        }
    }
    
    function clear() {
        $("#keyword").val("");
        $("#keywordErr").addClass("hidden");
        $("#keyword").removeClass("is-invalid");
        
        $("#category").val("default");
        
        $("#distance").val("");
        
        $("#currLoc").prop("checked", true);
        $("#disLocTxt").val("");
        $("#disLocErr").addClass("hidden");
        $("#disLocTxt").removeClass("is-invalid");
        $("#disLocTxt").attr("disabled", "disabled");
        
        $("#placesDiv").addClass("hidden");
        $("#placesTbl tbody").empty();
        $("#pagination-control").addClass("hidden");
        
        enableSearchParams.keywordPresent = false;
        enableSearchParams.disLocationSelected = false;
        enableSearchParams.disLocationPresent = false;
        $("#searchBtn").attr("disabled", "disabled");
        $("#noRecordsDiv .warn").addClass("hidden");
        $("#detailsContainer").addClass("hidden");
        $("#detailsNav").attr("disabled", "disabled");
        $("#fav-pagination-control").addClass("hidden");
        $("#resultsTab").trigger("click");
        
        localStorage.removeItem("currPlace");
        //Add more clear
    }
    
    function showProgressBar() {
        $(".error").addClass("hidden"); 
        $(".warn").addClass("hidden"); 
        $("#placesDiv").addClass("hidden");
        $("#pagination-control").addClass("hidden");
        $("#loader").removeClass("hidden");
    } 
    
    function loadFavorites(pageSize, start) {
        var storageObj = localStorage.getItem("favourites");
        var end = start + pageSize;
        if(storageObj) {
            storageObj = JSON.parse(storageObj);    
            if(Object.keys(storageObj).length) {
                $.each(Object.keys(storageObj), function(idx, ele) {
                    if(idx > start && idx < end)
                        makeRow(storageObj[ele], false);
                });
                initializeDetails();
            } 
        }
        return end
    }
    
    function checkStorage(key) {
        var storageObj = localStorage.getItem("favourites");
        if(storageObj) {
            storageObj = JSON.parse(storageObj);    
            if(storageObj[key]) {
                return true;
            } 
        }
        return false;
    }
    
    function addToStorage(data) {
        if(!localStorage.getItem("favourites")) {
            localStorage.setItem("favourites", JSON.stringify({}));
        }
        var storageObj = JSON.parse(localStorage.getItem("favourites"));
        storageObj[data.id] = data;
        localStorage.setItem("favourites", JSON.stringify(storageObj));
    }
    
    function removeFromStorage(data) {
        var storageObj = localStorage.getItem("favourites");
        if(storageObj) {
            storageObj = JSON.parse(storageObj);    
            if(Object.keys(storageObj).length) {
                delete storageObj[data.id];
                localStorage.setItem("favourites", JSON.stringify(storageObj));
            } 
        }
    }
    
    function makeRow(data, updateStorage) {
        var rowData = ""
        rowData += "<tr class='" + data.id + "'>";
        rowData += "<th scope='row' class='nowrap row-num'>" + ($("#favoritesTbl tbody tr").length + 1) + "</th>";
        rowData += "<td class='nowrap'><img src='" + data.icon + "' class='icon'/></td>";
        rowData += "<td class='nowrap'>" + data.name + "</td>";
        rowData += "<td class='nowrap'>" + data.vicinity + "</td>";
        rowData += "<td class='nowrap'><button class='btn btn-sm btn-light deletefavourite' data-id='" + data.id + "'><i class='fa fa-trash'></i></button></td>";
        rowData += "<td class='nowrap'><span ng-click='showTable();' class='display-inline-block'><button class='btn btn-sm btn-light getDetails' data-id='" + data.id + "' data-latitude='" + data.latitude + "' data-longitude='" + data.longitude + "'><i class='fa fa-chevron-right'></i></button></span></td>";
        rowData += "</tr>";    
        var $target = $("[ng-favTableBody]");
        angular.element($target).injector().invoke(function($compile) {
            var $scope = angular.element($target).scope();
            $target.append($compile(rowData)($scope));
            $scope.$apply();
        });
        removeFavorites();
        if(updateStorage) {
            addToStorage(data);   
        }  
    }
        
    function deleteRow(data) {
        $.each($("#favoritesTbl ." + data.id).nextAll("tr").find(".row-num"), function(idx, ele) {
            $(this).text(parseInt($(this).text()) - 1)
        });
        $("#favoritesTbl ." + data.id).remove();
        if(!$("#favoritesTbl tbody tr").length && $("#favoritesTab").hasClass("active")) {
            $("#placesDiv").addClass("hidden");
            $("#noRecordsDiv .warn").removeClass("hidden");
        }
        $("#placesTbl ." + data.id).find(".favorite i").removeClass("fa-star filled-favorite").addClass("fa-star-o");
        removeFromStorage(data);
        $("#favoritesTab").trigger("click");
    }
    
    function removeFavorites() {
        $(".deletefavourite").off("click");
        $(".deletefavourite").on({
            click: function(e) {
                deleteRow($(this).data());                   
            }
        });
    }
        
    function addFavorites() {
        $(".favorite").off("click");
        $(".favorite").on({
            click: function(e) {
                var icon = $(this).find("i");
                if($(icon).hasClass("fa-star-o")) {
                    $(icon).removeClass("fa-star-o").addClass("fa-star filled-favorite");
                    makeRow($(this).data(), true);
                }
                else {
                    $(icon).removeClass("fa-star filled-favorite").addClass("fa-star-o");
                    deleteRow($(this).data());
                }                   
            }
        });
    }
    
    function isFavourite() {
        var isFav = checkStorage($("#favoritePlace").data("id"));
        if(isFav) {
            $("#favoritePlace i").removeClass("fa-star-o").addClass("fa-star filled-favorite");   
        } else {
            $("#favoritePlace i").removeClass("fa-star filled-favorite").addClass("fa-star-o");   
        }
    }
    
    function loadPlaceDetails(placeId) {
        
        function loadFavoriteForPlace(place) {
            $("#favoritePlace").data("name", place.name);
            $("#favoritePlace").data("icon", place.icon);
            $("#favoritePlace").data("vicinity", place.vicinity);
            $("#favoritePlace").data("id", place.place_id);
            $("#favoritePlace").data("latitude", place.geometry.location.lat());
            $("#favoritePlace").data("longitude", place.geometry.location.lng());
        }
        
        function initializeBackToResults() {
            $("#backToResult").off("click");
            $("#backToResult").on({
                click: function(e) {
                    //angular animation
                    $("#rightPanel").hide();
                    $("#leftPanel").show();
                }
            });
        }
        
        function loadTwitterIntent(place) {
            var placeInfo = place;
            $("#twitter").off("click");
            $("#twitter").on({
                click: function(e) {
                    var tweet = "Check out ";
                    tweet += placeInfo.name || "";
                    tweet += " located at ";
                    tweet += placeInfo.formatted_address || "";
                    tweet += ". Website: ";
                    tweet += place.website || place.url || "";
                    var url = "https://twitter.com/intent/tweet?hashtags=TravelAndEntertainmentSearch&text=" + encodeURIComponent(tweet);
                    window.open(url, "", "_blank");
                }
            })
        }
        
        function loadReviews(place) {
            
            var reviewTypes = {
                "google": "",
                "yelp": "",
                "sort": false
            }
            
            function initializeYelpReview(place) {
                var googlePlace = place; 
                
                $("#reviewTypeOptions button").off("click");
                $("#reviewTypeOptions button").on({
                    click: function(e) {
                        var type = $(this).data("type");
                        $("#reviewType").text($(this).text());
                        reviewTypes.sort = true;
                        if(!reviewTypes.yelp && type === "yelp") {
                            var location = config.url + "/get/getYelpReviews";
                            var address = googlePlace.adr_address.split(", ");
                            var data = {};
                            data["latitude"] = parseFloat(googlePlace.geometry.location.lat()) || "";
                            data["longitude"] = parseFloat(googlePlace.geometry.location.lng()) || "";
                            data["name"] = googlePlace.name || "";
                            data["city"] = $($.grep(address, function(ele) { return ele.indexOf("class=\"locality\"") > -1})[0]).text() || "";
                            data["state"] = $($.grep(address, function(ele) { return ele.indexOf("class=\"region\"") > -1})[0]).text().split(" ")[0] || ""
                            data["address1"] = $($.grep(address, function(ele) { return ele.indexOf("class=\"street-address\"") > -1})[0]).text() || ""
                            data["country"] = "US";
                            ajaxRequest(location, "GET", data, makeReviews);   
                        } else {
                            makeReviews(reviewTypes[type]);
                        }
                    }
                });
            }
            
            function orderReviews(reviews) {
                
                if(reviews) {
                    var reviewObj = reviews;
                    
                    function sortReviews(sortReviewObj, reviewType, order) {
                        return sortReviewObj.sort(function(a, b) { 
                            if(reviewType === "time_created") {
                                return ((order === "desc") ? - (moment(a[reviewType]).unix() - moment(b[reviewType]).unix()) : (moment(a[reviewType]).unix() - moment(b[reviewType]).unix()));
                            }
                            return ((order === "desc") ? - (a[reviewType] - b[reviewType]) : (a[reviewType] - b[reviewType]) );
                        });
                    }

                    $("#reviewOrderOptions button").off("click");
                    $("#reviewOrderOptions button").on({
                        click: function(e) {
                            $("#reviewOrder").text($(this).text());
                            var googleReview = $("#reviewType").text() === "Google Reviews";
                            var order = $(this).data("order");
                            $("#reviewOrder").data("current-order", order);
                            var sortReviewObj = $.extend([], reviewObj);
                            switch(parseInt(order)) {
                                case 2:
                                    makeReviews(sortReviews(sortReviewObj, "rating", "desc"));
                                    break;
                                case 3:
                                    makeReviews(sortReviews(sortReviewObj, "rating", "asc"));
                                    break;
                                case 4:
                                    makeReviews(sortReviews(sortReviewObj, googleReview ? "time" : "time_created", "desc"));
                                    break;
                                case 5:
                                    makeReviews(sortReviews(sortReviewObj, googleReview ? "time" : "time_created", "asc"));
                                    break;
                                default : 
                                    makeReviews(googleReview ? reviewTypes.google : reviewTypes.yelp);
                                    break;
                                
                            }
                        }
                    });
                }
            }

//            function applyAngularScope(key, value) {
//                var appElement = $('[ng-app=myApp]')[0];
//                var $scope = angular.element(appElement).scope();
//                $scope.$apply(function() {
//                    $scope[key] = value;
//                });
//            }
            
            function makeReviews(reviews) {
                $("#noReviews .warnReviews").addClass("hidden");
                $(".review").addClass("old");
                if(reviews && reviews.length) {
                    var divs = ""
                    $.each(reviews, function(idx, review) {
                        divs += "<div class='review margin-bottom-1 padding-1 padding-top-1 padding-bottom-2 display-flex full-width'>";
                        divs += "<div class='row'>";
                        divs += "<div class='col-lg-1 col-md-3 col-sm-3 width-75'>";
                        var photo_url = review.profile_photo_url || (review.user ? review.user.image_url : "");
                        var author_url = review.author_url || review.url;
                        if(photo_url) {
                            divs += "<a href='" + author_url + "' target='_blank' class='font-13'><img src='" + photo_url + "' class='profile_photo image-fluid rounded-circle' /></a>";
                        }
                        divs += "</div>";
                        divs += "</div>"
                        divs += "<div class='row padding-left-2'>";
                        divs += "<div class='col-lg-11 col-md-9 col-sm-9'>"
                        divs += "<div>"
                        var author_name = review.author_name || (review.user ? review.user.name : "");
                        if(author_url) {
                            divs += author_name ? "<a href='" + author_url + "' target='_blank' class='font-13'>" + author_name + "</a>" : "";   
                        } else {
                            divs += author_name ? "<span class='text-link font-13'>" +  author_name + "</span>" : "";
                        }
                        divs += "</div>"
                        divs += "<div>";
                        divs += review.rating ? "<span class='stars no-padding-left' data-ratings='" + review.rating + "'>" + review.rating + "</span>" : "";
                        var time = review.time ? moment.unix(review.time).format("YYYY-MM-DD HH:mm:ss") : review.time_created;
                        divs += time ? "<span class='grey-color font-13' data-time='" + time + "'>" + time + "</span>" : "";   
                        divs += "</div>"
                        divs += "<div>"
                        divs += review.text ? "<span class='font-13'>" + review.text + "</span>" : "";
                        divs += "</div>";
                        divs += "</div>";
                        divs += "</div>";
                        divs += "</div>";
                    });
                    var usedContainer = $("#reviewType").text().split(" ")[0].toLowerCase();
                    var hideContainer = usedContainer === "google" ? "yelp" : "google";
                    if(usedContainer === "yelp") {
                        reviewTypes[usedContainer] = reviews;
                    }
                    $("#" + usedContainer + "ReviewContainer").append(divs);   
                    $.each($('.stars'), function(idx, ele) {
                        $(ele).rateYo({
                            rating: $(ele).data("ratings"),
                            ratedFill: "#E74C3C",
                            starWidth: '12px',
                            readOnly: true, 
                            maxValue: Math.ceil(parseFloat($(ele).data("ratings"))),
                            numStars: Math.ceil(parseFloat($(ele).data("ratings")))
                        });
                    });
                    $(".old").remove();
                } else {
                   //Show no records
                    $("#" + usedContainer + "ReviewContainer").empty();
                    $("#noReviews .warnReviews").removeClass("hidden");
                }
                orderReviews(reviews); 
                if(reviewTypes.sort) {
                    reviewTypes.sort = false;
                    $("#reviewOrderOptions button[data-order='" + $("#reviewOrder").data("current-order") + "']").trigger("click");
                }
            }
            
            function initializeReviewValues() {
                $("#reviewType").text("Google Reviews");
                $("#reviewOrder").text("Default Order");
                reviewTypes.google = place.reviews;   
                makeReviews(place.reviews, "google");
                initializeYelpReview(place);
            }
            
            initializeReviewValues();
        }
        
        function loadPhotos(photos) {
            $(".column").empty();
            if(photos && photos.length) {
                $("#noPhotos .warnPhotos").addClass("hidden");
                $.each(photos, function(idx, ele) {
                    var img = "<a href='" + ele.getUrl({ 'maxWidth': ele.width }) + "' target='_blank'><img src='" + ele.getUrl({ 'maxWidth': ele.width }) + "' class='full-width img-thumbnail'></img></a>"
                    $(".placePhotos[data-id='" + ((idx % 4) + 1) + "']").append(img);
                });   
            } else {
                $("#noPhotos .warnPhotos").removeClass("hidden");
            }
        }
        
        function loadMaps(name, address, location) {
            
            function mapLocation() {
                
                var directionsService = new google.maps.DirectionsService();
                var directionsDisplay = new google.maps.DirectionsRenderer();
                var destinationLocation = null;
                var markers = [];
                var locationSet = false;
                
                function displayMap(mapArea, displayType) {
                    var lat = parseFloat($("#toAddress").data("lat"));
                    var lon = parseFloat($("#toAddress").data("lng"));
                    var loc = {lat: lat, lng: lon};
                    var map = new google.maps.Map($(mapArea)[0], {
                      zoom: 15,
                      center: loc
                    });
                    if(displayType === "streetView") {
                        var panorama = new google.maps.StreetViewPanorama(
                        $(mapArea)[0], {
                            position: loc,
                            pov: {
                              heading: 34,
                              pitch: 10
                            }
                        });    
                        map.setStreetView(panorama);
                    } else {
                        var marker = new google.maps.Marker({
                          position: loc,
                          map: map
                        });
                        markers.push(marker);
                        directionsDisplay.setMap(map);
                    }
                    if(locationSet) {
                        calcRoute();
                    }
                    return loc;
                }
                
                function showMap(displayType) {
                    $("#mapContainer").html("");
                    directionsDisplay.set('directions', null);
                    destinationLocation = displayMap($("#mapContainer"), displayType);
                    $("#mapContainer").css("zIndex", 10);
                }
                
                function calcRoute() {
                    var startLocation =  ($("#fromAddress").val().toLowerCase() === "your location" ||  $("#fromAddress").val().toLowerCase() === "my location") ? { lat: parseFloat($("#currLatitude").val()), lng: parseFloat($("#currLongitude").val()) } : $("#fromAddress").val();
                    var start = startLocation;
                    var end = { lat: parseFloat($("#toAddress").data("lat")), lng: parseFloat($("#toAddress").data("lng")) };
                    var request = {
                        origin: start,
                        destination: end,
                        travelMode: $("#travelMode").val(),
                        provideRouteAlternatives: true
                    };
                    directionsService.route(request, function(result, status) {
                        if (status === 'OK') {
                            for (var i = 0; i < markers.length; i++) {
                              markers[i].setMap(null);
                            }
                          directionsDisplay.setDirections(result);
                        }
                    });
                    if(!locationSet) {
                        locationSet = true;
                        directionsDisplay.setPanel($('#directionsPanel')[0]);
                    }
                }
                
                function loadMapEvents() {
                    $("#mapView").off("click");
                    $("#mapView").on({
                        click: function(e) {
                            $("#mapView").addClass("hidden");
                            $("#streetView").removeClass("hidden");
                            showMap("");
                        } 
                    });
                    
                    $("#streetView").off("click");
                    $("#streetView").on({
                        click: function(e) {
                            $("#streetView").addClass("hidden");
                            $("#mapView").removeClass("hidden");
                            showMap("streetView");
                        } 
                    });
                    
                    $("#directionButton").off("click");
                    $("#directionButton").on({
                        click: function(e) {
                            calcRoute();
                        } 
                    });
                    
                    $("#mapView").trigger("click");
                    $("#travelMode").val("DRIVING");
                    $("#directionsPanel").html("");
                }
                
                loadMapEvents();
            }
            
            function loadFromCoordinates(isCurrentLocation) {
                var lat = parseFloat($("#currLatitude").val());
                var lng = parseFloat($("#currLongitude").val());
                if(!isCurrentLocation) {
                    lat = $("#fromAddress").data("lat");
                    lng = $("#fromAddress").data("lng");
                }
                
                $("#fromAddress").data("lat", lat);
                $("#fromAddress").data("lng", lng);
            }
            
            function initializeFromLocation() {
                $("#fromAddress").off("keyup blur");
                $("#fromAddress").on({
                    keyup: function(e) {
                        if($(this).val()) {
                            $("#directionButton").removeAttr("disabled");
                        } else {
                            $("#directionButton").attr("disabled", "disabled");
                        }
                    },
                    blur: function(e) {
                        if($(this).val().toLowerCase() === "my location") {
                            loadFromCoordinates(true);
                        } else {
                            loadFromCoordinates(false);
                        }
                    }
                });
                
            }
            
            function initializeToLocation() {
                $("#toAddress").val(name + ", " + address);
                $("#toAddress").data("lat", location.lat());
                $("#toAddress").data("lng", location.lng());    
            }
            
            initializeToLocation();
            initializeFromLocation();
            var isCurrLocation = false;
            if($("input[name='location']:checked").val() === "currLoc") {
                $("#fromAddress").val("Your location");
                isCurrLocation = true;
            } else {
                $("#fromAddress").val($("#disLocTxt").val());
                isCurrLocation = false;
            }
            $("#directionButton").removeAttr("disabled");
            loadFromCoordinates(isCurrLocation);
            mapLocation();
        }
        
        function loadPlaceSummary(place) {
            
            function loadHours(hours, utc_offset) {
                function buildDailyHoursTable(arr, currDay) {
                    $("#dailyHoursTbl tbody").empty();
                    var last = 0;
                    $.each(arr, function(idx, ele) {
                        last = idx;
                        if(ele.split(": ")[0] === currDay) {
                            return false;
                        }
                    });
                    var copyArr = $.extend([], arr);
                    var newArr = copyArr.splice(0, last);
                    copyArr = copyArr.concat(newArr); 
                    var rows = "";
                    $.each(copyArr, function(idx, ele) {
                        rows += "<tr>";
                        rows += "<td>" + (idx === 0 ? "<b>" : "") + ele.split(": ")[0] + (idx === 0 ? "</b>" : "") + "</td>";
                        rows += "<td>" + (idx === 0 ? "<b>" : "") + ele.split(": ")[1] + (idx === 0 ? "</b>" : "") + "</td>";
                        rows += "</tr>";
                    });
                    $("#dailyHoursTbl tbody").append(rows);
                }

                var arr = hours.weekday_text;
                var offsetHours = hours.open_now ? 0 : (place.utc_offset/60) - (moment().utcOffset()/60);
                var currDay = moment().add(offsetHours, 'h').format("dddd");
                var cell = "<td>"
                if(hours.open_now) {
                    var todayHours = $.grep(arr, function(ele) {
                        return ele.split(": ")[0] === currDay;
                    });
                    cell += "<span class='margin-right-1'>Open now: " + todayHours[0].split(": ")[1] + "</span>";
                } else {
                    cell += "<span class='margin-right-1'>Closed</span>"
                }
                cell += "<span><a href='' data-toggle='modal' data-target='#dailyHoursModal'>Daily open hours</a></span>"
                cell += "</td>";
                buildDailyHoursTable(arr, currDay);
                return cell;
            }
        
            function makeRow(key, value, isLink, isPrice, isRating, isHours, utc_offset) {
                var row = "";
                if(value) {
                    row = "<tr>";
                    row += "<td class='nowrap'><b>" + key + "</b></td>";
                    if(isLink) {
                        row += "<td class='nowrap'><a href='" + value + "' target='_blank'>" + value + "</a></td>";
                    } else if (isPrice) {
                        var amount = "";
                        for (var i=0; i< parseInt(value); i++) {
                            amount += "$";
                        }
                        row += "<td class='nowrap'>" + amount + "</td>";
                    } else if (isRating) { 
                        row += "<td class='nowrap'><span>" + value + "</span><div id='stars'>" + value + "</div></td>"
                    } else if (isHours) { 
                        row += loadHours(value, utc_offset);
                    } else {
                        row += "<td class='nowrap'>" + value + "</td>";   
                    }
                    row += "</tr>"
                }
                return row;
            }
            
            $("#placeName").text(place.name);
            var rows = "";
            rows += makeRow("Address", place.formatted_address, false, false, false, false);
            rows += makeRow("Phone Number", place.international_phone_number, false, false, false, false);
            rows += makeRow("Price Level", place.price_level, false, true, false, false);
            rows += makeRow("Rating", place.rating, false, false, true, false);
            rows += makeRow("Google Page", place.url, true, false, false, false);
            rows += makeRow("Website", place.website, true, false, false, false);
            rows += makeRow("Hours", place.opening_hours, false, false, false, true, place.utc_offset);
            
            $("#placeInfoTbl").append(rows);
            $('#stars').rateYo({
                rating: place.rating,
                ratedFill: "#E74C3C",
                starWidth: '12px',
                readOnly: true,
                maxValue: Math.ceil(parseFloat(place.rating)),
                numStars: Math.ceil(parseFloat(place.rating))
            });
        }
        
        function loadPlaceInfo(place, status) {
            $("#placeInfoTbl tbody").empty();
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                loadPlaceSummary(place);
                loadPhotos(place.photos);
                loadMaps(place.name, place.formatted_address, place.geometry.location);
                loadReviews(place);
                loadTwitterIntent(place);
                initializeBackToResults();
                addFavorites();
                $("#twitter").removeAttr("disabled");
                $("#favoritePlace").removeAttr("disabled");
                loadFavoriteForPlace(place);
                isFavourite();
            }
        }
            
        //Add angular animation
        $("#leftPanel").hide();       
        $("#rightPanel").show();
        //change above this to angular animation
        
        var request = {
          placeId: placeId
        };

        $('.nav-tabs a:first').tab('show') 
        var service = new google.maps.places.PlacesService($("#mapData")[0]);
        service.getDetails(request, loadPlaceInfo);
    }
    
    function showDetails() {
        
        function initializeDetailsNav() {
            $("#detailsNav").off("click");
            $("#detailsNav").on({
                click: function(e) {
                    //add angular animation
                    $("#leftPanel").hide();
                    $("#rightPanel").show();
                    isFavourite();
                }
            });
        }
        
        if(localStorage.getItem("currPlace") !== "") {
            $("#detailsNav").removeAttr("disabled", "disabled");
            initializeDetailsNav();
        }
    }
    
    function initializeDetails() {
        $(".getDetails").off("click");
        $(".getDetails").on({
            click: function() {
                $("#placesTbl .table-warning").removeClass("table-warning");
                $("#favoritesTbl .table-warning").removeClass("table-warning");
                $("#placesTbl tbody tr." + $(this).data("id")).addClass("table-warning");
                $("#favoritesTbl tbody tr." + $(this).data("id")).addClass("table-warning");
                var placeId = $(this).data("id");
                $("#detailsContainer").removeClass("hidden");
                localStorage.setItem("currPlace", placeId);
                loadPlaceDetails(placeId);   
                showDetails();
                angular.element($("#mainContainer")[0]).scope().showGoogle();
            }
        });
    }
    
    function handleFavouritePagination() {
        var currStart = -1;
        var nextStart = 0;
        
        function handleNextPage(currStart) {
            var pageSize = 21;
            var favLength = Object.keys(JSON.parse(localStorage.getItem("favourites"))).length;
            var nextStart = loadFavorites(pageSize, currStart) - 1;
            currStart > -1 ? $("#favPrevious").removeClass("hidden") : $("#favPrevious").addClass("hidden");
            if(favLength <= currStart + pageSize) {
                nextStart = favLength;
                $("#favNext").addClass("hidden")
            } else {
                $("#favNext").removeClass("hidden")
            }
            return nextStart;
        }
        
        function handlePreviousPage(currStart) {
            var pageSize = 21;
            var favLength = Object.keys(JSON.parse(localStorage.getItem("favourites"))).length;
            var nextStart = loadFavorites(pageSize, (currStart-pageSize<pageSize) ? -1 : currStart-pageSize-1);
            if(favLength <= nextStart - pageSize - 1) {
                nextStart = favLength;
                $("#favNext").addClass("hidden")
            } else {
                $("#favNext").removeClass("hidden")
            }
            nextStart-pageSize-1 > -1 ? $("#favPrevious").removeClass("hidden") : $("#favPrevious").addClass("hidden"); 
            return nextStart-1;
        }
        
        function addHighlight() {
            var currPlace = localStorage.getItem("currPlace");
            if(currPlace) {
                $("#favoritesTbl tbody tr").removeClass("table-warning");
                $("#favoritesTbl tbody tr." + currPlace).addClass("table-warning");
            } else {
                $("#favoritesTbl tbody tr").removeClass("table-warning");
            }
        }
        
        $("#favNext").off("click");
        $("#favNext").on({
            click: function(e) {
                $("#favoritesTbl tbody").empty();
                currStart = handleNextPage(currStart);
                addHighlight();
            }
         });
        
        $("#favPrevious").off("click");
        $("#favPrevious").on({
            click: function(e) {
                $("#favoritesTbl tbody").empty();
                currStart = handlePreviousPage(currStart);
                addHighlight();
            }
         });
        
        $("#favoritesTbl tbody").empty();
        currStart = handleNextPage(currStart);
    }
    
    function handleFavorites() {
        
        var leftPanelLoaded = true;
        
        function showResultContainer() {
            $("#noRecordsDiv .warn").addClass("hidden");
            $("#favoritesTbl").addClass("hidden");
            //angular check
            $("#rightPanel").hide();
            $("#leftPanel").show();  
            if(!$("#placesTbl tbody tr").length) {
                $("#placesDiv").addClass("hidden");
                $("#tableNavDiv").addClass("hidden");
                $("#pagination-control").addClass("hidden");
            } else {
                $("#pagination-control").removeClass("hidden");
                $("#placesDiv").removeClass("hidden"); 
                $("#placesTbl").removeClass("hidden");   
            }
            $("#placesTbl").removeClass("hidden");
            $("#favoritesTbl").addClass("hidden");
            $("#fav-pagination-control").addClass("hidden");
        }
        
        function showFavoriteContainer() {
            handleFavouritePagination();
            $("#pagination-control").addClass("hidden");
            $("#placesTbl").addClass("hidden");
            //angular check
            leftPanelLoaded = $("#leftPanel").hasClass("hidden");
            if(!leftPanelLoaded) {
                $("#rightPanel").hide();   
            }
            $("#leftPanel").show();
            $("#placesDiv").removeClass("hidden");
            $("#tableNavDiv").removeClass("hidden");
            if($("#favoritesTbl tbody tr").length) {
                $("#favoritesTbl").removeClass("hidden"); 
            } else {
                $("#placesDiv").addClass("hidden");
                $("#noRecordsDiv .warn").removeClass("hidden");
            }
            var currPlace = localStorage.getItem("currPlace");
            if(currPlace) {
                $("#favoritesTbl tbody tr").removeClass("table-warning");
                $("#favoritesTbl tbody tr." + currPlace).addClass("table-warning");
            } else {
                $("#favoritesTbl tbody tr").removeClass("table-warning");
            }
            $("#placesTbl").addClass("hidden");
            $("#favoritesTbl").removeClass("hidden");
            $("#fav-pagination-control").removeClass("hidden");
        }
        
        $("#resultsTab").off("click");
        $("#resultsTab").on({
            click: function(e) {
                $("#favoritesTab").removeClass("active");
                $(this).addClass("active");
                showResultContainer();
            }
        });
        
        $("#favoritesTab").off("click");
        $("#favoritesTab").on({
            click: function(e) {
                $("#resultsTab").removeClass("active");
                $(this).addClass("active");
                showFavoriteContainer();
            }
        });
    }
    
    function searchPlaces() {
        
        var navObj = {
            pageNo: 0,
            currPage: 0,
            next_token: undefined
        }

        function fetchNextPlaces(token) {
            var location = config.url + "/get/getNextPlaces";
            var data = {};
            data["token"] = token;
            ajaxRequest(location, "GET", data, loadResults);
        } 
        
        function showNavButtons() {
            if(navObj.currPage < 3 || navObj.next_token) {
                $("#next").removeClass("hidden");
            }
            if(navObj.currPage === navObj.pageNo && !navObj.next_token) {
                $("#next").addClass("hidden");
            }
            if(navObj.currPage > 1) {
                $("#previous").removeClass("hidden");
            }
            if(navObj.currPage === 1) {
                $("#previous").addClass("hidden");
            }
        }
        
        function initializeNavigation() {
 
            $("#next").off('click');
            $("#next").on({
                click: function(e) {  
                    if(navObj.pageNo < 3 && navObj.next_token && navObj.pageNo === navObj.currPage) {
                        showProgressBar();
                        fetchNextPlaces(navObj.next_token);
                    } else { 
                        $(".page-" + (navObj.currPage)).addClass("hidden");
                        ++navObj.currPage;
                        $(".page-" + (navObj.currPage)).removeClass("hidden");
                        showNavButtons();
                    }
                }
            });
            
            $("#previous").off('click');
            $("#previous").on({
                click: function(e) {  
                    $(".page-" + (navObj.currPage)).addClass("hidden");
                    --navObj.currPage;
                    $(".page-" + (navObj.currPage)).removeClass("hidden");
                    showNavButtons();
                }
            });
        }
        
        function loadResults(response) {
          
            function createRecords(details, page) {
                var rowData = "";
                $.each(details, function(idx, row) {
                    rowData += "<tr class='page-" + page + " " + row.place_id + "'>";
                    rowData += "<th scope='row' class='nowrap'>" + (idx+1) + "</th>";
                    rowData += "<td class='nowrap'><img src='" + row.icon + "' class='icon'/></td>";
                    rowData += "<td class='nowrap'>" + row.name + "</td>";
                    rowData += "<td class='nowrap'>" + row.vicinity + "</td>";
                    var isFav = checkStorage(row.place_id) ? "fa fa-star filled-favorite" : "fa fa-star-o";
                    rowData += "<td class='nowrap'><button class='btn btn-sm btn-light favorite' data-name='" + row.name + "' data-icon='" + row.icon + "' data-vicinity='" + row.vicinity + "' data-id='" + row.place_id + "' data-latitude='" + row.geometry.location.lat + "' data-longitude='" + row.geometry.location.lng + "'><i class='" + isFav + "'></i></button></td>";
                    rowData += "<td class='nowrap'><span ng-click='showTable();' class='display-inline-block'><button class='btn btn-sm btn-light getDetails' data-id='" + row.place_id + "' data-latitude='" + row.geometry.location.lat + "' data-longitude='" + row.geometry.location.lng + "'><i class='fa fa-chevron-right'></i></button></span></td>";
                    rowData += "</tr>";
                });
                
                var $target = $("[ng-placesTableBody]");
                angular.element($target).injector().invoke(function($compile) {
                    var $scope = angular.element($target).scope();
                    $target.append($compile(rowData)($scope));
                    $scope.$apply();
                }); 
            }
            
            function showPlacesContainer() {                 
                if($("#placesTbl tbody tr").length) {
                    $(".warn").addClass("hidden"); 
                    $(".error").addClass("hidden"); 
                    $("#pagination-control").removeClass("hidden");
                    $("#next").removeClass("hidden");
                    $("#tableNavDiv").removeClass("hidden");
                    $("#loader").addClass("hidden");
                    $("#placesDiv").removeClass("hidden");
                    $("#leftPanel").show();       
                    $("#rightPanel").hide();
                    $("#placesTbl").removeClass("hidden");
                    initializeNavigation();
                    initializeDetails();
                    addFavorites();
                } else {
                    $("#loader").addClass("hidden");
                    $("#placesDiv").removeClass("hidden");
                    $("#tableNavDiv").addClass("hidden"); 
                    $(".warn").removeClass("hidden"); 
                }
                $("#twitter").attr("disabled", "disabled");
                $("#favoritePlace").attr("disabled", "disabled");
                $("#detailsNav").attr("disabled", "disabled");
                $("#resultsTab").addClass("active");
                $("#favoritesTab").removeClass("active");
                $("#placesTbl").removeClass("hidden");
                $("#favoritesTbl").addClass("hidden");
            }
            
            if(response.results) {
                if(response.next_page_token) {
                    navObj.next_token = response.next_page_token;
                } else {
                    navObj.next_token = undefined;
                }                
                $(".page-" + (navObj.currPage)).addClass("hidden");
                createRecords(response.results, ++navObj.pageNo);
                ++navObj.currPage;
                showPlacesContainer();
                showNavButtons();
            }
            
        }
        
        var data = {};
        data["keyword"] = $("#keyword").val();
        data["category"] = $("#category").val();        
        data["distance"] = $("#distance").val();
        data["locationType"] = $("input[name='location']:checked").val();
        data["latitude"] = $("#currLatitude").val();
        data["longitude"] = $("#currLongitude").val();
        data["disLocation"] = $("#disLocTxt").val();
        
        var location = config.url + "/get/getPlaces";
        showProgressBar();
        $("#leftPanel").hide();
        $("#rightPanel").hide();
        ajaxRequest(location, "GET", data, loadResults);
    }
    
    function addEventHandlersForForm() {  
        var autocomplete = new google.maps.places.Autocomplete($("#disLocTxt")[0], {types: ['geocode']});
        
        $("#keyword").off("blur keyup");
        $("#keyword").on({
            blur: function(e) {
                var isEmpty = checkEmptyErr(this, $("#keywordErr"), "keywordPresent");
                enableSearch();
            },
            keyup: function(e) {
                var isEmpty = checkEmptyErr(this, $("#keywordErr"), "keywordPresent");
                enableSearch();
            }
        });
        
        loadAutoComplete($("#disLocTxt"));
        loadAutoComplete($("#fromAddress"));
        $("#disLocTxt").off("blur keyup focus");
        $("#disLocTxt").on({
            blur: function(e) {
                var isEmpty = checkEmptyErr(this, $("#disLocErr"), "disLocationPresent"); 
                enableSearch();
            },
            keyup: function(e) {
                var isEmpty = checkEmptyErr(this, $("#disLocErr"), "disLocationPresent");
                enableSearch();
            },
            focus: function(e) {
            }
        });
        
        $("input[type='radio'][name='location']").off("change");
        $("input[type='radio'][name='location']").on({
            change: function(e) {
                enableLocation(this);
                enableSearch();
            }
        });
        
        $("#clearBtn").off("click");
        $("#clearBtn").on({
            click: function(e) {
                clear();
            }
        });
        
        $("#searchBtn").off("click");
        $("#searchBtn").on({
            click: function(e) {
                searchPlaces();
                $("#placesTbl tbody").empty();
                localStorage.removeItem("currPlace");
            }
        });
        
    }
    
    function loadCategories() {
        var arr= ['Default', 'Airport', 'Amusement Park', 'Aquarium', 'Art Gallery', 'Bakery', 'Bar', 'Beauty Salon', 'Bowling Alley', 'Bus Station', 'Cafe', 'Campground', 'Car Rental', 'Casino', 'Lodging', 'Movie Theater', 'Museum', 'Night Club', 'Park', 'Parking', 'Restaurant', 'Shopping Mall', 'Stadium', 'Subway Station', 'Taxi Stand', 'Train Station', 'Transit Station', 'Travel Agency', 'Zoo'];
        var optionStr = "";
        $.each(arr, function(idx, category) {
            optionStr += "<option value='" + category.replace(/\s/g,"_").toLowerCase() + "'>" + category + "</option>";
        });
        $("#category").append(optionStr);
    }
    
    function loadIPAddress() {
        function loadIPData(coords) {
            $("#currLatitude").val(coords.lat);
            $("#currLongitude").val(coords.lon);
            enableSearchParams.ipLoaded = true;
            enableSearch();
        }
        
        var url = "http://ip-api.com/json";
        ajaxRequest(url, "GET", {}, loadIPData);
    }
    
    function initializePage() {
        localStorage.removeItem("currPlace");
        addEventHandlersForForm();
        loadCategories();  
        loadIPAddress();
        handleFavorites();
    }
    
    initializePage();
    
});