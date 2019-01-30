var express = require('express');
var router = express.Router();
var userController = require("../controllers/UserController.js");

router.post('/getDriverInfo', userController.getDriverInfo);

router.post('/userfollowers', userController.userfollowers);

router.post('/userfollowers', userController.userfollowers);

router.post('/userpacks', userController.userpacks);

router.post('/wxacode', userController.wxacode);

router.post('/getInfo', userController.getInfo);

router.post('/updateInfo', userController.updateInfo);

router.post('/getphone', userController.getphone);

router.post('/updatePhone',userController.updatePhone)
module.exports = router;
