import type { Vec } from './voxel-world.ts';

export const RELICS = [
  { x: -4, z: 8, en: 'Pumpkin patch', zh: '南瓜田' },
  { x: 5, z: 3, en: 'River crossing', zh: '河上木桥' },
  { x: -14, z: -6, en: 'Forest edge', zh: '森林边缘' },
  { x: 15, z: -10, en: 'Mountain summit', zh: '山顶' },
  { x: 24, z: 17, en: 'Far meadow', zh: '远方草甸' },
  { x: -24, z: -23, en: 'Ancient grove', zh: '古老树林' },
  { x: 23, z: -24, en: 'Northern ridge', zh: '北方山脊' },
  { x: -8, z: -5, en: 'Cabin rooftop', zh: '小屋屋顶' },
] as const;
export type AdventureSave = {
  collected: number[];
  elapsed: number;
  best: number | null;
  rounds: number;
};
export function parseAdventure(value: unknown): AdventureSave {
  if (value === undefined)
    return { collected: [], elapsed: 0, best: null, rounds: 0 };
  const v = value as AdventureSave;
  if (
    !v ||
    !Array.isArray(v.collected) ||
    v.collected.length > RELICS.length ||
    new Set(v.collected).size !== v.collected.length ||
    !v.collected.every(
      (i) => Number.isInteger(i) && i >= 0 && i < RELICS.length,
    ) ||
    !Number.isFinite(v.elapsed) ||
    v.elapsed < 0 ||
    (v.best !== null && (!Number.isFinite(v.best) || v.best < 0)) ||
    !Number.isInteger(v.rounds) ||
    v.rounds < 0
  )
    throw new Error('Invalid adventure');
  return {
    collected: [...v.collected],
    elapsed: v.elapsed,
    best: v.best,
    rounds: v.rounds,
  };
}
export class Adventure {
  data: AdventureSave;
  constructor(value?: unknown) {
    this.data = parseAdventure(value);
  }
  get complete() {
    return this.data.collected.length === RELICS.length;
  }
  get boost() {
    return this.data.collected.length >= 3 || this.data.rounds > 0;
  }
  get doubleJump() {
    return this.data.collected.length >= 5 || this.data.rounds > 0;
  }
  collect(id: number, pos: Vec, target: Vec) {
    if (
      this.data.collected.includes(id) ||
      id < 0 ||
      id >= RELICS.length ||
      Math.hypot(pos.x - target.x, pos.y + 0.9 - target.y, pos.z - target.z) >
        1.8
    )
      return false;
    this.data.collected.push(id);
    if (this.complete)
      this.data.best =
        this.data.best === null
          ? this.data.elapsed
          : Math.min(this.data.best, this.data.elapsed);
    return true;
  }
  restart() {
    if (!this.complete) return false;
    this.data = {
      collected: [],
      elapsed: 0,
      best: this.data.best,
      rounds: this.data.rounds + 1,
    };
    return true;
  }
}
