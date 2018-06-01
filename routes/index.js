'use strict';
var express = require('express');
var appRoot = require('app-root-path').path;
var router = express.Router();


router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// index.html 보여주기
router.get('/', function (req, res) {
    res.render('index');
});

// 로그인
router.post('/login', function (req, res) {
    res.redirect('/userDashboard'); 
});


module.exports = router;
