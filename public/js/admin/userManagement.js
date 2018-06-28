$(function () {
    insUserBtnEvent(); // 사용자 추가 이벤트
})

function insUserBtnEvent() {
    $('#insUserBtn').click(function () {
        //예외 처리

        $("#insUserForm").submit();
    });
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
            location.href = "/userManagement";
        },
        error: function (err) {
            console.log(err);
        }
    });
}
