import bpy, math, random, os, json
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
random.seed(27)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
    if c.name != 'Collection': bpy.data.collections.remove(c)
base = bpy.data.collections.get('Collection')
base.name = '00 · 环境与灯光'
collections = {'env': base}
for key, name in [('terrain','01 · 方块地形'), ('water','02 · 河流与瀑布'), ('house','03 · 林间小屋'), ('bridge','04 · 小桥与道路'), ('trees','05 · 方块树林'), ('farm','06 · 麦田与围栏'), ('props','07 · 花草与动物')]:
    c=bpy.data.collections.new(name); bpy.context.scene.collection.children.link(c); collections[key]=c

def linear(v): return v/12.92 if v<0.04045 else ((v+.055)/1.055)**2.4
def rgb(h): return tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4))
materials=[]
def material(name, color, rough=.85, metallic=0, emission=0, transmission=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*rgb(color),1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*rgb(color),1)
    p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metallic
    p.inputs['Transmission Weight'].default_value=transmission
    if emission:
        p.inputs['Emission Color'].default_value=(*rgb(color),1); p.inputs['Emission Strength'].default_value=emission
    materials.append(m); return len(materials)-1
def palette(name, colors, **kw): return [material(name+' '+str(i+1),c,**kw) for i,c in enumerate(colors)]
grass=palette('草方块', ['72A843','7CAF49','66973D','82B44D','78A747','709D40'])
earth=palette('泥土', ['79513A','82563B','936044','704934','8A5B40','A16B48'])
stone=palette('岩石', ['757C7D','858B89','687275','93958C','7E8584'])
coal=palette('煤矿', ['40484A','354044','596061'])
iron=palette('铁矿', ['C58D6C','B5795D'])
wood=palette('橡木木板', ['AD7944','BA884D','BF8F53','A7743F','C79A5B'])
log=palette('树皮与原木', ['5F402C','705033','765234','65432C'])
end=palette('原木端面', ['B58A55','C59A62','A97A49'])
roof=palette('陶瓦', ['B65B38','C36B3E','A75031','CB7646','B76137'])
leaf=palette('橡树叶', ['508943','5B9445','679C49','497E3F','719F4B'])
pine=palette('松针', ['35634D','3B7052','427C58','386B50'])
birch=palette('白桦', ['E8DEBF','D9D1B9','F3E9CE'])
path=palette('泥土小径', ['C2A16A','B19460','CEB17C','BA9E6B'])
sand=palette('河岸沙土', ['D4C28F','C8B687','DDCFA6'])
soil=palette('耕地', ['63422D','735137','805C3A'])
wheat=palette('金色麦田', ['D7AC49','E9C45D','C5A24B','F0D078'])
white=palette('羊毛', ['F0EADC','E1DED0','FAF3E3'])
face=palette('羊脸', ['9E9383','B7AA93'])
black=material('煤黑','293D3D')
red=material('虞美人','E95D44'); yellow=material('黄色花蕊','F6C765'); flowerwhite=material('雏菊','FFF2D9')
stems=material('草茎','4F793E')
water=material('河水 · 青蓝', '389CA8', rough=.18, metallic=.12, transmission=.22)
waterdark=material('瀑布 · 青蓝','3FA1B0',rough=.2,transmission=.12)
glint=material('水面反光','A0D7D3',rough=.3)
foam=material('瀑布泡沫','D2EEDE',rough=.55)
glass=material('窗户 · 天蓝玻璃','94C8C2',rough=.2, metallic=.15)
glow=material('灯笼 · 暖光','FFC56F',rough=.4,emission=2.5)
trim=material('深色木框','4E382B')
pumpkin=palette('南瓜',['D98232','C5712E','E5973C'])
cloud=material('方块云','EEF3E8')
backdrop=material('背景 · 青灰','B5CBCD',rough=1)

