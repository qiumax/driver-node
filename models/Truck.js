var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TruckSchema = new Schema({
    name: String,
    load: Number,   // 吨
    size: String,   // 长宽高
    volume: Number,  // 方
    img: String,
    deleted: Boolean
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

module.exports = mongoose.model('Truck', TruckSchema, 'trucks');