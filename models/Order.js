var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OrderSchema = new Schema({
    truck: {
        type: Schema.ObjectId,
        ref: 'Truck'
    },
    account: {
        type: Schema.ObjectId,
        ref: 'Account'
    },
    driver: {
        type: Schema.ObjectId,
        ref: 'Driver'
    },
    need: {
        type: Schema.ObjectId,
        ref: 'Need'
    },
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
    distance:Number,
    mass: Number,
    volume: Number,
    size:String,
    remark:String,
    truck_type:String,
    price: Number,
    state: Number,   // 1.待取货 2.司机确认取货 3.发货方确认取货
    publish_at:Number,
    logs:[{
        address: String,
        coordinates: [Number],
        time: Number
    }],

    driver_confirm_cargo_at: {
        location: {
            type: { type: String },
            coordinates: [Number]
        },
        time: Number
    },
    company_confirm_cargo_at: {
        location: {
            type: { type: String },
            coordinates: [Number]
        },
        time: Number
    },
    driver_confirm_deliver_at: {
        location: {
            type: { type: String },
            coordinates: [Number]
        },
        time: Number,
        pics:[String]
    },
    company_confirm_deliver_at: {
        location: {
            type: { type: String },
            coordinates: [Number]
        },
        time: Number

    },
    tousu_to_driver: {
        content: String,
        time: Number,
        pics:[String]
    },
    plat_handle_tousu:{
        content:String,
        time:Number,
        pics:[String]
    },
    comment_to_driver: {
        points: Number,
        content: String,
        time: Number,
        pics:[String]
    },

    comment_to_company: {
        points: Number,
        content: String,
        time: Number,
        pics:[String]
    },

}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

OrderSchema.statics

OrderSchema.index({ "from.location": "2dsphere" })

module.exports = mongoose.model('Order', OrderSchema, 'orders');