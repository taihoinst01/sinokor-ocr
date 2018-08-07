//import { identifier } from "babel-types";
"use strict";

// uploadFile info
var gbl_fileInfo = [];      // 파일(tif) 정보
var gbl_fileDtlInfo = [];   // 파일(변환 jpg) 정보

// ML global function
var lineText = []; // line별로 가공된 ocr데이터 배열
var totCount = 0; // 전체 분석 문서 개수
var ocrCount = 0; // ocr 수행 횟수
var searchDBColumnsCount = 0; // DB컬럼 조회 수행 횟수
var thumbImgs = []; // 썸네일 이미지 경로 배열
var thumnImgPageCount = 1; // 썸네일 이미지 페이징 번호
var thumnbImgPerPage = 10; // 한 페이지당 썸네일 이미지 개수
var x, y, textWidth, textHeight; // 문서 글씨 좌표
var mouseX, mouseY, mouseMoveX, mouseMoveY; // 마우스 이동 시작 좌표, 마우스 이동 좌표

$(function () {
    _init();
});

/****************************************************************************************
 * BUTTON EVENT
 ****************************************************************************************/

/****************************************************************************************
 * FILE UPLOAD EVENT
 ****************************************************************************************/
var uploadFileEvent = function() {
    $('#uploadFile').change(function () {
        if ($(this).val() !== '') {
            gbl_fileInfo = [];
            gbl_fileDtlInfo = [];
            lineText = [];
            $('#ul_image').html('');
            totCount = 0;
            ocrCount = 0;
            searchDBColumnsCount = 0;
            $('#uploadFileForm').submit();
        }
    });

    $('#uploadFileBtn').click(function () {
        $('#uploadFile').click();
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
            //console.log(responseText);
            var $uploadForm = $('#uploadForm');
            var $uploadSucessForm = $('#uploadSucessForm');

            $("#progressMsgTitle").html('파일 업로드 완료..');
            $("#progressMsgDetail").html('');
            addProgressBar(11, 20);
            //$uploadForm.hide();
            $uploadSucessForm.show();

            // 업로드한 파일 정보 저장
            gbl_fileInfo = responseText.fileInfo;
            gbl_fileDtlInfo = responseText.fileDtlInfo;

            // 파일 ml 처리
            if (responseText.message.length > 0) {
                totCount = responseText.message.length;
                for (var i = 0; i < responseText.message.length; i++) {
                    console.log(".....여기에 : " + responseText.message[i]);
                    processImage(responseText.message[i]);
                }
            }
            //endProgressBar();
        },
        error: function (e) {
            endProgressBar();
            //console.log(e);
        }
    });
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
        detailTable($(this).children().prop('src').split('/')[4].split('")')[0]);
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
 * ML
 ****************************************************************************************/
