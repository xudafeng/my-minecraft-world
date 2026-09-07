import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TouchInput } from '../lib/touch-input.ts';

void test('moving and looking use independent fingers without coordinate jumps', () => {
  const input = new TouchInput();
  input.move(1, 0, 1);
  assert.equal(input.beginLook(2, 200, 150), true);
  assert.equal(input.lookDelta(1, 20, 30), null);
  assert.equal(input.beginLook(3, 300, 200), false);
  assert.deepEqual(input.lookDelta(2, 210, 155), { x: 10, y: 5 });
  assert.deepEqual(input.direction(), { x: 0, z: 1 });
  assert.equal(input.endLook(1), false);
  assert.deepEqual(input.lookDelta(2, 211, 153), { x: 1, y: -2 });
});

void test('diagonal movement survives releasing only one direction', () => {
  const input = new TouchInput();
  input.move(1, 0, 1);
  input.move(2, 1, 0);
  assert.deepEqual(input.direction(), { x: 1, z: 1 });
  input.releaseMove(2);
  assert.deepEqual(input.direction(), { x: 0, z: 1 });
  input.releaseMove(1);
  assert.deepEqual(input.direction(), { x: 0, z: 0 });
});

void test('cancellation and pause clear input without a stuck movement or stale drag', () => {
  const input = new TouchInput();
  input.move(8, -1, 0);
  input.beginLook(9, 100, 100);
  input.clear();
  assert.deepEqual(input.direction(), { x: 0, z: 0 });
  assert.equal(input.lookDelta(9, 300, 300), null);
  assert.equal(input.beginLook(10, 0, 0), true);
  assert.equal(input.endLook(10), true);
  assert.equal(input.lookDelta(10, 20, 20), null);
});
