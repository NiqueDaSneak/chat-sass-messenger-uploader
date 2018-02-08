'use strict'

const tedXRouter = require('express').Router()

var Message = require('../models/messageModel.js')
var Group = require('../models/groupModel.js')
var User = require('../models/userModel.js')
var Member = require('../models/memberModel.js')

var eventPostbackHandler = require('../postbacks/tedXPostbacks.js')

tedXRouter.post('/', (req, res, next) => {

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
          eventPostbackHandler(event)
          res.sendStatus(200)
        // if (event.message) {
        //   // eventMessageHandler(event)
        // } else if (event.postback) {
        // }
      })
    })
  } else {
    // console.log(req.body)
    var stripe = require("stripe")("sk_live_vCVX2baHRaQSbnF1Y5DMcQiN")
    console.log('token: ' + req.body.token)
    console.log('cost: ' + req.body.cost)
    // stripe.customers.create({
    //   email: req.body.token.email,
    //   source: req.body.token.id
    // }, function(err, customer) {
    //   if (err) {
    //     console.log(err)
    //   }
    //   console.log(customer)
    // })

    // stripe.charges.create({
    //   amount: req.body.cost,
    //   currency: "usd",
    //   source: req.body.token.id, // obtained with Stripe.js
    //   description: "Donation to TEDxCincinnati"
    // }, function(err, charge) {
    //   // asynchronously called
    //   console.log(charge)
    // })
    res.sendStatus(200)
  }
})

module.exports = tedXRouter
