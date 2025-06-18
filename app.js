// Couleurs pastels proposées (hex ou var CSS)
const pastelColors = [
  "var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)",
  "var(--c6)", "var(--c7)", "var(--c8)", "var(--c9)"
];

// Catégories (ajout “Archives”)
const categories = {
  todo:         { title: "À faire",          icon: "📝",    defaultColor: "var(--c1)" },
  review:       { title: "À corriger",       icon: "📑",    defaultColor: "var(--c2)" },
  buy:          { title: "À acheter",        icon: "🛒",    defaultColor: "var(--c3)" },
  print:        { title: "À imprimer",       icon: "🖨️",   defaultColor: "var(--c4)" },
  laminate:     { title: "À plastifier",     icon: "🪟",    defaultColor: "var(--c5)" },
  meet:         { title: "Réunions",         icon: "📅",    defaultColor: "var(--c6)" },
  plan:         { title: "À planifier",      icon: "📌",    defaultColor: "var(--c7)" },
  question:     { title: "Questions",        icon: "❓",    defaultColor: "var(--c8)" },
  observations: { title: "Observations élèves", icon: "👀", defaultColor: "var(--c9)" },
  archived:     { title: "Archives",         icon: "📦",    defaultColor: "var(--archive)" }
};

// --- Mantras adaptés (nouveaux) ---
const mantras = [
  "🌈 Chaque jour, tu plantes des graines d'avenir dans le cœur de tes élèves.",
  "💡 Une pause, un sourire, et tu repars avec toute ta bienveillance.",
  "🌻 Ce que tu fais est essentiel, même quand tu ne t'en rends pas compte.",
  "🪶 Allège-toi, fais au mieux et lâche prise pour le reste.",
  "✨ Le courage d'enseigner est déjà une victoire.",
  "☀️ Les petites attentions font les grands souvenirs.",
  "🚀 Tu avances, parfois doucement, mais toujours vers plus de sens.",
  "🌸 N'oublie pas : tu as le droit d'être imparfait(e).",
  "🫶 Un élève que tu as encouragé s'en souviendra toute sa vie.",
  "🥇 Tu n'es pas seul(e), toute la communauté éducative avance avec toi."
];

// --- State ---
let tasks = JSON.parse(localStorage.getItem("profTasks") || "[]");
let editing = null, editingIndex = null, deleting = null;
let columnColors = JSON.parse(localStorage.getItem("colColors") || "{}");

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

// -- Color picker
const colorDialog = document.getElementById("color-dialog");
const colorOptions = document.getElementById("color-options");
const closeColor = document.getElementById("close-color");
let currentColKey = null;

// -- Mantra popup revisité
function showMantra() {
  const pop = document.getElementById("mantra-popup");
  const text = document.getElementById("mantra-text");
  const i = Math.floor(Math.random() * mantras.length);
  text.innerHTML = mantras[i];
  pop.classList.remove("hidden");
  pop.classList.add("show");
}
document.getElementById("close-mantra").onclick = () => {
  const pop = document.getElementById("mantra-popup");
  pop.classList.remove("show");
  setTimeout(() => pop.classList.add("hidden"), 450);
};
window.addEventListener("DOMContentLoaded", showMantra);

let currentFilter = "all";
let searchTerm = "";

