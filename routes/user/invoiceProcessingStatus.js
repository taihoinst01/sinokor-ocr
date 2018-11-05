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
var sync = require('../util/sync.js');
var oracle = require('../util/oracle.js');

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// invoiceProcessingStatus.html 보여주기
router.get('/', function (req, res) {
    console.log("check");
    if (req.isAuthenticated()) res.render('user/invoiceProcessingStatus', { currentUser: req.user });
    else res.redirect("/logout");
});

// invoiceProcessingStatus.html 보여주기
router.post('/', function (req, res) {
    if (req.isAuthenticated()) res.render('user/invoiceProcessingStatus', { currentUser: req.user });
    else res.redirect("/logout");
});

router.post('/selectChartData', function (req, res) {
    if (req.isAuthenticated()) {
        let returnObj;

        sync.fiber(function () {
            try {
                
                var chartData = sync.await(oracle.selectInvoiceProcessingStatus(sync.defer()));
                var docCountData = sync.await(oracle.selectDocumentCount(sync.defer()));

                returnObj = { code: 200, chartData: chartData, docCountData: docCountData };
            } catch (e) {
                console.log(e);
                returnObj = { code: 500, message: e };
            } finally {
                res.send(returnObj);
            }
        });
    } else {
        res.redirect("/logout");
    }
});

module.exports = router;