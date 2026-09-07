export const CLICK_HEADER = "X-Cursorart-Like";
export const QQ_GROUP = "1091105807";
export const LIKES_BASELINE = 300;

export type Env = {
	DB: D1Database;
};

export const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": `${CLICK_HEADER}, Content-Type`,
	"Access-Control-Max-Age": "86400",
};

export const jsonHeaders = {
	...corsHeaders,
	"Content-Type": "application/json; charset=utf-8",
	"Cache-Control": "no-store",
};

export const escapeHtml = (value: string) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

export const readCount = async (db: D1Database) => {
	await db.prepare("UPDATE likes SET clicks = ? WHERE id = 1 AND clicks < ?").bind(LIKES_BASELINE, LIKES_BASELINE).run();
	const row = await db.prepare("SELECT clicks FROM likes WHERE id = 1").first<{ clicks: number }>();
	return Math.max(LIKES_BASELINE, Number(row?.clicks) || 0);
};

export const bumpCount = async (db: D1Database) => {
	const row = await db
		.prepare(
			"UPDATE likes SET clicks = CASE WHEN clicks < ? THEN ? ELSE clicks + 1 END WHERE id = 1 RETURNING clicks"
		)
		.bind(LIKES_BASELINE, LIKES_BASELINE + 1)
		.first<{ clicks: number }>();
	await db.prepare("INSERT INTO like_events (created_at) VALUES (?)").bind(Date.now()).run();
	return Number(row?.clicks) || LIKES_BASELINE + 1;
};

export const readEvents = async (db: D1Database) => {
	const rows = await db.prepare("SELECT created_at FROM like_events ORDER BY created_at ASC").all<{ created_at: number }>();
	return (rows.results || []).map((row) => Number(row.created_at)).filter((t) => Number.isFinite(t));
};

