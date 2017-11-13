'use strict'

var request = require('request')

const irrigateRouter = require('express').Router()

var Message = require('../models/messageModel.js')
var Group = require('../models/groupModel.js')
var User = require('../models/userModel.js')
var Member = require('../models/memberModel.js')

function sendTextMessage(recipientId, accessToken, textMsg) {
  return new Promise(function(resolve, reject) {
    var messageData = {
      "recipient": {
        "id": recipientId
      },
      "message": {
        "text": textMsg
      }
    }

    callSendAPI(accessToken, messageData)
    resolve()
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
  });
}


irrigateRouter.post('/', (req, res, next) => {
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
        if (event.message) {
          eventMessageHandler(event)
        } else if (event.postback) {

          function eventPostbackHandler(event) {

              if (event.postback.payload === 'GET_STARTED_PAYLOAD') {
                getUser().then((user) => {
                  findMember(user).then((user) => {
                    sendTextMessage(event.sender.id, user.pageAccessToken, 'Hi! Welcome to the Irrigate Messaging Experience.').then(() => {

                      setTimeout(() => {
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'You are going to learn a lot today...').then(() => {

                          setTimeout(() => {
                            sendTextMessage(event.sender.id, user.pageAccessToken, '...so if you have any questions or need to restart, use the menu below the chat').then(() => {

                              setTimeout(() => {
                                sendTextMessage(event.sender.id, user.pageAccessToken, 'We know this is a new experience for you so let’s go over some procedures so you can get the most out of your time').then(() => {

                                  setTimeout(() => {
                                    sendTextMessage(event.sender.id, user.pageAccessToken, 'First, in order for irrigate to work, you need to be an admin on a FB page.').then(() => {

                                      let messageData = {
                                        "recipient":{
                                          "id": event.sender.id
                                        },
                                        "message":{
                                          "attachment":{
                                            "type":"template",
                                            "payload":{
                                              "template_type":"button",
                                              "text":"Are you an admin for a page?",
                                              "buttons":[
                                                {
                                                  "type":"postback",
                                                  "payload":"YES_ADMIN",
                                                  "title":"Yes, I have a page"
                                                },
                                                {
                                                  "type":"postback",
                                                  "payload":"NO_ADMIN",
                                                  "title":"No I'm not"
                                                }
                                              ]
                                            }
                                          }
                                        }
                                      }

                                      setTimeout(() => {
                                        callSendAPI(user.pageAccessToken, messageData)
                                      }, 2000)
                                    })
                                  }, 3500)
                                })
                              }, 2000)
                            })
                          }, 1500)
                        })
                      }, 1500)
                    })

                  })
                })

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
                            // sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for signing up. More content to come!')
                            resolve(user)
                          })
                        })
                      } else {
                        // sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome back!')
                        resolve(user)
                      }
                    })

                  })
                }
              }

              if (event.postback.payload === "NO_ADMIN") {

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

                  let messageData = {
                    "recipient":{
                      "id": event.sender.id
                    },
                    "message":{
                      "attachment":{
                        "type":"template",
                        "payload":{
                          "template_type":"button",
                          "text":"Don’t worry! We can still show you the power of Irrigate. And will be integrating with Imessage and WhatsApp soon!",
                          "buttons":[
                            {
                              "type":"postback",
                              "payload":"YES_ADMIN",
                              "title":"Show me Irrigate"
                            }
                          ]
                        }
                      }
                    }
                  }
                  callSendAPI(user.pageAccessToken, messageData)
                })

              }

              if (event.postback.payload === "YES_ADMIN") {

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
                  sendTextMessage(event.sender.id, user.pageAccessToken, 'Awesome! Let’s get started.').then(() => {

                    setTimeout(() => {
                      sendTextMessage(event.sender.id, user.pageAccessToken, 'There are many components to a messenger conversations and please be aware that for this demo you will be responding with pre programmed responses.').then(() => {

                        setTimeout(() => {

                          let messageData = {
                            "recipient":{
                              "id": event.sender.id
                            },
                            "message":{
                              "attachment":{
                                "type":"template",
                                "payload":{
                                  "template_type":"button",
                                  "text":"So what statement best describes you?",
                                  "buttons":[
                                    {
                                      "type":"postback",
                                      "payload":"MARK_TRACK",
                                      "title":"I want to have better conversations with customers"
                                    },
                                    {
                                      "type":"postback",
                                      "payload":"ECOMM_TRACK",
                                      "title":"I want to sell things via messenger applications"
                                    }
                                  ]
                                }
                              }
                            }
                          }

                          callSendAPI(user.pageAccessToken, messageData)
                        }, 5000)
                      })
                    }, 1500)
                  })
                })

              }

              if (event.postback.payload === "MARK_TRACK") {

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
                  sendTextMessage(event.sender.id, user.pageAccessToken, 'Great! Let me show you how Irrigate can help.').then(() => {

                    setTimeout(() => {
                      sendTextMessage(event.sender.id, user.pageAccessToken, 'Irrigate works by allowing you to connect with your customers directly via FB messenger.').then(() => {

                        setTimeout(() => {
                          sendTextMessage(event.sender.id, user.pageAccessToken, 'Irrigate has almost limitless possibilities to what can be sent.').then(() => {

                            setTimeout(() => {
                              let messageData = {
                                "recipient":{
                                  "id": event.sender.id
                                },
                                "message":{
                                  "attachment":{
                                    "type":"template",
                                    "payload":{
                                      "template_type":"button",
                                      "text":"Would you like to see Irrigate in action or some examples of what has already been done?",
                                      "buttons":[
                                        {
                                          "type":"postback",
                                          "payload":"HOW_TO_POST",
                                          "title":"Show me how to post to Irrigate!"
                                        },
                                        {
                                          "type":"postback",
                                          "payload":"EXAMPLES",
                                          "title":"I want tosee some examples!"
                                        },
                                        {
                                          "type":"postback",
                                          "payload":"SIGN_UP",
                                          "title":"Nope! I got it! How do I sign up?"
                                        }
                                      ]
                                    }
                                  }
                                }
                              }

                              callSendAPI(user.pageAccessToken, messageData)

                            }, 2000)
                          })
                        }, 2000)
                      })
                    }, 1500)
                  })

                })






              }

              if (event.postback.payload === "ECOMM_TRACK") {

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
                  sendTextMessage(event.sender.id, user.pageAccessToken, 'Great! Let me show you how Irrigate can help.').then(() => {

                    setTimeout(() => {
                      sendTextMessage(event.sender.id, user.pageAccessToken, 'Irrigate utilizes Stripe to create a more engaging ecommerce experience').then(() => {

                        setTimeout(() => {
                          sendTextMessage(event.sender.id, user.pageAccessToken, 'You can now sell goods where your customers already are... Facebook Messenger').then(() => {

                            setTimeout(() => {
                              sendTextMessage(event.sender.id, user.pageAccessToken, "Now let’s go through an example. Here is the store for a business that provides its customers with motivation & positivity. They also have products. To finish the expereince tap 'Done Shopping':").then(() => {

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
                                              "title":"Beyond Blessed Mug",
                                              "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/6.jpg",
                                              "subtitle":"$10",
                                              "buttons":[
                                                {
                                                  "type":"postback",
                                                  "title":"Add to cart",
                                                  "payload":"ADD_CART_ACC"
                                                },
                                                {
                                                  "type":"postback",
                                                  "title":"Go to clothing",
                                                  "payload":"CLOTHING"
                                                },
                                                {
                                                  "type":"postback",
                                                  "title":"Done Shopping",
                                                  "payload":"DONE"
                                                },
                                              ]
                                            },
                                            {
                                              "title":"Never Alone Mug",
                                              "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/7.jpg",
                                              "subtitle":"$12",
                                              "buttons":[
                                                {
                                                  "type":"postback",
                                                  "title":"Add to cart",
                                                  "payload":"ADD_CART_ACC"
                                                },
                                                {
                                                  "type":"postback",
                                                  "title":"Go to clothing",
                                                  "payload":"CLOTHING"
                                                },
                                                {
                                                  "type":"postback",
                                                  "title":"Done Shopping",
                                                  "payload":"DONE"
                                                },
                                              ]
                                            },
                                            {
                                              "title":"Affirmation Tokens(14 count)",
                                              "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/8.jpg",
                                              "subtitle":"$24",
                                              "buttons":[
                                                {
                                                  "type":"postback",
                                                  "title":"Add to cart",
                                                  "payload":"ADD_CART_ACC"
                                                },
                                                {
                                                  "type":"postback",
                                                  "title":"Go to clothing",
                                                  "payload":"CLOTHING"
                                                },
                                                {
                                                  "type":"postback",
                                                  "title":"Done Shopping",
                                                  "payload":"DONE"
                                                },
                                              ]
                                            },
                                            {
                                              "title":"Blessing Necklace",
                                              "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/9.jpg",
                                              "subtitle":"$50",
                                              "buttons":[
                                                {
                                                  "type":"postback",
                                                  "title":"Add to cart",
                                                  "payload":"ADD_CART_ACC"
                                                },
                                                {
                                                  "type":"postback",
                                                  "title":"Go to clothing",
                                                  "payload":"CLOTHING"
                                                },
                                                {
                                                  "type":"postback",
                                                  "title":"Done Shopping",
                                                  "payload":"DONE"
                                                },
                                              ]
                                            },
                                            {
                                              "title":"Be Fearless Pillow",
                                              "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/10.jpg",
                                              "subtitle":"$25",
                                              "buttons":[
                                                {
                                                  "type":"postback",
                                                  "title":"Add to cart",
                                                  "payload":"ADD_CART_ACC"
                                                },
                                                {
                                                  "type":"postback",
                                                  "title":"Go to clothing",
                                                  "payload":"CLOTHING"
                                                },
                                                {
                                                  "type":"postback",
                                                  "title":"Done Shopping",
                                                  "payload":"DONE"
                                                },
                                              ]
                                            }
                                          ]
                                        }
                                      }
                                    }
                                  }
                                  callSendAPI(user.pageAccessToken, messageData)
                                }, 4000)
                              })
                            }, 2000)
                          })
                        }, 2000)
                      })
                    }, 2500)
                  })

                })
              }

              if (event.postback.payload === "ADD_CART_ACC") {
                let initialResponse = new Promise(function(resolve, reject) {
                  let randomResponse = [
                    "Nice pick up!",
                    "Love it!",
                    "This one is great!",
                    'Nice!',
                    "I'd get this too!"
                  ]

                  User.findOne({
                    'pageID': event.recipient.id
                  }, (err, user) => {
                    sendTextMessage(event.sender.id, user.pageAccessToken, randomResponse[Math.floor(Math.random() * 3)])
                    resolve(user)
                  })
                })

                initialResponse.then((user) => {
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
                                "title":"Beyond Blessed Mug",
                                "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/6.jpg",
                                "subtitle":"$10",
                                "buttons":[
                                  {
                                    "type":"postback",
                                    "title":"Add to cart",
                                    "payload":"ADD_CART_ACC"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Go to clothing",
                                    "payload":"CLOTHING"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Done Shopping",
                                    "payload":"DONE"
                                  },
                                ]
                              },
                              {
                                "title":"Never Alone Mug",
                                "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/7.jpg",
                                "subtitle":"$12",
                                "buttons":[
                                  {
                                    "type":"postback",
                                    "title":"Add to cart",
                                    "payload":"ADD_CART_ACC"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Go to clothing",
                                    "payload":"CLOTHING"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Done Shopping",
                                    "payload":"DONE"
                                  },
                                ]
                              },
                              {
                                "title":"Affirmation Tokens(14 count)",
                                "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/8.jpg",
                                "subtitle":"$24",
                                "buttons":[
                                  {
                                    "type":"postback",
                                    "title":"Add to cart",
                                    "payload":"ADD_CART_ACC"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Go to clothing",
                                    "payload":"CLOTHING"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Done Shopping",
                                    "payload":"DONE"
                                  },
                                ]
                              },
                              {
                                "title":"Blessing Necklace",
                                "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/9.jpg",
                                "subtitle":"$50",
                                "buttons":[
                                  {
                                    "type":"postback",
                                    "title":"Add to cart",
                                    "payload":"ADD_CART_ACC"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Go to clothing",
                                    "payload":"CLOTHING"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Done Shopping",
                                    "payload":"DONE"
                                  },
                                ]
                              },
                              {
                                "title":"Be Fearless Pillow",
                                "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/10.jpg",
                                "subtitle":"$25",
                                "buttons":[
                                  {
                                    "type":"postback",
                                    "title":"Add to cart",
                                    "payload":"ADD_CART_ACC"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Go to clothing",
                                    "payload":"CLOTHING"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Done Shopping",
                                    "payload":"DONE"
                                  },
                                ]
                              }
                            ]
                          }
                        }
                      }
                    }
                    callSendAPI(user.pageAccessToken, messageData)
                  }, 2000)
                })
              }

              if (event.postback.payload === 'CLOTHING') {
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
                            "title":"Good Vibes Only",
                            "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/1.jpg",
                            "subtitle":"$25",
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Add to cart",
                                "payload":"ADD_CART_CLO"
                              },
                              {
                                "type":"postback",
                                "title":"Go to Accessories",
                                "payload":"ACCESSORIES"
                              },
                              {
                                "type":"postback",
                                "title":"Done Shopping",
                                "payload":"DONE"
                              },
                            ]
                          },
                          {
                            "title":"Gorillaz Tee",
                            "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/2.jpg",
                            "subtitle":"$23",
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Add to cart",
                                "payload":"ADD_CART_CLO"
                              },
                              {
                                "type":"postback",
                                "title":"Go to Accessories",
                                "payload":"ACCESSORIES"
                              },
                              {
                                "type":"postback",
                                "title":"Done Shopping",
                                "payload":"DONE"
                              },
                            ]
                          },
                          {
                            "title":"Richie Benaud White Shirt",
                            "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/3.jpg",
                            "subtitle":"$18",
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Add to cart",
                                "payload":"ADD_CART_CLO"
                              },
                              {
                                "type":"postback",
                                "title":"Go to Accessories",
                                "payload":"ACCESSORIES"
                              },
                              {
                                "type":"postback",
                                "title":"Done Shopping",
                                "payload":"DONE"
                              },
                            ]
                          },
                          {
                            "title":"Nelson Mandela",
                            "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/4.jpg",
                            "subtitle":"$44",
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Add to cart",
                                "payload":"ADD_CART_CLO"
                              },
                              {
                                "type":"postback",
                                "title":"Go to Accessories",
                                "payload":"ACCESSORIES"
                              },
                              {
                                "type":"postback",
                                "title":"Done Shopping",
                                "payload":"DONE"
                              },
                            ]
                          },
                          {
                            "title":"Do Not Believe Everything You Think Longsleeve",
                            "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/5.jpg",
                            "subtitle":"$25",
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Add to cart",
                                "payload":"ADD_CART_CLO"
                              },
                              {
                                "type":"postback",
                                "title":"Go to Accessories",
                                "payload":"ACCESSORIES"
                              },
                              {
                                "type":"postback",
                                "title":"Done Shopping",
                                "payload":"DONE"
                              },
                            ]
                          }
                        ]
                      }
                    }
                  }
                }
                User.findOne({
                  'pageID': event.recipient.id
                }, (err, user) => {
                  callSendAPI(user.pageAccessToken, messageData)
                })
              }

              if (event.postback.payload === 'ADD_CART_CLO') {
                let initialResponse = new Promise(function(resolve, reject) {
                  let randomResponse = [
                    "Nice pick up!",
                    "Love it!",
                    "This one is great!",
                    'Nice!',
                    "I'd get this too!"
                  ]

                  User.findOne({
                    'pageID': event.recipient.id
                  }, (err, user) => {
                    sendTextMessage(event.sender.id, user.pageAccessToken, randomResponse[Math.floor(Math.random() * 3)])
                    resolve(user)
                  })
                })

                initialResponse.then((user) => {
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
                                "title":"Good Vibes Only",
                                "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/1.jpg",
                                "subtitle":"$25",
                                "buttons":[
                                  {
                                    "type":"postback",
                                    "title":"Add to cart",
                                    "payload":"ADD_CART_CLO"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Go to Accessories",
                                    "payload":"ACCESSORIES"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Done Shopping",
                                    "payload":"DONE"
                                  },
                                ]
                              },
                              {
                                "title":"Gorillaz Tee",
                                "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/2.jpg",
                                "subtitle":"$23",
                                "buttons":[
                                  {
                                    "type":"postback",
                                    "title":"Add to cart",
                                    "payload":"ADD_CART_CLO"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Go to Accessories",
                                    "payload":"ACCESSORIES"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Done Shopping",
                                    "payload":"DONE"
                                  },
                                ]
                              },
                              {
                                "title":"Richie Benaud White Shirt",
                                "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/3.jpg",
                                "subtitle":"$18",
                                "buttons":[
                                  {
                                    "type":"postback",
                                    "title":"Add to cart",
                                    "payload":"ADD_CART_CLO"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Go to Accessories",
                                    "payload":"ACCESSORIES"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Done Shopping",
                                    "payload":"DONE"
                                  },
                                ]
                              },
                              {
                                "title":"Nelson Mandela",
                                "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/4.jpg",
                                "subtitle":"$44",
                                "buttons":[
                                  {
                                    "type":"postback",
                                    "title":"Add to cart",
                                    "payload":"ADD_CART_CLO"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Go to Accessories",
                                    "payload":"ACCESSORIES"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Done Shopping",
                                    "payload":"DONE"
                                  },
                                ]
                              },
                              {
                                "title":"Do Not Believe Everything You Think Longsleeve",
                                "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/5.jpg",
                                "subtitle":"$25",
                                "buttons":[
                                  {
                                    "type":"postback",
                                    "title":"Add to cart",
                                    "payload":"ADD_CART_CLO"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Go to Accessories",
                                    "payload":"ACCESSORIES"
                                  },
                                  {
                                    "type":"postback",
                                    "title":"Done Shopping",
                                    "payload":"DONE"
                                  },
                                ]
                              }
                            ]
                          }
                        }
                      }
                    }
                    callSendAPI(user.pageAccessToken, messageData)
                  }, 2000)
                })
              }

              if (event.postback.payload === 'ACCESSORIES') {
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
                            "title":"Beyond Blessed Mug",
                            "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/6.jpg",
                            "subtitle":"$10",
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Add to cart",
                                "payload":"ADD_CART_ACC"
                              },
                              {
                                "type":"postback",
                                "title":"Go to clothing",
                                "payload":"CLOTHING"
                              },
                              {
                                "type":"postback",
                                "title":"Done Shopping",
                                "payload":"DONE"
                              },
                            ]
                          },
                          {
                            "title":"Never Alone Mug",
                            "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/7.jpg",
                            "subtitle":"$12",
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Add to cart",
                                "payload":"ADD_CART_ACC"
                              },
                              {
                                "type":"postback",
                                "title":"Go to clothing",
                                "payload":"CLOTHING"
                              },
                              {
                                "type":"postback",
                                "title":"Done Shopping",
                                "payload":"DONE"
                              },
                            ]
                          },
                          {
                            "title":"Affirmation Tokens(14 count)",
                            "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/8.jpg",
                            "subtitle":"$24",
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Add to cart",
                                "payload":"ADD_CART_ACC"
                              },
                              {
                                "type":"postback",
                                "title":"Go to clothing",
                                "payload":"CLOTHING"
                              },
                              {
                                "type":"postback",
                                "title":"Done Shopping",
                                "payload":"DONE"
                              },
                            ]
                          },
                          {
                            "title":"Blessing Necklace",
                            "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/9.jpg",
                            "subtitle":"$50",
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Add to cart",
                                "payload":"ADD_CART_ACC"
                              },
                              {
                                "type":"postback",
                                "title":"Go to clothing",
                                "payload":"CLOTHING"
                              },
                              {
                                "type":"postback",
                                "title":"Done Shopping",
                                "payload":"DONE"
                              },
                            ]
                          },
                          {
                            "title":"Be Fearless Pillow",
                            "image_url":"https://chat-sass-messenger-uploader.herokuapp.com/static/10.jpg",
                            "subtitle":"$25",
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Add to cart",
                                "payload":"ADD_CART_ACC"
                              },
                              {
                                "type":"postback",
                                "title":"Go to clothing",
                                "payload":"CLOTHING"
                              },
                              {
                                "type":"postback",
                                "title":"Done Shopping",
                                "payload":"DONE"
                              },
                            ]
                          }
                        ]
                      }
                    }
                  }
                }
                User.findOne({
                  'pageID': event.recipient.id
                }, (err, user) => {
                  callSendAPI(user.pageAccessToken, messageData)
                })
              }

              if (event.postback.payload === 'DONE') {
                var customerName
                Member.findOne({
                  fbID: event.sender.id
                }, (err, member) => {
                  if (err) {
                    console.log(err)
                  }
                  customerName = member.fullName
                })
                User.findOne({
                  'pageID': event.recipient.id
                }, (err, user) => {
                  if (err) {
                    console.log(err)
                  }
                  sendTextMessage(event.sender.id, user.pageAccessToken, "Thanks for your order! We used your credit card on file to complete the order. Here is your receipt:")

                  let messageData = {
                    "recipient":{
                      "id": event.sender.id
                    },
                    "message":{
                      "attachment":{
                        "type":"template",
                        "payload":{
                          "template_type":"receipt",
                          "recipient_name": customerName,
                          "order_number":"3647588",
                          "currency":"USD",
                          "payment_method":"Visa 9387",
                          "address":{
                            "street_1":"47 44th St",
                            "street_2":"",
                            "city":"New York",
                            "postal_code":"11377",
                            "state":"NY",
                            "country":"US"
                          },
                          "summary":{
                            "total_cost": 74.24
                          },
                        }
                      }
                    }
                  }

                  setTimeout(() => {
                    callSendAPI(user.pageAccessToken, messageData)
                  }, 2000)

                  setTimeout(() => {
                    let messageData = {
                      "recipient":{
                        "id": event.sender.id
                      },
                      "message":{
                        "attachment":{
                          "type":"template",
                          "payload":{
                            "template_type":"button",
                            "text":"Want to see some other ways Irrigate has been helping businesses?",
                            "buttons":[
                              {
                                "type":"postback",
                                "payload":"HOW_TO_POST",
                                "title":"Show me how to post to Irrigate!"
                              },
                              {
                                "type":"postback",
                                "payload":"EXAMPLES",
                                "title":"I want to see some examples!"
                              },
                              {
                                "type":"postback",
                                "payload":"SIGN_UP",
                                "title":"Nope! I got it! How do I sign up?"
                              }
                            ]
                          }
                        }
                      }
                    }

                    callSendAPI(user.pageAccessToken, messageData)
                  }, 5000)
                })
              }

              if (event.postback.payload === "HOW_TO_POST") {

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
                  sendTextMessage(event.sender.id, user.pageAccessToken, 'Sweet! Check out this gif showing how easy it is to post via Irrigate.').then(() => {

                    setTimeout(() => {
                      sendImageMessage(event.sender.id, user.pageAccessToken, 'https://chat-sass-messenger-uploader.herokuapp.com/static/how-to-post.gif')
                      sendTextMessage(event.sender.id, user.pageAccessToken, 'See how easy that was?').then(() => {

                        setTimeout(() => {
                          let messageData = {
                            "recipient":{
                              "id": event.sender.id
                            },
                            "message":{
                              "attachment":{
                                "type":"template",
                                "payload":{
                                  "template_type":"button",
                                  "text":"Would you like to see some examples of how you could use Irrigate?",
                                  "buttons":[
                                    {
                                      "type":"postback",
                                      "payload":"EXAMPLES",
                                      "title":"I want to see some examples!"
                                    },
                                    {
                                      "type":"postback",
                                      "payload":"SIGN_UP",
                                      "title":"Nope! I got it! How do I sign up?"
                                    }
                                  ]
                                }
                              }
                            }
                          }

                          callSendAPI(user.pageAccessToken, messageData)
                        }, 5500)
                      })
                    }, 2000)
                  })
                })
              }

              if (event.postback.payload === "EXAMPLES") {

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

                })
              }

              if (event.postback.payload === "SIGN_UP") {

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
                  sendTextMessage(event.sender.id, user.pageAccessToken, 'Go ahead and visit us at www.irrigatemsg.com/pricing to sign up!')
                })
              }



          //     console.log('INSIDE POSTBACK FUNC')
          //     console.log(event)
          //     // ENROLLING MEMBERS INTO THE IRRIGATE APP
          //     function findMember(user) {
          //       console.log('INSIDE FINDMEMBER FUNC')
          //       console.log(event.sender.id)
          //       return new Promise(function(resolve, reject) {
                  // Member.findOne({
                  //   fbID: event.sender.id
                  // }, (err, member) => {
                  //   if (err) {
                  //     console.error(err)
                  //   }
                  //   if (member === null) {
                  //     request({
                  //       uri: 'https://graph.facebook.com/v2.6/' + event.sender.id + '?access_token=' + user.pageAccessToken,
                  //       method: 'GET'
                  //     }, function(error, response, body) {
                  //       if (error) {
                  //         return console.error('upload failed:', error)
                  //       }
                  //       var facebookProfileResponse = JSON.parse(body)
                  //
                  //       // NEED TO FIND ORG NAME AND REPLACE BELOW
                  //       var newMember = new Member({
                  //         organization: user.organization,
                  //         fbID: event.sender.id,
                  //         fullName: facebookProfileResponse.first_name + ' ' + facebookProfileResponse.last_name,
                  //         photo: facebookProfileResponse.profile_pic,
                  //         timezone: facebookProfileResponse.timezone,
                  //         createdDate: moment().format('MM-DD-YYYY')
                  //       })
                  //
                  //       if (facebookProfileResponse.gender) {
                  //         newMember.gender = facebookProfileResponse.gender
                  //       }
                  //
                  //       newMember.save((err, member) => {
                  //         if (err) return console.error(err)
                  //         // sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for signing up. More content to come!')
                  //         resolve(user)
                  //       })
                  //     })
                  //   } else {
                  //     // sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome back!')
                  //     resolve(user)
                  //   }
                  // })
                // })
          //     }
          //
          //     getUser().then((user) => {
          //       findMember(user).then((user) => {
          //         let welcomeMsg = new Promise(function(resolve, reject) {
          //           sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for your interest in Irrigate Messaging, where small businesses engage and grow!')
          //           resolve()
          //         })
          //
          //         let faqGate = new Promise(function(resolve, reject) {
          //           let messageData = {
          //             "recipient":{
          //               "id": event.sender.id
          //             },
          //             "message":{
          //               "text": "Still wondering how Irrigate can help your business?",
          //               "quick_replies":[
          //                 {
          //                   "content_type":"text",
          //                   "title":"Yes I am",
          //                   "payload":"SEND_FAQ",
          //                 },
          //                 {
          //                   "content_type":"text",
          //                   "title":"No, sign me up!",
          //                   "payload":"SIGN_UP",
          //                 },
          //               ]
          //             }
          //           }
          //           setTimeout(() => {
          //             callSendAPI(user.pageAccessToken, messageData)
          //             resolve()
          //           }, 2000)
          //         })
          //
          //         welcomeMsg.then(() => {
          //           faqGate
          //         })
          //       })
          //     })
          //
          }

          eventPostbackHandler(event)
        } else {
          console.log("Webhook received unknown event: ", data)
        }
      })
    })
    res.sendStatus(200)
  } else {

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


  function eventMessageHandler(event) {
    getUser().then((user) => {
      if (event.message.quick_reply) {
        if (event.message.quick_reply.payload === 'SEND_FAQ') {
          let messageData = {
            "recipient": {
              "id": event.sender.id
            },
            "message":{
              "text": "Check out these frequently asked questions:",
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Irrigate costs?",
                  "payload":"COST",
                },
                {
                  "content_type":"text",
                  "title":"Adding members?",
                  "payload":"ADDING",
                },
                {
                  "content_type":"text",
                  "title":"Why did we start?",
                  "payload":"WHY",
                },
                {
                  "content_type":"text",
                  "title":"What’s next?",
                  "payload":"NEXT",
                },
              ]
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        }

        if (event.message.quick_reply.payload === 'COST') {
          sendTextMessage(event.sender.id, user.pageAccessToken, "I'm going to send you a photo of our pricing list...")
          setTimeout(() => {
            let messageData = {
              "recipient": {
                "id": event.sender.id
              },
              "message":{
                "text": "Need more convincing?",
                "quick_replies":[
                  {
                    "content_type":"text",
                    "title":"Nope, sign me up!",
                    "payload":"SIGN_UP",
                  },
                  {
                    "content_type":"text",
                    "title":"Yes I do...",
                    "payload":"SEND_FAQ",
                  }
                ]
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
          }, 3000)
        }

        if (event.message.quick_reply.payload === 'ADDING') {
          sendTextMessage(event.sender.id, user.pageAccessToken, 'Irrigate gives you a unique link that you can share anywhere, with everyone. They just click the link to get started. It’s that easy.')
          setTimeout(() => {
            let messageData = {
              "recipient": {
                "id": event.sender.id
              },
              "message":{
                "text": "Need more convincing?",
                "quick_replies":[
                  {
                    "content_type":"text",
                    "title":"Nope, sign me up!",
                    "payload":"SIGN_UP",
                  },
                  {
                    "content_type":"text",
                    "title":"Yes I do...",
                    "payload":"SEND_FAQ",
                  }
                ]
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
          }, 3000)
        }

        if (event.message.quick_reply.payload === 'WHY') {
          sendTextMessage(event.sender.id, user.pageAccessToken, 'We believe in the importance of starting conversations. We know that the value of an organization or a business isn’t proportional to its “marketing” budget. Our goal is to help you connect with the people who appreciate what you’re doing. We’re not inspired by branding or consumers; our goal is helping you communicate with like-minded people in a genuine way.')
          setTimeout(() => {
            let messageData = {
              "recipient": {
                "id": event.sender.id
              },
              "message":{
                "text": "Need more convincing?",
                "quick_replies":[
                  {
                    "content_type":"text",
                    "title":"Nope, sign me up!",
                    "payload":"SIGN_UP",
                  },
                  {
                    "content_type":"text",
                    "title":"Yes I do...",
                    "payload":"SEND_FAQ",
                  }
                ]
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
          }, 3000)
        }

        if (event.message.quick_reply.payload === 'NEXT') {
          sendTextMessage(event.sender.id, user.pageAccessToken, 'Right now, we can add features based on the request of businesses, nonprofits, sports teams or anyone who needs to talk to their community. In the future, those same solutions will be readymade. That means bonuses like analytics that tell you how and why people interact with your messages, or whether video or text messages are more effective, to name just a couple. And soon you’ll be able to send messages not only through Messenger but through iMessage and WhatsApp too.')
          setTimeout(() => {
            let messageData = {
              "recipient": {
                "id": event.sender.id
              },
              "message":{
                "text": "Need more convincing?",
                "quick_replies":[
                  {
                    "content_type":"text",
                    "title":"Nope, sign me up!",
                    "payload":"SIGN_UP",
                  },
                  {
                    "content_type":"text",
                    "title":"Yes I do...",
                    "payload":"SEND_FAQ",
                  }
                ]
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
          }, 3000)
        }


        if (event.message.quick_reply.payload === 'SIGN_UP') {
          sendTextMessage(event.sender.id, user.pageAccessToken, 'Go ahead and visit us at www.irrigatemessaging.com to sign up!')
        }
      } else {
        sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for your message! We will get back to you shortly.')
      }
    })
  }


})



module.exports = irrigateRouter
