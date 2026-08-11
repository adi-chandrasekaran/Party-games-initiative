const STORAGE_KEY = "forge.planner.assignments.v1";
const rootTabs = document.querySelector("#sheetTabs");
const rootMeta = document.querySelector("#sheetMeta");
const rootGrid = document.querySelector("#sheetGrid");
const newSheetName = document.querySelector("#newSheetName");
const subject = document.querySelector("#subject");
const assignment = document.querySelector("#assignment");
const dueDate = document.querySelector("#dueDate");
const notes = document.querySelector("#notes");
const teacher = document.querySelector("#teacher");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createDefaultState() {
  return {
    activeSheetId: "classwork",
    sheets: [{ id: "classwork", title: "Classwork", rows: [] }],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    const state = createDefaultState();
    state.activeSheetId = parsed.activeSheetId || state.activeSheetId;
    if (Array.isArray(parsed.sheets) && parsed.sheets.length) {
      state.sheets = parsed.sheets.map((sheet) => ({
        id: sheet.id || crypto.randomUUID(),
        title: String(sheet.title || "Tab").trim() || "Tab",
        rows: Array.isArray(sheet.rows)
          ? sheet.rows.map((row) => ({
              id: row.id || crypto.randomUUID(),
              subject: String(row.subject || "").trim(),
              assignment: String(row.assignment || "").trim(),
              dueDate: String(row.dueDate || ""),
              notes: String(row.notes || ""),
              teacher: String(row.teacher || "").trim(),
              done: Boolean(row.done),
            })).filter((row) => row.subject || row.assignment)
          : [],
      }));
    }
    if (!state.sheets.some((sheet) => sheet.id === state.activeSheetId)) {
      state.activeSheetId = state.sheets[0]?.id || "classwork";
    }
    return state;
  } catch {
    return createDefaultState();
  }
}

let state = loadState();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function activeSheet() {
  return state.sheets.find((sheet) => sheet.id === state.activeSheetId) || state.sheets[0];
}

function addSheet(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const sheet = { id: crypto.randomUUID(), title: trimmed, rows: [] };
  state.sheets.push(sheet);
  state.activeSheetId = sheet.id;
  persist();
  render();
}

function removeSheet(sheetId) {
  if (state.sheets.length === 1) return;
  state.sheets = state.sheets.filter((sheet) => sheet.id !== sheetId);
  if (!state.sheets.some((sheet) => sheet.id === state.activeSheetId)) {
    state.activeSheetId = state.sheets[0].id;
  }
  persist();
  render();
}

function addRow() {
  const subjectValue = subject.value.trim();
  const assignmentValue = assignment.value.trim();
  if (!subjectValue && !assignmentValue) return;
  activeSheet().rows.push({
    id: crypto.randomUUID(),
    subject: subjectValue,
    assignment: assignmentValue,
    dueDate: dueDate.value,
    notes: notes.value.trim(),
    teacher: teacher.value.trim(),
    done: false,
  });
  subject.value = "";
  assignment.value = "";
  dueDate.value = "";
  notes.value = "";
  teacher.value = "";
  persist();
  render();
}

function toggleDone(rowId) {
  const row = activeSheet().rows.find((item) => item.id === rowId);
  if (!row) return;
  row.done = !row.done;
  persist();
  render();
}

function deleteRow(rowId) {
  activeSheet().rows = activeSheet().rows.filter((row) => row.id !== rowId);
  persist();
  render();
}

function selectSheet(sheetId) {
  state.activeSheetId = sheetId;
  persist();
  render();
}

function formatDate(value) {
  if (!value) return "No due date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function sortedRows(rows) {
  return [...rows].sort((a, b) => {
    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}

function render() {
  const sheet = activeSheet();
  rootTabs.innerHTML = state.sheets
    .map(
      (entry) => `
        <button class="tabButton ${entry.id === state.activeSheetId ? "isActive" : ""}" data-sheet="${entry.id}" type="button">
          ${escapeHtml(entry.title)}
          ${state.sheets.length > 1 ? `<span data-remove="${entry.id}" class="closeMark" aria-hidden="true">×</span>` : ""}
        </button>
      `,
    )
    .join("");
  rootMeta.textContent = `${sheet.title} · ${sheet.rows.length} assignments`;

  const rows = sortedRows(sheet.rows);
  rootGrid.innerHTML = rows.length
    ? rows
        .map(
          (row) => `
            <tr class="${row.done ? "doneRow" : ""}">
              <td class="rowDone"><input type="checkbox" data-done="${row.id}" ${row.done ? "checked" : ""} /></td>
              <td class="rowTitle">${escapeHtml(row.subject || "—")}</td>
              <td>${escapeHtml(row.assignment || "—")}</td>
              <td>${formatDate(row.dueDate)}</td>
              <td class="notesCell" data-notes="${escapeHtml(row.notes || "No notes added.")}">${escapeHtml(row.notes || "—")}</td>
              <td class="rowMuted">${escapeHtml(row.teacher || "—")}</td>
              <td>
                <div class="rowActions">
                  <button class="rowToggle" data-toggle="${row.id}" type="button">${row.done ? "↺" : "✓"}</button>
                  <button class="rowDelete" data-delete="${row.id}" type="button">✕</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="7" class="rowMuted">No assignments in this tab yet.</td></tr>`;
}

rootTabs.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    event.stopPropagation();
    removeSheet(removeButton.dataset.remove);
    return;
  }

  const sheetButton = event.target.closest("[data-sheet]");
  if (!sheetButton) return;
  selectSheet(sheetButton.dataset.sheet);
});

document.querySelector("#addSheet").addEventListener("click", () => {
  addSheet(newSheetName.value);
  newSheetName.value = "";
  newSheetName.focus();
});

newSheetName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    document.querySelector("#addSheet").click();
  }
});

document.querySelector("#addRow").addEventListener("click", addRow);

[subject, assignment, dueDate, notes, teacher].forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addRow();
    }
  });
});

rootGrid.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("[data-toggle]");
  if (toggleButton) {
    toggleDone(toggleButton.dataset.toggle);
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (!deleteButton) return;
  deleteRow(deleteButton.dataset.delete);
});

rootGrid.addEventListener("change", (event) => {
  const doneInput = event.target.closest("[data-done]");
  if (!doneInput) return;
  toggleDone(doneInput.dataset.done);
});

render();
