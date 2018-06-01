String.prototype.padLeft = function() {
    var args = arguments;
    var len = args[0];

    if (args.length == 1)
        padStr = " ";
    else
        padStr = args[1];
    var returnString = "";
    var padCnt = Number(len) - String(this).length;
    for ( var i = 0; i < padCnt; i++)
        returnString += String(padStr);
    returnString += this;
    return returnString.substring(returnString.length - len);
};

String.prototype.padRight = function() {
    var args = arguments;
    var totalLength = args[0];

    if (args.length == 1)
        paddingChar = " ";
    else
        paddingChar = args[1];
    var returnString = "";
    var padCnt = Number(totalLength) - String(this).length;
    for ( var i = 0; i < padCnt; i++)
        returnString += String(paddingChar);
    returnString = this + returnString;
    return returnString.substring(0, totalLength);
};

Array.prototype.containsValue = function(compareValue) {
    for ( var i = 0; i < this.length; i++) {
        if (this[i] == compareValue)
            return true;
    }
    return false;
};

// jQuery 1.9 이상부터는 $.browser가 deprecated 됐다.
// 이에 유사한 브라우저 체크 함수를 생성한다.
$.browser = {};
$.browser.mozilla = /mozilla/.test(navigator.userAgent.toLowerCase()) && !/webkit/.test(navigator.userAgent.toLowerCase());
$.browser.webkt = /webkit/.test(navigator.userAgent.toLowerCase());
$.browser.opera = /opera/.test(navigator.userAgent.toLowerCase());
$.browser.msie = /msie/.test(navigator.userAgent.toLowerCase()) || /Trident/.test(navigator.userAgent.toLowerCase()) || /Edge/.test(navigator.userAgent.toLowerCase());

//달력날짜형식 구분자
var DATE_SEP = '-';
var TIME_SEP = ':';

// Browser Namer과 버전 체크
// ex) browser.name == "msie", browser.version == 9
var browser = (function() {
    var s = navigator.userAgent.toLowerCase();
    var match = /(webkit)[ \/](\w.]+)/.exec(s) ||
                /(opera)(?:.*version)?[ \/](\w.]+)/.exec(s) ||
                /(msie) ([\w.]+)/.exec(s) ||
                /(Trident) ([\w.]+)/.exec(s) ||
                /(Edge) ([\w.]+)/.exec(s) ||
                /(mozilla)(?:.*? rv:([\w.]+))?/.exec(s) || [];
    return { name: match[1] || "", version: match[2] || "0" };
}());

// GNB
// 메뉴선택 화면 이동 후 자동 class추가
$(function() {
    // current page marking
    if (typeof gnbProgramId == "string") {
        var gnbHref = gnbProgramId.toLowerCase();
        var tmpHref = "";

        if ($.trim(gnbHref) != '') {
            $('#navbar li').each(function(idx, item) {
                tmpHref = $(item).attr('actionUrl') + '';
                if (tmpHref.toLowerCase().indexOf(gnbHref) > -1) {
                    $(item).addClass('active');
                } else {
                    $(item).removeClass('active');
                }
            });
        }
    }
});

/**
 * HTML Tag 제거
 */
function strip_tags(input, allowed) {
    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || [])
            .join(''); // making sure the allowed arg is a string containing
    // only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '').replace(
            tags,
            function($0, $1) {
                return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0
                        : '';
            });
}

/**
 * 금일을 지정한 포멧으로 변환하여 반환
 */
function fn_getCurrDate(strFormat) {
    return fn_DateFormatConvert(new Date(), strFormat);
}

/**
 * 이번 달의 첫번째 일자를 지정한 포멧으로 변환하여 반환
 */
function fn_getCurrFirstDate(strFormat) {
    try {
        var currDate = new Date();
        var y = currDate.getFullYear();
        var m = currDate.getMonth();

        var dateOfFirst = new Date(y, m, 1);

        return fn_DateFormatConvert(dateOfFirst, strFormat);
    } catch (e) {
        throw e;
    }
}

/**
 * 이번 달의 마지막 일자를 지정한 포멧으로 변환하여 반환
 */
