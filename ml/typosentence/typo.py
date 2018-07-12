from symspell import SymSpell
import sys

#오타 수정
ss = SymSpell(max_dictionary_edit_distance=2)
ss.load_words_with_freq_from_json_and_build_dictionary()

textList = []
with open('frequency_dictionary_en_82_765.txt') as f:
    for line in f:
        line = line.split(" ")
        textList.append(line[0])

print(textList.__contains__("infinity"))

for originword in sys.argv[1:]:
    for word in originword.split():
        if(textList.__contains__(word) == False):
            suggestion_list = ss.lookup(phrase=word, verbosity=1, max_edit_distance=2)
            for suggestion in suggestion_list:
                print(originword + '^' + word + '^' + str(suggestion))