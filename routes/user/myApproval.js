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
var oracle = require('../util/oracle.js');

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
    var orderQuery = ` ORDER BY DOCNUM DESC `;
    var param = {
        docNum: commonUtil.nvl(req.body.docNum),
        faoTeam: commonUtil.nvl(req.body.faoTeam),
        faoPart: commonUtil.nvl(req.body.faoPart),
        documentManager: commonUtil.nvl(req.body.documentManager),
        deadLineDt: commonUtil.nvl(req.body.deadLineDt),
        searchStartDate: commonUtil.nvl(req.body.searchStartDate),
        searchEndDate: commonUtil.nvl(req.body.searchEndDate),
        approvalState: commonUtil.nvl(req.body.approvalState),
        level: commonUtil.nvl(req.body.level),
        adminApproval: commonUtil.nvl(req.body.adminApproval),
        deadLine: commonUtil.nvl(req.body.deadLine)
    };
    if (param["docNum"] != '') {
        condQuery += ' AND DOCNUM LIKE \'%' + param["docNum"] + '%\'';
    }


    if (param["level"] == 'adminApproval') {
        //관리자가 조회할때
        if (!commonUtil.isNull(param["approvalState"])) {
            condQuery += ` AND STATUS IN ${param["approvalState"]}`
            condQuery += " AND MIDDLENUM IS NOT NULL"
        } 
    }
    else if (param["level"] == 'middleApproval' && param["adminApproval"] == 'N' ) {
        // 현업담당자C가 조회할때
            condQuery += ` AND MIDDLENUM = '${param["documentManager"]}'`;
            condQuery += ` AND STATUS IN ${param["approvalState"]}`;
        
    } else if (param["level"] == 'lastApproval' && param["adminApproval"] == 'N' ) {
        // 현업담당자D가 조회할때
        condQuery += ` AND FINALNUM = '${param["documentManager"]}'`;
        if (!commonUtil.isNull(param["approvalState"])) {
            condQuery += ` AND STATUS IN ${param["approvalState"]}`
        } 
    }

    if (param["deadLine"] != "") { // 마감년월
        condQuery += " AND DEADLINE = '" + param["deadLine"] + "'";
    }

    condQuery += " AND REGDATE BETWEEN TO_DATE ('" + param["searchStartDate"] + "') AND (TO_DATE('" + param["searchEndDate"] + "', 'YYYY-MM-DD') + 1) ";

    var approvalListQuery = "SELECT * FROM TBL_APPROVAL_MASTER WHERE 1=1 ";
    var listQuery = approvalListQuery + condQuery + orderQuery;
    //console.log("base listQuery : " + listQuery);
    commonDB.reqQuery(listQuery, callbackApprovalList, req, res);
};

// [POST] 문서 상세 리스트 조회 
router.post('/searchApprovalDtlList', function (req, res) {
    var returnObj = {};
    sync.fiber(function () {
        try {
            var result = sync.await(oracle.searchApprovalDtlList([req.body.docNum], sync.defer()));
            returnObj = { code: 200, docData: result };
        } catch (e) {
            returnObj = { code: 200, error: e };
        } finally {
            res.send(returnObj);
        }
     });
    // 기존소스
    //if (req.isAuthenticated()) fnSearchApprovalDtlList(req, res);
});

//var callbackApprovalDtlList = function (rows, req, res) {
//    if (req.isAuthenticated()) res.send(rows);
//};


/* 기존소스
 * var fnSearchApprovalDtlList = function (req, res) {
    var param = {
        seqNum: req.body.seqNum,
        docNum: req.body.docNum
    };
    var condQuery = ` AND DOCNUM = '${param.docNum}' `;
    var orderQuery = ` ORDER BY SEQNUM ASC `;

    var returnObj = {};
    var deleteCount = 0;
    try {
            sync.fiber(function () {
                sync.await(oracle.searchApprovalDtlList(req.body.docNum, sync.defer()));
            });
        returnObj = { code: 200, docData: deleteCount };
    } catch (e) {
        returnObj = { code: 200, error: e };
    } finally {
        res.send(returnObj);
    }

    var approvalListDtlQuery = queryConfig.myApprovalConfig.selectApprovalDtlList;
    var listQuery = approvalListDtlQuery + condQuery + orderQuery;
    console.log("dtl listQuery : " + listQuery);
    commonDB.reqQuery(listQuery, callbackApprovalList, req, res);
};*/

