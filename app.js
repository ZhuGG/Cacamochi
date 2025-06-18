// Pastel palette
const pastelColors = [
  "var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)",
  "var(--c6)", "var(--c7)", "var(--c8)", "var(--c9)"
];

// Catégories (avec archives)
const categories = {
  todo:         { title: "À faire",          icon: "📝", defaultColor: "var(--c1)" },
  review:       { title: "À corriger",       icon: "📑", defaultColor: "var(--c2)" },
  buy:          { title: "À acheter",        icon: "🛒", defaultColor: "var(--c3)" },
  print:        { title: "À imprimer",       icon: "🖨️", defaultColor: "var(--c4)" },
  laminate:     { title: "À plastifier",     icon: "🪟", defaultColor: "var(--c5)" },
  meet:         { title: "Réunions",         icon: "📅", defaultColor: "var(--c6)" },
  plan:         { title: "À planifier",      icon: "📌", defaultColor: "var(--c7)" },
  question:     { title: "Questions",        icon: "❓", defaultColor: "var(--c8)" },
  observations: { title: "Observations élèves", icon: "👀", defaultColor: "var(--c9)" },
  archived:     { title: "Archives",         icon: "📦", defaultColor: "var(--archive)" }
};

// Citations/Mantras courts et sobres
const mantras = [
  "🌱 Chaque jour compte. Même les petits progrès.",
  "✨ Tu fais la différence. Continue.",
  "📚 La patience et l'écoute sont tes super-pouvoirs.",
  "🌈 Une chose à la fois, ça suffit.",
  "🦋 Tout effort laisse une trace.",
  "💡 N'oublie pas de souffler et de sourire.",
  "🚀 Courage, tu vas y arriver.",
  "☀️ La bienveillance commence avec soi-même.",
  "👀 Observe, adapte, avance.",
  "🌟 Merci d'être là pour eux !"
];

// --- State ---
let tasks = JSON.parse(localStorage.getItem("profTasks") || "[]");
let editing = null, editingIndex = null, deleting = null;
let columnColors = JSON.parse(localStorage.getItem("colColors") || "{}");
let currentFilter = "all";
let searchTerm = "";

// Elements
const board = document.getElementById("board");
const dialog = document.getElementById("task-dialog");
const form = document.getElementById("task-form");
const addBtn = document.getElementById("add-btn");
const cancelBtn = document.getElementById("cancel");
const modalTitle = document.getElementById("modal-title");
const searchInput = document.getElementById("search");
const filters = document.getElementById("filters");
const printBtn = document.getElementById("print-btn");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importLabel = document.getElementById("import-label");
const appFooter = document.getElementById("app-footer");

const confirmDialog = document.getElementById("confirm-dialog");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");

// -- Color picker
const colorDialog = document.getElementById("color-dialog");
const colorOptions = document.getElementById("color-options");
const closeColor = document.getElementById("close-color");
let currentColKey = null;

// -- Mantra bar discret
document.getElementById("mantra-bar").textContent =
  mantras[Math.floor(Math.random()*mantras.length)];

