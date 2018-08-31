//npm install python-shell -save
var PythonShell = require('python-shell')
var sync = require('./sync.js')
var referenceCMD = require('./referenceCMD.js');

PythonShell.run = sync(PythonShell.run);
referenceCMD.selectLegacyFileData = sync(referenceCMD.selectLegacyFileData);
referenceCMD.convertTiftoJpgCMD = sync(referenceCMD.convertTiftoJpgCMD);
referenceCMD.callApiOcr = sync(referenceCMD.callApiOcr);
referenceCMD.selectSid = sync(referenceCMD.selectSid);
referenceCMD.insertMLDataCMD = sync(referenceCMD.insertMLDataCMD);
referenceCMD.proxyOcr = sync(referenceCMD.proxyOcr);
referenceCMD.insertOcrData = sync(referenceCMD.insertOcrData);

var testEnv = true;  //local
//var testEnv = False;  //server

sync.fiber(function () {
    //var arg = process.argv.slice(2);
    //var term = arg[0] + '%';
    var term = '2018%';
    var resLegacyData = sync.await(referenceCMD.selectLegacyFileData(term, sync.defer()));
    for (var i in resLegacyData) {
        sync.await(batchLearnTraing([resLegacyData[i]], sync.defer()));
    }
});

function batchLearnTraing(resLegacyData, done) {
    sync.fiber(function () {
        try {

            /*
            resLegacyData = [];
            var obj = {}
            obj.FILENAME = '209391.tif';
            obj.FILEPATH = '/MIG/2014/img1/7a/25b7a/209391.tif';
            resLegacyData.push(obj);
            */
            var imageRootDir;
            if (testEnv) {
                imageRootDir = 'C:/ICR/MIG';
            } else {
                imageRootDir = 'C:/ICR/image/MIG/MIG';
            }

            for (let tiffile in resLegacyData) {
                console.time("convertTiftoJpg : " + resLegacyData[tiffile].FILEPATH);
                let convertFilpath = resLegacyData[tiffile].FILEPATH;
                if (resLegacyData[tiffile].FILENAME.split('.')[1].toLowerCase() === 'tif' || resLegacyData[tiffile].FILENAME.split('.')[1].toLowerCase() === 'tiff') {
                    let result = sync.await(referenceCMD.convertTiftoJpgCMD(resLegacyData[tiffile].FILEPATH, sync.defer()));
                    if (result == "error") {
                        return done(null, "error convertTiftoJpg");
                    }
                    if (result) {
                        convertFilpath = result;
                    }
                }
                console.timeEnd("convertTiftoJpg : "+ resLegacyData[tiffile].FILEPATH);
        
                console.time("ocr : " + resLegacyData[tiffile].FILEPATH);
                let ocrResult;
                if (testEnv) {
                    ocrResult = sync.await(referenceCMD.callApiOcr(convertFilpath, imageRootDir + resLegacyData[tiffile].FILEPATH, sync.defer()));
                } else {
                    ocrResult = sync.await(referenceCMD.proxyOcr(convertFilpath, imageRootDir + resLegacyData[tiffile].FILEPATH, sync.defer()));
                }
                console.log(ocrResult);
                sync.await(referenceCMD.insertOcrData(resLegacyData[tiffile].FILEPATH, ocrResult, sync.defer()));

                var resJson = JSON.parse(ocrResult);
                //var pharsedOcrJson = ocrJson(resJson.regions);

                if (ocrResult == "error") {
                    return done(null, "error ocr");
                }
                console.timeEnd("ocr : " + resLegacyData[tiffile].FILEPATH);

               //typo ML
                /*
                console.time("typo ML : " + resLegacyData[tiffile].FILEPATH);
                cmdPythons.args = [];
                cmdPythons.args.push(JSON.stringify(dataToTypoArgs(ocrResult)));
                let resPyStr = sync.await(PythonShell.run('typoBatch.py', cmdPythons, sync.defer()));
                let resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
                let sidData = sync.await(referenceCMD.selectSid(resPyArr, sync.defer()));
                console.timeEnd("typo ML : " + resLegacyData[tiffile].FILEPATH);
        
                console.time("similarity ML : " + resLegacyData[tiffile].FILEPATH);
                cmdPythons.args = [];
                cmdPythons.args.push(JSON.stringify(resLegacyData[tiffile]));
                cmdPythons.args.push(JSON.stringify(sidData));
                resPyStr = sync.await(PythonShell.run('similarityBatch.py', cmdPythons, sync.defer()));
                resPyArr = JSON.parse(resPyStr[0].replace(/'/g, '"'));
                console.timeEnd("similarity ML : " + resLegacyData[tiffile].FILEPATH);
                
                console.time("insert MLExport : " + resLegacyData[tiffile].FILEPATH);
                sync.await(referenceCMD.insertMLDataCMD(resPyArr, sync.defer()));
                console.timeEnd("insert MLExport : " + resLegacyData[tiffile].FILEPATH);
                */
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
    scriptPath: 'C:/ICR/app/source/ml/typosentence',
    //scriptPath: 'C:/projectWork/koreanre/ml/typosentence',
    args: []
};

