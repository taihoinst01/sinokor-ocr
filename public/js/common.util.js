'use strict';

/******************************************
 * server util function js
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

module.exports = {
    MAX_PAGE_IN_SET: MAX_PAGE_IN_SET,
    MAX_ENTITY_IN_PAGE: MAX_ENTITY_IN_PAGE,
    nvl : nvl,
    nvl2 : nvl2,
    isNull : isNull
}