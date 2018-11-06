﻿//import { identifier } from "babel-types";
"use strict";
var deptList = []; //부서
$(function () {
    _init();
});

$(window).on('keyup', function (e) {
    if (e.keyCode == '9') {
        //console.log(e);
        if (e.target.id == "mCSB_1") {
            $("#btn_baseList_return").focus();
        }

        if (e.target.tagName == "A" && e.target.parentNode.tagName == "TD") {
            $(e.target).click();
        }
    }
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
            for (var i = 0; i < $("input[name=chk_document]").length; i++) {
                $("input[name=chk_document]").eq(i).prop("checked", true);
                $("input[name=chk_document]").eq(i).parent().addClass("ez-checked");
            }
        }
        else {
            for (var i = 0; i < $("input[name=chk_document]").length; i++) {
                $("input[name=chk_document]").eq(i).prop("checked", false);
                $("input[name=chk_document]").eq(i).parent().removeClass("ez-checked");
            }
        }

        for (var j = 0; j < $("input[name=chk_document]").length; j++) {
            if ($("input[name=chk_document]").eq(j).is(":checked")) {
                $('#btn_baseList_return').prop('disabled', false);
                $('#btn_baseList_forward').prop('disabled', false);
                if ($('#lastApproval').val() == 'Y') {
                    $('#btn_baseList_approval').prop('disabled', false);
                } else {
                    $('#btn_baseList_approval').prop('disabled', true);
                }
                break;
            }

            $('#btn_baseList_return').prop('disabled', true);
            $('#btn_baseList_forward').prop('disabled', true);
            $('#btn_baseList_approval').prop('disabled', true);
        }

    });

    //결재리스트(기본)
    $(document).on("click", "input[name=chk_document]", function () {
        if ($(this).is(":checked")) {
            $('#btn_baseList_return').prop('disabled', false);
            $('#btn_baseList_forward').prop('disabled', false);
            if ($('#lastApproval').val() == 'Y') {
                $('#btn_baseList_approval').prop('disabled', false);                              
            } else {
                $('#btn_baseList_approval').prop('disabled', true);    
            }
            //$("input[name=chk_document]").attr("checked", true);
            //$("input[name=chk_document]").parent().addClass("ez-checked");
            $(this).attr("checked", true);
            $(this).parent().addClass("ez-checked");
        }
        else {
            $('#btn_baseList_return').prop('disabled', true);
            $('#btn_baseList_forward').prop('disabled', true);
            $('#btn_baseList_approval').prop('disabled', true); 
            //$("input[name=chk_document]").attr("checked", false);
            //$("input[name=chk_document]").parent().removeClass("ez-checked");
            $(this).attr("checked", false);
            $(this).parent().removeClass("ez-checked");
        }

    });
    
};

// [이벤트] 버튼
var buttonEvent = function () {
    // 문서 리스트 조회
    $("#btn_search").on("click", function () {
        //$("#div_base").hide();
        //$("#div_dtl").hide();
        //$("#div_image").hide();
        fn_search();
    });
    // 승인
    $("#btn_baseList_approval").on("click", function () {
        fn_baseList_chk('승인');
    });
    // 반려
    $("#btn_baseList_return").on("click", function () {
        fn_baseList_chk('반려');

    });
    // 진행
    $("#btn_baseList_forward").on("click", function () {
        fn_baseList_chk('진행');
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
    $("td[name='td_base']").unbind();
    //$("tr[name='tr_dtl']").unbind();

    // Document 클릭 시 상세 조회
    $("td[name='td_base']").on("click", function () {
        var id = $(this).parent().attr("id");
        var numArr = id.replace("tr_base_", "");
        var seqNum = numArr.split("-")[0];
        var docNum = numArr.split("-")[1];
        
        //체크여부확인
        var chkResult1 = document.getElementById("chk_document_" + docNum);
        var chkResult2 = chkResult1.getAttribute("checked")
        if(chkResult2 == null ) {
            $("input:checkbox[id='chk_document_" + docNum + "']").parent().addClass('ez-checked');
            $("input:checkbox[id='chk_document_" + docNum + "']").attr("checked", true);
            fn_search_dtl(seqNum, docNum); // document_dtl 조회
            fn_search_image(docNum);
        }else {
            $("input:checkbox[id='chk_document_" + docNum + "']").parent().removeClass('ez-checked');
            $("input:checkbox[id='chk_document_" + docNum + "']").attr("checked", false);
        }

        //$("td[name='td_base']").unbind();
    });

    $('.box_img').click(function () {
        $('#ul_image > li').removeClass('on');
        $(this).parent().addClass('on');
        $("#main_image").prop("src", $(this).find("img").attr("src"));
    });

    /*
   // Document DTL 클릭 시 이미지 조회
    $("tr[name='tr_dtl']").on("click", function () {
        var id = $(this).attr("id");
        var imgId = id.replace("tr_dtl_", "");
        fn_search_image(imgId); // image 조회
        //$("td[name='td_base']").unbind();
    });
    */
};

// [사용자조회]
var selectUsers = function (flag, id, docId) {
    var param = {};
    $.ajax({
        url: '/myApproval/selectUsers',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
        },
        success: function (data) {
            var appendHtml = "";
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    if (flag == "REPORTER") {
                        appendHtml += '<li><a class="a_userIdList" href="javascript:fn_selectApprovalReporter("' + entry.SEQNUM + '", "' + entry.USERID + '")">' + entry.USERID + '</a></li>';
                        if (entry.USERID == id) {
                            $('#reporter_' + docId).val(entry.SEQNUM);
                            $('.myValueReporter_' + docId).html(entry.USERID);
                        }
                    } else if (flag == "MANAGER") {
                        appendHtml += '<li><a class="a_userIdList" href="javascript:fn_selectApprovalReporter("' + entry.SEQNUM + '", "' + entry.USERID + '")">' + entry.USERID + '</a></li>';
                        if (entry.USERID == id) {
                            $('#manager_' + docId).val(entry.SEQNUM);
                            $('.myValueManager_' + docId).html(entry.USERID);
                        }
                    }
                });
            }
            //if (flag == "REPORTER") $("#ul_highApproval").empty().append(appendHtml);
            return appendHtml;
        },
        error: function (err) {
            endProgressBar(); // end progressbar
            console.log(err);
        }
    });
};

