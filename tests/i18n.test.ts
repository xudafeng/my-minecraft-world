import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  readLocale,
  writeLocale,
  blockName,
  translations,
} from '../lib/i18n.ts';
import { BLOCK } from '../lib/voxel-world.ts';

test('new and invalid language preferences default to English', () => {
  assert.equal(DEFAULT_LOCALE, 'en');
  for (const saved of [null, '', 'fr', 'zh', 'not-a-locale']) {
    assert.equal(
      readLocale(() => ({ getItem: () => saved, setItem: () => {} })),
      'en',
    );
  }
});

test('explicit Chinese and English choices survive a subsequent read', () => {
  const entries = new Map<string, string>();
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
  };
  writeLocale('zh-CN', () => storage);
  assert.equal(entries.get(LOCALE_STORAGE_KEY), 'zh-CN');
  assert.equal(
    readLocale(() => storage),
    'zh-CN',
  );
  writeLocale('en', () => storage);
  assert.equal(
    readLocale(() => storage),
    'en',
  );
});

test('blocked storage does not prevent the game from choosing a language', () => {
  const blocked = () => {
    throw new Error('Storage access denied');
  };
  assert.equal(readLocale(blocked), 'en');
  assert.doesNotThrow(() => writeLocale('zh-CN', blocked));
  assert.doesNotThrow(() =>
    writeLocale('zh-CN', () => ({
      getItem: () => null,
      setItem: blocked,
    })),
  );
});

test('every world block has both labels and an empty target stays empty', () => {
  for (const block of Object.values(BLOCK)) {
    assert.ok(blockName('en', block).trim());
    assert.ok(blockName('zh-CN', block).trim());
    assert.notEqual(blockName('en', block), blockName('zh-CN', block));
  }
  assert.equal(blockName('en', null), '');
  assert.equal(blockName('zh-CN', null), '');
});

test('the default dictionary contains English text for every screen and message', () => {
  const check = (value: unknown) => {
    if (typeof value === 'string') {
      assert.ok(value.trim());
      assert.doesNotMatch(value, /\p{Script=Han}/u);
    } else {
      for (const item of Object.values(value as object)) check(item);
    }
  };
  check(translations.en);
});
