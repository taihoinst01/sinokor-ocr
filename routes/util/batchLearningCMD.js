//npm install python-shell -save
var PythonShell = require('python-shell')
var sync = require('./sync.js')
var appRoot = require('app-root-path').path;
var oracle = require('./oracle.js');
var pythonConfig = require(appRoot + '/config/pythonConfig');

PythonShell.run = sync(PythonShell.run);
oracle.selectLegacyFileData = sync(oracle.selectLegacyFileData);
oracle.convertTiftoJpgCMD = sync(oracle.convertTiftoJpgCMD);
oracle.callApiOcr = sync(oracle.callApiOcr);
oracle.select = sync(oracle.select);
oracle.insertMLDataCMD = sync(oracle.insertMLDataCMD);

sync.fiber(function () {
    var arg = process.argv.slice(2);
    var term = arg[0] + '%';
    var resLegacyData = sync.await(oracle.selectLegacyFileData(term, sync.defer()));
    for (var i in resLegacyData) {
        sync.await(batchLearnTraing([resLegacyData[i]], sync.defer()));
    }
});

function batchLearnTraing(resLegacyData, done) {
    sync.fiber(function () {
        try {
            
            //makeData2 ();
            var retData = {};
            //var temp = makeData2 ();

            /*
            var resLegacyData = [];
            var obj = {};
            obj.FILENAME = '209391.tif';
            obj.FILEPATH = '/MIG/2014/img1/7a/25b7a/209391.tif';
            obj.IMGID = '154490';
            resLegacyData.push(obj);            
            */

            for (let tiffile in resLegacyData) {
                console.time("convertTiftoJpg : " + resLegacyData[tiffile].FILEPATH);
                //var filename = resLegacyData[tiffile].FILENAME;
                //var imgId = resLegacyData[tiffile].IMGID;
                let convertFilpath = resLegacyData[tiffile].FILEPATH;
                if (resLegacyData[tiffile].FILENAME.split('.')[1].toLowerCase() === 'tif' || resLegacyData[tiffile].FILENAME.split('.')[1].toLowerCase() === 'tiff') {
                    let imageRootDir = 'C:/ICR/image/MIG/MIG';  //운영
                    //let imageRootDir = 'C:/ICR/MIG';          //개발
                    let result = sync.await(oracle.convertTiftoJpgCMD(imageRootDir + resLegacyData[tiffile].FILEPATH, sync.defer()));
                    if (result == "error") {
                        return done(null, "error convertTiftoJpg");
                    }
                    if (result) {
                        convertFilpath = result;
                    }
                }
                console.timeEnd("convertTiftoJpg : "+ resLegacyData[tiffile].FILEPATH);
        
                //ocr
                console.time("ocr : " + resLegacyData[tiffile].FILEPATH);
                //let ocrResult = sync.await(oracle.callApiOcrCMD(convertFilpath, sync.defer())); //-- 개발
                var ocrResult = sync.await(ocrUtil.proxyOcrCMD(convertFilpath, sync.defer()));//-- 운영서버용
        
                if (ocrResult == "error") {
                    return done(null, "error ocr");
                }
                console.timeEnd("ocr : " + resLegacyData[tiffile].FILEPATH);
        
                //typo ML
                console.time("typo ML : " + resLegacyData[tiffile].FILEPATH);
                cmdPythons.args = [];
                cmdPythons.args.push(JSON.stringify(dataToTypoArgs(ocrResult)));
                let resPyStr = sync.await(PythonShell.run('typo2.py', cmdPythons, sync.defer()));
                let resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
                let sidData = sync.await(oracle.select(resPyArr, sync.defer()));
                console.timeEnd("typo ML : " + resLegacyData[tiffile].FILEPATH);
        
                console.time("similarity ML : " + resLegacyData[tiffile].FILEPATH);
                cmdPythons.args = [];
                cmdPythons.args.push(JSON.stringify(resLegacyData[tiffile]));
                cmdPythons.args.push(JSON.stringify(sidData));
                resPyStr = sync.await(PythonShell.run('similarityBatch.py', cmdPythons, sync.defer()));
                resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
                console.timeEnd("similarity ML : " + resLegacyData[tiffile].FILEPATH);
                
                console.time("insert MLExport : " + resLegacyData[tiffile].FILEPATH);
                sync.await(oracle.insertMLDataCMD(resPyArr, sync.defer()));
                console.timeEnd("insert MLExport : " + resLegacyData[tiffile].FILEPATH);
            }
            console.log("done");
            return done(null, "");
        } catch (e) {
            console.log(e);
            return done(null, e);
        }
    });
}

function dataToTypoArgs(data) {

    for (var i in data) {
        data[i].text = data[i].text.toLowerCase().replace(/'/g, '`');
    }
    return data;
}
var cmdPythons = {
    mode: 'text',
    pythonPath: '',
    pythonOptions: ['-u'],
    //scriptPath: 'C:/ICR/app/source/ml/typosentence',
    scriptPath: 'C:/projectWork/koreanre/ml/typosentence',
    args: []
};