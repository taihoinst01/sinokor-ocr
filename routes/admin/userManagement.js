'use strict';
var commModule = require(require('app-root-path').path + '/public/js/import.js');
var commonUtil = commModule.commonUtil;
var queryConfig = commModule.queryConfig;
var router = commModule.router;

var refreshPageYN = true; // 페이지 갱신 여부
var selectQuery = queryConfig.userMngConfig.selUserList; // 사용자 조회 쿼리
var insertQuery = queryConfig.userMngConfig.insertUser; // 사용자 추가 쿼리
var deleteQuery = queryConfig.userMngConfig.deleteUser; // 사용자 삭제 쿼리
var updateQuery = queryConfig.userMngConfig.updatePw; // 사용자(비밀번호) 수정 쿼리
var sortQuery = " ORDER BY seqNum DESC ";   // 사용자 조회 정렬 쿼리

// callback Function
// 사용자 조회 CallBack
var callbackFunc_view = function (rows, req, res) {
    res.render('admin/userManagement', { rows: rows ? rows : {} });
}
// 사용자 조회 콜백
var callbackFunc_search = function (rows, req, res) {
    if (!refreshPageYN) {
        res.send(rows);
    } else {
        refreshPageYN = false;
        res.render('admin/userManagement', { rows: rows ? rows : {} });
    }
}
// 사용자 카운트 쿼리 콜백
var callbackFunc_count = function (rows, req, res) {
    var query = selectQuery;
    // userId (리스트 조건)
    var userId = req.body.userId;
    if (!commonUtil.isNull(userId))
        query += " WHERE userId LIKE concat('%', '" + userId + "', '%') " + sortQuery;
    // Paging (리스트 조건)
    var startNum = req.body.startNum ? req.body.startNum : 1;
    var endNum = req.body.endNum ? req.body.endNum : commonUtil.MAX_ENTITY_IN_PAGE;
    if (!commonUtil.isNull(startNum) && !commonUtil.isNull(endNum))
        query += " LIMIT " + startNum + " , " + endNum;
    // Query
    commModule.commonDB.reqListQuery(query, callbackFunc_search, JSON.stringify(rows[0].cnt), req, res);
};

// 사용자 조회 (userManagement.js Load)
router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});
router.get('/', function (req, res) {
    refreshPageYN = true; // 페이지가 변경됨
    var countQuery = queryConfig.count.startQuery + selectQuery + queryConfig.count.endQuery;
    commModule.commonDB.reqQuery(countQuery, callbackFunc_count, req, res);
});
router.post('/', function (req, res) {
    res.render('admin/userManagement');
});

router.post('/searchUser', function (req, res) {
    refreshPageYN = false; // 페이지가 변경되지 않음 (데이터만 호출)
    var query = selectQuery;
    // userId (카운트 쿼리 조건)
    var userId = req.body.userId;
    if (!commonUtil.isNull(userId))
        query += " WHERE userId LIKE concat('%', '" + userId + "', '%') ";
    // 카운트 쿼리
    var countQuery = queryConfig.count.startQuery + query + queryConfig.count.endQuery;
    commModule.commonDB.reqQuery(countQuery, callbackFunc_count, req, res);
});


// 사용자 추가 콜백
var callbackFunc_insert = function (rows, req, res) {
    refreshPageYN = true;
    res.redirect('/userManagement');
};
//사용자 추가
router.post('/insertUser', function (req, res) {
    var data = [req.body.userId, req.body.userPw, req.body.auth, req.body.email];
    commModule.commonDB.reqQuery(insertQuery, callbackFunc_insert, req, res);
});


// 사용자수정 콜백
// 사용자수정

// 사용자삭제 콜백
// 사용자삭제


module.exports = router;

// 사용자 조회
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


//사용자 추가
//router.post('/insertUser', function (req, res) {
//    var data = [req.body.userId, req.body.userPw, req.body.auth, req.body.email];
//    commModule.pool.getConnection(function (err, connection) {
//        var sql = queryConfig.userMngConfig.insertUser;

//        connection.query(sql, data, function (err, rows) {
//            if (err) console.error("err : " + err);
//            refreshPageYN = true;
//            res.redirect('/userManagement');
//            connection.release();
//        })
//    });
//});

//사용자 삭제
//router.post('/deleteUser', function (req, res) {
//    var data = [req.body.seqNum];
//    console.log("delete : " + data);

//    commModule.pool.getConnection(function (err, connection) {
//        var sql = queryConfig.userMngConfig.deleteUser;

//        connection.query(sql, data, function (err, rows) {
//            if (err) console.error("err : " + err);

//            res.redirect('/userManagement');
//            connection.release();
//        })
//    });
//});


