var ocrdata = [];
var checkNum = 0;
var checkCount = 0; // 문서 분석 개수
var processCount = 0; // 문서 처리 개수
var ocrCount = 0;
var imgFileName = []; // 검토하기에 필요한 분석한 이미지 파일명
var currentPage;
var lineTextArr = [];
var fileNameArr = [];
var x, y, textWidth, textHeight; // 문서 글씨 좌표
var mouseX, mouseY, mouseMoveX, mouseMoveY; // 마우스 이동 시작 좌표, 마우스 이동 좌표

$(function () {
    var dt = new Date();
    var current = dt.getFullYear() + '-' + ((dt.getMonth() + 1 < 10) ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1) + '-' + ((dt.getDate() + 1 < 10) ? '0' + (dt.getDate()) : dt.getDate())
    $('#fdate').val(current);
    $('#tdate').val(current);
    $('#leftPagingBtn').attr('disabled', true);
    $('#rightPagingBtn').attr('disabled', true);
    excelSaveEvent();
    dateEvent();
    getFiles();
    ocrApi();
    checkDocBtn();
    clickPagingBtn();
    uploadFile();
    deleteFile();
    modifyOcrdata();

    /*
    // 이미지 원본보기
    $('#originalShowBtn').click(function () {
        imageDivChange(0);
    })

    // 이미지 드래그로 포커스 이동
    $('#formImageZoom').mousedown(function (e) {
        console.log("마우스 누름: " + e.pageX + ', ' + e.pageY);
        mouseX = e.pageX;
        mouseY = e.pageY;
    });

    // 이미지 드래그로 포커스 이동
    $('#formImageZoom').mouseup(function (e) {
        var xDistance, yDistance;

        console.log("마우스 땜: " + e.pageX + ', ' + e.pageY);
        mouseMoveX = e.pageX;
        mouseMoveY = e.pageY;

        xDistance = mouseX - mouseMoveX;
        yDistance = mouseMoveY - mouseY;
        console.log("xDistance: " + xDistance + ", yDistance: " + yDistance);

        imageMove(xDistance, yDistance);
    });
    */

    // 저장소DIV 토글
    $('.accordionBtn').click(function () {
        $('#storageDiv').toggle();
        $('#accordionDiv').toggle();
        $('#formOcrDetailDiv').toggle();
    })

    //iCheck for checkbox and radio inputs
    $('input[type="checkbox"].minimal, input[type="radio"].minimal').iCheck({
        checkboxClass: 'icheckbox_minimal-blue',
        radioClass: 'iradio_minimal-blue'
    })
    //Red color scheme for iCheck
    $('input[type="checkbox"].minimal-red, input[type="radio"].minimal-red').iCheck({
        checkboxClass: 'icheckbox_minimal-red',
        radioClass: 'iradio_minimal-red'
    })
    //Flat red color scheme for iCheck
    $('input[type="checkbox"].flat-red, input[type="radio"].flat-red').iCheck({
        checkboxClass: 'icheckbox_flat-green',
        radioClass: 'iradio_flat-green'
    })
});

function getFiles() {
    $('#result').html('');
    $.ajax({
        url: '/ocrFormAnalysis/getFiles',
        type: 'get',
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            for (var i = 0; i < data.files.length; i++) {
                var itemHTML = '<tr>';
                itemHTML += '<td><input name="imgCheck" type="checkbox" value="' + data.files[i].fileName.split('/')[2] + '"> </td>';
                itemHTML += '<td><a href="/ocrFormAnalysis/downloadImg?fileName=' + data.files[i].fileName.split('/')[2] + '">' + data.files[i].fileName.split('/')[2] + '</a></td>';
                itemHTML += '<td>' + data.files[i].time.split('T')[0] + '</td>';
                itemHTML += '</tr>';
                $('#result').append(itemHTML);
            }
            if (data.count != 0) {
                $('.mtm10 > strong').text(data.count + 1);
            } else {
                $('.mtm10 > strong').text(data.count);
            }
            checkBoxEvent();

        },
        error: function (err) {
            console.log(err);
        }
    });
}

function checkBoxEvent() {
    $('input[type="checkbox"]').change(function (e) {
        checkCount = 0;
        if ($(e.target).val() == 'all') {
            if ($(e.target).is(':checked')) {
                $("input[type=checkbox]").prop("checked", true);
            } else {
                $("input[type=checkbox]").prop("checked", false);
            }
        }
        
        $("input[type=checkbox]:checked").each(function (i, el) {
            if (el.value != 'all') {
                checkNum++;
            }
        });
        /*
        $('.mtp10 > strong').text(checkCount);
        checkNum = checkCount;
        */
    });
}

