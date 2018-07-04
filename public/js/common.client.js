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

// Progress Bar
function loadProgressBar() {
    $("#myProgress").fadeIn("slow");
}
function addProgressBar(fromVal, toVal) {
    var elem = document.getElementById("myBar");
    var width = fromVal;
    elem.style.width = fromVal + '%';
    var id = setInterval(frame, 10);
    function frame() {
        console.log(width);
        if (width >= 100) {
            closeProgressBar();
            clearInterval(id);
        } else if (width >= toVal) {
            clearInterval(id);
        } else {
            width++;
            elem.style.width = width + '%';
        }
    }
}
function closeProgressBar() {
    $("#myProgress").fadeOut("slow");
    document.getElementById("myBar").style.width = 1;
}