// [이벤트] 결재상신자 리스트 생성 
var makeApprovalReporter = function (docId, reporter) {
    var userList = selectUsers("REPORTER", reporter, docId);
    return '<div class="select_style select_style_K">' +
            '<input type="hidden" id="reporter_' + docId + '" value="" />' +
            '<span class="ctrl"><span class="arrow"></span></span>' +
            '<button type="button" class="myValueReporter_' + docId + ' btnSelector">선택</button>' +
            '<ul id="ul_approvalReporter_' + docId + '" class="aList">' + userList + '</ul>' +
            '</div>';
}
// [이벤트] 문서담당자 리스트 생성 
var makeDocumentManager = function (docId, manager) {
    var userList = selectUsers("MANAGER", manager, docId);
    return '<div class="select_style select_style_K">' +
            '<input type="hidden" id="documentManager_' + docId + '" value="" />' +
            '<span class="ctrl"><span class="arrow"></span></span>' +
            '<button type="button" class="myValueManager_' + docId + ' btnSelector">선택</button>' +
            '<ul id="ul_documentManager_' + docId + '" class="aList">' + userList + '</ul>' +
            '</div>';
}

// document 조회 
//todo
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
    
    var level = '';
    if ($('#adminApproval').val() == 'Y') {
        level = 'adminApproval';
    } else if ($('#middleApproval').val() == 'Y' && $('#adminApproval').val() == 'N') {
        level = 'middleApproval';
    } else if ($('#lastApproval').val() == 'Y' && $('#adminApproval').val() == 'N') {
        level = 'lastApproval';
    } else {
        return false;
    }

    var param = {
        docNum: nvl($("#docNum").val()),
        faoTeam: nvl($("#select_faoTeam").val()),
        documentManager: nvl($("#documentManager").val()),
        deadLineDt: nvl($("#deadLineDt").val()),
        searchStartDate: nvl($("#searchStartDate").val()),
        searchEndDate: nvl($("#searchEndDate").val()),
        approvalState: approvalState,
        level: level,
        adminApproval: $('#adminApproval').val(),
        deadLine: $('#deadLineDt').val()
    };
    //console.log("조건 : " + JSON.stringify(param));

    var progressId;
    var appendHtml = "";
    $.ajax({
        url: '/myApproval/searchApprovalList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        /*beforeSend: function () {
            $("#progressMsgTitle").html("retrieving document list...");
            progressId = showProgressBar();
            //startProgressBar(); // start progressbar
            //addProgressBar(1, 1); // proceed progressbar
        },*/
        success: function (data) {           
            //$("#div_base").hide();
            //addProgressBar(2, 99); // proceed progressbar
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    var state = "";
                    var endDate = '';
                    if (!(nvl(entry["FINALDATE"]) == null)) {
                        endDate = (nvl(entry["FINALDATE"]).substring(0, 7)).replace('-','');
                    }
                    switch (nvl(entry['STATUS'])) {
                        case "02":
                            state = "진행";
                            break;
                        case "03":
                            state = "승인";
                            break;
                        case "04":
                            state = "반려";
                            break;
                        default:
                            break;
                    }
                    var docId = nvl(entry['SEQNUM']) + '-' + nvl(entry['DOCNUM']);
                    var idValue = "chk_document_" + nvl(entry['DOCNUM']);
                    if ($('#middleApproval').val() == 'Y' || $('#lastApproval').val() == 'Y') {
                        appendHtml +=
                            '<tr id="tr_base_' + entry["SEQNUM"] + '-' + entry["DOCNUM"] + '-' + entry["STATUS"] + '" style="cursor:pointer" name ="tr_base_chk">' +
                        '<th scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="' + docId + '" class="sta00 stck_tr" name="chk_document" id = "'+ idValue +'" /></div></th>' +
                            '<td name="td_base">' + entry["DOCNUM"] + '</td>' +
                            '<td name="td_base">' + nvl(entry["PAGECNT"]) + '</td>' +
                            '<td name="td_base">' + endDate + '</td>';
                        if ($('#middleApproval').val() == 'Y') {
                            appendHtml += '<td name="td_base" class="td_base">' + nvl(entry["ICRNUM"]) + '</td>';
                        } else {
                            appendHtml += '<td name="td_base" class="td_base">' + nvl(entry["MIDDLENUM"]) + '</td>';
                        }
                        appendHtml +=
                            '<td class="td_base">' + nvl(entry["NOWNUM"]) + '</td>' +
                            '<td><label for="intxt_001" class="blind">메모1</label><input type="text" name="intxt_0" id="memo_' + docId + '" class="inputst_box01" value="' + nvl(entry["MEMO"]) + '" /></td>' +
                            '<td name="td_base">' + state + '</td>' +
                            '</tr>';
                    } else {
                        appendHtml += '<tr><td colspan="8">조회할 데이터가 없습니다.</td></tr>';
                    }
                });
            } else {
                appendHtml += '<tr><td colspan="8">조회할 데이터가 없습니다.</td></tr>';

            }

            $("#tbody_baseList").empty().append(appendHtml);
            $("#span_document").empty().html('결재리스트(기본) - ' + data.length + '건');
            $("#div_base").fadeIn('slow');
            fn_clickEvent(); // regist and refresh click event
            $('input[type=checkbox]').ezMark();

            if (!$('#tbody_baseList > tr').find('td').eq(0).attr('colspan')){
                $('#tbody_baseList > tr').eq(0).find('td[name="td_base"]').eq(0).click();
            } else {
                $('#btn_baseList_return').prop('disabled', true);
                $('#btn_baseList_forward').prop('disabled', true);
                $('#btn_baseList_approval').prop('disabled', true);
                endProgressBar(progressId);
                progressId = null;
            }
            //endProgressBar(progressId); // end progressbar
        },
        error: function (err) {
            endProgressBar(progressId); // end progressbar
            console.log(err);
        }
    });
};

