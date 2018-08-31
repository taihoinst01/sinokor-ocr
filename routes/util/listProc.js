'use strict';
const express = require('express');
const fs = require('fs');
const multer = require("multer");
const exceljs = require('exceljs');
const appRoot = require('app-root-path').path;
const router = express.Router();
const queryConfig = require(appRoot + '/config/queryConfig.js');
const commonDB = require(appRoot + '/public/js/common.db.js');
const commonUtil = require(appRoot + '/public/js/common.util.js');

const WF_GetTreeList = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let result;
    rtnArr = [];
    pMap = {};
    pMap.ENTRY_CODE = param.lsEntryCode;
    if (param.lsMode === "ASE") pMap.YEAR = param.lsYear;

    pMap.SEND_ID = param.v_send_id;
    pMap.RECV_ID = param.v_send_id;
    pMap.SYS_DATE = param.v_StartDate;
    pMap.SYS_TIME = param.lsEntryCode;
    pMap.AppMode = param.lsEntryCode;
    pMap.ORDERBY = param.lsEntryCode;
    pMap.CTNO = param.lsEntryCode;
    pMap.INFO09 = param.lsEntryCode;
    pMap.INFO02 = param.lsEntryCode;
    pMap.INFO08 = param.lsEntryCode;
    pMap.C_DEPT = param.lsEntryCode;
    pMap.MODE10 = param.lsEntryCode;
    pMap.MODE20 = param.lsEntryCode;
    pMap.MODE30 = param.lsEntryCode;
    pMap.MODE40 = param.lsEntryCode;
    pMap.LANG_GB = param.lsEntryCode;
    
    pMap.put("SEND_ID", v_send_id);
    pMap.put("RECV_ID", v_send_id);
    pMap.put("SYS_DATE", v_StartDate);
    pMap.put("SYS_TIME", v_EndDate);
    pMap.put("AppMode", lsMode);
    pMap.put("ORDERBY", lsOrderBy);
    pMap.put("CTNO", lsCtNo);
    pMap.put("INFO09", lsPostType);
    pMap.put("INFO02", lsCont);
    pMap.put("INFO08", lsDetail);
    pMap.put("C_DEPT", lsDeptCode);
    pMap.put("MODE10", lsChkMode10);
    pMap.put("MODE20", lsChkMode20);
    pMap.put("MODE30", lsChkMode30);
    pMap.put("MODE40", lsChkMode40);
    pMap.put("LANG_GB", lsLangGb);

    // TODO : UdpDSearch 클래스에 대한 명세 및 기능 필요
    // rtnArr = pUdpDSearch.selectTotalBox(pMap);
    for (let i = 0, x = rtnArr.length; i < x ; i++) {
        rtnMap = rtnArr[i];

        result += rtnMap["WORK_GUBUN"] + "|"
            + rtnMap["PRO_ID"] + "|"
            + rtnMap["INDEX01"] + "|"
            + rtnMap["INDEX09"] + "|"
            + rtnMap["SEND_ID"] + "|"
            + rtnMap["RECV_ID"] + "|"
            + rtnMap["SYS_DATE"] + "|"
            + rtnMap["STATUS"] + "|"
            + rtnMap["INDEX05"] + "|"
            + rtnMap["CODE"] + "|"
            + rtnMap["REMARK"] + "|"
            + rtnMap["SEQNO"] + "|"
            + rtnMap["PAGE_CNT"] + "|"
            + rtnMap["SEND_NAME"] + "|"
            + rtnMap["INDEX03"] + "|"
            + rtnMap["INFO04"] + "|"
            + rtnMap["INFO02"] + "|"
            + rtnMap["INFO03"] + "|"
            + rtnMap["INFO09"] + "|"
            + rtnMap["INDEX02"] + "|"
            + rtnMap["INDEX04"] + "|"
            + rtnMap["INFO10"] + "|"
            + rtnMap["INFO06"] + "|"
            + rtnMap["INFO07"] + "|"
            + rtnMap["SCAN_NAME"] + "^";
    }
    return result;
};

