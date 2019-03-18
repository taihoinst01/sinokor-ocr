'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var router = express.Router();
var queryConfig = require(appRoot + '/config/queryConfig.js');
var propertiesConfig = require('../../config/propertiesConfig.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
var sync = require('../util/sync.js');
var batch = require('../util/myApproval.js');
var oracle = require('../util/oracle.js');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var request = require('sync-request');

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// myApproval.html 보여주기
router.get('/', function (req, res) {
    if (req.session.user !== undefined) res.render('user/myApproval', { currentUser: req.session.user });
    else res.redirect("/logout");
});

// myApproval.html 보여주기
router.post('/', function (req, res) {
    if (req.session.user !== undefined) res.render('user/myApproval', { currentUser: req.session.user });
    else res.redirect("/logout");
});

// [POST] 문서 리스트 조회 
router.post('/searchApprovalList', function (req, res) {
    if (req.session.user !== undefined) fnSearchApprovalList(req, res);
});
var callbackApprovalList = function (rows, req, res) {
    if (req.session.user !== undefined) res.send(rows);
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
        //todo
        if (!commonUtil.isNull(param["approvalState"])) {
            condQuery += ` AND STATUS IN ${param["approvalState"]}`
            condQuery += ` AND (MIDDLENUM = '${param["documentManager"]}' OR FINALNUM = '${param["documentManager"]}') `;
           // condQuery += ` AND MIDDLENUM = '${param["documentManager"]}'`;
           // condQuery += " AND FINALNUM IS NOT NULL"
        } 
    }
    else if (param["level"] == 'middleApproval' && param["adminApproval"] == 'N' ) {
        // 현업담당자C가 조회할때
        condQuery += ` AND MIDDLENUM = '${param["documentManager"]}'`;
        if (!commonUtil.isNull(param["approvalState"])) {
            condQuery += ` AND STATUS IN ${param["approvalState"]}`
        } 
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

// [POST] 문서 상세 리스트 조회 IF4
router.post('/searchApprovalDtlList', function (req, res) {
    var returnObj = {};
    var token = '';
    if (propertiesConfig.token == '') {
        token = req.session.user.token;
    } else {
        token = propertiesConfig.token;
    }   
    sync.fiber(function () {
        try {
           // var result = sync.await(oracle.searchApprovalDtlList([req.body.docNum], sync.defer()));
            var data =
                '<?xml version="1.0" encoding="utf-8"?>' +
                '<Root>' +
                '<Parameters>' +
                '<Parameter id="gv_encryptToken" type="STRING">' + token + '</Parameter>' +
                '<Parameter id="WMONID" type="STRING">NXrGufbtBrq</Parameter>' +
                '<Parameter id="lginIpAdr" type="STRING">172.16.12.54</Parameter>' +
                '<Parameter id="userId" type="STRING">9999068</Parameter>' +
                '<Parameter id="userEmpNo" type="STRING">9999068</Parameter>' +
                '<Parameter id="userDeptCd" type="STRING">240065</Parameter>' +
                '<Parameter id="frstRqseDttm" type="STRING">20181030194635225</Parameter>' +
                '<Parameter id="rqseDttm" type="STRING">20181030194635225</Parameter>' +
                '<Parameter id="lngeClsfCd" type="STRING">ko-kr</Parameter>' +
                '<Parameter id="srnId" type="STRING">CTCTM107</Parameter>' +
                '<Parameter id="rqseSrvcNm" type="STRING">koreanre.co.ct.commonct.svc.CtCommonCheckSvc</Parameter>' +
                '<Parameter id="rqseMthdNm" type="STRING">readTmpAcList</Parameter>' +
                '<Parameter id="rqseVoNm" type="STRING">koreanre.co.ct.commonct.vo.CtCommonCheckVO</Parameter>' +
                '</Parameters>' +
                '<Dataset id="searchDvo">' +
                '<ColumnInfo>' +
                '<Column id="cdnNm" type="STRING" size="150"/>' +
                '<Column id="ctNm" type="STRING" size="150"/>' +
                '<Column id="ttyYy" type="STRING" size="4"/>' +
                '<Column id="brkNm" type="STRING" size="70"/>' +
                '<Column id="imgId" type="STRING" size="18"/>' +
                '</ColumnInfo>' +
                '<Rows>' +
                '<Row>' +
                '<Col id="imgId">' + req.body.docNum + '</Col>' +
                '</Row>' +
                '</Rows>' +
                '</Dataset>' +
                '<Dataset id="tmpAcList.outlist.meta">' +
                '<ColumnInfo>' +
                '<Column id="ctNo" type="STRING" size="14"/>' +
                '<Column id="deptCd" type="STRING" size="6"/>' +
                '<Column id="aprStatCd" type="STRING" size="2"/>' +
                '<Column id="ctNm" type="STRING" size="150"/>' +
                '<Column id="ttyYy" type="STRING" size="4"/>' +
                '<Column id="ord" type="INT" size="9"/>' +
                '<Column id="acDvNm" type="STRING" size="70"/>' +
                '<Column id="ctYy" type="STRING" size="4"/>' +
                '<Column id="imgId" type="STRING" size="18"/>' +
                '<Column id="clamSno" type="INT" size="9"/>' +
                '<Column id="saOcrnSno" type="INT" size="9"/>' +
                '<Column id="imgFileStNo" type="STRING" size="3"/>' +
                '<Column id="imgFileEndNo" type="STRING" size="3"/>' +
                '<Column id="curCd" type="STRING" size="3"/>' +
                '<Column id="ntbl" type="BIGDECIMAL" size="21"/>' +
                '<Column id="osl" type="BIGDECIMAL" size="21"/>' +
                '<Column id="ibnr" type="BIGDECIMAL" size="21"/>' +
                '</ColumnInfo>' +
                '<Rows>' +
                '</Rows>' +
                '</Dataset>' +
                '</Root>';

            var res1 = request('POST', 'http://solomon.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', {
                headers: {
                    'content-type': 'text/xml'
                },
                body: data
            });
            var data = res1.getBody('utf8');

            if (data == null) {
                console.log("실패...");
            } else {

                parser.parseString(data, function (err, result) {
                    //console.log(result);
                    
                    var dataSet = '';
                    var rowData = [];
                    for (var i in result.Root.Dataset) {
                        if (result.Root.Dataset[i].$.id == "tmpAcList") {
                            dataSet = result.Root.Dataset[i];
                            break;
                        }
                    }

                    if (dataSet.Rows[0].Row) {
                        var row = dataSet.Rows[0].Row;

                        for (var i in row) {
                            var obj = {};
                            for (var j in row[i].Col) {
                                if (row[i].Col[j].$.id == "ctNo") {
                                    obj.ctNo = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "deptCd") {
                                    obj.deptCd = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "aprStatCd") {
                                    obj.aprStatCd = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ctNm") {
                                    obj.ctNm = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ttyYy") {
                                    obj.ttyYy = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ord") {
                                    obj.ord = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "acDvNm") {
                                    obj.acDvNm = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ctYy") {
                                    obj.ctYy = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "imgId") {
                                    obj.imgId = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "clamSno") {
                                    obj.clamSno = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "saOcrnSno") {
                                    obj.saOcrnSno = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "imgFileStNo") {
                                    obj.imgFileStNo = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "imgFileEndNo") {
                                    obj.imgFileEndNo = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "curCd") {
                                    obj.curCd = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ntbl") {
                                    obj.ntbl = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "osl") {
                                    obj.osl = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ibnr") {
                                    obj.ibnr = row[i].Col[j]._;
                                }
                            }
                            rowData.push(obj);
                        }
                    }
                    returnObj = { data: rowData };
                });
            }

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
    if (req.session.user !== undefined) fnSelectUsers(req, res);
});
var callbackSelectUsers = function (rows, req, res) {
    if (req.session.user !== undefined) res.send(rows);
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
    var memo = req.body.memo;
    var approvalDtlData = [];
    var returnObj = {};
    var cancelCount = 0;
    var token = req.session.user.token;

    sync.fiber(function () {
        try {
            for (var i = 0; i < docNum.length; i++) {
                if (level == 'middleApproval') {
                    var middleNum = 'MIDDLENUM = NULL, NOWNUM = ICRNUM';                 
                    sync.await(oracle.cancelDocument([middleNum, memo[i], docNum[i]], sync.defer()));
                    cancelCount += 1;                   
                } else if (level == 'lastApproval') {
                    var finalNum = 'FINALNUM = NULL, NOWNUM = MIDDLENUM';                 
                    sync.await(oracle.cancelDocument([finalNum, memo[i], docNum[i]], sync.defer()));
                    //sync.await(if5(docNum[i], token, '-1', sync.defer()));
                    cancelCount += 1;       
                }
                /*
                approvalDtlData.push({
                    'docNum': docNum[i],
                    'status': '04',
                    'approvalNum': userId,
                    'approvalDate': null,
                    'approvalComment': (comment[i] != '') ? comment[i] : null,
                    'nextApprovalNum': middleNumArr[i]
                });
                */
            }
            //sync.await(oracle.approvalDtlProcess(approvalDtlData, '', sync.defer()));

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
    var memo = req.body.memo;
    var approvalDtlData = [];
    var returnObj = {};
    var sendCount = 0;

    sync.fiber(function () {
        try {
            for (var i = 0; i < docInfo.length; i++) {
                sync.await(oracle.sendApprovalDocumentCtoD([userChoiceId[0], userChoiceId[0], memo[0], docInfo[i]], sync.defer()));
                /*
                approvalDtlData.push({
                    'docNum': docInfo[i],
                    'status': '02',
                    'approvalNum': userId,
                    'approvalDate': null,
                    'approvalComment': (comment[i] != '') ? comment[i] : null,
                    'nextApprovalNum': userChoiceId[0]
                });
                */
                sendCount += 1;
            }
            //sync.await(oracle.approvalDtlProcess(approvalDtlData, '', sync.defer()));
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
    var token = '';
    if (propertiesConfig.isOperation == 'Y') {
        token = req.session.user.token;
    }

    sync.fiber(function () {
        try {
            var dateArr = sync.await(oracle.finalApproval(req, sync.defer()));
            if (propertiesConfig.isOperation == 'Y') {
                for (var i = 0; i < arrDocInfo.length; i++) {
                    sync.await(if5(arrDocInfo[i].docNum, token, '03', sync.defer()));
                }
            }
            /*
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
            sync.await(oracle.approvalDtlProcess(approvalDtlData, '', sync.defer()));
            */

            returnObj = { code: 200 };
        } catch (e) {
            returnObj = { code: 500, error: e };
        } finally {
            res.send(returnObj);
        }
    });
});

function if5(docNum, token, aprStatCd, done) {
    sync.fiber(function () {
        try {
            var data = '' +
                '<?xml version = "1.0" encoding = "utf-8"?>' +
                '<Root>' +
                '<Parameters>' +
                '<Parameter id="gv_encryptToken" type="STRING">' + token + '</Parameter>' +
                '<Parameter id="WMONID" type="STRING">NXrGufbtBrq</Parameter>' +
                '<Parameter id="lginIpAdr" type="STRING">172.16.12.54</Parameter>' +
                '<Parameter id="userId" type="STRING">9999068</Parameter>' +
                '<Parameter id="userEmpNo" type="STRING">9999068</Parameter>' +
                '<Parameter id="userDeptCd" type="STRING">240065</Parameter>' +
                '<Parameter id="frstRqseDttm" type="STRING">20181230142413289</Parameter>' +
                '<Parameter id="rqseDttm" type="STRING">20181230142413289</Parameter>' +
                '<Parameter id="lngeClsfCd" type="STRING">ko-kr</Parameter>' +
                '<Parameter id="srnId" type="STRING">CTCTM107</Parameter>' +
                '<Parameter id="rqseSrvcNm" type="STRING">koreanre.co.ct.commonct.svc.CtCommonCheckSvc</Parameter>' +
                '<Parameter id="rqseMthdNm" type="STRING">transferTmpAcList</Parameter>' +
                '<Parameter id="rqseVoNm" type="STRING">koreanre.co.ct.commonct.vo.CtCommonCheckVO</Parameter>' +
                '<Parameter id="imgId" type="STRING">' + docNum + '</Parameter>' +
                '<Parameter id="aprStatCd" type="STRING">' + aprStatCd + '</Parameter>' +
                '</Parameters>' +
                '</Root>';

            var res1 = request('POST', 'http://solomon.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', {
                headers: {
                    'content-type': 'text/xml'
                },
                body: data
            });
            var ifData = res1.getBody('utf8');

            if (ifData == null) {
                console.log("IF5 실패...");
                return done(null, 'data empty.');
            } else {
                parser.parseString(ifData, function (err, result) {
                    //console.log(result.Root.Parameters[0].Parameter);
                    return done(null, null);
                });
            }
        } catch (e) {
            return done(null, err);
        } finally {
        }
            
    });
}

module.exports = router;