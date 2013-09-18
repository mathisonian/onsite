$(function() {
    var socket = io.connect('/');
    socket.on('breaking_news', function (data) {
        var news = data.news;
        $('.news-content').text(news.text);
        $('.location-content').text(news.locations);
    });
    socket.on('tweet', function (data) {
        var validatedTweet = data.tweet;
        if(validatedTweet.data.coordinates) {
            var coords = new google.maps.LatLng(validatedTweet.data.coordinates.coordinates[1], validatedTweet.data.coordinates.coordinates[0]);
            map.panTo(coords);
        }

        var template = _.template($("#tweet-template").html());
        $(".tweet-container").fadeOut(function() {
            $(this).html(template({img: validatedTweet.user.profile_image_url, 
                                   text: validatedTweet.text, 
                                   screen_name: validatedTweet.user.screen_name,
                                   reason: validatedTweet.reason}))
                    .fadeIn();
        });

    });
    
    var center;
    if(map_location.length == 2) {
        center = new google.maps.LatLng(map_location[1], map_location[0]);
    } else {
          codeAddress();
    }
    var mapOptions = {
      center: center,
      zoom: 14,
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map-canvas"),
        mapOptions);



      function codeAddress() {
      var geocoder = new google.maps.Geocoder();;
        var address = $('.location-content').text();
        geocoder.geocode( { 'address': address}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            map.panTo(results[0].geometry.location);
          }
        });
      }


});
