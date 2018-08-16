'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var exec = require('child_process').exec;
var dbConfig = require(appRoot + '/config/dbConfig');
var queryConfig = require(appRoot + '/config/queryConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
var logger = require('../util/logger');
var aimain = require('../util/aiMain');
var PythonShell = require('python-shell');
var propertiesConfig = require(appRoot + '/config/propertiesConfig.js');
const FileHound = require('filehound');
const xlsx = require('xlsx');
var oracledb = require('oracledb');
var path = require('path');


var selectBatchLearningDataListQuery = queryConfig.batchLearningConfig.selectBatchLearningDataList;
var selectBatchLearningDataQuery = queryConfig.batchLearningConfig.selectBatchLearningData;
var insertTextClassification = queryConfig.uiLearningConfig.insertTextClassification;
var insertLabelMapping = queryConfig.uiLearningConfig.insertLabelMapping;
var selectLabel = queryConfig.uiLearningConfig.selectLabel;
var insertTypo = queryConfig.uiLearningConfig.insertTypo;
var insertDomainDic = queryConfig.uiLearningConfig.insertDomainDic;
var selectTypo = queryConfig.uiLearningConfig.selectTypo;
var updateTypo = queryConfig.uiLearningConfig.updateTypo;
var selectBatchAnswerFile = queryConfig.batchLearningConfig.selectBatchAnswerFile;
var selectBatchAnswerDataToImgId = queryConfig.batchLearningConfig.selectBatchAnswerDataToImgId;

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
// BLANK CALLBACK
var callbackBlank = function () { };



// [POST] 배치학습데이터 이미지 데이터 조회 
router.post('/viewImageData', function (req, res) {
    if (req.isAuthenticated()) fnViewImageData(req, res);
});
var callbackViewImageData = function (rows, req, res) {
    console.log("rows : " + JSON.stringify(rows));
    if (req.isAuthenticated()) res.send(rows);
}
var fnViewImageData = function (req, res) {
    console.log("filePath : " + req.body.filePath);
    var data = [req.body.filePath];
    var query = queryConfig.batchLearningConfig.selectViewImageData;
    commonDB.reqQueryParam(query, data, callbackViewImageData, req, res);
}



// [POST] 배치학습데이터리스트 조회 
router.post('/searchBatchLearnDataList', function (req, res) {   
    if (req.isAuthenticated()) fnSearchBatchLearningDataList(req, res);
}); 
var callbackBatchLearningDataList = function (rows, req, res) {    
    if (req.isAuthenticated()) res.send(rows);
}
var fnSearchBatchLearningDataList = function (req, res) {
    // 조건절
    var condQuery = "";
    var orderQuery = " ORDER BY A.regDate DESC, LENGTH(F.originFileName) ASC, F.originFileName ASC";
    if (!commonUtil.isNull(req.body.addCond)) {
        if (req.body.addCond == "LEARN_N") condQuery = " AND A.status != 'Y' ";
        else if (req.body.addCond == "LEARN_Y") condQuery = " AND A.status = 'Y' ";
    }
    // LIMIT
    var listQuery = selectBatchLearningDataListQuery + condQuery + orderQuery;
    if (!commonUtil.isNull(req.body.startNum) || !commonUtil.isNull(req.body.moreNum)) {
        listQuery = "SELECT T.* FROM (" + listQuery + ") T WHERE rownum BETWEEN " + req.body.startNum + " AND " + req.body.moreNum;
    }
  

	console.log("리스트 조회 쿼리 : " + listQuery);
    commonDB.reqQuery(listQuery, callbackBatchLearningDataList, req, res);
}


// [POST] 배치학습데이터 조회
router.post('/searchBatchLearnData', function (req, res) {   
    if (req.isAuthenticated()) fnSearchBatchLearningData(req, res);
}); 
var callbackSelectBatchAnswerDataToImgId = function (rows, req, res, fileInfoList, orderbyRows) {
    res.send({ code: 200, fileInfoList: fileInfoList, answerRows: orderbyRows, fileToPage: rows });
};
var callbackSelectBatchAnswerFile = function (rows, req, res, fileInfoList) {
    var orderbyRows = [];
    var imgIdArr = [];
    for (var i in fileInfoList) {
        for (var j in rows) {
            if (fileInfoList[i].oriFileName == rows[j].FILEPATH) {
                orderbyRows.push(rows[j]);
                break;
            }
        }
    }

    for (var i in rows) {
        if (imgIdArr.length == 0) {
            imgIdArr.push(rows[i].IMGID);
            continue;
        }
        for (var j in imgIdArr) {          
            if (rows[i].IMGID == imgIdArr[j]) {
                break;
            }
            if (j == imgIdArr.length - 1) {
                imgIdArr.push(rows[i].IMGID);
            }
        }
    }
    var condQuery = "";
    if (imgIdArr.length > 0) {
        condQuery = "(";
        for (var i in imgIdArr) {
            condQuery += "" + imgIdArr[i] + ((i == imgIdArr.length - 1) ? ")" : ",");
        }
    } else {
        condQuery = "(null)";
    }
    console.log(selectBatchAnswerDataToImgId + condQuery);
    commonDB.reqQueryF2param(selectBatchAnswerDataToImgId + condQuery, callbackSelectBatchAnswerDataToImgId, req, res, fileInfoList, orderbyRows);
    //res.send({ code: 200, fileInfoList: fileInfoList, answerRows: orderbyRows});
};
var callbackBatchLearningData = function (rows, req, res) {
    var fileInfoList = [];
	console.log("배치학습데이터 : " + rows.length);
    for (var i = 0, x = rows.length; i < x; i++) {
        var oriFileName = rows[i].ORIGINFILENAME;
        var _lastDot = oriFileName.lastIndexOf('.');
        var fileExt = oriFileName.substring(_lastDot + 1, oriFileName.length).toLowerCase();        // 파일 확장자
        var fileInfo = {
            imgId: rows[i].IMGID,
            filePath: rows[i].FILEPATH,
            oriFileName: rows[i].ORIGINFILENAME,
            svrFileName: rows[i].SERVERFILENAME,
            convertFileName: rows[i].ORIGINFILENAME.replace(rows[i].FILEEXTENSION, "jpg"),
            fileExt: rows[i].FILEEXTENSION,
            fileSize: rows[i].FILESIZE,
            contentType: rows[i].CONTENTTYPE ? rows[i].CONTENTTYPE : "",
            imgFileStNo: rows[i].IMGFILESTARTNO,
            imgFileEndNo: rows[i].IMGFILEENDNO,
            cscoNm: rows[i].CSCONM,
            ctNm: rows[i].CTNM,
            insStDt: rows[i].INSSTDT,
            insEndDt: rows[i].INSENDDT,
            curCd: rows[i].CURCD,
            pre: rows[i].PRE,
            com: rows[i].COM,
            brkg: rows[i].BRKG,
            txam: rows[i].TXAM,
            prrsCf: rows[i].PRRCF,
            prrsRls: rows[i].PRRSRLS,
            lsresCf: rows[i].LSRESCF,
            lsresRls: rows[i].LSRESRLS,
            cla: rows[i].CLA,
            exex: rows[i].EXEX,
            svf: rows[i].SVF,
            cas: rows[i].CAS,
            ntbl: rows[i].NTBL,
            cscoSaRfrnCnnt2: rows[i].CSCOSARFRNCNNT2,
            regId: rows[i].REGID,
            regDate: rows[i].REGDATE
        };
        fileInfoList.push(fileInfo);
    }

    // ANSWER
    var condQuery = "(";
    for (var i in rows) {
        var pathString = rows[i].FILEPATH;
        var pathArr = pathString.split('\\');
        condQuery += "'" + pathArr[pathArr.length - 1] + ((i == rows.length - 1) ? "')" : "',");
    }
    var answerQuery = selectBatchAnswerFile + condQuery;
    console.log("정답 파일 조회 쿼리 : " + answerQuery);
    commonDB.reqQueryF1param(answerQuery, callbackSelectBatchAnswerFile, req, res, fileInfoList);

    //res.send({ code: 200, fileInfoList: fileInfoList });
}
var fnSearchBatchLearningData = function (req, res) {
    var condition = " AND F.imgId IN (";
    for (var i = 0, x = req.body.imgIdArray.length; i < x; i++) {
        condition += "'" + req.body.imgIdArray[i] + "',";
    }
    condition = condition.slice(0, -1);
    condition += ")";
    var query = selectBatchLearningDataListQuery + condition;
	console.log("단건 조회 쿼리 : " + query);
    commonDB.reqQuery(query, callbackBatchLearningData, req, res);
}

// [POST] delete batchlearningdata (UPDATE)
var callbackDeleteBatchLearningData = function (rows, req, res) {
    if (req.isAuthenticated()) res.send({ code: 200, rows: rows });
};
router.post('/deleteBatchLearningData', function (req, res) {
    var condition = "(";
    for (var i = 0, x = req.body.imgIdArray.length; i < x; i++) {
        condition += "'" + req.body.imgIdArray[i] + "',";
    }
    condition = condition.slice(0, -1);
    condition += ")";
    var query = queryConfig.batchLearningConfig.deleteBatchLearningData + condition;
    commonDB.reqQuery(query, callbackDeleteBatchLearningData, req, res);
});

// 학습 엑셀 복사
router.post('/excelCopy', function (req, res) {
    var realExcelPath = propertiesConfig.filepath.realExcelPath;
    var files = fs.readdirSync(realExcelPath);
    var pathExcel, dataExcel;
    var tempPath1 = realExcelPath + path.sep + files[0];
    var tempPath2 = realExcelPath + path.sep + files[1];

    try {
        // 파일이 2개라는 것을 가정
        if (fs.statSync(tempPath1).size > fs.statSync(tempPath2).size) {
            dataExcel = tempPath1;
            pathExcel = tempPath2;
        } else {
            dataExcel = tempPath2;
            pathExcel = tempPath1;
        }

        fs.copyFileSync(dataExcel, appRoot + propertiesConfig.filepath.excelBatchFileData);
        fs.copyFileSync(pathExcel, appRoot + propertiesConfig.filepath.excelBatchFilePath);

        res.send({ code: 200, message: 'excel copy success' });
    } catch (e) {
        res.send({ code: 500, message: 'excel copy error'});
        console.error(e);
    }

});

// [POST] 엑셀 업로드
router.post('/excelUpload', upload.any(), function (req, res) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!! excelupload");
    // 엑셀 파일 확인
    var pathExcel = propertiesConfig.filepath.excelBatchFilePath;
    var dataExcel = propertiesConfig.filepath.excelBatchFileData;
    console.log(dataExcel);
    var pathExcelWorkbook = xlsx.readFile(pathExcel);
    var dataExcelWorkbook = xlsx.readFile(dataExcel);
    var pathExcelSheet = pathExcelWorkbook.Sheets[pathExcelWorkbook.SheetNames[0]];
    var dataExcelSheet = dataExcelWorkbook.Sheets[dataExcelWorkbook.SheetNames[0]];

    var pathResult = [];
    var pathRow;
    var pathRowNum;
    var pathColNum;
    var pathRange = xlsx.utils.decode_range(pathExcelSheet['!ref']);
    for (pathRowNum = pathRange.s.r; pathRowNum <= pathRange.e.r; pathRowNum++) {
        pathRow = [];
        for (pathColNum = pathRange.s.c; pathColNum <= pathRange.e.c; pathColNum++) {
            var nextCell = pathExcelSheet[
                xlsx.utils.encode_cell({ r: pathRowNum, c: pathColNum })
            ];
            if (typeof nextCell === 'undefined') {
                pathRow.push(void 0);
            } else pathRow.push(nextCell.w);
        }
        pathResult.push(pathRow);
    }
    var dataResult = [];
    var dataRow;
    var dataRowNum;
    var dataColNum;
    var dataRange = xlsx.utils.decode_range(dataExcelSheet['!ref']);
    for (dataRowNum = dataRange.s.r; dataRowNum <= dataRange.e.r; dataRowNum++) {
        dataRow = [];
        for (dataColNum = dataRange.s.c; dataColNum <= dataRange.e.c; dataColNum++) {
            var nextCell = dataExcelSheet[
                xlsx.utils.encode_cell({ r: dataRowNum, c: dataColNum })
            ];
            if (typeof nextCell === 'undefined') {
                dataRow.push(void 0);
            } else dataRow.push(nextCell.w);
        }
        dataResult.push(dataRow);
    }

    // insert filepath.xlsx 
    for (var i = 1, x = pathResult.length; i < x; i++) { // 첫번째 행은 무시
        if (!commonUtil.isNull(pathResult[i][0])) {
            var data = [];
            for (var j = 0, y = pathResult[i].length; j < y; j++) {
                data.push(commonUtil.nvl(pathResult[i][j]));
            }
            commonDB.queryNoRows(queryConfig.batchLearningConfig.insertBatchAnswerFile, data, callbackBlank);
        } else {
            continue;
        }
    }
    // insert data.xlsx
    for (var i = 1, x = dataResult.length; i < x; i++) { // 첫번째 행은 무시
        if (!commonUtil.isNull(dataResult[i][0])) {
            var data = [];
            for (var j = 0, y = dataResult[i].length; j < y; j++) {
                data.push(commonUtil.nvl(dataResult[i][j]));
            }
            console.log("data.. : " + JSON.stringify(data));
            commonDB.queryNoRows(queryConfig.batchLearningConfig.insertBatchAnswerData, data, callbackBlank);
        } else {
            continue;
        }
    }
    if (pathResult.length > 0 || dataResult.length > 0) {
        res.send({ code: 200, pathCnt: pathResult.length, dataCnt: dataResult.length });
    } else {
        res.send({ code: 300, pathCnt: 0, dataCnt: 0 });
    }
});

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
            //console.log("생성한 imgId와 길이 : " + imgId + " : " + imgId.length);
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
            //console.log("upload ifile : " + ifile + " : oFile : " + ofile);
            exec('module\\imageMagick\\convert.exe -density 800x800 ' + ifile + ' ' + ofile, function (err, out, code) {
                if (endCount === files.length - 1) { // 모든 파일 변환이 완료되면
                    res.send({ code: 200, message: returnObj, fileInfo: fileInfo, type: 'image' });
                }
                endCount++;
            });
        }
    }
});

