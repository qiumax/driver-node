var mongoose = require("mongoose")
var Driver = require("../models/Driver")
var Need = require("../models/Need")
var Truck = require("../models/Truck")
var NeedSchedule = require("../models/NeedSchedule")
var Order = require("../models/Order")
var Cos = require("../models/Cos")
var CosUploader = require("../models/CosUploader")
var Constant = require("../config/Constant")

var driverController = {}

driverController.updateLocation = function (req, res) {
    var user_id = req.body.user_id
    var longitude = req.body.longitude
    var latitude = req.body.latitude
    Driver.findOneAndUpdate(
        {
            user: user_id
        },
        {
            location: {
                type: "Point",
                coordinates: [longitude, latitude]
            }
        },function (err, driver) {
            if(err) throw err
            res.send({ok:1});
        }
    )
}


driverController.getNeeds = function (req, res) {
    var user_id = req.body.user_id
    
    Driver.findOne(
        {
            user: user_id
        },
        'location -_id',
        function (err, driver) {
            if(err) throw err
	        console.log('driver')
            console.log(driver)
            
            Need.find({
                "from.location": {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: driver.location.coordinates
                        },
                        $minDistance: 0,
                        $maxDistance: 1000000
                    }
                },
	            closed:false
            }).limit(5).populate("truck").then(needs=>{
                console.log(needs.length);
                res.send(needs)
            })
        }
    )
}

driverController.applyNeed = function (req, res) {
    var user_id = req.body.user_id
    var driver_id = req.session.driver_id
    var need_id = req.body.need_id
    
    Driver.findOne(
	    {
            user: user_id,
            in_service: false
	    }
    ).then(driver=>{
    	console.log(driver)
        if(driver) {
            Need.findOne({
                _id: need_id,
                closed: false,
                "drivers_applied.4": {$exists: false}   // length < 5
            }, '-created_at -updated_at').populate('need_schedule').then(need=>{
                if(need) {
                    if(need.canApply()) {
	                    //driver不存在
	                    if(need.drivers_applied.indexOf(driver_id) == -1)
	                    {
		                    need.drivers_applied.push(driver._id)
	                    }

                        need.save(function (err) {
                            if(err) throw err
        
                            if(need.drivers_applied.length==5) {
                                NeedSchedule.findByIdAndUpdate(
                                    need.need_schedule,
                                    {
                                        run_time: new Date().getTime()/1000
                                    },
                                    function (err, need_schedule) {
                                        if(err) throw err
                                        res.send({ok:1})
                                    }
                                )
                            }
                            res.send({ok:1})
                        })
                    }
                    else {
                        res.send({ok:0})
                    }
                    
                }
                else {
                    res.send({ok:0})
                }
            })
            
            /* 生成 order
            Need.findOne({
                _id: need_id,
                closed: false
            }, '-created_at -updated_at').then(need=>{
                var need_obj = need.toObject()
                delete need_obj._id
                console.log(need_obj);
                var order = new Order(need_obj)
                order.driver = driver_id
                order.state = 1

				console.log(order)
                order.save(function (err) {
                    if(err) throw err
                    
                    need.closed = true
                    need.save(function (err) {
                        if(err) throw err
    
                        driver.current_order = order._id
                        driver.in_service = true
                        driver.save(function (err) {
                            res.send({ok:1})
                        })
                    })
                })
            })
            */
        }
        else
        {
	        res.send({ok:0})
        }
    })
}

driverController.getDriver = function (req,res) {
	var user_id = req.body.user_id
	Driver.findOne({
		user:user_id
	}).then(driver=>{
		if(driver){
			res.send(driver)
		}
		else{
			res.send({ok:0})
		}
	})
}

driverController.getCurrentOrder = function (req, res) {
    var user_id = req.body.user_id
    
    Driver.findOne({
        user: user_id,
    }).then(driver=>{
        if(driver.in_service  && driver.current_order) {
            Order.findById(driver.current_order).then(order=>{
                res.send({order:order})
            })
        }
        else {//没有的话-看是否参与抢单
	        Need.findOne({
	        	closed:false,
		        drivers_applied:{$elemMatch:{$eq:driver._id}}
	        }).then(need=>{
	        	console.log('---')
	        	console.log(need)
		        res.send({order:need})
	        })

        }
    })
}

