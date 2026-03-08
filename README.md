# TodayBingo

移动端优先的 Bingo 打卡 Web 应用。莫兰迪色系、8 字限制、主题切换、背景图（IndexedDB）、毛玻璃格子、连线彩带与 PWA。

## 在线演示

https://YOUR_GITHUB_USERNAME.github.io/TodayBingo/

## 功能

- **多表管理**：创建多个 Bingo 表，数据保存在 localStorage，支持 3×3 / 4×4 / 5×5
- **词条输入**：每行一个词，严格 8 字以内（多出自动截断），可超过所选规格数量并随机抽取不重复词条
- **主题风格**：玻璃 / 经典，支持浅 / 深主题切换
- **背景图**：本地导入图片作为全局背景，IndexedDB 存储防丢失；开启后格子为半透明毛玻璃（backdrop-filter: blur(8px)）
- **色系与字体**：高灰度低饱和莫兰迪色；无衬线粗体，字号随字数自动缩放
- **动效**：点击格子震动；横/竖/斜任一线完成时震动 + 莫兰迪色彩带雨
- **PWA**：可「添加到主屏幕」，全屏、离线可用

## 本地开发

用本地静态服务器打开项目根目录后访问，例如：

```bash
npx serve .
# 或
python -m http.server 8080
```

浏览器打开对应地址即可。移动端可「添加到主屏幕」使用。

## 测试

CI 会执行基础的 HTML 结构检查。需要本地验证时，可直接启动本地服务器并进行手动回归。

## 测试覆盖率

当前未引入自动化测试用例，覆盖率为 0%。

## 贡献指南

1. Fork 本仓库并创建分支
2. 完成修改并确保 CI 通过
3. 提交 Pull Request，描述改动动机与验证方式

## 技术

- 单页：HTML + CSS + JS 单文件
- 持久化：localStorage
- PWA：manifest.json + Service Worker

## 更新日志

### v1.0.1 (2026-03-07)

- 彩带动画持续时间精确缩短至 1 秒，保持流畅一致
- Reduced ribbon animation duration to exactly 1s with smooth playback
- 调整彩带区域字体与背景对比度，满足 WCAG 2.1 AA（≥4.5:1）
- Adjusted ribbon area text/background contrast to meet WCAG 2.1 AA (≥4.5:1)

## 许可

MIT
