/**
 * Module dependencies.
 */

var express = require('express'),
    env = process.env.NODE_ENV || 'development',
    config = require('./config/config')[env],
    mongoose = require('mongoose'),
    fs = require('fs');

var alchemy_api_key = process.env.ALCHEMY_API_KEY;

// require('express-namespace');

mongoose.connect(config.db);
// mongooseTypes.loadTypes(mongoose);
// Bootstrap models
fs.readdirSync(__dirname + '/app/models').forEach(function (file) {
  if (~file.indexOf('.js')) require(__dirname + '/app/models/' + file);
});


var app = express();

// Bootstrap application settings
require('./config/express')(app, config);

// Bootstrap routes
require('./config/routes')(app);

// Start the app by listening on <port>
var port = process.env.PORT || 8000;

var server = require('http').Server(app);
var io = require('socket.io').listen(server);
server.listen(port);
console.log('Express app started on port '+port);

// Expose app
module.exports = app;


require('./onsite')(0, {consumer_key: process.env.TWITTER_CONSUMER_KEY,
                        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
                        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
                        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET }, alchemy_api_key, io);
