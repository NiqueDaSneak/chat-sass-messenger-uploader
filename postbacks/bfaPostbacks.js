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
          sendTextMessage(event.sender.id, user.pageAccessToken, 'We are a boutique training program for college auditions. Our fresh approach focuses on cultivating true artistry through our three part teaching philosophy - Artistic voice, Craft, and Business Savvy.')
          setTimeout(() => {
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
                        "subtitle": "We want to fit the business to you, not the other way around.",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://www.broadwayfutureartists.com/home',
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
          }, 8000)
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
                      "subtitle": "In NYC? Let’s meet up! This 6 week program gives you a diagnostic session, six private sessions, a group work session, and a final mock audition with a special Broadway guest.",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.broadwayfutureartists.com/extra',
                          "title": "Apply",
                          "webview_height_ratio": "tall"
                        },
                        {
                          "type":"web_url",
                          "url": 'https://www.broadwayfutureartists.com/services',
                          "title": "Learn More",
                          "webview_height_ratio": "tall"
                        }
                      ]
                    },
                    {
                      "title": "Skype College Prep program",
                      "subtitle": "This training program can be done wherever you are! This is 7.5 hours of intense private training - a diagnostic session, private singing and acting sessions, and a final mock audition. When you’re done, you’ll be ready to nail those auditions.",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.broadwayfutureartists.com/extra',
                          "title": "Apply",
                          "webview_height_ratio": "tall"
                        },
                        {
                          "type":"web_url",
                          "url": 'https://www.broadwayfutureartists.com/services',
                          "title": "Learn More",
                          "webview_height_ratio": "tall"
                        }
                      ]
                    },
                    {
                      "title": "Private Coachings",
                      "subtitle": "Just wanna work on it? We got you. We offer private singing and/or acting coachings too!",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.google.com',
                          "title": "Schedule a private coaching",
                          "webview_height_ratio": "tall"
                        },
                        {
                          "type":"web_url",
                          "url": 'https://www.broadwayfutureartists.com/services',
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
          sendTextMessage(event.sender.id, user.pageAccessToken, 'Two Steph(ff)anie’s, one goal...')
          sendImageMessage(event.sender.id, user.pageAccessToken, 'https://chat-sass-messenger-uploader.herokuapp.com/static/bfa/icon.png')
          setTimeout(() => {
            sendTextMessage(event.sender.id, user.pageAccessToken, 'We’re young, NYC actors passionate about cultivating Broadway’s future artists 😜')
            setTimeout(() => {
              sendTextMessage(event.sender.id, user.pageAccessToken, 'After working on various projects on Broadway and on TV/film, we finally met in the OBC of War Paint.')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, 'Through coaching each other and our Broadway friends we developed this teaching philosophy...')
                setTimeout(() => {
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
                              "title": "...we can’t wait to share it with you!",
                              "buttons":[
                                {
                                  "type":"web_url",
                                  "url": 'https://www.broadwayfutureartists.com/faculty',
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
                }, 4000)
              }, 5000)
            }, 4000)
          }, 2000)

        }
      })
    }
  }

  if (event.message) {
    if (event.event.message.quick_reply.payload === 'LEARN') {
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

    if (event.message.quick_reply.payload === 'APPLY') {
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

    if (event.message.quick_reply.payload === 'BOOK') {
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
