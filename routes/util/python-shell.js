//npm install python-shell -save
var PythonShell = require('python-shell')
var sync = require('./sync.js')
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
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

        // tbl_ocr_file테이블에서 이미지 절대 경로 추출
        var originImageArr = sync.await(oracle.selectOcrFilePaths(data, sync.defer()));

        // tif파일일 경우 이미지 파일로 전환
        var ifile = appRoot + '\\uploads\\' + originImageArr[0].ORIGINFILENAME;
        var ofile = appRoot + '\\uploads\\' + originImageArr[0].ORIGINFILENAME.split('.')[0] + '.jpg';
        if (ifile.split('.')[1].toLowerCase() === 'tif' || ifile.split('.')[1].toLowerCase() === 'tiff') {
            var convertResult = exec('module\\imageMagick\\convert.exe -density 800x800 ' + ifile + ' ' + ofile);
            if (convertResult.status === 0) {
                fileNames.push(originImageArr[0].ORIGINFILENAME.split('.')[0] + '.jpg');
            }
        }

        // ocr처리
        var ocrData = sync.await(ocr.localOcr(fileNames[i], sync.defer()));

        // 결과값 머신러닝 처리
        // typo Sentense
        pythonConfig.typoOptions.args.push(JSON.stringify(dataToTypoArgs(data)));
        var resPyStr = sync.await(PythonShell.run('typo2.py', pythonConfig.typoOptions, sync.defer()));
        var resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
        var sidData = sync.await(oracle.select(resPyArr, sync.defer()));
        // form label mapping DL
        pythonConfig.formLabelMappingOptions.args.push(JSON.stringify(sidData));
        resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.formLabelMappingOptions, sync.defer()));
        resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
        // form mapping DL
        pythonConfig.formMappingOptions.args.push(JSON.stringify(resPyArr));
        resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.formMappingOptions, sync.defer()));
        resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
        var docData = sync.await(oracle.selectDocCategory(resPyArr, sync.defer()));
        console.log(docData);
        // column mapping DL
        /*pythonConfig.columnMappingOptions.args.push(JSON.stringify(docData.data));
        resPyStr = sync.await(PythonShell.run('eval2.py', pythonConfig.columnMappingOptions, sync.defer()));
        resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));*/

        // 정답 테이블과 비교
        //var cobineRegacyData = sync.await(oracle.selectLegacyData(testarr, sync.defer()));

        //비교 결과 리턴
    });
};


