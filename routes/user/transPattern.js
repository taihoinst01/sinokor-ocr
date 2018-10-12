module.exports = {
    trans: function (reqArr) {
        
        //UY
        reqArr = convertedUY(reqArr);
        //Entry
        reqArr = convertedEntry(reqArr);
        //Our Share
        reqArr = convertedOurShare(reqArr);
        
        return reqArr;
    }
};

// UY outputs only year
function convertedUY(reqArr) {
    var pattern = /2\d\d\d/ig;

    for (var i in reqArr.data) {
        var item = reqArr.data[i];
        if (item.colLbl == 2 && pattern.test(item.text)) {
            var arr = item.text.match(pattern);
            var intArr = Math.min.apply(null, arr.map(Number));
            item.origintext = item.text;
            item.text = String(intArr);
        } else {
            //console.log("no");
        }
    }
    return reqArr;
}

function convertedEntry(reqArr) {
    var pattern = /O/gi;

    for (var i in reqArr.data) {
        var item = reqArr.data[i];
        if (item.colLbl == 37) {
            item.origintext = item.text;
            item.text = String(item.text.replace(pattern, '0'));
        } else {
            //console.log("no");
        }
    }
    return reqArr;
}

function convertedOurShare(reqArr) {
    var pattern = /[^0-9\.]+/g;

    for (var i in reqArr.data) {
        var item = reqArr.data[i];
        if ((item.colLbl == 36 || item.colLbl == 37) && pattern.test(item.text)) {
            item.origintext = item.text;
            var intArr = Number(item.text.replace(pattern, ''));
            item.text = String(intArr);
        } else {
            //console.log("no");
        }
    }
    return reqArr;
}