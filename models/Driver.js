var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DriverSchema = new Schema({
    user:{
        type: Schema.ObjectId,
        ref: 'User'
    },
    location: {
        type: { type: String },
        coordinates: [Number]
    },
    approved_at: Number,
    state: Number, // 0:下线, 1:上线
    in_service: Boolean,
    current_order: {
        type: Schema.ObjectId,
        ref: 'Order'
    },
	distance:Number,
	day:Number,
	num:Number,
	star:Number,
	comment_num:Number
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

DriverSchema.index({ "location": "2dsphere" })

module.exports = mongoose.model('Driver', DriverSchema, 'drivers');