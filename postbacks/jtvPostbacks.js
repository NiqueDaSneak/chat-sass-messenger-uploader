'use strict'

var db = require('../data/jtvData.js')

var Message = require('../models/messageModel.js')
var Group = require('../models/groupModel.js')
var User = require('../models/userModel.js')
var Member = require('../models/memberModel.js')

var request = require('request')
var moment = require('moment')


module.exports = (event) => {
  if (event.postback.payload === "GET_STARTED_PAYLOAD") {
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
                sendTextMessage(event.sender.id, user.pageAccessToken, 'This is some great intro copy to explain the experience!')
                  sendVideoMessage(event.sender.id, user.pageAccessToken, 'https://chat-sass-messenger-uploader.herokuapp.com/data/jtv.mp4')
                // setTimeout(() => {
                //
                // }, 8000)
                resolve()
              })
            })
          } else {
            // sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome back to Gem & Jewels TV!')
            sendTextMessage(event.sender.id, user.pageAccessToken, "Tap the 'Shop Now' button below to begin.")
            resolve()
          }
        })
      })
    }

    getUser().then((user) => {
      findMember(user)
    })
    // send intro copy
    // send inital video msg
    // send menu description msg
  }

  if (event.postback.payload === "SHOW_CATS") {

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
        "message": {
          "attachment": {
            "type": "template",
            "payload": {
              "template_type": "list",
              "top_element_style": "compact",
              "elements": [
                {
                  "title": "Search Jewelry Type",
                  "subtitle": "See all our colors",
                  "image_url": "http://via.placeholder.com/350x350",
                  "buttons": [
                    {
                      "title": "Search Jewelry Type",
                      "type": "postback",
                      "payload": "CAT_TYPE_JEWEL"
                    }
                  ]
                },
                {
                  "title": "Search Gem Type",
                  "subtitle": "See all our colors",
                  "image_url": "http://via.placeholder.com/350x350",
                  "buttons": [
                    {
                      "title": "Search Gem Type",
                      "type": "postback",
                      "payload": "CAT_TYPE_GEM"
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
    // send list template
      // 'search jewlery type'
        // postback === 'CAT_TYPE_JEWEL'
      // 'search gem type'
        // postback === 'CAT_TYPE_GEM'
      // 'jewel school'
        // postback === 'CAT_TYPE_SCHOOL'
  }

  if (event.postback.payload === "DONE") {
    // use event.sender.id => get cart id => get cart array
    // send cart array as carosel
      // item
        // 'REMOVE_' + item.id
        // PAY
    // add up each item.price into variable
    // send textMsg => 'Your total is $' + items totaled up
  }

  if (event.postback.payload === "PAY") {
    // send button template => 'Do you want to use stored credit card, or add one?'
      // buttons
        // Stored
          // 'STORED_' + cart.id
        // 'CHARGE_' + cart.id
  }

  if (event.postback.payload === "CALL_NOW") {
  }

  if (event.postback.payload === "VIEW_SITE") {
  }

  if (event.postback.payload === "GEMOPEDIA") {
  }

  if (event.postback.payload.split('_')[0] === "STORED") {
    // event.postback.payload.split('_')[1] => find cart
    // use cart info to send receipt
  }

  if (event.postback.payload.split('_')[0] === "CHARGE") {
    // event.postback.payload.split('_')[1] => find cart
    // render webview and send cart information to webview
    // wait 20 seconds and send reciept
  }


  if (event.postback.payload.split('_')[0] === "CAT" && event.postback.payload.split('_')[1] === "TYPE") {

    if (event.postback.payload.split('_')[2] === "JEWEL") {
      // show carosel of categories
        // rings
          // postback === 'CAT_TYPE_RINGS'
    }

    if (event.postback.payload.split('_')[2] === "GEM") {
    }

    if (event.postback.payload.split('_')[2] === "SCHOOL") {
    }

    if (event.postback.payload.split('_')[2] === "RINGS") {
      // send carosel of rings in db.rings
      // item
        // buttons
          // postbacks
            // 'ADD_CART_' + db.rings.id
            // 'DETAILS_' + db.rings.url
            // SHOW_CATS

    }

  }

  if (event.postback.payload.split('_')[0] === "ADD" && event.postback.payload.split('_')[1] === "CART") {
      // use event.postback.payload.split('_')[2] to find item in DB
      // check db for user => event.sender.id
      // if no user
        // create new user and new cart
      // check cart id from user
      // add item id to cart => array of values
  }

  if (event.postback.payload.split('_')[0] === "DETAILS") {
    // use event.postback.payload.split('_')[1] which is url to load webview
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
