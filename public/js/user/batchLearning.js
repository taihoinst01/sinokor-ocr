$(function () {
    $('.uploadBtn').click(function () {
        $(this).next().click();
    });

    $('#fileuploadBtn').click(function () {
        $(this).next().click();
    });

    $('#fileupload').fileupload({
        url: '/batchLearning/upload',
        dataType: 'json',
        add: function (e, data) {
            data.context = $('<p/>').text('Uploading...').appendTo(document.body);
            data.submit();
        },
        done: function (e, data) {
            alert('upload finished');
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .progress-bar').css(
                'width',
                progress + '%'
            );
        }
    });
})


