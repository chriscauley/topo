import ezdxf, json, sys
PATH = 'topo.dxf'

dwg = ezdxf.readfile(PATH)
modelspace = dwg.modelspace()
matches = 0
nope = 0
lines = []
x_max = y_max = -sys.maxint - 1
x_min = y_min = sys.maxint
threshold = 1
threshold = threshold
for e in modelspace:
  if e.dxftype() == "LWPOLYLINE":
    geometry = [list(i)[:2] for i in e.get_points()]
    x,y = zip(*geometry)
    x_max = max(x_max,max(x))
    y_max = max(y_max,max(y))
    x_min = min(x_min,min(x))
    y_min = min(y_min,min(y))
    lines.append([x,y])
    #if geometry[0] == geometry[-1]:
    #else:
    #  lines['open'].append([x,y])
  elif e.dxftype() == "LINE":
    geometry = [e.dxf.start,e.dxf.end]
  else:
    continue

def close_loops():
  out = False
  for obj in lines:
    x_dist = abs(obj[0][0]-obj[0][-1])
    y_dist = abs(obj[1][0]-obj[1][-1])
    if (not x_dist+y_dist):
      continue
    distance = (x_dist**2+y_dist**2)**0.5
    if distance < threshold:
      obj[0].append(obj[0][0])
      obj[1].append(obj[1][0])
      out = True
  return out

def connect_neighbors():
  global lines
  delete_me = []
  keep = []
  for ii,obj in enumerate(lines):
    for i2,obj2 in enumerate(lines[ii:]):
      io=ii+i2
      if i2 == 0:
        continue
      if io in delete_me:
        continue
      aa = ((obj[0][0]-obj2[0][0])**2+(obj[1][0]-obj2[1][0])**2)**0.5 < threshold
      ab = ((obj[0][0]-obj2[0][-1])**2+(obj[1][0]-obj2[1][-1])**2)**0.5 < threshold
      ba = ((obj[0][-1]-obj2[0][0])**2+(obj[1][-1]-obj2[1][0])**2)**0.5 < threshold
      bb = ((obj[0][-1]-obj2[0][-1])**2+(obj[1][-1]-obj2[1][-1])**2)**0.5 < threshold
      aa = False
      if aa: # first and first match
        obj[0] = obj[0][::-1] + obj2[0]
        obj[1] = obj[1][::-1] + obj2[1]
        delete_me.append(io);keep.append(ii)
      if ab: # first and last match
        obj[0] = obj2[0] + obj[0]
        obj[1] = obj2[1] + obj[1]
        delete_me.append(io);keep.append(ii)
      if ba: # last and first match
        obj[0] = obj[0] + obj2[0]
        obj[1] = obj[1] + obj2[1]
        delete_me.append(io);keep.append(ii)
      if bb: # last and last match
        obj[0] = obj[0] + obj2[0][::-1] 
        obj[1] = obj[1] + obj2[1][::-1] 
        delete_me.append(io);keep.append(ii)
  delete_me = set(delete_me)-set(keep)
  lines = [l for i,l in enumerate(lines) if not i in delete_me]
  return delete_me

print close_loops()
"""
print connect_neighbors()

print close_loops()
print connect_neighbors()
#"""
data = {
  'x_max': (x_max-x_min),
  'y_max': (y_max-y_min),
  'polylines': lines
}

with open('data.json','w') as f:
  f.write(json.dumps(data))
