'use strict'

// NPM PACKAGES
var express = require('express')
var bodyParser = require('body-parser')
var moment = require('moment')
var request = require('request')
var favicon = require('serve-favicon')
var path = require('path')
var PAGE_ACCESS_TOKEN = 'EAAFTJz88HJUBAJqx5WkPGiIi0jPRyBXmpuN56vZB0FowKCZCzej8zpM4hKTt2ZCXqDZASqL4GUC5ywuOjakob1icM4Sfa4L3xcpsTKsjHl0QHzPylbHjJakyq1hcPNA4i8wt7XjsGZBGoUNYP7Yx2hg8RYiG9xzUoo0dzuThqGwZDZD'

// DATABASE SETUP
var mongoose = require('mongoose')
mongoose.connect('mongodb://dom:Losangeleslakers47@ds133961.mlab.com:33961/affirmation-today')
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
var affirmationSchema = mongoose.Schema({text: String})
var Affirmation = mongoose.model('Affirmation', affirmationSchema)

var userSchema = mongoose.Schema({fbID: Number, fullName: String, photo: String, enrolled: Boolean, timezone: Number})
userSchema.virtual('firstName').get(() => {
    return this.fullName.split(' ')[0]
})
var User = mongoose.model('User', userSchema)

var feedbackSchema = mongoose.Schema({text: String})
var Feedback = mongoose.model('Feedback', feedbackSchema)

// APP DEFINITIONS
var router = express.Router()

// MIDDLEWARE
router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json())
router.use(express.static('public'))
// router.use(favicon(path.join(__dirname, 'public', 'favicon.png')))

// ROUTES
router.get('/', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'jai_jai_ganesha') {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge'])
    } else {
        console.error("Failed validation. Make sure the validation tokens match.")
        res.sendStatus(403)
    }
})


router.post('/', function(req, res) {
    var data = req.body
    // Make sure this is a page subscription
    if (data.object === 'page') {
        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function(entry) {
            var pageID = entry.id
            var timeOfEvent = entry.time
            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
                if (event.message || event.postback) {
                    eventHandler(event)
                } else {
                    console.log("Webhook received unknown event: ", data)
                }
            })
        })
        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know
        // you've successfully received the callback. Otherwise, the request
        // will time out and we will keep trying to resend.
        res.sendStatus(200)
    } else {
      console.log('from sass')
      console.log(req.body)
      res.sendStatus(200)
    }
})

