'use strict'

// var db = require('diskdb')
// db = db.connect('data', ['ski'])

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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'This is the welcome text.')
              setTimeout(() => {
                let messageData = {
                  "recipient":{
                    "id": event.sender.id
                  },
                  "message":{
                    "text": "This is instructional text...Choose an option:",
                    "quick_replies":[
                      {
                        "content_type":"text",
                        "title":"Learn more about BFA",
                        "payload":"LEARN"
                      },
                      {
                        "content_type":"text",
                        "title":"Application",
                        "payload":"APPLY"
                      },
                      {
                        "content_type":"text",
                        "title":"Book Now",
                        "payload":"BOOK"
                      }
                    ]
                  }
                }
                callSendAPI(user.pageAccessToken, messageData)
              }, 1000)

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

  if (event.postback) {
    if (event.postback.payload === "GET_STARTED_PAYLOAD") {
      getUser().then((user) => {
        findMember(user)
      })
    }

    if (event.postback.payload.split("_")[1] === 'LEARN') {
      getUser().then((user) => {
        if (event.postback.payload.split("_")[0] === 'WHY') {
          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "attachment":{
                "type":"template",
                "payload":{
                  "template_type":"generic",
                  "elements": [
                    {
                      "title": "Why BFA",
                      "subtitle": "Here is some suplementary copy",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.google.com',
                          "title": "Go To Site",
                          "webview_height_ratio": "tall"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        }

        if (event.postback.payload.split("_")[0] === 'OFFER') {
          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "attachment":{
                "type":"template",
                "payload":{
                  "template_type":"generic",
                  "elements": [
                    {
                      "title": "NYC College Prep program",
                      "subtitle": "Here is some suplementary copy",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.google.com',
                          "title": "Apply",
                          "webview_height_ratio": "tall"
                        },
                        {
                          "type":"web_url",
                          "url": 'https://www.google.com',
                          "title": "Learn More",
                          "webview_height_ratio": "tall"
                        }
                      ]
                    },
                    {
                      "title": "Skype College Prep program",
                      "subtitle": "Here is some suplementary copy",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.google.com',
                          "title": "Apply",
                          "webview_height_ratio": "tall"
                        },
                        {
                          "type":"web_url",
                          "url": 'https://www.google.com',
                          "title": "Learn More",
                          "webview_height_ratio": "tall"
                        }
                      ]
                    },
                    {
                      "title": "Private Coachings",
                      "subtitle": "Here is some suplementary copy",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.google.com',
                          "title": "Apply",
                          "webview_height_ratio": "tall"
                        },
                        {
                          "type":"web_url",
                          "url": 'https://www.google.com',
                          "title": "Learn More",
                          "webview_height_ratio": "tall"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        }

        if (event.postback.payload.split("_")[0] === 'WHO') {
          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "attachment":{
                "type":"template",
                "payload":{
                  "template_type":"generic",
                  "elements": [
                    {
                      "title": "Who Are We",
                      "subtitle": "Here is some suplementary copy",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.google.com',
                          "title": "Go To Site",
                          "webview_height_ratio": "tall"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        }
      })
    }
  }

  if (event.message) {
    if (event.postback.payload === 'LEARN') {
      getUser().then((user) => {
        let messageData = {
          "recipient":{
            "id": event.sender.id
          },
          "message":{
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"generic",
                "elements": [
                  {
                    "title": "Why BFA",
                    "subtitle": "Here is some suplementary copy",
                    "buttons":[
                      {
                        "type": "postback",
                        "payload": "WHY_LEARN",
                        "title":"Learn More"
                      }
                    ]
                  },
                  {
                    "title": "What Do We Offer",
                    "subtitle": "Here is some suplementary copy",
                    "buttons":[
                      {
                        "type": "postback",
                        "payload": "OFFER_LEARN",
                        "title":"Learn More"
                      }
                    ]
                  },
                  {
                    "title": "Who We Are",
                    "subtitle": "Here is some suplementary copy",
                    "buttons":[
                      {
                        "type": "postback",
                        "payload": "WHO_LEARN",
                        "title":"Learn More"
                      }
                    ]
                  },
                ]
              }
            }
          }
        }
        callSendAPI(user.pageAccessToken, messageData)
      })
    }

    if (event.postback.payload === 'APPLY') {
      getUser().then((user) => {
        let messageData = {
          "recipient":{
            "id": event.sender.id
          },
          "message":{
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"generic",
                "elements": [
                  {
                    "title": "Tap below to apply:",
                    // "subtitle": "ALSACE, FR ‘15 REISLING",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": 'https://www.google.com',
                        "title":"Apply Now",
                        "webview_height_ratio":"tall"
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
        callSendAPI(user.pageAccessToken, messageData)
      })
    }

    if (event.postback.payload === 'BOOK') {
      getUser().then((user) => {
        let messageData = {
          "recipient":{
            "id": event.sender.id
          },
          "message":{
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"generic",
                "elements": [
                  {
                    "title": "Here is a brief description of the vocal coaching. Tap below for the skype program or NYC:",
                    // "subtitle": "ALSACE, FR ‘15 REISLING",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": 'https://www.google.com',
                        "title":"Skype",
                        "webview_height_ratio":"tall"
                      },
                      {
                        "type":"web_url",
                        "url": 'https://www.google.com',
                        "title":"NYC",
                        "webview_height_ratio":"tall"
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
        callSendAPI(user.pageAccessToken, messageData)
      })
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
}
