
from gpiozero import LED


mqtt_led: LED = None  # type: ignore


status: LED = None  # type: ignore
connectionstatus: LED = None  # type: ignore


def init_gpios():
    global connectionstatus
    global mqtt_led
    global status
    mqtt_led = LED("GPIO26")
    status = LED("GPIO21")
    connectionstatus = LED("GPIO20")
    status.on()
    mqtt_led.off()
