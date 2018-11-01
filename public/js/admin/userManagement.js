'use strict';
var curPage = 1;
var deptList = []; // 부서
$(function () {

    searchDept(); // 부서조회
    insUserBtnEvent(); // 사용자 추가 이벤트

    // 사용자 조회
    $("#btn_search").on("click", function () {
        fn_searchUser();
    });
    // 사용자 등록
    $("#btn_insert").on("click", function () {
        fn_modifyUser('insert');
    });
    // 사용자 수정
    $("#btn_update").on("click", function () {
        fn_modifyUser('update');
    });
    // 초기화 (테스트)
    $("#btn_init").on("click", function () {
        fn_initUser();
    });

    fn_searchUser();
    //fn_searchHighApproval(0, "");


    // 사용자 비밀번호 수정
    //$("#updatePwBtn").on("click", function () {
    //    updatePw();
    //});

    // 페이징 초기화
    // $("#pagination").html(pagination(curPage, $("#totalCount").val()));
});

/**
 * 페이지 이동
 */
function goPage(page) {
    searchUser(page);
}
/**
 * 선택 사용자 초기화
 */
function fn_initUser() {
    $("#seqNum").val("");
    $("#userId").val("");
    $("#userPw").val("");
    $("#email").val("");
    $("#note").val("");
    $("input:checkbox[name='approval']").prop("checked", false);
    $("input:checkbox[name='approval']").parent().removeClass('ez-checked');
    $("#highApprovalId").val("");
    $(".myValue").html("전 체");
    fn_searchHighApproval(0, "");
}
/**
 * 사용자 조회
 */
