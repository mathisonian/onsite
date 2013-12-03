var alchemy_api_url = "http://access.alchemyapi.com",
    geocoder = require('geocoder'),
    twitter = require('ntwitter'),
    request = require('request'),
    twitter_text = require('twitter-text'),
    news_api_url = "http://api.usatoday.com/open",
    qs = require('querystring'),
    async = require('async'),
    mongoose = require('mongoose');

var ValidatedTweet = mongoose.model("ValidatedTweet"),
    BreakingNews = mongoose.model("BreakingNews");

var intersect_safe = function(a, b) {
  var ai=0, bi=0;
  var result = new Array();

  while( ai < a.length && bi < b.length ) {
    var left = a[ai].toLowerCase();
    var right = b[bi].toLowerCase();
    if      (left < right ){ ai++; }
    else if (left > right ){ bi++; }
    else {
      result.push(left);
      ai++;
      bi++;
     }
  }

  return result;
}


var encodeGoogleViewport = function(viewport) {
  var southwest = viewport.southwest;
  var northeast = viewport.northeast;
  return southwest.lng + "," + southwest.lat + "," + northeast.lng + "," + northeast.lat;
}

var entity_types = ["StateOrCounty", "City", "State", "County", "Facility", "Organization"];
entity_types.sort();

var reputable_set = require('./sources').organizations;
reputable_set.sort();

var keyword_set = require('./sources').keywords;
keyword_set.sort();

var current_tweet_id = "";
var current_breaking_news = null;
var reason = "";
var currentStream = false;

Onsite = function(index, twitter_connection_obj, alchemy_api_key, io) {

  console.log(twitter_connection_obj);

  var twit = new twitter(twitter_connection_obj);

  var tweet_filter = function(tweet_data) {
    if (tweet_data.in_reply_to_status_id) {
      return false;
    }
    var follower_threshold = 5000;
    if(typeof tweet_data.user === "undefined") {
      return false;
    }
    var followers_count = tweet_data.user.followers_count;
    var mentions = twitter_text.extractMentions(tweet_data.user.description).sort();
    var intersect = intersect_safe(reputable_set, mentions);
    var passes_test = (intersect.length > 0) || (intersect_safe(reputable_set, [tweet_data.user.screen_name]).length > 0);

    if (passes_test) {
      console.log("----------description-mention---------");
      console.log(tweet_data.user.screen_name);
      console.log(intersect);
      if (intersect.length > 0) {
        reason = "Tweet chosen because user description contains " + JSON.stringify(intersect);
      } else {
        reason = "Tweet chosen because username is " + tweet_data.user.screen_name;
      }
      return true;
    }

    if(tweet_data.user.description) {
      var key_intersect = intersect_safe(keyword_set, tweet_data.user.description.split(" "));
      if(key_intersect.length > 0) {
        console.log("---------description-keywords---------");

        reason = "Tweet chosen because user description contains: " + JSON.stringify(key_intersect);
        return true;
      }
    }

    if (followers_count > follower_threshold) {
      console.log("---------follower---------");
      reason = "Tweet chosen because user has " + followers_count + " followers";
      return true;
    }
    return false;
  }


  var analyze_article = function(text, callback) {
    var params = {text: text, apikey: alchemy_api_key, outputMode: "json"};
    var url = alchemy_api_url + "/calls/text/TextGetRankedNamedEntities?" + qs.stringify(params);
    console.log("analyzing tweet: " + text);
    var location_entites = [];
    request({url: url, json: true}, function (error, response, body) {
      if (!error && response.statusCode == 200) {

        for (i in body.entities) {
          var entity = body.entities[i];
          console.log("Entity: ", entity.type, entity.text, entity.relevance);

          if(intersect_safe(entity_types, [entity.type]).length > 0 && entity.relevance > 0.1) {
            console.log('intersects');
            location_entites.push(entity.text);

            console.log('here')
          } else {
            console.log('no intersect')
          }
        }
        if(location_entites.length > 0) {
          console.log("CREATING OBJECT");
          var breakingNews = new BreakingNews({text: text, locations: location_entites});
          breakingNews.save();
          console.log(breakingNews);
          io.sockets.emit('breaking_news', {news: breakingNews});
          current_breaking_news = breakingNews;
          callback(location_entites);
        } else {
          if(!current_breaking_news) {
            console.log('here')
            BreakingNews.findOne({}, {}, { sort: { 'created' : -1 } }, function(err, news) {
              current_breaking_news = news;
              if(current_breaking_news)
                callback(current_breaking_news.locations);
            });
          } else {
            callback(current_breaking_news.locations);
          }

        }
      } else {
        console.log(response.statusCode);
      }
    });

  };

  var watch_locations = function(array_of_locations) {
    console.log("Watch Locations: ", array_of_locations);
    if(array_of_locations.length == 0) { return; }

    async.map(array_of_locations, location_iterator, function(err, results){
      if(currentStream) { currentStream.destroy(); }
      twit.stream('statuses/filter', {'locations':results}, function(stream) {
        currentStream = stream;

        stream.on('data', function (data) {
          console.log('data');
          // console.log(data);
          if(tweet_filter(data)) {
            console.log('yoyoyo');
            var validatedTweet = new ValidatedTweet({text: data.text, user: data.user, reason: reason, data: data, news: current_breaking_news});
            validatedTweet.save();
            io.sockets.emit('tweet', { tweet: validatedTweet });
            console.log(data.text + "\t" + data.user.followers_count);
          }
        });

        stream.on('end', function (response) {
          // Handle a disconnection
          console.log('stream ended');
        });

        stream.on('destroy', function (response) {
          // Handle a 'silent' disconnection from Twitter, no end/error event fired
          console.log('stream destroyed');
        });

        stream.on('error', function (err, code) {
          console.log('stream error :: ', err, code);
        });

      });
    });
  }

  var location_iterator = function(item, callback) {
    geocoder.geocode(item, function(err, data) {
      var results = data.results;
      var best_result = results[0];
      var bounding_box;
      if(best_result.geometry.bounds) {
        bounding_box = best_result.geometry.bounds;
      } else {
        bounding_box = best_result.geometry.viewport;
      }
      callback(err, encodeGoogleViewport(bounding_box));
    })
  }


  var get_breaking_news = function(callback) {
    console.log("checking for new breaking news");
    var params = {screen_name: "BreakingNews", include_rts: true}
    twit.getUserTimeline(params, function(err, json) {
      if(err) {
        console.log(err);
        return;
      }
      var most_recent_tweet = json[index];
      if(most_recent_tweet.id !== current_tweet_id) {
        current_tweet_id = most_recent_tweet.id;
        callback(most_recent_tweet.text, watch_locations);
      } else {
        console.log("nothing new detected");
      }
    });
  };


  get_breaking_news(analyze_article);

  setInterval(function() {
    get_breaking_news(analyze_article);
  }, 60000)

};

module.exports = Onsite;
