'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var proxyConfig = require('../../config/propertiesConfig.js').proxy;
var router = express.Router();

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// web server to rest server file upload test router
router.post('/ocr', function (req, res) {
    var fileName = req.body.fileName;

    var formData = {
        file: {
            value: fs.createReadStream('uploads/' + fileName),
            options: {
                filename: fileName,
                contentType: 'image/jpeg'
            }
        }
    };

    request.post({ url: proxyConfig.serverUrl + '/ocr/api', formData: formData }, function (err, httpRes, body) {
        var data = (JSON.parse(body));
        //console.log(data);
        res.send(data);
    });

});

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
