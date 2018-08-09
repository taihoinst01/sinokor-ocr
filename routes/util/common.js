'use strict';

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

module.exports = router;
