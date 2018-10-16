'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var router = express.Router();

var oracledb = require('oracledb');
var dbConfig = require('../../config/dbConfig.js');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var logger = require('../util/logger');
var aimain = require('../util/aiMain');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
var queryConfig = require(appRoot + '/config/queryConfig.js');
var sync = require('../util/sync.js');
var oracle = require('../util/oracle.js');
var pythonConfig = require(appRoot + '/config/pythonConfig');
var PythonShell = require('python-shell');
var transPantternVar = require('./transPattern');

var insertTextClassification = queryConfig.uiLearningConfig.insertTextClassification;
var insertLabelMapping = queryConfig.uiLearningConfig.insertLabelMapping;
var selectLabel = queryConfig.uiLearningConfig.selectLabel;
var insertTypo = queryConfig.uiLearningConfig.insertTypo;
var insertDomainDic = queryConfig.uiLearningConfig.insertDomainDic;
var selectTypo = queryConfig.uiLearningConfig.selectTypo;
var updateTypo = queryConfig.uiLearningConfig.updateTypo;
var selectColumn = queryConfig.uiLearningConfig.selectColumn;

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
router.get('/', function (req, res) {
    if (req.isAuthenticated()) res.render('user/invoiceRegistration', {
        currentUser: req.user,

    });
    else res.redirect("/logout");
});
router.post('/', function (req, res) {
    if (req.isAuthenticated()) res.render('user/invoiceRegistration', { currentUser: req.user });
    else res.redirect("/logout");
});

// [POST] 문서 리스트 조회 
router.post('/searchDocumentList', function (req, res) {
    if (req.isAuthenticated()) fnSearchDocumentList(req, res);
});
var callbackDocumentList = function (rows, req, res) {
    if (req.isAuthenticated()) res.send(rows);
};
var fnSearchDocumentList = function (req, res) {
    var condQuery = ``;
    var andQuery = ` AND STATUS = 'ZZ' `;
    var orderQuery = ` ORDER BY DOCNUM ASC `;
    var param = {
        docNum: commonUtil.nvl(req.body.docNum),
        documentManager: commonUtil.nvl(req.body.documentManager)
    };

    if (!commonUtil.isNull(param["docNum"])) condQuery += ` AND DOCNUM LIKE '%${param["docNum"]}%' `;
    if (!commonUtil.isNull(param["documentManager"])) condQuery += ` AND NOWNUM = '${param["documentManager"]}' `;
    if (commonUtil.isNull(param["docNum"]) && commonUtil.isNull(param["documentManager"]) && req.user.icrApproval == 'Y') condQuery += " AND DRAFTERNUM = '" + req.user.userId + "' ";
    var documentListQuery = queryConfig.invoiceRegistrationConfig.selectDocumentList;
    var listQuery = documentListQuery + condQuery + andQuery + orderQuery;
    //console.log("base listQuery : " + listQuery);
    commonDB.reqQuery(listQuery, callbackDocumentList, req, res);

};

// [POST] 문서 상세 리스트 조회
router.post('/searchDocumentDtlList', function (req, res) {
    if (req.isAuthenticated()) fnSearchDocumentDtlList(req, res);
});
var callbackDocumentDtlList = function (rows, req, res) {
    if (req.isAuthenticated()) res.send(rows);
};
var fnSearchDocumentDtlList = function (req, res) {
    var param = {
        seqNum: req.body.seqNum,
        docNum: req.body.docNum
    };
    var condQuery = ` AND A.DOCNUM = '${param.docNum}' `;
    var orderQuery = ` ORDER BY B.SEQNUM ASC `;

    var documentDtlListQuery = queryConfig.invoiceRegistrationConfig.selectDocumentDtlList;
    var listQuery = documentDtlListQuery + condQuery + orderQuery;
    console.log("dtl listQuery : " + listQuery);
    commonDB.reqQuery(listQuery, callbackDocumentDtlList, req, res);
};

