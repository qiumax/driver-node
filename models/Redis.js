var redis = require("redis");
var config = require('../config/Config')

var redis_client = redis.createClient(config.redis.port, config.redis.host)

module.exports = redis_client;