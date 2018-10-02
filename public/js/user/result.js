$(function () {
    $("#pass").on('click', function () {
        var param = {
            userName: $("#user_name").val(),
            userAge: $("#user_age").val(),
            userPhone: $("#user_phone").val(),
        };
        $.ajax({
            url: '/result',
            type: 'post',
            datatype: "json",
            data: JSON.stringify({ 'text': param }),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(1, 99);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));
                $("#resultValue").val(data.text.userName + data.text.userAge + data.text.userPhone);
            },
            error: function (err) {
                console.log(err);
            }
        });

    });
});