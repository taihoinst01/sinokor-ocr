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
var pythonConfig = require(appRoot + '/config/pythonConfig');
var PythonShell = require('python-shell')
var sync = require('../util/sync.js');
var oracle = require('../util/oracle.js');
var execSync = require('sync-exec');

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, propertiesConfig.filepath.imagePath);
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

router.post('/imageUpload', upload.any(), function (req, res) {
    var files = req.files;
    var imagePath = propertiesConfig.filepath.imagePath;
    var convertedImagePath = propertiesConfig.filepath.convertedImagePath;
    var fileInfo = [];
    var returnObj = [];

    try {
        for (var i = 0; i < files.length; i++) {
            var fileObj = files[i];
            var fileExt = fileObj.originalname.split('.')[1];

            if (fileExt.toLowerCase() === 'tif' || fileExt.toLowerCase() === 'jpg') {
                var fileItem = {
                    imgId: new Date().isoNum(8) + "" + Math.floor(Math.random() * 9999999) + 1000000,
                    filePath: fileObj.path,
                    oriFileName: fileObj.originalname,
                    convertedFilePath: convertedImagePath,
                    convertFileName: fileObj.originalname.split('.')[0] + '.jpg',
                    fileExt: fileExt,
                    fileSize: fileObj.size,
                    contentType: fileObj.mimetype,
                    svrFileName: imagePath + '\\' + fileObj.originalname
                };
                fileInfo.push(fileItem);

                var fileNames = [];
                returnObj.push(fileItem.convertFileName);

                var ifile = imagePath + '\\' + fileObj.originalname;
                var ofile = 'uploads\\' + fileObj.originalname.split('.')[0] + '.jpg';
                var result = execSync('module\\imageMagick\\convert.exe -density 800x800 ' + ifile + ' ' + ofile);
                if (result.status != 0) {
                    throw new Error(result.stderr);
                }
            }
        }
        res.send({ code: 200, message: returnObj, fileInfo: fileInfo, type: 'image' });
    } catch (e) {
        console.log(e);
        res.send({ code: 500, message: [], error: e });
    }


    /*
    for (var i = 0; i < files.length; i++) {
        if (files[i].originalname.split('.')[1].toLowerCase() === 'tif' ||
            files[i].originalname.split('.')[1].toLowerCase() === 'tiff') {
            var fileObj = files[i]; // 파일
            var oriFileName = fileObj.originalname; // 파일 원본명
            var filePath = fileObj.path;    // 파일 경로
            var ifile = filePath;
            var ofile = "/uploads/" + oriFileName.split('.')[0] + '.jpg';
            // 파일 정보 추출
            //var imgId = Math.random().toString(36).slice(2); // TODO : 임시로 imgId 생성
            var d = new Date();
            var imgId = d.isoNum(8) + "" + Math.floor(Math.random() * 9999999) + 1000000;
            //console.log("생성한 imgId와 길이 : " + imgId + " : " + imgId.length);

            //var filePath = ifile;    // 파일 경로

            var _lastDot = oriFileName.lastIndexOf('.');
            var fileExt = oriFileName.substring(_lastDot + 1, oriFileName.length).toLowerCase();        // 파일 확장자
            var fileSize = fileObj.size;  // 파일 크기
            var contentType = fileObj.mimetype; // 컨텐트타입
            var svrFileName = Math.random().toString(26).slice(2);  // 서버에 저장될 랜덤 파일명

            var fileParam = {
                imgId: imgId,
                filePath: filePath,
                oriFileName: oriFileName,
                convertFileName: ofile.split('.')[0] + '.jpg',
                fileExt: fileExt,
                fileSize: fileSize,
                contentType: contentType,
                svrFileName: svrFileName
            };

            //console.log(`file Info : ${JSON.stringify(fileParam)}`);
            fileInfo.push(fileParam);
            returnObj.push(oriFileName.split('.')[0] + '.jpg');

            exec('module\\imageMagick\\convert.exe -density 800x800 ' + ifile + ' ' + ofile, function (err, out, code) {
                if (endCount === files.length - 1) {
                    res.send({ code: 200, message: returnObj, fileInfo: fileInfo, type: 'image' });
                }
                endCount++;
            });
        } else if (files[i].originalname.split('.')[1].toLowerCase() === 'jpg') {

        }
    }
    */
});

