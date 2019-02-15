var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new Schema({
    username: String,
    password: String,
    openid: String,
    name: String,
    phone: String,
    id: String,
    apply_driver_state: Number, // 1:待初审 2:待面审 3:面签通过
    apply_at: Number, // 申请时间
    
    avatar: String,
    gender: String,
    city: String,
    province: String,
    country: String,
    truck_length:String,
	truck_type:String,
    id_img_1: String,
    id_img_2: String,
    driver_licence_1: String,
    driver_licence_2: String,
    truck_img_1: String,
    truck_img_2: String,
    insurance_img: String,
    sany_truck_img: String,
    
    refer1_id: String,
    refer2_id: String,
    followers: [String]
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

UserSchema.plugin(passportLocalMongoose);

UserSchema.statics.getReferids = function (refer1_id, cb) {
    if(refer1_id) {
        this.findById(refer1_id).then(refer1 => {
            if(refer1.refer1_id) {
                refer2_id = refer1.refer1_id;
                cb(refer1_id, refer2_id);
            }
            else {
                cb(refer1_id, "0");
            }
        })
    }
    else {
        cb("0", "0");
    }
}

module.exports = mongoose.model('User', UserSchema, 'users');