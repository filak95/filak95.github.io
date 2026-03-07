# TodayBingo

移动端优先的 Bingo 打卡 Web 应用。莫兰迪色系、8 字限制、主题切换、背景图（IndexedDB）、毛玻璃格子、连线彩带与 PWA。

## 功能

- **多表管理**：创建多个 Bingo 表，数据保存在 localStorage，5×5 随机打乱无 FREE 位
- **25 词 · 8 字**：每行一个词，严格 8 字以内（多出自动截断），生成/打乱填入 5×5
- **莫兰迪主题**：顶部 Toggle 切换「浅 · 莫兰迪」/「深 · 莫兰迪」
- **背景图**：上传图片作为全局背景，IndexedDB 存储防丢失；开启后格子为半透明毛玻璃（backdrop-filter: blur(8px)）
- **色系与字体**：高灰度低饱和莫兰迪色；无衬线粗体，字号随字数自动缩放
- **动效**：点击格子震动；横/竖/斜任一线完成时震动 + 莫兰迪色彩带雨
- **分享图**：生成仅含 Bingo 网格与日期的图片
- **PWA**：可「添加到主屏幕」，全屏、离线可用

## 使用

用本地静态服务器打开项目根目录后访问，例如：

```bash
npx serve .
# 或
python -m http.server 8080
```

浏览器打开对应地址即可。移动端可「添加到主屏幕」使用。

## 技术

- 单页：HTML + CSS + JS 单文件
- 持久化：localStorage
- 分享图：html2canvas
- PWA：manifest.json + Service Worker

## 更新日志

### v1.0.1 (2026-03-07)

- 彩带动画持续时间精确缩短至 1 秒，保持流畅一致
- Reduced ribbon animation duration to exactly 1s with smooth playback
- 调整彩带区域字体与背景对比度，满足 WCAG 2.1 AA（≥4.5:1）
- Adjusted ribbon area text/background contrast to meet WCAG 2.1 AA (≥4.5:1)

## 推送到 GitHub

在 GitHub 上新建仓库后，在项目目录执行：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

## 许可

MIT
