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

var csvParser = require('papaparse');
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

router.get('/pyTest', function (req, res) {

    const defaults = {
        encoding: 'utf8',
    };

    var arg = '"Partner of Choice"' + ' ' + '"Class of Business"' + ' ';
    //var exeString = 'python ' + appRoot + '\\ml\\cnn-text-classification\\eval.py ' + arg;
    var exeString = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\eval.py ' + arg;
    exec(exeString, defaults, function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        res.send(stdout);
    });

});

router.get('/fixvalueTest', function (req, res) {
    var test = 'test';
    var excelArray = [];

    var workbook = new exceljs.Workbook();
    workbook.xlsx.readFile('E:\\projectworks\\koreanre\\docsample.xlsx')
        .then(function () {
            var worksheet = workbook.getWorksheet('Sheet1');
            worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {

                var data = {};
                data.cell1 = row.values[1];
                data.cell2 = row.values[2];
                data.cell3 = row.values[3];
                data.cell4 = row.values[4];
                data.cell5 = "";

                excelArray.push(data);
                /*
                                if (row.values[4] == 'fixvalue') {
                                    console.log("Row " + rowNumber + " = " + row.values[1] + "," + row.values[2] + "," + row.values[3] + "," + row.values[4]);
                                }
                */
            });

            for (var i = 0; i < excelArray.length; i++) {
                if (excelArray[i].cell4 == "fixvalue") {

                    var valueXNum = excelArray[i].cell1;
                    var valueYNum = excelArray[i].cell2;
                    var minDis = 100000;
                    var fixlabel;

                    for (var j = 0; j < excelArray.length; j++) {
                        if (excelArray[j].cell4 == "fixlabel") {
                            var xNum = excelArray[j].cell1;
                            var yNum = excelArray[j].cell2;
                            var diffX = valueXNum - xNum;
                            var diffY = valueYNum - yNum;

                            var dis = Math.sqrt(Math.abs(diffX * diffX) + Math.abs(diffY * diffY));

                            if (minDis > dis) {
                                minDis = dis;
                                fixlabel = excelArray[j].cell3;
                            }
                        }
                    }

                    excelArray[i].cell5 = fixlabel;
                    console.log(excelArray[i]);
                }
            }
        })

    res.send(test);
});

// fileupload
router.post('/multiUpload', upload.any(), function (req, res) {
    var files = req.files;
    var endCount = 0;
    var returnObj = [];

    for (var i = 0; i < files.length; i++) {
        if (files[i].originalname.split('.')[1] === 'TIF' || files[i].originalname.split('.')[1] === 'tif' ||
            files[i].originalname.split('.')[1] === 'TIFF' || files[i].originalname.split('.')[1] === 'tiff') {
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
    for (var i = 0; i < batchLearningData.length; i++) {
        var xcoodi = batchLearningData[i].location.split(',')[0];
        var ycoodi = batchLearningData[i].location.split(',')[1];
        var text = batchLearningData[i].text;
        var len = batchLearningData[i].text.length;
        var data = [xcoodi, ycoodi, len, text];
        //commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertBatchLearningData, data, callbackInsertBatchLearningData, req, res);
    }
});

// run batchLearningData
router.post('/execBatchLearningData', function (req, res) {
    var classificationResult;
    var labelMappingResult;
    var arg = '"Partner of Choice"' + ' ' + '"Class of Business"' + ' ';

    var localCnnTextClassificationPath = "C:\\workspace\\cnn-text-classification\\";
    var localLabelMappingPath = "C:\\workspace\\cnn-label-mapping\\";

    var cnnTextClassificationPath = 'python ' + appRoot + '\\ml\\cnn-text-classification\\';
    var labelMappingPath = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\';

    var inputName = 'input_' + getConvertDate();
    var outputName = 'output_' + getConvertDate();
    // 오타수정 머신러닝 START
    const defaults = {
        encoding: 'utf8'
    };
    exec(cnnTextClassificationPath + 'eval.py', defaults, function (err1, stdout1, stderr1) {
    //exec(cnnTextClassificationPath + 'eval.py', defaults, function (err1, stdout1, stderr1) {
        if (err1) {
            console.log(err1);
            res.send({ code: '500', message: err1 });
        } else {
            console.log("stdout : " + stdout1);
            //var classificationResult = "";
            //var classificationResult = fs.readFileSync(localCnnTextClassificationPath + "prediction.csv", "utf8");
            //var classificationResult = csvParser.parse(classificationResult);
            //console.log("classification result : " + JSON.stringify(classificationResult));
        }
    });
    function labelMappingFunc(classificationResult) {
        exec(localLabelMappingPath + 'eval.py ' + classificationResult, defaults, function (err, stdout, stderr) {
        //exec(labelMappingPath + 'eval.py ' + classificationResult, defaults, function (err, stdout, stderr) {
            labelMappingResult = stdout;
            console.log("labelMappingResult : " + labelMappingResult); // TO-DO 그리드 변경되면 그리드에 출력
            //res.send(stdout);
        });
    }
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
