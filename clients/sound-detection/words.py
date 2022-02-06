from typing import Dict
from word import Word


words = [
    Word(["light on", "licht an", "licht on"], "light"),
    Word(["licht aus", "light off"], "light")
]

word_map: Dict["str", "Word"] = dict()


for defined_word in words:
    for alternative in defined_word.words:
        word_map["jarvis "+alternative] = defined_word

print("assembled word map")
