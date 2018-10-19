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
                reqArr = sync.await(convertedEntry(reqArr, sync.defer()));
                //Our Share
                reqArr = convertedOurShare(reqArr);
                //Currency Code
                reqArr = sync.await(convertedCurrencyCode(reqArr, sync.defer()));
                //Specific documents
                reqArr = convertedSpecificDocuments(reqArr);
                return done(null, reqArr);

            } catch (e) {
                console.log(e);
            }

        });        
    }
};


function convertedUY(reqArr) {
    // UY outputs only year START
    var pattern = /20\d\d/ig;
    var lastPattern = /19\d\d/ig;

    for (var i in reqArr.data) {
        var item = reqArr.data[i];

        if (item.colLbl == 2) {
            if (pattern.test(item.text) || lastPattern.test(item.text)) {
                var arr;
                if (pattern.test(item.text)) {
                    arr = item.text.match(pattern);
                } else {
                    arr = item.text.match(lastPattern);
                }
                var intArr = Math.min.apply(null, arr.map(Number));
                if (item.text != String(intArr)) {
                    item.originText = item.text;
                    item.text = String(intArr);
                }
            } else {
                item.colLbl = 38;
            }
        } else {
        }
    }
    // UY outputs only year END
    return reqArr;
}

function convertedEntry(reqArr, done) {
    sync.fiber(function () {
        try {
            // convert char to number START
            var pattern = /O/gi;

            for (var i in reqArr.data) {
                var item = reqArr.data[i];
                if (item.colLbl == 37) {
                    var convertText = String(item.text.replace(/ /gi, '').replace(pattern, '0'));
                    if (item.text != convertText) {
                        item.originText = item.text;
                        item.text = convertText;
                    }
                } else {
                }
            }
            // convert char to number END

            // remove characters , convert to - or + START
            pattern = /[^0-9\.]+/g;
            var isMinus;
            var isPlus;
            var units = sync.await(oracle.selectEntryMappingUnit(sync.defer()));

            for (var i in reqArr.data) {
                isMinus = false;
                isPlus = false;
                var item = reqArr.data[i];
                if (item.colLbl == 37 && pattern.test(item.text)) {
                    if (item.text.indexOf('(') != -1 && item.text.indexOf(')') != -1) {
                        isMinus = true;
                    } else if (item.text.indexOf('CR') != -1 || item.text.indexOf('DR') != -1) {
                        for (var j in units) {
                            if (units[i].COLNUM == item.entryLbl) {
                                if ((item.text.indexOf('CR') != -1 && units[i].CREDIT == '-')
                                    || (item.text.indexOf('DR') != -1 && units[i].DEBIT == '-')) {
                                    isMinus = true;
                                } else if ((item.text.indexOf('CR') != -1 && units[i].CREDIT == '+')
                                    || (item.text.indexOf('DR') != -1 && units[i].DEBIT == '+')){
                                    isPlus = true;
                                }
                            }
                        }
                    }
                    var intArr = Number(item.text.replace(pattern, ''));
                    if (item.text != String(intArr)) {
                        item.originText = item.text;
                        item.text = ((isMinus) ? '-' : '') + String(intArr);
                        item.text = ((isPlus) ? '+' : '') + String(intArr);
                    }
                } else {
                }
            }
            // remove characters , convert to - or + END

        } catch (e) {
            console.log(e);
        } finally {
            return done(null, reqArr);
        }
    });   
}

function convertedOurShare(reqArr) {
    // remove characters START
    var pattern = /[^0-9\.]+/g;

    for (var i in reqArr.data) {
        var item = reqArr.data[i];
        if (item.colLbl == 36 && pattern.test(item.text)) {
            var intArr = Number(item.text.replace(/ /gi,'').replace(pattern, ''));
            if (item.text != String(intArr)) {
                item.originText = item.text;
                item.text = String(intArr);
            }
        } else {
        }
    }
    // remove characters END

    return reqArr;
}

function convertedCurrencyCode(reqArr, done) {
    sync.fiber(function () {
        try {

            // convert currency code to DB data START
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
            // convert currency code to DB data END
            
        } catch (e) {
            console.log(e);
        } finally {
            return done(null, reqArr);
        }

    });
}

function convertedSpecificDocuments(reqArr) {
    // BT
    if (reqArr.docCategory.DOCNAME == 'BT') {
        var oslLocation;
        var oslMappingSid;
        var oslSid;
        var oslText;
        var yourShare;
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.entryLbl && item.entryLbl == 2) { // OSL(100%) entry
                oslLocation = item.location;
                oslMappingSid = item.mappingSid;
                oslSid = item.sid;
                oslText = item.text;
            } else if (item.colLbl == 36) { // Our Share Label
                yourShare = item.text;
            }
        }

        if (oslText && yourShare) {
            reqArr.data.push({
                'entryLbl': 3,
                'text': String(Number(Number(oslText) * (Number(yourShare) / 100)).toFixed(2)),
                'colLbl': 37,
                'location': oslLocation,
                'colAccu': 0.99,
                'mappingSid': oslMappingSid,
                'sid': oslSid
            });
        }

    }

    return reqArr;
}