﻿//import { identifier } from "babel-types";

"use strict";

var totCount = 0; // 총 이미지 분석 개수
var ocrCount = 0; // ocr 수행 횟수
var grid;

var ocrDataArr = []; //ocr 학습한 데이터 배열

var addCond = "LEARN_N"; // LEARN_N:학습미완료, LEARN_Y:학습완료, default:학습미완료
var startNum = 0;
var moreNum = 20;

$(function () {
    _init();
    //viewServerFileTest();
});

// [Select Event]
var selectViewCount = function (value) {
    $("#select_view_count").val(value);
    searchBatchLearnDataList(addCond);
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
        //viewServerFileTest();
        searchBatchLearnDataList(addCond);
    });
    // 학습완료 보기
    $("#tab_after").on("click", function () {
        $("#listCheckAll_before").prop("checked", false);        
        addCond = "LEARN_Y";
        searchBatchLearnDataList(addCond);
    });

    // Sync (서버 File Syncronized)
    $("#btn_sync").on("click", function () {
        fn_syncServerFile();
    });
    // 엑셀 업로드 (read file in server)
    $("#btn_excelUpload").on("click", function () {
        fn_excelUpload();
    });
    // 이미지 업로드
    $("#btn_imageUpload").on("click", function () {
        fn_imageUpload();
    });
    // 이미지 삭제
    $("#btn_imageDelete").on("click", function () {
        fn_imageDelete();
    });
    // 배치실행
    $("#btn_batchTraining").on("click", function () {
        fn_batchTraining();
    });
    // 최종학습
    $("#btn_uiTraining").on("click", function () {
        fn_uiTraining();
    });

    // popupButton
    // [배치학습popup] 학습실행
    $("#btn_pop_batch_run").on("click", function () {
        fn_popBatchRun();
    });
    // [배치학습popup] close popup
    $("#btn_pop_batch_close").on("click", function () {
        popupEvent.closePopup();
    });
    $(".poplayer .bg").on("click", function () {
        popupEvent.closePopup();
    });

    // [UI학습팝업] 저장
    $("#btn_pop_ui_run").on("click", function () {
        fn_updateUiTraining();
    });
    // [UI학습팝업] close popup
    $("#btn_pop_ui_close").on("click", function () {
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
        layer_open('layer1');
    }

    // close popup
    var closePopup = function () {
        $('.poplayer').fadeOut();
    }

    return {
        scrollPopup: scrollPopup,
        openPopup: openPopup,
        closePopup: closePopup
    };
}());