const WF_GetInitialList = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let result;
    rtnArr = [];
    pMap = {};

    pMap.DPT_ID = param.lsPostType;
    pMap.DUMMY3 = param.lsDummy3;
    pMap.DUMMY4 = param.lsDummy4;
    pMap.DUMMY5 = param.lsDummy5;

    //20180409 NSA 글로벌 사업팀의 경우 결재선 라인에 두바이 지점 중간결재자가 보이지 않음. 글로벌 사업팀을 선택하였을 시, 두바이 지점 사람도 결재리스트 상에 나오도록 
    if (param.lsPostType != "207000") pMap.DUMMY9 = param.lsDummy9;
    pMap.SITE_CD = param.lsSiteCd;
    pMap.STATUS = param.lsStatus; // 결재자 ID 구분값
    pMap.LANG_GB = param.lsLangGb;

    //20171017 NSA 조성은 사용자일 경우 상신자에 재물보험1팀 파트장를 추가로 보여줘야 하기 때문에 직책 파라미터 추가.. 이인준 대리님 요청사항 
    pMap.POS_ID = param.lsPosId;

    // TODO : UdpDSearch 클래스에 대한 명세 및 기능 필요
    //rtnArr = pUdpDSearch.selectWorkFlowInitialList(pMap);
    for (let i = 0, x = rtnArr.length; i < x; i++) {
        rtnMap = rtnArr[i];
        result += rtnMap["DUM_USR_ID"] + "|"
            + rtnMap["USR_FIRST_NAME"] + "|"
            + rtnMap["DPT_ID"] + "^";
    }
    return result;

};

const WF_GetTargetInfo = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let result;
    rtnArr = [];
    pMap = {};

    pMap.DUM_USR_ID = param.lsAfiUserId;
    // TODO : UdpDSearch 클래스에 대한 명세 및 기능 필요
    //rtnArr = pUdpDSearch.selectWorkFlowInitialList(pMap);
    if (rtnArr.length > 0) {
        rtnMap = rtnArr[0];
        result += rtnMap["DUMMY1"] + "|"
            + rtnMap["DUMMY2"] + "|"
            + retnMap["DUMMY10"] + "^";
    }
    return result;
};

const WF_SetTargetInfo = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let result;
    rtnArr = [];
    pMap = {};

    // pUdpDModify = new UdpDModify();
    pMap.DUM_USR_ID = param.lsAfiUserId;

    if (param.lsDummy10 === "2") pMap.DUMMY1 = param.lsDummy1;
    else if (param.lsDummy10 === "3") pMap.DUMMY2 = param.lsDummy2;
    pMap.DUMMY10 = param.lsDummy10;

    // TODO : pUdpDModify 클래스에 대한 명세 및 기능 필요
    // int liRtn = pUdpDModify.setWfTarget(pMap);
    let liRtn;
    return liRtn;
};

const WF_ApprovalCancel = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    // let rtnInt;
    rtnArr = [];
    pMap = {};

    pMap.PRO_ID = param.v_pro_id;
    pMap.RECV_ID = param.v_initial_id;
    pMap.SEQ1_SEND_ID = param.lsSendId;
    pMap.SEQNO = param.v_seq_no;
    pMap.C_DEPT = param.lsPostType;
    pMap.lginIpAdr = param.lsLocalIp;
    pMap.userId = param.lsAfiUserId;

    if (param.lsPostType === "302000" && param.lsEntryGubun != "") pMap.INDEX10 = param.lsEntryGubun;
    console.log("[SUMMONLOG] PRO_ID,RECV_ID,SEQNO, C_DEPT : " + param.v_pro_id + "," + param.v_initial_id + "," + param.v_seq_no + "," + param.lsPostType);
    console.log("lsEntryGubun  ==========> " + param.lsEntryGubun);

    // TODO : pUdpDModify 클래스에 대한 명세 및 기능 필요
    // int rtnInt = pUdpDModify.cancelWorkFlowLine(pMap);
    return rtnInt;
};

const WF_RemarkUpdate = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let rtnInt2 = -1;
    rtnArr = [];
    pMap = {};

    pMap.PRO_ID = param.lsProId;
    pMap.RECV_ID = param.lsRecvId;
    pMap.SEQNO = param.lsSeqNo;

    // TODO : pUdpDModify 클래스에 대한 명세 및 기능 필요
    // rtnInt2 = pUdpDModify.setRemarkStatus(pMap);
    if (rtnInt2 < 1) console.log("Unknown error. Contact administrator.");
    else console.log("success");
};

