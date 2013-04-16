/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    tasks = require("./tasks"),
    mongoose = require('mongoose'),
    Twit = require('twit');


var topTrending = "";
var stream = null;
// Get yo' models
// var User = require("./models/user.js"),

var app = express();
var server = require('http').createServer(app);


var T = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_KEY,
  access_token_secret: process.env.ACCESS_SECRET
});



// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

var port;
app.configure('development', function(){
  port = 3000;
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  mongoose.connect('mongodb://localhost/<app_name>');
});

app.configure('production', function(){
  port = 80;
  app.use(express.errorHandler());
  // TODO:
  // add production database connection string
  // mongoose.connect('mongodb://localhost/<app_name>');
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('opened');
});


server.listen(port, function(){
});


app.get('/', routes.home);


/*
 * Run background tasks here:
 */

// Run immediately

var getTrends = function() {
  T.get('trends/place', {"id": 1},  function (err, reply) {
    console.log(i);
    if(err) {
      console.log(err);
    } else {
      if(topTrending !== reply[0]['trends'][0]['query']) {
        topTrending = reply[0]['trends'][0]['name'];
        stream = T.stream('statuses/filter', {'track': topTrending});
        console.log(topTrending);
        stream.on('tweet', function (tweet) {
          console.log(tweet);
        });
      }
    }
  });
};

getTrends();

var i=0;
// Periodically get top trending topic
setInterval(getTrends, 1000 * 61 * 5);
