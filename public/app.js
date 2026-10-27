const PRIORITIES = [
  { key: "RISCO ALTO",  css: "high", color: "#d62839" },
  { key: "RISCO MÉDIO", css: "mid",  color: "#e09f1f" },
  { key: "RISCO BAIXO", css: "low",  color: "#2f9e6b" },
];
const byKey = Object.fromEntries(PRIORITIES.map(p => [p.key, p]));

const state = { data: null, filter: "TODOS", search: "", sortKey: "Occurrences", sortDir: -1 };
let barChart = null;
let donutChart = null;

Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
Chart.defaults.color = "#5b6478";

// Guarda os gráficos extras pelo id do canvas, para destruir o anterior ao reanalisar
const extraCharts = {};
function draw(id, config) {
  if (extraCharts[id]) extraCharts[id].destroy();
  extraCharts[id] = new Chart($(id), config);
}

const $ = id => document.getElementById(id);

// O EventTemplate contém textos como "socket to <*>": sem escapar, o navegador
// entenderia "<*>" como uma tag HTML e o texto sumiria.
const esc = s => String(s).replace(/[&<>"']/g, c => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

const fmt = n => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

async function analyze() {
  const button = $("analyze");
  button.disabled = true;
  button.textContent = "Analisando…";
  $("error").hidden = true;

  try {
    const response = await fetch("http://127.0.0.1:5000/api/analysis");
    if (!response.ok) throw new Error("O servidor respondeu com erro " + response.status);
    state.data = await response.json();
    render();
  } catch (err) {
    $("error").textContent =
      "Não foi possível carregar a análise. Confira se o servidor está rodando e se " +
      "data/sample/BGL_2k.log_structured.csv existe. Detalhe: " + err.message;
    $("error").hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "Analisar novamente";
  }
}

function render() {
  $("empty").hidden = true;
  $("dashboard").hidden = false;
  renderStats();
  renderBar();
  renderDonut();
  renderPareto();
  renderHistogram();
  renderTimeline();
  renderComponent();
  renderChips();
  renderTable();
}

function renderStats() {
  const { rows, total_alerts, q50, q75 } = state.data;
  $("s-total").textContent = fmt(total_alerts);
  $("s-patterns").textContent = fmt(rows.length);
  $("s-q50").textContent = fmt(q50);
  $("s-q75").textContent = fmt(q75);
  $("s-top").textContent = fmt((rows[0].Occurrences / total_alerts) * 100) + "%";
}

/* Gráfico 1: barras horizontais com as linhas de corte Q50 e Q75 */
const thresholdLines = {
  id: "thresholdLines",
  afterDatasetsDraw(chart, _args, opts) {
    const { ctx, chartArea, scales } = chart;
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.font = "500 11px 'IBM Plex Sans', sans-serif";
    opts.lines.forEach(line => {
      const x = scales.x.getPixelForValue(line.value);
      ctx.strokeStyle = line.color;
      ctx.fillStyle = line.color;
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.fillText(line.label, x + 4, chartArea.bottom - 6);
    });
    ctx.restore();
  },
};

function renderBar() {
  const { rows, q50, q75 } = state.data;
  const top = rows.slice(0, 12);
  if (barChart) barChart.destroy();

  barChart = new Chart($("bar"), {
    type: "bar",
    data: {
      labels: top.map(r => r.EventId),
      datasets: [{
        data: top.map(r => r.Occurrences),
        backgroundColor: top.map(r => byKey[r.Priority].color),
        borderRadius: 3,
      }],
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true, grid: { color: "#e3e7ee" }, title: { display: true, text: "Ocorrências" } },
        y: { grid: { display: false } },
      },
      plugins: {
        legend: { display: false },
        thresholdLines: {
          lines: [
            { value: q50, color: "#2f9e6b", label: "Q50 = " + fmt(q50) },
            { value: q75, color: "#b57a00", label: "Q75 = " + fmt(q75) },
          ],
        },
        tooltip: {
          callbacks: {
            title: items => top[items[0].dataIndex].EventId + " · " + top[items[0].dataIndex].Priority,
            label: item => fmt(item.raw) + " ocorrências",
            afterLabel: item => top[item.dataIndex].EventTemplate,
          },
        },
      },
    },
    plugins: [thresholdLines],
  });
}

/* Gráfico 2: rosca com o total de registros em cada prioridade */
function renderDonut() {
  const { rows, total_alerts } = state.data;
  const totals = PRIORITIES.map(p =>
    rows.filter(r => r.Priority === p.key).reduce((sum, r) => sum + r.Occurrences, 0)
  );
  const patterns = PRIORITIES.map(p => rows.filter(r => r.Priority === p.key).length);
  if (donutChart) donutChart.destroy();

  donutChart = new Chart($("donut"), {
    type: "doughnut",
    data: {
      labels: PRIORITIES.map(p => p.key),
      datasets: [{ data: totals, backgroundColor: PRIORITIES.map(p => p.color), borderColor: "#eef1f4", borderWidth: 3 }],
    },
    options: {
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: item => fmt(item.raw) + " registros (" + fmt((item.raw / total_alerts) * 100) + "%)",
          },
        },
      },
    },
  });

  $("legend").innerHTML = PRIORITIES.map((p, i) =>
    `<li><span class="dot" style="background:${p.color}"></span>${esc(p.key)}` +
    `<span class="qty">${patterns[i]} padrões · ${fmt(totals[i])} registros</span></li>`
  ).join("");
}

