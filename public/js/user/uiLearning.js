var lineText = [];
var totCount = 0; // 전체 분석 문서 개수
var ocrCount = 0; // ocr 수행 횟수
var searchDBColumnsCount = 0; // DB컬럼 조회 수행 횟수
var thumbImgs = [];
var thumnImgPageCount = 1; // 썸네일 이미지 페이징 번호

$(function () {

    multiUploadEvent();
    thumbImgPagingEvent();

});

// 다중 파일 업로드 이벤트
function multiUploadEvent() {
    $('#uploadFile').change(function () {
        if ($(this).val() !== '') {
            lineText = [];
            $('#imageBox').html('');
            totCount = 0;
            ocrCount = 0;
            searchDBColumnsCount = 0;
            $('#multiUploadForm').submit();
        }
    });

    $('#multiUploadBtn').click(function () {
        $('#uploadFile').click();
    });

    $('#multiUploadForm').ajaxForm({
        beforeSubmit: function (data, frm, opt) {
            return true;
        },
        success: function (responseText, statusText) {
            //console.log(responseText);           
            if (responseText.message.length > 0) {
                totCount = responseText.message.length;
                for (var i = 0; i < responseText.message.length; i++) {
                    processImage(responseText.message[i]);
                }
            }
        },
        error: function (e) {
            console.log(e);
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
        thumnImg(fileName);
        appendOcrData(fileName,data.regions);
    }).fail(function (jqXHR, textStatus, errorThrown) {
        var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
            jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
        alert(errorString);
    });
};

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

function thumnImg(fileName) {
    $('#thumb-prev').attr('disabled', true);
    $('#thumb-next').attr('disabled', false);
    if ($('#imageBox > img').length < 4) {
        var imageTag = '';
        imageTag += '<img class="thumb-img" src="../../uploads/' + fileName + '" />';       
        $('#imageBox').append(imageTag);
    }
    thumbImgs.push(fileName);
    console.log(thumbImgs);
}

function thumbImgPaging(pageCount) {
    $('#imageBox').html('');
    var startImgCnt = 4 * pageCount - 4;
    var endImgCnt = 4 * pageCount;

    if (startImgCnt == 0) {
        $('#thumb-prev').attr('disabled', true);
    } else {
        $('#thumb-prev').attr('disabled', false);
    }

    if (endImgCnt > thumbImgs.length) {
        endImgCnt = thumbImgs.length;
        $('#thumb-next').attr('disabled', true);
    } else {
        $('#thumb-next').attr('disabled', false);
    }

    var imageTag = '';
    for (var i = startImgCnt; i < endImgCnt; i++) {   
        imageTag += '<img class="thumb-img" src="../../uploads/' + thumbImgs[i] + '" />';        
    }   
    $('#imageBox').append(imageTag);
    thumbImgEvent();
}

function thumbImgEvent() {
    $('.thumb-img').click(function () {
        $('.main-img').attr('src', $(this).attr('src'));
        detailTable($(this).attr('src').split('/')[3]);
    });
}

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
                $('.dialog_wrap').html('<img class="main-img" src="../../uploads/' + fileName + '" />')
                detailTable(fileName);
            }
            if (totCount == searchDBColumnsCount) {
                thumbImgEvent();
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

function detailTable(fileName) {
    $('#textResultTbl').html('');
    var tblTag = '<colgroup><col style="width:70%;"/><col style="width:30%;"/></colgroup>';
    tblTag += '<tr><th style = "text-align:center;">추출텍스트</th><th style="text-align:center;">DB 컬럼</th></tr>';
    for (var i = 0; i < lineText.length; i++) {
        if (lineText[i].fileName == fileName) {
            var item = lineText[i];
            for (var j = 0; j < item.data.length; j++) {               
                tblTag += '<tr>';
                tblTag += '<td>';
                tblTag += '<input type="text" value="' + item.data[j].text + '" style="width:100%; border:0;" />';
                tblTag += '<input type="hidden" value="' + item.data[j].location + '" />';
                tblTag += '</td>';
                tblTag += '<td>';
                tblTag += '<select style="width:100%; height:100%;  border:0;">';
                tblTag += dbColumnsOption(item.dbColumns);
                tblTag += '</select>';
                tblTag += '</td>';
                tblTag += '</tr>';
            }
            break;
        }
    }
    $('#textResultTbl').append(tblTag);
}

function dbColumnsOption(dbColumns) {
    var optionTag = '<option value=""></option>';
    for (var i = 0; i < dbColumns.length; i++) {
        optionTag += '<option value="' + dbColumns[i].seqNum + '">' + dbColumns[i].ko_keyword+'</option>';
    }
    return optionTag;
}