﻿var oracledb = require('oracledb');
oracledb.outFormat = oracledb.OBJECT;

var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
var queryConfig = require(appRoot + '/config/queryConfig');
var execSync = require('child_process').execSync;
var fs = require('fs');
var propertiesConfig = require(appRoot + '/config/propertiesConfig.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
var request = require('sync-request');
var sync = require('./sync.js');
var oracle = require('./oracle.js');

exports.modifyUser = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        var modifySql;
        var modifyParams;
        var regSql;   
        var regParams;

        try {
            conn = await oracledb.getConnection(dbConfig);

            // 사용자 정보 등록 및 수정
            if (req.type == 'insert') {
                var selectSql = 'SELECT EMP_NO FROM TBL_CO_EMP_BS_EXT WHERE EMP_NO = :empNo';
                result = await conn.execute(selectSql, [req.empNo]);
                if (result.rows.length != 0) {
                    return done(null, '사번이 존재합니다.');
                }

                modifySql = "INSERT INTO TBL_CO_EMP_BS_EXT(EMP_NO, EMP_PW, EMP_NM) VALUES (:empNo, :empPw, :empNm)";
                modifyParams = [req.empNo, req.empPw, req.empNm];
                regSql = 'INSERT INTO TBL_CO_EMP_REG(EMP_NO, AUTH_SCAN, AUTH_ICR, AUTH_APPROVAL, AUTH_FINAL_APPROVAL, AUTH_ADMIN) '
                    + 'VALUES (:empNo, :authScan, :authIcr, :authMid, :authFinal, :authAdmin)';
                regParams = [req.empNo, req.authScan, req.authIcr, req.authMid, req.authFinal, req.authAdmin];
            } else {
                modifySql = "UPDATE TBL_CO_EMP_BS_EXT SET EMP_NO = :empNo, EMP_PW = :empPw, EMP_NM = :empNm WHERE EMP_NO = :beforeEmpNo";
                modifyParams = [req.empNo, req.empPw, req.empNm, req.beforeEmpNo];
                regSql = 'UPDATE TBL_CO_EMP_REG SET EMP_NO = :empNo, AUTH_SCAN = :authScan, AUTH_ICR = :authIcr, AUTH_APPROVAL = :authMid, '
                    + 'AUTH_FINAL_APPROVAL = :authFinal, AUTH_ADMIN = :authAdmin WHERE EMP_NO = :beforeEmpNo';
                regParams = [req.empNo, req.authScan, req.authIcr, req.authMid, req.authFinal, req.authAdmin, req.beforeEmpNo];
            }
            await conn.execute(modifySql, modifyParams);
            await conn.execute(regSql, regParams);

            // 다음 결재자 등록 및 수정
            if (req.nextApproval) {
                var selectSql;
                if (propertiesConfig.isOperation == 'Y') {
                    selectSql = 'SELECT EMP_NO, EMP_NM FROM TBL_CO_EMP_BS WHERE EMP_NO = :nextEmpNo';
                } else {
                    selectSql = 'SELECT EMP_NO, EMP_NM FROM TBL_CO_EMP_BS_EXT WHERE EMP_NO = :nextEmpNo';
                }
                var selectNextAppSql = 'SELECT EMP_NO FROM TBL_CO_EMP_NEXTAPPROVAL WHERE EMP_NO = :empNo';
                var nextAppSql;
                var nextAppParams;

                result = await conn.execute(selectNextAppSql, [req.empNo]);
                userResult = await conn.execute(selectSql, [req.nextApproval]);
                if (result.rows.length == 0) { // 다음 결재자가 없으면 (insert)
                    nextAppSql = 'INSERT INTO TBL_CO_EMP_NEXTAPPROVAL(EMP_NO, NEXT_EMP_NO, NEXT_EMP_NM) VALUES (:empNo, :nextEmpNo, :nextEmpNm)';
                    nextAppParams = [req.empNo, userResult.rows[0].EMP_NO, userResult.rows[0].EMP_NM];
                } else { // 다음 결재자가 있으면 (update)
                    nextAppSql = 'UPDATE TBL_CO_EMP_NEXTAPPROVAL SET NEXT_EMP_NO = :nextEmpNo, NEXT_EMP_NM = :nextEmpNm WHERE EMP_NO = :empNo';
                    nextAppParams = [userResult.rows[0].EMP_NO, userResult.rows[0].EMP_NM, req.empNo];
                }
                await conn.execute(nextAppSql, nextAppParams);
            }

            return done(null, 'success');
        } catch (err) {
            reject(err);
            //return done(null, err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectUserInfo = function (req, done) {

    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            let dept = req.dept;
            let scan = req.scan;
            let icr = req.icr;
            let approval = req.approval;
            let finalApproval = req.finalApproval;
            let externalUsers = req.externalUsers; 
            let keyword = req.keyword;

            conn = await oracledb.getConnection(dbConfig);

            var userQuery = ""
                + " SELECT CO_EMP.EMP_NO, CO_EMP.EMP_NM, DEPT_NM " 
                + " FROM " 
                + " (SELECT EMP_NO, EMP_NM, EMP_ENGL_NM, DEPT_NM, 1 AS ORDERNUM FROM TBL_CO_EMP_BS CO_EMP_BS " 
                    + " LEFT JOIN TBL_CO_DEPT_BS CO_DEPT " 
                    + " ON CO_EMP_BS.BLT_DEPT_CD = CO_DEPT.DEPT_CD " 
                    + " UNION ALL " 
                + " SELECT EMP_NO, EMP_NM, EMP_ENGL_NM, DEPT_NM, 2 AS ORDERNUM FROM TBL_CO_EMP_BS_EXT CO_EMP_EXT " 
                    + " LEFT JOIN TBL_CO_DEPT_BS_EXT CO_DEPT_EXT " 
                    + " ON CO_EMP_EXT.BLT_DEPT_CD = CO_DEPT_EXT.DEPT_CD " 
                    + " ) CO_EMP " 
                + " LEFT JOIN TBL_CO_EMP_REG CO_REG " 
                + " ON CO_EMP.EMP_NO = CO_REG.EMP_NO  "
                + " WHERE 1=1 ";
            
            if (dept != '모든부서') {
                userQuery += " AND CO_EMP.DEPT_NM = '" + dept + "' ";
            }
            var auths = [scan, icr, approval, finalApproval]; 
            var authColumns = ['CO_REG.AUTH_SCAN', 'CO_REG.AUTH_ICR', 'CO_REG.AUTH_APPROVAL', 'CO_REG.AUTH_FINAL_APPROVAL'];

            if (keyword) {
                userQuery += " AND CO_EMP.EMP_NM LIKE '%" + keyword + "%' ";
            }

            if (scan == 'Y' || icr == 'Y' || approval == 'Y' || finalApproval == 'Y') {
                userQuery += "AND ( ";

                for (var i in auths) {
                    if (auths[i] == 'Y') {
                        userQuery += authColumns[i] + " = 'Y' OR ";
                    }
                }               
                userQuery = userQuery.substring(0, userQuery.length - 3);
                userQuery += ") ";
            }
            userQuery += "ORDER BY ORDERNUM, CO_EMP.DEPT_NM, CO_EMP.EMP_NM";


            result = await conn.execute(userQuery);
            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }

        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }

        /* 변경 이전 소스 (comm_user)
        let conn;
        let result
        var userSql;
        var returnObj = [];

        try {
            conn = await oracledb.getConnection(dbConfig);
            userSql = "SELECT * FROM TBL_OCR_COMM_USER WHERE 1=1 ";
            if (req.keyword != '') {
                userSql += "AND USERID LIKE '%" + req.keyword + "%' ";
            }
            if (req.docManagerChk || req.icrManagerChk || req.middleManagerChk || req.approvalManagerChk) {
                userSql += "AND ( ";
                if (req.docManagerChk) {
                    userSql += "SCANAPPROVAL = 'Y' OR ";
                }
                if (req.icrManagerChk) {
                    userSql += "ICRAPPROVAL = 'Y' OR ";
                }
                if (req.middleManagerChk) {
                    userSql += "MIDDLEAPPROVAL = 'Y' OR ";
                }
                if (req.approvalManagerChk) {
                    userSql += "LASTAPPROVAL = 'Y' OR ";
                }
                userSql = userSql.substring(0, userSql.length - 3);
                userSql += ") ORDER BY USERID ASC";
            }            
 
            result = await conn.execute(userSql);
            if (result.rows.length > 0) {
                returnObj = result.rows;
            }

            return done(null, returnObj);
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }*/
    });
    
};

exports.select = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let sqltext = `SELECT EXPORT_SENTENCE_SID(LOWER(:COND)) SID FROM DUAL`;
            for (var i in req) {
                var sid = "";
                locSplit = req[i].location.split(",");
                //sid += locSplit[0] + "," + locSplit[1];
                sid += locSplit[0] + "," + locSplit[1] + "," + (Number(locSplit[0]) + Number(locSplit[2]));

                var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
                let result = await conn.execute(sqltext, [req[i].text.replace(regExp, "")]);

                if (result.rows[0] != null) {
                    sid += "," + result.rows[0].SID;
                    //sid += result.rows[0].SID;
                }
                req[i].sid = sid;
            }

            return done(null, req);
        } catch (err) { 
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.select2 = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);
            let sqltext = `SELECT EXPORT_SENTENCE_SID(:COND) SID FROM DUAL`;
            for (var i in req) {
                var sid = "";
                locSplit = req[i].location.split(",");
                sid += locSplit[0] + "," + locSplit[1] + "," + (Number(locSplit[0]) + Number(locSplit[2]));

                let result = await conn.execute(sqltext, [req[i].text]);

                if (result.rows[0] != null) {
                    sid += "," + result.rows[0].SID;
                }
                req[i].sid = sid;
            }

            return done(null, req);
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectLegacyFileData = function (req, done) {
    return new Promise(async function (resolve, reject) {
      var res = [];
      let conn;
      try {
          conn = await oracledb.getConnection(dbConfig);
          let resAnswerFile = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_FILE WHERE IMGID LIKE :term `, [req], { outFormat: oracledb.OBJECT });
        
  
        for (let row in resAnswerFile.rows) {
          tempDictFile = {};
          tempDictFile['IMGID'] = resAnswerFile.rows[row].IMGID;
          tempDictFile['PAGENUM'] = resAnswerFile.rows[row].PAGENUM;
          tempDictFile['FILEPATH'] = resAnswerFile.rows[row].FILEPATH;
          tempDictFile['FILENAME'] = tempDictFile['FILEPATH'].substring(tempDictFile['FILEPATH'].lastIndexOf('/') + 1, tempDictFile['FILEPATH'].length);
  
          let answerDataArr = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :imgId AND TO_NUMBER(IMGFILESTARTNO)\
           <= :imgStartNo AND TO_NUMBER(IMGFILESTARTNO) <= :imgStartNo`, [tempDictFile['IMGID'], tempDictFile['PAGENUM'], tempDictFile['PAGENUM']]);
          
          for (let row2 in answerDataArr.rows) {
            let tempdict = {};

            tempDictFile['LEGACY'] = answerDataArr.rows[row2];

          }
          res.push(tempDictFile);
        }
        return done(null, res);
      } catch (err) { // catches errors in getConnection and the query
        console.log(err);
        return done(null, null);
      } finally {
        if (conn) {   // the conn assignment worked, must release
          try {
            await conn.release();
          } catch (e) {
            console.error(e);
          }
        }
      }
    });
  };

  exports.selectDomainDict = function (req, done) {
    return new Promise(async function (resolve, reject) {
      var conn;
      let returnObj = null;
      let selectContractMapping = `SELECT asOgcompanyName legacy FROM tbl_contract_mapping WHERE extOgcompanyName = :extOgcompanyName`;
      try {
        conn = await oracledb.getConnection(dbConfig);
        let result = await conn.execute(selectContractMapping, req, {outFormat: oracledb.OBJECT});
        if (result.rows[0] != null) {
          returnObj = result.rows[0].LEGACY;
        } else {
          returnObj = null;
        }
  
        return done(null, returnObj);
      } catch (err) {
        reject(err);
      } finally {
        if (conn) {
          try {
            await conn.release();
          } catch (e) {
            console.error(e);
          }
        }
      }
    });
  };
