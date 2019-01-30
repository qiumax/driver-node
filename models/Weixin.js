module.exports = Weixin;

var config = require("../config/Config");
var request = require('request');
const qs = require('querystring');
var randomstring = require("randomstring");
var fs = require("fs");

var RedisClient = require("./Redis");

const _appid = config.wx.appid;
const _secret = config.wx.secret;
const _key = config.wx.key;
const _mchid = config.wx.mchid;
const _notify_url = config.wx.notify_url;

function Weixin() {

}

// Weixin Login
Weixin.getWxUserInfo = function(code, cb) {
    request.get({
        url: "https://api.weixin.qq.com/sns/jscode2session",
        json: true,
        qs:{
            grant_type: 'authorization_code',
            appid: _appid,
            secret: _secret,
            js_code: code
        }
    }, function(err, resp, data) {
        cb(err, resp, data);
    });
}

// Weixin Pay
Weixin.jsapipay = function (opts, cb) {
    var out_trade_no = opts.user_ping_id;
    var appid = _appid;
    var attach = opts.attach;
    var mch_id = _mchid;
    var nonce_str = opts.nonce_str;
    var total_fee = opts.sub_fee;
    var notify_url = _notify_url;
    var openid = opts.openid;
    var body = opts.description;
    var timeStamp = opts.timestamp;
    var spbill_create_ip = '47.106.98.38';
    var url = "https://api.mch.weixin.qq.com/pay/unifiedorder";
    var formData  = "<xml>";
    formData  += "<appid>"+appid+"</appid>";  //appid
    formData  += "<attach>"+attach+"</attach>"; //附加数据
    formData  += "<body>"+body+"</body>";
    formData  += "<mch_id>"+mch_id+"</mch_id>";  //商户号
    formData  += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
    formData  += "<notify_url>"+notify_url+"</notify_url>";
    formData  += "<openid>"+openid+"</openid>";
    formData  += "<out_trade_no>"+out_trade_no+"</out_trade_no>";
    formData  += "<spbill_create_ip>"+spbill_create_ip+"</spbill_create_ip>";
    formData  += "<total_fee>"+total_fee+"</total_fee>";
    formData  += "<trade_type>JSAPI</trade_type>";
    formData  += "<sign>"+paysignjsapi(appid,attach,body,mch_id,nonce_str,notify_url,openid,out_trade_no,spbill_create_ip,total_fee,'JSAPI')+"</sign>";
    formData  += "</xml>";
    console.log('formData: ');
    console.log(formData);
    request({url:url,method:'POST',body: formData},function(err,response,body){
        if(!err && response.statusCode == 200){
            console.log('body');
            console.log(body);
            var prepay_id = getXMLNodeValue('prepay_id',body.toString("utf-8"));
            var tmp = prepay_id.split('[');
            var tmp1 = tmp[2].split(']');
            //签名

            console.log('timeStamp: ');
            console.log(timeStamp);

            var _paySignjs = paysignjs(appid,nonce_str,'prepay_id='+tmp1[0],'MD5',timeStamp);

            console.log(tmp1[0]);
            console.log(_paySignjs);

            cb({prepay_id:tmp1[0],_paySignjs:_paySignjs});

            //res.render('weixinpay',{prepay_id:tmp1[0],_paySignjs:_paySignjs});
            //res.render('jsapipay',{rows:body});
            //res.redirect(tmp3[0]);
        }
    });
}

function paysignjsapi(appid,attach,body,mch_id,nonce_str,notify_url,openid,out_trade_no,spbill_create_ip,total_fee,trade_type) {
    var ret = {
        appid: appid,
        attach: attach,
        body: body,
        mch_id: mch_id,
        nonce_str: nonce_str,
        notify_url:notify_url,
        openid:openid,
        out_trade_no:out_trade_no,
        spbill_create_ip:spbill_create_ip,
        total_fee:total_fee,
        trade_type:trade_type
    };
    var string = raw(ret);
    var key = _key;
    string = string + '&key='+key;
    var crypto = require('crypto');
    return crypto.createHash('md5').update(string,'utf8').digest('hex');
};

