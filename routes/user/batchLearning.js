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

var selectBatchLearningDataListQuery = queryConfig.batchLearningConfig.selectBatchLearningDataList;
 
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
const defaults = {
    encoding: 'utf8',
};
var router = express.Router();


/***************************************************************
 * Router
 * *************************************************************/
router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});
router.get('/', function (req, res) {                           // 배치학습 (GET)
    if (req.isAuthenticated()) res.render('user/batchLearning', { currentUser: req.user });
    else res.redirect("/logout");
});
router.post('/searchBatchLearnDataList', function (req, res) {   // 배치학습데이터리스트 조회
    if (req.isAuthenticated()) fnSearchBatchLearningDataList(req, res);
}); 


/***************************************************************
 * function
 * *************************************************************/
 // [List] 배치학습데이터리스트 조회 
var fnSearchBatchLearningDataList = function (req, res) {
    // 조건절
    var condQuery = "";
    if (!commonUtil.isNull(req.body.addCond)) {
        if (req.body.addCond == "SHOW_UNFINISH") condQuery = " AND CSCO_NM IS NULL AND CT_NM IS NULL ";
        else if (req.body.addCond == "SHOW_FINISH") condQuery = " AND CSCO_NM IS NOT NULL AND CT_NM IS NOT NULL ";
    }
    // LIMIT
    var limitQuery = "";
    if (!commonUtil.isNull(req.body.startNum) || !commonUtil.isNull(req.body.moreNum)) limitQuery = " LIMIT " + req.body.startNum + "," + req.body.moreNum;
    var listQuery = selectBatchLearningDataListQuery + condQuery + limitQuery;
    commonDB.reqQuery(listQuery, callbackBatchLearningDataList, req, res);
};
// [CALLBACK] 배치학습데이터리스트 조회
var callbackBatchLearningDataList = function (rows, req, res) {
    res.send(rows);
}
// [POST] 이미지 업로드
router.post('/imageUpload', upload.any(), function (req, res) {
    console.log("image upload??? ");
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



/***************************************************************
 * (legacy)
 * *************************************************************/
router.get('/pyTest', function (req, res) {

    const defaults = {
        encoding: 'utf8',
    };

    var arg = '"Partner of Choice"' + ' ' + '"Class of Business"' + ' ';
    var exeString = 'python ' + appRoot + '\\ml\\cnn-text-classification\\eval.py ' + arg;
    //var exeString = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\eval.py ' + arg;
    //var exeString = 'python ' + appRoot + '\\ml\\cnn-text-classification\\train.py';
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
    //var arg = '"Partner of Choice"' + ' ' + '"Class of Business"' + ' ';
    var arg = req.body.param;

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
    exec(cnnTextClassificationPath + 'eval.py ' + arg, defaults, function (err1, stdout1, stderr1) {
        if (err1) {
            console.log(err1);
            res.send({ code: '500', message: err1 });
        } else {
            var classificationResult = "";
            var text1, text2, text3 = "";
            let temp1 = stdout1.split("^");
            for (var i = 0, x = temp1.length; i < x; i++) {
                let temp2 = temp1[i].split("||");
                if (temp2[1] == "fixlabel") classificationResult += '"' + temp2[0] + '" ';
            }
            console.log("결과 : " + classificationResult);
            labelMappingFunc(classificationResult);
        }
    });
    function labelMappingFunc(classificationResult) {
        exec(labelMappingPath + 'eval.py ' + classificationResult, defaults, function (err, stdout2, stderr) {
            labelMappingResult = stdout2;
            console.log("labelMappingResult : " + labelMappingResult); // TO-DO 그리드 변경되면 그리드에 출력
            res.send(stdout2);
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

router.get('/mlEvalTest', function (req, res) {

    var dataArray = [];
    dataArray = testDataPrepare();

    typoSentenceEval(dataArray, function(result1) {

        domainDictionaryEval(result1, function (result2) {
            
            textClassificationEval(result2, function (result3) {
                console.log(result3);
                res.send("test");

            })
        })
    });
});

//오타 검사 
function typoSentenceEval(data, callback) {

    var args = dataToArgs(data);

    var exeTypoString = 'python ' + appRoot + '\\ml\\typosentence\\typo.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {
        console.log("typo Test : " + stdout);
        var typoData = stdout.split(/\r\n/g);

        var typoDataLen = typoData.length;

        while (typoDataLen--) {
            if (typoData[typoDataLen] == "") {
                typoData.splice(typoDataLen, 1);
            }
        }

        for (var i = 0; i < typoData.length; i++) {
            var typoSplit = typoData[i].split("^");
            var typoText = typoSplit[0];
            var typoOriWord = typoSplit[1];
            var typoUpdWord = typoSplit[2];

            for (var j = 0; j < data.length; j++) {
                if (data[j].text.toLowerCase() == typoText && typoOriWord.match(/:|-|[1234567890]/g) == null) {
                    var updWord = typoUpdWord.split(":");
                    data[j].text = data[j].text.toLowerCase().replace(typoOriWord, updWord[0]);
                }
            }
        }
        callback(data);
    });
    
}

//domain dictionary eval
function domainDictionaryEval(data, callback) {

    var args = dataToArgs(data);

    var exeTypoString = 'python ' + appRoot + '\\ml\\typosentence\\main.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {

        var ocrText = stdout.split(/\r\n/g);
        var ocrTextLen = ocrText.length;

        while (ocrTextLen--) {
            if (ocrText[ocrTextLen] == "") {
                ocrText.splice(ocrTextLen, 1);
            }
        }

        if (ocrTextLen != null) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].text.toLowerCase() != ocrText[i].toLowerCase()) {
                    data[i].text = ocrText[i];
                }
            }
        }       
        
        callback(data);
    });
}

