const STORAGE_KEY = "forge.planner.todo.v1";
const rootTabs = document.querySelector("#boardTabs");
const rootMeta = document.querySelector("#boardMeta");
const rootGrid = document.querySelector("#boardGrid");
const newBoardName = document.querySelector("#newBoardName");
const taskTitle = document.querySelector("#taskTitle");
const taskDue = document.querySelector("#taskDue");
const taskNotes = document.querySelector("#taskNotes");

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
    activeBoardId: "school",
    boards: [
      { id: "school", name: "School", tasks: [] },
      { id: "work", name: "Work", tasks: [] },
    ],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    const state = createDefaultState();
    state.activeBoardId = parsed.activeBoardId || state.activeBoardId;
    if (Array.isArray(parsed.boards) && parsed.boards.length) {
      state.boards = parsed.boards.map((board) => ({
        id: board.id || crypto.randomUUID(),
        name: String(board.name || "Board").trim() || "Board",
        tasks: Array.isArray(board.tasks)
          ? board.tasks.map((task) => ({
              id: task.id || crypto.randomUUID(),
              title: String(task.title || "").trim(),
              dueDate: String(task.dueDate || ""),
              notes: String(task.notes || ""),
              lane: ["todo", "progress", "done"].includes(task.lane) ? task.lane : "todo",
            })).filter((task) => task.title)
          : [],
      }));
    }
    if (!state.boards.some((board) => board.id === state.activeBoardId)) {
      state.activeBoardId = state.boards[0]?.id || "school";
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

function activeBoard() {
  return state.boards.find((board) => board.id === state.activeBoardId) || state.boards[0];
}

function fmtDate(value) {
  if (!value) return "No due date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function addBoard(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const board = { id: crypto.randomUUID(), name: trimmed, tasks: [] };
  state.boards.push(board);
  state.activeBoardId = board.id;
  persist();
  render();
}

function addTask() {
  const title = taskTitle.value.trim();
  if (!title) return;
  activeBoard().tasks.push({
    id: crypto.randomUUID(),
    title,
    dueDate: taskDue.value,
    notes: taskNotes.value.trim(),
    lane: "todo",
  });
  taskTitle.value = "";
  taskDue.value = "";
  taskNotes.value = "";
  persist();
  render();
}

function moveTask(taskId, direction) {
  const lanes = ["todo", "progress", "done"];
  const board = activeBoard();
  const task = board.tasks.find((entry) => entry.id === taskId);
  if (!task) return;
  const currentIndex = lanes.indexOf(task.lane);
  const nextIndex = Math.max(0, Math.min(lanes.length - 1, currentIndex + direction));
  task.lane = lanes[nextIndex];
  persist();
  render();
}

function removeTask(taskId) {
  const board = activeBoard();
  board.tasks = board.tasks.filter((task) => task.id !== taskId);
  persist();
  render();
}

function selectBoard(boardId) {
  state.activeBoardId = boardId;
  persist();
  render();
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}

function render() {
  const board = activeBoard();
  rootTabs.innerHTML = state.boards
    .map(
      (entry) => `
        <button class="tabButton ${entry.id === state.activeBoardId ? "isActive" : ""}" data-board="${entry.id}" type="button">
          ${escapeHtml(entry.name)}
        </button>
      `,
    )
    .join("");

  const totals = {
    todo: sortTasks(board.tasks.filter((task) => task.lane === "todo")).length,
    progress: sortTasks(board.tasks.filter((task) => task.lane === "progress")).length,
    done: sortTasks(board.tasks.filter((task) => task.lane === "done")).length,
  };

  rootMeta.textContent = `${board.name} · ${board.tasks.length} tasks total`;
  rootGrid.innerHTML = ["todo", "progress", "done"]
    .map((lane) => {
      const laneTitle = lane === "todo" ? "To do" : lane === "progress" ? "In progress" : "Done";
      const laneTasks = sortTasks(board.tasks.filter((task) => task.lane === lane));
      return `
        <section class="lane">
          <div class="laneHeader">
            <h2>${laneTitle}</h2>
            <span class="laneCount">${totals[lane]}</span>
          </div>
          <div class="taskStack">
            ${
              laneTasks.length
                ? laneTasks
                    .map(
                      (task) => `
                        <article class="taskCard">
                          <div class="taskTitleRow">
                            <strong>${escapeHtml(task.title)}</strong>
                            <span class="taskDue">${fmtDate(task.dueDate)}</span>
                          </div>
                          <div class="taskNotes">Notes · hover to view</div>
                          <div class="notesTooltip">${escapeHtml(task.notes || "No extra notes added.")}</div>
                          <div class="taskActions">
                            <div class="moveGroup">
                              <button class="taskMove" data-move="${task.id}" data-dir="-1" type="button" ${lane === "todo" ? "disabled" : ""}>←</button>
                              <button class="taskMove" data-move="${task.id}" data-dir="1" type="button" ${lane === "done" ? "disabled" : ""}>→</button>
                            </div>
                            <button class="taskDelete" data-delete="${task.id}" type="button">✕</button>
                          </div>
                        </article>
                      `,
                    )
                    .join("")
                : `<div class="emptyLane">No tasks here yet.</div>`
            }
          </div>
        </section>
      `;
    })
    .join("");
}

rootTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-board]");
  if (!button) return;
  selectBoard(button.dataset.board);
});

document.querySelector("#addBoard").addEventListener("click", () => {
  addBoard(newBoardName.value);
  newBoardName.value = "";
  newBoardName.focus();
});

newBoardName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    document.querySelector("#addBoard").click();
  }
});

document.querySelector("#addTask").addEventListener("click", addTask);

taskTitle.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addTask();
  }
});

rootGrid.addEventListener("click", (event) => {
  const moveButton = event.target.closest("[data-move]");
  if (moveButton) {
    moveTask(moveButton.dataset.move, Number(moveButton.dataset.dir));
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (!deleteButton) return;
  removeTask(deleteButton.dataset.delete);
});

render();
