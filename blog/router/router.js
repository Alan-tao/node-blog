/**
 * Created by HeTao on 2016/7/4.
 */
var db = require("../models/db.js");
var gm = require("gm");
var formidable = require("formidable");
var sd = require("silly-datetime");
var crypto = require("../models/crypto.js");
var path = require("path");
var fs = require("fs");


//显示首页
exports.showIndex = function (req, res, next) {
    if (req.session.login) {
        var username = req.session.username;
        var avtar = req.session.avtar;
        var login = true;
        res.render("index", {
            "login": login,
            "username": username,
            "avtar": avtar
        });
    } else {
        res.render("index", {
            "login": false,
            "username": "",
            "avtar": "defaultActar.png"
        });
    }
};
//显示注册页
exports.showRegister = function (req, res, next) {

    res.render("register")
};
//注册用户
exports.doRegister = function (req, res, next) {

    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //得到用户提交过来的用户名和密码
        var username = fields.username;
        var password = fields.password;
        //给密码 MD5 加密
        password = crypto.md5(crypto.md5(password.substr(4, 7)) + crypto.md5(password));
        //查询数据库，看用户名是否存在
        db.find("user", {"username": username}, function (err, result) {
            if (err) {
                console.log("查询数据库失败：请检查：" + err);
                res.send("-1");
                return;
            } else if (result.length > 0) {
                res.send("-2");//-2代用户名已经存在
                return;
            }
            //以上情况都不存在，那就验证成功，把用户名密码存入数据库，返回注册成功
            db.insertOne("user", {
                "username": username,
                "password": password,
                "avtar": "defaultActar.png"//给默认设置一个头像
            }, function (err, result) {
                if (err) {
                    console.log("查询数据库失败：请检查：" + err);
                    res.send("-1");
                    return;
                }
                //用户名密码存入session
                req.session.login = true;
                req.session.username = username;
                req.session.password = password;
                req.session.avtar = "defaultActar.png" //给默认设置一个头像

                res.send("1");//1代表注册成功
            })
        })
    });
};

//登录
exports.doLogin = function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        //得到用户提交过来的用户名和密码
        var username = fields.username;
        var password = fields.password;
        //给密码 MD5 加密
        password = crypto.md5(crypto.md5(password.substr(4, 7)) + crypto.md5(password));
        //查询数据库，验证用户名密码
        db.find("user", {"username": username}, function (err, resutl) {
            if (err) {
                console.log("查询数据库失败：请检查：" + err);
                res.send("-1");
                return;
            } else if (resutl.length < 1) {

                res.send("-3");//-3代表用户名不存在
                return;
            } else if (resutl[0].password == password) {
                //用户名密码存入session
                req.session.login = true;
                req.session.username = username;
                req.session.password = password;
                req.session.avtar = resutl[0].avtar;

                res.send("1");//1代表验证成功，可以登录
            } else {
                res.send("-2");//1代表密码错误
                return;
            }
        })
    })
};

//显示登陆页
exports.showLogin = function (req, res, next) {
    res.render("login")
};


//上传图片并且改名
exports.doupload = function (req, res, next) {
    //判断是否登录了
    if (req.session.login) {
        //取得session里面当前的用户名
        var username = req.session.username;

        var form = new formidable.IncomingForm();
        //s上传路径
        var dir = path.normalize(__dirname + "/../actar/");
        //设置上传路径
        form.uploadDir = dir;

        form.parse(req, function (err, fields, files) {

            //图片后缀名
            var extname = path.extname(files.avtar.name);
            //图片原始的文件名
            var oldpath = files.avtar.path;
            //产生的图片地址和图片名称
            var newpath = dir + username + extname;
            //执行改名
            fs.rename(oldpath, newpath, function (err) {
                if (err) {
                    res.send("改名失败");
                    return;
                }
                //把图片名称存入session
                req.session.avtar = username + extname;

                res.send("1");
            });
        })
    } else {
        res.send("你还没登录！");
    }
}

//显示图片裁切页
exports.showCrop = function (req, res, next) {
    res.render("crop", {
        "avtar": req.session.avtar
    })
}

//裁切图片
exports.doCrop = function (req, res, next) {
    //获取裁切的对象属性
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    //获取当前用户的session里的图片名称
    var imgName = req.session.avtar;

    //拼接要裁切图片的地址
    var imgurl = path.normalize(__dirname + "/../actar/" + imgName);
    gm(imgurl)
        .crop(w, h, x, y)
        .resize(130, 130, "!")//强行裁 宽高比
        .write(imgurl, function (err) {
            if (err) {
                console.log(err);
                res.send("-2");
                return;
            }
            //更新数据到数据库
            db.updata("user", {
                "username": req.session.username
            }, {
                $set: {"avtar": req.session.avtar}

            }, function (err, result) {
                if (err) {
                    console.log("更换头像失败，请检查，" + err);
                    return;
                    res.send("-1");
                }
                res.send("1");
            })
        });
}


//发表说说
exports.doshuoshuo = function (req, res, next) {

    if (!req.session.login) {
        res.send("-2"); //-2代表没有登录。不能发表说说

    } else {
        var form = new formidable.IncomingForm();

        form.parse(req, function (err, fields, files) {
            if (err) {
                console.log(err);
                return;
            }
            //获取到说说类容
            var content = fields.content;
            //获取当前时间
            var datetime = sd.format(new Date(), 'YYYY-MM-DD HH:mm');
            //获取当前用户名
            var username = req.session.username;
            //从session或取当前头像
            var avtar = req.session.avtar;

            db.insertOne("contents", {
                "username": username,
                "datetime": datetime,
                "content": content
            }, function (err, result) {
                if (err) {
                    console.log("发表说说失败：请检查：" + err);
                    res.send("-1");//-1代表发表失败
                    return;
                }
                //代表发表说说成功
                res.json({
                    "contents": {
                        "datetime": datetime,
                        "username": username,
                        "content": content,
                        "avtar": avtar
                    }
                });
            })
        })
    }
}

//请求说说数据
exports.doSSData = function (req, res, next) {
    var pages = parseInt(req.query.pages);//当前第几页
    var pageSize =  parseInt(req.query.pageSize);//每次显示多少条
    db.find("contents", {}, {"pageSize":pageSize,"page":pages,"sort":{"datetime": -1}},function (err, rusult) {

        if (err) {
            console.log("查询数据失败：请检查：" + err);
            res.send("-1");//-1代表发表失败
            return;
        }
            res.json(rusult);
    });
}

//请求user表数据

exports.doUser = function (req, res, next){
    var username = req.query.username;
    console.log(username);
    db.find("user",{"username":username},function (err, rusult) {

        if (err) {
            console.log("查询数据失败：请检查：" + err);
            res.send("-1");//-1代表发表失败
            return;
        }
        var obj = {
            "username": rusult[0].username,
            "avtar": rusult[0].avtar,
            "_id": rusult[0]._id
        }
        res.send(obj);
    });
};
//得到总数据条数
exports.doCount = function(req, res, next){
    db.getAllCount("contents",function(count){
        res.send(count.toString());
    })
}