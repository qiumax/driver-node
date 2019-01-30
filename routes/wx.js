var express = require('express');
var router = express.Router();
var wxController = require("../controllers/WxController.js");

var mutipart= require('connect-multiparty');
var mutipartMiddeware = mutipart();

router.post('/getWxUserInfo', wxController.getWxUserInfo);

router.post('/payNotify', wxController.payNotify);

router.post('/upload_file', mutipartMiddeware, wxController.upload_file);

router.post('/driver_upload_pic', mutipartMiddeware, wxController.driver_upload_pic);

router.post('/driver_comment_pic', mutipartMiddeware, wxController.driver_comment_pic);

router.post('/getTruckList',wxController.getTruckList);
// router.post('/testTemp', wxController.testTemp);

router.get('/test', function (req, res) {
    console.log("server 1");
    res.send("server 1")
});

module.exports = router;