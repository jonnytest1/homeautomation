
from gpiozero import LED


class LEDs:
    # turns on asap (i.e. with python process)
    program_status: LED
    # idk
    connectionstatus: LED
    # turns on with mqtt connect
    mqtt_led: LED

    def init(self):
        self.mqtt_led = LED("GPIO26")
        self.program_status = LED("GPIO21")
        self. connectionstatus = LED("GPIO20")
        self.program_status.on()
        self.mqtt_led.off()


leds = LEDs()
