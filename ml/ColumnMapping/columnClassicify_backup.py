from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import tensorflow as tf
import numpy as np
import cx_Oracle
import configparser
import sys
import os
import json
import shutil
import math

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.logging.set_verbosity(tf.logging.ERROR)
checkpointDir = 'C:\\Users\\user\\PycharmProjects\\typosentence\\checkpoint'
#checkpointDir = 'C:\\projectWork\\koreanre2\\ColumnMapping\\checkpoint'
feature_columns = [tf.contrib.layers.real_valued_column("", dimension=6)]
classifier = tf.contrib.learn.DNNClassifier(feature_columns=feature_columns, hidden_units=[10, 20, 10],
                                            n_classes=40, model_dir=checkpointDir)

def training():
    id = "koreanre"
    pw = "koreanre01"
    sid = "koreanreocr"
    # ip = "10.10.20.205"
    ip = "172.16.53.142"
    port = "1521"
    connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

    conn = cx_Oracle.connect(connInfo)
    curs = conn.cursor()
    sql = ("SELECT SEQNUM, DATA, CLASS FROM TBL_COLUMN_MAPPING_TRAIN ")
    curs.execute(sql)
    rows = curs.fetchall()

    dbData = []
    dbDataLabel = []

    for row in rows:
        floatArr = []
        num = str(row[1]).split(",")
        for n in num:
            floatArr.append(float(n))

        dbData.append(floatArr)
        dbDataLabel.append(int(row[2]))

    testNpData = np.array(dbData)
    testNpTarget = np.array(dbDataLabel)

    try:
        if not os.path.isdir(checkpointDir):
            os.mkdir(checkpointDir)
        else:
            shutil.rmtree(checkpointDir, False)

        classifier.fit(x=testNpData, y=testNpTarget, steps=2000)

        print(str({'code': 200, 'message': 'column mapping train success'}))
    except Exception as e:
        print(str({'code': 500, 'message': 'column mapping train fail', 'error': str(e).replace("'","").replace('"','')}))

