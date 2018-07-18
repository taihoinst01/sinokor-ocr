﻿//import { identifier } from "babel-types";

"use strict";

var totCount = 0; // 총 이미지 분석 개수
var ocrCount = 0; // ocr 수행 횟수
var grid;

var addCond = "LEARN_N"; // LEARN_N:학습미완료, LEARN_Y:학습완료, default:학습미완료
var startNum = 1;
var moreNum = 20;

$(function () {
    //$("select[name=select_view_count]").on("change", function () {
    //    alert(1);
    //    //$(this).attr("title", `행표시 : ` + $(this).val());
    //    searchBatchLearnDataList(addCond);
    //});
    idealformsEvent();
    _init();
});

// [Select Event]
var selectViewCount = function (value) {
    $("#select_view_count").val(value);
    searchBatchLearnDataList(addCond);
}

var idealformsEvent = function () {
    $("#select_view_count").on("change", function () {
        alert(1);
    });

    //$("#select_view_count").change(function () {
    //    alert(1);
    //});
}

// [Checkbox Event]
var checkboxEvent = function () {
    // all checkbox
    $("#listCheckAll_before").on("click", function () {
        if ($("#listCheckAll_before").prop("checked")) $("input[name=listCheck_before]").prop("checked", true);
        else $("input[name=listCheck_before]").prop("checked", false);
    });
    $("#listCheckAll_after").on("click", function () {
        if ($("#listCheckAll_after").prop("checked")) $("input[name=listCheck_after]").prop("checked", true);
        else $("input[name=listCheck_after]").prop("checked", false);
    });

    // checkbox change
    $("input[name=listCheck_before], #listCheckAll_before").on("change", function () {
        let chkCnt = 0;
        $("input[name=listCheck_before]").each(function (index, entry) {
            if ($(this).is(":checked")) chkCnt++;
        });
        $("#choose_cnt_before").html(chkCnt);
    });
    $("input:checkbox[name=listCheck_after], #listCheckAll_after").on("change", function () {
        let chkCnt = 0;
        $("input[name=listCheck_after]").each(function (index, entry) {
            if ($(this).is(":checked")) chkCnt++;
        });
        $("#choose_cnt_after").html(chkCnt);
    });
}

// [Button Event]
var buttonEvent = function () {

    // 학습미완료 보기
    $("#tab_before").on("click", function () {
        $("#listCheckAll_after").prop("checked", false);
        addCond = "LEARN_N";
        searchBatchLearnDataList(addCond);
    });
    // 학습완료 보기
    $("#tab_after").on("click", function () {
        $("#listCheckAll_before").prop("checked", false);        
        addCond = "LEARN_Y";
        searchBatchLearnDataList(addCond);
    });

    // 전체, 학습미완료, 학습완료
    //$("input[name='show_button']").on("click", function () {
    //    switch ($(this).attr("id")) {
    //        case "show_all":
    //            addCond = "";
    //            break;
    //        case "show_unfinish":
    //            addCond = "LEARN_N"; // 학습 미완료
    //            break;
    //        case "show_finish":
    //            addCond = "LEARN_Y"; // 학습 완료
    //            break;
    //        default:
    //            break;
    //    }
    //    $("#tbody_batchList").empty(); // 리스트 제거
    //    startNum = 1;
    //    moreNum = 20;
    //    searchBatchLearnDataList(addCond);
    //});

    // 정답엑셀 업로드
    $("#btn_rightExcelUpload").on("click", function () {
        fn_rightExcelUpload();
    });

    // 이미지 업로드
    $("#btn_imageUpload").on("click", function () {
        fn_imageUpload();
    });

    // 이미지 삭제
    $("#btn_imageDelete").on("click", function () {
        fn_imageDelete();
    });

    // 학습실행
    $("#btn_proceedLearn").on("click", function () {
        fn_proceedLearn();
    });

    // 수동학습
    $("#btn_manualLearn").on("click", function () {
        fn_manualLearn();
    });

    // 최종학습
    $("#btn_lastLearn").on("click", function () {
        fn_lastLearn();
    });

    // popupButton
    $("#btn_closeLayerPopup").on("click", function () {
        popupEvent.closePopup();
    });
}