function fn_getCurrLastDate(strFormat) {
    try {
        var currDate = new Date();
        var y = currDate.getFullYear();
        var m = currDate.getMonth() + 1;

        var thismonth = new Date((m - 1 == 0) ? y - 1 : y, (m - 1 == 0) ? 12
                : m - 1, 1);
        var nextmonth = new Date(y, m, 1);
        var diffms = nextmonth - thismonth; // 밀리세컨드 단위의 차이
        var diffdays = diffms / 1000 / 60 / 60 / 24; // 하루 단위 차이

        var lastDate = new Date(y, m - 1, parseInt(diffdays));

        return fn_DateFormatConvert(lastDate, strFormat);
    } catch (e) {
        throw e;
    }
}

/**
 * 지정한 년월의 마지막 일자를 지정한 포멧으로 변환하여 반환
 */
function getCustomLastDate(intYear, intMonth, strFormat) {
    try {
        intYear = parseInt(intYear);
        intMonth = parseInt(intMonth);
        var thismonth = new Date((intMonth - 1 == 0) ? intYear - 1 : intYear,
                (intMonth - 1 == 0) ? 12 : intMonth - 1, 1);
        var nextmonth = new Date(intYear, intMonth, 1);
        var diffms = nextmonth - thismonth; // 밀리세컨드 단위의 차이
        var diffdays = diffms / 1000 / 60 / 60 / 24; // 하루 단위 차이

        var customDate = new Date(intYear, intMonth - 1, parseInt(diffdays));

        return fn_DateFormatConvert(customDate, strFormat);
    } catch (e) {
        throw e;
    }
}

/**
 * 특정 날짜열 형식의 문자열에 대해 지정한 포멧으로 날짜를 반환
 *
 * 사용예 --- fn_StringDateFormatConvert("20130410", "yyyy-mm-dd")
 */
function fn_StringDateFormatConvert(sDate, strFormat) {
    if (sDate.length !== 8)
        return "";

    var yyyy = sDate.substr(0, 4);
    var mm = sDate.substr(4, 2);
    var dd = sDate.substr(6, 2);

    cDate = new Date(yyyy, mm - 1, dd);
    return fn_DateFormatConvert(cDate, strFormat);
}

/**
 * 날짜 타입(date)을 지정 포멧으로 변환
 */
function fn_DateFormatConvert(tdate, strformat) {
    try {
        var rString = '';
        var dt = tdate;// new Date();
        var y = dt.getFullYear();
        var m = dt.getMonth() + 1;
        var d = dt.getDate();

        if (m < 10)
            m = "0" + m;
        if (d < 10)
            d = "0" + d;

        var gubunChar = '';

        if (strformat.length == 8) { // //yyyymmdd
            if (strformat.substring(1, 2).toUpperCase() == 'Y') {
                rString = y + m + d;
            } else if (strformat.substring(1, 2).toUpperCase() == 'M') {
                rString = m + d + y;
            } else if (strformat.substring(1, 2).toUpperCase() == 'D') {
                rString = d + m + y;
            }
        } else if (strformat.length == 7) { // //yyyy?mm
            if (strformat.substring(1, 2).toUpperCase() == 'Y') {
                gubunChar = strformat.substring(4, 5);
            } else {
                gubunChar = strformat.substring(2, 3);
            }
            rString = y + gubunChar + m; // 년월 표시는 yyyy?mm 형식 고정
        } else if (strformat.length == 6) { // //yyyymm
            rString = y + m; // 년월 표시는 yyyy?mm 형식 고정
        } else if (strformat.length == 4) { // //yyyy
            rString = y;
        } else if (strformat.length == 10) { // //yyyy?mm?dd
            if (strformat.substring(1, 2).toUpperCase() == 'Y') {
                gubunChar = strformat.substring(4, 5);
                rString = y + gubunChar + m + gubunChar + d;
            } else if (strformat.substring(1, 2).toUpperCase() == 'M') {
                gubunChar = strformat.substring(2, 3);
                rString = m + gubunChar + d + gubunChar + y;
            } else if (strformat.substring(1, 2).toUpperCase() == 'D') {
                gubunChar = strformat.substring(2, 3);
                rString = d + gubunChar + m + gubunChar + y;
            }
        }
        return rString;
    } catch (e) {
        return "";
    }
}

