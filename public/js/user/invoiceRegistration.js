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
var thumnbImgPerPage = 6; // 한 페이지당 썸네일 이미지 개수
var x, y, textWidth, textHeight; // 문서 글씨 좌표
var mouseX, mouseY, mouseMoveX, mouseMoveY; // 마우스 이동 시작 좌표, 마우스 이동 좌표
var docType = '';

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
        fn_ctnExtraction();
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

            //console.log(`base 사이즈 : ${responseText.fileInfo.length}`);
            //console.log(`dtl 사이즈 : ${responseText.fileDtlInfo.length}`);
            //console.log(`base 내용 : ${JSON.stringify(responseText.fileInfo)}`);
            //console.log(`dtl 내용 : ${JSON.stringify(responseText.fileDtlInfo)}`);

            //totCount = responseText.fileInfo.length; 
            totCount = responseText.fileDtlInfo.length;
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
 * Function
 ****************************************************************************************/
var fn_search = function () {
    var param = {
        docNum: nvl($("#docNum").val()),
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
            console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    appendHtml += `<tr id="tr_base_${entry['SEQNUM']}-${entry['DOCNUM']}-${entry['APPROVALSTATE']}">
                            <td><input type="checkbox" id="base_chk_${entry["DOCNUM"]}" name="base_chk" /></td>
                            <td name="td_base">${entry["DOCNUM"]}</td>
                            <td name="td_base">${nvl2(entry["PAGECNT"], 0)}</td>
                            <td>${nvl(entry["DOCUMENTMANAGER"])}</td>
                            <td>${nvl(entry["FAOTEAM"])}</td>
                            <td>${nvl(entry["FAOPART"])}</td>
                            <td>${nvl(entry["APPROVALREPORTER"])}</td>
                            <td></td>
                            <td></td>
                        </tr>`;
                });
            } else {
                appendHtml += `<tr><td colspan="7">조회된 데이터가 없습니다.</td></tr>`;
            }
            $("#tbody_baseList").empty().append(appendHtml);
            $("#span_document_base").empty().html(`문서 기본정보 - ${data.length}건`);
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
        fn_search_dtl(seqNum, docNum); // document_dtl 조회
    });
    // Document DTL 클릭 시 이미지 조회
    $("td[name='td_dtl']").on("click", function () {
        var id = $(this).parent().attr("id");
        var imgId = id.replace("tr_dtl_", "");
        fn_search_image(imgId); // image 조회
    });
};

