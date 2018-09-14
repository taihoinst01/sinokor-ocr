//import { identifier } from "babel-types";

"use strict";

var exeBatchLearningCount = 0 // 배치실행 횟수
var totCount = 0; // 총 이미지 분석 개수
var ocrCount = 0; // ocr 수행 횟수
var batchCount = 0; // ml 학습 횟수
var updateBatchLearningDataCount = 0;

var progressId; // progress Id
var grid;
var isFullMatch = true; // UI training 체크 중 모든 컬럼 매치 유무
var modifyData = []; // UI 수정할 데이터 
var columnArr = []; // 컬럼 데이터

var ocrDataArr = []; //ocr 학습한 데이터 배열

var addCond = "LEARN_N"; // LEARN_N:학습미완료, LEARN_Y:학습완료, default:학습미완료
var startNum = 0;
var moreNum = 20;
var uiFlag = "N";

var ocrPopData; //UI Popup DATA

var docPopImages; // 문서조회팝업 이미지 리스트
var docPopImagesCurrentCount = 1; // 문서조회팝업 이미지 현재 카운트

$(function () {
    _init();
    //viewServerFileTest();
});

// [Select Event]
var selectViewCount = function (value) {
    $("#select_view_count").val(value);
    searchBatchLearnDataList(addCond);
};

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
    /*
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
    */
};

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

    // Add Training
    $("#btn_AddTraining").on("click", function () {
        fn_addTraining();
    });

    /*$(".poplayer .bg").on("click", function () {
        popupEvent.closePopup();
    });*/

    // [UI학습팝업] 학습 진행closePopup
    $("#btn_pop_ui_run").on("click", function () {
        popupEvent.closePopup();
    });
    // [UI학습팝업] close popup
    $("#btn_pop_ui_close").on("click", function () {
        popupEvent.batchClosePopup();
    });

    // UI train 실행
    $('#uiTrainBtn').on("click", function () {
        modifyTextData();
        /*
        var docData = modifyData.docCategory;
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

    //layer4 라디오버튼
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
        } else if (chkValue == '3') {
            $('#notInvoice').show();
            $('#orgDocName').hide();
            $('#newDocName').hide();
        }
    })
};

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
    };

    // open popup
    var openPopup = function () {

        var hasCheck = false;
        $('input[name="listCheck_before"]').each(function (index, element) {
            if ($(this).is(":checked")) {
                hasCheck = true;
                return false;
            }
        });

        if (hasCheck) {
            $('#selectFileLearning').click();
        } else {
            $('#allLaerning').click();
        }
        layer_open('layer1');
    };

    // close popup
    var closePopup = function () {
        $('.poplayer').fadeOut();
    };

    var batchClosePopup = function (type) {
        $('.poplayer').fadeOut();
        /*
        setTimeout(function () {
            if (!type) {
                exeBatchLearningCount++;
            }
            execBatchLearning();
        }, 2000);
        */
    };

    return {
        scrollPopup: scrollPopup,
        openPopup: openPopup,
        closePopup: closePopup,
        batchClosePopup: batchClosePopup
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
            //addProgressBar(1, 99);
        },
        success: function (data) {
            console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));
            if (data["code"] == "200") {
                if (data["fileCnt"] > 0 || data["dataCnt"] > 0) {
                    alert("엑셀 파일의 정답 데이터가 INSERT 되었습니다.");
                } else {
                    alert("INSERT 할 파일이 없습니다.");
                }
            } else {
                alert("엑셀 파일 업로드 중 오류가 발생하였습니다.");
            }
            $('#btn_excelUpload').removeClass('on');
        },
        error: function (err) {
            $('#btn_excelUpload').removeClass('on');
            console.log(err);
        }
    });
};
// excel upload (deprecate)
var excelUploadEvent = function () {
    var multiUploadForm = $("#multiUploadForm");

    $('#excel_file').on("change", function () {
        //startProgressBar();
        //addProgressBar(1, 5);
        multiUploadForm.attr("action", "/batchLearning/excelUpload");
        if ($(this).val() !== '') {
            multiUploadForm.submit();
        }
    });

    // FILE UPLOAD
    fileUpload();
};

function fileUpload() {
    var multiUploadForm = $("#multiUploadForm");
    multiUploadForm.ajaxForm({
        beforeSubmit: function (data, frm, opt) {
            $("#progressMsgTitle").html("Preparing to upload files...");
            progressId = showProgressBar();
            //startProgressBar();
            //addProgressBar(6, 99);
            return true;
        },
        success: function getData(responseText, statusText) {
            if (responseText.type == 'excel') {
                console.log("upload excel data : " + JSON.stringify(responseText));
                $("#progressMsgTitle").html("uploading excel files...");
                endProgressBar(progressId);
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
                    if (i === (totCount - 1)) {
                        lastYN = true;
                        alert("등록이 완료되었습니다.");
                        endProgressBar(progressId);
                    }
                    //insertFileDB(responseText.fileInfo[i], responseText.message[i], lastYN); // FILE INFO INSERT
                    insertBatchLearningBaseData(responseText.fileInfo[i], responseText.message[i], lastYN);  // BATCH LEARNING BASE DATA INSERT
                }
                //endProgressBar();
            }
        },
        error: function (e) {
            console.log("File upload failed : " + e);
            endProgressBar(progressId);
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
                //addProgressBar(81, 90);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
};

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
                //addProgressBar(91, 100);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));
                endProgressBar();
                if (lastYN) {
                    //alert("파일 등록이 완료되었습니다.");
                    searchBatchLearnDataList("LEARN_N");
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
};

// UPLOAD IMAGE ON SERVER
var imageUploadEvent = function () {
    var multiUploadForm = $("#multiUploadForm");

    $('#document_file').on("change", function () {
        //startProgressBar();
        //addProgressBar(1, 5);
        //multiUploadForm.attr("action", "/batchLearning/imageUpload");
        progressId = showProgressBar();
        multiUploadForm.attr("action", "/common/imageUpload");
        if ($(this).val() !== '') {
            multiUploadForm.submit();
        }
    });
    // FILE UPLOAD
    fileUpload();
};

// batch learning 4 [파일정보 -> OCR API]
function processImage(fileInfo, fileName, lastYn, answerRows, fileToPage) {
    //console.log("processImage fileInfo : " + JSON.stringify(fileInfo));
    //console.log("processImage fileName : " + fileName);
    //console.log("processImage lastYn : " + lastYn);
    //console.log("processImage answerRows : " + JSON.stringify(answerRows));

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
        //console.log(data);
        if (!data.code) { // 에러가 아니면
            /*
            ocrDataArr.push({
                fileInfo: [fileInfo],
                fileName: [fileName],
                regions: data.regions,
                lastYn: lastYn
            });
            */
            if (ocrCount == 1) {
                if (fileToPage.length > 0) {
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
                    ocrDataArr.push({
                        fileInfo: [fileInfo],
                        fileName: [fileName],
                        regions: data.regions,
                        fileToPage: [],
                        lastYn: lastYn
                    });
                }
            } else {
                if (fileToPage.length > 0) {
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
                } else {
                    ocrDataArr.push({
                        fileInfo: [fileInfo],
                        fileName: [fileName],
                        regions: data.regions,
                        lastYn: lastYn
                    });
                }
            }
            //console.log(ocrDataArr);
            if (totCount == ocrCount) {
                $("#progressMsgTitle").html("processing ML ...");
                //addProgressBar(51, 80);

                setTimeout(function () {
                    execBatchLearning();
                    ocrCount = 0;
                    totCount = 0;
                }, 1500);
            }
            //execBatchLearningData(fileInfo, fileName, data.regions, lastYn); // goto STEP 3
        } else if (data.error) { //ocr 이외 에러이면
            endProgressBar(progressId);
            alert(data.error);
        } else { // ocr 에러 이면
            insertCommError(data.code, 'ocr');
            endProgressBar(progressId);
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

function convertLineOcrData(ocrData) {
    var convertArr = [];

    for (var j in ocrData.regions) {
        var regionsItem = ocrData.regions[j];
        for (var k in regionsItem.lines) {
            var linesItem = regionsItem.lines[k];
            var item = '';
            for (var m in linesItem.words) {
                item += linesItem.words[m].text + ' ';
            }
            convertArr.push({ 'location': linesItem.boundingBox, 'text': item.trim() });
        }
    }

    return convertArr;
}

//batch learning 5 
function execBatchLearning() {
    var dataArr = convertOcrData();
    if (exeBatchLearningCount <= ocrDataArr.length - 1) {

        for (var i = exeBatchLearningCount; i < ocrDataArr.length; i++) {
            exeBatchLearningCount = i;
            execBatchLearningData(ocrDataArr[i], dataArr[i]);
            if ($('#layer2').css('display') != 'none') break;
            if (isFullMatch) { // 모든 컬럼 매핑이 되었거나 계산서가 아닌 경우
            } else {
                endProgressBar(progressId);
                popUpLayer2(ocrDataArr[i]);
                break;
            }

            if (ocrDataArr.length - 1 == i) {
                ocrDataArr = [];
                searchBatchLearnDataList(addCond);
            }
        }
    }
}

// UI레이어 작업 함수
function popUpLayer2(ocrData, legacy) {
    ocrDataArr = [];
    fn_initUiTraining(); // 팝업 초기화
    layer_open('layer2'); // ui 학습레이어 띄우기
    //$("#layer2.poplayer").css("display", "block");

    if (modifyData.docCategory != undefined) {
        $('#docName').text(modifyData.docCategory[0].DOCNAME);
        $('#docPredictionScore').text(modifyData.score + '%');
        if (modifyData.score >= 90) {
            $('#docName').css('color', 'dodgerblue');
            $('#docPredictionScore').css('color', 'dodgerblue');
        } else {
            $('#docName').css('color', 'darkred');
            $('#docPredictionScore').css('color', 'darkred');
        }
    }

    $('#imgNameTag').text(ocrData.fileInfo[0].convertFileName);

    var mainImgHtml = '';
    mainImgHtml += '<div id="mainImage" class="ui_mainImage">';
    mainImgHtml += '<div id="redNemo">';
    mainImgHtml += '</div>';
    mainImgHtml += '</div>';
    mainImgHtml += '<div id="imageZoom" ondblclick="viewOriginImg()">';
    mainImgHtml += '<div id="redZoomNemo">';
    mainImgHtml += '</div>';
    mainImgHtml += '</div>';
    $('#img_content').html(mainImgHtml);
    $('#mainImage').css('background-image', 'url("../../uploads/' + ocrData.fileInfo[0].convertFileName + '")');

    var tblTag = '';
    for (var i in modifyData.data) {
        tblTag += '<dl>';
        tblTag += '<dt onclick="zoomImg(this)">';
        tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
        tblTag += '<input type="text" value="' + modifyData.data[i].text + '" style="width:100%; border:0;" />';
        tblTag += '<input type="hidden" value="' + modifyData.data[i].location + '" />';
        tblTag += '</label>';
        tblTag += '</dt>';
        tblTag += '<dd>';
        tblTag += appendOptionHtml((modifyData.data[i].colLbl != undefined) ? modifyData.data[i].colLbl : 36, columnArr)
        tblTag += '</dd>';
        tblTag += '</dl>';
    }
    $('#textResultTbl').append(tblTag);

    popupLegacy(legacy);
}

function popupLegacy(legacy) {

    console.log(legacy);

    var appendHtml = '';

    if (legacy.data.length > 0) {
        for (var i = 0; i < legacy.data.length; i++) {
            appendHtml +=
                '<tr>' +
                '<td scope="row">' + nvl(legacy.data[i].CONTRACTNUM) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].CTNM) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].OGCOMPANYCODE) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].OGCOMPANYNAME) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].BROKERCODE) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].BROKERNAME) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].INSSTDT) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].INSENDDT) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].CURCD) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].PAIDPERCENT) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].PAIDSHARE) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].GROSSPM) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].PM) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].PMPFEND) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].PMPFWOS) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].XOLPM) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].RETURNPM) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].GROSSCN) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].CN) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].PROFITCN) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].BROKERAGE) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].TAX) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].OVERRIDINGCOM) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].CHARGE) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].PMRESERVERTD1) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].PFPMRESERVERTD1) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].PMRESERVERTD2) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].PFPMRESERVERTD2) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].CLAIM) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].LOSSRECOVERY) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].CASHLOSS) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].CASHLOSSRD) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].LOSSRR) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].LOSSRR2) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].LOSSPFEND) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].LOSSPFWOA) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].INTEREST) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].TAXON) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].MISCELLANEOUS) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].PMBL) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].CMBL) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].NTBL) + '</td>' +
                '<td scope="row">' + nvl(legacy.data[i].CSCOSARFRNCNNT2) + '</td>' +
                '</tr>';
        }
    } else {
        appendHtml += '<tr><td colspan="46">정답 데이터가 없습니다.</td></tr>';
    }

    $("#tbody_batchList_answer2").empty().append(appendHtml);

    /*
        var settings = 'toolbar=0,directories=0,status=no,menubar=0,scrollbars=auto,resizable=no,height=400,width=600,left=0,top=0';
        var title = "test";
        var windowObj;
        var windowObj = window.open("batchLearning/popUpLegacy", title, settings);
        var form = document.createElement("form");
        form.target = title;
        form.method = "POST";
        form.action = "batchLearning/popUpLegacy"; 
    
        var element1 = document.createElement("input");
    
        element1.value = "un";
        element1.name = "un";
        form.appendChild(element1);
    
        document.body.appendChild(form);
    
        form.submit();
    */
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

