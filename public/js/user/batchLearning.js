//import { identifier } from "babel-types";

"use strict";

var exeBatchLearningCount = 0 // 배치실행 횟수
var totCount = 0; // 총 이미지 분석 개수
var ocrCount = 0; // ocr 수행 횟수
var batchCount = 0; // ml 학습 횟수
var updateBatchLearningDataCount = 0;

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
    });

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
        if ($('#choose_cnt_before').html() > 0) {
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
            addProgressBar(1, 99);
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
        startProgressBar();
        addProgressBar(1, 5);
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
                    if (i === (totCount - 1)) {
                        lastYN = true;
                        alert("등록이 완료되었습니다.");
                        endProgressBar();
                    }
                    //insertFileDB(responseText.fileInfo[i], responseText.message[i], lastYN); // FILE INFO INSERT
                    insertBatchLearningBaseData(responseText.fileInfo[i], responseText.message[i], lastYN);  // BATCH LEARNING BASE DATA INSERT
                }
                //endProgressBar();
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
                addProgressBar(91, 100);
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
        startProgressBar();
        addProgressBar(1, 5);
        //multiUploadForm.attr("action", "/batchLearning/imageUpload");
        multiUploadForm.attr("action", "/common/imageUpload");
        if ($(this).val() !== '') {
            multiUploadForm.submit();
        }
    });
    // FILE UPLOAD
    fileUpload();
};
               
// [파일정보 -> OCR API]
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
                addProgressBar(51, 80);

                setTimeout(function () {
                    execBatchLearning();
                    ocrCount = 0;
                    totCount = 0;
                }, 1500);
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

