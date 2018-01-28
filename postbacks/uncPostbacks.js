'use strict'

var db = require('diskdb')
// db = db.connect('data', [])

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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome to the UNC Shuford Program Messenger Experience.')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, 'The Shuford Program in Entrepreneurship is for students from all backgrounds that are pursuing any major across campus.')
                setTimeout(() => {
                  sendTextMessage(event.sender.id, user.pageAccessToken, 'The program was founded on the understanding that there is a common process for the realization of new ventures, whether those ventures are startups, non-profits, artistic endeavors or even growth within existing enterprises.')
                  setTimeout(() => {
                    sendTextMessage(event.sender.id, user.pageAccessToken, 'We partnered with a startup from a former UNC Student in the minor, Irrigate, to bring you internship information in a smarter and more engaging way through Messenger.')
                    setTimeout(() => {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "text": "What would you like to do:",
                          "quick_replies":[
                            {
                              "content_type":"text",
                              "title":"Search Internships",
                              "payload":"SEARCH"
                            },
                            {
                              "content_type":"text",
                              "title":"Browse Tracks",
                              "payload":"BROWSE"
                            },
                            {
                              "content_type":"text",
                              "title":"Leave Feedback",
                              "payload":"FEEDBACK"
                            },
                          ]
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                      resolve()
                    }, 6000)
                  }, 7000)
                }, 2500)
              }, 2000)
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
      // ENROLLING MEMBERS INTO THE IRRIGATE APP
      getUser().then((user) => {
        findMember(user)
      })
    }

    if (event.postback.payload === "SEARCH") {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, "Scroll or swipe to browse internships.")
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
                  "elements":[
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Blog Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"White Paper Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Social Media Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Business Development Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Web Designer- Front End Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Back End Developer Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Customer Experience Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        }, 2500)
      })
    }

    if (event.postback.payload === "BROWSE") {

    }

    if (event.postback.payload === "FEEDBACK") {

    }
  }

  if (event.message) {
    if (event.message.quick_reply.payload === 'SEARCH') {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, "Scroll or swipe to browse internships.")
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
                  "elements":[
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Blog Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"White Paper Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Social Media Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Business Development Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Web Designer- Front End Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Back End Developer Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Customer Experience Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "tall",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "tall",
                          "title":"Job Description"
                        }
                      ]
                    },
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        }, 2500)
      })
    }

    if (event.message.quick_reply.payload === 'BROWSE') {

    }

    if (event.message.quick_reply.payload === 'FEEDBACK') {

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
