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

def isfloat(value):
    try:
        float(value)
        return True
    except ValueError:
        return False


def boundaryCheck(str1, str2):
    return abs(int(str1) - int(str2)) < 5


def findLabelDB(inputsid):
    sql = "SELECT SEQNUM, DATA, CLASS FROM TBL_BATCH_COLUMN_MAPPING_TRAIN "
    curs.execute(sql)
    rows = curs.fetchall()
    # {0,1,2,35,36,37} db에 위치가 일치하면 text sid와 상관없이 label 매핑
    # 위치가 일치하고 label이 여러개일 경우 랜덤 매핑
    ret = []
    for row in rows:
        if int(row[2]) != 38 and (int(row[2]) < 3 or int(row[2]) > 34):
            dbNum = str(row[1]).split(",")
            inputNum = str(inputsid).split(",")
            # 문서종류 and (Y좌표 and (X좌표 or 넓이))
            if (dbNum[0] == inputNum[0]) and (boundaryCheck(dbNum[2], inputNum[2]) and (
                    boundaryCheck(dbNum[1], inputNum[1]) or boundaryCheck(dbNum[3], inputNum[3]))):
                ret.append(row[2])
        # {3~34}위치는 상관없이 text sid가 일치하면 label 매핑
        # text sid에 여러개의 label이 매핑되있을 경우 랜덤 매핑
        elif int(row[2]) != 38:
            dbNum = str(row[1]).split(",")
            inputNum = str(inputsid).split(",")
            if dbNum[0] == inputNum[0] and dbNum[4:] == inputNum[4:]:
                ret.append(row[2])

    # 나머지 ml predict
    if not ret:
        return 38
    else:
        return int(random.sample(ret, 1)[0])


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
                inputItem['colLbl'] = findLabelDB(inputItem['mappingSid'])
                inputItem['colAccu'] = 0.99
                inputItem['sid'] = inputItem['mappingSid']
                del inputItem['mappingSid']  # column mapping에만 사용되는 가공 sid 제거

        # 전 아이템 중 엔트리 라벨 추출
        entryLabel = []
        for inputItem in inputArr:
            if 'colLbl' in inputItem:
                if bUtil.getEntryLabelYN(inputItem['colLbl']) == 'Y':
                    entryLabel.append(inputItem)

        # 전 아이템 중 엔트리 추출 후 같은 열이나 같은 행에 엔트리 라벨 검색
        for inputItem in inputArr:
            if inputItem['colLbl'] == 37:
                entLoc = inputItem['sid'].split(",")[0:4]

                for lblItem in entryLabel:
                    lblLoc = lblItem['sid'].split(",")[0:4]

                    horizItem = 0
                    horizColLbl = 0
                    vertItem = 0
                    vertColLbl = 0

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
                                shareLoc = shareItem['sid'].split(",")[0:4]
                                if shareItem['colLbl'] == 36 and (abs(int(lblLoc[1]) - int(shareLoc[1])) < 200 and -200 < int(lblLoc[2]) - int(shareLoc[2]) < 0):
                                    if inputItem['entryLbl'] == 0:
                                        inputItem['entryLbl'] = 1
                                    elif inputItem['entryLbl'] == 2:
                                        inputItem['entryLbl'] = 3

                        # NOT ENTRY Check
                        # if horizColLbl == 36 or vertColLbl == 36:
                        #     inputItem['entryLbl'] = 31

                if 'entryLbl' not in inputItem:
                    inputItem['entryLbl'] = 31

        #for item in inputArr:
        #    print(item)
        return str(inputArr)

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


def selectFormMapping(sentencesSid):
    try:
        selectFormMappingSql = "SELECT CLASS FROM TBL_FORM_MAPPING WHERE DATA = :data"
        curs.execute(selectFormMappingSql, {"data": sentencesSid})
        rows = curs.fetchall()
        return rows

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_FORM_MAPPING table select fail',
                             'error': str(e).replace("'", "").replace('"', '')}))


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


