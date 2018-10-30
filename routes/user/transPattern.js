var oracledb = require('oracledb');
var dbConfig = require('../../config/dbConfig.js');
var sync = require('../util/sync.js');
var oracle = require('../util/oracle.js');

module.exports = {

    trans: function (reqArr, done) {

        sync.fiber(function () {
            try {
                //Specific documents Before treatment
                reqArr = convertedSpecificDocumentsBefore(reqArr);
                //UY
                reqArr = convertedUY(reqArr);
                //Entry
                reqArr = sync.await(convertedEntry(reqArr, sync.defer()));
                //Our Share
                reqArr = convertedOurShare(reqArr);
                //Currency Code
                reqArr = sync.await(convertedCurrencyCode(reqArr, sync.defer()));
                //Specific documents After treatment
                reqArr = convertedSpecificDocumentsAfter(reqArr);

                return done(null, reqArr);

            } catch (e) {
                console.log(e);
            }

        });        
    }
};

function convertedSpecificDocumentsBefore(reqArr) {
    //COSMOS
    if (reqArr.docCategory.DOCNAME == 'COSMOS') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 37 && item.text.toUpperCase().indexOf('CR') == -1) {
                item.text += 'DR';
            }
        }
    }

    return reqArr;
}

function convertedUY(reqArr) {
    // UY outputs only year START
    var pattern = /20\d\d/ig;
    var lastPattern = /19\d\d/ig;

    for (var i in reqArr.data) {
        var item = reqArr.data[i];

        if (item.colLbl == 2) {
            var arr;
            if (pattern.test(item.text)) {
                arr = item.text.match(pattern);
                var intArr = Math.min.apply(null, arr.map(Number));
                if (item.text != String(intArr)) {
                    item.originText = item.text;
                    item.text = String(intArr);
                }
            } else if (lastPattern.test(item.text)) {
                arr = item.text.match(lastPattern);
                var intArr = Math.min.apply(null, arr.map(Number));
                if (item.text != String(intArr)) {
                    item.originText = item.text;
                    item.text = String(intArr);
                }
            } else {
                item.colLbl = 38;
            }
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
            var isContrary;
            var units = sync.await(oracle.selectEntryMappingUnit(sync.defer()));

            for (var i in reqArr.data) {
                isMinus = false;
                isContrary = false;
                var item = reqArr.data[i];
                if (item.colLbl == 37 && pattern.test(item.text)) {
                    if (item.text.indexOf('(') != -1 && item.text.indexOf(')') != -1) {
                        isMinus = true;
                    } else if (item.text.toUpperCase().indexOf('CR') != -1 || item.text.toUpperCase().indexOf('DR') != -1) {
                        for (var j in units) {
                            if (units[j].COLNUM == item.entryLbl) {
                                if ((item.text.toUpperCase().indexOf('CR') != -1 && units[j].CREDIT == '-')
                                    || (item.text.toUpperCase().indexOf('DR') != -1 && units[j].DEBIT == '-')) {
                                    isContrary = true;
                                }
                            }
                        }
                    }
                    var intArr = Number(item.text.replace(pattern, ''));
                    if (item.text != String(intArr)) {
                        item.originText = item.text;
                        item.text = ((isMinus) ? '-' : '') + String(intArr);
                        if (isContrary) {
                            if (Number(item.text) > 0) {
                                item.text = '-' + item.text;
                            } else {
                                item.text = item.text.replace(/-/gi, '');
                            }
                        }
                        
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

function convertedSpecificDocumentsAfter(reqArr) {
    // BT
    if (reqArr.docCategory.DOCNAME == 'BT') {
        var yourShare;
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 36) { // Our Share Label
                yourShare = item.text;
            }
        }
        if (yourShare) {
            for (var i in reqArr.data) {
                var oslLocation;
                var oslMappingSid;
                var oslSid;
                var oslText;
                var entryLbl;
                var text;
                var item = reqArr.data[i];
                if (item.entryLbl && item.entryLbl == 2) { // OSL(100%) entry
                    oslLocation = item.location;
                    oslMappingSid = item.mappingSid;
                    oslSid = item.sid;
                    oslText = item.text;
                    entryLbl = 3;
                    text = String(Number(Number(oslText) * (Number(yourShare) / 100)).toFixed(2));
                } else if (item.entryLbl && item.entryLbl == 4) { // PREMIUM entry
                    oslLocation = item.location;
                    oslMappingSid = item.mappingSid;
                    oslSid = item.sid;
                    oslText = item.text;
                    entryLbl = 4;
                    item.text = String(Number(Number(oslText) * (Number(yourShare) / 100)).toFixed(2));
                } else if (item.entryLbl && item.entryLbl == 9) { // COMMISSION entry
                    oslLocation = item.location;
                    oslMappingSid = item.mappingSid;
                    oslSid = item.sid;
                    oslText = item.text;
                    entryLbl = 9;
                    item.text = String(Number(Number(oslText) * (Number(yourShare) / 100)).toFixed(2));
                } else if (item.entryLbl && item.entryLbl == 11) { // BROKERAGE entry
                    oslLocation = item.location;
                    oslMappingSid = item.mappingSid;
                    oslSid = item.sid;
                    oslText = item.text;
                    entryLbl = 11;
                    item.text = String(Number(Number(oslText) * (Number(yourShare) / 100)).toFixed(2));
                } else if (item.entryLbl && item.entryLbl == 19) { // CLAIM entry
                    oslLocation = item.location;
                    oslMappingSid = item.mappingSid;
                    oslSid = item.sid;
                    oslText = item.text;
                    entryLbl = 19;
                    item.text = String(Number(Number(oslText) * (Number(yourShare) / 100)).toFixed(2));
                } else if (item.colLbl == 35) {
                    if (isNaN(item.text)) {
                        item.colLbl = 38;
                    }
                }
            }
                if (oslText && yourShare) {
                reqArr.data.push({
                    'entryLbl': entryLbl,
                    'text': text,
                    'colLbl': 37,
                    'location': oslLocation,
                    'colAccu': 0.99,
                    'mappingSid': oslMappingSid,
                    'sid': oslSid
                });
            }

        }

    }
    
    //CATHAY
    if (reqArr.docCategory.DOCNAME == 'CATHAY_01' || reqArr.docCategory.DOCNAME == 'CATHAY_02' || reqArr.docCategory.DOCNAME == 'CATHAY_03') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                var text = item.text.split('-'); // "OP2018000G-O"
                var isChange = false;
                // 한글 ㅇ, 영문 o, O 를 숫자 0으로 변경
                if (text[1] == 'o' || text[1] == 'O' || text[1] == 'ㅇ') {
                    text[1] = '0';
                    isChange = true;
                }

                // 정답: OP20180006-0, OCR: OP2018000G-O 
                // G를 6으로 변경
                if (text[0].substr(2, 8).indexOf('G') != -1) {
                    text[0] = text[0].substr(0, 2) + text[0].substr(2, 8).replace(/G/g, 6);
                    isChange = true;
                }

                if (isChange == true) {
                    item.originText = item.text;
                    //변경된 값들 다시 합치기
                    item.text = text[0] + '-' + text[1];
                }
            }
        }
    }

    //MARSH
    if (reqArr.docCategory.DOCNAME == 'MARSH_01') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text.indexOf('InvoiceNo') != -1) {
                    item.originText = item.text;
                    item.text = item.text.replace(/InvoiceNo.:/g, "").trim(); // "InvoiceNo.: 2108581" -> 2108581
                }
            }
        }
    }

    //WIS
    if (reqArr.docCategory.DOCNAME == 'WIS_07') { 
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text.indexOf('Tran No:') != -1) {
                    item.originText = item.text;
                    item.text = item.text.replace(/Tran No:/g, "").trim(); // "Tran No: 587326-565839" -> 587326-565839
                }
            }
        }
    }

    //GUY
    if (reqArr.docCategory.DOCNAME == 'GUY_01' || reqArr.docCategory.DOCNAME == 'GUY_04') { 
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text.indexOf(':') != -1) {
                    item.originText = item.text;
                    item.text = item.text.split(':')[1].trim(); // nvoce No.: 2110347 -> 2110347
                } else if (item.text.indexOf('.') != -1) {
                    item.originText = item.text;
                    item.text = item.text.split('.')[1].trim(); //INVOICE NO. 5379052 -> 5379052
                }
            }
        }
    }

    //WILLIS
    if (reqArr.docCategory.DOCNAME == 'WILLIS_01' || reqArr.docCategory.DOCNAME == 'WILLIS_02' || reqArr.docCategory.DOCNAME == 'WILLIS_04') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text.indexOf('Our Reference') != -1) {
                    item.originText = item.text;
                    item.text = item.text.replace(/Our Reference/g, "").replace(/\//g, "").replace(/\s/gi, ""); // Our Reference 131741417/ OOOOOIMDP -> 131741417OOOOOIMDP
                }
            }
        }
    }

    return reqArr;
}