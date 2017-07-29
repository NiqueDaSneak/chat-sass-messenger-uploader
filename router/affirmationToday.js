// HELPER FUNCTIONS

var sendingFeedback = false

function eventHandler(event) {
  console.log('event.sender: ' + event.sender)

  var senderID = event.sender.id
    if (event.postback) {
      var existingMember
      var postback = event.postback.payload
        switch (postback) {
            case 'GET_STARTED_PAYLOAD':
                Member.findOne({fbID: senderID}, (err, member) => {
                   if (err) return console.log(err)
                   if (member === null) {
                     request({
                       uri: 'https://graph.facebook.com/v2.6/' + senderID + '?access_token=EAAFTJz88HJUBAJqx5WkPGiIi0jPRyBXmpuN56vZB0FowKCZCzej8zpM4hKTt2ZCXqDZASqL4GUC5ywuOjakob1icM4Sfa4L3xcpsTKsjHl0QHzPylbHjJakyq1hcPNA4i8wt7XjsGZBGoUNYP7Yx2hg8RYiG9xzUoo0dzuThqGwZDZD',
                       method: 'GET'
                     }, function(error, response, body) {
                       if (error) {
                         return console.error('upload failed:', error);
                       }
                       var data = JSON.parse(body)
                       // NEED TO FIND ORG NAME AND REPLACE BELOW
                       var newMember = new Member({organization: 'AffirmationToday', fbID: senderID, fullName: data.first_name + ' ' + data.last_name, photo: data.profile_pic, enrolled: false, timezone: data.timezone})
                       newMember.save((err, member) => {
                         if (err) return console.error(err)
                       })
                       sendWelcomeMessage(senderID, 'Hello '+ data.first_name +'! Welcome to Affirmation.today! Would you like to sign up for reoccuring messages')
                     })
                   } else {
                     existingMember = true
                     sendTextMessage(senderID, 'Welcome back! Use the menu for your actions!')
                   }
                })
                break
            case 'YES_SCHEDULE_MSG':
                var msg1 = new Promise(function(resolve, reject) {
                  resolve(
                    sendTextMessage(senderID, "You've been enrolled! Look for your affirmations to start coming tomorrow! In the mean time, here is another affirmation for today!")
                  )
                })
                var msg2 = new Promise(function(resolve, reject) {
                  resolve(
                    Affirmation.find((err, affirmation) => {
                      var aff
                      if (err) return console.error(err)
                      aff = affirmation[Math.floor(Math.random() * affirmation.length) + 1].text
                      sendImage(senderID, "www.affirmation.today/img/affirmations/image" + rand + ".jpg")
                      sendTextMessage(senderID, aff)
                    })
                  )
                })

                Member.update({fbID: senderID}, {enrolled: true}, (err, raw) => {
                  if (err) return console.log(err)
                })

                msg1.then(() => {
                  msg2.then(() => {
                  })
                })
                break
            case 'NO_SCHEDULE_MSG':
                var msg1 = new Promise(function(resolve, reject) {
                  resolve(
                    sendTextMessage(senderID, 'That is fine! Let us know if you change your mind! In the mean time, here is the affirmation for today!')
                  )
                })
                var msg2 = new Promise(function(resolve, reject) {
                  Affirmation.find((err, affirmation) => {
                    var aff
                    if (err) return console.error(err)
                    aff = affirmation[Math.floor(Math.random() * affirmation.length)].text
                    resolve(sendTextMessage(senderID, aff))
                  })
                })
                var msg3 = new Promise(function(resolve, reject) {
                  resolve(sendImage(senderID, "www.affirmation.today/img/affirmations/image" + rand + ".jpg"))
                });

                msg1.then(() => {
                  msg2.then(() => {
                    msg3.then(() => {
                    })
                  })
                })
                break
            case 'SEND_AFF':
                var variations = ['A great one!', 'Powerful stuff right here...', 'This one is gold...', 'Found a good one for you...', 'Love this one...']
                var msg1 = new Promise(function(resolve, reject) {
                  resolve(
                    sendTextMessage(senderID, variations[Math.floor(Math.random() * variations.length)])
                  )
                })
                var msg2 = new Promise(function(resolve, reject) {
                  Affirmation.find((err, affirmation) => {
                    var aff
                    if (err) return console.error(err)
                    aff = affirmation[Math.floor(Math.random() * affirmation.length)].text
                    resolve(sendTextMessage(senderID, aff))
                  })
                })
                var msg3 = new Promise(function(resolve, reject) {
                  resolve(sendImage(senderID, "www.affirmation.today/img/affirmations/image" + rand + ".jpg"))
                })

                msg1.then(() => {
                  setTimeout(() => {
                    msg2.then(() => {
                      msg3.then(() => {
                      })
                    })
                  }, 2000)
                })
                break
            case 'CANCEL_SUB':
                Member.update({fbID: senderID}, {enrolled: false}, (err, raw) => {
                  if (err) return console.log(err)
                })
                sendTextMessage(senderID, 'You have been unenrolled!')
                setTimeout(() => {
                  sendTextMessage(senderID, 'Would you mind sending us a message with some feedback, we are curious why you wanted to stop!')
                  sendTextMessage(senderID, 'We appreciate your honesty!')
                }, 2000)
                sendingFeedback = true
                break
            case 'FEEDBACK':
                sendTextMessage(senderID, "Go ahead and tap 'Send a message' and speak your mind!")
                sendingFeedback = true
                break
            default:
                console.log(postback)
        }
    }

    if (event.message) {
      if (sendingFeedback === true) {
        var newFeedback = new Feedback({text: event.message.text})
        newFeedback.save((err, feedback) => {
          if (err) return console.error(err)
        })
        sendTextMessage(senderID, 'Thanks for the feedback! We appreciate you taking the time!')
        sendingFeedback = false
      } else {
        sendTextMessage(senderID, 'Use the menu for actions you can take!')
      }
    }
}