def insertBatchLearnList(docType, flag):
    try:
        selectBatchAnswerFileSql = "SELECT IMGID FROM TBL_BATCH_ANSWER_FILE WHERE FILEPATH = :filePath"
        curs.execute(selectBatchAnswerFileSql, {"filePath": re.sub(rootFilePath, "", str(sys.argv[1]))})
        rows = curs.fetchall()

        if rows:
            selectBatchLearnListSql = "SELECT * FROM TBL_BATCH_LEARN_LIST WHERE FILEPATH = :filePath"
            curs.execute(selectBatchLearnListSql, {"filePath": re.sub(rootFilePath, "", str(sys.argv[1]))})
            resList = curs.fetchall()

            if len(resList) == 0:
                insertBatchLearnListSql = "INSERT INTO TBL_BATCH_LEARN_LIST VALUES (:imgId, 'T', :filePath, :docType, sysdate)"
                curs.execute(insertBatchLearnListSql,
                             {"imgId": rows[0][0], "filePath": re.sub(rootFilePath, "", str(sys.argv[1])),
                              "docType": docType})
                conn.commit()
            elif flag == "LEARN_N" and len(resList) > 0:
                updateBatchLearnListSql = "UPDATE TBL_BATCH_LEARN_LIST SET DOCTYPE = :docType , REGDATE = SYSDATE WHERE IMGID = :imgId AND FILEPATH = :filepath"
                curs.execute(updateBatchLearnListSql,
                             {"imgId": rows[0][0], "filePath": re.sub(rootFilePath, "", str(sys.argv[1])),
                              "docType": docType})
                conn.commit()

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'TBL_BATCH_LEARN_LIST table insert',
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

if __name__ == '__main__':
    try:
        # 입력받은 파일 패스로 ocr 데이터 조회
        ocrData = selectOcrDataFromFilePath(sys.argv[1])

        # form mapping : LEARN_N, column mapping : LEARN_Y, flag 입력 파라미터
        flag = sys.argv[2]

        # ocr데이터 없을 경우 unKnown으로 처리
        obj = {}
        if len(ocrData) == 0 or 'error' in ocrData:
            obj["docCategory"] = selectDocCategory(0)
            insertBatchLearnList(obj["docCategory"]["DOCTYPE"])
            print(re.sub('None', "null", json.dumps(obj)))
            sys.exit(1)

        # ocr데이터 오타수정
        ocrData = typo(ocrData)

        # TBL_OCR_BANNED_WORD 에 WORD칼럼 배열로 전부 가져오기
        bannedWords = selectBannedWord()

        # 20180911 ocr데이터 정렬 y축 기준
        ocrData = sortArrLocation(ocrData)

        # 문장단위로 for문
        sentences = []
        for item in ocrData:
            # 문장의 앞부분이 가져올 BANNEDWORD와 일치하면 5개문장에서 제외
            isBanned = False
            for i in bannedWords:
                text = re.sub(regExp, '', item["text"])
                if text.lower().find(str(i)) != -1:
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

        #
        if flag == "LEARN_N":
            if formMappingRows:
                obj["docCategory"] = selectDocCategory(formMappingRows[0][0])
            else:
                obj["docCategory"] = selectDocCategory(0)
        elif flag == "LEARN_Y":
            # 20180911 doc type 이 1인 경우(NOT INVOICE)는 바로 리턴 EVAL 안함 1이외의 경우는 레이블 정보 추출
            if formMappingRows and formMappingRows == 1:
                obj["docCategory"] = selectDocCategory(1)
            elif formMappingRows:
                obj["data"] = eval(ocrData, formMappingRows[0][0])
                obj["docCategory"] = selectDocCategory(formMappingRows[0][0])
            else:
                obj["data"] = eval(ocrData, 0)
                obj["docCategory"] = selectDocCategory(0)

        # 20180911 TBL_FORM_MAPPING에 조회 결과가 없는경우는 insert 시 unknown으로 되는지 확인
        insertBatchLearnList(obj["docCategory"]["DOCTYPE"], flag)

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

