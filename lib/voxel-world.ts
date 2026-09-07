export const BLOCK = {
  grass: 1,
  dirt: 2,
  stone: 3,
  wood: 4,
  leaf: 5,
  roof: 6,
  glass: 7,
  water: 8,
  log: 9,
  sand: 10,
  soil: 11,
  pumpkin: 12,
  bedrock: 13,
  path: 14,
} as const;
export const HOTBAR = [1, 3, 4, 5, 7, 6];
export const BUILDABLE_BLOCKS = Object.values(BLOCK).filter(
  (b) => b !== BLOCK.bedrock,
);
export const WORLD_MIN = -30,
  WORLD_MAX = 29,
  BUILD_MIN_Y = -3,
  BUILD_MAX_Y = 24;
export function withinBuildBounds(x: number, y: number, z: number) {
  return (
    [x, y, z].every(Number.isInteger) &&
    x >= WORLD_MIN &&
    x <= WORLD_MAX &&
    z >= WORLD_MIN &&
    z <= WORLD_MAX &&
    y >= BUILD_MIN_Y &&
    y <= BUILD_MAX_Y
  );
}
export type Vec = { x: number; y: number; z: number };
export const key = (x: number, y: number, z: number) => [x, y, z].join(',');
export const isSolid = (b: number) => b !== 0 && b !== BLOCK.water;
export const hash = (x: number, y: number, z: number) => {
  let n =
    Math.imul(x, 374761393) +
    Math.imul(y, 668265263) +
    Math.imul(z, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
export class VoxelWorld {
  blocks = new Map<string, number>();
  get(x: number, y: number, z: number) {
    return (
      this.blocks.get(key(Math.floor(x), Math.floor(y), Math.floor(z))) ?? 0
    );
  }
  set(x: number, y: number, z: number, b: number) {
    if (b) this.blocks.set(key(x, y, z), b);
    else this.blocks.delete(key(x, y, z));
  }
  top(x: number, z: number) {
    for (let y = BUILD_MAX_Y; y >= -4; y--)
      if (isSolid(this.get(x, y, z))) return y + 1;
    return -5;
  }
  ground(x: number, z: number) {
    let h = 2;
    if (x < 0 && z <= -1) h = 3;
    if (x < -3 && z <= -8) h = 4;
    if (x >= 7 && z <= -1) h = 3;
    if (x >= 8 && z <= -3) h = 4;
    if (x >= 9 && z <= -5) h = 5;
    if (x >= 10 && z <= -7) h = 6;
    if (x >= 11 && z <= -8) h = 7;
    if (x > 15 || x < -16 || z > 14 || z < -16)
      h = 2 + Math.floor(1.7 + 1.3 * Math.sin(x * 0.18) * Math.cos(z * 0.2));
    if (Math.abs(x + 0.5 - (2.6 + 1.25 * Math.sin((-z + 2) * 0.28))) < 1.65)
      h = 1;
    return h;
  }
  constructor(generate = true) {
    if (generate) this.generate();
  }
  generate() {
    const B = BLOCK;
    for (let x = -30; x < 30; x++)
      for (let z = -30; z < 30; z++) {
        const h = this.ground(x, z);
        for (let y = -4; y < h; y++)
          this.set(
            x,
            y,
            z,
            y === -4
              ? B.bedrock
              : y === h - 1
                ? h === 1
                  ? B.sand
                  : B.grass
                : y >= h - 3
                  ? B.dirt
                  : B.stone,
          );
        if (h === 1) this.set(x, 1, z, B.water);
      }
    for (let x = -10; x <= -3; x++)
      for (let z = -8; z <= -2; z++) {
        this.set(x, 3, z, B.stone);
        for (let y = 4; y <= 6; y++) {
          if (x !== -10 && x !== -3 && z !== -8 && z !== -2) continue;
          if (z === -2 && x === -6 && y < 6) continue;
          const window =
            y === 5 &&
            ((z === -2 && (x === -8 || x === -4)) ||
              (x === -3 && (z === -5 || z === -6)));
          this.set(
            x,
            y,
            z,
            window
              ? B.glass
              : (x === -10 || x === -3) && (z === -8 || z === -2)
                ? B.log
                : B.wood,
          );
        }
      }
    for (let x = -11; x <= -2; x++) {
      const y = 7 + Math.floor(Math.min(x + 11, -2 - x) / 2);
      for (let z = -9; z <= -1; z++) this.set(x, y, z, B.roof);
      if (y > 7)
        for (let yy = 7; yy < y; yy++) {
          this.set(x, yy, -2, B.wood);
          this.set(x, yy, -8, B.wood);
        }
    }
    for (let y = 8; y <= 11; y++) this.set(-4, y, -7, B.stone);
    for (let x = -7; x <= -5; x++) {
      this.set(x, 2, 0, B.stone);
      this.set(x, 2, -1, B.stone);
      this.set(x, 3, -1, B.stone);
    }
    for (let x = -7; x < 1; x++)
      for (let z = 2; z <= 3; z++) this.set(x, 1, z, B.path);
    for (let x = -7; x <= -5; x++)
      for (let z = 1; z <= 3; z++) this.set(x, 1, z, B.path);
    for (let x = 0; x <= 6; x++)
      for (let z = 2; z <= 3; z++) this.set(x, 2, z, B.wood);
    for (let x = 7; x < 11; x++)
      for (let z = 2; z <= 3; z++) this.set(x, 1, z, B.path);
    for (let x = -10; x <= -6; x++)
      for (let z = 5; z <= 8; z++)
        this.set(x, 1, z, x === -8 ? B.water : B.soil);
    this.set(-4, 2, 7, B.pumpkin);
    this.set(-3, 2, 7, B.pumpkin);
    this.set(-4, 2, 8, B.pumpkin);
    for (const [x, z, h] of [
      [-12, 3, 4],
      [-12, -9, 5],
      [-1, -10, 5],
      [11, 7, 4],
      [13, -7, 5],
      [8, -14, 5],
      [-21, -15, 5],
      [-20, 11, 5],
      [20, 15, 5],
      [22, -19, 5],
      [-9, 20, 5],
      [-19, -23, 5],
      [18, -24, 5],
    ]) {
      const y = this.ground(x, z);
      for (let j = 0; j < h; j++) this.set(x, y + j, z, B.log);
      for (let j = 0; j < 3; j++) {
        const r = j === 2 ? 1 : 2;
        for (let dx = -r; dx <= r; dx++)
          for (let dz = -r; dz <= r; dz++) {
            if (
              Math.abs(dx) === r &&
              Math.abs(dz) === r &&
              hash(x + dx, j, z + dz) > 0.25
            )
              continue;
            this.set(x + dx, y + h - 1 + j, z + dz, B.leaf);
          }
      }
    }
  }
}
export const PLAYER_HEIGHT = 1.72,
  PLAYER_RADIUS = 0.29;
export function collides(world: VoxelWorld, p: Vec) {
  for (
    let x = Math.floor(p.x - PLAYER_RADIUS);
    x <= Math.floor(p.x + PLAYER_RADIUS);
    x++
  )
    for (
      let z = Math.floor(p.z - PLAYER_RADIUS);
      z <= Math.floor(p.z + PLAYER_RADIUS);
      z++
    )
      for (
        let y = Math.floor(p.y + 0.001);
        y <= Math.floor(p.y + PLAYER_HEIGHT - 0.001);
        y++
      )
        if (isSolid(world.get(x, y, z))) return true;
  return false;
}
export function overlapsPlayer(p: Vec, x: number, y: number, z: number) {
  return (
    p.x + PLAYER_RADIUS > x &&
    p.x - PLAYER_RADIUS < x + 1 &&
    p.z + PLAYER_RADIUS > z &&
    p.z - PLAYER_RADIUS < z + 1 &&
    p.y + PLAYER_HEIGHT > y &&
    p.y < y + 1
  );
}
export type Hit = {
  x: number;
  y: number;
  z: number;
  normal: Vec;
  block: number;
  distance: number;
};
export function voxelRay(
  world: VoxelWorld,
  origin: Vec,
  dir: Vec,
  max = 6,
  includeWater = false,
): Hit | null {
  if (Math.abs(dir.x) + Math.abs(dir.y) + Math.abs(dir.z) < 1e-9) return null;
  let x = Math.floor(origin.x),
    y = Math.floor(origin.y),
    z = Math.floor(origin.z),
    distance = 0;
  const sx = Math.sign(dir.x),
    sy = Math.sign(dir.y),
    sz = Math.sign(dir.z);
  const dx = dir.x === 0 ? Infinity : Math.abs(1 / dir.x),
    dy = dir.y === 0 ? Infinity : Math.abs(1 / dir.y),
    dz = dir.z === 0 ? Infinity : Math.abs(1 / dir.z);
  let tx =
      dir.x === 0 ? Infinity : (sx > 0 ? x + 1 - origin.x : origin.x - x) * dx,
    ty =
      dir.y === 0 ? Infinity : (sy > 0 ? y + 1 - origin.y : origin.y - y) * dy,
    tz =
      dir.z === 0 ? Infinity : (sz > 0 ? z + 1 - origin.z : origin.z - z) * dz;
  let normal = { x: 0, y: 0, z: 0 };
  while (distance <= max) {
    const block = world.get(x, y, z);
    if (isSolid(block) || (includeWater && block === BLOCK.water))
      return { x, y, z, block, normal, distance };
    if (tx <= ty && tx <= tz) {
      x += sx;
      distance = tx;
      tx += dx;
      normal = { x: -sx, y: 0, z: 0 };
    } else if (ty <= tz) {
      y += sy;
      distance = ty;
      ty += dy;
      normal = { x: 0, y: -sy, z: 0 };
    } else {
      z += sz;
      distance = tz;
      tz += dz;
      normal = { x: 0, y: 0, z: -sz };
    }
  }
  return null;
}

export type Body = { pos: Vec; velocity: number; grounded: boolean };
export function stepBody(
  world: VoxelWorld,
  body: Body,
  dx: number,
  dz: number,
  jump: boolean,
  dt: number,
) {
  if (jump && body.grounded) {
    body.velocity = 8.4;
    body.grounded = false;
  }
  const steps = Math.max(1, Math.ceil(dt * 120)),
    h = dt / steps;
  for (let i = 0; i < steps; i++) {
    for (const [axis, delta] of [
      ['x', dx * h],
      ['z', dz * h],
    ] as const) {
      const from = body.pos[axis];
      body.pos[axis] += delta;
      if (collides(world, body.pos)) {
        let lo = 0,
          hi = 1;
        for (let k = 0; k < 12; k++) {
          const mid = (lo + hi) / 2;
          body.pos[axis] = from + delta * mid;
          if (collides(world, body.pos)) hi = mid;
          else lo = mid;
        }
        body.pos[axis] = from + delta * lo;
      }
    }
    body.velocity = Math.max(-28, body.velocity - 24 * h);
    const from = body.pos.y,
      delta = body.velocity * h;
    body.pos.y += delta;
    if (collides(world, body.pos)) {
      let lo = 0,
        hi = 1;
      for (let k = 0; k < 14; k++) {
        const mid = (lo + hi) / 2;
        body.pos.y = from + delta * mid;
        if (collides(world, body.pos)) hi = mid;
        else lo = mid;
      }
      body.pos.y = from + delta * lo;
      body.grounded = delta < 0;
      body.velocity = 0;
    } else body.grounded = false;
  }
  return body;
}
