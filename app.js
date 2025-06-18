// Catégories de colonnes
const categories = {
  todo:      { title: "À faire",    color: "var(--todo)",    icon: "📝" },
  review:    { title: "À corriger", color: "var(--review)",  icon: "📑" },
  buy:       { title: "À acheter",  color: "var(--buy)",     icon: "🛒" },
  meet:      { title: "Réunions",   color: "var(--meet)",    icon: "📅" },
  plan:      { title: "À planifier",color: "var(--plan)",    icon: "📌" },
  question:  { title: "Questions",  color: "var(--question)",icon: "❓" }
};

// --- State ---
let tasks = JSON.parse(localStorage.getItem("profTasks") || "[]");
let editing = null, editingIndex = null, deleting = null;

// --- Elements ---
const board = document.getElementById("board");
const dialog = document.getElementById("task-dialog");
const form = document.getElementById("task-form");
const addBtn = document.getElementById("add-btn");
const cancelBtn = document.getElementById("cancel");
const modalTitle = document.getElementById("modal-title");
const searchInput = document.getElementById("search");
const filters = document.getElementById("filters");
const printBtn = document.getElementById("print-btn");

const confirmDialog = document.getElementById("confirm-dialog");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");

let currentFilter = "all";
let searchTerm = "";

// --- RENDER ---
function render() {
  board.innerHTML = "";
  // Pour chaque catégorie, générer la colonne
  Object.entries(categories).forEach(([cat, meta]) => {
    const column = document.createElement("div");
    column.className = "column";
    column.style.background = meta.color + "14";
    column.dataset.category = cat;
    // Header colonne + compteur
    const colHeader = document.createElement("header");
    colHeader.innerHTML = `${meta.icon} ${meta.title} <span class="count"></span>`;
    column.appendChild(colHeader);

    const list = document.createElement("div");
    list.className = "task-list";
    // Filtrage
    const catTasks = tasks
      .map((t,i) => ({...t, _idx: i}))
      .filter(t =>
        t.category === cat &&
        (currentFilter === "all" || t.priority === currentFilter) &&
        (searchTerm === "" ||
          t.title.toLowerCase().includes(searchTerm) ||
          (t.desc && t.desc.toLowerCase().includes(searchTerm))
        )
      );
    colHeader.querySelector(".count").textContent = catTasks.length ? catTasks.length : "";

    catTasks.forEach(task => {
      list.appendChild(taskElement(task, cat, task._idx));
    });

    // Drag & drop : sur colonne
    list.ondragover = e => { e.preventDefault(); list.classList.add("drop"); }
    list.ondragleave = e => list.classList.remove("drop");
    list.ondrop = e => {
      list.classList.remove("drop");
      const from = e.dataTransfer.getData("from");
      const idx = +e.dataTransfer.getData("idx");
      if (from !== cat) {
        // Changer la catégorie !
        tasks[idx].category = cat;
        save();
      }
    };

    column.appendChild(list);
    board.appendChild(column);
  });
}
function taskElement(task, cat, idx) {
  const div = document.createElement("div");
  div.className = "task";
  div.setAttribute("draggable", "true");
  div.dataset.priority = task.priority;
  div.innerHTML = `
    <span class="task-title">${escapeHtml(task.title)}</span>
    ${task.desc ? `<span class="desc">${escapeHtml(task.desc)}</span>` : ""}
    <span class="infos">
      <span>
        <span class="badge" style="background:${priorityBg(task.priority)}">${priorityLabel(task.priority)}</span>
        ${task.due ? `<span class="date">⏳ ${formatDate(task.due)}</span>` : ""}
      </span>
      <span class="actions">
        <button title="Modifier" onclick="editTask(${idx})">✏️</button>
        <button title="Supprimer" onclick="deleteTask(${idx})">🗑️</button>
      </span>
    </span>
  `;
  // Drag
  div.ondragstart = e => {
    div.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("from", cat);
    e.dataTransfer.setData("idx", idx);
  };
  div.ondragend = e => div.classList.remove("dragging");
  return div;
}

// --- Helpers
function escapeHtml(str) { return (str||"").replace(/[<>"&]/g, m => ({'<':'&lt;','>':'&gt;','"':'&quot;','&':'&amp;'})[m]); }
function priorityLabel(p) { return p==="high"?"⚡ Haute":p==="low"?"Basse":"Moyenne"; }
function priorityBg(p) { return p==="high"?"var(--high)":p==="low"?"var(--low)":"var(--medium)"; }
function formatDate(d) {
  try { return new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short" }); }
  catch { return d; }
}

// --- Add/Modif Task ---
window.editTask = function(idx) {
  const t = tasks[idx];
  editing = t;
  editingIndex = idx;
  modalTitle.textContent = "Modifier la tâche";
  form.title.value = t.title;
  form.category.value = t.category;
  form.priority.value = t.priority;
  form.due.value = t.due || "";
  form.desc.value = t.desc || "";
  form.editIndex.value = idx;
  dialog.showModal();
};
window.deleteTask = function(idx) {
  deleting = idx;
  confirmDialog.showModal();
};
confirmYes.onclick = () => {
  if (deleting !== null) {
    tasks.splice(deleting, 1);
    save();
    deleting = null;
    confirmDialog.close();
  }
};
confirmNo.onclick = () => { deleting = null; confirmDialog.close(); };

// --- New task
addBtn.onclick = () => {
  editing = null; editingIndex = null;
  modalTitle.textContent = "Nouvelle tâche";
  form.reset();
  form.editIndex.value = "";
  dialog.showModal();
};
cancelBtn.onclick = () => dialog.close();

// --- Soumission
form.onsubmit = e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  let t = {
    title: data.title.trim(),
    category: data.category,
    priority: data.priority,
    due: data.due,
    desc: data.desc.trim()
  };
  if (data.editIndex !== "") {
    tasks[+data.editIndex] = t;
  } else {
    tasks.push(t);
  }
  save();
  dialog.close();
};

// --- Filtres et recherche
filters.onclick = e => {
  if (e.target.tagName !== "BUTTON") return;
  document.querySelectorAll("#filters button").forEach(btn => btn.classList.remove("active"));
  e.target.classList.add("active");
  currentFilter = e.target.dataset.filter;
  render();
};
searchInput.oninput = () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  render();
};

// --- Impression
printBtn.onclick = () => window.print();

// --- Sauvegarde/persist
function save() {
  localStorage.setItem("profTasks", JSON.stringify(tasks));
  render();
}
render();