// HELPER FUNCTIONS
var sendingFeedback = false
function eventHandler(event) {
  var senderID = event.sender.id
    if (event.postback) {
      var existingUser
      var postback = event.postback.payload
        switch (postback) {
            case 'GET_STARTED_PAYLOAD':
                User.findOne({fbID: senderID}, (err, user) => {
                   if (err) return console.log(err)
                   if (user === null) {
                     request({
                       uri: 'https://graph.facebook.com/v2.6/' + senderID + '?access_token=EAAFTJz88HJUBAJqx5WkPGiIi0jPRyBXmpuN56vZB0FowKCZCzej8zpM4hKTt2ZCXqDZASqL4GUC5ywuOjakob1icM4Sfa4L3xcpsTKsjHl0QHzPylbHjJakyq1hcPNA4i8wt7XjsGZBGoUNYP7Yx2hg8RYiG9xzUoo0dzuThqGwZDZD',
                       method: 'GET'
                     }, function(error, response, body) {
                       if (error) {
                         return console.error('upload failed:', error);
                       }
                       var data = JSON.parse(body)
                       var newUser = new User({fbID: senderID, fullName: data.first_name + ' ' + data.last_name, photo: data.profile_pic, enrolled: false, timezone: data.timezone})
                       newUser.save((err, user) => {
                         if (err) return console.error(err)
                       })
                       sendWelcomeMessage(senderID, 'Hello '+ data.first_name +'! Welcome to Affirmation.today! Would you like to sign up for reoccuring messages')
                     })
                   } else {
                     existingUser = true
                     sendTextMessage(senderID, 'Welcome back! Use the menu for your actions!')
                   }
                })
                break
            case 'YES_SCHEDULE_MSG':
                var msg1 = new Promise(function(resolve, reject) {
                  resolve(
                    sendTextMessage(senderID, "You've been enrolled! Look for your affirmations to start coming tomorrow! In the mean time, here is another affirmation for today!")
                  )
                })
                var msg2 = new Promise(function(resolve, reject) {
                  resolve(
                    Affirmation.find((err, affirmation) => {
                      var aff
                      if (err) return console.error(err)
                      aff = affirmation[Math.floor(Math.random() * affirmation.length) + 1].text
                      sendImage(senderID)
                      sendTextMessage(senderID, aff)
                    })
                  )
                })

                User.update({fbID: senderID}, {enrolled: true}, (err, raw) => {
                  if (err) return console.log(err)
                })

                msg1.then(() => {
                  msg2.then(() => {
                  })
                })
                break
            case 'NO_SCHEDULE_MSG':
                var msg1 = new Promise(function(resolve, reject) {
                  resolve(
                    sendTextMessage(senderID, 'That is fine! Let us know if you change your mind! In the mean time, here is the affirmation for today!')
                  )
                })
                var msg2 = new Promise(function(resolve, reject) {
                  Affirmation.find((err, affirmation) => {
                    var aff
                    if (err) return console.error(err)
                    aff = affirmation[Math.floor(Math.random() * affirmation.length)].text
                    resolve(sendTextMessage(senderID, aff))
                  })
                })
                var msg3 = new Promise(function(resolve, reject) {
                  resolve(sendImage(senderID))
                });

                msg1.then(() => {
                  msg2.then(() => {
                    msg3.then(() => {
                    })
                  })
                })
                break
            case 'SEND_AFF':
                var variations = ['A great one!', 'Powerful stuff right here...', 'This one is gold...', 'Found a good one for you...', 'Love this one...']
                var msg1 = new Promise(function(resolve, reject) {
                  resolve(
                    sendTextMessage(senderID, variations[Math.floor(Math.random() * variations.length)])
                  )
                })
                var msg2 = new Promise(function(resolve, reject) {
                  Affirmation.find((err, affirmation) => {
                    var aff
                    if (err) return console.error(err)
                    aff = affirmation[Math.floor(Math.random() * affirmation.length)].text
                    resolve(sendTextMessage(senderID, aff))
                  })
                })
                var msg3 = new Promise(function(resolve, reject) {
                  resolve(sendImage(senderID))
                })

                msg1.then(() => {
                  setTimeout(() => {
                    msg2.then(() => {
                      msg3.then(() => {
                      })
                    })
                  }, 2000)
                })
                break
            case 'CANCEL_SUB':
                User.update({fbID: senderID}, {enrolled: false}, (err, raw) => {
                  if (err) return console.log(err)
                })
                sendTextMessage(senderID, 'You have been unenrolled!')
                setTimeout(() => {
                  sendTextMessage(senderID, 'Would you mind sending us a message with some feedback, we are curious why you wanted to stop!')
                  sendTextMessage(senderID, 'We appreciate your honesty!')
                }, 2000)
                sendingFeedback = true
                break
            case 'FEEDBACK':
                sendTextMessage(senderID, "Go ahead and tap 'Send a message' and speak your mind!")
                sendingFeedback = true
                break
            default:
                console.log(postback)
        }
    }

    if (event.message) {
      if (sendingFeedback === true) {
        var newFeedback = new Feedback({text: event.message.text})
        newFeedback.save((err, feedback) => {
          if (err) return console.error(err)
        })
        sendTextMessage(senderID, 'Thanks for the feedback! We appreciate you taking the time!')
        sendingFeedback = false
      } else {
        sendTextMessage(senderID, 'Use the menu for actions you can take!')
      }
    }
}

function sendWelcomeMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": messageText,
                    "buttons": [
                        {
                            "type": "postback",
                            "title": "Yes I would",
                            "payload": "YES_SCHEDULE_MSG"
                        }, {
                            "type": "postback",
                            "title": "Not Interested",
                            "payload": "NO_SCHEDULE_MSG"
                        }
                    ]
                }
            }
        }
    }
    callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData);
}

function sendImage(recipientId) {
  var rand = Math.floor((Math.random() * 23) + 1);
  var image = "www.affirmation.today/img/affirmations/image" + rand + ".jpg"

    var messageData = {
        recipient: {
            "id": recipientId
        },
        message: {
            "attachment": {
              "type": "image",
              "payload": {
                "url": image
              }
            }
        }
    }
    callSendAPI(messageData)
}

function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: messageData

    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}

// SCHEDULER
var scheduler = require('node-schedule')

