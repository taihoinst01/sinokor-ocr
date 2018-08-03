'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var router = express.Router();
var queryConfig = require(appRoot + '/config/queryConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var logger = require('../util/logger');
var oracledb = require('oracledb');
var dbConfig = require('../../config/dbConfig.js');
var aimain = require('../util/aiMain');

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



/****************************************************************************************
 * ROUTER
 ****************************************************************************************/
router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});
// invoiceRegistration.html 보여주기
router.get('/', function (req, res) {
    console.log("check");
    if (req.isAuthenticated()) res.render('user/invoiceRegistration', { currentUser: req.user });
    else res.redirect("/logout");
});

// invoiceRegistration.html 보여주기
router.post('/', function (req, res) {
    if (req.isAuthenticated()) res.render('user/invoiceRegistration', { currentUser: req.user });
    else res.redirect("/logout");
});

/****************************************************************************************
 * FILE UPLOAD
 ****************************************************************************************/
router.post('/uploadFile', upload.any(), function (req, res) {
    var files = req.files;
    var endCount = 0;
    var fileInfo = [];
    var fileDtlInfo = [];
    var returnObj = [];
    var convertType = '';
    var userId = req.session.userId;

    for (var i = 0; i < files.length; i++) {
        var imgId = Math.random().toString(36).slice(2); // TODO : 임시로 imgId 생성 - 규칙 생기면 변경 필요

        if (files[i].originalname.split('.')[1] === 'TIF' || files[i].originalname.split('.')[1] === 'tif' ||
            files[i].originalname.split('.')[1] === 'TIFF' || files[i].originalname.split('.')[1] === 'tiff') {
            var ifile = appRoot + '\\' + files[i].path;
            var ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.jpg';

            // 파일 정보 추출
            var fileObj = files[i];                             // 파일
            var filePath = fileObj.path;                        // 파일 경로
            var oriFileName = fileObj.originalname;             // 파일 원본명
            var _lastDot = oriFileName.lastIndexOf('.');
            var fileExt = oriFileName.substring(_lastDot + 1, oriFileName.length).toLowerCase();        // 파일 확장자
            var fileSize = fileObj.size;                        // 파일 크기
            var contentType = fileObj.mimetype;                 // 컨텐트타입
            var svrFileName = Math.random().toString(26).slice(2);  // 서버에 저장될 랜덤 파일명

            var fileParam = {
                imgId: imgId,
                filePath: filePath,
                oriFileName: oriFileName,
                convertFileName: '',
                svrFileName: svrFileName,
                fileExt: fileExt,
                fileSize: fileSize,
                contentType: contentType,
                regId: userId
            };
            fileInfo.push(fileParam);

            var fileDtlArr = []; 

            execSync('module\\imageMagick\\convert.exe -quiet -density 800x800 ' + ifile + ' ' + ofile);
            if (endCount === files.length - 1) { // 모든 파일 변환이 완료되면
                var j = 0;
                var isStop = false;
                while (!isStop) {
                    try { // 하나의 파일 안의 여러 페이지면
                        var convertFilePath = appRoot + '\\' + files[i].path.split('.')[0] + '-' + j + '.jpg';
                        var convertFileName = files[i].path.split('.')[0] + '-' + j + '.jpg';
                        var _lastDotDtl = convertFileName.lastIndexOf('.');
                        var stat = fs.statSync(convertFilePath);
                        if (stat) {
                            var fileDtlParam = {
                                imgId: imgId,
                                filePath: convertFilePath,
                                oriFileName: convertFileName,
                                convertFileName: '',
                                svrFileName: Math.random().toString(26).slice(2),
                                fileExt: convertFileName.substring(_lastDot + 1, convertFileName.length).toLowerCase(), 
                                fileSize: stat.size,
                                contentType: 'image/jpeg',
                                regId: userId
                            };  
                            returnObj.push(files[i].originalname.split('.')[0] + '-' + j + '.jpg');
                            fileDtlArr.push(fileDtlParam);
                        } else {
                            isStop = true;
                            break;
                        }
                    } catch (err) { // 하나의 파일 안의 한 페이지면
                        try {
                            var convertFilePath = appRoot + '\\' + files[i].path.split('.')[0] + '.jpg';
                            var convertFileName = files[i].path.split('.')[0] + '.jpg';
                            var _lastDotDtl = convertFileName.lastIndexOf('.');
                            var stat2 = fs.statSync(convertFilePath);
                            if (stat2) {
                                var fileDtlParam = {
                                    imgId: imgId,
                                    filePath: convertFilePath,
                                    oriFileName: convertFileName,
                                    convertFileName: '',
                                    svrFileName: Math.random().toString(26).slice(2),
                                    fileExt: convertFileName.substring(_lastDot + 1, convertFileName.length).toLowerCase(),
                                    fileSize: stat2.size,
                                    contentType: 'image/jpeg',
                                    regId: userId
                                };  
                                returnObj.push(files[i].originalname.split('.')[0] + '.jpg');
                                fileDtlArr.push(fileDtlParam);
                                break;
                            }
                        } catch (e) {
                            break;
                        }
                    }
                    j++;
                }
            }
            endCount++;
        }
    }
    commonDB.insertFileInfo(fileInfo, "ocr_file"); // 파일 정보 DB INSERT
    commonDB.insertFileInfo(fileDtlArr, "ocr_file_dtl"); // 세부 파일 정보 DB INSERT

    res.send({ code: 200, message: returnObj });
});