const WF_ImgDelete = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let resultInt = -1;
    rtnArr = [];
    pMap = {};

    pMap.PRO_ID = param.lsProId;
    // TODO : pUdpDModify 클래스에 대한 명세 및 기능 필요
    // int resultInt = pUdpDModify.delImgProfile(pMap);

    if (resultInt < 1) console.log("Unknown error. Contact administrator.");
    else console.log("success");
};

const WF_Registration = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let resultInt = "0";
    rtnArr = [];
    pMap = {};

    pMap.PRO_ID = param.v_pro_id;
    pMap.WORK_GUBUN = param.v_work_gubun;
    pMap.SEND_ID = param.lsInfo04;
    pMap.RECV_ID = param.v_recv_id;
    if (param.v_remark == "") pMap.CODE = "N";
    else pMap.CODE = "Y";
    pMap.INDEX07 = param.v_wf_line;
    pMap.REMARK = param.v_remark;
    pMap.LAST_MAN = param.v_last;
    pMap.C_DEPT = param.lsPostType;
    pMap.INDEX06 = param.lsIndex06;
    pMap.INFO01 = param.lsInfo01;
    pMap.INFO04 = param.lsInfo04;
    pMap.INFO08 = param.lsInfo08;

    pMap.BIZ_DV_CD = param.lsBizDvCd;
    pMap.IMG_CNT = param.lsImgCnt;

    pMap.lginIpAdr = param.lsLocalIp;
    pMap.userId = param.lsAfiUserId;

    //결재상황이 kr실업담당자 =>kr실업최고결재자인 경우 info01 = 999999 를 넣어야 통계에서 kr실업 건이 집계된다
    if (param.ssKRDptCode == "999999" && param.ssC_APP != "Y") pMap.INFO01 = "999999";

    if (param.v_recv_id == null || param.v_recv_id.trim() == "") {
        resultInt = "-998";
    } else {
        // TODO : pUdpDModify 클래스에 대한 명세 및 기능 필요
        // int liDupCnt = pUdpDModify.selectApprovalDupCnt(pMap);
        let liDupCnt = 0;
        if (liDupCnt > 0) {
            resultInt = "-999";
        } else {
            // TODO : pUdpDModify 클래스에 대한 명세 및 기능 필요
            // resultInt = pUdpDModify.insertApproval(pMap);
            resultInt = 0;
        }
    }
    return resultInt;
};

