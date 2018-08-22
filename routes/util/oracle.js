var oracledb = require('oracledb');
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
var queryConfig = require(appRoot + '/config/queryConfig');
var execSync = require('child_process').execSync;
var fs = require('fs');
var propertiesConfig = require(appRoot + '/config/propertiesConfig.js');
var request = require('request');
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
            let result = await conn.execute(`SELECT SEQNUM,FILEPATH,ORIGINFILENAME FROM TBL_OCR_FILE WHERE IMGID IN (${req.map((name, index) => `:${index}`).join(", ")})`, req);
            //let result = await conn.execute("SELECT SEQNUM,FILEPATH,ORIGINFILENAME FROM TBL_OCR_FILE WHERE IMGID IN (:imgid)", [req[0]]);

            for (var row = 0; row < result.rows.length; row++) {
                var dict = {};

                dict.SEQNUM = result.rows[row].SEQNUM;
                dict.FILEPATH = result.rows[row].FILEPATH;
                dict.ORIGINFILENAME = result.rows[row].ORIGINFILENAME;
                /*
                for (var colName = 0; colName < colNameArr.length; colName++) {
                    dict[colNameArr[colName]] = result.rows[row].colNameArr[colName];
                }
                */
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
};

exports.convertTiftoJpg = function (originFilePath, done) {
    try {
        convertedFileName = originFilePath.split('.')[0] + '.jpg';
        execSync('module\\imageMagick\\convert.exe -density 800x800 ' + originFilePath + ' ' + convertedFileName);
        return done(null, convertedFileName);

    } catch (err) {
        console.log(err);
    } finally {
        console.log('end');
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
    } finally {
        console.log('end');
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
            let result = await conn.execute(`SELECT IMGID, PAGENUM, TOTALCOUNT  FROM TBL_BATCH_ANSWER_FILE WHERE export_filename(FILEPATH) = :PARAM AND ROWNUM = 1`, ['204d61.tif']);
            result.rows[0]["IMGID"] = 154384;
            result.rows[0]["PAGENUM"] = 1;
            result.rows[0]["TOTALCOUNT"] = 5;

            result = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :IMGID AND IMGFILESTARTNO >= :PAGESTART AND IMGFILEENDNO <= :PAGEEND`, [result.rows[0]["IMGID"], result.rows[0]["PAGENUM"], result.rows[0]["TOTALCOUNT"]]);
            //image.push(result.rows);
            console.log(result.rows);

            let colData = await conn.execute(`SELECT COLNAME, COLTYPE, COLNUM FROM TBL_COLUMN_MAPPING_CLS`);


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

exports.insertOcrSymspell = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);
            for (var i in req.split(' ')) {
                result = await conn.execute(queryConfig.uiLearningConfig.selectTypo, [req[i]]);

                if (result.rows.length == 0) {
                    result = await conn.execute(queryConfig.uiLearningConfig.insertTypo, [req[i]]);
                } else {
                    result = await conn.execute(queryConfig.uiLearningConfig.updateTypo, [req[i]]);
                }
            }
            var res = { 'code': 200, message: 'insert ocr symspell success' };
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
};