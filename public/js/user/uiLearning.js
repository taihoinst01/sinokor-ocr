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
    uiTrainEvent();
    popUpEvent();
});

// 초기 작업
function init() {
    $('.button_control').attr('disabled', true);
    layer_open('layer1');
}

// 팝업 이벤트 모음
function popUpEvent() {
    popUpRunEvent();
    popUpSearchDocCategory();
    popUpInsertDocCategory();
}

// 팝업 확인 이벤트
function popUpRunEvent() {
    $('#btn_pop_doc_run').click(function (e) {

        e.stopPropagation();
        e.preventDefault();
    });
}

//팝업 문서 양식 LIKE 조회
function popUpSearchDocCategory() {
    var keyword = $('#searchDocCategoryKeyword').val();
    $('#searchDocCategoryBtn').click(function () {
        $.ajax({
            url: '/uiLearning/selectLikeDocCategory',
            type: 'post',
            datatype: "json",
            data: JSON.stringify({ "keyword": keyword }),
            contentType: 'application/json; charset=UTF-8',
            success: function (data) {
            },
            error: function (err) {
                console.log(err);
            }
        });
    });
}

//팝업 문서 양식 등록
function popUpInsertDocCategory() {
    var docName = $('#docName').val();
    var sampleImagePath = '';
    $('#insertDocCategoryBtn').click(function () {
        $.ajax({
            url: '/uiLearning/insertDocCategory',
            type: 'post',
            datatype: "json",
            data: JSON.stringify({ "docName": docName, 'sampleImagePath': sampleImagePath }),
            contentType: 'application/json; charset=UTF-8',
            success: function (data) {
                if (data.code == 200) {
                    alert(data.message);
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    });
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
            $uploadForm.hide();
            $uploadSucessForm.show();
            if (responseText.message.length > 0) {
                totCount = responseText.message.length;
                for (var i = 0; i < responseText.message.length; i++) {
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

// OCR API
function processImage(fileName) {

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
    /*
    // proxy call
    $.ajax({
        url: '/proxy/ocr',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ "fileName": fileName }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            ocrCount++;
            if (!data.code) { // 에러가 아니면
                //console.log(data);
                thumbImgs.push(fileName);
                $('#progressMsgTitle').html('OCR 처리 완료');
                $('#loadingDetail').html(fileName);
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
        },
        error: function (err) {
            console.log(err);
        }
    });
    */
};

function insertCommError(eCode, type) {
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
            var imageTag = '<li><div class="box_img"><i><img src="../../uploads/' + thumbImgs[i] + '"></i>'
                + ' </div ><span>' + thumbImgs[i] +'</span></li >';
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
    var param = {
        'fileName': fileName,
        'data': data,
        'nextType': 'ts'
    };
    executeML(param);
    /*
    $('#progressMsgTitle').html('머신러닝 작동 중..');
    $('#loadingDetail').html(JSON.stringify({ 'fileName': fileName, 'data': data }).substring(0,200) + '...');
    addProgressBar(41, 50);
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
            $('#progressMsgTitle').html('머신러닝 작동 완료');
            $('#loadingDetail').html(JSON.stringify({ 'fileName': fileName, 'data': data }).substring(0, 200) + '...');
            addProgressBar(91, 100);
            // 몇 페이지 어디인지 표시
            //if (totCount == searchDBColumnsCount) {
            //    $('.dialog_wrap').html('<div id="mainImage" style="height:700px; background-size: 100% 100%; background-repeat: no-repeat;"><div id="redNemo" style="display:none; border:2px solid red; position:absolute;"></div>');
            //    var originalDiv = document.getElementById("mainImage");
            //    originalDiv.style.backgroundImage = "url('../../uploads/" + thumbImgs[0] + "')";
            //    detailTable(fileName);
            //    thumbImgEvent();
            //}
            //
        },
        error: function (err) {
            console.log(err);
        }
    });
    */
}

/**
 * @param {any} type
 * ts : typoSentence , dd : domainDictionary , tc : textClassification , lm : labelMapping , st : statementClassification , sc : searchDBColumns
 */
function executeML(totData) {
    $('#progressMsgDetail').html(JSON.stringify(totData).substring(0, 200) + '...');
    var fileName = totData.fileName;
    var data = totData.data;
    var type = totData.nextType;
    var docCategory = (totData.docCategory) ? totData.docCategory : null

    var targetUrl;
    var param;
    if (!docCategory) {
        param = { 'fileName': fileName, 'data': data };
    } else {
        param = { 'fileName': fileName, 'data': data, 'docCategory': docCategory };
    }
    if (type == 'ts') {
        targetUrl = '/uiLearning/typoSentence';
        $('#progressMsgTitle').html('오타 수정 처리 중..');
        addProgressBar(41, 50);
    } else if (type == 'dd') {
        targetUrl = '/uiLearning/domainDictionary';
        $('#progressMsgTitle').html('도메인 사전 처리 중..');
        addProgressBar(51, 60);
    } else if (type == 'tc') {
        targetUrl = '/uiLearning/textClassification';
        $('#progressMsgTitle').html('텍스트 분류 처리 중..');
        addProgressBar(61, 70);
    } else if (type == 'st') {
        targetUrl = '/uiLearning/statementClassification';
        $('#progressMsgTitle').html('계산서 분류 처리 중..');
        addProgressBar(71, 75);
    } else if (type == 'lm') {
        targetUrl = '/uiLearning/labelMapping';
        $('#progressMsgTitle').html('라벨 매핑 처리 중..');
        addProgressBar(76, 80);
    } else {
        targetUrl = '/uiLearning/searchDBColumns';
        $('#progressMsgTitle').html('DB 컬럼 조회 중..');
        addProgressBar(81, 90);
    }

    $.ajax({
        url: targetUrl,
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            //console.log(data);
            if (data.column) searchDBColumnsCount++;
            if (data.nextType) {
                executeML(data);
            } else {
                //console.log(data);
                lineText.push(data);                

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
                    $('#docName').html(data.docCategory.DOCNAME);
                    $('#docPredictionScore').html(data.docCategory.score + '%');
                    if (data.docCategory.score >= 90) {
                        $('#docPredictionScore').css('color', 'dodgerblue');
                    } else {
                        $('#docPredictionScore').css('color', 'darkred');
                    }
                    detailTable(fileName);
                    docComparePopup(0);
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

//문서 비교 popup 버튼 클릭 이벤트
function docComparePopup(imgIndex) {
    $('#docCompareBtn').unbind('click');
    $('#docCompareBtn').click(function (e) {
        $('#originImg').attr('src', '../../uploads/' + lineText[imgIndex].fileName);
        $('#searchImg').attr('src', '../../' + lineText[imgIndex].docCategory.SAMPLEIMAGEPATH);
        layer_open('layer1');
        e.preventDefault();
        e.stopPropagation();
    });
}

// 상세 테이블 렌더링
function detailTable(fileName) {

    $('#textResultTbl').html('');
    var tblSortTag = '';
    var tblTag = '';
    for (var i = 0; i < lineText.length; i++) {
        if (lineText[i].fileName == fileName) {
            var item = lineText[i];
            var sort = item.column;
            var sortBool = true;
            for (var sortN in sort) {
                for (var dataN in item.data) {
                    if (sort[sortN].ENKEYWORD == item.data[dataN].column) {
                        tblSortTag += '<dl>';
                        tblSortTag += '<dt onmouseover="hoverSquare(this)" onmouseout="moutSquare(this)">';
                        tblSortTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
                        tblSortTag += '<input type="text" value="' + item.data[dataN].text + '" style="width:100%; border:0;" />';
                        tblSortTag += '<input type="hidden" value="' + item.data[dataN].location + '" />';
                        tblSortTag += '</label>';
                        tblSortTag += '</dt>';
                        tblSortTag += '<dd>';
                        tblSortTag += '<div class="selects">';
                        tblSortTag += '<ul class="selectBox">';
                        tblSortTag += dbColumnsOption(item.data[dataN], item.column);
                        tblSortTag += '</div>';
                        tblSortTag += '</dd>';
                        tblSortTag += '</dl>';
                    }
                }
            }

            for (var j = 0; j < item.data.length; j++) {

                for (var sortN in sort) {
                    if (item.data[j].column == sort[sortN].ENKEYWORD) {
                        sortBool = false;
                        break;
                    }
                }

                if (sortBool == true) {
                    tblTag += '<dl>';
                    tblTag += '<dt onmouseover="hoverSquare(this)" onmouseout="moutSquare(this)">';
                    tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
                    tblTag += '<input type="text" value="' + item.data[j].text + '" style="width:100%; border:0;" />';
                    tblTag += '<input type="hidden" value="' + item.data[j].location + '" />';
                    tblTag += '</label>';
                    tblTag += '</dt>';
                    tblTag += '<dd>';
                    tblTag += '<div class="selects">';
                    tblTag += '<ul class="selectBox">';
                    tblTag += dbColumnsOption(item.data[j], item.column);
                    tblTag += '</div>';
                    tblTag += '</dd>';
                    tblTag += '</dl>';
                }
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
    $('#textResultTbl').append(tblSortTag);
    $('#textResultTbl').append(tblTag);
    // input 태그 마우스오버 말풍선 Tooltip 적용
    $('input[type=checkbox]').ezMark();
    new $.Zebra_Tooltips($('.tip'));
    dbSelectClickEvent();
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
        optionTag += '<a href="javascript:void(0);"><span>' + row.KOKEYWORD + gubun +'</span></a>';
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

    $('#mainImage').css('height', '500px');
    $('#imageZoom').css('height', '300px').css('background-image', $('#mainImage').css('background-image')).show();

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
    $('#redZoomNemo').css('width', textWidth + 10);
    $('#redZoomNemo').css('height', textHeight+ 10);
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
        /*
        var td = tr.eq(i).children();
        var text = td.eq(0).children('input[type="text"]').val();
        var location = td.eq(0).children('input[type="hidden"]').val();
        var column = td.eq(1).children().find("a.dbColumnText").text();
        */
        var text = tr.eq(i).find('input[type="text"]').val();
        var location = tr.eq(i).find('input[type="hidden"]').val();
        var column = tr.eq(i).find('a.dbColumnText').text();
        var columnSplit = column.split("::");
        //var textClassi = td.eq(1).children();

        var obj = {}
        obj.text = text;
        obj.location = location;
        obj.column = columnSplit[0];
        //obj.textClassi = textClassi;

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