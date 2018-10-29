import cx_Oracle
import json
import operator
import re
from difflib import SequenceMatcher

id = "koreanre"
pw = "koreanre01"
sid = "koreanreocr"
# ip = "10.10.20.205"
ip = "172.16.53.145"
port = "1521"
connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

conn = cx_Oracle.connect(connInfo)
curs = conn.cursor()
rootFilePath = 'C:/ICR/image/MIG/MIG'
regExp = "[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]"

def getColumnMappingCls():
    try:
        sql = 'SELECT COLNAME, COLTYPE, COLNUM, POSITIONYN, ENTRYLABELYN FROM TBL_COLUMN_MAPPING_CLS'
        curs.execute(sql)
        colCls = curs.fetchall()

        return colCls

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'getEntryLabelYN table select fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def getEntryLabelYN(colNum):
    try:
        sql = 'SELECT COLNAME, COLTYPE, COLNUM, POSITIONYN, ENTRYLABELYN FROM TBL_COLUMN_MAPPING_CLS WHERE COLNUM = :colNum'
        curs.execute(sql, {"colNum":colNum})
        entryLabelYN = curs.fetchall()

        return entryLabelYN[0][4]

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'getEntryLabelYN table select fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def checkVerticalEntry(entLoc, lblLoc):
    try:
        lblwidthLoc = (int(lblLoc[3]) + int(lblLoc[1])) / 2
        entwidthLoc = (int(entLoc[3]) + int(entLoc[1])) / 2
        # entryLabel이 오른쪽에서 가까울 경우 제외
        if -50 < entwidthLoc - lblwidthLoc < 160:
            return True
        else:
            return False

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'checkVerticalEntry fail',
                         'error': str(e).replace("'", "").replace('"', '')}))

def chekOurShareEntry(horizItem, vertItem):
    try:

        if (int(horizItem) == 0 and int(vertItem) == 30) or (int(horizItem) == 30 and int(vertItem) == 0):
            return True
        elif (int(horizItem) == 2 and int(vertItem) == 30) or (int(horizItem) == 30 and int(vertItem) == 2):
            return True
        else:
            return False

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'chekOurShareEntry fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def selectContractMapping(ocrData):
    try:
        selectContractMappingSql = "SELECT asOgcompanyName legacy FROM tbl_contract_mapping WHERE extOgcompanyName = :extOgcompanyName"
        for idx, item in enumerate(ocrData):
            curs.execute(selectContractMappingSql, {"extOgcompanyName": item["text"]})
            rows = curs.fetchall()
            if rows:
                ocrData[idx]["text"] = rows[0][0]

        return ocrData
    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_CONTRACT_MAPPING table select',
                             'error': str(e).replace("'", "").replace('"', '')}))

def appendSentences(ocrData, bannedWords):
    sentences = []
    for item in ocrData:
        # 문장의 앞부분이 가져올 BANNEDWORD와 일치하면 5개문장에서 제외
        isBanned = False
        text = item["text"]
        for i in bannedWords:
            if text.lower().find(str(i)) == 0:
                isBanned = True
                break
        if not isBanned:
            sentences.append(item)
            if len(sentences) == 5:
                break

    return sentences

def selectDocCategory(docType):
    try:
        selectDocCategorySql = "SELECT SEQNUM, DOCNAME, DOCTYPE, SAMPLEIMAGEPATH FROM TBL_DOCUMENT_CATEGORY WHERE DOCTYPE = :docType"
        curs.execute(selectDocCategorySql, {"docType": int(docType)})
        rows = curs.fetchall()

        if rows:
            return {"SEQNUM": rows[0][0], "DOCNAME": rows[0][1], "DOCTYPE": rows[0][2], "SAMPLEIMAGEPATH": rows[0][3]}
        else:
            return {}

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_DOCUMENT_CATEGORY table select',
                             'error': str(e).replace("'", "").replace('"', '')}))

def selectFormMapping(sentencesSid):
    try:
        selectFormMappingSql = "SELECT CLASS FROM TBL_FORM_MAPPING WHERE DATA = :data"
        curs.execute(selectFormMappingSql, {"data": sentencesSid})
        rows = curs.fetchall()
        return rows

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_FORM_MAPPING table select fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def getSidParsing(data, docType):
    try:
        for item in data:
            loc = item["location"].split(',')
            item["mappingSid"] = str(docType) + "," + str(loc[0]) + "," + str(loc[1]) + "," + str(
                int(loc[0]) + int(loc[2])) + "," + str(item["sid"])

        return data

    except Exception as e:
        raise Exception(
            str({'code': 500, 'message': 'sid parsing fail', 'error': str(e).replace("'", "").replace('"', '')}))

