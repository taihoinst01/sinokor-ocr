'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var router = express.Router();

// upload file setting
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./uploads");
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});
var upload = multer({ storage: storage }).single("uploadFile");

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// ocrFormAnalysis.html 보여주기
router.get('/', function (req, res) {
    res.render('user/ocrFormAnalysis');
});

// 지정 디렉토리안의 파일 목록 가져오기
router.get('/getFiles', function (req, res) {
    var files = getFiles('./uploads');
    var count = 0;
    var fileJson = [];
    files.forEach(function (v, i) {
        var item = {
            "fileName": v,
            "time": fs.statSync(v).atime
        };
        fileJson.push(item);
        count = i;
    });
    res.send({ "files": fileJson, "count": count });
});

// 파일 업로드
router.post('/upload', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log('upload error :' + err);
            return res.send("error uploading file.");
        }
        var filePath = req.headers.origin + "/uploads/" + req.file.filename;

        res.send(filePath);
    });
});

// 이미지 다운로드
router.get('/downloadImg', function (req, res) {
    var fileName = req.query.fileName;

    var file = appRoot + '/uploads/' + fileName;
    res.download(file);

});

// 파일 삭제
router.post('/deleteFile', function (req, res) {
    var data = req.body.data;

    for (var i = 0; i < data.length; i++) {
        var file = appRoot + '/uploads/' + data[i].fileName;
        fs.unlink(file, function (err) { if (err) throw err; });
    }

    res.send();
});

//pdf에서 img로 변환
router.post('/pdf2img', function (req, res) {
    var inputFile = req.body.fileName;

});