function dateEvent() {
    $('.date').click(function (e) {
        $('.date').each(function (i, el) {
            $(el).removeClass('on');
        });
        $(e.target).addClass('on');
        type = $(e.target).attr('alt');
        dateHandler(type);
    });
    $('#fdate,#tdate').change(function () {
        dateHandler('condition');
    });
}

function dateHandler(type) {
    var dateInterval;

    dateInterval = conditionalSearch(type);
    $.ajax({
        url: '/ocrFormAnalysis/getFiles',
        type: 'get',
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            $('#result').html('');
            var itemCount = 0;
            for (var i = 0; i < data.files.length; i++) {               
                var itemTime = data.files[i].time.split('T')[0].split('-');
                var itemDate = itemTime[0] + itemTime[1] + itemTime[2];
                if (dateInterval == 0 || (dateInterval[0] >= itemDate && itemDate >= dateInterval[1])) {
                    var itemHTML = '<tr>';
                    itemHTML += '<td><input name="imgCheck" type="checkbox" value="' + data.files[i].fileName.split('/')[2] + '"> </td>';
                    itemHTML += '<td><a href="/downloadImg?fileName=' + data.files[i].fileName.split('/')[2] + '">' + data.files[i].fileName.split('/')[2] + '</a></td>';
                    itemHTML += '<td>' + data.files[i].time.split('T')[0] + '</td>';
                    itemHTML += '</tr>';
                    itemCount++;
                    $('#result').append(itemHTML);
                }
            }
            $('.mtm10 > strong').text(itemCount);
            checkBoxEvent();

        },
        error: function (err) {
            console.log(err);
        }
    });
}

function conditionalSearch(type) {
    var startDate = dateConvert(new Date());
    var endDate;
    var result = [];

    if (type == 'all') {
    } else if (type == 'today') {
        endDate = dateConvert(new Date());
        result.push(startDate);
        result.push(endDate);
    } else if (type == 'week') {
        var d = new Date();
        var weekDate = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
        d.setTime(weekDate);
        endDate = dateConvert(d);
        result.push(startDate);
        result.push(endDate);
    } else if (type == 'month') {
        var d = new Date();
        var monthDate = new Date().getTime() - (30 * 24 * 60 * 60 * 1000);
        d.setTime(monthDate);
        endDate = dateConvert(d);
        result.push(startDate);
        result.push(endDate);
    } else {
        var tdate = $('#tdate').val();
        var fdate = $('#fdate').val();
        result.push(tdate.split('-')[0] + tdate.split('-')[1] + tdate.split('-')[2]);
        result.push(fdate.split('-')[0] + fdate.split('-')[1] + fdate.split('-')[2]);
    }
    return result;
}