// [POST] 문서 이미지 리스트 조회 
router.post('/searchDocumentImageList', function (req, res) {
    if (req.isAuthenticated()) fnSearchDocumentImageList(req, res);
});
var callbackDocumentImageList = function (rows, req, res) {
    if (req.isAuthenticated()) res.send(rows);
};
var fnSearchDocumentImageList = function (req, res) {
    var param = {
        imgId: req.body.imgId
    };
    var condQuery = ` AND A.IMGID = '${param.imgId}' `;
    var orderQuery = ` ORDER BY A.SEQNUM ASC `;

    var documentImageListQuery = queryConfig.invoiceRegistrationConfig.selectDocumentImageList;
    var listQuery = documentImageListQuery + condQuery + orderQuery;
    console.log("img listQuery : " + listQuery);
    commonDB.reqQuery(listQuery, callbackDocumentImageList, req, res);
};

/****************************************************************************************
 * FILE UPLOAD
 ****************************************************************************************/
router.post('/uploadFile', upload.any(), function (req, res) {
    sync.fiber(function () {
        var files = req.files;
        var endCount = 0;
        var fileInfo = [];
        var fileInfo2 = [];
        var fileDtlInfo = [];
        var returnObj = [];
        var convertType = '';
        var userId = req.session.userId;
        var convertedImagePath = appRoot + '\\uploads\\';

        for (var i = 0; i < files.length; i++) {
            fileInfo2 = [];
            var imgId = 'ICR';
            var date = new Date();
            var yyyymmdd = String(date.getFullYear()) + String(date.getMonth() + 1) + String(date.getDate());
            var maxDocNum = sync.await(oracle.selectMaxDocNum(sync.defer()));
            if (maxDocNum == 0) {
                imgId += yyyymmdd + '0000001';
            } else {
                var Maxyyyymmdd = maxDocNum.substring(3, 11);
                if (Number(Maxyyyymmdd) < Number(yyyymmdd)) {
                    imgId += yyyymmdd + '0000001';
                } else {
                    imgId += Number(maxDocNum.substring(3, 18)) + 1;
                }
            }
            console.log(imgId);
            var ifile = "";
            var ofile = "";

            if (files[i].originalname.split('.')[1] === 'TIF' || files[i].originalname.split('.')[1] === 'tif' ||
                files[i].originalname.split('.')[1] === 'TIFF' || files[i].originalname.split('.')[1] === 'tiff') {
                ifile = appRoot + '\\' + files[i].path;
                ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.jpg';

                //execSync('java -jar C:/Main.jar' + ifile);

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
                    regId: userId,
                    row: i
                };
                fileInfo2.push(fileParam);  
                fileInfo.push(fileParam);       // 변환 전 TIF 파일 정보

                execSync('module\\imageMagick\\convert.exe -quiet -density 800x800 ' + ifile + ' ' + ofile);
            } else if (files[i].originalname.split('.')[1] === 'xlsx' || files[i].originalname.split('.')[1] === 'xls' ||
                files[i].originalname.split('.')[1] === 'XLSX' || files[i].originalname.split('.')[1] === 'XLS' ||
                files[i].originalname.split('.')[1] === 'docx' || files[i].originalname.split('.')[1] === 'doc' ||
                files[i].originalname.split('.')[1] === 'DOCX' || files[i].originalname.split('.')[1] === 'DOC' ||
                files[i].originalname.split('.')[1] === 'pptx' || files[i].originalname.split('.')[1] === 'ppt' ||
                files[i].originalname.split('.')[1] === 'PPTX' || files[i].originalname.split('.')[1] === 'PPT' ||
                files[i].originalname.split('.')[1] === 'PDF' || files[i].originalname.split('.')[1] === 'pdf') {

                ifile = appRoot + '\\' + files[i].path;
                ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.pdf';

                //file decription 운영
                //execSync('java -jar C:/ICR/app/source/module/DrmDec.jar ' + ifile);

                //file convert to MsOffice to Pdf
                if ( !(files[i].originalname.split('.')[1] === 'PDF' || files[i].originalname.split('.')[1] === 'pdf') ) {
                    //execSync('"C:/Program Files/LibreOffice/program/python.exe" C:/ICR/app/source/module/unoconv/unoconv.py -f pdf -o ' + ofile + ' ' + ifile);   //운영
                    execSync('"C:/Program Files (x86)/LibreOffice/program/python.exe" C:/projectWork/koreanre/module/unoconv/unoconv.py -f pdf -o ' + ofile + ' ' + ifile);
                }
                
                ifile = appRoot + '\\' + files[i].path.split('.')[0] + '.pdf';
                ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.png';

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
                    regId: userId,
                    row: i
                };

                fileInfo2.push(fileParam); 
                fileInfo.push(fileParam);       // 변환 전 TIF 파일 정보

                //file convert Pdf to Png
                execSync('module\\imageMagick\\convert.exe -quiet -density 300 ' + ifile + ' ' + ofile);
            }
            
            var isStop = false;
            var j = 0;
            while (!isStop) {
                try { // 하나의 파일 안의 여러 페이지면
                    if (files[i].originalname.split('.')[1].toLowerCase() === 'docx' || files[i].originalname.split('.')[1].toLowerCase() === 'doc' ||
                        files[i].originalname.split('.')[1].toLowerCase() === 'xlsx' || files[i].originalname.split('.')[1].toLowerCase() === 'xls' ||
                        files[i].originalname.split('.')[1].toLowerCase() === 'pptx' || files[i].originalname.split('.')[1].toLowerCase() === 'ppt' ||
                        files[i].originalname.split('.')[1].toLowerCase() === 'pdf') {
                        var convertFileFullPath = appRoot + '\\' + files[i].path.split('.')[0] + '-' + j + '.png';
                        var convertFile = files[i].path.split('.')[0] + '-' + j + '.png';
                    } else {
                        var convertFileFullPath = appRoot + '\\' + files[i].path.split('.')[0] + '-' + j + '.jpg';
                        var convertFile = files[i].path.split('.')[0] + '-' + j + '.jpg';
                    }
                    var convertedFilePath = convertedImagePath.replace(/\\/gi, '/');
                    var convertFileName = convertFile.split('\\')[1];
                    var _lastDotDtl = convertFileName.lastIndexOf('.');
                    var stat = fs.statSync(convertFileFullPath);
                    if (stat) {
                        var fileDtlParam = {
                            imgId: imgId,
                            filePath: convertFileFullPath,
                            oriFileName: convertFileName,
                            convertFileName: convertFileName,
                            svrFileName: Math.random().toString(26).slice(2),
                            fileExt: convertFileName.substring(_lastDot + 1, convertFileName.length).toLowerCase(),
                            fileSize: stat.size,
                            contentType: 'image/jpeg',
                            regId: userId,
                            convertedFilePath: convertedFilePath
                        };

                        if (files[i].originalname.split('.')[1].toLowerCase() === 'docx' || files[i].originalname.split('.')[1].toLowerCase() === 'doc' || files[i].originalname.split('.')[1].toLowerCase() === 'xlsx' || files[i].originalname.split('.')[1].toLowerCase() === 'xls' || files[i].originalname.split('.')[1].toLowerCase() === 'pdf') {
                            returnObj.push(files[i].originalname.split('.')[0] + '-' + j + '.png');
                        } else {
                            returnObj.push(files[i].originalname.split('.')[0] + '-' + j + '.jpg');
                        }
                        
                        fileDtlInfo.push(fileDtlParam);          // 변환 후 JPG 파일 정보
                    } else {
                        isStop = true;
                        break;
                    }
                } catch (err) { // 하나의 파일 안의 한 페이지면
                    try {
                        if (files[i].originalname.split('.')[1].toLowerCase() === 'docx' || files[i].originalname.split('.')[1].toLowerCase() === 'doc' ||
                            files[i].originalname.split('.')[1].toLowerCase() === 'xlsx' || files[i].originalname.split('.')[1].toLowerCase() === 'xls' ||
                            files[i].originalname.split('.')[1].toLowerCase() === 'pptx' || files[i].originalname.split('.')[1].toLowerCase() === 'ppt' ||
                            files[i].originalname.split('.')[1].toLowerCase() === 'pdf') {
                            var convertFileFullPath = appRoot + '\\' + files[i].path.split('.')[0] + '.png';
                            var convertFile = files[i].path.split('.')[0] + '.png';
                        } else {
                            var convertFileFullPath = appRoot + '\\' + files[i].path.split('.')[0] + '.jpg';
                            var convertFile = files[i].path.split('.')[0] + '.jpg';
                        }
                        var convertedFilePath = convertedImagePath.replace(/\\/gi, '/');
                        var convertFileName = convertFile.split('\\')[1];
                        var _lastDotDtl = convertFileName.lastIndexOf('.');
                        var stat2 = fs.statSync(convertFileFullPath);
                        if (stat2) {
                            var fileDtlParam = {
                                imgId: imgId,
                                filePath: convertFileFullPath,
                                oriFileName: convertFileName,
                                convertFileName: convertFileName,
                                svrFileName: Math.random().toString(26).slice(2),
                                fileExt: convertFileName.substring(_lastDot + 1, convertFileName.length).toLowerCase(),
                                fileSize: stat2.size,
                                contentType: 'image/jpeg',
                                regId: userId,
                                convertedFilePath: convertedFilePath
                            };
                            if (files[i].originalname.split('.')[1].toLowerCase() === 'docx' || files[i].originalname.split('.')[1].toLowerCase() === 'doc' || files[i].originalname.split('.')[1].toLowerCase() === 'xlsx' || files[i].originalname.split('.')[1].toLowerCase() === 'xls' || files[i].originalname.split('.')[1].toLowerCase() === 'pdf') {
                                returnObj.push(files[i].originalname.split('.')[0] + '.png');
                            } else {
                                returnObj.push(files[i].originalname.split('.')[0] + '.jpg');
                            }
                            fileDtlInfo.push(fileDtlParam);         // 변환 후 JPG 파일 정보
                            break;
                        }
                    } catch (e) {
                        break;
                    }
                }
                j++;
            }
            endCount++;
            sync.await(oracle.insertDocument([fileInfo2], sync.defer()));
        }

        // TBL_DOCUMENT insert
        //sync.await(oracle.insertDocument([fileInfo], sync.defer()));
        sync.await(oracle.insertOcrFileDtl(fileDtlInfo, sync.defer()));

        res.send({ code: 200, message: returnObj, fileInfo: fileInfo, fileDtlInfo: fileDtlInfo });
    });

    
});
//문서전달
router.post('/sendDocument', function (req, res) {
    var returnObj = {};
    var sendCount = 0;
    try {
        for (var i = 0; i < req.body.docNum.length; i++) {
            console.log(req.body.userId[0], req.body.docNum[i]+"&&&&&&&&&&&&&&&&&&&&&");
            sync.fiber(function () {
                sync.await(oracle.sendDocument([req.body.userId[0], req.body.userId[0], req.body.docNum[i]], sync.defer()));
            });
            sendCount += 1;
        }
        returnObj = { code: 200, docData: sendCount };
    } catch (e) {
        returnObj = { code: 200, error: e };
    } finally {
        res.send(returnObj);
    }

});
//문서삭제
router.post('/deleteDocument', function (req, res) {
    var returnObj = {};
    var deleteCount = 0;
    try {
        for (var i = 0; i < req.body.docNum.length; i++) {
            sync.fiber(function () {
                    sync.await(oracle.deleteDocument(req.body.docNum[i], sync.defer()));
            });
            deleteCount += 1;
        }
        returnObj = { code: 200, docData: deleteCount }; 
    } catch (e) {
        returnObj = { code: 200, error: e };
    } finally {
        res.send(returnObj);
    }

});