exports.selectDocCategory = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        var returnReq = {};   
        var docInfo = req[req.length - 1];
        try {
            conn = await oracledb.getConnection(dbConfig);
            let sqltext = queryConfig.mlConfig.selectDocCategory;

            if (docInfo.docType) {

            } else {
                docInfo.docType = 0;
            }

            let result = await conn.execute(sqltext, [docInfo.docType]);

            returnReq.data = req;
            returnReq.data.splice(req.length - 1, 1);           
            if (result.rows[0] != null) {
                returnReq.docCategory = result.rows;
                returnReq.docCategory[0].score = docInfo.docAccu;
            }

            return done(null, returnReq);
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectContractMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);
            let sqltext = queryConfig.mlConfig.selectContractMapping;
            var extOgCompanyName;
            var extCtnm;

            for (var i in req.data) {
                if (req.data[i].colLbl && req.data[i].colLbl == 0) {
                    extOgCompanyName = req.data[i].text;
                } else if (req.data[i].colLbl && req.data[i].colLbl == 1) {
                    extCtnm = req.data[i].text;
                }
            }

            if (extOgCompanyName && extCtnm) {
                let result = await conn.execute(sqltext, [extOgCompanyName, extCtnm]);
                if (result.rows[0] != null) {
                    req.extOgAndCtnm = result.rows;
                }
            }

            return done(null, req);
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectContractMapping2 = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        var returnObj;

        try {
            conn = await oracledb.getConnection(dbConfig);
            let sqltext = queryConfig.mlConfig.selectContractMapping;

            if (req[0] && req[1]) {
                let result = await conn.execute(sqltext, [req[0], req[1]]);
                if (result.rows[0] != null) {
                    returnObj = result.rows[0];
                } else {
                    returnObj = null;
                }
            } else {
                returnObj = null;
            }

            return done(null, returnObj);
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertLabelMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            conn = await oracledb.getConnection(dbConfig);

            var labelClass;
            let selectSqlText = `SELECT SEQNUM FROM TBL_FORM_LABEL_MAPPING WHERE DATA = :DATA`;
            let insertSqlText = `INSERT INTO TBL_FORM_LABEL_MAPPING (SEQNUM, DATA, CLASS, REGDATE) VALUES (SEQ_FORM_LABEL_MAPPING.NEXTVAL,:DATA,:CLASS,SYSDATE)`;
            let updateSqlText = `UPDATE TBL_FORM_LABEL_MAPPING SET DATA = :DATA , CLASS = :CLASS , REGDATE = SYSDATE WHERE SEQNUM = :SEQNUM`;

            //var userModifyData = [];
            for (var i in req.data) {
                labelClass = 3
                if (req.data[i].colLbl && req.data[i].colLbl == 0) {
                    labelClass = 1
                    /*
                    if (req.data[i].oriColLbl != null && req.data[i].colLbal != req.data[i].oriColLbl) {
                        userModifyData.push(req.data[i]);
                    }
                    */
                }else if(req.data[i].colLbl && req.data[i].colLbl == 1) {
                    labelClass = 2
                    /*
                    if (req.data[i].oriColLbl != null && req.data[i].ColLbal != req.data[i].oriColLbl) {
                        userModifyData.push(req.data[i]);
                    }
                    */
                }

                var result = await conn.execute(selectSqlText, [req.data[i].sid]);
                if (result.rows[0]) {
                    await conn.execute(updateSqlText, [req.data[i].sid, labelClass, result.rows[0].SEQNUM]);
                } else {
                    await conn.execute(insertSqlText, [req.data[i].sid, labelClass]);
                }

            }
            return done(null, req);
        } catch (err) { 
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertDocMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let selectSqlText = `SELECT SEQNUM FROM TBL_FORM_MAPPING WHERE DATA = :DATA`;
            let insertSqlText = `INSERT INTO TBL_FORM_MAPPING (SEQNUM, DATA, CLASS, REGDATE) VALUES (SEQ_FORM_MAPPING.NEXTVAL,:DATA,:CLASS,SYSDATE)`;
            let updateSqlText = `UPDATE TBL_FORM_MAPPING SET DATA = :DATA , CLASS = :CLASS , REGDATE = SYSDATE WHERE SEQNUM = :SEQNUM`;

            insClass = 0;
            insCompanyData = '0,0,0,0,0,0,0';
            insContractData = '0,0,0,0,0,0,0';

            if (req.docCategory[0]) {
                insClass = req.docCategory[0].DOCTYPE;
            }

            for (var i in req.data) {
                if (req.data[i].colLbl && req.data[i].colLbl == 0) {
                    insCompanyData = req.data[i].sid;
                }
                if (req.data[i].colLbl && req.data[i].colLbl == 1) {
                    insContractData = req.data[i].sid;
                }
            }

            if (insCompanyData && insContractData) {
                var sid = insCompanyData + "," + insContractData;
                var result = await conn.execute(selectSqlText, [sid]);
                if (result.rows[0]) {
                    await conn.execute(updateSqlText, [sid, insClass, result.rows[0].SEQNUM]);
                } else {
                    await conn.execute(insertSqlText, [sid, insClass]);
                }
            }
            return done(null, req);
        } catch (err) { 
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertColumnMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let selectSqlText = `SELECT SEQNUM FROM TBL_COLUMN_MAPPING_TRAIN WHERE DATA = :DATA AND CLASS = :CLASS`;
            let insertSqlText = `INSERT INTO TBL_COLUMN_MAPPING_TRAIN (SEQNUM, DATA, CLASS, REGDATE) VALUES (SEQ_COLUMN_MAPPING_TRAIN.NEXTVAL,:DATA,:CLASS,SYSDATE)`;

            var result = await conn.execute(selectSqlText, [req.sid, req.colLbl]);
            if (result.rows[0]) {
                //await conn.execute(updateSqlText, [req.data[i].sid, req.data[i].colLbl, result.rows[0].SEQNUM]);
            } else {

                sidSplit = req.sid.split(",");
                var len = sidSplit.length;
                var textSid = sidSplit[len - 5] + "," + sidSplit[len - 4] + "," + sidSplit[len - 3] + "," + sidSplit[len - 2] + "," + sidSplit[len - 1];

                if ( !((req.colLbl >= 3 && req.colLbl <= 34) && (textSid == "0,0,0,0,0" || textSid == "1,1,1,1,1")) ) {
                    await conn.execute(insertSqlText, [req.sid, req.colLbl]);
                }
                
            }
            return done(null, req);
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertBatchColumnMapping = function (req, filepath, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let selectSqlText = `SELECT SEQNUM FROM TBL_BATCH_COLUMN_MAPPING_TRAIN WHERE DATA = :DATA AND CLASS = :CLASS`;
            let insertSqlText = `INSERT INTO TBL_BATCH_COLUMN_MAPPING_TRAIN (SEQNUM, DATA, CLASS, REGDATE) VALUES (SEQ_COLUMN_MAPPING_TRAIN.NEXTVAL,:DATA,:CLASS,SYSDATE)`;
            let selectLearnListSqlText = `SELECT DOCTYPE FROM TBL_BATCH_LEARN_LIST WHERE FILEPATH = :filepath`

            var result = await conn.execute(selectSqlText, [req.sid, req.colLbl]);
            if (result.rows[0]) {
                //await conn.execute(updateSqlText, [req.data[i].sid, req.data[i].colLbl, result.rows[0].SEQNUM]);
            } else {

                var resLearnList = await conn.execute(selectLearnListSqlText, [filepath]);
                if (resLearnList.rows[0]) {
                    var sidSplit = req.sid.split(",");
                    var len = sidSplit.length;
                    var textSid = sidSplit[len - 5] + "," + sidSplit[len - 4] + "," + sidSplit[len - 3] + "," + sidSplit[len - 2] + "," + sidSplit[len - 1];

                    var locSplit = req.location.split(",");

                    var sid = resLearnList.rows[0].DOCTYPE + "," + req.sid;

                    if (!(((req.colLbl >= 5 && req.colLbl <= 34) || req.colLbl == 36) && (textSid == "0,0,0,0,0" || textSid == "1,1,1,1,1"))) {
                        await conn.execute(insertSqlText, [sid, req.colLbl]);
                    }
                }
            }
            return done(null, req);
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertBatchColumnMappingFromUi = function (req, docType, before, done) {
    return new Promise(async function (resolve, reject) {
        var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
        let conn;
        let result;
        let selectSid = `SELECT EXPORT_SENTENCE_SID(LOWER(:COND)) SID FROM DUAL `;
        let selectBatchColumnMapping = `SELECT SEQNUM FROM TBL_BATCH_COLUMN_MAPPING_TRAIN WHERE DATA = :data AND CLASS = :class `;
        let insertBatchColumnMapping = `INSERT INTO TBL_BATCH_COLUMN_MAPPING_TRAIN VALUES 
                                        (SEQ_COLUMN_MAPPING_TRAIN.NEXTVAL, :data, :class, sysdate) `;
        let updateBatchColumnMapping = 'UPDATE TBL_BATCH_COLUMN_MAPPING_TRAIN SET CLASS = :class WHERE DATA = :data';

        try {
            conn = await oracledb.getConnection(dbConfig);
            
            result = await conn.execute(selectSid, [req.text.replace(regExp, "")]);
            if (result.rows[0].SID) {              
                //var locArr = req.location.split(',');
                var locArr = req.sid.split(',');
                var sid = result.rows[0].SID;
                //var colSid = docType + ',' + locArr[0] + ',' + locArr[1] + ',' + (Number(locArr[0]) + Number(locArr[2])) + ',' + result.rows[0].SID;
                var colSid = docType + ',' + locArr[0] + ',' + locArr[1] + ',' + locArr[2] + ',' + result.rows[0].SID;
                req.colSid = colSid;
                result = await conn.execute(selectBatchColumnMapping, [colSid, before.colLbl]);
                if ( result.rows.length == 0 && !(((req.colLbl >= 5 && req.colLbl <= 34)) && (sid == "0,0,0,0,0" || sid == "1,1,1,1,1")) ) {
                    await conn.execute(insertBatchColumnMapping, [colSid, req.colLbl]);
                    return done(null, req);
                } else {
                    if (result.rows.length > 0 && req.colLbl == 38) {
                        await conn.execute(updateBatchColumnMapping, [req.colLbl, colSid]);
                    }
                    return done(null, null);
                }
            }          

        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });

};

exports.insertColumnMapping2 = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let selectSqlText = `SELECT SEQNUM FROM TBL_COLUMN_MAPPING_TRAIN_1 WHERE DATA = :DATA AND CLASS = :CLASS`;
            let insertSqlText = `INSERT INTO TBL_COLUMN_MAPPING_TRAIN_1 (SEQNUM, DATA, CLASS, REGDATE) VALUES (SEQ_COLUMN_MAPPING_TRAIN.NEXTVAL,:DATA,:CLASS,SYSDATE)`;
            let updateSqlText = `UPDATE TBL_COLUMN_MAPPING_TRAIN_1 SET DATA = :DATA, CLASS = :CALSS, REGDATE = SYSDATE WHERE SEQNUM = :SEQNUM`;

            for (var i in req.data) {
                var result = await conn.execute(selectSqlText, [req.data[i].sid, req.data[i].colLbl]);
                if (result.rows[0]) {
                    //await conn.execute(updateSqlText, [req.data[i].sid, req.data[i].colLbl, result.rows[0].SEQNUM]);
                } else {
                    await conn.execute(insertSqlText, [req.data[i].sid, req.data[i].colLbl]);
                }

            }
            return done(null, req);
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectOcrFilePaths = function (req, done) {
    return new Promise(async function (resolve, reject) {
        var res = [];
        let conn;
        let colNameArr = ['SEQNUM', 'FILEPATH', 'ORIGINFILENAME'];
        try {
            conn = await oracledb.getConnection(dbConfig);
            //let result = await conn.execute(`SELECT SEQNUM,FILEPATH,ORIGINFILENAME FROM TBL_OCR_FILE WHERE IMGID IN (${req.map((name, index) => `:${index}`).join(", ")})`, req);
            //let result = await conn.execute(`SELECT FILENAME, FILEPATH, CONVERTEDIMGPATH FROM TBL_BATCH_LEARN_DATA WHERE IMGID = :imgId`, [req[0]]);
            var dataImgPath = req[0];
            var answerImgPath = dataImgPath.replace("/MIG", "");

            let resAnswer = await conn.execute(`SELECT IMGID, FILEPATH FROM TBL_BATCH_ANSWER_FILE WHERE FILEPATH = :filepath`, [answerImgPath]);
            let result = await conn.execute(`SELECT IMGID, FILENAME, FILEPATH, CONVERTEDIMGPATH FROM TBL_BATCH_LEARN_DATA WHERE filepath = :imgId`, [req[0]]);

            var imgId = [];
            if (resAnswer.rows.length > 0 && resAnswer.rows[0].IMGID != result.rows[0].IMGID) {
                imgId.push(resAnswer.rows[0].IMGID);
                imgId.push(dataImgPath);
                let resUpd = await conn.execute(`UPDATE TBL_BATCH_LEARN_DATA SET IMGID = :imgId WHERE FILEPATH = :filepath`, imgId);
            } else {
                var d = new Date();
                var tempId = d.isoNum(8) + "" + Math.floor(Math.random() * 9999999) + 1000000;
                imgId.push(tempId);
                imgId.push(dataImgPath);
                let resUpd = await conn.execute(`UPDATE TBL_BATCH_LEARN_DATA SET IMGID = :imgId WHERE FILEPATH = :filepath`, imgId);
            }



            for (var row = 0; row < result.rows.length; row++) {
                var dict = {};

                dict.IMGID = imgId[0];
                dict.FILENAME = result.rows[row].FILENAME;
                dict.FILEPATH = result.rows[row].FILEPATH;
                dict.CONVERTEDIMGPATH = result.rows[row].CONVERTEDIMGPATH;
                res.push(dict);

            }

            return done(null, res);
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            return done(null, "error");
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectBatchLearnList = function (req, done) {
    return new Promise(async function (resolve, reject) {
        var res = [];
        let conn;
        let colNameArr = ['SEQNUM', 'FILEPATH', 'ORIGINFILENAME'];
        var condQuery
        if (!commonUtil.isNull(req.body.addCond)) {
            if (req.body.addCond == "LEARN_N") condQuery = "((L.STATUS != 'D' AND L.STATUS != 'R') OR L.STATUS IS NULL OR L.STATUS = 'T')";
            else if (req.body.addCond == "LEARN_Y") condQuery = "(L.STATUS = 'D')";
        }

        try {
            conn = await oracledb.getConnection(dbConfig);          
            var rowNum = req.body.moreNum;
            let resAnswerFile = await conn.execute(`SELECT T.IMGID, T.PAGENUM, T.FILEPATH, T.DOCTYPE 
                                                    FROM (
                                                      SELECT F.IMGID, F.PAGENUM, F.FILEPATH, L.DOCTYPE
                                                      FROM 
                                                        TBL_BATCH_ANSWER_FILE F 
                                                        LEFT OUTER JOIN TBL_BATCH_LEARN_LIST L 
                                                        ON F.FILEPATH = L.FILEPATH 
                                                      WHERE ` + condQuery + `
                                                      AND F.FILEPATH LIKE '/2018/%' 
                                                      ORDER BY F.FILEPATH ASC
                                                    ) T
                                                    WHERE ROWNUM <= :num `, [req.body.moreNum]);
            
            for (var i = 0; i < resAnswerFile.rows.length; i++) {
                var imgId = resAnswerFile.rows[i].IMGID;
                var imgStartNo = resAnswerFile.rows[i].PAGENUM;
                var filepath = resAnswerFile.rows[i].FILEPATH;
                var filename = filepath.substring(filepath.lastIndexOf('/') + 1, filepath.length);

                let resAnswerData = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :imgId AND TO_NUMBER(IMGFILESTARTNO) <= :imgStartNo AND TO_NUMBER(IMGFILEENDNO) >= :imgStartNo `, [imgId, imgStartNo, imgStartNo]);
                for (var row = 0; row < resAnswerData.rows.length; row++) {
					resAnswerData.rows[row].FILEPATH = filepath;
                    resAnswerData.rows[row].FILENAME = filename;
					if(resAnswerFile.rows[i].DOCTYPE){
						let resBatchLearnList = await conn.execute(`SELECT * FROM TBL_DOCUMENT_CATEGORY WHERE DOCTYPE = :docType `, [resAnswerFile.rows[i].DOCTYPE]);
						if(resBatchLearnList.rows.length > 0){
							resAnswerData.rows[row].DOCTYPE = resAnswerFile.rows[i].DOCTYPE;
							resAnswerData.rows[row].DOCNAME = resBatchLearnList.rows[0].DOCNAME;
						}
					}
                }

                if (resAnswerData.rows.length > 0) {
                    res.push(resAnswerData);
                }
            }

            return done(null, res);

            /*
            conn = await oracledb.getConnection(dbConfig);

            var idCond = [];
            var status;
            if (!commonUtil.isNull(req.body.addCond)) {
                if (req.body.addCond == "LEARN_N") status = 'N';
                else if (req.body.addCond == "LEARN_Y") status = 'Y';
            }

            idCond.push(status);
            idCond.push(req.body.moreNum);

            let resLearnId = await conn.execute(`SELECT FILEPATH, STATUS FROM TBL_BATCH_LEARN_ID WHERE STATUS = :status AND ROWNUM <= :num `, idCond);

            if (resLearnId.rows.length != 0) {
                var answerCond = [];
                var answerFileSql = "(";
                for (var i = 0; i < resLearnId.rows.length; i++) {
                    answerCond.push(resLearnId.rows[i].FILEPATH);
                    answerFileSql += (i > 0) ? ", :" + i : ":" + i;
                }
                answerFileSql += ")";

                let resAnswerFile = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_FILE WHERE FILEPATH IN` + answerFileSql, answerCond);

                for (var i = 0; i < resAnswerFile.rows.length; i++) {
                    var imgId = resAnswerFile.rows[i].IMGID;
                    var imgStartNo = resAnswerFile.rows[i].PAGENUM;
                    var filepath = resAnswerFile.rows[i].FILEPATH;
                    var filename = filepath.substring(filepath.lastIndexOf('/') + 1, filepath.length);

                    let resAnswerData = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :imgId AND TO_NUMBER(IMGFILESTARTNO) <= :imgStartNo AND TO_NUMBER(IMGFILEENDNO) >= :imgStartNo `, [imgId, imgStartNo, imgStartNo]);

                    for (var row = 0; row < resAnswerData.rows.length; row++) {
                        resAnswerData.rows[row].FILEPATH = filepath;
                        resAnswerData.rows[row].FILENAME = filename;
                    }

                    if (resAnswerData.rows.length > 0) {
                        res.push(resAnswerData);
                    }
                }
            }
            
            return done(null, res);
            */
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            return done(null, "error");
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.convertTiftoJpg = function (originFilePath, done) {
    try {
        convertedFileName = originFilePath.split('.')[0] + '.jpg';
        execSync('module\\imageMagick\\convert.exe -density 800x800 ' + propertiesConfig.filepath.answerFileFrontPath + originFilePath + ' ' + propertiesConfig.filepath.answerFileFrontPath + convertedFileName);
            
        return done(null, convertedFileName);
    } catch (err) {
        console.log(err);
        return done(null, "error");
    } finally {

    }
};

exports.convertTiftoJpg2 = function (originFilePath, done) {
    try {
        var originFileName = originFilePath.substring(originFilePath.lastIndexOf('/') + 1, originFilePath.length);
        convertedFileName = originFileName.split('.')[0] + '.jpg';
        var ofile = './uploads/' + convertedFileName;

        execSync('module\\imageMagick\\convert.exe -density 800x800 ' + propertiesConfig.filepath.answerFileFrontPath + originFilePath + ' ' + ofile);
        
        return done(null, convertedFileName);
    } catch (err) {
        console.log(err);
        return done(null, "error");
    } finally {

    }
};

/*
exports.callApiOcr = function (req, done) {
    var pharsedOcrJson = "";
    try {
        var uploadImage = fs.readFileSync(req, 'binary');
        var base64 = new Buffer(uploadImage, 'binary').toString('base64');
        var binaryString = new Buffer(base64, 'base64').toString('binary');
        uploadImage = new Buffer(binaryString, "binary");

        var res = request('POST', propertiesConfig.ocr.uri, {
            headers: {
                'Ocp-Apim-Subscription-Key': propertiesConfig.ocr.subscriptionKey,
                'Content-Type': 'application/octet-stream'
            },
            uri: propertiesConfig.ocr.uri + '?' + 'language=unk&detectOrientation=true',
            body: uploadImage,
            method: 'POST'
        });
        //var resJson = JSON.parse(res.getBody('utf8'));
        //pharsedOcrJson = ocrJson(resJson.regions);

        return done(null, res.getBody('utf8'));
    } catch (err) {
        console.log(err);
        return done(null, 'error');
    } finally {

    }
};
*/

exports.insertOcrData = function (filepath, ocrData, done) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            let resfile = await conn.execute(`SELECT * FROM TBL_BATCH_OCR_DATA WHERE FILEPATH = :filepath `, [filepath]);

            if (resfile.rows.length == 0) {
                let resIns = await conn.execute(`INSERT INTO TBL_BATCH_OCR_DATA VALUES(seq_batch_ocr_data.nextval, :filepath, :ocrData) `, [filepath, ocrData], { autoCommit: true });
            }

            return done(null, result.rowsAffected);
        } catch (err) { // catches errors in getConnection and the query
            return done(null, "error");
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

function ocrJson(regions) {
    var data = [];
    for (var i = 0; i < regions.length; i++) {
        for (var j = 0; j < regions[i].lines.length; j++) {
            var item = '';
            for (var k = 0; k < regions[i].lines[j].words.length; k++) {
                item += regions[i].lines[j].words[k].text + ' ';
            }
            //data.push({ 'location': regions[i].lines[j].boundingBox, 'text': item.trim() });
            data.push({ 'location': regions[i].lines[j].boundingBox, 'text': item.trim().replace(/'/g, '`') });
        }
    }
    return data;
}

exports.selectLegacyData = function (req, done) {
    return new Promise(async function (resolve, reject) {
        var res = [];
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            var tempImageFileName = req;
            let result = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :IMGID`, [req]);

            return done(null, result.rows);
        } catch (err) { // catches errors in getConnection and the query
            return done(null, "error");
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertRegacyData = function (req, done) {
    return new Promise(async function (resolve, reject) {
        var res = [];
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            for (var i = 0; i < req.length; i++) {

                let LearnDataRes = await conn.execute("select count(*) as COUNT, max(FILENAME) as FILENAME, max(FILEPATH) AS FILEPATH from tbl_batch_learn_data where imgid = :imgid", [req[i].IMGID]);

                if (i + 1 <= LearnDataRes.rows[0].COUNT) {

                    var dataArr = [
                        "N",
                        commonUtil.nvl(req[i].ENTRYNO),
                        commonUtil.nvl(req[i].STATEMENTDIV),
                        commonUtil.nvl(req[i].CONTRACTNUM),
                        commonUtil.nvl(req[i].OGCOMPANYCODE),
                        commonUtil.nvl(req[i].OGCOMPANYNAME),
                        commonUtil.nvl(req[i].BROKERCODE),
                        commonUtil.nvl(req[i].BROKERNAME),
                        commonUtil.nvl(req[i].CTNM),
                        commonUtil.nvl(req[i].INSSTDT),
                        commonUtil.nvl(req[i].INSENDDT),
                        commonUtil.nvl(req[i].UY),
                        commonUtil.nvl(req[i].CURCD),
                        commonUtil.nvl2(req[i].PAIDPERCENT, 0),
                        commonUtil.nvl2(req[i].PAIDSHARE, 0),
                        commonUtil.nvl2(req[i].OSLPERCENT, 0),
                        commonUtil.nvl2(req[i].OSLSHARE, 0),
                        commonUtil.nvl2(req[i].GROSSPM, 0),
                        commonUtil.nvl2(req[i].PM, 0),
                        commonUtil.nvl2(req[i].PMPFEND, 0),
                        commonUtil.nvl2(req[i].PMPFWOS, 0),
                        commonUtil.nvl2(req[i].XOLPM, 0),
                        commonUtil.nvl2(req[i].RETURNPM, 0),
                        commonUtil.nvl2(req[i].GROSSCN, 0),
                        commonUtil.nvl2(req[i].CN, 0),
                        commonUtil.nvl2(req[i].PROFITCN, 0),
                        commonUtil.nvl2(req[i].BROKERAGE, 0),
                        commonUtil.nvl2(req[i].TAX, 0),
                        commonUtil.nvl2(req[i].OVERRIDINGCOM, 0),
                        commonUtil.nvl2(req[i].CHARGE, 0),
                        commonUtil.nvl2(req[i].PMRESERVERTD, 0),
                        commonUtil.nvl2(req[i].PFPMRESERVERTD, 0),
                        commonUtil.nvl2(req[i].PMRESERVERLD, 0),
                        commonUtil.nvl2(req[i].PFPMRESERVERLD, 0),
                        commonUtil.nvl2(req[i].CLAIM, 0),
                        commonUtil.nvl2(req[i].LOSSRECOVERY, 0),
                        commonUtil.nvl2(req[i].CASHLOSS, 0),
                        commonUtil.nvl2(req[i].CASHLOSSRD, 0),
                        commonUtil.nvl2(req[i].LOSSRR, 0),
                        commonUtil.nvl2(req[i].LOSSRR2, 0),
                        commonUtil.nvl2(req[i].LOSSPFEND, 0),
                        commonUtil.nvl2(req[i].LOSSPFWOA, 0),
                        commonUtil.nvl2(req[i].INTEREST, 0),
                        commonUtil.nvl2(req[i].TAXON, 0),
                        commonUtil.nvl2(req[i].MISCELLANEOUS, 0),
                        commonUtil.nvl2(req[i].PMBL, 0),
                        commonUtil.nvl2(req[i].CMBL, 0),
                        commonUtil.nvl2(req[i].NTBL, 0),
                        commonUtil.nvl2(req[i].CSCOSARFRNCNNT2, 0),
                        'L',
                        LearnDataRes.rows[0].FILENAME,
                        LearnDataRes.rows[0].FILEPATH
                    ];

                    //update
                    console.log("update");
                    var andCond = "('" + req[i].IMGID + "') and subnum = " + (parseInt(i) + 1);
                    let updLearnDataRes = await conn.execute(queryConfig.batchLearningConfig.updateBatchLearningData + andCond, dataArr);
                } else {
                    //insert

                    var insArr = [
                        req[i].IMGID,
                        commonUtil.nvl(req[i].ENTRYNO),
                        commonUtil.nvl(req[i].STATEMENTDIV),
                        commonUtil.nvl(req[i].CONTRACTNUM),
                        commonUtil.nvl(req[i].OGCOMPANYCODE),
                        commonUtil.nvl(req[i].OGCOMPANYNAME),
                        commonUtil.nvl(req[i].BROKERCODE),
                        commonUtil.nvl(req[i].BROKERNAME),
                        commonUtil.nvl(req[i].CTNM),
                        commonUtil.nvl(req[i].INSSTDT),
                        commonUtil.nvl(req[i].INSENDDT),
                        commonUtil.nvl(req[i].UY),
                        commonUtil.nvl(req[i].CURCD),
                        commonUtil.nvl(req[i].PAIDPERCENT, 0),
                        commonUtil.nvl(req[i].PAIDSHARE, 0),
                        commonUtil.nvl(req[i].OSLPERCENT, 0),
                        commonUtil.nvl(req[i].OSLSHARE, 0),
                        commonUtil.nvl(req[i].GROSSPM, 0),
                        commonUtil.nvl(req[i].PM, 0),
                        commonUtil.nvl(req[i].PMPFEND, 0),
                        commonUtil.nvl(req[i].PMPFWOS, 0),
                        commonUtil.nvl(req[i].XOLPM, 0),
                        commonUtil.nvl(req[i].RETURNPM, 0),
                        commonUtil.nvl(req[i].GROSSCN, 0),
                        commonUtil.nvl(req[i].CN, 0),
                        commonUtil.nvl(req[i].PROFITCN, 0),
                        commonUtil.nvl(req[i].BROKERAGE, 0),
                        commonUtil.nvl(req[i].TAX, 0),
                        commonUtil.nvl(req[i].OVERRIDINGCOM, 0),
                        commonUtil.nvl(req[i].CHARGE, 0),
                        commonUtil.nvl(req[i].PMRESERVERTD, 0),
                        commonUtil.nvl(req[i].PFPMRESERVERTD, 0),
                        commonUtil.nvl(req[i].PMRESERVERLD, 0),
                        commonUtil.nvl(req[i].PFPMRESERVERLD, 0),
                        commonUtil.nvl(req[i].CLAIM, 0),
                        commonUtil.nvl(req[i].LOSSRECOVERY, 0),
                        commonUtil.nvl(req[i].CASHLOSS, 0),
                        commonUtil.nvl(req[i].CASHLOSSRD, 0),
                        commonUtil.nvl(req[i].LOSSRR, 0),
                        commonUtil.nvl(req[i].LOSSRR2, 0),
                        commonUtil.nvl(req[i].LOSSPFEND, 0),
                        commonUtil.nvl(req[i].LOSSPFWOA, 0),
                        commonUtil.nvl(req[i].INTEREST, 0),
                        commonUtil.nvl(req[i].TAXON, 0),
                        commonUtil.nvl(req[i].MISCELLANEOUS, 0),
                        commonUtil.nvl(req[i].PMBL, 0),
                        commonUtil.nvl(req[i].CMBL, 0),
                        commonUtil.nvl(req[i].NTBL, 0),
                        commonUtil.nvl(req[i].CSCOSARFRNCNNT2, 0),
                        (parseInt(i) + 1),
                        'L',
                        LearnDataRes.rows[0].FILENAME,
                        LearnDataRes.rows[0].FILEPATH
                    ];

                    console.log("insert");
                    let insLearnDataRes = await conn.execute(queryConfig.batchLearningConfig.insertBatchLearningData, insArr);
                }

            }

            return done(null, "done legary insert");
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            return done(null, "error");
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertMLData = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);
            var insSql = queryConfig.batchLearningConfig.insertMlExport;
            var delSql = queryConfig.batchLearningConfig.deleteMlExport;

            let delRes = await conn.execute(delSql, [req.fileinfo.filepath], { autoCommit: true });

            for (var i in req.data) {
                var cond = [];
                cond.push(req.fileinfo.imgId);
                cond.push(req.fileinfo.filepath);
                cond.push(req.data[i].colLbl);
                cond.push(req.data[i].text);
                cond.push(req.data[i].location);
                cond.push(req.data[i].sid);
                cond.push(req.data[i].entryLbl);

                if (cond.length == 7) {
                    let colData = await conn.execute(insSql, cond);
                }
            }

            return done(null, "mlExport");
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            return done(null, "error");
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};
exports.insertMLDataCMD = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            if (req.length) {
                conn = await oracledb.getConnection(dbConfig);

                let delSql = queryConfig.batchLearningConfig.deleteMlExport;
                await conn.execute(delSql, [req[0].filepath]);

                let resCol = await conn.execute("SELECT * FROM TBL_COLUMN_MAPPING_CLS");
                let insSql = queryConfig.batchLearningConfig.insertMlExport;

                for (let i = 0; i < req.length; i++) {
                    let cond = [];
                    cond.push(req[i].imgid);
                    cond.push(req[i].filepath);

                    for (let row = 0; row < resCol.rows.length; row++) {
                        if (req.mlData[0][i].label == resCol.rows[row].COLTYPE) {
                            cond.push(resCol.rows[row].COLNUM);
                        }
                    }

                    cond.push(req[i].text);
                    cond.push(req[i].location);
                    cond.push(req[i].sid);

                    if (cond.length == 6) {
                        await conn.execute(insSql, cond);
                    }
                }
            }

            return done(null, "mlExport");
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            return done(null, "error");
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertOcrSymspell = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            var reqArr = req[0].text.split(' ');
            for (var i in reqArr) {
                result = await conn.execute(queryConfig.uiLearningConfig.selectTypo, [reqArr[i]]);
                if (result.rows.length == 0) {
                    result = await conn.execute(queryConfig.uiLearningConfig.insertTypo, [reqArr[i]]);
                } else {
                    //result = await conn.execute(queryConfig.uiLearningConfig.updateTypo, [reqArr[i]]);
                }
            }

            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertOcrSymspellForCurcd = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        var isTypoMapping = true;
        try {
            conn = await oracledb.getConnection(dbConfig);
            var reqArr = req[0].text.split(' ');
            for (var i in reqArr) {
                result = await conn.execute(queryConfig.uiLearningConfig.selectTypo, [reqArr[i]]);
                if (result.rows.length == 0) {
                    await conn.execute(queryConfig.uiLearningConfig.insertTypo, [reqArr[i]]);
                } else {
                    //result = await conn.execute(queryConfig.uiLearningConfig.updateTypo, [reqArr[i]]);
                    isTypoMapping = false;
                }
            }

            // insert tbl_curcd_mapping
            if (!isTypoMapping) {
                result = await conn.execute(queryConfig.uiLearningConfig.selectCurcdMapping, [req[1].text, req[0].text]);
                if (result.rows.length == 0) {
                    await conn.execute(queryConfig.uiLearningConfig.insertCurcdMapping, [req[1].text, req[0].text]);
                }
            }

            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};
exports.selectSid = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);
            let sqltext = `SELECT EXPORT_SENTENCE_SID(LOWER(:COND)) SID FROM DUAL`;
            var sid = "";
            //locSplit = req.location.split(",");
            //need check
            //sid += locSplit[0] + "," + locSplit[1] + "," + (Number(locSplit[0]) + Number(locSplit[2]));
            locSplit = req.mappingSid.split(",");
            sid += locSplit[1] + "," + locSplit[2] + "," + locSplit[3];

            var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
            let result = await conn.execute(sqltext, [req.text.replace(regExp,"")]);

            if (result.rows[0] != null) {
                sid += "," + result.rows[0].SID;
            }
            return done(null, sid);
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};
  
exports.insertOcrSymsSingle = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            let selectTypo = `SELECT seqNum FROM tbl_ocr_symspell WHERE keyword=LOWER(:keyWord) `;
            let insertTypo = `INSERT INTO tbl_ocr_symspell(seqNum, keyword, frequency) VALUES (seq_ocr_symspell.nextval, LOWER(:keyWord), 1)`;
            conn = await oracledb.getConnection(dbConfig);
            var reqArr = req.text.split(' ');
            var result;
            var numExp = /[0-9]/gi;
            var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
            for (var i in reqArr) {

                result = await conn.execute(selectTypo, [reqArr[i].replace(regExp, "")]);
                if (result.rows.length == 0) {
                    var exceptNum = reqArr[i].replace(numExp, "");

                    if (exceptNum != "") {
                        reqArr[i] = reqArr[i].replace(regExp, "");
                        exceptNum = reqArr[i].replace(numExp, "");
                        if (reqArr[i] != "" || exceptNum != "") {
                            result = await conn.execute(insertTypo, [reqArr[i]]);
                        }
                    }
                } else {
                    //result = await conn.execute(queryConfig.uiLearningConfig.updateTypo, [reqArr[i]]);
                }
            }

            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertOcrSymsDoc = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            let selectTypo = `SELECT seqNum FROM tbl_ocr_symspell WHERE keyword=LOWER(:keyWord) `;
            let insertTypo = `INSERT INTO tbl_ocr_symspell(seqNum, keyword, frequency) VALUES (seq_ocr_symspell.nextval, LOWER(:keyWord), 1) `;
            conn = await oracledb.getConnection(dbConfig);
            var reqArr = req.text.split(' ');
            var result;
            //var numExp = /[0-9]/gi;
            var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
            for (var i in reqArr) {

                result = await conn.execute(selectTypo, [reqArr[i].replace(regExp, "")]);
                if (result.rows.length == 0) {
                    await conn.execute(insertTypo, [reqArr[i].replace(regExp, "")]);
                    conn.commit();
                    /*
                    var exceptNum = reqArr[i].replace(numExp, "");
  
                    if (exceptNum != "") {
                        reqArr[i] = reqArr[i].replace(regExp, "");
                        exceptNum = reqArr[i].replace(numExp, "");
                        if (reqArr[i] != "" || exceptNum != "") {
                            result = await conn.execute(insertTypo, [reqArr[i]]);
                            conn.commit();
                        }
                    }
                    */
                } else {
                    //result = await conn.execute(queryConfig.uiLearningConfig.updateTypo, [reqArr[i]]);
                }
            }

            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertContractMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);

            selContract = await conn.execute(`SELECT * FROM TBL_CONTRACT_MAPPING WHERE EXTOGCOMPANYNAME = :extog `, [req[0]]);

            selContractAsog = await conn.execute(`SELECT * FROM TBL_CONTRACT_MAPPING WHERE EXTOGCOMPANYNAME = :extog AND ASOGCOMPANYNAME = :asog `, [req[0], req[2]]);

            if (selContract.rows.length == 0 && selContractAsog.rows.length == 0) {
                result = await conn.execute(queryConfig.uiLearningConfig.insertContractMapping2, [req[0], req[1], req[2], req[3]]);
            } else {

                if (selContract.rows.length > 0 && selContractAsog.rows.length == 0) {
                    updContract = await conn.execute(`UPDATE TBL_CONTRACT_MAPPING SET ASOGCOMPANYNAME = :asog WHERE EXTOGCOMPANYNAME = :extog`, [req[2], req[0]]);
                }
            }

            return done(null, null);
		} catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectCurCd = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            let sql = "SELECT beforeText, afterText FROM tbl_curcd_mapping";
            result = await conn.execute(sql);

            var afterText = req;
            if (result.rows.length > 0) {
                for (var i in result.rows) {
                    if (req.lastIndexOf(result.rows[i].BEFORETEXT) != -1) {
                        afterText = result.rows[i].AFTERTEXT;
                        break;
                    }
                }
                return done(null, afterText);
            } else {
                return done(null, req);
            }
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectCurcdMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(queryConfig.uiLearningConfig.selectCurcdMapping2, [req]);

            if (result.rows) {
                return done(null, result.rows[0]);
            } else {
                return done(null, null);
            }
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectColumn = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(queryConfig.dbcolumnsConfig.selectColMappingCls);
            return done(null, result.rows);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectLegacyFilepath = function (req, done) {
    return new Promise(async function (resolve, reject) {
        var res = [];
        let conn;
        try {
            conn = await oracledb.getConnection(dbConfig);
            console.log(req);
            let resAnswerFile = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_FILE WHERE FILEPATH = :filepath`, [req]);
            for (var i = 0; i < resAnswerFile.rows.length; i++) {
                var imgId = resAnswerFile.rows[i].IMGID;
                var imgStartNo = resAnswerFile.rows[i].PAGENUM;
                var filepath = resAnswerFile.rows[i].FILEPATH;
                var filename = filepath.substring(filepath.lastIndexOf('/') + 1, filepath.length);

                let resAnswerData = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :imgId AND TO_NUMBER(IMGFILESTARTNO) <= :imgStartNo AND TO_NUMBER(IMGFILEENDNO) >= :imgStartNo`, [imgId, imgStartNo, imgStartNo]);
                for (var row = 0; row < resAnswerData.rows.length; row++) {
                    resAnswerData.rows[row].FILEPATH = filepath;
                    resAnswerData.rows[row].FILENAME = filename;
                }

                res.push(resAnswerData);
            }

            return done(null, res);
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            return done(null, "error getlegacy");
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};
/*
exports.selectFormLabelMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(queryConfig.mlConfig.selectFormLabelMapping);

            return done(null, result.rows);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};
*/
exports.selectFormLabelMappingFromMLStudio = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);

            var inQuery = "(";
            for (var i in req.data) {
                inQuery += "'" + req.data[i].sid + "',";
            }
            inQuery = inQuery.substring(0, inQuery.length - 1);
            inQuery += ")";
            result = await conn.execute(queryConfig.mlConfig.selectFormLabelMapping + inQuery);
            if (result.rows.length > 0) {
                for (var i in req.data) {
                    for (var j in result.rows) {
                        var row = result.rows[j];
                        if (req.data[i].sid == row.DATA) {
                            req.data[i].formLabel = row.CLASS;
                            break;
                        }
                    }
                }
            }

            return done(null, req);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectFormMappingFromMLStudio = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            var param = []
            var ogCompany = [];
            var ctnm = [];
            for (var i in req.data) {
                if (req.data[i].formLabel == 1) {
                    ogCompany.push(req.data[i].sid);
                } else if (req.data[i].formLabel == 2) {
                    ctnm.push(req.data[i].sid);
                }
            }
            if (ogCompany.length == 1 && ctnm.length == 1) {
                param.push(ogCompany[0] + ',' + ctnm[0]);
            } else if (ogCompany.length > 1 && ctnm.length == 1) {
                for (var i in ogCompany) {
                    param.push(ogCompany[i] + ',' + ctnm[0]);
                }
            } else if (ogCompany.length == 1 && ctnm.length > 1) {
                for (var i in ctnm) {
                    param.push(ogCompany[0] + ',' + ctnm[i]);
                }
            }
            for (var i in param) {
                result = await conn.execute(queryConfig.mlConfig.selectFormMapping, [param[i]]);
                if (result.rows.length > 0) {
                    result = await conn.execute(queryConfig.mlConfig.selectDocCategory, [result.rows[0].CLASS]);
                    if (result.rows.length > 0) {
                        req.docCategory = result.rows[0];
                        break;
                    }
                }
            }

            return done(null, req);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectDocCategoryFromMLStudio = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);

            result = await conn.execute(queryConfig.mlConfig.selectDocCategory, [req.docCategory.DOCTYPE]);
            if (result.rows.length > 0) {
                req.docCategory = result.rows[0];
            } 

            return done(null, req);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
}; 
exports.selectColumnMappingFromMLStudio = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);

            /*
            var inQuery = "(";
            for (var i in req.data) {
                inQuery += "'" + req.docCategory.DOCTYPE + "," + req.data[i].sid + "',";
            }
            inQuery = inQuery.substring(0, inQuery.length - 1);
            inQuery += ")";
            */
            result = await conn.execute(queryConfig.mlConfig.selectColumnMapping);

            if (result.rows.length > 0) {
                for (var i in req.data) {
                    for (var j in result.rows) {
                        var row = result.rows[j];
                        if (req.data[i].sid == row.DATA) {
                            req.data[i].colLbl = row.CLASS;
                            break;
                        }
                        /*
                        if (req.docCategory.DOCTYPE + "," + req.data[i].sid == row.DATA) {
                            req.data[i].colLbl = row.CLASS;
                            break;
                        }
                        */
                    }
                }
            }         

            return done(null, req);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectBatchLearnMlList = function (filePathList, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);

            var inQuery = "(";
            for (var i in filePathList) {
                inQuery += "'" + filePathList[i] + "',";
            }
            inQuery = inQuery.substring(0, inQuery.length - 1);
            inQuery += ")";
            result = await conn.execute(queryConfig.batchLearningConfig.selectBatchLearnMlList + inQuery);


            return done(null, result);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.addBatchTraining = function (filepath, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        var retData = 0;
        try {
            conn = await oracledb.getConnection(dbConfig);
            var inQuery = "('" + filepath + "')";
            let result = await conn.execute(queryConfig.batchLearningConfig.selectBatchLearnMlList + inQuery);

            for (var row in result.rows) {
                var sid = result.rows[row].SID;
                var colLbl = result.rows[row].COLLABEL;

                var resSelColData = await conn.execute(`SELECT * FROM TBL_COLUMN_MAPPING_TRAIN WHERE DATA = :data AND CLASS = :class`, [sid, colLbl]);

                if (resSelColData.rows.length == 0) {
                    var resInsColData = await conn.execute(queryConfig.mlConfig.insertColMapping, [sid, colLbl]);
                    retData++;
                }
            }

            return done(null, retData);
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            return done(null, "error");
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectColumnMappingCls = function (filePathList, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(queryConfig.dbcolumnsConfig.selectColMappingCls);


            return done(null, result);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectTypoMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);

            for (var i in req) {
                var inQuery = "(";
                var wordArr = req[i].text.split(' ');
                for (var j in wordArr) {
                    inQuery += "'" + wordArr[j] + "',";
                }
                inQuery = inQuery.substring(0, inQuery.length - 1);
                inQuery += ")";
                result = await conn.execute(queryConfig.mlConfig.selectTypoMapping + inQuery);
                req[i].originText = req[i].text;

                if (result.rows.length > 0) {
                    for (var j in result.rows) {
                        var row = result.rows[j];
                        req[i].text = req[i].text.split(row.ORIGINTEXT).join(row.TEXT);
                    }
                }
            }

            return done(null, req);
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectEntryMappingCls = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(queryConfig.dbcolumnsConfig.selectEntryMappingCls);


            return done(null, result.rows);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectOcrData = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(`SELECT * FROM TBL_BATCH_OCR_DATA WHERE FILEPATH = :filepath `, [req]);
            //result = await conn.execute(`SELECT * FROM TBL_BATCH_OCR_DATA WHERE FILEPATH = :filepath `, ['C:/ICR/MIG/MIG/2014/img1/7a/25b7a/209391.tif']);

            if (result.rows.length == 0) {
                return done(null, result.rows);
            }

            var ocr = JSON.parse(result.rows[0].OCRDATA);
            //var retData = ocrJson(ocr.regions);

            return done(null, ocr);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectForm = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        let unknownRes;
        let retData;

        try {
            conn = await oracledb.getConnection(dbConfig);

            var formArr = [];
            var formText = "";
            console.log("==== classify form ====");
            for (var i in req) {
                console.log(req[i].text);
                var sidSplit = req[i].sid.split(",");
                for (var j = sidSplit.length - 5; j < sidSplit.length; j++) {
                    formArr.push(sidSplit[j]);
                }
                if (formArr.length == 25) {
                    break;
                }
            }

            for (var i in formArr) {
                formText += formArr[i] + ",";
            }
            
            formText = formText.slice(0, -1);
            console.log(formText);
            result = await conn.execute(`SELECT * FROM TBL_FORM_MAPPING WHERE DATA = :data `, [formText]);

            if (result.rows.length == 0) {
                formText = "";
                for (var i = 0; i < 15; i++) {
                    formText += formArr[i] + ",";
                }
                formText = formText.slice(0, -1);
                result = await conn.execute(`SELECT * FROM TBL_FORM_MAPPING WHERE DATA like :data` + ` || '%' `, [formText]);
            }

            if (result.rows.length == 0) {
                unknownRes = await conn.execute(`SELECT * FROM TBL_DOCUMENT_CATEGORY WHERE DOCTYPE = 0`);
                retData = unknownRes.rows[0];
            } else {
                let resForm = await conn.execute(`SELECT * FROM TBL_DOCUMENT_CATEGORY WHERE DOCTYPE = :doctype `, [result.rows[0].CLASS]);

                if (resForm.rows.length == 0) {
                    unknownRes = await conn.execute(`SELECT * FROM TBL_DOCUMENT_CATEGORY WHERE DOCTYPE = 0`);
                    retData = unknownRes.rows[0];
                } else {
                    retData = resForm.rows[0];
                }
            }

            return done(null, retData);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertNewDocument = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);          

            result = await conn.execute(queryConfig.batchLearningConfig.selectMaxDocType);
            await conn.execute(queryConfig.batchLearningConfig.insertDocCategory, [req[0], result.rows[0].MAXDOCTYPE, req[1]]);
            //var imgId = getConvertDate();
            //await conn.execute(queryConfig.batchLearningConfig.insertBatchLearnList, [imgId, req[1], result.rows[0].MAXDOCTYPE]);

            return done(null, {code: '200'});
        } catch (err) { // catches errors in getConnection and the query
            return done(null, { code: '500', error: err });
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectDocumentCategory = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(queryConfig.batchLearningConfig.selectDocumentCategory, [req]);          

            return done(null, result);
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            return done(null, { code: '500', error: err });
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertBatchLearnList = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);

            for (var i in req.filePathArray) {
                var docType = '';
                //20180910 hskim 일괄학습 리스트에서 add training 처리
                //일괄학습 리스트에서 Add training과 문서양식 팝업에서 저장 버튼 동일한 function 사용 function 분리 필요
                //TBL_BATCH_LEARN_LIST 에 status 'D'로 인서트 
                await conn.execute(queryConfig.batchLearningConfig.updateBatchLearnList, [req.docTypeArray[i], req.filePathArray[i]]);
            }

            return done(null, { code: '200' });
        } catch (err) {
            console.log(err);
            return done(null, { code: '500', error: err });
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};
exports.selectEntryMappingUnit = function (done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);

            result = await conn.execute('SELECT COLNUM, CREDIT, DEBIT FROM TBL_ENTRY_MAPPING_UNIT');

            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }
        } catch (err) {
            console.log(err);
            return done(null, { code: '500', error: err });
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertDoctypeMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            
            /*
            conn = await oracledb.getConnection(dbConfig);

            //req.imgid req.filepath req.docname req.radiotype
            //req.words
            //{"Empower Results@" : 0}
            //{"To:" : 1}
            //{"To:" : 1}
            //todo
            //20180910 hskim 문서양식 매핑
            //문장을 순서대로 for문

            //문장 index가 1인 경우 문장의 첫부분을 TBL_OCR_BANNED_WORD 에 insert
            //문장 index가 0인 경우 문장을 symspell에 등록 안된 단어 있는지 확인 후 없을 경우 insert
            //문장 index가 0인 경우가 5개가 되면 for문 종료

            //가져온 문장의 sid EXPORT_SENTENCE_SID함수를 통해 추출

            //신규문서일 경우
            //기존 문서양식중 max doctype값 가져오기
            //TBL_DOCUMENT_CATEGORY테이블에 가져온 신규문서 양식명을 insert
            //기존 이미지 파일을 c://sampleDocImage 폴더에 DocType(숫자).jpg로 저장
            result = await conn.execute(queryConfig.batchLearningConfig.selectMaxDocType);
            await conn.execute(queryConfig.batchLearningConfig.insertDocCategory, ['sample doc', result.rows[0].MAXDOCTYPE, 'sample image path']);

            //TBL_FORM_MAPPING 에 5개문장의 sid 와 doctype값 insert
            //TBL_BATCH_LEARN_LIST 에 insert

            let selectSqlText = `SELECT SEQNUM FROM TBL_FORM_MAPPING WHERE DATA = :DATA`;
            let insertSqlText = `INSERT INTO TBL_FORM_MAPPING (SEQNUM, DATA, CLASS, REGDATE) VALUES (SEQ_FORM_MAPPING.NEXTVAL,:DATA,:CLASS,SYSDATE)`;
            let updateSqlText = `UPDATE TBL_FORM_MAPPING SET DATA = :DATA , CLASS = :CLASS , REGDATE = SYSDATE WHERE SEQNUM = :SEQNUM`;

            insClass = 0;
            insCompanyData = '0,0,0,0,0,0,0';
            insContractData = '0,0,0,0,0,0,0';

            if (req.docCategory[0]) {
                insClass = req.docCategory[0].DOCTYPE;
            }

            for (var i in req.data) {
                if (req.data[i].colLbl && req.data[i].colLbl == 0) {
                    insCompanyData = req.data[i].sid;
                }
                if (req.data[i].colLbl && req.data[i].colLbl == 1) {
                    insContractData = req.data[i].sid;
                }
            }

            if (insCompanyData && insContractData) {
                var sid = insCompanyData + "," + insContractData;
                result = await conn.execute(selectSqlText, [sid]);
                if (result.rows[0]) {
                    await conn.execute(updateSqlText, [sid, insClass, result.rows[0].SEQNUM]);
                } else {
                    await conn.execute(insertSqlText, [sid, insClass]);
                }
            }

            return done(null, { code: '200' });
            */
        } catch (err) {
            console.log(err);
            return done(null, { code: '500', error: err });
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.deleteAnswerFile = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);;
            result = await conn.execute(queryConfig.batchLearningConfig.deleteAnswerFile, [req[1], req[0]]);

            return done(null, { code: '200' });
        } catch (err) {
            return done(null, { code: '500', error: err });
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectDocCategoryFilePath = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(queryConfig.batchLearningConfig.selectDocCategoryFilePath, [req]);

            return done(null, result);
        } catch (err) {
            return done(null, { code: '500', error: err });
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectClassificationSt = function (data, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(`SELECT OCRDATA FROM TBL_BATCH_OCR_DATA WHERE FILEPATH LIKE '%` + data[0] + `'`);

            return done(null, result);
        } catch (err) {
            return done(null, { code: '500', error: err });
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertBannedWord = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            let selectTypo = `SELECT SEQNUM FROM TBL_BANNED_WORD WHERE WORD = LOWER(:word) `;
            let insertTypo = `INSERT INTO TBL_BANNED_WORD(SEQNUM, WORD, REGDATE) VALUES (seq_banned_word.nextval, LOWER(:word), SYSDATE) `;
            conn = await oracledb.getConnection(dbConfig);
            var reqArr = req.text;
            var result;
            //var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;

            result = await conn.execute(selectTypo, [reqArr]);
            if (result.rows.length == 0 && reqArr) {
                await conn.execute(insertTypo, [reqArr]);
                conn.commit();
            }

            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            console.log(err);
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectOriginSid = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let sqltext = `SELECT EXPORT_SENTENCE_SID(LOWER(:COND)) SID FROM DUAL`;
            //let sqltext = `SELECT EXPORT_SENTENCE_SID(LOWER(:COND)) SID FROM DUAL`;
            var sid = "";

            var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
            let result = await conn.execute(sqltext, [req.text.replace(regExp, '')]);
            if (result.rows[0] != null) {
                return done(null, result.rows[0].SID);
            } else {
                return done(null, null);
            }
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertDocCategory = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);

            result = await conn.execute('SELECT DOCTYPE FROM tbl_document_category WHERE DOCNAME = :docName AND SAMPLEIMAGEPATH = :sampleImagePath', [req[0], req[1]]);
            if (result.rows.length == 0) {
                result = await conn.execute('SELECT MAX(docType) + 1 AS docType FROM tbl_document_category');
                await conn.execute(`INSERT INTO
                                    tbl_document_category
                                 VALUES
                                    (seq_document_category.nextval, :docName, :docType, :sampleImagePath) `,
                    [req[0], result.rows[0].DOCTYPE, req[1]]);
                conn.commit();
            }

            return done(null, result.rows[0].DOCTYPE);
        } catch (err) { // catches errors in getConnection and the query
            return done(null, err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertFormMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(`SELECT SEQNUM FROM TBL_FORM_MAPPING WHERE DATA = :data AND CLASS = :class `, req);
            if (result.rows.length == 0) {
                await conn.execute(`INSERT INTO
                                    TBL_FORM_MAPPING
                                 VALUES
                                    (seq_form_mapping.nextval, :data, :class, sysdate) `, req);
            }

            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertNotInvoce = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(`SELECT SEQNUM FROM TBL_NOTINVOICE_DATA WHERE DATA = LOWER(:data) AND DOCTYPE = :doctype `, req);
            if (result.rows.length == 0) {
                await conn.execute(`INSERT INTO
                                        TBL_NOTINVOICE_DATA
                                    VALUES
                                        (seq_notinvoice_data.nextval, LOWER(:data), :doctype, sysdate) `,
                                req);
            }

            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectDocument = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(`SELECT SEQNUM, DOCNUM, PAGECNT, STATUS, NOWNUM, DEADLINE FROM TBL_APPROVAL_MASTER WHERE DOCNUM IN ( ` + req + `)`);
            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }
            
        } catch (err) { // catches errors in getConnection and the query
            console.log('oracle.js error');
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectMaxDocNum = function (done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute('SELECT NVL(MAX(DOCNUM),0) AS MAXDOCNUM FROM TBL_APPROVAL_MASTER');
            return done(null, result.rows[0].MAXDOCNUM);

        } catch (err) { // catches errors in getConnection and the query
            console.log('oracle.js error');
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

//내 결재 - 반려(중간결재자)
exports.cancelDocument = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            await conn.execute("UPDATE TBL_APPROVAL_MASTER SET STATUS ='04', " + req[0] + ", MEMO = '"+ req[1] + "' WHERE DOCNUM = '"+ req[2]+ "'");
            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};


//문서 기본정보 / 인식결과 전달
exports.sendApprovalDocument = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            await conn.execute("UPDATE TBL_APPROVAL_MASTER SET DRAFTERNUM = :draftNum, MIDDLENUM = :middleNum, NOWNUM = :nowNum, STATUS = '02', DRAFTDATE = to_date(:draftdate, 'YYYY-MM-DD HH24:MI:SS'), MEMO = :memo WHERE DOCNUM = :docNum ", req);
            //result = await conn.execute("SELECT DRAFTDATE FROM TBL_APPROVAL_MASTER WHERE DOCNUM = :docNum ", [req[3]]);
            //return done(null, result.rows[0].DRAFTDATE);
            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

//부서코드 찾기
exports.selectDeptCode = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute("SELECT DEPT_CD FROM TBL_CO_DEPT_BS WHERE DEPT_NM = :DEPT_NM", req);
            return done(null, result.rows);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

//결재리스트(기본) C -> D 전달
exports.sendApprovalDocumentCtoD = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            await conn.execute("UPDATE TBL_APPROVAL_MASTER SET FINALNUM = :finalnum, NOWNUM = :nowNum, STATUS = '02', MEMO = :memo WHERE DOCNUM = :docNum ", req);
            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

//문서 기본정보 전달
exports.sendDocument = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            await conn.execute("UPDATE TBL_APPROVAL_MASTER SET ICRNUM = :icrNum, NOWNUM = :nowNum, DEADLINE = :deadline, MEMO = :memo WHERE DOCNUM = :docNum ", req);
            return done;
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

//결재리스트 (상세)
exports.searchApprovalDtlList = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(` SELECT * FROM TBL_DOCUMENT_DTL WHERE STATUS = 'Y' AND DOCNUM = :docNum`, req);
            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

//결재리스트 (상세 이미지)
exports.searchApprovalImageList = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute( "SELECT * FROM TBL_OCR_FILE_DTL WHERE IMGID = "+"'"+ req[0]+"'");
            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

//문서 기본정보 삭제
exports.deleteDocument = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            await conn.execute("UPDATE TBL_APPROVAL_MASTER SET STATUS ='06' WHERE DOCNUM = '" + req + "'");
            return done;
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertDocument = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            await conn.execute(`INSERT INTO
                                    TBL_APPROVAL_MASTER(SEQNUM, DOCNUM, STATUS, PAGECNT, FILENAME, FILEPATH, UPLOADNUM, NOWNUM, DEADLINE )
                                VALUES
                                    (SEQ_DOCUMENT.NEXTVAL, :docNum, 'ZZ', :pageCnt, :fileName, :filePath, :uploadNum, :nowNum, TO_CHAR(SYSDATE, 'YYYYMM')) `, [req[0][0].imgId, req[1], req[0][0].oriFileName, req[0][0].filePath, req[0][0].regId, req[0][0].regId]);
            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertDocumentSentence = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(`SELECT SEQNUM FROM TBL_DOCUMENT_SENTENCE WHERE DATA = LOWER(:data) AND DOCTYPE = :doctype AND SENTENCELENGTH = :length`, req);
            if (result.rows.length == 0) {
                await conn.execute(`INSERT INTO
                                        TBL_DOCUMENT_SENTENCE
                                    VALUES
                                        (seq_document_sentence.nextval, LOWER(:data), :doctype, sysdate, :length) `,
                    req);
            }

            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectDocCategoryFromDocName = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);

            result = await conn.execute(`SELECT DOCTYPE FROM TBL_DOCUMENT_CATEGORY WHERE DOCNAME = :docName `, req);
            if (result.rows.length > 0) {
                return done(null, result.rows[0].DOCTYPE);
            } else {
                return done(null, 0);
            }

            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            return done(null, err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.updateBatchLearnList = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);

            await conn.execute(`UPDATE TBL_BATCH_LEARN_LIST SET STATUS = 'D', DOCTYPE = :docType WHERE IMGID = :imgId AND FILEPATH = :filepath `, req);
            conn.commit();

            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            return done(null, err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.updateDocCategoryToFilePath = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);

            await conn.execute(`UPDATE TBL_DOCUMENT_CATEGORY SET SAMPLEIMAGEPATH = :filepath WHERE DOCTYPE = :docType `, req);
            conn.commit();

            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            return done(null, err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectBannedWord = function (done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);

            result = await conn.execute(`SELECT WORD FROM TBL_BANNED_WORD`);
            conn.commit();

            return done(null, result.rows);
        } catch (err) { // catches errors in getConnection and the query
            return done(null, err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertOcrFileDtl = function (data, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            var insertSql = queryConfig.commonConfig.insertFileDtlInfo;
            conn = await oracledb.getConnection(dbConfig);

            for (var i in data) {
                var param = [];
                param.push(data[i].imgId);
                param.push(data[i].filePath);
                param.push(data[i].oriFileName);
                param.push(data[i].svrFileName);
                param.push(data[i].fileExt);
                param.push(data[i].fileSize);
                param.push(data[i].contentType);
                param.push("");
                param.push("");

                result = await conn.execute(insertSql, param);
            }

            conn.commit();

            return done(null, result.rows);
        } catch (err) { // catches errors in getConnection and the query
            return done(null, err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectOcrFileDtl = function (imgId, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute('SELECT * FROM TBL_OCR_FILE_DTL WHERE IMGID = :imgId', [imgId]);
            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }

        } catch (err) { // catches errors in getConnection and the query
            console.log('oracle.js error');
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectApprovalMasterFromDocNum = function (docNum, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute('SELECT * FROM TBL_APPROVAL_MASTER WHERE DOCNUM = :docNum', [docNum]);
            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }

        } catch (err) { // catches errors in getConnection and the query
            console.log('oracle.js error');
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.updateApprovalMaster = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            var targetCol;
            var initNum = '';
            if (req[0] == 'icrApproval') {
                targetCol = 'UPLOADNUM';
                initNum = ', ICRNUM = NULL';
            } else if (req[0] == 'middleApproval') {
                targetCol = 'ICRNUM';
            } else if (req[0] == 'lastApproval') {
                targetCol = 'MIDDLENUM';
            } else {

            }
            for (var i in req[1]) {
                await conn.execute('UPDATE TBL_APPROVAL_MASTER SET NOWNUM = (SELECT ' + targetCol + ' FROM TBL_APPROVAL_MASTER WHERE DOCNUM = :docNum ), MEMO = :memo' + initNum + ' WHERE DOCNUM = :docNum', [req[1][i], req[2][i]]);
            }          
            return done(null, null);
        } catch (err) { // catches errors in getConnection and the query
            console.log('oracle.js error');
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectApprovalDtl = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute('SELECT * FROM TBL_APPROVAL_DTL WHERE DOCNUM = :docNum', [req]);
            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }
        } catch (err) {
            reject(err);
        } finally {

        }
    });
};

// req = [문서번호, 결재상태코드, 결제사원번호(현재유저), 결재일시, 결재의견, 다음결재사원번호(다음유저)];
// 파라미터 중 없는 것들은 null로 작성, 순서 지킬 것!
exports.approvalDtlProcess = function (req, token, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        let approvalSql;
        var approvalDtls;
        try {
            conn = await oracledb.getConnection(dbConfig);
            for (var i in req) {
                var docNum = req[i].docNum ? req[i].docNum : '';
                var status = req[i].status ? req[i].status : null;
                var approvalNum = req[i].approvalNum ? req[i].approvalNum : null;
                var approvalDate = req[i].approvalDate ? req[i].approvalDate : null;
                var approvalComment = req[i].approvalComment ? req[i].approvalComment : null;
                var nextApprovalNum = ((req[i].nextApprovalNum ? req[i].nextApprovalNum : null) == '03') ? '' : req[i].nextApprovalNum;

                // 해당 문서번호 순번 채번
                approvalSql = 'SELECT NVL(MAX(SEQNUM) + 1,1) AS SEQNUM FROM TBL_APPROVAL_DTL WHERE DOCNUM = :docNum';
                result = await conn.execute(approvalSql, [docNum]);
                var insertSeqNum = result.rows[0].SEQNUM;

                // 이전 순번 디테일 테이블 결재상태코드 03 변환
                if (insertSeqNum != 1) {
                    approvalSql = 'UPDATE TBL_APPROVAL_DTL SET STATUS = :status WHERE DOCNUM = :docNum AND SEQNUM = :seqNum';
                    await conn.execute(approvalSql, ['03', docNum, insertSeqNum - 1]);
                }
                
                var dateQuery;
                var params;
                if (approvalDate) {
                    dateQuery = ':approvalDate';
                    params = [docNum, insertSeqNum, status, approvalNum, approvalDate, approvalComment, nextApprovalNum];
                } else {
                    dateQuery = 'sysdate';
                    params = [docNum, insertSeqNum, status, approvalNum, approvalComment, nextApprovalNum];
                }
                approvalSql = 'INSERT INTO TBL_APPROVAL_DTL VALUES (:docNum, :seqNum, :status, :approvalNum, ' +
                    dateQuery + ', :approvalComment, :nextApprovalNum)';
                await conn.execute(approvalSql, params);

                /*
                //기간계 IF-2
                result = await conn.execute('SELECT * FROM TBL_APPROVAL_DTL WHERE DOCNUM = :docNum', [docNum]);
                if (result.rows.length > 0) {
                    approvalDtls = result.rows;
                } else {
                    approvalDtls = [];
                }

                var dtlXml = '';
                for (var i in approvalDtls) {
                    dtlXml +=
                        '<Row>' +
                    '<Col id="imgId">' + approvalDtls[i].DOCNUM + '</Col>' +
                    '<Col id="apvrSno">' + approvalDtls[i].SEQNUM + '</Col>' +
                    '<Col id="aprStatCd">' + approvalDtls[i].STATUS + '</Col>' +
                    '<Col id="apvrEmpNo">' + approvalDtls[i].APPROVALNUM + '</Col>' +
                        '<Col id="aprDt"></Col>';//'<Col id="aprDt">' + approvalDtls[i].APPROVALDATE + '</Col>';
                    if (approvalDtls[i].STATUS == '04') {
                        dtlXml +=
                            '<Col id="aprOpnn">' + data[i].APPROVALCOMMENT ? data[i].APPROVALCOMMENT.replace(/ /gi, '&#32;') : '' + '</Col>';
                    }
                    dtlXml +=
                        '<Col id="aftApvrEmpNo">' + approvalDtls[i].NEXTAPPROVALNUM + '</Col>' +
                        '</Row>';
                }

                var data =
                    '<?xml version="1.0" encoding="utf-8"?>' +
                    '<Root>' +
                    '<Parameters>' +
                    '<Parameter id="gv_encryptToken" type="STRING">' + token + '</Parameter>' +
                    '<Parameter id="WMONID" type="STRING">NXrGufbtBrq</Parameter>' +
                    '<Parameter id="lginIpAdr" type="STRING" />' +
                    '<Parameter id="userId" type="STRING">2011813</Parameter>' +
                    '<Parameter id="userEmpNo" type="STRING">2011813</Parameter>' +
                    '<Parameter id="userDeptCd" type="STRING">240050</Parameter>' +
                    '<Parameter id="frstRqseDttm" type="STRING">20181015210404674</Parameter>' +
                    '<Parameter id="rqseDttm" type="STRING">20181015210404674</Parameter>' +
                    '<Parameter id="lngeClsfCd" type="STRING">ko-kr</Parameter>' +
                    '<Parameter id="srnId" type="STRING">CTCTM107</Parameter>' +
                    '<Parameter id="rqseSrvcNm" type="STRING">koreanre.co.co.aprco.svc.CoAprSvc</Parameter>' +
                    '<Parameter id="rqseMthdNm" type="STRING">saveAprInfoForIcr</Parameter>' +
                    '<Parameter id="rqseVoNm" type="STRING">koreanre.co.co.aprco.vo.CoAprVo</Parameter>' +
                    '</Parameters>' +
                    '<Dataset id="coAprMngnIfDcDVoList">' +
                    '<ColumnInfo>' +
                    '<Column id="imgId" type="STRING" size="18" />' +
                    '<Column id="aprPrgStatCd" type="STRING" size="2" />' +
                    '<Column id="drftEmpNo" type="STRING" size="7" />' +
                    '<Column id="drfDt" type="DATE" size="0" />' +
                    '<Column id="prinEmpNo" type="STRING" size="7" />' +
                    '<Column id="fnlApvrEmpNo" type="STRING" size="7" />' +
                    '<Column id="fnlAprlDt" type="DATE" size="0" />' +
                    '</ColumnInfo>' +
                    '<Rows>' +
                    '<Row>' +
                    '<Col id="imgId">' + docNum + '</Col>' +
                    '<Col id="aprPrgStatCd">' + status + '</Col>' +
                    '<Col id="drftEmpNo">' + approvalNum + '</Col>' +
                    '<Col id="drfDt">' + ' ' + '</Col>' +
                    '<Col id="prinEmpNo">' + nextApprovalNum + '</Col>' +
                    '</Row>' +
                    '</Rows>' +
                    '</Dataset>' +
                    '<Dataset id="coApvrDcDVoList">' +
                    '<ColumnInfo>' +
                    '<Column id="imgId" type="STRING" size="18" />' +
                    '<Column id="apvrSno" type="INT" size="9" />' +
                    '<Column id="aprStatCd" type="STRING" size="2" />' +
                    '<Column id="apvrEmpNo" type="STRING" size="7" />' +
                    '<Column id="aprDt" type="DATE" size="0" />' +
                    '<Column id="aprOpnn" type="STRING" size="4000" />' +
                    '<Column id="aftApvrEmpNo" type="STRING" size="7" />' +
                    '</ColumnInfo>' +
                    '<Rows>' + dtlXml + '</Rows>' +
                    '</Dataset>' +
                    '</Root>';
                
                var res1 = request('POST', 'http://solomondev.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', {
                    headers: {
                        'content-type': 'text/xml'
                    },
                    body: data
                });
                
                console.log('IF-2 기간계 status code : ' + res1.statusCode);
                */
            }
        } catch (err) {
            console.log(err);
            reject(err);
        } finally {
            return done(null, null);
            //return done(null, res1.statusCode);
        }
    });
};

exports.insertDocumentDtl = function (mlData, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        
        try {
            conn = await oracledb.getConnection(dbConfig);

            var insertDocumentDtlSql = queryConfig.invoiceRegistrationConfig.insertDocumentDtl;
            var deleteDocumentDtlSql = queryConfig.invoiceRegistrationConfig.deleteDocumentDtl;

            await conn.execute(deleteDocumentDtlSql, [mlData.mlDocNum]);

            for (var i = 0; i < mlData.mlExportData.length; i++) {
                mlData.mlExportData[i].push(mlData.mlDocNum);
                await conn.execute(insertDocumentDtlSql, mlData.mlExportData[i]);
            }

        } catch (err) {
            reject(err);
        } finally {
            return done(null, null);
        }
    });
};

exports.rollbackTrain = function (date, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);

            var delFormMappingSql = "DELETE FROM TBL_FORM_MAPPING WHERE REGDATE BETWEEN TO_DATE(" + date + " || ' 00:00:00','YYYY-MM-DD HH24:MI:SS') AND SYSDATE";
            var delColumnMappingSql = "DELETE FROM TBL_BATCH_COLUMN_MAPPING_TRAIN WHERE REGDATE BETWEEN TO_DATE(" + date + " || ' 00:00:00','YYYY-MM-DD HH24:MI:SS') AND SYSDATE";
            var delDocumentSentenceSql = "DELETE FROM TBL_DOCUMENT_SENTENCE WHERE REGDATE BETWEEN TO_DATE(" + date + " || ' 00:00:00','YYYY-MM-DD HH24:MI:SS') AND SYSDATE";
            var delBannedWordSql = "DELETE FROM TBL_BANNED_WORD WHERE REGDATE BETWEEN TO_DATE(" + date + " || ' 00:00:00','YYYY-MM-DD HH24:MI:SS') AND SYSDATE";
            //var delDocumentCategorySql = "DELTE FROM TBL_DOCUMENT_CATEGORY WHERE REGDATE BETWEEN TO_DATE(" + date + " || ' 00:00:00','YYYY-MM-DD HH24:MI:SS') AND SYSDATE";

            await conn.execute(delFormMappingSql);
            await conn.execute(delColumnMappingSql);
            await conn.execute(delDocumentSentenceSql);
            await conn.execute(delBannedWordSql);
            //await conn.execute(delDocumentCategorySql);

        } catch (err) {
            reject(err);
        } finally {
            return done(null, null);
        }
    });
};

exports.selectFormMapping = function (done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            var selFormMappingSql = "SELECT DATA, CLASS FROM TBL_FORM_MAPPING";
            result = await conn.execute(selFormMappingSql);
        } catch (err) {
            reject(err);
        } finally {
            return done(null, result);
        }
    });
};

exports.selectColumnMapping = function (done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            var selColumnMappingSql = "SELECT DATA, CLASS FROM TBL_BATCH_COLUMN_MAPPING_TRAIN";
            result = await conn.execute(selColumnMappingSql);
        } catch (err) {
            reject(err);
        } finally {
            return done(null, result);
        }
    });
};

/*
exports.convertMs = function (data, done) {
    return new Promise(async function (resolve, reject) {
        try {
            convertMsToPdf(data, function (ret) {
                return done(null, ret);
            });
        } catch (err) { // catches errors in getConnection and the query
            return done(null, err);
        } finally {

        }
    });
};

function convertMsToPdf(data, callback) {

    msopdf(data, function (error, office) {
        var retPdf = '';

        if (error) {
            console.log("Init failed", error);
            return;
        }

        if (data[0] == "word") {
            office.word({ input: data[1], output: data[2] }, function (error, pdf) {
                if (error) {
                    console.log("Woops", error);
                } else {
                    console.log("Saved to", pdf);
                    retPdf = pdf;
                }
            });
        } else if (data[0] == "excel") {
            office.excel({ input: data[1], output: data[2] }, function (error, pdf) {
                if (error) {
                    console.log("Woops", error);
                } else {
                    console.log("Saved to", pdf);
                    retPdf = pdf;
                }
            });
        }

        office.close(null, function (error) {
            if (error) {
                console.log("Woops", error);
            } else {
                console.log("Finished & closed");
                callback(retPdf);
            }
        });
    });
}
*/

//결재리스트(기본) D 승인
exports.finalApproval = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        var dateArr = [];
        try {
            conn = await oracledb.getConnection(dbConfig);
            let arrDocInfo = req.body.param.arrDocInfo;

            for (let i = 0; i < arrDocInfo.length; i++) {
                await conn.execute(`UPDATE TBL_APPROVAL_MASTER SET FINALAPPROVAL = '${arrDocInfo[i].finalApproval}', NOWNUM = '', STATUS = '03', FINALDATE = sysdate WHERE DOCNUM = '${arrDocInfo[i].docNum}'`);
                result = await conn.execute('SELECT FINALDATE FROM TBL_APPROVAL_MASTER WHERE DOCNUM = :docNum', [arrDocInfo[i].docNum]);
                if (result.rows.length > 0) {
                    dateArr.push(result.rows[0].FINALDATE);
                } else {
                    dateArr.push(null);
                }
            }
            return done(null, dateArr);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

// 부서 조회
exports.searchDept = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);

            let deptQuery =
                "SELECT DEPT_NM, DEPT_CD, 1 as ORDERNUM FROM TBL_CO_DEPT_BS_EXT " +
                "UNION " +
                "SELECT DEPT_NM, DEPT_CD, 2 as ORDERNUM FROM TBL_CO_DEPT_BS " + 
                "ORDER BY ORDERNUM, DEPT_NM";           
            let deptResult = await conn.execute(deptQuery, []);

            result = {
                dept: deptResult.rows
            };
            return done(null, result);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

// 사용자 찾기
exports.searchUser = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            let dept = req.body.dept;
            let scan = req.body.scan;
            let icr = req.body.icr;
            let approval = req.body.approval;
            let finalApproval = req.body.finalApproval;
            let admin = req.body.admin;

            conn = await oracledb.getConnection(dbConfig);
            var userQuery = 
                "SELECT " +
                "    CO_EMP.EMP_NO, CO_EMP.EMP_NM, CO_EMP.EMP_PW, CO_EMP.DEPT_NM,CO_REG.AUTH_SCAN, CO_REG.AUTH_ICR, CO_REG.AUTH_APPROVAL, EXT_USER, " + 
                "    CO_REG.AUTH_FINAL_APPROVAL, CO_REG.AUTH_ADMIN, EMP_NEXT.NEXT_EMP_NO AS NEXT_EMP_NO, TO_CHAR(CO_REG.FINAL_LOGIN_DATE, 'YYYY/MM/DD HH24:MI:SS') AS FINAL_LOGIN_DATE " +
                "FROM (SELECT " + 
                "           CO_EMP.EMP_NO, NULL AS EMP_PW, EMP_NM, EMP_ENGL_NM, BLT_DEPT_CD, JBLV_CD, PSTN_CD, DEPT_NM, 'N' AS EXT_USER " +
                "        FROM " +
                "            TBL_CO_EMP_BS CO_EMP " +
                "        LEFT JOIN TBL_CO_DEPT_BS CO_DEPT " +
                "        ON " +
                "            CO_EMP.BLT_DEPT_CD = CO_DEPT.DEPT_CD " +
                "        UNION ALL " +
                "        SELECT " +
                "            EMP_NO, EMP_PW, EMP_NM, EMP_ENGL_NM, BLT_DEPT_CD, JBLV_CD, PSTN_CD, DEPT_NM, 'Y' AS EXT_USER " +
                "        FROM " +
                "            TBL_CO_EMP_BS_EXT CO_EXT " +
                "        LEFT JOIN " +
                "            TBL_CO_DEPT_BS_EXT CO_DEPT_EXT " +
                "        ON " +
                "            CO_EXT.BLT_DEPT_CD = CO_DEPT_EXT.DEPT_CD) " +
                "        CO_EMP " +
                "LEFT JOIN " +
                "    TBL_CO_EMP_REG CO_REG " +
                "ON " +
                "    CO_EMP.EMP_NO = CO_REG.EMP_NO " +
                "LEFT OUTER JOIN " +
                "   TBL_CO_EMP_NEXTAPPROVAL EMP_NEXT " +
                "ON " +
                "   CO_EMP.EMP_NO = EMP_NEXT.EMP_NO " +
                "WHERE 1=1 " +
                "AND ACCOUNT_ENABLE ='Y'"

            if (!req.body.type) {
                if (dept != '모든부서') {
                    userQuery += " AND CO_EMP.DEPT_NM = '" + dept + "'";
                }
                var auths = [scan, icr, approval, finalApproval, admin];
                var authColumns = ['CO_REG.AUTH_SCAN', 'CO_REG.AUTH_ICR', 'CO_REG.AUTH_APPROVAL', 'CO_REG.AUTH_FINAL_APPROVAL',
                    'CO_REG.AUTH_ADMIN'];
                var authCnt = 0;
                for (var i in auths) {
                    if (auths[i] == 'Y') {
                        authCnt++;
                        if (authCnt == 1) {
                            userQuery += " AND (" + authColumns[i] + " = '" + auths[i] + "'";
                        } else {
                            userQuery += " OR " + authColumns[i] + " = '" + auths[i] + "'";
                        }
                    }
                }
                if (authCnt > 0) userQuery += ' )';
            }

            userQuery += "ORDER BY EXT_USER, DEPT_NM, EMP_NM";
            result = await conn.execute(userQuery);
            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }
            
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

// 사용자 삭제
exports.deleteUser = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            //console.log(req);
            let empNo = req.body.empNo;

            conn = await oracledb.getConnection(dbConfig);

            var empQuery = "UPDATE TBL_CO_EMP_REG SET ACCOUNT_ENABLE = 'N' WHERE EMP_NO = '" + empNo + "'";

            await conn.execute(empQuery, []);

            return done(null, req);
        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectInvoiceProcessingStatus = function (done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let selectQuery = 'SELECT * FROM TBL_INVOICE_PROCESSING_STATUS';
            result = await conn.execute(selectQuery);
            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.countingStatistics = function (type, userId, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        let query;
        var targetColumn;

        try {
            conn = await oracledb.getConnection(dbConfig);
            var now = getConvertYYYYMMDD();
            if (type != 'retrain') {
                query = 'SELECT * FROM TBL_INVOICE_PROCESSING_STATUS WHERE YEARMONTHDAY = :yearMonthDay AND EMP_NO = :userId';
                result = await conn.execute(query, [now, userId]);

                if (type == 'line') {
                    targetColumn = 'INVOICEPROCESSINGCOUNT';
                } else if (type == 'bar') {
                    targetColumn = 'OCRCOUNT';
                }

                if (result.rows.length > 0) {
                    query = 'UPDATE TBL_INVOICE_PROCESSING_STATUS SET ' + targetColumn + ' = ' + targetColumn + ' + 1 WHERE YEARMONTHDAY = :yearMonthDay AND EMP_NO = :userId';
                } else {
                    query = 'INSERT INTO TBL_INVOICE_PROCESSING_STATUS(YEARMONTHDAY, EMP_NO, ' + targetColumn + ') VALUES (:yyyymmdd, :userId, 1)';
                }
            } else {
                targetColumn = 'RETRAINCOUNT';
                query = 'UPDATE TBL_INVOICE_PROCESSING_STATUS SET ' + targetColumn + ' = ' + targetColumn + ' + 1 WHERE YEARMONTHDAY = :yearMonthDay AND EMP_NO = :userId';
            }

            await conn.execute(query, [now, userId]);


            return done(null, null);
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectDocumentCount = function (done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let selectQuery = '' +
            'SELECT ' +
                'A.UPLOADNUM, COUNT(A.UPLOADNUM) AS DOCUMENTCOUNT, ' +
                '(SELECT COUNT(B.SEQNUM) FROM TBL_APPROVAL_MASTER B WHERE B.NOWNUM IS NULL AND B.UPLOADNUM = A.UPLOADNUM) AS SUCCESSCOUNT ' +
            'FROM ' +
                'TBL_APPROVAL_MASTER A ' +
            'WHERE ' +
                'A.UPLOADNUM IS NOT NULL ' +
            'GROUP BY ' +
                'A.UPLOADNUM ';
            result = await conn.execute(selectQuery);

            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.selectOgCompanyStatus = function (done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let selectQuery = '' +
                'SELECT ' +
                    '* ' +
                'FROM ' +
                    '(SELECT ' +
                        '* ' +
                    'FROM ' +
                        'TBL_INVOICE_OGCOMPANY_STATUS ' +
                    'ORDER BY OGCCOUNT DESC) ' +
                'WHERE ' +
                    'rownum <= 3';
            result = await conn.execute(selectQuery);
            if (result.rows.length > 0) {
                return done(null, result.rows);
            } else {
                return done(null, []);
            }
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.insertOgCompanyStatus = function (ogcn, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let query = 'SELECT * FROM TBL_INVOICE_OGCOMPANY_STATUS WHERE OGCOMPANYNAME = :ogcn';
            result = await conn.execute(query, [ogcn]);
            if (result.rows.length > 0) {
                query = 'UPDATE TBL_INVOICE_OGCOMPANY_STATUS SET OGCCOUNT=OGCCOUNT+1 WHERE OGCOMPANYNAME = :ogcn';
            } else {
                query = 'INSERT INTO TBL_INVOICE_OGCOMPANY_STATUS(OGCOMPANYNAME, OGCCOUNT) VALUES (:ogcn,1)';
            }
            await conn.execute(query, [ogcn]);

            return done(null, null);
        } catch (err) {
            reject(err);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

exports.nextApprovalSearch = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let query = 'SELECT NEXT_EMP_NM FROM TBL_CO_EMP_NEXTAPPROVAL WHERE EMP_NO = :empNo';
            result = await conn.execute(query, [req]);
            

            return done(null, result);
        } catch (err) {
            reject(err);
            return done(null, null);
        } finally {
            if (conn) {   // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
};

function getConvertDate() {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = (today.getMonth() + 1 < 10) ? '0' + (today.getMonth() + 1) : today.getMonth() + 1;
    var dd = today.getDate();
    var hh = (today.getHours() < 10) ? '0' + today.getHours() : today.getHours();
    var minute = (today.getMinutes() < 10) ? '0' + today.getMinutes() : today.getMinutes();
    var ss = (today.getSeconds() < 10) ? '0' + today.getSeconds() : today.getSeconds();
    var mss = (today.getMilliseconds() < 100) ? ((today.getMilliseconds() < 10) ? '00' + today.getMilliseconds() : '0' + today.getMilliseconds()) : today.getMilliseconds();

    return '' + yyyy + mm + dd + hh + minute + ss + mss;
}


function getConvertYYYYMMDD() {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = (today.getMonth() + 1 < 10) ? '0' + (today.getMonth() + 1) : today.getMonth() + 1;
    var dd = (today.getDate() < 10) ? '0' + (today.getDate()) : today.getDate();

    return yyyy + '-' + mm + '-' + dd;
}