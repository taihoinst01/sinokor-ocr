'use strict';

/******************************************
 * server database function js
 * ****************************************/
var async = require("async");

var commonUtil = require(require('app-root-path').path + '/public/js/common.util.js');
var commModule = require(require('app-root-path').path + '/public/js/import.js');
var queryConfig = commModule.queryConfig;

module.exports = function (pool) {

    // Paing query 생성
    var makePagingQuery = function (req, targetQuery) {
        var startNum = req.body.startNum ? req.body.startNum : 0;
        var endNum = req.body.endNum ? req.body.endNum : commonUtil.MAX_ENTITY_IN_PAGE;
        var query = `
            SELECT
                *
            FROM
                (
                SELECT
                    rownum AS rnum, A.*
                FROM
                    (`+ targetQuery + `) A
                WHERE
                    rownum <= `+ endNum + `
                )
            WHERE
                rnum > `+ startNum + `
        `;
        return query;
    };

    // 리스트 쿼리 요청 (totalCount 포함)
    var reqListQuery = function (sql, callbackFunc, totalCount, req, res) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                result.rows[0].totalCount = totalCount;
                callbackFunc(result.rows ? result.rows : null, req, res);
                connection.release();
            });
        });
    };

    // 일반 쿼리 요청 (파라미터 포함)
    var reqQueryParam = function (sql, param, callbackFunc, req, res) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, param, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rows ? result.rows : null, req, res);
                connection.release();
            });
        });
    };

    // 일반 쿼리 요청 (파라미터 포함, 외부 변수 1개)
    var reqQueryParam2 = function (sql, param, callbackFunc, origin, req, res) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, param, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rows ? result.rows : null, origin, req, res);
                connection.release();
            });
        });
    };

    // 쿼리 요청 (파라미터 포함, req & res 미포함, 함수 파라미터 하나 포함)
    var queryParam = function (sql, param, callbackFunc, origin) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, param, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rows ? result.rows : null, origin);
                connection.release();
            });
        });
    };

    // 쿼리 요청 (파라미터 포함, req & res 미포함, 함수 파라미터 둘 포함)
    var queryParam2 = function (sql, param, callbackFunc, origin, two) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, param, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rows ? result.rows : null, origin, two);
                connection.release();
            });
        });
    };

    // 일반 쿼리 요청
    var reqQuery = function (sql, callbackFunc, req, res) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rows ? result.rows: null, req, res);
                connection.release();
            });
        });
    };

    // 일반 쿼리 요청(함수 파라미터 하나 포함)
    var reqQueryF1param = function (sql, callbackFunc, req, res, origin) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rows ? result.rows : null, req, res, origin);
                connection.release();
            });
        });
    };

    // 일반 쿼리 요청(함수 파라미터 두개 포함)
    var reqQueryF2param = function (sql, callbackFunc, req, res, origin, originTwo) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rows ? result.rows : null, req, res, origin, originTwo);
                connection.release();
            });
        });
    };

    // 쿼리 요청 (파라미터 포함, req & res 미포함, rows 미포함)
    var queryNoRows = function (sql, param, callbackFunc) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, param, function (err) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc();
                connection.release();
            });
        });
    };

    // 쿼리 요청 2 (파라미터 포함, req & res 미포함, rows 미포함)
    var queryNoRows2 = function (sql, param, callbackFunc) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, param, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rows ? result.rows : null);
                connection.release();
            });
        });
    };

    // 일반 쿼리 요청 (파라미터, rows 포함, 결과값이 COUNT 일때)
    var reqCountQueryParam = function (sql, param, callbackFunc, req, res) {
        pool.getConnection(function (err, connection) {
            connection.execute(sql, param, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rowsAffected ? result.rowsAffected : 0, req, res);
                connection.release();
            });
        });
    };

    // 파일정보 DB INSERT
    var insertFileInfo = function (fileInfo, flag, callbackFunc,req ,res) {
        if (flag == "ocr_file") {
            //var fileDtlParam = {
            //    imgId: imgId,
            //    filePath: convertFilePath,
            //    originFileName: convertFileName,
            //    convertFileName: '',
            //    serverFileName: '',
            //    fileExt: convertFileName.substring(_lastDot + 1, convertFileName.length).toLowerCase(),
            //    fileSize: stat2.size,
            //    contentType: 'image/jpeg'
            //};  
            console.log("fileInfo... : " + JSON.stringify(fileInfo));
            for (var i = 0, item; item = fileInfo[i]; i++) {
                var originFileName = item.oriFileName;
                var serverFileName = item.svrFileName;
                console.log("filePath : " + item.filePath);
                console.log("filePath : " + item.oriFileName);
                var data = [item.imgId, item.filePath, originFileName, serverFileName,
                            item.fileExt, item.fileSize, item.contentType, 'I', item.regId];
                reqQueryParam(queryConfig.commonConfig.insertFileInfo, data, callbackFileInfo, req, res);
            }
        } else if (flag == "ocr_file_dtl") {
            for (var i = 0, item; item = fileInfo[i]; i++) {
                var originFileName = item.oriFileName;
                var serverFileName = item.svrFileName;
                var data = [item.imgId, item.filePath, originFileName, serverFileName,
                            item.fileExt, item.fileSize, item.contentType, 'I', item.regId];
                reqQueryParam(queryConfig.commonConfig.insertFileDtlInfo, data, callbackFileDtlInfo, req, res);
            }
        }
    }
    var callbackFileInfo = function (rows, req, res) { };
    var callbackFileDtlInfo = function (rows, req, res) { };

    // 다수 쿼리 요청 (파라미터 포함)
    var reqBatchQueryParam = function (sql, binds, options, callbackFunc, req, res) {
        pool.getConnection(function (err, connection) {
            connection.executeMany(sql, binds, options, function (err, result) {
                if (err) {
                    console.error("OracleDB err : ", err);
                    console.log(sql);
                }
                callbackFunc(result.rowsAffected ? result.rowsAffected : null, req, res);
                connection.release();
            });
        });
    };

    // upload excelpath (2018-08-21)
    var reqInsertExcelDataPath = function (pathResult, dataResult, req, res) {
        pool.getConnection(function (err, connection) {
            async.forEachOf(pathResult, function (dataElement, i, inner_callback) {
                let data = [];
                for (var j = 0, y = pathResult[i].length; j < y; j++) {
                    data.push(commonUtil.nvl(pathResult[i][j]));
                }
                if (i != 0 && !commonUtil.isNull(pathResult[i][0])) {
                    connection.execute(queryConfig.batchLearningConfig.insertBatchAnswerFile, data, function (err, result) {
                        if (err) {
                            console.log("err insert pathResult: " + i + " : " + JSON.stringify(data));
                            inner_callback(err);
                        } else {
                            console.log(`insert pathResult : ` + JSON.stringify(data));
                            inner_callback(callbackExcelDataPath);
                        }
                    });
                }
                if (i == pathResult.length - 1) insertData(pathResult, dataResult, req, res);
            }, function (err) {
                if (err) {
                    //handle the error if the query throws an error
                } else {
                    //whatever you wanna do after all the iterations are done
                }
            });

            function insertData(pathResult, dataResult, req, res) {
                console.log("insert data 실행");
                async.forEachOf(dataResult, function (dataElement, i, inner_callback) {
                    let data = [];
                    for (var j = 0, y = dataResult[i].length; j < y; j++) {
                        data.push(commonUtil.nvl(dataResult[i][j]));
                    }
                    if (i != 0 && !commonUtil.isNull(dataResult[i][0])) {
                        connection.execute(queryConfig.batchLearningConfig.insertBatchAnswerData, data, function (err, result) {
                            if (err) {
                                console.log("err insert dataResult: " + i + " : " + JSON.stringify(data));
                                inner_callback(err);
                            } else {
                                console.log(`insert dataResult : ` + JSON.stringify(data));
                                inner_callback(null);
                            }
                        });
                    }
                    if (i == dataResult.length - 1) callbackExcelDataPath(pathResult, dataResult, req, res);
                }, function (err) {
                    if (err) {
                        //handle the error if the query throws an error
                    } else {
                        //whatever you wanna do after all the iterations are done
                    }
                });
            }

            function callbackExcelDataPath(pathResult, dataResult, req, res) {
                console.log("inner.. callback ...");
                if (pathResult.length > 0 || dataResult.length > 0) {
                    res.send({ code: 200, pathCnt: pathResult.length, dataCnt: dataResult.length });
                } else {
                    res.send({ code: 300, pathCnt: 0, dataCnt: 0 });
                }
            }
        });
    };

    // upload exceldata (2018-08-21)
    //var reqInsertExcelData = function (dataResult, callbackExcelData) {
    //    pool.getConnection(function (err, connection) {
    //        async.forEachOf(dataResult, function (dataElement, i, callbackExcelData) {
    //            let data = [];
    //            for (var j = 0, y = dataResult[i].length; j < y; j++) {
    //                data.push(commonUtil.nvl(dataResult[i][j]));
    //            }
    //            connection.execute(queryConfig.batchLearningConfig.insertBatchAnswerData, data, function (err, result) {
    //                if (err) {
    //                    console.log("err : " + sql);
            
    //                    callbackExcelData(err);
    //                } else {
    //                    console.log(`insert pathResult : ` + i);
    //                    callbackExcelData(null);
    //                }
    //                callbackFunc(result.rows ? result.rows : null);
    //                connection.release();
    //            });
    //        }, function (err) {
    //            if (err) {
    //                //handle the error if the query throws an error
    //            } else {
    //                //whatever you wanna do after all the iterations are done
    //            }
    //        });
    //    });
    //};
    

    module.exports.makePagingQuery = makePagingQuery;
    module.exports.reqListQuery = reqListQuery;
    module.exports.reqQueryParam = reqQueryParam;
    module.exports.reqQueryParam2 = reqQueryParam2
    module.exports.reqQuery = reqQuery;
    module.exports.reqQueryF1param = reqQueryF1param;
    module.exports.reqQueryF2param = reqQueryF2param;
    module.exports.queryParam = queryParam;
    module.exports.queryParam2 = queryParam2;
    module.exports.queryNoRows = queryNoRows;
    module.exports.queryNoRows2 = queryNoRows2;
    module.exports.reqCountQueryParam = reqCountQueryParam;
    module.exports.insertFileInfo = insertFileInfo;
    module.exports.reqBatchQueryParam = reqBatchQueryParam;
    module.exports.reqInsertExcelDataPath = reqInsertExcelDataPath;
}