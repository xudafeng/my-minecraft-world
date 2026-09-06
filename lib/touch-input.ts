export class TouchInput {
  private movement = new Map<number, { x: number; z: number }>();
  private look: { id: number; x: number; y: number } | null = null;
  move(id: number, x: number, z: number) {
    this.movement.set(id, { x, z });
  }
  releaseMove(id: number) {
    this.movement.delete(id);
  }
  direction() {
    let x = 0,
      z = 0;
    for (const d of this.movement.values()) {
      x += d.x;
      z += d.z;
    }
    return { x: Math.sign(x), z: Math.sign(z) };
  }
  beginLook(id: number, x: number, y: number) {
    if (this.look) return false;
    this.look = { id, x, y };
    return true;
  }
  lookDelta(id: number, x: number, y: number) {
    if (!this.look || this.look.id !== id) return null;
    const delta = { x: x - this.look.x, y: y - this.look.y };
    this.look = { id, x, y };
    return delta;
  }
  endLook(id: number) {
    if (this.look?.id !== id) return false;
    this.look = null;
    return true;
  }
  clear() {
    this.movement.clear();
    this.look = null;
  }
}
