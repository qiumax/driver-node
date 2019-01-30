var express = require('express');
var router = express.Router();
var smsController = require("../controllers/SmsController.js");

router.post('/sendsms', smsController.sendsms);

module.exports = router;