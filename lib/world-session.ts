import {
  VoxelWorld,
  BLOCK,
  BUILDABLE_BLOCKS,
  HOTBAR,
  withinBuildBounds,
  isSolid,
  overlapsPlayer,
  key,
  type Vec,
} from './voxel-world.ts';

export type Edit = {
  x: number;
  y: number;
  z: number;
  before: number;
  after: number;
};
export type WorldSnapshot = {
  version: 1;
  worldVersion: 1;
  edits: [number, number, number, number][];
  player: { pos: Vec; yaw: number; pitch: number };
  hotbar: number[];
  selected: number;
};
export const MAX_SAVE_BYTES = 4_000_000;
const materials = new Set<number>(BUILDABLE_BLOCKS);

export function parseSnapshot(value: unknown): WorldSnapshot {
  if (!value || typeof value !== 'object') throw new Error('Invalid world');
  const v = value as Partial<WorldSnapshot>;
  if (
    v.version !== 1 ||
    v.worldVersion !== 1 ||
    !Array.isArray(v.edits) ||
    v.edits.length > 100800
  )
    throw new Error('Unsupported world');
  const occupied = new Set<string>();
  const edits: WorldSnapshot['edits'] = v.edits.map((e) => {
    if (
      !Array.isArray(e) ||
      e.length !== 4 ||
      !withinBuildBounds(e[0], e[1], e[2]) ||
      (e[3] !== 0 && !materials.has(e[3]))
    )
      throw new Error('Invalid block');
    const id = key(e[0], e[1], e[2]);
    if (occupied.has(id)) throw new Error('Duplicate block');
    occupied.add(id);
    return [e[0], e[1], e[2], e[3]];
  });
  const p = v.player;
  if (
    !p?.pos ||
    ![p.pos.x, p.pos.y, p.pos.z, p.yaw, p.pitch].every(Number.isFinite) ||
    Math.abs(p.pos.x) > 35 ||
    Math.abs(p.pos.z) > 35 ||
    p.pos.y < -9 ||
    p.pos.y > 30 ||
    Math.abs(p.pitch) > 1.48 ||
    Math.abs(p.yaw) > 1e6
  )
    throw new Error('Invalid player');
  if (
    !Array.isArray(v.hotbar) ||
    v.hotbar.length !== HOTBAR.length ||
    !v.hotbar.every((b) => materials.has(b)) ||
    !Number.isInteger(v.selected) ||
    v.selected! < 0 ||
    v.selected! >= HOTBAR.length
  )
    throw new Error('Invalid selection');
  return {
    version: 1,
    worldVersion: 1,
    edits,
    player: {
      pos: { x: p.pos.x, y: p.pos.y, z: p.pos.z },
      yaw: p.yaw,
      pitch: p.pitch,
    },
    hotbar: [...v.hotbar],
    selected: v.selected!,
  };
}

export class WorldSession {
  readonly world = new VoxelWorld();
  private readonly baseline = new Map(this.world.blocks);
  private changes = new Map<string, WorldSnapshot['edits'][number]>();
  private past: Edit[] = [];
  private future: Edit[] = [];
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }

  private write(edit: Edit, reverse = false) {
    const block = reverse ? edit.before : edit.after;
    const id = key(edit.x, edit.y, edit.z);
    this.world.set(edit.x, edit.y, edit.z, block);
    if ((this.baseline.get(id) ?? 0) === block) this.changes.delete(id);
    else this.changes.set(id, [edit.x, edit.y, edit.z, block]);
  }

  edit(
    x: number,
    y: number,
    z: number,
    after: number,
    player: Vec,
  ): Edit | null {
    const before = this.world.get(x, y, z);
    if (
      !withinBuildBounds(x, y, z) ||
      (after !== 0 && !materials.has(after)) ||
      before === BLOCK.bedrock ||
      before === after ||
      (isSolid(after) && overlapsPlayer(player, x, y, z))
    )
      return null;
    const edit = { x, y, z, before, after };
    this.write(edit);
    this.past.push(edit);
    if (this.past.length > 200) this.past.shift();
    this.future = [];
    return edit;
  }

  undo(player: Vec): Edit | null {
    const e = this.past.at(-1);
    if (!e || (isSolid(e.before) && overlapsPlayer(player, e.x, e.y, e.z)))
      return null;
    this.past.pop();
    this.write(e, true);
    this.future.push(e);
    return e;
  }

  redo(player: Vec): Edit | null {
    const e = this.future.at(-1);
    if (!e || (isSolid(e.after) && overlapsPlayer(player, e.x, e.y, e.z)))
      return null;
    this.future.pop();
    this.write(e);
    this.past.push(e);
    return e;
  }

  snapshot(
    player: WorldSnapshot['player'],
    hotbar: number[],
    selected: number,
  ): WorldSnapshot {
    return {
      version: 1,
      worldVersion: 1,
      edits: [...this.changes.values()].map((e) => [...e]),
      player: { pos: { ...player.pos }, yaw: player.yaw, pitch: player.pitch },
      hotbar: [...hotbar],
      selected,
    };
  }

  static restore(value: unknown) {
    const snapshot = parseSnapshot(value);
    const session = new WorldSession();
    for (const [x, y, z, after] of snapshot.edits)
      session.write({ x, y, z, after, before: session.world.get(x, y, z) });
    return { session, snapshot };
  }
}