function execBatchLearning() {
    var dataArr = convertOcrData();
    if (exeBatchLearningCount <= ocrDataArr.length - 1) {

        for (var i = exeBatchLearningCount; i < ocrDataArr.length; i++) {
            exeBatchLearningCount = i;
            execBatchLearningData(ocrDataArr[i], dataArr[i]);
            if ($('#layer2').css('display') != 'none') break;
            if (isFullMatch) { // 모든 컬럼 매핑이 되었거나 계산서가 아닌 경우
            } else {
                endProgressBar();
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
    mainImgHtml += '<div id="imageZoom">';
    mainImgHtml += '<div id="redZoomNemo">';
    mainImgHtml += '</div>';
    mainImgHtml += '</div>';
    $('#img_content').html(mainImgHtml);
    $('#mainImage').css('background-image', 'url("../../uploads/' + ocrData.fileInfo[0].convertFileName + '")');
 
    var tblTag = '';
    for (var i in modifyData.data) {
        tblTag += '<dl>';
        tblTag += '<dt onmouseover="hoverSquare(this)" onmouseout="moutSquare(this)">';
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

    var appendHtml = ``;

    if (legacy.data.length > 0) {
        for (var i = 0; i < legacy.data.length; i++) {
            appendHtml += `
            <tr>
                <td scope="row">${nvl(legacy.data[i].CONTRACTNUM)}</td>
                <td scope="row">${nvl(legacy.data[i].CTNM)}</td>
                <td scope="row">${nvl(legacy.data[i].OGCOMPANYCODE)}</td>
                <td scope="row">${nvl(legacy.data[i].OGCOMPANYNAME)}</td>
                <td scope="row">${nvl(legacy.data[i].BROKERCODE)}</td>
                <td scope="row">${nvl(legacy.data[i].BROKERNAME)}</td>
                <td scope="row">${nvl(legacy.data[i].INSSTDT)}</td>
                <td scope="row">${nvl(legacy.data[i].INSENDDT)}</td>
                <td scope="row">${nvl(legacy.data[i].CURCD)}</td>
                <td scope="row">${nvl(legacy.data[i].PAIDPERCENT)}</td>
                <td scope="row">${nvl(legacy.data[i].PAIDSHARE)}</td>
                <td scope="row">${nvl(legacy.data[i].GROSSPM)}</td>
                <td scope="row">${nvl(legacy.data[i].PM)}</td>
                <td scope="row">${nvl(legacy.data[i].PMPFEND)}</td>
                <td scope="row">${nvl(legacy.data[i].PMPFWOS)}</td>
                <td scope="row">${nvl(legacy.data[i].XOLPM)}</td>
                <td scope="row">${nvl(legacy.data[i].RETURNPM)}</td>
                <td scope="row">${nvl(legacy.data[i].GROSSCN)}</td>
                <td scope="row">${nvl(legacy.data[i].CN)}</td>
                <td scope="row">${nvl(legacy.data[i].PROFITCN)}</td>
                <td scope="row">${nvl(legacy.data[i].BROKERAGE)}</td>
                <td scope="row">${nvl(legacy.data[i].TAX)}</td>
                <td scope="row">${nvl(legacy.data[i].OVERRIDINGCOM)}</td>
                <td scope="row">${nvl(legacy.data[i].CHARGE)}</td>
                <td scope="row">${nvl(legacy.data[i].PMRESERVERTD1)}</td>
                <td scope="row">${nvl(legacy.data[i].PFPMRESERVERTD1)}</td>
                <td scope="row">${nvl(legacy.data[i].PMRESERVERTD2)}</td>
                <td scope="row">${nvl(legacy.data[i].PFPMRESERVERTD2)}</td>
                <td scope="row">${nvl(legacy.data[i].CLAIM)}</td>
                <td scope="row">${nvl(legacy.data[i].LOSSRECOVERY)}</td>
                <td scope="row">${nvl(legacy.data[i].CASHLOSS)}</td>
                <td scope="row">${nvl(legacy.data[i].CASHLOSSRD)}</td>
                <td scope="row">${nvl(legacy.data[i].LOSSRR)}</td>
                <td scope="row">${nvl(legacy.data[i].LOSSRR2)}</td>
                <td scope="row">${nvl(legacy.data[i].LOSSPFEND)}</td>
                <td scope="row">${nvl(legacy.data[i].LOSSPFWOA)}</td>
                <td scope="row">${nvl(legacy.data[i].INTEREST)}</td>
                <td scope="row">${nvl(legacy.data[i].TAXON)}</td>
                <td scope="row">${nvl(legacy.data[i].MISCELLANEOUS)}</td>
                <td scope="row">${nvl(legacy.data[i].PMBL)}</td>
                <td scope="row">${nvl(legacy.data[i].CMBL)}</td>
                <td scope="row">${nvl(legacy.data[i].NTBL)}</td>
                <td scope="row">${nvl(legacy.data[i].CSCOSARFRNCNNT2)}</td>
            </tr>
            `;
        }
    } else {
        appendHtml += `<tr><td colspan="46">정답 데이터가 없습니다.</td></tr>`;
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
                    endProgressBar();
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
                addProgressBar(81, 100);
				updateBatchLearningDataCount = 0;
            }
            //comparedMLAndAnswer(retData, mlData, ocrData.fileInfo);
        },
        error: function (err) {
			endProgressBar();
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
            var legacyData = data.batchData;
            var mlData = data.mlExportData;

            console.log(data);
            if (addCond == "LEARN_N") $("#total_cnt_before").html(legacyData.length);
            else $("#total_cnt_after").html(data.length);
            addProgressBar(2, 100); // proceed progressbar
            if (data != null && data != '') {
                for (var i = 0; i < legacyData.length; i++) {
                    var legacyCount = Number(legacyData[i].COUNT);
                    var filename = legacyData[i].FILENAME.split('||')[0];
                    var filepath = legacyData[i].FILEPATH.split('||')[0];
                    var imgId = "null";
                    if (legacyData[i].IMGID != null) {
                        imgId = legacyData[i].IMGID.split('||')[0];
                    }
                   

                    if (legacyCount == 1) {
                        if (addCond == "LEARN_N") checkboxHtml = `<td rowspan="2" scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="${imgId}" class="sta00" name="listCheck_before" /><input type="hidden" name="filepath" value="${filepath}"></td>`;
                        else checkboxHtml = `<td rowspan="2" scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="${imgId}" class="stb00" name="listCheck_after" /></div></td>`;

                        // legacy legacyData
                        appendHtml += ` <tr>
                                            ${checkboxHtml}
                                            <td rowspan="2"><a onclick="javascript:fn_viewImagelegacyData('${filename}', this)" href="javascript:void(0);">${filename}</a></td> <!--파일명-->
                                            <td>${nvl(legacyData[i].OGCOMPANYNAME)}</td> <!--출재사명-->
                                            <td>${nvl(legacyData[i].CTNM)}</td> <!--계약명-->
                                            <td>${nvl(legacyData[i].UY)}</td> <!--UY-->
                                            <td>${nvl(legacyData[i].CURCD)}</td> <!--화폐코드-->
                                            <td>${nvl(legacyData[i].CURUNIT)}</td> <!--화폐단위-->
                                            <td>${nvl(legacyData[i].PAIDPERCENT)}</td> <!--Paid(100%)-->
                                            <td>${nvl(legacyData[i].PAIDSHARE)}</td> <!--Paid(Our Share)-->
                                            <td>${nvl(legacyData[i].OSLPERCENT)}</td> <!--OSL(100%)-->
                                            <td>${nvl(legacyData[i].OSLSHARE)}</td> <!--OSL(Our Share)-->
                                            <td>${nvl(legacyData[i].PM)}</td> <!--PREMIUM-->
                                            <td>${nvl(legacyData[i].PMPFEND)}</td> <!--PREMIUM P/F ENT-->
                                            <td>${nvl(legacyData[i].PMPFWOS)}</td> <!--PREMIUM P/F WOS-->
                                            <td>${nvl(legacyData[i].XOLPM)}</td> <!--XOL PREMIUM-->
                                            <td>${nvl(legacyData[i].RETURNPM)}</td> <!--RETURN PREMIUM-->
                                            <td>${nvl(legacyData[i].CN)}</td> <!--COMMISSION-->
                                            <td>${nvl(legacyData[i].PROFITCN)}</td> <!--PROFIT COMMISION-->
                                            <td>${nvl(legacyData[i].BROKERAGE)}</td> <!--BROKERAGE-->
                                            <td>${nvl(legacyData[i].TAX)}</td> <!--TEX-->
                                            <td>${nvl(legacyData[i].OVERRIDINGCOM)}</td> <!-- OVERIDING COM-->
                                            <td>${nvl(legacyData[i].CHARGE)}</td> <!--CHARGE-->
                                            <td>${nvl(legacyData[i].PMRESERVERTD)}</td> <!--PREMIUM RESERVE RTD-->
                                            <td>${nvl(legacyData[i].PFPMRESERVERTD)}</td> <!--P/F PREMIUM RESERVE RTD-->
                                            <td>${nvl(legacyData[i].PMRESERVERTD2)}</td> <!--P/F PREMIUM RESERVE RLD-->
                                            <td>${nvl(legacyData[i].PFPMRESERVERTD2)}</td> <!--P/F PREMIUM RESERVE RLD-->
                                            <td>${nvl(legacyData[i].CLAIM)}</td> <!--CLAIM -->
                                            <td>${nvl(legacyData[i].LOSSRECOVERY)}</td> <!--LOSS RECOVERY -->
                                            <td>${nvl(legacyData[i].CASHLOSS)}</td> <!--CASH LOSS -->
                                            <td>${nvl(legacyData[i].CASHLOSSRD)}</td> <!--CASH LOSS REFUND -->
                                            <td>${nvl(legacyData[i].LOSSRR)}</td> <!--LOSS RESERVE RTD -->
                                            <td>${nvl(legacyData[i].LOSSRR2)}</td> <!--LOSS RESERVE RLD -->
                                            <td>${nvl(legacyData[i].LOSSPFEND)}</td> <!--LOSS P/F ENT -->
                                            <td>${nvl(legacyData[i].LOSSPFWOA)}</td> <!--LOSS P/F WOA -->
                                            <td>${nvl(legacyData[i].INTEREST)}</td> <!--INTEREST -->
                                            <td>${nvl(legacyData[i].TAXON)}</td> <!--TAX ON -->
                                            <td>${nvl(legacyData[i].MISCELLANEOUS)}</td> <!--MISCELLANEOUS -->
                                            <td>${nvl(legacyData[i].CSCOSARFRNCNNT2)}</td> <!--YOUR REF -->
                                        </tr>`;

                        // ml data
                        appendHtml += `<tr class="mlTr">`;
                        if (imgId == "null") {
                            appendHtml += `<td colspan="36"></td>`;
                        } else {
                            appendHtml +=
                                `<td>` + makeMLSelect(mlData, 0, imgId) + `</td> <!--출재사명-->
                                <td>` + makeMLSelect(mlData, 1, imgId) + `</td> <!--계약명-->
                                <td>` + makeMLSelect(mlData, 2, imgId) + `</td> <!--UY-->
                                <td>` + makeMLSelect(mlData, 3, imgId) + `</td> <!--화폐코드--> 
                                <td>` + makeMLSelect(mlData, 4, imgId) + `</td> <!--화폐단위-->
                                <td>` + makeMLSelect(mlData, 5, imgId) + `</td> <!--Paid(100%)-->
                                <td>` + makeMLSelect(mlData, 6, imgId) + `</td> <!--Paid(Our Share)-->
                                <td>` + makeMLSelect(mlData, 7, imgId) + `</td> <!--OSL(100%)-->
                                <td>` + makeMLSelect(mlData, 8, imgId) + `</td> <!--OSL(Our Share)-->
                                <td>` + makeMLSelect(mlData, 9, imgId) + `</td> <!--PREMIUM-->
                                <td>` + makeMLSelect(mlData, 10, imgId) + `</td> <!--PREMIUM P/F ENT-->
                                <td>` + makeMLSelect(mlData, 11, imgId) + `</td> <!--PREMIUM P/F WOS-->
                                <td>` + makeMLSelect(mlData, 12, imgId) + `</td> <!--XOL PREMIUM-->
                                <td>` + makeMLSelect(mlData, 13, imgId) + `</td> <!--RETURN PREMIUM-->
                                <td>` + makeMLSelect(mlData, 14, imgId) + `</td> <!--COMMISSION--> 
                                <td>` + makeMLSelect(mlData, 15, imgId) + `</td> <!--PROFIT COMMISION-->
                                <td>` + makeMLSelect(mlData, 16, imgId) + `</td> <!--BROKERAGE-->
                                <td>` + makeMLSelect(mlData, 17, imgId) + `</td> <!--TEX-->
                                <td>` + makeMLSelect(mlData, 18, imgId) + `</td> <!-- OVERIDING COM-->
                                <td>` + makeMLSelect(mlData, 19, imgId) + `</td> <!--CHARGE-->
                                <td>` + makeMLSelect(mlData, 20, imgId) + `</td> <!--PREMIUM RESERVE RTD-->
                                <td>` + makeMLSelect(mlData, 21, imgId) + `</td> <!--P/F PREMIUM RESERVE RTD-->
                                <td>` + makeMLSelect(mlData, 22, imgId) + `</td> <!--PREMIUM RESERVE RLD-->
                                <td>` + makeMLSelect(mlData, 23, imgId) + `</td> <!--P/F PREMIUM RESERVE RLD-->
                                <td>` + makeMLSelect(mlData, 24, imgId) + `</td> <!--CLAIM -->
                                <td>` + makeMLSelect(mlData, 25, imgId) + `</td> <!--LOSS RECOVERY -->
                                <td>` + makeMLSelect(mlData, 26, imgId) + `</td> <!--CASH LOSS -->
                                <td>` + makeMLSelect(mlData, 27, imgId) + `</td> <!--CASH LOSS REFUND -->
                                <td>` + makeMLSelect(mlData, 28, imgId) + `</td> <!--LOSS RESERVE RTD --> 
                                <td>` + makeMLSelect(mlData, 29, imgId) + `</td> <!--LOSS RESERVE RLD -->
                                <td>` + makeMLSelect(mlData, 30, imgId) + `</td> <!--LOSS P/F ENT -->
                                <td>` + makeMLSelect(mlData, 31, imgId) + `</td> <!--LOSS P/F WOA -->
                                <td>` + makeMLSelect(mlData, 32, imgId) + `</td> <!--INTEREST -->
                                <td>` + makeMLSelect(mlData, 33, imgId) + `</td> <!--TAX ON -->
                                <td>` + makeMLSelect(mlData, 34, imgId) + `</td> <!--MISCELLANEOUS -->
                                <td>` + makeMLSelect(mlData, 35, imgId) + `</td> <!--YOUR REF --> `;                        
                        }
                        appendHtml += "</tr>";
                    } else {
                        if (addCond == "LEARN_N") checkboxHtml = `<td rowspan="` + (legacyCount + 1) + `" scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="${imgId}" class="sta00" name="listCheck_before" /><input type="hidden" name="filepath" value="${filepath}"></td>`;
                        else checkboxHtml = `<td rowspan="` + (legacyCount + 1) + `" scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="${imgId}" class="stb00" name="listCheck_after" /></div></td>`;

                        for (var q = 0; q < legacyCount; q++) {
                            appendHtml += `<tr>`;
                            if (q == 0) {
                                appendHtml += `
                                                ${checkboxHtml}
                                               <td rowspan = "` + (legacyCount + 1) + `" > <a onclick="javascript:fn_viewImageData('` + makeLegacyData(legacyData[i], 'FILENAME', q) + `', this)" href="javascript:void(0);">` + makeLegacyData(legacyData[i], 'FILENAME', q) + `</a></td > < !--파일명-->`;
                            }
                            appendHtml +=
                                `<td>` + makeLegacyData(legacyData[i], 'OGCOMPANYNAME', q) + `</td> <!--출재사명-->
                                <td>` + makeLegacyData(legacyData[i], 'CTNM', q) + `</td> <!--계약명-->
                                <td>` + makeLegacyData(legacyData[i], 'UY', q) + `</td> <!--UY-->
                                <td>` + makeLegacyData(legacyData[i], 'CURCD', q) + `</td> <!--화폐코드-->
                                <td>` + makeLegacyData(legacyData[i], 'CURUNIT', q) + `</td> <!--화폐단위-->
                                <td>` + makeLegacyData(legacyData[i], 'PAIDPERCENT', q) + `</td> <!--Paid(100%)-->
                                <td>` + makeLegacyData(legacyData[i], 'PAIDSHARE', q) + `</td> <!--Paid(Our Share)-->
                                <td>` + makeLegacyData(legacyData[i], 'OSLPERCENT', q) + `</td> <!--OSL(100%)-->
                                <td>` + makeLegacyData(legacyData[i], 'OSLSHARE', q) + `</td> <!--OSL(Our Share)-->
                                <td>` + makeLegacyData(legacyData[i], 'PM', q) + `</td> <!--PREMIUM-->
                                <td>` + makeLegacyData(legacyData[i], 'PMPFEND', q) + `</td> <!--PREMIUM P/F ENT-->
                                <td>` + makeLegacyData(legacyData[i], 'PMPFWOS', q) + `</td> <!--PREMIUM P/F WOS-->
                                <td>` + makeLegacyData(legacyData[i], 'XOLPM', q) + `</td> <!--XOL PREMIUM-->
                                <td>` + makeLegacyData(legacyData[i], 'RETURNPM', q) + `</td> <!--RETURN PREMIUM-->
                                <td>` + makeLegacyData(legacyData[i], 'CN', q) + `</td> <!--COMMISSION-->
                                <td>` + makeLegacyData(legacyData[i], 'PROFITCN', q) + `</td> <!--PROFIT COMMISION-->
                                <td>` + makeLegacyData(legacyData[i], 'BROKERAGE', q) + `</td> <!--BROKERAGE-->
                                <td>` + makeLegacyData(legacyData[i], 'TAX', q) + `</td> <!--TEX-->
                                <td>` + makeLegacyData(legacyData[i], 'OVERRIDINGCOM', q) + `</td> <!-- OVERIDING COM-->
                                <td>` + makeLegacyData(legacyData[i], 'CHARGE', q) + `</td> <!--CHARGE-->
                                <td>` + makeLegacyData(legacyData[i], 'PMRESERVERTD', q) + `</td> <!--PREMIUM RESERVE RTD-->
                                <td>` + makeLegacyData(legacyData[i], 'PFPMRESERVERTD', q) + `</td> <!--P/F PREMIUM RESERVE RTD-->
                                <td>` + makeLegacyData(legacyData[i], 'PMRESERVERTD2', q) + `</td> <!--P/F PREMIUM RESERVE RLD-->
                                <td>` + makeLegacyData(legacyData[i], 'PFPMRESERVERTD2', q) + `</td> <!--P/F PREMIUM RESERVE RLD-->
                                <td>` + makeLegacyData(legacyData[i], 'CLAIM', q) + `</td> <!--CLAIM -->
                                <td>` + makeLegacyData(legacyData[i], 'LOSSRECOVERY', q) + `</td> <!--LOSS RECOVERY -->
                                <td>` + makeLegacyData(legacyData[i], 'CASHLOSS', q) + `</td> <!--CASH LOSS -->
                                <td>` + makeLegacyData(legacyData[i], 'CASHLOSSRD', q) + `</td> <!--CASH LOSS REFUND -->
                                <td>` + makeLegacyData(legacyData[i], 'LOSSRR', q) + `</td> <!--LOSS RESERVE RTD -->
                                <td>` + makeLegacyData(legacyData[i], 'LOSSRR2', q) + `</td> <!--LOSS RESERVE RLD -->
                                <td>` + makeLegacyData(legacyData[i], 'LOSSPFEND', q) + `</td> <!--LOSS P/F ENT -->
                                <td>` + makeLegacyData(legacyData[i], 'LOSSPFWOA', q) + `</td> <!--LOSS P/F WOA -->
                                <td>` + makeLegacyData(legacyData[i], 'INTEREST', q) + `</td> <!--INTEREST -->
                                <td>` + makeLegacyData(legacyData[i], 'TAXON', q) + `</td> <!--TAX ON -->
                                <td>` + makeLegacyData(legacyData[i], 'MISCELLANEOUS', q) + `</td> <!--MISCELLANEOUS -->
                                <td>` + makeLegacyData(legacyData[i], 'CSCOSARFRNCNNT2', q) + `</td> <!--YOUR REF -->
                            </tr>`;
                        }

                        // ml data
                        appendHtml += `<tr class="mlTr">`;
                        if (imgId == "null") {
                            appendHtml += `<td colspan="36"></td>`;
                        } else {
                            appendHtml +=
                                `<td>` + makeMLSelect(mlData, 0, imgId) + `</td> <!--출재사명-->
                                <td>` + makeMLSelect(mlData, 1, imgId) + `</td> <!--계약명-->
                                <td>` + makeMLSelect(mlData, 2, imgId) + `</td> <!--UY-->
                                <td>` + makeMLSelect(mlData, 3, imgId) + `</td> <!--화폐코드--> 
                                <td>` + makeMLSelect(mlData, 4, imgId) + `</td> <!--화폐단위-->
                                <td>` + makeMLSelect(mlData, 5, imgId) + `</td> <!--Paid(100%)-->
                                <td>` + makeMLSelect(mlData, 6, imgId) + `</td> <!--Paid(Our Share)-->
                                <td>` + makeMLSelect(mlData, 7, imgId) + `</td> <!--OSL(100%)-->
                                <td>` + makeMLSelect(mlData, 8, imgId) + `</td> <!--OSL(Our Share)-->
                                <td>` + makeMLSelect(mlData, 9, imgId) + `</td> <!--PREMIUM-->
                                <td>` + makeMLSelect(mlData, 10, imgId) + `</td> <!--PREMIUM P/F ENT-->
                                <td>` + makeMLSelect(mlData, 11, imgId) + `</td> <!--PREMIUM P/F WOS-->
                                <td>` + makeMLSelect(mlData, 12, imgId) + `</td> <!--XOL PREMIUM-->
                                <td>` + makeMLSelect(mlData, 13, imgId) + `</td> <!--RETURN PREMIUM-->
                                <td>` + makeMLSelect(mlData, 14, imgId) + `</td> <!--COMMISSION--> 
                                <td>` + makeMLSelect(mlData, 15, imgId) + `</td> <!--PROFIT COMMISION-->
                                <td>` + makeMLSelect(mlData, 16, imgId) + `</td> <!--BROKERAGE-->
                                <td>` + makeMLSelect(mlData, 17, imgId) + `</td> <!--TEX-->
                                <td>` + makeMLSelect(mlData, 18, imgId) + `</td> <!-- OVERIDING COM-->
                                <td>` + makeMLSelect(mlData, 19, imgId) + `</td> <!--CHARGE-->
                                <td>` + makeMLSelect(mlData, 20, imgId) + `</td> <!--PREMIUM RESERVE RTD-->
                                <td>` + makeMLSelect(mlData, 21, imgId) + `</td> <!--P/F PREMIUM RESERVE RTD-->
                                <td>` + makeMLSelect(mlData, 22, imgId) + `</td> <!--PREMIUM RESERVE RLD-->
                                <td>` + makeMLSelect(mlData, 23, imgId) + `</td> <!--P/F PREMIUM RESERVE RLD-->
                                <td>` + makeMLSelect(mlData, 24, imgId) + `</td> <!--CLAIM -->
                                <td>` + makeMLSelect(mlData, 25, imgId) + `</td> <!--LOSS RECOVERY -->
                                <td>` + makeMLSelect(mlData, 26, imgId) + `</td> <!--CASH LOSS -->
                                <td>` + makeMLSelect(mlData, 27, imgId) + `</td> <!--CASH LOSS REFUND -->
                                <td>` + makeMLSelect(mlData, 28, imgId) + `</td> <!--LOSS RESERVE RTD --> 
                                <td>` + makeMLSelect(mlData, 29, imgId) + `</td> <!--LOSS RESERVE RLD -->
                                <td>` + makeMLSelect(mlData, 30, imgId) + `</td> <!--LOSS P/F ENT -->
                                <td>` + makeMLSelect(mlData, 31, imgId) + `</td> <!--LOSS P/F WOA -->
                                <td>` + makeMLSelect(mlData, 32, imgId) + `</td> <!--INTEREST -->
                                <td>` + makeMLSelect(mlData, 33, imgId) + `</td> <!--TAX ON -->
                                <td>` + makeMLSelect(mlData, 34, imgId) + `</td> <!--MISCELLANEOUS -->
                                <td>` + makeMLSelect(mlData, 35, imgId) + `</td> <!--YOUR REF --> `;
                        }
                        appendHtml += "</tr>";
                    }
                }
            } else {
                appendHtml += `<tr><td colspan="39">조회할 데이터가 없습니다.</td></tr>`;
            }
            //$(appendHtml).appendTo($("#tbody_batchList")).slideDown('slow');
            if (addCond == "LEARN_N") {
                $("#tbody_batchList_before").empty().append(appendHtml);
                //compareMLAndAnswer(data);
            } else {
                $("#tbody_batchList_after").empty().append(appendHtml);               
            }
            endProgressBar(); // end progressbar
            checkboxEvent(); // refresh checkbox event
            $('input[type=checkbox]').ezMark();
            imgPopupEvent();
        },
        error: function (err) {
            endProgressBar(); // end progressbar
            console.log(err);
        }

    });

    function makeLegacyData(object, colname, num) {
        var values = object[colname].split('||');
        return values[num] == "null" ? '' : values[num];
    }

    function makeMLSelect(mlData, collabel, imgId) {

        var appendMLSelect = '<select>';
        var hasColvalue = false;
        for (var y = 0; y < mlData.length; y++) {

            if (mlData[y].IMGID == imgId) {
                if (mlData[y].COLLABEL == collabel) {
                    hasColvalue = true;
                    appendMLSelect += '<option>' + mlData[y].COLVALUE + '</option>';
                }
            }
        }
        appendMLSelect += '</select>';

        return hasColvalue ? appendMLSelect : '';
    }
};

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

function fn_viewImageData(imgId, obj) {

    //$('#viewImage').attr('src', '../../uploads/' + $(obj).text().split('.')[0] + '.jpg');
    //layer_open('layer3');

    var imgParam = {
        imgId: imgId
    };
    $.ajax({
        url: '/batchLearning/viewImage',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(imgParam),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            console.log("data : " + JSON.stringify(data));
            if (data.code == "201") {
                $("#span_view_image").remove();
                $('#viewImage').after(`<span id="span_view_image">이미지를 변환중입니다. 다시 확인해주세요.<span>`);
            } else {
                $("#span_view_image").remove();
                $('#viewImage').attr('src', `${data.rows[0].CONVERTEDIMGPATH}`);
            }
            
            innerFn_ViewImageData();
        },
        error: function (err) {
            console.log(err);
        }
    });

    // 2018-08-06
    function innerFn_ViewImageData() {
        var param = {
            imgId: imgId
        };
        var appendHtml = ``;

        $.ajax({
            url: '/batchLearning/viewImageData',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            success: function (data) {
                if (data.length > 0) {
                    $.each(data, function (index, entry) {
                        appendHtml += `
                            <tr>
                                <td scope="row">${nvl(entry.FILEPATH)}</td>
                                <td scope="row">${nvl(entry.IMGID)}</td>
                                <td scope="row">${nvl(entry.STATEMENTDIV)}</td>
                                <td scope="row">${nvl(entry.CONTRACTNUM)}</td>
                                <td scope="row">${nvl(entry.CTNM)}</td>
                                <td scope="row">${nvl(entry.OGCOMPANYCODE)}</td>
                                <td scope="row">${nvl(entry.OGCOMPANYNAME)}</td>
                                <td scope="row">${nvl(entry.BROKERCODE)}</td>
                                <td scope="row">${nvl(entry.BROKERNAME)}</td>
                                <td scope="row">${nvl(entry.INSSTDT)}</td>
                                <td scope="row">${nvl(entry.INSENDDT)}</td>
                                <td scope="row">${nvl(entry.CURCD)}</td>
                                <td scope="row">${nvl(entry.PAIDPERCENT)}</td>
                                <td scope="row">${nvl(entry.PAIDSHARE)}</td>
                                <td scope="row">${nvl(entry.GROSSPM)}</td>
                                <td scope="row">${nvl(entry.PM)}</td>
                                <td scope="row">${nvl(entry.PMPFEND)}</td>
                                <td scope="row">${nvl(entry.PMPFWOS)}</td>
                                <td scope="row">${nvl(entry.XOLPM)}</td>
                                <td scope="row">${nvl(entry.RETURNPM)}</td>
                                <td scope="row">${nvl(entry.GROSSCN)}</td>
                                <td scope="row">${nvl(entry.CN)}</td>
                                <td scope="row">${nvl(entry.PROFITCN)}</td>
                                <td scope="row">${nvl(entry.BROKERAGE)}</td>
                                <td scope="row">${nvl(entry.TAX)}</td>
                                <td scope="row">${nvl(entry.OVERRIDINGCOM)}</td>
                                <td scope="row">${nvl(entry.CHARGE)}</td>
                                <td scope="row">${nvl(entry.PMRESERVERTD1)}</td>
                                <td scope="row">${nvl(entry.PFPMRESERVERTD1)}</td>
                                <td scope="row">${nvl(entry.PMRESERVERTD2)}</td>
                                <td scope="row">${nvl(entry.PFPMRESERVERTD2)}</td>
                                <td scope="row">${nvl(entry.CLAIM)}</td>
                                <td scope="row">${nvl(entry.LOSSRECOVERY)}</td>
                                <td scope="row">${nvl(entry.CASHLOSS)}</td>
                                <td scope="row">${nvl(entry.CASHLOSSRD)}</td>
                                <td scope="row">${nvl(entry.LOSSRR)}</td>
                                <td scope="row">${nvl(entry.LOSSRR2)}</td>
                                <td scope="row">${nvl(entry.LOSSPFEND)}</td>
                                <td scope="row">${nvl(entry.LOSSPFWOA)}</td>
                                <td scope="row">${nvl(entry.INTEREST)}</td>
                                <td scope="row">${nvl(entry.TAXON)}</td>
                                <td scope="row">${nvl(entry.MISCELLANEOUS)}</td>
                                <td scope="row">${nvl(entry.PMBL)}</td>
                                <td scope="row">${nvl(entry.CMBL)}</td>
                                <td scope="row">${nvl(entry.NTBL)}</td>
                                <td scope="row">${nvl(entry.CSCOSARFRNCNNT2)}</td>
                            </tr>
                            `;
                    });
                } else {
                    appendHtml += `<tr><td colspan="46">정답 데이터가 없습니다.</td></tr>`;
                }
                $("#tbody_batchList_answer").empty().append(appendHtml);
                layer_open('layer3');
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
}
function imgPopupEvent() {
    //$('#tbody_batchList_before td > a').click(function () {
    //    $('#viewImage').attr('src', '../../uploads/' + $(this).text().split('.')[0] + '.jpg');
    //    layer_open('layer3');
    //});
}

// [Select] 배치학습데이터 조회
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
            startProgressBar();
            addProgressBar(0, 30);
        },
        success: function (data) {
            $("#progressMsgTitle").html("processing learn data...");
            addProgressBar(31, 40);
            //console.log("/batchLearning/searchBatchLearnData result :");
            //console.log(data);           
            if (data.code == 400) {
                alert(data.msg);
                return;
            }

            if (flag == "PROCESS_IMAGE") {  // 배치학습 실행             
				$("#progressMsgTitle").html("processing OCR ...");
                addProgressBar(41, 50);
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
            endProgressBar(); // end progressbar
            console.log(err);
        }
    });
};

// syncServerFile (서버의 이미지가 DB에 등록이 안되어있다면 DB에 등록처리)
var fn_syncServerFile = function () {
    var param = {};
    startProgressBar(); // start progressbar
    addProgressBar(1, 1); // proceed progressbar
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
                    addProgressBar(2, 99);
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
};

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


// 배치학습 실행
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
                        var filepath = $(this).parent().next().val();
                        imgIdArray.push(filepath);
                    }
                });
                if (chkCnt == 0) {
                    alert("선택된 학습이 없습니다.");
                    return;
                } else {
                    //searchBatchLearnData(imgIdArray, "PROCESS_IMAGE");
                    batchLearnTraing(imgIdArray, "PROCESS_IMAGE");
                }
            } else {
                alert("Before Training 상태에서만 배치학습이 가능합니다.");
                return;
            }
            break;
        case "2":        // 학습 범위 지정
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
    //if (addCond == "LEARN_Y") {
        //let imgId = "";
        //let chkCnt = 0;
        $("input[name=listCheck_before]").each(function (index, entry) {
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
            uiFlag = "Y";
            searchBatchLearnData(imgIdArray, "PROCESS_IMAGE");
        }
    //} else {
    //    alert("After Training 상태에서만 UI학습이 가능합니다.");
    //    return;
    //}

};

