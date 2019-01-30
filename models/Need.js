var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NeedSchema = new Schema({
    truck: {
        type: Schema.ObjectId,
        ref: 'Truck'
    },
    com_user: {
        type: Schema.ObjectId,
        ref: 'ComUser'
    },
    account: {
        type: Schema.ObjectId,
        ref: 'Account'
    },
	driver: {
		type: Schema.ObjectId,
		ref: 'Driver'
	},
    need_schedule: {
        type: Schema.ObjectId,
        ref: 'NeedSchedule'
    },
    drivers_applied: [
        {
            type: Schema.ObjectId,
            ref: 'Driver'
        }
    ],
    from: {
        city: String,
        address: String,
        note: String,
        name: String,
        phone: String,
        location: {
            type: { type: String },
            coordinates: [Number]
        }
    },
    to: {
        city: String,
        address: String,
        note: String,
        name: String,
        phone: String,
        location: {
            type: { type: String },
            coordinates: [Number]
        }
    },
    time: Number,
    cargo: String,
    price_type: String,
    mass: Number,
    size:String,
    remark:String,
    truck_type:String,
    volume: Number,
    price: Number,
    closed: Boolean
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

NeedSchema.index({ "from.location": "2dsphere" })

NeedSchema.methods.canApply = function () {
    var need_schedule = this.need_schedule

	if(!need_schedule.drivers_applied)
		return true
    if(need_schedule.drivers_applied.length>=5)
        return false

    if(need_schedule.finished)
        return false

    if(need_schedule.run_now)
        return false

    var now = new Date().getTime()/1000
    if(need_schedule.run_time<now)
        return false

    return true
}

module.exports = mongoose.model('Need', NeedSchema, 'needs');