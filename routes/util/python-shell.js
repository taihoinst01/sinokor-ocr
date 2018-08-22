//npm install python-shell -save
var PythonShell = require('python-shell')
var sync = require('./sync.js')
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
var pythonConfig = require(appRoot + '/config/pythonConfig');
var oracle = require('./oracle.js');
var ocr = require('./ocr.js');
const oracledb = require('oracledb');
var async = require('async');
var exec = require('sync-exec');

PythonShell.run = sync(PythonShell.run);
//oracledb.createPool = sync(oracledb.createPool);
oracle.selectOcrFilePaths = sync(oracle.selectOcrFilePaths);

exports.convertMLDataToImgSid = function (data, callback) {
    sync.fiber(function () {
        var fileName;
        var resultObj;

        try {
            // tbl_ocr_file테이블에서 이미지 절대 경로 추출
            var originImageArr = sync.await(oracle.selectOcrFilePaths(data, sync.defer()));

            // tif파일일 경우 이미지 파일로 전환
            var ifile = appRoot + '\\uploads\\' + originImageArr[0].ORIGINFILENAME;
            var ofile = appRoot + '\\uploads\\' + originImageArr[0].ORIGINFILENAME.split('.')[0] + '.jpg';
            if (ifile.split('.')[1].toLowerCase() === 'tif' || ifile.split('.')[1].toLowerCase() === 'tiff') {
                var convertResult = exec('module\\imageMagick\\convert.exe -density 800x800 ' + ifile + ' ' + ofile);
                if (convertResult.status === 0) {
                    fileName = originImageArr[0].ORIGINFILENAME.split('.')[0] + '.jpg';
                } else {
                    console.log(convertResult);
                    throw new Error({ 'code': 500, messasge: 'convert jpg to tif error' });
                }
            }

            // ocr처리
            var ocrData = sync.await(ocr.localOcr(fileName, sync.defer()));
            var lineData;
            if (ocrData.code === 200) {
                lineData = convertOcrData(ocrData);
            } else {
                throw new Error({ 'code': 500, messasge: 'ocr api error' });
            }

            // 결과값 머신러닝 처리
            try {
                //-- typo Sentense
                console.log('typo ML');
                pythonConfig.typoOptions.args.push(JSON.stringify(dataToTypoArgs(lineData)));
                var resPyStr = sync.await(PythonShell.run('typo2.py', pythonConfig.typoOptions, sync.defer()));
                var resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
                var sidData = sync.await(oracle.select(resPyArr, sync.defer()));
                //-- form label mapping DL
                console.log('form label mapping ML');
                pythonConfig.formLabelMappingOptions.args.push(JSON.stringify(sidData));
                resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.formLabelMappingOptions, sync.defer()));
                resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
                //-- form mapping DL
                console.log('form mapping ML');
                pythonConfig.formMappingOptions.args.push(JSON.stringify(resPyArr));
                resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.formMappingOptions, sync.defer()));
                resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
                var docData = sync.await(oracle.selectDocCategory(resPyArr, sync.defer()));
                //-- column mapping DL
                console.log('column mapping ML');
                pythonConfig.columnMappingOptions.args.push(JSON.stringify(docData.data));
                resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.columnMappingOptions, sync.defer()));
                resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
                docData.data = resPyArr;
            } catch (e) {
                throw new Error({ 'code': 500, messasge: 'machine learning execute error' });
            }

            // 정답 테이블과 비교
            //var cobineRegacyData = sync.await(oracle.selectLegacyData(convertData, sync.defer()));


            // 비교 결과 리턴
        } catch (e) {
            callback(e);
        }
    });
};

function convertOcrData(ocrData) {
    var regions = ocrData.message.regions;
    var lineData = [];
    for (var i = 0; i < regions.length; i++) {
        for (var j = 0; j < regions[i].lines.length; j++) {
            var item = '';
            for (var k = 0; k < regions[i].lines[j].words.length; k++) {
                item += regions[i].lines[j].words[k].text + ' ';
            }
            lineData.push({ 'location': regions[i].lines[j].boundingBox, 'text': item.trim() });
        }
    }
    return lineData;
}

function dataToTypoArgs(data) {

    for (var i in data) {
        data[i].text = data[i].text.toLowerCase().replace("'", "`");
    }
    return data;
}


