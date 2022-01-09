# https://github.com/alphacep/vosk-api/blob/master/python/example/test_microphone.py
import sounddevice as sd
from words import word_map
from speechevent import SpeechEvent
from registration import register
import json
import sys
import queue
from typing import List

import vosk


decoder = json.decoder.JSONDecoder()

register()

model = vosk.Model("model")
queue = queue.Queue()
args = {
    "device": None
}


def callback(indata, frames, time, status):
    """This is called (from a separate thread) for each audio block."""
    if status:
        print(status, file=sys.stderr)
    queue.put(bytes(indata))


device_info = sd.query_devices(args["device"], 'input')
args["samplerate"] = int(device_info['default_samplerate'])

history: List[SpeechEvent] = []

with sd.RawInputStream(samplerate=args["samplerate"], blocksize=8000, device=args["device"], dtype='int16',
                       channels=1, callback=callback):
    print('#' * 80)
    print('Press Ctrl+C to stop the recording')
    print('#' * 80)

    word_list = json.encoder.JSONEncoder().encode(list(word_map.keys()))
    rec = vosk.KaldiRecognizer(model, args["samplerate"], word_list)
    while True:
        data = queue.get()

        if rec.AcceptWaveform(data):
            text = decoder.decode(rec.Result())["text"]
        else:
            text = decoder.decode(rec.PartialResult())["partial"]

        if len(text) > 0:

            history = [x for x in history if x.seconds_ago() < 2]
            speechEvent = SpeechEvent(text)
            already_triggered = False
            for event in history:
                if speechEvent.used_word == event.used_word:
                    already_triggered = True
                    break

            if not already_triggered:
                history.append(speechEvent)
                print(speechEvent.used_word.trigger)
                speechEvent.dispatch()
