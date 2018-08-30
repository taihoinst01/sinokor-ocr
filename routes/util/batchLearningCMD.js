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

sync.fiber(function () {
    sync.await(batchLearnTraing(sync.defer()));
});

function batchLearnTraing(done) {
    sync.fiber(function () {
        try {
            var term = '2018%';
            var resLegacyData = sync.await(referenceCMD.selectLegacyFileData(term, sync.defer()));
    
            for (let tiffile in resLegacyData) {
                console.time("convertTiftoJpg : " + resLegacyData[tiffile].FILEPATH);
                let convertFilpath = resLegacyData[tiffile].FILEPATH;
                if (resLegacyData[tiffile].FILENAME.split('.')[1].toLowerCase() === 'tif' || resLegacyData[tiffile].FILENAME.split('.')[1].toLowerCase() === 'tiff') {
                    let imageRootDir = 'C:/ICR/image/MIG/MIG';
                    let result = sync.await(referenceCMD.convertTiftoJpgCMD(imageRootDir + resLegacyData[tiffile].FILEPATH, sync.defer()));
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
                let ocrResult = sync.await(referenceCMD.callApiOcr(convertFilpath, sync.defer()));
                //var ocrResult = sync.await(referenceCMD.proxyOcr(convertFilpath, sync.defer()));//-- 운영서버용
        
                if (ocrResult == "error") {
                    return done(null, "error ocr");
                }
                console.timeEnd("ocr : " + resLegacyData[tiffile].FILEPATH);
        
                //typo ML
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
        data[i].text = data[i].text.toLowerCase().replace("'", "`");
    }
    return data;
}
var cmdPythons = {
    mode: 'text',
    pythonPath: '',
    pythonOptions: ['-u'],
    scriptPath: 'C:/ICR/app/source/ml/typosentence',
    args: []
};

