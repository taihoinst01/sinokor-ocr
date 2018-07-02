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

module.exports = {
    MAX_PAGE_IN_SET: MAX_PAGE_IN_SET,
    MAX_ENTITY_IN_PAGE: MAX_ENTITY_IN_PAGE,
    nvl : nvl,
    nvl2 : nvl2,
    isNull : isNull
}