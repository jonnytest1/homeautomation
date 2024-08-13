
from gpiozero import LED


relay = LED("GPIO17")


led = LED("GPIO26")


status = LED("GPIO21")
status.on()
connectionstatus = LED("GPIO20")
