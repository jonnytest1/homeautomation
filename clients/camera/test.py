import pygame
import pygame.camera
import datetime
pygame.camera.init()
pygame.camera.list_cameras()  # Camera detected or not
cam = pygame.camera.Camera("/dev/video0", (320, 240))
cam.start()
print(datetime.datetime.now().isoformat())
img = cam.get_image()
print(datetime.datetime.now().isoformat())
pygame.image.save(img, "filename.jpg")
print(datetime.datetime.now().isoformat())
