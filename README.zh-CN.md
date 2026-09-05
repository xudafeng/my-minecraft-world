# My Minecraft World · 我的方块世界

**简体中文** | [English](README.md)

一个 Minecraft 风格的林间小世界，从 Blender 方块场景延伸为第一人称网页小游戏。穿过木桥、走进小屋，在树林旁挖掘和搭建自己的世界。

使用 Codex 协助制作；包含网页游戏源码、Blender 场景生成脚本和可编辑工程。

游戏和文档均支持中英文，默认使用英文。点击界面右上角的 **EN / 中文** 切换语言，浏览器会记住选择。切换语言会保留当前世界和玩家位置；鼠标锁定时可先按 `Esc` 暂停，再切换。

![Blender 中的林间小屋场景](docs/images/blender-scene.png)

_上图是 Blender 渲染图。网页游戏用 Three.js 重新搭建了同主题场景，两者不是完全相同的模型或画面。_

## 本地运行

需要 Node.js 22.13 或更新版本、npm，以及支持 WebGL 的浏览器。首次安装需要联网；本地运行无需登录或配置云服务密钥。

```bash
npm install
npm run build
npm run start -- --ip 127.0.0.1 --port 4173
```

在浏览器打开 <http://127.0.0.1:4173>，点击「Enter world」（进入世界）。保持终端运行，按 `Ctrl+C` 停止服务。

修改代码时可以使用 `npm run dev`，打开终端打印的本地地址。

## 玩法

| 操作              | 按键                                           |
| ----------------- | ---------------------------------------------- |
| 移动              | W / A / S / D 或方向键                         |
| 环顾              | 移动鼠标；浏览器不支持指针锁定时，按住左键拖动 |
| 跳跃 / 快跑       | 空格 / Shift                                   |
| 挖掘 / 放置       | 左键短按 / 右键                                |
| 选择方块          | 数字 1–6、滚轮或点击物品栏                     |
| 回到小屋前 / 暂停 | R / Esc                                        |

包含木屋、桥、河流、树林、麦田和两只装饰小羊；有重力、碰撞、挖掘粒子和六种可建造方块。玩家使用第一人称视角，画面中可以看到手臂。触屏界面提供移动、跳跃和建造按钮。

这是一个小型创造模式原型：**刷新页面会重置世界**，暂不支持存档、联机或生存系统。基岩不可挖掘，建造有边界；小羊是场景装饰，没有养殖玩法。

## Blender 工程

使用 Blender 打开 [`blender/voxel-grove.blend`](blender/voxel-grove.blend)。地形、建筑、树木和道具均可编辑，材质内置。

生成脚本与重建步骤见 [Blender 中文说明](blender/README.zh-CN.md)。Blender 工程用于建模和渲染，游玩入口是上面的网页游戏。

## 代码结构

```text
app/world-game.tsx       游戏界面与输入控件
app/globals.css          界面样式
lib/voxel-world.ts       世界生成、碰撞与射线检测
lib/voxel-game.ts        Three.js 渲染、角色控制与方块交互
lib/i18n.ts              中英文文案与语言偏好
tests/                  物理、交互边界与语言偏好测试
blender/                可编辑场景与 Python 生成脚本
docs/images/            Blender 渲染预览
```

技术栈：TypeScript、React、Three.js、Vinext、Vite。开发与预览使用本地 Cloudflare Worker 模拟器。`.openai/hosting.json` 仅保留空配置，不绑定任何个人部署。

## 验证

```bash
npm test
npx tsc --noEmit
npm run build
```

测试覆盖出生点、门洞、重力、跳跃、墙壁与天花板碰撞、射线命中、放置边界和语言偏好读写。网页已在本机浏览器验证基础移动与方块交互；触屏控件尚未在真实手机上验证。

本项目是受 Minecraft 方块风格启发的独立练习，与 Mojang 或 Microsoft 无关联。
