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
isTraning = True if sys.argv[1] == 'training' else False

config = configparser.ConfigParser()
config.read('./ml/config.ini')

id = config['ORACLE']['ID']
pw = config['ORACLE']['PW']
sid = config['ORACLE']['SID']
ip = config['ORACLE']['IP']
port = config['ORACLE']['PORT']

connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

#DB에서 training에 필요한 데이터 추출 후 가공
#추후 모델에 새로운 데이터만 추가학습하는 로직 구축
conn = cx_Oracle.connect(connInfo)
curs = conn.cursor()
sql = "SELECT SEQNUM, DATA, CLASS FROM TBL_FORM_MAPPING"
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

feature_columns = [tf.contrib.layers.real_valued_column("", dimension=14)]

checkpointDir = os.getcwd() + '\\ml\\FormMapping\\checkpoint'
if not os.path.isdir(checkpointDir):
    os.mkdir(checkpointDir)
else:
    #training이 필요한 시점만 True로 전환 기존 모델 삭제
    if (isTraning):
        shutil.rmtree(checkpointDir, False)

classifier = tf.contrib.learn.DNNClassifier(feature_columns=feature_columns, hidden_units=[10, 20, 10],
                                            n_classes=300, model_dir=checkpointDir)

#training이 필요한 시점만 True로 전환
if (isTraning):
    classifier.fit(x=testNpData, y=testNpTarget, steps=2000)
else:
    inputArr = json.loads(sys.argv[2].replace(u"\u2022", u""))
    
    companySid = ''
    contractSid = ''
    predictArr = []
    predictData = []
    
    for inputItem in inputArr:
        if 1 == inputItem['formLabel']:
            companySid =  inputItem['sid']
        if 2 == inputItem['formLabel']:
            contractSid = inputItem['sid']
    
    if '' == companySid:
        companySid = '0,0,0,0,0,0,0'
    if '' == contractSid:
        contractSid = '0,0,0,0,0,0,0'
    
    for sidItem in ','.join((companySid, contractSid)).split(","):
        predictData.append(float(sidItem))
    
    #db에 일치하는 docSid가 있는 경우 db의 label값을 가져와서 리턴
    predictDocType = {}
    
    for row in rows:
        floatArr = []
        num = str(row[1]).split(",")
        for n in num:
            floatArr.append(float(n))
    
        if floatArr == predictData:
            predictDocType['docType'] = int(row[2])
    
    #db에 일치하는 sid가 없을 경우 ML predict 결과를 리턴
    if 'docType' not in predictDocType:
        predictArr.append(predictData)
        resultArr = list(classifier.predict(np.array(predictArr, dtype=np.float32), as_iterable=True))
        predictDocType['docType'] = resultArr[0]
    
    inputArr.append(predictDocType)
    
    print(str(inputArr))