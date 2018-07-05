'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var execSync = require('child_process').execSync;
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

var commModule = require(appRoot + '/public/js/import.js');
var commonUtil = commModule.commonUtil;
var router = commModule.router;
var queryConfig = commModule.queryConfig;

var router = express.Router();

// web server to rest server file upload test router
router.get('/dmzTest', function (req, res) {
	var request = require('request');
	
	var formData = {
        file: {
        value: fs.createReadStream('uploads/26.jpg'),
        options: {
            filename: '26.jpg',
		    contentType: 'image/jpeg'
        }
        }
    };

    request.post({url: 'http://localhost:3001/ocr/api', formData: formData}, function (err,httpRes,body){
		var data = (JSON.parse(body));
		//console.log(data);
		res.send(data);
	});
	
});

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// uiLearning.html 보여주기 (get)
router.get('/', function (req, res) {
    res.render('user/uiLearning');
});

// userDashbaord.html 보여주기 (post)
router.post('/', function (req, res) {
    res.render('user/uiLearning');
});

// db컬럼명 조회
router.post('/searchDBColumns', function (req, res) {
    var fileName = req.body.fileName;
    var data = req.body.data;
    var query = queryConfig.dbcolumnsConfig.selDBColumns;

    commModule.commonDB.reqQuery(query, function (rows, req, res) {
        res.send({ 'fileName': fileName, 'data':data, 'dbColumns': rows });
    }, req, res);
});

// fileupload
router.post('/uploadFile', upload.any(), function (req, res) {
    var files = req.files;
	console.log(files);
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


module.exports = router;
