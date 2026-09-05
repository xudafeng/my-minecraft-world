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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HOTBAR, NAMES } from '@/lib/voxel-world';
import type { VoxelGame, GameState } from '@/lib/voxel-game';
const initial: GameState = {
  ready: false,
  playing: false,
  started: false,
  selected: 0,
  target: '',
  message: '',
  mode: '',
  coords: '',
};
export default function Game() {
  const host = useRef<HTMLDivElement>(null),
    game = useRef<VoxelGame | null>(null);
  const [state, setState] = useState(initial);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    import('@/lib/voxel-game')
      .then(({ VoxelGame }) => {
        if (!cancelled && host.current)
          try {
            game.current = new VoxelGame(host.current, setState);
          } catch (e) {
            setError(
              '无法启动 3D 画面，请使用支持 WebGL 的浏览器，并开启硬件加速。',
            );
            console.error(e);
          }
      })
      .catch(() => setError('场景加载失败，请刷新页面重试。'));
    return () => {
      cancelled = true;
      game.current?.dispose();
      game.current = null;
    };
  }, []);
  return (
    <main className="game-shell">
      <div className="world-canvas" ref={host} aria-label="第一人称方块世界" />
      <header className="world-header">
        <div className="brand">
          <Box size={23} />
          <div>
            <strong>林间小屋</strong>
            <span>我的方块世界</span>
          </div>
        </div>
        <div className="header-right">
          <span className="day-pill">
            <Sun size={16} />
            晴天 · 创造模式
          </span>
          {state.playing && (
            <Button
              className="icon-control"
              onClick={() => game.current?.pause()}
              aria-label="暂停游戏"
            >
              <Pause size={18} />
            </Button>
          )}
        </div>
      </header>
      {!state.playing && (
        <section className="start-layer">
          <div className="start-card">
            <span className="eyebrow">YOUR LITTLE WORLD</span>
            <h1>{state.started ? '歇一会儿。' : '世界，等你来走走。'}</h1>
            <p>
              {state.started
                ? '小屋和树林就在这里，随时继续探索。'
                : '穿过木桥，走进树林。也可以拆下一块，建一点自己的东西。'}
            </p>
            <div className="control-guide">
              <span>
                <Move size={17} />
                <kbd>W A S D</kbd> 移动
              </span>
              <span>
                <kbd>空格</kbd> 跳跃
              </span>
              <span>
                <MousePointer2 size={17} />
                左键挖掘 · 右键放置
              </span>
            </div>
            {error ? (
              <p role="alert" className="error-message">
                {error}
              </p>
            ) : (
              <Button
                className="play-button"
                disabled={!state.ready}
                onClick={() => game.current?.start()}
              >
                {state.ready
                  ? state.started
                    ? '继续探索'
                    : '进入世界'
                  : '正在准备世界…'}
                <ArrowRight size={21} />
              </Button>
            )}
            <div className="start-note">
              鼠标环顾四周 · 数字 1–6 选方块 · Esc 暂停
            </div>
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
                回到小屋前
              </Button>
            )}
          </div>
        </section>
      )}
      {state.playing && (
        <>
          <div className="crosshair" aria-hidden="true" />
          <div className="target-label">{state.target}</div>
          <div className="play-tip">
            {state.mode === 'drag'
              ? '按住鼠标拖动视角 · 点击挖掘 · 右键放置'
              : '左键 挖掘　右键 放置'}
            <span>WASD 移动 · 空格 跳跃 · Shift 快跑 · R 回家</span>
          </div>
          <div className="hotbar-wrap">
            <span className="selected-name">
              {NAMES[HOTBAR[state.selected]]}
            </span>
            <div className="hotbar" aria-label="选择建造方块">
              {HOTBAR.map((b, i) => (
                <Button
                  key={b}
                  className={'slot ' + (i === state.selected ? 'active' : '')}
                  onClick={() => game.current?.select(i)}
                  aria-label={`${i + 1} ${NAMES[b]}`}
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
            {state.message}
          </div>
        </>
      )}
      {state.playing && (
        <div className="touch-controls">
          <div className="touch-pad">
            {[
              { label: '前进', text: '↑', x: 0, z: 1 },
              { label: '向左', text: '←', x: -1, z: 0 },
              { label: '后退', text: '↓', x: 0, z: -1 },
              { label: '向右', text: '→', x: 1, z: 0 },
            ].map((d) => (
              <Button
                key={d.label}
                className={'touch-key touch-' + d.label}
                aria-label={d.label}
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
            <Button onClick={() => game.current?.jump()}>跳跃</Button>
            <Button onClick={() => game.current?.action()}>挖掘</Button>
            <Button onClick={() => game.current?.action(true)}>放置</Button>
          </div>
          <span className="touch-hint">拖动画面转动视角</span>
        </div>
      )}
      <footer className="world-footer">
        {state.playing
          ? '创造模式 · 刷新后世界重置'
          : '一座小屋，一片树林，和你的想象力。'}
      </footer>
    </main>
  );
}
