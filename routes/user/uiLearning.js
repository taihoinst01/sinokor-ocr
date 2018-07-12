'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var execSync = require('child_process').execSync;
var exec = require('child_process').exec;
var request = require('request');
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
	
	var formData = {
        file: {
            value: fs.createReadStream('uploads/26.jpg'),
            options: {
                filename: '26.jpg',
		        contentType: 'image/jpeg'
            }
        }
    };

    request.post({ url: 'https://sinokor-rest.azurewebsites.net/ocr/api', formData: formData}, function (err,httpRes,body){
		var data = (JSON.parse(body));
		//console.log(data);
		res.send(data);
	});
	
});

// web server to rest server ml test router
router.get('/dmzTest2', function (req, res) {

    var formData = {
        data: [
            '1::1::test',
            '12::12::안녕',
            '123::123::test2'
        ]
    };

    request.post('https://sinokor-rest.azurewebsites.net/ml/api', { json: true, body: formData }, function (err, httpRes, body) {

        res.send(body);
    });

});

// web server to rest server ml train test router
router.get('/dmzTest3', function (req, res) {

    var formData = {
        data: [
            '1::1::test::TRUE',
			'12::12::안녕::TRUE',
			'123::123::test2::FALSE'
        ]
    };

    request.post('https://sinokor-rest.azurewebsites.net/ml/train', { json: true, body: formData }, function (err, httpRes, body) {

        res.send(body);
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
        //data[i].text = data[i].text.replace(": ", "");
        args += '"' + data[i].text.toLowerCase() + '"' + ' ';

    }

    //오타 수정
    var exeTypoString = 'python ' + appRoot + '\\ml\\typosentence\\typo.py ' + args;
    exec(exeTypoString, defaults, function (err3, stdout3, stderr3) {
        //console.log(stdout3);

        var typoData = stdout3.split(/\r\n/g);

        var typoDataLen = typoData.length;

        while (typoDataLen--) {
            if (typoData[typoDataLen] == "") {
                typoData.splice(typoDataLen, 1);
            }
        }

        for (var i = 0; i < typoData.length; i++) {
            var typoSplit = typoData[i].split("^");
            var typoText = typoSplit[0];
            var typoOriWord = typoSplit[1];
            var typoUpdWord = typoSplit[2];

            for (var j = 0; j < data.length; j++) {
                if (data[j].text.toLowerCase() == typoOriWord) {
                    var updWord = typoUpdWord.split(":");
                    data[j].text = data[j].text.toLowerCase().replace(typoOriWord, updWord);
                }
            }

        }
    });

    //도메인 사전 번역
    var exeDomainString = 'python ' + appRoot + '\\ml\\typosentence\\main.py ' + args;
    exec(exeDomainString, defaults, function (err2, stdout2, stderr2) {

        var ocrText = stdout2.split(/\r\n/g);
        var ocrTextLen = ocrText.length;

        while (ocrTextLen--) {
            if (ocrText[ocrTextLen] == "") {
                ocrText.splice(ocrTextLen, 1);
            }
        }

        for (var i = 0; i < data.length; i++) {
            if (data[i].text.toLowerCase() != ocrText[i].toLowerCase()) {
                data[i].text = ocrText[i];
            }
        }


        var classiText = '';
        for (var i = 0; i < ocrText.length; i++) {
            classiText += '"' + ocrText[i] + '"' + ' ';
        }

        //text-classification
        var exeTextString = 'python ' + appRoot + '\\ml\\cnn-text-classification\\eval.py ' + classiText;
        exec(exeTextString, defaults, function (err, stdout, stderr) {
            //console.log(stdout);
            var obj = stdout.split("^");

            var label = [];

            for (var key in obj) {
                var objSplit = obj[key].split("||");

                for (var i = 0; i < data.length; i++) {
                    if (data[i].text.toLowerCase() == objSplit[0].toLowerCase()) {
                        data[i].label = objSplit[1];
                    }
                }

                if (objSplit[1] == "fixlabel" || objSplit[1] == "entryrowlabel") {
                    label.push(objSplit[0]);
                }
            }

            var labelArgs = '';

            for (var i = 0; i < label.length; i++) {
                labelArgs += '"' + label[i] + '" ';
            }

            //label-mapping
            var exeLabelString = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\eval.py ' + labelArgs;
            exec(exeLabelString, defaults, function (err1, stdout1, stderr1) {
                console.log(stdout1);

                var labelMapping = stdout1.split("^");

                //var jsonLabel = JSON.parse(stdout1);
                var dataArray = [];

                for (var key in labelMapping) {

                    var objLabel = labelMapping[key].split("||");

                    for (var i = 0; i < data.length; i++) {
                        if (data[i].text.toLowerCase() == objLabel[0].toLowerCase()) {
                            data[i].column = objLabel[1];
                            var obj = {};
                            obj.text = objLabel[0];
                            obj.column = objLabel[1];
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

                        var obj = {};
                        obj.text = data[i].text;
                        obj.column = data[i].column;

                        console.log(obj);

                        dataArray.push(obj);

                    }
                }

                res.send({ 'fileName': fileName, 'data': data, 'dbColumns': dataArray });

            });

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
