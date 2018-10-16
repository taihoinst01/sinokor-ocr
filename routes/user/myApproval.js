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
var batch = require('../util/myApproval.js');

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// myApproval.html 보여주기
router.get('/', function (req, res) {
    if (req.isAuthenticated()) res.render('user/myApproval', { currentUser: req.user });
    else res.redirect("/logout");
});

// myApproval.html 보여주기
router.post('/', function (req, res) {
    if (req.isAuthenticated()) res.render('user/myApproval', { currentUser: req.user });
    else res.redirect("/logout");
});

// [POST] 문서 리스트 조회 
router.post('/searchApprovalList', function (req, res) {
    if (req.isAuthenticated()) fnSearchApprovalList(req, res);
});
var callbackApprovalList = function (rows, req, res) {
    if (req.isAuthenticated()) res.send(rows);
};
var fnSearchApprovalList = function (req, res) {
    // 조회 조건 생성
    var condQuery = ``;
    var orderQuery = ` ORDER BY DEADLINEDT ASC `;
    var param = {
        docNum: commonUtil.nvl(req.body.docNum),
        faoTeam: commonUtil.nvl(req.body.faoTeam),
        faoPart: commonUtil.nvl(req.body.faoPart),
        documentManager: commonUtil.nvl(req.body.documentManager),
        deadLineDt: commonUtil.nvl(req.body.deadLineDt),
        searchStartDate: commonUtil.nvl(req.body.searchStartDate),
        searchEndDate: commonUtil.nvl(req.body.searchEndDate),
        approvalState: commonUtil.nvl(req.body.approvalState)
    };
    if (!commonUtil.isNull(param["docNum"])) condQuery += ` AND DOCNUM LIKE '%${param["docNum"]}%' `;
    if (!commonUtil.isNull(param["faoTeam"])) condQuery += ` AND FAOTEAM = '${param["faoTeam"]}' `;
    if (!commonUtil.isNull(param["faoPart"])) condQuery += ` AND FAOPART = '${param["faoPart"]}' `;
    if (!commonUtil.isNull(param["documentManager"])) condQuery += ` AND DOCUMENTMANAGER = '${param["documentManager"]}' `;
    if (!commonUtil.isNull(param["deadLineDt"])) condQuery += ` AND DEADLINEDT = '${param["deadLineDt"]}' `;
    //if (!commonUtil.isNull(param["searchStartDate"]) && !commonUtil.isNull(param["searchEndDate"]))
    //    condQuery += ` AND REGDT BETWEEN TO_DATE('${param["searchStartDate"]}', 'yyyymmdd') AND TO_DATE('${param["searchEndDate"]}', 'yyyymmdd') `;
    if (!commonUtil.isNull(param["approvalState"])) condQuery += ` AND APPROVALSTATE IN ${param["approvalState"]} `;

    var approvalListQuery = queryConfig.myApprovalConfig.selectApprovalList;
    var listQuery = approvalListQuery + condQuery + orderQuery;
    console.log("base listQuery : " + listQuery);
    commonDB.reqQuery(listQuery, callbackApprovalList, req, res);
};

// [POST] 문서 상세 리스트 조회 
router.post('/searchApprovalDtlList', function (req, res) {
    if (req.isAuthenticated()) fnSearchApprovalDtlList(req, res);
});
var callbackApprovalDtlList = function (rows, req, res) {
    if (req.isAuthenticated()) res.send(rows);
};
var fnSearchApprovalDtlList = function (req, res) {
    var param = {
        seqNum: req.body.seqNum,
        docNum: req.body.docNum
    };
    var condQuery = ` AND A.DOCNUM = '${param.docNum}' `;
    var orderQuery = ` ORDER BY B.SEQNUM ASC `;

    var approvalListDtlQuery = queryConfig.myApprovalConfig.selectApprovalDtlList;
    var listQuery = approvalListDtlQuery + condQuery + orderQuery;
    console.log("dtl listQuery : " + listQuery);
    commonDB.reqQuery(listQuery, callbackApprovalList, req, res);
};

// [POST] 문서 이미지 리스트 조회 
router.post('/searchApprovalImageList', function (req, res) {
    if (req.isAuthenticated()) fnSearchApprovalImageList(req, res);
});
var callbackApprovalImageList = function (rows, req, res) {
    if (req.isAuthenticated()) res.send(rows);
};
var fnSearchApprovalImageList = function (req, res) {
    var param = {
        imgId: req.body.imgId
    };
    var condQuery = ` AND A.IMGID = '${param.imgId}' `;
    var orderQuery = ` ORDER BY A.SEQNUM ASC `;

    var approvalListDtlQuery = queryConfig.myApprovalConfig.selectApprovalImageList;
    var listQuery = approvalListDtlQuery + condQuery + orderQuery;
    console.log("img listQuery : " + listQuery);
    commonDB.reqQuery(listQuery, callbackApprovalImageList, req, res);
};

// [POST] 문서 승인/반려/전달
router.post('/updateState', function (req, res) {
    if (req.isAuthenticated()) fnUpdateState(req, res);
});
var callbackUpdateState = function (rows, req, res) {
    if (req.isAuthenticated()) res.send({ code: "200" });
};
var fnUpdateState = function (req, res) {
    var flag = req.body.flag;
    var arrSeqNum = req.body.arrSeqNum;
    var arrState = req.body.arrState;
    var arrMemo = req.body.arrMemo;
    var arrReporter = req.body.arrReporter;
    var arrManager = req.body.arrManager;

    console.log("arrManager : " + JSON.stringify(arrManager));

    var query = queryConfig.myApprovalConfig.updateDocument;

    for (var i = 0; i < arrSeqNum.length; i++) {
        query += ` APPROVALSTATE = '${flag}', `;
        query += ` MEMO = '${arrMemo[i]}', `;
        query += ` APPROVALREPORTER = '${arrReporter[i]}', `;
        query += ` DOCUMENTMANAGER = '${arrManager[i]}' `;
        query += ` WHERE SEQNUM = '${arrSeqNum[i]}' `;
        console.log("쿼리 : " + query);
        commonDB.reqQuery(query, callbackUpdateState, req, res);
    }
};

// [POST] 사용자 조회
router.post('/selectUsers', function (req, res) {
    if (req.isAuthenticated()) fnSelectUsers(req, res);
});
var callbackSelectUsers = function (rows, req, res) {
    if (req.isAuthenticated()) res.send(rows);
};
var fnSelectUsers = function (req, res) {
    var query = queryConfig.myApprovalConfig.selectUsers;
    commonDB.reqQuery(query, callbackSelectUsers, req, res);
};

module.exports = router;