import cx_Oracle

id = "koreanre"
pw = "koreanre01"
sid = "koreanreocr"
# ip = "10.10.20.205"
ip = "172.16.53.142"
port = "1521"
connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

conn = cx_Oracle.connect(connInfo)
curs = conn.cursor()
rootFilePath = 'C:/ICR/image/MIG/MIG'

def getColumnMappingCls():
    try:
        sql = 'SELECT COLNAME, COLTYPE, COLNUM, POSITIONYN, ENTRYLABELYN FROM TBL_COLUMN_MAPPING_CLS'
        curs.execute(sql)
        colCls = curs.fetchall()

        return colCls

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'getEntryLabelYN table select fail',
                             'error': str(e).replace("'", "").replace('"', '')}))

def getEntryLabelYN(colNum):
    try:
        sql = 'SELECT COLNAME, COLTYPE, COLNUM, POSITIONYN, ENTRYLABELYN FROM TBL_COLUMN_MAPPING_CLS WHERE COLNUM = :colNum'
        curs.execute(sql, {"colNum":colNum})
        entryLabelYN = curs.fetchall()

        return entryLabelYN

    except Exception as e:
        raise Exception(str({'code': 500, 'message': 'getEntryLabelYN table select fail',
                             'error': str(e).replace("'", "").replace('"', '')}))