FACES=[[(0,0,0),(0,0,1),(0,1,1),(0,1,0)],[(1,0,0),(1,1,0),(1,1,1),(1,0,1)],[(0,0,0),(1,0,0),(1,0,1),(0,0,1)],[(0,1,0),(0,1,1),(1,1,1),(1,1,0)],[(0,0,0),(0,1,0),(1,1,0),(1,0,0)],[(0,0,1),(1,0,1),(1,1,1),(0,1,1)]]
class Mesh:
    def __init__(self,name,col): self.name=name; self.col=col; self.v=[]; self.f=[]; self.m=[]
    def quad(self,vs,mat):
        n=len(self.v); self.v.extend(vs); self.f.append(tuple(range(n,n+4))); self.m.append(mat)
    def box(self,lo,size,mat,px=1,visible=None,selector=None):
        for side,fc in enumerate(FACES):
            if visible is not None and side not in visible: continue
            a=Vector(fc[0]); u=Vector(fc[1])-a; v=Vector(fc[3])-a
            for j in range(px):
                for i in range(px):
                    coords=[]
                    for s,t in [(i,j),(i+1,j),(i+1,j+1),(i,j+1)]:
                        p=a+u*s/px+v*t/px
                        coords.append(tuple(lo[k]+p[k]*size[k] for k in range(3)))
                    mi=selector(side,i,j,coords) if selector else random.choice(mat) if isinstance(mat,list) else mat
                    self.quad(coords,mi)
    def finish(self):
        if not self.v:return None
        me=bpy.data.meshes.new(self.name); me.from_pydata(self.v,[],self.f); me.update()
        used=sorted(set(self.m)); mp={m:i for i,m in enumerate(used)}
        for m in used: me.materials.append(materials[m])
        for p,m in zip(me.polygons,self.m):p.material_index=mp[m]
        ob=bpy.data.objects.new(self.name,me); collections[self.col].objects.link(ob); return ob
def box(name,col,lo,size,mat,px=1):
    b=Mesh(name,col);b.box(lo,size,mat,px);return b.finish()

# Heights refer to the top surface of each voxel column.
heights={}
def river_x(y):return 2.6+1.25*math.sin((y+2)*.28)
for x in range(-14,14):
    for y in range(-11,12):
        if abs(x)>11 and (y<-9 or y>9):continue
        h=2
        if x<0 and y>=1:h=3
        if x<-3 and y>=8:h=4
        if x>=7 and y>=1:h=3
        if x>=8 and y>=3:h=4
        if x>=9 and y>=5:h=5
        if x>=10 and y>=7:h=6
        if x>=11 and y>=8:h=7
        if abs(x+.5-river_x(y+.5))<1.65:h=1
        heights[x,y]=h
neighbors=[(-1,0),(1,0),(0,-1),(0,1)]
terrain=Mesh('草地 · 像素表面','terrain'); rockmesh=Mesh('土层和矿石 · 岛屿剖面','terrain')
for (x,y),h in heights.items():
    for z in range(-3,h):
        sides=[]
        for s,(dx,dy) in enumerate(neighbors):
            if heights.get((x+dx,y+dy),-3)<=z:sides.append(s)
        if z==h-1:sides.append(5)
        if z==-3:sides.append(4)
        if not sides:continue
        waterbed=h==1
        out=terrain if z==h-1 and not waterbed else rockmesh
        basechoice=random.choice(earth if z>=0 else stone)
        grassy=h>1 and z==h-1
        ore=None
        if z<0 and random.random()<.12:ore=random.choice([coal,iron])
        def select(s,i,j,coords):
            if waterbed and s==5:return random.choice(sand)
            if grassy:
                if s==5:return random.choice(grass)
                center_z=sum(c[2] for c in coords)/4-z
                if center_z>.77 or (center_z>.55 and random.random()<.3):return random.choice(grass)
            if ore and (i,j) in [(1,1),(2,2),(1,3),(3,1)] and random.random()<.8:return random.choice(ore)
            return basechoice if random.random()<.65 else random.choice(earth if z>=0 else stone)
        out.box((x,y,z),(1,1,1),grass,px=4,visible=sides,selector=select)
terrain.finish();rockmesh.finish()

# A continuous blocky river, with scattered small surface highlights.
wm=Mesh('河流 · 水面','water');rip=Mesh('河流 · 像素波纹','water')
for (x,y),h in heights.items():
    if h!=1:continue
    wm.box((x,y,1.035),(1,1,.37),water)
    if random.random()<.2:rip.box((x+.12,y+.2,1.409),(.55,.075,.006),glint)
    if random.random()<.07:rip.box((x+.5,y+.45,1.415),(.24,.065,.006),foam)
