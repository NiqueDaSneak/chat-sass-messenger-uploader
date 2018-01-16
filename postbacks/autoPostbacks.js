'use strict'

// var db = require('../data/jtvData.js')
var db = require('diskdb')
db = db.connect('data', ['users'])

var Message = require('../models/messageModel.js')
var Group = require('../models/groupModel.js')
var User = require('../models/userModel.js')
var Member = require('../models/memberModel.js')

var request = require('request')
var moment = require('moment')

module.exports = (event) => {

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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome to the Lexus Auto Group Messenger Experience.')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, "Here you can: browse inventory, schedule a service appointment, and value your trade-in.")
              }, 3000)
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, "At any point you can tap on the menu to start over.")
              }, 8000)
              setTimeout(() => {
                let messageData = {
                  "recipient":{
                    "id": event.sender.id
                  },
                  "message":{
                    "text": "Choose an action:",
                    "quick_replies":[
                      {
                        "content_type":"text",
                        "title":"Inventory Search",
                        "payload":"SEARCH"
                      },
                      {
                        "content_type":"text",
                        "title":"Schedule Service",
                        "payload":"SCHEDULE"
                      },
                      {
                        "content_type":"text",
                        "title":"Value Trade-In",
                        "payload":"TRADE"
                      }
                    ]
                  }
                }
                callSendAPI(user.pageAccessToken, messageData)
              }, 16000)
              resolve()
            })
          })
        } else {
          sendTextMessage(event.sender.id, user.pageAccessToken, "Welcome back!")
          resolve()
        }
      })
    })
  }

  if (event.message) {
    console.log(event.message.text.length)
    if (event.message.text) {
      getUser().then((user) => {
        if (event.message.text.length === 17) {
          sendTextMessage(event.sender.id, user.pageAccessToken, "VIN number recieved")
          setTimeout(() => {
            sendTextMessage(event.sender.id, user.pageAccessToken, "Vehicle Information: 2008 Lexus IS 250, BLCK, 72,367 miles, manual 6-Spd, RWD, located in 45202.")
          }, 4000)
          setTimeout(() => {
            let messageData = {
              "recipient":{
                "id": event.sender.id
              },
              "message":{
                "text": "What condition is it in?",
                "quick_replies":[
                  {
                    "content_type":"text",
                    "title":"Excellent",
                    "payload":"SEND_VALUE"
                  },
                  {
                    "content_type":"text",
                    "title":"Very Good",
                    "payload":"SEND_VALUE"
                  },
                  {
                    "content_type":"text",
                    "title":"Good",
                    "payload":"SEND_VALUE"
                  },
                  {
                    "content_type":"text",
                    "title":"Fair",
                    "payload":"SEND_VALUE"
                  }
                ]
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
          }, 8000)
        }
      })
    }

    if (event.message.quick_reply) {
      if (event.message.quick_reply.payload === "SEARCH") {}

      if (event.message.quick_reply.payload === "SCHEDULE") {
        getUser().then((user) => {
          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "text": "What would you like to schedule for your 2008 IS 250?",
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Oil Change",
                  "payload":"UPSELL_ASK"
                },
                {
                  "content_type":"text",
                  "title":"Alignment",
                  "payload":"UPSELL_ASK"
                },
                {
                  "content_type":"text",
                  "title":"Battery Service",
                  "payload":"UPSELL_ASK"
                },
                {
                  "content_type":"text",
                  "title":"Brakes",
                  "payload":"UPSELL_ASK"
                },
                {
                  "content_type":"text",
                  "title":"Other Concern",
                  "payload":"UPSELL_ASK"
                }
              ]
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        })
      }

      if (event.message.quick_reply.payload.split("_")[0] === "UPSELL") {
        if (event.message.quick_reply.payload.split("_")[1] === "ASK") {
          getUser().then((user) => {
            let messageData = {
              "recipient":{
                "id": event.sender.id
              },
              "message":{
                "text": "With your car at 72,367 miles, we strongly suggest a 70,000 Mile Service. Would you like to schedule that today?",
                "quick_replies":[
                  {
                    "content_type":"text",
                    "title":"Yes",
                    "payload":"UPSELL_YES"
                  },
                  {
                    "content_type":"text",
                    "title":"No",
                    "payload":"UPSELL_NO"
                  }
                ]
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
          })
        }

        if (event.message.quick_reply.payload.split("_")[1] === "YES") {
          getUser().then((user) => {
            sendTextMessage(event.sender.id, user.pageAccessToken, "Smart choice. I will add that to your appointment.")
            setTimeout(() => {
              let messageData = {
                "recipient":{
                  "id": event.sender.id
                },
                "message":{
                  "text": "Choose a date and time for your appointment:",
                  "quick_replies":[
                    {
                      "content_type":"text",
                      "title":"2/1 @ 3pm",
                      "payload":"CONFIRM_APPT"
                    },
                    {
                      "content_type":"text",
                      "title":"2/1 @ 5pm",
                      "payload":"CONFIRM_APPT"
                    },
                    {
                      "content_type":"text",
                      "title":"2/3 @ 11am",
                      "payload":"CONFIRM_APPT"
                    },
                    {
                      "content_type":"text",
                      "title":"2/3 @ 12pm",
                      "payload":"CONFIRM_APPT"
                    },
                    {
                      "content_type":"text",
                      "title":"2/4 @ 10am",
                      "payload":"CONFIRM_APPT"
                    },
                    {
                      "content_type":"text",
                      "title":"2/4 @ 9am",
                      "payload":"CONFIRM_APPT"
                    }
                  ]
                }
              }
              callSendAPI(user.pageAccessToken, messageData)
            }, 3000)
          })
        }

        if (event.message.quick_reply.payload.split("_")[1] === "NO") {
          getUser().then((user) => {
            sendTextMessage(event.sender.id, user.pageAccessToken, "No problem. Let us know if you change your mind.")
            setTimeout(() => {
              let messageData = {
                "recipient":{
                  "id": event.sender.id
                },
                "message":{
                  "text": "Choose a date and time for your appointment:",
                  "quick_replies":[
                    {
                      "content_type":"text",
                      "title":"2/1 @ 3pm",
                      "payload":"CONFIRM_APPT"
                    },
                    {
                      "content_type":"text",
                      "title":"2/1 @ 5pm",
                      "payload":"CONFIRM_APPT"
                    },
                    {
                      "content_type":"text",
                      "title":"2/3 @ 11am",
                      "payload":"CONFIRM_APPT"
                    },
                    {
                      "content_type":"text",
                      "title":"2/3 @ 12pm",
                      "payload":"CONFIRM_APPT"
                    },
                    {
                      "content_type":"text",
                      "title":"2/4 @ 10am",
                      "payload":"CONFIRM_APPT"
                    },
                    {
                      "content_type":"text",
                      "title":"2/4 @ 9am",
                      "payload":"CONFIRM_APPT"
                    }
                  ]
                }
              }
              callSendAPI(user.pageAccessToken, messageData)
            }, 3000)
          })
        }
      }

      if (event.message.quick_reply.payload === "CONFIRM_APPT") {
        getUser().then((user) => {
          sendTextMessage(event.sender.id, user.pageAccessToken, "Awesome! I have that available. John will be your service advisor. Your appointment time is confirmed.")
          setTimeout(() => {
            sendTextMessage(event.sender.id, user.pageAccessToken, "See you then!")
          }, 4000)
        })
      }


      if (event.message.quick_reply.payload === "TRADE") {
        getUser().then((user) => {
          sendTextMessage(event.sender.id, user.pageAccessToken, "Awesome! Let's see how much your vehicle is worth.")
          setTimeout(() => {
            sendTextMessage(event.sender.id, user.pageAccessToken, "All you have to do is send us a message with your VIN number and I can get started.")
          }, 4000)
        })
      }

      if (event.message.quick_reply.payload === "SEND_VALUE") {
        getUser().then((user) => {
          sendTextMessage(event.sender.id, user.pageAccessToken, "We should say something about the image here")
          sendImageMessage(event.sender.id, user.pageAccessToken, 'https://www.skinsee.com/resources/images/mapRates3-all.jpg')
        })
      }
    }
  }

  if (event.postback) {
    if (event.postback.payload === "GET_STARTED_PAYLOAD") {

      // ENROLLING MEMBERS INTO THE IRRIGATE APP
      getUser().then((user) => {
        findMember(user)
      })
    }

    if (event.postback.payload === "TRADE") {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, "Awesome! Let's see how much your vehicle is worth.")
        setTimeout(() => {
          sendTextMessage(event.sender.id, user.pageAccessToken, "All you have to do is send us a message with your VIN number and I can get started.")
        }, 4000)
      })
    }

  }
}

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