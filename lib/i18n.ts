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
  githubStar: 'Star on GitHub',
  githubStarLabel: 'Star my-minecraft-world on GitHub (opens in a new tab)',
  creatorLabel:
    'Created by xudafeng · View GitHub profile (opens in a new tab)',
  creatorAvatar: "xudafeng's GitHub avatar",
  returnHome: 'Return to the cabin',
  dragActions: 'Drag to look · Click to mine · Right click to place',
  movementHint: 'WASD Move · Space Jump · Shift Sprint · R Home',
  hotbarLabel: 'Select a building block',
  forward: 'Move forward',
  left: 'Move left',
  backward: 'Move backward',
  right: 'Move right',
  touchHint: 'Drag the scene to look around',
  touchGuide: 'Move with the arrows · Drag the scene to look · Tap to build',
  materials: 'Materials',
  materialsDescription:
    'Choose a material for the selected hotbar slot. Bedrock stays protected.',
  useMaterial: 'Use selected material',
  close: 'Close',
  undo: 'Undo',
  redo: 'Redo',
  exportWorld: 'Export world',
  importWorld: 'Import world',
  importTitle: 'Open this world?',
  importDescription:
    'This replaces the world in this browser. Export your current world first if you want to keep both.',
  cancel: 'Cancel',
  storageNote:
    'Saved in this browser. Export a file to keep a backup or move to another device.',
  editorHint: 'E Materials · Q Pick block · Ctrl / ⌘ Z Undo',
  saves: {
    ready: 'Auto-save ready · This browser only',
    unsaved: 'Changes waiting to save',
    saving: 'Saving in this browser…',
    saved: 'Saved in this browser',
    unavailable: 'Browser save unavailable · Export a backup',
    conflict: 'Another tab saved this world · Export before reloading',
  },
  playingFooter: 'Creative mode',
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
    undone: 'Change undone',
    redone: 'Change restored',
    imported: 'Your world is ready',
    importFailed: 'This world file is invalid or uses an unsupported version',
    fileTooLarge: 'Choose a world file smaller than 4 MB',
    exported: 'World file downloaded',
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
  githubStar: '去 GitHub 点个 Star',
  githubStarLabel: '为 my-minecraft-world 点个 Star（在新标签页打开 GitHub）',
  creatorLabel: '作者 xudafeng · 查看 GitHub 主页（在新标签页打开）',
  creatorAvatar: 'xudafeng 的 GitHub 头像',
  returnHome: '回到小屋前',
  dragActions: '按住鼠标拖动视角 · 点击挖掘 · 右键放置',
  movementHint: 'WASD 移动 · 空格 跳跃 · Shift 快跑 · R 回家',
  hotbarLabel: '选择建造方块',
  forward: '前进',
  left: '向左',
  backward: '后退',
  right: '向右',
  touchHint: '拖动画面转动视角',
  touchGuide: '方向键移动 · 拖动画面环顾 · 点击按钮建造',
  materials: '材料',
  materialsDescription: '选择材料，放入当前快捷栏位置。基岩仍受到保护。',
  useMaterial: '使用所选材料',
  close: '关闭',
  undo: '撤销',
  redo: '重做',
  exportWorld: '导出世界',
  importWorld: '导入世界',
  importTitle: '打开这个世界？',
  importDescription:
    '这会替换当前浏览器中的世界。如果想保留两份，请先导出当前世界。',
  cancel: '取消',
  storageNote: '保存在当前浏览器中。导出文件可以备份，也可以带到其他设备。',
  editorHint: 'E 材料 · Q 吸取方块 · Ctrl / ⌘ Z 撤销',
  saves: {
    ready: '自动保存已就绪 · 仅限当前浏览器',
    unsaved: '修改等待保存',
    saving: '正在保存到浏览器…',
    saved: '已保存在当前浏览器',
    unavailable: '浏览器存档不可用 · 请导出备份',
    conflict: '其他标签页已保存此世界 · 刷新前请先导出',
  },
  playingFooter: '创造模式',
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
    undone: '已撤销修改',
    redone: '已恢复修改',
    imported: '你的世界已准备好',
    importFailed: '世界文件无效，或使用了暂不支持的版本',
    fileTooLarge: '请选择小于 4 MB 的世界文件',
    exported: '世界文件已下载',
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
