var appRoot = require('app-root-path').path;
var exec = require('child_process').exec;
var commonUtil = require(appRoot + '/public/js/common.util.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var queryConfig = require(appRoot + '/config/queryConfig.js');
var logger = require('./logger.js');

const defaults = {
    encoding: 'utf8',
};

exports.typoSentenceEval = function (data, callback) {
    /*
    setTimeout(function () {
        throw new Error('unexpected error in typo ML model');
    }, 2000);
    */
    var args = dataToArgs(data);

    var exeTypoString = 'python ' + appRoot + '\\ml\\typosentence\\typo.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {

        if (err) {
            logger.error.info(`typo ml model exec error: ${stderr}`);
            return;
        }

        //console.log("typo Test : " + stdout);
        var typoData = stdout.split(/\r\n/g);

        var typoDataLen = typoData.length;

        while (typoDataLen--) {
            if (typoData[typoDataLen] == "") {
                typoData.splice(typoDataLen, 1);
            }
        }

        for (var i = 0; i < typoData.length; i++) {
            var typoSplit = typoData[i].split("^");
            var typoText = typoSplit[0];
            var typoOriWord = typoSplit[1];
            var typoUpdWord = typoSplit[2];

            for (var j = 0; j < data.length; j++) {
                if (data[j].text.toLowerCase() == typoText && typoOriWord.match(/:|-|[1234567890]/g) == null) {
                    var updWord = typoUpdWord.split(":");
                    data[j].text = data[j].text.toLowerCase().replace(typoOriWord, updWord[0]);
                }
            }
        }
        callback(data);
    });
};

exports.domainDictionaryEval = function (data, callback) {
    var args = dataToArgs(data);

    var exeTypoString = 'python ' + appRoot + '\\ml\\typosentence\\main.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {

        //console.log(stdout);

        if (err) {
            logger.error.info(`domainDictionaryEval ml model exec error: ${stderr}`);
            return;
        }

        var ocrText = stdout.split(/\r\n/g);
        var ocrTextLen = ocrText.length;

        while (ocrTextLen--) {
            if (ocrText[ocrTextLen] == "") {
                ocrText.splice(ocrTextLen, 1);
            }
        }

        if (ocrTextLen != null) {
            for (var i = 0; i < data.length; i++) {
                if (commonUtil.nvl(data[i].text).toLowerCase() != commonUtil.nvl(ocrText[i]).toLowerCase()) {
                    data[i].text = ocrText[i];
                }
            }
        }

        callback(data);
    });
};

//text classification eval
exports.textClassificationEval = function(data, callback) {

    var args = dataToArgs(data);

    var exeTypoString = 'python ' + appRoot + '\\ml\\cnn-text-classification\\eval.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {

        if (err) {
            logger.error.info(`textClassificationEval ml model exec error: ${stderr}`);
            return;
        }

        var obj = stdout.split("^");

        var label = [];

        for (var key in obj) {
            var objSplit = obj[key].split("||");

            for (var i = 0; i < data.length; i++) {
                if (commonUtil.nvl(data[i].text).toLowerCase() == objSplit[0].toLowerCase()) {
                    data[i].label = commonUtil.nvl(objSplit[1]).replace(/\r\n/g, "");
                }
            }
        }

        callback(data);

    });
}

// 계산서 분류 머신러닝 -- 임시
exports.statementClassificationEval = function (data, callback) {
    var returnObj = {};
    var number = 0;
    var score = 0; // 예측스코어

    // 머신러닝이 담당할 부분 START
    for (var i in data) {
        if (data[i].text.trim() == 'APEX') { // APEX 계산서 이면
            number = 1;
            score = 98.8;
            break;
        } else { // 그 외
            number = 999;
            score = 97.4;
        }
    }
    // 머신러닝이 담당할 부분 END

    returnObj.data = data;
    commonDB.queryParam2(queryConfig.mlConfig.selectDocCategory, [number], function (rows, returnObj, score) {
        if (rows.length > 0) {
            returnObj.docCategory = rows[0];
            returnObj.docCategory.score = score; // 예측 스코어
        }
        callback(returnObj);
    }, returnObj, score);
};

