
from customlogging import LogLevel, logKibana
import datetime
import pygame
import pygame.camera
from pathlib import Path
# from pygame.locals import *
pygame.camera.init()


class CameraHandler:

    def __init__(self):

        self.cam = pygame.camera.Camera("/dev/video0", (640, 480))
        self.cam.start()
        self.imageBuffer: list[pygame.Surface] = []

    def getImage(self):
        image = self.cam.get_image()
        if(len(self.imageBuffer) > (30*55)):
            self.imageBuffer.pop(0)
        self.imageBuffer.append(image)

    def trigger(self, reqdata: dict):
        if (reqdata is not None) and "tag" in reqdata:
            tag: str = reqdata["tag"]
            triggertime = datetime.datetime.now().isoformat()
            print("storing "+str(len(self.imageBuffer))+" files for "+tag)
            logKibana(LogLevel.INFO, "storing " +
                      str(len(self.imageBuffer))+" files for "+tag)
            filePath = "/home/pi/imgcap/{}".format(tag)
            Path(filePath).mkdir(parents=True, exist_ok=True)
            for index in range(len(self.imageBuffer)):
                filename = "{}/{}_{}.jpg".format(filePath, triggertime, index)

                pygame.image.save(self.imageBuffer[index], filename)

            return None, None

        return "no tag", "text/plain"