var fn_search_dtl_IF4 = function (seqNum, docNum) {
    var seqNum = seqNum;
    var docNum = docNum;
    var progressId;
    var appendHtml = "";
    $.ajax({
        //url: '/myApproval/searchApprovalDtlList',
        url: '/wF_WorkflowProc/IF4',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'docNum': docNum }),
        contentType: 'application/json; charset=UTF-8',
        /*  beforeSend: function () {
                $("#progressMsgTitle").html("retrieving document detail list...");
                progressId = showProgressBar();
                //startProgressBar(); // start progressbar
                //addProgressBar(1, 1); // proceed progressbar
            },*/
        success: function (data) {
            //addProgressBar(2, 99); // proceed progressbar
            if (data.data.length > 0) {
                for (var i = 0; i < data.data.length; i++) {
                    appendHtml +=
                        '<tr id="tr_dtl_' + docNum + '" name="tr_dtl" style="cursor:pointer">' +
                        '<td>' + data.data[i].acDvNm + '</td> <!--계산서구분-->' +
                        '<td>' + data.data[i].ctNo + '</td>' +
                        '<td>' + data.data[i].ctNm + '</td>' +
                        '<td>' + data.data[i].imgFileStNo + '</td>' +
                        '<td>' + data.data[i].imgFileEndNo + '</td>' +
                        '<td>' + data.data[i].curCd + '</td>' +
                        '<td>' + data.data[i].ntbl + '</td>' +
                        '<td>' + data.data[i].osl + '</td>' +
                        '<td>' + data.data[i].ibnr + '</td>' +
                        '</tr>'; 
                }
                $("#span_document_dtl").empty().html('결재리스트(상세) -' + data.data.length + '건');
            } else {
                fn_alert('alert', '조회할 데이터가 없습니다.');
                appendHtml += '<tr><td colspan="6">조회할 데이터가 없습니다.</td></tr>';
                $("#span_document_dtl").empty().html('결재리스트(상세) -' + 0 + '건');
            }

            $("#tbody_dtlList").empty().html(appendHtml);
            
            $("#div_dtl").fadeIn('slow');
            fn_clickEvent(); // regist and refresh click event
            if (!$('#tbody_dtlList > tr').find('td').eq(0).attr('colspan')) {
                $('#tbody_dtlList > tr').eq(0).find('td').eq(0).click();
            } else {
                $('#mainImgDiv').html('');
                $('#ul_image').html('');

            }
            //endProgressBar(progressId); // end progressbar\
        },
        error: function (err) {
            endProgressBar(progressId); // end progressbar
            console.log(err);
        }
    });
};

