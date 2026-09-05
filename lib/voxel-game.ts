import * as THREE from 'three';
import {
  VoxelWorld,
  BLOCK,
  hash,
  NAMES,
  HOTBAR,
  type Vec,
  type Hit,
  voxelRay,
  collides,
  overlapsPlayer,
  stepBody,
} from './voxel-world';
export type GameState = {
  ready: boolean;
  playing: boolean;
  started: boolean;
  selected: number;
  target: string;
  message: string;
  mode: string;
  coords: string;
};
const faces = [
  {
    d: [1, 0, 0],
    v: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
  },
  {
    d: [-1, 0, 0],
    v: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  },
  {
    d: [0, 1, 0],
    v: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    d: [0, -1, 0],
    v: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  },
  {
    d: [0, 0, 1],
    v: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
  },
  {
    d: [0, 0, -1],
    v: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  },
];
export class VoxelGame {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, 1, 0.05, 130);
  world = new VoxelWorld();
  renderer: THREE.WebGLRenderer;
  meshes = new THREE.Group();
  decorations = new THREE.Group();
  frame = 0;
  disposed = false;
  clock = 0;
  lastTime = 0;
  state: GameState = {
    ready: false,
    playing: false,
    started: false,
    selected: 0,
    target: '',
    message: '',
    mode: '',
    coords: '',
  };
  pos: Vec = { x: -5.5, y: 2, z: 9.5 };
  yaw = 0.02;
  pitch = -0.06;
  velocity = 0;
  grounded = false;
  keys = new Set<string>();
  hit: Hit | null = null;
  material: THREE.MeshLambertMaterial;
  transparentMaterial: THREE.MeshLambertMaterial;
  texture: THREE.CanvasTexture;
  selection = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.008, 1.008, 1.008)),
    new THREE.LineBasicMaterial({ color: 0xfff5cd }),
  );
  arm = new THREE.Group();
  sheep: THREE.Group[] = [];
  cleanup: (() => void)[] = [];
  onChange: (s: GameState) => void;
  host: HTMLElement;
  resizeObserver: ResizeObserver;
  dragging = false;
  pointerMoved = 0;
  pointerX = 0;
  pointerY = 0;
  mobile = { x: 0, z: 0 };
  jumpQueued = false;
  lastEmit = 0;
  lastAction = 0;
  swing = 0;
  messageUntil = 0;
  particles: { mesh: THREE.Mesh; v: THREE.Vector3; life: number }[] = [];
  locked = false;
  constructor(host: HTMLElement, onChange: (s: GameState) => void) {
    this.host = host;
    this.onChange = onChange;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(0xa9d8e7);
    host.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(0xa9d8e7);
    this.scene.fog = new THREE.Fog(0xa9d8e7, 38, 85);
    this.scene.add(new THREE.HemisphereLight(0xe4f4ff, 0x7f8756, 2));
    const sun = new THREE.DirectionalLight(0xffefd2, 2.1);
    sun.position.set(-20, 35, 16);
    this.scene.add(sun);
    this.texture = this.makeAtlas();
    this.material = new THREE.MeshLambertMaterial({
      map: this.texture,
      vertexColors: true,
    });
    this.transparentMaterial = new THREE.MeshLambertMaterial({
      map: this.texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.69,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.scene.add(this.meshes, this.decorations, this.selection);
    this.selection.visible = false;
    this.scene.add(this.camera);
    this.rebuild();
    this.addDetails();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.state.ready = true;
    this.emit();
    this.bindControls();
    this.frame = requestAnimationFrame((t) => this.tick(t));
  }
  emit() {
    this.onChange({ ...this.state });
  }
  makeAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = 16 * 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    const colors = [
      '#8b653e',
      '#76a94d',
      '#856043',
      '#899092',
      '#bb935c',
      '#558849',
      '#be7148',
      '#b3dce0',
      '#459fac',
      '#705235',
      '#d5c38f',
      '#674932',
      '#d58a35',
      '#505965',
      '#c8b486',
      '#78ab4d',
    ];
    colors.forEach((base, id) => {
      const c = new THREE.Color(base);
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const n = 0.88 + hash(x, id, y) * 0.24;
          let col = c.clone().multiplyScalar(n);
          if (id === 0 && y < 4 + (x % 3 === 0 ? 2 : 0))
            col = new THREE.Color('#78aa4d').multiplyScalar(n);
          if (id === 4 && y % 4 === 0) col.multiplyScalar(0.7);
          if (id === 9 && x % 4 === 0) col.multiplyScalar(0.72);
          if (id === 6 && (y === 0 || x === 0)) col.multiplyScalar(0.85);
          if (id === 7 && (x < 2 || y < 2 || x > 13 || y > 13))
            col = new THREE.Color('#779c9e');
          ctx.fillStyle = '#' + col.getHexString();
          ctx.fillRect(id * 16 + x, y, 1, 1);
        }
    });
    const tx = new THREE.CanvasTexture(canvas);
    tx.magFilter = THREE.NearestFilter;
    tx.minFilter = THREE.NearestFilter;
    tx.generateMipmaps = false;
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }
  rebuild() {
    for (const m of [...this.meshes.children]) {
      this.meshes.remove(m);
      if (m instanceof THREE.Mesh) m.geometry.dispose();
    }
    for (const transparent of [false, true]) {
      const positions: number[] = [],
        normals: number[] = [],
        uv: number[] = [],
        colors: number[] = [];
      for (const [key, b] of this.world.blocks) {
        if ((b === BLOCK.water || b === BLOCK.glass) !== transparent) continue;
        const [x, y, z] = key.split(',').map(Number);
        faces.forEach((f, side) => {
          const neighbor = this.world.get(x + f.d[0], y + f.d[1], z + f.d[2]);
          if (neighbor && neighbor !== BLOCK.water && neighbor !== BLOCK.glass)
            return;
          if (neighbor === b && (b === BLOCK.water || b === BLOCK.glass))
            return;
          let tile = b;
          if (b === BLOCK.grass) tile = side === 2 ? 1 : side === 3 ? 2 : 0;
          const shade =
            [0.82, 0.76, 1, 0.53, 0.9, 0.79][side] *
            (0.93 + hash(x, y, z) * 0.1);
          const coords = [
            [0.015, 0.015],
            [0.985, 0.015],
            [0.985, 0.985],
            [0.015, 0.985],
          ];
          for (const i of [0, 1, 2, 0, 2, 3]) {
            const v = f.v[i];
            positions.push(
              x + v[0],
              y + v[1] * (b === BLOCK.water ? 0.83 : 1),
              z + v[2],
            );
            normals.push(...f.d);
            uv.push((tile + coords[i][0]) / 16, coords[i][1]);
            colors.push(shade, shade, shade);
          }
        });
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(normals, 3),
      );
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3),
      );
      geometry.computeBoundingSphere();
      this.meshes.add(
        new THREE.Mesh(
          geometry,
          transparent ? this.transparentMaterial : this.material,
        ),
      );
    }
  }
  cube(parent: THREE.Object3D, color: number, pos: number[], scale: number[]) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(...(scale as [number, number, number])),
      new THREE.MeshLambertMaterial({ color }),
    );
    m.position.set(...(pos as [number, number, number]));
    parent.add(m);
    return m;
  }
  addDetails() {
    for (let x = 0; x <= 6; x += 2)
      for (const z of [1.92, 4.08])
        this.cube(
          this.decorations,
          0x785739,
          [x + 0.5, 3.38, z],
          [0.16, 0.78, 0.16],
        );
    for (const z of [1.92, 4.08])
      this.cube(this.decorations, 0xb99056, [3.5, 3.66, z], [6.1, 0.12, 0.12]);
    for (let x = -9.7; x < -5; x += 0.48)
      for (let z = 5.3; z < 8.8; z += 0.45) {
        if (Math.floor(x) === -8) continue;
        const h = 0.5 + hash(Math.floor(x * 10), 0, Math.floor(z * 10)) * 0.32;
        this.cube(
          this.decorations,
          0xe6c265,
          [x, 2 + h / 2, z],
          [0.085, h, 0.085],
        );
        this.cube(
          this.decorations,
          0xe6ba48,
          [x, 2 + h, z],
          [0.18, 0.24, 0.14],
        );
      }
    for (let i = 0; i < 100; i++) {
      const x = hash(i, 2, 0) * 34 - 17,
        z = hash(i, 3, 0) * 32 - 16;
      if ((x < 0 && z < 9 && z > -10) || Math.abs(x - 3) < 3) continue;
      const y = this.world.top(x, z);
      if (y > 5 || this.world.get(x, y - 1, z) !== BLOCK.grass) continue;
      this.cube(
        this.decorations,
        0x557d3a,
        [x, y + 0.2, z],
        [0.045, 0.4, 0.045],
      );
      this.cube(
        this.decorations,
        i % 3 === 0 ? 0xe2654c : 0xffe9a8,
        [x, y + 0.4, z],
        [0.25, 0.1, 0.22],
      );
    }
    for (const [x, z, s] of [
      [7, 7, 1],
      [9, 9, 0.65],
    ]) {
      const g = new THREE.Group();
      g.position.set(x, this.world.ground(x, z), z);
      g.scale.setScalar(s);
      this.cube(g, 0xf6efdf, [0, 0.8, 0], [0.85, 0.8, 1.25]);
      this.cube(g, 0xb2a78f, [0, 0.88, -0.78], [0.5, 0.5, 0.48]);
      for (const x of [-0.25, 0.25]) {
        for (const z of [-0.4, 0.4])
          this.cube(g, 0x746550, [x, 0.25, z], [0.16, 0.5, 0.16]);
        this.cube(g, 0x263b36, [x * 0.65, 0.98, -1.025], [0.075, 0.09, 0.035]);
      }
      this.decorations.add(g);
      this.sheep.push(g);
    }
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group();
      for (let j = 0; j < 4; j++)
        this.cube(g, 0xf3f4e8, [j * 2, hash(i, j, 0), 0], [3.8, 1.2, 3]);
      g.position.set(
        hash(i, 5, 3) * 100 - 50,
        20 + hash(i, 4, 0) * 7,
        hash(i, 9, 0) * 100 - 50,
      );
      this.decorations.add(g);
    }
    this.cube(this.arm, 0xc99769, [0.48, -0.48, -0.65], [0.22, 0.55, 0.25]);
    this.cube(this.arm, 0x335b51, [0.48, -0.28, -0.63], [0.235, 0.27, 0.27]);
    this.arm.rotation.x = -0.3;
    this.arm.visible = false;
    this.camera.add(this.arm);
  }
  resize() {
    const { width, height } = this.host.getBoundingClientRect();
    this.renderer.setSize(width, height);
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
  }
  bindControls() {
    const canvas = this.renderer.domElement;
    canvas.tabIndex = 0;
    const on = <K extends keyof HTMLElementEventMap>(
      target: EventTarget,
      event: K,
      fn: (e: HTMLElementEventMap[K]) => void,
      options?: AddEventListenerOptions,
    ) => {
      target.addEventListener(event, fn as EventListener, options);
      this.cleanup.push(() =>
        target.removeEventListener(event, fn as EventListener, options),
      );
    };
    on(document, 'keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.state.playing) this.pause();
        return;
      }
      if (!this.state.playing) return;
      if (
        ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          e.code,
        )
      )
        e.preventDefault();
      this.keys.add(e.code);
      if (e.code === 'Space' && !e.repeat) this.jump();
      if (e.code === 'KeyR' && !e.repeat) {
        this.respawn();
        this.notify('已回到小屋前');
      }
      if (/^Digit[1-6]$/.test(e.code))
        this.select(Number(e.code.slice(-1)) - 1);
    });
    on(document, 'keyup', (e) => this.keys.delete(e.code));
    on(window, 'blur', () => {
      if (this.state.playing) this.pause();
    });
    const visibility = () => {
      if (document.hidden) this.pause();
    };
    document.addEventListener('visibilitychange', visibility);
    this.cleanup.push(() =>
      document.removeEventListener('visibilitychange', visibility),
    );
    const lockChange = () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === canvas;
      if (this.locked) {
        this.state.mode = 'locked';
        this.emit();
      } else if (was && this.state.playing) this.pause();
    };
    const lockError = () => {
      if (this.state.playing) {
        this.state.mode = 'drag';
        this.notify('按住鼠标拖动视角，短按左键挖掘');
      }
    };
    document.addEventListener('pointerlockchange', lockChange);
    document.addEventListener('pointerlockerror', lockError);
    this.cleanup.push(() => {
      document.removeEventListener('pointerlockchange', lockChange);
      document.removeEventListener('pointerlockerror', lockError);
    });
    on(canvas, 'contextmenu', (e) => e.preventDefault());
    on(canvas, 'pointerdown', (e) => {
      if (!this.state.playing) return;
      canvas.focus();
      if (e.pointerType === 'touch') {
        this.dragging = true;
        this.pointerX = e.clientX;
        this.pointerY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
        return;
      }
      if (this.locked) {
        if (e.button === 0) this.action();
        if (e.button === 2) this.action(true);
      } else if (e.button === 2) this.action(true);
      else if (e.button === 0) {
        this.dragging = true;
        this.pointerMoved = 0;
        this.pointerX = e.clientX;
        this.pointerY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
      }
    });
    on(document, 'pointermove', (e) => {
      if (!this.state.playing) return;
      if (this.locked) {
        this.touchLook(e.movementX, e.movementY);
      } else if (this.dragging) {
        const dx = e.clientX - this.pointerX,
          dy = e.clientY - this.pointerY;
        this.pointerMoved += Math.abs(dx) + Math.abs(dy);
        this.touchLook(dx, dy);
        this.pointerX = e.clientX;
        this.pointerY = e.clientY;
      }
    });
    on(canvas, 'pointerup', (e) => {
      if (
        this.state.playing &&
        !this.locked &&
        this.dragging &&
        this.pointerMoved < 7 &&
        e.pointerType !== 'touch'
      )
        this.action();
      this.dragging = false;
    });
    on(canvas, 'pointercancel', () => {
      this.dragging = false;
    });
    on(
      canvas,
      'wheel',
      (e) => {
        if (!this.state.playing) return;
        e.preventDefault();
        this.select(this.state.selected + Math.sign(e.deltaY));
      },
      { passive: false },
    );
  }
  start() {
    this.state.started = true;
    this.state.playing = true;
    this.state.mode = matchMedia('(pointer:coarse)').matches ? 'touch' : 'drag';
    this.lastTime = 0;
    this.keys.clear();
    this.emit();
    const canvas = this.renderer.domElement;
    canvas.focus();
    if (this.state.mode !== 'touch' && canvas.requestPointerLock)
      try {
        const promise = canvas.requestPointerLock();
        if (promise?.catch)
          promise.catch(() => {
            if (!this.disposed && this.state.playing) {
              this.state.mode = 'drag';
              this.notify('按住鼠标拖动视角，短按左键挖掘');
            }
          });
      } catch {
        this.state.mode = 'drag';
        this.emit();
      }
  }
  pause() {
    this.state.playing = false;
    this.keys.clear();
    this.mobile = { x: 0, z: 0 };
    this.dragging = false;
    this.jumpQueued = false;
    this.arm.visible = false;
    if (document.pointerLockElement === this.renderer.domElement)
      document.exitPointerLock();
    this.emit();
  }
  select(index: number) {
    this.state.selected = (index + HOTBAR.length) % HOTBAR.length;
    this.emit();
  }
  notify(message: string) {
    this.state.message = message;
    this.messageUntil = performance.now() + 2600;
    this.emit();
  }
  action(place = false) {
    if (!this.state.playing || performance.now() - this.lastAction < 160)
      return;
    this.lastAction = performance.now();
    this.updateTarget();
    const hit = this.hit;
    if (!hit) {
      this.notify('靠近一点，准星对准方块');
      return;
    }
    const { x, y, z } = hit;
    if (place) {
      const nx = x + hit.normal.x,
        ny = y + hit.normal.y,
        nz = z + hit.normal.z;
      if (Math.abs(nx) >= 30 || Math.abs(nz) >= 30 || ny > 24) {
        this.notify('这里已到建造边界');
        return;
      }
      if (overlapsPlayer(this.pos, nx, ny, nz)) {
        this.notify('不能把方块放在自己站的位置');
        return;
      }
      if (
        this.world.get(nx, ny, nz) &&
        this.world.get(nx, ny, nz) !== BLOCK.water
      )
        return;
      this.world.set(nx, ny, nz, HOTBAR[this.state.selected]);
    } else {
      if (hit.block === BLOCK.bedrock) {
        this.notify('基岩托着整个世界，无法挖掘');
        return;
      }
      this.world.set(x, y, z, 0);
      this.burst(x + 0.5, y + 0.5, z + 0.5, hit.block);
      for (const detail of [...this.decorations.children])
        if (
          detail instanceof THREE.Mesh &&
          Math.floor(detail.position.x) === x &&
          Math.floor(detail.position.z) === z &&
          detail.position.y > y &&
          detail.position.y < y + 2
        ) {
          this.decorations.remove(detail);
          detail.geometry.dispose();
          if (detail.material instanceof THREE.Material)
            detail.material.dispose();
        }
    }
    this.swing = 1;
    this.rebuild();
    this.updateTarget();
  }
  burst(x: number, y: number, z: number, b: number) {
    const palette: Record<number, number> = {
      1: 0x83a954,
      3: 0x8c9290,
      4: 0xb38b58,
      5: 0x568c48,
      6: 0xba714b,
    };
    for (let i = 0; i < 8; i++) {
      const mesh = this.cube(
        this.scene,
        palette[b] ?? 0x9a7751,
        [x, y, z],
        [0.12, 0.12, 0.12],
      );
      this.particles.push({
        mesh,
        v: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 3 + 1,
          (Math.random() - 0.5) * 4,
        ),
        life: 0.65,
      });
    }
  }
  respawn() {
    this.pos = { x: -5.5, y: 2, z: 9.5 };
    while (collides(this.world, this.pos) && this.pos.y < 28) this.pos.y += 1;
    this.yaw = 0.02;
    this.pitch = -0.06;
    this.velocity = 0;
    this.grounded = false;
    this.jumpQueued = false;
  }
  touchMove(x: number, z: number) {
    this.mobile = { x, z };
  }
  touchLook(x: number, y: number) {
    this.yaw -= x * 0.0025;
    this.pitch = THREE.MathUtils.clamp(this.pitch - y * 0.0025, -1.48, 1.48);
  }
  jump() {
    this.jumpQueued = true;
  }
  updateTarget() {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    this.hit = voxelRay(this.world, this.camera.position, direction);
    this.selection.visible = this.state.playing && !!this.hit;
    if (this.hit)
      this.selection.position.set(
        this.hit.x + 0.5,
        this.hit.y + 0.5,
        this.hit.z + 0.5,
      );
    this.state.target = this.hit ? NAMES[this.hit.block] : '';
  }
  tick(time: number) {
    if (this.disposed) return;
    const dt = this.lastTime
      ? Math.min((time - this.lastTime) / 1000, 0.05)
      : 1 / 60;
    this.lastTime = time;
    this.clock += dt;
    if (this.state.playing) {
      let forward =
        Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) -
        Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) +
        this.mobile.z;
      let side =
        Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) -
        Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) +
        this.mobile.x;
      const len = Math.max(1, Math.hypot(side, forward));
      forward /= len;
      side /= len;
      const water =
        this.world.get(this.pos.x, this.pos.y + 0.3, this.pos.z) ===
        BLOCK.water;
      const speed = water
        ? 2.8
        : this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
          ? 7
          : 4.6;
      const body = stepBody(
        this.world,
        { pos: this.pos, velocity: this.velocity, grounded: this.grounded },
        (side * Math.cos(this.yaw) - forward * Math.sin(this.yaw)) * speed,
        (-side * Math.sin(this.yaw) - forward * Math.cos(this.yaw)) * speed,
        this.jumpQueued,
        dt,
      );
      this.velocity = body.velocity;
      this.grounded = body.grounded;
      this.jumpQueued = false;
      if (
        this.pos.y < -9 ||
        Math.abs(this.pos.x) > 35 ||
        Math.abs(this.pos.z) > 35
      ) {
        this.respawn();
        this.notify('已回到小屋前');
      }
      this.camera.position.set(this.pos.x, this.pos.y + 1.58, this.pos.z);
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      this.arm.visible = true;
      this.swing = Math.max(0, this.swing - dt * 5);
      this.arm.rotation.x = -0.3 - Math.sin(this.swing * Math.PI) * 0.8;
      this.arm.position.y =
        (Math.abs(side) + Math.abs(forward)) *
        0.012 *
        Math.sin(this.clock * 12);
      this.updateTarget();
    } else if (!this.state.started) {
      this.camera.position.set(19 + Math.sin(this.clock * 0.04) * 2, 15, 22);
      this.camera.lookAt(-3, 3, -2);
      this.selection.visible = false;
    }
    this.sheep.forEach((s, i) => {
      const x = (i ? 9 : 7) + Math.sin(this.clock * 0.2 + i) * 0.7,
        z = (i ? 9 : 7) + Math.cos(this.clock * 0.2 + i) * 0.6;
      const y = this.world.top(x, z);
      if (y >= 1 && y < 4) {
        s.position.set(x, y, z);
        s.rotation.y = Math.sin(this.clock * 0.2 + i) * 0.6;
      }
    });
    for (const p of [...this.particles]) {
      p.life -= dt;
      p.v.y -= 10 * dt;
      p.mesh.position.addScaledVector(p.v, dt);
      p.mesh.rotation.x += dt * 4;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(this.particles.indexOf(p), 1);
      }
    }
    if (time > this.messageUntil) this.state.message = '';
    if (time - this.lastEmit > 150) {
      this.state.coords =
        'X ' +
        this.pos.x.toFixed(0) +
        '  Y ' +
        this.pos.y.toFixed(0) +
        '  Z ' +
        this.pos.z.toFixed(0);
      this.emit();
      this.lastEmit = time;
    }
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame((t) => this.tick(t));
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.cleanup.forEach((f) => f());
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
        o.geometry.dispose();
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        materials.forEach((m) => m.dispose());
      }
    });
    this.texture.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
