﻿'use strict';
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

var PythonShell = require('python-shell');
 
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    }),
});
var router = express.Router();

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// batchLearning.html 보여주기
router.get('/', function (req, res) {
    res.render('user/batchLearning');
});

// batchLearning.html 보여주기
router.post('/', function (req, res) {
    res.render('user/batchLearning');
});

// fileupload
router.post('/multiUpload', upload.any(), function (req, res) {
    var files = req.files;
    var endCount = 0;
    var returnObj = [];

    for (var i = 0; i < files.length; i++) {
        if (files[i].originalname.split('.')[1] === 'TIF' || files[i].originalname.split('.')[1] === 'tif') {
            var ifile = appRoot + '\\' + files[i].path;
            var ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.jpg';
            returnObj.push(files[i].originalname.split('.')[0] + '.jpg');
            exec('module\\imageMagick\\convert.exe -density 800x800 ' + ifile + ' ' + ofile, function (err, out, code) {                
                if (endCount === files.length - 1) { // 모든 파일 변환이 완료되면
                    res.send({ code: 200, message: returnObj });
                }
                endCount++;
            });
        }
    }
});

// insert batchLearningData
router.post('/insertBatchLearningData', function (req, res) {
    var batchLearningData = req.body.batchLearningData;
    var word = '';
    for (var i = 0; i < batchLearningData.length; i++) {
        word += (i != batchLearningData.length - 1) ? batchLearningData[i].text + "\n" : batchLearningData[i].text;
    }
    if (!batchLearningData) {
        res.send({ code: '400', message: 'The parameter is invalid' });
    }

    // TO-DO eval.py 
    var dataPath = appRoot + '\\ml\\data'; // 데이터 root 경로
    var inputName = 'input_' + getConvertDate();
    var outputName = 'output_' + getConvertDate();
    
    //var options = {
    //    mode: 'text',
    //    encoding: 'utf8',
    //    pythonPath: 'C:\\Users\\hykim\\AppData\\Local\\Programs\\Python\\Python35\\python.exe',
    //    pythonOptions: ['-u'],
    //    scriptPath: appRoot + '\\ml',
    //    args: word
    //};

    //PythonShell.run('eval.py', options, function (err, results) {
    //    if (err) throw err;
    //    console.log('results: %j', results);
    //});
    
    for (var i = 0; i < batchLearningData.length; i++) {
        var xcoodi = batchLearningData[i].location.split(',')[0];
        var ycoodi = batchLearningData[i].location.split(',')[1];
        var text = batchLearningData[i].text;
        var len = batchLearningData[i].text.length;
        var data = [xcoodi, ycoodi, len, text];
        //commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertBatchLearningData, data, callbackInsertBatchLearningData, req, res);
    }
    res.send({ code: 200, message: '입력 성공!' });
});

//오늘날짜 변환함수
function getConvertDate() {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = (today.getMonth() + 1 < 10) ? '0' + (today.getMonth() + 1) : today.getMonth() + 1;
    var dd = today.getDate();
    var hh = (today.getHours() < 10) ? '0' + today.getHours() : today.getHours();
    var minute = (today.getMinutes() < 10) ? '0' + today.getMinutes() : today.getMinutes();
    var ss = (today.getSeconds() < 10) ? '0' + today.getSeconds() : today.getSeconds();
    var mss = (today.getMilliseconds() < 100) ? ((today.getMilliseconds() < 10) ? '00' + today.getMilliseconds() : '0' + today.getMilliseconds()) : today.getMilliseconds();

    return '' + yyyy + mm + dd + hh + minute + ss + mss;
}

module.exports = router;