wm.finish();rip.finish()
fall=Mesh('前缘 · 方块瀑布','water'); bubbles=Mesh('瀑布 · 水花','water')
for (x,y),h in heights.items():
    if y==-11 and h==1:
        fall.box((x,-11.10,-2.95),(1,.16,4.36),waterdark)
        for k in range(3):
            xx=x+.10+k*.29
            fall.box((xx,-11.12,-2.6+random.random()*.4),(.075,.025,random.uniform(2.4,3.5)),glint)
        for j in range(3):bubbles.box((x+j*.32,-11.35,-2.93),(.24,.4,.16),foam)
fall.finish();bubbles.finish()

# Cabin: separate editable walls, beams, roof, windows, and furnishings.
hx,hy,hz=-9.5,1.5,3
foundation=Mesh('小屋 · 石砌地基','house')
for i in range(7):
    for j in range(6):foundation.box((hx+i,hy+j,hz),(1,1,.45),stone,px=2)
foundation.finish()
walls=Mesh('小屋 · 横向木板墙','house')
for level in range(8):
    z=3.45+level*.43
    for i in range(7):
        x=hx+i
        # Door and two front windows remain real openings.
        front=True
        if i==3 and level<6:front=False
        if i in (1,5) and level in (3,4,5):front=False
        if front:walls.box((x,hy,z),(.985,.25,.415),wood)
        walls.box((x,hy+5.75,z),(.985,.25,.415),wood)
    for j in range(6):
        if not(j in (2,3) and level in (3,4,5)):
            walls.box((hx+6.75,hy+j,z),(.25,.985,.415),wood)
        walls.box((hx,hy+j,z),(.25,.985,.415),wood)
walls.finish()
beams=Mesh('小屋 · 原木框架','house')
for x in [hx-.06,hx+6.62]:
    for y in [hy-.08,hy+5.65]:beams.box((x,y,3.4),(.44,.44,3.62),log,px=2)
beams.box((hx-.1,hy-.14,6.8),(7.2,.4,.33),log)
beams.box((hx+6.65,hy-.05,6.8),(.38,6.1,.33),log)
beams.finish()
# Stair-stepped gable roof, with a deep eave.
rf=Mesh('小屋 · 阶梯陶瓦屋顶','house');gable=Mesh('小屋 · 三角山墙','house')
for j in range(9):
    x=hx-1+j; level=min(j,8-j); z=6.88+level*.48
    for k in range(8):rf.box((x,hy-1+k,z),(.995,.985,.32),roof,px=2)
    if level>0:
        gable.box((x,hy+.04,6.88),(1,.2,level*.48),wood,px=2)
        gable.box((x,hy+5.7,6.88),(1,.2,level*.48),wood,px=2)
rf.finish();gable.finish()
win=Mesh('小屋 · 玻璃与窗框','house')
for x in [hx+1,hx+5]:
    win.box((x+.04,hy-.03,4.75),(.9,.10,1.17),glass)
    for xx in [x-.04,x+.45,x+.96]:win.box((xx,hy-.12,4.65),(.085,.14,1.4),trim)
    for z in [4.65,5.28,5.99]:win.box((x-.04,hy-.12,z),(1.09,.14,.085),trim)
    win.box((x-.14,hy-.25,4.58),(1.29,.5,.13),wood)
win.box((hx+6.98,hy+2.02,4.75),(.06,1.95,1.16),glass)
for yy in [hy+1.96,hy+2.96,hy+3.96]:win.box((hx+7.02,yy,4.65),(.12,.1,1.42),trim)
for zz in [4.65,5.31,5.99]:win.box((hx+7.02,hy+1.96,zz),(.12,2.1,.08),trim)
win.finish()
door=Mesh('小屋 · 木门与台阶','house')
door.box((hx+3.03,hy+.01,3.46),(.94,.15,2.51),log)
for i in range(4):door.box((hx+3.09+i*.22,hy-.025,3.53),(.18,.08,2.35),wood)
door.box((hx+3.68,hy-.09,4.6),(.1,.10,.10),yellow)
door.box((hx+3.23,hy-.12,5.02),(.52,.08,.58),glass)
for z,y in [(2,-.6),(2.48,.05),(2.96,.7)]:door.box((hx+2.4,y,z),(2.2,.7,.49),stone,px=2)
door.finish()
chim=Mesh('小屋 · 石砖烟囱','house')
for i in range(5):chim.box((hx+5.6,hy+3.9,7.3+i*.48),(.8,.9,.455),stone,px=2)
chim.box((hx+5.48,hy+3.78,9.68),(1.04,1.14,.16),stone)
chim.box((hx+5.66,hy+3.96,9.845),(.68,.78,.012),black);chim.finish()
def lantern(x,y,z,col,name):
    m=Mesh(name,col);m.box((x-.14,y-.14,z),(.28,.28,.4),glow)
    for dx in [-.18,.13]:
        for dy in [-.18,.13]:m.box((x+dx,y+dy,z-.04),(.05,.05,.48),trim)
    m.box((x-.2,y-.2,z-.075),(.4,.4,.075),trim);m.box((x-.2,y-.2,z+.4),(.4,.4,.09),trim)
    m.box((x-.04,y-.04,z+.49),(.08,.08,.24),trim);m.finish()
    li=bpy.data.lights.new(name+' 暖光','POINT');li.energy=12;li.color=(1,.57,.25);li.shadow_soft_size=.35
    ob=bpy.data.objects.new(li.name,li);collections[col].objects.link(ob);ob.location=(x,y-.15,z+.15)
