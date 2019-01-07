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
    var cdnNm = req.body.cdnNm.replace(/&/g, '').replace(/  /g, ' ').replace(/ /g, "&#32;");
    var ctNm = req.body.ctNm.replace(/&/g, '').replace(/  /g, ' ').replace(/ /g, "&#32;");
    //var brkNm = req.body.brkNm.replace(/ /g, "&#32;");
    var brkNm = '';
    var ttyYy = req.body.ttyYy;
   // var token = req.session.passport.user.token;
    var token = req.session.user.token;
    var testData = 
        '<?xml version="1.0" encoding="utf-8"?>'+
        '<Root>'+
            '<Parameters>'+
                '<Parameter id="gv_encryptToken" type="STRING">' + token + '</Parameter>'+
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
    '<Col id="ttyYy">'+ttyYy+'</Col>' +
    '<Col id="brkNm">'+brkNm+'</Col>' +
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
        var res1 = request('POST', 'http://solomon.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', { //해당 URL에 POST방식으로 값을 전달.
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
        res.send({ data: [] });
    }

});

router.post('/IF2', function (req, res) {
    var docNum = req.body.docNum;
    var status = req.body.status;
    var drafterNum = req.body.drafterNum;
    var draftDate = req.body.draftDate;
    var nowNum = req.body.nowNum;
    var token = req.session.user.token;

    sync.fiber(function () {
        try {
            var approvalDtls = sync.await(oracle.selectApprovalDtl(docNum, sync.defer()));

            var data =
            '<?xml version="1.0" encoding="utf-8"?>' +
                '<Root>' +
                '<Parameters>' +
                    '<Parameter id="gv_encryptToken" type="STRING">' + token + '</Parameter>' +
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

            var res1 = request('POST', 'http://solomon.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', {
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

router.post('/IF3', function (req, res) {
    var mlData = req.body.mlData;
    /*
    sync.fiber(function () {
        try {
            var data = '' +
                '<?xml version="1.0" encoding="utf-8"?>' +
                '<Root>' +
                    '<Parameters>' +
                        '<Parameter id="gv_encryptToken" type="STRING"></Parameter>' +
                        '<Parameter id="WMONID" type="STRING">NXrGufbtBrq</Parameter>' +
                        '<Parameter id="lginIpAdr" type="STRING">172.16.12.54</Parameter>' +
                        '<Parameter id="userId" type="STRING">9999068</Parameter>' +
                        '<Parameter id="userEmpNo" type="STRING">9999068</Parameter>' +
                        '<Parameter id="userDeptCd" type="STRING">240065</Parameter>' +
                        '<Parameter id="frstRqseDttm" type="STRING">20181217131508909</Parameter>' +
                        '<Parameter id="rqseDttm" type="STRING">20181217131508909</Parameter>' +
                        '<Parameter id="lngeClsfCd" type="STRING">ko-kr</Parameter>' +
                        '<Parameter id="srnId" type="STRING">CTCTM107</Parameter>' +
                        '<Parameter id="rqseSrvcNm" type="STRING">koreanre.co.ct.commonct.svc.CtCommonCheckSvc</Parameter>' +
                        '<Parameter id="rqseMthdNm" type="STRING">saveTmpAcList</Parameter>' +
                        '<Parameter id="rqseVoNm" type="STRING">koreanre.co.ct.commonct.vo.CtCommonCheckVO</Parameter>' +
                    '</Parameters>' +
                    '<Dataset id="saveTmpAcList">' +
                        '<ColumnInfo>' +
                            '<Column id="imgId" type="STRING" size="18"/>' +
                            '<Column id="imgFileStNo" type="STRING" size="3"/>' +
                            '<Column id="imgFileEndNo" type="STRING" size="3"/>' +
                            '<Column id="rmk" type="STRING" size="4000"/>' +
                            '<Column id="saOcrnCycCd" type="STRING" size="3"/>' +
                            '<Column id="iwowDvCd" type="STRING" size="1"/>' +
                            '<Column id="fy" type="STRING" size="4"/>' +
                            '<Column id="appYrmm" type="STRING" size="6"/>' +
                            '<Column id="deptCd" type="STRING" size="6"/>' +
                            '<Column id="secd" type="STRING" size="6"/>' +
                            '<Column id="ctNo" type="STRING" size="14"/>' +
                            '<Column id="curCd" type="STRING" size="3"/>' +
                            '<Column id="rgstEmpNo" type="STRING" size="7"/>' +
                            '<Column id="prinEmpNo" type="STRING" size="7"/>' +
                            '<Column id="cscoSaRfrnCnnt2" type="STRING" size="200"/>' +
                            '<Column id="pre" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="prePfinAmt" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="prePfoutAmt" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="xolPre" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="icpreOcpre" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="com" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="pfcom" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="brkg" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="txam" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="rtrcCom" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="cdnCnam" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="prrsCf" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="pfPrrsCf" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="prrsRls" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="pfPrrsRls" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="cla" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="lsRcvyAmt" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="cas" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="casRfn" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="lsresCf" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="lsresRls" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="claPfinAmt" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="claPfoutAmt" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="rsreInt" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="intTxam" type="BIGDECIMAL" size="21"/>' +
                            '<Column id="spyCost" type="BIGDECIMAL" size="21"/>' +
                        '</ColumnInfo > ' +
                        '<Rows>';
                            for(var item in mlData){
                            data += '' +
                            '<Row>' +
                                '<Col id="imgId">ICR201811010000002</Col>' +
                                '<Col id="imgFileStNo">1</Col>' +
                                '<Col id="imgFileEndNo">2</Col>' +
                                '<Col id="rmk">SA</Col>' +
                                '<Col id="saOcrnCycCd">Q14</Col>' +
                                '<Col id="iwowDvCd">1</Col>' +
                                '<Col id="fy">2018</Col>' +
                                '<Col id="appYrmm">201811</Col>' +
                                '<Col id="deptCd">308000</Col>' +
                                '<Col id="secd">308010</Col>' +
                                '<Col id="ctNo">C2016022140727</Col>' +
                                '<Col id="curCd">EUR</Col>' +
                                '<Col id="rgstEmpNo">2014999</Col>' +
                                '<Col id="prinEmpNo">2011813</Col>' +
                                '<Col id="cscoSaRfrnCnnt2">your&#32;ref&#32;13579</Col>' +
                                '<Col id="pre">138969.59</Col>' +
                                '<Col id="com">36132.11</Col>' +
                                '<Col id="brkg">2084.54</Col>' +
                                '<Col id="cla">95323.34</Col>' +
                                '<Col id="casRfn">49188.67</Col>' +
                            '</Row>';
                            }
                        data += '' +
                        '</Rows>' +
                    '</Dataset>' +
                '</Root>';

            var res1 = request('POST', 'http://solomon.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', {
                headers: {
                    'content-type': 'text/xml'
                },
                body: data
            });
            var ifData = res1.getBody('utf8');

            if (ifData == null) {
                console.log("IF3 실패...");
            } else {
                parser.parseString(ifData, function (err, result) {
                    console.log(result);
                });
            }
        }catch (e) {
            console.log(e);
        }

    });
    */
});

router.post('/IF4', function (req, res) {
    var docNum = req.body.docNum;
    var token = req.session.user.token;

    sync.fiber(function () {
        try {
            var data =
                '<?xml version="1.0" encoding="utf-8"?>' +
                '<Root>' +
                '<Parameters>' +
                '<Parameter id="gv_encryptToken" type="STRING">' + token + '</Parameter>' +
                '<Parameter id="WMONID" type="STRING">NXrGufbtBrq</Parameter>' +
                '<Parameter id="lginIpAdr" type="STRING">172.16.12.54</Parameter>' +
                '<Parameter id="userId" type="STRING">9999068</Parameter>' +
                '<Parameter id="userEmpNo" type="STRING">9999068</Parameter>' +
                '<Parameter id="userDeptCd" type="STRING">240065</Parameter>' +
                '<Parameter id="frstRqseDttm" type="STRING">20181030194635225</Parameter>' +
                '<Parameter id="rqseDttm" type="STRING">20181030194635225</Parameter>' +
                '<Parameter id="lngeClsfCd" type="STRING">ko-kr</Parameter>' +
                '<Parameter id="srnId" type="STRING">CTCTM107</Parameter>' +
                '<Parameter id="rqseSrvcNm" type="STRING">koreanre.co.ct.commonct.svc.CtCommonCheckSvc</Parameter>' +
                '<Parameter id="rqseMthdNm" type="STRING">readTmpAcList</Parameter>' +
                '<Parameter id="rqseVoNm" type="STRING">koreanre.co.ct.commonct.vo.CtCommonCheckVO</Parameter>' +
                '</Parameters>' +
                '<Dataset id="searchDvo">' +
                '<ColumnInfo>' +
                '<Column id="cdnNm" type="STRING" size="150"/>' +
                '<Column id="ctNm" type="STRING" size="150"/>' +
                '<Column id="ttyYy" type="STRING" size="4"/>' +
                '<Column id="brkNm" type="STRING" size="70"/>' +
                '<Column id="imgId" type="STRING" size="18"/>' +
                '</ColumnInfo>' +
                '<Rows>' +
                '<Row>' +
                '<Col id="imgId">' + docNum + '</Col>' +
                '</Row>' +
                '</Rows>' +
                '</Dataset>' +
                '<Dataset id="tmpAcList.outlist.meta">' +
                '<ColumnInfo>' +
                '<Column id="ctNo" type="STRING" size="14"/>' +
                '<Column id="deptCd" type="STRING" size="6"/>' +
                '<Column id="aprStatCd" type="STRING" size="2"/>' +
                '<Column id="ctNm" type="STRING" size="150"/>' +
                '<Column id="ttyYy" type="STRING" size="4"/>' +
                '<Column id="ord" type="INT" size="9"/>' +
                '<Column id="acDvNm" type="STRING" size="70"/>' +
                '<Column id="ctYy" type="STRING" size="4"/>' +
                '<Column id="imgId" type="STRING" size="18"/>' +
                '<Column id="clamSno" type="INT" size="9"/>' +
                '<Column id="saOcrnSno" type="INT" size="9"/>' +
                '<Column id="imgFileStNo" type="STRING" size="3"/>' +
                '<Column id="imgFileEndNo" type="STRING" size="3"/>' +
                '<Column id="curCd" type="STRING" size="3"/>' +
                '<Column id="ntbl" type="BIGDECIMAL" size="21"/>' +
                '<Column id="osl" type="BIGDECIMAL" size="21"/>' +
                '<Column id="ibnr" type="BIGDECIMAL" size="21"/>' +
                '</ColumnInfo>' +
                '<Rows>' +
                '</Rows>' +
                '</Dataset>' +
                '</Root>';
            
            var res1 = request('POST', 'http://solomon.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', {
                headers: {
                    'content-type': 'text/xml'
                },
                body: data
            });
            var data = res1.getBody('utf8');
            
            /*
            //TEST data
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
                <Col id="deptCd">C201</Col>
                <Col id="aprStatCd">MY0119</Col>
                <Col id="ctNm">TOKIO&#32;MARINE&#32;INS&#32;-&#32;MALAYSIA</Col>	
                <Col id="ttyYy">TMIM&#32;-&#32;NON&#32;MARINE&#32;XOL&#32;1</Col>
                <Col id="ord">2014</Col>
                <Col id="acDvNm">SA</Col>
                <Col id="ctYy">MY0088</Col>
                <Col id="imgId">WILLIS&#32;(MALAYSIA)</Col>
                <Col id="clamSno">WILLIS&#32;(MALAYSIA)</Col>
                <Col id="saOcrnSno">WILLIS&#32;(MALAYSIA)</Col>
                <Col id="imgFileStNo">1</Col>
                <Col id="imgFileEndNo">2</Col>
                <Col id="curCd">JOD</Col>
                <Col id="ntbl">200</Col>
                <Col id="osl">250</Col>
                <Col id="ibnr">300</Col>
            </Row>	
        </Rows>	
    </Dataset>	
</Root>`;*/

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
                                } else if (row[i].Col[j].$.id == "deptCd") {
                                    obj.deptCd = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "aprStatCd") {
                                    obj.aprStatCd = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ctNm") {
                                    obj.ctNm = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ttyYy") {
                                    obj.ttyYy = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ord") {
                                    obj.ord = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "acDvNm") {
                                    obj.acDvNm = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ctYy") {
                                    obj.ctYy = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "imgId") {
                                    obj.imgId = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "clamSno") {
                                    obj.clamSno = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "saOcrnSno") {
                                    obj.saOcrnSno = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "imgFileStNo") {
                                    obj.imgFileStNo = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "imgFileEndNo") {
                                    obj.imgFileEndNo = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "curCd") {
                                    obj.curCd = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ntbl") {
                                    obj.ntbl = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "osl") {
                                    obj.osl = row[i].Col[j]._;
                                } else if (row[i].Col[j].$.id == "ibnr") {
                                    obj.ibnr = row[i].Col[j]._;
                                }
                            }
                            rowData.push(obj);
                        }
                    }

                    res.send({ data: rowData });
                });
            }

        } catch (e) {
            console.log(e);
        }

    });

});

