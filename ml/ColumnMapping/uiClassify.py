from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import numpy as np
import cx_Oracle
import sys
import os
import json
import shutil
import random
import re
import batchUtil as bUtil
import operator
import requests

id = "koreanre"
pw = "koreanre01"
sid = "koreanreocr"
# ip = "10.10.20.205"
ip = "172.16.53.145"
port = "1521"
connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

conn = cx_Oracle.connect(connInfo)
curs = conn.cursor()
# rootFilePath = 'C:/ICR/image/MIG/MIG'
regExp = "[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]"


def isfloat(value):
    try:
        float(value)
        return True
    except ValueError:
        return False


def boundaryCheck(str1, str2):
    return abs(int(str1) - int(str2)) < 15


def findLabelDB(inputsid):
    sql = "SELECT SEQNUM, DATA, CLASS FROM TBL_BATCH_COLUMN_MAPPING_TRAIN "
    curs.execute(sql)
    rows = curs.fetchall()
    result = []
    # {0,1,2,3,35,36,37,38} db에 위치가 일치하면 text sid와 상관없이 label 매핑
    # 위치가 일치하고 label이 여러개일 경우 랜덤 매핑
    ret = []
    for row in rows:
        if int(row[2]) < 4 or int(row[2]) > 34:
        #if int(row[2]) != 38 and (int(row[2]) < 4 or int(row[2]) > 34):
            dbNum = str(row[1]).split(",")
            inputNum = str(inputsid).split(",")
            # 문서종류 and (Y좌표 and (X좌표 or 넓이))
            if (dbNum[0] == inputNum[0]) and (boundaryCheck(dbNum[2], inputNum[2]) and (
                    boundaryCheck(dbNum[1], inputNum[1]) or boundaryCheck(dbNum[3], inputNum[3]))):
                ret.append(row[2])
        # {4~34}위치는 상관없이 text sid가 일치하면 label 매핑
        # text sid에 여러개의 label이 매핑되있을 경우 랜덤 매핑
        elif int(row[2]) != 38:
            dbNum = str(row[1]).split(",")
            inputNum = str(inputsid).split(",")
            if dbNum[0] == inputNum[0] and dbNum[4:] == inputNum[4:]:               
                ret.append(row[2])
        else:
            if row[1] == inputsid:
                ret.append(row[2])

    # 나머지 ml predict
    if not ret:
        result.append(-1)
        result.append(0)
        return result
    else:
        if '38' not in ret:
            result.append(int(random.sample(ret, 1)[0]))
        else:
            result.append(38)
        result.append(0.99)
        return result


def entryLabelDB(columnLabelInt):
    sqlCol = ("SELECT coltype, colnum FROM TBL_COLUMN_MAPPING_CLS ")
    curs.execute(sqlCol)
    colCls = curs.fetchall()

    sqlEnt = ("SELECT coltype, colnum FROM TBL_ENTRY_MAPPING_CLS ")
    curs.execute(sqlEnt)
    entCls = curs.fetchall()

    retEntryNo = 0
    for row in colCls:
        if str(row[1]) == str(columnLabelInt):
            col = row[0]

    for row in entCls:
        if str(row[0]) == str(col):
            retEntryNo = row[1]

    return retEntryNo


def typo(ocrData):
    for ocrItem in ocrData:

        ocrItem['originText'] = ocrItem['text']

        if (isfloat(re.sub('\ |\,|\)|\(', '', ocrItem['text']))):
            ocrItem['text'] = re.sub('\ |\,|\)|\(', '', ocrItem['text'])
        else:
            ocrItem['text'] = ocrItem['text']
        return ocrData


