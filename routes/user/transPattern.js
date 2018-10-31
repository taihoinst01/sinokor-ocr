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

    //각 계산서별 UY값이 "01 Jan 16"와 같이 특수한 경우 UY값을 추출하는 로직.
    if (reqArr.docCategory.DOCNAME == 'MARSH_01' || reqArr.docCategory.DOCNAME == 'GUY_01' || reqArr.docCategory.DOCNAME == 'GUY_03') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];

            if (item.colLbl == 2) {
                var uyResult = item.text.substring(3, 7);
                //Jan/Feb/Mar/Apr/May/Jun/Jul/Aug/Sept/Oct/Nov/Dec 일 경우에 그 값을 '20'으로 치환.
                if (uyResult == "Jan " || uyResult == "Feb " || uyResult == "Mar " || uyResult == "Apr " || uyResult == "May " || uyResult == "Jun " ||
                    uyResult == "Jul " || uyResult == "Aug " || uyResult == "Sept " || uyResult == "Oct " || uyResult == "Nov " || uyResult == "Dec ") {
                    item.originText = item.text; 
                    item.text = item.text.replace(item.text.substring(0, 7), '20');
                }
            }
        }
    }

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

    /****************************************
     * BT
     ****************************************/
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

    //BT_06
    if (reqArr.docCategory.DOCNAME == 'BT_06') {
        var oslLocation;
        var oslMappingSid;
        var oslSid;
        var bt06OslText; //OSL text
        var bt06Curcd; //화폐코드 text
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 7) { //OSL(100%)
                oslLocation = item.location;
                oslMappingSid = item.mappingSid;
                oslSid = item.sid;
                // 해당 OSL(100%)에서 화폐코드값을 추출.
                bt06OslText = item.text.slice(0, -3);
                bt06Curcd = item.text.slice(bt06OslText.length);
            }
        }
        if (bt06Curcd) {
            reqArr.data.push({
                'text': bt06Curcd,
                'colLbl': 3,
                'location': oslLocation,
                'colAccu': 0.99,
                'mappingSid': oslMappingSid,
                'sid': oslSid
            });
        }
    }

    /****************************************
     * MARSH
     ****************************************/

    //MARSH_01
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

    //MARSH_02
    if (reqArr.docCategory.DOCNAME == 'MARSH_02') {
        var marsh02Length = 0;
        var marsh02Text = [];
        var marsh02Location = [];
        var marsh02Result;
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            marsh02Length += 1;
            if (item.colLbl && item.colLbl == 35) { // your reference
                item.originText = item.text;
                marsh02Text.push(item.text);
                marsh02Location.push(item.location);
            }
        }
        if (marsh02Length > 1) { // yourReference 가공.
            marsh02Result = marsh02Text[1] + "/" + marsh02Text[0].replace('/ ', ' 00');
        }
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35 && item.location == marsh02Location[1]) {
                item.text = marsh02Result;
            } else if (item.colLbl && item.colLbl == 35 && item.location == marsh02Location[0]) {
                item.colLbl = "38";
            }
        }
    }

    //MARSH_06
    if (reqArr.docCategory.DOCNAME == 'MARSH_06') {
        var marsh06Length = 0;
        var marsh06Location;
        var marsh06MappingSid;
        var marsh06Sid;
        var marsh06Text = '';
        var item;
        for (var i in reqArr.data) {
            item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                marsh06Length += 1
                marsh06Location = item.location;
                marsh06MappingSid = item.mappingSid;
                marsh06Sid = item.sid;
                marsh06Text += item.text;
                if (marsh06Text == item.text) {
                    item.location = '';
                }
                item.text = marsh06Text;
            }
        }
        for (var i in reqArr.data) {
            item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35 && item.location == '') {
                reqArr.data.splice(i, 1)
            }
        }
    }

    /****************************************
     * GUY
     ****************************************/

    //GUY_01, GUY_04
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

    //GUY_05
    if (reqArr.docCategory.DOCNAME == 'GUY_05') {
        var guy05Length = 0;
        var guy05Text = [];
        var guy05Location = [];
        var guy05Result;
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            guy05Length += 1;
            if (item.colLbl && item.colLbl == 35) { // your reference
                item.originText = item.text;
                guy05Text.push(item.text);
                guy05Location.push(item.location);
            }
        }
        if (guy05Length > 1) { // yourReference 가공.
            if (guy05Text[0].substring(4) == 'B') {
                guy05Result = guy05Text[1] + guy05Text[0].replace('/B', '8');
            } else {
                guy05Result = guy05Text[1] + guy05Text[0].replace('/', '');
            }
        }
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35 && item.location == guy05Location[1]) {
                item.text = guy05Result;
            } else if (item.colLbl && item.colLbl == 35 && item.location == guy05Location[0]) {
                item.colLbl = "38";
            }
        }
    }

    /****************************************
     * CATHAY
     ****************************************/

    //CATHAY_01,CATHAY_02, CATHAY_03,
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

    /****************************************
     * WIS
     ****************************************/

    //WIS_07
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

    // WIS_05
    /**
     * 문제: OSL(100%) 레이블과 엔트리를 한문장으로 인식
     * 해결: OSL(100%) 레이블과 엔트리를 분리해서 OSL(100%) 엔트리값과 OSL(ourshare)값을 구해서 배열에 추가 
     **/
    if (reqArr.docCategory.DOCNAME == 'WIS_05') {

        var yourShare;
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 36) { // Our Share Label
                yourShare = Number(item.text) / 100;
            }

        }

        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 7) { // your reference
                var osl100Entry = 0;
                var pattern = /\d*[.]{1}\d{2}/ig; // 문자열중 . 을 포함한 숫자
                var numArr = item.text.replace(/,/g, "").match(pattern);
                //console.log(numArr);

                //OSL(100%) 엔트리값 구하기
                for (var i in numArr) {
                    osl100Entry += Number(numArr[i]);
                }

                //OSL(100%) 엔트리값 추가
                reqArr.data.push({
                    'entryLbl': 2,
                    'text': String(osl100Entry.toFixed(2)),
                    'colLbl': 37,
                    'location': item.location,
                    'colAccu': 0.99,
                    'mappingSid': item.mappingSid,
                    'sid': item.sid
                });

                //OSL(Our Share) 엔트리값 추가
                if (yourShare) {
                    reqArr.data.push({
                        'entryLbl': 3,
                        'text': String((osl100Entry * yourShare).toFixed(2)),
                        'colLbl': 37,
                        'location': item.location,
                        'colAccu': 0.99,
                        'mappingSid': item.mappingSid,
                        'sid': item.sid
                    });
                }
            }
        }
    }



    /****************************************
     * WILLIS
     ****************************************/

    //WILLIS_01, WILLIS_02, WILLIS_04,
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