﻿'use strict';
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
var sizeOf = require('image-size');
var request = require('sync-request');
var propertiesConfig = require('../../config/propertiesConfig.js');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

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
    if (req.session.user !== undefined) res.render('user/invoiceRegistration', {
        currentUser: req.session.user,

    });
    else res.redirect("/logout");
});
router.post('/', function (req, res) {
    if (req.session.user !== undefined) res.render('user/invoiceRegistration', { currentUser: req.session.user });
    else res.redirect("/logout");
});

// [POST] 문서 리스트 조회 
router.post('/searchDocumentList', function (req, res) {
    if (req.session.user !== undefined) fnSearchDocumentList(req, res);
});
var callbackDocumentList = function (rows, req, res) {
    if (req.session.user !== undefined) res.send(rows);
};
var fnSearchDocumentList = function (req, res) {
    var condQuery = ``;
    var andQuery = ` AND (STATUS = 'ZZ' OR STATUS = '04') `;
    var orderQuery = ` ORDER BY DOCNUM ASC `;
    var param = {
        userId: commonUtil.nvl(req.body.userId),
        docNum: commonUtil.nvl(req.body.docNum),
        documentManager: commonUtil.nvl(req.body.documentManager),
        scanApproval: commonUtil.nvl(req.body.scanApproval),
        icrApproval: commonUtil.nvl(req.body.icrApproval),
        adminApproval: commonUtil.nvl(req.body.adminApproval)
    };
    if (param["adminApproval"] == 'Y') {
        //andQuery = '';
    } else if (!commonUtil.isNull(param["scanApproval"]) && param["scanApproval"] == 'Y' && param["adminApproval"] == 'N') {
        condQuery += " AND UPLOADNUM = '" + req.session.userId + "' ";
    } else if (!commonUtil.isNull(param["icrApproval"]) && param["icrApproval"] == 'Y' && param["adminApproval"] == 'N') {
        condQuery += " AND ICRNUM = '" + req.session.userId + "' ";
    }

    //문서번호 입력 시
    if (!commonUtil.isNull(param["docNum"])) condQuery += ` AND DOCNUM LIKE '%${param["docNum"]}%' `;
    //스캔담당자 입력 시
    if (!commonUtil.isNull(param["documentManager"])) condQuery += ` AND UPLOADNUM LIKE '%${param["documentManager"]}%' `;

 
    var documentListQuery = queryConfig.invoiceRegistrationConfig.selectDocumentList;
    var listQuery = documentListQuery + condQuery + andQuery + orderQuery;
    //console.log("base listQuery : " + listQuery);
    commonDB.reqQuery(listQuery, callbackDocumentList, req, res);

};