// [excelUpload event]
var fn_excelUpload = function () {
    var param = {};
    $.ajax({
        url: '/batchLearning/excelUpload',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            addProgressBar(1, 99);
        },
        success: function (data) {
            console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));
            if (data["code"] == "200") {
                if (data["fileCnt"] > 0 || data["dataCnt"] > 0) {
                    alert("엑셀 파일의 정답 데이터가 INSERT 되었습니다.")
                } else {
                    alert("INSERT 할 파일이 없습니다.");
                }
            } else {
                alert("엑셀 파일 업로드 중 오류가 발생하였습니다.");
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}
// excel upload (deprecate)
var excelUploadEvent = function () {
    var multiUploadForm = $("#multiUploadForm");

    $('#excel_file').on("change", function () {
        startProgressBar();
        addProgressBar(1, 5);
        multiUploadForm.attr("action", "/batchLearning/excelUpload");
        if ($(this).val() !== '') {
            multiUploadForm.submit();
        }
    });

    // FILE UPLOAD
    fileUpload();
}

function fileUpload() {
    var multiUploadForm = $("#multiUploadForm");

    multiUploadForm.ajaxForm({
        beforeSubmit: function (data, frm, opt) {
            $("#progressMsg").html("Preparing to upload files...");
            startProgressBar();
            addProgressBar(6, 99);
            return true;
        },
        success: function getData(responseText, statusText) {
            if (responseText.type == 'excel') {
                console.log("upload excel data : " + JSON.stringify(responseText));
                $("#progressMsg").html("uploading excel files...");
                endProgressBar();
            } else if (responseText.type == 'image') {
                console.log("upload image data : " + JSON.stringify(responseText));
                $("#progressMsg").html("uploading image files...");
                // FILE INFO, BATCH LEARNING BASE DATA INSERT TO DB
                var totCount = responseText.message.length;
                for (var i = 0; i < totCount; i++) {
                    var lastYN = false;
                    var fileInfo = responseText.fileInfo[i];
                    var fileName = responseText.message[i];
                    console.log("fileInfo : " + JSON.stringify(fileInfo));
                    console.log("fileName : " + JSON.stringify(fileName));
                    if (i == (totCount - 1)) lastYN = true;
                    insertFileDB(responseText.fileInfo[i], responseText.message[i], lastYN); // FILE INFO INSERT
                    insertBatchLearningBaseData(responseText.fileInfo[i], responseText.message[i], lastYN);  // BATCH LEARNING BASE DATA INSERT
                }
                endProgressBar();
            }
        },
        error: function (e) {
            console.log("File upload failed : " + e);
            endProgressBar();
        }
    });
}

// [imageUpload event]
// INSERT DB IMAGE
var insertFileDB = function (fileInfo, fileName, lastYN) {
    if (fileInfo) {
        var param = { fileInfo: fileInfo };
        $.ajax({
            url: '/batchLearning/insertFileInfo',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                addProgressBar(81, 90);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
}

// INSERT DB BATCH LEARNING BASE DATA
var insertBatchLearningBaseData = function (fileInfo, fileName, lastYN) {
    if (fileInfo) {
        var param = { fileInfo: fileInfo };
        $.ajax({
            url: '/batchLearning/insertBatchLearningBaseData',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                addProgressBar(91, 100);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));
                endProgressBar();
                if (lastYN) {
                    alert("파일 등록이 완료되었습니다.");
                    searchBatchLearnDataList("LEARN_N");
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
}

// UPLOAD IMAGE ON SERVER
var imageUploadEvent = function () {
    var multiUploadForm = $("#multiUploadForm");

    $('#document_file').on("change", function () {
        startProgressBar();
        addProgressBar(1, 5);
        multiUploadForm.attr("action", "/batchLearning/imageUpload");
        if ($(this).val() !== '') {
            multiUploadForm.submit();
        }
    });
    // FILE UPLOAD
    fileUpload();
}
               
// [파일정보 -> OCR API]
function processImage(fileInfo, fileName, lastYn, answerRows, fileToPage) {
    console.log("processImage fileInfo : " + JSON.stringify(fileInfo));
    console.log("processImage fileName : " + fileName);
    console.log("processImage lastYn : " + lastYn);
    console.log("processImage answerRows : " + JSON.stringify(answerRows));
    var subscriptionKey = "7d51f1308c8848f49db9562d1dab7184";
    var uriBase = "https://westus.api.cognitive.microsoft.com/vision/v1.0/ocr";
    var params = {
        "language": "unk",
        "detectOrientation": "true",
    };
    var sourceImageUrl = 'http://kr-ocr.azurewebsites.net/uploads/' + fileName;

    //$("#progressMsg").html("processing ocr api...");
    //addProgressBar(51, 60);
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
        if (ocrCount == 1) {
            for (var i in fileToPage) {
                if (fileToPage[i].IMGID == answerRows.IMGID &&
                    fileToPage[i].IMGFILESTARTNO <= answerRows.PAGENUM &&
                    answerRows.PAGENUM <= fileToPage[i].IMGFILEENDNO) {
                    ocrDataArr.push({
                        answerImgId: answerRows.IMGID,
                        fileInfo: fileInfo,
                        fileName: [fileName],
                        regions: data.regions,
                        fileToPage: fileToPage[i],
                        lastYn: lastYn
                    });
                }
            }
        } else {
            for (var i in ocrDataArr) {
                if (ocrDataArr[i].answerImgId == answerRows.IMGID &&
                    ocrDataArr[i].fileToPage.IMGFILESTARTNO <= answerRows.PAGENUM &&
                    answerRows.PAGENUM <= ocrDataArr[i].fileToPage.IMGFILEENDNO) {
                    var totRegions = (ocrDataArr[i].regions).concat(data.regions);
                    ocrDataArr[i].regions = totRegions;
                    ocrDataArr[i].fileName.push(fileName);
                    break;
                } else if (i == ocrDataArr.length - 1) {
                    for (var j in fileToPage) {
                        if (fileToPage[j].IMGID == answerRows.IMGID &&
                            fileToPage[j].IMGFILESTARTNO <= answerRows.PAGENUM &&
                            answerRows.PAGENUM <= fileToPage[j].IMGFILEENDNO) {
                            ocrDataArr.push({
                                answerImgId: answerRows.IMGID,
                                fileInfo: fileInfo,
                                fileName: [fileName],
                                regions: data.regions,
                                fileToPage: fileToPage[j],
                                lastYn: lastYn
                            });
                        }
                    }
                }
            }

        }
        //console.log(ocrDataArr);
        if (totCount == ocrCount) {
            //execBatchLearningData();
        }
        //execBatchLearningData(fileInfo, fileName, data.regions, lastYn); // goto STEP 3
    }).fail(function (jqXHR, textStatus, errorThrown) {
        var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
            jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
        alert(errorString);
        endProgressBar(); // 에러 발생 시 프로그레스바 종료
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
            console.log("processImage : done ");
        ocrCount++;
        addProgressBar(41, 70);
        execBatchLearningData(fileInfo, fileName, data.regions); // goto STEP 3
        },
        error: function (err) {
            console.log(err);
            endProgressBar(); // 에러 발생 시 프로그레스바 종료
        }
    });
    */
};

// [OCR API -> CLASSIFICATION -> LABEL MAPPING]
function execBatchLearningData() {
    var batchCount = 0; // ml 학습 횟수
    var dataArr = [];
    for (var i in ocrDataArr) {
        var data = [];
        for (var j in ocrDataArr[i].regions) {
            var regionsItem = ocrDataArr[i].regions[j];
            for (var k in regionsItem.lines) {
                var linesItem = regionsItem.lines[k];
                var item = '';
                for (var m in linesItem.words) {
                    item += linesItem.words[m].text + ' ';
                }
                data.push({ 'location': linesItem.boundingBox, 'text': item.trim() });
            }
        }
        dataArr.push(data);
    }

    //$("#progressMsg").html("processing machine learning...");
    //addProgressBar(61, 90);
    for (var i in ocrDataArr) {
        $.ajax({
            url: '/batchLearning/execBatchLearningData',
            type: 'post',
            datatype: "json",
            data: JSON.stringify({ 'fileName': ocrDataArr[i].fileName, 'data': dataArr[i] }),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
            },
            success: function (data) {
                console.log(data);
                batchCount++;
                if (totCount = batchCount) {
                    //$("#progressMsg").html("success...");
                    //addProgressBar(91, 100);
                }
                /*
                updateBatchLearningData(fileInfo, data, lastYn);
                if (lastYn == "Y") {
                    addProgressBar(71, 99);
                    setTimeout(function () {
                        alert("완료되었습니다.");
                        searchBatchLearnDataList(addCond);
                    }, 1000);
                }
                */
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
    /*
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
        url: '/batchLearning/execBatchLearningData',
        type: 'post',
        datatype: "json",
        //data: JSON.stringify(param),
        data: JSON.stringify({ 'fileName': fileName, 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
        },
        success: function (data) {
            /*
            updateBatchLearningData(fileInfo, data, lastYn);
            if (lastYn == "Y") {
                addProgressBar(71, 99);
                setTimeout(function () {
                    alert("완료되었습니다.");
                    searchBatchLearnDataList(addCond);
                }, 1000);
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
    */
}

function compareBatchLearningData(fileInfo, data, lastYn) {
    console.log("compareBatchLearningData fileInfo : " + JSON.stringify(fileInfo));
    var dataObj = {};

    for (var i = 0, x = data.length; i < x; i++) {
        var location = nvl(data[i]["location"]);
        var label = nvl(data[i]["label"]);
        var text = nvl(data[i]["text"]);
        var column = nvl(data[i]["column"]);
        if (label == "fixlabel" || label == "entryrowlabel") {
            for (var j = 0, y = data.length; j < y; j++) {
                if (data[j].column == column + "_VALUE") {
                    console.log("Find Label and Value : " + data[j]["column"] + " >> " + data[j]["text"]);
                    if (isNull(dataObj[column])) {
                        // DOUBLE 형태의 값은 공백 제거 처리
                        if (column == "PRE" || column == "COM" || column == "BRKG" || column == "TXAM" ||
                            column == "PRRS_CF" || column == "PRRS_RLS" || column == "LSRES_CF" ||
                            column == "LSRES_RLS" || column == "CLA" || column == "EXEX" || column == "SVF" ||
                            column == "CAS" || column == "NTBL") {
                            dataObj[column] = data[j]["text"].replace(/(\s*)/g, "");
                        } else {
                            dataObj[column] = data[j]["text"];
                        }
                    } else {
                        console.log("Alreaday exist Column(KEY) : " + data[j]["column"] + " >> " + data[j]["text"]);
                    }
                }
            }
        }
    }
    console.log("결과 : " + JSON.stringify(dataObj));

    // BatchLearning Data Insert
    if (dataObj) {
        var fileNameSplit = fileInfo.oriFileName.split(".");
        var imgId = fileNameSplit[0];

        dataObj["imgId"] = imgId;
        var param = { dataObj: dataObj };
        $.ajax({
            url: '/batchLearning/compareBatchLearningData',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            success: function (retData) {
                console.log("SUCCESS compareBatchLearningData : " + JSON.stringify(retData));

                if (retData.rows[0].IMGID == dataObj["imgId"]) {
                    if (retData.rows[0].NTBL != dataObj["NTBL"]) {
                        uiPopUpTrain(data, fileInfo);
                    }
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
}

function uiPopUpTrain(data, fileInfo) {
    $("#uiImg").attr("src", "./uploads/" + fileInfo.convertFileName);
    $("#cscoNm").val(data["CSCO_NM"]);//거래사명
    $("#ctNm").val(data["CT_NM"]);//계약명
    $("#insStDt").val(data["INS_ST_DT"]);//보험개시일
    $("#insEndDt").val(data["INS_END_DT"]);//보험종료일
    $("#curCd").val(data["CUR_CD"]);//화폐코드
    $("#pre").val(data["PRE"]);//보험료
    $("#com").val(data["COM"]);//일반수수료
    $("#brkg").val(data["BRKG"]);//중개수수료
    $("#txam").val(data["TXAM"]);//세금
    $("#prrsCf").val(data["PRRS_CF"]);//보험금유보금적립액
    $("#prrsRls").val(data["PRRS_RLS"]);//보험료유보금해제액
    $("#lsresCf").val(data["LSRES_CF"]);//보험금유보금적립액
    $("#lsresRls").val(data["LSRES_RLS"]);//보험금유보금해제액
    $("#cla").val(data["CLA"]);//보험금
    $("#exex").val(data["EXEX"]);//부대비
    $("#svf").val(data["SVF"]);//손해조사비
    $("#cas").val(data["CAS"]);//즉시불보험금
    $("#ntbl").val(data["NTBL"]);//NET BALANCE
    $("#layer2").css("display", "block");
    return;
}

// [UPDATE PARSING RESULT, UPDATE FILE INFO DB]
function updateBatchLearningData(fileInfo, data, lastYn) {
    console.log("updateBatchLearningData fileInfo : " + JSON.stringify(fileInfo));
    console.log("data[0] : " + JSON.stringify(data[0]));
    var dataObj = {};

    for (var i = 0, x = data.length; i < x; i++) {
        var location = nvl(data[i]["location"]);
        var label = nvl(data[i]["label"]);
        var text = nvl(data[i]["text"]);
        var column = nvl(data[i]["column"]);
        if (label == "fixlabel" || label == "entryrowlabel") {
            for (var j = 0, y = data.length; j < y; j++) {
                if (data[j].column == column + "_VALUE") {
                    console.log("Find Label and Value : " + data[j]["column"] + " >> " + data[j]["text"]);
                    if (isNull(dataObj[column])) {
                        // DOUBLE 형태의 값은 공백 제거 처리
                        if (column == "PRE" || column == "COM" || column == "BRKG" || column == "TXAM" ||
                            column == "PRRS_CF" || column == "PRRS_RLS" || column == "LSRES_CF" ||
                            column == "LSRES_RLS" || column == "CLA" || column == "EXEX" || column == "SVF" ||
                            column == "CAS" || column == "NTBL") {
                            dataObj[column] = data[j]["text"].replace(/(\s*)/g,"");
                        } else {
                            dataObj[column] = data[j]["text"];
                        }
                    } else {
                        console.log("Alreaday exist Column(KEY) : " + data[j]["column"] + " >> " + data[j]["text"]);
                    }
                }
            }
        } 
    }
    console.log("결과 : " + JSON.stringify(dataObj));
    
    // BatchLearning Data Insert
    if (dataObj) {
        var imgId = fileInfo.imgId;
        var filePath = fileInfo.filePath;
        var oriFileName = fileInfo.oriFileName;
        var svrFileName = fileInfo.svrFileName;
        var convertFileName = fileInfo.convertFileName;
        var fileExt = fileInfo.fileExt;
        var fileSize = fileInfo.fileSize;
        var contentType = fileInfo.contentType;

        dataObj["imgId"] = imgId;
        var param = { dataObj: dataObj };
        $.ajax({
            url: '/batchLearning/updateBatchLearningData',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            success: function (data) {
                console.log("SUCCESS updateBatchLearningData : " + JSON.stringify(data));
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
}

// [Function]
// [List] 배치학습데이터 조회
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
                    if (addCond == "LEARN_N") checkboxHtml = `<th scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="${entry.IMGID}" class="sta00" name="listCheck_before" /></th>`;
                    else checkboxHtml = `<th scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="${entry.IMGID}" class="stb00" name="listCheck_after" /></div></th>`;
                    appendHtml += `
                        <tr>
                        ${checkboxHtml}
                        <td>${nvl(entry.IMGID)}</td>
                        <td>${nvl(entry.ORIGINFILENAME)}</td>
                        <td>${nvl(entry.STATUS)}</td>
                        <td>${nvl(entry.ENTRYNO)}</td>
                        <td>${nvl(entry.STATEMENTDIV)}</td>
                        <td>${nvl(entry.CONTRACTNUM)}</td>
                        <td>${nvl(entry.OGCOMPANYCODE)}</td>
                        <td>${nvl(entry.OGCOMPANYNAME)}</td>
                        <td>${nvl(entry.BROKERCODE)}</td>
                        <td>${nvl(entry.BROKERNAME)}</td>
                        <td>${nvl(entry.CTNM)}</td>
                        <td>${nvl(entry.INSSTDT)}</td>
                        <td>${nvl(entry.INSENDDT)}</td>
                        <td>${nvl(entry.UY)}</td>
                        <td>${nvl(entry.CURCD)}</td>
                        <td>${nvl(entry.PAIDPERCENT)}</td>
                        <td>${nvl(entry.PAIDSHARE)}</td>
                        <td>${nvl(entry.OSLPERCENT)}</td>
                        <td>${nvl(entry.OSLSHARE)}</td>
                        <td>${nvl(entry.GROSSPM)}</td>
                        <td>${nvl(entry.PM)}</td>
                        <td>${nvl(entry.PMPFEND)}</td>
                        <td>${nvl(entry.PMPFWOS)}</td>
                        <td>${nvl(entry.XOLPM)}</td>
                        <td>${nvl(entry.RETURNPM)}</td>
                        <td>${nvl(entry.GROSSCN)}</td>
                        <td>${nvl(entry.CN)}</td>
                        <td>${nvl(entry.PROFITCN)}</td>
                        <td>${nvl(entry.BROKERAGE)}</td>
                        <td>${nvl(entry.TAX)}</td>
                        <td>${nvl(entry.OVERRIDINGCOM)}</td>
                        <td>${nvl(entry.CHARGE)}</td>
                        <td>${nvl(entry.PMRESERVERTD)}</td>
                        <td>${nvl(entry.PFPMRESERVERTD)}</td>
                        <td>${nvl(entry.PMRESERVERTD2)}</td>
                        <td>${nvl(entry.PFPMRESERVERTD2)}</td>
                        <td>${nvl(entry.CLAIM)}</td>
                        <td>${nvl(entry.LOSSRECOVERY)}</td>
                        <td>${nvl(entry.CASHLOSS)}</td>
                        <td>${nvl(entry.CASHLOSSRD)}</td>
                        <td>${nvl(entry.LOSSRR)}</td>
                        <td>${nvl(entry.LOSSRR2)}</td>
                        <td>${nvl(entry.LOSSPFEND)}</td>
                        <td>${nvl(entry.LOSSPFWOA)}</td>
                        <td>${nvl(entry.INTEREST)}</td>
                        <td>${nvl(entry.TAXON)}</td>
                        <td>${nvl(entry.MISCELLANEOUS)}</td>
                        <td>${nvl(entry.PMBL)}</td>
                        <td>${nvl(entry.CMBL)}</td>
                        <td>${nvl(entry.NTBL)}</td>
                        <td>${nvl(entry.CSCOSARFRNCNNT2)}</td>
                    </tr>`;
                });
            } else {
                appendHtml += `<tr><td colspan="52">조회할 데이터가 없습니다.</td></tr>`;
            }
            //$(appendHtml).appendTo($("#tbody_batchList")).slideDown('slow');
            if (addCond == "LEARN_N") $("#tbody_batchList_before").empty().append(appendHtml);
            else $("#tbody_batchList_after").empty().append(appendHtml);
            endProgressBar(); // end progressbar
            checkboxEvent(); // refresh checkbox event
            $('input[type=checkbox]').ezMark();
        },
        error: function (err) {
            endProgressBar(); // end progressbar
            console.log(err);
        }
    });
};

// [Select] 배치학습데이터 조회
var searchBatchLearnData = function (imgIdArray, flag) {
    var param = {
        imgIdArray : imgIdArray
    };
    $.ajax({
        url: '/batchLearning/searchBatchLearnData',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $('#btn_pop_batch_close').click();
            //$("#progressMsg").html("retrieving learn data...");
            //startProgressBar(); // start progressbar
            //addProgressBar(0, 30); // proceed progressbar
        },
        success: function (data) {
            //$("#progressMsg").html("processing learn data...");
            //addProgressBar(31, 50);
            console.log("/batchLearning/searchBatchLearnData result :");
            console.log(data);
            
            if (flag == "PROCESS_IMAGE") {  // 배치학습 실행
                for (var i = 0, x = data.fileInfoList.length; i < x; i++) {
                    var lastYn = "N";
                    if (i == data.fileInfoList.length - 1) lastYn = "Y";
                    processImage(data.fileInfoList[i], data.fileInfoList[i].convertFileName, lastYn, data.answerRows[i], data.fileToPage);
                }
            } else if (flag == "UI_TRAINING") {
                fn_processUiTraining(data.fileInfoList);
            } else {
                alert("잘못된 요청입니다.");
                return;
            }
            
        },
        error: function (err) {
            endProgressBar(); // end progressbar
            console.log(err);
        }
    });
}

// syncServerFile (서버의 이미지가 DB에 등록이 안되어있다면 DB에 등록처리)
var fn_syncServerFile = function() {
    var param = {};
    $.ajax({
        url: '/batchLearning/syncFile',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        success: function (responseText, statusText) {
            console.log("responseText : " + JSON.stringify(responseText));
            // FILE INSERT
            if (isNull(responseText.fileInfo)) {
                alert("신규 등록할 파일이 존재하지 않습니다.");
            } else {
                var insertPromise = new Promise(function (resolve, reject) {
                    var totCount = responseText.message.length;
                    for (var i = 0; i < totCount; i++) {
                        var lastYN = false;
                        var fileInfo = responseText.fileInfo[i];
                        var fileName = responseText.message[i];
                        console.log("fileInfo " + i + " : " + JSON.stringify(fileInfo));
                        console.log("fileName " + i + " : " + JSON.stringify(fileName));
                        if (i == (totCount - 1)) lastYN = true;
                        insertFileDB(responseText.fileInfo[i], responseText.message[i], lastYN); // FILE INFO INSERT
                        insertBatchLearningBaseData(responseText.fileInfo[i], responseText.message[i], lastYN);  // BATCH LEARNING BASE DATA INSERT
                    }
                });
                insertPromise.then(function (responseText, statusText) {
                    alert("완료");
                });
                insertPromise.then().catch(function (e) {
                    alert("파일 업로드에 실패했습니다.\n관리자에게 문의해주세요." + e);
                    console.log(e);
                });
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// 정답엑셀 업로드
var fn_rightExcelUpload = function() {

};

// 이미지 업로드
var fn_imageUpload = function () {
    
};

// 이미지 삭제
var fn_imageDelete = function () {
    var imgIdArray = [];
    var chkSize = 0;
    if (addCond == "LEARN_N") {
        $('input[name="listCheck_before"]').each(function (index, element) {
            if ($(this).is(":checked")) {
                imgIdArray.push($(this).val());
                chkSize++;
            }
        });
    } else {
        $('input[name="listCheck_after"]').each(function (index, element) {
            if ($(this).is(":checked")) {
                imgIdArray.push($(this).val());
                chkSize++;
            }
        });
    }
    if (chkSize > 0) {
        if (confirm("삭제하시겠습니까?")) {
            var param = { imgIdArray: imgIdArray };
            $.ajax({
                url: '/batchLearning/deleteBatchLearningData',
                type: 'post',
                datatype: "json",
                data: JSON.stringify(param),
                contentType: 'application/json; charset=UTF-8',
                success: function (responseText, statusText) {
                    alert("삭제 되었습니다.");
                    searchBatchLearnDataList(addCond);
                },
                error: function (err) {
                    console.log(err);
                }
            });
        }
    } else {
        alert("삭제할 파일이 선택되지 않았습니다.");
        return;
    }
};


// 배치학습 실행
var fn_batchTraining = function () {
    //var top = ($(window).scrollTop() + ($(window).height() - $('#layerPopup').height()) / 2);
    popupEvent.openPopup();
};
var fn_popBatchRun = function () {
    var imgIdArray = [];
    var radioValue = $("input[name='radio_batch']:checked").val();

    switch (radioValue) {
        case "choice-1":        // 전체 학습
            if (addCond == "LEARN_N") {
                let chkCnt = 0;
                $("input[name=listCheck_before]").each(function (index, entry) {
                    chkCnt++;
                    totCount++;
                    imgIdArray.push($(this).val());
                });
                if (chkCnt == 0) {
                    alert("학습할 데이터가 없습니다.");
                    return;
                } else {
                    searchBatchLearnData(imgIdArray, "PROCESS_IMAGE");
                }
            } else {
                alert("Before Training 상태에서만 배치학습이 가능합니다.");
                return;
            }
            break;
        case "choice-2":        // 선택한 파일 학습
            if (addCond == "LEARN_N") {
                let chkCnt = 0;
                $("input[name=listCheck_before]").each(function (index, entry) {
                    if ($(this).is(":checked")) {
                        chkCnt++;
                        totCount++;
                        imgIdArray.push($(this).val());
                    }
                });
                if (chkCnt == 0) {
                    alert("선택된 학습이 없습니다.");
                    return;
                } else {
                    searchBatchLearnData(imgIdArray, "PROCESS_IMAGE");
                }
            } else {
                alert("Before Training 상태에서만 배치학습이 가능합니다.");
                return;
            }
            break;
        case "choice-3":        // 학습 범위 지정
            alert("준비중 입니다.");
            break;
        default:
            break;
    }
};

// UI 학습 (학습결과 수정)
var fn_uiTraining = function () {
    var imgIdArray = [];
    if (addCond == "LEARN_Y") {
        let imgId = "";
        let chkCnt = 0;
        $("input[name=listCheck_after]").each(function (index, entry) {
            if ($(this).is(":checked")) {
                imgId = $(this).val();
                chkCnt++;
            }
        });
        if (chkCnt == 0) {
            alert("선택된 파일이 없습니다.");
            return;
        } else if (chkCnt > 1) {
            alert("한번에 하나의 파일만 UI학습이 가능합니다.");
            return;
        } else {
            imgIdArray.push(imgId);
            searchBatchLearnData(imgIdArray, "UI_TRAINING");
        }
    } else {
        alert("After Training 상태에서만 UI학습이 가능합니다.");
        return;
    }
};

// UI학습 팝업 초기화
var fn_initUiTraining = function () {
    $("#imgId").val("");
    $("#imgFileStNo").val("");
    $("#imgFileEndNo").val("");
    $("#cscoNm").val("");
    $("#ctNm").val("");
    $("#instStDt").val("");
    $("#instEndDt").val("");
    $("#curCd").val("");
    $("#pre").val("");
    $("#com").val("");
    $("#brkg").val("");
    $("#txam").val("");
    $("#prrsCf").val("");
    $("#prrsRls").val("");
    $("#lsresCf").val("");
    $("#lsresRls").val("");
    $("#cla").val("");
    $("#exex").val("");
    $("#svf").val("");
    $("#cas").val("");
    $("#ntbl").val("");
    $("#cscoSaRfrnCnnt2").val("");
    $("#regId").val("");
    $("#regDate").val("");
    $("#updId").val("");
    $("#updDate").val("");
}
// UI학습 팝업 값 대입
var fn_processUiTraining = function (fileInfoList) {
    fn_initUiTraining(); // 팝업 초기화

    var fileInfo = fileInfoList[0]; // 동시에 한개의 fileInfoList만 조회하여 가져옴

    console.log("file.info... : " + JSON.stringify(fileInfo));

    $("#imgId").val(fileInfo["imgId"]);
    $("#imgFileStNo").val(fileInfo["imgFileStNo"]);
    $("#imgFileEndNo").val(fileInfo["imgFileEndNo"]);
    $("#cscoNm").val(fileInfo["cscoNm"]);
    $("#ctNm").val(fileInfo["ctNm"]);
    $("#instStDt").val(fileInfo["instStDt"]);
    $("#instEndDt").val(fileInfo["instEndDt"]);
    $("#curCd").val(fileInfo["curCd"]);
    $("#pre").val(fileInfo["pre"]);
    $("#com").val(fileInfo["com"]);
    $("#brkg").val(fileInfo["brkg"]);
    $("#txam").val(fileInfo["txam"]);
    $("#prrsCf").val(fileInfo["prrsCf"]);
    $("#prrsRls").val(fileInfo["prrsRls"]);
    $("#lsresCf").val(fileInfo["lsresCf"]);
    $("#lsresRls").val(fileInfo["lsresRls"]);
    $("#cla").val(fileInfo["cla"]);
    $("#exex").val(fileInfo["exex"]);
    $("#svf").val(fileInfo["svf"]);
    $("#cas").val(fileInfo["cas"]);
    $("#ntbl").val(fileInfo["ntbl"]);
    $("#cscoSaRfrnCnnt2").val(fileInfo["cscoSaRfrnCnnt2"]);
    $("#regId").val(fileInfo["regId"]);
    $("#regDate").val(fileInfo["regDate"]);
    $("#updId").val(fileInfo["updId"]);
    $("#updDate").val(fileInfo["updDate"]);

    layer_open('layer2');
}

// UI학습 팝업 실행
var fn_updateUiTraining = function () {
    var dataObj = {};
    dataObj["imgId"] = $("#imgId").val();
    dataObj["imgFileStartNo"] = $("#imgFileStartNo").val();
    dataObj["imgFileEndNo"] = $("#imgFileEndNo").val();
    dataObj["cscoNm"] = $("#cscoNm").val();
    dataObj["ctNm"] = $("#ctNm").val();
    dataObj["insStDt"] = $("#insStDt").val();
    dataObj["insEndDt"] = $("#insEndDt").val();
    dataObj["curCd"] = $("#curCd").val();
    dataObj["pre"] = $("#pre").val();
    dataObj["com"] = $("#com").val();
    dataObj["brkg"] = $("#brkg").val();
    dataObj["txam"] = $("#txam").val();
    dataObj["prrsCf"] = $("#prrsCf").val();
    dataObj["prrsRls"] = $("#prrsRls").val();
    dataObj["lsresCf"] = $("#lsresCf").val();
    dataObj["lsresRls"] = $("#lsresRls").val();
    dataObj["cla"] = $("#cla").val();
    dataObj["exex"] = $("#exex").val();
    dataObj["svf"] = $("#svf").val();
    dataObj["cas"] = $("#cas").val();
    dataObj["ntbl"] = $("#ntbl").val();
    dataObj["cscoSaRfrnCnnt2"] = $("#cscoSaRfrnCnnt2").val();
    
    var param = { dataObj: dataObj };

    $.ajax({
        url: '/batchLearning/updateBatchLearningData',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            console.log("SUCCESS updateBatchLearningData : " + JSON.stringify(data));
            alert("UI학습이 완료되었습니다.");
            searchBatchLearnDataList(addCond);
            popupEvent.closePopup();
        },
        error: function (err) {
            console.log(err);
        }
    });
}

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
	//excelUploadEvent();         // excel upload event

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


