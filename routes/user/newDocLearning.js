﻿'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var exec = require('child_process').exec;
var PythonShell = require('python-shell');
var sql = require('mssql');
var dbConfig = require('../../config/dbConfig');
var queryConfig = require('../../config/queryConfig');

var router = express.Router();

router.get('/favicon.ico', function (req, res) {
    res.status(204).end();
});

// newDocLearning.html 보여주기
router.get('/', function (req, res) {
    /*const gs = require('ghostscript4js')

    try {
        const version = gs.version()
        console.log(version)
        gs.executeSync('-sDEVICE=jpeg -sOutputFile=page-%03d.jpg -r100x100 -f uploads/file1.pdf -c quit')
    } catch (err) {
        throw err
    }*/

    res.render('user/newDocLearning');
});

//머신러닝 api call
router.post('/ml', function (req, res) {
    var lineText = req.body.lineText;
    var word = '';
    for (var i = 0; i < lineText.length; i++) {
        word += (i != lineText.length - 1) ? lineText[i].text + "\n" : lineText[i].text;
    }

    if (!lineText) {
        res.send({ code: '400', message: 'The parameter is invalid' });
    }

    var dataPath = appRoot + '\\ml\\data'; // 데이터 root 경로
    var inputName = 'input_' + getConvertDate();
    var outputName = 'output_' + getConvertDate();

    fs.writeFile(dataPath + '\\inout\\' + inputName, word, function (err) {   
        if (err) {
            throw err;
        } else {
            
            // 오타수정 머신러닝 START
            const defaults = {
                encoding: 'utf8'
            };
            var exeString = 'python -m ml.nmt.nmt \ --out_dir=' + dataPath +
                '\\nmt_model \ --inference_input_file=' + dataPath +
                '\\inout\\' + inputName + ' \ --inference_output_file=' + dataPath +
                '\\inout\\' + outputName;
            exec(exeString, defaults, function (err1, stdout1, stderr1) {
                if (err1) {
                    console.log(err1);
                    res.send({ code: '500', message: err1 });
                } else {
                    var data = fs.readFileSync(dataPath + '\\inout\\' + outputName, 'utf8');
                    var typoResult = data.split('\n');
                    for (var i = 0; i < lineText.length; i++) {
                        lineText[i].text = typoResult[i];
                    }
                    // 오타수정 머신러닝 END

                    // 고정가변 분류 머신러닝 START
                    var fvParams = []
                    for (var i = 0; i < lineText.length; i++) {
                        fvParams.push(lineText[i].location.split(',')[0] + ',' + lineText[i].location.split(',')[1] +
                            ',' + lineText[i].text);
                    }
                    var options = {
                        mode: 'json',
                        encoding: 'utf8',
                        pythonPath: '',
                        pythonOptions: ['-u'],
                        scriptPath: appRoot + '\\ml',
                        args: fvParams
                    };
                    PythonShell.run('fvClassification.py', options, function (err, results) {
                        if (err) {
                            throw err;
                        } else {
                            results[0] = results[0].replace(/Scored Labels/gi, 'ScoredLabels');
                            var fvResult = JSON.parse(results[0]).Results.output;
                            for (var i = 0; i < fvResult.length; i++) {
                                lineText[i].isFixed = fvResult[i].ScoredLabels;
                            }
                            // 고정가변 분류 머신러닝 END

                            // 양식분류 머신러닝 START
                            var keyArr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
                                'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'ETC'];
                            var formParams = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
                                '', '', '', '', '', '', '', '', '', '', '', ''];
                            for (var i = 0; i < lineText.length; i++) {
                                if (lineText[i].isFixed == 'True') {
                                    for (var j = 0; j < keyArr.length; j++) {
                                        if (lineText[i].text.substr(0, 1) == keyArr[j]) {
                                            formParams[j] += (formParams[j] == '') ? '' : ',';
                                            formParams[j] = formParams[j] + lineText[i].text + ',' +
                                                lineText[i].location.split(',')[0] + ',' +
                                                lineText[i].location.split(',')[1];
                                            break;
                                        } else {
                                            if (j == keyArr.length - 1) {
                                                formParams[26] += (formParams[26] == '') ? '' : ',';
                                                formParams[26] = formParams[26] + lineText[i].text + ',' +
                                                    lineText[i].location.split(',')[0] + ',' +
                                                    lineText[i].location.split(',')[1];
                                            }
                                        }
                                    }
                                }
                            }
                            for (var i = 0; i < formParams.length; i++) {
                                if (formParams[i] == '') {
                                    formParams[i] = '0';
                                }
                            }
                            //console.log(formParams);
                            
                            options = {
                                mode: 'json',
                                encoding: 'utf8',
                                pythonPath: '',
                                pythonOptions: ['-u'],
                                scriptPath: appRoot + '\\ml',
                                args: formParams
                            };
                            PythonShell.run('formClassification.py', options, function (err, results) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    results[0] = results[0].replace(/Scored Labels/gi, 'ScoredLabels')
                                    var formResult = JSON.parse(results[0]).Results.output1[0].ScoredLabels;
                                    var scoreResult = JSON.stringify(results[0]).split('"'+formResult+'\\\\\\\"\\\":\\\"')[1];
                                    scoreResult = Number(scoreResult.split("\\\",\\\"ScoredLabels")[0]).toFixed(1);
                                    // 양식분류 머신러닝 END

                                    // DB컬럼 분류 머신러닝 START
                                    var colParams = [];

                                    for (var i = 0; i < lineText.length; i++) {
                                        if (lineText[i].isFixed == 'False') {
                                            colParams.push(lineText[i].location.split(',')[0] + '::' + lineText[i].location.split(',')[1]
                                                + '::' + lineText[i].text);
                                        }
                                    }

                                    options = {
                                        mode: 'json',
                                        encoding: 'utf8',
                                        pythonPath: '',
                                        pythonOptions: ['-u'],
                                        scriptPath: appRoot + '\\ml',
                                        args: colParams
                                    };
                                    PythonShell.run('srClassification.py', options, function (err, results) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            results[0] = results[0].replace(/Scored Labels/gi, 'ScoredLabels')
                                            var srResult = JSON.parse(results[0]).Results.output1;

                                            for (var i = 0; i < srResult.length; i++) {
                                                for (var j = 0; j < lineText.length; j++) {
                                                    if (lineText[j].text == srResult[i].text) {
                                                        lineText[j].column = srResult[i].ScoredLabels;
                                                    }
                                                }
                                            }

                                            // DB컬럼 조회
                                            (async () => {
                                                try {
                                                    var queryString = queryConfig.selectDbColumns;
                                                    let pool = await sql.connect(dbConfig);
                                                    let result1 = await pool.request()
                                                        .input('formName', sql.NVarChar, formResult)
                                                        .query(queryString);
                                                    let rows = result1.recordset;

                                                    res.send({ code: '200', message: lineText, formName: formResult, formScore: scoreResult * 100.0, columns: rows });

                                                } catch (err) {
                                                    res.send({ code: '500', message: 'db select error!' });
                                                } finally {
                                                    sql.close();
                                                }
                                            })()

                                            sql.on('error', err => {
                                            })
                                        }
                                    });   
                                    // DB컬럼 분류 머신러닝 END
                                }
                            });
                        }
                    });
                }
            });
        }      
    });  
});

//오늘날짜 변환함수
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

module.exports = router;