const WF_ReturnRegistration = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let result;
    rtnArr = [];
    pMap = {};

    if (param.ssKRDptCode == param.lsInfo09 && param.ssC_APP == "Y") {  // 외국부, 최고결재자
        // 반려중
        param.lsIndex06 = "30";
        param.lsInfo01 = param.lsInfo09;
    } else if (param.ssKRDptCode == "999999" && param.ssC_APP == "Y") {  // kr실업, 최고결재자
        param.lsAprStatCd = "01";
        param.lsIndex06 = "30";
        param.lsInfo01 = "999999";
    } else if (param.ssKRDptCode == param.lsInfo09 && param.ssC_APP != "Y") { // 외국부, 중간결재자
        if (param.lsIndex03 == param.lsInfo09) {    // 최초 등록한 처리과가 외국부일때
            param.lsAprStatCd = "01";
            param.lsIndex06 = "20";
            param.lsInfo01 = param.lsInfo09;
        } else if (param.lsIndex03 == "999999") {   // 최초 등록한 처리과가 KR 실업일때
            param.lsIndex06 = "30";
            param.lsInfo01 = "999999";
        }
    } else if (param.ssKRDptCode == "999999" && param.ssC_APP != "Y") { // kr 실업, 최초등록자
        // 반려중
        param.lsAprStatCd = "01";
        param.lsIndex06 = "20";
        param.lsInfo01 = "999999";
    }

    if (param.lsRemark == "") param.lsCode = "N";
    else param.lsCode = "Y";

    pMap.PRO_ID = param.lsProId;
    pMap.SEND_ID = param.lsSendId;
    pMap.WORK_GUBUN = "9";
    pMap.RECV_ID = param.lsRecvId;
    pMap.CODE = param.lsCode;
    pMap.REMARK = param.lsRemark;
    pMap.REASON = param.lsReason;
    pMap.INDEX06 = param.lsIndex06;
    pMap.INFO01 = param.lsInfo01;
    pMap.BIZ_DV_CD = param.lsBizDvCd;
    pMap.IMG_CNT = param.lsImgCnt;
    pMap.APR_STAT_CD = param.lsAprStatCd;
    pMap.lginIpAdr = param.lsLocalIp;
    pMap.userId = param.lsAfiUserId;

    // TODO : pUdpDModify 클래스에 대한 명세 및 기능 필요
    //String resultInt = pUdpDModify.insertReturn(pMap);
    let resultInt;

    return resultInt;
};
const WF_GetAllApprovalList = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let result;
    rtnArr = [];
    pMap = {};

    let id = "MSG0000876";
    let serviceid = "SVC0000456";

    let reqList = [];
    let laProId = param.lsProId.split("[|]");

    for (let i = 0, x = laProId.length; i < x; i++) {
        rtnMap = {};
        rtnMap.imgId = laProId[i];
        reqList.push(rtnMap);
    }
    pMap.put("ImgIdList", reqList);
    pMap.ImgIdList = reqList;
    pMap.value = "CbDocMngbAprTrgInqyReqs";
    pMap.lginIpAdr = param.lsLocalIp;
    pMap.userId = param.lsAfiUserId;

    // TODO : pUdpBAfiInterFaceDAO 클래스에 대한 명세 및 기능 필요
    // rtnMap = pUdpBAfiInterFaceDAO.getSendRequest(pMap, id, serviceid);

    rtnMap00 = rtnMap.CbDocMngbAprTrgInqyRsp;
    rtnArr = rtnMap00.saAprTrgList;

    for (let i = 0, x = rtnArr.length; i < x; i++) {
        rtnMap01 = rtnArr[i];
        result += rtnMap01.imgId + "|"
            + rtnMap01.gdCd + "|"
            + rtnMap01.prcsEmpNo + "|"
            + rtnMap01.ldcoCd + "|"
            + rtnMap01.plcyNo + "|"
            + rtnMap01.ttyYrmm + "|"
            + rtnMap01.lsdt + "|"
            + rtnMap01.colCd + "|"
            + rtnMap01.acdnPlcCd + "|"
            + rtnMap01.prssDvCd + "|"
            + rtnMap01.curCd + "|"
            + rtnMap01.orgCla + "|"
            + rtnMap01.iwdCla + "|"
            + rtnMap01.imgFileStNo + "|"
            + rtnMap01.imgFileEndNo + "|"
            + rtnMap01.ctrNm + "|"
            + rtnMap01.acDvCd + "|"
            + rtnMap01.insStDt + "|"
            + rtnMap01.insEndDt + "|"
            + rtnMap01.orgPre + "|"
            + rtnMap01.iwdPre + "|"
            + rtnMap01.com + "|"
            + rtnMap01.appYrmm + "|"
            + rtnMap01.saOcrnSno + "|"
            + rtnMap01.ctNm + "|"
            + rtnMap01.ctYy + "|"
            + rtnMap01.fy + "|"
            + rtnMap01.saOcrnCycCd + "|"
            + rtnMap01.preTta + "|"
            + rtnMap01.comTta + "|"
            + rtnMap01.preBal + "|"
            + rtnMap01.cla + "|"
            + rtnMap01.ntbl + "|"
            + rtnMap01.pfcom + "|"
            + rtnMap01.prrsCf + "|"
            + rtnMap01.prrsRls + "|"
            + rtnMap01.lsresCf + "|"
            + rtnMap01.lsresRls + "|"
            + rtnMap01.osl + "|"
            + rtnMap01.cas + "|"
            + rtnMap01.ctNo + "|"
            + rtnMap01.cdnNm + "|"
            + rtnMap01.epiCtsActPreRto + "|"
            + rtnMap01.epiClcRmk + "|"
            + rtnMap01.osl2 + "^";
    }
    return result;
};

