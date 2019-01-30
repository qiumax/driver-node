var NeedSchedule = require("../models/NeedSchedule")
var Driver = require("../models/Driver")
var Order = require("../models/Order")
var Config = require("../config/Config")
var geolib = require("geolib")
var async = require('async')

var needController = {};

needController.check = function () {
	console.log('start')
    var now = new Date().getTime()/1000
    NeedSchedule.find({
        finished: false,
        $or: [
            {
                run_time: {
                    $lt: now
                }
            },
            {
                run_now: true
            }
        ]
    }).populate('need').then(need_schedules=>{
		//console.log(need_schedules)
        need_schedules.forEach(function (need_schedule) {
            
            // execute
            
            var need = need_schedule.need
			console.log('need')
			console.log(need_schedule)
			var need_id = need._id
            // 无人抢单, 自动延长10分钟, 并推送
            if(need.drivers_applied.length==0) {
                need_schedule.run_time += Config.need.schedule_time
                
                need_schedule.save(function (err) {
                    if(err) throw err
                    
                    // TODO: 推送
	                /*
	                * 1.查看50KM范围内司机
	                * 2.根据司机unionid 找 服务号对应的openid
	                * 3.推送模板消息
	                * */
	                //
	                Driver.find({
		                location: {
			                $near: {
				                $geometry: {
					                type: "Point",
					                coordinates: need.from.location.coordinates
				                },
				                $minDistance: 0,
				                $maxDistance: Config.need.sendtemp_distance
			                }
		                },
		                in_service:false
	                }).populate('user').then(drivers=>{
	                	if(drivers){
			                console.log('---sendtemplate--todrivers')
	                		console.log(drivers)
		                }
	                })
                })
            }
            
            // 有人抢单，继续流程
            else if(need.drivers_applied.length>0) {
                // 选出抢单司机
                var min_distance
                var driver_index = 0
	            var j = 0
	            var len = need.drivers_applied.length
	            async.map(need.drivers_applied,function (v,cb) {
		            Driver.findById(v).populate('user').then(driver=> {
			            var distance = geolib.getDistance({
				            longitude: need.from.location.coordinates[0],
				            latitude: need.from.location.coordinates[1]
			            }, {
				            longitude: driver.location.coordinates[0],
				            latitude: driver.location.coordinates[1]
			            })

			            if(driver.user.sany_truck_img) {
				            distance -= Config.need.sany_truck_benefit_distance
			            }

			            if(!min_distance || distance<min_distance) {
				            min_distance = distance
				            driver_index = v

			            }
			            cb(null,driver_index)
		            })


	            },function (err,drivers) {

	            	console.log('----driver')
		            console.log(drivers)
		            //取最后一个
		            var driver_id = drivers[len-1]
		            // 更新状态
		            var need_obj = need.toObject()
		            delete need_obj._id

		            var order = new Order(need_obj)
		            order.driver = driver_id
		            order.need = need_id
		            order.state = 1

		            //加上need_schedule更新时间
		            order.publish_at = new Date().getTime()/1000

		            console.log('order')
		            order.save(function (err) {
			            if(err) throw err
						need.driver = driver_id
			            need.closed = true
			            need.save(function (err) {
				            if(err) throw err

				            need_schedule.finished = true
				            need_schedule.save(function (err) {
					            if(err) throw err

					            Driver.findByIdAndUpdate(driver_id,
						            {
							            current_order: order._id,
							            in_service: true
						            },
						            function (err, driver) {
							            if(err) throw err


						            })
				            })
			            })
		            })
	            })

            }
        })
    })
}

module.exports = needController;
