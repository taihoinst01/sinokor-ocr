'use strict';

/******************************************
 * client function js
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
 * ����¡ ����
 * 
 * @param {any} curPage ���� ������
 * @param {any} totalCount �� ������ ��
 */
function pagination(curPage, totalCount) {
    if (curPage && totalCount) {
        var paging_result = '';
        var maxPageInSet = MAX_PAGE_IN_SET,                         // ������ ī��Ʈ
            maxEntityInPage = MAX_ENTITY_IN_PAGE,                   // �� �������� ������ ��
            totalPage = Math.ceil(totalCount / maxEntityInPage),    // ��ü ������ ��
            totalSet = Math.ceil(totalPage / maxPageInSet),         // ��ü ��Ʈ ��
            curSet = Math.ceil(curPage / maxPageInSet),             // ���� ��Ʈ ��ȣ
            startPage = ((curSet - 1) * maxPageInSet) + 1,          // ���� ��Ʈ �� ��µ� ���� ������
            endPage = (startPage + maxPageInSet) - 1;               // ���� ��Ʈ �� ��µ� ������ ������

        if (curSet > 1) paging_result += '<li><a href="#;" onclick="javascript:goPage(' + i + ')">' + (startPage - 1) + '</a></li>';
        for (var i = startPage; i <= endPage; i++) {
            if (i > totalPage) break;   // ��ü������ ���� ũ�� ����
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