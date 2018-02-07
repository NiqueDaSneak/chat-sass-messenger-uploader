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
              // SEND WELCOME MESSAGES, THEN SEND PROMPT TO REQUEST ENROLLMENT
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome to the TEDxCincinnati Experience! Powered by Irrigate Messaging!')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, 'Here you will receive exclusive content, curated just for you. You can also purchase tickets to the event and browse past talks!')
                setTimeout(() => {
                  sendTextMessage(event.sender.id, user.pageAccessToken, 'First, are you interested in becoming a TEDxCincinnati Insider. You will hear everything here first...including lineup announcement, deals, and exclusive content. You will also be entered to win free tickets to the event!')
                  setTimeout(() => {
                    let messageData = {
                      "recipient":{
                        "id": event.sender.id
                      },
                      "message":{
                        "text": "Interested?",
                        "quick_replies":[
                          {
                            "content_type":"text",
                            "title":"Not Interested",
                            "payload":"ENROLL_NO"
                          },
                          {
                            "content_type":"text",
                            "title":"Sure",
                            "payload":"ENROLL_YES"
                          }
                        ]
                      }
                    }
                    callSendAPI(user.pageAccessToken, messageData)
                  }, 7000)
                }, 5000)
              }, 2500)
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
      if (event.postback.payload === 'GET_STARTED_PAYLOAD') {
        getUser().then((user) => {
          findMember(user)
        })
      }

      if (event.postback.payload === 'DONATE') {
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
                  "elements":[
                    {
                      "title":"Single donation, or are you interested in a corporate sponsorship?",
                      "buttons":[
                        {
                          "type":"postback",
                          "title":"Single Donation",
                          "payload":"SINGLEDONATE"
                        },
                        // {
                        //   "type":"web_url",
                        //   "url": 'https://google.com',
                        //   "title":"Single Donation",
                        //   "webview_height_ratio":"tall"
                        // },
                        {
                          "type":"web_url",
                          "url": 'https://google.com',
                          "title":"Sponsorship",
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

      if (event.postback.payload === 'TALKS') {
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
                  "elements":[
                    {
                      "title":"You wanna see the performaces or the talks from last year?",
                      "buttons":[
                        {
                          "type":"postback",
                          "title":"Performaces!",
                          "payload":"VIDEO_PERFORM"
                        },
                        {
                          "type":"postback",
                          "title":"The talks, please.",
                          "payload":"VIDEO_TALKS"
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

      if (event.postback.payload === 'PURCHASE') {
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
                  "elements":[
                    {
                      "title":"Tap below to purchase your tickets on Eventbrite!",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": 'https://tedxcincinnati.eventbrite.com?discount=valentine',
                          "title":"Pay Now",
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

      if (event.postback.payload.split('_')[0] === 'VIDEO') {
        getUser().then((user) => {
          if (event.postback.payload.split('_')[1] === 'PERFORM') {
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
                        "title":"Promise",
                        "subtitle":"Exhale Dance Tribe",
                        "image_url":"https://img.youtube.com/vi/8fYdYXeHwwY/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/8fYdYXeHwwY',
                            "title":"Watch",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate",
                            "payload":"DONATE"
                          }
                        ]
                      },
                      {
                        "title":"Cover: Roar",
                        "subtitle":"Voices of Destiny",
                        "image_url":"https://img.youtube.com/vi/2Zt8D7Yl5wY/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/2Zt8D7Yl5wY',
                            "title":"Watch",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate",
                            "payload":"DONATE"
                          }
                        ]
                      },
                      {
                        "title":"Fire",
                        "subtitle":"Serenity Fisher & the Cardboard Hearts",
                        "image_url":"https://img.youtube.com/vi/Zziqdjxexb4/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/Zziqdjxexb4',
                            "title":"Watch",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate",
                            "payload":"DONATE"
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
          } else {
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
                        "title":"Disconnect to Connect: The Path to Work-Life Harmony",
                        "subtitle":"Amy Vetter",
                        "image_url":"https://img.youtube.com/vi/c1WYlK-gUME/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/c1WYlK-gUME',
                            "title":"Watch",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate",
                            "payload":"DONATE"
                          }
                        ]
                      },
                      {
                        "title":"Your Brain Should be Going Places",
                        "subtitle":"Tish Hevel",
                        "image_url":"https://img.youtube.com/vi/r3oPHKqiEHQ/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/r3oPHKqiEHQ',
                            "title":"Watch",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate",
                            "payload":"DONATE"
                          }
                        ]
                      },
                      {
                        "title":"The Dangers of Snap Judgements",
                        "subtitle":"Cameron Byerly",
                        "image_url":"https://img.youtube.com/vi/ou9VqUIurmY/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/ou9VqUIurmY',
                            "title":"Watch",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate",
                            "payload":"DONATE"
                          }
                        ]
                      },
                      {
                        "title":"Leadership is Love: The Power of Human Connections",
                        "subtitle":"Dr. Mark Rittenberg",
                        "image_url":"https://img.youtube.com/vi/ZrdxOYEr9Bg/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/ZrdxOYEr9Bg',
                            "title":"Watch",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate",
                            "payload":"DONATE"
                          }
                        ]
                      },
                      {
                        "title":"The Story Behind the Face",
                        "subtitle":"Prerna Gandhi",
                        "image_url":"https://img.youtube.com/vi/ktr1rmwLl0M/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/ktr1rmwLl0M',
                            "title":"Watch",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate",
                            "payload":"DONATE"
                          }
                        ]
                      },
                      {
                        "title":"Surrounded on Purpose",
                        "subtitle":"Scott Mann",
                        "image_url":"https://img.youtube.com/vi/61eEC1-L6RI/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/61eEC1-L6RI',
                            "title":"Watch",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate",
                            "payload":"DONATE"
                          }
                        ]
                      },
                      {
                        "title":"Lost Generation",
                        "subtitle":"Siri Imani",
                        "image_url":"https://img.youtube.com/vi/oNykraHcdQM/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/oNykraHcdQM',
                            "title":"Watch",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate",
                            "payload":"DONATE"
                          }
                        ]
                      },
                      {
                        "title":"13 Year Old on a Mission - to Connect the Disconnected w/AI",
                        "subtitle":"Tanmay Bakshi",
                        "image_url":"https://img.youtube.com/vi/y-lyzsqnK-c/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/y-lyzsqnK-c',
                            "title":"Watch",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate",
                            "payload":"DONATE"
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

      // if (event.postback.payload === 'SINGLEDONATE') {
      //   // how to allow for multiple amounts
      // }
      //
      // if (event.postback.payload === 'SPONSOR') {
      //   // give webviw
      // }
    }


    if (event.message) {
      if (event.message.quick_reply) {
        if (event.message.quick_reply.payload.split('_')[0] === 'ENROLL') {
          if (event.message.quick_reply.payload.split('_')[1] === 'YES') {
            getUser().then((user) => {
              sendTextMessage(event.sender.id, user.pageAccessToken, "Great!")
              Member.findOne({
                fbID: event.sender.id
              }, (err, member) => {
                if (err) {
                  console.error(err)
                }
                member.enrolled = true
                member.save((err, updatedMember) => {
                  if (err) return console.error(err)
                  console.log('updatedMember: ' + updatedMember)
                })
              })
            })
          } else {
            getUser().then((user) => {
              sendTextMessage(event.sender.id, user.pageAccessToken, "That's too bad...")
            })
          }
          // send quick reply chooser
          getUser().then((user) => {
            setTimeout(() => {
              let messageData = {
                "recipient":{
                  "id": event.sender.id
                },
                "message":{
                  "text": "What would you like to do?",
                  "quick_replies":[
                    {
                      "content_type":"text",
                      "title":"Purchase Tickets",
                      "payload":"PURCHASE"
                    },
                    {
                      "content_type":"text",
                      "title":"Donate",
                      "payload":"DONATE"
                    },
                    {
                      "content_type":"text",
                      "title":"Watch Past Talks",
                      "payload":"TALKS"
                    }
                  ]
                }
              }
              callSendAPI(user.pageAccessToken, messageData)
            }, 1500)
          })
        }

        if (event.message.quick_reply.payload === 'DONATE') {
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
                    "elements":[
                      {
                        "title":"Single donation, or are you interested in a corporate sponsorship?",
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Single Donation",
                            "payload":"SINGLEDONATE"
                          },
                          // {
                          //   "type":"web_url",
                          //   "url": 'https://google.com',
                          //   "title":"Single Donation",
                          //   "webview_height_ratio":"tall"
                          // },
                          {
                            "type":"web_url",
                            "url": 'https://google.com',
                            "title":"Sponsorship",
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

        if (event.message.quick_reply.payload === 'TALKS') {
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
                    "elements":[
                      {
                        "title":"You wanna see the performaces or the talks from last year?",
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Performaces!",
                            "payload":"VIDEO_PERFORM"
                          },
                          {
                            "type":"postback",
                            "title":"The talks, please.",
                            "payload":"VIDEO_TALKS"
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

        if (event.message.quick_reply.payload === 'PURCHASE') {
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
                    "elements":[
                      {
                        "title":"Tap below to purchase your tickets on Eventbrite!",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://tedxcincinnati.eventbrite.com?discount=valentine',
                            "title":"Pay Now",
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
      // else {
      //   getUser().then((user) => {
      //     sendTextMessage(event.sender.id, user.pageAccessToken, "Thank you for your feedback! It is very valuable to us!")
      //   })
      // }
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
