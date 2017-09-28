var express = require('express')
var router = express.Router()

router.post('/', (req, res, next) => {
  console.log('sucessfully passed to diff router')
  var data = req.body
  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    console.log('data.entry: ' + JSON.stringify(data.entry))
    data.entry.forEach(function(entry) {
      var pageID = entry.id
      var timeOfEvent = entry.time
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
        } else if (event.postback) {

        }
      })
    })
  }

  res.sendStatus(200)
})

module.exports = router
