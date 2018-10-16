﻿//import { identifier } from "babel-types";
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
var thumnbImgPerPage = 6; // 한 페이지당 썸네일 이미지 개수
var x, y, textWidth, textHeight; // 문서 글씨 좌표
var mouseX, mouseY, mouseMoveX, mouseMoveY; // 마우스 이동 시작 좌표, 마우스 이동 좌표
var docType = '';
var progressId; // progress Id

/**
 * 전역변수 초기화
 **/
var initGlobalVariable = function () {
    totCount = 0;
    ocrCount = 0;
    searchDBColumnsCount = 0;
    lineText = [];
    thumbImgs = []; // 썸네일 이미지 경로 배열
    thumnImgPageCount = 1; // 썸네일 이미지 페이징 번호
    thumnbImgPerPage = 6; // 한 페이지당 썸네일 이미지 개수
    x = 0;
    y = 0;
    textWidth = 0;
    textHeight = 0; // 문서 글씨 좌표
    mouseX = 0;
    mouseY = 0;
    mouseMoveX = 0;
    mouseMoveY = 0; // 마우스 이동 시작 좌표, 마우스 이동 좌표
};

// 폼 초기화
var initForm = function () {
    $("#span_document_base").html("문서 기본정보");
    $("#tbody_baseList").html("");
    $("#span_document_dtl").html("인식 결과");
    $("#tbody_dtlList").html("");
    $("#main_image").prop("src", "");
    $("#main_image").prop("alt", "");
    $("#ul_image").html("");

    $("#div_image").fadeOut("fast");
    $("#div_dtl").fadeOut("fast");
    $("#div_base").fadeOut("fast");
};

$(function () {
    _init();
});

/****************************************************************************************
 * INIT
 ****************************************************************************************/
var _init = function () {
    initForm();
    initGlobalVariable();
    fn_scrollbarEvent();
    fn_buttonEvent();
    fn_uploadFileEvent();
    fn_docEvent();
    fn_checkboxEvent();
    fn_searchDocEnterEvent();
    ocrResult();
};

/****************************************************************************************
 * SCROLLBAR EVENT
 ****************************************************************************************/
var fn_scrollbarEvent = function () {
    $("#mCSB_1_dragger_horizontal").mCustomScrollbar({
        callbacks: {
            whileScrolling: function () {
                $('#divHeadScroll').scrollLeft($('#mCSB_1_dragger_horizontal').css('left').substring(0, $('#mCSB_1_dragger_horizontal').css('left').indexOf("p")));
            }
        }
    });
};

/****************************************************************************************
 * BUTTON EVENT
 ****************************************************************************************/
var fn_buttonEvent = function () {
    $("#btn_search").on("click", function () {
        fn_search();
    });

    $("#ctnExtractionBtn").on("click", function () {
        fn_ContractNumExtraction();
    });

    $("#reTrainBtn").on("click", function () {
        fn_reTrain();
    });

};

/****************************************************************************************
 * FILE UPLOAD EVENT
 ****************************************************************************************/
var fn_uploadFileEvent = function () {


    $("#uploadFile").change(function () {
        if ($(this).val() !== "") {
            initGlobalVariable();   // 전역변수 초기화
            initForm();             // 폼 초기화
            $('#uploadFileForm').submit();
        }
    });

    $("#uploadFileBtn").click(function () {
		thumbImgs = [];
        $("#uploadFile").click();
    });

    $('#uploadFileForm').ajaxForm({
        beforeSubmit: function (data, frm, opt) {
            $("#progressMsgTitle").html('파일 업로드 중..');
            startProgressBar(); // start progressbar
            addProgressBar(1, 10); // proceed progressbar
            return true;
        },
        success: function (responseText, statusText) {
            $("#progressMsgTitle").html('파일 업로드 완료..');
            addProgressBar(11, 20);

            //console.log('base 사이즈 :' + responseText.fileInfo.length);
            //console.log('dtl 사이즈 :' + responseText.fileDtlInfo.length);
            //console.log('base 내용 :' + JSON.stringify(responseText.fileInfo));
            //console.log('dtl 내용 :' + JSON.stringify(responseText.fileDtlInfo));

            //totCount = responseText.fileInfo.length; 
            totCount = responseText.fileDtlInfo.length;
            // 문서 기본 정보 처리
            fn_processBaseImage(responseText.fileInfo);

            /*
            // 인식 결과 및 ML 처리
            for (var i = 0, x = responseText.fileInfo[0].pageCount; i < x; i++) {
                fn_processDtlImage(responseText.fileDtlInfo[i]);
            }
            */

            //endProgressBar();
        },
        error: function (e) {
            endProgressBar();
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
            if (files.length < 1) {
                alert("폴더 업로드 불가");
                return;
            }

            F_FileMultiUpload(files, dropZone);

        } else {
            alert("ERROR");
        }
    });
    
    // 파일 멀티 업로드
    function F_FileMultiUpload(files, obj) {
        if (confirm(files.length + "개의 파일을 업로드 하시겠습니까?")) {
            initGlobalVariable();   // 전역변수 초기화
            initForm();             // 폼 초기화
            var data = new FormData();
            for (var i = 0; i < files.length; i++) {
                data.append('file', files[i]);
            }

            $.ajax({
                url: "/invoiceRegistration/uploadFile",
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
                    $("#progressMsgTitle").html('파일 업로드 완료..');

                    //console.log('base 사이즈 :' + responseText.fileInfo.length);
                    //console.log('dtl 사이즈 :' + responseText.fileDtlInfo.length);
                    //console.log('base 내용 :' + JSON.stringify(responseText.fileInfo));
                    //console.log('dtl 내용 :' + JSON.stringify(responseText.fileDtlInfo));

                    //totCount = responseText.fileInfo.length; 
                    totCount = responseText.fileDtlInfo.length;
                    // 문서 기본 정보 처리
                    fn_processBaseImage(responseText.fileInfo);
                    // 인식 결과 및 ML 처리
                    for (var i = 0, x = responseText.fileDtlInfo.length; i < x; i++) {
                        fn_processDtlImage(responseText.fileDtlInfo[i]);
                    }

                    endProgressBar();
                },
                error: function (e) {
                    console.log("업로드 에러");
                    endProgressBar(progressId);
                }
            });
        }
    }
    
};

/****************************************************************************************
 * Function
 ****************************************************************************************/
