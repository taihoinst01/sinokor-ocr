//import { identifier } from "babel-types";

"use strict";

var totCount = 0; // 총 이미지 분석 개수
var ocrCount = 0; // ocr 수행 횟수
var batchCount = 0; // ml 학습 횟수
var grid;
var isFullMatch = true; // UI training 체크 중 모든 컬럼 매치 유무
var modifyData = []; // UI 수정할 데이터 

var ocrDataArr = []; //ocr 학습한 데이터 배열

var addCond = "LEARN_N"; // LEARN_N:학습미완료, LEARN_Y:학습완료, default:학습미완료
var startNum = 0;
var moreNum = 20;

var ocrPopData; //UI Popup DATA

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
        fn_batchUiTraining();
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
            $("#progressMsgTitle").html("Preparing to upload files...");
            startProgressBar();
            addProgressBar(6, 99);
            return true;
        },
        success: function getData(responseText, statusText) {
            if (responseText.type == 'excel') {
                console.log("upload excel data : " + JSON.stringify(responseText));
                $("#progressMsgTitle").html("uploading excel files...");
                endProgressBar();
            } else if (responseText.type == 'image') {
                console.log("upload image data : " + JSON.stringify(responseText));
                $("#progressMsgTitle").html("uploading image files...");
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

    //$("#progressMsgTitle").html("processing ocr api...");
    //addProgressBar(51, 60);
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
            if (ocrCount == 1) {
                for (var i in fileToPage) {
                    if (fileToPage[i].IMGID == answerRows.IMGID &&
                        fileToPage[i].IMGFILESTARTNO <= answerRows.PAGENUM &&
                        answerRows.PAGENUM <= fileToPage[i].IMGFILEENDNO) {
                        ocrDataArr.push({
                            answerImgId: answerRows.IMGID,
                            fileInfo: [fileInfo],
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
                        ocrDataArr[i].fileInfo.push(fileInfo);
                        break;
                    } else if (i == ocrDataArr.length - 1) {
                        for (var j in fileToPage) {
                            if (fileToPage[j].IMGID == answerRows.IMGID &&
                                fileToPage[j].IMGFILESTARTNO <= answerRows.PAGENUM &&
                                answerRows.PAGENUM <= fileToPage[j].IMGFILEENDNO) {
                                ocrDataArr.push({
                                    answerImgId: answerRows.IMGID,
                                    fileInfo: [fileInfo],
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
                execBatchLearning();
            }
            //execBatchLearningData(fileInfo, fileName, data.regions, lastYn); // goto STEP 3
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


function convertOcrData() {
    var convertArr = [];
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
        convertArr.push(data);
    }

    return convertArr;
}

// [OCR API -> CLASSIFICATION -> LABEL MAPPING]
function execBatchLearning() {
    var dataArr = convertOcrData();

    for (var i in ocrDataArr) {
        if (ocrDataArr[i].exeML != "Y") {
            execBatchLearningData(ocrDataArr[i], dataArr[i]);
            if (isFullMatch) { // 모든 컬럼 매핑이 되었거나 계산서가 아닌 경우
            } else {            
                popUpLayer2(ocrDataArr[i]);
                break;
            }
        }
    }
}

// UI레이어 작업 함수
function popUpLayer2(ocrData) {
    var data = modifyData;
    console.log('---------------------------------------');
    console.log(ocrData);
    console.log(data)

    ocrPopData = data;

    fn_initUiTraining(); // 팝업 초기화
    console.log("popupTest");
    layer_open('layer2'); // ui 학습레이어 띄우기
    $("#layer2.poplayer").css("display", "block");

    //$("#uiImg").attr("src", "./uploads/" + ocrData.fileInfo[0].convertFileName);
    $("#uiImg").attr("src", "./uploads/26.jpg");
    for (var num in data) {
        if (data[num].column == "CSCO_NM_VALUE") {
            $("#cscoNm").val(data[num].text);
        } else if (data[num].column == "CT_NM_VALUE") {
            $("#ctNm").val(data[num].text);
        } else if (data[num].column == "INS_ST_DT_VALUE") {
            $("#insStDt").val(data[num].text);
        } else if (data[num].column == "INS_END_DT_VALUE") {
            $("#insEndDt").val(data[num].text);
        } else if (data[num].column == "CUR_CD_VALUE") {
            $("#curCd").val(data[num].text);
        } else if (data[num].column == "PRE_VALUE") {
            $("#pre").val(data[num].text);
        } else if (data[num].column == "COM_VALUE") {
            $("#com").val(data[num].text);
        } else if (data[num].column == "BRKG_VALUE") {
            $("#brkg").val(data[num].text);
        } else if (data[num].column == "TXAM_VALUE") {
            $("#txam").val(data[num].text);
        } else if (data[num].column == "PRRS_CF_VALUE") {
            $("#prrsCf").val(data[num].text);
        } else if (data[num].column == "PRRS_RLS_VALUE") {
            $("#prrsRls").val(data[num].text);
        } else if (data[num].column == "CLA_VALUE") {
            $("#cla").val(data[num].text);
        } else if (data[num].column == "EXEX_VALUE") {
            $("#exex").val(data[num].text);
        } else if (data[num].column == "SVF_VALUE") {
            $("#svf").val(data[num].text);
        } else if (data[num].column == "CAS_VALUE") {
            $("#cas").val(data[num].text);
        } else if (data[num].column == "NTBL_VALUE") {
            $("#ntbl").val(data[num].text);
        } else if (data[num].column == "CSCO_SA_RFRN_CNNT2_VALUE") {
            $("#cscoSaRfrnCnnt2").val(data[num].text);
        } else {

        }
    }
    
}

function execBatchLearningData(ocrData, data) {
    //$("#progressMsgTitle").html("processing machine learning...");
    //addProgressBar(61, 90);
    batchCount++;
    //compareBatchLearningData(ocrData, '');
    
    $.ajax({
        url: '/batchLearning/execBatchLearningData',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        async: false,
        beforeSend: function () {
        },
        success: function (data) {
            //console.log(data);
            modifyData = data.data;
            batchCount++;
            compareBatchLearningData(ocrData, data.data)
            //compareBatchLearningData(fileInfo, data, isUiTraining);
            //updateBatchLearningData(fileName, data);
            
            //if (totCount = batchCount) {
                //$("#progressMsgTitle").html("success...");
                //addProgressBar(91, 100);               
            //}
            
            
        },
        error: function (err) {
            console.log(err);
        }
    });
    
}

function compareBatchLearningData(ocrData, data) {
    //var data = JSON.parse('[{"location":"300,51,370,44","text":"123123123213123","label":"entryrowlabel","column":"PRRS_CF"},{"location":"252,57,480,46","text":"abcdqwjlvasmlkfsdafasd","label":"entryrowlabel","column":"PRRS_CF"},{"location":"1018,240,411,87","text":"APEX","label":""},{"location":"1019,338,409,23","text":"Partner of Choice","label":""},{"location":"1562,509,178,25","text":"Voucher No","label":""},{"location":"1562,578,206,25","text":"Voucher Date","label":""},{"location":"206,691,274,27","text":"4153 Korean Re","label":""},{"location":"208,756,525,34","text":"Proportional Treaty Statement","label":""},{"location":"1842,506,344,25","text":"BV/HEO/2018/05/0626","label":""},{"location":"1840,575,169,25","text":"01105/2018","label":""},{"location":"206,848,111,24","text":"decant","label":"entryrowlabel","column":"PRRS_CF"},{"location":"206,908,285,24","text":"Class of Business","label":"fixlabel","column":"CT_NM"},{"location":"210,963,272,26","text":"Period of Quarter","label":"fixlabel","column":"INS_ST_DT"},{"location":"207,1017,252,31","text":"Period of Treaty","label":"fixlabel","column":"CUR_CD"},{"location":"206,1066,227,24","text":"Our Reference","label":"fixlabel","column":"CSCO_SA_RFRN_CNNT2"},{"location":"226,1174,145,31","text":"Currency","label":"entryrowlabel","column":"CUR_CD"},{"location":"227,1243,139,24","text":"Premium","label":"entryrowlabel","column":"PRE"},{"location":"226,1303,197,24","text":"Commission","label":"entryrowlabel","column":"COM"},{"location":"226,1366,107,24","text":"Claims","label":"entryrowlabel","column":"CLA"},{"location":"227,1426,126,24","text":"Reserve","label":"entryrowlabel","column":"PRRS_CF"},{"location":"227,1489,123,24","text":"Release","label":"entryrowlabel","column":"PRRS_RLS"},{"location":"227,1549,117,24","text":"Interest","label":"entryrowlabel","column":"EXEX"},{"location":"227,1609,161,31","text":"Brokerage","label":"entryrowlabel","column":"BRKG"},{"location":"233,1678,134,24","text":"Portfolio","label":"entryrowlabel","column":"SVF"},{"location":"227,1781,124,24","text":"Balance","label":"entryrowlabel","column":"NTBL"},{"location":"574,847,492,32","text":": Solidarity- First Insurance 2018","label":""},{"location":"574,907,568,32","text":": Marine Cargo Surplus 2018 - Inward","label":""},{"location":"598,959,433,25","text":"01-01-2018 TO 31-03-2018","label":"fixvalue","column":"INS_ST_DT_VALUE"},{"location":"574,1010,454,25","text":": 01-01-2018 TO 31-12-2018","label":"fixvalue","column":"CUR_CD_VALUE"},{"location":"574,1065,304,25","text":": APEX/BORD/2727","label":""},{"location":"629,1173,171,25","text":"jody 1.00","label":"entryvalue","column":"CUR_CD_VALUE"},{"location":"639,1239,83,25","text":"25.53","label":"entryvalue","column":"PRE_VALUE"},{"location":"639,1299,64,25","text":"5.74","label":"entryvalue","column":"COM_VALUE"},{"location":"639,1362,64,25","text":"0.00","label":"entryvalue","column":"CLA_VALUE"},{"location":"639,1422,64,25","text":"7.66","label":"entryvalue","column":"PRRS_CF_VALUE"},{"location":"639,1485,64,25","text":"0.00","label":"entryvalue","column":"PRRS_RLS_VALUE"},{"location":"639,1545,64,25","text":"0.00","label":"entryvalue","column":"EXEX_VALUE"},{"location":"639,1605,64,25","text":"0.64","label":"entryvalue","column":"BRKG_VALUE"},{"location":"648,1677,64,25","text":"0.00","label":"entryvalue","column":"SVF_VALUE"},{"location":"641,1774,81,25","text":"11 .49","label":"entryvalue","column":"NTBL_VALUE"},{"location":"1706,1908,356,29","text":"APEX INSURANCE","label":"undefined"}]');
    var dataObj = {};

    for (var i = 0, x = data.length; i < x; i++) {
        var location = nvl(data[i]["location"]);
        var label = nvl(data[i]["label"]);
        var text = nvl(data[i]["text"]);
        var column = nvl(data[i]["column"]);

        if (label == "fixlabel" || label == "entryrowlabel") { //라벨 이면
            for (var j = 0, y = data.length; j < y; j++) {
                if (data[j].column == column + "_VALUE") {// 해당 라벨에 대한 값이면
                    console.log("Find Label and Value : " + data[j]["column"] + " >> " + data[j]["text"]);
                    if (isNull(dataObj[column])) {
                        // 양식 변경전이랑 비교해야하기 때문에 ml에서 나온 값은 출재사명(거래사명),계약명,개시일, 종료일만을 담아서 보냄. 추후 수정 필요 -- 07.27 hyj
                        if (column == "CSCO_NM" ) {
                            dataObj["csconm"] = data[j]["text"];
                        } else if (column == "CT_NM") {
                            dataObj["ctnm"] = data[j]["text"];
                        } else if (column == "INS_ST_DT") {
                            dataObj["insstdt"] = data[j]["text"];
                        } else if (column == "INS_END_DT") {
                            dataObj["inenddt"] = data[j]["text"];
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
                        console.log("Alreaday exist Column(KEY) : " + data[j]["column"] + " >> " + data[j]["text"]);
                    }
                }
            }
        }
    }
    //console.log("결과 : ");
    //console.log(dataObj);
    
    // BatchLearning Data Insert
    if (dataObj) {
        dataObj["fileToPage"] = ocrData.fileToPage;
       
        var param = { dataObj: dataObj };
        $.ajax({
            url: '/batchLearning/compareBatchLearningData',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            async: false,
            success: function (retData) {
                console.log(retData);
                if ($('#uiTrainingChk').is(':checked')) {// UI Training 체크박스 체크 있으면
                    ocrData.exeML = "Y";
                    isFullMatch = (dataObj.length != 53) ? false : true;
                    //ui팝업 로직
                    //if (retData.rows[0].IMGID == dataObj["imgId"]) {
                    //    if (retData.rows[0].NTBL != dataObj["NTBL"]) {
                    //        uiPopUpTrain(data, fileInfo);
                    //    }
                    //}
                } else {// UI Training 체크박스 체크 없으면
                    isFullMatch = true;
                    updateBatchLearningData(dataObj, ocrData.fileInfo, data);
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

function updateBatchLearningData(dataObj, fileInfo, mlData) {
    $.ajax({
        url: '/batchLearning/updateBatchLearningData',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ data: dataObj, fileInfos: fileInfo}),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            console.log("SUCCESS updateBatchLearningData : " + JSON.stringify(data));
            comparedMLAndAnswer(dataObj, mlData, fileInfo);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// ML 데이터와 정답 데이터를 비교해여 색상 표시
function comparedMLAndAnswer(dataObj, mlData, fileInfo) {
    console.log(dataObj);
    console.log(mlData);
    $('input[name="listCheck_before"]').each(function (index, element) {
        for (var i in fileInfo) {
            if ($(this).val() == fileInfo[i].imgId) {
                var targetTdNumArr = [];
                for (var j in mlData) {
                    // 라벨 맵핑에서 컬럼명 정해지면 이부분 수정 필요 -- 07.30 hyj
                    if (!dataObj.entryNo) targetTdNumArr.push(3);
                    if (!dataObj.statementDiv) targetTdNumArr.push(4);
                    if (!dataObj.contractNum) targetTdNumArr.push(5);
                    if (!dataObj.ogCompanyCode) targetTdNumArr.push(6);
                    if (!dataObj.ogCompanyName) targetTdNumArr.push(7);
                    if (!dataObj.brokerCode) targetTdNumArr.push(8);
                    if (!dataObj.brokerName) targetTdNumArr.push(9);
                    if (!dataObj.ctnm) targetTdNumArr.push(10);
                    if (!(mlData[j].column == 'INS_ST_DT_VALUE' && dataObj.insstdt == mlData[j].text)) targetTdNumArr.push(11);
                    if (!dataObj.insenddt) targetTdNumArr.push(12);
                    if (!dataObj.uy) targetTdNumArr.push(13);
                    if (!dataObj.curcd) targetTdNumArr.push(14);
                    if (!dataObj.paidPercent) targetTdNumArr.push(15);
                    if (!dataObj.paidShare) targetTdNumArr.push(16);
                    if (!dataObj.oslPercent) targetTdNumArr.push(17);
                    if (!dataObj.oslShare) targetTdNumArr.push(18);
                    if (!dataObj.grosspm) targetTdNumArr.push(19);
                    if (!dataObj.pm) targetTdNumArr.push(20);
                    if (!dataObj.pmPFEnd) targetTdNumArr.push(21);
                    if (!dataObj.pmPFWos) targetTdNumArr.push(22);
                    if (!dataObj.xolPm) targetTdNumArr.push(23);
                    if (!dataObj.returnPm) targetTdNumArr.push(24);
                    if (!dataObj.grosscn) targetTdNumArr.push(25);
                    if (!dataObj.cn) targetTdNumArr.push(26);
                    if (!dataObj.profitcn) targetTdNumArr.push(27);
                    if (!dataObj.brokerAge) targetTdNumArr.push(28);
                    if (!dataObj.tax) targetTdNumArr.push(29);
                    if (!dataObj.overridingCom) targetTdNumArr.push(30);
                    if (!dataObj.charge) targetTdNumArr.push(31);
                    if (!dataObj.pmReserveRTD) targetTdNumArr.push(32);
                    if (!dataObj.pfPmReserveRTD) targetTdNumArr.push(33);
                    if (!dataObj.pmReserveRTD1) targetTdNumArr.push(34);
                    if (!dataObj.pfPmReserveRTD2) targetTdNumArr.push(35);
                    if (!dataObj.claim) targetTdNumArr.push(36);
                    if (!dataObj.lossRecovery) targetTdNumArr.push(37);
                    if (!dataObj.cashLoss) targetTdNumArr.push(38);
                    if (!dataObj.cashLossRD) targetTdNumArr.push(39);
                    if (!dataObj.lossRR) targetTdNumArr.push(40);
                    if (!dataObj.lossRR2) targetTdNumArr.push(41);
                    if (!dataObj.lossPFEnd) targetTdNumArr.push(42);
                    if (!dataObj.lossPFWoa) targetTdNumArr.push(43);
                    if (!dataObj.interest) targetTdNumArr.push(44);
                    if (!dataObj.taxOn) targetTdNumArr.push(45);
                    if (!dataObj.miscellaneous) targetTdNumArr.push(46);
                    if (!dataObj.pmbl) targetTdNumArr.push(47);
                    if (!dataObj.cmbl) targetTdNumArr.push(48);
                    if (!dataObj.ntbl) targetTdNumArr.push(49);
                    if (!dataObj.cscosarfrncnnt2) targetTdNumArr.push(50);
                }
                for (var j in targetTdNumArr) {
                    $(this).parent().parent().parent().parent().children('td').eq(targetTdNumArr[j]).css('background-color', 'red');
                }
                break;
            }
        }
    });
}

/*
// [UPDATE PARSING RESULT, UPDATE FILE INFO DB]
function updateBatchLearningData(fileNames, data) {
    console.log("updateBatchLearningData fileNames : " + fileNames);
    console.log("data : ");
    console.log(data);
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
*/

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
            $("#progressMsgTitle").html("retrieving learn data...");            
            startProgressBar(); // start progressbar
            addProgressBar(1, 1); // proceed progressbar
        },
        success: function (data) {
            //console.log(data);
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
                        <td>${nvl(entry.ORIGINFILENAME)}</td> <!--파일명-->
                        <td>${nvl(entry.STATUS)}</td> <!--학습여부-->
                        <td>${nvl(entry.OGCOMPANYNAME)}</td> <!--출재사명-->
                        <td>${nvl(entry.UY)}</td> <!--UY-->
                        <td>${nvl(entry.OGCONTRACTNAME)}</td> <!--계약명원본-->
                        <td>${nvl(entry.CONTRACTNAMESUMMARY)}</td> <!--계약명요약-->
                        <td>${nvl(entry.OSLPERCENT)}</td> <!--OSL(100%)-->
                        <td>${nvl(entry.OSLSHARE)}</td> <!--OSL(Our Share)-->


                        <td>${nvl(entry.IMGID)}</td> <!--이미지ID-->
                        <td>${nvl(entry.STATEMENTDIV)}</td> <!--계산서 구분-->
                        <td>${nvl(entry.CONTRACTNUM)}</td> <!--계약번호-->
                        <td>${nvl(entry.OGCOMPANYCODE)}</td> <!--출재사코드-->
                        <td>${nvl(entry.BROKERCODE)}</td> <!--중개사코드-->
                        <td>${nvl(entry.BROKERNAME)}</td> <!--중개사명-->
                        <td>${nvl(entry.INSSTDT)}</td> <!--보험개시일-->
                        <td>${nvl(entry.INSENDDT)}</td> <!--보험종료일-->
                        <td>${nvl(entry.CURCD)}</td> <!--화폐코드-->
                        <td>${nvl(entry.PAIDPERCENT)}</td> <!--Paid(100%)-->
                        <td>${nvl(entry.PAIDSHARE)}</td> <!--Paid(Our Share)-->
                        <td>${nvl(entry.GROSSPM)}</td> <!--GROSS PREMIUM-->
                        <td>${nvl(entry.PM)}</td> <!--PREMIUM-->
                        <td>${nvl(entry.PMPFEND)}</td> <!--PREMIUM P/F ENT-->
                        <td>${nvl(entry.PMPFWOS)}</td> <!--PREMIUM P/F WOS-->
                        <td>${nvl(entry.XOLPM)}</td> <!--XOL PREMIUM-->
                        <td>${nvl(entry.RETURNPM)}</td> <!--RETURN PREMIUM-->
                        <td>${nvl(entry.GROSSCN)}</td> <!--GROSS COMMISION-->
                        <td>${nvl(entry.CN)}</td> <!--COMMISSION-->
                        <td>${nvl(entry.PROFITCN)}</td> <!--PROFIT COMMISION-->
                        <td>${nvl(entry.BROKERAGE)}</td> <!--BROKERAGE-->
                        <td>${nvl(entry.TAX)}</td> <!--TEX-->
                        <td>${nvl(entry.OVERRIDINGCOM)}</td> <!-- OVERIDING COM-->
                        <td>${nvl(entry.CHARGE)}</td> <!--CHARGE-->
                        <td>${nvl(entry.PMRESERVERTD)}</td> <!--PREMIUM RESERVE RTD-->
                        <td>${nvl(entry.PFPMRESERVERTD)}</td> <!--P/F PREMIUM RESERVE RTD-->
                        <td>${nvl(entry.PMRESERVERTD2)}</td> <!--P/F PREMIUM RESERVE RLD-->
                        <td>${nvl(entry.PFPMRESERVERTD2)}</td> <!--P/F PREMIUM RESERVE RLD-->
                        <td>${nvl(entry.CLAIM)}</td> <!--CLAIM -->
                        <td>${nvl(entry.LOSSRECOVERY)}</td> <!--LOSS RECOVERY -->
                        <td>${nvl(entry.CASHLOSS)}</td> <!--CASH LOSS -->
                        <td>${nvl(entry.CASHLOSSRD)}</td> <!--CASH LOSS REFUND -->
                        <td>${nvl(entry.LOSSRR)}</td> <!--LOSS RESERVE RTD -->
                        <td>${nvl(entry.LOSSRR2)}</td> <!--LOSS RESERVE RLD -->
                        <td>${nvl(entry.LOSSPFEND)}</td> <!--LOSS P/F ENT -->
                        <td>${nvl(entry.LOSSPFWOA)}</td> <!--LOSS P/F WOA -->
                        <td>${nvl(entry.INTEREST)}</td> <!--INTEREST -->
                        <td>${nvl(entry.TAXON)}</td> <!--TAX ON -->
                        <td>${nvl(entry.MISCELLANEOUS)}</td> <!--MISCELLANEOUS -->
                        <td>${nvl(entry.PMBL)}</td> <!--PREMIUM BALANCE -->
                        <td>${nvl(entry.CMBL)}</td> <!--CLAM BALANCE -->
                        <td>${nvl(entry.NTBL)}</td> <!--NET BALANCE -->
                        <td>${nvl(entry.CSCOSARFRNCNNT2)}</td> <!--YOUR REF -->
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
            //$("#progressMsgTitle").html("retrieving learn data...");
            //startProgressBar(); // start progressbar
            //addProgressBar(0, 30); // proceed progressbar
        },
        success: function (data) {
            //$("#progressMsgTitle").html("processing learn data...");
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
    let imgId = "";
    let chkCnt = 0;
    //테스트용
    /*
    $("input[name=listCheck_before]").each(function (index, entry) {
        if ($(this).is(":checked")) {
            imgId = $(this).val();
            chkCnt++;
        }
    });
    imgIdArray.push(imgId);
    processImage_TEST("26.jpg");
    */
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
var fn_batchUiTraining = function () {
    var dataObj = {};
    //dataObj["imgId"] = $("#imgId").val();
    //dataObj["imgFileStartNo"] = $("#imgFileStartNo").val();
    //dataObj["imgFileEndNo"] = $("#imgFileEndNo").val();
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

    for (var num in ocrPopData) {
        if (ocrPopData[num].column == "CSCO_NM_VALUE") {
            if (ocrPopData[num].text != $("#cscoNm").val()) {
                ocrPopData[num].transText = $("#cscoNm").val();
            }
        } else if (ocrPopData[num].column == "CT_NM_VALUE") {
            if (ocrPopData[num].text != $("#ctNm").val()) {
                ocrPopData[num].transText = $("#ctNm").val();
            }
        } else if (ocrPopData[num].column == "INS_ST_DT_VALUE") {
            if (ocrPopData[num].text != $("#insStDt").val()) {
                ocrPopData[num].transText = $("#insStDt").val();
            }
        } else if (ocrPopData[num].column == "INS_END_DT_VALUE") {
            if (ocrPopData[num].text != $("#insEndDt").val()) {
                ocrPopData[num].transText = $("#insEndDt").val();
            }
        } else if (ocrPopData[num].column == "CUR_CD_VALUE") {
            if (ocrPopData[num].text != $("#curCd").val()) {
                ocrPopData[num].transText = $("#curCd").val();
            }
        } else if (ocrPopData[num].column == "PRE_VALUE") {
            if (ocrPopData[num].text != $("#pre").val()) {
                ocrPopData[num].transText = $("#pre").val();
            }
        } else if (ocrPopData[num].column == "COM_VALUE") {
            if (ocrPopData[num].text != $("#com").val()) {
                ocrPopData[num].transText = $("#com").val();
            }
        } else if (ocrPopData[num].column == "BRKG_VALUE") {
            if (ocrPopData[num].text != $("#brkg").val()) {
                ocrPopData[num].transText = $("#brkg").val();
            }
        } else if (ocrPopData[num].column == "TXAM_VALUE") {
            if (ocrPopData[num].text != $("#txam").val()) {
                ocrPopData[num].transText = $("#txam").val();
            }
        } else if (ocrPopData[num].column == "PRRS_CF_VALUE") {
            if (ocrPopData[num].text != $("#prrsCf").val()) {
                ocrPopData[num].transText = $("#prrsCf").val();
            }
        } else if (ocrPopData[num].column == "PRRS_RLS_VALUE") {
            if (ocrPopData[num].text != $("#prrsRls").val()) {
                ocrPopData[num].transText = $("#prrsRls").val();
            }
        } else if (ocrPopData[num].column == "CLA_VALUE") {
            if (ocrPopData[num].text != $("#cla").val()) {
                ocrPopData[num].transText = $("#cla").val();
            }
        } else if (ocrPopData[num].column == "EXEX_VALUE") {
            if (ocrPopData[num].text != $("#exex").val()) {
                ocrPopData[num].transText = $("#exex").val();
            }
        } else if (ocrPopData[num].column == "SVF_VALUE") {
            if (ocrPopData[num].text != $("#svf").val()) {
                ocrPopData[num].transText = $("#svf").val();
            }
        } else if (ocrPopData[num].column == "CAS_VALUE") {
            if (ocrPopData[num].text != $("#cas").val()) {
                ocrPopData[num].transText = $("#cas").val();
            }
        } else if (ocrPopData[num].column == "NTBL_VALUE") {
            if (ocrPopData[num].text != $("#ntbl").val()) {
                ocrPopData[num].transText = $("#ntbl").val();
            }
        } else if (ocrPopData[num].column == "CSCO_SA_RFRN_CNNT2_VALUE") {
            if (ocrPopData[num].text != $("#cscoSaRfrnCnnt2").val()) {
                ocrPopData[num].transText = $("#cscoSaRfrnCnnt2").val();
            }
        }
    }

    var param = { "dataObj": ocrPopData };

    $.ajax({
        url: '/batchLearning/uiTrainBatchLearningData',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            console.log("SUCCESS updateBatchLearningData : " + JSON.stringify(data));
            alert("UI학습이 완료되었습니다.");
            execBatchLearning();
            $("#layer2.poplayer").css("display", "none");
            //popupEvent.closePopup();
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
            $("#progressMsgTitle").html("이미지를 분석 중 입니다.");
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

// OCR API TEST
function processImage_TEST(fileName) {
    var subscriptionKey = "7d51f1308c8848f49db9562d1dab7184";
    var uriBase = "https://westus.api.cognitive.microsoft.com/vision/v1.0/ocr";

    var params = {
        "language": "unk",
        "detectOrientation": "true",
    };

    var sourceImageUrl = 'http://kr-ocr.azurewebsites.net/uploads/' + fileName;

    $('#progressMsgTitle').html('OCR 처리 중..');
    $('#loadingDetail').html(sourceImageUrl);

    $.ajax({
        url: uriBase + "?" + $.param(params),
        beforeSend: function (jqXHR) {
            jqXHR.setRequestHeader("Content-Type", "application/json");
            jqXHR.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
        },
        type: "POST",
        data: '{"url": ' + '"' + sourceImageUrl + '"}',
    }).done(function (data) {
        console.log('ocr api test');
        appendOcrDataTEST(fileName, data.regions);
    }).fail(function (jqXHR, textStatus, errorThrown) {
        var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
            jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
        alert(errorString);
    });
};

function appendOcrDataTEST(fileName, regions) {
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
        data: JSON.stringify({ 'fileName': fileName, 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
        },
        success: function (data) {
            console.log(data);
            uiTrainPopupTEST(fileName, data);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

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


