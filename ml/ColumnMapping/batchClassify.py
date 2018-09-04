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

id = "koreanre"
pw = "koreanre01"
sid = "koreanreocr"
ip = "10.10.20.205"
#ip = "172.16.53.142"
port = "1521"
connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

conn = cx_Oracle.connect(connInfo)
curs = conn.cursor()

sql = "SELECT SEQNUM, DATA, CLASS FROM TBL_COLUMN_MAPPING_TRAIN "
curs.execute(sql)
rows = curs.fetchall()

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
            if (boundaryCheck(dbNum[1], inputNum[1]) and (boundaryCheck(dbNum[0], inputNum[0]) or boundaryCheck(dbNum[2], inputNum[2]))):
                ret.append(row[2])
        # {3~34}위치는 상관없이 text sid가 일치하면 label 매핑
        # text sid에 여러개의 label이 매핑되있을 경우 랜덤 매핑
        elif int(row[2]) != 38:
            dbNum = str(row[1]).split(",")[3:]
            inputNum = str(inputsid).split(",")[3:]
            if dbNum == inputNum:
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
                entLoc = inputItem['sid'].split(",")[0:3]

                for lblItem in entryLabel:
                    lblLoc = lblItem['sid'].split(",")[0:3]
                    # 같은 라인 검사
                    if boundaryCheck(entLoc[1], lblLoc[1]):
                        inputItem['entryLbl'] = entryLabelDB(lblItem['colLbl'])

                    #상위 해더 왼쪽 오른쪽 정렬 검사
                    if boundaryCheck(entLoc[0], lblLoc[0]) or boundaryCheck(entLoc[2], lblLoc[2]):
                        inputItem['entryLbl'] = entryLabelDB(lblItem['colLbl'])

                if 'entryLbl' not in inputItem:
                        inputItem['entryLbl'] = 30

        print(str(inputArr))

    except Exception as e:
        print(str({'code': 500, 'message': 'column mapping predict fail', 'error': str(e).replace("'","").replace('"','')}))