var fn_reTrain = function () {
    var fileName = $('#ul_image .on img').attr('src');
    fn_initUiTraining();
    layer_open('layer2');

    var mainImgHtml = '';
    mainImgHtml += '<div id="popupMainImage" class="ui_mainImage">';
    mainImgHtml += '<div id="redNemo">';
    mainImgHtml += '</div>';
    mainImgHtml += '</div>';
    mainImgHtml += '<div id="imageZoom" ondblclick="viewOriginImg()">';
    mainImgHtml += '<div id="redZoomNemo">';
    mainImgHtml += '</div>';
    mainImgHtml += '</div>';
    $('#img_content').html(mainImgHtml);
    $('#popupMainImage').css('background-image', 'url("' + fileName + '")');

    fileName = fileName.substring(fileName.lastIndexOf("/") + 1, fileName.length);
    var data = '';

    for (var i in lineText) {
        if (lineText[i].fileName == fileName) {
            data = lineText[i];
            break;
        }
    }

    var mlData = data.data.data;
    var columnArr = data.column;
    var entryColArr = data.entryMappingList;

    var tblTag = '';
    var tblSortTag = '';

    columnArr.unshift(columnArr.pop());
    entryColArr.unshift(entryColArr.pop());

    for (var i in mlData) {
        // colLbl이 37이면 entryLbl 값에 해당하는 entryColoumn 값을 뿌려준다
        if (mlData[i].colLbl == 37) {
            tblTag += '<dl>';
            tblTag += '<dt onclick="zoomImg(this)">';
            tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
            tblTag += '<input type="text" value="' + mlData[i].text + '" style="width:100%; border:0;" />';
            tblTag += '<input type="hidden" value="' + mlData[i].location + '" />';
            tblTag += '</label>';
            tblTag += '</dt>';
            tblTag += '<dd>';
            tblTag += '<input type="checkbox" class="entryChk" checked>';
            tblTag += '</dd>';
            tblTag += '<dd class="columnSelect" style="display:none">';
            tblTag += appendOptionHtml((mlData[i].colLbl + '') ? mlData[i].colLbl : 999, columnArr);
            tblTag += '</dd>';
            tblTag += '<dd class="entrySelect">';
            tblTag += appendEntryOptionHtml((mlData[i].entryLbl + '') ? mlData[i].entryLbl : 999, entryColArr);
            tblTag += '</dd>';
            tblTag += '</dl>';
        } else if (mlData[i].colLbl == 38) {
            tblSortTag += '<dl>';
            tblSortTag += '<dt onclick="zoomImg(this)">';
            tblSortTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
            tblSortTag += '<input type="text" value="' + mlData[i].text + '" style="width:100%; border:0;" />';
            tblSortTag += '<input type="hidden" value="' + mlData[i].location + '" />';
            tblSortTag += '</label>';
            tblSortTag += '</dt>';
            tblSortTag += '<dd>';
            tblSortTag += '<input type="checkbox" class="entryChk">';
            tblSortTag += '</dd>';
            tblSortTag += '<dd class="columnSelect">';
            tblSortTag += appendOptionHtml((mlData[i].colLbl + '') ? mlData[i].colLbl : 999, columnArr);
            tblSortTag += '</dd>';
            tblSortTag += '<dd class="entrySelect" style="display:none">';
            tblSortTag += appendEntryOptionHtml((mlData[i].entryLbl + '') ? mlData[i].entryLbl : 999, entryColArr);
            tblSortTag += '</dd>';
            tblSortTag += '</dl>';
        } else {
            tblTag += '<dl>';
            tblTag += '<dt onclick="zoomImg(this)">';
            tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
            tblTag += '<input type="text" value="' + mlData[i].text + '" style="width:100%; border:0;" />';
            tblTag += '<input type="hidden" value="' + mlData[i].location + '" />';
            tblTag += '</label>';
            tblTag += '</dt>';
            tblTag += '<dd>';
            tblTag += '<input type="checkbox" class="entryChk">';
            tblTag += '</dd>';
            tblTag += '<dd class="columnSelect">';
            tblTag += appendOptionHtml((mlData[i].colLbl + '') ? mlData[i].colLbl : 999, columnArr);
            tblTag += '</dd>';
            tblTag += '<dd class="entrySelect" style="display:none">';
            tblTag += appendEntryOptionHtml((mlData[i].entryLbl + '') ? mlData[i].entryLbl : 999, entryColArr);
            tblTag += '</dd>';
            tblTag += '</dl>';
        }
    }

    $('#textResultTbl').append(tblTag).append(tblSortTag);
    // input 태그 마우스오버 말풍선 Tooltip 적용
    $('input[type=checkbox]').ezMark();
    new $.Zebra_Tooltips($('.tip'));
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

// UI학습 팝업 초기화
var fn_initUiTraining = function () {
    $('#imgNameTag').text('');
    $("#uiImg").html('');
    $("#textResultTbl").html('');
};

var fn_search = function () {
    var param = {
        docNum: nvl($("#docNum").val().toUpperCase()),
        documentManager: nvl($("#documentManager").val())
    };

    $.ajax({
        url: '/invoiceRegistration/searchDocumentList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            addProgressBar(1, 99);
        },
        success: function (data) {
            var appendHtml = "";
            //console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    appendHtml += '<tr id="tr_base_' + entry.SEQNUM + '-' + entry.DOCNUM + '-' + entry.STATUS + '">' +
                        '<td><input type="checkbox" id="base_chk_' + entry.DOCNUM + '" name="base_chk" value="' + entry.DOCNUM + '" /></td>' +
                        '<td name="td_base">' + entry.DOCNUM + '</td>' +
                        '<td name="td_base">' + nvl2(entry.PAGECNT, 0) + '</td>' +
                        '<td name="td_base">' + entry.NOWNUM + '</td>' +
                        '<td></td>' +
                        '<td></td>' +
                        '<td></td>' +
                        '<td></td>' +
                        '<td></td>' +
                        '</tr>';
                });
            } else {
                appendHtml += '<tr><td colspan="7">조회된 데이터가 없습니다.</td></tr>';
            }
            $("#tbody_baseList").empty().append(appendHtml);
            $("#tbody_baseList input[type=checkbox]").ezMark();
            $("#span_document_base").empty().html("문서 기본정보 - " + data.length + "건");
            $("#div_base").fadeIn();
            fn_clickEvent();
            endProgressBar();
        },
        error: function (err) {
            endProgressBar();
            console.log(err);
        }
    });
};

var fn_searchDocEnterEvent = function () {
    $('#docNum, #documentManager').keyup(function (e) {
        if (e.keyCode == 13) $('#btn_search').click();
    });
};

var fn_ctnExtraction = function () {
    $("input[name=dtl_chk]").each(function () {

        if (this.checked) {
            var tdLength = $(this).parent().parent().find("td").length;

            var dataObj = {};

            var trText = $(this).parent().parent().html();
            $(this).parent().parent().parent().last('</tr>').append('<tr>' + trText + '</tr>');

            for (var i = 1; i < tdLength; i++) {
                var text = $(this).parent().parent().find("td").eq(i).find("select :selected").text();
                $(this).parent().parent().find("td").eq(i).html(text);
                switch (i) {
                    case 1:
                        dataObj.OGCOMPANYNAME = text;
                        break;
                    case 2:
                        dataObj.CTNM = text;
                        break;
                    case 3:
                        dataObj.UY = text;
                        break;
                    case 4:
                        dataObj.CURCD = text;
                        break;
                    case 5:
                        dataObj.CURUNIT = text;
                        break;
                    case 6:
                        dataObj.PAIDPERCENT = text;
                        break;
                    case 7:
                        dataObj.PAIDSHARE = text;
                        break;
                    case 8:
                        dataObj.OSLPERCENT = text;
                        break;
                    case 9:
                        dataObj.OSLSHARE = text;
                        break;
                    case 10:
                        dataObj.PM = text;
                        break;
                    case 11:
                        dataObj.PMPFEND = text;
                        break;
                    case 12:
                        dataObj.PMPFWOS = text;
                        break;
                    case 13:
                        dataObj.XOLPM = text;
                        break;
                    case 14:
                        dataObj.RETURNPM = text;
                        break;
                    case 15:
                        dataObj.CN = text;
                        break;
                    case 16:
                        dataObj.PROFITCN = text;
                        break;
                    case 17:
                        dataObj.BROKERAGE = text;
                        break;
                    case 18:
                        dataObj.TAX = text;
                        break;
                    case 19:
                        dataObj.OVERRIDINGCOM = text;
                        break;
                    case 20:
                        dataObj.CHARGE = text;
                        break;
                    case 21:
                        dataObj.PMRESERVERTD1 = text;
                        break;
                    case 22:
                        dataObj.PFPMRESERVERTD1 = text;
                        break;
                    case 23:
                        dataObj.PMRESERVERTD2 = text;
                        break;
                    case 24:
                        dataObj.PFPMRESERVERTD2 = text;
                        break;
                    case 25:
                        dataObj.CLAIM = text;
                        break;
                    case 26:
                        dataObj.LOSSRECOVERY = text;
                        break;
                    case 27:
                        dataObj.CASHLOSS = text;
                        break;
                    case 28:
                        dataObj.CASHLOSSRD = text;
                        break;
                    case 29:
                        dataObj.LOSSRR = text;
                        break;
                    case 30:
                        dataObj.LOSSRR2 = text;
                        break;
                    case 31:
                        dataObj.LOSSPFENT = text;
                        break;
                    case 32:
                        dataObj.LOSSPFWOA = text;
                        break;
                    case 33:
                        dataObj.INTEREST = text;
                        break;
                    case 34:
                        dataObj.TAXON = text;
                        break;
                    case 35:
                        dataObj.MISCELLANEOUS = text;
                        break;
                    case 36:
                        dataObj.CSCOSARFRNCNNT2 = text;
                        break;
                }

            }

        }

    })
};

// 클릭 이벤트 (DOCUMENT)
var fn_clickEvent = function () {
    // Document 클릭 시 상세 조회
    $("td[name='td_base']").on("click", function () {
        var id = $(this).parent().attr("id");
        var numArr = id.replace("tr_base_", "");
        var seqNum = numArr.split("-")[0];
        var docNum = numArr.split("-")[1];
        fn_search_dtl(docNum); // document_dtl 조회
    });
    // Document DTL 클릭 시 이미지 조회
    $("td[name='td_dtl']").on("click", function () {
        var id = $(this).parent().attr("id");
        var imgId = id.replace("tr_dtl_", "");
        fn_search_image(imgId); // image 조회
    });
};

