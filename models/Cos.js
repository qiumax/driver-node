var Config = require('../config/Config')

var COS = require('cos-nodejs-sdk-v5')

var Cos = new COS({
    SecretId: Config.cos.secret_id,
    SecretKey: Config.cos.secret_key,
});

module.exports = Cos