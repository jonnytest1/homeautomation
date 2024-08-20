import asyncio
from typing import Coroutine, List, Union

from FileChangeEvent import FileChangeEvent
from asyncEventHandler import AsyncEventHandler, EventIterator
from watchdog.observers import Observer, api
from copylibs import copy_all
from os.path import join, dirname, realpath
loop = asyncio.get_event_loop()
queue = asyncio.Queue(loop=loop)


observerList: List[api.BaseObserver] = []
watchdir = realpath(join(dirname(__file__), "../python"))


async def on_file_change(path: str):
    if ".history" in path or path.endswith(".tmp"):
        return
    print("filechange "+path)
    copy_all(watchdir)


async def consume(queue: asyncio.Queue):
    async for event in EventIterator(queue):
        evt: FileChangeEvent = event
        # print("queue item"+evt.path)
        task = loop.create_task(on_file_change(evt.path))

        await task


def watch(queue: asyncio.Queue, loop: asyncio.AbstractEventLoop):
    # Watch directory for changes
    handler = AsyncEventHandler(queue, loop)

    observer = Observer()
    observer.schedule(
        handler, watchdir, recursive=True)
    observer.start()


futureList: List[Union[asyncio.Future, Coroutine]] = [
    consume(queue)
]

futureList.append(loop.run_in_executor(None, watch, queue, loop))

try:
    loop.run_until_complete(asyncio.gather(*futureList))
except KeyboardInterrupt:
    loop.stop()
    for observer in observerList:
        observer.stop()
        observer.join()
