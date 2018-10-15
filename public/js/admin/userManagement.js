'use strict';
var curPage = 1;

$(function () {
    insUserBtnEvent(); // 사용자 추가 이벤트

    // 사용자 조회
    $("#btn_search").on("click", function () {
        fn_searchUser();
    });
    // 사용자 등록
    $("#btn_insert").on("click", function () {
        fn_insertUser();
    });
    // 사용자 수정
    $("#btn_update").on("click", function () {
        fn_updateUser();
    });
    // 초기화 (테스트)
    $("#btn_init").on("click", function () {
        fn_initUser();
    });

    fn_searchUser();
    fn_searchHighApproval(0, "");


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
        //'userId': $("#searchUserId").val(),
        //'startNum': ((curPage - 1) * MAX_ENTITY_IN_PAGE),
        //'endNum': MAX_ENTITY_IN_PAGE
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
            startProgressBar(); // 프로그레스바 시작
            addProgressBar(1, 1); // 프로그레스바 진행
        },
        success: function (data) {
            addProgressBar(2, 99); // 프로그레스바 진행
            console.log("data.. : " + JSON.stringify(data));
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    appendHtml += 
                    '<tr>' + 
                        '<td scope="row">' + nvl(entry.SEQNUM) + '</td>' + 
                    '<td><a href="#none" onclick="javascript:fn_chooseUser(' + entry.SEQNUM + ');" class="tip" title="사번:' + nvl(entry.USERID) + '">' + nvl(entry.USERID) + '</a></td>' + 
                        '<td>' + nvl(entry.EMAIL) + '</td>' + 
                        '<td>' + nvl(entry.NOTE) + '</td>' + 
                        '<td>' + nvl(entry.SCANAPPROVAL) + '</td>' + 
                        '<td>' + nvl(entry.ICRAPPROVAL) + '</td>' + 
                        '<td>' + nvl(entry.MIDDLEAPPROVAL) + '</td>' + 
                        '<td>' + nvl(entry.LASTAPPROVAL) + '</td>' + 
                        '<td>' + nvl(entry.HIGHAPPROVALID) + '</td>' + 
                        '<td>' + nvl(entry.LASTLOGINDATE) + '</td>' + 
                        '<td>' + nvl(entry.OCRUSECOUNT) + '</td>' + 
                        '<td><button class="btn btn_delete" onclick="javascript:openDeleteUser(' + entry.SEQNUM + ')">삭제</button></td>;' + 
                    '</tr>';
                });
                //<td><button class="btn btn-default" data-toggle="modal" data-target="#userUpdate" id="updatePwBtn" onclick="javascript:openUpdatePw(${entry.seqNum}, ${entry.userId})">수정</button></td>
            }
            $("#tbody_user").empty().append(appendHtml);
            //$("#pagination").html(pagination(curPage, data[0].totalCount));
            endProgressBar();
        },
        error: function (err) {
            endProgressBar();
            console.log(err);
        }
    });
}

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
                            $("#approval2").prop("checked", true);
                            $("#approval2").parent().addClass('ez-checked');
                        }
                        if (nvl(entry["LASTAPPROVAL"]) == "Y") {
                            $("#approval3").prop("checked", true);
                            $("#approval3").parent().addClass('ez-checked');
                        }
                        fn_searchHighApproval(entry["SEQNUM"], entry["HIGHAPPROVALID"]); // 상위결재자 목록 조회
                    }
                });
            } else {
                alert("장애가 발생하였습니다.");
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
        alert("사용자 ID는 필수입니다.");
        $("#userId").focus();
        return false;
    }
    if (flag == "INSERT" && isNull($("#userPw").val())) {
        alert("사용자 비밀번호는 필수입니다.");
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
        alert(`이미 ${$("#userId").val()} 사번이 존재합니다.`);
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
        middleApproval: $("#approval2").is(":checked") ? "Y" : "N",
        lastApproval: $("#approval3").is(":checked") ? "Y" : "N",
        highApprovalId: nvl($("#highApprovalId").val())
    };
    return param;
};

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
                alert(data.RESULT);
                fn_initUser(); // 초기화
                fn_searchUser();
            } else if(data.CODE == "300") {
                alert(data.RESULT);
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
                alert(data.RESULT);
                fn_initUser(); // 초기화
                $("#btn_update").hide();
                $("#btn_insert").fadeIn(); // 등록모드
                fn_searchUser();
            } else if (data.CODE == "300") {
                alert(data.RESULT);
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
            alert("사용자 ID를 입력해주세요.");
            $("#userId").focus();
            return;
        }
        if (isNull($("#userPw").val())) {
            alert("비밀번호를 입력해주세요.");
            $("#userPw").focus();
            return;
        }
        if (isNull($("#userPwConfirm").val())) {
            alert("비밀번호를 확인해주세요.");
            $("#userPwConfirm").focus();
            return;
        }
        if ($("#userPw").val() != $("#userPwConfirm").val()) {
            alert("비밀번호 확인이 일치하지 않습니다.");
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
        alert("비밀번호를 입력해주세요.");
        $("#userPwUpdate").focus();
        return;
    }
    if (isNull($("#userPwUpdateConfirm").val())) {
        alert("비밀번호를 확인해주세요.");
        $("#userPwUpdateConfirm").focus();
        return;
    }
    if ($("#userPwUpdate").val() != $("#userPwUpdateConfirm").val()) {
        alert("비밀번호 확인이 일치하지 않습니다.");
        $("#userPwUpdateConfirm").focus();
        return;
    }
    $("#updatePwForm").submit();
    alert("수정되었습니다.");
}

/**
 * 사용자 삭제
 */
function openDeleteUser(seqNum) {
    if (confirm("삭제하시겠습니까?")) {
        deleteUser(seqNum);
    } else {
        return;
    }
}
function deleteUser(seqNum) {
    console.log(seqNum);

    $.ajax({
        url: '/userManagement/deleteUser',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'seqNum': seqNum }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            alert("삭제되었습니다.");
            location.href = "/userManagement";
        },
        error: function (err) {
            console.log(err);
        }
    });
}
