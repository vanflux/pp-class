import golly as g
from glife import *
import json

selrect = g.getselrect()
if len(selrect) == 0: g.exit("There is no selection.")

data = g.getcells(g.getrect())

print('data', data)

with open('input.txt', 'w') as filehandle:
    json.dump(data, filehandle)
