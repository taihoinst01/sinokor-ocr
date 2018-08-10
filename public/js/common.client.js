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
 * õ���� �޸�
 * @param {any} double
 */
function NumberWithComma(double) {
    var parts = double.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
/**
 * õ���� �޸� �� �Ҽ��� �ڸ���
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
 * �� ���ڿ��� ���Ͽ� ��ġ�ϴ��� Ȯ��
 * @param {any} a   ��1
 * @param {any} b   ��2
 * @returns ���� ��ġ�ϸ� 0, ���� ��ġ���� ������ -1�� return
 */
function strcmp(a, b) {
    return (a < b ? -1 : (a > b ? 1 : 0));
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

function wrapWindowByMask() {
    //ȭ���� ���̿� �ʺ� ���Ѵ�.
    var maskHeight = $(document).height();
    var maskWidth = $(window).width();

    //����ũ�� ���̿� �ʺ� ȭ�� ������ ����� ��ü ȭ���� ä���.
    $('#mask').css({ 'width': maskWidth, 'height': maskHeight });

    //�ִϸ��̼� ȿ�� - �ϴ� 1�ʵ��� ��İ� �ƴٰ� 80% �������� ����.
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

// �����н� �������� �ۼ�Ʈ���� ���� ���� ��ȭ
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


// li ���ý� input[type=hidden]�� �� �־��ֱ�
function liSelect(e, val) {
    $(e).parents('.select_style_K').find('.liSelectValue').val(val);
}


// Ŀ���� ���̺� ��ũ��
$(function () {
    // divBodyScroll�� ��ũ���� �����Ҷ��� �Լ��� �ҷ��ɴϴ�.
    $('.divBodyScroll').scroll(function () {
        // divBodyScroll�� x��ǥ�� ������ �Ÿ��� �����ɴϴ�.
        var xPoint = $(this).scrollLeft();

        // ������ x��ǥ�� divHeadScroll�� ������� ���� �����ϼ� �ֵ��� �մϴ�.
        $(this).prev().scrollLeft(xPoint);
    });

});