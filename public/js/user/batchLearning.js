"use strict";

var totCount = 0; // 총 이미지 분석 개수
var ocrCount = 0; // ocr 수행 횟수
var grid;

var addCond = "";
var startNum = 1;
var moreNum = 20;


$(function () {
    _init();
    //multiUploadEvent();
    //originFileUploadBtnEvent();
    imageUploadEvent();
    screenEvent();
})

// Step0
function _init() {
    $('#uploadFile').css('display', 'none');
    $("#uploadDiv").hide();
    $('#gridDiv').hide();
    $('#reviewDiv').hide();

    // [checkbox event]
    $("#listCheckAll").click(function () {
        if ($("#listCheckAll").prop("checked")) $("input[name=listCheck]").prop("checked", true);
        else $("input[name=listCheck]").prop("checked", false);
    });

    // [Button event]
    // 10개 더보기, 100개 더보기, 1000개 더보기
    $("input[name='more_button']").on("click", function () {
        startNum = startNum + moreNum;
        switch ($(this).attr("id")) {
            case "more10":
                moreNum = 10;
                break;
            case "more100":
                moreNum = 100;
                break;
            case "more1000":
                moreNum = 1000;
                break;
            default:
                break;
        }
        searchBatchLearnDataList("");
    });
    // 전체, 학습미완료, 학습완료
    $("input[name='show_button']").on("click", function () {
        switch ($(this).attr("id")) {
            case "show_all":
                addCond = "";
                break;
            case "show_unfinish":
                addCond = "SHOW_UNFINISH"; // 학습 미완료
                break;
            case "show_finish":
                addCond = "SHOW_FINISH"; // 학습 완료
                break;
            default:
                break;
        }
        $("#tbody_batchList").empty(); // 리스트 제거
        startNum = 1;
        moreNum = 20;
        searchBatchLearnDataList(addCond);
    });
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
    // list (1, 20)
    searchBatchLearnDataList("");
}

// 배치학습데이터 조회
var searchBatchLearnDataList = function (addCond) {
    var param = {
        'startNum' : startNum,
        'moreNum' : moreNum,
        'addCond' : nvl(addCond)
    };
    var appendHtml = "";
    $.ajax({
        url: '/batchLearning/searchBatchLearnDataList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            startProgressBar(); // start progressbar
            addProgressBar(1, 1); // proceed progressbar
        },
        success: function (data) {
            addProgressBar(2, 100); // proceed progressbar
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    appendHtml += `<tr>`;
                    appendHtml += `<td><input type="checkbox" name="listCheck" value="${entry.IMG_ID}"/></td>`;
                    appendHtml += `<td>${entry.IMG_ID}</td>`;
                    appendHtml += `<td>${entry.IMG_FILE_ST_NO}</td>`;
                    appendHtml += `<td>${entry.IMG_FILE_END_NO}</td>`;
                    appendHtml += `<td>${entry.CSCO_NM}</td>`;
                    appendHtml += `<td>${entry.CT_NM}</td>`;
                    appendHtml += `<td>${entry.INS_ST_DT}</td>`;
                    appendHtml += `<td>${entry.INS_END_DT}</td>`;
                    appendHtml += `<td>${entry.CUR_CD}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.PRE)}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.COM)}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.BRKG)}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.TXAM)}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.PRRS_CF)}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.PRRS_RLS)}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.LSRES_CF)}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.LSRES_RLS)}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.CLA)}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.EXEX)}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.SVF)}</td>`;
                    appendHtml += `<td>${NumberWithComma(entry.CAS)}</td>`;
                    appendHtml += `<td>${entry.NTBL}</td>`;
                    appendHtml += `<td>${entry.CSCO_SA_RFRN_CNNT2}</td>`;
                    appendHtml += `</tr>`;
                });
            } else {
                appendHtml += '<tr><td colspan="23">조회할 데이터가 없습니다.</td></tr>';
            }
            endProgressBar(); // end progressbar
            $(appendHtml).appendTo($("#tbody_batchList")).slideDown('slow');
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
    $('input[name="listCheck"]').each(function (index, element) {
        if ($(this).is(":checked")) chkSize++;
    });
    alert("체크된 갯수는 : " + chkSize);
};
// 학습실행
var fn_proceedLearn = function () {

};
// 수동학습
var fn_manualLearn = function () {
    //var top = ($(window).scrollTop() + ($(window).height() - $('#layerPopup').height()) / 2);
    var top = ($(window).scrollTop() + ($(window).height() - $('#layerPopup').height()) - 10);
    var left = ($(window).scrollLeft() + ($(window).width() - $('#layerPopup').width()) / 2);
    $("#layerPopup").css("top", top);
    $("#layerPopup").css("left", left);
    $("#layerPopup").show();
};
// 최종학습
var fn_lastLearn = function () {

};