/* Gráfico 3: Pareto (barras + linha do percentual acumulado) */
function renderPareto() {
  const { rows, total_alerts } = state.data;
  let running = 0;
  const cumulative = rows.map(r => (running += r.Occurrences, (running / total_alerts) * 100));
  const needed = cumulative.findIndex(c => c >= 80) + 1;

  $("pareto-note").textContent =
    `${needed} de ${rows.length} padrões já somam 80% dos registros de alerta.`;

  draw("pareto", {
    data: {
      labels: rows.map(r => r.EventId),
      datasets: [
        { type: "bar", label: "Ocorrências", data: rows.map(r => r.Occurrences),
          backgroundColor: rows.map(r => byKey[r.Priority].color), borderRadius: 3, yAxisID: "y" },
        { type: "line", label: "% acumulado", data: cumulative, yAxisID: "y1",
          borderColor: "#14213d", backgroundColor: "#14213d", pointRadius: 2, tension: 0.2 },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "#e3e7ee" }, title: { display: true, text: "Ocorrências" } },
        y1: { position: "right", min: 0, max: 100, grid: { display: false },
              ticks: { callback: v => v + "%" } },
      },
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12 } },
        tooltip: { callbacks: { label: i => i.dataset.label + ": " + fmt(i.raw) + (i.datasetIndex ? "%" : "") } },
      },
    },
  });
}

/* Gráfico 4: histograma da quantidade de ocorrências por padrão */
function renderHistogram() {
  const bins = [
    { label: "1", min: 1, max: 1 }, { label: "2", min: 2, max: 2 },
    { label: "3", min: 3, max: 3 }, { label: "4–5", min: 4, max: 5 },
    { label: "6–10", min: 6, max: 10 }, { label: "11–20", min: 11, max: 20 },
    { label: "21+", min: 21, max: Infinity },
  ];
  const counts = bins.map(b =>
    state.data.rows.filter(r => r.Occurrences >= b.min && r.Occurrences <= b.max).length
  );

  draw("hist", {
    type: "bar",
    data: { labels: bins.map(b => b.label), datasets: [{ data: counts, backgroundColor: "#14213d", borderRadius: 3 }] },
    options: {
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, title: { display: true, text: "Ocorrências do padrão" } },
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#e3e7ee" },
             title: { display: true, text: "Quantidade de padrões" } },
      },
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: i => i.raw + (i.raw === 1 ? " padrão" : " padrões") } } },
    },
  });
}

/* Gráfico 5: linha com os alertas por data */
function renderTimeline() {
  const data = state.data.insights.by_date;
  draw("timeline", {
    type: "line",
    data: {
      labels: data.map(d => d.label),
      datasets: [{ data: data.map(d => d.value), borderColor: "#d62839", backgroundColor: "rgba(214,40,57,0.12)",
                   fill: true, tension: 0.25, pointRadius: 3 }],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#e3e7ee" } },
      },
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: i => fmt(i.raw) + " alertas" } } },
    },
  });
}

/* Gráfico 6: alertas por componente */
function renderComponent() {
  const data = state.data.insights.by_component.slice(0, 10);
  draw("component", {
    type: "bar",
    data: { labels: data.map(d => d.label), datasets: [{ data: data.map(d => d.value), backgroundColor: "#3d5a80", borderRadius: 3 }] },
    options: {
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#e3e7ee" } },
      },
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: i => fmt(i.raw) + " alertas" } } },
    },
  });
}

/* Filtros e tabela */
function renderChips() {
  const options = ["TODOS", ...PRIORITIES.map(p => p.key)];
  $("chips").innerHTML = options.map(o =>
    `<button class="chip" data-filter="${esc(o)}" aria-pressed="${o === state.filter}">${esc(o === "TODOS" ? "Todos" : o)}</button>`
  ).join("");
}

function renderTable() {
  const { rows } = state.data;
  const max = Math.max(...rows.map(r => r.Occurrences));
  const term = state.search.trim().toLowerCase();

  const visible = rows
    .filter(r => state.filter === "TODOS" || r.Priority === state.filter)
    .filter(r => !term || (r.EventId + " " + r.EventTemplate).toLowerCase().includes(term))
    .sort((a, b) => {
      const x = a[state.sortKey];
      const y = b[state.sortKey];

      return (
        x > y ? 1 : 
        x < y ? -1 : 
        0
      ) * state.sortDir;
    });

  $("rows").innerHTML = visible.map(r => {
    const p = byKey[r.Priority];
    return `<tr>
      <td class="mono">${esc(r.EventId)}</td>
      <td>${esc(r.Level)}</td>
      <td class="mono tpl">${esc(r.EventTemplate)}</td>
      <td class="num"><div class="occ">${fmt(r.Occurrences)}
        <span class="occ-bar"><i style="width:${(r.Occurrences / max) * 100}%;background:${p.color}"></i></span></div></td>
      <td><span class="badge ${p.css}">${esc(r.Priority)}</span></td>
    </tr>`;
  }).join("");

  $("count").textContent = `Mostrando ${visible.length} de ${rows.length} padrões`;

  document.querySelectorAll("th").forEach(th => {
    th.classList.toggle("sorted", th.dataset.key === state.sortKey);
    th.classList.toggle("asc", state.sortDir === 1);
  });
}

/* Eventos */
$("analyze").addEventListener("click", analyze);

$("chips").addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  state.filter = chip.dataset.filter;
  renderChips();
  renderTable();
});

$("search").addEventListener("input", e => {
  state.search = e.target.value;
  renderTable();
});

document.querySelector("thead").addEventListener("click", e => {
  const th = e.target.closest("th");
  if (!th) return;
  const key = th.dataset.key;
  state.sortDir = state.sortKey === key ? -state.sortDir : (key === "Occurrences" ? -1 : 1);
  state.sortKey = key;
  renderTable();
});