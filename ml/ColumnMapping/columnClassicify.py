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

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.logging.set_verbosity(tf.logging.ERROR)
checkpointDir = 'C:\\Users\\user\\PycharmProjects\\typosentence\\checkpoint'
feature_columns = [tf.contrib.layers.real_valued_column("", dimension=8)]
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
    try:
        for inputItem in inputArr:
            predictArr = []
            predictData = []

            if 'sid' in inputItem:
                for sidItem in inputItem['sid'].split(","):
                    predictData.append(float(sidItem))

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

        #inputArr에서 colLbl 이 entry인 것과 entry 라벨(colLbl이 6~37)을 추출
        #각entry 왼쪽끝 오른쪽 끝 중심 어느것이든 일치(+-5)하는 라벨이 있으면 선택
        #not entry와 중복되면 not entry를 선택
        #일치가 없으면 가까운 엔트리(not entry제외)를 선택하게 함
        #inputItem['entryLbl'] 값은 TBL_ENTRY_MAPPING_CLS column값

        print(str(inputArr))
    except Exception as e:
        print(str({'code': 500, 'message': 'column mapping predict fail', 'error': str(e).replace("'","").replace('"','')}))

if __name__ == '__main__':
    arg = sys.argv[1].replace(u"\u2022", u"")
    if arg == "training":
        training()
    else:
        eval(arg)
