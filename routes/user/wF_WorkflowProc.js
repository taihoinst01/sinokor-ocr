'use strict';
var express = require('express');
var request = require('sync-request'); // 비동기방식 -> 동기방식
var querystring = require('querystring'); // JSON -> QueryString 변환
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var sync = require('../util/sync.js');
var oracle = require('../util/oracle.js');

var router = express.Router();


/* GET home page. */
router.get('/', function (req, res) {
    res.render('user/wF_WorkflowProc');
});

router.post('/', function (req, res) {
    var cdnNm = req.body.cdnNm.replace(/ /g, "&#32;");
    var ctNm = req.body.ctNm.replace(/ /g, "&#32;");
    //var brkNm = req.body.brkNm.replace(/ /g, "&#32;");
    var brkNm = '';

    var testData = 
        '<? xml version = "1.0" encoding = "utf-8" ?>'+
        '<Root>'+
            '<Parameters>'+
                '<Parameter id="gv_encryptToken" type="STRING">Vy3zFyENGINEx5F1zTyGIDx5FDEMO1zCy1539564980zPy86400zAy23zEyP7D2Wpx2Bf0dkRRoplRJmZ0Q3Za7WHjeSKx78rg3x78rcDe0bGsQMsAlvwOn7rqK48NEQpA8pi2x7A0PVVN0NZg4x7As0RJFx79YbNw0MoHnIx7Aj7x797CB8bx7A0QYP68D763IdCx2FEWx79UXEIVT6TgScx7A64SUjXXf55fMVMbaUfQ2frENHx2BPtQf2A81Px79GGIt6dB5uQ1D8x7AWjAR9KuA5KfjGOgZjbSDbkqGnPGAx3Dx3DzKyF8x78ICfDirBJ4BDeVx78e5S1x7AaUSDYhrZlx79Wbl1x78FbugXOagNG0cfIx787hj2x78Hd33QDbx00x00x00x00x00zSSy00002479000zUURy1f9d134b0e195793zMyfsNjWrhSdZkx3Dz</Parameter>'+
                '<Parameter id="WMONID" type="STRING"></Parameter>'+
                '<Parameter id="lginIpAdr" type="STRING">111.222.333.444</Parameter>' +
                '<Parameter id="userId" type="STRING">9999068</Parameter>' +
                '<Parameter id="userEmpNo" type="STRING">9999068</Parameter>' +
                '<Parameter id="userDeptCd" type="STRING">999999</Parameter>' +
                '<Parameter id="frstRqseDttm" type="STRING"></Parameter>' +
                '<Parameter id="rqseDttm" type="STRING"></Parameter>' +
                '<Parameter id="lngeClsfCd" type="STRING">ko-kr</Parameter>' +
                '<Parameter id="srnId" type="STRING"></Parameter>' +
                '<Parameter id="rqseSrvcNm" type="STRING">koreanre.co.ct.commonct.svc.CtCommonCheckSvc</Parameter>' +
                '<Parameter id="rqseMthdNm" type="STRING">readCtNoList</Parameter>' +
                '<Parameter id="rqseVoNm" type="STRING">koreanre.co.ct.commonct.vo.CtCommonCheckVO</Parameter>' +
        '</Parameters>' +
    '<Dataset id="searchDvo">' +
    '<ColumnInfo>' +
    '<Column id="cdnNm" type="STRING" size="150" />' +
    '<Column id="ctNm" type="STRING" size="150" />' +
    '<Column id="ttyYy" type="STRING" size="4" />' +
    '<Column id="brkNm" type="STRING" size="70" />' +
    '</ColumnInfo>' +
    '<Rows>' +
    '<Row>' +
    '<Col id="cdnNm">'+cdnNm+'</Col>' +
        '<Col id="ctNm">'+ctNm+'</Col>' +
            '<Col id="ttyYy">' +req.body.ttyYy+'</Col>' +
                '<Col id="brkNm">' +brkNm+'</Col>' +
    '</Row>' +
    '</Rows>' +
    '</Dataset>' +
    '<Dataset id="ctNoList.outlist.meta">' +
    '<ColumnInfo>' +
    '<Column id="ctNo" type="STRING" size="14" />' +
    '<Column id="ttyDtlNo" type="STRING" size="4" />' +
    '<Column id="cdnCd" type="STRING" size="6" />' +
    '<Column id="cdnNm" type="STRING" size="150" />' +
    '<Column id="ctNm" type="STRING" size="150" />' +
    '<Column id="ttyYy" type="STRING" size="4" />' +
    '<Column id="brkCd" type="STRING" size="6" />' +
    '<Column id="brkNm" type="STRING" size="70" />' +
    '</ColumnInfo>' +
    '<Rows>' +
    '</Rows>' +
    '</Dataset>' +
        '</Root>';
    //console.log(testData);
    try {
        /*
        var res1 = request('POST', 'http://solomondev.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', { //해당 URL에 POST방식으로 값을 전달.
            headers: {
                'content-type': 'text/xml'
            },
            body: testData
        });
        var data = res1.getBody('utf8');
        */

        //TEST DATA
        var data = `
<?xml version="1.0" encoding="UTF-8" ?>	
<Root xmlns="http://www.tobesoft.com/platform/dataset" ver="5000">	
    <Parameters>
        <Parameter id="gv_encryptToken" type="string">Vy3zFyENGINEx5F1zTyGIDx5FDEMO1zCy1538977070zPy86400zAy23zEyiGcouax2B8VWYvTGpTpGfriYx7AFx79ofx2FPQuPx2BQKaZoKevZt9rlgBrinl6bGLd37lNEQb9l3UF2Yi7KdaOlL6SXN57t24R6BCu6ci9x2Bs3MSkVc1SeWCtCX26FdQZ8CjeEmwnEmx2Bo9iVb46ZhNUoaMCB2QNXhtYIQLB1EgvXpOWx7AiOEtWsh8t4Mx2FZaOWR7TDLVUJx78mo4gZ8Q1Pi351WnNoMDUsfAx3Dx3DzKycdDADOKhSx7Aw0Ur5VCgEP9FDVx79s0qDNx78pnUNB8E3Wx78LoHcXOVQ2APc5DVwTabw1uex00x00x00x00x00zSSy00002471000zUURy226f595117d17c8czMykx79friwM6GDsx3Dz</Parameter>	
        <Parameter id="WMONID" type="string"/>	
        <Parameter id="lginIpAdr" type="string">111.222.333.444</Parameter>	
        <Parameter id="userId" type="string">9999068</Parameter>	
        <Parameter id="userEmpNo" type="string">9999068</Parameter>	
        <Parameter id="userDeptCd" type="string">999999</Parameter>	
        <Parameter id="frstRqseDttm" type="datetime">20181008144649777</Parameter>	
        <Parameter id="rqseDttm" type="datetime">20181008144649777</Parameter>	
        <Parameter id="lngeClsfCd" type="string">ko-kr</Parameter>	
        <Parameter id="srnId" type="string"/>	
        <Parameter id="rqseSrvcNm" type="string">koreanre.co.ct.commonct.svc.CtCommonCheckSvc</Parameter>	
        <Parameter id="rqseMthdNm" type="string">readCtNoList</Parameter>	
        <Parameter id="rqseVoNm" type="string">koreanre.co.ct.commonct.vo.CtCommonCheckVO</Parameter>	
        <Parameter id="ctDetlSno" type="int">0</Parameter>	
        <Parameter id="ncnt" type="int">0</Parameter>	
        <Parameter id="srvcExcId" type="string">sdapp01_dctCon1_koreanre.co.ct.commonct.svc.CtCommonCheckSvc:readCtNoList(koreanre.co.ct.commonct.vo.CtCommonCheckVO)_106_1538977609778</Parameter>	
        <Parameter id="rspDttm" type="datetime">20181008144650481</Parameter>	
        <Parameter id="ErrorCode" type="int">0</Parameter>	
        <Parameter id="ErrorMsg" type="string">{&quot;message&quot;:&#32;[{&#10;&#32;&quot;id&quot;:&#32;&quot;&quot;,&#10;&#32;&quot;msg&quot;:&#32;&quot;정상처리되었습니다.&quot;&#10;}]}</Parameter>	
    </Parameters>	
    <Dataset id="searchDvo">
        <ColumnInfo>	
            <Column id="cdnNm" type="string" size="150"/>	
            <Column id="ctNm" type="string" size="150"/>	
            <Column id="ttyYy" type="string" size="4"/>	
            <Column id="brkNm" type="string" size="70"/>	
        </ColumnInfo>	
        <Rows>	
            <Row>	
                <Col id="cdnNm">TOKIO&#32;MARINE&#32;INS&#32;-&#32;MALAYSIA</Col>	
                <Col id="ctNm">TMIM&#32;-&#32;NON&#32;MARINE&#32;XOL</Col>	
                <Col id="ttyYy">2014</Col>	
                <Col id="brkNm">WILLIS&#32;(MALAYSIA)</Col>	
            </Row>	
        </Rows>	
    </Dataset>	
    <Dataset id="ctNoList">
        <ColumnInfo>	
            <Column id="ctNo" type="string" size="14"/>	
            <Column id="ttyDtlNo" type="string" size="4"/>	
            <Column id="cdnCd" type="string" size="6"/>	
            <Column id="cdnNm" type="string" size="150"/>	
            <Column id="ctNm" type="string" size="150"/>	
            <Column id="ttyYy" type="string" size="4"/>	
            <Column id="brkCd" type="string" size="6"/>	
            <Column id="brkNm" type="string" size="70"/>	
        </ColumnInfo>	
        <Rows>	
            <Row>	
                <Col id="ctNo">C2014010027279</Col>	
                <Col id="ttyDtlNo">C201</Col>	
                <Col id="cdnCd">MY0119</Col>	
                <Col id="cdnNm">TOKIO&#32;MARINE&#32;INS&#32;-&#32;MALAYSIA</Col>	
                <Col id="ctNm">TMIM&#32;-&#32;NON&#32;MARINE&#32;XOL&#32;1</Col>	
                <Col id="ttyYy">2014</Col>	
                <Col id="brkCd">MY0088</Col>	
                <Col id="brkNm">WILLIS&#32;(MALAYSIA)</Col>	
            </Row>	
            <Row>	
                <Col id="ctNo">C2014010027280</Col>	
                <Col id="ttyDtlNo">C202</Col>	
                <Col id="cdnCd">MY0119</Col>	
                <Col id="cdnNm">TOKIO&#32;MARINE&#32;INS&#32;-&#32;MALAYSIA</Col>	
                <Col id="ctNm">TMIM&#32;-&#32;NON&#32;MARINE&#32;XOL&#32;2</Col>	
                <Col id="ttyYy">2014</Col>	
                <Col id="brkCd">MY0088</Col>	
                <Col id="brkNm">WILLIS&#32;(MALAYSIA)</Col>	
            </Row>	
            <Row>	
                <Col id="ctNo">C2014010027281</Col>	
                <Col id="ttyDtlNo">C203</Col>	
                <Col id="cdnCd">MY0119</Col>	
                <Col id="cdnNm">TOKIO&#32;MARINE&#32;INS&#32;-&#32;MALAYSIA</Col>	
                <Col id="ctNm">TMIM&#32;-&#32;NON&#32;MARINE&#32;XOL&#32;3</Col>	
                <Col id="ttyYy">2014</Col>	
                <Col id="brkCd">MY0088</Col>	
                <Col id="brkNm">WILLIS&#32;(MALAYSIA)</Col>	
            </Row>	
            <Row>	
                <Col id="ctNo">C2014010027282</Col>	
                <Col id="ttyDtlNo">C204</Col>	
                <Col id="cdnCd">MY0119</Col>	
                <Col id="cdnNm">TOKIO&#32;MARINE&#32;INS&#32;-&#32;MALAYSIA</Col>	
                <Col id="ctNm">TMIM&#32;-&#32;NON&#32;MARINE&#32;XOL&#32;4</Col>	
                <Col id="ttyYy">2014</Col>	
                <Col id="brkCd">MY0088</Col>	
                <Col id="brkNm">WILLIS&#32;(MALAYSIA)</Col>	
            </Row>	
            <Row>	
                <Col id="ctNo">C2014010027283</Col>	
                <Col id="ttyDtlNo">C205</Col>	
                <Col id="cdnCd">MY0119</Col>	
                <Col id="cdnNm">TOKIO&#32;MARINE&#32;INS&#32;-&#32;MALAYSIA</Col>	
                <Col id="ctNm">TMIM&#32;-&#32;NON&#32;MARINE&#32;XOL&#32;5</Col>	
                <Col id="ttyYy">2014</Col>	
                <Col id="brkCd">MY0088</Col>	
                <Col id="brkNm">WILLIS&#32;(MALAYSIA)</Col>	
            </Row>	
            <Row>	
                <Col id="ctNo">C2014010027284</Col>	
                <Col id="ttyDtlNo">C206</Col>	
                <Col id="cdnCd">MY0119</Col>	
                <Col id="cdnNm">TOKIO&#32;MARINE&#32;INS&#32;-&#32;MALAYSIA</Col>	
                <Col id="ctNm">TMIM&#32;-&#32;NON&#32;MARINE&#32;XOL&#32;6</Col>	
                <Col id="ttyYy">2014</Col>	
                <Col id="brkCd">MY0088</Col>	
                <Col id="brkNm">WILLIS&#32;(MALAYSIA)</Col>	
            </Row>	
        </Rows>	
    </Dataset>	
</Root>`;
        if (data == null) {
            console.log("실패...");
        } else {

            parser.parseString(data, function (err, result) {
                //console.log(result);
                var dataSet = '';
                var rowData = [];
                for (var i in result.Root.Dataset) {
                    if (result.Root.Dataset[i].$.id == "ctNoList") {
                        dataSet = result.Root.Dataset[i];
                        break;
                    }
                }

                if (dataSet.Rows[0].Row) {
                    var row = dataSet.Rows[0].Row;

                    for (var i in row) {
                        var obj = {};
                        for (var j in row[i].Col) {
                            if (row[i].Col[j].$.id == "ctNo") {
                                obj.ctNo = row[i].Col[j]._;
                            } else if (row[i].Col[j].$.id == "ttyDtlNo") {
                                obj.ttyDtlNo = row[i].Col[j]._;
                            } else if (row[i].Col[j].$.id == "cdnCd") {
                                obj.cdnCd = row[i].Col[j]._;
                            } else if (row[i].Col[j].$.id == "cdnNm") {
                                obj.cdnNm = row[i].Col[j]._;
                            } else if (row[i].Col[j].$.id == "ctNm") {
                                obj.ctNm = row[i].Col[j]._;
                            } else if (row[i].Col[j].$.id == "ttyYy") {
                                obj.ttyYy = row[i].Col[j]._;
                            } else if (row[i].Col[j].$.id == "brkCd") {
                                obj.brkCd = row[i].Col[j]._;
                            } else if (row[i].Col[j].$.id == "brkNm") {
                                obj.brkNm = row[i].Col[j]._;
                            }
                        }
                        rowData.push(obj);
                    }
                }

                res.send({ data: rowData });
            });
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

router.post('/IF-2', function (req, res) {
    var docNum = req.body.docNum;
    var status = req.body.status;
    var drafterNum = req.body.drafterNum;
    var draftDate = req.body.draftDate;
    var nowNum = req.body.nowNum;

    sync.fiber(function () {
        try {
            var approvalDtls = sync.await(oracle.selectApprovalDtl(docNum, sync.defer()));

            var data =
            '<?xml version="1.0" encoding="utf-8"?>' +
                '<Root>' +
                '<Parameters>' +
                    '<Parameter id="gv_encryptToken" type="STRING">Vy3zFyENGINEx5F1zTyGIDx5FDEMO1zCy1539564980zPy86400zAy23zEyP7D2Wpx2Bf0dkRRoplRJmZ0Q3Za7WHjeSKx78rg3x78rcDe0bGsQMsAlvwOn7rqK48NEQpA8pi2x7A0PVVN0NZg4x7As0RJFx79YbNw0MoHnIx7Aj7x797CB8bx7A0QYP68D763IdCx2FEWx79UXEIVT6TgScx7A64SUjXXf55fMVMbaUfQ2frENHx2BPtQf2A81Px79GGIt6dB5uQ1D8x7AWjAR9KuA5KfjGOgZjbSDbkqGnPGAx3Dx3DzKyF8x78ICfDirBJ4BDeVx78e5S1x7AaUSDYhrZlx79Wbl1x78FbugXOagNG0cfIx787hj2x78Hd33QDbx00x00x00x00x00zSSy00002479000zUURy1f9d134b0e195793zMyfsNjWrhSdZkx3Dz</Parameter>' +
                    '<Parameter id="WMONID" type="STRING">NXrGufbtBrq</Parameter>' +
                    '<Parameter id="lginIpAdr" type="STRING" />' +
                    '<Parameter id="userId" type="STRING">2011813</Parameter>' +
                    '<Parameter id="userEmpNo" type="STRING">2011813</Parameter>' +
                    '<Parameter id="userDeptCd" type="STRING">240050</Parameter>' +
                    '<Parameter id="frstRqseDttm" type="STRING">20181015210404674</Parameter>' +
                    '<Parameter id="rqseDttm" type="STRING">20181015210404674</Parameter>' +
                    '<Parameter id="lngeClsfCd" type="STRING">ko-kr</Parameter>' +
                    '<Parameter id="srnId" type="STRING">CTCTM107</Parameter>' +
                    '<Parameter id="rqseSrvcNm" type="STRING">koreanre.co.co.aprco.svc.CoAprSvc</Parameter>' +
                    '<Parameter id="rqseMthdNm" type="STRING">saveAprInfoForIcr</Parameter>' +
                    '<Parameter id="rqseVoNm" type="STRING">koreanre.co.co.aprco.vo.CoAprVo</Parameter>' +
                '</Parameters>' +
                '<Dataset id="coAprMngnIfDcDVoList">' +
                    '<ColumnInfo>' +
                        '<Column id="imgId" type="STRING" size="18" />' +
                        '<Column id="aprPrgStatCd" type="STRING" size="2" />' +
                        '<Column id="drftEmpNo" type="STRING" size="7" />' +
                        '<Column id="drfDt" type="DATE" size="0" />' +
                        '<Column id="prinEmpNo" type="STRING" size="7" />' +
                        '<Column id="fnlApvrEmpNo" type="STRING" size="7" />' +
                        '<Column id="fnlAprlDt" type="DATE" size="0" />' +
                    '</ColumnInfo>' +
                    '<Rows>' +
                        '<Row>' +
                            '<Col id="imgId">' + docNum + '</Col>' +
                            '<Col id="aprPrgStatCd">' + status + '</Col>' +
                            '<Col id="drftEmpNo">' + drafterNum + '</Col>' +
                            '<Col id="drfDt">' + draftDate + '</Col>' +
                            '<Col id="prinEmpNo">' + nowNum + '</Col>' +
                        '</Row>' +
                    '</Rows>' +
                '</Dataset>' +
                    '<Dataset id="coApvrDcDVoList">' +
                        '<ColumnInfo>' +
                            '<Column id="imgId" type="STRING" size="18" />' +
                            '<Column id="apvrSno" type="INT" size="9" />' +
                            '<Column id="aprStatCd" type="STRING" size="2" />' +
                            '<Column id="apvrEmpNo" type="STRING" size="7" />' +
                            '<Column id="aprDt" type="DATE" size="0" />' +
                            '<Column id="aprOpnn" type="STRING" size="4000" />' +
                            '<Column id="aftApvrEmpNo" type="STRING" size="7" />' +
                        '</ColumnInfo>' +
                        '<Rows>' + convertdtlToXml(approvalDtls) + '</Rows>' +
                    '</Dataset>' +
                '</Root>';

            var res1 = request('POST', 'http://solomondev.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', {
                headers: {
                    'content-type': 'text/xml'
                },
                body: data
            });
            
            //var data = res1.getBody('utf8');
            res.send({ 'code': res1.statusCode });
        } catch (e) {
            console.log(e);
        }

    });
        
});

router.get('/favicon.ico', function (req, res) {
    res.send();
});

function if2Xml() {
    var data =
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<Root>' +
        '<Parameters>' +
        '<Parameter id="gv_encryptToken" type="STRING">Vy3zFyENGINEx5F1zTyGIDx5FDEMO1zCy1539564980zPy86400zAy23zEyP7D2Wpx2Bf0dkRRoplRJmZ0Q3Za7WHjeSKx78rg3x78rcDe0bGsQMsAlvwOn7rqK48NEQpA8pi2x7A0PVVN0NZg4x7As0RJFx79YbNw0MoHnIx7Aj7x797CB8bx7A0QYP68D763IdCx2FEWx79UXEIVT6TgScx7A64SUjXXf55fMVMbaUfQ2frENHx2BPtQf2A81Px79GGIt6dB5uQ1D8x7AWjAR9KuA5KfjGOgZjbSDbkqGnPGAx3Dx3DzKyF8x78ICfDirBJ4BDeVx78e5S1x7AaUSDYhrZlx79Wbl1x78FbugXOagNG0cfIx787hj2x78Hd33QDbx00x00x00x00x00zSSy00002479000zUURy1f9d134b0e195793zMyfsNjWrhSdZkx3Dz</Parameter>' +
        '<Parameter id="WMONID" type="STRING">NXrGufbtBrq</Parameter>' +
        '<Parameter id="lginIpAdr" type="STRING" />' +
        '<Parameter id="userId" type="STRING">2011813</Parameter>' +
        '<Parameter id="userEmpNo" type="STRING">2011813</Parameter>' +
        '<Parameter id="userDeptCd" type="STRING">240050</Parameter>' +
        '<Parameter id="frstRqseDttm" type="STRING">20181015210404674</Parameter>' +
        '<Parameter id="rqseDttm" type="STRING">20181015210404674</Parameter>' +
        '<Parameter id="lngeClsfCd" type="STRING">ko-kr</Parameter>' +
        '<Parameter id="srnId" type="STRING">CTCTM107</Parameter>' +
        '<Parameter id="rqseSrvcNm" type="STRING">koreanre.co.co.aprco.svc.CoAprSvc</Parameter>' +
        '<Parameter id="rqseMthdNm" type="STRING">saveAprInfoForIcr</Parameter>' +
        '<Parameter id="rqseVoNm" type="STRING">koreanre.co.co.aprco.vo.CoAprVo</Parameter>' +
        '</Parameters>' +
        '<Dataset id="coAprMngnIfDcDVoList">' +
        '<ColumnInfo>' +
        '<Column id="imgId" type="STRING" size="18" />' +
        '<Column id="aprPrgStatCd" type="STRING" size="2" />' +
        '<Column id="drftEmpNo" type="STRING" size="7" />' +
        '<Column id="drfDt" type="DATE" size="0" />' +
        '<Column id="prinEmpNo" type="STRING" size="7" />' +
        '<Column id="fnlApvrEmpNo" type="STRING" size="7" />' +
        '<Column id="fnlAprlDt" type="DATE" size="0" />' +
        '</ColumnInfo>' +
        '<Rows>' +
        '<Row>' +
        '<Col id="imgId">' + docNum + '</Col>' +
        '<Col id="aprPrgStatCd">' + status + '</Col>' +
        '<Col id="drftEmpNo">' + drafterNum + '</Col>' +
        '<Col id="drfDt">' + draftDate + '</Col>' +
        '<Col id="prinEmpNo">' + nowNum + '</Col>' +
        '</Row>' +
        '</Rows>' +
        '</Dataset>' +
        '<Dataset id="coApvrDcDVoList">' +
        '<ColumnInfo>' +
        '<Column id="imgId" type="STRING" size="18" />' +
        '<Column id="apvrSno" type="INT" size="9" />' +
        '<Column id="aprStatCd" type="STRING" size="2" />' +
        '<Column id="apvrEmpNo" type="STRING" size="7" />' +
        '<Column id="aprDt" type="DATE" size="0" />' +
        '<Column id="aprOpnn" type="STRING" size="4000" />' +
        '<Column id="aftApvrEmpNo" type="STRING" size="7" />' +
        '</ColumnInfo>' +
        '<Rows>' + convertdtlToXml(approvalDtls) + '</Rows>' +
        '</Dataset>' +
        '</Root>';

    return data;
}

function convertdtlToXml(data) {
    var dtlXml = '';
    for (var i in data) {
        dtlXml +=
            '<Row>' +
                '<Col id="imgId">' + data[i].DOCNUM + '</Col>' +
                '<Col id="apvrSno">' + data[i].SEQNUM + '</Col>' +
                '<Col id="aprStatCd">' + data[i].STATUS + '</Col>' +
                '<Col id="apvrEmpNo">' + data[i].APPROVALNUM + '</Col>' +
                '<Col id="aprDt">' + data[i].APPROVALDATE + '</Col>';
        if (data[i].STATUS == '04') {
            dtlXml +=
                '<Col id="aprOpnn">' + data[i].APPROVALCOMMENT.replace(/ /gi, '&#32;') + '</Col>';
        }
        dtlXml +=
                '<Col id="aftApvrEmpNo">' + data[i].NEXTAPPROVALNUM + '</Col>' +
            '</Row>';
    }
    return dtlXml;
}

module.exports = router;