var fn_search_dtl = function (seqNum, docNum) {
    var seqNum = seqNum;
    var docNum = docNum;
    var progressId;
    var appendHtml = "";
    $.ajax({
        url: '/myApproval/searchApprovalDtlList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'docNum': docNum }),
        contentType: 'application/json; charset=UTF-8',
        /*  beforeSend: function () {
                $("#progressMsgTitle").html("retrieving document detail list...");
                progressId = showProgressBar();
                //startProgressBar(); // start progressbar
                //addProgressBar(1, 1); // proceed progressbar
            },*/
        success: function (data) {
            //addProgressBar(2, 99); // proceed progressbar
            if (data.docData.length > 0) {
                for (var i = 0; i < data.docData.length; i++) {
                    appendHtml +=
                        '<tr id="tr_dtl_' + data.docData[i].DOCNUM + '" name="tr_dtl" style="cursor:pointer">' +
                        '<td>' + data.docData[i].INVOICETYPE + '</td> <!--계산서구분-->' +
                        '<td>' + nvl2(data.docData[i].CTNO, '') + '</td>' +
                        '<td>' + data.docData[i].CTNM + '</td>' +
                        '<td>' + nvl2(data.docData[i].PAGEFROM, 0) + '</td>' +
                        '<td>' + nvl2(data.docData[i].PAGETO, 0) + '</td>' +
                        '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].CURCD, 0) + '</a><input type="hidden" value="' + data.docData[i].CURCD_LOC + '"/></td>' +
                        '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].PM - data.docData[i].BROKERAGE - data.docData[i].TAX - data.docData[i].CN, 0) + '</a><input type="hidden" value="' + data.docData[i].OSLSHARE_LOC + '"/></td>' +
                        '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].OSLSHARE, 0) + '</a><input type="hidden" value="' + data.docData[i].OSLSHARE_LOC + '"/></td>' +
                        '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].OSLSHARE * 0.1, 0) + '</a><input type="hidden" value="' + data.docData[i].TAXON_LOC + '"/></td>' +
                        '</tr>';
                }
            } else {
                appendHtml += '<tr><td colspan="6">조회할 데이터가 없습니다.</td></tr>';
            }
            $("#tbody_dtlList").empty().html(appendHtml);
            $("#span_document_dtl").empty().html('결재리스트(상세) -' + data.docData.length + '건');
            $("#div_dtl").fadeIn('slow');
            fn_clickEvent(); // regist and refresh click event
            if (!$('#tbody_dtlList > tr').find('td').eq(0).attr('colspan')) {
                $('#tbody_dtlList > tr').eq(0).find('td').eq(0).click();
            } else {
                $('#mainImgDiv').html('');
                $('#ul_image').html('');

            }
            //endProgressBar(progressId); // end progressbar\
        },
        error: function (err) {
            endProgressBar(progressId); // end progressbar
            console.log(err);
        }
    });
};