/**
 * 특정 날짜에 대해 지정한 값만큼 가감(+-)한 날짜를 반환
 *
 * 입력 파라미터 ----- pInterval : "yyyy" 는 연도 가감, "m" 은 월 가감, "d" 는 일 가감 pAddVal : 가감
 * 하고자 하는 값 (정수형) pYyyymmdd : 가감의 기준이 되는 날짜 pDelimiter : pYyyymmdd 값에 사용된 구분자를
 * 설정 (없으면 "" 입력)
 *
 * 반환값 ---- yyyymmdd 또는 함수 입력시 지정된 구분자를 가지는 yyyy?mm?dd 값
 *
 * 사용예 --- 2008-01-01 에 3 일 더하기 ==> addDate("d", 3, "2008-08-01", "-"); 20080301
 * 에 8 개월 더하기 ==> addDate("m", 8, "20080301", "");
 */
function addDate(pInterval, pAddVal, pYyyymmdd, pDelimiter) {
    try {
        var yyyy;
        var mm;
        var dd;
        var cDate;
        var cYear, cMonth, cDay;

        if (pDelimiter != "") {
            pYyyymmdd = pYyyymmdd.replace(eval("/\\" + pDelimiter + "/g"), "");
        }

        yyyy = pYyyymmdd.substr(0, 4);
        mm = pYyyymmdd.substr(4, 2);
        dd = pYyyymmdd.substr(6, 2);

        if (pInterval == "yyyy") {
            yyyy = (yyyy * 1) + (pAddVal * 1);
        } else if (pInterval == "m") {
            mm = (mm * 1) + (pAddVal * 1);
        } else if (pInterval == "d") {
            dd = (dd * 1) + (pAddVal * 1);
        }

        cDate = new Date(yyyy, mm - 1, dd); // 12월, 31일을 초과하는 입력값에 대해 자동으로 계산된
        // 날짜가
        // 만들어짐.
        cYear = cDate.getFullYear();
        cMonth = cDate.getMonth() + 1;
        cDay = cDate.getDate();

        cMonth = cMonth < 10 ? "0" + cMonth : cMonth;
        cDay = cDay < 10 ? "0" + cDay : cDay;

        if (pDelimiter != "") {
            return cYear + pDelimiter + cMonth + pDelimiter + cDay;
        } else {
            return cYear + cMonth + cDay;
        }
    } catch (e) {
        return "";
    }
}

/**
 * 쿠키 생성
 *
 * 사용예 --- setCookie('이름','값','시간'); setCookie('DX_PRODUCT','some value',365)
 */
function setCookie(cookieName, cookieValue) {
    $.cookie(cookieName, cookieValue, {
        path : '/',
        expires : 365
    }); // 유효기간을 365일로 지정
}

/**
 * 쿠키 호출
 *
 * 사용예 --- getCookie('이름'); var name = getCookie('DX_PRODUCT')
 */
function getCookie(cookieName) {
    return $.cookie(cookieName);
}

/**
 * POPUP Windows
 */
function PopupupWin(urlstr, tit, wi, he, res, scrollbar) {
    var resize = "yes";
    var scroll = "no";
    if (res != null && res != 'undefined') {
        resize = res;
    }
    if (scroll != null && scroll != 'undefined') {
        scroll = scrollbar;
    }
    // 화면 중앙에 배치
    var winl = screen.width / 2;
    var wint = screen.height / 2;
    winl -= (wi / 2);
    wint -= (he / 2);

    return window.open(urlstr, tit,
            "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars="
                    + scroll + ",resizable=" + resize
                    + ",copyhistory=yes,width=" + wi + ",height=" + he
                    + ",top=" + wint + ",left=" + winl);
}

function chkSpecialChar(thisword) {
    var flag = true;
    var specialChars = "~`!@#$%^&*-=+\|[](){};:'<.,>/?_ ";
    wordadded = thisword;
    for (var i = 0; i < wordadded.length; i++) {
        for (var j = 0; j < specialChars.length; j++) {
            if (wordadded.charAt(i) == specialChars.charAt(j)) {
                flag = false;
                break;
            }
        }
    }
    return flag;
}