def eval(inputJson, docType):
    # inputArr = json.loads(inputJson.encode("ascii", "ignore").decode())
    # 20180911 수직기준으로 가까운 엔트리라벨을 체크하는데 만약 거리가 80이 넘는것만 있을경우 unknown
    # 수직 수평 조회중 our share와 PAID(100%), OSL(100%) 잡히면 PAID(Our Share), OSL(Our Share)로 변경
    # 엔트리라벨이 하나만 잡혔는데 PAID(100%), OSL(100%)일경우 y축 기준 200까지 위 x축기준 200까지를 조회 our share 가 있으면 Our share 로 변경
    inputArr = getSidParsing(getSid(inputJson), docType)

    try:
        for inputItem in inputArr:
            if 'sid' in inputItem:
                colResult = findLabelDB(inputItem['mappingSid'])
                inputItem['colLbl'] = colResult[0]
                inputItem['colAccu'] = colResult[1]

        # Azure ml 컬럼 매핑 추출
        params = {"data": json.dumps(inputArr), "type": "columnMapping"}
        response = requests.post(url='http://172.16.53.143:8888/ml/api', data=params)
        inputArr = response.json()

        # 전 아이템 중 엔트리 라벨 추출
        entryLabel = []
        for inputItem in inputArr:
            if 'colLbl' in inputItem:
                if bUtil.getEntryLabelYN(inputItem['colLbl']) == 'Y':
                    entryLabel.append(inputItem)

        # 전 아이템 중 엔트리 추출 후 같은 열이나 같은 행에 엔트리 라벨 검색
        for inputItem in inputArr:
            if inputItem['colLbl'] == 37:
                entLoc = inputItem['mappingSid'].split(",")[0:4]

                horizItem = 9999
                vertItem = 9999

                for lblItem in entryLabel:
                    lblLoc = lblItem['mappingSid'].split(",")[0:4]

                    # 같은 문서 검사
                    if entLoc[0] == lblLoc[0]:
                        # 같은 라인 검사
                        if boundaryCheck(entLoc[2], lblLoc[2]):
                            inputItem['entryLbl'] = entryLabelDB(lblItem['colLbl'])
                            horizItem = entryLabelDB(lblItem['colLbl'])

                        # 상위 해더 왼쪽 오른쪽 정렬 검사
                        # if boundaryCheck(entLoc[1], lblLoc[1]) or boundaryCheck(entLoc[3], lblLoc[3]):
                        #     inputItem['entryLbl'] = entryLabelDB(lblItem['colLbl'])
                        #     vertItem = entryLabelDB(lblItem['colLbl'])
                        #     vertColLbl = lblItem['colLbl']

                        # 20180911 수직기준으로 가까운 엔트리라벨을 체크하는데 만약 거리가 80이 넘는것만 있을경우 unknown
                        if bUtil.checkVerticalEntry(entLoc, lblLoc):
                            inputItem['entryLbl'] = entryLabelDB(lblItem['colLbl'])
                            vertItem = entryLabelDB(lblItem['colLbl'])

                        # PAID : 100% 와 Our Share 같이 있을경우 PAID(Our Share)
                        if bUtil.chekOurShareEntry(horizItem, vertItem):
                            inputItem['entryLbl'] = entryLabelDB(6)

                        # OSL : 100% 와 Our Share 같이 있을경우 OSL(Our Share)
                        if bUtil.chekOurShareEntry(horizItem, vertItem):
                            inputItem['entryLbl'] = entryLabelDB(8)

                        # 엔트리라벨이 하나만 잡혔는데 PAID(100%), OSL(100%)일경우 y축 기준 200까지 위 x축기준 200까지를 조회 our share 가 있으면 Our share 로 변경
                        if 'entryLbl' in inputItem and (inputItem['entryLbl'] == 0 or inputItem['entryLbl'] == 2):
                            for shareItem in entryLabel:
                                shareLoc = shareItem['mappingSid'].split(",")[0:4]
                                if shareItem['colLbl'] == 36 and (
                                        abs(int(lblLoc[1]) - int(shareLoc[1])) < 200 and -200 < int(lblLoc[2]) - int(
                                        shareLoc[2]) < 0):
                                    if int(inputItem['entryLbl']) == 0:
                                        inputItem['entryLbl'] = 1
                                    elif int(inputItem['entryLbl']) == 2:
                                        inputItem['entryLbl'] = 3

                        # NOT ENTRY Check
                        # if horizColLbl == 36 or vertColLbl == 36:
                        #     inputItem['entryLbl'] = 31

                if 'entryLbl' not in inputItem or int(inputItem['entryLbl']) == 30:
                    inputItem['entryLbl'] = 31

        # for item in inputArr:
        #     print(item)
        return inputArr

    except Exception as e:
        raise Exception(str(
            {'code': 500, 'message': 'column mapping predict fail', 'error': str(e).replace("'", "").replace('"', '')}))


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
            retDocSid += ',' + exportSidRows[0][0]

            # data length 에 상관없이 5회 반복 만약 data의 length가 5보다 적으면 적은 갯수만큼 ,0,0,0,0,0 입력
        if len(data) < 5:
            for i in range(len(data), 5):
                retDocSid += ',0,0,0,0,0'
        return retDocSid[1:]

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'EXPORT_SENTENCE_SID function execute fail',
                             'error': str(e).replace("'", "").replace('"', '')}))


