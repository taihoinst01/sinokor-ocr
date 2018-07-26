﻿'use strict';

/******************************************
 * server database function js
 * ****************************************/
var commModule = require(require('app-root-path').path + '/public/js/import.js');
var queryConfig = commModule.queryConfig;

module.exports = function (pool) {

    // Paing query 생성
    var makePagingQuery = function (req, targetQuery) {
    var startNum = req.body.startNum ? req.body.startNum : 0;
    var endNum = req.body.endNum ? req.body.endNum : commonUtil.MAX_ENTITY_IN_PAGE;
    var query = `
        SELECT
            *
        FROM
            (
            SELECT
                rownum AS rnum, A.*
            FROM
                (`+ targetQuery +`) A
            WHERE
                rownum <= `+ endNum +`
            )
        WHERE
            rnum > `+ startNum +`
    `;
    return query;
    }

    // 리스트 쿼리 요청 (totalCount 포함)
    var reqListQuery = function (sql, callbackFunc, totalCount, req, res) {
    pool.getConnection(function (err, connection) {
        connection.execute(sql, function (err, result) {
            if (err) {
                console.error("OracleDB err : ", err);
                console.log(sql);
            }
            result.rows[0].totalCount = totalCount;
            callbackFunc(result.rows ? result.rows : 0, req, res);
            connection.release();
        });
    });
    };

    // 일반 쿼리 요청 (파라미터 포함)
    var reqQueryParam = function (sql, param, callbackFunc, req, res) {
    pool.getConnection(function (err, connection) {
        connection.execute(sql, param, function (err, result) {
            if (err) {
                console.error("OracleDB err : ", err);
                console.log(sql);
            }
            callbackFunc(result.rows ? result.rows : 0, req, res);
            connection.release();
        });
    });
    };

    // 쿼리 요청 (파라미터 포함, req & res 미포함, 함수 파라미터 하나 포함)
    var queryParam = function (sql, param, callbackFunc, origin) {
    pool.getConnection(function (err, connection) {
        connection.execute(sql, param, function (err, result) {
            if (err) {
                console.error("OracleDB err : ", err);
                console.log(sql);
            }
            callbackFunc(result.rows ? result.rows : 0, origin);
            connection.release();
        });
    });
    };

    // 일반 쿼리 요청
    var reqQuery = function (sql, callbackFunc, req, res) {
    pool.getConnection(function (err, connection) {
        connection.execute(sql, function (err, result) {
            if (err) {
                console.error("OracleDB err : ", err);
                console.log(sql);
            }
            callbackFunc(result.rows ? result.rows: 0, req, res);
            connection.release();
        });
    });
    };

    // 일반 쿼리 요청(함수 파라미터 하나 포함)
    var reqQueryF1param = function (sql, callbackFunc, req, res, origin) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rows ? result.rows : null, req, res, origin);
                connection.release();
            });
        });
    };

    // 일반 쿼리 요청(함수 파라미터 두개 포함)
    var reqQueryF2param = function (sql, callbackFunc, req, res, origin, originTwo) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rows ? result.rows : null, req, res, origin, originTwo);
                connection.release();
            });
        });
    };

    // 쿼리 요청 (파라미터 포함, req & res 미포함, rows 미포함)
    var queryNoRows = function (sql, param, callbackFunc) {
    pool.getConnection(function (err, connection) {
        connection.execute(sql, param, function (err) {
            if (err) {
                console.error("OracleDB err : ", err);
                console.log(sql);
            }
            callbackFunc();
            connection.release();
        });
    });
    };

    module.exports.makePagingQuery = makePagingQuery;
    module.exports.reqListQuery = reqListQuery;
    module.exports.reqQueryParam = reqQueryParam;
    module.exports.reqQuery = reqQuery;
    module.exports.reqQueryF1param = reqQueryF1param;
    module.exports.reqQueryF2param = reqQueryF2param;
    module.exports.queryParam = queryParam;
    module.exports.queryNoRows = queryNoRows;  
}