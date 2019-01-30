var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NeedScheduleSchema = new Schema({
    need: {
        type: Schema.ObjectId,
        ref: 'Need'
    },
    run_time: Number,
    run_now: Boolean,
    finished: Boolean
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

module.exports = mongoose.model('NeedSchedule', NeedScheduleSchema, 'need_schedules');