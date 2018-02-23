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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Hey there! I’m Gemma, and I’m here to help you find something special to make you sparkle. Take a peek at this short video to see how to shop and save.')
              sendVideoMessage(event.sender.id, user.pageAccessToken, 'https://chat-sass-messenger-uploader.herokuapp.com/data/jtv.mp4')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, "Ready? Let’s go shopping! Just tap 'Shop Now' in the menu below to start browsing.")
              }, 8000)
              resolve()
            })
          })
        } else {
          sendTextMessage(event.sender.id, user.pageAccessToken, "Welcome back! Let’s go shopping! Just tap 'Shop Now' below to start browsing.")
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
                  "title": "SEARCH JEWELRY TYPE",
                  "subtitle": "Choose from thousands of sparkling styles",
                  "image_url": "https://n6-img-fp.akamaized.net/free-vector/jewelry-flat-icons-set-of-necklace-tiara-earrings-isolated-vector-illustration_1284-2382.jpg?size=338&ext=jpg",
                  "buttons": [
                    {
                      "title": "Tap For Jewelry",
                      "type": "postback",
                      "payload": "CAT_TYPE_JEWEL"
                    }
                  ]
                },
                // {
                //   "title": "SEARCH GEM TYPE",
                //   "subtitle": "We have eye-catching treasures that are a must have for your collection",
                //   "image_url": "http://via.placeholder.com/350x350",
                //   "buttons": [
                //     {
                //       "title": "Search Gem Type",
                //       "type": "postback",
                //       "payload": "CAT_TYPE_GEM"
                //     }
                //   ]
                // },
                {
                  "title": "AS SEEN ON TV",
                  "subtitle": "...currently on air",
                  "image_url": "https://previews.123rf.com/images/roxanabalint/roxanabalint1405/roxanabalint140500418/28609789-as-seen-on-tv-grunge-rubber-stamp-on-white-vector-illustration-Stock-Vector.jpg",
                  "buttons": [
                    {
                      "title": "SHOP LIVE",
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

      var obj = {}

      var itemID = "*" + db.users.find({ 'id': event.sender.id })[0].cart[i]
      var category = itemID.split('_')[0]

      switch (category) {
        case "*bracelets":
        cost = cost + db.bracelets.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.bracelets.find({ id: itemID })[0].price)
        obj.title = db.bracelets.find({ id: itemID })[0].title
        obj.image_url = db.bracelets.find({ id: itemID })[0].imageURL
        obj.subtitle = db.bracelets.find({ id: itemID })[0].price
        obj.buttons = [
          {
            "type":"web_url",
            "url": db.bracelets.find({ id: itemID })[0].siteURL,
            "title":"View Details",
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + itemID
          }
        ]
        elements.push(obj)
        break;

        case "*earrings":
        cost = cost + db.earrings.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.earrings.find({ id: itemID })[0].price)
        obj.title = db.earrings.find({ id: itemID })[0].title
        obj.image_url = db.earrings.find({ id: itemID })[0].imageURL
        obj.subtitle = db.earrings.find({ id: itemID })[0].price
        obj.buttons = [
          {
            "type":"web_url",
            "url": db.earrings.find({ id: itemID })[0].siteURL,
            "title":"View Details",
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + itemID
          }
        ]
        elements.push(obj)
        break;

        case "*necklaces":
        cost = cost + db.necklaces.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.necklaces.find({ id: itemID })[0].price)
        obj.title = db.necklaces.find({ id: itemID })[0].title
        obj.image_url = db.necklaces.find({ id: itemID })[0].imageURL
        obj.subtitle = db.necklaces.find({ id: itemID })[0].price
        obj.buttons = [
          {
            "type":"web_url",
            "url": db.necklaces.find({ id: itemID })[0].siteURL,
            "title":"View Details",
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + itemID
          }
        ]
        elements.push(obj)
        break;

        case "*rings":
        cost = cost + db.rings.find({ id: itemID })[0].price
        // console.log('cost: ' + cost)
        // console.log('price: ' + db.rings.find({ id: itemID })[0].price)
        obj.title = db.rings.find({ id: itemID })[0].title
        obj.image_url = db.rings.find({ id: itemID })[0].imageURL
        obj.subtitle = db.rings.find({ id: itemID })[0].price
        obj.buttons = [
          {
            "type":"web_url",
            "url": db.rings.find({ id: itemID })[0].siteURL,
            "title":"View Details",
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + itemID
          }
        ]
        elements.push(obj)
        break;

        case "*watches":
        cost = cost + db.watches.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.watches.find({ id: itemID })[0].price)
        obj.title = db.watches.find({ id: itemID })[0].title
        obj.image_url = db.watches.find({ id: itemID })[0].imageURL
        obj.subtitle = db.watches.find({ id: itemID })[0].price
        obj.buttons = [
          {
            "type":"web_url",
            "url": db.watches.find({ id: itemID })[0].siteURL,
            "title":"View Details",
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + itemID
          }
        ]
        elements.push(obj)
        break;
        default:
      }
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
              "elements": elements
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
                "template_type":"button",
                "text":"Your total is $" + cost.toFixed(2) + ". Would you like to pay now, or keep shopping?" ,
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

  if (event.postback.payload.split('_')[0] === "REMOVE" && event.postback.payload.split('_')[1] === "CART") {

    Array.prototype.remove = function() {
      var what, a = arguments, L = a.length, ax;
      while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
          this.splice(ax, 1);
        }
      }
      return this;
    }

    let cart = db.users.find({ 'id': event.sender.id })[0].cart
    // cart.push(event.postback.payload.split('*')[1])
    // console.log('cart: ' + cart)
    // console.log('*' + event.postback.payload.split('*')[1])
    cart.remove(event.postback.payload.split('*')[1])

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
      sendTextMessage(event.sender.id, user.pageAccessToken, "Item removed from cart.")
      console.log(db.users.find({ 'id': event.sender.id })[0].cart)
    })

    var elements = []
    var cost = 0
    for (var i = 0; i < db.users.find({ 'id': event.sender.id })[0].cart.length; i++) {

      var obj = {}

      var itemID = "*" + db.users.find({ 'id': event.sender.id })[0].cart[i]
      var category = itemID.split('_')[0]

      switch (category) {
        case "*bracelets":
        cost = cost + db.bracelets.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.bracelets.find({ id: itemID })[0].price)
        obj.title = db.bracelets.find({ id: itemID })[0].title
        obj.image_url = db.bracelets.find({ id: itemID })[0].imageURL
        obj.subtitle = db.bracelets.find({ id: itemID })[0].price
        obj.buttons = [
          {
            "type":"web_url",
            "url": db.bracelets.find({ id: itemID })[0].siteURL,
            "title":"View Details",
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + itemID
          }
        ]
        elements.push(obj)
        break;

        case "*earrings":
        cost = cost + db.earrings.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.earrings.find({ id: itemID })[0].price)
        obj.title = db.earrings.find({ id: itemID })[0].title
        obj.image_url = db.earrings.find({ id: itemID })[0].imageURL
        obj.subtitle = db.earrings.find({ id: itemID })[0].price
        obj.buttons = [
          {
            "type":"web_url",
            "url": db.earrings.find({ id: itemID })[0].siteURL,
            "title":"View Details",
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + itemID
          }
        ]
        elements.push(obj)
        break;

        case "*necklaces":
        cost = cost + db.necklaces.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.necklaces.find({ id: itemID })[0].price)
        obj.title = db.necklaces.find({ id: itemID })[0].title
        obj.image_url = db.necklaces.find({ id: itemID })[0].imageURL
        obj.subtitle = db.necklaces.find({ id: itemID })[0].price
        obj.buttons = [
          {
            "type":"web_url",
            "url": db.necklaces.find({ id: itemID })[0].siteURL,
            "title":"View Details",
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + itemID
          }
        ]
        elements.push(obj)
        break;

        case "*rings":
        cost = cost + db.rings.find({ id: itemID })[0].price
        // console.log('cost: ' + cost)
        // console.log('price: ' + db.rings.find({ id: itemID })[0].price)
        obj.title = db.rings.find({ id: itemID })[0].title
        obj.image_url = db.rings.find({ id: itemID })[0].imageURL
        obj.subtitle = db.rings.find({ id: itemID })[0].price
        obj.buttons = [
          {
            "type":"web_url",
            "url": db.rings.find({ id: itemID })[0].siteURL,
            "title":"View Details",
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + itemID
          }
        ]
        elements.push(obj)
        break;

        case "*watches":
        cost = cost + db.watches.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.watches.find({ id: itemID })[0].price)
        obj.title = db.watches.find({ id: itemID })[0].title
        obj.image_url = db.watches.find({ id: itemID })[0].imageURL
        obj.subtitle = db.watches.find({ id: itemID })[0].price
        obj.buttons = [
          {
            "type":"web_url",
            "url": db.watches.find({ id: itemID })[0].siteURL,
            "title":"View Details",
            "webview_height_ratio":"tall"
          },
          {
            "type":"postback",
            "title":"Remove From Cart",
            "payload":"REMOVE_CART_" + itemID
          }
        ]
        elements.push(obj)
        break;
        default:
      }
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
              "elements": elements
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
                "template_type":"button",
                "text":"Your total is $" + cost.toFixed(2) + ". Would you like to pay now, or keep shopping?" ,
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
              "text":"We are going to use your stored card to make this purchase. Confirm?" ,
              "buttons":[
                {
                  "type":"postback",
                  "payload":"STORED",
                  "title":"Confirm"
                }
              ]
            }
          }
        }
      }
      callSendAPI(user.pageAccessToken, messageData)
    })

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

  if (event.postback.payload === "STORED") {
    var elements = []
    var cost = 0
    for (var i = 0; i < db.users.find({ 'id': event.sender.id })[0].cart.length; i++) {

      var obj = {}

      var itemID = "*" + db.users.find({ 'id': event.sender.id })[0].cart[i]
      var category = itemID.split('_')[0]

      switch (category) {
        case "*bracelets":
        cost = cost + db.bracelets.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.bracelets.find({ id: itemID })[0].price)
        obj.title = db.bracelets.find({ id: itemID })[0].title
        obj.image_url = db.bracelets.find({ id: itemID })[0].imageURL
        obj.price = db.bracelets.find({ id: itemID })[0].price
        obj.currency = "USD"
        obj.quantity = 1

        elements.push(obj)
        break;

        case "*earrings":
        cost = cost + db.earrings.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.earrings.find({ id: itemID })[0].price)
        obj.title = db.earrings.find({ id: itemID })[0].title
        obj.image_url = db.earrings.find({ id: itemID })[0].imageURL
        obj.price = db.earrings.find({ id: itemID })[0].price
        obj.currency = "USD"
        obj.quantity = 1
        elements.push(obj)
        break;

        case "*necklaces":
        cost = cost + db.necklaces.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.necklaces.find({ id: itemID })[0].price)
        obj.title = db.necklaces.find({ id: itemID })[0].title
        obj.image_url = db.necklaces.find({ id: itemID })[0].imageURL
        obj.price = db.necklaces.find({ id: itemID })[0].price
        obj.currency = "USD"
        obj.quantity = 1
        elements.push(obj)
        break;

        case "*rings":
        cost = cost + db.rings.find({ id: itemID })[0].price
        // console.log('cost: ' + cost)
        // console.log('price: ' + db.rings.find({ id: itemID })[0].price)
        obj.title = db.rings.find({ id: itemID })[0].title
        obj.image_url = db.rings.find({ id: itemID })[0].imageURL
        obj.price = db.rings.find({ id: itemID })[0].price
        obj.currency = "USD"
        obj.quantity = 1
        elements.push(obj)
        break;

        case "*watches":
        cost = cost + db.watches.find({ id: itemID })[0].price
        console.log('cost: ' + cost)
        console.log('price: ' + db.watches.find({ id: itemID })[0].price)
        obj.title = db.watches.find({ id: itemID })[0].title
        obj.image_url = db.watches.find({ id: itemID })[0].imageURL
        obj.price = db.watches.find({ id: itemID })[0].price
        obj.currency = "USD"
        obj.quantity = 1
        elements.push(obj)
        break;
        default:
      }
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
              "template_type": "receipt",
              "recipient_name": "Gems & Jewels TV Customer",
              "order_number": "12345678902",
              "currency": "USD",
              "payment_method": "Visa 2345",
              // "address":{
              //   "street_1":"1 Hacker Way",
              //   "street_2":"",
              //   "city":"Menlo Park",
              //   "postal_code":"94025",
              //   "state":"CA",
              //   "country":"US"
              // },
              "summary":{
                "subtotal": cost,
                "shipping_cost":10.95,
                "total_tax":16.19,
                "total_cost": cost + 10.95 + 16.19
              },
              "elements": elements
            }
          }
        }
      }
      callSendAPI(user.pageAccessToken, messageData)

      setTimeout(() => {
        let cart = []

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
          sendTextMessage(event.sender.id, user.pageAccessToken, "Thank you for your purchase!")
        })
      }, 3500)
    })

    // event.postback.payload.split('_')[1] => find cart
    // use cart info to send receipt
  }

  if (event.postback.payload === "CHARGE") {
    // event.postback.payload.split('_')[1] => find cart
    // render webview and send cart information to webview
    // wait 20 seconds and send reciept
  }

  if (event.postback.payload.split('_')[0] === "TV") {

    if (event.postback.payload.split('_')[1] === "10") {
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
                    "title":"Charles Winston for Bella Luce® 11.03ctw Round and Baguette Rhodium over Silver Ring",
                    "image_url":"http://i0.jtv.com/loadimage.aspx?btype=.jpg&h=400&w=533&cgid=3162245&img=1",
                    "subtitle":"134.99",
                    "buttons":[
                      {
                        "type":"postback",
                        "title":"Add to Cart",
                        "payload":"ADD_CART_RINGS_" + "*bracelets_11"
                      },
                      {
                        "title":"View Details",
                        "type":"web_url",
                        "url": "https://www.jtv.com/jewelry/charles-winston-for-bella-luce--r-11.03ctw-round-and-baguette-rhodium-over-silver-ring/1654126.html",
                        "webview_height_ratio":"tall"
                      },
                      {
                        "type":"postback",
                        "title":"Show Categories",
                        "payload":"SHOW_CATS"
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

    if (event.postback.payload.split('_')[1] === "12") {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, 'We will send you a reminder before the show begins!')
      })
    }

    if (event.postback.payload.split('_')[1] === "14") {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, 'We will send you a reminder before the show begins!')
      })
    }
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
                    "image_url":"https://i5.jtv.com/loadimage.aspx?btype=.jpg&cgid=3341153&img=1&h=300&w=400",
                    "subtitle":"Hundreds of styles you’ll love for years to come.",
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
                    "image_url":"https://i5.jtv.com/loadimage.aspx?btype=.jpg&cgid=3390679&img=1&h=300&w=400",
                    "subtitle":"From elegant to everyday dangle, diamond & more.",
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
                    "image_url":"https://i5.jtv.com/loadimage.aspx?btype=.jpg&cgid=3354063&img=1&h=300&w=400",
                    "subtitle":"Mix, match and stack for a look all your own.",
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
                    "image_url":"https://i5.jtv.com/loadimage.aspx?btype=.jpg&cgid=3384142&img=1&h=300&w=400",
                    "subtitle": "Sparkle with diamonds, gemstones, pearls & more.",
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
                    "image_url":"https://i5.jtv.com/loadimage.aspx?btype=.jpg&cgid=3280749&img=1&h=300&w=400",
                    "subtitle":"Brand name watches range from laid-back to luxury.",
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
                "top_element_style": "LARGE",
                "elements": [
                  {
                    "title": "Charles Winston For Bella Luce With Kristen & Charles",
                    "subtitle": "@ 10am - 12pm",
                    "image_url": "https://n6-img-fp.akamaized.net/free-vector/jewelry-flat-icons-set-of-necklace-tiara-earrings-isolated-vector-illustration_1284-2382.jpg?size=338&ext=jpg",
                    "buttons": [
                      {
                        "title": "Tap Here",
                        "type": "postback",
                        "payload": "TV_10"
                      }
                    ]
                  },
                  {
                    "title": "Sparkle In Silver With Kristen",
                    "subtitle": "@ 12pm - 2pm",
                    "image_url": "https://scontent-ort2-1.xx.fbcdn.net/v/t1.0-9/12438979_1111784788845510_8540414339736721462_n.jpg?oh=ecc8bd0fbd371983a8718fc4fed560c7&oe=5B18541F",
                    "buttons": [
                      {
                        "title": "Tap Here",
                        "type": "postback",
                        "payload": "TV_12"
                      }
                    ]
                  },
                  {
                    "title": "Diamond Elegance With Misty",
                    "subtitle": "@ 2pm - 4pm",
                    "image_url": "https://scontent-ort2-1.xx.fbcdn.net/v/t1.0-9/21272389_1512782835470542_3059064897194547114_n.jpg?oh=54f956611a2cadad61a665b1946c0e00&oe=5B4E2469",
                    "buttons": [
                      {
                        "title": "Tap Here",
                        "type": "postback",
                        "payload": "TV_14"
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

      // show list template of show times
        // TV_10
        // TV_12
        // TV_14

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
