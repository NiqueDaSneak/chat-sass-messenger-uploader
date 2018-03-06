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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome!')
              setTimeout(() => {
                var messageData = {
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
                            "title": "Make a selection!",
                            "buttons":[
                              {
                                "type":"web_url",
                                "url": "google.com",
                                "title":"Volunteer",
                                "webview_height_ratio":"tall"
                              },
                              {
                                "type": "postback",
                                "title": "Issues",
                                "payload": "ISSUES"
                              },
                              {
                                "type":"web_url",
                                "url": "google.com",
                                "title":"Donate",
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
              }, 1500)
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
    if (event.message.quick_reply) {
      if (event.message.quick_reply.payload === '') {}
    } else {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for your message, we will get back to your shortly!')
      })
    }
  }

  if (event.postback) {
    if (event.postback.payload === "GET_STARTED_PAYLOAD") {
      getUser().then((user) => {
        findMember(user)
      })
    }

    if (event.postback.payload === "ISSUES") {
      getUser().then((user) => {
        var messageData = {
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
                    "title": "Issue 1",
                    "subtitle": "Here is supporting copy...",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": "google.com",
                        "title":"Volunteer",
                        "webview_height_ratio":"tall"
                      },
                      {
                        "type":"web_url",
                        "url": "google.com",
                        "title":"Donate",
                        "webview_height_ratio":"tall"
                      },
                      {
                        "type": "postback",
                        "title": "Learn More",
                        "payload": "ISSUES"
                      }
                    ]
                  },
                  {
                    "title": "Issue 2",
                    "subtitle": "Here is supporting copy...",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": "google.com",
                        "title":"Volunteer",
                        "webview_height_ratio":"tall"
                      },
                      {
                        "type":"web_url",
                        "url": "google.com",
                        "title":"Donate",
                        "webview_height_ratio":"tall"
                      },
                      {
                        "type": "postback",
                        "title": "Learn More",
                        "payload": "ISSUES"
                      }
                    ]
                  },
                  {
                    "title": "Issue 3",
                    "subtitle": "Here is supporting copy...",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": "google.com",
                        "title":"Volunteer",
                        "webview_height_ratio":"tall"
                      },
                      {
                        "type":"web_url",
                        "url": "google.com",
                        "title":"Donate",
                        "webview_height_ratio":"tall"
                      },
                      {
                        "type": "postback",
                        "title": "Learn More",
                        "payload": "ISSUES"
                      }
                    ]
                  },
                  {
                    "title": "Issue 4",
                    "subtitle": "Here is supporting copy...",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": "google.com",
                        "title":"Volunteer",
                        "webview_height_ratio":"tall"
                      },
                      {
                        "type":"web_url",
                        "url": "google.com",
                        "title":"Donate",
                        "webview_height_ratio":"tall"
                      },
                      {
                        "type": "postback",
                        "title": "Learn More",
                        "payload": "ISSUES"
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
