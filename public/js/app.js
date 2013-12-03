$(function() {
    var socket = io.connect('/');

    socket.on('breaking_news', function (data) {
        console.log('breaking : ', data);
        var news = data.news;
        document.title = news.text;

        $('.news-content').text(news.text);
        $('.location-content').text(news.locations);
    });



    var map = new GMaps({
      div: '#map-canvas',
      lat: map_location[1],
      lng: map_location[0],
      zoom: 14
    });
    var marker = map.addMarker({
      lat: map_location[1],
      lng: map_location[0],
      title: 'tweet',
      infoWindow: {
          content: $('.tweet').first().html()
        }
    });
    marker.infoWindow.open(map, marker);

    socket.on('tweet', function (data) {
        var validatedTweet = data.tweet;
        document.title = "@"+ validatedTweet.user.screen_name + " :: "+ validatedTweet.text;

        if(validatedTweet.data.coordinates) {
            var coords = new google.maps.LatLng(validatedTweet.data.coordinates.coordinates[1], validatedTweet.data.coordinates.coordinates[0]);
            map.panTo(coords);
        }

        var template = _.template($("#tweet-template").html());
        var html = template({img: validatedTweet.user.profile_image_url,
                                   text: validatedTweet.text,
                                   screen_name: validatedTweet.user.screen_name,
                                   name: validatedTweet.user.name,
                                   reason: validatedTweet.reason});


        $('.tweets').prepend(html);

        map.removeMarkers();
        var marker = map.addMarker({
          lat: map_location[1],
          lng: map_location[0],
          title: 'tweet',
          infoWindow: {
              content: html
            }
        });
        marker.infoWindow.open(map, marker);

    });

    function codeAddress() {
        var geocoder = new google.maps.Geocoder(),
            address = $('.location-content').text();

        geocoder.geocode( { 'address': address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.panTo(results[0].geometry.location);
            }
        });
    }
});
