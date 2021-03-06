'use strict'

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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome! My name is SartreBot!')
              setTimeout(() => {
                let messageData = {
                  "recipient":{
                    "id": event.sender.id
                  },
                  "message":{
                    "text": "Looking to create a reservation, or are you dining in?",
                    "quick_replies":[
                      {
                        "content_type":"text",
                        "title":"Reservation",
                        "payload":"RESO"
                      },
                      {
                        "content_type":"text",
                        "title":"We're at our table!",
                        "payload":"DINEIN"
                      }
                    ]
                  }
                }
                callSendAPI(user.pageAccessToken, messageData)
              }, 1000)
              resolve()
            })
          })
        } else {
          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "text": "Looking to create a reservation, or are you dining in?",
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Reservation",
                  "payload": "RESO"
                },
                {
                  "content_type":"text",
                  "title":"We're at our table!",
                  "payload":"DINEIN"
                }
              ]
            }
          }
          callSendAPI(user.pageAccessToken, messageData)

          resolve()
        }
      })
    })
  }

  if (event.message) {
    if (event.message.quick_reply) {
      if (event.message.quick_reply.payload === 'RESO') {
        getUser().then((user) => {
          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "text": "How many guests?",
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"1",
                  "payload":"GUEST_1"
                },
                {
                  "content_type":"text",
                  "title":"2",
                  "payload":"GUEST_2"
                },
                {
                  "content_type":"text",
                  "title":"3-4",
                  "payload":"GUEST_4"
                },
                {
                  "content_type":"text",
                  "title":"5+",
                  "payload":"GUEST_5"
                }
              ]
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        })
      }

      if (event.message.quick_reply.payload === 'DINEIN') {
        getUser().then((user) => {
          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "text": "...you should see a plackard with a number. What table are you at?",
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"24",
                  "payload":"TABLE#"
                },
                {
                  "content_type":"text",
                  "title":"23",
                  "payload":"TABLE#"
                },
                {
                  "content_type":"text",
                  "title":"35",
                  "payload":"TABLE#"
                },
                {
                  "content_type":"text",
                  "title":"13",
                  "payload":"TABLE#"
                },
                {
                  "content_type":"text",
                  "title":"47",
                  "payload":"TABLE#"
                },
                {
                  "content_type":"text",
                  "title":"89",
                  "payload":"TABLE#"
                }
              ]
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        })
      }

      if (event.message.quick_reply.payload.split("_")[0] === 'GUEST') {
        getUser().then((user) => {
          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "text": "...when ya coming in?",
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Feb 22",
                  "payload":"DATE_Feb 22"
                },
                {
                  "content_type":"text",
                  "title":"Feb 23",
                  "payload":"DATE_Feb 23"
                },
                {
                  "content_type":"text",
                  "title":"Feb 24",
                  "payload":"DATE_Feb 24"
                },
                {
                  "content_type":"text",
                  "title":"Feb 25",
                  "payload":"DATE_Feb 25"
                },
                {
                  "content_type":"text",
                  "title":"March 1",
                  "payload":"DATE_March 1"
                },
                {
                  "content_type":"text",
                  "title":"March 2",
                  "payload":"DATE_March 2"
                },
                {
                  "content_type":"text",
                  "title":"March 3",
                  "payload":"DATE_March 3"
                },
                {
                  "content_type":"text",
                  "title":"March 4",
                  "payload":"DATE_March 4"
                },
                {
                  "content_type":"text",
                  "title":"March 8",
                  "payload":"DATE_March 8"
                },
                {
                  "content_type":"text",
                  "title":"March 9",
                  "payload":"DATE_March 9"
                },
                {
                  "content_type":"text",
                  "title":"March 10",
                  "payload":"DATE_March 10"
                }
              ]
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        })
      }

      if (event.message.quick_reply.payload === 'TABLE#') {
        getUser().then((user) => {
          sendTextMessage(event.sender.id, user.pageAccessToken, "Thanks for coming in! A bartender is coming to see you. In the mean time, you can order a drink and they will bring it over.")
          setTimeout(() => {
            let messageData = {
              "recipient":{
                "id": event.sender.id
              },
              "message":{
                "text": "Check out the menu:",
                "quick_replies":[
                  {
                    "content_type":"text",
                    "title":"Red Wine",
                    "payload":"MENU_Red Wine"
                  },
                  {
                    "content_type":"text",
                    "title":"White Wine",
                    "payload":"MENU_White Wine"
                  },
                  {
                    "content_type":"text",
                    "title":"Cocktails",
                    "payload":"MENU_Cocktails"
                  },
                ]
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
          }, 3700)
        })
      }

      if (event.message.quick_reply.payload.split("_")[0] === 'MENU') {
        if (event.message.quick_reply.payload.split("_")[1] === 'Red Wine') {
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
                  "elements": [
                    {
                      "title": "DOMAINE SPECHT",
                      "subtitle": "ALSACE, FR ‘15 REISLING",
                      "buttons":[
                        {
                          "type": "postback",
                          "payload": "TAB",
                          "title":"Buy for $11"
                        }
                      ]
                    },
                    {
                      "title": "JULIEN BRAUD",
                      "subtitle": "Les Vignes De Bourg: LOIRE, FR ‘15 MELON DE BOURGOGNE",
                      "buttons":[
                        {
                          "type": "postback",
                          "payload": "TAB",
                          "title":"Buy for $9"
                        }
                      ]
                    },
                    {
                      "title": "FUORI STRADA",
                      "subtitle": "SICILY, IT ‘16 GRILLO",
                      "buttons":[
                        {
                          "type": "postback",
                          "payload": "TAB",
                          "title":"Buy for $7"
                        }
                      ]
                    },
                    {
                      "title": "PASCAL JANVIER",
                      "subtitle": "JASNIERES, FR ‘16 CHENIN BLANC",
                      "buttons":[
                        {
                          "type": "postback",
                          "payload": "TAB",
                          "title":"Buy for $11"
                        }
                      ]
                    },
                    {
                      "title": "DOMAINE THEVENOT",
                      "subtitle": "Perles D’or: BURGUNDY, FR ’15 ALIGOTE",
                      "buttons":[
                        {
                          "type": "postback",
                          "payload": "TAB",
                          "title":"Buy for $11"
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

        if (event.message.quick_reply.payload.split("_")[1] === 'White Wine') {
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
                    "elements": [
                      {
                        "title": "JEAN RIJCKAERT",
                        "subtitle": "CORREAUX VIEILLES VIGNES: BURGUNDY, FR ‘14 GAMAY",
                        "buttons":[
                          {
                            "type": "postback",
                            "payload": "TAB",
                            "title":"Buy for $12"
                          }
                        ]
                      },
                      {
                        "title": "DOMAINE DU PRE BARON",
                        "subtitle": "TOURAINE, FR ‘14 MALBEC",
                        "buttons":[
                          {
                            "type": "postback",
                            "payload": "TAB",
                            "title":"Buy for $9"
                          }
                        ]
                      },
                      {
                        "title": "LA CROIX DE CHAINTRES",
                        "subtitle": "SAUMUR-CHAMPIGNY: FR‘16 CABERNET FRANC",
                        "buttons":[
                          {
                            "type": "postback",
                            "payload": "TAB",
                            "title":"Buy for $11"
                          }
                        ]
                      },
                      {
                        "title": "DOMAINE SAINT GAYAN",
                        "subtitle": "RHONE VALLEY, FR ‘14 GSM BLEND",
                        "buttons":[
                          {
                            "type": "postback",
                            "payload": "TAB",
                            "title":"Buy for $10"
                          }
                        ]
                      },
                      {
                        "title": "CHATEAU PEYBONHOMME",
                        "subtitle": "BORDEAUX, FR ‘14 BORDEAUX BLEND",
                        "buttons":[
                          {
                            "type": "postback",
                            "payload": "TAB",
                            "title":"Buy for $12"
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

        if (event.message.quick_reply.payload.split("_")[1] === 'Cocktails') {
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
                    "elements": [
                      {
                        "title": "NEGRONI",
                        "subtitle": "watershed four peel gin, berto rosso, berto bianco, cappelletti, orange peel",
                        "buttons":[
                          {
                            "type": "postback",
                            "payload": "TAB",
                            "title":"Buy for $11"
                          }
                        ]
                      },
                      {
                        "title": "GEIST SPRITZ",
                        "subtitle": "aperol, solerno blood orange, cidergeist bubbles",
                        "buttons":[
                          {
                            "type": "postback",
                            "payload": "TAB",
                            "title":"Buy for $11"
                          }
                        ]
                      },
                      {
                        "title": "QUEEN LUCILLE DES ALPES",
                        "subtitle": "dolin genepy, alsace riesling, shishito pepper & marigold honey, sparkling wine",
                        "buttons":[
                          {
                            "type": "postback",
                            "payload": "TAB",
                            "title":"Buy for $12"
                          }
                        ]
                      },
                      {
                        "title": "SORE WOUNDED",
                        "subtitle": "rye whiskey, china-china, cocchi americano, cigar bitters",
                        "buttons":[
                          {
                            "type": "postback",
                            "payload": "TAB",
                            "title":"Buy for $11"
                          }
                        ]
                      },
                      {
                        "title": "REMEDY NO. 1",
                        "subtitle": "eucalyptu-infused-watershed vodka, orange, green tea, ginger, sea salt",
                        "buttons":[
                          {
                            "type": "postback",
                            "payload": "TAB",
                            "title":"Buy for $11"
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


      if (event.message.quick_reply.payload.split("_")[0] === 'DATE') {
        var date = event.message.quick_reply.payload.split("_")[1]
        getUser().then((user) => {
          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "text": "...and at what time?",
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"6pm",
                  "payload":"TIME_6pm_" + date
                },
                {
                  "content_type":"text",
                  "title":"6:15pm",
                  "payload":"TIME_6:15pm_" + date
                },
                {
                  "content_type":"text",
                  "title":"6:30pm",
                  "payload":"TIME_6:30pm_" + date
                },
                {
                  "content_type":"text",
                  "title":"6:45pm",
                  "payload":"TIME_6:45pm_" + date
                },
                {
                  "content_type":"text",
                  "title":"7pm",
                  "payload":"TIME_7pm_" + date
                },
                {
                  "content_type":"text",
                  "title":"7:15pm",
                  "payload":"TIME_7:15pm_" + date
                },
                {
                  "content_type":"text",
                  "title":"7:30pm",
                  "payload":"TIME_7:30pm_" + date
                },
                {
                  "content_type":"text",
                  "title":"7:45pm",
                  "payload":"TIME_7:45pm_" + date
                },
                {
                  "content_type":"text",
                  "title":"8pm",
                  "payload":"TIME_8pm_" + date
                },
                {
                  "content_type":"text",
                  "title":"8:15pm",
                  "payload":"TIME_8:15pm_" + date
                },
                {
                  "content_type":"text",
                  "title":"8:30pm",
                  "payload":"TIME_8:30pm_" + date
                }
              ]
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        })
      }

      if (event.message.quick_reply.payload.split("_")[0] === 'TIME') {
        var time = event.message.quick_reply.payload.split("_")[1]
        var date = event.message.quick_reply.payload.split("_")[2]

        getUser().then((user) => {
          sendTextMessage(event.sender.id, user.pageAccessToken, 'You are confirmed! See you on ' + date + ' at ' + time + '.')
        })
      }

    } else {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, 'Thanks for your message! We will get back to you shortly!')

      })
    }

  }

  if (event.postback) {
    if (event.postback.payload === "GET_STARTED_PAYLOAD") {
      getUser().then((user) => {
        findMember(user)
      })
    }

    if (event.postback.payload === 'TAB') {
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
                "elements": [
                  {
                    "title": "Great! That'll be out shortly. ",
                    "subtitle": "Tap below to see the drink menu again...",
                    "buttons":[
                      {
                        "type": "postback",
                        "payload": "TABLE#",
                        "title":"More Drinks!"
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
    if (event.postback.payload === 'TABLE#') {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, "Thanks for coming in! A bartender is coming to see you. In the mean time, you can order a drink and they will bring it over.")
        setTimeout(() => {
          let messageData = {
            "recipient":{
              "id": event.sender.id
            },
            "message":{
              "text": "Check out the menu:",
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Red Wine",
                  "payload":"MENU_Red Wine"
                },
                {
                  "content_type":"text",
                  "title":"White Wine",
                  "payload":"MENU_White Wine"
                },
                {
                  "content_type":"text",
                  "title":"Cocktails",
                  "payload":"MENU_Cocktails"
                },
              ]
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        }, 3700)
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