var fn_search_dtl = function (seqNum, docNum) {
    //DB 조회후 클릭시 파일 정보 읽어와서 ocr 보냄
    var obj = {};
    obj.imgId = "ICR201810110000001";
    obj.convertedFilePath = "C:/projectWork/koreanre/uploads/";
    obj.filePath = "C:\\projectWork\\koreanre\\uploads\\26.jpg";
    obj.oriFileName = "26.jpg";
    obj.convertFileName = "26.jpg";

    var param = {
        seqNum: seqNum,
        imgId: docNum
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
            addProgressBar(2, 99); // proceed progressbar

            for (var i in data.docData) {

                var obj = {};
                obj.imgId = data.docData[i].IMGID;
                obj.convertedFilePath = "C:/projectWork/koreanre/uploads/";
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
                    appendHtml += `
                        <tr id="tr_dtl_${entry['IMGID']}" name="tr_dtl" style="cursor:pointer">
                            <td><input type="checkbox" id="dtl_chk_${entry["DOCNUM"]}" name="dtl_chk" /></td>
                            <td name="td_dtl">${entry["IMGFILESTARTNO"]}<th>
                            <td name="td_dtl">${entry["IMGFILESTARTNO"]} </th>
                            <td name="td_dtl">${nvl(entry["OGCOMPANYNAME"])}</td>
                            <td name="td_dtl">${nvl(entry["CTNM"])}</td>
                            <td name="td_dtl">${nvl(entry["UY"])}</td>
                            <td name="td_dtl">${nvl(entry["CONTRACTNUM"])}</td>
                            <td name="td_dtl">${nvl(entry["CURCD"])}</td>
                            <td name="td_dtl">${nvl(entry["PAIDPERCENT"])}</td>
                            <td name="td_dtl">${nvl(entry["PAIDSHARE"])}</td>
                            <td name="td_dtl">${nvl(entry["OSLPERCENT"])}</td>
                            <td name="td_dtl">${nvl(entry["OSLSHARE"])}</td>
                            <td name="td_dtl">${nvl(entry["GROSSPM"])}</td>
                            <td name="td_dtl">${nvl(entry["PM"])}</td>
                            <td name="td_dtl">${nvl(entry["PMPFEND"])}</td>
                            <td name="td_dtl">${nvl(entry["PMPFWOS"])}</td>
                            <td name="td_dtl">${nvl(entry["XOLPM"])}</td>
                            <td name="td_dtl">${nvl(entry["RETURNPM"])}</td>
                            <td name="td_dtl">${nvl(entry["GROSSCN"])}</td>
                            <td name="td_dtl">${nvl(entry["CN"])}</td>
                            <td name="td_dtl">${nvl(entry["PROFITCN"])}</td>
                            <td name="td_dtl">${nvl(entry["BROKERAGE"])}</td>
                            <td name="td_dtl">${nvl(entry["TAX"])}</td>
                            <td name="td_dtl">${nvl(entry["OVERRIDINGCOM"])}</td>
                            <td name="td_dtl">${nvl(entry["CHARGE"])}</td>
                            <td name="td_dtl">${nvl(entry["PMRESERVERTD1"])}</td>
                            <td name="td_dtl">${nvl(entry["PFPMRESERVERTD1"])}</td>
                            <td name="td_dtl">${nvl(entry["PMRESERVERTD2"])}</td>
                            <td name="td_dtl">${nvl(entry["PFPMRESERVERTD2"])}</td>
                            <td name="td_dtl">${nvl(entry["CLAIM"])}</td>
                            <td name="td_dtl">${nvl(entry["LOSSRECOVERY"])}</td>
                            <td name="td_dtl">${nvl(entry["CASHLOSS"])}</td>
                            <td name="td_dtl">${nvl(entry["CASHLOSSRD"])}</td>
                            <td name="td_dtl">${nvl(entry["LOSSRR"])}</td>
                            <td name="td_dtl">${nvl(entry["LOSSRR2"])}</td>
                            <td name="td_dtl">${nvl(entry["LOSSPFEND"])}</td>
                            <td name="td_dtl">${nvl(entry["LOSSPFWOA"])}</td>
                            <td name="td_dtl">${nvl(entry["INTEREST"])}</td>
                            <td name="td_dtl">${nvl(entry["TAXON"])}</td>
                            <td name="td_dtl">${nvl(entry["MISCELLANEOUS"])}</td>
                            <td name="td_dtl">${nvl(entry["PMBL"])}</td>
                            <td name="td_dtl">${nvl(entry["CMBL"])}</td>
                            <td name="td_dtl">${nvl(entry["NTBL"])}</td>
                            <td name="td_dtl">${nvl(entry["CSCOSARFRNCNNT2"])}</td>
                        </tr>
                    `;
                });
            } else {
                appendHtml += `<tr><td colspan="7">조회할 데이터가 없습니다.</td></tr>`;
            }
            $("#tbody_dtlList").empty().html(appendHtml);
            $("#span_document_dtl").empty().html(`인식 결과 - ${data.length}건`);
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
                        $("#main_image").prop("src", `../../${nvl(entry.ORIGINFILENAME)}`);
                        $("#main_image").prop("alt", entry.ORIGINFILENAME);
                        imageHtml += `<li class="on">
                                        <div class="box_img"><i><img src="../../${nvl(entry.ORIGINFILENAME)}" title="${nvl(entry.ORIGINFILENAME)}"></i></div>
                                        <span>${nvl(entry.ORIGINFILENAME)}</span>
                                    </li> `;
                    } else {
                        imageHtml += `
                                    <li>
                                        <div class="box_img"><i><img src="../../${nvl(entry.ORIGINFILENAME)}" title="${nvl(entry.ORIGINFILENAME)}"></i></div>
                                        <span>${nvl(entry.ORIGINFILENAME)}</span>
                                    </li> `;
                    }
                });
            } else {
                //appendHtml += `<tr><td colspan="7">조회할 데이터가 없습니다.</td></tr>`;
                imageHtml += `<li>문서 이미지가 존재하지 않습니다.</li>`;
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
        data: JSON.stringify({}),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            //console.log(data);
            if (data.code == 200) {
                var html = "";
                for (var i = 0; i < data.docData.length; i++) {
                    var item = data.docData[i];
                    html += `<tr id="tr_base_${item.SEQNUM}-${item.DOCNUM}-${item.APPROVALSTATE}">
                                <td><input type="checkbox" id="base_chk_${item.DOCNUM}" name="base_chk" /></td>
                                <td name="td_base">${item.DOCNUM}</td>
                                <td name="td_base">${item.PAGECNT}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>`;
                }
                $("#tbody_baseList").empty().append(html);
                $("#div_base").css("display", "block");
                fn_clickEvent();
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
        `<td><input type="checkbox" value="${dataObj["imgId"]}" name="dtl_chk" /></td>` +
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
    $("#div_dtl").css("display", "block");
    function makeMLSelect(mlData, colnum, entry) {

        var appendMLSelect = '<select onchange="zoomImg(this, \'' + fileDtlInfo.convertFileName + '\')">';
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
                            `<td><input type="checkbox" value="${dataObj["imgId"]}" name="dtl_chk" /></td>` +
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
};

// 초기 썸네일 이미지 렌더링
var thumnImg = function () {
    console.log("thumbImgs : " + thumbImgs);
    for (var i in thumbImgs) {
        if ($('#ul_image > li').length < thumnbImgPerPage) {
            //var imageTag = '<li><a href="#none" class="imgtmb thumb-img" style="background-image:url(../../uploads/' + thumbImgs[i] + '); width: 48px;"></a></li>';
            var imageTag = `<li><a href="#none" class="imgtmb thumb-img"><img src="../../uploads/${thumbImgs[i]}" style="width: 48px; background-color:white" /></a></li>`;
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
        $('#imageBox > li').removeClass('on');
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
    var location = $(e).val().split(',');
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

    //전달
    $('#sendDocBtn').click(function () {
        layer_open('layer1');   
    });

    $('#btn_pop_user_search').click(function () {

        var param = {
            docManagerChk: $('#docManagerChk').is(':checked'),
            icrManagerChk: $('#icrManagerChk').is(':checked'),
            approvalManagerChk: $('#approvalManagerChk').is(':checked'),
            keyword: $('#searchManger').val().trim(),
            team: $('#select_team').val(),
            part: $('#select_part').val()
        };

        $.ajax({
            url: '/common/selectUserInfo',
            type: 'post',
            datatype: "json",
            data: JSON.stringify({param}),
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
                                '<td><input type="checkbox"/></td>' +
                                '<td>' + data[i].USERID + '</td>' +
                                '<td>소속팀</td>' +
                                '<td>소속파트</td>' +
                                '</tr >'; 
                        }

                        $('#searchManagerResult').append(appendHtml);
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

    //저장
}