// [POST] 문서 상세 리스트 조회
router.post('/searchDocumentDtlList', function (req, res) {
    if (req.session.user !== undefined) fnSearchDocumentDtlList(req, res);
});
var callbackDocumentDtlList = function (rows, req, res) {
    if (req.session.user !== undefined) res.send(rows);
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
    if (req.session.user !== undefined) fnSearchDocumentImageList(req, res);
});
var callbackDocumentImageList = function (rows, req, res) {
    if (req.session.user !== undefined) res.send(rows);
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
        var fileDtlInfo = [];
        var returnObj = [];
        var convertType = '';
        var userId = req.session.userId;
        var convertedImagePath = appRoot + '\\uploads\\';

        for (var i = 0; i < files.length; i++) {
            console.time("file upload & convert");
            var fileInfo2 = [];
            var fileDtlInfoTemp = [];
            var imgId = 'ICR';
            var date = new Date();
            var yyyymmdd = String(date.getFullYear()) + String((date.getMonth() + 1 < 10) ? '0' + (date.getMonth() +1) : '' + (date.getMonth()+1) ) + String((date.getDate() < 10) ? '0' + date.getDate() : '' + date.getDate());
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
            //console.log(imgId);
            var ifile = "";
            var ofile = "";

            if (files[i].originalname.split('.')[1] === 'TIF' || files[i].originalname.split('.')[1] === 'tif' ||
                files[i].originalname.split('.')[1] === 'TIFF' || files[i].originalname.split('.')[1] === 'tiff' ||
                files[i].originalname.split('.')[1] === 'JPG' || files[i].originalname.split('.')[1] === 'jpg') {
                ifile = appRoot + '\\' + files[i].path;
                ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.jpg';

                //file decription 운영
                if (propertiesConfig.isOperation == 'Y') execSync('java -jar C:/ICR/app/source/module/DrmDec.jar "' + ifile + '"');

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

                execSync('module\\imageMagick\\convert.exe -quiet -density 800x800 "' + ifile + '" "' + ofile + '"');
            } else if (files[i].originalname.split('.')[1] === 'PNG' || files[i].originalname.split('.')[1] === 'png'){
                ifile = appRoot + '\\' + files[i].path;
                ofile = appRoot + '\\' + files[i].path.split('.')[0] + '.png';

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
                if (propertiesConfig.isOperation == 'Y') execSync('java -jar C:/ICR/app/source/module/DrmDec.jar "' + ifile + '"');

                //file convert to MsOffice to Pdf
                if (!(files[i].originalname.split('.')[1] === 'PDF' || files[i].originalname.split('.')[1] === 'pdf')) {
                    if (propertiesConfig.isOperation == 'Y') {
                        execSync('"C:/Program Files/LibreOffice/program/python.exe" C:/ICR/app/source/module/unoconv/unoconv.py -f pdf -o "' + ofile + '" "' + ifile + '"');   //운영
                    } else {
                        execSync('"C:/Program Files (x86)/LibreOffice/program/python.exe" C:/projectWork/koreanre/module/unoconv/unoconv.py -f pdf -o "' + ofile + '" "' + ifile + '"');
                    }
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
                var convertResult = execSync('module\\imageMagick\\convert.exe -quiet -density 150 -quality 100% -compress None -colorspace Gray -alpha remove -alpha off "' + ifile + '" "' + ofile +'"');
				/*
                if (convertResult.status != 0) {
                    throw new Error(convertResult.stderr);
                }
				*/

            }
            
            var isStop = false;
            var j = 0;
            while (!isStop) {
                try { // 하나의 파일 안의 여러 페이지면
                    if (files[i].originalname.split('.')[1].toLowerCase() === 'docx' || files[i].originalname.split('.')[1].toLowerCase() === 'doc' ||
                        files[i].originalname.split('.')[1].toLowerCase() === 'xlsx' || files[i].originalname.split('.')[1].toLowerCase() === 'xls' ||
                        files[i].originalname.split('.')[1].toLowerCase() === 'pptx' || files[i].originalname.split('.')[1].toLowerCase() === 'ppt' ||
                        files[i].originalname.split('.')[1].toLowerCase() === 'pdf' || files[i].originalname.split('.')[1].toLowerCase() === 'png') {
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

                        if (files[i].originalname.split('.')[1].toLowerCase() === 'docx' || files[i].originalname.split('.')[1].toLowerCase() === 'doc' ||
                            files[i].originalname.split('.')[1].toLowerCase() === 'xlsx' || files[i].originalname.split('.')[1].toLowerCase() === 'xls' ||
                            files[i].originalname.split('.')[1].toLowerCase() === 'pptx' || files[i].originalname.split('.')[1].toLowerCase() === 'ppt' ||
                            files[i].originalname.split('.')[1].toLowerCase() === 'pdf' || files[i].originalname.split('.')[1].toLowerCase() === 'png') {
                            returnObj.push(files[i].originalname.split('.')[0] + '-' + j + '.png');
                        } else {
                            returnObj.push(files[i].originalname.split('.')[0] + '-' + j + '.jpg');
                        }
                        
                        fileDtlInfo.push(fileDtlParam);          // 변환 후 JPG 파일 정보
						fileDtlInfoTemp.push(fileDtlParam);
                    } else {
                        isStop = true;
                        break;
                    }
                } catch (err) { // 하나의 파일 안의 한 페이지면
                    try {
                        if (files[i].originalname.split('.')[1].toLowerCase() === 'docx' || files[i].originalname.split('.')[1].toLowerCase() === 'doc' ||
                            files[i].originalname.split('.')[1].toLowerCase() === 'xlsx' || files[i].originalname.split('.')[1].toLowerCase() === 'xls' ||
                            files[i].originalname.split('.')[1].toLowerCase() === 'pptx' || files[i].originalname.split('.')[1].toLowerCase() === 'ppt' ||
                            files[i].originalname.split('.')[1].toLowerCase() === 'pdf' || files[i].originalname.split('.')[1].toLowerCase() === 'png') {
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
                            if (files[i].originalname.split('.')[1].toLowerCase() === 'docx' || files[i].originalname.split('.')[1].toLowerCase() === 'doc' ||
                                files[i].originalname.split('.')[1].toLowerCase() === 'xlsx' || files[i].originalname.split('.')[1].toLowerCase() === 'xls' ||
                                files[i].originalname.split('.')[1].toLowerCase() === 'pptx' || files[i].originalname.split('.')[1].toLowerCase() === 'ppt' ||
                                files[i].originalname.split('.')[1].toLowerCase() === 'pdf' || files[i].originalname.split('.')[1].toLowerCase() === 'png') {
                                returnObj.push(files[i].originalname.split('.')[0] + '.png');
                            } else {
                                returnObj.push(files[i].originalname.split('.')[0] + '.jpg');
                            }
                            fileDtlInfo.push(fileDtlParam);         // 변환 후 JPG 파일 정보
							fileDtlInfoTemp.push(fileDtlParam);
                            break;
                        }
                    } catch (e) {
                        break;
                    }
                }
                j++;
            }
            endCount++;
            sync.await(oracle.insertDocument([fileInfo2, fileDtlInfoTemp.length], sync.defer()));
            fileInfo[i].pageCount = fileDtlInfoTemp.length;
            console.timeEnd("file upload & convert");
        }

        // TBL_DOCUMENT insert
        //sync.await(oracle.insertDocument([fileInfo], sync.defer()));
        sync.await(oracle.insertOcrFileDtl(fileDtlInfo, sync.defer()));

        // 통계 insert (선형 그래프)
        sync.await(oracle.countingStatistics('line', userId, sync.defer()));

        res.send({ code: 200, message: returnObj, fileInfo: fileInfo, fileDtlInfo: fileDtlInfo });
    });

    
});