// [Select] 배치학습데이터 조회
var batchLearnTraing = function (imgIdArray, flag) {
    var param = {
        imgIdArray: imgIdArray,
        uiCheck: $('#uiTrainingChk').is(':checked')
    };

    $.ajax({
        url: '/batchLearning/batchLearnTraing',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $('#btn_pop_batch_close').click();
            $("#progressMsgTitle").html("retrieving learn data...");
            startProgressBar();
            addProgressBar(0, 41);
        },
        success: function (data) {
            $("#progressMsgTitle").html("processing learn data...");
            console.log(data);

            searchBatchLearnDataList(addCond);

            if ($('#uiTrainingChk').is(':checked') && data.data[0].uiTraining == "uiTraining") {
                compareLayer(data);
            }
        },
        error: function (err) {
            endProgressBar(); // end progressbar
            console.log(err);
        },
        complete: function () {
            console.log("done");
            addProgressBar(41, 100);
            endProgressBar();
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
    mainImgHtml += '<div id="imageZoom">';
    mainImgHtml += '<div id="redZoomNemo">';
    mainImgHtml += '</div>';
    mainImgHtml += '</div>';
    $('#img_content').html(mainImgHtml);
    $('#mainImage').css('background-image', 'url("../..' + fileInfo.CONVERTEDIMGPATH + '")');

    var tblTag = '';
    for (var i in mlData) {
        tblTag += '<dl>';
        tblTag += '<dt onmouseover="hoverSquare(this)" onmouseout="moutSquare(this)">';
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
    console.log(beforeData);
    // afterData Processing
    $('#textResultTbl > dl').each(function (index, el) {
        var location = $(el).find('label').children().eq(1).val();
        var text = $(el).find('label').children().eq(0).val();
        var colLbl = $(el).find('select').find('option:selected').val();
        afterData.data.push({ 'location': location, 'text': text, 'colLbl': colLbl });
    });

    // find an array of data with the same filename
    $.ajax({
        url: '/common/modifyTextData',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'beforeData': beforeData[0], 'afterData': afterData }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            fn_batchUiTraining();
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// UI학습 팝업 실행
var fn_batchUiTraining = function () {
    console.log(JSON.stringify(modifyData))
    var mldata = modifyData;
    var trainData = {};
    var arr = [];
    var trainData = {};
    trainData.data = [];
    if (mldata.docCategory) { // 추출된 문서가 있을 경우
        trainData.docCategory = [mldata.docCategory[0]];
    } else {
        trainData.docCategory = null;
    }

    if ($('#docData').val() != '') { // 문서 종류를 수정했다면
        if (mldata.docCategory) { // 추출된 문서가 있을 경우
            trainData.docCategory[0] = JSON.parse($('#docData').val());
        } else {
            trainData.docCategory = [JSON.parse($('#docData').val())];
        }
    }

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
                        trainData.data.push(arr[j]);
                    }
                } else { // etc
                    if (mldata.data[i].colLbl != arr[j].colLbl) {
                        arr[j].text = mldata.data[i].text // origin text (Does not reflect changes made by users) 
                        trainData.data.push(arr[j]);
                    }
                }

            }
        }
    }

    docLabelMapping(trainData);
	
	/*
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
	*/
};