def getDocSid(data):
    try:
        selectExportSidSql = "SELECT EXPORT_SENTENCE_SID (LOWER(:sentence)) AS SID FROM DUAL"
        retDocSid = ''

        for sentence in data:
            tempstr = re.sub(regExp, '', sentence["text"])

            if not tempstr:
                tempstr = ' '

            curs.execute(selectExportSidSql, {"sentence": tempstr})
            exportSidRows = curs.fetchall()
            retDocSid += exportSidRows[0][0] + ","

        retDocSid = retDocSid[:-1]
        # data length 에 상관없이 5회 반복 만약 data의 length가 5보다 적으면 적은 갯수만큼 ,0,0,0,0,0 입력
        if len(data) < 5:
            for i in range(len(data) + 1, 5):
                retDocSid += ',0,0,0,0,0'
        return retDocSid

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'EXPORT_SENTENCE_SID function execute fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def getSid(data):
    try:
        selectExportSidSql = "SELECT EXPORT_SENTENCE_SID (LOWER(:sentence)) AS SID FROM DUAL"
        for item in data:
            text = re.sub(regExp, '', item["text"])
            curs.execute(selectExportSidSql, {"sentence": text})
            exportSidRows = curs.fetchall()
            item["sid"] = exportSidRows[0][0]

        return data

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'EXPORT_SENTENCE_SID2 function execute fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def insertOcrSymspell(sentences):
    try:
        for sentence in sentences:
            words = sentence["text"].split(' ')
            for word in words:
                tempstr = word
                if tempstr:
                    selectSymspellSql = "SELECT COUNT(SEQNUM) FROM TBL_OCR_SYMSPELL WHERE KEYWORD = LOWER(:keyword)"
                    curs.execute(selectSymspellSql, {"keyword": tempstr})
                    symspellRows = curs.fetchall()
                    if symspellRows[0] == 0:
                        insertSymspellSql = "INSERT INTO TBL_OCR_SYMSPELL VALUES (SEQ_OCR_SYMSPELL.nextval, LOWER(:keyword), 1)"
                        curs.execute(insertSymspellSql, {"keyword": tempstr})
        conn.commit()

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_OCR_SYMSPELL table insert fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def selectBannedWord():
    returnData = []
    try:
        selectBannedWordSql = "SELECT WORD FROM TBL_BANNED_WORD"
        curs.execute(selectBannedWordSql)
        rows = curs.fetchall()
        if rows:
            for row in rows:
                returnData.append(row[0])

        return returnData

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_BANNED_WORD table select fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def selectOcrDataFromFilePath(filepath):
    try:
        selectocrDataSql = "SELECT OCRDATA FROM TBL_BATCH_OCR_DATA WHERE FILEPATH = :filepath"
        curs.execute(selectocrDataSql, {"filepath": filepath})
        rows = curs.fetchall()

        if rows:
            return json.loads(rows[0][0])
        else:
            raise Exception('row for file path does not exist')

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_BATCH_OCR_DATA table select fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def makeindex(location):
    if len(location) > 0:
        temparr = location.split(",")
        for i in range(0, 5):
            if (len(temparr[0]) < 5):
                temparr[0] = '0' + temparr[0]
        return int(temparr[1] + temparr[0])
    else:
        return 999999999999

def sortArrLocation(inputArr):
    tempArr = []
    retArr = []
    for item in inputArr:
        tempArr.append((makeindex(item['location']), item))
    tempArr.sort(key=operator.itemgetter(0))
    for tempItem in tempArr:
        retArr.append(tempItem[1])
    return retArr

def selectBatchLearnList(filepath):
    try:
        selectFormMappingSql = "SELECT DOCTYPE FROM TBL_BATCH_LEARN_LIST WHERE FILEPATH = :filepath"
        curs.execute(selectFormMappingSql, {"filepath": filepath})
        rows = curs.fetchall()
        return rows

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_BATCH_LEARN_LIST table select fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()

def selectNotInvoice(sentences):
    try:
        text = ''
        for item in sentences:
            text += item["text"] + ","
        text = text[:-1].lower()

        selectNoInvoiceSql = "SELECT DATA,DOCTYPE FROM TBL_NOTINVOICE_DATA"
        curs.execute(selectNoInvoiceSql)
        selNotInvoice = curs.fetchall()

        for rows in selNotInvoice:
            ratio = similar(text, rows[0])
            if ratio > 0.9:
                return ratio, rows

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_NOTINVOICE_DATA table select fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def classifyDocument(sentences):
    try:
        text = ''
        for item in sentences:
            text += item["text"] + ","
        text = text[:-1].lower()

        selectDocumentSql = "SELECT DATA, DOCTYPE FROM TBL_DOCUMENT_SENTENCE"
        curs.execute(selectDocumentSql)
        selDocument = curs.fetchall()

        maxNum = 0
        row = ''

        for rows in selDocument:
            ratio = similar(text, rows[0])
            if ratio > maxNum:
                maxNum = ratio
                row = rows[1]

        if maxNum > 0.3:
            return maxNum, row
        else:
            return '',''

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_NOTINVOICE_DATA table select fail', 'error': str(e).replace("'", "").replace('"', '')}))