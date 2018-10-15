'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var execSync = require('child_process').execSync;
var exec = require('child_process').exec;
var request = require('sync-request');
var oracledb = require('oracledb');
var dbConfig = require('../../config/dbConfig.js');
var logger = require('../util/logger');
var sync = require('../util/sync.js');
var oracle = require('../util/oracle.js');
var pythonConfig = require(appRoot + '/config/pythonConfig');
var PythonShell = require('python-shell');
var ui = require('../util/ui.js');
var transPantternVar = require('./transPattern');
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
var commonDB = require(appRoot + '/public/js/common.db.js');
var commModule = require(appRoot + '/public/js/import.js');
var commonUtil = commModule.commonUtil;
var router = commModule.router;
var queryConfig = commModule.queryConfig;
const defaults = {
    encoding: 'utf8',
};
var aimain = require('../util/aiMain');
var router = express.Router();

var insertTextClassification = queryConfig.uiLearningConfig.insertTextClassification;
var insertLabelMapping = queryConfig.uiLearningConfig.insertLabelMapping;
var selectLabel = queryConfig.uiLearningConfig.selectLabel;
var insertTypo = queryConfig.uiLearningConfig.insertTypo;
var insertDomainDic = queryConfig.uiLearningConfig.insertDomainDic;
var selectTypo = queryConfig.uiLearningConfig.selectTypo;
var updateTypo = queryConfig.uiLearningConfig.updateTypo;
var selectColumn = queryConfig.uiLearningConfig.selectColumn;

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// uiLearning.html 보여주기 (get)
router.get('/', function (req, res) {
    if (req.isAuthenticated()) res.render('user/uiLearning', { currentUser: req.user });
    else res.redirect("/logout");
});

// userDashbaord.html 보여주기 (post)
router.post('/', function (req, res) {
    if (req.isAuthenticated()) res.render('user/uiLearning', { currentUser: req.user });
    else res.redirect("/logout");
});

router.post('/uiLearnTraining', function (req, res) {
    var ocrData = req.body.ocrData;
    var filePath = req.body.filePath;
    var fileName = req.body.fileName;
    var fileExt = filePath.split(".")[1];
    var returnObj;
    sync.fiber(function () {
        try {
            pythonConfig.columnMappingOptions.args = [];
            pythonConfig.columnMappingOptions.args.push(JSON.stringify(ocrData));
            var resPyStr = sync.await(PythonShell.run('uiClassify.py', pythonConfig.columnMappingOptions, sync.defer()));
            var resPyArr = JSON.parse(resPyStr[0]);

            resPyArr = sync.await(transPantternVar.trans(resPyArr, sync.defer()));

            var colMappingList = sync.await(oracle.selectColumn(req, sync.defer()));
            var entryMappingList = sync.await(oracle.selectEntryMappingCls(req, sync.defer()));

            /*
            var fileName = filePath.split('/')[filePath.split('/').length - 1]

            if (fileExt.toLowerCase() == 'tif') {
                fileName = fileName.replace('.tif', '.jpg');
            } else if (fileExt.toLowerCase() == 'doc' || fileExt.toLowerCase() == 'docx'
                || fileExt.toLowerCase() == 'xls' || fileExt.toLowerCase() == 'xlsx'
                || fileExt.toLowerCase() == 'pdf') {
                fileName = fileName.replace(/.docx|.doc|.xlsx|.xls|.pdf/gi, '.png');
            }
            */

            returnObj = { code: 200, 'fileName': fileName, 'data': resPyArr, 'column': colMappingList, 'entryMappingList': entryMappingList };
        } catch (e) {
            console.log(resPyStr);
            returnObj = { 'code':500, 'message': e };

        } finally {
            res.send(returnObj);
        }

    });
});

// 문서양식매핑
router.post('/insertDoctypeMapping', function (req, res) {
    var returnObj;

    var data = {
        filepath: req.body.filepath,
        docName: req.body.docName,
        radioType: req.body.radioType,
        textList: req.body.textList
    }

    sync.fiber(function () {
        try {
            let data = req.body;
            var result = sync.await(ui.insertDoctypeMapping(data, sync.defer()));
            returnObj = { code: 200, docType: result[0], docSid: result[1] };
        } catch (e) {
            console.log(e);
            returnObj = { code: 500, message: e };
        } finally {
            res.send(returnObj);
        }
    });
});

