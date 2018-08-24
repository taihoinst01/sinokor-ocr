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
const flatten = require('flatten');
const mz = require('mz/fs');
const async = require("async");
var oracle = require('../util/oracle.js');
var sync = require('../util/sync.js');
var pythonConfig = require(appRoot + '/config/pythonConfig');

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
            //cb(null, 'uploads/');
            cb(null, propertiesConfig.filepath.imagePath);
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    }),
});
const defaults = {
    encoding: 'utf8'
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

// [POST] 배치학습데이터 이미지 조회
router.post('/viewImage', function (req, res) {
    if (req.isAuthenticated()) fnViewImage(req, res);
});
var callbackViewImage = async function (rows, req, res) {
    console.log("rows : " + JSON.stringify(rows));
    
    if (req.isAuthenticated()) {
        if (commonUtil.isNull(rows[0].CONVERTEDIMGPATH)) {
            
            // 변환 이미지가 없을 경우 변환 후 UPDATE
            var imgId = rows[0].IMGID;
            var convertedImgPath = "/uploads/" + rows[0].FILENAME.split('.')[0] + '.jpg';
            var data = [convertedImgPath, imgId];
            var query = queryConfig.batchLearningConfig.updateConvertedImgPath;
            console.log("update query : " + query + " data : " + JSON.stringify(data));
            commonDB.reqQueryParam(query, data, callbackBlank, req, res);

            // 이미지 변환
            var ifile = rows[0].FILEPATH;
            var ofile = appRoot + "" + convertedImgPath;
            console.log("start convert img... " + ifile + " => " + ofile);
            await exec('module\\imageMagick\\convert.exe -density 800x800 ' + ifile + ' ' + ofile, function (err, out, code) {
                console.log("trans img err : " + err);
                console.log("trans img out : " + out);
                console.log("trans img code : " + code);
                res.send({ rows: rows, code: 201 });
            });
        } else {
            res.send({ rows: rows, code: 200 });
        }
    }
};
var fnViewImage = function (req, res) {
    console.log(`imgId : ${req.body.imgId}`);
    var data = [req.body.imgId];
    var query = queryConfig.batchLearningConfig.selectViewImage;
    commonDB.reqQueryParam(query, data, callbackViewImage, req, res);
};
// [POST] 배치학습데이터 이미지 데이터 조회 
router.post('/viewImageData', function (req, res) {
    if (req.isAuthenticated()) fnViewImageData(req, res);
});
var callbackViewImageData = function (rows, req, res) {
    console.log("rows : " + JSON.stringify(rows));
    if (req.isAuthenticated()) res.send(rows);
};
var fnViewImageData = function (req, res) {
    var data = [req.body.imgId];
    var query = queryConfig.batchLearningConfig.selectViewImageData;
    commonDB.reqQueryParam(query, data, callbackViewImageData, req, res);
};



// [POST] 배치학습데이터리스트 조회 
router.post('/searchBatchLearnDataList', function (req, res) {   
    if (req.isAuthenticated()) fnSearchBatchLearningDataList(req, res);
}); 
var callbackBatchLearningDataList = function (rows, req, res) {
    if (req.isAuthenticated()) res.send(rows);
};
var fnSearchBatchLearningDataList = function (req, res) {
    // 조건절
    var condQuery = "";
    var orderQuery = " ORDER BY A.regDate DESC";
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
};


// [POST] 배치학습데이터 조회
router.post('/searchBatchLearnData', function (req, res) {   
    if (req.isAuthenticated()) fnSearchBatchLearningData(req, res);
}); 
var callbackSelectBatchAnswerDataToImgId = function (rows, req, res, fileInfoList, orderbyRows) {
    if (rows.length == 0) {
        res.send({ code: 200, fileInfoList: fileInfoList, answerRows: orderbyRows, fileToPage: [] });
    } else {
        res.send({ code: 200, fileInfoList: fileInfoList, answerRows: orderbyRows, fileToPage: rows });
    }
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
    
    //res.send({ code: 200, fileInfoList: fileInfoList, answerRows: orderbyRows });
    commonDB.reqQueryF2param(selectBatchAnswerDataToImgId + condQuery, callbackSelectBatchAnswerDataToImgId, req, res, fileInfoList, orderbyRows);
};
var callbackBatchLearningData = function (rows, req, res) {
    var fileInfoList = [];
    console.log("배치학습데이터 : " + rows.length);

    for (var i = 0, x = rows.length; i < x; i++) {
        var oriFileName = rows[i].FILENAME;
        var _lastDot = oriFileName.lastIndexOf('.');
        var fileExt = oriFileName.substring(_lastDot + 1, oriFileName.length).toLowerCase();        // 파일 확장자
        var fileInfo = {
            imgId: rows[i].IMGID,
            filePath: rows[i].FILEPATH,
            oriFileName: rows[i].FILENAME,
            svrFileName: rows[i].SERVERFILENAME,
            convertFileName: rows[i].FILENAME.replace(fileExt, "jpg"),
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
};
var fnSearchBatchLearningData = function (req, res) {
    var condition = " AND A.imgId IN (";
    for (var i = 0, x = req.body.imgIdArray.length; i < x; i++) {
        condition += "'" + req.body.imgIdArray[i] + "',";
    }
    condition = condition.slice(0, -1);
    condition += ")";
    var query = selectBatchLearningDataListQuery + condition;
    console.log("단건 조회 쿼리 : " + query);
    commonDB.reqQuery(query, callbackBatchLearningData, req, res);
};

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

    commonDB.reqInsertExcelDataPath(pathResult, dataResult, req, res);
    //commonDB.reqInsertExcelData(dataResult);
    // insert filepath.xlsx 
    //for (var i = 1, x = pathResult.length; i < x; i++) { // 첫번째 행은 무시
    //    if (!commonUtil.isNull(pathResult[i][0])) {
    //        let data = [];
    //        for (var j = 0, y = pathResult[i].length; j < y; j++) {
    //            data.push(commonUtil.nvl(pathResult[i][j]));
    //        }
    //        console.log(`insert pathResult : ` + i);
    //        commonDB.queryNoRows(queryConfig.batchLearningConfig.insertBatchAnswerFile, data, callbackBlank);
    //    } else {
    //        console.log(`finish insert pathResult...`);
    //        continue;
    //    }
    //}
    // insert data.xlsx
    //for (var i = 1, x = dataResult.length; i < x; i++) { // 첫번째 행은 무시
    //    if (!commonUtil.isNull(dataResult[i][0])) {
    //        let data = [];
    //        for (var j = 0, y = dataResult[i].length; j < y; j++) {
    //            data.push(commonUtil.nvl(dataResult[i][j]));
    //        }
    //        console.log(`insert dataResult : ` + x);
    //        commonDB.queryNoRows(queryConfig.batchLearningConfig.insertBatchAnswerData, data, callbackBlank);
    //    } else {
    //        console.log(`finish insert dataResult...`);
    //        continue;
    //    }
    //}
    
});

// [POST] 이미지 업로드
router.post('/imageUpload', upload.any(), function (req, res) {
    const testFolder = propertiesConfig.filepath.imagePath;
    var files = req.files;
    var endCount = 0;
    var returnObj = [];
    var fileInfo = [];
    for (var i = 0; i < files.length; i++) {
        if (files[i].originalname.split('.')[1] === 'TIF' || files[i].originalname.split('.')[1] === 'tif' ||
            files[i].originalname.split('.')[1] === 'TIFF' || files[i].originalname.split('.')[1] === 'tiff') {
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
            var fileExt = oriFileName.substring(_lastDot+1, oriFileName.length).toLowerCase();        // 파일 확장자
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

            console.log(`file Info : ${JSON.stringify(fileParam)}`);
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
};
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
    var dataDtl = [imgId, filePath.replace(oriFileName, convertFileName), convertFileName, svrFileName, 'jpg', 0, '', 'B', regId];
    
    //console.log("입력 데이터 : " + JSON.stringify(data));
    commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertFileDtlInfo, data, callbackBlank, req, res);
    commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertFileInfo, data, callbackInsertFileInfo, req, res);
});

