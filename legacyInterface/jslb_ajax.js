
//==============================================================================
//  SYSTEM      :  잠정판 크로스 프라우저 Ajax용 라이브러리
//  PROGRAM     :  XMLHttpRequest에 의한 송수신을 합니다
//  FILE NAME   :  jslb_ajaxXXX.js
//  CALL FROM   :  Ajax 클라이언트
//  AUTHER      :  Toshirou Takahashi http://jsgt.org/mt/01/
//  SUPPORT URL :  http://jsgt.org/mt/archives/01/000409.html
//  CREATE      :  2005.6.26
//  TEST-URL    :  헤더 http://jsgt.org/ajax/ref/lib/test_head.htm
//  TEST-URL    :  인증   http://jsgt.org/mt/archives/01/000428.html
//  TEST-URL    :  비동기 
//        http://allabout.co.jp/career/javascript/closeup/CU20050615A/index.htm
//  TEST-URL    :  SQL     http://jsgt.org/mt/archives/01/000392.html
//------------------------------------------------------------------------------
// 최신 정보   : http://jsgt.org/mt/archives/01/000409.html 
// 저작권 표시의무 없음. 상업 이용과 개조는 자유. 연락 필요 없음.
//
//

////
// 동작가능한 브라우저 판정
//
// @sample        if(chkAjaBrowser()){ location.href='nonajax.htm' }
// @sample        oj = new chkAjaBrowser();if(oj.bw.safari){ /* Safari 코드 */ }
// @return        라이브러리가 동작가능한 브라우저만 true  true|false
//
//  Enable list (v038현재)
//   WinIE 5.5+ 
//   Konqueror 3.3+
//   AppleWebKit계(Safari,OmniWeb,Shiira) 124+ 
//   Mozilla계(Firefox,Netscape,Galeon,Epiphany,K-Meleon,Sylera) 20011128+ 
//   Opera 8+ 
//

function chkAjaBrowser() {
    var a, ua = navigator.userAgent;
    this.bw = {
        safari: ((a = ua.split('AppleWebKit/')[1]) ? a.split('(')[0] : 0) >= 124,
        konqueror: ((a = ua.split('Konqueror/')[1]) ? a.split(';')[0] : 0) >= 3.3,
        mozes: ((a = ua.split('Gecko/')[1]) ? a.split(" ")[0] : 0) >= 20011128,
        opera: (!!window.opera) && ((typeof XMLHttpRequest) == 'function'),
        msie: (!!window.ActiveXObject) ? (!!createHttpRequest()) : false
    }
    return (this.bw.safari || this.bw.konqueror || this.bw.mozes || this.bw.opera || this.bw.msie);
}


////
// XMLHttpRequest 오브젝트 생성
//
// @sample        oj = createHttpRequest()
// @return        XMLHttpRequest 오브젝트(인스턴스)
//

function createHttpRequest() {
    if (window.XMLHttpRequest) {
        try {

            //Win Mac Linux m1,f1,o8 Mac s1 Linux k3용

            return new XMLHttpRequest();
        } catch (e3) {
            alert("aslkf" + e3);
            return false;
        }
    } else if (window.ActiveXObject) {

        //Win e4,e5,e6용

        try {
            return new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                return new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e2) {
                return null;
            }
        }
    } else {
        return null;
    }
}

////
// 송수신 함수
//
// @sample         sendRequest(onloaded,'&prog=1','POST','./about2.php',true,true)
// @param callback 송수신시에 기동하는 함수 이름
// @param data     송신하는 데이터 (&이름1=값1&이름2=값2...)
// @param method   "POST" 또는 "GET"
// @param url      요청하는 파일의 URL
// @param async   비동기라면 true 동기라면 false
// @param sload    수퍼 로드 true로 강제、생략또는 false는 기본
// @param user     인증 페이지용 사용자 이름
// @param password 인증 페이지용 암호
//

function sendRequest(callback, data, method, url, async, sload, user, password) {
    //XMLHttpRequest 오브젝트 생성

    var oj = createHttpRequest();

    if (oj == null) return null;

    //강제 로드의 설정

    var sload = (!!sendRequest.arguments[5]) ? sload : false;
    if (sload || method.toUpperCase() == 'GET') url += "?";
    if (sload) url = url + "t=" + (new Date()).getTime();

    //브라우저 판정

    var bwoj = new chkAjaBrowser();
    var opera = bwoj.bw.opera;
    var safari = bwoj.bw.safari;
    var konqueror = bwoj.bw.konqueror;
    var mozes = bwoj.bw.mozes;

    //송신 처리
    //opera는 onreadystatechange에 중복 응답이 있을 수 있어 onload가 안전
    //Moz,FireFox는 oj.readyState==3에서도 수신하므로 보통은 onload가 안전
    //Win ie에서는 onload가 동작하지 않는다
    //Konqueror은 onload가 불안정
    //참고 http://jsgt.org/ajax/ref/test/response/responsetext/try1.php

    if (opera || safari || mozes) {
        oj.onload = function () { callback(oj); }
    } else {

        oj.onreadystatechange = function () {
            if (oj.readyState == 4) {
                callback(oj);
            }
        }
    }

    //URL 인코딩

    data = uriEncode(data);
    if (method.toUpperCase() == 'GET') {
        url += data;
    }

    //open 메소드

    oj.open(method, url, async, user, password);

    //헤더 application/x-www-form-urlencoded 설정

    setEncHeader(oj);

    //디버그
    //alert("////jslb_ajaxxx.js//// \n data:"+data+" \n method:"+method+" \n url:"+url+" \n async:"+async);

    //send 메소드

    oj.send(data);

    //URI 인코딩 헤더 설정

    function setEncHeader(oj) {

        //헤더 application/x-www-form-urlencoded 설정
        // @see  http://www.asahi-net.or.jp/~sd5a-ucd/rec-html401j/interact/forms.html#h-17.13.3
        // @see  #h-17.3
        //   ( enctype의 기본값은 "application/x-www-form-urlencoded")
        //   h-17.3에 의해、POST/GET 상관없이 설정
        //   POST에서 "multipart/form-data"을 설정할 필요가 있는 경우에는 커스터마이즈 해주세요.
        //
        //  이 메소드가 Win Opera8.0에서 에러가 나므로 분기(8.01은 OK)

        var contentTypeUrlenc = 'application/x-www-form-urlencoded; charset=UTF-8';
        if (!window.opera) {
            oj.setRequestHeader('Content-Type', contentTypeUrlenc);
        } else {
            if ((typeof oj.setRequestHeader) == 'function')
                oj.setRequestHeader('Content-Type', contentTypeUrlenc);
        }
        return oj;
    }

    //URL 인코딩

    function uriEncode(data) {

        if (data != "") {
            //&와=로 일단 분해해서 encode

            var encdata = '';
            var datas = data.split('&');
            for (i = 1; i < datas.length; i++) {
                var dataq = datas[i].split('=');
                encdata += '&' + encodeURI(dataq[0]) + '=' + encodeURI(dataq[1]);
            }
        } else {
            encdata = "";
        }
        return encdata;
    }


    return oj;
}