// ui training
router.post('/uiTraining', function (req, res) {
    var beforeData = req.body.beforeData;
    var afterData = req.body.afterData;
    var docType = req.body.docType;
    var docSid = req.body.docSid;
    var fmData = [];
    var cmData = [];
    var returnObj;

    sync.fiber(function () {
        try {
            if (beforeData.docCategory.DOCTYPE != docType) {
                sync.await(oracle.insertFormMapping([docSid, docType], sync.defer()));
                fmData.push({ 'data': docSid, 'class': docType });
            }

            for (var i in afterData.data) {
                for (var j in beforeData.data) {
                    if (afterData.data[i].location == beforeData.data[j].location) {
                        //사용자가 글자를 직접 수정한 경우 TBL_CONTRACT_MAPPING에 insert
                        if (afterData.data[i].text != beforeData.data[j].text) {
                            var item = [beforeData.data[j].text, '', afterData.data[i].text, ''];
                            sync.await(oracle.insertContractMapping(item, sync.defer()));
                        }
                        //사용자가 지정한 컬럼라벨의 텍스트가 유효한 컬럼의 경우 OcrSymspell에 before text(중요!!) insert
                        if (afterData.data[i].colLbl >= 3 && afterData.data[i].colLbl <= 34) {
                            sync.await(oracle.insertOcrSymsSingle(beforeData.data[j], sync.defer()));
                        }
                        afterData.data[i].sid = sync.await(oracle.selectSid(beforeData.data[j], sync.defer()));
                        //라벨이 변경된 경우만 트레이닝 insert
                        if ((docType != 0 && docType != 1) && (afterData.data[i].colLbl == 0 || (afterData.data[i].colLbl && afterData.data[i].colLbl != 38))) {
                            var item = sync.await(oracle.insertBatchColumnMappingFromUi(afterData.data[i], docType, sync.defer()));
                            if (item) {
                                cmData.push({ 'data': item.colSid, 'class': item.colLbl });
                            }
                        }
                        break;
                    }
                }
            }            

            // Azure ml train 프록시 호출
            var azureRes = request('POST', 'http://172.16.53.143:8888/ml/train', { json: { 'fmData': fmData, 'cmData': cmData } });

            returnObj = { code: 200, message: 'ui training success' };

        } catch (e) {
            console.log(e);
            returnObj = { code: 500, error: e };
        } finally {
            res.send(returnObj);
        }
    });
});

// typoSentence ML
router.post('/typoSentence', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;
    var regId = req.session.userId;
    
    process.on('uncaughtException', function (err) {
        console.log('typo uncaughtException : ' + err);
    });
    
    try {
        
        aimain.typoSentenceEval2(data, function (typoResult) {
            console.log('execute typo ML');
            res.send({ 'fileName': fileName, 'data': typoResult, nextType: 'cm'});
            //res.send({ 'fileName': fileName, 'data': typoResult, nextType: 'fl' });
        });
        

        /*
        //08.30
        aimain.typoSentenceEval3(data, function (typoResult) {
            console.log('execute typo ML');
            res.send({ 'fileName': fileName, 'data': typoResult, nextType: 'cm'});
            //res.send({ 'fileName': fileName, 'data': typoResult, nextType: 'fl' });
        });
        */
    }
    catch (exception) {
        console.log(exception);
    }
});

