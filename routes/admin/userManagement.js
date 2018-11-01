'use strict';
var express = require('express');
var fs = require('fs');
var debug = require('debug');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var router = express.Router();
var sync = require('../util/sync.js');
var oracle = require('../util/oracle.js');

// DB
var dbConfig = require(appRoot + '/config/dbConfig');
var queryConfig = require(appRoot + '/config/queryConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');

var selectQuery = queryConfig.userMngConfig.selUserList; // 사용자 조회 쿼리
var insertQuery = queryConfig.userMngConfig.insertUser; // 사용자 추가 쿼리
var updateQuery = queryConfig.userMngConfig.updateUser; // 사용자 수정 쿼리
var deleteQuery = queryConfig.userMngConfig.deleteUser; // 사용자 삭제 쿼리



/***************************************************************
 * Router
 * *************************************************************/
router.get('/favicon.ico', function (req, res) {    // favicon
    res.status(204).end();
});
router.get('/', function (req, res) {               // 사용자 관리 (GET)
    if (req.isAuthenticated()) res.render('admin/userManagement', { currentUser: req.user });
    else res.redirect("/logout");
});
/*
router.post('/searchUser', function (req, res) {    // 사용자 목록 조회
    if (req.isAuthenticated()) fnSearch(req, res);
});
*/

router.post('/chooseUser', function (req, res) {    // 사용자 조회
    if (req.isAuthenticated()) fnChoose(req, res);
});
router.post('/searchHighApproval', function (req, res) {    // 상위결재자 조회
    if (req.isAuthenticated()) fnSearchHighApproval(req, res);
});
router.post('/insertUser', function (req, res) {    //사용자 등록
    if (req.isAuthenticated()) fnInsert(req, res);
});
router.post('/updateUser', function (req, res) {    //사용자 수정
    if (req.isAuthenticated()) fnUpdate(req, res);
});

//router.post("/deleteUser", function (req, res) {     // 사용자 삭제
//    var data = [req.body.seqNum];
//    if (req.isAuthenticated()) commonDB.reqQueryParam(deleteQuery, data, callbackDelete, req, res);
//});
//router.post("/updatePw", function (req, res) {     // 사용자 비밀번호 수정
//    var data = [req.body.userPwUpdate, req.body.seqNumUpdate];
//    if (req.isAuthenticated()) commonDB.reqQueryParam(updateQuery, data, callbackUpdate, req, res);
//});

/***************************************************************
 * function
 * *************************************************************/
 // 사용자 목록 조회