function execBatchLearningData(ocrData, data) {
    var learningUrl = (uiFlag == 'Y') ? '/batchLearning/execBatchLearningData2' : '/batchLearning/execBatchLearningData';

    $.ajax({
        url: learningUrl,
        type: 'post',
        datatype: "json",
        timeout: 0,
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        async: false,
        beforeSend: function () {
        },
        success: function (data) {
            //console.log(data);

            modifyData = $.extend({}, data);
            batchCount++;

            selectTypoText(ocrData, data);
            /*
            if (data.docCategory && data.docCategory.DOCTYPE == 2) {
                var docData = data.data;
                for (var i in docData) {
                    data.data = docData[i];
                    if (i > 0) {
                        ocrData.fileToPage.IMGFILEENDNO = ocrData.fileToPage.IMGFILEENDNO + 1;
                        ocrData.fileToPage.IMGFILESTARTNO = ocrData.fileToPage.IMGFILESTARTNO + 1;
                    }
                    compareBatchLearningData(ocrData, data);
                }
            } else {
                compareBatchLearningData(ocrData, data);
            }
            */
        },
        error: function (err) {
            console.log(err);
            popUpLayer2(ocrData);
        }
    });

}

// html 렌더링 전처리 (출재사명, 계약명, 화폐코드 처리)
function selectTypoText(ocrData, data) {

    $.ajax({
        url: 'common/selectTypoData',
        type: 'post',
        datatype: 'json',
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (result) {
            data.data = result.data;

            if (data.docCategory && data.docCategory.DOCTYPE == 2) {
                var docData = data.data;
                for (var i in docData) {
                    data.data = docData[i];
                    if (i > 0) {
                        ocrData.fileToPage.IMGFILEENDNO = ocrData.fileToPage.IMGFILEENDNO + 1;
                        ocrData.fileToPage.IMGFILESTARTNO = ocrData.fileToPage.IMGFILESTARTNO + 1;
                    }
                    compareBatchLearningData(ocrData, data);
                }
            } else {
                compareBatchLearningData(ocrData, data);
            }

        },
        error: function (err) {
            console.log(err);
        }
    });
}

function compareBatchLearningData(ocrData, data) {
    var dataObj = {};
    var dataVal = data.data;

    $.ajax({
        url: '/batchLearning/selectColMappingCls',
        type: 'post',
        datatype: "json",
        contentType: 'application/json; charset=UTF-8',
        async: false,
        success: function (columns) {
            columnArr = columns.data;

            var param = { data: ocrData };
            $.ajax({
                url: '/batchLearning/selectBatchAnswerData',
                type: 'post',
                datatype: "json",
                data: JSON.stringify(param),
                contentType: 'application/json; charset=UTF-8',
                async: false,
                success: function (retData) {
                    uiFlag = "N";
                    endProgressBar(progressId);
                    popUpLayer2(ocrData, retData);
                }

            });

            /*
            for (var i = 0; i < dataVal.length; i++) {
                var location = dataVal[i].location;
                var text = dataVal[i].text;
                var column = dataVal[i].colLbl;

                if (column != 999) {
                    for (var j in columnArr) {
                        if (column == columnArr[j].COLNUM) {
                            if (dataObj[column]) {
                                if (typeof dataObj[columnArr[j].COLTYPE] == 'string') {
                                    dataObj[columnArr[j].COLTYPE] = [dataObj[columnArr[j].COLTYPE]]
                                }
                                dataObj[columnArr[j].COLTYPE].push(dataVal[i].text);
                            } else {
                                dataObj[columnArr[j].COLTYPE] = dataVal[i].text;
                            }
                            break;
                        }
                    }
                }
            }

            // BatchLearning Data Insert
            if (dataObj) {
                dataObj.fileToPage = ocrData.fileToPage;

                var param = { dataObj: dataObj };
                $.ajax({
                    url: '/batchLearning/compareBatchLearningData',
                    type: 'post',
                    datatype: "json",
                    data: JSON.stringify(param),
                    contentType: 'application/json; charset=UTF-8',
                    async: false,
                    success: function (retData) {
                        console.log("----- retData -----");
                        console.log(retData);
                        if (retData.isContractMapping && uiFlag == "N") {
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
                                updateBatchLearningData(retData, ocrData, data);
                            }
                        } else {
                            uiFlag = "N";
							endProgressBar();
                            popUpLayer2(ocrData);
                        }

                    },
                    error: function (err) {
                        console.log(err);
						endProgressBar();
                    }
                });
            }
            */



        }
    });

}

/*
// ML 데이터와 정답 데이터를 비교해여 색상 표시 v1.0
function comparedMLAndAnswer(retData, mlData, ocrData) {
    var answerData = retData.rows[0];   
    var fileInfo = ocrData.fileInfo;

    for (var i in mlData.data) {
        for (var j in columnArr) {
            if (mlData.data[i].column == columnArr[j].COLNUM) {
                mlData.data[i].columnName = columnArr[j].COLTYPE;
                break;
            }
        }
    }

    $('input[name="listCheck_before"]').each(function (index, element) {
        for (var i in fileInfo) {
            if ($(this).val() == fileInfo[i].imgId) {
                var matchingColumn = [];
                var targetTdNumArr = [];


                for (var answerKey in answerData) {
                    if (answerKey == 'EXTCTNM' || answerKey == 'EXTOGCOMPANYNAME' ||
                        answerKey == 'CTNM' || answerKey == 'OGCOMPANYNAME') {
                        matchingColumn.push({ 'column': answerKey, 'text': answerData[answerKey], 'isMapping': true });
                    }
                }
                for (var j in mlData.data) {
                    if (mlData.data[j].column != 999) {
                        for (var answerKey in answerData) {
                            if (answerKey == 'EXTCTNM' || answerKey == 'EXTOGCOMPANYNAME' ||
                                answerKey == 'CTNM' || answerKey == 'OGCOMPANYNAME' || answerKey == 'MAPPINGCTNM') {
                                continue;
                            }
                            if (mlData.data[j].columnName == answerKey) { // 컬럼이 같으면
                                if (mlData.data[j].text == answerData[answerKey]) { // 값이 같으면
                                    matchingColumn.push({ 'column': mlData.data[j].columnName, 'text': mlData.data[j].text, 'isMapping' : true });
                                } else { // 값이 다르면
                                    matchingColumn.push({ 'column': mlData.data[j].columnName, 'text': mlData.data[j].text, 'isMapping': false });
                                }
                                break;
                            }
                        }
                    }
                }

                
                for (var j in matchingColumn) {
                    if (typeof matchingColumn[j].text == 'string') {
                        $(this).parent().parent().parent().parent().children('td').eq(columToTableNumber(matchingColumn[j].column)).text(matchingColumn[j].text);
                    } else {
                        var ctnmSelectHTML = '<select>';
                        for (var k in matchingColumn[j].text) {
                            var seleted = (matchingColumn[j].text[k] == answerData.MAPPINGCTNM)? 'selected' : '';
                            var optionHTML = '<option value="' + matchingColumn[j].text[k] + '" ' + seleted +'>' + matchingColumn[j].text[k] + '</option>';
                            ctnmSelectHTML += optionHTML;
                        }
                        ctnmSelectHTML += '</select>';
                        $(this).parent().parent().parent().parent().children('td').eq(columToTableNumber(matchingColumn[j].column)).html(ctnmSelectHTML);
                    }
                    if (matchingColumn[j].isMapping) {
                        if (matchingColumn[j].column == 'CTNM' || matchingColumn[j].column == 'OGCOMPANYNAME') {
                            $(this).parent().parent().parent().parent().children('td').eq(columToTableNumber(matchingColumn[j].column)).css('background-color', 'lightgray');
                        }
                    } else {
                        $(this).parent().parent().parent().parent().children('td').eq(columToTableNumber(matchingColumn[j].column)).css('background-color', 'red');
                    }
                }
                for (var j = 0; j < $(this).parent().parent().parent().parent().children('td').length; j++) {                   
                    if ($(this).parent().parent().parent().parent().children('td').eq(j).text() == '') {
                        $(this).parent().parent().parent().parent().children('td').eq(j).css('background-color', 'red');
                    }
                }
                
				//mlData.data = matchingColumn;
                //updateBatchLearningData(retData, ocrData, mlData);
                break;
            }
        }
    });
}
*/

