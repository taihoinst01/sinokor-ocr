'use strict';
var express = require('express');
var fs = require('fs');
var debug = require('debug');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var router = express.Router();
// DB
var mysql = require('mysql');
var dbConfig = require(appRoot + '/config/dbConfig');
var pool = mysql.createPool(dbConfig);
var queryConfig = require(appRoot + '/config/queryConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');

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
    if (req.isAuthenticated()) res.render('admin/userManagement', { currentUser: req.user });
    else res.redirect("/logout");
});
router.post('/searchUser', function (req, res) {    // 사용자 조회
    if (req.isAuthenticated()) fnSearch(req, res);
});
router.post('/insertUser', function (req, res) {    //사용자 추가
    var data = [req.body.userId, req.body.userPw, req.body.auth, req.body.email];
    if (req.isAuthenticated()) commonDB.reqQueryParam(insertQuery, data, callbackInsert, req, res);
});
router.post("/updatePw", function (req, res) {     // 사용자 비밀번호 수정
    var data = [req.body.userPwUpdate, req.body.seqNumUpdate];
    if (req.isAuthenticated()) commonDB.reqQueryParam(updateQuery, data, callbackUpdate, req, res);
});
router.post("/deleteUser", function (req, res) {     // 사용자 비밀번호 수정
    var data = [req.body.seqNum];
    if (req.isAuthenticated()) commonDB.reqQueryParam(deleteQuery, data, callbackDelete, req, res);
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
    if (!commonUtil.isNull(req.body.startNum) || !commonUtil.isNull(req.body.endNum))
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
// [CALLBACK] 사용자 비밀번호 수정
function callbackUpdate(rows, req, res) {
    res.redirect('/userManagement');
}
// [CALLBACK] 사용자 삭제
function callbackDelete(rows, req, res) {
    res.redirect('/userManagement');
}

module.exports = router;