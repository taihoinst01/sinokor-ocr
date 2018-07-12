from domaindictrans import DomainDicTrans
import sys

#도메인 사전 번역
ddt = DomainDicTrans()

for word in sys.argv[1:]:
    print(ddt.lookup(word.split()))