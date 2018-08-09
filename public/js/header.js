'use strict';

$(document).ready(function () {
    // 사용자 비밀번호 변경 팝업 ON
    $("#btn_openUserPop").on("click", function () {
        fn_userPwOpen();
    });

    // 사용자 비밀번호 변경 팝업 확인
    $("#btn_header_userPop_submit").on("click", function () {
        fn_userPwChange();
    });

    // 사용자 비밀번호 변경 팝업 취소
    $("#btn_header_userPop_cancel").on("click", function () {
        fn_userPwCancel();
    });


});

// 사용자 비밀번호 변경 팝업 ON
function fn_userPwOpen() {
    
}

// 사용자 비밀번호 변경 팝업 확인
function fn_userPwChange() {
    if (isNull($("#header_userPop_userPw").val())) {
        alert("기존 비밀번호를 입력해주세요.");
        $("#header_userPop_userPw").focus();
        return;
    }
    var param = {
        userPw: $("#header_userPop_userPw").val()
    };
    $.ajax({
        url: '/common/headerUserPopSelectPw',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            console.log("param : " + JSON.stringify(param));
        },
        success: function (data) {
            console.log("header changePw : " + JSON.stringify(data));
            if (data.cnt[0].CNT > 0) {
                fn_callbackConfirmUserPw();
            } else {
                alert("기존 비밀번호가 일치하지 않습니다.");
                return;
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

function fn_callbackConfirmUserPw() {
    if (isNull($("#header_userPop_newUserPw").val())) {
        alert("변경할 비밀번호를 입력해주세요.");
        $("#header_userPop_newUserPw").focus();
        return;
    }
    if (isNull($("#header_userPop_newUserPw_confirm").val())) {
        alert("변경할 비밀번호 확인을 입력해주세요.");
        $("#header_userPop_newUserPw_confirm").focus();
        return;
    }
    if (!$("#header_userPop_newUserPw").val().match(/^[0-9a-zA-Z`.~!@\#$%<>^&*\()\-=+_\\]{3,18}$/)) {
        alert("비밀번호는 최소 3자리 최대 18자리, 영문, 숫자, 특수문자만 허용됩니다.\n(한글, 공백, 일부 특수문자 불가)");
        $("#header_userPop_newUserPw").focus();
        return;
    }
    if (strcmp($("#header_userPop_newUserPw").val(), $("#header_userPop_newUserPw_confirm").val()) != 0) {
        alert("변경할 비밀번호가 일치하지 않습니다.");
        $("#header_userPop_newUserPw_confirm").focus();
        return;
    }
    if (strcmp($("#header_userPop_userPw").val(), $("#header_userPop_newUserPw").val()) == 0) {
        alert("기존의 비밀번호와 변경할 비밀번호가 같습니다.");
        $("#header_userPop_newUserPw_confirm").focus();
        return;
    }
    var param = {
        userPw: $("#header_userPop_newUserPw").val()
    };
    $.ajax({
        url: '/common/headerUserPopChangePw',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
        },
        success: function (data) {
            if (data.code == "200") alert("비밀번호가 변경되었습니다.");
            $("#btn_header_userPop_cancel").click();
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// 사용자 비밀번호 변경 팝업 취소
function fn_userPwCancel() {
    var empty = "";
    $("#header_userPop_userPw").val(empty);
    $("#header_userPop_newUserPw").val(empty);
    $("#header_userPop_newUserPw_confirm").val(empty);
}

// 레프트사이드바 계산서등록(반려된 수) 표시
function fn_loadLeftSideBarInvoiceRegistration() {
    $.ajax({
        url: '/common/leftSideBarInvoiceRegistration',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({}),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
        },
        success: function (data) {
            console.log("leftSideBar ir : " + JSON.stringify(data));
            if (data.cnt > 0) $("#span_leftsidebar_ir").show().html(data.cnt);
        },
        error: function (err) {
            console.log(err);
        }
    });
}
// 레프트사이드바 내결재(진행 수) 표시
function fn_loadLeftSideBarMyApproval() {
    $.ajax({
        url: '/common/leftSideBarMyApproval',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({}),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
        },
        success: function (data) {
            console.log("leftSideBar ir : " + JSON.stringify(data));
            if(data.cnt > 0 ) $("#span_leftsidebar_ma").show().html(data.cnt);
        },
        error: function (err) {
            console.log(err);
        }
    });
}
