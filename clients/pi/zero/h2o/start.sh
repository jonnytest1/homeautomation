#!/usr/bin/env bash
echo "starting server"

# sudo nano /etc/rc.local
# sudo python /home/jonathan/h20/start.sh &
#
cd /home/jonathan/h20
sleep 3
python3 ./main.py >> /home/jonathan/h20/python-input.log 2>&1