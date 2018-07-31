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
var request = require('request');

var router = express.Router();


/***************************************************************
 * Router
 * *************************************************************/

// [POST] OCR API (request binary data)
router.post('/ocr', function (req, res) {
    var filename = req.body.fileName;

    fs.readFile('./uploads/' + filename, function (err, data) {
        if (err) res.send({ error: '파일이 없습니다.' }); // fs error

        var base64 = new Buffer(data, 'binary').toString('base64');
        var binaryString = new Buffer(base64, 'base64').toString('binary');
        var buffer = new Buffer(binaryString, "binary");

        var params = {
            'language': 'unk',
            'detectOrientation': 'true'
        };

        request({
            headers: {
                'Ocp-Apim-Subscription-Key': propertiesConfig.ocr.subscriptionKey,
                'Content-Type': 'application/octet-stream'
            },
            uri: propertiesConfig.ocr.uri + '?' + 'language=' + params.language + '&detectOrientation=' + params.detectOrientation,
            body: buffer,
            method: 'POST'
        }, function (err, response, body) {
            if (err) { // request err
                res.send({ error: '요청 에러가 발생했습니다.' });
            } else {
                if ((JSON.parse(body)).code) { // ocr api error
                    res.send({ code: (JSON.parse(body)).code, message: (JSON.parse(body)).message });                   
                } else { // 성공
                    res.send(body);
                }
            }
        });
    });
});


// [POST] TBL_COMM_ERROR INSERT
var callIInsertCommError = function (rows, req, res) {
    res.send({ code: 200 });
};

router.post('/insertCommError', function (req, res) {
    var eCode = ocrErrorCode(req.body.eCode); // 에러코드
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
    param.push((eCode) ? eCode : 999);

    commonDB.reqQueryParam(queryConfig.commonConfig.insertCommError, param, callIInsertCommError, req, res);
});

// ocr request err code
function ocrErrorCode(code) {
    code = code.trim();
    if (code == 'InvalidImageUrl' || code == 'InvalidImageFormat' || code == 'InvalidImageSize' || code == 'NotSupportedLanguage') {
        return 400;
    } else if (code == 'BadArgument') {
        return 415;
    } else if (code == 'FailedToProcess' || code == 'Timeout' || code == 'InternalServerError') {
        return 500;
    } else {
        return 999;
    }
}

module.exports = router;