// SCHEDULER
var scheduler = require('node-schedule')

var n_america_west_coast = scheduler.scheduleJob('4 44 13 * * *', function(){
    var findMember = new Promise(function(resolve, reject) {
      console.log('Searching for members in North American West Coast')
      resolve(
        Member.find({
          $and: [
            {enrolled: 'true'},
            { $or: [ {timezone: -12},{timezone: -11},{timezone: -10},{timezone: -9}, {timezone: -8}, {timezone: -7} ] }
          ]
        })
      )
    })
  var affProm = new Promise(function(resolve, reject) {
      Affirmation.find((err, affirmation) => {
        if (err) return console.error(err)
        resolve(affirmation)
       })
    })

  findMember.then((doc) => {
      var members = []
      for (var i = 0; i < doc.length; i++) {
        var memberID = doc[i].fbID
        members.push(memberID)
      }
      affProm.then((aff) => {
        for (var i = 0; i < member.length; i++) {
          sendImage(members[i], "www.affirmation.today/img/affirmations/image" + rand + ".jpg")
          sendTextMessage(members[i], aff[Math.floor(Math.random() * aff.length)].text)
        }
      })
    })
})

var s_america_and_n_america_east_coast = scheduler.scheduleJob('4 44 8 * * *', function(){
    var findMember = new Promise(function(resolve, reject) {
      console.log('Searching for members in South America and North American East Coast')
      resolve(
        Member.find({
          $and: [
            {enrolled: 'true'},
            { $or: [ {timezone: -6}, {timezone: -5}, {timezone: -4}, {timezone: -3} ] }
          ]
        })
      )
    })

    var affProm = new Promise(function(resolve, reject) {
      Affirmation.find((err, affirmation) => {
        if (err) return console.error(err)
        resolve(affirmation)
       })
    })

    findMember.then((doc) => {
      var members = []
      for (var i = 0; i < doc.length; i++) {
        var memberID = doc[i].fbID
        members.push(memberID)
      }
      affProm.then((aff) => {
        for (var i = 0; i < members.length; i++) {
          sendImage(members[i])
          sendTextMessage(members[i], aff[Math.floor(Math.random() * aff.length)].text)
        }
      })
    })
})

var africa_and_w_europe = scheduler.scheduleJob('4 44 3 * * *', function(){
  var findMember = new Promise(function(resolve, reject) {
      console.log('Searching for members in Africa and West Europe')
      resolve(
        Member.find({
          $and: [
            {enrolled: 'true'},
            { $or: [ {timezone: 0}, {timezone: 1}, {timezone: 2}, {timezone: 3} ] }
          ]
        })
      )
    })

    var affProm = new Promise(function(resolve, reject) {
      Affirmation.find((err, affirmation) => {
        if (err) return console.error(err)
        resolve(affirmation)
       })
    })

    findMember.then((doc) => {
      var members = []
      for (var i = 0; i < doc.length; i++) {
        var memberID = doc[i].fbID
        members.push(memberID)
      }
      affProm.then((aff) => {
        for (var i = 0; i < members.length; i++) {
          sendImage(members[i], "www.affirmation.today/img/affirmations/image" + rand + ".jpg")
          sendTextMessage(members[i], aff[Math.floor(Math.random() * aff.length)].text)
        }
      })
    })
})

var middle_east_and_e_europe = scheduler.scheduleJob('4 44 1 * * *', function(){
  var findMember = new Promise(function(resolve, reject) {
      console.log('Searching for members in Middle East & Eastern Europe')
      resolve(
        Member.find({
          $and: [
            {enrolled: 'true'},
            { $or: [ {timezone: 4}, {timezone: 5}, {timezone: 6}, {timezone: 7} ] }
          ]
        })
      )
    })

    var affProm = new Promise(function(resolve, reject) {
      Affirmation.find((err, affirmation) => {
        if (err) return console.error(err)
        resolve(affirmation)
       })
    })

    findMember.then((doc) => {
      var members = []
      for (var i = 0; i < doc.length; i++) {
        var memberID = doc[i].fbID
        members.push(memberID)
      }
      affProm.then((aff) => {
        for (var i = 0; i < members.length; i++) {
          sendImage(members[i], "www.affirmation.today/img/affirmations/image" + rand + ".jpg")
          sendTextMessage(members[i], aff[Math.floor(Math.random() * aff.length)].text)
        }
      })
    })
})

var asia_and_oceania = scheduler.scheduleJob('4 44 18 * * *', function(){
  var findMember = new Promise(function(resolve, reject) {
      console.log('Searching for members in Asia and Oceania')
      resolve(
        Member.find({
          $and: [
            {enrolled: 'true'},
            { $or: [ {timezone: 8}, {timezone: 9}, {timezone: 10}, {timezone: 11}, {timezone: 12} ] }
          ]
        })
      )
    })

    var affProm = new Promise(function(resolve, reject) {
      Affirmation.find((err, affirmation) => {
        if (err) return console.error(err)
        resolve(affirmation)
       })
    })

    findMember.then((doc) => {
      var members = []
      for (var i = 0; i < doc.length; i++) {
        var memberID = doc[i].fbID
        members.push(memberID)
      }
      affProm.then((aff) => {
        for (var i = 0; i < members.length; i++) {
          sendImage(members[i], "www.affirmation.today/img/affirmations/image" + rand + ".jpg")
          sendTextMessage(members[i], aff[Math.floor(Math.random() * aff.length)].text)
        }
      })
    })
})
