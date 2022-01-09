from datetime import datetime

from words import word_map


class SpeechEvent:

    def __init__(self, word: str):
        self.used_word = word_map[word]

        self.time = datetime.now()

    def millis(self):
        return int((self.time - datetime(1970, 1, 1)).total_seconds() * 1000)

    def seconds_ago(self):
        return (datetime.now()-self.time).total_seconds()

    def dispatch(self):
        self.used_word.dispatch(self)
