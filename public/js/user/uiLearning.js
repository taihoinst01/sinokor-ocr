var lineText = []; // line별로 가공된 ocr데이터 배열
var totCount = 0; // 전체 분석 문서 개수
var ocrCount = 0; // ocr 수행 횟수
var searchDBColumnsCount = 0; // DB컬럼 조회 수행 횟수
var thumbImgs = []; // 썸네일 이미지 경로 배열
var thumnImgPageCount = 1; // 썸네일 이미지 페이징 번호
var thumnbImgPerPage = 10; // 한 페이지당 썸네일 이미지 개수
var x, y, textWidth, textHeight; // 문서 글씨 좌표
var mouseX, mouseY, mouseMoveX, mouseMoveY; // 마우스 이동 시작 좌표, 마우스 이동 좌표
var docPopImages; // 문서조회팝업 이미지 리스트
var docPopImagesCurrentCount = 1; // 문서조회팝업 이미지 현재 카운트
$(function () {

    init();
    uploadFileEvent();
    thumbImgPagingEvent();
    uiTrainEvent();
    popUpEvent();
    changeDocPopRadio();
    changeDocPopupImage();
});

// 초기 작업
function init() {
    $('.button_control').attr('disabled', true);
    //layer_open('layer1');
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
        var docData = JSON.parse($('#docData').val());
        for (var i in docData) {
            if ($('#searchResultDocName').val() == docData[i].DOCNAME) {
                $('#docName').text(docData[i].DOCNAME);
                $('#docData').val(JSON.stringify(docData[i]));
                break;
            }
        }
        $(this).parents('.poplayer').fadeOut();
        e.stopPropagation();
        e.preventDefault();
    });
}

//팝업 문서 양식 LIKE 조회
function popUpSearchDocCategory() {
    $('#searchDocCategoryBtn').click(function () {
        if ($('.ez-selected').children('input').val() == 'choice-1') {
            var keyword = $('#searchDocCategoryKeyword').val();
            $.ajax({
                url: '/uiLearning/selectLikeDocCategory',
                type: 'post',
                datatype: 'json',
                data: JSON.stringify({ 'keyword': keyword }),
                contentType: 'application/json; charset=UTF-8',
                success: function (data) {
                    $('#docData').val(JSON.stringify(data));
                    $('#docSearchResult').html('');
                    $('#countCurrent').html('1');
                    $('.button_control10').attr('disabled', true);
                    if (data.length == 0) {
                        $('#docSearchResultImg_thumbCount').hide();
                        $('#docSearchResultMask').hide();
                        $('#searchResultDocName').html('');
                        $('#orgDocName').val('');
                        $('#searchResultDocName').val('');
                        return false;
                    } else {
                        /**
                         결과에 따른 이미지폼 만들기
                         */
                        docPopImages = data;
                        var resultImg = '<img src="' + data[0].SAMPLEIMAGEPATH + '" style="width: 100%;height: 480px;">';
                        $('#searchResultDocName').val(data[0].DOCNAME);
                        if (data.length != 1) {
                            $('.button_control12').attr('disabled', false);
                        }
                        $('#orgDocName').val(data[0].DOCNAME);
                        $('#docSearchResult').html(resultImg);
                        $('#docSearchResultMask').show();
                        $('#countLast').html(data.length);
                        $('#docSearchResultImg_thumbCount').show();
                    }
                },
                error: function (err) {
                    console.log(err);
                }
            });
        } else {
        }
    });
}