driverController.confirmGetCargo = function (req, res) {
    var driver_id = req.session.driver_id
    var order_id = req.body.order_id
    console.log('---')
    console.log(driver_id);
    
    Order.findOneAndUpdate(
        {
            _id: order_id,
            driver: driver_id,
            state: Constant.ORDER_STATE.TO_GET_CARGO
        },
        {
            state: Constant.ORDER_STATE.DRIVER_CONFIRM_CARGO,
            driver_confirm_cargo_at: JSON.parse(req.body.driver_confirm_cargo_at)
        },
        {
            new: true
        },
        function (err, order) {
            if(err) throw err
            console.log(order);
            res.send({ok:1})
        }
    )
}

driverController.confirmDeliver = function (req, res) {
    var driver_id = req.session.driver_id
    var order_id = req.body.order_id
    
    Order.findOneAndUpdate(
        {
            _id: order_id,
            driver: driver_id,
            state: Constant.ORDER_STATE.COMPANY_CONFIRM_CARGO
        },
        {
            state: Constant.ORDER_STATE.DRIVER_CONFIRM_DELIVER,
            driver_confirm_deliver_at: JSON.parse(req.body.driver_confirm_deliver_at)
        },
        {
            new: true
        },
        function (err, order) {
            if(err) throw err
            console.log(order);
            res.send({ok:1})
        }
    )
}

driverController.submitLog = function (req, res) {
    var driver_id = req.session.driver_id
    var order_id = req.body.order_id
    
    var body = req.body
    Order.findOneAndUpdate(
        {
            _id: order_id,
            driver: driver_id,
            state: Constant.ORDER_STATE.COMPANY_CONFIRM_CARGO
        },
        {
            $push: {
                logs: JSON.parse(body.log)
            }
        },
        {
            new: true
        },
        function (err, order) {
            if(err) throw err
            //console.log(order.logs);
            res.send({ok:1})
        }
    )
}

driverController.comment = function (req, res) {
    var driver_id = req.session.driver_id
    var order_id = req.body.order_id
    
    var body = req.body
    Order.findOneAndUpdate(
        {
            _id: order_id,
            driver: driver_id,
            state: Constant.ORDER_STATE.COMPANY_CONFIRM_DELIVER

        },
        {
            comment_to_company: JSON.parse(req.body.comment_to_company)
        },
        {
            new: true
        },
        function (err, order) {
        	console.log(order)
            if(err) throw err
            //console.log(order.comment_to_company);
    
            if(order.comment_to_driver.content) {
                order.state = Constant.ORDER_STATE.COMMENTED
                order.save(function (err) {
                    if(err) throw err

	                //更新司机统计信息
	                var distance = order.distance
	                var star = order.comment_to_driver.points
	                var day = (new Date().getTime()/1000 - order.driver_confirm_cargo_at.time)/(60*60*24)

	                Driver.findOneAndUpdate({
			                _id:order.driver
		                },
		                {
			                $inc:{comment_num:1}
		                },
		                {new: true},
		                function (err,driver) {
			                console.log(driver)
			                if(err) throw err
			                if(!driver.star){
				                driver.star = 5
			                }
			                if(!driver.distance){
				                driver.distance = 0
			                }
			                if(!driver.day){
				                driver.day = 0
			                }
			                if(!driver.num){
				                driver.num = 0
			                }
			                var newstar = (star + driver.star) / (driver.comment_num)
			                driver.num = driver.num + 1
			                driver.day = driver.day + day
			                driver.distance = driver.distance + distance
			                driver.star = newstar
			                driver.save(function (err) {
				                if(err) throw err
				                res.send({ok:1})
			                })
		                })
                })
            }
            else {
                res.send({ok:1})
            }
        }
    )
}

module.exports = driverController