var fn_search_dtl = function (docNum) {
    //DB 조회후 클릭시 파일 정보 읽어와서 ocr 보냄
    var param = {
        docNum: docNum
    };

    $.ajax({
        url: '/invoiceRegistration/selectOcrFileDtl',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsgTitle").html("retrieving document detail list...");
            startProgressBar(); // start progressbar
            addProgressBar(1, 1); // proceed progressbar
        },
        success: function (data) {
            //console.log(data);
            addProgressBar(2, 99); // proceed progressbar
            for (var i in data.docData) {

                var obj = {};
                obj.imgId = data.docData[i].IMGID;
                obj.convertedFilePath = data.fileRootPath;
                obj.filePath = data.docData[i].FILEPATH;
                obj.oriFileName = data.docData[i].ORIGINFILENAME;
                obj.convertFileName = data.docData[i].ORIGINFILENAME;
                fn_processDtlImage(obj);
            }
            
            endProgressBar(); // end progressbar
        }, error: function (err) {
            endProgressBar(); // end progressbar
            console.log(err);
        }
    });

    
}

// document_dtl 조회
var fn_search_dtl_old = function (seqNum, docNum) {
    var param = {
        seqNum: seqNum,
        docNum: docNum
    };
    var appendHtml = "";
    $.ajax({
        url: '/invoiceRegistration/searchDocumentDtlList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsgTitle").html("retrieving document detail list...");
            startProgressBar(); // start progressbar
            addProgressBar(1, 1); // proceed progressbar
        },
        success: function (data) {
            addProgressBar(2, 99); // proceed progressbar
            console.log(data);
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    appendHtml += 
                        '<tr id="tr_dtl_' + entry.IMGID + '" name="tr_dtl" style="cursor:pointer">' +
                            '<td><input type="checkbox" id="dtl_chk_'+ entry.DOCNUM + '" name="dtl_chk" /></td>' +
                            '<td name="td_dtl">' + entry.IMGFILESTARTNO + '<th>' +
                            '<td name="td_dtl">' + entry.IMGFILESTARTNO + '</th>' +
                            '<td name="td_dtl">' + nvl(entry.OGCOMPANYNAME) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.CTNM) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.UY) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.CONTRACTNUM) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.CURCD) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.PAIDPERCENT) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.PAIDSHARE) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.OSLPERCENT) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.OSLSHARE) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.GROSSPM) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.PM) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.PMPFEND) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.PMPFWOS) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.XOLPM) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.RETURNPM) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.GROSSCN) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.CN) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.PROFITCN) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.BROKERAGE) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.TAX) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.OVERRIDINGCOM) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.CHARGE) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.PMRESERVERTD1) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.PFPMRESERVERTD1) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.PMRESERVERTD2) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.PFPMRESERVERTD2) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.CLAIM) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.LOSSRECOVERY) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.CASHLOSS) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.CASHLOSSRD) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.LOSSRR) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.LOSSRR2) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.LOSSPFEND) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.LOSSPFWOA) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.INTEREST) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.TAXON) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.MISCELLANEOUS) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.PMBL) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.CMBL) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.NTBL) + '</td>' +
                            '<td name="td_dtl">' + nvl(entry.CSCOSARFRNCNNT2) + '</td>' +
                        '</tr>';
                });
            } else {
                appendHtml += '<tr><td colspan="7">조회할 데이터가 없습니다.</td></tr>';
            }
            $("#tbody_dtlList").empty().html(appendHtml);
            $("#tbody_dtlList input[type=checkbox]").ezMark();
            $("#span_document_dtl").empty().html('인식 결과 -' + data.length + '건');
            $("#div_dtl").fadeIn('slow');
            fn_clickEvent(); // regist and refresh click event
            endProgressBar(); // end progressbar
        }, error: function (err) {
            endProgressBar(); // end progressbar
            console.log(err);
        }
    });
};

// img 조회
var fn_search_image = function (imgId) {
    var param = {
        imgId: imgId
    };
    var imageHtml = "";
    var appendHtml = "";
    $.ajax({
        url: '/invoiceRegistration/searchDocumentImageList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsgTitle").html("retrieving document image list...");
            startProgressBar(); // start progressbar
            addProgressBar(1, 1); // proceed progressbar
        },
        success: function (data) {
            addProgressBar(2, 99); // proceed progressbar
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    if (index == 0) {
                        $("#main_image").prop("src", '../../' + nvl(entry.ORIGINFILENAME));
                        $("#main_image").prop("alt", entry.ORIGINFILENAME);
                        imageHtml += '<li class="on">' + 
                                        '<div class="box_img"><i><img src="../../' + nvl(entry.ORIGINFILENAME) + '" title="' + nvl(entry.ORIGINFILENAME) + '"></i></div>' +
                                        '<span>' + nvl(entry.ORIGINFILENAME) + '</span>' +
                                    '</li> ';
                    } else {
                        imageHtml += 
                                    '<li>' +
                                        '<div class="box_img"><i><img src="../../' + nvl(entry.ORIGINFILENAME) + '" title="' + nvl(entry.ORIGINFILENAME) + '"></i></div>' +
                                        '<span>' + nvl(entry.ORIGINFILENAME) + '</span>' +
                                    '</li>';
                    }
                });
            } else {
                //appendHtml += '<tr><td colspan="7">조회할 데이터가 없습니다.</td></tr>';
                imageHtml += '<li>문서 이미지가 존재하지 않습니다.</li>';
            }
            //$("#div_view_image").empty().append(imageHtml);
            $("#ul_image").empty().append(imageHtml);
            $("#div_image").fadeIn('slow');
            fn_clickEvent(); // regist and refresh click event
            endProgressBar(); // end progressbar
        }, error: function (err) {
            endProgressBar(); // end progressbar
            console.log(err);
        }
    });
};

// [Checkbox Event]
var fn_checkboxEvent = function () {

    //문서 기본정보 모두선택 체크
    $('#docListAllChk').on('click', function () {
        if ($(this).is(':checked')) {
            $('#tbody_baseList .ez-checkbox').addClass('ez-checked');
            $('#tbody_baseList input[type=checkbox]').prop('checked', true);
        } else {
            $('#tbody_baseList .ez-checkbox').removeClass('ez-checked');
            $('#tbody_baseList input[type=checkbox]').prop('checked', false);
        }
    });

    //인식 결과 모두선택 체크
    $('#ocrResultAllChk').on('click', function () {
        if ($(this).is(':checked')) {
            $('#tbody_dtlList .ez-checkbox').addClass('ez-checked');
            $('#tbody_dtlList input[type=checkbox]').prop('checked', true);
            $('#deleteRow').attr('disabled', false);
        } else {
            $('#tbody_dtlList .ez-checkbox').removeClass('ez-checked');
            $('#tbody_dtlList input[type=checkbox]').prop('checked', false);
            $('#deleteRow').attr('disabled', true);
        }
    });
}


