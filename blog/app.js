/**
 * Created by HeTao on 2016/7/4.
 */
var express = require("express");
var app = express();
var router = require("./router/router.js");
var session = require("express-session");

//设置模板引擎
app.set("view engine","ejs");
//静态文件夹
app.use(express.static("./public"));
app.use(express.static("./actar"));

//session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))

//显示首页
app.get('/', router.showIndex);

//显示注册页
app.get('/showRegister', router.showRegister);

//注册用户
app.post('/doRegister', router.doRegister);

//显示登陆页
app.get('/showLogin', router.showLogin);

//登录
app.post('/doLogin', router.doLogin);

//图片上传并且修改图片名称
app.post('/doupload', router.doupload);

//修改头像
app.get('/doCrop', router.doCrop);

//显示裁切页
app.get('/showCrop', router.showCrop);

//发表说说
app.post('/doshuoshuo', router.doshuoshuo);

//请求说说数据
app.get('/doSSData', router.doSSData);

//请求user表数据
app.get('/doUser', router.doUser);

//请求说说集合一定有多少条数据
app.get('/doCount',router.doCount);

//404
app.use(function(req,res){
    res.render("404");
})

app.listen(3000);