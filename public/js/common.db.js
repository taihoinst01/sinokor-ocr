'use strict';

/******************************************
 * server database function js
 * ****************************************/
var commModule = require(require('app-root-path').path + '/public/js/import.js');
var queryConfig = commModule.queryConfig;

// count가 추가된 리스트 쿼리 요청
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
    reqListQuery : reqListQuery,
    reqQuery   : reqQuery
}