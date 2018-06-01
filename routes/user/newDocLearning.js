'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var router = express.Router();

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// newDocLearning.html 보여주기
router.get('/', function (req, res) {
    /*const gs = require('ghostscript4js')

    try {
        const version = gs.version()
        console.log(version)
        gs.executeSync('-sDEVICE=jpeg -sOutputFile=page-%03d.jpg -r100x100 -f uploads/file1.pdf -c quit')
    } catch (err) {
        throw err
    }*/

    res.render('user/newDocLearning');
});





module.exports = router;
