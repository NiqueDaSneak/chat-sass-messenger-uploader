'use strict'

var mongoose = require('mongoose')

var userSchema = mongoose.Schema({
  email: String,
  organization: String,
  onboarded: Boolean,
  username: String,
  userID: String,
  pageID: String,
  pageAccessToken: String,
  userAccessToken: String,
  stripeID: String,
})

module.exports = mongoose.model('users', userSchema)
