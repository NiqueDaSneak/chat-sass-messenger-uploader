'use strict'

// NPM PACKAGES
var express = require('express')

// APP DEFINITIONS
var app = express()

// ROUTES

// affirmation.today webhook
app.get('/webhook', function(req, res) {
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