// [POST] INSERT fileInfo (파일정보)
var callbackInsertFileInfo = function (rows, req, res) {
    //console.log("upload fileInfo finish..");
    res.send({ code: 200, rows: rows });
}
router.post('/insertFileInfo', function (req, res) {
    //console.log("insert FILE INFO : " + JSON.stringify(req.body.fileInfo));
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
    //console.log("입력 데이터 : " + JSON.stringify(data));
    commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertFileInfo, data, callbackInsertFileInfo, req, res);
});

// [POST] INSERT batchLearningBaseData (기본정보)
var callbackInsertBatchLearningBaseData = function (rows, req, res) {
    //console.log("upload batchLearningBaseData finish..");
    res.send({ code: 200, rows: rows });
}
router.post('/insertBatchLearningBaseData', function (req, res) {
    //console.log("insert BATCH LEARNING BASE DATA : " + JSON.stringify(req.body.fileInfo));
    var fileInfo = req.body.fileInfo;
    var imgId = fileInfo.imgId;
    var regId = req.session.userId;
    var data = [imgId, regId];
    commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertBatchLearningBaseData, data, callbackInsertBatchLearningBaseData, req, res);
});


// test ml - 18.08.16 hyj
router.get('/test', function (req, res) {
    var arg = [{ "location": "1018,240,411,87", "text": "APEX" }, { "location": "1019,338,409,23", "text": "Partner of Choice" }, { "location": "1562,509,178,25", "text": "Voucher No" }, { "location": "1562,578,206,25", "text": "Voucher Date" }, { "location": "206,691,274,27", "text": "4153 Korean Re" }, { "location": "208,756,525,34", "text": "Proportional Treaty Statement" }, { "location": "1842,506,344,25", "text": "BV/HEO/2018/05/0626" }, { "location": "1840,575,169,25", "text": "01105/2018" }, { "location": "206,848,111,24", "text": "Cedant" }, { "location": "206,908,285,24", "text": "Class of Business" }, { "location": "210,963,272,26", "text": "Period of Quarter" }, { "location": "207,1017,252,31", "text": "Period of Treaty" }, { "location": "206,1066,227,24", "text": "Our Reference" }, { "location": "226,1174,145,31", "text": "Currency" }, { "location": "227,1243,139,24", "text": "Premium" }, { "location": "226,1303,197,24", "text": "Commission" }, { "location": "226,1366,107,24", "text": "Claims" }, { "location": "227,1426,126,24", "text": "Reserve" }, { "location": "227,1489,123,24", "text": "Release" }, { "location": "227,1549,117,24", "text": "Interest" }, { "location": "227,1609,161,31", "text": "Brokerage" }, { "location": "233,1678,134,24", "text": "Portfolio" }, { "location": "227,1781,124,24", "text": "Balance" }, { "location": "574,847,492,32", "text": ": Solidarity- First Insurance 2018" }, { "location": "574,907,636,26", "text": ": Fire QS EQ 2018 W HOS BK UNI HTEL" }, { "location": "598,959,433,25", "text": "01-01-2018 TO 31-03-2018" }, { "location": "574,1010,454,25", "text": ": 01-01-2018 TO 31-12-2018" }, { "location": "574,1065,304,25", "text": ": APEX/BORD/2727" }, { "location": "629,1173,171,25", "text": "JOD 1.00" }, { "location": "639,1239,83,25", "text": "30.02" }, { "location": "639,1299,58,25", "text": "9.01" }, { "location": "639,1362,64,25", "text": "0.00" }, { "location": "639,1422,58,25", "text": "9.01" }, { "location": "639,1485,64,25", "text": "0.00" }, { "location": "639,1545,64,25", "text": "0.00" }, { "location": "639,1605,64,25", "text": "0.75" }, { "location": "648,1677,64,25", "text": "0.00" }, { "location": "1706,1908,356,29", "text": "APEX INSURANCE" }];

    aimain.typoSentenceEval(arg, function (typoResult) {
        arg = typoResult;
        console.log('execute typo ML');
        //console.log(arg);
        aimain.formLabelMapping(arg, function (formLabelResult) {
            var formLabelArr = formLabelResult.split('^');
            for (var i in formLabelArr) {
                for (var j in arg) {
                    if (formLabelArr[i].split('||')[0] == arg[j].sid) {
                        arg[j].formLabel = Number(formLabelArr[i].split('||')[1].replace(/\r\n/g,''));
                        break;
                    }
                }
            }
            console.log('execute formLabelMapping ML');
            //console.log(arg);
            aimain.formMapping(arg, function (formResult) {
                console.log('execute formMapping ML');
                arg = formResult;
                //console.log(arg);
                aimain.columnMapping(arg, function (columnResult) {
                    for (var i in columnResult) {
                        for (var j in arg.data) {
                            if (columnResult[i].split('||')[0] == arg.data[j].sid) {
                                arg.data[j].column = Number(columnResult[i].split('||')[1].replace(/\r\n/g, ''));
                                break;
                            }
                        }
                    }
                    console.log('execute columnMapping ML');
                    //console.log(arg);

                    // DB select (extraction OgCompanyName And ContractName)
                    var ctOgCompanyName = '';
                    var contractNames = []; // contractName Array
                    var exeQueryCount = 0; // query execute count 
                    var result = []; // function output
                    for (var i in arg.data) {
                        if (arg.data[i].formLabel == 1) {
                            ctOgCompanyName = arg.data[i].text;
                        } else if (arg.data[i].formLabel == 2) {
                            contractNames.push(arg.data[i].text);
                        } else {
                        }
                    }

                    for (var i in contractNames) {
                        commonDB.queryNoRows2(queryConfig.mlConfig.selectContractMapping, [ctOgCompanyName, contractNames[i]], function (rows) {
                            exeQueryCount++;
                            if (rows.length > 0) {
                                result = rows;
                            }
                            if (exeQueryCount == contractNames.length) {
                                arg.extOgAndCtnm = result;
                                res.send(arg);
                            }
                        });
                    }
                });
            });
        });
    })
});


