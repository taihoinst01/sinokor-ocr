'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var exec = require('child_process').exec;
var mysql = require('mysql');
var dbConfig = require(appRoot + '/config/dbConfig');
var pool = mysql.createPool(dbConfig);
var queryConfig = require(appRoot + '/config/queryConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
var logger = require('../util/logger');
var aimain = require('../util/aiMain');
var PythonShell = require('python-shell');
var propertiesConfig = require(appRoot + '/config/propertiesConfig.js');
const FileHound = require('filehound');
const xlsx = require('xlsx');

var router = express.Router();


/***************************************************************
 * Router
 * *************************************************************/

// [POST] TBL_COMM_ERROR INSERT
var callIInsertCommError = function (rows, req, res) {
    res.send({ code: 200 });
};

router.post('/insertCommError', function (req, res) {
    var e = req.body.error;
    var type = req.body.type;
    var param = [];

    param.push(req.session.userId);
    if (type == 'ocr') {
        param.push(1001);
    } else if (type == 'typo') {
        param.push(1002);
    } else if (type == 'domain') {
        param.push(1003);     
    } else {
        param.push(9999);
    }
    param.push((e.status) ? e.status : 999);

    commonDB.reqQueryParam(queryConfig.commonConfig.insertCommError, param, callIInsertCommError, req, res);
});


module.exports = router;
