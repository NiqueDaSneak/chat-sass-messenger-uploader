'use strict'

// NPM PACKAGES
var express = require('express')
var bodyParser = require('body-parser')
var moment = require('moment')
var request = require('request')
var path = require('path')
var router = express.Router()

// DATABASE SETUP
var mongoose = require('mongoose')
mongoose.connect('mongodb://domclemmer:domclemmerpasswordirrigate@ds153173-a0.mlab.com:53173,ds153173-a1.mlab.com:53173/irrigate?replicaSet=rs-ds153173', {useMongoClient: true})
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
var affirmationSchema = mongoose.Schema({
  text: String
})

var memberSchema = mongoose.Schema({
  organization: String,
  fbID: Number,
  fullName: String,
  timezone: Number,
  photo: String,
  gender: String
})
memberSchema.virtual('firstName').get(() => {
  return this.fullName.split(' ')[0]
})
var Member = mongoose.model('Member', memberSchema)

var groupSchema = mongoose.Schema({
  groupName: String,
  groupMembers: Array,
  organization: String
})
var Group = mongoose.model('Group', groupSchema)

var userSchema = mongoose.Schema({
  email: String,
  organization: String,
  onboarded: Boolean,
  username: String,
  userID: Number,
  pageID: Number,
  pageAccessToken: String,
  userAccessToken: String,
})

var User = mongoose.model('User', userSchema)

// MIDDLEWARE
router.use(bodyParser.urlencoded({
  extended: false
}))
router.use(bodyParser.json())

router.post('/', (req, res, next) => {
  console.log('nightmakers Router received')
  var data = req.body
  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    // console.log('data.entry: ' + JSON.stringify(data.entry))
    data.entry.forEach(function(entry) {
      var pageID = entry.id
      var timeOfEvent = entry.time
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {

          function getUser() {
            return new Promise(function(resolve, reject) {
              User.findOne({
                'pageID': event.recipient.id
              }, (err, user) => {
                resolve(user)
              })
            })
          }

          getUser().then((user) => {
            if (user.messageResponse) {
              // send it to event.sender.id as a text message
            } else {
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for your message! We will get back to you shortly.')
            }
          })

        } else if (event.postback) {

          if (event.postback.payload === 'GET_STARTED_PAYLOAD') {

            // ENROLLING MEMBERS INTO THE IRRIGATE APP
            function getUser() {
              return new Promise(function(resolve, reject) {
                User.findOne({
                  'pageID': event.recipient.id
                }, (err, user) => {
                  resolve(user)
                })
              })
            }

            function findMember(user) {
              return new Promise(function(resolve, reject) {
                Member.findOne({
                  fbID: event.sender.id
                }, (err, member) => {
                  if (err) {
                    console.error(err)
                  }
                  if (member === null) {
                    request({
                      uri: 'https://graph.facebook.com/v2.6/' + event.sender.id + '?access_token=' + user.pageAccessToken,
                      method: 'GET'
                    }, function(error, response, body) {
                      if (error) {
                        return console.error('upload failed:', error)
                      }
                      var facebookProfileResponse = JSON.parse(body)

                      // NEED TO FIND ORG NAME AND REPLACE BELOW
                      var newMember = new Member({
                        organization: user.organization,
                        fbID: event.sender.id,
                        fullName: facebookProfileResponse.first_name + ' ' + facebookProfileResponse.last_name,
                        photo: facebookProfileResponse.profile_pic,
                        timezone: facebookProfileResponse.timezone
                      })

                      newMember.save((err, member) => {
                        if (err) return console.error(err)
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for signing up with the Nightmakers. More content to come!')
                        resolve()
                      })
                    })
                  } else {
                    sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome back!')
                    resolve()
                  }
                })
              })
            }

            getUser().then((user) => {
              findMember(user)
            })
          } else {
            eventHandler(event)
          }
        } else {
          console.log("Webhook received unknown event: ", data)
        }
      })
    })
  }

  res.sendStatus(200)
})

module.exports = router
