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
const FileHound = require('filehound');
//var uuid = require('uuid');

var selectBatchLearningDataListQuery = queryConfig.batchLearningConfig.selectBatchLearningDataList;
var insertTextClassification = queryConfig.uiLearningConfig.insertTextClassification;
var insertLabelMapping = queryConfig.uiLearningConfig.insertLabelMapping;
var selectLabel = queryConfig.uiLearningConfig.selectLabel;
var insertTypo = queryConfig.uiLearningConfig.insertTypo;
var insertDomainDic = queryConfig.uiLearningConfig.insertDomainDic;
var selectTypo = queryConfig.uiLearningConfig.selectTypo;
var updateTypo = queryConfig.uiLearningConfig.updateTypo;

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
var callbackBatchLearningDataList = function (rows, req, res) {
    res.send(rows);
}
var fnSearchBatchLearningDataList = function (req, res) {
    // 조건절
    var condQuery = "";
    var orderQuery = " ORDER BY A.REG_DATE DESC ";
    if (!commonUtil.isNull(req.body.addCond)) {
        if (req.body.addCond == "LEARN_N") condQuery = " AND A.STATUS != 'Y' ";
        else if (req.body.addCond == "LEARN_Y") condQuery = " AND A.STATUS = 'Y' ";
    }
    // LIMIT
    var limitQuery = "";
    if (!commonUtil.isNull(req.body.startNum) || !commonUtil.isNull(req.body.moreNum)) limitQuery = " LIMIT " + req.body.startNum + "," + req.body.moreNum;
    var listQuery = selectBatchLearningDataListQuery + condQuery + orderQuery + limitQuery;

    console.log("listQuery : " + listQuery);
    commonDB.reqQuery(listQuery, callbackBatchLearningDataList, req, res);
};


// [POST] 이미지 업로드
router.post('/imageUpload', upload.any(), function (req, res) {
    var files = req.files;
    var endCount = 0;
    var returnObj = [];
    var fileInfo = [];
    for (var i = 0; i < files.length; i++) {
        if (files[i].originalname.split('.')[1] === 'TIF' || files[i].originalname.split('.')[1] === 'tif' ||
            files[i].originalname.split('.')[1] === 'TIFF' || files[i].originalname.split('.')[1] === 'tiff') {
            var ifile = appRoot + '\\' + files[i].path;
            var ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.jpg';
            // 파일 정보 추출
            var imgId = Math.random().toString(36).slice(2); // TODO : 임시로 imgId 생성
            console.log("생성한 imgId와 길이 : " + imgId + " : " + imgId.length);
            var fileObj = files[i]; // 파일
            var filePath = fileObj.path;    // 파일 경로
            var oriFileName = fileObj.originalname; // 파일 원본명
            var _lastDot = oriFileName.lastIndexOf('.');    
            var fileExt = oriFileName.substring(_lastDot+1, oriFileName.length).toLowerCase();        // 파일 확장자
            var fileSize = fileObj.size;  // 파일 크기
            var contentType = fileObj.mimetype; // 컨텐트타입
            var svrFileName = Math.random().toString(26).slice(2);  // 서버에 저장될 랜덤 파일명

            var fileParam = {
                imgId: imgId,
                filePath: filePath,
                oriFileName: oriFileName,
                convertFileName: oriFileName.split('.')[0] + '.jpg',
                fileExt: fileExt,
                fileSize: fileSize,
                contentType: contentType,
                svrFileName: svrFileName
            };
            fileInfo.push(fileParam);
            returnObj.push(oriFileName.split('.')[0] + '.jpg');
            
            exec('module\\imageMagick\\convert.exe -density 800x800 ' + ifile + ' ' + ofile, function (err, out, code) {
                if (endCount === files.length - 1) { // 모든 파일 변환이 완료되면
                    res.send({ code: 200, message: returnObj, fileInfo: fileInfo });
                }
                endCount++;
            });
        }
    }
});

