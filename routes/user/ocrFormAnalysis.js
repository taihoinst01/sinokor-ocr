'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
const gs = require('ghostscript4js')
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

    try {
        const version = gs.version()
        //console.log(version)
        var dirName = getConvertDate();
        fs.mkdirSync("./pdf2img/" + dirName);
        gs.executeSync('-psconv -q -dNOPAUSE -sDEVICE=jpeg -sOutputFile=pdf2img/' + dirName + '/' +inputFile.split('.')[0] +'-%03d.jpg -r800x800 -f uploads/' + inputFile + ' -c quit');
        res.send({ code: 200, dirName: dirName , imgName: fs.readdirSync("./pdf2img/" + dirName) });
    } catch (err) {
        throw err;
    }

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
        successData.push(data[i]);
    }

    var successworkbook = new exceljs.Workbook();
    var failworkbook = new exceljs.Workbook();
    try {
        successworkbook.xlsx.readFile(excelPath + 'template2.xlsx').then(function () {
            var worksheet;

            worksheet = successworkbook.getWorksheet(1); // 첫번째 워크시트
            worksheet.name = successData[0].formName;

            worksheet.columns = [
                { width: 5 },
                { width: 30 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 20 }
            ];

            var templateRow = worksheet.getRow(3);
            templateRow.getCell(1).value = 'NO.';
            templateRow.getCell(2).value = '파일명';
            for (var i = -2; i < successData[0].columns.length; i++) {
                if (i >= 0) {
                    templateRow.getCell(i + 3).value = successData[0].columns[i].columnName;
                }
                templateRow.getCell(i + 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
                templateRow.getCell(i + 3).font = { color: { argb: 'FFFFFF' }, bold: true };
                templateRow.getCell(i + 3).border = {
                    top: { style: 'thin', color: { argb: '000000' } },
                    left: { style: 'thin', color: { argb: '000000' } },
                    bottom: { style: 'thin', color: { argb: '000000' } },
                    right: { style: 'thin', color: { argb: '000000' } }
                };
            }

            var row = worksheet.getRow(4);
            for (var i = 0; i < successData.length; i++) {
                row = worksheet.getRow(4 + i);
                row.getCell(1).value = (i + 1);
                row.getCell(2).value = successData[i].fileName;
                for (var j = 0; j < successData[i].lineText.length; j++) {
                    if (successData[i].lineText[j].column) {
                        for (var k = 0; k < successData[i].columns.length; k++) {
                            if (successData[i].lineText[j].column == successData[i].columns[k].no) {
                                for (var m = -2; m < successData[i].columns.length; m++) {
                                    row.getCell(m + 3).border = {
                                        top: { style: 'thin', color: { argb: '000000' } },
                                        left: { style: 'thin', color: { argb: '000000' } },
                                        bottom: { style: 'thin', color: { argb: '000000' } },
                                        right: { style: 'thin', color: { argb: '000000' } }
                                    };

                                    if (successData[i].columns[k].columnName == templateRow.getCell(m + 3).value) {
                                        row.getCell(m + 3).value = successData[i].lineText[j].text;
                                        break;
                                    }
                                }
                            }
                        }
                    }
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
                res.send({ 'successCount': successData.length, 'successExcelName': successExcelName });
            }
        });
    } catch (e) {
        console.log(e);
    }
    
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

module.exports = router;
