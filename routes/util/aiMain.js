var appRoot = require('app-root-path').path;
var exec = require('child_process').exec;
var commonUtil = require(appRoot + '/public/js/common.util.js');
var commonDB = require(appRoot + '/public/js/common.db.js');
var queryConfig = require(appRoot + '/config/queryConfig.js');
var logger = require('./logger.js');
var oracledb = require('oracledb');
var dbConfig = require(appRoot + '/config/dbConfig');
var pythonConfig = require(appRoot + '/config/pythonConfig');
var sync = require('./sync.js');
var PythonShell = require('python-shell')
var oracle = require('./oracle.js');
var mlStudio = require('./mlStudio.js');

const defaults = {
    encoding: 'utf8',
};

exports.typoSentenceEval2 = function (data, callback) {
    sync.fiber(function () {
        pythonConfig.typoOptions.args = [];
        pythonConfig.typoOptions.args.push(JSON.stringify(dataToTypoArgs(data)));

        var resPyStr = sync.await(PythonShell.run('typo2.py', pythonConfig.typoOptions, sync.defer()));
        var resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
        var sidData = sync.await(oracle.select(resPyArr, sync.defer()));

        callback(sidData);
    });
};

exports.formLabelMapping2 = function (data, callback) {
    sync.fiber(function () {
        pythonConfig.formLabelMappingOptions.args = [];
        pythonConfig.formLabelMappingOptions.args.push(JSON.stringify(data));

        var resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.formLabelMappingOptions, sync.defer()));
        var resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
        if (!resPyArr.code || (resPyArr.code && resPyArr.code == 200)) { 
            callback(resPyArr);
        } else {
            callback(null);
        }
    });
};

exports.formMapping2 = function (data, callback) {
    sync.fiber(function () {
        pythonConfig.formMappingOptions.args = [];
        pythonConfig.formMappingOptions.args.push(JSON.stringify(data));

        var resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.formMappingOptions, sync.defer()));
        var resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
        if (!resPyArr.code || (resPyArr.code && resPyArr.code == 200)) {
            var docData = sync.await(oracle.selectDocCategory(resPyArr, sync.defer())); // select tbl_document_category  
            callback(docData);
        } else {
            callback(null);
        }
    });
};

exports.columnMapping2 = function (data, callback) {
    sync.fiber(function () {
        pythonConfig.columnMappingOptions.args = [];
        //pythonConfig.columnMappingOptions.args.push(JSON.stringify(data.data));
        pythonConfig.columnMappingOptions.args.push(JSON.stringify(data));

        var resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.columnMappingOptions, sync.defer()));
        var resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
        //var answerData = sync.await(oracle.selectContractMapping(data, sync.defer())); // select tbl_contract_mapping
        if (!resPyArr.code || (resPyArr.code && resPyArr.code == 200)) {
            //data.data = resPyArr;
            data = resPyArr;
            callback(data);
        } else {
            callback(null);
        }
    });
};

exports.columnMapping3 = function (data, callback) {
    sync.fiber(function () {
        pythonConfig.columnMappingOptions.args = [];
        pythonConfig.columnMappingOptions.args.push(JSON.stringify(data));

        var resPyStr = sync.await(PythonShell.run('eval3.py', pythonConfig.columnMappingOptions, sync.defer()));
        var resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
        if (!resPyArr.code || (resPyArr.code && resPyArr.code == 200)) {
            data = resPyArr;
            callback(data);
        } else {
            console.log(resPyArr.error);
            callback(null);
        }
    });
};

exports.addLabelMappingTrain = function (data, callback) {
    sync.fiber(function () {
        pythonConfig.formLabelMappingOptions.args = [];

        var sidData = sync.await(oracle.select(data.data, sync.defer()));

        data.data = sidData;

        sync.await(oracle.insertLabelMapping(data, sync.defer()));

        pythonConfig.formLabelMappingOptions.args = ["training"];

        sync.await(PythonShell.run('eval2.py', pythonConfig.formLabelMappingOptions, sync.defer()));

        callback(data);
    });
};

exports.addDocMappingTrain = function (data, callback) {
    sync.fiber(function () {
        sync.await(oracle.insertDocMapping(data, sync.defer()));

        pythonConfig.formMappingOptions.args = [];
        pythonConfig.formMappingOptions.args = ["training"];

        sync.await(PythonShell.run('eval2.py', pythonConfig.formMappingOptions, sync.defer()));

        callback(data);
    });
};

