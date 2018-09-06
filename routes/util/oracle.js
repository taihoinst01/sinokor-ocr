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
        let result = await conn.execute(selectContractMapping, req,{outFormat: oracledb.OBJECT},);
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
            if (req.body.addCond == "LEARN_N") condQuery = "(L.STATUS != 'D' OR L.STATUS IS NULL)";
            else if (req.body.addCond == "LEARN_Y") condQuery = "(L.STATUS = 'D')";
        }

        try {
            conn = await oracledb.getConnection(dbConfig);          
            var rowNum = req.body.moreNum;
            let resAnswerFile = await conn.execute(`SELECT F.IMGID, F.PAGENUM, F.FILEPATH 
                                                    FROM 
                                                      TBL_BATCH_ANSWER_FILE F 
                                                      LEFT OUTER JOIN TBL_BATCH_LEARN_LIST L 
                                                      ON F.FILEPATH = L.FILEPATH 
                                                    WHERE ` + condQuery + `
                                                    AND F.FILEPATH LIKE '/2018/%' 
                                                    AND ROWNUM <= :num
                                                    ORDER BY F.IMGID ASC `, [req.body.moreNum]);
            
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

            let delRes = await conn.execute(delSql, [req.fileinfo.filepath]);

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

            //let rescol = await conn.execute("select * from tbl_column_mapping_cls");

            //inssql = queryconfig.batchlearningconfig.insertmlexport;
            //delsql = queryconfig.batchlearningconfig.deletemlexport;

            //let delres = await conn.execute(delsql, [req.filepath]);

            //for (var i = 0; i < req.mldata[0].length; i++) {
            //    var cond = [];
            //    cond.push(req.imgid);
            //    cond.push(req.filepath);

            //    for (var row = 0; row < rescol.rows.length; row++) {
            //        if (req.mldata[0][i].label == rescol.rows[row].coltype) {
            //            cond.push(rescol.rows[row].colnum);
            //        }
            //    }

            //    cond.push(req.mldata[0][i].text);
            //    cond.push(req.mldata[0][i].location);
            //    cond.push(req.mldata[0][i].sid);

            //    if (cond.length == 6) {
            //        let coldata = await conn.execute(inssql, cond);
            //    }
            //}
            

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
            locSplit = req.location.split(",");
            //need check
            sid += locSplit[0] + "," + locSplit[1] + "," + (Number(locSplit[0]) + Number(locSplit[2]));

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
            for (var i in req) {
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
                result = await conn.execute(queryConfig.batchLearningConfig.selectBatchLearnListFromFilePath, [req.filePathArray[i]]);

                if (result.rows.length == 0) {
                    result = await conn.execute(queryConfig.batchLearningConfig.selectDocType, [req.docNameArr[i]]);
                    var imgId = getConvertDate();
                    await conn.execute(queryConfig.batchLearningConfig.insertBatchLearnList, [imgId, req.filePathArray[i], result.rows[0].DOCTYPE]);
                } else {
                    result = await conn.execute(queryConfig.batchLearningConfig.selectDocType, [req.docNameArr[i]]);
                    await conn.execute(queryConfig.batchLearningConfig.updateBatchLearnList, [result.rows[0].DOCTYPE, req.filePathArray[i]]);
                }
            }

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

exports.deleteAnswerFile = function (req, done) {
    return new Promise(async function (resolve, reject) {
        let conn;
        let result;

        try {
            conn = await oracledb.getConnection(dbConfig);;
            result = await conn.execute(queryConfig.batchLearningConfig.deleteAnswerFile, [req]);

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