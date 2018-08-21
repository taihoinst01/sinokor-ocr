var oracledb = require('oracledb');
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
var queryConfig = require(appRoot + '/config/queryConfig');
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

exports.selectOcrFilePaths = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);
            let result = await conn.execute(`SELECT SEQNUM,FILEPATH,ORIGINFILENAME FROM TBL_OCR_FILE WHERE IMGID = :imgId `, [req])

            //resolve(result.rows);
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

exports.insertLabelMapping = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        try {
            conn = await oracledb.getConnection(dbConfig);
            let sqltext = `INSERT INTO TBL_FORM_LABEL_MAPPING (SEQNUM, DATA, CLASS, REGDATE) VALUES (SEQ_FORM_LABEL_MAPPING.NEXTVAL,:DATA,:CLASS,SYSDATE)`;
            var userModifyData = [];
            for (var i in req.data) {
                labelClass = 3
                //출재사명
                if (req.data[i].ColLbl && req.data[i].ColLbl == 0) {
                    labelClass = 1

                    if (req.data[i].oriColLbl != null && req.data[i].ColLbal != req.data[i].oriColLbl) {
                        userModifyData.push(req.data[i]);
                    }
                }
                //계약명
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
                //출재사명
                if (req.data[i].ColLbl && req.data[i].ColLbl == 0) {
                    insCompanyData = req.data[i].sid;
                }
                //계약명
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

exports.selectLegacyData = function (req, done) {
    return new Promise(async function (resolve, reject) {
        var res = [];
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            var tempImageFileName;
            for (image in req) {
                //image ?뚯씪紐?異붿텧
                var items = req[image]['mlexport']
                for (var item = 0; item < req[image]['mlexport'].length; item++) {
                    if (req[image][item]['ORIGINFILENAME']) {
                        tempImageFileName = req[image][item]['ORIGINFILENAME']
                    }

                }
                //image id 異붿텧
                let result = await conn.execute(`SELECT IMGID, PAGENUM FROM TBL_BATCH_ANSWER_FILE WHERE export_filename(FILEPATH) = :PARAM AND ROWNUM = 1`, [tempImageFileName]);
                result.rows[0][0] = 154384
                //image data 異붿텧
                result = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :IMGID AND IMGFILEENDNO >= :PAGEEND AND IMGFILESTARTNO <= :PAGESTART`, [result.rows[0][0], result.rows[0][1], result.rows[0][1]]);
                image.push(result.rows);
                console.log(result.rows[0][1])

            }



            for (var row = 0; row < result.rows.length; row++) {
                var dict = {};
                for (var colName = 0; colName < colNameArr.length; colName++) {
                    dict[colNameArr[colName]] = result.rows[row][colName];
                }
                res.push(dict);
            }

            //resolve(result.rows);
            return done(null, res);
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
}