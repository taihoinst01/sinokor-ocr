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

// userDashbaord.html 보여주기
router.get('/', function (req, res) {
    res.render('user/userDashboard');
});

// userDashbaord.html 보여주기
router.post('/', function (req, res) {
    res.render('user/userDashboard');
});





module.exports = router;