function fn_searchUser() {
    //curPage = isNull(curPage) ? 1 : curPage;
    var appendHtml = "";
    var param = {
        dept: $('#dept').val(),
        scan: $('#scan').is(":checked") ? "Y" : "N",
        icr: $('#icr').is(":checked") ? "Y" : "N",
        approval: $('#approval').is(":checked") ? "Y" : "N",
        finalApproval: $('#finalApproval').is(":checked") ? "Y" : "N",
        admin: $('#admin').is(":checked") ? "Y" : "N",
        externalUsers: $('#externalUsers').is(":checked") ? "Y" : "N"
        //startNum : ((curPage - 1) * MAX_ENTITY_IN_PAGE),
        //endNum: MAX_ENTITY_IN_PAGE
    };
    $.ajax({
        url: '/userManagement/searchUser',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsgTitle").html("사용자를 조회 중 입니다.");
            $("#progressMsgDetail").html("..........");
            //startProgressBar(); // 프로그레스바 시작
            //addProgressBar(1, 1); // 프로그레스바 진행
        },
        success: function (data) {
            //addProgressBar(2, 99); // 프로그레스바 진행
            console.log(data);
            for (var i in data.userData) {
                var entry = data.userData[i];
                appendHtml +=
                    '<tr class="tr_userInfo empNo_' + entry.EMP_NO + '">' +
                    '<td scope="row">' + nvl(entry.EMP_NO) + '<input type="hidden" value="' + entry.EMP_PW + '"></td>' +
                    '<td>' + nvl(entry.EMP_NM) + '</td>' +
                    '<td>' + nvl(entry.DEPT_NM) + '</td>' +
                    '<td>' + nvl(entry.AUTH_SCAN) + '</td>' +
                    '<td>' + nvl(entry.AUTH_ICR) + '</td>' +
                    '<td>' + nvl(entry.AUTH_APPROVAL) + '</td>' +
                    '<td>' + nvl(entry.AUTH_FINAL_APPROVAL) + '</td>' +
                    '<td>' + nvl(entry.AUTH_ADMIN) + '</td>' +
                    '<td>' + nvl(entry.EXT_USER) + '</td>' +
                    '<td>' + nvl(entry.FINAL_LOGIN_DATE) + '</td>' +
                    '<td><button class="btn btn_style_k02 deleteBtn" style="display: none;"onclick="javascript:openDeleteUser(\'' + entry.EMP_NO + '\', event)">삭제</button></td>;' +
                    '</tr>';
            }
            $("#tbody_user").empty().append(appendHtml);
            /*
            console.log("data.. : " + JSON.stringify(data));
            var emp = data.userData.emp;
            var ext = data.userData.ext;

            for (var i in emp) {
                for (var j in deptList) {
                    if (deptList[j].DEPT_CD == emp[i].BLT_DEPT_CD) {
                        emp[i].EMP_DEPT_NM = deptList[j].DEPT_NM;
                    }
                }
                
            }

            // 코리안리 직원
            $.each(emp, function (index, entry) {
                appendHtml +=
                    '<tr class="tr_userInfo">' +
                    '<td scope="row">' + nvl(entry.EMP_NO) + '</td>' +
                    '<td>' + nvl(entry.EMP_NM) + '</td>' +
                    '<td>' + nvl(entry.EMP_DEPT_NM) + '</td>' +
                    '<td>' + nvl(entry.AUTH_SCAN) + '</td>' +
                    '<td>' + nvl(entry.AUTH_ICR) + '</td>' +
                    '<td>' + nvl(entry.AUTH_APPROVAL) + '</td>' +
                    '<td>' + nvl(entry.AUTH_FINAL_APPROVAL) + '</td>' + 
                    '<td>' + nvl(entry.AUTH_ADMIN) + '</td>' + 
                    '<td>N</td>' +
                    '<td>' + nvl(entry.FINAL_LOGIN_DATE) + '</td>' +
                    '<td><button class="btn btn_style_k02" style="display: none;"onclick="javascript:openDeleteUser(' + entry.EMP_NO + ')">삭제</button></td>;' +
                    '</tr>';
            });

            if (ext) {
                // 외부이용자
                $.each(ext, function (index, entry) {
                    appendHtml +=
                        '<tr class="tr_userInfo">' +
                        '<td scope="row">' + nvl(entry.EMP_NO) + ' <input type="hidden" value="' + nvl(entry.EMP_PW) + '"></td>' +
                        '<td>' + nvl(entry.EMP_NM) + '</td>' +
                        '<td>' + nvl(entry.EMP_DEPT_NM) + '</td>' +
                        '<td>' + nvl(entry.AUTH_SCAN) + '</td>' +
                        '<td>' + nvl(entry.AUTH_ICR) + '</td>' +
                        '<td>' + nvl(entry.AUTH_APPROVAL) + '</td>' +
                        '<td>' + nvl(entry.AUTH_FINAL_APPROVAL) + '</td>' +
                        '<td>' + nvl(entry.AUTH_ADMIN) + '</td>' +
                        '<td>Y</td>' +
                        '<td>' + nvl(entry.FINAL_LOGIN_DATE) + '</td>' +
                        '<td><button class="btn btn_style_k02" style="display: none;"onclick="javascript:openDeleteUser(' + entry.EMP_NO + ')">삭제</button></td>;' +
                        '</tr>';
                });
            }


            //if (data.length > 0) {
            //    $.each(data, function (index, entry) {
            //        appendHtml += 
            //        '<tr>' + 
            //            '<td scope="row">' + nvl(entry.SEQNUM) + '</td>' + 
            //        '<td><a href="#none" onclick="javascript:fn_chooseUser(' + entry.SEQNUM + ');" class="tip" title="사번:' + nvl(entry.USERID) + '">' + nvl(entry.USERID) + '</a></td>' + 
            //            '<td>' + nvl(entry.EMAIL) + '</td>' + 
            //            '<td>' + nvl(entry.NOTE) + '</td>' + 
            //            '<td>' + nvl(entry.SCANAPPROVAL) + '</td>' + 
            //            '<td>' + nvl(entry.ICRAPPROVAL) + '</td>' + 
            //            '<td>' + nvl(entry.MIDDLEAPPROVAL) + '</td>' + 
            //            '<td>' + nvl(entry.LASTAPPROVAL) + '</td>' + 
            //            '<td>' + nvl(entry.ADMIN) + '</td>' + 
            //            '<td>todo</td>' + 
            //            '<td>' + nvl(entry.LASTLOGINDATE) + '</td>' + 
            //            '<td>' + nvl(entry.OCRUSECOUNT) + '</td>' + 
            //            '<td><button class="btn btn_style_k03" onclick="javascript:openDeleteUser(' + entry.SEQNUM + ')">삭제</button></td>;' + 
            //        '</tr>';
            //    });
                //<td><button class="btn btn-default" data-toggle="modal" data-target="#userUpdate" id="updatePwBtn" onclick="javascript:openUpdatePw(${entry.seqNum}, ${entry.userId})">수정</button></td>
            //}
            $("#tbody_user").empty().append(appendHtml);
            //$("#pagination").html(pagination(curPage, data[0].totalCount));
            endProgressBar();
            */
        },
        error: function (err) {
            endProgressBar();
            console.log(err);
        }
    });
}

