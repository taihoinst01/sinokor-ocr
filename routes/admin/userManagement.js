'use strict';
var commModule = require(require('app-root-path').path + '/public/js/import.js');
var commonUtil = commModule.commonUtil;
var commonDB = commModule.commonDB;
var queryConfig = commModule.queryConfig;
var router = commModule.router;

var selectQuery = queryConfig.userMngConfig.selUserList; // 사용자 조회 쿼리
var insertQuery = queryConfig.userMngConfig.insertUser; // 사용자 추가 쿼리
var deleteQuery = queryConfig.userMngConfig.deleteUser; // 사용자 삭제 쿼리
var updateQuery = queryConfig.userMngConfig.updatePw; // 사용자(비밀번호) 수정 쿼리

/***************************************************************
 * Router
 * *************************************************************/
router.get('/favicon.ico', function (req, res) {    // favicon
    res.status(204).end();
});
router.get('/', function (req, res) {               // 사용자 관리 (GET)
    res.render('admin/userManagement');
});
router.post('/searchUser', function (req, res) {    // 사용자 조회
    fnSearch(req, res);
});
router.post('/insertUser', function (req, res) {    //사용자 추가
    var data = [req.body.userId, req.body.userPw, req.body.auth, req.body.email];
    commonDB.reqQuery(insertQuery, callbackInsert, req, res);
});

/***************************************************************
 * function
 * *************************************************************/
 // [조회조건] 사용자 리스트
function condFuncList(req) {
    if (!commonUtil.isNull(req.body.userId))
        return selectQuery + " WHERE userId LIKE concat('%', '" + req.body.userId + "', '%') " + " ORDER BY seqNum DESC ";
    else return selectQuery + " ORDER BY seqNum DESC ";
}
// [조회조건] 사용자
function condFuncSelect(req) {
    return selectQuery + " WHERE userId = '" + req.body.userId + "' ";
}
// [List] 사용자 조회 
function fnSearch(req, res) {
    var query = condFuncList(req);
    // Count query
    var countQuery = queryConfig.count.startQuery + query + queryConfig.count.endQuery;
    commonDB.reqQuery(countQuery, callbackCount, req, res);
}
// [CALLBACK] 사용자 조회 카운트
function callbackCount(rows, req, res) {
    var query = condFuncList(req);
    // Paging
    if (!commonUtil.isNull(req.body.startNum) && !commonUtil.isNull(req.body.endNum))
        query += commonDB.makePagingQuery(req);
    // List query
    commonDB.reqListQuery(query, callbackSearch, JSON.stringify(rows[0].cnt), req, res);
};
// [CALLBACK] 사용자 조회
function callbackSearch(rows, req, res) {
    res.send(rows);
}
// [CALLBACK] 사용자 추가
function callbackInsert(rows, req, res) {
    res.redirect('/userManagement');
};

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


