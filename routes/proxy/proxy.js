'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var request = require("request");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var propertiesConfig = require('../../config/propertiesConfig.js');
var router = express.Router();

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// web server to rest server file upload test router
router.post('/ocr', function (req, res) {
    var fileName = req.body.fileName;

    var formData = {
        file: {
            value: fs.createReadStream('./uploads/' + fileName),
            options: {
                filename: fileName,
                contentType: 'image/jpeg'
            }
        }
    };

    request.post({ url: propertiesConfig.proxy.serverUrl + '/ocr/api', formData: formData }, function (err, httpRes, body) {
        //if (err) res.send({ 'code': 500, 'error': err });
        res.send(ocrParsing(body));
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
        var ignoreChar = ['"'.charCodeAt(0), '\''.charCodeAt(0), '['.charCodeAt(0), ']'.charCodeAt(0),
        '{'.charCodeAt(0), '}'.charCodeAt(0)];

        for (var i = 0; i < data.length; i++) {
            var modifyText = data[i].text;
            for (var j = 0; j < data[i].text.length; j++) {
                var ascii = data[i].text.charCodeAt(j);
                if (ascii > 127 || ignoreChar.indexOf(ascii) != -1) {
                    rep = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
                    if (!rep.test(data[i].text[j])) { // not Korean
                        rep = new RegExp(((ascii < 128) ? '\\' : '') + data[i].text[j], "gi");
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

/*
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
*/

/*
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
*/

module.exports = router;
