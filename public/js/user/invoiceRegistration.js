//import { identifier } from "babel-types";
"use strict";

/****************************************************************************************
 * GLOBAL VARIABLE
 ****************************************************************************************/
var totCount = 0;
var ocrCount = 0;
var searchDBColumnsCount = 0;
var lineText = [];
var thumbImgs = []; // 썸네일 이미지 경로 배열
var thumnImgPageCount = 1; // 썸네일 이미지 페이징 번호
var thumnbImgPerPage = 10; // 한 페이지당 썸네일 이미지 개수
var x, y, textWidth, textHeight; // 문서 글씨 좌표
var mouseX, mouseY, mouseMoveX, mouseMoveY; // 마우스 이동 시작 좌표, 마우스 이동 좌표

$(function () {
    _init();

    $("#mCSB_1_dragger_horizontal").mCustomScrollbar({
        callbacks: {
            whileScrolling: function () {
                $('#divHeadScroll').scrollLeft($('#mCSB_1_dragger_horizontal').css('left').substring(0, $('#mCSB_1_dragger_horizontal').css('left').indexOf("p")));
            }
        }
    });

    
});

/****************************************************************************************
 * INIT
 ****************************************************************************************/
var _init = function () {
    fn_uploadFileEvent();
};


/****************************************************************************************
 * FILE UPLOAD EVENT
 ****************************************************************************************/
var fn_uploadFileEvent = function () {
    $("#uploadFile").change(function () {
        if ($(this).val() !== "") {
            lineText = [];
            totCount = 0;
            ocrCount = 0;
            searchDBColumnsCount = 0;
            $('#ul_image').html('');
            $('#uploadFileForm').submit();
        }
    });

    $("#uploadFileBtn").click(function () {
        $("#uploadFile").click();
    });

    $('#uploadFileForm').ajaxForm({
        beforeSubmit: function (data, frm, opt) {
            $("#progressMsgTitle").html('파일 업로드 중..');
            $("#progressMsgDetail").html('');
            startProgressBar(); // start progressbar
            addProgressBar(1, 10); // proceed progressbar
            return true;
        },
        success: function (responseText, statusText) {
            $("#progressMsgTitle").html('파일 업로드 완료..');
            $("#progressMsgDetail").html('');
            addProgressBar(11, 20);

            console.log(`base 사이즈 : ${responseText.fileInfo.length}`);
            console.log(`dtl 사이즈 : ${responseText.fileDtlInfo.length}`);
            console.log(`base 내용 : ${JSON.stringify(responseText.fileInfo)}`);
            console.log(`dtl 내용 : ${JSON.stringify(responseText.fileDtlInfo)}`);

            totCount = responseText.fileInfo.length; 
            // 문서 기본 정보 처리
            fn_processBaseImage(responseText.fileInfo);
            // 인식 결과 및 ML 처리
            for (var i = 0, x = responseText.fileDtlInfo.length; i < x; i++) {
                fn_processDtlImage(responseText.fileDtlInfo[i]);
            }

            //endProgressBar();
        },
        error: function (e) {
            endProgressBar();
            //console.log(e);
        }
    });
};

/****************************************************************************************
 * ML
 ****************************************************************************************/
// 문서 기본 정보 append
var fn_processBaseImage = function(fileInfo) {
    var html = "";
    console.log("fileInfo.. length... : " + fileInfo.length);
    for (var i = 0, x = fileInfo.length; i < x; i++) {
        var item = fileInfo[i];
        html += `<tr>
                    <td><input type="checkbox" id="base_chk_${item.imgId}" name="base_chk" /></td>
                    <td>${item.imgId}</td>
                    <td>${fileInfo.length}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><input type="text" id="base_memo_${item.imgId}" name="base_memo" value="" /></td>
                </tr>`;
    }
    $("#tbody_baseInfo").empty().append(html);
}