def getSidParsing(data, docType):
    try:
        maxWidth = 0
        maxHeight = 0

        for item in data:
            loc = item["location"].split(',')

            if (int(loc[0]) + int(loc[2])) > maxWidth:
                maxWidth = int(loc[0]) + int(loc[2])
            if int(loc[1]) > maxHeight:
                maxHeight = int(loc[1])

        rateWidth = maxWidth / 2000
        rateheight = maxHeight / 2830

        for item in data:
            loc = item["location"].split(',')
            x = int(loc[0]) / rateWidth
            xlength = int(loc[2]) / rateWidth
            y = int(loc[1]) / rateheight
            item["mappingSid"] = str(docType) + "," + str(int(x)) + "," + str(int(y)) + "," + str(
                int(x + xlength)) + "," + str(item["sid"])

        return data

    except Exception as e:
        raise Exception(
            str({'code': 500, 'message': 'sid parsing fail', 'error': str(e).replace("'", "").replace('"', '')}))


def selectFormMapping(sentencesSid):
    try:
        selectFormMappingSql = "SELECT CLASS FROM TBL_FORM_MAPPING WHERE DATA = :data order by regdate desc"
        curs.execute(selectFormMappingSql, {"data": sentencesSid})
        rows = curs.fetchall()
        return rows

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_FORM_MAPPING table select fail',
                             'error': str(e).replace("'", "").replace('"', '')}))


def azureFormMapping(sentencesSid):
    try:
        #params = {"data": sentencesSid, "type": "formMapping"}
        #response = requests.post(url='http://172.16.53.143:8888/ml/api', data=params)
        #r = response.json()

        selectDocCategorySql = "SELECT SEQNUM, DOCNAME, DOCTYPE, SAMPLEIMAGEPATH FROM TBL_DOCUMENT_CATEGORY WHERE DOCTYPE = :docType"
        curs.execute(selectDocCategorySql, {"docType": "0"})
        #curs.execute(selectDocCategorySql, {"docType": r["DOCTYPE"]})
        rows = curs.fetchall()

        if rows:
            return {"SEQNUM": rows[0][0], "DOCNAME": rows[0][1], "DOCTYPE": rows[0][2], "SAMPLEIMAGEPATH": rows[0][3],
                    "DOCSCORE": "0.99"}
        else:
            return {}
    except Exception as e:
        raise Exception(
            str({'code': 500, 'message': 'azure form mapping fail', 'error': str(e).replace("'", "").replace('"', '')}))


def selectDocCategory(docType):
    try:
        selectDocCategorySql = "SELECT SEQNUM, DOCNAME, DOCTYPE, SAMPLEIMAGEPATH FROM TBL_DOCUMENT_CATEGORY WHERE DOCTYPE = :docType"
        curs.execute(selectDocCategorySql, {"docType": int(docType)})
        rows = curs.fetchall()

        if rows:
            return {"SEQNUM": rows[0][0], "DOCNAME": rows[0][1], "DOCTYPE": rows[0][2], "SAMPLEIMAGEPATH": rows[0][3],
                    "DOCSCORE": 0.99}
        else:
            return {}

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_DOCUMENT_CATEGORY table select',
                             'error': str(e).replace("'", "").replace('"', '')}))


def makeindex(location):
    temparr = location.split(",")
    for i in range(0, 5):
        if (len(temparr[0]) < 5):
            temparr[0] = '0' + temparr[0]
    return int(temparr[1] + temparr[0])


def sortArrLocation(inputArr):
    tempArr = []
    retArr = []
    for item in inputArr:
        tempArr.append((makeindex(item['location']), item))
    tempArr.sort(key=operator.itemgetter(0))
    for tempItem in tempArr:
        retArr.append(tempItem[1])
    return retArr


def colLblDefaultValue(data):
    for item in data:
        if not 'colLbl' in item:
            item['colLbl'] = 38
    return data