//text classification eval
function textClassificationEval(data, callback) {

    var args = dataToArgs(data);

    var exeTypoString = 'python ' + appRoot + '\\ml\\cnn-text-classification\\eval.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {

        var obj = stdout.split("^");

        var label = [];

        for (var key in obj) {
            var objSplit = obj[key].split("||");

            for (var i = 0; i < data.length; i++) {
                if (data[i].text.toLowerCase() == objSplit[0].toLowerCase()) {
                    data[i].label = objSplit[1].replace(/\r\n/g,"");
                }
            }
        }

        callback(data);

    });
}

//label mapping eval
function labelMappingEval(req, callback) {
    var exeTypoString = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\eval.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {

        console.log(stdout);

        var labelMapping = stdout.split("^");

        //var jsonLabel = JSON.parse(stdout1);
        var dataArray = [];

        for (var key in labelMapping) {

            var objLabel = labelMapping[key].split("||");

            for (var i = 0; i < data.length; i++) {
                if (data[i].text.toLowerCase() == objLabel[0].toLowerCase()) {
                    data[i].column = objLabel[1];
                    var obj = {};
                    obj.text = objLabel[0];
                    obj.column = objLabel[1].replace(/\r\n/g, '');
                    dataArray.push(obj);
                }
            }
        }

        for (var i = 0; i < data.length; i++) {
            if (data[i].label == "fixvalue" || data[i].label == "entryvalue") {

                var splitLocation = data[i].location.split(",");

                var xCoodi = splitLocation[0];
                var yCoodi = splitLocation[1];
                var minDis = 100000;
                var columnText = '';

                for (var j = 0; j < data.length; j++) {
                    if (data[j].label == "fixlabel" || data[j].label == "entryrowlabel") {
                        var jSplitLocation = data[j].location.split(",");

                        var xNum = jSplitLocation[0];
                        var yNum = jSplitLocation[1];

                        var diffX = xCoodi - xNum;
                        var diffY = yCoodi - yNum;

                        var dis = Math.sqrt(Math.abs(diffX * diffX) + Math.abs(diffY * diffY));

                        if (minDis > dis) {
                            minDis = dis;
                            columnText = data[j].column.replace(/\r\n/g, '');
                        }
                    }
                }
                data[i].column = columnText + "_VALUE";

                //dataText += ',"' + data[i].text + '":"' + data[i].column + '"'; 

                var obj = {};
                obj.text = data[i].text;
                obj.column = data[i].column;

                console.log(obj);

                dataArray.push(obj);

            }
        }

        callback(data);

    });
}

function dataToArgs(data) {

    var args = '';
    for (var i = 0; i < data.length; i++) {
        //data[i].text = data[i].text.replace(": ", "");
        args += '"' + data[i].text.toLowerCase() + '"' + ' ';

    }

    return args;
}

function testDataPrepare() {
    var array = [];

    var obj = {};
    obj.location = "1018,240,411,87";
    obj.text = "APEX";

    array.push(obj);

    var obj = {};
    obj.location = "1019,338,409,23";
    obj.text = "Partner of Choice";

    array.push(obj);

    var obj = {};
    obj.location = "1562,509,178,25";
    obj.text = "Voucher No";

    array.push(obj);

    var obj = {};
    obj.location = "206,848,111,24";
    obj.text = "Cedant";

    array.push(obj);

    var obj = {};
    obj.location = "206,908,285,24";
    obj.text = "Class of Business";

    array.push(obj);

    var obj = {};
    obj.location = "574,847,492,32";
    obj.text = ": Solidarity- First Insurance 2018";

    array.push(obj);

    var obj = {};
    obj.location = "574,907,568,32";
    obj.text = ": Marine Cargo Surplus 2018 - Inward";

    array.push(obj);

    return array;
}

function typoSentenceTrain() {

}

function domainDictionaryTrain() {

}

function textClassificationTrain() {

}

function labelMappingTrain() {

}


module.exports = router;
