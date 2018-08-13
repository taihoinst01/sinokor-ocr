//import { identifier } from "babel-types";
"use strict";

$(function () {
    _init();
});

/***************************************************
 * Event
 ***************************************************/
// [셀렉트박스] 소속팀 클릭
var selectFaoTeam = function (val) {
    $("#select_faoTeam").val(val);
};
// [셀렉트박스] 소속파트 클릭
var selectFaoPart = function (val) {
    $("#select_faoPart").val(val);
};
// [셀렉트박스] 문서담당자 클릭
var selectDocManager = function (val) {
    $("#select_docManager").val(val);
};
// [이벤트] 체크박스
var checkboxEvent = function () {
    // all checkbox
    $("#listCheckAll").on("click", function () {
        if ($("#listCheckAll").prop("checked")) {
            $("input[name=chk_document]").attr("checked", true);
            $("input[name=chk_document]").parent().addClass("ez-checked");
        }
        else {
            $("input[name=chk_document]").attr("checked", false);
            $("input[name=chk_document]").parent().removeClass("ez-checked");
        }

    });
};
// [이벤트] 버튼
var buttonEvent = function () {
    // 문서 리스트 조회
    $("#btn_search").on("click", function () {
        $("#div_base").hide();
        $("#div_dtl").hide();
        $("#div_image").hide();
        fn_search();
    });
    // 승인
    $("#btn_baseList_approval").on("click", function () {
        fn_baseList_chk('C');
    });
    // 반려
    $("#btn_baseList_return").on("click", function () {
        fn_baseList_chk('R');
    });
    // 전달
    $("#btn_baseList_forward").on("click", function () {
        fn_baseList_chk('P');
    });
};
// [이벤트] 날짜 (datepicker)
var datePickerEvent = function () {
    //datepicker 한국어로 사용하기 위한 언어설정
    $.datepicker.setDefaults($.datepicker.regional['ko']);

    // Datepicker
    $(".datepicker").datepicker({
        showButtonPanel: true,
        dateFormat: "yy-mm-dd",
        onClose: function (selectedDate) {

            var eleId = $(this).attr("id");
            var optionName = "";

            if (eleId.indexOf("StartDate") > 0) {
                eleId = eleId.replace("StartDate", "EndDate");
                optionName = "minDate";
            } else {
                eleId = eleId.replace("EndDate", "StartDate");
                optionName = "maxDate";
            }

            $("#" + eleId).datepicker("option", optionName, selectedDate);
            $(".searchDate").find(".chkbox2").removeClass("on");
        }
    });
    //$(".dateclick").dateclick();		// DateClick
    $(".searchDate").schDate();	// searchDate

    // 1개월전 날짜 구하기 (searchStartDate)
    var startDate = getAddMonth(-1, "-");
    $("#searchStartDate").val(startDate);

    // 오늘날짜 구하기 (searchEndDate)
    var endDate = getNowDate("-");
    $("#searchEndDate").val(endDate);
};





/***************************************************
 * Function
 ***************************************************/

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
    $("tr[name='tr_dtl']").on("click", function () {
        var id = $(this).attr("id");
        var imgId = id.replace("tr_dtl_", "");
        fn_search_image(imgId); // image 조회
    });
};

// document 조회
var fn_search = function () {
    var approvalState = "";
    var st1 = $("#st1").is(":checked") ? $("#st1").val() : "";
    var st2 = $("#st2").is(":checked") ? $("#st2").val() : "";
    var st3 = $("#st3").is(":checked") ? $("#st3").val() : "";
    if ((st1.length + st2.length + st3.length) > 0) { // 하나라도 생성되면 조건 생성
        approvalState += "(";
        if (st1.length > 0) approvalState += "'" + st1 + "',";
        if (st2.length > 0) approvalState += "'" + st2 + "',";
        if (st3.length > 0) approvalState += "'" + st3 + "',";
        approvalState = approvalState.slice(0, -1); // 마지막 구분자 제거
        approvalState += ")";
    }
    var param = {
        docNum: nvl($("#docNum").val()),
        faoTeam: nvl($("#select_faoTeam").val()),
        faoPart: nvl($("#select_faoPart").val()),
        documentManager: nvl($("#documentManager").val()),
        deadLineDt: nvl($("#deadLineDt").val()),
        searchStartDate: nvl($("#searchStartDate").val()),
        searchEndDate: nvl($("#searchEndDate").val()),
        approvalState: approvalState
    };
    console.log("조건 : " + JSON.stringify(param));

    var appendHtml = "";
    $.ajax({
        url: '/myApproval/searchApprovalList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsgTitle").html("retrieving document list...");
            startProgressBar(); // start progressbar
            addProgressBar(1, 1); // proceed progressbar
        },
        success: function (data) {
            //$("#div_base").hide();
            addProgressBar(2, 99); // proceed progressbar
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    var state = "";
                    switch (nvl(entry['APPROVALSTATE'])) {
                        case "P":
                            state = "진행";
                            break;
                        case "C":
                            state = "승인";
                            break;
                        case "R":
                            state = "반려";
                            break;
                        case "U":
                            state = "업로드";
                            break;
                        default:
                            break;
                    }
                    appendHtml += `
                        <tr id="tr_base_${entry['SEQNUM']}-${entry['DOCNUM']}-${entry['APPROVALSTATE']}" style="cursor:pointer">
                            <th scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="${entry['SEQNUM']}-${entry['DOCNUM']}" class="sta00 stck_tr" name="chk_document" /></div></th>
                            <td name="td_base">${entry['DOCNUM']}</td>
                            <td name="td_base">${nvl(entry['PAGECNT'])}</td>
                            <td name="td_base">${nvl(entry['DEADLINEDT'])}</td>
                            <td name="td_base">${nvl(entry['APPROVALREPORTER'])}<input type="hidden" id="reporter_${entry['SEQNUM']}-${entry['DOCNUM']}" val="${nvl(entry['APPROVALREPORTER'])}" /></td>
                            <td name="td_base">${nvl(entry['DOCUMENTMANAGER'])}<input type="hidden" id="manager_${entry['SEQNUM']}-${entry['DOCNUM']}" val="${nvl(entry['DOCUMENTMANAGER'])}" /></td>
                            <td><label for="intxt_001" class="blind">메모1</label><input type="text" name="intxt_0" id="memo_${entry['SEQNUM']}-${entry['DOCNUM']}" class="inputst_box01" value="${nvl(entry['MEMO'])}" /></td>
                            <td name="td_base">${state}</td>
                        </tr>`;
                });
            } else {
                appendHtml += `<tr><td colspan="7">조회할 데이터가 없습니다.</td></tr>`;
            }
            $("#tbody_baseList").empty().append(appendHtml);
            $("#span_document").empty().html(`결재리스트(기본) - ${data.length}건`);
            $("#div_base").fadeIn('slow');
            fn_clickEvent(); // regist and refresh click event
            $('input[type=checkbox]').ezMark();
            endProgressBar(); // end progressbar
        },
        error: function (err) {
            endProgressBar(); // end progressbar
            console.log(err);
        }
    });
};

