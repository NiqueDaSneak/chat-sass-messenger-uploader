'use strict'

// NPM PACKAGES
var express = require('express')
var bodyParser = require('body-parser')
var moment = require('moment')
var request = require('request')
var path = require('path')

// APP DEFINITIONS
var app = express()
var nightmakersRouter = express.Router()

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
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())
// var nightmakers = require('./router/nightmakers.js')
app.use('/nightmakers', nightmakersRouter)

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

        if (event.recipient.id === '1420531884696101') {
          // send data to router and stop process here
          return res.redirect(307, '/nightmakers')
        }

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

                      if (facebookProfileResponse.gender) {
                        newMember.gender = facebookProfileResponse.gender
                      }

                      newMember.save((err, member) => {
                        if (err) return console.error(err)
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for signing up. More content to come!')
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
    res.sendStatus(200)
  } else {

    // SENDING A SCHEDULED MESSAGE
    User.findOne({
      'organization': req.body.organization
    }, (err, user) => {
      if (err) {
        console.log(err)
      }

      var sendees = []
      var getSendees = new Promise(function(resolve, reject) {
        if (req.body.groupNames[i] === undefined) {
          resolve(sendees)
        } else {
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
        }
      })

      getSendees.then((sendees) => {
        let checkSendeeLength = new Promise(function(resolve, reject) {
          if (sendees.length === 0) {
            Member.find({organization: req.body.organization}, (err, members) => {
              if (err) {
                console.log(err)
              }
              for (var i = 0; i < members.length; i++) {
                sendees.push(members[i])
              }
              resolve(sendees)
            })
          } else {
            resolve(sendees)
          }
        })

        checkSendeeLength.then((sendees) => {
          for (var i = 0; i < sendees.length; i++) {
            if (sendees[i] === 1680960081915899) {
              var sendImage = new Promise(function(resolve, reject) {
                if (req.body.image) {
                  console.log('sendee: ' + sendees[i])
                  sendImageMessage(sendees[i], user.pageAccessToken, req.body.image)
                  console.log('sending image message...')
                  resolve()
                } else {
                  resolve()
                }
              })

              var sendVideo = new Promise(function(resolve, reject) {
                if (req.body.videoURL) {
                  console.log('sending video link...')
                  sendVideoMessage(sendees[i], user.pageAccessToken, req.body.videoURL)
                  resolve()
                } else {
                  resolve()
                }
              })



              var sendText = new Promise(function(resolve, reject) {
                if (req.body.text) {
                  sendTextMessage(sendees[i], user.pageAccessToken, req.body.text)
                  console.log('sending text message...')
                  resolve()
                } else {
                  resolve()
                }
              })

              sendImage.then(() => {
                sendVideo.then(() => {
                  sendText
                })
              })
              res.sendStatus(200)
            }
          }
        })
      })
    })
  }
})

nightmakersRouter.post('/', (req, res, next) => {
  console.log('sucessfully passed to diff router')
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

                      if (facebookProfileResponse.gender) {
                        newMember.gender = facebookProfileResponse.gender
                      }

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
            switch (event.postback.payload) {
              case 'BUY_SECTION':
                console.log(event.postback.payload)
                break
              case 'BUY_BOTTLE':
                console.log(event.postback.payload)
                break
              case 'WIN_SECTION':
                console.log(event.postback.payload)
                break
              case 'EVENTS':
                console.log(event.postback.payload)
                break
              case 'BECOME_NIGHTMAKER':
                console.log(event.postback.payload)
                break
              case 'SHOP':
                console.log(event.postback.payload)
                break
              case 'MENU':
                console.log(event.postback.payload)
                break
              default:

            }
            console.log(event.postback.payload)
          }
        } else {
          console.log("Webhook received unknown event: ", data)
        }
      })
    })
  }

  res.sendStatus(200)
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

function sendImageMessage(recipientId, accessToken,  url) {
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