// ML 및 인식결과 append
var fn_processDtlImage = function (fileDtlInfo) {
    var fileName = fileDtlInfo.oriFileName;
    $('#progressMsgTitle').html('OCR 처리 중..');
    $('#progressMsgDetail').html(fileName);
    addProgressBar(21, 30);
    $.ajax({
        url: '/common/ocr',
        beforeSend: function (jqXHR) {
            jqXHR.setRequestHeader("Content-Type", "application/json");
        },
        type: "POST",
        data: JSON.stringify({ 'fileName': fileName }),
    }).done(function (data) {
        ocrCount++;
        thumbImgs.push(fileName);
        if (!data.code) { // 에러가 아니면
            //thumbImgs.push(fileName);
            $('#progressMsgTitle').html('OCR 처리 완료');
            $('#progressMsgDetail').html(fileName);
            addProgressBar(31, 40);
            appendOcrData(fileDtlInfo, fileName, data.regions);
        } else if (data.error) { //ocr 이외 에러이면
            endProgressBar();
            alert(data.error);
        } else { // ocr 에러 이면
            insertCommError(data.code, 'ocr');
            endProgressBar();
            alert(data.message);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
    });
}


// OCR 데이터 line별 가공 & 상세 테이블 렌더링 & DB컬럼 조회
var appendOcrData = function (fileDtlInfo, fileName, regions) {
    var data = [];
    for (var i = 0; i < regions.length; i++) {
        for (var j = 0; j < regions[i].lines.length; j++) {
            var item = '';
            for (var k = 0; k < regions[i].lines[j].words.length; k++) {
                item += regions[i].lines[j].words[k].text + ' ';
            }
            data.push({ 'location': regions[i].lines[j].boundingBox, 'text': item.trim() });
        }
    }
    executeML(fileDtlInfo, fileName, data, 'ts');
}

/**
 * @param {any} type
 * ts : typoSentence , dd : domainDictionary , tc : textClassification , lm : labelMapping , sc : searchDBColumns
 */
var executeML = function (fileDtlInfo, fileName, data, type) {
    $('#progressMsgDetail').html(JSON.stringify({ 'fileName': fileName, 'data': data }).substring(0, 200) + '...');
    var targetUrl;

    console.log(`다음 순서 type = ${type}`);

    if (type == 'ts') {
        targetUrl = '/invoiceRegistration/typoSentence';
        $('#progressMsgTitle').html('오타 수정 처리 중..');
        addProgressBar(41, 50);
    } else if (type == 'dd') {
        targetUrl = '/invoiceRegistration/domainDictionary';
        $('#progressMsgTitle').html('도메인 사전 처리 중..');
        addProgressBar(51, 60);
    } else if (type == 'tc') {
        targetUrl = '/invoiceRegistration/textClassification';
        $('#progressMsgTitle').html('텍스트 분류 처리 중..');
        addProgressBar(61, 70);
    } else if (type == 'st') {
        targetUrl = '/invoiceRegistration/statementClassification';
        $('#progressMsgTitle').html('계산서 분류 처리 중..');
        addProgressBar(71, 75);
    } else if (type == 'lm') {
        targetUrl = '/invoiceRegistration/labelMapping';
        $('#progressMsgTitle').html('라벨 매핑 처리 중..');
        addProgressBar(76, 80);
    } else {
        targetUrl = '/invoiceRegistration/searchDBColumns';
        $('#progressMsgTitle').html('DB 컬럼 조회 중..');
        addProgressBar(81, 90);
    }

    $.ajax({
        url: targetUrl,
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'fileName': fileName, 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            if (data.nextType) {
                executeML(fileDtlInfo, data.fileName, data.data, data.nextType);
            } else {
                lineText.push(data);
                fn_processFinish(data.data, fileDtlInfo); // 인식 결과
                searchDBColumnsCount++;

                if (searchDBColumnsCount == 1) {
                    var mainImgHtml = `
                                        <div id="mainImage">
                                            <div id="redNemo"></div>
                                        </div>
                                        <div id="imageZoom">
                                            <div id="redZoomNemo"></div>
                                        </div>`;
                    $('#div_view_image').html(mainImgHtml);
                    $('#mainImage').css('background-image', 'url("../../uploads/' + fileName + '")');
                    $('#imageBox > li').eq(0).addClass('on');
                    thumnImg();
                }
                if (totCount == searchDBColumnsCount) {
                    thumbImgEvent();
                    addProgressBar(91, 100);
                }
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// 인식 결과 처리
function fn_processFinish(data, fileDtlInfo) {
    console.log("data : " + JSON.stringify(data));
    console.log("fileDtlInfo : " + JSON.stringify(fileDtlInfo));

    var dataObj = {};
    var dataVal = data;
    dataObj["imgId"] = fileDtlInfo.imgId;

    for (var x = 0, item; item = dataVal[x]; x++) {
        console.log("make document dtl: " + JSON.stringify(item));

        var location = nvl(item["location"]);
        var text = nvl(item["text"]);
        var label = nvl(item["label"]);
        var column = nvl(item["column"]);

        if (label == "fixlabel" || label == "entryrowlabel") {
            for (var y = 0, labelItem; labelItem = dataVal[y]; y++) {
                if (labelItem.column == column + "_VALUE") {// 해당 라벨에 대한 값이면
                    console.log("Find Label and Value : " + labelItem["column"] + " >> " + labelItem["text"]);
                    if (isNull(dataObj[column])) {
                        // 양식 변경전이랑 비교해야하기 때문에 ml에서 나온 값은 출재사명(거래사명),계약명,개시일, 종료일만을 담아서 보냄. 추후 수정 필요 -- 07.27 hyj
                        if (column == "CSCO_NM") {
                            dataObj["csconm"] = labelItem["text"];
                        } else if (column == "CT_NM") {
                            dataObj["ctnm"] = labelItem["text"];
                        } else if (column == "INS_ST_DT") {
                            dataObj["insstdt"] = labelItem["text"];
                        } else if (column == "INS_END_DT") {
                            dataObj["inenddt"] = labelItem["text"];
                        } else if (column == "CSCO_SA_RFRN_CNNT2") {
                            dataObj["cscoSaRfrnCnnt2"] = labelItem["text"];
                        }

                        // DOUBLE 형태의 값은 공백 제거 처리                       
                        /*
                        if (column == "PRE" || column == "COM" || column == "BRKG" || column == "TXAM" ||
                            column == "PRRS_CF" || column == "PRRS_RLS" || column == "LSRES_CF" ||
                            column == "LSRES_RLS" || column == "CLA" || column == "EXEX" || column == "SVF" ||
                            column == "CAS" || column == "NTBL") {
                            dataObj[column] = data[j]["text"].replace(/(\s*)/g, "");
                        } else {
                            dataObj[column] = data[j]["text"];
                        }
                        */
                    } else {
                        console.log("Already exist Column(KEY) : " + labelItem["column"] + " >> " + labelItem["text"]);
                    }
                }

            }
        }

        console.log("dataObj : " + JSON.stringify(dataObj));

        // TODO : 분석 결과를 정리하고 1 record로 생성한다.
        var dtlHtml = `<tr>
                                <td><input type="checkbox" id="dtl_chk_${item.imgId}" name="dtl_chk" /></td>
                                <td></td>
                                <td></td>
                                <td>${dataObj.cscoSaRfrnCnnt2}</td> 
                                <td>${dataObj.ctnm}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>`;

        $("#tbody_dtlInfo").empty().append(dtlHtml);
    }
}

/****************************************************************************************
 * SCREEN EVENT
 ****************************************************************************************/
// 썸네일 이미지 페이지 이동 버튼 클릭 이벤트
var thumbImgPagingEvent = function () {
    $('#thumb-prev').click(function () {
        thumnImgPageCount--;
        thumbImgPaging(thumnImgPageCount);
    });
    $('#thumb-next').click(function () {
        thumnImgPageCount++;
        thumbImgPaging(thumnImgPageCount);
    });
}

// 초기 썸네일 이미지 렌더링
var thumnImg = function () {
    console.log("thumbImgs : " + thumbImgs);
    for (var i in thumbImgs) {
        if ($('#ul_image > li').length < thumnbImgPerPage) {
            //var imageTag = '<li><a href="#none" class="imgtmb thumb-img" style="background-image:url(../../uploads/' + thumbImgs[i] + '); width: 48px;"></a></li>';
            var imageTag = `<li><a href="#none" class="imgtmb thumb-img"><img src="../../uploads/${thumbImgs[i]}" style="width: 48px;" /></a></li>`;
            $('#ul_image').append(imageTag);
        } else {
            break;
        }
    }
    $('#thumb-tot').attr('disabled', false);
    if (thumbImgs.length > thumnbImgPerPage) {
        $('#thumb-prev').attr('disabled', true);
        $('#thumb-next').attr('disabled', false);
    } else {
        $('#thumb-prev').attr('disabled', true);
        $('#thumb-next').attr('disabled', true);
    }
    thumbImgEvent();
    //console.log(thumbImgs);
}

// 썸네일 이미지 페이징
var thumbImgPaging = function (pageCount) {
    $('#imageBox').html('');
    var startImgCnt = thumnbImgPerPage * pageCount - thumnbImgPerPage;
    var endImgCnt = thumnbImgPerPage * pageCount;

    if (startImgCnt == 0) {
        $('#thumb-prev').attr('disabled', true);
    } else {
        $('#thumb-prev').attr('disabled', false);
    }

    if (endImgCnt >= thumbImgs.length) {
        endImgCnt = thumbImgs.length;
        $('#thumb-next').attr('disabled', true);
    } else {
        $('#thumb-next').attr('disabled', false);
    }

    var imageTag = '';
    for (var i = startImgCnt; i < endImgCnt; i++) {
        imageTag += '<li>';
        imageTag += '<a href="javascript:void(0);" class="imgtmb thumb-img" style="background-image:url(../../uploads/' + thumbImgs[i] + '); width: 48px;"></a>';
        imageTag += '</li>';
    }
    $('#imageBox').append(imageTag);
    thumbImgEvent();
}

// 썸네일 이미지 클릭 이벤트
var thumbImgEvent = function () {
    $('.thumb-img').click(function () {
        $('#imageBox > li').removeClass('on');
        $(this).parent().addClass('on');
        //$('#mainImage').css('background-image', $(this).css('background-image'));
        $('#mainImage').css('background-image', $(this).children().prop('src'));
        //detailTable($(this).css('background-image').split('/')[4].split('")')[0]);
        //detailTable($(this).children().prop('src').split('/')[4].split('")')[0]);
    });
}

// 마우스 오버 이벤트
function hoverSquare(e) {
    $('#mainImage').css('height', '500px');
    $('#imageZoom').css('height', '300px').css('background-image', $('#mainImage').css('background-image')).show();

    // 사각형 좌표값
    var location = $(e).find('input[type=hidden]').val().split(',');
    x = parseInt(location[0]);
    y = parseInt(location[1]);
    textWidth = parseInt(location[2]);
    textHeight = parseInt(location[3]);

    // 해당 텍스트 x y좌표 원본 이미지에서 찾기
    $('#imageZoom').css('background-position', '-' + (x - 5) + 'px -' + (y - 5) + 'px');

    //실제 이미지 사이즈와 메인이미지div 축소율 판단
    var reImg = new Image();
    var imgPath = $('#mainImage').css('background-image').split('("')[1];
    imgPath = imgPath.split('")')[0];
    reImg.src = imgPath;
    var width = reImg.width;
    var height = reImg.height;

    // 선택한 글씨에 빨간 네모 그리기
    $('#redNemo').css('top', ((y / (height / $('#mainImage').height())) + $('#imgHeader').height() + 22 + 42 - 10) + 'px');
    $('#redNemo').css('left', ((x / (width / $('#mainImage').width())) + 22 + 99 - 10) + 'px');
    $('#redNemo').css('width', ((textWidth / (width / $('#mainImage').width())) + 20) + 'px');
    $('#redNemo').css('height', ((textHeight / (height / $('#mainImage').height())) + 20) + 'px');
    $('#redNemo').show();
    $('#redZoomNemo').css('width', textWidth + 10);
    $('#redZoomNemo').css('height', textHeight + 10);
    $('#redZoomNemo').show();
}

// 마우스 아웃 이벤트
function moutSquare(e) {
    $('#redNemo').hide();
    $('#redZoomNemo').hide();
    $('#imageZoom').hide();
    $('#mainImage').css('height', '700px');
}

function dbSelectClickEvent() {
    $('.selectBox > li').click(function (e) {
        if ($(this).children('ul').css('display') == 'none') {
            $('.selectBox > li').removeClass('on');
            $('.selectBox > li > ul').hide();
            $('.selectBox > li > ul').css('visibility', 'hidden').css('z-index', '0');
            $(this).addClass('on');
            $(this).children('ul').show();
            $(this).children('ul').css('visibility', 'visible').css('z-index', '1');
            $('.box_table_st').css('height', Number($('.box_table_st').height() + $(this).children('ul').height()) + 'px');
        } else {
            $(this).children('ul').hide();
            $(this).children('ul').css('visibility', 'hidden').css('z-index', '0');
            $('.box_table_st').css('height', Number($('.box_table_st').height() - $(this).children('ul').height()) + 'px');
        }
        e.preventDefault();
        e.stopPropagation();
    });
    $('.selectBox > li > ul > li').click(function (e) {
        if ($(this).children('ul').css('display') == 'none') {
            $('.selectBox > li > ul > li > ul').hide();
            $('.selectBox > li > ul > li > ul').css('visibility', 'hidden');
            $(this).children('ul').show();
            $(this).children('ul').css('visibility', 'visible').css('z-index', '2');
        } else {
            $(this).children('ul').hide();
            $(this).children('ul').css('visibility', 'hidden');
        }
        e.preventDefault();
        e.stopPropagation();
    });
    $('.selectBox > li > ul > li > ul > li').click(function (e) {
        var firstCategory = $(this).parent().prev().children('span').text();
        var lastCategory = ($(this).children('a').text() == '키워드') ? '' : ' 값';
        $(this).parent().parent().parent().prev().text(firstCategory);
        $(this).parent().parent().children('ul').hide();
        $(this).parent().parent().children('ul').css('visibility', 'hidden');
        $(this).parent().parent().parent().parent().children('ul').hide();
        $(this).parent().parent().parent().parent().children('ul').css('visibility', 'hidden').css('z-index', '0');
        $('.box_table_st').css('height', Number($('.box_table_st').height() - $(this).parent().parent().parent().parent().children('ul').height()) + 'px')
        e.preventDefault();
        e.stopPropagation();
    });
}


/****************************************************************************************
 * ETC
 ****************************************************************************************/
var insertCommError = function (eCode, type) {
    $.ajax({
        url: '/common/insertCommError',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'eCode': eCode, type: type }),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
        },
        success: function (data) {
        },
        error: function (err) {
            //console.log(err);
        }
    });
}