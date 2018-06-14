'use strict';
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
                        fvParams.push(lineText[i].location.split(',')[0] + '::' + lineText[i].location.split(',')[1] +
                            '::' + lineText[i].text);
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
                            for (var i = 0; i < lineText.length; i++) {
                                for (var j = 0; j < fvResult.length; j++) {
                                    if (lineText[i].text == fvResult[j].text) {
                                        lineText[i].isFixed = fvResult[j].ScoredLabels;
                                    }
                                }
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
                                            var appendText = lineText[i].text + ',' +
                                                lineText[i].location.split(',')[0] + ',' +
                                                lineText[i].location.split(',')[1];
                                            if (formParams[j] == '') {
                                                formParams[j] = appendText;
                                            } else {
                                                formParams[j] = ((formParams[j] < appendText) ? formParams[j] + "," + appendText : appendText + "," + formParams[j]);
                                            }
                                            break;
                                        } else {
                                            if (j == keyArr.length - 1) {
                                                var appendText = lineText[i].text + ',' +
                                                    lineText[i].location.split(',')[0] + ',' +
                                                    lineText[i].location.split(',')[1];
                                                if (formParams[26] == '') {
                                                    formParams[26] = appendText;
                                                } else {
                                                    formParams[26] = ((formParams[26] < appendText) ? formParams[26] + "," + appendText : appendText + "," + formParams[26]);
                                                }
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

//학습 데이터 insert
router.post('/insertTrainData', function (req, res) {
    var formName = req.body.formName;
    var data = req.body.data;

    (async () => {
        try {            
            let pool = await sql.connect(dbConfig);

            // 고정가변 분류 테이블 insert
            var queryString = queryConfig.insertfvClassification;
            for (var i = 0; i < data.length; i++) {  
                var result = await pool.request()
                    .input('x', sql.Int, data[i].location.split(',')[0])
                    .input('y', sql.Int, data[i].location.split(',')[1])
                    .input('text', sql.NVarChar, data[i].text)
                    .input('isFixed', sql.Bit, ((data[i].isFixed)? 1 : 0))
                    .query(queryString);
            }

            // form 분류 테이블 insert
            var keyArr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
                'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'ETC'];
            var formParams = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
                '', '', '', '', '', '', '', '', '', '', '', ''];
            for (var i = 0; i < data.length; i++) {
                if (data[i].isFixed) {
                    for (var j = 0; j < keyArr.length; j++) {
                        if (data[i].text.substr(0, 1) == keyArr[j]) {
                            var appendText = data[i].text + ',' +
                                data[i].location.split(',')[0] + ',' +
                                data[i].location.split(',')[1];
                            if (formParams[j] == '') {
                                formParams[j] = appendText;
                            } else {
                                formParams[j] = ((formParams[j] < appendText) ? formParams[j] + "," + appendText : appendText + "," + formParams[j]);
                            }                           
                            break;
                        } else {
                            if (j == keyArr.length - 1) {
                                var appendText = data[i].text + ',' +
                                    data[i].location.split(',')[0] + ',' +
                                    data[i].location.split(',')[1];
                                if (formParams[26] == '') {
                                    formParams[26] = appendText;
                                } else {
                                    formParams[26] = ((formParams[26] < appendText) ? formParams[26] + "," + appendText : appendText + "," + formParams[26]);
                                }  
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

            queryString = queryConfig.insertformClassification;
            var result = await pool.request()
                .input('a', sql.NVarChar, formParams[0])
                .input('b', sql.NVarChar, formParams[1])
                .input('c', sql.NVarChar, formParams[2])
                .input('d', sql.NVarChar, formParams[3])
                .input('e', sql.NVarChar, formParams[4])
                .input('f', sql.NVarChar, formParams[5])
                .input('g', sql.NVarChar, formParams[6])
                .input('h', sql.NVarChar, formParams[7])
                .input('i', sql.NVarChar, formParams[8])
                .input('j', sql.NVarChar, formParams[9])
                .input('k', sql.NVarChar, formParams[10])
                .input('l', sql.NVarChar, formParams[11])
                .input('m', sql.NVarChar, formParams[12])
                .input('n', sql.NVarChar, formParams[13])
                .input('o', sql.NVarChar, formParams[14])
                .input('p', sql.NVarChar, formParams[15])
                .input('q', sql.NVarChar, formParams[16])
                .input('r', sql.NVarChar, formParams[17])
                .input('s', sql.NVarChar, formParams[18])
                .input('t', sql.NVarChar, formParams[19])
                .input('u', sql.NVarChar, formParams[20])
                .input('v', sql.NVarChar, formParams[21])
                .input('w', sql.NVarChar, formParams[22])
                .input('x', sql.NVarChar, formParams[23])
                .input('y', sql.NVarChar, formParams[24])
                .input('z', sql.NVarChar, formParams[25])
                .input('etc', sql.NVarChar, formParams[26])
                .input('form', sql.NVarChar, formName)
                .query(queryString);

            // db컬럼 분류 테이블 insert
            if (formName == 'SHIPPING REQUEST') {
                queryString = queryConfig.insertsrClassification;
                for (var i = 0; i < data.length; i++) {
                    if (data[i].column && data[i].column != '') {
                        var result = await pool.request()
                            .input('x', sql.Int, data[i].location.split(',')[0])
                            .input('y', sql.Int, data[i].location.split(',')[1])
                            .input('text', sql.NVarChar, data[i].text)
                            .input('columnNo', sql.Int, data[i].column)
                            .query(queryString);
                    }
                }
            }

            res.send({ code: 200, message: '입력 성공!' });

        } catch (err) {
            console.log(err);
            res.send({ code: '500', message: 'db insert error!' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
    })
    

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