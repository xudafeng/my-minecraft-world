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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HOTBAR } from '@/lib/voxel-world';
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
};
export default function Game() {
  const host = useRef<HTMLDivElement>(null),
    game = useRef<VoxelGame | null>(null);
  const [state, setState] = useState(initial);
  const [error, setError] = useState<GameError | null>(null);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
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
      .then(({ VoxelGame }) => {
        if (!cancelled && host.current)
          try {
            game.current = new VoxelGame(host.current, setState);
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
  return (
    <main className="game-shell">
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
      {!state.playing && (
        <section className="start-layer">
          <div className="start-card">
            <span className="eyebrow">{t.eyebrow}</span>
            <h1>{state.started ? t.paused : t.welcome}</h1>
            <p>{state.started ? t.pauseDescription : t.introduction}</p>
            <div className="control-guide">
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
            {state.started && (
              <Button
                variant="ghost"
                className="return-button"
                onClick={() => {
                  game.current?.respawn();
                  game.current?.start();
                }}
              >
                <Home size={16} />
                {t.returnHome}
              </Button>
            )}
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
          </div>
          <div className="hotbar-wrap">
            <span className="selected-name">
              {blockName(locale, HOTBAR[state.selected])}
            </span>
            <div className="hotbar" aria-label={t.hotbarLabel}>
              {HOTBAR.map((b, i) => (
                <Button
                  key={b}
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
                  game.current?.touchMove(d.x, d.z);
                }}
                onPointerUp={() => game.current?.touchMove(0, 0)}
                onPointerCancel={() => game.current?.touchMove(0, 0)}
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
      <footer className="world-footer">
        {state.playing ? t.playingFooter : t.welcomeFooter}
      </footer>
    </main>
  );
}
