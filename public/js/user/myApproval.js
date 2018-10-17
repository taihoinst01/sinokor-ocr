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
    //console.log("조건 : " + JSON.stringify(param));

    var progressId;
    var appendHtml = "";
    $.ajax({
        url: '/myApproval/searchApprovalList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsgTitle").html("retrieving document list...");
            progressId = showProgressBar();
            //startProgressBar(); // start progressbar
            //addProgressBar(1, 1); // proceed progressbar
        },
        success: function (data) {
            console.log(data);
            //$("#div_base").hide();
            //addProgressBar(2, 99); // proceed progressbar
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    var state = "";
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
                    if ($('#middleApproval').val() == 'Y' || $('#lastApproval').val() == 'Y') {
                        appendHtml +=
                            '<tr id="tr_base_' + entry["SEQNUM"] + '-' + entry["DOCNUM"] + '-' + entry["STATUS"] + '" style="cursor:pointer" name ="tr_base_chk">' +
                            '<th scope="row"><div class="checkbox-options mauto"><input type="checkbox" value="' + docId + '" class="sta00 stck_tr" name="chk_document" /></div></th>' +
                            '<td name="td_base">' + entry["DOCNUM"] + '</td>' +
                            '<td name="td_base">' + nvl(entry["PAGECNT"]) + '</td>' +
                            '<td name="td_base">' + nvl(entry["DEADLINEDT"]) + '</td>';
                        if ($('#middleApproval').val() == 'Y') {
                            appendHtml += '<td class="td_base">' + nvl(entry["ICRNUM"]) + '</td>';
                        } else {
                            appendHtml += '<td class="td_base" > ' + nvl(entry["MIDDLENUM"]) + '</td>';
                        }
                        appendHtml +=
                            '<td class="td_base">' + nvl(entry["NOWNUM"]) + '</td>' +
                            '<td><label for="intxt_001" class="blind">메모1</label><input type="text" name="intxt_0" id="memo_' + docId + '" class="inputst_box01" value="' + nvl(entry["MEMO"]) + '" /></td>' +
                            '<td name="td_base">' + state + '</td>' +
                            '</tr>';
                    } else {
                        appendHtml += '<tr><td colspan="8">권한이 없습니다.</td></tr>';
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
            endProgressBar(progressId); // end progressbar
        },
        error: function (err) {
            endProgressBar(progressId); // end progressbar
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
    var progressId;
    var appendHtml = "";
    $.ajax({
        url: '/myApproval/searchApprovalDtlList',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsgTitle").html("retrieving document detail list...");
            progressId = showProgressBar();
            //startProgressBar(); // start progressbar
            //addProgressBar(1, 1); // proceed progressbar
        },
        success: function (data) {
            //addProgressBar(2, 99); // proceed progressbar
            console.log(data);
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    appendHtml += 
                        '<tr id="tr_dtl_' + entry["IMGID"] + '" name="tr_dtl" style="cursor:pointer">' +
                            '<th scope="row">' + entry["IMGFILESTARTNO"] + ' ~ ' + entry["IMGFILESTARTNO"] +'</th>' +
                            '<td>' + nvl(entry["CONTRACTNUM"]) + '</td>' +
                            '<td><a href="#none" class="tip" title="' + nvl(entry["CTNM"]) + '">' + nvl(entry["CTNM"]) + '</a></td>' +
                            '<td>' + nvl(entry["UY"]) + '</td>' +
                            '<td>' + nvl(entry["CURCD"]) + '</td>' +
                            '<td>' + nvl(entry["NTBL"]) + '</td>' +
                            '<td>' + nvl(entry["ENTRYNO"]) + '</td>' +
                        '</tr>';
                });
            } else {
                appendHtml += '<tr><td colspan="7">조회할 데이터가 없습니다.</td></tr>';
            }
            $("#tbody_dtlList").empty().html(appendHtml);
            $("#span_document_dtl").empty().html('결재리스트(상세) -' + data.length + '건');
            $("#div_dtl").fadeIn('slow');
            fn_clickEvent(); // regist and refresh click event
            endProgressBar(progressId); // end progressbar
        }, error: function (err) {
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
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    if (index == 0) {
                        $("#main_image").prop("src", '../../' + nvl(entry.ORIGINFILENAME));
                        $("#main_image").prop("alt", entry.ORIGINFILENAME);
                        imageHtml += '<li class="on">' +
                                        '<div class="box_img"><i><img src="../../' + nvl(entry.ORIGINFILENAME) + '" title="' + nvl(entry.ORIGINFILENAME) + '"></i></div>' +
                                        '<span>' + nvl(entry.ORIGINFILENAME) + '</span>' +
                                    '</li>';
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
            endProgressBar(progressId); // end progressbar
        }, error: function (err) {
            endProgressBar(progressId); // end progressbar
            console.log(err);
        }
    });
};
// 체크된 문서 갯수 확인하고 승인/반려/전달 실행
var fn_baseList_chk = function (flag) {

    if ($('input[name=chk_document]:checked').length == 0) {
        alert('선택된 항목이 없습니다.')
        return false;
    } else {      

        if (flag == '승인') {
            if ($('#middleApproval').val() == 'Y') {

        } else if ($('#lastApproval').val() == 'Y') {

        }
    }
    else if (flag == '반려') {
        //중간결재자 - 반려
        if ($('#middleApproval').val() == 'Y') {
            var level = 'middleApproval';
        } else if ($('#lastApproval').val() == 'Y') {
            var level = 'lastApproval';
        }
            var rowData = new Array();
            var tdArr = new Array();
            var checkbox = $("input[name=chk_document]:checked");
            var deleteTr = [];
            // 체크된 체크박스 값을 가져온다
            checkbox.each(function (i) {

                var tr = checkbox.parent().parent().parent().parent().eq(i);
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
                url: '/myApproval/cancelDocument',
                type: 'post',
                datatype: "json",
                data: JSON.stringify({
                    'docNum': tdArr,
                    'level': level
                }),
                contentType: 'application/json; charset=UTF-8',
                success: function (data) {
                    var totCnt = $("input[name = tr_base_chk]");
                    $("#span_document").empty().html('결재리스트(기본) ' + (totCnt.length - deleteTr.length) + ' 건');
                    for (var i in deleteTr) {
                        deleteTr[i].remove();
                    }
                    alert(data.docData + " 건의 문서가 반려되었습니다.");
                },
                error: function (err) {
                    console.log(err);
                }
            });
        
    } else if (flag == '진행') {
        if ($('#middleApproval').val() == 'Y') {
            layer_open('layer1');
        } else if ($('#lastApproval') == 'Y') {

            }
        }
    }
    

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
        if ($('input[name=btn_pop_user_search_base_chk]:checked').length == 0) {
            alert("담당자를 선택해주세요");
        } else {
            if ($('#middleApproval').val() == 'Y') {
                //현재 로그인된 계정아이디
                var userId = $('#userId').val();

                //선택된 문서번호 추출(단일 or 다중 건)
                var docInfoRowData = new Array();
                var docInfoTdArr = new Array();
                var popDocInfoCheckbox = $("input[name=chk_document]:checked");


                //선택된 유저ID 추출(단일 건)
                var userChoiceRowData = new Array();
                var userChoiceTdArr = new Array();
                var popUserChoiceCheckbox = $("input[name=btn_pop_user_search_base_chk]:checked");

                // 체크된 문서정보를 가져온다
                popDocInfoCheckbox.each(function (i) {
                    var popDoctr = popDocInfoCheckbox.closest('tr');
                    var popDoctd = popDoctr.children();

                    // 체크된 row의 모든 값을 배열에 담는다.
                    docInfoRowData.push(popDoctd.text());

                    // td.eq(0)은 체크박스 이므로  td.eq(1)의  값부터 가져온다.
                    var docNum = popDoctd.eq(1).text();

                    // 가져온 값을 배열에 담는다.
                    docInfoTdArr.push(docNum);
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
                        url: '/myApproval/sendApprovalDocumentCtoD',
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
                                $("input[name=chk_document]:checked").closest('tr').remove();
                                $("#span_document_base").empty().html('문서 기본정보 - ' + $("input[name=chk_document]").length + '건');
                            }
                        },
                        error: function (err) {
                            console.log(err);
                        }
                    });
                }
            }
        }
    });



  /*  기존소스
    var chkCnt = 0;
    var arrSeqNum = [];
    var arrState = [];
    var arrMemo = [];
    var arrReporter = [];
    var arrManager = [];
    var val = "";
   *  $("input[name=chk_document]").each(function (index, value) {
        if ($(this).is(":checked")) {
            val = $(this).val().split("-");  // value="${entry['SEQNUM']}-${entry['DOCNUM']}"
            var memo = "memo_" + val[0] + "-" + val[1];
            var reporter = "reporter_" + val[0] + "-" + val[1];
            var manager = "manager_" + val[0] + "-" + val[1];
            arrSeqNum.push(val[0]);
            arrState.push(val[2]);
            arrMemo.push(nvl($("#" + memo).val()));
            arrReporter.push(nvl($("#" + reporter).val()));
            arrManager.push(nvl($("#" + manager).val()));
            chkCnt++;
        }
    });
    var progressId;
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
                if (flag == "승인") $("#progressMsgTitle").html("승인처리 중 입니다.");
                else if (flag == "반려") $("#progressMsgTitle").html("반려처리 중 입니다.");
                else if (flag == "진행") $("#progressMsgTitle").html("전달 중 입니다.");
                progressId = showProgressBar();
                //startProgressBar(); // start progressbar
                //addProgressBar(1, 99); // proceed progressbar
            },
            success: function (data) {
                if (flag == "C") alert("승인처리 되었습니다.");
                else if (flag == "R") alert("반려처리 되었습니다.");
                else if (flag == "P") alert("전달되었습니다.");
                else alert("잘못된 경로로 접근하였습니다.");
                $("#btn_search").click();
                endProgressBar(progressId);
            },
            error: function (err) {
                console.log(err);
                endProgressBar(progressId);
            }
        });
    } else {
        alert("선택된 문서가 없습니다.");
        return;
    }*/
}



// [시작 함수]
var _init = function () {
    checkboxEvent();
    buttonEvent();
    datePickerEvent();
};



