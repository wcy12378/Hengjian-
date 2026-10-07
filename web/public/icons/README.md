# 衡鉴 PWA 图标

## 自动生成

PNG 图标通过 `npm run generate-icons` 从 `../favicon.svg` 生成。修改源图后运行此命令更新各尺寸图标。

## 图标源

- 唯一源文件：`../favicon.svg`

脚本会从同一份源文件生成全部 PWA PNG 尺寸，避免维护内容重复的 SVG 副本。

## 自定义图标

如需更新图标：

1. 编辑 `../favicon.svg`
2. 运行 `npm run generate-icons` 重新生成 PNG
3. 或使用设计工具（Figma、Sketch）创建专业图标，直接替换 PNG 文件
