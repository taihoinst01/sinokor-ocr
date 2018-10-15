var oracledb = require('oracledb');
var dbConfig = require('../../config/dbConfig.js');
var sync = require('../util/sync.js');
var oracle = require('../util/oracle.js');

module.exports = {
    trans: function (reqArr, done) {
        sync.fiber(function () {
            try {
                //UY
                reqArr = convertedUY(reqArr);
                //Entry
                reqArr = convertedEntry(reqArr);
                //Our Share
                reqArr = convertedOurShare(reqArr);
                //Currency Code
                reqArr = sync.await(convertedCurrencyCode(reqArr, sync.defer()));

                return done(null, reqArr);

            } catch (e) {
                console.log(e);
            }

        });        
    }
};

// UY outputs only year
function convertedUY(reqArr) {
    var pattern = /2\d\d\d/ig;

    for (var i in reqArr.data) {
        var item = reqArr.data[i];
        if (item.colLbl == 2 && pattern.test(item.text)) {
            var arr = item.text.match(pattern);
            var intArr = Math.min.apply(null, arr.map(Number));
            if (item.text != String(intArr)) {
                item.originText = item.text;
                item.text = String(intArr);
            }
        } else {
            //console.log("no");
        }
    }
    return reqArr;
}

function convertedEntry(reqArr) {
    var pattern = /O/gi;

    for (var i in reqArr.data) {
        var item = reqArr.data[i];
        if (item.colLbl == 37) {
            var convertText = String(item.text.replace(pattern, '0'));
            if (item.text != convertText) {
                item.originText = item.text;
                item.text = convertText;
            }
        } else {
            //console.log("no");
        }
    }

    pattern = /[^0-9\.]+/g;
    var isMinus;
    for (var i in reqArr.data) {
        isMinus = false;
        var item = reqArr.data[i];
        if (item.colLbl == 37 && pattern.test(item.text)) {
            if (item.text.indexOf('(') != -1 && item.text.indexOf(')') != -1) {
                isMinus = true;
            }
            var intArr = Number(item.text.replace(pattern, ''));
            if (item.text != String(intArr)) {
                item.originText = item.text;
                item.text = ((isMinus)? '-' : '' ) + String(intArr);
            }
        } else {
            //console.log("no");
        }
    }

    return reqArr;
}

function convertedOurShare(reqArr) {
    var pattern = /[^0-9\.]+/g;

    for (var i in reqArr.data) {
        var item = reqArr.data[i];
        if (item.colLbl == 36 && pattern.test(item.text)) {
            var intArr = Number(item.text.replace(pattern, ''));
            if (item.text != String(intArr)) {
                item.originText = item.text;
                item.text = String(intArr);
            }
        } else {
            //console.log("no");
        }
    }
    return reqArr;
}

function convertedCurrencyCode(reqArr, done) {
    sync.fiber(function () {
        try {
            for (var i in reqArr.data) {
                var item = reqArr.data[i];
                if (item.colLbl == 3) {
                    var curCds = sync.await(oracle.selectCurCd(item.text, sync.defer()));
                    if (item.text != curCds) {
                        item.originText = item.text;
                        item.text = curCds;
                    }
                }
            }
            return done(null, reqArr);
        } catch (e) {
            console.log(e);
        }

    });
}