router.post('/selectDocument', function (req, res) {
    var returnObj = {};
    var inputDocNum = "";
    for (var i = 0; i < req.body.fileInfo.length; i++) {
        inputDocNum += "'" + req.body.fileInfo[i].imgId + "'" + ", ";
    }
    var inputDocNum2 = inputDocNum.substring(0, inputDocNum.length - 2);
    console.log("SELECT문에 삽입될 IMGID 값 : " + inputDocNum2);
    sync.fiber(function () {
        try {
            var result = sync.await(oracle.selectDocument(inputDocNum2, sync.defer()));
            returnObj = { code: 200, docData: result };
        } catch (e) {
            returnObj = { code: 200, error: e };
        } finally {
            res.send(returnObj);
        }
    });
});

router.post('/selectOcrFileDtl', function (req, res) {
    var returnObj = {};
    var imgId = req.body.imgId;
    sync.fiber(function () {
        try {
            var result = sync.await(oracle.selectOcrFileDtl(imgId, sync.defer()));
            returnObj = { code: 200, docData: result, fileRootPath: appRoot + '/uploads/'  };
        } catch (e) {
            returnObj = { code: 200, error: e };
        } finally {
            res.send(returnObj);
        }
    });
});

router.post('/uploadFile_Old', upload.any(), function (req, res) {
    var files = req.files;
    var endCount = 0;
    var fileInfo = [];
    var fileDtlInfo = [];
    var returnObj = [];
    var convertType = '';
    var userId = req.session.userId;
    var convertedImagePath = appRoot + '\\uploads\\';

    for (var i = 0; i < files.length; i++) {
        var imgId = Math.random().toString(36).slice(2); // TODO : 임시로 imgId 생성 - 규칙 생기면 변경 필요
        var ifile = "";
        var ofile = "";

        if (files[i].originalname.split('.')[1] === 'TIF' || files[i].originalname.split('.')[1] === 'tif' ||
            files[i].originalname.split('.')[1] === 'TIFF' || files[i].originalname.split('.')[1] === 'tiff') {
            ifile = appRoot + '\\' + files[i].path;
            ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.jpg';

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
                regId: userId,
                row: i
            };

            fileInfo.push(fileParam);       // 변환 전 TIF 파일 정보
        } else if (files[i].originalname.split('.')[1] === 'docx' || files[i].originalname.split('.')[1] === 'doc' ||
            files[i].originalname.split('.')[1] === 'DOCX' || files[i].originalname.split('.')[1] === 'DOC') {
            ifile = appRoot + '\\' + files[i].path;
            ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.pdf';


        }

            execSync('module\\imageMagick\\convert.exe -quiet -density 800x800 ' + ifile + ' ' + ofile);
            var isStop = false;
            var j = 0;
            while (!isStop) {
                try { // 하나의 파일 안의 여러 페이지면
                    var convertFileFullPath = appRoot + '\\' + files[i].path.split('.')[0] + '-' + j + '.jpg';
                    var convertedFilePath = convertedImagePath.replace(/\\/gi, '/');
                    var convertFile = files[i].path.split('.')[0] + '-' + j + '.jpg';
                    var convertFileName = convertFile.split('\\')[1];
                    var _lastDotDtl = convertFileName.lastIndexOf('.');
                    var stat = fs.statSync(convertFileFullPath);
                    if (stat) {
                        var fileDtlParam = {
                            imgId: imgId,
                            filePath: convertFileFullPath,
                            oriFileName: convertFileName,
                            convertFileName: convertFileName,
                            svrFileName: Math.random().toString(26).slice(2),
                            fileExt: convertFileName.substring(_lastDot + 1, convertFileName.length).toLowerCase(),
                            fileSize: stat.size,
                            contentType: 'image/jpeg',
                            regId: userId,
                            convertedFilePath: convertedFilePath
                        };
                        returnObj.push(files[i].originalname.split('.')[0] + '-' + j + '.jpg');
                        fileDtlArr.push(fileDtlParam);          // 변환 후 JPG 파일 정보
                    } else {
                        isStop = true;
                        break;
                    }
                } catch (err) { // 하나의 파일 안의 한 페이지면
                    try {
                        var convertFileFullPath = appRoot + '\\' + files[i].path.split('.')[0] + '.jpg';
                        var convertedFilePath = convertedImagePath.replace(/\\/gi, '/');
                        var convertFile = files[i].path.split('.')[0] + '.jpg';
                        var convertFileName = convertFile.split('\\')[1];
                        var _lastDotDtl = convertFileName.lastIndexOf('.');
                        var stat2 = fs.statSync(convertFileFullPath);
                        if (stat2) {
                            var fileDtlParam = {
                                imgId: imgId,
                                filePath: convertFileFullPath,
                                oriFileName: convertFileName,
                                convertFileName: convertFileName,
                                svrFileName: Math.random().toString(26).slice(2),
                                fileExt: convertFileName.substring(_lastDot + 1, convertFileName.length).toLowerCase(),
                                fileSize: stat2.size,
                                contentType: 'image/jpeg',
                                regId: userId,
                                convertedFilePath: convertedFilePath
                            };
                            returnObj.push(files[i].originalname.split('.')[0] + '.jpg');
                            fileDtlInfo.push(fileDtlParam);         // 변환 후 JPG 파일 정보
                            break;
                        }
                    } catch (e) {
                        break;
                    }
                }
                j++;
            }
            endCount++;
    }

    commonDB.insertFileInfo(fileInfo, "ocr_file"); // 파일 정보 DB INSERT
    commonDB.insertFileInfo(fileDtlInfo, "ocr_file_dtl"); // 세부 파일 정보 DB INSERT

    res.send({ code: 200, message: returnObj, fileInfo: fileInfo, fileDtlInfo: fileDtlInfo });
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

// DB Columns select
router.post('/searchDBColumns', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;
    var docCategory = (req.body.docCategory) ? req.body.docCategory : null;

    commonDB.reqQuery(selectColumn, function (rows, req, res) {
        res.send({ 'fileName': fileName, 'data': data, 'docCategory': docCategory, 'column': rows });
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


function createDocNum() {   
    
    sync.fiber(function () {
        var documentNum = 'ICR';
        var date = new Date();
        var yyyymmdd = String(date.getFullYear()) + String(date.getMonth() + 1) + String(date.getDate());

        try {
            
            var maxDocNum = sync.await(oracle.selectMaxDocNum(sync.defer()));            
            if (maxDocNum == 0) {
                documentNum += yyyymmdd + '0000001';
            } else {
                var Maxyyyymmdd = maxDocNum.substring(3, 11);
                if (Number(Maxyyyymmdd) < Number(yyyymmdd)) {
                    documentNum += yyyymmdd + '0000001';
                } else {
                    documentNum += Number(maxDocNum.substring(3, 18)) + 1;
                }
            }            
            return documentNum;
            
        } catch (e) {
            console.log(e);
        }
    });
    
}

router.post('/uiLearnTraining', function (req, res) {
    var ocrData = req.body.ocrData;
    var filePath = req.body.filePath;
    var fileName = req.body.fileName;
    var fileExt = filePath.split(".")[1];
    var imgId = req.body.fileDtlInfo.imgId;
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

            returnObj = { code: 200, 'fileName': fileName, 'data': resPyArr, 'column': colMappingList, 'entryMappingList': entryMappingList };
        } catch (e) {
            console.log(resPyStr);
            returnObj = { 'code': 500, 'message': e };

        } finally {
            res.send(returnObj);
        }

    });
});

module.exports = router;