/****************************************************************************************
 * ML
 ****************************************************************************************/
// typoSentence ML
router.post('/typoSentence', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;
    process.on('uncaughtException', function (err) {
        console.log('uncaughtException : ' + err);
    });
    try {
        aimain.typoSentenceEval(data, function (result) {
            res.send({ 'fileName': fileName, 'data': result, nextType: 'dd' });
        });
    }
    catch (exception) {
        console.log(exception);
    }
});

// domainDictionary ML
router.post('/domainDictionary', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;
    process.on('uncaughtException', function (err) {
        console.log('uncaughtException : ' + err);
    });
    try {
        aimain.domainDictionaryEval(data, function (result) {
            res.send({ 'fileName': fileName, 'data': result, nextType: 'tc' });
        });
    } catch (exception) {
        console.log(exception);
    }


});

// textClassification ML
router.post('/textClassification', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;
    process.on('uncaughtException', function (err) {
        console.log('uncaughtException : ' + err);
    });
    try {
        aimain.textClassificationEval(data, function (result) {
            res.send({ 'fileName': fileName, 'data': result, nextType: 'lm' });
        });
    } catch (exception) {
        console.log(exception);
    }
});

// labelMapping ML
router.post('/labelMapping', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;
    process.on('uncaughtException', function (err) {
        console.log('uncaughtException : ' + err);
    });
    try {
        aimain.labelMappingEval(data, function (result) {
            res.send({ 'fileName': fileName, 'data': result, nextType: 'sc' });
        });
    } catch (exception) {
        console.log(exception);
    }
});

// DB Columns select
router.post('/searchDBColumns', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;

    commonDB.reqQuery(selectColumn, function (rows, req, res) {
        res.send({ 'fileName': fileName, 'data': data, 'column': rows });
    }, req, res);
});

// uiTrain
router.post('/uiTrain', function (req, res) {
    var data = req.body.data;

    runTrain(data, function (result) {
        if (result == "true") {
            //text-classification train
            var exeTextString = 'python ' + appRoot + '\\ml\\cnn-text-classification\\train.py'
            exec(exeTextString, defaults, function (err, stdout, stderr) {
                //label-mapping train
                var exeLabelString = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\train.py'
                exec(exeLabelString, defaults, function (err1, stdout1, stderr1) {
                    res.send("ui 학습 완료");
                });
            });
        }
    });

});

async function runTrain(data, callback) {
    try {
        let res = await textLabelTrain(data);
        callback(res);
    } catch (err) {
        console.error(err);
    }
}

function textLabelTrain(data) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            conn = await oracledb.getConnection(dbConfig);
            for (var i = 0; i < data.length; i++) {
                if (data[i].originText != null) {
                    //console.log(data[i].originText);
                    var originSplit = data[i].originText.split(" ");
                    var textSplit = data[i].text.split(" ");
                    var textleng = Math.abs(data[i].originText.length - data[i].text.length);

                    if (textleng < 4) {
                        //typo train
                        for (var ty = 0; ty < textSplit.length; ty++) {
                            if (originSplit[ty] != textSplit[ty]) {
                                var selTypoCond = [];
                                selTypoCond.push(textSplit[ty].toLowerCase());
                                let selTypoRes = await conn.execute(selectTypo, selTypoCond);

                                if (selTypoRes.rows[0] == null) {
                                    //insert
                                    let insTypoRes = await conn.execute(insertTypo, selTypoCond);
                                } else {
                                    //update
                                    var updTypoCond = [];
                                    updTypoCond.push(selTypoRes.rows[0].KEYWORD);
                                    let updTypoRes = await conn.execute(updateTypo, updTypoCond);
                                }
                            }
                        }
                    } else {
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
                                    let insDomainDicRes = await conn.execute(insertDomainDic, insDicCond);
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
                                    let insDomainDicRes = await conn.execute(insertDomainDic, insDicCond);
                                } else {
                                    os++;
                                    osNext = os;
                                    break;
                                }
                            }

                        }
                    }
                }
            }
            for (var i in data) {
                var selectLabelCond = [];
                selectLabelCond.push(data[i].column);

                let result = await conn.execute(selectLabel, selectLabelCond);

                if (result.rows[0] == null) {
                    data[i].textClassi = 'undefined';
                } else {
                    data[i].textClassi = result.rows[0].LABEL;
                    data[i].labelMapping = result.rows[0].ENKEYWORD;
                }

                var insTextClassifiCond = [];
                insTextClassifiCond.push(data[i].text);
                insTextClassifiCond.push(data[i].textClassi);

                let insResult = await conn.execute(insertTextClassification, insTextClassifiCond);
            }
            for (var i in data) {
                if (data[i].textClassi == "fixlabel" || data[i].textClassi == "entryrowlabel") {
                    var insLabelMapCond = [];
                    insLabelMapCond.push(data[i].text);
                    insLabelMapCond.push(data[i].labelMapping);

                    let insLabelMapRes = await conn.execute(insertLabelMapping, insLabelMapCond);

                    //console.log(insLabelMapRes);
                }
            }
            resolve("true");
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
}


module.exports = router;