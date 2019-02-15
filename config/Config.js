var config = {
    // page
    page_size: 5,
    
    mongodb: {
        url: "mongodb://sa_driver:wending0304@localhost/driver"
    },
    
    redis: {
        host: 'localhost',
        port: 6379,
        pwd: 'wending0304',
        ttl: 86400
    },
    
    cos: {
        secret_id: "AKIDKVbUCeilRwDF2aAyteS6XnoZ4IGyDdbM",
        secret_key: "jEamjQr3zf5JI9lAKFwNdfaHkyxiEVYM",
        bucket: "driver-1257242347",
        region: "ap-chongqing",
        host: "https://driver-1257242347.cos.ap-chongqing.myqcloud.com"
    },
    
    wx: {
        appid: "wx473b728e714d1a9c",
        secret: "1070952388109718ba720935d6bbdedf",
        key: 'pYwUbTaaWnTLOpInl2HtnJA7x1v9UVWC',
        mchid: '1518016601',
        notify_url: 'https://driver.quxunbao.cn/wx/payNotify'
    },

	fwh:{
        appid:"wx50866c31c4f65209",
		secret:"bd3c2cc6a0b068f13f2b64ef16b671d9",

	},
    
    need: {
        schedule_time: 1*60,
		//推送距离
	    sendtemp_distance:500000,
        // max_distance: 10000000,
        sany_truck_benefit_distance: 100000
    }
}

module.exports = config