def eval(inputJson):
    inputArr = json.loads(inputJson.encode("ascii", "ignore").decode())

    id = "koreanre"
    pw = "koreanre01"
    sid = "koreanreocr"
    # ip = "10.10.20.205"
    ip = "172.16.53.142"
    port = "1521"
    connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

    conn = cx_Oracle.connect(connInfo)
    curs = conn.cursor()

    sql = "SELECT SEQNUM, DATA, CLASS FROM TBL_COLUMN_MAPPING_TRAIN ORDER BY REGDATE"
    curs.execute(sql)
    rows = curs.fetchall()

    sqlCol = ("SELECT coltype, colnum FROM TBL_COLUMN_MAPPING_CLS ")
    curs.execute(sqlCol)
    colCls = curs.fetchall()

    sqlEnt = ("SELECT coltype, colnum FROM TBL_ENTRY_MAPPING_CLS ")
    curs.execute(sqlEnt)
    entCls = curs.fetchall()


    try:
        for inputItem in inputArr:
            predictArr = []
            predictData = []

            if 'sid' in inputItem:
                for sidItem in inputItem['sid'].split(","):
                    predictData.append(float(sidItem))

                # db에 일치하는 sid가 있는 경우 db의 label값을 가져와서 리턴
                for row in rows:
                    floatArr = []
                    num = str(row[1]).split(",")
                    for n in num:
                        floatArr.append(float(n))
                    if floatArr == predictData:
                        inputItem['colLbl'] = int(row[2])
                        inputItem['colAccu'] = 0.99
                # db에 일치하는 sid가 없을 경우 ML predict 결과를 리턴
                if 'colLbl' not in inputItem:
                    predictArr.append(predictData)
                    resultArr = list(classifier.predict(np.array(predictArr, dtype=np.float32), as_iterable=True))
                    inputItem['colLbl'] = resultArr[0]
                    accLabel = []
                    accLabel.append(int(resultArr[0]))
                    accTarget = np.array(accLabel)
                    accuracy_score = classifier.evaluate(x=np.array(predictArr, dtype=float), y=np.array(accTarget, dtype=int))["accuracy"]
                    if accuracy_score > 0.02:
                        accuracy_score -= 0.01
                    inputItem['colAccu'] = accuracy_score

        #inputArr에서 colLbl 이 entry인 것과 entry 라벨(colLbl이 6~36)을 추출
        #각entry 왼쪽끝 오른쪽 끝 중심 어느것이든 일치(+-5)하는 라벨이 있으면 선택
        #not entry와 중복되면 not entry를 선택
        #일치가 없으면 가까운 엔트리(not entry제외)를 선택하게 함
        #inputItem['entryLbl'] 값은 TBL_ENTRY_MAPPING_CLS column값



        # text = '[{"colAccu": 0.99, "originText": "cedant", "sid": "206,848,64626,0,0,0,0", "location": "206,848,111,24", "colLbl": 36, "text": "pedant"}, {"colAccu": 0.99, "originText": "class of business", "sid": "206,908,14818,14456,14525,0,0", "location": "206,908,285,24", "colLbl": 36, "text": "class of business"}, {"colAccu": 0.99, "originText": "our reference", "sid": "206,1066,14498,15089,0,0,0 ", "location": "206,1066,227,24", "colLbl": 36, "text": "our reference"}, {"colAccu": 0.99, "originText": "currency", "sid": "226,1174,16280,0,0,0,0", "location": "226,1174,145,31", "colLbl": 36, "text": "currency"}, {"colAccu": 0.99, "originText": "premium", "sid": "227,1243,16438,0,0,0,0", "location": " 227,1243,139,24", "colLbl": 20, "text": "premium"}, {"colAccu": 0.99, "originText": "commission", "sid": "226,1303,15444,0,0,0,0", "location": "226,1303,197,24", "colLbl": 22, " text": "commission"}, {"colAccu": 0.99, "originText": "claims", "sid": "226,1366,16527,0,0,0,0", "location": "226,1366,107,24", "colLbl": 23, "text": "claim s"}, {"colAccu": 0.99, "originText": "reserve", "sid": "227,1426,16608,0,0,0,0", "location": "227,1426,126,24", "colLbl": 24, "text": "reserve"}, {"colAccu": 0.99, "originText": "release", "sid": "227, 1489,15049,0,0,0,0", "location": "227,1489,123,24", "colLbl": 25, "text": "release"}, {"colAccu": 0.99, "originText": "interest", "sid": "227,1549,15076,0,0,0 ,0", "location": "227,1549,117,24", "colLbl": 26, "text": "interest"}, {"colAccu": 0.99, "originText": "brokerage", "sid": "227,1609,24808,0,0,0,0", "location": "227,1609,161,31", "colLbl": 7, "text": "brokerage"}, {"colAccu": 0.99, "colLbl": 8, "sid": "233,1678,17036,0,0,0,0", "originText": "portfolio", "text": "portfolio", "location": "233,1678,134,24"}, {"colAccu": 0.99, "originText": "balance", "sid": "227,1781,16326,0,0,0,0", "location": "227,1781,124,24", "colLbl": 9, "text": "balance"}, {"colAccu": 0.99, "originText": ": marine cargo surplus 2018 - inward", "sid": "574,907,14459,16518,20299,21636,97309", "location": "574,907,568,32", "colLbl": 36, "text": "a marine cargo surplus 2018 a inward"}, {"colAccu": 0.99, "colLbl": 36, "sid": "574,1065,14459,97318,0,0,0", "originText": ": apex/bord/2727", "location": "574,1065,304,25", "text": "a apex/bord/2727"}, {"colAccu": 0.99, "originText": "jod 1.00", "sid": "629,1173,97300,97322,0,0,0", "location": "629,1173,171,25", "colLbl": 36, "text": "jod 1.00"}, {"colAccu": 0.99, "originText": "25.53", "sid": "639,1239,1,1,1,1,1", "location": "639,1239,83,25", "colLbl": 37, "text": "25.53"}, {"colAccu": 0.99, "originText": "5.74", "sid": "639,1299,1,1,1,1,1", "location": "639,1299,64,25", "colLbl": 37, "text": "5 .74"}, {"colAccu": 0.99, "originText": "7.66", "sid": "639,1422,1,1,1,1,1", "location": "639,1422,64,25", "colLbl": 37, "text": "7.66"}, {"colAccu": 0.99, "colLbl": 37, "sid": "639,1485,1,1,1,1,1", "originText": "0.00", "text": "0.000", "location": "639,1485,64,25"}, {"colAccu": 0.99, "originText": "0.00", "te xt": "0.000", "sid": "639,1545,1,1,1,1,1", "location": "639,1545,64,25", "colLbl": 37}, {"colAccu": 0.99, "originText": "0.6 4", "sid": "639,1605,1,1,1,1,1", "location": "639,1605,64,25", "colLbl": 37, "text": "0.64"}, {"colAccu": 0.99, "originText": "0.00", "sid": "648,1677,1,1,1,1,1 ", "location": "648,1677,64,25", "colLbl": 37, "text": "0.000"}, {"colAccu": 0.99, "originText": "11 .49", "sid": "641,1774,97319,97320,0,0,0", "location": "641,1774,81,25", "colLbl": 37, "text": "11 .49"}]'
        # inputArr = json.loads(text)

        # for item in inputArr:
        #     print(item)

        entryLabel = []

        for inputItem in inputArr:
            if 'colLbl' in inputItem:
                if inputItem['colLbl'] >= 6 and inputItem['colLbl'] <= 36:
                    entryLabel.append(inputItem)

        for inputItem in inputArr:
            if inputItem['colLbl'] == 37:
                entLoc = inputItem['location'].split(",")
                leftMinDis = 100000
                middleMinDis = 100000
                minDis = 100000
                entryLbl = ''
                minItem = {}

                for lblItem in entryLabel:
                    # 같은 라인 검사
                    lblLoc = lblItem['location'].split(",")
                    leftDis = abs(int(entLoc[1]) - int(lblLoc[1]))
                    if leftMinDis > leftDis:
                        leftMinDis = leftDis
                        if leftDis < 10:
                            minItem = lblItem

                # 왼쪽끝, 중심, 오른쪽 검사
                if len(minItem) < 1:
                    for lblItem in entryLbl:
                        lblLoc = lblItem['location'].split(",")
                        leftdot = int(lblLoc[0])
                        rightdot = int(lblLoc[0]) + int(lblLoc[2])

                        if (leftdot - 10) <= int(entLoc[0]) and (rightdot + 10) <= int(entLoc[0]):
                            minItem = lblItem

                # if len(minItem) < 1:
                #     for lblItem in entryLabel:
                #         lblLoc = lblItem['location'].split(",")
                #         middleDis = abs((int(entLoc[0]) + int(entLoc[2])) - (int(lblLoc[0]) + int(lblLoc[2])))
                #         if middleMinDis > middleDis:
                #             middleMinDis = middleDis
                #             if middleDis < 20:
                #                 minItem = lblItem

                # 가장가까운 label 검사
                if len(minItem) < 1:
                    for lblItem in entryLabel:
                        lblLoc = lblItem['location'].split(",")
                        diffX = int(entLoc[0]) - int(lblLoc[0])
                        diffY = int(entLoc[1]) - int(lblLoc[1])
                        dis = math.sqrt(abs(diffX * diffX) + (diffY * diffY))
                        if minDis > dis:
                            minDis = dis
                            if lblItem['colLbl'] != 36:
                                minItem = lblItem

                # entry cls 매핑
                if len(minItem) > 1:
                    col = ''
                    for row in colCls:
                        if str(row[1]) == str(minItem['colLbl']):
                            col = row[0]

                    for row in entCls:
                        if str(row[0]) == str(col):
                            entryLbl = row[1]

                if entryLbl == '':
                    entryLbl = 30

                inputItem['entryLbl'] = entryLbl

        # for item in inputArr:
        #     print(item)

        print(str(inputArr))

    except Exception as e:
        print(str({'code': 500, 'message': 'column mapping predict fail', 'error': str(e).replace("'","").replace('"','')}))

