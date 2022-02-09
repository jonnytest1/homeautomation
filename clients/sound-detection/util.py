from datetime import datetime


def millis(of_time: datetime):
    return int((of_time - datetime(1970, 1, 1)).total_seconds() * 1000)


def seconds_ago(of_time: datetime):
    return (datetime.now()-of_time).total_seconds()
