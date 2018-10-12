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
    var cdnNm = req.body.cdnNm.replace(/ /g, "&#32;");
    var ctNm = req.body.ctNm.replace(/ /g, "&#32;");
    var brkNm = req.body.brkNm.replace(/ /g, "&#32;");

    var testData = `<? xml version = "1.0" encoding = "utf-8" ?>
        <Root>
            <Parameters>
                <Parameter id="gv_encryptToken" type="STRING">Vy3zFyENGINEx5F1zTyGIDx5FDEMO1zCy1538977070zPy86400zAy23zEyiGcouax2B8VWYvTGpTpGfriYx7AFx79ofx2FPQuPx2BQKaZoKevZt9rlgBrinl6bGLd37lNEQb9l3UF2Yi7KdaOlL6SXN57t24R6BCu6ci9x2Bs3MSkVc1SeWCtCX26FdQZ8CjeEmwnEmx2Bo9iVb46ZhNUoaMCB2QNXhtYIQLB1EgvXpOWx7AiOEtWsh8t4Mx2FZaOWR7TDLVUJx78mo4gZ8Q1Pi351WnNoMDUsfAx3Dx3DzKycdDADOKhSx7Aw0Ur5VCgEP9FDVx79s0qDNx78pnUNB8E3Wx78LoHcXOVQ2APc5DVwTabw1uex00x00x00x00x00zSSy00002471000zUURy226f595117d17c8czMykx79friwM6GDsx3Dz</Parameter>
                <Parameter id="WMONID" type="STRING"></Parameter>
                <Parameter id="lginIpAdr" type="STRING">111.222.333.444</Parameter>
                <Parameter id="userId" type="STRING">9999068</Parameter>
                <Parameter id="userEmpNo" type="STRING">9999068</Parameter>
                <Parameter id="userDeptCd" type="STRING">999999</Parameter>
                <Parameter id="frstRqseDttm" type="STRING"></Parameter>
                <Parameter id="rqseDttm" type="STRING"></Parameter>
                <Parameter id="lngeClsfCd" type="STRING">ko-kr</Parameter>
                <Parameter id="srnId" type="STRING"></Parameter>
                <Parameter id="rqseSrvcNm" type="STRING">koreanre.co.ct.commonct.svc.CtCommonCheckSvc</Parameter>
                <Parameter id="rqseMthdNm" type="STRING">readCtNoList</Parameter>
                <Parameter id="rqseVoNm" type="STRING">koreanre.co.ct.commonct.vo.CtCommonCheckVO</Parameter>
            </Parameters>
            <Dataset id="searchDvo">
                <ColumnInfo>
                    <Column id="cdnNm" type="STRING" size="150" />
                    <Column id="ctNm" type="STRING" size="150" />
                    <Column id="ttyYy" type="STRING" size="4" />
                    <Column id="brkNm" type="STRING" size="70" />
                </ColumnInfo>
                <Rows>
                    <Row>
                        <Col id="cdnNm">${cdnNm}</Col>
                        <Col id="ctNm">${ctNm}</Col>
                        <Col id="ttyYy">${req.body.ttyYy}</Col>
                        <Col id="brkNm">${brkNm}</Col>
                    </Row>
                </Rows>
            </Dataset>
            <Dataset id="ctNoList.outlist.meta">
                <ColumnInfo>
                    <Column id="ctNo" type="STRING" size="14" />
                    <Column id="ttyDtlNo" type="STRING" size="4" />
                    <Column id="cdnCd" type="STRING" size="6" />
                    <Column id="cdnNm" type="STRING" size="150" />
                    <Column id="ctNm" type="STRING" size="150" />
                    <Column id="ttyYy" type="STRING" size="4" />
                    <Column id="brkCd" type="STRING" size="6" />
                    <Column id="brkNm" type="STRING" size="70" />
                </ColumnInfo>
                <Rows>
                </Rows>
            </Dataset>
        </Root>`;		
    try {
        var res1 = request('POST', 'http://solomondev.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', { //해당 URL에 POST방식으로 값을 전달.
            headers: {
                'content-type': 'text/xml'
            },
            body: testData
        });
        var data = res1.getBody('utf8');
        if (data == null) {
            console.log("실패...");
        } else {
            var resultData1 = data.split("</Dataset>");
            var resultData2 = resultData1[1].split("<Rows>");
            var resultData3 = resultData2[1].split("<Row>");
            
        }
    }
    catch (e) {
        console.log(e);
    }
        


/*    if (req.body.gubun == "WF_ApprovalCancel" ||
        req.body.gubun == "WF_RemarkUpdate" ||
        req.body.gubun == "WF_Registration" ||
        req.body.gubun == "WF_ApprovalCheck" ||
        req.body.gubun == "WF_ReturnRegistration" ||
        req.body.gubun == "WF_AllReturnRegistration") {
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
    } else if (req.body.rqseMthdNm == "readCtNoList") {
        var reqQuerystring = querystring.stringify(req.body);  //querystring모듈을 사용하여 전달받은 req값을 QueryString 으로변환
        console.log(reqQuerystring);
        try {
            var res1 = request('POST', 'http://solomondev.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', { //해당 URL에 POST방식으로 값을 전달.
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
    else {
        console.log("실패~!!");
    }
*/
});
router.get('/favicon.ico', function (req, res) {
    res.send();
});
module.exports = router;