// [POST] 문서 이미지 리스트 조회 
router.post('/searchApprovalImageList', function (req, res) {
    var returnObj = {};
    var imgId = req.body.imgId;
    sync.fiber(function () {
        try {
            var result = sync.await(oracle.searchApprovalImageList([imgId], sync.defer()));
            returnObj = { code: 200, docData: result };
        } catch (e) {
            returnObj = { code: 200, error: e };
        } finally {
            res.send(returnObj);
        }
    });
});
/* 기존소스
var callbackApprovalImageList = function (rows, req, res) {
    if (req.isAuthenticated()) res.send(rows);
};
 * var fnSearchApprovalImageList = function (req, res) {
    var param = {
        imgId: req.body.imgId
    };
    var condQuery = ` AND A.IMGID = '${param.imgId}' `;
    var orderQuery = ` ORDER BY A.SEQNUM ASC `;

    var approvalListDtlQuery = queryConfig.myApprovalConfig.selectApprovalImageList;
    var listQuery = approvalListDtlQuery + condQuery + orderQuery;
    console.log("img listQuery : " + listQuery);
    commonDB.reqQuery(listQuery, callbackApprovalImageList, req, res);
};*/
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

//내 결제 - 반려
router.post('/cancelDocument', function (req, res) {
    var docNum = req.body.docNum;
    var level = req.body.level;
    var comment = req.body.comment;
    var middleNumArr = req.body.middleNum;
    var userId = req.body.userId;
    var approvalDtlData = [];
    var returnObj = {};
    var cancelCount = 0;

    sync.fiber(function () {
        try {
            for (var i = 0; i < docNum.length; i++) {
                if (level == 'middleApproval') {
                    var middleNum = 'MIDDLENUM = NULL, NOWNUM = ICRNUM';                 
                    sync.await(oracle.cancelDocument([middleNum, docNum[i]], sync.defer()));
                    cancelCount += 1;                   
                } else if (level == 'lastApproval') {
                    var finalNum = 'FINALNUM = NULL, NOWNUM = MIDDLENUM';                 
                    sync.await(oracle.cancelDocument([finalNum, docNum[i]], sync.defer()));
                    cancelCount += 1;               
                }
                approvalDtlData.push({
                    'docNum': docNum[i],
                    'status': '04',
                    'approvalNum': userId,
                    'approvalDate': null,
                    'approvalComment': (comment[i] != '') ? comment[i] : null,
                    'nextApprovalNum': middleNumArr[i]
                });
            }
            sync.await(oracle.approvalDtlProcess(approvalDtlData, req.user.token, sync.defer()));

            returnObj = { code: 200, docData: cancelCount };
        } catch (e) {
            console.log(e);
            returnObj = { code: 200, error: e };
        } finally {
            res.send(returnObj);
        }
    });
});

//결재리스트(기본) C -> D 전달
router.post('/sendApprovalDocumentCtoD', function (req, res) {
    var userChoiceId = req.body.userChoiceId;
    var docInfo = req.body.docInfo;
    var userId = req.body.userId;
    var comment = req.body.comment;
    var approvalDtlData = [];
    var returnObj = {};
    var sendCount = 0;

    sync.fiber(function () {
        try {
            for (var i = 0; i < docInfo.length; i++) {
                sync.await(oracle.sendApprovalDocumentCtoD([userChoiceId[0], userChoiceId[0], docInfo[i]], sync.defer()));
                approvalDtlData.push({
                    'docNum': docInfo[i],
                    'status': '02',
                    'approvalNum': userId,
                    'approvalDate': null,
                    'approvalComment': (comment[i] != '') ? comment[i] : null,
                    'nextApprovalNum': userChoiceId[0]
                });
                sendCount += 1;
            }
            sync.await(oracle.approvalDtlProcess(approvalDtlData, req.user.token, sync.defer()));
            returnObj = { code: 200, docData: sendCount };
        } catch (e) {
            returnObj = { code: 200, error: e };
        } finally {
            res.send(returnObj);
        }
    });

});

//결재리스트(기본) D 승인
router.post('/finalApproval', function (req, res) {
    var arrDocInfo = req.body.param.arrDocInfo;
    var approvalDtlData = [];
    var returnObj = {};
    var sendCount = 0;

    sync.fiber(function () {
        try {
            var dateArr = sync.await(oracle.finalApproval(req, sync.defer()));
            for (var i in arrDocInfo) {
                approvalDtlData.push({
                    'docNum': arrDocInfo[i].docNum,
                    'status': '03',
                    'approvalNum': arrDocInfo[i].finalApproval,
                    'approvalDate': dateArr[i],
                    'approvalComment': null,
                    'nextApprovalNum': ''
                });
            }
            sync.await(oracle.approvalDtlProcess(approvalDtlData, req.user.token, sync.defer()));

            returnObj = { code: 200 };
        } catch (e) {
            returnObj = { code: 500, error: e };
        } finally {
            res.send(returnObj);
        }
    });
});

module.exports = router;