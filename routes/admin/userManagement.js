'use strict';
var commModule = require(require('app-root-path').path + '/public/js/import.js');
var commonUtil = commModule.commonUtil;
var router = commModule.router;
var queryConfig = commModule.queryConfig;

var screenExist = false;
var selectQuery = queryConfig.userMngConfig.selUserList;
var sortQuery = " seqNum DESC ";

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// callback Function
// 사용자 관리 화면 콜백
var callbackFunc_view = function (rows, req, res) {
    res.render('admin/userManagement', { rows: rows ? rows : {} });
}


// userManagement.html
router.get('/', function (req, res) {
    var countQuery = queryConfig.count.startQuery + selectQuery + queryConfig.count.endQuery;
    commModule.commonDB.reqQuery(countQuery, callbackFunc_count, req, res);
});
router.post('/', function (req, res) {
    res.render('admin/userManagement');
});

// 사용자 조회 콜백
var callbackFunc_search = function (rows, req, res) {
    if (screenExist) {
        res.send(rows);
    } else {
        screenExist = true;
        res.render('admin/userManagement', { rows: rows ? rows : {} });
    }
}
// 사용자 카운트 쿼리 콜백
var callbackFunc_count = function (rows, req, res) {
    var query = selectQuery;
    var startNum = req.body.startNum ? req.body.startNum : 1;
    var endNum = req.body.endNum ? req.body.endNum : commonUtil.MAX_ENTITY_IN_PAGE;
    var userId = req.body.userId;
    if (!commonUtil.isNull(userId))
        query += " WHERE userId LIKE concat('%', '" + userId + "', '%') " + sortQuery;
    if (!commonUtil.isNull(startNum) && !commonUtil.isNull(endNum))
        query += " LIMIT " + startNum + " , " + endNum;
    commModule.commonDB.reqListQuery(query, callbackFunc_search, JSON.stringify(rows[0].cnt), req, res);
};
// 사용자 조회 (카운트)
router.post('/searchUser', function (req, res) {
    var query = selectQuery;
    var userId = req.body.userId;
    if (!commonUtil.isNull(userId))
        query += " WHERE userId LIKE concat('%', '" + userId + "', '%') ";
    var countQuery = queryConfig.count.startQuery + query + queryConfig.count.endQuery;
    commModule.commonDB.reqQuery(countQuery, callbackFunc_count, req, res);
});

//사용자 추가
router.post('/insertUser', function (req, res) {
    var data = [req.body.userId, req.body.userPw, req.body.auth, req.body.email];
    console.log("data :", data);
    commModule.pool.getConnection(function (err, connection) {
        var sql = queryConfig.userMngConfig.insertUser;

        connection.query(sql, data, function (err, rows) {
            if (err) console.error("err : " + err);
            screenExist = false;
            res.redirect('/userManagement');
            connection.release();
        })
    });
});

//사용자 삭제
router.post('/deleteUser', function (req, res) {
    var data = [req.body.seqNum];
    console.log("delete : " + data);

    commModule.pool.getConnection(function (err, connection) {
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
