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

config = configparser.ConfigParser()
os.path.abspath('./ml')
mlroot = os.path.dirname(os.path.abspath(os.path.dirname(__file__)))
config.read(mlroot + '\\config.ini')

id = "koreanre"
pw = "koreanre01"
sid = "koreanreocr"
# ip = "10.10.20.205"
ip = "172.16.53.142"
port = "1521"

connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

#DB에서 training에 필요한 데이터 추출 후 가공
#추후 모델에 새로운 데이터만 추가학습하는 로직 구축

conn = cx_Oracle.connect(connInfo)
curs = conn.cursor()
sql = ("SELECT "
          "SEQNUM, DATA, CLASS "
        "FROM "
          "TBL_COLUMN_MAPPING_TRAIN "
        "WHERE DATA in "
          "(SELECT T.DATA "
           "FROM ( "
            "SELECT "
              "DATA, COUNT(DATA) AS COUNT "
            "FROM "
              "TBL_COLUMN_MAPPING_TRAIN "
            "GROUP BY DATA) T "
           "WHERE T.COUNT = 1) ")

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

feature_columns = [tf.contrib.layers.real_valued_column("", dimension=7)]

checkpointDir = mlroot + '\\ColumnMapping\\checkpoint'
classifier = tf.contrib.learn.DNNClassifier(feature_columns=feature_columns, hidden_units=[10, 20, 10],
                                            n_classes=40, model_dir=checkpointDir)

arg = sys.argv[1].replace(u"\u2022", u"")

if arg == "training":
    try:
        if not os.path.isdir(checkpointDir):
            os.mkdir(checkpointDir)
        else:
            # training이 필요한 시점만 True로 전환 기존 모델 삭제
            shutil.rmtree(checkpointDir, False)

        # training이 필요한 시점만 True로 전환
        classifier.fit(x=testNpData, y=testNpTarget, steps=2000)

        print(str({'code': 200, 'message': 'column mapping train success'}))
    except Exception as e:
        print(str({'code': 500, 'message': 'column mapping train fail', 'error': str(e).replace("'","").replace('"','')}))
else:
    inputArr = json.loads(sys.argv[1].replace(u"\u2022", u""))
    #docType = 0

    try:
        #for inputItem in inputArr:
        #    if 'docType' in inputItem:
        #        docType = inputItem['docType']

        for inputItem in inputArr:
            predictArr = []
            predictData = []
            #predictData = [float(docType)]

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
        print(str(inputArr))
    except Exception as e:
        print(str({'code': 500, 'message': 'column mapping predict fail', 'error': str(e).replace("'","").replace('"','')}))