router.post('/insertBatchLearningBaseData', function (req, res) {
    //console.log("insert BATCH LEARNING BASE DATA : " + JSON.stringify(req.body.fileInfo));
    var fileInfo = req.body.fileInfo;
    var filePath = fileInfo.filePath;
    filePath = filePath.replace("\\", "/");

    var imagePath = propertiesConfig.filepath.imagePath;
    imagePath = imagePath.replace("\\", "/");

    var selAnswerFile = `SELECT IMGID FROM TBL_BATCH_ANSWER_FILE WHERE 'C:\\ICR\\image' || FILEPATH = :filepath `;

    commonDB.reqQueryParam(selAnswerFile, [filePath], callbackSelectBatchLearningBaseData, req, res);

});

// [POST] INSERT batchLearningBaseData (기본정보)
var callbackSelectBatchLearningBaseData = function (rows, req, res) {

    var fileInfo = req.body.fileInfo;
    var convertedImgPath = fileInfo.convertFileName;
    var fileName = fileInfo.oriFileName;
    var filePath = fileInfo.filePath;
    var imgId = fileInfo.imgId;

    if (rows.length > 0) {
        imgId = rows[0].IMGID;
    }
    if (fileName.split('.')[1] === 'jpg') {
        convertedImgPath = '';
    }

    var data = [imgId, convertedImgPath, fileName, filePath];

    commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertBatchLearningBaseData, data, callbackInsertBatchLearningBaseData, req, res);
};

var callbackInsertBatchLearningBaseData = function (rows, req, res) {
    res.send({ code: 200, rows: rows });
};

//
router.post('/execBatchLearningData2', function (req, res) {
    /*
    var arg = [
        { "location": "342,542,411,87", "text": "TEST" },
        { "location": "1045,294,409,23", "text": "Partner of Test" },
        { "location": "1923,543,178,25", "text": "Test No" },
        { "location": "1849,403,206,25", "text": "Test Date" },
        { "location": "234,546,274,27", "text": "7933 Korean Re" },
        { "location": "198,649,525,34", "text": "Proportional Treaty Statement" },
        { "location": "2390,409,344,25", "text": "BV/HEO/2018/08/0819" },
        { "location": "2101,534,169,25", "text": "01442/2018" },
        { "location": "211,858,111,24", "text": "Cedant" },
        { "location": "211,918,285,24", "text": "Class of Business" },
        { "location": "218,1001,272,26", "text": "Period of Quarter" },
        { "location": "212,1104,252,31", "text": "Period of Treaty" },
        { "location": "210,1066,227,24", "text": "Our Reference" },
        { "location": "210,1174,145,31", "text": "Currency" },
        { "location": "211,1243,139,24", "text": "Premium" },
        { "location": "220,1403,197,24", "text": "Commission" },
        { "location": "220,1466,107,24", "text": "Claims" },
        { "location": "222,1526,126,24", "text": "Reserve" },
        { "location": "222,1389,123,24", "text": "Release" },
        { "location": "222,1619,117,24", "text": "Interest" },
        { "location": "222,1509,161,31", "text": "Brokerage" },
        { "location": "235,1878,134,24", "text": "Portfolio" },
        { "location": "222,1481,124,24", "text": "Balance" },
        { "location": "440,899,492,32", "text": ": Test- First Insurance 2018" },
        { "location": "440,912,636,26", "text": ": Test contract 2018" },
        { "location": "708,888,433,25", "text": "07-05-2018 TO 19-08-2018" },
        { "location": "708,920,454,25", "text": ": 22-03-2018 TO 30-09-2018" },
        { "location": "475,998,304,25", "text": ": TEST/CTNM/8403" },
        { "location": "829,1173,171,25", "text": "JOD 1.50" },
        { "location": "839,1239,83,25", "text": "4.32" },
        { "location": "839,1299,58,25", "text": "34.21" },
        { "location": "839,1362,64,25", "text": "4.25" },
        { "location": "839,1422,58,25", "text": "1.65" },
        { "location": "839,1485,64,25", "text": "0.00" },
        { "location": "839,1545,64,25", "text": "2.38" },
        { "location": "839,1605,64,25", "text": "71.65" },
        { "location": "848,1677,64,25", "text": "33.10" },
        { "location": "1956,1879,356,29", "text": "TEST CONTRACT" }
    ];
    */
    console.log('--execBatchLearningDataV1.3');
    var arg = req.body.data;

    aimain.typoSentenceEval2(arg, function (typoResult) {
        arg = typoResult;
        console.log('execute typo ML');
        //console.log(arg);
        aimain.formLabelMapping2(arg, function (formLabelResult) {
            arg = formLabelResult;
            console.log('execute formLabelMapping ML');
            //console.log(arg);
            aimain.formMapping2(arg, function (formResult) {
                arg = formResult;
                console.log('execute formMapping ML');
                //console.log(arg);
                aimain.columnMapping2(arg, function (columnResult) {
                    arg = columnResult;
                    console.log('execute columnMapping ML');
                    //console.log(arg);                   
					res.send(arg);
                });
            });
        });
    });
});


