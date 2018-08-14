import csv
import cx_Oracle
import configparser

config = configparser.ConfigParser()
config.read('config.ini')

id = config['ORACLE']['ID']
pw = config['ORACLE']['PW']
sid = config['ORACLE']['SID']
ip = config['ORACLE']['IP']
port = config['ORACLE']['PORT']

connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

conn = cx_Oracle.connect(connInfo)
curs = conn.cursor()

sql = "INSERT INTO TBL_FORM_LABEL_MAPPING VALUES(SEQ_FORM_LABEL_MAPPING.NEXTVAL, :data, :class, SYSDATE)";

f = open('iris_training.csv', 'r')
rdr = csv.reader(f)

for i, line in enumerate(rdr):
    if i != 0:

        data = line[0] + "," + line[1] + "," + line[2] + "," + line[3]
        cl = line[4]

        arr = []
        arr.append(data)
        arr.append(cl)

        curs.execute(sql,arr)
        print(line)

conn.commit()

f.close()