// 양식레이블 매핑
var docLabelMapping = function (data) {
    startProgressBar();
    $('#progressMsgTitle').css("color", "black");
    $('#progressMsgTitle').html('문서 라벨 맵핑 학습 중..');
    addProgressBar(1, 25);
    insertDocLabelMapping(data, callbackInsertDocLabelMapping);
};

var callbackInsertDocLabelMapping = function (data) {
    $('#progressMsgTitle').html('문서 맵핑 학습 중..');
    addProgressBar(26, 50);
    insertDocMapping(data, callbackInsertDocMapping);
};

var callbackInsertDocMapping = function (data) {
    $('#progressMsgTitle').html('컬럼 맵핑 학습 중..');
    addProgressBar(51, 75);
    insertColMapping(data, callbackInsertColMapping);
};

var callbackInsertColMapping = function (data) {
    $('#progressMsgTitle').html('학습 처리 중..');
    addProgressBar(76, 100);
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
                addProgressBar(81, 100);
                alert(data.message);
                //popupEvent.batchClosePopup('retrain');
            }
        },
        error: function (err) {
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
        data: JSON.stringify({ 'data': data  }),
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
            console.log(err);
        }
    });
}

// 컬럼 매핑 ml 데이터 insert
function insertColMapping(data) {

    /*
    var param = [];
    for (var i in data.data) {
        if (data.data[i].column != 999) {
            param.push(data.data[i]);
        }
    }
    */
    //var dacCategory = JSON.parse($('#docData').val());

    $.ajax({
        url: '/batchLearning/insertColMapping',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            console.log(res);
            addProgressBar(81, 100);
            alert("success training");
            //callback(data);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// 계약명 매핑 insert
function insertContractMapping(data,callback) {
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
            console.log(err);
        }
    });
}