// [popup event]
var popupEvent = (function () {
    var layerPopup = $("#layerPopup");

    var scrollPopup = function () {
        //var top_layerPopup = parseInt($("#layerPopup").css('top'));
        var top_layerPopup = ($(window).scrollTop() + ($(window).height() - layerPopup.height()) - 10);

        // Scroll event
        $(window).scroll(function () {
            var scrollTop = $(window).scrollTop();
            var newPosition = scrollTop + top_layerPopup + "px";
            $("#layerPopup").css('top', newPosition);   // without animation
            //$("#layerPopup").stop().animate({         // with follow animation
            //    "top": newPosition
            //}, 10);
        }).scroll();
    }

    // open popup
    var openPopup = function () {
        var top = ($(window).scrollTop() + ($(window).height() - layerPopup.height()) - 10);
        var left = ($(window).scrollLeft() + ($(window).width() - layerPopup.width()) / 2);
        layerPopup.css("top", top);
        layerPopup.css("left", left);
        layerPopup.show();
    }

    // close popup
    var closePopup = function () {
        layerPopup.fadeOut();
    }

    return {
        scrollPopup: scrollPopup,
        openPopup: openPopup,
        closePopup: closePopup
    };
}());

// [imageUpload event]
var imageUploadEvent = function () {
    var multiUploadForm = $("#multiUploadForm");

    $('#document_file').on("change", function () {
        multiUploadForm.attr("action", "/batchLearning/imageUpload");
        if ($(this).val() !== '') {
            multiUploadForm.submit();
        }
    });
    // STEP 1 : FILE UPLOAD
    var uploadPromise = new Promise(function (resolve, reject) {
        multiUploadForm.ajaxForm({
            beforeSubmit: function (data, frm, opt) {
                $("#progressMsg").html("uploading image files...");
                startProgressBar();
                addProgressBar(1, 5);
                return true;
            },
            success: function getData(responseText, statusText) {
                //$("#progressMsg").html("progress image files...");
                //addProgressBar(6, 50);
                console.log("upload image data : " + JSON.stringify(responseText));
                console.log("file info : " + JSON.stringify(responseText.fileInfo));
                totCount = responseText.message.length;
                console.log("count : " + totCount);
                console.log("uploadPromise : process Image 이전");
                for (var i = 0; i < totCount; i++) {
                    insertFileInfo(responseText.fileInfo[i]);
                    processImage(responseText.message[i]);
                }
                console.log("uploadPromise : process Image 이후");
                resolve(responseText, statusText);
            },
            error: function (e) {
                reject(e);
            }
        });
    });
    uploadPromise.then(function (responseText, statusText) {

        $("#progressMsg").html("upload process data...");
        console.log("uploadPromise : then 이전");
        addProgressBar(5, 40);
        //endProgressBar();
        console.log("uploadPromise : then 이후");
    });
    uploadPromise.then().catch(function (e) {
        //endProgressBar();
        console.log(e);
    });
}

