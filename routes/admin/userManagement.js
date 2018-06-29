'use strict';
var importjs = require(require('app-root-path').path + '/public/js/import.js');

importjs.router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// userManagement.html 보여주기
var callbackFunc1 = function (rows, req, res) {
    console.log("콜백 실행");
    console.log("row 내용 : " + JSON.stringify(rows));
    res.render('admin/userManagement', { rows: rows ? rows : {} });
}
importjs.router.get('/', function (req, res) {
    console.log("호출합니다. v3");
    importjs.commonDB.reqQuery("", importjs.queryConfig.userMngConfig.selUserList, callbackFunc1, req, res);
    
    //pool.getConnection(function (err, connection) {
    //    var sql = queryConfig.userMngConfig.selUserList;

    //    connection.query(sql, function (err, rows) {
    //        if (err) console.error("err : " + err);

    //        res.render('admin/userManagement', { rows: rows ? rows : {} });
    //        connection.release();
    //    })
    //});
});

// userManagement.html 보여주기
importjs.router.post('/', function (req, res) {
    res.render('admin/userManagement');
});

//사용자 추가
importjs.router.post('/insertUser', function (req, res) {
    var data = [req.body.userId, req.body.userPw, req.body.auth, req.body.email];

    importjs.pool.getConnection(function (err, connection) {
        var sql = queryConfig.userMngConfig.insertUser;

        connection.query(sql, data, function (err, rows) {
            if (err) console.error("err : " + err);

            res.redirect('/userManagement');
            connection.release();
        })
    });
});





module.exports = importjs.router;
