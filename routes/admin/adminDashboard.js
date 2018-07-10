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

// adminDashboard.html 보여주기
router.get('/', function (req, res) {
    console.log("adminDashboard : " + JSON.stringify(req.user));
    console.log("adminDashboard req user : " + req.user);
    res.render('admin/adminDashboard');
});

// userDashbaord.html 보여주기
router.post('/', function (req, res) {
    res.render('admin/adminDashboard');
});





module.exports = router;