router.post('/modifyTextData', function (req, res) {
    var beforeData = req.body.beforeData;
    var afterData = req.body.afterData;
    var returnObj;
    sync.fiber(function () {
        try {
            
            for (var i in afterData.data) {
                for (var j in beforeData.data) {
                    if (afterData.data[i].location == beforeData.data[j].location) {
                        //사용자가 글자를 직접 수정한 경우 TBL_CONTRACT_MAPPING에 insert
                        if (afterData.data[i].text != beforeData.data[j].text) {
                            var item = [beforeData.data[j].originText, '', afterData.data[i].text, ''];
                            sync.await(oracle.insertContractMapping(item, sync.defer()));
                        }
                        //사용자가 지정한 컬럼라벨의 텍스트가 유효한 컬럼의 경우 OcrSymspell에 before text(중요!!) insert
                        if (afterData.data[i].colLbl >= 3 && afterData.data[i].colLbl <= 34) {
                            sync.await(oracle.insertOcrSymsSingle(beforeData.data[j], sync.defer()));
                        }
                        afterData.data[i].sid = sync.await(oracle.selectSid(beforeData.data[j], sync.defer()));
                        //라벨이 변경된 경우만 트레이닝 insert
                        if (afterData.data[i].colLbl != beforeData.data[j].colLbl) {
                            sync.await(oracle.insertColumnMapping(afterData.data[i], sync.defer()));
                        }
                    } 
                }
            }
            
            pythonConfig.columnMappingOptions.args = [];
            pythonConfig.columnMappingOptions.args = ["training"];
    
            sync.await(PythonShell.run('columnClassicify.py', pythonConfig.columnMappingOptions, sync.defer()));
            //sync.await(PythonShell.run('columnClassicifyFromAzure.py', pythonConfig.columnMappingOptions, sync.defer())); //azure

            // for (var i in afterData.data) {
            //     if (afterData.data[i].colLbl == 0 || afterData.data[i].colLbl == 1) { // ogCompany or contractName 
            //         for (var j in beforeData.data) {
            //             if (afterData.data[i].location == beforeData.data[j].location) {

            //                 if (isWordLengthMatch(afterData.data[i], beforeData.data[j])) { // text length difference is less than 2
            //                     sync.await(oracle.insertOcrSymspell([afterData.data[i]], sync.defer()));
            //                 } else {
            //                     beforeOgAndCtnm.push(beforeData.data[j]);
            //                     afterOgAndCtnm.push(afterData.data[i]);
            //                 }

            //             }
            //         }
            //     } else if (afterData.data[i].colLbl == 3) {// currency code
            //         for (var j in beforeData.data) {
            //             if (afterData.data[i].location == beforeData.data[j].location && afterData.data[i].text != beforeData.data[j].text) {
            //                 sync.await(oracle.insertOcrSymspellForCurcd([afterData.data[i], beforeData.data[j]], sync.defer()));
            //             }
            //         }
            //     } else if (afterData.data[i].colLbl != 37 && (afterData.data[i].colLbl >= 4 && afterData.data[i].colLbl <= 38)) {
            //         for (var j in beforeData.data) {
            //             if (afterData.data[i].location == beforeData.data[j].location) {
            //                 if (afterData.data[i].text.toLowerCase() != beforeData.data[j].text.toLowerCase()) { // text length difference is less than 2
            //                     sync.await(oracle.insertOcrSymspell([afterData.data[i]], sync.defer()));
            //                 }
            //             }
            //         }
            //     }
            // }

            // var params = convertContractMappingData(beforeOgAndCtnm, afterOgAndCtnm);
            // if (params) {
            //     for (var i in params) {
            //         var item = [params[i][0], params[i][1], params[i][2], params[i][3]];
            //         sync.await(oracle.insertContractMapping(item, sync.defer()));
            //     }
            // }
            returnObj = { code: 200, message: 'modify textData success' };

        } catch (e) {
            console.log(e);
            returnObj = { code: 500, error: e };
        } finally {
            res.send(returnObj);
        }
    });
});