// RUN batchLearningData
router.post('/execBatchLearningData', function (req, res) {
    var arg = req.body.data;

    // Machine Learning v1.2
    aimain.typoSentenceEval(arg, function (typoResult) {
        arg = typoResult;
        console.log('execute typo ML');
        //console.log(arg);
        aimain.formLabelMapping(arg, function (formLabelResult) {
            var formLabelArr = formLabelResult.split('^');
            for (var i in formLabelArr) {
                for (var j in arg) {
                    if (formLabelArr[i].split('||')[0] == arg[j].sid) {
                        arg[j].formLabel = Number(formLabelArr[i].split('||')[1].replace(/\r\n/g, ''));
                        break;
                    }
                }
            }
            console.log('execute formLabelMapping ML');
            //console.log(arg);
            aimain.formMapping(arg, function (formResult) {
                console.log('execute formMapping ML');
                arg = formResult;
                //console.log(arg);
                aimain.columnMapping(arg, function (columnResult) {
                    var columnArr = columnResult.split('^');
                    for (var i in columnArr) {
                        for (var j in arg.data) {
                            if (columnArr[i].split('||')[0] == arg.data[j].sid) {
                                arg.data[j].column = Number(columnArr[i].split('||')[1].replace(/\r\n/g, ''));
                                break;
                            }
                        }
                    }
                    console.log('execute columnMapping ML');
                    //console.log(arg);

                    // DB select (extraction OgCompanyName And ContractName)
                    var ctOgCompanyName = '';
                    var contractNames = []; // contractName Array
                    var exeQueryCount = 0; // query execute count 
                    var result = []; // function output
                    for (var i in arg.data) {
                        if (arg.data[i].formLabel == 1) {
                            ctOgCompanyName = arg.data[i].text;
                        } else if (arg.data[i].formLabel == 2) {
                            contractNames.push(arg.data[i].text);
                        } else {
                        }
                    }

                    for (var i in contractNames) {
                        commonDB.queryNoRows2(queryConfig.mlConfig.selectContractMapping, [ctOgCompanyName, contractNames[i]], function (rows) {
                            exeQueryCount++;
                            if (rows.length > 0) {
                                result = rows;
                            }
                            if (exeQueryCount == contractNames.length) {
                                arg.extOgAndCtnm = result;
                                res.send(arg);
                            }
                        });
                    }
                });
            });
        });
    })

    /* 
    // Machine Learning v.1.0
    aimain.typoSentenceEval(arg, function (result1) {
        console.log("typo ML");
        aimain.domainDictionaryEval(result1, function (result2) {
            console.log("domain ML");
            aimain.textClassificationEval(result2, function (result3) {
                console.log("text ML");
                aimain.labelMappingEval(result3, function (result4) {
                    //console.log("labelMapping Result : " + JSON.stringify(result4));
                    console.log("label ML");
                    aimain.statementClassificationEval(result4, function (result5) {
                        console.log("statement ML");
                        res.send(result5);
                    })
                })
            })
        })
    });
    */

    /*
    // Machine Learning v.1.1
    console.log("bill ML");
    aimain.billClassificationEval(arg, function (result1) {
        console.log(result1);

        aimain.labelClassificationEval(result1, function (result2) {

            //다중 계산서 처리
            if (result2.docCategory.DOCTYPE == 2) {
                var data = result2.data;
                var dataArr = [];

                for (var i in data) {
                    if (data[i].column == "CTNM2") {
                        var colData = [];
                        colData.push(data[i]);

                        var ctnmLoc = data[i].location.split(",");

                        for (var j in data) {
                            var loc = data[j].location.split(",");

                            if (data[j].column == "PAIDSHARE" && (Math.abs(ctnmLoc[1] - loc[1]) < 15)) {
                                colData.push(data[j]);
                            }

                            if (data[j].column == "OSLPERCENT" && (Math.abs(ctnmLoc[1] - loc[1]) < 15)) {
                                colData.push(data[j]);
                            }

                            if (data[j].column == "OSLSHARE" && (Math.abs(ctnmLoc[1] - loc[1]) < 15)) {
                                colData.push(data[j]);
                            }

                            if (data[j].column == "CURCD" && (Math.abs(ctnmLoc[1] - loc[1]) < 15)) {
                                colData.push(data[j]);
                            }
                        }
                        dataArr.push(colData);
                    }
                }

                result2.data = dataArr;
            }
            res.send(result2);
        });
        
    });
    */

});