exports.addColumnMappingTrain = function (data, callback) {
    sync.fiber(function () {

        sync.await(oracle.insertColumnMapping(data, sync.defer()));

        pythonConfig.columnMappingOptions.args = [];
        pythonConfig.columnMappingOptions.args = ["training"];

        sync.await(PythonShell.run('eval3.py', pythonConfig.columnMappingOptions, sync.defer()));

        callback(data);
    });
};

// ---- Marchine Learning Studio Version ----- //
exports.runFromMLStudio = function (data, callback) {
    sync.fiber(function () {

        try {
            /*
            // Form Label Mapping
            //data = sync.await(oracle.selectFormLabelMappingFromMLStudio(data, sync.defer()));
            data = sync.await(mlStudio.run(data, 'formLabelMapping', sync.defer()));
            console.log('execute formLabelMapping ML');
            //console.log(data);
            */
            /*
            // Form Mapping
            //data = sync.await(oracle.selectFormMappingFromMLStudio(data, sync.defer()));
            data = sync.await(mlStudio.run(data, 'formMapping', sync.defer()));
            if (!data.docCategory.SEQNUM) {
                data = sync.await(oracle.selectDocCategoryFromMLStudio(data, sync.defer()));
            }
            console.log('execute formMapping ML');
            //console.log(data);
            */
            // column Mapping
            reObj = {};
            reObj.data = data;
            data = reObj;
            data = sync.await(oracle.selectColumnMappingFromMLStudio(data, sync.defer()));
            //console.log(data);
            data = sync.await(mlStudio.run(data, 'columnMapping', sync.defer()));
            console.log('execute columnMapping ML');
            //console.log(data);

            callback(data);
        } catch (e) {
            console.log(e);
            callback(data);
        }
    });
};

exports.addTrainFromMLStudio = function (data, callback) {
    sync.fiber(function () {

        var result = sync.await(mlStudio.train(data, sync.defer()));
        callback(result);

    });
};

exports.addLabelMappingTrainFromMLStudio = function (data, callback) {
    sync.fiber(function () {

        var sidData = sync.await(oracle.select(data.data, sync.defer()));
        data.data = sidData;
        sync.await(oracle.insertLabelMapping(data, sync.defer()));

        callback(data);
    });
};

exports.addDocMappingTrainFromMLStudio = function (data, callback) {
    sync.fiber(function () {

        sync.await(oracle.insertDocMapping(data, sync.defer()));

        callback(data);
    });
};

exports.addColumnMappingTrainFromMLStudio = function (data, callback) {
    sync.fiber(function () {

        sync.await(oracle.insertColumnMapping(data, sync.defer()));

        callback(data);
    });
};
// ---- Marchine Learning Studio Version ----- //

// [step1] typo sentence ML
exports.typoSentenceEval = function (data, callback) {
    var args = dataToArgs(data);

    var exeTypoString = 'python ' + appRoot + '\\ml\\typosentence\\typo.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {
        var retData = data;
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

            for (var j = 0; j < retData.length; j++) {
                if (retData[j].text.toLowerCase() == typoText && typoOriWord.match(/:|-|[1234567890]/g) == null) {
                    var updWord = typoUpdWord.split(":");
                    retData[j].text = retData[j].text.toLowerCase().replace(typoOriWord, updWord[0]);
                    retData[j].originText = typoText;
                }
            }
        }

        getSymspellSID(retData, function (sidData) {
            callback(sidData);
        });
        
    });
};

async function getSymspellSID(data, callbackTypoDomainTrain) {
    let res;
    try {
        res = await runSymspellSID(data);
        //console.log(res);
        callbackTypoDomainTrain(res);
    } catch (err) {
        console.error(err);
    }
}

