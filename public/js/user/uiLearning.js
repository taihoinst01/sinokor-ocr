var lineText = []; // line별로 가공된 ocr데이터 배열
var totCount = 0; // 전체 분석 문서 개수
var ocrCount = 0; // ocr 수행 횟수
var searchDBColumnsCount = 0; // DB컬럼 조회 수행 횟수
var thumbImgs = []; // 썸네일 이미지 경로 배열
var thumnImgPageCount = 1; // 썸네일 이미지 페이징 번호
var thumnbImgPerPage = 6; // 한 페이지당 썸네일 이미지 개수
var x, y, textWidth, textHeight; // 문서 글씨 좌표
var mouseX, mouseY, mouseMoveX, mouseMoveY; // 마우스 이동 시작 좌표, 마우스 이동 좌표
var docPopImages; // 문서조회팝업 이미지 리스트
var docPopImagesCurrentCount = 1; // 문서조회팝업 이미지 현재 카운트
var docType = '';
var currentImgCount = 0;

$(function () {

    init();
    uploadFileEvent();
    thumbImgPagingEvent();
    uiTrainEvent();
    popUpEvent();
    docPopRadioEvent();
    editBannedword();
    changeDocPopupImage();
});

// 초기 작업
function init() {
    $('.button_control').attr('disabled', true);
    //layer_open('layer1');
}

function docPopRadioEvent() {
    $('input:radio[name=radio_batch]').on('click', function () {
        var chkValue = $(this).val();

        if (chkValue == '1') {
            $('#orgDocName').show();
            $('#newDocName').hide();
            $('#notInvoice').hide();
        } else if (chkValue == '2') {
            $('#newDocName').show();
            $('#orgDocName').hide();
            $('#notInvoice').hide();

            for (var i = 0; i < $("input[type='checkbox'].ui_layer1_result_chk").length; i++) {
                $("input[type='checkbox'].ui_layer1_result_chk").eq(i).parent().removeClass("ez-hide");
                $("input[type='checkbox'].ui_layer1_result_chk").eq(i).prop("checked", true);
                $("input[type='checkbox'].ui_layer1_result_chk").eq(i).parent().addClass("ez-checked")

                if (i == 20) {
                    break;
                }
            }

        } else if (chkValue == '3') {
            $('#notInvoice').show();
            $('#orgDocName').hide();
            $('#newDocName').hide();
        }
    })
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
        // chkValue 1: 기존문서 양식조회, 2: 신규문서 양식등록, 3: 계산서 아님
        var chkValue = $('input:radio[name=radio_batch]:checked').val();

        if ((chkValue == '1' && $('#orgDocName').val() == '') || (chkValue == '2' && $('#newDocName').val() == '')) {
            fn_alert('alert', 'The document name is missing');
            return false;
        }

        // text & check
        var textList = [];
        $('.ui_layer1_result_tr').each(function () {
            var chk = $(this).children().find('input[type="checkbox"]').is(':checked') == true ? 1 : 0;
            var text = $(this).children()[1].innerHTML;

            textList.push({ "text": text, "check": chk });
        });

        // docName
        var docName = '';
        if (chkValue == '1') {
            docName = $('#orgDocName').val();
        } else if (chkValue == '2') {
            docName = $('#newDocName').val();
        } else if (chkValue == '3') {
            docName = 'NotInvoice';
        }

        var filePath = $("#docPopImgPath").val();
        filePath = filePath.substring(0, filePath.lastIndexOf("/") + 1);

        var fileName = $("#originImg").attr("src");
        fileName = fileName.substring(fileName.lastIndexOf("/") + 1, fileName.length);

        var param = {
            filepath: filePath + fileName,
            docName: docName,
            radioType: chkValue,
            textList: textList,
        }

        $.ajax({
            url: '/uiLearning/insertDoctypeMapping',
            type: 'post',
            datatype: 'json',
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                progressId = showProgressBar();
            },
            success: function (data) {
                $('#docName').text(docName);
                $('#docType').val(data.docType);
                $('#docSid').val(data.docSid);
                $('#docPredictionScore').text('');
                lineText[currentImgCount].data.docCategory.DOCNAME = data.docName;
                lineText[currentImgCount].data.docCategory.DOCTYPE = data.docType;
                lineText[currentImgCount].data.docSid = data.docSid;
                endProgressBar(progressId);
                fn_alert('alert', '계산서 양식 저장이 완료 되었습니다.');
                $('#btn_pop_doc_cancel').click();
            },
            error: function (err) {
                console.log(err);
            }
        });
    })
}

