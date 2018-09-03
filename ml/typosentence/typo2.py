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
inputArr = json.loads(sys.argv[1].encode("ascii","ignore").decode())
#inputArr = json.loads(sys.argv[1].replace(u"\u2022", u""))

for ocrItem in inputArr:
    tempSentence = ''
    for word in ocrItem['text'].split():
        word = word.encode("euc_kr", "replace")
        word = word.decode("euc_kr")

        curs.execute(sql,bind = word.lower())
        result = curs.fetchall()

        if (len(result) > 0):
            tempSentence = tempSentence + ' ' + word
        else:
            suggestion_list = ss.lookup(phrase=word.lower(), verbosity=1, max_edit_distance=1)

            #exist ml suggestion
            if (len(suggestion_list) > 0):
                tempSentence = tempSentence + ' ' + suggestion_list[0].term
            #no exist ml suggestion
            else:
                tempSentence = tempSentence + ' ' + word
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
