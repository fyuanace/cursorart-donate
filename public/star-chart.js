(() => {
	const root = document.querySelector("[data-star-chart]");
	if (!root) return;

	const dataEl = document.getElementById("like-history");
	const svg = root.querySelector("svg");
	const tip = root.querySelector(".chart-tip");
	const pills = [...root.querySelectorAll("[data-range]")];
	if (!dataEl || !svg || !tip || !pills.length) return;

	const parsed = JSON.parse(dataEl.textContent || "{}");
	const events = (parsed.events || []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
	const total = Number(parsed.total) || 0;
	const origin = Math.max(0, total - events.length);
	const TZ = "Asia/Shanghai";
	const DAY = 86400000;
	const WINDOWS = { "7d": 7 * DAY, "30d": 30 * DAY, "180d": 180 * DAY, "365d": 365 * DAY };

	let range = pills.find((btn) => btn.getAttribute("aria-selected") === "true")?.dataset.range || "30d";
	let drawn = [];
	let layout = null;

	const ns = "http://www.w3.org/2000/svg";
	const el = (name, attrs) => {
		const node = document.createElementNS(ns, name);
		for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
		return node;
	};

	const fmt = (t, opts) => new Intl.DateTimeFormat("zh-CN", { timeZone: TZ, ...opts }).format(new Date(t));

	const windowStart = (now) => {
		if (range !== "all" && WINDOWS[range]) return now - WINDOWS[range];
		if (events.length) return Math.min(events[0], now - WINDOWS["30d"]);
		return now - WINDOWS["30d"];
	};

	const valueAt = (t) => {
		let n = 0;
		for (const event of events) {
			if (event <= t) n += 1;
			else break;
		}
		return origin + n;
	};

	const series = (now) => {
		const start = windowStart(now);
		const pts = [{ t: start, v: valueAt(start) }];
		let running = pts[0].v;
		for (const event of events) {
			if (event > start && event <= now) {
				running += 1;
				pts.push({ t: event, v: running });
			}
		}
		if (pts[pts.length - 1].t !== now) pts.push({ t: now, v: total });
		return pts;
	};

	const niceMax = (value) => {
		if (value <= 0) return 1;
		const exp = 10 ** Math.floor(Math.log10(value));
		const n = value / exp;
		const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
		return nice * exp;
	};

	const yDomain = (pts) => {
		const minV = Math.min(...pts.map((p) => p.v));
		const maxV = Math.max(...pts.map((p) => p.v));
		if (range === "all") return { yMin: 0, yMax: Math.max(niceMax(maxV), maxV, 1) };
		if (minV === maxV) {
			const pad = Math.max(1, Math.round(minV * 0.02));
			return { yMin: Math.max(0, minV - pad), yMax: maxV + pad };
		}
		const pad = Math.max(1, (maxV - minV) * 0.12);
		return { yMin: Math.max(0, minV - pad), yMax: maxV + pad };
	};

	const xLabel = (t, span) => {
		if (span > 300 * DAY) return fmt(t, { year: "numeric", month: "numeric" });
		return fmt(t, { month: "numeric", day: "numeric" });
	};

	const tipLabel = (t) =>
		fmt(t, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

	const draw = () => {
		const now = Date.now();
		const pts = series(now);
		const w = Math.max(280, Math.round(svg.getBoundingClientRect().width || 640));
		const h = 220;
		const pad = { l: 44, r: 12, t: 16, b: 28 };
		const iw = Math.max(1, w - pad.l - pad.r);
		const ih = Math.max(1, h - pad.t - pad.b);
		const { yMin, yMax } = yDomain(pts);
		const t0 = pts[0].t;
		const t1 = pts[pts.length - 1].t;
		const dt = Math.max(1, t1 - t0);
		const x = (t) => pad.l + ((t - t0) / dt) * iw;
		const y = (v) => pad.t + ((yMax - v) / Math.max(1e-6, yMax - yMin)) * ih;

		svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
		svg.replaceChildren();

		const yTicks = 3;
		for (let i = 0; i < yTicks; i += 1) {
			const frac = i / (yTicks - 1);
			const v = yMax - frac * (yMax - yMin);
			const yy = pad.t + frac * ih;
			svg.append(el("line", { class: "chart-grid", x1: pad.l, x2: w - pad.r, y1: yy, y2: yy }));
			const yLabel = el("text", {
				class: "chart-axis",
				x: pad.l - 8,
				y: yy + 4,
				"text-anchor": "end",
			});
			yLabel.textContent = Math.round(v).toLocaleString("zh-CN");
			svg.append(yLabel);
		}

		const xTicks = 5;
		for (let i = 0; i < xTicks; i += 1) {
			const t = t0 + (dt * i) / (xTicks - 1);
			const xx = x(t);
			const label = el("text", {
				class: "chart-axis",
				x: xx,
				y: h - 8,
				"text-anchor": i === 0 ? "start" : i === xTicks - 1 ? "end" : "middle",
			});
			label.textContent = xLabel(t, dt);
			svg.append(label);
		}

		const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(2)} ${y(p.v).toFixed(2)}`).join(" ");
		const area = `${line} L${x(pts[pts.length - 1].t).toFixed(2)} ${y(yMin).toFixed(2)} L${x(pts[0].t).toFixed(2)} ${y(yMin).toFixed(2)} Z`;
		svg.append(el("path", { class: "chart-area", d: area }));
		svg.append(el("path", { class: "chart-line", d: line }));

		const cross = el("line", { class: "chart-cross", y1: pad.t, y2: pad.t + ih, opacity: 0 });
		const dot = el("circle", { class: "chart-dot", r: 4, opacity: 0 });
		svg.append(cross, dot);

		drawn = pts.map((p) => ({ ...p, x: x(p.t), y: y(p.v) }));
		layout = { pad, w, h, iw, ih, x, y, yMin };
		svg.dataset.ready = "1";
		hideTip();
	};

	const nearest = (clientX) => {
		if (!drawn.length || !layout) return null;
		const rect = svg.getBoundingClientRect();
		const scale = layout.w / Math.max(1, rect.width);
		const px = (clientX - rect.left) * scale;
		let best = drawn[0];
		let bestDist = Math.abs(px - best.x);
		for (const p of drawn) {
			const dist = Math.abs(px - p.x);
			if (dist < bestDist) {
				best = p;
				bestDist = dist;
			}
		}
		return best;
	};

	const hideTip = () => {
		tip.hidden = true;
		const cross = svg.querySelector(".chart-cross");
		const dot = svg.querySelector(".chart-dot");
		if (cross) cross.setAttribute("opacity", "0");
		if (dot) dot.setAttribute("opacity", "0");
	};

	const showTip = (clientX) => {
		const p = nearest(clientX);
		if (!p || !layout) return;
		const cross = svg.querySelector(".chart-cross");
		const dot = svg.querySelector(".chart-dot");
		cross.setAttribute("opacity", "1");
		dot.setAttribute("opacity", "1");
		cross.setAttribute("x1", p.x);
		cross.setAttribute("x2", p.x);
		dot.setAttribute("cx", p.x);
		dot.setAttribute("cy", p.y);
		tip.hidden = false;
		tip.innerHTML = `${tipLabel(p.t)}<br><strong>${p.v.toLocaleString("zh-CN")}</strong> 人`;
		const frame = root.querySelector(".chart-frame");
		const rect = frame.getBoundingClientRect();
		const svgRect = svg.getBoundingClientRect();
		const left = ((p.x / layout.w) * svgRect.width) + (svgRect.left - rect.left);
		tip.style.left = `${Math.min(rect.width - 24, Math.max(24, left))}px`;
		tip.style.top = `${((p.y / layout.h) * svgRect.height) + (svgRect.top - rect.top)}px`;
	};

	pills.forEach((btn) => {
		btn.addEventListener("click", () => {
			range = btn.dataset.range || "30d";
			pills.forEach((item) => item.setAttribute("aria-selected", item === btn ? "true" : "false"));
			draw();
		});
	});

	svg.addEventListener("pointermove", (event) => showTip(event.clientX));
	svg.addEventListener("pointerleave", hideTip);
	svg.addEventListener("pointerdown", (event) => showTip(event.clientX));

	new ResizeObserver(draw).observe(svg);
	draw();
})();