// document_dtl 조회
var fn_search_dtl = function (seqNum, docNum) {
    var param = {
        seqNum: seqNum,
        docNum: docNum
    };
    var appendHtml = "";
    $.ajax({
        url: '/myApproval/searchApprovalDtlList',
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
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    appendHtml += `
                        <tr id="tr_dtl_${entry['IMGID']}" name="tr_dtl" style="cursor:pointer">
                            <th scope="row">${entry["IMGFILESTARTNO"]} ~ ${entry["IMGFILESTARTNO"]} </th>
                            <td>${nvl(entry["CONTRACTNUM"])}</td>
                            <td><a href="#none" class="tip" title="${nvl(entry["CTNM"])}">${nvl(entry["CTNM"])} </a></td>
                            <td>${nvl(entry["UY"])}</td>
                            <td>${nvl(entry["CURCD"])}</td>
                            <td>${nvl(entry["NTBL"])}</td>
                            <td>${nvl(entry["ENTRYNO"])}</td>
                        </tr>
                    `;
                });
            } else {
                appendHtml += `<tr><td colspan="7">조회할 데이터가 없습니다.</td></tr>`;
            }
            $("#tbody_dtlList").empty().html(appendHtml);
            $("#span_document_dtl").empty().html(`결재리스트(상세) - ${data.length}건`);
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
        url: '/myApproval/searchApprovalImageList',
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
// 체크된 문서 갯수 확인하고 승인/반려/전달 실행
var fn_baseList_chk = function (flag) {
    var chkCnt = 0;
    var arrSeqNum = [];
    var arrState = [];
    var arrMemo = [];
    var arrReporter = [];
    var arrManager = [];
    var val = "";
    $("input[name=chk_document]").each(function (index, value) {
        if ($(this).is(":checked")) {
            val = $(this).val().split("-");  // value="${entry['SEQNUM']}-${entry['DOCNUM']}"
            var memo = "memo_" + val[0] + "-" + val[1];
            var reporter = "reporter_" + val[0] + "-" + val[1];
            var manager = "manager_" + val[0] + "-" + val[1];
            alert($("#"+manager).val());
            arrSeqNum.push(val[0]);
            arrState.push(val[2]);
            arrMemo.push(nvl($("#" + memo).val()));
            arrReporter.push(nvl($("#" + reporter).val()));
            arrManager.push(nvl($("#" + manager).val()));
            chkCnt++;
        }
    });

    if (chkCnt > 0) {
        var param = {
            flag: flag,
            arrSeqNum: arrSeqNum,
            arrState: arrState,
            arrMemo: arrMemo,
            arrReporter: arrReporter,
            arrManager: arrManager
        };
        $.ajax({
            url: '/myApproval/updateState',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                if (flag == "C") $("#progressMsgTitle").html("승인처리 중 입니다.");
                else if (flag == "R") $("#progressMsgTitle").html("반려처리 중 입니다.");
                else if (flag == "P") $("#progressMsgTitle").html("전달 중 입니다.");
                startProgressBar(); // start progressbar
                addProgressBar(1, 99); // proceed progressbar
            },
            success: function (data) {
                if (flag == "C") alert("승인처리 되었습니다.");
                else if (flag == "R") alert("반려처리 되었습니다.");
                else if (flag == "P") alert("전달되었습니다.");
                else alert("잘못된 경로로 접근하였습니다.");
                $("#btn_search").click();
                endProgressBar();
            },
            error: function (err) {
                console.log(err);
                endProgressBar();
            }
        });
    } else {
        alert("선택된 문서가 없습니다.");
        return;
    }
}


// [시작 함수]
var _init = function () {
    checkboxEvent();
    buttonEvent();
    datePickerEvent();
};

// [화면 테스트]
var screenTest = function (flag) {
    switch (flag) {
        case "base":
            $("#div_base").fadeToggle();
            break;
        case "dtl":
            $("#div_dtl").fadeToggle();
            break;
        case "image":
            $("#div_image").fadeToggle();
            break;
        default:
            break;
    }
};