function insertTypoCorrect(req, res, result) {
    var fileName = req.body.fileName;
    var data = req.body.data;
    var regId = req.session.userId;

    var arr = [];

    for (var i in data) {
        if (data[i].originText != null) {
            var correctWord = data[i].text;
            var originWord = data[i].originText;

            var correctSplit = correctWord.split(" ");
            var originSplit = originWord.split(" ");

            for (var j in correctSplit) {
                if (correctSplit[j] != originSplit[j]) {
                    var arrData = {
                        userid: regId,
                        originWord: originSplit[j],
                        correctWord: correctSplit[j],
                        fileName: fileName,
                        correctorType: "M"
                    };
                    arr.push(arrData);
                }
            }
        }
    }

    var options = {
        autoCommit: true,
        bindDefs: {
            userid: { type: oracledb.STRING, maxSize: 100 },
            originWord: { type: oracledb.STRING, maxSize: 100 },
            correctWord: { type: oracledb.STRING, maxSize: 100 },
            fileName: { type: oracledb.STRING, maxSize: 100 },
            correctorType: { type: oracledb.STRING, maxSize: 1 }
        }
    };

    commonDB.reqBatchQueryParam(queryConfig.uiLearningConfig.insertTypoCorrect, arr, options, function (rows, req, res) {
        res.send({ 'fileName': fileName, 'data': result, nextType: 'fl' });
    }, req, res);

}

router.post('/formLabelMapping', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;

    process.on('uncaughtException', function (err) {
        console.log('formLabelMapping uncaughtException : ' + err);
    });

    try {
        aimain.formLabelMapping2(data, function (formLabelResult) {
            console.log('execute formLabelMapping ML');
            res.send({ 'fileName': fileName, 'data': formLabelResult, nextType: 'fm' });
        });
    } catch (exception) {
        console.log(exception);
    }
});

router.post('/formMapping', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;

    process.on('uncaughtException', function (err) {
        console.log('formMapping uncaughtException : ' + err);
    });

    try {

        aimain.formMapping2(data, function (formMappingResult) {
            console.log('execute formMapping ML');
            res.send({ 'fileName': fileName, 'data': formMappingResult, nextType: 'cm' });
        });

    } catch (exception) {
        console.log(exception);
    }
});

router.post('/columnMapping', function (req, res) {
    req.setTimeout(300000);
    var fileName = req.body.fileName;
    var arg = req.body.data;

    process.on('uncaughtException', function (err) {
        console.log('columnMapping uncaughtException : ' + err);
    });

    try {
        /*
        // ML Studio
        aimain.runFromMLStudio(arg, function (result) {
            res.send({ 'fileName': fileName, 'data': result.data, nextType: 'sc' });
        });
        */

        
        // tensorflow
        aimain.columnMapping3(arg, function (columnResult) {
            console.log('execute columnMapping ML');
            res.send({ 'fileName': fileName, 'data': columnResult, nextType: 'sc' });          
        });
        
        /*
        //08.30
        aimain.columnMapping4(arg, function (columnResult) {
            console.log('execute columnMapping ML');
            res.send({ 'fileName': fileName, 'data': columnResult, nextType: 'sc' });
        });
        */
        
    } catch (exception) {
        console.log(exception);
    }
});

// DB Columns select
router.post('/searchDBColumns', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;
    //todo
    sync.fiber(function () {
        try {
            var colMappingList = sync.await(oracle.selectColumn(req, sync.defer()));
            var entryMappingList = sync.await(oracle.selectEntryMappingCls(req, sync.defer()));

            res.send({code: 200, 'fileName': fileName, 'data': data, 'column': colMappingList, 'entryMappingList': entryMappingList});
        } catch (e) {
            console.log(e);
            res.send({ code: 400 });
        }
    });
});

/*
// db컬럼명 조회
router.post('/searchDBColumns', function (req, res) {

    var fileName = req.body.fileName;
    var data = req.body.data;

    typoSentenceEval(data, function (result1) {

        domainDictionaryEval(result1, function (result2) {

            textClassificationEval(result2, function (result3) {

                labelMappingEval(result3, function (result4) {
                    console.log(result4);

                    commonDB.reqQuery(selectColumn, function(rows, req, res) {
                        res.send({ 'fileName': fileName, 'data': result4, 'column': rows});
                    }, req, res);
                })
            })
        })
    });
});
*/

