var express = require('express');
var router = express.Router();
var orderController = require("../controllers/OrderController.js");

router.post('/orderList', orderController.orderList)

router.post('/getOrderDetail', orderController.getOrderDetail)

router.post('/failNeedList', orderController.failNeedList)

module.exports = router;
