
const grid = document.querySelector("#client-grid");
const search = document.querySelector("#search");
const sort = document.querySelector("#sort");
const count = document.querySelector("#client-count");
const picker = document.querySelector("#compare-picker");
const head = document.querySelector("#compare-head");
const body = document.querySelector("#compare-body");

const ratings = [
  ["Customization", "customization"],
  ["PvP features", "pvp"],
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

function renderCards() {
  const query = search.value.trim().toLowerCase();

  let results = clients.filter(client => [
    client.name,
    client.type,
    client.description,
    client.bestFor,
    ...client.features
  ].join(" ").toLowerCase().includes(query));

  if (sort.value === "name") {
    results.sort((a, b) => a.name.localeCompare(b.name));
  } else if (["customization", "performance", "ease"].includes(sort.value)) {
    results.sort((a, b) => b[sort.value] - a[sort.value]);
  } else {
    results.sort((a, b) =>
      Number(b.id === "liquidbounce") - Number(a.id === "liquidbounce")
    );
  }

  count.textContent = `${results.length} client(s) found`;

  if (!results.length) {
    grid.innerHTML = '<div class="empty-state">No clients found. Try another search.</div>';
    return;
  }

  grid.innerHTML = results.map(client => `
    <article class="client-card ${client.id === "liquidbounce" ? "featured-card" : ""}">
      <h3>${escapeHTML(client.name)}</h3>
      <span class="card-type">${escapeHTML(client.type)}</span>

      <p class="card-description">${escapeHTML(client.description)}</p>

      <div class="card-meta">
        Best for: <strong>${escapeHTML(client.bestFor)}</strong>
      </div>

      <div class="feature-chips">
        ${client.features.map(feature =>
          `<span class="chip">${escapeHTML(feature)}</span>`
        ).join("")}
        <span class="chip">${client.openSource ? "Open source" : "Closed source"}</span>
      </div>

      <div class="mini-ratings">
        ${ratings.map(([label, key]) => `
          <div class="rating-row">
            <span>${escapeHTML(label)}</span>
            <div class="rating-track">
              <div class="rating-fill" style="width:${client[key] * 20}%;--client-color:${client.color}"></div>
            </div>
            <span class="rating-number">${client[key]}/5</span>
          </div>
        `).join("")}
      </div>

      <div class="card-actions">
        <button type="button" data-compare="${client.id}">
          ${selected.includes(client.id) ? "✓ Selected" : "+ Compare"}
        </button>
        <a class="official-link" href="${escapeHTML(client.website)}"
          target="_blank" rel="noopener noreferrer">Official website ↗</a>
      </div>
    </article>
  `).join("");
}

function renderTable() {
  const chosen = clients.filter(client => selected.includes(client.id));

  head.innerHTML = `<tr><th>Feature</th>${chosen.map(client =>
    `<th>${escapeHTML(client.name)}</th>`
  ).join("")}</tr>`;

  const rows = [
    ["Type", client => escapeHTML(client.type)],
    ["Best for", client => escapeHTML(client.bestFor)],
    ["Open source", client => client.openSource ? "Yes" : "No"],
    ["Customization", client => `${client.customization}/5`],
    ["PvP features", client => `${client.pvp}/5`],
    ["Performance", client => `${client.performance}/5`],
    ["Mod support", client => `${client.modSupport}/5`],
    ["Ease of use", client => `${client.ease}/5`]
  ];

  body.innerHTML = rows.map(([label, getValue]) => `
    <tr><td>${escapeHTML(label)}</td>${chosen.map(client =>
      `<td>${getValue(client)}</td>`
    ).join("")}</tr>
  `).join("");
}

function renderPicker() {
  picker.innerHTML = clients.map(client => `
    <label class="compare-option">
      <input type="checkbox" value="${client.id}"
        ${selected.includes(client.id) ? "checked" : ""}
        ${!selected.includes(client.id) && selected.length >= 4 ? "disabled" : ""}>
      ${escapeHTML(client.name)}
    </label>
  `).join("");

  renderTable();
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
    if (!response.ok) throw new Error("Unable to load clients");

    clients = await response.json();
    renderCards();
    renderPicker();
  } catch (error) {
    console.error(error);
    count.textContent = "Could not load clients";
    grid.innerHTML = '<div class="empty-state">Please refresh the page or check the server.</div>';
  }
}

initialize();
