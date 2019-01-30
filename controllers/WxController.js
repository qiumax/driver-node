var mongoose = require("mongoose");
var passport = require("passport");
var request = require('request');
var moment = require('moment');

var Weixin = require("../models/Weixin");
var User = require("../models/User");
var Order = require("../models/Order");
var Redpack = require("../models/Redpack");
var Truck  = require("../models/Truck");
var Config = require("../config/Config");

var wxController = {};

wxController.getWxUserInfo = function(req, res) {

    console.log(req.body);

    var code = req.body.code;

    //TODO: 绑定分销信息

    Weixin.getWxUserInfo(code, function (err, resp, data) {
        console.log("data: " + JSON.stringify(data));

        var openid = data.openid;
        var body = req.body;
        var refer_id = req.body.refer_id;
        var session_key = data.session_key;
        req.body.username = openid;
        req.body.password = "pwd";

        if(data.openid) {
            User.getReferids(refer_id, function (refer1_id, refer2_id) {

                User.findOne({'openid':openid}, function (err, user) {

                    // 存在
                    if(user) {
                        console.log("registered");

                        if(!user.refer1_id) {
                            user.refer1_id = refer1_id;
                            user.refer2_id = refer2_id;
                            user.save();

                            if(refer1_id) {
                                User.findByIdAndUpdate(
                                    refer1_id,
                                    {
                                        followers: {$push: user._id}
                                    }
                                )
                            }
                        }

                        passport.authenticate('local')(req, res, function () {
                            console.log({user_id: user._id, s_id: 'sess:' + req.session.id,session_key:session_key});
                            req.session.uid = user._id;
                            res.json({user_id: user._id, s_id: 'sess:' + req.session.id,session_key:session_key});
                        });
                    }
                    // 不存在
                    else {
                        console.log("begin register");

                        User.register(
                            new User({
                                username: openid,
                                openid : openid,
                                refer1_id: refer1_id,
                                refer2_id: refer2_id,
                                name: req.body.nickname,
                                avatar: req.body.avatar,
                                gender: req.body.gender,
                                city: req.body.city,
                                province: req.body.province,
                                country: req.body.country
                            }),
                            req.body.password,
                            function(err, user) {
                                console.log(user);
                                console.log(err);
                                if (err) {
                                    res.send('fail');
                                }

                                if(refer1_id) {
                                    console.log('here');
                                    console.log(refer1_id);
                                    User.findByIdAndUpdate(
                                        refer1_id,
                                        {
                                            $push: {followers: user._id}
                                        },
                                        {new: true},
                                        function (err, refer) {
                                            console.log('err');
                                            console.log(err);
                                            console.log('refer');
                                            console.log(refer);
                                        }
                                    )
                                }

                                passport.authenticate('local')(req, res, function () {
                                    console.log({user_id: user._id, s_id: 'sess:' + req.session.id,session_key:session_key});
                                    req.session.uid = user._id;
                                    res.json({user_id: user._id, s_id: 'sess:' + req.session.id,session_key:session_key});
                                });
                            }
                        );
                    }
                })
            })
        }
    });
};

wxController.payNotify = function(req, res) {
    console.log("weixin pay notify");

    var xml = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
        xml += chunk;
        console.log( chunk );
    });
    req.on('end', function(chunk) {
        console.log( xml );
        Weixin.verifyNotify( xml, function(out_trade_no, openid){
            console.log('out_trade_no:' +out_trade_no);
            if ( out_trade_no && openid ) {
            
            }
        });
    });
};

genRedpackId = function () {
    var redpack_id ='';
    var mchid = '1518016601';
    var timestamp = new Date().getTime().toString().substr(5);
    var rand = Math.round(Math.random() * 99);
    redpack_id = mchid + moment().format("YYYYMMDD") + timestamp + rand.toString();
    return redpack_id;
}

sendRedpack = function(username,user_ping_id, refer_id, level, amount) {
    User.findById(refer_id).then(refer1=>{
        var redpack = new Redpack({
            level: level,
	        username:username,
            user_ping_id: user_ping_id,
            to_user_id: refer1._id,
            to_openid: refer1.openid,
            amount: amount,
            redpack_id: genRedpackId(),
            redpack_sent: 0,
        })

        redpack.save().then(aRedpack=>{
            /*
            Weixin.sendRedpack(aRedpack.to_openid, aRedpack.amount, aRedpack._id)
            .then(function (body) {
                console.log(body);
                parser(body, function (err, result) {
                    if (result.xml.result_code[0] == 'SUCCESS') {
                        var r_id = result.xml.mch_billno[0];
                        var o_id = result.xml.re_openid[0];

                        Redpack.findOneAndUpdate(
                            {
                                redpack_id: r_id,
                                to_openid: o_id
                            },
                            {
                                redpack_sent: 1
                            }
                        )
                    }
                })
            })
            */
        })
    })
}

wxController.upload_file = function(req, res) {
    console.log(req.body)
    console.log(req.files)
    
    var user_id = req.body.user_id;
    
    var files = req.files
    var field_name = req.body.field_name
    var file = req.files[field_name]
    
    console.log(file)
    
    User.findById(user_id).then(user=>{
        if(!user) return
        
        if(file.size>0) {
            var tmp_path = file.path
            var key = "drivers/" + field_name + "_" + user._id.toString()+".png"
            
            CosUploader.uploadFile(tmp_path, key, function (err, data) {
                if(err) {
                    res.send({ok:0})
                }
                var image_src = Config.cos.host + '/' + key;
                user[field_name] = image_src
                user.save( function (err) {
                    res.send({ok:1})
                })
            })
        }
        else {
            res.send({ok:0})
        }
    })
}

//上传签收图片
wxController.driver_upload_pic = function(req, res) {
	console.log(req.body)
	console.log(req.files)

	var user_id = req.body.user_id;

	var files = req.files
	var field_name = req.body.field_name
	var file = req.files[field_name]
	var order_id = req.body.order_id
	console.log(file)

	Order.findById(order_id).then(order=>{
		if(!order) return

		if(file.size>0) {
			var tmp_path = file.path
			var key = "orders/" + order_id + "/" + field_name+".png"

			CosUploader.uploadFile(tmp_path, key, function (err, data) {
				if(err) {
					res.send('')
				}
				var image_src = Config.cos.host + '/' + key;
				console.log(image_src)
				res.send(image_src)

			})
		}
		else {
			res.send('')
		}
	})
}



//上传评价图片
wxController.driver_comment_pic = function(req, res) {
	console.log(req.body)
	console.log(req.files)

	var user_id = req.body.user_id;

	var files = req.files
	var field_name = req.body.field_name
	var file = req.files[field_name]
	var order_id = req.body.order_id
	console.log(file)

	Order.findById(order_id).then(order=>{
		if(!order) return

		if(file.size>0) {
			var tmp_path = file.path
			var key = "comments/" + order_id + "/driver/" + field_name+".png"

			CosUploader.uploadFile(tmp_path, key, function (err, data) {
				if(err) {
					res.send('')
				}
				var image_src = Config.cos.host + '/' + key;
				console.log(image_src)
				res.send(image_src)

			})
		}
		else {
			res.send('')
		}
	})
}


//司机认证获取车长列表
wxController.getTruckList = function(req,res){
	console.log(req.body)
	Truck.find({deleted:false}).then(trucks=>{
		res.send({trucks:trucks})
	})
}

module.exports = wxController;
