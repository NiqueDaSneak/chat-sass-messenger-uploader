'use strict'

var db = require('diskdb')
db = db.connect('data', ['ski'])

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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Hey there! Welcome to the See N Ski Messenger Experience!')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, "Instructions: Click 'Reserve Now' in the menu below to make a purchase.")
              }, 8000)
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

    if (event.message.quick_reply.payload.split('_')[0] === 'LOCATION') {
      if (event.message.quick_reply.payload.split('_')[1] === 'UNKNOWN') {
        getUser().then((user) => {

          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "text": "Choose your area:",
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Deer Valley",
                  "payload":"LOCATION_1,8,13,14"
                },
                {
                  "content_type":"text",
                  "title":"Midvale",
                  "payload":"LOCATION_3,5,6,7,8"
                },
                {
                  "content_type":"text",
                  "title":"Ogden",
                  "payload":"LOCATION_1,4"
                },
                {
                  "content_type":"text",
                  "title":"Park City",
                  "payload":"LOCATION_1,9,10,11,12"
                },
                {
                  "content_type":"text",
                  "title":"Sandy",
                  "payload":"LOCATION_2,3,5,6,7"
                },
                {
                  "content_type":"text",
                  "title":"Salt Lake City",
                  "payload":"LOCATION_1,8,9,10,11"
                },
              ]
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        })
      } else {
        var locations = JSON.parse("[" + event.message.quick_reply.payload.split('_')[1] + "]")

        getUser().then((user) => {
          sendImageMessage(event.sender.id, user.pageAccessToken, 'https://www.skinsee.com/resources/images/mapRates3-all.jpg')

          setTimeout(() => {
            let quickReplies = []
            for (var i = 0; i < locations.length; i++) {

              let btn = {
                "content_type":"text",
                "title": locations[i],
                "payload":"CHOOSE_DATE"
              }

              quickReplies.push(btn)
            }

            let messageData = {
              "recipient":{
                "id": event.sender.id
              },
              "message":{
                "text": "Select your pickup location:",
                "quick_replies": quickReplies
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
          }, 6000)
        })
      }

      // if (event.message.quick_reply.payload.split('_')[1] === 'UNKNOWN') {}

      // if (event.message.quick_reply.payload.split('_')[1] === 'UNKNOWN') {}

    }

    if (event.message.quick_reply.payload === 'CHOOSE_DATE') {

      getUser().then((user) => {

        let messageData = {
          "recipient":{
            "id": event.sender.id
          },
          "message":{
            "text": "Select a date:",
            "quick_replies": [
              {
                "content_type":"text",
                "title": '2/1/18',
                "payload":"PRODUCTS"
              },
              {
                "content_type":"text",
                "title": '2/2/18',
                "payload":"PRODUCTS"
              },
              {
                "content_type":"text",
                "title": '2/3/18',
                "payload":"PRODUCTS"
              },
              {
                "content_type":"text",
                "title": '2/4/18',
                "payload":"PRODUCTS"
              },
              {
                "content_type":"text",
                "title": '2/5/18',
                "payload":"PRODUCTS"
              },
              {
                "content_type":"text",
                "title": '2/6/18',
                "payload":"PRODUCTS"
              },
              {
                "content_type":"text",
                "title": '2/7/18',
                "payload":"PRODUCTS"
              },
              {
                "content_type":"text",
                "title": '2/8/18',
                "payload":"PRODUCTS"
              },
              {
                "content_type":"text",
                "title": '2/9/18',
                "payload":"PRODUCTS"
              },
              {
                "content_type":"text",
                "title": '2/10/18',
                "payload":"PRODUCTS"
              }
            ]
          }
        }
        callSendAPI(user.pageAccessToken, messageData)
      })

    }

    if (event.message.quick_reply.payload === 'PRODUCTS') {

      var elements = []
      for (var i = 0; i < db.ski.find().length; i++) {
        let obj = {}
        obj.title = db.ski.find()[i].name
        obj.image_url = db.ski.find()[i].url
        obj.subtitle = db.ski.find()[i].description
        obj.buttons = [
          {
            "type":"postback",
            "title":"Reserve: $" + db.ski.find()[i].price,
            "payload":"CART_" + db.ski.find()[i].id
          },
        ]
        elements.push(obj)
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
                "template_type":"generic",
                "sharable": true,
                // "image_aspect_ratio": "square",
                "elements": elements
              }
            }
          }
        }
        callSendAPI(user.pageAccessToken, messageData)
      })
    }



  }

  if (event.postback) {

    if (event.postback.payload.split('_')[0] === "CART") {
      if (db.users.find({ id: event.sender.id }).length === 0) {
        let newUser = {
          id: event.sender.id,
          cart: [ event.postback.payload.split('*')[1] ]
        }
        db.users.save(newUser)
        console.log(db.users.find({ id: event.sender.id }))
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
                      "title":"Thanks for starting a cart with us! Continue shopping or tap 'Done Shopping'.",
                      "buttons":[
                        {
                          "type":"postback",
                          "title":"Done Shopping",
                          "payload":"DONE"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
          // sendTextMessage(event.sender.id, user.pageAccessToken, "Thanks for starting a cart with us! Continue shopping below or tap 'Done Shopping' below.")
        })
      } else {

        let cart = db.users.find({ 'id': event.sender.id })[0].cart
        cart.push(event.postback.payload.split('*')[1])

        var query = {
          id: event.sender.id
        }

        var dataToBeUpdate = {
          cart : cart
        }

        var options = {
          multi: false,
          upsert: false
        }

        db.users.update(query, dataToBeUpdate, options)
        console.log(db.users.find({ id: event.sender.id }))
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
                      "title":"Added to cart!",
                      "buttons":[
                        {
                          "type":"postback",
                          "title":"Done Shopping",
                          "payload":"DONE"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
          // sendTextMessage(event.sender.id, user.pageAccessToken, "Item added to cart.")
        })
      }
      // SHOW OPTIONS AGAIN
      var elements = []
      for (var i = 0; i < db.ski.find().length; i++) {
        let obj = {}
        obj.title = db.ski.find()[i].name
        obj.image_url = db.ski.find()[i].url
        obj.subtitle = db.ski.find()[i].description
        obj.buttons = [
          {
            "type":"postback",
            "title":"Reserve: $" + db.ski.find()[i].price,
            "payload":"CART_" + db.ski.find()[i].id
          },
        ]
        elements.push(obj)
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
                "template_type":"generic",
                "sharable": true,
                // "image_aspect_ratio": "square",
                "elements": elements
              }
            }
          }
        }
        callSendAPI(user.pageAccessToken, messageData)
      })
    }

    if (event.postback.payload === "DONE") {
      var cost = 0
      for (var i = 0; i < db.users.find({ 'id': event.sender.id })[0].cart.length; i++) {

        var itemID = "*" + db.users.find({ 'id': event.sender.id })[0].cart[i]
        cost = cost + Number(db.bracelets.find({ id: itemID })[0].price)
      }
      console.log(cost)
    }

    if (event.postback.payload === "GET_STARTED_PAYLOAD") {
      // ENROLLING MEMBERS INTO THE IRRIGATE APP
      getUser().then((user) => {
        findMember(user)
      })
    }

    if (event.postback.payload === "RESERVE") {

      getUser().then((user) => {

        let messageData = {
          "recipient":{
            "id": event.sender.id
          },
          "message":{
            "text": "Where are you staying or skiing?",
            "quick_replies":[
              {
                "content_type":"text",
                "title":"Just Skiing/Not Sure",
                "payload":"LOCATION_UNKNOWN"
              },
              {
                "content_type":"text",
                "title":"Alta & Snowbird",
                "payload":"LOCATION_2,3,5,6,7"
              },
              {
                "content_type":"text",
                "title":"Brighton & Solitude",
                "payload":"LOCATION_3,5,6,7,8"
              },
              {
                "content_type":"text",
                "title":"Deer Valley",
                "payload":"LOCATION_1,8,13,14"
              },
              {
                "content_type":"text",
                "title":"Park City",
                "payload":"LOCATION_1,8,9,10,11"
              },
              {
                "content_type":"text",
                "title":"Snowbasin/Powder Mt",
                "payload":"LOCATION_1,4"
              }
            ]
          }
        }
        callSendAPI(user.pageAccessToken, messageData)
      })
    }

    if (event.postback.payload === "CALL") {
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
                "text":"Need further assistance? Talk to a representative",
                "buttons":[
                  {
                    "type":"phone_number",
                    "title":"Call Representative",
                    "payload":"800-722-3685"
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
