// ─── Config ───
const apiInput = document.getElementById("api-url");
const getApi = () => apiInput.value.trim().replace(/\/+$/, "");

// ─── State ───
let allSymptoms = [];          // raw names exactly as the API expects them
const selected = new Set();

// ─── Elements ───
const $ = (id) => document.getElementById(id);
const listEl = $("symptom-list");
const listStatus = $("list-status");
const selectedEl = $("selected");
const searchEl = $("search");
const predictBtn = $("predict");
const clearBtn = $("clear");
const errorEl = $("error");
const resultEl = $("result");

// "skin_rash" -> "Skin rash" (trim guards against stray spaces in names)
const pretty = (s) => {
  const t = s.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// ─── Load symptoms ───
async function loadSymptoms() {
  listEl.innerHTML = '<p class="muted" id="list-status">Loading symptoms…</p>';
  try {
    const res = await fetch(`${getApi()}/symptoms`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    allSymptoms = data.symptoms;
    $("total-count").textContent = `${data.total} available`;
    renderList();
    hideError();
  } catch (err) {
    listEl.innerHTML = '<p class="muted">Couldn\'t load symptoms.</p>';
    showError(`Can't reach the API at ${getApi()}. Start the server with "uvicorn app:app --reload" and check the address below.`);
  }
}

// ─── Render ───
function renderList() {
  const q = searchEl.value.trim().toLowerCase();
  const matches = allSymptoms.filter((s) => pretty(s).toLowerCase().includes(q));

  listEl.innerHTML = "";
  if (!matches.length) {
    listEl.innerHTML = '<p class="muted">No symptoms match your search.</p>';
    return;
  }
  const frag = document.createDocumentFragment();
  matches.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = pretty(s);
    b.setAttribute("aria-pressed", selected.has(s));
    b.addEventListener("click", () => toggle(s));
    frag.appendChild(b);
  });
  listEl.appendChild(frag);
}

function renderSelected() {
  selectedEl.innerHTML = "";
  if (!selected.size) {
    selectedEl.innerHTML = '<p class="muted">Nothing selected yet. Tap symptoms on the left to add them.</p>';
  } else {
    selected.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = pretty(s);
      b.title = "Remove";
      b.addEventListener("click", () => toggle(s));
      selectedEl.appendChild(b);
    });
  }
  $("sel-count").textContent = selected.size;
  predictBtn.disabled = selected.size === 0;
  clearBtn.hidden = selected.size === 0;
}

function toggle(s) {
  selected.has(s) ? selected.delete(s) : selected.add(s);
  // update the pressed state without rebuilding the list (keeps scroll position)
  [...listEl.querySelectorAll(".chip")].forEach((el) => {
    const raw = allSymptoms.find((x) => pretty(x) === el.textContent);
    if (raw) el.setAttribute("aria-pressed", selected.has(raw));
  });
  renderSelected();
  resultEl.hidden = true;
  hideError();
}

// ─── Predict ───
async function predict() {
  hideError();
  predictBtn.disabled = true;
  predictBtn.textContent = "Checking…";
  try {
    const res = await fetch(`${getApi()}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: [...selected] }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = typeof data.detail === "string" ? data.detail : "The server couldn't process this request.";
      throw new Error(detail);
    }
    showResult(data);
  } catch (err) {
    showError(err.message.includes("Failed to fetch")
      ? `Can't reach the API at ${getApi()}. Check that the server is running.`
      : err.message);
  } finally {
    predictBtn.textContent = "Check symptoms";
    predictBtn.disabled = selected.size === 0;
  }
}

function showResult({ predicted_disease, confidence, symptoms_count }) {
  $("disease").textContent = predicted_disease;
  $("res-count").textContent = symptoms_count;
  const pct = Math.round(confidence * 1000) / 10;
  $("conf").textContent = `${pct}%`;

  resultEl.hidden = false;
  resultEl.classList.remove("show");
  void resultEl.offsetWidth; // restart animation
  resultEl.classList.add("show");

  // animate the gauge from empty to the confidence value
  const fill = $("g-fill");
  fill.style.transition = "none";
  fill.style.strokeDashoffset = 100;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.transition = "";
    fill.style.strokeDashoffset = 100 - confidence * 100;
  }));

  resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ─── Helpers ───
function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
function hideError() { errorEl.hidden = true; }

// ─── Events ───
searchEl.addEventListener("input", renderList);
predictBtn.addEventListener("click", predict);
clearBtn.addEventListener("click", () => { selected.clear(); renderList(); renderSelected(); resultEl.hidden = true; });
$("reload").addEventListener("click", loadSymptoms);
apiInput.addEventListener("keydown", (e) => { if (e.key === "Enter") loadSymptoms(); });

// ─── Init ───
renderSelected();
loadSymptoms();
