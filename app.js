'use strict'

// NPM PACKAGES
var express = require('express')
var bodyParser = require('body-parser')
var moment = require('moment')
var request = require('request')
var path = require('path')

// APP DEFINITIONS
var app = express()
var nightmakersRouter = express.Router()
var affirmationTodayRouter = express.Router()
// var irrigateRouter = express.Router()

// DATABASE SETUP
var mongoose = require('mongoose')
mongoose.connect('mongodb://domclemmer:domclemmerpasswordirrigate@ds153173-a0.mlab.com:53173,ds153173-a1.mlab.com:53173/irrigate?replicaSet=rs-ds153173', {useMongoClient: true})
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
var affirmationSchema = mongoose.Schema({
  text: String
})

var Message = require('../models/messageModel.js')
var Group = require('../models/groupModel.js')
var User = require('../models/userModel.js')
var member = require('../models/memberModel.js')

// MIDDLEWARE
app.use('/static', express.static('images'))
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())
// var nightmakers = require('./router/nightmakers.js')
app.use('/nightmakers', nightmakersRouter)
app.use('/affirmation-today', affirmationTodayRouter)

const irrigateRouter = require('./router/irrigateRouter.js')
app.use('/irrigate', irrigateRouter)

// ROUTES
app.get('/', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'jai_jai_ganesha') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge'])
  } else {
    console.error("Failed validation. Make sure the validation tokens match.")
    res.sendStatus(403)
  }
})

app.post('/', (req, res) => {
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

        if (event.recipient.id === '1420531884696101') {
          return res.redirect(307, '/nightmakers')
        }

        if (event.recipient.id === '307853062976814') {
          return res.redirect(307, '/affirmation-today')
        }

        if (event.recipient.id === '530374163974187') {
          return res.redirect(307, '/irrigate')
        }

        if (event.message) {

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
            if (user.messageResponse) {
              // send it to event.sender.id as a text message
            } else {
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for your message! We will get back to you shortly.')
            }
          })
        } else if (event.postback) {

          if (event.postback.payload === 'GET_STARTED_PAYLOAD') {

            // ENROLLING MEMBERS INTO THE IRRIGATE APP
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
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for signing up. More content to come!')
                        resolve()
                      })
                    })
                  } else {
                    sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome back!')
                    resolve()
                  }
                })
              })
            }

            getUser().then((user) => {
              findMember(user)
            })
          } else {
            eventHandler(event)
          }
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
      Message.findOne({ id: req.body.id }, (err, msg) => {
        if (err) {
          console.log(err)
        }

        if (msg === null) {
          console.log('message deleted')
        } else {
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
        }
      })
    })
  }
})

