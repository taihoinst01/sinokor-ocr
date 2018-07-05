'use strict';
//(function () {
$(document).ready(function () {
    
});

$('#loginfrm').validate({
    onkeyup: false,
    submitHandler: function () {
        return true;
    },
    rules: {
        userId: {
            required: true,
            minlength: 2
        },
        userPw: {
            required: true,
            minlength: 8,
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
                        return true
                    } else {
                        return "\"" + data.msg + "\"";
                    }
                }
            }
        }
    }
});