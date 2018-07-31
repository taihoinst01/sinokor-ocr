'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var router = express.Router();
var queryConfig = require(appRoot + '/config/queryConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// invoiceRegistration.html 보여주기
router.get('/', function (req, res) {
    console.log("check");
    if (req.isAuthenticated()) res.render('user/invoiceRegistration', { currentUser: req.user });
    else res.redirect("/logout");
});

// invoiceRegistration.html 보여주기
router.post('/', function (req, res) {
    if (req.isAuthenticated()) res.render('user/invoiceRegistration', { currentUser: req.user });
    else res.redirect("/logout");
});


module.exports = router;