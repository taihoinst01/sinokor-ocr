'use strict';

/******************************************
 * server database function js
 * ****************************************/
var commModule = require(require('app-root-path').path + '/public/js/import.js');
var queryConfig = commModule.queryConfig;

// Paing query 생성
var makePagingQuery = function (req) {
    var startNum = req.body.startNum ? req.body.startNum : 0;
    var endNum = req.body.endNum ? req.body.endNum : commonUtil.MAX_ENTITY_IN_PAGE;
    var query = " LIMIT " + startNum + " , " + endNum;
    return query;
}

// 리스트 쿼리 요청 (totalCount 포함)
var reqListQuery = function (sql, callbackFunc, totalCount, req, res) {
    commModule.pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, rows) {
            if (err) console.error("MariaDB err : ", err);
            rows[0].totalCount = totalCount;
            callbackFunc(rows, req, res);
            connection.release();
        });
    });
};

// 일반 쿼리 요청 (파라미터 포함)
var reqQueryParam = function (sql, param, callbackFunc, req, res) {
    commModule.pool.getConnection(function (err, connection) {
        connection.query(sql, param, function (err, rows) {
            if (err) console.error("MariaDB err : ", err);
            callbackFunc(rows, req, res);
            connection.release();
        });
    });
};

// 일반 쿼리 요청
var reqQuery = function (sql, callbackFunc, req, res) {
    commModule.pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, rows) {
            if (err) console.error("MariaDB err : ", err);
            callbackFunc(rows, req, res);
            connection.release();
        });
    });
};


module.exports = {
    makePagingQuery: makePagingQuery,
    reqListQuery: reqListQuery,
    reqQueryParam: reqQueryParam,
    reqQuery: reqQuery
    
}