//문서 비교 popup 버튼 클릭 이벤트
function docComparePopup(imgIndex, obj) {
    var imgId = imgIndex.substring(0, imgIndex.lastIndexOf("."));
    $('#originImg').attr('src', '../../uploads/' + imgId + ".jpg");
    $('#mlPredictionDocName').val(obj.innerText);
    //$('#searchImg').attr('src', '../../' + lineText[imgIndex].docCategory.SAMPLEIMAGEPATH);
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
            $('#docSearchResult img').attr('src', docPopImages[docPopImagesCurrentCount - 1].SAMPLEIMAGEPATH);
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
            $('#docSearchResult img').attr('src', docPopImages[docPopImagesCurrentCount - 1].SAMPLEIMAGEPATH);

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
        } 
    });
}

// 팝업 확인 및 취소 이벤트
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
    $('#btn_pop_doc_cancel').click(function (e) {
        $('#docData').val('');

        e.stopPropagation();
        e.preventDefault();
    });
}

//팝업 문서 양식 등록
function popUpInsertDocCategory() {
    $('#insertDocCategoryBtn').click(function () {
        if ($('.ez-selected').children('input').val() == 'choice-2') {
            var docName = $('#newDocName').val();
            var sampleImagePath = $('#originImg').attr('src').split('/')[2] + '/' + $('#originImg').attr('src').split('/')[3];
            $.ajax({
                url: '/batchLearning/insertDocCategory',
                type: 'post',
                datatype: 'json',
                data: JSON.stringify({ 'docName': docName, 'sampleImagePath': sampleImagePath }),
                contentType: 'application/json; charset=UTF-8',
                success: function (data) {
                    if (data.code == 200) {
                        //console.log(data);
                        $('#docData').val(JSON.stringify(data.docCategory[0]));
                        $('#docName').text(data.docCategory[0].DOCNAME);
                        $('#layer4').fadeOut();
                    } else {
                        alert(data.message);
                    }
                },
                error: function (err) {
                    console.log(err);
                }
            });
        } 
    });
}

