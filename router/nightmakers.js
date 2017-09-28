var express = require('express')
var router = express.Router()

router.post('/', (req, res, next) => {
  console.log('sucessfully passed to diff router')
})

module.exports = router
