'use strict'

var db = require('../data/jtvData.js')

var Message = require('../models/messageModel.js')
var Group = require('../models/groupModel.js')
var User = require('../models/userModel.js')
var Member = require('../models/memberModel.js')

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
                setTimeout(() => {
                  sendVideoMessage(event.sender.id, user.pageAccessToken, 'https://chat-sass-messenger-uploader.herokuapp.com/data/jtv.mp4')
                }, 3000)
                setTimeout(() => {
                  sendTextMessage(event.sender.id, user.pageAccessToken, "Tap the 'Start Shopping' button below to begin.")
                }, 7000)
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
    // send intro copy
    // send inital video msg
    // send menu description msg
  }

  if (event.postback.payload === "SHOW_CATS") {
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
