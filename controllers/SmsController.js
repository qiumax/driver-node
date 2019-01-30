var QcloudSms = require("qcloudsms_js");
var appid = 1400160392;
var appkey = "029f4cd6e6502279a6903d8b169c18a0";
var templateId = 230236;
var smsdSign = "三一重卡";
var qcloudsms = QcloudSms(appid, appkey);
var ssender = qcloudsms.SmsSingleSender();
var smsController = {};
smsController.sendsms = function(req, res) {
    console.log(req)
    var phonenum = req.body.phonenum;
    var code = req.body.code;
    var params = [code,'2'];//数组具体的元素个数和模板中变量个数必须一致，
    ssender.sendWithParam(86, phonenum, templateId,
        params, smsdSign , "", "", function (err,resback,resdata) {
            if (err) {
                console.log("err: ", err);
                res.send(err)
            } else {
                console.log("request data: ", resback.req);
                console.log("response data: ", resdata);
                res.send(resdata)
            }

        });
};

module.exports = smsController;