// 사용자 클릭
$(document).on('click', '#tbody_user tr', function () {
    var empNo = "";
    var empPw = "";

    // 체크박스 초기화
    $('.chk_reset').prop('checked', false);
    $('.chk_reset').parent().removeClass('ez-checked');

    // 삭제버튼 초기화
    $('#tbody_user tr').find('td:last button').hide();

    $(this).find('td:last button').show();
    if ($(this).hasClass('on')) {
        $(this).removeClass('on');

        $(this).find('td:last button').hide();
        $('#btn_update').hide();
        $('#btn_insert').show();
    } else {
        $('#tbody_user tr').removeClass('on');
        $(this).addClass('on');
        if ($(this).find('td:eq(3)').text() == 'Y') { // 스캔
            $('#mApproval1').click();
        }
        if ($(this).find('td:eq(4)').text() == 'Y') { // icr
            $('#mApproval2').click();
        }
        if ($(this).find('td:eq(5)').text() == 'Y') { // 중간
            $('#mApproval3').click();
        }
        if ($(this).find('td:eq(6)').text() == 'Y') { // 최종
            $('#mApproval4').click();
        }
        if ($(this).find('td:eq(7)').text() == 'Y') { // 관리자
            $('#mAdmin').click();
        }
        if ($(this).find('td:eq(8)').text() == 'Y') { // 외부사용자
            $('#mExternalUsers').click();
        }

        empNo = $(this).find('td:eq(0)').text();
        empPw = $(this).find('input[type=hidden]').val();

        $(this).find('td:last button').show();
        $('#btn_update').show();
        $('#btn_insert').hide();
    }



    // 사번, PASSWORD 입력
    $('#empNo').val(empNo);
    $('#empPw').val(nvl(empPw));

})


// 사용자 개별 조회
function fn_chooseUser(seqNum) {
    var param = {
        seqNum : seqNum
    };
    $.ajax({
        url: '/userManagement/chooseUser',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $("#progressMsgTitle").html("사용자를 조회 중 입니다.");
            $("#progressMsgDetail").html("..........");
            startProgressBar(); // 프로그레스바 시작
            addProgressBar(1, 1); // 프로그레스바 진행
        },
        success: function (data) {
            addProgressBar(2, 99); // 프로그레스바 진행
            if (data.length == 1) {
                fn_initUser(); // 초기화
                $("#btn_insert").hide();
                $("#btn_update").fadeIn(); // 수정모드
                $.each(data, function (index, entry) {
                    if (index == 0) {
                        $("#seqNum").val(entry["SEQNUM"])
                        $("#userId").val(entry["USERID"]);
                        $("#email").val(nvl(entry["EMAIL"]));
                        $("#note").val(nvl(entry["NOTE"]));
                        if (nvl(entry["SCANAPPROVAL"]) == "Y") {
                            $("#approval1").prop("checked", true);
                            $("#approval1").parent().addClass('ez-checked');
                        }
                        if (nvl(entry["MIDDLEAPPROVAL"]) == "Y") {
                            $("#approval3").prop("checked", true);
                            $("#approval3").parent().addClass('ez-checked');
                        }
                        if (nvl(entry["LASTAPPROVAL"]) == "Y") {
                            $("#approval4").prop("checked", true);
                            $("#approval4").parent().addClass('ez-checked');
                        }
                        //fn_searchHighApproval(entry["SEQNUM"], entry["HIGHAPPROVALID"]); // 상위결재자 목록 조회
                    }
                });
            } else {
                fn_alert('alert', "장애가 발생하였습니다.");
                return;
            }
            endProgressBar();
        },
        error: function (err) {
            endProgressBar();
            console.log(err);
        }
    });
};
// 상위결재자 조회
var fn_searchHighApproval = function (seqNum, id) {
    var param = {
        seqNum: seqNum
    };
    $.ajax({
        url: '/userManagement/searchHighApproval',
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
                    appendHtml += `<li><a class="a_userIdList" onclick="javascript:fn_selectHighApproval('${entry.SEQNUM}', '${entry.USERID}')">${entry.USERID}</a></li>`;
                    if (entry.USERID == id) {
                        $("#highApprovalId").val(entry.SEQNUM);
                        //$(".myValue").html(entry.USERID);
                    }
                });
            }
            $("#ul_highApproval").empty().append(appendHtml);
        },
        error: function (err) {
            console.log(err);
        }
    });
};
var fn_selectHighApproval = function (seqNum, userId) {
    $("#highApprovalId").val(seqNum);
    $(".myValue").html(userId);
};