if __name__ == '__main__':
    # arg ='[{"originText":"apex","location":"1018,240,411,87","text":"apex","sid":"1018,240,25767,0,0,0,0"},{"originText":"partner of choice","location":"1019,338,409,23","text":"partner of choice","sid":"1019,338,15944,14456,15585,0,0"},{"originText":"voucher no","location":"1562,509,178,25","text":"voucher no","sid":"1562,509,24349,14502,0,0,0"},{"originText":"voucher date","location":"1562,578,206,25","text":"voucher date","sid":"1562,578,24349,14552,0,0,0"},{"originText":"4153 korean re","location":"206,691,274,27","text":"4153 korean re","sid":"206,691,97312,18699,14569,0,0"},{"originText":"proportional treaty statement","location":"208,756,525,34","text":"proportional treaty statement","sid":"208,756,24968,20629,15214,0,0"},{"originText":"bv/heo/2018/05/0626","location":"1842,506,344,25","text":"bv/heo/2018/05/0626","sid":"1842,506,97313,0,0,0,0"},{"originText":"01105/2018","location":"1840,575,169,25","text":"01105/2018","sid":"1840,575,97314,0,0,0,0"},{"originText":"cedant","location":"206,848,111,24","text":"pedant","sid":"206,848,64626,0,0,0,0"},{"originText":"class of business","location":"206,908,285,24","text":"class of business","sid":"206,908,14818,14456,14525,0,0"},{"originText":"period of quarter","location":"210,963,272,26","text":"period of quarter","sid":"210,963,15186,14456,16570,0,0"},{"originText":"period of treaty","location":"207,1017,252,31","text":"period of treaty","sid":"207,1017,15186,14456,20629,0,0"},{"originText":"our reference","location":"206,1066,227,24","text":"our reference","sid":"206,1066,14498,15089,0,0,0"},{"originText":"currency","location":"226,1174,145,31","text":"currency","sid":"226,1174,16280,0,0,0,0"},{"originText":"premium","location":"227,1243,139,24","text":"premium","sid":"227,1243,16438,0,0,0,0"},{"originText":"commission","location":"226,1303,197,24","text":"commission","sid":"226,1303,15444,0,0,0,0"},{"originText":"claims","location":"226,1366,107,24","text":"claims","sid":"226,1366,16527,0,0,0,0"},{"originText":"reserve","location":"227,1426,126,24","text":"reserve","sid":"227,1426,16608,0,0,0,0"},{"originText":"release","location":"227,1489,123,24","text":"release","sid":"227,1489,15049,0,0,0,0"},{"originText":"interest","location":"227,1549,117,24","text":"interest","sid":"227,1549,15076,0,0,0,0"},{"originText":"brokerage","location":"227,1609,161,31","text":"brokerage","sid":"227,1609,24808,0,0,0,0"},{"originText":"portfolio","location":"233,1678,134,24","text":"portfolio","sid":"233,1678,17036,0,0,0,0"},{"originText":"balance","location":"227,1781,124,24","text":"balance","sid":"227,1781,16326,0,0,0,0"},{"originText":": solidarity- first insurance 2018","location":"574,847,492,32","text":": solidarity- first insurance 2018","sid":"574,847,97332,97308,14535,14813,97309"},{"originText":": marine cargo surplus 2018 - inward","location":"574,907,568,32","text":": marine cargo surplus 2018 - inward","sid":"574,907,97332,16518,20299,21636,97309"},{"originText":"01-01-2018 to 31-03-2018","location":"598,959,433,25","text":"01-01-2018 to 31-03-2018","sid":"598,959,97315,14458,97316,0,0"},{"originText":": 01-01-2018 to 31-12-2018","location":"574,1010,454,25","text":": 01-01-2018 to 31-12-2018","sid":"574,1010,97332,97315,14458,97317,0"},{"originText":": apex/bord/2727","location":"574,1065,304,25","text":": apex/bord/2727","sid":"574,1065,97332,97318,0,0,0"},{"originText":"jod 1.00","location":"629,1173,171,25","text":"jod 1.00","sid":"629,1173,97300,97322,0,0,0"},{"originText":"25.53","location":"639,1239,83,25","text":"25.53","sid":"639,1239,1,1,1,1,1"},{"originText":"5.74","location":"639,1299,64,25","text":"5.74","sid":"639,1299,1,1,1,1,1"},{"originText":"0.00","location":"639,1362,64,25","text":"0.000","sid":"639,1362,1,1,1,1,1"},{"originText":"7.66","location":"639,1422,64,25","text":"7.66","sid":"639,1422,1,1,1,1,1"},{"originText":"0.00","location":"639,1485,64,25","text":"0.000","sid":"639,1485,1,1,1,1,1"},{"originText":"0.00","location":"639,1545,64,25","text":"0.000","sid":"639,1545,1,1,1,1,1"},{"originText":"0.64","location":"639,1605,64,25","text":"0.64","sid":"639,1605,1,1,1,1,1"},{"originText":"0.00","location":"648,1677,64,25","text":"0.000","sid":"648,1677,1,1,1,1,1"},{"originText":"11 .49","location":"641,1774,81,25","text":"11 .49","sid":"641,1774,97319,97320,0,0,0"},{"originText":"apex insurance","location":"1706,1908,356,29","text":"apex insurance","sid":"1706,1908,25767,14813,0,0,0"}]'
    #arg ='[{"location":"1392,16,243,16","text":"172.16. tv.71/2018.02.22 17,32/oi","originText":"172.16. tv.71/2018.02.22 17,32/oi","sid":"1392,16,1635,0,0,0,0,0"},{"location":"1468,250,142,17","text":"empower results","originText":"empower results","sid":"1468,250,1610,30163,14681,0,0,0"},{"location":"1008,328,353,23","text":"asiapacific.prorata@aonbenfield.com","originText":"asiapacific.prorata@aonbenfield.com","sid":"1008,328,1361,0,0,0,0,0"},{"location":"1073,409,122,15","text":"20-feb-2018","originText":"20-feb-2018","sid":"1073,409,1195,0,0,0,0,0"},{"location":"1075,434,95,17","text":"10600563","originText":"10600563","sid":"1075,434,1170,1,1,1,1,1"},{"location":"1073,458,258,20","text":"goi 1-00844a-1002aa 2az","originText":"goi 1-00844a-1002aa 2az","sid":"1073,458,1331,0,0,0,0,0"},{"location":"93,304,445,23","text":"reinsurance department (ab china - china tty)","originText":"reinsurance department (ab china - china tty)","sid":"93,304,538,34107,14809,0,15053,97339"},{"location":"15,305,30,17","text":"to:","originText":"to:","sid":"15,305,45,0,0,0,0,0"},{"location":"94,331,283,20","text":"korean reinsurance company","originText":"korean reinsurance company","sid":"94,331,377,18699,34107,14623,0,0"},{"location":"93,356,166,20","text":"80 sousong-dong","originText":"80 sousong-dong","sid":"93,356,259,0,0,0,0,0"},{"location":"92,383,116,19","text":"chongno-gu","originText":"chongno-gu","sid":"92,383,208,0,0,0,0,0"},{"location":"92,408,137,16","text":"seoul 110-140","originText":"seoul 110-140","sid":"92,408,229,26213,0,0,0,0"},{"location":"94,434,220,20","text":"korea, republic of","originText":"korea, republic of","sid":"94,434,314,0,15890,14456,0,0"},{"location":"426,1016,69,16","text":"co. ltd","originText":"co. ltd","sid":"426,1016,495,0,15632,0,0,0"},{"location":"710,224,232,19","text":"account invoice","originText":"account invoice","sid":"710,224,942,14793,21391,0,0,0"},{"location":"801,331,83,16","text":"contact:","originText":"contact:","sid":"801,331,884,0,0,0,0,0"},{"location":"802,356,68,16","text":"phone:","originText":"phone:","sid":"802,356,870,0,0,0,0,0"},{"location":"801,409,129,15","text":"invoice date:","originText":"invoice date:","sid":"801,409,930,21391,0,0,0,0"},{"location":"801,434,203,17","text":"invoice/retacc no:","originText":"invoice/retacc no:","sid":"801,434,1004,97342,0,0,0,0"},{"location":"801,461,114,16","text":"our ref no:","originText":"our ref no:","sid":"801,461,915,14498,17691,0,0,0"},{"location":"801,513,68,15","text":"tax id:","originText":"tax id:","sid":"801,513,869,14958,0,0,0,0"},{"location":"15,577,144,15","text":"contract with:","originText":"contract with:","sid":"15,577,159,15610,0,0,0,0"},{"location":"14,603,156,16","text":"contract name:","originText":"contract name:","sid":"14,603,170,15610,0,0,0,0"},{"location":"15,629,173,19","text":"coverage period:","originText":"coverage period:","sid":"15,629,188,16250,0,0,0,0"},{"location":"14,655,186,16","text":"your contract ref:","originText":"your contract ref:","sid":"14,655,200,14478,15610,0,0,0"},{"location":"16,681,119,15","text":"descri tion:","originText":"descri tion:","sid":"16,681,135,0,0,0,0,0"},{"location":"240,576,305,20","text":"guoyuan agricultural ins. co. ltd","originText":"guoyuan agricultural ins. co. ltd","sid":"240,576,545,97346,17403,0,0,15632"},{"location":"240,600,599,23","text":"non marine comb qs & surp tty - section - quota share-vat","originText":"non marine comb qs & surp tty - section - quota share-vat","sid":"240,600,839,14812,16518,28709,97294,0"},{"location":"241,628,256,18","text":"01-feb-2010 - 31-jan-2011","originText":"01-feb-2010 - 31-jan-2011","sid":"241,628,497,0,97339,0,0,0"},{"location":"241,680,684,16","text":"01-oct-2017-31-dec-2017 re ort former polic number:008442010aa","originText":"01-oct-2017-31-dec-2017 re ort former polic number:008442010aa","sid":"241,680,925,0,14569,40471,16129,0"},{"location":"41,836,246,17","text":"transaction information:","originText":"transaction information:","sid":"41,836,287,17705,0,0,0,0"},{"location":"63,862,220,18","text":"ceded written premium","originText":"ceded written premium","sid":"63,862,283,51197,15234,16438,0,0"},{"location":"63,889,183,19","text":"ceding commission","originText":"ceding commission","sid":"63,889,246,64068,15444,0,0,0"},{"location":"62,914,121,17","text":"chinese vat","originText":"chinese vat","sid":"62,914,183,15861,17867,0,0,0"},{"location":"63,939,225,21","text":"chinese vat surcharge","originText":"chinese vat surcharge","sid":"63,939,288,15861,17867,29649,0,0"},{"location":"63,966,208,18","text":"chinese vat withheld","originText":"chinese vat withheld","sid":"63,966,271,15861,17867,27609,0,0"},{"location":"63,1016,355,23","text":"net due (to) guoyuan agricultural ins.","originText":"net due (to) guoyuan agricultural ins.","sid":"63,1016,418,15097,15182,0,97346,17403"},{"location":"42,1071,143,16","text":"balances due:","originText":"balances due:","sid":"42,1071,185,24792,0,0,0,0"},{"location":"63,1096,99,16","text":"gross due","originText":"gross due","sid":"63,1096,162,18455,15182,0,0,0"},{"location":"64,1122,212,19","text":"brokerage/fee amount","originText":"brokerage/fee amount","sid":"64,1122,276,0,15288,0,0,0"},{"location":"63,1146,452,20","text":"net due from korean reinsurance company","originText":"net due from korean reinsurance company","sid":"63,1146,515,15097,15182,14475,18699,34107"},{"location":"42,1201,264,20","text":"supplemental information:","originText":"supplemental information:","sid":"42,1201,306,22430,0,0,0,0"},{"location":"63,1227,231,20","text":"ceded outstanding loss","originText":"ceded outstanding loss","sid":"63,1227,294,51197,17747,15389,0,0"},{"location":"968,733,148,19","text":"currency: cny","originText":"currency: cny","sid":"968,733,1116,97344,97345,0,0,0"},{"location":"800,889,126,20","text":"@ 24.500000%","originText":"@ 24.500000%","sid":"800,889,926,0,0,0,0,0"},{"location":"726,916,188,19","text":"(212.33) @ 6.000000%","originText":"(212.33) @ 6.000000%","sid":"726,916,914,0,0,0,0,0"},{"location":"726,942,187,18","text":"(212.33) @ 0.720000%","originText":"(212.33) @ 0.720000%","sid":"726,942,913,0,0,0,0,0"},{"location":"725,968,188,22","text":"(?12.33) @ 6.000000%","originText":"(?12.33) @ 6.000000%","sid":"725,968,913,0,0,0,0,0"},{"location":"726,1120,188,24","text":"(212.33) @ 2.500000%","originText":"(212.33) @ 2.500000%","sid":"726,1120,914,0,0,0,0,0"},{"location":"1211,784,130,16","text":"100.000000%","originText":"100.000000%","sid":"1211,784,1341,97343,0,0,0,0"},{"location":"1263,862,80,21","text":"212.33","originText":"(212.33)","sid":"1263,862,1343,1,1,1,1,1"},{"location":"1274,888,68,23","text":"52.02","originText":"(52.02)","sid":"1274,888,1342,1,1,1,1,1"},{"location":"1301,1226,41,19","text":"0.00","originText":"0.00","sid":"1301,1226,1342,1,1,1,1,1"},{"location":"43,1304,1209,22","text":"please settle debit balances as soon as possible. we shall settle the credit balances upon receipt from the debtor party.","originText":"please settle debit balances as soon as possible. we shall settle the credit balances upon receipt from the debtor party.","sid":"43,1304,1252,14592,22392,24078,24792,14477"},{"location":"326,2224,1009,21","text":"on eenfield china limited, tvver 1 times square, matheson street, causeway hong rong t (852) 2861 6555 f, (852)o65 5296","originText":"on eenfield china limited, tvver 1 times square, matheson street, causeway hong rong t (852) 2861 6555 f, (852)o65 5296","sid":"326,2224,1335,14463,0,15053,0,0"},{"location":"1509,758,108,17","text":"7.500000%","originText":"7.500000%","sid":"1509,758,1617,0,0,0,0,0"},{"location":"1385,784,233,16","text":"of a 100.000000% order","originText":"of a 100.000000% order","sid":"1385,784,1618,14456,14459,97343,14618,0"},{"location":"1551,862,66,22","text":"15.92","originText":"(15.92)","sid":"1551,862,1617,1,1,1,1,1"},{"location":"1562,889,56,20","text":"3.90","originText":"(3.90)","sid":"1562,889,1618,1,1,1,1,1"},{"location":"1562,913,55,23","text":"0.96","originText":"(0.96)","sid":"1562,913,1617,1,1,1,1,1"},{"location":"1577,940,37,17","text":"0.11","originText":"0.11","sid":"1577,940,1614,1,1,1,1,1"},{"location":"1576,966,41,17","text":"0.96","originText":"0.96","sid":"1576,966,1617,1,1,1,1,1"},{"location":"1559,1016,48,18","text":"11.91","originText":"11.91","sid":"1559,1016,1607,1,1,1,1,1"},{"location":"1565,1096,50,16","text":"11.91","originText":"11.91","sid":"1565,1096,1615,1,1,1,1,1"},{"location":"1563,1120,54,21","text":"0.40","originText":"(0.40)","sid":"1563,1120,1617,1,1,1,1,1"},{"location":"1566,1149,49,15","text":"11.51","originText":"11.51","sid":"1566,1149,1615,1,1,1,1,1"},{"location":"1577,1226,41,18","text":"0.00","originText":"0.00","sid":"1577,1226,1618,1,1,1,1,1"},{"location":"1421,2269,67,18","text":"page pf","originText":"page pf","sid":"1421,2269,1488,14492,0,0,0,0"},{"location":"0,2320,302,18","text":"copyright@korean *insurance comoan","originText":"copyright@korean *insurance comoan","sid":"0,2320,302,0,0,0,0,0"},{"location":"322,2321,50,17","text":"all agh","originText":"all agh","sid":"322,2321,372,14479,0,0,0,0"},{"location":"584,2250,480,17","text":"this is an electronically generated document nosignaturejs required","originText":"this is an electronically generated document nosignaturejs required","sid":"584,2250,1064,14466,14462,14483,24163,16456"},{"location":"373,2323,86,13","text":"ts reserved","originText":"ts reserved","sid":"373,2323,459,0,14698,0,0,0"}]'
    eval(sys.argv[1])