lantern(hx+4.35,hy-.38,5.35,'house','门廊 · 灯笼')

# Walking path and bridge aligned to the river.
pm=Mesh('小径 · 像素泥土','bridge')
for x in range(-7,0):
    for y in [-3,-2]:pm.box((x,y,2.012),(.98,.98,.025),path,px=3)
for x in [-7,-6]:
    for y in [-1,0]:pm.box((x,y,2.012),(.98,.98,.025),path,px=3)
for x in range(6,10):
    for y in [-3,-2]:pm.box((x,y,2.014),(.98,.98,.025),path,px=3)
pm.finish()
br=Mesh('小桥 · 橡木桥面','bridge');rails=Mesh('小桥 · 栏杆与桥桩','bridge')
for i in range(14):
    x=-.8+i*.5; zz=2.14+(.14 if i in [1,12] else .28 if 2<=i<=11 else 0)
    br.box((x,-3.12,zz),(.475,2.25,.17),wood)
for y in [-3.10,-1.02]:
    rails.box((-.32,y,3.19),(5.98,.12,.14),wood)
    rails.box((-.32,y,2.81),(5.98,.09,.10),wood)
    for x in [-.35,1.65,3.65,5.65]:
        rails.box((x,y-.07,1.05),(.23,.25,2.52),log)
        rails.box((x-.04,y-.11,3.54),(.31,.33,.1),end)
br.finish();rails.finish()
lantern(-.24,-3.08,3.65,'bridge','桥头 · 灯笼 A')
lantern(5.75,-.99,3.65,'bridge','桥头 · 灯笼 B')

def surface(x,y):return heights.get((math.floor(x),math.floor(y)),2)
def oak(name,x,y,h=4,birch_tree=False):
    z=surface(x,y); trunk=Mesh(name+' · 树干','trees');crown=Mesh(name+' · 树冠','trees')
    trunk.box((x-.35,y-.35,z),(.7,.7,h),birch if birch_tree else log,px=3)
    trunk.box((x-.8,y-.22,z+h-1.2),(1.6,.44,.45),log)
    if birch_tree:
        for k in range(h*3):
            zz=z+random.uniform(.2,h-.2);trunk.box((x+.355,y-.3+random.random()*.3,zz),(.006,.2,.09),black)
    trunk.finish()
    for level,rad in [(0,2),(1,2),(2,1)]:
        for dx in range(-rad,rad+1):
            for dy in range(-rad,rad+1):
                if abs(dx)==rad and abs(dy)==rad and random.random()<.8:continue
                if level==0 and random.random()<.09:continue
                crown.box((x+dx-.5,y+dy-.5,z+h-.65+level),(1,1,1),leaf,px=2)
    crown.finish()
def spruce(name,x,y,h=6):
    z=surface(x,y);m=Mesh(name+' · 树干','trees');m.box((x-.28,y-.28,z),(.56,.56,h),log,px=2);m.finish()
    m=Mesh(name+' · 松针','trees')
    for level,rad in [(0,2),(1,1),(2,2),(3,1),(4,1),(5,0)]:
        for dx in range(-rad,rad+1):
            for dy in range(-rad,rad+1):
                if abs(dx)==rad and abs(dy)==rad and rad>0:continue
                m.box((x+dx*.8-.4,y+dy*.8-.4,z+1.5+level*.8),(.8,.8,.8),pine,px=2)
    m.finish()
