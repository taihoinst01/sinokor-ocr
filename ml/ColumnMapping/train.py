from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import tensorflow as tf
import numpy as np
import cx_Oracle
import configparser
import sys

userData = []

for word in sys.argv[1:]:
    wordSplit = word.split(",")
    wordData = []
    for s in wordSplit:
        wordData.append(float(s))

    userData.append(wordData)

config = configparser.ConfigParser()
config.read('./ml/config.ini')

id = config['ORACLE']['ID']
pw = config['ORACLE']['PW']
sid = config['ORACLE']['SID']
ip = config['ORACLE']['IP']
port = config['ORACLE']['PORT']

connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

conn = cx_Oracle.connect(connInfo)
curs = conn.cursor()

sql = "SELECT SEQNUM, DATA, CLASS FROM TBL_COLUMN_MAPPING_TRAIN"
curs.execute(sql)
rows = curs.fetchall()

data = []
target = []

testData = []
testTarget = []

for i, r in enumerate(rows):
    arr = []
    num = str(r[1]).split(",")
    for n in num:
        arr.append(float(n))
    target.append(int(r[2]))

    if i % 3 == 0:
        testData.append(arr)
        testTarget.append(int(r[2]))

    data.append(arr)

npData = np.array(data)
npTarget = np.array(target)

testNpData = np.array(testData)
testNpTarget = np.array(testTarget)

# 모든 특성이 실수값을 가지고 있다고 지정합니다
feature_columns = [tf.contrib.layers.real_valued_column("", dimension=8)]

# 10, 20, 10개의 유닛을 가진 3층 DNN를 만듭니다
classifier = tf.contrib.learn.DNNClassifier(feature_columns=feature_columns,
                                            hidden_units=[10, 20, 10],
                                            n_classes=100,
                                            model_dir="/tmp/columnMapping")

# classifier = tf.contrib.learn.DNNClassifier(feature_columns=feature_columns,
#                                             hidden_units=[10, 20, 10, 10, 10, 10, 10, 10, 10, 10,
#                                                           10, 20, 10, 10, 10, 10, 10, 10, 10, 10,
#                                                           10, 20, 10, 10, 10, 10, 10, 10, 10, 10,
#                                                           10, 20, 10, 10, 10, 10, 10, 10, 10, 10,
#                                                           10, 20, 10, 10, 10, 10, 10, 10],
#                                             n_classes=36,
#                                             model_dir="/tmp/columnMapping")


# 모델을 학습시킵니다.
classifier.fit(x=npData,
               y=npTarget,
               steps=2000)

# 정확도를 평가합니다.
accuracy_score = classifier.evaluate(x=testNpData,
                                     y=testNpTarget)["accuracy"]

print('정확도: {0:f}'.format(accuracy_score))