// irrigateRouter.post('/', (req, res, next) => {
//   var data = req.body
//   // Make sure this is a page subscription
//   if (data.object === 'page') {
//     // Iterate over each entry - there may be multiple if batched
//     console.log('data.entry: ' + JSON.stringify(data.entry))
//     data.entry.forEach(function(entry) {
//       var pageID = entry.id
//       var timeOfEvent = entry.time
//       // Iterate over each messaging event
//       entry.messaging.forEach(function(event) {
//         if (event.message) {
//
//           function getUser() {
//             return new Promise(function(resolve, reject) {
//               User.findOne({
//                 'pageID': event.recipient.id
//               }, (err, user) => {
//                 resolve(user)
//               })
//             })
//           }
//
//           getUser().then((user) => {
//             if (event.message.quick_reply) {
//               if (event.message.quick_reply.payload === 'SEND_FAQ') {
//                 let messageData = {
//                   "recipient": {
//                     "id": event.sender.id
//                   },
//                   "message":{
//                     "text": "Check out these frequently asked questions:",
//                     "quick_replies":[
//                       {
//                         "content_type":"text",
//                         "title":"Irrigate costs?",
//                         "payload":"COST",
//                       },
//                       {
//                         "content_type":"text",
//                         "title":"Adding members?",
//                         "payload":"ADDING",
//                       },
//                       {
//                         "content_type":"text",
//                         "title":"Why did we start?",
//                         "payload":"WHY",
//                       },
//                       {
//                         "content_type":"text",
//                         "title":"What’s next?",
//                         "payload":"NEXT",
//                       },
//                     ]
//                   }
//                 }
//                 callSendAPI(user.pageAccessToken, messageData)
//               }
//
//               if (event.message.quick_reply.payload === 'COST') {
//                 sendTextMessage(event.sender.id, user.pageAccessToken, "I'm going to send you a photo of our pricing list...")
//                 setTimeout(() => {
//                   let messageData = {
//                     "recipient": {
//                       "id": event.sender.id
//                     },
//                     "message":{
//                       "text": "Need more convincing?",
//                       "quick_replies":[
//                         {
//                           "content_type":"text",
//                           "title":"Nope, sign me up!",
//                           "payload":"SIGN_UP",
//                         },
//                         {
//                           "content_type":"text",
//                           "title":"Yes I do...",
//                           "payload":"SEND_FAQ",
//                         }
//                       ]
//                     }
//                   }
//                   callSendAPI(user.pageAccessToken, messageData)
//                 }, 3000)
//               }
//
//               if (event.message.quick_reply.payload === 'ADDING') {
//                 sendTextMessage(event.sender.id, user.pageAccessToken, 'Irrigate gives you a unique link that you can share anywhere, with everyone. They just click the link to get started. It’s that easy.')
//                 setTimeout(() => {
//                   let messageData = {
//                     "recipient": {
//                       "id": event.sender.id
//                     },
//                     "message":{
//                       "text": "Need more convincing?",
//                       "quick_replies":[
//                         {
//                           "content_type":"text",
//                           "title":"Nope, sign me up!",
//                           "payload":"SIGN_UP",
//                         },
//                         {
//                           "content_type":"text",
//                           "title":"Yes I do...",
//                           "payload":"SEND_FAQ",
//                         }
//                       ]
//                     }
//                   }
//                   callSendAPI(user.pageAccessToken, messageData)
//                 }, 3000)
//               }
//
//               if (event.message.quick_reply.payload === 'WHY') {
//                 sendTextMessage(event.sender.id, user.pageAccessToken, 'We believe in the importance of starting conversations. We know that the value of an organization or a business isn’t proportional to its “marketing” budget. Our goal is to help you connect with the people who appreciate what you’re doing. We’re not inspired by branding or consumers; our goal is helping you communicate with like-minded people in a genuine way.')
//                 setTimeout(() => {
//                   let messageData = {
//                     "recipient": {
//                       "id": event.sender.id
//                     },
//                     "message":{
//                       "text": "Need more convincing?",
//                       "quick_replies":[
//                         {
//                           "content_type":"text",
//                           "title":"Nope, sign me up!",
//                           "payload":"SIGN_UP",
//                         },
//                         {
//                           "content_type":"text",
//                           "title":"Yes I do...",
//                           "payload":"SEND_FAQ",
//                         }
//                       ]
//                     }
//                   }
//                   callSendAPI(user.pageAccessToken, messageData)
//                 }, 3000)
//               }
//
//               if (event.message.quick_reply.payload === 'NEXT') {
//                 sendTextMessage(event.sender.id, user.pageAccessToken, 'Right now, we can add features based on the request of businesses, nonprofits, sports teams or anyone who needs to talk to their community. In the future, those same solutions will be readymade. That means bonuses like analytics that tell you how and why people interact with your messages, or whether video or text messages are more effective, to name just a couple. And soon you’ll be able to send messages not only through Messenger but through iMessage and WhatsApp too.')
//                 setTimeout(() => {
//                   let messageData = {
//                     "recipient": {
//                       "id": event.sender.id
//                     },
//                     "message":{
//                       "text": "Need more convincing?",
//                       "quick_replies":[
//                         {
//                           "content_type":"text",
//                           "title":"Nope, sign me up!",
//                           "payload":"SIGN_UP",
//                         },
//                         {
//                           "content_type":"text",
//                           "title":"Yes I do...",
//                           "payload":"SEND_FAQ",
//                         }
//                       ]
//                     }
//                   }
//                   callSendAPI(user.pageAccessToken, messageData)
//                 }, 3000)
//               }
//
//
//               if (event.message.quick_reply.payload === 'SIGN_UP') {
//                 sendTextMessage(event.sender.id, user.pageAccessToken, 'Go ahead and visit us at www.irrigatemessaging.com to sign up!')
//               }
//             } else {
//               sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for your message! We will get back to you shortly.')
//             }
//           })
//         } else if (event.postback) {
//
//           if (event.postback.payload === 'GET_STARTED_PAYLOAD') {
//
//             // ENROLLING MEMBERS INTO THE IRRIGATE APP
//             function getUser() {
//               return new Promise(function(resolve, reject) {
//                 User.findOne({
//                   'pageID': event.recipient.id
//                 }, (err, user) => {
//                   resolve(user)
//                 })
//               })
//             }
//
//             function findMember(user) {
//               return new Promise(function(resolve, reject) {
//                 Member.findOne({
//                   fbID: event.sender.id
//                 }, (err, member) => {
//                   if (err) {
//                     console.error(err)
//                   }
//                   if (member === null) {
//                     request({
//                       uri: 'https://graph.facebook.com/v2.6/' + event.sender.id + '?access_token=' + user.pageAccessToken,
//                       method: 'GET'
//                     }, function(error, response, body) {
//                       if (error) {
//                         return console.error('upload failed:', error)
//                       }
//                       var facebookProfileResponse = JSON.parse(body)
//
//                       // NEED TO FIND ORG NAME AND REPLACE BELOW
//                       var newMember = new Member({
//                         organization: user.organization,
//                         fbID: event.sender.id,
//                         fullName: facebookProfileResponse.first_name + ' ' + facebookProfileResponse.last_name,
//                         photo: facebookProfileResponse.profile_pic,
//                         timezone: facebookProfileResponse.timezone,
//                         createdDate: moment().format('MM-DD-YYYY')
//                       })
//
//                       if (facebookProfileResponse.gender) {
//                         newMember.gender = facebookProfileResponse.gender
//                       }
//
//                       newMember.save((err, member) => {
//                         if (err) return console.error(err)
//                         // sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for signing up. More content to come!')
//                         resolve(user)
//                       })
//                     })
//                   } else {
//                     // sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome back!')
//                     resolve(user)
//                   }
//                 })
//               })
//             }
//
//             getUser().then((user) => {
//               findMember(user).then((user) => {
//                 let welcomeMsg = new Promise(function(resolve, reject) {
//                   sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for your interest in Irrigate Messaging, where small businesses engage and grow!')
//                   resolve()
//                 })
//
//                 let faqGate = new Promise(function(resolve, reject) {
//                   let messageData = {
//                     "recipient":{
//                       "id": event.sender.id
//                     },
//                     "message":{
//                       "text": "Still wondering how Irrigate can help your business?",
//                       "quick_replies":[
//                         {
//                           "content_type":"text",
//                           "title":"Yes I am",
//                           "payload":"SEND_FAQ",
//                         },
//                         {
//                           "content_type":"text",
//                           "title":"No, sign me up!",
//                           "payload":"SIGN_UP",
//                         },
//                       ]
//                     }
//                   }
//                   setTimeout(() => {
//                     callSendAPI(user.pageAccessToken, messageData)
//                     resolve()
//                   }, 2000)
//                 })
//
//                 welcomeMsg.then(() => {
//                   faqGate
//                 })
//               })
//             })
//           } else {
//             eventHandler(event)
//           }
//         } else {
//           console.log("Webhook received unknown event: ", data)
//         }
//       })
//     })
//     res.sendStatus(200)
//   } else {
//
//     // SENDING A SCHEDULED MESSAGE
//     User.findOne({
//       'organization': req.body.organization
//     }, (err, user) => {
//       if (err) {
//         console.log(err)
//       }
//
//       var sendees = []
//       var getSendees = new Promise(function(resolve, reject) {
//         if (req.body.groupNames) {
//           for (var i = 0; i < req.body.groupNames.length; i++) {
//             Group.findOne({
//               groupName: req.body.groupNames[i],
//               organization: req.body.organization
//             }, (err, group) => {
//               if (err) {
//                 return console.error(err)
//               } else {
//                 console.log(group)
//                 for (var i = 0; i < group.groupMembers.length; i++) {
//                   sendees.push(group.groupMembers[i])
//                 }
//                 resolve(sendees)
//               }
//             })
//           }
//         } else {
//           resolve(sendees)
//         }
//       })
//
//       getSendees.then((sendees) => {
//         let checkSendeeLength = new Promise(function(resolve, reject) {
//           if (sendees.length === 0) {
//             Member.find({organization: req.body.organization}, (err, members) => {
//               if (err) {
//                 console.log(err)
//               }
//               for (var i = 0; i < members.length; i++) {
//                 sendees.push(members[i].fbID)
//               }
//               resolve(sendees)
//             })
//           } else {
//             resolve(sendees)
//           }
//         })
//
//         checkSendeeLength.then((sendees) => {
//           for (var i = 0; i < sendees.length; i++) {
//               var sendImage = new Promise(function(resolve, reject) {
//                 if (req.body.image) {
//                   sendImageMessage(sendees[i], user.pageAccessToken, req.body.image)
//                   console.log('sending image message...')
//                   resolve()
//                 } else {
//                   resolve()
//                 }
//               })
//
//               var sendVideo = new Promise(function(resolve, reject) {
//                 if (req.body.videoURL) {
//                   console.log('sending video link...')
//                   sendVideoMessage(sendees[i], user.pageAccessToken, req.body.videoURL)
//                   resolve()
//                 } else {
//                   resolve()
//                 }
//               })
//
//
//
//               var sendText = new Promise(function(resolve, reject) {
//                 if (req.body.text) {
//                   sendTextMessage(sendees[i], user.pageAccessToken, req.body.text)
//                   console.log('sending text message...')
//                   resolve()
//                 } else {
//                   resolve()
//                 }
//               })
//
//               sendImage.then(() => {
//                 sendVideo.then(() => {
//                   sendText
//                 })
//               })
//               res.sendStatus(200)
//           }
//         })
//       })
//     })
//   }
// })

