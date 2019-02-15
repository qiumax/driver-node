var mongoose = require("mongoose")
var Driver = require("../models/Driver")
var Order = require("../models/Order")
var Truck = require("../models/Truck");
var Need = require("../models/Need")

var orderController = {}

orderController.orderList = function (req, res) {
	var user_id = req.body.user_id
	Driver.findOne({
		user: user_id
	}).then(driver=>{
		if(driver){
			console.log('----')
			Order.find({
				driver:driver._id
			}).populate("truck").exec(function (err, order){
				console.log(order)
				res.send({order:order})
			})
		}
		else
		{
			res.send({ok:0})
		}
	})
}

orderController.getOrderDetail = function (req,res) {
	var order_id = req.body.order_id
	var user_id = req.body.user_id
	var inqding = 0

	Order.findOne({
		"$or":[
			{
				_id:order_id
			},
			{
				need:order_id
			}
		]
	}).populate({
		path: 'driver',
		model: 'Driver',
		populate: {
			path: 'user',
			model: 'User'
		}
	}).populate("truck").then(order=>{
		if(order){
			console.log(order)

			var order_path =  '/img_tmp/order_' + order_id + '.png';
			console.log(order_path)
			res.send({order:order,image:order_path})
		}
		else{//在needs里找
			Need.findOne({
				_id:order_id,
				closed:false
			}).populate("truck").then(need=>{
				if(need){
					//判断当前用户是否参加抢单
					Driver.findOne({
						user: user_id,
					}).then(driver=>{
						//console.log(need.drivers_applied)
						if(need.drivers_applied){
							inqding = need.drivers_applied.indexOf(driver._id) + 1
						}
						res.send({order:need,inqding:inqding})
					})
				}
				else
				{
					res.send({order:null})
				}


			})
		}

	})
}


//没抢到的单
orderController.failNeedList = function (req, res) {
	var user_id = req.body.user_id

	Driver.findOne({
		user: user_id
	}).then(driver=>{
		if(driver){
			Need.find({
				closed:true,
				drivers_applied:{$elemMatch:{$eq:driver._id}},
				driver:{ $ne:driver._id}
			}).then(need=>{
				res.send({order:need})
			})
		}
		else
		{
			res.send({ok:0})
		}
	})
}


module.exports = orderController