router.post('/selectTypoData', function (req, res) {
    var data = req.body.data.data;
    var ogCompanyName = [];
    var ctnm = [];
    var curcd = [];
    var returnObj;

    sync.fiber(function () {
        try {
            for (var i in data) {
                if (data[i].colLbl == 0) {
                    ogCompanyName.push(data[i]);
                } else if (data[i].colLbl == 1) {
                    ctnm.push(data[i]);
                } else if (data[i].colLbl == 3) {
                    curcd.push(data[i]);
                }
            }
            if (ogCompanyName.length > ctnm.length) { // N:1
                for (var i = 1; i < ogCompanyName.length; i++) ctnm.push(ctnm[0]);
            } else if (ogCompanyName.length > ctnm.length) { // 1:N
                for (var i = 1; i < ctnm.length; i++) ogCompanyName.push(ogCompanyName[0]);
            }

            // select tbl_contract_mapping And save modified text data (ogCompanyName, contractName)
            for (var i in ogCompanyName) {
                var result = sync.await(oracle.selectContractMapping2([ogCompanyName[i].text, ctnm[i].text], sync.defer()));
                if (result) {
                    ogCompanyName[i].text = result.ASOGCOMPANYNAME;
                    ctnm[i].text = result.ASCTNM;
                }
            }

            // select tbl_curcd_mapping And save modified text data (curcd)
            for (var i in curcd) {
                var result = sync.await(oracle.selectCurcdMapping(curcd[i].text, sync.defer()));
                if (result) {
                    curcd[i].text = result.AFTERTEXT;
                }
            }

            // save modified text data to return data
            for (var i in data) {
                if (data[i].colLbl == 0 || data[i].colLbl == 1) {
                    for (var j in ogCompanyName) {
                        if (data[i].location == ogCompanyName[j].location) {
                            data[i].text = ogCompanyName[j].text;
                        }
                    }
                } else if (data[i].colLbl == 3) {
                    for (var j in curcd) {
                        if (data[i].location == curcd[j].location) {
                            data[i].text = curcd[j].text;
                        }
                    }
                }
            }

            returnObj = { code: 200, data: data };
        } catch (e) {
            console.log(e);
            returnObj = { code: 500, error: e };
        } finally {
            res.send(returnObj);
        }
    });
});

router.post('/selectTypoData2', function (req, res) {
    var data = req.body.data.data;
    var ogCompanyName = [];
    var ctnm = [];
    var curcd = [];
    var returnObj;

    sync.fiber(function () {
        try {
            for (var i in data) {
                let result = sync.await(oracle.selectDomainDict([data[i].text], sync.defer()));
                if(result) {
                    data[i].text = result;
                }
            }

            returnObj = { code: 200, data: data };
        } catch (e) {
            console.log(e);
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
        if (err) { // fs error
            console.log(err);
            res.send({ code: 404, error: '파일이 없습니다.' });
        } else {

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
                        res.send(ocrParsing(body));
                    }
                }
            });
        }
    });
});

//pass => 한글 English 1234567890 <>,.!@#$%^&*()~`-+_=|;:?/ lid => Iñtërnâtiônàlizætiøn☃
//send전 parsing 된 array 중 text안에 {}[]'" 있을 경우 삭제
function ocrParsing(body) {
    var data = [];

    try {
        var body = JSON.parse(body);

        // ocr line parsing
        for (var i = 0; i < body.regions.length; i++) {
            for (var j = 0; j < body.regions[i].lines.length; j++) {
                var item = '';
                for (var k = 0; k < body.regions[i].lines[j].words.length; k++) {
                    item += body.regions[i].lines[j].words[k].text + ' ';
                }
                data.push({ 'location': body.regions[i].lines[j].boundingBox, 'text': item.trim() });
            }
        }

        // ocr x location parsing
        var xInterval = 3; // x pixel value

        for (var i = 0; i < data.length; i++) {
            for (var j = i + 1; j < data.length; j++) {
                var targetLocArr = data[i].location.split(',');
                var compareLocArr = data[j].location.split(',');
                var width = Number(targetLocArr[0]) + Number(targetLocArr[2]); // target text width
                var textSpacing = Math.abs(Number(compareLocArr[0]) - width) // spacing between target text and compare text

                if (textSpacing <= xInterval && compareLocArr[1] == targetLocArr[1]) {
                    data[i].location = targetLocArr[0] + ',' + targetLocArr[1] + ',' +
                        (Number(targetLocArr[2]) + Number(compareLocArr[2]) + textSpacing) + ',' + targetLocArr[3];
                    data[i].text += ' ' + data[j].text;
                    data.splice(j, 1);
                }
            }
        }

        // ocr text Unknown character parsing
        var ignoreChar = [ '"'.charCodeAt(0), '\''.charCodeAt(0), '['.charCodeAt(0), ']'.charCodeAt(0),
            '{'.charCodeAt(0), '}'.charCodeAt(0) ];

        for (var i = 0; i < data.length; i++) {
            var modifyText = data[i].text;
            for (var j = 0; j < data[i].text.length; j++) {
                var ascii = data[i].text.charCodeAt(j);
                if (ascii > 127 || ignoreChar.indexOf(ascii) != -1) {
                    rep = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
                    if (!rep.test(data[i].text[j])) { // not Korean
                        rep = new RegExp(((ascii < 128)? '\\':'') + data[i].text[j], "gi");
                        modifyText = modifyText.replace(rep, '');
                    }
                }
            }
            data[i].text = modifyText;
        }

    } catch (e) {
        console.log(e);
        data = { 'error': e };
    } finally {
        return data;
    }
}

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
