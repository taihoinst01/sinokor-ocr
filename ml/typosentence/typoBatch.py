# from symspell import SymSpell
import sys
import json
import re

def isfloat(value):
  try:
    float(value)
    return True
  except ValueError:
    return False

inputArr = json.loads(sys.argv[1])

for ocrItem in inputArr:

    ocrItem['originText'] = ocrItem['text']

    if(isfloat(re.sub('\ |\,|\)|\(', '', ocrItem['text']))):
        ocrItem['text'] = re.sub('\ |\,|\)|\(', '', ocrItem['text'])
    else:
        ocrItem['text'] = ocrItem['text']
print(str(inputArr))