// STEP 2 : FILE INFO DB INSERT
function insertFileInfo(fileInfo) {
    if (fileInfo) {
        var param = { fileInfo: fileInfo };
        $.ajax({
            url: '/batchLearning/insertFileInfo',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            success: function (data) {
                console.log("fileInfo DB INSERT SUCCESS : " + data);
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
}
                
// STEP 3 : FILE -> OCR API
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
        console.log("processImage : done ");
        ocrCount++;
        addProgressBar(41, 70);
        //appendOcrData(data.regions);
        execBatchLearningData(data.regions);
    }).fail(function (jqXHR, textStatus, errorThrown) {
        var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
            jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
        alert(errorString);
        endProgressBar(); // 에러 발생 시 프로그레스바 종료
    });
};

// STEP 4 : OCR API -> CLASSIFICATION -> LABEL MAPPING
function execBatchLearningData(regions) {
    var lineText = [];
    var paramText = "";
    for (var i = 0, x = regions.length; i < x; i++) {
        for (var j = 0; j < regions[i].lines.length; j++) {
            var item = '';
            for (var k = 0; k < regions[i].lines[j].words.length; k++) {
                item += regions[i].lines[j].words[k].text + ' ';
            }
            lineText.push({ 'location': regions[i].lines[j].boundingBox, 'text': item.trim() });
        }
    }
    for (var i = 0, x = lineText.length; i < x; i++) {
        paramText += '"' + lineText[i].text + '" ';
    }
    var param = {
        "param": paramText
    }
    $.ajax({
        url: '/batchLearning/execBatchLearningData',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
        },
        success: function (data) {
            appendGridData(data);
            addProgressBar(71, 99);
            setTimeout(function () {
                console.log("리스트 출력....");
                alert("Finish batch Learning data");
                searchBatchLearnDataList(addCond);
            }, 2000); // 프로그레스바 종료
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// STEP 5 : FILE PARSING RESULT DB INSERT
function appendGridData(data) {
    console.log("결과 appendGridData : " + JSON.stringify(data));
    //var gridData = [];
    //$('#uploadDiv').hide();
    //$('#gridDiv').show();

    //if (ocrCount === 1) generateGrid(gridData);

    //var temp1 = data.split("^");
    //for (var i = 0, x = temp1.length; i < x; i++) {
    //    var temp2 = temp1[i].split("||");
    //    gridData.push({
    //        _value: temp2[0],
    //        _label: temp2[1]
    //    });
    //}
    //grid.appendRow(gridData);

    //if (totCount == ocrCount) { // 모든 OCR 분석 완료되면
    //    $('#stepUl > li').eq(0).removeAttr('title');
    //    $('.step_wrap').removeClass('s1');
    //    $('#stepUl > li').eq(1).attr('title', '현재단계');
    //    $('.step_wrap').addClass('s2');
    //    $("#content").css("margin-left", 0);
    //}
}

// [Function]
// 배치학습데이터 조회
var searchBatchLearnDataList = function (addCond) {
    var param = {
        'startNum' : startNum,
        'moreNum': nvl2($("#select_view_count").val(), 20),
        'addCond' : nvl(addCond)
    };
    
    var appendHtml = "";
    var checkboxHtml = "";
    $.ajax({
        url: '/batchLearning/searchBatchLearnDataList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsg").html("retrieving learn data...");
            startProgressBar(); // start progressbar
            addProgressBar(1, 1); // proceed progressbar
        },
        success: function (data) {
            if (addCond == "LEARN_N") $("#total_cnt_before").html(data.length);
            else $("#total_cnt_after").html(data.length);
            addProgressBar(2, 100); // proceed progressbar
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    // allow after or before checkbox name
                    if (addCond == "LEARN_N") checkboxHtml = `<th scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="${entry.IMG_ID}" class="stb00" name="listCheck_before" /></div></th>`;
                    else checkboxHtml = `<th scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="${entry.IMG_ID}" class="stb00" name="listCheck_after" /></div></th>`;

                    appendHtml += `<tr>` + checkboxHtml + 
                        `<td>${entry.IMG_ID}</td>
                        <td>${entry.IMG_FILE_ST_NO}</td>
                        <td>${entry.IMG_FILE_END_NO}</td>
                        <td>${entry.CSCO_NM}</td>
                        <td>${entry.CT_NM}</td>
                        <td>${entry.INS_ST_DT}</td>
                        <td>${entry.INS_END_DT}</td>
                        <td>${entry.CUR_CD}</td>
                        <td>${NumberWithComma(entry.PRE)}</td>
                        <td>${NumberWithComma(entry.COM)}</td>
                        <td>${NumberWithComma(entry.BRKG)}</td>
                        <td>${NumberWithComma(entry.TXAM)}</td>
                        <td>${NumberWithComma(entry.PRRS_CF)}</td>
                        <td>${NumberWithComma(entry.PRRS_RLS)}</td>
                        <td>${NumberWithComma(entry.LSRES_CF)}</td>
                        <td>${NumberWithComma(entry.LSRES_RLS)}</td>
                        <td>${NumberWithComma(entry.CLA)}</td>
                        <td>${NumberWithComma(entry.EXEX)}</td>
                        <td>${NumberWithComma(entry.SVF)}</td>
                        <td>${NumberWithComma(entry.CAS)}</td>
                        <td>${entry.NTBL}</td>
                        <td>${entry.CSCO_SA_RFRN_CNNT2}</td>
                    </tr>`;
                });
            } else {
                appendHtml += `<tr><td colspan="23">조회할 데이터가 없습니다.</td></tr>`;
            }
            //$(appendHtml).appendTo($("#tbody_batchList")).slideDown('slow');
            if (addCond == "LEARN_N") $("#tbody_batchList_before").empty().append(appendHtml);
            else $("#tbody_batchList_after").empty().append(appendHtml);
            console.log("리스트 출력 종료 ");
            endProgressBar(); // end progressbar
            checkboxEvent(); // refresh checkbox event
        },
        error: function (err) {
            endProgressBar(); // end progressbar
            console.log(err);
        }
    });
};

// 정답엑셀 업로드
var fn_rightExcelUpload = function() {

};

