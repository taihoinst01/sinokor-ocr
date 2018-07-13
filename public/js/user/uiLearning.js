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

    init();
    uploadFileEvent();
    thumbImgPagingEvent();

});

// 초기 작업
function init() {
    $('.button_control').attr('disabled', true);
}

// 파일 업로드 이벤트
function uploadFileEvent() {
    $('#uploadFile').change(function () {
        if ($(this).val() !== '') {
            lineText = [];
            $('#imageBox').html('');
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
            $('#uploadFileBtn , #uploadInfoText').hide();
            startProgressBar();
            addProgressBar(1, 40);
            return true;
        },
        success: function (responseText, statusText) {
            //console.log(responseText);
            addProgressBar(41, 100);
            if (responseText.message.length > 0) {
                totCount = responseText.message.length;
                for (var i = 0; i < responseText.message.length; i++) {
                    processImage(responseText.message[i]);
                }
            }
        },
        error: function (e) {
            endProgressBar();
            //console.log(e);
        }
    });
}

// OCR API
function processImage(fileName) {
    var subscriptionKey = "fedbc6bb74714bd78270dc8f70593122";
    var uriBase = "https://westus.api.cognitive.microsoft.com/vision/v1.0/ocr";

    var params = {
        "language": "unk",
        "detectOrientation": "true",
    };

    var sourceImageUrl = 'http://kr-ocr.azurewebsites.net/uploads/' + fileName;

    $.ajax({
        url: uriBase + "?" + $.param(params),
        beforeSend: function (jqXHR) {
            jqXHR.setRequestHeader("Content-Type", "application/json");
            jqXHR.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
        },
        type: "POST",
        data: '{"url": ' + '"' + sourceImageUrl + '"}',
    }).done(function (data) {
        ocrCount++;
        thumbImgs.push(fileName);
        appendOcrData(fileName,data.regions);
    }).fail(function (jqXHR, textStatus, errorThrown) {
        var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
            jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
        alert(errorString);
    });
};

