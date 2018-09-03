from symspell import SymSpell
import sys
import cx_Oracle
import configparser
import json
import os
import re
#오타 수정
ss = SymSpell(max_dictionary_edit_distance=1)
ss.load_words_with_freq_from_json_and_build_dictionary()

textList = []
#with open('frequency_dictionary_en_82_765.txt') as f:
#    for line in f:
#        line = line.split(" ")
#        textList.append(line[0])

#print(textList.__contains__("infinity"))
def isfloat(value):
  try:
    float(value)
    return True
  except ValueError:
    return False

config = configparser.ConfigParser()
mlroot = os.path.dirname(os.path.abspath(os.path.dirname(__file__)))
config.read(mlroot + '\\config.ini')

id = config['ORACLE']['ID']
pw = config['ORACLE']['PW']
sid = config['ORACLE']['SID']
ip = config['ORACLE']['IP']
port = config['ORACLE']['PORT']

connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid

conn = cx_Oracle.connect(connInfo)
curs = conn.cursor()

sql = "SELECT SEQNUM FROM TBL_OCR_SYMSPELL WHERE KEYWORD = :bind"

# inputArr = json.loads(sys.argv[1].encode("ascii","ignore").decode())
arg = '[{"location":"1018,240,411,87","text":"apex"},{"location":"1019,338,409,23","text":"partner of choice"},{"location":"1562,509,178,25","text":"voucher no"},{"location":"1562,578,206,25","text":"voucher date"},{"location":"206,691,274,27","text":"4153 korean re"},{"location":"208,756,525,34","text":"proportional treaty statement"},{"location":"1842,506,344,25","text":"bv/heo/2018/05/0626"},{"location":"1840,575,169,25","text":"01105/2018"},{"location":"206,848,111,24","text":"cedant"},{"location":"206,908,285,24","text":"class of business"},{"location":"210,963,272,26","text":"period of quarter"},{"location":"207,1017,252,31","text":"period of treaty"},{"location":"206,1066,227,24","text":"our reference"},{"location":"226,1174,145,31","text":"currency"},{"location":"227,1243,139,24","text":"premium"},{"location":"226,1303,197,24","text":"commission"},{"location":"226,1366,107,24","text":"claims"},{"location":"227,1426,126,24","text":"reserve"},{"location":"227,1489,123,24","text":"release"},{"location":"227,1549,117,24","text":"interest"},{"location":"227,1609,161,31","text":"brokerage"},{"location":"233,1678,134,24","text":"portfolio"},{"location":"227,1781,124,24","text":"balance"},{"location":"574,847,492,32","text":": solidarity- first insurance 2018"},{"location":"574,907,568,32","text":": marine cargo surplus 2018 - inward"},{"location":"598,959,433,25","text":"01-01-2018 to 31-03-2018"},{"location":"574,1010,454,25","text":": 01-01-2018 to 31-12-2018"},{"location":"574,1065,304,25","text":": apex/bord/2727"},{"location":"629,1173,171,25","text":"jod 1.00"},{"location":"639,1239,83,25","text":"25.53"},{"location":"639,1299,64,25","text":"5.74"},{"location":"639,1362,64,25","text":"0.00"},{"location":"639,1422,64,25","text":"7.66"},{"location":"639,1485,64,25","text":"0.00"},{"location":"639,1545,64,25","text":"0.00"},{"location":"639,1605,64,25","text":"0.64"},{"location":"648,1677,64,25","text":"0.00"},{"location":"641,1774,81,25","text":"11 .49"},{"location":"1706,1908,356,29","text":"apex insurance"}]'
inputArr = json.loads(arg)

for ocrItem in inputArr:
    tempSentence = ''
    # for word in ocrItem['text'].split():
    #     word = word.encode("euc_kr", "replace")
    #     word = word.decode("euc_kr")
    #
    #     curs.execute(sql,bind = word.lower())
    #     result = curs.fetchall()
    #
    #     if (len(result) > 0):
    #         tempSentence = tempSentence + ' ' + word
    #     else:
    #         suggestion_list = ss.lookup(phrase=word.lower(), verbosity=1, max_edit_distance=1)
    #
    #         #exist ml suggestion
    #         if (len(suggestion_list) > 0):
    #             tempSentence = tempSentence + ' ' + suggestion_list[0].term
    #         #no exist ml suggestion
    #         else:
    #             tempSentence = tempSentence + ' ' + word
    ocrItem['originText'] = ocrItem['text']
    # if(isfloat(re.sub('\ |\,|\)|\(', '', tempSentence.strip()))):
    #     ocrItem['text'] = re.sub('\ |\,|\)|\(', '', tempSentence.strip())
    # else:
    #     ocrItem['text'] = tempSentence.strip()
    if(isfloat(re.sub('\ |\,|\)|\(', '', ocrItem['text']))):
        ocrItem['text'] = re.sub('\ |\,|\)|\(', '', ocrItem['text'])
    else:
        ocrItem['text'] = ocrItem['text']
print(str(inputArr))
