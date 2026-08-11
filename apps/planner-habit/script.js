const STORAGE_KEY = "forge.planner.habit.v1";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthTabsEl = document.querySelector("#monthTabs");
const monthSummaryEl = document.querySelector("#monthSummary");
const habitTableEl = document.querySelector("#habitTable");
const now = new Date();
const year = now.getFullYear();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function monthDays(monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function createMonthState(monthIndex) {
  return {
    habits: [],
    monthIndex,
  };
}

function createDefaultState() {
  const months = {};
  MONTHS.forEach((_, index) => {
    months[String(index)] = createMonthState(index);
  });
  return {
    activeMonth: now.getMonth(),
    months,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return createDefaultState();
    const state = createDefaultState();
    state.activeMonth = Number.isInteger(parsed.activeMonth) ? parsed.activeMonth : now.getMonth();
    for (const [key, value] of Object.entries(parsed.months || {})) {
      const monthIndex = Number(key);
      if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) continue;
      const days = monthDays(monthIndex);
      state.months[String(monthIndex)] = {
        monthIndex,
        habits: Array.isArray(value?.habits)
          ? value.habits.map((habit) => ({
              id: habit.id || crypto.randomUUID(),
              name: String(habit.name || "").trim(),
              completed: Array.from({ length: days }, (_, dayIndex) => Boolean(habit.completed?.[dayIndex])),
            })).filter((habit) => habit.name)
          : [],
      };
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

function activeMonthState() {
  const key = String(state.activeMonth);
  if (!state.months[key]) {
    state.months[key] = createMonthState(state.activeMonth);
  }
  return state.months[key];
}

function addHabit(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const month = activeMonthState();
  const days = monthDays(state.activeMonth);
  month.habits.push({
    id: crypto.randomUUID(),
    name: trimmed,
    completed: Array.from({ length: days }, () => false),
  });
  persist();
  render();
}

function toggleHabit(habitId, dayIndex) {
  const month = activeMonthState();
  const habit = month.habits.find((entry) => entry.id === habitId);
  if (!habit) return;
  habit.completed[dayIndex] = !habit.completed[dayIndex];
  persist();
  render();
}

function removeHabit(habitId) {
  const month = activeMonthState();
  month.habits = month.habits.filter((habit) => habit.id !== habitId);
  persist();
  render();
}

function selectMonth(monthIndex) {
  state.activeMonth = monthIndex;
  persist();
  render();
}

function fmtSummary(month) {
  const total = month.habits.length;
  const days = monthDays(state.activeMonth);
  const checked = month.habits.reduce((sum, habit) => sum + habit.completed.slice(0, days).filter(Boolean).length, 0);
  return `${MONTHS[state.activeMonth]} ${year} · ${total} habits · ${checked} checks logged`;
}

function render() {
  const month = activeMonthState();
  const days = monthDays(state.activeMonth);
  const monthTabs = MONTHS.map((label, index) => `<button class="monthTab ${index === state.activeMonth ? "isActive" : ""}" data-month="${index}" type="button">${label}</button>`).join("");
  const summary = `<span class="summaryChip">${fmtSummary(month)}</span><span class="summaryChip">${days} days this month</span>`;

  const headerCells = [
    `<div class="habitHeaderCell">Habit</div>`,
    ...Array.from({ length: days }, (_, day) => `<div class="habitHeaderCell"><span class="dayLabel">${day + 1}</span></div>`),
  ].join("");

  const body = month.habits.length
    ? month.habits
        .map(
          (habit) => `
            <div class="habitRow">
              <div class="habitHeaderCell habitNameCell">
                <div>
                  <strong>${escapeHtml(habit.name)}</strong>
                  <small>${habit.completed.filter(Boolean).length}/${days} days complete</small>
                </div>
                <button class="iconButton" data-delete="${habit.id}" type="button" aria-label="Delete habit">×</button>
              </div>
              ${Array.from({ length: days }, (_, dayIndex) => `
                <div class="habitCell ${habit.completed[dayIndex] ? "isDone" : ""}">
                  <input
                    class="habitCheck"
                    data-toggle="${habit.id}"
                    data-day="${dayIndex}"
                    type="checkbox"
                    ${habit.completed[dayIndex] ? "checked" : ""}
                    aria-label="${escapeHtml(habit.name)} day ${dayIndex + 1}"
                  />
                </div>
              `).join("")}
            </div>
          `,
        )
        .join("")
    : `<div class="summaryRow"><span class="summaryChip muted">No habits in ${MONTHS[state.activeMonth]} yet. Add one to begin tracking.</span></div>`;

  monthTabsEl.innerHTML = monthTabs;
  monthSummaryEl.innerHTML = summary;
  habitTableEl.style.setProperty("--days", String(days));
  habitTableEl.innerHTML = `<div class="habitHeader">${headerCells}</div>${body}`;
}

document.querySelector("#monthTabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-month]");
  if (!button) return;
  selectMonth(Number(button.dataset.month));
});

document.querySelector("#addHabit").addEventListener("click", () => {
  const input = document.querySelector("#habitName");
  addHabit(input.value);
  input.value = "";
  input.focus();
});

document.querySelector("#habitName").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    document.querySelector("#addHabit").click();
  }
});

document.querySelector("#habitTable").addEventListener("change", (event) => {
  const toggle = event.target.closest("[data-toggle]");
  if (!toggle) return;
  toggleHabit(toggle.dataset.toggle, Number(toggle.dataset.day));
});

document.querySelector("#habitTable").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-delete]");
  if (!remove) return;
  removeHabit(remove.dataset.delete);
});

render();