//엑셀 작업
router.post('/uploadExcel', function (req, res) {
    var excelPath = appRoot + '/excel/'
    var data = req.body.data;
    var failExcelName = '';
    var successExcelName = '';
    var successData = [];
    var failData = [];

    for (var i = 0; i < data.length; i++) {
        if (data[i].documentType == 1 && data[i].contractName == '' && data[i].email == '' &&
            data[i].price1 == '' && data[i].price2 == '' &&
            data[i].price3 == '' && data[i].totPrice == '') {
            failData.push(data[i]);
        }
        else if (data[i].documentType == 2 && data[i].shipper == '' && data[i].cosignee == '') {
            failData.push(data[i]);
        }
        else {
            successData.push(data[i]);
        }
    }

    var successworkbook = new exceljs.Workbook();
    var failworkbook = new exceljs.Workbook();

    successworkbook.xlsx.readFile(excelPath + 'template2.xlsx').then(function () {
        var worksheet;
        for (i = 0; i < successData.length; i++) {
            if (successData[i].documentType == 1) {
                worksheet = successworkbook.getWorksheet(1); // 첫번째 워크시트

                worksheet.columns = [
                    { width: 5 },
                    { width: 30 },
                    { width: 20 },
                    { width: 40 },
                    { width: 40 },
                    { width: 30 },
                    { width: 16 },
                    { width: 16 },
                    { width: 16 },
                    { width: 16 },
                    { width: 10 },
                    { width: 10 }
                ];
                var templateRow = worksheet.getRow(3);
                templateRow.getCell(1).value = 'NO.';
                templateRow.getCell(2).value = '파일명';
                templateRow.getCell(3).value = '날짜';
                templateRow.getCell(4).value = '회사명';
                templateRow.getCell(5).value = '계약명';
                templateRow.getCell(6).value = '이메일';
                templateRow.getCell(7).value = '금액1';
                templateRow.getCell(8).value = '금액2';
                templateRow.getCell(9).value = '금액3';
                templateRow.getCell(10).value = '총합계';
                templateRow.getCell(11).value = '상세';
                templateRow.getCell(12).value = '비고';
                for (var cellCount = 1; cellCount < 13; cellCount++) {
                    templateRow.getCell(cellCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
                    templateRow.getCell(cellCount).font = { color: { argb: 'FFFFFF' }, bold: true };
                    templateRow.getCell(cellCount).border = {
                        top: { style: 'thin', color: { argb: '000000' } },
                        left: { style: 'thin', color: { argb: '000000' } },
                        bottom: { style: 'thin', color: { argb: '000000' } },
                        right: { style: 'thin', color: { argb: '000000' } }
                    };
                }

                var row = worksheet.getRow(4);
                for (var i = 0; i < successData.length; i++) {
                    row = worksheet.getRow(4 + i)
                    row.getCell(1).value = (i + 1) // NO
                    row.getCell(2).value = successData[i].fileName; // 파일명
                    row.getCell(3).value = successData[i].docDate; // 날짜
                    row.getCell(4).value = successData[i].companyName; // 회사명
                    row.getCell(5).value = successData[i].contractName; // 계약명
                    row.getCell(6).value = successData[i].email; // 이메일
                    row.getCell(7).value = successData[i].price1; // 금액1
                    row.getCell(8).value = successData[i].price2; // 금액2
                    row.getCell(9).value = successData[i].price3; // 금액3
                    row.getCell(10).value = successData[i].totPrice; // 총합계
                    row.getCell(11).value = successData[i].detail; // 상세
                    row.getCell(12).value = successData[i].etc; // 비고
                    for (var j = 1; j < 13; j++) {
                        row.getCell(j).border = {
                            top: { style: 'thin', color: { argb: '000000' } },
                            left: { style: 'thin', color: { argb: '000000' } },
                            bottom: { style: 'thin', color: { argb: '000000' } },
                            right: { style: 'thin', color: { argb: '000000' } }
                        };
                    }
                }

                if (successData.length > 0) {                  
                    row.commit();

                    var d = new Date();
                    successExcelName += 'success_';
                    successExcelName += d.getFullYear();
                    successExcelName += ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1));
                    successExcelName += (d.getDate() < 10 ? '0' + d.getDate() : d.getDate());
                    successExcelName += (d.getHours() < 10 ? '0' + d.getHours() : d.getHours());
                    successExcelName += (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
                    successExcelName += (d.getMilliseconds() < 10 ? '00' + d.getMilliseconds() : (d.getMilliseconds() < 100) ? '0' + d.getMilliseconds() : d.getMilliseconds());
                    successExcelName += '.xlsx';
                    successworkbook.xlsx.writeFile(excelPath + successExcelName);
                }

                failworkbook.xlsx.readFile(excelPath + 'template2.xlsx').then(function () {
                    var worksheet = failworkbook.getWorksheet(1); // 첫번째 워크시트
                    worksheet.columns = [
                        { width: 5 },
                        { width: 30 },
                        { width: 20 },
                        { width: 40 },
                        { width: 40 },
                        { width: 30 },
                        { width: 16 },
                        { width: 16 },
                        { width: 16 },
                        { width: 16 },
                        { width: 10 },
                        { width: 10 }
                    ];
                    var templateRow = worksheet.getRow(3);
                    templateRow.getCell(1).value = 'NO.';
                    templateRow.getCell(2).value = '파일명';
                    templateRow.getCell(3).value = '날짜';
                    templateRow.getCell(4).value = '회사명';
                    templateRow.getCell(5).value = '계약명';
                    templateRow.getCell(6).value = '이메일';
                    templateRow.getCell(7).value = '금액1';
                    templateRow.getCell(8).value = '금액2';
                    templateRow.getCell(9).value = '금액3';
                    templateRow.getCell(10).value = '총합계';
                    templateRow.getCell(11).value = '상세';
                    templateRow.getCell(12).value = '비고';
                    for (var cellCount = 1; cellCount < 13; cellCount++) {
                        templateRow.getCell(cellCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
                        templateRow.getCell(cellCount).font = { color: { argb: 'FFFFFF' }, bold: true };
                        templateRow.getCell(cellCount).border = {
                            top: { style: 'thin', color: { argb: '000000' } },
                            left: { style: 'thin', color: { argb: '000000' } },
                            bottom: { style: 'thin', color: { argb: '000000' } },
                            right: { style: 'thin', color: { argb: '000000' } }
                        };
                    }

                    var row = worksheet.getRow(4);
                    for (var i = 0; i < failData.length; i++) {
                        var row = worksheet.getRow(4 + i)
                        row.getCell(1).value = (i + 1) // NO
                        row.getCell(2).value = failData[i].fileName; // 파일명
                        row.getCell(3).value = failData[i].docDate; // 날짜
                        if (failData[i].docDate != '') {
                            row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } };
                        }
                        row.getCell(4).value = failData[i].companyName; // 회사명
                        if (failData[i].companyName != '') {
                            row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } };
                        }
                        row.getCell(5).value = failData[i].contractName; // 계약명
                        row.getCell(6).value = failData[i].email; // 이메일
                        row.getCell(7).value = failData[i].price1; // 금액1
                        row.getCell(8).value = failData[i].price2; // 금액2
                        row.getCell(9).value = failData[i].price3; // 금액3
                        row.getCell(10).value = failData[i].totPrice; // 총합계
                        row.getCell(11).value = failData[i].detail; // 상세
                        row.getCell(12).value = failData[i].etc; // 비고
                        for (var j = 1; j < 13; j++) {
                            row.getCell(j).border = {
                                top: { style: 'thin', color: { argb: '000000' } },
                                left: { style: 'thin', color: { argb: '000000' } },
                                bottom: { style: 'thin', color: { argb: '000000' } },
                                right: { style: 'thin', color: { argb: '000000' } }
                            };
                        }
                    }

                    if (failData.length > 0) {
                        row.commit();

                        var d = new Date();
                        failExcelName += 'fail_';
                        failExcelName += d.getFullYear();
                        failExcelName += ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1));
                        failExcelName += (d.getDate() < 10 ? '0' + d.getDate() : d.getDate());
                        failExcelName += (d.getHours() < 10 ? '0' + d.getHours() : d.getHours());
                        failExcelName += (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
                        failExcelName += (d.getMilliseconds() < 10 ? '00' + d.getMilliseconds() : (d.getMilliseconds() < 100) ? '0' + d.getMilliseconds() : d.getMilliseconds());
                        failExcelName += '.xlsx';
                        failworkbook.xlsx.writeFile(excelPath + failExcelName);
                    }
                    //res.send({ 'successCount': successData.length, 'failCount': failData.length, 'successExcelName': successExcelName, 'failExcelName': failExcelName });
                });
            } else if (successData[i].documentType == 2) {
                worksheet = successworkbook.getWorksheet(2); // 두번째 워크시트
                worksheet.columns = [
                    { width: 5 },
                    { width: 30 },
                    { width: 15 },
                    { width: 30 },
                    { width: 50 },
                    { width: 50 },
                    { width: 50 },
                    { width: 50 }
                ];
                var templateRow = worksheet.getRow(3);
                templateRow.getCell(1).value = 'NO.';
                templateRow.getCell(2).value = '파일명';
                templateRow.getCell(3).value = '날짜';
                templateRow.getCell(4).value = '문서번호';
                templateRow.getCell(5).value = '하주회사';
                templateRow.getCell(6).value = '하주회사 지역';
                templateRow.getCell(7).value = '수취회사';
                templateRow.getCell(8).value = '수취회사 지역';
                for (var cellCount = 1; cellCount < 9; cellCount++) {
                    templateRow.getCell(cellCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
                    templateRow.getCell(cellCount).font = { color: { argb: 'FFFFFF' }, bold: true };
                    templateRow.getCell(cellCount).border = {
                        top: { style: 'thin', color: { argb: '000000' } },
                        left: { style: 'thin', color: { argb: '000000' } },
                        bottom: { style: 'thin', color: { argb: '000000' } },
                        right: { style: 'thin', color: { argb: '000000' } }
                    };
                }

                var row = worksheet.getRow(4);
                for (var i = 0; i < successData.length; i++) {
                    row = worksheet.getRow(4 + i)
                    row.getCell(1).value = (i + 1)                          // NO
                    row.getCell(2).value = successData[i].fileName;         // 파일명
                    row.getCell(3).value = successData[i].docDate;          // 날짜
                    row.getCell(4).value = successData[i].bookingNum;       // 문서번호
                    row.getCell(5).value = successData[i].shipper;          // 하주회사
                    row.getCell(6).value = successData[i].shipperRegion;    // 하주회사 지역
                    row.getCell(7).value = successData[i].cosignee;         // 수취회사
                    row.getCell(8).value = successData[i].cosigneeRegion;   // 수취회사 지역
                    for (var j = 1; j < 9; j++) {
                        row.getCell(j).border = {
                            top: { style: 'thin', color: { argb: '000000' } },
                            left: { style: 'thin', color: { argb: '000000' } },
                            bottom: { style: 'thin', color: { argb: '000000' } },
                            right: { style: 'thin', color: { argb: '000000' } }
                        };
                    }
                }

                if (successData.length > 0) {
                    row.commit();

                    var d = new Date();
                    successExcelName += 'success_';
                    successExcelName += d.getFullYear();
                    successExcelName += ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1));
                    successExcelName += (d.getDate() < 10 ? '0' + d.getDate() : d.getDate());
                    successExcelName += (d.getHours() < 10 ? '0' + d.getHours() : d.getHours());
                    successExcelName += (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
                    successExcelName += (d.getMilliseconds() < 10 ? '00' + d.getMilliseconds() : (d.getMilliseconds() < 100) ? '0' + d.getMilliseconds() : d.getMilliseconds());
                    successExcelName += '.xlsx';
                    successworkbook.xlsx.writeFile(excelPath + successExcelName);
                }

                failworkbook.xlsx.readFile(excelPath + 'template2.xlsx').then(function () {
                    var worksheet = failworkbook.getWorksheet(2); // 두번째 워크시트
                    worksheet.columns = [
                        { width: 5 },
                        { width: 30 },
                        { width: 15 },
                        { width: 30 },
                        { width: 50 },
                        { width: 50 },
                        { width: 50 },
                        { width: 50 }
                    ];
                    var templateRow = worksheet.getRow(3);
                    templateRow.getCell(1).value = 'NO.';
                    templateRow.getCell(2).value = '파일명';
                    templateRow.getCell(3).value = '날짜';
                    templateRow.getCell(4).value = '문서번호';
                    templateRow.getCell(5).value = '하주회사';
                    templateRow.getCell(6).value = '하주회사 지역';
                    templateRow.getCell(7).value = '수취회사';
                    templateRow.getCell(8).value = '수취회사 지역';

                    for (var cellCount = 1; cellCount < 9; cellCount++) {
                        templateRow.getCell(cellCount).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
                        templateRow.getCell(cellCount).font = { color: { argb: 'FFFFFF' }, bold: true };
                        templateRow.getCell(cellCount).border = {
                            top: { style: 'thin', color: { argb: '000000' } },
                            left: { style: 'thin', color: { argb: '000000' } },
                            bottom: { style: 'thin', color: { argb: '000000' } },
                            right: { style: 'thin', color: { argb: '000000' } }
                        };
                    }

                    var row = worksheet.getRow(4);
                    for (var i = 0; i < failData.length; i++) {
                        var row = worksheet.getRow(4 + i)
                        row.getCell(1).value = (i + 1) // NO
                        row.getCell(2).value = failData[i].fileName;                                                    // 파일명
                        row.getCell(3).value = failData[i].docDate;                                                     // 날짜
                        if (failData[i].docDate != '') {
                            row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } };
                        }
                        row.getCell(4).value = failData[i].bookingNum;                                                  // 문서번호
                        if (failData[i].bookingNum != '') {
                            row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000' } };
                        }
                        row.getCell(5).value = failData[i].send_tel;                                                    // 하주회사
                        row.getCell(6).value = failData[i].send_fax;                                                    // 하주회사 지역
                        row.getCell(7).value = failData[i].send_person;                                                 // 수취회사
                        row.getCell(8).value = failData[i].receive_company;                                             // 수취회사 지역

                        for (var j = 1; j < 9; j++) {
                            row.getCell(j).border = {
                                top: { style: 'thin', color: { argb: '000000' } },
                                left: { style: 'thin', color: { argb: '000000' } },
                                bottom: { style: 'thin', color: { argb: '000000' } },
                                right: { style: 'thin', color: { argb: '000000' } }
                            };
                        }
                    }

                    if (failData.length > 0) {
                        row.commit();

                        var d = new Date();
                        failExcelName += 'fail_';
                        failExcelName += d.getFullYear();
                        failExcelName += ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1));
                        failExcelName += (d.getDate() < 10 ? '0' + d.getDate() : d.getDate());
                        failExcelName += (d.getHours() < 10 ? '0' + d.getHours() : d.getHours());
                        failExcelName += (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes());
                        failExcelName += (d.getMilliseconds() < 10 ? '00' + d.getMilliseconds() : (d.getMilliseconds() < 100) ? '0' + d.getMilliseconds() : d.getMilliseconds());
                        failExcelName += '.xlsx';
                        failworkbook.xlsx.writeFile(excelPath + failExcelName);
                    }
                    //res.send({ 'successCount': successData.length, 'failCount': failData.length, 'successExcelName': successExcelName, 'failExcelName': failExcelName });
                });
            }
        }
        res.send({ 'successCount': successData.length, 'failCount': failData.length, 'successExcelName': successExcelName, 'failExcelName': failExcelName });
    });
});

//엑셀 다운로드
router.get('/downloadExcel', function (req, res) {
    var excelPath = appRoot + '/excel/'
    var fileName = req.query.fileName;

    res.download(excelPath + fileName);
});

// 디렉토리의 파일 목록 가져오는 함수
function getFiles(dir, files_) {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

//ocr 결과값 데이터 추출 함수
function typeOfdata(data) {
    var result = [];
}

module.exports = router;
