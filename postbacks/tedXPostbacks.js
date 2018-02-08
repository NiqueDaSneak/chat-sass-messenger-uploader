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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Hi, this is Gracie! Welcome to our TEDxCincinnati Experience! Powered by Irrigate Messaging.')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, 'Treat yourself & a friend to tickets for TEDxCincinnati Main Stage Event on May 12, 2018 at Memorial Hall. We have a special promo code just for you!')
                // SEND IMAGE HERE!!!!
                setTimeout(() => {
                  sendImageMessage(event.sender.id, user.pageAccessToken, 'https://chat-sass-messenger-uploader.herokuapp.com/static/tedx_1.jpg')
                  setTimeout(() => {
                    sendTextMessage(event.sender.id, user.pageAccessToken, "Click to buy tickets now or go to TEDxCincinnati.com and use 'valentine' in the promo code and get $10.00 off a single ticket or ticket bundle.  This is our way of saying thank you 💖")
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
                                  "title": "Valentine Ticket Special",
                                  // "image_url": "https://chat-sass-messenger-uploader.herokuapp.com/static/tedx_2.png",
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
                      setTimeout(() => {
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'We are looking for 20 TEDxCincinnati Ambassadors to help us build the TEDx community in Cincinnati. Our ambassadors will be given information throughout the year to share with their friends on their social networks. We will list you on the TEDxCincinnati website and give you an extra hug for being part of our team 🤗')
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
                                      "title": "Please tap below if you are interested in becoming a TEDxCincinnati Ambassador",
                                      "buttons":[
                                        {
                                          "type":"web_url",
                                          "url": 'https://goo.gl/forms/Y7mXtPEtmhVE5PYB2',
                                          "title":"Become an Ambassador",
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
                                        "title":"Is your company interested in becoming a sponsor of TEDxCincinnati?",
                                        "buttons":[
                                          {
                                            "type":"postback",
                                            "title":"That would be great!",
                                            "payload":"SPONSOR_YES"
                                          },
                                          {
                                            "type":"postback",
                                            "title":"Nope 😅",
                                            "payload":"SPONSOR_NO"
                                          }
                                        ]
                                      }
                                    ]
                                  }
                                }
                              }
                            }
                            callSendAPI(user.pageAccessToken, messageData)
                          }, 2000)
                        }, 11000)
                      }, 2500)
                    }, 8000)
                  }, 6000)
                }, 6000)
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

      if (event.postback.payload.split('_')[0] === 'SPONSOR') {
        getUser().then((user) => {
          if (event.postback.payload.split('_')[1] === 'YES') {
            sendTextMessage(event.sender.id, user.pageAccessToken, "Fantastic, we will call you! Please give us your name and number: https://goo.gl/forms/r4RqixxbOqXJQU3e2")
          } else {
            sendTextMessage(event.sender.id, user.pageAccessToken, "No problem. Thanks for being part of the TEDx community 🤓")
          }
          // both get the end result
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
                        "title":"Want exclusive content and to enter to win free tickets to the event? 📣",
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Sounds great!",
                            "payload":"ENROLL_YES"
                          },
                          {
                            "type":"postback",
                            "title":"No thank you",
                            "payload":"ENROLL_NO"
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
          }, 2500)
        })
      }

      if (event.postback.payload.split('_')[0] === 'ENROLL') {
        if (event.postback.payload.split('_')[1] === 'YES') {
          getUser().then((user) => {
            sendTextMessage(event.sender.id, user.pageAccessToken, "OK Thank You, we have entered you to win free tickets!  You can look at the talks from last years TEDxCincinnati Main Stage Event.")
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
            sendTextMessage(event.sender.id, user.pageAccessToken, "OK Thank you. You can look at the talks from last years TEDxCincinnati Main Stage Event.")
          })
        }
        // send quick reply chooser
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
                          "title":"2017 Performances 🎵",
                          "payload":"VIDEO_PERFORM"
                        },
                        {
                          "type":"postback",
                          "title":"2017 Speakers 🎙",
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

      if (event.postback.payload === 'DONATE') {
        getUser().then((user) => {
          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "text": "How many tickets do you want to donate?",
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"1: $25",
                  "payload":"DONATETIX_1"
                },
                {
                  "content_type":"text",
                  "title":"2: $50",
                  "payload":"DONATETIX_2"
                },
                {
                  "content_type":"text",
                  "title":"4: $100",
                  "payload":"DONATETIX_3"
                }
              ]
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
                      "title":"Great! Click on last years performances or talks",
                      "buttons":[
                        {
                          "type":"postback",
                          "title":"2017 Performances 🎵",
                          "payload":"VIDEO_PERFORM"
                        },
                        {
                          "type":"postback",
                          "title":"2017 Speakers 🎙",
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
                          "url": 'https://tedxcincinnati.eventbrite.com',
                          "title":"Buy Now",
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
                            "title":"Watch Now 👋",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets 🤗",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate a Ticket 👍",
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
                            "title":"Watch Now 👋",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets 🤗",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate a Ticket 👍",
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
                            "title":"Watch Now 👋",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets 🤗",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate a Ticket 👍",
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
                            "title":"Watch Now 👋",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets 🤗",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate a Ticket 👍",
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
                        "title":"Your Brain Should be Going Places",
                        "subtitle":"Tish Hevel",
                        "image_url":"https://img.youtube.com/vi/r3oPHKqiEHQ/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/r3oPHKqiEHQ',
                            "title":"Watch Now 👋",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets 🤗",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate a Ticket 👍",
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
                            "title":"Watch Now 👋",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets 🤗",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate a Ticket 👍",
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
                            "title":"Watch Now 👋",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets 🤗",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate a Ticket 👍",
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
                            "title":"Watch Now 👋",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets 🤗",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate a Ticket 👍",
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
                            "title":"Watch Now 👋",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets 🤗",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate a Ticket 👍",
                            "payload":"DONATE"
                          }
                        ]
                      },
                      {
                        "title":"Disconnect to Connect: The Path to Work-Life Harmony",
                        "subtitle":"Amy Vetter",
                        "image_url":"https://img.youtube.com/vi/c1WYlK-gUME/hqdefault.jpg",
                        "buttons":[
                          {
                            "type":"web_url",
                            "url": 'https://youtu.be/c1WYlK-gUME',
                            "title":"Watch Now 👋",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets 🤗",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate a Ticket 👍",
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
                            "title":"Watch Now 👋",
                            "webview_height_ratio":"tall"
                          },
                          {
                            "type":"postback",
                            "title":"Purchase Tickets 🤗",
                            "payload":"PURCHASE"
                          },
                          {
                            "type":"postback",
                            "title":"Donate a Ticket 👍",
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
        if (event.message.quick_reply.payload.split('_')[0] === 'DONATETIX') {
          getUser().then((user) => {
            var button
            if (event.message.quick_reply.payload.split('_')[1] === '1') {
              button = {
                "type":"web_url",
                "url": 'https://www.irrigatemsg.com',
                "title":"Donate $25",
                "webview_height_ratio":"tall"
              }
            } else if (event.message.quick_reply.payload.split('_')[1] === '2') {
              button = {
                "type":"web_url",
                "url": 'https://www.irrigatemsg.com',
                "title":"Donate $50",
                "webview_height_ratio":"tall"
              }
            } else {
              button = {
                "type":"web_url",
                "url": 'https://www.irrigatemsg.com',
                "title":"Donate $100",
                "webview_height_ratio":"tall"
              }
            }
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
                        "title":"Tap below to send your donation:",
                        "buttons":[button]
                      }
                    ]
                  }
                }
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
          })
        }

        if (event.message.quick_reply.payload.split('_')[0] === 'ENROLL') {
          if (event.message.quick_reply.payload.split('_')[1] === 'YES') {
            getUser().then((user) => {
              sendTextMessage(event.sender.id, user.pageAccessToken, "OK Thank You, we have entered you to win free tickets!  You can look at the talks from last years TEDxCincinnati Main Stage Event.")
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
              sendTextMessage(event.sender.id, user.pageAccessToken, "OK Thank you. You can look at the talks from last years TEDxCincinnati Main Stage Event.")
            })
          }
          // send quick reply chooser
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
                            "title":"2017 Performances 🎵",
                            "payload":"VIDEO_PERFORM"
                          },
                          {
                            "type":"postback",
                            "title":"2017 Speakers 🎙",
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
                            "title":"2017 Performances 🎵",
                            "payload":"VIDEO_PERFORM"
                          },
                          {
                            "type":"postback",
                            "title":"2017 Speakers 🎙",
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