// [upload event]
var imageUploadEvent = function () {
    $('#imageFile').on("change", function () {
        $("#multiUploadForm").attr("action", "/batchLearning/imageUpload");
        if ($(this).val() !== '') {
            $('#multiUploadForm').submit();
        }
    });

    $("#btn_imageUpload").on("click", function () {
        $("#imageFile").click();
    });

    $('#multiUploadForm').ajaxForm({
        beforeSubmit: function (data, frm, opt) {
            startProgressBar(); // start progressbar
            $("#progressMsg").html("ready upload image...");
            addProgressBar(1, 5); // proceed progressbar
            return true;
        },
        success: function (responseText, statusText) {
            var fileNames = "";
            $("#progressMsg").html("start upload image...");
            addProgressBar(6, 100); // proceed progressbar
            totCount = responseText.message.length;
            for (var i = 0; i < responseText.message.length; i++) {
                //processImage(responseText.message[i]);
                fileNames += responseText.message[i] + ", ";
            }
            alert(responseText.message.length + "개의 이미지를 업로드함, " + fileNames + "\nTODO : 업로드된 이미지들의 정보는 DB에 저장");
            searchBatchLearnDataList("");
            endProgressBar(); // end progressbar
        },
        error: function (e) {
            endProgressBar(); // end progressbar
            console.log(e);
        }
    });
}

// [screen event]
var screenEvent = function () {
    //var top_layerPopup = parseInt($("#layerPopup").css('top'));
    var top_layerPopup = ($(window).scrollTop() + ($(window).height() - $('#layerPopup').height()) - 10);
    
    $(window).scroll(function () {
        var scrollTop = $(window).scrollTop();
        var newPosition = scrollTop + top_layerPopup + "px";
		// 애니메이션 없이 바로 따라감
        $("#layerPopup").css('top', newPosition);
        // 따라다니는 애니메이션 효과
        //$("#layerPopup").stop().animate({
        //    "top": newPosition
        //}, 10);
    }).scroll();

    // 레이어 팝업 닫기
    $("#btn_closeLayerPopup").on("click", function () {
        $("#layerPopup").fadeOut();
    });
    
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
            startProgressBar(); // 프로그레스바 시작
            addProgressBar(1, 5); // 프로그레스바 진행
            return true;
        },
        success: function (responseText, statusText) {
            $("#progressMsg").html("이미지를 분석 중 입니다.");
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

// Step3 : 배치 학습 Data 처리
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
            $("#progressMsg").html("데이터를 전송합니다.");
            addProgressBar(31, 60); // 프로그레스바 진행
        },
        success: function (data) {
            console.log("success execBatchLearningData : " + data);
            $("#progressMsg").html("결과를 분석하고 출력합니다.");
            addProgressBar(61, 100); // 프로그레스바 진행
            appendGridData(data);
            setTimeout(function () { endProgressBar(); }, 2000); // 프로그레스바 종료
        },
        error: function (err) {
            endProgressBar();
            console.log(err);
        }
    });
}

// Step4 : 그리드에 표시
function appendGridData(data) {
    var gridData = [];
    $('#uploadDiv').hide();
    $('#gridDiv').show();

    if (ocrCount === 1) generateGrid(gridData);

    var temp1 = data.split("^");
    for (var i = 0, x = temp1.length; i < x; i++) {
        var temp2 = temp1[i].split("||");
        gridData.push({
            _value: temp2[0],
            _label: temp2[1]
        });
    }
    grid.appendRow(gridData);

    if (totCount == ocrCount) { // 모든 OCR 분석 완료되면
        $('#stepUl > li').eq(0).removeAttr('title');
        $('.step_wrap').removeClass('s1');
        $('#stepUl > li').eq(1).attr('title', '현재단계');
        $('.step_wrap').addClass('s2');
        $("#content").css("margin-left", 0);
    }
}

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


