'use strict'

// var db = require('diskdb')
// db = db.connect('data', ['ski'])

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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome to Jewel School! Use the menu below to discover products, see how to videos, or search by your favorite hosts!')
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

  if (event.postback) {
    if (event.postback.payload === "GET_STARTED_PAYLOAD") {
      getUser().then((user) => {
        findMember(user)
      })
    }

    if (event.postback.payload.split("_")[0] === 'HOST') {
      getUser().then((user) => {
        var host = event.postback.payload.split("_")[1]

        switch (host) {
          case "SUSAN":
          var messageData = {
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
                      "title": "DIY Twisted Flat Wire Chandelier Earrings - Susan Thomas",
                      "image_url": "https://img.youtube.com/vi/az76i0ZH77Q/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=az76i0ZH77Q",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    },
                    {
                      "title": "DIY Crystal Quartz Point Earrings by Susan Thomas",
                      "image_url": "https://img.youtube.com/vi/n0aU5tCQJnk/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=n0aU5tCQJnk",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    },
                    {
                      "title": "Jewel School: Susan Thomas Design OnThe Fly- Copper Earrings",
                      "image_url": "https://img.youtube.com/vi/qj15oQt46fM/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=qj15oQt46fM",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
            break;
          case "GAIL":
          var messageData = {
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
                      "title": "DIY-Herringbone Stitch with Superduos by Gail Deluca",
                      "image_url": "https://img.youtube.com/vi/FO-EeSe_SCo/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=FO-EeSe_SCo",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    },
                    {
                      "title": "Gail DeLuca's Peyote Stitch Beaded Bead",
                      "image_url": "https://img.youtube.com/vi/qxAYE60C7Rg/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=qxAYE60C7Rg",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    },
                    {
                      "title": "Jewel School: Gail DeLuca Whammer Earrings 1 of 2",
                      "image_url": "https://img.youtube.com/vi/TPBKl0rBoWs/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=TPBKl0rBoWs",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
            break;
          case "MELISSA":
          var messageData = {
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
                      "title": "DIY Leather Cuff - Melissa Cable",
                      "image_url": "https://img.youtube.com/vi/KOTo4slIBv8/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=KOTo4slIBv8",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    },
                    {
                      "title": "DIY Cable Leather Bead - Melissa Cable",
                      "image_url": "https://img.youtube.com/vi/AjIqqk90_jA/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=AjIqqk90_jA",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    },
                    {
                      "title": "Melissa Cable Create Recklessly Mega Tool Kit",
                      "image_url": "https://img.youtube.com/vi/gY68yfBmD24/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=gY68yfBmD24",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
            break;
          case "WYATT":
          var messageData = {
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
                      "title": "DIY White Bracevar Jig Necklace - Wyatt White",
                      "image_url": "https://img.youtube.com/vi/s38IemGAXjY/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=s38IemGAXjY",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    },
                    {
                      "title": "Award Winning 3D Jig Bracevar By Wyatt White",
                      "image_url": "https://img.youtube.com/vi/J4ppl_e3gLg/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=J4ppl_e3gLg",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    },
                    {
                      "title": "How to Use the 3D Bracevar Jig with Wyatt White",
                      "image_url": "https://img.youtube.com/vi/aqYC06CdJ_Q/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=aqYC06CdJ_Q",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
            break;
          default:
        }
      })
    }

    if (event.postback.payload === 'DISCOVER') {
      getUser().then((user) => {
        var messageData = {
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
                    "title": "Kits",
                    "image_url": "https://i5.jtv.com/loadimage.aspx?btype=.jpg&cgid=3401904&img=1&h=300&w=400",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": "https://www.jtv.com/jewelry-making?prefn1=A_TYPE_ID&prefv1=Jewelry%20Making%20Kit&sz=12",
                        "title":"Shop Now",
                        "webview_height_ratio":"tall"
                      }
                    ]
                  },
                  {
                    "title": "Beads",
                    "url": "https://i5.jtv.com/loadimage.aspx?btype=.jpg&cgid=3354030&img=1&h=300&w=400",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": "https://www.jtv.com/jewelry-making?prefn1=A_TYPE_ID&prefv1=Bead%20Strand&sz=12",
                        "title":"Shop Now",
                        "webview_height_ratio":"tall"
                      }
                    ]
                  },
                  {
                    "title": "Education DVDs",
                    "url": "https://i5.jtv.com/loadimage.aspx?btype=.jpg&cgid=3392436&img=1&h=300&w=400",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": "https://www.jtv.com/jewelry-making/jewelry-making-education",
                        "title":"Shop Now",
                        "webview_height_ratio":"tall"
                      }
                    ]
                  },
                  {
                    "title": "Tools",
                    "url": "https://i5.jtv.com/loadimage.aspx?btype=.jpg&cgid=3348471&img=1&h=300&w=400",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": "https://www.jtv.com/jewelry-making/jewelry-making-tools",
                        "title":"Shop Now",
                        "webview_height_ratio":"tall"
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

    if (event.postback.payload === 'HOWTO') {
      getUser().then((user) => {
        var messageData = {
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
                    "title": "Here are our featured how-tos. Visit our Youtube Channel for more!",
                    "buttons":[
                      {
                        "type":"web_url",
                        "url": "https://www.youtube.com/user/jewelrytelevision/videos",
                        "title":"Go To Channel",
                        "webview_height_ratio":"tall"
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
        callSendAPI(user.pageAccessToken, messageData)
        setTimeout(() => {
          var messageData = {
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
                      "title": "DIY Tip- How To Add Thread To A Seed Beading Project",
                      "image_url": "https://img.youtube.com/vi/YjD64nlyYuQ/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=YjD64nlyYuQ",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    },
                    {
                      "title": "How to Make a Polymer Clay Rose - Tutorial",
                      "image_url": "https://img.youtube.com/vi/mRLIxgxriTY/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=mRLIxgxriTY",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    },
                    {
                      "title": "How to Use Ice Resin - DIY Bezel Pendant",
                      "image_url": "https://img.youtube.com/vi/yREIw7HmH9Y/hqdefault.jpg",
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": "https://www.youtube.com/watch?v=yREIw7HmH9Y",
                          "title":"Watch",
                          "webview_height_ratio":"compact"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        }, 1500)
      })
    }

    if (event.postback.payload === 'HOST') {
      getUser().then((user) => {
        var messageData = {
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
                    "title": "Susan Thomas",
                    "image_url": "https://img.youtube.com/vi/az76i0ZH77Q/hqdefault.jpg",
                    "buttons":[
                      {
                        "type":"postback",
                        "title":"Show Videos",
                        "payload": "HOST_SUSAN"
                      }
                    ]
                  },
                  {
                    "title": "Gail Deluca",
                    "image_url": "https://img.youtube.com/vi/FO-EeSe_SCo/hqdefault.jpg",
                    "buttons":[
                      {
                        "type":"postback",
                        "title":"Show Videos",
                        "payload": "HOST_GAIL"
                      }
                    ]
                  },
                  {
                    "title": "Melissa Cable",
                    "image_url": "https://img.youtube.com/vi/KOTo4slIBv8/hqdefault.jpg",
                    "buttons":[
                      {
                        "type":"postback",
                        "title":"Show Videos",
                        "payload": "HOST_MELISSA"
                      }
                    ]
                  },
                  {
                    "title": "Wyatt White",
                    "image_url": "https://img.youtube.com/vi/s38IemGAXjY/hqdefault.jpg",
                    "buttons":[
                      {
                        "type":"postback",
                        "title":"Show Videos",
                        "payload": "HOST_WYATT"
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

    if (event.postback.payload === "") {}
  } else {
  //   if (event.message.quick_reply.payload === 'DISCOVER') {
  //     getUser().then((user) => {
  //       var messageData = {
  //         "recipient":{
  //           "id": event.sender.id
  //         },
  //         "message":{
  //           "attachment":{
  //             "type":"template",
  //             "payload":{
  //               "template_type":"generic",
  //               "elements": [
  //                 {
  //                   "title": "Kits",
  //                   "buttons":[
  //                     {
  //                       "type":"web_url",
  //                       "url": "google.com",
  //                       "title":"Shop Now",
  //                       "webview_height_ratio":"tall"
  //                     }
  //                   ]
  //                 },
  //                 {
  //                   "title": "Beads",
  //                   "buttons":[
  //                     {
  //                       "type":"web_url",
  //                       "url": "google.com",
  //                       "title":"Shop Now",
  //                       "webview_height_ratio":"tall"
  //                     }
  //                   ]
  //                 },
  //                 {
  //                   "title": "Education DVDs",
  //                   "buttons":[
  //                     {
  //                       "type":"web_url",
  //                       "url": "google.com",
  //                       "title":"Shop Now",
  //                       "webview_height_ratio":"tall"
  //                     }
  //                   ]
  //                 },
  //                 {
  //                   "title": "Tools",
  //                   "buttons":[
  //                     {
  //                       "type":"web_url",
  //                       "url": "google.com",
  //                       "title":"Shop Now",
  //                       "webview_height_ratio":"tall"
  //                     }
  //                   ]
  //                 }
  //               ]
  //             }
  //           }
  //         }
  //       }
  //       callSendAPI(user.pageAccessToken, messageData)
  //     })
  //   }
  //
  //   if (event.message.quick_reply.payload === 'HOWTO') {
  //     getUser().then((user) => {
  //       var messageData = {
  //         "recipient":{
  //           "id": event.sender.id
  //         },
  //         "message":{
  //           "attachment":{
  //             "type":"template",
  //             "payload":{
  //               "template_type":"generic",
  //               "elements": [
  //                 {
  //                   "title": "Here are our featured how-tos. Visit our Youtube Channel for more!",
  //                   "buttons":[
  //                     {
  //                       "type":"web_url",
  //                       "url": "google.com",
  //                       "title":"Go To Channel",
  //                       "webview_height_ratio":"tall"
  //                     }
  //                   ]
  //                 }
  //               ]
  //             }
  //           }
  //         }
  //       }
  //       callSendAPI(user.pageAccessToken, messageData)
  //       setTimeout(() => {
  //         var messageData = {
  //           "recipient":{
  //             "id": event.sender.id
  //           },
  //           "message":{
  //             "attachment":{
  //               "type":"template",
  //               "payload":{
  //                 "template_type":"generic",
  //                 "elements": [
  //                   {
  //                     "title": "DIY Tip- How To Add Thread To A Seed Beading Project",
  //                     "image_url": "https://img.youtube.com/vi/YjD64nlyYuQ/hqdefault.jpg",
  //                     "buttons":[
  //                       {
  //                         "type":"web_url",
  //                         "url": "https://www.youtube.com/watch?v=YjD64nlyYuQ",
  //                         "title":"Watch",
  //                         "webview_height_ratio":"compact"
  //                       }
  //                     ]
  //                   },
  //                   {
  //                     "title": "How to Make a Polymer Clay Rose - Tutorial",
  //                     "image_url": "https://img.youtube.com/vi/mRLIxgxriTY/hqdefault.jpg",
  //                     "buttons":[
  //                       {
  //                         "type":"web_url",
  //                         "url": "https://www.youtube.com/watch?v=mRLIxgxriTY",
  //                         "title":"Watch",
  //                         "webview_height_ratio":"compact"
  //                       }
  //                     ]
  //                   },
  //                   {
  //                     "title": "How to Use Ice Resin - DIY Bezel Pendant",
  //                     "image_url": "https://img.youtube.com/vi/yREIw7HmH9Y/hqdefault.jpg",
  //                     "buttons":[
  //                       {
  //                         "type":"web_url",
  //                         "url": "https://www.youtube.com/watch?v=yREIw7HmH9Y",
  //                         "title":"Watch",
  //                         "webview_height_ratio":"compact"
  //                       }
  //                     ]
  //                   }
  //                 ]
  //               }
  //             }
  //           }
  //         }
  //         callSendAPI(user.pageAccessToken, messageData)
  //       }, 1500)
  //     })
  //   }
  //
  //   if (event.message.quick_reply.payload === 'HOST') {
  //     getUser().then((user) => {
  //       var messageData = {
  //         "recipient":{
  //           "id": event.sender.id
  //         },
  //         "message":{
  //           "attachment":{
  //             "type":"template",
  //             "payload":{
  //               "template_type":"generic",
  //               "elements": [
  //                 {
  //                   "title": "Susan Thomas",
  //                   "image_url": "",
  //                   "buttons":[
  //                     {
  //                       "type":"postback",
  //                       "title":"Show Videos",
  //                       "payload": "HOST_SUSAN"
  //                     }
  //                   ]
  //                 },
  //                 {
  //                   "title": "Gail Deluca",
  //                   "image_url": "",
  //                   "buttons":[
  //                     {
  //                       "type":"postback",
  //                       "title":"Show Videos",
  //                       "payload": "HOST_GAIL"
  //                     }
  //                   ]
  //                 },
  //                 {
  //                   "title": "Melissa Cable",
  //                   "image_url": "",
  //                   "buttons":[
  //                     {
  //                       "type":"postback",
  //                       "title":"Show Videos",
  //                       "payload": "HOST_MELISSA"
  //                     }
  //                   ]
  //                 },
  //                 {
  //                   "title": "Wyatt White",
  //                   "image_url": "",
  //                   "buttons":[
  //                     {
  //                       "type":"postback",
  //                       "title":"Show Videos",
  //                       "payload": "HOST_WYATT"
  //                     }
  //                   ]
  //                 }
  //
  //               ]
  //             }
  //           }
  //         }
  //       }
  //       callSendAPI(user.pageAccessToken, messageData)
  //     })
  //   }
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

}
