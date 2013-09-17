
/**
 * Module dependencies.
 */

// var mongoose = require('mongoose');

// controllers
var routes = require('../../app/controllers/routes');


module.exports = function (app) {

  // homepage
  app.get('/', routes.home);
};