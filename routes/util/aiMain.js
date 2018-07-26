var appRoot = require('app-root-path').path;

exports.typoSentenceEval = function (data, callback) {
    setTimeout(function () {
        throw new Error('unexpected error in typo ML model');
    }, 2000);
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

function dataToArgs(data) {

    var args = '';
    for (var i = 0; i < data.length; i++) {
        args += '"' + data[i].text.toLowerCase() + '"' + ' ';
    }

    return args;
}