'use strict'

// NPM PACKAGES
var express = require('express')
var bodyParser = require('body-parser')
var moment = require('moment')
var request = require('request')
var path = require('path')
var PAGE_ACCESS_TOKEN = 'EAAFTJz88HJUBAJqx5WkPGiIi0jPRyBXmpuN56vZB0FowKCZCzej8zpM4hKTt2ZCXqDZASqL4GUC5ywuOjakob1icM4Sfa4L3xcpsTKsjHl0QHzPylbHjJakyq1hcPNA4i8wt7XjsGZBGoUNYP7Yx2hg8RYiG9xzUoo0dzuThqGwZDZD'

// APP DEFINITIONS
var app = express()

// DATABASE SETUP
var mongoose = require('mongoose')
// mongoose.connect('mongodb://dom:Losangeleslakers47@ds123182.mlab.com:23182/chat-sass-frontend')
mongoose.connect('mongodb://domclemmer:domclemmerpasswordirrigate@ds153173-a0.mlab.com:53173,ds153173-a1.mlab.com:53173/irrigate?replicaSet=rs-ds153173', {useMongoClient: true})
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
var affirmationSchema = mongoose.Schema({
  text: String
})
var Affirmation = mongoose.model('Affirmation', affirmationSchema)

var feedbackSchema = mongoose.Schema({
  text: String
})
var Feedback = mongoose.model('Feedback', feedbackSchema)

var memberSchema = mongoose.Schema({
  organization: String,
  fbID: Number,
  fullName: String,
  timezone: Number,
  photo: String
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
  facebook: {
    userID: Number,
    pageID: Number,
    pageAccessToken: String,
    userAccessToken: String,
    refreshToken: String
  }
})

var User = mongoose.model('User', userSchema)

// MIDDLEWARE
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())

// ROUTES
app.get('/', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'jai_jai_ganesha') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge'])
  } else {
    console.error("Failed validation. Make sure the validation tokens match.")
    res.sendStatus(403)
  }
})

app.post('/', (req, res) => {
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
          // send event to appropriate app handler
        } else if (event.postback) {
          if (event.postback.payload === 'GET_STARTED_PAYLOAD') {

            function getUser() {
              return new Promise(function(resolve, reject) {
                User.findOne({
                  'facebook.pageID': event.recipient.id
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
                      uri: 'https://graph.facebook.com/v2.6/' + event.sender.id + '?access_token=' + user.facebook.accessToken,
                      method: 'GET'
                    }, function(error, response, body) {
                      if (error) {
                        return console.error('upload failed:', error)
                      }
                      var facebookProfileResponse = JSON.parse(body)
                      console.log('first: ' + facebookProfileResponse)
                      console.log('second: ' + JSON.stringify(facebookProfileResponse))

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
                        sendTextMessage(event.sender.id, user.facebook.pageAccessToken, 'Thanks for signing up. More content to come!')
                        resolve()
                      })
                    })
                  } else {
                    sendTextMessage(event.sender.id, user.facebook.pageAccessToken, 'Welcome back!')
                    resolve()
                  }
                })
              })
            }

            getUser().then((user) => {
              findMember(user)
            })

            // User.findOne({
            //   'facebook.pageID': event.recipient.id
            // }, (err, user) => {
            //   Member.findOne({
            //     fbID: event.sender.id
            //   }, (err, member) => {
            //     if (err) {
            //       console.error(err)
            //     }
            //     if (member === null) {
            //       request({
            //         uri: 'https://graph.facebook.com/v2.6/' + event.sender.id + '?access_token=' + user.facebook.accessToken,
            //         method: 'GET'
            //       }, function(error, response, body) {
            //         if (error) {
            //           return console.error('upload failed:', error)
            //         }
            //         var data = JSON.parse(body)
            //         // NEED TO FIND ORG NAME AND REPLACE BELOW
            //         var newMember = new Member({
            //           organization: user.organization,
            //           fbID: event.sender.id,
            //           fullName: data.first_name + ' ' + data.last_name,
            //           photo: data.profile_pic,
            //           timezone: data.timezone
            //         })
            //         newMember.save((err, member) => {
            //           if (err) return console.error(err)
            //         })
            //         sendTextMessage(event.sender.id, user.facebook.accessToken, 'Thanks for signing up. More content to come!')
            //       })
            //     } else {
            //       sendTextMessage(event.sender.id, user.facebook.accessToken, 'Welcome back!')
            //     }
            //   })
            // })
          } else {
            eventHandler(event)
          }
        } else {
          console.log("Webhook received unknown event: ", data)
        }
      })
    })
    res.sendStatus(200)
  } else {
    User.findOne({
      'organization': req.body.organization
    }, (err, user) => {
      if (err) {
        console.log(err)
      }

      var sendees = []
      var getSendees = new Promise(function(resolve, reject) {
        for (var i = 0; i < req.body.groupNames.length; i++) {
          Group.findOne({
            groupName: req.body.groupNames[i],
            organization: req.body.organization
          }, (err, group) => {
            if (err) {
              return console.error(err)
            } else {
              console.log(group)
              for (var i = 0; i < group.groupMembers.length; i++) {
                sendees.push(group.groupMembers[i])
              }
              resolve(sendees)
            }
          })
        }
      })

      getSendees.then((sendees) => {
            for (var i = 0; i < sendees.length; i++) {
              if (req.body.image) {
                console.log('sendee: ' + sendees[i])
                sendImage(sendees[i], user.facebook.pageAccessToken, req.body.image)
                console.log('sending image message...')
              }

              if (req.body.videoURL) {
                console.log('sending video link...')
                sendVideoMessage(sendees[i], user.facebook.pageAccessToken, req.body.videoURL)
              }

              if (req.body.text) {
                sendTextMessage(sendees[i], user.facebook.pageAccessToken, req.body.text)
                console.log('sending text message...')
                }
                res.sendStatus(200)
              }
      })
    })
  }
})

function sendTextMessage(recipientId, accessToken, textMsg) {
  var messageData = {
    "recipient": {
      "id": recipientId
    },
    "message": {
      "text": textMsg
    }
  }

  callSendAPI(accessToken, messageData)
}

function sendVideoMessage(recipientId, accessToken, videoURL) {
  var messageData = {
    "recipient": {
      "id": recipientId
    },
    "message": {
      "text": videoURL
    }
  }

  callSendAPI(accessToken, messageData)
}

function callSendAPI(accessToken, messageData) {
  request({
    "uri": 'https://graph.facebook.com/v2.6/me/messages',
    "qs": {
      "access_token": accessToken
    },
    "method": 'POST',
    "json": messageData

  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
    } else {
      console.error("Unable to send message.")
      console.error('response: ' + JSON.stringify(response))
      console.error('error: ' + JSON.stringify(error))
    }
  });
}

function sendImage(recipientId, accessToken,  url) {
  var rand = Math.floor((Math.random() * 23) + 1);

  var messageData = {
    "recipient": {
      "id": recipientId
    },
    "message": {
      "attachment": {
        "type": "image",
        "payload": {
          "url": url
        }
      }
    }
  }
  callSendAPI(accessToken, messageData)
}

// SERVER LISTENING
var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log('Server running on port ' + port)
})
app.on('error', function() {
  console.log(error)
})