const WF_AllRegistration = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let result;
    rtnArr = [];
    pMap = {};

    let laProId = param.v_pro_id.split("[|]");
    let laImgCnt = param.lsImgCnt.split("[|]");
    let laInfo01 = param.lsInfo01.split("[|]");

    for (let i = 0, x = laProId.length; i < x; i++) {
        if (laProId != "") {
            pMap = {};
            pMap.PRO_ID = laProId[i];
            pMap.WORK_GUBUN = param.v_work_gubun;
            pMap.SEND_ID = param.lsInfo04;
            pMap.RECV_ID = param.v_recv_id;
            pMap.CODE = "N";
            pMap.REMARK = "";
            pMap.LAST_MAN = param.v_last;
            pMap.C_DEPT = param.lsPostType;
            pMap.INDEX06 = param.lsIndex06;
            pMap.INFO01 = laInfo01[i];
            pMap.INFO04 = param.lsInfo04;
            pMap.INFO08 = param.lsInfo08;
            pMap.BIZ_DV_CD = param.lsBizDvCd;
            pMap.IMG_CNT = laImgCnt[i];
            pMap.lginIpAdr = param.lsLocalIp;
            pMap.userId = param.lsAfiUserId;

            let resultInt = "0";

            if (commonUtil.isNull(param.v_recv_id)) {
                resultInt = "-998";
                return laProId[i] + "|" + resultInt + "^";
            } else {
                //20140924 mack 결제정보 입력 중복체크
                // TODO : pUdpDModify 클래스에 대한 명세 및 기능 필요
                //int liDupCnt = pUdpDModify.selectApprovalDupCnt(pMap);
                int liDupCnt = 0;
                //결제정보가 중복인경우에는 아무것도 리턴하지 않고 넘어간다
                if (liDupCnt <= 0) {
                    // TODO : pUdpDModify 클래스에 대한 명세 및 기능 필요
                    resultInt = pUdpDModify.insertApproval(pMap);
                    return laProId[i] + "|" + resultInt + "^";
                }
            }

        }
    }
};

const WF_AllReturnRegistration = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let result;
    rtnArr = [];
    pMap = {};

    let laProId = param.lsProId.split("[|]");
    let laImgCnt = param.lsImgCnt.split("[|]");
    let laInfo01 = param.lsInfo01.split("[|]");
    let laInfo09 = param.lsInfo09.split("[|]");
    let laRecvId = param.lsRecvId.split("[|]");
    let laIndex03 = param.lsIndex03.split("[|]");

    for (let i = 0, x = laProId.length; i < x; i++) {
        if (!commonUtil.isNull(laProId[i])) {
            pMap = {};
            pMap.PRO_ID = laProId[i];
            pMap.RECV_ID = param.lsUserId;

            //결재 라인 조회
            // TODO : pUdpDSearch 클래스에 대한 명세 및 기능 필요
            // rtnArr = pUdpDSearch.selectWorkFlowReturnInfo(pMap);
            rtnArr = [];

            param.lsSendId = param.lsAfiUserId; //결재 라인이 없을경우 현재 사람이 최초 등록자가 됨!

            if (param.ssKRDptCode == param.lsInfo09 && param.ssC_APP == "Y") {  // 외국부, 최고결재자
                // 반려중
                param.lsIndex06 = "30";
                param.lsInfo01 = param.lsInfo09;
            } else if (param.ssKRDptCode == "999999" && param.ssC_APP == "Y") {  // kr실업, 최고결재자
                param.lsAprStatCd = "01";
                param.lsIndex06 = "30";
                param.lsInfo01 = "999999";
            } else if (param.ssKRDptCode == param.lsInfo09 && param.ssC_APP != "Y") { // 외국부, 중간결재자
                if (param.lsIndex03 == param.lsInfo09) {    // 최초 등록한 처리과가 외국부일때
                    param.lsAprStatCd = "01";
                    param.lsIndex06 = "20";
                    param.lsInfo01 = param.lsInfo09;
                } else if (param.lsIndex03 == "999999") {   // 최초 등록한 처리과가 KR 실업일때
                    param.lsIndex06 = "30";
                    param.lsInfo01 = "999999";
                }
            } else if (param.ssKRDptCode == "999999" && param.ssC_APP != "Y") { // kr 실업, 최초등록자
                // 반려중
                param.lsAprStatCd = "01";
                param.lsIndex06 = "20";
                param.lsInfo01 = "999999";
            }

            if (param.lsRemark == "") param.lsCode = "N";
            else param.lsCode = "Y";

            pMap.PRO_ID = param.lsProId;
            pMap.SEND_ID = param.lsSendId;
            pMap.WORK_GUBUN = "9";
            pMap.RECV_ID = param.lsRecvId;
            pMap.CODE = param.lsCode;
            pMap.REMARK = param.lsRemark;
            pMap.REASON = param.lsReason;
            pMap.INDEX06 = param.lsIndex06;
            pMap.INFO01 = param.lsInfo01;
            pMap.BIZ_DV_CD = param.lsBizDvCd;
            pMap.IMG_CNT = param.lsImgCnt;
            pMap.APR_STAT_CD = param.lsAprStatCd;
            pMap.lginIpAdr = param.lsLocalIp;
            pMap.userId = param.lsAfiUserId;

            // TODO : pUdpDModify 클래스에 대한 명세 및 기능 필요
            // String resultInt = pUdpDModify.insertReturn(pMap);
            let resultInt = 0;
            return resultInt;
        }
    }
};
const WF_ApprovalCheck = function (req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt) {
    let result;
    rtnArr = [];
    pMap = {};

    pMap.PRO_ID = param.lsProId;
    pMap.SEND_ID = param.lsAfiUserId;

    let resultInt = -1;
    // 문서목록 조회
    // TODO : pUdpDSearch 클래스에 대한 명세 및 기능 필요
    // resultInt = pUdpDSearch.approvalCheck(pMap);

    return resultInt;
};

