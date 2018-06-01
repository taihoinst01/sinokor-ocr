var lineText = []; // OCR 텍스트 가공 배열

$(function () {
    uploadBtnEvent(); // 업로드시 미리보기 이벤트
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
    var params = {
        "language": "unk",
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
        ocrData2Array(data.regions);
        //mlPrediction();
        appendText(data.regions);
    }).fail(function (err) {
        console.log(err);
    });
}

// ocr data 라인 단위로 배열 저장하는 함수
function ocrData2Array(regions) {
    lineText = [];
    for (var i = 0; i < regions.length; i++) {
        for (var j = 0; j < regions[i].lines.length; j++) {
            var item = '';
            for (var k = 0; k < regions[i].lines[j].words.length; k++) {
                item += regions[i].lines[j].words[k].text + ' ';
            }
            lineText.push({ 'location': regions[i].lines[j].boundingBox, 'text': item });
        }
    }
}

// 머신러닝 오타체크, 문서 예측 함수
function mlPrediction() {

}

// 테이블 html 추가 함수
function appendText(regions) {
    $('#textCount').html('');

    var appendHTML = '';
    appendHTML += '<tr><th style="text-align:center;">목록</th><th style="text-align:center;">DB 컬럼</th></tr>';
    for (var i = 0; i < lineText.length; i++) {
        appendHTML += '<tr><td><input type="text" value="' + lineText[i].text + '" style="width:100%; border:0;" />'
        + '<input type = "hidden" value = "' + lineText[i].location + '" /></td>'
            + '<td><select style="width:100%; height:100%;  border:0;"><option value=""><option></select></td></tr>';
    }
    $('#textResultTbl').append(appendHTML);
    $('#textCount').html(lineText.length);
}