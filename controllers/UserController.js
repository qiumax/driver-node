var mongoose = require("mongoose");
var User = require("../models/User");
var Driver = require("../models/Driver");
var RedPack = require("../models/Redpack");
var Weixin = require("../models/Weixin");
var WXBizDataCrypt = require("../models/WXBizDataCrypt");
var Config = require("../config/Config");
var fs = require('fs');
var path = require('path');
var RedisClient = require("../models/Redis");

var request = require('request');
var gm = require("gm").subClass({ imageMagick: true });

var userController = {};

userController.getDriverInfo = function(req, res) {
    var user_id = req.body.user_id;
    
    Driver.findOne({
        user: user_id
    }).then(driver=>{
        if(driver) {
            var session_id = req.body.s_id;
            RedisClient.get(session_id, function (err, reply) {
                if(reply) {
                    var sess = JSON.parse(reply);
                    sess.driver_id = driver._id;
                    var sess_str = JSON.stringify(sess);
                    RedisClient.set(session_id, sess_str, function (err, reply2) {
                        console.log(reply2);
                        res.send(driver)
                    })
                }
            })
        }
        else {
            res.send({ok:0})
        }
    })
}

//followers
userController.userfollowers = function (req, res) {
    // console.log(req.body);
    var fields;
    var user_id = req.body.user_id;
    var next = req.body.next;

    var followers = [];

    if(next == 0)
        fields = ['name','avatar','followers'];
    else
        fields = ['user_id', 'name', 'avatar', 'followers'];
    if(user_id){
        User.findById(user_id, function (err, user){
            if(user && user.followers && user.followers.length>0)
            {
                var project;
                if(next == 0){
                    project ={
                        _id:0,
                        name:1,
                        avatar:1,
                        follower_num:{$size:"$followers"}
                    }
                }
                else{
                    project ={
                        _id:0,
                        user_id:"$_id",
                        name:1,
                        avatar:1,
                        follower_num:{$size:"$followers"}
                    }
                }
                var arr =new Array();
                user.followers.forEach(function(item,index){
                    arr.push(mongoose.Types.ObjectId(item));
                })
                console.log(arr);
                User.aggregate(
                    [
                        {
                            $match:{_id:{$in:arr}}
                        },
                        {
                            $project:project
                        }
                    ]
                ).then(function(followers){
                    user.user_id = user._id;
                    user.follower_num = user.followers.length;
                    delete user.followers;
                    delete user._id;
                    RedPack.aggregate(
                        [{
                            $match: {
                                to: user_id,
                                redpack_sent: 1
                            }
                        },
                            {
                            $group:{
                                _id:user_id,
                                total:{$sum:"$amount"}
                            }
                        }
                        ]
                    ).then(function (rp){
                        console.log("rp----");
                        console.log(rp);
                        if(rp && rp[0]){
                            user.redpack_total = rp[0].total;
                        }
                        else
                        {
                            user.redpack_total = 0;
                        }

			followers.forEach(function(item){
                            item.name = item.name.substring(0,6);
                        })

                        console.log(user);
                        console.log(followers);
                        res.send({user:user,followers:followers})
                    });
                })
            }
            else{
                console.log('user');
                console.log(user);
                user.follower_num = 0;
                delete user.followers;
                res.send({user:user,followers:followers});
            }
        })

    }

}

userController.userpacks = function (req, res) {
    var user_id = req.body.user_id;
    var user=[];
    var redpacks=[];
    if (user_id) {
	    User.findById(user_id, function (err, user){
		    RedPack.find({to_user_id: user_id}).populate("to_user_id", "name")
		    .then(function (redpacks) {
			    console.log(redpacks);
			    res.send({user:user,redpacks: redpacks});
		    });
	    });
    }
    else
    {
	    res.send({user:user,redpacks: redpacks});
    }
}

userController.wxacode = function (req, res) {
    console.log(req.body);
    var user_id = req.body.user_id;

    var base_path = path.join(__dirname, '../public/img_tmp');
    var file_path = base_path + '/final_' + user_id + '.png';
    var final_link = '/img_tmp' + '/final_' + user_id + '.jpg';

    console.log(file_path);

    // if(fs.existsSync(file_path)) {
    //     res.send({image: final_link});
    // }
    // else {
        Weixin.getWXACode(user_id, function () {
            console.log("here")
            
            var code_path = base_path + '/code_' + user_id + '.png';
            var avatar_path = base_path + '/avatar_' + user_id + '.jpg';
            var avatar_round_path = base_path + '/avatar_round_' + user_id + '.png';
            var share_bg_path = base_path + '/share_bg.jpg';
            var final_path = base_path + '/final_' + user_id + '.jpg';

            User.findById(user_id).then(user => {
                console.log(user.avatar);
                gm(code_path).resize(162, 162).write(code_path, function (err) {
                    gm(request(user.avatar)).resize(146, 146).write(avatar_path, function (err) {
                        console.log(avatar_path);
                        if (!err) {
                            gm(146, 146, "none").fill(avatar_path).drawCircle(70, 70, 70, 0).write(avatar_round_path, function (err) {
                                if (!err) {
                                    gm().in('-page', '+0+0').in(share_bg_path).in('-page', '+200+77').in(avatar_round_path).in('-page', '+189+718').in(code_path).mosaic().write(final_path, function (err) {
                                        if (!err) {
                                            res.send({image: final_link});
                                        }
                                    })
                                }else {
                                    console.log(err);
                                }
                            })
                        }
                        else {
                            console.log(err);
                        }
                    })
                })
            })
        })
    // }
}

userController.getInfo = function (req, res) {
    var user_id = req.body.user_id;

    User.findById(user_id).then(user=>{
        console.log(user)
        res.send(user)
    })
}

userController.updateInfo = function (req, res) {
    
    var user_id = req.body.user_id
    var name = req.body.name
    var phone = req.body.phone
    var id = req.body.id
	var truck_length = req.body.truck_length
	var truck_type = req.body.truck_type
    
    if(name.length>0 && phone.length>0 && id.length>0) {
        User.findByIdAndUpdate(user_id,
            {
                name: name,
                phone: phone,
                id: id,
	            truck_length:truck_length,
	            truck_type:truck_type,
                apply_at: new Date().getTime()/1000
            },
            {new: true},
            function (err, user) {
                if(err) throw err
                if(user.apply_driver_state>=1) {
                    res.send({ok:1})
                }
                else {
                    user.apply_driver_state=1;
                    user.save( function( err ){
                        if(err) throw err
                        res.send({ok:1})
                    })
                }
            }
        )
    }
}

userController.updatePhone = function (req,res) {

	var user_id = req.body.user_id;
	var phone = req.body.phone;
	if(phone.length>0) {
		User.findByIdAndUpdate(user_id,
			{
				phone: phone
			},
			{new: true},
			function (err, user) {
				res.send({ok:1})
			}
		)
	}
}
userController.getphone = function (req,res) {
    var appId = Config.wx.appid;
    var sessionKey = req.body.session_key;
    var encryptedData =req.body.encryptedData;
    var iv = req.body.iv;

    var pc = new WXBizDataCrypt(appId, sessionKey)

    var data = pc.decryptData(encryptedData , iv)
    res.send(data);
}

// admin

module.exports = userController;
