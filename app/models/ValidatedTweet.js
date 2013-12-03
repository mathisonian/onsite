var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var troop = require("mongoose-troop");
var twitter = require('twitter-text')



var ValidatedTweetSchema = new Schema({
  text: { type: String},
  user: { type: Schema.Types.Mixed },
  data: { type: Schema.Types.Mixed },
  reason: { type: String },
  news: {type: mongoose.Schema.Types.ObjectId, ref: 'BreakingNews' }
});


ValidatedTweetSchema.plugin(troop.timestamp, {useVirtual: false});

ValidatedTweetSchema.virtual('text.linked').get(function () {
  return twitter.autoLink(this.text);
});

mongoose.model('ValidatedTweet', ValidatedTweetSchema);