// RUN batchLearningData
router.post('/execBatchLearningData', function (req, res) {
	console.log('--execBatchLearningDataV1.2');
    var arg = req.body.data;

    // Machine Learning v1.2
    aimain.typoSentenceEval(arg, function (typoResult) {
        arg = typoResult;
        console.log('execute typo ML');
        //console.log(arg);
        aimain.formLabelMapping(arg, function (formLabelResult) {
            arg = formLabelResult;
            console.log('execute formLabelMapping ML');
            //console.log(arg);
            aimain.formMapping(arg, function (formResult) {
                console.log('execute formMapping ML');
                arg = formResult;
                //console.log(arg);
                if (arg != null) {
                    aimain.columnMapping(arg, function (columnResult) {
                        if (columnResult) {
                            var columnArr = columnResult.split('^');
                            for (var i in columnArr) {
                                for (var j in arg.data) {
                                    var columnSid = columnArr[i].split('||')[0];
                                    if (columnSid.substring(columnSid.indexOf(',') + 1, columnSid.length) == arg.data[j].sid) {
                                        arg.data[j].colLbl = Number(columnArr[i].split('||')[1].replace(/\r\n/g, ''));
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
                        } else {
                            var data = {};
                            data.data = typoResult;
                            res.send(data);
                        }
                    });
                } else {
                    var data = {};
                    data.data = typoResult;
                    res.send(data);
                }

            });
        });
    });

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

});

router.post('/uitraining', function (req, res) {

    var exeLabelString = 'python ' + appRoot + '\\ml\\FormLabelMapping\\train.py';
    exec(exeLabelString, defaults, function (err1, stdout1, stderr1) {
        if (err1) {
            console.error(err1);
            res.send({ code:500, message: 'Form Label Mapping training error' });
        } else {
            exeLabelString = 'python ' + appRoot + '\\ml\\FormMapping\\train.py';
            exec(exeLabelString, defaults, function (err2, stdout2, stderr2) {
                if (err2) {
                    console.error(err2);
                    res.send({ code: 500, message: 'Form  Mapping training error' });
                } else {
                    exeLabelString = 'python ' + appRoot + '\\ml\\ColumnMapping\\train.py';
                    exec(exeLabelString, defaults, function (err3, stdout3, stderr3) {
                        if (err3) {
                            console.error(err3);
                            res.send({ code: 500, message: 'Column Mapping training error' });
                        } else {
                            res.send({ code: 200, message: 'training OK' });
                        }
                    });
                }
            });
        }
        
    });

});

var callbackSelDbColumns = function (rows, req, res) {
    res.send({ code : 200, data: rows });
};
router.post('/selectColMappingCls', function (req, res) {

    commonDB.reqQuery(queryConfig.dbcolumnsConfig.selectColMappingCls, callbackSelDbColumns, req, res);
});

router.post('/insertDocLabelMapping', function (req, res) {
    var data = req.body.data;

    aimain.addLabelMappingTrain(data, function (resData) {
        console.log('insertDocLabelMapping ML');
        res.send({ code: 200, message: 'insertDocLabelMapping ML', data: resData });
    });
    
	/*
    var params = [];

    for (var i in data.data) {
        var classData = 0;
        if (data.data[i].column == 0 || data.data[i].column == 1) {            
            classData = String(Number(data.data[i].column) + 1);
        } else {
            classData = String(3);
        }
        params.push([data.data[i].sid, classData]);
    }

    var options = {
        autoCommit: true
    };
    commonDB.reqBatchQueryParam(queryConfig.mlConfig.insertDocLabelMapping, params, options, function (rowsAffected, req, res) {
        res.send({ code: 200, message: 'form label mapping insert' });
    }, req, res);
	*/

});

var callbackInsertDocMapping = function (rows, req, res) {
    res.send({ code: 200, message: 'form mapping insert' });
};
router.post('/insertDocMapping', function (req, res) {
    var data = req.body.data;
    
    aimain.addDocMappingTrain(data, function (resData) {
        console.log('insertDocMapping ML');
        res.send({ code: 200, message: 'insertDocMapping ML', data: resData });
    });
	
	/*
    var docCategory = req.body.docCategory;

    var item = '';
    for (var i in data) {
        item += (item == '')? data[i].sid : ',' + data[i].sid;
    }

    commonDB.reqQueryParam(queryConfig.mlConfig.insertDocMapping, [item, docCategory.DOCTYPE], callbackInsertDocMapping, req, res);
	*/

});

router.post('/insertColMapping', function (req, res) {
    var data = req.body.data;

    aimain.addColumnMappingTrain(data, function (resData) {
        console.log('insertColMapping ML');
        res.send({ code: 200, message: 'insertColMapping ML' });
    });

    /*
    var docCategory = req.body.docCategory;
    var colMappingCount = 0;
    var params = [];

    for (var i in data) {
        if (data[i].column != 999) {
            var item = '';
            item += docCategory.DOCTYPE + ',' + data[i].sid;
            params.push([item, data[i].column]);
        }
    }

    var options = {
        autoCommit: true
    };
    commonDB.reqBatchQueryParam(queryConfig.mlConfig.insertColMapping, params, options, function (rowsAffected, req, res) {
        res.send({ code: 200, message: 'column mapping insert' });
    }, req, res);
	*/
});

var callbackInsertContractMapping = function (rows, req, res) {
    res.send({ code: 200, message: 'contract mapping insert'})
};
var callbackSelectBatchAnswerDataToFilePath = function (rows, data, req, res) {
    var extOgcompanyName, extCtnm, asOgcompanyName, asCtnm;

    if (rows.length > 0) {
        for (var i in data.data) {
            if (data.data[i].column == 0) {
                extOgcompanyName = data.data[i].text;
            } else if (data.data[i].column == 1) {
                extCtnm = data.data[i].text;
            }
        }
        asOgcompanyName = rows[0].OGCOMPANYNAME;
        asCtnm = rows[0].CTNM;
        commonDB.reqQueryParam(queryConfig.batchLearningConfig.insertContractMapping, [extOgcompanyName, extCtnm, asOgcompanyName, asCtnm], callbackInsertContractMapping, req, res);
    } else {
        res.send({ code: 200, message: 'contract mapping insert (not Answer)' })
    }
};
router.post('/insertContractMapping', function (req, res) {
    var data = req.body.data;
    var fileName = req.body.fileName;
    console.log(fileName);
    commonDB.reqQueryParam2(queryConfig.batchLearningConfig.selectBatchAnswerDataToFilePath, [fileName], callbackSelectBatchAnswerDataToFilePath, data, req, res);
});

/*
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
*/

// [POST] insert batchLearningData (tbl_batch_learning_data 전체정보)
var callbackInsertBatchLearningData = function (rows, req, res) {
    console.log("upload batchLearningData finish..");
    res.send({ code: 200, rows: rows });
};
router.post('/updateBatchLearningData', function (req, res) {
    var data = req.body.mldata.data;
    var billInfo = req.body.mldata.docCategory[0];
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

    if (billInfo.DOCTYPE == 2) {

        var dataArr = [];

        for (var i in data) {
            if (data[i].colLbl == "CONTRACTNUM" || data[i].colLbl == "3") {
                var colData = [];
                colData.push(data[i]);

                var ctnmLoc = data[i].location.split(",");

                for (var j in data) {
                    var loc = data[j].location.split(",");

                    if ((data[j].colLbl == "PAIDSHARE" || data[j].colLbl == "6") && (Math.abs(ctnmLoc[1] - loc[1]) < 15)) {
                        colData.push(data[j]);
                    }

                    if ((data[j].colLbl == "OSLPERCENT" || data[j].colLbl == "7") && (Math.abs(ctnmLoc[1] - loc[1]) < 15)) {
                        colData.push(data[j]);
                    }

                    if ((data[j].colLbl == "OSLSHARE" || data[j].colLbl == "8") && (Math.abs(ctnmLoc[1] - loc[1]) < 15)) {
                        colData.push(data[j]);
                    }

                    if ((data[j].colLbl == "CURCD" || data[j].colLbl == "4") && (Math.abs(ctnmLoc[1] - loc[1]) < 15)) {
                        colData.push(data[j]);
                    }
                }
                dataArr.push(colData);
            }
        }

        runInsertLearnData(dataArr, req, res, function () {
            console.log("UpdateBatchLearningData finish..");
            res.send({ code: 200});
        });

    } else {

        runUpdateLearnData(data, req, res, function () {
            console.log("UpdateBatchLearningData finish..");
            res.send({ code: 200 });
        }); 

        //commonDB.reqQueryParam(queryConfig.batchLearningConfig.updateBatchLearningData + condImgIdQuery, dataArr, callbackUpdateBatchLearningData, req, res);
    }
});

async function runUpdateLearnData(data, req, res, callbackRunUpdateLearnData) {
    let ret;
    try {
        ret = await updateLearnData(data, req, res);
        console.log(ret);
        callbackRunUpdateLearnData(ret);
    } catch (err) {
        console.error(err);
    }
}

function updateLearnData(data, req, res) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);
            var fileInfos = req.body.ocrData.fileInfo;
            var billInfo = req.body.mldata.docCategory[0];

            var cond = "('" + fileInfos[0].oriFileName + "')";

            let selAnswerRes = await conn.execute(queryConfig.batchLearningConfig.selectMultiBatchAnswerDataToFilePath + cond);

            var dataCod = {};

            dataCod.STATEMENTDIV = billInfo.DOCNAME;

            for (var i in data) {
                if (data[i].colLbl == "CTOGCOMPANYNAMENM" || data[i].colLbl == "0") {
                    dataCod.CTOGCOMPANYNAMENM = data[i].text;
                } else if (data[i].colLbl == "CTNM" || data[i].colLbl == "1") {
                    dataCod.CTNM = data[i].text;
                } else if (data[i].colLbl == "UY" || data[i].colLbl == "2") {
                    dataCod.UY = data[i].text;
                } else if (data[i].colLbl == "CONTRACTNUM" || data[i].colLbl == "3") {
                    dataCod.CONTRACTNUM = data[i].text;
                } else if (data[i].colLbl == "CURCD" || data[i].colLbl == "4") {
                    dataCod.CURCD = data[i].text;
                } else if (data[i].colLbl == "PAIDPERCENT" || data[i].colLbl == "5") {
                    dataCod.PAIDPERCENT = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "PAIDSHARE" || data[i].colLbl == "6") {
                    dataCod.PAIDSHARE = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "OSLPERCENT" || data[i].colLbl == "7") {
                    dataCod.OSLPERCENT = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "OSLSHARE" || data[i].colLbl == "8") {
                    dataCod.OSLSHARE = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "GROSSPM") {
                    dataCod.GROSSPM = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "PM" || data[i].colLbl == "9") {
                    dataCod.PM = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "PMPFEND" || data[i].colLbl == "10") {
                    dataCod.PMPFEND = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "PMPFWOS" || data[i].colLbl == "11") {
                    dataCod.PMPFWOS = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "XOLPM" || data[i].colLbl == "12") {
                    dataCod.XOLPM = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "RETURNPM" || data[i].colLbl == "13") {
                    dataCod.RETURNPM = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "GROSSCN") {
                    dataCod.GROSSCN = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "CN" || data[i].colLbl == "14") {
                    dataCod.CN = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "PROFITCN" || data[i].colLbl == "15") {
                    dataCod.PROFITCN = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "BROKERAGE" || data[i].colLbl == "16") {
                    dataCod.BROKERAGE = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "TAX" || data[i].colLbl == "17") {
                    dataCod.TAX = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "OVERRIDINGCOM" || data[i].colLbl == "18") {
                    dataCod.OVERRIDINGCOM = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "CHARGE" || data[i].colLbl == "19") {
                    dataCod.CHARGE = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "PMRESERVERTD" || data[i].colLbl == "20") {
                    dataCod.PMRESERVERTD = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "PFPMRESERVERTD" || data[i].colLbl == "21") {
                    dataCod.PFPMRESERVERTD = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "PMRESERVERLD" || data[i].colLbl == "22") {
                    dataCod.PMRESERVERLD = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "PFPMRESERVERLD" || data[i].colLbl == "23") {
                    dataCod.PFPMRESERVERLD = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "CLAIM" || data[i].colLbl == "24") {
                    dataCod.CLAIM = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "LOSSRECOVERY" || data[i].colLbl == "25") {
                    dataCod.LOSSRECOVERY = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "CASHLOSS" || data[i].colLbl == "26") {
                    dataCod.CASHLOSS = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "CASHLOSSRD" || data[i].colLbl == "27") {
                    dataCod.CASHLOSSRD = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "LOSSRR" || data[i].colLbl == "28") {
                    dataCod.LOSSRR = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "LOSSRR2" || data[i].colLbl == "29") {
                    dataCod.LOSSRR2 = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "LOSSPFEND" || data[i].colLbl == "30") {
                    dataCod.LOSSPFEND = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "LOSSPFWOA" || data[i].colLbl == "31") {
                    dataCod.LOSSPFWOA = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "INTEREST" || data[i].colLbl == "32") {
                    dataCod.INTEREST = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "TAXON" || data[i].colLbl == "33") {
                    dataCod.TAXON = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "MISCELLANEOUS" || data[i].colLbl == "34") {
                    dataCod.MISCELLANEOUS = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "PMBL") {
                    dataCod.PMBL = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "CMBL") {
                    dataCod.CMBL = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "NTBL") {
                    dataCod.NTBL = data[i].text.replace(/ |,/g, '');
                } else if (data[i].colLbl == "CSCOSARFRNCNNT2" || data[i].colLbl == "35") {
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

            if (selAnswerRes.rows[0] != null) {
                //정답파일 비교
                var answerData = getAnswerData(selAnswerRes);
                var boolAnswer = getAnswerBool(answerData, dataCod);

                if (boolAnswer) {
                    //정답 Y update
                    if (dataArr[0] == "N") {
                        dataArr[0] = "Y";
                    }
                }
            }

            var condImgIdQuery = '('
            for (var i in fileInfos) {
                condImgIdQuery += "'";
                condImgIdQuery += fileInfos[i].imgId;
                condImgIdQuery += (i != fileInfos.length - 1) ? "'," : "')";
            }

            let updAnswerRes = await conn.execute(queryConfig.batchLearningConfig.updateBatchLearningData + condImgIdQuery, dataArr);
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

function getAnswerBool(answerData, dataCod) {
    var boolAnswer = true;

    if (answerData.UY != null && answerData.UY != dataCod.UY) {
        return boolAnswer = false;
    }
    if (answerData.CURCD != null && answerData.CURCD != dataCod.CURCD) {
        return boolAnswer = false;
    }
    if (answerData.PAIDPERCENT != null && answerData.PAIDPERCENT != dataCod.PAIDPERCENT) {
        return boolAnswer = false;
    }
    if (answerData.PAIDSHARE != null && answerData.PAIDSHARE != dataCod.PAIDSHARE) {
        return boolAnswer = false;
    }
    if (answerData.OSLPERCENT != null && answerData.OSLPERCENT != dataCod.OSLPERCENT) {
        return boolAnswer = false;
    }
    if (answerData.OSLSHARE != null && answerData.OSLSHARE != dataCod.OSLSHARE) {
        return boolAnswer = false;
    }
    if (answerData.GROSSPM != null && answerData.GROSSPM != dataCod.GROSSPM) {
        return boolAnswer = false;
    }
    if (answerData.PM != null && answerData.PM != dataCod.PM) {
        return boolAnswer = false;
    }
    if (answerData.PMPFEND != null && answerData.PMPFEND != dataCod.PMPFEND) {
        return boolAnswer = false;
    }
    if (answerData.PMPFWOS != null && answerData.PMPFWOS != dataCod.PMPFWOS) {
        return boolAnswer = false;
    }
    if (answerData.XOLPM != null && answerData.XOLPM != dataCod.XOLPM) {
        return boolAnswer = false;
    }
    if (answerData.RETURNPM != null && answerData.RETURNPM != dataCod.RETURNPM) {
        return boolAnswer = false;
    }
    if (answerData.GROSSCN != null && answerData.GROSSCN != dataCod.GROSSCN) {
        return boolAnswer = false;
    }
    if (answerData.PROFITCN != null && answerData.PROFITCN != dataCod.PROFITCN) {
        return boolAnswer = false;
    }
    if (answerData.BROKERAGE != null && answerData.BROKERAGE != dataCod.BROKERAGE) {
        return boolAnswer = false;
    }
    if (answerData.TAX != null && answerData.TAX != dataCod.TAX) {
        return boolAnswer = false;
    }
    if (answerData.OVERRIDINGCOM != null && answerData.OVERRIDINGCOM != dataCod.OVERRIDINGCOM) {
        return boolAnswer = false;
    }
    if (answerData.PMRESERVERTD1 != null && answerData.PMRESERVERTD1 != dataCod.PMRESERVERTD1) {
        return boolAnswer = false;
    }
    if (answerData.PFPMRESERVERTD1 != null && answerData.PFPMRESERVERTD1 != dataCod.PFPMRESERVERTD1) {
        return boolAnswer = false;
    }
    if (answerData.PMRESERVERTD2 != null && answerData.PMRESERVERTD2 != dataCod.PMRESERVERTD2) {
        return boolAnswer = false;
    }
    if (answerData.PFPMRESERVERTD2 != null && answerData.PFPMRESERVERTD2 != dataCod.PFPMRESERVERTD2) {
        return boolAnswer = false;
    }
    if (answerData.CLAIM != null && answerData.CLAIM != dataCod.CLAIM) {
        return boolAnswer = false;
    }
    if (answerData.LOSSRECOVERY != null && answerData.LOSSRECOVERY != dataCod.LOSSRECOVERY) {
        return boolAnswer = false;
    }
    if (answerData.CASHLOSS != null && answerData.CASHLOSS != dataCod.CASHLOSS) {
        return boolAnswer = false;
    }
    if (answerData.CASHLOSSRD != null && answerData.CASHLOSSRD != dataCod.CASHLOSSRD) {
        return boolAnswer = false;
    }
    if (answerData.LOSSRR != null && answerData.LOSSRR != dataCod.LOSSRR) {
        return boolAnswer = false;
    }
    if (answerData.LOSSRR2 != null && answerData.LOSSRR2 != dataCod.LOSSRR2) {
        return boolAnswer = false;
    }
    if (answerData.LOSSPFEND != null && answerData.LOSSPFEND != dataCod.LOSSPFEND) {
        return boolAnswer = false;
    }
    if (answerData.LOSSPFWOA != null && answerData.LOSSPFWOA != dataCod.LOSSPFWOA) {
        return boolAnswer = false;
    }
    if (answerData.INTEREST != null && answerData.INTEREST != dataCod.INTEREST) {
        return boolAnswer = false;
    }
    if (answerData.TAXON != null && answerData.TAXON != dataCod.TAXON) {
        return boolAnswer = false;
    }
    if (answerData.MISCELLANEOUS != null && answerData.MISCELLANEOUS != dataCod.MISCELLANEOUS) {
        return boolAnswer = false;
    }
    if (answerData.PMBL != null && answerData.PMBL != dataCod.PMBL) {
        return boolAnswer = false;
    }
    if (answerData.CMBL != null && answerData.CMBL != dataCod.CMBL) {
        return boolAnswer = false;
    }
    if (answerData.NTBL != null && answerData.NTBL != dataCod.NTBL) {
        return boolAnswer = false;
    }
    if (answerData.CSCOSARFRNCNNT2 != null && answerData.CSCOSARFRNCNNT2 != dataCod.CSCOSARFRNCNNT2) {
        return boolAnswer = false;
    }

    return boolAnswer;
}

function getAnswerData(selAnswerRes) {
    var answerData = {};
    answerData.UY = selAnswerRes.rows[0].UY;
    answerData.CURCD = selAnswerRes.rows[0].CURCD;
    answerData.PAIDPERCENT = selAnswerRes.rows[0].PAIDPERCENT;
    answerData.PAIDSHARE = selAnswerRes.rows[0].PAIDSHARE;
    answerData.OSLPERCENT = selAnswerRes.rows[0].OSLPERCENT;
    answerData.OSLSHARE = selAnswerRes.rows[0].OSLSHARE;
    answerData.GROSSPM = selAnswerRes.rows[0].GROSSPM;
    answerData.PM = selAnswerRes.rows[0].PM;
    answerData.PMPFEND = selAnswerRes.rows[0].PMPFEND;
    answerData.PMPFWOS = selAnswerRes.rows[0].PMPFWOS;
    answerData.XOLPM = selAnswerRes.rows[0].XOLPM;
    answerData.RETURNPM = selAnswerRes.rows[0].RETURNPM;
    answerData.GROSSCN = selAnswerRes.rows[0].GROSSCN;
    answerData.CN = selAnswerRes.rows[0].CN;
    answerData.PROFITCN = selAnswerRes.rows[0].PROFITCN;
    answerData.BROKERAGE = selAnswerRes.rows[0].BROKERAGE;
    answerData.TAX = selAnswerRes.rows[0].TAX;
    answerData.OVERRIDINGCOM = selAnswerRes.rows[0].OVERRIDINGCOM;
    answerData.CHARGE = selAnswerRes.rows[0].CHARGE;
    answerData.PMRESERVERTD1 = selAnswerRes.rows[0].PMRESERVERTD1;
    answerData.PFPMRESERVERTD1 = selAnswerRes.rows[0].PFPMRESERVERTD1;
    answerData.PMRESERVERTD2 = selAnswerRes.rows[0].PMRESERVERTD2;
    answerData.PFPMRESERVERTD2 = selAnswerRes.rows[0].PFPMRESERVERTD2;
    answerData.CLAIM = selAnswerRes.rows[0].CLAIM;
    answerData.LOSSRECOVERY = selAnswerRes.rows[0].LOSSRECOVERY;
    answerData.CASHLOSS = selAnswerRes.rows[0].CASHLOSS;
    answerData.CASHLOSSRD = selAnswerRes.rows[0].CASHLOSSRD;
    answerData.LOSSRR = selAnswerRes.rows[0].LOSSRR;
    answerData.LOSSRR2 = selAnswerRes.rows[0].LOSSRR2;
    answerData.LOSSPFEND = selAnswerRes.rows[0].LOSSPFEND;
    answerData.LOSSPFWOA = selAnswerRes.rows[0].LOSSPFWOA;
    answerData.INTEREST = selAnswerRes.rows[0].INTEREST;
    answerData.TAXON = selAnswerRes.rows[0].TAXON;
    answerData.MISCELLANEOUS = selAnswerRes.rows[0].MISCELLANEOUS;
    answerData.PMBL = selAnswerRes.rows[0].PMBL;
    answerData.CMBL = selAnswerRes.rows[0].CMBL;
    answerData.NTBL = selAnswerRes.rows[0].NTBL;
    answerData.CSCOSARFRNCNNT2 = selAnswerRes.rows[0].CSCOSARFRNCNNT2;

    return answerData;
}


async function runInsertLearnData(data, req, res, callbackRunInsertLearnData) {
    let ret;
    try {
        ret = await insertLearnData(data, req, res);
        console.log(ret);
        callbackRunInsertLearnData(ret);
    } catch (err) {
        console.error(err);
    }
}

function insertLearnData(data, req, res) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            console.log(data);
            var fileInfos = req.body.ocrData.fileInfo;
            var billInfo = req.body.mldata.docCategory[0];

            for (var j in data) {
                let LearnDataRes = await conn.execute("select count(*) as count from tbl_batch_learn_data where imgid = :imgid", [fileInfos[0].imgId]);
                var rowData = data[j];
                var dataCod = {};

                dataCod.STATEMENTDIV = billInfo.DOCNAME;

                for (var i in rowData) {
                    if (rowData[i].colLbl == "CTOGCOMPANYNAMENM" || rowData[i].colLbl == "0") {
                        dataCod.CTOGCOMPANYNAMENM = rowData[i].text;
                    } else if (rowData[i].colLbl == "CTNM" || rowData[i].colLbl == "1") {
                        dataCod.CTNM = rowData[i].text;
                    } else if (rowData[i].colLbl == "UY" || rowData[i].colLbl == "2") {
                        dataCod.UY = rowData[i].text;
                    } else if (rowData[i].colLbl == "CONTRACTNUM" || rowData[i].colLbl == "3") {
                        dataCod.CONTRACTNUM = rowData[i].text;
                    } else if (rowData[i].colLbl == "CURCD" || rowData[i].colLbl == "4") {
                        dataCod.CURCD = rowData[i].text;
                    } else if (rowData[i].colLbl == "PAIDPERCENT" || rowData[i].colLbl == "5") {
                        dataCod.PAIDPERCENT = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "PAIDSHARE" || rowData[i].colLbl == "6") {
                        dataCod.PAIDSHARE = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "OSLPERCENT" || rowData[i].colLbl == "7") {
                        dataCod.OSLPERCENT = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "OSLSHARE" || rowData[i].colLbl == "8") {
                        dataCod.OSLSHARE = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "GROSSPM") {
                        dataCod.GROSSPM = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "PM" || rowData[i].colLbl == "9") {
                        dataCod.PM = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "PMPFEND" || rowData[i].colLbl == "10") {
                        dataCod.PMPFEND = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "PMPFWOS" || rowData[i].colLbl == "11") {
                        dataCod.PMPFWOS = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "XOLPM" || rowData[i].colLbl == "12") {
                        dataCod.XOLPM = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "RETURNPM" || rowData[i].colLbl == "13") {
                        dataCod.RETURNPM = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "GROSSCN") {
                        dataCod.GROSSCN = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "CN" || rowData[i].colLbl == "14") {
                        dataCod.CN = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "PROFITCN" || rowData[i].colLbl == "15") {
                        dataCod.PROFITCN = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "BROKERAGE" || rowData[i].colLbl == "16") {
                        dataCod.BROKERAGE = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "TAX" || rowData[i].colLbl == "17") {
                        dataCod.TAX = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "OVERRIDINGCOM" || rowData[i].colLbl == "18") {
                        dataCod.OVERRIDINGCOM = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "CHARGE" || rowData[i].colLbl == "19") {
                        dataCod.CHARGE = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "PMRESERVERTD" || rowData[i].colLbl == "20") {
                        dataCod.PMRESERVERTD = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "PFPMRESERVERTD" || rowData[i].colLbl == "21") {
                        dataCod.PFPMRESERVERTD = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "PMRESERVERLD" || rowData[i].colLbl == "22") {
                        dataCod.PMRESERVERLD = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "PFPMRESERVERLD" || rowData[i].colLbl == "23") {
                        dataCod.PFPMRESERVERLD = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "CLAIM" || rowData[i].colLbl == "24") {
                        dataCod.CLAIM = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "LOSSRECOVERY" || rowData[i].colLbl == "25") {
                        dataCod.LOSSRECOVERY = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "CASHLOSS" || rowData[i].colLbl == "26") {
                        dataCod.CASHLOSS = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "CASHLOSSRD" || rowData[i].colLbl == "27") {
                        dataCod.CASHLOSSRD = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "LOSSRR" || rowData[i].colLbl == "28") {
                        dataCod.LOSSRR = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "LOSSRR2" || rowData[i].colLbl == "29") {
                        dataCod.LOSSRR2 = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "LOSSPFEND" || rowData[i].colLbl == "30") {
                        dataCod.LOSSPFEND = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "LOSSPFWOA" || rowData[i].colLbl == "31") {
                        dataCod.LOSSPFWOA = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "INTEREST" || rowData[i].colLbl == "32") {
                        dataCod.INTEREST = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "TAXON" || rowData[i].colLbl == "33") {
                        dataCod.TAXON = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "MISCELLANEOUS" || rowData[i].colLbl == "34") {
                        dataCod.MISCELLANEOUS = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "PMBL") {
                        dataCod.PMBL = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "CMBL") {
                        dataCod.CMBL = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "NTBL") {
                        dataCod.NTBL = rowData[i].text.replace(/ |,/g, '');
                    } else if (rowData[i].colLbl == "CSCOSARFRNCNNT2" || rowData[i].colLbl == "35") {
                        dataCod.CSCOSARFRNCNNT2 = rowData[i].text;
                    }
                }

                if (j + 1 <= LearnDataRes.rows[0].COUNT) {

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

                    //update
                    console.log("update");
                    var andCond = "('" + fileInfos[0].imgId + "') and subnum = " + (parseInt(j) + 1);  
                    let updLearnDataRes = await conn.execute(queryConfig.batchLearningConfig.updateBatchLearningData + andCond, dataArr);
                } else {
                    //insert
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
                        (parseInt(j) + 1)
                    ];

                    console.log("insert");
                    let insLearnDataRes = await conn.execute(queryConfig.batchLearningConfig.insertBatchLearningData, insArr);
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

var callbackUpdateBatchLearningData = function (rows, req, res) {
    console.log("UpdateBatchLearningData finish..");
    res.send({ code: 200, rows: rows });
};

// [POST] syncFile
async function isDirectory(f) {
    return (await mz.stat(f)).isDirectory();
}
async function readdir(filePath) {
    const files = await Promise.all((await mz.readdir(filePath)).map(async f => {
        const fullPath = path.join(filePath, f);
        return (await isDirectory(fullPath)) ? await readdir(fullPath) : fullPath;
    }));
    return flatten(files);
}
router.post('/syncFile', function (req, res) {
    const testFolder = propertiesConfig.filepath.imagePath;

    // files : 디렉토리에서 읽어온 파일들,  rows: TBL_BATCH_LEARN_DATA 파일들
    var fileProcess = function (files, rows, req, res) {
        console.log("files.... : " + files.length);
        console.log("rows.... : " + rows.length);
        let filePath = "";
        for (var i = 0; i < rows.length; i++) { // 현재 데이터에 존재하는 파일은 제거
            filePath = rows[i].FILEPATH;
            let _result = files.filter(function (_fileObj) {
                return _fileObj != filePath;
            });
            if (i == rows.length - 1) {
                if (files.length > 0) {
                    commonDB.syncBatchFiles(files, req, res);
                } else {
                    res.send({ code: 200, message: null, fileInfo: null });
                }
            }
        }
    };

    var callbackSelectFileNameList = function (rows, req, res) {
        console.log(rows);
        readdir(testFolder)
            .then(files => {
                //files.forEach(f => console.log(f));
                fileProcess(files, rows, req, res);
            })
            .catch(console.error);
    };

    commonDB.reqQueryParam(queryConfig.batchLearningConfig.selectFileNameList, [], callbackSelectFileNameList, req, res);
});

router.post('/compareBatchLearningData', function (req, res) {
    var dataObj = req.body.dataObj;
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
        dataObj.MAPPINGCTNM = rows[0].EXTCTNM;
        //var PM = commonUtil.nvl2(dataObj.PM == undefined ? 0:dataObj.PM.replace(",", "").replace(/(\s*)/g, "").trim(), 0);
        //var CN = commonUtil.nvl2(dataObj.CN == undefined ? 0 :dataObj.CN.replace(",", "").replace(/(\s*)/g, "").trim(), 0);
        if (dataObj.fileToPage.IMGID) {
            commonDB.reqQueryParam2(queryConfig.batchLearningConfig.compareBatchLearningData, [
                dataObj.fileToPage.IMGID
            ], callbackcompareBatchLearningData, dataObj, req, res);
        } else {
            res.send({ isContractMapping: false });
        }
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

var callbackSelectMultiBatchAnswerDataToFilePath = function (rows, req, res) {
    res.send(rows);
};
router.post('/selectMultiBatchAnswerDataToFilePath', function (req, res) {
    var queryIn = req.body.queryIn;

    commonDB.reqQuery(queryConfig.batchLearningConfig.selectMultiBatchAnswerDataToFilePath + queryIn, callbackSelectMultiBatchAnswerDataToFilePath, req, res);
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

router.post('/batchLearnTraing', function (req, res) {
    sync.fiber(function () {
        var imgId = req.body.imgIdArray;
        var uiCheck = req.body.uiCheck;
        var retData = [];
        var uiTraining = '';
        for (var i = 0; i < imgId.length; i++) {
            var batchData = sync.await(batchLearnTraing(imgId[i], uiCheck, sync.defer()));

            if (batchData.uiTraining && batchData.uiTraining == "uiTraining") {
                retData = [];
                retData.push(batchData);
                break;
            }

            retData.push(batchData);
        }

        res.send({ data: retData });
    });
});


function batchLearnTraing(imgId, uiCheck, done) {
    sync.fiber(function () {
        try {

            var retData = {};

            var originArr = [imgId];

            var originImageArr = sync.await(oracle.selectOcrFilePaths(originArr, sync.defer()));

            if (originImageArr == "error") {
                return done(null, "error selectOcrFilePaths");
            }

            originImageArr = [originImageArr[0]];

            //tif to jpg
            for (var item in originImageArr) {
                if (originImageArr[item].FILENAME.split('.')[1].toLowerCase() === 'tif' || originImageArr[item].FILENAME.split('.')[1].toLowerCase() === 'tiff') {
                    let result = sync.await(oracle.convertTiftoJpg(originImageArr[item].FILEPATH, sync.defer()));
                    if (result) {
                        originImageArr[item]['ORIGINFILEPATH'] = originImageArr[item]['FILEPATH'];
                        originImageArr[item]['FILEPATH'] = result;
                    }

                    if (result == "error") {
                        return done(null, "error convertTiftoJpg");
                    }
                }
            }

            //ocr
            var ocrResult = sync.await(oracle.callApiOcr(originImageArr, sync.defer()));

            if (ocrResult == "error") {
                return done(null, "error ocr");
            }

            console.log("done ocr");

            //typo ML
            pythonConfig.typoOptions.args.push(JSON.stringify(dataToTypoArgs(ocrResult)));
            var resPyStr = sync.await(PythonShell.run('typo2.py', pythonConfig.typoOptions, sync.defer()));
            var resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
            var sidData = sync.await(oracle.select(resPyArr, sync.defer()));

            console.log("done typo ML");

            //form label mapping DL
            pythonConfig.formLabelMappingOptions.args.push(JSON.stringify(sidData));
            resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.formLabelMappingOptions, sync.defer()));
            resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));

            console.log("done formLabelMapping ML");

            //form mapping DL
            pythonConfig.formMappingOptions.args.push(JSON.stringify(resPyArr));
            resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.formMappingOptions, sync.defer()));
            resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
            var docData = sync.await(oracle.selectDocCategory(resPyArr, sync.defer()));

            console.log("done formMapping ML");

            //column mapping DL
            pythonConfig.columnMappingOptions.args.push(JSON.stringify(docData.data));
            resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.columnMappingOptions, sync.defer()));
            resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));

            var mlData = {};
            mlData["mlData"] = resPyArr;
            mlData["docCategory"] = docData.docCategory[0];
            mlData["imgId"] = imgId;

            retData["mlexport"] = mlData;

            console.log("done columnMapping ML");

            //select legacy data
            var cobineRegacyData = sync.await(oracle.selectLegacyData(imgId, sync.defer()));

            retData["regacy"] = cobineRegacyData;

            //insert legacy data to batchLearnData
            sync.await(oracle.insertRegacyData(cobineRegacyData, sync.defer()));

            //insert MLexport data to batchMlExport
            sync.await(oracle.insertMLData(mlData, sync.defer()));

            if (uiCheck == true) {
                var compareML = getAnswerCheck(cobineRegacyData, mlData["mlData"]);

                retData["uiTraining"] = "uiTraining";

                if (compareML == false) {

                    var columnArr = sync.await(oracle.selectColumn(null, sync.defer()));
                    retData["columnArr"] = columnArr;
                    retData["fileInfo"] = originImageArr;

                    return done(null, retData);
                }
            }

            console.log("done");

            return done(null, retData);
        } catch (e) {
            console.log(e);
            return done(null, "error");
        }
    });
}

