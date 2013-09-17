var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var troop = require("mongoose-troop");


var BreakingNewsSchema = new Schema({
  text: { type: String},
  locations: [ String ]
});


BreakingNewsSchema.plugin(troop.timestamp, {useVirtual: false});

mongoose.model('BreakingNews', BreakingNewsSchema);
