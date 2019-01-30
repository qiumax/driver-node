var express = require('express');
var router = express.Router();
var driverController = require("../controllers/DriverController.js");

//router.get('/all', driverController.all);

router.post('/getDriver', driverController.getDriver)

router.post('/updateLocation', driverController.updateLocation)

router.post('/getNeeds', driverController.getNeeds)

router.post('/applyNeed', driverController.applyNeed)

router.post('/getCurrentOrder', driverController.getCurrentOrder)

router.post('/confirmGetCargo', driverController.confirmGetCargo)

router.post('/confirmDeliver', driverController.confirmDeliver)

router.post('/submitLog', driverController.submitLog)

router.post('/comment', driverController.comment)

module.exports = router;
