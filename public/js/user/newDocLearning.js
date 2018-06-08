$(function () {
    uploadBtnEvent(); // 업로드시 미리보기 이벤트
    fvSelectEvent(); // 고정&가변 select Box 이벤트
    domainChange(); // 고정&가변 변경 이벤트
    allChk() // 체크박스 전체 선택 해제 이벤트
})

function uploadBtnEvent() {
    $('.uploadBtn').click(function () {
        $(this).next().click(function () {           
            initUpload();
        });
        $(this).next().click();
    });
}

// 이미지 업로드 미리보기 & 이미지 base64 변환 함수
function initUpload() {
    var upload = document.getElementById('initUpload'),
        holder = document.getElementById('holder');

    upload.onchange = function (e) {      
        e.preventDefault();

        var file = upload.files[0],
            reader = new FileReader();
        
        reader.onload = function (event) {           
            var img = new Image();
            img.src = event.target.result;
            holder.innerHTML = '';
            holder.appendChild(img);
            $('#holder > img').css('width', '100%').css('height', '100%');
            initOcrApi(makeblob(event.target.result));
        };
        reader.readAsDataURL(file);       
        
        return false;
    };
}

// base64를 blob 객체 변환 함수
function makeblob(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);
        return new Blob([raw], { type: contentType });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}

// ocr api 호출 함수
function initOcrApi(imgBinaryData) {
    $('#fixedTextResultTbl').html('');
    $('#variableTextResultTbl').html('');

    var params = {
        "language": "ko",
        "detectOrientation ": "true",
    };
    var subscriptionKey = "fedbc6bb74714bd78270dc8f70593122";

    $.ajax({
        url: "https://westus.api.cognitive.microsoft.com/vision/v1.0/ocr?" + $.param(params),
        beforeSend: function (xhrObj) {
            xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
        },
        type: "POST",
        data: imgBinaryData,
        processData: false
    }).done(function (data) {
        mlPrediction(ocrData2Array(data.regions));
        //appendText(data.regions);
    }).fail(function (err) {
        console.log(err);
    });
}

// ocr data 라인 단위로 배열 저장하는 함수
function ocrData2Array(regions) {
    var lineText = [];
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
    return lineText;
}

// 머신러닝 오타체크, 문서 예측 함수
function mlPrediction(lineText) {
    $.ajax({
        url: '/newDocLearning/ml',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'lineText': lineText }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            //console.log(data);
            appendText(data.message);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// 테이블 html 추가 함수
function appendText(lineText) {
    $('#textCount').html('');

    var fixedAppendHTML = '';
    var variableAppendHTML = '';
    fixedAppendHTML += '<thead><tr><th style="text-align:center;"><input type="checkbox" class="allChk"></th><th style="text-align:center;">목록</th><th style="text-align:center;">DB 컬럼</th></tr></thead>';
    variableAppendHTML += '<thead><tr><th style="text-align:center;"><input type="checkbox" class="allChk"></th><th style="text-align:center;">목록</th><th style="text-align:center;">DB 컬럼</th></tr></thead>';
    for (var i = 0; i < lineText.length; i++) {
        if (lineText[i].isFixed == 'True') {
            fixedAppendHTML += '<tr><td style="text-align: center;"><input type="checkbox" class="fixedTblChk"></td><td><input type="text" value="' + lineText[i].text + '" style="width:100%; border:0;" />'
                + '<input type = "hidden" value = "' + lineText[i].location + '" /></td>'
                + '<td><select style="width:100%; height:100%;  border:0;"><option value=""><option></select></td></tr>';
        } else {
            variableAppendHTML += '<tr><td style="text-align: center;"><input type="checkbox" class="variableTblChk"></td><td><input type="text" value="' + lineText[i].text + '" style="width:100%; border:0;" />'
                + '<input type = "hidden" value = "' + lineText[i].location + '" /></td>'
                + '<td><select style="width:100%; height:100%;  border:0;"><option value=""><option></select></td></tr>';
        }
    }
    $('#fixedTextResultTbl').append(fixedAppendHTML);
    $('#variableTextResultTbl').append(variableAppendHTML);
    $('#textCount').html(lineText.length);

    $('#domainChangeBtn').show();
}

//고정 가변 select 이벤트
function fvSelectEvent() {
    $('#fvSelect').change(function () {
        var selectVal = $(this).find('option:selected').val();
        if (selectVal == 'fixed') {
            $('#fixedTextResultTbl').show();
            $('#variableTextResultTbl').hide();
        } else if (selectVal == 'variable') {
            $('#fixedTextResultTbl').hide();
            $('#variableTextResultTbl').show();
        }
    });
}

// 체크박스 전체 선택 해제 이벤트
function allChk() {
    $(document).on('click', '.allChk', function () {
        if ($(this).prop("checked")) {
            $(this).parents('thead').next().find('input[type=checkbox]').prop("checked", true);
        } else {
            $(this).parents('thead').next().find('input[type=checkbox]').prop("checked", false);
        }
    })
}

// 고정&가변 변경 이벤트
function domainChange() {

    // 고정<->가변 버튼을 클릭 시 체크된 것들이 고정&가변 변경 확인 모달창 테이블로 복사
    $('#domainChangeBtn').click(function () {
        $('#variableTextConfirmTbl tbody').html('');
        $('#fixedTextConfirmTbl tbody').html('');

        $('.fixedTblChk:checked').each(function () {
            $('#fixedTextConfirmTbl tbody').append($(this).parent().parent().clone());
        })

        $('.variableTblChk:checked').each(function () {
            $('#variableTextConfirmTbl tbody').append($(this).parent().parent().clone());
        })
    });

    // 고정&가변 변경 확인 모달창에서 변경 버튼 클릭시 체크된 항목들을 fixedResultTbl, variableResultTbl 들로 이동
    $('#domainChangeOkBtn').click(function () {
        var fixedConfirmTbl, fixedResultTbl, variableConfirmTbl, variableResultTbl;

        $('#fixedTextConfirmTbl .fixedTblChk:checked').each(function () {
            fixedConfirmTbl = $(this).parents('tr').find('td:eq(1)').html();

            $('#fixedTextResultTbl .fixedTblChk:checked').each(function () {
                fixedResultTbl = $(this).parents('tr').find('td:eq(1)').html();

                if (fixedConfirmTbl == fixedResultTbl) {
                    $(this).parents('tr').remove();               
                }                     
            })

            $(this).toggleClass('fixedTblChk variableTblChk');
            $('#variableTextResultTbl tbody').append($(this).parent().parent());
        })

        $('#variableTextConfirmTbl .variableTblChk:checked').each(function () {
            variableConfirmTbl = $(this).parents('tr').find('td:eq(1)').html();

            $('#variableTextResultTbl .variableTblChk:checked').each(function () {
                variableResultTbl = $(this).parents('tr').find('td:eq(1)').html();

                if (variableConfirmTbl == variableResultTbl) {
                    $(this).parents('tr').remove();
                }
            })

            $(this).toggleClass('variableTblChk fixedTblChk');
            $('#fixedTextResultTbl tbody').append($(this).parent().parent());
        })

        $('#fixedTextResultTbl .fixedTblChk:checked').attr('checked', false);
        $('#variableTextResultTbl .variableTblChk:checked').attr('checked', false);
        $('.allChk').prop("checked", false);

        $('.close').click();
    })
}