function runSymspellSID(data) {
    return new Promise(async function (resolve, reject) {
        let conn;

        try {
            conn = await oracledb.getConnection(dbConfig);

            //console.log(data);

            for (var i in data) {
                var sid = "";
                locSplit = data[i].location.split(",");
                sid += locSplit[0] + "," + locSplit[1];

                let result = await conn.execute("SELECT EXPORT_SENTENCE_SID(:COND) SID FROM DUAL", [data[i].text.toLowerCase()]);

                if (result.rows[0] != null) {
                    sid += "," + result.rows[0].SID;
                }

                data[i].sid = sid;
            }
            resolve(data);

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

// [step2] form label mapping ML
exports.formLabelMapping = function (data, callback) {
    var args = dataToSidArgs(data, false);

    var exeTypoString = 'python ' + appRoot + '\\ml\\FormLabelMapping\\eval.py ' + args;
    exec(exeTypoString, defaults, function (err, stdout, stderr) {
        if (err) console.error(err);

        var formLabelArr = stdout.split('^');
        for (var i in formLabelArr) {
            for (var j in data) {
                if (formLabelArr[i].split('||')[0] == data[j].sid) {
                    data[j].formLabel = Number(formLabelArr[i].split('||')[1].replace(/\r\n/g, ''));
                    break;
                }
            }
        }

        callback(data);
    });

}

// [step3] form mapping ML
exports.formMapping = function (data, callback) {
    var args = dataToSidArgs(data, true);

    if (args.length == undefined) {
        callback(null);
    } else {
        var isValid = (args.split(',').length == 14) ? true : false;
        if (isValid) {
            var exeformMapping = 'python ' + appRoot + '\\ml\\FormMapping\\eval.py ' + args;
            exec(exeformMapping, defaults, function (err, stdout, stderr) {
                if (err) {
                    logger.error.info(`formMapping ml model exec error: ${stderr}`);
                    callback(null);
                    return;
                }

                var retSplit = stdout.split("^");
                var formSplit = retSplit[0].split("||");
                var scoreSplit = retSplit[1].split("||");

                if (formSplit[1] != null) {
                    var param = formSplit[1].trim();
                    commonDB.queryParam("select docname, doctype, sampleimagepath from tbl_document_category where doctype = to_number(:doctype)", [param], function (ret, retData) {
                        obj = {};
                        obj.data = retData;
                        obj.docCategory = ret;
                        obj.score = scoreSplit[1] * 100;

                        callback(obj);
                    }, data)
                }
            });
        } else {
            callback(null);
        }
    }

}

// [step4] column mapping ML
exports.columnMapping = function (data, callback) {
    if (data) {
        var args = dataToformSidArgs(data);
        var exeTypoString = 'python ' + appRoot + '\\ml\\ColumnMapping\\eval.py ' + args;
        exec(exeTypoString, defaults, function (err, stdout, stderr) {
            if (err) console.error(err);
            callback(stdout);
        });
    } else {
        callback(null);
    }
}

function dataToTypoArgs(data) {

    for (var i in data) {
        data[i].text = data[i].text.toLowerCase().replace("'", "`");
    }
    return data;
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

function dataToSidArgs(data, isFormMapping) {
    var args = '';
    var arg1, arg2;
    for (var i in data) {
        if (isFormMapping) {
            if (data[i].formLabel == 1) {
                arg1 = '"' + data[i].sid;
            } else if (data[i].formLabel == 2) {
                arg2 = ',' + data[i].sid + '"' + ' ';
            }           
            continue;
        } else {
            args += '"' + data[i].sid + '"' + ' ';
        }
    }
    if (isFormMapping) {
        args = arg1 + arg2;
    }
    return args;
}

function dataToformSidArgs(data) {
    var args = '';

    for (var i in data.data) {
        args += '"' + data.docCategory[0].DOCTYPE + ',' + data.data[i].sid + '"' + ' ';
    }

    return args;
}

/*
function dataToForm(data) {
    var args = '"';
    var ctog = '';
    var ctnm = '';

    for (var i in data) {
        if (data[i].formLabelMapping == '1') {
            ctog = data[i].sid;
        }
    }

    for (var i in data) {
        if (data[i].formLabelMapping == '2') {
            ctnm = data[i].sid;
        }
    }

    args = '"' + ctog + ',' + ctnm + '"';

    return args;
}
*/

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

/*
 *  ML OLD
 * 
//text classification eval
exports.textClassificationEval = function (data, callback) {

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

exports.statementClassificationEval = function (data, callback) {
    var returnObj = {};
    var number = 0;
    var score = 0;

    for (var i in data) {
        if (data[i].text.trim() == 'APEX') { 
            number = 1;
            score = 98.8;
            break;
        } else {
            number = 999;
            score = 97.4;
        }
    }

    returnObj.data = data;
    commonDB.queryParam2(queryConfig.mlConfig.selectDocCategory, [number], function (rows, returnObj, score) {
        if (rows.length > 0) {
            returnObj.docCategory = rows[0];
            returnObj.docCategory.score = score;
        }
        callback(returnObj);
    }, returnObj, score);
};

//label mapping eval
exports.labelMappingEval = function (data, callback) {

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

                        //var dis = Math.sqrt(Math.abs(diffX * diffX) + Math.abs(diffY * diffY));

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
        if (err) {
            logger.error.info(`labelClassificationEval ml model exec error: ${stderr}`);
            return;
        }
        console.log(stdout);

        var outData = stdout.split("^");

        for (var i in outData) {
            var sData = outData[i].split("||");

            var textData = sData[0].split(" ");
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
*/