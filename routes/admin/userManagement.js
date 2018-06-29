'use strict';
var commMoudle  = require(require('app-root-path').path + '/public/js/import.js');
var router = commMoudle.router;
var queryConfig = commMoudle.queryConfig;

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// userManagement.html 보여주기
var callbackFunc1 = function (rows, req, res) {
    res.render('admin/userManagement', { rows: rows ? rows : {} });
}
router.get('/', function (req, res) {
    importjs.commonDB.reqQuery("", queryConfig.userMngConfig.selUserList, callbackFunc1, req, res);
    
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
router.post('/', function (req, res) {
    res.render('admin/userManagement');
});

//사용자 추가
router.post('/insertUser', function (req, res) {
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

//사용자 삭제
router.post('/deleteUser', function (req, res) {
    var data = [req.body.seqNum];

    pool.getConnection(function (err, connection) {
        var sql = queryConfig.userMngConfig.deleteUser;

        connection.query(sql, data, function (err, rows) {
            if (err) console.error("err : " + err);

            res.redirect('/userManagement');
            connection.release();
        })
    });
});


//router.get('/', function (req, res) {
//    pool.getConnection(function (err, connection) {
//        var sql = queryConfig.userMngConfig.selUserList;

//        connection.query(sql, function (err, rows) {
//            if (err) console.error("err : " + err);

//            res.render('admin/userManagement', { rows: rows ? rows : {} });
//            connection.release();
//        })
//    });
//});

module.exports = router;