function checkEmpty(karl, name) {
    var str = karl.value;

    if (str == null || str == "" || str.length == 0) {
        alert(name + " 항목이 비어있습니다.\n\n값을 넣어주십시오");
        karl.focus();
        return false;
    }
    if (str.substring(0, 1) == " " || str.substring(0, 1) == null) {
        alert(name + " 항목은 빈칸 혹은 공백으로 시작될 수 없습니다..\n\n다시 입력하여 주십시오");
        karl.focus();
        return false;
    }

    return true;
}

function checkNaN(karl, name) {
    var str = karl.value;
    if (isNaN(str)) {
        alert("" + name + "란은 숫자입력만을 허용합니다..\n\n다시 입력하여 주십시오");
        karl.value = "";
        karl.focus();
        return false;
    }
    return true;
}

function checkREP(karl, name) {
    var str = karl.value;
    for (var i = 0; i <= (str.length); i++) {
        var cha = str.substring(i, i + 1);
        if ((cha == "'") || (cha == '"')) {
            alert("" + name + "란은 따옴표문자를 허용하지 않습니다.\n\n다시 입력하여 주십시오");
            karl.focus();
            return false;
        }
    }
    return true;
}

/**
 * input field에 숫자만 입력 체크
 *
 * 사용예 : onKeyDown="return onlyNumberInput(event)"
 */
function onlyNumberInput(Ev) {
    var code = "";
    if (window.event) // IE코드
        code = window.event.keyCode;
    else // 타브라우저
        code = Ev.which;

    if ((code > 34 && code < 41) || (code > 47 && code < 58) || (code > 95 && code < 106) || code == 8 || code == 9 || code == 13 || code == 46 || code == 110 || code == 190) {
       window.event.returnValue = true;
       return;
    }

    if (window.event) {
        window.event.returnValue = false;
        return false;
    } else {
        Ev.preventDefault();
        return false;
    }
}

//입력메세지 byte 계산
function fn_msgByte(message) {
    var nbytes = 0;
    for (var i=0; i<message.length; i++) {
        var ch = message.charAt(i);
        if(escape(ch).length > 4) {
            nbytes += 2;
        } else if (ch == '\n') {
            if (message.charAt(i-1) != '\r') {
                nbytes += 1;
            }
        } else if (ch == '<' || ch == '>') {
            nbytes += 4;
        } else {
            nbytes += 1;
        }
    }
    return nbytes;
}

//숫자 입력 체크
function onlyNum(obj, defaultNum) {
    var dNum ='';
    if(typeof defaultNum =='undefined' || typeof defaultNum =='NaN' || defaultNum==''){
        dNum = '';
    } else {
        dNum = defaultNum;
    }

    if(/[^-0123456789]/g.test(obj.value)) {
        alert("숫자만 입력가능합니다.");
        obj.value = dNum;
        obj.focus();
    }
}

//Upload Input Clear
function fn_uploadFileClear(objId) {
    if ($.browser.msie) $('#'+objId).replaceWith( $('#'+objId).clone(true) );
    else $('#'+objId).val('');
}

function htmlContent(cellValue, options, rowObject, action) {
    return $.jgrid.htmlDecode(cellValue);
}

// input[type='file'] value를 clear한다.
function fn_inputFileClear(objId) {
    if ($.browser.msie) {
        // ie 일때 input[type=file] init.
        $("#" + objId).replaceWith( $("#" + objId).clone(true) );
    } else {
        // other browser 일때 input[type=file] init.
        $("#" + objId).val("");
    }
}

// 팝업 오픈
function openPopup(link, name, width, height, scroll, screenWidth, screenHeight) {
    var left = (screenWidth - width) / 2;
    var top = (screenHeight - height) / 2;
    var win = window.open(link, name, "width="+width+", height="+height+", left="+left+", top="+top+" toolbar=no, location=no, status=no, menubar=no, scrollbars="+scroll+", directories=no, resizable=no");
    win.focus();
}