export const renderPage = (count: number, events: number[]) => {
	const n = escapeHtml(count.toLocaleString("zh-CN"));
	const history = JSON.stringify({ total: count, events });
	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>喜欢 cursor极简</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f4f4f5;
      --paper: #ffffff;
      --text: #1a1a1a;
      --muted: #6b6b6b;
      --line: #e5e5e5;
      --heart: #e85d75;
      --shadow: 0 10px 40px rgba(0, 0, 0, .06);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #191919;
        --paper: #202020;
        --text: #f3f3f3;
        --muted: #a0a0a0;
        --line: #333;
        --shadow: 0 10px 40px rgba(0, 0, 0, .28);
      }
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    main {
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }
    .hero {
      text-align: center;
      margin-bottom: 36px;
    }
    .heart {
      width: 42px;
      height: 42px;
      color: var(--heart);
      display: inline-block;
    }
    h1 {
      font-size: 28px;
      font-weight: 650;
      letter-spacing: .02em;
      margin: 12px 0 8px;
    }
    .count {
      font-size: 20px;
      margin: 0;
    }
    .count strong {
      color: var(--heart);
      font-size: 28px;
      font-weight: 700;
      padding: 0 4px;
    }
    .hint {
      color: var(--muted);
      margin: 10px 0 0;
      font-size: 15px;
    }
    section {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 16px;
      box-shadow: var(--shadow);
      padding: 24px;
      margin-bottom: 20px;
    }
    h2 {
      font-size: 18px;
      margin: 0 0 8px;
      font-weight: 650;
    }
    .group-no {
      margin: 0 0 16px;
      color: var(--muted);
      font-size: 15px;
    }
    .group-no code {
      font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
      color: var(--text);
      font-size: 16px;
    }
    .pay-row {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      justify-content: center;
      align-items: flex-start;
      gap: 16px;
    }
    .pay-row figure {
      flex: 1 1 0;
      min-width: 0;
      max-width: 280px;
    }
    .qr-tile {
      width: 100%;
      max-width: 280px;
      aspect-ratio: 1;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
    }
    .qr-tile img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
    }
    figure {
      margin: 0;
      text-align: center;
    }
    figcaption {
      margin-top: 8px;
      font-size: 14px;
      color: var(--muted);
    }
    .join-tip {
      margin: 0 0 16px;
      padding: 12px 14px;
      font-size: 15px;
      line-height: 1.7;
      color: var(--text);
      background: color-mix(in srgb, var(--heart) 8%, var(--paper));
      border: 1px solid color-mix(in srgb, var(--heart) 22%, var(--line));
      border-radius: 10px;
    }
    .chart-head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .chart-head h2 { margin: 0; }
    .range-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .range-pills button {
      appearance: none;
      border: 1px solid var(--line);
      background: transparent;
      color: var(--muted);
      border-radius: 999px;
      padding: 4px 12px;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    .range-pills button[aria-selected="true"] {
      background: var(--text);
      border-color: var(--text);
      color: var(--paper);
    }
    .chart-frame {
      position: relative;
    }
    .chart-frame svg {
      width: 100%;
      height: 220px;
      display: block;
      overflow: visible;
    }
    .chart-grid { stroke: var(--line); stroke-width: 1; }
    .chart-area { fill: color-mix(in srgb, var(--heart) 16%, transparent); }
    .chart-line { fill: none; stroke: var(--heart); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
    .chart-axis { fill: var(--muted); font-size: 11px; }
    .chart-cross { stroke: var(--muted); stroke-width: 1; stroke-dasharray: 3 3; }
    .chart-dot { fill: var(--heart); stroke: var(--paper); stroke-width: 2; }
    .chart-tip {
      position: absolute;
      z-index: 1;
      min-width: 108px;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--paper);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      color: var(--text);
      font-size: 13px;
      line-height: 1.45;
      pointer-events: none;
      transform: translate(-50%, calc(-100% - 10px));
    }
    .chart-tip strong { color: var(--heart); }
  </style>
</head>
<body>
  <main>
    <header class="hero">
      <svg class="heart" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 21s-6.7-4.35-9.33-8.4C.8 9.7 1.6 5.9 4.7 4.4 6.7 3.4 9.1 4 12 6.3 14.9 4 17.3 3.4 19.3 4.4c3.1 1.5 3.9 5.3 2.03 8.2C18.7 16.65 12 21 12 21z"/>
      </svg>
      <h1>cursor极简</h1>
      <p class="count">已有<strong>${n}</strong>人和您一样都喜欢这个主题</p>
      <p class="hint">如果这个主题帮到了您，欢迎支持一下，也欢迎加入 QQ 群一起讨论</p>
    </header>
    <section>
      <h2>请作者喝杯咖啡</h2>
      <p class="group-no">微信或支付宝扫码即可</p>
      <div class="pay-row">
        <figure>
          <div class="qr-tile">
            <img src="/wechat-pay.png" width="478" height="504" alt="微信支付收款码">
          </div>
          <figcaption>微信</figcaption>
        </figure>
        <figure>
          <div class="qr-tile">
            <img src="/alipay-pay.png" width="805" height="918" alt="支付宝收款码">
          </div>
          <figcaption>支付宝</figcaption>
        </figure>
      </div>
    </section>
    <section>
      <h2>QQ 交流群</h2>
      <p class="join-tip">如果需要作者优先响应您的需求，请在加群时备注赞助付款账户名和金额，或加群后私聊群主发送赞助截图</p>
      <p class="group-no">群号 <code>${QQ_GROUP}</code></p>
      <div class="qr-tile">
        <img src="/qq-group.png" width="835" height="1024" alt="QQ 群 ${QQ_GROUP} 二维码">
      </div>
    </section>
    <section class="history" data-star-chart>
      <div class="chart-head">
        <h2>增长曲线</h2>
        <div class="range-pills" role="tablist" aria-label="时间范围">
          <button type="button" role="tab" data-range="7d">1 周</button>
          <button type="button" role="tab" data-range="30d" aria-selected="true">1 月</button>
          <button type="button" role="tab" data-range="180d">半年</button>
          <button type="button" role="tab" data-range="365d">1 年</button>
          <button type="button" role="tab" data-range="all">全部</button>
        </div>
      </div>
      <div class="chart-frame">
        <svg viewBox="0 0 640 220" role="img" aria-label="增长曲线"></svg>
        <div class="chart-tip" hidden></div>
      </div>
      <script type="application/json" id="like-history">${history}</script>
    </section>
  </main>
  <script src="/star-chart.js?v=4" defer></script>
</body>
</html>`;
};

export const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: jsonHeaders });

export const optionsResponse = () => new Response(null, { status: 204, headers: corsHeaders });