/**
 * 등록/수정 validate and return parameters 
 */
var fn_validate = function (flag) {
    //예외 처리
    if (isNull($("#userId").val())) {
        fn_alert('alert', "사용자 ID는 필수입니다.");
        $("#userId").focus();
        return false;
    }
    if (flag == "INSERT" && isNull($("#userPw").val())) {
        fn_alert('alert', "사용자 비밀번호는 필수입니다.");
        $("#userPw").focus();
        return false;
    }
    var chkDupl = false;
    $(".a_userIdList").each(function (index) {
        if ($("#userId").val() == $(this).html()) {
            chkDupl = true;
        }
    });
    if (chkDupl) {
        fn_alert('alert', `이미 ${$("#userId").val()} 사번이 존재합니다.`);
        $("#userId").focus();
        return false;
    }
    return true;
};
var fn_getParam = function () {
    var param = {
        seqNum: $("#seqNum").val(),
        userId: nvl($("#userId").val()),
        userPw: nvl($("#userPw").val()),
        email: nvl($("#email").val()),
        note: nvl($("#note").val()),
        scanApproval: $("#approval1").is(":checked") ? "Y" : "N",
        middleApproval: $("#approval3").is(":checked") ? "Y" : "N",
        lastApproval: $("#approval4").is(":checked") ? "Y" : "N",
        highApprovalId: nvl($("#highApprovalId").val())
    };
    return param;
};

