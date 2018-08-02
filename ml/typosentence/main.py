from domaindictrans import DomainDicTrans
import sys

#도메인 사전 번역
ddt = DomainDicTrans()

for word in sys.argv[1:]:
    word = word.encode('euc_kr','replace')
    word = word.decode('euc_kr')
    print(ddt.lookup(word.split()))