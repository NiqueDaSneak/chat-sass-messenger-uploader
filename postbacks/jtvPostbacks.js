'use strict'

// var db = require('../data/jtvData.js')
var db = require('diskdb')
db = db.connect('data', ['rings', 'earrings', 'bracelets', 'necklaces', 'watches', 'users'])

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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'This is some great intro copy to explain the experience!')
              sendVideoMessage(event.sender.id, user.pageAccessToken, 'https://chat-sass-messenger-uploader.herokuapp.com/data/jtv.mp4')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, "Tap the 'Shop Now' button below to begin.")
              }, 8000)
              resolve()
            })
          })
        } else {
          sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome back to Gem & Jewels TV!')
          resolve()
        }
      })
    })
  }

  if (event.postback.payload === "GET_STARTED_PAYLOAD") {

    // ENROLLING MEMBERS INTO THE IRRIGATE APP
    getUser().then((user) => {
      findMember(user)
    })
  }

  if (event.postback.payload === "SHOW_CATS") {

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
                },
                {
                  "title": "As Seen On TV",
                  "subtitle": "See all our colors",
                  "image_url": "http://via.placeholder.com/350x350",
                  "buttons": [
                    {
                      "title": "As Seen On Tv",
                      "type": "postback",
                      "payload": "CAT_TYPE_TV"
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

  if (event.postback.payload === "DONE") {

    var elements = []
    var cost = 0
    for (var i = 0; i < db.users.find({ 'id': event.sender.id })[0].cart.length; i++) {

      let obj = {}

      let itemID = db.users.find({ 'id': event.sender.id })[0].cart[i]
      let category = itemID.split('_')[0]

      switch (category) {
        case "bracelets":
        console.log()
        cost = cost + Number(db.bracelets.find({ 'id': '*' + itemID }).price)
        obj.title = db.bracelets.find({ 'id': '*' + itemID }).title
        obj.image_url = db.bracelets.find({ 'id': '*' + itemID }).imageURL
        obj.subtitle = db.bracelets.find({ 'id': '*' + itemID }).price
        obj.buttons = [
          {
            "title":"View Details",
            "type":"web_url",
            "url": db.bracelets.find({ 'id': '*' + itemID }).siteURL,
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + '*' + itemID
          }
        ]
        elements.push(obj)
        break;

        case "earrings":
        console.log()
        cost = cost + Number(db.earrings.find({ 'id': '*' + itemID }).price)
        obj.title = db.earrings.find({ 'id': '*' + itemID }).title
        obj.image_url = db.earrings.find({ 'id': '*' + itemID }).imageURL
        obj.subtitle = db.earrings.find({ 'id': '*' + itemID }).price
        obj.buttons = [
          {
            "title":"View Details",
            "type":"web_url",
            "url": db.earrings.find({ 'id': '*' + itemID }).siteURL,
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + '*' + itemID
          }
        ]
        elements.push(obj)
        break;

        case "necklaces":
        console.log()
        cost = cost + Number(db.necklaces.find({ 'id': '*' + itemID }).price)
        obj.title = db.necklaces.find({ 'id': '*' + itemID }).title
        obj.image_url = db.necklaces.find({ 'id': '*' + itemID }).imageURL
        obj.subtitle = db.necklaces.find({ 'id': '*' + itemID }).price
        obj.buttons = [
          {
            "title":"View Details",
            "type":"web_url",
            "url": db.necklaces.find({ 'id': '*' + itemID }).siteURL,
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + '*' + itemID
          }
        ]
        elements.push(obj)
        break;

        case "rings":
        console.log()
        cost = cost + Number(db.rings.find({ 'id': '*' + itemID }).price)
        obj.title = db.rings.find({ 'id': '*' + itemID }).title
        obj.image_url = db.rings.find({ 'id': '*' + itemID }).imageURL
        obj.subtitle = db.rings.find({ 'id': '*' + itemID }).price
        obj.buttons = [
          {
            "title":"View Details",
            "type":"web_url",
            "url": db.rings.find({ 'id': '*' + itemID }).siteURL,
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + '*' + itemID
          }
        ]
        elements.push(obj)
        break;

        case "watches":
        typeof db.watches.find({ 'id': '*' + itemID }).price
        cost = cost + Number(db.watches.find({ 'id': '*' + itemID }).price)
        obj.title = db.watches.find({ 'id': '*' + itemID }).title
        obj.image_url = db.watches.find({ 'id': '*' + itemID }).imageURL
        obj.subtitle = db.watches.find({ 'id': '*' + itemID }).price
        obj.buttons = [
          {
            "title":"View Details",
            "type":"web_url",
            "url": db.watches.find({ 'id': '*' + itemID }).siteURL,
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + '*' + itemID
          }
        ]
        elements.push(obj)
        break;
        default:
      }
      console.log('cost: $' + cost)
    }

    getUser().then((user) => {
      console.log('elements' + elements)
      // let messageData = {
      //   "recipient":{
      //     "id": event.sender.id
      //   },
      //   "message":{
      //     "attachment":{
      //       "type":"template",
      //       "payload":{
      //         "template_type":"generic",
      //         "sharable": true,
      //         "elements": elements
      //       }
      //     }
      //   }
      // }
      // callSendAPI(user.pageAccessToken, messageData)

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
                "text":"Your total is $" + cost + ". Would you like to pay now, or keep shopping?" ,
                "buttons":[
                  {
                    "type":"postback",
                    "payload":"SHOW_CATS",
                    "title":"Keep Shopping"
                  },
                  {
                    "type":"postback",
                    "payload":"PAY",
                    "title":"Pay Now"
                  }
                ]
              }
            }
          }
        }
        callSendAPI(user.pageAccessToken, messageData)
      }, 3000)
    })

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
                "elements":[
                  {
                    "title":"Rings",
                    "image_url":"http://via.placeholder.com/350x350",
                    "subtitle":"We'\''ve got the right hat for everyone.",
                    "buttons":[
                      {
                        "type":"postback",
                        "title":"Browse Rings",
                        "payload":"CAT_TYPE_RINGS"
                      }
                    ]
                  },
                  {
                    "title":"Earrings",
                    "image_url":"http://via.placeholder.com/350x350",
                    "subtitle":"We'\''ve got the right hat for everyone.",
                    "buttons":[
                      {
                        "type":"postback",
                        "title":"Browse Earrings",
                        "payload":"CAT_TYPE_EARRINGS"
                      }
                    ]
                  },
                  {
                    "title":"Bracelets",
                    "image_url":"http://via.placeholder.com/350x350",
                    "subtitle":"We'\''ve got the right hat for everyone.",
                    "buttons":[
                      {
                        "type":"postback",
                        "title":"Browse Bracelets",
                        "payload":"CAT_TYPE_BRACELETS"
                      }
                    ]
                  },
                  {
                    "title":"Necklaces",
                    "image_url":"http://via.placeholder.com/350x350",
                    "subtitle":"We'\''ve got the right hat for everyone.",
                    "buttons":[
                      {
                        "type":"postback",
                        "title":"Browse Necklaces",
                        "payload":"CAT_TYPE_NECKLACES"
                      }
                    ]
                  },
                  {
                    "title":"Watches",
                    "image_url":"http://via.placeholder.com/350x350",
                    "subtitle":"We'\''ve got the right hat for everyone.",
                    "buttons":[
                      {
                        "type":"postback",
                        "title":"Browse Watches",
                        "payload":"CAT_TYPE_WATCHES"
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
      // show carosel of categories
        // rings
          // postback === 'CAT_TYPE_RINGS'
    }

    if (event.postback.payload.split('_')[2] === "GEM") {
    }

    if (event.postback.payload.split('_')[2] === "TV") {
    }

    if (event.postback.payload.split('_')[2] === "RINGS") {

      var elements = []
      for (var i = 0; i < db.rings.find().length; i++) {
        let obj = {}
        obj.title = db.rings.find()[i].title
        obj.image_url = db.rings.find()[i].imageURL
        obj.subtitle = db.rings.find()[i].price
        obj.buttons = [
          {
            "type":"postback",
            "title":"Add to Cart",
            "payload":"ADD_CART_RINGS_" + db.rings.find()[i].id
          },
          {
            "title":"View Details",
            "type":"web_url",
            "url": db.rings.find()[i].siteURL,
            "webview_height_ratio":"full"
          },
          {
            "type":"postback",
            "title":"Show Categories",
            "payload":"SHOW_CATS"
          }
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

      // send carosel of rings in db.rings
      // item
        // buttons
          // postbacks
            // 'ADD_CART_' + db.rings.id
            // 'DETAILS_' + db.rings.url
            // SHOW_CATS

    }

    if (event.postback.payload.split('_')[2] === "EARRINGS") {

      var elements = []
      for (var i = 0; i < db.earrings.find().length; i++) {
        let obj = {}
        obj.title = db.earrings.find()[i].title
        obj.image_url = db.earrings.find()[i].imageURL
        obj.subtitle = db.earrings.find()[i].price
        obj.buttons = [
          {
            "type":"postback",
            "title":"Add to Cart",
            "payload":"ADD_CART_EARRINGS_" + db.earrings.find()[i].id
          },
          {
            "title":"View Details",
            "type":"web_url",
            "url": db.earrings.find()[i].siteURL,
            "webview_height_ratio":"full"
          },
          {
            "type":"postback",
            "title":"Show Categories",
            "payload":"SHOW_CATS"
          }
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

      // send carosel of rings in db.rings
      // item
        // buttons
          // postbacks
            // 'ADD_CART_' + db.rings.id
            // 'DETAILS_' + db.rings.url
            // SHOW_CATS

    }

    if (event.postback.payload.split('_')[2] === "BRACELETS") {

      var elements = []
      for (var i = 0; i < db.bracelets.find().length; i++) {
        let obj = {}
        obj.title = db.bracelets.find()[i].title
        obj.image_url = db.bracelets.find()[i].imageURL
        obj.subtitle = db.bracelets.find()[i].price
        obj.buttons = [
          {
            "type":"postback",
            "title":"Add to Cart",
            "payload":"ADD_CART_BRACELETS_" + db.bracelets.find()[i].id
          },
          {
            "title":"View Details",
            "type":"web_url",
            "url": db.bracelets.find()[i].siteURL,
            "webview_height_ratio":"full"
          },
          {
            "type":"postback",
            "title":"Show Categories",
            "payload":"SHOW_CATS"
          }
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

      // send carosel of rings in db.rings
      // item
        // buttons
          // postbacks
            // 'ADD_CART_' + db.rings.id
            // 'DETAILS_' + db.rings.url
            // SHOW_CATS

    }

    if (event.postback.payload.split('_')[2] === "NECKLACES") {

      var elements = []
      for (var i = 0; i < db.necklaces.find().length; i++) {
        let obj = {}
        obj.title = db.necklaces.find()[i].title
        obj.image_url = db.necklaces.find()[i].imageURL
        obj.subtitle = db.necklaces.find()[i].price
        obj.buttons = [
          {
            "type":"postback",
            "title":"Add to Cart",
            "payload":"ADD_CART_NECKLACES_" + db.necklaces.find()[i].id
          },
          {
            "title":"View Details",
            "type":"web_url",
            "url": db.necklaces.find()[i].siteURL,
            "webview_height_ratio":"full"
          },
          {
            "type":"postback",
            "title":"Show Categories",
            "payload":"SHOW_CATS"
          }
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

      // send carosel of rings in db.rings
      // item
        // buttons
          // postbacks
            // 'ADD_CART_' + db.rings.id
            // 'DETAILS_' + db.rings.url
            // SHOW_CATS

    }

    if (event.postback.payload.split('_')[2] === "WATCHES") {

      var elements = []
      for (var i = 0; i < db.watches.find().length; i++) {
        let obj = {}
        obj.title = db.watches.find()[i].title
        obj.image_url = db.watches.find()[i].imageURL
        obj.subtitle = db.watches.find()[i].price
        obj.buttons = [
          {
            "type":"postback",
            "title":"Add to Cart",
            "payload":"ADD_CART_WATCHES_" + db.watches.find()[i].id
          },
          {
            "title":"View Details",
            "type":"web_url",
            "url": db.watches.find()[i].siteURL,
            "webview_height_ratio":"full"
          },
          {
            "type":"postback",
            "title":"Show Categories",
            "payload":"SHOW_CATS"
          }
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

        if (db.users.find({ id: event.sender.id }).length === 0) {
          let newUser = {
            id: event.sender.id,
            cart: [ event.postback.payload.split('*')[1] ]
          }
          db.users.save(newUser)
          console.log(db.users.find({ id: event.sender.id }))
          getUser().then((user) => {
            sendTextMessage(event.sender.id, user.pageAccessToken, "Thanks for starting a cart with us! Continue shopping above or tap 'Done Shopping' below.")
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
            sendTextMessage(event.sender.id, user.pageAccessToken, "Item added to cart.")
          })
        }
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
