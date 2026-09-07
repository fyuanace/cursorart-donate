# cursor极简支持页

Cloudflare Pages + D1，给 cursor极简主题提供「喜欢人数」与赞助入口。线上：https://siyuan.ysoft.site

## 模块地图

| 模块 | 职责 | 文档 |
|------|------|------|
| 页面 | 支持页 HTML：人数、收款码、QQ 群、增长曲线 | [ui/2026-09-07-likes-growth-chart.md](ui/2026-09-07-likes-growth-chart.md) |
| 计数 | D1 总人数 + 每次喜欢的时间戳 | [design/2026-09-07-likes-growth-chart.md](design/2026-09-07-likes-growth-chart.md) |
| 主题入口 | `/?from=theme` 计一次后把地址改回 `/` | 同上 |

## 整体架构

主题顶栏爱心跳到本站。Pages Functions 读/写 D1：`likes` 存累计人数，`like_events` 存每次喜欢的毫秒时间戳。曲线纵轴永远是累计人数，`1 周 / 1 月 / 半年 / 1 年 / 全部` 只切换横轴窗口；短窗口纵轴贴着可见区间放大，全部从 0 起画。