if __name__ == '__main__':
    try:
        # 입력받은 ocr data를 json 변환
        # ocrData = json.loads('[{"location":"1933,350,346,94","text":"SJLTRe"},{"location":"1934,524,396,28","text":"JLT Re (North America) Inc."},{"location":"1935,578,169,22","text":"United Plaza"},{"location":"1934,605,414,34","text":"30 South 17th Street, 17th Floor"},{"location":"1935,647,313,28","text":"Philadelphia, PA 19103"},{"location":"1934,717,46,22","text":"Tel:"},{"location":"2080,717,225,22","text":"+1 215 309 4500"},{"location":"119,865,466,32","text":"Korean Reinsurance Company"},{"location":"117,905,470,32","text":"80 Susong-Dong, Chongno-Gu"},{"location":"118,944,84,25","text":"Seoul"},{"location":"119,983,593,32","text":"Democratic Peoples Republic of Korea"},{"location":"1291,857,230,25","text":"Risk Reference"},{"location":"1290,897,216,25","text":"Claim Number"},{"location":"1289,936,248,25","text":"Transaction Ref."},{"location":"1288,976,239,25","text":"Your Reference"},{"location":"1288,1016,255,25","text":"Account Number"},{"location":"1291,1056,67,25","text":"Date"},{"location":"1290,1094,115,25","text":"Contact"},{"location":"1291,1174,362,32","text":"Karen.Hunter@jltre.com"},{"location":"1933,770,186,28","text":"www.jltre.com"},{"location":"1705,857,238,25","text":"E27958-2015-N"},{"location":"1705,897,296,25","text":"MCR 186098 1/15"},{"location":"1705,936,151,25","text":"10287249"},{"location":"1703,976,67,25","text":"TBA"},{"location":"1703,1016,303,25","text":"20002523/US-UWR"},{"location":"1705,1056,199,32","text":"16 April 2018"},{"location":"1681,1094,225,25","text":": Karen Hunter"},{"location":"1704,1134,257,25","text":"+1 215 309 4487"},{"location":"119,1062,292,25","text":"For the attention of:"},{"location":"119,1102,222,25","text":"Mr. Steve Choi"},{"location":"119,1387,160,25","text":"Reassured"},{"location":"118,1426,238,32","text":"Original Insured"},{"location":"119,1466,93,24","text":"Period"},{"location":"117,1506,73,31","text":"Type"},{"location":"119,1545,85,24","text":"Limits"},{"location":"119,1585,110,24","text":"Interest"},{"location":"420,1387,576,32","text":"Concord Group Insurance Companies"},{"location":"418,1426,282,25","text":"Winter Event 2015"},{"location":"419,1465,444,25","text":"01 Jan 2015 TO 01 Jan 2017"},{"location":"421,1506,125,31","text":"Property"},{"location":"421,1544,306,25","text":"USD XS"},{"location":"421,1584,399,32","text":"First Property Catastrophe"},{"location":"118,1665,2121,31","text":"highly persistent cold and snowy pattern that developed in early January and continued through March. While colder than normal conditions"},{"location":"118,1703,2184,32","text":"prevailed in the eastern U.S., the headline of the winter was the incredible snowfall totals across the Northeastern U.S. which aided the extreme"},{"location":"117,1744,67,24","text":"cold."},{"location":"119,1783,1464,32","text":"Further to the Reassureds Proof of Loss, below is the reinstatement calculation for your records:"},{"location":"119,1905,286,25","text":"Paid Loss to Cover"},{"location":"118,1947,170,25","text":"Cover Limit"},{"location":"116,1989,161,25","text":"x Premium"},{"location":"116,2031,127,25","text":"At 1000/0"},{"location":"119,2072,314,32","text":"Less Prior Payments"},{"location":"119,2114,179,25","text":"Due Hereon"},{"location":"119,2155,348,25","text":"Federal Excise Tax 1%"},{"location":"119,2197,591,32","text":"Reinstatement Premium Brokerage 5%"},{"location":"119,2238,207,25","text":"Net Premium"},{"location":"119,2321,319,32","text":"Due to you 1.0000%"},{"location":"1244,1863,69,25","text":"USD"},{"location":"1185,1989,170,30","text":"668,208.59"},{"location":"1185,2031,164,30","text":"545,562.71"},{"location":"1185,2072,170,30","text":"540,662.67"},{"location":"1223,2114,131,30","text":"4,900.04"},{"location":"1270,2155,84,25","text":"49.00"},{"location":"1252,2197,103,25","text":"245.00"},{"location":"1222,2238,132,31","text":"4,606.04"},{"location":"1269,2321,84,25","text":"46.06"},{"location":"119,2369,1521,32","text":"Please send all claims correspondence through our electronic mailbox at JLT .CLAlMS@JLTRE.com"},{"location":"913,3297,653,24","text":"JLT Re is a trading name of JLT Re (North America) Inc."}]')
        ocrData = json.loads(sys.argv[1])
        # 입력받은 파일 패스로 ocr 데이터 조회
        # ocrData = selectOcrDataFromFilePath(sys.argv[1])

        # ocr데이터 오타수정
        ocrData = typo(ocrData)

        # TBL_OCR_BANNED_WORD 에 WORD칼럼 배열로 전부 가져오기
        bannedWords = selectBannedWord()

        # 20180911 ocr데이터 정렬 y축 기준
        ocrData = sortArrLocation(ocrData)

        #bannedword에 상관없이 similar에 사용할 5개 문장 추출
        similarSentence = []
        for item in ocrData:
            similarSentence.append(item)
            if len(similarSentence) == 30:
                break

        # 문장단위로 for문
        sentences = []
        for item in ocrData:
            # 문장의 앞부분이 가져올 BANNEDWORD와 일치하면 5개문장에서 제외
            isBanned = False
            for i in bannedWords:
                text = item["text"]
                if text.lower().find(str(i)) == 0:
                    isBanned = True
                    break
            if not isBanned:
                sentences.append(item)
                if len(sentences) == 5:
                    break

                    # 최종 5개 문장이 추출되면 각문장의 단어를 TBL_OCR_SYMSPELL 에 조회후 없으면 INSERT
        insertOcrSymspell(sentences)

        # 5개문장의 SID를 EXPORT_SENTENCE_SID 함수를 통해 SID 추출
        sentencesSid = getDocSid(sentences)

        # TBL_FORM_MAPPING에 5개문장의 SID를 조회
        formMappingRows = selectFormMapping(sentencesSid)

        # Azure ML 에서 FORM DOCTYPE 추출
        azureFormMappingRows = azureFormMapping(sentencesSid)

        # TBL_DOCUMENT_SENTENCE에 5개의 문장 조회
        ratio, documentSentenceDoctype = bUtil.classifyDocument(similarSentence)

        # 20180911 doc type 이 1인 경우(NOT INVOICE)는 바로 리턴 EVAL 안함 1이외의 경우는 레이블 정보 추출
        obj = {}

        if documentSentenceDoctype and ratio > 0.3:
            obj["docCategory"] = selectDocCategory(documentSentenceDoctype)
            obj["docCategory"]["DOCSCORE"] = round(ratio,4)
        elif formMappingRows:
            obj["docCategory"] = selectDocCategory(formMappingRows[0][0])
            obj["docCategory"]["DOCSCORE"] = 0.29
        else:
            obj["docCategory"] = azureFormMappingRows
        
        # if formMappingRows and formMappingRows[0][0] == 1:
        #     obj["data"] = ocrData
        #     obj["data"] = colLblDefaultValue(obj["data"])
        # elif formMappingRows and formMappingRows[0][0] == 0:
        #     obj["data"] = ocrData
        #     obj["data"] = colLblDefaultValue(obj["data"])
        # elif formMappingRows:
        #     obj["data"] = eval(ocrData, formMappingRows[0][0])
        # elif documentSentenceDoctype and ratio > 0.5:
        #     obj["data"] = eval(ocrData, documentSentenceDoctype)
        # else:
        #     obj["data"] = eval(ocrData, azureFormMappingRows["DOCTYPE"])

        if documentSentenceDoctype and ratio > 0.3:
            if documentSentenceDoctype == 1 or documentSentenceDoctype == 0:
                obj["data"] = ocrData
                obj["data"] = colLblDefaultValue(obj["data"])
            else:
                obj["data"] = eval(ocrData, documentSentenceDoctype)
        elif formMappingRows:
            if formMappingRows[0][0] == 1 or formMappingRows[0][0] == 0:
                obj["data"] = ocrData
                obj["data"] = colLblDefaultValue(obj["data"])
            else:
                obj["data"] = eval(ocrData, formMappingRows[0][0])
        else:
            obj["data"] = eval(ocrData, azureFormMappingRows["DOCTYPE"])

        obj["docSid"] = sentencesSid

        print(re.sub('None', "null", json.dumps(obj)))

        '''
        if formMappingRows:
            if formMappingRows[0] != 1:
                print(eval(ocrData, formMappingRows[0][0]))
            else:
                print(ocrData)
        else:
            print(ocrData)
        '''

    except Exception as e:
        print(e)