function columToTableNumber(column) {
    switch (column) {
        case 'EXTOGCOMPANYNAME':
            return 2;
        case 'EXTCTNM':
            return 3;
        case 'OGCOMPANYNAME':
            return 4;
        case 'CTNM':
            return 5;
        case 'UY':
            return 6;
        case 'OSLPERCENT':
            return 7;
        case 'OSLSHARE':
            return 8;
        case 'STATEMENTDIV':
            return 10;
        case 'CONTRACTNUM':
            return 11;
        case 'OGCOMPANYCODE':
            return 12;
        case 'BROKERCODE':
            return 13;
        case 'BROKERNAME':
            return 14;
        case 'INSSTDT':
            return 15;
        case 'INSENDDT':
            return 16;
        case 'CURCD':
            return 17;
        case 'PAIDPERCENT':
            return 18;
        case 'PAIDSHARE':
            return 19;
        case 'GROSSPM':
            return 20;
        case 'PM':
            return 21;
        case 'PMPFEND':
            return 22;
        case 'PMPFWOS':
            return 23;
        case 'XOLPM':
            return 24;
        case 'RETURNPM':
            return 25;
        case 'GROSSCN':
            return 26;
        case 'CN':
            return 27;
        case 'PROFITCN':
            return 29;
        case 'BROKERAGE':
            return 29;
        case 'TAX':
            return 30;
        case 'OVERRIDINGCOM':
            return 31;
        case 'CHARGE':
            return 32;
        case 'PMRESERVERTD1':
            return 33;
        case 'PFPMRESERVERTD1':
            return 34;
        case 'PMRESERVERTD2':
            return 35;
        case 'PFPMRESERVERTD2':
            return 36;
        case 'CLAIM':
            return 37;
        case 'LOSSRECOVERY':
            return 38;
        case 'CASHLOSS':
            return 39;
        case 'CASHLOSSRD':
            return 40;
        case 'LOSSRR':
            return 41;
        case 'LOSSRR2':
            return 42;
        case 'LOSSPFEND':
            return 43;
        case 'LOSSPFWOA':
            return 44;
        case 'INTEREST':
            return 45;
        case 'TAXON':
            return 46;
        case 'MISCELLANEOUS':
            return 47;
        case 'PMBL':
            return 48;
        case 'CMBL':
            return 49;
        case 'NTBL':
            return 50;
        case 'CSCOSARFRNCNNT2':
            return 51;
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
    layer_open('layer2');
    return;
}

function updateBatchLearningData(retData, ocrData, mlData) {

    $.ajax({
        url: '/batchLearning/updateBatchLearningData',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ mldata: mlData, ocrData: ocrData }),
        async: false,
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            console.log("SUCCESS updateBatchLearningData : " + JSON.stringify(data));
            updateBatchLearningDataCount++;
            if (totCount == updateBatchLearningDataCount) {
                $("#progressMsgTitle").html("update learn data...");
                //addProgressBar(81, 100);
                updateBatchLearningDataCount = 0;
            }
            //comparedMLAndAnswer(retData, mlData, ocrData.fileInfo);
        },
        error: function (err) {
            endProgressBar(progressId);
            console.log(err);
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
        var location = nvl(mlData["location"]);
        var label = nvl(mlData["label"]);
        var text = nvl(mlData["text"]);
        var column = nvl(mlData["column"]);
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
// main menu batch learning 1 [List] 배치학습데이터 조회
var searchBatchLearnDataList = function (addCond) {
    var param = {
        'startNum': startNum,
        'moreNum': nvl2($("#select_view_count").val(), 20),
        'addCond': nvl(addCond)
    };
    var appendHtml = "";
    var checkboxHtml = "";
    var appendLeftContentsHtml = '';
    var appendRightContentsHtml = '';
    $.ajax({
        url: '/batchLearning/searchBatchLearnDataList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsgTitle").html("retrieving learn data...");
            progressId = showProgressBar();
            //startProgressBar(); // start progressbar
            //addProgressBar(1, 1); // proceed progressbar
        },
        success: function (data) {
            console.log(data);
            var list = data.data;

            if (list.length != 0) {

                for (var i = 0; i < list.length; i++) {
                    var rows = list[i].rows;

                    if (addCond == "LEARN_N") checkboxHtml = '<td scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="' + nvl(rows[0].FILEPATH) + '" class="sta00" name="listCheck_before" /></td>';
                    else checkboxHtml = '<td scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="' + nvl(rows[0].FILEPATH) + '" class="stb00" name="listCheck_after" /></div></td>';

                    var trHeight = i == 0 ? 30 * (rows.length + 1) + rows.length : 30 * (rows.length + 1) + (rows.length + 1);
                    appendLeftContentsHtml += '<tr id="leftRowNum_' + i + '" style="height:' + trHeight + 'px;">' +
                        checkboxHtml +
                        '<td><a class="fileNamePath" data-filepath="' + nvl(rows[0].FILEPATH) + '" data-imgId="' + nvl(rows[0].IMGID) + '" ' +
                        'onclick = "javascript:fn_viewImageData(\'' + nvl(rows[0].FILEPATH) + '\',\'' + i + '\', \'' + nvl(rows[0].IMGID) + '\', this)" href = "javascript:void(0);" > ' + nvl(rows[0].FILENAME) + '</a ></td > < !--FILENAME--> ' +
                        '<td> ' + appendPredDoc(rows[0]) + ' </td> <!--doctype -->' +
                        '</tr>';

                    for (var y = 0; y < rows.length; y++) {
                        appendRightContentsHtml += '<tr class="rowNum' + i + '">' +
                            '<td>' + nvl(rows[y].OGCOMPANYNAME) + '</td> <!--출재사명-->' +
                            '<td>' + nvl(rows[y].CTNM) + '</td> <!--계약명-->' +
                            '<td>' + nvl(rows[y].UY) + '</td> <!--UY-->' +
                            '<td>' + nvl(rows[y].CURCD) + '</td> <!--화폐코드-->' +
                            '<td>' + nvl(rows[y].CURUNIT) + '</td> <!--화폐단위-->' +
                            '<td>' + nvl(rows[y].PAIDPERCENT) + '</td> <!--Paid(100%)-->' +
                            '<td>' + nvl(rows[y].PAIDSHARE) + '</td> <!--Paid(Our Share)-->' +
                            '<td>' + nvl(rows[y].OSLPERCENT) + '</td> <!--OSL(100%)-->' +
                            '<td>' + nvl(rows[y].OSLSHARE) + '</td> <!--OSL(Our Share)-->' +
                            '<td>' + nvl(rows[y].PM) + '</td> <!--PREMIUM-->' +
                            '<td>' + nvl(rows[y].PMPFEND) + '</td> <!--PREMIUM P/F ENT-->' +
                            '<td>' + nvl(rows[y].PMPFWOS) + '</td> <!--PREMIUM P/F WOS-->' +
                            '<td>' + nvl(rows[y].XOLPM) + '</td> <!--XOL PREMIUM-->' +
                            '<td>' + nvl(rows[y].RETURNPM) + '</td> <!--RETURN PREMIUM-->' +
                            '<td>' + nvl(rows[y].CN) + '</td> <!--COMMISSION-->' +
                            '<td>' + nvl(rows[y].PROFITCN) + '</td> <!--PROFIT COMMISION-->' +
                            '<td>' + nvl(rows[y].BROKERAGE) + '</td> <!--BROKERAGE-->' +
                            '<td>' + nvl(rows[y].TAX) + '</td> <!--TEX-->' +
                            '<td>' + nvl(rows[y].OVERRIDINGCOM) + '</td> <!-- OVERIDING COM-->' +
                            '<td>' + nvl(rows[y].CHARGE) + '</td> <!--CHARGE-->' +
                            '<td>' + nvl(rows[y].PMRESERVERTD) + '</td> <!--PREMIUM RESERVE RTD-->' +
                            '<td>' + nvl(rows[y].PFPMRESERVERTD) + '</td> <!--P/F PREMIUM RESERVE RTD-->' +
                            '<td>' + nvl(rows[y].PMRESERVERTD2) + '</td> <!--P/F PREMIUM RESERVE RLD-->' +
                            '<td>' + nvl(rows[y].PFPMRESERVERTD2) + '</td> <!--P/F PREMIUM RESERVE RLD-->' +
                            '<td>' + nvl(rows[y].CLAIM) + '</td> <!--CLAIM -->' +
                            '<td>' + nvl(rows[y].LOSSRECOVERY) + '</td> <!--LOSS RECOVERY -->' +
                            '<td>' + nvl(rows[y].CASHLOSS) + '</td> <!--CASH LOSS -->' +
                            '<td>' + nvl(rows[y].CASHLOSSRD) + '</td> <!--CASH LOSS REFUND -->' +
                            '<td>' + nvl(rows[y].LOSSRR) + '</td> <!--LOSS RESERVE RTD -->' +
                            '<td>' + nvl(rows[y].LOSSRR2) + '</td> <!--LOSS RESERVE RLD -->' +
                            '<td>' + nvl(rows[y].LOSSPFEND) + '</td> <!--LOSS P/F ENT -->' +
                            '<td>' + nvl(rows[y].LOSSPFWOA) + '</td> <!--LOSS P/F WOA -->' +
                            '<td>' + nvl(rows[y].INTEREST) + '</td> <!--INTEREST -->' +
                            '<td>' + nvl(rows[y].TAXON) + '</td> <!--TAX ON -->' +
                            '<td>' + nvl(rows[y].MISCELLANEOUS) + '</td> <!--MISCELLANEOUS -->' +
                            '<td>' + nvl(rows[y].CSCOSARFRNCNNT2) + '</td> <!--YOUR REF -->' +
                            '</tr>';
                    }
                    var mlData = data.mlData;
                    if (mlData.rows.length != 0) {
                        appendRightContentsHtml += '<tr class="mlTr mlRowNum' + i + '">' +
                            '<td>' + makeMLSelect(mlData.rows, 0, null, rows[0].FILEPATH) + '</td> <!--출재사명-->' +
                            '<td>' + makeMLSelect(mlData.rows, 1, null, rows[0].FILEPATH) + '</td> <!--계약명-->' +
                            '<td>' + makeMLSelect(mlData.rows, 2, null, rows[0].FILEPATH) + '</td> <!--UY-->' +
                            '<td>' + makeMLSelect(mlData.rows, 3, null, rows[0].FILEPATH) + '</td> <!--화폐코드-->' +
                            '<td>' + makeMLSelect(mlData.rows, 4, null, rows[0].FILEPATH) + '</td> <!--화폐단위-->' +
                            '<td>' + makeMLSelect(mlData.rows, 5, 0, rows[0].FILEPATH) + '</td> <!--Paid(100%)-->' +
                            '<td>' + makeMLSelect(mlData.rows, 6, 1, rows[0].FILEPATH) + '</td> <!--Paid(Our Share)-->' +
                            '<td>' + makeMLSelect(mlData.rows, 7, 2, rows[0].FILEPATH) + '</td> <!--OSL(100%)-->' +
                            '<td>' + makeMLSelect(mlData.rows, 8, 3, rows[0].FILEPATH) + '</td> <!--OSL(Our Share)-->' +
                            '<td>' + makeMLSelect(mlData.rows, 9, 4, rows[0].FILEPATH) + '</td> <!--PREMIUM-->' +
                            '<td>' + makeMLSelect(mlData.rows, 10, 5, rows[0].FILEPATH) + '</td> <!--PREMIUM P/F ENT-->' +
                            '<td>' + makeMLSelect(mlData.rows, 11, 6, rows[0].FILEPATH) + '</td> <!--PREMIUM P/F WOS-->' +
                            '<td>' + makeMLSelect(mlData.rows, 12, 7, rows[0].FILEPATH) + '</td> <!--XOL PREMIUM-->' +
                            '<td>' + makeMLSelect(mlData.rows, 13, 8, rows[0].FILEPATH) + '</td> <!--RETURN PREMIUM-->' +
                            '<td>' + makeMLSelect(mlData.rows, 14, 9, rows[0].FILEPATH) + '</td> <!--COMMISION -->' +
                            '<td>' + makeMLSelect(mlData.rows, 15, 10, rows[0].FILEPATH) + '</td> <!--PROFIT COMMISION-->' +
                            '<td>' + makeMLSelect(mlData.rows, 16, 11, rows[0].FILEPATH) + '</td> <!--BROKERAGE-->' +
                            '<td>' + makeMLSelect(mlData.rows, 17, 12, rows[0].FILEPATH) + '</td> <!--TEX-->' +
                            '<td>' + makeMLSelect(mlData.rows, 18, 13, rows[0].FILEPATH) + '</td> <!-- OVERIDING COM-->' +
                            '<td>' + makeMLSelect(mlData.rows, 19, 14, rows[0].FILEPATH) + '</td> <!--CHARGE-->' +
                            '<td>' + makeMLSelect(mlData.rows, 20, 15, rows[0].FILEPATH) + '</td> <!--PREMIUM RESERVE RTD-->' +
                            '<td>' + makeMLSelect(mlData.rows, 21, 16, rows[0].FILEPATH) + '</td> <!--P/F PREMIUM RESERVE RTD-->' +
                            '<td>' + makeMLSelect(mlData.rows, 22, 17, rows[0].FILEPATH) + '</td> <!--P/F PREMIUM RESERVE RLD-->' +
                            '<td>' + makeMLSelect(mlData.rows, 23, 18, rows[0].FILEPATH) + '</td> <!--P/F PREMIUM RESERVE RLD-->' +
                            '<td>' + makeMLSelect(mlData.rows, 24, 19, rows[0].FILEPATH) + '</td> <!--CLAIM -->' +
                            '<td>' + makeMLSelect(mlData.rows, 25, 20, rows[0].FILEPATH) + '</td> <!--LOSS RECOVERY -->' +
                            '<td>' + makeMLSelect(mlData.rows, 26, 21, rows[0].FILEPATH) + '</td> <!--CASH LOSS -->' +
                            '<td>' + makeMLSelect(mlData.rows, 27, 22, rows[0].FILEPATH) + '</td> <!--CASH LOSS REFUND -->' +
                            '<td>' + makeMLSelect(mlData.rows, 28, 23, rows[0].FILEPATH) + '</td> <!--LOSS RESERVE RTD -->' +
                            '<td>' + makeMLSelect(mlData.rows, 29, 24, rows[0].FILEPATH) + '</td> <!--LOSS RESERVE RLD -->' +
                            '<td>' + makeMLSelect(mlData.rows, 30, 25, rows[0].FILEPATH) + '</td> <!--LOSS P/F ENT -->' +
                            '<td>' + makeMLSelect(mlData.rows, 31, 26, rows[0].FILEPATH) + '</td> <!--LOSS P/F WOA -->' +
                            '<td>' + makeMLSelect(mlData.rows, 32, 27, rows[0].FILEPATH) + '</td> <!--INTEREST -->' +
                            '<td>' + makeMLSelect(mlData.rows, 33, 28, rows[0].FILEPATH) + '</td> <!--TAX ON -->' +
                            '<td>' + makeMLSelect(mlData.rows, 34, 29, rows[0].FILEPATH) + '</td> <!--MISCELLANEOUS -->' +
                            '<td>' + makeMLSelect(mlData.rows, 35, null, rows[0].FILEPATH) + '</td> <!--YOUR REF -->' +
                            '</tr>';
                    } else {
                        appendRightContentsHtml +=
                            '<tr class="mlTr mlRowNum' + i + '">' +
                            '<td colspan="36"></td>' +
                            '</tr>';

                    }
                }
            } else {
                appendLeftContentsHtml += '<tr style="height: 30px"><td colspan="3"></td></tr>'
                appendRightContentsHtml += '<tr><td colspan="36">조회할 데이터가 없습니다.</td></tr>';
            }
            //$(appendHtml).appendTo($("#tbody_batchList")).slideDown('slow');
            if (addCond == "LEARN_N") {
                $('#batch_left_contents_before').empty().append(appendLeftContentsHtml);
                $('#batch_right_contents_before').empty().append(appendRightContentsHtml);

                //$("#tbody_batchList_before").empty().append(appendHtml);
                //compareMLAndAnswer(data);
            } else {
                $('#batch_left_contents_after').empty().append(appendLeftContentsHtml);
                $('#batch_right_contents_after').empty().append(appendRightContentsHtml);
                //$("#tbody_batchList_after").empty().append(appendHtml);               
            }
            endProgressBar(progressId); // end progressbar
            checkboxEvent(); // refresh checkbox event
            $('input[type=checkbox]').ezMark();
            imgPopupEvent();
        },
        error: function (err) {
            endProgressBar(progressId); // end progressbar
            console.log(err);
        }

    });

    function makeLegacyData(object, colname, num) {
        var values = object[colname].split('||');
        return values[num] == "null" ? '' : values[num];
    }

    function makeMLSelect(mlData, colnum, entry, filepath) {

        var appendMLSelect = '<select>';
        var hasColvalue = false;
        for (var y = 0; y < mlData.length; y++) {

            if (mlData[y].FILEPATH == filepath) {
                if (mlData[y].COLLABEL == colnum && (mlData[y].COLLABEL <= 3 || mlData[y].COLLABEL >= 35)) {
                    hasColvalue = true;
                    appendMLSelect += '<option>' + mlData[y].COLVALUE + '</option>';
                } else if (mlData[y].COLLABEL == 37 && mlData[y].ENTRYLABEL == entry) {
                    hasColvalue = true;
                    appendMLSelect += '<option>' + mlData[y].COLVALUE + '</option>';
                }

            }
        }
        appendMLSelect += '</select>';

        return hasColvalue ? appendMLSelect : '';
    }
};

function appendPredDoc(data) {
    var returnString = '';
    if (data.DOCNAME) {
        returnString = '<input type="hidden" name="docType" class="docType" value="' + data.DOCTYPE + '" />';
        returnString += '<a onclick="javascript:fn_viewDoctypePop(this);" href="javascript:void(0);">' + data.DOCNAME + '</a>';
    } else {
        returnString = '<!--<a onclick="javascript:fn_viewDoctypePop(this);" href="javascript:void(0);"></a>-->';
    }

    return returnString;
}

function compareMLAndAnswer(mlData) {
    if (mlData.length != 0) {
        var queryIn = "(";
        for (var i in mlData) {
            queryIn += "'" + mlData[i].ORIGINFILENAME + "'";
            queryIn += (i == mlData.length - 1) ? "" : ",";
        }
        queryIn += ")";
        $.ajax({
            url: '/batchLearning/selectMultiBatchAnswerDataToFilePath',
            type: 'post',
            datatype: "json",
            data: JSON.stringify({ 'queryIn': queryIn }),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
            },
            success: function (data) {
                var tempArr = [];
                $('#tbody_batchList_before tr').each(function (i, el) {
                    for (var i in data) {
                        var isTraining = false;
                        if ($(el).children('td').eq(0).text().trim() == data[i].FILENAME) {

                            for (var j = 2; j < $(el).children('td').length; j++) {
                                if (j != 9 && $(el).children('td').eq(j).text() != '') {
                                    isTraining = true;
                                    break;
                                }
                            }
                            if (isTraining) {
                                var misMatch = [];
                                for (var j in mlData) {
                                    if (mlData[j].ORIGINFILENAME == data[i].FILENAME) {
                                        var keyArr = Object.keys(mlData[i]);
                                        for (var k in keyArr) {
                                            if (mlData[j][keyArr[k]] && data[i][keyArr[k]] && mlData[j][keyArr[k]] != '' &&
                                                data[i][keyArr[k]] != '' && data[i][keyArr[k]] != mlData[j][keyArr[k]]) {
                                                misMatch.push(keyArr[k]);
                                            }
                                        }

                                        for (var k in misMatch) {
                                            $(el).children('td').eq(columToTableNumber(misMatch[k])).css('background-color', 'red');
                                        }
                                        break;
                                    }
                                }
                                for (var j = 2; j < $(el).children('td').length; j++) {
                                    if ((j == 4 || j == 5) && $(el).children('td').eq(j).text() != '') {
                                        $(el).children('td').eq(j).css('background-color', 'lightgray');
                                        continue;
                                    }
                                    /*if ($(el).children('td').eq(j).text() == '') {
                                        $(el).children('td').eq(j).css('background-color', 'red');
                                    }*/
                                }
                            }
                            /*
                            mlData = tempArr;
                            // ML과 정답 데이터 값이 다른 것 표시                       
                            for (var i in mlData) {
                                var misMatch = [];
                                for (var j in data) {
                                    if (mlData[i].ORIGINFILENAME == data[j].FILENAME) {
                                        var keyArr = Object.keys(mlData[i]);
                                        for (var k in keyArr) {
                                            if (mlData[i][keyArr[k]] && data[j][keyArr[k]] && mlData[i][keyArr[k]] != '' &&
                                                data[j][keyArr[k]] != '' && data[j][keyArr[k]] != mlData[i][keyArr[k]]) {
                                                misMatch.push(keyArr[k]);
                                            }
                                        }
                                        for (var i in misMatch) {
                                            $(el).children('td').eq(columToTableNumber(misMatch[i])).css('background-color', 'red');
                                        }
                                        break;
                                    }
                                }
                            }
                            */
                            break;
                        }
                    }


                });
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
}

function fn_viewImageData(filepath, rowNum, imgId, obj) {

    var appendHtml = '';
    $('#tbody_batchList_answer').empty();
    var data = $('.rowNum' + rowNum);
    loadImage('/tif' + filepath, function (tifResult) {

        if (tifResult) {
            $(tifResult).css({
                "width": "100%",
                "height": "auto",
                "display": "block"
            }).addClass("preview");

            $('#div_view_image').empty().append(tifResult);
            $('#tbody_batchList_answer').append(data.clone());
            layer_open('layer3');
            $('#div_view_image').scrollTop(0);
            $('.batch_pop_divHeadScroll').scrollLeft(0);
            $('.batch_pop_divBodyScroll').scrollLeft(0);
            $('.batch_pop_divBodyScroll').scrollTop(0);

        } else {
            var deleteFlag = confirm("없는 파일입니다 삭제하시겠습니까?");
            if (deleteFlag == true) {
                var param = {
                    filepath: filepath,
                    imgId: imgId
                };
                $.ajax({
                    url: '/batchLearning/deleteAnswerFile',
                    type: 'post',
                    datatype: "json",
                    data: JSON.stringify(param),
                    contentType: 'application/json; charset=UTF-8',
                    beforeSend: function () {
                        progressId = showProgressBar();
                    },
                    success: function (data) {
                        alert("삭제되었습니다.");
                        endProgressBar(progressId);
                        $(obj).closest('tr').remove();
                        $('.rowNum' + rowNum).remove();
                        $('.mlRowNum' + rowNum).remove();
                        //searchBatchLearnDataList(addCond);
                    },
                    error: function (err) {
                        endProgressBar(progressId); // end progressbar
                        console.log(err);
                    }
                });
            } else {

            }
        }
    });

}

function imgPopupEvent() {
    //$('#tbody_batchList_before td > a').click(function () {
    //    $('#viewImage').attr('src', '../../uploads/' + $(this).text().split('.')[0] + '.jpg');
    //    layer_open('layer3');
    //});
}

// batch learning 2 배치학습데이터 조회
var searchBatchLearnData = function (imgIdArray, flag) {
    var param = {
        imgIdArray: imgIdArray
    };

    $.ajax({
        url: '/batchLearning/searchBatchLearnData',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $('#btn_pop_batch_close').click();
            $("#progressMsgTitle").html("retrieving learn data...");
            progressId = showProgressBar();
            //startProgressBar();
            //addProgressBar(0, 30);
        },
        success: function (data) {
            $("#progressMsgTitle").html("processing learn data...");
            //addProgressBar(31, 40);
            //console.log("/batchLearning/searchBatchLearnData result :");
            //console.log(data);           
            if (data.code == 400) {
                alert(data.msg);
                return;
            }

            if (flag == "PROCESS_IMAGE") {  // 배치학습 실행             
                $("#progressMsgTitle").html("processing OCR ...");
                //addProgressBar(41, 50);
                for (var i = 0, x = data.fileInfoList.length; i < x; i++) {
                    var lastYn = "N";
                    if (i == data.fileInfoList.length - 1) lastYn = "Y";
                    //processImage(data.fileInfoList[i], data.fileInfoList[i].convertFileName, lastYn, data.answerRows[i]);
                    processImage(data.fileInfoList[i], data.fileInfoList[i].convertFileName, lastYn, data.answerRows[i], data.fileToPage);
                }

            } else {
                alert("잘못된 요청입니다.");
                return;
            }

        },
        error: function (err) {
            endProgressBar(progressId); // end progressbar
            console.log(err);
        }
    });
};

// syncServerFile (서버의 이미지가 DB에 등록이 안되어있다면 DB에 등록처리)
var fn_syncServerFile = function () {
    var param = {};
    //startProgressBar(); // start progressbar
    //addProgressBar(1, 1); // proceed progressbar
    progressId = showProgressBar();
    $.ajax({
        url: '/batchLearning/syncFile',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        success: function (responseText, statusText) {
            console.log("responseText : " + JSON.stringify(responseText));
            console.log("file count : " + responseText.fileInfo.length);
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
                        //insertSyncFileDB(responseText.fileInfo[i], responseText.message[i], lastYN); // FILE INFO INSERT
                        //insertSyncBatchLearningBaseData(responseText.fileInfo[i], responseText.message[i], lastYN);  // BATCH LEARNING BASE DATA INSERT
                    }
                    //addProgressBar(2, 99);
                    resolve(responseText, statusText);
                });
                insertPromise.then(function (responseText, statusText) {
                    console.log(responseText);
                    var totCount = responseText.message.length;
                    for (var i = 0; i < totCount; i++) {
                        var lastYN = false;
                        if (i == (totCount - 1)) lastYN = true;
                        //insertSyncBatchLearningBaseData(responseText.fileInfo[i], responseText.message[i], lastYN);
                    }
                    alert("백그라운드에서 파일을 처리중입니다.");
                    //alert("완료");
                }, function (err) {
                    alert("파일 업로드에 실패했습니다.\n관리자에게 문의해주세요." + err);
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
};

// [imageUpload event]
// INSERT DB IMAGE
var insertSyncFileDB = function (fileInfo, fileName, lastYN) {
    if (fileInfo) {
        var param = { fileInfo: fileInfo };
        $.ajax({
            url: '/batchLearning/insertFileInfo',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(81, 90);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));
                //callback(fileInfo, fileName, lastYN,"true");
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
};

// INSERT DB BATCH LEARNING BASE DATA
var insertSyncBatchLearningBaseData = function (fileInfo, fileName, lastYN) {
    if (fileInfo) {
        var param = { fileInfo: fileInfo };
        $.ajax({
            url: '/batchLearning/insertBatchLearningBaseData',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(91, 100);
            },
            success: function (data) {
                console.log("SUCCESS insertBatchLearningBaseData : " + JSON.stringify(data));
                endProgressBar(progressId);
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
};

// 정답엑셀 업로드
var fn_rightExcelUpload = function () {

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
                    $('#btn_imageDelete').removeClass('on');
                },
                error: function (err) {
                    console.log(err);
                }
            });
        }
    } else {
        $('#btn_imageDelete').removeClass('on');
        alert("삭제할 파일이 선택되지 않았습니다.");
        return;
    }
};


//  batch learning 1 배치학습 실행
var fn_batchTraining = function () {
    //var top = ($(window).scrollTop() + ($(window).height() - $('#layerPopup').height()) / 2);
    popupEvent.openPopup();
};
var fn_popBatchRun = function () {
    exeBatchLearningCount = 0;
    var imgIdArray = [];
    var learningMethodNum = $("#learningMethodNum").val();

    switch (learningMethodNum) {
        case "0":        // 전체 학습
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
                //alert("Before Training 상태에서만 배치학습이 가능합니다.");
                //return;
            }
            break;
        case "1":        // 선택한 파일 학습
            if (addCond == "LEARN_N") {
                let chkCnt = 0;
                $("input[name=listCheck_before]").each(function (index, entry) {
                    if ($(this).is(":checked")) {
                        chkCnt++;
                        totCount++;
                        //imgIdArray.push($(this).val());
                        var filepath = $(this).val();
                        imgIdArray.push(filepath);
                    }
                });
                if (chkCnt == 0) {
                    alert("선택된 학습이 없습니다.");
                    return;
                } else {
                    //searchBatchLearnData(imgIdArray, "PROCESS_IMAGE");
                    batchLearnTraining(imgIdArray, "LEARN_N");
                }
            } else  if(addCond == "LEARN_Y"){
                let chkCnt = 0;
                $("input[name=listCheck_after]").each(function (index, entry) {
                    if ($(this).is(":checked")) {
                        chkCnt++;
                        totCount++;
                        var filepath = $(this).val();
                        imgIdArray.push(filepath);
                    }
                });
                if (chkCnt == 0) {
                    alert("선택된 학습이 없습니다.");
                    return;
                } else {
                    batchLearnTraining(imgIdArray, "LEARN_Y");
                }
            }
            break;
        case "2":        // 학습 범위 지정
            alert("준비중 입니다.");
            break;
        default:
            break;
    }
};

var fn_addTraining = function () {
    var filePathArray = [];
    var docTypeArray = [];

    let chkCnt = 0;
    let hasNoCheck = false;
    $("input[name=listCheck_before]:checked").each(function (index, entry) {
        chkCnt++;
        totCount++;
        //imgIdArray.push($(this).val());
        var filepath = $(this).val();
        filePathArray.push(filepath);
        //20180910 일괄학습에서 Add Training 실행 전 validate check
        //docNameArr에 hidden 값 매핑 TBL_DOCUMENT_CATEGORY 의 doctype
        //check된 이미지에 예측문서(docNameArr)중에 공란이거나 doctype = 0 이 있을 경우 alert
        var docType = $(this).closest('tr').find('.docType').eq(0).val();

        if (docType && (docType != 0 || docType != '')) {
            docTypeArray.push(docType);
        } else {
            alert('document type is empty : ' + $(this).closest('tr').find('.fileNamePath').eq(0).text());
            hasNoCheck = true;
            return false;
        }      
    });
    if (chkCnt == 0) {
        alert("선택된 학습이 없습니다.");
        return false;
    } else if (hasNoCheck == false) {
        //searchBatchLearnData(imgIdArray, "PROCESS_IMAGE");
        addBatchTraining(filePathArray, docTypeArray, "PROCESS_IMAGE");
    }
};

var addBatchTraining = function (filePathArray, docTypeArray, imgIdArray) {
    var param = {
        filePathArray: filePathArray,
        docTypeArray: docTypeArray,
    };


    $.ajax({
        url: '/batchLearning/addBatchTraining',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsgTitle").html("retrieving learn data...");
            progressId = showProgressBar();
        },
        success: function (data) {
            $("#progressMsgTitle").html("processing learn data...");
            console.log(data);
            if (data.code == 200) {
                alert(data.msg);
            }
            searchBatchLearnDataList(addCond);
        },
        error: function (err) {
            endProgressBar(progressId); // end progressbar
            console.log(err);
        },
        complete: function () {
            console.log("done");
            //addProgressBar(41, 100);
            endProgressBar(progressId);
        }
    });

}



// UI 학습 (학습결과 수정)
var fn_uiTraining = function () {
    var imgIdArray = [];
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
        totCount++;
        uiLearnTraining(imgIdArray);
        //uiFlag = "Y";
        //searchBatchLearnData(imgIdArray, "PROCESS_IMAGE");
    }

};

var uiLearnTraining = function (imgIdArray) {
    //var data = { "data": { "convertedFileName": "hyj.jpg","data": [{ "sid": "1018,240,25767,0,0,0,0", "text": "apex", "location": "1018,240,411,87", "colLbl": 36, "colAccu": 0.99, "originText": "apex" }, { "sid": "1019,338,15944,14456,15585,0,0", "text": "partner of choice", "location": "1019,338,409,23", "colLbl": 36, "colAccu": 0.99, "originText": "partner of choice" }, { "sid": "1562,509,24349,14502,0,0,0", "text": "voucher no", "location": "1562,509,178,25", "colLbl": 36, "colAccu": 0.99, "originText": "voucher no" }, { "sid": "1562,578,24349,14552,0,0,0", "text": "voucher date", "location": "1562,578,206,25", "colLbl": 36, "colAccu": 0.99, "originText": "voucher date" }, { "sid": "206,691,97312,18699,14569,0,0", "text": "4153 korean re", "location": "206,691,274,27", "colLbl": 36, "colAccu": 0.99, "originText": "4153 korean re" }, { "sid": "208,756,24968,20629,15214,0,0", "text": "proportional treaty statement", "location": "208,756,525,34", "colLbl": 36, "colAccu": 0.99, "originText": "proportional treaty statement" }, { "sid": "1842,506,97313,0,0,0,0", "text": "bv/heo/2018/05/0626", "location": "1842,506,344,25", "colLbl": 36, "colAccu": 0.99, "originText": "bv/heo/2018/05/0626" }, { "sid": "1840,575,97314,0,0,0,0", "text": "01105/2018", "location": "1840,575,169,25", "colLbl": 36, "colAccu": 0.99, "originText": "01105/2018" }, { "sid": "206,848,64626,0,0,0,0", "text": "pedant", "location": "206,848,111,24", "colLbl": 36, "colAccu": 0.99, "originText": "cedant" }, { "sid": "206,908,14818,14456,14525,0,0", "text": "class of business", "location": "206,908,285,24", "colLbl": 36, "colAccu": 0.99, "originText": "class of business" }, { "sid": "210,963,15186,14456,16570,0,0", "text": "period of quarter", "location": "210,963,272,26", "colLbl": 36, "colAccu": 0.99, "originText": "period of quarter" }, { "sid": "207,1017,15186,14456,20629,0,0", "text": "period of treaty", "location": "207,1017,252,31", "colLbl": 36, "colAccu": 0.99, "originText": "period of treaty" }, { "sid": "206,1066,14498,15089,0,0,0", "text": "our reference", "location": "206,1066,227,24", "colLbl": 36, "colAccu": 0.99, "originText": "our reference" }, { "sid": "226,1174,16280,0,0,0,0", "text": "currency", "location": "226,1174,145,31", "colLbl": 36, "colAccu": 0.99, "originText": "currency" }, { "sid": "227,1243,16438,0,0,0,0", "text": "premium", "location": "227,1243,139,24", "colLbl": 36, "colAccu": 0.99, "originText": "premium" }, { "sid": "226,1303,15444,0,0,0,0", "text": "commission", "location": "226,1303,197,24", "colLbl": 36, "colAccu": 0.99, "originText": "commission" }, { "sid": "226,1366,16527,0,0,0,0", "text": "claims", "location": "226,1366,107,24", "colLbl": 36, "colAccu": 0.99, "originText": "claims" }, { "sid": "227,1426,16608,0,0,0,0", "text": "reserve", "location": "227,1426,126,24", "colLbl": 36, "colAccu": 0.99, "originText": "reserve" }, { "sid": "227,1489,15049,0,0,0,0", "text": "release", "location": "227,1489,123,24", "colLbl": 36, "colAccu": 0.99, "originText": "release" }, { "sid": "227,1549,15076,0,0,0,0", "text": "interest", "location": "227,1549,117,24", "colLbl": 36, "colAccu": 0.99, "originText": "interest" }, { "sid": "227,1609,24808,0,0,0,0", "text": "brokerage", "location": "227,1609,161,31", "colLbl": 36, "colAccu": 0.99, "originText": "brokerage" }, { "sid": "233,1678,17036,0,0,0,0", "text": "portfolio", "location": "233,1678,134,24", "colLbl": 36, "colAccu": 0.99, "originText": "portfolio" }, { "sid": "227,1781,16326,0,0,0,0", "text": "balance", "location": "227,1781,124,24", "colLbl": 36, "colAccu": 0.99, "originText": "balance" }, { "sid": "574,847,14459,97308,14535,14813,97309", "text": "a solidarity- first insurance 2018", "location": "574,847,492,32", "colLbl": 0, "colAccu": 0.99, "originText": ": solidarity- first insurance 2018" }, { "sid": "574,907,14459,16518,20299,21636,97309", "text": "a marine cargo surplus 2018 a inward", "location": "574,907,568,32", "colLbl": 1, "colAccu": 0.99, "originText": ": marine cargo surplus 2018 - inward" }, { "sid": "598,959,97315,14458,97316,0,0", "text": "01-01-2018 to 31-03-2018", "location": "598,959,433,25", "colLbl": 36, "colAccu": 0.99, "originText": "01-01-2018 to 31-03-2018" }, { "sid": "574,1010,14459,97315,14458,97317,0", "text": "a 01-01-2018 to 31-12-2018", "location": "574,1010,454,25", "colLbl": 36, "colAccu": 0.99, "originText": ": 01-01-2018 to 31-12-2018" }, { "sid": "574,1065,14459,97318,0,0,0", "text": "a apex/bord/2727", "location": "574,1065,304,25", "colLbl": 36, "colAccu": 0.99, "originText": ": apex/bord/2727" }, { "sid": "629,1173,97300,97322,0,0,0", "text": "jod 1.00", "location": "629,1173,171,25", "colLbl": 3, "colAccu": 0.99, "originText": "jod 1.00" }, { "sid": "639,1239,1,1,1,1,1", "text": "25.53", "location": "639,1239,83,25", "colLbl": 9, "colAccu": 0.99, "originText": "25.53" }, { "sid": "639,1299,1,1,1,1,1", "text": "5.74", "location": "639,1299,64,25", "colLbl": 14, "colAccu": 0.99, "originText": "5.74" }, { "sid": "639,1362,1,1,1,1,1", "text": "1.00", "location": "639,1362,64,25", "colLbl": 24, "colAccu": 0.99, "originText": "0.00" }, { "sid": "639,1422,1,1,1,1,1", "text": "7.66", "location": "639,1422,64,25", "colLbl": 36, "colAccu": 0.99, "originText": "7.66" }, { "sid": "639,1485,1,1,1,1,1", "text": "1.00", "location": "639,1485,64,25", "colLbl": 36, "colAccu": 0.99, "originText": "0.00" }, { "sid": "639,1545,1,1,1,1,1", "text": "1.00", "location": "639,1545,64,25", "colLbl": 32, "colAccu": 0.99, "originText": "0.00" }, { "sid": "639,1605,1,1,1,1,1", "text": "0.64", "location": "639,1605,64,25", "colLbl": 16, "colAccu": 0.99, "originText": "0.64" }, { "sid": "648,1677,1,1,1,1,1", "text": "1.00", "location": "648,1677,64,25", "colLbl": 36, "colAccu": 0.99, "originText": "0.00" }, { "sid": "641,1774,97319,97320,0,0,0", "text": "11 .49", "location": "641,1774,81,25", "colLbl": 36, "colAccu": 0.99, "originText": "11 .49" }, { "sid": "1706,1908,25767,14813,0,0,0", "text": "apex insurance", "location": "1706,1908,356,29", "colLbl": 36, "colAccu": 0.99, "originText": "apex insurance" }], "column": [{ "SEQNUM": "1", "COLNAME": "출재사명", "COLTYPE": "OGCOMPANYNAME", "COLNUM": "0" }, { "SEQNUM": "2", "COLNAME": "계약명", "COLTYPE": "CTNM", "COLNUM": "1" }, { "SEQNUM": "3", "COLNAME": "UY", "COLTYPE": "UY", "COLNUM": "2" }, { "SEQNUM": "4", "COLNAME": "화폐코드", "COLTYPE": "CURCD", "COLNUM": "3" }, { "SEQNUM": "5", "COLNAME": "화폐단위", "COLTYPE": "CURUNIT", "COLNUM": "4" }, { "SEQNUM": "6", "COLNAME": "PAID(100%)", "COLTYPE": "PAIDPERCENT", "COLNUM": "5" }, { "SEQNUM": "7", "COLNAME": "PAID(Our Share)", "COLTYPE": "PAIDSHARE", "COLNUM": "6" }, { "SEQNUM": "8", "COLNAME": "OSL(100%)", "COLTYPE": "OSLPERCENT", "COLNUM": "7" }, { "SEQNUM": "9", "COLNAME": "OSL(Our Share)", "COLTYPE": "OSLSHARE", "COLNUM": "8" }, { "SEQNUM": "10", "COLNAME": "PREMIUM", "COLTYPE": "PM", "COLNUM": "9" }, { "SEQNUM": "11", "COLNAME": "PREMIUM P/F ENT", "COLTYPE": "PMPFEND", "COLNUM": "10" }, { "SEQNUM": "12", "COLNAME": "PREMIUM P/F WOS", "COLTYPE": "PMPFWOS", "COLNUM": "11" }, { "SEQNUM": "13", "COLNAME": "XOL PREMIUM", "COLTYPE": "XOLPM", "COLNUM": "12" }, { "SEQNUM": "14", "COLNAME": "RETURN PREMIUM", "COLTYPE": "RETURNPM", "COLNUM": "13" }, { "SEQNUM": "15", "COLNAME": "COMMISSION", "COLTYPE": "CN", "COLNUM": "14" }, { "SEQNUM": "16", "COLNAME": "PROFIT COMMISSION", "COLTYPE": "PROFITCN", "COLNUM": "15" }, { "SEQNUM": "17", "COLNAME": "BROKERAGE", "COLTYPE": "BROKERAGE", "COLNUM": "16" }, { "SEQNUM": "18", "COLNAME": "TAX", "COLTYPE": "TAX", "COLNUM": "17" }, { "SEQNUM": "19", "COLNAME": "OVERRIDING COM", "COLTYPE": "OVERRIDINGCOM", "COLNUM": "18" }, { "SEQNUM": "20", "COLNAME": "CHARGE", "COLTYPE": "CHARGE", "COLNUM": "19" }, { "SEQNUM": "21", "COLNAME": "PREMUIM RESERVE RTD", "COLTYPE": "PMRESERVERTD1", "COLNUM": "20" }, { "SEQNUM": "22", "COLNAME": "P/F PREMIUM RESERVE RTD", "COLTYPE": "PFPMRESERVERTD1", "COLNUM": "21" }, { "SEQNUM": "23", "COLNAME": "PREMIUM RESERVE RLD", "COLTYPE": "PMRESERVERTD2", "COLNUM": "22" }, { "SEQNUM": "24", "COLNAME": "P/F PREMIUM RESERVE RLD", "COLTYPE": "PFPMRESERVERTD2", "COLNUM": "23" }, { "SEQNUM": "25", "COLNAME": "CLAIM", "COLTYPE": "CLAIM", "COLNUM": "24" }, { "SEQNUM": "26", "COLNAME": "LOSS RECOVERY", "COLTYPE": "LOSSRECOVERY", "COLNUM": "25" }, { "SEQNUM": "27", "COLNAME": "CASH LOSS", "COLTYPE": "CASHLOSS", "COLNUM": "26" }, { "SEQNUM": "28", "COLNAME": "CASH LOSS REFUND", "COLTYPE": "CASHLOSSRD", "COLNUM": "27" }, { "SEQNUM": "29", "COLNAME": "LOSS RESERVE RTD", "COLTYPE": "LOSSRR", "COLNUM": "28" }, { "SEQNUM": "30", "COLNAME": "LOSS RESERVE RLD", "COLTYPE": "LOSSRR2", "COLNUM": "29" }, { "SEQNUM": "31", "COLNAME": "LOSS P/F ENT", "COLTYPE": "LOSSPFENT", "COLNUM": "30" }, { "SEQNUM": "32", "COLNAME": "LOSS P/F WOA", "COLTYPE": "LOSSPFWOA", "COLNUM": "31" }, { "SEQNUM": "33", "COLNAME": "INTEREST", "COLTYPE": "INTEREST", "COLNUM": "32" }, { "SEQNUM": "34", "COLNAME": "TAX ON", "COLTYPE": "TAXON", "COLNUM": "33" }, { "SEQNUM": "35", "COLNAME": "MISCELLANEOUS", "COLTYPE": "MISCELLANEOUS", "COLNUM": "34" }, { "SEQNUM": "36", "COLNAME": "Your Reference", "COLTYPE": "CSCOSARFRNCNNT2", "COLNUM": "35" }, { "SEQNUM": "37", "COLNAME": "UNKNOWN", "COLTYPE": "UNKNOWN", "COLNUM": "36" }] } };
    //modifyData = { "convertedFileName": "hyj.jpg", "data": [{ "sid": "1018,240,25767,0,0,0,0", "text": "apex", "location": "1018,240,411,87", "colLbl": 36, "colAccu": 0.99, "originText": "apex" }, { "sid": "1019,338,15944,14456,15585,0,0", "text": "partner of choice", "location": "1019,338,409,23", "colLbl": 36, "colAccu": 0.99, "originText": "partner of choice" }, { "sid": "1562,509,24349,14502,0,0,0", "text": "voucher no", "location": "1562,509,178,25", "colLbl": 36, "colAccu": 0.99, "originText": "voucher no" }, { "sid": "1562,578,24349,14552,0,0,0", "text": "voucher date", "location": "1562,578,206,25", "colLbl": 36, "colAccu": 0.99, "originText": "voucher date" }, { "sid": "206,691,97312,18699,14569,0,0", "text": "4153 korean re", "location": "206,691,274,27", "colLbl": 36, "colAccu": 0.99, "originText": "4153 korean re" }, { "sid": "208,756,24968,20629,15214,0,0", "text": "proportional treaty statement", "location": "208,756,525,34", "colLbl": 36, "colAccu": 0.99, "originText": "proportional treaty statement" }, { "sid": "1842,506,97313,0,0,0,0", "text": "bv/heo/2018/05/0626", "location": "1842,506,344,25", "colLbl": 36, "colAccu": 0.99, "originText": "bv/heo/2018/05/0626" }, { "sid": "1840,575,97314,0,0,0,0", "text": "01105/2018", "location": "1840,575,169,25", "colLbl": 36, "colAccu": 0.99, "originText": "01105/2018" }, { "sid": "206,848,64626,0,0,0,0", "text": "pedant", "location": "206,848,111,24", "colLbl": 36, "colAccu": 0.99, "originText": "cedant" }, { "sid": "206,908,14818,14456,14525,0,0", "text": "class of business", "location": "206,908,285,24", "colLbl": 36, "colAccu": 0.99, "originText": "class of business" }, { "sid": "210,963,15186,14456,16570,0,0", "text": "period of quarter", "location": "210,963,272,26", "colLbl": 36, "colAccu": 0.99, "originText": "period of quarter" }, { "sid": "207,1017,15186,14456,20629,0,0", "text": "period of treaty", "location": "207,1017,252,31", "colLbl": 36, "colAccu": 0.99, "originText": "period of treaty" }, { "sid": "206,1066,14498,15089,0,0,0", "text": "our reference", "location": "206,1066,227,24", "colLbl": 36, "colAccu": 0.99, "originText": "our reference" }, { "sid": "226,1174,16280,0,0,0,0", "text": "currency", "location": "226,1174,145,31", "colLbl": 36, "colAccu": 0.99, "originText": "currency" }, { "sid": "227,1243,16438,0,0,0,0", "text": "premium", "location": "227,1243,139,24", "colLbl": 36, "colAccu": 0.99, "originText": "premium" }, { "sid": "226,1303,15444,0,0,0,0", "text": "commission", "location": "226,1303,197,24", "colLbl": 36, "colAccu": 0.99, "originText": "commission" }, { "sid": "226,1366,16527,0,0,0,0", "text": "claims", "location": "226,1366,107,24", "colLbl": 36, "colAccu": 0.99, "originText": "claims" }, { "sid": "227,1426,16608,0,0,0,0", "text": "reserve", "location": "227,1426,126,24", "colLbl": 36, "colAccu": 0.99, "originText": "reserve" }, { "sid": "227,1489,15049,0,0,0,0", "text": "release", "location": "227,1489,123,24", "colLbl": 36, "colAccu": 0.99, "originText": "release" }, { "sid": "227,1549,15076,0,0,0,0", "text": "interest", "location": "227,1549,117,24", "colLbl": 36, "colAccu": 0.99, "originText": "interest" }, { "sid": "227,1609,24808,0,0,0,0", "text": "brokerage", "location": "227,1609,161,31", "colLbl": 36, "colAccu": 0.99, "originText": "brokerage" }, { "sid": "233,1678,17036,0,0,0,0", "text": "portfolio", "location": "233,1678,134,24", "colLbl": 36, "colAccu": 0.99, "originText": "portfolio" }, { "sid": "227,1781,16326,0,0,0,0", "text": "balance", "location": "227,1781,124,24", "colLbl": 36, "colAccu": 0.99, "originText": "balance" }, { "sid": "574,847,14459,97308,14535,14813,97309", "text": "a solidarity- first insurance 2018", "location": "574,847,492,32", "colLbl": 0, "colAccu": 0.99, "originText": ": solidarity- first insurance 2018" }, { "sid": "574,907,14459,16518,20299,21636,97309", "text": "a marine cargo surplus 2018 a inward", "location": "574,907,568,32", "colLbl": 1, "colAccu": 0.99, "originText": ": marine cargo surplus 2018 - inward" }, { "sid": "598,959,97315,14458,97316,0,0", "text": "01-01-2018 to 31-03-2018", "location": "598,959,433,25", "colLbl": 36, "colAccu": 0.99, "originText": "01-01-2018 to 31-03-2018" }, { "sid": "574,1010,14459,97315,14458,97317,0", "text": "a 01-01-2018 to 31-12-2018", "location": "574,1010,454,25", "colLbl": 36, "colAccu": 0.99, "originText": ": 01-01-2018 to 31-12-2018" }, { "sid": "574,1065,14459,97318,0,0,0", "text": "a apex/bord/2727", "location": "574,1065,304,25", "colLbl": 36, "colAccu": 0.99, "originText": ": apex/bord/2727" }, { "sid": "629,1173,97300,97322,0,0,0", "text": "jod 1.00", "location": "629,1173,171,25", "colLbl": 3, "colAccu": 0.99, "originText": "jod 1.00" }, { "sid": "639,1239,1,1,1,1,1", "text": "25.53", "location": "639,1239,83,25", "colLbl": 9, "colAccu": 0.99, "originText": "25.53" }, { "sid": "639,1299,1,1,1,1,1", "text": "5.74", "location": "639,1299,64,25", "colLbl": 14, "colAccu": 0.99, "originText": "5.74" }, { "sid": "639,1362,1,1,1,1,1", "text": "1.00", "location": "639,1362,64,25", "colLbl": 24, "colAccu": 0.99, "originText": "0.00" }, { "sid": "639,1422,1,1,1,1,1", "text": "7.66", "location": "639,1422,64,25", "colLbl": 36, "colAccu": 0.99, "originText": "7.66" }, { "sid": "639,1485,1,1,1,1,1", "text": "1.00", "location": "639,1485,64,25", "colLbl": 36, "colAccu": 0.99, "originText": "0.00" }, { "sid": "639,1545,1,1,1,1,1", "text": "1.00", "location": "639,1545,64,25", "colLbl": 32, "colAccu": 0.99, "originText": "0.00" }, { "sid": "639,1605,1,1,1,1,1", "text": "0.64", "location": "639,1605,64,25", "colLbl": 16, "colAccu": 0.99, "originText": "0.64" }, { "sid": "648,1677,1,1,1,1,1", "text": "1.00", "location": "648,1677,64,25", "colLbl": 36, "colAccu": 0.99, "originText": "0.00" }, { "sid": "641,1774,97319,97320,0,0,0", "text": "11 .49", "location": "641,1774,81,25", "colLbl": 36, "colAccu": 0.99, "originText": "11 .49" }, { "sid": "1706,1908,25767,14813,0,0,0", "text": "apex insurance", "location": "1706,1908,356,29", "colLbl": 36, "colAccu": 0.99, "originText": "apex insurance" }], "column": [{ "SEQNUM": "1", "COLNAME": "출재사명", "COLTYPE": "OGCOMPANYNAME", "COLNUM": "0" }, { "SEQNUM": "2", "COLNAME": "계약명", "COLTYPE": "CTNM", "COLNUM": "1" }, { "SEQNUM": "3", "COLNAME": "UY", "COLTYPE": "UY", "COLNUM": "2" }, { "SEQNUM": "4", "COLNAME": "화폐코드", "COLTYPE": "CURCD", "COLNUM": "3" }, { "SEQNUM": "5", "COLNAME": "화폐단위", "COLTYPE": "CURUNIT", "COLNUM": "4" }, { "SEQNUM": "6", "COLNAME": "PAID(100%)", "COLTYPE": "PAIDPERCENT", "COLNUM": "5" }, { "SEQNUM": "7", "COLNAME": "PAID(Our Share)", "COLTYPE": "PAIDSHARE", "COLNUM": "6" }, { "SEQNUM": "8", "COLNAME": "OSL(100%)", "COLTYPE": "OSLPERCENT", "COLNUM": "7" }, { "SEQNUM": "9", "COLNAME": "OSL(Our Share)", "COLTYPE": "OSLSHARE", "COLNUM": "8" }, { "SEQNUM": "10", "COLNAME": "PREMIUM", "COLTYPE": "PM", "COLNUM": "9" }, { "SEQNUM": "11", "COLNAME": "PREMIUM P/F ENT", "COLTYPE": "PMPFEND", "COLNUM": "10" }, { "SEQNUM": "12", "COLNAME": "PREMIUM P/F WOS", "COLTYPE": "PMPFWOS", "COLNUM": "11" }, { "SEQNUM": "13", "COLNAME": "XOL PREMIUM", "COLTYPE": "XOLPM", "COLNUM": "12" }, { "SEQNUM": "14", "COLNAME": "RETURN PREMIUM", "COLTYPE": "RETURNPM", "COLNUM": "13" }, { "SEQNUM": "15", "COLNAME": "COMMISSION", "COLTYPE": "CN", "COLNUM": "14" }, { "SEQNUM": "16", "COLNAME": "PROFIT COMMISSION", "COLTYPE": "PROFITCN", "COLNUM": "15" }, { "SEQNUM": "17", "COLNAME": "BROKERAGE", "COLTYPE": "BROKERAGE", "COLNUM": "16" }, { "SEQNUM": "18", "COLNAME": "TAX", "COLTYPE": "TAX", "COLNUM": "17" }, { "SEQNUM": "19", "COLNAME": "OVERRIDING COM", "COLTYPE": "OVERRIDINGCOM", "COLNUM": "18" }, { "SEQNUM": "20", "COLNAME": "CHARGE", "COLTYPE": "CHARGE", "COLNUM": "19" }, { "SEQNUM": "21", "COLNAME": "PREMUIM RESERVE RTD", "COLTYPE": "PMRESERVERTD1", "COLNUM": "20" }, { "SEQNUM": "22", "COLNAME": "P/F PREMIUM RESERVE RTD", "COLTYPE": "PFPMRESERVERTD1", "COLNUM": "21" }, { "SEQNUM": "23", "COLNAME": "PREMIUM RESERVE RLD", "COLTYPE": "PMRESERVERTD2", "COLNUM": "22" }, { "SEQNUM": "24", "COLNAME": "P/F PREMIUM RESERVE RLD", "COLTYPE": "PFPMRESERVERTD2", "COLNUM": "23" }, { "SEQNUM": "25", "COLNAME": "CLAIM", "COLTYPE": "CLAIM", "COLNUM": "24" }, { "SEQNUM": "26", "COLNAME": "LOSS RECOVERY", "COLTYPE": "LOSSRECOVERY", "COLNUM": "25" }, { "SEQNUM": "27", "COLNAME": "CASH LOSS", "COLTYPE": "CASHLOSS", "COLNUM": "26" }, { "SEQNUM": "28", "COLNAME": "CASH LOSS REFUND", "COLTYPE": "CASHLOSSRD", "COLNUM": "27" }, { "SEQNUM": "29", "COLNAME": "LOSS RESERVE RTD", "COLTYPE": "LOSSRR", "COLNUM": "28" }, { "SEQNUM": "30", "COLNAME": "LOSS RESERVE RLD", "COLTYPE": "LOSSRR2", "COLNUM": "29" }, { "SEQNUM": "31", "COLNAME": "LOSS P/F ENT", "COLTYPE": "LOSSPFENT", "COLNUM": "30" }, { "SEQNUM": "32", "COLNAME": "LOSS P/F WOA", "COLTYPE": "LOSSPFWOA", "COLNUM": "31" }, { "SEQNUM": "33", "COLNAME": "INTEREST", "COLTYPE": "INTEREST", "COLNUM": "32" }, { "SEQNUM": "34", "COLNAME": "TAX ON", "COLTYPE": "TAXON", "COLNUM": "33" }, { "SEQNUM": "35", "COLNAME": "MISCELLANEOUS", "COLTYPE": "MISCELLANEOUS", "COLNUM": "34" }, { "SEQNUM": "36", "COLNAME": "Your Reference", "COLTYPE": "CSCOSARFRNCNNT2", "COLNUM": "35" }, { "SEQNUM": "37", "COLNAME": "UNKNOWN", "COLTYPE": "UNKNOWN", "COLNUM": "36" }] };
    //selectTypoData(data);

    $.ajax({
        url: '/batchLearning/uiLearnTraining',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ imgIdArray: imgIdArray }),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $('#btn_pop_batch_close').click();
            $("#progressMsgTitle").html("processing UI learn data...");
            progressId = showProgressBar();
        },
        success: function (data) {
            console.log(data);
            //modifyData = data.data;
            $("#progressMsgTitle").html("success UI learn data...");
            //selectTypoData(data);
            modifyData = $.extend({}, data.data);
            uiLayerHtml(data);
            endProgressBar(progressId);
        },
        error: function (err) {
            console.log(err);
        }
    });

};

