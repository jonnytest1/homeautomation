from datetime import datetime
from typing import List
from clap.util import millis, seconds_ago

from words import word_map


class InvalidWordException(Exception):

    def __init__(self, word: str):
        self.word = word


class SpeechEvent:

    def __init__(self, word: str, history: List["SpeechEvent"]):
        self.word_text = word

        if word_map.get(self.word_text) == None:
            for history_word in history:
                if(word_map.get(history_word.word_text+" "+self.word_text)):
                    print("overwriting from history " +
                          history_word.word_text+" "+self.word_text)
                    self.word_text = history_word.word_text+" "+self.word_text

        self.time = datetime.now()

    def seconds_ago(self):
        return seconds_ago(self.time)

    def dispatch(self):
        if word_map.get(self.word_text) == None:
            raise InvalidWordException(self.word_text)
        self.used_word = word_map[self.word_text]

        self.used_word.dispatch(self)
