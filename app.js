'use strict'

// NPM PACKAGES
var express = require('express')
var bodyParser = require('body-parser')
var moment = require('moment')
var request = require('request')
var path = require('path')

// APP DEFINITIONS
var app = express()
var affirmationTodayRouter = express.Router()

// DATABASE SETUP
var mongoose = require('mongoose')
mongoose.connect('mongodb://domclemmer:domclemmerpasswordirrigate@ds153173-a0.mlab.com:53173,ds153173-a1.mlab.com:53173/irrigate?replicaSet=rs-ds153173', {useMongoClient: true})
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
var affirmationSchema = mongoose.Schema({
  text: String
})

var Message = require('./models/messageModel.js')
var Group = require('./models/groupModel.js')
var User = require('./models/userModel.js')
var Member = require('./models/memberModel.js')

// MIDDLEWARE
app.use('/static', express.static('images'))
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())
app.use('/affirmation-today', affirmationTodayRouter)

var jtvRouter = require('./router/jtvrouter.js')
app.use('/jtv-router', jtvRouter)


const irrigateRouter = require('./router/irrigateRouter.js')
app.use('/irrigate', irrigateRouter)

var skiRouter = require('./router/skiRouter.js')
app.use('/skinsee', skiRouter)

var autoRouter = require('./router/autoRouter.js')
app.use('/autorouter', autoRouter)

var uncRouter = require('./router/uncRouter.js')
app.use('/uncrouter', uncRouter)

var tedxRouter = require('./router/tedXRouter.js')
app.use('/tedxrouter', tedxRouter)

var utahSkisRouter = require('./router/utahSkisRouter.js')
app.use('/utahskisrouter', utahSkisRouter)

app.use('/data', express.static(path.join(__dirname, 'data')))


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

        if (event.recipient.id === '394937770929069') {
          return res.redirect(307, '/skinsee')
        }

        if (event.recipient.id === '307853062976814') {
          return res.redirect(307, '/affirmation-today')
        }

        if (event.recipient.id === '530374163974187') {
          return res.redirect(307, '/irrigate')
        }

        if (event.recipient.id === '747006388826316') {
          return res.redirect(307, '/jtv-router')
        }

        if (event.recipient.id === '119839342156941') {
          return res.redirect(307, '/autorouter')
        }

        if (event.recipient.id === '1996388557245811') {
          return res.redirect(307, '/uncrouter')
        }

        if (event.recipient.id === '218246194915265') {
          return res.redirect(307, '/tedxrouter')
        }

        // if (event.recipient.id === '176271182985693') {
        //   return res.redirect(307, '/utahskisrouter')
        // }

        if (event.recipient.id === '133941773298279' || '176271182985693') {
          return res.redirect(307, '/utahskisrouter')
        }
https://www.irrigatemsg.com/save-page?access_token=EAAFTJz88HJUBAKFZBkkunZA5SYy4Jfp0x28BeFDqwV3pONLiKD7NOCOHWRa3PGtKBdAmLs9jic1HZBr1E4hqUv2WBCrDVFk8pLEonMKKBhqPHQ42o5rC4syMNm1CtPatVedgUZAuKegOYZBDZBwFYjrlGATiYZCcukJtEkWNWSiBQZDZD&pageid=133941773298279&userid=2017575261589128&org=UtahSkis


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
              if (event.recipient.id === '311591712359140') {
                console.log('RailHouse got a message')
              } else {
                sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for your message! We will get back to you shortly.')
              }
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
                        timezone: facebookProfileResponse.timezone,
                        createdDate: moment().format('MM-DD-YYYY')
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
    console.log('sending message')
    // SENDING A SCHEDULED MESSAGE
    User.findOne({
      'organization': req.body.organization
    }, (err, user) => {
      if (err) {
        console.log(err)
      }

      var sendees = []
      var getSendees = new Promise(function(resolve, reject) {
        if (req.body.groupNames) {
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
        } else {
          resolve(sendees)
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
                sendees.push(members[i].fbID)
              }
              resolve(sendees)
            })
          } else {
            resolve(sendees)
          }
        })

        checkSendeeLength.then((sendees) => {
          for (var i = 0; i < sendees.length; i++) {
            var sendImage = new Promise(function(resolve, reject) {
              if (req.body.image) {
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
        })
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
  })
}

function sendImageMessage(recipientId, accessToken,  url) {

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

function sendVideoMessage(recipientId, accessToken, url) {

  var messageData = {
    "recipient": {
      "id": recipientId
    },
    "message": {
      "attachment": {
        "type": "video",
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
