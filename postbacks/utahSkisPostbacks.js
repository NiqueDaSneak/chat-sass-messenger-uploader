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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome to the UtahSkis.com Experience!')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, 'Here you will be able to browse and purchase skis, snowboards, and apparel! You can also gain access to exclusive content and deals curated just for you!')
                setTimeout(() => {
                  let messageData = {
                    "recipient":{
                      "id": event.sender.id
                    },
                    "message":{
                      "text": "Interested in exclusive content and deals during the Winter Olympics?",
                      "quick_replies":[
                        {
                          "content_type":"text",
                          "title":"Not Interested",
                          "payload":"ENROLL_NO"
                        },
                        {
                          "content_type":"text",
                          "title":"Sure",
                          "payload":"ENROLL_YES"
                        }
                      ]
                    }
                  }
                  callSendAPI(user.pageAccessToken, messageData)
                }, 4500)
              }, 1500)
            })
          })

        } else {
          sendTextMessage(event.sender.id, user.pageAccessToken, "Welcome back")
          resolve()
        }
      })
    })
  }

    if (event.postback) {
      if (event.postback.payload === 'GET_STARTED_PAYLOAD') {
        getUser().then((user) => {
          findMember(user)
        })
      }

      if (event.postback.payload === 'SHOP') {
        getUser().then((user) => {
          // SEND INITIAL CATS => CATS_MENS, CATS_WOMENS, CATS_KIDS, SUMMER
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
                        "title":"Women's",
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Shop",
                            "payload":"CATS_WOMENS"
                          }
                        ]
                      },
                      {
                        "title":"Men's",
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Shop",
                            "payload":"CATS_MENS"
                          }
                        ]
                      },
                      {
                        "title":"Kids's",
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Shop",
                            "payload":"CATS_KIDS"
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
        })
      }

      if (event.postback.payload.split('_')[0] === 'CATS') {
        if (event.postback.payload.split('_').length > 2) {
          var gender = event.postback.payload.split('_')[2]
          var category = event.postback.payload.split('_')[1]
          getUser().then((user) => {
            if (category === 'SKI') {
              var elements = [
                {
                  "title":"Skis",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_SKIS_" + gender
                    }
                  ]
                },
                {
                  "title":"Demo Skis",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_DEMOSKIS_" + gender
                    }
                  ]
                },
                {
                  "title":"Ski Boots",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_SKIBOOTS_" + gender
                    }
                  ]
                },
                {
                  "title":"Ski Bindings",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_SKIBINDINGS_" + gender
                    }
                  ]
                },
                {
                  "title":"Ski Poles",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_SKIPOLES_" + gender
                    }
                  ]
                }
              ]
            }

            if (category === 'SNOW') {
              var elements = [
                {
                  "title":"Snowboards",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_SNOWBOARDS_" + gender
                    }
                  ]
                },
                // {
                //   "title":"Demo Snowboards",
                //   "buttons":[
                //     {
                //       "type":"postback",
                //       "title":"Shop",
                //       "payload":"SHOWPRODUCTS_DEMOSNOWBOARDS_" + gender
                //     }
                //   ]
                // },
                {
                  "title":"Snowboard Bindings",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_SNOWBOARDBINDINGS_" + gender
                    }
                  ]
                },
                {
                  "title":"Snowboard Boots",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_SNOWBOARDBOOTS_" + gender
                    }
                  ]
                }
              ]
            }

            if (category === 'OUTER') {
              var elements = [
                {
                  "title":"Jackets",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_SKIJACKETS_" + gender
                    }
                  ]
                },
                {
                  "title":"Ski Pants",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_SKIPANTS_" + gender
                    }
                  ]
                },
                {
                  "title":"Bibs and Suspenders",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_BIBSANDSUSPENDERS_" + gender
                    }
                  ]
                }
              ]
            }

            if (category === 'CLOTH') {
              var elements = [
                {
                  "title":"Fleece",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_FLEECE_" + gender
                    }
                  ]
                },
                {
                  "title":"Hoodies",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_HOODIES_" + gender
                    }
                  ]
                },
                {
                  "title":"Sweaters",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_SWEATERS_" + gender
                    }
                  ]
                },
                {
                  "title":"Turtlenecks",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_TURTLENECKS_" + gender
                    }
                  ]
                },
                {
                  "title":"Thermals",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_THERMALS_" + gender
                    }
                  ]
                },
                {
                  "title":"T-Shirts",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_TSHIRTS_" + gender
                    }
                  ]
                }
              ]
            }

            if (category === 'ACCESS') {
              // GLOVES, GOGGLES, HELMETS, BAGS, AVALANCE, AUDIO
              var elements = [
                {
                  "title":"Gloves",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_GLOVES_" + gender
                    }
                  ]
                },
                {
                  "title":"Goggles",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_GOGGLES_" + gender
                    }
                  ]
                },
                {
                  "title":"Helmets",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_HELMETS_" + gender
                    }
                  ]
                },
                {
                  "title":"Bags",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_BAGS_" + gender
                    }
                  ]
                },
                {
                  "title":"Avalanche Gear",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_AVALANCHE_" + gender
                    }
                  ]
                },
                {
                  "title":"Audio",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":"Shop",
                      "payload":"SHOWPRODUCTS_AUDIO_" + gender
                    }
                  ]
                }
              ]
            }

            let messageData = {
              "recipient":{
                "id": event.sender.id
              },
              "message":{
                "attachment":{
                  "type":"template",
                  "payload":{
                    "template_type":"generic",
                    "elements": elements
                  }
                }
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
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
                // FLEECE, HOODIES, SWEATERS, TURUTLENECKS, THERMALS, TSHIRTS, SOCKS
              // ACCESS
                // GLOVES, GOGGLES, HELMETS, BAGS, AVALANCE, AUDIO
          })

        } else {
          var gender = event.postback.payload.split('_')[1]
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
                        "title":"Ski Gear",
                        "image_url": 'https://chat-sass-messenger-uploader.herokuapp.com/static/utah/first-filter/skis.png',
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Shop",
                            "payload":"CATS_SKI_" + gender
                          }
                        ]
                      },
                      {
                        "title":"Snowboard Gear",
                        "image_url": 'https://chat-sass-messenger-uploader.herokuapp.com/static/utah/first-filter/snow.png',
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Shop",
                            "payload":"CATS_SNOW_" + gender
                          }
                        ]
                      },
                      {
                        "title":"Outerwear",
                        "image_url": 'https://chat-sass-messenger-uploader.herokuapp.com/static/utah/first-filter/jacket.png',
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Shop",
                            "payload":"CATS_OUTER_" + gender
                          }
                        ]
                      },
                      {
                        "title":"Clothing",
                        "image_url": 'https://chat-sass-messenger-uploader.herokuapp.com/static/utah/first-filter/cloth.png',
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Shop",
                            "payload":"CATS_CLOTH_" + gender
                          }
                        ]
                      },
                      {
                        "title":"Accessories",
                        "image_url": 'https://chat-sass-messenger-uploader.herokuapp.com/static/utah/first-filter/access.png',
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Shop",
                            "payload":"CATS_ACCESS_" + gender
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            }
            callSendAPI(user.pageAccessToken, messageData)
            // CATS_SKI_WOMENS, CATS_SNOW_MENS, CATS_OUTER_KIDS, CATS_CLOTH_MENS, CATS_ACCESS_MENS
          })
        }
      }

      if (event.postback.payload.split('_')[0] === 'SHOWPRODUCTS') {
        const csv = require('csvtojson')

        var category = event.postback.payload.split('_')[1]
        var gender = event.postback.payload.split('_')[2]
        var searchParams
        var matchedItems = []
          getUser().then((user) => {
            if (category === 'SKIS') {
              searchParams = 'skis'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'DEMOSKIS') {
              searchParams = 'demo skis'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'SKIBOOTS') {
              searchParams = 'ski boots'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'SKIBINDINGS') {
              searchParams = 'ski bindings'

              gender = 'unisex'

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'SKIPOLES') {
              searchParams = 'ski poles'

              gender = 'unisex'

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'SNOWBOARDS') {
              searchParams = 'snowboards'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'SNOWBOARDBINDINGS') {
              searchParams = 'snowboard bindings'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'SNOWBOARDBOOTS') {
              searchParams = 'snowboard boots'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }


                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'SKIJACKETS') {
              searchParams = 'ski jackets'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'SKIPANTS') {
              searchParams = 'ski pants'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'BIBSANDSUSPENDERS') {
              searchParams = 'bibs & suspenders'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'FLEECE') {
              searchParams = 'fleece'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": itemCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    }
              })
            }

            if (category === 'HOODIES') {
              searchParams = 'hoodies'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      if (itemCarosel.length === 0) {
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Sold Out!')
                      } else {
                        let messageData = {
                          "recipient":{
                            "id": event.sender.id
                          },
                          "message":{
                            "attachment":{
                              "type":"template",
                              "payload":{
                                "template_type":"generic",
                                "elements": itemCarosel
                              }
                            }
                          }
                        }
                        callSendAPI(user.pageAccessToken, messageData)
                      }
                    }
              })
            }

            if (category === 'SWEATERS') {
              searchParams = 'sweaters'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      if (itemCarosel.length === 0) {
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Sold Out!')
                      } else {
                        let messageData = {
                          "recipient":{
                            "id": event.sender.id
                          },
                          "message":{
                            "attachment":{
                              "type":"template",
                              "payload":{
                                "template_type":"generic",
                                "elements": itemCarosel
                              }
                            }
                          }
                        }
                        callSendAPI(user.pageAccessToken, messageData)
                      }
                    }
              })
            }

            if (category === 'TURTLENECKS') {
              searchParams = 'turtlenecks'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      if (itemCarosel.length === 0) {
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Sold Out!')
                      } else {
                        let messageData = {
                          "recipient":{
                            "id": event.sender.id
                          },
                          "message":{
                            "attachment":{
                              "type":"template",
                              "payload":{
                                "template_type":"generic",
                                "elements": itemCarosel
                              }
                            }
                          }
                        }
                        callSendAPI(user.pageAccessToken, messageData)
                      }
                    }
              })
            }

            if (category === 'THERMALS') {
              searchParams = 'thermals'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      if (itemCarosel.length === 0) {
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Sold Out!')
                      } else {
                        let messageData = {
                          "recipient":{
                            "id": event.sender.id
                          },
                          "message":{
                            "attachment":{
                              "type":"template",
                              "payload":{
                                "template_type":"generic",
                                "elements": itemCarosel
                              }
                            }
                          }
                        }
                        callSendAPI(user.pageAccessToken, messageData)
                      }
                    }
              })
            }

            if (category === 'TSHIRTS') {
              searchParams = 't-shirts'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      if (itemCarosel.length === 0) {
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Sold Out!')
                      } else {
                        let messageData = {
                          "recipient":{
                            "id": event.sender.id
                          },
                          "message":{
                            "attachment":{
                              "type":"template",
                              "payload":{
                                "template_type":"generic",
                                "elements": itemCarosel
                              }
                            }
                          }
                        }
                        callSendAPI(user.pageAccessToken, messageData)
                      }
                    }
              })
            }

            if (category === 'GLOVES') {
              searchParams = 'gloves'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      if (itemCarosel.length === 0) {
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Sold Out!')
                      } else {
                        let messageData = {
                          "recipient":{
                            "id": event.sender.id
                          },
                          "message":{
                            "attachment":{
                              "type":"template",
                              "payload":{
                                "template_type":"generic",
                                "elements": itemCarosel
                              }
                            }
                          }
                        }
                        callSendAPI(user.pageAccessToken, messageData)
                      }
                    }
              })
            }

            if (category === 'GOGGLES') {
              searchParams = 'goggles'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      if (itemCarosel.length === 0) {
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Sold Out!')
                      } else {
                        let messageData = {
                          "recipient":{
                            "id": event.sender.id
                          },
                          "message":{
                            "attachment":{
                              "type":"template",
                              "payload":{
                                "template_type":"generic",
                                "elements": itemCarosel
                              }
                            }
                          }
                        }
                        callSendAPI(user.pageAccessToken, messageData)
                      }
                    }
              })
            }

            if (category === 'HELMETS') {
              searchParams = 'helmets'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                    var itemCarosel = []

                    for (var i = 0; i < matchedItems.length; i++) {
                      var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                      itemCarosel.push(
                        {
                          "title": matchedItems[randNum].Title,
                          "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                          "image_url": matchedItems[randNum]['Image URL'],
                          "buttons":[
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"Purchase",
                              "webview_height_ratio":"tall"
                            },
                            {
                              "type":"web_url",
                              "url": matchedItems[randNum]['Product URL'],
                              "title":"View Details",
                              "webview_height_ratio":"tall"
                            }
                          ]
                        }
                      )
                    }

                    if (itemCarosel.length > 10) {
                      let newCarosel = []
                      for (var i = 0; i < 10; i++) {
                        if (i === 10) {
                          newCarosel.push({
                            "title": 'See More',
                            "buttons":[
                              {
                                "type":"postback",
                                "title":"Show More",
                                "payload": "SHOWPRODUCTS_" + gender + "_" + category
                              },
                            ]
                          })

                        } else {
                          newCarosel.push(itemCarosel[i])
                        }
                      }

                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "attachment":{
                            "type":"template",
                            "payload":{
                              "template_type":"generic",
                              "elements": newCarosel
                            }
                          }
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                    } else {
                      if (itemCarosel.length === 0) {
                        sendTextMessage(event.sender.id, user.pageAccessToken, 'Sold Out!')
                      } else {
                        let messageData = {
                          "recipient":{
                            "id": event.sender.id
                          },
                          "message":{
                            "attachment":{
                              "type":"template",
                              "payload":{
                                "template_type":"generic",
                                "elements": itemCarosel
                              }
                            }
                          }
                        }
                        callSendAPI(user.pageAccessToken, messageData)
                      }
                    }
              })
            }

            if (category === 'BAGS') {
              searchParams = 'bags & packs'

              if (gender === 'MENS') {
                gender = 'male'
              } else if (gender === 'WOMENS') {
                gender = 'female'
              } else {
                gender = 'kids'
              }

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                var itemCarosel = []

                for (var i = 0; i < matchedItems.length; i++) {
                  var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                  itemCarosel.push(
                    {
                      "title": matchedItems[randNum].Title,
                      "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                      "image_url": matchedItems[randNum]['Image URL'],
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": matchedItems[randNum]['Product URL'],
                          "title":"Purchase",
                          "webview_height_ratio":"tall"
                        },
                        {
                          "type":"web_url",
                          "url": matchedItems[randNum]['Product URL'],
                          "title":"View Details",
                          "webview_height_ratio":"tall"
                        }
                      ]
                    }
                  )
                }

                if (itemCarosel.length > 10) {
                  let newCarosel = []
                  for (var i = 0; i < 10; i++) {
                    if (i === 10) {
                      newCarosel.push({
                        "title": 'See More',
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Show More",
                            "payload": "SHOWPRODUCTS_" + gender + "_" + category
                          },
                        ]
                      })

                    } else {
                      newCarosel.push(itemCarosel[i])
                    }
                  }

                  let messageData = {
                    "recipient":{
                      "id": event.sender.id
                    },
                    "message":{
                      "attachment":{
                        "type":"template",
                        "payload":{
                          "template_type":"generic",
                          "elements": newCarosel
                        }
                      }
                    }
                  }
                  callSendAPI(user.pageAccessToken, messageData)
                } else {
                  if (itemCarosel.length === 0) {
                    sendTextMessage(event.sender.id, user.pageAccessToken, 'Sold Out!')
                  } else {
                    let messageData = {
                      "recipient":{
                        "id": event.sender.id
                      },
                      "message":{
                        "attachment":{
                          "type":"template",
                          "payload":{
                            "template_type":"generic",
                            "elements": itemCarosel
                          }
                        }
                      }
                    }
                    callSendAPI(user.pageAccessToken, messageData)
                  }
                }
              })
            }

            if (category === 'AVALANCHE') {
              searchParams = 'avalanche gear'

              gender = 'unisex'

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                var itemCarosel = []

                for (var i = 0; i < matchedItems.length; i++) {
                  var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                  itemCarosel.push(
                    {
                      "title": matchedItems[randNum].Title,
                      "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                      "image_url": matchedItems[randNum]['Image URL'],
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": matchedItems[randNum]['Product URL'],
                          "title":"Purchase",
                          "webview_height_ratio":"tall"
                        },
                        {
                          "type":"web_url",
                          "url": matchedItems[randNum]['Product URL'],
                          "title":"View Details",
                          "webview_height_ratio":"tall"
                        }
                      ]
                    }
                  )
                }

                if (itemCarosel.length > 10) {
                  let newCarosel = []
                  for (var i = 0; i < 10; i++) {
                    if (i === 10) {
                      newCarosel.push({
                        "title": 'See More',
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Show More",
                            "payload": "SHOWPRODUCTS_" + gender + "_" + category
                          },
                        ]
                      })

                    } else {
                      newCarosel.push(itemCarosel[i])
                    }
                  }

                  let messageData = {
                    "recipient":{
                      "id": event.sender.id
                    },
                    "message":{
                      "attachment":{
                        "type":"template",
                        "payload":{
                          "template_type":"generic",
                          "elements": newCarosel
                        }
                      }
                    }
                  }
                  callSendAPI(user.pageAccessToken, messageData)
                } else {
                  if (itemCarosel.length === 0) {
                    sendTextMessage(event.sender.id, user.pageAccessToken, 'Sold Out!')
                  } else {
                    let messageData = {
                      "recipient":{
                        "id": event.sender.id
                      },
                      "message":{
                        "attachment":{
                          "type":"template",
                          "payload":{
                            "template_type":"generic",
                            "elements": itemCarosel
                          }
                        }
                      }
                    }
                    callSendAPI(user.pageAccessToken, messageData)
                  }
                }
              })
            }

            if (category === 'AUDIO') {
              searchParams = 'audio'

              gender = 'unisex'

              csv({
                noheader: true,
                delimiter: 'auto',
                headers: ['Unique ID', 'Title', 'Description', 'Category', 'Product URL', 'Image URL', 'Condition', 'Availability', 'Current Price', 'Brand', 'Size', 'Color', 'Original Price', 'Ship Weight', 'Shipping Cost', 'Google Product Category', 'GTIN', 'Connexity Product ID', 'AGE_GROUP', 'GENDER', 'Coupon Code']
              })
              .fromFile('data/Irrigate.txt')
              .on('json',(jsonObj) => {
                // console.log(jsonObj)
                if (jsonObj['Category'].toLowerCase() === searchParams) {
                  if (gender === 'kids') {
                    if (jsonObj['AGE_GROUP'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  } else {
                    if (jsonObj['GENDER'].toLowerCase() === gender) {
                      // console.log(jsonObj)
                      matchedItems.push(jsonObj)
                    }
                  }

                }
              })
              .on('done',(error) => {

                var itemCarosel = []

                for (var i = 0; i < matchedItems.length; i++) {
                  var randNum = Math.floor(Math.random() * matchedItems.length) + 1
                  itemCarosel.push(
                    {
                      "title": matchedItems[randNum].Title,
                      "subtitle": '$' + Math.round(matchedItems[randNum]['Current Price'] * 100)/100 + ', Size: ' + matchedItems[randNum]['Size'],
                      "image_url": matchedItems[randNum]['Image URL'],
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": matchedItems[randNum]['Product URL'],
                          "title":"Purchase",
                          "webview_height_ratio":"tall"
                        },
                        {
                          "type":"web_url",
                          "url": matchedItems[randNum]['Product URL'],
                          "title":"View Details",
                          "webview_height_ratio":"tall"
                        }
                      ]
                    }
                  )
                }

                if (itemCarosel.length > 10) {
                  let newCarosel = []
                  for (var i = 0; i < 10; i++) {
                    if (i === 10) {
                      newCarosel.push({
                        "title": 'See More',
                        "buttons":[
                          {
                            "type":"postback",
                            "title":"Show More",
                            "payload": "SHOWPRODUCTS_" + gender + "_" + category
                          },
                        ]
                      })

                    } else {
                      newCarosel.push(itemCarosel[i])
                    }
                  }

                  let messageData = {
                    "recipient":{
                      "id": event.sender.id
                    },
                    "message":{
                      "attachment":{
                        "type":"template",
                        "payload":{
                          "template_type":"generic",
                          "elements": newCarosel
                        }
                      }
                    }
                  }
                  callSendAPI(user.pageAccessToken, messageData)
                } else {
                  if (itemCarosel.length === 0) {
                    sendTextMessage(event.sender.id, user.pageAccessToken, 'Sold Out!')
                  } else {
                    let messageData = {
                      "recipient":{
                        "id": event.sender.id
                      },
                      "message":{
                        "attachment":{
                          "type":"template",
                          "payload":{
                            "template_type":"generic",
                            "elements": itemCarosel
                          }
                        }
                      }
                    }
                    callSendAPI(user.pageAccessToken, messageData)
                  }
                }
              })
            }



            // DEMOSNOWBOARDS

            // AVALANCHE
            // AUDIO


            // find list of products in category
            // check length
              // if under 10, then make carosel
              // else paginate
          })
      }

      if (event.postback.payload === 'CALL') {

      }

      if (event.postback.payload === 'FAQ') {

      }


    }


    if (event.message) {
      if (event.message.quick_reply) {
        if (event.message.quick_reply.payload.split('_')[0] === 'ENROLL') {
          if (event.message.quick_reply.payload.split('_')[1] === 'YES') {
            getUser().then((user) => {
              // send affirmative gif
              sendImageMessage(event.sender.id, user.pageAccessToken, 'https://chat-sass-messenger-uploader.herokuapp.com/static/utah/gif-yes.gif')
            })
          } else {
            getUser().then((user) => {
              // send negative gif
              sendImageMessage(event.sender.id, user.pageAccessToken, 'https://chat-sass-messenger-uploader.herokuapp.com/static/utah/gif-no.gif')
            })
          }
          setTimeout(() => {
            getUser().then((user) => {
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Instructions: scroll/swipe through categories to browse products. Tap “Buy now” to purchase.')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, 'Just click “Shop” in the menu to start browsing!')
              }, 4000)
            })
          }, 4500)
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
