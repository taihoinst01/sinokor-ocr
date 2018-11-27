'use strict';

$(document).ready(function () {
    if ($('#scanApproval').val() == 'Y' || $('#icrApproval').val() == 'Y') {
        fn_loadLeftSideBarInvoiceRegistration();    // 레프트사이드바 계산서등록(진행 수) 표시
    } else if ($('#middleApproval').val() == 'Y' || $('#lastApproval').val() == 'Y') {
        fn_loadLeftSideBarMyApproval();             // 레프트사이드바 내결재(진행 수) 표시
    }

    /* 18.11.27 주석
    if ($('#adminApproval').val() == 'Y') { //관리자일 경우
        fn_loadLeftSideBarInvoiceRegistration();
        fn_loadLeftSideBarMyApproval()
    } else if ( ($('#scanApproval').val() == 'Y' && $('#adminApproval').val() == 'N') || ($('#icrApproval').val() == 'Y' && $('#adminApproval').val() == 'N') ) {
        fn_loadLeftSideBarInvoiceRegistration();    // 레프트사이드바 계산서등록(진행 수) 표시
    } else if ( ($('#middleApproval').val() == 'Y' && $('#adminApproval').val() == 'N') || ($('#lastApproval').val() == 'Y' && $('#adminApproval').val() == 'N') ) {
        fn_loadLeftSideBarMyApproval();             // 레프트사이드바 내결재(진행 수) 표시
    }
    */
});

// 레프트사이드바 계산서등록 표시
function fn_loadLeftSideBarInvoiceRegistration() {
    var param = {
        'scanApproval': $('#scanApproval').val(),
        'icrApproval': $('#icrApproval').val(),
        'adminApproval': $('#adminApproval').val()
    }
    $.ajax({
        url: '/common/leftSideBarInvoiceRegistration',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
        },
        success: function (data) {
            //console.log("leftSideBar ir : " + JSON.stringify(data));
            if (data.cnt > 99) {
                $("#span_leftsidebar_ir").html("99+").addClass('on');
            } else if (data.cnt > 0) {
                $("#span_leftsidebar_ir").html(data.cnt).addClass('on');
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}
// 레프트사이드바 내결재 표시
function fn_loadLeftSideBarMyApproval() {
    var param = {
        'middleApproval': $('#middleApproval').val(),
        'lastApproval': $('#lastApproval').val(),
        'adminApproval': $('#adminApproval').val()
    }
    $.ajax({
        url: '/common/leftSideBarMyApproval',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
        },
        success: function (data) {
            //console.log("leftSideBar ir : " + JSON.stringify(data));
            if (data.cnt > 99) {
                $("#span_leftsidebar_ma").html("99+").addClass('on');
            } else if (data.cnt > 0) {
                $("#span_leftsidebar_ma").html(data.cnt).addClass('on');
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}