// 이미지 업로드
var fn_imageUpload = function () {
    
};

// 이미지 삭제
var fn_imageDelete = function () {
    var chkSize = 0;
    if (addCond == "LEARN_N") {
        $('input[name="listCheck_before"]').each(function (index, element) {
            if ($(this).is(":checked")) chkSize++;
        });
    } else {
        $('input[name="listCheck_after"]').each(function (index, element) {
            if ($(this).is(":checked")) chkSize++;
        });
    }
    alert("체크된 갯수는 : " + chkSize);
};

// 학습실행
var fn_proceedLearn = function () {
    alert("학습 실행");
};

// 수동학습
var fn_manualLearn = function () {
    //var top = ($(window).scrollTop() + ($(window).height() - $('#layerPopup').height()) / 2);
    popupEvent.openPopup();
};

// 최종학습
var fn_lastLearn = function () {

};

// init
function _init() {
    $('#uploadFile').css('display', 'none');
    $("#uploadDiv").hide();
    $('#gridDiv').hide();
    $('#reviewDiv').hide();

    //multiUploadEvent();
    //originFileUploadBtnEvent();
    checkboxEvent();            // checkbox event
    buttonEvent();              // button event
    popupEvent.scrollPopup();   // popup event - scroll
    imageUploadEvent();         // image upload event

    searchBatchLearnDataList(addCond);   // 배치 학습 데이터 조회
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 이하는 legacy source1
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Step0 : 초기 작업
function init() {
    $('#uploadFile').css('display', 'none');
    $('#gridDiv').hide();
    $('#reviewDiv').hide();
}

// Step1 : 다중 파일 업로드 이벤트
function multiUploadEvent() {
    $('#uploadFile').change(function () {
        if ($(this).val() !== '') {
            ocrCount = 0;
            grid = '';
            $('#grid').html('');
            $('#multiUploadForm').submit();
        }
    });

    $('#multiUploadBtn').click(function () {
        $('#uploadFile').click();
    });

    $('#multiUploadForm').ajaxForm({
        beforeSubmit: function (data, frm, opt) {
            $("#progressMsg").html("이미지를 분석 중 입니다.");
            startProgressBar(); // 프로그레스바 시작
            addProgressBar(1, 5); // 프로그레스바 진행
            return true;
        },
        success: function (responseText, statusText) {
            addProgressBar(6, 30); // 프로그레스바 진행
            totCount = responseText.message.length;
            for (var i = 0; i < responseText.message.length; i++) {
                processImage(responseText.message[i]);
            }
        },
        error: function (e) {
            endProgressBar(); // 에러 발생 시 프로그레스바 종료
            console.log(e);
        }
    });
}

// Step2 :  OCR API


// Step3 : 배치 학습 Data 처리


// Step4 : 그리드에 표시


// 그리드 생성
function generateGrid(gridData) {
    grid = new tui.Grid({
        el: $('#grid'),
        data: gridData,
        virtualScrolling: true,
        bodyHeight: 300,
        columns: [
            { title: 'Label', name: '_label', width: 100, editOptions: { type: 'text', useViewMode: true } },
            { title: 'Value', name: '_value', width: 100, editOptions: { type: 'text', useViewMode: true } }
            //{   title: 'No', name: 'no', width: 50, editOptions: { type: 'text', useViewMode: true },
            //    //onAfterChange: function (ev) {
            //    //    if (!isNaN(parseInt(ev.value))) ev.instance.setValue(ev.rowKey, ev.columnName, parseInt(ev.value));
            //    //    else ev.instance.setValue(ev.rowKey, ev.columnName, 0);
            //    //    return ev;
            //    //}
            //},
            //{ title: '파일명', name: 'fileNm', width: 100, editOptions: { type: 'text', useViewMode: true } },
            //{ title: '일자', name: 'insStDt', width: 100, editOptions: { type: 'text', useViewMode: true } },
            //{ title: '회사명', name: 'cscoNm', width: 100, editOptions: { type: 'text', useViewMode: true } },
            //{ title: '계약명', name: 'ctNm', width: 100, editOptions: { type: 'text', useViewMode: true } },
            //{ title: '이메일', name: 'email', width: 100, editOptions: { type: 'text', useViewMode: true } },
            //{ title: '금액1', name: 'pre', width: 100, editOptions: { type: 'text', useViewMode: true } },
            //{ title: '금액2', name: 'com', width: 100, editOptions: { type: 'text', useViewMode: true } },
            //{ title: '금액3', name: 'brkg', width: 100, editOptions: { type: 'text', useViewMode: true } },
            //{ title: '총합계', name: 'total', width: 150, editOptions: { type: 'text', useViewMode: true } },
            //{ title: '일치여부', name: 'equalYn', width: 50, editOptions: { type: 'text', useViewMode: true } },
            //{ title: '학습여부', name: 'learnYn', width: 50, editOptions: { type: 'text', useViewMode: true } }
        ]
    });
    tui.Grid.applyTheme('striped', {
        cell: {
            head: { background: '#fff' },
            evenRow: { background: '#fff' }
        }
    });
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 이하는 legacy source2
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 
// OCR 데이터 렌더링
function appendOcrData(regions) {
    var lineText = [];
    var gridData = [];

    $('#uploadDiv').hide();
    $('#gridDiv').show();

    if (ocrCount === 1) {
        grid = new tui.Grid({
            el: $('#grid'),
            data: gridData,
            virtualScrolling: true,
            bodyHeight: 300,
            columns: [
                {
                    title: 'X 좌표',
                    name: 'x',
                    editOptions: {
                        type: 'text',
                        useViewMode: true
                    },
                    onAfterChange: function (ev) {
                        if (!isNaN(parseInt(ev.value))) {
                            ev.instance.setValue(ev.rowKey, ev.columnName, parseInt(ev.value));
                        } else {
                            ev.instance.setValue(ev.rowKey, ev.columnName, 0);
                        }
                        return ev;
                    },
                    width: 200
                },
                {
                    title: 'Y 좌표',
                    name: 'y',
                    editOptions: {
                        type: 'text',
                        useViewMode: true
                    },
                    onAfterChange: function (ev) {
                        if (!isNaN(parseInt(ev.value))) {
                            ev.instance.setValue(ev.rowKey, ev.columnName, parseInt(ev.value));
                        } else {
                            ev.instance.setValue(ev.rowKey, ev.columnName, 0);
                        }
                        return ev;
                    },
                    width: 200
                },
                {
                    title: '텍스트',
                    name: 'text',
                    editOptions: {
                        type: 'text',
                        useViewMode: true
                    },
                    width: 600
                }
            ]
        });
        tui.Grid.applyTheme('striped', {
            cell: {
                head: {
                    background: '#fff'
                },
                evenRow: {
                    background: '#fff'
                }
            }
        });
    }

    for (var i = 0; i < regions.length; i++) {
        for (var j = 0; j < regions[i].lines.length; j++) {
            var item = '';
            for (var k = 0; k < regions[i].lines[j].words.length; k++) {
                item += regions[i].lines[j].words[k].text + ' ';
            }
            lineText.push({ 'location': regions[i].lines[j].boundingBox, 'text': item.trim() });
        }
    }

    for (var i = 0; i < lineText.length; i++) {
        gridData.push({
            x: lineText[i].location.split(',')[0],
            y: lineText[i].location.split(',')[1],
            text: lineText[i].text
        });
    }
    ////insertRegion(lineText);
    grid.appendRow(gridData);

    if (totCount == ocrCount) { // 모든 OCR 분석 완료되면
        $('#stepUl > li').eq(0).removeAttr('title');
        $('.step_wrap').removeClass('s1');
        $('#stepUl > li').eq(1).attr('title', '현재단계');
        $('.step_wrap').addClass('s2');

        console.log("lineText : " + JSON.stringify(lineText));
        var resultText = "";
        for (var i = 0, x = lineText.length; i < x; i++) {
            resultText += '"' + lineText[i].text + '" ';
            //resultText += lineText[i].text + '\n';
        }
    }
    execBatchLearningData(resultText);
}

// 원본 파일 업로드 클릭 이벤트
function originFileUploadBtnEvent() {
    $('#originFileUploadBtn').click(function () {
        $('#gridDiv').hide();
        $('#reviewDiv').show();
        $('#stepUl > li').eq(1).removeAttr('title');
        $('.step_wrap').removeClass('s2');
        $('#stepUl > li').eq(2).attr('title', '현재단계');
        $('.step_wrap').addClass('s3');
    });
}

// 배치 학습 DB insert
function insertRegion(lineText) {
    if (lineText) {
        var param = {
            batchLearningData: lineText
        }
        $.ajax({
            url: '/batchLearning/insertBatchLearningData',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            success: function (data) {
                console.log("성공 : " + data);
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
}


