import cx_Oracle
import configparser

class MySQL:
    def __init__(self):
        self.conn = None
        try:
            self.conn = pymysql.connect(host='172.16.53.142', port=3307, user='root', passwd='1234', db='koreanreicr', cursorclass=pymysql.cursors.DictCursor)
            self.conn.autocommit(1)
        except pymysql.DatabaseError as exc:
            print(exc)
            exit()

    def selectDDT(self, sql, params):
        temp = {}
        try:
            cur = self.conn.cursor()
            cur.execute(sql, params)
        except cur.DatabaseError as sql_exception:
            print(sql_exception)
            return False

        for row in cur:
            temp = row
        cur.close()

        return temp

    def escapeString(self, arg):
        return self.conn.escape_string(str(arg))

    def lastInsertId(self):
        self.conn.insert_id()

    def afftectedRows(self):
        self.conn.affected_rows()

    def destroy(self):
        self.conn.close()

class Oracle:
    def __init__(self):
        self.conn = None

        config = configparser.ConfigParser()
        config.read('./ml/config.ini')

        id = config['ORACLE']['ID']
        pw = config['ORACLE']['PW']
        sid = config['ORACLE']['SID']
        ip = config['ORACLE']['IP']
        port = config['ORACLE']['PORT']

        connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

        try:
            self.conn = cx_Oracle.connect(connInfo)
            self.conn.autocommit
        except cx_Oracle.DatabaseError as exc:
            print(exc)
            exit()

    def selectDDT(self, sql, params):
        temp = {}
        try:
            cur = self.conn.cursor()
            cur.execute(sql, params)
        except cx_Oracle.DatabaseError as sql_exception:
            print(sql_exception)
            return False

        for row in cur:
            temp = str(row[0])
        cur.close()

        return temp

    def escapeString(self, arg):
        return self.conn.escape_string(str(arg))

    def lastInsertId(self):
        self.conn.insert_id()

    def afftectedRows(self):
        self.conn.affected_rows()

    def destroy(self):
        self.conn.close()