// 정렬
function sortTable(n,tableName) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    if(tableName == null || tableName.size == 0) {
        tableName = "sampleTable";
    }
    table = document.getElementById(tableName);
    switching = true;
    //Set the sorting direction to ascending:
    dir = "asc";
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.getElementsByTagName("TR");
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 1; i < (rows.length - 1); i++) {
            //start by saying there should be no switching:
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /*check if the two rows should switch place,
            based on the direction, asc or desc:*/
        if (dir == "asc") {
            if (x.textContent .toLowerCase() > y.textContent .toLowerCase()) {
            //if so, mark as a switch and break the loop:
                shouldSwitch= true;
                break;
            }
         } else if (dir == "desc") {
            if (x.textContent .toLowerCase() < y.textContent .toLowerCase()) {
            //if so, mark as a switch and break the loop:
                shouldSwitch= true;
                break;
            }
         }
     }
     if (shouldSwitch) {
        /*If a switch has been marked, make the switch
        and mark that a switch has been done:*/
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
        //Each time a switch is done, increase this count by 1:
        switchcount ++;
    } else {
        /*If no switching has been done AND the direction is "asc",
        set the direction to "desc" and run the while loop again.*/
        if (switchcount == 0 && dir == "asc") {
            dir = "desc";
            switching = true;
        }
   }
  }
}

//정렬	(숫자 크기로 비교..)
function sortTableByCnt(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("sampleTable");
    switching = true;
    //Set the sorting direction to ascending:
    dir = "asc";
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.getElementsByTagName("TR");
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 1; i < (rows.length - 1); i++) {
            //start by saying there should be no switching:
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /*check if the two rows should switch place,
            based on the direction, asc or desc:*/
            if (dir == "asc") {
                if (parseInt(x.innerHTML, 10) > parseInt(y.innerHTML, 10)) {
                    //if so, mark as a switch and break the loop:
                    shouldSwitch= true;
                    break;
                }
             } else if (dir == "desc") {
                 if (parseInt(x.innerHTML, 10) < parseInt(y.innerHTML, 10)) {
                    //if so, mark as a switch and break the loop:
                    shouldSwitch= true;
                    break;
                }
             }
        }
         if (shouldSwitch) {
             /*If a switch has been marked, make the switch
            and mark that a switch has been done:*/
             rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
             switching = true;
             //Each time a switch is done, increase this count by 1:
             switchcount ++;
        } else {
            /*If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again.*/
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}


function addModalEvent() {
    var appendthis =  ("<div class='modal-overlay js-modal-close'></div>");
    $('a[data-modal-id],tr.sel[data-modal-id]').click(function(e) {
        e.preventDefault();
        $("body").append(appendthis);
        $(".modal-overlay").fadeTo(500, 0.7);
        //$(".js-modalbox").fadeIn(500);
        var modalBox = $(this).attr('data-modal-id');
        $('#'+modalBox).fadeIn($(this).data());
    });
}

// 비밀번호에 4자 이상의 연속 또는 반복 문자 및 숫자 금지
function isContinuedValue(value) {
    var intCnt1 = 0;
    var intCnt2 = 0;
    var temp0 = "";
    var temp1 = "";
    var temp2 = "";
    var temp3 = "";

    for (var i = 0; i < value.length - 3; i++) {
        temp0 = value.charAt(i);
        temp1 = value.charAt(i + 1);
        temp2 = value.charAt(i + 2);
        temp3 = value.charAt(i + 3);

        if (temp0.charCodeAt(0) - temp1.charCodeAt(0) == 1 && temp1.charCodeAt(0) - temp2.charCodeAt(0) == 1 && temp2.charCodeAt(0) - temp3.charCodeAt(0) == 1) {
            intCnt1 = intCnt1 + 1;
        }

        if (temp0.charCodeAt(0) - temp1.charCodeAt(0) == -1 && temp1.charCodeAt(0) - temp2.charCodeAt(0) == -1 && temp2.charCodeAt(0) - temp3.charCodeAt(0) == -1) {
            intCnt2 = intCnt2 + 1;
        }
    }

    return (intCnt1 > 0 || intCnt2 > 0);
}

