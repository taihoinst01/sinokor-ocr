'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;

var commModule = require(appRoot + '/public/js/import.js');
var commonUtil = commModule.commonUtil;
var router = commModule.router;
var queryConfig = commModule.queryConfig;

var router = express.Router();

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// uiLearning.html 보여주기
router.get('/', function (req, res) {
    res.render('user/uiLearning');
});

// userDashbaord.html 보여주기
router.post('/', function (req, res) {
    res.render('user/uiLearning');
});

// db컬럼명 조회
router.post('/searchDBColumns', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;
    var query = queryConfig.dbcolumnsConfig.selDBColumns;

    commModule.commonDB.reqQuery(query, function (rows, req, res) {
        res.send({ 'fileName': fileName, 'data':data, 'dbColumns': rows });
    }, req, res);
});





module.exports = router;