// 사용자 등록 및 수정
function fn_modifyUser(type) {
    if ($('#empPw').val() == '') {
        fn_alert('alert', '비밀번호를 입력해 주세요.');
    }
    var param = {
        'empNo': $('#empNo').val(),
        'empPw': $('#empPw').val(),
        'empNm': '',
        'authScan': $('#mApproval1').prop("checked") ? 'Y' : 'N',
        'authIcr': $('#mApproval2').prop("checked") ? 'Y' : 'N',
        'authMid': $('#mApproval3').prop("checked") ? 'Y' : 'N',
        'authFinal': $('#mApproval4').prop("checked") ? 'Y' : 'N',
        'authAdmin': $('#mAdmin').prop("checked") ? 'Y' : 'N',
        'authExternal': $('#mExternalUsers').prop("checked") ? 'Y' : 'N',
        'beforeEmpNo': $('#tbody_user > tr.on > td:eq(0)').text(),
        'type': type
    };
    
    $.ajax({
        url: '/userManagement/modifyUser',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            fn_alert('alert', data.message);
            if (data.code == 200) {
                initUserForm();
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
    
}

// 사용자 등록 및 수정 폼 초기화
function initUserForm() {
    $('#empNo').val('');
    $('#empPw').val('');
    $('#mApproval1').prop("checked", false);
    $('#mApproval2').prop("checked", false);
    $('#mApproval3').prop("checked", false);
    $('#mApproval4').prop("checked", false);
    $('#mAdmin').prop("checked", false);
    $('#mExternalUsers').prop("checked", false);
    $('.user-auth .ez-checkbox').removeClass('ez-checked');
    $('#btn_insert').show();
    $('#btn_update').hide();
}

// 사용자 등록
function fn_insertUser() {
    var param = {};
    if (!fn_validate("INSERT")) return;
    else param = fn_getParam();

    console.log(`insert param : ${JSON.stringify(param)}`);
    $.ajax({
        url: '/userManagement/insertUser',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            if (data.CODE == "200") {
                fn_alert('alert', data.RESULT);
                fn_initUser(); // 초기화
                fn_searchUser();
            } else if(data.CODE == "300") {
                fn_alert('alert', data.RESULT);
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// 사용자 수정
function fn_updateUser() {
    var param = {};
    if (!fn_validate("UPDATE")) return;
    else param = fn_getParam();
    console.log(`update param : ${JSON.stringify(param)}`);
    $.ajax({
        url: '/userManagement/updateUser',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            if (data.CODE == "200") {
                fn_alert('alert', data.RESULT);
                fn_initUser(); // 초기화
                $("#btn_update").hide();
                $("#btn_insert").fadeIn(); // 등록모드
                fn_searchUser();
            } else if (data.CODE == "300") {
                fn_alert('alert', data.RESULT);
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// 사용자 추가
function insUserBtnEvent() {
    $('#insUserBtn').click(function () {
        //예외 처리
        if(isNull($("#userId").val())) {
            fn_alert('alert', "사용자 ID를 입력해주세요.");
            $("#userId").focus();
            return;
        }
        if (isNull($("#userPw").val())) {
            fn_alert('alert', "비밀번호를 입력해주세요.");
            $("#userPw").focus();
            return;
        }
        if (isNull($("#userPwConfirm").val())) {
            fn_alert('alert', "비밀번호를 확인해주세요.");
            $("#userPwConfirm").focus();
            return;
        }
        if ($("#userPw").val() != $("#userPwConfirm").val()) {
            fn_alert('alert', "비밀번호 확인이 일치하지 않습니다.");
            $("#userPwConfirm").focus();
            return;
        }
        $("#insUserForm").submit();
    });
}

// 비밀번호 변경 팝업 호출
function openUpdatePw(seqNum, userId) {
    $("#seqNumUpdate").val(seqNum);
}

// 비밀번호 변경
function updatePw() {
    //예외 처리
    if (isNull($("#userPwUpdate").val())) {
        fn_alert('alert', "비밀번호를 입력해주세요.");
        $("#userPwUpdate").focus();
        return;
    }
    if (isNull($("#userPwUpdateConfirm").val())) {
        fn_alert('alert', "비밀번호를 확인해주세요.");
        $("#userPwUpdateConfirm").focus();
        return;
    }
    if ($("#userPwUpdate").val() != $("#userPwUpdateConfirm").val()) {
        fn_alert('alert', "비밀번호 확인이 일치하지 않습니다.");
        $("#userPwUpdateConfirm").focus();
        return;
    }
    $("#updatePwForm").submit();
    fn_alert('alert', "수정되었습니다.");
}

/**
 * 사용자 삭제
 */
function openDeleteUser(empNo, e) {

    e.stopPropagation();
    fn_alert('confirm', empNo + " 님을 삭제하시겠습니까?", function () {
        deleteUser(empNo);
    });
}
function deleteUser(empNo, empNm) {
    console.log(empNo);

    $.ajax({
        url: '/userManagement/deleteUser',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'empNo': empNo }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            fn_alert('alert', "삭제되었습니다.");
            $('.empNo_' + empNo).remove();
        },
        error: function (err) {
            console.log(err);
        }
    });
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
                deptList.push(dept[i]);
                var appendText = '<li><a>' + dept[i].DEPT_NM + '</a></li>';
                $('#deptType').append(appendText);
            }

        },
        error: function (err) {
            console.log(err);
        }
    });
}