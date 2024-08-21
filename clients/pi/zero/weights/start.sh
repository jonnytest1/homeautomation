#!/usr/bin/env bash
echo "starting server"

# sudo crontab -e
# > @reboot /home/jonathan/weights/start.sh &
#
# > journalctl -b to get logs since boot
cd /home/jonathan/weights
sleep 1
python3 ./main.py >> /home/jonathan/weights/python-input.log 2>&1 &