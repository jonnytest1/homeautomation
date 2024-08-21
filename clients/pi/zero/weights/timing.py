

from dataclasses import dataclass
from threading import Thread
from time import sleep

from sensor_thread import read_sensor_data
from smarthome import SmartHome
from weight_entry import WeightEntry


MAX_NUM = 999999999999

telemetry_time_secs = 20


@dataclass()
class WeightTelemetry():
    max: float
    min: float
    avg: float

    def to_json(self):
        return dict(max=self.max, min=self.min, avg=self.avg)


def sensor_listener(sm: SmartHome):

    sensor_data: list[WeightEntry] = []
    sensor_thread = Thread(target=read_sensor_data, args=[
                           sensor_data, telemetry_time_secs])
    sensor_thread.start()

    while True:
        sleep(telemetry_time_secs)

        max_a = -1
        min_a = MAX_NUM
        avg_a = 0

        max_b = -1
        min_b = MAX_NUM
        avg_b = 0

        sensor_len = len(sensor_data)

        if sensor_len < 3:
            continue

        for res in sensor_data:
            if abs(res.weight_a - res.weight_b) > 1500:
                print(f"skipped frame {res.weight_a} {res.weight_b}")
                sensor_len -= 1
                continue

            if res.weight_a < min_a:
                min_a = res.weight_a

            if res.weight_a > max_a:
                max_a = res.weight_a
            avg_a = avg_a+res.weight_a
            if res.weight_b < min_b:
                min_b = res.weight_b

            if res.weight_b > max_b:
                max_b = res.weight_b
            avg_b = avg_b+res.weight_b

        avg_a /= sensor_len
        avg_b /= sensor_len

        data = dict(
            a=WeightTelemetry(max_a, min_a, avg_a),
            b=WeightTelemetry(max_b, min_b, avg_b),
            combined=WeightTelemetry(max_b+max_a, min_b+min_a, avg_b+avg_a),

        )
        print(data, sensor_len)
        sm.update_telemetry(data)