function selectTypoData(data) {
    console.log(data);
    $.ajax({
        url: 'common/selectTypoData2',
        type: 'post',
        datatype: 'json',
        data: JSON.stringify({ 'data': data.data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (result) {
            data.data.data = result.data;
            uiLayerHtml(data);
        },
        error: function (err) {
            console.log(err);
        }
    });

}

function uiLayerHtml(data) {
    var mlData = data.data.data;
    var columnArr = data.data.column;
    var entryColArr = data.data.entryMappingList;
    //var fileName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
    fn_initUiTraining();
    layer_open('layer2');


    $('#imgNameTag').text(data.data.fileinfo.filepath);

    var mainImgHtml = '';
    mainImgHtml += '<div id="mainImage" class="ui_mainImage">';
    mainImgHtml += '<div id="redNemo">';
    mainImgHtml += '</div>';
    mainImgHtml += '</div>';
    mainImgHtml += '<div id="imageZoom" ondblclick="viewOriginImg()">';
    mainImgHtml += '<div id="redZoomNemo">';
    mainImgHtml += '</div>';
    mainImgHtml += '</div>';
    $('#img_content').html(mainImgHtml);
    //data.data.fileinfo.filepath.substring(0, lastIndexOf("."))
    var convertImg = data.data.fileinfo.filepath.substring(0, data.data.fileinfo.filepath.lastIndexOf(".")) + ".jpg";
    $('#mainImage').css('background-image', 'url("/tif' + convertImg + '")');

    var tblTag = '';
    var tblSortTag = '';

    columnArr.unshift(columnArr.pop());
    entryColArr.unshift(entryColArr.pop());

    /*
    for (var i in mlData) {
        tblTag += '<dl>';
        tblTag += '<dt onclick="zoomImg(this)">';
        tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
        tblTag += '<input type="text" value="' + mlData[i].text + '" style="width:100%; border:0;" />';
        tblTag += '<input type="hidden" value="' + mlData[i].location + '" />';
        tblTag += '</label>';
        tblTag += '</dt>';
        tblTag += '<dd>';
        tblTag += appendOptionHtml((mlData[i].colLbl != undefined) ? mlData[i].colLbl : 36, columnArr);
        tblTag += '</dd>';
        tblTag += '</dl>';
    }
    */
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

// batch learning 2 [Select] 배치학습데이터 조회
var batchLearnTraining = function (imgIdArray, flag) {
    var param = {
        imgIdArray: imgIdArray,
        uiCheck: $('#uiTrainingChk').is(':checked'),
        flag: flag
    };

    $.ajax({
        url: '/batchLearning/batchLearnTraining',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $('#btn_pop_batch_close').click();
            $("#progressMsgTitle").html("retrieving learn data...");
            progressId = showProgressBar();
            //startProgressBar();
            //addProgressBar(0, 41);
        },
        success: function (data) {
            $("#progressMsgTitle").html("processing learn data...");
            //console.log(data);
            //searchBatchLearnDataList(addCond);
            if (flag == "LEARN_N") {
                $("input[name=listCheck_before]").each(function (index, entry) {
                    if ($(this).is(":checked")) {

                        for (var i in data.data) {
                            if (data.data[i].fileinfo) {

                                if ($(this).val() == data.data[i].fileinfo.filepath) {
                                    //console.log(index);
                                    $(this).parent().data('ocr_data', data.data[i].data);
                                    var docHtml = '<input type="hidden" name="docType" class="docType" value="' + data.data[i].docCategory.DOCTYPE + '" />';
                                    docHtml += '<a onclick="javascript:fn_viewDoctypePop(this);" href="javascript:void(0);">' + data.data[i].docCategory.DOCNAME + '</a>';
                                    $(this).closest("td").next().next().html(docHtml);
                                }
                            }
                        }
                    }
                });
                endProgressBar(progressId);
            } else if (flag == "LEARN_Y") {
                endProgressBar(progressId);
                searchBatchLearnDataList(addCond);
            }

            //if ($('#uiTrainingChk').is(':checked') && data.data[0].uiTraining == "uiTraining") {
            //    compareLayer(data);
            //}
            //endProgressBar(progressId);
        },
        error: function (err) {
            endProgressBar(progressId); // end progressbar
            console.log(err);
        },
        complete: function () {
            console.log("done");
            //addProgressBar(41, 100);
            endProgressBar(progressId);
        }
    });
};

function compareLayer(ocrData) {

    var mlData = ocrData.data[0].mlexport.mlData;
    var docCategory = ocrData.data[0].mlexport.docCategory;
    var columnArr = ocrData.data[0].columnArr;
    var fileInfo = ocrData.data[0].fileInfo[0];

    ocrDataArr = [];
    fn_initUiTraining(); // 팝업 초기화
    layer_open('layer2'); // ui 학습레이어 띄우기
    //$("#layer2.poplayer").css("display", "block");

    if (docCategory != undefined) {
        $('#docName').text(docCategory.DOCNAME);
        /*
        $('#docPredictionScore').text(modifyData.score + '%');
        if (modifyData.score >= 90) {
            $('#docName').css('color', 'dodgerblue');
            $('#docPredictionScore').css('color', 'dodgerblue');
        } else {
            $('#docName').css('color', 'darkred');
            $('#docPredictionScore').css('color', 'darkred');
        }
        */
    }

    $('#imgNameTag').text(fileInfo.FILENAME);

    var mainImgHtml = '';
    mainImgHtml += '<div id="mainImage" class="ui_mainImage">';
    mainImgHtml += '<div id="redNemo">';
    mainImgHtml += '</div>';
    mainImgHtml += '</div>';
    mainImgHtml += '<div id="imageZoom" ondblclick="viewOriginImg()">';
    mainImgHtml += '<div id="redZoomNemo">';
    mainImgHtml += '</div>';
    mainImgHtml += '</div>';
    $('#img_content').html(mainImgHtml);
    $('#mainImage').css('background-image', 'url("../..' + fileInfo.CONVERTEDIMGPATH + '")');

    var tblTag = '';
    for (var i in mlData) {
        tblTag += '<dl>';
        tblTag += '<dt onclick="zoomImg(this)">';
        tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
        tblTag += '<input type="text" value="' + mlData[i].text + '" style="width:100%; border:0;" />';
        tblTag += '<input type="hidden" value="' + mlData[i].location + '" />';
        tblTag += '</label>';
        tblTag += '</dt>';
        tblTag += '<dd>';
        tblTag += appendOptionHtml((mlData[i].colLbl != undefined) ? mlData[i].colLbl : 36, columnArr);
        tblTag += '</dd>';
        tblTag += '</dl>';
    }
    $('#textResultTbl').append(tblTag);

}

// UI학습 팝업 초기화
var fn_initUiTraining = function () {
    $('#imgNameTag').text('');
    $("#uiImg").html('');
    $("#textResultTbl").html('');
};
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
};

function modifyTextData() {
    var beforeData = [modifyData];
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

    // find an array of data with the same filename
    $.ajax({
        url: '/common/modifyBatchUiTextData',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'beforeData': beforeData[0], 'afterData': afterData }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            alert("success training");    
            //fn_batchUiTraining();
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// UI학습 팝업 실행
var fn_batchUiTraining = function () {
    var mldata = modifyData;
    var trainData = {};
    var arr = [];
    var trainData = {};
    trainData.data = [];

    $('#textResultTbl > dl').each(function (i, el) {
        var location = $(el).find('input')[1].value;
        var text = $(el).find('input')[0].value;
        var column = $(el).find('select').find('option:selected').val();
        for (var i in mldata.data) {
            var obj = {};
            if (mldata.data[i].location == location) {
                obj.location = location;
                obj.text = text;
                obj.colLbl = column;

                arr.push(obj);
                break;
            }
        }
    });

    for (var i = 0; i < mldata.data.length; i++) {
        for (var j = 0; j < arr.length; j++) {
            if (mldata.data[i].location == arr[j].location) {

                if (arr[j].colLbl == 0 || arr[j].colLbl == 1 || arr[j].colLbl == 3) { // Only ogCompanyName, contractName, curCode
                    if (mldata.data[i].text != arr[j].text || mldata.data[i].colLbl != arr[j].colLbl) {
                        arr[j].sid = mldata.data[i].sid;
                        trainData.data.push(arr[j]);
                    }
                } else { // etc
                    if (mldata.data[i].colLbl != arr[j].colLbl) {
                        arr[j].text = mldata.data[i].text; // origin text (Does not reflect changes made by users) 
                        arr[j].sid = mldata.data[i].sid;
                        trainData.data.push(arr[j]);
                    }
                }

            }
        }
    }

    callbackInsertDocMapping(trainData);
};

// 양식레이블 매핑
var docLabelMapping = function (data) {
    //startProgressBar();
    progressId = showProgressBar();
    $('#progressMsgTitle').css("color", "black");
    $('#progressMsgTitle').html('문서 라벨 맵핑 학습 중..');
    //addProgressBar(1, 25);
    insertDocLabelMapping(data, callbackInsertDocLabelMapping);
};

var callbackInsertDocLabelMapping = function (data) {
    $('#progressMsgTitle').html('문서 맵핑 학습 중..');
    //addProgressBar(26, 50);
    insertDocMapping(data, callbackInsertDocMapping);
};

var callbackInsertDocMapping = function (data) {
    $('#progressMsgTitle').html('컬럼 맵핑 학습 중..');
    //addProgressBar(51, 75);
    insertColMapping(data, callbackInsertColMapping);
};

var callbackInsertColMapping = function (data) {
    $('#progressMsgTitle').html('학습 처리 중..');
    //addProgressBar(76, 100);
    //insertContractMapping(data, callbackInsertContractMapping);
};

/*
var callbackInsertContractMapping = function () {
    $('#progressMsgTitle').html('UI TRAINING..');
    addProgressBar(81, 100);
};
*/

// UI레이어 학습 버튼 클릭 이벤트
var uiTrainingBtn = function () {

    $.ajax({
        url: '/batchLearning/uitraining',
        type: 'post',
        datatype: "json",
        data: null,
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            if (data.code == 200) {
                //addProgressBar(81, 100);
                alert(data.message);
                //popupEvent.batchClosePopup('retrain');
            }
        },
        error: function (err) {
            endProgressBar(progressId);
            console.log(err);
        }
    });

};

// 양식 레이블 매핑 ml 데이터 insert
function insertDocLabelMapping(data, callback) {
    $.ajax({
        url: '/batchLearning/insertDocLabelMapping',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            console.log(res);
            callback(res.data);
        },
        error: function (err) {
            endProgressBar(progressId);
            console.log(err);
        }
    });
}

// 양식 매핑 ml 데이터 insert
function insertDocMapping(data, callback) {

    /*
    var param = [];
    for (var i in data.data) {
        if (data.data[i].column == 0) {
            param.push(data.data[i]);
        }
    }
    for (var i in data.data) {
        if (data.data[i].column == 1) {
            param.push(data.data[i]);
        }
    }*/
    //var dacCategory = JSON.parse($('#docData').val());

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
            endProgressBar(progressId);
            console.log(err);
        }
    });
}

