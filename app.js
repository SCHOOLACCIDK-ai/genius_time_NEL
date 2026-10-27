
const grid = document.querySelector("#client-grid");
const search = document.querySelector("#search");
const sort = document.querySelector("#sort");
const count = document.querySelector("#client-count");
const picker = document.querySelector("#compare-picker");
const head = document.querySelector("#compare-head");
const body = document.querySelector("#compare-body");

const ratings = [
  ["Customization", "customization"],
  ["PvP-oriented features", "pvp"],
  ["Performance", "performance"],
  ["Mod support", "modSupport"],
  ["Ease of use", "ease"]
];

let clients = [];
let selected = ["liquidbounce", "meteor", "lunar", "badlion"];

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function ratingRow(label, value, color) {
  return `
    <div class="rating-row">
      <span>${escapeHTML(label)}</span>
      <div class="rating-track">
        <div class="rating-fill"
          style="width:${value * 20}%;--client-color:${color}"></div>
      </div>
      <span class="rating-number">${value}/5</span>
    </div>`;
}

function renderCards() {
  const query = search.value.trim().toLowerCase();
  let results = clients.filter(client => {
    const searchable = [
      client.name,
      client.type,
      client.description,
      client.bestFor,
      ...client.features
    ].join(" ").toLowerCase();

    return searchable.includes(query);
  });

  if (sort.value === "name") {
    results.sort((a, b) => a.name.localeCompare(b.name));
  } else if (["customization", "performance", "ease"].includes(sort.value)) {
    results.sort((a, b) => b[sort.value] - a[sort.value]);
  } else {
    results.sort((a, b) =>
      Number(b.id === "liquidbounce") - Number(a.id === "liquidbounce")
    );
  }

  count.textContent = `${results.length} CLIENT${results.length === 1 ? "" : "S"} FOUND`;

  if (!results.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No clients found</h3>
        <p>Try another name or search term.</p>
      </div>`;
    return;
  }

  grid.innerHTML = results.map(client => `
    <article class="client-card ${client.id === "liquidbounce" ? "featured-card" : ""}"
      style="--client-color:${client.color}">
      <div class="card-top">
        <div class="client-logo">${escapeHTML(client.name.charAt(0))}</div>
        <div class="card-title">
          <h3>${escapeHTML(client.name)}</h3>
          <span class="card-type">${escapeHTML(client.type)}</span>
        </div>
        ${client.id === "liquidbounce"
          ? '<span class="feature-tag">FEATURED</span>'
          : ""}
      </div>

      <p class="card-description">${escapeHTML(client.description)}</p>

      <div class="card-meta">
        <span>BEST FOR</span>
        <strong>${escapeHTML(client.bestFor)}</strong>
      </div>

      <div class="feature-chips">
        ${client.features.map(feature =>
          `<span class="chip">${escapeHTML(feature)}</span>`
        ).join("")}
        <span class="chip">${client.openSource ? "Open source" : "Proprietary"}</span>
      </div>

      <div class="mini-ratings">
        ${ratings.map(([label, key]) =>
          ratingRow(label, client[key], client.color)
        ).join("")}
      </div>

      <div class="card-actions">
        <button type="button" data-compare="${client.id}">
          ${selected.includes(client.id) ? "✓ Selected" : "+ Compare"}
        </button>
        <a class="official-link"
          href="${escapeHTML(client.website)}"
          target="_blank" rel="noopener noreferrer">Official site ↗</a>
      </div>
    </article>
  `).join("");
}

function renderPicker() {
  picker.innerHTML = clients.map(client => `
    <label class="compare-option">
      <input type="checkbox" value="${client.id}"
        ${selected.includes(client.id) ? "checked" : ""}
        ${!selected.includes(client.id) && selected.length >= 4 ? "disabled" : ""}>
      <span style="color:${client.color}">●</span>
      ${escapeHTML(client.name)}
    </label>
  `).join("");

  renderTable();
}

function renderTable() {
  const chosen = clients.filter(client => selected.includes(client.id));

  head.innerHTML = `
    <tr>
      <th>FEATURE</th>
      ${chosen.map(client =>
        `<th>${escapeHTML(client.name)}</th>`
      ).join("")}
    </tr>`;

  const rows = [
    ["Type", client => escapeHTML(client.type)],
    ["Best for", client => escapeHTML(client.bestFor)],
    ["Open source", client => client.openSource ? "Yes" : "No"],
    ["Customization", client => `${client.customization}/5`],
    ["PvP-oriented features", client => `${client.pvp}/5`],
    ["Performance", client => `${client.performance}/5`],
    ["Mod support", client => `${client.modSupport}/5`],
    ["Ease of use", client => `${client.ease}/5`]
  ];

  body.innerHTML = rows.map(([label, value]) => `
    <tr>
      <td>${escapeHTML(label)}</td>
      ${chosen.map(client =>
        `<td>${value(client)}</td>`
      ).join("")}
    </tr>
  `).join("");
}

grid.addEventListener("click", event => {
  const button = event.target.closest("[data-compare]");
  if (!button) return;

  const id = button.dataset.compare;

  if (selected.includes(id)) {
    selected = selected.filter(item => item !== id);
  } else if (selected.length < 4) {
    selected.push(id);
  } else {
    alert("You can compare up to four clients.");
    return;
  }

  renderCards();
  renderPicker();
});

picker.addEventListener("change", event => {
  const input = event.target;
  if (input.type !== "checkbox") return;

  if (input.checked) {
    if (selected.length >= 4) {
      input.checked = false;
      return;
    }
    if (!selected.includes(input.value)) selected.push(input.value);
  } else {
    selected = selected.filter(id => id !== input.value);
  }

  renderCards();
  renderPicker();
});

search.addEventListener("input", renderCards);
sort.addEventListener("change", renderCards);

async function initialize() {
  try {
    const response = await fetch("/api/clients");

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    clients = await response.json();
    renderCards();
    renderPicker();
  } catch (error) {
    console.error("Could not load clients:", error);
    count.textContent = "CONNECTION ERROR";
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Could not load the client database.</h3>
        <p>Make sure the Node.js server is running, then refresh this page.</p>
      </div>`;
  }
}

initialize();
