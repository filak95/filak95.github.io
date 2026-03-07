# TodayBingo

移动端优先的 Bingo 打卡 Web 应用。支持多表管理、25 词自定义、马卡龙色玻璃拟态、完成一线震动与彩带、分享图生成、暗色模式与 PWA 安装。

## 功能

- **多表管理**：创建多个 Bingo 表（如「今日工作」「生活打卡」），数据保存在 localStorage
- **25 词自定义**：每行一个词，建议不超过 12 个中文字符；生成/打乱时随机填入 5×5 格子
- **View-Adaptive 字号**：2 字约 20px，10 字约 12px，随字数自动缩放
- **马卡龙 + 玻璃拟态**：格子渐变 + 毛玻璃感 + 白色半透明文字
- **主题色**：可选全局色系，或随机马卡龙色
- **完成奖励**：横/竖/斜任一线完成时震动 + 马卡龙色彩带
- **分享图**：一键生成仅含 Bingo 网格与日期的图片，便于发朋友圈/小红书
- **暗色模式**：跟随系统，马卡龙色自动变深、背景变黑
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

## 推送到 GitHub

在 GitHub 上新建仓库后，在项目目录执行：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

## 许可

MIT