if __name__ == '__main__':
    arg = sys.argv[1].replace(u"\u2022", u"")
    # arg ='[{"originText":"apex","location":"1018,240,411,87","text":"apex","sid":"1018,240,25767,0,0,0,0"},{"originText":"partner of choice","location":"1019,338,409,23","text":"partner of choice","sid":"1019,338,15944,14456,15585,0,0"},{"originText":"voucher no","location":"1562,509,178,25","text":"voucher no","sid":"1562,509,24349,14502,0,0,0"},{"originText":"voucher date","location":"1562,578,206,25","text":"voucher date","sid":"1562,578,24349,14552,0,0,0"},{"originText":"4153 korean re","location":"206,691,274,27","text":"4153 korean re","sid":"206,691,97312,18699,14569,0,0"},{"originText":"proportional treaty statement","location":"208,756,525,34","text":"proportional treaty statement","sid":"208,756,24968,20629,15214,0,0"},{"originText":"bv/heo/2018/05/0626","location":"1842,506,344,25","text":"bv/heo/2018/05/0626","sid":"1842,506,97313,0,0,0,0"},{"originText":"01105/2018","location":"1840,575,169,25","text":"01105/2018","sid":"1840,575,97314,0,0,0,0"},{"originText":"cedant","location":"206,848,111,24","text":"pedant","sid":"206,848,64626,0,0,0,0"},{"originText":"class of business","location":"206,908,285,24","text":"class of business","sid":"206,908,14818,14456,14525,0,0"},{"originText":"period of quarter","location":"210,963,272,26","text":"period of quarter","sid":"210,963,15186,14456,16570,0,0"},{"originText":"period of treaty","location":"207,1017,252,31","text":"period of treaty","sid":"207,1017,15186,14456,20629,0,0"},{"originText":"our reference","location":"206,1066,227,24","text":"our reference","sid":"206,1066,14498,15089,0,0,0"},{"originText":"currency","location":"226,1174,145,31","text":"currency","sid":"226,1174,16280,0,0,0,0"},{"originText":"premium","location":"227,1243,139,24","text":"premium","sid":"227,1243,16438,0,0,0,0"},{"originText":"commission","location":"226,1303,197,24","text":"commission","sid":"226,1303,15444,0,0,0,0"},{"originText":"claims","location":"226,1366,107,24","text":"claims","sid":"226,1366,16527,0,0,0,0"},{"originText":"reserve","location":"227,1426,126,24","text":"reserve","sid":"227,1426,16608,0,0,0,0"},{"originText":"release","location":"227,1489,123,24","text":"release","sid":"227,1489,15049,0,0,0,0"},{"originText":"interest","location":"227,1549,117,24","text":"interest","sid":"227,1549,15076,0,0,0,0"},{"originText":"brokerage","location":"227,1609,161,31","text":"brokerage","sid":"227,1609,24808,0,0,0,0"},{"originText":"portfolio","location":"233,1678,134,24","text":"portfolio","sid":"233,1678,17036,0,0,0,0"},{"originText":"balance","location":"227,1781,124,24","text":"balance","sid":"227,1781,16326,0,0,0,0"},{"originText":": solidarity- first insurance 2018","location":"574,847,492,32","text":": solidarity- first insurance 2018","sid":"574,847,97332,97308,14535,14813,97309"},{"originText":": marine cargo surplus 2018 - inward","location":"574,907,568,32","text":": marine cargo surplus 2018 - inward","sid":"574,907,97332,16518,20299,21636,97309"},{"originText":"01-01-2018 to 31-03-2018","location":"598,959,433,25","text":"01-01-2018 to 31-03-2018","sid":"598,959,97315,14458,97316,0,0"},{"originText":": 01-01-2018 to 31-12-2018","location":"574,1010,454,25","text":": 01-01-2018 to 31-12-2018","sid":"574,1010,97332,97315,14458,97317,0"},{"originText":": apex/bord/2727","location":"574,1065,304,25","text":": apex/bord/2727","sid":"574,1065,97332,97318,0,0,0"},{"originText":"jod 1.00","location":"629,1173,171,25","text":"jod 1.00","sid":"629,1173,97300,97322,0,0,0"},{"originText":"25.53","location":"639,1239,83,25","text":"25.53","sid":"639,1239,1,1,1,1,1"},{"originText":"5.74","location":"639,1299,64,25","text":"5.74","sid":"639,1299,1,1,1,1,1"},{"originText":"0.00","location":"639,1362,64,25","text":"0.000","sid":"639,1362,1,1,1,1,1"},{"originText":"7.66","location":"639,1422,64,25","text":"7.66","sid":"639,1422,1,1,1,1,1"},{"originText":"0.00","location":"639,1485,64,25","text":"0.000","sid":"639,1485,1,1,1,1,1"},{"originText":"0.00","location":"639,1545,64,25","text":"0.000","sid":"639,1545,1,1,1,1,1"},{"originText":"0.64","location":"639,1605,64,25","text":"0.64","sid":"639,1605,1,1,1,1,1"},{"originText":"0.00","location":"648,1677,64,25","text":"0.000","sid":"648,1677,1,1,1,1,1"},{"originText":"11 .49","location":"641,1774,81,25","text":"11 .49","sid":"641,1774,97319,97320,0,0,0"},{"originText":"apex insurance","location":"1706,1908,356,29","text":"apex insurance","sid":"1706,1908,25767,14813,0,0,0"}]'
    # arg ='[{"originText":"apex","text":"apex","location":"1018,240,411,87","sid":"25767,0,0,0,0"},{"originText":"partner of choice","text":"partner of choice","location":"1019,338,409,23","sid":"15944,14456,15585,0,0"},{"originText":"voucher no","text":"voucher no","location":"1562,509,178,25","sid":"24349,14502,0,0,0"},{"originText":"voucher date","text":"voucher date","location":"1562,578,206,25","sid":"24349,14552,0,0,0"},{"originText":"4153 korean re","text":"4153 korean re","location":"206,691,274,27","sid":"97312,18699,14569,0,0"},{"originText":"proportional treaty statement","text":"proportional treaty statement","location":"208,756,525,34","sid":"24968,20629,15214,0,0"},{"originText":"bv/heo/2018/05/0626","text":"bv/heo/2018/05/0626","location":"1842,506,344,25","sid":"97313,0,0,0,0"},{"originText":"01105/2018","text":"01105/2018","location":"1840,575,169,25","sid":"97314,0,0,0,0"},{"originText":"cedant","text":"pedant","location":"206,848,111,24","sid":"64626,0,0,0,0"},{"originText":"class of business","text":"class of business","location":"206,908,285,24","sid":"14818,14456,14525,0,0"},{"originText":"period of quarter","text":"period of quarter","location":"210,963,272,26","sid":"15186,14456,16570,0,0"},{"originText":"period of treaty","text":"period of treaty","location":"207,1017,252,31","sid":"15186,14456,20629,0,0"},{"originText":"our reference","text":"our reference","location":"206,1066,227,24","sid":"14498,15089,0,0,0"},{"originText":"currency","text":"currency","location":"226,1174,145,31","sid":"16280,0,0,0,0"},{"originText":"premium","text":"premium","location":"227,1243,139,24","sid":"16438,0,0,0,0"},{"originText":"commission","text":"commission","location":"226,1303,197,24","sid":"15444,0,0,0,0"},{"originText":"claims","text":"claims","location":"226,1366,107,24","sid":"16527,0,0,0,0"},{"originText":"reserve","text":"reserve","location":"227,1426,126,24","sid":"16608,0,0,0,0"},{"originText":"release","text":"release","location":"227,1489,123,24","sid":"15049,0,0,0,0"},{"originText":"interest","text":"interest","location":"227,1549,117,24","sid":"15076,0,0,0,0"},{"originText":"brokerage","text":"brokerage","location":"227,1609,161,31","sid":"24808,0,0,0,0"},{"originText":"portfolio","text":"portfolio","location":"233,1678,134,24","sid":"17036,0,0,0,0"},{"originText":"balance","text":"balance","location":"227,1781,124,24","sid":"16326,0,0,0,0"},{"originText":": solidarity- first insurance 2018","text":": solidarity- first insurance 2018","location":"574,847,492,32","sid":"97332,97308,14535,14813,97309"},{"originText":": marine cargo surplus 2018 - inward","text":": marine cargo surplus 2018 - inward","location":"574,907,568,32","sid":"97332,16518,20299,21636,97309"},{"originText":"01-01-2018 to 31-03-2018","text":"01-01-2018 to 31-03-2018","location":"598,959,433,25","sid":"97315,14458,97316,0,0"},{"originText":": 01-01-2018 to 31-12-2018","text":": 01-01-2018 to 31-12-2018","location":"574,1010,454,25","sid":"97332,97315,14458,97317,0"},{"originText":": apex/bord/2727","text":": apex/bord/2727","location":"574,1065,304,25","sid":"97332,97318,0,0,0"},{"originText":"jod 1.00","text":"jod 1.00","location":"629,1173,171,25","sid":"97300,97322,0,0,0"},{"originText":"25.53","text":"25.53","location":"639,1239,83,25","sid":"1,1,1,1,1"},{"originText":"5.74","text":"5.74","location":"639,1299,64,25","sid":"1,1,1,1,1"},{"originText":"0.00","text":"0.000","location":"639,1362,64,25","sid":"1,1,1,1,1"},{"originText":"7.66","text":"7.66","location":"639,1422,64,25","sid":"1,1,1,1,1"},{"originText":"0.00","text":"0.000","location":"639,1485,64,25","sid":"1,1,1,1,1"},{"originText":"0.00","text":"0.000","location":"639,1545,64,25","sid":"1,1,1,1,1"},{"originText":"0.64","text":"0.64","location":"639,1605,64,25","sid":"1,1,1,1,1"},{"originText":"0.00","text":"0.000","location":"648,1677,64,25","sid":"1,1,1,1,1"},{"originText":"11 .49","text":"11 .49","location":"641,1774,81,25","sid":"97319,97320,0,0,0"},{"originText":"apex insurance","text":"apex insurance","location":"1706,1908,356,29","sid":"25767,14813,0,0,0"}]'
    if arg == "training":
        training()
    else:
        eval(arg)
