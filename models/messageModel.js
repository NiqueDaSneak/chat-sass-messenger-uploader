'use strict'

var mongoose = require('mongoose')

var messageSchema = mongoose.Schema({
  date: String,
  time: String,
  text: String,
  image: String,
  videoURL: String,
  organization: String,
  groupNames: Array,
  id: String,
  createdDate: String
})

var messageSchema = mongoose.Schema({
  date: String,
  time: String,
  text: String,
  image: String,
  videoURL: String,
  organization: String,
  groupNames: Array,
  id: String,
  createdDate: String
})

module.exports = mongoose.model('Message', messageSchema)