var callbackSearch = function (rows, req, res) {
    res.send(rows);
};
var fnSearch = function (req, res) {
    var orderQuery = ` ORDER BY SEQNUM DESC `;
    var query = selectQuery + orderQuery;
    //console.log(`fnSearch query : ${query}`);
    commonDB.reqQuery(query, callbackSearch, req, res);
};
// 사용자 조회
var callbackChoose = function (rows, req, res) {
    res.send(rows);
};
var fnChoose = function (req, res) {
    var condQuery = ` WHERE A.SEQNUM = ${req.body.seqNum} `;
    var query = selectQuery + condQuery;
    console.log(`fnChoose query : ${query}`);
    commonDB.reqQuery(query, callbackChoose, req, res);
};
// 상위결재자 조회
var callbackSearchHighApproval = function (rows, req, res) {
    console.log(`searchHighApproval result : ${JSON.stringify(rows)}`);
    res.send(rows);
};
var fnSearchHighApproval = function (req, res) {
    var condQuery = ` WHERE A.SEQNUM NOT IN ('${req.body.seqNum}') `; // 자기 자신을 제외한 사용자 조회
    var query = selectQuery + condQuery;
    console.log(`fnSearchHighApproval query : ${query}`);
    commonDB.reqQuery(query, callbackSearchHighApproval, req, res);
};
// 사용자 추가
var callbackInsert = function (rows, req, res) {
    res.send({ CODE: 200, RESULT: "등록되었습니다." });
};
var fnInsert = function (req, res) {
    if (commonUtil.isNull(req.body.userId) || commonUtil.isNull(req.body.userPw)) {
        res.send({ CODE: 300, RESULT: "비정상적인 요청입니다." });
    } else {
        var data = [req.body.userId, req.body.userPw, req.body.email, req.body.note, req.body.scanApproval, req.body.middleApproval, req.body.lastApproval, req.body.highApprovalId];
        if (req.isAuthenticated()) commonDB.reqQueryParam(insertQuery, data, callbackInsert, req, res);
    }
};
// 사용자 수정
var callbackUpdate = function (rows, req, res) {
    res.send({ CODE: 200, RESULT: "수정되었습니다." });
};
var fnUpdate = function (req, res) {
    var status = "OK";
    var valueQuery = "";
    var condQuery = "";
    
    var seqNum = commonUtil.nvl(req.body.seqNum);
    var userId = commonUtil.nvl(req.body.userId);
    var userPw = commonUtil.nvl(req.body.userPw);
    var email = commonUtil.nvl(req.body.email);
    var note = commonUtil.nvl(req.body.note);
    var scanApproval = commonUtil.nvl(req.body.scanApproval);
    var middleApproval = commonUtil.nvl(req.body.middleApproval);
    var lastApproval = commonUtil.nvl(req.body.lastApproval);
    var highApprovalId = commonUtil.nvl(req.body.highApprovalId);

    if (!commonUtil.isNull(seqNum)) condQuery = ` WHERE SEQNUM = ${seqNum} `;
    else status = "ERR";
    if (!commonUtil.isNull(userId)) valueQuery += ` USERID = '${userId}', `;
    else status = "ERR";
    if (!commonUtil.isNull(userPw)) valueQuery += ` USERPW = '${userPw}', `;
    if (!commonUtil.isNull(email)) valueQuery += ` EMAIL = '${email}', `;
    if (!commonUtil.isNull(note)) valueQuery += ` NOTE = '${note}', `;
    if (!commonUtil.isNull(scanApproval)) valueQuery += ` SCANAPPROVAL = '${scanApproval}', `;
    else valueQuery += ` SCANAPPROVAL = 'N', `;
    if (!commonUtil.isNull(middleApproval)) valueQuery += ` MIDDLEAPPROVAL = '${middleApproval}', `;
    else valueQuery += ` MIDDLEAPPROVAL = 'N', `;
    if (!commonUtil.isNull(lastApproval)) valueQuery += ` LASTAPPROVAL = '${lastApproval}', `;
    else valueQuery += ` LASTAPPROVAL = 'N', `;
    valueQuery += ` HIGHAPPROVALID = '${highApprovalId}' `;
  
    if (status == "ERR") {
        res.send({ CODE: 300, RESULT: "비정상적인 요청입니다." });
    } else if(status == "OK") {
        var query = updateQuery + valueQuery + condQuery;
        commonDB.reqQuery(query, callbackUpdate, req, res);
    }
};
// // [조회조건] 사용자 리스트
//function condFuncList(req) {
//    if (!commonUtil.isNull(req.body.userId))
//        return selectQuery + " WHERE userId LIKE concat('%', '" + req.body.userId + "', '%') " + " ORDER BY seqNum DESC ";
//    else return selectQuery + " ORDER BY seqNum DESC ";
//}
//// [조회조건] 사용자
//function condFuncSelect(req) {
//    return selectQuery + " WHERE userId = '" + req.body.userId + "' ";
//}
//// [List] 사용자 조회 
//function fnSearch(req, res) {
//    var query = condFuncList(req);
//    // Count query
//    var countQuery = queryConfig.count.startQuery + query + queryConfig.count.endQuery;
//    commonDB.reqQuery(countQuery, callbackCount, req, res);
//}
//// [CALLBACK] 사용자 조회 카운트
//function callbackCount(rows, req, res) {
//    var query = condFuncList(req);
//    // Paging
//    if (!commonUtil.isNull(req.body.startNum) || !commonUtil.isNull(req.body.endNum))
//        query += commonDB.makePagingQuery(req);
//    // List query
//    commonDB.reqListQuery(query, callbackSearch, JSON.stringify(rows[0].cnt), req, res);
//};
//// [CALLBACK] 사용자 조회
//function callbackSearch(rows, req, res) {
//    res.send(rows);
//}
// [CALLBACK] 사용자 추가
function callbackInsert(rows, req, res) {
    res.redirect('/userManagement');
};
// [CALLBACK] 사용자 비밀번호 수정
function callbackUpdate(rows, req, res) {
    res.redirect('/userManagement');
}
// [CALLBACK] 사용자 삭제
function callbackDelete(rows, req, res) {
    res.redirect('/userManagement');
}


// 부서조회
router.post('/searchDept', function (req, res) {
    var returnObj;

    sync.fiber(function () {
        try {

            var result = sync.await(oracle.searchDept([], sync.defer()));


            returnObj = { code: 200, dept: result };
        } catch (e) {
            returnObj = { code: 200, error: e };
        } finally {
            res.send(returnObj);
        }
    });

});

// 사용자 찾기
router.post('/searchUser', function (req, res) {
    var returnObj;

    sync.fiber(function () {
        try {
            
            var result = sync.await(oracle.searchUser(req, sync.defer()));
                      
            returnObj = { code: 200, userData: result };
        } catch (e) {
            returnObj = { code: 200, error: e };
        } finally {
            res.send(returnObj);
        }
    });

});

// 사용자 삭제
router.post('/deleteUser', function (req, res) {
    var returnObj;

    sync.fiber(function () {
        try {

            sync.await(oracle.deleteUser(req, sync.defer()));

            returnObj = { code: 200 };
        } catch (e) {
            returnObj = { code: 200, error: e };
        } finally {
            res.send(returnObj);
        }
    });

});

module.exports = router;