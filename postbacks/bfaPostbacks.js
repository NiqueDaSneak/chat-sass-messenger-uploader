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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Hi! Welcome to Broadway Future Artists! How can we help?')
              setTimeout(() => {
                let messageData = {
                  "recipient":{
                    "id": event.sender.id
                  },
                  "message":{
                    "text": "Choose an option below:",
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
              }, 2000)

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
                    "title": "Why BFA?",
                    // "subtitle": "Here is some suplementary copy",
                    "buttons":[
                      {
                        "type": "postback",
                        "payload": "WHY_LEARN",
                        "title":"Learn More"
                      }
                    ]
                  },
                  {
                    "title": "What Do We Offer?",
                    // "subtitle": "Here is some suplementary copy",
                    "buttons":[
                      {
                        "type": "postback",
                        "payload": "OFFER_LEARN",
                        "title":"Learn More"
                      }
                    ]
                  },
                  {
                    "title": "Who We Are?",
                    // "subtitle": "Here is some suplementary copy",
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
                        "url": 'https://www.broadwayfutureartists.com/extra',
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
                      "title": "Private Coachings",
                      // "subtitle": "ALSACE, FR ‘15 REISLING",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.broadwayfutureartists.com/book-online',
                          "title":"Book Now",
                          "webview_height_ratio":"tall"
                        },
                        {
                          "type":"web_url",
                          "url": 'https://www.broadwayfutureartists.com/services',
                          "title":"Learn More",
                          "webview_height_ratio":"tall"
                        }
                      ]
                    },
                    {
                      "title": "College Prep Program",
                      "subtitle": "Are you currently a student?",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.broadwayfutureartists.com/book-online',
                          "title":"Yes",
                          "webview_height_ratio":"tall"
                        },
                        {
                          "type": "postback",
                          "title": "No",
                          "payload": "PREP_NO"
                        },
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

    if (event.postback.payload === 'PREP_NO') {
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
                    "title": "Make a selection:",
                    // "subtitle": "ALSACE, FR ‘15 REISLING",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": 'https://www.broadwayfutureartists.com/extra',
                        "title":"Apply",
                        "webview_height_ratio":"tall"
                      },
                      {
                        "type":"web_url",
                        "url": 'https://www.broadwayfutureartists.com/services',
                        "title":"Learn More",
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

    if (event.postback.payload.split("_")[1] === 'LEARN') {
      getUser().then((user) => {
        if (event.postback.payload.split("_")[0] === 'WHY') {
          sendTextMessage(event.sender.id, user.pageAccessToken, 'We are a boutique training program for college auditions. Our fresh approach focuses on cultivating true artistry through our three part teaching philosophy - Artistic voice, Craft, and Business Savvy. We want to fit the business to you, not the other way around.')
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
                        "title": "Check out our website!",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://www.broadwayfutureartists.com/home',
                            "title": "Learn More",
                            "webview_height_ratio": "tall"
                          },
                          {
                            "type":"postback",
                            "payload": 'OFFER_LEARN',
                            "title": "What Do We Offer?",
                          },
                          {
                            "type":"postback",
                            "payload": 'WHO_LEARN',
                            "title": "Who Are We?",
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
                  "image_aspect_ratio": "square",
                  "elements": [
                    {
                      "title": "NYC College Prep program",
                      "subtitle": "In NYC? Let’s meet up!",
                      "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/bfa/nyc.jpeg",
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
                      "subtitle": "This training program can be done wherever you are! ",
                      "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/bfa/skype.jpeg",
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
                      "subtitle": "Just wanna work on it? We got you.",
                      "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/bfa/coaching.jpeg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.broadwayfutureartists.com/book-online',
                          "title": "Book Now",
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
          sendImageMessage(event.sender.id, user.pageAccessToken, 'https://chat-sass-messenger-uploader.herokuapp.com/static/bfa/IMG_0074.jpg')
          setTimeout(() => {
            sendTextMessage(event.sender.id, user.pageAccessToken, 'We’re young, NYC actors passionate about cultivating Broadway’s future artists 😜')
            setTimeout(() => {
              sendTextMessage(event.sender.id, user.pageAccessToken, 'After working on various projects on Broadway and on TV/film, we finally met in the OBC of War Paint.')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, 'Through coaching each other and our Broadway friends we developed our teaching philosophy.')
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
                              "title": "We can’t wait to share it with you!",
                              "buttons":[
                                {
                                  "type":"web_url",
                                  "url": 'https://www.broadwayfutureartists.com/faculty',
                                  "title": "Faculty Bios",
                                  "webview_height_ratio": "tall"
                                },
                                {
                                  "type":"postback",
                                  "payload": 'OFFER_LEARN',
                                  "title": "What Do We Offer?",
                                },
                                {
                                  "type":"postback",
                                  "payload": 'WHY_LEARN',
                                  "title": "Why BFA?",
                                }
                              ]
                            }
                          ]
                        }
                      }
                    }
                  }
                  callSendAPI(user.pageAccessToken, messageData)
                }, 3500)
              }, 300)
            }, 3000)
          }, 2000)

        }
      })
    }
  }

  if (event.message) {
    if (event.message.quick_reply.payload === 'LEARN') {
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
                    "title": "Why BFA?",
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
                    "title": "What Do We Offer?",
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
                    "title": "Who We Are?",
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
                        "url": 'https://www.broadwayfutureartists.com/extra',
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
                      "title": "Private Coachings",
                      // "subtitle": "ALSACE, FR ‘15 REISLING",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://www.broadwayfutureartists.com/book-online',
                          "title":"Book Now",
                          "webview_height_ratio":"tall"
                        },
                        {
                          "type":"web_url",
                          "url": 'https://www.broadwayfutureartists.com/services',
                          "title":"Learn More",
                          "webview_height_ratio":"tall"
                        }
                      ]
                    },
                    {
                      "title": "College Prep Program",
                      "subtitle": "Are you currently a student?",
                      "buttons":[
                        {
                          "type": "postback",
                          "title": "Yes",
                          "payload": "PREP_YES"
                        },
                        {
                          "type": "postback",
                          "title": "No",
                          "payload": "PREP_NO"
                        },
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
