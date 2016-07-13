/**
 * Created by HeTao on 2016/7/4.
 */

var crypto = require("crypto");

//加密函数
exports.md5 = function(mingma){
    var md5 = crypto.createHash('md5');
    var password = md5.update(mingma).digest('base64');
    return password;
}