var Cos = require('./Cos')
var cos_config = require('../config/Config').cos
fs = require('fs')

CosUploader = {}

CosUploader.uploadFile = function (file_path, key, cb) {
    
    var params = {
        Bucket: cos_config.bucket,
        Region: cos_config.region,
        Key: key,
        FilePath: file_path
    }
    
    console.log(params);
    
    Cos.sliceUploadFile(params, function (err, data) {
        if(err) {
            console.log(err);
            fs.unlinkSync(file_path);
            cb(err, data)
        } else {
            fs.unlinkSync(file_path);
            cb(err, data)
        }
    })
}

module.exports = CosUploader