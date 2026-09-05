# Blender scene

[简体中文](README.md) | **English** · [Back to the project](../README.en.md)

- `voxel-grove.blend`: the finished, editable project. Open it directly in Blender.
- `build_world.py`: a script that generates the terrain, cabin, bridge, trees, wheat field, and props from an empty scene.
- `../docs/images/blender-scene.png`: the final render preview at 1800 × 1500 pixels.

The project was created and verified in Blender 5.2.1 LTS. All materials are included; no texture downloads are needed. Inspect and edit the scene in the viewport, or press `F12` to render it.

## Regenerate the scene

Run the following command from the repository root. It starts a separate Blender background process, generates the scene from the factory startup file, and renders it without affecting your currently open Blender window.

```bash
blender --background --factory-startup --python blender/build_world.py
```

On macOS, if `blender` is not in your PATH, use:

```bash
/Applications/Blender.app/Contents/MacOS/Blender \
  --background --factory-startup --python blender/build_world.py
```

The output files are `blender/我的世界_林间小屋.blend` and `blender/我的世界_高清预览.png`. They do not overwrite the included `voxel-grove.blend`. The script uses a fixed random seed. Rendering time depends on your hardware. It tries to use a Metal GPU and falls back to the CPU when unavailable.

The scene contains editable models, without a game controller. To move, jump, mine, and build, run the browser game from the repository root.