function dataToTypoArgs(data) {

    for (var i in data) {
        data[i].text = data[i].text.toLowerCase().replace("'", "`");
    }
    return data;
}

function getAnswerCheck(lagacy, ml) {
    var ogcomnm = [];
    var ctnm = [];
    var mlCheck = Array.apply(null, new Array(38)).map(Number.prototype.valueOf, 0);
    var ogcomnCheck = 0;
    var ctnmCheck = 0;
    var numCheck = lagacy.length + 1;

    for (var i = 0; i < lagacy.length; i++) {
        ogcomnm.push(lagacy[i].OGCOMPANYNAME);
        ctnm.push(lagacy[i].CTNM);
    }

    for (var i = 0; i < ml.length; i++) {
        var colLbl = ml[i].colLbl;

        if (ml[i].colLbl == "0") {
            if (ogcomnm.indexOf(ml[i].text) > -1) {
                mlCheck[colLbl] += 1;
            }
        }
        if (ml[i].colLbl == "1") {
            if (ctnm.indexOf(ml[i].text) > -1) {
                mlCheck[colLbl] += 1;
            }
        }
        if (ml[i].colLbl == "5") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "6") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "7") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "8") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "9") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "10") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "11") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "12") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "13") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "14") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "15") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "16") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "17") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "18") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "19") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "20") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "21") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "22") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "23") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "24") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "25") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "26") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "27") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "28") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "29") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "30") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "31") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "32") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "33") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "34") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "35") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "36") {
            mlCheck[colLbl] += 1;
        }
        if (ml[i].colLbl == "37") {
            mlCheck[colLbl] += 1;
        }

    }

    for (var i = 0; i < mlCheck.length; i++) {
        if (mlCheck.length != 36 && mlCheck[i] != numCheck) {
            return false;
        }
    }

    return true;

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
        });

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
    console.log(":::::::::::retrunObj : " + JSON.stringify(returnObj));
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
var callbackSelectDocCategory = function (rows, req, res) {
    if (rows.length > 0) {
        res.send({ code: 200, docCategory: rows, message: 'document Category insert success' });
    } else {
        res.send({ code: 500, message: 'document Category select error' });
    }
};
var callbackInsertDocCategory = function (rows, docType, req, res) {

    commonDB.reqQueryParam(queryConfig.mlConfig.selectDocCategory, [docType], callbackSelectDocCategory, req, res);
    //res.send({ code: 200, message: 'document Category insert success' });
};
var callbackSelectMaxDocType = function (rows, req, res) {
    var docName = req.body.docName;
    var sampleImagePath = req.body.sampleImagePath;
    var docType = parseInt(rows[0].DOCTYPE);
    if (docType == 998) { // unk 가 999이므로 피하기 위함
        docType++;
    }
    commonDB.reqQueryParam2(queryConfig.batchLearningConfig.insertDocCategory, [docName, (docType + 1), sampleImagePath], callbackInsertDocCategory, (docType + 1), req, res);
};
router.post('/insertDocCategory', function (req, res) {

    commonDB.reqQuery(queryConfig.batchLearningConfig.selectMaxDocType, callbackSelectMaxDocType, req, res);
});
// end 신규문서 양식 등록 

Date.prototype.isoNum = function (n) {
    var tzoffset = this.getTimezoneOffset() * 60000; //offset in milliseconds
    var localISOTime = (new Date(this - tzoffset)).toISOString().slice(0, -1);
    return localISOTime.replace(/[-T:\.Z]/g, '').substring(0, n || 20); // YYYYMMDD
};


module.exports = router;