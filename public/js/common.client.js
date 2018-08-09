'use strict';

/******************************************
 * client function js
 * ****************************************/
var MAX_PAGE_IN_SET = 5;        // 페이지 카운트
var MAX_ENTITY_IN_PAGE = 10;    // 한 페이지 당 컨텐츠 수

/**
 * null 이나 빈값을 빈값으로 변경
 * @param str       입력값
  * @returns {String}    체크 결과값
 */
function nvl(str) {
    var defaultValue = "";
    if (typeof str == "undefined" || str == null || str == '' || str == "undefined")
        return defaultValue;
    return str;
}

/**
 * null 이나 빈값을 기본값으로 변경
 * @param str       입력값
 * @param defaultVal    기본값(옵션)
 * @returns {String}    체크 결과값
 */
function nvl2(str, defaultVal) {
    var defaultValue = "";
    if (typeof defaultVal != 'undefined')
        defaultValue = defaultVal;
    if (typeof str == "undefined" || str == null || str == '' || str == "undefined")
        return defaultValue;
    return str;
}

/**
 * obj의 null 확인
 * @param str       입력값
 * @returns {boolean}    체크 결과값
 */
function isNull(obj) {
    return (typeof obj != "undefined" && obj != null && obj != "") ? false : true;
}

/**
 * 천단위 콤마
 * @param {any} double
 */