// --- RENDER ---
function render() {
  board.innerHTML = "";
  Object.entries(categories).forEach(([cat, meta], colIdx) => {
    if (cat === "archived" && currentFilter !== "archived") return; // n'afficher archives que si filtré ou tâche archivées
    if (cat !== "archived" && currentFilter === "archived") return;
    const column = document.createElement("div");
    column.className = "column" + (cat === "archived" ? " archives-col" : "");
    const color = columnColors[cat] || meta.defaultColor;
    column.style.background = color + "1a";
    column.dataset.category = cat;
    // Header colonne + compteur + bouton palette
    const colHeader = document.createElement("header");
    colHeader.innerHTML = `
      <span>${meta.icon} ${meta.title} <span class="count"></span></span>
      <button class="color-btn" title="Choisir la couleur de la colonne" data-cat="${cat}">🎨</button>
    `;
    column.appendChild(colHeader);

    const list = document.createElement("div");
    list.className = "task-list";
    // Filtrage
    const catTasks = tasks
      .map((t,i) => ({...t, _idx: i}))
      .filter(t =>
        (cat === "archived" ? !!t.archived : t.category === cat && !t.archived) &&
        (currentFilter === "all" || t.priority === currentFilter || (currentFilter==="archived" && t.archived)) &&
        (searchTerm === "" ||
          t.title.toLowerCase().includes(searchTerm) ||
          (t.desc && t.desc.toLowerCase().includes(searchTerm))
        )
      );
    colHeader.querySelector(".count").textContent = catTasks.length ? catTasks.length : "";

    catTasks.forEach(task => {
      list.appendChild(taskElement(task, cat, task._idx));
    });

    // Drag & drop : sur colonne (sauf archives)
    if (cat !== "archived") {
      list.ondragover = e => { e.preventDefault(); list.classList.add("drop"); }
      list.ondragleave = e => list.classList.remove("drop");
      list.ondrop = e => {
        list.classList.remove("drop");
        const from = e.dataTransfer.getData("from");
        const idx = +e.dataTransfer.getData("idx");
        if (from !== cat && !tasks[idx].archived) {
          tasks[idx].category = cat;
          save();
        }
      };
    }
    column.appendChild(list);
    board.appendChild(column);
  });

  // Attache event palette à chaque colonne
  document.querySelectorAll(".color-btn").forEach(btn => {
    btn.onclick = (e) => {
      currentColKey = btn.dataset.cat;
      openColorDialog(currentColKey);
    };
  });
}

function taskElement(task, cat, idx) {
  const div = document.createElement("div");
  div.className = "task" + (task.archived ? " archived" : "");
  div.setAttribute("draggable", !task.archived);
  div.dataset.priority = task.priority;
  // Liens rapides (avec icône)
  let quickLink = "";
  if (task.link && task.link.trim()) {
    const url = task.link.trim();
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
      quickLink = `<a href="${url}" class="quick-link" target="_blank" title="Image" rel="noopener">
        <img src="${url}" alt="aperçu image" />
      </a>`;
    } else if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url)) {
      quickLink = `<a href="${url}" class="quick-link file" target="_blank" title="Fichier" rel="noopener">📄</a>`;
    } else {
      quickLink = `<a href="${url}" class="quick-link" target="_blank" title="Lien externe" rel="noopener">🔗</a>`;
    }
  }
  div.innerHTML = `
    <span class="task-title">${escapeHtml(task.title)}</span>
    ${task.desc ? `<span class="desc">${escapeHtml(task.desc)}</span>` : ""}
    <span class="infos">
      <span>
        <span class="badge" style="background:${priorityBg(task.priority)}">${priorityLabel(task.priority)}</span>
        ${task.due ? `<span class="date">⏳ ${formatDate(task.due)}</span>` : ""}
        ${quickLink}
      </span>
      <span class="actions">
        ${!task.archived ? `<button title="Modifier" onclick="editTask(${idx})">✏️</button>` : ""}
        ${!task.archived ? `<button title="Archiver" onclick="archiveTask(${idx})">📦</button>` : ""}
        <button title="Supprimer" onclick="deleteTask(${idx})">🗑️</button>
      </span>
    </span>
  `;
  // Drag
  if (!task.archived) {
    div.ondragstart = e => {
      div.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("from", cat);
      e.dataTransfer.setData("idx", idx);
    };
    div.ondragend = e => div.classList.remove("dragging");
  }
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
  form.link.value = t.link || "";
  form.editIndex.value = idx;
  dialog.showModal();
};
window.deleteTask = function(idx) {
  deleting = idx;
  confirmDialog.showModal();
};
window.archiveTask = function(idx) {
  tasks[idx].archived = true;
  save();
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
    desc: data.desc.trim(),
    link: data.link ? data.link.trim() : "",
    archived: false
  };
  if (data.editIndex !== "") {
    const prev = tasks[+data.editIndex];
    t.archived = prev.archived || false;
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
  localStorage.setItem("colColors", JSON.stringify(columnColors));
  render();
}
render();

// -- Couleurs de colonnes personnalisables
function openColorDialog(colKey) {
  colorDialog.showModal();
  colorOptions.innerHTML = "";
  pastelColors.forEach(col => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-swatch" + ((columnColors[colKey]||categories[colKey].defaultColor) === col ? " selected" : "");
    btn.style.background = col;
    btn.onclick = () => {
      columnColors[colKey] = col;
      save();
      colorDialog.close();
    };
    colorOptions.appendChild(btn);
  });
}
closeColor.onclick = () => colorDialog.close();
