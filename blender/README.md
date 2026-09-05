# Blender 场景

**简体中文** | [English](README.en.md) · [返回项目首页](../README.md)

- `voxel-grove.blend`：已完成的可编辑工程，直接用 Blender 打开。
- `build_world.py`：从空场景生成地形、小屋、桥梁、树林、麦田与道具的脚本。
- `../docs/images/blender-scene.png`：1800 × 1500 的最终渲染预览。

工程在 Blender 5.2.1 LTS 上制作和验证。所有材质内置，不需要下载贴图。打开工程后可在视口检查与编辑，按 `F12` 渲染。

## 重新生成

在仓库根目录运行以下命令。它会启动一个独立的 Blender 后台进程，从默认空场景生成并渲染，不影响当前打开的 Blender 窗口。

```bash
blender --background --factory-startup --python blender/build_world.py
```

macOS 如果没有 `blender` 命令，可以使用：

```bash
/Applications/Blender.app/Contents/MacOS/Blender \
  --background --factory-startup --python blender/build_world.py
```

输出为 `blender/我的世界_林间小屋.blend` 和 `blender/我的世界_高清预览.png`，不会覆盖仓库附带的 `voxel-grove.blend`。脚本固定随机种子；渲染需要一些时间，速度取决于设备。脚本尝试使用 Metal GPU，不可用时使用 CPU。

场景是可编辑模型，不含游戏控制器。要移动、跳跃、挖掘与搭建，请运行仓库根目录中的网页游戏。