//전달/결재상신(ICR담당자 -> 중간결재자)
router.post('/sendApprovalDocument', function (req, res) {
    var userChoiceId = req.body.userChoiceId;
    var docInfo = req.body.docInfo;
    var userId = req.body.userId;
    var mlData = req.body.mlData;
    var memo = req.body.memo;
    var token = '';
    if (propertiesConfig.isOperation == 'Y') {
        token = (propertiesConfig.token == '') ? req.session.user.token : propertiesConfig.token;
    }
    
    var returnObj = {};
    var approvalDtlData = [];
    var sendCount = 0;
    sync.fiber(function () {
        try {
            /*
            for (var i = 0; i < docInfo.length; i++) {               
                var draftDate = getTimeStamp();
                sync.await(oracle.sendApprovalDocument([req.body.userId, userChoiceId[0], userChoiceId[0], draftDate, docInfo[i]], sync.defer()));
                approvalDtlData.push({
                    'docNum': docInfo[i],
                    'status': '02',
                    'approvalNum': userId,
                    'approvalDate': draftDate,
                    'approvalComment': null,
                    'nextApprovalNum': userChoiceId[0]
                });
                sendCount += 1;
            }
            */
            var draftDate = getTimeStamp();
            sync.await(oracle.sendApprovalDocument([req.body.userId, userChoiceId[0], userChoiceId[0], draftDate, memo[0], docInfo[0]], sync.defer()));
            /*
            approvalDtlData.push({
                'docNum': docInfo[0],
                'status': '02',
                'approvalNum': userId,
                'approvalDate': draftDate,
                'approvalComment': null,
                'nextApprovalNum': userChoiceId[0]
            });
            */
            sendCount += 1;
            //sync.await(oracle.insertDocumentDtl(mlData, sync.defer())); -- DB저장(시연용)       
            if (propertiesConfig.isOperation == 'Y') sync.await(if3(mlData, token, docInfo, sync.defer()));
            //sync.await(oracle.approvalDtlProcess(approvalDtlData, '', sync.defer()));
            returnObj = { code: 200, docData: sendCount };
        
        } catch (e) {
            returnObj = { code: 200, error: e };
        } finally {
            res.send(returnObj);
        }
    });
    
});

