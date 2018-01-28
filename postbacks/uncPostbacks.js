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
              sendTextMessage(event.sender.id, user.pageAccessToken, 'Welcome to the UNC Shuford Program Messenger Experience.')
              setTimeout(() => {
                sendTextMessage(event.sender.id, user.pageAccessToken, 'The Shuford Program in Entrepreneurship is for students from all backgrounds that are pursuing any major across campus.')
                setTimeout(() => {
                  sendTextMessage(event.sender.id, user.pageAccessToken, 'The program was founded on the understanding that there is a common process for the realization of new ventures, whether those ventures are startups, non-profits, artistic endeavors or even growth within existing enterprises.')
                  setTimeout(() => {
                    sendTextMessage(event.sender.id, user.pageAccessToken, 'We partnered with a startup from a former UNC Student in the minor, Irrigate, to bring you internship information in a smarter and more engaging way through Messenger.')
                    setTimeout(() => {
                      let messageData = {
                        "recipient":{
                          "id": event.sender.id
                        },
                        "message":{
                          "text": "What would you like to do:",
                          "quick_replies":[
                            {
                              "content_type":"text",
                              "title":"Search Internships",
                              "payload":"SEARCH"
                            },
                            {
                              "content_type":"text",
                              "title":"Browse Tracks",
                              "payload":"BROWSE"
                            },
                            {
                              "content_type":"text",
                              "title":"Leave Feedback",
                              "payload":"FEEDBACK"
                            },
                          ]
                        }
                      }
                      callSendAPI(user.pageAccessToken, messageData)
                      resolve()
                    }, 6000)
                  }, 7000)
                }, 2500)
              }, 2000)
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
      // ENROLLING MEMBERS INTO THE IRRIGATE APP
      getUser().then((user) => {
        findMember(user)
      })
    }

    if (event.postback.payload === "SEARCH") {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, "Scroll or swipe to browse internships.")
        setTimeout(() => {
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
                      "title":"Irrigate Messaging",
                      "subtitle":"Blog Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"White Paper Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Social Media Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Business Development Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Web Designer- Front End Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Back End Developer Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Customer Experience Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        }, 2500)
      })
    }

    if (event.postback.payload === "BROWSE") {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, "The Shuford Program in Entrepreneurship at the University of North Carolina at Chapel Hill teaches students the necessary skills to start successful ventures.")
        setTimeout(() => {
          sendTextMessage(event.sender.id, user.pageAccessToken, "This interdisciplinary program in UNC's College of Arts and Sciences encourages students to think and act entrepreneurially.")
          setTimeout(() => {
            sendTextMessage(event.sender.id, user.pageAccessToken, "Students will gain knowledge and skills to start successful ventures of all kinds: artistic,  commercial, media, social, scientific, sports, and public health.")
            setTimeout(() => {
              sendTextMessage(event.sender.id, user.pageAccessToken, "Scroll or swipe to browse tracks:")
              setTimeout(() => {
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
                            "title":"Commercial",
                            "subtitle":"The process behind starting a commercial venture",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/commercial/commercial.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/commercial",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Social",
                            "subtitle":"The process behind starting a social venture",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/social-track/social.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/social-track",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Scientific",
                            "subtitle":"Entrepreneurship in scientific and high tech fields",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/social-track/social.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://files.eminor2015.gethifi.com/tracks/scientific-track/scientific.png",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Artistic",
                            "subtitle":"The process behind starting an artistic venture",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/artistic-track/artistic.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/artistic-track",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Sport",
                            "subtitle":"Entrepreneurship in sports, fitness, and exercise science related fields",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/sport-track/sport.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/sport-track",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Public Health",
                            "subtitle":"Innovation directed at improving the health and welfare of populations",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/public-health-track/publichealth.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/public-health-track",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Design",
                            "subtitle":"Students to explore the full breadth of the creative industry",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/design-track/design.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/design-track",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Media",
                            "subtitle":"Learn about innovation in the Media Indusrty",
                            "image_url":"http://files.www.unceminor.org/tracks/media/media-img.jpg",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/media",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Computer Science",
                            "subtitle":"The intersection of Entrepreneurship and Computer Science",
                            "image_url":"http://files.www.unceminor.org/tracks/computer-science/computer-science-img.jpg",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/computer-science",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                        ]
                      }
                    }
                  }
                }
                callSendAPI(user.pageAccessToken, messageData)
              }, 1000)
            }, 4000)
          }, 4000)
        }, 5500)
      })
    }

    if (event.postback.payload === "FEEDBACK") {
      getUser().then((user) => {})

    }
  }

  if (event.message) {
    if (event.message.quick_reply.payload === 'SEARCH') {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, "Scroll or swipe to browse internships.")
        setTimeout(() => {
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
                      "title":"Irrigate Messaging",
                      "subtitle":"Blog Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"White Paper Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Social Media Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Business Development Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Web Designer- Front End Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Back End Developer Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                    {
                      "title":"Irrigate Messaging",
                      "subtitle":"Customer Experience Intern",
                      "image_url":"https://www.irrigatemsg.com/imgs/new-logo.png",
                      "buttons":[
                        {
                          "type": "web_url",
                          "url": "https://www.irrigatemsg.com/commerce",
                          "webview_height_ratio": "full",
                          "title":"Explore Company"
                        },
                        {
                          "type":"web_url",
                          "url":"https://petersfancybrownhats.com",
                          "webview_height_ratio": "full",
                          "title":"Job Description"
                        }
                      ]
                    },
                  ]
                }
              }
            }
          }
          callSendAPI(user.pageAccessToken, messageData)
        }, 2500)
      })
    }

    if (event.message.quick_reply.payload === 'BROWSE') {
      getUser().then((user) => {
        sendTextMessage(event.sender.id, user.pageAccessToken, "The Shuford Program in Entrepreneurship at the University of North Carolina at Chapel Hill teaches students the necessary skills to start successful ventures.")
        setTimeout(() => {
          sendTextMessage(event.sender.id, user.pageAccessToken, "This interdisciplinary program in UNC's College of Arts and Sciences encourages students to think and act entrepreneurially.")
          setTimeout(() => {
            sendTextMessage(event.sender.id, user.pageAccessToken, "Students will gain knowledge and skills to start successful ventures of all kinds: artistic,  commercial, media, social, scientific, sports, and public health.")
            setTimeout(() => {
              sendTextMessage(event.sender.id, user.pageAccessToken, "Scroll or swipe to browse tracks:")
              setTimeout(() => {
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
                            "title":"Commercial",
                            "subtitle":"The process behind starting a commercial venture",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/commercial/commercial.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/commercial",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Social",
                            "subtitle":"The process behind starting a social venture",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/social-track/social.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/social-track",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Scientific",
                            "subtitle":"Entrepreneurship in scientific and high tech fields",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/social-track/social.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://files.eminor2015.gethifi.com/tracks/scientific-track/scientific.png",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Artistic",
                            "subtitle":"The process behind starting an artistic venture",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/artistic-track/artistic.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/artistic-track",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Sport",
                            "subtitle":"Entrepreneurship in sports, fitness, and exercise science related fields",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/sport-track/sport.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/sport-track",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Public Health",
                            "subtitle":"Innovation directed at improving the health and welfare of populations",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/public-health-track/publichealth.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/public-health-track",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Design",
                            "subtitle":"Students to explore the full breadth of the creative industry",
                            "image_url":"http://files.eminor2015.gethifi.com/tracks/design-track/design.png",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/design-track",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Media",
                            "subtitle":"Learn about innovation in the Media Indusrty",
                            "image_url":"http://files.www.unceminor.org/tracks/media/media-img.jpg",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/media",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                          {
                            "title":"Computer Science",
                            "subtitle":"The intersection of Entrepreneurship and Computer Science",
                            "image_url":"http://files.www.unceminor.org/tracks/computer-science/computer-science-img.jpg",
                            "buttons":[
                              {
                                "type": "web_url",
                                "url": "http://www.unceminor.org/tracks/computer-science",
                                "webview_height_ratio": "full",
                                "title":"Explore "
                              },
                              {
                                "type":"web_url",
                                "url":"https://www.tfaforms.com/4622986",
                                "webview_height_ratio": "full",
                                "title":"Apply Now"
                              }
                            ]
                          },
                        ]
                      }
                    }
                  }
                }
                callSendAPI(user.pageAccessToken, messageData)
              }, 1000)
            }, 4000)
          }, 4000)
        }, 5500)
      })
    }

    if (event.message.quick_reply.payload === 'FEEDBACK') {

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
