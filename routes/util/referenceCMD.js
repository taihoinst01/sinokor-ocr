var oracledb = require('oracledb');
var dbConfig = {
  user: process.env.NODE_ORACLEDB_USER || "koreanre",
  password: process.env.NODE_ORACLEDB_PASSWORD || "koreanre01",
  //connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "10.10.20.205/koreanreocr",
  connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "172.16.53.142/koreanreocr",
  externalAuth: process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false,
  poolMax: 30,
  poolMin: 10
};
oracledb.outFormat = oracledb.OBJECT;
var fs = require('fs');
var request = require('sync-request');
var execSync = require('child_process').execSync;
var propertiesConfig = require('../../config/propertiesConfig.js');
var sync = require('./sync.js');

exports.selectLegacyFileData = function (req, done) {
    return new Promise(async function (resolve, reject) {
      var res = [];
      let conn;
      try {
        conn = await oracledb.getConnection(dbConfig);
          let resAnswerFile = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_FILE WHERE IMGID LIKE :term`, [req]);
  
        for (let row in resAnswerFile.rows) {
          tempDictFile = {};
          tempDictFile['IMGID'] = resAnswerFile.rows[row].IMGID;
          tempDictFile['PAGENUM'] = resAnswerFile.rows[row].PAGENUM;
          tempDictFile['FILEPATH'] = resAnswerFile.rows[row].FILEPATH;
          tempDictFile['FILENAME'] = tempDictFile['FILEPATH'].substring(tempDictFile['FILEPATH'].lastIndexOf('/') + 1, tempDictFile['FILEPATH'].length);
  
          let answerDataArr = await conn.execute(`SELECT * FROM TBL_BATCH_ANSWER_DATA WHERE IMGID = :imgId AND TO_NUMBER(IMGFILESTARTNO) <= :imgStartNo AND TO_NUMBER(IMGFILESTARTNO) <= :imgStartNo`, [tempDictFile['IMGID'], tempDictFile['PAGENUM'], tempDictFile['PAGENUM']]);
          
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

  exports.convertTiftoJpgCMD = function (originFilePath, done) {
      try {

          var today = new Date();
          var dd = today.getDate();
          var mm = today.getMonth() + 1; //January is 0!
          var yyyy = today.getFullYear();

          let imageRootDir = 'C:/ICR/image/MIG/MIG';  //운영
          //let imageRootDir = 'C:/ICR/MIG';          //개발
          var convertFilePath = 'C:/ImageTemp/' + yyyy + mm + dd;

          if (!fs.existsSync(convertFilePath)) {
              fs.mkdirSync(convertFilePath);
          }
          
          convertedFileName = originFilePath.substring(originFilePath.lastIndexOf('/') + 1, originFilePath.length);
          convertedFileName = convertedFileName.split('.')[0] + '.jpg';
          
          execSync('C:\\ICR\\app\\source\\module\\imageMagick\\convert.exe -density 800x800 ' + imageRootDir + originFilePath + ' ' + convertFilePath + '/' + convertedFileName);
          //execSync('C:\\projectWork\\koreanre\\module\\imageMagick\\convert.exe -density 800x800 ' + imageRootDir + originFilePath + ' ' + convertFilePath + '/' + convertedFileName);
          return done(null, convertFilePath + '/' + convertedFileName);

    } catch (err) {
        console.log(err);
    } finally {
        //console.log('end');
    }
};
exports.callApiOcr = function (req, originPath, done) {
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
      var resIns = sync.await(this.insertOcrData(originPath, res.getBody('utf8'), sync.defer()));
      return done(null, pharsedOcrJson);
  } catch (err) {
      console.log(err);
      return done(null, 'error');
  } finally {

  }
};

exports.selectSid = function (req, done) {
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

exports.proxyOcr = function (req, originPath, done) {
  return new Promise(async function (resolve, reject) {
      var fileName = req;

      try {
          var formData = {
              file: {
                  value: fs.createReadStream(fileName),
                  options: {
                      filename: fileName,
                      contentType: 'image/jpeg'
                  }
              }
          };

          request.post({ url: propertiesConfig.proxy.serverUrl + '/ocr/api', formData: formData }, function (err, httpRes, body) {

              return done(null, body);
          });

      } catch (err) {
          reject(err);
      } finally {
      }
  });
};

exports.insertOcrData = function (filepath, ocrData, done) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            let resfile = await conn.execute(`SELECT * FROM TBL_BATCH_OCR_DATA WHERE FILEPATH = :filepath `, [filepath]);
            let resIns;
            if (resfile.rows.length == 0) {
                let resIns = await conn.execute(`INSERT INTO TBL_BATCH_OCR_DATA VALUES(seq_batch_ocr_data.nextval, :filepath, :ocrData) `, [filepath, ocrData], { autoCommit: true });
            }

            return done(null, "insert ok");
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