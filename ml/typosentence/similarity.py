import nltk, string
from sklearn.feature_extraction.text import TfidfVectorizer
import json
import sys
#import scipy
import re, math
from collections import Counter

WORD = re.compile(r'\w+')

def get_cosine(vec1, vec2):
     intersection = set(vec1.keys()) & set(vec2.keys())
     numerator = sum([vec1[x] * vec2[x] for x in intersection])

     sum1 = sum([vec1[x]**2 for x in vec1.keys()])
     sum2 = sum([vec2[x]**2 for x in vec2.keys()])
     denominator = math.sqrt(sum1) * math.sqrt(sum2)

     if not denominator:
        return 0.0
     else:
        return float(numerator) / denominator

def text_to_vector(text):
     words = WORD.findall(text)
     return Counter(words)


#similarity
nltk.download('punkt') # if necessary...

stemmer = nltk.stem.porter.PorterStemmer()
remove_punctuation_map = dict((ord(char), None) for char in string.punctuation)
#
def stem_tokens(tokens):
     return [stemmer.stem(item) for item in tokens]

# '''remove punctuation, lowercase, stem'''
def normalize(text):
     return stem_tokens(nltk.word_tokenize(text.lower().translate(remove_punctuation_map)))
#
vectorizer = TfidfVectorizer(tokenizer=normalize, stop_words='english')

def cosine_sim(text1, text2):
    tfidf = vectorizer.fit_transform([text1, text2], True)
    return ((tfidf * tfidf.T).A)[0,1]


retMlExportArr = []
legacyArr = json.loads(sys.argv[1].encode("ascii","ignore").decode())
inputArr = json.loads(sys.argv[2].encode("ascii","ignore").decode())

# legacyArr = json.loads(legacy.replace(u"\u2022", u""))
# inputArr = json.loads(input.replace(u"\u2022", u""))
for legacyItem in legacyArr[0]['rows']:
    retRow = []
    for key in legacyItem:
        # if (legacyItem[key] is None):
        #     print('')
        if (legacyItem[key] != None and legacyItem[key].strip() != '0.00'):
            maxaccu = 0
            maxText = ''
            maxLocation = ''
            for inputItem in inputArr:
                accu = get_cosine(text_to_vector(legacyItem[key].lower()), text_to_vector(inputItem['text'].lower()))
                if (accu > maxaccu):
                    maxText = inputItem['text']
                    maxLocation = inputItem['location']
                    maxSid = inputItem['sid']
                    maxaccu = accu

            if (maxaccu > 0.6):
                tempDict = {}
                tempDict['label'] = key
                tempDict['text'] = maxText
                tempDict['location'] = maxLocation
                tempDict['sid'] = maxSid
                retRow.append(tempDict)
    retMlExportArr.append(retRow)
print(str(retMlExportArr))