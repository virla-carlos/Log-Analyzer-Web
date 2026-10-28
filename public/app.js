const PRIORITIES = [
  { key: "RISCO ALTO",  css: "high", color: "#d62839" },
  { key: "RISCO MÉDIO", css: "mid",  color: "#e09f1f" },
  { key: "RISCO BAIXO", css: "low",  color: "#2f9e6b" },
];
const byKey = Object.fromEntries(PRIORITIES.map(p => [p.key, p]));

const state = { data: null, filter: "TODOS", search: "", sortKey: "Occurrences", sortDir: -1 };
let barChart = null;

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
    const response = await fetch("/api/analysis");
    if (!response.ok) throw new Error("O servidor respondeu com erro " + response.status);
    state.data = await response.json();
    render();
  } catch (err) {
    $("error").textContent =
      "Não foi possível carregar a análise. Confira se o servidor está rodando e se " +
      "data/raw/BGL_2k.log_structured.csv existe. Detalhe: " + err.message;
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
  renderPriority();
  renderPareto();
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

// Escreve o número de ocorrências em cada barra: dentro dela quando cabe, ao lado quando é curta
const valueLabels = {
  id: "valueLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const bars = chart.getDatasetMeta(0).data;
    const values = chart.data.datasets[0].data;
    const colors = chart.data.datasets[0].backgroundColor;

    ctx.save();
    ctx.font = "600 12px 'IBM Plex Sans', sans-serif";
    ctx.textBaseline = "middle";
    bars.forEach((bar, i) => {
      const text = String(values[i]);
      const fits = bar.x - bar.base > ctx.measureText(text).width + 14;
      ctx.textAlign = fits ? "right" : "left";
      // o texto do risco médio (amarelo) precisa de cor escura para ser legível
      ctx.fillStyle = fits ? (colors[i] === byKey["RISCO MÉDIO"].color ? "#412402" : "#ffffff") : "#14213d";
      ctx.fillText(text, fits ? bar.x - 7 : bar.x + 6, bar.y);
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
      layout: { padding: { right: 28 } },
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
    plugins: [thresholdLines, valueLabels],
  });
}

/* Gráfico 2: barras agrupadas, % dos padrões x % dos registros em cada prioridade */
const percentLabels = {
  id: "percentLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.font = "600 12px 'IBM Plex Sans', sans-serif";
    ctx.fillStyle = "#14213d";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    chart.data.datasets.forEach((dataset, d) => {
      chart.getDatasetMeta(d).data.forEach((bar, i) => {
        ctx.fillText(Math.round(dataset.data[i]) + "%", bar.x, bar.y - 4);
      });
    });
    ctx.restore();
  },
};

function renderPriority() {
  const { rows, total_alerts } = state.data;
  const names = ["Alto", "Médio", "Baixo"];

  const groups = PRIORITIES.map(p => rows.filter(r => r.Priority === p.key));
  const records = groups.map(g => g.reduce((sum, r) => sum + r.Occurrences, 0));
  const patternShare = groups.map(g => (g.length / rows.length) * 100);
  const recordShare = records.map(n => (n / total_alerts) * 100);

  draw("priority", {
    type: "bar",
    data: {
      // um rótulo em array vira várias linhas no eixo
      labels: PRIORITIES.map((p, i) => [names[i], groups[i].length + " padrões", fmt(records[i]) + " registros"]),
      datasets: [
        { label: "% dos padrões", data: patternShare, borderWidth: 1, borderRadius: 3,
          backgroundColor: PRIORITIES.map(p => p.color + "55"), borderColor: PRIORITIES.map(p => p.color) },
        { label: "% dos registros", data: recordShare, borderRadius: 3,
          backgroundColor: PRIORITIES.map(p => p.color) },
      ],
    },
    options: {
      maintainAspectRatio: false,
      layout: { padding: { top: 18 } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, max: 100, grid: { color: "#e3e7ee" }, ticks: { callback: v => v + "%" } },
      },
      plugins: {
        legend: {
          position: "bottom",
          onClick: () => {},
          labels: {
            boxWidth: 12,
            generateLabels: () => [
              { text: "% dos padrões", fillStyle: "rgba(91,100,120,0.3)", strokeStyle: "#5b6478", lineWidth: 1 },
              { text: "% dos registros", fillStyle: "#5b6478", strokeStyle: "#5b6478", lineWidth: 1 },
            ],
          },
        },
        tooltip: { callbacks: { label: i => i.dataset.label + ": " + fmt(i.raw) + "%" } },
      },
    },
    plugins: [percentLabels],
  });
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

/* Gráfico 4: linha com os alertas por data */
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
        x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#e3e7ee" } },
      },
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: i => fmt(i.raw) + " alertas" } } },
    },
  });
}

/* Gráfico 5: alertas por componente */
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
      const x = a[state.sortKey], y = b[state.sortKey];
      return (x > y ? 1 : x < y ? -1 : 0) * state.sortDir;
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