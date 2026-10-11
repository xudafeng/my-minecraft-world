import { BUILDABLE_BLOCKS, BLOCK } from './voxel-world.ts';
const materials = new Set<number>(BUILDABLE_BLOCKS);
export const DAY_LENGTH = 180;
export const CYCLE_LENGTH = 270;
export type SurvivalSave = {
  mode: 'adventure' | 'creative';
  time: number;
  inventory: Record<number, number>;
  sword: boolean;
  camp: number;
  nights: number;
};
export const RECIPES = {
  planks: { cost: { [BLOCK.log]: 1 }, output: { [BLOCK.wood]: 4 } },
  glass: { cost: { [BLOCK.sand]: 3 }, output: { [BLOCK.glass]: 3 } },
  roof: { cost: { [BLOCK.wood]: 3 }, output: { [BLOCK.roof]: 3 } },
  sword: { cost: { [BLOCK.wood]: 6, [BLOCK.stone]: 8 }, output: {} },
  food: { cost: { [BLOCK.pumpkin]: 1 }, output: {} },
  camp: { cost: { [BLOCK.wood]: 12, [BLOCK.stone]: 12 }, output: {} },
} as const;
export type Recipe = keyof typeof RECIPES;
export function parseSurvival(value: unknown): SurvivalSave {
  if (value === undefined)
    return {
      mode: 'adventure',
      time: 0,
      inventory: {
        [BLOCK.wood]: 20,
        [BLOCK.stone]: 12,
        [BLOCK.dirt]: 10,
        [BLOCK.pumpkin]: 2,
      },
      sword: false,
      camp: 0,
      nights: 0,
    };
  const v = value as SurvivalSave;
  if (
    !v ||
    !['adventure', 'creative'].includes(v.mode) ||
    !Number.isFinite(v.time) ||
    v.time < 0 ||
    v.time > 1e9 ||
    typeof v.sword !== 'boolean' ||
    !Number.isInteger(v.camp) ||
    v.camp < 0 ||
    v.camp > 3 ||
    !Number.isInteger(v.nights) ||
    v.nights < 0 ||
    v.nights > 1e6 ||
    !v.inventory ||
    typeof v.inventory !== 'object' ||
    Array.isArray(v.inventory)
  )
    throw new Error('Invalid survival');
  const inventory: Record<number, number> = {};
  for (const [id, count] of Object.entries(v.inventory)) {
    if (
      !materials.has(Number(id)) ||
      !Number.isInteger(count) ||
      count < 0 ||
      count > 100000
    )
      throw new Error('Invalid inventory');
    inventory[Number(id)] = count;
  }
  return {
    mode: v.mode,
    time: v.time,
    inventory,
    sword: v.sword,
    camp: v.camp,
    nights: v.nights,
  };
}
export class Survival {
  data: SurvivalSave;
  constructor(value?: unknown) {
    this.data = parseSurvival(value);
  }
  get creative() {
    return this.data.mode === 'creative';
  }
  get night() {
    return this.data.time % CYCLE_LENGTH >= DAY_LENGTH;
  }
  get day() {
    return Math.floor(this.data.time / CYCLE_LENGTH) + 1;
  }
  get remaining() {
    const phase = this.data.time % CYCLE_LENGTH;
    return Math.ceil((this.night ? CYCLE_LENGTH : DAY_LENGTH) - phase);
  }
  tick(dt: number) {
    const day = this.day;
    this.data.time += dt;
    if (this.day > day && !this.creative) {
      this.data.nights += this.day - day;
      this.add(BLOCK.wood, 4);
      this.add(BLOCK.stone, 4);
      this.add(BLOCK.pumpkin, 1);
      return true;
    }
    return false;
  }
  add(block: number, amount = 1) {
    if (materials.has(block))
      this.data.inventory[block] = Math.min(
        100000,
        Math.max(0, (this.data.inventory[block] ?? 0) + amount),
      );
  }
  canPlace(block: number) {
    return this.creative || (this.data.inventory[block] ?? 0) > 0;
  }
  spend(block: number) {
    if (!this.canPlace(block)) return false;
    if (!this.creative) this.add(block, -1);
    return true;
  }
  canCraft(recipe: Recipe) {
    if (
      (recipe === 'sword' && this.data.sword) ||
      (recipe === 'camp' && this.data.camp >= 3)
    )
      return false;
    return (
      this.creative ||
      Object.entries(RECIPES[recipe].cost).every(
        ([id, count]) => (this.data.inventory[Number(id)] ?? 0) >= count,
      )
    );
  }
  craft(recipe: Recipe) {
    if (!this.canCraft(recipe)) return false;
    if (!this.creative)
      for (const [id, count] of Object.entries(RECIPES[recipe].cost))
        this.add(Number(id), -count);
    for (const [id, count] of Object.entries(RECIPES[recipe].output))
      this.add(Number(id), count);
    if (recipe === 'sword') this.data.sword = true;
    if (recipe === 'camp') this.data.camp++;
    return true;
  }
}