// 썸네일 이미지 페이지 이동 버튼 클릭 이벤트
function thumbImgPagingEvent() {
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
function thumnImg() {
    for (var i in thumbImgs) {
        if ($('#imageBox > li').length < thumnbImgPerPage) {
            var imageTag = '<li><a href="#none" class="imgtmb thumb-img" style="background-image:url(../../uploads/' + thumbImgs[i] + '); width: 48px;"></a></li>';
            $('#imageBox').append(imageTag);
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
    //console.log(thumbImgs);
}

// 썸네일 이미지 페이징
function thumbImgPaging(pageCount) {
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
function thumbImgEvent() {
    $('.thumb-img').click(function () {
        $('#imageBox > li').removeClass('on');
        $(this).parent().addClass('on');
        $('#mainImage').css('background-image', $(this).css('background-image'));
        detailTable($(this).css('background-image').split('/')[4].split('")')[0]);
    });
}

// OCR 데이터 line별 가공 & 상세 테이블 렌더링 & DB컬럼 조회
function appendOcrData(fileName, regions) {
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

    $.ajax({
        url: '/uiLearning/searchDBColumns',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'fileName': fileName, 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
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
                $('#img_content').html(mainImgHtml);
                $('#mainImage').css('background-image', 'url("../../uploads/' + fileName + '")');
                thumnImg();
                $('#imageBox > li').eq(0).addClass('on');
                detailTable(fileName);
            }
            if (totCount == searchDBColumnsCount) {
                thumbImgEvent();
            }

            /* 몇 페이지 어디인지 표시
            if (totCount == searchDBColumnsCount) {
                $('.dialog_wrap').html('<div id="mainImage" style="height:700px; background-size: 100% 100%; background-repeat: no-repeat;"><div id="redNemo" style="display:none; border:2px solid red; position:absolute;"></div>');
                var originalDiv = document.getElementById("mainImage");
                originalDiv.style.backgroundImage = "url('../../uploads/" + thumbImgs[0] + "')";
                detailTable(fileName);
                thumbImgEvent();
            }
            */
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// 상세 테이블 렌더링
function detailTable(fileName) {

    $('#textResultTbl').html('');
    var tblTag = '';
    for (var i = 0; i < lineText.length; i++) {
        if (lineText[i].fileName == fileName) {
            var item = lineText[i];
            for (var j = 0; j < item.data.length; j++) {
                tblTag += '<dl>'
                tblTag += '<dt onmouseover="hoverSquare(this)" onmouseout="moutSquare(this)">';
                tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
                tblTag += '<input type="text" value="' + item.data[j].text + '" style="width:100%; border:0;" />';
                tblTag += '<input type="hidden" value="' + item.data[j].location + '" />';
                tblTag += '</label>';
                tblTag += '</dt>';
                tblTag += '<dd>';
                tblTag += '<div class="selects">';
                tblTag += '<ul class="selectBox">';
                tblTag += dbColumnsOption(item.data[j].text, item.dbColumns);
                tblTag += '</div>';
                tblTag += '</dd>';
                tblTag += '</dl>';
            }
            break;
        }

        /* 몇 페이지 어디인지 표시
        var item = lineText[i];
        for (var j = 0; j < item.data.length; j++) {
            tblTag += '<tr onmouseover="hoverSquare(this)" onmouseout="moutSquare(this)">';
            //tblTag += '<tr>';
            tblTag += '<td>';
            tblTag += '<input type="text" value="' + item.data[j].text + '" style="width:100%; border:0;" />';
            tblTag += '<input type="hidden" value="' + item.data[j].location + '" alt="' + item.fileName + '" />';
            tblTag += '</td>';
            tblTag += '<td>';
            tblTag += '<select style="width:100%; height:100%;  border:0;">';
            tblTag += dbColumnsOption(item.dbColumns);
            tblTag += '</select>';
            tblTag += '</td>';
            tblTag += '</tr>';
        }
        */
    }
    $('#textResultTbl').append(tblTag);
    // input 태그 마우스오버 말풍선 Tooltip 적용
    $('input[type=checkbox]').ezMark();
    new $.Zebra_Tooltips($('.tip'));
    dbSelectClickEvent();
}

// DB 컬럼 option 렌더링
function dbColumnsOption(text, dbColumns) {
    var optionTag = '';
    var selected = '';

    optionTag += '<li>';
    var isMatch = false;
    for (var key in dbColumns) {
        var columnText = String(dbColumns[key].text);
        if (text.toLowerCase() == columnText.toLowerCase()) {
            optionTag += '<a class="dbColumnText" href="javascript:void(0);">' + enLabelToKorLabel(dbColumns[key].column) + '</a>';
            isMatch = true;
            break;
        }
    }
    if (!isMatch) {
        optionTag += '<a class="dbColumnText" href="javascript:void(0);">없음</a>';
    }
    optionTag += '<ul>';
    for (var key in dbColumns) {
        optionTag += '<li>';
        optionTag += '<a href="javascript:void(0);"><span>' + enLabelToKorLabel(dbColumns[key].column)+'</span></a>';
        optionTag += '<ul>';
        optionTag += '<li><a href="javascript:void(0);">키워드</a></li>';
        optionTag += '<li><a href="javascript:void(0);">가변값</a></li>';
        optionTag += '</ul>';
        optionTag += '</li>';
    }
    optionTag += '</ul>';
    optionTag += '</li>';

    return optionTag;
}

// 마우스 오버 이벤트
function hoverSquare(e) {
    // 해당 페이지로 이동
    /* 몇 페이지 어디인지 표시
    var fileName = $(e).find('input[type=hidden]').attr('alt');
    $('.thumb-img').each(function (i, el) {
        if ($(this).attr('src').split('/')[3] == fileName) {
            $(this).click();
        }
    });
    */

    //$('#mainImage').css('height', '500px');
    //$('#imageZoom').css('height', '300px').css('background-image', $('#mainImage').css('background-image')).show();

    // 사각형 좌표값
    var location = $(e).find('input[type=hidden]').val().split(',');
    x = parseInt(location[0]);
    y = parseInt(location[1]);
    textWidth = parseInt(location[2]);
    textHeight = parseInt(location[3]);
    //console.log("선택한 글씨: " + $(e).find('input[type=text]').val());

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
    //$('#redZoomNemo').css('width', textWidth + 10);
    //$('#redZoomNemo').css('height', textHeight+ 10);
    //$('#redZoomNemo').show();

}

// 마우스 아웃 이벤트
function moutSquare(e) {
    $('#redNemo').hide();
    //$('#redZoomNemo').hide();
    //$('#imageZoom').hide();
    //$('#mainImage').css('height', '700px');
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
        $(this).parent().parent().parent().prev().text(firstCategory + lastCategory);
        $(this).parent().parent().children('ul').hide();
        $(this).parent().parent().children('ul').css('visibility', 'hidden');
        $(this).parent().parent().parent().parent().children('ul').hide();
        $(this).parent().parent().parent().parent().children('ul').css('visibility', 'hidden').css('z-index', '0');
        $('.box_table_st').css('height', Number($('.box_table_st').height() - $(this).parent().parent().parent().parent().children('ul').height()) + 'px')
        e.preventDefault();
        e.stopPropagation();
    });
}

function enLabelToKorLabel(text) {
    var label = ''

    switch (text) {
        case 'CSCO_NM':
            label = '거래사명';
            break;
        case 'CT_NM':
            label = '계약명';
            break;
        case 'INS_ST_DT':
            label = '보험개시일';
            break;
        case 'INS_END_DT':
            label = '보험종료일';
            break;
        case 'CUR_CD':
            label = '화폐코드';
            break;
        case 'PRE':
            label = '보험료';
            break;
        case 'COM':
            label = '일반수수료';
            break;
        case 'BRKG':
            label = '중개수수료';
            break;
        case 'BRKG_VALUE':
            label = '중개수수료 값';
            break;
        case 'TXAM':
            label = '세금';
            break;
        case 'PRRS_CF':
            label = '보험료유보금적립액';
            break;
        case 'PRRS_CF_VALUE':
            label = '보험료유보금적립액 값';
            break;
        case 'PRRS_CF\r\n_VALUE':
            label = '보험료유보금적립액 값';
            break;
        case 'PRRS_RLS':
            label = '보험료유보금해제액';
            break;
        case 'LSRES_CF':
            label = '보험금유보금적립액';
            break;
        case 'LSRES_RLS':
            label = '보험금유보금해제액';
            break;
        case 'CLA':
            label = '보험금';
            break;
        case 'CLA_VALUE':
            label = '보험금 값';
            break;
        case 'EXEX':
            label = '부대비';
            break;
        case 'SVF':
            label = '손해조사비';
            break;
        case 'CAS':
            label = '즉시불보험금(CASH)';
            break;
        case 'NTBL':
            label = '순평균';
            break;
        case 'NTBL_VALUE':
            label = '순평균 값';
            break;
        case 'CSCO_SA_RFRN_CNNT2':
            label = '참고';
            break;
        case 'CSCO_NM_VALUE':
            label = '거래사명값';
            break;
        case 'CT_NM_VALUE':
            label = '계약명값';
            break;
        case 'INS_ST_DT_VALUE':
            label = '보험개시일값';
            break;
        case 'INS_END_DT_VALUE':
            label = '보험종료일값';
            break;
        case 'CUR_CD_VALUE':
            label = '화폐코드값';
            break;
        case 'PRE_VALUE':
            label = '보험료값';
            break;
        case 'COM_VALUE':
            label = '일반수수료값';
            break;
        case 'BRKG_VALUE':
            label = '중개수수료값';
            break;
        case 'TXAM_VALUE':
            label = '세금값';
            break;
        case 'PRRS_CF_VALUE':
            label = '보험료유보금적립액값';
            break;
        case 'PRRS_RLS_VALUE':
            label = '보험료유보금해제액값';
            break;
        case 'LSRES_CF_VALUE':
            label = '보험금유보금적립액값';
            break;
        case 'LSRES_RLS_VALUE':
            label = '보험금유보금해제액값';
            break;
        case 'CLA_VALUE':
            label = '보험금값';
            break;
        case 'EXEX_VALUE':
            label = '부대비값';
            break;
        case 'SVF_VALUE':
            label = '손해조사비값';
            break;
        case 'CAS_VALUE':
            label = '즉시불보험금(CASH)값';
            break;
        case 'NTBL_VALUE':
            label = '순평균값';
            break;
        case 'CSCO_SA_RFRN_CNNT2_VALUE':
            label = '참고값';
            break;
        default:
            label = text;
    }

    return label;
}

/*
function ocrBoxFocus() {
    $('#formImageZoom').mousedown(function (e) {
        console.log("마우스 누름: " + e.pageX + ', ' + e.pageY);
        mouseX = e.pageX;
        mouseY = e.pageY;
    }).mouseup(function (e) {
        var xDistance, yDistance;

        console.log("마우스 땜: " + e.pageX + ', ' + e.pageY);
        mouseMoveX = e.pageX;
        mouseMoveY = e.pageY;

        xDistance = mouseX - mouseMoveX;
        yDistance = mouseMoveY - mouseY;
        console.log("xDistance: " + xDistance + ", yDistance: " + yDistance);

        imageMove(xDistance, yDistance);
    });
}
*/

/*
// 마우스로 이미지 눌러 드래그시 이미지 이동
function imageMove(xDistance, yDistance) {

    var zoomDiv = document.getElementById("mainImage");
    var xResult, yResult;

    $('#redNemo').hide();

    xResult = x + xDistance;
    x = xResult;
    yResult = y - yDistance;
    y = yResult;
    zoomDiv.style.backgroundPosition = "-" + x + "px -" + y + "px";
}
*/