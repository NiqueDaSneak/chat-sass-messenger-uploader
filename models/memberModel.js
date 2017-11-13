
'use strict'

var mongoose = require('mongoose')

var memberSchema = mongoose.Schema({
  organization: String,
  fbID: Number,
  fullName: String,
  timezone: Number,
  photo: String,
  gender: String,
  createdDate: Date
})
memberSchema.virtual('firstName').get(() => {
  return this.fullName.split(' ')[0]
})

module.exports = mongoose.model('Member', memberSchema)