//팝업 문서 양식 등록
function popUpInsertDocCategory() {
    $('#insertDocCategoryBtn').click(function () {
        if ($('.ez-selected').children('input').val() == 'choice-2') {
            var docName = $('#newDocName').val();
            var sampleImagePath = $('#originImg').attr('src').split('/')[2] + '/' + $('#originImg').attr('src').split('/')[3];
            $.ajax({
                url: '/uiLearning/insertDocCategory',
                type: 'post',
                datatype: 'json',
                data: JSON.stringify({ 'docName': docName, 'sampleImagePath': sampleImagePath }),
                contentType: 'application/json; charset=UTF-8',
                success: function (data) {
                    if (data.code == 200) {
                        //console.log(data);
                        $('#docData').val(JSON.stringify(data.docCategory[0]));
                        $('#docName').text(data.docCategory[0].DOCNAME);
                        $('#layer1').fadeOut();
                    } else {
                        alert(data.message);
                    }
                },
                error: function (err) {
                    console.log(err);
                }
            });
        } else {
        }
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
            $('#progressMsgTitle').html('파일 업로드 중..');
            $('#progressMsgDetail').html('');
            startProgressBar(); // start progressbar
            addProgressBar(1, 10); // proceed progressbar
            return true;
        },
        success: function (responseText, statusText) {
            //console.log(responseText);
            $('#progressMsgTitle').html('파일 업로드 완료..');
            $('#progressMsgDetail').html('');
            $('.button_control').attr('disabled', false);
            addProgressBar(11, 20);
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
            jqXHR.setRequestHeader('Content-Type', 'application/json');
        },
        type: 'POST',
        data: JSON.stringify({ 'fileName': fileName })
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
        datatype: 'json',
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
                + ' </div ><span>' + thumbImgs[i] + '</span></li >';
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
    //var docCategory = (totData.docCategory) ? totData.docCategory : null


    var targetUrl;
    var param;
    param = { 'fileName': fileName, 'data': data };
    /*
    if (!docCategory) {
        param = { 'fileName': fileName, 'data': data };
    } else {
        param = { 'fileName': fileName, 'data': data, 'docCategory': docCategory };
    }
    */
    if (type == 'ts') {
        targetUrl = '/uiLearning/typoSentence';
        $('#progressMsgTitle').html('오타 수정 처리 중..');
        addProgressBar(41, 50);
    } else if (type == 'fl') {
        targetUrl = '/uiLearning/formLabelMapping';
        $('#progressMsgTitle').html('양식 라벨 맴핑 처리 중..');
        addProgressBar(51, 60);
    } else if (type == 'fm') {
        targetUrl = '/uiLearning/formMapping';
        $('#progressMsgTitle').html('양식 맵핑 처리 중..');
        addProgressBar(61, 70);
    } else if (type == 'cm') {
        targetUrl = '/uiLearning/columnMapping';
        $('#progressMsgTitle').html('컬럼 맵핑 처리 중..');
        addProgressBar(51, 70);
        //addProgressBar(51, 75);
    } else {
        targetUrl = '/uiLearning/searchDBColumns';
        $('#progressMsgTitle').html('DB 컬럼 조회 중..');
        addProgressBar(71, 90);
        //addProgressBar(76, 90);
    }

    $.ajax({
        url: targetUrl,
        type: 'post',
        datatype: 'json',
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            //console.log(data);
            if (data.column) searchDBColumnsCount++;
            if (data.nextType) {
                executeML(data);
            } else {
                //console.log(data)
                if (data.message) {
                    console.log(data);
                } else {
                    lineText.push(data);
                    if (searchDBColumnsCount == 1) {
                        /*
                        var docName = '';
                        var docScore = '';
                       
                        if (data.docCategory != null) {
                            docName = data.docCategory[0].DOCNAME;
                            $('#docData').val(JSON.stringify(data.docCategory[0]));
                        }

                        if (data.score) {
                            docScore = data.score;
                        }
                        */

                        var mainImgHtml = '';
                        mainImgHtml += '<div id="mainImage" class="ui_mainImage">';
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
                        /*
                        $('#mlPredictionDocName').val(docName);
                        $('#mlPredictionPercent').val(docScore + '%');
                        $('#docName').html(docName);
                        $('#docPredictionScore').html(docScore + '%');
                        if (docScore >= 90) {
                            $('#docName').css('color', 'dodgerblue');
                            $('#docPredictionScore').css('color', 'dodgerblue');
                        } else {
                            $('#docName').css('color', 'darkred');
                            $('#docPredictionScore').css('color', 'darkred');
                        }
                        */
                        selectTypoText(0, fileName);
                        //detailTable(fileName);
                        //docComparePopup(0);
                    }

                    if (totCount == searchDBColumnsCount) {
                        thumbImgEvent();
                        addProgressBar(91, 100);
                        $('#uploadForm').hide();
                        $('#uploadSucessForm').show();
                    }
                }
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// html 렌더링 전처리 (출재사명, 계약명, 화폐코드 처리)
function selectTypoText(index, fileName) {
    //var item = lineText[index].data;
    var item = lineText[index];
    var param = [];

    $.ajax({
        url: 'common/selectTypoData2',
        type: 'post',
        datatype: 'json',
        data: JSON.stringify({ 'data': item }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            console.log(data);
            lineText[index].data = data;
            detailTable(fileName);
            docComparePopup(0);
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
        var appendImg = '<img id="originImg" src="../../uploads/' + lineText[imgIndex].fileName + '" style="width: 100%;height: 480px;">'
        $('#ui_pop_MlImg').html(appendImg);
        //$('#originImg').attr('src', '../../uploads/' + lineText[imgIndex].fileName);
        //$('#searchImg').attr('src', '../../' + lineText[imgIndex].docCategory.SAMPLEIMAGEPATH);
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

            var data;

            if (item.data.data) {
                data = item.data.data;
            } else {
                data = item.data;
            }

            var columnArr = item.column;
            var entryColArr = item.entryMappingList;
            for (var i in data) {
                // colLbl이 37이면 entryLbl 값에 해당하는 entryColoumn 값을 뿌려준다
                if (data[i].colLbl == 37) {
                    tblSortTag += '<dl>';
                    tblSortTag += '<dt onmouseover="hoverSquare(this)" onmouseout="moutSquare(this)">';
                    tblSortTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
                    tblSortTag += '<input type="text" value="' + data[i].text + '" style="width:100%; border:0;" />';
                    tblSortTag += '<input type="hidden" value="' + data[i].location + '" />';
                    tblSortTag += '</label>';
                    tblSortTag += '</dt>';
                    tblSortTag += '<dd>';
                    tblSortTag += appendEntryOptionHtml((data[i].entryLbl + '') ? data[i].entryLbl : 999, entryColArr);
                    tblSortTag += '</dd>';
                    tblSortTag += '</dl>';
                }else if (data[i].colLbl == 36) {
                    tblSortTag += '<dl>';
                    tblSortTag += '<dt onmouseover="hoverSquare(this)" onmouseout="moutSquare(this)">';
                    tblSortTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
                    tblSortTag += '<input type="text" value="' + data[i].text + '" style="width:100%; border:0;" />';
                    tblSortTag += '<input type="hidden" value="' + data[i].location + '" />';
                    tblSortTag += '</label>';
                    tblSortTag += '</dt>';
                    tblSortTag += '<dd>';
                    tblSortTag += appendOptionHtml((data[i].colLbl + '') ? data[i].colLbl : 999, columnArr);
                    tblSortTag += '</dd>';
                    tblSortTag += '</dl>';
                } else {
                    tblTag += '<dl>';
                    tblTag += '<dt onmouseover="hoverSquare(this)" onmouseout="moutSquare(this)">';
                    tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
                    tblTag += '<input type="text" value="' + data[i].text + '" style="width:100%; border:0;" />';
                    tblTag += '<input type="hidden" value="' + data[i].location + '" />';
                    tblTag += '</label>';
                    tblTag += '</dt>';
                    tblTag += '<dd>';
                    tblTag += appendOptionHtml((data[i].colLbl + '') ? data[i].colLbl : 999, columnArr);
                    tblTag += '</dd>';
                    tblTag += '</dl>';
                }
            }

            /*
            var item = lineText[i];
            var sort = item.column;
            var sortBool = true;
            for (var sortN in sort) {
                for (var dataN in item.data) {
                    if (sort[sortN].ENKEYWORD == item.data[dataN].column) {
                        tblSortTag += '<dl>';
                        tblSortTag += '<dt onmouseover="hoverSquare(this)" onmouseout="moutSquare(this)">';
                        tblSortTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
                        if (item.data[dataN].text.length > 34) {
                            tblSortTag += '<label class="iclick">'
                            tblSortTag += '<input type="text" value="' + item.data[dataN].text + '" class="inputst_box01"/>';
                            tblSortTag += '</label>'
                        } else {
                            tblSortTag += '<input type="text" value="' + item.data[dataN].text + '" class="inputst_box01"/>';
                        }
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
            */

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
    $('#textResultTbl').append(tblTag).append(tblSortTag);
    // input 태그 마우스오버 말풍선 Tooltip 적용
    $('input[type=checkbox]').ezMark();
    new $.Zebra_Tooltips($('.tip'));
    dbSelectClickEvent();
}

// 컬럼 select html 가공 함수
function appendOptionHtml(targetColumn, columns) {

    var selectHTML = '<select>';
    for (var i in columns) {
        var optionHTML = '';
        if (targetColumn == columns[i].COLNUM) {
            optionHTML = '<option value="' + columns[i].COLNUM + '" selected>' + columns[i].COLNAME + '</option>';
        } else {
            optionHTML = '<option value="' + columns[i].COLNUM + '">' + columns[i].COLNAME + '</option>';
        }
        selectHTML += optionHTML
    }
    selectHTML += '</select>'

    return selectHTML;
}

// Entry컬럼 select html 가공 함수
function appendEntryOptionHtml(targetColumn, columns) {

    var selectHTML = '<select>';
    for (var i in columns) {
        var optionHTML = '';
        if (targetColumn == columns[i].COLNUM) {
            optionHTML = '<option value="' + targetColumn + '" selected>entry(' + columns[i].COLNAME + ')</option>';
        } else {
            optionHTML = '<option value="' + targetColumn + '">entry(' + columns[i].COLNAME + ')</option>';
        }
        selectHTML += optionHTML
    }
    selectHTML += '</select>'

    return selectHTML;
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

        optionTag += '<li class="secondLi">';
        optionTag += '<a href="javascript:void(0);"><span>' + row.KOKEYWORD + gubun + '</span></a>';
        optionTag += '<ul>';
        optionTag += '<li class="thirdLi"><a href="javascript:void(0);">키워드</a></li>';
        optionTag += '<li class="thirdLi"><a href="javascript:void(0);">가변값</a></li>';
        optionTag += '</ul>';
        optionTag += '</li>';
    }
    optionTag += '<li class="secondLi">';
    optionTag += '<a href="javascript:void(0);"><span>none</span></a>';
    optionTag += '<ul>';
    optionTag += '<li class="thirdLi"><a href="javascript:void(0);">키워드</a></li>';
    optionTag += '<li class="thirdLi"><a href="javascript:void(0);">가변값</a></li>';
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

    //실제 이미지 사이즈와 메인이미지div 축소율 판단
    var reImg = new Image();
    var imgPath = $('#mainImage').css('background-image').split('("')[1];
    imgPath = imgPath.split('")')[0];
    reImg.src = imgPath;
    var width = reImg.width;
    var height = reImg.height;

    //imageZoom 고정크기
    var fixWidth = 992;
    var fixHeight = 1402;

    var widthPercent = fixWidth / width;
    var heightPercent = fixHeight / height;

    $('#mainImage').hide();
    $('#imageZoom').css('height', '570px').css('background-image', $('#mainImage').css('background-image')).css('background-size', fixWidth + 'px ' + fixHeight + 'px').show();

    // 사각형 좌표값
    var location = $(e).find('input[type=hidden]').val().split(',');
    x = parseInt(location[0]);
    y = parseInt(location[1]);
    textWidth = parseInt(location[2]);
    textHeight = parseInt(location[3]);
    //console.log("선택한 글씨: " + $(e).find('input[type=text]').val());

    //console.log("x: " + (x) + 'px y: ' + (y) + 'px');
    // 해당 텍스트 x y좌표 원본 이미지에서 찾기

    //var xPosition = (x * 0.4) > 0 ? '-' + ((x * 0.4) + 'px ') : (x * 0.4)  + 'px ';
    //var yPosition = (y * 0.4) > 0 ? '-' + ((y * 0.4) + 'px') : (y * 0.4) + 'px';

    var xPosition = ((- (x * widthPercent)) + 300) + 'px ';
    var yPosition = ((- (y * heightPercent)) + 200) + 'px';
    //console.log(xPosition + yPosition);
    $('#imageZoom').css('background-position', xPosition + yPosition);


    //실제 이미지 사이즈와 메인이미지div 축소율 판단
    //var reImg = new Image();
    //var imgPath = $('#mainImage').css('background-image').split('("')[1];
    //imgPath = imgPath.split('")')[0];
    //reImg.src = imgPath;
    //var width = reImg.width;
    //var height = reImg.height;

    // 선택한 글씨에 빨간 네모 그리기
    //$('#redNemo').css('top', ((y / (height / $('#mainImage').height())) + $('#imgHeader').height() + 22 + 42 - 10) + 'px');
    //$('#redNemo').css('left', ((x / (width / $('#mainImage').width())) + 22 + 99 - 10) + 'px');
    //$('#redNemo').css('width', ((textWidth / (width / $('#mainImage').width())) + 20) + 'px');
    //$('#redNemo').css('height', ((textHeight / (height / $('#mainImage').height())) + 20) + 'px');
    //$('#redNemo').show();
    //$('#redZoomNemo').css('width', '100%');
    $('#redZoomNemo').css('height', (textHeight + 5) + 'px');
    $('#redZoomNemo').show();
}

// 마우스 아웃 이벤트
function moutSquare(e) {
    //$('#redNemo').hide();
    $('#redZoomNemo').hide();
    $('#imageZoom').hide();
    $('#mainImage').show();
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
        modifyTextData();
        /*
        var docData;
        if ($('#docData').val() != '') {
            docData = JSON.parse($('#docData').val());
        }
        if (docData && docData.DOCTYPE != 0) {
            modifyTextData();
        } else {
            alert('There is no document form, I do not training.');
            return;
        }
        */
    });
}

function modifyTextData() {
    var beforeData = lineText;
    var afterData = {};
    afterData.data = [];
    beforeData = beforeData.slice(0);

    // afterData Processing
    $('#textResultTbl > dl').each(function (index, el) {
        var location = $(el).find('label').children().eq(1).val();
        var text = $(el).find('label').children().eq(0).val();
        var colLbl = $(el).find('select').find('option:selected').val();
        afterData.data.push({ 'location': location, 'text': text, 'colLbl': colLbl });
    });

    afterData.fileName = $('#imageBox > .on span').text();

    // find an array of data with the same filename
    for (var i in beforeData) {
        if (beforeData[i].fileName == afterData.fileName) {

            $.ajax({
                url: '/common/modifyTextData',
                type: 'post',
                datatype: "json",
                data: JSON.stringify({ 'beforeData': beforeData[i].data, 'afterData': afterData }),
                contentType: 'application/json; charset=UTF-8',
                success: function (data) {
                    makeTrainingData();
                },
                error: function (err) {
                    console.log(err);
                }
            });
            break;
        }
    }
}

function makeTrainingData() {
    var trainData = {};
    trainData.data = [];

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
        var column = tr.eq(i).find('select option:selected').val();

        var obj = {}
        obj.text = text;
        obj.location = location;
        obj.colLbl = column;

        dataArray.push(obj);
    }

    var mlData = lineText[0].data.data;

    for (var i = 0; i < mlData.length; i++) {
        for (var j = 0; j < dataArray.length; j++) {
            if (mlData[i].location == dataArray[j].location) {

                if (dataArray[j].colLbl == 0 || dataArray[j].colLbl == 1 || dataArray[j].colLbl == 3) { // Only ogCompanyName, contractName, curCode
                    if (mlData[i].text != dataArray[j].text || mlData[i].colLbl != dataArray[j].colLbl) {
                        dataArray[j].sid = mlData[i].sid;
                        trainData.data.push(dataArray[j]);
                    }
                } else { // etc
                    if (mlData[i].colLbl != dataArray[j].colLbl) {
                        dataArray[j].text = mlData[i].text // origin text (Does not reflect changes made by users) 
                        dataArray[j].sid = mlData[i].sid;
                        trainData.data.push(dataArray[j]);
                    }
                }

                if (mlData[i].originText != null) {
                    dataArray[j].originText = mlData[i].originText;
                }

            }
        }
    }

    var data = {}
    data.data = dataArray;

    /*
    data.docCategory = JSON.parse($('#docData').val());
    
    trainData.docCategory = [];
    if (lineText[0].docCategory[0].DOCTYPE != data.docCategory.DOCTYPE) {
        trainData.docCategory.push(JSON.parse($('#docData').val()));
    } else {
        trainData.docCategory.push(lineText[0].docCategory[0]);
    }
    */
    startProgressBar();
    addProgressBar(1, 40);

    callbackAddDocMappingTrain(trainData);
}

function insertTrainingData(data) {
    $('#progressMsgTitle').html('라벨 분류 학습 중..');
    addProgressBar(21, 40);
    addLabelMappingTrain(data, callbackAddLabelMapping);
}

function callbackAddLabelMapping(data) {
    $('#progressMsgTitle').html('양식 분류 학습 중..');
    addProgressBar(41, 60);
    addDocMappingTrain(data, callbackAddDocMappingTrain);
}

function callbackAddDocMappingTrain(data) {
    $('#progressMsgTitle').html('컬럼 맵핑 학습 중..');
    addProgressBar(41, 80);
    addColumnMappingTrain(data);
}


function uiTrainAjax() {
    $.ajax({
        url: '/batchLearning/uitraining',
        type: 'post',
        datatype: "json",
        data: null,
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            if (data.code == 200) {
                addProgressBar(81, 100);
                alert(data.message);
                //popupEvent.batchClosePopup('retrain');
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

function insertTypoTrain(data, callback) {
    $.ajax({
        url: '/uiLearning/insertTypoTrain',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            callback(res);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

function addLabelMappingTrain(data, callback) {
    $.ajax({
        url: '/batchLearning/insertDocLabelMapping',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            callback(res.data);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// 양식 레이블 매핑 ml 데이터 insert
function addDocMappingTrain(data, callback) {
    $.ajax({
        url: '/batchLearning/insertDocMapping',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            console.log(res);
            callback(res.data);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

function addColumnMappingTrain(data, callback) {

    $.ajax({
        url: '/batchLearning/insertColMapping',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            console.log(res);
            alert("success training");
            addProgressBar(81, 100);
            //callback(data);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// 문서 양식 조회 팝업 라디오 이벤트
function changeDocPopRadio() {
    $('#orgDocSearchRadio').click(function () {
        $('#orgDocSearch').show();
        $('#newDocRegistration').hide();
    })

    $('#newDocRegistrationRadio').click(function () {
        $('#newDocRegistration').show();
        $('#orgDocSearch').hide();
    })
}

// 문서 양식 조회 이미지 좌우 버튼 이벤트
function changeDocPopupImage() {
    $('#docSearchResultImg_thumbPrev').click(function () {
        $('#docSearchResultImg_thumbNext').attr('disabled', false);
        if (docPopImagesCurrentCount == 1) {
            return false;
        } else {
            docPopImagesCurrentCount--;
            $('#countCurrent').html(docPopImagesCurrentCount);
            $('#orgDocName').val(docPopImages[docPopImagesCurrentCount - 1].DOCNAME);
            $('#searchResultDocName').val(docPopImages[docPopImagesCurrentCount - 1].DOCNAME);
            $('#docSearchResult img').attr('src', docPopImages[docPopImagesCurrentCount - 1].SAMPLEIMAGEPATH);
            if (docPopImagesCurrentCount == 1) {
                $('#docSearchResultImg_thumbPrev').attr('disabled', true);
            } else {
                $('#docSearchResultImg_thumbPrev').attr('disabled', false);
            }
        }
    })

    $('#docSearchResultImg_thumbNext').click(function () {
        var totalCount = $('#countLast').html();
        $('#docSearchResultImg_thumbPrev').attr('disabled', false);
        if (docPopImagesCurrentCount == totalCount) {
            return false;
        } else {
            docPopImagesCurrentCount++;
            $('#countCurrent').html(docPopImagesCurrentCount);
            $('#orgDocName').val(docPopImages[docPopImagesCurrentCount - 1].DOCNAME);
            $('#searchResultDocName').val(docPopImages[docPopImagesCurrentCount - 1].DOCNAME);
            $('#docSearchResult img').attr('src', docPopImages[docPopImagesCurrentCount - 1].SAMPLEIMAGEPATH);

            if (docPopImagesCurrentCount == totalCount) {
                $('#docSearchResultImg_thumbNext').attr('disabled', true);
            } else {
                $('#docSearchResultImg_thumbNext').attr('disabled', false);
            }
        }
    })
}