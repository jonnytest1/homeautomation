from datetime import datetime, timedelta
from typing import Optional
from watchdog.events import FileSystemEvent, PatternMatchingEventHandler
import asyncio
from FileChangeEvent import FileChangeEvent


class AsyncEventHandler(PatternMatchingEventHandler):

    last_event_path: str = ""
    last_event_time: datetime = datetime.utcfromtimestamp(0)

    def __init__(self, queue: asyncio.Queue,
                 loop: Optional[asyncio.AbstractEventLoop] = None):
        self.queue = queue
        self.loop = loop

        super().__init__(patterns=["*", "!.history"],
                         ignore_patterns=None, ignore_directories=True, case_sensitive=True)

    def addToQueue(self, path):
        if (self.loop != None):
            self.loop.call_soon_threadsafe(
                self.queue.put_nowait, FileChangeEvent(path=path))

    def on_created(self, event: FileSystemEvent):
        print("created")
        # print(event)
        self.addToQueue(event.src_path)

    def on_deleted(self, event):
        print("deleted")
        # print(event)
        self.addToQueue(event.src_path)

    def on_modified(self, event):
        if (self.last_event_path == event.src_path and self.last_event_time > datetime.now() - timedelta(milliseconds=50)):
            return

        self.last_event_path = event.src_path
        self.last_event_time = datetime.now()
        # print(self.last_event_time)
        print("modified")
        # print(event)
        self.addToQueue(event.src_path)

    def on_moved(self, event):
        print("moved")
        print(event)
        self.addToQueue(event.src_path)
        self.addToQueue(event.dest_path)


class EventIterator(object):
    def __init__(self, queue: asyncio.Queue,
                 loop: Optional[asyncio.BaseEventLoop] = None):
        self.queue = queue

    def __aiter__(self):
        return self

    async def __anext__(self):
        item = await self.queue.get()

        if item is None:
            raise StopAsyncIteration

        return item
