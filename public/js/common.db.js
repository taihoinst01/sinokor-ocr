'use strict';

/******************************************
 * server database function js
 * ****************************************/
var commModule = require(require('app-root-path').path + '/public/js/import.js');
var queryConfig = commModule.queryConfig;

module.exports = function (pool) {

    // Paing query 생성
    var makePagingQuery = function (req) {
    var startNum = req.body.startNum ? req.body.startNum : 0;
    var endNum = req.body.endNum ? req.body.endNum : commonUtil.MAX_ENTITY_IN_PAGE;
    var query = " LIMIT " + startNum + " , " + endNum;
    return query;
    }

    // 리스트 쿼리 요청 (totalCount 포함)
    var reqListQuery = function (sql, callbackFunc, totalCount, req, res) {
    pool.getConnection(function (err, connection) {
        connection.execute(sql, function (err, result) {
            if (err) console.error("OracleDB err : ", err);
            result.rows[0].totalCount = totalCount;
            callbackFunc(result.rows ? result.rows : null, req, res);
            connection.release();
        });
    });
    };

    // 일반 쿼리 요청 (파라미터 포함)
    var reqQueryParam = function (sql, param, callbackFunc, req, res) {
    pool.getConnection(function (err, connection) {
        connection.execute(sql, param, function (err, result) {
            if (err) console.error("OracleDB err : ", err);
            callbackFunc(result.rows ? result.rows : null, req, res);
            connection.release();
        });
    });
    };

    // 쿼리 요청 (파라미터 포함, req & res 미포함, 함수 파라미터 하나 포함)
    var queryParam = function (sql, param, callbackFunc, origin) {
    pool.getConnection(function (err, connection) {
        connection.execute(sql, param, function (err, result) {
            if (err) console.error("OracleDB err : ", err);
            callbackFunc(result.rows ? result.rows : null, origin);
            connection.release();
        });
    });
    };

    // 일반 쿼리 요청
    var reqQuery = function (sql, callbackFunc, req, res) {
    pool.getConnection(function (err, connection) {
        connection.execute(sql, function (err, result) {
            if (err) console.error("OracleDB err : ", err);
            callbackFunc(result.rows ? result.rows: null, req, res);
            connection.release();
        });
    });
    };

    // 쿼리 요청 (파라미터 포함, req & res 미포함, rows 미포함)
    var queryNoRows = function (sql, param, callbackFunc) {
    pool.getConnection(function (err, connection) {
        connection.execute(sql, param, function (err) {
            if (err) console.error("OracleDB err : ", err);
            callbackFunc();
            connection.release();
        });
    });
    };

    module.exports.makePagingQuery = makePagingQuery;
    module.exports.reqListQuery = reqListQuery;
    module.exports.reqQueryParam = reqQueryParam;
    module.exports.reqQuery = reqQuery;
    module.exports.queryParam = queryParam;
    module.exports.queryNoRows = queryNoRows;  
}