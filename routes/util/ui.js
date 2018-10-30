var fs = require('fs');
var PythonShell = require('python-shell')
var sync = require('./sync.js')
var appRoot = require('app-root-path').path;
var dbConfig = require(appRoot + '/config/dbConfig');
var oracle = require('./oracle.js');
const oracledb = require('oracledb');
var async = require('async');
var execSync = require('child_process').execSync;
var pythonConfig = require(appRoot + '/config/pythonConfig');
var propertiesConfig = require(appRoot + '/config/propertiesConfig');

exports.insertDoctypeMapping = function (req, done) {
    try {
        sync.fiber(function () {
            var result = sync.await(insertDoctypeMapping(req, sync.defer()));
            return done(null, result);
        });
    } catch (e) {
        console.log(e);
        return done(null, null);
    }
};

function insertDoctypeMapping(req, done) {
    sync.fiber(function () {
        try {
            var data = req;
            var similarSentences = [];
            var topSentenses = [];
            var docType;
            var docSid;
            var convertedFilepath;


            for (var i in data.textList) {
                if (data.textList[i].check == 1) {
                    similarSentences.push(data.textList[i]);
                }

                if (topSentenses.length < 5) {
                    data.textList[i] = insertSymspell(data.textList[i]);
                    topSentenses.push(data.textList[i]);
                }
            }

            data = getSentenceSid(data);
            docSid = getDocSid(topSentenses);

            //20180911 신규문서일 경우
            if (data.radioType == '2') {
                //20180911 기존 문서양식중 max doctype값 가져오기
                //20180911 TBL_DOCUMENT_CATEGORY테이블에 가져온 신규문서 양식명을 insert
                docType = insertDocCategory(data);

                //20180911 기존 이미지 파일을 C://ICR/sampleDocImage 폴더에 DocType(숫자).jpg로 저장
                convertedFilepath = copyFile(data.filepath, docType);

                //20180911 TBL_FORM_MAPPING 에 5개문장의 sid 와 doctype값 insert
                insertFormMapping(topSentenses, docType);
                insertDocumentSentence(similarSentences, docType, similarSentences.length);
            } else if (data.radioType == '1') {
                docType = selectDocCategoryFromDocName(data);
                insertFormMapping(topSentenses, docType);
                insertDocumentSentence(similarSentences, docType, similarSentences.length);
            } else {
                docType = selectDocCategoryFromDocName(data);
                insertFormMapping(topSentenses, docType);
                insertDocumentSentence(similarSentences, docType, similarSentences.length);
            }

            return done(null, [docType, docSid]);
        } catch (e) {
            console.log(e);
            return done(null, e);
        }
    });
}

/*
function insertDoctypeMapping(req, done) {
    
    sync.fiber(function () {
        try {
            var retData = {};
            var data = req;
            let topSentenses = []; // 문서판별을 위한 문장
            var similarSentences = [];
            var docType;
            var docSid;
            var convertedFilepath;
            var bannedWord;
            //20180910 hskim 문서양식 매핑
            bannedWord = selectBannedWord();
            //문장을 순서대로 for문
            for (var i in data.textList) {
                //console.log(data.textList[i]);

                //앞 문장이 bannedword에 포함 되어 있는지 여부 확인
                var bannedCheck = true;
                for (var j in bannedWord) {
                    if (data.textList[i].text.toLowerCase().indexOf(bannedWord[j].WORD) == 0) {
                        bannedCheck = false;
                        break;
                    }
                }

                if (data.textList[i].check == 0) {
                    //맨 앞 단어가 bannedWord에 포함하지 않을 경우만 topSentenses에 push
                    //문장 index가 0인 경우 sentenses.append, sentenses length가 5가 되면 for문 종료
                    if (bannedCheck) {
                        topSentenses.push(data.textList[i]);

                        //문장 index가 0인 경우 문장을 symspell에 등록 안된 단어 있는지 확인 후 없을 경우 insert
                        data.textList[i] = insertSymspell(data.textList[i]);
                    }
                    if (topSentenses.length >= 5) break;

                } else if (data.textList[i].check == 1) {
                    //문장 index가 1인 경우 문장의 첫부분을 TBL_OCR_BANNED_WORD 에 insert
                    //var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
                    //특수문자를 공백으로 치환하고 공백으로 슬라이스 후 배열의 첫번째 값을 banned_word에 insert
                    if (bannedCheck) {
                        data.textList[i] = insertBannedWord(data.textList[i]);
                    }
                }
            }

            for (var i in data.textList) {
                similarSentences.push(data.textList[i]);
                if (similarSentences.length >= 30) break;
            }

            //20180911 가져온 문장의 sid EXPORT_SENTENCE_SID함수를 통해 추출
            data = getSentenceSid(data);
            docSid = getDocSid(topSentenses);
            //20180911 신규문서일 경우
            if (data.radioType == '2') {
                //20180911 기존 문서양식중 max doctype값 가져오기
                //20180911 TBL_DOCUMENT_CATEGORY테이블에 가져온 신규문서 양식명을 insert
                docType = insertDocCategory(data);

                //20180911 기존 이미지 파일을 C://ICR/sampleDocImage 폴더에 DocType(숫자).jpg로 저장
                convertedFilepath = copyFile(data.filepath, docType);

                //20180911 TBL_FORM_MAPPING 에 5개문장의 sid 와 doctype값 insert
                insertFormMapping(topSentenses, docType);
                insertDocumentSentence(similarSentences, docType);
            } else if (data.radioType == '1') {
                docType = selectDocCategoryFromDocName(data);
                insertFormMapping(topSentenses, docType);
                insertDocumentSentence(similarSentences, docType);
            } else {
                docType = selectDocCategoryFromDocName(data);
                insertFormMapping(topSentenses, docType);
                insertDocumentSentence(similarSentences, docType);
            }

            return done(null, [docType, docSid]);
        } catch (e) {
            console.log(e);
            return done(null, e);
        }
    });
    
}
*/