function NumberWithComma(double) {
    var parts = double.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
/**
 * 천단위 콤마 및 소수점 자르기
 * @param {any} double
 * @param {any} decimalPointCipher
 */
function NumberWithCommas(double, decimalPointCipher) {
    var parts = double.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    parts[1] = parts[1].substr(0, decimalPointCipher);
    if (decimalPointCipher < 1) return parts[0];
    else return parts.join(".");
}

/**
 * leadingZeros
 * 0으로 자릿수 채우기
 * @param n       값
 * @param digits  자릿수
 * @returns zero+n    결과값
 */
function leadingZeros(n, digits) {
    var zero = '';
    n = n.toString();
    if (n.length < digits) {
        for (var i = 0; i < digits - n.length; i++) zero += '0';
    }
    return zero + n;
}

/**
 * 두 문자열을 비교하여 일치하는지 확인
 * @param {any} a   값1
 * @param {any} b   값2
 * @returns 값이 일치하면 0, 값이 일치하지 않으면 -1을 return
 */
function strcmp(a, b) {
    return (a < b ? -1 : (a > b ? 1 : 0));
}

/**
 * getNowDateTime
 * 현재일자시각
 * @param separator1       구분자(일자)
 * @param separator2       구분자(시각)
 * @returns date(yyyymmdd)    yyyy + 구분자(일자) + mm + 구분자(일자) + dd + " " + hh + 구분자(시각) + mi + 구분자(시각) + ss
 */
function getNowDateTime(separator1, separator2) {
    var d = new Date();
    return leadingZeros(d.getHours(), 2) + separator1 +
        leadingZeros(d.getMinutes(), 2) + separator1 +
        leadingZeros(d.getSeconds(), 2) + " "
    leadingZeros(d.getFullYear(), 4) + separator2 +
        leadingZeros(d.getMonth() + 1, 2) + separator2 +
        leadingZeros(d.getDate(), 2);
}
/**
 * getNowDate
 * 현재일자
 * @param separator       구분자
 * @returns date(yyyymmdd)    yyyy + 구분자 + mm + 구분자 + dd
 */
function getNowDate(separator) {
    var d = new Date();
    return leadingZeros(d.getFullYear(), 4) + separator +
        leadingZeros(d.getMonth() + 1, 2) + separator +
        leadingZeros(d.getDate(), 2);
}
/**
 * getNowTime
 * 현재시각
 * @param separator       구분자
 * @returns time(hhmiss)    hh + 구분자 + mi + 구분자 + ss
 */
function getNowTime(separator) {
    var d = new Date();
    return leadingZeros(d.getHours(), 2) + separator +
        leadingZeros(d.getMinutes(), 2) + separator +
        leadingZeros(d.getSeconds(), 2);
}

/**
 * getAddYear, getAddMonth, getAddDate
 * @param {val} 현재일자에서 계산할 yearVal-년, monthVal-월, dateVal-일
 * @param {separator} 구분자
 */
function getAddYear(yearVal, separator) {
    var date = new Date();
    var y = date.getFullYear();
    var m = date.getMonth() + 1; 
    var d = date.getDate();
    return leadingZeros(y + yearVal, 4) + separator + leadingZeros(m, 2) + separator + leadingZeros(d, 2);
}
function getAddMonth(monthVal, separator) {
    var date = new Date();
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return leadingZeros(y, 4) + separator + leadingZeros(m + monthVal, 2) + separator + leadingZeros(d, 2);
}
function getAddDate(dateVal, separator) {
    var date = new Date();
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return leadingZeros(y, 4) + separator + leadingZeros(m, 2) + separator + leadingZeros(d + dateVal, 2);
}


/**
 * 페이징 생성
 * 
 * @param {any} curPage 현재 페이지
 * @param {any} totalCount 총 컨텐츠 수
 */
function pagination(curPage, totalCount) {
    if (curPage && totalCount) {
        var paging_result = '';
        var maxPageInSet = MAX_PAGE_IN_SET,                         // 페이지 카운트
            maxEntityInPage = MAX_ENTITY_IN_PAGE,                   // 한 페이지당 컨텐츠 수
            totalPage = Math.ceil(totalCount / maxEntityInPage),    // 전체 페이지 수
            totalSet = Math.ceil(totalPage / maxPageInSet),         // 전체 세트 수
            curSet = Math.ceil(curPage / maxPageInSet),             // 현재 세트 번호
            startPage = ((curSet - 1) * maxPageInSet) + 1,          // 현재 세트 내 출력될 시작 페이지
            endPage = (startPage + maxPageInSet) - 1;               // 현재 세트 내 출력될 마지막 페이지

        if (curSet > 1) paging_result += '<li><a href="#;" onclick="javascript:goPage(' + i + ')">' + (startPage - 1) + '</a></li>';
        for (var i = startPage; i <= endPage; i++) {
            if (i > totalPage) break;   // 전체페이지 보다 크면 종료
            paging_result += '<li ' + (i == curPage ? 'class="active"' : '') + '><a href="#;" onclick="javascript:goPage(' + i + ')">' + i + '</a></li>';
        }
        if (curSet < totalSet) paging_result += '<li><a href="#;" onclick="javascript:goPage(' + i + ')">' + i + '</a></li>';
        return paging_result;
    }
}

function wrapWindowByMask() {
    //화면의 높이와 너비를 구한다.
    var maskHeight = $(document).height();
    var maskWidth = $(window).width();

    //마스크의 높이와 너비를 화면 것으로 만들어 전체 화면을 채운다.
    $('#mask').css({ 'width': maskWidth, 'height': maskHeight });

    //애니메이션 효과 - 일단 1초동안 까맣게 됐다가 80% 불투명도로 간다.
    //$('#mask').fadeIn(1000);      
    $('#mask').fadeTo("slow", 0.6);
}

// Progress Bar
function startProgressBar() {
    $('body').css('overflow', 'hidden');
    
    $('#loadingBackground').css('width', $('body').width());
    $('#loadingBackground').css('height', $('body').height());
    $('#loadingBackground').show();
    wrapWindowByMask();
    $("#ocrProgress").fadeIn("fast");
}
function addProgressBar(fromVal, toVal) {
    var elem = document.getElementById("ocrBar");
    var width = fromVal;
    var percentNum = $('#ocrBar span');
    elem.style.width = fromVal + '%';
    percentNum.html(fromVal + '%');
    var id = setInterval(frame, 100);
    function frame() {
        if (width >= 100) {
            endProgressBar();
            clearInterval(id);
        } else if (width >= toVal) {
            clearInterval(id);
        } else {
            width++;
            elem.style.width = width + '%';
            percentNum.html(width + '%');
        }
    }
}
function endProgressBar() {
    $("#ocrProgress").fadeOut("fast");
    document.getElementById("ocrBar").style.width = 1;
    $('body').css('overflow', 'auto');
    $('#mask').fadeOut("fast");
    $('#loadingBackground').hide();
}

$("#predictionPercent").on('change', function () {
    var predictionPercent = $('#predictionPercent')
    var predictionPercentValue = $('#predictionPercent').html();

    if (predictionPercentValue >= 90 && predictionPercentValue <= 100) {
        predictionPercent.css('color', 'red');
    } else if (predictionPercentValue >= 80) {
        predictionPercent.css('color', 'orange');
    } else if (predictionPercentValue >= 70) {
        predictionPercent.css('color', 'yellow');
    } else if (predictionPercentValue >= 60) {
        predictionPercent.css('color', 'green');
    } else if (predictionPercentValue >= 50) {
        predictionPercent.css('color', 'yellow');
    } else {
        predictionPercent.css('color', 'purple');
    }
});

// 개별학습 예측문서 퍼센트값에 따른 색상 변화
function changePercentColor(val) {
    var predictionPercent = $('#predictionPercent');
    predictionPercent.html(val);
    if (val >= 90 && val <= 100) {
        predictionPercent.css('color', 'red');
    } else if (val >= 80) {
        predictionPercent.css('color', 'orange');
    } else if (val >= 70) {
        predictionPercent.css('color', 'yellow');
    } else if (val >= 60) {
        predictionPercent.css('color', 'green');
    } else if (val >= 50) {
        predictionPercent.css('color', 'yellow');
    } else {
        predictionPercent.css('color', 'purple');
    }
}

function changeTest() {
    changePercentColor($('#changeTest').val());
}


// li 선택시 input[type=hidden]에 값 넣어주기
function liSelect(e, val) {
    $(e).parents('.select_style_K').find('.liSelectValue').val(val);
}


// 커스텀 테이블 스크롤
$(function () {
    // divBodyScroll의 스크롤이 동작할때에 함수를 불러옵니다.
    $('.divBodyScroll').scroll(function () {
        // divBodyScroll의 x좌표가 움직인 거리를 가져옵니다.
        var xPoint = $(this).scrollLeft();

        // 가져온 x좌표를 divHeadScroll에 적용시켜 같이 움직일수 있도록 합니다.
        $(this).prev().scrollLeft(xPoint);
    });

});