// [POST] INSERT fileInfo (파일정보)
var callbackInsertFileInfo = function (rows, req, res) {
    console.log("upload fileInfo finish..");
    res.send({ code: 200, rows: rows });
}
router.post('/insertFileInfo', function (req, res) {
    console.log("insert FILE INFO : " + JSON.stringify(req.body.fileInfo));
    var fileInfo = req.body.fileInfo;

    var imgId = fileInfo.imgId;
    var filePath = fileInfo.filePath;
    var oriFileName = fileInfo.oriFileName;
    var svrFileName = fileInfo.svrFileName;
    var convertFileName = fileInfo.convertFileName;
    var fileExt = fileInfo.fileExt;
    var fileSize = fileInfo.fileSize;
    var contentType = fileInfo.contentType;
    var regId = req.session.userId;

    var data = [imgId, filePath, oriFileName, svrFileName, fileExt, fileSize, contentType, 'B', regId];
    console.log("입력 데이터 : " + JSON.stringify(data));
    commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertFileInfo, data, callbackInsertFileInfo, req, res);
});

// [POST] INSERT batchLearningBaseData (기본정보)
var callbackInsertBatchLearningBaseData = function (rows, req, res) {
    console.log("upload batchLearningBaseData finish..");
    res.send({ code: 200, rows: rows });
}
router.post('/insertBatchLearningBaseData', function (req, res) {
    console.log("insert BATCH LEARNING BASE DATA : " + JSON.stringify(req.body.fileInfo));
    var fileInfo = req.body.fileInfo;
    var imgId = fileInfo.imgId;
    var regId = req.session.userId;
    var data = [imgId, regId];
    console.log("입력 데이터 : " + JSON.stringify(data));
    commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertBatchLearningBaseData, data, callbackInsertBatchLearningBaseData, req, res);
});



// RUN batchLearningData
router.post('/execBatchLearningData', function (req, res) {
    var arg = req.body.data;
    typoSentenceEval(arg, function (result1) {
        domainDictionaryEval(result1, function (result2) {
            textClassificationEval(result2, function (result3) {
                labelMappingEval(result3, function (result4) {
                    console.log("labelMapping Result : " + JSON.stringify(result4));
                    res.send(result4);
                })
            })
        })
    });
});

// [POST] insert batchLearningBaseData (tbl_batch_learning_data 기초정보)
var callbackInsertBatchLearningBaseData = function (rows, req, res) {
    console.log("upload batchLearningBaseData finish..");
    res.send({ code: 200, rows: rows });
};
router.post('/insertBatchLearningBaseData', function (req, res) {
    var dataObj = req.body.dataObj;
    console.log("insert dataObj " + JSON.stringify(dataObj));
    var imgId = dataObj.imgId; 
    var oriFileName = dataObj.oriFileName; 
    var regId = req.session.userId;

    var data = [imgId, imgFileStNo, imgFileEndNo, cscoNm, ctNm, insStDt, insEndDt, curCd, pre, com, brkg, txam, prrsCf, prrsRls, lsresCf, lsresRls, cla, exex, svf, cas, ntbl, cscoSaRfrnCnnt2, regId];
    commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertBatchLearningData, data, callbackInsertBatchLearningData, req, res);

});

