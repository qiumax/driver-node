var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Address = require('./Address')

var ComUserSchema = new Schema({
    username: String,
    password: String,
    openid: String,
    name: String,
    phone: String,
    
    avatar: String,
    gender: String,
    city: String,
    province: String,
    country: String
    
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

ComUserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('ComUser', ComUserSchema, 'com_users');