'use strict'

// NPM PACKAGES
var express = require('express')

// APP DEFINITIONS
var app = express()

// WEBHOOK VARIABLES
var affirmationTodayString = 'hoOUtqfjwQ'
var app1String = 'WYfhUsS0v3'
var app2String = 'iJ6TQVbTXH'
var app3String = 'mPNXmPE2C9'
var app4String = 'JRslAGYMSX'
var app5String = '247y7YA1FC'
var app6String = 'dhMNG7liLC'
var app7String = 'tbzQb4qYgT'
var app8String = '37aD3CcZtU'
var app9String = 'u9nltnhPj7'

// ROUTES

// affirmation.today webhook
var num = 1239
app.get('/' + num, (req,res) => {
  res.send('hello affirmation.today')
})

app.get('/' + affirmationTodayString, function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'jai_jai_ganesha') {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge'])
    } else {
        console.error("Failed validation. Make sure the validation tokens match.")
        res.sendStatus(403)
    }
})

// SERVER LISTENING
var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log('Server running on port ' + port)
})
app.on('error', function() {
    console.log(error)
})
