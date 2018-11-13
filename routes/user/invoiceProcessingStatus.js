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
    if (req.session.user !== undefined) {
        var today = new Date();
        var yyyy = today.getFullYear();
        var mm = (today.getMonth() + 1 < 10) ? '0' + (today.getMonth() + 1) : today.getMonth() + 1;
        var dd = (today.getDate() < 10) ? '0' + today.getDate() : today.getDate();
        var hh = (today.getHours() < 10) ? '0' + today.getHours() : today.getHours();
        var minute = (today.getMinutes() < 10) ? '0' + today.getMinutes() : today.getMinutes();
        var ss = (today.getSeconds() < 10) ? '0' + today.getSeconds() : today.getSeconds();

        var current = yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + minute + ':' + ss;
        res.render('user/invoiceProcessingStatus', { currentUser: req.session.user, currentDate: current });
    }
    else res.redirect("/logout");
});

// invoiceProcessingStatus.html 보여주기
router.post('/', function (req, res) {
    if (req.session.user !== undefined) res.render('user/invoiceProcessingStatus', { currentUser: req.session.user });
    else res.redirect("/logout");
});

router.post('/selectChartData', function (req, res) {
    if (req.session.user !== undefined) {
        let returnObj;

        sync.fiber(function () {
            try {
                
                var chartData = sync.await(oracle.selectInvoiceProcessingStatus(sync.defer()));
                var docCountData = sync.await(oracle.selectDocumentCount(sync.defer()));
                var ogcCountData = sync.await(oracle.selectOgCompanyStatus(sync.defer()));

                returnObj = { code: 200, chartData: chartData, docCountData: docCountData, ogcCountData: ogcCountData };
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