// [POST] insert batchLearningData (tbl_batch_learning_data 전체정보)
var callbackInsertBatchLearningData = function (rows, req, res) {
    console.log("upload batchLearningData finish..");
    res.send({ code: 200, rows: rows });
};
router.post('/insertBatchLearningData', function (req, res) {
    var dataObj = req.body.dataObj;
    console.log("insert dataObj " + JSON.stringify(dataObj));
    var imgId = dataObj.imgId; // 필수값
    var imgFileStNo = commonUtil.nvl(dataObj.IMG_FILE_ST_NO);
    var imgFileEndNo = commonUtil.nvl(dataObj.IMG_FILE_END_NO);
    var cscoNm = commonUtil.nvl(dataObj.CSCO_NM);
    var ctNm = commonUtil.nvl(dataObj.CT_NM);
    var insStDt = commonUtil.nvl(dataObj.INS_ST_DT);
    var insEndDt = commonUtil.nvl(dataObj.INS_END_DT);
    var curCd = commonUtil.nvl(dataObj.CUR_CD);
    var pre = commonUtil.nvl2(dataObj.PRE, '0');
    var com = commonUtil.nvl2(dataObj.COM, '0');
    var brkg = commonUtil.nvl2(dataObj.BRKG, '0');
    var txam = commonUtil.nvl2(dataObj.TXAM, '0');
    var prrsCf = commonUtil.nvl2(dataObj.PRRS_CF, '0');
    var prrsRls = commonUtil.nvl2(dataObj.PRRS_RLS, '0');
    var lsresCf = commonUtil.nvl2(dataObj.LSRES_CF, '0');
    var lsresRls = commonUtil.nvl2(dataObj.LSRES_RLS, '0');
    var cla = commonUtil.nvl2(dataObj.CLA, '0');
    var exex = commonUtil.nvl2(dataObj.EXEX, '0');
    var svf = commonUtil.nvl2(dataObj.SVF, '0');
    var cas = commonUtil.nvl2(dataObj.CAS, '0');
    var ntbl = commonUtil.nvl2(dataObj.NTBL, '0');
    var cscoSaRfrnCnnt2 = commonUtil.nvl(dataObj.CSCO_SA_RFRN_CNNT2);
    var regId = req.session.userId;
    
    var data = [imgId, imgFileStNo, imgFileEndNo, cscoNm, ctNm, insStDt, insEndDt, curCd, pre, com, brkg, txam, prrsCf, prrsRls, lsresCf, lsresRls, cla, exex, svf, cas, ntbl, cscoSaRfrnCnnt2, regId];
    commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertBatchLearningData, data, callbackInsertBatchLearningData, req, res);
    
});

// [POST] syncFile
router.post('/syncFile', function (req, res) {
    const testFolder = 'C:\\workspace\\sinokor-ocr\\uploads\\';

    const files = FileHound.create()
        .paths(testFolder)
        .ext('jpg', 'tif')
        .find();

    var resText = [];

    files.then(function (result) {
        console.log("result 길이 : " + result.length);
        var endCount = 0;
        var returnObj = [];
        var fileInfo = [];
        for (var i = 0; i < result.length; i++) {
            
            var data = fs.readFileSync(result[i], 'utf-8');
            console.log("result[i] file name : " + result[i]);
            console.log("file length : " + data.length);
            //console.log("data path : " + data.originalname);
            //var ifile = appRoot + '\\' + data.path;
            //var ofile = appRoot + '\\' + data.path.split('.')[0] + '.jpg';
            // 파일 정보 추출
                
            var imgId = Math.random().toString(36).slice(2); // TODO : 임시로 imgId 생성
            console.log("생성한 imgId와 길이 : " + imgId + " : " + imgId.length);
            var fileObj = data; // 파일
            var filePath = fileObj.path;    // 파일 경로
            var oriFileName = fileObj.originalname; // 파일 원본명
            console.log("filePath : " + filePath);
            console.log("oriFileName : " + oriFileName);
            var _lastDot = oriFileName.lastIndexOf('.');
            var fileExt = oriFileName.substring(_lastDot + 1, oriFileName.length).toLowerCase();        // 파일 확장자
            var fileSize = fileObj.size;  // 파일 크기
            var contentType = fileObj.mimetype; // 컨텐트타입
            var svrFileName = Math.random().toString(26).slice(2);  // 서버에 저장될 랜덤 파일명

            var fileParam = {
                imgId: imgId,
                filePath: filePath,
                oriFileName: oriFileName,
                convertFileName: oriFileName.split('.')[0] + '.jpg',
                fileExt: fileExt,
                fileSize: fileSize,
                contentType: contentType,
                svrFileName: svrFileName
            };

            console.log("fileParam : " + JSON.stringify(fileParam));
            fileInfo.push(fileParam);
            returnObj.push(oriFileName.split('.')[0] + '.jpg');
            if (fileObj.originalname.split('.')[1].toLowerCase() === 'tif' || fileObj.originalname.split('.')[1].toLowerCase() === 'tiff') {
                exec('module\\imageMagick\\convert.exe -density 800x800 ' + ifile + ' ' + ofile, function (err, out, code) {
                    if (endCount === files.length - 1) { // 모든 파일 변환이 완료되면
                        res.send({ code: 200, message: returnObj, fileInfo: fileInfo });
                    }
                    endCount++;
                });
            }
        } 
    });

    //files.then(function (result) {
    //    console.log("result : " + JSON.stringify(result));
    //    for (var i = 0; i < result.length; i++) {
    //        var splitText = result[i].split("uploads\\");
    //        var obj = {};
    //        obj.IMG_ID = splitText[1];
    //        obj.FILE_NAME = result[i];
    //        resText.push(obj);
    //    }
    //});

    files.done(function () {
        //res.render('user/batchLearning', { rows: resText, currentUser: req.user });
        //res.send({ code: 200, rows: resText, currentUser: req.user });
    });
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
                
                labelMappingEval(result3, function (result4) {
                    console.log(result4);
                    res.send("test");
                })
            })
        })
    });
});