router.post('/selectOcrSymSpell', function (req, res) {
    var data = req.body.data;
    var querycount = 0;
    console.log(data);
    console.log('시작');
    for (var i in data) {
        commonDB.reqQueryParam2(queryConfig.batchLearningConfig.selectExportSentenceSid, [data[i].text], function (rows, i, req, res) {
            console.log(querycount);
            querycount++;
            data[i].typoData = rows[0].WORD;
            if (querycount == data.length) {
                res.send({ code: 200, 'data': data });
            }
        }, i, req, res);
    }
});

var callbackSelDbColumns = function (rows, req, res) {
    res.send({ code : 200, data: rows });
};
router.post('/selectColMappingCls', function (req, res) {

    commonDB.reqQuery(queryConfig.dbcolumnsConfig.selectColMappingCls, callbackSelDbColumns, req, res);
});

router.post('/insertDocLabelMapping', function (req, res) {
    var data = req.body.data;
    var insertCount = 0;

    for (var i in data) {
        var item = data[i].x + ',' + data[i].y + ',' + data[i].word;
        commonDB.queryNoRows(queryConfig.mlConfig.insertDocLabelMapping, [item, data[i].label], function () {
            insertCount++;
            if (insertCount == data.length) {
                res.send({ code: 200, message: 'form label mapping insert' });
            }
        });
    }
    
});

