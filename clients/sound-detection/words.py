from typing import Dict
from word import Word


words = [
    Word(["light", "licht"], "light")
]

word_map: Dict["str", "Word"] = dict()


for defined_word in words:
    for alternative in defined_word.words:
        word_map[alternative] = defined_word

print("assembled word map")
