'use strict';
var express = require('express');
var fs = require('fs');
var multer = require("multer");
var exceljs = require('exceljs');
var appRoot = require('app-root-path').path;
var exec = require('child_process').exec;
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
                    res.send({ code: '200', message: lineText });
                }
            });
        }
        
    });
    
});

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