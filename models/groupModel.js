'use strict'

var mongoose = require('mongoose')

var groupSchema = mongoose.Schema({
  groupName: String,
  groupMembers: Array,
  organization: String
})

module.exports = mongoose.model('Group', groupSchema)
