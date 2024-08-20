in C:\Python39\Lib\smarthome

# i just symlinked it from the Lib dir
mklink /D "C:\Python39\Lib\smarthome\impl" "...\homeautomation\lib\python"



in my case i made a smarthome dir with __init__.py 

with content 

```python

from .impl.smarthome import *

```