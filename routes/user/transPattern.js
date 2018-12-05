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

    //BT_02
    if (reqArr.docCategory.DOCNAME == 'BT_02') {
        var temp;
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.text == 'OUTSTANDING LOSSES (100%) AS AT 30/09/2017 = HKD 15 910,350.39') {
                item.text = 'OUTSTANDING LOSSES (100%) AS AT 30/09/2017';
                item.colLbl = 7;
                temp = copyObject(item);
                temp.text = '15,910,350.39';
                temp.entryLbl = 2;
                temp.colLbl = 37;
            }
        }
        if (temp) {
            reqArr.data.push(temp);
        }
    }
    
    //TPRB_06
    //ex) 정답지엔 CLAIM의 엔트리가 1394.87이지만 ocr결과 출력값은 394.87일 경우.
    if (reqArr.docCategory.DOCNAME == 'TPRB_06') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 37) {
                if (item.text == 'I ,394.87') {
                    item.originText = item.text;
                    item.text = '1394.87';
                }
            }
        }
    }

    /****************************************
     * TALANX
     ****************************************/
    // TALANX_06
    //ex) 정답지엔 commission 엔트리값이 -0.05이지만 ocr결과 출력값은 o, 05 라고 출력되어 5라고 학습될 경우.
    if (reqArr.docCategory.DOCNAME == 'TALANX_06') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 37)// your reference
            {
                if (item.text == 'o, 05') {
                    item.originText = item.text;
                    item.text = '-0.05';
                }
            }
        }
    }

    /****************************************
     * SAVA
     ****************************************/
    // SAVA_01
    //ex) 정답지엔 our share의 엔트리가 0.84 이지만 ocr결과 출력값은 0,84 입니다.학습후 84로 출력될 경우.
    if (reqArr.docCategory.DOCNAME == 'SAVA_01') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 37)// your reference
            {
                if (item.text == '0,84') {
                    item.originText = item.text;
                    item.text = '0.84';
                }
            }
        }
    }

    /****************************************
     * HJ
     ****************************************/
    // HJ_03
    //ex) 정답지엔 premium -163  이지만 OCR결과 출력값은 (i 63)일 경우.
    if (reqArr.docCategory.DOCNAME == 'HJ_03') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35)// your reference
            {
                if (item.text == '(i 63)') {
                    item.originText = item.text;
                    item.text = '(163)';
                }
            }
        }
    }

     /****************************************
     * ED
     ****************************************/
    if (reqArr.docCategory.DOCNAME == 'ED_04') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 2 && item.text == '3RD QTR 20 n 7') {
                item.text = '3RD QTR 2017';
            }
        }
    }

    /****************************************
     * integro
     ****************************************/
    /*
    if (reqArr.docCategory.DOCNAME == 'integro_01') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 37) {
                item.text = item.text.replace(/,/, '');
            }
        }
    }
    */

    return reqArr;
}

