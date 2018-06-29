$(function () {
    $('#uploadFile').change(function () {
        if ($(this).val() !== '') {
            $('#multiUploadForm').submit();
        }
    });
    
    $('#multiUploadBtn').click(function () {     
        $('#uploadFile').click();
    });
    
    $('#multiUploadForm').ajaxForm({
        beforeSubmit: function (data, frm, opt) {
            return true;
        },
        success: function (responseText, statusText) {
            alert("전송성공!!");
        },
        error: function (e) {
            console.log(e);
        }
    });
    
})