// OCR API
var processImage = function(fileName) {
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
        if (!data.code) { // 에러가 아니면
            //console.log(data);
            thumbImgs.push(fileName);
            $('#progressMsgTitle').html('OCR 처리 완료');
            $('#progressMsgDetail').html(fileName);
            addProgressBar(31, 40);
            appendOcrData(fileName, data.regions);
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
var appendOcrData = function(fileName, regions) {
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
    executeML(fileName, data, 'ts');
}

/**
 * @param {any} type
 * ts : typoSentence , dd : domainDictionary , tc : textClassification , lm : labelMapping , sc : searchDBColumns
 */
var executeML = function(fileName, data, type) {
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
                executeML(data.fileName, data.data, data.nextType);
            } else {
                lineText.push(data);
                searchDBColumnsCount++;

                if (searchDBColumnsCount == 1) {
                    var mainImgHtml = '';
                    mainImgHtml += '<div id="mainImage">';
                    mainImgHtml += '<div id="redNemo">';
                    mainImgHtml += '</div>';
                    mainImgHtml += '</div>';
                    mainImgHtml += '<div id="imageZoom">';
                    mainImgHtml += '<div id="redZoomNemo">';
                    mainImgHtml += '</div>';
                    mainImgHtml += '</div>';
                    //$('#img_content').html(mainImgHtml);
                    $('#div_view_image').html(mainImgHtml);
                    $('#mainImage').css('background-image', 'url("../../uploads/' + fileName + '")');
                    thumnImg();
                    $('#imageBox > li').eq(0).addClass('on');
                    //detailTable(fileName);
                    fn_processData(); // ML 데이터 처리 (insert DB, show UI)
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

// ML 데이터 처리 (insert DB, show UI)
var fn_processData = function() {
    //console.log("line text : " + JSON.stringify(lineText));
    // TODO: 파일명 외의 파일 정보 필요
    console.log("fn_processData fileInfo : " + JSON.stringify(gbl_fileInfo));
    console.log("fn_processData fileDtlInfo : " + JSON.stringify(gbl_fileDtlInfo));
    console.log("fn_processData fileInfo : " + gbl_fileInfo.length);
    console.log("fn_processData fileDtlInfo : " + gbl_fileDtlInfo.length);

    //thumbImgs: 26.jpg
    //fn_processData fileInfo: [{
    //    "imgId": "qgg5s4da5v", "filePath": "uploads\\26.tif", "oriFileName": "26.tif",
    //    "convertFileName": "", "svrFileName": "42f7hdkgi7i", "fileExt": "tif", "fileSize": 99390, "contentType": "image/tiff", "regId": "admin"
    //}]
    //fn_processData fileDtlInfo: [{
    //    "imgId": "qgg5s4da5v", "filePath": "C:\\workspace\\sinokor-ocr\\uploads\\26.jpg",
    //    "oriFileName": "uploads\\26.jpg", "convertFileName": "", "svrFileName": "agfb7cp2oekd",
    //    "fileExt": "oads\\26.jpg", "fileSize": 230103, "contentType": "image/jpeg", "regId": "admin"
    //}]

    var baseHtml = "";
    var dtlHtml = "";
    var fileLen = gbl_fileInfo.length;
    var fileDtlLen = gbl_fileDtlInfo.length;

    for (var i = 0, arr; arr = lineText[i]; i++) {
        console.log("document : " + JSON.stringify(arr));
        // TODO : 파일 정보를 1 record로 생성한다.
        var baseHtml = `<tr>
                            <td><input type="checkbox" id="base_chk_${arr.imgId}" name="base_chk" /></td>
                            <td>${arr.imgId}</td>
                            <td>${gbl_fileDtlInfo.length}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td><input type="text" id="base_memo_${arr.imgId}" name="base_memo" value="" /></td>
                        </tr>`;

        var dataObj = {};
        var dataVal = arr.data;

        for (var x = 0, item; item = dataVal[x]; x++) {
            console.log("make document dtl: " + JSON.stringify(item));

            dataObj["imgId"] = arr.imgId;

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
                                <td>${dataObj.csconm}</td> 
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
        $("#tbody_baseInfo").empty().append(baseHtml);
    }

    // TODO : DB 처리
    // TODO : 파일의 기본정보를 TBL_OCR_FILE에 추가한다.
    // TODO : 파일정보를 TBL_DOCUMENT에 추가한다.
    // TODO : 파일의 분석결과를 TBL_DOCUMENT_DTL에 추가한다.
    // TODO : 위 과정은 한번의 ajax 호출로 트랜잭션 처리한다.

    // TODO : DB 처리가 성공하면 문서기본정보, 인식결과에 보여준다.
}

// DB 컬럼 option 렌더링
function dbColumnsOption(data, column) {
    var optionTag = '';
    var selected = '';

    optionTag += '<li>';
    var isMatch = false;

    if (data.column != null) {
        for (var cNum in column) {
            if (data.column == column[cNum].ENKEYWORD) {

                var gubun = '';

                if (column[cNum].LABEL == "fixlabel" || column[cNum].LABEL == "entryrowlabel") {
                    gubun = "::LABEL";
                } else if (column[cNum].LABEL == "fixvalue" || column[cNum].LABEL == "entryvalue") {
                    gubun = "::VALUE";
                }

                optionTag += '<a class="dbColumnText" href="javascript:void(0);">' + column[cNum].KOKEYWORD + gubun + '</a>';
            }
        }
    } else {
        optionTag += '<a class="dbColumnText" href="javascript:void(0);">none</a>';
    }
    optionTag += '<ul>';
    for (var row of column) {

        var gubun = '';

        if (row.LABEL == "fixlabel" || row.LABEL == "entryrowlabel") {
            gubun = "::LABEL";
        } else if (row.LABEL == "fixvalue" || row.LABEL == "entryvalue") {
            gubun = "::VALUE";
        }

        optionTag += '<li>';
        optionTag += '<a href="javascript:void(0);"><span>' + row.KOKEYWORD + gubun + '</span></a>';
        optionTag += '<ul>';
        optionTag += '<li><a href="javascript:void(0);">키워드</a></li>';
        optionTag += '<li><a href="javascript:void(0);">가변값</a></li>';
        optionTag += '</ul>';
        optionTag += '</li>';
    }
    optionTag += '<li>';
    optionTag += '<a href="javascript:void(0);"><span>none</span></a>';
    optionTag += '<ul>';
    optionTag += '<li><a href="javascript:void(0);">키워드</a></li>';
    optionTag += '<li><a href="javascript:void(0);">가변값</a></li>';
    optionTag += '</ul>';
    optionTag += '</li>';

    optionTag += '</ul>';
    optionTag += '</li>';


    return optionTag;
}

function uiTrainEvent() {
    $("#uiTrainBtn").click(function (e) {
        uiTrainAjax();
    });
}

function uiTrainAjax() {

    if (lineText[0] == null) {
        alert("학습할 데이터가 없습니다.");
        return;
    }

    var dataArray = [];

    var tr = $("#textResultTbl dl");

    //console.log(td.eq(0).text());

    for (var i = 0; i < tr.length; i++) {
        var text = tr.eq(i).find('input[type="text"]').val();
        var location = tr.eq(i).find('input[type="hidden"]').val();
        var column = tr.eq(i).find('a.dbColumnText').text();
        var columnSplit = column.split("::");

        var obj = {}
        obj.text = text;
        obj.location = location;
        obj.column = columnSplit[0];

        dataArray.push(obj);
    }

    for (var i = 0; i < lineText[0].data.length; i++) {
        for (var j = 0; j < dataArray.length; j++) {
            if (lineText[0].data[i].location == dataArray[j].location) {
                if (lineText[0].data[i].text != dataArray[j].text) {
                    dataArray[j].originText = lineText[0].data[i].text;
                }
            }
        }
    }
    startProgressBar();
    addProgressBar(1, 20);

    $.ajax({
        url: '/uiLearning/uiTrain',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ "data": dataArray }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            addProgressBar(21, 100);
            alert(data);
        },
        error: function (err) {
            console.log(err);
        }
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

/****************************************************************************************
 * INIT
 ****************************************************************************************/
var _init = function () {
    uploadFileEvent();
    thumbImgPagingEvent();
    uiTrainEvent();
};