// 컬럼 매핑 ml 데이터 insert
function insertColMapping(data) {
    $.ajax({
        url: '/batchLearning/insertColMapping',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            console.log(res);
            //addProgressBar(81, 100);
            alert("success training");
            //callback(data);
        },
        error: function (err) {
            endProgressBar(progressId);
            console.log(err);
        }
    });
}

// 계약명 매핑 insert
function insertContractMapping(data, callback) {
    $.ajax({
        url: '/batchLearning/insertContractMapping',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data, 'fileName': $('#imgNameTag').text().split('.')[0] + '.tif' }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            console.log(res);
            callback(data);
        },
        error: function (err) {
            endProgressBar(progressId);
            console.log(err);
        }
    });
}

//문서 비교 popup 버튼 클릭 이벤트
function docComparePopup(imgIndex, obj) {
    var imgId = imgIndex.substring(0, imgIndex.lastIndexOf("."));
    var appendImg = '<img id="originImg" src="../../ uploads /"' + imgId + '.jpg" style="width: 100%;height: 480px;">';
    $('#originImgDiv').empty().append(appendImg);
    $('#originImg').attr('src', '../../uploads/' + imgId + ".jpg");
    $('#mlPredictionDocName').val(obj.innerText);
    //$('#searchImg').attr('src', '../../' + lineText[imgIndex].docCategory.SAMPLEIMAGEPATH);
    initLayer4();
    layer_open('layer4');
}