router.get('/fileTest', function (req, res) {
    const testFolder = 'E:\\projectworks\\koreanre\\sinokor-ocr\\uploads\\';

    const files = FileHound.create()
        .paths(testFolder)
        .ext('jpg','tif')
        .find();

    files.then(function (res) {
        console.log(res);
    });

    res.send("test");
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
function labelMappingEval(data, callback) {

    var labelData = [];

    for (var num in data) {
        if (data[num].label == "fixlabel" || data[num].label == "entryrowlabel") {
            labelData.push(data[num]);
        }
    }

    var args = dataToArgs(labelData);

    var exeTypoString = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\eval.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {

        var labelMapping = stdout.split("^");

        var dataArray = [];

        for (var key in labelMapping) {

            var objLabel = labelMapping[key].split("||");

            for (var i = 0; i < data.length; i++) {
                if (data[i].text.toLowerCase() == objLabel[0].toLowerCase()) {
                    data[i].column = objLabel[1].replace(/\r\n/g, '');
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

                        //점 최소 거리
                        //var dis = Math.sqrt(Math.abs(diffX * diffX) + Math.abs(diffY * diffY));

                        //y좌표 최소 거리
                        var dis = Math.abs(yCoodi - yNum);

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

                //console.log(obj);

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
    obj.label = "undefined";

    array.push(obj);

    var obj = {};
    obj.location = "1019,338,409,23";
    obj.text = "Partner of Choice";
    obj.label = "undefined";

    array.push(obj);

    var obj = {};
    obj.location = "1562,509,178,25";
    obj.text = "Voucher No";
    obj.label = "undefined";

    array.push(obj);

    var obj = {};
    obj.location = "206,848,111,24";
    obj.text = "Cedant";
    obj.label = "fixlabel";
    obj.column = "거래사명";

    array.push(obj);

    var obj = {};
    obj.location = "206,908,285,24";
    obj.text = "Class of Business";
    obj.label = "fixlabel";
    obj.column = "계약명";

    array.push(obj);

    var obj = {};
    obj.location = "574,847,492,32";
    obj.text = ": Solidarity- First Insurance 2018";
    obj.label = "fixvalue";
    obj.column = "거래사명 값";

    array.push(obj);

    var obj = {};
    obj.location = "574,907,568,32";
    obj.text = ": Marine Cargo Surplus 2018 - Inward";
    obj.label = "fixvalue";
    obj.column = "계약명 값";

    array.push(obj);

    return array;
}

//---------------------------- train test 영역 --------------------------------------------//

//http://localhost:3000/batchLearning/trainTest
router.get('/trainTest', function (req, res) {
    var data = trainPrepare();
    var inputData = inputPrepare();

    //typoSentenceTrain(data);
    domainDictionaryTrain(": Marine Cargo Surplus 2018 - Inward", "Cargo Q/S & S/P Inward");
    
    res.send("test");
});

function trainPrepare() { // jhy용 test
    var array = [];

    var obj = {};
    obj.location = "1019,338,409,23";
    obj.text = ": Marine Cargo Surplus 2018 - Inward 1 2";

    array.push(obj);

    return array;
}
function inputPrepare() { // jhy용 test
    var array = [];

    var obj = {};
    obj.location = "1019,338,409,23";
    obj.text = "Cargo Q/S & S/P Inward adfe";

    array.push(obj);

    return array;
}

/**
 * 
 * @param {any} data -> ml 완료한 데이터
 * @return boolean -> true : 정상 완료 , false : error
 */
function typoSentenceTrain(data) {
    var wordCount = 0; // 단어 총 개수
    var trainCount = 0; // train한 횟수
    var query = queryConfig.batchLearningConfig.selectIsExistWordToSymspell;

    for (var i in data) {
        var line = data[i].text.split(' ');
        wordCount += line.length;
        for (var j in line) {
            try {
                commonDB.queryParam(query, [line[j].toLowerCase()], function (rows, origin) {
                    if (rows.length > 0) { // 단어가 테이블에 존재하면
                        query = queryConfig.batchLearningConfig.updataSymsepll;
                    } else { // 단어가 테이블에 존재하지 않으면
                        query = queryConfig.batchLearningConfig.insertSymspell;
                    }
                    commonDB.queryNoRows(query, [origin], function () {
                        trainCount++;
                        if (trainCount == queryCount) { // train 완료되면
                            return true;
                        }
                    });
                }, line[j].toLowerCase());
            } catch (e) {
                console.log(e);
                return false;
            }
        }
    }
}


function domainDictionaryTrain(mlData, inputData) {
    var originSplit = mlData.split(" ");
    var textSplit = inputData.split(" ");

    //domain dictionary train
    var os = 0;
    var osNext = 0;
    var updText = "";
    for (var j = 1; j < textSplit.length; j++) {
        updText += textSplit[j] + ' ';
    }
    updText.slice(0, -1);

    var domainText = [];
    domainText.push(textSplit[0]);
    domainText.push(updText);

    for (var ts = 0; ts < domainText.length; ts++) {

        for (os; os < originSplit.length; os++) {
            if (ts == 1) {
                var insDicCond = [];

                //originword
                insDicCond.push(originSplit[os]);

                //frontword
                if (os == 0) {
                    insDicCond.push("<<N>>");
                } else {
                    insDicCond.push(originSplit[os - 1]);
                }

                //correctedword
                if (osNext == os) {
                    insDicCond.push(domainText[ts]);
                } else {
                    insDicCond.push("<<N>>");
                }

                //rearword
                if (os == originSplit.length - 1) {
                    insDicCond.push("<<N>>");
                } else {
                    insDicCond.push(originSplit[os + 1]);
                }

                //const insDomainDicRes = connection.query(insertDomainDic, insDicCond);
                commonDB.queryNoRows(insertDomainDic, insDicCond, function () {});

            } else if (domainText[ts].toLowerCase() != originSplit[os].toLowerCase()) {
                var insDicCond = [];

                //originword
                insDicCond.push(originSplit[os]);

                //frontword
                if (os == 0) {
                    insDicCond.push("<<N>>");
                } else {
                    insDicCond.push(originSplit[os - 1]);
                }

                //correctedword
                insDicCond.push("<<N>>");

                //rearword
                if (os == originSplit.length - 1) {
                    insDicCond.push("<<N>>");
                } else {
                    insDicCond.push(originSplit[os + 1]);
                }

                //const insDomainDicRes = connection.query(insertDomainDic, insDicCond);
                commonDB.queryNoRows(insertDomainDic, insDicCond, function () { });

            } else {
                os++;
                osNext = os;
                break;
            }
        }

    }
}

/*
function domainDictionaryTrain(mlData, inputData) {
    var param = [];
    var count = [];
    for (var i in mlData) {
        for (var j in inputData) {
            if (mlData[i].location == inputData[j].location) { // 같은 라인의 문장이면
                var mlDataWords = mlData[i].text.toLowerCase().split(' ');
                var inputDataWords = inputData[j].text.toLowerCase().split(' ');
                var indexOfCnt = 0;               
                for (var k in mlDataWords) {
                    if (inputData[j].text.toLowerCase().indexOf(mlDataWords[k], indexOfCnt) == -1) {
                        if (k == 0) {
                            param.push([mlDataWords[k], '<<N>>', '<<N>>', mlDataWords[Number(k) + 1]]);
                        } else if (k == mlDataWords.length - 1) {
                            param.push([mlDataWords[k], mlDataWords[Number(k) - 1], '<<N>>', '<<N>>']);
                        } else {
                            param.push([mlDataWords[k], mlDataWords[Number(k) - 1], '<<N>>', mlDataWords[Number(k) + 1]]);
                        }                        
                    } else {
                        indexOfCnt = inputData[j].text.toLowerCase().indexOf(mlDataWords[k], indexOfCnt) + mlDataWords[k].length;  
                        param.push([mlDataWords[k], inputData[j].text.toLowerCase().substring(indexOfCnt)]);
                    }       
                    count.push(indexOfCnt);
                }
                console.log(param);
                console.log(count);
                var overlapCount = [];
                for (var k in param) {               
                    
                }
                //console.log(param);
                break;
            }
        }
    }
}
*/

router.get("/textTrainTest", function (req, res) {
    var dataArray = [];
    dataArray = testDataPrepare();

    textClassificationTrain(dataArray, req, res);
});


function textClassificationTrain(data, req, res) {
    //text-classification DB insert
    for (var i in data) {
        var selectLabelCond = [];
        selectLabelCond.push(data[i].column);
        commonDB.queryParam(selectLabel, selectLabelCond, callbackSelectLabel, data[i]);
    }

    /*
    var exeTextString = 'python ' + appRoot + '\\ml\\cnn-text-classification\\train.py'
    exec(exeTextString, defaults, function (err, stdout, stderr) {
        console.log("textTrain");
    });
    */
}

function callbackSelectLabel(rows, data) {
    if (rows.length == 0) {
        data.textClassi = 'undefined';
    } else {
        data.textClassi = rows[0].LABEL;
        data.labelMapping = rows[0].ENKEYWORD;
    }

    var insTextClassifiCond = [];
    insTextClassifiCond.push(data.text);
    insTextClassifiCond.push(data.textClassi);

    commonDB.queryParam(insertTextClassification, insTextClassifiCond, function () { }, data);
}

function labelMappingTrain(data, req, res) {
    //label-mapping DB insert
    for (var i in data) {
        if (data[i].textClassi == "fixlabel" || data[i].textClassi == "entryrowlabel") {
            var insLabelMapCond = [];
            insLabelMapCond.push(data[i].text);
            insLabelMapCond.push(data[i].labelMapping);

            commonDB.queryParam(insertLabelMapping, insLabelMapCond, callbackInsLabelMap, data[i]);
        }
    }

    //label-mapping train
    /*
    var exeLabelString = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\train.py'
    exec(exeLabelString, defaults, function (err1, stdout1, stderr1) {
        console.log("labelTrain");
    });
    */
}

function callbackInsLabelMap(rows, data) {

}

//---------------------------- // train test 영역 --------------------------------------------//

module.exports = router;
