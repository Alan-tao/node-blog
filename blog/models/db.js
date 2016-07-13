/**
 * Created by HeTao on 2016/6/26.
 */
var MongoClient = require('mongodb').MongoClient;

//不管什么数据库操作，都要先连接数据库，所以先把连接数据库封装成内部函数
function _connectionDB(callback) {
    var url = 'mongodb://localhost:27017/blog';
    //连接数据库
    MongoClient.connect(url, function (err, db) {
        callback(err, db);
    });

};


init();//执行init函数

//创建索引
function  init(){
    _connectionDB(function(err, db){
        if (err){
            console.log("数据库连接失败,请检查："+err);
            return;
        }
        db.collection('user').createIndex(
            { "username": 1 },
            null,
            function(err, results) {
                if (err){
                    console.log("索引创建失败,请检查："+err);
                    return;
                }
                console.log("==========索引：" + results+" 创建成功!");
            }
        );
    })
}

//新增
exports.insertOne = function (collectionName, json, callback) {
    //调用连接数据库函数
    _connectionDB(function (err, db) {
        if (err) {
            callback(err, null);
            return;
        }
        db.collection(collectionName).insertOne(json, function (err, result) {
            callback(err, result);
            db.close();//关闭连接
        })
    });
};

//查找
exports.find = function (collectionName, json, C, D) {
    //arguments.length 获取参数的个数
    //如果用户传的是三个参数，那么第三个参数就是callback，所以callback就等于C参数了
    if (arguments.length == 3) {
        var callback = C;
        //每页显示的数量
        var limit = 0;
        //应该省略的条数
        var skipnumber = 0;
    } else if (arguments.length == 4) {
        var args = C;
        var callback = D;
        //应该省略的条数
        var skipnumber = parseInt( args.pageSize * args.page || 0);
        //每页显示的数量
        var limit = parseInt(args.pageSize || 0);

        //排序方式
        var sort = args.sort || {};
    } else {
        throw new Error("find函数必须接受三个或者四个参数！");
        return;
    }
    //调用连接数据库函数
    var result = [];//查询之后的结果集
    _connectionDB(function (err, db) {
        if (err) {
            callback(err, null);
            return;
        }
        //查询分页
        var cursor = db.collection(collectionName).find(json).limit(limit).skip(skipnumber).sort(sort);
        cursor.each(function (err, doc) {
            if (err) {
                callback(err, null);
                db.close();//关闭连接
                return
            }
            if (doc != null) {
                result.push(doc);
            } else {
                callback(null,result);
                db.close();//关闭连接
            }
        });
    })
};



//删除数据
exports.deleteMany = function (collectionName, json, callback) {

    _connectionDB(function (err, db) {
        if (err){
            callback(err, null);
        }
        db.collection(collectionName).deleteMany(json, function (err, results) {
            callback(err, results);
            db.close();//关闭连接
        });
    });
};



//修改数据
exports.updata = function (collectionName, json1, json2, callback) {
    //调用连接数据库函数
    _connectionDB(function (err, db) {
        if (err){
            callback(err,null);
        }
        db.collection(collectionName).updateOne(json1,json2, function (err, results) {
            callback(err, results);
            db.close();//关闭连接
        });
    });
};

//得到数据总数量
exports.getAllCount = function (collectionName,callback) {
    //调用连接数据库函数
    _connectionDB(function (err, db) {
        if (err){
           console.log("数据库连接失败，请检查："+err);
            return;
        }
        db.collection(collectionName).count({}).then(function(count){
            callback(count);
            //console.log("当前集合数据总数为"+count+"条");
            db.close();//关闭数据库连接
        });
    });
};