oak('橡树 01',-11,-3,4)
oak('橡树 02',-11,8,5)
oak('白桦 01',-.5,7.5,5,True)
spruce('云杉 01',10,6,6)
spruce('云杉 02',7.5,9,5)
oak('橡树 03',10,-5.5,4)

# Fence-enclosed vegetable garden and wheat rows.
fm=Mesh('农田 · 木框与耕地','farm')
fm.box((-9.6,-7.7,2.01),(4.8,3.5,.15),soil,px=4)
for y in [-7.83,-4.22]:fm.box((-9.75,y,2.02),(5.1,.18,.2),log)
for x in [-9.75,-4.77]:fm.box((x,-7.68,2.02),(.18,3.46,.2),log)
fm.box((-7.5,-7.6,2.165),(.36,3.15,.012),water)
fm.finish()
crop=Mesh('农田 · 成熟小麦','farm')
for x in [-9.2,-8.65,-8.1,-6.65,-6.1,-5.55]:
    for yi in range(7):
        y=-7.4+yi*.43; ht=random.uniform(.55,.92)
        crop.box((x,y,2.16),(.06,.06,ht),wheat)
        for d in [-1,1]:
            crop.box((x+d*.1,y-.025,2.16+ht*.68),(.09,.11,.26),wheat)
        crop.box((x-.045,y-.035,2.16+ht),(.15,.13,.22),wheat)
crop.finish()
fence=Mesh('牧场 · 橡木围栏','farm')
for x in [-12,-10,-8,-6,-4,-2]:fence.box((x,-9,2),(.18,.18,1.12),wood)
for z in [2.4,2.87]:fence.box((-12,-8.98,z),(10.15,.13,.13),wood)
for y in [-7,-5]:fence.box((-12,y,2),(.18,.18,1.12),wood)
for z in [2.4,2.87]:fence.box((-11.98,-9,z),(.13,4.15,.13),wood)
fence.finish()
for k,(x,y) in enumerate([(-4,-6.9),(-3.15,-7.25),(-3.7,-6.05)]):
    m=Mesh('南瓜 '+str(k+1),'farm');m.box((x,y,2),(.67,.67,.65),pumpkin,px=3);m.box((x+.29,y+.29,2.65),(.12,.12,.18),log);m.finish()

def sheep(name,x,y,angle=0,scale=1):
    z=surface(x,y);m=Mesh(name,'props')
    m.box((-.55,-.75,.4),(1.1,1.45,.82),white,px=3)
    m.box((-.34,-1.07,.67),(.68,.57,.61),face)
    m.box((-.34,-1.08,1.15),(.68,.55,.2),white)
    for xx in [-.45,.24]:
        for yy in [-.55,.42]:
            m.box((xx,yy,0),(.2,.22,.5),face);m.box((xx,yy,-.005),(.2,.22,.12),trim)
    for xx in [-.245,.155]:m.box((xx,-1.082,.94),(.11,.02,.11),black)
    m.box((-.11,-1.091,.77),(.22,.025,.1),face[0]);m.box((-.67,-.9,1.01),(.16,.29,.15),face);m.box((.5,-.9,1.01),(.16,.29,.15),face)
    ob=m.finish();ob.location=(x,y,z);ob.rotation_euler[2]=angle;ob.scale=(scale,)*3
sheep('绵羊 · 河岸',6.5,-6.1,-.25)
sheep('小羊 · 河岸',7.8,-8,.45,.66)

flowers=Mesh('花丛 · 雏菊和虞美人','props'); grasses=Mesh('地表 · 像素草簇','props')
zones=[(-11,-8,-3.6,-.4),(-2.7,.3,-8,-4),(5,8,-.3,1),(8,12,-10,-8),(-11,-3,8.2,10.8)]
for zone in zones:
    xa,xb,ya,yb=zone
    for k in range(16):
        x=random.uniform(xa,xb);y=random.uniform(ya,yb);z=surface(x,y)
        if z==1:continue
        ht=random.uniform(.25,.5);flowers.box((x-.025,y-.025,z),(.05,.05,ht),stems)
        c=red if k%3==0 else flowerwhite
        flowers.box((x-.16,y-.07,z+ht),(.32,.14,.08),c);flowers.box((x-.07,y-.16,z+ht),(.14,.32,.08),c)
        flowers.box((x-.055,y-.055,z+ht+.08),(.11,.11,.045),yellow)
