(function () {
  const D = window.DATA, M = window.MODELS;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const css = getComputedStyle(document.documentElement);
  const C = Object.fromEntries(["espresso", "brown", "caramel", "tan", "sand", "beige", "olive", "rust", "muted", "line", "paper", "ink"]
    .map(k => [k, css.getPropertyValue("--" + k).trim()]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------- formatting
  const gbp = v => "£" + Math.round(v).toLocaleString("en-GB");
  const gbpK = v => "£" + (v / 1000).toFixed(1) + "k";
  const pct = (v, d = 1) => (v * 100).toFixed(d) + " %";
  const num = (v, d = 0) => Number(v).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
  const short = s => s.replace(" (seasonal naive + daily XGBoost)", "").replace("daily→weekly", "daily");
  const fmtDate = s => new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const fmtDur = sec => {
    if (sec < 60) return Math.round(sec) + " s";
    if (sec < 3600) return Math.round(sec / 60) + " min";
    if (sec < 86400) return (sec / 3600).toFixed(1) + " h";
    return (sec / 86400).toFixed(sec < 864000 ? 1 : 0) + " days";
  };
  const SEG_COLORS = { "Champions": C.espresso, "At-risk regulars": C.caramel, "Recent low-spend": C.olive, "Lapsed one-time buyers": "#cdb48c" };
  const METHOD_COLORS = { "Isolation Forest": C.espresso, "LOF": C.tan, "Rule-based": C.olive, "XGBoost (supervised)": C.rust };
  const MODEL_COLORS = [C.caramel, C.olive, "#8f7f5c", C.tan, C.brown, "#b58b63", "#5d4a3a", "#9c8a6e", C.sand];

  // ---------------------------------------------------------------- Chart.js defaults
  Chart.defaults.font.family = "Manrope, system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = C.muted;
  Chart.defaults.borderColor = "rgba(196,165,122,.25)";
  Chart.defaults.animation.duration = reduced ? 0 : 1400;
  Chart.defaults.animation.easing = "easeOutQuart";
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxWidth = 8;
  Chart.defaults.plugins.legend.labels.padding = 14;
  Object.assign(Chart.defaults.plugins.tooltip, {
    backgroundColor: C.espresso, titleColor: C.paper, bodyColor: C.beige, padding: 12, cornerRadius: 10,
    titleFont: { family: "Fraunces", size: 13, weight: "600" }, boxPadding: 4,
  });
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.elements.bar.borderRadius = 6;
  Chart.defaults.elements.line.tension = .3;
  const charts = {};

  // ---------------------------------------------------------------- scroll behaviour
  const nav = $("#nav"), bar = $("#progress");
  const links = $$(".nav-links a");
  const sections = links.map(a => $(a.getAttribute("href")));
  addEventListener("scroll", () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
    nav.classList.toggle("scrolled", h.scrollTop > 10);
    let current = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < 140) current = i; });
    links.forEach((a, i) => a.classList.toggle("active", i === current));
  }, { passive: true });

  const counters = new WeakSet();
  function countUp(el) {
    if (counters.has(el)) return;
    counters.add(el);
    const target = +el.dataset.count, dec = +(el.dataset.dec || 0), prefix = el.dataset.prefix || "", suffix = el.dataset.suffix || "";
    const t0 = performance.now(), dur = reduced ? 0 : 1600;
    const step = now => {
      const p = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + num(target * e, dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add("in");
      $$("[data-count]", el).forEach(countUp);
      if (el.dataset.count) countUp(el);
      $$(".bar, .meter > span", el).forEach(b => { if (b.dataset.w) b.style.width = b.dataset.w; });
      if (el.dataset.chart && !charts[el.dataset.chart]) charts[el.dataset.chart] = builders[el.dataset.chart](el);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  const observe = () => $$(".reveal, .stagger, [data-reveal], canvas[data-chart], .meter-group").forEach(el => io.observe(el));

  // ---------------------------------------------------------------- hero sparkline
  (function hero() {
    const w = D.forecast.weekly, v = w.revenue, max = Math.max(...v), min = Math.min(...v);
    const pts = v.map((y, i) => [i / (v.length - 1) * 1000, 170 - (y - min) / (max - min) * 150]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const testStart = w.dates.indexOf(D.forecast.test.dates[0]) / (v.length - 1) * 1000;
    $("#hero-svg").innerHTML = `
      <defs><linearGradient id="ha" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.tan}" stop-opacity=".45"/><stop offset="1" stop-color="${C.tan}" stop-opacity="0"/></linearGradient></defs>
      <rect x="${testStart}" y="0" width="${1000 - testStart}" height="180" fill="${C.beige}" class="area"/>
      <text x="${testStart + 10}" y="18" fill="${C.caramel}" font-size="12" font-family="JetBrains Mono" class="area">test window</text>
      <path d="${d} L1000 180 L0 180 Z" fill="url(#ha)" class="area"/>
      <path d="${d}" fill="none" stroke="${C.espresso}" stroke-width="2.2" pathLength="100" class="draw" style="--len:100"/>`;
    $("#hero-range").textContent = fmtDate(w.dates[0]) + "  to  " + fmtDate(w.dates.at(-1));
  })();
  // models compared: 9 forecasting, 4 anomaly, 4 future-value
  $$(".stat .num")[3].dataset.count = D.forecast.metrics.length + D.anomaly.comparison.length + D.segmentation.future.length;
  $$(".stat .num")[2].dataset.count = Object.keys(D.segmentation.customers).length;

  // ---------------------------------------------------------------- helpers
  const kpi = (n, label, note, opts = {}) => `<div class="card kpi${opts.dark ? " dark" : ""}">
      <div class="num" data-count="${n}" data-dec="${opts.dec || 0}" data-prefix="${opts.prefix || ""}" data-suffix="${opts.suffix || ""}">0</div>
      <div class="lbl">${label}</div>${note ? `<div class="note">${note}</div>` : ""}</div>`;

  function sortableTable(el, cols, rows, isBest) {
    let sortKey = null, asc = true;
    const maxes = {};
    cols.forEach(c => { if (c.bar) maxes[c.key] = Math.max(...rows.map(r => Math.abs(r[c.key]))); });
    function render(animate) {
      const data = [...rows];
      if (sortKey) data.sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1) * (asc ? 1 : -1));
      el.innerHTML = `<thead><tr>${cols.map(c => `<th class="${c.num ? "n " : ""}${c.sort !== false ? "sortable" : ""}" data-k="${c.key}">${c.label}${sortKey === c.key ? (asc ? " ↑" : " ↓") : ""}</th>`).join("")}</tr></thead>
        <tbody>${data.map(r => `<tr class="${isBest && isBest(r) ? "best" : ""}">${cols.map(c => {
          const v = c.fmt ? c.fmt(r[c.key], r) : r[c.key];
          if (c.bar) return `<td class="n"><div class="bar-cell">${v}<span class="bar" data-w="${Math.abs(r[c.key]) / maxes[c.key] * 80}px" style="${animate ? "" : `width:${Math.abs(r[c.key]) / maxes[c.key] * 80}px`}"></span></div></td>`;
          return `<td class="${c.num ? "n" : ""}">${v}</td>`;
        }).join("")}</tr>`).join("")}</tbody>`;
      $$("th.sortable", el).forEach(th => th.onclick = () => {
        asc = sortKey === th.dataset.k ? !asc : true; sortKey = th.dataset.k; render(false);
      });
    }
    render(true);
    el.closest(".card").classList.add("meter-group");
  }

  // wraps each column's formatter so the best value gets a ★ (best: "max" | "min" | "abs" = closest to zero)
  function markBest(cols, rows, eligible = () => true) {
    return cols.map(c => {
      if (!c.best) return c;
      const score = v => c.best === "abs" ? -Math.abs(v) : c.best === "min" ? -v : v;
      const top = Math.max(...rows.filter(eligible).map(r => r[c.key]).filter(v => v != null).map(score));
      const base = c.fmt || (v => v);
      return { ...c, fmt: (v, r) => eligible(r) && v != null && score(v) === top
        ? `<span class="is-best">${base(v, r)}<span class="star" title="Best in column">★</span></span>` : base(v, r) };
    });
  }
  const rankFmt = v => v == null ? "–" : "#" + v;

  function setRangeFill(input) {
    const p = (input.value - input.min) / (input.max - input.min) * 100;
    input.style.setProperty("--p", p + "%");
  }

  // ---------------------------------------------------------------- DATA section
  const [retailOv, fraudOv] = D.overview;
  $("#dataset-cards").innerHTML = [
    { o: retailOv, desc: "UK online gift retailer. Real sales with strong yearly and weekly seasonality and genuine repeat customers.", src: "UCI ML Repository #502, CC BY 4.0" },
    { o: fraudOv, desc: "First purchases on an e-commerce site with a confirmed fraud label, used only to evaluate the detectors.", src: "Public teaching dataset, licence undocumented" },
  ].map(({ o, desc, src }, i) => `<div class="card ${i ? "" : "dark"}">
      <span class="tag">Modules ${o.modules}</span>
      <h3 style="font-size:1.6rem">${o.dataset}</h3>
      <p class="sub" style="margin-top:6px">${desc}</p>
      <div class="grid g3" style="gap:12px">
        <div><div class="num" style="font:600 1.5rem var(--serif)" data-count="${o.raw_rows}">0</div><div class="lbl" style="font-size:.78rem">raw rows</div></div>
        <div><div class="num" style="font:600 1.5rem var(--serif)" data-count="${o.clean_rows}">0</div><div class="lbl" style="font-size:.78rem">after cleaning</div></div>
        <div><div class="num" style="font:600 1.5rem var(--serif)" data-count="${o.customers}">0</div><div class="lbl" style="font-size:.78rem">customers / users</div></div>
      </div>
      <p class="sub" style="margin:16px 0 0;font-size:.8rem"><span class="mono">${o.period}</span> &middot; label: ${o.label} &middot; ${src}</p>
    </div>`).join("");

  const raw = D.cleaning[0].rows;
  const funnel = $("#funnel");
  funnel.innerHTML = D.cleaning.map(r => `<div class="funnel-row"><span>${r.step}${r.rows_removed ? ` <span style="color:var(--rust);font-size:.76rem">−${num(r.rows_removed)}</span>` : ""}</span>
      <div class="meter"><span data-w="${(r.rows / raw * 100).toFixed(2)}%"></span></div><span class="mono" style="text-align:right">${num(r.rows)}</span></div>`).join("");
  funnel.classList.add("meter-group");

  // ---------------------------------------------------------------- builders (charts created when scrolled into view)
  const F = D.forecast, A = D.anomaly, S = D.segmentation;
  const selName = F.selected;
  const sel = F.metrics.find(m => m.model === selName);
  const snMetric = F.metrics.find(m => m.model.startsWith("Seasonal naive"));
  const meanMetric = F.metrics.find(m => m.model === "Training mean");
  const testIdx = F.weekly.dates.indexOf(F.test.dates[0]);
  const fcShown = new Set([selName, "Seasonal naive (last year)"]);

  const builders = {
    weekday(cv) {
      const days = Object.keys(F.weekday);
      return new Chart(cv, {
        type: "bar",
        data: { labels: days.map(d => d.slice(0, 3)), datasets: [{ data: Object.values(F.weekday), backgroundColor: days.map((d, i) => i === 3 ? C.espresso : C.tan) }] },
        options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => gbp(c.raw) } } },
          scales: { y: { ticks: { callback: v => "£" + v / 1e6 + "m" } }, x: { grid: { display: false } } } },
      });
    },

    fcMain(cv) {
      const labels = F.weekly.dates;
      const ds = [{
        label: "Actual weekly revenue", data: F.weekly.revenue, borderColor: C.espresso, backgroundColor: "rgba(196,165,122,.18)",
        fill: true, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2, order: 10, tension: .12,
      }];
      Object.keys(F.test.models).forEach((name, i) => {
        ds.push({
          label: short(name), _full: name, hidden: !fcShown.has(name),
          data: labels.map((d, j) => j >= testIdx ? F.test.models[name][j - testIdx] : null),
          borderColor: name === selName ? C.rust : MODEL_COLORS[(i + 1) % MODEL_COLORS.length], borderWidth: name === selName ? 3 : 2,
          borderDash: name === selName ? [] : [5, 4], pointRadius: name === selName ? 3 : 0, pointBackgroundColor: C.rust, spanGaps: false, fill: false,
        });
      });
      return new Chart(cv, {
        type: "line", data: { labels, datasets: ds },
        options: {
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { labels: { filter: it => !ds[it.datasetIndex].hidden } },
            tooltip: { filter: it => it.raw != null, callbacks: { title: it => "Week ending " + fmtDate(it[0].label), label: c => " " + c.dataset.label + ": " + gbp(c.raw) } },
          },
          scales: {
            x: { ticks: { maxTicksLimit: 10, callback: function (v) { return new Date(this.getLabelForValue(v)).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }); } }, grid: { display: false } },
            y: { ticks: { callback: v => "£" + v / 1000 + "k" } },
          },
        },
        plugins: [{
          id: "testBand", beforeDraw(ch) {
            const { ctx, chartArea: a, scales: { x } } = ch;
            const x0 = x.getPixelForValue(testIdx);
            ctx.save(); ctx.fillStyle = "rgba(236,224,200,.55)"; ctx.fillRect(x0, a.top, a.right - x0, a.bottom - a.top);
            ctx.fillStyle = C.caramel; ctx.font = "600 11px JetBrains Mono"; ctx.fillText("TEST: LAST 21 WEEKS", x0 + 8, a.top + 14); ctx.restore();
          },
        }],
      });
    },

    fcMae(cv) {
      const rows = [...F.metrics].sort((a, b) => a.test_MAE - b.test_MAE);
      return new Chart(cv, {
        type: "bar",
        data: { labels: rows.map(r => short(r.model)), datasets: [{ data: rows.map(r => r.test_MAE), backgroundColor: rows.map(r => r.model === selName ? C.rust : r.model.startsWith("Seasonal") || r.model.startsWith("Naive") || r.model.startsWith("Training") ? C.sand : C.tan) }] },
        options: { indexAxis: "y", plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => " MAE " + gbp(c.raw) } } },
          scales: { x: { ticks: { callback: v => "£" + v / 1000 + "k" } }, y: { grid: { display: false } } } },
      });
    },

    fcBacktest(cv) {
      const keep = [selName, "Seasonal naive (last year)", "XGBoost (daily→weekly)", "Linear Regression (weekly)", "Random Forest (daily→weekly)"];
      const windows = Object.keys(F.backtest[0]).filter(k => k.includes(" to "));
      return new Chart(cv, {
        type: "bar",
        data: { labels: windows.map(w => w.replace(/(\d{4})-(\d{2})-\d{2}/g, (m, y, mo) => new Date(y, mo - 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }))),
          datasets: keep.map((name, i) => ({ label: short(name), data: windows.map(w => F.backtest.find(b => b.model === name)[w]), backgroundColor: [C.rust, C.sand, C.caramel, C.olive, C.tan][i] })) },
        options: { plugins: { tooltip: { callbacks: { label: c => " " + c.dataset.label + ": " + gbp(c.raw) } } },
          scales: { y: { ticks: { callback: v => "£" + v / 1000 + "k" } }, x: { grid: { display: false } } } },
      });
    },

    fcImportance(cv) {
      const labels = { prev_week: "Previous week total", prev2_week: "Week before that", rolling_mean_4_weeks: "4-week rolling mean", same_weekday_last_week: "Same weekday last week", day_of_week: "Day of week", month: "Month", day_of_year: "Day of year", holiday_period: "Holiday period" };
      return new Chart(cv, {
        type: "bar",
        data: { labels: F.importance.features.map(f => labels[f] || f), datasets: [{ data: F.importance.values, backgroundColor: F.importance.values.map((v, i) => i === 0 ? C.espresso : i < 3 ? C.caramel : C.tan) }] },
        options: { indexAxis: "y", plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => " importance " + pct(c.raw) } } },
          scales: { x: { ticks: { callback: v => Math.round(v * 100) + "%" } }, y: { grid: { display: false } } } },
      });
    },

    fcResidual(cv) {
      const p = F.test.models[selName];
      const res = F.test.actual.map((a, i) => a - p[i]);
      return new Chart(cv, {
        type: "bar",
        data: { labels: F.test.dates.map(d => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" })), datasets: [{ data: res, backgroundColor: res.map(r => r >= 0 ? C.caramel : C.olive) }] },
        options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => " error " + (c.raw >= 0 ? "+" : "−") + gbp(Math.abs(c.raw)) } } },
          scales: { y: { ticks: { callback: v => "£" + v / 1000 + "k" } }, x: { grid: { display: false }, ticks: { maxRotation: 60, autoSkip: true, maxTicksLimit: 11 } } } },
      });
    },

    anRoc(cv) {
      const ds = Object.entries(A.roc).map(([name, r]) => ({
        label: name, data: r.x.map((x, i) => ({ x, y: r.y[i] })), borderColor: METHOD_COLORS[name], backgroundColor: METHOD_COLORS[name],
        pointRadius: 0, borderWidth: name === "Isolation Forest" ? 3 : 2, tension: 0, showLine: true,
      }));
      ds.push({ label: "Random", data: [{ x: 0, y: 0 }, { x: 1, y: 1 }], borderColor: C.sand, borderDash: [5, 5], pointRadius: 0, showLine: true, borderWidth: 1.5 });
      return new Chart(cv, { type: "scatter", data: { datasets: ds },
        options: { plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: FPR ${pct(c.raw.x)}, TPR ${pct(c.raw.y)}` } } },
          scales: { x: { min: 0, max: 1, title: { display: true, text: "False positive rate" } }, y: { min: 0, max: 1, title: { display: true, text: "True positive rate (recall)" } } } } });
    },

    anPr(cv) {
      const ds = Object.entries(A.pr).map(([name, r]) => ({
        label: name, data: r.x.map((x, i) => ({ x, y: r.y[i] })), borderColor: METHOD_COLORS[name], backgroundColor: METHOD_COLORS[name],
        pointRadius: 0, borderWidth: name === "Isolation Forest" ? 3 : 2, tension: 0, showLine: true,
      }));
      ds.push({ label: "Random", data: [{ x: 0, y: A.test_fraud_rate }, { x: 1, y: A.test_fraud_rate }], borderColor: C.sand, borderDash: [5, 5], pointRadius: 0, showLine: true, borderWidth: 1.5 });
      return new Chart(cv, { type: "scatter", data: { datasets: ds },
        options: { plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: recall ${pct(c.raw.x)}, precision ${pct(c.raw.y)}` } } },
          scales: { x: { min: 0, max: 1, title: { display: true, text: "Recall" } }, y: { min: 0, max: .5, title: { display: true, text: "Precision" } } } } });
    },

    anCompare(cv) {
      return new Chart(cv, {
        type: "bar",
        data: { labels: A.full.map(r => r.method), datasets: [{ data: A.full.map(r => r[anMetric]), backgroundColor: A.full.map(r => METHOD_COLORS[r.method] || C.sand) }] },
        options: { indexAxis: "y", plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => " " + anMetricFmt(c.raw) } } },
          scales: { x: { beginAtZero: true, ticks: { callback: v => anMetricFmt(v) } }, y: { grid: { display: false } } } },
      });
    },

    anHist(cv) {
      const thrIdx = A.hist.bins.findIndex(b => b >= A.hist.threshold);
      return new Chart(cv, {
        type: "bar",
        data: { labels: A.hist.bins.map(b => b.toFixed(3)), datasets: [
          { label: "Legitimate", data: A.hist.legit, backgroundColor: "rgba(196,165,122,.75)", barPercentage: 1, categoryPercentage: 1, borderRadius: 2 },
          { label: "Fraud", data: A.hist.fraud, backgroundColor: "rgba(162,69,46,.55)", barPercentage: 1, categoryPercentage: 1, borderRadius: 2 },
        ] },
        options: { scales: { x: { stacked: false, grid: { display: false }, ticks: { maxTicksLimit: 8 }, title: { display: true, text: "Anomaly score (higher = more unusual)" } }, y: { title: { display: true, text: "Density" } } },
          plugins: { tooltip: { callbacks: { title: it => "Score ≈ " + it[0].label } } } },
        plugins: [{ id: "thr", afterDraw(ch) {
          const { ctx, chartArea: a, scales: { x } } = ch; const px = x.getPixelForValue(thrIdx) - (x.getPixelForValue(1) - x.getPixelForValue(0)) / 2;
          ctx.save(); ctx.strokeStyle = C.espresso; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
          ctx.fillStyle = C.espresso; ctx.font = "600 11px JetBrains Mono"; ctx.fillText("5 % REVIEW", px + 6, a.top + 14); ctx.restore();
        } }],
      });
    },

    anFlag(cv) {
      const fr = A.flag_rates;
      return new Chart(cv, {
        type: "line",
        data: { labels: fr.map(r => pct(r.flag_rate, 0)), datasets: [
          { label: "Precision", data: fr.map(r => r.precision), borderColor: C.espresso, backgroundColor: C.espresso, yAxisID: "y", pointRadius: 5, borderWidth: 2.5 },
          { label: "Recall", data: fr.map(r => r.recall), borderColor: C.caramel, backgroundColor: C.caramel, yAxisID: "y", pointRadius: 5, borderWidth: 2.5 },
          { label: "Lift vs random", data: fr.map(r => r.lift), borderColor: C.olive, backgroundColor: C.olive, yAxisID: "y1", borderDash: [6, 4], pointRadius: 5, borderWidth: 2 },
        ] },
        options: { interaction: { mode: "index", intersect: false },
          plugins: { tooltip: { callbacks: { title: it => "Review " + it[0].label + " of purchases", label: c => " " + c.dataset.label + ": " + (c.dataset.yAxisID === "y1" ? c.raw.toFixed(2) + "×" : pct(c.raw)) } } },
          scales: { x: { title: { display: true, text: "Share of purchases sent to review" }, grid: { display: false } },
            y: { min: 0, max: .4, ticks: { callback: v => Math.round(v * 100) + "%" } },
            y1: { position: "right", min: 0, max: 6, grid: { display: false }, ticks: { callback: v => v + "×" } } } },
      });
    },

    sgScatter(cv) {
      const groups = Object.keys(SEG_COLORS);
      return new Chart(cv, {
        type: "scatter",
        data: { datasets: groups.map(g => ({ label: g, data: S.scatter.filter(p => p.s === g).map(p => ({ x: p.r + 1, y: p.m, f: p.f })), backgroundColor: SEG_COLORS[g] + "b3", pointRadius: 3.2, pointHoverRadius: 6 })) },
        options: { plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.raw.x - 1} days since last order, ${c.raw.f} orders, ${gbp(c.raw.y)}` } } },
          scales: { x: { type: "logarithmic", title: { display: true, text: "Recency: days since last purchase (log)" }, ticks: { callback: v => [1, 3, 10, 30, 100, 300, 700].includes(v) ? v : "" } },
            y: { type: "logarithmic", title: { display: true, text: "Total net spend (log)" }, ticks: { callback: v => [10, 100, 1000, 10000, 100000].includes(v) ? "£" + num(v) : "" } } } },
      });
    },

    sgShare(cv) {
      const v = S.value;
      return new Chart(cv, {
        type: "doughnut",
        data: { labels: v.map(r => r.segment), datasets: [
          { label: "Revenue", data: v.map(r => r.share_of_revenue), backgroundColor: v.map(r => SEG_COLORS[r.segment]), borderColor: C.paper, borderWidth: 3 },
          { label: "Customers", data: v.map(r => r.share_of_customers), backgroundColor: v.map(r => SEG_COLORS[r.segment] + "99"), borderColor: C.paper, borderWidth: 3 },
        ] },
        options: { cutout: "38%", plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${pct(c.raw)}` } } },
          animation: { animateRotate: true, animateScale: true } },
      });
    },

    sgK(cv) {
      const k = S.k_eval;
      return new Chart(cv, {
        data: { labels: k.map(r => "K=" + r.K), datasets: [
          { type: "bar", label: "Inertia", data: k.map(r => r.inertia), backgroundColor: k.map(r => r.selected ? C.espresso : C.sand), yAxisID: "y" },
          { type: "line", label: "Silhouette", data: k.map(r => r.silhouette), borderColor: C.rust, backgroundColor: C.rust, yAxisID: "y1", pointRadius: k.map(r => r.selected ? 7 : 4), borderWidth: 2.5 },
        ] },
        options: { interaction: { mode: "index", intersect: false },
          scales: { x: { grid: { display: false } }, y: { title: { display: true, text: "Inertia" } }, y1: { position: "right", min: .25, max: .5, grid: { display: false }, title: { display: true, text: "Silhouette" } } } },
      });
    },

    sgFuture(cv) {
      const f = S.future;
      return new Chart(cv, {
        type: "bar",
        data: { labels: f.map(r => r.model.replace(" (past monthly rate × 6)", "")), datasets: [
          { label: "Spearman rank correlation", data: f.map(r => r.Spearman), backgroundColor: C.espresso },
          { label: "Top-20 % revenue capture", data: f.map(r => r.top20_capture), backgroundColor: C.tan },
        ] },
        options: { plugins: { tooltip: { callbacks: { label: c => " " + c.dataset.label + ": " + c.raw.toFixed(3) } } }, scales: { y: { min: .5, max: .85 }, x: { grid: { display: false } } } },
      });
    },
  };

  // ---------------------------------------------------------------- MODULE A
  const snImprove = (1 - sel.test_MAE / snMetric.test_MAE) * 100, meanImprove = (1 - sel.test_MAE / meanMetric.test_MAE) * 100;
  const selFull = F.full.find(m => m.model === selName);
  $("#fc-kpis").innerHTML =
    kpi(selFull["test_accuracy_%"], "Forecast accuracy (100 − MAPE)", "selected: " + short(selName), { dec: 1, suffix: " %", dark: true }) +
    kpi(sel.test_MAE / 1000, "Weekly MAE, held-out 21 weeks", "RMSE " + gbpK(sel.test_RMSE), { dec: 1, prefix: "£", suffix: "k" }) +
    kpi(selFull["test_within_20%"] * 100, "Test weeks within ±20 %", "R² " + sel.test_R2.toFixed(2) + " on the test weeks", { dec: 0, suffix: " %" }) +
    kpi(snImprove, "Better than seasonal naive", meanImprove.toFixed(0) + " % better than the training mean", { dec: 1, suffix: " %" });

  const pct1 = v => v.toFixed(1) + " %";
  sortableTable($("#fc-score"), markBest([
    { key: "model", label: "Model", fmt: v => v },
    { key: "overall_rank", label: "Rank", num: true, fmt: rankFmt },
    { key: "test_accuracy_%", label: "Accuracy", num: true, bar: true, best: "max", fmt: pct1 },
    { key: "test_within_10%", label: "Within ±10 %", num: true, best: "max", fmt: v => pct(v, 0) },
    { key: "test_within_20%", label: "Within ±20 %", num: true, best: "max", fmt: v => pct(v, 0) },
    { key: "test_MAE", label: "MAE", num: true, best: "min", fmt: gbp },
    { key: "test_RMSE", label: "RMSE", num: true, best: "min", fmt: gbp },
    { key: "test_MedAE", label: "Median error", num: true, best: "min", fmt: gbp },
    { key: "test_max_error", label: "Max error", num: true, best: "min", fmt: gbp },
    { key: "test_R2", label: "R²", num: true, best: "max", fmt: v => v.toFixed(3) },
    { key: "test_MAPE_%", label: "MAPE", num: true, best: "min", fmt: pct1 },
    { key: "test_bias", label: "Bias", num: true, best: "abs", fmt: v => (v >= 0 ? "+" : "−") + gbp(Math.abs(v)) },
    { key: "train_MAE", label: "Train MAE", num: true, fmt: gbp },
    { key: "backtest_MAE", label: "Backtest MAE", num: true, best: "min", fmt: gbp },
    { key: "backtest_RMSE", label: "Backtest RMSE", num: true, best: "min", fmt: gbp },
  ], F.full), F.full, r => r.model === selName);

  $("#fc-chips").innerHTML = Object.keys(F.test.models).map(n => `<button class="chip${fcShown.has(n) ? " on" : ""}" data-m="${n}">${short(n)}</button>`).join("");
  $("#fc-chips").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    const name = b.dataset.m; fcShown.has(name) ? fcShown.delete(name) : fcShown.add(name); b.classList.toggle("on");
    const ch = charts.fcMain; if (!ch) return;
    ch.data.datasets.forEach(d => { if (d._full) d.hidden = !fcShown.has(d._full); }); ch.update();
  });

  // forecast playground
  $("#fc-rule").textContent = F.rule;
  const sn = F.test.models["Seasonal naive (last year)"], xg = F.test.models["XGBoost (daily→weekly)"], act = F.test.actual;
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  function blendMetrics(w) {
    const p = sn.map((s, i) => w * s + (1 - w) * xg[i]);
    const err = act.map((a, i) => a - p[i]), m = mean(act);
    return { p, mae: mean(err.map(Math.abs)), rmse: Math.sqrt(mean(err.map(e => e * e))), mape: mean(err.map((e, i) => Math.abs(e) / act[i])) * 100,
      r2: 1 - err.reduce((s, e) => s + e * e, 0) / act.reduce((s, a) => s + (a - m) ** 2, 0) };
  }
  const playChart = new Chart($("#fc-play-chart"), {
    type: "line",
    data: { labels: F.test.dates.map(d => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" })), datasets: [
      { label: "Actual", data: act, borderColor: C.espresso, pointRadius: 2, borderWidth: 2 },
      { label: "Blended forecast", data: blendMetrics(.5).p, borderColor: C.rust, borderDash: [5, 3], pointRadius: 2, borderWidth: 2 },
    ] },
    options: { animation: { duration: reduced ? 0 : 500 }, interaction: { mode: "index", intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => " " + c.dataset.label + ": " + gbp(c.raw) } } },
      scales: { y: { ticks: { callback: v => "£" + v / 1000 + "k" } }, x: { ticks: { maxTicksLimit: 6 }, grid: { display: false } } } },
  });
  const wIn = $("#fc-weight"), weekIn = $("#fc-week");
  let best = { w: 0, mae: Infinity };
  for (let w = 0; w <= 100; w += 5) { const m = blendMetrics(w / 100); if (m.mae < best.mae) best = { w, mae: m.mae }; }
  function updateForecastPlay() {
    const w = wIn.value / 100, m = blendMetrics(w);
    setRangeFill(wIn); setRangeFill(weekIn);
    $("#fc-weight-out").textContent = wIn.value + " %";
    $("#fc-play-mae").textContent = gbp(m.mae);
    const diff = (m.mae - sel.test_MAE) / sel.test_MAE * 100;
    $("#fc-play-delta").textContent = Math.abs(diff) < .05 ? "Matches the saved combination model (50 / 50)." :
      `${Math.abs(diff).toFixed(1)} % ${diff > 0 ? "worse" : "better"} than the saved 50 / 50 blend. Best weight on this test set: ${best.w} %.`;
    $("#fc-play-stats").innerHTML = `<div><b>${m.mape.toFixed(1)} %</b><span>MAPE</span></div><div><b>${m.r2.toFixed(3)}</b><span>R²</span></div><div><b>${gbpK(m.rmse)}</b><span>RMSE</span></div>`;
    playChart.data.datasets[1].data = m.p; playChart.update();
    const i = +weekIn.value, e = act[i] - m.p[i];
    $("#fc-week-out").textContent = fmtDate(F.test.dates[i]);
    $("#fc-week-stats").innerHTML = `<div><b>${gbpK(act[i])}</b><span>actual</span></div><div><b>${gbpK(m.p[i])}</b><span>forecast</span></div><div><b style="color:${Math.abs(e / act[i]) > .15 ? C.rust : C.olive}">${(e / act[i] * 100).toFixed(1)} %</b><span>error</span></div>`;
  }
  wIn.addEventListener("input", updateForecastPlay); weekIn.addEventListener("input", updateForecastPlay);
  updateForecastPlay();

  // ---------------------------------------------------------------- MODULE B
  const iso = A.comparison.find(r => r.method === "Isolation Forest");
  $("#an-kpis").innerHTML =
    kpi(iso.lift, "Lift over random review", "flags are " + iso.lift.toFixed(1) + "× more likely to be fraud", { dec: 1, suffix: "×", dark: true }) +
    kpi(iso.precision * 100, "Precision at 5 % review", "vs " + pct(A.test_fraud_rate) + " at random", { dec: 1, suffix: " %" }) +
    kpi(iso.recall * 100, "Recall at 5 % review", "share of all fraud caught", { dec: 1, suffix: " %" }) +
    kpi(iso.ROC_AUC, "ROC-AUC, unseen cohort", "PR-AUC " + iso.PR_AUC.toFixed(3), { dec: 3 });
  $("#an-base").textContent = pct(A.test_fraud_rate);

  const isBaseline = r => r.method === "No flags (baseline)";
  const anBase = A.full.find(isBaseline);
  sortableTable($("#an-score"), markBest([
    { key: "method", label: "Method" },
    { key: "overall_rank", label: "Rank", num: true, fmt: rankFmt },
    { key: "accuracy", label: "Accuracy", num: true, fmt: v => pct(v) },
    { key: "balanced_accuracy", label: "Balanced acc.", num: true, bar: true, best: "max", fmt: v => pct(v) },
    { key: "precision", label: "Precision", num: true, best: "max", fmt: v => pct(v) },
    { key: "recall", label: "Recall", num: true, best: "max", fmt: v => pct(v) },
    { key: "specificity", label: "Specificity", num: true, best: "max", fmt: v => pct(v) },
    { key: "F1", label: "F1", num: true, best: "max", fmt: v => v.toFixed(3) },
    { key: "MCC", label: "MCC", num: true, best: "max", fmt: v => v.toFixed(3) },
    { key: "ROC_AUC", label: "ROC-AUC", num: true, best: "max", fmt: v => v.toFixed(3) },
    { key: "PR_AUC", label: "PR-AUC", num: true, best: "max", fmt: v => v.toFixed(3) },
    { key: "lift", label: "Lift", num: true, best: "max", fmt: v => v.toFixed(2) + "×" },
    { key: "TP", label: "Caught (TP)", num: true, fmt: v => num(v) },
    { key: "FP", label: "False alarm (FP)", num: true, fmt: v => num(v) },
    { key: "FN", label: "Missed (FN)", num: true, fmt: v => num(v) },
    { key: "TN", label: "Passed (TN)", num: true, fmt: v => num(v) },
  ], A.full, r => !isBaseline(r)), A.full, r => r.method === "Isolation Forest");
  $("#an-score-note").textContent = `Accuracy is misleading here. Only ${pct(A.test_fraud_rate)} of test purchases are fraud, so flagging nothing scores ` +
    `${pct(anBase.accuracy)} accuracy while catching no fraud at all. That is why accuracy is not starred. Compare methods on balanced accuracy, F1, MCC and PR-AUC instead.`;

  const anMetrics = { lift: "Lift", ROC_AUC: "ROC-AUC", PR_AUC: "PR-AUC", F1: "F1", MCC: "MCC", balanced_accuracy: "Balanced accuracy", accuracy: "Accuracy", precision: "Precision", recall: "Recall" };
  let anMetric = "lift";
  const anMetricFmt = v => anMetric === "lift" ? (+v).toFixed(2) + "×" : ["precision", "recall", "accuracy", "balanced_accuracy"].includes(anMetric) ? Math.round(v * 1000) / 10 + "%" : (+v).toFixed(3);
  $("#an-chips").innerHTML = Object.entries(anMetrics).map(([k, l]) => `<button class="chip${k === anMetric ? " on" : ""}" data-k="${k}">${l}</button>`).join("");
  $("#an-chips").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    anMetric = b.dataset.k; $$("#an-chips .chip").forEach(c => c.classList.toggle("on", c === b));
    const ch = charts.anCompare; if (ch) { ch.data.datasets[0].data = A.full.map(r => r[anMetric]); ch.update(); }
  });

  const cf = A.confusion, cfTot = cf.tp + cf.fp + cf.fn + cf.tn;
  const cell = (n, label, bg, fg, delay) => `<div class="cell" style="background:${bg};color:${fg};transition-delay:${delay}s"><b data-count="${n}">0</b><span>${label} &middot; ${pct(n / cfTot)}</span></div>`;
  $("#an-confusion").innerHTML = `<div></div><div class="ax">Actually fraud</div><div class="ax">Actually legitimate</div>
    <div class="ax" style="writing-mode:vertical-rl;transform:rotate(180deg)">Flagged</div>${cell(cf.tp, "caught", C.rust, C.paper, 0)}${cell(cf.fp, "false alarm", C.beige, C.brown, .1)}
    <div class="ax" style="writing-mode:vertical-rl;transform:rotate(180deg)">Not flagged</div>${cell(cf.fn, "missed", "rgba(162,69,46,.15)", C.rust, .2)}${cell(cf.tn, "correctly passed", C.espresso, C.beige, .3)}`;

  $("#an-top").innerHTML = `<thead><tr><th>User</th><th class="n">Value</th><th class="n">Age</th><th>Source</th><th class="n">Device reuse</th><th class="n">Score</th><th>Label</th></tr></thead><tbody>` +
    A.top.map(r => `<tr><td class="mono">${r.user_id}</td><td class="n">$${r.purchase_value}</td><td class="n">${r.age}</td><td>${r.source} / ${r.browser}</td><td class="n">${r.prior_purchases_same_device}</td><td class="n">${r.anomaly_score.toFixed(3)}</td><td><span class="pill ${r.class ? "fraud" : "legit"}">${r.class ? "fraud" : "legit"}</span></td></tr>`).join("") + "</tbody>";

  // anomaly playground
  const IF = M.iforest, NEVER = 1e8;
  const anFields = [
    { id: "t", label: "Time from signup to purchase", min: 0, max: 7.0, step: .05, val: 6.4, out: v => fmtDur(10 ** v - 1), hint: "Log scale: 1 second to about 115 days. Instant purchases are a classic bot signal." },
    { id: "value", label: "Purchase value", min: 9, max: 154, step: 1, val: 35, out: v => "$" + v },
    { id: "age", label: "Customer age", min: 18, max: 76, step: 1, val: 33, out: v => v + " yrs" },
    { id: "dev", label: "Earlier purchases on the same device", min: 0, max: 19, step: 1, val: 0, out: v => v },
    { id: "ip", label: "Earlier purchases from the same IP", min: 0, max: 19, step: 1, val: 0, out: v => v },
    { id: "hour", label: "Hour of purchase", min: 0, max: 23, step: 1, val: 14, out: v => String(v).padStart(2, "0") + ":00" },
    { id: "gap", label: "Time since the device was last used", min: 0, max: 7.5, step: .05, val: 5, out: v => fmtDur(10 ** v - 1), hint: "Only applies when the device has been used before." },
  ];
  $("#an-fields").innerHTML = anFields.map(f => `<div class="field"><div class="field-top"><label for="an-${f.id}">${f.label}</label><output id="an-${f.id}-out"></output></div>
      <input type="range" id="an-${f.id}" min="${f.min}" max="${f.max}" step="${f.step}" value="${f.val}">${f.hint ? `<div class="hint">${f.hint}</div>` : ""}</div>`).join("");
  const presets = {
    "Typical shopper": { t: 6.4, value: 35, age: 33, dev: 0, ip: 0, hour: 14, gap: 5 },
    "Instant bot purchase": { t: 0.3, value: 39, age: 31, dev: 12, ip: 12, hour: 4, gap: 0.3 },
    "Shared device, late order": { t: 6.9, value: 77, age: 29, dev: 14, ip: 0, hour: 23, gap: 5.7 },
    "Quick first order": { t: 3.2, value: 120, age: 58, dev: 0, ip: 0, hour: 2, gap: 5 },
  };
  $("#an-presets").innerHTML = Object.keys(presets).map(p => `<button class="chip" data-p="${p}">${p}</button>`).join("");
  $("#an-presets").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$("#an-presets .chip").forEach(c => c.classList.toggle("on", c === b));
    Object.entries(presets[b.dataset.p]).forEach(([k, v]) => { $("#an-" + k).value = v; });
    scoreTransaction();
  });
  const pctile = s => { const q = A.score_quantiles; let i = 0; while (i < 100 && q[i + 1] <= s) i++; return i; };
  const thrFrac = (IF.threshold - .3) / .45; // gauge spans scores 0.30 to 0.75
  const gAngle = f => -90 + Math.max(0, Math.min(1, f)) * 180;
  const thrRad = gAngle(thrFrac) * Math.PI / 180;
  $("#gauge-thr").setAttribute("x2", 160 + 150 * Math.sin(thrRad)); $("#gauge-thr").setAttribute("y2", 160 - 150 * Math.cos(thrRad));
  function scoreTransaction(e) {
    if (e) $$("#an-presets .chip").forEach(c => c.classList.remove("on"));
    const v = Object.fromEntries(anFields.map(f => [f.id, +$("#an-" + f.id).value]));
    const gapIn = $("#an-gap"); gapIn.disabled = v.dev === 0;
    anFields.forEach(f => { const el = $("#an-" + f.id); setRangeFill(el); $("#an-" + f.id + "-out").textContent = f.id === "gap" && v.dev === 0 ? "never used" : f.out(v[f.id]); });
    const gapSec = v.dev === 0 ? NEVER : 10 ** v.gap - 1;
    const x = [v.t, v.value, v.age, v.dev, v.ip, v.hour, Math.log10(gapSec + 1)];
    const s = Predict.iforestScore(IF, x), flagged = s >= IF.threshold, frac = (s - .3) / .45;
    $("#gauge-needle").style.transform = `rotate(${gAngle(frac)}deg)`;
    $("#gauge-arc").setAttribute("stroke-dasharray", `${Math.max(0, Math.min(1, frac)) * 100} 100`);
    const vEl = $("#an-verdict"); vEl.textContent = flagged ? "Send to review" : "Pass"; vEl.classList.toggle("flag", flagged);
    const p = pctile(s);
    $("#an-verdict-sub").textContent = `Anomaly score ${s.toFixed(4)}, threshold ${IF.threshold.toFixed(4)}`;
    $("#an-play-stats").innerHTML = `<div><b>${s.toFixed(3)}</b><span>anomaly score</span></div><div><b>${p >= 99 ? "top 1 %" : p + "th"}</b><span>percentile in test cohort</span></div><div><b>${flagged ? "Review" : "Pass"}</b><span>at 5 % budget</span></div>`;
  }
  $("#an-fields").addEventListener("input", scoreTransaction);
  scoreTransaction();

  // ---------------------------------------------------------------- MODULE C
  const champ = S.value.find(r => r.segment === "Champions");
  const xgbF = S.future.find(r => r.model === "XGBoost");
  $("#sg-kpis").innerHTML =
    kpi(champ.share_of_revenue * 100, "of revenue from Champions", "who are only " + pct(champ.share_of_customers, 0) + " of customers", { dec: 0, suffix: " %", dark: true }) +
    kpi(S.k_eval.length ? S.k_eval.find(k => k.selected).K : 4, "segments (K-Means)", "on log-scaled RFM features") +
    kpi(S.silhouette, "silhouette score", "cluster separation, −1 to 1", { dec: 2 }) +
    kpi(xgbF.Spearman, "future-spend Spearman", "XGBoost, next 6 months", { dec: 2 });

  const desc = {
    "Champions": "Recent, frequent, high spenders. Protect and reward.",
    "At-risk regulars": "Used to buy often but have gone quiet. Win back.",
    "Recent low-spend": "New or occasional buyers with recent activity. Nurture.",
    "Lapsed one-time buyers": "Bought once, long ago. Low-cost reactivation only.",
  };
  $("#sg-cards").innerHTML = S.profiles.map(p => `<div class="card seg-card" style="--c:${SEG_COLORS[p.segment]}">
      <h4><span class="seg-dot" style="background:${SEG_COLORS[p.segment]}"></span>${p.segment}</h4>
      <p class="sub" style="margin-bottom:14px">${desc[p.segment] || ""}</p>
      <dl><dt>Customers</dt><dd>${num(p.customers)} (${pct(p.share_of_customers, 0)})</dd>
      <dt>Median recency</dt><dd>${num(p.recency_median)} days</dd><dt>Median orders</dt><dd>${num(p.frequency_median)}</dd>
      <dt>Median spend</dt><dd>${gbp(p.monetary_median)}</dd><dt>Median order value</dt><dd>${gbp(p.avg_order_value_median)}</dd>
      <dt>Median tenure</dt><dd>${num(p.tenure_median)} days</dd></dl></div>`).join("");

  sortableTable($("#sg-score-future"), markBest([
    { key: "model", label: "Model" },
    { key: "overall_rank", label: "Rank", num: true, fmt: rankFmt },
    { key: "Spearman", label: "Spearman", num: true, bar: true, best: "max", fmt: v => v.toFixed(3) },
    { key: "top20_capture", label: "Top-20 % capture", num: true, best: "max", fmt: v => pct(v) },
    { key: "R2_log", label: "R² (log)", num: true, best: "max", fmt: v => v.toFixed(3) },
    { key: "R2", label: "R² (£)", num: true, best: "max", fmt: v => v.toFixed(3) },
    { key: "MAE", label: "MAE", num: true, best: "min", fmt: gbp },
    { key: "RMSE", label: "RMSE", num: true, best: "min", fmt: gbp },
    { key: "MedAE", label: "Median error", num: true, best: "min", fmt: gbp },
  ], S.future), S.future, r => r.model === "XGBoost");
  sortableTable($("#sg-score-k"), markBest([
    { key: "K", label: "Clusters", fmt: v => "K = " + v },
    { key: "silhouette", label: "Silhouette", num: true, bar: true, best: "max", fmt: v => v.toFixed(3) },
    { key: "davies_bouldin", label: "Davies–Bouldin (lower = better)", num: true, best: "min", fmt: v => v.toFixed(3) },
    { key: "calinski_harabasz", label: "Calinski–Harabasz", num: true, best: "max", fmt: v => num(v) },
    { key: "inertia", label: "Inertia", num: true, fmt: v => num(v) },
    { key: "selected", label: "Selected", fmt: v => v ? "Yes" : "" },
  ], S.k_eval), S.k_eval, r => r.selected);

  // segmentation playground
  const KM = M.kmeans;
  const sgFields = [
    { id: "r", label: "Recency: days since last purchase", min: 0, max: 738, step: 1, val: 30, out: v => v + " days" },
    { id: "f", label: "Frequency: number of orders", min: 1, max: 200, step: 1, val: 6, out: v => v, log: true },
    { id: "m", label: "Monetary: total net spend", min: 3, max: 300000, step: 1, val: 2000, out: v => gbp(v), log: true },
  ];
  // log sliders map 0..1000 to min..max on a log scale
  const toVal = (f, s) => f.log ? Math.round(Math.exp(Math.log(f.min) + s / 1000 * (Math.log(f.max) - Math.log(f.min)))) : +s;
  const toSlider = (f, v) => f.log ? Math.round((Math.log(Math.max(f.min, v)) - Math.log(f.min)) / (Math.log(f.max) - Math.log(f.min)) * 1000) : v;
  $("#sg-fields").innerHTML = sgFields.map(f => `<div class="field"><div class="field-top"><label for="sg-${f.id}">${f.label}</label><output id="sg-${f.id}-out"></output></div>
      <input type="range" id="sg-${f.id}" min="${f.log ? 0 : f.min}" max="${f.log ? 1000 : f.max}" step="1" value="${toSlider(f, f.val)}">${f.log ? '<div class="hint">Log scale slider</div>' : ""}</div>`).join("");
  function assignSegment(fromLookup) {
    if (!fromLookup) $("#sg-id-msg").textContent = "";
    const v = sgFields.map(f => toVal(f, $("#sg-" + f.id).value));
    sgFields.forEach((f, i) => { setRangeFill($("#sg-" + f.id)); $("#sg-" + f.id + "-out").textContent = f.out(v[i]); });
    const res = Predict.kmeansAssign(KM, v);
    $("#sg-result").innerHTML = `<span class="seg-dot" style="background:${SEG_COLORS[res.name]}"></span><span>${res.name}</span>`;
    $("#sg-result-sub").textContent = desc[res.name];
    const close = res.distances.map(d => 1 / (d + .05)), tot = close.reduce((a, b) => a + b, 0);
    $("#sg-dists").innerHTML = res.distances.map((d, i) => ({ d, i, share: close[i] / tot })).sort((a, b) => a.d - b.d)
      .map(o => `<div class="dist-row ${o.i === res.cluster ? "win" : ""}"><span>${KM.names[o.i]}</span><div class="meter"><span style="width:${(o.share * 100).toFixed(1)}%;background:${SEG_COLORS[KM.names[o.i]]}"></span></div><span class="mono">${o.d.toFixed(2)}</span></div>`).join("");
    const prof = S.profiles.find(p => p.segment === res.name);
    $("#sg-play-stats").innerHTML = `<div><b>${gbp(v[2] / v[1])}</b><span>avg order value</span></div><div><b>${gbp(prof.monetary_median)}</b><span>segment median spend</span></div><div><b>${pct(prof.share_of_customers, 0)}</b><span>of customers here</span></div>`;
    return res;
  }
  $("#sg-fields").addEventListener("input", () => assignSegment(false));
  function lookup(id) {
    const c = S.customers[id], msg = $("#sg-id-msg");
    if (!c) { msg.textContent = "No customer with that ID in the segmented base (" + num(Object.keys(S.customers).length) + " customers)."; msg.style.color = C.rust; return; }
    [c[0], c[1], c[2]].forEach((v, i) => { $("#sg-" + sgFields[i].id).value = toSlider(sgFields[i], v); });
    // show exact values from the data, not the slider-rounded ones
    const res = Predict.kmeansAssign(KM, [c[0], c[1], c[2]]);
    assignSegment(true);
    sgFields.forEach((f, i) => { $("#sg-" + f.id + "-out").textContent = f.out(c[i]); });
    $("#sg-result").innerHTML = `<span class="seg-dot" style="background:${SEG_COLORS[res.name]}"></span><span>${res.name}</span>`;
    msg.style.color = C.olive;
    msg.textContent = `Customer ${id}: ${c[0]} days, ${c[1]} orders, ${gbp(c[2])}. Notebook segment: ${c[3]}${c[3] === res.name ? " (browser model agrees)" : ""}.`;
  }
  $("#sg-lookup").onclick = () => lookup($("#sg-id").value.trim());
  $("#sg-id").addEventListener("keydown", e => { if (e.key === "Enter") lookup($("#sg-id").value.trim()); });
  $("#sg-random").onclick = () => { const ids = Object.keys(S.customers); const id = ids[Math.floor(Math.random() * ids.length)]; $("#sg-id").value = id; lookup(id); };
  assignSegment(false);

  // ---------------------------------------------------------------- COMPARISON
  const fcRows = [...F.metrics].sort((a, b) => a.test_MAE - b.test_MAE).filter(r => [selName, "Seasonal naive (last year)", "XGBoost (daily→weekly)", "Naive (last week)", "Training mean"].includes(r.model));
  const fcMax = Math.max(...fcRows.map(r => r.test_MAE));
  const vs = (rows, selFn, valFn, fmt, max) => rows.map(r => `<div class="vs-row ${selFn(r) ? "sel" : ""}"><span>${r.label}</span><div class="meter"><span data-w="${(valFn(r) / max * 100).toFixed(1)}%"></span></div><span class="mono" style="text-align:right">${fmt(valFn(r))}</span></div>`).join("");
  const anRows = [...A.comparison.map(r => ({ label: r.method, v: r.lift })), { label: "Random review", v: 1 }].sort((a, b) => b.v - a.v);
  const sgRows = [...S.future].sort((a, b) => b.Spearman - a.Spearman).map(r => ({ label: r.model.replace(" (past monthly rate × 6)", ""), v: r.Spearman }));
  $("#compare-rows").innerHTML = `
    <div class="compare-row"><div><div class="mod">Module A</div><h4>Revenue forecasting</h4><p class="sub">Test MAE, lower is better</p></div>
      <div class="vs">${vs(fcRows.map(r => ({ ...r, label: short(r.model) })), r => r.model === selName, r => r.test_MAE, gbpK, fcMax)}</div></div>
    <div class="compare-row"><div><div class="mod">Module B</div><h4>Anomaly detection</h4><p class="sub">Lift at the review budget, higher is better</p></div>
      <div class="vs">${vs(anRows, r => r.label === "Isolation Forest", r => r.v, v => v.toFixed(2) + "×", 5.5)}</div></div>
    <div class="compare-row"><div><div class="mod">Module C</div><h4>Customer value</h4><p class="sub">Future-spend Spearman, higher is better</p></div>
      <div class="vs">${vs(sgRows, r => r.label === "XGBoost", r => r.v, v => v.toFixed(3), .7)}</div></div>`;
  $("#compare-rows").classList.add("meter-group");

  $("#summary-table").innerHTML = `<thead><tr>${Object.keys(D.summary[0]).map(k => `<th>${k}</th>`).join("")}</tr></thead><tbody>` +
    D.summary.map(r => `<tr>${Object.values(r).map((v, i) => `<td${i === 0 ? ' style="font-weight:700;color:var(--espresso)"' : ""}>${v}</td>`).join("")}</tr>`).join("") + "</tbody>";

  // ---------------------------------------------------------------- GALLERY
  const figs = ["00_retail_revenue_over_time", "00_retail_weekday_pattern", "00_retail_country_customers", "00_retail_missing_values", "00_retail_numeric_histograms", "00_fraud_by_month", "00_fraud_signals",
    "01_weekly_revenue", "01_seasonality_autocorrelation", "01_train_test_split", "01_model_comparison", "01_actual_vs_predicted_all", "01_selected_model_residuals", "01_feature_importance", "01_full_metric_comparison",
    "02_feature_distributions", "02_method_comparison", "02_confusion_and_scatter", "02_flag_rate_tradeoff", "02_all_confusion_matrices", "02_full_metric_comparison",
    "03_rfm_raw_distributions", "03_rfm_transformed_distributions", "03_elbow_silhouette", "03_segments", "03_segment_revenue", "03_future_value_models",
    "04_forecast_summary", "04_anomaly_summary", "04_segmentation_summary", "04_full_metric_comparison"];
  const groups = { "00": "Data exploration", "01": "Forecasting", "02": "Anomaly", "03": "Segmentation", "04": "Summary" };
  const nice = f => f.slice(3).replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
  $("#gal-chips").innerHTML = `<button class="chip on" data-g="all">All</button>` + Object.entries(groups).map(([k, v]) => `<button class="chip" data-g="${k}">${k} &middot; ${v}</button>`).join("");
  $("#gallery-grid").innerHTML = figs.map(f => `<figure data-g="${f.slice(0, 2)}" class="reveal"><img loading="lazy" src="figures/${f}.png" alt="${nice(f)}"><figcaption>${f.slice(0, 2)} &middot; ${nice(f)}</figcaption></figure>`).join("");
  $("#gal-chips").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$("#gal-chips .chip").forEach(c => c.classList.toggle("on", c === b));
    $$("#gallery-grid figure").forEach(fg => { fg.classList.toggle("hide", b.dataset.g !== "all" && fg.dataset.g !== b.dataset.g); fg.classList.add("in"); });
  });
  const lb = $("#lightbox");
  $("#gallery-grid").addEventListener("click", e => {
    const fg = e.target.closest("figure"); if (!fg) return;
    $("#lb-img").src = fg.querySelector("img").src; $("#lb-img").alt = fg.querySelector("img").alt; $("#lb-cap").textContent = fg.querySelector("figcaption").textContent;
    lb.classList.add("open");
  });
  const closeLb = () => lb.classList.remove("open");
  $("#lb-close").onclick = closeLb; lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
  addEventListener("keydown", e => { if (e.key === "Escape") closeLb(); });

  observe();
})();