function dateConvert(d) {
    return '' + d.getFullYear() + (((d.getMonth() + 1) < 10) ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + ((d.getDate() < 10) ? '0' + d.getDate() : d.getDate());
}

function ocrApi() {
    $('#ocrBtn').click(function () {
        
        ocrdata = [];
        imgFileName = [];
        checkNum = 0;
        processCount = 0;
        ocrCount = 0;
        lineTextArr = [];
        fileNameArr = [];
        $('#container2').hide();
        $('.tex01').text('분석 상세 내용');
        excelParams = [];
        $('.tnum01').text('0');
        $('.t01').text('0');
        $('.t04').text('0');
        $("input[type=checkbox]:checked").each(function (i, el) {
            if (el.value != 'all') {
                pdf2img($(el).val());
                checkNum++;
            }
        });

        if (checkNum > 0) {
            $("input[type=checkbox]").prop("checked", false);
            $('.mtp10 > strong').text('0');
            //analysisImg();

        } else {
            alert('분석할 문서를 선택해주세요.');
        }
    });
}

//pdf to img 변환
function pdf2img(fileName) {
    $.ajax({
        url: '/ocrFormAnalysis/pdf2img',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'fileName': fileName}),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            for (var i = 0; i < data.imgName.length; i++) {
                checkCount++;
                imgFileName.push(data.imgName[i]);
                processImage(data.imgName[i]);
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

//OCR API 호출
function processImage(fileName) {
    $('#dataForm').html('');
    var subscriptionKey = "7d51f1308c8848f49db9562d1dab7184";
    var uriBase = "https://westus.api.cognitive.microsoft.com/vision/v1.0/ocr";
    // Request parameters.
    var params;
    if (fileName.indexOf('SHIPPING') != -1) {
        params = {
            "language": "ko",
            "detectOrientation": "true",
        };
    } else {
        params = {
            "language": "unk",
            "detectOrientation": "true",
        };
    }

    // image url
    var sourceImageUrl = 'http://kr-ocr.azurewebsites.net/uploads/' + fileName;

    // Perform the REST API call.
    $.ajax({
        url: uriBase + "?" + $.param(params),

        // Request headers.
        beforeSend: function (jqXHR) {
            jqXHR.setRequestHeader("Content-Type", "application/json");
            jqXHR.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
        },

        type: "POST",

        // Request body.
        data: '{"url": ' + '"' + sourceImageUrl + '"}',
    }).done(function (data) {
        //console.log(data);
        $('.tnum01').text((Number($('.tnum01').text()) + 1));
        ocrCount++;
        ocrDataProcessing(data.regions, fileName);
    }).fail(function (jqXHR, textStatus, errorThrown) {
        var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
            jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
        alert(errorString);
    });
};

function ocrDataProcessing(regions, fileName) {
    processCount = 0;
    var lineText = [];
    var docDate, companyName, contractName, email,
        price1, price2, price3,
        totPrice, detail, etc,
        bookingNum, shipper, shipperRegion, cosignee, cosigneeRegion,
        documentType;

    for (var i = 0; i < regions.length; i++) {
        for (var j = 0; j < regions[i].lines.length; j++) {
            var item = '';
            for (var k = 0; k < regions[i].lines[j].words.length; k++) {
                item += regions[i].lines[j].words[k].text + ' ';
            }
            lineText.push({ 'location': regions[i].lines[j].boundingBox, 'text': item.trim() });
        }
    }

    //console.log(lineText);

    for (var i = 1; i < lineText.length; i++) {      
        for (var j = 0; j < lineText.length-i; j++) {
            var loc1 = lineText[j].location.split(',');
            var loc2 = lineText[j+1].location.split(',');
            if (Number(loc1[0]) > Number(loc2[0])) {
                var tmp1 = lineText[j+1];
                lineText[j+1] = lineText[j];
                lineText[j] = tmp1;
            } else if (Number(loc1[0]) == Number(loc2[0])) {
                if (Number(loc1[1]) > Number(loc2[1])) {
                    var tmp2 = lineText[j+1];
                    lineText[j+1] = lineText[j];
                    lineText[j] = tmp2;
                }
            } else {
            }
        }
    }
    lineTextArr.push(lineText);
    fileNameArr.push(fileName);
    if (ocrCount == checkCount) {
        mlPrediction();
    }
    //mlPrediction(lineText, fileName);
}

function mlPrediction() {
    for (var i = 0; i < lineTextArr.length; i++) {
        $.ajax({
            url: '/newDocLearning/ml',
            type: 'post',
            datatype: "json",
            data: JSON.stringify({ 'lineText': lineTextArr[i] }),
            contentType: 'application/json; charset=UTF-8',
            async: false,
            success: function (data) {
                processCount++;
                ocrdata.push({
                    'fileName': fileNameArr[i],
                    'formName': data.formName,
                    'formScore': data.formScore,
                    'lineText': data.message,
                    'columns': data.columns
                });

                if (processCount == Number($('.tnum01').text())) { //모든 이미지파일 ml 완료 후
                    currentPage = 1;
                    if (checkCount > 1) {
                        $('#rightPagingBtn').attr('disabled', false);
                    } else {
                        $('#rightPagingBtn').attr('disabled', true);
                    }
                    $('#leftPagingBtn').attr('disabled', true);
                    $('#originalShowBtn').show();
                    paging();
                    analysisImg();
                }

            },
            error: function (err) {
                console.log(err);
            }
        });
    }
}

function analysisImg() {
    var params = { 'data': ocrdata };

    $.ajax({
        url: '/ocrFormAnalysis/uploadExcel',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(params),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            //console.log(data);
            $('#successScore').html(data.successCount);
            $('#successExcelName').val(data.successExcelName);
            /*
            setTimeout(function () {
                if (type == 'success') {
                    window.location = '/ocrFormAnalysis/downloadExcel?fileName=' + data.successExcelName;
                } else {
                    window.location = '/ocrFormAnalysis/downloadExcel?fileName=' + data.failExcelName;
                }
            }, 1000);
            */
        },
        error: function (err) {
            console.log(err);
        }
    });
}

function validationCheck(value) {
    if (value == null || value == undefined || value.trim() == '') {
        return '';
    } else {
        return value.trim();
    }
}

function excelSaveEvent() {
    $('#sucessExcelBtn').click(function () {
        if ($('.t01').text() == '0') {
            alert('확인된 양식의 문서가 없습니다.');
        } else {
            window.location = '/ocrFormAnalysis/downloadExcel?fileName=' + $('#successExcelName').val();
        }
    });
    $('#failExcelBtn').click(function () {
        if ($('.t04').text() == '0') {
            alert('미확인된 양식의 문서가 없습니다.');
        } else {
            window.location = '/ocrFormAnalysis/downloadExcel?fileName=' + $('#failExcelName').val();
        }
    });
}

// 좌우버튼을 이용한 페이징
function clickPagingBtn() {

    $('#rightPagingBtn, #leftPagingBtn').click(function () {
        //var canvas = document.getElementById('myCanvas');
        //var context = canvas.getContext('2d');
        //context.clearRect(0, 0, canvas.width, canvas.height);

        if ($(this).attr('id') == 'rightPagingBtn') {
            currentPage++;
        } else {
            currentPage--;
        }

        if (currentPage == 1) {
            $('#leftPagingBtn').attr('disabled', true);
            if (checkCount != 1) {
                $('#rightPagingBtn').attr('disabled', false);
            }
        } else if (currentPage == checkCount) {
            $('#leftPagingBtn').attr('disabled', false);
            $('#rightPagingBtn').attr('disabled', true);
        } else if (currentPage > 1) {            
            $('#leftPagingBtn').attr('disabled', false);
            $('#rightPagingBtn').attr('disabled', false);
        }

        paging();
    });
}

function paging() {
    $('#redNemo').hide();

    $('#accuracy').html(ocrdata[currentPage - 1].formScore + '%');
    $('#formSelect').val(ocrdata[currentPage - 1].formName);
    $('#textResultTbl').html('');
    var appendText = '<tr><th style="text-align:center;">목록</th><th style="text-align:center;">DB 컬럼</th></tr>';
    for (var i = 0; i < ocrdata[currentPage - 1].lineText.length; i++) {
        appendText += '<tr><td><input type="text" value="' + ocrdata[currentPage - 1].lineText[i].text + '" style="width:100%; border:0;" />'
            + '<input type = "hidden" value = "' + ocrdata[currentPage - 1].lineText[i].location + '" /></td>'
            + '<td>' + optionHTML(ocrdata[currentPage - 1].lineText[i].column, ocrdata[currentPage - 1].columns) + '</td></tr>';  
    }
    $('#textResultTbl').append(appendText);

    $('#fileName').html(imgFileName[currentPage - 1]);
    $('#pagingText').html(currentPage + ' / ' + checkCount);
   imageInit();   
}

function optionHTML(columnNo, columns) {
    var optionHTML = '<select style="width:100%; height:100%;  border:0;">';
    optionHTML += '<option value=""></option>';
    for (var i = 0; i < columns.length; i++) {
        itemHTML = '<option value="' + columns[i].no + '"' + ((columnNo == columns[i].no) ? 'selected' : '') + '>'
            + columns[i].columnName + '</option>';
        optionHTML += itemHTML;
    }
    optionHTML += '</select>';

    return optionHTML;

}

// 문서 검토하기
function checkDocBtn() {
    $('#checkDocBtn').click(function () {
        currentPage = 1;
        if (checkCount == 0) {
            alert("양식 분석 실행 후 클릭해주세요.");
            return false;
        } else if (checkCount > 1) {
            $('#rightPagingBtn').attr('disabled', false);
        } else {
            $('#rightPagingBtn').attr('disabled', true);
        }
        $('#leftPagingBtn').attr('disabled', true);
        paging();
        $('#container2').show();  
    });
    
}

/*
// 분석 결과 확인
function hoverSquare(e) {

    // 사각형 좌표값
    var location = $(e).find('input[type=hidden]').val().split(',');   
    x = parseInt(location[0]);
    y = parseInt(location[1]);
    textWidth = parseInt(location[2]);
    textHeight = parseInt(location[3]);
    console.log("선택한 글씨: " + $(e).find('input[type=text]').val());
    console.log("x: " + x + ", y: " + y + ", textWidth: " + textWidth + ", textHeight: " + textHeight);
    imageDivChange(1);
    imageZoom(x, y);
    
    // 선택한 글씨에 빨간 네모 그리기
    $('#redNemo').css('width', textWidth);
    $('#redNemo').css('height', textHeight);
    $('#redNemo').show();

}
*/

// 원본이미지DIV 줌이미지DIV 변환
function imageDivChange(num) {
    // num = 0 : 원본이미지DIV 보이기 
    // num = 1 : 원본이미지DIV 숨기기
    // 원본
    var originalDiv = document.getElementById("formImage");

    /*
    // 줌
    var zoomDiv = document.getElementById("formImageZoom");
    if (num == 0) {
        zoomDiv.style.display = "none";
        originalDiv.style.display = "block";
    } else {
        zoomDiv.style.display = "block";
        originalDiv.style.display = "none";
    }
    */
}

// 문서이미지 불러오기
function imageInit() {
    var originalDiv = document.getElementById("formImage");
    //var zoomDiv = document.getElementById("formImageZoom");

    var sourceImageUrl = 'http://kr-ocr.azurewebsites.net/uploads/' + imgFileName[currentPage - 1];

    originalDiv.style.backgroundImage = "url('" + sourceImageUrl + "')";
    //zoomDiv.style.backgroundImage = "url('" + sourceImageUrl + "')";
    imageDivChange(0);
}

/*
// 문서이미지 좌표값에 따른 줌
function imageZoom(x, y) {
    var zoomDiv = document.getElementById("formImageZoom");

    zoomDiv.style.backgroundPosition = "-" + x + "px -" + y + "px";
}

// 마우스로 이미지 눌러 드래그시 이미지 이동
function imageMove(xDistance, yDistance) {

    var zoomDiv = document.getElementById("formImageZoom");
    var xResult, yResult;

    $('#redNemo').hide();

    xResult = x + xDistance;
    x = xResult;
    yResult = y - yDistance;
    y = yResult;  
    zoomDiv.style.backgroundPosition = "-" + x + "px -" + y + "px"; 
}
*/

//파일 업로드
function uploadFile() {
    $('#uploadFile').change(function () {
        var extArr = ['pdf','jpg'];
        var uploadFile = $(this).val();
        var filename = uploadFile.split('/').pop().split('\\').pop();

        var lastDot = uploadFile.lastIndexOf('.');
        var fileExt = uploadFile.substring(lastDot + 1, uploadFile.length).toLowerCase();
        if ($.inArray(fileExt, extArr) != -1 && $(this).val() != '') {
            var formData = new FormData($('#uploadForm')[0]);
            $.ajax({
                url: '/ocrFormAnalysis/upload',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (msg) {
                    getFiles();
                }
            });
        } else {
            $(this).val('');
            alert('파일 형식이 올바르지 않습니다.');
        }
    });

    $('#uploadBtn').click(function () {
        $('#uploadFile').click();
    });
}

//파일 삭제
function deleteFile() {
    $('#deleteBtn').click(function () {
        var checkCount = 0;
        var params = [];
        $("input[type=checkbox]:checked").each(function (i, el) {
            if (el.value != 'all') {
                checkCount++;
                params.push({ 'fileName': el.value })
            }
        });
        if (checkCount != 0) {
            $.ajax({
                url: '/ocrFormAnalysis/deleteFile',
                type: 'POST',
                datatype: 'json',
                contentType: 'application/json; charset=UTF-8',
                data: JSON.stringify({ 'data': params }),
                success: function (msg) {
                    getFiles();
                },
                error: function (err) {
                    console.log(err);
                }
            });
        } else {
            alert('삭제할 이미지를 선택해주세요.');
        }
    });
}

//목록 수정
function modifyOcrdata() {
    $('#modifyBtn').click(function () {
        var modifyData = [];

        if ($('#textResultTbl > tbody > tr').length == 0) {
            alert('수정 사항이 없습니다.');
            return false;
        }

        for (var i = 1; i < $('#textResultTbl > tbody > tr').length; i++) {
            var item = {
                'location': $('#textResultTbl > tbody > tr').eq(i).children().eq(0).children().eq(0).val(),
                'text': $('#textResultTbl > tbody > tr').eq(i).children().eq(0).children().eq(1).val(),
                'isFixed': ocrdata[currentPage - 1].lineText[i-1].isFixed
            };
            if (ocrdata[currentPage - 1].lineText[i - 1].column || ocrdata[currentPage - 1].lineText[i - 1].column != '' || $('#textResultTbl > tbody > tr').eq(i).children().eq(1).children().eq(0).val() != '') {
                item.column = $('#textResultTbl > tbody > tr').eq(i).children().eq(1).children().eq(0).val()
            }
            modifyData.push(item);
        }
        ocrdata[currentPage - 1].lineText = modifyData;
        alert('수정 완료');
    });
}