// document_dtl 조회
var fn_search_dtl_old = function (seqNum, docNum) {
    var seqNum = seqNum;
    var docNum = docNum;
    var progressId;
    var appendHtml = "";
    $.ajax({
        url: '/myApproval/searchApprovalDtlList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'docNum': docNum }),
        contentType: 'application/json; charset=UTF-8',
    /*  beforeSend: function () {
            $("#progressMsgTitle").html("retrieving document detail list...");
            progressId = showProgressBar();
            //startProgressBar(); // start progressbar
            //addProgressBar(1, 1); // proceed progressbar
        },*/
        success: function (data) {
            //addProgressBar(2, 99); // proceed progressbar
            if (data.docData.length > 0) {
                for (var i = 0; i < data.docData.length; i++) {
                     appendHtml += 
                     '<tr id="tr_dtl_' + data.docData[i].DOCNUM + '" name="tr_dtl" style="cursor:pointer">' +
                     '<td>' + data.docData[i].INVOICETYPE + '</td> <!--계산서구분-->' +
                     '<td>' + data.docData[i].OGCOMPANYNAME + '</td>' +
                     '<td>' + data.docData[i].CTNM + '</td>' +
                     '<td>' + data.docData[i].UY + '</td>' +
                     '<td>' + nvl2(data.docData[i].CTNO,'') + '</td>' +
                     '<td>' + nvl2(data.docData[i].PAGEFROM, 0) + '</td>' +
                     '<td>' + nvl2(data.docData[i].PAGETO, 0) + '</td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].CURCD, 0) + '</a><input type="hidden" value="' + data.docData[i].CURCD_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].CURUNIT, 0) + '</a><input type="hidden" value="' + data.docData[i].CURUNIT_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].PAIDPERCENT, 0) + '</a><input type="hidden" value="' + data.docData[i].PAIDPERCENT_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].PAIDSHARE, 0) + '</a><input type="hidden" value="' + data.docData[i].PAIDSHARE_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].OSLPERCENT, 0) + '</a><input type="hidden" value="' + data.docData[i].OSLPERCENT_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].OSLSHARE, 0) + '</a><input type="hidden" value="' + data.docData[i].OSLSHARE_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].PM, 0) + '</a><input type="hidden" value="' + data.docData[i].PM_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].PMPFEND, 0) + '</a><input type="hidden" value="' + data.docData[i].PMPFEND_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].PMPFWOS, 0) + '</a><input type="hidden" value="' + data.docData[i].PMPFWOS_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].XOLPM, 0) + '</a><input type="hidden" value="' + data.docData[i].XOLPM_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].RETURNPM, 0) + '</a><input type="hidden" value="' + data.docData[i].RETURNPM_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].CN, 0) + '</a><input type="hidden" value="' + data.docData[i].CN_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].PROFITCN, 0) + '</a><input type="hidden" value="' + data.docData[i].PROFITCN_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].BROKERAGE, 0) + '</a><input type="hidden" value="' + data.docData[i].BROKERAGE_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].TAX, 0) + '</a><input type="hidden" value="' + data.docData[i].TAX_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].OVERRIDINGCOM, 0) + '</a><input type="hidden" value="' + data.docData[i].OVERRIDINGCOM_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].CHARGE, 0) + '</a><input type="hidden" value="' + data.docData[i].CHARGE_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].PMRESERVERTD, 0) + '</a><input type="hidden" value="' + data.docData[i].PMRESERVERTD_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].PFPMRESERVERTD, 0) + '</a><input type="hidden" value="' + data.docData[i].PFPMRESERVERTD_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].PMRESERVERLD, 0) + '</a><input type="hidden" value="' + data.docData[i].PMRESERVERLD_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].PFPMRESERVERLD, 0) + '</a><input type="hidden" value="' + data.docData[i].PFPMRESERVERLD_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].CLAIM, 0) + '</a><input type="hidden" value="' + data.docData[i].CLAIM_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].LOSSRECOVERY, 0) + '</a><input type="hidden" value="' + data.docData[i].LOSSRECOVERY_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].CASHLOSS, 0) + '</a><input type="hidden" value="' + data.docData[i].CASHLOSS_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].CASHLOSSRD, 0) + '</a><input type="hidden" value="' + data.docData[i].CASHLOSSRD_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].LOSSRR, 0) + '</a><input type="hidden" value="' + data.docData[i].LOSSRR_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].LOSSRR2, 0) + '</a><input type="hidden" value="' + data.docData[i].LOSSRR2_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].LOSSPFENT, 0) + '</a><input type="hidden" value="' + data.docData[i].LOSSPFENT_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].LOSSPFWOA, 0) + '</a><input type="hidden" value="' + data.docData[i].LOSSPFWOA_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].INTEREST, 0) + '</a><input type="hidden" value="' + data.docData[i].INTEREST_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].TAXON, 0) + '</a><input type="hidden" value="' + data.docData[i].TAXON_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].MISCELLANEOUS, 0) + '</a><input type="hidden" value="' + data.docData[i].MISCELLANEOUS_LOC + '"/></td>' +
                     '<td><a href="#" onclick="zoomImg(this); return false;">' + nvl2(data.docData[i].CSCOSARFRNCNNT2, 0) + '</a><input type="hidden" value="' + data.docData[i].CSCOSARFRNCNNT2_LOC + '"/></td>' +
                    '</tr>';    
                }               
            } else {
                appendHtml += '<tr><td colspan="6">조회할 데이터가 없습니다.</td></tr>';
            }
            $("#tbody_dtlList").empty().html(appendHtml);
            $("#span_document_dtl").empty().html('결재리스트(상세) -' + data.docData.length + '건');
            $("#div_dtl").fadeIn('slow');
            fn_clickEvent(); // regist and refresh click event
            if (!$('#tbody_dtlList > tr').find('td').eq(0).attr('colspan')) {
                $('#tbody_dtlList > tr').eq(0).find('td').eq(0).click();
            } else {
                $('#mainImgDiv').html('');
                $('#ul_image').html('');

            }
            //endProgressBar(progressId); // end progressbar\
        },
        error: function (err) {
            endProgressBar(progressId); // end progressbar
            console.log(err);
        }
    });
};

