import nltk, string
from sklearn.feature_extraction.text import TfidfVectorizer
import json
import sys
#import scipy

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
    tfidf = vectorizer.fit_transform([text1, text2])
    return ((tfidf * tfidf.T).A)[0,1]

input = '[{"location":"2974,20,66,31","text":"page"},{"location":"1594,201,683,47","text":"reinsurers outstanding losses"},{"location":"1596,259,174,29","text":"28/06/2018"},{"location":"3178,16,11,26","text":"1"},{"location":"3072,392,149,27","text":"remarks"},{"location":"3296,20,10,24","text":"1"},{"location":"218,305,1136,39","text":"010 872 2079 oo korean reinsurance co."},{"location":"208,385,191,31","text":"al sagr"},{"location":"1154,384,470,32","text":"share os losses 100%"},{"location":"1741,385,258,31","text":"os losses/shr"},{"location":"1946,536,77,24","text":"2120"},{"location":"1929,616,92,24","text":"303.70"},{"location":"1963,696,58,26","text":"3.65"},{"location":"1932,777,92,28","text":"115.80"},{"location":"1932,859,90,25","text":"124.29"},{"location":"1906,940,116,30","text":"1,069.76"},{"location":"1905,1025,117,31","text":"1,638.40"},{"location":"1930,1144,93,24","text":"350.00"},{"location":"1928,1228,94,25","text":"350.00"},{"location":"1930,1345,91,26","text":"418.15"},{"location":"1929,1432,95,24","text":"418.15"},{"location":"1902,1502,121,31","text":"2,406.55"},{"location":"2269,385,110,33","text":"ibnr"},{"location":"220,474,32,24","text":"72"},{"location":"336,473,248,25","text":"engineering"},{"location":"228,536,212,24","text":"p 2004 01377"},{"location":"227,697,213,27","text":"p 2005 01377"},{"location":"225,860,215,27","text":"p 2006 01377"},{"location":"221,1080,241,24","text":"74 cargo"},{"location":"228,1144,212,24","text":"p 2005 01377"},{"location":"221,1283,211,28","text":"75 hull"},{"location":"227,1345,213,27","text":"p 2004 01377"},{"location":"476,1144,39,24","text":"co"},{"location":"560,534,211,27","text":"quota share"},{"location":"560,616,132,23","text":"surplus"},{"location":"560,696,211,27","text":"quota share"},{"location":"560,776,131,24","text":"surplus"},{"location":"560,856,211,30","text":"quota share"},{"location":"562,937,129,23","text":"surplus"},{"location":"560,1140,241,29","text":"cargo q/share"},{"location":"560,1344,216,32","text":"hull q/share"},{"location":"1165,536,109,24","text":"005.000"},{"location":"1165,616,109,24","text":"005.000"},{"location":"1165,697,109,25","text":"005.000"},{"location":"1165,776,110,28","text":"005.000"},{"location":"1165,858,109,30","text":"002.500"},{"location":"1165,936,109,30","text":"002.500"},{"location":"844,1024,275,32","text":"sub total by cob"},{"location":"1165,1144,109,24","text":"005.000"},{"location":"844,1227,275,33","text":"sub total by cob"},{"location":"1165,1344,110,28","text":"005.000"},{"location":"843,1430,275,33","text":"sub total by cob"},{"location":"1525,536,93,24","text":"424.00"},{"location":"1499,616,119,30","text":"6,074.00"},{"location":"1543,696,74,26","text":"73.00"},{"location":"1498,776,119,31","text":"2,316.00"},{"location":"1499,859,119,29","text":"4, 971.54"},{"location":"1480,938,139,32","text":"42,790.57"},{"location":"1482,1025,134,31","text":"56,649.11"},{"location":"1500,1228,118,33","text":"7,000.00"},{"location":"1500,1344,117,32","text":"8,363.00"},{"location":"1498,1432,120,30","text":"8,363.00"},{"location":"1482,1502,134,33","text":"72,012.11"},{"location":"2488,1025,41,27","text":".00"},{"location":"2488,1228,41,25","text":".00"},{"location":"2488,1432,42,23","text":".00"},{"location":"2488,1503,41,23","text":".00"},{"location":"2581,393,62,35","text":"ccy"},{"location":"2576,536,70,24","text":"aed"},{"location":"2576,616,70,24","text":"aed"},{"location":"2576,696,69,26","text":"aed"},{"location":"2576,776,69,28","text":"aed"},{"location":"2576,858,71,26","text":"aed"},{"location":"2576,940,71,27","text":"aed"},{"location":"2576,1026,71,25","text":"aed"},{"location":"2576,1144,70,24","text":"aed"},{"location":"2576,1228,72,25","text":"aed"},{"location":"2576,1344,69,28","text":"aed"},{"location":"2576,1432,72,24","text":"aed"},{"location":"2576,1502,72,26","text":"aed"},{"location":"2712,534,154,26","text":"31/03/2018"},{"location":"2712,614,154,26","text":"31/03/2018"},{"location":"2712,696,154,26","text":"31/03/2018"},{"location":"2712,776,154,26","text":"31/03/2018"},{"location":"2712,858,153,30","text":"31/03/2018"},{"location":"2712,938,153,30","text":"31/03/2018"},{"location":"2712,1140,153,28","text":"31/03/2018"},{"location":"2712,1344,154,26","text":"31/03/2018"},{"location":"832,1501,277,31","text":"total by cedant in"},{"location":"656,2238,481,42","text":"nasco karaoglan france"},{"location":"656,2286,678,34","text":"171 rue de euzenval 92380 garches"},{"location":"652,2334,370,34","text":"t +33 147 oo"},{"location":"652,2380,359,33","text":"mm.nkfrance.com"},{"location":"2432,2331,180,23","text":"cso`s 31"},{"location":"1911,2360,670,21","text":"it. zzzz"},{"location":"1967,2389,323,21","text":"zzz z-0i.ae •z:"}]'
legacy = '[{"0":"reinsure outstand","1":"sfsdfssfsfdsd"},{"0":"dfgdfg","1":"28062018"}]'


retMlExportArr = []
legacyArr = json.loads(legacy.replace(u"\u2022", u""))
inputArr = json.loads(input.replace(u"\u2022", u""))
for legacyItem in legacyArr:
    for i in range(0, 36):
        if str(i) in legacyItem.keys():
            maxaccu = 0
            maxText = ''
            maxLocation = ''
            for inputItem in inputArr:
                accu = cosine_sim(legacyItem[str(i)], inputItem['text'])
                if (accu > maxaccu):
                    maxText = inputItem['text']
                    maxLocation = inputItem['location']
                    maxaccu = accu

            if (maxaccu > 0):
                tempDict = {}
                tempDict['label'] = str(i)
                tempDict['text'] = maxText
                tempDict['location'] = maxLocation
                retMlExportArr.append(tempDict)

print(retMlExportArr)