function if3(mlData, token, docInfo, done) {
    sync.fiber(function () {
        try {
            //var deptCode = sync.await(oracle.selectDeptCode(docInfo[2], sync.defer()));

            var data = '' +
                '<?xml version="1.0" encoding="utf-8"?>' +
                '<Root>' +
                '<Parameters>' +
                '<Parameter id="gv_encryptToken" type="STRING">' + token + '</Parameter>' +
                '<Parameter id="WMONID" type="STRING">NXrGufbtBrq</Parameter>' +
                '<Parameter id="lginIpAdr" type="STRING">172.16.12.54</Parameter>' +
                '<Parameter id="userId" type="STRING">9999068</Parameter>' +
                '<Parameter id="userEmpNo" type="STRING">9999068</Parameter>' +
                '<Parameter id="userDeptCd" type="STRING">240065</Parameter>' +
                '<Parameter id="frstRqseDttm" type="STRING">20181217131508909</Parameter>' +
                '<Parameter id="rqseDttm" type="STRING">20181217131508909</Parameter>' +
                '<Parameter id="lngeClsfCd" type="STRING">ko-kr</Parameter>' +
                '<Parameter id="srnId" type="STRING">CTCTM107</Parameter>' +
                '<Parameter id="rqseSrvcNm" type="STRING">koreanre.co.ct.commonct.svc.CtCommonCheckSvc</Parameter>' +
                '<Parameter id="rqseMthdNm" type="STRING">saveTmpAcList</Parameter>' +
                '<Parameter id="rqseVoNm" type="STRING">koreanre.co.ct.commonct.vo.CtCommonCheckVO</Parameter>' +
                '</Parameters>' +
                '<Dataset id="saveTmpAcList">' +
                '<ColumnInfo>' +
                '<Column id="imgId" type="STRING" size="18"/>' +
                '<Column id="imgFileStNo" type="STRING" size="3"/>' +
                '<Column id="imgFileEndNo" type="STRING" size="3"/>' +
                '<Column id="rmk" type="STRING" size="4000"/>' +
                '<Column id="saOcrnCycCd" type="STRING" size="3"/>' +
                '<Column id="iwowDvCd" type="STRING" size="1"/>' +
                '<Column id="fy" type="STRING" size="4"/>' +
                '<Column id="appYrmm" type="STRING" size="6"/>' +
                '<Column id="deptCd" type="STRING" size="6"/>' +
                '<Column id="secd" type="STRING" size="6"/>' +
                '<Column id="ctNo" type="STRING" size="14"/>' +
                '<Column id="curCd" type="STRING" size="3"/>' +
                '<Column id="rgstEmpNo" type="STRING" size="7"/>' +
                '<Column id="prinEmpNo" type="STRING" size="7"/>' +
                '<Column id="cscoSaRfrnCnnt2" type="STRING" size="200"/>' +
                '<Column id="pre" type="BIGDECIMAL" size="21"/>' +
                '<Column id="prePfinAmt" type="BIGDECIMAL" size="21"/>' +
                '<Column id="prePfoutAmt" type="BIGDECIMAL" size="21"/>' +
                '<Column id="xolPre" type="BIGDECIMAL" size="21"/>' +
                '<Column id="icpreOcpre" type="BIGDECIMAL" size="21"/>' +
                '<Column id="com" type="BIGDECIMAL" size="21"/>' +
                '<Column id="pfcom" type="BIGDECIMAL" size="21"/>' +
                '<Column id="brkg" type="BIGDECIMAL" size="21"/>' +
                '<Column id="txam" type="BIGDECIMAL" size="21"/>' +
                '<Column id="rtrcCom" type="BIGDECIMAL" size="21"/>' +
                '<Column id="cdnCnam" type="BIGDECIMAL" size="21"/>' +
                '<Column id="prrsCf" type="BIGDECIMAL" size="21"/>' +
                '<Column id="pfPrrsCf" type="BIGDECIMAL" size="21"/>' +
                '<Column id="prrsRls" type="BIGDECIMAL" size="21"/>' +
                '<Column id="pfPrrsRls" type="BIGDECIMAL" size="21"/>' +
                '<Column id="cla" type="BIGDECIMAL" size="21"/>' +
                '<Column id="lsRcvyAmt" type="BIGDECIMAL" size="21"/>' +
                '<Column id="cas" type="BIGDECIMAL" size="21"/>' +
                '<Column id="casRfn" type="BIGDECIMAL" size="21"/>' +
                '<Column id="lsresCf" type="BIGDECIMAL" size="21"/>' +
                '<Column id="lsresRls" type="BIGDECIMAL" size="21"/>' +
                '<Column id="claPfinAmt" type="BIGDECIMAL" size="21"/>' +
                '<Column id="claPfoutAmt" type="BIGDECIMAL" size="21"/>' +
                '<Column id="rsreInt" type="BIGDECIMAL" size="21"/>' +
                '<Column id="intTxam" type="BIGDECIMAL" size="21"/>' +
                '<Column id="spyCost" type="BIGDECIMAL" size="21"/>' +
                '<Column id="clamSno" type="INT" size="9" />' +
                '<Column id="rmk2" type="STRING" size="4000" />' +
                '<Column id="lsdt" type="DATE" size="0" />' +
                '</ColumnInfo> ' +
                '<Rows>';
            for (var i = 0; i < mlData.mlExportData.length; i++) {
                if (mlData.mlExportData[i][0] == 'Y') {
                    data += '' +
                        '<Row>' +
                        '<Col id="imgId">' + mlData.mlDocNum + '</Col>';
                    if (mlData.mlExportData[i][9] != '') data += '<Col id="imgFileStNo">' + mlData.mlExportData[i][9] + '</Col>';
                    if (mlData.mlExportData[i][10] != '') data += '<Col id="imgFileEndNo">' + mlData.mlExportData[i][10] + '</Col>';
                    if (mlData.mlExportData[i][1] != '') data += '<Col id="rmk">' + mlData.mlExportData[i][1] + '</Col>';
                    if (mlData.mlExportData[i][11] != '') data += '<Col id="saOcrnCycCd">' + mlData.mlExportData[i][11] + '</Col>';
                    data += '<Col id="iwowDvCd">1</Col>';
                    if (mlData.mlExportData[i][4] != '') data += '<Col id="fy">' + mlData.mlExportData[i][4] + '</Col>';
                    if (docInfo[1] != '') data += '<Col id="appYrmm">' + docInfo[1] + '</Col>';
                    //if (deptCode[0].DEPT_CD != '') data +='<Col id="deptCd">' + deptCode[0].DEPT_CD + '</Col>';
                    if ('308000' != '') data +='<Col id="deptCd">308000</Col>';
                    if ('308010' != '') data +='<Col id="secd">308010</Col>';
                    if (mlData.mlExportData[i][5] != '') data +='<Col id="ctNo">' + mlData.mlExportData[i][5] + '</Col>';
                    if (mlData.mlExportData[i][12] != '') data +='<Col id="curCd">' + mlData.mlExportData[i][12] + '</Col>' ;
                    //if ('2019000' != '') data +='<Col id="rgstEmpNo">2019000</Col>';
                    //if (docInfo[3] != '') data +='<Col id="prinEmpNo">' + docInfo[3] + '</Col>';
                    if (mlData.mlExportData[i][44] != '') data +='<Col id="cscoSaRfrnCnnt2">' + mlData.mlExportData[i][44].replace(/ /gi, '&#32;') + '</Col>';
                    if (mlData.mlExportData[i][18] != '') data += '<Col id="pre">' + mlData.mlExportData[i][18] + '</Col>';
                    if (mlData.mlExportData[i][19] != '') data +='<Col id="prePfinAmt">' + mlData.mlExportData[i][19] + '</Col>';
                    if (mlData.mlExportData[i][20] != '') data += '<Col id="prePfoutAmt">' + mlData.mlExportData[i][20] + '</Col>';
                    if (mlData.mlExportData[i][21] != '') data += '<Col id="xolPre">' + mlData.mlExportData[i][21] + '</Col>';
                    if (mlData.mlExportData[i][22] != '') data += '<Col id="icpreOcpre">' + mlData.mlExportData[i][22] + '</Col>';
                    if (mlData.mlExportData[i][23] != '') data += '<Col id="com">' + mlData.mlExportData[i][23] + '</Col>';
                    if (mlData.mlExportData[i][24] != '') data += '<Col id="pfcom">' + mlData.mlExportData[i][24] + '</Col>';
                    if (mlData.mlExportData[i][25] != '') data += '<Col id="brkg">' + mlData.mlExportData[i][25] + '</Col>';
                    if (mlData.mlExportData[i][26] != '') data += '<Col id="txam">' + mlData.mlExportData[i][26] + '</Col>';
                    if (mlData.mlExportData[i][27] != '') data += '<Col id="rtrcCom">' + mlData.mlExportData[i][27] + '</Col>';
                    if (mlData.mlExportData[i][28] != '') data += '<Col id="cdnCnam">' + mlData.mlExportData[i][28] + '</Col>';
                    if (mlData.mlExportData[i][29] != '') data += '<Col id="prrsCf">' + mlData.mlExportData[i][29] + '</Col>';
                    if (mlData.mlExportData[i][30] != '') data += '<Col id="pfPrrsCf">' + mlData.mlExportData[i][30] + '</Col>';
                    if (mlData.mlExportData[i][31] != '') data += '<Col id="prrsRls">' + mlData.mlExportData[i][31] + '</Col>';
                    if (mlData.mlExportData[i][32] != '') data += '<Col id="pfPrrsRls">' + mlData.mlExportData[i][32] + '</Col>';
                    if (mlData.mlExportData[i][33] != '') data += '<Col id="cla">' + mlData.mlExportData[i][33] + '</Col>';
                    if (mlData.mlExportData[i][34] != '') data += '<Col id="lsRcvyAmt">' + mlData.mlExportData[i][34] + '</Col>';
                    if (mlData.mlExportData[i][35] != '') data += '<Col id="cas">' + mlData.mlExportData[i][35] + '</Col>';
                    if (mlData.mlExportData[i][36] != '') data += '<Col id="casRfn">' + mlData.mlExportData[i][36] + '</Col>';
                    if (mlData.mlExportData[i][37] != '') data += '<Col id="lsresCf">' + mlData.mlExportData[i][37] + '</Col>';
                    if (mlData.mlExportData[i][38] != '') data += '<Col id="lsresRls">' + mlData.mlExportData[i][38] + '</Col>';
                    if (mlData.mlExportData[i][39] != '') data += '<Col id="claPfinAmt">' + mlData.mlExportData[i][39] + '</Col>';
                    if (mlData.mlExportData[i][40] != '') data += '<Col id="claPfoutAmt">' + mlData.mlExportData[i][40] + '</Col>';
                    if (mlData.mlExportData[i][41] != '') data += '<Col id="rsreInt">' + mlData.mlExportData[i][41] + '</Col>';
                    if (mlData.mlExportData[i][42] != '') data += '<Col id="intTxam">' + mlData.mlExportData[i][42] + '</Col>';
                    if (mlData.mlExportData[i][43] != '') data += '<Col id="spyCost">' + mlData.mlExportData[i][43] + '</Col>';
                    if (mlData.mlExportData[i][6] != '') data += '<Col id="clamSno">' + mlData.mlExportData[i][6] + '</Col>';
                    if (mlData.mlExportData[i][8] != '') data += '<Col id="rmk2">' + mlData.mlExportData[i][8] + '</Col>';
                    if (mlData.mlExportData[i][7] != '') data += '<Col id="lsdt">' + mlData.mlExportData[i][7] + '</Col>';

                    data += '</Row>';
                }
            }
            data += '' +
                '</Rows>' +
                '</Dataset>' +
                '</Root>';

            var res1 = request('POST', 'http://solomon.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', {
                headers: {
                    'content-type': 'text/xml'
                },
                body: data
            });
            var ifData = res1.getBody('utf8');

            if (ifData == null) {
                console.log("IF3 실패...");
            } else {
                parser.parseString(ifData, function (err, result) {
                    //console.log(result.Root.Parameters[0].Parameter);
                    return done(null, null);
                });
            }

        } catch (err) {
            console.log(err);
            return done(null, err);
        } finally {

        }
    });
}