// [POST] Legacy Interface 처리
router.post('/interface', function (req, res) {
    // if (req.isAuthenticated()) fnSearchApprovalDtlList(req, res);
    fnListProcInterface(req, res);

});
const callbackApprovalDtlList = function (rows, req, res) {
    //if (req.isAuthenticated()) res.send(rows);
};
const fnListProcInterface = function (req, res) {

    const lsGubun = commonUtil.nvl(req.body.gubun);   // 조회 업무구분

    let param = {
        lsLocalIp: req.headers['x-forwarded-for'] ||
                    req.connection.remoteAddress ||
                    req.socket.remoteAddress ||
                    req.connection.socket.remoteAddress,
        lsAfiUserId: commonUtil.nvl(req.body.ssUsrId), // from session
        lsLangGb: commonUtil.nvl(req.body.ssLangGb), // from session
        ssC_APP: commonUtil.nvl(req.body.ssC_APP), // from session
        ssC_MIDUSE: commonUtil.nvl(req.body.ssC_MIDUSE), // from session
        ssKrFlag: commonUtil.nvl(req.body.ssKrFlag), // from session
        ssKRDptCode: commonUtil.nvl(req.body.ssKRDptCode), // from session
        lsServerId: commonUtil.nvl(req.body.ssServerId), // from session
        lsTeamCode: commonUtil.nvl(req.body.ssTeamCode), // from session

        v_send_id: commonUtil.nvl(req.body.v_user_name), // from request.getParameter (이하 동일)
        v_recv_id: commonUtil.nvl(req.body.selHandlingUser),
        v_StartDate: commonUtil.nvl(req.body.StartDate),
        v_EndDate: commonUtil.nvl(req.body.EndDate),

        v_pro_id: commonUtil.nvl(req.body.gsProId),
        v_initial_id: commonUtil.nvl(req.body.gsInitialId),
        v_seq_no: commonUtil.nvl(req.body.gsSeqNo),

        v_work_gubun: commonUtil.nvl(req.body.hdnWorkGubun),
        v_code: commonUtil.nvl(req.body.v_code),
        v_last: commonUtil.nvl(req.body.v_last),
        v_wf_line: commonUtil.nvl(req.body.v_wf_line),
        v_remark: commonUtil.nvl(req.body.v_remark),
        v_emp_id: commonUtil.nvl(req.body.txtEmpId),
        v_dept_id: commonUtil.nvl(req.body.gsKRDeptID),

        //계산서 등록 페이지 결재 인지 확인(2일때 계산서 등록에서 들어온 결재임)
        gsMode: commonUtil.nvl(req.body.gsMode),
        lsToDay: commonUtil.nvl(req.body.gsToDay),
        lsInfo09: commonUtil.nvl(req.body.gsInfo09),
        lsEntryGubun: commonUtil.nvl(req.body.lsEntryGubun),

        lsMode: commonUtil.nvl(req.body.lsMode),    //일괄결재(AS) 조회인지, 결재 조회(TS)인지, 일괄 결재완료(ASE) 조회 인지 구분
        lsYear: commonUtil.nvl(req.body.lsYear),
        lsOrderBy: commonUtil.nvl(req.body.orderby),
        lsCtNo: commonUtil.nvl(req.body.ctno),

        lsEntryCode: commonUtil.nvl(req.body.lsEntryCode),
        lsPostType: commonUtil.nvl(req.body.gsPostType),    //부서구분
        lsStatus: commonUtil.nvl(req.body.gsstatus),        //결재자 ID 구분
        lsCont: commonUtil.nvl(req.body.gsCont),            //거래사
        lsDetail: commonUtil.nvl(req.body.lsDetaileMode),   //해상부 결재 1. 보험료 2. 보험금
        lsDeptCode: commonUtil.nvl(req.body.lsDeptCode),
        lsProId: commonUtil.nvl(req.body.proid),
        lsSeqNo: commonUtil.nvl(req.body.seqno),
        lsRecvId: commonUtil.nvl(req.body.recvid),

        lsDummy1: commonUtil.nvl(req.body.dummy1),
        lsDummy2: commonUtil.nvl(req.body.dummy2),
        lsDummy3: commonUtil.nvl(req.body.dummy3),
        lsDummy4: commonUtil.nvl(req.body.dummy4),
        lsDummy5: commonUtil.nvl(req.body.dummy5),
        lsDummy9: commonUtil.nvl(req.body.dummy9),
        lsDummy10: commonUtil.nvl(req.body.dummy10),

        lsJobFlag: commonUtil.nvl(req.body.jobflag),

        lsIndex06: commonUtil.nvl(req.body.index06),
        lsInfo01: commonUtil.nvl(req.body.info01),
        lsInfo04: commonUtil.nvl(req.body.info04),
        lsInfo08: commonUtil.nvl(req.body.info08),

        lsBizDvCd: commonUtil.nvl(req.body.bizdvcd),
        lsImgCnt: commonUtil.nvl(req.body.imgcnt),

        lsChkMode10: commonUtil.nvl(req.body.chkmode10),
        lsChkMode20: commonUtil.nvl(req.body.chkmode20),
        lsChkMode30: commonUtil.nvl(req.body.chkmode30),
        lsChkMode40: commonUtil.nvl(req.body.chkmode40),

        lsSendId: commonUtil.nvl(req.body.sendid),
        lsWorkGubun: commonUtil.nvl(req.body.workgubun),
        lsCode: commonUtil.nvl(req.body.code),
        lsRemark: commonUtil.nvl(req.body.remark),
        lsReason: commonUtil.nvl(req.body.reason),
        lsIndex03: commonUtil.nvl(req.body.index03),
        lsUserId: commonUtil.nvl(req.body.userid),
        lsSiteCd: commonUtil.nvl(req.body.sitecd),
        lsAprStatCd: "04",

        //20171017 NSA 조성은 사용자일 경우 상신자에 재물보험1팀 파트장를 추가로 보여줘야 하기 때문에 직책 파라미터 추가.. 이인준 대리님 요청사항 
        lsPosId: commonUtil.nvl(req.body.gsPosId)
    };

    // 분석 필요한 java class
    // UdpDSearch pUdpDSearch = new UdpDSearch();
    // UdpDModify pUdpDModify = new UdpDModify();
    // UdpBAfiInterFaceDAO pUdpBAfiInterFaceDAO = new UdpBAfiInterFaceDAO();

    let pMap = {};
    let parmArr = [];
    let rtnArr = [];
    let rtnMap = {};
    let rtnMap00 = null;
    let rtnMap01 = null;
    let rtnInt = "-1";

    switch (lsGubun) {
        case "WF_GetTreeList":
            WF_GetTreeList(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_GetInitialList":
            WF_GetInitialList(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_GetTargetInfo":
            WF_GetTargetInfo(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_SetTargetInfo":
            WF_SetTargetInfo(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_ApprovalCancel":
            WF_ApprovalCancel(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_RemarkUpdate":
            WF_RemarkUpdate(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_ImgDelete":
            WF_ImgDelete(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_Registration":
            WF_Registration(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_ReturnRegistration":
            WF_ReturnRegistration(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_GetAllApprovalList":
            WF_GetAllApprovalList(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_AllRegistration":
            WF_AllRegistration(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_AllReturnRegistration":
            WF_AllReturnRegistration(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        case "WF_ApprovalCheck":
            WF_ApprovalCheck(req, res, param, pMap, parmArr, rtnArr, rtnMap, rtnMap00, rtnMap01, rtnInt);
            break;
        default:
            break;
    }

};