affirmationTodayRouter.post('/', (req, res, next) => {
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
            if (event.message.quick_reply) {

              if (event.message.quick_reply.payload === 'SEND_RANDOM_AFFIRMATION') {
                let randomAffs = [
                  "Peace of mind is my natural state. The universe is conspiring in my favor.",
                  "Fear is an illusion; False Evidence Appearing Real.",
                  "I can handle what is in front of me; I can, I will, I must."
                ]

                let msgArray = [
                  "I have the perfect one for you:",
                  "...you should like this one then:",
                  "Check this one out:"
                ]

                let sendAffirmationMsg = new Promise(function(resolve, reject) {
                  sendTextMessage(event.sender.id, user.pageAccessToken, msgArray[Math.floor(Math.random() * 3)])
                  setTimeout(() => {
                    sendTextMessage(event.sender.id, user.pageAccessToken, randomAffs[Math.floor(Math.random() * 3)])
                    resolve()
                  }, 1500)
                })

                let sendStoreMsg = new Promise(function(resolve, reject) {
                  let messageData = {
                    "recipient":{
                      "id": event.sender.id
                    },
                    "message":{
                      "text": "Are you interested in doing a little shopping with us?",
                      "quick_replies":[
                        {
                          "content_type":"text",
                          "title":"Sure!",
                          "payload":"STORE"
                        },
                        {
                          "content_type":"text",
                          "title":"Not Interested",
                          "payload":"NO_STORE"
                        }
                      ]
                    }
                  }
                  setTimeout(() => {
                    callSendAPI(user.pageAccessToken, messageData)
                    resolve()
                  }, 2000)
                })

                sendAffirmationMsg.then(() => {
                  sendStoreMsg
                })
              }

              if (event.message.quick_reply.payload === 'NO_STORE') {
                sendTextMessage(event.sender.id, user.pageAccessToken, "Thanks for playing! I will talk to you soon!")
              }

              if (event.message.quick_reply.payload === 'STORE') {
                let messageData = {
                  "recipient":{
                    "id": event.sender.id
                  },
                  "message":{
                    "text": "Choose a category:",
                    "quick_replies":[
                      {
                        "content_type":"text",
                        "title":"Accessories",
                        "payload":"ACCESSORIES"
                      },
                      {
                        "content_type":"text",
                        "title":"Clothing",
                        "payload":"CLOTHING"
                      }
                    ]
                  }
                }
                callSendAPI(user.pageAccessToken, messageData)
              }

              if (event.message.quick_reply.payload === 'ACCESSORIES') {
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
              }

              if (event.message.quick_reply.payload === 'CLOTHING') {
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
              }


            } else {
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for your message! We will get back to you shortly.')
            }
          })
        } else if (event.postback) {

          if (event.postback.payload === 'GET_STARTED_PAYLOAD') {

            // ENROLLING MEMBERS INTO THE IRRIGATE APP
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

            getUser().then((user) => {
              findMember(user).then((user) => {
                let welcomeMsg = new Promise(function(resolve, reject) {
                  sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for messaging Affirmation.Today! Walk through this demo to get a feel for what Irrigate can help create for your business.')
                  resolve()
                })

                let howAreYouMsg = new Promise(function(resolve, reject) {
                  let messageData = {
                    "recipient":{
                      "id": event.sender.id
                    },
                    "message":{
                      "text": "How are you feeling today?",
                      "quick_replies":[
                        {
                          "content_type":"text",
                          "title":"Awesome!",
                          "payload":"SEND_RANDOM_AFFIRMATION"
                        },
                        {
                          "content_type":"text",
                          "title":"Annoyed",
                          "payload":"SEND_RANDOM_AFFIRMATION"
                        },
                        {
                          "content_type":"text",
                          "title":"...meh",
                          "payload":"SEND_RANDOM_AFFIRMATION"
                        },
                        {
                          "content_type":"text",
                          "title":"Depressed",
                          "payload":"SEND_RANDOM_AFFIRMATION"
                        }
                      ]
                    }
                  }
                  setTimeout(() => {
                    callSendAPI(user.pageAccessToken, messageData)
                    resolve()
                  }, 2000)
                })

                welcomeMsg.then(() => {
                    howAreYouMsg
                })
              })
            })
          }


          if (event.postback.payload === 'ADD_CART_ACC') {
            let initialResponse = new Promise(function(resolve, reject) {
              let randomResponse = [
                "Nice pick up!",
                "Love it!",
                "This one is great!"
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

          if (event.postback.payload === 'ADD_CART_CLO') {
            let initialResponse = new Promise(function(resolve, reject) {
              let randomResponse = [
                "Nice pick up!",
                "Love it!",
                "This one is great!"
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
                        "street_1":"213 Mulberry St",
                        "street_2":"",
                        "city":"Cincinnati",
                        "postal_code":"45202",
                        "state":"OH",
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
                sendTextMessage(event.sender.id, user.pageAccessToken, "We really appreciate your business!")
              }, 5000)
            })
          }

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
})

nightmakersRouter.post('/', (req, res, next) => {
  console.log('sucessfully passed to diff router')
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
            if (user.messageResponse) {
              // send it to event.sender.id as a text message
            } else {
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for your message! We will get back to you shortly.')
            }
          })

        } else if (event.postback) {

          if (event.postback.payload === 'GET_STARTED_PAYLOAD') {

            // ENROLLING MEMBERS INTO THE IRRIGATE APP
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
                        timezone: facebookProfileResponse.timezone
                      })

                      if (facebookProfileResponse.gender) {
                        newMember.gender = facebookProfileResponse.gender
                      }

                      newMember.save((err, member) => {
                        if (err) return console.error(err)
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for signing up with the Nightmakers. More content to come!')
                        resolve()
                      })
                    })
                  } else {
                    sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome back!')
                    resolve()
                  }
                })
              })
            }

            getUser().then((user) => {
              findMember(user)
            })
          } else {
            switch (event.postback.payload) {
              case 'BUY_SECTION':
                // need to create inventory item model
                  // price, image, title
                // generate flow control: send section lists/prices => on selection (section) =>
                // send bottle options => then (bottle option, section) => ask if they want a bottle =>
                // if yes => send bottle list, if no, send link to spend money and save to list
                console.log(event.postback.payload)
                break
              case 'BUY_BOTTLE':
                // send bottle list => then (bottle array) => ask if they want more bottles, if yes, send bottle list, else => send link to spend money
                console.log(event.postback.payload)
                break
              case 'WIN_SECTION':
                // just save their user id into a list => send text confirmation message
                console.log(event.postback.payload)
                break
              case 'EVENTS':
                // send flyer image & video link
                console.log(event.postback.payload)
                break
              case 'BECOME_NIGHTMAKER':
                // create a list => send text confirmation message
                console.log(event.postback.payload)
                break
              case 'SHOP':
                // send text that says 'coming soon'
                console.log(event.postback.payload)
                break
              case 'MENU':
                // send text that says 'coming soon'
                console.log(event.postback.payload)
                break
              default:

            }
            console.log(event.postback.payload)
          }
        } else {
          console.log("Webhook received unknown event: ", data)
        }
      })
    })
  }

  res.sendStatus(200)
})



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

function sendVideoMessage(recipientId, accessToken, videoURL) {
  var messageData = {
    "recipient": {
      "id": recipientId
    },
    "message": {
      "text": videoURL
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

function sendImageMessage(recipientId, accessToken,  url) {
  var rand = Math.floor((Math.random() * 23) + 1);

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

// SERVER LISTENING
var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log('Server running on port ' + port)
})
app.on('error', function() {
  console.log(error)
})
