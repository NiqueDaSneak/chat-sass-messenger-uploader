'use strict'

const irrigateRouter = require('express').Router()

var Message = require('../models/messageModel.js')
var Group = require('../models/groupModel.js')
var User = require('../models/userModel.js')
var Member = require('../models/memberModel.js')

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
        console.log('BEFORE EVENT HANDLERS ARE CALLED')
        if (event.message) {
          eventMessageHandler(event)
        } else if (event.postback) {
          console.log('BEFORE EVENT POSTBACK HANDLER')

          function eventPostbackHandler(event) {
              if (event.postback.payload === 'GET_STARTED_PAYLOAD') {
                console.log('payload: ' + event.postback.payload)
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
                        // resolve(user)
                      })
                    })
                  } else {
                    sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome back!')
                    // resolve(user)
                  }
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

  function getUser() {
    return new Promise(function(resolve, reject) {
      User.findOne({
        'pageID': event.recipient.id
      }, (err, user) => {
        resolve(user)
      })
    })
  }

})



module.exports = irrigateRouter