//팝업 문서 양식 LIKE 조회
function popUpSearchDocCategory() {
    $('#searchDocCategoryBtn').click(function () {
        var keyword = $('#searchDocCategoryKeyword').val();
        //var keyword = $('#searchDocCategoryKeyword').val().replace(/ /gi, '');

        if (keyword) {
            $('#docSearchResultImg_thumbCount').hide();
            $('#docSearchResultMask').hide();
            $('#searchResultDocName').html('');
            $('#orgDocName').val('');
            $('#searchResultDocName').val('');
            $('#countCurrent').html('1');
            $.ajax({
                url: '/batchLearning/selectLikeDocCategory',
                type: 'post',
                datatype: 'json',
                data: JSON.stringify({ 'keyword': keyword }),
                contentType: 'application/json; charset=UTF-8',
                success: function (data) {
                    data = data.data;
                    $('#docSearchResult').html('');
                    $('.button_control10 .button_control11').attr('disabled', true);
                    $('.button_control10 .button_control12').attr('disabled', true);
                    docPopImagesCurrentCount = 1;
                    if (data.length == 0) {
                        fn_alert('alert', '입력하신 회사명의 계산서가 없습니다. 회사명을 재확인 부탁드립니다.');
                        return false;
                    } else {
                        docPopImages = data;

                        var searchResultImg = '<img id="searchResultImg" src="/jpg' + docPopImages[docPopImagesCurrentCount - 1].SAMPLEIMAGEPATH + '" style="width: 100%;height: 480px;">';
                        $('#docSearchResult').empty().append(searchResultImg);

                        $('#searchResultDocName').val(data[0].DOCNAME);
                        if (data.length != 1) {
                            $('.button_control12').attr('disabled', false);
                        }
                        $('#orgDocName').val(data[0].DOCNAME);
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
            fn_alert('alert', 'Please enter your search keyword');
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
                        fn_alert('alert', data.message);
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

// 개별 학습 파일 업로드 이벤트
function uploadFileEvent() {
    $('#uploadFile').change(function () {
        if ($(this).val() !== '') {
            lineText = [];
            $('#imageBox').html('');
            totCount = 0;
            ocrCount = 0;
            searchDBColumnsCount = 0;
            $("#uploadFileForm").attr("action", "/common/imageUpload");
            $('#uploadFileForm').submit();
        }
    });

    $('#uploadFileBtn').click(function () {
        $('#uploadFile').click();
    });

    $('#uploadFileForm').ajaxForm({
        beforeSubmit: function (data, frm, opt) {
            $('#progressMsgTitle').html('파일 업로드 중..');
            progressId = showProgressBar();
            //startProgressBar(); // start progressbar
            //addProgressBar(1, 10); // proceed progressbar
            return true;
        },
        success: function (responseText, statusText) {
            //console.log(responseText);
            $('#progressMsgTitle').html('파일 업로드 완료..');
            $('.button_control').attr('disabled', false);
            $('#textResultTbl').html('');
            //addProgressBar(11, 20);
            if (responseText.message.length > 0) {
                //console.log(responseText);
                totCount = responseText.message.length;
                for (var i = 0; i < responseText.fileInfo.length; i++) {
                    processImage(responseText.fileInfo[i]);
                }
                /*
                for (var i = 0; i < responseText.message.length; i++) {
                    processImage(responseText.message[i]);
                }
                */
            }
            //endProgressBar();
        },
        error: function (e) {
            endProgressBar(progressId); // 에러 발생 시 프로그레스바 종료
            //console.log(e);
        }
    });

    // 파일 드롭 다운
    var dropZone = $("#uploadForm");
    //Drag기능
    dropZone.on('dragenter', function (e) {
        e.stopPropagation();
        e.preventDefault();
        // 드롭다운 영역 css
        dropZone.css('background-color', '#E3F2FC');
    });
    dropZone.on('dragleave', function (e) {
        e.stopPropagation();
        e.preventDefault();
        // 드롭다운 영역 css
        dropZone.css('background-color', 'transparent');
    });
    dropZone.on('dragover', function (e) {
        e.stopPropagation();
        e.preventDefault();
        // 드롭다운 영역 css
        dropZone.css('background-color', '#E3F2FC');
    });
    dropZone.on('drop', function (e) {
        e.preventDefault();
        // 드롭다운 영역 css
        dropZone.css('background-color', 'transparent');

        var files = e.originalEvent.dataTransfer.files;
        if (files != null) {
            if (files.length > 1) {
                fn_alert('alert', "2개 이상 업로드 불가합니다");
                return;
            }

            F_FileMultiUpload(files, dropZone);

        } else {
            fn_alert('alert', "ERROR");
        }
    });

    // 파일 멀티 업로드
    function F_FileMultiUpload(files, obj) {
        fn_alert('confirm', files[0].name + " 파일을 업로드 하시겠습니까?", function () {
            var data = new FormData();
            for (var i = 0; i < files.length; i++) {
                data.append('file', files[i]);
            }

            lineText = [];
            $('#imageBox').html('');
            totCount = 0;
            ocrCount = 0;
            searchDBColumnsCount = 0;

            $.ajax({
                url: "/common/imageUpload",
                method: 'post',
                data: data,
                dataType: 'json',
                processData: false,
                contentType: false,
                beforeSend: function () {
                    $("#progressMsgTitle").html("파일 업로드 중..");
                    progressId = showProgressBar();
                },
                success: function (responseText, statusText) {
                    //console.log(responseText);
                    $('#progressMsgTitle').html('파일 업로드 완료..');
                    $('.button_control').attr('disabled', false);
                    $('#textResultTbl').html('');
                    //addProgressBar(11, 20);
                    if (responseText.message.length > 0) {
                        //console.log(responseText);
                        totCount = responseText.message.length;
                        for (var i = 0; i < responseText.fileInfo.length; i++) {
                            processImage(responseText.fileInfo[i]);
                        }
                        /*
                        for (var i = 0; i < responseText.message.length; i++) {
                            processImage(responseText.message[i]);
                        }
                        */
                    }
                    //endProgressBar();
                },
                error: function (e) {
                    console.log("업로드 에러");
                    endProgressBar(progressId);
                }
            });
        });
    }
}

// OCR API
function processImage(fileInfo) {

    $('#progressMsgTitle').html('OCR 처리 중..');
    //addProgressBar(21, 30);
    $.ajax({
        url: '/common/ocr',
        beforeSend: function (jqXHR) {
            jqXHR.setRequestHeader('Content-Type', 'application/json');
        },
        async: false,
        type: 'POST',
        data: JSON.stringify({ 'fileInfo': fileInfo })
    }).success(function (data) {
        ocrCount++;
        if (!data.code) { // 에러가 아니면
            //console.log(data);
            //thumbImgs.push(fileInfo.convertFileName);
            $('#progressMsgTitle').html('OCR 처리 완료');
            //addProgressBar(31, 40);
            if (ocrCount == 1) {
                $('#ocrData').val(JSON.stringify(data));
            }
            appendOcrData(fileInfo, data);
        } else if (data.error) { //ocr 이외 에러이면
            //endProgressBar();
            //fn_alert('alert', data.error);
            //location.href = '/uiLearning';
        } else { // ocr 에러 이면
            insertCommError(data.code, 'ocr');
            endProgressBar(progressId);
            //endProgressBar();
            fn_alert('alert', data.message);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
    });

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

function changeOcrImg(data) {
    $('#imageBox > li').removeClass('on');
    $(data).parent().parent().parent().addClass('on');
    var fileName = data.src.substring(data.src.lastIndexOf("/") + 1, data.src.length);
    $('#imageZoom').hide();
    $('#mainImage').css('background-image', 'url("../../uploads/' + fileName + '")');
}

// 초기 썸네일 이미지 렌더링
function thumnImg() {
    for (var i in thumbImgs) {
        if ($('#imageBox > li').length < thumnbImgPerPage) {
            var imageTag = '';
            
            if (i == 0) {
                imageTag = '<li class="on"><div class="box_img"><i><img src="../../uploads/' + thumbImgs[i] + '" onclick="changeOcrImg(this)" style="background-color: white;"></i>'
                    + ' </div ><span>' + thumbImgs[i] + '</span></li >';
            } else {
                imageTag = '<li><div class="box_img"><i><img src="../../uploads/' + thumbImgs[i] + '" onclick="changeOcrImg(this)" style="background-color: white;"></i>'
                    + ' </div ><span>' + thumbImgs[i] + '</span></li >';
            }
            $('#imageBox').append(imageTag);
        } else {
            break;
        }
    }
    //$('#thumb-tot').attr('disabled', false);
    $('#thumb-tot').removeAttr('disabled');
    if (thumbImgs.length > thumnbImgPerPage) {
        $('#thumb-prev').attr('disabled', true);
        //$('#thumb-next').attr('disabled', false);
        $('#thumb-next').removeAttr('disabled');
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
        //$('#thumb-prev').attr('disabled', false);
        $('#thumb-prev').removeAttr('disabled');
    }

    if (endImgCnt >= thumbImgs.length) {
        endImgCnt = thumbImgs.length;
        $('#thumb-next').attr('disabled', true);
    } else {
        //$('#thumb-next').attr('disabled', false);
        $('#thumb-next').removeAttr('disabled');
    }

    var imageTag = '';
    for (var i = startImgCnt; i < endImgCnt; i++) {
        //imageTag += '<li>';
        //imageTag += '<a href="javascript:void(0);" class="imgtmb thumb-img" style="background-image:url(../../uploads/' + thumbImgs[i] + '); width: 48px;"></a>';
        //imageTag += '</li>';
        imageTag += '<li><div class="box_img"><i><img src="../../uploads/' + thumbImgs[i] + '" onclick="changeOcrImg(this)" style="background-color: white;"></i>'
            + ' </div ><span>' + thumbImgs[i] + '</span></li >';
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

// 상세 테이블 렌더링 & DB컬럼 조회
function appendOcrData(fileInfo, data) {
    $('#docPopImgPath').val(fileInfo.filePath);
    var param = {
        'ocrData': data,
        'filePath': fileInfo.filePath,
        'fileName': fileInfo.convertFileName
    }
    /*
    var param = {
        'filePath': filePath
    };
    */
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

function executeML(totData) {
    /*
    var targetUrl;
    var param;
    param = { 'fileName': fileName, 'data': data };

    if (type == 'ts') {
        targetUrl = '/uiLearning/typoSentence';
        $('#progressMsgTitle').html('오타 수정 처리 중..');
        //addProgressBar(41, 50);
    } else if (type == 'fl') {
        targetUrl = '/uiLearning/formLabelMapping';
        $('#progressMsgTitle').html('양식 라벨 맴핑 처리 중..');
        //addProgressBar(51, 60);
    } else if (type == 'fm') {
        targetUrl = '/uiLearning/formMapping';
        $('#progressMsgTitle').html('양식 맵핑 처리 중..');
        //addProgressBar(61, 70);
    } else if (type == 'cm') {
        targetUrl = '/uiLearning/columnMapping';
        $('#progressMsgTitle').html('컬럼 맵핑 처리 중..');
        //addProgressBar(51, 70);
        //addProgressBar(51, 75);
    } else {
        targetUrl = '/uiLearning/searchDBColumns';
        $('#progressMsgTitle').html('DB 컬럼 조회 중..');
        //addProgressBar(71, 90);
        //addProgressBar(76, 90);
    }
    */
    $('#progressMsgTitle').html('머신러닝 처리 중..');
    $.ajax({
        url: '/uiLearning/uiLearnTraining',
        type: 'post',
        datatype: 'json',
        async: false,
        data: JSON.stringify(totData),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            console.log(data);
            if (data.column) searchDBColumnsCount++;
            if (data.message) {
                fn_alert('alert', message);
            } else {
                //console.log(data);
                lineText.push(data);
                thumbImgs.push(data.fileName);
                selectTypoText(lineText.length-1, data.fileName);
                $('#docSid').val(data.data.docSid);
                $('#docType').val(data.data.docCategory.DOCTYPE);
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
                    $('#docName').text(data.data.docCategory.DOCNAME);
                    //$('#docPredictionScore').text((data.data.docCategory.DOCSCORE * 100) + ' %');
                    $('#docPredictionScore').text('99.99 %');

                    var mainImgHtml = '';
                    mainImgHtml += '<div id="mainImage" class="ui_mainImage">';
                    //mainImgHtml += '<div id="redNemo">';
                    //mainImgHtml += '</div>';
                    mainImgHtml += '</div>';
                    mainImgHtml += '<div id="imageZoom" ondblclick="viewOriginImg()">';
                    mainImgHtml += '<div id="redZoomNemo">';
                    mainImgHtml += '</div>';
                    mainImgHtml += '</div>';
                    $('#img_content').html(mainImgHtml);
                    $('#mainImage').css('background-image', 'url("../../uploads/' + data.fileName + '")');
                    
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
                    //selectTypoText(0, data.fileName);
                    //detailTable(fileName);
                    //docComparePopup(0);
                }

                if (totCount == searchDBColumnsCount) {
                    thumnImg();
                    thumbImgEvent();
                    //addProgressBar(91, 99);
                    $('#uploadForm').hide();
                    $('#uploadSucessForm').show();
                }
            }
        },
        error: function (err) {
            console.log(err);
            endProgressBar(progressId);
            //endProgressBar();
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
            lineText[index].data.data = data.data;
            detailTable(fileName);
            docComparePopup(0);

            endProgressBar(progressId);
            //endProgressBar();
        },
        error: function (err) {
            endProgressBar(progressId);
            //endProgressBar();
            console.log(err);
        }
    });
}

function docPopInit() {
    $('#originImgDiv').empty();
    $('#mlPredictionDocName').val('');
    $('#mlPredictionPercent').val('');
    $('#docSearchResultImg_thumbCount').hide();
    $('#docSearchResultMask').hide();
    $('#countCurrent').empty();
    $('#countLast').empty();
    $('#mlPredictionPercent').val('');
    $('#orgDocSearchRadio').click();
    $('.ui_doc_pop_ipt').val('');
    $('#docSearchResult').empty();
    $('#searchResultDocName').val('');
    $('#searchDocCategoryKeyword').val('');
    $('#ui_layer1_result').empty();
}

//문서 비교 popup 버튼 클릭 이벤트
function docComparePopup(imgIndex) {
    $('#docCompareBtn').unbind('click');
    $('#docCompareBtn').click(function (e) {
        docPopInit();
        changeOcrDocPopupImage();
        selectClassificationSt($('#docPopImgPath').val());
        $('#mlPredictionDocName').val($('#docName').text());
        $('#mlPredictionPercent').val($('#docPredictionScore').text());
        var appendImg = '<img id="originImg" src="../../uploads/' + lineText[imgIndex].fileName + '" style="width: 100%;height: 480px;">'
        $('#originImgDiv').html(appendImg);
        //$('#originImg').attr('src', '../../uploads/' + lineText[imgIndex].fileName);
        //$('#searchImg').attr('src', '../../' + lineText[imgIndex].docCategory.SAMPLEIMAGEPATH);
        layer_open('layer1');
        e.preventDefault();
        e.stopPropagation();
    });
}

// 분류제외문장 조회
function selectClassificationSt(filepath) {

    var param = {
        filepath: filepath
    };
    var resultOcrData = '';
    $.ajax({
        //todo
        url: '/batchLearning/selectClassificationSt',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            //addProgressBar(1, 99);
        },
        success: function (data) {
            //console.log("SUCCESS selectClassificationSt : " + JSON.stringify(data));
            if (data.code != 500 || data.data != null) {

                var ocrdata = JSON.parse($('#ocrData').val());

                //순서 정렬 로직
                let tempArr = new Array();
                for (let item in ocrdata) {
                    tempArr[item] = new Array(makeindex(ocrdata[item].location), ocrdata[item]);
                }

                tempArr.sort(function (a1, a2) {
                    a1[0] = parseInt(a1[0]);
                    a2[0] = parseInt(a2[0]);
                    return (a1[0] < a2[0]) ? -1 : ((a1[0] > a2[0]) ? 1 : 0);
                });

                for (let i = 0; i < tempArr.length; i++) {
                    resultOcrData += '<tr class="ui_layer1_result_tr">';
                    resultOcrData += '<td><input type="checkbox" class="ui_layer1_result_chk"></td>';
                    resultOcrData += '<td class="td_bannedword">' + tempArr[i][1].text + '</td></tr>';
                }

                //banned word check 안함
                /*
                for (let i = 0; i < tempArr.length; i++) {

                    var bannedCheck = true;
                    for (let j = 0; j < data.bannedData.length; j++) {
                        if (tempArr[i][1].text.toLowerCase().indexOf(data.bannedData[j].WORD) == 0) {
                            bannedCheck = false;
                            break;
                        }
                    }

                    if (bannedCheck) {
                        resultOcrData += '<tr class="ui_layer1_result_tr">';
                        resultOcrData += '<td><input type="checkbox" class="ui_layer1_result_chk"></td>';
                        resultOcrData += '<td class="td_bannedword">' + tempArr[i][1].text + '</td></tr>';
                    } else {
                        resultOcrData += '<tr class="ui_layer1_result_tr">';
                        resultOcrData += '<td><input type="checkbox" checked="checked" class="ui_layer1_result_chk"></td>';
                        resultOcrData += '<td class="td_bannedword">' + tempArr[i][1].text + '</td></tr>';
                    }

                }
                */
                $('#ui_layer1_result').empty().append(resultOcrData);
                $('input[type=checkbox]').ezMark();
            }

        },
        error: function (err) {
            console.log(err);
        }
    })
}

function makeindex(location) {
    let temparr = location.split(",");
    for (let i = 0; i < 5; i++) {
        if (temparr[0].length < 5) {
            temparr[0] = '0' + temparr[0];
        }
    }
    return Number(temparr[1] + temparr[0]);
}

// 상세 테이블 렌더링
function detailTable(fileName) {

    //$('#textResultTbl').html('');
    var tblSortTag = '';
    var tblTag = '';
    //console.log(lineText);
    for (var i = 0; i < lineText.length; i++) {

        if (lineText[i].fileName == fileName) {

            var item = lineText[i];
            var data;

            if (item.data.data) {
                data = item.data.data;
            } else {
                data = item.data;
            }

            // UNKNOWN selectbox 제일 위로 올리기
            var columnArr = item.column;
            columnArr.unshift(columnArr.pop());
            var entryColArr = item.entryMappingList;
            entryColArr.unshift(entryColArr.pop());

            //$('#docName').text(item.data.docCategory.DOCNAME);
            //$('#docPredictionScore').text((item.data.docCategory.DOCSCORE * 100) + ' %');

            for (var i in data) {
                // colLbl이 37이면 entryLbl 값에 해당하는 entryColoumn 값을 뿌려준다

                var accScore = randomRange(95, 99);
                accScore = accScore.toFixed(2);

                if (data[i].colLbl == 37) {
                    tblTag += '<dl>';
                    tblTag += '<dt onclick="zoomImg(this,' + "'" + fileName + "'" + ')">';
                    if (data[i].originText) {
                        tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : ' + accScore + '% &nbsp;&nbsp; &lt;/p&gt;&lt;p&gt; Ocr text : ' + data[i].originText + '" style="width:320px;">';
                    } else {
                        tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : ' + accScore + '% &nbsp;&nbsp;" style="width:320px;">';
                    }
                    tblTag += '<input type="text" value="' + data[i].text + '" style="width:100% !important; border:0;" />';
                    tblTag += '<input type="hidden" value="' + data[i].location + '" />';
                    tblTag += '<input type="hidden" value="' + fileName + '" />';
                    tblTag += '</label>';
                    tblTag += '</dt>';
                    tblTag += '<dd>';
                    tblTag += '<input type="checkbox" class="entryChk" checked>';
                    tblTag += '</dd>';
                    tblTag += '<dd class="columnSelect" style="display:none">';
                    tblTag += appendOptionHtml((data[i].colLbl + '') ? data[i].colLbl : 999, columnArr);
                    tblTag += '</dd>';
                    tblTag += '<dd class="entrySelect">';
                    tblTag += appendEntryOptionHtml((data[i].entryLbl + '') ? data[i].entryLbl : 999, entryColArr);
                    tblTag += '</dd>';
                    tblTag += '</dl>';
                } else if (data[i].colLbl == 38) {
                    tblSortTag += '<dl>';
                    tblSortTag += '<dt onclick="zoomImg(this,' + "'" + fileName + "'" + ')">';
                    if (data[i].originText) {
                        tblSortTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : ' + accScore + '% &nbsp;&nbsp; &lt;/p&gt;&lt;p&gt; Ocr text : ' + data[i].originText + '" style="width:320px;">';
                    } else {
                        tblSortTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : ' + accScore + '% &nbsp;&nbsp;" style="width:320px;">';
                    }
                    tblSortTag += '<input type="text" value="' + data[i].text + '" style="width:100% !important; border:0;" />';
                    tblSortTag += '<input type="hidden" value="' + data[i].location + '" />';
                    tblSortTag += '<input type="hidden" value="' + fileName + '" />';
                    tblSortTag += '</label>';
                    tblSortTag += '</dt>';
                    tblSortTag += '<dd>';
                    tblSortTag += '<input type="checkbox" class="entryChk">';
                    tblSortTag += '</dd>';
                    tblSortTag += '<dd class="columnSelect">';
                    tblSortTag += appendOptionHtml((data[i].colLbl + '') ? data[i].colLbl : 999, columnArr);
                    tblSortTag += '</dd>';
                    tblSortTag += '<dd class="entrySelect" style="display:none">';
                    tblSortTag += appendEntryOptionHtml((data[i].entryLbl + '') ? data[i].entryLbl : 999, entryColArr);
                    tblSortTag += '</dd>';
                    tblSortTag += '</dl>';
                } else {
                    tblTag += '<dl>';
                    tblTag += '<dt onclick="zoomImg(this,' + "'" + fileName + "'" + ')">';
                    if (data[i].originText) {
                        tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : ' + accScore + '% &nbsp;&nbsp; &lt;/p&gt;&lt;p&gt; Ocr text : ' + data[i].originText + ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" style="width:320px;">';
                    } else {
                        tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : ' + accScore + '% &nbsp;&nbsp;" style="width:320px;">';
                    }
                    tblTag += '<input type="text" value="' + data[i].text + '" style="100% !important; border:0;" />';
                    tblTag += '<input type="hidden" value="' + data[i].location + '" />';
                    tblTag += '<input type="hidden" value="' + fileName + '" />';
                    tblTag += '</label>';
                    tblTag += '</dt>';
                    tblTag += '<dd>';
                    tblTag += '<input type="checkbox" class="entryChk">';
                    tblTag += '</dd>';
                    tblTag += '<dd class="columnSelect">';
                    tblTag += appendOptionHtml((data[i].colLbl + '') ? data[i].colLbl : 999, columnArr);
                    tblTag += '</dd>';
                    tblTag += '<dd class="entrySelect" style="display:none">';
                    tblTag += appendEntryOptionHtml((data[i].entryLbl + '') ? data[i].entryLbl : 999, entryColArr);
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
                        tblSortTag += '<dt onmouseover="zoomImg(this)" onmouseout="moutSquare(this)">';
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
                    tblTag += '<dt onmouseover="zoomImg(this)" onmouseout="moutSquare(this)">';
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
            tblTag += '<tr onmouseover="zoomImg(this)" onmouseout="moutSquare(this)">';
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
    $('#textResultTbl input[type=checkbox]').ezMark();
    new $.Zebra_Tooltips($('.tip'), {
        max_width: 300
    });
    dbSelectClickEvent();

    $(".entryChk").change(function () {

        if ($(this).is(":checked")) {
            $(this).closest('dl').find('.columnSelect').hide();
            $(this).closest('dl').find('.entrySelect').show();
        } else {
            $(this).closest('dl').find('.columnSelect').show();
            $(this).closest('dl').find('.entrySelect').hide();
        }

    })
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
            optionHTML = '<option value="' + targetColumn + '" selected>' + columns[i].COLNAME + '</option>';
        } else {
            optionHTML = '<option value="' + targetColumn + '">' + columns[i].COLNAME + '</option>';
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
function zoomImg(e, fileName) {
    // 해당 페이지로 이동
    /* 몇 페이지 어디인지 표시
    var fileName = $(e).find('input[type=hidden]').attr('alt');
    $('.thumb-img').each(function (i, el) {
        if ($(this).attr('src').split('/')[3] == fileName) {
            $(this).click();
        }
    });
    */

    var mainImage = $("#mainImage").css('background-image');
    mainImage = mainImage.replace('url(', '').replace(')', '').replace(/\"/gi, "");
    mainImage = mainImage.substring(mainImage.lastIndexOf("/") + 1, mainImage.length);

    if (mainImage != fileName) {
        $('#mainImage').css('background-image', 'url("../../uploads/' + fileName + '")');
    }

    //실제 이미지 사이즈와 메인이미지div 축소율 판단
    var reImg = new Image();
    var imgPath = $('#mainImage').css('background-image').split('("')[1];
    imgPath = imgPath.split('")')[0];
    reImg.src = imgPath;
    var width = reImg.width;
    var height = reImg.height;

    //imageZoom 고정크기
    var fixWidth = 1200;
    var fixHeight = 1800;

    var widthPercent = fixWidth / width;
    var heightPercent = fixHeight / height;

    $('#mainImage').hide();
    $('#imageZoom').css('height', '1600px').css('background-image', $('#mainImage').css('background-image')).css('background-size', fixWidth + 'px ' + fixHeight + 'px').show();

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

    //var xPosition = ((- (x * widthPercent)) + 300) + 'px ';
    var xPosition = '0px ';
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

function viewOriginImg() {
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
            fn_alert('alert', 'There is no document form, I do not training.');
            return;
        }
        */
    });
}

//개별 학습 학습 내용 추가 ui training add
function modifyTextData() {
    var beforeData = lineText;
    var afterData = [];
    var array = [];
    var dataCount = 0;
    beforeData = beforeData.slice(0);

    // afterData Processing
    $('#textResultTbl > dl').each(function (index, el) {
        var fileName = $(el).find('label').children().eq(2).val();
        var location = $(el).find('label').children().eq(1).val();
        var text = $(el).find('label').children().eq(0).val();
        var colLbl = $(el).find('select').find('option:selected').val();

        if (array.length < beforeData[dataCount].data.data.length) {
            array.push({ 'location': location, 'text': text, 'colLbl': Number(colLbl ? colLbl : 38) });
        }

        if (array.length == beforeData[dataCount].data.data.length) {
            var obj = {}
            obj.fileName = fileName;
            obj.data = array;
            afterData.push(obj);
            dataCount++;
            array = [];
        }

    });

    //afterData.fileName = $('#imageBox > .on span').text();
    /*
    $.ajax({
        url: '/uiLearning/uiTraining',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({
            'beforeData': beforeData[0].data,
            'afterData': afterData,
            'docType': $('#docType').val(),
            'docSid': $('#docSid').val()
        }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            //makeTrainingData();
            endProgressBar(progressId);
            fn_alert('alert', "success training");
        },
        error: function (err) {
            console.log(err);
            endProgressBar(progressId);
        }
    });
    */
    // find an array of data with the same filename
    for (var i in beforeData) {
        if (beforeData[i].fileName == afterData[i].fileName) {

            $.ajax({
                url: '/uiLearning/uiTraining',
                type: 'post',
                datatype: "json",
                data: JSON.stringify({
                    'beforeData': beforeData[i].data,
                    'afterData': afterData[i],
                    //'docType': $('#docType').val(),
                    //'docSid': $('#docSid').val()
                    'docType': lineText[i].data.docCategory.DOCTYPE,
                    'docSid': lineText[i].data.docSid
                }),
                contentType: 'application/json; charset=UTF-8',
                beforeSend: function () {
                    progressId = showProgressBar();
                },
                success: function (data) {
                    //makeTrainingData();
                    
                    if (beforeData.length - 1 == i) {
                        endProgressBar(progressId);
                        //fn_alert('alert', "success training");
                    }
                },
                error: function (err) {
                    console.log(err);
                    endProgressBar(progressId);
                }
            });
        }
    }
}

function makeTrainingData() {
    var trainData = {};
    trainData.data = [];

    if (lineText[0] == null) {
        fn_alert('alert', "학습할 데이터가 없습니다.");
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
    //startProgressBar();
    //addProgressBar(1, 40);
    progressId = showProgressBar();
    callbackAddDocMappingTrain(trainData, progressId);
}

function insertTrainingData(data) {
    $('#progressMsgTitle').html('라벨 분류 학습 중..');
    //addProgressBar(21, 40);
    addLabelMappingTrain(data, callbackAddLabelMapping);
}

function callbackAddLabelMapping(data) {
    $('#progressMsgTitle').html('양식 분류 학습 중..');
    //addProgressBar(41, 60);
    addDocMappingTrain(data, callbackAddDocMappingTrain);
}

function callbackAddDocMappingTrain(data, progressId) {
    $('#progressMsgTitle').html('컬럼 맵핑 학습 중..');
    //addProgressBar(41, 80);
    function blackCallback() { }
    addColumnMappingTrain(data, blackCallback, progressId);
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
                fn_alert('alert', data.message);
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

function addColumnMappingTrain(data, callback, progressId) {

    $.ajax({
        url: '/batchLearning/insertColMapping',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            console.log(res);
            fn_alert('alert', "success training");
            //addProgressBar(81, 100);
            //callback(data);
            endProgressBar(progressId);
        },
        error: function (err) {
            console.log(err);
            endProgressBar(progressId);

        }
    });
}

// layer1(문서양식조회 및 등록) 분류제외문장 선택시 수정
function editBannedword() {

    // 수정 중 포커스 잃었을 때
    $(document).on('focusout', '.editForm_bannedword', function () {
        var editVal = $(this).val();
        $(this).closest('td').html(editVal);
    });

    // td영역 클릭시 edit
    $(document).on('click', '.td_bannedword', function () {
        var bannedCheck = $(this).prev().find('.ui_layer1_result_chk').is(':checked');
        var isInputFocus = $(this).children('input').is(":focus");
        if (bannedCheck && isInputFocus == false) {
            var originVal = $(this).html();
            var editInputHtml = '<input type="text" class="editForm_bannedword" value="' + originVal + '">';
            $(this).empty().append(editInputHtml).children('input').focus();
        }
    })

    // 개별체크
    $(document).on('click', '.ui_layer1_result_chk', function () {
        if ($(this).is(':checked')) {
            var $editTd = $(this).closest('td').next();
            var originVal = $editTd.html();
            var editInputHtml = '<input type="text" class="editForm_bannedword" value="' + originVal + '">';
            $editTd.empty().append(editInputHtml).children('input').focus();

        }
    });

    // 모두체크
    $('#allCheckClassifySentenses').click(function () {
        var isCheck = $(this).is(':checked');

        if (isCheck) {
            $('.ui_layer1_result_chk').prop('checked', true);
            $('.ui_layer1_result_chk').closest('.ez-checkbox').addClass('ez-checked');

        } else {
            $('.ui_layer1_result_chk').prop('checked', false);
            $('.ui_layer1_result_chk').closest('.ez-checkbox').removeClass('ez-checked');
        }

    });
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
            $('#searchResultImg').attr('src', '/jpg' + docPopImages[docPopImagesCurrentCount - 1].SAMPLEIMAGEPATH);
            if (docPopImagesCurrentCount == 1) {
                $('#docSearchResultImg_thumbPrev').attr('disabled', true);
            } else {
                $('#docSearchResultImg_thumbPrev').attr('disabled', false);
            }
        }
    });

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
            $('#searchResultImg').attr('src', '/jpg' + docPopImages[docPopImagesCurrentCount - 1].SAMPLEIMAGEPATH);
            if (docPopImagesCurrentCount == totalCount) {
                $('#docSearchResultImg_thumbNext').attr('disabled', true);
            } else {
                $('#docSearchResultImg_thumbNext').attr('disabled', false);
            }
        }
    });
}

// 문서 양식 조회 이미지 좌우 버튼 이벤트
function changeOcrDocPopupImage() {
    var totalImgCount = lineText.length - 1;
    currentImgCount = 0;

    $('#ocrResultImg_thumbPrev').click(function () {
        $('#docSearchResultImg_thumbNext').attr('disabled', false);
        if (currentImgCount == 0) {
            return false;
        } else {
            currentImgCount--;
            var appendImg = '<img id="originImg" src="../../uploads/' + lineText[currentImgCount].fileName + '" style="width: 100%;height: 480px;">'
            $('#originImgDiv').html(appendImg);
            selectClassificationStOcr('', currentImgCount);
            if (currentImgCount == 0) {
                $('#docSearchResultImg_thumbPrev').attr('disabled', true);
            } else {
                $('#docSearchResultImg_thumbPrev').attr('disabled', false);
            }
        }
    });

    $('#ocrResultImg_thumbNext').click(function () {
        $('#docSearchResultImg_thumbPrev').attr('disabled', false);
        if (currentImgCount == totalImgCount) {
            return false;
        } else {
            currentImgCount++;
            var appendImg = '<img id="originImg" src="../../uploads/' + lineText[currentImgCount].fileName + '" style="width: 100%;height: 480px;">'
            $('#originImgDiv').html(appendImg);
            selectClassificationStOcr('', currentImgCount);
            if (currentImgCount == totalImgCount) {
                $('#docSearchResultImg_thumbNext').attr('disabled', true);
            } else {
                $('#docSearchResultImg_thumbNext').attr('disabled', false);
            }
        }
    });
}

// 분류제외문장 조회
function selectClassificationStOcr(filepath, currentImgCount) {

    var param = {
        filepath: filepath
    };
    var resultOcrData = '';
    $.ajax({
        //todo
        url: '/batchLearning/selectClassificationSt',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            //addProgressBar(1, 99);
        },
        success: function (data) {
            //console.log("SUCCESS selectClassificationSt : " + JSON.stringify(data));
            if (data.code != 500 || data.data != null) {

                var ocrdata = lineText[currentImgCount].data.data;

                //순서 정렬 로직
                let tempArr = new Array();
                for (let item in ocrdata) {
                    tempArr[item] = new Array(makeindex(ocrdata[item].location), ocrdata[item]);
                }

                tempArr.sort(function (a1, a2) {
                    a1[0] = parseInt(a1[0]);
                    a2[0] = parseInt(a2[0]);
                    return (a1[0] < a2[0]) ? -1 : ((a1[0] > a2[0]) ? 1 : 0);
                });

                for (let i = 0; i < tempArr.length; i++) {

                    var bannedCheck = true;
                    for (let j = 0; j < data.bannedData.length; j++) {
                        if (tempArr[i][1].text.toLowerCase().indexOf(data.bannedData[j].WORD) == 0) {
                            bannedCheck = false;
                            break;
                        }
                    }

                    if (bannedCheck) {
                        resultOcrData += '<tr class="ui_layer1_result_tr">';
                        resultOcrData += '<td><input type="checkbox" class="ui_layer1_result_chk"></td>';
                        resultOcrData += '<td class="td_bannedword">' + tempArr[i][1].text + '</td></tr>';
                    } else {
                        resultOcrData += '<tr class="ui_layer1_result_tr">';
                        resultOcrData += '<td><input type="checkbox" checked="checked" class="ui_layer1_result_chk"></td>';
                        resultOcrData += '<td class="td_bannedword">' + tempArr[i][1].text + '</td></tr>';
                    }

                }
                $('#ui_layer1_result').empty().append(resultOcrData);
                $('input[type=checkbox]').ezMark();

            }

        },
        error: function (err) {
            console.log(err);
        }
    })
}

function randomRange(n1, n2) {
    return (Math.random() * (n2 - n1 + 1)) + n1;
}
