from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import tensorflow as tf
import numpy as np
import cx_Oracle
import configparser
import sys
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

sql = "SELECT SEQNUM, DATA, CLASS FROM TBL_FORM_LABEL_MAPPING"
curs.execute(sql)
rows = curs.fetchall()

userData = []

for word in sys.argv[1:]:
    wordSplit = word.split(",")
    wordData = []
    for s in wordSplit:
        wordData.append(float(s))

    userData.append(wordData)

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

testNpData = np.array(testData)
testNpTarget = np.array(testTarget)

# 모든 특성이 실수값을 가지고 있다고 지정합니다
feature_columns = [tf.contrib.layers.real_valued_column("", dimension=7)]

# 10, 20, 10개의 유닛을 가진 3층 DNN를 만듭니다
classifier = tf.contrib.learn.DNNClassifier(feature_columns=feature_columns,
                                            hidden_units=[10, 20, 10],
                                            n_classes=3,
                                            model_dir="/tmp/formLabelMapping")

# 정확도를 평가합니다.
accuracy_score = classifier.evaluate(x=testNpData,
                                     y=testNpTarget)["accuracy"]

# print('정확도: {0:f}'.format(accuracy_score))

new_samples = np.array(
    userData, dtype=float)
y = list(classifier.predict(new_samples, as_iterable=True))


selLabel = "SELECT SEQNUM, DATA, CLASS FROM TBL_FORM_LABEL_MAPPING WHERE DATA = :selData"

retText = ''
for word in enumerate(sys.argv[1:]):
    curs.execute(selLabel, selData=word[1])
    selLabelRes = curs.fetchall()

    if len(selLabelRes) > 0:
        retText += word[1] + "||" + selLabelRes[0][2] + "^"
    else:
        retText += word[1] + "||" + str(y[word[0]]) + "^"

retText = retText[:-1]
print(retText)