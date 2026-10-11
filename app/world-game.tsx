'use client';
import { RECIPES, type Recipe } from '@/lib/survival';
import { RELICS } from '@/lib/adventure';
import { useEffect, useRef, useState } from 'react';
import {
  Hammer,
  Sword,
  Soup,
  Tent,
  Layers,
  ArrowRight,
  Pause,
  Home,
  MousePointer2,
  Move,
  Sun,
  Box,
  Star,
  Undo2,
  Redo2,
  Download,
  Upload,
  Grid2X2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HOTBAR, BUILDABLE_BLOCKS } from '@/lib/voxel-world';
import { loadBrowserWorld } from '@/lib/world-storage';
import {
  MAX_SAVE_BYTES,
  parseSnapshot,
  type WorldSnapshot,
} from '@/lib/world-session';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DEFAULT_LOCALE,
  translations,
  blockName,
  readLocale,
  writeLocale,
  type Locale,
  type GameError,
} from '@/lib/i18n';
import type { VoxelGame, GameState } from '@/lib/voxel-game';
const initial: GameState = {
  ready: false,
  playing: false,
  started: false,
  selected: 0,
  target: null,
  message: null,
  mode: '',
  coords: '',
  hotbar: [...HOTBAR],
  canUndo: false,
  canRedo: false,
  paletteOpen: false,
  saveStatus: 'ready',
};
export default function Game() {
  const host = useRef<HTMLDivElement>(null),
    game = useRef<VoxelGame | null>(null);
  const [state, setState] = useState(initial);
  const [error, setError] = useState<GameError | null>(null);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<WorldSnapshot | null>(
    null,
  );
  const t = translations[locale];
  useEffect(() => setLocale(readLocale()), []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t.description);
  }, [locale, t]);
  const changeLocale = (next: Locale) => {
    setLocale(next);
    writeLocale(next);
  };
  useEffect(() => {
    let cancelled = false;
    import('@/lib/voxel-game')
      .then(async ({ VoxelGame }) => {
        const saved = await loadBrowserWorld();
        if (!cancelled && host.current)
          try {
            game.current = new VoxelGame(host.current, setState, saved);
          } catch (e) {
            setError('webgl');
            console.error(e);
          }
      })
      .catch(() => setError('load'));
    return () => {
      cancelled = true;
      game.current?.dispose();
      game.current = null;
    };
  }, []);
  const exportWorld = () => {
    if (!game.current) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(game.current.snapshot())], {
        type: 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-minecraft-world.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    game.current.notify('exported');
  };
  return (
    <main className={'game-shell' + (state.playing ? ' is-playing' : '')}>
      <div className="world-canvas" ref={host} aria-label={t.canvasLabel} />
      <header className="world-header">
        <div className="brand">
          <Box size={23} />
          <div>
            <strong>{t.brand}</strong>
            <span>{t.subtitle}</span>
          </div>
        </div>
        <div className="header-right">
          <span className="day-pill">
            <Sun size={16} />
            {state.night
              ? locale === 'zh-CN'
                ? '月夜'
                : 'Moonlit night'
              : locale === 'zh-CN'
                ? '白昼'
                : 'Daylight'}{' '}
            ·{' '}
            {state.survival?.mode === 'creative'
              ? locale === 'zh-CN'
                ? '自由建造'
                : 'Creative'
              : locale === 'zh-CN'
                ? '探险'
                : 'Adventure'}
          </span>
          <div
            className="language-switch"
            role="group"
            aria-label={t.languageLabel}
            onKeyDown={(event) => {
              if (event.key !== 'Escape') event.stopPropagation();
            }}
          >
            <Button
              className="language-option"
              lang="en"
              aria-label="English"
              aria-pressed={locale === 'en'}
              onClick={() => changeLocale('en')}
            >
              EN
            </Button>
            <Button
              className="language-option"
              lang="zh-CN"
              aria-label="简体中文"
              aria-pressed={locale === 'zh-CN'}
              onClick={() => changeLocale('zh-CN')}
            >
              中文
            </Button>
          </div>
          {state.playing && (
            <Button
              className="icon-control"
              onClick={() => game.current?.pause()}
              aria-label={t.pause}
            >
              <Pause size={18} />
            </Button>
          )}
        </div>
      </header>
      {!state.playing && !state.paletteOpen && (
        <section className="start-layer">
          <div className="start-card">
            <span className="eyebrow">{t.eyebrow}</span>
            <h1>{state.started ? t.paused : t.welcome}</h1>
            <p>{state.started ? t.pauseDescription : t.introduction}</p>
            <div className="control-guide desktop-guide">
              <span>
                <Move size={17} />
                <kbd>W A S D</kbd> {t.move}
              </span>
              <span>
                <kbd>{t.space}</kbd> {t.jump}
              </span>
              <span>
                <MousePointer2 size={17} />
                {t.mouseActions}
              </span>
            </div>
            <p className="touch-guide">{t.touchGuide}</p>
            {error ? (
              <p role="alert" className="error-message">
                {t.errors[error]}
              </p>
            ) : (
              <Button
                className="play-button"
                disabled={!state.ready}
                onClick={() => game.current?.start()}
              >
                {state.ready ? (state.started ? t.resume : t.enter) : t.loading}
                <ArrowRight size={21} />
              </Button>
            )}
            <div className="adventure-intro">
              {locale === 'zh-CN'
                ? '躲开苦力怕，寻找 8 枚发光遗物。左键攻击，闪白时快跑。3 枚解锁疾跑，5 枚解锁二段跳。屋顶上的那枚？搭楼梯试试。'
                : 'Dodge creepers and find 8 glowing relics. Left click to punch; run when they flash. Collect 3 for speed boots, 5 for double jump. The rooftop relic? Build your way up.'}
            </div>
            {state.adventure?.collected.length === RELICS.length && (
              <Button onClick={() => game.current?.restartAdventure()}>
                {locale === 'zh-CN'
                  ? '再来一局 · 挑战最快纪录'
                  : 'New treasure run · Beat your best'}
              </Button>
            )}
            {state.ready && (
              <details
                className="camp-disclosure"
                open={state.started || undefined}
              >
                <summary>
                  <Hammer size={17} aria-hidden="true" />
                  <span>
                    {locale === 'zh-CN' ? '物资与制作' : 'Supplies & crafting'}
                  </span>
                </summary>
                <div className="camp-panel">
                  <div className="camp-title">
                    <strong>
                      <Hammer size={18} aria-hidden="true" />
                      {locale === 'zh-CN' ? '营地工作台' : 'Camp workbench'}
                    </strong>
                    <Button onClick={() => game.current?.toggleMode()}>
                      {state.survival?.mode === 'creative'
                        ? locale === 'zh-CN'
                          ? '切换探险模式'
                          : 'Switch to adventure'
                        : locale === 'zh-CN'
                          ? '切换自由建造'
                          : 'Switch to creative'}
                    </Button>
                  </div>
                  <p>
                    {locale === 'zh-CN'
                      ? '白天 3 分钟，夜晚 90 秒。夜里安全区失效；采集材料、制作石剑，搭墙挡住爆炸。白天回营地恢复生命。'
                      : '3-minute days, 90-second nights. Home loses its protection at night. Gather, craft a stone sword and build blast cover. Heal at camp during daylight.'}
                  </p>
                  <p>
                    ♥ {Math.ceil(state.health ?? 100)}/100 ·{' '}
                    {state.survival?.sword
                      ? locale === 'zh-CN'
                        ? '已装备石剑'
                        : 'Stone sword equipped'
                      : locale === 'zh-CN'
                        ? '徒手'
                        : 'Bare hands'}
                  </p>
                  {state.activity === 'crafted' && (
                    <output>
                      {locale === 'zh-CN' ? '制作完成' : 'Crafted'}
                    </output>
                  )}
                  <div className="resource-list">
                    {Object.entries(state.survival?.inventory ?? {})
                      .filter(([, n]) => n > 0)
                      .map(([b, n]) => (
                        <span key={b}>
                          <i
                            className={'resource-swatch block-' + b}
                            aria-hidden="true"
                          />
                          {blockName(locale, Number(b))} <b>{n}</b>
                        </span>
                      ))}
                  </div>
                  <div className="recipe-list">
                    {(Object.keys(RECIPES) as Recipe[]).map((recipe) => {
                      const names = {
                        planks: ['木板 ×4', 'Planks ×4'],
                        glass: ['玻璃 ×3', 'Glass ×3'],
                        roof: ['屋顶 ×3', 'Roof ×3'],
                        sword: ['石剑 · 两击击败', 'Stone sword · 2 hits'],
                        food: ['南瓜餐 · 恢复35', 'Pumpkin meal · Heal 35'],
                        camp: [
                          '营地升级 · 加快恢复',
                          'Camp upgrade · Faster healing',
                        ],
                      };
                      const unlocked =
                        (recipe === 'sword' && state.survival?.sword) ||
                        (recipe === 'camp' && (state.survival?.camp ?? 0) >= 3);
                      const affordable =
                        state.survival?.mode === 'creative' ||
                        Object.entries(RECIPES[recipe].cost).every(
                          ([id, n]) =>
                            (state.survival?.inventory[Number(id)] ?? 0) >= n,
                        );
                      const RecipeIcon = {
                        planks: Layers,
                        glass: Box,
                        roof: Home,
                        sword: Sword,
                        food: Soup,
                        camp: Tent,
                      }[recipe];
                      return (
                        <Button
                          className="recipe-card"
                          key={recipe}
                          disabled={
                            !!unlocked ||
                            !affordable ||
                            (recipe === 'food' && (state.health ?? 100) >= 100)
                          }
                          onClick={() => game.current?.craft(recipe)}
                        >
                          <span className="recipe-icon">
                            <RecipeIcon size={19} aria-hidden="true" />
                          </span>
                          <span className="recipe-copy">
                            <strong>
                              {names[recipe][locale === 'zh-CN' ? 0 : 1]}
                            </strong>
                            <small>
                              {Object.entries(RECIPES[recipe].cost)
                                .map(
                                  ([id, n]) =>
                                    `${blockName(locale, Number(id))} ${n}`,
                                )
                                .join(' + ')}
                            </small>
                            <span className="recipe-status">
                              {unlocked
                                ? locale === 'zh-CN'
                                  ? '已升级'
                                  : 'Unlocked'
                                : !affordable
                                  ? locale === 'zh-CN'
                                    ? '材料不足'
                                    : 'Need materials'
                                  : recipe === 'food' &&
                                      (state.health ?? 100) >= 100
                                    ? locale === 'zh-CN'
                                      ? '生命已满'
                                      : 'Full health'
                                    : locale === 'zh-CN'
                                      ? '点击制作'
                                      : 'Craft'}
                            </span>
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                  <small>
                    {locale === 'zh-CN'
                      ? `营地等级 ${state.survival?.camp ?? 0}/3 · 探险模式中放置消耗材料，挖掘回收，撤销关闭`
                      : `Camp level ${state.survival?.camp ?? 0}/3 · Adventure building consumes materials; mining recovers them; undo is disabled`}
                  </small>
                </div>
              </details>
            )}
            <div className="start-note">{t.startNote}</div>
            {state.ready && (
              <div className="session-tools">
                {state.started && (
                  <>
                    <Button onClick={() => game.current?.pause()}>
                      {locale === 'zh-CN' ? '制作 / 营地' : 'Craft / Camp'}
                    </Button>
                    <Button onClick={() => game.current?.openPalette()}>
                      <Grid2X2 size={16} />
                      {t.materials}
                    </Button>
                    <Button
                      disabled={!state.canUndo}
                      onClick={() => game.current?.history()}
                    >
                      <Undo2 size={16} />
                      {t.undo}
                    </Button>
                    <Button
                      disabled={!state.canRedo}
                      onClick={() => game.current?.history(true)}
                    >
                      <Redo2 size={16} />
                      {t.redo}
                    </Button>
                    <Button onClick={exportWorld}>
                      <Download size={16} />
                      {t.exportWorld}
                    </Button>
                  </>
                )}
                <Button onClick={() => fileInput.current?.click()}>
                  <Upload size={16} />
                  {t.importWorld}
                </Button>
                {state.started && (
                  <Button
                    onClick={() => {
                      game.current?.respawn();
                      game.current?.start();
                    }}
                  >
                    <Home size={16} />
                    {t.returnHome}
                  </Button>
                )}
                <p className="storage-note">{t.storageNote}</p>
              </div>
            )}
            <div className="project-links">
              <a
                className="creator-link"
                href="https://github.com/xudafeng"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.creatorLabel}
                title={t.creatorLabel}
              >
                <Avatar className="creator-avatar">
                  <AvatarImage
                    src="https://avatars.githubusercontent.com/u/1011681?v=4&s=96"
                    alt={t.creatorAvatar}
                    width={40}
                    height={40}
                  />
                  <AvatarFallback>X</AvatarFallback>
                </Avatar>
              </a>
              <a
                className="github-link"
                href="https://github.com/xudafeng/my-minecraft-world"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.githubStarLabel}
              >
                <Star size={20} aria-hidden="true" />
                <span className="github-link-copy">
                  <strong>{t.githubStar}</strong>
                  <span>github.com/xudafeng/my-minecraft-world</span>
                </span>
              </a>
            </div>
          </div>
        </section>
      )}
      {state.playing && (
        <>
          <div className={'survival-hud' + (state.danger ? ' danger' : '')}>
            <strong>
              ♥ {Math.ceil(state.health ?? 100)}/100{' '}
              {state.survival?.sword ? '⚔' : '✊'}
            </strong>
            <span>
              {locale === 'zh-CN' ? '第' : 'Day '}
              {state.day ?? 1}
              {locale === 'zh-CN' ? '天 · ' : ' · '}
              {state.night
                ? locale === 'zh-CN'
                  ? '夜晚'
                  : 'Night'
                : locale === 'zh-CN'
                  ? '白天'
                  : 'Daylight'}{' '}
              {state.phaseRemaining ?? 180}s
            </span>
            <span>
              {state.danger
                ? locale === 'zh-CN'
                  ? '苦力怕要爆炸了！快跑！'
                  : 'Creeper fuse lit! RUN!'
                : locale === 'zh-CN'
                  ? '左键攻击 · 白天营地恢复生命'
                  : 'Left click to attack · Daytime camp heals'}
            </span>
            <small>
              {locale === 'zh-CN' ? '守过的夜晚' : 'Nights survived'}:{' '}
              {state.survival?.nights ?? 0}
            </small>
          </div>
          {state.activity && (
            <div className="activity-notice" role="status">
              {
                {
                  resources:
                    locale === 'zh-CN'
                      ? '材料不足，先挖掘采集'
                      : 'Not enough materials. Mine to gather.',
                  crafted: locale === 'zh-CN' ? '制作完成！' : 'Crafted!',
                  dawn:
                    locale === 'zh-CN'
                      ? '天亮了！奖励：木板4、石头4、南瓜1'
                      : 'Dawn! Reward: 4 wood, 4 stone, 1 pumpkin',
                  night:
                    locale === 'zh-CN'
                      ? '夜袭开始！营地不再安全，准备战斗'
                      : 'Night raid! Home is no longer safe.',
                }[state.activity]
              }
            </div>
          )}
          {state.combatNotice && (
            <div className="combat-notice" role="status">
              {
                {
                  hit:
                    locale === 'zh-CN'
                      ? '击退！继续攻击'
                      : 'Knocked back! Keep attacking',
                  hurt:
                    locale === 'zh-CN'
                      ? '被爆炸击中！找掩体'
                      : 'Blast damage! Find cover',
                  defeated:
                    locale === 'zh-CN'
                      ? '苦力怕已击败 · 石头 +2'
                      : 'Creeper defeated · Stone +2',
                  respawn:
                    locale === 'zh-CN'
                      ? '你被炸倒了 · 已回营地，遗物保留'
                      : 'You fell · Respawned at camp, relics kept',
                }[state.combatNotice]
              }
            </div>
          )}
          <aside
            className="adventure-hud"
            aria-label={locale === 'zh-CN' ? '探险进度' : 'Adventure progress'}
          >
            <strong>
              ✦ {locale === 'zh-CN' ? '林间寻宝' : 'Grove treasure hunt'} ·{' '}
              {state.adventure?.collected.length ?? 0}/8
            </strong>
            <div className="relic-progress">
              {RELICS.map((r, i) => (
                <span
                  key={i}
                  className={
                    state.adventure?.collected.includes(i) ? 'found' : ''
                  }
                  title={locale === 'zh-CN' ? r.zh : r.en}
                >
                  ◆
                </span>
              ))}
            </div>
            <p>
              {Math.floor((state.adventure?.elapsed ?? 0) / 60)}:
              {String(
                Math.floor((state.adventure?.elapsed ?? 0) % 60),
              ).padStart(2, '0')}
              {state.adventure?.best != null &&
                ` · ${locale === 'zh-CN' ? '最佳' : 'Best'} ${state.adventure.best.toFixed(1)}s`}
            </p>
            <p>
              {(state.adventure?.collected.length ?? 0) === 8
                ? locale === 'zh-CN'
                  ? '全部找到！暂停后可开启新一局。'
                  : 'All found! Pause to start another run.'
                : (() => {
                    const r = RELICS.find(
                      (_, i) => !state.adventure?.collected.includes(i),
                    )!;
                    return locale === 'zh-CN'
                      ? `下一站：${r.zh} · X ${r.x} / Z ${r.z}`
                      : `Next: ${r.en} · X ${r.x} / Z ${r.z}`;
                  })()}
            </p>
            <small>
              {locale === 'zh-CN'
                ? '3 ◆ 疾跑 · 5 ◆ 二段跳 · 靠近自动收集'
                : '3 ◆ Speed · 5 ◆ Double jump · Walk into relics'}
            </small>
          </aside>
          <div className="crosshair" aria-hidden="true" />
          <div className="target-label">{blockName(locale, state.target)}</div>
          <div className="play-tip">
            {state.mode === 'drag' ? t.dragActions : t.mouseActions}
            <span>{t.movementHint}</span>
            <span>
              {state.survival?.mode === 'creative'
                ? t.editorHint
                : locale === 'zh-CN'
                  ? '挖掘采集材料 · 暂停进入营地制作'
                  : 'Mine to gather · Pause to craft at camp'}
            </span>
          </div>
          <div className="edit-toolbar">
            <Button
              disabled={!state.canUndo}
              onClick={() => game.current?.history()}
              aria-label={t.undo}
            >
              <Undo2 size={17} />
            </Button>
            <Button onClick={() => game.current?.pause()}>
              {locale === 'zh-CN' ? '制作 / 营地' : 'Craft / Camp'}
            </Button>
            <Button onClick={() => game.current?.openPalette()}>
              <Grid2X2 size={17} />
              {t.materials}
            </Button>
            <Button
              disabled={!state.canRedo}
              onClick={() => game.current?.history(true)}
              aria-label={t.redo}
            >
              <Redo2 size={17} />
            </Button>
          </div>
          <div className="hotbar-wrap">
            <span className="selected-name">
              {blockName(locale, state.hotbar[state.selected])} ·{' '}
              {state.survival?.mode === 'creative'
                ? '∞'
                : (state.survival?.inventory[state.hotbar[state.selected]] ??
                  0)}
            </span>
            <div className="hotbar" aria-label={t.hotbarLabel}>
              {state.hotbar.map((b, i) => (
                <Button
                  key={i}
                  className={'slot ' + (i === state.selected ? 'active' : '')}
                  onClick={() => game.current?.select(i)}
                  aria-label={`${i + 1} ${blockName(locale, b)}`}
                  aria-pressed={i === state.selected}
                >
                  <span className={'block-swatch block-' + b} />
                  <span className="slot-number">{i + 1}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="coordinates">{state.coords}</div>
          <div className="game-message" role="status">
            {state.message ? t.messages[state.message] : null}
          </div>
        </>
      )}
      {state.playing && (
        <div className="touch-controls">
          <div className="touch-pad">
            {[
              { label: 'forward' as const, text: '↑', x: 0, z: 1 },
              { label: 'left' as const, text: '←', x: -1, z: 0 },
              { label: 'backward' as const, text: '↓', x: 0, z: -1 },
              { label: 'right' as const, text: '→', x: 1, z: 0 },
            ].map((d) => (
              <Button
                key={d.label}
                className={'touch-key touch-' + d.label}
                aria-label={t[d.label]}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  game.current?.touchMove(e.pointerId, d.x, d.z);
                }}
                onPointerUp={(e) => game.current?.touchRelease(e.pointerId)}
                onPointerCancel={(e) => game.current?.touchRelease(e.pointerId)}
                onLostPointerCapture={(e) =>
                  game.current?.touchRelease(e.pointerId)
                }
              >
                {d.text}
              </Button>
            ))}
          </div>
          <div className="touch-actions">
            <Button onClick={() => game.current?.jump()}>{t.jump}</Button>
            <Button onClick={() => game.current?.action()}>
              {locale === 'zh-CN' ? '攻击 / 挖掘' : 'Punch / Mine'}
            </Button>
            <Button onClick={() => game.current?.action(true)}>
              {t.place}
            </Button>
          </div>
          <span className="touch-hint">{t.touchHint}</span>
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label={t.importWorld}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (!file) return;
          if (file.size > MAX_SAVE_BYTES) {
            game.current?.notify('fileTooLarge');
            return;
          }
          void file
            .text()
            .then((text) => setPendingImport(parseSnapshot(JSON.parse(text))))
            .catch(() => game.current?.notify('importFailed'));
        }}
      />
      <Dialog
        open={state.paletteOpen}
        onOpenChange={(open) => {
          if (!open) game.current?.closePalette();
        }}
      >
        <DialogContent
          className="materials-dialog"
          showCloseButton={false}
          finalFocus={() =>
            game.current?.state.playing
              ? false
              : document.querySelector<HTMLButtonElement>('.play-button')
          }
        >
          <DialogTitle>{t.materials}</DialogTitle>
          <DialogDescription>{t.materialsDescription}</DialogDescription>
          <div className="material-grid">
            {BUILDABLE_BLOCKS.map((block) => (
              <Button
                key={block}
                className="material-option"
                aria-pressed={state.hotbar[state.selected] === block}
                onClick={() => game.current?.chooseMaterial(block)}
              >
                <span
                  className={'block-swatch block-' + block}
                  aria-hidden="true"
                />
                <span>{blockName(locale, block)}</span>
              </Button>
            ))}
          </div>
          <div className="dialog-actions">
            <Button onClick={() => game.current?.closePalette()}>
              {t.close}
            </Button>
            <Button
              className="confirm-action"
              onClick={() => {
                game.current?.closePalette();
                game.current?.start();
              }}
            >
              {t.useMaterial}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!pendingImport}
        onOpenChange={(open) => {
          if (!open) setPendingImport(null);
        }}
      >
        <DialogContent
          className="import-dialog"
          showCloseButton={false}
          finalFocus={() =>
            document.querySelector<HTMLButtonElement>('.play-button')
          }
        >
          <DialogTitle>{t.importTitle}</DialogTitle>
          <DialogDescription>{t.importDescription}</DialogDescription>
          <Button onClick={exportWorld}>
            <Download size={16} />
            {t.exportWorld}
          </Button>
          <div className="dialog-actions">
            <Button onClick={() => setPendingImport(null)}>{t.cancel}</Button>
            <Button
              className="confirm-action"
              onClick={() => {
                if (pendingImport) game.current?.importWorld(pendingImport);
                setPendingImport(null);
              }}
            >
              {t.importWorld}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <footer className="world-footer">
        <output aria-live="polite">
          {state.ready ? t.saves[state.saveStatus] : t.welcomeFooter}
        </output>
      </footer>
      {!state.playing && state.message && (
        <output className="game-message menu-message" aria-live="polite">
          {t.messages[state.message]}
        </output>
      )}
    </main>
  );
}
