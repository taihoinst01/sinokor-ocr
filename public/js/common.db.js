'use strict';
var commModule = require(require('app-root-path').path + '/public/js/import.js');

var reqQuery = function (param, sql, callbackFunc, req, res) {
    commModule.pool.getConnection(function (err, connection) {
        connection.query(sql, function (err, rows) {
            if (err) console.error("MariaDB err : ", err);
            callbackFunc(rows, req, res);
            connection.release();
        })
    });
};

function db_print(param) {
    console.log("테스트 출력 :", param);
}

var db_print1 = function(param) {
    console.log("테스트 출력1 :", param);
}

module.exports = {
    reqQuery    : reqQuery
}