//문서 비교 popup 버튼 클릭 이벤트
function docComparePopup2() {
    var imgId = $('#docName').html();
    if (modifyData.docCategory) {
        $('#originImg').attr('src', '../../' + modifyData.docCategory[0].SAMPLEIMAGEPATH);
    } else {
        $('#originImg').attr('src', '../../uploads/' + $('#mainImage').css('background-image').split('"')[1].split('/')[4]);
    }
    $('#mlPredictionPercent').val($('#docPredictionScore').html());
    $('#mlPredictionDocName').val($('#docName').html());
    //$('#searchImg').attr('src', '../../' + lineText[imgIndex].docCategory.SAMPLEIMAGEPATH);
    initLayer4();
    layer_open('layer4');
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


function popUpEvent() {
    popUpSearchDocCategory();
    //popUpInsertDocCategory();
}

//팝업 문서 양식 LIKE 조회
function popUpSearchDocCategory() {
    $('#searchDocCategoryBtn').click(function () {
        var keyword = $('#searchDocCategoryKeyword').val().replace(/ /gi, '');

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
                    //$('#docData').val(JSON.stringify(data));
                    $('#docSearchResult').html('');
                    //$('#countCurrent').html('1');
                    $('.button_control10').attr('disabled', true);
                    docPopImagesCurrentCount = 1;
                    if (data.length == 0) {
                        return false;
                    } else {
                        /**
                         결과에 따른 이미지폼 만들기
                         */
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
            alert('Please enter your search keyword');
        }
    });
}

// 팝업 확인 및 취소 이벤트
function popUpRunEvent() {

    $('#btn_pop_doc_run').click(function (e) {
        // chkValue 1: 기존문서 양식조회, 2: 신규문서 양식등록, 3: 계산서 아님
        var chkValue = $('input:radio[name=radio_batch]:checked').val();

        if ((chkValue == '1' && $('#orgDocName').val() == '') || (chkValue == '2' && $('#newDocName').val() == '')) {
            alert('The document name is missing');
            return false;
        }

        // text & check
        var textList = [];
        $('.batch_layer4_result_tr').each(function () {
            var chk = $(this).children().find('input[type="checkbox"]').is(':checked') == true ? 1 : 0;
            var text = $(this).children()[1].innerHTML;

            textList.push({"text": text, "check": chk})
        })

        // docName
        var docName = '';
        if (chkValue == '1') {
            docName = $('#orgDocName').val();
        } else if (chkValue == '2') {
            docName = $('#newDocName').val();
        } else if(chkValue == '3') {
            docName = 'NotInvoice';
        }

        var param = {
            imgId: $('#docPopImgId').val(),
            filepath: $('#docPopImgPath').val(),
            docName: docName,
            radioType: chkValue,
            textList: textList,
        }

        $.ajax({
            url: '/batchLearning/insertDoctypeMapping',
            type: 'post',
            datatype: 'json',
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                $('#progressMsgTitle').html('문서양식 저장중...');
                progressId = showProgressBar();
            },
            success: function (data) {
                //location.href = location.href;
                // 해당 로우 화면상 테이블에서 삭제
                endProgressBar(progressId);
                $('#btn_pop_doc_cancel').click();
                var rowNum = $('#batchListRowNum').val();
                $('#leftRowNum_' + rowNum).remove();
                $('.rowNum' + rowNum).remove();
                $('.mlRowNum' + rowNum).remove();
            },
            error: function (err) {
                console.log(err);
                endProgressBar(progressId);
            }
        });           
    })

    // 20180910 hskim 문장 선택 결과 같이 전송
    /*
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
    $('#btn_pop_doc_cancel').click(function (e) {
        $('#docData').val('');

        e.stopPropagation();
        e.preventDefault();
    });
    */
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
    popUpEvent();
    searchBatchLearnDataList(addCond);   // 배치 학습 데이터 조회
    changeDocPopupImage();      // 문서 양식 조회 이미지 좌우 버튼 이벤트
    popUpRunEvent();            // 문서 양식 조회 및 저장 
    selectLearningMethod();     //학습실행팝업

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
            progressId = showProgressBar();
            //startProgressBar(); // 프로그레스바 시작
            //addProgressBar(1, 5); // 프로그레스바 진행
            return true;
        },
        success: function (responseText, statusText) {
            //addProgressBar(6, 30); // 프로그레스바 진행
            totCount = responseText.message.length;
            for (var i = 0; i < responseText.message.length; i++) {
                processImage(responseText.message[i]);
            }
        },
        error: function (e) {
            endProgressBar(progressId); // 에러 발생 시 프로그레스바 종료
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

// 학습실행팝업
function selectLearningMethod() {

    // 전체학습
    $('#allLaerning').click(function () {
        $('#learningMethodNum').val(0);
        $('#learningRange_content').hide();
    })

    // 선택한 파일 학습
    $('#selectFileLearning').click(function () {
        $('#learningMethodNum').val(1);
        $('#learningRange_content').hide();
    })

    // 학습 범위 지정
    $('#learningRange').click(function () {
        $('#learningMethodNum').val(2);
        $('#learningRange_content').show();
    })
}

// 마우스 오버 이벤트
function zoomImg(e) {
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
    $('#redZoomNemo').css('width', '100%');
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

function fn_viewDoctypePop(obj) {
    //20180910 filepath로 ocr 데이터 조회 후 text값만 가져올 것
    var data = $(obj).closest('tr').find('.fileNamePath');
    var filepath = data.attr('data-filepath');
    var imgId = data.attr('data-imgId');
    var rowIdx = $(obj).closest('tr').attr('id').split('_')[1];
    $('#batchListRowNum').val(rowIdx);
    $('#docPopImgId').val(imgId);
    $('#docPopImgPath').val(filepath);
    initLayer4();
    selectClassificationSt(filepath); // 분류제외문장 렌더링
    $('#mlPredictionDocName').val($(obj).html());

    loadImage('/tif' + filepath, function (tifResult) {
        if (tifResult) {
            $(tifResult).css({
                "width": "100%",
                "height": "100%",
                "display": "block"
            }).addClass("preview");
            $('#originImgDiv').empty().append(tifResult);
        }
        $('#docPopImgPath').val(filepath);

        layer_open('layer4');
    });

}

function makeindex(location) {
    let temparr = location.split(",");
    for (let i = 0 ; i < 5 ; i ++) {
        if (temparr[0].length < 5) {
            temparr[0] = '0' + temparr[0];
        }
    }
    return Number(temparr[1] + temparr[0]);
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

                var ocrdata = JSON.parse(data.data[0].OCRDATA);

                //순서 정렬 로직
                let tempArr = new Array();
                for (let item in ocrdata) {
                    tempArr[item] = new Array(makeindex(ocrdata[item].location),   ocrdata[item]);
                }

                tempArr.sort(function (a1, a2) {
                    a1[0] = parseInt(a1[0]);
                    a2[0] = parseInt(a2[0]);
                    return (a1[0]<a2[0]) ? -1 : ((a1[0]>a2[0]) ? 1 : 0);
                });

                for (let i = 0; i < tempArr.length; i++) {
                    resultOcrData += '<tr class="batch_layer4_result_tr">';
                    resultOcrData += '<td><input type="checkbox" class="batch_layer4_result_chk"></td>';               
                    resultOcrData += '<td>' + tempArr[i][1].text + '</td></tr>';
                }
                $('#batch_layer4_result').empty().append(resultOcrData);
                $('input[type=checkbox]').ezMark();
                
            }

        },
        error: function (err) {
            console.log(err);
        }
    })
}

function initLayer4() {
    $('#originImgDiv').empty();
    $('#mlPredictionDocName').val('');
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
    $('#batch_layer4_result').empty();
}

var loadImage = function (filepath, callBack) {
    var result;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', filepath);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function (e) {
        if (xhr.status == 404) {

        } else {

            var buffer = xhr.response;
            var tiff = new Tiff({ buffer: buffer });
            var canvas = tiff.toCanvas();
            result = canvas;
        }
        callBack(result);
    };
    xhr.send();
};