for k in range(190):
    x=random.uniform(-13,13);y=random.uniform(-10,11);z=surface(x,y)
    if z<=1 or (x<0 and y>-8 and y<8) or (x>-.9 and x<10 and -3.6<y<-1):continue
    for q in range(3):
        ht=random.uniform(.18,.48);grasses.box((x+q*.11,y+q*.07,z),(.045,.055,ht),stems)
flowers.finish();grasses.finish()
# Reeds at the water's edge.
reeds=Mesh('河畔 · 芦苇','props')
for x,y in [(4.8,-7.2),(5.7,2),(1.2,5.8),(.1,-5.5)]:
    z=surface(x,y)
    for k in range(5):
        xx=x+random.uniform(-.2,.2);yy=y+random.uniform(-.2,.2);h=random.uniform(.65,1.2)
        reeds.box((xx,yy,z),(.065,.065,h),stems);reeds.box((xx-.02,yy-.02,z+h-.25),(.105,.105,.3),earth)
reeds.finish()

# A small supply stack beside the cabin.
cr=Mesh('屋旁 · 木箱与柴堆','props')
for x,y,z in [(-1.7,2.2,3),(-1.7,3.1,3),(-1.7,2.6,3.82)]:
    cr.box((x,y,z),(.78,.78,.76),wood,px=3)
    for zz in [z+.04,z+.64]:cr.box((x-.02,y-.025,zz),(.82,.035,.07),log)
cr.finish()

# Studio environment lets the block cross-section read clearly.
box('无缝背景','env',(-200,-200,-3.5),(400,400,.2),backdrop)
world=bpy.data.worlds.new('柔和蓝天') if not bpy.data.worlds else bpy.data.worlds[0]
bpy.context.scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(*rgb('C1D9E4'),1)
world.node_tree.nodes['Background'].inputs[1].default_value=.65
def area(name,location,power,size,color,target):
    l=bpy.data.lights.new(name,'AREA');l.energy=power;l.shape='DISK';l.size=size;l.color=color
    ob=bpy.data.objects.new(name,l);collections['env'].objects.link(ob);ob.location=location;ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
area('主光 · 暖阳',(-14,-18,30),5500,12,(1,.83,.62),(0,0,0))
area('补光 · 天空',(12,0,22),3500,15,(.68,.85,1),(0,0,0))
sun=bpy.data.lights.new('阳光','SUN');sun.energy=2.0;sun.angle=math.radians(12)
ob=bpy.data.objects.new('阳光',sun);collections['env'].objects.link(ob);ob.rotation_euler=(math.radians(23),math.radians(-22),math.radians(-32))
camdata=bpy.data.cameras.new('Camera · 世界全景');cam=bpy.data.objects.new('Camera · 世界全景',camdata);collections['env'].objects.link(cam)
cam.location=(34,-46,33);target=Vector((0,0.5,2.1));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=42
scene=bpy.context.scene;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=96;scene.cycles.use_denoising=True
try:
    pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type='METAL';pref.get_devices()
    for d in pref.devices:d.use=d.type=='METAL'
    scene.cycles.device='GPU' if any(d.type=='METAL' for d in pref.devices) else 'CPU'
except Exception:scene.cycles.device='CPU'
scene.render.resolution_x=1800;scene.render.resolution_y=1500;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(ROOT,'我的世界_高清预览.png')
scene.render.film_transparent=False
scene.view_settings.view_transform='AgX'
try:scene.view_settings.look='AgX - Medium High Contrast'
except Exception:pass
scene.view_settings.exposure=.35
# Present a clean, colored camera view when the blend file is opened.
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.region_3d.view_perspective='CAMERA'
            a.spaces.active.overlay.show_overlays=False
            a.spaces.active.shading.type='MATERIAL'
            a.spaces.active.shading.color_type='MATERIAL'
            a.spaces.active.shading.use_scene_world=True
            a.spaces.active.shading.use_scene_lights=True
bpy.ops.object.select_all(action='DESELECT')
scene['说明']='Minecraft 风格的原创方块小世界。地形、建筑、植物和道具均为可编辑网格；所有材质内置，无外部依赖。'
scene['作者']='Created with Codex in Blender'
scene['随机种子']=27
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'我的世界_林间小屋.blend'))
bpy.ops.render.render(write_still=True)
print('WORLD_COMPLETE',json.dumps({'objects':len(bpy.data.objects),'materials':len(bpy.data.materials),'faces':sum(len(m.polygons) for m in bpy.data.meshes)}))
