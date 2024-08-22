# https://github.com/alphacep/vosk-api/blob/master/python/example/test_microphone.py
import sounddevice as sd
from words import word_map
from speechevent import InvalidWordException, SpeechEvent
from registration import register
import json
import sys
import queue
from typing import List
import time

import vosk


decoder = json.decoder.JSONDecoder()
# register()
time.sleep(1)
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
args["device"] = device_info["name"]
history: List[SpeechEvent] = []

device_id = sd._get_device_id(args["device"], "input", raise_on_error=False)
if device_id == -1:
    device_id = 1
with sd.RawInputStream(samplerate=args["samplerate"], blocksize=8000, device=device_id, dtype='int16',
                       channels=1, callback=callback):
    print('#' * 80)
    print('Press Ctrl+C to stop the recording')
    print('#' * 80)
    time.sleep(1)
    word_list = json.encoder.JSONEncoder().encode(list(word_map.keys()))
    for word in list(word_map.keys()):
        print(word)
    rec = vosk.KaldiRecognizer(model, args["samplerate"], word_list)
    while True:
        data = queue.get()

        if rec.AcceptWaveform(data):
            text = decoder.decode(rec.Result())["text"]
        else:
            text = decoder.decode(rec.PartialResult())["partial"]

        if len(text) > 0:
            print(text)
            try:
                history = [x for x in history if x.seconds_ago() < 3]

                speechEvent = SpeechEvent(text, history)
                already_triggered = False
                for event in history:
                    if speechEvent.word_text == event.word_text:
                        already_triggered = True
                        break

                if not already_triggered:
                    history.append(speechEvent)
                    speechEvent.dispatch()
                    history = []
                    print(speechEvent.used_word.trigger)
            except InvalidWordException as e:
                print("not a word "+e.word)