//인식결과 
var ocrResult = function () {

    //행 추가
    $('#addRow').click(function () {

        var appendRowHtml = '<tr><td><input type="checkbox" value="" name="dtl_chk"></td>' +
            '<td><input type="text" name=""></td> <!--출재사명-->' +
            '<td><input type="text" name=""></td> <!--계약명-->' +
            '<td><input type="text" name=""></td> <!--UY-->' +
            '<td><input type="text" name=""></td> <!--화폐코드-->' +
            '<td><input type="text" name=""></td> <!--화폐단위-->' +
            '<td><input type="text" name=""></td> <!--Paid(100%)-->' +
            '<td><input type="text" name=""></td> <!--Paid(Our Share)-->' +
            '<td><input type="text" name=""></td> <!--OSL(100%)-->' +
            '<td><input type="text" name=""></td> <!--OSL(Our Share)-->' +
            '<td><input type="text" name=""></td> <!--PREMIUM-->' +
            '<td><input type="text" name=""></td> <!--PREMIUM P/F ENT-->' +
            '<td><input type="text" name=""></td> <!--PREMIUM P/F WOS-->' +
            '<td><input type="text" name=""></td> <!--XOL PREMIUM-->' +
            '<td><input type="text" name=""></td> <!--RETURN PREMIUM-->' +
            '<td><input type="text" name=""></td> <!--COMMISION -->' +
            '<td><input type="text" name=""></td> <!--PROFIT COMMISION-->' +
            '<td><input type="text" name=""></td> <!--BROKERAGE-->' +
            '<td><input type="text" name=""></td> <!--TEX-->' +
            '<td><input type="text" name=""></td> <!-- OVERIDING COM-->' +
            '<td><input type="text" name=""></td> <!--CHARGE-->' +
            '<td><input type="text" name=""></td> <!--PREMIUM RESERVE RTD-->' +
            '<td><input type="text" name=""></td> <!--P/F PREMIUM RESERVE RTD-->' +
            '<td><input type="text" name=""></td> <!--P/F PREMIUM RESERVE RLD-->' +
            '<td><input type="text" name=""></td> <!--P/F PREMIUM RESERVE RLD-->' +
            '<td><input type="text" name=""></td> <!--CLAIM -->' +
            '<td><input type="text" name=""></td> <!--LOSS RECOVERY -->' +
            '<td><input type="text" name=""></td> <!--CASH LOSS -->' +
            '<td><input type="text" name=""></td> <!--CASH LOSS REFUND -->' +
            '<td><input type="text" name=""></td> <!--LOSS RESERVE RTD -->' +
            '<td><input type="text" name=""></td> <!--LOSS RESERVE RLD -->' +
            '<td><input type="text" name=""></td> <!--LOSS P/F ENT -->' +
            '<td><input type="text" name=""></td> <!--LOSS P/F WOA -->' +
            '<td><input type="text" name=""></td> <!--INTEREST -->' +
            '<td><input type="text" name=""></td> <!--TAX ON -->' +
            '<td><input type="text" name=""></td> <!--MISCELLANEOUS -->' +
            '<td><input type="text" name=""></td> <!--YOUR REF -->' +
            '</tr > '
        $('#tbody_dtlList').append(appendRowHtml);
        $('#tbody_dtlList input[type=checkbox]:last').ezMark();
    });

    //행 삭제
    $('#deleteRow').click(function () {

        if (confirm("행 삭제를 하시겠습니까?")) {

            $('input[name=dtl_chk]').each(function () {
                if ($(this).is(':checked')) {
                    $(this).closest('tr').remove();
                }
            });

            $('#deleteRow').prop('disabled', true);
        }
    });

    //체크박스 여부에 따른 행 삭제 버튼 활성화/비활성화
    $(document).on('click', 'input[name=dtl_chk]', function () {

        var chkCnt = $('input[name="dtl_chk"]:checked').length;
        if (chkCnt >= 1) {
            $('#deleteRow').attr('disabled', false);
        } else {
            $('#deleteRow').attr('disabled', true);
        }
    });

    //셀렉트박스 더블클릭시 수정폼
    $(document).on('dblclick', '.selectDbClick', function () {
        var selectVal = $(this).val().split('_')[1] == undefined ? "" : $(this).val().split('_')[1];
        var editHtml = '<input type="text" value="' + selectVal + '">';
        var td = $(this).closest('td');
        td.empty().append(editHtml);
        td.find('input[type=text]').focus();
    });
}



/****************************************************************************************
 * ML
 ****************************************************************************************/
