'use strict';

/******************************************
 * server util function js
 * ****************************************/
var MAX_PAGE_IN_SET = 5;        // ������ ī��Ʈ
var MAX_ENTITY_IN_PAGE = 10;    // �� ������ �� ������ ��

/**
 * null �̳� ���� ������ ����
 * @param str       �Է°�
  * @returns {String}    üũ �����
 */
function nvl(str) {
    var defaultValue = "";
    if (typeof str == "undefined" || str == null || str == '' || str == "undefined")
        return defaultValue;
    return str;
}

/**
 * null �̳� ���� �⺻������ ����
 * @param str       �Է°�
 * @param defaultVal    �⺻��(�ɼ�)
 * @returns {String}    üũ �����
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
 * obj�� null Ȯ��
 * @param str       �Է°�
 * @returns {boolean}    üũ �����
 */
function isNull(obj) {
    return (typeof obj != "undefined" && obj != null && obj != "") ? false : true;
}

/**
 * leadingZeros
 * 0���� �ڸ��� ä���
 * @param n       ��
 * @param digits  �ڸ���
 * @returns zero+n    �����
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
 * �������ڽð�
 * @param separator1       ������(����)
 * @param separator2       ������(�ð�)
 * @returns date(yyyymmdd)    yyyy + ������(����) + mm + ������(����) + dd + " " + hh + ������(�ð�) + mi + ������(�ð�) + ss
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
 * ��������
 * @param separator       ������
 * @returns date(yyyymmdd)    yyyy + ������ + mm + ������ + dd
 */
function getNowDate(separator) {
    var d = new Date();
    return leadingZeros(d.getFullYear(), 4) + separator +
        leadingZeros(d.getMonth() + 1, 2) + separator +
        leadingZeros(d.getDate(), 2);
}
/**
 * getNowTime
 * ����ð�
 * @param separator       ������
 * @returns time(hhmiss)    hh + ������ + mi + ������ + ss
 */
function getNowTime(separator) {
    var d = new Date();
    return leadingZeros(d.getHours(), 2) + separator +
        leadingZeros(d.getMinutes(), 2) + separator +
        leadingZeros(d.getSeconds(), 2);
}

/**
 * getAddYear, getAddMonth, getAddDate
 * @param {val} �������ڿ��� ����� yearVal-��, monthVal-��, dateVal-��
 * @param {separator} ������
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