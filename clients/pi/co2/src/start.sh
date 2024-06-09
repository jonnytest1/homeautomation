
# DBG_ARGS= --remote-debugging-port=9222 <- needs forwarding address only works headless
# nano ~/.config/wayfire.ini
# 
# [autostart]
# start_app = chromium-browser --kiosk $URL_TO_OPEN --Landscape=true --ignore-certificate-errors
# input_start= $HOME/starter.sh
# co2_start =$HOME/co2/starter.sh
cd "$HOME/co2"

python3 ./main.py >> "$HOME/co2/python-input.log"

