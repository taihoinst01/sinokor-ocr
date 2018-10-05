$(function () {
    /*
    //Example
    $("#pass").on('click', function () {
        var param = {
            gubun: $("#user_name").val(),
            userAge: $("#user_age").val(),
            userPhone: $("#user_phone").val(),
        };
        $.ajax({
            url: '/result',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(1, 99);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));
                var data2 = data.split('^');
                for (var i in data2) {
                    alert(data2[i]);
                }

                $("#resultValue01").val(data2[0] + "----");
                $("#resultValue02").val(data);

            },
            error: function (err) {
                console.log(err);
            }
        });

    });
    */
   
    //WF_ApprovalCancel-결제취소
    $("#approvalCancelBtn").on('click', function () {
        var param = {
            gubun: $(".gubun").val(),
            gsProId: $("#gsProId").val(),
            gsInitialId: $("#gsInitialId").val(),
            sendid: $("#sendid").val(),
            gsSeqNo: $("#gsSeqNo").val(),
            gsPostType: $("#gsPostType").val(),
            ssUsrId: $("#ssUsrId").val()
        };
        $.ajax({
            url: '/wF_WorkflowProc',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(1, 99);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));

                if (data == "1") {//gubun값이 WF_ApprovalCancel 일 경우
                    console.log("Success!!" + data);
                    alert("Success : " + data);
                }
                else {
                    console.log("Fail!!");
                    alert("Fail : " + data);
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    });

    //WF_RemarkUpdate
    $("#remarkUpdateBtn").on('click', function () {
        var param = {
            gubun: $(".gubun").val(),
            proid: $("#proid").val(),
            recvid: $("#recvid").val(),
            seqno: $("#seqno").val()
        };
        $.ajax({
            url: '/wF_WorkflowProc',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(1, 99);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));

                if (data == "success") {//gubun값이 WF_RemarkUpdate 일 경우
                    console.log("Success!!" + data);
                    alert("Success : " + data);
                }
                else {
                    console.log("Fail!!");
                    alert("Fail : " + data);
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    });

    //WF_Registration-결제등록
    $("#registrationBtn").on('click', function () {
        var param = {
            gubun: $(".gubun").val(),
            gsProId: $("#gsProId1").val(),
            hdnWorkGubun: $("#hdnWorkGubun").val(),
            info04: $("#info04").val(),
            selHandlingUser: $("#selHandlingUser").val(),
            v_remark: $("#v_remark").val(),
            v_wf_line: $("#v_wf_line").val(),
            v_last: $("#v_last").val(),
            gsPostType: $("#gsPostType1").val(),
            index06: $("#index06").val(),
            info01: $("#info01").val(),
            info08: $("#info08").val(),
            bizdvcd: $("#bizdvcd").val(),
            imgcnt: $("#imgcnt").val(),
            ssUsrId: $("#ssUsrId").val()
        };
        $.ajax({
            url: '/wF_WorkflowProc',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(1, 99);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));

                if (data == "0") {//gubun값이 WF_Registration 일 경우
                    console.log("Success!!" + data);
                    alert("Success : " + data);
                }
                else {
                    console.log("Fail!!");
                    alert("Fail : " + data);
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    });

    //WF_ApprovalCheck
    $("#approvalCheckBtn").on('click', function () {
        var param = {
            gubun: $(".gubun").val(),
            proid: $("#proid1").val(),
            ssUsrId: $("#ssUsrId").val()
        };
        $.ajax({
            url: '/wF_WorkflowProc',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(1, 99);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));

                if (data == "1") {//gubun값이 WF_ApprovalCheck 일 경우
                    console.log("Success!!" + data);
                    alert("Success : " + data);
                }
                else {
                    console.log("Fail!!");
                    alert("Fail : " + data);
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    });

    //WF_ReturnRegistration-결제반려
    $("#returnRegistrationBtn").on('click', function () {
        var param = {
            gubun: $(".gubun").val(),
            proid: $("#proid2").val(),
            sendid: $("#sendid1").val(),
            recvid: $("#recvid1").val(),
            code: $("#code").val(),
            remark: $("#remark").val(),
            reason: $("#reason").val(),
            index06: $("#index061").val(),
            info01: $("#info011").val(),
            bizdvcd: $("#bizdvcd1").val(),
            imgcnt: $("#imgcnt1").val(),
            gsInfo09: $("#gsInfo09").val(),
            ssC_APP: $("#ssC_APP").val(),
            ssUsrId: $("#ssUsrId").val()
        };
        $.ajax({
            url: '/wF_WorkflowProc',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(1, 99);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));

                if (data == "0") {//gubun값이 WF_ReturnRegistration 일 경우
                    console.log("Success!!" + data);
                    alert("Success : " + data);
                }
                else {
                    console.log("Fail!!");
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    });

    //WF_AllRegistration-결재전체상신
    $("#allRegistrationBtn").on('click', function () {
        var param = {
            gubun: $(".gubun").val(),
            gsProId: $("#gsProId55").val(),
            hdnWorkGubun: $("#hdnWorkGubun55").val(),
            info04: $("#info0455").val(),
            selHandlingUser: $("#selHandlingUser55").val(),
            v_last: $("#v_last55").val(),
            gsPostType: $("#gsPostType55").val(),
            index06: $("#index0655").val(),
            imgcnt: $("#imgcnt55").val(),
            info01: $("#info0155").val(),
            info08: $("#info0855").val(),
            bizdvcd: $("#bizdvcd55").val(),
            ssC_APP: $("#ssC_APP55").val(),
            ssUsrId: $("#ssUsrId55").val()
        };
        $.ajax({
            url: '/wF_WorkflowProc',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(1, 99);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));

                for (var i = 0; i < data.length; i++) {
                        if (data[i].resultInt == "-998") {
                            console.log("Fail!!" + data[i].laProId + " : " + data[i].resultInt);
                            alert("Fail : " + data[i].laProId + " : " + data[i].resultInt);
                    }
                    else if (data[i].resultInt == "0") {
                            console.log("Success!!" + data[i].laProId + " : " + data[i].resultInt);
                            alert("Success : " + data[i].laProId + " : " + data[i].resultInt);
                    }
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    });

    //WF_GetAllApprovalList-결제리스트조회
    $("#getAllApprovalListBtn").on('click', function () {
        var param = {
            gubun: $(".gubun").val(),
            proid: $("#proid66").val()
        };
        $.ajax({
            url: '/wF_WorkflowProc',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(1, 99);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));

                for (var i = 0; i < data.length; i++) {
                    console.log("Success : " + data[i].imgId);
                    alert("Success : " + data[i].imgId);
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    });


    //WF_AllReturnRegistration-결재전체반려
    $("#allReturnRegistrationBtn").on('click', function () {
        var param = {
            gubun: $(".gubun").val(),
            proid: $("#proid77").val(),
            sendid: $("#sendid77").val(),
            recvid: $("#recvid77").val(),
            code: $("#code77").val(),
            remark: $("#remark77").val(),
            reason: $("#reason77").val(),
            index06: $("#index0677").val(),
            info01: $("#info0177").val(),
            imgcnt: $("#imgcnt77").val(),
            index03: $("#index0377").val(),
            gsInfo09: $("#gsInfo0977").val(),
            ssUsrId: $("#ssUsrId77").val()
        };
        $.ajax({
            url: '/wF_WorkflowProc',
            type: 'post',
            datatype: "json",
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                //addProgressBar(1, 99);
            },
            success: function (data) {
                console.log("SUCCESS insertFileInfo : " + JSON.stringify(data));

                if (data == "0") {//gubun값이 WF_ApprovalCancel 일 경우
                    console.log("Success!!" + data);
                    alert("Success : " + data);
                }
                else {
                    console.log("Fail!!");
                    alert("Fail : ");
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    });

});