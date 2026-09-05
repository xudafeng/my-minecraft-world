export type Locale = 'en' | 'zh-CN';
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'my-minecraft-world.locale';

type LocaleStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function readLocale(
  getStorage: () => LocaleStorage = () => localStorage,
): Locale {
  try {
    return getStorage().getItem(LOCALE_STORAGE_KEY) === 'zh-CN'
      ? 'zh-CN'
      : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function writeLocale(
  locale: Locale,
  getStorage: () => LocaleStorage = () => localStorage,
) {
  try {
    getStorage().setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Language switching still works when browser storage is unavailable.
  }
}

const en = {
  title: 'My Minecraft World · Forest Cabin',
  description:
    'Explore a cozy voxel world. Walk through the forest, visit the cabin, and mine and place blocks to build something of your own.',
  canvasLabel: 'First-person voxel world',
  brand: 'Forest Cabin',
  subtitle: 'My Minecraft World',
  weather: 'Sunny · Creative mode',
  languageLabel: 'Language',
  pause: 'Pause game',
  eyebrow: 'YOUR LITTLE WORLD',
  welcome: 'A little world to explore.',
  paused: 'Take a little break.',
  introduction:
    'Cross the bridge and wander through the trees. Mine a block, place another, and make this world your own.',
  pauseDescription: 'The cabin and the forest will be here when you return.',
  move: 'Move',
  space: 'Space',
  jump: 'Jump',
  mine: 'Mine',
  place: 'Place',
  mouseActions: 'Left click: mine · Right click: place',
  enter: 'Enter world',
  resume: 'Continue exploring',
  loading: 'Preparing your world…',
  startNote: 'Mouse to look · 1–6 to select blocks · Esc to pause',
  returnHome: 'Return to the cabin',
  dragActions: 'Drag to look · Click to mine · Right click to place',
  movementHint: 'WASD Move · Space Jump · Shift Sprint · R Home',
  hotbarLabel: 'Select a building block',
  forward: 'Move forward',
  left: 'Move left',
  backward: 'Move backward',
  right: 'Move right',
  touchHint: 'Drag the scene to look around',
  playingFooter: 'Creative mode · Refreshing resets the world',
  welcomeFooter: 'A cabin, a forest, and your imagination.',
  errors: {
    webgl:
      'Unable to start the 3D view. Use a WebGL-capable browser with hardware acceleration enabled.',
    load: 'Unable to load the scene. Refresh the page to try again.',
  },
  messages: {
    home: 'Back at the cabin',
    dragHint: 'Drag to look around; click to mine a block',
    outOfReach: 'Move closer and aim at a block',
    worldEdge: 'You have reached the building boundary',
    playerOverlap: 'You cannot place a block where you are standing',
    bedrock: 'Bedrock supports the world and cannot be mined',
  },
  blocks: {
    1: 'Grass Block',
    2: 'Dirt',
    3: 'Stone',
    4: 'Oak Planks',
    5: 'Leaves',
    6: 'Terracotta',
    7: 'Glass',
    8: 'River Water',
    9: 'Log',
    10: 'Sand',
    11: 'Farmland',
    12: 'Pumpkin',
    13: 'Bedrock',
    14: 'Path',
  },
};

type Dictionary = typeof en;
export type GameMessage = keyof Dictionary['messages'];
export type GameError = keyof Dictionary['errors'];

const zh: Dictionary = {
  title: '我的世界 · 林间小屋',
  description: '走进你的方块小世界。探索树林和小屋，挖掘方块，自由建造。',
  canvasLabel: '第一人称方块世界',
  brand: '林间小屋',
  subtitle: '我的方块世界',
  weather: '晴天 · 创造模式',
  languageLabel: '语言',
  pause: '暂停游戏',
  eyebrow: '你的方块小世界',
  welcome: '世界，等你来走走。',
  paused: '歇一会儿。',
  introduction: '穿过木桥，走进树林。也可以拆下一块，建一点自己的东西。',
  pauseDescription: '小屋和树林就在这里，随时继续探索。',
  move: '移动',
  space: '空格',
  jump: '跳跃',
  mine: '挖掘',
  place: '放置',
  mouseActions: '左键挖掘 · 右键放置',
  enter: '进入世界',
  resume: '继续探索',
  loading: '正在准备世界…',
  startNote: '鼠标环顾四周 · 数字 1–6 选方块 · Esc 暂停',
  returnHome: '回到小屋前',
  dragActions: '按住鼠标拖动视角 · 点击挖掘 · 右键放置',
  movementHint: 'WASD 移动 · 空格 跳跃 · Shift 快跑 · R 回家',
  hotbarLabel: '选择建造方块',
  forward: '前进',
  left: '向左',
  backward: '后退',
  right: '向右',
  touchHint: '拖动画面转动视角',
  playingFooter: '创造模式 · 刷新后世界重置',
  welcomeFooter: '一座小屋，一片树林，和你的想象力。',
  errors: {
    webgl: '无法启动 3D 画面，请使用支持 WebGL 的浏览器，并开启硬件加速。',
    load: '场景加载失败，请刷新页面重试。',
  },
  messages: {
    home: '已回到小屋前',
    dragHint: '按住鼠标拖动视角，短按左键挖掘',
    outOfReach: '靠近一点，准星对准方块',
    worldEdge: '这里已到建造边界',
    playerOverlap: '不能把方块放在自己站的位置',
    bedrock: '基岩托着整个世界，无法挖掘',
  },
  blocks: {
    1: '草方块',
    2: '泥土',
    3: '石头',
    4: '橡木板',
    5: '树叶',
    6: '陶瓦',
    7: '玻璃',
    8: '河水',
    9: '原木',
    10: '沙土',
    11: '耕地',
    12: '南瓜',
    13: '基岩',
    14: '小径',
  },
};

export const translations: Record<Locale, Dictionary> = { en, 'zh-CN': zh };

export function blockName(locale: Locale, block: number | null) {
  const names: Record<number, string> = translations[locale].blocks;
  return block === null ? '' : (names[block] ?? '');
}