function insertSymspell(item) {    
    var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
    item.text = item.text.replace(regExp, '');

    try {
        sync.await(oracle.insertOcrSymsDoc(item, sync.defer()));

        return item
    } catch(e){
        throw e;
    }   
}

function selectBannedWord() {
    try {
        let item = sync.await(oracle.selectBannedWord(sync.defer()));

        return item
    } catch (e) {
        throw e;
    }
}

function insertBannedWord(item) {
    //var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
    try {
        //item.text = item.text.replace(regExp, '');

        if (item.text.split(' ').length > 0) {
            sync.await(oracle.insertBannedWord(item, sync.defer()));
        }

        return item;
    } catch (e) {
        throw e;
    }
}

function getSentenceSid(data) {
    try {
        for (var i in data.textList) {
            data.textList[i].sid = sync.await(oracle.selectOriginSid(data.textList[i], sync.defer()));
        }

        return data;
    } catch (e) {
        throw e;
    }
}

function insertDocCategory(data) {
    try {
        var docType = sync.await(oracle.insertDocCategory([data.docName, data.filepath], sync.defer()));

        return docType;
    } catch (e) {
        throw e;
    }
}

function selectDocCategoryFromDocName(data) {
    try {
        var docType = sync.await(oracle.selectDocCategoryFromDocName([data.docName], sync.defer()));

        return docType;
    } catch (e) {
        throw e;
    }
}

function copyFile(src, docType) {
    var convertedFilepath = propertiesConfig.filepath.docFilePath;
    try {
        if (!fs.existsSync(src)) {
            throw new Error('file not exist');
        }
        var data = fs.readFileSync(src, 'utf-8');
        try {
            fs.mkdirSync(convertedFilepath);
        } catch (e) {
            if (e.code != 'EEXIST') throw e;
        }
        execSync('module\\imageMagick\\convert.exe -density 800x800 "' + src + '" ' + (convertedFilepath + '/' + docType + '.jpg'));
        sync.await(oracle.updateDocCategoryToFilePath(['/' + (convertedFilepath.split('/')[2] + '/' + docType + '.jpg'), docType], sync.defer()));

        return (convertedFilepath + '/' + docType + '.jpg');
    } catch (e) {
        throw e;
    }
}

function getDocSid(topSentenses) {
    try {
        var formsid = '';
        for (var i = 0; i < 5; i++) {
            if (i < topSentenses.length) {
                formsid += topSentenses[i].sid + ',';
            } else {
                formsid += '0,0,0,0,0,';
            }
        }

        return formsid.slice(0, -1);

    } catch (e) {
        throw e;
    }

}

function insertFormMapping(topSentenses, docType) {
    try {
        var formsid = '';
        for (var i = 0; i < 5; i++) {
            if (i < topSentenses.length) {
                formsid += topSentenses[i].sid + ',';
            } else {
                formsid +=  '0,0,0,0,0,';
            }
        }

        sync.await(oracle.insertFormMapping([formsid.slice(0, -1), docType], sync.defer()));

    } catch (e) {
        throw e;
    }
}

function insertNotInvoce(topSentenses, docType) {
    try {
        var text = "";
        for (var i in topSentenses) {
            text += topSentenses[i].text + ",";
        }
        sync.await(oracle.insertNotInvoce([text.slice(0, -1), docType], sync.defer()));
    } catch (e) {
        throw e;
    }
}

function insertDocumentSentence(topSentenses, docType, length) {
    try {
        var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
        var text = "";
        for (var i in topSentenses) {
            text += topSentenses[i].text.replace(regExp,'') + ",";
        }
        sync.await(oracle.insertDocumentSentence([text.slice(0, -1), docType, length], sync.defer()));
    } catch (e) {
        throw e;
    }
}

function updateBatchLearnList(data, docType) {
    try {
        sync.await(oracle.updateBatchLearnList([docType, data.imgId, data.filepath], sync.defer()));

    } catch (e) {
        throw e;
    }
}

