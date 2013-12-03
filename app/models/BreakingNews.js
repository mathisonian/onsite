var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var troop = require("mongoose-troop");
var twitter = require('twitter-text');


var BreakingNewsSchema = new Schema({
  text: { type: String},
  locations: [ String ]
});


BreakingNewsSchema.plugin(troop.timestamp, {useVirtual: false});


BreakingNewsSchema.virtual('text.linked').get(function () {
  return twitter.autoLink(this.text);
});


mongoose.model('BreakingNews', BreakingNewsSchema);
