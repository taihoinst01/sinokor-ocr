'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var mysql = require('mysql');
var dbConfig = require('../../config/dbConfig');
var pool = mysql.createPool(dbConfig);
var queryConfig = require('../../config/queryConfig.js');
var router = express.Router();

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// userManagement.html 보여주기
router.get('/', function (req, res) {
    pool.getConnection(function (err, connection) {
        var sql = queryConfig.userMngConfig.selUserList;

        connection.query(sql, function (err, rows) {
            if (err) console.error("err : " + err);

            res.render('admin/userManagement', { rows: rows ? rows : {} });
            connection.release();
        })
    });
});

// userManagement.html 보여주기
router.post('/', function (req, res) {
    res.render('admin/userManagement');
});

//사용자 추가
router.post('/insertUser', function (req, res) {
    var data = [req.body.userId, req.body.userPw, req.body.auth, req.body.email];

    pool.getConnection(function (err, connection) {
        var sql = queryConfig.userMngConfig.insertUser;

        connection.query(sql, data, function (err, rows) {
            if (err) console.error("err : " + err);

            res.redirect('/userManagement');
            connection.release();
        })
    });
});





module.exports = router;