var callbackInsertDocMapping = function (rows, req, res) {
    res.send({ code: 200, message: 'form mapping insert' });
};
router.post('/insertDocMapping', function (req, res) {
    var data = req.body.data;
    var docCategory = req.body.docCategory;

    var item = '';
    for (var i in data) {
        item += data[i].x + ',' + data[i].y + ',' + data[i].word;;
        item += (i == data.length - 1) ? '' : ',';
    }

    commonDB.reqQueryParam(queryConfig.mlConfig.insertDocMapping, [item, docCategory.DOCTYPE], callbackInsertDocMapping, req, res);
});

router.post('/insertColMapping', function (req, res) {
    var data = req.body.data;
    var docCategory = req.body.docCategory;
    var colMappingCount = 0;

    for (var i in data) {
        if (data[i].column != 'UNKOWN') {
            var item = '';
            item += docCategory.DOCTYPE + ',' + data[i].x + ',' + data[i].y + ',' + data[i].word;
            commonDB.reqQueryParam(queryConfig.mlConfig.insertColMapping, [item, data[i].colNum], function (rows, req, res) {
                colMappingCount++;
                if (colMappingCount == data.length) {
                    res.send({ code: 200, message: 'column mapping insert' });
                }
            }, req, res);
        }
    }
});

// [POST] insert batchLearningBaseData (tbl_batch_learning_data 기초정보)
var callbackInsertBatchLearningBaseData = function (rows, req, res) {
    //console.log("upload batchLearningBaseData finish..");
    res.send({ code: 200, rows: rows });
};
router.post('/insertBatchLearningBaseData', function (req, res) {
    var dataObj = req.body.dataObj;
    //console.log("insert dataObj " + JSON.stringify(dataObj));
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
router.post('/updateBatchLearningData', function (req, res) {
    var data = req.body.mldata.data;
    var billInfo = req.body.mldata.docCategory;
    var fileInfos = req.body.ocrData.fileInfo;
    var fileToPage = req.body.ocrData.fileToPage;
    var status = '';
    var keyCount = 0; // 컬럼 개수
    for (var key in data) keyCount++;
    if (keyCount == 49 ){ // 모든 컬럼 있으면
        status = 'Y';
    } else {
        status = 'N';
    }

    var dataCod = {};

    dataCod.STATEMENTDIV = billInfo.DOCNAME;

    for (var i in data) {
        if (data[i].column == "CTOGCOMPANYNAMENM") {
            dataCod.CTOGCOMPANYNAMENM = data[i].text;
        } else if (data[i].column == "CTNM") {
            dataCod.CTNM = data[i].text;
        } else if (data[i].column == "UY") {
            dataCod.UY = data[i].text;
        } else if (data[i].column == "CONTRACTNUM") {
            dataCod.CONTRACTNUM = data[i].text;
        } else if (data[i].column == "CURCD") {
            dataCod.CURCD = data[i].text;
        } else if (data[i].column == "PAIDPERCENT") {
            dataCod.PAIDPERCENT = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "PAIDSHARE") {
            dataCod.PAIDSHARE = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "OSLPERCENT") {
            dataCod.OSLPERCENT = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "OSLSHARE") {
            dataCod.OSLSHARE = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "GROSSPM") {
            dataCod.GROSSPM = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "PM") {
            dataCod.PM = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "PMPFEND") {
            dataCod.PMPFEND = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "PMPFWOS") {
            dataCod.PMPFWOS = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "XOLPM") {
            dataCod.XOLPM = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "RETURNPM") {
            dataCod.RETURNPM = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "GROSSCN") {
            dataCod.GROSSCN = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "CN") {
            dataCod.CN = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "PROFITCN") {
            dataCod.PROFITCN = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "BROKERAGE") {
            dataCod.BROKERAGE = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "TAX") {
            dataCod.TAX = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "OVERRIDINGCOM") {
            dataCod.OVERRIDINGCOM = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "CHARGE") {
            dataCod.CHARGE = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "PMRESERVERTD") {
            dataCod.PMRESERVERTD = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "PFPMRESERVERTD") {
            dataCod.PFPMRESERVERTD = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "PMRESERVERLD") {
            dataCod.PMRESERVERLD = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "PFPMRESERVERLD") {
            dataCod.PFPMRESERVERLD = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "CLAIM") {
            dataCod.CLAIM = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "LOSSRECOVERY") {
            dataCod.LOSSRECOVERY = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "CASHLOSS") {
            dataCod.CASHLOSS = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "CASHLOSSRD") {
            dataCod.CASHLOSSRD = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "LOSSRR") {
            dataCod.LOSSRR = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "LOSSRR2") {
            dataCod.LOSSRR2 = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "LOSSPFEND") {
            dataCod.LOSSPFEND = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "LOSSPFWOA") {
            dataCod.LOSSPFWOA = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "INTEREST") {
            dataCod.INTEREST = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "TAXON") {
            dataCod.TAXON = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "MISCELLANEOUS") {
            dataCod.MISCELLANEOUS = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "PMBL") {
            dataCod.PMBL = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "CMBL") {
            dataCod.CMBL = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "NTBL") {
            dataCod.NTBL = data[i].text.replace(/ |,/g, '');
        } else if (data[i].column == "CSCOSARFRNCNNT2") {
            dataCod.CSCOSARFRNCNNT2 = data[i].text;
        }
    }

    var dataArr = [
        "N",
        commonUtil.nvl(dataCod.entryNo),
        commonUtil.nvl(dataCod.STATEMENTDIV),
        commonUtil.nvl(dataCod.CONTRACTNUM),
        commonUtil.nvl(dataCod.ogCompanyCode),
        commonUtil.nvl(dataCod.CTOGCOMPANYNAMENM),
        commonUtil.nvl(dataCod.brokerCode),
        commonUtil.nvl(dataCod.brokerName),
        commonUtil.nvl(dataCod.CTNM),
        commonUtil.nvl(dataCod.insstdt),
        commonUtil.nvl(dataCod.insenddt),
        commonUtil.nvl(dataCod.UY),
        commonUtil.nvl(dataCod.CURCD),
        commonUtil.nvl2(dataCod.PAIDPERCENT, 0),
        commonUtil.nvl2(dataCod.PAIDSHARE, 0),
        commonUtil.nvl2(dataCod.OSLPERCENT, 0),
        commonUtil.nvl2(dataCod.OSLSHARE, 0),
        commonUtil.nvl2(dataCod.GROSSPM, 0),
        commonUtil.nvl2(dataCod.PM, 0),
        commonUtil.nvl2(dataCod.PMPFEND, 0),
        commonUtil.nvl2(dataCod.PMPFWOS, 0),
        commonUtil.nvl2(dataCod.XOLPM, 0),
        commonUtil.nvl2(dataCod.RETURNPM, 0),
        commonUtil.nvl2(dataCod.GROSSCN, 0),
        commonUtil.nvl2(dataCod.CN, 0),
        commonUtil.nvl2(dataCod.PROFITCN, 0),
        commonUtil.nvl2(dataCod.BROKERAGE, 0),
        commonUtil.nvl2(dataCod.TAX, 0),
        commonUtil.nvl2(dataCod.OVERRIDINGCOM, 0),
        commonUtil.nvl2(dataCod.CHARGE, 0),
        commonUtil.nvl2(dataCod.PMRESERVERTD, 0),
        commonUtil.nvl2(dataCod.PFPMRESERVERTD, 0),
        commonUtil.nvl2(dataCod.PMRESERVERLD, 0),
        commonUtil.nvl2(dataCod.PFPMRESERVERLD, 0),
        commonUtil.nvl2(dataCod.CLAIM, 0),
        commonUtil.nvl2(dataCod.LOSSRECOVERY, 0),
        commonUtil.nvl2(dataCod.CASHLOSS, 0),
        commonUtil.nvl2(dataCod.CASHLOSSRD, 0),
        commonUtil.nvl2(dataCod.LOSSRR, 0),
        commonUtil.nvl2(dataCod.LOSSRR2, 0),
        commonUtil.nvl2(dataCod.LOSSPFEND, 0),
        commonUtil.nvl2(dataCod.LOSSPFWOA, 0),
        commonUtil.nvl2(dataCod.INTEREST, 0),
        commonUtil.nvl2(dataCod.TAXON, 0),
        commonUtil.nvl2(dataCod.MISCELLANEOUS, 0),
        commonUtil.nvl2(dataCod.PMBL, 0),
        commonUtil.nvl2(dataCod.CMBL, 0),
        commonUtil.nvl2(dataCod.NTBL, 0),
        commonUtil.nvl2(dataCod.cscosarfrncnnt2, 0)
    ];

    var condImgIdQuery = '('
    for (var i in fileInfos) {
        condImgIdQuery += "'";
        condImgIdQuery += fileInfos[i].imgId;
        condImgIdQuery += (i != fileInfos.length - 1) ? "'," : "')";
    }

    if (billInfo.DOCTYPE == 2) {
        var condSubNum = ' and subNum = ' + fileToPage.IMGFILESTARTNO;

        commonDB.reqQueryParam(selectBatchLearningDataQuery + condSubNum, [fileInfos[0].imgId], function (rows, req, res) {
            if (rows.length == 0) {
                var regId = req.session.userId;

                var insArr = [
                    fileInfos[0].imgId,
                    commonUtil.nvl(dataCod.entryNo),
                    commonUtil.nvl(dataCod.STATEMENTDIV),
                    commonUtil.nvl(dataCod.CONTRACTNUM),
                    commonUtil.nvl(dataCod.ogCompanyCode),
                    commonUtil.nvl(dataCod.CTOGCOMPANYNAMENM),
                    commonUtil.nvl(dataCod.brokerCode),
                    commonUtil.nvl(dataCod.brokerName),
                    commonUtil.nvl(dataCod.CTNM),
                    commonUtil.nvl(dataCod.insstdt),
                    commonUtil.nvl(dataCod.insenddt),
                    commonUtil.nvl(dataCod.UY),
                    commonUtil.nvl(dataCod.CURCD),
                    commonUtil.nvl2(dataCod.PAIDPERCENT, 0),
                    commonUtil.nvl2(dataCod.PAIDSHARE, 0),
                    commonUtil.nvl2(dataCod.OSLPERCENT, 0),
                    commonUtil.nvl2(dataCod.OSLSHARE, 0),
                    commonUtil.nvl2(dataCod.GROSSPM, 0),
                    commonUtil.nvl2(dataCod.PM, 0),
                    commonUtil.nvl2(dataCod.PMPFEND, 0),
                    commonUtil.nvl2(dataCod.PMPFWOS, 0),
                    commonUtil.nvl2(dataCod.XOLPM, 0),
                    commonUtil.nvl2(dataCod.RETURNPM, 0),
                    commonUtil.nvl2(dataCod.GROSSCN, 0),
                    commonUtil.nvl2(dataCod.CN, 0),
                    commonUtil.nvl2(dataCod.PROFITCN, 0),
                    commonUtil.nvl2(dataCod.BROKERAGE, 0),
                    commonUtil.nvl2(dataCod.TAX, 0),
                    commonUtil.nvl2(dataCod.OVERRIDINGCOM, 0),
                    commonUtil.nvl2(dataCod.CHARGE, 0),
                    commonUtil.nvl2(dataCod.PMRESERVERTD, 0),
                    commonUtil.nvl2(dataCod.PFPMRESERVERTD, 0),
                    commonUtil.nvl2(dataCod.PMRESERVERLD, 0),
                    commonUtil.nvl2(dataCod.PFPMRESERVERLD, 0),
                    commonUtil.nvl2(dataCod.CLAIM, 0),
                    commonUtil.nvl2(dataCod.LOSSRECOVERY, 0),
                    commonUtil.nvl2(dataCod.CASHLOSS, 0),
                    commonUtil.nvl2(dataCod.CASHLOSSRD, 0),
                    commonUtil.nvl2(dataCod.LOSSRR, 0),
                    commonUtil.nvl2(dataCod.LOSSRR2, 0),
                    commonUtil.nvl2(dataCod.LOSSPFEND, 0),
                    commonUtil.nvl2(dataCod.LOSSPFWOA, 0),
                    commonUtil.nvl2(dataCod.INTEREST, 0),
                    commonUtil.nvl2(dataCod.TAXON, 0),
                    commonUtil.nvl2(dataCod.MISCELLANEOUS, 0),
                    commonUtil.nvl2(dataCod.PMBL, 0),
                    commonUtil.nvl2(dataCod.CMBL, 0),
                    commonUtil.nvl2(dataCod.NTBL, 0),
                    commonUtil.nvl2(dataCod.cscosarfrncnnt2, 0),
                    regId,
                    fileToPage.IMGFILESTARTNO
                ];

                commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertBatchLearningData, insArr, callbackInsertBatchLearningData, req, res);
            } else {
                commonDB.reqQueryParam(queryConfig.batchLearningConfig.updateBatchLearningData + condImgIdQuery, dataArr, callbackUpdateBatchLearningData, req, res);
            }
        }, req, res);
    } else {
        commonDB.reqQueryParam(queryConfig.batchLearningConfig.updateBatchLearningData + condImgIdQuery, dataArr, callbackUpdateBatchLearningData, req, res);
    }
});

var callbackUpdateBatchLearningData = function (rows, req, res) {
    console.log("UpdateBatchLearningData finish..");
    res.send({ code: 200, rows: rows });
}

// [POST] syncFile
router.post('/syncFile', function (req, res) {
    //const testFolder = appRoot + '\\uploads\\';
    const testFolder = propertiesConfig.filepath.imagePath;
    

    const files = FileHound.create()
        .paths(testFolder)
        //.ext('jpg', 'tif')
        .ext('tif', 'tiff')
        .find();

	 console.log("filehound : " + JSON.stringify(files));

    var resText = [];

    files.then(function (result) {
        var del_result = [];

		console.log(JSON.stringify(result));
        // 파일테이블 리스트를 가져와서 존재여부 검사
        var callbackSelectFileNameList = function (rows, req, res) {
            for (var i = 0, x = result.length; i < x; i++) {
                var _compareValue = result[i].replace(/\\\\/g, '\\');
                result[i] = _compareValue;
            }
            // rows = DB에 저장된 파일, result = 서버에서 읽어온 파일
            for (var i = 0, x = rows.length ; i < x ; i++) {
                let rows_file_path = appRoot + '\\' + rows[i].FILE_PATH;
                var _result = result.filter(function (_fileObj) {
                    return _fileObj != rows_file_path; // 같지 않은것만 배열에 남김
                });
                result = _result;
            }
            if (result.length > 0) fileProcess(result); // DB에 저장되지 않은 서버 파일을 DB에 저장
            else res.send({ code: 200, message: null, fileInfo: null });
        }
        var fileList = commonDB.reqQueryParam(queryConfig.batchLearningConfig.selectFileNameList, [], callbackSelectFileNameList, req, res);
        
        // 디렉토리에만 존재하는 파일 저장
        function fileProcess(result) {
            if (result.length > 0) {
                //console.log("남은 result " + result.length + "개의 처리를 시작합니다. ");
                var endCount = 0;
                var returnObj = [];
                var fileInfo = [];
                for (var i = 0; i < result.length; i++) {
                    var data = fs.readFileSync(result[i], 'utf-8');
                    var imgId = Math.random().toString(36).slice(2); // TODO : 임시로 imgId 생성
                    var _lastSeparator = result[i].lastIndexOf('\\');
                    var oriFileName = result[i].substring(_lastSeparator + 1, result[i].length);
                    var filePath = "uploads\\" + oriFileName;
                    var _lastDot = oriFileName.lastIndexOf('.');
                    var fileExt = oriFileName.substring(_lastDot + 1, oriFileName.length).toLowerCase();        // 파일 확장자
                    var fileSize = data.length;
                    var contentType = data.mimetype ? data.mimetype : ""; // 컨텐트타입
                    var svrFileName = Math.random().toString(26).slice(2);  // 서버에 저장될 랜덤 파일명
                    var ifile = appRoot + '\\' + filePath;
                    var ofile = appRoot + '\\' + filePath.split('.')[0] + '.jpg';

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
                    if (oriFileName.split('.')[1].toLowerCase() === 'tif' || oriFileName.split('.')[1].toLowerCase() === 'tiff') {
                        exec('module\\imageMagick\\convert.exe -density 800x800 ' + ifile + ' ' + ofile, function (err, out, code) {
                            if (endCount === result.length - 1) { // 모든 파일 변환이 완료되면
                                res.send({ code: 200, message: returnObj, fileInfo: fileInfo });
                            }
                            endCount++;
                        });
                    }
                }
            }
        }
    });

    files.done(function () {
    });
});

router.post('/compareBatchLearningData', function (req, res) {
    var dataObj = req.body.dataObj;
    //console.log(dataObj);
    var query = queryConfig.batchLearningConfig.selectContractMapping;
    var param;
    if (dataObj.CTOGCOMPANYNAMENM && dataObj.CTNM) {
        if (typeof dataObj.CTNM == 'string') { // 단일 계약명
            param = [dataObj.CTOGCOMPANYNAMENM, dataObj.CTNM];
        } else { // 다중 계약명
            param = [dataObj.CTOGCOMPANYNAMENM, dataObj.CTNM[0]];
            for (var i = 1; i < dataObj.CTNM.length; i++) {
                query += " OR (extOgCompanyName = '" + dataObj.CTOGCOMPANYNAMENM + "' AND extCtnm = '" + dataObj.CTNM[i] + "')";
            }
        }
        commonDB.reqQueryParam2(query, param, callbackSelectContractMapping, dataObj, req, res);
    } else {
        res.send({ isContractMapping: false });
    }
   
});

var callbackSelectContractMapping = function (rows, dataObj, req, res) {
    if (rows.length > 0) {
        dataObj.ASOGCOMPANYNAME = rows[0].ASOGCOMPANYNAME;
        dataObj.ASCTNM = rows[0].ASCTNM;
        dataObj.MAPPINGCTNM = rows[0].EXTCTNM
        commonDB.reqQueryParam2(queryConfig.batchLearningConfig.compareBatchLearningData, [
            dataObj.fileToPage.IMGID, dataObj.PM, dataObj.CN
        ], callbackcompareBatchLearningData, dataObj, req, res);
    } else {
        res.send({ isContractMapping : false});
    }
}

var callbackcompareBatchLearningData = function (rows, dataObj, req, res) {
    console.log("compareBatchLearningData finish..");
    if (rows.length > 0) {
        rows[0].EXTOGCOMPANYNAME = dataObj.CTOGCOMPANYNAMENM;
        rows[0].EXTCTNM = dataObj.CTNM;
        rows[0].MAPPINGCTNM = dataObj.MAPPINGCTNM;
        res.send({ code: 200, rows: rows, isContractMapping: true });
    } else {
        res.send({ code: 500, message: 'answer Data not Found' });
    }
}

router.post('/uiTrainBatchLearningData', function (req, res) {
    var dataObj = req.body.dataObj;

    //console.log(dataObj);

    runTypoDomainTrain(dataObj, function (result1) {
        if (result1 == "true") {
            //text-classification train
            var exeTextString = 'python ' + appRoot + '\\ml\\cnn-text-classification\\train.py'
            exec(exeTextString, defaults, function (err, stdout, stderr) {
                console.log(stdout);
                //label-mapping train
                var exeLabelString = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\train.py'
                exec(exeLabelString, defaults, function (err1, stdout1, stderr1) {
                    console.log(stdout1);
                    res.send("ui 학습 완료");
                });
            });

        } else {
            res.send("학습 실패");
        }
    });

});

async function runTypoDomainTrain(data, callbackTypoDomainTrain) {
    let res;
    try {
        res = await typoDomainTrain(data);
        console.log(res);
        callbackTypoDomainTrain(res);
    } catch (err) {
        console.error(err);
    }
}

function typoDomainTrain(data) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            for (var i = 0; i < data.length; i++) {
                if (data[i].transText != null) {
                    //console.log(data[i].originText);
                    var originSplit = data[i].text.split(" ");
                    var textSplit = data[i].transText.split(" ");

                    var textleng = Math.abs(data[i].text.length - data[i].transText.length);

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

                if (data[i].column == null) {
                    data[i].label = 'undefined';
                }

                var insTextClassifiCond = [];
                insTextClassifiCond.push(data[i].text);
                insTextClassifiCond.push(data[i].label);

                let insResult = await conn.execute(insertTextClassification, insTextClassifiCond);
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

async function runClassificationTrain(data, callbackClassificationTrain) {
    try {
        let res = await textClassificationTrain(data);
        console.log(res);
        callbackClassificationTrain(res);
    } catch (err) {
        console.error(err);
    }
}

function textClassificationTrain(data) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

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
            console.log("textClassification");
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

async function runMappingTrain(data, callbackLabelMappingTrain) {
    try {
        let res = await labelMappingTrain(data);
        console.log(res);
        callbackLabelMappingTrain(res);
    } catch (err) {
        console.error(err);
    }
}

function labelMappingTrain(data) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            for (var i in data) {
                if (data[i].textClassi == "fixlabel" || data[i].textClassi == "entryrowlabel") {
                    var insLabelMapCond = [];
                    insLabelMapCond.push(data[i].text);
                    insLabelMapCond.push(data[i].labelMapping);

                    let insLabelMapRes = await conn.execute(insertLabelMapping, insLabelMapCond);

                    console.log(insLabelMapRes);
                }
            }
            console.log("labelMapping");
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
        //console.log(stdout);
        //console.log(stderr);
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
                    //console.log(excelArray[i]);
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
                    //console.log(result4);
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
        //console.log(res);
    });

    res.send("test");
});

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
    commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertDocCategory, [docName, (docType + 1), sampleImagePath], callbackInsertDocCategory, req, res);
};
router.post('/insertDocCategory', function (req, res) {

    commonDB.reqQuery(queryConfig.batchLearningConfig.selectMaxDocType, callbackSelectMaxDocType, req, res);
});
// end 신규문서 양식 등록 

module.exports = router;