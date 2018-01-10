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

  if (event.message.quick_reply) {
    if (event.message.quick_reply.payload.split('_')[1] === 'UNKNOWN') {
      console.log('testing this working => unknown')
    }
  }

  if (event.postback) {

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
                "payload":"LOCATION_ALTA"
              },
              {
                "content_type":"text",
                "title":"Brighton & Solitude",
                "payload":"LOCATION_BRIGHTON"
              },
              {
                "content_type":"text",
                "title":"Deer Valley",
                "payload":"LOCATION_DEER"
              },
              {
                "content_type":"text",
                "title":"Park City",
                "payload":"LOCATION_PARK"
              },
              {
                "content_type":"text",
                "title":"Snowbasin/Powder Mt",
                "payload":"LOCATION_SNOWBASIN"
              },
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
