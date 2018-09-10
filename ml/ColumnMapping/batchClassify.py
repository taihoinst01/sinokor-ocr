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

id = "koreanre"
pw = "koreanre01"
sid = "koreanreocr"
# ip = "10.10.20.205"
ip = "172.16.53.142"
port = "1521"
connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

conn = cx_Oracle.connect(connInfo)
curs = conn.cursor()

sql = "SELECT SEQNUM, DATA, CLASS FROM TBL_BATCH_COLUMN_MAPPING_TRAIN "
curs.execute(sql)
rows = curs.fetchall()

def isfloat(value):
  try:
    float(value)
    return True
  except ValueError:
    return False

def boundaryCheck(str1, str2):
    return abs(int(str1) - int(str2)) < 5

def findLabelDB(rows, inputsid):
    # {0,1,2,35,36,37} db에 위치가 일치하면 text sid와 상관없이 label 매핑
    # 위치가 일치하고 label이 여러개일 경우 랜덤 매핑
    ret = []
    for row in rows:
        if int(row[2]) != 38 and (int(row[2]) < 3 or int(row[2]) > 34):
            dbNum = str(row[1]).split(",")
            inputNum = str(inputsid).split(",")
            # 문서종류 and (Y좌표 and (X좌표 or 넓이))
            if (dbNum[0] == inputNum[0]) and (boundaryCheck(dbNum[2], inputNum[2]) and (boundaryCheck(dbNum[1], inputNum[1]) or boundaryCheck(dbNum[3], inputNum[3]))):
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

def eval(inputJson):
    inputArr = json.loads(inputJson.encode("ascii", "ignore").decode())

    try:
        for inputItem in inputArr:
            if 'sid' in inputItem:
                inputItem['colLbl'] = findLabelDB(rows, inputItem['sid'])
                inputItem['colAccu'] = 0.99

        #전 아이템 중 엔트리 라벨 추출
        entryLabel = []
        for inputItem in inputArr:
            if 'colLbl' in inputItem:
                if inputItem['colLbl'] >= 5 and inputItem['colLbl'] <= 34:
                    entryLabel.append(inputItem)

        #전 아이템 중 엔트리 추출 후 같은 열이나 같은 행에 엔트리 라벨 검색
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
                            horizColLbl = lblItem['colLbl']

                        #상위 해더 왼쪽 오른쪽 정렬 검사
                        if boundaryCheck(entLoc[1], lblLoc[1]) or boundaryCheck(entLoc[3], lblLoc[3]):
                            inputItem['entryLbl'] = entryLabelDB(lblItem['colLbl'])
                            vertItem = entryLabelDB(lblItem['colLbl'])
                            vertColLbl = lblItem['colLbl']

                        # PAID : 100% 와 Our Share 같이 있을경우 Our Share
                        if (horizItem == 0 and vertItem == 1) or (horizItem == 1 and vertItem == 0):
                            inputItem['entryLbl'] = 1
                        # OSL : 100% 와 Our Share 같이 있을경우 Our Share
                        if (horizItem == 2 and vertItem == 3) or (horizItem == 3 and vertItem == 2):
                            inputItem['entryLbl'] = 3

                        # NOT ENTRY Check
                        if horizColLbl == 36 or vertColLbl == 36:
                            inputItem['entryLbl'] = 30

                if 'entryLbl' not in inputItem:
                        inputItem['entryLbl'] = 30

        # for item in inputArr:
        #     print(item)
        print(str(inputArr))

    except Exception as e:
        print(str({'code': 500, 'message': 'column mapping predict fail', 'error': str(e).replace("'","").replace('"','')}))

if __name__ == '__main__':
    # 입력받은 파일 패스로 ocr 데이터 조회
    ocrSql = "SELECT OCRDATA FROM TBL_BATCH_OCR_DATA WHERE FILEPATH = :filepath"
    curs.execute(ocrSql, {"filepath": sys.argv[1]})
    ocrRows = curs.fetchall()

    if ocrRows:
        ocrData = json.loads(ocrRows[0][0])

    # ocr데이터 오타수정
    ocrData = typo(ocrData)

    # 문서 분류를 위해 ocr데이터 중 상위 5개 문장 sid로 전환 후 조회

    # 문장단위로 for문
    # TBL_OCR_BANNED_WORD 에 WORD칼럼 배열로 전부 가져오기
    # 문장의 앞부분이 가져올 BANNEDWORD와 일치하면 5개문장에서 제외
    # 최종 5개 문장이 추출되면 각문장의 단어를 TBL_OCR_SYMSPELL 에 조회후 없으면 INSERT
    # 5개문장의 SID를 EXPORT_SENTENCE_SID 함수를 통해 SID 추출

    #TBL_FORM_MAPPING에 5개문장의 SID를 조회

    # doc type 이 1인 경우는 바로 리턴 1이외의 경우는 레이블 정보 추출
    #eval(ocrData)

