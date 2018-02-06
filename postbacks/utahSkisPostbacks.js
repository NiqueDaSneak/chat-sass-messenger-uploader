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

              // sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome to the UNC Shuford Program Messenger Experience.')
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

        })
      }

      if (event.postback.payload === 'SHOP') {
        getUser().then((user) => {
          // SEND INITIAL CATS => CATS_MENS, CATS_WOMENS, CATS_KIDS, SUMMER
        })
      }

      if (event.postback.payload.split('_')[0] === 'CATS') {
        if (event.postback.payload.split('_').length > 2) {
          var gender = event.postback.payload.split('_')[2]
          var category = event.postback.payload.split('_')[1]
          getUser().then((user) => {
          // if category === SKI, SNOW, OUTER, CLOTH, ACCESS
            // show specific lists
              // SKI
                // SKIS, DEMOSKIS, SKI BOOTS, SKI BINDINGS, SKI POLES
                // postback: SHOWPRODUCTS_ + category_name
              // SNOW
                // SNOWBOARDS, DEMO SNOWBOARDS, SNOWBOARD BINDINGS, SNOWBOARD BOOTS
              // OUTER
                // JACKETS, SKI PANTS, BIBS
              // CLOTH
                // FLEECE, HOODIES, SWEATERS, TURUTLENECKS, THERMALS, TSHIRTS, SHOCKS
              // ACCESS
                // GLOVES, GOGGLES, HELMETS, BAGS, AVALANCE, AUDIO
          })

        } else {
          var gender = event.postback.payload.split('_')[1]
          getUser().then((user) => {
            // CATS_SKI_WOMENS, CATS_SNOW_MENS, CATS_OUTER_KIDS, CATS_CLOTH_MENS, CATS_ACCESS_MENS
          })
        }
      }

      if (event.postback.payload.split('_')[0] === 'SHOWPRODUCTS') {
        var category = event.postback.payload.split('_')[1]
          getUser().then((user) => {
            // find list of products in category
            // check length
              // if under 10, then make carosel
              // else paginate
          })
      }
    }


    if (event.message) {
      if (event.message.quick_reply) {
        if (event.message.quick_reply.payload.split[0] === 'ENROLL') {
          if (event.message.quick_reply.payload.split[1] === 'YES') {
            getUser().then((user) => {

            })
          } else {
            getUser().then((user) => {

            })
          }
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
