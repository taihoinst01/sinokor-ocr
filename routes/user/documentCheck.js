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

// documentCheck.html 보여주기
router.get('/', function (req, res) {
    if (req.isAuthenticated()) res.render('user/documentCheck');
    else res.redirect("/logout");
});

// documentCheck.html 보여주기
router.post('/', function (req, res) {
    if (req.isAuthenticated()) res.render('user/documentCheck');
    else res.redirect("/logout");
});





module.exports = router;