//label mapping eval
exports.labelMappingEval = function(data, callback) {

    var labelData = [];

    for (var num in data) {
        if (data[num].label == "fixlabel" || data[num].label == "entryrowlabel") {
            labelData.push(data[num]);
        }
    }

    var args = dataToArgs(labelData);

    var exeTypoString = 'python ' + appRoot + '\\ml\\cnn-label-mapping\\eval.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {

        if (err) {
            logger.error.info(`label mapping eval ml model exec error: ${stderr}`);
            return;
        }

        //console.log(stdout);

        var labelMapping = stdout.split("^");

        //var jsonLabel = JSON.parse(stdout1);
        var dataArray = [];

        for (var key in labelMapping) {

            var objLabel = labelMapping[key].split("||");

            for (var i = 0; i < data.length; i++) {
                if (commonUtil.nvl(data[i].text).toLowerCase() == commonUtil.nvl(objLabel[0]).toLowerCase()) {
                    data[i].column = commonUtil.nvl(objLabel[1]).replace(/\r\n/g, '');
                    var obj = {};
                    obj.text = objLabel[0];
                    obj.column = commonUtil.nvl(objLabel[1]).replace(/\r\n/g, '');
                    dataArray.push(obj);
                }
            }
        }

        for (var i = 0; i < data.length; i++) {
            if (data[i].label == "fixvalue" || data[i].label == "entryvalue") {

                var splitLocation = data[i].location.split(",");

                var xCoodi = splitLocation[0];
                var yCoodi = splitLocation[1];
                var minDis = 100000;
                var columnText = '';

                for (var j = 0; j < data.length; j++) {
                    if (data[j].label == "fixlabel" || data[j].label == "entryrowlabel") {
                        var jSplitLocation = data[j].location.split(",");

                        var xNum = jSplitLocation[0];
                        var yNum = jSplitLocation[1];

                        var diffX = xCoodi - xNum;
                        var diffY = yCoodi - yNum;

                        //점 최소 거리
                        //var dis = Math.sqrt(Math.abs(diffX * diffX) + Math.abs(diffY * diffY));

                        //y좌표 최소 거리
                        var dis = Math.abs(yCoodi - yNum);

                        if (minDis > dis) {
                            minDis = dis;
                            columnText = data[j].column.replace(/\r\n/g, '');
                        }
                    }
                }
                data[i].column = columnText + "_VALUE";

                //dataText += ',"' + data[i].text + '":"' + data[i].column + '"'; 

                var obj = {};
                obj.text = data[i].text;
                obj.column = data[i].column;

                //console.log(obj);

                dataArray.push(obj);

            }
        }

        callback(data);

    });
}

exports.billClassificationEval = function (data, callback) {
    var returnObj = {};
    var args = dataToAllLocationArgs(data);

    var exeTypoString = 'python ' + appRoot + '\\ml\\cnn-bill-classification\\eval.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {
        if (err) {
            logger.error.info(`billClassificationEval ml model exec error: ${stderr}`);
            return;
        }

        var bill = stdout.split("||");

        var billNum = bill[1].replace(/\r\n/g, '');

        returnObj.data = data;
        commonDB.queryParam(queryConfig.mlConfig.selectDocCategory, [billNum], function (rows, returnObj) {
            if (rows.length > 0) returnObj.docCategory = rows[0];
            callback(returnObj);
        }, returnObj);

    });
}

exports.labelClassificationEval = function (data, callback) {
    var args = dataToLocationArgs(data.data);
    var rData = data.data;

    var exeTypoString = 'python ' + appRoot + '\\ml\\cnn-label-classification\\eval.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {
        console.log("stdout : " + stdout);

        var outData = stdout.split("^");

        for (var i in outData) {
            var sData = outData[i].split("||");

            var textData = sData[0].split(" ");//x좌표 y좌표 text
            var colData = sData[1];//column

            for (var j in rData) {
                var loc = rData[j].location.split(",");

                if (textData[0] == loc[0] && textData[1] == loc[1]) {
                    rData[j].column = colData;
                }
            }
        }

        data.data = rData;

        callback(data);
    });
}

function dataToArgs(data) {

    var args = '';
    for (var i = 0; i < data.length; i++) {
        args += '"' + commonUtil.nvl(data[i].text).toLowerCase() + '"' + ' ';
    }

    return args;
}

function dataToLocationArgs(data) {
    var args = '';

    for (var i in data) {
        var loc = data[i].location.split(",");
        var text = data[i].text;

        args += '"' + loc[0] + ' ' + loc[1] + ' ' + commonUtil.nvl(text).toLowerCase() + '"' + ' ';
    }

    return args;
}

function dataToAllLocationArgs(data) {
    var args = '"';

    for (var i in data) {
        var loc = data[i].location.split(",");
        var text = data[i].text;

        args += loc[0] + ' ' + loc[1] + ' ' + text + ' ';
    }

    args += '"';

    return args;
}