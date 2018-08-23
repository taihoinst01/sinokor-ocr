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
        try {
            conn = await oracledb.getConnection(dbConfig);
            let sqltext = queryConfig.mlConfig.selectDocCategory;

            let result = await conn.execute(sqltext, [req[req.length - 1].docType]);

            returnReq.data = req;
            returnReq.data.splice(req.length - 1, 1);           
            if (result.rows[0] != null) {
                returnReq.docCategory = result.rows;
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
            let sqltext = `INSERT INTO TBL_FORM_LABEL_MAPPING (SEQNUM, DATA, CLASS, REGDATE) VALUES (SEQ_FORM_LABEL_MAPPING.NEXTVAL,:DATA,:CLASS,SYSDATE)`;
            var userModifyData = [];
            for (var i in req.data) {
                labelClass = 3
                if (req.data[i].ColLbl && req.data[i].ColLbl == 0) {
                    labelClass = 1

                    if (req.data[i].oriColLbl != null && req.data[i].ColLbal != req.data[i].oriColLbl) {
                        userModifyData.push(req.data[i]);
                    }
                }
                if (req.data[i].ColLbl && req.data[i].ColLbl == 1) {
                    labelClass = 2

                    if (req.data[i].oriColLbl != null && req.data[i].ColLbal != req.data[i].oriColLbl) {
                        userModifyData.push(req.data[i]);
                    }
                }

                await conn.execute(sqltext, [req.data[i].sid, labelClass]);
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
            let sqltext = `INSERT INTO TBL_FORM_MAPPING (SEQNUM, DATA, CLASS, REGDATE) VALUES (SEQ_FORM_MAPPING.NEXTVAL,:DATA,:CLASS,SYSDATE)`;
            insClass = 0;
            insCompanyData = '0,0,0,0,0,0,0';
            insContractData = '0,0,0,0,0,0,0';

            var userModifyData = [];

            if (req.mlDocCategory != null && req.mlDocCategory[0].DOCTYPE != req.docCategory[0].DOCTYPE) {
                userModifyData.push(req.docCategory);
            }

            if (req.docCategory[0]) {
                insClass = req.docCategory[0].DOCTYPE;
            }

            for (var i in req.data) {
                if (req.data[i].ColLbl && req.data[i].ColLbl == 0) {
                    insCompanyData = req.data[i].sid;
                }
                if (req.data[i].ColLbl && req.data[i].ColLbl == 1) {
                    insContractData = req.data[i].sid;
                }
            }

            await conn.execute(sqltext, [insCompanyData + "," + insContractData, insClass]);

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
            let sqltext = `INSERT INTO TBL_COLUMN_MAPPING_TRAIN (SEQNUM, DATA, CLASS, REGDATE) VALUES (SEQ_COLUMN_MAPPING_TRAIN.NEXTVAL,:DATA,:CLASS,SYSDATE)`;
            fullData = '0,'
            if (req.docCategory[0]) {
                fullData = req.docCategory[0].DOCTYPE + ',';
            }
            for (var i in req.data) {
                await conn.execute(sqltext, [fullData + req.data[i].sid, req.data[i].ColLbl]);
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
            //let result = await conn.execute("SELECT SEQNUM,FILEPATH,ORIGINFILENAME FROM TBL_OCR_FILE WHERE IMGID IN (:imgid)", ["10"]);
            let resutl = await conn.execute(`SELECT FILENAME, FILEPATH FROM TBL_BATCH_LEARN_DATA WHERE IMGID = :imgId`, req[0].imgId);

            for (var row = 0; row < result.rows.length; row++) {
                var dict = {};

                //dict.SEQNUM = result.rows[row].SEQNUM;
                dict.FILEPATH = result.rows[row].FILENAME;
                dict.ORIGINFILENAME = result.rows[row].FILEPATH;
                /*
                for (var colName = 0; colName < colNameArr.length; colName++) {
                    dict[colNameArr[colName]] = result.rows[row].colNameArr[colName];
                }
                */
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

exports.convertTiftoJpg = function (originFilePath, done) {
    try {
        convertedFileName = originFilePath.split('.')[0] + '.jpg';
        execSync('module\\imageMagick\\convert.exe -density 800x800 ' + originFilePath + ' ' + convertedFileName);
            
        return done(null, convertedFileName);
    } catch (err) {
        console.log(err);
        return done(null, "err");
    } finally {
        console.log('convertTiftoJpg end');
    }
};

exports.callApiOcr = function (originImageArr, done) {
    var pharsedOcrJson = "";
    try {
        for (item in originImageArr) {
            console.log(originImageArr[item]['FILEPATH'])
            var uploadImage = fs.readFileSync(originImageArr[item]['FILEPATH'], 'binary');
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
        }
        return done(null, pharsedOcrJson);
    } catch (err) {
        console.log(err);
        return done(null, 'error');
    } finally {
        console.log('callApiOcr end');
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
            /*
            for (image in req) {
                var items = req[image]['mlexport']
                for (var item = 0; item < req[image]['mlexport'].length; item++) {
                    if (req[image][item]['ORIGINFILENAME']) {
                        tempImageFileName = req[image][item]['ORIGINFILENAME']
                    }

                }
                let result = await conn.execute(`SELECT IMGID, PAGENUM FROM TBL_BATCH_ANSWER_FILE WHERE export_filename(FILEPATH) = :PARAM AND ROWNUM = 1`, [tempImageFileName]);
                result.rows[0][0] = 154384

                result = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :IMGID AND IMGFILEENDNO >= :PAGEEND AND IMGFILESTARTNO <= :PAGESTART`, [result.rows[0][0], result.rows[0][1], result.rows[0][1]]);
                image.push(result.rows);
                console.log(result.rows[0][1])

            }
            */

            //let result = await conn.execute(`SELECT IMGID, PAGENUM, TOTALCOUNT  FROM TBL_BATCH_ANSWER_FILE WHERE export_filename(FILEPATH) = :PARAM AND ROWNUM = 1`, [tempImageFileName]);
            //let result = await conn.execute(`SELECT IMGID, PAGENUM, TOTALCOUNT  FROM TBL_BATCH_ANSWER_FILE WHERE export_filename(FILEPATH) = :PARAM AND ROWNUM = 1`, ['204d61.tif']);

            //let result = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :IMGID AND IMGFILESTARTNO >= :PAGESTART AND IMGFILEENDNO <= :PAGEEND`, [10, 2, 2]);
            let result = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :IMGID`, [req.imgId]);

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

                let LearnDataRes = await conn.execute("select count(*) as count from tbl_batch_learn_data where imgid = :imgid", [10]);

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
                        'L'
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
                        (parseInt(i) + 1),
                        'L'
                    ];

                    console.log("insert");
                    let insLearnDataRes = await conn.execute(queryConfig.batchLearningConfig.insertBatchLearningData, insArr);
                }

            }

            return done(null, "done legary insert");
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

exports.insertMLData = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            insSql = queryConfig.batchLearningConfig.insertMlExport;
            delSql = queryConfig.batchLearningConfig.deleteMlExport;

            let delRes = await conn.execute(delSql, [req.imgId]);

            for (var i = 0; i < req.mlData.length; i++) {
                var cond = [];
                cond.push(req.imgId);
                cond.push(req.mlData[i].colLbl);
                cond.push(req.mlData[i].text);

                let colData = await conn.execute(insSql, cond);
            }

            return done(null, "mlExport");
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