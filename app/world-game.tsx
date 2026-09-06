'use client';
import { useEffect, useRef, useState } from 'react';
import {
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
            {t.weather}
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
            <div className="start-note">{t.startNote}</div>
            {state.ready && (
              <div className="session-tools">
                {state.started && (
                  <>
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
          <div className="crosshair" aria-hidden="true" />
          <div className="target-label">{blockName(locale, state.target)}</div>
          <div className="play-tip">
            {state.mode === 'drag' ? t.dragActions : t.mouseActions}
            <span>{t.movementHint}</span>
            <span>{t.editorHint}</span>
          </div>
          <div className="edit-toolbar">
            <Button
              disabled={!state.canUndo}
              onClick={() => game.current?.history()}
              aria-label={t.undo}
            >
              <Undo2 size={17} />
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
              {blockName(locale, state.hotbar[state.selected])}
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
            <Button onClick={() => game.current?.action()}>{t.mine}</Button>
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
