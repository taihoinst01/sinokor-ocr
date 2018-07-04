var curPage = 1;

$(function () {
    insUserBtnEvent(); // 사용자 추가 이벤트

    // 사용자 조회
    $("#btn_search").on("click", function () {
        searchUser(curPage);
    });
    // 페이징 초기화
    $("#pagination").html(pagination(curPage, $("#totalCount").val()));

    searchUser(1);
})

/**
 * 페이지 이동
 */
function goPage(page) {
    searchUser(page);
}
/**
 * 사용자 조회
 */
function searchUser(curPage) {
    curPage = isNull(curPage) ? 1 : curPage;
    var html = "";
    var param = {
        'userId': $("#searchUserId").val(),
        'startNum': ((curPage - 1) * MAX_ENTITY_IN_PAGE) + 1,
        'endNum': MAX_ENTITY_IN_PAGE
    };
    $.ajax({
        url: '/userManagement/searchUser',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            if (data.length > 0) {
                $.each(data, function (index, entry) {
                    html += '<tr>';
                    html += '<td>' + nvl(entry.seqNum) + '</td>';
                    html += '<td>' + nvl(entry.userId) + '</td>';
                    html += '<td>' + '<button class="btn btn-default" data-toggle="modal" data-target="#userUpdate" id="updatePwBtn">수정</button>' + '</td>';
                    html += "<td>" + nvl(entry.auth) + "</td>";
                    html += "<td>" + nvl(entry.email) + "</td>";
                    html += "<td>" + nvl(entry.joinDate) + "</td>";
                    html += "<td>" + nvl(entry.lastLoginDate) + "</td>";
                    html += "<td>" + entry.icrUseCount + "</td>";
                    html += "<td>" + '<button class="btn btn_delete" onclick="deleteUser(' + entry.seqNum + ')">삭제</button>' + "</td>";
                    html += "</tr>";
                });
            }
            $("#tbody_user").empty().append(html);
            $("#pagination").html(pagination(curPage, data[0].totalCount));
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

/**
 * 사용자 삭제
 */
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