// img 조회
var fn_search_image = function (imgId) {
    var param = {
        imgId: imgId
    };
    var progressId;
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
            progressId = showProgressBar();
            //startProgressBar(); // start progressbar
            //addProgressBar(1, 1); // proceed progressbar
        },
        success: function (data) {
            //addProgressBar(2, 99); // proceed progressbar
            if (data.docData.length > 0) {
                $('#mainImgDiv').html('<img id="main_image" src="" alt="샘플이미지" />');
                var redNemoHtml = '<div id="imageZoom" ondblclick="viewOriginImg()">';
                redNemoHtml += '<div id="redZoomNemo">';
                redNemoHtml += '</div>';
                redNemoHtml += '</div>';
                $('#mainImgDiv').after(redNemoHtml);
                $.each(data.docData, function (index, entry) {
                    if (index == 0) {
                        $("#main_image").prop("src", '../../uploads/' + entry.ORIGINFILENAME);
                        $("#main_image").prop("alt", entry.ORIGINFILENAME);
                        imageHtml += '<li class="on">' +
                            '<div class="box_img"><i><img src="../../uploads/' + entry.ORIGINFILENAME + '" title="' + entry.ORIGINFILENAME + '"></i></div>' +
                            '<span>' + entry.ORIGINFILENAME + '</span>' +
                                    '</li>';
                    } else {
                        imageHtml += 
                                    '<li>' +
                        '<div class="box_img"><i><img src="../../uploads/' + entry.ORIGINFILENAME + '" title="' + entry.ORIGINFILENAME + '"></i></div>' + 
                        '<span>' + entry.ORIGINFILENAME + '</span>' +
                                    '</li>';
                    }
                });
            } else {
                $('#mainImgDiv').html('');
                //appendHtml += '<tr><td colspan="7">조회할 데이터가 없습니다.</td></tr>';
                imageHtml += '<li>문서 이미지가 존재하지 않습니다.</li>';
            }
            //$("#div_view_image").empty().append(imageHtml);
            $("#ul_image").empty().append(imageHtml);
            $("#div_image").fadeIn('slow');
            fn_clickEvent(); // regist and refresh click event
            endProgressBar(progressId); // end progressbar
        }, error: function (err) {
            endProgressBar(progressId); // end progressbar
            console.log(err);
        }
    });
};

