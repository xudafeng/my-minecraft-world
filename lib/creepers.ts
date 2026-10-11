import {
  stepBody,
  voxelRay,
  type Vec,
  type VoxelWorld,
} from './voxel-world.ts';

export type Creeper = {
  pos: Vec;
  velocity: number;
  grounded: boolean;
  fuse: number;
  health: number;
  cooldown: number;
  spawn: Vec;
};
export const CREEPER_SPAWNS = [
  [10, 9],
  [-16, -9],
  [18, -13],
  [-22, 18],
  [24, -22],
];
export function createCreeper(
  world: VoxelWorld,
  x: number,
  z: number,
): Creeper {
  const spawn = { x: x + 0.5, y: world.top(x, z), z: z + 0.5 };
  return {
    pos: { ...spawn },
    spawn,
    velocity: 0,
    grounded: false,
    fuse: 0,
    health: 3,
    cooldown: 0,
  };
}
export function seesPlayer(world: VoxelWorld, mob: Creeper, player: Vec) {
  const start = { x: mob.pos.x, y: mob.pos.y + 1.2, z: mob.pos.z };
  const end = { x: player.x, y: player.y + 1.2, z: player.z };
  const distance = Math.hypot(
    end.x - start.x,
    end.y - start.y,
    end.z - start.z,
  );
  if (distance < 0.01) return true;
  return !voxelRay(
    world,
    start,
    {
      x: (end.x - start.x) / distance,
      y: (end.y - start.y) / distance,
      z: (end.z - start.z) / distance,
    },
    distance,
  );
}
// Returns an explosion once; cooldown and the fuse use active simulation time.
export function stepCreeper(
  world: VoxelWorld,
  mob: Creeper,
  player: Vec,
  dt: number,
): boolean {
  if (mob.cooldown > 0) {
    mob.cooldown = Math.max(0, mob.cooldown - dt);
    if (mob.cooldown === 0) {
      mob.pos = { ...mob.spawn, y: world.top(mob.spawn.x, mob.spawn.z) };
      mob.health = 3;
      mob.fuse = 0;
      mob.velocity = 0;
    }
    return false;
  }
  const dx = player.x - mob.pos.x,
    dz = player.z - mob.pos.z;
  const distance = Math.hypot(dx, dz);
  const visible =
    distance < 14 &&
    Math.abs(player.y - mob.pos.y) < 3 &&
    seesPlayer(world, mob, player);
  const safe = Math.hypot(player.x + 5.5, player.z - 9.5) < 4;
  if (visible && !safe && distance < 2.6) mob.fuse += dt;
  else mob.fuse = Math.max(0, mob.fuse - dt * 2);
  if (mob.fuse >= 1.6) {
    mob.cooldown = 30;
    mob.fuse = 0;
    return true;
  }
  const chase = visible && !safe && distance > 1.8 && mob.fuse === 0;
  const vx = chase ? (dx / distance) * 2.25 : 0;
  const vz = chase ? (dz / distance) * 2.25 : 0;
  // StepBody prevents wall tunneling and supplies gravity; hop over single blocks.
  const obstruction =
    chase &&
    world.get(mob.pos.x + vx * 0.3, mob.pos.y + 0.2, mob.pos.z + vz * 0.3) !==
      0;
  const body = stepBody(world, mob, vx, vz, !!obstruction && mob.grounded, dt);
  mob.velocity = body.velocity;
  mob.grounded = body.grounded;
  if (mob.pos.y < -8) mob.cooldown = 30;
  return false;
}
export function blastDamage(distance: number, shielded: boolean) {
  if (shielded || distance >= 4.5) return 0;
  return Math.ceil(90 * (1 - Math.max(0, distance) / 4.5));
}
