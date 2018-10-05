'use strict';
var express = require('express');
var request = require('sync-request'); // 비동기방식 -> 동기방식
var querystring = require('querystring'); // JSON -> QueryString 변환

var router = express.Router();


/* GET home page. */
router.get('/', function (req, res) {
    res.render('user/wF_WorkflowProc');
});

router.post('/', function (req, res) {
    if (req.body.gubun == "WF_ApprovalCancel" ||
        req.body.gubun == "WF_RemarkUpdate" ||
        req.body.gubun == "WF_Registration" ||
        req.body.gubun == "WF_ApprovalCheck" ||
        req.body.gubun == "WF_ReturnRegistration" ||
        req.body.gubun == "WF_AllReturnRegistration" ) {
        var reqQuerystring = querystring.stringify(req.body);  //querystring모듈을 사용하여 전달받은 req값을 QueryString 으로변환
        console.log(reqQuerystring);
        try {
            var res1 = request('POST', 'http://127.0.0.1:8080/jmh_test/WF_WorkflowProc.jsp', { //해당 URL에 POST방식으로 값을 전달.
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: reqQuerystring
            });
            var data = res1.getBody('utf8');
            res.send(data.replace(/\r\n/g, '').trim());
        }
        catch (e) {
            console.log(e);
        }
    }
    else if (req.body.gubun == "WF_AllRegistration") {
        var reqQuerystring = querystring.stringify(req.body);  //querystring모듈을 사용하여 전달받은 req값을 QueryString 으로변환
        console.log(reqQuerystring);
        try {
            var res1 = request('POST', 'http://127.0.0.1:8080/jmh_test/WF_WorkflowProc.jsp', { //해당 URL에 POST방식으로 값을 전달.
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: reqQuerystring
            });
            var data = res1.getBody('utf8');
            var data2 = data.replace(/\r\n/g, '').trim();
            var data3 = data2.split('^');

            var resultData = [];
            for (var i = 0; i < data3.length; i++) {
                var data4 = data3[i].split('|');
                var data5 = {
                    'laProId': data4[0],
                    'resultInt': data4[1]
                }
                resultData.push(data5);
            }
            res.send(resultData);
        }
        catch (e) {
            console.log(e);
        }
    } else if (req.body.gubun == "WF_GetAllApprovalList") {
        var reqQuerystring = querystring.stringify(req.body);  //querystring모듈을 사용하여 전달받은 req값을 QueryString 으로변환
        console.log(reqQuerystring);
        try {
            var res1 = request('POST', 'http://127.0.0.1:8080/jmh_test/WF_WorkflowProc.jsp', { //해당 URL에 POST방식으로 값을 전달.
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: reqQuerystring
            });
            var data = res1.getBody('utf8');
            var data2 = data.replace(/\r\n/g, '').trim();
            var data3 = data2.split('^');

            var resultData = [];
            for (var i = 0; i < data3.length; i++) {
                var data4 = data3[i].split('|');
                var data5 = {
                    'imgId': data4[0],
                    'gdCd': data4[1],
                    'prcsEmpNo': data4[2],
                    'ldcoCd': data4[3],
                    'plcyNo': data4[4],
                    'ttyYrmm': data4[5],
                    'lsdt': data4[6],
                    'colCd': data4[7],
                    'acdnPlcCd': data4[8],
                    'prssDvCd': data4[9],
                    'curCd': data4[10],
                    'orgCla': data4[11],
                    'iwdCla': data4[12],
                    'imgFileStNo': data4[13],
                    'imgFileEndNo': data4[14],
                    'ctrNm': data4[15],
                    'acDvCd': data4[16],
                    'insStDt': data4[17],
                    'insEndDt': data4[18],
                    'orgPre': data4[19],
                    'iwdPre': data4[20],
                    'com': data4[21],
                    'appYrmm': data4[22],
                    'saOcrnSno': data4[23],
                    'ctNm': data4[24],
                    'ctYy': data4[25],
                    'fy': data4[26],
                    'saOcrnCycCd': data4[27],
                    'preTta': data4[28],
                    'comTta': data4[29],
                    'preBal': data4[30],
                    'cla': data4[31],
                    'ntbl': data4[32],
                    'pfcom': data4[33],
                    'prrsCf': data4[34],
                    'prrsRls': data4[35],
                    'lsresCf': data4[36],
                    'lsresRls': data4[37],
                    'osl': data4[38],
                    'cas': data4[39],
                    'ctNo': data4[40],
                    'cdnNm': data4[41],
                    'epiCtsActPreRto': data4[42],
                    'epiClcRmk': data4[43],
                    'osl2': data4[44]
                }
                resultData.push(data5);
            }
            res.send(resultData);
        }
        catch (e) {
            console.log(e);
        }
    }
    else {
        console.log("실패~!!");
    }

});
router.get('/favicon.ico', function (req, res) {
    res.send();
});
module.exports = router;
