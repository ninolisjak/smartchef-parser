async function loadPX() {
  const res = await fetch("/data/hrana.PX");
  const text = await res.text();

  const px = new Px(text);

  const years = px.values("LETO");
  const indices = px.values("INDEKSI");
  const data = px.getData();   // 2D tabela [leto][indeks]

  const select = document.getElementById("filterSelect");

  // napolni dropdown
  indices.forEach((name, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = name;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    renderChart(select.value);
  });

  renderChart(0);

  function renderChart(index) {
    const dataset = years.map((_, y) => data[y][index]);

    const ctx = document.getElementById("pxChart").getContext("2d");

    if (window.chart) window.chart.destroy();

    window.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: years,
        datasets: [{
          label: indices[index],
          data: dataset,
          borderWidth: 2
        }]
      }
    });
  }
}

loadPX();
