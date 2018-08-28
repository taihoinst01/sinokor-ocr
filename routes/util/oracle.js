var oracledb = require('oracledb');
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
var queryConfig = require(appRoot + '/config/queryConfig');
var execSync = require('child_process').execSync;
var fs = require('fs');
var propertiesConfig = require(appRoot + '/config/propertiesConfig.js');
var commonUtil = require(appRoot + '/public/js/common.util.js');
var request = require('sync-request');
var sync = require('./sync.js');


exports.select = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);
            let sqltext = `SELECT EXPORT_SENTENCE_SID(:COND) SID FROM DUAL`;
            for (var i in req) {
                var sid = "";
                locSplit = req[i].location.split(",");
                sid += locSplit[0] + "," + locSplit[1];

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

            /*
            var userModifyData = [];

            if (req.mlDocCategory != null && req.mlDocCategory[0].DOCTYPE != req.docCategory[0].DOCTYPE) {
                userModifyData.push(req.docCategory);
            }
            */

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
            let selectSqlText = `SELECT SEQNUM FROM TBL_COLUMN_MAPPING_TRAIN WHERE DATA = :DATA`;
            let insertSqlText = `INSERT INTO TBL_COLUMN_MAPPING_TRAIN (SEQNUM, DATA, CLASS, REGDATE) VALUES (SEQ_COLUMN_MAPPING_TRAIN.NEXTVAL,:DATA,:CLASS,SYSDATE)`;
            let updateSqlText = `UPDATE TBL_COLUMN_MAPPING_TRAIN SET DATA = :DATA, CLASS = :CALSS, REGDATE = SYSDATE WHERE SEQNUM = :SEQNUM`;
            fullData = '0,'
            if (req.docCategory[0]) {
                fullData = req.docCategory[0].DOCTYPE + ',';
            }
            for (var i in req.data) {
                var docTypeAndSid = fullData + req.data[i].sid;

                var result = await conn.execute(selectSqlText, [docTypeAndSid]);
                if (result.rows[0]) {
                    await conn.execute(updateSqlText, [docTypeAndSid, req.data[i].colLbl, result.rows[0].SEQNUM]);
                } else {
                    await conn.execute(insertSqlText, [docTypeAndSid, req.data[i].colLbl]);
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
        try {
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

                let resAnswerData = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :imgId AND IMGFILESTARTNO = :imgStartNo`, [imgId, imgStartNo]);

                for (var row = 0; row < resAnswerData.rows.length; row++) {
                    resAnswerData.rows[row].FILEPATH = filepath;
                    resAnswerData.rows[row].FILENAME = filename;
                }

                res.push(resAnswerData);
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
        var resJson = JSON.parse(res.getBody('utf8'));
        pharsedOcrJson = ocrJson(resJson.regions);

        return done(null, pharsedOcrJson);
    } catch (err) {
        console.log(err);
        return done(null, 'error');
    } finally {

    }
};

function ocrJson(regions) {
    var data = [];
    for (var i = 0; i < regions.length; i++) {
        for (var j = 0; j < regions[i].lines.length; j++) {
            var item = '';
            for (var k = 0; k < regions[i].lines[j].words.length; k++) {
                item += regions[i].lines[j].words[k].text + ' ';
            }
            data.push({ 'location': regions[i].lines[j].boundingBox, 'text': item.trim() });
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

            let resCol = await conn.execute("SELECT * FROM TBL_COLUMN_MAPPING_CLS");

            insSql = queryConfig.batchLearningConfig.insertMlExport;
            delSql = queryConfig.batchLearningConfig.deleteMlExport;

            let delRes = await conn.execute(delSql, [req.filepath]);

            for (var i = 0; i < req.mlData[0].length; i++) {
                var cond = [];
                cond.push(req.imgId);
                cond.push(req.filepath);

                for (var row = 0; row < resCol.rows.length; row++) {
                    if (req.mlData[0][i].label == resCol.rows[row].COLTYPE) {
                        cond.push(resCol.rows[row].COLNUM);
                    }
                }

                cond.push(req.mlData[0][i].text);
                cond.push(req.mlData[0][i].location);
                cond.push(req.mlData[0][i].sid);

                let colData = await conn.execute(insSql, cond);
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

exports.insertContractMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            result = await conn.execute(queryConfig.uiLearningConfig.insertContractMapping2, [req[0], req[1], req[2], req[3]]);

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

                let resAnswerData = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :imgId AND IMGFILESTARTNO = :imgStartNo`, [imgId, imgStartNo]);

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

            var inQuery = "(";
            for (var i in req.data) {
                inQuery += "'" + req.docCategory.DOCTYPE + "," + req.data[i].sid + "',";
            }
            inQuery = inQuery.substring(0, inQuery.length - 1);
            inQuery += ")";
            result = await conn.execute(queryConfig.mlConfig.selectColumnMapping + inQuery);

            if (result.rows.length > 0) {
                for (var i in req.data) {
                    for (var j in result.rows) {
                        var row = result.rows[j];
                        if (req.docCategory.DOCTYPE + "," + req.data[i].sid == row.DATA) {
                            req.data[i].colLbl = row.CLASS;
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
