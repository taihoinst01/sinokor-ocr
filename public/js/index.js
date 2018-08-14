'use strict';
//(function () {
$(document).ready(function () {
    var cookieUserId = getCookie("ocr_userid");

    if (!isNull(cookieUserId)) {
        $("#userId").val(cookieUserId);
        //$("#remember_me").iCheck("check");
        $("#remember_me").prop("checked", true);
        $("#remember_me").parent().addClass('ez-checked');
    } else {
        $("#userId").val("");
    }

    $("#remember_me").on("ifChanged", function (event) {
        if (!$("#remember_me").is(":checked")) {
            deleteCookie("ocr_userid");
        }
    });

    //임시 자동로그인
    //$('#userId').val('admin');
    //$('#userPw').val('123');
    //setTimeout(function () { $('#sendLoginBtn').click(); }, 1000);
});

function getCookie(cookieName) {
    cookieName = cookieName + '=';
    var cookieData = document.cookie;
    var start = cookieData.indexOf(cookieName);
    var cookieValue = '';
    if (start != -1) {
        start += cookieName.length;
        var end = cookieData.indexOf(';', start);
        if (end == -1) end = cookieData.length;
        cookieValue = cookieData.substring(start, end);
    }
    return unescape(cookieValue);
}

function deleteCookie(cookieName) {
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() - 1);
    document.cookie = cookieName + "= " + "; expires=" + expireDate.toGMTString() + "; path=/";
}

$('#loginfrm').validate({
    onkeyup: false,
    submitHandler: function () {
        return true;
    },
    rules: {
        chkSaveUserId: {},
        userId: {
            required: true,
            minlength: 2
        },
        userPw: {
            required: true,
            minlength: 2,
            remote: {
                url: '/login',
                type: 'post',
                data: {
                    userId: function () {
                        return $('#userId').val();
                    }
                },
                dataFilter: function (data) {
                    var data = JSON.parse(data);
                    if (data.success) {
                        return true;
                    } else {
                        return "\"" + data.msg + "\"";
                    }
                }
            }
        }
    }
});