//문서전달
router.post('/sendDocument', function (req, res) {
    var returnObj = {};
    var sendCount = 0;

    try {
        for (var i = 0; i < req.body.docInfo.length; i++) {
            sync.fiber(function () {
                sync.await(oracle.sendDocument([req.body.userId[0], req.body.userId[0], req.body.docInfo[i].deadline, req.body.memo[i], req.body.docInfo[i].docNum], sync.defer()));
            });
            sendCount += 1;
        }
        returnObj = { code: 200, docData: sendCount };
    } catch (e) {
        console.log(e);
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
    //console.log("SELECT문에 삽입될 IMGID 값 : " + inputDocNum2);
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
    var docNum = req.body.docNum;
    sync.fiber(function () {
        try {
            var result = sync.await(oracle.selectOcrFileDtl(docNum, sync.defer()));
            //var result = sync.await(oracle.selectApprovalMasterFromDocNum(docNum, sync.defer()));
            returnObj = { code: 200, docData: result, fileRootPath: appRoot + '\\uploads\\'  };
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
    var path = filePath.substr(0, filePath.lastIndexOf("\\") + 1);
    var dimensions = sizeOf(path + fileName);
    sync.fiber(function () {
        try {
            console.time("mlTime");
            pythonConfig.columnMappingOptions.args = [];
            pythonConfig.columnMappingOptions.args.push(dimensions.width);
            pythonConfig.columnMappingOptions.args.push(dimensions.height);
            pythonConfig.columnMappingOptions.args.push(JSON.stringify(ocrData));
            var resPyStr = sync.await(PythonShell.run('uiClassify.py', pythonConfig.columnMappingOptions, sync.defer()));
            var resPyArr = JSON.parse(resPyStr[0]);

            resPyArr = sync.await(transPantternVar.trans(resPyArr, sync.defer()));

            var colMappingList = sync.await(oracle.selectColumn(req, sync.defer()));
            var entryMappingList = sync.await(oracle.selectEntryMappingCls(req, sync.defer()));
            console.timeEnd("mlTime");
            returnObj = { code: 200, 'fileName': fileName, 'data': resPyArr, 'column': colMappingList, 'entryMappingList': entryMappingList };
        } catch (e) {
            console.log(e);
            console.log(resPyStr);
            returnObj = { 'code': 500, 'message': e };

        } finally {
            res.send(returnObj);
        }

    });
});

router.post('/refuseDoc', function (req, res) {
    var refuseType = req.body.refuseType;
    var docNumArr = req.body.docNumArr;
    var memoArr = req.body.memoArr;
    var returnObj;

    sync.fiber(function () {
        try {
            sync.await(oracle.updateApprovalMaster([refuseType, docNumArr, memoArr], sync.defer()));

            returnObj = { code: 200, data: 'refuse success'};
        } catch (e) {
            console.log(resPyStr);
            returnObj = { 'code': 500, 'message': e };

        } finally {
            res.send(returnObj);
        }

    });
});

function getTimeStamp() {
    var d = new Date();

    var s =
        leadingZeros(d.getFullYear(), 4) + '-' +
        leadingZeros(d.getMonth() + 1, 2) + '-' +
        leadingZeros(d.getDate(), 2) + ' ' +

        leadingZeros(d.getHours(), 2) + ':' +
        leadingZeros(d.getMinutes(), 2) + ':' +
        leadingZeros(d.getSeconds(), 2);

    return s;
}

function leadingZeros(n, digits) {
    var zero = '';
    n = n.toString();

    if (n.length < digits) {
        for (var i = 0; i < digits - n.length; i++)
            zero += '0';
    }
    return zero + n;
}

module.exports = router;