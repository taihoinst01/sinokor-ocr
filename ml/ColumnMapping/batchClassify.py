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


id = "koreanre5"
pw = "koreanre01"
sid = "koreanreocr5"
# ip = "10.10.20.205"
ip = "172.16.53.147"
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
                sql = "SELECT SEQNUM, DATA, CLASS FROM TBL_BATCH_COLUMN_MAPPING_TRAIN WHERE DATA = '"+ inputsid + "'"
                curs.execute(sql)
                oneRow = curs.fetchall()
                if len(oneRow) != 0:
                    ret.append(oneRow[0][2])
                else:
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
    inputArr = bUtil.getSidParsing(bUtil.getSid(inputJson), docType)

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
                vertMin = 999999

                horizItem = 9999
                vertItem = 9999

                for lblItem in entryLabel:
                    lblLoc = lblItem['sid'].split(",")[0:4]

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
                            # 수직으로 같은 라인에 entryLabel이 여러개 일경우 가장 가까운 entryLabel 검색
                            if int(entLoc[2]) - int(lblLoc[2]) > 0 and vertMin > int(entLoc[2]) - int(lblLoc[2]):
                                vertMin = int(entLoc[2]) - int(lblLoc[2])
                                inputItem['entryLbl'] = entryLabelDB(lblItem['colLbl'])
                                vertItem = entryLabelDB(lblItem['colLbl'])

                        # PAID : 100% 와 Our Share 같이 있을경우 PAID(Our Share)
                        if bUtil.chekOurShareEntry(horizItem, vertItem):
                            inputItem['entryLbl'] = entryLabelDB(6)

                        # OSL : 100% 와 Our Share 같이 있을경우 OSL(Our Share)
                        if bUtil.chekOurShareEntry(horizItem, vertItem):
                            inputItem['entryLbl'] = entryLabelDB(8)

                        # 엔트리라벨이 하나만 잡혔는데 PAID(100%), OSL(100%)일경우 y축 기준 200까지 위 x축기준 200까지를 조회 our share 가 있으면 Our share 로 변경
                        if 'entryLbl' in inputItem and (int(inputItem['entryLbl']) == 0 or int(inputItem['entryLbl']) == 2):
                            for shareItem in entryLabel:
                                shareLoc = shareItem['sid'].split(",")[0:4]
                                if int(shareItem['colLbl']) == 36 and (abs(int(lblLoc[1]) - int(shareLoc[1])) < 200 and -200 < int(shareLoc[2]) - int(lblLoc[2]) < 0 and boundaryCheck(entLoc[2], lblLoc[2])):
                                    if int(inputItem['entryLbl']) == 0:
                                        inputItem['entryLbl'] = 1
                                    elif int(inputItem['entryLbl']) == 2:
                                        inputItem['entryLbl'] = 3

                if 'entryLbl' not in inputItem or int(inputItem['entryLbl']) == 30:
                    inputItem['entryLbl'] = 31

        # for item in inputArr:
        #     print(item)
        return str(inputArr)

    except Exception as e:
        raise Exception(str(
            {'code': 500, 'message': 'column mapping predict fail', 'error': str(e).replace("'", "").replace('"', '')}))

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


if __name__ == '__main__':
    try:
        # 입력받은 파일 패스로 ocr 데이터 조회
        ocrData = bUtil.selectOcrDataFromFilePath(sys.argv[1])

        # form mapping : LEARN_N, column mapping : LEARN_Y, flag 입력 파라미터
        flag = sys.argv[2]

        # ocr데이터 없을 경우 unKnown으로 처리
        obj = {}
        if len(ocrData) == 0 or 'error' in ocrData:
            obj["docCategory"] = bUtil.selectDocCategory(0)
            insertBatchLearnList(obj["docCategory"]["DOCTYPE"], flag)
            print(re.sub('None', "null", json.dumps(obj)))
            sys.exit(1)

        # ocr데이터 오타수정
        ocrData = typo(ocrData)

        # TBL_OCR_BANNED_WORD 에 WORD칼럼 배열로 전부 가져오기
        bannedWords = bUtil.selectBannedWord()

        # 20180911 ocr데이터 정렬 y축 기준
        ocrData = bUtil.sortArrLocation(ocrData)

        # 문장단위로 for문
        sentences = bUtil.appendSentences(ocrData, bannedWords)

        #bannedword에 상관없이 similar에 사용할 5개 문장 추출
        similarSentence = []
        for item in ocrData:
            similarSentence.append(item)
            if len(similarSentence) == 5:
                break

        if flag == "LEARN_N":
            # 5개 문장으로 DB와 일치하는 notInvoice 확률 측정
            ratio, notInvoiceData = bUtil.classifyDocument(similarSentence)

            # notInvoice 확률이 0.5 이상일경우 notInvoice로 doctype변경후 종료
            if ratio > 0.5 and notInvoiceData == "1":
                obj["docCategory"] = bUtil.selectDocCategory(notInvoiceData)
                insertBatchLearnList(obj["docCategory"]["DOCTYPE"], flag)
                print(re.sub('None', "null", json.dumps(obj)))
                sys.exit(1)

        # 최종 5개 문장이 추출되면 각문장의 단어를 TBL_OCR_SYMSPELL 에 조회후 없으면 INSERT
        bUtil.insertOcrSymspell(sentences)

        # 5개문장의 SID를 EXPORT_SENTENCE_SID 함수를 통해 SID 추출
        sentencesSid = bUtil.getDocSid(sentences)

        # TBL_FORM_MAPPING에 5개문장의 SID를 조회
        if flag == "LEARN_N":
            formMappingRows = bUtil.selectFormMapping(sentencesSid)

            if len(formMappingRows) == 0:
                ratio, doctype = bUtil.classifyDocument(similarSentence)
                formMappingRows = []
                docrow = []
                docrow.append(doctype)
                formMappingRows.append(docrow)
        elif flag == "LEARN_Y":
            # after training 에서 batchLearnList doctype 가져옴
            formMappingRows = bUtil.selectBatchLearnList(re.sub(rootFilePath, "", str(sys.argv[1])))

        # ocr Contract mapping
        ocrData = bUtil.selectContractMapping(ocrData)

        #flag가 LEARN_N 일경우 문서 종류만 분류 Y일경우 columnmapping
        if flag == "LEARN_N":
            if formMappingRows:
                obj["docCategory"] = bUtil.selectDocCategory(formMappingRows[0][0])
            else:
                obj["docCategory"] = bUtil.selectDocCategory(0)
        elif flag == "LEARN_Y":
            # 20180911 doc type 이 1인 경우(NOT INVOICE)는 바로 리턴 EVAL 안함 1이외의 경우는 레이블 정보 추출
            if formMappingRows and formMappingRows == 1:
                obj["docCategory"] = bUtil.selectDocCategory(1)
            elif formMappingRows:
                obj["data"] = eval(ocrData, formMappingRows[0][0])
                obj["docCategory"] = bUtil.selectDocCategory(formMappingRows[0][0])
            else:
                obj["data"] = eval(ocrData, 0)
                obj["docCategory"] = bUtil.selectDocCategory(0)

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

