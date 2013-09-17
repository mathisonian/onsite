/*
 * TODO seperate this logic into multiple files
 */

 var mongoose = require("mongoose");
 var ValidatedTweet = mongoose.model("ValidatedTweet");
 var BreakingNews = mongoose.model("BreakingNews");

exports.home = function(req, res) {

    BreakingNews.find().sort('-created').limit(1).exect(function(err, news) {

      console.log( news );
      if(err) {
        res.send(500);
      }
      if (news.length > 0) {
        news = news[0]
      } else {
        news = null;
      }
      if(news) {
        ValidatedTweet.find({news: news._id}).sort('-created').limit(1).exec(function(err, tweets) {
            if(err) {
                res.send(500);
            }
            var coords = null;
            for (var i in tweets) {
              if(tweets[i].data.coordinates) {
                coords = tweets[i].data.coordinates.coordinates;
                break;
              }
            };

            res.render('index', {
              title: 'Onsite',
              description: "Cool Things and Stuff",
              author: '@mathisonian',
              news: news,
              tweets: tweets,
              coordinates: coords
            });
        })
      }
    });
};