// --- RENDER ---
function render() {
  board.innerHTML = "";
  Object.entries(categories).forEach(([cat, meta]) => {
    if (cat === "archived" && currentFilter !== "archived") return;
    if (cat !== "archived" && currentFilter === "archived") return;
    const column = document.createElement("div");
    column.className = "column" + (cat === "archived" ? " archives-col" : "");
    const color = columnColors[cat] || meta.defaultColor;
    column.style.background = color + "1a";
    column.style.borderColor = color;
    // Header colonne + compteur + bouton palette
    const colHeader = document.createElement("header");
    colHeader.style.background = color + "30";
    colHeader.innerHTML = `
      <span>${meta.icon} ${meta.title} <span class="count"></span></span>
      <button class="color-btn" title="Couleur de la colonne" data-cat="${cat}">🎨</button>
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

  // Sous-tâches (checklist)
  let subtasksHtml = "";
  if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length) {
    subtasksHtml = `<div class="subtasks">` + 
      task.subtasks.map((st,i) => `
        <label><input type="checkbox" disabled ${st.done?"checked":""}>${escapeHtml(st.text)}</label>
      `).join("") + `</div>`;
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
    ${subtasksHtml}
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

  // Sous-tâches
  let subtasks = Array.isArray(t.subtasks) ? t.subtasks.map(s => ({...s})) : [];
  showSubtasks(subtasks);

  form.editIndex.value = idx;

  // Gestion dynamique sous-tâches
  document.getElementById("add-subtask").onclick = () => {
    const input = document.getElementById("subtask-input");
    let val = input.value.trim();
    if (val) {
      subtasks.push({text: val, done: false});
      showSubtasks(subtasks);
      input.value = "";
      input.focus();
    }
  };
  document.getElementById("subtask-input").onkeydown = e => {
    if (e.key==="Enter") {
      e.preventDefault();
      document.getElementById("add-subtask").click();
    }
  };

  // Sous-tâches remove/check
  document.getElementById("subtasks-list").onclick = e => {
    if (e.target.classList.contains("remove-subtask")) {
      const idx = +e.target.dataset.idx;
      subtasks.splice(idx,1);
      showSubtasks(subtasks);
    } else if (e.target.type==="checkbox") {
      const idx = +e.target.dataset.idx;
      subtasks[idx].done = e.target.checked;
      showSubtasks(subtasks);
    }
  };

  function showSubtasks(sts) {
    const list = document.getElementById("subtasks-list");
    list.innerHTML = "";
    sts.forEach((st,i) => {
      const chip = document.createElement("span");
      chip.className = "subtask-chip" + (st.done ? " done" : "");
      chip.innerHTML = `
        <label><input type="checkbox" ${st.done?"checked":""} data-idx="${i}">${escapeHtml(st.text)}</label>
        <button class="remove-subtask" type="button" data-idx="${i}" title="Retirer">×</button>
      `;
      list.appendChild(chip);
    });
  }

  dialog.showModal();

  // À la soumission, on collecte la version finale
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
      subtasks: subtasks,
      archived: editing && editing.archived || false
    };
    if (data.editIndex !== "") {
      tasks[+data.editIndex] = t;
    } else {
      tasks.push(t);
    }
    save();
    dialog.close();
  };
};
window.deleteTask = function(idx) {
  deleting = idx;
  confirmDialog.showModal();
};
window.archiveTask = function(idx) {
  tasks[idx].archived = true;
  save();
};
addBtn.onclick = () => {
  editing = null; editingIndex = null;
  modalTitle.textContent = "Nouvelle tâche";
  form.reset();
  let subtasks = [];
  showSubtasks(subtasks);
  form.editIndex.value = "";
  document.getElementById("add-subtask").onclick = () => {
    const input = document.getElementById("subtask-input");
    let val = input.value.trim();
    if (val) {
      subtasks.push({text: val, done: false});
      showSubtasks(subtasks);
      input.value = "";
      input.focus();
    }
  };
  document.getElementById("subtask-input").onkeydown = e => {
    if (e.key==="Enter") {
      e.preventDefault();
      document.getElementById("add-subtask").click();
    }
  };
  document.getElementById("subtasks-list").onclick = e => {
    if (e.target.classList.contains("remove-subtask")) {
      const idx = +e.target.dataset.idx;
      subtasks.splice(idx,1);
      showSubtasks(subtasks);
    } else if (e.target.type==="checkbox") {
      const idx = +e.target.dataset.idx;
      subtasks[idx].done = e.target.checked;
      showSubtasks(subtasks);
    }
  };
  function showSubtasks(sts) {
    const list = document.getElementById("subtasks-list");
    list.innerHTML = "";
    sts.forEach((st,i) => {
      const chip = document.createElement("span");
      chip.className = "subtask-chip" + (st.done ? " done" : "");
      chip.innerHTML = `
        <label><input type="checkbox" ${st.done?"checked":""} data-idx="${i}">${escapeHtml(st.text)}</label>
        <button class="remove-subtask" type="button" data-idx="${i}" title="Retirer">×</button>
      `;
      list.appendChild(chip);
    });
  }
  dialog.showModal();
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
      subtasks: subtasks,
      archived: false
    };
    tasks.push(t);
    save();
    dialog.close();
  };
};
cancelBtn.onclick = () => dialog.close();

confirmYes.onclick = () => {
  if (deleting !== null) {
    tasks.splice(deleting, 1);
    save();
    deleting = null;
    confirmDialog.close();
  }
};
confirmNo.onclick = () => { deleting = null; confirmDialog.close(); };

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

// Impression
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

// Sauvegarde JSON
exportBtn.onclick = () => {
  const blob = new Blob([JSON.stringify({tasks, columnColors})], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "dashboard_professeur.json";
  a.click();
  URL.revokeObjectURL(url);
};
// Restauration JSON
importBtn.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const obj = JSON.parse(e.target.result);
      if (Array.isArray(obj.tasks)) tasks = obj.tasks;
      if (obj.columnColors) columnColors = obj.columnColors;
      save();
      alert("Données importées !");
    } catch {
      alert("Erreur : Fichier invalide !");
    }
  };
  reader.readAsText(file);
};

appFooter.innerHTML = "© " + (new Date).getFullYear() + " – Dashboard compact et bienveillant ✨";

