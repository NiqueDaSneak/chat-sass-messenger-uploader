'use strict'

const jtvRouter = require('express').Router()

var Message = require('../models/messageModel.js')
var Group = require('../models/groupModel.js')
var User = require('../models/userModel.js')
var Member = require('../models/memberModel.js')

var eventPostbackHandler = require('../postbacks/jtvPostbacks.js')

jtvRouter.post('/', (req, res, next) => {

  var data = req.body
  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    console.log('data.entry: ' + JSON.stringify(data.entry))
    data.entry.forEach(function(entry) {
      var pageID = entry.id
      var timeOfEvent = entry.time
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          // eventMessageHandler(event)
        } else if (event.postback) {
          eventPostbackHandler(event)
          res.sendStatus(200)
        }
      })
    })
  }
})

module.exports = jtvRouter
