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

module.exports = {
    MAX_PAGE_IN_SET: MAX_PAGE_IN_SET,
    MAX_ENTITY_IN_PAGE: MAX_ENTITY_IN_PAGE,
    nvl : nvl,
    nvl2 : nvl2,
    isNull: isNull,
    leadingZeros: leadingZeros,
    getNowDateTime: getNowDateTime,
    getNowDate: getNowDate,
    getNowTime: getNowTime,
    getAddYear: getAddYear,
    getAddMonth: getAddMonth,
    getAddDate: getAddDate
}