//-----------------------------------------------------------------------------
// 공백이나 널인지 확인
// @return : boolean
//-----------------------------------------------------------------------------
function isEmpty(str) {
    str = $.trim(str);
    for(var i = 0; i < str.length; i++) {
        if ((str.charAt(i) != "\t") && (str.charAt(i) != "\n") && (str.charAt(i)!="\r")) {
            return false;
        }
    }
    return true;
}
//-----------------------------------------------------------------------------
// 문자열에서 replaceStr 에 해당하는 문자열을 ""로 치환한다.
// @return : string
//-----------------------------------------------------------------------------
function replaceAll(str, searchStr, replaceStr) {
    return str.split(searchStr).join(replaceStr);
}
//-----------------------------------------------------------------------------
// 문자열이 숫자인지 확인한다.
// @return : boolean
//-----------------------------------------------------------------------------
function isNum(inText) {
    var deny_pattern = /^[0-9|\*]+$/;
    if (!deny_pattern.test(inText)) {
        return false;
    }
    return true;
}
//-----------------------------------------------------------------------------
// 숫자와 영어만 허용 - inText : 추가 허용할 문자들
// @return : boolean
//-----------------------------------------------------------------------------
function isEngNum(inText) {
    var deny_pattern = /^[a-z|A-Z|0-9|\*]+$/;
    if (!deny_pattern.test(inText)) {
        return false;
    }
    return true;
}
//-----------------------------------------------------------------------------
// 숫자와 영어, Space만 허용 - inText : 추가 허용할 문자들
// @return : boolean
//-----------------------------------------------------------------------------
function isEngNumSpace(inText) {
    var deny_pattern = /^[a-z|A-Z|0-9| |\*]+$/;
    if (!deny_pattern.test(inText)) {
        return false;
    }
    return true;
}
//-----------------------------------------------------------------------------
// 폴더경로 체크, 허용문자 : one or more alphanumeric characters or underscore or hyphen
// @return : boolean
//-----------------------------------------------------------------------------
function isDirPath(inText) {
    //var deny_pattern = /^\/[a-z|A-Z|0-9|\/]+$/;
    var deny_pattern = /^(\/[\w\-]+)+$/;
    if (!deny_pattern.test(inText)) {
        return false;
    }
    return true;
}
//-----------------------------------------------------------------------------
// 영어만 허용 - inText : 추가 허용할 문자들
// @return : boolean
//-----------------------------------------------------------------------------
function isEng(inText) {
    var deny_pattern = /^[a-z|A-Z]+$/;
    if (!deny_pattern.test(inText)) {
         return false;
    }
    return true;
}
//-----------------------------------------------------------------------------
// 영어와 Space만 허용 - inText : 추가 허용할 문자들
// @return : boolean
//-----------------------------------------------------------------------------
function isEngSpace(inText) {
    var deny_pattern = /^[a-z|A-Z| ]+$/;
    if (!deny_pattern.test(inText)) {
         return false;
    }
    return true;
}
//-----------------------------------------------------------------------------
// 한글,영문 만 허용 - inText : 추가 허용할 문자들
// @return : boolean
//-----------------------------------------------------------------------------
function isHanEng(inText) {
    var deny_pattern = /^[ㄱ-ㅎ|가-힣|ㅏ-ㅣ|a-z|A-Z]+$/;
    if (!deny_pattern.test(inText)) {
        return false;
    }
    return true;
}
//-----------------------------------------------------------------------------
// 한글,영문,Space 만 허용 - inText : 추가 허용할 문자들
// @return : boolean
//-----------------------------------------------------------------------------
function isHanEngSpace(inText) {
    var deny_pattern = /^[ㄱ-ㅎ|가-힣|ㅏ-ㅣ|a-z|A-Z| |\s]+$/;
    if (!deny_pattern.test(inText)) {
        return false;
    }
    return true;
}
//-----------------------------------------------------------------------------
// 문자열이 email 포멧인지 확인한다.
// @return : boolean
//-----------------------------------------------------------------------------
function isEmail(value) {
    var regExp = /([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
    return regExp.test(value);
}

//-----------------------------------------------------------------------------
// 핸드폰 번호 : 앞자리 세자리
// @return : boolean
//-----------------------------------------------------------------------------
function phoneThree(value) {
    var regExp = /^01([0|1|6|7|8|9]?)$/;
    return regExp.test(value);
}

//-----------------------------------------------------------------------------
// 핸드폰 번호 : 가운데 세자리 혹은 네자리
// @return : boolean
//-----------------------------------------------------------------------------
function phoneThreeOrFour(value) {
    var regExp = /^([0-9]{3,4})$/;
    return regExp.test(value);
}

//-----------------------------------------------------------------------------
// 핸드폰 번호 : 뒷자리 네자리
// @return : boolean
//-----------------------------------------------------------------------------
function phoneFour(value) {
    var regExp = /^([0-9]{4})$/;
    return regExp.test(value);
}