// 문서 기본 정보 append
var fn_processBaseImage = function (fileInfo) {
    $.ajax({
        url: '/invoiceRegistration/selectDocument',
        type: 'post',
        datatype: 'json',
        async: false,
        data: JSON.stringify({ 'fileInfo': fileInfo}),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            //console.log(data);
            if (data.code == 200) {
                var html = "";
                for (var i = 0; i < data.docData.length; i++) {
                    var item = data.docData[i];
                    html += '<tr id="tr_base_' + item.SEQNUM+ '-' + item.DOCNUM + '-' + item.STATUS + '">' +
                                '<td><input type="checkbox" id="base_chk_' + item.DOCNUM + '" class ="base_chk_Yn" name="base_chk" /></td>' +
                                '<td name="td_base">' + item.DOCNUM + '</td>' +
                                '<td name="td_base">' + item.PAGECNT + '</td>' +
                                '<td name="td_base">' + item.NOWNUM + '</td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                            '</tr>';
                }
                $("#tbody_baseList").empty().append(html);
                $("#tbody_baseList input[type=checkbox]").ezMark();
                $("#div_base").css("display", "block");
                fn_clickEvent();
				fn_search_dtl(fileInfo[0].imgId);
            } else {
                console.log(data.error);
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
};

// ML 및 인식결과 append
var fn_processDtlImage = function (fileDtlInfo) {
    var fileName = fileDtlInfo.oriFileName;
    $('#progressMsgTitle').html('OCR 처리 중..');
    addProgressBar(21, 30);
    $.ajax({
        url: '/common/ocr',
        beforeSend: function (jqXHR) {
            jqXHR.setRequestHeader("Content-Type", "application/json");
        },
        async: false,
        type: "POST",
        data: JSON.stringify({ 'fileInfo': fileDtlInfo }),
    }).done(function (data) {
        ocrCount++;
        thumbImgs.push(fileName);
        if (!data.code) { // 에러가 아니면
            //thumbImgs.push(fileName);
            $('#progressMsgTitle').html('OCR 처리 완료');
            addProgressBar(31, 40);
            appendOcrData(fileDtlInfo, fileName, data);
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
};


// OCR 데이터 line별 가공 & 상세 테이블 렌더링 & DB컬럼 조회
var appendOcrData = function (fileDtlInfo, fileName, data) {
    var filePath = fileDtlInfo.convertedFilePath + fileName;
    var param = {
        'ocrData': data,
        'filePath': filePath,
        'fileDtlInfo': fileDtlInfo,
        'fileName': fileName,
        'docType': docType
    };
    executeML(param);
};

function executeML(totData) {

    $('#progressMsgTitle').html('머신러닝 처리 중..');
    $.ajax({
        url: '/invoiceRegistration/uiLearnTraining',
        type: 'post',
        datatype: 'json',
        async: false,
        data: JSON.stringify(totData),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            console.log(data);
            if (data.column) searchDBColumnsCount++;
            if (data.message) {
                alert(message);
            } else {
                //console.log(data);
                lineText.push(data);
                fn_processFinish(data.data, totData.fileDtlInfo); // 인식 결과
                $('#docSid').val(data.data.docSid);
                docType = data.data.docCategory.DOCTYPE;
                $('#docType').val(data.data.docCategory.DOCTYPE);
                if (searchDBColumnsCount == 1) {

                    var mainImgHtml = '';
                    mainImgHtml += '<div id="mainImage" class="ui_mainImage">';
                    //mainImgHtml += '<div id="redNemo">';
                    //mainImgHtml += '</div>';
                    mainImgHtml += '</div>';
                    mainImgHtml += '<div id="imageZoom" ondblclick="viewOriginImg()">';
                    mainImgHtml += '<div id="redZoomNemo">';
                    mainImgHtml += '</div>';
                    mainImgHtml += '</div>';

                    $('#div_invoice_view_image').html(mainImgHtml);
                    $('#mainImage').css('background-image', 'url("../../uploads/' + data.fileName + '")');
                    $('#imageBox > li').eq(0).addClass('on');
                    $('#div_image').css("display", "block");
                    
                    //$('#imageBox > li').eq(0).addClass('on');

                    //selectTypoText(0, data.fileName);

                }

                if (totCount == searchDBColumnsCount) {
                    thumnImg();
                    //fn_processFinish(lineText);
                    thumbImgEvent();
                    thumbImgPagingEvent();
                }
            }

            endProgressBar();
        },
        error: function (err) {
            console.log(err);
            endProgressBar(progressId);
            //endProgressBar();
        }
    });
}

/**
 * @param {any} type
 * ts : typoSentence , dd : domainDictionary , tc : textClassification , lm : labelMapping , sc : searchDBColumns
 */
var executeML_Old = function (fileDtlInfo, fileName, data, type) {
    var targetUrl;

    console.log('다음 순서 type =' + type);

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
                    var mainImgHtml = 
                                        '<div id="mainImage">' +
                                            '<div id="redNemo"></div>' +
                                        '</div>' +
                                        '<div id="imageZoom">' + 
                                            '<div id="redZoomNemo"></div>' +
                                        '</div>';
                    $('#div_invoice_view_image').html(mainImgHtml);
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
};

// 인식 결과 처리
function fn_processFinish_Old1(data) {
    var dataVal = [];
    for (var i = 0; i < lineText.length; i++) {
        for (var j = 0; j < lineText[i].data.data.length; j++) {
            dataVal.push(lineText[i].data.data[j]);
        }
    }

    // TODO : 분석 결과를 정리하고 1 record로 생성한다.
    var dtlHtml = '<tr>' +
        '<td><input type="checkbox" value="' + dataObj.imgId + '" name="dtl_chk" /></td>' +
        '<td>' + makeMLSelect(dataVal, 0, null) + '</td> <!--출재사명-->' +
        '<td>' + makeMLSelect(dataVal, 1, null) + '</td> <!--계약명-->' +
        '<td>' + makeMLSelect(dataVal, 2, null) + '</td> <!--UY-->' +
        '<td>' + makeMLSelect(dataVal, 3, null) + '</td> <!--화폐코드-->' +
        '<td>' + makeMLSelect(dataVal, 4, null) + '</td> <!--화폐단위-->' +
        '<td>' + makeMLSelect(dataVal, 5, 0) + '</td> <!--Paid(100%)-->' +
        '<td>' + makeMLSelect(dataVal, 6, 1) + '</td> <!--Paid(Our Share)-->' +
        '<td>' + makeMLSelect(dataVal, 7, 2) + '</td> <!--OSL(100%)-->' +
        '<td>' + makeMLSelect(dataVal, 8, 3) + '</td> <!--OSL(Our Share)-->' +
        '<td>' + makeMLSelect(dataVal, 9, 4) + '</td> <!--PREMIUM-->' +
        '<td>' + makeMLSelect(dataVal, 10, 5) + '</td> <!--PREMIUM P/F ENT-->' +
        '<td>' + makeMLSelect(dataVal, 11, 6) + '</td> <!--PREMIUM P/F WOS-->' +
        '<td>' + makeMLSelect(dataVal, 12, 7) + '</td> <!--XOL PREMIUM-->' +
        '<td>' + makeMLSelect(dataVal, 13, 8) + '</td> <!--RETURN PREMIUM-->' +
        '<td>' + makeMLSelect(dataVal, 14, 9) + '</td> <!--COMMISION -->' +
        '<td>' + makeMLSelect(dataVal, 15, 10) + '</td> <!--PROFIT COMMISION-->' +
        '<td>' + makeMLSelect(dataVal, 16, 11) + '</td> <!--BROKERAGE-->' +
        '<td>' + makeMLSelect(dataVal, 17, 12) + '</td> <!--TEX-->' +
        '<td>' + makeMLSelect(dataVal, 18, 13) + '</td> <!-- OVERIDING COM-->' +
        '<td>' + makeMLSelect(dataVal, 19, 14) + '</td> <!--CHARGE-->' +
        '<td>' + makeMLSelect(dataVal, 20, 15) + '</td> <!--PREMIUM RESERVE RTD-->' +
        '<td>' + makeMLSelect(dataVal, 21, 16) + '</td> <!--P/F PREMIUM RESERVE RTD-->' +
        '<td>' + makeMLSelect(dataVal, 22, 17) + '</td> <!--P/F PREMIUM RESERVE RLD-->' +
        '<td>' + makeMLSelect(dataVal, 23, 18) + '</td> <!--P/F PREMIUM RESERVE RLD-->' +
        '<td>' + makeMLSelect(dataVal, 24, 19) + '</td> <!--CLAIM -->' +
        '<td>' + makeMLSelect(dataVal, 25, 20) + '</td> <!--LOSS RECOVERY -->' +
        '<td>' + makeMLSelect(dataVal, 26, 21) + '</td> <!--CASH LOSS -->' +
        '<td>' + makeMLSelect(dataVal, 27, 22) + '</td> <!--CASH LOSS REFUND -->' +
        '<td>' + makeMLSelect(dataVal, 28, 23) + '</td> <!--LOSS RESERVE RTD -->' +
        '<td>' + makeMLSelect(dataVal, 29, 24) + '</td> <!--LOSS RESERVE RLD -->' +
        '<td>' + makeMLSelect(dataVal, 30, 25) + '</td> <!--LOSS P/F ENT -->' +
        '<td>' + makeMLSelect(dataVal, 31, 26) + '</td> <!--LOSS P/F WOA -->' +
        '<td>' + makeMLSelect(dataVal, 32, 27) + '</td> <!--INTEREST -->' +
        '<td>' + makeMLSelect(dataVal, 33, 28) + '</td> <!--TAX ON -->' +
        '<td>' + makeMLSelect(dataVal, 34, 29) + '</td> <!--MISCELLANEOUS -->' +
        '<td>' + makeMLSelect(dataVal, 35, null) + '</td> <!--YOUR REF -->' +
        '</tr>';

    $("#tbody_dtlList").append(dtlHtml);
    $("#tbody_dtlList input[type=checkbox]").ezMark();
    $("#div_dtl").css("display", "block");
    function makeMLSelect(mlData, colnum, entry) {

        var appendMLSelect = '<select class="selectDbClick" onchange="zoomImg(this, \'' + fileDtlInfo.convertFileName + '\')">';
        appendMLSelect += '<option value="선택">선택</option>';
        var hasColvalue = false;
        for (var y = 0; y < mlData.length; y++) {

            if (mlData[y].colLbl == colnum && (mlData[y].colLbl <= 3 || mlData[y].colLbl >= 35)) {
                hasColvalue = true;
                appendMLSelect += '<option>' + mlData[y].text + '</option>';
            } else if (mlData[y].colLbl == 37 && mlData[y].entryLbl == entry) {
                hasColvalue = true;
                appendMLSelect += '<option>' + mlData[y].text + '</option>';
            }

        }
        appendMLSelect += '</select>';

        return hasColvalue ? appendMLSelect : '';
    }
}

// 인식 결과 처리
function fn_processFinish(data, fileDtlInfo) {
    //console.log("data : " + JSON.stringify(data));
    //console.log("fileDtlInfo : " + JSON.stringify(fileDtlInfo));

    var dataObj = {};
    var dataVal = data.data;
    dataObj["imgId"] = fileDtlInfo.imgId;


    // TODO : 분석 결과를 정리하고 1 record로 생성한다.
    var dtlHtml = '<tr>' +
        '<td><input type="checkbox" value="' + dataObj.imgId + '" name="dtl_chk" /></td>' +
        '<td>' + makeMLSelect(dataVal, 0, null) + '</td> <!--출재사명-->' +
        '<td>' + makeMLSelect(dataVal, 1, null) + '</td> <!--계약명-->' +
        '<td>' + makeMLSelect(dataVal, 2, null) + '</td> <!--UY-->' +
        '<td>' + makeMLSelect(dataVal, 3, null) + '</td> <!--화폐코드-->' +
        '<td>' + makeMLSelect(dataVal, 4, null) + '</td> <!--화폐단위-->' +
        '<td>' + makeMLSelect(dataVal, 5, 0) + '</td> <!--Paid(100%)-->' +
        '<td>' + makeMLSelect(dataVal, 6, 1) + '</td> <!--Paid(Our Share)-->' +
        '<td>' + makeMLSelect(dataVal, 7, 2) + '</td> <!--OSL(100%)-->' +
        '<td>' + makeMLSelect(dataVal, 8, 3) + '</td> <!--OSL(Our Share)-->' +
        '<td>' + makeMLSelect(dataVal, 9, 4) + '</td> <!--PREMIUM-->' +
        '<td>' + makeMLSelect(dataVal, 10, 5) + '</td> <!--PREMIUM P/F ENT-->' +
        '<td>' + makeMLSelect(dataVal, 11, 6) + '</td> <!--PREMIUM P/F WOS-->' +
        '<td>' + makeMLSelect(dataVal, 12, 7) + '</td> <!--XOL PREMIUM-->' +
        '<td>' + makeMLSelect(dataVal, 13, 8) + '</td> <!--RETURN PREMIUM-->' +
        '<td>' + makeMLSelect(dataVal, 14, 9) + '</td> <!--COMMISION -->' +
        '<td>' + makeMLSelect(dataVal, 15, 10) + '</td> <!--PROFIT COMMISION-->' +
        '<td>' + makeMLSelect(dataVal, 16, 11) + '</td> <!--BROKERAGE-->' +
        '<td>' + makeMLSelect(dataVal, 17, 12) + '</td> <!--TEX-->' +
        '<td>' + makeMLSelect(dataVal, 18, 13) + '</td> <!-- OVERIDING COM-->' +
        '<td>' + makeMLSelect(dataVal, 19, 14) + '</td> <!--CHARGE-->' +
        '<td>' + makeMLSelect(dataVal, 20, 15) + '</td> <!--PREMIUM RESERVE RTD-->' +
        '<td>' + makeMLSelect(dataVal, 21, 16) + '</td> <!--P/F PREMIUM RESERVE RTD-->' +
        '<td>' + makeMLSelect(dataVal, 22, 17) + '</td> <!--P/F PREMIUM RESERVE RLD-->' +
        '<td>' + makeMLSelect(dataVal, 23, 18) + '</td> <!--P/F PREMIUM RESERVE RLD-->' +
        '<td>' + makeMLSelect(dataVal, 24, 19) + '</td> <!--CLAIM -->' +
        '<td>' + makeMLSelect(dataVal, 25, 20) + '</td> <!--LOSS RECOVERY -->' +
        '<td>' + makeMLSelect(dataVal, 26, 21) + '</td> <!--CASH LOSS -->' +
        '<td>' + makeMLSelect(dataVal, 27, 22) + '</td> <!--CASH LOSS REFUND -->' +
        '<td>' + makeMLSelect(dataVal, 28, 23) + '</td> <!--LOSS RESERVE RTD -->' +
        '<td>' + makeMLSelect(dataVal, 29, 24) + '</td> <!--LOSS RESERVE RLD -->' +
        '<td>' + makeMLSelect(dataVal, 30, 25) + '</td> <!--LOSS P/F ENT -->' +
        '<td>' + makeMLSelect(dataVal, 31, 26) + '</td> <!--LOSS P/F WOA -->' +
        '<td>' + makeMLSelect(dataVal, 32, 27) + '</td> <!--INTEREST -->' +
        '<td>' + makeMLSelect(dataVal, 33, 28) + '</td> <!--TAX ON -->' +
        '<td>' + makeMLSelect(dataVal, 34, 29) + '</td> <!--MISCELLANEOUS -->' +
        '<td>' + makeMLSelect(dataVal, 35, null) + '</td> <!--YOUR REF -->' +
        '</tr>';

    $("#tbody_dtlList").empty().append(dtlHtml);
    $("#tbody_dtlList input[type=checkbox]").ezMark();
    $("#div_dtl").css("display", "block");
    function makeMLSelect(mlData, colnum, entry) {

        var appendMLSelect = '<select onchange="zoomImg(this, \'' + fileDtlInfo.convertFileName + '\')">';
        appendMLSelect += '<option value="선택">선택</option>';
        var hasColvalue = false;
        for (var y = 0; y < mlData.length; y++) {

            if (mlData[y].colLbl == colnum && (mlData[y].colLbl <= 3 || mlData[y].colLbl >= 35)) {
                hasColvalue = true;
                appendMLSelect += '<option value="' + mlData[y].location + '">' + mlData[y].text + '</option>';
            } else if (mlData[y].colLbl == 37 && mlData[y].entryLbl == entry) {
                hasColvalue = true;
                appendMLSelect += '<option value="' + mlData[y].location + '">' + mlData[y].text + '</option>';
            }
        }
        appendMLSelect += '</select>';
        return hasColvalue ? appendMLSelect : '';
    }
}

//계약 번호 추출
function fn_ContractNumExtraction() {
    //console.log("data : " + JSON.stringify(data));
    //console.log("fileDtlInfo : " + JSON.stringify(fileDtlInfo));
    
    var dataObj = {};
    var dataVal = lineText[0].data.data;
    var fileName = lineText[0].fileName;
    dataObj["imgId"] = $("input[name='dtl_chk']").val();

    var cdnNm = '';
    var ctNm = '';
    var ttyYy = '';

    for (var i in dataVal) {
        if (dataVal[i].colLbl == 0) {
            cdnNm = dataVal[i].text;
        }
        if (dataVal[i].colLbl == 1) {
            ctNm = dataVal[i].text;
        }
        if (dataVal[i].colLbl == 2) {
            ttyYy = dataVal[i].text;
        }
    }

    $.ajax({
        url: '/wF_WorkflowProc/',
        type: 'post',
        datatype: 'json',
        async: false,
        data: JSON.stringify({cdnNm: cdnNm, ctNm: ctNm, ttyYy: ttyYy}),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsgTitle").html("계약번호 추출 중..");
            progressId = showProgressBar();
        },
        success: function (data) {
            var dtlHtml = '';
            for (var i in data.data) {
                // TODO : 분석 결과를 정리하고 1 record로 생성한다.
                dtlHtml += '<tr>' +
                    '<td><input type="checkbox" value="' + dataObj.imgId + '" name="dtl_chk" /></td>' +
                    '<td>' + data.data[i].cdnNm + '</td> <!--출재사명-->' +
                    '<td>' + data.data[i].ctNm + '</td> <!--계약명-->' +
                    '<td>' + data.data[i].ttyYy + '</td> <!--UY-->' +
                    '<td>' + makeMLSelect(dataVal, 3, null) + '</td> <!--화폐코드-->' +
                    '<td>' + makeMLSelect(dataVal, 4, null) + '</td> <!--화폐단위-->' +
                    '<td>' + makeMLSelect(dataVal, 5, 0) + '</td> <!--Paid(100%)-->' +
                    '<td>' + makeMLSelect(dataVal, 6, 1) + '</td> <!--Paid(Our Share)-->' +
                    '<td>' + makeMLSelect(dataVal, 7, 2) + '</td> <!--OSL(100%)-->' +
                    '<td>' + makeMLSelect(dataVal, 8, 3) + '</td> <!--OSL(Our Share)-->' +
                    '<td>' + makeMLSelect(dataVal, 9, 4) + '</td> <!--PREMIUM-->' +
                    '<td>' + makeMLSelect(dataVal, 10, 5) + '</td> <!--PREMIUM P/F ENT-->' +
                    '<td>' + makeMLSelect(dataVal, 11, 6) + '</td> <!--PREMIUM P/F WOS-->' +
                    '<td>' + makeMLSelect(dataVal, 12, 7) + '</td> <!--XOL PREMIUM-->' +
                    '<td>' + makeMLSelect(dataVal, 13, 8) + '</td> <!--RETURN PREMIUM-->' +
                    '<td>' + makeMLSelect(dataVal, 14, 9) + '</td> <!--COMMISION -->' +
                    '<td>' + makeMLSelect(dataVal, 15, 10) + '</td> <!--PROFIT COMMISION-->' +
                    '<td>' + makeMLSelect(dataVal, 16, 11) + '</td> <!--BROKERAGE-->' +
                    '<td>' + makeMLSelect(dataVal, 17, 12) + '</td> <!--TEX-->' +
                    '<td>' + makeMLSelect(dataVal, 18, 13) + '</td> <!-- OVERIDING COM-->' +
                    '<td>' + makeMLSelect(dataVal, 19, 14) + '</td> <!--CHARGE-->' +
                    '<td>' + makeMLSelect(dataVal, 20, 15) + '</td> <!--PREMIUM RESERVE RTD-->' +
                    '<td>' + makeMLSelect(dataVal, 21, 16) + '</td> <!--P/F PREMIUM RESERVE RTD-->' +
                    '<td>' + makeMLSelect(dataVal, 22, 17) + '</td> <!--P/F PREMIUM RESERVE RLD-->' +
                    '<td>' + makeMLSelect(dataVal, 23, 18) + '</td> <!--P/F PREMIUM RESERVE RLD-->' +
                    '<td>' + makeMLSelect(dataVal, 24, 19) + '</td> <!--CLAIM -->' +
                    '<td>' + makeMLSelect(dataVal, 25, 20) + '</td> <!--LOSS RECOVERY -->' +
                    '<td>' + makeMLSelect(dataVal, 26, 21) + '</td> <!--CASH LOSS -->' +
                    '<td>' + makeMLSelect(dataVal, 27, 22) + '</td> <!--CASH LOSS REFUND -->' +
                    '<td>' + makeMLSelect(dataVal, 28, 23) + '</td> <!--LOSS RESERVE RTD -->' +
                    '<td>' + makeMLSelect(dataVal, 29, 24) + '</td> <!--LOSS RESERVE RLD -->' +
                    '<td>' + makeMLSelect(dataVal, 30, 25) + '</td> <!--LOSS P/F ENT -->' +
                    '<td>' + makeMLSelect(dataVal, 31, 26) + '</td> <!--LOSS P/F WOA -->' +
                    '<td>' + makeMLSelect(dataVal, 32, 27) + '</td> <!--INTEREST -->' +
                    '<td>' + makeMLSelect(dataVal, 33, 28) + '</td> <!--TAX ON -->' +
                    '<td>' + makeMLSelect(dataVal, 34, 29) + '</td> <!--MISCELLANEOUS -->' +
                    '<td>' + makeMLSelect(dataVal, 35, null) + '</td> <!--YOUR REF -->' +
                    '</tr>';
            }

            $("#tbody_dtlList").empty().append(dtlHtml);
            $("#tbody_dtlList input[type=checkbox]").ezMark();
            $("#div_dtl").css("display", "block");

            endProgressBar(progressId);
        },
        error: function (err) {
            console.log(err);
            endProgressBar(progressId);
        }
    });

    function makeMLSelect(mlData, colnum, entry) {

        var appendMLSelect = '<select onchange="zoomImg(this, \'' + fileName + '\')">';
        appendMLSelect += '<option value="선택">선택</option>';
        var hasColvalue = false;
        for (var y = 0; y < mlData.length; y++) {

            if (mlData[y].colLbl == colnum && (mlData[y].colLbl <= 3 || mlData[y].colLbl >= 35)) {
                hasColvalue = true;
                appendMLSelect += '<option value="' + mlData[y].location + '_' + mlData[y].text + '">' + mlData[y].text + '</option>';
            } else if (mlData[y].colLbl == 37 && mlData[y].entryLbl == entry) {
                hasColvalue = true;
                appendMLSelect += '<option value="' + mlData[y].location + '_' + mlData[y].text + '">' + mlData[y].text + '</option>';
            }
        }
        appendMLSelect += '</select>';
        return hasColvalue ? appendMLSelect : '';
    }
}

// 인식 결과 처리
function fn_processFinish_Old(data, fileDtlInfo) {
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
        var dtlHtml = '<tr>' +
                                '<td><input type="checkbox" id="dtl_chk_' + item.imgId + '" name="dtl_chk" /></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td>' + dataObj.cscoSaRfrnCnnt2 + '</td>' +
                                '<td>' + dataObj.ctnm + '</td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                                '<td></td>' +
                            '</tr>';

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
};

// 초기 썸네일 이미지 렌더링
var thumnImg = function () {
    //console.log("thumbImgs : " + thumbImgs);
    for (var i in thumbImgs) {
        if ($('#ul_image > li').length < thumnbImgPerPage) {
            var imageTag = '';

            if (i == 0) {
                imageTag = '<li class="on"><a href="#none" class="imgtmb thumb-img"><img src="../../uploads/' + thumbImgs[i] + '" style="width: 48px; background-color:white" /></a></li>';
            } else {
                imageTag = '<li><a href="#none" class="imgtmb thumb-img"><img src="../../uploads/' + thumbImgs[i] + '" style="width: 48px; background-color:white" /></a></li>';
            }
            
            $('#ul_image').append(imageTag);
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
    thumbImgEvent();
    //console.log(thumbImgs);
};

// 썸네일 이미지 페이징
var thumbImgPaging = function (pageCount) {
    $('#ul_image').html('');
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
        imageTag += '<li>';
        //imageTag += '<a href="javascript:void(0);" class="imgtmb thumb-img" style="background-image:url(../../uploads/' + thumbImgs[i] + '); width: 48px;"></a>';
        imageTag += '<a href="javascript:void(0);" class="imgtmb thumb-img"><img src="../../uploads/' + thumbImgs[i] + '" style="width: 48px; background-color: white;"></a>';
        imageTag += '</li>';
    }
    $('#ul_image').append(imageTag);
    thumbImgEvent();
}

// 썸네일 이미지 클릭 이벤트
var thumbImgEvent = function () {
    $('.thumb-img').click(function () {
        $('#ul_image > li').removeClass('on');
        $(this).parent().addClass('on');
        $('#mainImage').css('background-image', 'url("' + $(this).children().attr("src") + '")');
        //$('#mainImage').css('background-image', $(this).children().prop('src'));
        //detailTable($(this).css('background-image').split('/')[4].split('")')[0]);
        //detailTable($(this).children().prop('src').split('/')[4].split('")')[0]);
    });
};

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

function zoomImg(e, fileName) {
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
    var fixWidth = 744;
    var fixHeight = 1052;

    var widthPercent = fixWidth / width;
    var heightPercent = fixHeight / height;

    $('#mainImage').hide();
    $('#imageZoom').css('height', '570px').css('background-image', $('#mainImage').css('background-image')).css('background-size', fixWidth + 'px ' + fixHeight + 'px').show();

    // 사각형 좌표값
    var location = $(e).val().split('_')[0].split(',');
    x = parseInt(location[0]);
    y = parseInt(location[1]);
    textWidth = parseInt(location[2]);
    textHeight = parseInt(location[3]);

    var xPosition = ((- (x * widthPercent)) + 300) + 'px ';
    var yPosition = ((- (y * heightPercent)) + 200) + 'px';
    //console.log(xPosition + yPosition);
    $('#imageZoom').css('background-position', xPosition + yPosition);

    $('#redZoomNemo').css('height', (textHeight + 5) + 'px');
    $('#redZoomNemo').show();
}

function viewOriginImg() {
    $('#imageZoom').hide();
    $('#mainImage').show();
}

/****************************************************************************************
 * 문서기본정보 - 삭제,전달,저장
 ****************************************************************************************/
var fn_docEvent = function () {

    //삭제
    $('#deleteDocBtn').click(function () {
        var rowData = new Array();
        var tdArr = new Array();
        var checkbox = $("input[name=base_chk]:checked");
        var deleteTr = [];
        // 체크된 체크박스 값을 가져온다
        checkbox.each(function (i) {

            var tr = checkbox.parent().parent().parent().eq(i);
            var td = tr.children();

            // 체크된 row의 모든 값을 배열에 담는다.
            rowData.push(tr.text());

            // td.eq(0)은 체크박스 이므로  td.eq(1)의 값부터 가져온다.
            var docNum = td.eq(1).text();

            // 가져온 값을 배열에 담는다.
            tdArr.push(docNum);
            deleteTr.push(tr);
        });

        $.ajax({
            url: '/invoiceRegistration/deleteDocument',
            type: 'post',
            datatype: "json",
            data: JSON.stringify({ 'docNum': tdArr }),
            contentType: 'application/json; charset=UTF-8',
            success: function (data) {
                var totCnt = $("input[name = base_chk]");
                $("#span_document_base").empty().html('문서 기본정보 - ' + (totCnt.length - deleteTr.length) + '건');
                for (var i in deleteTr) {
                    deleteTr[i].remove();
                }
                alert(data.docData + " 건의 문서가 삭제되었습니다.");
            },
            error: function (err) {
                console.log(err);
            }
        });
    });

    //전달
    $('#sendDocBtn').click(function () {
        if ($('#icrApproval').val() == 'Y') {
            if ($('input[name="base_chk"]:checked').length > 0) {
                if (confirm('반려 하시겠습니까?')) {
                    var docNumArr = [];
                    $('input[name="base_chk"]:checked').each(function (i, e) {
                        if ($('#userId').val() == $(e).closest('tr').children().eq(3).text()) {
                            docNumArr.push($(e).val());
                        }
                    });
                    if (docNumArr.length > 0) {
                        refuseDoc('icrApproval', docNumArr);
                    } else {
                        $('input[name="base_chk"]:checked').each(function (i, e) {
                            $(e).parent().removeClass('ez-checked');
                            $(e).prop('checked', false);
                        });
                        alert('반려 할 문서가 없습니다.(문서 담당자가 아닙니다)');
                    }
                }
            } else {
                alert('반려 할 문서가 없습니다.');
            }
        } else if ($('#scanApproval').val() == 'Y') {
            var isCheckboxYn = false;
            var arr_checkboxYn = document.getElementsByName("base_chk");

            for (var i = 0; i < arr_checkboxYn.length; i++) {
                if (arr_checkboxYn[i].checked == true) {
                    isCheckboxYn = true;
                    break;
                }
            }
            if (isCheckboxYn) {
                layer_open('layer1');
            } else {
                alert("전달할 문서를 선택하세요.");
            }
        }        
        else {
            layer_open('layer1');
        }       
    });

    $('#btn_pop_user_search').click(function () {

        var param = {
            docManagerChk: $('#docManagerChk').is(':checked'),
            icrManagerChk: $('#icrManagerChk').is(':checked'),
            middleManagerChk: $('#middleManagerChk').is(':checked'),
            approvalManagerChk: $('#approvalManagerChk').is(':checked'),
            keyword: $('#searchManger').val().trim(),
            team: $('#select_team').val(),
            part: $('#select_part').val()
        };

        $.ajax({
            url: '/common/selectUserInfo',
            type: 'post',
            datatype: "json",
            data: JSON.stringify({'param': param}),
            contentType: 'application/json; charset=UTF-8',
            success: function (data) {
                if (data.code == 200) {
                    $('#searchManagerResult').empty();
                    console.log(data);
                    var data = data.data;
                    var appendHtml = '';
                    if (data.length > 0) {
                        for (var i = 0; i < data.length; i++) {
                            appendHtml += '<tr>' +
                                '<td><input type="checkbox" name="btn_pop_user_search_base_chk"/></td>' +
                                '<td>' + data[i].USERID + '</td>' +
                                '<td>소속팀</td>' +
                                '<td>소속파트</td>' +
                                '</tr >'; 
                        }

                        $('#searchManagerResult').append(appendHtml);
                        $('#searchManagerResult input[type=checkbox]').ezMark();
                    }
                } else {
                    alert(data.error);
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    })

    //결제담당자 선택시 발생이벤트.
    $("#btn_pop_user_choice").click(function () {
        if ($('#scanApproval').val() == 'Y') {
            //선택된 유저ID 추출(단일 건)
            var userChoiceRowData = new Array();
            var userChoiceTdArr = new Array();
            var popUserCheckbox = $("input[name=btn_pop_user_search_base_chk]:checked");

            //선택된 문서번호 추출(단일 or 다중 건)
            var docNumRowData = new Array();
            var docNumTdArr = new Array();
            var popDocnumCheckbox = $("input[name=base_chk]:checked");
            var deleteTr = [];
            // 체크된 문서번호 값을 가져온다
            popDocnumCheckbox.each(function (i) {
                var popDoctr = popDocnumCheckbox.parent().parent().parent().eq(i);
                var popDoctd = popDoctr.children();

                // 체크된 row의 모든 값을 배열에 담는다.
                docNumRowData.push(popDoctd.text());

                // td.eq(0)은 체크박스 이므로  td.eq(1)의 값부터 가져온다.
                var docNum = popDoctd.eq(1).text();

                // 가져온 값을 배열에 담는다.
                docNumTdArr.push(docNum);
                deleteTr.push(popDoctr);
            });

            // 체크된 담당자를 가져온다
            popUserCheckbox.each(function (i) {
                var popUsertr = popUserCheckbox.parent().parent().parent().eq(i);
                var popUsertd = popUsertr.children();

                userChoiceRowData.push(popUsertr.text());

                var userId = popUsertd.eq(1).text();

                userChoiceTdArr.push(userId);
            });

            if (userChoiceTdArr.length > 1) {
                alert("한명의 담당자만 선택 가능합니다.");
            }
            else {
                if (confirm(userChoiceTdArr[0] + "를 선택하셨습니다. 결제를 진행하시겠습니까?")) {
                    $.ajax({
                        url: '/invoiceRegistration/sendDocument',
                        type: 'post',
                        datatype: "json",
                        data: JSON.stringify({
                            'userId': userChoiceTdArr,
                            'docNum': docNumTdArr
                        }),
                        contentType: 'application/json; charset=UTF-8',
                        success: function (data) {
                            if (confirm(data.docData + "건의 문서가 전달 되었습니다.")) {
                                $('#layer1').fadeOut();
                                var totCnt = $("input[name = base_chk]");
                                $("#span_document_base").empty().html('문서 기본정보 - ' + (totCnt.length - deleteTr.length) + '건');
                                for (var i in deleteTr) {
                                    deleteTr[i].remove();
                                }
                            }
                        },
                        error: function (err) {
                            console.log(err);
                        }
                    });
                }
            }
        } else if ($('#icrApproval').val() == 'Y') {
            //현재 로그인된 계정아이디
            var userId = $('#userId').val();

            //선택된 문서번호 추출(단일 or 다중 건)
            var docInfoRowData = new Array();
            var docInfoTdArr = new Array();
            var popDocInfoCheckbox = $("input[name=base_chk]:checked");
            var deleteTr = [];

            //선택된 유저ID 추출(단일 건)
            var userChoiceRowData = new Array();
            var userChoiceTdArr = new Array();
            var popUserChoiceCheckbox = $("input[name=btn_pop_user_search_base_chk]:checked");

            // 체크된 문서정보를 가져온다
            popDocInfoCheckbox.each(function (i) {
                var popDoctr = popDocInfoCheckbox.parent().parent().parent().eq(i);
                var popDoctd = popDoctr.children();

                // 체크된 row의 모든 값을 배열에 담는다.
                docInfoRowData.push(popDoctd.text());

                // td.eq(0)은 체크박스 이므로  td.eq(1)의  값부터 가져온다.
                var docNum = popDoctd.eq(1).text();

                // 가져온 값을 배열에 담는다.
                docInfoTdArr.push(docNum);
                deleteTr.push(popDoctr);
            });

            // 체크된 담당자를 가져온다
            popUserChoiceCheckbox.each(function (i) {
                var popUsertr = popUserChoiceCheckbox.parent().parent().parent().eq(i);
                var popUsertd = popUsertr.children();

                userChoiceRowData.push(popUsertr.text());

                var userChoiceId = popUsertd.eq(1).text();

                userChoiceTdArr.push(userChoiceId);
            });
            if (userChoiceTdArr.length > 1) {
                alert("한명의 담당자만 선택 가능합니다.");
            }
            else {
                $.ajax({
                    url: '/invoiceRegistration/sendApprovalDocument',
                    type: 'post',
                    datatype: "json",
                    data: JSON.stringify({
                        'userChoiceId': userChoiceTdArr,
                        'docInfo': docInfoTdArr,
                        'userId': userId
                    }),
                    contentType: 'application/json; charset=UTF-8',
                    success: function (data) {
                        if (confirm(data.docData + "건의 문서가 전달 되었습니다.")) {
                            $('#layer1').fadeOut();
                            var totCnt = $("input[name = base_chk]");
                            $("#span_document_base").empty().html('문서 기본정보 - ' + (totCnt.length - deleteTr.length) + '건');
                            for (var i in deleteTr) {
                                deleteTr[i].remove();
                            }
                        }
                    },
                    error: function (err) {
                        console.log(err);
                    }
                });
            }
        }
    });

    //전달/결재상신버튼 클릭 시 발생이벤트.
    $('#sendApprovalBtn').click(function () {
        if ($('#icrApproval').val() == 'Y') {
            var isCheckboxYn = false;
            var arr_checkboxYn = document.getElementsByName("base_chk");

            for (var i = 0; i < arr_checkboxYn.length; i++) {
                if (arr_checkboxYn[i].checked == true) {
                    isCheckboxYn = true;
                    break;
                }
            }
            if (isCheckboxYn) {
                layer_open('layer1');
            } else {
                alert("전달할 문서를 선택하세요.");
            }
        } else {
            alert("결제상신에 대한 권한이 없습니다.");
        }        
    });

    //저장
}

var refuseDoc = function (refuseType, docNumArr) {
    $.ajax({
        url: '/invoiceRegistration/refuseDoc',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'refuseType': refuseType, 'docNumArr': docNumArr }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            if (data.code == 200) {
                $('#docNum').val('');
                $('#documentManager').val('');
                $('#btn_search').click();
            } else {
                alert(data.message);
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
};