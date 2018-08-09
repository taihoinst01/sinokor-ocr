'use strict';

$(document).ready(function () {
    fn_loadLeftSideBarInvoiceRegistration();    // 레프트사이드바 계산서등록(반려된 수) 표시
    fn_loadLeftSideBarMyApproval();             // 레프트사이드바 내결재(진행 수) 표시
});

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
