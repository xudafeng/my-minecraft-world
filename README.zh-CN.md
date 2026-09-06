# My Minecraft World · 我的方块世界

**简体中文** | [English](README.md)

**[直接在线游玩](https://xudafeng.github.io/my-minecraft-world/)**

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

## GitHub Pages

在线地址：<https://xudafeng.github.io/my-minecraft-world/>。[`.github/workflows/pages.yml`](.github/workflows/pages.yml) 会测试和构建各分支及拉取请求，仅 `main` 会部署到正式官网。仓库 **Settings → Pages** 的发布来源设为 **GitHub Actions**。

本地构建并预览同一个静态版本：

```bash
npm run build:pages
npm run preview:pages
```

打开终端打印的地址，保留末尾的 `/my-minecraft-world/`。此构建复用游戏组件，不需要后端服务。资源路径在 `vite.pages.config.ts` 中按仓库子路径配置；部署到其他路径时，请修改其中的 `base`。

## 玩法

| 操作              | 按键                                              |
| ----------------- | ------------------------------------------------- |
| 移动              | W / A / S / D 或方向键                            |
| 环顾              | 移动鼠标；浏览器不支持指针锁定时，按住左键拖动    |
| 跳跃 / 快跑       | 空格 / Shift                                      |
| 挖掘 / 放置       | 左键短按 / 右键                                   |
| 选择方块          | 数字 1–6、滚轮或点击物品栏                        |
| 材料 / 吸取方块   | E / Q（鼠标锁定时也可按中键）                     |
| 撤销 / 重做       | Ctrl 或 Command + Z / Ctrl 或 Command + Shift + Z |
| 回到小屋前 / 暂停 | R / Esc                                           |

包含木屋、桥、河流、树林、麦田和两只装饰小羊；有重力、碰撞、挖掘粒子、六个可自定义快捷栏位置，以及全部 13 种可编辑材料。玩家使用第一人称视角，画面中可以看到手臂。触屏界面提供移动、跳跃和建造按钮。

这是一个小型创造模式游戏。**世界会自动保存在当前浏览器中**，包括方块修改、位置、视角和快捷栏。方块修改立即触发保存，移动过程定期保存，暂停时也会保存。关闭前请等待“已保存在当前浏览器”。存档仅属于当前设备和浏览器，不会跨设备同步，也可能被浏览器清理。在暂停菜单中“导出世界”可以保留 JSON 备份，再通过“导入世界”在其他设备恢复；替换当前世界前会先确认。

撤销与重做保留当前会话最近 200 次修改，刷新或导入后重新开始记录。如果恢复方块会把玩家困住，需要先移开再操作。在材料面板选择的材料会替换当前快捷栏位置，基岩仍受保护。

浏览器存储不可用或已有存档无法读取时，游戏仍可继续并支持导出，不会用空世界覆盖旧存档。其他标签页先保存时，当前页面会停止自动写入，并提示先导出再刷新。暂不支持联机或生存系统；小羊仍为场景装饰，没有养殖玩法。

## Blender 工程

使用 Blender 打开 [`blender/voxel-grove.blend`](blender/voxel-grove.blend)。地形、建筑、树木和道具均可编辑，材质内置。

生成脚本与重建步骤见 [Blender 中文说明](blender/README.zh-CN.md)。Blender 工程用于建模和渲染，游玩入口是上面的网页游戏。

## 代码结构

```text
app/world-game.tsx       游戏界面与输入控件
app/globals.css          界面样式
github-pages/           GitHub Pages 静态浏览器入口
vite.pages.config.ts    静态构建与仓库子路径
lib/voxel-world.ts       世界生成、碰撞与射线检测
lib/voxel-game.ts        Three.js 渲染、角色控制与方块交互
lib/i18n.ts              中英文文案与语言偏好
lib/world-session.ts    编辑历史与存档验证
lib/world-storage.ts    浏览器存档与多标签页冲突保护
lib/touch-input.ts      独立处理移动与转向指针
tests/                  物理、存档、触控与语言偏好测试
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

测试覆盖物理、建造边界、撤销与重做、存档验证和恢复、多标签页写入冲突（使用 IndexedDB 测试实现）、多指输入和语言偏好。先前版本已在本机浏览器验证基础移动与方块交互；本分支的浏览器交互与触屏真机验收仍待完成。

本项目是受 Minecraft 方块风格启发的独立练习，与 Mojang 或 Microsoft 无关联。