// fileupload
router.post('/uploadFile', upload.any(), function (req, res) {
    var files = req.files;
    var endCount = 0;
    var returnObj = [];
    var convertType = '';

    for (var i = 0; i < files.length; i++) {
        if (files[i].originalname.split('.')[1] === 'TIF' || files[i].originalname.split('.')[1] === 'tif' ||
            files[i].originalname.split('.')[1] === 'TIFF' || files[i].originalname.split('.')[1] === 'tiff') {
            var ifile = appRoot + '\\' + files[i].path;
            var ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.jpg';
            execSync('module\\imageMagick\\convert.exe -quiet -density 800x800 ' + ifile + ' ' + ofile);
            if (endCount === files.length - 1) { // 모든 파일 변환이 완료되면
                var j = 0;
                var isStop = false;
                while (!isStop) {
                    try { // 하나의 파일 안의 여러 페이지면
                        var stat = fs.statSync(appRoot + '\\' + files[i].path.split('.')[0] + '-' + j + '.jpg');
                        if (stat) {
                            returnObj.push(files[i].originalname.split('.')[0] + '-' + j + '.jpg');
                        } else {
                            isStop = true;
                            break;
                        }
                    } catch (err) { // 하나의 파일 안의 한 페이지면
                        try {
                            var stat2 = fs.statSync(appRoot + '\\' + files[i].path.split('.')[0] + '.jpg');
                            if (stat2) {
                                returnObj.push(files[i].originalname.split('.')[0] + '.jpg');
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
    res.send({ code: 200, message: returnObj });

    /*
    for (var i = 0; i < files.length; i++) {
        var ifile = appRoot + '\\' + files[i].path;
        var ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.jpg';

        if (files[i].originalname.split('.')[1].toLowerCase() === 'tif' ||
            files[i].originalname.split('.')[1].toLowerCase() === 'tiff') {
            execSync('module\\imageMagick\\convert.exe -quiet -density 800x800 ' + ifile + ' ' + ofile);
            convertType = files[i].originalname.split('.')[1].toLowerCase();
        } else {

        }

        if (endCount === files.length - 1) { // 모든 파일 변환이 완료되면
            if (convertType === 'tif') {
                try {
                    var stat = fs.statSync(appRoot + '\\' + files[i].path.split('.')[0] + '.jpg');
                    if (stat) {
                        returnObj.push(files[i].originalname.split('.')[0] + '.jpg');
                    }
                } catch (e) {
                }
            } else if (convertType === 'tiff') {
                var j = 0;
                var isStop = false;
                while (!isStop) {

                }
            }           
        }

        endCount++;
    }
    */
});

// 기존문서 양식 LIKE 검색
var callbackSelectLikeDocCategory = function (rows, req, res) {
    res.send(rows);
};
router.post('/selectLikeDocCategory', function (req, res) {
    var keyword = '%' + req.body.keyword + '%';

    commonDB.reqQueryParam(queryConfig.uiLearningConfig.selectLikeDocCategory, [keyword], callbackSelectLikeDocCategory, req, res);
});

// 신규문서 양식 등록
var callbackInsertDocCategory = function (rows, req, res) {
    res.send({ code: 200, message: 'document Category insert success' });
};
var callbackSelectMaxDocType = function (rows, req, res) {
    var docName = req.body.docName;
    var sampleImagePath = req.body.sampleImagePath;
    var docType = rows[0].DOCTYPE;
    if (docType == 998) { // unk 가 999이므로 피하기 위함
        docType++;
    }
    commonDB.reqQueryParam(queryConfig.uiLearningConfig.insertDocCategory, [docName, (docType + 1), sampleImagePath], callbackInsertDocCategory, req, res);
};
router.post('/insertDocCategory', function (req, res) {

    commonDB.reqQuery(queryConfig.uiLearningConfig.selectMaxDocType, callbackSelectMaxDocType, req, res);
});

router.post('/insertTypoTrain', function (req, res) {
    var data = req.body.data;

    runInsertTypoTrain(data, req, res, function (ret) {
        res.send(ret);
    });
});

async function runInsertTypoTrain(data, req, res, callback) {
    try {
        let ret = await insertTypoTrain(data, req, res);
        callback(ret);
    } catch (err) {
        console.error(err);
    }
}

function insertTypoTrain(data, req, res) {

    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            for (var i = 0; i < data.length; i++) {
                if (data[i].typoText != null && (data[i].typoText != data[i].text)) {

                    var typoSplit = data[i].typoText.split(" ");
                    var textSplit = data[i].text.split(" ");

                    for (var ty = 0; ty < textSplit.length; ty++) {
                        if (typoSplit[ty] != textSplit[ty]) {
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

                            var insTypoCorCond = [];
                            insTypoCorCond.push(req.session.userId);
                            insTypoCorCond.push(typoSplit[ty]);//originWord
                            insTypoCorCond.push(textSplit[ty]);//correctWord
                            insTypoCorCond.push("");//fileName
                            insTypoCorCond.push("U");
                            var insTypoCorRes = await conn.execute(queryConfig.uiLearningConfig.insertTypoCorrect, insTypoCorCond);
                        }
                    }

                }
            }

            resolve(data);

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

async function runMakeTrainingSidData(data, req, res, callback) {
    try {
        let ret = await makeTrainingSidData(data, req, res);
        callback(ret);
    } catch (err) {
        console.error(err);
    }
}

function makeTrainingSidData(data, req, res) {

    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            for (var i in data) {
                var sid = "";
                locSplit = data[i].location.split(",");
                sid += locSplit[0] + "," + locSplit[1];

                let result = await conn.execute("SELECT EXPORT_SENTENCE_SID(:COND) SID FROM DUAL", [data[i].text.toLowerCase()]);

                if (result.rows[0] != null) {
                    sid += "," + result.rows[0].SID;
                }

                data[i].sid = sid;
            }

            resolve(data);

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


// uiTrain
router.post('/uiTrain', function (req, res) {
    var data = req.body.data;

    runTrain(data, req, function (result) {
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

async function runTrain(data, req, callback) {
    try {
        let res = await textLabelTrain(data, req);
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

            var ctnm, csconm;
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

                                var insTypoCorCond = [];
                                insTypoCorCond.push(req.session.regId);
                                insTypoCorCond.push(originSplit[ty]);//originWord
                                insTypoCorCond.push(textSplit[ty]);//correctWord
                                insTypoCorCond.push("");//fileName
                                insTypoCorCond.push("U");
                                var insTypoCorRes = await conn.execute(queryConfig.uiLearningConfig.insertTypoCorrect, insTypoCorCond);
                            }
                        }
                    } else {
    
                        if (data[i].labelMapping == "CT_NM_VALUE") {
                            ctnm = data[i];
                        }

                        if (data[i].labelMapping == "CSCO_NM_VALUE") {
                            csconm = data[i];
                        }
                        //domain dictionary train
                        /*
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
                        */
                    }
                }
            }

            if (csconm != null && ctnm != null) {
                selCtrCond = [];
                selCtrCond.push(csconm.text);
                selCtrCond.push(ctnm.text);

                let selCtrRes = await conn.execute(queryConfig.batchLearningConfig.selectContractMapping, selCtrCond);

                if (selCtrRes.rows[0] == null) {

                    var insCtrCond = [];
                    insCtrCond.push(csconm.originText);//extOgcompanyName
                    insCtrCond.push(ctnm.originText);//extCtnm
                    insCtrCond.push(csconm.text);//asOgcompanyName
                    insCtrCond.push(ctnm.text);//asCtnm

                    let insCtrRes = await conn.execute(queryConfig.batchLearningConfig.insertContractMapping, insCtrCond);
                }

                var csconmSplit = csconm.text.split(" ");
                var ctnmSplit = ctnm.text.split(" ");

                for (var cs in csconmSplit) {
                    var selTypoCond = [];
                    selTypoCond.push(csconmSplit[cs]);
                    let selTypoRes = await conn.execute(queryConfig.uiLearningConfig.selectTypo, selTypoCond);

                    if (selTypoRes.rows[0] == null) {
                        let insTypoRes = await conn.execute(queryConfig.uiLearningConfig.insertTypo, selTypoCond);
                    }
                }

                for (var cs in ctnmSplit) {
                    var selTypoCond = [];
                    selTypoCond.push(ctnmSplit[cs]);
                    let selTypoRes = await conn.execute(queryConfig.uiLearningConfig.selectTypo, selTypoCond);

                    if (selTypoRes.rows[0] == null) {
                        let insTypoRes = await conn.execute(queryConfig.uiLearningConfig.insertTypo, selTypoCond);
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
            res.send({ 'fileName': fileName, 'data': result, nextType: 'st' });
        });
    } catch (exception) {
        console.log(exception);
    }
});

// statement classifiction ML
router.post('/statementClassification', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;

    process.on('uncaughtException', function (err) {
        console.log('uncaughtException : ' + err);
    });

    try {
        aimain.statementClassificationEval(data, function (result) {
            res.send({ 'fileName': fileName, 'data': result.data, 'docCategory': result.docCategory, nextType: 'lm' });
        });
    } catch (exception) {
        console.log(exception);
    }
});

// labelMapping ML
router.post('/labelMapping', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;
    var docCategory = (req.body.docCategory) ? req.body.docCategory : null;

    process.on('uncaughtException', function (err) {
        console.log('uncaughtException : ' + err);
    });

    try {
        aimain.labelMappingEval(data, function (result) {
            res.send({ 'fileName': fileName, 'data': result, 'docCategory': docCategory, nextType: 'sc' });
        });
    } catch (exception) {
        console.log(exception);
    }
});

//08.31
router.get('/formMapping2', function (req, res) {
    var data = [{ "location": "1018, 240, 411, 87", "text": "APEX" }, { "location": "1019, 338, 409, 23", "text": "Partner of Choice" }, { "location": "1562, 509, 178, 25", "text": "Voucher No" }, { "location": "1562, 578, 206, 25", "text": "Voucher Date" }, { "location": "206, 691, 274, 27", "text": "4153 Korean Re" }, { "location": "208, 756, 525, 34", "text": "Proportional Treaty Statement" }, { "location": "1842, 506, 344, 25", "text": "BV / HEO / 2018 / 05 / 0626" }, { "location": "1840, 575, 169, 25", "text": "01105 / 2018" }, { "location": "206, 848, 111, 24", "text": "Cedant" }, { "location": "206, 908, 285, 24", "text": "Class of Business" }, { "location": "210, 963, 272, 26", "text": "Period of Quarter" }, { "location": "207, 1017, 252, 31", "text": "Period of Treaty" }, { "location": "206, 1066, 227, 24", "text": "Our Reference" }, { "location": "226, 1174, 145, 31", "text": "Currency" }, { "location": "227, 1243, 139, 24", "text": "Premium" }, { "location": "226, 1303, 197, 24", "text": "Commission" }, { "location": "226, 1366, 107, 24", "text": "Claims" }, { "location": "227, 1426, 126, 24", "text": "Reserve" }, { "location": "227, 1489, 123, 24", "text": "Release" }, { "location": "227, 1549, 117, 24", "text": "Interest" }, { "location": "227, 1609, 161, 31", "text": "Brokerage" }, { "location": "233, 1678, 134, 24", "text": "Portfolio" }, { "location": "227, 1781, 124, 24", "text": "Balance" }, { "location": "574, 847, 492, 32", "text": ": Solidarity - First Insurance 2018" }, { "location": "574, 907, 568, 32", "text": ": Marine Cargo Surplus 2018 - Inward" }, { "location": "598, 959, 433, 25", "text": "01 - 01 - 2018 TO 31 - 03 - 2018" }, { "location": "574, 1010, 454, 25", "text": ": 01 - 01 - 2018 TO 31 - 12 - 2018" }, { "location": "574, 1065, 304, 25", "text": ": APEX / BORD / 2727" }, { "location": "629, 1173, 171, 25", "text": "JOD 1.00" }, { "location": "639, 1239, 83, 25", "text": "25.53" }, { "location": "639, 1299, 64, 25", "text": "5.74" }, { "location": "639, 1362, 64, 25", "text": "0.00" }, { "location": "639, 1422, 64, 25", "text": "7.66" }, { "location": "639, 1485, 64, 25", "text": "0.00" }, { "location": "639, 1545, 64, 25", "text": "0.00" }, { "location": "639, 1605, 64, 25", "text": "0.64" }, { "location": "648, 1677, 64, 25", "text": "0.00" }, { "location": "641, 1774, 81, 25", "text": "11 .49" }, { "location": "1706, 1908, 356, 29", "text": "APEX INSURANCE" }];

    process.on('uncaughtException', function (err) {
        console.log('formMapping uncaughtException : ' + err);
    });

    try {
        var arg = [];
        for (var i in data) {
            if (i == 5) {
                break;
            } else {
                arg.push(data[i]);
            }
        }

        aimain.runFromMLStudio(arg, function (result) {
            res.send(arg);
        });
    } catch (exception) {
        console.log(exception);
    }
});

//08.31
router.get('/trainFormMapping', function (req, res) {
    var data = [{ "location": "1018, 240, 411, 87", "text": "APEX" }, { "location": "1019, 338, 409, 23", "text": "Partner of Choice" }, { "location": "1562, 509, 178, 25", "text": "Voucher No" }, { "location": "1562, 578, 206, 25", "text": "Voucher Date" }, { "location": "206, 691, 274, 27", "text": "4153 Korean Re" }, { "location": "208, 756, 525, 34", "text": "Proportional Treaty Statement" }, { "location": "1842, 506, 344, 25", "text": "BV / HEO / 2018 / 05 / 0626" }, { "location": "1840, 575, 169, 25", "text": "01105 / 2018" }, { "location": "206, 848, 111, 24", "text": "Cedant" }, { "location": "206, 908, 285, 24", "text": "Class of Business" }, { "location": "210, 963, 272, 26", "text": "Period of Quarter" }, { "location": "207, 1017, 252, 31", "text": "Period of Treaty" }, { "location": "206, 1066, 227, 24", "text": "Our Reference" }, { "location": "226, 1174, 145, 31", "text": "Currency" }, { "location": "227, 1243, 139, 24", "text": "Premium" }, { "location": "226, 1303, 197, 24", "text": "Commission" }, { "location": "226, 1366, 107, 24", "text": "Claims" }, { "location": "227, 1426, 126, 24", "text": "Reserve" }, { "location": "227, 1489, 123, 24", "text": "Release" }, { "location": "227, 1549, 117, 24", "text": "Interest" }, { "location": "227, 1609, 161, 31", "text": "Brokerage" }, { "location": "233, 1678, 134, 24", "text": "Portfolio" }, { "location": "227, 1781, 124, 24", "text": "Balance" }, { "location": "574, 847, 492, 32", "text": ": Solidarity - First Insurance 2018" }, { "location": "574, 907, 568, 32", "text": ": Marine Cargo Surplus 2018 - Inward" }, { "location": "598, 959, 433, 25", "text": "01 - 01 - 2018 TO 31 - 03 - 2018" }, { "location": "574, 1010, 454, 25", "text": ": 01 - 01 - 2018 TO 31 - 12 - 2018" }, { "location": "574, 1065, 304, 25", "text": ": APEX / BORD / 2727" }, { "location": "629, 1173, 171, 25", "text": "JOD 1.00" }, { "location": "639, 1239, 83, 25", "text": "25.53" }, { "location": "639, 1299, 64, 25", "text": "5.74" }, { "location": "639, 1362, 64, 25", "text": "0.00" }, { "location": "639, 1422, 64, 25", "text": "7.66" }, { "location": "639, 1485, 64, 25", "text": "0.00" }, { "location": "639, 1545, 64, 25", "text": "0.00" }, { "location": "639, 1605, 64, 25", "text": "0.64" }, { "location": "648, 1677, 64, 25", "text": "0.00" }, { "location": "641, 1774, 81, 25", "text": "11 .49" }, { "location": "1706, 1908, 356, 29", "text": "APEX INSURANCE" }];

    process.on('uncaughtException', function (err) {
        console.log('formMapping uncaughtException : ' + err);
    });

    try {
        var arg = [];
        for (var i in data) {
            if (i == 5) {
                break;
            } else {
                arg.push(data[i]);
            }
        }

        aimain.addTrainFromMLStudio(arg, function (result) {
            res.send(arg);
        });
    } catch (exception) {
        console.log(exception);
    }
});

module.exports = router;