function zoomImg(e) {
    var fileName = $(e).parent().find('input[type="hidden"]').val().split("::")[1];

    if (fileName == "undefined" || fileName == "" || fileName == null) {
        return;
    }

    var mainImage = $("#main_image").css('background-image');
    mainImage = mainImage.replace('url(', '').replace(')', '').replace(/\"/gi, "");
    mainImage = mainImage.substring(mainImage.lastIndexOf("/") + 1, mainImage.length);

    if (mainImage != fileName) {
        $('#main_image').css('background-image', 'url("../../uploads/' + fileName + '")');
    }

    $('.box_img').each(function (i, el) {
        $(el).closest('li').removeClass('on');
        var imgSrc = $(el).find('img').attr('src');
        if (imgSrc.indexOf(fileName) != -1) {
            $(el).closest('li').addClass('on');
        }
    });

    //실제 이미지 사이즈와 메인이미지div 축소율 판단
    var reImg = new Image();
    var imgPath = $('#main_image').css('background-image').split('("')[1];
    imgPath = imgPath.split('")')[0];
    reImg.src = imgPath;
    var width = reImg.width;
    var height = reImg.height;

    //imageZoom 고정크기
    //var fixWidth = 744;
    //var fixHeight = 1052;

    var fixWidth = 800;
    var fixHeight = 1300;

    var widthPercent = fixWidth / width;
    var heightPercent = fixHeight / height;

    $('#mainImgDiv').hide();
    $('#imageZoom').css('height', '458px').css('background-image', $('#main_image').css('background-image')).css('background-size', fixWidth + 'px ' + fixHeight + 'px').show();

    // 사각형 좌표값
    var location = $(e).parent().find('input[type="hidden"]').val().split("_")[0].split(',');
    var x = parseInt(location[0]);
    var y = parseInt(location[1]);
    var textWidth = parseInt(location[2]);
    var textHeight = parseInt(location[3]);

    //var xPosition = ((- (x * widthPercent)) + 400) + 'px ';
    //var yPosition = ((- (y * heightPercent)) + 260) + 'px';
    var xPosition = '0px ';
    var yPosition = ((- (y * heightPercent) + 350)) + 'px';
    //console.log(xPosition + yPosition);
    $('#imageZoom').css('background-position', xPosition + yPosition);

    $('#redZoomNemo').css('height', (textHeight + 5) + 'px');
    $('#redZoomNemo').show();
}

function viewOriginImg() {
    $('#imageZoom').hide();
    $('#mainImgDiv').show();
}

// 체크된 문서확인하고 승인/반려/전달 실행
var fn_baseList_chk = function (flag) {

    if ($('input[name=chk_document]:checked').length == 0) {
        fn_alert('alert', '결재 문서를 선택해주세요.');
        return false;
    } else {
        if (flag == '승인') {
            if ($('#middleApproval').val() == 'Y') {

            } else if ($('#lastApproval').val() == 'Y') {
                var arrDocInfo = [];
                $('input[name=chk_document]:checked').each(function () {
                    var docInfoDetail = {
                        docNum: $(this).closest('tr').find('td:eq(0)').text(),
                        finalApproval: $('#userId').val()
                    };
                    arrDocInfo.push(docInfoDetail);
                })
                var param = {
                    arrDocInfo: arrDocInfo
                };

                $.ajax({
                    url: '/myApproval/finalApproval',
                    type: 'post',
                    datatype: "json",
                    data: JSON.stringify({ 'param': param }),
                    contentType: 'application/json; charset=UTF-8',
                    success: function (data) {
                        if (data.code == 200) {
                            fn_alert('alert', $("input[name=chk_document]:checked").length + "건의 문서가 승인 되었습니다.");
                            $("input[name=chk_document]:checked").closest('tr').find('td:last').html('승인');
                        } else {
                            fn_alert('alert', data.error);
                        }
                    },
                    error: function (err) {
                        console.log(err);
                    }
                });
            }
        }
            //내결재 - 반려기능
        else if (flag == '반려') {
            if ($('#middleApproval').val() == 'Y') {
                var level = 'middleApproval';
            } else if ($('#lastApproval').val() == 'Y') {
                var level = 'lastApproval';
            }
            var rowData = new Array();
            var tdArr = new Array();
            var commentArr = new Array();
            var middleNumArr = new Array();
            var statusTdArr = new Array();
            var checkbox = $("input[name=chk_document]:checked");
            var deleteTr = [];

            var statusCnt = 0;
            // 체크된 체크박스 값을 가져온다
            checkbox.each(function (i) {

                var tr = checkbox.parent().parent().parent().parent().eq(i);
                var td = tr.children();

                // 체크된 row의 모든 값을 배열에 담는다.
                rowData.push(tr.text());

                // td.eq(0)은 체크박스 이므로  td.eq(1)의 값부터 가져온다.
                var docNum = td.eq(1).text();
                var comment = tr.find('input').eq(1).val();
                var middleNum = td.eq(4).text();
                var status = td.eq(7).text();
                // 가져온 값을 배열에 담는다.
                tdArr.push(docNum);
                commentArr.push(comment);
                middleNumArr.push(middleNum);
                // 상태=승인 값 추출
                statusTdArr.push(status);
                deleteTr.push(tr);
            });
            for (var i = 0; i < statusTdArr.length; i++) {
                if (statusTdArr[i] == '승인') {
                    statusCnt += 1;
                }
            }
            if (statusCnt > 0) {
                fn_alert('alert', "이미 결재완료 된 문서가 존재합니다.");
            } else {
                $.ajax({
                    url: '/myApproval/cancelDocument',
                    type: 'post',
                    datatype: "json",
                    data: JSON.stringify({
                        'docNum': tdArr,
                        'level': level,
                        'comment': commentArr,
                        'middleNum': middleNumArr,
                        'userId': $('#documentManager').val()
                    }),
                    contentType: 'application/json; charset=UTF-8',
                    success: function (data) {
                        var totCnt = $("input[name = chk_document]");

                        fn_alert('confirm', data.docData + " 건의 문서를 반려 하시겠습니까 ?", function () {
                            $("#span_document").empty().html('결재리스트(기본) - ' + (totCnt.length - deleteTr.length) + ' 건');
                            for (var i in deleteTr) {
                                deleteTr[i].remove();
                            }
                            fn_alert('alert', data.docData + " 건의 문서가 반려되었습니다.");
                        });
                    },
                    error: function (err) {
                        console.log(err);
                    }
                });
            }          
        }
        //내 결재 - 전달
        else if ($('#middleApproval').val() == 'Y') {    
            var tdArr = new Array();
            var checkbox = $("input[name=chk_document]:checked");
            var statusCnt = 0;
            // 체크된 체크박스 값들 중 결재완료 된 경우를 예외시킨다.
            checkbox.each(function (i) {

                var tr = checkbox.parent().parent().parent().parent().eq(i);
                var td = tr.children();

                var status = td.eq(7).text();

                tdArr.push(status);
            });
            for (var i = 0; i < tdArr.length; i++ ) {
                if (tdArr[i] == '승인') {
                    statusCnt += 1;
                }
            }
            if (statusCnt > 0) {
                fn_alert('alert', "이미 결재완료 된 문서가 존재합니다.");
            } else {
                layer_open('searchUserPop');            
            }
        } else {
            fn_alert('alert', "전달에 대한 권한이 없습니다.");
        }  


        $('#btn_pop_user_search').click(function () {

            var param = {
                scan: $('#docManagerChk').is(':checked') ? 'Y' : 'N',
                icr: $('#icrManagerChk').is(':checked') ? 'Y' : 'N',
                approval: $('#middleManagerChk').is(':checked') ? 'Y' : 'N',
                finalApproval: $('#approvalManagerChk').is(':checked') ? 'Y' : 'N',
                keyword: $('#searchManger').val().trim(),
                dept: $('#select_team').val(),
            };

            //todo - 한기훈
            $.ajax({
                url: '/common/selectUserInfo',
                type: 'post',
                datatype: "json",
                data: JSON.stringify({ 'param': param }),
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
                                    '<td>' + data[i].EMP_NM + '</td>' +
                                    '<td>' + data[i].DEPT_NM + '</td>' +
                                    '</tr >';
                            }

                        } else {
                            appendHtml = '<tr><td colspan="2">검색 결과가 없습니다</td></tr>'
                        }
                        $('#searchManagerResult').append(appendHtml);
                    } else {
                        fn_alert('alert', data.error);
                    }
                },
                error: function (err) {
                    console.log(err);
                }
            });
        })

        //결재담당자 선택시 발생이벤트.
        $("#btn_pop_user_choice").click(function () {
            var choiceCnt = $('#searchManagerResult tr.on').length;

            if (choiceCnt == 0) {
                fn_alert('alert', '담당자를 선택해주세요');
                return false;
            } else {
                if ($('#middleApproval').val() == 'Y') {
                    //현재 로그인된 계정아이디
                    var userId = $('#userId').val();

                    //선택된 문서번호 추출(단일 or 다중 건)
                    var docInfoRowData = new Array();
                    var docInfoTdArr = new Array();
                    var commentArr = new Array();
                    var popDocInfoCheckbox = $("input[name=chk_document]:checked");
                    var deleteTr = [];

                    //선택된 유저ID 추출(단일 건)
                    var userChoiceRowData = new Array();
                    var userChoiceTdArr = new Array();
                    var popUserChoiceCheckbox = $("input[name=btn_pop_user_search_base_chk]:checked");
                    var popUserChoice = $("#searchManagerResult tr.on");

                    // 체크된 문서정보를 가져온다
                    popDocInfoCheckbox.each(function (i) {
                        var popDoctr = popDocInfoCheckbox.parent().parent().parent().parent().eq(i);
                        var popDoctd = popDoctr.children();

                        // 체크된 row의 모든 값을 배열에 담는다.
                        docInfoRowData.push(popDoctd.text());

                        // td.eq(0)은 체크박스 이므로  td.eq(1)의  값부터 가져온다.
                        var docNum = popDoctd.eq(1).text();
                        var comment = popDoctr.find('input').eq(1).val();

                        // 가져온 값을 배열에 담는다.
                        docInfoTdArr.push(docNum);
                        commentArr.push(comment);
                        deleteTr.push(popDoctr);
                    });

                    // 체크된 담당자를 가져온다
                    popUserChoice.each(function (i) {
                        var popUsertr = popUserChoice;
                        var popUsertd = popUsertr.children();

                        userChoiceRowData.push(popUsertr.text());

                        var userChoiceId = popUsertd.eq(0).text();

                        userChoiceTdArr.push(userChoiceId);
                    });

                   
                    $.ajax({
                        url: '/myApproval/sendApprovalDocumentCtoD',
                        type: 'post',
                        datatype: "json",
                        data: JSON.stringify({
                            'userChoiceId': userChoiceTdArr,
                            'docInfo': docInfoTdArr,
                            'userId': userId,
                            'comment': commentArr
                        }),
                        contentType: 'application/json; charset=UTF-8',
                        success: function (data) {
                            fn_alert('confirm', data.docData + "건의 문서가 전달 되었습니다.", function () {
                                $('#searchUserPop').fadeOut();
                                var totCnt = $("input[name = chk_document]");
                                $("#span_document").empty().html('결재리스트(기본) - ' + (totCnt.length - deleteTr.length) + ' 건');
                                for (var i in deleteTr) {
                                    deleteTr[i].remove();
                                }
                            });
                        },
                        error: function (err) {
                            console.log(err);
                        }
                    });
                }
                
            }
        });
    }
}

// 부서조회
function searchDept() {
    $.ajax({
        url: '/userManagement/searchDept',
        type: 'post',
        datatype: "json",
        async: false,
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            var dept = data.dept.dept;
            for (var i in dept) {
                var appendLi = '<li><a>' + dept[i].DEPT_NM + '</a></li>';
                $('#teamList').append(appendLi);
                $('#myApprovalDept').append(appendLi);
                deptList.push(dept[i]);
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// [시작 함수]
var _init = function () {
    checkboxEvent();
    buttonEvent();
    datePickerEvent();
    fn_search();
    searchDept();
};