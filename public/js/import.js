'use strict';
var appRoot = require('app-root-path').path;
//var express = require('express');
//var router = express.Router();
var fs = require('fs');
var debug = require('debug');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require("multer");
var exceljs = require('exceljs');
// DB
//var mysql = require('mysql');
var oracledb = require('oracledb');
oracledb.poolTimeout = 0;
oracledb.autoCommit = true;
oracledb.outFormat = oracledb.OBJECT;
oracledb.fetchAsString = [oracledb.NUMBER]; // 숫자반환을 문자열로 전환 (xx.99 -> xx.99000002 와 같은 반환오류 때문)
var dbConfig = require(appRoot + '/config/dbConfig');
//var pool = mysql.createPool(dbConfig);
oracledb.createPool(dbConfig, function (err, pool) {
    if (err) {
        console.log("ERROR: ", new Date(), ": createPool() callback: " + err.message);
        return;
    }
    require('./common.db.js')(pool);
});
var queryConfig = require(appRoot + '/config/queryConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');


exports.appRoot = appRoot;
//exports.express = express;
//exports.router = router;
exports.fs = fs;
exports.debug = debug;
exports.path = path;
exports.favicon = favicon;
exports.logger = logger;
exports.cookieParser = cookieParser;
exports.bodyParser = bodyParser;
exports.multer = multer;
exports.exceljs = exceljs;
//exports.mysql = mysql;
exports.oracledb = oracledb;
exports.dbConfig = dbConfig;
exports.queryConfig = queryConfig;
exports.commonDB = commonDB;
exports.commonUtil = commonUtil;
//exports.cookieSession = cookieSession;
//exports.expressSession = expressSession;
//exports.flash = flash;
//exports.passport = passport;
//exports.LocalStrategy = LocalStrategy;
//exports.bcrypt = bcrypt;