
from gpiozero import LED

mqtt_led = LED("GPIO26")


status = LED("GPIO21")
status.on()
connectionstatus = LED("GPIO20")

mqtt_led.off()