var n_america_west_coast = scheduler.scheduleJob('4 44 13 * * *', function(){
    var findUser = new Promise(function(resolve, reject) {
      console.log('Searching for users in North American West Coast')
      resolve(
        User.find({
          $and: [
            {enrolled: 'true'},
            { $or: [ {timezone: -12},{timezone: -11},{timezone: -10},{timezone: -9}, {timezone: -8}, {timezone: -7} ] }
          ]
        })
      )
    })
  var affProm = new Promise(function(resolve, reject) {
      Affirmation.find((err, affirmation) => {
        if (err) return console.error(err)
        resolve(affirmation)
       })
    })

  findUser.then((doc) => {
      var users = []
      for (var i = 0; i < doc.length; i++) {
        var userID = doc[i].fbID
        users.push(userID)
      }
      affProm.then((aff) => {
        for (var i = 0; i < users.length; i++) {
          sendImage(users[i])
          sendTextMessage(users[i], aff[Math.floor(Math.random() * aff.length)].text)
        }
      })
    })
})

var s_america_and_n_america_east_coast = scheduler.scheduleJob('4 44 8 * * *', function(){
    var findUser = new Promise(function(resolve, reject) {
      console.log('Searching for users in South America and North American East Coast')
      resolve(
        User.find({
          $and: [
            {enrolled: 'true'},
            { $or: [ {timezone: -6}, {timezone: -5}, {timezone: -4}, {timezone: -3} ] }
          ]
        })
      )
    })

    var affProm = new Promise(function(resolve, reject) {
      Affirmation.find((err, affirmation) => {
        if (err) return console.error(err)
        resolve(affirmation)
       })
    })

    findUser.then((doc) => {
      var users = []
      for (var i = 0; i < doc.length; i++) {
        var userID = doc[i].fbID
        users.push(userID)
      }
      affProm.then((aff) => {
        for (var i = 0; i < users.length; i++) {
          sendImage(users[i])
          sendTextMessage(users[i], aff[Math.floor(Math.random() * aff.length)].text)
        }
      })
    })
})

var africa_and_w_europe = scheduler.scheduleJob('4 44 3 * * *', function(){
  var findUser = new Promise(function(resolve, reject) {
      console.log('Searching for users in Africa and West Europe')
      resolve(
        User.find({
          $and: [
            {enrolled: 'true'},
            { $or: [ {timezone: 0}, {timezone: 1}, {timezone: 2}, {timezone: 3} ] }
          ]
        })
      )
    })

    var affProm = new Promise(function(resolve, reject) {
      Affirmation.find((err, affirmation) => {
        if (err) return console.error(err)
        resolve(affirmation)
       })
    })

    findUser.then((doc) => {
      var users = []
      for (var i = 0; i < doc.length; i++) {
        var userID = doc[i].fbID
        users.push(userID)
      }
      affProm.then((aff) => {
        for (var i = 0; i < users.length; i++) {
          sendImage(users[i])
          sendTextMessage(users[i], aff[Math.floor(Math.random() * aff.length)].text)
        }
      })
    })
})

var middle_east_and_e_europe = scheduler.scheduleJob('4 44 1 * * *', function(){
  var findUser = new Promise(function(resolve, reject) {
      console.log('Searching for users in Middle East & Eastern Europe')
      resolve(
        User.find({
          $and: [
            {enrolled: 'true'},
            { $or: [ {timezone: 4}, {timezone: 5}, {timezone: 6}, {timezone: 7} ] }
          ]
        })
      )
    })

    var affProm = new Promise(function(resolve, reject) {
      Affirmation.find((err, affirmation) => {
        if (err) return console.error(err)
        resolve(affirmation)
       })
    })

    findUser.then((doc) => {
      var users = []
      for (var i = 0; i < doc.length; i++) {
        var userID = doc[i].fbID
        users.push(userID)
      }
      affProm.then((aff) => {
        for (var i = 0; i < users.length; i++) {
          sendImage(users[i])
          sendTextMessage(users[i], aff[Math.floor(Math.random() * aff.length)].text)
        }
      })
    })
})

var asia_and_oceania = scheduler.scheduleJob('4 44 18 * * *', function(){
  var findUser = new Promise(function(resolve, reject) {
      console.log('Searching for users in Asia and Oceania')
      resolve(
        User.find({
          $and: [
            {enrolled: 'true'},
            { $or: [ {timezone: 8}, {timezone: 9}, {timezone: 10}, {timezone: 11}, {timezone: 12} ] }
          ]
        })
      )
    })

    var affProm = new Promise(function(resolve, reject) {
      Affirmation.find((err, affirmation) => {
        if (err) return console.error(err)
        resolve(affirmation)
       })
    })

    findUser.then((doc) => {
      var users = []
      for (var i = 0; i < doc.length; i++) {
        var userID = doc[i].fbID
        users.push(userID)
      }
      affProm.then((aff) => {
        for (var i = 0; i < users.length; i++) {
          sendImage(users[i])
          sendTextMessage(users[i], aff[Math.floor(Math.random() * aff.length)].text)
        }
      })
    })
})

module.exports = router