// 문서 양식 조회 팝업 라디오 이벤트
function changeDocPopRadio() {
    $('#orgDocSearchRadio').click(function () {
        $('#orgDocSearch').show();
        $('#newDocRegistration').hide();
    });

    $('#newDocRegistrationRadio').click(function () {
        $('#newDocRegistration').show();
        $('#orgDocSearch').hide();
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
    popUpEvent();
    searchBatchLearnDataList(addCond);   // 배치 학습 데이터 조회
    changeDocPopupImage();      // 문서 양식 조회 이미지 좌우 버튼 이벤트
    changeDocPopRadio();        // 문서 양식 조회 팝업 라디오 이벤트
    popUpRunEvent();            // 문서 양식 조회 기존 양식 확인
    popUpInsertDocCategory();   // 문서 양식 조회 신규 등록 확인
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

    $('#mainImage').hide();
    $('#imageZoom').css('height', '570px').css('background-image', $('#mainImage').css('background-image')).show();

    // 사각형 좌표값
    var location, x, y, textWidth, textHeight;
    location = $(e).find('input[type=hidden]').val().split(',');
    x = parseInt(location[0]);
    y = parseInt(location[1]);
    textWidth = parseInt(location[2]);
    textHeight = parseInt(location[3]);
    //console.log("선택한 글씨: " + $(e).find('input[type=text]').val());

    // 해당 텍스트 x y좌표 원본 이미지에서 찾기
    $('#imageZoom').css('background-position', '-' + (x - 5) + 'px -' + (y - 205) + 'px');

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
    $('#redZoomNemo').css('width', textWidth + 10);
    $('#redZoomNemo').css('height', textHeight + 10);
    $('#redZoomNemo').show();
}

// 마우스 아웃 이벤트
function moutSquare(e) {
    //$('#redNemo').hide();
    $('#redZoomNemo').hide();
    $('#imageZoom').hide();
    $('#mainImage').show();
}