router.post('/IF5', function (req, res) {
    var token = req.session.user.token;
    var docNum = req.body.docNum;
    var aprStatCd = req.body.aprStatCd; // 계수전송 03, 계수취소 -1

    sync.fiber(function () {
        try {
            var data = ''+       
            '<?xml version = "1.0" encoding = "utf-8"?>'+
                '<Root>' +
                '<Parameters>' +
                '<Parameter id="gv_encryptToken" type="STRING">' + token + '</Parameter>' +
                '<Parameter id="WMONID" type="STRING">NXrGufbtBrq</Parameter>' +
                '<Parameter id="lginIpAdr" type="STRING">172.16.12.54</Parameter>' +
                '<Parameter id="userId" type="STRING">9999068</Parameter>' +
                '<Parameter id="userEmpNo" type="STRING">9999068</Parameter>' +
                '<Parameter id="userDeptCd" type="STRING">240065</Parameter>' +
                '<Parameter id="frstRqseDttm" type="STRING">20181230142413289</Parameter>' +
                '<Parameter id="rqseDttm" type="STRING">20181230142413289</Parameter>' +
                '<Parameter id="lngeClsfCd" type="STRING">ko-kr</Parameter>' +
                '<Parameter id="srnId" type="STRING">CTCTM107</Parameter>' +
                '<Parameter id="rqseSrvcNm" type="STRING">koreanre.co.ct.commonct.svc.CtCommonCheckSvc</Parameter>' +
                '<Parameter id="rqseMthdNm" type="STRING">transferTmpAcList</Parameter>' +
                '<Parameter id="rqseVoNm" type="STRING">koreanre.co.ct.commonct.vo.CtCommonCheckVO</Parameter>' +
                '<Parameter id="imgId" type="STRING">' + docNum + '</Parameter>' +
                '<Parameter id="aprStatCd" type="STRING">' + aprStatCd + '</Parameter>' +
                '</Parameters>' +
                '</Root>';

            var res1 = request('POST', 'http://solomon.koreanre.co.kr:8083/KoreanreWeb/xplatform.do', {
                headers: {
                    'content-type': 'text/xml'
                },
                body: data
            });
            var ifData = res1.getBody('utf8');

            if (ifData == null) {
                console.log("IF5 실패...");
            } else {
                parser.parseString(ifData, function (err, result) {
                    console.log(result);
                });
            }
        }catch (e) {
            console.log(e);
        }

    });   
});




router.get('/favicon.ico', function (req, res) {
    res.send();
});

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
