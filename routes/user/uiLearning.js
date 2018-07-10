'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var execSync = require('child_process').execSync;
var exec = require('child_process').exec;
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

    const defaults = {
        encoding: 'utf8',
    };

    //var arg = '"Partner of Choice"' + ' ' + '"Class of Business"' + ' ';

    var args = '';
    for (var i = 0; i < data.length; i++) {
        args += '"' + data[i].text + '"' + ' ';
    }

    var exeTextString = 'python ' + appRoot + '\\ml\\cnn-text-classification\\eval.py ' + args;
    //var exeString = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\eval.py ' + arg;
    exec(exeTextString, defaults, function (err, stdout, stderr) {
        var obj = JSON.parse(stdout);
        //console.log(obj);
        var label = [];

        for (var key in obj) {

            for (var i = 0; i < data.length; i++) {
                if (data[i].text.toLowerCase() == key.toLowerCase()) {
                    data[i].label = obj[key];
                }
            }

            if (obj[key] == "fixlabel" || obj[key] == "entryrowlabel") {
                label.push(key);        
                //console.log("key:" + key + ", value:" + obj[key]);
            }
        }

        var labelArgs = '';

        for (var i = 0; i < label.length; i++) {
            labelArgs += '"' + label[i] + '" ';
        }

        var exeLabelString = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\eval.py ' + labelArgs;
        exec(exeLabelString, defaults, function (err1, stdout1, stderr1) {
            var jsonLabel = JSON.parse(stdout1);
            var dataArray = [];

            var dataText = JSON.stringify(stdout1);
            dataText = dataText.replace(/\\/gi, "");
            dataText = dataText.slice(0, -4);
            //console.log(dataText);

            for (var key in jsonLabel) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].text.toLowerCase() == key.toLowerCase()) {
                        data[i].column = jsonLabel[key];
                        var obj = {};
                        obj.text = data[i].text;
                        obj.column = data[i].column;
                        dataArray.push(obj);
                    }
                }
            }

            for (var i = 0; i < data.length; i++) {
                if (data[i].label == "fixvalue" || data[i].label == "entryvalue") {

                    var splitLocation = data[i].location.split(",");

                    var xCoodi = splitLocation[0];
                    var yCoodi = splitLocation[1];
                    var minDis = 100000;
                    var columnText = '';

                    for (var j = 0; j < data.length; j++) {
                        if (data[j].label == "fixlabel" || data[j].label == "entryrowlabel") {
                            var jSplitLocation = data[j].location.split(",");

                            var xNum = jSplitLocation[0];
                            var yNum = jSplitLocation[1];

                            var diffX = xCoodi - xNum;
                            var diffY = yCoodi - yNum;

                            var dis = Math.sqrt(Math.abs(diffX * diffX) + Math.abs(diffY * diffY));

                            if (minDis > dis) {
                                minDis = dis;
                                columnText = data[j].column;
                            }
                        }
                    }
                    data[i].column = columnText + "_VALUE";

                    //dataText += ',"' + data[i].text + '":"' + data[i].column + '"'; 

                    var obj = {}
                    obj.text = data[i].text
                    obj.column = data[i].column;
                    dataArray.push(obj);

                }
            }

            res.send({ 'fileName': fileName, 'data': data, 'dbColumns': dataArray });
            
        });

    });

    /*
    commModule.commonDB.reqQuery(query, function (rows, req, res) {
        res.send({ 'fileName': fileName, 'data':data, 'dbColumns': rows });
    }, req, res);
    */

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
