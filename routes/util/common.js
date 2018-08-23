﻿'use strict';

var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var request = require('request');
var propertiesConfig = require(appRoot + '/config/propertiesConfig.js');
var queryConfig = require(appRoot + '/config/queryConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
var sync = require('../util/sync.js');
var oracle = require('../util/oracle.js');

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

router.post('/modifyTextData', function (req, res) {
    var beforeData = req.body.beforeData;
    var afterData = req.body.afterData;
    var beforeOgAndCtnm = [];
    var afterOgAndCtnm = [];
    var returnObj;

    sync.fiber(function () {
        try {
            for (var i in afterData.data) {
                if (afterData.data[i].colLbl == 0 || afterData.data[i].colLbl == 1) { // ogCompany or contractName 
                    for (var j in beforeData.data) {
                        if (afterData.data[i].location == beforeData.data[j].location) {

                            if (isWordLengthMatch(afterData.data[i], beforeData.data[j])) { // text length difference is less than 2
                                sync.await(oracle.insertOcrSymspell([afterData.data[i]], sync.defer()));
                            } else {
                                beforeOgAndCtnm.push(beforeData.data[j]);
                                afterOgAndCtnm.push(afterData.data[i]);
                            }

                        }
                    }
                } else if (afterData.data[i].colLbl == 4) {// currency code
                    for (var j in beforeData.data) {
                        if (afterData.data[i].location == beforeData.data[j].location) {

                            sync.await(oracle.insertOcrSymspellForCurcd([afterData.data[i], beforeData.data[j]], sync.defer()));

                        }
                    }
                }
            }

            var params = convertContractMappingData(beforeOgAndCtnm, afterOgAndCtnm);
            if (params) {
                for (var i in params) {
                    var item = [params[i][0], params[i][1], params[i][2], params[i][3]];
                    sync.await(oracle.insertContractMapping(item, sync.defer()));
                }
            }
            returnObj = { code: 200, message: 'modify textData success' };

        } catch (e) {
            returnObj = { code: 500, error: e };
        } finally {
            res.send(returnObj);
        }
    });
});

router.post('/selectTypoData', function (req, res) {
    var data = req.body.data;
    var ogCompanyName = [];
    var ctnm = [];
    var curcd = [];
    var returnObj;

    sync.fiber(function () {
        try {
            for (var i in data) {

            }

            returnObj = { code: 200, message: 'select tyop Data success' };
        } catch (e) {
            returnObj = { code: 500, error: e };
        } finally {
            res.send(returnObj);
        }
    });
});

// [POST] OCR API (request binary data)
router.post('/ocr', function (req, res) {
    var fileName = req.body.fileName;

    fs.readFile('./uploads/' + fileName, function (err, data) {
        if (err) res.send({ error: '파일이 없습니다.' }); // fs error

        var buffer;
        try {
            var base64 = new Buffer(data, 'binary').toString('base64');
            var binaryString = new Buffer(base64, 'base64').toString('binary');
            buffer = new Buffer(binaryString, "binary");
        } catch (e) {
            res.send({ error: '파일 읽기 도중 버퍼 에러가 발생했습니다.' });
        } finally {
            if (!buffer) res.send({ error: '파일 버퍼가 비어있습니다.' });
        }

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
                    res.send(JSON.parse(body));
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

function isWordLengthMatch(afterDataItem, beforeDataItem) {
    var lengthDifference = afterDataItem.text.length - beforeDataItem.text.length;
    if (lengthDifference >= -1 && lengthDifference <= 1) {
        return true;
    } else {
        return false;
    }
}

function convertContractMappingData(beforeOgAndCtnm, afterOgAndCtnm) {
    var extOgComapnyName = [];
    var extCtnm = [];
    var asOgComapnyName = [];
    var asCtnm = [];
    var OgCount = 0;
    var ctnmcount = 0;
    var returnArray = [];

    // ogComapanyName And contractName count
    for (var i in afterOgAndCtnm) {
        if (afterOgAndCtnm[i].colLbl == 0) {
            OgCount++;
        }
    }
    ctnmcount = afterOgAndCtnm.length - OgCount;

    if (OgCount == 1 || ctnmcount == 1) { // not N:N (case 1:1, 1:N, N:1)

        // add an array of before modifying data (ogComapanyName And contractName)
        for (var i in beforeOgAndCtnm) {
            for (var j in afterOgAndCtnm) {
                if (beforeOgAndCtnm[i].location == afterOgAndCtnm[j].location && afterOgAndCtnm[i].colLbl == 0) {
                    extOgComapnyName.push(beforeOgAndCtnm[i].text);
                    break;
                } else if (beforeOgAndCtnm[i].location == afterOgAndCtnm[j].location && afterOgAndCtnm[i].colLbl == 1) {
                    extCtnm.push(beforeOgAndCtnm[i].text);
                    break;
                }
            }
        }

        // add an array of after modifying data (ogComapanyName And contractName)
        for (var i in afterOgAndCtnm) {
            if (afterOgAndCtnm[i].colLbl == 0) {
                asOgComapnyName.push(afterOgAndCtnm[i].text);
            } else {
                asCtnm.push(afterOgAndCtnm[i].text);
            }
        }

        // determining relationships (1:1 or 1:N or N:N)
        if (asOgComapnyName.length == asCtnm.length) { // 1:1
            returnArray = [[extOgComapnyName[0], extCtnm[0], asOgComapnyName[0], asCtnm[0]]];
        } else if (asOgComapnyName.length < asCtnm.length) { // 1:N
            for (var i in asCtnm) {
                returnArray.push([extOgComapnyName[0], extCtnm[i], asOgComapnyName[0], asCtnm[i]]);
            }
        } else { // N:1
            for (var i in asOgComapnyName) {
                returnArray.push([extOgComapnyName[i], extCtnm[0], asOgComapnyName[i], asCtnm[0]]);
            }
        }

        return returnArray;

    } else { // N:N
        return null;
    }
}

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

// [POST] 헤더 사용자관리 팝업 패스워드 비교
var callbackHeaderUserPopSelectPw = function (rows, req, res) {
    res.send({ code: 200, cnt: rows });
};
router.post('/headerUserPopSelectPw', function (req, res) {
    var condQuery = ` WHERE USERID = '${req.session.userId}' AND USERPW = '${req.body.userPw}' `;
    var query = queryConfig.userMngConfig.headerUserPopSelectPw + condQuery;
    commonDB.reqQuery(query, callbackHeaderUserPopSelectPw, req, res);
});

// [POST] 헤더 사용자관리 팝업 패스워드 변경
var callbackHeaderUserPopChangePw = function (rows, req, res) {
    res.send({ code: 200, cnt: rows });
};
router.post('/headerUserPopChangePw', function (req, res) {
    var condQuery = ` USERPW = '${req.body.userPw}' WHERE USERID = '${req.session.userId}' `;
    var query = queryConfig.userMngConfig.updateUser + condQuery;
    var param = [req.body.userPw, req.session.userId];
    commonDB.reqQuery(query, callbackHeaderUserPopChangePw, req, res);
});

// [POST] 레프트사이드바 계산서등록(반려된 수) 표시
var callbackLeftSideBarInvoiceRegistration = function (rows, req, res) {
    res.send({ code: 200, cnt: rows });
};
router.post('/leftSideBarInvoiceRegistration', function (req, res) {
    var param = [req.session.userId];
    commonDB.reqCountQueryParam(queryConfig.sessionConfig.leftSideBarInvoiceRegistration, param, callbackLeftSideBarInvoiceRegistration, req, res);
});

// [POST] 레프트사이드바 내결재(진행 수) 표시
var callbackLeftSideBarMyApproval = function (rows, req, res) {
    res.send({ code: 200, cnt: rows });
};
router.post('/leftSideBarMyApproval', function (req, res) {
    var param = [req.session.userId];
    commonDB.reqCountQueryParam(queryConfig.sessionConfig.leftSideBarMyApproval, param, callbackLeftSideBarMyApproval, req, res);
});

// [POST] Increase OCR COUNT
// ocrCount : 증가시킬 OCR COUNT
// userId : 사용자 ID
var callbackUpdateOcrCount = function (rows, req, res) {
    res.send({ code: 200, cnt: rows });
};
// server에서 호출하여 증가
var updateOcrCount = function (req, res, ocrCount) {
    var param = [ocrCount, req.session.userId];
    commonDB.reqQueryParam(queryConfig.sessionConfig.updateOcrCount, param, callbackUpdateOcrCount, req, res);
};
// client에서 호출하여 증가
router.post('/updateOcrCount', function (req, res) {
    var param = [req.body.ocrCount, req.session.userId];
    commonDB.reqQueryParam(queryConfig.sessionConfig.updateOcrCount, param, callbackUpdateOcrCount, req, res);
});

module.exports = router;