function convertedUY(reqArr) {

    // 정답지엔 UY가 2016 이지만 OCR결과 16 PERIOD FROM 01-07-20 6 TO 30-06-2017 라고 출력되어 UY가 2017이 나올 경우.
    if (reqArr.docCategory.DOCNAME == 'JB_06') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 2) { // UY
                if (item.text == '16 PERIOD FROM 01-07-20 6 TO 30-06-2017') {
                    item.originText = item.text;
                    item.text = '16 PERIOD FROM 01-07-2016 TO 30-06-2017';
                }
            }
        }
    }

    // 정답지엔 UY가 2017 이지만 OCR결과 출력값은 2이7-07 일 경우.
    if (reqArr.docCategory.DOCNAME == 'COMMON') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 2) { // UY
                if (item.text == '2이7-07') {
                    item.originText = item.text;
                    item.text = '2017';
                }
            }
        }
    }

    //각 계산서별 UY값이 "01 Jan 16"와 같이 특수한 경우 UY값을 추출하는 로직.
    if (reqArr.docCategory.DOCNAME == 'MARSH_01' || reqArr.docCategory.DOCNAME == 'GUY_01' || reqArr.docCategory.DOCNAME == 'GUY_03') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];

            if (item.colLbl == 2) {
                var uyMonth = item.text.substring(3, 7);
                //Jan/Feb/Mar/Apr/May/Jun/Jul/Aug/Sept/Oct/Nov/Dec 일 경우에 그 값을 '20'으로 치환.
                if (uyMonth == "Jan " || uyMonth == "Feb " || uyMonth == "Mar " || uyMonth == "Apr " || uyMonth == "May " || uyMonth == "Jun " ||
                    uyMonth == "Jul " || uyMonth == "Aug " || uyMonth == "Sept " || uyMonth == "Oct " || uyMonth == "Nov " || uyMonth == "Dec ") {
                    item.originText = item.text; 
                    item.text = item.text.replace(item.text.substring(0, 7), '20');
                }
            }
        }
    }

    //각 계산서별 UY값이 "01/01/18 TO 31/12/18"와 같이 특수한 경우 UY값을 추출하는 로직.
    if (reqArr.docCategory.DOCNAME == 'GUY_04') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];

            if (item.colLbl == 2) {
                var uyMonth = item.text.substring(6, 7);
                //년도가 2000년도 이상일 경우에 그값을 '20'으로 치환
                if (Number(uyMonth) > 0) {
                    item.originText = item.text;
                    item.text = item.text.replace(item.text.substring(0, 6), '20');
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
     * AON
     ****************************************/
    // AON_22
    //ex) 정답지엔 your Reference가 881770 이지만 ocr결과 출력값은 881770 / SB 일 경우.
    if (reqArr.docCategory.DOCNAME == 'AON_22') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35)// your reference
            {
                if (item.text == '881770 / SB') {
                    item.originText = item.text;
                    item.text = '881770';
                }
            }
        }
    }

    /****************************************
     * JLT
     ****************************************/
    // JLT_05
    //ex) 정답지엔 your Reference가 JM1899944 이지만 ocr결과 출력값은 JMIB99944 일 경우.
    if (reqArr.docCategory.DOCNAME == 'JLT_05') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35)// your reference
            {
                if (item.text == 'JMIB99944') {
                    item.originText = item.text;
                    item.text = 'JM1899944';
                }
            }
        }
    }

    /****************************************
     * LOCKTON
     ****************************************/
    // LOCKTON_10
    //ex) 정답지엔 your Reference가 B12135MENAT1700042 이지만 ocr결과 출력값은 131235MF.NAT1700042 일 경우
    if (reqArr.docCategory.DOCNAME == 'LOCKTON_10') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35)// your reference
            {
                if (item.text == '131235MF.NAT1700042') {
                    item.originText = item.text;
                    item.text = 'B12135MENAT1700042';
                }
            }
        }
    }

    /****************************************
     * JB
     ****************************************/
    //JB_06
    //ex)정답지엔 your Reference가 1429324 SSD 이지만 ocr결과 출력값은 1429324 와 OUR REFERENCE SSD 일 경우.
    if (reqArr.docCategory.DOCNAME == 'JB_06') {
        var jbLength = 0;
        var jbText = [];
        var jbLocation = [];
        var jbResult;
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            jbLength += 1;
            if (item.colLbl && item.colLbl == 35) { // your reference
                item.originText = item.text;
                if (item.text == 'OUR REFERENCE SSD') {
                    item.text = ' SSD';
                }
                jbText.push(item.text);
                jbLocation.push(item.location);
            }
        }
        if (jbLength > 1) { // yourReference 가공.
            jbResult = jbText[0] + jbText[1];
        }
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35 && item.location == jbLocation[1]) {
                item.text = jbResult;
            } else if (item.colLbl && item.colLbl == 35 && item.location == jbLocation[0]) {
                item.colLbl = "38";
            }
        }
    }

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
    if (reqArr.docCategory.DOCNAME == 'GUY_01' || reqArr.docCategory.DOCNAME == 'GUY_03' || reqArr.docCategory.DOCNAME == 'GUY_04') {
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

    //GUY_04
    if (reqArr.docCategory.DOCNAME == 'GUY_04') {
        var guyLength = 0;
        var guyText = [];
        var guyLocation = [];
        var guyResult;
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            guyLength += 1;
            if (item.colLbl && item.colLbl == 35) { // your reference
                //정답지엔 your reference가 RAP0001 이지만 ocr결과 출력값은 /RAP 0001일 경우.
                if (item.text == '/RAP 0001') {
                    item.originText = item.text;
                    item.text = 'RAP0001';
                } else {
                    item.originText = item.text;
                    guyText.push(item.text);
                    guyLocation.push(item.location);
                }
            }
        }
        if (guyLength > 1) { // yourReference 가공.
            guyResult = guyText[0] + "/" + guyText[1];
        }
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35 && item.location == guyLocation[1]) {
                item.text = guyResult;
            } else if (item.colLbl && item.colLbl == 35 && item.location == guyLocation[0]) {
                item.colLbl = "38";
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
     * BUREAU_01
     ****************************************/

    //BUREAU_01
    if (reqArr.docCategory.DOCNAME == 'BUREAU_01') {
        var bureau01Length = 0;
        var bureau01Text = [];
        var bureau01Location = [];
        var bureau01Result;
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            bureau01Length += 1;
            if (item.colLbl && item.colLbl == 35) { // your reference
                item.originText = item.text;
                bureau01Text.push(item.text);
                bureau01Location.push(item.location);
            }
        }
        if (bureau01Length > 1) { // yourReference 가공.
            if (bureau01Text[0].substring(4) == 'B') {
                bureau01Result = bureau01Text[1] + bureau01Text[0].replace('/B', '8');
            } else {
                bureau01Result = bureau01Text[1] + bureau01Text[0].replace('/', '');
            }
        }
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35 && item.location ==  bureau01Location[1]) {
                item.text = bureau01Result;
            } else if (item.colLbl && item.colLbl == 35 && item.location ==  bureau01Location[0]) {
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
            if (item.colLbl && item.colLbl == 7) { // OSL(100%)
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

    //WILLIS_01
    //ex) 정답지엔 your rf값이 10215D18000001MDP 이지만 OCR결과 출력값은 10215D18 / OOOOOIMDP 로 출력.
    if (reqArr.docCategory.DOCNAME == 'WILLIS_08' || reqArr.docCategory.DOCNAME == 'WILLIS_09' || reqArr.docCategory.DOCNAME == 'WILLIS_10') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text.substring(8, 11) == ' / ') {
                    item.originText = item.text;
                    item.text = item.text.replace(' / ', "");
                    if (item.text.substring(8, 14) == 'OOOOOI') {
                        item.text = item.text.replace('OOOOOI', '000001');
                    } else if (item.text.substring(14, 15) == 'I') {
                        item.text = item.text.replace('00001 I', '000011');
                    } else if (item.text.substring(14, 15) == 'I') {
                        item.text = item.text.replace('00001I', '000011');
                    }
                }
            }
        }
    }

    //WILLIS_01, WILLIS_02, WILLIS_04
    //ex) Our Reference 131741417/ OOOOOIMDP -> 131741417OOOOOIMDP 로 변경하여 출력.
    if (reqArr.docCategory.DOCNAME == 'WILLIS_01' || reqArr.docCategory.DOCNAME == 'WILLIS_02' || reqArr.docCategory.DOCNAME == 'WILLIS_04') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text.indexOf('Our Reference') != -1) {
                    item.originText = item.text;
                    item.text = item.text.replace(/Our Reference/g, "").replace(/\//g, "").replace(/\s/gi, ""); // Our Reference 131741417/ OOOOOIMDP -> 131741417OOOOOIMDP
                }
                else if (item.text.indexOf('our Reference') != -1) {
                    item.originText = item.text;
                    item.text = item.text.replace(/our Reference/g, "").replace(/\//g, "").replace(/\s/gi, ""); // our Reference 131741417/ OOOOOIMDP -> 131741417OOOOOIMDP
                }
            }
        }
    }

    //WILLIS_02 - 계약명 따로 나오는 경우 하나로 합쳐주기
    if (reqArr.docCategory.DOCNAME == 'WILLIS_02') {
        var textList = [];
        var sumText = '';
        var count = 0;

        for (var i in reqArr.data) {
            var item = reqArr.data[i];

            if (item.colLbl && item.colLbl == 1) { // 계약명
                textList.push(item.text);
            }
        }

        for (var i in textList) {
            sumText += ' ' + textList[i];
        }
        for (var i in reqArr.data) {
            var item = reqArr.data[i];

            if (item.colLbl && item.colLbl == 1) { // 계약명
                if (count == 0) {
                    item.text = sumText;
                    count++;
                } else {
                    item.colLbl = 38;
                }
            }
        }

        for (var i in reqArr.data) {
            var item = reqArr.data[i];

            if (item.colLbl && item.colLbl == 1 && item.text.toLowerCase().indexOf("ins - 2nd surplus") > 0) { // 계약명
                item.text = 'INS - 2ND Surplus - Miami';
            }

            if (item.colLbl && item.colLbl == 1 && item.text.toLowerCase().indexOf("cooperat") > 0) { // 계약명
                item.text = 'Cooperators General - Property Quota Share and surplus Reinsurance Agreement';
            }
        }

    }

    //WILLIS_10
    if (reqArr.docCategory.DOCNAME == 'WILLIS_10') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.entryLbl && item.entryLbl == 31) { // Unknown
                //entryLbl이 31이면 PREMIUM entry인 4로 변환.
                item.entryLbl = 4;
            }
        }
    }

    //BT_04
    if (reqArr.docCategory.DOCNAME == 'BT_04') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 35 && item.text == 'TN029 2018') {
                item.text = 'TN029.2018';
            }
        }
    }

    /****************************************
     * NASCO
     ****************************************/
    // NASCO_03
    // ex) 정답지엔 your reference가 73 17 3354 이지만 ocr결과 출력값은 53 17 3354일 경우.
    if (reqArr.docCategory.DOCNAME == 'NASCO_03') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text == '53 17 3354') {
                    item.originText = item.text;
                    item.text = '73 17 3354';
                }
            }
        }
    }

    /****************************************
     * TURNER
     ****************************************/
    //TURNER_01
    //ex)정답지엔 your reference가 XKG30913/E/20 이지만 ocr결과 출력값은 XKG30913 과 / E/ 20 일 경우
    if (reqArr.docCategory.DOCNAME == 'TURNER_01') {
        var guyLength = 0;
        var guyText = [];
        var guyLocation = [];
        var guyResult;
        var ourShare;
        var ourShareCalEntry = []; // ourshare 계산 해야할 값들

        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                guyLength += 1;
                item.originText = item.text;
                guyText.push(item.text);
                guyLocation.push(item.location);
            } else if (item.colLbl && item.colLbl == 36) { // our share
                ourShare = item;
            } else if (item.colLbl && item.colLbl == 37
                && item.entryLbl && item.entryLbl == 4) { // premium entry
                ourShareCalEntry.push(item);
            }
        }
        if (guyLength > 1) { // yourReference 가공.
            guyResult = guyText[0] + guyText[1];
            for (var i in reqArr.data) {
                var item = reqArr.data[i];
                if (item.colLbl && item.colLbl == 35 && item.location == guyLocation[1]) {
                    item.text = guyResult;
                } else if (item.colLbl && item.colLbl == 35 && item.location == guyLocation[0]) {
                    item.colLbl = "38";
                }
            }
        } else if (guyLength == 1) {
            for (var i in reqArr.data) {
                var item = reqArr.data[i];
                if (item.colLbl && item.colLbl == 35) { // your reference
                    if (item.text == 'CTT152 / / 01') {
                        item.originText = item.text;
                        item.text = 'CTT152//01';
                    }
                }
            }
        }

        if (ourShare) {
            for (var i in ourShareCalEntry) {
                ourShareCalEntry[i].text = String(Number(Number(ourShareCalEntry[i].text) * (Number(ourShare.text) / 100)).toFixed(2));
            }
        }
    }


    /****************************************
     * TPRB
     ****************************************/
    // TPRB_02
    if (reqArr.docCategory.DOCNAME == 'TPRB_02') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            //ex) 정답지엔 your reference가 CEC201600017 이지만 ocr결과 출력값은 CEC20i60001? 일 경우
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text == 'CEC20i60001?') {
                    item.originText = item.text;
                    item.text = 'CEC201600017';
                }
            }
            //ex) 정답지엔 OSL(100 %) 엔트리가 67374.63 이지만 ocr결과 출력값은 675374363 일 경우
            if (item.entryLbl && item.entryLbl == 2) { // OSL(100%) entry
                if (item.text == '675374363') {
                    item.originText = item.text;
                    item.text = '67374.63';
                }
            }
        }
    }

    /****************************************
     * CHEDID
     ****************************************/
    if (reqArr.docCategory.DOCNAME == 'CHEDID_03') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 35 && item.text == 'Credit Note No.: 02/17/C/04895') {
                item.text = '02/17/C/04895';
            }
        }
    }

    if (reqArr.docCategory.DOCNAME == 'CHEDID_04') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 35 && item.text == 'Credit Note No.: 05/17/C/07921') {
                item.text = '05/17/C/07921';
            }
        }
    }

    if (reqArr.docCategory.DOCNAME == 'CHEDID_05') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 35 && item.text == 'Debit Note No.: 05/17/0/15800') {
                item.text = '05/17/D/15800';
            }
        }
    }

    if (reqArr.docCategory.DOCNAME == 'CHEDID_07') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 35 && item.text == 'Credit Note No.: 04/17/C/00093') {
                item.text = '04/17/C/00093';
            }
        }
    }

    if (reqArr.docCategory.DOCNAME == 'CHEDID_10') {
        var appendItem;
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 35 && item.text == 'Ref: 5/1217/0560 AC') {
                item.text = '05/17/D/20420';
            }
            if (item.text == 'Subject: Trade Union Insurance Company Treaties U/ W Year 2015.') {
                item.text = 'Trade Union Insurance Company';
                item.colLbl = 0;
                appendItem = copyObject(item);
                appendItem.text = '2015';
                appendItem.colLbl = 2;

            }
        }
        if (appendItem) {
            reqArr.data.push(appendItem);
        }
    }

    if (reqArr.docCategory.DOCNAME == 'CHEDID_13') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text == 'Credit Note No.: 05/18/C/01777') {
                    item.originText = item.text;
                    item.text = '05/18/C/01777';
                }
            }
        }
    }

    /****************************************
     * ED
     ****************************************/
    if (reqArr.docCategory.DOCNAME == 'ED_01') {
        var ourShare;
        var premiumEntry;
        var brokerageEntry;
        var yf = ''; //your reference text
        var yfCount = 0;

        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 35) {
                if (yfCount == 0) {
                    yf = item;
                } else {
                    yf.text += ' ' + item.text;
                    item.colLbl = 38;
                }
                yfCount++;
            } else if (item.colLbl == 36) { // our share
                ourShare = item;
            } else if (item.colLbl == 37) {
                if (item.entryLbl && item.entryLbl == 4) { // premium entry
                    premiumEntry = item;
                } else if (item.entryLbl && item.entryLbl == 11) { // brokerage entry
                    brokerageEntry = item;
                }
            }
        }

        if (ourShare && premiumEntry) {
            premiumEntry.text = '' + Number(Number(premiumEntry.text) * (Number(ourShare.text) / 100)).toFixed(2);
        }
        if (ourShare && brokerageEntry) {
            brokerageEntry.text = '' + Number(Number(brokerageEntry.text) * (Number(ourShare.text) / 100)).toFixed(2);
        }
    }

    if (reqArr.docCategory.DOCNAME == 'ED_04') {
        var ourShare;
        var oslEntry;

        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl == 36) {
                ourShare = item;
            } else if (item.colLbl == 37) {
                oslEntry = item;
            }
        }

        if (ourShare && oslEntry) {
            oslEntry.text = '' + Number(Number(oslEntry.text) * (Number(ourShare.text) / 100)).toFixed(2);
        }
    }

    /****************************************
     * MATRIX
     ****************************************/
    //MATRIX_04, MATRIX_07, MATRIX_11
    //ex) 정답지엔 your Reference가 CNXL00940/00 이지만 ocr결과 출력값은 Our Ref: CNXL00940/OO 일 경우.
    if (reqArr.docCategory.DOCNAME == 'MATRIX_04' || reqArr.docCategory.DOCNAME == 'MATRIX_07' || reqArr.docCategory.DOCNAME == 'MATRIX_11') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text.indexOf('Our Ref:') != -1) {
                    item.originText = item.text;
                    item.text = item.text.replace(/Our Ref:/g, "").trim(); // "Our Ref: CNXL00940/OO" -> CNXL00940/OO
                    if (item.text.substring(10, 12) == 'OO') { // "CNXL00940/OO" -> CNXL00940/00 or "CNXL00940/oo" -> CNXL00940/00
                        item.text = item.text.replace('OO', '00');
                    } else if (item.text.substring(10, 12) == 'oo') {
                        item.text = item.text.replace('oo', '00');
                    }

                } else if (item.text.indexOf('Our ref.:') != -1) { //정답지엔 your Reference가 CNTR00562/00/1/10 이지만 ocr결과 출력값은 Our ref.: CNTR00562/OO/1 일 경우.
                    item.originText = item.text;
                    item.text = item.text.replace(/Our ref.:/g, "").trim(); // "Our ref.: CNTR00562/OO/1" -> CNTR00562/OO/1
                    if (item.text.substring(10, 12) == 'OO') { // "CNTR00562/OO/1" -> CNTR00562/00/1 or "CNTR00562/oo/1" -> CNTR00562/00/1
                        item.text = item.text.replace('OO', '00');
                        if (item.text == 'CNTR00562/00/1') {
                            item.text = 'CNTR00562/00/1/10';
                        } else if (item.text == 'CNTR00563/00/2/ & 1/') {//정답지엔 your Reference가 CNTR00563/00/2/& 1 이지만 ocr결과 출력값은 Our ref.: CNTR00563/OO/2/ & 1/ 일 경우.
                            item.text = 'CNTR00563/00/2/& 1';
                        }
                    } else if (item.text.substring(10, 12) == 'oo') {
                        item.text = item.text.replace('oo', '00');
                    }
                }
            }
        }
    }

    /****************************************
     * APEX
     ****************************************/
    // APEX_01
    //ex) 정답지엔 your Reference가 APEX/BORD/2388 이지만 ocr결과 출력값은  . APEX/BORD/2378 일 경우.
    if (reqArr.docCategory.DOCNAME == 'APEX_01') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text == '. APEX/BORD/2378') {
                    item.originText = item.text;
                    item.text = 'APEX/BORD/2388';
                }
            }
        }
    }

    /****************************************
     * RFIB
     ****************************************/
    // RFIB_10
    //ex) 정답지엔 your Reference가 RAFSA1800631/001/001/3/1 이지만 ocr결과 출력값은 RAFSAI 800631/ 001/ / 3/1 일 경우.
    if (reqArr.docCategory.DOCNAME == 'RFIB_10') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text == 'RAFSAI 800631/ 001/ / 3/1') {
                    item.originText = item.text;
                    item.text = 'RAFSA1800631/001/001/3/1';
                }
            }
        }
    }

    //RFIB_11
    if (reqArr.docCategory.DOCNAME == 'RFIB_11') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text == 'RNMNTI 100116/ 027/ 002/ 1/2') {
                    item.originText = item.text;
                    item.text = 'RNMNT1100116/027/002/1/2';
                } else if (item.text == '04508/ 038/ 001/ 1/1') {
                    item.originText = item.text;
                    item.text = 'RMAMH1104508/038/001/1/1';
                }
            }
        }
    }

    /****************************************
     * OMAN
     ****************************************/
    // OMAN_09
    if (reqArr.docCategory.DOCNAME == 'OMAN_09') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text == 'Doc. No. : CNR1000215341 ,CNR100024593 ,DNR1000244462') {
                    item.originText = item.text;
                    item.text = 'CNRI000215341';
                }
            }
        }
    }

    // OMAN_13
    if (reqArr.docCategory.DOCNAME == 'OMAN_13') {
        for (var i in reqArr.data) {
            var item = reqArr.data[i];
            if (item.colLbl && item.colLbl == 35) { // your reference
                if (item.text == 'Doc. No.: CNR1000218628/DNR1000247867 .') {
                    item.originText = item.text;
                    item.text = 'CNRI000217960';
                }
            }
        }
    }

    return reqArr;
}

function copyObject(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    const copiedObj = obj.constructor();

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            copiedObj[key] = copyObject(obj[key]);
        }
    }

    return copiedObj;
}