function paysignjs(appid,nonceStr,package,signType,timeStamp) {
    var ret = {
        appId: appid,
        nonceStr: nonceStr,
        package:package,
        signType:signType,
        timeStamp:timeStamp
    };
    var string = raw(ret);
    var key = _key;
    string = string + '&key='+key;
    console.log(string);
    var crypto = require('crypto');
    return crypto.createHash('md5').update(string,'utf8').digest('hex');
};

function raw(args) {
    var keys = Object.keys(args);
    keys = keys.sort()
    var newArgs = {};
    keys.forEach(function (key) {
        // Ding
        if ( key != 'sign' ){
            newArgs[key] = args[key];
        }
    });
    var string = '';
    for (var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
};

function getXMLNodeValue(node_name,xml){
    var tmp = xml.split("<"+node_name+">");
    var _tmp = tmp[1].split("</"+node_name+">");
    return _tmp[0];
}

Weixin.verifyNotify = function(xml, cb) {
    var parser = require('xml2js').parseString;
    parser(xml, function (err, result) {
        if ( result.xml.result_code[0] == 'SUCCESS' ) {
            // console.log(result);
            var string = raw(result.xml)
            // console.log( string );
            string = string + '&key=' + _key;
            // console.log(string);
            var crypto = require('crypto');
            var sign = crypto.createHash('md5').update(string,'utf8').digest('hex').toUpperCase();
            console.log( sign );
            // console.log( "39A31E194597ED6BE11A2FF27176938B" );
            if ( sign === result.xml.sign[0] ) {
                // console.log( 'pass' );
                var out_trade_no = result.xml.out_trade_no[0];
                var openid = result.xml.openid[0];
                // Purchase.setPaid(out_trade_no);

                cb(out_trade_no, openid);
                return;
            }
        }
        cb(null);
    });
}

Weixin.sendTemplateMsg = function (data) {
    this.getAccessToken().then(function (token) {
        var reqUrl = 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + token;

        var string = JSON.stringify(data);
        console.log(string);

        var options = {
            url: reqUrl,
            method: "POST",
            body: string
        };

        console.log(options);

        return new Promise( function(resolve, reject) {
            request(options, function (err, res, body) {
                if (res) {
                    var data = JSON.parse(body);
                    console.log("sendTemplateMsg success");
                    console.log(data);
                    resolve(data);
                } else {
                    console.log(err);
                    reject(err);
                }
            })
        });
    })
}

Weixin.getAccessToken = function() {
    return new Promise( function(resolve, reject) {
        RedisClient.get('wx_access_token', function(err, result) {
            if (err) throw err;
        
            var data = JSON.parse(result);
        
            console.log('wx_access_token -> ', data);
        
            var re_apply = false;
        
            if(data && data.access_token && data.create_time) {
                console.log("1")
                var access_token = data.access_token;
                var create_time = data.create_time;
                // 2小时过期
                if(access_token.length>0 && (new Date().getTime()/1000-create_time)<7000) {
                    console.log("2");
                    console.log("return -> " + access_token);
                    resolve(access_token);
                }
                else {
                    re_apply = true;
                }
            }
            else {
                re_apply = true;
            }
        
            console.log("re_apply -> " + re_apply);
            
            if(re_apply) {
                var reqUrl = 'https://api.weixin.qq.com/cgi-bin/token?';
                var params = {
                    appid: _appid,
                    secret: _secret,
                    grant_type: 'client_credential'
                };
            
                var options = {
                    method: 'get',
                    url: reqUrl+qs.stringify(params)
                };
                
                request(options, function (err, res, body) {
                    if (res) {
                        var data = JSON.parse(body);
                        access_token = data.access_token;
                        create_time = Math.floor(new Date().getTime()/1000);
                    
                        var data = {
                            access_token: access_token,
                            create_time: create_time
                        }
                    
                        var data_str = JSON.stringify(data);
                    
                        RedisClient.set("wx_access_token", data_str, function (err, res) {
                            if(err) throw err;
                            console.log("2");
                            console.log("return -> " + access_token);
                            resolve(access_token);
                        })
                    } else {
                        reject(err);
                    }
                })
            }
        })
    })
}

// 微信红包
Weixin.sendRedpack = function(openid, amount_cents, redpack_id) {

    var act_name = '三一卡车';
    var client_ip = '47.106.98.38';
    var mch_billno = redpack_id;
    var mch_id = _mchid;
    var nonce_str = randomstring.generate(32);
    var re_openid = openid;
    var remark = '三一卡车 分享红包';
    var send_name = '三一卡车';
    var total_amount = amount_cents;
    var total_num = 1;
    var wishing = '推荐朋友玩游戏，源源不断收红包！详情请关注游戏公告~';
    var wxappid = _appid;

    var sign = sendRedpackSign(
        act_name,client_ip,mch_billno,
        mch_id,nonce_str,re_openid,
        remark,send_name,total_amount,
        total_num,wishing,wxappid
    );

    var formData  = "<xml>";
    formData  += "<act_name>"+act_name+"</act_name>";
    formData  += "<client_ip>"+client_ip+"</client_ip>";
    formData  += "<mch_billno>"+mch_billno+"</mch_billno>";
    formData  += "<mch_id>"+mch_id+"</mch_id>";
    formData  += "<nonce_str>"+nonce_str+"</nonce_str>";
    formData  += "<re_openid>"+re_openid+"</re_openid>";
    formData  += "<remark>"+remark+"</remark>";
    formData  += "<send_name>"+send_name+"</send_name>";
    formData  += "<total_amount>"+total_amount+"</total_amount>";
    formData  += "<total_num>"+total_num+"</total_num>";
    formData  += "<wishing>"+wishing+"</wishing>";
    formData  += "<wxappid>"+wxappid+"</wxappid>";
    formData  += "<sign>"+sign+"</sign>";
    formData  += "</xml>";

    console.log('formData: ');
    console.log(formData);

    var url = 'https://api.mch.weixin.qq.com/mmpaymkttransfers/sendredpack';

    var options = {
        url: url,
        method: 'POST',
        body: formData,
        agentOptions: {
            pfx: fs.readFileSync('./wx_cert/apiclient_cert.p12'),
            passphrase: _mchid
        }
    };

    return new Promise( function(resolve, reject) {
        request(options, function (err, res, body) {
            if (res) {
                resolve(body);
            } else {
                reject(err);
            }
        });
    } );
}

function sendRedpackSign(act_name,client_ip,mch_billno,
                         mch_id,nonce_str,re_openid,
                         remark,send_name,total_amount,
                         total_num,wishing,wxappid) {
    var ret = {
        act_name: act_name,
        client_ip: client_ip,
        mch_billno: mch_billno,
        mch_id: mch_id,
        nonce_str: nonce_str,
        re_openid:re_openid,
        remark:remark,
        send_name:send_name,
        total_amount:total_amount,
        total_num:total_num,
        wishing:wishing,
        wxappid:wxappid
    };
    var string = raw(ret);
    var key = _key;
    string = string + '&key='+key;
    var crypto = require('crypto');
    return crypto.createHash('md5').update(string,'utf8').digest('hex');
};

// 小程序码
Weixin.getWXACode = function(scene, cb) {
    this.getAccessToken().then(token => {
        console.log('getWXACode get access_token ->');
        console.log(token);
        var reqUrl = 'https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token='+token;

        var params = {
            scene: scene
        };
        var string = JSON.stringify(params);
        console.log(string);

        var options = {
            url: reqUrl,
            method: "POST",
            body: string
        };

        var stream = request(options).pipe(fs.createWriteStream('./public/img_tmp/code_' + scene+'.png'));
        stream.on('finish', cb);
    })
}