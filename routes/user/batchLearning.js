'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
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
var router = express.Router();

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// batchLearning.html 보여주기
router.get('/', function (req, res) {
    res.render('user/batchLearning');
});

// batchLearning.html 보여주기
router.post('/', function (req, res) {
    res.render('user/batchLearning');
});

// fileupload
router.post('/multiUpload', upload.any(), function (req, res) {
    var file = req.files;
 
    console.log(file);
    res.send();
});

// tif to jpg 변환
router.post('/tif', function (req, res) {
    var ifile = appRoot + '\\uploads\\test.tif';
    var ofile = appRoot + '\\pdf2img\\test.jpg'

    exec('module\\imageMagick\\convert.exe -density 600x600 ' + ifile + ' ' + ofile, function (err, out, code) {
        console.log(out)
    });

    res.send({});
});

module.exports = router;
